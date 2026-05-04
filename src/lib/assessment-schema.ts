import type { AssessmentAnswerType, Mode } from "@/lib/types";

export type AssessmentSchemaAnswerValue = string | string[] | number;

export type AssessmentSchemaOption = {
  id: string;
  label: string;
  description?: string;
  asset?: {
    kind: "image" | "audio";
    src: string;
    alt?: string;
    caption?: string;
  };
};

export type AssessmentSchemaQuestionTypeMeta = {
  answerType: AssessmentAnswerType;
  family: "choice" | "scale" | "text" | "ranking";
  cardinality: "single" | "multi" | "scalar" | "ordered" | "freeform";
  webImplementation: "implemented" | "planned";
  defaultPresentation: "text_options" | "image_grid" | "audio_scene" | "scale_steps" | "long_text" | "ranked_cards";
};

export type AssessmentSchemaQuestion = {
  questionId: string;
  moduleId: string;
  answerType: AssessmentAnswerType;
  prompt: string;
  options?: AssessmentSchemaOption[];
  minSelections?: number;
  maxSelections?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { low: string; high: string };
  optional?: boolean;
  presentation?: {
    kind?: "text_options" | "image_grid" | "audio_scene" | "scale_steps" | "long_text" | "ranked_cards";
    columns?: 1 | 2 | 3;
    helperText?: string;
  };
  typeMeta: AssessmentSchemaQuestionTypeMeta;
};

export type AssessmentSchemaPhase = {
  id: string;
  label: string;
  description: string;
  moduleIds: string[];
};

export type AssessmentSchemaFormState = {
  lifeStage: string;
  moodKeywords: string[];
  answers: Record<string, AssessmentSchemaAnswerValue>;
};

export type AssessmentSchemaVersionDescriptor = {
  mode: Mode;
  version: string;
  title: string;
  description: string;
  totalSteps: number;
  storageKey: string;
  phases: AssessmentSchemaPhase[];
  isDefault: boolean;
};

export type AssessmentSchemaCompanionNote = {
  eyebrow: string;
  title: string;
  body: string;
};

export type AssessmentSchemaNativePresentationHints = {
  screenStyle: "entry_sheet" | "immersive_choice" | "focused_scale" | "reflection_editor" | "review_summary";
  accentTone: "mist" | "signal" | "memory" | "review";
  iosPreferredControl: "tag_picker" | "single_select_cards" | "multi_select_chips" | "stepper_scale" | "multiline_text" | "summary_list";
  iosPreferredTransition: "fade" | "push" | "cross_dissolve" | "blur_expand";
  responseLayout: "stack" | "grid_2" | "chips" | "slider" | "editor" | "summary";
  haptics: "none" | "selection" | "soft_impact";
  topBarStyle: "ambient_back" | "progress_header" | "summary_header";
  primaryActionStyle: "floating_capsule" | "pinned_footer_cta" | "immersive_submit";
  optionChrome: "mist_cards" | "ghost_chips" | "numbered_scale" | "journal_surface" | "summary_panels";
  backgroundTreatment: "breathing_mist" | "signal_glow" | "memory_fog" | "review_halo";
  motionPreset: "slow_breathe" | "guided_push" | "still_focus";
  spacingDensity: "airy" | "balanced" | "compact";
  keepPrimaryActionPinned: boolean;
  supportsLongformInput: boolean;
  recommendedInputMinHeight: number | null;
  recommendedSelectionCount: {
    min: number;
    max: number | null;
  } | null;
};

export type AssessmentSchemaFlowStep = {
  step: number;
  progress: number;
  kind: "entry" | "question" | "review";
  phaseId: string;
  phaseLabel: string;
  phaseDescription: string;
  moduleId: string;
  moduleLabel: string;
  questionId: string | null;
  questionIndex: number | null;
  questionCount: number;
  phaseStepIndex: number;
  phaseStepCount: number;
  previousStep: number | null;
  nextStep: number | null;
  answerType: AssessmentAnswerType | null;
  heroHeadline: string;
  title: string;
  description: string;
  ritualLine: string;
  companionNote: AssessmentSchemaCompanionNote;
  nativeHints: AssessmentSchemaNativePresentationHints;
};

