#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readRequired(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const packageJson = readRequired("package.json");
const types = readRequired("src/lib/benyuan-v3-types.ts");
const assets = readRequired("src/lib/benyuan-v3-assets.ts");
const agent = readRequired("src/lib/benyuan-v3-agent.ts");
const uploadRoute = readRequired("src/app/api/part1/upload/route.ts");
const nativeStore = readRequired("src/lib/benyuan-v3-store.ts");
const cache = readRequired("src/lib/benyuan-multimodal-cache.ts");
const prewarm = readRequired("src/lib/benyuan-multimodal-prewarm.ts");

assert.match(packageJson, /smoke:multimodal:optimization/, "package scripts must expose the multimodal optimization smoke");

assert.match(types, /sha256\?:\s*string/, "uploaded asset refs must carry optional sha256 for cache keys");
assert.match(assets, /createHash/, "asset persistence must compute content hashes");
assert.match(assets, /sha256:\s*createHash\("sha256"\)/, "asset persistence should store a sha256 hash at upload time");
assert.match(assets, /ensureStoredAssetHash/, "old uploads without hashes should be hashable at read time");

assert.match(cache, /getBenyuanMultimodalCachePath/, "multimodal cache must live outside the main v3 store");
assert.match(cache, /readCachedMultimodalAnalysis/, "multimodal cache must support reads");
assert.match(cache, /writeCachedMultimodalAnalysis/, "multimodal cache must support writes");
assert.match(cache, /makeMultimodalCacheKey/, "multimodal cache must derive stable per-stage keys");

assert.match(agent, /runParallelMultimodalAnalysis/, "multimodal analysis must have an explicit parallel coordinator");
assert.match(agent, /Promise\.all\(/, "multimodal stage analysis should run independent stages concurrently");
assert.match(agent, /readCachedMultimodalAnalysis/, "multimodal analysis should read per-stage cache entries");
assert.match(agent, /writeCachedMultimodalAnalysis/, "multimodal analysis should write per-stage cache entries");
assert.match(agent, /runMultimodalStageAnalysis/, "multimodal analysis should expose focused per-stage execution");
assert.match(agent, /resolveMultimodalAssetHashes/, "cache keys should include all uploaded asset hashes for that stage");
assert.match(agent, /hashes\.join\("\+"\)/, "multi-image stages should not cache only the first uploaded image");
assert.match(agent, /multimodal_stage_cache_hit/, "runtime metadata should reveal cache hits without changing the public route");

assert.match(prewarm, /prewarmUploadedAssetMultimodalAnalysis/, "upload-time prewarm helper must exist");
assert.match(prewarm, /void runMultimodalStageAnalysis/, "prewarm should fire focused stage analysis without blocking upload");
assert.match(uploadRoute, /prewarmUploadedAssetMultimodalAnalysis/, "upload route must trigger multimodal prewarm");

assert.match(nativeStore, /runMultimodalAnalysis/, "native generation job must keep the public multimodal entry point");

console.log("multimodal-optimization-contract:ok");
