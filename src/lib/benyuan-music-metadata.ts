import type { MultimodalInputItem, MusicAnalysis } from "@/lib/benyuan-v3-types";

type RecognizedTrack = NonNullable<MusicAnalysis["recognized_tracks"]>[number];
type MusicPublicMetadata = NonNullable<MusicAnalysis["public_metadata"]>;

const MAX_LOOKUP_TRACKS = 3;
const LOOKUP_TIMEOUT_MS = 2200;

function compact(value: unknown, maxLength = 120) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function normalizeTrackKey(track: RecognizedTrack) {
  return [track.title, track.artist].filter(Boolean).join(" - ").toLocaleLowerCase("zh-CN").replace(/\s+/g, " ").trim();
}

function yearBand(value: string | undefined) {
  const year = Number((value ?? "").match(/\b(19|20)\d{2}\b/u)?.[0]);
  if (!Number.isFinite(year)) return "";
  return `${Math.floor(year / 10) * 10}s`;
}

function uniqueStrings(values: Array<string | undefined | null>, limit = 8) {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const value of values) {
    const cleaned = compact(value, 64);
    if (!cleaned) continue;
    const key = cleaned.toLocaleLowerCase("zh-CN");
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(cleaned);
    if (next.length >= limit) break;
  }
  return next;
}

function hasLookupDisabled() {
  return process.env.BENYUAN_MUSIC_PUBLIC_LOOKUP === "0" || process.env.BENYUAN_MUSIC_PUBLIC_LOOKUP === "false";
}

