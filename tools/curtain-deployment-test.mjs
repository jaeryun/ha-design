import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");
const expectedSha = "1afc9330d74a9a8d5861f3171e878fc3dfb2f902";

const [resource, dashboard, inlineDashboard] = await Promise.all([
  read("dashboards/ha-design-curtain-resource.yaml"),
  read("dashboards/ha-design.yaml"),
  read("dashboards/ha-design-inline.yaml"),
]);

assert.match(resource, /id:\s*1d1d9db267dd47c7897dae9328a9cca0/);
assert.match(resource, new RegExp(`ha-design@${expectedSha}/www/ha-design/ha-design-curtain-card\\.js`));
assert.match(resource, /v=curtain-live-20260825-1/);
assert.match(resource, /type:\s*module/);

for (const config of [dashboard, inlineDashboard]) {
  assert.match(config, /path:\s*curtain/);
  assert.match(config, /type:\s*sections/);
  assert.equal((config.match(/compact_variant:\s*tile/g) ?? []).length, 2);
  assert.match(config, /cover\.geosilkeoteun/);
  assert.match(config, /cover\.anbangkeoteun/);
  assert.match(config, /cover\.geosilkeoteun[\s\S]*?travel_duration:\s*8\.8/);
  assert.match(config, /cover\.anbangkeoteun[\s\S]*?travel_duration:\s*7\.4/);
}

console.log("PASS curtain deployment contract");
