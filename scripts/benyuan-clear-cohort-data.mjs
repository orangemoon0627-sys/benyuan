#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { registerHooks } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const targetPath = path.resolve("src", specifier.slice(2));
      const resolvedPath = existsSync(targetPath) ? targetPath : `${targetPath}.ts`;
      return nextResolve(pathToFileURL(resolvedPath).href, context);
    }

    return nextResolve(specifier, context);
  },
});

const cohort = process.argv.find((arg) => arg.startsWith("--cohort="))?.slice("--cohort=".length) ?? "beta";
const confirmed = process.argv.includes("--confirm-clear");
const allowed = new Set(["beta", "public", "local"]);

if (!allowed.has(cohort)) {
  console.error(`[benyuan-clear-cohort] invalid cohort: ${cohort}`);
  process.exit(1);
}

function resolveStorePath() {
  const configured = process.env.BENYUAN_V3_STORE_PATH?.trim();
  if (configured) return configured;
  return `${process.cwd()}/data/benyuan-v3-store.json`;
}

function recordCohort(record) {
  return record?.data_cohort ?? "beta";
}

function countMatching(store, key) {
  return Object.values(store?.[key] ?? {}).filter((record) => recordCohort(record) === cohort).length;
}

const storePath = resolveStorePath();
let store = {};
if (existsSync(storePath)) {
  store = JSON.parse(await readFile(storePath, "utf8"));
}

const preview = {
  cohort,
  confirmed,
  storePath,
  counts: {
    users: countMatching(store, "users"),
    authSessions: countMatching(store, "auth_sessions"),
    phoneOtps: countMatching(store, "phone_otps"),
    providerIndexes: countMatching(store, "auth_provider_index"),
    authRateLimits: countMatching(store, "auth_rate_limits"),
    uploadedAssets: countMatching(store, "uploaded_assets"),
    part1Records: countMatching(store, "part1_records"),
    theaterScripts: countMatching(store, "theater_scripts"),
    part2Records: countMatching(store, "part2_records"),
    constellations: countMatching(store, "constellations"),
    nativeGenerationJobs: countMatching(store, "native_generation_jobs"),
    feedbackRecords: countMatching(store, "feedback_records"),
  },
};

console.log(JSON.stringify(preview, null, 2));

if (!confirmed) {
  console.log("[benyuan-clear-cohort] dry-run only. Add --confirm-clear to delete this cohort.");
  process.exit(0);
}

const { clearBenyuanCohortData } = await import(pathToFileURL(`${process.cwd()}/src/lib/benyuan-v3-store.ts`));
const result = await clearBenyuanCohortData(cohort);
console.log(JSON.stringify({ ok: true, result }, null, 2));