export type AssessmentSchemaFlowContract = {
  pacing: {
    pattern: "single_question_progression";
    progressMetric: "step_index_ratio";
    supportsBackNavigation: boolean;
    supportsDraftPersistence: boolean;
    entryStep: number;
    firstQuestionStep: number;
    lastQuestionStep: number;
    reviewStep: number;
    questionStepCount: number;
  };
  review: {
    requireLifeStage: boolean;
    minimumMoodKeywords: number;
    requireAllRequiredQuestions: boolean;
    requiredOpenReflectionCount: number;
    openReflectionQuestionIds: string[];
    incompleteJumpStrategy: "first_incomplete_step";
  };
  steps: AssessmentSchemaFlowStep[];
};

export type AssessmentSchemaNativeContentBlock = "hero" | "progress" | "prompt" | "options" | "reflection" | "summary" | "companion_note";

export type AssessmentSchemaNativeBlueprint =
  | "entry_calibration"
  | "single_choice_ritual"
  | "multi_choice_ritual"
  | "scale_focus"
  | "reflection_journal"
  | "review_handoff";

export type AssessmentSchemaNativeScreen = {
  step: number;
  screenId: string;
  blueprint: AssessmentSchemaNativeBlueprint;
  headline: string;
  primaryPrompt: string;
  componentTokens: {
    topBarStyle: AssessmentSchemaNativePresentationHints["topBarStyle"];
    primaryActionStyle: AssessmentSchemaNativePresentationHints["primaryActionStyle"];
    optionChrome: AssessmentSchemaNativePresentationHints["optionChrome"];
  };
  interactionTokens: {
    control: AssessmentSchemaNativePresentationHints["iosPreferredControl"];
    transition: AssessmentSchemaNativePresentationHints["iosPreferredTransition"];
    layout: AssessmentSchemaNativePresentationHints["responseLayout"];
    haptics: AssessmentSchemaNativePresentationHints["haptics"];
  };
  atmosphereTokens: {
    accentTone: AssessmentSchemaNativePresentationHints["accentTone"];
    backgroundTreatment: AssessmentSchemaNativePresentationHints["backgroundTreatment"];
    motionPreset: AssessmentSchemaNativePresentationHints["motionPreset"];
    spacingDensity: AssessmentSchemaNativePresentationHints["spacingDensity"];
  };
  contentBlocks: AssessmentSchemaNativeContentBlock[];
  primaryActionLabel: string;
  supportsProgressJump: boolean;
};

export type AssessmentSchemaNativeBlueprintProp = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

export type AssessmentSchemaNativeBlueprintChecklist = {
  key: string;
  label: string;
  doneWhen: string;
};

export type AssessmentSchemaNativeBlueprintContract = {
  blueprint: AssessmentSchemaNativeBlueprint;
  recommendedComponentName: string;
  recommendedContainer: "immersive_scroll_shell" | "focus_scroll_shell" | "summary_scroll_shell";
  primaryInputSlot: "entry_tag_stack" | "choice_card_stack" | "choice_chip_cloud" | "scale_stepper" | "journal_editor" | "summary_review_list";
  footerSlot: "floating_continue" | "sticky_continue" | "immersive_submit";
  requiredBlocks: AssessmentSchemaNativeContentBlock[];
  optionalBlocks: AssessmentSchemaNativeContentBlock[];
  propsContract: AssessmentSchemaNativeBlueprintProp[];
  implementationChecklist: AssessmentSchemaNativeBlueprintChecklist[];
  implementationNotes: string[];
};

