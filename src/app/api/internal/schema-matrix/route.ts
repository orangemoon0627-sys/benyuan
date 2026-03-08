import { NextResponse } from "next/server";
import { diffAssessmentDefinitionSnapshots, listAssessmentDefinitionSnapshots, listAssessmentVersions } from "@/features/assessment";
import type { Mode } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") as Mode | null;
  const target = searchParams.get("target");
  const base = searchParams.get("base");

  if (mode && target) {
    return NextResponse.json({
      status: "ok",
      diff: diffAssessmentDefinitionSnapshots(mode, target, base),
    });
  }

  const modes = [...new Set(listAssessmentDefinitionSnapshots().map((snapshot) => snapshot.mode))] as Mode[];

  return NextResponse.json({
    status: "ok",
    snapshots: listAssessmentDefinitionSnapshots(mode ?? undefined),
    modeGroups: modes.map((item) => ({
      mode: item,
      versions: listAssessmentVersions(item),
      diffs: listAssessmentVersions(item)
        .filter((version) => !version.isDefault)
        .map((version) => diffAssessmentDefinitionSnapshots(item, version.version)),
    })),
  });
}
