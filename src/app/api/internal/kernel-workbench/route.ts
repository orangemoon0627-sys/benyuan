import { NextResponse } from "next/server";
import { listAssessmentDefinitionSnapshots, listAssessmentVersions } from "@/features/assessment";
import {
  buildAnalysisWorkbenchCatalog,
  diffAnalysisPromptTemplates,
  diffAnalysisReportSchemas,
  getAnalysisRuntimeStatus,
} from "@/lib/analysis";
import { listSessionRuntimeSummaries } from "@/lib/store";
import type { Mode } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedMode = (searchParams.get("mode") as Mode | null) ?? "lite";
  const mode: Mode = requestedMode === "deep" ? "deep" : "lite";
  const engine = searchParams.get("engine");
  const provider = searchParams.get("provider");
  const promptTemplate = searchParams.get("promptTemplate");
  const reportSchema = searchParams.get("reportSchema");

  const snapshots = listAssessmentDefinitionSnapshots();
  const modes = [...new Set(snapshots.map((snapshot) => snapshot.mode))] as Mode[];
  const catalog = buildAnalysisWorkbenchCatalog();

  return NextResponse.json({
    status: "ok",
    generatedAt: new Date().toISOString(),
    selectedPreview: getAnalysisRuntimeStatus(mode, {
      engine,
      provider,
      promptTemplate,
      reportSchema,
    }),
    selectedDiffs: {
      prompt:
        mode === "deep" && promptTemplate === "depth"
          ? diffAnalysisPromptTemplates("core", "depth", "deep")
          : diffAnalysisPromptTemplates("core", "core", mode),
      report:
        mode === "deep" && reportSchema === "deep_focus"
          ? diffAnalysisReportSchemas("standard", "deep_focus", "deep")
          : diffAnalysisReportSchemas("standard", "standard", mode),
    },
    analysis: {
      runtime: {
        lite: getAnalysisRuntimeStatus("lite"),
        deep: getAnalysisRuntimeStatus("deep"),
      },
      ...catalog,
    },
    assessment: modes.map((entryMode) => ({
      mode: entryMode,
      versions: listAssessmentVersions(entryMode),
    })),
    sessions: await listSessionRuntimeSummaries(14),
  });
}
