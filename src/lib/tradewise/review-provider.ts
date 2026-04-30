import { readCodexProviderDefaults } from "@/lib/codex-runtime";
import { buildMockTradeWiseReview } from "@/lib/tradewise/mock-review-generator";
import {
  validateReviewGenerateResponse,
  type TradeWiseRecentReviewInput,
  type TradeWiseReviewGenerateRequest,
  type TradeWiseReviewGenerateResponse,
  type TradeWiseReviewScoreSet,
  type TradeWiseTradeInput,
} from "@/lib/tradewise/review-contract";

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const DEFAULT_ANTHROPIC_MODEL =
  process.env.TRADEWISE_ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_MODEL = "gpt-5.4";
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_OPENAI_TIMEOUT_MS = 90_000;
const DEFAULT_OPENAI_MAX_OUTPUT_TOKENS = 700;
const DEFAULT_NON_OFFICIAL_OPENAI_MAX_OUTPUT_TOKENS = 480;
const DEFAULT_OPENAI_REASONING_EFFORT = "low";
const DEFAULT_OPENAI_STREAM = false;
const DEFAULT_OPENAI_SOFT_TIMEOUT_MS = 60_000;
const DEFAULT_RECENT_REVIEW_LIMIT = 2;
const DEFAULT_NON_OFFICIAL_RECENT_REVIEW_LIMIT = 1;
const DEFAULT_TRADE_DIGEST_LIMIT = 8;
const DEFAULT_NON_OFFICIAL_TRADE_DIGEST_LIMIT = 4;
const DEFAULT_PROMPT_TEXT_LIMIT = 24;
const DEFAULT_NON_OFFICIAL_PROMPT_TEXT_LIMIT = 16;

type TradeWiseReviewProvider = "mock" | "anthropic" | "crs";

type AnthropicMessageResponse = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
  };
};

type OpenAIResponsesResponse = {
  id?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
    type?: string;
  };
};

type CodedRuntimeDefaults = ReturnType<typeof readCodexProviderDefaults>;

type ReviewPromptOptions = {
  compactMode: boolean;
  recentReviewLimit: number;
  tradeDigestLimit: number;
  tradeTextLimit: number;
};

type ReviewFallbackCategory =
  | "timeout"
  | "schema"
  | "upstream"
  | "config"
  | "transport"
  | "unknown";

type ReviewConfigReason =
  | "payment_required"
  | "quota_exceeded"
  | "billing_required"
  | "provider_denied"
  | "missing_runtime"
  | "unsupported_wire_api"
  | "unknown_config";

type ReviewDiagnosticClassification = "environment" | "code" | "unknown";

type ReviewResultSource = "live" | "fallback" | "mock";

type OpenAITransportMode = "json" | "stream";

type ReviewProviderDiagnosticMeta = {
  responseStatus?: number;
  responsePreview?: string;
  responseKeys?: string[];
  transportMode?: OpenAITransportMode;
  configReason?: ReviewConfigReason;
};

type ReviewFallbackResolution = {
  fallbackCategory: ReviewFallbackCategory;
  configReason?: ReviewConfigReason;
  diagnosis: ReviewDiagnosticClassification;
  nextAction: string;
};

type ReviewResultDiagnosticMeta = {
  source: ReviewResultSource;
  provider: TradeWiseReviewProvider;
  generatorVersion: string;
  fallbackCategory?: ReviewFallbackCategory;
  configReason?: ReviewConfigReason;
  diagnosis: ReviewDiagnosticClassification;
  nextAction: string;
  responseStatus?: number;
  transportMode?: OpenAITransportMode;
  baseUrlHost?: string;
  wireApi?: string;
  latencyMs?: number;
  errorMessage?: string;
};

type ReviewNormalizationResult = {
  review: TradeWiseReviewGenerateResponse;
  scoreAliasMappings: string[];
  normalizationNotes: string[];
};

type OpenAIRuntime = {
  apiKey?: string;
  baseUrl: string;
  model: string;
  wireApi: "responses";
  reasoningEffort?: "low" | "medium" | "high";
  disableStorage: boolean;
  timeoutMs: number;
  softTimeoutMs: number;
  fallbackToMock: boolean;
  maxOutputTokens: number;
  stream: boolean;
};

const REVIEW_RESULT_DIAGNOSTIC = Symbol("tradewise.review.result-diagnostic");

export type TradeWiseReviewResultDiagnostic = Readonly<ReviewResultDiagnosticMeta>;

export async function generateTradeWiseReview(
  input: TradeWiseReviewGenerateRequest,
): Promise<TradeWiseReviewGenerateResponse> {
  const provider = resolveReviewProvider();
  if (provider === "anthropic") {
    const review = await generateAnthropicReview(input);
    return attachReviewResultDiagnostic(review, {
      source: "live",
      provider: "anthropic",
      generatorVersion: review.generatorVersion,
      diagnosis: "unknown",
      nextAction: "none",
    });
  }
  if (provider === "crs") {
    return generateCrsReview(input);
  }
  const review = buildMockTradeWiseReview(input);
  return attachReviewResultDiagnostic(review, {
    source: "mock",
    provider: "mock",
    generatorVersion: review.generatorVersion,
    diagnosis: "unknown",
    nextAction: "switch_provider_from_mock",
  });
}

function resolveReviewProvider(): TradeWiseReviewProvider {
  const rawProvider = (process.env.TRADEWISE_REVIEW_PROVIDER ?? "mock").toLowerCase();
  if (rawProvider === "anthropic") {
    return "anthropic";
  }
  if (["crs", "openai", "responses", "custom"].includes(rawProvider)) {
    return "crs";
  }
  return "mock";
}

async function generateAnthropicReview(
  input: TradeWiseReviewGenerateRequest,
): Promise<TradeWiseReviewGenerateResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("anthropic_api_key_missing");
  }

  try {
    const response = await fetch(ANTHROPIC_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(resolveAnthropicTimeoutMs()),
      body: JSON.stringify({
        model: DEFAULT_ANTHROPIC_MODEL,
        max_tokens: 1400,
        system:
          "You are TradeWise AI's review engine. Return one valid JSON object only. No markdown fences, no prose, no explanation.",
        messages: [
          {
            role: "user",
            content: buildAnthropicPrompt(input),
          },
        ],
      }),
    });

    const rawBody = await response.text();
    const payload = parseAnthropicApiPayload(rawBody, response.ok);
    if (!response.ok) {
      const message =
        payload.error?.message ?? payload.error?.type ?? `anthropic_status_${response.status}`;
      throw new Error(message);
    }

    const text = payload.content?.find((block) => block.type === "text")?.text;
    if (!text) {
      throw new Error("anthropic_empty_text_response");
    }

    return normalizeReviewResponse(
      parseJsonResponse(text),
      input,
      `anthropic.${DEFAULT_ANTHROPIC_MODEL}`,
    );
  } catch (error) {
    throw normalizeProviderError(error, "anthropic");
  }
}

