import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const [dashboard, fullDashboard, resource] = await Promise.all([
  readFile(`${root}/dashboards/ha-design-washer.yaml`, "utf8"),
  readFile(`${root}/dashboards/ha-design.yaml`, "utf8"),
  readFile(`${root}/dashboards/ha-design-washer-resource.yaml`, "utf8"),
]);

for (const source of [dashboard, fullDashboard]) {
  assert.match(source, /path:\s+washer\b/);
  assert.match(source, /type:\s+custom:ha-design-washer-card\b/);
  assert.match(source, /model_name:\s+WD25DB8690BE\b/);
  assert.match(source, /hero_variant:\s+warm\b/);
  assert.match(source, /select\.dayongdosil_setaggi\b/);
  assert.match(source, /binary_sensor\.dayongdosil_setaggi_power\b/);
  assert.match(source, /binary_sensor\.dayongdosil_setaggi_remote_control\b/);
  assert.match(source, /sensor\.dayongdosil_setaggi_machine_state\b/);
  assert.match(source, /sensor\.dayongdosil_setaggi_job_state\b/);
  assert.match(source, /sensor\.dayongdosil_setaggi_completion_time\b/);
  assert.match(source, /select\.dayongdosil_setaggi_water_temperature\b/);
  assert.match(source, /number\.dayongdosil_setaggi_rinse_cycles\b/);
  assert.match(source, /select\.dayongdosil_setaggi_spin_level\b/);
  assert.match(source, /select\.dayongdosil_setaggi_detergent_dispense_amount\b/);
  assert.match(
    source,
    /select\.dayongdosil_setaggi_flexible_compartment_dispense_amount\b/,
  );
  assert.match(source, /switch\.dayongdosil_setaggi_bubble_soak\b/);
  assert.match(source, /switch\.dayongdosil_setaggi_wrinkle_prevent\b/);
  assert.match(source, /binary_sensor\.dayongdosil_setaggi_child_lock\b/);
  assert.match(source, /binary_sensor\.dayongdosil_setaggi_wrinkle_prevent_active\b/);
  assert.match(source, /sensor\.dayongdosil_setaggi_energy_difference\b/);
  assert.match(source, /sensor\.dayongdosil_setaggi_energy_saved\b/);
  assert.match(source, /sensor\.dayongdosil_setaggi_power_energy\b/);
  assert.match(source, /sensor\.dayongdosil_setaggi_water_consumption\b/);
  assert.doesNotMatch(source, /hero_variant:\s+(deep|linen)\b/);
}

assert.match(resource, /^id:\s+d99a02a5345c419f9d807eb2fe4bbf53$/m);
assert.match(resource, /^type:\s+module$/m);
assert.match(
  resource,
  /^url:\s+https:\/\/cdn\.jsdelivr\.net\/gh\/jaeryun\/ha-design@4b95baea6b8229463211fe89a792161f6194ead9\/www\/ha-design\/ha-design-washer-card\.js\?v=washer-warm-utility-20260830-2$/m,
);

console.log("PASS washer deployment contract");
