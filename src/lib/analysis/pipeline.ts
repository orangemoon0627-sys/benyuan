import type { AnalysisEngineTrace, AnalysisPipelineStageKey, AnalysisPipelineStageSnapshot, AnalysisPipelineStageStatus } from "@/lib/analysis/types";

const stageTitles: Record<AnalysisPipelineStageKey, string> = {
  input_prepared: "准备输入",
  prompt_shaped: "整理提示词",
  feature_mapped: "生成特征向量",
  provider_enhanced: "外部增强",
  report_built: "生成报告",
  persisted: "写回存储",
};

function createStage(key: AnalysisPipelineStageKey, status: AnalysisPipelineStageStatus, detail: string): AnalysisPipelineStageSnapshot {
  return {
    key,
    title: stageTitles[key],
    status,
    detail,
  };
}

export function buildQueuedPipelineStages(): AnalysisPipelineStageSnapshot[] {
  return [
    createStage("input_prepared", "pending", "等待把 session 与题目合同整理成统一输入。"),
    createStage("prompt_shaped", "pending", "等待根据当前 mode 选择 prompt template 并整形 payload。"),
    createStage("feature_mapped", "pending", "等待计算 feature vector 与信号强度。"),
    createStage("provider_enhanced", "pending", "等待判断是否需要外部模型参与增强。"),
    createStage("report_built", "pending", "等待按 report schema 组织 narrative 结果。"),
    createStage("persisted", "pending", "等待把 feature/report/job 状态写回 store。"),
  ];
}

export function buildRunningPipelineStages(startedAt: string): AnalysisPipelineStageSnapshot[] {
  return buildQueuedPipelineStages().map((stage, index) => ({
    ...stage,
    status: index === 0 ? "running" : "pending",
    startedAt: index === 0 ? startedAt : undefined,
  }));
}


export function transitionPipelineStages(
  currentStages: AnalysisPipelineStageSnapshot[] | undefined,
  key: AnalysisPipelineStageKey,
  status: AnalysisPipelineStageStatus,
  detail: string,
  at: string,
): AnalysisPipelineStageSnapshot[] {
  const stages = currentStages && currentStages.length > 0 ? currentStages : buildQueuedPipelineStages();
  const currentIndex = stages.findIndex((stage) => stage.key === key);

  if (currentIndex < 0) {
    return stages;
  }

  return stages.map((stage, index) => {
    if (index < currentIndex) {
      if (stage.status === "done" || stage.status === "skipped") {
        return stage;
      }

      return {
        ...stage,
        status: "done",
        startedAt: stage.startedAt ?? at,
        finishedAt: stage.finishedAt ?? at,
      };
    }

    if (index === currentIndex) {
      return {
        ...stage,
        status,
        detail,
        startedAt: stage.startedAt ?? at,
        finishedAt: status === "running" ? undefined : at,
      };
    }

    return {
      ...stage,
      status: stage.status === "skipped" ? "skipped" : "pending",
      finishedAt: undefined,
    };
  });
}

export function buildCompletedPipelineStages(trace: AnalysisEngineTrace, startedAt: string, finishedAt: string): AnalysisPipelineStageSnapshot[] {
  const providerStageStatus: AnalysisPipelineStageStatus = trace.providerAvailable ? "done" : "skipped";
  const providerStageDetail = trace.providerAvailable
    ? `使用 ${trace.providerId} / ${trace.providerModel ?? "default-model"} 完成 narrative enhancement。`
    : `当前 runtime 为 ${trace.effectiveRuntime}，外部增强阶段跳过。`;

  return [
    {
      ...createStage("input_prepared", "done", `已准备 ${trace.answeredCount} 条回答与 ${trace.openReflectionCount} 条开放反思。`),
      startedAt,
      finishedAt,
    },
    {
      ...createStage("prompt_shaped", "done", `已选择 ${trace.promptTemplateId} / ${trace.promptTemplateVersion}。`),
      startedAt,
      finishedAt,
    },
    {
      ...createStage("feature_mapped", "done", `已根据 top signals 生成 feature vector：${trace.topSignals.join(" · ") || "无显著信号"}。`),
      startedAt,
      finishedAt,
    },
    {
      ...createStage("provider_enhanced", providerStageStatus, providerStageDetail),
      startedAt,
      finishedAt,
    },
    {
      ...createStage("report_built", "done", `已按 ${trace.reportSchemaId} / ${trace.reportSchemaVersion} 生成最终报告。`),
      startedAt,
      finishedAt,
    },
    {
      ...createStage("persisted", "done", "feature vector、report、session lifecycle 与 job trace 已写回 store。"),
      startedAt,
      finishedAt,
    },
  ];
}

export function buildFailedPipelineStages(
  currentStages: AnalysisPipelineStageSnapshot[] | undefined,
  failedAt: string,
  errorMessage: string,
): AnalysisPipelineStageSnapshot[] {
  const stages = currentStages && currentStages.length > 0 ? currentStages : buildQueuedPipelineStages();
  let failureAssigned = false;

  return stages.map((stage) => {
    if (stage.status === "done" || stage.status === "skipped") {
      return stage;
    }

    if (!failureAssigned) {
      failureAssigned = true;
      return {
        ...stage,
        status: "failed",
        detail: `${stage.detail} 失败原因：${errorMessage}`,
        finishedAt: failedAt,
      };
    }

    return stage;
  });
}