async function generateCrsReview(
  input: TradeWiseReviewGenerateRequest,
): Promise<TradeWiseReviewGenerateResponse> {
  const runtime = resolveOpenAIRuntime();
  const startedAt = Date.now();
  if (!runtime.apiKey) {
    const missingApiKeyError = new Error("openai_api_key_missing");
    const fallbackResolution = resolveReviewFallbackResolution(
      runtime,
      missingApiKeyError,
      false,
    );
    if (fallbackResolution) {
      return buildFallbackMockReview(
        missingApiKeyError,
        input,
        runtime,
        false,
        fallbackResolution,
        Date.now() - startedAt,
      );
    }
    throw missingApiKeyError;
  }

  const softTimeoutController = new AbortController();
  const softTimeoutMs = resolveEffectiveSoftTimeoutMs(runtime);
  let softTimeoutTriggered = false;
  const softTimeoutHandle =
    softTimeoutMs > 0
      ? setTimeout(() => {
          softTimeoutTriggered = true;
          softTimeoutController.abort();
        }, softTimeoutMs)
      : null;

  try {
    const { text, status, error, transportMode, responsePreview } = await requestOpenAIResponsesText(
      runtime,
      {
        model: runtime.model,
        store: !runtime.disableStorage,
        text: { format: { type: "text" } },
        max_output_tokens: runtime.maxOutputTokens,
        ...(runtime.reasoningEffort
          ? { reasoning: { effort: runtime.reasoningEffort } }
          : {}),
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You are TradeWise AI's review engine. Return one valid JSON object only. No markdown fences, no prose, no explanation.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildOpenAIPrompt(
                  input,
                  buildOpenAIReviewPromptOptions(runtime.baseUrl),
                ),
              },
            ],
          },
        ],
      },
      softTimeoutHandle ? softTimeoutController.signal : undefined,
    );

    if (error) {
      throw annotateProviderError(new Error(error ?? `openai_status_${status}`), {
        responseStatus: status,
        responsePreview,
        transportMode,
      });
    }
    if (!text) {
      throw annotateProviderError(new Error("openai_empty_text_response"), {
        responseStatus: status,
        responsePreview,
        transportMode,
      });
    }

    let normalizedReview: ReviewNormalizationResult;
    try {
      normalizedReview = normalizeTradeWiseReviewPayload(
        parseJsonResponse(text),
        input,
        `crs.${runtime.model}`,
      );
    } catch (error) {
      throw annotateProviderError(error, {
        responseStatus: status,
        responsePreview: responsePreview ?? text,
        transportMode,
      });
    }
    const appliedNormalizations = [
      ...normalizedReview.scoreAliasMappings,
      ...normalizedReview.normalizationNotes,
    ];
    const elapsedMs = Date.now() - startedAt;
    if (appliedNormalizations.length > 0) {
      logOpenAIReviewNormalization(
        runtime,
        normalizedReview.review.generatorVersion,
        appliedNormalizations,
        elapsedMs,
      );
    }
    logOpenAIReviewLive(runtime, normalizedReview.review.generatorVersion, elapsedMs);
    return attachReviewResultDiagnostic(normalizedReview.review, {
      source: "live",
      provider: "crs",
      generatorVersion: normalizedReview.review.generatorVersion,
      diagnosis: "unknown",
      nextAction: "none",
      responseStatus: status,
      transportMode,
      baseUrlHost: resolveBaseUrlHost(runtime.baseUrl),
      wireApi: runtime.wireApi,
      latencyMs: elapsedMs,
    });
  } catch (error) {
    const normalized = normalizeProviderError(error, "openai");
    const fallbackResolution = resolveReviewFallbackResolution(
      runtime,
      normalized,
      softTimeoutTriggered,
    );
    if (fallbackResolution) {
      return buildFallbackMockReview(
        normalized,
        input,
        runtime,
        softTimeoutTriggered,
        fallbackResolution,
        Date.now() - startedAt,
      );
    }
    throw normalized;
  } finally {
    if (softTimeoutHandle) {
      clearTimeout(softTimeoutHandle);
    }
  }
}

function buildAnthropicPrompt(input: TradeWiseReviewGenerateRequest): string {
  return [
    "你是 TradeWise 单日复盘引擎，只返回一个 JSON 对象。",
    "字段只能包含：reviewDate、generatedAt、summary、scores、tradingPattern、strengthSectors、profitMetrics、tomorrowPlan、generatorVersion。",
    "scores 内 6 个分数字段都为 1-10 整数；profitMetrics 全部为数字；strengthSectors 最多 3 个。",
    "summary 与 tomorrowPlan 使用简洁中文，不要 Markdown，不要解释。",
    buildCompactReviewContext(input),
  ].join("\n");
}

function buildOpenAIPrompt(
  input: TradeWiseReviewGenerateRequest,
  options: ReviewPromptOptions,
): string {
  if (options.compactMode) {
    return [
      "你是 TradeWise 单日复盘引擎，只输出一个 JSON 对象。",
      "字段: reviewDate, generatedAt, summary, scores, tradingPattern, strengthSectors, profitMetrics, tomorrowPlan, generatorVersion。",
      "summary <= 90字；tomorrowPlan <= 24字；strengthSectors <= 3。",
      "scores 六项都为 1-10 整数；profitMetrics 四项都为数字。",
      buildCompactReviewContext(input, options),
    ].join("\n");
  }

  return [
    "你是 TradeWise 单日复盘教练，只返回一个 JSON 对象。",
    "字段只能包含：reviewDate、generatedAt、summary、scores、tradingPattern、strengthSectors、profitMetrics、tomorrowPlan、generatorVersion。",
    "scores={emotion,logic,discipline,industryInsight,timing,riskManagement}，全部为 1-10 整数。",
    "profitMetrics={winRate,profitLossRatio,totalProfit,maxDrawdown}，全部为数字；strengthSectors 最多 3 个。",
    "summary 写给交易者直接阅读，tomorrowPlan 只给一句可执行计划；不要代码块、不要解释。",
    buildCompactReviewContext(input, options),
  ].join("\n");
}

function buildOpenAIReviewPromptOptions(baseUrl: string): ReviewPromptOptions {
  const compactMode = !isOfficialOpenAIBaseUrl(baseUrl);
  return {
    compactMode,
    recentReviewLimit: compactMode
      ? DEFAULT_NON_OFFICIAL_RECENT_REVIEW_LIMIT
      : DEFAULT_RECENT_REVIEW_LIMIT,
    tradeDigestLimit: compactMode
      ? DEFAULT_NON_OFFICIAL_TRADE_DIGEST_LIMIT
      : DEFAULT_TRADE_DIGEST_LIMIT,
    tradeTextLimit: compactMode
      ? DEFAULT_NON_OFFICIAL_PROMPT_TEXT_LIMIT
      : DEFAULT_PROMPT_TEXT_LIMIT,
  };
}

