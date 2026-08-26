import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const baseModule = await import(`${root}/www/ha-design/ha-design-device-compact.js`);
const base = await readFile(`${root}/www/ha-design/ha-design-device-compact.js`, "utf8");
const climate = await readFile(`${root}/www/ha-design/ha-design-climate-card.js`, "utf8");
const lightTemplate = await readFile(`${root}/www/ha-design/ha-design-light-card.template.js`, "utf8");
const lightStyles = await readFile(`${root}/www/ha-design/ha-design-light-card.styles.js`, "utf8");
const climateResource = await readFile(`${root}/dashboards/ha-design-resource.yaml`, "utf8");
const lightResource = await readFile(`${root}/dashboards/ha-design-light-resource.yaml`, "utf8");

assert.match(base, /export const DEVICE_COMPACT_HERO_HEIGHT = 154;/);
assert.match(base, /export const DEVICE_COMPACT_TAIL_HEIGHT = 10;/);
assert.match(base, /export const escapeDeviceText =/);
assert.match(base, /export const renderDeviceCompact =/);
assert.match(base, /--device-compact-hero-height:\s*\$\{DEVICE_COMPACT_HERO_HEIGHT\}px/);
assert.match(base, /--device-compact-tail-height:\s*\$\{DEVICE_COMPACT_TAIL_HEIGHT\}px/);
assert.equal(baseModule.DEVICE_COMPACT_VARIANTS, undefined);
assert.equal(baseModule.resolveDeviceCompactVariant, undefined);

const adaptiveMarkup = baseModule.renderDeviceCompact({
  visual: "<span>scene</span>",
  eyebrow: "DEVICE",
  title: "공통 카드",
  statusItems: ["상태 1", "상태 2"],
  narrowStatusItem: "좁은 상태",
  badge: "켜짐",
});
assert.match(adaptiveMarkup, /data-device-compact-layout="adaptive"/);
assert.match(adaptiveMarkup, /device-compact-status--wide/);
assert.match(adaptiveMarkup, /device-compact-status--narrow/);
assert.match(adaptiveMarkup, /<span>상태 1<\/span><span>상태 2<\/span>/);
assert.match(adaptiveMarkup, /<span>좁은 상태<\/span>/);
assert.doesNotMatch(adaptiveMarkup, /device-card--tile|device-card--wide/);
assert.match(base, /container-type:\s*inline-size/);
assert.match(base, /@container\s*\(max-width:\s*280px\)/);

assert.match(climate, /from "\.\/ha-design-device-compact\.js\?v=/);
assert.match(climate, /renderDeviceCompact\(\{/);
assert.doesNotMatch(climate, /resolveDeviceCompactVariant|compact_variant/);
assert.match(base, /escapeDeviceText\(title\)/);
assert.match(base, /escapeDeviceText\(eyebrow\)/);
assert.match(base, /escapeDeviceText\(badge\)/);
assert.match(base, /statusItems\.map\(\(item\) => `<span>\$\{escapeDeviceText\(item\)\}<\/span>`\)/);
assert.doesNotMatch(climate, /min-height:\s*154px/);
assert.doesNotMatch(climate, /\.compact-tail\s*\{[^}]*height:\s*10px/s);

assert.match(lightTemplate, /from "\.\/ha-design-device-compact\.js\?v=/);
assert.match(lightTemplate, /renderDeviceCompact\(\{/);
assert.doesNotMatch(lightTemplate, /resolveDeviceCompactVariant|compactVariant|variant:/);
assert.match(lightStyles, /import \{ deviceCompactStyles \} from "\.\/ha-design-device-compact\.js\?v=/);
assert.doesNotMatch(lightStyles, /\.compact-hero\s*\{[^}]*block-size:/s);
assert.doesNotMatch(lightStyles, /\.compact-tail\s*\{[^}]*block-size:/s);

const resourceSha = (resource) => resource.match(/ha-design@([0-9a-f]{40})\//)?.[1];
assert.ok(resourceSha(climateResource), "climate resource must pin a commit SHA");
assert.equal(
  resourceSha(lightResource),
  resourceSha(climateResource),
  "climate and light resources must deploy the same shared compact commit",
);

console.log("PASS shared device compact contract");
