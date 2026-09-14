import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");

const [dashboard, inlineDashboard, standalone, resource] = await Promise.all([
  read("dashboards/ha-design.yaml"),
  read("dashboards/ha-design-inline.yaml"),
  read("dashboards/ha-design-air-purifier.yaml"),
  read("dashboards/ha-design-air-purifier-resource.yaml"),
]);

for (const config of [dashboard, inlineDashboard, standalone]) {
  assert.match(config, /title:\s*공기청정기/);
  assert.match(config, /path:\s*air-purifier/);
  assert.match(config, /type:\s*sections/);
  assert.match(config, /type:\s*custom:ha-design-air-purifier-card/);
  assert.match(config, /columns:\s*6/);
  assert.match(config, /rows:\s*auto/);
  assert.match(config, /entity:\s*switch\.gonggiceongjeonggi_jeonweon_2/);
  assert.match(config, /model_name:\s*AC-23AH10FNW/);
  assert.doesNotMatch(config, /entity:\s*switch\.gonggiceongjeonggi_jeonweon\s*$/m);
}

assert.match(resource, /^type:\s*module$/m);
assert.match(resource, /^id:\s*267892d8254740aeb3303441337bdc28$/m);
assert.match(
  resource,
  /^url:\s*https:\/\/cdn\.jsdelivr\.net\/gh\/jaeryun\/ha-design@[0-9a-f]{40}\/www\/ha-design\/ha-design-air-purifier-card\.js\?v=air-purifier-\d{8}-\d+$/m,
);

console.log("PASS air purifier deployment configuration");
