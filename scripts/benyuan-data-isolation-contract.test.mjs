import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sources = {
  auth: await readFile("src/lib/benyuan-auth.ts", "utf8"),
  assets: await readFile("src/lib/benyuan-v3-assets.ts", "utf8"),
  types: await readFile("src/lib/benyuan-v3-types.ts", "utf8"),
  store: await readFile("src/lib/benyuan-v3-store.ts", "utf8"),
  uploadRoute: await readFile("src/app/api/part1/upload/route.ts", "utf8"),
  uploadedRoute: await readFile("src/app/api/part1/uploaded/[assetId]/route.ts", "utf8"),
  part1SubmitRoute: await readFile("src/app/api/part1/submit/route.ts", "utf8"),
  theaterRoute: await readFile("src/app/api/theater/generate/route.ts", "utf8"),
  part2SubmitRoute: await readFile("src/app/api/part2/submit/route.ts", "utf8"),
  constellationRoute: await readFile("src/app/api/constellation/generate/route.ts", "utf8"),
  imageRoute: await readFile("src/app/api/image/generate/route.ts", "utf8"),
  multimodalRoute: await readFile("src/app/api/analyze/multimodal/route.ts", "utf8"),
  feedbackRoute: await readFile("src/app/api/account/feedback/route.ts", "utf8"),
  packageJson: await readFile("package.json", "utf8"),
};

test("uploaded assets require auth on write and owner-scoped reads", () => {
  assert.match(sources.uploadRoute, /getRequiredBenyuanAuthSession|requireBenyuanAuth|assertBenyuanAuth/, "upload route must require an authenticated session");
  assert.match(sources.uploadRoute, /ownerUserId:\s*auth\.user\.user_id/, "uploaded asset persistence must bind owner user_id");
  assert.match(sources.assets, /ownerUserId:\s*string/, "persistUploadedAsset must require an ownerUserId");
  assert.match(sources.types, /owner_user_id:\s*string/, "stored asset type must include required owner_user_id");
  assert.match(sources.uploadedRoute, /readUploadedAssetBufferForOwner/, "download route must use owner-scoped asset reader");
  assert.doesNotMatch(sources.uploadedRoute, /readUploadedAssetBuffer\(assetId\)/, "download route must not read by public assetId only");
});

test("part1 owner checks default secure outside explicit local fallback", () => {
  assert.match(sources.auth, /allowBenyuanLocalAuthFallback/, "auth module must expose an explicit local fallback gate");
  assert.match(sources.auth, /BENYUAN_ALLOW_LOCAL_AUTH_FALLBACK/, "local fallback must be controlled by environment");
  assert.match(sources.auth, /auth_required/, "missing auth must fail by default");
  assert.match(sources.part1SubmitRoute, /getRequiredBenyuanAuthSession|requireBenyuanAuth|assertBenyuanAuth/, "part1 submit must require auth or explicit fallback");
  assert.doesNotMatch(sources.part1SubmitRoute, /auth\?\.user\.user_id\s*\?\?\s*body\.user_id\s*\?\?\s*"usr_local"/, "part1 submit must not silently fall back to request body or usr_local");

  for (const [name, source] of Object.entries({
    theaterRoute: sources.theaterRoute,
    part2SubmitRoute: sources.part2SubmitRoute,
    constellationRoute: sources.constellationRoute,
    multimodalRoute: sources.multimodalRoute,
  })) {
    assert.match(source, /assertPart1Owner/, `${name} must keep part1 owner assertion`);
  }
});

test("records carry structured cohort/environment boundaries and clear helper", () => {
  assert.match(sources.types, /export type BenyuanDataCohort/, "types must define BenyuanDataCohort");
  for (const typeName of [
    "BenyuanUser",
    "BenyuanAuthSession",
    "BenyuanPhoneOtp",
    "BenyuanAuthProviderIndex",
    "BenyuanAuthRateLimit",
    "Part1Record",
    "TheaterScriptRecord",
    "Part2Record",
    "ConstellationRecord",
    "BenyuanNativeGenerationJob",
    "BenyuanFeedbackRecord",
  ]) {
    assert.match(
      sources.types,
      new RegExp(`export type ${typeName}[\\s\\S]*?data_cohort:\\s*BenyuanDataCohort[\\s\\S]*?data_environment:\\s*BenyuanDataEnvironment`),
      `${typeName} must carry data cohort and environment`,
    );
  }
  assert.match(sources.types, /data_cohort:\s*BenyuanDataCohort/, "Part1Record must include data_cohort");
  assert.match(sources.types, /data_environment:\s*BenyuanDataEnvironment/, "Part1Record must include data_environment");
  assert.match(sources.types, /BenyuanUploadedAssetRef[\s\S]*data_cohort:\s*BenyuanDataCohort/, "uploaded asset refs must include data_cohort");
  assert.match(sources.types, /BenyuanStoredAsset\s*=\s*BenyuanUploadedAssetRef\s*&/, "stored assets must inherit uploaded asset data scope");
  assert.match(sources.store, /resolveBenyuanDataScope/, "store must provide a reusable data scope resolver");
  assert.match(sources.store, /storedBenyuanDataScope[\s\S]*data_cohort:\s*record\.data_cohort\s*\?\?\s*"beta"/, "legacy unscoped records must default to beta instead of drifting into public");
  assert.match(sources.store, /`\$\{userScope\.data_cohort\}:\$\{provider\}:\$\{providerSubject\}`/, "auth provider index must be cohort scoped");
  assert.match(sources.store, /getAuthSessionByToken[\s\S]*currentScope[\s\S]*data_cohort/, "session reads must reject tokens from another cohort");
  assert.match(sources.store, /clearBenyuanCohortData/, "store must expose a cohort clearing helper");
  assert.match(sources.store, /store\.users[\s\S]*cohortForClear/, "cohort clearing must remove users");
  assert.match(sources.store, /store\.auth_sessions[\s\S]*cohortForClear/, "cohort clearing must remove auth sessions");
  assert.match(sources.store, /store\.theater_scripts[\s\S]*cohortForClear/, "cohort clearing must remove theater scripts");
  assert.match(sources.store, /store\.part2_records[\s\S]*cohortForClear/, "cohort clearing must remove theater choices");
  assert.match(sources.store, /store\.constellations[\s\S]*cohortForClear/, "cohort clearing must remove constellation records");
  assert.match(sources.store, /store\.feedback_records[\s\S]*cohortForClear/, "cohort clearing must remove feedback records");
  assert.match(sources.part1SubmitRoute, /resolveBenyuanDataScope/, "part1 submit must stamp data scope");
  assert.match(sources.feedbackRoute, /resolveBenyuanDataScope/, "feedback submit must stamp data scope");
  assert.match(sources.packageJson, /maintenance:clear-cohort:dry/, "package scripts must expose a dry-run cohort clear command");
  assert.match(sources.packageJson, /maintenance:clear-beta/, "package scripts must expose an explicit beta clear command");
});

test("mutable constellation image updates require account ownership", () => {
  assert.match(sources.imageRoute, /getCurrentAuthSession/, "image update route must require auth");
  assert.match(sources.imageRoute, /getPart1Record/, "image update route must load owning part1");
  assert.match(sources.imageRoute, /part1\.user_id\s*!==\s*auth\.user\.user_id/, "image update route must reject cross-account writes");
});
