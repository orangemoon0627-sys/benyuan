import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateResearchFeedResponse, type TradeWiseResearchFeedItem, type TradeWiseResearchFeedResponse } from "@/lib/tradewise/research-contract";

const FIXTURE_VERSION = "server.research.fixture.v1";

type RawFixtureItem = {
  id: string;
  market: "aStock" | "usStock";
  sector: string;
  title: string;
  summary: string;
  source: string;
  publishDate: string;
  relevanceScore: number;
  content: string;
  keywords: string[];
};

export async function loadMockTradeWiseResearchFeed(): Promise<TradeWiseResearchFeedResponse> {
  const fixturePath = path.join(
    process.cwd(),
    "mobile",
    "tradewise_ai",
    "assets",
    "fixtures",
    "research_feed.json",
  );
  const raw = await readFile(fixturePath, "utf8");
  const parsed = JSON.parse(raw) as RawFixtureItem[];

  const items: TradeWiseResearchFeedItem[] = parsed.map((item) => ({
    id: item.id,
    market: item.market === "aStock" ? "a_stock" : "us_stock",
    sector: item.sector,
    title: item.title,
    summary: item.summary,
    source: item.source,
    publishDate: item.publishDate,
    relevanceScore: item.relevanceScore,
    content: item.content,
    keywords: item.keywords,
    isMock: true,
  }));

  const response = { version: FIXTURE_VERSION, items };
  if (!validateResearchFeedResponse(response)) {
    throw new Error("invalid_mock_research_feed_response");
  }
  return response;
}
