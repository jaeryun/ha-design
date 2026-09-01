import { loadCameraHistory } from "./ha-design-camera-events.js?v=camera-events-20260901-3";
import {
  applyCameraEventAction,
  createCameraEventState,
  invalidateCameraEventData,
  refreshCameraEventWindow,
  resetCameraEventState,
  setCameraEventData,
  setCameraEventStatus,
} from "./ha-design-camera-event-state.js?v=camera-events-20260901-3";

export class CameraEventController {
  constructor(host) {
    this.host = host;
    this.state = createCameraEventState();
    this.loadGeneration = 0;
  }

  show() {
    this.host._view = "events";
    resetCameraEventState(this.state);
    this.host._render();
    this.host.shadowRoot.querySelector('[data-action="camera-view"]')?.focus();
    if (this.state.status === "idle") void this.load();
  }

  invalidate() {
    this.loadGeneration += 1;
    invalidateCameraEventData(this.state);
  }

  showCamera() {
    this.host._view = "camera";
    this.host._render();
    this.host.shadowRoot.querySelector('[data-action="events"]')?.focus();
  }

  back() {
    if (!this.state.selectedEpisodeId) {
      this.showCamera();
      return;
    }
    const focus = `[data-episode-id="${this.state.selectedEpisodeId}"]`;
    this.state.selectedEpisodeId = null;
    this.host._render();
    this.host.shadowRoot.querySelector(focus)?.focus();
    this.host.shadowRoot.querySelector(".dialog-scroll").scrollTop =
      this.state.listScroll;
  }

  handleClick(target) {
    const action = target.closest("[data-action]")?.dataset.action;
    if (action === "events") {
      this.show();
      return true;
    }
    if (action === "camera-view") {
      this.showCamera();
      return true;
    }
    if (this.host._view !== "events") return false;
    const dialogScroll = this.host.shadowRoot.querySelector(".dialog-scroll");
    const result = applyCameraEventAction(this.state, target);
    if (!result) return false;
    if (result.scroll === "top") this.state.listScroll = dialogScroll.scrollTop;
    this.host._render();
    const nextScroll = this.host.shadowRoot.querySelector(".dialog-scroll");
    this.host.shadowRoot.querySelector(result.focus)?.focus();
    if (result.scroll === "top") nextScroll.scrollTop = 0;
    if (result.scroll === "restore") nextScroll.scrollTop = this.state.listScroll;
    return true;
  }

  async load(now = new Date()) {
    const generation = ++this.loadGeneration;
    refreshCameraEventWindow(this.state, now);
    setCameraEventStatus(this.state, "loading");
    this.host._render();
    try {
      const events = await loadCameraHistory(
        this.host._hass,
        this.host._config,
        now,
      );
      if (generation !== this.loadGeneration) return;
      setCameraEventData(this.state, events);
    } catch {
      if (generation !== this.loadGeneration) return;
      this.state.events = [];
      this.state.episodes = [];
      setCameraEventStatus(this.state, "error");
    }
    this.host._render();
    this.host.dispatchEvent(new CustomEvent("camera-events-loaded"));
  }
}
