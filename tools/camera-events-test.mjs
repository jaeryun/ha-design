import assert from "node:assert/strict";
import * as events from "../www/ha-design/ha-design-camera-events.js";
import * as recordings from "../www/ha-design/ha-design-camera-recording.js";
import { createCameraEventState, setCameraEventData } from "../www/ha-design/ha-design-camera-event-state.js";
import { CameraEventController } from "../www/ha-design/ha-design-camera-event-controller.js";
import { renderCameraEventsView } from "../www/ha-design/ha-design-camera-events.template.js";

const now = new Date("2026-09-06T05:30:00Z"), zone = "Asia/Seoul";
const window = events.cameraHistoryWindow(now, zone);
assert.equal(window.start.toISOString(), "2026-08-30T15:00:00.000Z", "seven local days include today, starting at midnight six dates ago");
assert.equal(window.days.length, 7);
assert.equal(window.days.at(-1).dateKey, "2026-09-06");
assert.equal(events.localCameraDateKey("2026-09-05T16:00:00Z", zone), "2026-09-06");
const spring = events.cameraDayBounds("2026-03-08", "America/New_York");
const fall = events.cameraDayBounds("2026-11-01", "America/New_York");
assert.equal(spring.end - spring.start, 23 * 3600);
assert.equal(fall.end - fall.start, 25 * 3600);
assert.equal(events.cameraDayBounds("2026-09-06", zone).start, Date.parse("2026-09-05T15:00:00Z") / 1000);
const sources = events.cameraHistorySources({ motion_event_entity: "binary_sensor.motion" });
const path = events.cameraHistoryPath(sources, now, zone);
assert.equal(decodeURIComponent(path.split("?")[0]), "history/period/2026-08-30T15:00:00.000Z");
assert.equal(new URL(`https://ha/${path}`).searchParams.get("end_time"), now.toISOString());
assert.deepEqual(events.parseCameraHistory([[{ state: "off" }, { state: "on", last_changed: "bad" }, { state: "on", last_changed: now.toISOString() }]], sources).map(e => e.kind), ["motion"]);
assert.deepEqual(recordings.parseCameraWsJson("[]"), []);
assert.deepEqual(recordings.parseCameraWsJson([{ day: "2026-09-06" }]), [{ day: "2026-09-06" }]);
assert.throws(() => recordings.parseCameraWsJson("not JSON"));
assert.throws(() => recordings.parseCameraSegments('{}'));
assert.throws(() => recordings.parseCameraSegments('[{"start_time":1,"end_time":0,"duration":1}]'));
const segments = recordings.parseCameraSegments(JSON.stringify([
  { start_time: 0, end_time: 100, duration: 99.8 },
  { start_time: 100, end_time: 200, duration: 100 },
  { start_time: 300, end_time: 400, duration: 100 },
]));
assert.deepEqual(recordings.cameraRecordingCoverage(segments, { start: 0, end: 500 }, 450, "ready"), [
  { start: 0, end: 200, type: "recorded" }, { start: 200, end: 300, type: "gap" },
  { start: 300, end: 400, type: "recorded" }, { start: 400, end: 450, type: "gap" },
  { start: 450, end: 500, type: "future" },
]);
for (const status of ["unknown", "error", "loading"]) assert.deepEqual(recordings.cameraRecordingCoverage([], { start: 0, end: 500 }, 450, status), [{ start: 0, end: 450, type: status }, { start: 450, end: 500, type: "future" }]);
assert.deepEqual(recordings.cameraRecordingCoverage([], { start: 0, end: 500 }, 450, "ready", 400), [
  { start: 0, end: 400, type: "gap" }, { start: 400, end: 450, type: "unknown" }, { start: 450, end: 500, type: "future" },
], "elapsed time since the last query is unknown, not a guessed gap or future");
assert.equal(recordings.cameraRecordingOffset(segments, 350), 249.8, "offset omits wall-clock gaps and sums stored media durations");
assert.equal(recordings.cameraRecordingOffset(segments, 250), null);
assert.equal(recordings.cameraRecordingTimestamp(segments, 249.8), 350);
const hourSegments = Array.from({ length: 720 }, (_, i) => ({ start: i * 10 + 0.25, end: i * 10 + 10.25, duration: 10 }));
const range = recordings.cameraRecordingWindow(4000, hourSegments, { start: 0, end: 86400 }, 7200);
assert.equal(range.startEpoch, 3590.25, "include complete first segment to avoid server keyframe snapping");
assert.equal(range.endEpoch, 7200);
assert.ok(range.endEpoch - range.startEpoch < 3620);
assert.equal(range.offsetSeconds, 409.75);
assert.equal(recordings.cameraRecordingWindow(25, [{ start: 0, end: 10, duration: 9.9999 }, { start: 20, end: 30, duration: 10 }], { start: 0, end: 86400 }, 60).offsetSeconds, 14.999, "match Frigate's integer-millisecond media durations");
const event = (seconds, kind = "motion") => ({ id: String(seconds), timestamp: new Date(seconds * 1000).toISOString(), kind });
const dense = [event(36000), event(36299, "person"), event(36599, "sound"), event(36900), event(41400)];
const episodes = events.groupCameraEvents(dense, "UTC");
assert.deepEqual(episodes.map(e => e.events.length), [1, 1, 3]);
const day = { start: 0, end: 86400 };
const narrow = events.cameraTimelineEventGroups(episodes, 300, day), wide = events.cameraTimelineEventGroups(episodes, 620, day);
assert.ok(narrow.length < wide.length);
assert.equal(narrow.reduce((sum, group) => sum + group.events.length, 0), 5);
assert.equal(narrow[0].counts.person, 1);
assert.ok(dense.some(e => Date.parse(e.timestamp) / 1000 === narrow[0].timestamp), "cluster anchor must be a real detection moment");
const state = createCameraEventState(now, zone);
setCameraEventData(state, [event(Date.parse("2026-09-04T00:00:00Z") / 1000)]);
assert.equal(state.selectedDate, "2026-09-06", "old events do not change default today");
const html = renderCameraEventsView({ state });
assert.equal((html.match(/data-event-date=/g) ?? []).length, 7);
assert.equal((html.match(/role="slider"/g) ?? []).length, 1);
assert.equal((html.match(/class="timeline-axis"/g) ?? []).length, 1);
assert.equal((html.match(/class="playhead"/g) ?? []).length, 1);

