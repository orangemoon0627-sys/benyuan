import { readAnalysisRuntimeConfig } from "@/lib/analysis/config";
import { resolveAnalysisPromptTemplate } from "@/lib/analysis/prompt-templates";
import type { AnalysisInput, AnalysisPromptShapingResult } from "@/lib/analysis/types";

function stringifyAnswer(value: string | string[] | number) {
  if (Array.isArray(value)) return value.join(" / ");
  return String(value);
}

export function buildAnalysisPromptPayload(input: AnalysisInput): AnalysisPromptShapingResult {
  const runtimeConfig = readAnalysisRuntimeConfig(input.session.mode);
  const template = resolveAnalysisPromptTemplate(runtimeConfig.selectedPromptTemplateKey);
  const answered = input.session.answers.filter((answer) => {
    if (typeof answer.value === "string") return answer.value.trim().length > 0;
    if (Array.isArray(answer.value)) return answer.value.length > 0;
    return typeof answer.value === "number";
  });

  const topSignals = answered.slice(0, 6).map((answer) => `${answer.questionId}:${stringifyAnswer(answer.value)}`);
  const openReflectionCount = input.openReflectionQuestionIds
    .map((questionId) => input.session.answers.find((answer) => answer.questionId === questionId))
    .filter((answer) => typeof answer?.value === "string" && answer.value.trim().length > 0)
    .length;

  return {
    template: {
      id: template.id,
      version: template.version,
      label: template.label,
    },
    payload: {
      system: `${template.system}

Guidance:
- ${template.guidance.join("\n- ")}`,
      user: JSON.stringify(
        {
          mode: input.session.mode,
          sessionId: input.session.sessionId,
          basicInfo: input.session.basicInfo,
          openReflectionQuestionIds: input.openReflectionQuestionIds,
          answers: answered.map((answer) => ({
            questionId: answer.questionId,
            moduleId: answer.moduleId,
            answerType: answer.answerType,
            prompt: input.questionMap.get(answer.questionId)?.prompt ?? answer.questionId,
            value: answer.value,
          })),
        },
        null,
        2,
      ),
      metadata: {
        templateId: template.id,
        templateVersion: template.version,
        mode: input.session.mode,
        sessionId: input.session.sessionId,
        questionCount: input.questionSet.length,
        openReflectionQuestionIds: input.openReflectionQuestionIds,
      },
    },
    summary: {
      answeredCount: answered.length,
      openReflectionCount,
      topSignals,
    },
  };
}
