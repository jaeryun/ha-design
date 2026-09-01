import assert from "node:assert/strict";
import * as cameraEvents from "../www/ha-design/ha-design-camera-events.js";
import {
  createCameraEventState,
  invalidateCameraEventData,
  refreshCameraEventWindow,
  setCameraEventData,
} from "../www/ha-design/ha-design-camera-event-state.js";
import { CameraEventController } from "../www/ha-design/ha-design-camera-event-controller.js";
import { renderCameraActivityDetail } from "../www/ha-design/ha-design-camera-events-detail.template.js";
import { renderCameraEventsView } from "../www/ha-design/ha-design-camera-events.template.js";
import {
  cameraRecordingMasterPlaylistUrl,
  cameraRecordingMasterVariantPath,
  cameraRecordingProxyPath,
  cameraRecordingWindow,
} from "../www/ha-design/ha-design-camera-recording.js";

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

const pointEvent = {
  id: "point",
  entityId: "binary_sensor.sound",
  kind: "sound",
  timestamp: "2026-08-30T23:34:12.000Z",
};
const pointState = createCameraEventState(new Date("2026-08-31T12:00:00"));
setCameraEventData(pointState, [pointEvent]);
const pointEpisode = pointState.episodes[0];
const pointList = renderCameraEventsView({
  state: pointState,
  title: "거실 카메라",
});
const pointDetail = renderCameraActivityDetail(pointEpisode, { status: "idle" });
assert.match(pointList, /단발성/);
assert.match(pointDetail, /단발성/);
assert.doesNotMatch(`${pointList}${pointDetail}`, /한 시점/);
assert.match(pointDetail, /data-action="recording-play"/);
assert.doesNotMatch(pointDetail, /activity-detail-hero/);
assert.match(
  pointDetail,
  /<div class="activity-detail-body">\s*<section class="activity-detail-panel activity-recording-panel"/,
);
const recordingPanelStart = pointDetail.indexOf("activity-recording-panel");
const recordingFrameStart = pointDetail.indexOf("activity-recording-frame", recordingPanelStart);
const recordingHeaderStart = pointDetail.indexOf("<header>", recordingPanelStart);
assert.ok(recordingFrameStart < recordingHeaderStart);
assert.match(pointList, /class="event-breadcrumb"/);
assert.match(pointList, /class="breadcrumb-label">거실 카메라/);
assert.match(pointList, /aria-current="page">이벤트 히스토리/);

pointState.selectedEpisodeId = pointEpisode.id;
const pointDetailView = renderCameraEventsView({
  state: pointState,
  title: "거실 카메라",
});
assert.equal((pointDetailView.match(/class="dialog-header event-header"/g) ?? []).length, 1);
assert.doesNotMatch(pointDetailView, /activity-detail-nav/);
assert.match(pointDetailView, /class="[^"]*breadcrumb-date[^"]*"[^>]*>2026년 8월 31일/);
assert.match(pointDetailView, /aria-current="page">08:34:12 이벤트/);
assert.match(pointDetailView, />녹화 영상<\/strong>/);
assert.match(pointDetailView, /08:33:57–08:35:07 · 1분 10초/);
pointState.selectedEpisodeId = null;

const recordingWindow = cameraRecordingWindow(pointEpisode);
assert.deepEqual(recordingWindow, {
  anchorTimestamp: pointEvent.timestamp,
  startEpoch: Date.parse(pointEvent.timestamp) / 1000 - 15,
  endEpoch: Date.parse(pointEvent.timestamp) / 1000 + 55,
  durationSeconds: 70,
});
assert.equal(
  cameraRecordingProxyPath({
    states: {
      "camera.test": {
        attributes: {
          client_id: "frigate living",
          camera_name: "main/camera",
        },
      },
    },
  }, { camera_entity: "camera.test" }, recordingWindow),
  `/api/frigate/frigate%20living/vod/main%2Fcamera/start/${recordingWindow.startEpoch}/end/${recordingWindow.endEpoch}/index.m3u8`,
);
assert.equal(
  cameraRecordingProxyPath({
    states: {
      "camera.test": {
        attributes: {
          client_id: "frigate",
          camera_name: "main_camera",
        },
      },
    },
  }, { camera_entity: "camera.test" }, recordingWindow, "master.m3u8"),
  `/api/frigate/frigate/vod/main_camera/start/${recordingWindow.startEpoch}/end/${recordingWindow.endEpoch}/master.m3u8`,
);
const wrappedMasterUrl = cameraRecordingMasterPlaylistUrl(
  '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=750733,RESOLUTION=1920x1080,CODECS="avc1.640032,mp4a.40.2"\nindex-v1-a1.m3u8?authSig=master-token\n',
  "https://ha.local/api/frigate/frigate/vod/range/index.m3u8?authSig=index-token",
);
assert.match(wrappedMasterUrl, /^data:application\/vnd\.apple\.mpegurl/);
const wrappedMaster = decodeURIComponent(wrappedMasterUrl.split(",")[1]);
assert.match(wrappedMaster, /CODECS="avc1\.640032,mp4a\.40\.2"/);
assert.match(wrappedMaster, /https:\/\/ha\.local\/api\/frigate\/frigate\/vod\/range\/index\.m3u8\?authSig=index-token/);
assert.doesNotMatch(wrappedMaster, /index-v1-a1\.m3u8/);
assert.equal(
  cameraRecordingMasterVariantPath(
    '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\nindex-v1-a1.m3u8?authSig=master-token\n',
    "/api/frigate/frigate/vod/main_camera/start/1/end/2/master.m3u8",
  ),
  "/api/frigate/frigate/vod/main_camera/start/1/end/2/index-v1-a1.m3u8",
);
assert.equal(
  cameraRecordingMasterVariantPath(
    '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\n../other/index.m3u8\n',
    "/api/frigate/frigate/vod/main_camera/start/1/end/2/master.m3u8",
  ),
  null,
);

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

