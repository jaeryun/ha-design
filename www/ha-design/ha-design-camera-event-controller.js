import { cameraTimeZone, cameraEventSources, cameraUnavailableEventSources, loadCameraEvents } from "./ha-design-camera-events.js?v=camera-tapo-events-20261011-1";
import { cameraHistoryTime } from "./ha-design-camera-events-detail.template.js?v=camera-tapo-events-20261011-1";
import {
  loadCameraRecording,
  cameraRecordingSnap, cameraRecordingSource, cameraRecordingTimestamp, cameraRecordingWindow, createCameraRecordingState,
  parseCameraSegments, parseCameraWsJson,
} from "./ha-design-camera-recording.js?v=camera-tapo-events-20261011-1";
import {
  cameraStateCoverage, cameraStateInterval, cameraStateNeighbour, cameraVisibleEvents, createCameraEventState, invalidateCameraEventData,
  refreshCameraEventWindow,
} from "./ha-design-camera-event-state.js?v=camera-tapo-events-20261011-1";

// 재생 가능한 앞 구간을 남기고 최신 녹화로 들어간다. 1시간 VOD 창은 선택 시각 뒤로만
// 재생되므로, 현재 시각에 딱 붙여 열면 볼 구간이 남지 않는다.
const RECORDING_EDGE_MARGIN = 60;
const intervalDistance = (interval, time) =>
  time < interval.start ? interval.start - time : time >= interval.end ? time - interval.end : 0;

