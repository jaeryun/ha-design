import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
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
  assert.doesNotMatch(source, /hero_image:\s*(?!https:\/\/raw\.githubusercontent\.com)/, "hero_image must point at a committed asset");
}

const heroPattern = /hero_image(_narrow)?:\s+https:\/\/raw\.githubusercontent\.com\/jaeryun\/ha-design\/([0-9a-f]{40})\/www\/ha-design\/images\/temp-humidity\/hygrometer-(wide|square)\.jpg/g;
const heroes = cardBlocks(fullDashboard).flatMap((block) => [...block.matchAll(/hero_image(_narrow)?:\s+(\S+)/g)].map((match) => match[2]));
assert.equal(heroes.length, 4, "both cards must declare hero_image and hero_image_narrow");
const heroShas = new Set();
for (const url of heroes) {
  const match = url.match(/^https:\/\/raw\.githubusercontent\.com\/jaeryun\/ha-design\/([0-9a-f]{40})\/www\/ha-design\/images\/temp-humidity\/hygrometer-(wide|square)\.jpg$/);
  assert.ok(match, `unexpected hero url: ${url}`);
  heroShas.add(match[1]);
}
assert.equal(heroShas.size, 1, "both hero assets must be pinned to the same commit");
assert.equal([...fullDashboard.matchAll(heroPattern)].length, 4, "hero urls must use the committed asset names");

for (const [file, minBytes] of [["hygrometer-wide.jpg", 40000], ["hygrometer-square.jpg", 40000]]) {
  const path = new URL(`../www/ha-design/images/temp-humidity/${file}`, import.meta.url);
  assert.ok(existsSync(path), `${file} must exist`);
  assert.ok(statSync(path).size > minBytes, `${file} looks truncated`);
  const bytes = await readFile(path);
  assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff], `${file} must be a jpeg`);
}

assert.match(resource, /^type:\s+module$/m);
assert.match(resource, /^id:\s+[0-9a-f]{32}$/m);
assert.match(
  resource,
  /^url:\s+https:\/\/cdn\.jsdelivr\.net\/gh\/jaeryun\/ha-design@[0-9a-f]{40}\/www\/ha-design\/ha-design-temp-humidity-card\.js\?v=temp-humidity-\d{8}-\d+$/m,
  "temperature card must pin an immutable implementation revision",
);

console.log("PASS temperature and humidity deployment contract");
