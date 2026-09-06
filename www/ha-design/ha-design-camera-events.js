const EPISODE_GAP_MS = 5 * 60 * 1000;
export const CAMERA_EVENT_KIND = {
  person: { label: "사람 감지" }, motion: { label: "움직임 감지" }, sound: { label: "소리 감지" },
};
export const cameraTimeZone = (hass) => hass?.config?.time_zone
  ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
const dateFormatters = new Map();
export const localCameraDateKey = (value, timeZone = cameraTimeZone()) => {
  if (!dateFormatters.has(timeZone)) dateFormatters.set(timeZone,
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }));
  const parts = Object.fromEntries(dateFormatters.get(timeZone).formatToParts(new Date(value)).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const shiftDate = (key, delta) => new Date(Date.parse(`${key}T12:00:00Z`) + delta * 86400000).toISOString().slice(0, 10);
const midnightCache = new Map();
const midnight = (key, zone) => {
  const cacheKey = `${key}|${zone}`;
  if (midnightCache.has(cacheKey)) return midnightCache.get(cacheKey);
  // Find the first instant of the local calendar date, including midnight DST changes.
  const nominal = Date.parse(`${key}T00:00:00Z`);
  let low = nominal - 36 * 3600000, high = nominal + 36 * 3600000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (localCameraDateKey(middle, zone) < key) low = middle;
    else high = middle;
  }
  midnightCache.set(cacheKey, high / 1000);
  return high / 1000;
};
export const cameraDayBounds = (dateKey, timeZone = cameraTimeZone()) => ({
  dateKey, start: midnight(dateKey, timeZone), end: midnight(shiftDate(dateKey, 1), timeZone),
});
export const cameraHistoryWindow = (now = new Date(), timeZone = cameraTimeZone()) => {
  const today = localCameraDateKey(now, timeZone);
  const days = Array.from({ length: 7 }, (_, i) => cameraDayBounds(shiftDate(today, i - 6), timeZone));
  return { start: new Date(days[0].start * 1000), end: now, days };
};
export const cameraHistorySources = config => [
  { entityId: config.motion_event_entity, kind: "motion" },
  { entityId: config.person_event_entity, kind: "person" },
  { entityId: config.sound_event_entity, kind: "sound" },
].filter(source => source.entityId);
export const cameraHistoryPath = (sources, now = new Date(), timeZone = cameraTimeZone()) => {
  const window = cameraHistoryWindow(now, timeZone);
  return `history/period/${encodeURIComponent(window.start.toISOString())}?${[
    `filter_entity_id=${encodeURIComponent(sources.map(s => s.entityId).join(","))}`,
    `end_time=${encodeURIComponent(now.toISOString())}`, "minimal_response=true", "no_attributes=true", "significant_changes_only=true",
  ].join("&")}`;
};
export const parseCameraHistory = (series, sources) => sources.flatMap((source, index) =>
  (Array.isArray(series?.[index]) ? series[index] : []).flatMap(item => {
    if (item.state !== "on" || !Number.isFinite(Date.parse(item.last_changed))) return [];
    const timestamp = new Date(item.last_changed).toISOString();
    return [{ id: `${source.entityId}-${timestamp}`, entityId: source.entityId, kind: source.kind, timestamp }];
  })).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
export const loadCameraHistory = async (hass, config, now = new Date()) => {
  const sources = cameraHistorySources(config), zone = cameraTimeZone(hass);
  if (!sources.length) return [];
  const window = cameraHistoryWindow(now, zone);
  const result = parseCameraHistory(await hass.callApi("GET", cameraHistoryPath(sources, now, zone)), sources);
  // HA includes the state at the start of the window; it is not a new detection.
  return result.filter(e => Date.parse(e.timestamp) >= window.start.getTime() && Date.parse(e.timestamp) <= now.getTime());
};
export const groupCameraEvents = (events, timeZone = cameraTimeZone()) => {
  const groups = [];
  for (const event of [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp))) {
    const group = groups.at(-1);
    if (!group || localCameraDateKey(event.timestamp, timeZone) !== localCameraDateKey(group[0].timestamp, timeZone)
      || Date.parse(event.timestamp) - Date.parse(group.at(-1).timestamp) > EPISODE_GAP_MS) groups.push([event]);
    else group.push(event);
  }
  return groups.map(items => ({
    id: items[0].id, dateKey: localCameraDateKey(items[0].timestamp, timeZone),
    startTimestamp: items[0].timestamp, endTimestamp: items.at(-1).timestamp,
    kinds: Object.keys(CAMERA_EVENT_KIND).filter(kind => items.some(e => e.kind === kind)), events: [...items].reverse(),
  })).reverse();
};
const medianEventTime = events => {
  const times = events.map(e => Date.parse(e.timestamp) / 1000).sort((a, b) => a - b);
  return times[Math.floor((times.length - 1) / 2)];
};
export const cameraTimelineEventGroups = (episodes, width, day) => {
  const scale = Math.max(1, width) / (day.end - day.start);
  const windows = episodes.map(episode => {
    const center = medianEventTime(episode.events);
    const extent = Math.max(6, (Date.parse(episode.endTimestamp) - Date.parse(episode.startTimestamp)) / 1000 * scale);
    return { events: episode.events, center, left: (center - day.start) * scale - extent / 2, right: (center - day.start) * scale + extent / 2 };
  }).sort((a, b) => a.center - b.center);
  const groups = [];
  for (const window of windows) {
    const group = groups.at(-1);
    if (group && window.left - group.right < 16) {
      group.events.push(...window.events); group.right = Math.max(group.right, window.right); group.cluster = true;
    } else groups.push({ ...window, events: [...window.events], cluster: false });
  }
  return groups.map(group => {
    const times = group.events.map(e => Date.parse(e.timestamp) / 1000), timestamp = medianEventTime(group.events);
    return { events: group.events, timestamp, start: Math.min(...times), end: Math.max(...times),
      type: group.cluster ? "cluster" : group.events.length > 1 ? "activity" : "point",
      counts: Object.fromEntries(Object.keys(CAMERA_EVENT_KIND).map(kind => [kind, group.events.filter(e => e.kind === kind).length])),
      centerPercent: (timestamp - day.start) / (day.end - day.start) * 100 };
  });
};
export const cameraTimelineTicks = (day, timeZone) => {
  const formatter = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const ticks = [];
  for (let time = day.start; time < day.end; time += 1800) {
    const [hour, minute] = formatter.format(new Date(time * 1000)).split(":").map(Number);
    if (minute === 0 && (hour % 4 === 0 || hour % 6 === 0)) ticks.push({ time, hour, desktop: hour % 4 === 0, mobile: hour % 6 === 0 });
  }
  ticks.push({ time: day.end, hour: 24, desktop: true, mobile: true });
  return ticks;
};