const wsCalls = [];
const hass = { config: { time_zone: zone }, states: { "camera.test": { attributes: { client_id: "frigate", camera_name: "main_camera" } } },
  async callApi() { return []; },
  async callWS(message) { wsCalls.push(message); return message.type === "frigate/recordings/summary" ? '[{"day":"2026-09-06","hours":[]}]' : '[]'; }, hassUrl: value => value };
const host = { _hass: hass, _config: { camera_entity: "camera.test", motion_event_entity: "binary_sensor.motion" }, _view: "camera", _render() {}, dispatchEvent() {}, shadowRoot: { querySelector() { return { focus() {} }; } } };
const controller = new CameraEventController(host);
controller.clock = () => now;
await controller.load(now);
await controller.selectDay("2026-09-06");
assert.ok(wsCalls.some(m => m.type === "frigate/recordings/summary" && m.instance_id === "frigate" && m.camera === "main_camera" && m.timezone === zone));
assert.ok(wsCalls.some(m => m.type === "frigate/recordings/get" && m.after === Date.parse("2026-09-05T15:00:00Z") / 1000 && m.before === now.getTime() / 1000));
assert.equal(controller.state.coverageStatus, "ready");
const pending = [], deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const deadline = async promise => {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("signal timeout")), 5000); })]); }
  finally { clearTimeout(timer); }
};
controller.host._hass = { ...hass, callWS(message) { const task = deferred(); pending.push({ ...task, message }); return task.promise; } };
const old = controller.selectDay("2026-09-05");
const next = controller.selectDay("2026-09-04");
pending[1].resolve('[]'); await next;
pending[0].resolve('[{"start_time":1,"end_time":2,"duration":1}]'); await old;
assert.equal(controller.state.selectedDate, "2026-09-04");
assert.deepEqual(controller.state.segments, []);
controller.state = createCameraEventState(now, zone);
controller.state.coverageStatus = "ready";
controller.state.segments = [];
await controller.seek(now.getTime() / 1000 + 100000);
assert.equal(controller.state.selectedTime, now.getTime() / 1000);
const slider = { closest: selector => selector === "[data-activity-timeline]" ? slider : null };
controller.handleKeydown(slider, "Home");
assert.equal(controller.state.selectedTime, controller.state.day.start);
controller.handleKeydown(slider, "ArrowRight");
assert.equal(controller.state.selectedTime, controller.state.day.start + 60);
controller.handleKeydown(slider, "End");
assert.equal(controller.state.selectedTime, now.getTime() / 1000);
const plot = { getBoundingClientRect: () => ({ left: 10, width: 240, top: 0 }) };
const surface = { querySelector: () => plot, focus() {} };
controller.host._view = "events";
controller.handlePointer({ target: { closest: () => surface }, clientX: 70, clientY: 40 });
assert.equal(controller.state.selectedTime, controller.state.day.start + 21600);

