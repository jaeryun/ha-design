const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1763718869063-41678d34069d?auto=format&fit=crop&w=1200&h=1200&q=85";

const MODULE_URLS = [
  "./ha-design-device-compact.js?v=device-tile-20260825-1",
  "./ha-design-curtain-card.styles.js?v=curtain-card-20260825-1",
  "./ha-design-curtain-card.template.js?v=curtain-card-20260825-1",
];

const COVER_FEATURES = Object.freeze({
  OPEN: 1,
  CLOSE: 2,
  SET_POSITION: 4,
  STOP: 8,
});

const clampPosition = (value) => Math.min(100, Math.max(0, Math.round(value)));

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
    this._loadModules();
  }

  setConfig(config) {
    if (!config?.entity?.startsWith("cover.")) {
      throw new Error("커튼 cover 엔티티가 필요합니다");
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
    return this._config?.compact_variant === "tile"
      ? { columns: 6, min_columns: 6, max_columns: 6 }
      : { columns: 12, min_columns: 6 };
  }

  disconnectedCallback() {
    this._dialogOpen = false;
  }

  _loadModules() {
    this._modulePromise ??= Promise.all(MODULE_URLS.map((url) => import(url)))
      .then(([compact, styles, template]) => {
        this._modules = { ...compact, ...styles, ...template };
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
    } = this._modules;
    const activeElement = this.shadowRoot.activeElement;
    const activeAction = activeElement?.dataset.action;
    const pendingPosition =
      activeAction === "position" && Number.isFinite(Number(activeElement.value))
        ? clampPosition(Number(activeElement.value))
        : null;
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
    const position = Number.isFinite(attributes.current_position)
      ? clampPosition(attributes.current_position)
      : state.state === "closed"
        ? 0
        : 100;
    const renderedPosition = pendingPosition ?? position;
    const unavailable = state.state === "unavailable";
    const statusCopy = this._statusCopy(state.state, position);
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
      badge: this._badgeCopy(state.state, position),
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

    this.shadowRoot.innerHTML = `
      <style>${deviceCompactStyles}${curtainCardStyles}</style>
      ${renderCurtainCard(model)}`;
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

  _bindEvents() {
    const launcher = this.shadowRoot.querySelector(".curtain-launcher");
    launcher?.addEventListener("click", () => this._openDialog());
    launcher?.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key) && event.code !== "Space") return;
      event.preventDefault();
      this._openDialog();
    });

    this.shadowRoot.querySelector('[data-action="dismiss"]')?.addEventListener("click", () => {
      this.shadowRoot.querySelector("dialog")?.close();
    });
    this.shadowRoot.querySelector('[data-action="open"]')?.addEventListener("click", () => {
      this._callCoverService("open_cover", COVER_FEATURES.OPEN);
    });
    this.shadowRoot.querySelector('[data-action="stop"]')?.addEventListener("click", () => {
      this._callCoverService("stop_cover", COVER_FEATURES.STOP);
    });
    this.shadowRoot.querySelector('[data-action="close"]')?.addEventListener("click", () => {
      this._callCoverService("close_cover", COVER_FEATURES.CLOSE);
    });

    const range = this.shadowRoot.querySelector('[data-action="position"]');
    range?.addEventListener("input", () => this._previewPosition(Number(range.value)));
    range?.addEventListener("change", () => {
      this._callCoverService("set_cover_position", COVER_FEATURES.SET_POSITION, {
        position: Number(range.value),
      });
    });

    const dialog = this.shadowRoot.querySelector("dialog");
    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog?.addEventListener("close", () => {
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

  _previewPosition(position) {
    const visualOpening = Math.round(clampPosition(position) * 0.88);
    this.shadowRoot.querySelectorAll(".curtain-detail-hero, .curtain-detail-hero .curtain-hero").forEach((visual) => {
      visual.style.setProperty("--curtain-opening", `${visualOpening}%`);
    });
    const output = this.shadowRoot.querySelector('[data-output="position"]');
    if (output) output.textContent = `${position}%`;
    const range = this.shadowRoot.querySelector('[data-action="position"]');
    range?.setAttribute("aria-valuetext", `${position}% 열림`);
  }

  _callCoverService(service, feature, data = {}) {
    const state = this._hass.states[this._config.entity];
    const supportedFeatures = state?.attributes.supported_features ?? 0;
    if (!state || state.state === "unavailable" || !this._supports(supportedFeatures, feature)) return;
    this._hass.callService("cover", service, { entity_id: this._config.entity, ...data });
  }

  _supports(value, feature) {
    return (value & feature) === feature;
  }

  _statusCopy(state, position) {
    if (state === "unavailable") return "연결 상태 확인";
    if (state === "opening") return `열리는 중 · ${position}%`;
    if (state === "closing") return `닫히는 중 · ${position}%`;
    if (position === 0) return "닫힘";
    if (position === 100) return "완전히 열림";
    return `열림 ${position}%`;
  }

  _badgeCopy(state, position) {
    if (state === "unavailable") return "확인 필요";
    if (state === "opening") return "열림 중";
    if (state === "closing") return "닫힘 중";
    if (position === 0) return "닫힘";
    if (position === 100) return "열림";
    return `${position}%`;
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
