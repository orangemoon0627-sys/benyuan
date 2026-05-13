#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readRequired(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const packageJson = readRequired("package.json");
const sampler = readRequired("scripts/benyuan-ios-native-staging-progress-sampler.mjs");

assert.match(packageJson, /ios:shell:native-staging-progress/, "package scripts must expose the native staging progress sampler");
assert.match(sampler, /BENYUAN_IOS_PROGRESS_SAMPLE_MS\s*\?\?\s*5000/, "sampler must default to 5s screenshot/progress sampling");
assert.match(sampler, /staging-progress-samples/, "sampler must write screenshots into a dedicated output directory");
assert.match(sampler, /benyuan-ios-native-staging-progress-samples\.json/, "sampler must write a machine-readable JSON report");
assert.match(sampler, /benyuan-ios-native-staging-progress-report\.md/, "sampler must write a human-readable Markdown report");
assert.match(sampler, /"simctl",\s*"io",[\s\S]*"screenshot"/, "sampler must capture simulator screenshots through simctl io screenshot");
assert.match(sampler, /path\.join\(tempDir, filename\)/, "screenshots must be written to a temp path before copying back to Documents");
assert.match(sampler, /nativeJobIdsFromEvents/, "sampler must discover native generation job ids from E2E events");
assert.match(sampler, /\/api\/native\/jobs\/\$\{jobIds\.theaterJobId\}/, "sampler must poll theater native job progress");
assert.match(sampler, /\/api\/native\/jobs\/\$\{jobIds\.constellationJobId\}/, "sampler must poll constellation native job progress");
assert.match(sampler, /authTokenFromNativeSession/, "sampler must read the native auth token only for authenticated polling");
assert.match(sampler, /authorization: `Bearer \$\{options\.authToken\}`/, "sampler must send bearer auth when polling native jobs");
assert.match(sampler, /redactSensitiveText/, "sampler must redact sensitive text before writing reports");
assert.match(sampler, /bya_\[REDACTED\]/, "sampler must redact Benyuan bearer tokens");
assert.match(sampler, /Bearer \[REDACTED\]/, "sampler must redact Authorization bearer values");
assert.match(sampler, /const \{ authToken: _authToken/, "sampler must strip raw authToken before serializing diagnostics");
assert.match(sampler, /\/api\/agent\/runtime/, "sampler must include server runtime timing evidence");
assert.match(sampler, /progressEvidence: analyzeSamples\(samples\)/, "sampler must summarize progress smoothness evidence");
assert.match(sampler, /monotonicWithinJob/, "sampler must detect within-job progress regressions");
assert.match(sampler, /assertAllRequiredRuntimeStagesLive/, "sampler must keep the live-runtime gate from the staging E2E");
assert.match(sampler, /assertAllRequiredRuntimeStagesBelongToSession/, "sampler must verify timing records belong to the same native session");
assert.match(sampler, /assertNativeConstellationPersisted/, "sampler must verify the native session persisted the constellation id");
assert.match(sampler, /writeFile\(outputStdoutPath, redactSensitiveText/, "sampler must write redacted stdout logs to output");
assert.match(sampler, /writeFile\(outputStderrPath, redactSensitiveText/, "sampler must write redacted stderr logs to output");
assert.doesNotMatch(sampler, /auth_session:\s*session\.auth_session/, "sampler must not serialize raw auth sessions or tokens into reports");

console.log("ios-staging-progress-sampler-contract:ok");
