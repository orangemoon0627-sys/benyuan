import { NextResponse } from "next/server";
import { buildShareCardSvg, getShareCardVariant } from "@/lib/share-card";
import { getReport } from "@/lib/store";

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const report = await getReport(sessionId);

  if (!report) {
    return NextResponse.json({ error: "report_not_found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const variant = getShareCardVariant(searchParams.get("variant"));
  const svg = buildShareCardSvg(report, variant);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `inline; filename="benyuan-${encodeURIComponent(report.archetype.name)}-${variant}.svg"`,
      "Cache-Control": "no-store",
    },
  });
}
