#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const agent = readFileSync("src/lib/benyuan-v3-agent.ts", "utf8");
const packageJson = readFileSync("package.json", "utf8");

const qualityProfileMatch = agent.match(/quality:\s*\{[\s\S]*?constellation:\s*\{([\s\S]*?)\},\s*\},\s*fast:/);
assert.ok(qualityProfileMatch, "quality constellation profile must be explicit");

const qualityConstellationProfile = qualityProfileMatch[1] ?? "";
assert.match(
  qualityConstellationProfile,
  /transport:\s*"json_first"/,
  "quality constellation profile should prefer non-stream JSON to avoid long HTML/SSE abort fallbacks",
);
assert.match(
  qualityConstellationProfile,
  /timeoutMs:\s*90000/,
  "quality constellation profile should cap a single provider attempt within the native E2E wait budget",
);
assert.match(
  qualityConstellationProfile,
  /allowSecondaryAttempts:\s*false/,
  "quality constellation profile should avoid stacking stream and chat attempts after JSON timeout",
);
assert.match(
  qualityConstellationProfile,
  /compactPrompt:\s*true/,
  "quality constellation profile should use the compact seed prompt by default so native jobs do not depend on a huge full-report generation",
);
assert.match(
  qualityConstellationProfile,
  /maxOutputTokens:\s*(?:900|1000|1100|1200)/,
  "quality constellation profile should cap output to a compact seed instead of a full report",
);
assert.match(
  agent,
  /system:\s*profile\.compactPrompt\s*\?\s*FAST_ANALYST_SYSTEM_PROMPT\s*:\s*ANALYST_SYSTEM_PROMPT/,
  "constellation generation should select the compact analyst prompt whenever the stage profile requests it",
);
assert.match(
  agent,
  /if\s*\(profile\.compactPrompt\)\s*\{[\s\S]*normalizeFastConstellationSeed[\s\S]*mergeFastConstellationSeed/,
  "compact constellation generation should merge live personalization seed into the deterministic rule-based constellation",
);
assert.doesNotMatch(
  readFileSync("src/lib/benyuan-v3-prompts.ts", "utf8"),
  /保持 xhigh 推理深度/u,
  "compact prompts should not ask the model for xhigh reasoning in prompt text after the profile already bounds reasoning effort",
);

assert.match(
  packageJson,
  /smoke:agent:constellation-transport/,
  "package scripts should expose constellation transport contract smoke",
);

console.log("agent-constellation-transport-contract:ok");
