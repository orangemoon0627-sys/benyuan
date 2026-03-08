import type { Mode } from "@/lib/types";

export type QuestionAnswerType = "single" | "multi" | "scale" | "text" | "rank" | "image_single" | "image_multi" | "audio_single";

export type QuestionMediaAsset = {
  kind: "image" | "audio";
  src: string;
  alt?: string;
  caption?: string;
};

export type QuestionOption = {
  id: string;
  label: string;
  description?: string;
  asset?: QuestionMediaAsset;
};

export type QuestionPresentation = {
  kind?: "text_options" | "image_grid" | "audio_scene" | "scale_steps" | "long_text" | "ranked_cards";
  columns?: 1 | 2 | 3;
  helperText?: string;
};

export type QuestionDef = {
  questionId: string;
  moduleId: string;
  answerType: QuestionAnswerType;
  prompt: string;
  options?: Array<string | QuestionOption>;
  minSelections?: number;
  maxSelections?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { low: string; high: string };
  optional?: boolean;
  presentation?: QuestionPresentation;
};

export type AssessmentAnswerValue = string | string[] | number;

export type AssessmentFormState = {
  lifeStage: string;
  moodKeywords: string[];
  answers: Record<string, AssessmentAnswerValue>;
};

export type AssessmentStepContext =
  | { mode: "entry" }
  | { mode: "question"; question: QuestionDef; questionIndex: number }
  | { mode: "review" };

export type AssessmentPhase = {
  id: string;
  label: string;
  description: string;
  moduleIds: string[];
};

export type AssessmentValidationConfig = {
  requireAtLeastOneOpenReflection: boolean;
  openReflectionQuestionIds: string[];
};

export type AssessmentVersionDescriptor = {
  mode: Mode;
  version: string;
  title: string;
  description: string;
  totalSteps: number;
  storageKey: string;
  phases: AssessmentPhase[];
  isDefault: boolean;
};

export type AssessmentDefinition = {
  mode: Mode;
  version: string;
  title: string;
  description: string;
  storageKey: string;
  moduleLabels: Record<string, string>;
  lifeStageOptions: readonly { value: string; label: string }[];
  moodKeywordOptions: readonly string[];
  questions: QuestionDef[];
  totalSteps: number;
  phases: AssessmentPhase[];
  initialState: AssessmentFormState;
  validation: AssessmentValidationConfig;
};


export type AssessmentPhaseSnapshot = {
  id: string;
  label: string;
  description: string;
  moduleIds: string[];
  questionCount: number;
};

export type AssessmentDefinitionSnapshot = {
  mode: Mode;
  version: string;
  title: string;
  description: string;
  storageKey: string;
  totalSteps: number;
  questionCount: number;
  openReflectionQuestionIds: string[];
  modules: string[];
  phases: AssessmentPhaseSnapshot[];
  questionIds: string[];
  isDefaultVersion: boolean;
};

export type AssessmentDefinitionDiff = {
  mode: Mode;
  baseVersion: string;
  targetVersion: string;
  questionCountDelta: number;
  totalStepsDelta: number;
  storageKeyChanged: boolean;
  addedQuestions: string[];
  removedQuestions: string[];
  addedModules: string[];
  removedModules: string[];
  addedOpenReflections: string[];
  removedOpenReflections: string[];
  addedPhases: string[];
  removedPhases: string[];
  changedPhaseQuestionCounts: Array<{
    phaseId: string;
    from: number;
    to: number;
  }>;
};
