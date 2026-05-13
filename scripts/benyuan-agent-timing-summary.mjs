#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const timingPath = process.env.BENYUAN_AGENT_TIMING_FILE ?? path.join(process.cwd(), "data", "benyuan-agent-timings.jsonl");
const limit = Number(process.env.BENYUAN_AGENT_TIMING_LIMIT ?? 200);
const stages = ["multimodal", "theater", "constellation"];

function percentile(sortedValues, ratio) {
  if (sortedValues.length === 0) return null;
  const index = Math.ceil(sortedValues.length * ratio) - 1;
  return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, index))];
}

function seconds(value) {
  return value === null ? null : Number((value / 1000).toFixed(1));
}

function summarize(events) {
  return Object.fromEntries(stages.map((stage) => {
    const stageEvents = events.filter((event) => event.stage === stage);
    const durations = stageEvents.map((event) => Number(event.duration_ms)).filter(Number.isFinite).sort((left, right) => left - right);
    const coldDurations = stageEvents
      .filter((event) => event.cold_start)
      .map((event) => Number(event.duration_ms))
      .filter(Number.isFinite)
      .sort((left, right) => left - right);
    const cache_status_counts = stageEvents.reduce((counts, event) => {
      const status = event.cache_status ?? "unknown";
      counts[status] = (counts[status] ?? 0) + 1;
      return counts;
    }, {});
    const p50_ms = percentile(durations, 0.5);
    const p90_ms = percentile(durations, 0.9);
    const cold_p50_ms = percentile(coldDurations, 0.5);
    const cold_p90_ms = percentile(coldDurations, 0.9);
    return [
      stage,
      {
        count: stageEvents.length,
        p50_ms,
        p90_ms,
        cold_p50_ms,
        cold_p90_ms,
        p50_s: seconds(p50_ms),
        p90_s: seconds(p90_ms),
        cold_p50_s: seconds(cold_p50_ms),
        cold_p90_s: seconds(cold_p90_ms),
        max_ms: durations.at(-1) ?? null,
        cache_status_counts,
        live_count: stageEvents.filter((event) => event.runtime_mode === "live").length,
        fallback_count: stageEvents.filter((event) => event.runtime_mode === "fallback").length,
        latest: stageEvents.at(-1) ?? null,
      },
    ];
  }));
}

async function main() {
  const raw = await readFile(timingPath, "utf8").catch(() => "");
  const events = raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .slice(-limit)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });

  const payload = {
    timingPath,
    sampleCount: events.length,
    limit,
    stages: summarize(events),
  };

  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error("agent-timing-summary:fail", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
