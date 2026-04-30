import { NextResponse } from "next/server";
import { aggregateTraitsFromPart1, buildPart1DataFromAnswers } from "@/lib/benyuan-v3-engine";
import { createBenyuanV3Id, savePart1Record } from "@/lib/benyuan-v3-store";
import { summarizeSelectedOptions, validatePart1Answers } from "@/lib/benyuan-v3-validation";
import type { Part1SubmissionInput } from "@/lib/benyuan-v3-types";

export async function POST(request: Request) {
  const body = (await request.json()) as Part1SubmissionInput;
  const validation = validatePart1Answers(body.answers);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const part1Data = buildPart1DataFromAnswers(validation.answers);
  const aggregatedTraits = aggregateTraitsFromPart1(validation.answers, part1Data);
  const now = new Date().toISOString();
  const record = {
    part1_id: createBenyuanV3Id("part1"),
    user_id: body.user_id ?? "usr_local",
    created_at: now,
    updated_at: now,
    answers: validation.answers,
    part1_data: part1Data,
    aggregated_traits: aggregatedTraits,
  };

  await savePart1Record(record);

  return NextResponse.json({
    part1_id: record.part1_id,
    user_id: record.user_id,
    selected_options: summarizeSelectedOptions(record.answers),
    part1_data: record.part1_data,
    aggregated_traits: record.aggregated_traits,
    pending_multimodal: ["A2_music_analysis", "C1_social_posts_analysis", "C2_precious_photo_analysis"],
  });
}
