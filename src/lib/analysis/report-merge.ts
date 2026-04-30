import type { AnalysisEngineResult, AnalysisProviderEnhancement } from "@/lib/analysis/types";
import { normalizeReportPayload } from "@/lib/report-normalization";

function mergeUniqueItems<T extends string>(base: T[], incoming: T[]) {
  return [...new Set([...base, ...incoming])];
}

export function mergeAnalysisProviderEnhancement(
  baseline: AnalysisEngineResult,
  enhancement: AnalysisProviderEnhancement | null | undefined,
): AnalysisEngineResult {
  const nextReport = enhancement?.report;
  const metadata = enhancement?.metadata;

  return {
    ...baseline,
    trace: {
      ...baseline.trace,
      providerId: metadata?.providerId ?? baseline.trace.providerId,
      providerRequestMode: metadata?.requestMode ?? baseline.trace.providerRequestMode,
      providerModel: metadata?.model ?? baseline.trace.providerModel,
      providerRequestId: metadata?.requestId ?? baseline.trace.providerRequestId,
      providerCompletedScopes: metadata?.completedScopes ?? baseline.trace.providerCompletedScopes,
      providerTextReceived: metadata?.textReceived ?? baseline.trace.providerTextReceived,
      providerResponsePreview: metadata?.responsePreview ?? baseline.trace.providerResponsePreview,
      promptTemplateId: metadata?.promptTemplateId ?? baseline.trace.promptTemplateId,
      promptTemplateVersion: metadata?.promptTemplateVersion ?? baseline.trace.promptTemplateVersion,
    },
    report: !nextReport
      ? baseline.report
      : normalizeReportPayload({
          ...baseline.report,
          ...nextReport,
          narrativeOverview: nextReport.narrativeOverview ?? baseline.report.narrativeOverview,
          dimensionReadings: nextReport.dimensionReadings ?? baseline.report.dimensionReadings,
          sevenDimensions: nextReport.sevenDimensions ?? baseline.report.sevenDimensions,
          tensions: nextReport.tensions ?? baseline.report.tensions,
          recommendations: nextReport.recommendations ?? baseline.report.recommendations,
          growthSuggestions: nextReport.growthSuggestions ?? baseline.report.growthSuggestions,
          curatedRecommendations: nextReport.curatedRecommendations
            ? {
                books: nextReport.curatedRecommendations.books ?? baseline.report.curatedRecommendations?.books ?? [],
                films: nextReport.curatedRecommendations.films ?? baseline.report.curatedRecommendations?.films ?? [],
                music: nextReport.curatedRecommendations.music ?? baseline.report.curatedRecommendations?.music ?? [],
              }
            : baseline.report.curatedRecommendations,
          archetype: nextReport.archetype
            ? {
                ...baseline.report.archetype,
                ...nextReport.archetype,
                sourceSignals: nextReport.archetype.sourceSignals ?? baseline.report.archetype.sourceSignals,
                evidence: nextReport.archetype.evidence ?? baseline.report.archetype.evidence,
              }
            : baseline.report.archetype,
          safetyFlags: nextReport.safetyFlags
            ? mergeUniqueItems(baseline.report.safetyFlags, nextReport.safetyFlags)
            : baseline.report.safetyFlags,
          promptVersion: nextReport.promptVersion ?? baseline.report.promptVersion,
        }),
  };
}
