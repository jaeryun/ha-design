const HISTORY_DAYS = 31;
const EPISODE_GAP_MS = 5 * 60 * 1000;
const EVENT_KIND_ORDER = ["person", "motion", "sound"];
const localMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const CAMERA_EVENT_KIND = {
  person: { label: "사람 감지" },
  motion: { label: "움직임 감지" },
  sound: { label: "소리 감지" },
};

export const CAMERA_TIMELINE_HOURS = [0, 4, 8, 12, 16, 20, 24];

export const cameraHistorySources = (config) => [
  { entityId: config.motion_event_entity, kind: "motion" },
  { entityId: config.person_event_entity, kind: "person" },
  { entityId: config.sound_event_entity, kind: "sound" },
].filter(({ entityId }) => Boolean(entityId));

export const cameraHistoryWindow = (now = new Date()) => {
  const start = new Date(now.getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000);
  return {
    start,
    end: now,
    firstMonth: localMonthKey(start),
    lastMonth: localMonthKey(now),
  };
};

export const cameraHistoryPath = (sources, now = new Date()) => {
  const window = cameraHistoryWindow(now);
  const entityIds = sources.map(({ entityId }) => entityId).join(",");
  const query = [
    `filter_entity_id=${encodeURIComponent(entityIds)}`,
    `end_time=${encodeURIComponent(window.end.toISOString())}`,
    "minimal_response=true",
    "no_attributes=true",
    "significant_changes_only=true",
  ].join("&");
  return `history/period/${encodeURIComponent(window.start.toISOString())}?${query}`;
};

export const parseCameraHistory = (series, sources) =>
  sources
    .flatMap((source, index) =>
      (Array.isArray(series?.[index]) ? series[index] : [])
        .filter(({ state }) => state === "on")
        .flatMap(({ last_changed: lastChanged }) => {
          const date = new Date(lastChanged);
          if (Number.isNaN(date.getTime())) return [];
          const timestamp = date.toISOString();
          return [{
            id: `${source.entityId}-${timestamp}`,
            entityId: source.entityId,
            kind: source.kind,
            timestamp,
          }];
        }),
    )
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp));

export const localCameraDateKey = (value) => {
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const localSecondOfDay = (value) => {
  const date = new Date(value);
  return date.getHours() * 3600
    + date.getMinutes() * 60
    + date.getSeconds()
    + date.getMilliseconds() / 1000;
};

export const cameraEpisodeDurationSeconds = (episode) =>
  localSecondOfDay(episode.endTimestamp) - localSecondOfDay(episode.startTimestamp);

export const cameraEpisodeDurationMinutes = (episode) =>
  cameraEpisodeDurationSeconds(episode) / 60;

export const cameraTimelinePlacement = (episode) => {
  const startSeconds = localSecondOfDay(episode.startTimestamp);
  const durationSeconds = cameraEpisodeDurationSeconds(episode);
  return {
    startPercent: startSeconds / (24 * 60 * 60) * 100,
    widthPercent: durationSeconds / (24 * 60 * 60) * 100,
    point: durationSeconds === 0,
  };
};

export const groupCameraEvents = (events) => {
  const groups = [];
  const sorted = [...events].sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp));
  for (const event of sorted) {
    const group = groups.at(-1);
    const previous = group?.at(-1);
    const startsNewGroup = !group
      || localCameraDateKey(event.timestamp) !== localCameraDateKey(group[0].timestamp)
      || new Date(event.timestamp).getTime() - new Date(previous.timestamp).getTime() > EPISODE_GAP_MS;
    if (startsNewGroup) groups.push([event]);
    else group.push(event);
  }
  return groups
    .map((items) => {
      const startTimestamp = items[0].timestamp;
      const endTimestamp = items.at(-1).timestamp;
      const kinds = EVENT_KIND_ORDER.filter((kind) =>
        items.some((event) => event.kind === kind));
      return {
        id: `${localCameraDateKey(startTimestamp)}|${startTimestamp}`,
        dateKey: localCameraDateKey(startTimestamp),
        startTimestamp,
        endTimestamp,
        kinds,
        events: [...items].reverse(),
      };
    })
    .sort((left, right) =>
      right.startTimestamp.localeCompare(left.startTimestamp));
};

export const filterCameraEpisodes = (episodes, selectedKinds) => {
  const selected = new Set(selectedKinds);
  return episodes.filter((episode) =>
    episode.kinds.some((kind) => selected.has(kind)));
};

export const loadCameraHistory = async (hass, config, now = new Date()) => {
  const sources = cameraHistorySources(config);
  if (sources.length === 0) return [];
  const response = await hass.callApi("GET", cameraHistoryPath(sources, now));
  return parseCameraHistory(response, sources);
};
