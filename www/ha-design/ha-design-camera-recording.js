const PRE_ROLL_SECONDS = 15;
const POST_ROLL_SECONDS = 55;

export const createCameraRecordingState = () => ({
  status: "idle",
  url: null,
  anchorTimestamp: null,
  startEpoch: null,
  endEpoch: null,
});

export const cameraRecordingWindow = (episode) => {
  const anchorTimestamp = episode?.events?.[0]?.timestamp
    ?? episode?.endTimestamp;
  const anchorEpoch = Date.parse(anchorTimestamp) / 1000;
  if (!Number.isFinite(anchorEpoch)) return null;
  return {
    anchorTimestamp,
    startEpoch: anchorEpoch - PRE_ROLL_SECONDS,
    endEpoch: anchorEpoch + POST_ROLL_SECONDS,
    durationSeconds: PRE_ROLL_SECONDS + POST_ROLL_SECONDS,
  };
};

export const cameraRecordingProxyPath = (hass, config, recordingWindow) => {
  if (!recordingWindow) return null;
  const attributes = hass?.states?.[config?.camera_entity]?.attributes;
  const clientId = attributes?.client_id;
  const cameraName = attributes?.camera_name;
  if (!clientId || !cameraName) return null;
  return [
    "/api/frigate",
    encodeURIComponent(clientId),
    "vod",
    encodeURIComponent(cameraName),
    "start",
    recordingWindow.startEpoch,
    "end",
    recordingWindow.endEpoch,
    "index.m3u8",
  ].join("/");
};
