import type { BenyuanModuleKey, PsycheConstellation } from "@/lib/benyuan-v3-types";

const dimensionLabels: Record<string, string> = {
  openness: "开放性",
  independence: "独立性",
  emotional_depth: "情感深度",
  meaning_seeking: "意义追寻",
  aesthetic_sensitivity: "审美敏感",
  action_tendency: "行动力",
  relationship_need: "关系需求",
};

type CollectPrimaryActionIntent = "submit" | "next-module" | "return-overview" | "next-question";
type ProcessingPhase = "part1" | "constellation";
type ProcessingKind = "empty" | "running" | "error" | "complete";

export function buildCollectPrimaryActionModel(input: {
  moduleFilter?: BenyuanModuleKey;
  allModulesComplete: boolean;
  activeModuleComplete: boolean;
  nextActionableModule: BenyuanModuleKey | null;
  activeQuestionAnswered: boolean;
  primaryActionDisabled: boolean;
}): {
  label: string;
  disabled: boolean;
  intent: CollectPrimaryActionIntent;
} {
  if (input.allModulesComplete) {
    return {
      label: "进入剧场",
      disabled: input.primaryActionDisabled,
      intent: "submit",
    };
  }

  if (!input.moduleFilter && input.activeModuleComplete && input.nextActionableModule) {
    return {
      label: `进入 ${input.nextActionableModule}`,
      disabled: input.primaryActionDisabled,
      intent: "next-module",
    };
  }

  if (input.moduleFilter && input.activeModuleComplete) {
    return {
      label: "返回总览",
      disabled: input.primaryActionDisabled,
      intent: "return-overview",
    };
  }

  return {
    label: "下一题",
    disabled: input.primaryActionDisabled || !input.activeQuestionAnswered,
    intent: "next-question",
  };
}

export function buildProcessingPresentation(input: {
  phase: ProcessingPhase;
  kind: ProcessingKind;
  progress: number;
  doneCount: number;
  totalCount: number;
  activeStageTitle?: string;
  activeStageDetail?: string;
  errorMessage?: string;
}): {
  backHref: string;
  eyebrow: string;
  title: string;
  description: string;
  progress: number;
} {
  const backHref = input.phase === "part1" ? "/collect" : "/theater";

  if (input.kind === "empty") {
    return {
      backHref,
      eyebrow: "显影",
      title: "等待开始",
      description: input.phase === "part1" ? "先回到当前问题。" : "先回到剧场。",
      progress: 0,
    };
  }

  if (input.kind === "error") {
    return {
      backHref,
      eyebrow: "已暂停",
      title: "显影暂停",
      description: input.errorMessage ?? "可以重试，或先回到上一步。",
      progress: Math.max(14, input.progress),
    };
  }

  if (input.kind === "complete") {
    return {
      backHref,
      eyebrow: "即将完成",
      title: input.phase === "part1" ? "剧场就位" : "星图就位",
      description: "下一步会自动打开。",
      progress: 100,
    };
  }

  return {
    backHref,
    eyebrow: `第 ${Math.min(input.doneCount + 1, input.totalCount)} 段 / ${input.totalCount}`,
    title: input.activeStageTitle ?? "处理中",
    description: input.activeStageDetail ?? "正在整理当前阶段。",
    progress: input.progress,
  };
}

export function buildConstellationShortFlow(data: PsycheConstellation) {
  const dimensions = Object.entries(data.seven_dimensions)
    .map(([key, value]) => ({
      key,
      label: dimensionLabels[key] ?? key,
      score: value.score,
      interpretation: value.interpretation,
    }))
    .sort((left, right) => right.score - left.score);

  const topDimensions = dimensions.slice(0, 3);
  const primaryTension = data.core_tensions[0] ?? null;
  const secondaryTensions = data.core_tensions.slice(1);
  const primaryPath = data.growth_suggestions[0] ?? null;
  const secondaryPaths = data.growth_suggestions.slice(1);
  const narrativeParagraphs = data.narrative_overview.split(/\n\n+/).filter((item) => item.trim().length > 0);

  return {
    essence: {
      lead: topDimensions[0] ? `${topDimensions[0].label} ${topDimensions[0].score}%` : "--",
      support: topDimensions[1] ? `${topDimensions[1].label} ${topDimensions[1].score}%` : "--",
    },
    structure: {
      topDimensions,
      activeDimensionKey: topDimensions[0]?.key ?? null,
    },
    moment: {
      tension: primaryTension,
      path: primaryPath,
    },
    folded: {
      narrativeParagraphs,
      secondaryTensions,
      secondaryPaths,
      recommendations: data.recommendations,
    },
  };
}
