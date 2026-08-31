const HISTORY_DAYS = 7;

export const CAMERA_EVENT_KIND = {
  motion: { label: "움직임 감지" },
  person: { label: "사람 감지" },
  sound: { label: "소리 감지" },
};

export const cameraHistorySources = (config) => [
  { entityId: config.motion_event_entity, kind: "motion" },
  { entityId: config.person_event_entity, kind: "person" },
].filter(({ entityId }) => Boolean(entityId));

export const cameraHistoryPath = (sources, now = new Date()) => {
  const start = new Date(now.getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000);
  const entityIds = sources.map(({ entityId }) => entityId).join(",");
  const query = [
    `filter_entity_id=${encodeURIComponent(entityIds)}`,
    `end_time=${encodeURIComponent(now.toISOString())}`,
    "minimal_response=true",
    "no_attributes=true",
    "significant_changes_only=true",
  ].join("&");
  return `history/period/${encodeURIComponent(start.toISOString())}?${query}`;
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

export const loadCameraHistory = async (hass, config, now = new Date()) => {
  const sources = cameraHistorySources(config);
  if (sources.length === 0) return [];
  const response = await hass.callApi("GET", cameraHistoryPath(sources, now));
  return parseCameraHistory(response, sources);
};
