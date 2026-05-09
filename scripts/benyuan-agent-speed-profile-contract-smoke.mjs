#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readRequired(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const agent = readRequired("src/lib/benyuan-v3-agent.ts");
const runtimeRoute = readRequired("src/app/api/agent/runtime/route.ts");
const configureScript = readRequired("scripts/configure-staging-llm.sh");
const packageJson = readRequired("package.json");

assert.match(agent, /BENYUAN_AGENT_SPEED_PROFILE/, "agent runtime must read BENYUAN_AGENT_SPEED_PROFILE");
assert.match(agent, /fast[\s\S]*theater[\s\S]*maxOutputTokens:\s*2600/, "fast theater profile should cap output tokens at 2600");
assert.match(agent, /fast[\s\S]*theater[\s\S]*reasoningEffort:\s*"medium"/, "fast theater profile should use medium reasoning");
assert.match(agent, /fast[\s\S]*constellation[\s\S]*maxOutputTokens:\s*3800/, "fast constellation profile should cap output tokens at 3800");
assert.match(agent, /fast[\s\S]*multimodal[\s\S]*reasoningEffort:\s*"low"/, "fast multimodal profile should use low reasoning");
assert.match(agent, /transport:\s*"json_first"/, "fast text agents should avoid wasting a stream attempt before JSON");
assert.match(agent, /allowSecondaryAttempts:\s*false/, "fast text agents should not stack multiple long provider attempts");
assert.match(agent, /timeoutMs:\s*70000/, "fast theater profile should cap provider wait near 70s");
assert.match(agent, /timeoutMs:\s*90000/, "fast constellation profile should cap provider wait near 90s");

assert.match(runtimeRoute, /agentSpeedProfile/, "runtime endpoint should expose the active speed profile");
assert.match(configureScript, /BENYUAN_AGENT_SPEED_PROFILE/, "staging LLM configure script should persist speed profile");
assert.match(packageJson, /smoke:agent:speed-profile/, "package scripts should include speed profile contract smoke");

console.log("agent-speed-profile-contract:ok");