function parseVisibleTrackLine(line: string): RecognizedTrack | null {
  const cleaned = compact(line, 160)
    .replace(/^[\d#.\-\s]+/u, "")
    .replace(/\b(playlist|liked songs|歌单|歌曲|音乐|分享)\b/giu, "")
    .trim();
  if (!cleaned || cleaned.length < 2 || cleaned.length > 90) return null;
  if (/\.(jpg|jpeg|png|webp|heic)$/iu.test(cleaned)) return null;

  const separators = [" - ", " — ", " – ", " by ", " / "];
  for (const separator of separators) {
    if (!cleaned.includes(separator)) continue;
    const [left, right] = cleaned.split(separator).map((item) => item.trim()).filter(Boolean);
    if (left && right) {
      return separator === " by "
        ? { title: left, artist: right, confidence: "medium" }
        : { title: left, artist: right, confidence: "medium" };
    }
  }

  if (/^[\p{L}\p{N}\s'’·.()]+$/u.test(cleaned) && cleaned.length <= 50) {
    return { title: cleaned, confidence: "low" };
  }

  return null;
}

export function buildMusicLookupTracks(music: MusicAnalysis, inputs: MultimodalInputItem[] = []) {
  const recognized = (music.recognized_tracks ?? [])
    .filter((item) => item.title && item.title.trim().length > 0)
    .map((item) => ({ ...item, title: compact(item.title, 80), artist: item.artist ? compact(item.artist, 80) : undefined }));
  const fromVisibleText = inputs
    .flatMap((item) => [item.visible_text, item.description].filter(Boolean).join("\n").split(/\n|;|；/u))
    .flatMap((line) => parseVisibleTrackLine(line) ?? []);
  const candidates = [...recognized, ...fromVisibleText];
  const seen = new Set<string>();
  const next: RecognizedTrack[] = [];

  for (const track of candidates) {
    const key = normalizeTrackKey(track);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    next.push(track);
    if (next.length >= MAX_LOOKUP_TRACKS) break;
  }

  return next;
}

function buildItunesUrl(track: RecognizedTrack) {
  const term = [track.title, track.artist].filter(Boolean).join(" ");
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", term);
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", "3");
  return url.toString();
}

async function fetchJsonWithTimeout(url: string, headers?: HeadersInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function lookupItunes(track: RecognizedTrack) {
  const payload = await fetchJsonWithTimeout(buildItunesUrl(track));
  if (!isRecord(payload) || !Array.isArray(payload.results)) return [];
  return payload.results
    .filter(isRecord)
    .map((item) => ({
      source: "apple_itunes_search",
      title: typeof item.trackName === "string" ? item.trackName : track.title,
      artist: typeof item.artistName === "string" ? item.artistName : track.artist,
      genre: typeof item.primaryGenreName === "string" ? item.primaryGenreName : undefined,
      releaseYearBand: yearBand(typeof item.releaseDate === "string" ? item.releaseDate : undefined),
    }));
}

function buildMusicBrainzUrl(track: RecognizedTrack) {
  const parts = [`recording:"${track.title.replace(/"/g, "")}"`];
  if (track.artist) parts.push(`artist:"${track.artist.replace(/"/g, "")}"`);
  const url = new URL("https://musicbrainz.org/ws/2/recording/");
  url.searchParams.set("query", parts.join(" AND "));
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", "2");
  return url.toString();
}

async function lookupMusicBrainz(track: RecognizedTrack) {
  const payload = await fetchJsonWithTimeout(buildMusicBrainzUrl(track), {
    "User-Agent": "Benyuan/0.1 (music metadata enrichment; contact: staging)",
  });
  if (!isRecord(payload) || !Array.isArray(payload.recordings)) return [];
  return payload.recordings
    .filter(isRecord)
    .map((item) => {
      const artistCredit = Array.isArray(item["artist-credit"]) ? item["artist-credit"].filter(isRecord) : [];
      const releases = Array.isArray(item.releases) ? item.releases.filter(isRecord) : [];
      const tags = Array.isArray(item.tags) ? item.tags.filter(isRecord) : [];
      return {
        source: "musicbrainz_search",
        title: typeof item.title === "string" ? item.title : track.title,
        artist: artistCredit.map((credit) => (isRecord(credit.artist) && typeof credit.artist.name === "string" ? credit.artist.name : "")).filter(Boolean).join(" / ") || track.artist,
        genre: tags.map((tag) => (typeof tag.name === "string" ? tag.name : "")).filter(Boolean).slice(0, 3).join(" / ") || undefined,
        releaseYearBand: yearBand(
          typeof item["first-release-date"] === "string"
            ? item["first-release-date"]
            : releases.map((release) => (typeof release.date === "string" ? release.date : "")).find(Boolean),
        ),
      };
    });
}

function deriveMoodKeywords(music: MusicAnalysis, genres: string[]) {
  const source = [
    music.emotional_tone,
    ...music.primary_genres,
    ...genres,
    ...Object.entries(music.personality_signals ?? {}).map(([key, value]) => `${key}:${value}`),
  ].join(" ").toLocaleLowerCase("zh-CN");
  const keywords = [
    /ambient|氛围|new age/u.test(source) ? "空间感" : "",
    /post-rock|postrock|后摇|instrumental/u.test(source) ? "无词铺陈" : "",
    /classical|piano|古典|modern classical/u.test(source) ? "克制抒情" : "",
    /electronic|电子|techno|house/u.test(source) ? "身体节律" : "",
    /indie|独立|alternative/u.test(source) ? "私人表达" : "",
    /melanchol|nostalgia|sad|blue|低光|怀旧/u.test(source) ? "记忆回潮" : "",
    /warm|hope|morning|renew/u.test(source) ? "重新启动" : "",
  ].filter(Boolean);
  return uniqueStrings(keywords, 6);
}

export async function enrichMusicAnalysisWithPublicMetadata(
  music: MusicAnalysis,
  inputs: MultimodalInputItem[] = [],
): Promise<MusicAnalysis> {
  const tracks = buildMusicLookupTracks(music, inputs);
  if (tracks.length === 0 || hasLookupDisabled()) {
    return {
      ...music,
      recognized_tracks: music.recognized_tracks ?? tracks,
      public_metadata: music.public_metadata ?? {
        lookup_status: tracks.length === 0 ? "not_requested" : "failed",
        sources: [],
        genres: [],
        artists: [],
        eras: [],
        mood_keywords: deriveMoodKeywords(music, []),
        notes: tracks.length === 0 ? "未识别出足够稳定的歌曲或艺术家名称，因此没有进行公开音乐元数据补全。" : "公开音乐元数据补全已被环境配置关闭。",
      },
    };
  }

  const itunesMatches = (await Promise.all(tracks.map(lookupItunes))).flat();
  const needsFallback = itunesMatches.length === 0;
  const musicBrainzMatches = needsFallback ? (await Promise.all(tracks.map(lookupMusicBrainz))).flat() : [];
  const matches = [...itunesMatches, ...musicBrainzMatches];
  const genres = uniqueStrings([...music.primary_genres, ...matches.map((item) => item.genre)]);
  const artists = uniqueStrings([...tracks.map((item) => item.artist), ...matches.map((item) => item.artist)], 10);
  const eras = uniqueStrings([...Object.keys(music.era_distribution ?? {}), ...matches.map((item) => item.releaseYearBand)], 6);
  const moodKeywords = deriveMoodKeywords(music, genres);
  const sources = uniqueStrings(matches.map((item) => item.source), 4);
  const lookupStatus: MusicPublicMetadata["lookup_status"] = matches.length === 0
    ? "failed"
    : matches.length < tracks.length
      ? "partial"
      : "matched";

  return {
    ...music,
    recognized_tracks: tracks,
    primary_genres: genres.length > 0 ? genres.slice(0, 5) : music.primary_genres,
    language_diversity: music.language_diversity,
    public_metadata: {
      lookup_status: lookupStatus,
      sources,
      genres,
      artists,
      eras,
      mood_keywords: moodKeywords,
      notes:
        lookupStatus === "failed"
          ? "已尝试公开音乐元数据补全，但没有稳定匹配；后续仅使用截图可见线索和模型保守分析。"
          : `公开音乐元数据用于补全风格、年代和艺人气候；只查询歌名/艺人，不查询用户身份、社交账号或私人图片。`,
    },
  };
}
