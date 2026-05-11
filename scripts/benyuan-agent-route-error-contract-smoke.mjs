#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const theaterRoute = readFileSync("src/app/api/theater/generate/route.ts", "utf8");
const constellationRoute = readFileSync("src/app/api/constellation/generate/route.ts", "utf8");
const routeErrors = readFileSync("src/lib/benyuan-agent-route-errors.ts", "utf8");
const nativeClient = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanAPIClient.swift", "utf8");

for (const [label, source] of [
  ["theater", theaterRoute],
  ["constellation", constellationRoute],
]) {
  assert.match(source, /catch\s*\(error\)/, `${label} route must catch unexpected generation failures`);
  assert.match(source, /agentRouteErrorResponse/, `${label} route must return a structured JSON generation error`);
  assert.match(source, new RegExp(`stage:\\s*"${label}"`), `${label} route error response must include the failing stage`);
  assert.match(source, /part1_id:\s*body\.part1_id|part1_id:\s*part1\.part1_id/, `${label} route error response must include part1_id`);
}

assert.match(routeErrors, /agent_generation_failed/, "agent route error helper must emit a stable JSON error code");
assert.match(routeErrors, /NextResponse\.json/, "agent route error helper must return JSON instead of a blank 500");
assert.match(nativeClient, /请求失败（HTTP \\?\(status\\?\)）/, "native API errors must include HTTP status");
assert.match(nativeClient, /bodyPreview/, "native API errors must include a response body preview");

console.log("agent-route-error-contract:ok");
