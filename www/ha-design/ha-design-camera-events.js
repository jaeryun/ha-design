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
// Tapo 감지 binary_sensor의 friendly name 접미사만으로 표시 라벨을 정한다. 이름 규칙을
// 모르는 entity는 friendly name 그대로 두고, 이름도 없으면 entity ID를 쓴다.
export const CAMERA_EVENT_LABEL_RULES = [
  { words: ["cell", "motion", "detection"], label: "움직임" },
  { words: ["person", "detection"], label: "사람" },
  { words: ["pet", "detection"], label: "반려동물" },
  { words: ["vehicle", "detection"], label: "차량" },
  { words: ["baby", "cry", "detection"], label: "아기 울음" },
  { words: ["bark", "detection"], label: "짖음" },
  { words: ["meow", "detection"], label: "고양이 울음" },
  { words: ["glass", "break", "detection"], label: "유리 깨짐" },
  { words: ["tamper", "detection"], label: "가림/훼손" },
];
const matchesEventSuffix = (name, words) => {
  const candidates = [words.join(" ")];
  if (words.at(-1) === "detection") candidates.push(words.slice(0, -1).join(" "));
  return candidates.some(candidate => name === candidate || name.endsWith(` ${candidate}`));
};
export const cameraEventLabel = (entityId, hass) => {
  const friendly = hass?.states?.[entityId]?.attributes?.friendly_name;
  const name = typeof friendly === "string" && friendly.trim() ? friendly.trim() : String(entityId);
  const rule = CAMERA_EVENT_LABEL_RULES.find(entry => matchesEventSuffix(name.toLowerCase(), entry.words));
  return rule ? rule.label : name;
};
export const cameraEventSources = (config, hass) => {
  const entities = Array.isArray(config?.event_entities) ? config.event_entities : [];
  const seen = new Set(), sources = [];
  for (const entityId of entities) {
    if (typeof entityId !== "string" || !entityId || seen.has(entityId)) continue;
    seen.add(entityId); sources.push({ entityId, label: cameraEventLabel(entityId, hass) });
  }
  return sources;
};
// 라벨은 entity가 사라져도 유지한다. 지금 없는 감지원만 unavailable로 표시하고, 과거에
// 기록된 이벤트는 그대로 보여준다.
export const cameraUnavailableEventSources = (sources, hass) => sources.filter(source => {
  const entity = hass?.states?.[source.entityId];
  return !entity || entity.state === "unavailable" || entity.state === "unknown";
});
export const cameraEventHistoryPath = (sources, start, end) => `history/period/${encodeURIComponent(new Date(start * 1000).toISOString())}?${[
  `filter_entity_id=${encodeURIComponent(sources.map(source => source.entityId).join(","))}`,
  `end_time=${encodeURIComponent(new Date(end * 1000).toISOString())}`,
  "minimal_response=true", "no_attributes=true", "significant_changes_only=true",
].join("&")}`;
const eventRowState = row => row?.state ?? row?.s;
const eventRowTime = row => {
  const value = row?.last_changed ?? row?.lc ?? row?.lu;
  return typeof value === "number" ? value : Date.parse(value) / 1000;
};
// 응답은 요청 entity 순서와 어긋날 수 있고(기록 없는 entity는 시리즈 자체가 빠진다),
// 시리즈를 배열 위치로 맞추면 감지원이 뒤바뀐다. 각 시리즈의 entity_id가 있는 첫 행으로만
// 귀속하고, entity_id가 없는 시리즈는 건너뛴다.
export const parseCameraEventHistory = (series, sources, window) => {
  if (!Array.isArray(series)) throw new Error("Invalid Home Assistant history response");
  const byEntity = new Map(sources.map(source => [source.entityId, source]));
  const events = [], seen = new Set();
  for (const group of series) {
    if (!Array.isArray(group)) throw new Error("Invalid Home Assistant history series");
    const entityId = group.find(row => typeof row?.entity_id === "string")?.entity_id;
    const source = entityId ? byEntity.get(entityId) : null;
    if (!source) continue;
    for (const row of group) {
      if (eventRowState(row) !== "on") continue;
      const time = eventRowTime(row);
      // HA는 창 시작 시점에 켜져 있던 상태를 합성 기준선으로 넣으면서 last_changed를
      // 조회 시작 시각으로 잘라낸다(실측: 몇 주 전에 켜진 센서도 시작 시각과 동일). 이 행은
      // 새 감지가 아니므로 시작 시각 이하를 버린다. 창 끝은 반열림이라 다음 날 자정 감지는
      // 다음 날짜에만 속한다.
      if (!Number.isFinite(time) || time <= window.start || time >= window.end) continue;
      const id = `${source.entityId}-${time}`;
      if (seen.has(id)) continue;
      seen.add(id);
      events.push({ id, entityId: source.entityId, label: source.label, time });
    }
  }
  return events.sort((a, b) => a.time - b.time || a.entityId.localeCompare(b.entityId));
};
// 선택한 날짜/조회 창 안의 실제 on 전환 시각만 모은다. 구간 길이나 고정 간격을 추론하지 않는다.
export const loadCameraEvents = async (hass, sources, start, end) => {
  if (!sources.length) return [];
  return parseCameraEventHistory(await hass.callApi("GET", cameraEventHistoryPath(sources, start, end)), sources, { start, end });
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
