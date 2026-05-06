#!/usr/bin/env node
import process from 'node:process';

const baseUrl = (process.env.BENYUAN_BASE_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');
const expectLive = process.env.BENYUAN_EXPECT_LIVE === '1';

async function main() {
  const response = await fetch(`${baseUrl}/api/agent/runtime`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`runtime endpoint failed (${response.status}): ${JSON.stringify(payload).slice(0, 240)}`);
  }

  if (expectLive) {
    if (!payload.liveProviderEnabled || payload.providerRequestMode !== 'live') {
      throw new Error(`expected live runtime, got ${JSON.stringify(payload)}`);
    }
  } else if (payload.liveProviderEnabled || payload.providerRequestMode !== 'stub') {
    throw new Error(`expected stub runtime unless BENYUAN_LLM_LIVE=1, got ${JSON.stringify(payload)}`);
  }

  console.log(`runtime-gate:ok mode=${payload.providerRequestMode} source=${payload.source}`);
}

main().catch((error) => {
  console.error('runtime-gate:fail', error instanceof Error ? error.message : error);
  process.exit(1);
});
