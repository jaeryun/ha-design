import {
  deviceCompactStyles,
  patchCardDom,
} from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";
import { CAMERA_REQUIRED_FIELDS, cameraConfigForm } from "./ha-design-camera-card.config.js?v=camera-events-20260901-3";
import { CameraEventController } from "./ha-design-camera-event-controller.js?v=camera-ios-hls-20260902-1";
import { renderCameraEventsView } from "./ha-design-camera-events.template.js?v=camera-ios-hls-20260902-1";
import { renderCameraCard } from "./ha-design-camera-card.template.js?v=camera-ios-hls-20260902-1";
import { cameraCardStyles } from "./ha-design-camera-card.styles.js?v=camera-20260831-8";
import { cameraEventStyles } from "./ha-design-camera-events.styles.js?v=camera-date-range-20260902-6";
import { cameraEventDetailStyles } from "./ha-design-camera-events-detail.styles.js?v=camera-recording-toolbar-20260902-4";
import { cameraControlStyles } from "./ha-design-camera-controls.styles.js?v=camera-20260831-7";
import { cameraFullscreenStyles } from "./ha-design-camera-fullscreen.styles.js?v=camera-20260831-7";
import { changeCameraNumber, configureCameraPlayer, configureCameraRecordingPlayer, downloadCameraSnapshot, pressCameraButton, selectCameraOption, toggleCameraSwitch } from "./ha-design-camera-actions.js?v=camera-recording-20260901-1";

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
    this._videoFullscreen = false;
    this._view = "camera";
    this._eventController = new CameraEventController(this);
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
    this._eventController.invalidate();
    this._replaceDom = true;
    this._render();
    if (this._dialogOpen) void this._eventController.load();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() { return 4; }

  getGridOptions() { return { columns: 12, min_columns: 4, max_columns: 12 }; }

  disconnectedCallback() {
    this._eventController.resetRecording();
    this._unlockPageScroll();
  }

  _render() {
    if (!this._config || !this._hass) return;
    const eventsView = renderCameraEventsView({
      state: this._eventController.state,
      title: this._config.title ?? "거실 카메라",
    });
    const html = `
      <style>${deviceCompactStyles}${cameraCardStyles}${cameraControlStyles}${cameraFullscreenStyles}${cameraEventStyles}${cameraEventDetailStyles}</style>
      ${renderCameraCard({
        config: this._config,
        hass: this._hass,
        dialogOpen: this._dialogOpen,
        videoFullscreen: this._videoFullscreen,
        view: this._view,
        events: this._eventController.state.events,
        eventsView,
      })}`;
    patchCardDom(this.shadowRoot, html, this._replaceDom);
    this._replaceDom = false;
    this._syncDialog();
    this._syncPlayer();
  }

  _syncDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog) return;
    if (!this._boundDialogs.has(dialog)) {
      this._boundDialogs.add(dialog);
      dialog.addEventListener("cancel", (event) => {
        if (this._videoFullscreen) {
          event.preventDefault();
          this._setVideoFullscreen(false);
          return;
        }
        if (this._view === "events") {
          event.preventDefault();
          this._eventController.back();
          return;
        }
        this._dialogOpen = false;
      });
      dialog.addEventListener("close", () => {
        this._eventController.resetRecording();
        this._dialogOpen = false;
        this._videoFullscreen = false;
        this._view = "camera";
        this._render();
        this._unlockPageScroll();
        this._syncExpanded(false);
        this.shadowRoot.querySelector(".camera-launcher")?.focus();
      });
    }
    if (this._dialogOpen && !dialog.open) dialog.showModal();
  }

  _syncPlayer() {
    configureCameraPlayer(this.shadowRoot.querySelector("ha-design-camera-webrtc-player.live-video"), this._hass, this._config.camera_entity, this._videoFullscreen ? "contain" : "cover");
    configureCameraRecordingPlayer(
      this.shadowRoot.querySelector("ha-hls-player.activity-recording-video"),
      this._eventController.state.recording.url,
    );
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
    this._videoFullscreen = false;
    this._view = "camera";
    this._lockPageScroll();
    this._render();
    this._syncExpanded(true);
    this.shadowRoot.querySelector(".dialog-close")?.focus();
    if (this._eventController.state.status === "idle") {
      void this._eventController.load();
    }
  }

  _closeDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog?.open) return;
    this._eventController.resetRecording();
    dialog.close();
    this._dialogOpen = false;
    this._videoFullscreen = false;
    this._view = "camera";
    this._render();
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

  _setVideoFullscreen(value) {
    this._videoFullscreen = value;
    this._render();
    const action = value ? "fullscreen-exit" : "fullscreen";
    this.shadowRoot.querySelector(`[data-action="${action}"]`)?.focus();
  }

  _handleClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".camera-launcher")) {
      this._openDialog();
      return;
    }
    if (this._eventController.handleClick(target)) return;
    const actionTarget = target.closest("[data-action]");
    const action = actionTarget?.dataset.action;
    if (action === "dismiss") this._closeDialog();
    else if (["privacy", "recording", "auto-track"].includes(action)) {
      toggleCameraSwitch(this._hass, actionTarget.dataset.entity);
    } else if (action === "angle-increase") {
      changeCameraNumber(this._hass, this._config.movement_angle_entity, 5);
    } else if (action === "angle-decrease") {
      changeCameraNumber(this._hass, this._config.movement_angle_entity, -5);
    } else if (action === "fullscreen") {
      this._setVideoFullscreen(true);
    } else if (action === "fullscreen-exit") {
      this._setVideoFullscreen(false);
    } else if (action === "snapshot") {
      downloadCameraSnapshot(this._hass, this._config.camera_entity);
    }
    const direction = target.closest("[data-direction]");
    if (direction && !direction.disabled) {
      pressCameraButton(this._hass, direction.dataset.entity);
    }
    const sensitivity = target.closest("[data-option]");
    if (sensitivity && !sensitivity.disabled) {
      selectCameraOption(this._hass, sensitivity.dataset.entity, sensitivity.dataset.option);
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
