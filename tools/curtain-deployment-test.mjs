import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");

const [resource, dashboard, inlineDashboard] = await Promise.all([
  read("dashboards/ha-design-curtain-resource.yaml"),
  read("dashboards/ha-design.yaml"),
  read("dashboards/ha-design-inline.yaml"),
]);

assert.match(resource, /id:\s*1d1d9db267dd47c7897dae9328a9cca0/);
assert.match(
  resource,
  /^url:\s+https:\/\/cdn\.jsdelivr\.net\/gh\/jaeryun\/ha-design@[0-9a-f]{40}\/www\/ha-design\/ha-design-curtain-card\.js\?v=adaptive-compact-\d{8}-\d+$/m,
);
assert.match(resource, /type:\s*module/);

for (const config of [dashboard, inlineDashboard]) {
  assert.match(config, /path:\s*curtain/);
  assert.match(config, /type:\s*sections/);
  assert.doesNotMatch(config, /compact_variant/);
  assert.match(config, /cover\.geosilkeoteun/);
  assert.match(config, /cover\.anbangkeoteun/);
  assert.match(config, /cover\.geosilkeoteun[\s\S]*?travel_duration:\s*8\.8/);
  assert.match(config, /cover\.anbangkeoteun[\s\S]*?travel_duration:\s*7\.4/);
}

console.log("PASS curtain deployment contract");
