import assert from "node:assert/strict";
import * as events from "../www/ha-design/ha-design-camera-events.js";
import * as recordings from "../www/ha-design/ha-design-camera-recording.js";
import { cameraStateNeighbour, createCameraEventState, setCameraEventData } from "../www/ha-design/ha-design-camera-event-state.js";
import { CameraEventController } from "../www/ha-design/ha-design-camera-event-controller.js";
import { renderCameraHistoryView } from "../www/ha-design/ha-design-camera-events.template.js";

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
assert.deepEqual(recordings.cameraRecordingSource({ states: { "camera.test": { attributes: { client_id: "entity", camera_name: "entity_camera" } } } }, { camera_entity: "camera.test", frigate_client_id: "pinned", frigate_camera_name: "pinned_camera" }), { instance_id: "pinned", camera: "pinned_camera" });
assert.equal(recordings.cameraRecordingSource({ states: { "camera.test": { state: "unavailable", attributes: {} } } }, { camera_entity: "camera.test" }), null);
assert.equal(recordings.cameraRecordingProxyPath({ instance_id: "frigate", camera: "main_camera" }, { startEpoch: 1, endEpoch: 2 }, "master.m3u8"), "/api/frigate/frigate/vod/clip/main_camera/start/1/end/2/master.m3u8");
assert.equal(recordings.cameraRecordingProxyPath({ instance_id: "frigate", camera: "main_camera" }, { startEpoch: 1, endEpoch: 2 }, "other.m3u8"), null);
assert.equal(recordings.cameraRecordingProxyPath(null, { startEpoch: 1, endEpoch: 2 }, "master.m3u8"), null);
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
// "이전/다음 녹화"는 segment가 아니라 녹화 블록 사이를 이동한다. Frigate 모션 녹화는 약 10초
// segment 사이에 1초 미만의 경계 오차를 남기므로, 정확한 segment 경계로 이동하면 10~50초씩만 움직인다.
const wholeDay = { start: 0, end: 86400 };
const chain = (from, count) => Array.from({ length: count }, (_, i) => ({ start: from + i * 11, end: from + i * 11 + 10, duration: 10 }));
assert.equal(recordings.RECORDING_BLOCK_GAP, 180);
assert.deepEqual(recordings.cameraRecordingBlocks(chain(0, 30), wholeDay), [{ start: 0, end: 329 }], "10초 segment 사이 1초 공백은 한 블록이다");
assert.deepEqual(
  recordings.cameraRecordingBlocks([{ start: 0, end: 100, duration: 100 }, { start: 280, end: 400, duration: 120 }], wholeDay),
  [{ start: 0, end: 400 }],
  "180초 이하 공백은 같은 녹화 블록이다",
);
assert.deepEqual(
  recordings.cameraRecordingBlocks([{ start: 0, end: 100, duration: 100 }, { start: 281, end: 400, duration: 119 }], wholeDay),
  [{ start: 0, end: 100 }, { start: 281, end: 400 }],
  "180초를 넘는 공백은 다른 블록이다",
);
assert.deepEqual(
  recordings.cameraRecordingBlocks([{ start: -100, end: 50, duration: 50 }, { start: 86400, end: 86500, duration: 100 }], wholeDay),
  [{ start: 0, end: 50 }],
  "블록은 선택 날짜로 자른다",
);
assert.equal(recordings.cameraRecordingTimestamp(segments, 249.8), 350);
// 표시용 띠는 3분 기준으로 병합한다. 10초 segment 사이 1초 공백을 그대로 그리면 하루에
// 6,000개가 넘는 1px 미만 조각이 생겨 띠가 줄무늬처럼 보인다(실서버 측정).
const chained = chain(0, 300);
assert.equal(recordings.cameraRecordingCoverage(chained, wholeDay, 3600, "ready").filter(i => i.type === "recorded").length, 300, "정확한 coverage는 segment 조각을 그대로 유지한다");
assert.equal(
  recordings.cameraRecordingCoverage(chained, wholeDay, 3600, "ready", 3600, recordings.RECORDING_BLOCK_GAP).filter(i => i.type === "recorded").length,
  1,
  "표시용 띠는 3분 기준으로 병합한다",
);
const tapeState = createCameraEventState(new Date("2026-09-06T06:30:00Z"), zone);
tapeState.coverageStatus = "ready";
tapeState.coverageUntil = tapeState.now;
tapeState.segments = recordings.parseCameraSegments(JSON.stringify(
  chained.map(s => ({ start_time: tapeState.day.start + s.start, end_time: tapeState.day.start + s.end, duration: 10 })),
));
const tapeHtml = renderCameraHistoryView({ state: tapeState });
assert.equal((tapeHtml.match(/coverage-segment recorded/g) ?? []).length, 1, "띠는 3분 이하 공백을 병합해 그린다");
const axisHtml = tapeHtml.match(/<div class="timeline-axis"[\s\S]*?<\/div>/)[0];
assert.doesNotMatch(axisHtml, /data-hour="16"/, "\"지금\"과 겹치는 시간 눈금 라벨은 감춘다");
assert.match(axisHtml, /data-hour="12"/, "겹치지 않는 눈금 라벨은 남긴다");
const blockState = createCameraEventState(now, zone);
blockState.coverageStatus = "ready";
const atHour = hour => blockState.day.start + hour * 3600;
const chainEnd = atHour(1) + 29 * 11 + 10;
blockState.segments = recordings.parseCameraSegments(JSON.stringify([
  ...chain(0, 30).map(s => ({ start_time: atHour(1) + s.start, end_time: atHour(1) + s.end, duration: 10 })),
  { start_time: atHour(2), end_time: atHour(2) + 30, duration: 30 },
  { start_time: atHour(3), end_time: atHour(3) + 30, duration: 30 },
]));
assert.equal(recordings.cameraRecordingBlocks(blockState.segments, blockState.day).length, 3, "하루 세 블록");
blockState.selectedTime = atHour(1) + 5;
assert.equal(cameraStateNeighbour(blockState, true), undefined, "첫 블록에서는 이전 녹화가 없다");
assert.equal(cameraStateNeighbour(blockState, false).start, atHour(2));
blockState.selectedTime = chainEnd - 1;
assert.equal(cameraStateNeighbour(blockState, false).start, atHour(2), "같은 블록 안에서는 다음 segment로 이동하지 않는다");
blockState.selectedTime = atHour(2) + 5;
assert.equal(cameraStateNeighbour(blockState, true).end, chainEnd, "이전 녹화는 이전 블록의 끝으로 간다");
assert.equal(cameraStateNeighbour(blockState, false).start, atHour(3));
blockState.selectedTime = atHour(3) + 5;
assert.equal(cameraStateNeighbour(blockState, false), undefined, "마지막 블록에서는 다음 녹화가 없다");
assert.equal(cameraStateNeighbour(blockState, true).start, atHour(2));
blockState.selectedTime = atHour(1) + 1800;
assert.equal(cameraStateNeighbour(blockState, true).start, atHour(1), "공백 위에서는 선택 시각이 기준점이다");
assert.equal(cameraStateNeighbour(blockState, false).start, atHour(2));
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
const html = renderCameraHistoryView({ state });
assert.equal((html.match(/data-event-date=/g) ?? []).length, 7);
assert.equal((html.match(/role="slider"/g) ?? []).length, 1);
assert.equal((html.match(/class="timeline-axis"/g) ?? []).length, 1);
assert.equal((html.match(/class="playhead"/g) ?? []).length, 1);
assert.match(html, /class="history-view" data-view="history"/);
const context = html.match(/<div class="timeline-context"[\s\S]*?<\/div>\s*<\/div>/)?.[0];
assert.ok(context, "timeline context is always present");
assert.equal((html.match(/data-action="previous-recording"/g) ?? []).length, 1);
assert.equal((html.match(/data-action="next-recording"/g) ?? []).length, 1);
assert.match(context, /data-action="previous-recording"[^>]*disabled/);
assert.match(context, /data-action="next-recording"[^>]*disabled/);
assert.doesNotMatch(html.match(/<div class="context-status"[\s\S]*?<\/div>/)?.[0] ?? "", /data-action="(?:previous|next)-recording"/);
const gapState = createCameraEventState(now, zone);
gapState.coverageStatus = "ready";
gapState.segments = [{ start: gapState.day.start + 3600, end: gapState.day.start + 7200, duration: 3600 }];
gapState.selectedTime = gapState.day.start + 8000;
const gapHtml = renderCameraHistoryView({ state: gapState });
assert.equal((gapHtml.match(/data-action="previous-recording"/g) ?? []).length, 1);
assert.equal((gapHtml.match(/data-action="next-recording"/g) ?? []).length, 1);
assert.doesNotMatch(gapHtml.match(/<div class="context-status"[\s\S]*?<\/div>/)?.[0] ?? "", /data-action="(?:previous|next)-recording"/);

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
controller.host._view = "history";
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
const unavailable = { ...hass, states: { "camera.test": { state: "unavailable", attributes: {} } } };
const recordingRows = () => {
  const bounds = events.cameraDayBounds("2026-09-06", zone);
  return JSON.stringify([[6, 7], [11.5, 12.5]].map(([start, end]) => ({
    start_time: bounds.start + start * 3600, end_time: bounds.start + end * 3600, duration: (end - start) * 3600,
  })));
};
const proveOfflineHistory = async (config, initialHass, loseEntity = false) => {
  const calls = [];
  const offlineHost = { ...host, _config: config, _hass: { ...initialHass, async callWS(message) {
    calls.push(message);
    if (message.type === "frigate/recordings/summary") return '[{"day":"2026-09-06","hours":[]}]';
    if (message.type === "frigate/recordings/get") return recordingRows();
    return { path: message.path.endsWith("master.m3u8") ? "/signed-master" : "/signed-child" };
  } } };
  const offlineController = new CameraEventController(offlineHost);
  offlineController.clock = () => new Date("2026-09-06T04:00:00Z");
  if (loseEntity) {
    await offlineController.load();
    offlineHost._hass.states = unavailable.states;
    calls.length = 0;
  }
  await offlineController.load();
  await offlineController.selectDay("2026-09-06");
  assert.ok(calls.some(m => m.type === "frigate/recordings/summary" && m.instance_id === "frigate" && m.camera === "main_camera"));
  assert.ok(calls.some(m => m.type === "frigate/recordings/get" && m.instance_id === "frigate" && m.camera === "main_camera"));
  assert.equal(offlineController.state.coverageStatus, "ready");
  assert.equal(offlineController.state.recording.status, "ready");
  const start = offlineController.state.day.start;
  assert.ok(offlineController.state.selectedTime >= start + 11.5 * 3600 && offlineController.state.selectedTime < start + 12.5 * 3600);
  assert.equal(offlineController.state.selectedTime, start + 12 * 3600, "seed lands within the nearest interval rather than the first");
};
await proveOfflineHistory({ ...host._config, frigate_client_id: "frigate", frigate_camera_name: "main_camera" }, unavailable);
await proveOfflineHistory(host._config, hass, true);
const edgeStart = events.cameraDayBounds("2026-09-06", zone).start;
const edgeHost = { ...host, _hass: { ...hass, async callWS(message) {
  if (message.type === "frigate/recordings/summary") return '[{"day":"2026-09-06","hours":[]}]';
  if (message.type === "frigate/recordings/get") return JSON.stringify([
    { start_time: edgeStart + 6 * 3600, end_time: edgeStart + 7 * 3600, duration: 3600 },
    { start_time: edgeStart + 11 * 3600, end_time: edgeStart + 11.5 * 3600, duration: 1800 },
  ]);
  return { path: message.path.endsWith("master.m3u8") ? "/signed-master" : "/signed-child" };
} } };
const edgeController = new CameraEventController(edgeHost);
edgeController.clock = () => new Date("2026-09-06T04:00:00Z");
await edgeController.selectDay("2026-09-06");
assert.equal(edgeController.state.selectedTime, edgeStart + 11.5 * 3600 - 60, "seed past the interval end leaves 60 seconds of watchable video");
for (const input of ["pointer", "keyboard", "event"]) {
  const requested = deferred(), response = deferred();
  const intentHost = { ...host, _view: "history", _hass: { ...hass, async callWS(message) {
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
assert.match(renderCameraHistoryView({ state: controller.state }), /data-state="unknown"/);
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