export type AssessmentSchemaNativeMap = {
  platform: "ios";
  screenMap: AssessmentSchemaNativeScreen[];
  blueprintSequence: AssessmentSchemaNativeBlueprint[];
  blueprintCatalog: AssessmentSchemaNativeBlueprintContract[];
};

export type AssessmentSchemaDefinition = {
  status: "ok";
  mode: Mode;
  version: string;
  title: string;
  description: string;
  storageKey: string;
  initialState: AssessmentSchemaFormState;
  totalSteps: number;
  phases: AssessmentSchemaPhase[];
  moduleLabels: Record<string, string>;
  lifeStageOptions: readonly { value: string; label: string }[];
  moodKeywordOptions: readonly string[];
  questionTypes: AssessmentSchemaQuestionTypeMeta[];
  questions: AssessmentSchemaQuestion[];
  validation: {
    requireAtLeastOneOpenReflection: boolean;
    openReflectionQuestionIds: string[];
  };
  flow: AssessmentSchemaFlowContract;
  native: AssessmentSchemaNativeMap;
  availableVersions: AssessmentSchemaVersionDescriptor[];
  availableModes: Array<{
    mode: Mode;
    activeVersion: string;
    title: string;
    description: string;
    totalSteps: number;
    phases: AssessmentSchemaPhase[];
    versions: AssessmentSchemaVersionDescriptor[];
  }>;
};

export type AssessmentSchemaStepContext =
  | { mode: "entry" }
  | { mode: "question"; question: AssessmentSchemaQuestion; questionIndex: number }
  | { mode: "review" };

export function resolveAssessmentSchemaMode(value: string | null | undefined): Mode {
  return value === "deep" ? "deep" : "lite";
}

export function resolveAssessmentSchemaVersion(value: string | null | undefined) {
  return value?.trim() ? value : null;
}

export function getAssessmentSchemaStepContext(definition: Pick<AssessmentSchemaDefinition, "questions" | "totalSteps">, step: number): AssessmentSchemaStepContext {
  if (step === 0) return { mode: "entry" };
  if (step === definition.totalSteps - 1) return { mode: "review" };
  return { mode: "question", question: definition.questions[step - 1], questionIndex: step - 1 };
}

export function getAssessmentSchemaModuleLabel(definition: Pick<AssessmentSchemaDefinition, "moduleLabels">, moduleId: string) {
  return definition.moduleLabels[moduleId] ?? moduleId;
}

function isEffectivelyEmptyValue(value: AssessmentSchemaAnswerValue | undefined) {
  if (value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function getSchemaDefaultAnswerValue(question: AssessmentSchemaQuestion): AssessmentSchemaAnswerValue {
  if (question.answerType === "multi" || question.answerType === "image_multi" || question.answerType === "rank") {
    return [];
  }

  if (question.answerType === "scale") {
    return question.scaleMin ?? 1;
  }

  return "";
}

export function isAssessmentSchemaQuestionAnswered(question: AssessmentSchemaQuestion, answers: Record<string, AssessmentSchemaAnswerValue>) {
  const value = answers[question.questionId];

  if (question.optional && isEffectivelyEmptyValue(value)) {
    return true;
  }

  if (question.typeMeta.cardinality === "multi" || question.typeMeta.cardinality === "ordered") {
    const count = Array.isArray(value) ? value.length : 0;
    return count >= (question.minSelections ?? (question.typeMeta.cardinality === "ordered" ? 2 : 1));
  }

  if (question.typeMeta.family === "scale") {
    return typeof value === "number";
  }

  return typeof value === "string" && value.trim().length > 0;
}

export function hasDraftableAssessmentSchemaProgress(definition: AssessmentSchemaDefinition, step: number, state: AssessmentSchemaFormState) {
  if (step > 0) return true;
  if (state.lifeStage !== definition.initialState.lifeStage) return true;
  if (state.moodKeywords.length !== definition.initialState.moodKeywords.length) return true;
  return state.moodKeywords.some((keyword, index) => keyword !== definition.initialState.moodKeywords[index]);
}
