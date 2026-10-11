import assert from "node:assert/strict";
import { CameraDownloadController, cameraDownloadCoverage, cameraDownloadDefaults, cameraDownloadEpoch, cameraDownloadFilename, cameraDownloadValue } from "../www/ha-design/ha-design-camera-download.js";
import { createCameraEventState } from "../www/ha-design/ha-design-camera-event-state.js";
import { cameraTrimBoundary, cameraTrimPreviewTime, cameraTrimViewport } from "../www/ha-design/ha-design-camera-trim-preview.js";

assert.deepEqual(cameraTrimBoundary({ start: 10, end: 20 }, "start", 25, 0, 100), { start: 19, end: 20 }, "start handle cannot cross the end");
assert.deepEqual(cameraTrimBoundary({ start: 10, end: 20 }, "end", -5, 0, 100), { start: 10, end: 11 }, "end handle preserves at least one second");
assert.deepEqual(cameraTrimBoundary({ start: 10, end: 20 }, "end", 150, 0, 100), { start: 10, end: 100 }, "dragging cannot select the future");
assert.deepEqual(cameraTrimViewport(60, 70, 0, 3600, 120), { start: 5, end: 125 });
assert.deepEqual(cameraTrimViewport(3590, 3598, 0, 3600, 120), { start: 3480, end: 3600 }, "zoom remains bounded at the live edge");
assert.equal(cameraTrimPreviewTime({ start: 10, end: 20 }, "end"), 19.95, "the end handle previews the last included frame, not footage after the cut");

const zone = "Asia/Seoul", now = new Date("2026-10-11T03:00:00Z"), base = Date.parse("2026-10-10T15:00:00Z") / 1000;
assert.equal(cameraDownloadEpoch("2026-10-11T10:30", zone), base + 37800);
assert.equal(cameraDownloadValue(base + 37800, zone), "2026-10-11T10:30:00");
assert.equal(cameraDownloadValue(base + 37800 - 0.000001, zone), "2026-10-11T10:30:00", "sub-millisecond media rounding must not label the previous second");
assert.throws(() => cameraDownloadEpoch("2026-02-30T10:00:00", zone));
assert.throws(() => cameraDownloadEpoch("2026-10-11T25:00:00", zone));
assert.throws(() => cameraDownloadEpoch("2026-03-08T02:30:00", "America/New_York"), /존재하지/);
assert.throws(() => cameraDownloadEpoch("2026-11-01T01:30:00", "America/New_York"), /두 번/);
for (const iso of ["2026-11-01T05:30:00Z", "2026-11-01T06:30:00Z"]) {
  const exact = Date.parse(iso) / 1000;
  assert.equal(cameraDownloadEpoch("2026-11-01T01:30:00", "America/New_York", exact), exact, "recording-derived defaults preserve both occurrences of the repeated hour");
}
assert.equal(cameraDownloadEpoch("2026-03-08T03:30:00", "America/New_York"), Date.parse("2026-03-08T07:30:00Z") / 1000);
assert.equal(cameraDownloadEpoch("2026-10-11T10:30:00", "Asia/Kathmandu"), Date.parse("2026-10-11T04:45:00Z") / 1000);
assert.deepEqual(cameraDownloadCoverage([{ start: 0, end: 100 }, { start: 50, end: 120 }, { start: 150, end: 200 }], 20, 180), { coveredSeconds: 130, missingSeconds: 30 });
assert.deepEqual(cameraDownloadCoverage([{ start: 0, end: 10 }, { start: 20, end: 30 }], 10, 20), { coveredSeconds: 0, missingSeconds: 10 });
assert.equal(cameraDownloadFilename("거실/카메라", base + 37800, base + 38100, zone), "거실_카메라_2026-10-11_103000-103500.mp4");
assert.equal(cameraDownloadFilename("거실", base - 30, base + 30, zone), "거실_2026-10-10_235930-2026-10-11_000030.mp4");

const history = createCameraEventState(now, zone);
Object.assign(history, { coverageStatus: "ready", coverageUntil: history.now,
  segments: [{ start: base, end: base + 43000.5, duration: 43000.5, motion: 0 }], selectedTime: base + 36000.25 });
