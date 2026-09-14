const DEFAULT_PRODUCT_IMAGE =
  "https://www.cuckoo.co.kr/upload_cuckoo/_bo_mall/product/dbbe389c-11ac-40c9-af8f-09699e090e11.png";

const MODULE_URLS = [
  "./ha-design-device-compact.js?v=adaptive-compact-20260827-1",
  "./ha-design-air-purifier-card.styles.js?v=air-purifier-20260914-4",
  "./ha-design-air-purifier-card.template.js?v=air-purifier-20260914-4",
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
    this._documentOverflow = null;
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

  disconnectedCallback() {
    this._restoreDocumentScroll();
  }

  _loadModules() {
    this._modulePromise ??= Promise.all(MODULE_URLS.map((url) => import(url)))
      .then(([compact, styles, template]) => {
        this._modules = { ...compact, ...styles, ...template };
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

    const activeAction = this.shadowRoot.activeElement?.dataset.action;
    const scrollTop = this.shadowRoot.querySelector(".details-panel")?.scrollTop ?? 0;
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

    this._modules.patchCardDom(
      this.shadowRoot,
      `<style>${this._modules.airPurifierCardStyles}</style>${this._modules.renderAirPurifierCard(model)}`,
      !this.shadowRoot.firstChild,
    );
    this._bindEvents();
    if (this._dialogOpen) {
      const dialog = this.shadowRoot.querySelector("dialog");
      if (dialog && !dialog.open) dialog.showModal();
      const panel = this.shadowRoot.querySelector(".details-panel");
      if (panel) panel.scrollTop = scrollTop;
      this.shadowRoot.querySelector(`[data-action="${activeAction ?? "close"}"]`)?.focus();
    }
  }

  _bindEvents() {
    const launcher = this.shadowRoot.querySelector('[data-action="open"]');
    if (launcher) launcher.onclick = () => this._openDialog();
    if (launcher) launcher.onkeydown = (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      this._openDialog();
    };

    const power = this.shadowRoot.querySelector('[data-action="power"]');
    if (power) power.onclick = () => {
      this._setPower(power.getAttribute("aria-checked") !== "true");
    };
    const close = this.shadowRoot.querySelector('[data-action="close"]');
    if (close) close.onclick = () => this.shadowRoot.querySelector("dialog")?.close();

    const dialog = this.shadowRoot.querySelector("dialog");
    if (dialog) dialog.onclick = (event) => {
      if (event.target === dialog) dialog.close();
    };
    if (dialog) dialog.onclose = () => {
      this._dialogOpen = false;
      this._restoreDocumentScroll();
      launcher?.setAttribute("aria-expanded", "false");
      launcher?.focus();
    };
  }

  _openDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog || dialog.open) return;
    this._dialogOpen = true;
    this.shadowRoot.querySelector('[data-action="open"]')
      ?.setAttribute("aria-expanded", "true");
    const root = this.ownerDocument.documentElement;
    this._documentOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    dialog.showModal();
    this.shadowRoot.querySelector('[data-action="close"]')?.focus();
  }

  _restoreDocumentScroll() {
    if (this._documentOverflow == null) return;
    this.ownerDocument.documentElement.style.overflow = this._documentOverflow;
    this._documentOverflow = null;
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
