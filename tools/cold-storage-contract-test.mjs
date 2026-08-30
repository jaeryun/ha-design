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
assert.match(card, /data-action="quick-freeze"/);
assert.match(card, /data-action="target-temperature"/);
assert.match(card, /data-target-entity=/);
assert.match(card, /callService\("switch",\s*state\.state === "on" \? "turn_off" : "turn_on"/);
assert.match(card, /callService\("number",\s*"set_value",\s*\{\s*entity_id: button\.dataset\.targetEntity,\s*value,/);
assert.match(card, /callService\("select",\s*"select_option"/);
assert.match(card, /window\.confirm\(`목표 온도를/);
assert.match(card, /doorUncertain/);
assert.match(card, /quickCoolAvailable/);
assert.match(card, /quickFreezeAvailable/);
assert.match(card, /modeAvailable/);
assert.match(card, /!\["on", "off"\]\.includes\(state\.state\)/);
assert.match(card, /attributes\?\.min/);
assert.match(card, /attributes\?\.max/);
assert.match(card, /attributes\?\.step/);
assert.match(card, /Math\.min\(maximum, Math\.max\(minimum, snapped\)\)/);
assert.match(card, /door_entities/);
assert.match(card, /section_title/);
assert.match(card, /summary_label/);
assert.match(card, /has-photo/);
assert.match(card, /hero_fit/);
assert.match(card, /hero_variant/);
assert.match(card, /hero_product_image/);
assert.match(card, /model_name/);
assert.match(card, /power_entity/);
assert.match(card, /energy_entity/);
assert.match(card, /energy_difference_entity/);
assert.match(card, /power_energy_entity/);
assert.match(card, /energy_saved_entity/);

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
assert.match(dashboard, /entity:\s+sensor\.jubang_naengjanggo_fridge_temperature/);
assert.match(dashboard, /target_entity:\s+number\.jubang_naengjanggo_fridge_temperature/);
assert.match(dashboard, /entity:\s+sensor\.jubang_naengjanggo_freezer_temperature/);
assert.match(dashboard, /target_entity:\s+number\.jubang_naengjanggo_freezer_temperature/);
assert.match(dashboard, /quick_cool_entity:\s+switch\.jubang_naengjanggo_power_cool/);
assert.match(dashboard, /quick_freeze_entity:\s+switch\.jubang_naengjanggo_power_freeze/);
for (const entityId of [
  "sensor.jubang_naengjanggo_power",
  "sensor.jubang_naengjanggo_energy",
  "sensor.jubang_naengjanggo_energy_difference",
  "sensor.jubang_naengjanggo_power_energy",
  "sensor.jubang_naengjanggo_energy_saved",
  "sensor.jubang_gimcinaengjanggo_power",
  "sensor.jubang_gimcinaengjanggo_energy",
  "sensor.jubang_gimcinaengjanggo_energy_difference",
  "sensor.jubang_gimcinaengjanggo_power_energy",
  "sensor.jubang_gimcinaengjanggo_energy_saved",
]) {
  assert.match(dashboard, new RegExp(entityId.replaceAll(".", "\\.")));
}
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
