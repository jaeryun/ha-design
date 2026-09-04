import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { CAMERA_REQUIRED_FIELDS } from "../www/ha-design/ha-design-camera-card.config.js";

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
  "switch.geosil_geosilkamera_auto_track",
  "select.geosil_geosilkamera_motion_detection",
  "select.geosil_geosilkamera_person_detection",
  "select.geosil_geosilkamera_pet_detection",
  "select.geosil_geosilkamera_vehicle_detection",
  "select.geosil_geosilkamera_tamper_detection",
  "select.geosil_geosilkamera_baby_cry_detection",
  "select.geosil_geosilkamera_bark_detection",
  "select.geosil_geosilkamera_meow_detection",
  "select.geosil_geosilkamera_glass_break_detection",
  "binary_sensor.geosil_geosilkamera_kamera1_cell_motion_detection",
  "binary_sensor.geosil_geosilkamera_kamera1_person_detection",
  "binary_sensor.geosil_geosilkamera_noise",
];
const c120EntityIds = [
  "camera.c120",
  "switch.agikamera_privacy",
  "switch.c120_recordings",
  "select.agikamera_motion_detection",
  "select.agikamera_person_detection",
  "select.agikamera_pet_detection",
  "select.agikamera_vehicle_detection",
  "select.agikamera_baby_cry_detection",
  "select.agikamera_bark_detection",
  "select.agikamera_meow_detection",
  "select.agikamera_glass_break_detection",
  "binary_sensor.agi_agikamera_cell_motion_detection",
  "binary_sensor.agi_agikamera_person_detection",
  "binary_sensor.agikamera_noise",
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
  for (const entityId of entityIds) assert.ok(source.includes(entityId));
  for (const entityId of c120EntityIds) assert.ok(source.includes(entityId));
}

assert.deepEqual(
  CAMERA_REQUIRED_FIELDS,
  [
    "camera_entity",
    "privacy_entity",
    "recording_entity",
    "motion_event_entity",
    "person_event_entity",
    "sound_event_entity",
  ],
);

assert.match(resource, /^id:\s+645f25c65a1c4da0be1962ffa526157d$/m);
assert.match(resource, /^type:\s+module$/m);
assert.match(
  resource,
  /^url:\s+https:\/\/cdn\.jsdelivr\.net\/gh\/jaeryun\/ha-design@d865f777d25f8ba3400100d0f0b6ebcdf3caa815\/www\/ha-design\/ha-design-camera-card\.js\?v=camera-mobile-snapshot-20260905-1$/m,
);
assert.match(actions, /callService\("button", "press"/);
assert.match(actions, /callService\("select", "select_option"/);
assert.match(actions, /player\.entityid\s*=\s*entityId/);
assert.match(actions, /player\.streamname\s*=\s*streamName/);
assert.match(actions, /player\.controls\s*=\s*true/);
assert.match(card, /CameraEventController/);
assert.match(eventController, /loadCameraHistory/);
assert.match(card, /ha-design-camera-card\.config\.js\?v=camera-c120-20260903-1/);
assert.match(card, /ha-design-camera-card\.template\.js\?v=camera-native-fullscreen-20260905-1/);
assert.match(card, /ha-design-camera-card\.styles\.js\?v=camera-mobile-snapshot-20260905-1/);
assert.match(card, /ha-design-camera-actions\.js\?v=camera-stream-override-20260903-1/);
assert.match(template, /ha-design-camera-webrtc\.js\?v=camera-native-fullscreen-20260905-1/);
assert.match(card, /ha-design-camera-event-controller\.js\?v=camera-vod-clip-20260902-1/);
assert.match(eventController, /ha-design-camera-event-state\.js\?v=camera-native-lifecycle-20260902-1/);
assert.match(eventController, /ha-design-camera-recording\.js\?v=camera-vod-clip-20260902-1/);
assert.match(eventModel, /CAMERA_TIMELINE_HOURS\s*=\s*\[0,\s*4,\s*8,\s*12,\s*16,\s*20,\s*24\]/);
assert.match(recordingModel, /cameraRecordingProxyPath/);
assert.match(recordingModel, /cameraRecordingMasterPlaylistUrl/);
assert.match(recordingModel, /cameraRecordingMasterVariantPath/);
assert.match(recordingModel, /durationSeconds:\s*PRE_ROLL_SECONDS\s*\+\s*POST_ROLL_SECONDS/);
assert.match(eventTemplate, /data-event-kind-filter/);
assert.match(eventTemplate, /data-episode-id/);
assert.match(eventDetailTemplate, /class="raw-event"/);
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
assert.match(template, /data-action="events"/);
assert.match(template, /action:\s*"recording"/);

console.log("PASS camera deployment contract");

