#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const baseUrl = (process.env.BENYUAN_BASE_URL ?? 'http://127.0.0.1:3015').replace(/\/$/, '');
const failOnDrift = process.env.BENYUAN_FAIL_ON_DRIFT === '1';
const outputDir = path.join(process.cwd(), 'output');

async function requestJson(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`GET ${pathname} failed (${response.status}): ${JSON.stringify(payload).slice(0, 240)}`);
  }
  return payload;
}

async function writeArtifacts(audit, regression) {
  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDir, 'benyuan-golden-audit.json'), `${JSON.stringify(audit, null, 2)}\n`),
    writeFile(path.join(outputDir, 'benyuan-golden-regression.json'), `${JSON.stringify(regression, null, 2)}\n`),
  ]);
}

async function main() {
  const [audit, regression] = await Promise.all([
    requestJson('/api/internal/golden-audit'),
    requestJson('/api/internal/golden-regression'),
  ]);

  await writeArtifacts(audit, regression);

  if (audit.status !== 'pass') {
    throw new Error(`golden audit failed: ${JSON.stringify(audit.summary)}`);
  }

  if (regression.diffSummary?.missingBaseline > 0) {
    throw new Error(`golden regression missing baselines: ${regression.diffSummary.missingBaseline}`);
  }

  if (failOnDrift && regression.diffSummary?.drifted > 0) {
    throw new Error(`golden regression drifted samples: ${regression.diffSummary.drifted}`);
  }

  console.log(`golden-audit:pass drifted=${regression.diffSummary?.drifted ?? 0} missing=${regression.diffSummary?.missingBaseline ?? 0}`);
}

main().catch((error) => {
  console.error('golden-audit:fail', error instanceof Error ? error.message : error);
  process.exit(1);
});
