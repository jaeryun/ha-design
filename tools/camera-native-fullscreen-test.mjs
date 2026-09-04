import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const [card, template, player] = await Promise.all([
  readFile(`${root}/www/ha-design/ha-design-camera-card.js`, "utf8"),
  readFile(`${root}/www/ha-design/ha-design-camera-card.template.js`, "utf8"),
  readFile(`${root}/www/ha-design/ha-design-camera-webrtc.js`, "utf8"),
]);

assert.doesNotMatch(
  card,
  /_videoFullscreen|fullscreen-exit|cameraFullscreenStyles/,
  "camera card must not implement a custom fullscreen state",
);
assert.doesNotMatch(
  template,
  /data-action="fullscreen"|fullscreen-exit|recording-badge/,
  "live video must not render custom fullscreen or recording overlays",
);
assert.match(
  player,
  /this\._video\.controls\s*=\s*this\._controls/,
  "WebRTC player must expose native video controls",
);
assert.match(
  player,
  /video:fullscreen[\s\S]*object-fit:\s*contain/,
  "native fullscreen video must preserve the full frame",
);

console.log("PASS camera native fullscreen contract");
