import { readFileSync } from "node:fs";

const component = readFileSync("src/components/benyuan-processing-ritual.tsx", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");
const presentation = readFileSync("src/lib/benyuan-mainflow-presentation.ts", "utf8");

const componentNeedles = [
  'data-processing-phase={phase}',
  'data-processing-state={processingState}',
  "processing-lens-stage",
  "processing-core-singularity",
  "processing-stage-rail",
  "processing-bottom-intent",
];

const cssNeedles = [
  ".processing-lens-stage",
  ".processing-lens-stage::before",
  ".processing-core-singularity",
  ".processing-stage-rail",
  ".processing-bottom-intent",
];

const forbiddenNeedles = [
  "provider",
  "request_id",
  "预计剩余",
  "estimateSec",
  "useState<StageState[]>(() => buildResumedStages",
  "useState<number | null>(() => readActiveStageStartedAt",
];

const emptyPresentationMatch = /kind === "empty"[\s\S]*?title:\s*"([^"]+)"/.exec(presentation);
const crampedCopy = [];
if (emptyPresentationMatch?.[1] && emptyPresentationMatch[1].length > 8) {
  crampedCopy.push(`presentation-empty-title:${emptyPresentationMatch[1]}`);
}

const missing = [
  ...componentNeedles.filter((needle) => !component.includes(needle)).map((needle) => `component:${needle}`),
  ...cssNeedles.filter((needle) => !css.includes(needle)).map((needle) => `css:${needle}`),
];

const forbidden = forbiddenNeedles
  .filter((needle) => component.includes(needle))
  .map((needle) => `component:${needle}`);

if (missing.length > 0 || forbidden.length > 0 || crampedCopy.length > 0) {
  throw new Error(`processing ui contract failed missing=[${missing.join(", ")}] forbidden=[${forbidden.join(", ")}] cramped=[${crampedCopy.join(", ")}]`);
}

console.log("processing-ui-contract:ok");
