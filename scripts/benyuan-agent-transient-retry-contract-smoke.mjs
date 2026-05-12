#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const agent = readFileSync("src/lib/benyuan-v3-agent.ts", "utf8");
const packageJson = readFileSync("package.json", "utf8");

assert.match(agent, /isTransientProviderAttemptFailure/, "agent must classify transient provider gateway/HTML failures");
assert.match(agent, /provider_transient_retry/, "agent must include a distinct transient retry marker in accumulated runtime errors");
assert.match(agent, /retryProviderAttempt[\s\S]*await wait/, "agent must retry transient provider attempts with bounded backoff");
assert.match(agent, /maxAttempts:\s*params\.maxProviderAttempts/, "provider retry count must be controllable per agent stage");
assert.match(agent, /attemptResponsesJson[\s\S]*retryProviderAttempt/, "Responses JSON attempts must use transient retry handling");
assert.match(agent, /attemptResponsesStreamJson[\s\S]*retryProviderAttempt/, "Responses stream attempts must use transient retry handling");
assert.match(agent, /allowSecondaryAttempts:\s*false/, "fast profile should keep avoiding stacked long secondary attempts");
assert.match(agent, /maxProviderAttempts:\s*1/, "fast native stages should be able to disable transient provider retries");
assert.match(packageJson, /smoke:agent:transient-retry/, "package scripts should expose transient retry contract smoke");

console.log("agent-transient-retry-contract:ok");
