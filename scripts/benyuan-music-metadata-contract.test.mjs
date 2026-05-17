import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import path from "node:path";
import { pathToFileURL } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const targetPath = path.resolve("src", specifier.slice(2));
      const resolvedPath = existsSync(targetPath) ? targetPath : `${targetPath}.ts`;
      return nextResolve(pathToFileURL(resolvedPath).href, context);
    }

    return nextResolve(specifier, context);
  },
});

const { buildMusicLookupTracks, enrichMusicAnalysisWithPublicMetadata } = await import("../src/lib/benyuan-music-metadata.ts");

test("music metadata lookup only derives public song candidates from music inputs", () => {
  const tracks = buildMusicLookupTracks(
    {
      primary_genres: ["indie"],
      emotional_tone: "reflective_open",
      era_distribution: {},
      language_diversity: ["english"],
      personality_signals: {},
      recognized_tracks: [{ title: "Nude", artist: "Radiohead", confidence: "high" }],
    },
    [
      { visible_text: "深夜的海像一封没有寄出的信。", source: "social-private.png" },
      { description: "C2_precious_photo_analysis:private-photo.jpg" },
    ],
  );

  assert.deepEqual(tracks, [{ title: "Nude", artist: "Radiohead", confidence: "high" }]);
  assert.doesNotMatch(JSON.stringify(tracks), /深夜的海|private-photo|social-private/u);
});

test("music metadata enrichment keeps private lookup disabled and returns psyche-useful metadata", async () => {
  const previous = process.env.BENYUAN_MUSIC_PUBLIC_LOOKUP;
  process.env.BENYUAN_MUSIC_PUBLIC_LOOKUP = "0";
  try {
    const enriched = await enrichMusicAnalysisWithPublicMetadata(
      {
        primary_genres: ["ambient", "post-rock"],
        emotional_tone: "melancholic_introspective",
        era_distribution: {},
        language_diversity: ["instrumental"],
        personality_signals: { defense_style: "sound_as_container" },
        recognized_tracks: [{ title: "Svefn-g-englar", artist: "Sigur Ros", confidence: "high" }],
      },
      [{ visible_text: "Svefn-g-englar - Sigur Ros" }],
    );

    assert.equal(enriched.public_metadata?.lookup_status, "failed");
    assert.deepEqual(enriched.public_metadata?.sources, []);
    assert.match(enriched.public_metadata?.notes ?? "", /公开音乐元数据补全已被环境配置关闭/u);
    assert.match((enriched.public_metadata?.mood_keywords ?? []).join(" / "), /空间感|无词铺陈|记忆回潮/u);
  } finally {
    if (previous === undefined) delete process.env.BENYUAN_MUSIC_PUBLIC_LOOKUP;
    else process.env.BENYUAN_MUSIC_PUBLIC_LOOKUP = previous;
  }
});
