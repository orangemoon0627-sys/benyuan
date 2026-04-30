import process from "node:process";

import { readCodexProviderDefaults } from "../src/lib/codex-runtime";
import {
  validateReviewGenerateResponse,
  type TradeWiseReviewGenerateRequest,
  type TradeWiseReviewGenerateResponse,
} from "../src/lib/tradewise/review-contract";

export type ReviewSmokeProvider = "mock" | "crs" | "anthropic";
export type ReviewSmokeSource = "live" | "fallback" | "mock";
export type ReviewFallbackCategory =
  | "timeout"
  | "schema"
  | "upstream"
  | "config"
  | "transport"
  | "unknown";
export type ReviewConfigReason =
  | "payment_required"
  | "quota_exceeded"
  | "billing_required"
  | "provider_denied"
  | "missing_runtime"
  | "unsupported_wire_api"
  | "unknown_config";
export type ReviewSmokeDiagnosis = "environment" | "code" | "unknown";
type RuntimeValueSource = "env" | "codex" | "default" | "fixed" | "none";

export type ReviewSmokeRuntimeDiagnostics = {
  provider: ReviewSmokeProvider;
  baseUrl?: string;
  baseUrlSource: RuntimeValueSource;
  model?: string;
  modelSource: RuntimeValueSource;
  wireApi?: string;
  wireApiSource: RuntimeValueSource;
  allowFallbackToMock: boolean;
};

export type ReviewSmokeSkipDecision = {
  reason: "config";
  detail: string;
  configReason: ReviewConfigReason;
  diagnosis: ReviewSmokeDiagnosis;
  nextAction: string;
};

export type ReviewSmokeOutcomeHeaders = {
  source?: ReviewSmokeSource;
  fallbackCategory?: ReviewFallbackCategory | "none";
  configReason?: ReviewConfigReason | "none";
  diagnosis?: ReviewSmokeDiagnosis;
  provider?: string;
  wireApi?: string;
  baseUrlHost?: string;
  generatorVersion?: string;
  latencyMs?: number;
  nextAction?: string;
  responseStatus?: number;
  transportMode?: string;
};

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_MODEL = "gpt-5.4";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";

export function resolveReviewSmokeProvider(): ReviewSmokeProvider {
  const rawProvider = (process.env.TRADEWISE_REVIEW_PROVIDER ?? "mock").trim().toLowerCase();
  if (rawProvider === "anthropic") {
    return "anthropic";
  }
  if (["crs", "openai", "responses", "custom"].includes(rawProvider)) {
    return "crs";
  }
  return "mock";
}

function resolveRuntimeValue<T>(
  envValue: T | undefined,
  codexValue: T | undefined,
  defaultValue: T | undefined,
  defaultSource: RuntimeValueSource = "default",
): { value: T | undefined; source: RuntimeValueSource } {
  if (envValue !== undefined) {
    return { value: envValue, source: "env" };
  }
  if (codexValue !== undefined) {
    return { value: codexValue, source: "codex" };
  }
  if (defaultValue !== undefined) {
    return { value: defaultValue, source: defaultSource };
  }
  return { value: undefined, source: "none" };
}

function isOfficialOpenAIBaseUrl(baseUrl: string): boolean {
  try {
    return new URL(baseUrl).origin === "https://api.openai.com";
  } catch {
    return false;
  }
}

