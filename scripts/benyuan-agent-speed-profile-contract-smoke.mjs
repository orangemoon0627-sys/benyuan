#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readRequired(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const agent = readRequired("src/lib/benyuan-v3-agent.ts");
const prompts = readRequired("src/lib/benyuan-v3-prompts.ts");
const runtimeRoute = readRequired("src/app/api/agent/runtime/route.ts");
const configureScript = readRequired("scripts/configure-staging-llm.sh");
const packageJson = readRequired("package.json");

assert.match(agent, /BENYUAN_AGENT_SPEED_PROFILE/, "agent runtime must read BENYUAN_AGENT_SPEED_PROFILE");
assert.match(agent, /fast[\s\S]*theater[\s\S]*maxOutputTokens:\s*2200/, "fast theater profile should cap output tokens at 2200");
assert.match(agent, /fast[\s\S]*theater[\s\S]*reasoningEffort:\s*"xhigh"/, "fast theater profile should preserve xhigh reasoning");
assert.match(agent, /fast[\s\S]*constellation[\s\S]*maxOutputTokens:\s*3000/, "fast constellation profile should cap output tokens at 3000");
assert.match(agent, /fast[\s\S]*multimodal[\s\S]*reasoningEffort:\s*"xhigh"/, "fast multimodal profile should preserve xhigh reasoning");
assert.match(agent, /transport:\s*"json_first"/, "fast text agents should avoid wasting a stream attempt before JSON");
assert.match(agent, /allowSecondaryAttempts:\s*false/, "fast text agents should not stack multiple long provider attempts");
assert.match(agent, /timeoutMs:\s*180000/, "fast theater profile should give xhigh live generation a realistic single-attempt budget");
assert.match(agent, /constellation:\s*\{[\s\S]*timeoutMs:\s*360000/, "fast constellation profile should allow the observed xhigh live generation window");
assert.match(agent, /constellation:\s*\{[\s\S]*compactPrompt:\s*true/, "fast constellation profile should use a compact live prompt");
assert.match(agent, /FAST_ANALYST_SYSTEM_PROMPT/, "fast constellation generation should use the compact analyst system prompt");
assert.match(agent, /buildFastAnalystUserPrompt/, "fast constellation generation should use the compact analyst user prompt");
assert.match(agent, /constellation:\s*\{[\s\S]*allowSecondaryAttempts:\s*false/, "fast constellation profile should avoid stacked retries during the native E2E window");
assert.match(prompts, /FAST_ANALYST_SYSTEM_PROMPT/, "prompts module should expose a compact analyst system prompt");
assert.match(prompts, /buildFastAnalystUserPrompt/, "prompts module should expose compact analyst prompt builder");
assert.match(prompts, /420-620 字/, "compact analyst prompt should reduce narrative length for native live generation");

assert.match(runtimeRoute, /agentSpeedProfile/, "runtime endpoint should expose the active speed profile");
assert.match(configureScript, /BENYUAN_AGENT_SPEED_PROFILE/, "staging LLM configure script should persist speed profile");
assert.match(packageJson, /smoke:agent:speed-profile/, "package scripts should include speed profile contract smoke");

console.log("agent-speed-profile-contract:ok");
