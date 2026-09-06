const PRE_ROLL_SECONDS = 15;
const POST_ROLL_SECONDS = 55;
const DAY_SECONDS = 24 * 60 * 60;

export const createCameraRecordingState = () => ({
  status: "idle",
  url: null,
  nativeUrl: null,
  anchorTimestamp: null,
  startEpoch: null,
  endEpoch: null,
});

export const cameraRecordingNativeHlsSupported = (
  video = globalThis.document?.createElement?.("video"),
  runtime = globalThis.navigator,
) => {
  const appleMobile = /iPad|iPhone|iPod/.test(runtime?.userAgent ?? "")
    || (
      runtime?.platform === "MacIntel"
      && Number(runtime?.maxTouchPoints ?? 0) > 1
    );
  const nativeHls = video?.canPlayType?.(
    "application/vnd.apple.mpegurl",
  );
  return appleMobile && Boolean(nativeHls);
};

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

export const cameraRecordingCoverage = (events) => {
  const windows = events
    .map(({ timestamp }) => {
      const date = new Date(timestamp);
      const anchor = date.getHours() * 3600
        + date.getMinutes() * 60
        + date.getSeconds()
        + date.getMilliseconds() / 1000;
      return {
        start: Math.max(0, anchor - PRE_ROLL_SECONDS),
        end: Math.min(DAY_SECONDS, anchor + POST_ROLL_SECONDS),
      };
    })
    .filter(({ start, end }) => Number.isFinite(start) && end > start)
    .sort((left, right) => left.start - right.start);
  const merged = [];
  for (const window of windows) {
    const previous = merged.at(-1);
    if (previous && window.start <= previous.end) {
      previous.end = Math.max(previous.end, window.end);
    } else {
      merged.push({ ...window });
    }
  }
  return merged.map(({ start, end }) => ({
    startPercent: start / DAY_SECONDS * 100,
    widthPercent: (end - start) / DAY_SECONDS * 100,
  }));
};

export const cameraRecordingProxyPath = (
  hass,
  config,
  recordingWindow,
  playlist = "index.m3u8",
) => {
  if (!recordingWindow) return null;
  if (!["index.m3u8", "master.m3u8"].includes(playlist)) return null;
  const attributes = hass?.states?.[config?.camera_entity]?.attributes;
  const clientId = attributes?.client_id;
  const cameraName = attributes?.camera_name;
  if (!clientId || !cameraName) return null;
  return [
    "/api/frigate",
    encodeURIComponent(clientId),
    "vod",
    "clip",
    encodeURIComponent(cameraName),
    "start",
    recordingWindow.startEpoch,
    "end",
    recordingWindow.endEpoch,
    playlist,
  ].join("/");
};

export const cameraRecordingMasterPlaylistUrl = (
  masterPlaylist,
  signedIndexUrl,
) => {
  const lines = masterPlaylist.trim().split(/\r?\n/);
  const variants = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line, index }) =>
      line && !line.startsWith("#")
      && lines[index - 1]?.startsWith("#EXT-X-STREAM-INF:"));
  if (variants.length !== 1 || !signedIndexUrl) return null;
  lines[variants[0].index] = signedIndexUrl;
  const content = `${lines.join("\n")}\n`;
  return `data:application/vnd.apple.mpegurl;charset=utf-8,${encodeURIComponent(content)}`;
};

export const cameraRecordingMasterVariantPath = (
  masterPlaylist,
  masterPath,
) => {
  const lines = masterPlaylist.trim().split(/\r?\n/);
  const variants = lines.filter((line, index) =>
    line && !line.startsWith("#")
    && lines[index - 1]?.startsWith("#EXT-X-STREAM-INF:"));
  if (variants.length !== 1 || !masterPath) return null;
  const origin = "https://ha.local";
  const masterUrl = new URL(masterPath, origin);
  const variantUrl = new URL(variants[0], masterUrl);
  const expectedParent = masterUrl.pathname.slice(
    0,
    masterUrl.pathname.lastIndexOf("/") + 1,
  );
  const variantParent = variantUrl.pathname.slice(
    0,
    variantUrl.pathname.lastIndexOf("/") + 1,
  );
  if (
    variantUrl.origin !== origin
    || variantParent !== expectedParent
    || !variantUrl.pathname.endsWith(".m3u8")
  ) return null;
  return variantUrl.pathname;
};
