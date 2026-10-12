import assert from "node:assert/strict";
import * as events from "../www/ha-design/ha-design-camera-events.js";
import * as recordings from "../www/ha-design/ha-design-camera-recording.js";
import { cameraStateInterval, cameraStateNeighbour, cameraVisibleEvents, createCameraEventState } from "../www/ha-design/ha-design-camera-event-state.js";
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
// 3분 이하 공백은 같은 녹화로 보고, 그 안을 고르면 가장 가까운 실제 영상으로 붙인다.
const snapSegments = [{ start: 100, end: 200, duration: 100 }, { start: 260, end: 400, duration: 140 }];
assert.equal(recordings.cameraRecordingSnap(snapSegments, 150), 150, "영상 위 시각은 그대로 둔다");
assert.equal(recordings.cameraRecordingSnap(snapSegments, 230), 260, "구멍 뒤쪽은 다음 segment 시작으로 붙는다");
assert.equal(recordings.cameraRecordingSnap(snapSegments, 210), 199, "구멍 앞쪽은 이전 segment 끝으로 붙는다");
// 짧은 녹화도 주변 넓은 영역에서 잡힌다: 10초 블록 양옆 공백에서 눌러도 그 블록으로 붙는다.
const shortBlock = [{ start: 3600, end: 3610, duration: 10 }];
assert.equal(recordings.cameraRecordingSnap(shortBlock, 3600 - 1800), 3600, "앞쪽 공백 30분 지점은 짧은 블록 시작으로 붙는다");
assert.equal(recordings.cameraRecordingSnap(shortBlock, 3610 + 1800), 3609, "뒤쪽 공백 30분 지점은 짧은 블록 끝으로 붙는다");
const holeState = createCameraEventState(now, zone);
holeState.coverageStatus = "ready";
holeState.coverageUntil = holeState.now;
holeState.segments = recordings.parseCameraSegments(JSON.stringify([
  { start_time: holeState.day.start + 3600, end_time: holeState.day.start + 3700, duration: 100 },
  { start_time: holeState.day.start + 3800, end_time: holeState.day.start + 4000, duration: 200 },
]));
holeState.selectedTime = holeState.day.start + 3750;
assert.equal(cameraStateInterval(holeState).type, "recorded", "3분 이하 구멍은 같은 녹화로 본다");
holeState.selectedTime = holeState.day.start + 4200;
assert.equal(cameraStateInterval(holeState).type, "gap", "3분을 넘는 공백은 gap이다");
// 미확인(마지막 조회 이후) 구간의 문구와 재시도는 그대로 남는다. 입력은 녹화로 붙으므로
// 이 상태는 조회 범위가 비어 있을 때만 나타난다.
const unverified = createCameraEventState(now, zone);
unverified.coverageStatus = "ready";
unverified.coverageUntil = unverified.now - 600;
unverified.segments = recordings.parseCameraSegments(JSON.stringify([{ start_time: unverified.day.start + 3600, end_time: unverified.day.start + 7200, duration: 3600 }]));
unverified.selectedTime = unverified.now - 300;
const unverifiedHtml = renderCameraHistoryView({ state: unverified });
assert.match(unverifiedHtml, /data-state="unknown"/, "미확인 구간은 확인 불가 문구를 유지한다");
assert.match(unverifiedHtml, /data-action="history-retry"/, "미확인 구간은 다시 확인을 제공한다");
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
// 감지 이력은 Frigate 통계가 아니라 실제 Tapo binary_sensor의 on 전환 시각에서 온다.
const eventDay = { start: 1000, end: 2000 };
const historySources = [
  { entityId: "binary_sensor.a", label: "움직임" },
  { entityId: "binary_sensor.b", label: "사람" },
  { entityId: "binary_sensor.c", label: "차량" },
];
const sparseSeries = [
  // 요청 순서(b, c, a)와 다르게 오고, 기록이 없는 c는 시리즈 자체가 빠진다.
  [
    { entity_id: "binary_sensor.b", state: "on", last_changed: "1970-01-01T00:20:00.000Z" },
    { state: "off", last_changed: "1970-01-01T00:21:00.000Z" },
    { state: "on", last_changed: "1970-01-01T00:25:00.000Z" },
  ],
  [
    // 조회 시작 시각으로 잘린 합성 기준선(중복 포함)은 새 감지가 아니다.
    { entity_id: "binary_sensor.a", state: "on", last_changed: "1970-01-01T00:16:40.000Z" },
    { state: "on", last_changed: "1970-01-01T00:16:40.000Z" },
    { state: "on", last_changed: "1970-01-01T00:18:00.000Z" },
    { state: "on", last_changed: "1970-01-01T00:40:00.000Z" },
  ],
];
assert.deepEqual(events.parseCameraEventHistory(sparseSeries, historySources, eventDay), [
  { id: "binary_sensor.a-1080", entityId: "binary_sensor.a", label: "움직임", time: 1080 },
  { id: "binary_sensor.b-1200", entityId: "binary_sensor.b", label: "사람", time: 1200 },
  { id: "binary_sensor.b-1500", entityId: "binary_sensor.b", label: "사람", time: 1500 },
], "시리즈는 entity_id로 귀속되고, 시작 기준선·창 밖 행·중복 행은 버린다");
assert.deepEqual(events.parseCameraEventHistory([[{ state: "on", last_changed: "1970-01-01T00:20:00.000Z" }]], historySources, eventDay), [],
  "entity_id 없는 시리즈는 배열 위치로 추측하지 않는다");