function buildCompactReviewContext(
  input: TradeWiseReviewGenerateRequest,
  options: ReviewPromptOptions = {
    compactMode: false,
    recentReviewLimit: DEFAULT_RECENT_REVIEW_LIMIT,
    tradeDigestLimit: DEFAULT_TRADE_DIGEST_LIMIT,
    tradeTextLimit: DEFAULT_PROMPT_TEXT_LIMIT,
  },
): string {
  const tradeStats = summarizeTrades(input.trades);
  const displayedTrades = input.trades.slice(0, options.tradeDigestLimit);
  const recentReviews = input.recentReviews
    .slice(-options.recentReviewLimit)
    .map((review, index) => buildRecentReviewDigest(review, index + 1, options));

  return [
    `复盘日期: ${input.reviewDate}`,
    `用户: ${input.userProfile.nickname} | 风格=${input.userProfile.tradingStyle} | 市场=${input.userProfile.preferredMarket}`,
    `关注板块: ${input.watchSectors.length > 0 ? input.watchSectors.join("、") : "无"}`,
    `统计: 买入${tradeStats.buyCount} | 卖出${tradeStats.sellCount} | 成交额=${formatNumber(tradeStats.totalAmount)} | 计划内=${tradeStats.planRatio}% | 情绪=${tradeStats.averageEmotion ?? "无"}`,
    "当日交易:",
    displayedTrades.length > 0
      ? displayedTrades
          .map((trade, index) => buildTradeDigest(trade, index + 1, options))
          .join("\n")
      : "- 无交易",
    input.trades.length > displayedTrades.length
      ? `- 其余 ${input.trades.length - displayedTrades.length} 笔交易已省略`
      : undefined,
    "最近复盘:",
    recentReviews.length > 0 ? recentReviews.join("\n") : "- 无历史复盘",
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n");
}

function summarizeTrades(trades: TradeWiseTradeInput[]) {
  const totalAmount = trades.reduce((sum, trade) => sum + trade.amount, 0);
  const buyCount = trades.filter((trade) => trade.direction === "buy").length;
  const sellCount = trades.length - buyCount;
  const planCount = trades.filter((trade) => trade.reasonTags.includes("plan")).length;
  const emotionValues = trades
    .map((trade) => trade.emotionScore)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  return {
    totalAmount,
    buyCount,
    sellCount,
    planRatio: trades.length === 0 ? 0 : Math.round((planCount / trades.length) * 100),
    averageEmotion:
      emotionValues.length === 0
        ? undefined
        : Number(
            (emotionValues.reduce((sum, value) => sum + value, 0) / emotionValues.length).toFixed(1),
          ),
  };
}

function buildTradeDigest(
  trade: TradeWiseTradeInput,
  index: number,
  options: ReviewPromptOptions,
): string {
  const parts = [
    `${index}. ${trade.direction === "buy" ? "买入" : "卖出"}`,
    `${trade.stockName}(${trade.stockCode})`,
    `${trade.quantity}股`,
    `@${formatNumber(trade.price)}`,
    `金额=${formatNumber(trade.amount)}`,
  ];

  if (trade.reasonTags.length > 0) {
    parts.push(`标签=${trade.reasonTags.join("/")}`);
  }
  if (typeof trade.emotionScore === "number") {
    parts.push(`情绪=${trade.emotionScore}`);
  }
  if (trade.reason.trim()) {
    parts.push(`理由=${truncateText(trade.reason, options.tradeTextLimit)}`);
  }
  if (trade.industryLogic?.trim()) {
    if (!options.compactMode) {
      parts.push(`逻辑=${truncateText(trade.industryLogic, options.tradeTextLimit)}`);
    }
  }

  return parts.join(" | ");
}

function buildRecentReviewDigest(
  review: TradeWiseRecentReviewInput,
  index: number,
  options: ReviewPromptOptions,
): string {
  if (options.compactMode) {
    return [
      `${index}. ${review.reviewDate}`,
      `模式=${truncateText(review.tradingPattern, 10)}`,
      `强项=${review.strengthSectors.slice(0, 2).join("/") || "无"}`,
      `总结=${truncateText(review.summary, options.tradeTextLimit)}`,
    ].join(" | ");
  }

  return [
    `${index}. ${review.reviewDate}`,
    `模式=${review.tradingPattern}`,
    `强项=${review.strengthSectors.slice(0, 3).join("/") || "无"}`,
    `分数=${review.scores.emotion}/${review.scores.logic}/${review.scores.discipline}/${review.scores.industryInsight}/${review.scores.timing}/${review.scores.riskManagement}`,
    `盈亏=${formatSignedPercent(review.profitMetrics.totalProfit)} | 盈亏比=${review.profitMetrics.profitLossRatio} | 回撤=${formatSignedPercent(review.profitMetrics.maxDrawdown)}`,
    `总结=${truncateText(review.summary, options.tradeTextLimit)}`,
  ].join(" | ");
}

function truncateText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2).replace(/\.00$/, "");
}

function formatSignedPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}`;
}

function resolveAnthropicTimeoutMs(): number {
  return resolveTimeoutMs(process.env.TRADEWISE_ANTHROPIC_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
}

function resolveOpenAIRuntime(): OpenAIRuntime {
  const defaults = readCodexProviderDefaults();
  const baseUrl =
    process.env.TRADEWISE_OPENAI_BASE_URL ?? defaults.baseUrl ?? DEFAULT_OPENAI_BASE_URL;
  const timeoutMs = resolveTimeoutMs(
    process.env.TRADEWISE_OPENAI_TIMEOUT_MS,
    DEFAULT_OPENAI_TIMEOUT_MS,
  );
  return {
    apiKey: process.env.TRADEWISE_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? defaults.apiKey,
    baseUrl,
    model: process.env.TRADEWISE_OPENAI_MODEL ?? defaults.model ?? DEFAULT_OPENAI_MODEL,
    wireApi: "responses",
    reasoningEffort: resolveReasoningEffort(
      process.env.TRADEWISE_OPENAI_REASONING_EFFORT,
      defaults,
      baseUrl,
    ),
    disableStorage: resolveDisableStorage(defaults),
    timeoutMs,
    softTimeoutMs: resolveOpenAISoftTimeoutMs(baseUrl, timeoutMs),
    fallbackToMock: resolveOpenAIFallbackToMock(baseUrl),
    maxOutputTokens: resolveMaxOutputTokens(baseUrl),
    stream: resolveOpenAIStream(baseUrl),
  };
}

function resolveReasoningEffort(
  envValue: string | undefined,
  defaults: CodedRuntimeDefaults,
  baseUrl: string,
): "low" | "medium" | "high" | undefined {
  const explicit = normalizeReasoningEffort(envValue);
  if (explicit) {
    return explicit;
  }

  if (readBooleanFlag(process.env.TRADEWISE_OPENAI_INHERIT_CODEX_REASONING)) {
    return normalizeReasoningEffort(defaults.reasoningEffort) ?? DEFAULT_OPENAI_REASONING_EFFORT;
  }

  return isOfficialOpenAIBaseUrl(baseUrl) ? DEFAULT_OPENAI_REASONING_EFFORT : undefined;
}

function normalizeReasoningEffort(
  value: string | undefined,
): "low" | "medium" | "high" | undefined {
  const raw = (value ?? "").toLowerCase();
  if (raw === "low" || raw === "medium" || raw === "high") {
    return raw;
  }
  return undefined;
}

function resolveDisableStorage(defaults: CodedRuntimeDefaults): boolean {
  const envValue = process.env.TRADEWISE_OPENAI_DISABLE_STORAGE;
  if (envValue === undefined) {
    return defaults.disableResponseStorage ?? false;
  }

  return readBooleanFlag(envValue);
}

function resolveEffectiveSoftTimeoutMs(runtime: OpenAIRuntime): number {
  if (!runtime.fallbackToMock) {
    return 0;
  }
  if (!Number.isFinite(runtime.softTimeoutMs) || runtime.softTimeoutMs <= 0) {
    return 0;
  }
  if (runtime.softTimeoutMs >= runtime.timeoutMs) {
    return Math.max(0, runtime.timeoutMs - 1_000);
  }
  return runtime.softTimeoutMs;
}

function resolveOpenAISoftTimeoutMs(baseUrl: string, hardTimeoutMs: number): number {
  const fallback = !isOfficialOpenAIBaseUrl(baseUrl);
  const raw = Number(
    process.env.TRADEWISE_OPENAI_SOFT_TIMEOUT_MS ??
      (fallback ? DEFAULT_OPENAI_SOFT_TIMEOUT_MS : 0),
  );
  if (!Number.isFinite(raw) || raw <= 0) {
    return 0;
  }
  return Math.min(Math.trunc(raw), Math.max(0, hardTimeoutMs - 1_000));
}

function resolveOpenAIFallbackToMock(baseUrl: string): boolean {
  const envValue = process.env.TRADEWISE_OPENAI_FALLBACK_TO_MOCK;
  if (envValue !== undefined) {
    return readBooleanFlag(envValue);
  }
  return !isOfficialOpenAIBaseUrl(baseUrl);
}

function resolveTimeoutMs(rawValue: string | undefined, fallback: number): number {
  const raw = Number(rawValue ?? fallback);
  if (!Number.isFinite(raw) || raw <= 0) {
    return fallback;
  }
  return raw;
}

function resolveMaxOutputTokens(baseUrl: string): number {
  const fallback = isOfficialOpenAIBaseUrl(baseUrl)
    ? DEFAULT_OPENAI_MAX_OUTPUT_TOKENS
    : DEFAULT_NON_OFFICIAL_OPENAI_MAX_OUTPUT_TOKENS;
  const raw = Number(process.env.TRADEWISE_OPENAI_MAX_OUTPUT_TOKENS ?? fallback);
  if (!Number.isFinite(raw) || raw <= 0) {
    return fallback;
  }
  return Math.trunc(raw);
}

function resolveOpenAIStream(baseUrl: string): boolean {
  const value = process.env.TRADEWISE_OPENAI_STREAM;
  if (value !== undefined) {
    return readBooleanFlag(value);
  }

  return isOfficialOpenAIBaseUrl(baseUrl) ? DEFAULT_OPENAI_STREAM : true;
}

function isOfficialOpenAIBaseUrl(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl);
    return url.origin === 'https://api.openai.com';
  } catch {
    return false;
  }
}

function readBooleanFlag(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  const raw = value.toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function parseAnthropicApiPayload(
  rawBody: string,
  allowEmptyObject: boolean,
): AnthropicMessageResponse {
  if (!rawBody.trim()) {
    if (allowEmptyObject) {
      return {};
    }
    throw new Error("anthropic_empty_api_response");
  }

  try {
    return JSON.parse(rawBody) as AnthropicMessageResponse;
  } catch {
    if (!allowEmptyObject) {
      throw new Error("anthropic_invalid_api_response");
    }
    return {};
  }
}

function parseOpenAIResponsesPayload(
  rawBody: string,
  allowEmptyObject: boolean,
): OpenAIResponsesResponse {
  if (!rawBody.trim()) {
    if (allowEmptyObject) {
      return {};
    }
    throw new Error("openai_empty_api_response");
  }

  try {
    return JSON.parse(rawBody) as OpenAIResponsesResponse;
  } catch {
    if (!allowEmptyObject) {
      throw new Error("openai_invalid_api_response");
    }
    return {};
  }
}

async function requestOpenAIResponsesText(
  runtime: OpenAIRuntime,
  requestBody: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<{
  text: string;
  status: number;
  error?: string;
  transportMode: OpenAITransportMode;
  responsePreview?: string;
}> {
  if (!runtime.stream) {
    const result = await requestOpenAIResponsesJson(runtime, requestBody, signal);
    if (!shouldRetryOpenAIWithStream(result)) {
      return result;
    }
    return requestOpenAIResponsesStreamText(runtime, requestBody, signal);
  }

  return requestOpenAIResponsesStreamText(runtime, requestBody, signal);
}

async function requestOpenAIResponsesJson(
  runtime: OpenAIRuntime,
  requestBody: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<{
  text: string;
  status: number;
  error?: string;
  transportMode: OpenAITransportMode;
  responsePreview?: string;
}> {
  const response = await fetch(joinBaseUrl(runtime.baseUrl, "responses"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${runtime.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    signal: buildRequestAbortSignal(runtime.timeoutMs, signal),
    body: JSON.stringify(requestBody),
  });

  const rawBody = await response.text();
  const payload = parseOpenAIResponsesPayload(rawBody, response.ok);
  if (!response.ok) {
    return {
      text: "",
      status: response.status,
      error: readOpenAIError(payload, rawBody, response.status),
      transportMode: "json",
      responsePreview: rawBody,
    };
  }
  return {
    text: readOpenAIText(payload),
    status: response.status,
    transportMode: "json",
    responsePreview: rawBody,
  };
}

async function requestOpenAIResponsesStreamText(
  runtime: OpenAIRuntime,
  requestBody: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<{
  text: string;
  status: number;
  error?: string;
  transportMode: OpenAITransportMode;
  responsePreview?: string;
}> {
  const response = await fetch(joinBaseUrl(runtime.baseUrl, "responses"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${runtime.apiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    signal: buildRequestAbortSignal(runtime.timeoutMs, signal),
    body: JSON.stringify({ ...requestBody, stream: true }),
  });

  if (!response.body) {
    const rawBody = await response.text();
    const payload = parseOpenAIResponsesPayload(rawBody, response.ok);
    if (!response.ok) {
      return {
        text: "",
        status: response.status,
        error: readOpenAIError(payload, rawBody, response.status),
        transportMode: "stream",
        responsePreview: rawBody,
      };
    }
    return {
      text: readOpenAIText(payload),
      status: response.status,
      transportMode: "stream",
      responsePreview: rawBody,
    };
  }

  const { text, error } = await readOpenAIResponsesStream(response);
  return {
    text,
    status: response.status,
    error,
    transportMode: "stream",
    responsePreview: text,
  };
}

async function readOpenAIResponsesStream(
  response: Response,
): Promise<{ text: string; error?: string }> {
  if (!response.body) {
    return { text: "", error: response.ok ? undefined : `openai_status_${response.status}` };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const events: Array<{ event?: string; data?: unknown }> = [];

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const parsedEvent = parseOpenAIStreamChunk(part);
      if (!parsedEvent) {
        continue;
      }
      events.push(parsedEvent);

      const current = readOpenAIStreamResult(events, response.status);
      if (shouldFinalizeOpenAIStreamResult(parsedEvent, current)) {
        try {
          await reader.cancel();
        } catch {
          // Ignore stream cancellation failures once we already have a valid payload.
        }
        return {
          text: extractStableJsonText(current.text) ?? current.text.trim(),
          error: current.error,
        };
      }
    }
  }

  const trailingEvent = parseOpenAIStreamChunk(buffer);
  if (trailingEvent) {
    events.push(trailingEvent);
  }

  const result = readOpenAIStreamResult(events, response.status);
  return {
    text: extractStableJsonText(result.text) ?? result.text.trim(),
    error: result.error,
  };
}

function parseOpenAIStreamChunk(part: string): { event?: string; data?: unknown } | null {
  const lines = part.split("\n").filter(Boolean);
  const event = lines.find((line) => line.startsWith("event: "))?.slice(7);
  const dataRaw = lines
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6))
    .join("\n");
  if (!dataRaw || dataRaw === "[DONE]") {
    return null;
  }

  let data: unknown = dataRaw;
  try {
    data = JSON.parse(dataRaw);
  } catch {
    data = dataRaw;
  }

  return { event, data };
}

function shouldFinalizeOpenAIStreamResult(
  event: { event?: string; data?: unknown },
  result: { text: string; error?: string },
): boolean {
  if (result.error || !result.text.trim()) {
    return false;
  }

  const payload = event.data;
  const type = isRecord(payload) && typeof payload.type === "string" ? payload.type : event.event;
  if (type === "response.output_text.done" || type === "response.completed") {
    return true;
  }

  return extractStableJsonText(result.text) !== null;
}

function readOpenAIStreamResult(
  events: Array<{ event?: string; data?: unknown }>,
  status: number,
): { text: string; error?: string } {
  let completedResponse: unknown;
  let text = "";
  let error: string | undefined;

  for (const event of events) {
    const payload = event.data;
    if (!isRecord(payload)) {
      if (typeof payload === "string" && !text) {
        text = payload;
      }
      continue;
    }

    const type = typeof payload.type === "string" ? payload.type : event.event;

    if (type === "response.output_text.delta" && typeof payload.delta === "string") {
      text += payload.delta;
    }

    if (type === "response.output_text.done" && typeof payload.text === "string") {
      text = payload.text;
    }

    if (type === "response.completed") {
      completedResponse = payload.response ?? payload;
    }

    if ((type === "error" || type === "response.failed") && isRecord(payload.error)) {
      error =
        (typeof payload.error.message === "string" && payload.error.message) ||
        (typeof payload.error.type === "string" && payload.error.type) ||
        error;
    }

    if (type === "response.error" && typeof payload.message === "string") {
      error = payload.message;
    }
  }

  const completedText = completedResponse
    ? readOpenAIText(completedResponse as OpenAIResponsesResponse)
    : "";
  if (!error && status >= 400) {
    error = `openai_status_${status}`;
  }

  return {
    text: (completedText || text).trim(),
    error,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOpenAIText(value: OpenAIResponsesResponse): string {
  if (!Array.isArray(value.output)) {
    return "";
  }

  return value.output
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .map((contentPart) => {
      const textValue = contentPart?.text;
      return typeof textValue === "string" ? textValue : "";
    })
    .join("")
    .trim();
}

function shouldRetryOpenAIWithStream(result: {
  status: number;
  error?: string;
}): boolean {
  if (result.status !== 400) {
    return false;
  }

  const message = (result.error ?? "").toLowerCase();
  return !message.includes("api_key") && !message.includes("unauthorized");
}

function buildRequestAbortSignal(timeoutMs: number, signal?: AbortSignal): AbortSignal {
  if (!signal) {
    return AbortSignal.timeout(timeoutMs);
  }
  return AbortSignal.any([AbortSignal.timeout(timeoutMs), signal]);
}

function resolveReviewFallbackResolution(
  runtime: OpenAIRuntime,
  error: Error,
  softTimeoutTriggered: boolean,
): ReviewFallbackResolution | null {
  if (!runtime.fallbackToMock) {
    return null;
  }

  const fallbackCategory = classifyReviewFallbackCategory(error, softTimeoutTriggered);
  const configReason =
    fallbackCategory === "config" ? classifyReviewConfigReason(error) : undefined;

  return {
    fallbackCategory,
    configReason,
    diagnosis: classifyReviewDiagnosis(fallbackCategory),
    nextAction: resolveReviewNextAction(fallbackCategory, configReason),
  };
}

function classifyReviewFallbackCategory(
  error: Error,
  softTimeoutTriggered: boolean,
): ReviewFallbackCategory {
  if (softTimeoutTriggered) {
    return "timeout";
  }

  const normalized = error.message.trim().toLowerCase();
  if (!normalized) {
    return "unknown";
  }

  if (
    normalized.includes("timeout") ||
    normalized.includes("timed out") ||
    normalized.includes("aborterror")
  ) {
    return "timeout";
  }

  if (
    normalized.includes("review_invalid_review_shape") ||
    normalized.includes("review_json_object_expected") ||
    normalized.includes("openai_empty_text_response") ||
    normalized.includes("openai_invalid_api_response") ||
    normalized.includes("openai_empty_api_response") ||
    normalized.includes("invalid json") ||
    normalized.includes("unexpected token")
  ) {
    return "schema";
  }

  if (
    normalized.includes("api_key") ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden") ||
    normalized.includes("invalid_request") ||
    normalized.includes("status_400") ||
    normalized.includes("status_401") ||
    normalized.includes("status_402") ||
    normalized.includes("status_403") ||
    normalized.includes("status_404") ||
    normalized.includes("not found") ||
    normalized.includes("bad request") ||
    normalized.includes("payment required") ||
    normalized.includes("insufficient credits") ||
    normalized.includes("quota") ||
    normalized.includes("billing")
  ) {
    return "config";
  }

  if (
    normalized.includes("status_429") ||
    normalized.includes("status_500") ||
    normalized.includes("status_502") ||
    normalized.includes("status_503") ||
    normalized.includes("status_504") ||
    normalized.includes("rate limit") ||
    normalized.includes("overloaded") ||
    normalized.includes("bad gateway") ||
    normalized.includes("service unavailable") ||
    normalized.includes("gateway timeout") ||
    normalized.includes("server error")
  ) {
    return "upstream";
  }

  if (
    normalized.includes("transport") ||
    normalized.includes("network") ||
    normalized.includes("fetch failed") ||
    normalized.includes("econn") ||
    normalized.includes("enotfound") ||
    normalized.includes("eai_again") ||
    normalized.includes("socket") ||
    normalized.includes("tls") ||
    normalized.includes("certificate") ||
    normalized.includes("connection reset")
  ) {
    return "transport";
  }

  return "unknown";
}

function buildFallbackMockReview(
  error: Error,
  input: TradeWiseReviewGenerateRequest,
  runtime: OpenAIRuntime,
  softTimeoutTriggered: boolean,
  fallbackResolution: ReviewFallbackResolution,
  elapsedMs: number,
): TradeWiseReviewGenerateResponse {
  const diagnostic = readProviderDiagnosticMeta(error);
  const mock = buildMockTradeWiseReview(input);
  const generatorVersion = `server.review.fallback.mock.${fallbackResolution.fallbackCategory}.v1`;
  logOpenAIReviewFallback(
    runtime,
    fallbackResolution,
    generatorVersion,
    error,
    softTimeoutTriggered,
    elapsedMs,
  );
  return attachReviewResultDiagnostic(
    {
      ...mock,
      generatorVersion,
    },
    {
      source: "fallback",
      provider: "crs",
      generatorVersion,
      fallbackCategory: fallbackResolution.fallbackCategory,
      configReason: fallbackResolution.configReason,
      diagnosis: fallbackResolution.diagnosis,
      nextAction: fallbackResolution.nextAction,
      responseStatus: diagnostic.responseStatus,
      transportMode: diagnostic.transportMode,
      baseUrlHost: resolveBaseUrlHost(runtime.baseUrl),
      wireApi: runtime.wireApi,
      latencyMs: elapsedMs,
      errorMessage: trimDiagnosticText(error.message),
    },
  );
}

function logOpenAIReviewNormalization(
  runtime: OpenAIRuntime,
  generatorVersion: string,
  appliedNormalizations: string[],
  elapsedMs: number,
) {
  emitReviewDiagnostic("info", {
    event: "tradewise.review.normalize",
    provider: "crs",
    baseUrl: runtime.baseUrl,
    model: runtime.model,
    wireApi: runtime.wireApi,
    elapsedMs,
    generatorVersion,
    appliedNormalizations,
  });
}

function logOpenAIReviewLive(
  runtime: OpenAIRuntime,
  generatorVersion: string,
  elapsedMs: number,
) {
  emitReviewDiagnostic("info", {
    event: "tradewise.review.live",
    provider: "crs",
    baseUrl: runtime.baseUrl,
    model: runtime.model,
    wireApi: runtime.wireApi,
    fallbackToMock: runtime.fallbackToMock,
    elapsedMs,
    generatorVersion,
  });
}

function logOpenAIReviewFallback(
  runtime: OpenAIRuntime,
  fallbackResolution: ReviewFallbackResolution,
  generatorVersion: string,
  error: Error,
  softTimeoutTriggered: boolean,
  elapsedMs: number,
) {
  const diagnostic = readProviderDiagnosticMeta(error);
  emitReviewDiagnostic("warn", {
    event: "tradewise.review.fallback",
    provider: "crs",
    category: fallbackResolution.fallbackCategory,
    fallbackCategory: fallbackResolution.fallbackCategory,
    configReason: fallbackResolution.configReason,
    diagnosis: fallbackResolution.diagnosis,
    nextAction: fallbackResolution.nextAction,
    baseUrl: runtime.baseUrl,
    baseUrlHost: resolveBaseUrlHost(runtime.baseUrl),
    model: runtime.model,
    wireApi: runtime.wireApi,
    fallbackToMock: runtime.fallbackToMock,
    timeoutMs: runtime.timeoutMs,
    softTimeoutMs: runtime.softTimeoutMs,
    softTimeoutTriggered,
    elapsedMs,
    generatorVersion,
    errorMessage: trimDiagnosticText(error.message),
    responseStatus: diagnostic.responseStatus,
    transportMode: diagnostic.transportMode,
    responseKeys: diagnostic.responseKeys,
    responsePreview: diagnostic.responsePreview,
  });
}


function classifyReviewConfigReason(error: Error): ReviewConfigReason {
  const diagnostic = readProviderDiagnosticMeta(error);
  const normalized = error.message.trim().toLowerCase();

  if (
    diagnostic.responseStatus === 402 ||
    normalized.includes("status_402") ||
    normalized.includes("payment required")
  ) {
    return "payment_required";
  }

  if (
    normalized.includes("quota") ||
    normalized.includes("insufficient credits") ||
    normalized.includes("insufficient quota")
  ) {
    return "quota_exceeded";
  }

  if (normalized.includes("billing")) {
    return "billing_required";
  }

  if (
    normalized.includes("unsupported_openai_wire_api") ||
    normalized.includes("unsupported_wire_api")
  ) {
    return "unsupported_wire_api";
  }

  if (
    normalized.includes("openai_api_key_missing") ||
    normalized.includes("missing_openai_runtime") ||
    normalized.includes("missing_runtime")
  ) {
    return "missing_runtime";
  }

  if (
    diagnostic.responseStatus === 401 ||
    diagnostic.responseStatus === 403 ||
    normalized.includes("status_401") ||
    normalized.includes("status_403") ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden") ||
    normalized.includes("invalid api key")
  ) {
    return "provider_denied";
  }

  return "unknown_config";
}

function classifyReviewDiagnosis(
  fallbackCategory: ReviewFallbackCategory,
): ReviewDiagnosticClassification {
  switch (fallbackCategory) {
    case "schema":
      return "code";
    case "config":
    case "timeout":
    case "upstream":
    case "transport":
      return "environment";
    default:
      return "unknown";
  }
}

function resolveReviewNextAction(
  fallbackCategory: ReviewFallbackCategory,
  configReason?: ReviewConfigReason,
): string {
  if (fallbackCategory === "config") {
    switch (configReason) {
      case "payment_required":
      case "quota_exceeded":
      case "billing_required":
        return "check_provider_billing_or_credits";
      case "provider_denied":
        return "verify_key_base_url_and_model_access";
      case "missing_runtime":
        return "set_provider_runtime_env";
      case "unsupported_wire_api":
        return "switch_to_supported_wire_api";
      default:
        return "inspect_provider_config_and_error";
    }
  }

  switch (fallbackCategory) {
    case "timeout":
      return "check_provider_latency_or_timeout_budget";
    case "schema":
      return "inspect_review_schema_contract";
    case "upstream":
      return "retry_or_check_provider_status";
    case "transport":
      return "check_network_tls_dns";
    default:
      return "inspect_review_fallback_logs";
  }
}

function resolveBaseUrlHost(baseUrl: string): string | undefined {
  try {
    return new URL(baseUrl).host;
  } catch {
    return undefined;
  }
}

function attachReviewResultDiagnostic(
  review: TradeWiseReviewGenerateResponse,
  diagnostic: ReviewResultDiagnosticMeta,
): TradeWiseReviewGenerateResponse {
  Object.defineProperty(review, REVIEW_RESULT_DIAGNOSTIC, {
    value: diagnostic,
    enumerable: false,
    configurable: true,
  });
  return review;
}

export function readTradeWiseReviewResultDiagnostic(
  review: TradeWiseReviewGenerateResponse,
): TradeWiseReviewResultDiagnostic | undefined {
  return (
    review as TradeWiseReviewGenerateResponse & {
      [REVIEW_RESULT_DIAGNOSTIC]?: ReviewResultDiagnosticMeta;
    }
  )[REVIEW_RESULT_DIAGNOSTIC];
}

export function applyTradeWiseReviewDiagnosticHeaders(
  headers: Headers,
  review: TradeWiseReviewGenerateResponse,
): void {
  const diagnostic = readTradeWiseReviewResultDiagnostic(review);
  const source = diagnostic?.source ?? "unknown";
  headers.set("x-tradewise-review-result", source);
  headers.set(
    "x-tradewise-review-fallback-category",
    diagnostic?.fallbackCategory ?? "none",
  );
  headers.set("x-tradewise-review-config-reason", diagnostic?.configReason ?? "none");
  headers.set("x-tradewise-review-diagnosis", diagnostic?.diagnosis ?? "unknown");
  headers.set("x-tradewise-review-provider", diagnostic?.provider ?? "unknown");
  headers.set("x-tradewise-review-generator-version", review.generatorVersion);
  headers.set("x-tradewise-review-next-action", diagnostic?.nextAction ?? "none");
  if (diagnostic?.latencyMs !== undefined) {
    headers.set("x-tradewise-review-latency-ms", String(diagnostic.latencyMs));
  }
  if (diagnostic?.baseUrlHost) {
    headers.set("x-tradewise-review-base-url-host", diagnostic.baseUrlHost);
  }
  if (diagnostic?.wireApi) {
    headers.set("x-tradewise-review-wire-api", diagnostic.wireApi);
  }
  if (diagnostic?.responseStatus !== undefined) {
    headers.set("x-tradewise-review-response-status", String(diagnostic.responseStatus));
  }
  if (diagnostic?.transportMode) {
    headers.set("x-tradewise-review-transport-mode", diagnostic.transportMode);
  }
}

function emitReviewDiagnostic(level: "info" | "warn", payload: Record<string, unknown>) {
  const line = JSON.stringify(payload);
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

function trimDiagnosticText(value: string, maxLength = 240): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`;
}

