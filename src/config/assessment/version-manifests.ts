import type { Mode } from "@/lib/types";
import type { AssessmentFormState, AssessmentPhase, AssessmentValidationConfig } from "@/features/assessment/types";

export type AssessmentQuestionSetKey = "lite.v1" | "lite.v2" | "deep.v1";

export type AssessmentVersionManifest = {
  mode: Mode;
  version: string;
  title: string;
  description: string;
  storageKey: string;
  questionSetKey: AssessmentQuestionSetKey;
  initialState?: AssessmentFormState;
  validation?: AssessmentValidationConfig;
  phases: AssessmentPhase[];
  isDefault?: boolean;
};

export const assessmentBaseInitialState: AssessmentFormState = {
  lifeStage: "turning_point",
  moodKeywords: ["迷茫", "希望"],
  answers: {},
};

export const assessmentDefaultValidation: AssessmentValidationConfig = {
  requireAtLeastOneOpenReflection: true,
  openReflectionQuestionIds: ["Q023", "Q024"],
};

export const assessmentVersionManifests: AssessmentVersionManifest[] = [
  {
    mode: "lite",
    version: "lite.v1",
    title: "Lite Ritual",
    description: "适合当前 MVP 的单题推进式自我探索流程。",
    storageKey: "benyuan-lite-test-draft-v1",
    questionSetKey: "lite.v1",
    isDefault: true,
    phases: [
      { id: "entry", label: "进入状态", description: "给这次探索一个起点坐标。", moduleIds: ["entry_state"] },
      { id: "emotion", label: "情感气候", description: "识别你最近的情绪天气。", moduleIds: ["emotional_weather"] },
      { id: "aesthetic", label: "审美语法", description: "从审美偏好读出精神指纹。", moduleIds: ["aesthetic_fingerprint"] },
      { id: "temporal", label: "时间哲学", description: "看你如何与过去、现在、未来相处。", moduleIds: ["temporal_philosophy"] },
      { id: "reflection", label: "开放反思", description: "给那些无法被选项收拢的部分留空间。", moduleIds: ["open_reflection"] },
    ],
  },
  {
    mode: "lite",
    version: "lite.v2",
    title: "Lite Ritual / Reflective Draft",
    description: "在 Lite 主流程中插入一格认知地貌问题，用更轻的方式补足你如何抵达清晰。",
    storageKey: "benyuan-lite-test-draft-v2",
    questionSetKey: "lite.v2",
    phases: [
      { id: "entry", label: "进入状态", description: "给这次探索一个起点坐标。", moduleIds: ["entry_state"] },
      { id: "emotion", label: "情感气候", description: "识别你最近的情绪天气。", moduleIds: ["emotional_weather"] },
      { id: "cognition", label: "认知地貌", description: "补一格你如何处理未明之事、怎样靠近清晰。", moduleIds: ["cognitive_topology"] },
      { id: "aesthetic", label: "审美语法", description: "从审美偏好读出精神指纹。", moduleIds: ["aesthetic_fingerprint"] },
      { id: "temporal", label: "时间哲学", description: "看你如何与过去、现在、未来相处。", moduleIds: ["temporal_philosophy"] },
      { id: "reflection", label: "开放反思", description: "给那些无法被选项收拢的部分留空间。", moduleIds: ["open_reflection"] },
    ],
  },
  {
    mode: "deep",
    version: "deep.v1",
    title: "Deep Ritual",
    description: "独立于 Lite 的深描探索流，补入认知、关系、欲望与灵性结构。",
    storageKey: "benyuan-deep-test-draft-v1",
    questionSetKey: "deep.v1",
    validation: {
      requireAtLeastOneOpenReflection: true,
      openReflectionQuestionIds: ["D015", "D016"],
    },
    isDefault: true,
    phases: [
      { id: "entry", label: "进入状态", description: "建立初始生命坐标与情绪背景。", moduleIds: ["entry_state"] },
      { id: "cognition", label: "认知地貌", description: "观察你如何辨认模式、处理矛盾与观看自己的思考。", moduleIds: ["cognitive_topology"] },
      { id: "emotion", label: "情感气候", description: "追踪情绪模式与触发点。", moduleIds: ["emotional_weather"] },
      { id: "desire", label: "欲望拓扑", description: "摸到你真正想守住什么，也看见更深的不安。", moduleIds: ["desire_topology"] },
      { id: "relation", label: "关系语法", description: "理解你如何允许他人靠近，以及你如何保护边界。", moduleIds: ["relational_grammar"] },
      { id: "aesthetic", label: "审美语法", description: "提取审美、象征与共鸣线索。", moduleIds: ["aesthetic_fingerprint"] },
      { id: "temporal", label: "时间哲学", description: "组织生命叙事与变化方向。", moduleIds: ["temporal_philosophy"] },
      { id: "spiritual", label: "灵性向度", description: "记录你如何理解意义、连接与超越。", moduleIds: ["spiritual_dimension"] },
      { id: "reflection", label: "开放反思", description: "把无法量化的部分留给文字和图像化回忆。", moduleIds: ["open_reflection"] },
    ],
  },
];
