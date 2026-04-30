import type { Mode } from "@/lib/types";

export type AnalysisRuntimePreviewPresetConfig = {
  key: string;
  label: string;
  mode: Mode;
  options: {
    engine?: string;
    provider?: string;
    promptTemplate?: string;
    reportSchema?: string;
  };
  intent: string;
};

export const analysisRuntimePreviewPresetConfig: AnalysisRuntimePreviewPresetConfig[] = [
  {
    key: "lite_default",
    label: "lite / default",
    mode: "lite",
    options: {},
    intent: "查看 lite 模式的默认内核组合。",
  },
  {
    key: "deep_default",
    label: "deep / default",
    mode: "deep",
    options: {},
    intent: "查看 deep 模式默认会落到哪套 prompt 和 report schema。",
  },
  {
    key: "deep_structured",
    label: "deep / deterministic / structured",
    mode: "deep",
    options: {
      engine: "deterministic",
      promptTemplate: "core",
      reportSchema: "standard",
    },
    intent: "强制 deep 走结构化保守路径，便于做回归和基线检查。",
  },
  {
    key: "deep_hybrid_openai",
    label: "deep / hybrid / openai / depth",
    mode: "deep",
    options: {
      engine: "hybrid",
      provider: "openai",
      promptTemplate: "depth",
      reportSchema: "deep_focus",
    },
    intent: "模拟最丰富的一条 narrative 路径，检查深度模板与增强链路是否协同。",
  },
];
