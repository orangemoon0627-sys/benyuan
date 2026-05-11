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
  packageJson,
  /smoke:agent:constellation-transport/,
  "package scripts should expose constellation transport contract smoke",
);

console.log("agent-constellation-transport-contract:ok");