assert.deepEqual(events.parseCameraEventHistory([[{ entity_id: "binary_sensor.a", s: "on", lc: 1180 }]], historySources, eventDay),
  [{ id: "binary_sensor.a-1180", entityId: "binary_sensor.a", label: "움직임", time: 1180 }], "압축 행 형식도 같은 규칙으로 읽는다");
assert.deepEqual(events.parseCameraEventHistory([], historySources, eventDay), [], "기록 없는 entity만 있어도 오류가 아니다");
assert.throws(() => events.parseCameraEventHistory({ message: "nope" }, historySources, eventDay), /Invalid/, "잘못된 응답은 오류다");
assert.throws(() => events.parseCameraEventHistory([[{ entity_id: "binary_sensor.a" }], "junk"], historySources, eventDay), /Invalid/, "잘못된 시리즈는 오류다");
// 활동은 인접 감지 사이가 30분 이하일 때 이어지며, 날짜와 현재 필터를 넘지 않는다.
const groupedBase = events.cameraDayBounds("2026-09-06", zone).start;
const groupedInput = [0, 1800, 3600, 5400.001].map((offset, index) => ({
  id: `group-${index}`, entityId: index === 1 ? "binary_sensor.b" : "binary_sensor.a",
  label: index === 1 ? "사람" : "움직임", time: groupedBase + 3600 + offset,
}));
const groupedResult = events.groupCameraEvents([...groupedInput].reverse(), zone);
assert.deepEqual(groupedResult.map(group => group.events.map(event => event.id)),
  [["group-0", "group-1", "group-2"], ["group-3"]], "정확히 30분은 연결하고 30분 초과는 분리하며 연쇄는 30분보다 길어질 수 있다");
assert.deepEqual(groupedResult.map(group => [group.start, group.end]),
  [[groupedInput[0].time, groupedInput[2].time], [groupedInput[3].time, groupedInput[3].time]],
  "구간 끝은 마지막 감지 시각이며 임의 지속 시간을 덧붙이지 않는다");
assert.deepEqual(events.groupCameraEvents(cameraVisibleEvents({ events: groupedInput, eventFilter: "binary_sensor.a" }), zone)
  .map(group => group.events.map(event => event.id)), [["group-0"], ["group-2"], ["group-3"]],
  "필터에서 제외한 감지가 서로 떨어진 활동을 연결하지 않는다");
