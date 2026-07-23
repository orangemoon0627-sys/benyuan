import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getBenyuanDataRoot } from "@/lib/benyuan-persistence";
import type { AgentRuntimeResult, BenyuanDataCohort } from "@/lib/benyuan-v3-types";

export type BenyuanMultimodalStageKind = "music" | "social" | "photo";

type CachedMultimodalAnalysis = {
  cache_key: string;
  kind: BenyuanMultimodalStageKind;
  asset_hash: string;
  prompt_version: string;
  provider: string;
  model: string;
  data_cohort?: BenyuanDataCohort;
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
export const MULTIMODAL_STAGE_PROMPT_VERSION = "v4-behavioral-evidence-2026-07-17";

let writeQueue = Promise.resolve();

function currentDataCohort(): BenyuanDataCohort {
  const value = process.env.BENYUAN_DATA_COHORT;
  return value === "public" || value === "local" ? value : "beta";
}

export function getBenyuanMultimodalCachePath() {
  return path.join(getBenyuanDataRoot(), "benyuan-multimodal-cache.json");
}

export function makeMultimodalCacheKey(params: {
  kind: BenyuanMultimodalStageKind;
  assetHash: string;
  provider: string;
  model: string;
  dataCohort?: BenyuanDataCohort;
  promptVersion?: string;
}) {
  return [
    params.dataCohort ?? currentDataCohort(),
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
  if (!entry || entry.prompt_version !== MULTIMODAL_STAGE_PROMPT_VERSION) return null;
  return entry as CachedMultimodalAnalysis & { result: T };
}

export async function writeCachedMultimodalAnalysis(params: {
  cacheKey: string;
  kind: BenyuanMultimodalStageKind;
  assetHash: string;
  provider: string;
  model: string;
  dataCohort?: BenyuanDataCohort;
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
      data_cohort: params.dataCohort ?? currentDataCohort(),
      result: params.result,
      runtime: params.runtime,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    await writeCacheFile(cache);
  });
  await writeQueue;
}

export async function clearCachedMultimodalAnalysisForCohort(cohort: BenyuanDataCohort) {
  let deletedEntries = 0;
  writeQueue = writeQueue.then(async () => {
    const cache = await readCacheFile();
    for (const [key, entry] of Object.entries(cache.entries)) {
      if ((entry.data_cohort ?? "beta") !== cohort) continue;
      delete cache.entries[key];
      deletedEntries += 1;
    }
    await writeCacheFile(cache);
  });
  await writeQueue;
  return deletedEntries;
}
