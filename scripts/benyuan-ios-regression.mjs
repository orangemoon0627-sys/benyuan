#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const baseUrl = (process.env.BENYUAN_BASE_URL ?? 'http://127.0.0.1:3015').replace(/\/$/, '');
const manifestPath = path.join(root, 'mobile', 'benyuan_origin_ios_shell', 'shell-manifest.json');
const shellConfigPath = path.join(root, 'mobile', 'benyuan_origin_ios_shell', 'swiftui-starter', 'BenyuanShellConfig.swift');
const webDemoLinksPath = path.join(root, 'src', 'lib', 'benyuan-v3-demo-links.ts');
const benchmarkPath = path.join(root, 'output', 'benyuan-pack-benchmark.json');
const outputPath = path.join(root, 'output', 'benyuan-ios-regression.json');

function now() {
  return Date.now();
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function readWebDemoRoutes(source) {
  const matches = [...source.matchAll(/pack:\s*"([ABC])"[\s\S]*?theaterHref:\s*"([^"]+)"[\s\S]*?constellationHref:\s*"([^"]+)"/g)];
  return matches.map((match) => ({
    pack: match[1],
    theater: match[2],
    constellation: match[3],
  }));
}

function readSwiftDemoRoutes(source) {
  const blockMatch = source.match(/static let demoRoutes = \[([\s\S]*?)\n\s*\]/);
  if (!blockMatch) return [];
  return [...blockMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

function routeContractChecks(manifest, webSource, shellConfigSource) {
  const webDemoRoutes = readWebDemoRoutes(webSource);
  const manifestRoutes = new Map((manifest.demoRoutes ?? []).map((item) => [item.pack, item]));
  const swiftRoutes = readSwiftDemoRoutes(shellConfigSource);
  const checks = [];

  for (const webRoute of webDemoRoutes) {
    const manifestRoute = manifestRoutes.get(webRoute.pack);
    checks.push({
      label: `contract:manifest:${webRoute.pack}:theater`,
      route: webRoute.theater,
      ok: manifestRoute?.theater === webRoute.theater,
      status: manifestRoute?.theater === webRoute.theater ? 200 : 500,
      durationMs: 0,
      snippet: manifestRoute?.theater ?? 'missing',
    });
    checks.push({
      label: `contract:manifest:${webRoute.pack}:constellation`,
      route: webRoute.constellation,
      ok: manifestRoute?.constellation === webRoute.constellation,
      status: manifestRoute?.constellation === webRoute.constellation ? 200 : 500,
      durationMs: 0,
      snippet: manifestRoute?.constellation ?? 'missing',
    });
  }

  const expectedSwiftRoutes = webDemoRoutes.flatMap((item) => [item.theater, item.constellation]);
  for (const route of expectedSwiftRoutes) {
    checks.push({
      label: `contract:swift-demo:${route}`,
      route,
      ok: swiftRoutes.includes(route),
      status: swiftRoutes.includes(route) ? 200 : 500,
      durationMs: 0,
      snippet: swiftRoutes.includes(route) ? 'present' : `missing from Swift demoRoutes (${swiftRoutes.length} configured)`,
    });
  }

  return checks;
}

async function probe(label, route) {
  const startedAt = now();
  const response = await fetch(`${baseUrl}${route}`);
  const text = await response.text();
  return {
    label,
    route,
    ok: response.ok,
    status: response.status,
    durationMs: now() - startedAt,
    snippet: text.slice(0, 180),
  };
}

async function main() {
  const manifest = await readJson(manifestPath);
  const webDemoLinks = await readFile(webDemoLinksPath, 'utf8');
  const shellConfig = await readFile(shellConfigPath, 'utf8');
  const benchmark = await readJson(benchmarkPath);

  const checks = routeContractChecks(manifest, webDemoLinks, shellConfig);

  for (const route of manifest.entry?.primaryFlow ?? []) {
    checks.push(await probe(`flow:${route}`, route));
  }

  for (const demo of manifest.demoRoutes ?? []) {
    checks.push(await probe(`demo:${demo.pack}:theater`, demo.theater));
    checks.push(await probe(`demo:${demo.pack}:constellation`, demo.constellation));
  }

  checks.push(await probe('api:/api/agent/runtime', '/api/agent/runtime'));
  checks.push(await probe('api:/api/part1/schema', '/api/part1/schema'));

  for (const result of benchmark.results ?? []) {
    const ids = result.ids ?? {};
    if (ids.theater_script_id) {
      checks.push(await probe(`api:theater:${result.pack}`, `/api/theater/${encodeURIComponent(ids.theater_script_id)}`));
    }
    if (ids.constellation_id) {
      checks.push(await probe(`api:constellation:${result.pack}`, `/api/constellation/${encodeURIComponent(ids.constellation_id)}`));
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    total: checks.length,
    passed: checks.filter((item) => item.ok).length,
    failed: checks.filter((item) => !item.ok).length,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({ summary, checks }, null, 2)}\n`);

  console.log(JSON.stringify(summary, null, 2));

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
