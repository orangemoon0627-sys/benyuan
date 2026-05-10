#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readRequired(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const persistence = readRequired("src/lib/benyuan-persistence.ts");
const store = readRequired("src/lib/benyuan-v3-store.ts");
const assets = readRequired("src/lib/benyuan-v3-assets.ts");
const runtimeRoute = readRequired("src/app/api/agent/runtime/route.ts");
const deploy = readRequired("scripts/deploy-staging.sh");
const backupStagingData = readRequired("scripts/backup-staging-data.sh");
const packageJson = readRequired("package.json");

assert.match(persistence, /BENYUAN_DATA_ROOT/, "persistence module must support an explicit server data root");
assert.match(persistence, /BENYUAN_V3_STORE_PATH/, "persistence module must keep store path override support");
assert.match(persistence, /BENYUAN_V3_UPLOADS_DIR/, "persistence module must support an explicit uploads directory");
assert.match(persistence, /BENYUAN_PERSISTENCE_BACKEND/, "persistence module must expose the configured record-store backend");
assert.match(persistence, /BENYUAN_DATABASE_URL/, "persistence module must detect whether a production database is configured");
assert.match(persistence, /BENYUAN_OBJECT_STORAGE_BACKEND/, "persistence module must expose the configured uploaded-asset backend");
assert.match(persistence, /BENYUAN_OBJECT_STORAGE_BUCKET/, "persistence module must detect whether production object storage is configured");
assert.match(persistence, /getBenyuanV3StorePath/, "persistence module must expose the resolved store path");
assert.match(persistence, /getBenyuanV3UploadsDir/, "persistence module must expose the resolved uploads directory");
assert.match(persistence, /getBenyuanPersistenceHealth/, "persistence module must expose storage health");
assert.match(persistence, /readBenyuanPersistenceReadiness/, "persistence module must expose production migration readiness");
assert.match(persistence, /summarizeBenyuanStoreCounts/, "persistence health must summarize user/history counts without returning raw records");

assert.match(store, /getBenyuanV3StorePath/, "store must use the shared persistence path resolver");
assert.match(store, /getBenyuanV3StoreHealth/, "store must expose user/history storage health");
assert.match(assets, /getBenyuanV3UploadsDir/, "asset storage must use the shared persistence uploads resolver");

assert.match(deploy, /BENYUAN_DATA_ROOT=.*shared\/data/, "deploy must pin runtime data to the persistent shared data directory");
assert.match(runtimeRoute, /getBenyuanV3StoreHealth/, "runtime route must expose sanitized persistence health for staging checks");
assert.match(runtimeRoute, /readBenyuanPersistenceReadiness/, "runtime route must expose sanitized migration readiness for staging checks");
assert.match(packageJson, /backup:staging:data/, "package scripts must expose a staging data backup command");
assert.match(packageJson, /smoke:persistence:contract/, "package scripts must expose the persistence contract smoke");
assert.match(backupStagingData, /tar -czf - -C (?:\\")?"?\$shared_root(?:\\")?"?/, "staging backup must archive shared data from the server without running app builds");
assert.match(backupStagingData, /shasum -a 256/, "staging backup must write a checksum for the shared data archive");
assert.match(backupStagingData, /benyuan-v3-store\.json/, "staging backup must explicitly verify the JSON store is present in the archive");

console.log("persistence-contract:ok");
