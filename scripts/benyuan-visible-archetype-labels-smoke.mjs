#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const checkedFiles = [
  "src/lib/fixtures/benyuan-v3-test-packs.json",
  "src/lib/benyuan-v3-demo-links.ts",
  "src/lib/benyuan-v3-report-profile.ts",
  "mobile/benyuan_origin_ios_shell/shell-manifest.json",
];

const retiredLabels = ["孤独求索者", "理性建构者", "温柔守护者"];

for (const filePath of checkedFiles) {
  const source = readFileSync(filePath, "utf8");
  for (const label of retiredLabels) {
    assert(!source.includes(label), `${filePath} still contains retired visible archetype label: ${label}`);
  }
}

console.log("visible-archetype-labels:ok");
