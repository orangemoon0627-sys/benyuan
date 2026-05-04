import type {
  Archetype,
  CuratedRecommendation,
  GrowthSuggestion,
  RecommendationCollections,
  RecommendationItem,
  ReportPayload,
  TensionInsight,
} from "@/lib/types";

function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function fingerprint(value: string) {
  return cleanText(value).toLocaleLowerCase("zh-CN").replace(/[\s\p{P}\p{S}]+/gu, "");
}

function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  const next: string[] = [];

  for (const value of values) {
    const cleaned = cleanText(value);
    if (!cleaned) continue;
    const key = fingerprint(cleaned);
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(cleaned);
  }

  return next;
}

function normalizeRecommendationItems(items: RecommendationItem[]) {
  const seen = new Set<string>();
  const next: RecommendationItem[] = [];

  for (const item of items) {
    const title = cleanText(item.title);
    const description = cleanText(item.description);
    if (!title || !description) continue;

    const key = `${item.type}:${fingerprint(title)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    next.push({ ...item, title, description });
  }

  return next;
}

function normalizeCuratedGroup(items: CuratedRecommendation[]) {
  const seen = new Set<string>();
  const next: CuratedRecommendation[] = [];

  for (const item of items) {
    const title = cleanText(item.title);
    const creator = cleanText(item.creator);
    const reason = cleanText(item.reason);
    if (!title || !reason) continue;

    const key = `${fingerprint(title)}:${fingerprint(creator)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    next.push({ ...item, title, creator: creator || undefined, reason });
  }

  return next;
}

function normalizeCuratedRecommendations(collections: RecommendationCollections | undefined) {
  if (!collections) return collections;

  return {
    books: normalizeCuratedGroup(collections.books),
    films: normalizeCuratedGroup(collections.films),
    music: normalizeCuratedGroup(collections.music),
  } satisfies RecommendationCollections;
}

function normalizeGrowthSuggestions(items: GrowthSuggestion[] | undefined) {
  if (!items) return items;

  const merged = new Map<string, GrowthSuggestion>();

  for (const item of items) {
    const title = cleanText(item.title);
    const description = cleanText(item.description);
    const actionableSteps = dedupeStrings(item.actionableSteps ?? []);
    if (!title || !description) continue;

    const key = `${fingerprint(title)}:${fingerprint(description)}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { title, description, actionableSteps });
      continue;
    }

    existing.actionableSteps = dedupeStrings([...existing.actionableSteps, ...actionableSteps]);
  }

  return [...merged.values()];
}

function normalizeTensions(items: TensionInsight[]) {
  const seen = new Set<string>();
  const next: TensionInsight[] = [];

  for (const item of items) {
    const name = cleanText(item.name);
    const description = cleanText(item.description);
    const suggestion = cleanText(item.suggestion);
    const poles = [cleanText(item.poles[0]), cleanText(item.poles[1])] as [string, string];
    if (!name || !description || !poles[0] || !poles[1]) continue;

    const key = `${fingerprint(name)}:${fingerprint(description)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    next.push({ ...item, name, description, suggestion, poles });
  }

  return next;
}

function normalizeArchetype(archetype: Archetype): Archetype {
  return {
    ...archetype,
    name: cleanText(archetype.name),
    englishName: cleanText(archetype.englishName) || undefined,
    subtitle: cleanText(archetype.subtitle) || undefined,
    coreEssence: cleanText(archetype.coreEssence) || undefined,
    visualPrompt: cleanText(archetype.visualPrompt) || undefined,
    description: cleanText(archetype.description),
    sourceSignals: dedupeStrings(archetype.sourceSignals),
  };
}

export function normalizeReportPayload(report: ReportPayload): ReportPayload {
  return {
    ...report,
    overview: cleanText(report.overview),
    narrativeOverview: cleanText(report.narrativeOverview) || undefined,
    tensions: normalizeTensions(report.tensions),
    archetype: normalizeArchetype(report.archetype),
    recommendations: normalizeRecommendationItems(report.recommendations),
    growthSuggestions: normalizeGrowthSuggestions(report.growthSuggestions),
    curatedRecommendations: normalizeCuratedRecommendations(report.curatedRecommendations),
    safetyFlags: dedupeStrings(report.safetyFlags) as ReportPayload["safetyFlags"],
  };
}
