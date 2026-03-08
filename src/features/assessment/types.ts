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
