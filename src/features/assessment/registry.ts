import type { Mode, Answer } from "@/lib/types";
import { assessmentModuleLabels, lifeStageOptions, moodKeywordOptions } from "./catalog";
import { findFirstIncompleteQuestionIndex } from "./flow";
import { fullDeepQuestionSet, fullLiteQuestionSet } from "./question-bank";
import type { AssessmentDefinition, AssessmentDefinitionDiff, AssessmentDefinitionSnapshot, AssessmentFormState, AssessmentValidationConfig, AssessmentVersionDescriptor } from "./types";

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
  version: string;
  title: string;
  description: string;
  storageKey: string;
  questions?: AssessmentDefinition["questions"];
  initialState?: AssessmentFormState;
  validation?: AssessmentValidationConfig;
  phases: AssessmentDefinition["phases"];
}) {
  const questions = config.questions ?? fullLiteQuestionSet;
  const definition: AssessmentDefinition = {
    mode: config.mode,
    version: config.version,
    title: config.title,
    description: config.description,
    storageKey: config.storageKey,
    moduleLabels: assessmentModuleLabels,
    lifeStageOptions,
    moodKeywordOptions,
    questions,
    totalSteps: questions.length + 2,
    phases: config.phases,
    initialState: config.initialState ?? baseInitialState,
    validation: config.validation ?? defaultValidation,
  };

  return definition;
}

