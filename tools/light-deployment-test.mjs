import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dashboard = await readFile(`${root}/dashboards/ha-design.yaml`, "utf8");

assert.match(dashboard, /path:\s+bedroom\b/, "deployment must keep the bedroom view");
assert.equal(
  (dashboard.match(/type:\s+custom:ha-design-light-card/g) ?? []).length,
  1,
  "bedroom deployment must render one native light card",
);
assert.match(dashboard, /entity:\s+light\.anbang_anbang_jomyeong\b/);
assert.doesNotMatch(
  dashboard,
  /type:\s+custom:button-card\b/,
  "native bedroom deployment must not depend on button-card",
);

const inlineDashboard = await readFile(`${root}/dashboards/ha-design-inline.yaml`, "utf8");
const resource = await readFile(`${root}/dashboards/ha-design-light-resource.yaml`, "utf8");
const hero = await readFile(`${root}/www/ha-design/images/lighting/bedroom_on.svg`, "utf8");
const card = await readFile(`${root}/www/ha-design/ha-design-light-card.js`, "utf8");
const template = await readFile(`${root}/www/ha-design/ha-design-light-card.template.js`, "utf8");
const styles = await readFile(`${root}/www/ha-design/ha-design-light-card.styles.js`, "utf8");
const implementation = `${card}\n${template}`;

assert.equal(
  (inlineDashboard.match(/type:\s+custom:ha-design-light-card/g) ?? []).length,
  1,
  "paste-ready dashboard must use the same native light card",
);
assert.match(inlineDashboard, /entity:\s+light\.anbang_anbang_jomyeong\b/);
assert.doesNotMatch(inlineDashboard, /button_card_templates/);
assert.match(resource, /^type:\s+module$/m);
assert.match(
  resource,
  /^url:\s+https:\/\/cdn\.jsdelivr\.net\/gh\/jaeryun\/ha-design@(?:main|[0-9a-f]{40})\/www\/ha-design\/ha-design-light-card\.js\?v=light-mobile-\d{8}-\d+$/m,
  "light module URL must carry a mobile cache-bust",
);
assert.match(hero, /<svg[^>]+viewBox="0 0 1200 800"/, "bedroom hero must keep the approved wide vector scene");
assert.ok(hero.length > 2_000, "bedroom hero must contain the complete vector scene");
assert.match(card, /customElements\.define\("ha-design-light-card"/);
assert.match(card, /_bindRange\("brightness"/);
assert.match(card, /_bindRange\("color-temperature"/);
assert.match(implementation, /data-action="color"/);
assert.match(card, /transition:\s*0\.3/);
assert.match(card, /\.\/ha-design-light-card\.styles\.js/);
assert.match(styles, /prefers-reduced-motion:\s*reduce/);

console.log("PASS light deployment contract");
