import assert from "node:assert/strict";

let cameraEvents;
try {
  cameraEvents = await import("../www/ha-design/ha-design-camera-events.js");
} catch {
  cameraEvents = {};
}

assert.equal(
  typeof cameraEvents.parseCameraHistory,
  "function",
  "parseCameraHistory must exist",
);

const sources = [
  { entityId: "binary_sensor.motion", kind: "motion" },
  { entityId: "binary_sensor.person", kind: "person" },
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
];

const events = cameraEvents.parseCameraHistory(series, sources);
assert.deepEqual(
  events.map(({ kind, timestamp }) => ({ kind, timestamp })),
  [
    { kind: "person", timestamp: "2026-08-30T10:30:00.000Z" },
    { kind: "motion", timestamp: "2026-08-30T10:00:00.000Z" },
  ],
);

const path = cameraEvents.cameraHistoryPath(
  sources,
  new Date("2026-08-31T00:00:00Z"),
);
assert.match(path, /^history\/period\//);
assert.match(path, /binary_sensor\.motion%2Cbinary_sensor\.person/);
assert.match(path, /minimal_response=true/);
const query = new URL(`http://ha.local/${path}`).searchParams;
assert.equal(query.get("filter_entity_id"), "binary_sensor.motion,binary_sensor.person");
assert.equal(query.get("minimal_response"), "true");

console.log("PASS camera event history contract");
