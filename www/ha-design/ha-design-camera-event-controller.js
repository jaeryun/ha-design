import { cameraTimeZone, cameraTimelineEventGroups, loadCameraHistory } from "./ha-design-camera-events.js?v=camera-time-history-20260906-2";
import { cameraHistoryTime } from "./ha-design-camera-events-detail.template.js?v=camera-history-dvr-20260926-1";
import {
  cameraRecordingMasterPlaylistUrl, cameraRecordingMasterVariantPath, cameraRecordingProxyPath,
  cameraRecordingSnap, cameraRecordingSource, cameraRecordingTimestamp, cameraRecordingWindow, createCameraRecordingState,
  parseCameraSegments, parseCameraWsJson,
} from "./ha-design-camera-recording.js?v=camera-block-nav-20260927-1";
import {
  cameraStateCoverage, cameraStateInterval, cameraStateNeighbour, createCameraEventState, invalidateCameraEventData,
  refreshCameraEventWindow, selectedCameraEpisodes, setCameraEventData,
} from "./ha-design-camera-event-state.js?v=camera-block-nav-20260927-1";

// 재생 가능한 앞 구간을 남기고 최신 녹화로 들어간다. 1시간 VOD 창은 선택 시각 뒤로만
// 재생되므로, 현재 시각에 딱 붙여 열면 볼 구간이 남지 않는다.
const RECORDING_EDGE_MARGIN = 60;
const intervalDistance = (interval, time) =>
  time < interval.start ? interval.start - time : time >= interval.end ? time - interval.end : 0;

