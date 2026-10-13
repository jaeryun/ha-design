import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");

const [dashboard, fullDashboard, inlineDashboard, resource] = await Promise.all([
  read("dashboards/ha-design-temp-humidity.yaml"),
  read("dashboards/ha-design.yaml"),
  read("dashboards/ha-design-inline.yaml"),
  read("dashboards/ha-design-temp-humidity-resource.yaml"),
]);

const rooms = [
  {
    title: "안방 온습도",
    eyebrow: "TEMPERATURE & HUMIDITY · BEDROOM",
    columns: 6,
    temperature: "sensor.irrimokeon_temperature",
    humidity: "sensor.irrimokeon_humidity",
    battery: "sensor.irrimokeon_battery",
  },
  {
    title: "아기방 온습도",
    eyebrow: "TEMPERATURE & HUMIDITY · BABY ROOM",
    columns: 12,
    temperature: "sensor.geosilonseubdogye_temperature",
    humidity: "sensor.geosilonseubdogye_humidity",
    battery: "sensor.geosilonseubdogye_battery",
  },
];

const cardBlocks = (yaml) =>
  [...yaml.matchAll(/- type: custom:ha-design-temp-humidity-card\n([\s\S]*?)(?=\n +- type:|\n {2}- title:|$)/g)].map((match) => match[1]);

assert.equal(
  (dashboard.match(/type:\s+custom:ha-design-temp-humidity-card/g) ?? []).length,
  2,
  "domain declaration must hold the bedroom and baby room card",
);
assert.doesNotMatch(dashboard, /^\s*(?:views|path):/m, "domain declaration must not define a device-type view");

for (const [label, yaml] of [["full", fullDashboard], ["inline", inlineDashboard]]) {
  const blocks = cardBlocks(yaml);
  assert.equal(blocks.length, 2, `${label} dashboard must render two temperature cards`);
  for (const room of rooms) {
    const block = blocks.find((entry) => entry.includes(`title: ${room.title}`));
    assert.ok(block, `${label} dashboard is missing ${room.title}`);
    assert.match(block, new RegExp(`eyebrow: ${room.eyebrow.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), `${room.title} eyebrow drifted`);
    assert.match(block, /grid_options:\n\s+columns: \d+\n\s+rows: auto/, `${room.title} must declare resizable grid options`);
    assert.match(block, new RegExp(`columns: ${room.columns}\\b`), `${room.title} column count drifted`);
    for (const key of ["temperature", "humidity", "battery"]) {
      assert.match(block, new RegExp(`${key}_entity: ${room[key]}`), `${room.title} ${key} entity drifted`);
    }
  }
  assert.match(yaml, /path: bedroom\b/, `${label} dashboard must keep the bedroom view`);
  assert.match(yaml, /path: baby-room\b/, `${label} dashboard must keep the baby room view`);
}

for (const source of [dashboard, ...cardBlocks(fullDashboard), ...cardBlocks(inlineDashboard)]) {
  assert.doesNotMatch(source, /hero_image|hero_product_image/, "temperature card must not use a photo hero");
}

assert.match(resource, /^type:\s+module$/m);
assert.match(resource, /^id:\s+[0-9a-f]{32}$/m);
assert.match(
  resource,
  /^url:\s+https:\/\/cdn\.jsdelivr\.net\/gh\/jaeryun\/ha-design@[0-9a-f]{40}\/www\/ha-design\/ha-design-temp-humidity-card\.js\?v=temp-humidity-\d{8}-\d+$/m,
  "temperature card must pin an immutable implementation revision",
);

console.log("PASS temperature and humidity deployment contract");
