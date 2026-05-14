import { repairCanonicalBook, repairCanonicalFilm, repairCanonicalMusic } from "@/lib/benyuan-v3-report-profile";
import { dedupeCoreTensions } from "@/lib/benyuan-v3-constellation-normalization";
import type { PsycheConstellation } from "@/lib/benyuan-v3-types";

function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function fingerprint(value: string) {
  return cleanText(value).toLocaleLowerCase("zh-CN").replace(/[\s\p{P}\p{S}]+/gu, "");
}

function sanitizeArchetypeName(value: string | null | undefined) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  if (cleaned.includes("/")) {
    const [primary] = cleaned.split(/\s*\/\s*/);
    if (/[一-鿿]/.test(primary)) {
      return primary.trim();
    }
  }
  return cleaned;
}

function isSuspiciousPersonalizedLabel(value: string | null | undefined) {
  const cleaned = cleanText(value);
  if (!cleaned) return true;
  if (cleaned.length < 3 || cleaned.length > 80) return true;
  if (/[_<>]/u.test(cleaned)) return true;
  if (/\b(undetermined|no[_\s-]*visible|ocr|unknown|abandoned|post[_\s-]*rope|raw)\b/iu.test(cleaned)) return true;
  if (/^[a-z0-9_\-\s]+$/i.test(cleaned)) return true;
  return false;
}

function sanitizePersonalizedLabel(value: string | null | undefined, fallback?: string, maxLength = 96) {
  const cleaned = cleanText(value);
  if (cleaned.length > maxLength) return cleanText(fallback) || undefined;
  if (isSuspiciousPersonalizedLabel(cleaned)) return cleanText(fallback) || undefined;
  return cleaned;
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

function cleanNarrative(value: string | null | undefined) {
  return (value ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => cleanText(paragraph))
    .filter((paragraph) => paragraph.length > 0)
    .join("\n\n");
}

function normalizeDimensions(constellation: PsycheConstellation) {
  return Object.fromEntries(
    Object.entries(constellation.seven_dimensions).map(([key, value]) => {
      const legacyValue = value as typeof value & { analysis?: string; description?: string };
      return [
        key,
        {
          score: Number.isFinite(value.score) ? value.score : 0,
          interpretation: cleanText(value.interpretation ?? legacyValue.analysis ?? legacyValue.description),
        },
      ];
    }),
  ) as PsycheConstellation["seven_dimensions"];
}

function splitArtistAlbum(value: string) {
  const cleaned = cleanText(value);
  const match = cleaned.match(/^(.+?)\s[-–—]\s(.+)$/u);
  if (!match) return null;

  const artist = cleanText(match[1]);
  const album = cleanText(match[2]);
  return artist && album ? { artist, album } : null;
}

export function normalizePsycheConstellation(constellation: PsycheConstellation): PsycheConstellation {
  const tensions = dedupeCoreTensions(constellation.core_tensions);

  const growthMap = new Map<string, PsycheConstellation["growth_suggestions"][number]>();
  for (const item of constellation.growth_suggestions) {
    const title = cleanText(item.title);
    const description = cleanText(item.description);
    const actionable_steps = dedupeStrings(item.actionable_steps ?? []);
    if (!title || !description) continue;
    const key = `${fingerprint(title)}:${fingerprint(description)}`;
    const existing = growthMap.get(key);
    if (!existing) {
      growthMap.set(key, { title, description, actionable_steps });
      continue;
    }
    existing.actionable_steps = dedupeStrings([...existing.actionable_steps, ...actionable_steps]);
  }

  const normalizeBooks = (items: PsycheConstellation["recommendations"]["books"]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = `${fingerprint(item.title)}:${fingerprint(item.author)}`;
      if (!item.title || !item.author || !item.reason || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((item) => {
      const title = cleanText(item.title);
      const author = cleanText(item.author);
      const reason = cleanText(item.reason);
      const canonical = repairCanonicalBook(title);
      return {
        title: canonical?.title ?? title,
        author: canonical?.author ?? author,
        reason: reason || canonical?.reason || "",
      };
    });
  };

  const normalizeFilms = (items: PsycheConstellation["recommendations"]["films"]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = `${fingerprint(item.title)}:${fingerprint(item.director)}`;
      if (!item.title || !item.director || !item.reason || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((item) => {
      const title = cleanText(item.title);
      const director = cleanText(item.director);
      const reason = cleanText(item.reason);
      const canonical = repairCanonicalFilm(title);
      return {
        title: canonical?.title ?? title,
        director: canonical?.director ?? director,
        reason: reason || canonical?.reason || "",
      };
    });
  };

  const normalizeMusic = (items: PsycheConstellation["recommendations"]["music"]) => {
    const seen = new Set<string>();
    return items.map((item) => {
      const artist = cleanText(item.artist);
      const album = cleanText(item.album);
      const parsedAlbum = splitArtistAlbum(album);
      const shouldRepair = Boolean(parsedAlbum && (!artist || fingerprint(parsedAlbum.artist) !== fingerprint(artist)));

      return {
        artist: shouldRepair && parsedAlbum ? parsedAlbum.artist : artist,
        album: shouldRepair && parsedAlbum ? parsedAlbum.album : album,
        reason: cleanText(item.reason),
      };
    }).map((item) => {
      const canonical = repairCanonicalMusic(item.artist, item.album);
      return {
        artist: canonical?.artist ?? item.artist,
        album: canonical?.album ?? item.album,
        reason: item.reason || canonical?.reason || "",
      };
    }).filter((item) => {
      const key = `${fingerprint(item.artist)}:${fingerprint(item.album)}`;
      if (!item.artist || !item.album || !item.reason || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return {
    ...constellation,
    archetype: {
      ...constellation.archetype,
      name: sanitizeArchetypeName(constellation.archetype.name),
      english_name: cleanText(constellation.archetype.english_name),
      personalized_name: sanitizePersonalizedLabel(constellation.archetype.personalized_name, undefined, 32),
      personalized_subtitle: sanitizePersonalizedLabel(constellation.archetype.personalized_subtitle, undefined, 120),
      core_essence: cleanText(constellation.archetype.core_essence),
      visual_prompt: cleanText(constellation.archetype.visual_prompt),
    },
    narrative_overview: cleanNarrative(constellation.narrative_overview),
    seven_dimensions: normalizeDimensions(constellation),
    core_tensions: tensions,
    growth_suggestions: [...growthMap.values()],
    recommendations: {
      books: normalizeBooks(constellation.recommendations.books),
      films: normalizeFilms(constellation.recommendations.films),
      music: normalizeMusic(constellation.recommendations.music),
    },
  };
}
