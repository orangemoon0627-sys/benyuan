import { assessmentDefaultValidation, assessmentBaseInitialState, assessmentVersionManifests } from "@/config/assessment/version-manifests";
import { buildAssessmentFlowContract, buildAssessmentNativeScreenMap } from "@/lib/assessment-client-contract";
import type { Mode, Answer } from "@/lib/types";
import { assessmentModuleLabels, lifeStageOptions, moodKeywordOptions } from "./catalog";
import { findFirstIncompleteQuestionIndex } from "./flow";
import { serializeAssessmentQuestion } from "./question-types";
import { fullDeepQuestionSet, fullLiteQuestionSet, fullLiteQuestionSetV2 } from "./question-bank";
import type {
  AssessmentDefinition,
  AssessmentDefinitionDiff,
  AssessmentDefinitionSnapshot,
  AssessmentFlowDiff,
  AssessmentFlowSnapshot,
  AssessmentFormState,
  AssessmentNativeBlueprintDiff,
  AssessmentNativeBlueprintSnapshot,
  AssessmentValidationConfig,
  AssessmentVersionDescriptor,
} from "./types";

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

const assessmentQuestionSets = {
  "lite.v1": fullLiteQuestionSet,
  "lite.v2": fullLiteQuestionSetV2,
  "deep.v1": fullDeepQuestionSet,
} as const;

function createAssessmentDefinition(config: {
  mode: Mode;
  version: string;
  title: string;
  description: string;
  storageKey: string;
  questionSetKey: keyof typeof assessmentQuestionSets;
  initialState?: AssessmentFormState;
  validation?: AssessmentValidationConfig;
  phases: AssessmentDefinition["phases"];
}) {
  const questions = assessmentQuestionSets[config.questionSetKey] ?? fullLiteQuestionSet;
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
    initialState: config.initialState ?? assessmentBaseInitialState,
    validation: config.validation ?? assessmentDefaultValidation,
  };

  return definition;
}

const assessmentRegistry = assessmentVersionManifests.reduce<Record<Mode, Record<string, AssessmentDefinition>>>(
  (accumulator, manifest) => {
    const definition = createAssessmentDefinition(manifest);
    const modeBucket = accumulator[manifest.mode] ?? {};

    return {
      ...accumulator,
      [manifest.mode]: {
        ...modeBucket,
        [definition.version]: definition,
      },
    };
  },
  { lite: {}, deep: {} },
);

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

function getNativeTokenBundle(step: ReturnType<typeof buildAssessmentFlowContract>["steps"][number]) {
  return [
    step.nativeHints.topBarStyle,
    step.nativeHints.primaryActionStyle,
    step.nativeHints.optionChrome,
    step.nativeHints.backgroundTreatment,
    step.nativeHints.motionPreset,
    step.nativeHints.spacingDensity,
  ].join("/");
}

function diffStringLists(base: string[], target: string[]) {
  return {
    added: target.filter((item) => !base.includes(item)),
    removed: base.filter((item) => !target.includes(item)),
  };
}

function toAssessmentFlowSnapshot(definition: AssessmentDefinition): AssessmentFlowSnapshot {
  const flow = buildAssessmentFlowContract({
    totalSteps: definition.totalSteps,
    phases: definition.phases,
    questions: definition.questions.map((question) => serializeAssessmentQuestion(question)),
    validation: definition.validation,
    moduleLabels: definition.moduleLabels,
  });
  const questionSteps = flow.steps.filter((step) => step.kind === "question");
  const firstQuestion = questionSteps[0] ?? null;
  const reviewStep = flow.steps.find((step) => step.kind === "review") ?? null;

  return {
    mode: definition.mode,
    version: definition.version,
    pacing: { ...flow.pacing },
    review: { ...flow.review },
    stepKeys: flow.steps.map((step) => `${step.kind}:${step.phaseId}:${step.questionId ?? "none"}`),
    firstQuestionTitle: firstQuestion?.title ?? null,
    reviewTitle: reviewStep?.title ?? null,
    firstQuestionNativeControl: firstQuestion?.nativeHints.iosPreferredControl ?? null,
    reviewNativeControl: reviewStep?.nativeHints.iosPreferredControl ?? null,
    firstQuestionTokenBundle: firstQuestion ? getNativeTokenBundle(firstQuestion) : null,
    reviewTokenBundle: reviewStep ? getNativeTokenBundle(reviewStep) : null,
  };
}

