import { NextResponse } from "next/server";
import { analysisPromptTemplateConfig } from "@/config/analysis/prompt-templates";
import { analysisReportSchemaConfig } from "@/config/analysis/report-schemas";
import { analysisRuntimePreviewPresetConfig } from "@/config/analysis/runtime-preview-presets";
import {
  buildAssessmentContentWorkbench,
  buildAssessmentContentMigrationChecklist,
  diffAssessmentQuestionSources,
  diffAssessmentDefinitionSnapshots,
  resolveAssessmentVersion,
  type AssessmentQuestionSourceCatalogItem,
} from "@/features/assessment";
import type { Mode } from "@/lib/types";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
import { syncWorkbenchDraftSessions } from "@/lib/store";

function resolveMode(value: string | null): Mode {
  return value === "deep" ? "deep" : "lite";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = resolveMode(url.searchParams.get("mode"));
  const workbench = buildAssessmentContentWorkbench();
  const defaultMap = workbench.defaultVersionMap.find((entry) => entry.mode === mode);
  const selectedVersion = resolveAssessmentVersion(mode, url.searchParams.get("version") ?? defaultMap?.defaultVersion ?? null);
  const compareVersionParam = url.searchParams.get("compare");
  const fallbackCompareVersion = defaultMap?.versions.find((version) => version.version !== selectedVersion)?.version ?? null;
  const compareVersion = compareVersionParam
    ? resolveAssessmentVersion(mode, compareVersionParam)
    : fallbackCompareVersion;

  const selectedManifest = workbench.manifests.find((manifest) => manifest.mode === mode && manifest.version === selectedVersion) ?? null;
  const selectedSourceKey = url.searchParams.get("source") ?? selectedManifest?.questionSetKey ?? null;
  const selectedSource = workbench.questionSources.find((source) => source.key === selectedSourceKey) ?? null;
  const compareManifest = compareVersion
    ? workbench.manifests.find((manifest) => manifest.mode === mode && manifest.version === compareVersion) ?? null
    : null;
  const compareSource = compareManifest
    ? workbench.questionSources.find((source) => source.key === compareManifest.questionSetKey) ?? null
    : null;
  const includeRaw = url.searchParams.get("includeRaw") === "true";

  const manifestDiff = compareVersion ? diffAssessmentDefinitionSnapshots(mode, compareVersion, selectedVersion) : null;
  const questionSourceDiff = compareVersion ? diffAssessmentQuestionSources(mode, compareVersion, selectedVersion) : null;
  const analysisWorkbench = buildAnalysisWorkbenchCatalog(workbench.draftBlueprints);
  const syncedDrafts = await syncWorkbenchDraftSessions(workbench.draftBlueprints, analysisWorkbench.impactMatrix);

  return NextResponse.json({
    status: "ok",
    generatedAt: new Date().toISOString(),
    selection: {
      mode,
      version: selectedVersion,
      compareVersion,
      selectedManifest,
      compareManifest,
      selectedSource,
      compareSource,
      manifestDiff,
      questionSourceDiff,
      migrationChecklist: buildAssessmentContentMigrationChecklist(manifestDiff, questionSourceDiff),
      draftBlueprint:
        compareVersion
          ? workbench.draftBlueprints.find((item) => item.mode === mode && item.baseVersion === selectedVersion && item.targetVersion === compareVersion) ?? null
          : null,
      query: {
        source: selectedSourceKey,
        includeRaw,
      },
    },
    assessment: workbench,
    drafts: syncedDrafts,
    analysis: {
      promptTemplates: Object.entries(analysisPromptTemplateConfig).map(([key, value]) => ({ key, ...value })),
      reportSchemas: Object.entries(analysisReportSchemaConfig).map(([key, value]) => ({ key, ...value })),
      runtimePresets: analysisRuntimePreviewPresetConfig,
    },
    raw: includeRaw
      ? {
          manifests: workbench.manifests,
          questionSources: workbench.questionSources,
          selectedSourceFile: (selectedSource as AssessmentQuestionSourceCatalogItem | null)?.sourceFile ?? null,
        }
      : undefined,
  });
}
