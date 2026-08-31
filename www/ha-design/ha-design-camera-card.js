import {
  deviceCompactStyles,
  patchCardDom,
} from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";
import {
  CAMERA_REQUIRED_FIELDS,
  cameraConfigForm,
} from "./ha-design-camera-card.config.js?v=camera-20260831-1";
import { loadCameraHistory } from "./ha-design-camera-events.js?v=camera-20260831-1";
import { renderCameraEventsView } from "./ha-design-camera-events.template.js?v=camera-20260831-1";
import { renderCameraCard } from "./ha-design-camera-card.template.js?v=camera-20260831-1";
import { cameraCardStyles } from "./ha-design-camera-card.styles.js?v=camera-20260831-1";
import { cameraEventStyles } from "./ha-design-camera-events.styles.js?v=camera-20260831-1";
import { cameraControlStyles } from "./ha-design-camera-controls.styles.js?v=camera-20260831-1";
import { changeCameraNumber, downloadCameraSnapshot, pressCameraButton, selectCameraOption, toggleCameraSwitch } from "./ha-design-camera-actions.js?v=camera-20260831-1";

class HaDesignCameraCard extends HTMLElement {
  static getConfigForm() {
    return cameraConfigForm();
  }

  static getStubConfig() {
    return { title: "거실 카메라", eyebrow: "TAPO · C225 · LOCAL" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._dialogOpen = false;
    this._view = "camera";
    this._events = [];
    this._eventsStatus = "idle";
    this._eventFilter = "all";
    this._visibleEventCount = 50;
    this._replaceDom = true;
    this._boundDialogs = new WeakSet();
    this._pageOverflow = null;
    this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
    this.shadowRoot.addEventListener("keydown", (event) => this._handleKeydown(event));
  }

  setConfig(config) {
    if (!config) throw new Error("카메라 카드 설정이 필요합니다");
    const missing = CAMERA_REQUIRED_FIELDS.find((key) => !config[key]);
    if (missing) throw new Error(`${missing} 설정이 필요합니다`);
    this._config = { ...config };
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
    return { columns: 12, min_columns: 4, max_columns: 12 };
  }

  disconnectedCallback() {
    this._unlockPageScroll();
  }

  _render() {
    if (!this._config || !this._hass) return;
    const eventsView = renderCameraEventsView({
      events: this._events,
      status: this._eventsStatus,
      filter: this._eventFilter,
      visibleCount: this._visibleEventCount,
    });
    const html = `
      <style>${deviceCompactStyles}${cameraCardStyles}${cameraControlStyles}${cameraEventStyles}</style>
      ${renderCameraCard({
        config: this._config,
        hass: this._hass,
        dialogOpen: this._dialogOpen,
        view: this._view,
        events: this._events,
        eventsView,
      })}`;
    patchCardDom(this.shadowRoot, html, this._replaceDom);
    this._replaceDom = false;
    this._syncDialog();
    this._syncStream();
  }

  _syncDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog) return;
    if (!this._boundDialogs.has(dialog)) {
      this._boundDialogs.add(dialog);
      dialog.addEventListener("cancel", (event) => {
        if (this._view === "events") {
          event.preventDefault();
          this._showCameraView();
          return;
        }
        this._dialogOpen = false;
      });
      dialog.addEventListener("close", () => {
        this._dialogOpen = false;
        this._view = "camera";
        this._unlockPageScroll();
        this._syncExpanded(false);
        this.shadowRoot.querySelector(".camera-launcher")?.focus();
      });
    }
    if (this._dialogOpen && !dialog.open) dialog.showModal();
  }

  _syncStream() {
    const stream = this.shadowRoot.querySelector("ha-camera-stream");
    if (!stream) return;
    stream.hass = this._hass;
    stream.stateObj = this._hass.states[this._config.camera_entity];
    stream.controls = false;
    stream.muted = true;
  }

  _syncExpanded(expanded) {
    this.shadowRoot
      .querySelector(".camera-launcher")
      ?.setAttribute("aria-expanded", String(expanded));
  }

  _openDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog || dialog.open) return;
    this._dialogOpen = true;
    this._view = "camera";
    this._lockPageScroll();
    dialog.showModal();
    this._syncExpanded(true);
    this.shadowRoot.querySelector(".dialog-close")?.focus();
  }

  _closeDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog?.open) return;
    dialog.close();
    this._dialogOpen = false;
    this._view = "camera";
    this._unlockPageScroll();
    this._syncExpanded(false);
    this.shadowRoot.querySelector(".camera-launcher")?.focus();
  }

  _lockPageScroll() {
    if (this._pageOverflow) return;
    this._pageOverflow = {
      document: document.documentElement.style.overflow,
      body: document.body.style.overflow,
    };
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  _unlockPageScroll() {
    if (!this._pageOverflow) return;
    document.documentElement.style.overflow = this._pageOverflow.document;
    document.body.style.overflow = this._pageOverflow.body;
    this._pageOverflow = null;
  }

  async _showEvents() {
    this._view = "events";
    this._eventFilter = "all";
    this._visibleEventCount = 50;
    this._render();
    this.shadowRoot.querySelector('[data-action="camera-view"]')?.focus();
    if (this._eventsStatus === "idle") await this._loadEvents();
  }

  _showCameraView() {
    this._view = "camera";
    this._render();
    this.shadowRoot.querySelector('[data-action="events"]')?.focus();
  }

  async _loadEvents() {
    this._eventsStatus = "loading";
    this._render();
    try {
      this._events = await loadCameraHistory(this._hass, this._config);
      this._eventsStatus = "ready";
    } catch {
      this._events = [];
      this._eventsStatus = "error";
    }
    this._render();
    this.dispatchEvent(new CustomEvent("camera-events-loaded"));
  }

  _handleClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".camera-launcher")) {
      this._openDialog();
      return;
    }
    const actionTarget = target.closest("[data-action]");
    const action = actionTarget?.dataset.action;
    if (action === "dismiss") this._closeDialog();
    else if (action === "events") void this._showEvents();
    else if (action === "camera-view") this._showCameraView();
    else if (action === "events-more") {
      this._visibleEventCount += 50;
      this._render();
    } else if (["privacy", "recording", "auto-track"].includes(action)) {
      toggleCameraSwitch(this._hass, actionTarget.dataset.entity);
    } else if (action === "angle-increase") {
      changeCameraNumber(this._hass, this._config.movement_angle_entity, 5);
    } else if (action === "angle-decrease") {
      changeCameraNumber(this._hass, this._config.movement_angle_entity, -5);
    }
    else if (action === "fullscreen") {
      this.shadowRoot.querySelector(".live-frame")?.requestFullscreen();
    } else if (action === "snapshot") {
      downloadCameraSnapshot(this._hass, this._config.camera_entity);
    }
    const filter = target.closest("[data-filter]")?.dataset.filter;
    if (filter) {
      this._eventFilter = filter;
      this._visibleEventCount = 50;
      this._render();
    }
    const direction = target.closest("[data-direction]");
    if (direction && !direction.disabled) {
      pressCameraButton(this._hass, direction.dataset.entity);
    }
    const sensitivity = target.closest("[data-option]");
    if (sensitivity && !sensitivity.disabled) {
      selectCameraOption(
        this._hass,
        sensitivity.dataset.entity,
        sensitivity.dataset.option,
      );
    }
  }

  _handleKeydown(event) {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(".camera-launcher")) return;
    if (!["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    this._openDialog();
  }
}

if (!customElements.get("ha-design-camera-card")) {
  customElements.define("ha-design-camera-card", HaDesignCameraCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "ha-design-camera-card")) {
  window.customCards.push({
    type: "ha-design-camera-card",
    name: "ha-design 카메라 카드",
    description: "Tapo 카메라와 Home Assistant 이벤트 기록을 로컬에서 제어합니다.",
    documentationURL: "https://github.com/jaeryun/ha-design",
    preview: true,
  });
}
