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
assert.doesNotMatch(`${card}\n${template}`, /resolveDeviceCompactVariant|compact_variant/);
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
assert.match(card, /columns:\s*4/);
assert.match(card, /min_columns:\s*4/);
assert.match(card, /max_columns:\s*12/);
assert.match(card, /_callCoverService\("open_cover",\s*COVER_FEATURES\.OPEN/);
assert.match(card, /_callCoverService\("close_cover",\s*COVER_FEATURES\.CLOSE/);
assert.match(card, /_callCoverService\("stop_cover",\s*COVER_FEATURES\.STOP/);
assert.match(card, /_callCoverService\("set_cover_position",\s*COVER_FEATURES\.SET_POSITION/);
assert.match(card, /attributes\.device_class !== "curtain"/);
assert.doesNotMatch(card, /tilt/i);
assert.match(card, /callService\("select",\s*"select_option"/);
assert.match(card, /window\.confirm/);
assert.match(card, /reverse_direction_entity/);
assert.match(card, /motor_working_mode_entity/);
assert.match(card, /upper_stroke_limit_entity/);
assert.match(card, /middle_stroke_limit_entity/);
assert.match(card, /lower_stroke_limit_entity/);
assert.match(card, /motor_fault_entity/);

assert.match(template, /type="range"/);
assert.match(template, /min="0"/);
assert.match(template, /max="100"/);
assert.match(template, /action:\s*"open"/);
assert.match(template, /action:\s*"stop"/);
assert.match(template, /action:\s*"close"/);
assert.match(template, /data-action="position"/);
assert.match(template, /data-control="advanced-select"/);
assert.match(template, /data-control="stroke-command"/);
assert.match(template, /모터 상태/);
assert.match(`${card}\n${template}`, /정상|고장/);
assert.match(template, /고급 설정/);
assert.match(styles, /min-block-size:\s*44px/);
assert.match(styles, /--curtain-opening/);
assert.doesNotMatch(styles, /--curtain-compact-size|device-card--tile/);

assert.match(dashboard, /type:\s*sections/);
assert.doesNotMatch(dashboard, /compact_variant/);
assert.match(dashboard, /cover\.geosilkeoteun/);
assert.match(dashboard, /cover\.anbangkeoteun/);
assert.match(dashboard, /travel_duration:\s*8\.8/);
assert.match(dashboard, /travel_duration:\s*7\.4/);
for (const prefix of ["geosilkeoteun", "anbangkeoteun"]) {
  assert.match(dashboard, new RegExp(`motor_fault_entity:\\s*binary_sensor\\.${prefix}_motor_fault`));
  assert.match(dashboard, new RegExp(`reverse_direction_entity:\\s*select\\.${prefix}_reverse_direction`));
  assert.match(dashboard, new RegExp(`motor_working_mode_entity:\\s*select\\.${prefix}_motor_working_mode`));
  assert.match(dashboard, new RegExp(`upper_stroke_limit_entity:\\s*select\\.${prefix}_upper_stroke_limit`));
  assert.match(dashboard, new RegExp(`middle_stroke_limit_entity:\\s*select\\.${prefix}_middle_stroke_limit`));
  assert.match(dashboard, new RegExp(`lower_stroke_limit_entity:\\s*select\\.${prefix}_lower_stroke_limit`));
}

assert.match(visual, /ha-design-curtain-card/);
assert.match(visual, /cover\.geosilkeoteun/);
assert.match(visual, /cover\.anbangkeoteun/);
assert.match(visual, /select\.geosilkeoteun_reverse_direction:back/);
assert.match(visual, /select\.geosilkeoteun_motor_working_mode:intermittently/);
assert.match(visual, /select\.geosilkeoteun_upper_stroke_limit:SET/);
assert.match(visual, /select\.geosilkeoteun_middle_stroke_limit:RESET/);
assert.match(visual, /select\.geosilkeoteun_lower_stroke_limit:SET/);
assert.match(visual, /domain === "select" && service === "select_option"/);
assert.match(visual, /confirmations\.length === 5/);
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

  const CurtainCard = registeredElements.get("ha-design-curtain-card");
  const cardInstance = Object.create(CurtainCard.prototype);
  const selectCalls = [];
  cardInstance._hass = {
    states: {
      "select.geosilkeoteun_reverse_direction": { state: "forward", attributes: {} },
      "select.geosilkeoteun_motor_working_mode": { state: "continuous", attributes: {} },
      "select.geosilkeoteun_upper_stroke_limit": { state: "unknown", attributes: {} },
      "cover.unknown_curtain": {
        state: "unknown",
        attributes: { supported_features: 15 },
      },
    },
    callService: (domain, service, data) => selectCalls.push({ domain, service, data }),
  };
  let confirmed = false;
  globalThis.window.confirm = () => confirmed;

  assert.equal(
    cardInstance._callSelectService(
      "select.geosilkeoteun_reverse_direction",
      "back",
      "방향 변경 확인",
    ),
    false,
    "cancelled direction change was accepted",
  );
  assert.deepEqual(selectCalls, []);
  confirmed = true;
  assert.equal(
    cardInstance._callSelectService(
      "select.geosilkeoteun_reverse_direction",
      "back",
      "방향 변경 확인",
    ),
    true,
  );
  assert.deepEqual(selectCalls, [{
    domain: "select",
    service: "select_option",
    data: {
      entity_id: "select.geosilkeoteun_reverse_direction",
      option: "back",
    },
  }]);
  assert.equal(
    cardInstance._callSelectService(
      "select.geosilkeoteun_upper_stroke_limit",
      "SET",
      "상단 보정 확인",
    ),
    false,
    "unknown stroke control called a service",
  );
  confirmed = false;
  assert.equal(
    cardInstance._callSelectService(
      "select.geosilkeoteun_motor_working_mode",
      "intermittently",
      "커튼 모터 작동 모드를 변경할까요?",
    ),
    false,
    "cancelled motor working mode change was accepted",
  );
  cardInstance._config = { entity: "cover.unknown_curtain" };
  cardInstance._modules = { resolveCurtainPosition: () => 50 };
  cardInstance._callCoverService("open_cover", 1);
  cardInstance._callCoverService("close_cover", 2);
  cardInstance._callCoverService("stop_cover", 8);
  cardInstance._callCoverService("set_cover_position", 4, { position: 50 });
  assert.deepEqual(selectCalls, [{
    domain: "select",
    service: "select_option",
    data: {
      entity_id: "select.geosilkeoteun_reverse_direction",
      option: "back",
    },
  }], "unknown cover state called a service");
} finally {
  globalThis.HTMLElement = originalHTMLElement;
  globalThis.customElements = originalCustomElements;
  globalThis.window = originalWindow;
}

console.log("PASS curtain tile and detail contract");
