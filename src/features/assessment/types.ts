import type { Mode } from "@/lib/types";

export type QuestionAnswerType = "single" | "multi" | "scale" | "text";

export type QuestionDef = {
  questionId: string;
  moduleId: string;
  answerType: QuestionAnswerType;
  prompt: string;
  options?: string[];
  minSelections?: number;
  maxSelections?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { low: string; high: string };
  optional?: boolean;
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

export type AssessmentDefinition = {
  mode: Mode;
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
