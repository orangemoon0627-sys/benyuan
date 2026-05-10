import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLaunchArgs,
  assertAllRequiredRuntimeStagesLive,
  safeNativeE2EEvents,
  safeNativeSessionSummary,
  shouldTreatAppLogsAsNativeError,
} from "./benyuan-ios-native-staging-e2e-lib.mjs";

test("buildLaunchArgs captures app logs and terminates the previous process", () => {
  const args = buildLaunchArgs({
    udid: "SIM-1",
    bundleId: "com.fanhao.benyuan.origin.shell",
    stdoutPath: "/tmp/benyuan.out.log",
    stderrPath: "/tmp/benyuan.err.log",
    baseUrl: "http://120.26.126.88",
    fixtureName: "native-smoke-fixture.png",
  });

  assert.deepEqual(args.slice(0, 5), [
    "simctl",
    "launch",
    "--stdout=/tmp/benyuan.out.log",
    "--stderr=/tmp/benyuan.err.log",
    "--terminate-running-process",
  ]);
  assert.equal(args.includes("--args"), false);
  assert.deepEqual(args.slice(-5), [
    "--benyuan-base-url",
    "http://120.26.126.88",
    "--benyuan-native-e2e-autorun",
    "--benyuan-native-pick-fixture",
    "native-smoke-fixture.png",
  ]);
});

test("buildLaunchArgs does not insert a legacy --args separator", () => {
  const args = buildLaunchArgs({
    udid: "SIM-1",
    bundleId: "com.fanhao.benyuan.origin.shell",
    stdoutPath: "/tmp/benyuan.out.log",
    stderrPath: "/tmp/benyuan.err.log",
    baseUrl: "http://120.26.126.88",
    fixtureName: "native-smoke-fixture.png",
  });

  assert.equal(args.includes("--args"), false);
});

test("shouldTreatAppLogsAsNativeError detects explicit e2e error markers", () => {
  assert.equal(
    shouldTreatAppLogsAsNativeError("BENYUAN_E2E_ERROR stage=theater message=decode_failed"),
    true
  );
  assert.equal(
    shouldTreatAppLogsAsNativeError("BENYUAN_E2E constellation_generated constellation_id=const_1"),
    false
  );
});

test("safeNativeSessionSummary keeps ids but strips auth tokens", () => {
  const summary = safeNativeSessionSummary({
    auth_session: {
      session_id: "auth_1",
      user_id: "usr_1",
      token: "bya_secret_token",
      provider: "anonymous",
    },
    part1_id: "part1_1",
    theater_script_id: "theater_1",
    part2_id: "part2_1",
    constellation_id: "const_1",
    answers: { A1: "A1-1" },
    uploaded_assets: { C1: [{ asset_id: "asset_1" }] },
  });

  assert.deepEqual(summary, {
    authSession: {
      sessionId: "auth_1",
      userId: "usr_1",
      provider: "anonymous",
      hasToken: true,
    },
    part1Id: "part1_1",
    theaterScriptId: "theater_1",
    part2Id: "part2_1",
    constellationId: "const_1",
    answerCount: 1,
    uploadQuestionCount: 1,
  });
  assert.equal(JSON.stringify(summary).includes("bya_secret_token"), false);
});

test("safeNativeE2EEvents keeps a bounded list of diagnostic messages", () => {
  const events = safeNativeE2EEvents([
    { recorded_at: "2026-05-09T00:00:00.000Z", message: "auth_created" },
    { recorded_at: "2026-05-09T00:00:01.000Z", message: "theater_saved theater_script_id=theater_1" },
    { recorded_at: "2026-05-09T00:00:02.000Z", message: "constellation_generated constellation_id=const_1" },
  ], 2);

  assert.deepEqual(events, [
    { recordedAt: "2026-05-09T00:00:01.000Z", message: "theater_saved theater_script_id=theater_1" },
    { recordedAt: "2026-05-09T00:00:02.000Z", message: "constellation_generated constellation_id=const_1" },
  ]);
});

test("assertAllRequiredRuntimeStagesLive rejects any same-run fallback stage", () => {
  assert.throws(
    () => assertAllRequiredRuntimeStagesLive({
      multimodal: { runtime_mode: "fallback", error: "multimodal_responses_json_failed_502" },
      theater: { runtime_mode: "live" },
      constellation: { runtime_mode: "live" },
    }),
    /ios_staging_e2e_stage_fallback:multimodal:multimodal_responses_json_failed_502/
  );
});

test("assertAllRequiredRuntimeStagesLive requires multimodal theater and constellation live", () => {
  assert.doesNotThrow(() => assertAllRequiredRuntimeStagesLive({
    multimodal: { runtime_mode: "live" },
    theater: { runtime_mode: "live" },
    constellation: { runtime_mode: "live" },
  }));

  assert.throws(
    () => assertAllRequiredRuntimeStagesLive({
      multimodal: { runtime_mode: "live" },
      theater: null,
      constellation: { runtime_mode: "live" },
    }),
    /ios_staging_e2e_stage_missing:theater/
  );
});
