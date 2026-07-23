#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readRequired(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function readObjectBlock(source, propertyName, startAt = 0) {
  const propertyIndex = source.indexOf(`${propertyName}:`, startAt);
  assert.notEqual(propertyIndex, -1, `missing ${propertyName} profile`);
  const openingBrace = source.indexOf("{", propertyIndex);
  assert.notEqual(openingBrace, -1, `missing ${propertyName} profile body`);
  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(openingBrace + 1, index);
  }
  assert.fail(`unterminated ${propertyName} profile body`);
}

const serverRuntime = readRequired("src/lib/benyuan-server-runtime.ts");
const agent = readRequired("src/lib/benyuan-v3-agent.ts");
const runtimeRoute = readRequired("src/app/api/agent/runtime/route.ts");
const status = readRequired("src/lib/benyuan-status.ts");
const deploy = readRequired("scripts/deploy-staging.sh");
const configureLlm = readRequired("scripts/configure-staging-llm.sh");
const packageJson = readRequired("package.json");
const analysisConfig = readRequired("src/lib/analysis/config.ts");

assert.match(serverRuntime, /readBenyuanAgentRuntime/, "server runtime module must expose the secret-bearing agent runtime resolver");
assert.match(serverRuntime, /gpt-5\.6-terra/, "server runtime fallback must remain on the selected Terra model");
assert.match(analysisConfig, /customModel:[\s\S]*?gpt-5\.6-terra/, "custom analysis runtime must default to the selected Terra model");
assert.match(serverRuntime, /readBenyuanServerRuntimeStatus/, "server runtime module must expose a safe public status resolver");
assert.match(serverRuntime, /Math\.min\(runtime\.providerTimeoutMs,\s*360000\)/, "server runtime should allow one xhigh constellation provider attempt up to 360s");
assert.match(serverRuntime, /apiKeySource/, "server runtime status must identify where the configured key comes from without exposing it");
assert.match(serverRuntime, /secretStorage/, "server runtime status must describe the secret storage class");
assert.match(serverRuntime, /serverIndependent/, "server runtime status must state whether cloud runtime can work without the local Mac");
assert.match(serverRuntime, /BENYUAN_ALLOW_CODEX_RUNTIME_DEFAULTS/, "local Codex defaults must be behind an explicit production escape hatch");
assert.match(serverRuntime, /BENYUAN_ALLOW_REQUEST_RUNTIME_PROVIDER_OVERRIDE/, "request-level provider overrides must require an explicit non-production switch");
assert.match(serverRuntime, /allowProviderOverride\s*\?\s*override\?\.api_key/, "server runtime must ignore request API keys unless the debug switch is enabled");
assert.match(serverRuntime, /allowProviderOverride\s*\?\s*override\?\.base_url/, "server runtime must ignore request base URLs unless the debug switch is enabled");
assert.match(serverRuntime, /allowProviderOverride\s*\?\s*override\?\.live/, "server runtime must ignore request live flags unless the debug switch is enabled");

assert.match(agent, /readBenyuanAgentRuntime/, "agent calls must resolve runtime through the dedicated server module");
assert.doesNotMatch(agent, /readCodexProviderDefaults/, "agent must not read local Codex auth directly");
const stageProfiles = readObjectBlock(agent, "AGENT_STAGE_PROFILES");
const qualityProfile = readObjectBlock(stageProfiles, "quality");
const fastProfile = readObjectBlock(stageProfiles, "fast");
assert.match(readObjectBlock(qualityProfile, "constellation"), /reasoningEffort:\s*"high"/, "quality constellation analysis must use the validated high reasoning profile");
assert.match(readObjectBlock(fastProfile, "theater"), /reasoningEffort:\s*"medium"/, "fast theater generation must use the latency-validated medium reasoning profile");
assert.match(readObjectBlock(fastProfile, "constellation"), /reasoningEffort:\s*"high"/, "fast constellation analysis must preserve high reasoning");
assert.match(readObjectBlock(fastProfile, "multimodal"), /reasoningEffort:\s*"xhigh"/, "fast multimodal analysis must preserve xhigh reasoning");
assert.match(runtimeRoute, /readBenyuanServerRuntimeStatus/, "agent runtime route must use safe server runtime status");
assert.doesNotMatch(runtimeRoute, /OPENAI_API_KEY/, "runtime route must not reference raw secret env keys directly");
assert.match(runtimeRoute, /secretStorage/, "runtime route must return secret storage status");
assert.match(runtimeRoute, /serverIndependent/, "runtime route must expose local-Mac independence status");
assert.match(status, /readBenyuanServerRuntimeStatus/, "lab status must use the same safe runtime status");

assert.match(deploy, /BENYUAN_RUNTIME_ENV_FILE/, "deploy must export the runtime env file path to the PM2 process");
assert.match(configureLlm, /OPENAI_API_KEY=\$api_key/, "LLM configure script must write the provider key only to the private server env file");
assert.match(configureLlm, /BENYUAN_CUSTOM_MODEL:-gpt-5\.6-terra/, "staging LLM configuration must default to the selected Terra model");
assert.match(configureLlm, /chmod 600 '\$runtime_env_file'/, "LLM runtime env file must be written with owner-only permissions");
assert.match(packageJson, /smoke:server-runtime:contract/, "package scripts must expose the server runtime contract smoke");

console.log("server-runtime-contract:ok");
