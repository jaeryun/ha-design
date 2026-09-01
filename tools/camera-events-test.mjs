import assert from "node:assert/strict";
import * as cameraEvents from "../www/ha-design/ha-design-camera-events.js";
import {
  createCameraEventState,
  invalidateCameraEventData,
  refreshCameraEventWindow,
  setCameraEventData,
} from "../www/ha-design/ha-design-camera-event-state.js";
import { CameraEventController } from "../www/ha-design/ha-design-camera-event-controller.js";

assert.equal(
  typeof cameraEvents.parseCameraHistory,
  "function",
  "parseCameraHistory must exist",
);

const sources = [
  { entityId: "binary_sensor.motion", kind: "motion" },
  { entityId: "binary_sensor.person", kind: "person" },
  { entityId: "binary_sensor.sound", kind: "sound" },
];
const series = [
  [
    { entity_id: "binary_sensor.motion", state: "off", last_changed: "2026-08-30T09:00:00Z" },
    { state: "on", last_changed: "2026-08-30T10:00:00Z" },
    { state: "off", last_changed: "2026-08-30T10:00:10Z" },
  ],
  [
    { entity_id: "binary_sensor.person", state: "off", last_changed: "2026-08-30T09:00:00Z" },
    { state: "on", last_changed: "2026-08-30T10:30:00Z" },
  ],
  [
    { entity_id: "binary_sensor.sound", state: "off", last_changed: "2026-08-30T09:00:00Z" },
    { state: "on", last_changed: "2026-08-30T10:31:00Z" },
  ],
];

const events = cameraEvents.parseCameraHistory(series, sources);
assert.deepEqual(
  events.map(({ kind, timestamp }) => ({ kind, timestamp })),
  [
    { kind: "sound", timestamp: "2026-08-30T10:31:00.000Z" },
    { kind: "person", timestamp: "2026-08-30T10:30:00.000Z" },
    { kind: "motion", timestamp: "2026-08-30T10:00:00.000Z" },
  ],
);

const path = cameraEvents.cameraHistoryPath(
  sources,
  new Date("2026-08-31T00:00:00Z"),
);
assert.match(path, /^history\/period\//);
assert.match(path, /binary_sensor\.motion%2Cbinary_sensor\.person%2Cbinary_sensor\.sound/);
assert.match(path, /minimal_response=true/);
const query = new URL(`http://ha.local/${path}`).searchParams;
assert.equal(query.get("filter_entity_id"), "binary_sensor.motion,binary_sensor.person,binary_sensor.sound");
assert.equal(query.get("minimal_response"), "true");

assert.deepEqual(
  cameraEvents.cameraHistorySources({
    motion_event_entity: "binary_sensor.motion",
    person_event_entity: "binary_sensor.person",
    sound_event_entity: "binary_sensor.sound",
  }),
  sources,
);

assert.equal(typeof cameraEvents.groupCameraEvents, "function");
assert.equal(typeof cameraEvents.filterCameraEpisodes, "function");
assert.equal(typeof cameraEvents.cameraTimelinePlacement, "function");
assert.deepEqual(cameraEvents.CAMERA_TIMELINE_HOURS, [0, 4, 8, 12, 16, 20, 24]);

const grouped = cameraEvents.groupCameraEvents([
  { id: "m1", entityId: "binary_sensor.motion", kind: "motion", timestamp: "2026-08-30T10:00:00.000Z" },
  { id: "p1", entityId: "binary_sensor.person", kind: "person", timestamp: "2026-08-30T10:04:00.000Z" },
  { id: "s1", entityId: "binary_sensor.sound", kind: "sound", timestamp: "2026-08-30T10:09:01.000Z" },
  { id: "s2", entityId: "binary_sensor.sound", kind: "sound", timestamp: "2026-08-31T10:10:00.000Z" },
]);
assert.deepEqual(grouped.map(({ events: items }) => items.map(({ id }) => id)), [
  ["s2"],
  ["s1"],
  ["p1", "m1"],
]);
assert.deepEqual(grouped[2].kinds, ["person", "motion"]);

assert.deepEqual(
  cameraEvents.filterCameraEpisodes(grouped, ["person", "sound"]).map(({ id }) => id),
  [grouped[0].id, grouped[1].id, grouped[2].id],
);
assert.deepEqual(cameraEvents.filterCameraEpisodes(grouped, ["person"]).map(({ id }) => id), [grouped[2].id]);
assert.deepEqual(cameraEvents.filterCameraEpisodes(grouped, []), []);

assert.deepEqual(
  cameraEvents.cameraTimelinePlacement({
    startTimestamp: "2026-08-30T18:00:00",
    endTimestamp: "2026-08-30T20:00:00",
  }),
  { startPercent: 75, widthPercent: 8.333333333333332, point: false },
);
assert.deepEqual(
  cameraEvents.cameraTimelinePlacement({
    startTimestamp: "2026-08-30T23:34:00",
    endTimestamp: "2026-08-30T23:34:00",
  }),
  { startPercent: 98.19444444444444, widthPercent: 0, point: true },
);

const exactEpisode = {
  startTimestamp: "2026-08-30T10:00:30",
  endTimestamp: "2026-08-30T10:04:59",
};
const exactPlacement = cameraEvents.cameraTimelinePlacement(exactEpisode);
assert.equal(cameraEvents.cameraEpisodeDurationSeconds(exactEpisode), 269);
assert.ok(Math.abs(exactPlacement.startPercent - 36030 / 86400 * 100) < 1e-12);
assert.ok(Math.abs(exactPlacement.widthPercent - 269 / 86400 * 100) < 1e-12);

const state = createCameraEventState(new Date("2026-09-01T12:00:00"));
setCameraEventData(state, grouped.flatMap(({ events: items }) => items));
assert.equal(state.firstMonth, "2026-08");
assert.equal(state.lastMonth, "2026-09");
assert.equal(state.selectedMonth, "2026-08");
invalidateCameraEventData(state);
assert.equal(state.status, "idle");
assert.deepEqual(state.events, []);
assert.deepEqual(state.episodes, []);

const boundaryState = createCameraEventState(new Date("2026-08-31T23:59:59"));
refreshCameraEventWindow(boundaryState, new Date("2026-09-01T00:00:01"));
assert.equal(boundaryState.firstMonth, "2026-08");
assert.equal(boundaryState.lastMonth, "2026-09");

const pendingRequests = [];
const fakeHost = {
  _config: { sound_event_entity: "binary_sensor.old" },
  _hass: {
    callApi(_method, path) {
      return new Promise((resolve) => pendingRequests.push({ path, resolve }));
    },
  },
  _render() {},
  dispatchEvent() {},
};
const controller = new CameraEventController(fakeHost);
const oldLoad = controller.load(new Date("2026-09-01T12:00:00"));
fakeHost._config = { sound_event_entity: "binary_sensor.new" };
controller.invalidate();
const newLoad = controller.load(new Date("2026-09-01T12:00:01"));
assert.equal(pendingRequests.length, 2);
assert.match(pendingRequests[0].path, /binary_sensor\.old/);
assert.match(pendingRequests[1].path, /binary_sensor\.new/);
pendingRequests[1].resolve([[{
  state: "on",
  last_changed: "2026-09-01T10:00:00Z",
}]]);
await newLoad;
pendingRequests[0].resolve([[{
  state: "on",
  last_changed: "2026-09-01T09:00:00Z",
}]]);
await oldLoad;
assert.equal(controller.state.status, "ready");
assert.deepEqual(controller.state.events.map(({ entityId }) => entityId), [
  "binary_sensor.new",
]);

console.log("PASS camera event history contract");
