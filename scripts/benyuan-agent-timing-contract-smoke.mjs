#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readRequired(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const telemetry = readRequired("src/lib/benyuan-agent-timing.ts");
const multimodalRoute = readRequired("src/app/api/analyze/multimodal/route.ts");
const theaterRoute = readRequired("src/app/api/theater/generate/route.ts");
const constellationRoute = readRequired("src/app/api/constellation/generate/route.ts");
const runtimeRoute = readRequired("src/app/api/agent/runtime/route.ts");
const summaryScript = readRequired("scripts/benyuan-agent-timing-summary.mjs");

assert.match(telemetry, /benyuan-agent-timings\.jsonl/, "timing telemetry must persist to a JSONL file under data");
assert.match(telemetry, /appendFile/, "timing telemetry should append events without rewriting the main store");
assert.match(telemetry, /duration_ms/, "timing telemetry must record duration_ms");
assert.match(telemetry, /runtime_mode/, "timing telemetry must record runtime mode");

for (const [label, source] of [
  ["multimodal", multimodalRoute],
  ["theater", theaterRoute],
  ["constellation", constellationRoute],
]) {
  assert.match(source, /recordBenyuanAgentTiming/, `${label} route must record timing telemetry`);
  assert.match(source, /Date\.now\(\)/, `${label} route must measure elapsed wall time`);
  assert.match(source, /timing/, `${label} response should expose timing for client/debug visibility`);
}

assert.match(runtimeRoute, /summarizeBenyuanAgentTimings/, "runtime endpoint must expose timing summary");
assert.match(summaryScript, /p50_ms/, "summary script must report p50_ms");
assert.match(summaryScript, /p90_ms/, "summary script must report p90_ms");
assert.match(summaryScript, /multimodal|theater|constellation/, "summary script must group known agent stages");

console.log("agent-timing-contract:ok");