function toAssessmentNativeBlueprintSnapshot(definition: AssessmentDefinition): AssessmentNativeBlueprintSnapshot {
  const flow = buildAssessmentFlowContract({
    totalSteps: definition.totalSteps,
    phases: definition.phases,
    questions: definition.questions.map((question) => serializeAssessmentQuestion(question)),
    validation: definition.validation,
    moduleLabels: definition.moduleLabels,
  });
  const native = buildAssessmentNativeScreenMap(flow);

  return {
    mode: definition.mode,
    version: definition.version,
    blueprintSequence: native.blueprintSequence,
    blueprintIds: native.blueprintCatalog.map((item) => item.blueprint),
    catalog: native.blueprintCatalog.map((item) => ({
      blueprint: item.blueprint,
      recommendedComponentName: item.recommendedComponentName,
      recommendedContainer: item.recommendedContainer,
      primaryInputSlot: item.primaryInputSlot,
      footerSlot: item.footerSlot,
      requiredBlocks: item.requiredBlocks,
      optionalBlocks: item.optionalBlocks,
      propsContractKeys: item.propsContract.map((prop) => prop.name),
      checklistKeys: item.implementationChecklist.map((check) => check.key),
    })),
  };
}

const defaultAssessmentVersions: Record<Mode, string> = {
  lite: assessmentVersionManifests.find((item) => item.mode === "lite" && item.isDefault)?.version ?? "lite.v1",
  deep: assessmentVersionManifests.find((item) => item.mode === "deep" && item.isDefault)?.version ?? "deep.v1",
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

export function getAssessmentFlowSnapshot(mode: Mode, version?: string | null) {
  const definition = getAssessmentDefinition(mode, version);
  return toAssessmentFlowSnapshot(definition);
}

export function getAssessmentNativeBlueprintSnapshot(mode: Mode, version?: string | null) {
  const definition = getAssessmentDefinition(mode, version);
  return toAssessmentNativeBlueprintSnapshot(definition);
}

export function diffAssessmentNativeBlueprintSnapshots(mode: Mode, targetVersion: string, baseVersion?: string | null): AssessmentNativeBlueprintDiff {
  const resolvedBaseVersion = resolveAssessmentVersion(mode, baseVersion ?? defaultAssessmentVersions[mode]);
  const baseSnapshot = getAssessmentNativeBlueprintSnapshot(mode, resolvedBaseVersion);
  const targetSnapshot = getAssessmentNativeBlueprintSnapshot(mode, targetVersion);
  const blueprintDiff = diffStringLists(baseSnapshot.blueprintIds, targetSnapshot.blueprintIds);
  const sequenceDiff = diffStringLists(baseSnapshot.blueprintSequence, targetSnapshot.blueprintSequence);
  const comparableSequenceSteps = Math.min(baseSnapshot.blueprintSequence.length, targetSnapshot.blueprintSequence.length);
  const changedSequenceSteps = Array.from({ length: comparableSequenceSteps }, (_, step) => {
    const from = baseSnapshot.blueprintSequence[step];
    const to = targetSnapshot.blueprintSequence[step];
    if (from === to) return null;
    return { step, from, to };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const changedBlueprintContracts = targetSnapshot.catalog.flatMap((contract) => {
    const baseContract = baseSnapshot.catalog.find((item) => item.blueprint === contract.blueprint);
    if (!baseContract) return [];

    const changedKeys = [
      baseContract.recommendedComponentName === contract.recommendedComponentName ? null : "recommendedComponentName",
      baseContract.recommendedContainer === contract.recommendedContainer ? null : "recommendedContainer",
      baseContract.primaryInputSlot === contract.primaryInputSlot ? null : "primaryInputSlot",
      baseContract.footerSlot === contract.footerSlot ? null : "footerSlot",
      JSON.stringify(baseContract.requiredBlocks) === JSON.stringify(contract.requiredBlocks) ? null : "requiredBlocks",
      JSON.stringify(baseContract.optionalBlocks) === JSON.stringify(contract.optionalBlocks) ? null : "optionalBlocks",
    ].filter((value): value is string => Boolean(value));

    return changedKeys.length > 0 ? [{ blueprint: contract.blueprint, changedKeys }] : [];
  });

  return {
    mode,
    baseVersion: baseSnapshot.version,
    targetVersion: targetSnapshot.version,
    addedBlueprints: blueprintDiff.added,
    removedBlueprints: blueprintDiff.removed,
    addedSequenceBlueprints: sequenceDiff.added,
    removedSequenceBlueprints: sequenceDiff.removed,
    changedSequenceSteps,
    changedBlueprintContracts,
  };
}

export function diffAssessmentFlowSnapshots(mode: Mode, targetVersion: string, baseVersion?: string | null): AssessmentFlowDiff {
  const resolvedBaseVersion = resolveAssessmentVersion(mode, baseVersion ?? defaultAssessmentVersions[mode]);
  const baseSnapshot = getAssessmentFlowSnapshot(mode, resolvedBaseVersion);
  const targetSnapshot = getAssessmentFlowSnapshot(mode, targetVersion);
  const baseDefinition = getAssessmentDefinition(mode, resolvedBaseVersion);
  const targetDefinition = getAssessmentDefinition(mode, targetVersion);
  const baseFlow = buildAssessmentFlowContract({
    totalSteps: baseDefinition.totalSteps,
    phases: baseDefinition.phases,
    questions: baseDefinition.questions.map((question) => serializeAssessmentQuestion(question)),
    validation: baseDefinition.validation,
    moduleLabels: baseDefinition.moduleLabels,
  });
  const targetFlow = buildAssessmentFlowContract({
    totalSteps: targetDefinition.totalSteps,
    phases: targetDefinition.phases,
    questions: targetDefinition.questions.map((question) => serializeAssessmentQuestion(question)),
    validation: targetDefinition.validation,
    moduleLabels: targetDefinition.moduleLabels,
  });

  const pacingChangedKeys = Object.keys(baseSnapshot.pacing).filter(
    (key) => baseSnapshot.pacing[key as keyof typeof baseSnapshot.pacing] !== targetSnapshot.pacing[key as keyof typeof targetSnapshot.pacing],
  );
  const reviewChangedKeys = Object.keys(baseSnapshot.review).filter(
    (key) => JSON.stringify(baseSnapshot.review[key as keyof typeof baseSnapshot.review]) !== JSON.stringify(targetSnapshot.review[key as keyof typeof targetSnapshot.review]),
  );
  const addedRemovedStepKeys = diffStringLists(baseSnapshot.stepKeys, targetSnapshot.stepKeys);
  const comparableSteps = Math.min(baseFlow.steps.length, targetFlow.steps.length);

  const changedStepPhaseIds = Array.from({ length: comparableSteps }, (_, step) => {
    const baseStep = baseFlow.steps[step];
    const targetStep = targetFlow.steps[step];
    if (!baseStep || !targetStep || baseStep.phaseId === targetStep.phaseId) return null;
    return { step, from: baseStep.phaseId, to: targetStep.phaseId };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const changedStepQuestionIds = Array.from({ length: comparableSteps }, (_, step) => {
    const baseStep = baseFlow.steps[step];
    const targetStep = targetFlow.steps[step];
    if (!baseStep || !targetStep || baseStep.questionId === targetStep.questionId) return null;
    return { step, from: baseStep.questionId, to: targetStep.questionId };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const changedStepTitles = Array.from({ length: comparableSteps }, (_, step) => {
    const baseStep = baseFlow.steps[step];
    const targetStep = targetFlow.steps[step];
    if (!baseStep || !targetStep || baseStep.title === targetStep.title) return null;
    return { step, from: baseStep.title, to: targetStep.title };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const changedStepNativeControls = Array.from({ length: comparableSteps }, (_, step) => {
    const baseStep = baseFlow.steps[step];
    const targetStep = targetFlow.steps[step];
    if (!baseStep || !targetStep || baseStep.nativeHints.iosPreferredControl === targetStep.nativeHints.iosPreferredControl) return null;
    return { step, from: baseStep.nativeHints.iosPreferredControl, to: targetStep.nativeHints.iosPreferredControl };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const changedStepTokenBundles = Array.from({ length: comparableSteps }, (_, step) => {
    const baseStep = baseFlow.steps[step];
    const targetStep = targetFlow.steps[step];
    const baseBundle = getNativeTokenBundle(baseStep);
    const targetBundle = getNativeTokenBundle(targetStep);
    if (!baseStep || !targetStep || baseBundle === targetBundle || !baseBundle || !targetBundle) return null;
    return { step, from: baseBundle, to: targetBundle };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    mode,
    baseVersion: baseSnapshot.version,
    targetVersion: targetSnapshot.version,
    pacingChangedKeys,
    reviewChangedKeys,
    addedStepKeys: addedRemovedStepKeys.added,
    removedStepKeys: addedRemovedStepKeys.removed,
    changedStepPhaseIds,
    changedStepQuestionIds,
    changedStepTitles,
    changedStepNativeControls,
    changedStepTokenBundles,
  };
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
