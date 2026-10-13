import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  CHART_HEIGHT,
  RANGE_IDS,
  STATISTICS_RANGES,
  buildStatisticsRequest,
  chartGeometry,
  comfortCopy,
  numericStateValue,
  parseStatisticsResponse,
  readout,
  sourceCopy,
  summarize,
  tickLabel,
} from "../www/ha-design/ha-design-temp-humidity-history.js";
import {
  TEMP_HUMIDITY_COMPACT_HEIGHT,
  tempHumidityCardStyles,
} from "../www/ha-design/ha-design-temp-humidity-card.styles.js";
import { renderTempHumidityCard } from "../www/ha-design/ha-design-temp-humidity-card.template.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const moduleFiles = [
  "ha-design-temp-humidity-card.js",
  "ha-design-temp-humidity-card.styles.js",
  "ha-design-temp-humidity-card.template.js",
  "ha-design-temp-humidity-history.js",
];
const sources = Object.fromEntries(
  await Promise.all(
    moduleFiles.map(async (name) => [name, await readFile(`${root}/www/ha-design/${name}`, "utf8")]),
  ),
);
const card = sources["ha-design-temp-humidity-card.js"];
const styles = sources["ha-design-temp-humidity-card.styles.js"];
const template = sources["ha-design-temp-humidity-card.template.js"];

/* ---------- 순수 로직: 기간 설정 ---------- */

{
  // Given: 승인된 세 기록 기간.
  const ranges = RANGE_IDS.map((id) => STATISTICS_RANGES[id]);

  // Then: 요청 period와 표본 간격, 라벨이 확정값이다.
  assert.deepEqual(RANGE_IDS, ["24h", "7d", "30d"]);
  assert.deepEqual(
    ranges.map(({ id, label, period, step }) => ({ id, label, period, step })),
    [
      { id: "24h", label: "24시간", period: "hour", step: 1 },
      { id: "7d", label: "7일", period: "hour", step: 6 },
      { id: "30d", label: "30일", period: "day", step: 1 },
    ],
  );
  assert.equal(STATISTICS_RANGES["24h"].hours, 24);
  assert.equal(STATISTICS_RANGES["7d"].hours, 168);
  assert.equal(STATISTICS_RANGES["30d"].hours, 720);
  assert.match(sourceCopy("7d"), /6시간 간격 표본/);
  assert.throws(() => buildStatisticsRequest({ range: "1y" }), RangeError);
}

/* ---------- 순수 로직: 요청 형식 ---------- */

{
  // Given: 안방 온습도 센서와 고정 기준 시각.
  const now = new Date("2026-10-13T12:00:00.000Z");

  // When: 24시간·30일 요청을 만든다.
  const hourly = buildStatisticsRequest({
    range: "24h",
    statisticIds: ["sensor.irrimokeon_temperature", "sensor.irrimokeon_humidity"],
    now,
  });
  const daily = buildStatisticsRequest({ range: "30d", statisticIds: ["sensor.irrimokeon_temperature"], now });

  // Then: recorder WS 명령과 기간 창이 정확하다.
  assert.deepEqual(hourly, {
    type: "recorder/statistics_during_period",
    start_time: "2026-10-12T12:00:00.000Z",
    end_time: "2026-10-13T12:00:00.000Z",
    statistic_ids: ["sensor.irrimokeon_temperature", "sensor.irrimokeon_humidity"],
    period: "hour",
    types: ["mean", "min", "max"],
  });
  assert.equal(daily.period, "day");
  assert.equal(daily.start_time, "2026-09-13T12:00:00.000Z");
  assert.equal(daily.types.includes("max"), true);

  // And: 숫자 epoch 기준 시각과 빈 statistic_ids도 안전하게 처리한다.
  assert.equal(buildStatisticsRequest({ range: "24h", statisticIds: [], now }).start_time, "2026-10-12T12:00:00.000Z");
  assert.equal(buildStatisticsRequest({ range: "24h", statisticIds: null, now }).statistic_ids.length, 0);
  assert.throws(() => buildStatisticsRequest({ range: "24h", now: "언젠가" }), RangeError);
}

/* ---------- 순수 로직: 응답 파싱·표본 ---------- */

