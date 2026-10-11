import { parseCameraSegments } from "./ha-design-camera-recording.js?v=camera-frigate-motion-20261011-1";

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
      start: cameraDownloadValue(defaults.start, timeZone), end: cameraDownloadValue(defaults.end, timeZone) };
    this.host._render();
  }
  close(render = true) {
    this.generation++;
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
    if (!dialog.open) {
      // No value attributes: ordinary HA/video renders must not erase partial native date input.
      for (const key of ["start", "end"]) dialog.querySelector(`[data-download-field="${key}"]`).value = this.state[key];
      dialog.showModal();
      dialog.querySelector('[data-download-field="start"]').focus();
    }
  }
  handleInput(target) {
    const field = target.dataset?.downloadField;
    if (!this.state.open || !["start", "end"].includes(field)) return false;
    this.generation++;
    Object.assign(this.state, { [field]: target.value, status: "idle", url: null, error: "", coverage: null });
    this.host._render();
    return true;
  }
  handleClick(event) {
    const action = event.target.closest?.("[data-action]")?.dataset.action;
    if (action === "download-open") { this.open(); return true; }
    if (!this.state.open) return false;
    if (action === "download-close") { this.close(); return true; }
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
      const start = cameraDownloadEpoch(state.start, state.timeZone, state.defaults.start);
      const end = cameraDownloadEpoch(state.end, state.timeZone, state.defaults.end);
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
