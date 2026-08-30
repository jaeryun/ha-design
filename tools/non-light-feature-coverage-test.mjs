import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");
const snapshot = JSON.parse(await read("tools/non-light-registry-snapshot.json"));

const viewMappings = [
  ["climate", "dashboards/ha-design-climate.yaml"],
  ["curtain", "dashboards/ha-design-curtain.yaml"],
  ["cold-storage", "dashboards/ha-design-cold-storage.yaml"],
  ["washer", "dashboards/ha-design-washer.yaml"],
];
const sharedDashboardPaths = ["dashboards/ha-design.yaml", "dashboards/ha-design-inline.yaml"];
const entityPattern = /\b(?:binary_sensor|climate|cover|event|number|select|sensor|switch)\.[A-Za-z0-9_]+\b/g;
const entitiesIn = (source) => new Set(source.match(entityPattern) ?? []);
const meaningful = (card) => card.entities
  .filter(({ disabled_by, classification }) => !disabled_by && !classification)
  .map(({ entity_id }) => entity_id);

const [sharedDashboards, domainDashboards] = await Promise.all([
  Promise.all(sharedDashboardPaths.map(async (path) => [path, await read(path)])),
  Promise.all(viewMappings.map(async ([view, path]) => [view, path, await read(path)])),
]);

assert.equal(snapshot.find(({ view }) => view === "washer").entities.filter(({ disabled_by, classification }) => !disabled_by && !classification).length, 21, "washer coverage must retain all 21 audited entities");
const expectedByView = new Map();
for (const card of snapshot) {
  const entities = expectedByView.get(card.view) ?? new Set();
  meaningful(card).forEach((entityId) => entities.add(entityId));
  expectedByView.set(card.view, entities);
}
for (const [view, path, domainDashboard] of domainDashboards) {
  const actual = entitiesIn(domainDashboard);
  assert.deepEqual(actual, expectedByView.get(view), `${path} must match the registry-derived entity set`);
}

for (const [sharedPath, sharedDashboard] of sharedDashboards) {
  const sharedEntities = entitiesIn(sharedDashboard);
  const domainEntities = new Set(domainDashboards.flatMap(([, , source]) => [...entitiesIn(source)]));
  assert.deepEqual(sharedEntities, domainEntities, `${sharedPath} must mirror all domain dashboard entity mappings`);
}

const classifications = snapshot.flatMap(({ entities }) => entities.filter(({ classification }) => classification));
assert.deepEqual(
  new Set(classifications.filter(({ classification }) => classification === "duplicate-climate-power-switch").map(({ entity_id }) => entity_id)),
  new Set(["switch.geosil_eeokeon_power", "switch.anbang_eeokeon_power"]),
);
assert.ok(classifications.every(({ disabled_by, classification }) => classification !== "integration-disabled-curtain-link-quality" || disabled_by === "integration"));
console.log("PASS exhaustive non-light feature coverage contract");
