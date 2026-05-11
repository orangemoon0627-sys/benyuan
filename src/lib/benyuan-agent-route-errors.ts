import { NextResponse } from "next/server";

export function agentRouteErrorResponse(input: {
  error: unknown;
  stage: "theater" | "constellation";
  part1Id?: string;
  part2Id?: string;
  startedAt?: number;
}) {
  const message = input.error instanceof Error ? input.error.message : "agent_generation_failed";
  return NextResponse.json(
    {
      error: "agent_generation_failed",
      stage: input.stage,
      part1_id: input.part1Id,
      part2_id: input.part2Id,
      duration_ms: typeof input.startedAt === "number" ? Math.max(0, Date.now() - input.startedAt) : undefined,
      detail: message,
    },
    { status: 500 },
  );
}
