import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");
const expectedSha = "219e9d5d5755504e3cadf9f0bf649eeee8647d97";

const [resource, dashboard, inlineDashboard] = await Promise.all([
  read("dashboards/ha-design-curtain-resource.yaml"),
  read("dashboards/ha-design.yaml"),
  read("dashboards/ha-design-inline.yaml"),
]);

assert.match(resource, /id:\s*1d1d9db267dd47c7897dae9328a9cca0/);
assert.match(resource, new RegExp(`ha-design@${expectedSha}/www/ha-design/ha-design-curtain-card\\.js`));
assert.match(resource, /type:\s*module/);

for (const config of [dashboard, inlineDashboard]) {
  assert.match(config, /path:\s*curtain/);
  assert.match(config, /type:\s*sections/);
  assert.equal((config.match(/compact_variant:\s*tile/g) ?? []).length, 2);
  assert.match(config, /cover\.geosilkeoteun/);
  assert.match(config, /cover\.anbangkeoteun/);
}

console.log("PASS curtain deployment contract");