const master = '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1,CODECS="avc1.640032,mp4a.40.2"\nindex-v1-a1.m3u8?authSig=old\n';
const masterPath = "/api/frigate/frigate/vod/clip/main_camera/start/1/end/2/master.m3u8";
assert.equal(recordings.cameraRecordingMasterVariantPath(master, masterPath), masterPath.replace("master", "index-v1-a1"));
assert.equal(recordings.cameraRecordingMasterVariantPath(master.replace("index-v1-a1.m3u8", "../index.m3u8"), masterPath), null);
assert.match(decodeURIComponent(recordings.cameraRecordingMasterPlaylistUrl(master, "https://ha/signed-child?authSig=new").split(",")[1]), /https:\/\/ha\/signed-child\?authSig=new/);
assert.equal(recordings.cameraRecordingNativeHlsSupported({ canPlayType: () => "maybe" }, { userAgent: "iPhone" }), true);
const originalFetch = globalThis.fetch;
const signStarted = deferred(), releaseSign = deferred();
controller.host._hass = { ...hass, async callWS() { signStarted.resolve(); return releaseSign.promise; } };
controller.state.segments = [{ start: controller.state.day.start, end: controller.state.day.start + 3600, duration: 3600 }];
const playback = controller.seek(controller.state.day.start + 100);
await deadline(signStarted.promise);
controller.resetRecording();
releaseSign.resolve({ path: "/signed-master" });
await playback;
assert.equal(controller.state.recording.status, "idle");
const signCalls = [];
controller.host._hass = { ...hass, async callWS(message) { signCalls.push(message); return { path: message.path.endsWith("master.m3u8") ? "/signed-master" : "/signed-child" }; } };
globalThis.fetch = async url => ({ ok: true, status: 200, text: async () => url === "/signed-master" ? master : "#EXTM3U\n#EXT-X-ENDLIST\n" });
await controller.seek(controller.state.day.start + 100);
assert.equal(controller.state.recording.status, "ready");
assert.equal(controller.state.recording.offsetSeconds, 100);
assert.equal(signCalls.length, 2);
assert.equal(controller.state.recording.nativeUrl, "/signed-child");
assert.ok(signCalls.every(m => m.type === "auth/sign_path" && m.expires === 4200), "signed master/child must outlive normal playback of the hour range");
for (const input of ["pointer", "keyboard", "event"]) {
  const requested = deferred(), response = deferred();
  const intentHost = { ...host, _view: "events", _hass: { ...hass, async callWS(message) {
    if (message.type === "frigate/recordings/get") { requested.resolve(); return response.promise; }
    return { path: message.path.endsWith("master.m3u8") ? "/signed-master" : "/signed-child" };
  } } };
  const intentController = new CameraEventController(intentHost);
  intentController.clock = () => now;
  intentController.state = createCameraEventState(now, zone);
  const start = intentController.state.day.start;
  const detection = event(start + 43320, "person");
  setCameraEventData(intentController.state, [detection]);
  const loading = intentController.selectDay("2026-09-06");
  await deadline(requested.promise);
  if (input === "pointer") intentController.handlePointer({ target: { closest: () => surface }, clientX: 130, clientY: 40 });
  else intentController.handleKeydown(slider, input === "keyboard" ? "ArrowRight" : "Enter");
  const expected = start + (input === "pointer" ? 43200 : input === "keyboard" ? 43260 : 43320);
  assert.equal(intentController.state.selectedTime, expected);
  response.resolve(JSON.stringify([
    { start_time: start, end_time: start + 3600, duration: 3600 },
    { start_time: start + 43200, end_time: start + 46800, duration: 3600 },
  ]));
  await deadline(loading);
  console.log(JSON.stringify({ case: `pending day ${input}`, selectedBefore: expected - start, selectedAfter: intentController.state.selectedTime - start }));
  assert.equal(intentController.state.selectedTime, expected, "day coverage must preserve newer user intent");
  assert.equal(intentController.state.recording.status, "ready");
  assert.equal(intentController.state.recording.startEpoch, start + 43200);
  assert.equal(intentController.state.recording.offsetSeconds, expected - start - 43200);
  assert.deepEqual(intentController.state.selectedEvents, input === "event" ? [detection] : []);
}
const childStarted = deferred(), releaseChild = deferred();
let childSignal;
globalThis.fetch = async (url, options) => ({ ok: true, status: 200, text: () => {
  if (url === "/signed-master") return Promise.resolve(master);
  childSignal = options.signal; childStarted.resolve(); return releaseChild.promise;
} });
const staleChild = controller.seek(controller.state.day.start + 120);
await deadline(childStarted.promise);
controller.suspend();
assert.equal(childSignal.aborted, true, "disposal aborts actual manifest fetch");
releaseChild.resolve("#EXTM3U\n#EXT-X-ENDLIST\n");
await staleChild;
assert.equal(controller.state.recording.status, "idle");
assert.equal(controller.state.recording.url, null);
globalThis.fetch = async () => ({ ok: false, status: 404 });
await controller.seek(controller.state.day.start + 120);
assert.equal(controller.state.recording.status, "unavailable");
globalThis.fetch = originalFetch;
controller.state = createCameraEventState(now, zone);
controller.state.coverageStatus = "ready";
controller.clock = () => new Date(now.getTime() + 120000);
controller.refreshClock();
await controller.seek(now.getTime() / 1000 + 60);
assert.equal(controller.state.now, now.getTime() / 1000 + 120);
assert.match(renderCameraEventsView({ state: controller.state }), /data-state="unknown"/);
assert.equal(controller.state.recording.status, "idle");
const pendingEvents = [];
const eventHost = { ...host, _config: { ...host._config, sound_event_entity: "binary_sensor.old" }, _hass: { ...hass, callApi() { const request = deferred(); pendingEvents.push(request); return request.promise; } } };
const eventController = new CameraEventController(eventHost);
const oldEvents = eventController.load(now);
eventController.invalidate();
eventHost._config = { camera_entity: "camera.test", sound_event_entity: "binary_sensor.new" };
const newEvents = eventController.load(now);
pendingEvents[1].resolve([[{ state: "on", last_changed: "2026-09-06T00:00:00Z" }]]);
await newEvents;
pendingEvents[0].resolve([[{ state: "on", last_changed: "2026-09-06T01:00:00Z" }]]);
await oldEvents;
assert.deepEqual(eventController.state.events.map(e => e.entityId), ["binary_sensor.new"]);
console.log("PASS camera seven-day time history, segments, absolute VOD, grouping, input and cancellation");
