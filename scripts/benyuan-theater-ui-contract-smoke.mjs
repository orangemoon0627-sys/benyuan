import { readFileSync } from "node:fs";

const component = readFileSync("src/components/benyuan-theater-experience.tsx", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");

const componentNeedles = [
  'data-theater-phase="act1"',
  'data-theater-phase="act2"',
  'data-theater-phase="act3"',
  'data-theater-phase="epilogue"',
  "theater-lens-stage",
  "theater-choice-stack",
  "theater-bottom-intent",
];

const cssNeedles = [
  ".theater-lens-stage",
  ".theater-lens-stage::before",
  ".theater-choice-stack",
  ".theater-bottom-intent",
  ".theater-epilogue-lens",
];

const missing = [
  ...componentNeedles.filter((needle) => !component.includes(needle)).map((needle) => `component:${needle}`),
  ...cssNeedles.filter((needle) => !css.includes(needle)).map((needle) => `css:${needle}`),
];

if (missing.length > 0) {
  throw new Error(`theater ui contract missing ${missing.join(", ")}`);
}

console.log("theater-ui-contract:ok");
