import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const externalBaseUrl =
  (process.env.TRADEWISE_SMOKE_BASE_URL ?? process.env.BENYUAN_BASE_URL ?? '').trim();
const host = process.env.TRADEWISE_SMOKE_HOST ?? '127.0.0.1';
const port = Number.parseInt(process.env.TRADEWISE_SMOKE_PORT ?? '3100', 10);
const baseUrl = externalBaseUrl || `http://${host}:${port}`;
const startupTimeoutMs = Number.parseInt(
  process.env.TRADEWISE_SMOKE_STARTUP_TIMEOUT_MS ?? '120000',
  10,
);
const pollIntervalMs = 1500;
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_OPENAI_MODEL = 'gpt-5.4';

function readIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : null;
}

function matchString(source, pattern) {
  return source.match(pattern)?.[1];
}

function resolveRuntimeValue(envValue, codexValue, defaultValue, defaultSource = 'default') {
  if (envValue !== undefined) {
    return { value: envValue, source: 'env' };
  }
  if (codexValue !== undefined) {
    return { value: codexValue, source: 'codex' };
  }
  if (defaultValue !== undefined) {
    return { value: defaultValue, source: defaultSource };
  }
  return { value: undefined, source: 'none' };
}

function readCodexProviderDefaults() {
  const codexHome = process.env.CODEX_HOME ?? path.join(os.homedir(), '.codex');
  const configPath = path.join(codexHome, 'config.toml');
  const authPath = path.join(codexHome, 'auth.json');
  const configRaw = readIfExists(configPath) ?? '';
  const authRaw = readIfExists(authPath) ?? '';

  let apiKey;
  if (authRaw) {
    try {
      const parsed = JSON.parse(authRaw);
      apiKey = parsed.OPENAI_API_KEY;
    } catch {
      apiKey = undefined;
    }
  }

  return {
    providerName: matchString(configRaw, /^model_provider\s*=\s*"([^"]+)"/m),
    model: matchString(configRaw, /^model\s*=\s*"([^"]+)"/m),
    reasoningEffort: matchString(
      configRaw,
      /^model_reasoning_effort\s*=\s*"(low|medium|high)"/m,
    ),
    disableResponseStorage:
      matchString(configRaw, /^disable_response_storage\s*=\s*(true|false)/m) === 'true',
    wireApi: matchString(configRaw, /^wire_api\s*=\s*"([^"]+)"/m),
    baseUrl: resolveBaseUrl(configRaw),
    apiKey,
  };
}

function resolveBaseUrl(configRaw) {
  const providerName = matchString(configRaw, /^model_provider\s*=\s*"([^"]+)"/m);
  if (!providerName) {
    return undefined;
  }
  const sectionPattern = new RegExp(
    `\\[model_providers\\.${providerName.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\]([\\s\\S]*?)(?:\\n\\[|$)`,
  );
  const section = configRaw.match(sectionPattern)?.[1] ?? '';
  return matchString(section, /^base_url\s*=\s*"([^"]+)"/m);
}

function isOfficialOpenAIBaseUrl(baseUrlValue) {
  try {
    return new URL(baseUrlValue).origin === 'https://api.openai.com';
  } catch {
    return false;
  }
}