function readProviderDiagnosticMeta(error: Error): ReviewProviderDiagnosticMeta {
  const diagnostic = (error as Error & { diagnostic?: ReviewProviderDiagnosticMeta }).diagnostic;
  return diagnostic ?? {};
}

function annotateProviderError(
  error: unknown,
  meta: ReviewProviderDiagnosticMeta,
): Error {
  const normalized = error instanceof Error ? error : new Error("review_provider_error");
  const current = readProviderDiagnosticMeta(normalized);
  const next = normalizeProviderDiagnosticMeta({
    ...current,
    ...meta,
    responseKeys: meta.responseKeys ?? current.responseKeys,
  });
  (normalized as Error & { diagnostic?: ReviewProviderDiagnosticMeta }).diagnostic = next;
  return normalized;
}

function normalizeProviderDiagnosticMeta(
  meta: ReviewProviderDiagnosticMeta,
): ReviewProviderDiagnosticMeta {
  const responseKeys = meta.responseKeys ?? inferDiagnosticResponseKeys(meta.responsePreview);
  const responsePreview = meta.responsePreview
    ? trimDiagnosticText(meta.responsePreview, 1200)
    : undefined;

  return {
    responseStatus: meta.responseStatus,
    responsePreview,
    responseKeys,
    transportMode: meta.transportMode,
    configReason: meta.configReason,
  };
}