function readBooleanFlag(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

export function resolveReviewSmokeRuntimeDiagnostics(
  provider: ReviewSmokeProvider,
): ReviewSmokeRuntimeDiagnostics {
  const defaults = readCodexProviderDefaults();

  if (provider === "anthropic") {
    const model = resolveRuntimeValue(
      process.env.TRADEWISE_ANTHROPIC_MODEL,
      undefined,
      DEFAULT_ANTHROPIC_MODEL,
    );
    return {
      provider,
      baseUrl: ANTHROPIC_ENDPOINT,
      baseUrlSource: "fixed",
      model: model.value,
      modelSource: model.source,
      wireApi: undefined,
      wireApiSource: "none",
      allowFallbackToMock: false,
    };
  }

  if (provider === "mock") {
    return {
      provider,
      baseUrl: undefined,
      baseUrlSource: "none",
      model: undefined,
      modelSource: "none",
      wireApi: undefined,
      wireApiSource: "none",
      allowFallbackToMock: false,
    };
  }

  const baseUrl = resolveRuntimeValue(
    process.env.TRADEWISE_OPENAI_BASE_URL,
    defaults.baseUrl,
    DEFAULT_OPENAI_BASE_URL,
  );
  const model = resolveRuntimeValue(
    process.env.TRADEWISE_OPENAI_MODEL,
    defaults.model,
    DEFAULT_OPENAI_MODEL,
  );
  const wireApi = resolveRuntimeValue(
    process.env.TRADEWISE_OPENAI_WIRE_API,
    defaults.wireApi,
    "responses",
  );
  const allowFallbackToMock =
    process.env.TRADEWISE_OPENAI_FALLBACK_TO_MOCK !== undefined
      ? readBooleanFlag(process.env.TRADEWISE_OPENAI_FALLBACK_TO_MOCK)
      : !isOfficialOpenAIBaseUrl(baseUrl.value ?? DEFAULT_OPENAI_BASE_URL);

  return {
    provider,
    baseUrl: baseUrl.value,
    baseUrlSource: baseUrl.source,
    model: model.value,
    modelSource: model.source,
    wireApi: wireApi.value,
    wireApiSource: wireApi.source,
    allowFallbackToMock,
  };
}

export function resolveReviewSmokeSkipReason(
  provider: ReviewSmokeProvider,
  diagnostics = resolveReviewSmokeRuntimeDiagnostics(provider),
): ReviewSmokeSkipDecision | null {
  if (provider === "anthropic") {
    return process.env.ANTHROPIC_API_KEY
      ? null
      : {
          reason: "config",
          detail: "missing_anthropic_api_key",
          configReason: "missing_runtime",
          diagnosis: "environment",
          nextAction: "set_provider_runtime_env",
        };
  }

  if (provider !== "crs") {
    return null;
  }

  const defaults = readCodexProviderDefaults();
  const apiKey =
    process.env.TRADEWISE_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? defaults.apiKey;

  if (!apiKey) {
    return {
      reason: "config",
      detail: "missing_openai_runtime_api_key",
      configReason: "missing_runtime",
      diagnosis: "environment",
      nextAction: "set_provider_runtime_env",
    };
  }
  if (!diagnostics.baseUrl) {
    return {
      reason: "config",
      detail: "missing_openai_runtime_base_url",
      configReason: "missing_runtime",
      diagnosis: "environment",
      nextAction: "set_provider_runtime_env",
    };
  }
  if ((diagnostics.wireApi ?? "responses").trim().toLowerCase() !== "responses") {
    return {
      reason: "config",
      detail: `unsupported_openai_wire_api_${(diagnostics.wireApi ?? "unknown").trim().toLowerCase()}`,
      configReason: "unsupported_wire_api",
      diagnosis: "environment",
      nextAction: "switch_to_supported_wire_api",
    };
  }
  return null;
}

export function describeReviewSmokeResult(generatorVersion: string): ReviewSmokeSource {
  const normalized = generatorVersion.trim().toLowerCase();
  if (normalized.startsWith("server.review.fallback.mock.")) {
    return "fallback";
  }
  if (normalized.includes("mock")) {
    return "mock";
  }
  return "live";
}

export function describeReviewSmokeFallbackCategory(
  generatorVersion: string,
): ReviewFallbackCategory | null {
  const normalized = generatorVersion.trim().toLowerCase();
  const match = normalized.match(/^server\.review\.fallback\.mock\.([a-z_]+)\.v\d+$/);
  if (!match) {
    return null;
  }

  switch (match[1]) {
    case "timeout":
    case "schema":
    case "upstream":
    case "config":
    case "transport":
    case "unknown":
      return match[1];
    default:
      return "unknown";
  }
}

export function formatReviewSmokeRuntimeDiagnostics(
  diagnostics: ReviewSmokeRuntimeDiagnostics,
): string {
  return [
    `provider=${diagnostics.provider}`,
    `runtimeBaseUrl=${diagnostics.baseUrl ?? "n/a"}`,
    `baseUrlSource=${diagnostics.baseUrlSource}`,
    `runtimeModel=${diagnostics.model ?? "n/a"}`,
    `modelSource=${diagnostics.modelSource}`,
    `wireApi=${diagnostics.wireApi ?? "n/a"}`,
    `wireApiSource=${diagnostics.wireApiSource}`,
    `allowFallbackToMock=${diagnostics.allowFallbackToMock ? 1 : 0}`,
  ].join(" ");
}

function resolveBaseUrlHost(baseUrl?: string): string | undefined {
  if (!baseUrl) {
    return undefined;
  }
  try {
    return new URL(baseUrl).host;
  } catch {
    return undefined;
  }
}

function normalizeReviewSmokeDiagnosis(
  source: ReviewSmokeSource | "skip",
  fallbackCategory: ReviewFallbackCategory | "none",
): ReviewSmokeDiagnosis {
  if (source === "fallback") {
    if (fallbackCategory === "schema") {
      return "code";
    }
    if (
      fallbackCategory === "config" ||
      fallbackCategory === "timeout" ||
      fallbackCategory === "transport" ||
      fallbackCategory === "upstream"
    ) {
      return "environment";
    }
  }
  if (source === "skip") {
    return "environment";
  }
  return "unknown";
}

function normalizeReviewSmokeNextAction(
  source: ReviewSmokeSource | "skip",
  fallbackCategory: ReviewFallbackCategory | "none",
  configReason: ReviewConfigReason | "none",
): string {
  if (source === "skip" || fallbackCategory === "config") {
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
      case "unknown_config":
        return "inspect_provider_config_and_error";
      default:
        break;
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
      return source === "live" ? "none" : "inspect_review_fallback_logs";
  }
}

function readHeaderValue(headers: Headers | Pick<Headers, "get">, name: string): string | undefined {
  const value = headers.get(name)?.trim();
  return value && value.length > 0 ? value : undefined;
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

export function readReviewSmokeOutcomeHeaders(
  headers: Headers | Pick<Headers, "get">,
): ReviewSmokeOutcomeHeaders {
  const source = readHeaderValue(headers, "x-tradewise-review-result");
  const fallbackCategory = readHeaderValue(
    headers,
    "x-tradewise-review-fallback-category",
  ) as ReviewSmokeOutcomeHeaders["fallbackCategory"];
  const configReason = readHeaderValue(
    headers,
    "x-tradewise-review-config-reason",
  ) as ReviewSmokeOutcomeHeaders["configReason"];
  const diagnosis = readHeaderValue(
    headers,
    "x-tradewise-review-diagnosis",
  ) as ReviewSmokeOutcomeHeaders["diagnosis"];

  return {
    source: source as ReviewSmokeSource | undefined,
    fallbackCategory,
    configReason,
    diagnosis,
    provider: readHeaderValue(headers, "x-tradewise-review-provider"),
    wireApi: readHeaderValue(headers, "x-tradewise-review-wire-api"),
    baseUrlHost: readHeaderValue(headers, "x-tradewise-review-base-url-host"),
    generatorVersion: readHeaderValue(headers, "x-tradewise-review-generator-version"),
    latencyMs: parseOptionalNumber(readHeaderValue(headers, "x-tradewise-review-latency-ms")),
    nextAction: readHeaderValue(headers, "x-tradewise-review-next-action"),
    responseStatus: parseOptionalNumber(
      readHeaderValue(headers, "x-tradewise-review-response-status"),
    ),
    transportMode: readHeaderValue(headers, "x-tradewise-review-transport-mode"),
  };
}

export function formatReviewSmokeOutcome(
  generatorVersion: string,
  elapsedMs: number,
  diagnostics: ReviewSmokeRuntimeDiagnostics,
  headers?: ReviewSmokeOutcomeHeaders,
): string {
  const result = headers?.source ?? describeReviewSmokeResult(generatorVersion);
  const fallbackCategory =
    headers?.fallbackCategory ?? describeReviewSmokeFallbackCategory(generatorVersion) ?? "none";
  const configReason =
    headers?.configReason ?? (fallbackCategory === "config" ? "unknown_config" : "none");
  const diagnosis =
    headers?.diagnosis ?? normalizeReviewSmokeDiagnosis(result, fallbackCategory);
  const nextAction =
    headers?.nextAction ?? normalizeReviewSmokeNextAction(result, fallbackCategory, configReason);
  const provider = headers?.provider ?? diagnostics.provider;
  const wireApi = headers?.wireApi ?? diagnostics.wireApi ?? "n/a";
  const baseUrlHost = headers?.baseUrlHost ?? resolveBaseUrlHost(diagnostics.baseUrl) ?? "n/a";
  const latencyMs = headers?.latencyMs ?? elapsedMs;
  const responseStatus = headers?.responseStatus ?? "none";
  const transportMode = headers?.transportMode ?? "none";

  return [
    `result=${result}`,
    `fallbackCategory=${fallbackCategory}`,
    `configReason=${configReason}`,
    `diagnosis=${diagnosis}`,
    `provider=${provider}`,
    `wireApi=${wireApi}`,
    `baseUrlHost=${baseUrlHost}`,
    `generatorVersion=${generatorVersion}`,
    `latencyMs=${latencyMs}`,
    `responseStatus=${responseStatus}`,
    `transportMode=${transportMode}`,
    `nextAction=${nextAction}`,
  ].join(" ");
}

export function formatReviewSmokeSkip(
  diagnostics: ReviewSmokeRuntimeDiagnostics,
  skipDecision: ReviewSmokeSkipDecision,
): string {
  return [
    `result=skip`,
    `fallbackCategory=none`,
    `configReason=${skipDecision.configReason}`,
    `diagnosis=${skipDecision.diagnosis}`,
    `provider=${diagnostics.provider}`,
    `wireApi=${diagnostics.wireApi ?? "n/a"}`,
    `baseUrlHost=${resolveBaseUrlHost(diagnostics.baseUrl) ?? "n/a"}`,
    `generatorVersion=none`,
    `latencyMs=0`,
    `responseStatus=none`,
    `transportMode=none`,
    `nextAction=${skipDecision.nextAction}`,
    `reason=${skipDecision.reason}`,
    `detail=${skipDecision.detail}`,
  ].join(" ");
}

function allowCrsMockFallback(): boolean {
  return resolveReviewSmokeRuntimeDiagnostics("crs").allowFallbackToMock;
}

export function buildReviewSmokePayload(): TradeWiseReviewGenerateRequest {
  return {
    reviewDate: "2026-03-10",
    trades: [
      {
        id: "trade-1",
        stockCode: "600519",
        stockName: "贵州茅台",
        market: "a_stock",
        direction: "buy",
        price: 1688,
        quantity: 100,
        amount: 168800,
        commission: 12,
        tradeTime: "2026-03-10T09:35:00.000Z",
        reason: "计划内低吸",
        reasonTags: ["plan", "technical"],
        industryLogic: "高股息核心资产回撤后承接稳定",
        emotionScore: 7,
      },
      {
        id: "trade-2",
        stockCode: "300750",
        stockName: "宁德时代",
        market: "a_stock",
        direction: "sell",
        price: 212.5,
        quantity: 200,
        amount: 42500,
        commission: 8,
        tradeTime: "2026-03-10T13:42:00.000Z",
        reason: "计划内减仓，兑现前高附近利润",
        reasonTags: ["plan", "sector_rotation"],
        industryLogic: "储能链短期情绪回暖但分歧仍大",
        emotionScore: 6,
      },
    ],
    userProfile: {
      id: "profile-1",
      nickname: "樊浩",
      tradingStyle: "mixed",
      preferredMarket: "a_stock",
    },
    watchSectors: ["高股息", "新能源", "算力基础设施"],
    recentReviews: [
      {
        reviewDate: "2026-03-09",
        summary: "前一日执行较稳，但止盈动作偏慢。",
        tradingPattern: "趋势跟随",
        strengthSectors: ["高股息", "电网设备"],
        scores: {
          emotion: 7,
          logic: 8,
          discipline: 7,
          industryInsight: 6,
          timing: 7,
          riskManagement: 7,
        },
        profitMetrics: {
          winRate: 66.7,
          profitLossRatio: 1.8,
          totalProfit: 2.6,
          maxDrawdown: 1.2,
        },
      },
    ],
  };
}

export function assertReviewSmokeResponse(
  value: unknown,
  provider: ReviewSmokeProvider,
): asserts value is TradeWiseReviewGenerateResponse {
  if (!validateReviewGenerateResponse(value)) {
    throw new Error("review_response_invalid_shape");
  }

  if (value.summary.trim().length < 20) {
    throw new Error("review_summary_too_short");
  }

  if (provider === "anthropic" && !value.generatorVersion.startsWith("anthropic.")) {
    throw new Error("review_generator_not_anthropic");
  }

  if (provider === "crs") {
    const source = describeReviewSmokeResult(value.generatorVersion);
    if (source === "fallback" && !allowCrsMockFallback()) {
      throw new Error("review_generator_unexpected_fallback_mock");
    }
    if (source === "mock") {
      throw new Error("review_generator_unexpected_mock");
    }
  }

  if (provider === "mock" && !value.generatorVersion.startsWith("server.review.mock")) {
    throw new Error("review_generator_expected_mock");
  }
}
