import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();
const defaultSummaryPath = path.join(
  workspaceRoot,
  'mobile',
  'tradewise_ai',
  'build',
  'visual-baseline',
  'latest-batch.json',
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertFile(filePath, label) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`${label}_missing:${filePath ?? 'empty'}`);
  }
}

function normalizeExpectedRoutes(raw) {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .sort();
}

function main() {
  const summaryPath = path.resolve(
    process.env.TRADEWISE_VISUAL_BASELINE_SUMMARY ?? defaultSummaryPath,
  );
  const expectedRoutesRaw = (process.env.TRADEWISE_EXPECT_BASELINE_ROUTES ?? '').trim();

  assertFile(summaryPath, 'summary');
  const summary = readJson(summaryPath);

  assertFile(summary.markdownIndex, 'markdown_index');
  assertFile(summary.htmlGallery, 'html_gallery');
  assertFile(summary.manifest, 'manifest');

  if (!Array.isArray(summary.entries) || summary.entries.length === 0) {
    throw new Error('entries_empty');
  }
  if (summary.entryCount !== summary.entries.length) {
    throw new Error(`entry_count_mismatch:${summary.entryCount}:${summary.entries.length}`);
  }

  const seenRoutes = [];

  for (const entry of summary.entries) {
    assertFile(entry.screenshot, `screenshot_missing:${entry.route}`);
    assertFile(entry.metadata, `metadata_missing:${entry.route}`);

    const metadata = readJson(entry.metadata);
    if (metadata.route !== entry.route) {
      throw new Error(`route_mismatch:${entry.route}:${metadata.route}`);
    }
    if (metadata.scenario !== entry.scenario) {
      throw new Error(`scenario_mismatch:${entry.route}:${entry.scenario}:${metadata.scenario}`);
    }
    if (metadata.screenshotPath !== entry.screenshot) {
      throw new Error(`screenshot_path_mismatch:${entry.route}`);
    }
    seenRoutes.push(entry.route);
  }

  if (expectedRoutesRaw) {
    const expectedRoutes = normalizeExpectedRoutes(expectedRoutesRaw);
    const actualRoutes = [...seenRoutes].sort();
    if (expectedRoutes.join('|') !== actualRoutes.join('|')) {
      throw new Error(
        `routes_mismatch:expected=${expectedRoutes.join(',')}:actual=${actualRoutes.join(',')}`,
      );
    }
  }

  const output = {
    generatedAt: summary.generatedAt,
    platform: summary.platform,
    nowIso: summary.nowIso,
    entryCount: summary.entryCount,
    routes: seenRoutes,
    markdownIndex: summary.markdownIndex,
    htmlGallery: summary.htmlGallery,
    manifest: summary.manifest,
    summary: summaryPath,
  };

  console.log('tradewise:visual-baseline:pass');
  console.log(JSON.stringify(output, null, 2));
}

try {
  main();
} catch (error) {
  console.error(
    'tradewise:visual-baseline:fail',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}
