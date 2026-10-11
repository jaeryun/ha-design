import { cameraDayBounds, localCameraDateKey } from "./ha-design-camera-events.js?v=camera-frigate-motion-20261011-1";
import { cameraRecordingOffset, cameraRecordingTimestamp, cameraRecordingWindow, loadCameraRecording, parseCameraSegments } from "./ha-design-camera-recording.js?v=camera-visual-trim-20261011-1";
import { configureCameraHistoryPlayer } from "./ha-design-camera-recording-player.js?v=camera-visual-trim-20261011-1";

export const cameraTrimViewport = (start, end, min, max, span = Math.max(120, (end - start) * 1.5)) => {
  const width = Math.min(max - min, Math.max(30, span));
  const left = Math.max(min, Math.min((start + end - width) / 2, max - width));
  return { start: left, end: left + width };
};
export const cameraTrimBoundary = (range, edge, time, min, max) => edge === "start"
  ? { start: Math.max(min, Math.min(Math.round(time), range.end - 1)), end: range.end }
  : { start: range.start, end: Math.min(max, Math.max(Math.round(time), range.start + 1)) };
export const cameraTrimPreviewTime = (range, edge) => edge === "end" ? Math.max(range.start, range.end - 0.05) : range.start;

export class CameraTrimPreview {
  constructor(owner) {
    this.owner = owner; this.session = 0; this.days = new Map(); this.pending = null; this.viewportGeneration = 0; this.playGeneration = 0;
  }
  get host() { return this.owner.host; }
  get state() { return this.owner.state; }
  reset(history) {
    this.dispose();
    this.days.set(history.day.dateKey, Promise.resolve({ day: history.day, segments: history.segments }));
  }
  dispose() {
    this.session++; this.viewportGeneration++; this.playGeneration++; this.abort?.abort(); this.abort = null;
    this.binding?.dispose(); this.binding = null; this.player = null; this.recording = null;
    this.days.clear(); this.pending = null;
  }
  async dayAt(time) {
    const state = this.state, session = this.session;
    const key = localCameraDateKey(time * 1000, state.timeZone);
    if (!this.days.has(key)) {
      const day = cameraDayBounds(key, state.timeZone);
      const promise = this.host._hass.callWS({ type: "frigate/recordings/get", ...state.source, after: day.start, before: Math.floor(Math.min(day.end, state.max)) })
        .then(rows => {
          if (session !== this.session) throw new DOMException("Closed", "AbortError");
          return { day, segments: parseCameraSegments(rows) };
        }).catch(error => { if (session === this.session) this.days.delete(key); throw error; });
      this.days.set(key, promise);
    }
    return this.days.get(key);
  }
  async loadViewport() {
    const state = this.state, generation = ++this.viewportGeneration, session = this.session;
    state.editor.coverageStatus = "loading";
    this.host._render();
    try {
      const segments = [];
      for (let time = state.editor.viewport.start; time < state.editor.viewport.end;) {
        const data = await this.dayAt(time);
        if (session !== this.session || generation !== this.viewportGeneration) return;
        segments.push(...data.segments); time = data.day.end;
      }
      state.editor.segments = segments.sort((a, b) => a.start - b.start);
      state.editor.coverageStatus = "ready";
    } catch {
      if (session !== this.session || generation !== this.viewportGeneration) return;
      state.editor.coverageStatus = "error";
    }
    this.host._render();
  }
  request(time, playing = false) {
    if (!this.state.open) return;
    this.playGeneration++;
    Object.assign(this.state.preview, { target: Math.max(this.state.min, Math.min(time, this.state.max - 0.001)), playing, searching: false, status: "seeking" });
    if (!playing) this.binding?.pause();
    this.host._render();
    if (this.host.shadowRoot.querySelector(".trim-preview-video")) void this.update();
  }
  async update() {
    if (this.pending || !this.state.open) return;
    const token = this.pending = {}, session = this.session;
    try {
      while (this.state.open && session === this.session) {
        const time = this.state.preview.target;
        const data = await this.dayAt(time);
        if (session !== this.session) return;
        if (time !== this.state.preview.target) continue;
        const window = cameraRecordingWindow(time, data.segments, data.day, this.state.max);
        if (!window) {
          this.binding?.pause();
          Object.assign(this.state.preview, { status: "gap", shownTime: null, playing: false });
          this.host._render(); return;
        }
        if (!this.recording || this.recording.startEpoch !== window.startEpoch || this.recording.endEpoch !== window.endEpoch) {
          this.abort?.abort(); this.abort = new AbortController();
          const recording = await loadCameraRecording(this.host._hass, this.state.source, window, this.abort.signal);
          if (session !== this.session) return;
          // A drag may cross an hour while its old manifest is in flight.
          if (cameraRecordingOffset(recording.segments, this.state.preview.target) === null) continue;
          this.binding?.dispose(); this.binding = null;
          this.recording = recording;
          this.host._render();
        }
        this.seekTarget(); return;
      }
    } catch (error) {
      if (session !== this.session) return;
      this.fail(error);
    } finally {
      if (this.pending === token) this.pending = null;
    }
  }
  seekTarget() {
    const offset = cameraRecordingOffset(this.recording?.segments ?? [], this.state.preview.target);
    if (offset === null || !this.binding) return;
    // Single-flight seeking lets decoded frames appear during a drag instead of
    // constantly aborting the decoder. seeked then picks up the newest target.
    if (this.binding.video?.seeking) return;
    this.binding.seek(offset);
  }
  syncPlayer() {
    const player = this.host.shadowRoot.querySelector(".trim-preview-video");
    if (!player || !this.recording || !this.state.open || (this.binding && player === this.player)) return;
    this.binding?.dispose(); this.player = player;
    const session = this.session, recording = this.recording;
    this.binding = configureCameraHistoryPlayer(player, recording, {
      autoPlay: false, controls: false,
      onFrame: offset => { if (session === this.session && this.recording === recording) this.frame(offset); },
      onTime: offset => { if (session === this.session && this.recording === recording && this.state.preview.playing) this.playback(offset); },
      onEnded: () => { if (session === this.session) void this.nextWindow(); },
      onError: error => { if (session === this.session) this.fail(error); },
    });
  }
  frame(offset) {
    if (!this.state.open || !this.recording) return;
    const time = cameraRecordingTimestamp(this.recording.segments, offset), preview = this.state.preview;
    if (time === null || preview.searching || ["gap", "invalid", "error"].includes(preview.status)) return;
    if (preview.playing && preview.status === "ready") { this.playback(offset); return; }
    preview.shownTime = time;
    const matched = Math.abs(time - preview.target) < 0.15;
    preview.status = matched ? "ready" : "seeking";
    this.host._render();
    this.host.dispatchEvent(new CustomEvent("camera-trim-frame", { detail: { time, target: preview.target, matched } }));
    if (!matched) {
      if (cameraRecordingOffset(this.recording.segments, preview.target) === null) void this.update();
      else this.seekTarget();
    } else if (preview.playing) {
      const session = this.session;
      this.binding?.play()?.catch(error => { if (session === this.session) this.fail(error); });
    }
  }
  playback(offset) {
    if (this.state.preview.searching) return;
    const time = cameraRecordingTimestamp(this.recording.segments, offset);
    if (time === null) return;
    if (time >= this.state.editor.end) {
      this.request(cameraTrimPreviewTime(this.state.editor, "end"));
      return;
    }
    Object.assign(this.state.preview, { target: time, shownTime: time, status: "ready" });
    this.host._render();
  }
  async nextWindow() {
    if (!this.recording || !this.state.open || !this.state.preview.playing) return;
    this.state.preview.searching = true;
    await this.playFrom(this.recording.endEpoch);
  }
  async playFrom(from) {
    if (!this.state.open || !this.state.preview.playing) return;
    const session = this.session, generation = this.playGeneration, end = this.state.editor.end;
    try {
      for (let time = from; time < end;) {
        const data = await this.dayAt(time);
        if (session !== this.session || generation !== this.playGeneration || !this.state.preview.playing) return;
        const next = data.segments.find(segment => segment.end > time && segment.start < end);
        if (next) { this.request(Math.max(time, next.start), true); return; }
        time = data.day.end;
      }
      Object.assign(this.state.preview, { playing: false, searching: false, status: "gap", shownTime: null }); this.host._render();
    } catch (error) { if (session === this.session && generation === this.playGeneration) this.fail(error); }
  }
  playRange() {
    this.playGeneration++;
    if (this.state.preview.playing) {
      this.state.preview.playing = false; this.state.preview.searching = false; this.binding?.pause(); this.host._render();
    } else {
      this.binding?.pause();
      Object.assign(this.state.preview, { playing: true, searching: true, target: this.state.editor.start, status: "loading" });
      this.state.editor.active = "cursor"; this.host._render();
      void this.playFrom(this.state.editor.start);
    }
  }
  fail(error) {
    this.binding?.pause();
    Object.assign(this.state.preview, { status: "error", shownTime: null, playing: false, error: error?.status === 404 ? "저장된 영상을 찾을 수 없어요." : "미리보기 영상을 불러오지 못했어요." });
    this.recording = null; this.binding?.dispose(); this.binding = null;
    this.host._render();
  }
}
