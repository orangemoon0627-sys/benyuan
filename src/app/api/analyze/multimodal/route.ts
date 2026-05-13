import { NextResponse } from "next/server";
import { assertPart1Owner } from "@/lib/benyuan-auth";
import { classifyBenyuanMultimodalCacheStatus, recordBenyuanAgentTiming } from "@/lib/benyuan-agent-timing";
import { aggregateTraitsFromPart1 } from "@/lib/benyuan-v3-engine";
import { runMultimodalAnalysis } from "@/lib/benyuan-v3-agent";
import { getPart1Record, savePart1Record } from "@/lib/benyuan-v3-store";
import type {
  BenyuanUploadedAssetRef,
  MultimodalAnalysisInput,
  MultimodalInputItem,
  MusicAnalysis,
  PreciousPhotoAnalysis,
  SocialPostAnalysis,
  SocialPostOverallPattern,
} from "@/lib/benyuan-v3-types";

function refsFromAnswer(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is BenyuanUploadedAssetRef =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as BenyuanUploadedAssetRef).asset_id === "string" &&
      typeof (item as BenyuanUploadedAssetRef).question_id === "string",
  );
}

function itemsFromRefs(refs: BenyuanUploadedAssetRef[], fallbackItems: MultimodalInputItem[] = []) {
  if (refs.length === 0) return fallbackItems;
  return refs.map((ref) => ({
    asset_id: ref.asset_id,
    source: ref.name,
    file_name: ref.name,
    mime_type: ref.mime_type,
    description: `${ref.question_id}:${ref.name}`,
  }));
}

export async function POST(request: Request) {
  const body = (await request.json()) as MultimodalAnalysisInput;
  if (!body.part1_id) {
    return NextResponse.json({ error: "missing_part1_id" }, { status: 400 });
  }

  const record = await getPart1Record(body.part1_id);
  if (!record) {
    return NextResponse.json({ error: "part1_not_found" }, { status: 404 });
  }
  const ownership = await assertPart1Owner(request, record);
  if (!ownership.ok) {
    return NextResponse.json({ error: ownership.error }, { status: ownership.status });
  }

  const musicRefs = refsFromAnswer(record.answers.A2_music_analysis);
  const socialRefs = refsFromAnswer(record.answers.C1_social_posts_analysis);
  const photoRefs = refsFromAnswer(record.answers.C2_precious_photo_analysis);

  const startedAt = Date.now();
  const analysis = await runMultimodalAnalysis(
    {
      music_inputs: itemsFromRefs(musicRefs, body.music_inputs),
      social_post_inputs: itemsFromRefs(socialRefs, body.social_post_inputs),
      precious_photo_input: photoRefs[0]
        ? {
            asset_id: photoRefs[0].asset_id,
            source: photoRefs[0].name,
            file_name: photoRefs[0].name,
            mime_type: photoRefs[0].mime_type,
            description: `${photoRefs[0].question_id}:${photoRefs[0].name}`,
          }
        : body.precious_photo_input,
    },
    body.runtime_override,
  );
  const timing = await recordBenyuanAgentTiming({
    stage: "multimodal",
    duration_ms: Date.now() - startedAt,
    runtime_mode: analysis.runtime.mode,
    provider: analysis.runtime.provider,
    model: analysis.runtime.model,
    error: analysis.runtime.error,
    request_id: analysis.runtime.request_id,
    part1_id: record.part1_id,
    ...classifyBenyuanMultimodalCacheStatus(analysis.runtime.error, {
      music: musicRefs.length,
      social: socialRefs.length,
      photo: photoRefs.length,
    }),
  });

  const updated = {
    ...record,
    updated_at: new Date().toISOString(),
    part1_data: {
      ...record.part1_data,
      aesthetics: {
        ...record.part1_data.aesthetics,
        music_analysis: analysis.result.music_analysis as MusicAnalysis,
      },
      narrative: {
        ...record.part1_data.narrative,
        social_posts_analysis: analysis.result.social_posts_analysis as SocialPostAnalysis[],
        social_posts_overall_pattern: analysis.result.social_posts_overall_pattern as SocialPostOverallPattern,
        precious_photo_analysis: analysis.result.precious_photo_analysis as PreciousPhotoAnalysis,
      },
    },
  };

  updated.aggregated_traits = aggregateTraitsFromPart1(updated.answers, updated.part1_data);
  await savePart1Record(updated);

  return NextResponse.json({
    part1_id: updated.part1_id,
    runtime: analysis.runtime,
    asset_counts: {
      music: musicRefs.length,
      social: socialRefs.length,
      photo: photoRefs.length,
    },
    timing,
    music_analysis: updated.part1_data.aesthetics.music_analysis,
    social_posts_analysis: updated.part1_data.narrative.social_posts_analysis,
    social_posts_overall_pattern: updated.part1_data.narrative.social_posts_overall_pattern,
    precious_photo_analysis: updated.part1_data.narrative.precious_photo_analysis,
    aggregated_traits: updated.aggregated_traits,
  });
}
