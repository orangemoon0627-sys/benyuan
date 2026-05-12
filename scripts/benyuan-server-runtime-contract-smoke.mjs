#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readRequired(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const serverRuntime = readRequired("src/lib/benyuan-server-runtime.ts");
const agent = readRequired("src/lib/benyuan-v3-agent.ts");
const runtimeRoute = readRequired("src/app/api/agent/runtime/route.ts");
const status = readRequired("src/lib/benyuan-status.ts");
const deploy = readRequired("scripts/deploy-staging.sh");
const configureLlm = readRequired("scripts/configure-staging-llm.sh");
const packageJson = readRequired("package.json");

assert.match(serverRuntime, /readBenyuanAgentRuntime/, "server runtime module must expose the secret-bearing agent runtime resolver");
assert.match(serverRuntime, /readBenyuanServerRuntimeStatus/, "server runtime module must expose a safe public status resolver");
assert.match(serverRuntime, /Math\.min\(runtime\.providerTimeoutMs,\s*180000\)/, "server runtime should allow one xhigh provider attempt up to 180s");
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
assert.match(agent, /constellation:\s*\{[\s\S]*?reasoningEffort:\s*"xhigh"/, "constellation analyst must use xhigh reasoning even when the fast profile is enabled");
assert.match(agent, /theater:\s*\{[\s\S]*?reasoningEffort:\s*"xhigh"/, "theater director must use xhigh reasoning to preserve continuous story logic");
assert.match(agent, /multimodal:\s*\{[\s\S]*?reasoningEffort:\s*"xhigh"/, "multimodal analysis must use xhigh reasoning by default");
assert.doesNotMatch(agent, /constellation:\s*\{[\s\S]*?reasoningEffort:\s*"medium"/, "constellation analyst must not run at medium reasoning");
assert.match(runtimeRoute, /readBenyuanServerRuntimeStatus/, "agent runtime route must use safe server runtime status");
assert.doesNotMatch(runtimeRoute, /OPENAI_API_KEY/, "runtime route must not reference raw secret env keys directly");
assert.match(runtimeRoute, /secretStorage/, "runtime route must return secret storage status");
assert.match(runtimeRoute, /serverIndependent/, "runtime route must expose local-Mac independence status");
assert.match(status, /readBenyuanServerRuntimeStatus/, "lab status must use the same safe runtime status");

assert.match(deploy, /BENYUAN_RUNTIME_ENV_FILE/, "deploy must export the runtime env file path to the PM2 process");
assert.match(configureLlm, /OPENAI_API_KEY=\$api_key/, "LLM configure script must write the provider key only to the private server env file");
assert.match(configureLlm, /chmod 600 '\$runtime_env_file'/, "LLM runtime env file must be written with owner-only permissions");
assert.match(packageJson, /smoke:server-runtime:contract/, "package scripts must expose the server runtime contract smoke");

console.log("server-runtime-contract:ok");
