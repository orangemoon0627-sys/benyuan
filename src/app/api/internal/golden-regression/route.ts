import { NextResponse } from "next/server";
import { buildGoldenBaselineDiff } from "@/lib/golden-baseline-diff";
import { goldenRegressionSummarySnapshots } from "@/lib/golden-regression";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const baselineVersion = searchParams.get("baseline");
  const comparison = buildGoldenBaselineDiff(baselineVersion);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    baseline: comparison.baselineSummary,
    diffSummary: comparison.diffSummary,
    diffResults: comparison.diffResults,
    availableBaselines: comparison.availableBaselines,
    snapshots: goldenRegressionSummarySnapshots,
  });
}