{
  // Given: Home Assistant recorder 응답(객체 표본)과 7일 표본 간격.
  const samples = Array.from({ length: 13 }, (_, index) => ({
    start: 1_791_000_000_000 + index * 3_600_000,
    mean: 22 + index / 10,
    min: 21 + index / 10,
    max: 23 + index / 10,
  }));

  // When: 6개마다 표본을 취한다.
  const parsed = parseStatisticsResponse({ "sensor.room_temperature": samples }, 6);

  // Then: 처음·중간·끝 표본만 남고 시간 오름차순이다.
  assert.equal(parsed["sensor.room_temperature"].length, 3);
  assert.deepEqual(
    parsed["sensor.room_temperature"].map((point) => point.t),
    [1_791_000_000_000, 1_791_021_600_000, 1_791_043_200_000],
  );
  assert.equal(parsed["sensor.room_temperature"][0].mean, 22);
  assert.equal(parsed["sensor.room_temperature"][2].max, 24.2);
}

{
  // Given: 시안 fixture 형식(배열 표본)과 정렬되지 않은 입력.
  const response = {
    "sensor.room_humidity": [
      [1_791_007_200_000, 65, 60, 70],
      [1_791_000_000_000, 63, 58, 68],
    ],
  };

  // When: 표본 간격 없이 파싱한다.
  const parsed = parseStatisticsResponse(response, 1);

  // Then: 두 점이 시간 오름차순이며 min·max를 보존한다.
  assert.deepEqual(parsed["sensor.room_humidity"], [
    { t: 1_791_000_000_000, mean: 63, min: 58, max: 68 },
    { t: 1_791_007_200_000, mean: 65, min: 60, max: 70 },
  ]);
}

{
  // Given: 평균이 없는 표본, min·max가 null인 표본, 배열이 아닌 entity, 빈 응답.
  const response = {
    "sensor.a": [
      [1, null, 1, 2],
      [2, 20, null, null],
      [null, 21, 1, 2],
      "깨진 표본",
    ],
    "sensor.b": [],
    "sensor.c": null,
  };

  // When: 파싱한다.
  const parsed = parseStatisticsResponse(response, 1);

  // Then: 그릴 수 없는 표본은 버리고 min·max의 null은 보존한다.
  assert.deepEqual(parsed["sensor.a"], [{ t: 2, mean: 20, min: null, max: null }]);
  assert.deepEqual(parsed["sensor.b"], []);
  assert.deepEqual(parsed["sensor.c"], []);
  assert.deepEqual(parseStatisticsResponse(null), {});
  assert.deepEqual(parseStatisticsResponse(undefined, 6), {});
  assert.deepEqual(parseStatisticsResponse([]), {});
  assert.deepEqual(parseStatisticsResponse({}), {});
}

/* ---------- 순수 로직: 상태값과 표시 ---------- */

{
  // Given/When/Then: unknown·unavailable·누락 상태는 모두 값 없음으로 접힌다.
  assert.equal(numericStateValue({ state: "22.8" }), 22.8);
  assert.equal(numericStateValue({ state: "unavailable" }), null);
  assert.equal(numericStateValue({ state: "unknown" }), null);
  assert.equal(numericStateValue({ state: "" }), null);
  assert.equal(numericStateValue(undefined), null);
  assert.equal(numericStateValue({ state: "100" }), 100);

  assert.deepEqual(readout(22.84, { decimals: 1, unit: "°C" }), { text: "22.8", unit: "°C", missing: false });
  assert.deepEqual(readout(65, { decimals: 0, unit: "%" }), { text: "65", unit: "%", missing: false });
  assert.deepEqual(readout(null, { decimals: 1, unit: "°C" }), { text: "—", unit: "", missing: true });
  assert.deepEqual(readout("unknown", { decimals: 0, unit: "%" }), { text: "—", unit: "", missing: true });
}

/* ---------- 순수 로직: 요약 ---------- */

