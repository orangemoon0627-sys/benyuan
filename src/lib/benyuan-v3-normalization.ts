import { repairCanonicalBook, repairCanonicalFilm, repairCanonicalMusic } from "@/lib/benyuan-v3-report-profile";
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

function splitArtistAlbum(value: string) {
  const cleaned = cleanText(value);
  const match = cleaned.match(/^(.+?)\s[-–—]\s(.+)$/u);
  if (!match) return null;

  const artist = cleanText(match[1]);
  const album = cleanText(match[2]);
  return artist && album ? { artist, album } : null;
}

export function normalizePsycheConstellation(constellation: PsycheConstellation): PsycheConstellation {
  const tensionSeen = new Set<string>();
  const tensions = constellation.core_tensions.filter((item) => {
    const key = `${fingerprint(item.name)}:${fingerprint(item.description)}`;
    if (!item.name || !item.description || tensionSeen.has(key)) return false;
    tensionSeen.add(key);
    return true;
  }).map((item, index) => ({
    ...item,
    tension_id: index + 1,
    name: cleanText(item.name),
    description: cleanText(item.description),
    growth_direction: cleanText(item.growth_direction),
  }));

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
      core_essence: cleanText(constellation.archetype.core_essence),
      visual_prompt: cleanText(constellation.archetype.visual_prompt),
    },
    narrative_overview: cleanNarrative(constellation.narrative_overview),
    core_tensions: tensions,
    growth_suggestions: [...growthMap.values()],
    recommendations: {
      books: normalizeBooks(constellation.recommendations.books),
      films: normalizeFilms(constellation.recommendations.films),
      music: normalizeMusic(constellation.recommendations.music),
    },
  };
}
