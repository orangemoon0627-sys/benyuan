#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = process.cwd();
const flowModel = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeFlowModel.swift`, "utf8");
const generationJobs = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeGenerationJobs.swift`, "utf8");
const generationSources = `${flowModel}\n${generationJobs}`;
const processingView = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeProcessingView.swift`, "utf8");
const packageJson = readFileSync(`${root}/package.json`, "utf8");

assert.match(flowModel, /private let nativeGenerationPollIntervalNanoseconds/, "native flow should centralize generation polling interval");
assert.match(flowModel, /private var lastNativeGenerationJobSnapshot/, "native flow should retain the latest cloud job snapshot for foreground recovery");
assert.match(flowModel, /func resumeProcessingIfNeeded\(\) async/, "native flow should expose an explicit foreground resume hook");
assert.match(generationSources, /restoreActiveGenerationJobIfNeeded[\s\S]*client\.fetchNativeGenerationJob/, "restore should fetch the current cloud job before polling");
assert.match(generationSources, /applyNativeGenerationJob\(job,\s*source:\s*\.restore/, "restore should apply a restore-specific processing message");
assert.match(generationSources, /resolvedProcessingProgress/, "job polling should resolve server progress through the shared helper");
assert.match(generationSources, /isSameNativeGenerationJobAsLastSnapshot/, "job polling should only preserve monotonic progress inside the same job");
assert.match(generationSources, /applyNativeGenerationJob\(job,\s*source:\s*\.live\)/, "native flow should apply the start-job response before waiting for the next poll");
assert.match(generationSources, /job\.canResumeInBackground/, "native flow should surface whether the cloud job can continue in background");
assert.match(flowModel, /BenyuanNativeGenerationJobPresentationSource/, "native flow should distinguish live polling from restore presentation");
assert.match(generationSources, /后台继续运行/, "native processing copy should explicitly say cloud generation continues in background");
assert.match(processingView, /model\.activeGenerationJobId/, "processing view should show a concrete resumable job marker");
assert.match(processingView, /云端生成/, "processing view should label the cloud generation state");
assert.match(packageJson, /smoke:ios:processing-recovery/, "package scripts should expose iOS processing recovery contract");

console.log("ios-processing-recovery-contract:ok");
