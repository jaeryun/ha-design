import {
  deviceCompactStyles,
  escapeDeviceText,
  patchCardDom,
  renderDeviceCompact,
} from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";

const KIND_DEFAULTS = {
  refrigerator: {
    title: "냉장고",
    eyebrow: "APPLIANCE · KITCHEN",
    detailEyebrow: "FRESH STORAGE",
  },
  kimchi: {
    title: "김치냉장고",
    eyebrow: "KIMCHI STORAGE · KITCHEN",
    detailEyebrow: "FERMENTATION STORAGE",
  },
};

const isDoorOpen = (state) => ["on", "open", "opening"].includes(state);
const entityState = (hass, entityId) => hass?.states?.[entityId];
const formatTemperature = (state) => {
  if (!state || ["unknown", "unavailable"].includes(state.state)) return "—";
  const value = Number(state.state);
  const unit = state.attributes?.unit_of_measurement ?? "°C";
  return Number.isFinite(value) ? `${value.toFixed(1)}${unit}` : `${state.state}${unit}`;
};

const refrigeratorScene = (
  kind,
  doorOpen,
  heroImage,
  heroFit = "cover",
  heroVariant = "default",
  heroProductImage,
) => `
  <div class="cold-scene ${kind} ${heroImage ? "has-photo" : ""} ${heroProductImage ? "has-product" : ""} hero-fit-${heroFit} hero-variant-${heroVariant} ${doorOpen ? "door-open" : ""}">
    <span class="cold-glow" aria-hidden="true"></span>
    ${heroImage
      ? `<img class="scene-background" src="${escapeDeviceText(heroImage)}" alt="" aria-hidden="true">`
      : `<span class="appliance" aria-hidden="true">
          <i class="appliance-door door-left"></i>
          <i class="appliance-door door-right"></i>
          <i class="appliance-drawer drawer-one"></i>
          <i class="appliance-drawer drawer-two"></i>
          <i class="appliance-handle handle-left"></i>
          <i class="appliance-handle handle-right"></i>
          <i class="status-light"></i>
        </span>`}
    ${heroProductImage
      ? `<img class="scene-product" src="${escapeDeviceText(heroProductImage)}" alt="" aria-hidden="true">`
      : ""}
    <span class="scene-shade" aria-hidden="true"></span>
  </div>`;

class HaDesignColdStorageCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._dialogOpen = false;
    this._replaceDom = true;
    this._boundListeners = new WeakMap();
  }

  static getStubConfig() {
    return {
      kind: "refrigerator",
      zones: [
        { name: "냉장실", entity: "sensor.refrigerator_temperature" },
        { name: "냉동실", entity: "sensor.freezer_temperature" },
      ],
    };
  }

  setConfig(config) {
    const kind = config?.kind ?? "refrigerator";
    if (!KIND_DEFAULTS[kind]) {
      throw new Error("kind는 refrigerator 또는 kimchi여야 합니다");
    }
    if (!Array.isArray(config?.zones) || config.zones.length === 0) {
      throw new Error("최소 한 개의 zones 설정이 필요합니다");
    }
    if (config.zones.some((zone) => !zone?.entity || !zone?.name)) {
      throw new Error("각 zone에는 name과 entity가 필요합니다");
    }
    this._config = { ...config, kind };
    this._replaceDom = true;
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

  _render() {
    if (!this._config || !this._hass) return;
    const defaults = KIND_DEFAULTS[this._config.kind];
    const title = this._config.title ?? defaults.title;
    const doorEntities = this._config.door_entities ??
      [this._config.door_entity].filter(Boolean);
    const doorOpen = doorEntities.some((entityId) =>
      isDoorOpen(entityState(this._hass, entityId)?.state));
    const zones = this._config.zones.map((zone) => ({
      ...zone,
      temperature: formatTemperature(entityState(this._hass, zone.entity)),
    }));
    const quickCool = entityState(this._hass, this._config.quick_cool_entity);
    const quickCoolOn = quickCool?.state === "on";
    const mode = entityState(this._hass, this._config.mode_entity);
    const modeOptions = this._config.mode_options ?? mode?.attributes?.options ?? [];
    const dialogId = `${this._config.kind}-${title.replaceAll(/\s+/g, "-")}-details`;
    const scene = refrigeratorScene(
      this._config.kind,
      doorOpen,
      this._config.hero_image,
      this._config.hero_fit === "contain" ? "contain" : "cover",
      ["product-wide", "product-slim"].includes(this._config.hero_variant)
        ? this._config.hero_variant
        : "default",
      this._config.hero_product_image,
    );
    const statusItems = [
      ...zones.slice(0, 2).map((zone) => `${zone.name} ${zone.temperature}`),
      doorOpen ? "문이 열려 있어요" : "문 닫힘",
    ];
    const sectionEyebrow = this._config.section_eyebrow ?? "COMPARTMENTS";
    const sectionTitle = this._config.section_title ?? "칸별 온도";
    const summaryLabel = this._config.summary_label ?? `${zones.length}개 칸 온도`;

    const html = `
      <style>${deviceCompactStyles}${this._styles()}</style>
      <article class="device-card cold-card ${this._config.kind} ${doorOpen ? "has-open-door" : ""}">
        ${renderDeviceCompact({
          className: "cold-launcher",
          attributes: `role="button" tabindex="0" aria-label="${escapeDeviceText(title)} 상세 조작 열기" aria-haspopup="dialog" aria-expanded="${this._dialogOpen}" aria-controls="${escapeDeviceText(dialogId)}"`,
          visual: scene,
          eyebrow: this._config.eyebrow ?? defaults.eyebrow,
          title,
          statusItems,
          narrowStatusItem: `${zones[0].name} ${zones[0].temperature} · ${doorOpen ? "문 열림" : "정상"}`,
          badge: doorOpen ? "문 열림" : "정상",
        })}
        <dialog id="${escapeDeviceText(dialogId)}" aria-label="${escapeDeviceText(title)} 상세 조작">
          <button class="dialog-close" type="button" data-action="dismiss" aria-label="${escapeDeviceText(title)} 상세 조작 닫기">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
          <div class="dialog-scroll">
            <header class="detail-hero">
              ${scene}
              <div class="detail-copy">
                <span>${defaults.detailEyebrow}</span>
                <h2>${escapeDeviceText(title)}</h2>
                <p>${doorOpen ? "문이 열려 있어요. 식품 보관 상태를 확인해 주세요." : escapeDeviceText(this._config.normal_status ?? "모든 칸이 안정적으로 보관 중이에요.")}</p>
              </div>
            </header>
            <div class="detail-body">
              <section aria-labelledby="zones-heading">
                <div class="section-heading">
                  <div><span>${escapeDeviceText(sectionEyebrow)}</span><h3 id="zones-heading">${escapeDeviceText(sectionTitle)}</h3></div>
                  <small>${doorOpen ? "문 열림 감지" : "문 닫힘"}</small>
                </div>
                <div class="zone-grid">
                  ${zones.map((zone) => `
                    <article class="zone">
                      <span>${escapeDeviceText(zone.name)}</span>
                      <strong>${escapeDeviceText(zone.temperature)}</strong>
                      <small>${escapeDeviceText(zone.description ?? "현재 상태")}</small>
                    </article>`).join("")}
                </div>
              </section>
              ${quickCool ? `
                <section class="control-row">
                  <span class="control-icon">${this._icon("snow")}</span>
                  <span class="control-copy"><strong>급속냉각</strong><small>${quickCoolOn ? "빠르게 온도를 낮추는 중이에요" : "필요할 때 빠르게 차갑게 해요"}</small></span>
                  <button class="switch" type="button" role="switch" data-action="quick-cool" aria-checked="${quickCoolOn}" aria-label="급속냉각"></button>
                </section>` : ""}
              ${mode && modeOptions.length ? `
                <section class="mode-section" aria-labelledby="mode-heading">
                  <div class="section-heading">
                    <div><span>STORAGE MODE</span><h3 id="mode-heading">보관 모드</h3></div>
                    <small>${escapeDeviceText(mode.state)}</small>
                  </div>
                  <div class="segments" role="tablist" aria-label="보관 모드">
                    ${modeOptions.map((option) => `
                      <button type="button" role="tab" data-action="mode" data-value="${escapeDeviceText(option)}" aria-selected="${mode.state === option}">
                        ${escapeDeviceText(option)}
                      </button>`).join("")}
                  </div>
                </section>` : ""}
              <footer class="capabilities">
                <span>${this._config.model_name ? `MODEL · ${escapeDeviceText(this._config.model_name)}` : "연결된 기능"}</span>
                <strong>${[
                  summaryLabel,
                  doorEntities.length ? "문 감지" : null,
                  quickCool ? "급속냉각" : null,
                  modeOptions.length ? "보관 모드" : null,
                ].filter(Boolean).join(" · ")}</strong>
              </footer>
            </div>
          </div>
        </dialog>
        <p class="sr-only" id="announcement" aria-live="polite"></p>
      </article>`;

    patchCardDom(this.shadowRoot, html, this._replaceDom);
    this._replaceDom = false;
    this._bindEvents();
    if (this._dialogOpen) {
      const dialog = this.shadowRoot.querySelector("dialog");
      if (dialog && !dialog.open) dialog.showModal();
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
    const launcher = this.shadowRoot.querySelector(".cold-launcher");
    this._listen(launcher, "click", "click", () => this._openDialog());
    this._listen(launcher, "keydown", "keydown", (event) => {
      if (!["Enter", " "].includes(event.key) && event.code !== "Space") return;
      event.preventDefault();
      this._openDialog();
    });

    const dialog = this.shadowRoot.querySelector("dialog");
    this._listen(dialog, "backdrop", "click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    this._listen(dialog, "close", "close", () => {
      this._dialogOpen = false;
      const currentLauncher = this.shadowRoot.querySelector(".cold-launcher");
      currentLauncher?.setAttribute("aria-expanded", "false");
      currentLauncher?.focus();
    });
    this._listen(this.shadowRoot.querySelector('[data-action="dismiss"]'), "dismiss", "click", () => dialog?.close());
    this._listen(this.shadowRoot.querySelector('[data-action="quick-cool"]'), "quick-cool", "click", () => {
      const state = entityState(this._hass, this._config.quick_cool_entity);
      if (!state) return;
      this._hass.callService("switch", state.state === "on" ? "turn_off" : "turn_on", {
        entity_id: this._config.quick_cool_entity,
      });
      this._announce("급속냉각 변경을 요청했어요");
    });
    this.shadowRoot.querySelectorAll('[data-action="mode"]').forEach((button) => {
      this._listen(button, `mode-${button.dataset.value}`, "click", () => {
        this._hass.callService("select", "select_option", {
          entity_id: this._config.mode_entity,
          option: button.dataset.value,
        });
        this._announce(`${button.dataset.value} 모드를 요청했어요`);
      });
    });
  }

  _openDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog || dialog.open) return;
    this._dialogOpen = true;
    this.shadowRoot.querySelector(".cold-launcher")?.setAttribute("aria-expanded", "true");
    dialog.showModal();
    this.shadowRoot.querySelector('[data-action="dismiss"]')?.focus();
  }

  _announce(message) {
    const announcement = this.shadowRoot.querySelector("#announcement");
    if (announcement) announcement.textContent = message;
  }

  _icon(name) {
    if (name === "snow") {
      return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2v20M4.2 6.5l15.6 11M19.8 6.5l-15.6 11M8.5 4.5 12 7l3.5-2.5M8.5 19.5 12 17l3.5 2.5"/></svg>';
    }
    return "";
  }

  _styles() {
    return `
      :host {
        --accent-cold: #3D6FE0;
        --accent-cold-deep: #284EA8;
        --accent-cold-tint: #EAF0FF;
        --surface-card: #FFFFFF;
        --surface-soft: #F7F5F0;
        --surface-pressed: #ECE8E0;
        --text-primary: #1A1A18;
        --text-secondary: #716D64;
        --text-tertiary: #9A958A;
        --border-subtle: rgba(26, 26, 24, .08);
        --motion-micro: 140ms;
        --motion-standard: 220ms;
        --ease-standard: cubic-bezier(.2, .8, .2, 1);
        --device-card-surface: var(--surface-card);
        --device-card-border: var(--border-subtle);
        --device-focus-ring: color-mix(in srgb, var(--accent-cold) 54%, white);
        display: block;
        color: var(--text-primary);
        font-family: "Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      :host([hidden]) { display: none; }
      * { box-sizing: border-box; }
      button { font: inherit; }
      button:focus-visible { outline: 3px solid color-mix(in srgb, var(--accent-cold) 54%, white); outline-offset: 3px; }
      svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      .cold-scene { position: absolute; inset: 0; overflow: hidden; background: linear-gradient(135deg, #C7D9E5 0%, #7F9DAC 50%, #536B78 100%); }
      .cold-scene.kimchi { background: linear-gradient(135deg, #D8CBE1 0%, #977FA5 52%, #604D6B 100%); }
      .cold-scene > img { position: absolute; inset: 0; width: 100%; height: 100%; }
      .cold-scene .scene-background { z-index: 1; object-fit: cover; }
      .cold-scene.hero-fit-contain .scene-background {
        right: 4%;
        left: auto;
        width: 58%;
        object-fit: contain;
        filter: drop-shadow(-14px 18px 18px rgba(23, 38, 45, .28));
      }
      .cold-scene.kimchi.has-photo:not(.has-product) .scene-background { object-position: 64% center; }
      .cold-scene.has-product .scene-background {
        object-position: 12% center;
        filter: saturate(.72) brightness(.72) blur(1.5px);
        transform: scale(1.08);
      }
      .cold-scene .scene-product {
        z-index: 2;
        object-fit: contain;
        filter: drop-shadow(-14px 18px 18px rgba(23, 38, 45, .32));
        transform-origin: center;
      }
      .cold-scene.hero-variant-product-wide .scene-product {
        transform: translateX(23%) scale(1.18);
      }
      .cold-scene.hero-variant-product-slim .scene-product {
        transform: translateX(23%) scale(1.28);
      }
      .cold-glow { position: absolute; inset: -35% 35% 15% -10%; border-radius: 50%; background: rgba(255,255,255,.5); filter: blur(24px); }
      .scene-shade { position: absolute; z-index: 1; inset: 0; background: linear-gradient(90deg, rgba(14,24,32,.88) 0%, rgba(14,24,32,.50) 48%, rgba(14,24,32,.08) 78%); }
      .hero-fit-contain .scene-shade { background: linear-gradient(90deg, rgba(14,24,32,.92) 0%, rgba(14,24,32,.62) 45%, rgba(14,24,32,.10) 70%); }
      .appliance { position: absolute; z-index: 1; top: 10px; right: 8%; width: 108px; height: 152px; border: 1px solid rgba(255,255,255,.7); border-radius: 10px 10px 5px 5px; background: linear-gradient(105deg, #F8F8F4 0%, #D7D9D8 48%, #FCFCFA 100%); box-shadow: -18px 22px 34px rgba(24,38,46,.28), inset 1px 0 rgba(255,255,255,.85); transform: perspective(420px) rotateY(-5deg); transition: transform var(--motion-standard) var(--ease-standard); }
      .appliance-door, .appliance-drawer { position: absolute; display: block; border: 1px solid rgba(71,78,80,.18); background: linear-gradient(105deg, rgba(255,255,255,.3), rgba(107,118,120,.08)); }
      .door-left { top: 0; bottom: 49%; left: 0; width: 50%; border-radius: 9px 0 0; }
      .door-right { top: 0; right: 0; bottom: 49%; width: 50%; border-radius: 0 9px 0 0; }
      .drawer-one { right: 0; bottom: 24%; left: 0; height: 25%; }
      .drawer-two { right: 0; bottom: 0; left: 0; height: 24%; border-radius: 0 0 5px 5px; }
      .kimchi .door-left, .kimchi .door-right { bottom: 62%; }
      .kimchi .drawer-one { bottom: 31%; height: 31%; }
      .kimchi .drawer-two { height: 31%; }
      .appliance-handle { position: absolute; z-index: 2; top: 10px; width: 2px; height: 58px; border-radius: 9px; background: #737B7C; box-shadow: 0 0 0 1px rgba(255,255,255,.35); }
      .handle-left { left: 47px; } .handle-right { right: 47px; }
      .status-light { position: absolute; top: 15px; right: 13px; width: 4px; height: 4px; border-radius: 50%; background: #54BFC5; box-shadow: 0 0 8px #54BFC5; }
      .door-open .appliance { transform: perspective(420px) rotateY(-5deg) translateX(-3px); }
      .door-open .door-right { transform-origin: right center; transform: perspective(180px) rotateY(32deg); box-shadow: -7px 0 10px rgba(28,42,48,.2); }
      dialog { width: min(520px, calc(100vw - 24px)); max-width: none; max-height: calc(100dvh - 24px); padding: 0; overflow: hidden; border: 0; border-radius: 28px; background: transparent; color: var(--text-primary); box-shadow: 0 28px 80px rgba(26,26,24,.28); opacity: 0; transform: scale(.96); transition: opacity var(--motion-standard) var(--ease-standard), transform var(--motion-standard) var(--ease-standard), display var(--motion-standard) allow-discrete, overlay var(--motion-standard) allow-discrete; }
      dialog[open] { opacity: 1; transform: scale(1); }
      @starting-style { dialog[open] { opacity: 0; transform: scale(.96); } }
      dialog::backdrop { background: rgba(26,26,24,.34); backdrop-filter: blur(10px); }
      .dialog-scroll { max-height: calc(100dvh - 24px); overflow-y: auto; overscroll-behavior: contain; background: var(--surface-card); }
      .dialog-close { position: absolute; z-index: 5; top: 14px; right: 14px; display: grid; width: 44px; height: 44px; place-items: center; padding: 0; border: 1px solid rgba(255,255,255,.4); border-radius: 50%; background: rgba(20,20,18,.48); color: white; cursor: pointer; backdrop-filter: blur(10px); }
      .detail-hero { position: relative; min-height: 224px; overflow: hidden; }
      .detail-hero .appliance { top: 26px; right: 9%; width: 128px; height: 184px; }
      .detail-copy { position: absolute; z-index: 2; right: 156px; bottom: 22px; left: 20px; color: white; }
      .detail-copy > span, .section-heading span { display: block; font-size: 10px; font-weight: 700; line-height: 1.3; letter-spacing: .12em; }
      .detail-copy h2 { margin: 6px 0 0; font-size: 25px; line-height: 1.2; letter-spacing: -.02em; }
      .detail-copy p { max-width: 250px; margin: 10px 0 0; color: rgba(255,255,255,.86); font-size: 13px; line-height: 1.45; word-break: keep-all; }
      .detail-body { padding: 22px 20px 20px; }
      .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
      .section-heading span { margin-bottom: 4px; color: var(--accent-cold-deep); font-size: 9px; }
      .kimchi .section-heading span { color: #7254A3; }
      .section-heading h3 { margin: 0; font-size: 16px; line-height: 1.3; }
      .section-heading small { color: var(--text-secondary); font-size: 12px; }
      .zone-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); gap: 8px; }
      .zone { padding: 15px; border-radius: 16px; background: var(--surface-soft); box-shadow: inset 0 0 0 1px var(--border-subtle); }
      .zone > span { color: var(--text-secondary); font-size: 12px; font-weight: 650; }
      .zone strong { display: block; margin-top: 12px; font-size: 25px; line-height: 1; letter-spacing: -.03em; }
      .zone small { display: block; margin-top: 7px; color: var(--text-tertiary); font-size: 11px; }
      .control-row { display: grid; grid-template-columns: 40px minmax(0,1fr) auto; gap: 12px; align-items: center; min-height: 76px; margin-top: 10px; border-top: 1px solid var(--border-subtle); }
      .control-icon { display: grid; width: 36px; height: 36px; place-items: center; border-radius: 50%; background: var(--accent-cold-tint); color: var(--accent-cold-deep); }
      .control-copy strong, .control-copy small { display: block; }
      .control-copy strong { font-size: 15px; } .control-copy small { margin-top: 3px; color: var(--text-secondary); font-size: 12px; line-height: 1.4; }
      .switch { position: relative; width: 52px; height: 44px; padding: 0; border: 0; border-radius: 999px; background: transparent; cursor: pointer; }
      .switch::before { position: absolute; inset: 6px 0; border-radius: 999px; background: var(--text-tertiary); content: ""; transition: background-color var(--motion-standard) var(--ease-standard); }
      .switch::after { position: absolute; top: 10px; left: 4px; width: 24px; height: 24px; border-radius: 50%; background: white; box-shadow: 0 2px 7px rgba(26,26,24,.22); content: ""; transition: transform var(--motion-standard) var(--ease-standard); }
      .switch[aria-checked="true"]::before { background: #0E9AA7; }
      .switch[aria-checked="true"]::after { transform: translateX(20px); }
      .switch:active::after { transform: scale(.9); }
      .switch[aria-checked="true"]:active::after { transform: translateX(20px) scale(.9); }
      .mode-section { margin-top: 10px; padding: 16px; border-radius: 18px; background: var(--surface-soft); box-shadow: inset 0 0 0 1px var(--border-subtle); }
      .segments { display: grid; grid-template-columns: repeat(auto-fit, minmax(70px, 1fr)); gap: 4px; padding: 4px; border-radius: 13px; background: var(--surface-pressed); }
      .segments button { min-height: 44px; padding: 0 10px; border: 0; border-radius: 10px; background: transparent; color: var(--text-secondary); cursor: pointer; font-size: 14px; font-weight: 650; }
      .segments button[aria-selected="true"] { background: white; color: #7254A3; box-shadow: 0 3px 10px rgba(26,26,24,.08); }
      .capabilities { margin-top: 14px; padding: 14px 16px; border-radius: 14px; background: var(--surface-soft); }
      .capabilities span, .capabilities strong { display: block; }
      .capabilities span { color: var(--text-tertiary); font-size: 10px; font-weight: 700; letter-spacing: .08em; }
      .capabilities strong { margin-top: 5px; font-size: 12px; line-height: 1.45; }
      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      @media (max-width: 420px) {
        dialog { width: calc(100vw - 16px); max-height: calc(100dvh - 16px); border-radius: 24px; }
        .dialog-scroll { max-height: calc(100dvh - 16px); }
        .detail-hero { min-height: 214px; }
        .detail-copy { right: 132px; left: 16px; }
        .detail-hero .appliance { right: 4%; width: 116px; height: 172px; }
        .detail-copy h2 { font-size: 22px; }
        .detail-copy p { font-size: 12px; }
        .detail-body { padding-right: 16px; padding-left: 16px; }
        .zone-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; }
      }
    `;
  }
}

if (!customElements.get("ha-design-cold-storage-card")) {
  customElements.define("ha-design-cold-storage-card", HaDesignColdStorageCard);
}

window.customCards = window.customCards ?? [];
const metadata = {
  type: "ha-design-cold-storage-card",
  name: "ha-design 냉장 기기 카드",
  preview: true,
  description: "냉장고와 김치냉장고의 칸별 온도·문 상태·보관 기능을 제공하는 카드",
  documentationURL: "https://github.com/jaeryun/ha-design",
};
const registered = window.customCards.find((card) => card.type === metadata.type);
if (registered) Object.assign(registered, metadata);
else window.customCards.push(metadata);