const playbackCalls = [];
const playbackHost = {
  _config: { camera_entity: "camera.test" },
  _hass: {
    states: {
      "camera.test": {
        attributes: { client_id: "frigate", camera_name: "main_camera" },
      },
    },
    async callWS(message) {
      playbackCalls.push(message);
      return {
        path: message.path.endsWith("/master.m3u8")
          ? "/signed-master"
          : "/signed-child",
      };
    },
    hassUrl(value) {
      return value;
    },
  },
  _view: "events",
  _render() {},
  dispatchEvent() {},
  shadowRoot: {
    querySelector() {
      return { focus() {}, scrollTop: 0 };
    },
  },
};
const playbackController = new CameraEventController(playbackHost);
setCameraEventData(playbackController.state, [pointEvent]);
playbackController.state.selectedEpisodeId = playbackController.state.episodes[0].id;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  if (url === "/signed-child") {
    return { ok: true, status: 200, text: async () => "#EXTM3U\n#EXT-X-ENDLIST\n" };
  }
  assert.equal(url, "/signed-master");
  return {
    ok: true,
    status: 200,
    text: async () => '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1,CODECS="avc1.640032,mp4a.40.2"\nindex.m3u8\n',
  };
};
await playbackController.playRecording();
assert.equal(playbackController.state.recording.status, "ready");
assert.match(playbackController.state.recording.url, /^data:application\/vnd\.apple\.mpegurl/);
assert.match(
  decodeURIComponent(playbackController.state.recording.url.split(",")[1]),
  /\/signed-child/,
);
assert.equal(playbackCalls.length, 2);
assert.ok(playbackCalls.every(({ type, expires }) =>
  type === "auth/sign_path" && expires === 600));
assert.deepEqual(
  playbackCalls.map(({ path }) => path),
  [
    cameraRecordingProxyPath(
      playbackHost._hass,
      playbackHost._config,
      cameraRecordingWindow(playbackController.state.episodes[0]),
      "master.m3u8",
    ),
    `/api/frigate/frigate/vod/main_camera/start/${cameraRecordingWindow(playbackController.state.episodes[0]).startEpoch}/end/${cameraRecordingWindow(playbackController.state.episodes[0]).endEpoch}/index.m3u8`,
  ],
);
const generationBeforeListReturn = playbackController.recordingGeneration;
const activityListTarget = {
  closest(selector) {
    return ["[data-action]", '[data-action="activity-list"]'].includes(selector)
      ? { dataset: { action: "activity-list" } }
      : null;
  },
};
const activityListHandled = playbackController.handleClick(activityListTarget);
assert.equal(activityListHandled, true);
assert.equal(
  playbackController.recordingGeneration,
  generationBeforeListReturn + 1,
);
assert.equal(playbackController.state.selectedEpisodeId, null);
assert.equal(playbackController.state.recording.status, "idle");

globalThis.fetch = async () => ({ ok: false, status: 404 });
playbackController.state.selectedEpisodeId = playbackController.state.episodes[0].id;
await playbackController.playRecording();
assert.equal(playbackController.state.recording.status, "unavailable");

let resolveDeferredChild;
let signalDeferredChild;
const deferredChildStarted = new Promise((resolve) => {
  signalDeferredChild = resolve;
});
globalThis.fetch = async (url) => {
  if (url === "/signed-master") {
    return {
      ok: true,
      status: 200,
      text: async () => '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1,CODECS="avc1.640032,mp4a.40.2"\nindex.m3u8\n',
    };
  }
  assert.equal(url, "/signed-child");
  return {
    ok: true,
    status: 200,
    text() {
      signalDeferredChild();
      return new Promise((resolve) => {
        resolveDeferredChild = resolve;
      });
    },
  };
};
playbackController.state.selectedEpisodeId =
  playbackController.state.episodes[0].id;
const deferredPlayback = playbackController.playRecording();
await deferredChildStarted;
playbackController.handleClick(activityListTarget);
resolveDeferredChild("#EXTM3U\n#EXT-X-ENDLIST\n");
await deferredPlayback;
assert.equal(playbackController.state.recording.status, "idle");
assert.equal(playbackController.state.recording.url, null);
globalThis.fetch = originalFetch;

console.log("PASS camera event history contract");