assert.equal(events.groupCameraEvents([
  { ...groupedInput[0], time: groupedBase - 1 }, { ...groupedInput[1], time: groupedBase + 1 },
], zone).length, 2, "현지 자정을 사이에 둔 감지는 2초 간격이어도 합치지 않는다");
assert.deepEqual(events.groupCameraEvents([], zone), []);
const eventSensorStates = {
  "binary_sensor.person": { state: "on", attributes: { friendly_name: "거실 카메라 Person Detection" } },
  "binary_sensor.cell": { state: "off", attributes: { friendly_name: "거실 카메라 Cell Motion Detection" } },
  "binary_sensor.bare": { state: "on" },
  "binary_sensor.gone": { state: "unavailable", attributes: {} },
};
const labelHass = { states: eventSensorStates };
for (const [name, label] of [["Cell Motion Detection", "움직임"], ["Person Detection", "사람"], ["Pet Detection", "반려동물"],
  ["Vehicle Detection", "차량"], ["Baby Cry Detection", "아기 울음"], ["Bark Detection", "짖음"], ["Meow Detection", "고양이 울음"],
  ["Glass Break Detection", "유리 깨짐"], ["Tamper Detection", "가림/훼손"]]) {
  assert.equal(events.cameraEventLabel("binary_sensor.x", { states: { "binary_sensor.x": { attributes: { friendly_name: `현관 ${name}` } } } }), label, name);
}
assert.equal(events.cameraEventLabel("binary_sensor.person", labelHass), "사람");
assert.equal(events.cameraEventLabel("binary_sensor.bare", labelHass), "binary_sensor.bare", "friendly name이 없으면 entity ID");
assert.equal(events.cameraEventLabel("binary_sensor.missing", labelHass), "binary_sensor.missing", "없는 entity도 라벨을 만든다");
assert.equal(events.cameraEventLabel("binary_sensor.x", { states: { "binary_sensor.x": { attributes: { friendly_name: "Carpet" } } } }), "Carpet", "접미사가 아니면 매핑하지 않는다");
assert.deepEqual(events.cameraEventSources({ event_entities: ["binary_sensor.person", "binary_sensor.person", "binary_sensor.cell", ""] }, labelHass),
  [{ entityId: "binary_sensor.person", label: "사람" }, { entityId: "binary_sensor.cell", label: "움직임" }], "순서를 지키고 중복·빈 값을 버린다");
assert.deepEqual(events.cameraEventSources({}, labelHass), [], "event_entities가 없으면 미설정");
assert.deepEqual(events.cameraUnavailableEventSources(events.cameraEventSources({ event_entities: ["binary_sensor.person", "binary_sensor.gone", "binary_sensor.missing"] }, labelHass), labelHass)
  .map(source => source.entityId), ["binary_sensor.gone", "binary_sensor.missing"]);
const eventPath = events.cameraEventHistoryPath(historySources, 1000, 2000);
assert.match(eventPath, /^history\/period\/1970-01-01T00%3A16%3A40\.000Z\?/);
assert.match(eventPath, /filter_entity_id=binary_sensor\.a%2Cbinary_sensor\.b%2Cbinary_sensor\.c/);
assert.match(eventPath, /end_time=1970-01-01T00%3A33%3A20\.000Z/);
for (const flag of ["minimal_response=true", "no_attributes=true", "significant_changes_only=true"]) assert.ok(eventPath.includes(flag), flag);
const state = createCameraEventState(now, zone);
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
  async callWS(message) { wsCalls.push(message); return message.type === "frigate/recordings/summary" ? '[{"day":"2026-09-06","hours":[]}]' : '[]'; }, hassUrl: value => value };
