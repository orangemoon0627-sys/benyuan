import { NextResponse } from "next/server";
import {
  buildAssessmentContentWorkbench,
  buildAssessmentSchemaMigrationLedger,
  diffAssessmentNativeBlueprintSnapshots,
  getAssessmentDefinition,
  listAssessmentDefinitionSnapshots,
  listAssessmentVersions,
  serializeAssessmentQuestion,
} from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
import { buildAssessmentFlowContract, buildAssessmentNativeScreenMap } from "@/lib/assessment-client-contract";
import { buildNativeMigrationChecklist, buildNativeReferenceKit } from "@/lib/native-reference";
import type { Mode } from "@/lib/types";

function buildNativeHandoff(mode: Mode, version?: string | null) {
  const definition = getAssessmentDefinition(mode, version);
  const flow = buildAssessmentFlowContract({
    totalSteps: definition.totalSteps,
    phases: definition.phases,
    questions: definition.questions.map((question) => serializeAssessmentQuestion(question)),
    validation: definition.validation,
    moduleLabels: definition.moduleLabels,
  });
  const native = buildAssessmentNativeScreenMap(flow);

  return {
    mode: definition.mode,
    version: definition.version,
    title: definition.title,
    description: definition.description,
    totalSteps: definition.totalSteps,
    native,
    referenceKit: buildNativeReferenceKit(native),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") as Mode | null;
  const version = searchParams.get("version");
  const target = searchParams.get("target");
  const base = searchParams.get("base");

  const contentWorkbench = buildAssessmentContentWorkbench();
  const analysisWorkbench = buildAnalysisWorkbenchCatalog(contentWorkbench.draftBlueprints);
  const migrationLedger = buildAssessmentSchemaMigrationLedger(contentWorkbench.draftBlueprints, analysisWorkbench.impactMatrix);

  if (mode && target) {
    const nativeBlueprintDiff = diffAssessmentNativeBlueprintSnapshots(mode, target, base);
    return NextResponse.json({
      status: "ok",
      nativeBlueprintDiff,
      migrationChecklist: buildNativeMigrationChecklist(nativeBlueprintDiff),
      handoff: buildNativeHandoff(mode, target),
      migrationLedger: migrationLedger.filter((item) => item.mode === mode && item.targetVersion === target),
    });
  }

  if (mode) {
    return NextResponse.json({
      status: "ok",
      handoff: buildNativeHandoff(mode, version),
      migrationLedger: migrationLedger.filter((item) => item.mode === mode),
    });
  }

  const snapshots = listAssessmentDefinitionSnapshots();
  const modes = [...new Set(snapshots.map((snapshot) => snapshot.mode))] as Mode[];

  return NextResponse.json({
    status: "ok",
    migrationLedger,
    modes: modes.map((item) => {
      const versions = listAssessmentVersions(item);
      const defaultVersion = versions.find((versionInfo) => versionInfo.isDefault)?.version ?? versions[0]?.version ?? null;
      return {
        mode: item,
        defaultVersion,
        versions: versions.map((versionInfo) => ({
          version: versionInfo.version,
          title: versionInfo.title,
          description: versionInfo.description,
          isDefault: versionInfo.isDefault,
          handoff: buildNativeHandoff(item, versionInfo.version),
          nativeBlueprintDiff:
            versionInfo.version === defaultVersion || !defaultVersion
              ? null
              : diffAssessmentNativeBlueprintSnapshots(item, versionInfo.version, defaultVersion),
        })),
      };
    }),
  });
}