{
  // Given: 값이 흔들리는 온도·습도 기록.
  const temperature = [
    { t: 1, mean: 22, min: 20, max: 24 },
    { t: 2, mean: 24, min: 23, max: 26 },
    { t: 3, mean: 23, min: 21, max: 25 },
  ];
  const humidity = [
    { t: 1, mean: 60, min: 52, max: 68 },
    { t: 2, mean: 66, min: 61, max: 72 },
  ];

  // Then: 온도는 소수 1자리, 습도는 정수 요약이다.
  assert.equal(summarize(temperature, "°C"), "최저 20.0°C · 평균 23.0°C · 최고 26.0°C");
  assert.equal(summarize(humidity, "%"), "최저 52% · 평균 63% · 최고 72%");
  assert.equal(summarize([{ t: 1, mean: 22, min: null, max: null }], "°C"), "");
  assert.equal(summarize([], "°C"), "");
  assert.equal(summarize(null, "°C"), "");
  assert.equal(
    summarize([{ t: 1, mean: 22, min: null, max: null }, { t: 2, mean: 24, min: null, max: null }], "°C"),
    "최저 22.0°C · 평균 23.0°C · 최고 24.0°C",
  );
}

/* ---------- 순수 로직: 쾌적도 문구 ---------- */

{
  // Given/When/Then: 판정 순서와 세 가지 배지 톤.
  assert.deepEqual(comfortCopy({ temperature: 22.8, humidity: 65 }), { label: "쾌적해요", tone: "comfort" });
  assert.deepEqual(comfortCopy({ temperature: 22.8, humidity: 70 }), { label: "조금 습해요", tone: "caution" });
  assert.deepEqual(comfortCopy({ temperature: 27, humidity: 39 }), { label: "조금 건조해요", tone: "caution" });
  assert.deepEqual(comfortCopy({ temperature: 26, humidity: 55 }), { label: "조금 따뜻해요", tone: "caution" });
  assert.deepEqual(comfortCopy({ temperature: 19.9, humidity: 55 }), { label: "조금 서늘해요", tone: "caution" });
  assert.deepEqual(comfortCopy({ temperature: 28, humidity: null }), { label: "조금 따뜻해요", tone: "caution" });
  assert.deepEqual(comfortCopy({ temperature: 22.8, humidity: null }), { label: "확인 필요", tone: "unknown" });
  assert.deepEqual(comfortCopy({ temperature: null, humidity: null }), { label: "확인 필요", tone: "unknown" });
  assert.deepEqual(comfortCopy({ temperature: "unavailable", humidity: "unknown" }), {
    label: "확인 필요",
    tone: "unknown",
  });
  assert.deepEqual(comfortCopy(), { label: "확인 필요", tone: "unknown" });
}

/* ---------- 순수 로직: 차트 기하 ---------- */

