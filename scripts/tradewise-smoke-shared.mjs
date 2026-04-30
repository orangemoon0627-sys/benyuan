import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export function resolveVisualBaselineSummaryPath(cwd = process.cwd()) {
  return path.join(
    cwd,
    'mobile',
    'tradewise_ai',
    'build',
    'visual-baseline',
    'latest-batch.json',
  );
}

export function shouldForceVisualBaseline() {
  return (process.env.TRADEWISE_INCLUDE_VISUAL_BASELINE ?? '').trim() === '1';
}

export async function maybeRunVisualBaseline(runScript, label) {
  const summaryPath = resolveVisualBaselineSummaryPath();
  const force = shouldForceVisualBaseline();

  if (!force && !fs.existsSync(summaryPath)) {
    console.log(`${label}:visual-baseline:skip summary_missing=${summaryPath}`);
    return false;
  }

  console.log(
    `${label}:visual-baseline:start mode=${force ? 'forced' : 'auto'} summary=${summaryPath}`,
  );
  await runScript('smoke:tradewise:visual-baseline', {
    TRADEWISE_VISUAL_BASELINE_SUMMARY: process.env.TRADEWISE_VISUAL_BASELINE_SUMMARY ?? summaryPath,
  });
  return true;
}
