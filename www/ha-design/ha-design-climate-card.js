import {
  DEVICE_COMPACT_VARIANTS,
  deviceCompactStyles,
  renderDeviceCompact,
  resolveDeviceCompactVariant,
} from "./ha-design-device-compact.js?v=device-tile-20260825-1";

const HVAC_LABELS = {
  cool: "냉방",
  dry: "제습",
  fan_only: "송풍",
  auto: "자동",
  off: "꺼짐",
};

const FAN_LABELS = {
  slow_low: "미풍",
  low: "약",
  medium: "중",
  high: "강",
  power: "파워",
  auto: "자동",
};

const ICONS = {
  air: '<path d="M4 7h16v7H4zM7 10h10M8 17c1.2 1.1 2.5 1.1 3.7 0 1.2-1.1 2.5-1.1 3.8 0" />',
  leaf: '<path d="M19 4C10 4 5 8.5 5 14c0 2.8 2.2 5 5 5 5.5 0 9-6 9-15ZM5 20c2-4 5-7 10-10" />',
  swing: '<path d="M4 10h16M6 6h12M6 14h12M8 18h8" />',
  horizontal: '<path d="m8 5 4 4-4 4V9H3M16 11l-4 4 4 4v-4h5" />',
  humidity: '<path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11Z" />',
  filter: '<path d="M4 5h16v3H4zm2 6h12v3H6zm3 6h6v3H9z" />',
  energy: '<path d="M13 2 5 14h6l-1 8 9-13h-6z" />',
};

class HaDesignClimateCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._expanded = false;
    this._dialogOpen = false;
    this._focusDialogOnRender = false;
    this._pageOverflow = "";
  }

  setConfig(config) {
    if (!config?.entity || !config.entity.startsWith("climate.")) {
      throw new Error("climate 엔티티가 필요합니다.");
    }
    const entityChanged = this._config?.entity !== config.entity;
    this._config = {
      title: "에어컨",
      eyebrow: "CLIMATE · WIND-FREE",
      fallback_temperature: 25,
      ...config,
    };
    if (entityChanged) {
      this._expanded = Boolean(config.expanded);
      this._dialogOpen = false;
    }
    this._render();
  }

  set hass(value) {
    this._hass = value;
    this._render();
  }

  getCardSize() {
    if (resolveDeviceCompactVariant(this._config?.compact_variant) === DEVICE_COMPACT_VARIANTS.TILE) return 4;
    if (this._config?.details_presentation === "modal") return 3;
    return this._expanded ? 12 : 3;
  }

  getGridOptions() {
    return resolveDeviceCompactVariant(this._config?.compact_variant) === DEVICE_COMPACT_VARIANTS.TILE
      ? { columns: 6, min_columns: 6, max_columns: 6 }
      : { columns: 12, min_columns: 6 };
  }

  connectedCallback() {
    this._render();
  }

  disconnectedCallback() {
    if (this._dialogOpen) {
      document.documentElement.style.overflow = this._pageOverflow;
    }
  }

  _entity(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _icon(name) {
    return `<svg aria-hidden="true" viewBox="0 0 24 24">${ICONS[name]}</svg>`;
  }

  _switch(action, checked, label, disabled = false) {
    return `<button
      class="switch"
      type="button"
      role="switch"
      aria-label="${label}"
      aria-checked="${checked}"
      data-action="${action}"
      ${disabled ? "disabled" : ""}
    ></button>`;
  }

  _illustratedScene(isOn) {
    return `
      <svg class="scene" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${isOn ? `시원한 바람이 나오는 밝은 ${this._config.title}` : `운전을 멈춘 ${this._config.title}`}">
        <defs>
          <linearGradient id="room-${isOn}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${isOn ? "#F7F2E9" : "#D8D3CA"}"/>
            <stop offset=".58" stop-color="${isOn ? "#EAE6DD" : "#C5C0B8"}"/>
            <stop offset="1" stop-color="${isOn ? "#D6E2E8" : "#AAA8A4"}"/>
          </linearGradient>
          <linearGradient id="window-${isOn}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${isOn ? "#E8F5FB" : "#D6D6D3"}"/>
            <stop offset="1" stop-color="${isOn ? "#BDD2DD" : "#B6B7B5"}"/>
          </linearGradient>
          <linearGradient id="shade-${isOn}" x1="0" y1="0" x2="0" y2="1">
            <stop offset=".35" stop-color="rgba(8,15,24,0)"/>
            <stop offset="1" stop-color="${isOn ? "rgba(8,18,35,.68)" : "rgba(20,20,18,.72)"}"/>
          </linearGradient>
          <filter id="shadow-${isOn}" x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#35322E" flood-opacity=".2"/>
          </filter>
          <filter id="blur-${isOn}">
            <feGaussianBlur stdDeviation="5"/>
          </filter>
        </defs>
        <rect width="800" height="450" fill="url(#room-${isOn})"/>
        <path d="M0 0h800L626 170H0Z" fill="${isOn ? "#FFFDF8" : "#E5E1DA"}"/>
        <path d="m475 0 151 170M0 168h626" stroke="${isOn ? "#D3CDC2" : "#B9B4AC"}" stroke-width="3" opacity=".72"/>
        <rect x="632" y="48" width="168" height="250" fill="url(#window-${isOn})"/>
        <path d="M675 48v250M745 48v250" stroke="#F8F4EC" stroke-width="8" opacity=".74"/>
        <path d="M620 40c36 44 22 168 12 268M792 40c-36 44-22 168-12 268" fill="none" stroke="${isOn ? "#F7F1E7" : "#D9D4CC"}" stroke-width="26" opacity=".82"/>
        <path d="M67 305h472c31 0 56 25 56 56v89H34v-112c0-18 15-33 33-33Z" fill="${isOn ? "#D0C7B7" : "#B3ADA4"}"/>
        <path d="M94 281h196c23 0 42 19 42 42v55H54v-57c0-22 18-40 40-40Z" fill="${isOn ? "#E8E0D3" : "#C8C1B7"}"/>
        <path d="M351 287h178c22 0 40 18 40 40v51H321v-61c0-17 13-30 30-30Z" fill="${isOn ? "#E0D7C9" : "#C0BAB1"}"/>
        <g filter="url(#shadow-${isOn})" transform="translate(348 63) rotate(-1)">
          <path d="M0 22 168 0l62 46-170 28Z" fill="${isOn ? "#FAFAF7" : "#E4E3DF"}"/>
          <path d="m60 74 170-28v26L60 102Z" fill="${isOn ? "#D8DBDA" : "#C5C4C1"}"/>
          <path d="M12 29 167 9l49 36L61 69Z" fill="${isOn ? "#F0F1ED" : "#D8D7D4"}" stroke="${isOn ? "#C7CBC8" : "#B9B8B4"}" stroke-width="3"/>
          <path d="m70 77 149-25" stroke="${isOn ? "#72838C" : "#969592"}" stroke-width="7" stroke-linecap="round"/>
        </g>
        ${isOn ? `
          <g fill="none" stroke="#9DD7ED" stroke-linecap="round" filter="url(#blur-${isOn})" opacity=".66">
            <path d="M430 170c-35 44-41 85-22 123" stroke-width="13"/>
            <path d="M495 157c-22 49-19 94 8 127" stroke-width="10"/>
            <path d="M550 142c2 48 22 79 59 100" stroke-width="8"/>
          </g>
        ` : ""}
        <rect width="800" height="450" fill="url(#shade-${isOn})"/>
      </svg>`;
  }

  _scene(isOn) {
    if (!this._config.hero_image) return this._illustratedScene(isOn);

    return `
      <div class="photo-scene" role="img" aria-label="${isOn ? `시원한 바람이 나오는 밝은 ${this._config.title}` : `운전을 멈춘 ${this._config.title}`}">
        <img class="scene-photo" src="${this._config.hero_image}" alt="" aria-hidden="true">
        ${isOn ? `
          <span class="airflow" aria-hidden="true">
            <i></i><i></i><i></i>
          </span>
        ` : ""}
        <span class="photo-shade" aria-hidden="true"></span>
      </div>`;
  }

  _render() {
    if (!this.shadowRoot || !this._config) return;

    const climate = this._entity(this._config.entity);
    const attributes = climate?.attributes ?? {};
    const state = climate?.state ?? "unavailable";
    const isOn = !["off", "unavailable", "unknown"].includes(state);
    const target = attributes.temperature ?? this._config.fallback_temperature;
    const current = attributes.current_temperature;
    const humidityState = this._entity(this._config.humidity_entity)?.state;
    const humidity = humidityState ?? attributes.current_humidity;
    const filter = this._entity(this._config.filter_entity)?.state;
    const energy = this._entity(this._config.energy_entity)?.state;
    const energySaving = this._entity(this._config.energy_saving_entity)?.state === "on";
    const supportedModes = attributes.hvac_modes ?? ["cool", "dry", "fan_only", "auto"];
    const modeOptions = ["cool", "dry", "fan_only", "auto"]
      .filter((mode) => supportedModes.includes(mode));
    const fanOptions = attributes.fan_modes ?? [];
    const rovingMode = modeOptions.includes(state) ? state : modeOptions[0];
    const rovingFan = fanOptions.includes(attributes.fan_mode) ? attributes.fan_mode : fanOptions[0];
    const modeLabel = HVAC_LABELS[state] ?? state;
    const detailsId = `${this._config.entity.replaceAll(".", "-")}-details`;
    const compactVariant = resolveDeviceCompactVariant(this._config.compact_variant);
    const modalPresentation =
      compactVariant === DEVICE_COMPACT_VARIANTS.TILE ||
      this._config.details_presentation === "modal";
    const compactFooter = modalPresentation
      ? undefined
      : `
        <div class="compact-actions">
          <button class="details-toggle" type="button" data-action="details" aria-expanded="false" aria-controls="${detailsId}">
            <span>상세 조작 보기</span>
            <span aria-hidden="true">⌄</span>
          </button>
          ${this._switch("power", isOn, `${this._config.title} 전원`)}
        </div>`;

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <article class="card device-card ${isOn ? "is-on" : "is-off"} ${this._expanded ? "is-expanded" : "is-collapsed"} ${modalPresentation ? "is-modal" : ""}" aria-label="${this._config.title} 조작 카드">
        ${renderDeviceCompact({
          variant: compactVariant,
          className: `compact-summary ${modalPresentation ? "modal-launcher" : ""}`,
          attributes: `${this._expanded ? "hidden" : ""} ${modalPresentation ? `role="button" tabindex="0" data-action="details" aria-label="${this._config.title} 상세 조작 열기" aria-haspopup="dialog" aria-expanded="${this._dialogOpen}" aria-controls="${detailsId}"` : ""}`,
          visual: this._scene(isOn),
          visualClass: "compact-visual",
          copyClass: "compact-copy",
          eyebrow: this._config.eyebrow,
          title: this._config.title,
          statusItems: [
            isOn ? `${modeLabel} · 희망 ${Number(target).toFixed(1)}°C` : "전원 꺼짐",
            current == null ? "온도 —" : `${Number(current).toFixed(1)}°C`,
            humidity == null ? "습도 —" : `습도 ${humidity}%`,
          ],
          tileStatusItem:
            state === "unavailable"
              ? "연결 상태 확인"
              : `${isOn ? `${modeLabel} ${Number(target).toFixed(1)}°` : "꺼짐"} · ${
                  current == null ? "실내 —" : `실내 ${Number(current).toFixed(1)}°`
                }`,
          badge: isOn ? modeLabel : "꺼짐",
          footer: compactFooter,
        })}

        ${modalPresentation ? `
          <dialog class="details-dialog" id="${detailsId}" aria-label="${this._config.title} 상세 조작">
            <button class="dialog-close" type="button" data-action="details" aria-label="${this._config.title} 상세 조작 닫기">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
            <div class="dialog-scroll">
        ` : ""}
        <div class="details-panel" id="${modalPresentation ? `${detailsId}-content` : detailsId}" ${modalPresentation || this._expanded ? "" : "hidden"}>
          <header class="hero">
          ${this._scene(isOn)}
          <span class="badge">${isOn ? modeLabel : "꺼짐"}</span>
          <div class="hero-copy">
            <span class="eyebrow">${this._config.eyebrow}</span>
            <h2>${this._config.title}</h2>
            <div class="chips" aria-label="현재 상태 요약">
              <span class="chip">${isOn ? "운전 중" : "전원 꺼짐"}</span>
              <span class="chip">${current == null ? "온도 정보 없음" : `현재 ${Number(current).toFixed(1)}°C`}</span>
              <span class="chip">${humidity == null ? "습도 정보 없음" : `습도 ${humidity}%`}</span>
            </div>
          </div>
        </header>

        <div class="body">
          ${modalPresentation ? "" : `
            <button class="details-toggle collapse-toggle" type="button" data-action="details" aria-expanded="true" aria-controls="${detailsId}">
              <span>상세 조작 접기</span>
              <span aria-hidden="true">⌃</span>
            </button>
          `}
          <section class="power-row">
            <span class="icon-tile">${this._icon("air")}</span>
            <span class="row-copy">
              <strong>에어컨 전원</strong>
              <span>${isOn ? `${modeLabel} · 희망 ${Number(target).toFixed(1)}°C` : "전원을 켜면 마지막 모드로 시작해요"}</span>
            </span>
            ${this._switch("power", isOn, `${this._config.title} 전원`)}
          </section>

          <section class="temperature-panel ${isOn ? "" : "disabled"}" aria-labelledby="target-heading">
            <div class="section-heading">
              <div>
                <span class="kicker">TARGET TEMPERATURE</span>
                <h3 id="target-heading">희망 온도</h3>
              </div>
              <span class="range">${attributes.min_temp ?? 16}–${attributes.max_temp ?? 30}°C</span>
            </div>
            <div class="stepper">
              <button type="button" data-action="temperature" data-delta="-${attributes.target_temp_step ?? 0.5}" aria-label="희망 온도 ${(attributes.target_temp_step ?? 0.5)}도 낮추기" ${!isOn || target <= (attributes.min_temp ?? 16) ? "disabled" : ""}>−</button>
              <output aria-live="polite">${Number(target).toFixed(1)}<small>°C</small></output>
              <button type="button" data-action="temperature" data-delta="${attributes.target_temp_step ?? 0.5}" aria-label="희망 온도 ${(attributes.target_temp_step ?? 0.5)}도 높이기" ${!isOn || target >= (attributes.max_temp ?? 30) ? "disabled" : ""}>+</button>
            </div>
          </section>

          <section class="control-section ${isOn ? "" : "disabled"}" aria-labelledby="mode-heading">
            <div class="section-heading">
              <div>
                <span class="kicker">OPERATION</span>
                <h3 id="mode-heading">운전 모드</h3>
              </div>
            </div>
            <div class="segments modes" role="tablist" aria-label="운전 모드">
              ${modeOptions.map((mode) => `<button type="button" role="tab" tabindex="${rovingMode === mode ? "0" : "-1"}" data-action="hvac_mode" data-value="${mode}" aria-selected="${state === mode}" ${!isOn ? "disabled" : ""}>${HVAC_LABELS[mode] ?? mode}</button>`).join("")}
            </div>
          </section>

          <section class="control-section fan-section ${isOn ? "" : "disabled"}" aria-labelledby="fan-heading">
            <div class="section-heading">
              <div>
                <span class="kicker">AIR FLOW</span>
                <h3 id="fan-heading">바람 세기</h3>
              </div>
            </div>
            <div class="segments fans" role="tablist" aria-label="바람 세기">
              ${fanOptions.map((fan) => `<button type="button" role="tab" tabindex="${rovingFan === fan ? "0" : "-1"}" data-action="fan_mode" data-value="${fan}" aria-selected="${attributes.fan_mode === fan}" ${!isOn ? "disabled" : ""}>${FAN_LABELS[fan] ?? fan}</button>`).join("")}
            </div>
          </section>

          <section class="toggle-list" aria-label="바람 방향과 절전">
            <div class="toggle-row">
              <span class="icon-tile">${this._icon("swing")}</span>
              <span class="row-copy"><strong>상하 바람</strong><span>바람을 위아래로 움직여요</span></span>
              ${this._switch("swing_mode", isOn && attributes.swing_mode === "on", "상하 바람", !isOn)}
            </div>
            <div class="toggle-row">
              <span class="icon-tile">${this._icon("horizontal")}</span>
              <span class="row-copy"><strong>좌우 바람</strong><span>바람을 좌우로 움직여요</span></span>
              ${this._switch("swing_horizontal_mode", isOn && attributes.swing_horizontal_mode === "on", "좌우 바람", !isOn)}
            </div>
            ${this._config.energy_saving_entity ? `
              <div class="toggle-row">
                <span class="icon-tile energy">${this._icon("leaf")}</span>
                <span class="row-copy"><strong>에너지 절약</strong><span>소비 전력을 아껴서 운전해요</span></span>
                ${this._switch("energy_saving", energySaving, "에너지 절약", !isOn)}
              </div>
            ` : ""}
          </section>

          <footer class="metrics" aria-label="에어컨 상태 정보">
            <span><i>${this._icon("humidity")}</i><small>현재 습도</small><strong>${humidity == null ? "—" : `${humidity}%`}</strong></span>
            <span><i>${this._icon("filter")}</i><small>필터 잔여</small><strong>${filter == null ? "—" : `${filter}h`}</strong></span>
            <span><i>${this._icon("energy")}</i><small>오늘 에너지</small><strong>${energy == null ? "—" : `${Number(energy).toFixed(1)}Wh`}</strong></span>
          </footer>
        </div>
        </div>
        ${modalPresentation ? `
            </div>
          </dialog>
        ` : ""}
        <p class="sr-only" aria-live="polite" id="announcement"></p>
      </article>`;

    this.shadowRoot.querySelectorAll("[data-action]").forEach((control) => {
      control.addEventListener("click", (event) => this._handleAction(event.currentTarget));
    });
    this.shadowRoot.querySelectorAll(".segments[role='tablist']").forEach((tablist) => {
      tablist.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        const tabs = [...tablist.querySelectorAll("[role='tab']:not(:disabled)")];
        const currentIndex = tabs.indexOf(event.target);
        if (currentIndex === -1 || tabs.length < 2) return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const next = tabs[(currentIndex + direction + tabs.length) % tabs.length];
        tabs.forEach((tab) => { tab.tabIndex = tab === next ? 0 : -1; });
        next.focus();
        next.click();
      });
    });
    const launcher = this.shadowRoot.querySelector(".modal-launcher");
    launcher?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      this._handleAction(event.currentTarget);
    });
    const dialog = this.shadowRoot.querySelector(".details-dialog");
    if (dialog) {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
      dialog.addEventListener("close", () => {
        this._dialogOpen = false;
        document.documentElement.style.overflow = this._pageOverflow;
        const currentLauncher = this.shadowRoot.querySelector(".modal-launcher");
        currentLauncher?.setAttribute("aria-expanded", "false");
        currentLauncher?.focus();
      });
      if (this._dialogOpen) {
        dialog.showModal();
        if (this._focusDialogOnRender) {
          this._focusDialogOnRender = false;
          this.shadowRoot.querySelector(".dialog-close")?.focus();
        }
      }
    }
  }

  _handleAction(control) {
    const action = control.dataset.action;
    if (action === "details") {
      if (this._config.details_presentation === "modal") {
        const dialog = this.shadowRoot.querySelector(".details-dialog");
        if (dialog?.open) {
          dialog.close();
        } else {
          this._dialogOpen = true;
          this._focusDialogOnRender = true;
          this._pageOverflow = document.documentElement.style.overflow;
          document.documentElement.style.overflow = "hidden";
          this._render();
        }
        return;
      }
      this._expanded = !this._expanded;
      this._render();
      const focusTarget = this._expanded
        ? ".collapse-toggle"
        : ".compact-summary .details-toggle";
      this.shadowRoot.querySelector(focusTarget)?.focus();
      this.dispatchEvent(new Event("ll-rebuild", { bubbles: true, composed: true }));
      return;
    }

    if (!this._hass || control.disabled) return;
    const climate = this._entity(this._config.entity);
    const attributes = climate?.attributes ?? {};
    const entityId = this._config.entity;
    let call;

    if (action === "power") {
      const isOn = !["off", "unavailable", "unknown"].includes(climate?.state);
      call = ["climate", isOn ? "turn_off" : "turn_on", { entity_id: entityId }];
    } else if (action === "temperature") {
      const step = Number(control.dataset.delta);
      const current = attributes.temperature ?? this._config.fallback_temperature;
      const temperature = Math.min(attributes.max_temp ?? 30, Math.max(attributes.min_temp ?? 16, current + step));
      call = ["climate", "set_temperature", { entity_id: entityId, temperature }];
    } else if (action === "hvac_mode") {
      call = ["climate", "set_hvac_mode", { entity_id: entityId, hvac_mode: control.dataset.value }];
    } else if (action === "fan_mode") {
      call = ["climate", "set_fan_mode", { entity_id: entityId, fan_mode: control.dataset.value }];
    } else if (action === "swing_mode") {
      call = ["climate", "set_swing_mode", { entity_id: entityId, swing_mode: attributes.swing_mode === "on" ? "off" : "on" }];
    } else if (action === "swing_horizontal_mode") {
      call = ["climate", "set_swing_horizontal_mode", { entity_id: entityId, swing_horizontal_mode: attributes.swing_horizontal_mode === "on" ? "off" : "on" }];
    } else if (action === "energy_saving") {
      const saving = this._entity(this._config.energy_saving_entity)?.state === "on";
      call = ["switch", saving ? "turn_off" : "turn_on", { entity_id: this._config.energy_saving_entity }];
    }

    if (!call) return;
    this._hass.callService(...call);
    const announcement = this.shadowRoot.querySelector("#announcement");
    if (announcement) announcement.textContent = `${call[0]}.${call[1]} 요청됨`;
  }

  _styles() {
    return `
      ${deviceCompactStyles}
      :host {
        --surface-card: #FFFFFF;
        --surface-soft: #F7F5F0;
        --surface-pressed: #ECE8E0;
        --text-primary: #1A1A18;
        --text-secondary: #716D64;
        --text-tertiary: #9A958A;
        --border-subtle: rgba(26, 26, 24, .08);
        --accent-climate: #3D6FE0;
        --accent-climate-deep: #284EA8;
        --accent-climate-tint: #EAF0FF;
        --accent-on: #0E9AA7;
        --accent-energy: #2FA36B;
        --motion-micro: 140ms;
        --motion-standard: 220ms;
        --ease-standard: cubic-bezier(.2, .8, .2, 1);
        --device-card-surface: var(--surface-card);
        --device-card-border: var(--border-subtle);
        --device-focus-ring: color-mix(in srgb, var(--accent-climate) 54%, white);
        display: block;
        color: var(--text-primary);
        font-family: "Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-synthesis: none;
      }
      * { box-sizing: border-box; }
      button { font: inherit; }
      button:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--accent-climate) 54%, white);
        outline-offset: 3px;
      }
      [hidden] { display: none !important; }
      .modal-launcher .scene-photo {
        transition: filter var(--motion-standard) var(--ease-standard), transform var(--motion-standard) var(--ease-standard);
      }
      .modal-launcher:hover .scene-photo { transform: scale(1.015); }
      .compact-actions {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        min-height: 64px;
        padding: 10px 14px 10px 18px;
      }
      .details-toggle {
        display: flex;
        min-width: 0;
        min-height: 44px;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 0 12px;
        border: 0;
        border-radius: 12px;
        background: var(--surface-soft);
        color: var(--text-primary);
        cursor: pointer;
        font-size: 13px;
        font-weight: 700;
        text-align: left;
      }
      .details-toggle:hover { background: var(--surface-pressed); }
      .collapse-toggle {
        width: 100%;
        margin-top: 12px;
        color: var(--accent-climate-deep);
      }
      .details-panel { animation: details-in var(--motion-standard) var(--ease-standard); }
      .details-dialog {
        width: min(460px, calc(100vw - 24px));
        max-width: none;
        max-height: calc(100dvh - 24px);
        padding: 0;
        overflow: hidden;
        border: 0;
        border-radius: 28px;
        background: transparent;
        box-shadow: 0 28px 80px rgba(26, 26, 24, .28);
        opacity: 0;
        transform: scale(.96);
        transition:
          opacity var(--motion-standard) var(--ease-standard),
          transform var(--motion-standard) var(--ease-standard),
          display var(--motion-standard) allow-discrete,
          overlay var(--motion-standard) allow-discrete;
      }
      .details-dialog[open] {
        opacity: 1;
        transform: scale(1);
      }
      @starting-style {
        .details-dialog[open] {
          opacity: 0;
          transform: scale(.96);
        }
      }
      .details-dialog::backdrop {
        background: rgba(26, 26, 24, .34);
        backdrop-filter: blur(10px);
        opacity: 0;
        transition:
          opacity var(--motion-standard) var(--ease-standard),
          display var(--motion-standard) allow-discrete,
          overlay var(--motion-standard) allow-discrete;
      }
      .details-dialog[open]::backdrop { opacity: 1; }
      @starting-style {
        .details-dialog[open]::backdrop { opacity: 0; }
      }
      .dialog-scroll {
        max-height: calc(100dvh - 24px);
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-gutter: stable;
      }
      .details-dialog .details-panel {
        background: var(--surface-card);
      }
      .details-dialog .badge { right: 64px; }
      .dialog-close {
        position: absolute;
        z-index: 4;
        top: 14px;
        right: 14px;
        display: grid;
        width: 44px;
        height: 44px;
        place-items: center;
        padding: 0;
        border: 1px solid rgba(255, 255, 255, .38);
        border-radius: 50%;
        background: rgba(20, 20, 18, .46);
        color: white;
        cursor: pointer;
        backdrop-filter: blur(10px);
      }
      .dialog-close:hover { background: rgba(20, 20, 18, .62); }
      @keyframes details-in {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .hero {
        position: relative;
        min-height: 244px;
        isolation: isolate;
      }
      .scene, .photo-scene { position: absolute; inset: 0; width: 100%; height: 100%; }
      .scene { object-fit: cover; }
      .photo-scene { overflow: hidden; background: #DAD5CD; }
      .scene-photo {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 20%;
        transition: filter var(--motion-standard) var(--ease-standard);
      }
      .is-on .scene-photo { filter: saturate(.9) contrast(1.03) brightness(1.05); }
      .is-off .scene-photo { filter: saturate(.56) contrast(.94) brightness(.7) sepia(.08); }
      .photo-shade {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(8, 18, 35, 0) 28%, rgba(8, 18, 35, .12) 48%, rgba(8, 18, 35, .84) 100%);
        backdrop-filter: blur(0);
      }
      .photo-shade::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 42%;
        height: 28px;
        background: linear-gradient(90deg, rgba(8, 18, 35, .88), rgba(8, 18, 35, 0));
        backdrop-filter: blur(10px);
      }
      .is-off .photo-shade {
        background: linear-gradient(180deg, rgba(20, 20, 18, .1) 18%, rgba(20, 20, 18, .26) 48%, rgba(20, 20, 18, .9) 100%);
      }
      .airflow {
        position: absolute;
        top: 25%;
        left: 47%;
        display: flex;
        gap: 18px;
        transform: translateX(-50%) rotate(-5deg);
        opacity: .68;
        filter: blur(2px);
      }
      .airflow i {
        display: block;
        width: 7px;
        height: 112px;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(145, 220, 245, .08), rgba(117, 206, 238, .74), rgba(117, 206, 238, 0));
        transform: rotate(6deg);
      }
      .airflow i:nth-child(2) { height: 132px; transform: translateY(6px) rotate(-2deg); }
      .airflow i:nth-child(3) { height: 104px; transform: translateY(2px) rotate(-11deg); }
      .badge {
        position: absolute;
        z-index: 2;
        top: 16px;
        right: 16px;
        padding: 6px 11px;
        border-radius: 999px;
        background: rgba(20, 20, 18, .48);
        color: white;
        font-size: 11px;
        font-weight: 700;
        backdrop-filter: blur(8px);
      }
      .hero-copy {
        position: absolute;
        z-index: 2;
        right: 20px;
        bottom: 20px;
        left: 20px;
        color: white;
      }
      .eyebrow, .kicker {
        display: block;
        font-size: 11px;
        font-weight: 700;
        line-height: 1.3;
        letter-spacing: .12em;
      }
      .hero .eyebrow { margin-bottom: 7px; }
      .hero h2 {
        max-width: 340px;
        margin: 0;
        font-size: 24px;
        font-weight: 800;
        line-height: 1.25;
        letter-spacing: -.02em;
        word-break: keep-all;
      }
      .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 13px; }
      .chip {
        padding: 6px 10px;
        border: 1px solid rgba(255, 255, 255, .42);
        border-radius: 999px;
        background: rgba(255, 255, 255, .86);
        color: #343431;
        font-size: 12px;
        font-weight: 600;
        backdrop-filter: blur(8px);
      }
      .body { padding: 0 20px 20px; }
      .power-row, .toggle-row {
        display: grid;
        grid-template-columns: 40px minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
      }
      .power-row { min-height: 76px; }
      .toggle-row {
        min-height: 68px;
        border-top: 1px solid var(--border-subtle);
      }
      .toggle-row:first-child { border-top: 0; }
      .icon-tile {
        display: grid;
        width: 36px;
        height: 36px;
        place-items: center;
        border-radius: 50%;
        background: var(--accent-climate-tint);
        color: var(--accent-climate-deep);
      }
      .icon-tile.energy { background: #EAF6EF; color: var(--accent-energy); }
      svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      .scene { fill: initial; stroke: initial; }
      .row-copy { min-width: 0; }
      .row-copy strong { display: block; font-size: 15px; font-weight: 650; line-height: 1.45; }
      .row-copy span { display: block; margin-top: 2px; color: var(--text-secondary); font-size: 12px; line-height: 1.4; }
      .switch {
        position: relative;
        width: 52px;
        height: 44px;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: transparent;
        cursor: pointer;
      }
      .switch::before {
        content: "";
        position: absolute;
        inset: 6px 0;
        border-radius: 999px;
        background: var(--text-tertiary);
        transition: background-color var(--motion-standard) var(--ease-standard);
      }
      .switch::after {
        content: "";
        position: absolute;
        top: 10px;
        left: 4px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 2px 7px rgba(26, 26, 24, .22);
        transform: translateX(0);
        transition: transform var(--motion-standard) var(--ease-standard);
      }
      .switch[aria-checked="true"]::before { background: var(--accent-on); }
      .switch[aria-checked="true"]::after { transform: translateX(20px); }
      .switch:active::after { transform: translateX(0) scale(.9); }
      .switch[aria-checked="true"]:active::after { transform: translateX(20px) scale(.9); }
      .switch:disabled { cursor: not-allowed; opacity: .36; }
      .temperature-panel, .control-section {
        padding: 18px;
        border-radius: 18px;
        background: var(--surface-soft);
        box-shadow: inset 0 0 0 1px var(--border-subtle);
      }
      .control-section { margin-top: 12px; }
      .section-heading {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: end;
        margin-bottom: 14px;
      }
      .kicker { margin-bottom: 4px; color: var(--accent-climate-deep); font-size: 9px; }
      h3 { margin: 0; font-size: 15px; line-height: 1.3; }
      .range { color: var(--text-secondary); font-size: 12px; font-weight: 600; white-space: nowrap; }
      .stepper { display: grid; grid-template-columns: 48px 1fr 48px; gap: 12px; align-items: center; }
      .stepper button {
        min-height: 48px;
        border: 0;
        border-radius: 14px;
        background: white;
        color: var(--accent-climate-deep);
        cursor: pointer;
        font-size: 22px;
        box-shadow: inset 0 0 0 1px var(--border-subtle);
        transition: transform var(--motion-micro) ease-out, background-color var(--motion-micro) ease-out;
      }
      .stepper button:hover { background: var(--accent-climate-tint); }
      .stepper button:active { transform: scale(.96); }
      .stepper button:disabled { cursor: not-allowed; opacity: .35; }
      .stepper output { text-align: center; font-size: 40px; font-weight: 700; line-height: 1; letter-spacing: -.04em; }
      .stepper output small { margin-left: 2px; font-size: 17px; letter-spacing: 0; }
      .segments {
        display: grid;
        gap: 4px;
        padding: 4px;
        border-radius: 13px;
        background: var(--surface-pressed);
      }
      .segments.modes { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .segments.fans {
        grid-template-columns: repeat(6, minmax(44px, 1fr));
        overflow-x: auto;
        scrollbar-width: none;
      }
      .segments.fans::-webkit-scrollbar { display: none; }
      .segments button {
        min-height: 44px;
        padding: 0 6px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 14px;
        font-weight: 650;
        transition: color var(--motion-micro) ease-out, background-color var(--motion-standard) var(--ease-standard), transform var(--motion-micro) ease-out;
      }
      .segments button:hover { color: var(--text-primary); }
      .segments button:active { transform: scale(.97); }
      .segments button[aria-selected="true"] {
        background: white;
        color: var(--accent-climate-deep);
        box-shadow: 0 3px 10px rgba(26, 26, 24, .08);
      }
      .segments button:disabled { cursor: not-allowed; opacity: .45; }
      .disabled { opacity: .62; }
      .toggle-list { margin-top: 8px; }
      .metrics {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
        margin-top: 12px;
      }
      .metrics > span {
        min-width: 0;
        padding: 12px 8px;
        border-radius: 14px;
        background: var(--surface-soft);
        text-align: center;
      }
      .metrics i { display: grid; height: 24px; place-items: center; color: var(--accent-climate-deep); }
      .metrics i svg { width: 17px; height: 17px; }
      .metrics small { display: block; margin-top: 5px; color: var(--text-secondary); font-size: 10px; line-height: 1.3; }
      .metrics strong { display: block; margin-top: 3px; overflow: hidden; font-size: 13px; line-height: 1.3; text-overflow: ellipsis; white-space: nowrap; }
      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
      @media (max-width: 420px) {
        .details-dialog {
          width: calc(100vw - 16px);
          max-height: calc(100dvh - 16px);
          border-radius: 24px;
        }
        .dialog-scroll { max-height: calc(100dvh - 16px); }
        .hero { min-height: 232px; }
        .body { padding-right: 16px; padding-left: 16px; }
        .hero-copy { right: 16px; bottom: 16px; left: 16px; }
        .hero h2 { font-size: 22px; }
        .chip { font-size: 11px; }
        .fan-section { padding-right: 12px; padding-left: 12px; }
        .segments.fans { gap: 2px; padding: 3px; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { transition-duration: .01ms; animation-duration: .01ms; }
        .modal-launcher:hover .scene-photo { transform: none; }
      }
    `;
  }
}

if (!customElements.get("ha-design-climate-card")) {
  customElements.define("ha-design-climate-card", HaDesignClimateCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "ha-design-climate-card")) {
  window.customCards.push({
    type: "ha-design-climate-card",
    name: "ha-design Climate Card",
    preview: true,
    description: "상태 반영 히어로와 전체 에어컨 조작을 제공하는 카드",
    documentationURL: "https://github.com/jaeryun/ha-design",
    getEntitySuggestion: (_hass, entityId) => (
      entityId.startsWith("climate.")
        ? { config: { type: "custom:ha-design-climate-card", entity: entityId } }
        : null
    ),
  });
}
