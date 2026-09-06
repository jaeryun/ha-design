export const parseCameraWsJson = value => typeof value === "string" ? JSON.parse(value) : value;
export const cameraRecordingSource = (hass, config) => {
  const attributes = hass?.states?.[config?.camera_entity]?.attributes;
  return attributes?.client_id && attributes?.camera_name
    ? { instance_id: attributes.client_id, camera: attributes.camera_name } : null;
};
export const parseCameraSegments = value => {
  const rows = parseCameraWsJson(value);
  if (!Array.isArray(rows)) throw new Error("Invalid Frigate recordings response");
  return rows.map(row => {
    const { start_time: start, end_time: end, duration } = row;
    if (![start, end, duration].every(Number.isFinite) || end <= start || duration <= 0) {
      throw new Error("Invalid Frigate recording segment");
    }
    return { start, end, duration };
  }).sort((a, b) => a.start - b.start);
};

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

export const cameraRecordingCoverage = (segments, day, now, status = "ready", verifiedUntil = now) => {
  const end = Math.max(day.start, Math.min(day.end, now));
  const verifiedEnd = Math.max(day.start, Math.min(end, verifiedUntil));
  const intervals = [];
  if (status !== "ready") {
    if (end > day.start) intervals.push({ start: day.start, end, type: status === "idle" ? "unknown" : status });
  } else {
    const merged = [];
    for (const segment of segments) {
      const start = Math.max(day.start, segment.start), stop = Math.min(verifiedEnd, segment.end);
      if (stop <= start) continue;
      const previous = merged.at(-1);
      if (previous && start <= previous.end) previous.end = Math.max(previous.end, stop);
      else merged.push({ start, end: stop, type: "recorded" });
    }
    let cursor = day.start;
    for (const interval of merged) {
      if (interval.start > cursor) intervals.push({ start: cursor, end: interval.start, type: "gap" });
      intervals.push(interval); cursor = interval.end;
    }
    if (cursor < verifiedEnd) intervals.push({ start: cursor, end: verifiedEnd, type: "gap" });
    if (verifiedEnd < end) intervals.push({ start: verifiedEnd, end, type: "unknown" });
  }
  if (end < day.end) intervals.push({ start: end, end: day.end, type: "future" });
  return intervals;
};
// Frigate concatenates media durations, dropping wall-clock gaps entirely.
export const cameraRecordingOffset = (segments, timestamp) => {
  let offset = 0;
  for (const segment of segments) {
    if (timestamp >= segment.start && timestamp < segment.end) return offset + Math.min(timestamp - segment.start, segment.duration);
    offset += segment.duration;
  }
  return null;
};
export const cameraRecordingTimestamp = (segments, offset) => {
  for (const segment of segments) {
    if (offset < segment.duration) return Math.min(segment.end, segment.start + offset);
    offset -= segment.duration;
  }
  return segments.at(-1)?.end ?? null;
};
export const cameraRecordingWindow = (timestamp, segments, day, now) => {
  const hourStart = day.start + Math.floor((timestamp - day.start) / 3600) * 3600;
  const hourEnd = Math.min(day.end, hourStart + 3600, now);
  // Expand to complete boundary segments: nginx-vod can snap a trimmed start to
  // an earlier keyframe, which would otherwise invalidate our absolute offset.
  const selected = segments.filter(s => s.end > hourStart && s.start < hourEnd).map(s => {
    const end = Math.min(s.end, now);
    const duration = (Math.trunc(s.duration * 1000) - Math.trunc(Math.max(0, s.end - end) * 1000)) / 1000;
    return { ...s, end, duration };
  }).filter(s => s.duration > 0);
  const offsetSeconds = cameraRecordingOffset(selected, timestamp);
  if (offsetSeconds === null || !selected.length) return null;
  return { anchorTimestamp: new Date(timestamp * 1000).toISOString(), startEpoch: selected[0].start,
    endEpoch: selected.at(-1).end, durationSeconds: selected.reduce((sum, s) => sum + s.duration, 0), offsetSeconds, segments: selected };
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
