import {
  deviceCompactStyles,
  patchCardDom,
} from "./ha-design-device-compact.js?v=camera-native-lifecycle-20260902-1";
import { CAMERA_REQUIRED_FIELDS, cameraConfigForm } from "./ha-design-camera-card.config.js?v=camera-frigate-motion-20261011-1";
import { CameraEventController } from "./ha-design-camera-event-controller.js?v=camera-download-20261011-1";
import { renderCameraHistoryView } from "./ha-design-camera-events.template.js?v=camera-download-20261011-1";
import { renderCameraCard } from "./ha-design-camera-card.template.js?v=camera-frigate-motion-20261011-1";
import { configureCameraHistoryPlayer } from "./ha-design-camera-recording-player.js?v=camera-time-history-20260906-2";
import { cameraCardStyles } from "./ha-design-camera-card.styles.js?v=camera-history-dvr-20260926-1";
import { cameraEventStyles } from "./ha-design-camera-events.styles.js?v=camera-frigate-motion-20261011-1";
import { cameraEventDetailStyles } from "./ha-design-camera-events-detail.styles.js?v=camera-download-20261011-1";
import { cameraControlStyles } from "./ha-design-camera-controls.styles.js?v=camera-frigate-motion-20261011-1";
import { changeCameraNumber, configureCameraPlayer, downloadCameraSnapshot, pressCameraButton, toggleCameraSwitch } from "./ha-design-camera-actions.js?v=camera-frigate-motion-20261011-1";
import { CameraDownloadController } from "./ha-design-camera-download.js?v=camera-download-20261011-1";
import { renderCameraDownload } from "./ha-design-camera-download.template.js?v=camera-download-20261011-2";

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
    this._eventController = new CameraEventController(this);
    this._downloadController = new CameraDownloadController(this);
    this._replaceDom = true;
    this._boundDialogs = new WeakSet();
    this._pageOverflow = null;
    this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
    this.shadowRoot.addEventListener("keydown", (event) => this._handleKeydown(event));
    this.shadowRoot.addEventListener("input", event => this._downloadController.handleInput(event.target));
    this.shadowRoot.addEventListener("pointerdown", event => {
      if (event.target instanceof Element && this._eventController.handlePointer(event)) event.preventDefault();
    });
    this.shadowRoot.addEventListener("pointermove", event => this._eventController.handlePointerMove(event));
    for (const type of ["pointerup", "pointercancel"]) {
      this.shadowRoot.addEventListener(type, event => this._eventController.handlePointerUp(event));
    }
  }

  setConfig(config) {
    if (!config) throw new Error("카메라 카드 설정이 필요합니다");
    const missing = CAMERA_REQUIRED_FIELDS.find((key) => !config[key]);
    if (missing) throw new Error(`${missing} 설정이 필요합니다`);
    this._config = { ...config };
    this._eventController.invalidate();
    this._replaceDom = true;
    this._render();
    if (this._dialogOpen) {
      if (this._view === "history") this._eventController.showHistory();
    }
  }

  set hass(hass) {
    this._hass = hass;
    this._eventController.refreshClock();
    this._render();
  }

  getCardSize() { return 4; }

  getGridOptions() { return { columns: 12, min_columns: 4, max_columns: 12 }; }

  disconnectedCallback() {
    this._eventController.suspend();
    this._unlockPageScroll();
  }

  _render() {
    if (!this._config || !this._hass) return;
    const historyView = renderCameraHistoryView({ state: this._eventController.state, downloadView: renderCameraDownload(this._downloadController.state) });
    const html = `
      <style>${deviceCompactStyles}${cameraCardStyles}${cameraControlStyles}${cameraEventStyles}${cameraEventDetailStyles}</style>
      ${renderCameraCard({
        config: this._config,
        hass: this._hass,
        dialogOpen: this._dialogOpen,
        view: this._view,
        historyView,
      })}`;
    patchCardDom(this.shadowRoot, html, this._replaceDom);
    this._replaceDom = false;
    this._syncDialog();
    this._syncPlayer();
    this._downloadController.syncDialog();
  }

  _syncDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog) return;
    if (!this._boundDialogs.has(dialog)) {
      this._boundDialogs.add(dialog);
      dialog.addEventListener("cancel", (event) => {
        if (this._view === "history") {
          event.preventDefault();
          this._eventController.showCamera();
          return;
        }
        this._dialogOpen = false;
      });
      dialog.addEventListener("close", () => {
        this._eventController.suspend();
        this._dialogOpen = false;
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
    configureCameraPlayer(
      this.shadowRoot.querySelector("ha-design-camera-webrtc-player.live-video"),
      this._hass,
      this._config.camera_entity,
      "cover",
      this._config.stream_name,
    );
    const player = this.shadowRoot.querySelector(".activity-recording-video");
    const recording = this._eventController.state.recording;
    if (this._recordingBinding?.player === player && this._recordingBinding?.recording === recording) return;
    this._disposeRecordingPlayer();
    if (!player || recording.status !== "ready") return;
    const generation = this._eventController.recordingGeneration;
    const dispose = configureCameraHistoryPlayer(player, recording, {
      onTime: offset => {
        if (generation === this._eventController.recordingGeneration) this._eventController.playbackTime(offset);
      },
      onError: () => {
        if (generation !== this._eventController.recordingGeneration) return;
        recording.status = "error";
        this._render();
      },
    });
    this._recordingBinding = { player, recording, dispose };
  }

  _disposeRecordingPlayer() {
    this._recordingBinding?.dispose();
    this._recordingBinding = null;
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
    this._render();
    this._syncExpanded(true);
    this.shadowRoot.querySelector(".dialog-close")?.focus();
  }

  _closeDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog?.open) return;
    this._eventController.suspend();
    dialog.close();
    this._dialogOpen = false;
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

  _handleClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (this._downloadController.handleClick(event)) return;
    if (target.closest(".camera-launcher")) {
      this._openDialog();
      return;
    }
    if (this._eventController.handleClick(target)) return;
    const actionTarget = target.closest("[data-action]");
    const action = actionTarget?.dataset.action;
    if (action === "dismiss") this._closeDialog();
    else if (["privacy", "recording"].includes(action)) {
      toggleCameraSwitch(this._hass, actionTarget.dataset.entity);
    } else if (action === "angle-increase") {
      changeCameraNumber(this._hass, this._config.movement_angle_entity, 5);
    } else if (action === "angle-decrease") {
      changeCameraNumber(this._hass, this._config.movement_angle_entity, -5);
    } else if (action === "snapshot") {
      downloadCameraSnapshot(this._hass, this._config.camera_entity);
    }
    const direction = target.closest("[data-direction]");
    if (direction && !direction.disabled) {
      pressCameraButton(this._hass, direction.dataset.entity);
    }
  }

  _handleKeydown(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (this._eventController.handleKeydown(target, event.key)) {
      event.preventDefault();
      return;
    }
    if (!target.closest(".camera-launcher")) return;
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
    description: "Tapo 카메라를 제어하고 Frigate 녹화와 움직임 구간을 탐색합니다.",
    documentationURL: "https://github.com/jaeryun/ha-design",
    preview: true,
  });
}
