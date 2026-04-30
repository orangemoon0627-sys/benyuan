import { NextResponse } from "next/server";
import { listToolCalls } from "@/lib/codex-platform/local-store";
import { executeToolCall } from "@/lib/codex-platform/runtime-service";
import type { ToolCallInput } from "@/lib/codex-platform/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    toolCalls: await listToolCalls(),
  });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as ToolCallInput | null;

  if (!payload?.toolName) {
    return NextResponse.json({ error: "toolName is required" }, { status: 400 });
  }

  const record = await executeToolCall(payload);
  return NextResponse.json({ toolCall: record }, { status: 201 });
}