function inferDiagnosticResponseKeys(responsePreview?: string): string[] | undefined {
  if (!responsePreview) {
    return undefined;
  }

  const candidate = extractStableJsonText(responsePreview);
  if (!candidate) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    if (!isRecord(parsed)) {
      return undefined;
    }
    return Object.keys(parsed).slice(0, 12);
  } catch {
    return undefined;
  }
}

function readOpenAIError(
  payload: OpenAIResponsesResponse,
  rawBody: string,
  status: number,
): string {
  if (payload.error?.message) {
    return payload.error.message;
  }
  if (payload.error?.type) {
    return payload.error.type;
  }

  const trimmed = rawBody.trim();
  if (!trimmed) {
    return `openai_status_${status}`;
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (typeof parsed.message === "string" && parsed.message) {
      return parsed.message;
    }
  } catch {
    // Keep the raw body fallback below when the response is not JSON.
  }

  return trimmed.length > 240 ? `${trimmed.slice(0, 240)}…` : trimmed;
}


function normalizeReviewResponse(
  parsed: Record<string, unknown>,
  input: TradeWiseReviewGenerateRequest,
  fallbackGeneratorVersion: string,
): TradeWiseReviewGenerateResponse {
  return normalizeTradeWiseReviewPayload(parsed, input, fallbackGeneratorVersion).review;
}

