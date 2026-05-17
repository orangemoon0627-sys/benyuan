export const OFFICIAL_ARCHETYPE_LABELS = [
  "远潮观月者",
  "星图筑序者",
  "月港栖岸者",
  "存在游牧者",
  "雨窗抒写者",
  "事件视界沉潜者",
  "星云织梦者",
  "日冕引燃者",
  "类地栖居者",
  "深空锚定者",
] as const;

export const OFFICIAL_ARCHETYPE_ENGLISH_LABELS = [
  "The Far-Tide Moon Watcher",
  "The Star-Map Architect",
  "The Moon-Harbor Keeper",
  "The Existential Nomad",
  "The Rain-Window Scribe",
  "The Event Horizon Diver",
  "The Nebula Weaver",
  "The Solar Corona Igniter",
  "The Terrestrial Dweller",
  "The Deep-Space Anchor",
] as const;

export const OFFICIAL_ARCHETYPE_SLUGS = [
  "lone_seeker",
  "rational_builder",
  "gentle_guardian",
  "existential_wanderer",
  "melancholic_poet",
  "black_hole_event_horizon",
  "nebula_weaver",
  "solar_corona",
  "terrestrial_planet",
  "deep_space_anchor",
] as const;

export const RETIRED_VISIBLE_ARCHETYPE_LABELS = [
  "月门潜航者",
  "月背寻光者",
  "深月观测者",
  "暮潮拾光者",
  "暮海寻光者",
  "暮海守光者",
  "目光拾亡者",
  "月岸守望者",
  "暗潮守月人",
  "事件视界潜行者",
  "日冕燃心者",
  "孤独求索者",
  "理性建构者",
  "温柔守护者",
  "The Moonlit Seeker",
  "Moonlit Seeker",
  "The Event Horizon Voyager",
  "Event Horizon Voyager",
] as const;

export const LEGACY_GENERATION_FIELDS = [
  "act3",
  "act3_responses",
  "act3_mirror_responses",
  "mirror_questions",
  "mirror_final_words",
  "personalized_name",
  "personalized_subtitle",
] as const;

export function cleanLegacyText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function legacyFingerprint(value: string | null | undefined) {
  return cleanLegacyText(value).toLocaleLowerCase("zh-CN").replace(/[\s\p{P}\p{S}]+/gu, "");
}

export function containsOfficialOrRetiredArchetypeLabel(value: string | null | undefined) {
  const key = legacyFingerprint(value);
  if (!key) return false;

  return [
    ...OFFICIAL_ARCHETYPE_LABELS,
    ...OFFICIAL_ARCHETYPE_ENGLISH_LABELS,
    ...RETIRED_VISIBLE_ARCHETYPE_LABELS,
  ].some((label) => {
    const labelKey = legacyFingerprint(label);
    return labelKey.length > 0 && key.includes(labelKey);
  });
}

export function containsLegacyGenerationField(value: string | null | undefined) {
  const key = cleanLegacyText(value).toLocaleLowerCase("zh-CN");
  if (!key) return false;
  return LEGACY_GENERATION_FIELDS.some((field) => key.includes(field));
}

export function isSuspiciousGeneratedLabel(value: string | null | undefined) {
  const cleaned = cleanLegacyText(value);
  if (!cleaned) return true;
  if (cleaned.length < 3 || cleaned.length > 80) return true;
  if (/[_<>]/u.test(cleaned)) return true;
  if (/\b(undetermined|no[_\s-]*visible|ocr|unknown|abandoned|post[_\s-]*rope|raw)\b/iu.test(cleaned)) return true;
  if (/^[a-z0-9_\-\s]+$/i.test(cleaned)) return true;
  if (containsOfficialOrRetiredArchetypeLabel(cleaned)) return true;
  return false;
}

export function sanitizeGeneratedPersonalizedLabel(
  value: string | null | undefined,
  fallback?: string,
  maxLength = 96,
) {
  const cleaned = cleanLegacyText(value);
  if (cleaned.length > maxLength) return cleanLegacyText(fallback) || undefined;
  if (isSuspiciousGeneratedLabel(cleaned)) return cleanLegacyText(fallback) || undefined;
  return cleaned;
}

export function legacyIsolationPromptBlock() {
  return [
    "旧版字段隔离区（内部规则）：",
    "- 旧版 Act3 / act3_responses / mirror_questions / mirror_final_words 只用于历史档案兼容，不参与新版剧场生成、星图定性、推荐理由或主星体命名。",
    "- personalized_name / personalized_subtitle 只作为旧数据兼容字段；新版用户可见主标题、分享标题和保存长图标题只能使用固定 10 个主星体标签。",
    "- 旧标签与旧别名（如月门潜航者、月背寻光者、目光拾亡者、月岸守望者、暗潮守月人等）不得进入新结果、长图、剧场文案或推荐理由。",
    "- 如果历史记录里出现旧字段或旧称谓，只记录为 legacy-isolated，不要把它们当作新的精神证据。",
  ].join("\n");
}
