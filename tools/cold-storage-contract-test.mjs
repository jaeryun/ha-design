import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const cardPath = `${root}/www/ha-design/ha-design-cold-storage-card.js`;
const dashboardPath = `${root}/dashboards/ha-design-cold-storage.yaml`;
const resourcePath = `${root}/dashboards/ha-design-cold-storage-resource.yaml`;

const [card, dashboard, resource] = await Promise.all([
  readFile(cardPath, "utf8"),
  readFile(dashboardPath, "utf8"),
  readFile(resourcePath, "utf8"),
]);

assert.match(card, /renderDeviceCompact\(\{/);
assert.match(card, /customElements\.define\("ha-design-cold-storage-card"/);
assert.match(card, /role="dialog"|<dialog/);
assert.match(card, /data-action="quick-cool"/);
assert.match(card, /data-action="mode"/);
assert.match(card, /callService\("switch"/);
assert.match(card, /callService\("select"/);
assert.match(card, /door_entities/);
assert.match(card, /section_title/);
assert.match(card, /summary_label/);
assert.match(card, /has-photo/);
assert.match(card, /hero_fit/);
assert.match(card, /hero_variant/);
assert.match(card, /hero_product_image/);
assert.match(card, /model_name/);

assert.equal(
  (dashboard.match(/type:\s+custom:ha-design-cold-storage-card/g) ?? []).length,
  2,
  "dashboard must include refrigerator and kimchi refrigerator cards",
);
assert.match(dashboard, /kind:\s+refrigerator/);
assert.match(dashboard, /kind:\s+kimchi/);
assert.match(dashboard, /title:\s+냉장고/);
assert.match(dashboard, /title:\s+김치냉장고/);
assert.match(dashboard, /binary_sensor\.jubang_gimcinaengjanggo_door/);
assert.match(dashboard, /number\.jubang_naengjanggo_fridge_temperature/);
assert.match(dashboard, /sensor\.jubang_gimcinaengjanggo_power/);
assert.match(dashboard, /RF60DB9KF201/);
assert.match(dashboard, /RQ33DB74D2AP/);
assert.match(dashboard, /d39cafbb-2526-4a00-b951-f25976215348/);
assert.match(dashboard, /b6b97f03-4ec1-4d52-bca6-2c6fe779a34f/);
assert.equal(
  (dashboard.match(/hero_variant:\s+studio/g) ?? []).length,
  2,
  "both cards must use the approved Warm Studio hero",
);
assert.doesNotMatch(
  dashboard,
  /C20260313000058\/58257\/e433fcfd/,
  "approved Warm Studio must not use the rejected kitchen composite",
);

assert.match(resource, /^type:\s+module$/m);
assert.match(resource, /ha-design-cold-storage-card\.js\?v=/);

console.log("PASS cold-storage deployment contract");
