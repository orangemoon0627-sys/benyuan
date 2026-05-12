import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getBenyuanDataRoot } from "@/lib/benyuan-persistence";
import type { AgentRuntimeResult } from "@/lib/benyuan-v3-types";

export type BenyuanMultimodalStageKind = "music" | "social" | "photo";

type CachedMultimodalAnalysis = {
  cache_key: string;
  kind: BenyuanMultimodalStageKind;
  asset_hash: string;
  prompt_version: string;
  provider: string;
  model: string;
  result: unknown;
  runtime: AgentRuntimeResult;
  created_at: string;
  updated_at: string;
};

type MultimodalCacheFile = {
  version: 1;
  entries: Record<string, CachedMultimodalAnalysis>;
};

const CACHE_VERSION = 1;
export const MULTIMODAL_STAGE_PROMPT_VERSION = "v1-parallel-stage-2026-05-12";

let writeQueue = Promise.resolve();

export function getBenyuanMultimodalCachePath() {
  return path.join(getBenyuanDataRoot(), "benyuan-multimodal-cache.json");
}

export function makeMultimodalCacheKey(params: {
  kind: BenyuanMultimodalStageKind;
  assetHash: string;
  provider: string;
  model: string;
  promptVersion?: string;
}) {
  return [
    params.kind,
    params.assetHash,
    params.provider,
    params.model,
    params.promptVersion ?? MULTIMODAL_STAGE_PROMPT_VERSION,
  ].join(":");
}

async function readCacheFile(): Promise<MultimodalCacheFile> {
  try {
    const raw = await readFile(getBenyuanMultimodalCachePath(), "utf8");
    const parsed = JSON.parse(raw) as MultimodalCacheFile;
    return {
      version: CACHE_VERSION,
      entries: parsed.entries && typeof parsed.entries === "object" ? parsed.entries : {},
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return { version: CACHE_VERSION, entries: {} };
    }
    throw error;
  }
}

async function writeCacheFile(cache: MultimodalCacheFile) {
  const cachePath = getBenyuanMultimodalCachePath();
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
}

export async function readCachedMultimodalAnalysis<T>(cacheKey: string) {
  const cache = await readCacheFile();
  const entry = cache.entries[cacheKey];
  if (!entry) return null;
  return entry as CachedMultimodalAnalysis & { result: T };
}

export async function writeCachedMultimodalAnalysis(params: {
  cacheKey: string;
  kind: BenyuanMultimodalStageKind;
  assetHash: string;
  provider: string;
  model: string;
  result: unknown;
  runtime: AgentRuntimeResult;
}) {
  const now = new Date().toISOString();
  writeQueue = writeQueue.then(async () => {
    const cache = await readCacheFile();
    const existing = cache.entries[params.cacheKey];
    cache.entries[params.cacheKey] = {
      cache_key: params.cacheKey,
      kind: params.kind,
      asset_hash: params.assetHash,
      prompt_version: MULTIMODAL_STAGE_PROMPT_VERSION,
      provider: params.provider,
      model: params.model,
      result: params.result,
      runtime: params.runtime,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    await writeCacheFile(cache);
  });
  await writeQueue;
}
