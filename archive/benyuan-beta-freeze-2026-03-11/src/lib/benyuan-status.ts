import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { readAnalysisRuntimeConfig } from "@/lib/analysis/config";
import { readBenyuanV3Store } from "@/lib/benyuan-v3-store";
import { readCodexProviderDefaults } from "@/lib/codex-runtime";

type StageRuntime = {
  provider?: string;
  model?: string;
  mode?: "live" | "fallback";
  request_id?: string;
  error?: string;
};

type BenchmarkEvent = {
  pack?: string;
  stage?: string;
  attempt?: number;
  mode?: string;
  error?: string | null;
  recordedAt?: string;
};

type BenchmarkResult = {
  pack: string;
  label?: string;
  ids?: {
    part1_id?: string;
    theater_script_id?: string;
    part2_id?: string;
    constellation_id?: string;
  };
  durations?: {
    upload?: number;
    part1_submit?: number;
    multimodal?: number;
    theater_generate?: number;
    part2_submit?: number;
    constellation_generate?: number;
    total?: number;
  };
  runtime?: {
    multimodal?: StageRuntime;
    theater?: StageRuntime;
    constellation?: StageRuntime;
  };
  archetype?: string;
  events?: BenchmarkEvent[];
};

type BenchmarkSnapshot = {
  filePath: string;
  fileName: string;
  generatedAt: string;
  selectedPacks: string[];
  results: BenchmarkResult[];
};

const OUTPUT_DIR = path.join(process.cwd(), "output");
const BENCHMARK_PREFIX = "benyuan-pack-benchmark";

function sortByGeneratedAt<T extends { generatedAt: string }>(items: T[]) {
  return [...items].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
}

function normalizeSelectedPacks(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeResults(value: unknown) {
  return Array.isArray(value) ? (value as BenchmarkResult[]) : [];
}

async function readBenchmarkSnapshot(fileName: string): Promise<BenchmarkSnapshot | null> {
  const filePath = path.join(OUTPUT_DIR, fileName);

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { generatedAt?: string; selectedPacks?: unknown; results?: unknown };
    if (typeof parsed.generatedAt !== "string") return null;

    return {
      filePath,
      fileName,
      generatedAt: parsed.generatedAt,
      selectedPacks: normalizeSelectedPacks(parsed.selectedPacks),
      results: normalizeResults(parsed.results),
    };
  } catch {
    return null;
  }
}

async function listBenchmarkSnapshots() {
  try {
    const files = await readdir(OUTPUT_DIR);
    const snapshots = await Promise.all(
      files
        .filter((file) => file.startsWith(BENCHMARK_PREFIX) && file.endsWith(".json"))
        .map((file) => readBenchmarkSnapshot(file)),
    );

    return sortByGeneratedAt(snapshots.filter((item): item is BenchmarkSnapshot => Boolean(item)));
  } catch {
    return [] as BenchmarkSnapshot[];
  }
}

function isFullBaseline(snapshot: BenchmarkSnapshot) {
  const packs = [...snapshot.selectedPacks].sort().join(",");
  return packs === "A,B,C";
}

function flattenEvents(snapshot: BenchmarkSnapshot | null) {
  if (!snapshot) return [] as Array<BenchmarkEvent & { generatedAt: string; fileName: string }>;
  return snapshot.results.flatMap((result) =>
    (result.events ?? []).map((event) => ({
      ...event,
      generatedAt: snapshot.generatedAt,
      fileName: snapshot.fileName,
    })),
  );
}

function inferFallbacks(snapshot: BenchmarkSnapshot | null) {
  if (!snapshot) return [] as Array<BenchmarkEvent & { generatedAt: string; fileName: string }>;

  return snapshot.results.flatMap((result) => {
    const stages = [
      { stage: "multimodal", runtime: result.runtime?.multimodal },
      { stage: "theater", runtime: result.runtime?.theater },
      { stage: "constellation", runtime: result.runtime?.constellation },
    ];

    return stages
      .filter((entry) => entry.runtime?.error)
      .map((entry) => ({
        pack: result.pack,
        stage: entry.stage,
        attempt: 1,
        mode: entry.runtime?.mode,
        error: entry.runtime?.error ?? null,
        recordedAt: snapshot.generatedAt,
        generatedAt: snapshot.generatedAt,
        fileName: snapshot.fileName,
      }));
  });
}

export async function getBenyuanStatusSnapshot() {
  const runtime = readAnalysisRuntimeConfig("deep", { provider: "custom" });
  const codexDefaults = readCodexProviderDefaults();
  const snapshots = await listBenchmarkSnapshots();
  const latestBenchmark = snapshots[0] ?? null;
  const latestFullBaseline = snapshots.find((snapshot) => isFullBaseline(snapshot)) ?? null;

  const store = await readBenyuanV3Store();
  const latestConstellationRecord = Object.values(store.constellations).sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })[0];

  const recentFallbackEvents = [
    ...flattenEvents(latestBenchmark),
    ...inferFallbacks(latestBenchmark),
  ].filter((event) => event.error).sort((a, b) => {
    return new Date(b.recordedAt ?? b.generatedAt).getTime() - new Date(a.recordedAt ?? a.generatedAt).getTime();
  });

  return {
    runtime: {
      provider: runtime.customProviderName ?? codexDefaults.providerName ?? "custom",
      model: runtime.customModel ?? codexDefaults.model ?? "gpt-5.4",
      baseUrl: runtime.customBaseUrl ?? codexDefaults.baseUrl ?? null,
      liveProviderEnabled: runtime.liveProviderEnabled || Boolean(codexDefaults.apiKey && codexDefaults.baseUrl),
      softTimeoutMs: runtime.providerSoftTimeoutMs,
      wireApi: codexDefaults.wireApi ?? "responses",
      source: codexDefaults.apiKey && codexDefaults.baseUrl ? "codex-config" : "environment",
      apiKeyConfigured: runtime.customKeyConfigured || Boolean(codexDefaults.apiKey),
    },
    latestBenchmark,
    latestFullBaseline,
    latestConstellation: latestConstellationRecord
      ? {
          constellationId: latestConstellationRecord.constellation_id,
          archetype: latestConstellationRecord.psyche_constellation.archetype.name,
          createdAt: latestConstellationRecord.created_at,
          runtime: latestConstellationRecord.runtime,
        }
      : null,
    recentFallback: recentFallbackEvents[0] ?? null,
  };
}