export function normalizeTradeWiseReviewPayload(
  parsed: Record<string, unknown>,
  input: TradeWiseReviewGenerateRequest,
  fallbackGeneratorVersion: string,
): ReviewNormalizationResult {
  const scoreAliasMappings: string[] = [];
  const normalizationNotes: string[] = [];
  const mockBaseline = buildMockTradeWiseReview(input);
  const normalized = {
    reviewDate: typeof parsed.reviewDate === "string" ? parsed.reviewDate : input.reviewDate,
    generatedAt:
      typeof parsed.generatedAt === "string" ? parsed.generatedAt : new Date().toISOString(),
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    scores: normalizeReviewScores(parsed.scores, scoreAliasMappings),
    tradingPattern:
      typeof parsed.tradingPattern === "string" ? parsed.tradingPattern : "攻守平衡",
    strengthSectors: Array.isArray(parsed.strengthSectors) ? parsed.strengthSectors : [],
    profitMetrics: normalizeProfitMetrics(
      parsed.profitMetrics,
      mockBaseline.profitMetrics,
      normalizationNotes,
    ),
    tomorrowPlan:
      typeof parsed.tomorrowPlan === "string"
        ? parsed.tomorrowPlan
        : "继续只做计划内交易。",
    generatorVersion:
      typeof parsed.generatorVersion === "string"
        ? parsed.generatorVersion
        : fallbackGeneratorVersion,
  };

  if (!validateReviewGenerateResponse(normalized)) {
    throw new Error("review_invalid_review_shape");
  }

  return {
    review: normalized,
    scoreAliasMappings,
    normalizationNotes,
  };
}