const liteAssessmentDefinitionV1 = createAssessmentDefinition({
  mode: "lite",
  version: "lite.v1",
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

const deepAssessmentDefinitionV1 = createAssessmentDefinition({
  mode: "deep",
  version: "deep.v1",
  title: "Deep Ritual",
  description: "独立于 Lite 的深描探索流，补入认知、关系、欲望与灵性结构。",
  storageKey: "benyuan-deep-test-draft-v1",
  questions: fullDeepQuestionSet,
  validation: {
    requireAtLeastOneOpenReflection: true,
    openReflectionQuestionIds: ["D015", "D016"],
  },
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
});

const assessmentRegistry: Record<Mode, Record<string, AssessmentDefinition>> = {
  lite: {
    [liteAssessmentDefinitionV1.version]: liteAssessmentDefinitionV1,
  },
  deep: {
    [deepAssessmentDefinitionV1.version]: deepAssessmentDefinitionV1,
  },
};


function toAssessmentDefinitionSnapshot(definition: AssessmentDefinition, isDefaultVersion: boolean): AssessmentDefinitionSnapshot {
  return {
    mode: definition.mode,
    version: definition.version,
    title: definition.title,
    description: definition.description,
    storageKey: definition.storageKey,
    totalSteps: definition.totalSteps,
    questionCount: definition.questions.length,
    openReflectionQuestionIds: definition.validation.openReflectionQuestionIds,
    modules: [...new Set(definition.questions.map((question) => question.moduleId))],
    phases: definition.phases.map((phase) => ({
      id: phase.id,
      label: phase.label,
      description: phase.description,
      moduleIds: phase.moduleIds,
      questionCount: definition.questions.filter((question) => phase.moduleIds.includes(question.moduleId)).length,
    })),
    questionIds: definition.questions.map((question) => question.questionId),
    isDefaultVersion,
  };
}

function diffStringLists(base: string[], target: string[]) {
  return {
    added: target.filter((item) => !base.includes(item)),
    removed: base.filter((item) => !target.includes(item)),
  };
}

const defaultAssessmentVersions: Record<Mode, string> = {
  lite: liteAssessmentDefinitionV1.version,
  deep: deepAssessmentDefinitionV1.version,
};

export const defaultAssessmentMode: Mode = "lite";

export function isAssessmentMode(value: string | null | undefined): value is Mode {
  return value === "lite" || value === "deep";
}

export function resolveAssessmentMode(value: string | null | undefined) {
  return isAssessmentMode(value) ? value : defaultAssessmentMode;
}

export function listAssessmentVersions(mode: Mode): AssessmentVersionDescriptor[] {
  return Object.values(assessmentRegistry[mode] ?? {}).map((definition) => ({
    mode: definition.mode,
    version: definition.version,
    title: definition.title,
    description: definition.description,
    totalSteps: definition.totalSteps,
    storageKey: definition.storageKey,
    phases: definition.phases,
    isDefault: defaultAssessmentVersions[mode] === definition.version,
  }));
}

export function resolveAssessmentVersion(mode: Mode, value: string | null | undefined) {
  const requested = value ?? defaultAssessmentVersions[mode];
  return assessmentRegistry[mode]?.[requested]?.version ?? defaultAssessmentVersions[mode];
}

export function listAssessmentDefinitions(mode?: Mode) {
  if (mode) {
    return Object.values(assessmentRegistry[mode] ?? {});
  }

  return (Object.keys(assessmentRegistry) as Mode[]).map((item) => getAssessmentDefinition(item));
}

export function getAssessmentDefinition(mode: Mode = defaultAssessmentMode, version?: string | null) {
  const resolvedVersion = resolveAssessmentVersion(mode, version);
  return assessmentRegistry[mode]?.[resolvedVersion] ?? assessmentRegistry[defaultAssessmentMode][defaultAssessmentVersions[defaultAssessmentMode]];
}



export function listAssessmentDefinitionSnapshots(mode?: Mode) {
  const modes = mode ? [mode] : (Object.keys(assessmentRegistry) as Mode[]);
  return modes.flatMap((item) =>
    Object.values(assessmentRegistry[item] ?? {}).map((definition) =>
      toAssessmentDefinitionSnapshot(definition, defaultAssessmentVersions[item] === definition.version),
    ),
  );
}

export function getAssessmentDefinitionSnapshot(mode: Mode, version?: string | null) {
  const definition = getAssessmentDefinition(mode, version);
  return toAssessmentDefinitionSnapshot(definition, defaultAssessmentVersions[mode] === definition.version);
}

export function diffAssessmentDefinitionSnapshots(mode: Mode, targetVersion: string, baseVersion?: string | null): AssessmentDefinitionDiff {
  const resolvedBaseVersion = resolveAssessmentVersion(mode, baseVersion ?? defaultAssessmentVersions[mode]);
  const baseSnapshot = getAssessmentDefinitionSnapshot(mode, resolvedBaseVersion);
  const targetSnapshot = getAssessmentDefinitionSnapshot(mode, targetVersion);
  const questionDiff = diffStringLists(baseSnapshot.questionIds, targetSnapshot.questionIds);
  const moduleDiff = diffStringLists(baseSnapshot.modules, targetSnapshot.modules);
  const openReflectionDiff = diffStringLists(baseSnapshot.openReflectionQuestionIds, targetSnapshot.openReflectionQuestionIds);
  const phaseDiff = diffStringLists(
    baseSnapshot.phases.map((phase) => phase.id),
    targetSnapshot.phases.map((phase) => phase.id),
  );
  const changedPhaseQuestionCounts = targetSnapshot.phases.flatMap((phase) => {
    const basePhase = baseSnapshot.phases.find((item) => item.id === phase.id);
    if (!basePhase || basePhase.questionCount === phase.questionCount) return [];
    return [{ phaseId: phase.id, from: basePhase.questionCount, to: phase.questionCount }];
  });

  return {
    mode,
    baseVersion: baseSnapshot.version,
    targetVersion: targetSnapshot.version,
    questionCountDelta: targetSnapshot.questionCount - baseSnapshot.questionCount,
    totalStepsDelta: targetSnapshot.totalSteps - baseSnapshot.totalSteps,
    storageKeyChanged: baseSnapshot.storageKey !== targetSnapshot.storageKey,
    addedQuestions: questionDiff.added,
    removedQuestions: questionDiff.removed,
    addedModules: moduleDiff.added,
    removedModules: moduleDiff.removed,
    addedOpenReflections: openReflectionDiff.added,
    removedOpenReflections: openReflectionDiff.removed,
    addedPhases: phaseDiff.added,
    removedPhases: phaseDiff.removed,
    changedPhaseQuestionCounts,
  };
}

export function validateAssessmentSubmission(mode: Mode, answers: Answer[], version?: string | null): AssessmentValidationResult {
  const definition = getAssessmentDefinition(mode, version);
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));
  const answersRecord = Object.fromEntries(answers.map((answer) => [answer.questionId, answer.value])) as AssessmentFormState["answers"];
  const requiredQuestions = definition.questions.filter((question) => !question.optional);
  const firstIncompleteQuestionIndex = findFirstIncompleteQuestionIndex(
    {
      ...definition,
      questions: requiredQuestions,
    },
    answersRecord,
  );

  const openReflectionAnswered = definition.validation.openReflectionQuestionIds.some((questionId) => {
    const answer = answerMap.get(questionId);
    return typeof answer?.value === "string" && answer.value.trim().length > 0;
  });

  if (firstIncompleteQuestionIndex >= 0 || (definition.validation.requireAtLeastOneOpenReflection && !openReflectionAnswered)) {
    const firstIncompleteQuestion = firstIncompleteQuestionIndex >= 0 ? requiredQuestions[firstIncompleteQuestionIndex] : null;

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
