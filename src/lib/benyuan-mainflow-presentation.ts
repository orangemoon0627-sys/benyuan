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

function cleanResultCopy(value: string) {
  return value.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").replace(/\s+/g, " ").trim();
}

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
      label: "进入下一章",
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
      eyebrow: "等待显影",
      title: "线索未至",
      description: input.phase === "part1" ? "先回到问题。" : "先回到剧场。",
      progress: 0,
    };
  }

  if (input.kind === "error") {
    return {
      backHref,
      eyebrow: "显影暂停",
      title: "显影被中断",
      description: "线索仍在，可以重新进入。",
      progress: Math.max(14, input.progress),
    };
  }

  if (input.kind === "complete") {
    return {
      backHref,
      eyebrow: "即将抵达",
      title: input.phase === "part1" ? "剧场就位" : "星图显形",
      description: "下一步会自动打开。",
      progress: 100,
    };
  }

  return {
    backHref,
    eyebrow: `第 ${Math.min(input.doneCount + 1, input.totalCount)} 段 / ${input.totalCount}`,
    title: input.activeStageTitle ?? "正在显影",
    description: input.activeStageDetail ?? "线索正在从暗处浮现。",
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
  const firstNarrative = cleanResultCopy(narrativeParagraphs[0] ?? "");
  const essenceSupport = firstNarrative.length > 54 ? `${firstNarrative.slice(0, 54)}……` : firstNarrative;

  return {
    essence: {
      lead: data.archetype.core_essence,
      support: essenceSupport || topDimensions[0]?.interpretation || "--",
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
