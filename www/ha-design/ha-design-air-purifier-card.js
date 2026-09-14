const DEFAULT_PRODUCT_IMAGE =
  "https://www.cuckoo.co.kr/upload_cuckoo/_bo_mall/product/dbbe389c-11ac-40c9-af8f-09699e090e11.png";

const MODULE_URLS = [
  "./ha-design-air-purifier-card.styles.js?v=air-purifier-20260913-1",
  "./ha-design-air-purifier-card.template.js?v=air-purifier-20260913-1",
];

const CONFIG_LABELS = {
  entity: "공기청정기 전원 엔티티",
  title: "카드 제목",
  eyebrow: "상단 영문 라벨",
  model_name: "모델명",
  hero_product_image: "제품 이미지 URL",
};

const switchEntity = (hass, entityId) =>
  entityId?.startsWith("switch.") && Boolean(hass?.states?.[entityId]);

const findSwitchEntity = (hass, entities = [], entitiesFallback = []) =>
  [...entities, ...entitiesFallback, ...Object.keys(hass?.states ?? {})]
    .find((entityId) => switchEntity(hass, entityId));

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const resolveImageUrl = (value) => {
  const url = new URL(value ?? DEFAULT_PRODUCT_IMAGE, document.baseURI);
  return ["http:", "https:"].includes(url.protocol)
    ? url.href
    : DEFAULT_PRODUCT_IMAGE;
};

class HADesignAirPurifierCard extends HTMLElement {
  static getConfigForm() {
    return {
      schema: [
        {
          name: "entity",
          required: true,
          selector: { entity: { filter: { domain: "switch" } } },
        },
        { name: "title", selector: { text: {} } },
        { name: "eyebrow", selector: { text: {} } },
        { name: "model_name", selector: { text: {} } },
        { name: "hero_product_image", selector: { text: {} } },
      ],
      computeLabel: (schema) => CONFIG_LABELS[schema.name],
      assertConfig: (config) => {
        if (config.entity && !config.entity.startsWith("switch.")) {
          throw new Error("switch 엔티티만 사용할 수 있습니다");
        }
      },
    };
  }

  static getStubConfig(hass, entities, entitiesFallback) {
    return { entity: findSwitchEntity(hass, entities, entitiesFallback) };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._dialogOpen = false;
    this._loadModules();
  }

  setConfig(config) {
    if (!config?.entity?.startsWith("switch.")) {
      throw new Error("공기청정기 전원 switch 엔티티가 필요합니다");
    }
    this._config = config;
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

  _loadModules() {
    this._modulePromise ??= Promise.all(MODULE_URLS.map((url) => import(url)))
      .then(([styles, template]) => {
        this._modules = { ...styles, ...template };
        this._render();
        this.dispatchEvent(new CustomEvent("ha-design-card-ready"));
      })
      .catch((error) => {
        this._moduleError = error;
        this._render();
      });
  }

  _render() {
    if (!this._config || !this._hass) return;
    if (this._moduleError) {
      this.shadowRoot.innerHTML =
        '<ha-card class="config-error">공기청정기 카드 모듈을 불러오지 못했습니다. 새로고침해 주세요.</ha-card>';
      return;
    }
    if (!this._modules) return;

    const state = this._hass.states[this._config.entity];
    if (!state) {
      this._dialogOpen = false;
      this.shadowRoot.innerHTML =
        `<ha-card class="config-error">엔티티를 찾을 수 없습니다: ${escapeHtml(this._config.entity)}</ha-card>`;
      return;
    }

    const unavailable = ["unknown", "unavailable"].includes(state.state);
    const isOn = state.state === "on";
    const model = {
      title: this._config.title ?? "공기청정기",
      eyebrow: this._config.eyebrow ?? "CUCKOO · AIR PURIFIER",
      modelName: this._config.model_name ?? "AC-23AH10FNW",
      productImage: escapeHtml(resolveImageUrl(this._config.hero_product_image)),
      isOn,
      unavailable,
      dialogOpen: this._dialogOpen,
    };

    this.shadowRoot.innerHTML =
      `<style>${this._modules.airPurifierCardStyles}</style>${this._modules.renderAirPurifierCard(model)}`;
    this._bindEvents();
    if (this._dialogOpen) {
      const dialog = this.shadowRoot.querySelector("dialog");
      if (dialog && !dialog.open) dialog.showModal();
      this.shadowRoot.querySelector('[data-action="close"]')?.focus();
    }
  }

  _bindEvents() {
    const launcher = this.shadowRoot.querySelector('[data-action="open"]');
    launcher?.addEventListener("click", () => this._openDialog());
    launcher?.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      this._openDialog();
    });

    this.shadowRoot.querySelector('[data-action="power"]')?.addEventListener("click", (event) => {
      this._setPower(event.currentTarget.getAttribute("aria-checked") !== "true");
    });
    this.shadowRoot.querySelector('[data-action="close"]')?.addEventListener("click", () => {
      this.shadowRoot.querySelector("dialog")?.close();
    });

    this.shadowRoot.querySelector("dialog")?.addEventListener("close", () => {
      this._dialogOpen = false;
      launcher?.setAttribute("aria-expanded", "false");
      launcher?.focus();
    });
  }

  _openDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog || dialog.open) return;
    this._dialogOpen = true;
    this.shadowRoot.querySelector('[data-action="open"]')
      ?.setAttribute("aria-expanded", "true");
    dialog.showModal();
    this.shadowRoot.querySelector('[data-action="close"]')?.focus();
  }

  _setPower(turnOn) {
    this._hass.callService("switch", turnOn ? "turn_on" : "turn_off", {
      entity_id: this._config.entity,
    });
  }
}

if (!customElements.get("ha-design-air-purifier-card")) {
  customElements.define("ha-design-air-purifier-card", HADesignAirPurifierCard);
}

window.customCards = window.customCards ?? [];
const cardMetadata = {
  type: "ha-design-air-purifier-card",
  name: "ha-design 공기청정기 카드",
  preview: true,
  description: "스마트 플러그로 연결한 공기청정기 전원 카드",
  documentationURL: "https://github.com/jaeryun/ha-design",
  getEntitySuggestion: (hass, entityId) => (
    switchEntity(hass, entityId)
      ? { config: { type: "custom:ha-design-air-purifier-card", entity: entityId } }
      : null
  ),
};
const registeredCard = window.customCards.find(
  (card) => card.type === cardMetadata.type,
);
if (registeredCard) Object.assign(registeredCard, cardMetadata);
else window.customCards.push(cardMetadata);
