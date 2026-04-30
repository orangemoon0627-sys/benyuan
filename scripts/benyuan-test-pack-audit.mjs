#!/usr/bin/env node
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const manifestPath = path.join(process.cwd(), 'src', 'lib', 'fixtures', 'benyuan-v3-test-packs.json');
const outputPath = path.join(process.cwd(), 'output', 'benyuan-test-pack-manifest.json');
const requiredAnswerKeys = [
  'A1_core_image',
  'A3_literature',
  'A4_cinema',
  'A5_inspiration_scene',
  'B1_night_thoughts',
  'B2_decision_style',
  'B3_emotion_pattern',
  'B4_time_philosophy',
  'B5_relationship_philosophy',
  'C3_resonance_moments',
];
const requiredAssetKeys = {
  A2_music_analysis: 2,
  C1_social_posts_analysis: 2,
  C2_precious_photo_analysis: 1,
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function toPublicFilePath(assetUrl) {
  const normalized = String(assetUrl ?? '').replace(/^\/+/, '');
  assert(normalized.startsWith('benyuan-test-packs/'), `asset url outside public test-pack scope: ${assetUrl}`);
  return path.join(process.cwd(), 'public', normalized);
}

async function loadManifest() {
  const raw = await readFile(manifestPath, 'utf8');
  const packs = JSON.parse(raw);
  assert(Array.isArray(packs) && packs.length === 3, 'test pack manifest must contain exactly 3 packs');
  return packs;
}

async function main() {
  const packs = await loadManifest();
  const results = [];

  for (const pack of packs) {
    assert(['A', 'B', 'C'].includes(pack.id), `invalid pack id: ${pack.id}`);
    for (const key of requiredAnswerKeys) {
      assert(Object.hasOwn(pack.answers, key), `${pack.id} missing answer key ${key}`);
    }

    const assetGroups = {};
    for (const [assetKey, expectedCount] of Object.entries(requiredAssetKeys)) {
      const items = Array.isArray(pack.assets?.[assetKey]) ? pack.assets[assetKey] : [];
      assert(items.length === expectedCount, `${pack.id} ${assetKey} expected ${expectedCount} assets, got ${items.length}`);

      const resolved = [];
      for (const item of items) {
        const filePath = toPublicFilePath(item.url);
        const info = await stat(filePath);
        resolved.push({
          name: item.name,
          url: item.url,
          filePath,
          size: info.size,
        });
      }

      assetGroups[assetKey] = resolved;
    }

    results.push({
      id: pack.id,
      name: pack.name,
      archetype: pack.archetype,
      description: pack.description,
      answerKeys: Object.keys(pack.answers),
      assetGroups,
      route: '/collect',
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    manifestPath,
    totalPacks: results.length,
    results,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`test-pack-audit:pass -> ${outputPath}`);
}

main().catch((error) => {
  console.error('test-pack-audit:fail', error instanceof Error ? error.message : error);
  process.exit(1);
});