const host = { _hass: hass, _config: { camera_entity: "camera.test" }, _view: "camera", _render() {}, dispatchEvent() {}, shadowRoot: { querySelector() { return { focus() {} }; } } };
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
  assert.equal(offlineController.state.selectedTime, start + 12.5 * 3600 - 60, "오늘은 가장 가까운 블록의 끝 60초 전(라이브 끝)에서 시작한다");
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
// 기준 시각: 오늘은 현재(라이브 끝), 지난 날짜는 현지 정오.
const spanHost = dayKey => ({ ...host, _hass: { ...hass, async callWS(message) {
  if (message.type === "frigate/recordings/summary") return '[{"day":"2026-09-06","hours":[]}]';
  if (message.type === "frigate/recordings/get") {
    const dayStart = events.cameraDayBounds(dayKey, zone).start;
    return JSON.stringify([{ start_time: dayStart + 6 * 3600, end_time: dayStart + 18 * 3600, duration: 12 * 3600 }]);
  }
  return { path: message.path.endsWith("master.m3u8") ? "/signed-master" : "/signed-child" };
} } });
for (const [dayKey, offset, label] of [["2026-09-06", 13 * 3600 - 60, "오늘은 라이브 끝"], ["2026-09-05", 12 * 3600, "지난 날짜는 현지 정오"]]) {
  const seeded = new CameraEventController(spanHost(dayKey));
  seeded.clock = () => new Date("2026-09-06T04:00:00Z");
  await seeded.selectDay(dayKey);
  assert.equal(seeded.state.selectedTime, events.cameraDayBounds(dayKey, zone).start + offset, `${label}에서 시작한다`);
}
const holeHost = { ...host, _hass: { ...hass, async callWS(message) {
  if (message.type === "frigate/recordings/summary") return '[{"day":"2026-09-06","hours":[]}]';
  if (message.type === "frigate/recordings/get") {
    const dayStart = events.cameraDayBounds("2026-09-06", zone).start;
    return JSON.stringify([
      { start_time: dayStart + 3600, end_time: dayStart + 3700, duration: 100 },
      { start_time: dayStart + 3800, end_time: dayStart + 4000, duration: 200 },
    ]);
  }
  return { path: message.path.endsWith("master.m3u8") ? "/signed-master" : "/signed-child" };
} } };
const holeController = new CameraEventController(holeHost);
holeController.clock = () => new Date("2026-09-06T04:00:00Z");
await holeController.selectDay("2026-09-06");
await holeController.seek(holeController.state.day.start + 3750);
assert.equal(holeController.state.selectedTime, holeController.state.day.start + 3800, "구멍 안 선택은 가장 가까운 영상으로 붙는다");
assert.equal(holeController.state.recording.status, "ready", "구멍 안 선택도 재생 준비된다");
// 실제 공백(3분 초과)을 눌러도 상태는 공백에 머무르지 않고 가장 가까운 녹화로 붙는다.
const gapHost = { ...host, _hass: { ...hass, async callWS(message) {
  if (message.type === "frigate/recordings/summary") return '[{"day":"2026-09-06","hours":[]}]';
  if (message.type === "frigate/recordings/get") {
    const dayStart = events.cameraDayBounds("2026-09-06", zone).start;
    return JSON.stringify([{ start_time: dayStart + 3600, end_time: dayStart + 3700, duration: 100 }]);
  }
  return { path: message.path.endsWith("master.m3u8") ? "/signed-master" : "/signed-child" };
} } };
const gapController = new CameraEventController(gapHost);
gapController.clock = () => new Date("2026-09-06T04:00:00Z");
await gapController.selectDay("2026-09-06");
await gapController.seek(gapController.state.day.start + 7200);
assert.equal(gapController.state.selectedTime, gapController.state.day.start + 3699, "공백을 누르면 가장 가까운 녹화 끝으로 붙는다");
assert.equal(cameraStateInterval(gapController.state).type, "recorded", "공백 입력이 공백 상태로 남지 않는다");
assert.equal(gapController.state.recording.status, "ready");
// Tapo 감지 이력: 녹화 조회와 독립적으로, 동시에 읽고, 실패해도 재생은 그대로 남는다.
const tapoDayStart = events.cameraDayBounds("2026-09-06", zone).start;
const tapoIso = seconds => new Date(seconds * 1000).toISOString();
const tapoRecordings = JSON.stringify([{ start_time: tapoDayStart + 3000, end_time: tapoDayStart + 7200, duration: 4200 }]);
const tapoHistoryResponse = [[
  { entity_id: "binary_sensor.person", state: "on", last_changed: tapoIso(tapoDayStart + 1800) },
  { state: "on", last_changed: tapoIso(tapoDayStart + 1800) },
  { state: "off", last_changed: tapoIso(tapoDayStart + 1860) },
]];
const tapoCalls = [];
const tapoStates = {
  "camera.test": { attributes: { client_id: "frigate", camera_name: "main_camera" } },
  "binary_sensor.person": { state: "off", attributes: { friendly_name: "거실 카메라 Person Detection" } },
  "binary_sensor.cell": { state: "unavailable", attributes: { friendly_name: "거실 카메라 Cell Motion Detection" } },
};
const tapoHass = {
  config: { time_zone: zone }, states: tapoStates,
  async callApi(method, path) { tapoCalls.push({ method, path }); return tapoHistoryResponse; },
  async callWS(message) {
    tapoCalls.push(message);
    if (message.type === "frigate/recordings/summary") return '[{"day":"2026-09-06","hours":[]}]';
    if (message.type === "frigate/recordings/get") return tapoRecordings;
    return { path: message.path.endsWith("master.m3u8") ? "/signed-master" : "/signed-child" };
  },
  hassUrl: value => value,
};
const tapoHost = { ...host, _view: "history", _config: { camera_entity: "camera.test", event_entities: ["binary_sensor.person", "binary_sensor.cell"] },
  _hass: tapoHass, _events: [], dispatchEvent(event) { this._events.push(event.type); } };
