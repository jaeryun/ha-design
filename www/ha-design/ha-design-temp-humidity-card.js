import { patchCardDom } from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";
import {
  RANGE_IDS,
  STATISTICS_RANGES,
  buildStatisticsRequest,
  chartGeometry,
  comfortCopy,
  numericStateValue,
  parseStatisticsResponse,
  readout,
  sourceCopy,
  summarize,
} from "./ha-design-temp-humidity-history.js?v=temp-humidity-20261013-3";
import { tempHumidityCardStyles } from "./ha-design-temp-humidity-card.styles.js?v=temp-humidity-20261013-3";
import { renderTempHumidityCard } from "./ha-design-temp-humidity-card.template.js?v=temp-humidity-20261013-3";

const DEFAULT_TITLE = "온습도";
const DEFAULT_EYEBROW = "TEMPERATURE & HUMIDITY";

const CONFIG_LABELS = {
  temperature_entity: "온도 센서 엔티티",
  humidity_entity: "습도 센서 엔티티",
  battery_entity: "배터리 센서 엔티티",
  title: "카드 제목",
  eyebrow: "상단 영문 라벨",
};

const OPTIONAL_ENTITY_KEYS = ["humidity_entity", "battery_entity"];

const temperatureSensor = (hass, entityId) =>
  hass?.states?.[entityId]?.attributes?.device_class === "temperature";

const findTemperatureEntity = (hass, entities = [], entitiesFallback = []) => {
  const candidates = [...entities, ...entitiesFallback, ...Object.keys(hass?.states ?? {})];
  return (
    candidates.find((entityId) => temperatureSensor(hass, entityId)) ??
    candidates.find((entityId) => entityId?.startsWith("sensor.") && entityId.includes("temperature"))
  );
};

// 온도 센서와 짝을 이루는 습도 센서가 실제로 존재할 때만 함께 채운다.
const pairedHumidityEntity = (hass, temperatureEntity) => {
  if (typeof temperatureEntity !== "string" || !temperatureEntity.includes("temperature")) return undefined;
  const derived = temperatureEntity.replace("temperature", "humidity");
  return derived !== temperatureEntity && hass?.states?.[derived] ? derived : undefined;
};

let dialogSequence = 0;

// 여러 카드의 modal이 겹쳐 열려도 문서 스크롤 잠금이 정확히 한 번만 풀리도록 참조 계수한다.
let documentScrollLocks = 0;
let documentScrollOverflow = "";

const lockDocumentScroll = (doc) => {
  if (documentScrollLocks === 0) {
    documentScrollOverflow = doc.documentElement.style.overflow;
    doc.documentElement.style.overflow = "hidden";
  }
  documentScrollLocks += 1;
};

const unlockDocumentScroll = (doc) => {
  if (documentScrollLocks === 0) return;
  documentScrollLocks -= 1;
  if (documentScrollLocks === 0) doc.documentElement.style.overflow = documentScrollOverflow;
};

class HADesignTempHumidityCard extends HTMLElement {
  static getConfigForm() {
    return {
      schema: [
        {
          name: "temperature_entity",
          required: true,
          selector: { entity: { filter: { domain: "sensor", device_class: "temperature" } } },
        },
        { name: "humidity_entity", selector: { entity: { filter: { domain: "sensor", device_class: "humidity" } } } },
        { name: "battery_entity", selector: { entity: { filter: { domain: "sensor", device_class: "battery" } } } },
        { name: "title", selector: { text: {} } },
        { name: "eyebrow", selector: { text: {} } },
      ],
      computeLabel: (schema) => CONFIG_LABELS[schema.name],
      assertConfig: (config) => {
        for (const key of ["temperature_entity", ...OPTIONAL_ENTITY_KEYS]) {
          const entityId = config[key];
          if (entityId != null && !String(entityId).startsWith("sensor.")) {
            throw new Error("sensor 도메인 엔티티만 사용할 수 있습니다");
          }
        }
      },
    };
  }

  static getStubConfig(hass, entities = [], entitiesFallback = []) {
    const temperatureEntity = findTemperatureEntity(hass, entities, entitiesFallback);
    const humidityEntity = pairedHumidityEntity(hass, temperatureEntity);
    return humidityEntity
      ? { temperature_entity: temperatureEntity, humidity_entity: humidityEntity }
      : { temperature_entity: temperatureEntity };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._activeRange = RANGE_IDS[0];
    this._history = { range: null, status: "idle", points: {} };
    this._requestToken = 0;
    this._dialogOpen = false;
    this._scrollLocked = false;
    this._dialogId = `ha-design-temp-humidity-detail-${(dialogSequence += 1)}`;
  }

