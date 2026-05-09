import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { AgentRuntimeResult } from "@/lib/benyuan-v3-types";

const TIMING_PATH = path.join(process.cwd(), "data", "benyuan-agent-timings.jsonl");

export type BenyuanAgentStage = "multimodal" | "theater" | "constellation";

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
  recorded_at: string;
};

function percentile(sortedValues: number[], ratio: number) {
  if (sortedValues.length === 0) return null;
  const index = Math.ceil(sortedValues.length * ratio) - 1;
  return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, index))];
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
        return [
          stage,
          {
            count: stageEvents.length,
            p50_ms: percentile(durations, 0.5),
            p90_ms: percentile(durations, 0.9),
            max_ms: durations.at(-1) ?? null,
            live_count: stageEvents.filter((event) => event.runtime_mode === "live").length,
            fallback_count: stageEvents.filter((event) => event.runtime_mode === "fallback").length,
            latest: stageEvents.at(-1) ?? null,
          },
        ];
      }),
    ),
  };
}
