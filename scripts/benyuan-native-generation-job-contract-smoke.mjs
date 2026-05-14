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
const nativeGenerationJobs = readRequired("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeGenerationJobs.swift");
const nativeGenerationSources = `${nativeFlow}\n${nativeGenerationJobs}`;
const processingView = readRequired("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeProcessingView.swift");
const flowStore = readRequired("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanFlowStore.swift");
const packageJson = readRequired("package.json");

assert.match(types, /BenyuanNativeGenerationJob/, "types must define native generation jobs for cloud-side background processing");
assert.match(types, /stage_progress/, "native jobs must expose current-stage progress separately from total progress");
assert.match(types, /progress_basis/, "native jobs must declare the coordinate system for progress");
assert.match(types, /stage_detail/, "native jobs must expose stage detail for iOS waiting presentation");
assert.match(types, /stage_timings/, "native jobs must preserve per-stage elapsed timing details");
assert.match(types, /native_generation_jobs/, "v3 store must persist native generation jobs");
assert.match(store, /startNativeGenerationJob/, "store must expose job creation");
assert.match(store, /getNativeGenerationJob/, "store must expose job status lookup");
assert.match(store, /runNativeGenerationJob/, "store must run cloud-side generation jobs");
assert.match(store, /shouldResumeNativeGenerationJob/, "store must expose a stale-running recovery predicate for native jobs");
assert.match(store, /activeNativeGenerationJobRuns/, "store must keep an in-process lock to avoid duplicate native job provider calls");
assert.match(store, /activeNativeGenerationJobRuns\.delete\(jobId\)/, "native job run lock must be released after completion or failure");
assert.match(store, /NATIVE_GENERATION_JOB_STALE_MS\s*=\s*3\s*\*\s*60\s*\*\s*1000/, "native jobs must become recoverable within the iOS waiting window");
assert.match(store, /buildNativeGenerationJobPresentation/, "job progress must be derived from stage-aware presentation metadata");
assert.match(store, /progress_min/, "native job stage presentation must define a lower progress bound");
assert.match(store, /progress_max/, "native job stage presentation must define an upper progress bound");
assert.match(store, /progress:\s*1/, "job progress must reach 100 percent when complete");
assert.match(store, /current_stage:\s*"theater"/, "job must expose theater generation as a resumable stage");
assert.match(store, /current_stage:\s*"constellation"/, "job must expose constellation generation as a resumable stage");

assert.ok(existsSync(path.join(root, startRoutePath)), "native job start route must exist");
assert.ok(existsSync(path.join(root, jobRoutePath)), "native job status route must exist");
const startRoute = readRequired(startRoutePath);
const jobRoute = readRequired(jobRoutePath);
assert.match(startRoute, /getCurrentAuthSession/, "native job start must require authenticated ownership");
assert.match(startRoute, /BenyuanAuthError/, "native job start must return auth errors without leaking internals");
assert.match(startRoute, /part1_forbidden/, "native job start must reject cross-account part1 access");
assert.match(startRoute, /startNativeGenerationJob/, "native job start route must create or resume a server job");
assert.match(startRoute, /runNativeGenerationJob/, "native job start route must trigger server-side generation work");
assert.match(jobRoute, /getNativeGenerationJob/, "native job status route must read persisted job state");
assert.match(jobRoute, /getCurrentAuthSession/, "native job status route must require authenticated ownership through the parent part1");
assert.match(jobRoute, /BenyuanAuthError/, "native job status route must return auth errors without leaking internals");
assert.match(jobRoute, /part1_forbidden/, "native job status route must reject cross-account job status reads");
assert.match(jobRoute, /shouldResumeNativeGenerationJob/, "native job status route must recover stale running jobs from polling");
assert.match(jobRoute, /job\.status\s*===\s*"queued"[\s\S]*shouldResumeNativeGenerationJob\(job\)/, "native job status route must trigger jobs that are queued or stale-running");
assert.match(jobRoute, /progress/, "native job status response must expose progress for iOS");
assert.match(jobRoute, /constellation_id/, "native job status response must expose completed constellation id");

assert.match(nativeModels, /BenyuanNativeGenerationJobResponse/, "iOS models must decode native generation job status");
assert.match(nativeModels, /progress: Double/, "iOS job status must expose progress as a Double");
assert.match(nativeModels, /stageProgress: Double\?/, "iOS job status must decode server stage progress");
assert.match(nativeModels, /stageDetail: BenyuanNativeGenerationJobStageDetail\?/, "iOS job status must decode server stage detail");
assert.match(nativeModels, /progressBasis: String\?/, "iOS job status must decode progress basis");
assert.match(nativeModels, /canResumeInBackground/, "iOS job status must expose whether cloud-side resume is supported");
assert.match(nativeClient, /startNativeGenerationJob/, "iOS API client must start a cloud generation job");
assert.match(nativeClient, /fetchNativeGenerationJob/, "iOS API client must poll a cloud generation job");
assert.match(nativeFlow, /activeGenerationJobId/, "native flow must persist the active generation job id");
assert.match(nativeGenerationSources, /pollNativeGenerationJob/, "native flow must poll cloud job status after the app returns");
assert.match(nativeGenerationSources, /restoreActiveGenerationJobIfNeeded/, "native flow must restore active job state on launch");
assert.match(flowStore, /activeGenerationJobId/, "flow store session must persist active generation job id");

assert.match(processingView, /processingPercentText/, "native processing page must show a numeric percent label");
assert.match(processingView, /可以切出 App/, "native processing page must tell the user they can leave and return");
assert.match(processingView, /Int\(round\(model\.processingProgress \* 100\)\)/, "native processing percent must be derived from real progress");
assert.match(processingView, /generationPhases:\s*\[GenerationPhase\]/, "native processing page must define visible cloud generation phases");
assert.match(processingView, /generationPhaseRail/, "native processing page must render a cloud generation phase rail");
for (const label of ["接收线索", "多模态读取", "剧场折射", "星图显影"]) {
  assert.match(processingView, new RegExp(label), `native processing phase rail must include ${label}`);
}
assert.match(nativeGenerationSources, /resolvedProcessingProgress/, "native flow must resolve progress through a single helper");
assert.match(nativeGenerationSources, /isSameNativeGenerationJobAsLastSnapshot/, "native flow must keep progress monotonic only within the same native job");
assert.match(packageJson, /smoke:native-generation-job:contract/, "package scripts must expose the native generation job contract");

console.log("native-generation-job-contract:ok");
