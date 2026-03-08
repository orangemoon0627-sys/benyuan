import { deepQuestionContent } from "./question-content-deep";
import { liteQuestionContent } from "./question-content-lite";
import { liteQuestionContentV2 } from "./question-content-lite-v2";
import type { QuestionDef } from "./types";

export const fullLiteQuestionSet: QuestionDef[] = liteQuestionContent;
export const fullLiteQuestionSetV2: QuestionDef[] = liteQuestionContentV2;
export const liteQuestionSet = fullLiteQuestionSet;

export const fullDeepQuestionSet: QuestionDef[] = deepQuestionContent;
export const deepQuestionSet = fullDeepQuestionSet;
