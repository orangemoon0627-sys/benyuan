import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildCodexPlatformBootstrap } from './bootstrap';
import { createPlatformSession, listPlatformSessions, listToolCalls, persistToolCall } from './local-store';
import { runLocalToolCall } from './runtime';

test('local platform store persists sessions and tool calls', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'codex-platform-store-'));
  const storeFilePath = path.join(tempDir, 'codex-platform-store.json');

  const session = await createPlatformSession(
    {
      projectSpaceId: 'codex',
      title: 'Shadow takeover',
    },
    { storeFilePath },
  );

  await persistToolCall(
    await runLocalToolCall({
      toolName: 'project.scan',
      input: {},
      sessionId: session.id,
      projectSpaceId: 'codex',
    }),
    { storeFilePath },
  );

  const sessions = await listPlatformSessions({ storeFilePath });
  const toolCalls = await listToolCalls({ storeFilePath });

  assert.equal(sessions.length, 1);
  assert.equal(sessions[0]?.id, session.id);
  assert.equal(toolCalls.length, 1);
  assert.equal(toolCalls[0]?.toolName, 'project.scan');
  assert.equal(toolCalls[0]?.sessionId, session.id);
});

test('bootstrap assembles discovery, compatibility summaries, and persisted platform state', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'codex-platform-bootstrap-'));
  const storeFilePath = path.join(tempDir, 'codex-platform-store.json');
  const benyuanStoreFilePath = path.join(tempDir, 'benyuan-store.json');
  const profilePath = path.join(tempDir, 'PROFILE.md');
  const activePath = path.join(tempDir, 'ACTIVE.md');
  const projectMemoryPath = path.join(tempDir, 'AGENTS.md');

  await writeFile(
    benyuanStoreFilePath,
    JSON.stringify({
      sessions: {
        sess_a: { sessionId: 'sess_a' },
        sess_b: { sessionId: 'sess_b' },
      },
      drafts: {
        draft_a: { draftId: 'draft_a' },
      },
    }),
    'utf8',
  );
  await writeFile(profilePath, '# PROFILE\n\n- 偏好直接执行。', 'utf8');
  await writeFile(activePath, '# ACTIVE\n\n- 优先保证兼容性。', 'utf8');
  await writeFile(projectMemoryPath, '# AGENTS\n\n- Playground 工作区记忆。', 'utf8');

  await createPlatformSession(
    {
      projectSpaceId: 'codex',
      title: 'Companion rollout',
    },
    { storeFilePath },
  );

  const bootstrap = await buildCodexPlatformBootstrap({
    env: { CODEX_PLATFORM_ENABLED: 'true' },
    platformStoreFilePath: storeFilePath,
    benyuanStoreFilePath,
    codexConfigRaw: `
model_provider = "crs"

[mcp_servers.figma]
url = "https://mcp.figma.com/mcp"

[mcp_servers.playwright]
command = "npx"
args = ["@playwright/mcp@latest"]

[plugins."build-web-apps@openai-curated"]
enabled = true
`,
    memoryPaths: {
      profile: profilePath,
      active: activePath,
      project: projectMemoryPath,
    },
    companionStatus: {
      connected: false,
      mode: 'fallback',
      summary: 'Companion offline, using fallback runtime.',
      bridgeHealth: 'degraded',
      baseUrl: 'http://127.0.0.1:4319',
      capabilities: ['local-store'],
      lastHeartbeatAt: '2026-04-01T00:00:00.000Z',
    },
  });

  const benyuan = bootstrap.projectSpaces.find((space) => space.id === 'benyuan');

  assert.equal(bootstrap.homeExperience, 'codex');
  assert.equal(bootstrap.sessions.length, 1);
  assert.equal(benyuan?.summary.sessionCount, 2);
  assert.equal(benyuan?.summary.draftCount, 1);
  assert.ok(bootstrap.plugins.some((plugin) => plugin.id === 'build-web-apps@openai-curated'));
  assert.ok(bootstrap.mcpConnections.some((connection) => connection.id === 'figma'));
  assert.ok(bootstrap.memories.some((memory) => memory.id === 'profile' && memory.status === 'loaded'));
  assert.ok(bootstrap.skills.some((skill) => skill.status === 'loaded'));
  assert.ok(bootstrap.projectManifests.some((manifest) => manifest.spaceId === 'benyuan'));
  assert.ok(
    bootstrap.projectManifests
      .find((manifest) => manifest.spaceId === 'benyuan')
      ?.workbenches.some(
        (workbench) => workbench.href === '/workspace/benyuan/native' && workbench.compatibilityHref === '/lab/native-handoff',
      ),
  );
  assert.ok(
    bootstrap.projectManifests
      .find((manifest) => manifest.spaceId === 'tradewise')
      ?.boundaries.some((boundary) => boundary.id === 'tradewise.review.prompt' && boundary.owner === 'project'),
  );
});
