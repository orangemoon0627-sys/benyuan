import { NextResponse } from "next/server";
import { buildAssessmentContentWorkbench, buildAssessmentSchemaMigrationLedger, diffAssessmentDefinitionSnapshots, diffAssessmentFlowSnapshots, diffAssessmentNativeBlueprintSnapshots, getAssessmentDefinitionSnapshot, listAssessmentDefinitionSnapshots, listAssessmentVersions } from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
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
      flowDiff: diffAssessmentFlowSnapshots(mode, target, base),
      nativeBlueprintDiff: diffAssessmentNativeBlueprintSnapshots(mode, target, base),
    });
  }

  const snapshots = listAssessmentDefinitionSnapshots(mode ?? undefined);
  const modes = [...new Set(listAssessmentDefinitionSnapshots().map((snapshot) => snapshot.mode))] as Mode[];
  const contentWorkbench = buildAssessmentContentWorkbench();
  const analysisWorkbench = buildAnalysisWorkbenchCatalog(contentWorkbench.draftBlueprints);
  const migrationLedger = buildAssessmentSchemaMigrationLedger(contentWorkbench.draftBlueprints, analysisWorkbench.impactMatrix);

  return NextResponse.json({
    status: "ok",
    snapshots,
    modeMatrix: contentWorkbench.modeMatrix,
    migrationLedger,
    modeGroups: modes.map((item) => ({
      mode: item,
      versions: listAssessmentVersions(item),
      comparisonRows: listAssessmentVersions(item).map((version) => ({
        version,
        snapshot: getAssessmentDefinitionSnapshot(item, version.version),
        diff: version.isDefault ? null : diffAssessmentDefinitionSnapshots(item, version.version),
        flowDiff: version.isDefault ? null : diffAssessmentFlowSnapshots(item, version.version),
        nativeBlueprintDiff: version.isDefault ? null : diffAssessmentNativeBlueprintSnapshots(item, version.version),
      })),
    })),
  });
}