export class CameraEventController {
  constructor(host) {
    this.host = host; this.clock = () => new Date(); this.state = createCameraEventState();
    this.loadGeneration = 0; this.dayGeneration = 0; this.recordingGeneration = 0; this.eventsGeneration = 0;
    this.selectionRevision = 0; this.eventSignature = null;
    this.frigateSource = null; this.frigateSourceEntity = null; this.scrub = null;
    this.liveEvents = new Map();
  }
  // 카메라가 오프라인이면 entity attribute가 사라진다. config로 고정한 값 또는 마지막으로
  // 확인한 값을 기억해 두어 과거 영상 조회가 실시간 연결에 묶이지 않게 한다.
  recordingSource() {
    const entity = this.host._config?.camera_entity;
    const live = cameraRecordingSource(this.host._hass, this.host._config);
    if (live) { this.frigateSource = live; this.frigateSourceEntity = entity; return live; }
    return this.frigateSourceEntity === entity ? this.frigateSource : null;
  }
  // config.event_entities는 hass 상태와 무관하게 라벨을 유지한다. 지금 없는 entity는
  // unavailableEventSources로만 표시하고 과거 이벤트는 남긴다.
  syncEventSources() {
    const sources = cameraEventSources(this.host._config, this.host._hass);
    const signature = sources.map(source => source.entityId).join("|");
    // 첫 동기화는 구성 변경이 아니다. 이미 읽은 이력을 불필요하게 버리지 않는다.
    const changed = this.eventSignature !== null && signature !== this.eventSignature;
    this.eventSignature = signature;
    this.state.eventSources = sources;
    this.state.unavailableEventSources = cameraUnavailableEventSources(sources, this.host._hass);
    return changed;
  }
  invalidateEvents() {
    this.eventsGeneration++;
    this.liveEvents.clear();
    this.state.events = []; this.state.selectedEvent = null;
    this.state.eventsStatus = this.state.eventSources.length ? "idle" : "unconfigured";
  }
  // 지금 켜진 감지원은 레코더 기록이 아직 따라오지 않았을 수 있다. hass에서 실제로 본 on
  // 전환을 먼저 넣어 두고, 기록 조회가 끝나면 같은 목록에 다시 합쳐 지우지 않는다.
  mergeLiveEvent(entityId, time) {
    const source = this.state.eventSources.find(entry => entry.entityId === entityId);
    if (!source) return false;
    const id = `${entityId}-${time}`;
    if (this.state.events.some(event => event.id === id)) return false;
    const event = { id, entityId, label: source.label, time };
    this.liveEvents.set(id, event);
    this.state.events = [...this.state.events, event].sort((a, b) => a.time - b.time || a.entityId.localeCompare(b.entityId));
    return true;
  }
  applyLiveEvents() {
    if (!this.liveEvents.size) return;
    const { day } = this.state;
    const merged = new Map(this.state.events.map(event => [event.id, event]));
    // live 감지는 그 날짜에만 붙인다. 다른 날짜를 보는 동안에도 지우지 않고 남겨 두었다가
    // 그 날짜로 돌아오면 다시 붙는다(레코더 기록이 그 사이 도착했어도 dedupe된다).
    for (const event of this.liveEvents.values()) {
      if (event.time > day.start && event.time < day.end && !merged.has(event.id)) merged.set(event.id, event);
    }
    if (merged.size === this.state.events.length) return;
    this.state.events = [...merged.values()].sort((a, b) => a.time - b.time || a.entityId.localeCompare(b.entityId));
  }
  // 창(7일·현재 시각)과 감지원 구성을 맞춘다. 날짜가 넘어가면 그 날짜의 녹화·감지 상태를
  // 버리고, 다시 선택해야 하는지 여부를 돌려준다.
  updateWindow(now = this.clock()) {
    const previousStart = this.state.day.start;
    refreshCameraEventWindow(this.state, now, cameraTimeZone(this.host._hass));
    const dayChanged = this.state.day.start !== previousStart;
    const sourcesChanged = this.syncEventSources();
    if (!dayChanged) {
      if (!sourcesChanged) return false;
      // 감지원 구성이 바뀌면 그 날짜 이력은 더 이상 이 설정의 결과가 아니다.
      this.state.eventFilter = this.state.eventSources.some(source => source.entityId === this.state.eventFilter) ? this.state.eventFilter : null;
      this.invalidateEvents();
      return false;
    }
    this.host._downloadController?.close(false);
    this.dayGeneration++; this.resetRecording();
    this.state.segments = []; this.state.coverageStatus = "unknown";
    this.invalidateEvents();
    return true;
  }
  refreshClock(now = this.clock()) {
    // selectDay 안에서는 updateWindow만 쓴다. 여기서 다시 날짜를 열면 조회가 두 번 나간다.
    if (this.updateWindow(now) && this.host._view === "history") void this.selectDay(this.state.selectedDate);
  }
  // 카드의 hass 갱신마다 호출된다. 감지원의 실제 on 전환을 즉시 반영하고(레코더 기록은
  // 늦게 따라온다), 감지원 구성이 바뀔 때만 그 날짜 이력을 다시 읽는다. 재생 상태와 선택
  // 시각, 마커 선택은 건드리지 않는다.
  updateHass(previousHass) {
    const reconfigured = this.syncEventSources();
    if (reconfigured) {
      this.state.eventFilter = this.state.eventSources.some(source => source.entityId === this.state.eventFilter) ? this.state.eventFilter : null;
      this.invalidateEvents();
      if (this.host._view === "history" && this.state.eventSources.length) void this.loadEvents(this.state.day);
      return true;
    }
    if (this.host._view !== "history") return false;
    if (!this.state.eventSources.length) {
      if (this.state.eventsStatus !== "unconfigured") {
        this.state.eventsStatus = "unconfigured"; this.host._render(); return true;
      }
      return false;
    }
    let changed = false;
    const { day } = this.state;
    for (const source of this.state.eventSources) {
      const after = this.host._hass?.states?.[source.entityId], before = previousHass?.states?.[source.entityId];
      // off 전환과 속성만 바뀐 갱신은 새 감지가 아니다.
      if (after?.state !== "on" || before?.state === "on") continue;
      const time = Date.parse(after.last_changed) / 1000;
      // 브라우저 시계가 HA보다 조금 뒤질 수 있으므로 지금 시각이 아니라 그 날짜 끝을 경계로
      // 본다. 창 끝은 반열림이라 정확한 자정 감지는 다음 날짜에만 붙는다.
      if (!Number.isFinite(time) || time <= day.start || time >= day.end) continue;
      changed = this.mergeLiveEvent(source.entityId, time) || changed;
    }
    if (!changed) return false;
    this.resyncSelectedEvent();
    this.host._render();
    this.host.dispatchEvent(new CustomEvent("camera-events-loaded"));
    return true;
  }
  showHistory() {
    this.host._view = "history";
    void this.load();
    void this.selectDay(this.state.days.at(-1).dateKey);
    this.host.shadowRoot.querySelector('[data-action="history-view"]')?.focus();
  }
  invalidate() {
    this.suspend(); invalidateCameraEventData(this.state);
  }
  suspend() {
    this.host._downloadController?.close(false);
    this.loadGeneration++; this.dayGeneration++; this.eventsGeneration++; this.resetRecording();
    this.liveEvents.clear();
    if (this.state.coverageStatus === "loading") this.state.coverageStatus = "unknown";
    if (this.state.eventsStatus === "loading") this.state.eventsStatus = this.state.eventSources.length ? "idle" : "unconfigured";
  }
  showCamera() {
    this.suspend(); this.host._view = "camera"; this.host._render();
    this.host.shadowRoot.querySelector('[data-action="live-view"]')?.focus();
  }
  handleClick(target) {
    const action = target.closest("[data-action]")?.dataset.action;
    if (action === "history-view") { this.showHistory(); return true; }
    if (action === "live-view") { this.showCamera(); return true; }
    if (this.host._view !== "history") return false;
    const date = target.closest("[data-event-date]")?.dataset.eventDate;
    if (date) { void this.selectDay(date); return true; }
    const filter = target.closest("[data-event-filter]")?.dataset.eventFilter;
    if (filter !== undefined) {
      this.state.eventFilter = filter && filter !== "all" ? filter : null;
      this.host._render();
      return true;
    }
    if (action === "events-retry") { void this.loadEvents(this.state.day); return true; }
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
    let selected = null;
    if (event.clientY <= box.top + 30) {
      const tolerance = 12 / box.width * (this.state.day.end - this.state.day.start);
      selected = cameraVisibleEvents(this.state).reduce((best, item) =>
        Math.abs(item.time - timestamp) <= tolerance && (!best || Math.abs(item.time - timestamp) < Math.abs(best.time - timestamp)) ? item : best, null);
    }
    this.scrub = { pointerId: event.pointerId, box, moved: false, origin: timestamp };
    surface.setPointerCapture?.(event.pointerId);
    void this.seek(selected ? selected.time : timestamp, selected); this.focusTimeline(); return true;
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
    let timestamp = this.state.selectedTime, selected = null;
    if (key === "Home") timestamp = this.state.day.start;
    else if (key === "End") timestamp = Math.min(this.state.day.end - 0.001, this.state.now);
    else if (key === "ArrowLeft") timestamp -= 60;
    else if (key === "ArrowRight") timestamp += 60;
    else {
      selected = cameraVisibleEvents(this.state).reduce((best, item) =>
        !best || Math.abs(item.time - timestamp) < Math.abs(best.time - timestamp) ? item : best, null);
      if (selected) timestamp = selected.time;
    }
    void this.seek(timestamp, selected); this.focusTimeline(); return true;
  }
  async load(now = this.clock()) {
    const generation = ++this.loadGeneration;
    const hass = this.host._hass;
    this.refreshClock(now);
    this.state.summaryStatus = "loading"; this.host._render();
    const source = this.recordingSource();
    try {
      if (!source) {
        this.state.summaryStatus = "unknown"; this.state.summary = [];
      } else {
        const summary = parseCameraWsJson(await hass.callWS({ type: "frigate/recordings/summary", ...source, timezone: this.state.timeZone }));
        if (generation !== this.loadGeneration) return;
        if (!Array.isArray(summary) || summary.some(row => typeof row.day !== "string" || !Array.isArray(row.hours))) throw new Error("Invalid recording summary");
        this.state.summary = summary; this.state.summaryStatus = "ready";
      }
    } catch {
      if (generation !== this.loadGeneration) return;
      this.state.summary = []; this.state.summaryStatus = "error";
    }
    if (generation !== this.loadGeneration) return;
    this.host._render(); this.host.dispatchEvent(new CustomEvent("camera-summary-loaded"));
    return true;
  }
  // 감지 이력은 녹화 조회와 독립이다. 실패해도 eventsStatus만 error로 두고, 과거 영상
  // 재생·다운로드·요약은 그대로 동작한다.
  async loadEvents(day = this.state.day) {
    const generation = ++this.eventsGeneration;
    const sources = this.state.eventSources;
    if (!sources.length) {
      this.state.events = []; this.state.selectedEvent = null; this.state.eventsStatus = "unconfigured";
      this.host._render(); this.host.dispatchEvent(new CustomEvent("camera-events-loaded"));
      return [];
    }
    this.state.eventsStatus = "loading"; this.host._render();
    try {
      const events = await loadCameraEvents(this.host._hass, sources, day.start, Math.min(day.end, this.state.now));
      if (generation !== this.eventsGeneration) return [];
      this.state.events = events; this.state.eventsStatus = "ready";
    } catch {
      if (generation !== this.eventsGeneration) return [];
      this.state.events = []; this.state.eventsStatus = "error";
    }
    if (generation !== this.eventsGeneration) return [];
    this.applyLiveEvents();
    this.resyncSelectedEvent();
    this.host._render(); this.host.dispatchEvent(new CustomEvent("camera-events-loaded"));
    return this.state.events;
  }
  // 새로 읽은 목록에서 같은 이벤트를 다시 찾아 참조만 맞춘다. 사라졌어도 선택과 원래 감지
  // 시각은 유지한다(재생이 다른 지점으로 붙어도 맥락이 흔들리지 않게).
  resyncSelectedEvent() {
    const selected = this.state.selectedEvent;
    if (!selected) return;
    this.state.selectedEvent = this.state.events.find(event => event.id === selected.id) ?? selected;
  }
  async selectDay(date) {
    this.host._downloadController?.close(false);
    this.updateWindow();
    const day = this.state.days.find(d => d.dateKey === date);
    if (!day) return;
    const generation = ++this.dayGeneration;
    const initialSelection = this.selectionRevision;
    this.resetRecording();
    // 기준 시각: 오늘은 현재(라이브 끝), 지난 날짜는 현지 정오.
    const seed = this.state.now < day.end ? this.state.now : day.start + 43200;
    Object.assign(this.state, { selectedDate: date, day, selectedTime: seed,
      segments: [], coverageStatus: "loading", coverageUntil: Math.floor(Math.min(day.end, this.state.now)),
      events: [], selectedEvent: null });
    this.eventsGeneration++;
    this.state.eventsStatus = this.state.eventSources.length ? "loading" : "unconfigured";
    this.host._render(); this.host.shadowRoot.querySelector(`[data-event-date="${date}"]`)?.focus();
    const source = this.recordingSource();
    const recording = (async () => {
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
        await this.seek(this.state.selectedTime, this.state.selectedEvent);
      }
    })();
    await Promise.all([recording, this.loadEvents(day)]);
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
  async seek(timestamp, selectedEvent = null) {
    this.selectionRevision++;
    this.resetRecording();
    this.state.selectedTime = Math.max(this.state.day.start, Math.min(timestamp, this.state.day.end - 0.001, this.state.now));
    this.state.selectedEvent = selectedEvent;
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
    const generation = ++this.recordingGeneration;
    const abort = this.recordingAbort = new AbortController();
    this.state.recording = { ...createCameraRecordingState(), ...window, status: "loading" };
    this.host._render();
    try {
      const ready = await loadCameraRecording(this.host._hass, this.recordingSource(), window, abort.signal);
      if (generation !== this.recordingGeneration) return;
      Object.assign(this.state.recording, ready);
    } catch (error) {
      if (generation !== this.recordingGeneration) return;
      this.state.recording.status = error.status === 404 ? "unavailable" : "error";
    }
    if (generation !== this.recordingGeneration) return;
    this.host._render(); this.host.dispatchEvent(new CustomEvent("camera-recording-loaded"));
  }
}
