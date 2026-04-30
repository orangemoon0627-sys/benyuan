export type TradeWiseResearchMarket = "a_stock" | "us_stock";

export type TradeWiseResearchFeedItem = {
  id: string;
  market: TradeWiseResearchMarket;
  sector: string;
  title: string;
  summary: string;
  source: string;
  publishDate: string;
  relevanceScore: number;
  content: string;
  keywords: string[];
  isMock: boolean;
};

export type TradeWiseResearchFeedResponse = {
  version: string;
  items: TradeWiseResearchFeedItem[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isMarket = (value: unknown): value is TradeWiseResearchMarket =>
  value === "a_stock" || value === "us_stock";

export function validateResearchFeedResponse(
  value: unknown,
): value is TradeWiseResearchFeedResponse {
  if (!isRecord(value) || typeof value.version !== "string" || !Array.isArray(value.items)) {
    return false;
  }

  return value.items.every((item) => {
    if (!isRecord(item)) {
      return false;
    }
    return (
      typeof item.id === "string" &&
      isMarket(item.market) &&
      typeof item.sector === "string" &&
      typeof item.title === "string" &&
      typeof item.summary === "string" &&
      typeof item.source === "string" &&
      typeof item.publishDate === "string" &&
      isFiniteNumber(item.relevanceScore) &&
      typeof item.content === "string" &&
      isStringArray(item.keywords) &&
      typeof item.isMock === "boolean"
    );
  });
}
