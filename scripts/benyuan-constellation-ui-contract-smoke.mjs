import { readFileSync } from "node:fs";

const component = readFileSync("src/components/benyuan-constellation-view.tsx", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");

const componentNeedles = [
  "constellation-moon-scroll",
  "constellation-lens-stage",
  "constellation-core-orb",
  "constellation-dimension-orbit",
  "constellation-narrative-river",
  "constellation-final-dock",
  "data-constellation-state",
  "data-constellation-section",
];

const cssNeedles = [
  ".constellation-lens-stage",
  ".constellation-core-orb",
  ".constellation-dimension-orbit",
  ".constellation-narrative-river",
  ".constellation-final-dock",
];

const forbiddenNeedles = [
  "cosmic-result-sequence",
  "cosmic-result-card",
  "cosmic-result-action-dock",
  "继续阅读全部结果",
  "ESSENCE",
  "STRUCTURE",
  "NOW",
];

const missing = [
  ...componentNeedles.filter((needle) => !component.includes(needle)).map((needle) => `component:${needle}`),
  ...cssNeedles.filter((needle) => !css.includes(needle)).map((needle) => `css:${needle}`),
];

const forbidden = forbiddenNeedles
  .filter((needle) => component.includes(needle))
  .map((needle) => `component:${needle}`);

if (missing.length > 0 || forbidden.length > 0) {
  throw new Error(`constellation ui contract failed missing=[${missing.join(", ")}] forbidden=[${forbidden.join(", ")}]`);
}

console.log("constellation-ui-contract:ok");
