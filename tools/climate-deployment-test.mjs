import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dashboardPath = `${root}/dashboards/ha-design-climate.yaml`;
const resourcePath = `${root}/dashboards/ha-design-resource.yaml`;
const heroPath = `${root}/www/ha-design/images/climate/living-room.png`;
const cardPath = `${root}/www/ha-design/ha-design-climate-card.js`;
const compactPath = `${root}/www/ha-design/ha-design-device-compact.js`;

const dashboard = await readFile(dashboardPath, "utf8");
const resource = await readFile(resourcePath, "utf8");
const hero = await readFile(heroPath);
const card = await readFile(cardPath, "utf8");
const compact = await readFile(compactPath, "utf8");

assert.equal(
  (dashboard.match(/type:\s+custom:ha-design-climate-card/g) ?? []).length,
  2,
  "deployment must render exactly two climate cards",
);
assert.match(dashboard, /path:\s+climate\b/, "deployment must provide the climate view");
assert.match(dashboard, /entity:\s+climate\.geosil_eeokeon\b/);
assert.match(dashboard, /entity:\s+climate\.anbang_eeokeon\b/);
assert.equal(
  (dashboard.match(/details_presentation:\s+modal/g) ?? []).length,
  2,
  "both climate cards must use modal details",
);
const capabilityKeys = [
  ["notification_entity", "event", "notification"],
  ["sleep_timer_number_entity", "number", "sleep_timer"],
  ["sleep_timer_sensor_entity", "sensor", "sleep_timer"],
  ["schedule_turn_on_entity", "sensor", "schedule_turn_on"],
  ["schedule_turn_off_entity", "sensor", "schedule_turn_off"],
  ["energy_yesterday_entity", "sensor", "energy_yesterday"],
  ["energy_this_month_entity", "sensor", "energy_this_month"],
  ["energy_last_month_entity", "sensor", "energy_last_month"],
];
for (const room of ["geosil", "anbang"]) {
  for (const [key, domain, suffix] of capabilityKeys) {
    const entityId = `${domain}.${room}_eeokeon_${suffix}`;
    assert.ok(
      dashboard.split("\n").includes(`      ${key}: ${entityId}`),
      `${key} must configure ${entityId}`,
    );
  }
}
assert.doesNotMatch(dashboard, /^\s+power_entity:/m, "redundant switch power must not be configured");
assert.equal(
  (dashboard.match(/hero_image:.*living-room\.png/g) ?? []).length,
  2,
  "both cards must use the pinned repository hero",
);
assert.deepEqual(
  [...hero.subarray(0, 8)],
  [137, 80, 78, 71, 13, 10, 26, 10],
  "climate hero must be a PNG",
);
assert.ok(hero.length > 100_000, "climate hero must contain the approved full-quality image");
assert.match(card, /renderDeviceCompact\(\{/);
assert.match(card, /data-action="sleep-timer"/, "card must render sleep timer control");
assert.match(card, /number", "set_value"/, "sleep timer must use number.set_value");
assert.match(card, /water_is_full/, "card must render the enabled water-full notification");
assert.match(card, /const climateAvailable = entityAvailable\(climate\)/, "primary climate availability must gate controls");
assert.match(card, /if \(!entityAvailable\(climate\)\) return;/, "unavailable climate must not issue commands");
assert.match(card, /!isOn \|\| !energySavingAvailable/, "unavailable energy-saving switch must be disabled");
assert.match(card, /formatNumericMetric/, "legacy climate metrics must normalize invalid values");
assert.match(card, /!climateAvailable \? "연결 상태 확인"/, "compact unknown status must be neutral");
assert.match(card, /badge: !climateAvailable \? "연결 확인"/, "unavailable climate badge must request connection check");
assert.match(card, /!climateAvailable \? "연결 상태를 확인해 주세요"/, "unavailable climate copy must request connection check");
assert.match(card, /data-status=/, "capability states must expose safe machine status");
assert.match(compact, /export const DEVICE_COMPACT_HERO_HEIGHT = 154;/);
assert.match(compact, /export const DEVICE_COMPACT_TAIL_HEIGHT = 10;/);
assert.match(resource, /^type:\s+module$/m);
assert.match(resource, /^id:\s+e2e7fd13a2aa432997f35046344b5b1c$/m);
assert.match(
  resource,
  /^url:\s+https:\/\/cdn\.jsdelivr\.net\/gh\/jaeryun\/ha-design@[0-9a-f]{40}\/www\/ha-design\/ha-design-climate-card\.js\?v=shared-compact-\d{8}-\d+$/m,
  "climate deployment must pin the shared compact release",
);

console.log("PASS climate deployment contract");
