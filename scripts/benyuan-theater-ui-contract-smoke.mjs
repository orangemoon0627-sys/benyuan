import { readFileSync } from "node:fs";

const component = readFileSync("src/components/benyuan-theater-experience.tsx", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");

const componentNeedles = [
  'data-theater-phase="act1"',
  'data-theater-phase="act2"',
  "theater-lens-stage",
  "theater-choice-stack",
  "theater-bottom-intent",
  "进入生成星图",
  "completedChoiceLogs",
  "finishJourney(completedChoiceLogs)",
  "currentChoice.options.slice(0, 4)",
  "record?.theater_script.act2.choices.slice(0, 4)",
  "setChoiceIndex(nextChoiceLogs.length)",
  "mirror_logs: []",
];

const cssNeedles = [
  ".theater-lens-stage",
  ".theater-lens-stage::before",
  ".theater-choice-stack",
  ".theater-bottom-intent",
];

const forbiddenNeedles = [
  { source: "component", value: 'data-theater-phase="act3"', content: component },
  { source: "component", value: 'data-theater-phase="epilogue"', content: component },
  { source: "component", value: 'id: "act3"', content: component },
  { source: "component", value: 'id: "epilogue"', content: component },
  { source: "component", value: "Part2MirrorRecord", content: component },
  { source: "component", value: "currentQuestion", content: component },
  { source: "component", value: "mirrorLogs", content: component },
  { source: "component", value: "questionIndex", content: component },
  { source: "component", value: "ImmersiveTopBar", content: component },
  { source: "component", value: "phaseMeta", content: component },
  { source: "component", value: "microSwitch", content: component },
  { source: "component", value: "record?.theater_script.act2.choices[0]", content: component },
  { source: "component", value: "setTimeout(() => {\n      void finishJourney", content: component },
  { source: "css", value: ".theater-epilogue-lens", content: css },
  { source: "css", value: ".theater-lens-stage--mirror", content: css },
];

const missing = [
  ...componentNeedles.filter((needle) => !component.includes(needle)).map((needle) => `component:${needle}`),
  ...cssNeedles.filter((needle) => !css.includes(needle)).map((needle) => `css:${needle}`),
];

if (missing.length > 0) {
  throw new Error(`theater ui contract missing ${missing.join(", ")}`);
}

const forbidden = forbiddenNeedles
  .filter((needle) => needle.content.includes(needle.value))
  .map((needle) => `${needle.source}:${needle.value}`);

if (forbidden.length > 0) {
  throw new Error(`theater ui contract forbids ${forbidden.join(", ")}`);
}

console.log("theater-ui-contract:ok");