assert.deepEqual(cameraDownloadDefaults(history), { start: base + 36000, end: base + 36060 });
history.selectedMotion = { start: base + 500.2, end: base + 600.8 };
assert.deepEqual(cameraDownloadDefaults(history), { start: base + 500, end: base + 601 });
history.selectedMotion = null; history.selectedTime = base + 43000.3;
assert.deepEqual(cameraDownloadDefaults(history), { start: base + 42940, end: base + 43000 }, "live-edge defaults never extend past saved video");
history.selectedTime = base + 36000;

const host = {
  _config: { title: "거실 카메라" },
  _eventController: { state: history, refreshClock() {}, recordingSource: () => ({ instance_id: "frigate", camera: "main_camera" }) },
  _render() {}, dispatchEvent() {}, shadowRoot: { querySelector: () => null },
  _hass: { hassUrl: path => path, async callWS(message) {
    if (message.type === "frigate/recordings/get") return JSON.stringify([
      { start_time: message.after, end_time: message.after + 10, duration: 10 },
      { start_time: message.after + 20, end_time: message.before, duration: message.before - message.after - 20 },
    ]);
    return { path: `${message.path}?authSig=fixture` };
  } },
};
const controller = new CameraDownloadController(host);
controller.open();
await controller.prepare();
assert.equal(controller.state.status, "ready");
assert.equal(controller.state.coverage.missingSeconds, 10);
const readyFilename = controller.state.filename;
controller.handleInput({ dataset: { downloadField: "start" }, value: "2026-10-11T10:02:00" });
assert.equal(controller.state.url, null, "editing the range immediately invalidates the prepared file link");
await controller.prepare();
assert.equal(controller.state.status, "error", "reversed ranges cannot be downloaded");
assert.equal(controller.state.url, null);
controller.close(false);

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
for (const phase of ["recordings", "signature"]) {
  const response = deferred(), reached = deferred();
  const pendingHost = { ...host, _hass: { ...host._hass, async callWS(message) {
    if ((phase === "recordings") === (message.type === "frigate/recordings/get")) { reached.resolve(); return response.promise; }
    return host._hass.callWS(message);
  } } };
  const pending = new CameraDownloadController(pendingHost);
  pending.open();
  const work = pending.prepare();
  await reached.promise;
  pending.close(false); pending.open();
  response.resolve(phase === "recordings" ? [{ start_time: base, end_time: base + 43000, duration: 43000 }] : { path: "/stale?authSig=fixture" });
  await work;
  assert.equal(pending.state.status, "idle");
  assert.equal(pending.state.url, null, "closed/reopened dialogs cannot acquire stale authorization links");
}
const delayed = deferred(), signed = deferred();
const editing = new CameraDownloadController({ ...host, _hass: { ...host._hass, async callWS(message) {
  if (message.type === "auth/sign_path") { signed.resolve(message.path); return delayed.promise; }
  return host._hass.callWS(message);
} } });
editing.open();
const preparing = editing.prepare(), path = await signed.promise;
editing.handleInput({ dataset: { downloadField: "end" }, value: "2026-10-11T10:03:00" });
delayed.resolve({ path: `${path}?authSig=fixture` }); await preparing;
assert.equal(editing.state.status, "idle");
assert.equal(editing.state.url, null, "a signature for an edited range must not become clickable");

const empty = new CameraDownloadController({ ...host, _hass: { ...host._hass, async callWS() { return []; } } });
empty.open(); await empty.prepare();
assert.equal(empty.state.status, "error"); assert.equal(empty.state.url, null);
for (const [start, end] of [["2026-10-11T10:00:00", "2026-10-11T10:00:00"], ["2026-10-04T00:00:00", "2026-10-11T10:00:00"], ["2026-10-11T10:00:00", "2026-10-11T12:00:01"]]) {
  controller.open();
  controller.handleInput({ dataset: { downloadField: "start" }, value: start });
  controller.handleInput({ dataset: { downloadField: "end" }, value: end });
  await controller.prepare();
  assert.equal(controller.state.status, "error"); assert.equal(controller.state.url, null);
}
controller.open(); await controller.prepare();
assert.equal(controller.state.filename, readyFilename);
controller.state.expiresAt = Date.now() - 1;
let prevented = false;
controller.handleClick({ target: { closest: () => ({ dataset: { action: "download-save" } }) }, preventDefault() { prevented = true; } });
assert.equal(prevented, true, "expired signed URLs must not navigate");
assert.equal(controller.state.url, null);
console.log("PASS camera MP4 ranges, time zones, gaps, filenames, stale preparation and expired links");