{
  // Given: 24시간 온도 기록과 측정 폭.
  const points = [
    { t: new Date("2026-10-13T00:00:00").getTime(), mean: 22, min: 21, max: 23 },
    { t: new Date("2026-10-13T06:00:00").getTime(), mean: 24, min: 22, max: 26 },
    { t: new Date("2026-10-13T12:00:00").getTime(), mean: 23, min: 21, max: 25 },
  ];

  // When: 차트를 계산한다.
  const geometry = chartGeometry(points, { width: 320, height: CHART_HEIGHT, unit: "°C", range: "24h" });

  // Then: 그리드선 3개(소수 1자리 라벨), min–max 띠, 평균 선, x축 라벨 3개, 마지막 점 원.
  assert.equal(geometry.empty, false);
  assert.equal(geometry.grid.length, 3);
  assert.equal(geometry.grid[0].label, (geometry.domain[1]).toFixed(1));
  assert.equal(geometry.grid[1].y, geometry.padding.top + (CHART_HEIGHT - geometry.padding.top - geometry.padding.bottom) / 2);
  assert.equal(geometry.lineCoords.length, 3);
  assert.equal(geometry.bandCoords.length, 6);
  assert.deepEqual(geometry.ticks.map((tick) => tick.anchor), ["start", "middle", "end"]);
  assert.deepEqual(geometry.ticks.map((tick) => tick.text), ["00:00", "06:00", "12:00"]);
  assert.equal(geometry.last.x, geometry.lineCoords[2][0]);
  assert.equal(geometry.last.y, geometry.lineCoords[2][1]);
  for (const [x, coordY] of [...geometry.lineCoords, ...geometry.bandCoords]) {
    assert.ok(x >= geometry.padding.left - 0.01 && x <= geometry.width - geometry.padding.right + 0.01, "x가 플롯 안에 있음");
    assert.ok(coordY >= geometry.padding.top - 0.01 && coordY <= CHART_HEIGHT - geometry.padding.bottom + 0.01, "y가 플롯 안에 있음");
  }
  // 띠는 max 3개 뒤에 min 3개가 역순으로 이어지고, 각 점에서 max가 min보다 위에 있다.
  const upper = geometry.bandCoords.slice(0, 3);
  const lower = geometry.bandCoords.slice(3);
  assert.deepEqual(
    lower.map(([x]) => x),
    upper.map(([x]) => x).reverse(),
  );
  assert.equal(
    upper.every(([, y], index) => y <= lower[lower.length - 1 - index][1]),
    true,
  );

  // And: 습도 축 라벨은 정수, 7일·30일 x축 라벨 형식도 확정값이다.
  const humidityGeometry = chartGeometry(points, { width: 320, unit: "%", range: "24h" });
  assert.equal(humidityGeometry.grid.every(({ label }) => /^\d+$/.test(label)), true);
  assert.deepEqual(
    chartGeometry(points, { width: 320, range: "7d" }).ticks.map((tick) => tick.text),
    ["10/13 00시", "10/13 06시", "10/13 12시"],
  );
  assert.deepEqual(
    chartGeometry(points, { width: 320, range: "30d" }).ticks.map((tick) => tick.text),
    ["10/13", "10/13", "10/13"],
  );
  assert.equal(tickLabel(points[0].t, "24h"), "00:00");

  // And: 폭이 좁아도 최소 폭을 지키고, 점이 2개 미만이면 빈 상태다.
  assert.equal(chartGeometry(points, { width: 10 }).width, 240);
  assert.equal(chartGeometry(points, {}).width, 320);
  const empty = chartGeometry([points[0]], { width: 320 });
  assert.deepEqual(
    { empty: empty.empty, grid: empty.grid.length, line: empty.lineCoords.length, last: empty.last },
    { empty: true, grid: 0, line: 0, last: null },
  );
  assert.equal(chartGeometry([], { width: 320 }).empty, true);
  assert.equal(chartGeometry(null, { width: 320 }).empty, true);
  assert.equal(chartGeometry([{ t: 1, mean: 22, min: 22, max: 22 }], {}).empty, true);

  // And: 값이 평평해도 y 도메인이 무너지지 않는다.
  const flat = chartGeometry(
    [
      { t: 1, mean: 22, min: 22, max: 22 },
      { t: 2, mean: 22, min: 22, max: 22 },
    ],
    { width: 320 },
  );
  assert.ok(flat.domain[1] - flat.domain[0] > 1);
}

/* ---------- 카드 소스 계약 ---------- */

