import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");

const [card, template, styles, motion, dashboard, visual] = await Promise.all([
  read("www/ha-design/ha-design-curtain-card.js"),
  read("www/ha-design/ha-design-curtain-card.template.js"),
  read("www/ha-design/ha-design-curtain-card.styles.js"),
  read("www/ha-design/ha-design-curtain-motion.js"),
  read("dashboards/ha-design-curtain.yaml"),
  read("tools/curtain-visual-test.html"),
]);

assert.match(`${card}\n${template}`, /renderDeviceCompact/);
assert.match(card, /resolveDeviceCompactVariant/);
assert.match(card, /deviceCompactStyles/);
assert.match(card, /ha-design-card-ready/);
assert.match(card, /travel_duration/);
assert.match(`${card}\n${motion}`, /ha-design-position-change/);
assert.doesNotMatch(card, /activeAction === "position"/);
assert.match(motion, /requestFrame = \(callback\) => window\.requestAnimationFrame\(callback\)/);
assert.match(motion, /reconcile\(actualPosition\)/);
assert.match(motion, /this\._onPosition\(this\._position, this\._direction\)/);
assert.match(card, /OPEN:\s*1/);
assert.match(card, /CLOSE:\s*2/);
assert.match(card, /SET_POSITION:\s*4/);
assert.match(card, /STOP:\s*8/);
assert.match(card, /columns:\s*6/);
assert.match(card, /min_columns:\s*6/);
assert.match(card, /max_columns:\s*6/);
assert.match(card, /_callCoverService\("open_cover",\s*COVER_FEATURES\.OPEN/);
assert.match(card, /_callCoverService\("close_cover",\s*COVER_FEATURES\.CLOSE/);
assert.match(card, /_callCoverService\("stop_cover",\s*COVER_FEATURES\.STOP/);
assert.match(card, /_callCoverService\("set_cover_position",\s*COVER_FEATURES\.SET_POSITION/);
assert.match(card, /attributes\.device_class !== "curtain"/);
assert.doesNotMatch(card, /tilt/i);

assert.match(template, /type="range"/);
assert.match(template, /min="0"/);
assert.match(template, /max="100"/);
assert.match(template, /action:\s*"open"/);
assert.match(template, /action:\s*"stop"/);
assert.match(template, /action:\s*"close"/);
assert.match(template, /data-action="position"/);
assert.match(styles, /min-block-size:\s*44px/);
assert.match(styles, /--curtain-opening/);
assert.match(styles, /--curtain-compact-size/);
assert.match(styles, /inline-size:\s*min\(100%,\s*var\(--curtain-compact-size\)\)/);
assert.match(styles, /aspect-ratio:\s*auto/);

assert.match(dashboard, /type:\s*sections/);
assert.equal((dashboard.match(/compact_variant:\s*tile/g) ?? []).length, 2);
assert.match(dashboard, /cover\.geosilkeoteun/);
assert.match(dashboard, /cover\.anbangkeoteun/);
assert.match(dashboard, /travel_duration:\s*8\.8/);
assert.match(dashboard, /travel_duration:\s*7\.4/);

assert.match(visual, /ha-design-curtain-card/);
assert.match(visual, /cover\.geosilkeoteun/);
assert.match(visual, /cover\.anbangkeoteun/);
assert.match(visual, /data-result/);

const originalHTMLElement = globalThis.HTMLElement;
const originalCustomElements = globalThis.customElements;
const originalWindow = globalThis.window;
const registeredElements = new Map();

globalThis.HTMLElement = class {};
globalThis.customElements = {
  define(name, constructor) {
    registeredElements.set(name, constructor);
  },
  get(name) {
    return registeredElements.get(name);
  },
};
globalThis.window = {};

try {
  const sourceUrl = `data:text/javascript;base64,${Buffer.from(card).toString("base64")}`;
  await import(sourceUrl);
  assert.ok(
    registeredElements.has("ha-design-curtain-card"),
    "entry module must define the custom element before loading child modules",
  );
} finally {
  globalThis.HTMLElement = originalHTMLElement;
  globalThis.customElements = originalCustomElements;
  globalThis.window = originalWindow;
}

console.log("PASS curtain tile and detail contract");
