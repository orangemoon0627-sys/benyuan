import assert from "node:assert/strict";
import test from "node:test";

import { toPublicAnalysisJob, toPublicReport } from "../src/lib/benyuan-public-analysis.ts";

const privateSentinel = "PRIVATE_SENTINEL_DO_NOT_EXPOSE";

test("public analysis status excludes provider payloads and internal errors", () => {
  const result = toPublicAnalysisJob({
    jobId: "job_fixture",
    sessionId: "sess_fixture",
    status: "failed",
    attempt: 2,
    createdAt: "2026-07-10T00:00:00.000Z",
    providerResponsePreview: "private generated text",
    providerFallbackReason: "upstream secret detail",
    topSignals: ["private-answer-derived-signal"],
    error: "raw provider exception",
    pipelineStages: [
      {
        key: "feature_mapped",
        title: "internal title",
        status: "done",
        detail: `top signal: ${privateSentinel}`,
      },
      {
        key: "provider_enhanced",
        title: "internal provider",
        status: "failed",
        detail: `provider failed: ${privateSentinel}`,
      },
    ],
  });

  assert.equal(result?.jobId, "job_fixture");
  assert.equal(result?.status, "failed");
  assert.equal("sessionId" in result, false);
  assert.equal("providerResponsePreview" in result, false);
  assert.equal("providerFallbackReason" in result, false);
  assert.equal("topSignals" in result, false);
  assert.equal("error" in result, false);
  assert.equal("effectiveRuntime" in result, false);
  assert.equal("providerId" in result, false);
  assert.equal("providerModel" in result, false);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(privateSentinel));
  assert.deepEqual(result?.pipelineStages?.map((stage) => stage.detail), [
    "这一阶段已完成。",
    "这一阶段暂未完成，请稍后重试。",
  ]);
});

test("public report excludes internal analysis metadata recursively", () => {
  const report = {
    reportId: "report_fixture",
    sessionId: "sess_fixture",
    overview: "public overview",
    dimensionReadings: [],
    tensions: [],
    archetype: {
      name: "公开原型",
      description: "public description",
      sourceSignals: [],
      evidence: [],
    },
    recommendations: [],
    safetyFlags: ["none"],
    confidenceBand: "medium",
    generatedAt: "2026-07-10T00:00:00.000Z",
    promptVersion: "public",
    reportSchemaVersion: "public",
    analysisMeta: {
      engineId: privateSentinel,
      engineLabel: privateSentinel,
      engineKind: "llm",
      effectiveRuntime: privateSentinel,
      providerId: privateSentinel,
      providerKind: "custom",
      providerAvailable: true,
      providerRequestMode: privateSentinel,
      providerResponsePreview: privateSentinel,
      promptTemplateId: privateSentinel,
      promptTemplateVersion: privateSentinel,
      reportSchemaId: privateSentinel,
      reportSchemaVersion: privateSentinel,
      answeredCount: 1,
      openReflectionCount: 1,
      topSignals: [privateSentinel],
    },
    privateDebug: privateSentinel,
  };
  report.archetype.analysisMeta = { private: privateSentinel };
  report.archetype.evidence.push({
    questionId: "q1",
    prompt: "public prompt",
    answerLabel: "public answer",
    signal: "public signal",
    privateDebug: privateSentinel,
  });
  report.recommendations.push({
    type: "book",
    title: "public title",
    description: "public description",
    privateDebug: privateSentinel,
  });

  const result = toPublicReport(report);
  assert.equal(result.overview, "public overview");
  assert.equal("analysisMeta" in result, false);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(privateSentinel));
  assert.equal("analysisMeta" in result.archetype, false);
  assert.equal("privateDebug" in result.archetype.evidence[0], false);
  assert.equal("privateDebug" in result.recommendations[0], false);
});
