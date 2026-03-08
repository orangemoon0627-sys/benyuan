import { NextResponse } from "next/server";
import { goldenAuditResults, goldenAuditSummary } from "@/lib/golden-audit";

export async function GET() {
  return NextResponse.json({
    status: goldenAuditSummary.failed === 0 ? "pass" : "fail",
    summary: goldenAuditSummary,
    results: goldenAuditResults,
  });
}
