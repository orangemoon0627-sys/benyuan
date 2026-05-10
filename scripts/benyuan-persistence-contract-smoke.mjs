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
const packageJson = readRequired("package.json");

assert.match(persistence, /BENYUAN_DATA_ROOT/, "persistence module must support an explicit server data root");
assert.match(persistence, /BENYUAN_V3_STORE_PATH/, "persistence module must keep store path override support");
assert.match(persistence, /BENYUAN_V3_UPLOADS_DIR/, "persistence module must support an explicit uploads directory");
assert.match(persistence, /getBenyuanV3StorePath/, "persistence module must expose the resolved store path");
assert.match(persistence, /getBenyuanV3UploadsDir/, "persistence module must expose the resolved uploads directory");
assert.match(persistence, /getBenyuanPersistenceHealth/, "persistence module must expose storage health");
assert.match(persistence, /summarizeBenyuanStoreCounts/, "persistence health must summarize user/history counts without returning raw records");

assert.match(store, /getBenyuanV3StorePath/, "store must use the shared persistence path resolver");
assert.match(store, /getBenyuanV3StoreHealth/, "store must expose user/history storage health");
assert.match(assets, /getBenyuanV3UploadsDir/, "asset storage must use the shared persistence uploads resolver");

assert.match(deploy, /BENYUAN_DATA_ROOT=.*shared\/data/, "deploy must pin runtime data to the persistent shared data directory");
assert.match(runtimeRoute, /getBenyuanV3StoreHealth/, "runtime route must expose sanitized persistence health for staging checks");
assert.match(packageJson, /smoke:persistence:contract/, "package scripts must expose the persistence contract smoke");

console.log("persistence-contract:ok");
