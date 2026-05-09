#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [
  "src/components/benyuan-part1-workflow.tsx",
  "mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeModels.swift",
  "mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeFlowModel.swift",
];

for (const file of files) {
  const source = readFileSync(path.join(root, file), "utf8");
  assert.doesNotMatch(source, /zyz\.qingyanzhiying\.top/i, `${file} must not hardcode the legacy Qingyan base URL`);
  assert.doesNotMatch(source, /provider_?name:\s*["']qingyan["']|providerName:\s*String\s*=\s*["']qingyan["']/i, `${file} must not default to Qingyan`);
}

const webWorkflow = readFileSync(path.join(root, "src/components/benyuan-part1-workflow.tsx"), "utf8");
assert.match(webWorkflow, /model:\s*"gpt-5\.5"/, "web workflow should keep the selected model visible");
assert.doesNotMatch(webWorkflow, /live:\s*true/, "web workflow must not force live mode from the client");
assert.doesNotMatch(webWorkflow, /requestRuntime\.live/, "web workflow must not override server-side live gating");
assert.doesNotMatch(webWorkflow, /requestRuntime\.api_key/, "web workflow must not forward client-side API keys");

const nativeFlow = readFileSync(path.join(root, "mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeFlowModel.swift"), "utf8");
assert.doesNotMatch(nativeFlow, /AgentRuntimeOverride\(\)/, "native flow should let the server runtime environment choose the provider");

console.log("runtime-client-config:ok");
