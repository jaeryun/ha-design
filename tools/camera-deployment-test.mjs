import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const requiredFiles = [
  "www/ha-design/ha-design-camera-card.js",
  "www/ha-design/ha-design-camera-card.config.js",
  "www/ha-design/ha-design-camera-card.template.js",
  "www/ha-design/ha-design-camera-card.styles.js",
  "www/ha-design/ha-design-camera-webrtc.js",
  "www/ha-design/ha-design-camera-events.js",
  "www/ha-design/ha-design-camera-event-state.js",
  "www/ha-design/ha-design-camera-event-controller.js",
  "www/ha-design/ha-design-camera-recording.js",
  "www/ha-design/ha-design-camera-recording-player.js",
  "www/ha-design/ha-design-camera-events.template.js",
  "www/ha-design/ha-design-camera-events-detail.template.js",
  "www/ha-design/ha-design-camera-events.styles.js",
  "www/ha-design/ha-design-camera-events-detail.styles.js",
  "dashboards/ha-design-camera-resource.yaml",
];

for (const path of requiredFiles) {
  assert.ok(existsSync(`${root}/${path}`), `${path} must exist`);
}

const [dashboard, fullDashboard, inlineDashboard, resource, card, actions, template, webRtcPlayer, eventController, eventModel, eventTemplate, eventDetailTemplate, recordingModel] =
  await Promise.all([
    readFile(`${root}/dashboards/ha-design-camera.yaml`, "utf8"),
    readFile(`${root}/dashboards/ha-design.yaml`, "utf8"),
    readFile(`${root}/dashboards/ha-design-inline.yaml`, "utf8"),
    readFile(`${root}/dashboards/ha-design-camera-resource.yaml`, "utf8"),
    readFile(`${root}/www/ha-design/ha-design-camera-card.js`, "utf8"),
    readFile(`${root}/www/ha-design/ha-design-camera-actions.js`, "utf8"),
    readFile(`${root}/www/ha-design/ha-design-camera-card.template.js`, "utf8"),
    readFile(`${root}/www/ha-design/ha-design-camera-webrtc.js`, "utf8"),
    readFile(`${root}/www/ha-design/ha-design-camera-event-controller.js`, "utf8"),
    readFile(`${root}/www/ha-design/ha-design-camera-events.js`, "utf8"),
    readFile(`${root}/www/ha-design/ha-design-camera-events.template.js`, "utf8"),
    readFile(`${root}/www/ha-design/ha-design-camera-events-detail.template.js`, "utf8"),
    readFile(`${root}/www/ha-design/ha-design-camera-recording.js`, "utf8"),
  ]);

const entityIds = [
  "camera.main_camera",
  "switch.geosil_geosilkamera_privacy",
  "switch.main_camera_recordings",
  "number.geosil_geosilkamera_movement_angle",
  "button.geosil_geosilkamera_move_up",
  "button.geosil_geosilkamera_move_down",
  "button.geosil_geosilkamera_move_left",
  "button.geosil_geosilkamera_move_right",
];
const c120EntityIds = [
  "camera.c120",
  "switch.agikamera_privacy",
  "switch.c120_recordings",
];

for (const source of [dashboard, fullDashboard, inlineDashboard]) {
  assert.match(source, /path:\s+camera\b/);
  assert.equal(
    (source.match(/type:\s+custom:ha-design-camera-card\b/g) ?? []).length,
    2,
  );
  assert.doesNotMatch(source, /type:\s+picture-entity\b/);
  assert.doesNotMatch(source, /camera_entity:\s+camera\.geosil_geosilkamera_hd_stream\b/);
  assert.match(source, /stream_name:\s+c120_1\b/);
  for (const [camera, name] of [["main_camera", "main_camera"], ["c120", "c120"]]) {
    assert.match(source, new RegExp(`camera_entity:\\s+camera\\.${camera}\\s+frigate_client_id:\\s+frigate\\s+frigate_camera_name:\\s+${name}\\b`));
  }
  for (const entityId of entityIds) assert.ok(source.includes(entityId));
  assert.doesNotMatch(source, /(?:movement_angle|move_(?:up|down|left|right))_2\b/);
  for (const entityId of c120EntityIds) assert.ok(source.includes(entityId));
}


assert.match(resource, /^id:\s+645f25c65a1c4da0be1962ffa526157d$/m);
assert.match(resource, /^type:\s+module$/m);
assert.match(actions, /callService\("button", "press"/);
assert.match(actions, /player\.entityid\s*=\s*entityId/);
assert.match(actions, /player\.streamname\s*=\s*streamName/);
assert.match(actions, /player\.controls\s*=\s*true/);
assert.match(eventController, /frigate\/recordings\/summary/);
assert.match(eventController, /frigate\/recordings\/get/);
assert.match(template, /ha-design-camera-webrtc\.js/);
assert.match(template, /<ha-design-camera-webrtc-player class="live-video">/);
assert.doesNotMatch(template, /data-action="fullscreen"|fullscreen-exit|recording-badge/);
assert.match(template, /ptzAvailable/);
assert.doesNotMatch(template, /badge:\s*privacyOn\s*\?\s*"프라이버시"\s*:\s*"LIVE"/);
assert.doesNotMatch(template, /<ha-hls-player/);
assert.doesNotMatch(template, /<ha-camera-stream/);
assert.match(webRtcPlayer, /type:\s*"auth\/sign_path"/);
assert.match(webRtcPlayer, /go2rtc\/ws\/api\/ws/);
assert.match(webRtcPlayer, /new RTCPeerConnection/);
assert.match(webRtcPlayer, /iceServers:\s*\[\]/);
assert.match(webRtcPlayer, /addTransceiver\("video"/);
assert.match(webRtcPlayer, /addTransceiver\("audio"/);
assert.match(template, /data-action="history-view"/);
assert.doesNotMatch(template, /data-action="events"/);
assert.match(card, /renderCameraHistoryView/);
assert.match(template, /action:\s*"recording"/);

// 한 모듈은 한 revision key로만 참조한다. 두 key가 섞이면 같은 파일을 두 번 내려받는다.
const moduleFiles = [
  "ha-design-camera-card.js",
  "ha-design-camera-card.template.js",
  "ha-design-camera-card.config.js",
  "ha-design-camera-card.styles.js",
  "ha-design-camera-event-controller.js",
  "ha-design-camera-event-state.js",
  "ha-design-camera-events.js",
  "ha-design-camera-events.template.js",
  "ha-design-camera-events-detail.template.js",
  "ha-design-camera-events.styles.js",
  "ha-design-camera-events-detail.styles.js",
  "ha-design-camera-recording.js",
  "ha-design-camera-recording-player.js",
  "ha-design-camera-webrtc.js",
  "ha-design-camera-actions.js",
  "ha-design-camera-controls.styles.js",
  "ha-design-device-compact.js",
];
const moduleSources = await Promise.all(
  moduleFiles.map((name) => readFile(`${root}/www/ha-design/${name}`, "utf8")),
);
const keysByModule = new Map();
for (const source of moduleSources) {
  for (const match of source.matchAll(/\.\/(ha-design-[a-z0-9.-]+\.js)\?v=([^"']+)/g)) {
    const keys = keysByModule.get(match[1]) ?? new Set();
    keys.add(match[2]);
    keysByModule.set(match[1], keys);
  }
}
for (const [module, keys] of keysByModule) {
  assert.equal(keys.size, 1, `${module} must be imported with exactly one cache key, got ${[...keys].join(", ")}`);
}

console.log("PASS camera deployment contract");

