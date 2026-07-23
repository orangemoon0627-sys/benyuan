import { benyuanPart1Questions, benyuanQuestionsById } from "@/lib/benyuan-v3-schema";
import type { Part1AnswerMap, Part2ChoiceRecord, TheaterScript } from "@/lib/benyuan-v3-types";

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

export function validateAndSnapshotPart2Choices(theaterScript: TheaterScript, submitted: unknown) {
  if (!Array.isArray(submitted)) {
    return { ok: false as const, error: "act2_choices_must_be_array" };
  }

  const expectedChoices = theaterScript.act2.choices.slice(0, 4);
  if (submitted.length < expectedChoices.length) {
    return {
      ok: false as const,
      error: "incomplete_theater_act2_choices",
      required: expectedChoices.length,
      received: submitted.length,
    };
  }
  if (submitted.length !== expectedChoices.length) {
    return {
      ok: false as const,
      error: "invalid_theater_act2_choice_count",
      required: expectedChoices.length,
      received: submitted.length,
    };
  }

  const byChoiceId = new Map<number, Record<string, unknown>>();
  for (const raw of submitted) {
    if (!isRecord(raw) || typeof raw.choice_id !== "number" || !Number.isInteger(raw.choice_id)) {
      return { ok: false as const, error: "invalid_theater_act2_choice" };
    }
    if (byChoiceId.has(raw.choice_id)) {
      return { ok: false as const, error: "duplicate_theater_act2_choice", choice_id: raw.choice_id };
    }
    byChoiceId.set(raw.choice_id, raw);
  }

  const choices: Part2ChoiceRecord[] = [];
  for (const expected of expectedChoices) {
    const raw = byChoiceId.get(expected.choice_id);
    if (!raw) {
      return { ok: false as const, error: "missing_theater_act2_round", choice_id: expected.choice_id };
    }
    if (typeof raw.selected !== "string" || typeof raw.timestamp !== "string" || raw.timestamp.trim().length === 0) {
      return { ok: false as const, error: "invalid_theater_act2_choice", choice_id: expected.choice_id };
    }
    const option = expected.options.find((item) => item.id === raw.selected);
    if (!option) {
      return {
        ok: false as const,
        error: "invalid_theater_act2_option",
        choice_id: expected.choice_id,
        selected: raw.selected,
      };
    }
    if (raw.hesitation_time != null && (typeof raw.hesitation_time !== "number" || !Number.isFinite(raw.hesitation_time) || raw.hesitation_time < 0)) {
      return { ok: false as const, error: "invalid_theater_hesitation_time", choice_id: expected.choice_id };
    }
    if (raw.hover_sequence != null && (!Array.isArray(raw.hover_sequence) || raw.hover_sequence.some((item) => typeof item !== "string"))) {
      return { ok: false as const, error: "invalid_theater_hover_sequence", choice_id: expected.choice_id };
    }

    choices.push({
      choice_id: expected.choice_id,
      selected: option.id,
      option_text: option.text,
      trait_signal: option.trait_signal,
      option_response: option.response,
      hesitation_time: typeof raw.hesitation_time === "number" ? raw.hesitation_time : undefined,
      hover_sequence: Array.isArray(raw.hover_sequence) ? raw.hover_sequence as string[] : undefined,
      timestamp: raw.timestamp,
    });
  }

  return { ok: true as const, choices };
}
