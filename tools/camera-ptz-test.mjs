import assert from "node:assert/strict";

globalThis.HTMLElement = class {};
globalThis.customElements = { get: () => undefined, define() {} };
globalThis.window = {};
const { renderCameraView } =
  await import("../www/ha-design/ha-design-camera-card.template.js");

const state = (value, attributes = {}) => ({ state: value, attributes });
const entity = {
  camera: "camera.test",
  privacy: "switch.test_privacy",
  recording: "switch.test_recording",
  angle: "number.test_angle",
  up: "button.test_up",
  down: "button.test_down",
  left: "button.test_left",
  right: "button.test_right",
};
const config = {
  camera_entity: entity.camera,
  privacy_entity: entity.privacy,
  recording_entity: entity.recording,
  movement_angle_entity: entity.angle,
  move_up_entity: entity.up,
  move_down_entity: entity.down,
  move_left_entity: entity.left,
  move_right_entity: entity.right,
};
const hass = {
  states: {
    [entity.camera]: state("idle"),
    [entity.privacy]: state("off"),
    [entity.recording]: state("on"),
    [entity.angle]: state("unavailable", { min: 5, max: 120 }),
    [entity.up]: state("unavailable"),
    [entity.down]: state("unavailable"),
    [entity.left]: state("unavailable"),
    [entity.right]: state("unavailable"),
  },
  hassUrl: (value) => value,
};

const unavailable = renderCameraView({
  config,
  hass,
  events: [],
  dialogOpen: true,
});
assert.doesNotMatch(unavailable, /NaN/);
assert.match(unavailable, /<strong>—°<\/strong>/);
assert.match(unavailable, /data-action="angle-decrease"[^>]*disabled/);
assert.match(unavailable, /aria-label="위로 이동"/);

hass.states[entity.angle] = state("15", { min: 5, max: 120 });
for (const id of [entity.up, entity.down, entity.left, entity.right]) {
  hass.states[id] = state("unknown");
}
const available = renderCameraView({
  config,
  hass,
  events: [],
  dialogOpen: true,
});
assert.match(available, /<strong>15°<\/strong>/);
assert.doesNotMatch(available, /data-action="angle-decrease"[^>]*disabled/);
assert.match(available, /aria-label="위로 15도 이동"/);
assert.equal((available.match(/data-direction=/g) ?? []).length, 4);
assert.equal((available.match(/data-direction=[^>]+disabled/g) ?? []).length, 0);

console.log("PASS camera PTZ invalid-angle and live-button contract");
