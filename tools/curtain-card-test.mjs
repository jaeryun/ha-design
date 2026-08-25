import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");

const [card, template, styles, dashboard, visual] = await Promise.all([
  read("www/ha-design/ha-design-curtain-card.js"),
  read("www/ha-design/ha-design-curtain-card.template.js"),
  read("www/ha-design/ha-design-curtain-card.styles.js"),
  read("dashboards/ha-design-curtain.yaml"),
  read("tools/curtain-visual-test.html"),
]);

assert.match(`${card}\n${template}`, /renderDeviceCompact/);
assert.match(card, /resolveDeviceCompactVariant/);
assert.match(card, /deviceCompactStyles/);
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

assert.match(dashboard, /type:\s*sections/);
assert.equal((dashboard.match(/compact_variant:\s*tile/g) ?? []).length, 2);
assert.match(dashboard, /cover\.geosilkeoteun/);
assert.match(dashboard, /cover\.anbangkeoteun/);

assert.match(visual, /ha-design-curtain-card/);
assert.match(visual, /cover\.geosilkeoteun/);
assert.match(visual, /cover\.anbangkeoteun/);
assert.match(visual, /data-result/);

console.log("PASS curtain tile and detail contract");
