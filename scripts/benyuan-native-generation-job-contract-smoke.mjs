#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readRequired(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const types = readRequired("src/lib/benyuan-v3-types.ts");
const store = readRequired("src/lib/benyuan-v3-store.ts");
const startRoutePath = "src/app/api/native/jobs/start/route.ts";
const jobRoutePath = "src/app/api/native/jobs/[jobId]/route.ts";
const nativeModels = readRequired("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeModels.swift");
const nativeClient = readRequired("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanAPIClient.swift");
const nativeFlow = readRequired("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeFlowModel.swift");
const processingView = readRequired("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeProcessingView.swift");
const flowStore = readRequired("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanFlowStore.swift");
const packageJson = readRequired("package.json");

assert.match(types, /BenyuanNativeGenerationJob/, "types must define native generation jobs for cloud-side background processing");
assert.match(types, /native_generation_jobs/, "v3 store must persist native generation jobs");
assert.match(store, /startNativeGenerationJob/, "store must expose job creation");
assert.match(store, /getNativeGenerationJob/, "store must expose job status lookup");
assert.match(store, /runNativeGenerationJob/, "store must run cloud-side generation jobs");
assert.match(store, /shouldResumeNativeGenerationJob/, "store must expose a stale-running recovery predicate for native jobs");
assert.match(store, /NATIVE_GENERATION_JOB_STALE_MS\s*=\s*3\s*\*\s*60\s*\*\s*1000/, "native jobs must become recoverable within the iOS waiting window");
assert.match(store, /progress:\s*0\.18/, "job progress must begin with a concrete percentage-compatible value");
assert.match(store, /progress:\s*1/, "job progress must reach 100 percent when complete");
assert.match(store, /current_stage:\s*"theater"/, "job must expose theater generation as a resumable stage");
assert.match(store, /current_stage:\s*"constellation"/, "job must expose constellation generation as a resumable stage");

assert.ok(existsSync(path.join(root, startRoutePath)), "native job start route must exist");
assert.ok(existsSync(path.join(root, jobRoutePath)), "native job status route must exist");
const startRoute = readRequired(startRoutePath);
const jobRoute = readRequired(jobRoutePath);
assert.match(startRoute, /assertPart1Owner/, "native job start must enforce authenticated part1 ownership");
assert.match(startRoute, /startNativeGenerationJob/, "native job start route must create or resume a server job");
assert.match(startRoute, /runNativeGenerationJob/, "native job start route must trigger server-side generation work");
assert.match(jobRoute, /getNativeGenerationJob/, "native job status route must read persisted job state");
assert.match(jobRoute, /assertPart1Owner/, "native job status route must enforce ownership through the parent part1");
assert.match(jobRoute, /shouldResumeNativeGenerationJob/, "native job status route must recover stale running jobs from polling");
assert.match(jobRoute, /job\.status\s*===\s*"queued"[\s\S]*shouldResumeNativeGenerationJob\(job\)/, "native job status route must trigger jobs that are queued or stale-running");
assert.match(jobRoute, /progress/, "native job status response must expose progress for iOS");
assert.match(jobRoute, /constellation_id/, "native job status response must expose completed constellation id");

assert.match(nativeModels, /BenyuanNativeGenerationJobResponse/, "iOS models must decode native generation job status");
assert.match(nativeModels, /progress: Double/, "iOS job status must expose progress as a Double");
assert.match(nativeModels, /canResumeInBackground/, "iOS job status must expose whether cloud-side resume is supported");
assert.match(nativeClient, /startNativeGenerationJob/, "iOS API client must start a cloud generation job");
assert.match(nativeClient, /fetchNativeGenerationJob/, "iOS API client must poll a cloud generation job");
assert.match(nativeFlow, /activeGenerationJobId/, "native flow must persist the active generation job id");
assert.match(nativeFlow, /pollNativeGenerationJob/, "native flow must poll cloud job status after the app returns");
assert.match(nativeFlow, /restoreActiveGenerationJobIfNeeded/, "native flow must restore active job state on launch");
assert.match(flowStore, /activeGenerationJobId/, "flow store session must persist active generation job id");

assert.match(processingView, /processingPercentText/, "native processing page must show a numeric percent label");
assert.match(processingView, /可以切出 App/, "native processing page must tell the user they can leave and return");
assert.match(processingView, /Int\(round\(model\.processingProgress \* 100\)\)/, "native processing percent must be derived from real progress");
assert.match(packageJson, /smoke:native-generation-job:contract/, "package scripts must expose the native generation job contract");

console.log("native-generation-job-contract:ok");
