import { NextResponse } from "next/server";
import { recordBenyuanAgentTiming } from "@/lib/benyuan-agent-timing";

export async function agentRouteErrorResponse(input: {
  error: unknown;
  stage: "theater" | "constellation";
  part1Id?: string;
  part2Id?: string;
  startedAt?: number;
}) {
  const durationMs = typeof input.startedAt === "number" ? Math.max(0, Date.now() - input.startedAt) : 0;
  const errorName = input.error instanceof Error ? input.error.name : "UnknownError";
  const errorMessage = input.error instanceof Error ? input.error.message.slice(0, 500) : "agent_generation_failed";

  console.error(JSON.stringify({
    event: "benyuan_agent_generation_failed",
    stage: input.stage,
    part1_id: input.part1Id,
    part2_id: input.part2Id,
    duration_ms: durationMs,
    error_name: errorName,
    error_message: errorMessage,
  }));

  try {
    await recordBenyuanAgentTiming({
      stage: input.stage,
      duration_ms: durationMs,
      runtime_mode: "failure",
      provider: "unknown",
      model: "unknown",
      error: "unhandled_generation_error",
      part1_id: input.part1Id,
      part2_id: input.part2Id,
    });
  } catch (timingError) {
    console.error(JSON.stringify({
      event: "benyuan_agent_failure_timing_write_failed",
      stage: input.stage,
      error_name: timingError instanceof Error ? timingError.name : "UnknownError",
    }));
  }

  return NextResponse.json(
    {
      error: "agent_generation_failed",
      stage: input.stage,
      part1_id: input.part1Id,
      part2_id: input.part2Id,
      duration_ms: durationMs,
    },
    { status: 500 },
  );
}
