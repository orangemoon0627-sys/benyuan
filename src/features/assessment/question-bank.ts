import { deepQuestionContent } from "./question-content-deep";
import { liteQuestionContent } from "./question-content-lite";
import type { QuestionDef } from "./types";

export const fullLiteQuestionSet: QuestionDef[] = liteQuestionContent;
export const liteQuestionSet = fullLiteQuestionSet;

export const fullDeepQuestionSet: QuestionDef[] = deepQuestionContent;
export const deepQuestionSet = fullDeepQuestionSet;
