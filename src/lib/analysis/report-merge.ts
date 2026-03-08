import type { AnalysisEngineResult, AnalysisProviderEnhancement } from "@/lib/analysis/types";

function mergeUniqueItems<T extends string>(base: T[], incoming: T[]) {
  return [...new Set([...base, ...incoming])];
}

export function mergeAnalysisProviderEnhancement(
  baseline: AnalysisEngineResult,
  enhancement: AnalysisProviderEnhancement | null | undefined,
): AnalysisEngineResult {
  if (!enhancement?.report) {
    return baseline;
  }

  const nextReport = enhancement.report;

  return {
    ...baseline,
    report: {
      ...baseline.report,
      ...nextReport,
      dimensionReadings: nextReport.dimensionReadings ?? baseline.report.dimensionReadings,
      tensions: nextReport.tensions ?? baseline.report.tensions,
      recommendations: nextReport.recommendations ?? baseline.report.recommendations,
      archetype: nextReport.archetype ?? baseline.report.archetype,
      safetyFlags: nextReport.safetyFlags
        ? mergeUniqueItems(baseline.report.safetyFlags, nextReport.safetyFlags)
        : baseline.report.safetyFlags,
      promptVersion: nextReport.promptVersion ?? baseline.report.promptVersion,
    },
  };
}
