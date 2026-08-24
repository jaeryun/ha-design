import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dashboardPath = `${root}/dashboards/ha-design-climate.yaml`;
const heroPath = `${root}/www/ha-design/images/climate/living-room.png`;
const cardPath = `${root}/www/ha-design/ha-design-climate-card.js`;

const dashboard = await readFile(dashboardPath, "utf8");
const hero = await readFile(heroPath);
const card = await readFile(cardPath, "utf8");

assert.equal(
  (dashboard.match(/type:\s+custom:ha-design-climate-card/g) ?? []).length,
  2,
  "deployment must render exactly two climate cards",
);
assert.match(dashboard, /path:\s+climate\b/, "deployment must provide the climate view");
assert.match(dashboard, /entity:\s+climate\.geosil_eeokeon\b/);
assert.match(dashboard, /entity:\s+climate\.anbang_eeokeon\b/);
assert.equal(
  (dashboard.match(/details_presentation:\s+modal/g) ?? []).length,
  2,
  "both climate cards must use modal details",
);
assert.equal(
  (dashboard.match(/hero_image:.*living-room\.png/g) ?? []).length,
  2,
  "both cards must use the pinned repository hero",
);
assert.deepEqual(
  [...hero.subarray(0, 8)],
  [137, 80, 78, 71, 13, 10, 26, 10],
  "climate hero must be a PNG",
);
assert.ok(hero.length > 100_000, "climate hero must contain the approved full-quality image");
assert.match(card, /\.compact-tail\s*\{[^}]*height:\s*10px;/s);

console.log("PASS climate deployment contract");