function readBooleanFlag(value) {
  if (!value) {
    return false;
  }
  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function resolveCrsRuntimeDiagnostics() {
  const defaults = readCodexProviderDefaults();
  const baseUrlValue = resolveRuntimeValue(
    process.env.TRADEWISE_OPENAI_BASE_URL,
    defaults.baseUrl,
    DEFAULT_OPENAI_BASE_URL,
  );
  const modelValue = resolveRuntimeValue(
    process.env.TRADEWISE_OPENAI_MODEL,
    defaults.model,
    DEFAULT_OPENAI_MODEL,
  );
  const wireApiValue = resolveRuntimeValue(
    process.env.TRADEWISE_OPENAI_WIRE_API,
    defaults.wireApi,
    'responses',
  );
  const allowFallbackToMock =
    process.env.TRADEWISE_OPENAI_FALLBACK_TO_MOCK !== undefined
      ? readBooleanFlag(process.env.TRADEWISE_OPENAI_FALLBACK_TO_MOCK)
      : !isOfficialOpenAIBaseUrl(baseUrlValue.value ?? DEFAULT_OPENAI_BASE_URL);

  return {
    provider: 'crs',
    runtimeBaseUrl: baseUrlValue.value,
    baseUrlSource: baseUrlValue.source,
    runtimeModel: modelValue.value,
    modelSource: modelValue.source,
    wireApi: wireApiValue.value,
    wireApiSource: wireApiValue.source,
    allowFallbackToMock,
    hasApiKey: Boolean(
      process.env.TRADEWISE_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? defaults.apiKey,
    ),
  };
}

function resolveCrsSkipDecision(diagnostics) {
  if (!diagnostics.hasApiKey) {
    return {
      reason: 'config',
      detail: 'missing_openai_runtime_api_key',
      configReason: 'missing_runtime',
      diagnosis: 'environment',
      nextAction: 'set_provider_runtime_env',
    };
  }
  if (!diagnostics.runtimeBaseUrl) {
    return {
      reason: 'config',
      detail: 'missing_openai_runtime_base_url',
      configReason: 'missing_runtime',
      diagnosis: 'environment',
      nextAction: 'set_provider_runtime_env',
    };
  }
  if ((diagnostics.wireApi ?? 'responses').trim().toLowerCase() !== 'responses') {
    return {
      reason: 'config',
      detail: `unsupported_openai_wire_api_${(diagnostics.wireApi ?? 'unknown').trim().toLowerCase()}`,
      configReason: 'unsupported_wire_api',
      diagnosis: 'environment',
      nextAction: 'switch_to_supported_wire_api',
    };
  }
  return null;
}

function formatRuntimeDiagnostics(diagnostics) {
  return [
    `provider=${diagnostics.provider}`,
    `runtimeBaseUrl=${diagnostics.runtimeBaseUrl ?? 'n/a'}`,
    `baseUrlSource=${diagnostics.baseUrlSource}`,
    `runtimeModel=${diagnostics.runtimeModel ?? 'n/a'}`,
    `modelSource=${diagnostics.modelSource}`,
    `wireApi=${diagnostics.wireApi ?? 'n/a'}`,
    `wireApiSource=${diagnostics.wireApiSource}`,
    `allowFallbackToMock=${diagnostics.allowFallbackToMock ? 1 : 0}`,
  ].join(' ');
}

function resolveBaseUrlHost(baseUrlValue) {
  if (!baseUrlValue) {
    return undefined;
  }
  try {
    return new URL(baseUrlValue).host;
  } catch {
    return undefined;
  }
}

function describeReviewResult(generatorVersion) {
  const normalized = generatorVersion.trim().toLowerCase();
  if (normalized.startsWith('server.review.fallback.mock.')) {
    return 'fallback';
  }
  if (normalized.includes('mock')) {
    return 'mock';
  }
  return 'live';
}

function describeFallbackCategory(generatorVersion) {
  const normalized = generatorVersion.trim().toLowerCase();
  const match = normalized.match(/^server\.review\.fallback\.mock\.([a-z_]+)\.v\d+$/);
  if (!match) {
    return null;
  }
  if (['timeout', 'schema', 'upstream', 'config', 'transport', 'unknown'].includes(match[1])) {
    return match[1];
  }
  return 'unknown';
}

function normalizeDiagnosis(result, fallbackCategory) {
  if (result === 'fallback') {
    if (fallbackCategory === 'schema') {
      return 'code';
    }
    if (['config', 'timeout', 'upstream', 'transport'].includes(fallbackCategory)) {
      return 'environment';
    }
  }
  if (result === 'skip') {
    return 'environment';
  }
  return 'unknown';
}

function normalizeNextAction(result, fallbackCategory, configReason) {
  if (result === 'skip' || fallbackCategory === 'config') {
    switch (configReason) {
      case 'payment_required':
      case 'quota_exceeded':
      case 'billing_required':
        return 'check_provider_billing_or_credits';
      case 'provider_denied':
        return 'verify_key_base_url_and_model_access';
      case 'missing_runtime':
        return 'set_provider_runtime_env';
      case 'unsupported_wire_api':
        return 'switch_to_supported_wire_api';
      case 'unknown_config':
        return 'inspect_provider_config_and_error';
      default:
        break;
    }
  }

  switch (fallbackCategory) {
    case 'timeout':
      return 'check_provider_latency_or_timeout_budget';
    case 'schema':
      return 'inspect_review_schema_contract';
    case 'upstream':
      return 'retry_or_check_provider_status';
    case 'transport':
      return 'check_network_tls_dns';
    default:
      return result === 'live' ? 'none' : 'inspect_review_fallback_logs';
  }
}

function readHeaderValue(headers, name) {
  const value = headers.get(name)?.trim();
  return value && value.length > 0 ? value : undefined;
}

function parseOptionalNumber(value) {
  if (!value) {
    return undefined;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function readReviewOutcomeHeaders(headers) {
  return {
    result: readHeaderValue(headers, 'x-tradewise-review-result'),
    fallbackCategory: readHeaderValue(headers, 'x-tradewise-review-fallback-category'),
    configReason: readHeaderValue(headers, 'x-tradewise-review-config-reason'),
    diagnosis: readHeaderValue(headers, 'x-tradewise-review-diagnosis'),
    provider: readHeaderValue(headers, 'x-tradewise-review-provider'),
    wireApi: readHeaderValue(headers, 'x-tradewise-review-wire-api'),
    baseUrlHost: readHeaderValue(headers, 'x-tradewise-review-base-url-host'),
    generatorVersion: readHeaderValue(headers, 'x-tradewise-review-generator-version'),
    latencyMs: parseOptionalNumber(readHeaderValue(headers, 'x-tradewise-review-latency-ms')),
    nextAction: readHeaderValue(headers, 'x-tradewise-review-next-action'),
    responseStatus: readHeaderValue(headers, 'x-tradewise-review-response-status') ?? 'none',
    transportMode: readHeaderValue(headers, 'x-tradewise-review-transport-mode') ?? 'none',
  };
}

function formatReviewOutcome(generatorVersion, elapsedMs, diagnostics, headerMeta = {}) {
  const result = headerMeta.result ?? describeReviewResult(generatorVersion);
  const fallbackCategory = headerMeta.fallbackCategory ?? describeFallbackCategory(generatorVersion) ?? 'none';
  const configReason =
    headerMeta.configReason ?? (fallbackCategory === 'config' ? 'unknown_config' : 'none');
  const diagnosis = headerMeta.diagnosis ?? normalizeDiagnosis(result, fallbackCategory);
  const nextAction = headerMeta.nextAction ?? normalizeNextAction(result, fallbackCategory, configReason);

  return [
    `result=${result}`,
    `fallbackCategory=${fallbackCategory}`,
    `configReason=${configReason}`,
    `diagnosis=${diagnosis}`,
    `provider=${headerMeta.provider ?? diagnostics.provider}`,
    `wireApi=${headerMeta.wireApi ?? diagnostics.wireApi ?? 'n/a'}`,
    `baseUrlHost=${headerMeta.baseUrlHost ?? resolveBaseUrlHost(diagnostics.runtimeBaseUrl) ?? 'n/a'}`,
    `generatorVersion=${headerMeta.generatorVersion ?? generatorVersion}`,
    `latencyMs=${headerMeta.latencyMs ?? elapsedMs}`,
    `responseStatus=${headerMeta.responseStatus ?? 'none'}`,
    `transportMode=${headerMeta.transportMode ?? 'none'}`,
    `nextAction=${nextAction}`,
  ].join(' ');
}

function formatSkipOutcome(diagnostics, skipDecision) {
  return [
    'result=skip',
    'fallbackCategory=none',
    `configReason=${skipDecision.configReason}`,
    `diagnosis=${skipDecision.diagnosis}`,
    `provider=${diagnostics.provider}`,
    `wireApi=${diagnostics.wireApi ?? 'n/a'}`,
    `baseUrlHost=${resolveBaseUrlHost(diagnostics.runtimeBaseUrl) ?? 'n/a'}`,
    'generatorVersion=none',
    'latencyMs=0',
    'responseStatus=none',
    'transportMode=none',
    `nextAction=${skipDecision.nextAction}`,
    `reason=${skipDecision.reason}`,
    `detail=${skipDecision.detail}`,
  ].join(' ');
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
        industryLogic: '高股息核心资产回撤后承接稳定',
        emotionScore: 7,
      },
      {
        id: 'trade-2',
        stockCode: '300750',
        stockName: '宁德时代',
        market: 'a_stock',
        direction: 'sell',
        price: 212.5,
        quantity: 200,
        amount: 42500,
        commission: 8,
        tradeTime: '2026-03-10T13:42:00.000Z',
        reason: '计划内减仓，兑现前高附近利润',
        reasonTags: ['plan', 'sector_rotation'],
        industryLogic: '储能链短期情绪回暖但分歧仍大',
        emotionScore: 6,
      },
    ],
    userProfile: {
      id: 'profile-1',
      nickname: '樊浩',
      tradingStyle: 'mixed',
      preferredMarket: 'a_stock',
    },
    watchSectors: ['高股息', '新能源', '算力基础设施'],
    recentReviews: [
      {
        reviewDate: '2026-03-09',
        summary: '前一日执行较稳，但止盈动作偏慢。',
        tradingPattern: '趋势跟随',
        strengthSectors: ['高股息', '电网设备'],
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

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isScoreSet(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return [
    value.emotion,
    value.logic,
    value.discipline,
    value.industryInsight,
    value.timing,
    value.riskManagement,
  ].every((item) => isFiniteNumber(item) && item >= 1 && item <= 10);
}

function isProfitMetrics(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return [
    value.winRate,
    value.profitLossRatio,
    value.totalProfit,
    value.maxDrawdown,
  ].every(isFiniteNumber);
}

function validateReviewResponse(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('review_response_not_object');
  }
  if (typeof value.reviewDate !== 'string') {
    throw new Error('review_missing_review_date');
  }
  if (typeof value.generatedAt !== 'string') {
    throw new Error('review_missing_generated_at');
  }
  if (typeof value.summary !== 'string' || value.summary.length < 20) {
    throw new Error('review_summary_too_short');
  }
  if (!isScoreSet(value.scores)) {
    throw new Error('review_invalid_scores');
  }
  if (typeof value.tradingPattern !== 'string' || !value.tradingPattern) {
    throw new Error('review_missing_trading_pattern');
  }
  if (
    !Array.isArray(value.strengthSectors) ||
    !value.strengthSectors.every((item) => typeof item === 'string')
  ) {
    throw new Error('review_invalid_strength_sectors');
  }
  if (!isProfitMetrics(value.profitMetrics)) {
    throw new Error('review_invalid_profit_metrics');
  }
  if (typeof value.tomorrowPlan !== 'string' || !value.tomorrowPlan) {
    throw new Error('review_missing_tomorrow_plan');
  }
  if (typeof value.generatorVersion !== 'string' || !value.generatorVersion.trim()) {
    throw new Error('review_missing_generator_version');
  }
  if (value.generatorVersion.startsWith('server.review.mock')) {
    throw new Error('review_generator_unexpected_mock');
  }
}

async function requestJson(pathname, init) {
  const response = await fetch(baseUrl + pathname, init);
  const body = await response.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error(`invalid_json path=${pathname} body=${body.slice(0, 200)}`);
  }
  if (!response.ok) {
    throw new Error(`http_${response.status} path=${pathname} error=${json.error ?? body}`);
  }
  return { json, headers: response.headers, status: response.status };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createLogBuffer() {
  const buffer = [];
  return {
    push(chunk, source) {
      const text = String(chunk)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      for (const line of text) {
        buffer.push(`[${source}] ${line}`);
      }
      if (buffer.length > 100) {
        buffer.splice(0, buffer.length - 100);
      }
    },
    dump() {
      return buffer.join('\n');
    },
  };
}

function startDevServer(logBuffer) {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(
    command,
    ['run', 'dev', '--', '--hostname', host, '--port', String(port)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TRADEWISE_REVIEW_PROVIDER: 'crs',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  child.stdout?.on('data', (chunk) => {
    logBuffer.push(chunk, 'next');
  });
  child.stderr?.on('data', (chunk) => {
    logBuffer.push(chunk, 'next:err');
  });

  return child;
}

async function waitForServer(server, logBuffer) {
  const start = Date.now();
  while (Date.now() - start < startupTimeoutMs) {
    if (server.exitCode !== null) {
      throw new Error(`dev_server_exited early code=${server.exitCode}\n${logBuffer.dump()}`);
    }

    try {
      const research = await requestJson('/api/tradewise/research/feed?market=a_stock&limit=1');
      if (research.json.version && Array.isArray(research.json.items)) {
        console.log(`tradewise:crs:server-ready version=${research.json.version}`);
        return;
      }
    } catch {
      // Next dev is still compiling or booting.
    }

    await wait(pollIntervalMs);
  }

  throw new Error(`dev_server_timeout after=${startupTimeoutMs}ms\n${logBuffer.dump()}`);
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) {
    return;
  }

  server.kill('SIGTERM');
  const stopped = await Promise.race([
    new Promise((resolve) => server.once('exit', () => resolve(true))),
    wait(5000).then(() => false),
  ]);

  if (!stopped && server.exitCode === null) {
    server.kill('SIGKILL');
    await new Promise((resolve) => server.once('exit', () => resolve(true)));
  }
}

async function main() {
  const diagnostics = resolveCrsRuntimeDiagnostics();
  const useExternalServer = Boolean(externalBaseUrl);
  if (!useExternalServer) {
    const skipDecision = resolveCrsSkipDecision(diagnostics);
    if (skipDecision) {
      console.log(`tradewise:crs:skip ${formatSkipOutcome(diagnostics, skipDecision)}`);
      return;
    }
  }

  console.log(
    `tradewise:crs:start base=${baseUrl} serverMode=${useExternalServer ? 'external' : 'spawn'} ${formatRuntimeDiagnostics(diagnostics)}`,
  );

  const logBuffer = createLogBuffer();
  const server = useExternalServer ? null : startDevServer(logBuffer);
  const startedAt = Date.now();

  try {
    if (server) {
      await waitForServer(server, logBuffer);
    }

    const reviewResponse = await requestJson('/api/tradewise/review/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(buildReviewPayload()),
    });

    const review = reviewResponse.json;
    validateReviewResponse(review);
    const elapsedMs = Date.now() - startedAt;
    const reviewOutcome = formatReviewOutcome(
      review.generatorVersion,
      elapsedMs,
      diagnostics,
      readReviewOutcomeHeaders(reviewResponse.headers),
    );
    console.log(
      `tradewise:crs:review ok ${formatRuntimeDiagnostics(diagnostics)} ${reviewOutcome} pattern=${review.tradingPattern}`,
    );
    if (describeReviewResult(review.generatorVersion) === 'fallback') {
      console.log(`tradewise:crs:fallback-summary ${reviewOutcome}`);
    }
    console.log('tradewise:crs:pass');
  } finally {
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error('tradewise:crs:fail', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
