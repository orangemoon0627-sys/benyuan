import { NextResponse } from "next/server";
import { listPermissionDecisions } from "@/lib/codex-platform/local-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const permissions = await listPermissionDecisions();

  return NextResponse.json({
    permissions,
    pending: permissions.filter((permission) => permission.status === "pending"),
  });
}