assert.match(card, /if \(!customElements\.get\("ha-design-temp-humidity-card"\)\)/);
assert.match(card, /customElements\.define\("ha-design-temp-humidity-card", HADesignTempHumidityCard\)/);
assert.match(card, /static getConfigForm\(\)/);
assert.match(card, /static getStubConfig\(hass, entities = \[\], entitiesFallback = \[\]\)/);
assert.match(card, /getCardSize\(\) \{[\s\S]*?return 4;/);
assert.match(card, /getGridOptions\(\) \{[\s\S]*?columns: 6, min_columns: 4, max_columns: 12 \};/);
assert.match(card, /setConfig\(config\)/);
assert.match(card, /throw new Error\("온도 센서 엔티티\(temperature_entity\)가 필요합니다"\)/);
assert.match(card, /sensor 도메인 엔티티만 사용할 수 있습니다/);

// config form 필드는 확정된 다섯 개 이름이어야 한다.
const formSource = card.slice(card.indexOf("static getConfigForm()"), card.indexOf("static getStubConfig"));
const formFields = [...formSource.matchAll(/name: "([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(formFields, [
  "temperature_entity",
  "humidity_entity",
  "battery_entity",
  "title",
  "eyebrow",
]);
assert.match(card, /filter: \{ domain: "sensor", device_class: "temperature" \}/);
assert.match(card, /filter: \{ domain: "sensor", device_class: "humidity" \}/);
assert.match(card, /filter: \{ domain: "sensor", device_class: "battery" \}/);
assert.match(card, /attributes\?\.device_class === "temperature"/);
assert.match(card, /replace\("temperature", "humidity"\)/);

// picker metadata
assert.match(card, /window\.customCards = window\.customCards \?\? \[\]/);
assert.match(card, /type: "ha-design-temp-humidity-card"/);
assert.match(card, /name: "온습도 카드"/);
assert.match(card, /description: "방의 현재 온도와 습도, 기간별 기록 차트"/);
assert.match(card, /preview: true/);
assert.match(card, /getEntitySuggestion/);

// 기록 API와 늦은 응답 폐기, hass 부재 시 무요청
assert.match(card, /this\._hass\.callWS\(buildStatisticsRequest\(\{ range, statisticIds, now: new Date\(\) \}\)\)/);
assert.match(card, /if \(token !== this\._requestToken\) return;/);
assert.match(card, /if \(!this\._hass\?\.callWS \|\| statisticIds\.length === 0\)/);
assert.match(card, /new ResizeObserver\(\(\) => \{/);
assert.match(card, /_refreshChartWidth\(\)/);

// dialog 상호작용: 열기·닫기 경로와 초점 복귀
assert.match(card, /dialog\.oncancel = \(event\) => \{/);
assert.match(card, /dialog\.onkeydown = \(event\) => \{/);
assert.match(card, /if \(event\.target === dialog\) this\._closeDialog\(\);/);
assert.match(card, /launcher\?\.setAttribute\("aria-expanded", "false"\);\s*\n\s*launcher\?\.focus\(\);/);
assert.match(card, /this\._loadHistory\(this\._activeRange\)/);

// 공통 primitive 재사용: 한 모듈은 한 cache key만 쓴다.
const keysByModule = new Map();
for (const [name, source] of Object.entries(sources)) {
  for (const match of source.matchAll(/\.\/([\w.-]+\.js)\?v=([\w.-]+)/g)) {
    const keys = keysByModule.get(match[1]) ?? new Set();
    keys.add(match[2]);
    keysByModule.set(match[1], keys);
  }
  const imports = [...source.matchAll(/from "(\.\/[\w.-]+\.js)(\?v=[\w.-]+)?"/g)];
  for (const [, modulePath, key] of imports) {
    assert.ok(key, `${name} must import ${modulePath} with a cache key`);
  }
}
for (const [moduleName, keys] of keysByModule) {
  assert.equal(keys.size, 1, `${moduleName} must be imported with exactly one cache key, got ${[...keys].join(", ")}`);
}
assert.deepEqual(
  [...(keysByModule.get("ha-design-temp-humidity-history.js") ?? [])],
  ["temp-humidity-20261013-3"],
);
assert.deepEqual([...(keysByModule.get("ha-design-device-compact.js") ?? [])], ["adaptive-compact-20260827-1"]);
assert.deepEqual([...(keysByModule.get("ha-design-temp-humidity-card.template.js") ?? [])], ["temp-humidity-20261013-3"]);

// 공통 164px(154 + 10) 계약
assert.equal(TEMP_HUMIDITY_COMPACT_HEIGHT, 164);
assert.match(styles, /DEVICE_COMPACT_HERO_HEIGHT/);
assert.match(styles, /DEVICE_COMPACT_TAIL_HEIGHT/);
assert.match(styles, /min-block-size: \$\{TEMP_HUMIDITY_COMPACT_HEIGHT\}px;/);
assert.doesNotMatch(styles, /164px/);
assert.match(template, /class="device-compact-visual temp-panel"/);
assert.match(template, /class="device-compact-tail temp-tail"/);

/* ---------- 스타일 계약: 승인 시안 A ---------- */

// 사진 대신 밝은 톤 패널
assert.match(styles, /radial-gradient\(120% 95% at 12% 0%, rgba\(255, 255, 255, \.95\) 0%, rgba\(255, 255, 255, 0\) 58%\)/);
assert.match(styles, /linear-gradient\(158deg, #fbf8f2 0%, #f3eee5 58%, #ebe5d9 100%\)/);
assert.match(styles, /box-shadow: inset 0 0 0 1px var\(--temp-panel-edge\)/);
assert.match(styles, /--temp-panel-edge: rgba\(26, 26, 24, \.06\)/);
assert.match(styles, /--device-card-surface: var\(--temp-surface\)/);
assert.match(styles, /\.temp-eyebrow \{[\s\S]*?font-size: 10px;[\s\S]*?letter-spacing: \.14em;/);
assert.match(styles, /\.temp-title \{[\s\S]*?font-size: 15px;[\s\S]*?font-weight: 600;/);
assert.match(styles, /\.temp-readout-value \{[\s\S]*?font-size: 28px;[\s\S]*?font-weight: 700;/);
assert.match(styles, /\.temp-readout-unit \{[\s\S]*?font-size: 14px;[\s\S]*?font-weight: 600;/);
assert.match(styles, /--temp-ink: #1a1a18/);
assert.match(styles, /--temp-muted: #6b675f/);
assert.match(styles, /--temp-tertiary: #9a958a/);
assert.match(styles, /--temp-accent: #315f6f/);
assert.match(styles, /--temp-accent-tint: #e7f0f1/);
assert.match(styles, /--temp-gold: #8a641f/);
// 배지 톤 셋
assert.match(styles, /\.temp-badge\[data-tone="comfort"\] \{ background: var\(--temp-accent-tint\); color: #2f5a68; \}/);
assert.match(styles, /\.temp-badge\[data-tone="caution"\] \{ background: #f6ece4; color: #8a5a35; \}/);
assert.match(styles, /\.temp-badge\[data-tone="unknown"\] \{ background: #f1eeea; color: var\(--temp-muted\); \}/);
// dialog 크기와 세로 스크롤
assert.match(styles, /inline-size: min\(620px, calc\(100vw - 24px\)\)/);
assert.match(styles, /inline-size: calc\(100vw - 16px\)/);
assert.match(styles, /\.temp-dialog-body \{[\s\S]*?overflow-x: hidden;[\s\S]*?overflow-y: auto;/);
assert.match(styles, /block-size: \$\{CHART_HEIGHT\}px;/);
// 44px 조작점과 reduced motion
assert.match(styles, /\.temp-dialog-close \{[\s\S]*?inline-size: 44px;[\s\S]*?block-size: 44px;/);
assert.match(styles, /\.temp-range-tabs button \{[\s\S]*?min-block-size: 44px;[\s\S]*?min-inline-size: 44px;/);
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(styles, /:is\(button\):focus-visible \{ outline: 3px solid var\(--temp-accent\);/);

/* ---------- 템플릿 계약: compact와 dialog 마크업 ---------- */

const points = [
  { t: new Date("2026-10-13T00:00:00").getTime(), mean: 22, min: 21, max: 23 },
  { t: new Date("2026-10-13T12:00:00").getTime(), mean: 24, min: 22, max: 26 },
];
const chart = (label, unit, tone, message = null) => ({
  label,
  unit,
  tone,
  summary: summarize(points, unit),
  message,
  ariaLabel: `${label} 기록 차트`,
  geometry: chartGeometry(points, { width: 320, unit, range: "24h" }),
});
const buildModel = (overrides = {}) => ({
  title: "안방 온습도",
  eyebrow: "TEMPERATURE & HUMIDITY · BEDROOM",
  expanded: false,
  dialogId: "detail-1",
  launcherLabel: "안방 온습도 상세 보기",
  badge: comfortCopy({ temperature: 22.8, humidity: 65 }),
  readings: {
    temperature: readout(22.84, { decimals: 1, unit: "°C" }),
    humidity: readout(65, { decimals: 0, unit: "%" }),
    battery: readout(null, { decimals: 0, unit: "%" }),
  },
  ranges: RANGE_IDS.map((id) => ({
    id,
    label: STATISTICS_RANGES[id].label,
    selected: id === "24h",
  })),
  charts: { temperature: chart("온도", "°C", "#8a641f"), humidity: chart("습도", "%", "#315f6f") },
  source: sourceCopy("24h"),
  ...overrides,
});
const markup = renderTempHumidityCard(buildModel());

assert.match(markup, /role="button"/);
assert.match(markup, /aria-haspopup="dialog"/);
assert.match(markup, /aria-expanded="false"/);
assert.match(markup, /aria-controls="detail-1"/);
assert.match(markup, /data-role="badge" data-tone="comfort">쾌적해요</);
assert.match(markup, /data-role="temperature"[\s\S]*?온도[\s\S]*?22\.8<span class="temp-readout-unit">°C<\/span>/);
assert.match(markup, /data-role="humidity"[\s\S]*?습도[\s\S]*?65<span class="temp-readout-unit">%<\/span>/);
assert.equal((markup.match(/class="temp-readout-item"/g) ?? []).length, 2);
assert.match(markup, /id="detail-1" aria-labelledby="detail-1-title"/);
assert.equal((markup.match(/role="tab"/g) ?? []).length, 3);
assert.match(markup, /role="tab" data-range="24h" aria-selected="true" tabindex="0">24시간</);
assert.equal((markup.match(/aria-selected="false" tabindex="-1"/g) ?? []).length, 2);
assert.equal((markup.match(/data-chart="/g) ?? []).length, 2);
assert.match(markup, /data-chart="temperature"[\s\S]*?role="img"[\s\S]*?aria-label="온도 기록 차트"/);
assert.match(markup, /<polygon points="[\d.,\s]+" fill="#8a641f" fill-opacity="0.16"/);
assert.match(markup, /<polyline points="[\d.,\s]+" fill="none" stroke="#8a641f" stroke-width="2.2"/);
assert.match(markup, /<circle cx="[\d.]+" cy="[\d.]+" r="3.4" fill="#315f6f">/);
assert.equal((markup.match(/stroke="rgba\(26,26,24,\.10\)"/g) ?? []).length, 6);
assert.match(markup, /data-role="now-temperature">22\.8<small>°C<\/small>/);
assert.match(markup, /data-role="now-humidity">65<small>%<\/small>/);
assert.match(markup, /data-role="now-battery">—<\/span>/);
assert.match(markup, /기록은 Home Assistant recorder 통계입니다\./);
assert.match(markup, /class="device-compact-tail temp-tail" aria-hidden="true"/);
assert.match(markup, /aria-label="닫기"/);

// 배지 문구와 값은 escape되어야 한다.
const escaped = renderTempHumidityCard(
  buildModel({
    dialogId: "detail-2",
    badge: { label: "<b>위험</b>", tone: "caution" },
    readings: {
      temperature: readout(22.84, { decimals: 1, unit: "°C" }),
      humidity: readout(null, { decimals: 0, unit: "%" }),
      battery: readout(null, { decimals: 0, unit: "%" }),
    },
    charts: { temperature: chart("온도", "°C", "#8a641f"), humidity: chart("습도", "%", "#315f6f") },
  }),
);
assert.match(escaped, /&lt;b&gt;위험&lt;\/b&gt;/);
assert.match(escaped, /data-role="badge" data-tone="caution"/);

// 기록이 없거나 실패하면 chart 대신 문구를 그린다.
const missingMarkup = renderTempHumidityCard(
  buildModel({
    dialogId: "detail-3",
    expanded: true,
    badge: comfortCopy({ temperature: null, humidity: null }),
    readings: {
      temperature: readout(null, { decimals: 1, unit: "°C" }),
      humidity: readout(null, { decimals: 0, unit: "%" }),
      battery: readout(null, { decimals: 0, unit: "%" }),
    },
    charts: {
      temperature: chart("온도", "°C", "#8a641f", "기록을 불러오지 못했어요"),
      humidity: chart("습도", "%", "#315f6f", "기록이 아직 없어요"),
    },
  }),
);
assert.match(missingMarkup, /temp-chart-empty[^>]*>기록을 불러오지 못했어요</);
assert.match(missingMarkup, /temp-chart-empty[^>]*>기록이 아직 없어요</);
assert.match(missingMarkup, /data-role="badge" data-tone="unknown">확인 필요</);
assert.match(missingMarkup, /aria-expanded="true"/);
assert.doesNotMatch(missingMarkup, /<polyline/);

// 금지 사항: 사진 hero 없음, button-card 의존 없음.
for (const [name, source] of Object.entries(sources)) {
  assert.doesNotMatch(source, /<img\b/, `${name} must not render a photo hero`);
  assert.doesNotMatch(source, /hero_image|hero_product_image/, `${name} must not accept a photo hero config`);
  assert.doesNotMatch(source, /custom:button-card|button-card/, `${name} must not depend on button-card`);
}
assert.doesNotMatch(template, /https?:\/\//);
assert.equal(typeof tempHumidityCardStyles, "string");

console.log("PASS temperature humidity card contract");
