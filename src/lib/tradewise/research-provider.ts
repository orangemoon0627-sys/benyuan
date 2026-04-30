import {
  validateResearchFeedResponse,
  type TradeWiseResearchFeedItem,
  type TradeWiseResearchFeedResponse,
  type TradeWiseResearchMarket,
} from "@/lib/tradewise/research-contract";
import { loadMockTradeWiseResearchFeed } from "@/lib/tradewise/mock-research-feed";

const DEFAULT_REMOTE_TIMEOUT_MS = 30_000;
const DEFAULT_REMOTE_SOURCE_LABEL = "Remote Feed";
const DEFAULT_REMOTE_VERSION = "remote.research.v1";
const REMOTE_ENVELOPE_KEYS = ["data", "result", "payload", "response", "feed"];
const REMOTE_ITEM_KEYS = ["items", "list", "articles", "news", "results", "rows", "records"];

type TradeWiseResearchProvider = "fixture" | "remote";

type LoadTradeWiseResearchFeedOptions = {
  market?: TradeWiseResearchMarket;
  limit?: number;
};

type RawResearchFeedResponse = Record<string, unknown>;
type RawResearchFeedItem = Record<string, unknown>;

export async function loadTradeWiseResearchFeed(
  options: LoadTradeWiseResearchFeedOptions = {},
): Promise<TradeWiseResearchFeedResponse> {
  const provider = resolveResearchProvider();
  if (provider === "remote") {
    return loadRemoteTradeWiseResearchFeed(options);
  }
  return loadFixtureTradeWiseResearchFeed(options);
}

function resolveResearchProvider(): TradeWiseResearchProvider {
  const rawProvider = (process.env.TRADEWISE_RESEARCH_PROVIDER ?? "fixture").toLowerCase();
  return rawProvider === "remote" ? "remote" : "fixture";
}

async function loadFixtureTradeWiseResearchFeed(
  options: LoadTradeWiseResearchFeedOptions,
): Promise<TradeWiseResearchFeedResponse> {
  const feed = await loadMockTradeWiseResearchFeed();
  return filterResearchFeed(feed, options);
}

async function loadRemoteTradeWiseResearchFeed(
  options: LoadTradeWiseResearchFeedOptions,
): Promise<TradeWiseResearchFeedResponse> {
  const endpoint = resolveRemoteEndpoint(options);
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      ...resolveRemoteHeaders(),
    },
    signal: AbortSignal.timeout(resolveRemoteTimeoutMs()),
  });

  const rawBody = await response.text();
  const payload = parseRemotePayload(rawBody, response.ok);
  if (!response.ok) {
    throw new Error(readRemoteError(payload, rawBody, response.status));
  }

  const normalized = normalizeRemotePayload(payload, options);
  if (!validateResearchFeedResponse(normalized)) {
    throw new Error("invalid_remote_research_feed_response");
  }
  return filterResearchFeed(normalized, options);
}

function resolveRemoteEndpoint(options: LoadTradeWiseResearchFeedOptions): string {
  const raw = process.env.TRADEWISE_RESEARCH_REMOTE_URL?.trim();
  if (!raw) {
    throw new Error("research_remote_url_missing");
  }

  const url = new URL(raw);
  const marketParam = (process.env.TRADEWISE_RESEARCH_REMOTE_MARKET_PARAM ?? "market").trim();
  if (options.market && marketParam) {
    url.searchParams.set(marketParam, resolveRemoteMarketValue(options.market));
  }

  const limitParam = (process.env.TRADEWISE_RESEARCH_REMOTE_LIMIT_PARAM ?? "limit").trim();
  if (
    typeof options.limit === "number" &&
    Number.isFinite(options.limit) &&
    options.limit > 0 &&
    limitParam
  ) {
    url.searchParams.set(limitParam, String(Math.trunc(options.limit)));
  }
  return url.toString();
}

function resolveRemoteMarketValue(market: TradeWiseResearchMarket): string {
  if (market === "a_stock") {
    return process.env.TRADEWISE_RESEARCH_REMOTE_MARKET_VALUE_A_STOCK?.trim() || market;
  }
  return process.env.TRADEWISE_RESEARCH_REMOTE_MARKET_VALUE_US_STOCK?.trim() || market;
}

function resolveRemoteHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const rawHeaders = process.env.TRADEWISE_RESEARCH_REMOTE_HEADERS?.trim();
  if (rawHeaders) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawHeaders);
    } catch {
      throw new Error("research_remote_headers_invalid_json");
    }
    if (!isRecord(parsed)) {
      throw new Error("research_remote_headers_invalid_shape");
    }
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && key.trim()) {
        headers[key] = value;
      }
    }
  }

  const authToken = process.env.TRADEWISE_RESEARCH_REMOTE_AUTH_TOKEN?.trim();
  if (authToken) {
    const authHeader = process.env.TRADEWISE_RESEARCH_REMOTE_AUTH_HEADER?.trim() || "Authorization";
    const authPrefix = process.env.TRADEWISE_RESEARCH_REMOTE_AUTH_PREFIX?.trim() || "Bearer";
    headers[authHeader] = authPrefix ? `${authPrefix} ${authToken}` : authToken;
  }

  return headers;
}

function filterResearchFeed(
  feed: TradeWiseResearchFeedResponse,
  options: LoadTradeWiseResearchFeedOptions,
): TradeWiseResearchFeedResponse {
  let items = feed.items;
  if (options.market) {
    items = items.filter((item) => item.market === options.market);
  }
  if (typeof options.limit === "number" && Number.isFinite(options.limit) && options.limit > 0) {
    items = items.slice(0, Math.trunc(options.limit));
  }
  return {
    version: feed.version,
    items,
  };
}

function resolveRemoteTimeoutMs(): number {
  const raw = Number(process.env.TRADEWISE_RESEARCH_REMOTE_TIMEOUT_MS ?? DEFAULT_REMOTE_TIMEOUT_MS);
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_REMOTE_TIMEOUT_MS;
  }
  return raw;
}

function parseRemotePayload(
  rawBody: string,
  allowEmptyObject: boolean,
): unknown {
  if (!rawBody.trim()) {
    if (allowEmptyObject) {
      return {};
    }
    throw new Error("research_remote_empty_response");
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    if (!allowEmptyObject) {
      throw new Error("research_remote_invalid_json");
    }
    return {};
  }
}

function readRemoteError(payload: unknown, rawBody: string, status: number): string {
  if (isRecord(payload)) {
    const errorRecord = isRecord(payload.error) ? payload.error : undefined;
    const explicitMessage =
      readString(errorRecord?.message) ??
      readString(errorRecord?.type) ??
      readString(payload.message) ??
      readString(payload.error as unknown) ??
      readString(payload.detail);
    if (explicitMessage) {
      return explicitMessage;
    }
  }

  const trimmed = rawBody.trim();
  if (trimmed) {
    return trimmed.length > 240 ? `${trimmed.slice(0, 240)}…` : trimmed;
  }
  return `research_remote_status_${status}`;
}

function normalizeRemotePayload(
  payload: unknown,
  options: LoadTradeWiseResearchFeedOptions,
): TradeWiseResearchFeedResponse {
  const envelope = extractRemoteEnvelope(payload);
  const items = envelope?.items ?? [];
  return {
    version: envelope?.version ?? DEFAULT_REMOTE_VERSION,
    items: items.map((item, index) => normalizeRemoteItem(item, index, options.market)),
  };
}

function extractRemoteEnvelope(
  payload: unknown,
  depth = 0,
): { version?: string; items: RawResearchFeedItem[] } | null {
  if (Array.isArray(payload)) {
    return {
      items: payload.filter(isRecord),
    };
  }

  if (!isRecord(payload) || depth > 3) {
    return null;
  }

  const version =
    readString(payload.version) ??
    readString(payload.feedVersion) ??
    readString(payload.dataVersion);

  const directItems = pickRemoteItems(payload);
  if (directItems) {
    return {
      version,
      items: directItems.filter(isRecord),
    };
  }

  for (const key of REMOTE_ENVELOPE_KEYS) {
    const nested = extractRemoteEnvelope(payload[key], depth + 1);
    if (nested) {
      return {
        version: nested.version ?? version,
        items: nested.items,
      };
    }
  }

  return null;
}

