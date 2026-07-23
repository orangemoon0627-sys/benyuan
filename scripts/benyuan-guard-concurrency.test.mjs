import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const dataRoot = await mkdtemp(path.join(os.tmpdir(), "benyuan-guard-concurrency-"));
process.env.BENYUAN_DATA_ROOT = dataRoot;
process.env.BENYUAN_V3_STORE_PATH = path.join(dataRoot, "benyuan-v3-store.json");
process.env.BENYUAN_DATA_COHORT = "beta";
process.env.BENYUAN_DATA_ENVIRONMENT = "test";

const { checkAuthRateLimit } = await import("../src/lib/benyuan-auth.ts");
const { readBenyuanV3Store, saveUploadedAssetsWithCapacity } = await import("../src/lib/benyuan-v3-store.ts");

test.after(async () => {
  await rm(dataRoot, { recursive: true, force: true });
});

test("concurrent rate-limit increments cannot reuse the same counter", async () => {
  const attempts = await Promise.allSettled(
    Array.from({ length: 20 }, () => checkAuthRateLimit({ key: "concurrent", limit: 5, windowMs: 60_000 })),
  );
  assert.equal(attempts.filter((item) => item.status === "fulfilled").length, 5);
  assert.equal(attempts.filter((item) => item.status === "rejected").length, 15);
  const store = await readBenyuanV3Store();
  assert.equal(store.auth_rate_limits["beta:concurrent"]?.count, 20);
});

test("concurrent upload reservations cannot exceed the owner quota", async () => {
  const fixture = (assetId) => ({
    asset_id: assetId,
    question_id: "C2_precious_photo_analysis",
    owner_user_id: "usr_concurrent",
    data_cohort: "beta",
    data_environment: "test",
    name: `${assetId}.png`,
    size: 200 * 1024 * 1024,
    mime_type: "image/png",
    uploaded_at: "2026-07-10T00:00:00.000Z",
    stored_path: path.join(dataRoot, `${assetId}.png`),
  });
  const attempts = await Promise.allSettled([
    saveUploadedAssetsWithCapacity([fixture("upload_a")]),
    saveUploadedAssetsWithCapacity([fixture("upload_b")]),
  ]);

  assert.equal(attempts.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(attempts.filter((item) => item.status === "rejected").length, 1);
  const rejection = attempts.find((item) => item.status === "rejected");
  assert.equal(rejection?.reason?.code, "user_upload_quota_exceeded");
  const store = await readBenyuanV3Store();
  assert.equal(Object.keys(store.uploaded_assets).length, 1);
});
