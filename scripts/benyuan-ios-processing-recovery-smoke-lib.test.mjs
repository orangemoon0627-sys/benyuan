import assert from "node:assert/strict";
import test from "node:test";

import {
  assertProcessingRecoverySummary,
  extractJobId,
  latestEventMessage,
} from "./benyuan-ios-processing-recovery-smoke-lib.mjs";

test("latestEventMessage finds the newest matching native diagnostic", () => {
  assert.equal(
    latestEventMessage([
      { message: "native_job_started kind=constellation job_id=job_old" },
      { message: "native_job_started kind=theater job_id=job_ignore" },
      { message: "native_job_started kind=constellation job_id=job_new" },
    ], /native_job_started kind=constellation/),
    "native_job_started kind=constellation job_id=job_new"
  );
});

test("extractJobId parses resumable native generation job ids", () => {
  assert.equal(extractJobId("native_job_started kind=constellation job_id=job_7uk67vhh"), "job_7uk67vhh");
  assert.equal(extractJobId("constellation_generated constellation_id=const_1"), null);
});

test("assertProcessingRecoverySummary accepts recovered constellation state", () => {
  const result = assertProcessingRecoverySummary({
    showsNativeError: false,
    showsShellError: false,
    beforeTerminate: {
      e2eEvents: [
        { message: "native_job_started kind=constellation job_id=job_7uk67vhh" },
      ],
    },
    afterRelaunch: {
      session: {
        activeGenerationJobId: null,
        constellationId: "const_1",
      },
      e2eEvents: [
        { message: "constellation_generated constellation_id=const_1" },
      ],
    },
  });

  assert.deepEqual(result, {
    startedJobId: "job_7uk67vhh",
    constellationId: "const_1",
  });
});

test("assertProcessingRecoverySummary rejects sessions that never cleared active job", () => {
  assert.throws(
    () => assertProcessingRecoverySummary({
      beforeTerminate: {
        e2eEvents: [
          { message: "native_job_started kind=constellation job_id=job_7uk67vhh" },
        ],
      },
      afterRelaunch: {
        session: {
          activeGenerationJobId: "job_7uk67vhh",
          constellationId: null,
        },
        e2eEvents: [],
      },
    }),
    /ios_processing_recovery_missing_recovered_constellation/
  );
});
