import manifest from "@/lib/fixtures/benyuan-v3-test-packs.json";
import type { Part1AnswerMap } from "@/lib/benyuan-v3-types";

export type BenyuanTestPackAsset = {
  name: string;
  url: string;
};

export type BenyuanTestPack = {
  id: "A" | "B" | "C";
  name: string;
  archetype: string;
  description: string;
  answers: Part1AnswerMap;
  assets: {
    A2_music_analysis: BenyuanTestPackAsset[];
    C1_social_posts_analysis: BenyuanTestPackAsset[];
    C2_precious_photo_analysis: BenyuanTestPackAsset[];
  };
};

export const benyuanTestPacks = manifest as BenyuanTestPack[];

export const benyuanTestPacksById = Object.fromEntries(benyuanTestPacks.map((pack) => [pack.id, pack])) as Record<BenyuanTestPack["id"], BenyuanTestPack>;
