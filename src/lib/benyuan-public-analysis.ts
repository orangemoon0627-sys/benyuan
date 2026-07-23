import type { AnalysisJob, AnalysisPipelineStageRecord, ReportPayload } from "@/lib/types";

const publicStageTitles: Record<string, string> = {
  input_prepared: "准备输入",
  prompt_shaped: "整理线索",
  feature_mapped: "生成特征",
  provider_enhanced: "深化分析",
  report_built: "生成报告",
  persisted: "保存结果",
};

function toPublicAnalysisStage(stage: AnalysisPipelineStageRecord) {
  const detail =
    stage.status === "failed"
      ? "这一阶段暂未完成，请稍后重试。"
      : stage.status === "done"
        ? "这一阶段已完成。"
        : stage.status === "skipped"
          ? "这一阶段无需执行。"
          : "正在整理本轮分析。";

  return {
    key: stage.key,
    title: publicStageTitles[stage.key] ?? "分析进度",
    status: stage.status,
    detail,
    startedAt: stage.startedAt,
    finishedAt: stage.finishedAt,
  };
}

export function toPublicAnalysisJob(job: AnalysisJob | undefined) {
  if (!job) return undefined;

  return {
    jobId: job.jobId,
    status: job.status,
    currentStageKey: job.currentStageKey,
    pipelineStages: job.pipelineStages?.map(toPublicAnalysisStage),
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
  };
}

export function toPublicReport(report: ReportPayload) {
  const toEvidence = (item: ReportPayload["archetype"]["evidence"][number]) => ({
    questionId: item.questionId,
    prompt: item.prompt,
    answerLabel: item.answerLabel,
    signal: item.signal,
    featureKey: item.featureKey,
    featureScore: item.featureScore,
  });
  const toCurated = (item: NonNullable<ReportPayload["curatedRecommendations"]>["books"][number]) => ({
    title: item.title,
    creator: item.creator,
    reason: item.reason,
  });

  return {
    reportId: report.reportId,
    sessionId: report.sessionId,
    overview: report.overview,
    narrativeOverview: report.narrativeOverview,
    dimensionReadings: Array.isArray(report.dimensionReadings)
      ? report.dimensionReadings.map((item) => ({
          dimension: item.dimension,
          title: item.title,
          summary: item.summary,
          confidenceBand: item.confidenceBand,
          evidence: Array.isArray(item.evidence) ? item.evidence.map(toEvidence) : [],
        }))
      : [],
    sevenDimensions: Array.isArray(report.sevenDimensions)
      ? report.sevenDimensions.map((item) => ({
          key: item.key,
          label: item.label,
          score: item.score,
          interpretation: item.interpretation,
          evidence: Array.isArray(item.evidence) ? item.evidence.map(toEvidence) : [],
        }))
      : undefined,
    tensions: Array.isArray(report.tensions)
      ? report.tensions.map((item) => ({
          tensionId: item.tensionId,
          name: item.name,
          poles: [item.poles?.[0], item.poles?.[1]] as [string, string],
          description: item.description,
          suggestion: item.suggestion,
          confidenceScore: item.confidenceScore,
          evidence: Array.isArray(item.evidence) ? item.evidence.map(toEvidence) : [],
        }))
      : [],
    archetype: {
      name: report.archetype.name,
      englishName: report.archetype.englishName,
      subtitle: report.archetype.subtitle,
      coreEssence: report.archetype.coreEssence,
      visualPrompt: report.archetype.visualPrompt,
      description: report.archetype.description,
      sourceSignals: Array.isArray(report.archetype.sourceSignals) ? [...report.archetype.sourceSignals] : [],
      evidence: Array.isArray(report.archetype.evidence) ? report.archetype.evidence.map(toEvidence) : [],
    },
    recommendations: Array.isArray(report.recommendations)
      ? report.recommendations.map((item) => ({
          type: item.type,
          title: item.title,
          description: item.description,
        }))
      : [],
    growthSuggestions: Array.isArray(report.growthSuggestions)
      ? report.growthSuggestions.map((item) => ({
          title: item.title,
          description: item.description,
          actionableSteps: Array.isArray(item.actionableSteps) ? [...item.actionableSteps] : [],
        }))
      : undefined,
    curatedRecommendations: report.curatedRecommendations
      ? {
          books: Array.isArray(report.curatedRecommendations.books) ? report.curatedRecommendations.books.map(toCurated) : [],
          films: Array.isArray(report.curatedRecommendations.films) ? report.curatedRecommendations.films.map(toCurated) : [],
          music: Array.isArray(report.curatedRecommendations.music) ? report.curatedRecommendations.music.map(toCurated) : [],
        }
      : undefined,
    safetyFlags: Array.isArray(report.safetyFlags) ? [...report.safetyFlags] : [],
    confidenceBand: report.confidenceBand,
    generatedAt: report.generatedAt,
    promptVersion: report.promptVersion,
    reportSchemaVersion: report.reportSchemaVersion,
  } satisfies Omit<ReportPayload, "analysisMeta">;
}
