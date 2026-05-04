import type { AssessmentQuestionSetKey } from "@/config/assessment/version-manifests";

export type AssessmentQuestionSourceMeta = {
  key: AssessmentQuestionSetKey;
  title: string;
  sourceFile: string;
  intent: string;
};

export const assessmentQuestionSourceMeta: AssessmentQuestionSourceMeta[] = [
  {
    key: "lite.v1",
    title: "Lite Question Set V1",
    sourceFile: "src/features/assessment/question-content-lite.ts",
    intent: "当前 Lite 主版本题库。",
  },
  {
    key: "lite.v2",
    title: "Lite Question Set V2",
    sourceFile: "src/features/assessment/question-content-lite-v2.ts",
    intent: "Lite 的反思增强草案版本。",
  },
  {
    key: "deep.v1",
    title: "Deep Question Set V1",
    sourceFile: "src/features/assessment/question-content-deep.ts",
    intent: "Deep 模式完整题库。",
  },
];
