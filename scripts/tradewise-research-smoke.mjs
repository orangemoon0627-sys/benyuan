import { spawn } from 'node:child_process';
import process from 'node:process';

const externalBaseUrl = (process.env.TRADEWISE_SMOKE_BASE_URL ?? process.env.BENYUAN_BASE_URL ?? '').trim();
const host = process.env.TRADEWISE_SMOKE_HOST ?? '127.0.0.1';
const port = Number.parseInt(process.env.TRADEWISE_SMOKE_PORT ?? '3100', 10);
const baseUrl = externalBaseUrl || `http://${host}:${port}`;
const startupTimeoutMs = Number.parseInt(
  process.env.TRADEWISE_SMOKE_STARTUP_TIMEOUT_MS ?? '120000',
  10,
);
const pollIntervalMs = 1500;
const expectLiveResearch = ['1', 'true', 'yes'].includes(
  (process.env.TRADEWISE_EXPECT_RESEARCH_LIVE ?? '').toLowerCase(),
);

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
      const feed = await requestJson('/api/tradewise/research/feed?market=a_stock&limit=1');
      if (feed.version && Array.isArray(feed.items)) {
        console.log(`tradewise:research:server-ready version=${feed.version}`);
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

function shouldSkipRemoteMode(useExternalServer) {
  const provider = (process.env.TRADEWISE_RESEARCH_PROVIDER ?? 'fixture').toLowerCase();
  if (useExternalServer) {
    return false;
  }
  if (provider !== 'remote') {
    return false;
  }
  return !process.env.TRADEWISE_RESEARCH_REMOTE_URL;
}

function validateResearchFeed(feed) {
  if (!feed || typeof feed !== 'object' || Array.isArray(feed)) {
    throw new Error('research_feed_not_object');
  }
  if (typeof feed.version !== 'string' || !feed.version) {
    throw new Error('research_feed_missing_version');
  }
  if (!Array.isArray(feed.items) || feed.items.length === 0) {
    throw new Error('research_feed_empty_items');
  }
  for (const item of feed.items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('research_item_not_object');
    }
    if (item.market !== 'a_stock' && item.market !== 'us_stock') {
      throw new Error('research_item_invalid_market');
    }
    if (typeof item.title !== 'string' || !item.title) {
      throw new Error('research_item_missing_title');
    }
  }
  if (expectLiveResearch || (process.env.TRADEWISE_RESEARCH_PROVIDER ?? '').toLowerCase() === 'remote') {
    const hasLiveItem = feed.items.some((item) => item.isMock === false);
    if (!hasLiveItem) {
      throw new Error('research_remote_expected_live_items');
    }
  }
}

async function main() {
  const useExternalServer = Boolean(externalBaseUrl);
  if (shouldSkipRemoteMode(useExternalServer)) {
    console.log('tradewise:research:skip missing TRADEWISE_RESEARCH_REMOTE_URL');
    return;
  }

  const logBuffer = createLogBuffer();
  const server = useExternalServer ? null : startDevServer(logBuffer);

  try {
    console.log(`tradewise:research:start base=${baseUrl}`);
    if (server) {
      await waitForServer(server, logBuffer);
    }

    const feed = await requestJson('/api/tradewise/research/feed?market=a_stock&limit=3');
    validateResearchFeed(feed);
    console.log(`tradewise:research:ok version=${feed.version} count=${feed.items.length}`);
    console.log('tradewise:research:pass');
  } finally {
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error('tradewise:research:fail', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
