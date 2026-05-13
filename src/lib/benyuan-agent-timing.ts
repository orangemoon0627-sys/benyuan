import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { AgentRuntimeResult } from "@/lib/benyuan-v3-types";

const TIMING_PATH = path.join(process.cwd(), "data", "benyuan-agent-timings.jsonl");

export type BenyuanAgentStage = "multimodal" | "theater" | "constellation";
export type BenyuanMultimodalTimingStage = "music" | "social" | "photo";
export type BenyuanMultimodalCacheStatus = "cold" | "partial_cache_hit" | "cache_hit" | "no_assets";

export type BenyuanMultimodalCacheTiming = {
  cache_status: BenyuanMultimodalCacheStatus;
  cold_start: boolean;
  cache_hit_stages: BenyuanMultimodalTimingStage[];
  cache_miss_stages: BenyuanMultimodalTimingStage[];
  asset_count: number;
};

export type BenyuanAgentTimingEvent = {
  stage: BenyuanAgentStage;
  duration_ms: number;
  runtime_mode: AgentRuntimeResult["mode"];
  provider: string;
  model: string;
  error?: string;
  part1_id?: string;
  part2_id?: string;
  request_id?: string;
  cache_status?: BenyuanMultimodalCacheStatus;
  cold_start?: boolean;
  cache_hit_stages?: BenyuanMultimodalTimingStage[];
  cache_miss_stages?: BenyuanMultimodalTimingStage[];
  asset_count?: number;
  recorded_at: string;
};

function percentile(sortedValues: number[], ratio: number) {
  if (sortedValues.length === 0) return null;
  const index = Math.ceil(sortedValues.length * ratio) - 1;
  return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, index))];
}

function uniqueTimingStages(stages: string[]) {
  const valid = new Set<BenyuanMultimodalTimingStage>(["music", "social", "photo"]);
  return Array.from(new Set(stages.filter((stage): stage is BenyuanMultimodalTimingStage => valid.has(stage as BenyuanMultimodalTimingStage))));
}

export function classifyBenyuanMultimodalCacheStatus(
  runtimeError: string | undefined,
  assetCounts: Partial<Record<BenyuanMultimodalTimingStage, number>> = {},
): BenyuanMultimodalCacheTiming {
  const stages: BenyuanMultimodalTimingStage[] = ["music", "social", "photo"];
  const activeStages = stages.filter((stage) => Math.max(0, assetCounts[stage] ?? 0) > 0);
  const asset_count = stages.reduce((total, stage) => total + Math.max(0, assetCounts[stage] ?? 0), 0);
  const cacheMatch = runtimeError?.match(/multimodal_stage_cache_hit:([a-z,]+)/);
  const cache_hit_stages = uniqueTimingStages(
    cacheMatch?.[1]
      ?.split(",")
      .map((stage) => stage.trim())
      .filter(Boolean) ?? [],
  ).filter((stage) => activeStages.includes(stage));
  const cache_miss_stages = activeStages.filter((stage) => !cache_hit_stages.includes(stage));

  if (activeStages.length === 0) {
    return {
      cache_status: "no_assets",
      cold_start: false,
      cache_hit_stages: [],
      cache_miss_stages: [],
      asset_count,
    };
  }

  const cache_status: BenyuanMultimodalCacheStatus =
    cache_hit_stages.length === activeStages.length
      ? "cache_hit"
      : cache_hit_stages.length > 0
        ? "partial_cache_hit"
        : "cold";

  return {
    cache_status,
    cold_start: cache_miss_stages.length > 0,
    cache_hit_stages,
    cache_miss_stages,
    asset_count,
  };
}

export async function recordBenyuanAgentTiming(event: Omit<BenyuanAgentTimingEvent, "recorded_at">) {
  await mkdir(path.dirname(TIMING_PATH), { recursive: true });
  const payload: BenyuanAgentTimingEvent = {
    ...event,
    duration_ms: Math.max(0, Math.round(event.duration_ms)),
    recorded_at: new Date().toISOString(),
  };
  await appendFile(TIMING_PATH, `${JSON.stringify(payload)}\n`, "utf8");
  return payload;
}

export async function readBenyuanAgentTimingEvents(limit = 200) {
  try {
    const raw = await readFile(TIMING_PATH, "utf8");
    const lines = raw.trim().split("\n").filter(Boolean).slice(-limit);
    return lines.flatMap((line) => {
      try {
        return [JSON.parse(line) as BenyuanAgentTimingEvent];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

export async function summarizeBenyuanAgentTimings(limit = 200) {
  const events = await readBenyuanAgentTimingEvents(limit);
  const stages: BenyuanAgentStage[] = ["multimodal", "theater", "constellation"];

  return {
    sampleCount: events.length,
    limit,
    stages: Object.fromEntries(
      stages.map((stage) => {
        const stageEvents = events.filter((event) => event.stage === stage);
        const durations = stageEvents.map((event) => event.duration_ms).sort((left, right) => left - right);
        const coldDurations = stageEvents
          .filter((event) => event.cold_start)
          .map((event) => event.duration_ms)
          .sort((left, right) => left - right);
        const cacheStatusCounts = stageEvents.reduce<Record<string, number>>((counts, event) => {
          const status = event.cache_status ?? "unknown";
          counts[status] = (counts[status] ?? 0) + 1;
          return counts;
        }, {});
        return [
          stage,
          {
            count: stageEvents.length,
            p50_ms: percentile(durations, 0.5),
            p90_ms: percentile(durations, 0.9),
            cold_p50_ms: percentile(coldDurations, 0.5),
            cold_p90_ms: percentile(coldDurations, 0.9),
            max_ms: durations.at(-1) ?? null,
            cache_status_counts: cacheStatusCounts,
            live_count: stageEvents.filter((event) => event.runtime_mode === "live").length,
            fallback_count: stageEvents.filter((event) => event.runtime_mode === "fallback").length,
            latest: stageEvents.at(-1) ?? null,
          },
        ];
      }),
    ),
  };
}
