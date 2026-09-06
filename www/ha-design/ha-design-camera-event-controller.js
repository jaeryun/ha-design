import { cameraTimeZone, cameraTimelineEventGroups, loadCameraHistory } from "./ha-design-camera-events.js?v=camera-time-history-20260906-2";
import {
  cameraRecordingMasterPlaylistUrl, cameraRecordingMasterVariantPath, cameraRecordingProxyPath,
  cameraRecordingSource, cameraRecordingTimestamp, cameraRecordingWindow, createCameraRecordingState,
  parseCameraSegments, parseCameraWsJson,
} from "./ha-design-camera-recording.js?v=camera-time-history-20260906-2";
import {
  cameraStateCoverage, cameraStateInterval, createCameraEventState, invalidateCameraEventData,
  refreshCameraEventWindow, selectedCameraEpisodes, setCameraEventData,
} from "./ha-design-camera-event-state.js?v=camera-time-history-20260906-2";

export class CameraEventController {
  constructor(host) {
    this.host = host; this.clock = () => new Date(); this.state = createCameraEventState();
    this.loadGeneration = 0; this.dayGeneration = 0; this.recordingGeneration = 0; this.selectionRevision = 0;
  }
  refreshClock(now = this.clock()) {
    const previousStart = this.state.day.start;
    refreshCameraEventWindow(this.state, now, cameraTimeZone(this.host._hass));
    if (this.state.day.start !== previousStart) {
      this.dayGeneration++; this.resetRecording();
      this.state.segments = []; this.state.selectedEvents = []; this.state.coverageStatus = "unknown";
    }
  }
  show() {
    this.host._view = "events";
    // A slow sensor history request must not block recording discovery/playback.
    void this.load();
    void this.selectDay(this.state.days.at(-1).dateKey);
    this.host.shadowRoot.querySelector('[data-action="camera-view"]')?.focus();
  }
  invalidate() {
    this.suspend(); invalidateCameraEventData(this.state);
  }
  suspend() {
    this.loadGeneration++; this.dayGeneration++; this.resetRecording();
    this.timelineObserver?.disconnect(); this.timelineNode = null;
    if (this.state.status === "loading") this.state.status = "idle";
    if (this.state.coverageStatus === "loading") this.state.coverageStatus = "unknown";
  }
  showCamera() {
    this.suspend(); this.host._view = "camera"; this.host._render();
    this.host.shadowRoot.querySelector('[data-action="events"]')?.focus();
  }
  back() { this.showCamera(); }
  observeTimeline() {
    const node = this.host.shadowRoot.querySelector(".timeline-plot");
    if (node === this.timelineNode) return;
    this.timelineObserver?.disconnect(); this.timelineNode = node;
    if (!node) return;
    this.timelineObserver = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      if (width > 0 && Math.abs(width - this.state.timelineWidth) > 0.5) {
        this.state.timelineWidth = width; this.host._render();
      }
    });
    this.timelineObserver.observe(node);
  }
  groups() { return cameraTimelineEventGroups(selectedCameraEpisodes(this.state), this.state.timelineWidth, this.state.day); }
  handleClick(target) {
    const action = target.closest("[data-action]")?.dataset.action;
    if (action === "events") { this.show(); return true; }
    if (action === "camera-view") { this.showCamera(); return true; }
    if (this.host._view !== "events") return false;
    const date = target.closest("[data-event-date]")?.dataset.eventDate;
    if (date) { void this.selectDay(date); return true; }
    if (action === "history-retry") {
      void this.load();
      void this.selectDay(this.state.selectedDate);
      return true;
    }
    if (action === "recording-retry") { void this.seek(this.state.selectedTime); return true; }
    if (["previous-recording", "next-recording"].includes(action)) {
      const coverage = cameraStateCoverage(this.state), interval = cameraStateInterval(this.state);
      const previous = action === "previous-recording";
      const item = previous ? coverage.findLast(i => i.type === "recorded" && i.end <= interval.start)
        : coverage.find(i => i.type === "recorded" && i.start >= interval.end);
      if (item) void this.seek(previous ? Math.max(item.start, item.end - 1) : item.start);
      this.focusTimeline(); return true;
    }
    return false;
  }
  focusTimeline() { this.host.shadowRoot.querySelector("[data-activity-timeline]")?.focus(); }
  handlePointer(event) {
    if (this.host._view !== "events") return false;
    const surface = event.target.closest("[data-activity-timeline]");
    if (!surface) return false;
    this.refreshClock();
    const box = surface.querySelector(".timeline-plot").getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
    const timestamp = this.state.day.start + position * (this.state.day.end - this.state.day.start);
    let group;
    if (event.clientY <= box.top + 30) {
      group = this.groups().find(g => Math.abs(g.centerPercent / 100 * box.width - (event.clientX - box.left)) <= Math.max(12, (g.end - g.start) / (this.state.day.end - this.state.day.start) * box.width / 2));
    }
    void this.seek(group?.timestamp ?? timestamp, group?.events ?? []); this.focusTimeline(); return true;
  }
  handleKeydown(target, key) {
    if (!target.closest("[data-activity-timeline]")) return false;
    if (!["ArrowLeft", "ArrowRight", "Home", "End", "Enter", " "].includes(key)) return false;
    this.refreshClock();
    let timestamp = this.state.selectedTime, selected = [];
    if (key === "Home") timestamp = this.state.day.start;
    else if (key === "End") timestamp = Math.min(this.state.day.end - 0.001, this.state.now);
    else if (key === "ArrowLeft") timestamp -= 60;
    else if (key === "ArrowRight") timestamp += 60;
    else {
      const nearest = this.groups().sort((a, b) => Math.abs(a.timestamp - timestamp) - Math.abs(b.timestamp - timestamp))[0];
      if (nearest) { timestamp = nearest.timestamp; selected = nearest.events; }
    }
    void this.seek(timestamp, selected); this.focusTimeline(); return true;
  }
  async load(now = this.clock()) {
    const generation = ++this.loadGeneration;
    const hass = this.host._hass, config = this.host._config;
    this.refreshClock(now);
    this.state.status = "loading"; this.state.summaryStatus = "loading"; this.host._render();
    const source = cameraRecordingSource(hass, config);
    await Promise.all([
      (async () => {
        try {
          const events = await loadCameraHistory(hass, config, now);
          if (generation !== this.loadGeneration) return;
          setCameraEventData(this.state, events);
        } catch {
          if (generation !== this.loadGeneration) return;
          this.state.events = []; this.state.episodes = []; this.state.status = "error";
        }
      })(),
      (async () => {
        try {
          if (!source) {
            this.state.summaryStatus = "unknown"; this.state.summary = []; return;
          }
          const summary = parseCameraWsJson(await hass.callWS({ type: "frigate/recordings/summary", ...source, timezone: this.state.timeZone }));
          if (generation !== this.loadGeneration) return;
          if (!Array.isArray(summary) || summary.some(row => typeof row.day !== "string" || !Array.isArray(row.hours))) throw new Error("Invalid recording summary");
          this.state.summary = summary; this.state.summaryStatus = "ready";
        } catch {
          if (generation !== this.loadGeneration) return;
          this.state.summary = []; this.state.summaryStatus = "error";
        }
      })(),
    ]);
    if (generation !== this.loadGeneration) return;
    this.host._render(); this.host.dispatchEvent(new CustomEvent("camera-events-loaded"));
    return true;
  }
  async selectDay(date) {
    this.refreshClock();
    const day = this.state.days.find(d => d.dateKey === date);
    if (!day) return;
    const generation = ++this.dayGeneration;
    const initialSelection = this.selectionRevision;
    this.resetRecording();
    Object.assign(this.state, { selectedDate: date, day, selectedTime: Math.min(day.start + 43200, this.state.now),
      segments: [], selectedEvents: [], coverageStatus: "loading", coverageUntil: Math.floor(Math.min(day.end, this.state.now)) });
    this.host._render(); this.host.shadowRoot.querySelector(`[data-event-date="${date}"]`)?.focus();
    const source = cameraRecordingSource(this.host._hass, this.host._config);
    try {
      if (!source) this.state.coverageStatus = "unknown";
      else {
        const rows = await this.host._hass.callWS({ type: "frigate/recordings/get", ...source, after: Math.floor(day.start), before: this.state.coverageUntil });
        if (generation !== this.dayGeneration) return;
        this.state.segments = parseCameraSegments(rows);
        this.state.coverageStatus = "ready";
      }
    } catch {
      if (generation !== this.dayGeneration) return;
      this.state.segments = []; this.state.coverageStatus = "error";
    }
    if (generation !== this.dayGeneration) return;
    if (initialSelection === this.selectionRevision) {
      const first = cameraStateCoverage(this.state).find(i => i.type === "recorded");
      await this.seek(first?.start ?? this.state.selectedTime);
    } else {
      await this.seek(this.state.selectedTime, this.state.selectedEvents);
    }
    if (generation !== this.dayGeneration) return;
    this.host.dispatchEvent(new CustomEvent("camera-day-loaded"));
  }
  resetRecording() {
    this.recordingGeneration++; this.recordingAbort?.abort(); this.recordingAbort = null;
    this.host._disposeRecordingPlayer?.(); this.state.recording = createCameraRecordingState();
  }
  async seek(timestamp, selectedEvents = []) {
    this.selectionRevision++;
    this.resetRecording();
    this.state.selectedTime = Math.max(this.state.day.start, Math.min(timestamp, this.state.day.end - 0.001, this.state.now));
    this.state.selectedEvents = selectedEvents;
    this.host._render();
    if (cameraStateInterval(this.state)?.type === "recorded") await this.playRecording();
  }
  playbackTime(offset) {
    const timestamp = cameraRecordingTimestamp(this.state.recording.segments ?? [], offset);
    if (timestamp === null) return;
    this.state.selectedTime = Math.max(this.state.day.start, Math.min(timestamp, this.state.day.end - 0.001, this.state.now));
    this.host._render();
  }
  async playRecording() {
    const window = cameraRecordingWindow(this.state.selectedTime, this.state.segments, this.state.day, this.state.now);
    const masterPath = cameraRecordingProxyPath(this.host._hass, this.host._config, window, "master.m3u8");
    const generation = ++this.recordingGeneration;
    const abort = this.recordingAbort = new AbortController();
    this.state.recording = { ...createCameraRecordingState(), ...window, status: "loading" };
    this.host._render();
    try {
      if (!masterPath) throw new Error("No recording range");
      const hass = this.host._hass;
      const expires = Math.ceil(window.durationSeconds) + 600;
      const signedMaster = await hass.callWS({ type: "auth/sign_path", path: masterPath, expires });
      if (generation !== this.recordingGeneration) return;
      const masterResponse = await fetch(hass.hassUrl(signedMaster.path), { cache: "no-store", signal: abort.signal });
      if (generation !== this.recordingGeneration) return;
      if (!masterResponse.ok) throw Object.assign(new Error("Master playlist unavailable"), { status: masterResponse.status });
      const master = await masterResponse.text();
      if (generation !== this.recordingGeneration) return;
      const childPath = cameraRecordingMasterVariantPath(master, masterPath);
      if (!childPath) throw new Error("Invalid master playlist");
      const signedChild = await hass.callWS({ type: "auth/sign_path", path: childPath, expires });
      if (generation !== this.recordingGeneration) return;
      const nativeUrl = hass.hassUrl(signedChild.path);
      const childResponse = await fetch(nativeUrl, { cache: "no-store", signal: abort.signal });
      if (generation !== this.recordingGeneration) return;
      if (!childResponse.ok) throw Object.assign(new Error("Child playlist unavailable"), { status: childResponse.status });
      const child = await childResponse.text();
      if (generation !== this.recordingGeneration) return;
      const url = cameraRecordingMasterPlaylistUrl(master, nativeUrl);
      if (!child.trimStart().startsWith("#EXTM3U") || !url) throw new Error("Invalid HLS playlist");
      Object.assign(this.state.recording, { status: "ready", url, nativeUrl });
    } catch (error) {
      if (generation !== this.recordingGeneration) return;
      this.state.recording.status = error.status === 404 ? "unavailable" : "error";
    }
    if (generation !== this.recordingGeneration) return;
    this.host._render(); this.host.dispatchEvent(new CustomEvent("camera-recording-loaded"));
  }
}
