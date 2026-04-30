import { NextResponse } from "next/server";
import { getPermissionDecisionById } from "@/lib/codex-platform/local-store";
import { resolvePendingPermissionDecision } from "@/lib/codex-platform/runtime-service";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ permissionId: string }> }) {
  const { permissionId } = await params;
  const permission = await getPermissionDecisionById(permissionId);

  if (!permission) {
    return NextResponse.json({ error: "permission_not_found" }, { status: 404 });
  }

  return NextResponse.json({ permission });
}

export async function POST(request: Request, { params }: { params: Promise<{ permissionId: string }> }) {
  const { permissionId } = await params;
  const payload = (await request.json().catch(() => null)) as { decision?: "approved" | "rejected"; reason?: string } | null;

  if (!payload?.decision) {
    return NextResponse.json({ error: "decision is required" }, { status: 400 });
  }

  const toolCall = await resolvePendingPermissionDecision({
    permissionId,
    decision: payload.decision,
    reason: payload.reason,
  });

  if (!toolCall) {
    return NextResponse.json({ error: "permission_not_found" }, { status: 404 });
  }

  return NextResponse.json({ toolCall });
}