function pickRemoteItems(payload: RawResearchFeedResponse): unknown[] | null {
  for (const key of REMOTE_ITEM_KEYS) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }
  return null;
}

function normalizeRemoteItem(
  item: RawResearchFeedItem,
  index: number,
  requestedMarket?: TradeWiseResearchMarket,
): TradeWiseResearchFeedItem {
  const content =
    readStringByKeys(item, ["content", "body", "article", "text", "fullText", "full_text"]) ?? "";
  const summary =
    readStringByKeys(item, ["summary", "abstract", "description", "excerpt", "deck"]) ??
    summarizeText(content, 88);
  const title =
    readStringByKeys(item, ["title", "headline", "name"]) ??
    summarizeText(summary || content || `远端研报 ${index + 1}`, 32);
  const keywords = readKeywords(item);
  const sector =
    readStringByKeys(item, ["sector", "industry", "category", "theme", "channel"]) ??
    keywords[0] ??
    "未分类";
  const publishDate = normalizePublishDate(
    readStringByKeys(item, [
      "publishDate",
      "publishedAt",
      "published_at",
      "published",
      "date",
      "datetime",
    ]),
  );
  const market = normalizeMarket(
    readStringByKeys(item, ["market", "marketCode", "market_code", "region", "locale"]),
    requestedMarket,
  );

  return {
    id:
      readStringByKeys(item, ["id", "uuid", "_id", "newsId", "news_id"]) ??
      buildFallbackItemId(title, publishDate, index),
    market,
    sector,
    title,
    summary,
    source:
      readStringByKeys(item, ["source", "sourceName", "source_name", "publisher", "media"]) ??
      resolveRemoteSourceLabel(),
    publishDate,
    relevanceScore: readNumberByKeys(item, ["relevanceScore", "relevance", "score", "rank"]) ?? 0,
    content: content || summary,
    keywords,
    isMock: readBooleanByKeys(item, ["isMock", "mock", "is_mock"]) ?? false,
  };
}

function normalizeMarket(
  rawValue: string | undefined,
  requestedMarket?: TradeWiseResearchMarket,
): TradeWiseResearchMarket {
  const normalized = (rawValue ?? "").trim().toLowerCase();
  if (
    ["us_stock", "us", "usa", "nasdaq", "nyse", "美股", "美股市场"].includes(
      normalized,
    )
  ) {
    return "us_stock";
  }
  if (
    [
      "a_stock",
      "a",
      "cn",
      "china",
      "mainland",
      "ashare",
      "a-share",
      "a股",
      "沪深",
      "沪深市场",
    ].includes(normalized)
  ) {
    return "a_stock";
  }
  return requestedMarket ?? "a_stock";
}

function normalizePublishDate(rawValue: string | undefined): string {
  if (!rawValue) {
    return new Date(0).toISOString();
  }
  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0).toISOString();
  }
  return parsed.toISOString();
}

function buildFallbackItemId(title: string, publishDate: string, index: number): string {
  const titlePart = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "item";
  const datePart = publishDate.slice(0, 10);
  return `remote-${datePart}-${titlePart}-${index + 1}`;
}

function resolveRemoteSourceLabel(): string {
  return process.env.TRADEWISE_RESEARCH_REMOTE_SOURCE_LABEL?.trim() || DEFAULT_REMOTE_SOURCE_LABEL;
}

function readStringByKeys(record: RawResearchFeedItem, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = readString(record[key]);
    if (value) {
      return value;
    }
  }
  return undefined;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function readNumberByKeys(record: RawResearchFeedItem, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
}

function readBooleanByKeys(record: RawResearchFeedItem, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes"].includes(normalized)) {
        return true;
      }
      if (["false", "0", "no"].includes(normalized)) {
        return false;
      }
    }
  }
  return undefined;
}

function readKeywords(record: RawResearchFeedItem): string[] {
  for (const key of ["keywords", "tags", "themes"]) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter(isString).map((item) => item.trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(/[;,，、]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function summarizeText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
