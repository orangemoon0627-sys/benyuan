import { NextResponse } from "next/server";
import { analysisPromptTemplateConfig } from "@/config/analysis/prompt-templates";
import { analysisReportSchemaConfig } from "@/config/analysis/report-schemas";
import { analysisRuntimePreviewPresetConfig } from "@/config/analysis/runtime-preview-presets";
import { buildAssessmentContentWorkbench } from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog, getAnalysisRuntimeStatus } from "@/lib/analysis";
import { syncWorkbenchDraftSessions } from "@/lib/store";

export async function GET() {
  const content = buildAssessmentContentWorkbench();
  const analysis = buildAnalysisWorkbenchCatalog(content.draftBlueprints);
  const syncedDrafts = await syncWorkbenchDraftSessions(content.draftBlueprints, analysis.impactMatrix);

  return NextResponse.json({
    status: "ok",
    generatedAt: new Date().toISOString(),
    sources: [
      {
        kind: "prompt_templates",
        path: "src/config/analysis/prompt-templates.ts",
        count: Object.keys(analysisPromptTemplateConfig).length,
      },
      {
        kind: "report_schemas",
        path: "src/config/analysis/report-schemas.ts",
        count: Object.keys(analysisReportSchemaConfig).length,
      },
      {
        kind: "runtime_preview_presets",
        path: "src/config/analysis/runtime-preview-presets.ts",
        count: analysisRuntimePreviewPresetConfig.length,
      },
    ],
    defaults: {
      lite: getAnalysisRuntimeStatus("lite"),
      deep: getAnalysisRuntimeStatus("deep"),
    },
    drafts: syncedDrafts,
    analysis,
    contentImpact: {
      draftBlueprints: content.draftBlueprints,
      modeMatrix: content.modeMatrix,
      draftPatchDocuments: content.draftBlueprints.map((item) => item.patchDocument),
    },
    editableSurfaces: analysis.adminDraftSurfaces.map((surface) => ({
      key: surface.key,
      scope: surface.editableFields.join(" / "),
      targetFile: surface.targetFile,
      nextAction: surface.validationChecks[0] ?? "review linked routes",
    })),
  });
}
