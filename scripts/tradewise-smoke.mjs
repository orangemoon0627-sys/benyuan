const baseUrl = process.env.BENYUAN_BASE_URL ?? 'http://127.0.0.1:3100';

async function requestJson(path, init) {
  const response = await fetch(baseUrl + path, init);
  const body = await response.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error(`invalid_json path=${path} body=${body.slice(0, 200)}`);
  }
  if (!response.ok) {
    throw new Error(`http_${response.status} path=${path} error=${json.error ?? body}`);
  }
  return json;
}

function buildReviewPayload() {
  return {
    reviewDate: '2026-03-10',
    trades: [
      {
        id: 'trade-1',
        stockCode: '600519',
        stockName: '贵州茅台',
        market: 'a_stock',
        direction: 'buy',
        price: 1688,
        quantity: 100,
        amount: 168800,
        commission: 12,
        tradeTime: '2026-03-10T09:35:00.000Z',
        reason: '计划内低吸',
        reasonTags: ['plan', 'technical'],
        industryLogic: '电网设备景气改善',
        emotionScore: 7,
      },
    ],
    userProfile: {
      id: 'profile-1',
      nickname: '樊浩',
      tradingStyle: 'mixed',
      preferredMarket: 'a_stock',
    },
    watchSectors: ['电网设备', '算力基础设施'],
    recentReviews: [],
  };
}

async function main() {
  console.log(`tradewise:smoke:start base=${baseUrl}`);

  const research = await requestJson('/api/tradewise/research/feed?market=a_stock&limit=2');
  if (!research.version || !Array.isArray(research.items) || research.items.length === 0) {
    throw new Error('research_feed_invalid');
  }
  console.log(`tradewise:smoke:research ok version=${research.version} count=${research.items.length}`);

  const review = await requestJson('/api/tradewise/review/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(buildReviewPayload()),
  });
  if (!review.summary || !review.scores || !review.profitMetrics) {
    throw new Error('review_response_invalid');
  }
  console.log(`tradewise:smoke:review ok version=${review.generatorVersion} pattern=${review.tradingPattern}`);
  console.log('tradewise:smoke:pass');
}

main().catch((error) => {
  console.error('tradewise:smoke:fail', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