const tapoController = new CameraEventController(tapoHost);
tapoController.clock = () => new Date("2026-09-06T04:00:00Z");
await tapoController.selectDay("2026-09-06");
assert.equal(tapoController.state.eventsStatus, "ready");
assert.deepEqual(tapoController.state.eventSources.map(source => [source.entityId, source.label]),
  [["binary_sensor.person", "사람"], ["binary_sensor.cell", "움직임"]], "설정한 모든 감지원의 라벨을 만든다");
assert.deepEqual(tapoController.state.unavailableEventSources.map(source => source.entityId), ["binary_sensor.cell"], "없거나 unavailable인 감지원만 표시한다");
assert.deepEqual(tapoController.state.events.map(event => [event.entityId, event.time - tapoDayStart]), [["binary_sensor.person", 1800]],
  "on 전환 1건만 남고 시작 기준선과 중복 행은 버린다");
assert.ok(tapoCalls.some(call => call.method === "GET" && call.path.startsWith("history/period/")), "감지 이력은 REST history/period로 읽는다");
assert.ok(tapoCalls.some(call => call.type === "frigate/recordings/get"), "녹화 조회와 감지 이력은 서로 다른 요청이다");
assert.ok(tapoHost._events.indexOf("camera-events-loaded") >= 0 && tapoHost._events.indexOf("camera-events-loaded") < tapoHost._events.indexOf("camera-day-loaded"),
  "camera-day-loaded는 감지 이력 로드까지 기다린다");
