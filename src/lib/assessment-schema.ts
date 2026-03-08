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
