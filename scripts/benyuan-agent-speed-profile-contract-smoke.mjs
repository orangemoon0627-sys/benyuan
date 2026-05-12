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
assert.match(agent, /fast[\s\S]*theater[\s\S]*maxOutputTokens:\s*900/, "fast theater profile should request a compact live seed");
assert.match(agent, /fast[\s\S]*theater[\s\S]*reasoningEffort:\s*"xhigh"/, "fast theater profile should preserve xhigh reasoning");
assert.match(agent, /fast[\s\S]*constellation[\s\S]*maxOutputTokens:\s*900/, "fast constellation profile should request a compact live seed");
assert.match(agent, /fast[\s\S]*multimodal[\s\S]*reasoningEffort:\s*"xhigh"/, "fast multimodal profile should preserve xhigh reasoning");
assert.match(agent, /maxProviderAttempts\?:\s*number/, "stage profiles should control provider retry count");
assert.match(agent, /transport:\s*"json_first"/, "fast text agents should avoid wasting a stream attempt before JSON");
assert.match(agent, /allowSecondaryAttempts:\s*false/, "fast text agents should not stack multiple long provider attempts");
assert.match(agent, /fast[\s\S]*multimodal:\s*\{[\s\S]*timeoutMs:\s*120000/, "fast multimodal profile should have enough time for live visual analysis");
assert.match(agent, /fast[\s\S]*multimodal:\s*\{[\s\S]*maxProviderAttempts:\s*1/, "fast multimodal profile should run a single provider attempt inside the native E2E window");
assert.match(agent, /fast[\s\S]*theater:\s*\{[\s\S]*maxOutputTokens:\s*900/, "fast theater profile should only request a compact live seed");
assert.match(agent, /fast[\s\S]*theater:\s*\{[\s\S]*timeoutMs:\s*90000/, "fast theater profile should keep the live seed inside the native E2E window");
assert.match(agent, /fast[\s\S]*theater:\s*\{[\s\S]*maxProviderAttempts:\s*1/, "fast theater profile should avoid retrying a full long-running provider call");
assert.match(agent, /fast[\s\S]*theater:\s*\{[\s\S]*compactPrompt:\s*true/, "fast theater profile should use a compact director prompt");
assert.match(agent, /normalizeFastTheaterSeed/, "fast theater generation should normalize a compact seed instead of requiring a full script");
assert.match(agent, /mergeFastTheaterSeed/, "fast theater generation should merge live seed detail into the deterministic theater shell");
assert.match(agent, /constellation:\s*\{[\s\S]*timeoutMs:\s*360000/, "fast constellation profile should allow the observed xhigh live generation window");
assert.match(agent, /constellation:\s*\{[\s\S]*compactPrompt:\s*true/, "fast constellation profile should use a compact live prompt");
assert.match(agent, /fast[\s\S]*constellation:\s*\{[\s\S]*maxProviderAttempts:\s*2/, "fast constellation profile should retry one transient upstream failure inside the same bounded JSON path");
assert.match(agent, /type FastConstellationSeed/, "fast constellation should normalize a compact seed instead of requiring a full report");
assert.match(agent, /normalizeFastConstellationSeed/, "fast constellation generation should normalize a compact seed");
assert.match(agent, /mergeFastConstellationSeed/, "fast constellation generation should merge live seed detail into the deterministic constellation shell");
assert.match(agent, /FAST_DIRECTOR_SYSTEM_PROMPT/, "fast theater generation should use the compact director system prompt");
assert.match(agent, /buildFastDirectorUserPrompt/, "fast theater generation should use the compact director user prompt");
assert.match(agent, /FAST_ANALYST_SYSTEM_PROMPT/, "fast constellation generation should use the compact analyst system prompt");
assert.match(agent, /buildFastAnalystUserPrompt/, "fast constellation generation should use the compact analyst user prompt");
assert.match(agent, /constellation:\s*\{[\s\S]*allowSecondaryAttempts:\s*false/, "fast constellation profile should avoid stacked retries during the native E2E window");
assert.match(agent, /attemptResponsesJson\(\{[\s\S]*maxProviderAttempts:/, "text JSON attempts should receive stage retry budget");
assert.match(agent, /attemptResponsesStreamJson\(\{[\s\S]*maxProviderAttempts:/, "text stream attempts should receive stage retry budget");
assert.match(agent, /requestMultimodalJson\(\{[\s\S]*maxProviderAttempts:\s*profile\.maxProviderAttempts/, "multimodal generation should pass stage retry budget");
assert.match(agent, /requestAgentJson\(\{[\s\S]*maxProviderAttempts:\s*profile\.maxProviderAttempts/, "text generation should pass stage retry budget");
assert.match(prompts, /FAST_DIRECTOR_SYSTEM_PROMPT/, "prompts module should expose a compact director system prompt");
assert.match(prompts, /buildFastDirectorUserPrompt/, "prompts module should expose compact director prompt builder");
assert.match(prompts, /theater_seed/, "compact director prompt should request a small theater seed object");
assert.match(prompts, /不是完整剧本/, "compact director prompt should make clear the provider is not generating the full script");
assert.match(prompts, /FAST_ANALYST_SYSTEM_PROMPT/, "prompts module should expose a compact analyst system prompt");
assert.match(prompts, /buildFastAnalystUserPrompt/, "prompts module should expose compact analyst prompt builder");
assert.match(prompts, /constellation_seed/, "compact analyst prompt should request a small constellation seed object");
assert.match(prompts, /不是完整报告/, "compact analyst prompt should make clear the provider is not generating the full report");

assert.match(runtimeRoute, /agentSpeedProfile/, "runtime endpoint should expose the active speed profile");
assert.match(configureScript, /BENYUAN_AGENT_SPEED_PROFILE/, "staging LLM configure script should persist speed profile");
assert.match(packageJson, /smoke:agent:speed-profile/, "package scripts should include speed profile contract smoke");

console.log("agent-speed-profile-contract:ok");
