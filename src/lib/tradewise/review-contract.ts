export type TradeWiseMarket = "a_stock" | "us_stock";
export type TradeWiseTradeDirection = "buy" | "sell";
export type TradeWiseTradeReasonTag =
  | "technical"
  | "news"
  | "plan"
  | "emotion"
  | "valuation"
  | "sector_rotation";

export type TradeWiseReviewScoreSet = {
  emotion: number;
  logic: number;
  discipline: number;
  industryInsight: number;
  timing: number;
  riskManagement: number;
};

export type TradeWiseProfitMetrics = {
  winRate: number;
  profitLossRatio: number;
  totalProfit: number;
  maxDrawdown: number;
};

export type TradeWiseTradeInput = {
  id: string;
  stockCode: string;
  stockName: string;
  market: TradeWiseMarket;
  direction: TradeWiseTradeDirection;
  price: number;
  quantity: number;
  amount: number;
  commission: number;
  tradeTime: string;
  reason: string;
  reasonTags: TradeWiseTradeReasonTag[];
  industryLogic?: string | null;
  emotionScore?: number | null;
};

export type TradeWiseUserProfileInput = {
  id: string;
  nickname: string;
  tradingStyle: string;
  preferredMarket: TradeWiseMarket;
};

export type TradeWiseRecentReviewInput = {
  reviewDate: string;
  summary: string;
  tradingPattern: string;
  strengthSectors: string[];
  scores: TradeWiseReviewScoreSet;
  profitMetrics: TradeWiseProfitMetrics;
};

export type TradeWiseReviewGenerateRequest = {
  reviewDate: string;
  trades: TradeWiseTradeInput[];
  userProfile: TradeWiseUserProfileInput;
  watchSectors: string[];
  recentReviews: TradeWiseRecentReviewInput[];
};

export type TradeWiseReviewGenerateResponse = {
  reviewDate: string;
  generatedAt: string;
  summary: string;
  scores: TradeWiseReviewScoreSet;
  tradingPattern: string;
  strengthSectors: string[];
  profitMetrics: TradeWiseProfitMetrics;
  tomorrowPlan: string;
  generatorVersion: string;
};

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isIsoDateString = (value: unknown): value is string =>
  isNonEmptyString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isIsoDateTimeString = (value: unknown): value is string =>
  isNonEmptyString(value) && !Number.isNaN(Date.parse(value));

const isScoreValue = (value: unknown): value is number =>
  isFiniteNumber(value) && value >= 1 && value <= 10;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => isNonEmptyString(item));

const isMarket = (value: unknown): value is TradeWiseMarket =>
  value === "a_stock" || value === "us_stock";

const isDirection = (value: unknown): value is TradeWiseTradeDirection =>
  value === "buy" || value === "sell";

const isReasonTag = (value: unknown): value is TradeWiseTradeReasonTag =>
  value === "technical" ||
  value === "news" ||
  value === "plan" ||
  value === "emotion" ||
  value === "valuation" ||
  value === "sector_rotation";

const isScoreSet = (value: unknown): value is TradeWiseReviewScoreSet => {
  if (!isRecord(value)) return false;
  return [
    value.emotion,
    value.logic,
    value.discipline,
    value.industryInsight,
    value.timing,
    value.riskManagement,
  ].every(isScoreValue);
};

const isProfitMetrics = (value: unknown): value is TradeWiseProfitMetrics => {
  if (!isRecord(value)) return false;
  return [
    value.winRate,
    value.profitLossRatio,
    value.totalProfit,
    value.maxDrawdown,
  ].every(isFiniteNumber);
};

const isTradeInput = (value: unknown): value is TradeWiseTradeInput => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.stockCode === "string" &&
    typeof value.stockName === "string" &&
    isMarket(value.market) &&
    isDirection(value.direction) &&
    isFiniteNumber(value.price) &&
    isFiniteNumber(value.quantity) &&
    isFiniteNumber(value.amount) &&
    isFiniteNumber(value.commission) &&
    isIsoDateTimeString(value.tradeTime) &&
    isNonEmptyString(value.reason) &&
    Array.isArray(value.reasonTags) &&
    value.reasonTags.every(isReasonTag) &&
    (value.industryLogic === undefined || value.industryLogic === null || typeof value.industryLogic === "string") &&
    (value.emotionScore === undefined || value.emotionScore === null || isFiniteNumber(value.emotionScore))
  );
};

const isUserProfileInput = (value: unknown): value is TradeWiseUserProfileInput => {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.nickname) &&
    isNonEmptyString(value.tradingStyle) &&
    isMarket(value.preferredMarket)
  );
};

const isRecentReviewInput = (value: unknown): value is TradeWiseRecentReviewInput => {
  if (!isRecord(value)) return false;
  return (
    isIsoDateString(value.reviewDate) &&
    isNonEmptyString(value.summary) &&
    isNonEmptyString(value.tradingPattern) &&
    isStringArray(value.strengthSectors) &&
    isScoreSet(value.scores) &&
    isProfitMetrics(value.profitMetrics)
  );
};

export function validateReviewGenerateRequest(
  value: unknown,
): ValidationResult<TradeWiseReviewGenerateRequest> {
  if (!isRecord(value)) {
    return { ok: false, error: "invalid_payload" };
  }
  if (!isIsoDateString(value.reviewDate)) {
    return { ok: false, error: "missing_review_date" };
  }
  if (!Array.isArray(value.trades) || !value.trades.every(isTradeInput)) {
    return { ok: false, error: "invalid_trades" };
  }
  if (!isUserProfileInput(value.userProfile)) {
    return { ok: false, error: "invalid_user_profile" };
  }
  if (!isStringArray(value.watchSectors)) {
    return { ok: false, error: "invalid_watch_sectors" };
  }
  if (!Array.isArray(value.recentReviews) || !value.recentReviews.every(isRecentReviewInput)) {
    return { ok: false, error: "invalid_recent_reviews" };
  }

  return {
    ok: true,
    value: {
      reviewDate: value.reviewDate,
      trades: value.trades,
      userProfile: value.userProfile,
      watchSectors: value.watchSectors,
      recentReviews: value.recentReviews,
    },
  };
}


export function validateReviewGenerateResponse(
  value: unknown,
): value is TradeWiseReviewGenerateResponse {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isIsoDateString(value.reviewDate) &&
    isIsoDateTimeString(value.generatedAt) &&
    isNonEmptyString(value.summary) &&
    isScoreSet(value.scores) &&
    isNonEmptyString(value.tradingPattern) &&
    isStringArray(value.strengthSectors) &&
    value.strengthSectors.length > 0 &&
    isProfitMetrics(value.profitMetrics) &&
    isNonEmptyString(value.tomorrowPlan) &&
    isNonEmptyString(value.generatorVersion)
  );
}
