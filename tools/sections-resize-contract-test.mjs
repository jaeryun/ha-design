import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dashboards = await Promise.all([
  readFile(`${root}/dashboards/ha-design.yaml`, "utf8"),
  readFile(`${root}/dashboards/ha-design-inline.yaml`, "utf8"),
]);

const paths = ["bedroom", "climate", "curtain", "cold-storage", "washer"];
const cardTypes = [
  "light",
  "climate",
  "curtain",
  "cold-storage",
  "washer",
];

const viewBlock = (yaml, path) => {
  const start = yaml.indexOf(`    path: ${path}`);
  assert.notEqual(start, -1, `${path} view is missing`);
  const next = yaml.indexOf("\n  - title:", start);
  return yaml.slice(start, next === -1 ? yaml.length : next);
};

for (const yaml of dashboards) {
  for (const path of paths) {
    const view = viewBlock(yaml, path);
    assert.match(view, /\n    type: sections\n/, `${path} is not a Sections view`);
    assert.match(view, /\n    max_columns: 1\n/, `${path} does not keep one responsive section`);
    assert.match(view, /\n    sections:\n/, `${path} has no grid section`);
  }
  for (const cardType of cardTypes) {
    const cardPattern = new RegExp(
      `type: custom:ha-design-${cardType}-card[\\s\\S]*?grid_options:\\n\\s+columns: (?:4|6|12)\\n\\s+rows: auto`,
    );
    assert.match(yaml, cardPattern, `${cardType} has no explicit resizable grid options`);
  }
}

console.log("PASS all dashboard views use resizable Sections cards");
