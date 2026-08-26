const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1763718869063-41678d34069d?auto=format&fit=crop&w=1200&h=1200&q=85";

const MODULE_URLS = [
  "./ha-design-device-compact.js?v=stable-dom-20260826-1",
  "./ha-design-curtain-card.styles.js?v=curtain-card-20260825-1",
  "./ha-design-curtain-card.template.js?v=curtain-card-20260825-1",
  "./ha-design-curtain-motion.js?v=curtain-motion-20260826-1",
];

const COVER_FEATURES = Object.freeze({
  OPEN: 1,
  CLOSE: 2,
  SET_POSITION: 4,
  STOP: 8,
});

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const resolveHeroUrl = (value) => {
  const url = new URL(value ?? DEFAULT_HERO, document.baseURI);
  return ["http:", "https:"].includes(url.protocol) ? url.href : DEFAULT_HERO;
};

class HADesignCurtainCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._dialogOpen = false;
    this._replaceDom = true;
    this._boundListeners = new WeakMap();
    this._loadModules();
  }

  setConfig(config) {
    if (!config?.entity?.startsWith("cover.")) {
      throw new Error("커튼 cover 엔티티가 필요합니다");
    }
    const travelDuration = Number(config.travel_duration ?? 9);
    if (!Number.isFinite(travelDuration) || travelDuration <= 0) {
      throw new Error("travel_duration은 0보다 큰 초 단위 숫자여야 합니다");
    }
    this._config = config;
    this._travelDuration = travelDuration;
    this._replaceDom = true;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const state = hass.states[this._config?.entity];
    const actualPosition = this._modules?.resolveCurtainPosition(state);
    if (actualPosition != null) this._positionMotion?.reconcile(actualPosition);
    this._render();
  }

  getCardSize() {
    return 4;
  }

  getGridOptions() {
    return this._config?.compact_variant === "tile"
      ? { columns: 6, min_columns: 6, max_columns: 6 }
      : { columns: 12, min_columns: 6 };
  }

  disconnectedCallback() {
    this._dialogOpen = false;
    this._positionMotion?.clear();
  }

  _loadModules() {
    this._modulePromise ??= Promise.all(MODULE_URLS.map((url) => import(url)))
      .then(([compact, styles, template, motion]) => {
        this._modules = { ...compact, ...styles, ...template, ...motion };
        this._positionMotion = new this._modules.CurtainPositionMotion({
          onPosition: (position, direction) => this._syncPositionVisual(position, direction),
        });
        this._render();
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
        '<ha-card class="config-error">커튼 카드 모듈을 불러오지 못했습니다. 새로고침해 주세요.</ha-card>';
      return;
    }
    if (!this._modules) return;
    const {
      curtainCardStyles,
      deviceCompactStyles,
      renderCurtainCard,
      resolveDeviceCompactVariant,
      resolveCurtainPosition,
      curtainStatusCopy,
      curtainBadgeCopy,
      patchCardDom,
    } = this._modules;
    const activeElement = this.shadowRoot.activeElement;
    const activeAction = activeElement?.dataset.action;
    const state = this._hass.states[this._config.entity];
    if (!state) {
      this._dialogOpen = false;
      this.shadowRoot.innerHTML = `<ha-card class="config-error">엔티티를 찾을 수 없습니다: ${escapeHtml(this._config.entity)}</ha-card>`;
      return;
    }

    const attributes = state.attributes;
    if (attributes.device_class !== "curtain") {
      this._dialogOpen = false;
      this.shadowRoot.innerHTML = `<ha-card class="config-error">curtain device class가 필요합니다</ha-card>`;
      return;
    }
    const supportedFeatures = attributes.supported_features ?? 0;
    const position = resolveCurtainPosition(state);
    const renderedPosition =
      this._positionPreview ?? this._positionMotion?.displayedPosition ?? position;
    const renderedState = this._positionMotion?.direction ?? state.state;
    const unavailable = state.state === "unavailable";
    const statusCopy = curtainStatusCopy(renderedState, Math.round(renderedPosition));
    const supportsOpen = this._supports(supportedFeatures, COVER_FEATURES.OPEN);
    const supportsClose = this._supports(supportedFeatures, COVER_FEATURES.CLOSE);
    const supportsPosition = this._supports(supportedFeatures, COVER_FEATURES.SET_POSITION);
    const supportsStop = this._supports(supportedFeatures, COVER_FEATURES.STOP);

    const model = {
      title: this._config.title ?? attributes.friendly_name ?? "커튼",
      eyebrow: this._config.eyebrow ?? "CURTAIN",
      compactVariant: resolveDeviceCompactVariant(this._config.compact_variant),
      heroImage: escapeHtml(resolveHeroUrl(this._config.hero_image)),
      visualOpening: Math.round(renderedPosition * 0.88),
      statusCopy,
      badge: curtainBadgeCopy(renderedState, Math.round(renderedPosition)),
      position: renderedPosition,
      supportsOpen,
      supportsClose,
      supportsPosition,
      supportsStop,
      unavailable,
      dialogOpen: this._dialogOpen,
      capabilityNames: [
        supportsOpen ? "열기" : null,
        supportsClose ? "닫기" : null,
        supportsPosition ? "위치 지정" : null,
        supportsStop ? "정지" : null,
      ].filter(Boolean),
    };

    const html = `
      <style>${deviceCompactStyles}${curtainCardStyles}</style>
      ${renderCurtainCard(model)}`;
    patchCardDom(this.shadowRoot, html, this._replaceDom);
    this._replaceDom = false;
    this._bindEvents();
    if (this._dialogOpen) {
      const dialog = this.shadowRoot.querySelector("dialog");
      if (dialog && !dialog.open) dialog.showModal();
      this.shadowRoot.querySelector(`[data-action="${activeAction ?? "dismiss"}"]`)?.focus();
    }
    if (!this._ready) {
      this._ready = true;
      this.dispatchEvent(
        new CustomEvent("ha-design-card-ready", { bubbles: true, composed: true }),
      );
    }
  }

  _listen(element, key, type, listener) {
    if (!element) return;
    let keys = this._boundListeners.get(element);
    if (!keys) {
      keys = new Set();
      this._boundListeners.set(element, keys);
    }
    if (keys.has(key)) return;
    keys.add(key);
    element.addEventListener(type, listener);
  }

  _bindEvents() {
    const launcher = this.shadowRoot.querySelector(".curtain-launcher");
    this._listen(launcher, "launcher-click", "click", () => this._openDialog());
    this._listen(launcher, "launcher-keydown", "keydown", (event) => {
      if (!["Enter", " "].includes(event.key) && event.code !== "Space") return;
      event.preventDefault();
      this._openDialog();
    });

    this._listen(this.shadowRoot.querySelector('[data-action="dismiss"]'), "dismiss-click", "click", () => {
      this.shadowRoot.querySelector("dialog")?.close();
    });
    this._listen(this.shadowRoot.querySelector('[data-action="open"]'), "open-click", "click", () => {
      this._callCoverService("open_cover", COVER_FEATURES.OPEN);
    });
    this._listen(this.shadowRoot.querySelector('[data-action="stop"]'), "stop-click", "click", () => {
      this._callCoverService("stop_cover", COVER_FEATURES.STOP);
    });
    this._listen(this.shadowRoot.querySelector('[data-action="close"]'), "close-click", "click", () => {
      this._callCoverService("close_cover", COVER_FEATURES.CLOSE);
    });

    const range = this.shadowRoot.querySelector('[data-action="position"]');
    this._listen(range, "position-input", "input", () => {
      this._positionMotion?.clear();
      this._positionPreview = this._modules.clampCurtainPosition(Number(range.value));
      this._syncPositionVisual(this._positionPreview);
    });
    this._listen(range, "position-change", "change", () => {
      const position = this._modules.clampCurtainPosition(Number(range.value));
      this._positionPreview = null;
      this._callCoverService("set_cover_position", COVER_FEATURES.SET_POSITION, {
        position,
      });
    });
    this._listen(range, "position-blur", "blur", () => {
      this._positionPreview = null;
    });

    const dialog = this.shadowRoot.querySelector("dialog");
    this._listen(dialog, "backdrop-click", "click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    this._listen(dialog, "dialog-close", "close", () => {
      this._dialogOpen = false;
      const currentLauncher = this.shadowRoot.querySelector(".curtain-launcher");
      currentLauncher?.setAttribute("aria-expanded", "false");
      currentLauncher?.focus();
    });
  }

  _openDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog || dialog.open) return;
    this._dialogOpen = true;
    this.shadowRoot.querySelector(".curtain-launcher")?.setAttribute("aria-expanded", "true");
    dialog.showModal();
    this.shadowRoot.querySelector('[data-action="dismiss"]')?.focus();
  }

  _syncPositionVisual(position, direction = null) {
    this._modules.syncCurtainPositionVisual(this, this.shadowRoot, position, direction);
  }

  _callCoverService(service, feature, data = {}) {
    const state = this._hass.states[this._config.entity];
    const supportedFeatures = state?.attributes.supported_features ?? 0;
    if (!state || state.state === "unavailable" || !this._supports(supportedFeatures, feature)) return;
    const actualPosition = this._modules.resolveCurtainPosition(state);
    const displayedPosition =
      this._positionPreview ?? this._positionMotion?.displayedPosition ?? actualPosition;
    this._positionPreview = null;
    if (service === "stop_cover") {
      const stoppedPosition = this._positionMotion?.stop();
      if (stoppedPosition != null) this._syncPositionVisual(stoppedPosition);
    } else {
      const targetPosition = this._modules.resolveCurtainTarget(service, data);
      this._positionMotion?.start(displayedPosition, targetPosition, this._travelDuration);
    }
    this._hass.callService("cover", service, { entity_id: this._config.entity, ...data });
  }

  _supports(value, feature) {
    return (value & feature) === feature;
  }
}

if (!customElements.get("ha-design-curtain-card")) {
  customElements.define("ha-design-curtain-card", HADesignCurtainCard);
  window.customCards = window.customCards ?? [];
  window.customCards.push({
    type: "ha-design-curtain-card",
    name: "ha-design Curtain",
    description: "Warm editorial curtain tile and position controls",
  });
}
