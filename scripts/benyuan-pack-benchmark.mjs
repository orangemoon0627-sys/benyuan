#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { requestStageJson } from './benyuan-pack-benchmark-lib.mjs';

const baseUrl = (process.env.BENYUAN_BASE_URL ?? 'http://127.0.0.1:3015').replace(/\/$/, '');
const selectedPacks = (process.env.BENYUAN_PACKS ?? 'A,B,C')
  .split(',')
  .map((item) => item.trim().toUpperCase())
  .filter(Boolean);
const outputDir = path.join(process.cwd(), 'output');
const outputPath = path.join(outputDir, 'benyuan-pack-benchmark.json');
const manifestPath = path.join(process.cwd(), 'src', 'lib', 'fixtures', 'benyuan-v3-test-packs.json');

function benchmarkSnapshotPath(selectedPacks, generatedAt) {
  const stamp = generatedAt.replace(/[:]/g, '-').replace(/\..+$/, '');
  const packLabel = selectedPacks.join('-').toLowerCase();
  return path.join(outputDir, `benyuan-pack-benchmark-${packLabel}-${stamp}.json`);
}

function mimeFromFile(filePath) {
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

function toPublicFilePath(url) {
  return path.join(process.cwd(), 'public', url.replace(/^\//, ''));
}

async function loadPacks() {
  const raw = await readFile(manifestPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`invalid manifest: ${manifestPath}`);
  }

  return Object.fromEntries(
    parsed.map((pack) => [
      pack.id,
      {
        ...pack,
        label: pack.name,
        assetPaths: {
          A2_music_analysis: pack.assets.A2_music_analysis.map((item) => toPublicFilePath(item.url)),
          C1_social_posts_analysis: pack.assets.C1_social_posts_analysis.map((item) => toPublicFilePath(item.url)),
          C2_precious_photo_analysis: pack.assets.C2_precious_photo_analysis.map((item) => toPublicFilePath(item.url)),
        },
      },
    ]),
  );
}

async function requestJson(pathname, init) {
  const response = await fetch(`${baseUrl}${pathname}`, init);
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${pathname} failed (${response.status}): ${JSON.stringify(payload).slice(0, 400)}`);
  }
  return payload;
}

async function uploadFiles(questionId, filePaths) {
  const form = new FormData();
  form.append('question_id', questionId);

  for (const filePath of filePaths) {
    const buffer = await readFile(filePath);
    const file = new File([buffer], path.basename(filePath), { type: mimeFromFile(filePath) });
    form.append('files', file);
  }

  const payload = await requestJson('/api/part1/upload', { method: 'POST', body: form });
  return payload.assets;
}

function now() {
  return Date.now();
}

function durationSeconds(startedAt) {
  return Number(((now() - startedAt) / 1000).toFixed(1));
}

async function runPack(packId, packs) {
  const pack = packs[packId];
  if (!pack) throw new Error(`unknown pack: ${packId}`);

  console.log(`\n=== ${packId} / ${pack.label} ===`);

  const events = [];
  const uploadStarted = now();
  const [musicAssets, socialAssets, photoAssets] = await Promise.all([
    uploadFiles('A2_music_analysis', pack.assetPaths.A2_music_analysis),
    uploadFiles('C1_social_posts_analysis', pack.assetPaths.C1_social_posts_analysis),
    uploadFiles('C2_precious_photo_analysis', pack.assetPaths.C2_precious_photo_analysis),
  ]);
  const uploadDuration = durationSeconds(uploadStarted);
  console.log(`upload: ${uploadDuration}s`);

  const answers = {
    ...pack.answers,
    A2_music_analysis: musicAssets,
    C1_social_posts_analysis: socialAssets,
    C2_precious_photo_analysis: photoAssets,
  };

  const part1Started = now();
  const part1 = await requestJson('/api/part1/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ user_id: `bench_${packId.toLowerCase()}`, answers }),
  });
  const part1Duration = durationSeconds(part1Started);
  console.log(`part1 submit: ${part1Duration}s -> ${part1.part1_id}`);

  const multimodalStarted = now();
  const multimodal = await requestStageJson(requestJson, '/api/analyze/multimodal', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ part1_id: part1.part1_id }),
  }, { label: 'multimodal', pack: packId, events, retries: 2 });
  const multimodalDuration = durationSeconds(multimodalStarted);
  console.log(`multimodal: ${multimodalDuration}s`);

  const theaterStarted = now();
  const theater = await requestStageJson(requestJson, '/api/theater/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ part1_id: part1.part1_id }),
  }, { label: 'theater', pack: packId, events, retries: 1 });
  const theaterDuration = durationSeconds(theaterStarted);
  console.log(`theater generate: ${theaterDuration}s -> ${theater.theater_script_id}`);

  const theaterRecord = await requestJson(`/api/theater/${encodeURIComponent(theater.theater_script_id)}`);
  const act2Choices = theaterRecord.theater_script.act2.choices.map((choice, index) => ({
    choice_id: choice.choice_id,
    selected: choice.options[0]?.id,
    hesitation_time: Number((1.2 + index * 0.4).toFixed(1)),
    hover_sequence: choice.options.slice(0, Math.min(2, choice.options.length)).map((option) => option.id),
    timestamp: new Date().toISOString(),
  }));
  const act3Responses = theaterRecord.theater_script.act3.mirror_questions.map((question, index) => ({
    question_id: question.question_id,
    selected: question.options[0]?.id,
    hesitation_time: Number((1.4 + index * 0.5).toFixed(1)),
    timestamp: new Date().toISOString(),
  }));

  const part2Started = now();
  const part2 = await requestJson('/api/part2/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      part1_id: part1.part1_id,
      theater_script_id: theater.theater_script_id,
      act2_choices: act2Choices,
      act3_responses: act3Responses,
      metadata: {
        total_time: 600,
        part1_time: 240,
        part2_time: 360,
        device: 'benchmark',
        phase_durations: { act1: 30, act2: 90, act3: 70, epilogue: 18 },
        hover_totals: { act2: act2Choices.reduce((sum, item) => sum + item.hover_sequence.length, 0), act3: 0 },
        hesitation_patterns: [
          ...act2Choices.map((item) => ({ phase: 'act2', node_id: item.choice_id, hesitation_time: item.hesitation_time, selected: item.selected })),
          ...act3Responses.map((item) => ({ phase: 'act3', node_id: item.question_id, hesitation_time: item.hesitation_time, selected: item.selected })),
        ],
      },
    }),
  });
  const part2Duration = durationSeconds(part2Started);
  console.log(`part2 submit: ${part2Duration}s -> ${part2.part2_id}`);

  const constellationStarted = now();
  const constellation = await requestStageJson(requestJson, '/api/constellation/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ part1_id: part1.part1_id, part2_id: part2.part2_id }),
  }, { label: 'constellation', pack: packId, events, retries: 1 });
  const constellationDuration = durationSeconds(constellationStarted);
  console.log(`constellation: ${constellationDuration}s -> ${constellation.constellation_id}`);

  const report = await requestJson(`/api/constellation/${encodeURIComponent(constellation.constellation_id)}`);

  return {
    pack: packId,
    label: pack.label,
    archetypeSeed: pack.archetype,
    ids: {
      part1_id: part1.part1_id,
      theater_script_id: theater.theater_script_id,
      part2_id: part2.part2_id,
      constellation_id: constellation.constellation_id,
    },
    durations: {
      upload: uploadDuration,
      part1_submit: part1Duration,
      multimodal: multimodalDuration,
      theater_generate: theaterDuration,
      part2_submit: part2Duration,
      constellation_generate: constellationDuration,
      total: Number((uploadDuration + part1Duration + multimodalDuration + theaterDuration + part2Duration + constellationDuration).toFixed(1)),
    },
    runtime: {
      multimodal: multimodal.runtime,
      theater: theater.runtime,
      constellation: constellation.runtime,
    },
    events,
    archetype: report.constellation?.archetype?.name,
    growthSuggestionCount: report.constellation?.growth_suggestions?.length,
    tensionCount: report.constellation?.core_tensions?.length,
  };
}

async function main() {
  const packs = await loadPacks();
  const results = [];
  for (const packId of selectedPacks) {
    results.push(await runPack(packId, packs));
  }

  const generatedAt = new Date().toISOString();
  const payload = { baseUrl, manifestPath, generatedAt, selectedPacks, results };
  const snapshotPath = benchmarkSnapshotPath(selectedPacks, generatedAt);

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  await writeFile(snapshotPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`\nSaved benchmark -> ${outputPath}`);
  console.log(`Snapshot benchmark -> ${snapshotPath}`);
}

main().catch((error) => {
  console.error('benchmark failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
