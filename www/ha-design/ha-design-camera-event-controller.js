import { loadCameraHistory } from "./ha-design-camera-events.js?v=camera-events-20260901-3";
import {
  cameraRecordingProxyPath,
  cameraRecordingWindow,
  createCameraRecordingState,
} from "./ha-design-camera-recording.js?v=camera-recording-20260901-1";
import {
  applyCameraEventAction,
  createCameraEventState,
  invalidateCameraEventData,
  refreshCameraEventWindow,
  resetCameraEventState,
  setCameraEventData,
  setCameraEventStatus,
  selectedCameraEpisode,
} from "./ha-design-camera-event-state.js?v=camera-detail-20260902-2";

export class CameraEventController {
  constructor(host) {
    this.host = host;
    this.state = createCameraEventState();
    this.loadGeneration = 0;
    this.recordingGeneration = 0;
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
    this.recordingGeneration += 1;
    invalidateCameraEventData(this.state);
  }

  showCamera() {
    this.resetRecording();
    this.host._view = "camera";
    this.host._render();
    this.host.shadowRoot.querySelector('[data-action="events"]')?.focus();
  }

  back() {
    if (!this.state.selectedEpisodeId) {
      this.showCamera();
      return;
    }
    this.resetRecording();
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
    if (action === "recording-play") {
      void this.playRecording();
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

  resetRecording() {
    this.recordingGeneration += 1;
    this.state.recording = createCameraRecordingState();
  }

  async playRecording() {
    const episode = selectedCameraEpisode(this.state);
    const window = cameraRecordingWindow(episode);
    const path = cameraRecordingProxyPath(
      this.host._hass,
      this.host._config,
      window,
    );
    const generation = ++this.recordingGeneration;
    this.state.recording = {
      ...createCameraRecordingState(),
      ...window,
      status: "loading",
    };
    this.host._render();
    if (!path) {
      this.state.recording.status = "error";
      this.host._render();
      return;
    }
    try {
      const signed = await this.host._hass.callWS({
        type: "auth/sign_path",
        path,
        expires: 600,
      });
      if (generation !== this.recordingGeneration) return;
      const response = await fetch(this.host._hass.hassUrl(signed.path), {
        cache: "no-store",
      });
      if (generation !== this.recordingGeneration) return;
      if (!response.ok) {
        this.state.recording.status = response.status === 404
          ? "unavailable"
          : "error";
      } else {
        const manifest = await response.text();
        if (generation !== this.recordingGeneration) return;
        if (manifest.startsWith("#EXTM3U")) {
          this.state.recording.status = "ready";
          this.state.recording.url = signed.path;
        } else {
          this.state.recording.status = "error";
        }
      }
    } catch {
      if (generation !== this.recordingGeneration) return;
      this.state.recording.status = "error";
    }
    this.host._render();
    this.host.dispatchEvent(new CustomEvent("camera-recording-loaded"));
  }
}
