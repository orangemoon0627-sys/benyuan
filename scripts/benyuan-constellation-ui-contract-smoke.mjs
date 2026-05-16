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
  "constellationDisplayName",
  "constellationDisplaySubtitle",
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
  "constellation-personal-subtitle",
  "personalized_name?.trim() || data.archetype.name",
  "personalized_subtitle?.trim() || data.archetype.english_name",
];

const missing = [
  ...componentNeedles.filter((needle) => !component.includes(needle)).map((needle) => `component:${needle}`),
  ...cssNeedles.filter((needle) => !css.includes(needle)).map((needle) => `css:${needle}`),
];

const forbidden = forbiddenNeedles
  .flatMap((needle) => [
    component.includes(needle) ? `component:${needle}` : null,
    css.includes(needle) ? `css:${needle}` : null,
  ].filter(Boolean));

if (missing.length > 0 || forbidden.length > 0) {
  throw new Error(`constellation ui contract failed missing=[${missing.join(", ")}] forbidden=[${forbidden.join(", ")}]`);
}

if (!/function constellationDisplayName\(data: PsycheConstellation\) \{\s*return data\.archetype\.name;\s*\}/m.test(component)) {
  throw new Error("constellation ui contract failed: web constellation title must use the fixed canonical archetype name");
}

if (!/function constellationDisplaySubtitle\(data: PsycheConstellation\) \{\s*return data\.archetype\.english_name;\s*\}/m.test(component)) {
  throw new Error("constellation ui contract failed: web constellation subtitle must use the fixed canonical archetype English name");
}

console.log("constellation-ui-contract:ok");
