import { runMultimodalStageAnalysis } from "@/lib/benyuan-v3-agent";
import type { BenyuanUploadedAssetRef, MultimodalInputItem } from "@/lib/benyuan-v3-types";

function itemFromAsset(asset: BenyuanUploadedAssetRef): MultimodalInputItem {
  return {
    asset_id: asset.asset_id,
    source: asset.name,
    file_name: asset.name,
    mime_type: asset.mime_type,
    description: `${asset.question_id}:${asset.name}`,
  };
}

function stageForQuestion(questionId: string) {
  if (questionId === "A2_music_analysis") return "music";
  if (questionId === "C1_social_posts_analysis") return "social";
  if (questionId === "C2_precious_photo_analysis") return "photo";
  return null;
}

export function prewarmUploadedAssetMultimodalAnalysis(asset: BenyuanUploadedAssetRef) {
  const stage = stageForQuestion(asset.question_id);
  if (!stage) return;

  const item = itemFromAsset(asset);
  const input =
    stage === "music"
      ? { music_inputs: [item] }
      : stage === "social"
        ? { social_post_inputs: [item] }
        : { precious_photo_input: item };

  void runMultimodalStageAnalysis(stage, input).catch((error) => {
    console.error("[benyuan-multimodal-prewarm]", asset.asset_id, error);
  });
}
