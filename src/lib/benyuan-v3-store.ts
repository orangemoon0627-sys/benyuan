import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BenyuanStoredAsset, BenyuanV3Store, ConstellationRecord, Part1Record, Part2Record, TheaterScriptRecord } from "@/lib/benyuan-v3-types";
import { normalizePsycheConstellation } from "@/lib/benyuan-v3-normalization";
import { isSuspiciousArchetypeName } from "@/lib/benyuan-v3-report-profile";
import { generateDeterministicConstellation } from "@/lib/benyuan-v3-engine";

const STORE_PATH = path.join(process.cwd(), "data", "benyuan-v3-store.json");
const TEMP_STORE_PATH = `${STORE_PATH}.tmp`;

const EMPTY_STORE: BenyuanV3Store = {
  uploaded_assets: {},
  part1_records: {},
  theater_scripts: {},
  part2_records: {},
  constellations: {},
};

let storeWriteQueue: Promise<void> = Promise.resolve();

function recommendationKey(item: { title?: string; author?: string; director?: string; artist?: string; album?: string }) {
  return [item.title, item.author, item.director, item.artist, item.album].filter(Boolean).join("::").toLocaleLowerCase("zh-CN");
}

function supplementRecommendations(preferred: ConstellationRecord["psyche_constellation"]["recommendations"], fallback: ConstellationRecord["psyche_constellation"]["recommendations"]) {
  const mergeItems = <T extends { title?: string; author?: string; director?: string; artist?: string; album?: string }>(items: T[], backup: T[], minCount: number) => {
    const next = [...items];
    const seen = new Set(next.map((item) => recommendationKey(item)));

    for (const item of backup) {
      const key = recommendationKey(item);
      if (seen.has(key)) continue;
      next.push(item);
      seen.add(key);
      if (next.length >= minCount) break;
    }

    return next;
  };

  return {
    books: mergeItems(preferred.books, fallback.books, Math.min(3, fallback.books.length || 2)),
    films: mergeItems(preferred.films, fallback.films, Math.min(3, fallback.films.length || 2)),
    music: mergeItems(preferred.music, fallback.music, Math.min(3, fallback.music.length || 2)),
  };
}

function supplementGrowthSuggestions(preferred: ConstellationRecord["psyche_constellation"]["growth_suggestions"], fallback: ConstellationRecord["psyche_constellation"]["growth_suggestions"]) {
  const next = [...preferred];
  const seen = new Set(next.map((item) => item.title.trim().toLocaleLowerCase("zh-CN")));

  for (const item of fallback) {
    const key = item.title.trim().toLocaleLowerCase("zh-CN");
    if (seen.has(key)) continue;
    next.push(item);
    seen.add(key);
    if (next.length >= 3) break;
  }

  return next;
}


function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

async function ensureStoreFile() {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await readFile(STORE_PATH, "utf8");
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2), "utf8");
  }
}

function mergeStore(raw: Partial<BenyuanV3Store> | null | undefined): BenyuanV3Store {
  return {
    uploaded_assets: raw?.uploaded_assets ?? {},
    part1_records: raw?.part1_records ?? {},
    theater_scripts: raw?.theater_scripts ?? {},
    part2_records: raw?.part2_records ?? {},
    constellations: raw?.constellations ?? {},
  };
}

async function parseStoreFile() {
  await ensureStoreFile();
  const raw = await readFile(STORE_PATH, "utf8");

  try {
    return mergeStore(JSON.parse(raw) as Partial<BenyuanV3Store>);
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2), "utf8");
    return { ...EMPTY_STORE };
  }
}

async function withStoreWrite<T>(updater: (store: BenyuanV3Store) => T | Promise<T>) {
  let result: T;

  storeWriteQueue = storeWriteQueue.then(async () => {
    const store = await parseStoreFile();
    result = await updater(store);
    await writeFile(TEMP_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
    await rename(TEMP_STORE_PATH, STORE_PATH);
  });

  await storeWriteQueue;
  return result!;
}

export async function readBenyuanV3Store() {
  await storeWriteQueue;
  return parseStoreFile();
}

export function createBenyuanV3Id(prefix: "upload" | "part1" | "theater" | "part2" | "const") {
  return uid(prefix);
}

export async function saveUploadedAsset(asset: BenyuanStoredAsset) {
  return withStoreWrite((store) => {
    store.uploaded_assets[asset.asset_id] = asset;
    return asset;
  });
}

export async function getUploadedAsset(assetId: string) {
  const store = await readBenyuanV3Store();
  return store.uploaded_assets[assetId];
}

export async function savePart1Record(record: Part1Record) {
  return withStoreWrite((store) => {
    store.part1_records[record.part1_id] = record;
    return record;
  });
}

export async function getPart1Record(part1Id: string) {
  const store = await readBenyuanV3Store();
  return store.part1_records[part1Id];
}

export async function saveTheaterScriptRecord(record: TheaterScriptRecord) {
  return withStoreWrite((store) => {
    store.theater_scripts[record.theater_script_id] = record;
    return record;
  });
}

export async function getTheaterScriptRecord(theaterScriptId: string) {
  const store = await readBenyuanV3Store();
  return store.theater_scripts[theaterScriptId];
}

export async function savePart2Record(record: Part2Record) {
  return withStoreWrite((store) => {
    store.part2_records[record.part2_id] = record;
    return record;
  });
}

export async function getPart2Record(part2Id: string) {
  const store = await readBenyuanV3Store();
  return store.part2_records[part2Id];
}

export async function saveConstellationRecord(record: ConstellationRecord) {
  return withStoreWrite((store) => {
    store.constellations[record.constellation_id] = record;
    return record;
  });
}

export async function getConstellationRecord(constellationId: string) {
  const store = await readBenyuanV3Store();
  const record = store.constellations[constellationId];
  if (!record) return undefined;

  let normalized = normalizePsycheConstellation(record.psyche_constellation);
  const part1 = store.part1_records[record.part1_id];
  const part2 = store.part2_records[record.part2_id];

  if (part1) {
    const fallback = generateDeterministicConstellation(part1, part2);
    const recommendationTotal = normalized.recommendations.books.length + normalized.recommendations.films.length + normalized.recommendations.music.length;
    const hasGenericTensions =
      normalized.core_tensions.length >= 2 &&
      normalized.core_tensions[0]?.name === "独立性与连接需求的张力" &&
      normalized.core_tensions[1]?.name === "意义追寻与现实节奏的张力";
    const narrativeParagraphs = normalized.narrative_overview.split(/\n\n+/).filter((item) => item.trim().length > 0);

    normalized = normalizePsycheConstellation({
      ...normalized,
      archetype: isSuspiciousArchetypeName(normalized.archetype.name) ? fallback.archetype : normalized.archetype,
      narrative_overview: normalized.narrative_overview.trim().length < 420 || narrativeParagraphs.length < 4
        ? fallback.narrative_overview
        : normalized.narrative_overview,
      recommendations: recommendationTotal < 6 ? fallback.recommendations : supplementRecommendations(normalized.recommendations, fallback.recommendations),
      core_tensions: hasGenericTensions || normalized.core_tensions.length < 2 ? fallback.core_tensions : normalized.core_tensions,
      growth_suggestions: normalized.growth_suggestions.length < 3
        ? supplementGrowthSuggestions(normalized.growth_suggestions, fallback.growth_suggestions)
        : normalized.growth_suggestions,
    });
  }

  return {
    ...record,
    psyche_constellation: normalized,
  };
}
