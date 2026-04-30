import process from 'node:process';
import {
  loadTradeWiseResearchFeed,
} from '../src/lib/tradewise/research-provider';

function readInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function isTruthy(value: string | undefined): boolean {
  return ['1', 'true', 'yes', 'on'].includes((value ?? '').toLowerCase());
}

async function main() {
  const remoteUrl = process.env.TRADEWISE_RESEARCH_REMOTE_URL?.trim();
  if (!remoteUrl) {
    throw new Error('missing TRADEWISE_RESEARCH_REMOTE_URL');
  }

  process.env.TRADEWISE_RESEARCH_PROVIDER = 'remote';

  const market =
    process.env.TRADEWISE_RESEARCH_TEST_MARKET === 'us_stock'
      ? 'us_stock'
      : 'a_stock';
  const limit = readInt(process.env.TRADEWISE_RESEARCH_TEST_LIMIT, 3);
  const requireLive = !isTruthy(process.env.TRADEWISE_RESEARCH_ALLOW_MOCK);

  const feed = await loadTradeWiseResearchFeed({ market, limit });
  if (!feed.version.trim()) {
    throw new Error('upstream_feed_missing_version');
  }
  if (!Array.isArray(feed.items) || feed.items.length === 0) {
    throw new Error('upstream_feed_empty_items');
  }
  if (feed.items.length > limit) {
    throw new Error('upstream_feed_limit_not_applied');
  }
  if (feed.items.some((item) => item.market !== market)) {
    throw new Error('upstream_feed_market_not_normalized');
  }
  if (requireLive && feed.items.every((item) => item.isMock)) {
    throw new Error('upstream_feed_expected_live_items');
  }

  const sample = feed.items[0];
  console.log(
    JSON.stringify(
      {
        ok: true,
        version: feed.version,
        count: feed.items.length,
        sample: sample
          ? {
              id: sample.id,
              market: sample.market,
              sector: sample.sector,
              title: sample.title,
              source: sample.source,
              keywords: sample.keywords.slice(0, 3),
              isMock: sample.isMock,
            }
          : null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    'tradewise:research:upstream:fail',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
