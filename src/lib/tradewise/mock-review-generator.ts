import type {
  TradeWiseProfitMetrics,
  TradeWiseReviewGenerateRequest,
  TradeWiseReviewGenerateResponse,
  TradeWiseReviewScoreSet,
} from "@/lib/tradewise/review-contract";

const clampScore = (value: number) => Math.max(1, Math.min(10, Math.round(value)));

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toISOString().slice(0, 10);
};


function formatTradingStyleLabel(value: string): string {
  switch (value) {
    case "shortTerm":
    case "short_term":
      return "短线";
    case "swing":
      return "波段";
    case "longTerm":
    case "long_term":
      return "长线";
    default:
      return "混合型";
  }
}

function formatMarketLabel(value: "a_stock" | "us_stock"): string {
  return value === "us_stock" ? "美股" : "A股";
}

function buildTradingPattern(style: string, buyCount: number, sellCount: number): string {
  switch (style) {
    case "shortTerm":
    case "short_term":
      return buyCount >= sellCount ? "短线主动试错" : "短线兑现收缩";
    case "swing":
      return buyCount === sellCount ? "波段攻守平衡" : "波段滚动交易";
    case "longTerm":
    case "long_term":
      return "长线耐心布局";
    default:
      return buyCount === sellCount ? "攻守平衡" : buyCount > sellCount ? "主动试错" : "兑现收缩";
  }
}

export function buildMockTradeWiseReview(
  input: TradeWiseReviewGenerateRequest,
): TradeWiseReviewGenerateResponse {
  const totalAmount = input.trades.reduce((sum, trade) => sum + trade.amount, 0);
  const tradesWithEmotion = input.trades.filter((trade) => typeof trade.emotionScore === "number");
  const averageEmotion =
    tradesWithEmotion.length === 0
      ? 5
      : tradesWithEmotion.reduce((sum, trade) => sum + (trade.emotionScore ?? 0), 0) / tradesWithEmotion.length;
  const planRatio =
    input.trades.length === 0
      ? 0
      : input.trades.filter((trade) => trade.reasonTags.includes("plan")).length / input.trades.length;
  const sectorHitCount = input.trades.filter((trade) => {
    if (!trade.industryLogic) return false;
    return input.watchSectors.some((sector) => trade.industryLogic?.includes(sector));
  }).length;
  const buyCount = input.trades.filter((trade) => trade.direction === "buy").length;
  const sellCount = input.trades.length - buyCount;

  const scores: TradeWiseReviewScoreSet = {
    emotion: clampScore(averageEmotion + (planRatio >= 0.5 ? 1 : 0)),
    logic: clampScore(5 + Math.min(3, input.trades.filter((trade) => trade.reason.length >= 12).length)),
    discipline: clampScore(4 + Math.round(planRatio * 4)),
    industryInsight: clampScore(4 + Math.min(3, sectorHitCount)),
    timing: clampScore(5 + (sellCount > buyCount ? 1 : 0)),
    riskManagement: clampScore(4 + (input.trades.every((trade) => trade.commission >= 0) ? 2 : 0)),
  };

  const strengthSectors = Array.from(
    new Set(
      input.watchSectors.filter((sector) =>
        input.trades.some((trade) => trade.industryLogic?.includes(sector)),
      ),
    ),
  );
  if (strengthSectors.length === 0) {
    strengthSectors.push(...input.watchSectors.slice(0, 2));
  }

  const weakestDimension = Object.entries(scores).sort((left, right) => left[1] - right[1])[0]?.[0] ?? "emotion";
  const weakestLabelMap: Record<string, string> = {
    emotion: "情绪控制",
    logic: "逻辑判断",
    discipline: "交易纪律",
    industryInsight: "产业洞察",
    timing: "时机把握",
    riskManagement: "风险管理",
  };

  const tradingStyleLabel = formatTradingStyleLabel(input.userProfile.tradingStyle);
  const marketLabel = formatMarketLabel(input.userProfile.preferredMarket);
  const tradingPattern = buildTradingPattern(input.userProfile.tradingStyle, buyCount, sellCount);

  const profitMetrics: TradeWiseProfitMetrics = {
    winRate: Math.min(0.85, 0.38 + input.trades.length * 0.06),
    profitLossRatio: 0.8 + planRatio,
    totalProfit: totalAmount === 0 ? 0 : ((buyCount - sellCount) / Math.max(1, input.trades.length)) * 0.06,
    maxDrawdown: Math.max(0.03, 0.12 - planRatio * 0.05),
  };

  return {
    reviewDate: formatDate(input.reviewDate),
    generatedAt: new Date().toISOString(),
    summary:
      `今天共记录 ${input.trades.length} 笔交易，累计成交额约 ${totalAmount.toFixed(0)} 元。` +
      `按你的${tradingStyleLabel}风格与${marketLabel}偏好口径看，` +
      `当前执行更偏 ${buyCount >= sellCount ? "主动布局" : "节奏兑现"}，` +
      `最值得继续强化的是 ${weakestLabelMap[weakestDimension] ?? "情绪控制"}。`,
    scores,
    tradingPattern,
    strengthSectors: strengthSectors.slice(0, 3),
    profitMetrics,
    tomorrowPlan:
      strengthSectors.length === 0
        ? `明天继续按${tradingStyleLabel}节奏筛选最熟悉的${marketLabel}板块，只做计划内交易。`
        : `明天优先跟踪 ${strengthSectors[0]}，并按${tradingStyleLabel}节奏处理${marketLabel}机会，只在计划内触发点出现时执行。`,
    generatorVersion: "server.review.mock.v1",
  };
}
