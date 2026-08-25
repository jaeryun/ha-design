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
const relativeLuminance = (hex) => {
  const channels = hex
    .match(/[0-9a-f]{2}/gi)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};
const contrastRatio = (first, second) => {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
};

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
  /^url:\s+https:\/\/cdn\.jsdelivr\.net\/gh\/jaeryun\/ha-design@[0-9a-f]{40}\/www\/ha-design\/ha-design-light-card\.js\?v=light-mobile-\d{8}-\d+$/m,
  "light module URL must pin an implementation commit and carry a mobile cache-bust",
);
assert.match(hero, /<svg[^>]+viewBox="0 0 1200 800"/, "bedroom hero must keep the approved wide vector scene");
assert.ok(hero.length > 2_000, "bedroom hero must contain the complete vector scene");
assert.match(card, /customElements\.define\("ha-design-light-card"/);
assert.match(card, /_bindRange\("brightness"/);
assert.match(card, /_bindRange\("color-temperature"/);
assert.match(implementation, /data-action="color"/);
assert.match(card, /transition:\s*0\.3/);
assert.match(card, /\.\/ha-design-light-card\.styles\.js\?v=light-/);
assert.match(
  styles,
  /\.light-card\s*\{[^}]*color:\s*var\(--ink\)/s,
  "compact card must not inherit a white Home Assistant theme text color",
);
const gold = styles.match(/--gold:\s*#([0-9A-F]{6})/i)?.[1];
assert.ok(gold, "lighting styles must define a gold accent");
assert.ok(contrastRatio(gold, "FFFFFF") >= 4.5, "gold text must meet WCAG AA contrast on white");
assert.match(styles, /prefers-reduced-motion:\s*reduce/);

console.log("PASS light deployment contract");
