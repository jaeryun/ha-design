import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dashboards = await Promise.all([
  readFile(`${root}/dashboards/ha-design.yaml`, "utf8"),
  readFile(`${root}/dashboards/ha-design-inline.yaml`, "utf8"),
]);

// 홈 메뉴는 기기 종류가 아니라 장소 중심 다섯 view이며, 순서와 경로가 계약이다.
const views = [
  ["거실", "living-room"],
  ["안방", "bedroom"],
  ["아기방", "baby-room"],
  ["주방", "kitchen"],
  ["다용도실", "utility-room"],
];
const cardTypes = [
  "light",
  "climate",
  "curtain",
  "cold-storage",
  "washer",
  "camera",
  "air-purifier",
  "temp-humidity",
];

const viewBlock = (yaml, path) => {
  const start = yaml.indexOf(`    path: ${path}`);
  assert.notEqual(start, -1, `${path} view is missing`);
  const next = yaml.indexOf("\n  - title:", start);
  return yaml.slice(start, next === -1 ? yaml.length : next);
};

for (const yaml of dashboards) {
  const titles = [...yaml.matchAll(/^  - title: (.+)$/gm)].map((match) => match[1]);
  const paths = [...yaml.matchAll(/^    path: (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(titles, views.map(([title]) => title), "home menu must list locations in the approved order");
  assert.deepEqual(paths, views.map(([, path]) => path), "home menu paths must match the approved locations");
  assert.doesNotMatch(yaml, /^  - title: 전체$/m, "home menu must not keep an overview view");

  for (const [, path] of views) {
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
