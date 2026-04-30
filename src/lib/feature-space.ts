export const FEATURE_GROUPS = {
  aesthetic: [
    "aesthetic_literary_existential",
    "aesthetic_literary_tenderness",
    "aesthetic_music_intensity",
    "aesthetic_music_nocturnal",
    "aesthetic_visual_surreal",
    "aesthetic_visual_minimal",
    "aesthetic_niche_orientation",
  ],
  emotional: [
    "emotional_granularity",
    "emotional_depth",
    "emotional_rhythm_tidal",
    "emotional_rhythm_stable",
    "emotional_transformation",
  ],
  temporal: [
    "temporal_past_weight",
    "temporal_present_depth",
    "temporal_future_pull",
    "temporal_narrative_coherence",
    "temporal_change_openness",
    "temporal_meaning_density",
  ],
} as const;

export const FEATURE_KEYS = [
  ...FEATURE_GROUPS.aesthetic,
  ...FEATURE_GROUPS.emotional,
  ...FEATURE_GROUPS.temporal,
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];
export type FeatureScores = Record<FeatureKey, number>;
export type PartialFeatureScores = Partial<Record<FeatureKey, number>>;
