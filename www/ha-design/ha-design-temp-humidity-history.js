// 방 온습도 카드의 순수 로직.
//
// `hass`에 의존하지 않는다. 카드 진입점이 통계 요청을 보내고 응답을 넘겨주면,
// 이 모듈이 기간 설정, 요청 생성, 응답 파싱, 차트 기하, 요약, 쾌적도 문구를 계산한다.

export const STATISTICS_RANGES = {
  "24h": {
    id: "24h",
    label: "24시간",
    period: "hour",
    step: 1,
    hours: 24,
    description: "최근 24시간(1시간 평균)",
  },
  "7d": {
    id: "7d",
    label: "7일",
    period: "hour",
    step: 6,
    hours: 168,
    description: "최근 7일(6시간 간격 표본)",
  },
  "30d": {
    id: "30d",
    label: "30일",
    period: "day",
    step: 1,
    hours: 720,
    description: "최근 30일(1일 평균)",
  },
};

export const RANGE_IDS = Object.keys(STATISTICS_RANGES);

const STATISTICS_TYPES = ["mean", "min", "max"];

export const CHART_HEIGHT = 156;
const CHART_MIN_WIDTH = 240;
const CHART_PADDING = { top: 12, right: 10, bottom: 22, left: 38 };

const MISSING_READING = "—";

const COMFORT_UNKNOWN = { label: "확인 필요", tone: "unknown" };

const HOUR_MS = 3600000;

