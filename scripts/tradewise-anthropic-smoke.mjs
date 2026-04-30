import { spawn } from 'node:child_process';
import process from 'node:process';

const host = process.env.TRADEWISE_SMOKE_HOST ?? '127.0.0.1';
const port = Number.parseInt(process.env.TRADEWISE_SMOKE_PORT ?? '3100', 10);
const baseUrl = `http://${host}:${port}`;
const startupTimeoutMs = Number.parseInt(
  process.env.TRADEWISE_SMOKE_STARTUP_TIMEOUT_MS ?? '120000',
  10,
);
const pollIntervalMs = 1500;

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
  ].every(isFiniteNumber);
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
  if (!Array.isArray(value.strengthSectors) || !value.strengthSectors.every((item) => typeof item === 'string')) {
    throw new Error('review_invalid_strength_sectors');
  }
  if (!isProfitMetrics(value.profitMetrics)) {
    throw new Error('review_invalid_profit_metrics');
  }
  if (typeof value.tomorrowPlan !== 'string' || !value.tomorrowPlan) {
    throw new Error('review_missing_tomorrow_plan');
  }
  if (typeof value.generatorVersion !== 'string' || !value.generatorVersion.startsWith('anthropic.')) {
    throw new Error('review_generator_not_anthropic');
  }
}

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
      if (buffer.length > 80) {
        buffer.splice(0, buffer.length - 80);
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
        TRADEWISE_REVIEW_PROVIDER: 'anthropic',
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
      if (research.version && Array.isArray(research.items)) {
        console.log(`tradewise:anthropic:server-ready version=${research.version}`);
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
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('tradewise:anthropic:skip missing ANTHROPIC_API_KEY');
    return;
  }

  const logBuffer = createLogBuffer();
  const server = startDevServer(logBuffer);

  try {
    console.log(`tradewise:anthropic:start base=${baseUrl}`);
    await waitForServer(server, logBuffer);

    const review = await requestJson('/api/tradewise/review/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(buildReviewPayload()),
    });

    validateReviewResponse(review);
    console.log(
      `tradewise:anthropic:review ok version=${review.generatorVersion} pattern=${review.tradingPattern}`,
    );
    console.log('tradewise:anthropic:pass');
  } finally {
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(
    'tradewise:anthropic:fail',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