function normalizeReviewScores(
  rawScores: unknown,
  scoreAliasMappings: string[],
): TradeWiseReviewScoreSet | Record<string, unknown> | unknown {
  if (!isRecord(rawScores)) {
    return rawScores;
  }

  const emotion = resolveAliasedScore(
    rawScores,
    "emotion",
    ["emotion", "emotionStability", "emotionalStability", "emotionControl", "emotionManagement", "mindset"],
    scoreAliasMappings,
  );
  const logic = resolveAliasedScore(
    rawScores,
    "logic",
    ["logic", "execution", "planConsistency", "strategyFit", "sectorUnderstanding", "sectorJudgment", "sectorRotation", "sectorRhythm", "selection", "marketAlignment"],
    scoreAliasMappings,
  );
  const discipline = resolveAliasedScore(
    rawScores,
    "discipline",
    ["discipline", "planConsistency", "planAdherence", "planExecution", "consistency", "strategyConsistency"],
    scoreAliasMappings,
  );
  const industryInsight =
    resolveAliasedScore(
      rawScores,
      "industryInsight",
      ["industryInsight", "sectorInsight", "sectorUnderstanding", "sectorJudgment", "sectorRotation", "sectorRhythm", "selection"],
      scoreAliasMappings,
    ) ?? resolveDerivedScoreFromLogic(logic, scoreAliasMappings);
  const timing = resolveAliasedScore(rawScores, "timing", ["timing"], scoreAliasMappings);
  const riskManagement = resolveAliasedScore(
    rawScores,
    "riskManagement",
    ["riskManagement", "riskControl"],
    scoreAliasMappings,
  );

  return {
    emotion,
    logic,
    discipline,
    industryInsight,
    timing,
    riskManagement,
  } as TradeWiseReviewScoreSet;
}

function resolveAliasedScore(
  rawScores: Record<string, unknown>,
  canonicalKey: keyof TradeWiseReviewScoreSet,
  candidates: string[],
  scoreAliasMappings: string[],
): number | undefined {
  for (const candidate of candidates) {
    const normalized = coerceScoreValue(rawScores[candidate]);
    if (normalized === undefined) {
      continue;
    }
    if (candidate !== canonicalKey) {
      scoreAliasMappings.push(`${canonicalKey}<-${candidate}`);
    }
    return normalized;
  }
  return undefined;
}

function resolveDerivedScoreFromLogic(
  logic: number | undefined,
  scoreAliasMappings: string[],
): number | undefined {
  if (logic === undefined) {
    return undefined;
  }
  scoreAliasMappings.push("industryInsight<-logic");
  return logic;
}

function coerceScoreValue(value: unknown): number | undefined {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : NaN;
  if (!Number.isFinite(numericValue)) {
    return undefined;
  }
  return Math.min(10, Math.max(1, Math.round(numericValue)));
}

function normalizeProfitMetrics(
  rawProfitMetrics: unknown,
  fallbackProfitMetrics: TradeWiseReviewGenerateResponse["profitMetrics"],
  normalizationNotes: string[],
): TradeWiseReviewGenerateResponse["profitMetrics"] | unknown {
  if (!isRecord(rawProfitMetrics)) {
    normalizationNotes.push("profitMetrics<-localDerived");
    return fallbackProfitMetrics;
  }

  const normalized = {
    winRate: coerceMetricValue(rawProfitMetrics.winRate),
    profitLossRatio: coerceMetricValue(rawProfitMetrics.profitLossRatio),
    totalProfit: coerceMetricValue(rawProfitMetrics.totalProfit),
    maxDrawdown: coerceMetricValue(rawProfitMetrics.maxDrawdown),
  };

  if (Object.values(normalized).every((value) => value !== undefined)) {
    return normalized as TradeWiseReviewGenerateResponse["profitMetrics"];
  }

  normalizationNotes.push("profitMetrics<-localDerived");
  return fallbackProfitMetrics;
}

function coerceMetricValue(value: unknown): number | undefined {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : NaN;
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function parseJsonResponse(raw: string): Record<string, unknown> {
  const candidate = extractStableJsonText(raw);
  if (!candidate) {
    throw new Error("review_json_object_expected");
  }

  const parsed = JSON.parse(candidate);
  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }

  throw new Error("review_json_object_expected");
}

function extractStableJsonText(raw: string): string | null {
  const candidates = [
    raw.trim(),
    unwrapMarkdownFence(raw),
    extractFirstJsonObject(raw),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of new Set(candidates)) {
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return candidate;
      }
    } catch {
      // Try the next candidate until we find a valid JSON object.
    }
  }

  return null;
}

function unwrapMarkdownFence(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function extractFirstJsonObject(raw: string): string | null {
  const text = unwrapMarkdownFence(raw);
  const start = text.indexOf("{");
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

function normalizeProviderError(error: unknown, provider: "anthropic" | "openai"): Error {
  if (error instanceof Error) {
    if (isTimeoutError(error)) {
      return new Error(`${provider}_timeout`);
    }
    if (error.name === "TypeError") {
      const suffix = trimDiagnosticText(error.message || "type_error", 120);
      return new Error(`${provider}_transport_error${suffix ? `:${suffix}` : ""}`);
    }
    return error;
  }
  return new Error(`${provider}_request_failed`);
}

function isTimeoutError(error: Error): boolean {
  return (
    error.name === "AbortError" ||
    error.name === "TimeoutError" ||
    /timeout|timed out/i.test(error.message)
  );
}

function joinBaseUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(path.replace(/^\//, ""), normalizedBase).toString();
}
