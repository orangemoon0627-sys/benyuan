#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const baseUrl = (process.env.BENYUAN_BASE_URL ?? 'http://localhost:3014').replace(/\/$/, '');
const selectedPacks = (process.env.BENYUAN_PACKS ?? 'A,B,C').split(',').map((item) => item.trim()).filter(Boolean);
const outputPath = path.join(process.cwd(), 'output', 'benyuan-pack-benchmark.json');

const packs = {
  A: {
    label: '孤独求索者',
    answers: {
      A1_core_image: 'A1-1',
      A3_literature: ['A3-1', 'A3-2', 'A3-4'],
      A4_cinema: 'A4-2',
      A5_inspiration_scene: 'A5-1',
      B1_night_thoughts: 'B1-1',
      B2_decision_style: 'B2-2',
      B3_emotion_pattern: 'B3-2',
      B4_time_philosophy: { past: 40, present: 30, future: 30 },
      B5_relationship_philosophy: 'B5-1',
      C3_resonance_moments: ['C3-1', 'C3-2', 'C3-5'],
    },
    assets: {
      A2_music_analysis: ['public/benyuan-test-packs/pack-a/music-1.png', 'public/benyuan-test-packs/pack-a/music-2.png'],
      C1_social_posts_analysis: ['public/benyuan-test-packs/pack-a/social-1.png', 'public/benyuan-test-packs/pack-a/social-2.png'],
      C2_precious_photo_analysis: ['public/benyuan-test-packs/pack-a/photo-1.png'],
    },
  },
  B: {
    label: '理性建构者',
    answers: {
      A1_core_image: 'A1-3',
      A3_literature: ['A3-4', 'A3-7', 'A3-9'],
      A4_cinema: 'A4-7',
      A5_inspiration_scene: 'A5-2',
      B1_night_thoughts: 'B1-6',
      B2_decision_style: 'B2-1',
      B3_emotion_pattern: 'B3-1',
      B4_time_philosophy: { past: 20, present: 35, future: 45 },
      B5_relationship_philosophy: 'B5-5',
      C3_resonance_moments: ['C3-2', 'C3-5', 'C3-6'],
    },
    assets: {
      A2_music_analysis: ['public/benyuan-test-packs/pack-b/music-1.png', 'public/benyuan-test-packs/pack-b/music-2.png'],
      C1_social_posts_analysis: ['public/benyuan-test-packs/pack-b/social-1.png', 'public/benyuan-test-packs/pack-b/social-2.png'],
      C2_precious_photo_analysis: ['public/benyuan-test-packs/pack-b/photo-1.png'],
    },
  },
  C: {
    label: '温柔守护者',
    answers: {
      A1_core_image: 'A1-5',
      A3_literature: ['A3-3', 'A3-6', 'A3-8'],
      A4_cinema: 'A4-8',
      A5_inspiration_scene: 'A5-3',
      B1_night_thoughts: 'B1-4',
      B2_decision_style: 'B2-3',
      B3_emotion_pattern: 'B3-7',
      B4_time_philosophy: { past: 25, present: 45, future: 30 },
      B5_relationship_philosophy: 'B5-2',
      C3_resonance_moments: ['C3-3', 'C3-4', 'C3-6'],
    },
    assets: {
      A2_music_analysis: ['public/benyuan-test-packs/pack-c/music-1.png', 'public/benyuan-test-packs/pack-c/music-2.png'],
      C1_social_posts_analysis: ['public/benyuan-test-packs/pack-c/social-1.png', 'public/benyuan-test-packs/pack-c/social-2.png'],
      C2_precious_photo_analysis: ['public/benyuan-test-packs/pack-c/photo-1.png'],
    },
  },
};

function mimeFromFile(filePath) {
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
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


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJsonWithRetry(pathname, init, { retries = 2, backoffMs = 1500 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await requestJson(pathname, init);
    } catch (error) {
      attempt += 1;
      if (attempt > retries) throw error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`retry ${attempt}/${retries} -> ${pathname}: ${message.slice(0, 180)}`);
      await sleep(backoffMs * attempt);
    }
  }
}

async function uploadFiles(questionId, filePaths) {
  const form = new FormData();
  form.append('question_id', questionId);

  for (const filePath of filePaths) {
    const buffer = await readFile(path.join(process.cwd(), filePath));
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

async function runPack(packId) {
  const pack = packs[packId];
  if (!pack) throw new Error(`unknown pack: ${packId}`);

  console.log(`\n=== ${packId} / ${pack.label} ===`);

  const uploadStarted = now();
  const [musicAssets, socialAssets, photoAssets] = await Promise.all([
    uploadFiles('A2_music_analysis', pack.assets.A2_music_analysis),
    uploadFiles('C1_social_posts_analysis', pack.assets.C1_social_posts_analysis),
    uploadFiles('C2_precious_photo_analysis', pack.assets.C2_precious_photo_analysis),
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
  const multimodal = await requestJson('/api/analyze/multimodal', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ part1_id: part1.part1_id }),
  });
  const multimodalDuration = durationSeconds(multimodalStarted);
  console.log(`multimodal: ${multimodalDuration}s`);

  const theaterStarted = now();
  const theater = await requestJsonWithRetry('/api/theater/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ part1_id: part1.part1_id }),
  });
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
  const constellation = await requestJsonWithRetry('/api/constellation/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ part1_id: part1.part1_id, part2_id: part2.part2_id }),
  });
  const constellationDuration = durationSeconds(constellationStarted);
  console.log(`constellation: ${constellationDuration}s -> ${constellation.constellation_id}`);

  const report = await requestJson(`/api/constellation/${encodeURIComponent(constellation.constellation_id)}`);

  return {
    pack: packId,
    label: pack.label,
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
    archetype: report.constellation?.archetype?.name,
  };
}

async function main() {
  const results = [];
  for (const packId of selectedPacks) {
    results.push(await runPack(packId));
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({ baseUrl, generatedAt: new Date().toISOString(), results }, null, 2)}\n`);
  console.log(`\nSaved benchmark -> ${outputPath}`);
}

main().catch((error) => {
  console.error('benchmark failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
