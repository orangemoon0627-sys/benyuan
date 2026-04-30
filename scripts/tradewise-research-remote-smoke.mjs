import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import process from 'node:process';

const externalBaseUrl = (process.env.TRADEWISE_SMOKE_BASE_URL ?? process.env.BENYUAN_BASE_URL ?? '').trim();
const nextHost = process.env.TRADEWISE_SMOKE_HOST ?? '127.0.0.1';
const nextPort = Number.parseInt(process.env.TRADEWISE_SMOKE_PORT ?? '3204', 10);
const nextBaseUrl = externalBaseUrl || `http://${nextHost}:${nextPort}`;
const startupTimeoutMs = Number.parseInt(
  process.env.TRADEWISE_SMOKE_STARTUP_TIMEOUT_MS ?? '120000',
  10,
);
const pollIntervalMs = 1500;

function createRemoteFixtureServer() {
  const requests = [];
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    requests.push({
      path: url.pathname,
      search: url.search,
      marketCode: url.searchParams.get('marketCode') ?? '',
      pageSize: url.searchParams.get('pageSize') ?? '',
      auth: request.headers.authorization ?? '',
      trace: String(request.headers['x-tradewise-trace'] ?? ''),
    });

    const limit = Number.parseInt(url.searchParams.get('pageSize') ?? '0', 10) || 10;
    const market = url.searchParams.get('marketCode') === 'us' ? 'us' : 'cn';
    const pool = [
      {
        uuid: 'remote-feed-1',
        market: 'cn',
        industry: '电网设备',
        headline: '远端研报：主网投资继续抬升',
        abstract: '远端摘要 1',
        publisher: 'Remote Desk',
        publishedAt: '2026-03-10T08:00:00.000Z',
        score: '9.1',
        body: '远端正文 1',
        tags: '电网,特高压',
        isMock: false,
      },
      {
        uuid: 'remote-feed-2',
        market: 'cn',
        industry: '算力基础设施',
        headline: '远端研报：算力链景气延续',
        abstract: '远端摘要 2',
        publisher: 'Remote Desk',
        publishedAt: '2026-03-10T07:30:00.000Z',
        score: 8.5,
        body: '远端正文 2',
        tags: ['算力', '机柜'],
        isMock: false,
      },
      {
        uuid: 'remote-feed-3',
        market: 'us',
        industry: 'AI Infra',
        headline: 'Remote US infra note',
        abstract: 'Remote summary 3',
        publisher: 'Remote Desk',
        publishedAt: '2026-03-09T23:00:00.000Z',
        score: 7.9,
        body: 'Remote content 3',
        tags: ['GPU', 'Datacenter'],
        isMock: false,
      },
    ];
    const items = pool.filter((item) => item.market === market).slice(0, limit);

    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({
      version: 'remote.research.fixture.v2',
      data: {
        list: items,
      },
    }));
  });

  return {
    requests,
    start() {
      return new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => {
          const address = server.address();
          resolve({ port: typeof address === 'object' && address ? address.port : 0 });
        });
      });
    },
    stop() {
      return new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

async function requestJson(path, init) {
  const response = await fetch(nextBaseUrl + path, init);
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
      if (buffer.length > 120) {
        buffer.splice(0, buffer.length - 120);
      }
    },
    dump() {
      return buffer.join('\n');
    },
  };
}

function startDevServer(logBuffer, remoteUrl) {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(
    command,
    ['run', 'dev', '--', '--hostname', nextHost, '--port', String(nextPort)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TRADEWISE_RESEARCH_PROVIDER: 'remote',
        TRADEWISE_RESEARCH_REMOTE_URL: remoteUrl,
        TRADEWISE_RESEARCH_REMOTE_HEADERS: JSON.stringify({ 'x-tradewise-trace': 'remote-smoke' }),
        TRADEWISE_RESEARCH_REMOTE_AUTH_TOKEN: 'research-token',
        TRADEWISE_RESEARCH_REMOTE_MARKET_PARAM: 'marketCode',
        TRADEWISE_RESEARCH_REMOTE_LIMIT_PARAM: 'pageSize',
        TRADEWISE_RESEARCH_REMOTE_MARKET_VALUE_A_STOCK: 'cn',
        TRADEWISE_RESEARCH_REMOTE_MARKET_VALUE_US_STOCK: 'us',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  child.stdout?.on('data', (chunk) => logBuffer.push(chunk, 'next'));
  child.stderr?.on('data', (chunk) => logBuffer.push(chunk, 'next:err'));
  return child;
}

async function waitForServer(server, logBuffer) {
  const start = Date.now();
  while (Date.now() - start < startupTimeoutMs) {
    if (server.exitCode !== null) {
      throw new Error(`dev_server_exited early code=${server.exitCode}\n${logBuffer.dump()}`);
    }
    try {
      const feed = await requestJson('/api/tradewise/research/feed?market=a_stock&limit=1');
      if (feed.version && Array.isArray(feed.items)) {
        console.log(`tradewise:research:remote:server-ready version=${feed.version}`);
        return;
      }
    } catch {
      // still booting
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
  const remote = createRemoteFixtureServer();
  const { port } = await remote.start();
  const remoteUrl = `http://127.0.0.1:${port}/feed`;
  const logBuffer = createLogBuffer();
  const server = externalBaseUrl ? null : startDevServer(logBuffer, remoteUrl);

  try {
    console.log(`tradewise:research:remote:start next=${nextBaseUrl} upstream=${remoteUrl}`);
    if (server) {
      await waitForServer(server, logBuffer);
    }

    const feed = await requestJson('/api/tradewise/research/feed?market=a_stock&limit=2');
    if (feed.version !== 'remote.research.fixture.v2') {
      throw new Error('remote_feed_version_unexpected');
    }
    if (!Array.isArray(feed.items) || feed.items.length !== 2) {
      throw new Error('remote_feed_limit_not_applied');
    }
    if (feed.items.some((item) => item.isMock !== false)) {
      throw new Error('remote_feed_expected_live_items');
    }
    if (feed.items.some((item) => item.market !== 'a_stock')) {
      throw new Error('remote_feed_market_not_filtered');
    }
    if (feed.items.some((item) => typeof item.keywords?.[0] !== 'string')) {
      throw new Error('remote_feed_keywords_not_normalized');
    }

    const latestRequest = remote.requests[remote.requests.length - 1];
    if (!latestRequest || latestRequest.marketCode !== 'cn' || latestRequest.pageSize !== '2') {
      throw new Error('remote_upstream_query_not_forwarded');
    }
    if (latestRequest.auth !== 'Bearer research-token') {
      throw new Error('remote_upstream_auth_missing');
    }
    if (latestRequest.trace !== 'remote-smoke') {
      throw new Error('remote_upstream_header_missing');
    }

    console.log(`tradewise:research:remote:ok version=${feed.version} count=${feed.items.length}`);
    console.log('tradewise:research:remote:pass');
  } finally {
    await stopServer(server);
    await remote.stop();
  }
}

main().catch((error) => {
  console.error('tradewise:research:remote:fail', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