const tapoEvent = tapoController.state.events[0];
await tapoController.seek(tapoEvent.time, tapoEvent);
assert.equal(tapoController.state.selectedTime, tapoDayStart + 3000, "감지 시각은 가장 가까운 녹화 지점으로 붙는다");
assert.equal(tapoController.state.selectedEvent.time, tapoEvent.time, "재생이 다른 지점으로 붙어도 원래 감지 시각은 남는다");
assert.equal(tapoController.state.recording.status, "ready");
const tapoPlot = { getBoundingClientRect: () => ({ left: 0, width: 86400, top: 0 }) };
const tapoSurface = { querySelector: () => tapoPlot, focus() {} };
tapoController.handlePointer({ target: { closest: () => tapoSurface }, clientX: 1800, clientY: 10, pointerId: 1 });
assert.equal(tapoController.state.selectedEvent?.entityId, "binary_sensor.person", "마커 띠를 누르면 그 감지가 선택된다");
tapoController.handlePointerUp({ pointerId: 1 });
tapoController.handleKeydown(slider, "ArrowLeft");
assert.equal(tapoController.state.selectedEvent, null, "일반 탐색은 선택을 지운다");
tapoController.handleKeydown(slider, "Enter");
assert.equal(tapoController.state.selectedEvent?.entityId, "binary_sensor.person", "키보드로도 가장 가까운 감지를 고른다");
const clickTarget = selectors => ({ closest: selector => selectors[selector] ?? null });
assert.equal(tapoController.handleClick(clickTarget({ "[data-event-filter]": { dataset: { eventFilter: "binary_sensor.cell" } } })), true);
assert.equal(tapoController.state.eventFilter, "binary_sensor.cell");
assert.deepEqual(cameraVisibleEvents(tapoController.state), [], "필터를 걸면 그 감지원의 마커만 남는다");
tapoController.handleClick(clickTarget({ "[data-event-filter]": { dataset: { eventFilter: "" } } }));
assert.equal(tapoController.state.eventFilter, null, "빈 값은 전체 보기다");
assert.equal(cameraVisibleEvents(tapoController.state).length, 1);
const retryCalls = tapoCalls.length;
assert.equal(tapoController.handleClick(clickTarget({ "[data-action]": { dataset: { action: "events-retry" } } })), true);
await deadline((async () => { for (let i = 0; i < 500 && tapoCalls.length === retryCalls; i++) await new Promise(resolve => setTimeout(resolve, 2)); })());
assert.equal(tapoController.state.eventsStatus, "ready", "events-retry는 그 날짜 감지 이력을 다시 읽는다");
const boundarySeries = time => [[{ entity_id: "binary_sensor.a", state: "on", last_changed: time }]];
assert.deepEqual(events.parseCameraEventHistory(boundarySeries("1970-01-01T00:16:40.000Z"), historySources, eventDay), [], "시작 시각과 같은 기준선 행은 새 감지가 아니다");
assert.deepEqual(events.parseCameraEventHistory(boundarySeries("1970-01-01T00:16:41.000Z"), historySources, eventDay).map(event => event.time), [1001], "시작 직후 감지는 남긴다");
assert.deepEqual(events.parseCameraEventHistory(boundarySeries("1970-01-01T00:33:19.500Z"), historySources, eventDay).map(event => event.time), [1999.5], "창 끝 직전 감지는 그 날짜에 남는다");
assert.deepEqual(events.parseCameraEventHistory(boundarySeries("1970-01-01T00:33:20.000Z"), historySources, eventDay), [], "다음 날 자정 감지는 그 날짜에 넣지 않는다");
// 감지 서비스와 녹화 서비스는 서로의 실패에 영향을 주지 않는다.
const historyDownHost = { ...tapoHost, _hass: { ...tapoHass, async callApi() { throw new Error("history down"); } }, _events: [], dispatchEvent(event) { this._events.push(event.type); } };
const historyDown = new CameraEventController(historyDownHost);
historyDown.clock = () => new Date("2026-09-06T04:00:00Z");
await historyDown.selectDay("2026-09-06");
assert.equal(historyDown.state.eventsStatus, "error");
assert.deepEqual(historyDown.state.events, []);
assert.equal(historyDown.state.coverageStatus, "ready");
assert.equal(historyDown.state.recording.status, "ready", "감지 이력 오류는 과거 영상 재생을 막지 않는다");
assert.ok(historyDownHost._events.includes("camera-day-loaded"), "감지 이력이 실패해도 날짜 로드는 끝난다");
const failedHistoryHass = historyDownHost._hass;
historyDownHost._hass = { ...failedHistoryHass, states: { ...failedHistoryHass.states,
  "binary_sensor.person": { ...failedHistoryHass.states["binary_sensor.person"], state: "on", last_changed: tapoIso(tapoDayStart + 3600) },
} };
historyDown.updateHass(failedHistoryHass);
assert.deepEqual(historyDown.state.events.map(event => event.time), [tapoDayStart + 3600]);
assert.equal(historyDown.state.eventsStatus, "error", "새 실시간 감지가 과거 이력 조회 실패를 성공으로 바꾸지 않는다");
assert.equal(historyDown.state.recording.status, "ready");
const recordingDownHost = { ...tapoHost, _hass: { ...tapoHass, async callWS(message) {
  if (message.type === "frigate/recordings/get") throw new Error("recordings down");
  return tapoHass.callWS(message);
} }, _events: [], dispatchEvent(event) { this._events.push(event.type); } };
const recordingDown = new CameraEventController(recordingDownHost);
recordingDown.clock = () => new Date("2026-09-06T04:00:00Z");
await recordingDown.selectDay("2026-09-06");
assert.equal(recordingDown.state.coverageStatus, "error");
assert.equal(recordingDown.state.eventsStatus, "ready", "녹화 조회 오류는 감지 이력을 막지 않는다");
assert.equal(recordingDown.state.events.length, 1);
// 날짜를 연달아 바꾸면 늦게 도착한 이전 날짜의 감지 이력은 버린다.
const historyPending = [];
const staleHost = { ...tapoHost, _hass: { ...tapoHass, callApi() { const task = deferred(); historyPending.push(task); return task.promise; } },
  _events: [], dispatchEvent(event) { this._events.push(event.type); } };
