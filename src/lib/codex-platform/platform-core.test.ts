import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveCodexPlatformConfig, resolveHomeExperience } from './config';
import { fetchCompanionStatus } from './companion';
import { listProjectSpaces } from './project-spaces';
import { runLocalToolCall } from './runtime';

test('root takeover stays legacy by default and keeps fallback entry', () => {
  const config = resolveCodexPlatformConfig({ env: {} });

  assert.equal(resolveHomeExperience(config), 'legacy');
  assert.equal(config.platformEnabled, false);
  assert.equal(config.legacyHomeHref, '/legacy');
});

test('feature flag enables codex home takeover', () => {
  const config = resolveCodexPlatformConfig({
    env: { CODEX_PLATFORM_ENABLED: 'true' },
  });

  assert.equal(resolveHomeExperience(config), 'codex');
  assert.equal(config.platformEnabled, true);
});

test('project space registry exposes stable legacy-compatible spaces', () => {
  const spaces = listProjectSpaces();
  const ids = spaces.map((space) => space.id);

  assert.deepEqual(ids.slice(0, 4), ['codex', 'benyuan', 'tradewise', 'embryo']);
  assert.ok(spaces.find((space) => space.id === 'benyuan')?.legacyRoutes.includes('/collect'));
  assert.ok(spaces.find((space) => space.id === 'tradewise')?.capabilities.includes('mobile-handoff'));
});

test('offline companion falls back to degraded local mode', async () => {
  const status = await fetchCompanionStatus({
    companionUrl: 'http://127.0.0.1:49999',
    fetchImpl: async () => {
      throw new Error('connect ECONNREFUSED');
    },
  });

  assert.equal(status.mode, 'fallback');
  assert.equal(status.connected, false);
  assert.match(status.summary, /fallback/i);
});

test('companion status request times out into fallback mode', async () => {
  const status = await fetchCompanionStatus({
    companionUrl: 'http://127.0.0.1:49999',
    timeoutMs: 1,
    fetchImpl: async (_input, init) =>
      await new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('timed out')));
      }),
  });

  assert.equal(status.mode, 'fallback');
  assert.equal(status.connected, false);
  assert.match(status.summary, /timed out/i);
});

test('project.scan tool returns current project spaces in read-only mode', async () => {
  const result = await runLocalToolCall({
    toolName: 'project.scan',
    input: {},
  });

  assert.equal(result.status, 'completed');
  assert.equal(result.permission.riskLevel, 'low');
  assert.ok(Array.isArray(result.output.projectSpaces));
  assert.ok(result.output.projectSpaces.some((space: { id: string }) => space.id === 'benyuan'));
});
