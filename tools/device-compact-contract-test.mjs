import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const base = await readFile(`${root}/www/ha-design/ha-design-device-compact.js`, "utf8");
const climate = await readFile(`${root}/www/ha-design/ha-design-climate-card.js`, "utf8");
const lightTemplate = await readFile(`${root}/www/ha-design/ha-design-light-card.template.js`, "utf8");
const lightStyles = await readFile(`${root}/www/ha-design/ha-design-light-card.styles.js`, "utf8");

assert.match(base, /export const DEVICE_COMPACT_HERO_HEIGHT = 154;/);
assert.match(base, /export const DEVICE_COMPACT_TAIL_HEIGHT = 10;/);
assert.match(base, /export const escapeDeviceText =/);
assert.match(base, /export const renderDeviceCompact =/);
assert.match(base, /--device-compact-hero-height:\s*\$\{DEVICE_COMPACT_HERO_HEIGHT\}px/);
assert.match(base, /--device-compact-tail-height:\s*\$\{DEVICE_COMPACT_TAIL_HEIGHT\}px/);

assert.match(climate, /import \{ deviceCompactStyles, renderDeviceCompact \} from "\.\/ha-design-device-compact\.js\?v=/);
assert.match(climate, /renderDeviceCompact\(\{/);
assert.match(base, /escapeDeviceText\(title\)/);
assert.match(base, /escapeDeviceText\(eyebrow\)/);
assert.match(base, /escapeDeviceText\(badge\)/);
assert.match(base, /statusItems\.map\(\(item\) => `<span>\$\{escapeDeviceText\(item\)\}<\/span>`\)/);
assert.doesNotMatch(climate, /min-height:\s*154px/);
assert.doesNotMatch(climate, /\.compact-tail\s*\{[^}]*height:\s*10px/s);

assert.match(lightTemplate, /import \{ escapeDeviceText, renderDeviceCompact \} from "\.\/ha-design-device-compact\.js\?v=/);
assert.match(lightTemplate, /renderDeviceCompact\(\{/);
assert.match(lightStyles, /import \{ deviceCompactStyles \} from "\.\/ha-design-device-compact\.js\?v=/);
assert.doesNotMatch(lightStyles, /\.compact-hero\s*\{[^}]*block-size:/s);
assert.doesNotMatch(lightStyles, /\.compact-tail\s*\{[^}]*block-size:/s);

console.log("PASS shared device compact contract");
