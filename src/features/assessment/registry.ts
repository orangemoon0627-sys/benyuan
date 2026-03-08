import type { Mode, Answer } from "@/lib/types";
import { assessmentModuleLabels, lifeStageOptions, moodKeywordOptions } from "./catalog";
import { findFirstIncompleteQuestionIndex, getAssessmentTotalSteps } from "./flow";
import { fullLiteQuestionSet } from "./question-bank";
import type { AssessmentDefinition, AssessmentFormState, AssessmentValidationConfig } from "./types";

export type AssessmentValidationResult =
  | { ok: true }
  | {
      ok: false;
      error: "invalid_mode" | "missing_required_answers";
      details?: {
        firstIncompleteQuestionId?: string;
        missingOpenReflection?: boolean;
      };
    };

const baseInitialState: AssessmentFormState = {
  lifeStage: "turning_point",
  moodKeywords: ["迷茫", "希望"],
  answers: {},
};

const defaultValidation: AssessmentValidationConfig = {
  requireAtLeastOneOpenReflection: true,
  openReflectionQuestionIds: ["Q023", "Q024"],
};

function createAssessmentDefinition(config: {
  mode: Mode;
  title: string;
  description: string;
  storageKey: string;
  questions?: typeof fullLiteQuestionSet;
  initialState?: AssessmentFormState;
  validation?: AssessmentValidationConfig;
  phases: AssessmentDefinition["phases"];
}) {
  const definition: AssessmentDefinition = {
    mode: config.mode,
    title: config.title,
    description: config.description,
    storageKey: config.storageKey,
    moduleLabels: assessmentModuleLabels,
    lifeStageOptions,
    moodKeywordOptions,
    questions: config.questions ?? fullLiteQuestionSet,
    totalSteps: (config.questions ?? fullLiteQuestionSet).length + 2,
    phases: config.phases,
    initialState: config.initialState ?? baseInitialState,
    validation: config.validation ?? defaultValidation,
  };

  return definition;
}

const liteAssessmentDefinition = createAssessmentDefinition({
  mode: "lite",
  title: "Lite Ritual",
  description: "适合当前 MVP 的单题推进式自我探索流程。",
  storageKey: "benyuan-lite-test-draft-v1",
  phases: [
    { id: "entry", label: "进入状态", description: "给这次探索一个起点坐标。", moduleIds: ["entry_state"] },
    { id: "emotion", label: "情感气候", description: "识别你最近的情绪天气。", moduleIds: ["emotional_weather"] },
    { id: "aesthetic", label: "审美语法", description: "从审美偏好读出精神指纹。", moduleIds: ["aesthetic_fingerprint"] },
    { id: "temporal", label: "时间哲学", description: "看你如何与过去、现在、未来相处。", moduleIds: ["temporal_philosophy"] },
    { id: "reflection", label: "开放反思", description: "给那些无法被选项收拢的部分留空间。", moduleIds: ["open_reflection"] },
  ],
});

const deepAssessmentDefinition = createAssessmentDefinition({
  mode: "deep",
  title: "Deep Ritual",
  description: "为后续深度版保留的扩展骨架，当前先复用 Lite 题库与校验规则。",
  storageKey: "benyuan-deep-test-draft-v1",
  phases: [
    { id: "entry", label: "进入状态", description: "建立初始生命坐标与情绪背景。", moduleIds: ["entry_state"] },
    { id: "emotion", label: "情感气候", description: "追踪情绪模式与触发点。", moduleIds: ["emotional_weather"] },
    { id: "aesthetic", label: "审美语法", description: "提取审美、象征与共鸣线索。", moduleIds: ["aesthetic_fingerprint"] },
    { id: "temporal", label: "时间哲学", description: "组织生命叙事与变化方向。", moduleIds: ["temporal_philosophy"] },
    { id: "reflection", label: "开放反思", description: "为未来自传、关系、创作输入预留接口。", moduleIds: ["open_reflection"] },
  ],
});

const assessmentRegistry: Record<Mode, AssessmentDefinition> = {
  lite: liteAssessmentDefinition,
  deep: deepAssessmentDefinition,
};

export const defaultAssessmentMode: Mode = "lite";

export function isAssessmentMode(value: string | null | undefined): value is Mode {
  return value === "lite" || value === "deep";
}

export function resolveAssessmentMode(value: string | null | undefined) {
  return isAssessmentMode(value) ? value : defaultAssessmentMode;
}

export function listAssessmentDefinitions() {
  return Object.values(assessmentRegistry);
}

export function getAssessmentDefinition(mode: Mode = defaultAssessmentMode) {
  return assessmentRegistry[mode] ?? assessmentRegistry[defaultAssessmentMode];
}

export function validateAssessmentSubmission(mode: Mode, answers: Answer[]): AssessmentValidationResult {
  const definition = getAssessmentDefinition(mode);
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));
  const answersRecord = Object.fromEntries(answers.map((answer) => [answer.questionId, answer.value])) as AssessmentFormState["answers"];
  const firstIncompleteQuestionIndex = findFirstIncompleteQuestionIndex(
    {
      ...definition,
      questions: definition.questions.filter((question) => !question.optional),
    },
    answersRecord,
  );

  const openReflectionAnswered = definition.validation.openReflectionQuestionIds.some((questionId) => {
    const answer = answerMap.get(questionId);
    return typeof answer?.value === "string" && answer.value.trim().length > 0;
  });

  if (firstIncompleteQuestionIndex >= 0 || (definition.validation.requireAtLeastOneOpenReflection && !openReflectionAnswered)) {
    const firstIncompleteQuestion = firstIncompleteQuestionIndex >= 0 ? definition.questions.filter((question) => !question.optional)[firstIncompleteQuestionIndex] : null;

    return {
      ok: false,
      error: "missing_required_answers",
      details: {
        firstIncompleteQuestionId: firstIncompleteQuestion?.questionId,
        missingOpenReflection: definition.validation.requireAtLeastOneOpenReflection && !openReflectionAnswered,
      },
    };
  }

  return { ok: true };
}