  setConfig(config) {
    const temperatureEntity = typeof config?.temperature_entity === "string" ? config.temperature_entity.trim() : "";
    if (!temperatureEntity) {
      throw new Error("온도 센서 엔티티(temperature_entity)가 필요합니다");
    }
    for (const entityId of [temperatureEntity, ...OPTIONAL_ENTITY_KEYS.map((key) => config[key]).filter(Boolean)]) {
      if (!entityId.startsWith("sensor.")) {
        throw new Error(`sensor 도메인 엔티티만 사용할 수 있습니다: ${entityId}`);
      }
    }
    this._config = { ...config, temperature_entity: temperatureEntity };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 4;
  }

  getGridOptions() {
    return { columns: 6, min_columns: 4, max_columns: 12 };
  }

  disconnectedCallback() {
    this._restoreDocumentScroll();
    this._resizeObserver?.disconnect();
  }

  _stateOf(entityId) {
    return typeof entityId === "string" ? this._hass?.states?.[entityId] : null;
  }

  _readings() {
    const temperature = numericStateValue(this._stateOf(this._config.temperature_entity));
    const humidity = numericStateValue(this._stateOf(this._config.humidity_entity));
    const battery = numericStateValue(this._stateOf(this._config.battery_entity));
    return {
      temperature: readout(temperature, { decimals: 1, unit: "°C" }),
      humidity: readout(humidity, { decimals: 0, unit: "%" }),
      battery: readout(battery, { decimals: 0, unit: "%" }),
    };
  }

  _chartModel(entityId, { label, unit, tone, missingMessage }) {
    const points = (entityId && this._history.points?.[entityId]) || [];
    const geometry = chartGeometry(points, {
      width: this._chartWidth,
      unit,
      range: this._activeRange,
    });
    const summary = summarize(points, unit);
    const message = !entityId
      ? missingMessage
      : this._history.status === "error"
        ? "기록을 불러오지 못했어요"
        : geometry.empty
          ? this._history.status === "loading"
            ? "기록을 불러오는 중이에요"
            : "기록이 아직 없어요"
          : null;
    return {
      label,
      unit,
      tone,
      summary,
      message,
      geometry,
      ariaLabel: `${label} 기록 차트. ${summary || message || ""}`.trim(),
    };
  }

  _model() {
    const title = this._config.title ?? DEFAULT_TITLE;
    const eyebrow = this._config.eyebrow ?? DEFAULT_EYEBROW;
    const readings = this._readings();
    const temperature = numericStateValue(this._stateOf(this._config.temperature_entity));
    const humidity = numericStateValue(this._stateOf(this._config.humidity_entity));

    return {
      title,
      eyebrow,
      expanded: this._dialogOpen,
      dialogId: this._dialogId,
      launcherLabel: `${title} 상세 보기`,
      badge: comfortCopy({ temperature, humidity }),
      readings,
      ranges: RANGE_IDS.map((id) => ({
        id,
        label: STATISTICS_RANGES[id].label,
        selected: id === this._activeRange,
      })),
      charts: {
        temperature: this._chartModel(this._config.temperature_entity, {
          label: "온도",
          unit: "°C",
          tone: "#8a641f",
          missingMessage: "온도 센서가 설정되지 않았어요",
        }),
        humidity: this._chartModel(this._config.humidity_entity, {
          label: "습도",
          unit: "%",
          tone: "#315f6f",
          missingMessage: "습도 센서가 설정되지 않았어요",
        }),
      },
      source: sourceCopy(this._activeRange),
    };
  }

  _render() {
    if (!this._config || !this._hass) return;

    patchCardDom(
      this.shadowRoot,
      `<style>${tempHumidityCardStyles}</style>${renderTempHumidityCard(this._model())}`,
      !this.shadowRoot.firstChild,
    );
    this._bindEvents();
    this._observeCharts();

    const dialog = this.shadowRoot.querySelector("dialog");
    if (this._dialogOpen && dialog && !dialog.open) dialog.showModal();
    if (this._dialogOpen && dialog && !dialog.contains(this.shadowRoot.activeElement)) {
      this.shadowRoot.querySelector('[data-action="close"]')?.focus();
    }
  }