const staleController = new CameraEventController(staleHost);
staleController.clock = () => new Date("2026-09-06T04:00:00Z");
const waitForCount = async (list, count) => deadline((async () => {
  for (let i = 0; i < 500 && list.length < count; i++) await new Promise(resolve => setTimeout(resolve, 2));
})());
const staleFirst = staleController.selectDay("2026-09-06");
await waitForCount(historyPending, 1);
assert.equal(historyPending.length, 1, "날짜를 열면 감지 이력을 한 번만 읽는다");
const staleSecond = staleController.selectDay("2026-09-05");
await waitForCount(historyPending, 2);
assert.equal(historyPending.length, 2, "다른 날짜를 열 때도 감지 이력을 한 번만 읽는다");
const staleDayStart = events.cameraDayBounds("2026-09-05", zone).start;
historyPending[1].resolve([[{ entity_id: "binary_sensor.person", state: "on", last_changed: tapoIso(staleDayStart + 900) }]]);
await deadline(staleSecond);
historyPending[0].resolve([[{ entity_id: "binary_sensor.person", state: "on", last_changed: tapoIso(tapoDayStart + 5000) }]]);
await deadline(staleFirst);
assert.equal(staleController.state.selectedDate, "2026-09-05");
assert.deepEqual(staleController.state.events.map(event => event.time), [staleDayStart + 900], "늦게 온 이전 날짜 감지 이력은 버린다");
// hass가 갱신될 때 실제로 바뀐 감지원만 다시 읽고, 재생 상태는 건드리지 않는다.
const liveCalls = [];
const liveHass = { ...tapoHass, callApi(method, path) { liveCalls.push(path); return tapoHistoryResponse; } };
const liveHost = { ...tapoHost, _hass: liveHass, _events: [], dispatchEvent(event) { this._events.push(event.type); } };
const liveController = new CameraEventController(liveHost);
liveController.clock = () => new Date("2026-09-06T04:00:00Z");
await liveController.selectDay("2026-09-06");
await liveController.seek(liveController.state.day.start + 3300, liveController.state.events[0]);
const liveRecordingStatus = liveController.state.recording.status;
const selectedLive = liveController.state.selectedEvent, selectedLiveTime = liveController.state.selectedTime;
const liveCount = liveCalls.length;
assert.equal(liveController.updateHass(liveHost._hass), false, "변화 없는 hass 갱신은 아무것도 하지 않는다");
assert.equal(liveCalls.length, liveCount);
const unrelatedHass = { ...liveHost._hass, states: { ...liveHost._hass.states, "camera.test": { state: "idle", attributes: { client_id: "frigate", camera_name: "main_camera" } } } };
liveHost._hass = unrelatedHass;
assert.equal(liveController.updateHass(liveHass), false, "감지원과 무관한 상태 변화는 감지 이력을 건드리지 않는다");
assert.equal(liveCalls.length, liveCount);
const offHass = { ...unrelatedHass, states: { ...unrelatedHass.states, "binary_sensor.person": { state: "off", last_changed: tapoIso(tapoDayStart + 2000) } } };
liveHost._hass = offHass;
assert.equal(liveController.updateHass(unrelatedHass), false, "off 전환은 새 감지가 아니다");
assert.equal(liveCalls.length, liveCount);
const onHass = { ...offHass, states: { ...offHass.states, "binary_sensor.person": { state: "on", last_changed: tapoIso(tapoDayStart + 2100) } } };
liveHost._hass = onHass;
assert.equal(liveController.updateHass(offHass), true, "live on 전환은 그 자리에서 합친다");
assert.equal(liveCalls.length, liveCount, "on 전환마다 하루 이력을 다시 읽지 않는다");
assert.deepEqual(liveController.state.events.map(event => event.time - tapoDayStart), [1800, 2100], "합친 감지가 목록에 들어간다");
assert.ok(liveHost._events.includes("camera-events-loaded"));
assert.equal(liveController.state.selectedTime, selectedLiveTime, "이력 갱신은 재생 위치를 건드리지 않는다");
assert.equal(liveController.state.selectedEvent?.id, selectedLive.id, "이력 갱신은 선택을 건드리지 않는다");
assert.equal(liveController.state.recording.status, liveRecordingStatus);
const cellOnHass = { ...onHass, states: { ...onHass.states, "binary_sensor.cell": { state: "on", last_changed: tapoIso(tapoDayStart + 2400) } } };
liveHost._hass = cellOnHass;
assert.equal(liveController.updateHass(onHass), true, "unavailable에서 on으로 바뀌어도 감지로 본다");
assert.deepEqual(liveController.state.events.map(event => [event.entityId, event.time - tapoDayStart]),
  [["binary_sensor.person", 1800], ["binary_sensor.person", 2100], ["binary_sensor.cell", 2400]]);
