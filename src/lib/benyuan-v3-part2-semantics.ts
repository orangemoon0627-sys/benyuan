import type { Part2ChoiceRecord, Part2Record, TheaterScriptRecord } from "@/lib/benyuan-v3-types";

function meaningfulSnapshot(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function restoreChoice(choice: Part2ChoiceRecord, theaterRecord: TheaterScriptRecord) {
  const scriptedRound = theaterRecord.theater_script.act2.choices.find(
    (item) => item.choice_id === choice.choice_id,
  );
  const scriptedOption = scriptedRound?.options.find((item) => item.id === choice.selected);
  if (!scriptedOption) return choice;

  const optionText = meaningfulSnapshot(choice.option_text) ?? meaningfulSnapshot(scriptedOption.text);
  const traitSignal = meaningfulSnapshot(choice.trait_signal) ?? meaningfulSnapshot(scriptedOption.trait_signal);
  const optionResponse = meaningfulSnapshot(choice.option_response) ?? meaningfulSnapshot(scriptedOption.response);
  if (
    optionText === choice.option_text &&
    traitSignal === choice.trait_signal &&
    optionResponse === choice.option_response
  ) {
    return choice;
  }

  return {
    ...choice,
    option_text: optionText,
    trait_signal: traitSignal,
    option_response: optionResponse,
  };
}

export function restorePart2ChoiceSemantics(
  part2: Part2Record,
  theaterRecord: TheaterScriptRecord | undefined,
): Part2Record {
  if (
    !theaterRecord ||
    theaterRecord.theater_script_id !== part2.theater_script_id ||
    theaterRecord.part1_id !== part2.part1_id
  ) {
    return part2;
  }

  let changed = false;
  const act2Choices = part2.act2_choices.map((choice) => {
    const restored = restoreChoice(choice, theaterRecord);
    changed ||= restored !== choice;
    return restored;
  });

  return changed ? { ...part2, act2_choices: act2Choices } : part2;
}
