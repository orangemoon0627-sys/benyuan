import { NextResponse } from "next/server";
import { loadTradeWiseResearchFeed } from "@/lib/tradewise/research-provider";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const rawMarket = searchParams.get("market");
    const market = rawMarket === "a_stock" || rawMarket === "us_stock" ? rawMarket : undefined;
    const limit = Number.parseInt(searchParams.get("limit") ?? "0", 10);
    const feed = await loadTradeWiseResearchFeed({
      market,
      limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    });

    return NextResponse.json({
      version: feed.version,
      items: feed.items,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "research_feed_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
