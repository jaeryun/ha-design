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