export class CameraEventController {
  constructor(host) {
    this.host = host; this.clock = () => new Date(); this.state = createCameraEventState();
    this.loadGeneration = 0; this.dayGeneration = 0; this.recordingGeneration = 0; this.selectionRevision = 0;
    this.frigateSource = null; this.frigateSourceEntity = null; this.scrub = null;
  }
  // 카메라가 오프라인이면 entity attribute가 사라진다. config로 고정한 값 또는 마지막으로
  // 확인한 값을 기억해 두어 과거 영상 조회가 실시간 연결에 묶이지 않게 한다.
  recordingSource() {
    const entity = this.host._config?.camera_entity;
    const live = cameraRecordingSource(this.host._hass, this.host._config);
    if (live) { this.frigateSource = live; this.frigateSourceEntity = entity; return live; }
    return this.frigateSourceEntity === entity ? this.frigateSource : null;
  }
  refreshClock(now = this.clock()) {
    const previousStart = this.state.day.start;
    refreshCameraEventWindow(this.state, now, cameraTimeZone(this.host._hass));
    if (this.state.day.start !== previousStart) {
      this.dayGeneration++; this.resetRecording();
      this.state.segments = []; this.state.selectedEvents = []; this.state.coverageStatus = "unknown";
    }
  }
  showHistory() {
    this.host._view = "history";
    // A slow sensor history request must not block recording discovery/playback.
    void this.load();
    void this.selectDay(this.state.days.at(-1).dateKey);
    this.host.shadowRoot.querySelector('[data-action="history-view"]')?.focus();
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
    this.host.shadowRoot.querySelector('[data-action="live-view"]')?.focus();
  }
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
    if (action === "history-view") { this.showHistory(); return true; }
    if (action === "live-view") { this.showCamera(); return true; }
    if (this.host._view !== "history") return false;
    const date = target.closest("[data-event-date]")?.dataset.eventDate;
    if (date) { void this.selectDay(date); return true; }
    if (action === "history-retry") {
      void this.load();
      void this.selectDay(this.state.selectedDate);
      return true;
    }
    if (action === "recording-retry") { void this.seek(this.state.selectedTime); return true; }
    if (action === "previous-recording" || action === "next-recording") {
      const previous = action === "previous-recording";
      const item = cameraStateNeighbour(this.state, previous);
      if (item) void this.seek(previous ? Math.max(item.start, item.end - 1) : item.start);
      this.focusTimeline(); return true;
    }
    return false;
  }
  focusTimeline() { this.host.shadowRoot.querySelector("[data-activity-timeline]")?.focus(); }
  handlePointer(event) {
    if (this.host._view !== "history") return false;
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
    this.scrub = { pointerId: event.pointerId, box, moved: false, origin: timestamp };
    surface.setPointerCapture?.(event.pointerId);
    void this.seek(group?.timestamp ?? timestamp, group?.events ?? []); this.focusTimeline(); return true;
  }
  handlePointerMove(event) {
    const scrub = this.scrub;
    if (!scrub || event.pointerId !== scrub.pointerId) return false;
    const position = Math.max(0, Math.min(1, (event.clientX - scrub.box.left) / scrub.box.width));
    const timestamp = this.state.day.start + position * (this.state.day.end - this.state.day.start);
    scrub.moved = scrub.moved || Math.abs(timestamp - scrub.origin) > 1;
    this.previewTime(timestamp);
    return true;
  }
  handlePointerUp(event) {
    const scrub = this.scrub;
    if (!scrub || event.pointerId !== scrub.pointerId) return false;
    this.scrub = null;
    if (!scrub.moved) return true;
    void this.seek(this.state.selectedTime);
    return true;
  }
  // 드래그 중에는 playhead와 시각 표시만 따라오게 하고 VOD/플레이리스트는 다시 받지 않는다.
  previewTime(timestamp) {
    const { day } = this.state;
    this.state.selectedTime = Math.max(day.start, Math.min(timestamp, day.end - 0.001, this.state.now));
    const root = this.host.shadowRoot;
    const text = cameraHistoryTime(this.state.selectedTime, this.state);
    const percent = (this.state.selectedTime - day.start) / (day.end - day.start) * 100;
    root.querySelector(".playhead")?.style.setProperty("inset-inline-start", `${percent}%`);
    const output = root.querySelector(".selected-time");
    if (output) output.textContent = text;
    const surface = root.querySelector("[data-activity-timeline]");
    if (surface) {
      surface.setAttribute("aria-valuenow", String(Math.floor(this.state.selectedTime - day.start)));
      surface.setAttribute("aria-valuetext", text);
    }
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
    const source = this.recordingSource();
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
    // 기준 시각: 오늘은 현재(라이브 끝), 지난 날짜는 현지 정오.
    const seed = this.state.now < day.end ? this.state.now : day.start + 43200;
    Object.assign(this.state, { selectedDate: date, day, selectedTime: seed,
      segments: [], selectedEvents: [], coverageStatus: "loading", coverageUntil: Math.floor(Math.min(day.end, this.state.now)) });
    this.host._render(); this.host.shadowRoot.querySelector(`[data-event-date="${date}"]`)?.focus();
    const source = this.recordingSource();
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
      await this.seek(this.nearestRecorded());
    } else {
      await this.seek(this.state.selectedTime, this.state.selectedEvents);
    }
    if (generation !== this.dayGeneration) return;
    this.host.dispatchEvent(new CustomEvent("camera-day-loaded"));
  }
  // 선택 날짜를 열면 기준 시각(오늘이면 현재, 지난 날짜면 낮 12시)에 가장 가까운 녹화
  // 지점으로 들어간다. 현재 시각에 딱 붙여 열면 1시간 VOD 창에 볼 구간이 남지 않는다.
  nearestRecorded() {
    const seed = this.state.selectedTime;
    const nearest = cameraStateCoverage(this.state)
      .filter(i => i.type === "recorded")
      .reduce((best, interval) => {
        const distance = intervalDistance(interval, seed);
        return !best || distance < best.distance ? { interval, distance } : best;
      }, null);
    if (!nearest) return seed;
    const latest = Math.max(nearest.interval.start, nearest.interval.end - RECORDING_EDGE_MARGIN);
    return Math.max(nearest.interval.start, Math.min(seed, latest));
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
    // timeline 입력은 항상 실제 녹화 지점으로 해석한다. 공백을 누르면 "녹화 없음"을 보여주는
    // 대신 가장 가까운 녹화로 붙고, 그래서 짧은 녹화도 주변 넓은 영역에서 잡힌다.
    if (this.state.segments.length) this.state.selectedTime = cameraRecordingSnap(this.state.segments, this.state.selectedTime);
    const recorded = cameraStateInterval(this.state)?.type === "recorded";
    this.host._render();
    if (recorded) await this.playRecording();
  }
  playbackTime(offset) {
    // 드래그 중에는 playhead가 손가락을 따라야 한다. 아직 재생 중인 이전 구간의
    // timeupdate가 미리보기를 덮어쓰지 않게 무시한다.
    if (this.scrub) return;
    const timestamp = cameraRecordingTimestamp(this.state.recording.segments ?? [], offset);
    if (timestamp === null) return;
    this.state.selectedTime = Math.max(this.state.day.start, Math.min(timestamp, this.state.day.end - 0.001, this.state.now));
    this.host._render();
  }
  async playRecording() {
    const window = cameraRecordingWindow(this.state.selectedTime, this.state.segments, this.state.day, this.state.now);
    const masterPath = cameraRecordingProxyPath(this.recordingSource(), window, "master.m3u8");
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
