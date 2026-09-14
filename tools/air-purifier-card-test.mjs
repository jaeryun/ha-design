import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");

const [card, template, styles, visual] = await Promise.all([
  read("www/ha-design/ha-design-air-purifier-card.js"),
  read("www/ha-design/ha-design-air-purifier-card.template.js"),
  read("www/ha-design/ha-design-air-purifier-card.styles.js"),
  read("tools/air-purifier-interaction-test.html"),
]);

assert.match(`${card}\n${template}`, /renderDeviceCompact/);
assert.match(card, /customElements\.define\("ha-design-air-purifier-card"/);
assert.match(card, /ha-design-card-ready/);
assert.match(card, /patchCardDom/);
assert.match(
  card,
  /if \(!state\) \{\s*this\._dialogOpen = false;\s*this\._restoreDocumentScroll\(\);/,
);
assert.match(card, /selector:\s*\{\s*entity:\s*\{\s*filter:\s*\{\s*domain:\s*"switch"/);
assert.match(card, /columns:\s*6/);
assert.match(card, /min_columns:\s*4/);
assert.match(card, /max_columns:\s*12/);
assert.match(card, /callService\("switch",\s*turnOn \? "turn_on" : "turn_off"/);
assert.match(template, /role="switch"/);
assert.match(template, /aria-checked=/);
assert.match(template, /className:\s*`device-card air-purifier-card/);
assert.match(template, /aria-controls="ha-design-air-purifier-dialog"/);
assert.match(template, /id="ha-design-air-purifier-dialog"/);
assert.doesNotMatch(template, /공기를 정화하고 있어요/);
assert.match(`${card}\n${template}`, /AC-23AH10FNW/);
assert.doesNotMatch(
  `${card}\n${template}`,
  /fan\.set_percentage|fan\.set_preset_mode|filter_remaining/,
);
assert.match(styles, /min-block-size:\s*44px/);
assert.match(styles, /prefers-reduced-motion:\s*reduce/);
assert.match(visual, /body\.dataset\.result = "pass"/);

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
  const AirPurifierCard = registeredElements.get("ha-design-air-purifier-card");
  assert.ok(AirPurifierCard, "custom element was not registered");

  const calls = [];
  const instance = Object.create(AirPurifierCard.prototype);
  instance._config = { entity: "switch.air_purifier_power" };
  instance._hass = {
    callService: (domain, service, data) => calls.push({ domain, service, data }),
  };
  instance._setPower(true);
  instance._setPower(false);
  assert.deepEqual(calls, [
    {
      domain: "switch",
      service: "turn_on",
      data: { entity_id: "switch.air_purifier_power" },
    },
    {
      domain: "switch",
      service: "turn_off",
      data: { entity_id: "switch.air_purifier_power" },
    },
  ]);
} finally {
  globalThis.HTMLElement = originalHTMLElement;
  globalThis.customElements = originalCustomElements;
  globalThis.window = originalWindow;
}

console.log("PASS air purifier power-only contract");
