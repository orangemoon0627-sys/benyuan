import { NextResponse } from "next/server";
import { getReport } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const report = await getReport(sessionId);

  if (!report) {
    return NextResponse.json({ error: "report_not_found" }, { status: 404 });
  }

  return NextResponse.json({ status: "done", report });
}
