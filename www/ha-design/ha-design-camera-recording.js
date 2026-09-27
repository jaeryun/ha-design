export const parseCameraWsJson = value => typeof value === "string" ? JSON.parse(value) : value;
// 과거 영상은 카메라 entity가 살아 있어야만 조회할 수 있어서는 안 된다. 명시한
// config가 있으면 그 값을, 없으면 entity attribute를 쓴다.
export const cameraRecordingSource = (hass, config) => {
  const instanceId = config?.frigate_client_id;
  const camera = config?.frigate_camera_name;
  if (instanceId && camera) return { instance_id: instanceId, camera };
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

export const cameraRecordingCoverage = (segments, day, now, status = "ready", verifiedUntil = now, mergeGap = 0) => {
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
      // mergeGap은 표시용 띠 전용이다. 모션 녹화의 10초 segment 사이 1초 미만 경계 오차를
      // 그대로 그리면 6,000개가 넘는 1px 미만 조각이 생겨 띠가 줄무늬로 보인다.
      if (previous && start <= previous.end + mergeGap) previous.end = Math.max(previous.end, stop);
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
// "이전/다음 녹화"가 이동할 녹화 블록. Frigate는 모션 녹화를 약 10초 segment로 이어
// 붙이고 그 경계에 1초 미만의 오차가 끼므로, 정확한 segment 경계로 이동하면 10~50초씩만
// 움직인다. 아래 값 이하의 공백은 같은 녹화로 본다.
export const RECORDING_BLOCK_GAP = 180;
export const cameraRecordingBlocks = (segments, day, tolerance = RECORDING_BLOCK_GAP) => {
  const blocks = [];
  for (const segment of segments) {
    const start = Math.max(day.start, segment.start);
    const end = Math.min(day.end, segment.end);
    if (end <= start) continue;
    const last = blocks.at(-1);
    if (last && start <= last.end + tolerance) last.end = Math.max(last.end, end);
    else blocks.push({ start, end });
  }
  return blocks;
};

// 같은 녹화 블록 안의 3분 이하 공백을 선택하면 가장 가까운 실제 영상 지점으로 붙인다.
// 띠는 블록으로 그리므로 그 구멍도 채워진 구간으로 보이는데, 그대로 두면 "녹화 없음"이 뜬다.
export const cameraRecordingSnap = (segments, time) => {
  let best = null;
  for (const segment of segments) {
    if (time >= segment.start && time < segment.end) return time;
    const candidate = time < segment.start ? segment.start : Math.max(segment.start, segment.end - 1);
    const distance = Math.abs(candidate - time);
    if (!best || distance < best.distance) best = { distance, time: candidate };
  }
  return best ? best.time : time;
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
  source,
  recordingWindow,
  playlist = "index.m3u8",
) => {
  if (!recordingWindow || !source?.instance_id || !source?.camera) return null;
  if (!["index.m3u8", "master.m3u8"].includes(playlist)) return null;
  return [
    "/api/frigate",
    encodeURIComponent(source.instance_id),
    "vod",
    "clip",
    encodeURIComponent(source.camera),
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