const cellOffHass = { ...cellOnHass, states: { ...cellOnHass.states, "binary_sensor.cell": { state: "off", last_changed: tapoIso(liveController.state.now + 2) } } };
liveHost._hass = cellOffHass;
assert.equal(liveController.updateHass(cellOnHass), false, "off 전환은 감지를 더하지 않는다");
const skewedHass = { ...cellOffHass, states: { ...cellOffHass.states, "binary_sensor.cell": { state: "on", last_changed: tapoIso(liveController.state.now + 3) } } };
liveHost._hass = skewedHass;
assert.equal(liveController.updateHass(cellOffHass), true, "브라우저 시계가 조금 뒤져도 방금 켜진 감지는 합친다");
assert.deepEqual(liveController.state.events.map(event => event.time - tapoDayStart), [1800, 2100, 2400, 46803]);
// 레코더 기록이 늦게 도착해도 이미 본 on 전환은 사라지지 않는다.
await liveController.loadEvents(liveController.state.day);
assert.deepEqual(liveController.state.events.map(event => event.time - tapoDayStart), [1800, 2100, 2400, 46803], "이력 재조회 뒤에도 live 감지가 남는다");
liveHost._view = "camera";
assert.equal(liveController.updateHass(skewedHass), false, "카메라 화면에서는 감지 이력을 건드리지 않는다");
liveHost._view = "history";
await liveController.selectDay("2026-09-05");
assert.deepEqual(liveController.state.events, [], "다른 날짜에서는 그 날짜 감지만 보인다");
await liveController.selectDay("2026-09-06");
assert.deepEqual(liveController.state.events.map(event => event.time - tapoDayStart), [1800, 2100, 2400, 46803], "그 날짜로 돌아오면 live 감지가 다시 붙는다");
const unconfiguredHost = { ...tapoHost, _config: { camera_entity: "camera.test" }, _hass: tapoHass, _events: [], dispatchEvent(event) { this._events.push(event.type); } };
const unconfigured = new CameraEventController(unconfiguredHost);
unconfigured.clock = () => new Date("2026-09-06T04:00:00Z");
await unconfigured.selectDay("2026-09-06");
assert.equal(unconfigured.state.eventsStatus, "unconfigured");
assert.deepEqual(unconfigured.state.events, []);
assert.deepEqual(unconfigured.state.eventSources, []);
assert.equal(unconfigured.state.coverageStatus, "ready", "감지원 미설정은 녹화 조회를 막지 않는다");
assert.ok(unconfiguredHost._events.includes("camera-events-loaded"));
for (const input of ["pointer", "keyboard"]) {
  const requested = deferred(), response = deferred();
  const intentHost = { ...host, _view: "history", _hass: { ...hass, async callWS(message) {
    if (message.type === "frigate/recordings/get") { requested.resolve(); return response.promise; }
    return { path: message.path.endsWith("master.m3u8") ? "/signed-master" : "/signed-child" };
  } } };
  const intentController = new CameraEventController(intentHost);
  intentController.clock = () => now;
  intentController.state = createCameraEventState(now, zone);
  const start = intentController.state.day.start;
  const loading = intentController.selectDay("2026-09-06");
  const seed = intentController.state.selectedTime;
  await deadline(requested.promise);
  if (input === "pointer") intentController.handlePointer({ target: { closest: () => surface }, clientX: 130, clientY: 40 });
  else intentController.handleKeydown(slider, "ArrowLeft");
  const expected = input === "pointer" ? start + 43200 : seed - 60;
  assert.equal(intentController.state.selectedTime, expected);
  response.resolve(JSON.stringify([
    { start_time: start, end_time: start + 3600, duration: 3600 },
    { start_time: start + 43200, end_time: start + 46800, duration: 3600 },
    { start_time: start + 50400, end_time: seed, duration: seed - start - 50400 },
  ]));
  await deadline(loading);
  console.log(JSON.stringify({ case: `pending day ${input}`, selectedBefore: expected - start, selectedAfter: intentController.state.selectedTime - start }));
  assert.equal(intentController.state.selectedTime, expected, "day coverage must preserve newer user intent");
  assert.equal(intentController.state.recording.status, "ready");
  const windowStart = start + Math.floor((expected - start) / 3600) * 3600;
  assert.equal(intentController.state.recording.startEpoch, windowStart);
  assert.equal(intentController.state.recording.offsetSeconds, expected - windowStart);
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
const pendingSummaries = [];
const summaryHost = { ...host, _hass: { ...hass, callWS() { const request = deferred(); pendingSummaries.push(request); return request.promise; } } };
const summaryController = new CameraEventController(summaryHost);
const oldSummary = summaryController.load(now);
summaryController.invalidate();
summaryHost._config = { camera_entity: "camera.new", frigate_client_id: "frigate", frigate_camera_name: "new" };
const newSummary = summaryController.load(now);
pendingSummaries[1].resolve([{ day: "2026-09-06", hours: [{ hour: "00", duration: 300 }] }]);
await newSummary;
pendingSummaries[0].resolve([{ day: "2026-09-05", hours: [] }]);
await oldSummary;
assert.equal(summaryController.state.summary[0].day, "2026-09-06", "old camera summaries cannot overwrite the new source");
console.log("PASS camera seven-day Tapo event history, absolute VOD, input and cancellation");
