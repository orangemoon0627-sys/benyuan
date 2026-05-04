import type { Mode } from "@/lib/types";

export type AnalysisReportSchemaConfig = {
  id: string;
  version: string;
  label: string;
  supportedModes: Mode[];
  recommendationLimit: number;
  dimensionOrder: Array<"aesthetic" | "emotional" | "temporal">;
  note: string;
  outputProfile?: "legacy" | "psyche_constellation_v3";
};

export const analysisReportSchemaConfig = {
  standard: {
    id: "benyuan.report.standard",
    version: "report.v0.3",
    label: "Standard Report Schema",
    supportedModes: ["lite", "deep"],
    recommendationLimit: 6,
    dimensionOrder: ["aesthetic", "emotional", "temporal"],
    note: "适合当前 MVP 的稳定报告结构。",
    outputProfile: "legacy",
  },
  deep_focus: {
    id: "benyuan.report.deep-focus",
    version: "report.v0.4",
    label: "Deep Focus Report Schema",
    supportedModes: ["deep"],
    recommendationLimit: 8,
    dimensionOrder: ["temporal", "emotional", "aesthetic"],
    note: "给 deep 模式使用，强调时间结构、情绪纵深与更丰富的推荐输出。",
    outputProfile: "legacy",
  },
  psyche_constellation_v3: {
    id: "benyuan.report.psyche-constellation-v3",
    version: "report.v3.0",
    label: "Psyche Constellation V3",
    supportedModes: ["lite", "deep"],
    recommendationLimit: 10,
    dimensionOrder: ["aesthetic", "emotional", "temporal"],
    note: "输出精神原型、七维星图、核心张力、成长建议与分组推荐内容。",
    outputProfile: "psyche_constellation_v3",
  },
} satisfies Record<string, AnalysisReportSchemaConfig>;