  _bindEvents() {
    const launcher = this.shadowRoot.querySelector('[data-action="open"]');
    if (launcher) launcher.onclick = () => this._openDialog();

    const close = this.shadowRoot.querySelector('[data-action="close"]');
    if (close) close.onclick = () => this._closeDialog();

    const dialog = this.shadowRoot.querySelector("dialog");
    if (dialog) {
      dialog.onclick = (event) => {
        if (event.target === dialog) this._closeDialog();
      };
      dialog.oncancel = (event) => {
        event.preventDefault();
        this._closeDialog();
      };
      dialog.onkeydown = (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        this._closeDialog();
      };
      dialog.onclose = () => this._handleDialogClosed();
    }

    const tablist = this.shadowRoot.querySelector('[role="tablist"]');
    if (tablist) {
      tablist.onkeydown = (event) => {
        const tabs = [...tablist.querySelectorAll('[role="tab"]')];
        const current = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
        const moves = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity };
        if (!(event.key in moves)) return;
        event.preventDefault();
        const index =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : ((current < 0 ? 0 : current) + moves[event.key] + tabs.length) % tabs.length;
        this._selectRange(tabs[index].dataset.range);
        this.shadowRoot.querySelector(`[role="tab"][data-range="${tabs[index].dataset.range}"]`)?.focus();
      };
      tablist.onclick = (event) => {
        const tab = event.target.closest('[role="tab"]');
        if (!tab) return;
        this._selectRange(tab.dataset.range);
        tab.focus();
      };
    }
  }

  _openDialog() {
    if (this._dialogOpen) return;
    this._dialogOpen = true;
    this._lockDocumentScroll();
    const dialog = this.shadowRoot.querySelector("dialog");
    if (dialog && !dialog.open) dialog.showModal();
    this._refreshChartWidth();
    this._render();
    this.shadowRoot.querySelector('[data-action="close"]')?.focus();
    this._loadHistory(this._activeRange);
  }

  _closeDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog?.open) return;
    dialog.close();
    // native `close` 이벤트는 task로 큐잉되어 늦게 도착한다. 사용자 체감 초점 복귀와
    // 테스트 동기성이 모두 즉시 끝나도록 여기서 한 번 복원하고, 큐잉된 이벤트는
    // 멱등한 _handleDialogClosed()가 받아 무해하게 다시 통과한다.
    this._handleDialogClosed();
  }

  _handleDialogClosed() {
    this._dialogOpen = false;
    this._restoreDocumentScroll();
    const launcher = this.shadowRoot.querySelector('[data-action="open"]');
    launcher?.setAttribute("aria-expanded", "false");
    launcher?.focus();
  }

  _selectRange(range) {
    if (!STATISTICS_RANGES[range] || range === this._activeRange) return;
    this._activeRange = range;
    this._loadHistory(range);
  }

  async _loadHistory(range) {
    const preset = STATISTICS_RANGES[range];
    if (!preset) return;

    const statisticIds = [this._config.temperature_entity, this._config.humidity_entity].filter(
      (entityId) => typeof entityId === "string" && entityId.length > 0,
    );
    const previous = this._history;
    const token = this._requestToken + 1;
    this._requestToken = token;
    this._history = {
      range,
      status: "loading",
      points: previous.range === range ? previous.points : {},
    };
    this._render();

    // `hass`가 없으면 요청을 보내지 않는다.
    if (!this._hass?.callWS || statisticIds.length === 0) {
      this._history = { range, status: "idle", points: {} };
      this._render();
      return;
    }

    try {
      const response = await this._hass.callWS(buildStatisticsRequest({ range, statisticIds, now: new Date() }));
      if (token !== this._requestToken) return; // 늦게 도착한 이전 기간 응답은 버린다.
      this._history = { range, status: "ready", points: parseStatisticsResponse(response, preset.step) };
    } catch (error) {
      if (token !== this._requestToken) return;
      this._history = { range, status: "error", points: {} };
    }
    this._render();
  }

  _refreshChartWidth() {
    const svg = this.shadowRoot?.querySelector("[data-chart]");
    const width = Math.round(svg?.clientWidth ?? 0);
    if (width <= 0 || Math.abs(width - (this._chartWidth ?? 0)) < 1) return false;
    this._chartWidth = width;
    return true;
  }

  _observeCharts() {
    if (typeof ResizeObserver !== "function") return;
    const target = this.shadowRoot?.querySelector(".temp-dialog-body");
    if (!target) return;
    this._resizeObserver ??= new ResizeObserver(() => {
      if (this._refreshChartWidth()) this._render();
    });
    if (this._observedNode !== target) {
      this._resizeObserver.disconnect();
      this._resizeObserver.observe(target);
      this._observedNode = target;
    }
  }

  _lockDocumentScroll() {
    if (this._scrollLocked) return;
    this._scrollLocked = true;
    lockDocumentScroll(this.ownerDocument);
  }

  _restoreDocumentScroll() {
    if (!this._scrollLocked) return;
    this._scrollLocked = false;
    unlockDocumentScroll(this.ownerDocument);
  }
}

if (!customElements.get("ha-design-temp-humidity-card")) {
  customElements.define("ha-design-temp-humidity-card", HADesignTempHumidityCard);
}

window.customCards = window.customCards ?? [];
const cardMetadata = {
  type: "ha-design-temp-humidity-card",
  name: "온습도 카드",
  preview: true,
  description: "방의 현재 온도와 습도, 기간별 기록 차트",
  documentationURL: "https://github.com/jaeryun/ha-design",
  getEntitySuggestion: (hass, entityId) =>
    temperatureSensor(hass, entityId)
      ? {
          config: {
            type: "custom:ha-design-temp-humidity-card",
            temperature_entity: entityId,
          },
        }
      : null,
};
const registeredCard = window.customCards.find((card) => card.type === cardMetadata.type);
if (registeredCard) Object.assign(registeredCard, cardMetadata);
else window.customCards.push(cardMetadata);
