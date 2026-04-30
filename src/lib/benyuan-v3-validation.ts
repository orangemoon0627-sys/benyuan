import { benyuanPart1Questions, benyuanQuestionsById } from "@/lib/benyuan-v3-schema";
import type { Part1AnswerMap } from "@/lib/benyuan-v3-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validatePart1Answers(answers: unknown) {
  if (!isRecord(answers)) {
    return { ok: false as const, error: "answers_must_be_object" };
  }

  for (const question of benyuanPart1Questions) {
    const value = answers[question.id];

    if ((question.kind === "single" || question.kind === "distribution") && value == null) {
      return { ok: false as const, error: `missing_${question.id}` };
    }

    if (question.kind === "single") {
      if (typeof value !== "string") return { ok: false as const, error: `invalid_${question.id}` };
      const valid = question.options?.some((option) => option.id === value);
      if (!valid) return { ok: false as const, error: `invalid_option_${question.id}` };
    }

    if (question.kind === "multi") {
      if (!Array.isArray(value)) return { ok: false as const, error: `invalid_${question.id}` };
      const selected = value.filter((item): item is string => typeof item === "string");
      if (question.minSelections && selected.length < question.minSelections) {
        return { ok: false as const, error: `insufficient_${question.id}` };
      }
      const validIds = new Set(question.options?.map((option) => option.id) ?? []);
      if (selected.some((item) => !validIds.has(item))) return { ok: false as const, error: `invalid_option_${question.id}` };
    }

    if (question.kind === "distribution") {
      if (!isRecord(value)) return { ok: false as const, error: `invalid_${question.id}` };
      const past = value.past;
      const present = value.present;
      const future = value.future;
      if ([past, present, future].some((item) => typeof item !== "number")) return { ok: false as const, error: `invalid_${question.id}` };
      if ((past as number) + (present as number) + (future as number) !== 100) {
        return { ok: false as const, error: "time_distribution_must_equal_100" };
      }
    }

    if (question.kind === "upload") {
      if (!Array.isArray(value)) return { ok: false as const, error: `invalid_${question.id}` };
      const min = question.uploadRange?.min ?? 1;
      const max = question.uploadRange?.max ?? min;
      if (value.length < min || value.length > max) {
        return { ok: false as const, error: `invalid_upload_count_${question.id}` };
      }
    }
  }

  return { ok: true as const, answers: answers as Part1AnswerMap };
}

export function summarizeSelectedOptions(answers: Part1AnswerMap) {
  return Object.fromEntries(
    Object.entries(answers).map(([questionId, value]) => {
      const question = benyuanQuestionsById[questionId];
      if (!question) return [questionId, value];
      if (question.kind === "single" && typeof value === "string") {
        const option = question.options?.find((item) => item.id === value);
        return [questionId, { id: value, text: option?.text ?? value }];
      }
      if (question.kind === "multi" && Array.isArray(value)) {
        return [
          questionId,
          value.map((optionId) => {
            const option = typeof optionId === "string" ? question.options?.find((item) => item.id === optionId) : undefined;
            return { id: optionId, text: option?.text ?? String(optionId) };
          }),
        ];
      }
      return [questionId, value];
    }),
  );
}
