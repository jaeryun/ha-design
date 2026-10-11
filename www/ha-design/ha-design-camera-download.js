import { parseCameraSegments } from "./ha-design-camera-recording.js?v=camera-visual-trim-20261011-1";
import { CameraTrimPreview, cameraTrimBoundary, cameraTrimPreviewTime, cameraTrimViewport } from "./ha-design-camera-trim-preview.js?v=camera-visual-trim-20261011-2";

const LINK_LIFETIME = 600;
const formatters = new Map();
export const cameraDownloadValue = (timestamp, timeZone) => {
  if (!formatters.has(timeZone)) formatters.set(timeZone, new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }));
  const p = Object.fromEntries(formatters.get(timeZone).formatToParts(new Date(timestamp * 1000)).map(part => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
};
export const cameraDownloadEpoch = (value, timeZone, hint) => {
  const text = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(text)) throw new Error("시작·종료 날짜와 시각을 입력해 주세요.");
  const nominal = Date.parse(`${text}Z`) / 1000;
  if (!Number.isFinite(nominal) || new Date(nominal * 1000).toISOString().slice(0, 19) !== text) throw new Error("올바른 날짜와 시각을 입력해 주세요.");
  // A default from an actual recording disambiguates the repeated hour at DST fall-back.
  if (Number.isFinite(hint) && cameraDownloadValue(hint, timeZone) === text) return hint;
  const candidates = new Set();
  for (const sample of [nominal - 86400, nominal, nominal + 86400]) {
    const offset = Date.parse(`${cameraDownloadValue(sample, timeZone)}Z`) / 1000 - sample;
    const candidate = nominal - offset;
    if (cameraDownloadValue(candidate, timeZone) === text) candidates.add(candidate);
  }
  if (candidates.size !== 1) throw new Error(candidates.size
    ? "시간대 변경으로 두 번 나타나는 시각입니다. 다른 시각을 선택해 주세요."
    : "시간대 변경으로 존재하지 않는 시각입니다. 다른 시각을 선택해 주세요.");
  return [...candidates][0];
};
export const cameraDownloadDefaults = history => {
  const limit = Math.floor(Math.min(history.now, history.coverageUntil, history.day.end, history.segments.at(-1).end));
  let start = Math.max(history.day.start, Math.floor(history.selectedMotion?.start ?? history.selectedTime));
  const end = Math.min(limit, Math.ceil(history.selectedMotion?.end ?? start + 60));
  if (start >= end) start = Math.max(history.day.start, end - 60);
  return { start, end };
};
export const cameraDownloadCoverage = (segments, start, end) => {
  let cursor = start, coveredSeconds = 0;
  for (const segment of segments) {
    const from = Math.max(start, cursor, segment.start), to = Math.min(end, segment.end);
    if (to <= from) continue;
    coveredSeconds += to - from; cursor = to;
  }
  return { coveredSeconds, missingSeconds: Math.max(0, end - start - coveredSeconds) };
};
export const cameraDownloadFilename = (title, start, end, timeZone) => {
  const name = Array.from(String(title).normalize("NFC").replace(/[\\/<>:"|?*\u0000-\u001f]/g, "_").trim()).slice(0, 48).join("") || "카메라";
  const from = cameraDownloadValue(start, timeZone), to = cameraDownloadValue(end, timeZone);
  const endLabel = from.slice(0, 10) === to.slice(0, 10) ? to.slice(11) : to.replace("T", "_");
  return `${name}_${from.replace("T", "_").replaceAll(":", "")}-${endLabel.replaceAll(":", "")}.mp4`;
};
const emptyState = () => ({ open: false, status: "idle", start: "", end: "", url: null, error: "", coverage: null });

export class CameraDownloadController {
  constructor(host) {
    this.host = host; this.state = emptyState(); this.generation = 0; this.boundDialogs = new WeakSet();
    this.preview = new CameraTrimPreview(this); this.drag = null; this.raf = null;
  }
  open() {
    const historyController = this.host._eventController;
    historyController.refreshClock();
    const history = historyController.state, source = historyController.recordingSource();
    if (history.coverageStatus !== "ready" || !history.segments.length || !source) return;
    const defaults = cameraDownloadDefaults(history), timeZone = history.timeZone;
    this.generation++;
    this.state = { ...emptyState(), open: true, source, timeZone, defaults,
      title: this.host._config.title ?? "카메라", min: history.days[0].start, max: Math.floor(history.now),
      start: cameraDownloadValue(defaults.start, timeZone), end: cameraDownloadValue(defaults.end, timeZone),
      editor: { ...defaults, active: "start", viewport: cameraTrimViewport(defaults.start, defaults.end, history.days[0].start, Math.floor(history.now)), segments: history.segments, coverageStatus: "ready" },
      preview: { target: defaults.start, shownTime: null, status: "loading", playing: false } };
    this.preview.reset(history);
    this.host._recordingBinding?.pause();
    this.host._render();
  }
  close(render = true) {
    this.generation++;
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null; this.drag = null; this.preview.dispose();
    const dialog = this.host.shadowRoot.querySelector(".camera-download-dialog");
    if (dialog?.open) dialog.close();
    this.state = emptyState();
    if (render) {
      this.host._render();
      this.host.shadowRoot.querySelector('[data-action="download-open"]')?.focus();
    }
  }
  syncDialog() {
    const dialog = this.host.shadowRoot.querySelector(".camera-download-dialog");
    if (!dialog || !this.state.open) return;
    if (!this.boundDialogs.has(dialog)) {
      this.boundDialogs.add(dialog);
      dialog.addEventListener("cancel", event => { event.preventDefault(); event.stopPropagation(); this.close(); });
    }
    for (const key of ["start", "end"]) {
      const input = dialog.querySelector(`[data-download-field="${key}"]`);
      if (this.host.shadowRoot.activeElement !== input && input.value !== this.state[key] && `${input.value}:00` !== this.state[key]) input.value = this.state[key];
    }
    if (!dialog.open) {
      dialog.showModal();
      dialog.querySelector('[data-trim-handle="start"]').focus();
      void this.preview.loadViewport();
      this.preview.request(this.state.editor.start);
    }
    this.preview.syncPlayer();
  }
  handleInput(target) {
    const field = target.dataset?.downloadField;
    if (!this.state.open || !["start", "end"].includes(field)) return false;
    this.generation++;
    Object.assign(this.state, { [field]: target.value, status: "idle", url: null, error: "", coverage: null });
    try {
      const start = cameraDownloadEpoch(this.state.start, this.state.timeZone, this.state.editor.start);
      const end = cameraDownloadEpoch(this.state.end, this.state.timeZone, this.state.editor.end);
      if (start < this.state.min || end > this.state.max || end <= start) throw new Error("시작·종료 범위를 확인해 주세요.");
      Object.assign(this.state.editor, { start, end, active: field, viewport: cameraTrimViewport(start, end, this.state.min, this.state.max) });
      void this.preview.loadViewport();
      this.preview.request(cameraTrimPreviewTime(this.state.editor, field));
    } catch (error) {
      this.state.error = error.message; this.state.preview.playing = false;
      this.state.preview.status = "invalid"; this.preview.binding?.pause();
    }
    this.host._render();
    return true;
  }
  setBoundary(edge, time) {
    const range = cameraTrimBoundary(this.state.editor, edge, time, this.state.min, this.state.max);
    this.generation++;
    Object.assign(this.state.editor, range, { active: edge });
    Object.assign(this.state, { start: cameraDownloadValue(range.start, this.state.timeZone), end: cameraDownloadValue(range.end, this.state.timeZone), status: "idle", url: null, error: "", coverage: null });
    this.preview.request(cameraTrimPreviewTime(range, edge));
  }
  handlePointer(event) {
    if (!this.state.open) return false;
    const track = event.target.closest?.("[data-trim-track]");
    if (!track) return false;
    const box = track.getBoundingClientRect(), viewport = { ...this.state.editor.viewport };
    const time = viewport.start + Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)) * (viewport.end - viewport.start);
    const handle = event.target.closest("[data-trim-handle]");
    if (!handle) {
      this.state.editor.active = "cursor"; this.preview.request(time); return true;
    }
    this.drag = { edge: handle.dataset.trimHandle, pointerId: event.pointerId, box, viewport, time };
    handle.setPointerCapture?.(event.pointerId); handle.focus();
    this.setBoundary(this.drag.edge, time); return true;
  }
  handlePointerMove(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return false;
    const { box, viewport } = this.drag;
    this.drag.time = viewport.start + Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)) * (viewport.end - viewport.start);
    if (this.raf === null) this.raf = requestAnimationFrame(() => {
      this.raf = null;
      if (this.drag) this.setBoundary(this.drag.edge, this.drag.time);
    });
    return true;
  }
  handlePointerUp(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return false;
    this.handlePointerMove(event);
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    const drag = this.drag; this.drag = null;
    this.setBoundary(drag.edge, drag.time); return true;
  }
  handleKeydown(event) {
    const edge = event.target.dataset?.trimHandle;
    if (!edge || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return false;
    const editor = this.state.editor, step = event.shiftKey ? 10 : 1;
    const time = event.key === "Home" ? editor.viewport.start : event.key === "End" ? editor.viewport.end : editor[edge] + (event.key === "ArrowLeft" ? -step : step);
    this.setBoundary(edge, time); return true;
  }
  changeViewport(factor = 1, direction = 0, edge) {
    const editor = this.state.editor, span = editor.viewport.end - editor.viewport.start;
    const center = edge ? editor[edge] : (editor.viewport.start + editor.viewport.end) / 2 + direction * span / 2;
    editor.viewport = cameraTrimViewport(center, center, this.state.min, this.state.max, span * factor);
    if (edge) { editor.active = edge; this.preview.request(cameraTrimPreviewTime(editor, edge)); }
    void this.preview.loadViewport();
  }
  handleClick(event) {
    const action = event.target.closest?.("[data-action]")?.dataset.action;
    if (action === "download-open") { this.open(); return true; }
    if (!this.state.open) return false;
    if (action === "download-close") { this.close(); return true; }
    if (action === "trim-manual") {
      this.state.advanced = !this.state.advanced; this.host._render();
      if (this.state.advanced) this.host.shadowRoot.querySelector('[data-download-field="start"]')?.focus();
      return true;
    }
    if (action === "trim-play") { this.preview.playRange(); return true; }
    if (action === "trim-retry") { this.preview.request(this.state.preview.target); return true; }
    if (action === "trim-zoom-in" || action === "trim-zoom-out") { this.changeViewport(action === "trim-zoom-in" ? 0.5 : 2); return true; }
    if (action === "trim-earlier" || action === "trim-later") { this.changeViewport(1, action === "trim-earlier" ? -1 : 1); return true; }
    if (action === "trim-focus-start" || action === "trim-focus-end") { this.changeViewport(1, 0, action === "trim-focus-start" ? "start" : "end"); return true; }
    if (action === "trim-fit") {
      this.state.editor.viewport = cameraTrimViewport(this.state.editor.start, this.state.editor.end, this.state.min, this.state.max);
      void this.preview.loadViewport(); return true;
    }
    if (action === "download-prepare") { void this.prepare(); return true; }
    if (action !== "download-save") return false;
    if (!this.state.url || Date.now() >= this.state.expiresAt) {
      event.preventDefault();
      Object.assign(this.state, { status: "error", url: null, error: "다운로드 링크가 만료됐어요. 다시 준비해 주세요." });
    } else this.state.status = "requested";
    this.host._render();
    return true;
  }
  async prepare() {
    if (!this.state.open || this.state.status === "preparing") return;
    const state = this.state, generation = ++this.generation;
    Object.assign(state, { status: "preparing", url: null, error: "", coverage: null });
    this.host._render();
    try {
      const start = cameraDownloadEpoch(state.start, state.timeZone, state.editor.start);
      const end = cameraDownloadEpoch(state.end, state.timeZone, state.editor.end);
      if (start < state.min || end > state.max) throw new Error("현재 과거 영상 화면의 최근 7일 범위 안에서 선택해 주세요. 미래 시각은 사용할 수 없어요.");
      if (end <= start) throw new Error("종료 시각은 시작 시각보다 뒤여야 해요.");
      const hass = this.host._hass;
      const response = await hass.callWS({ type: "frigate/recordings/get", ...state.source, after: start, before: end });
      if (generation !== this.generation) return;
      const coverage = cameraDownloadCoverage(parseCameraSegments(response), start, end);
      if (coverage.coveredSeconds <= 0) throw new Error("선택한 구간에는 저장된 영상이 없어요.");
      const path = `/api/frigate/${encodeURIComponent(state.source.instance_id)}/recording/${encodeURIComponent(state.source.camera)}/start/${start}/end/${end}`;
      const signedAt = Date.now();
      const signed = await hass.callWS({ type: "auth/sign_path", path, expires: LINK_LIFETIME });
      if (generation !== this.generation) return;
      if (typeof signed.path !== "string" || !signed.path.startsWith(`${path}?`)) throw new Error("다운로드 주소를 준비하지 못했어요.");
      Object.assign(state, { status: "ready", coverage, url: hass.hassUrl(signed.path),
        expiresAt: signedAt + LINK_LIFETIME * 1000, filename: cameraDownloadFilename(state.title, start, end, state.timeZone) });
    } catch (error) {
      if (generation !== this.generation) return;
      Object.assign(state, { status: "error", url: null,
        error: error instanceof Error ? error.message : "녹화 구간이나 다운로드 주소를 확인하지 못했어요. 다시 준비해 주세요." });
    }
    if (generation !== this.generation) return;
    this.host._render(); this.host.dispatchEvent(new CustomEvent("camera-download-prepared"));
  }
}