const numericValue = (value) => {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

// `unknown`, `unavailable`, 누락 상태는 모두 null로 접는다.
export const numericStateValue = (state) => {
  if (state === null || state === undefined) return null;
  return numericValue(typeof state === "object" ? state.state : state);
};

// 값과 단위를 분리한다. 읽을 수 없는 값은 단위 없이 `—`만 남긴다.
export const readout = (value, { decimals = 1, unit = "" } = {}) => {
  const number = numericValue(value);
  if (number === null) return { text: MISSING_READING, unit: "", missing: true };
  return { text: number.toFixed(decimals), unit, missing: false };
};

const presetOf = (range) => {
  const preset = STATISTICS_RANGES[range];
  if (!preset) throw new RangeError(`지원하지 않는 기록 기간입니다: ${range}`);
  return preset;
};

export const buildStatisticsRequest = ({ range, statisticIds = [], now = Date.now() } = {}) => {
  const preset = presetOf(range);
  const end = new Date(now);
  if (Number.isNaN(end.getTime())) throw new RangeError("now가 올바른 날짜가 아닙니다");
  const start = new Date(end.getTime() - preset.hours * HOUR_MS);
  const statistic_ids = (Array.isArray(statisticIds) ? statisticIds : [])
    .filter((entityId) => typeof entityId === "string" && entityId.length > 0);

  return {
    type: "recorder/statistics_during_period",
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    statistic_ids,
    period: preset.period,
    types: [...STATISTICS_TYPES],
  };
};

// Home Assistant는 `{ start, mean, min, max }` 객체를 돌려주고, 시안 fixture는
// `[start, mean, min, max]` 배열을 쓴다. 두 모양을 모두 받아 평균값이 있는 점만 남긴다.
const toPoint = (sample) => {
  const source = Array.isArray(sample)
    ? { start: sample[0], mean: sample[1], min: sample[2], max: sample[3] }
    : sample;
  if (!source || typeof source !== "object") return null;
  const start = numericValue(source.start ?? source.t);
  const mean = numericValue(source.mean);
  if (start === null || mean === null) return null;
  return {
    t: start,
    mean,
    min: numericValue(source.min),
    max: numericValue(source.max),
  };
};

export const parseStatisticsResponse = (response, step = 1) => {
  const stride = Number.isFinite(step) && step >= 1 ? Math.floor(step) : 1;
  const parsed = {};
  if (!response || typeof response !== "object" || Array.isArray(response)) return parsed;

  for (const [entityId, samples] of Object.entries(response)) {
    if (!Array.isArray(samples)) {
      parsed[entityId] = [];
      continue;
    }
    const points = [];
    samples.forEach((sample, index) => {
      if (index % stride !== 0) return;
      const point = toPoint(sample);
      if (point) points.push(point);
    });
    parsed[entityId] = points.sort((a, b) => a.t - b.t);
  }

  return parsed;
};

// 통계값은 상태 이력의 누락 구간에서 null이 될 수 있다. 점을 그리는 데 필요한
// 평균값이 없으면 건너뛰고, 최저·최고가 없으면 평균값으로 대신한다.
const plottable = (points) => {
  if (!Array.isArray(points)) return [];
  return points.filter((point) => point && numericValue(point.t) !== null && numericValue(point.mean) !== null)
    .map((point) => ({
      t: numericValue(point.t),
      mean: numericValue(point.mean),
      min: numericValue(point.min),
      max: numericValue(point.max),
    }));
};

const domainOf = (points) => {
  const lows = points.map((point) => point.min ?? point.mean);
  const highs = points.map((point) => point.max ?? point.mean);
  let low = Math.min(...lows);
  let high = Math.max(...highs);
  if (high - low < 1) {
    const middle = (high + low) / 2;
    low = middle - 1;
    high = middle + 1;
  }
  const padding = (high - low) * 0.12;
  return [low - padding, high + padding];
};

export const tickLabel = (start, range) => {
  const date = new Date(start);
  if (Number.isNaN(date.getTime())) return "";
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (range === "30d") return `${month}/${day}`;
  if (range === "7d") return `${month}/${day} ${String(date.getHours()).padStart(2, "0")}시`;
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const axisLabel = (value, unit) => (unit === "%" ? `${Math.round(value)}` : value.toFixed(1));

export const chartGeometry = (points, { width = 320, height = CHART_HEIGHT, unit = "°C", range = "24h" } = {}) => {
  const safeWidth = Number.isFinite(width) && width > 0 ? Math.max(CHART_MIN_WIDTH, Math.round(width)) : 320;
  const safeHeight = Number.isFinite(height) && height > 0 ? Math.round(height) : CHART_HEIGHT;
  const padding = { ...CHART_PADDING };
  const plots = plottable(points);
  const geometry = {
    width: safeWidth,
    height: safeHeight,
    padding,
    domain: [0, 1],
    empty: plots.length < 2,
    grid: [],
    bandCoords: [],
    lineCoords: [],
    ticks: [],
    last: null,
  };
  if (geometry.empty) return geometry;

  const [low, high] = domainOf(plots);
  const innerWidth = safeWidth - padding.left - padding.right;
  const innerHeight = safeHeight - padding.top - padding.bottom;
  const xOf = (index) => padding.left + (innerWidth * index) / (plots.length - 1);
  const yOf = (value) => padding.top + innerHeight * (1 - (value - low) / (high - low));

  geometry.domain = [low, high];
  geometry.grid = [0, 0.5, 1].map((ratio) => {
    const value = high - (high - low) * ratio;
    return { value, y: yOf(value), label: axisLabel(value, unit) };
  });
  geometry.lineCoords = plots.map((point, index) => [xOf(index), yOf(point.mean)]);
  geometry.bandCoords = [
    ...plots.map((point, index) => [xOf(index), yOf(point.max ?? point.mean)]),
    ...plots.map((point, index) => [xOf(index), yOf(point.min ?? point.mean)]).reverse(),
  ];
  geometry.ticks = [0, Math.floor((plots.length - 1) / 2), plots.length - 1].map((index) => ({
    x: xOf(index),
    text: tickLabel(plots[index].t, range),
    anchor: index === 0 ? "start" : index === plots.length - 1 ? "end" : "middle",
  }));
  const lastCoord = geometry.lineCoords[geometry.lineCoords.length - 1];
  geometry.last = { x: lastCoord[0], y: lastCoord[1] };

  return geometry;
};

export const summarize = (points, unit = "°C") => {
  const plots = plottable(points);
  if (plots.length < 2) return "";
  const decimals = unit === "%" ? 0 : 1;
  const lows = plots.map((point) => point.min ?? point.mean);
  const highs = plots.map((point) => point.max ?? point.mean);
  const low = Math.min(...lows);
  const high = Math.max(...highs);
  const average = plots.reduce((total, point) => total + point.mean, 0) / plots.length;
  return `최저 ${low.toFixed(decimals)}${unit} · 평균 ${average.toFixed(decimals)}${unit} · 최고 ${high.toFixed(decimals)}${unit}`;
};

export const comfortCopy = ({ temperature, humidity } = {}) => {
  const temp = numericValue(temperature);
  const hum = numericValue(humidity);
  if (temp === null && hum === null) return { ...COMFORT_UNKNOWN };
  if (hum !== null && hum >= 70) return { label: "조금 습해요", tone: "caution" };
  if (hum !== null && hum < 40) return { label: "조금 건조해요", tone: "caution" };
  if (temp !== null && temp >= 26) return { label: "조금 따뜻해요", tone: "caution" };
  if (temp !== null && temp < 20) return { label: "조금 서늘해요", tone: "caution" };
  if (temp === null || hum === null) return { ...COMFORT_UNKNOWN };
  return { label: "쾌적해요", tone: "comfort" };
};

export const sourceCopy = (range) => {
  const preset = STATISTICS_RANGES[range] ?? STATISTICS_RANGES["24h"];
  return `기록은 Home Assistant recorder 통계입니다. ${preset.description} 기준이며, 띠는 최저–최고, 선은 평균입니다.`;
};
