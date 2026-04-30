import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  executeAgentRun,
  executeToolCall,
  resolvePendingPermissionDecision,
} from './runtime-service';
import { getToolCallById, listRuntimeEvents, listToolCalls } from './local-store';

async function waitForToolCallCompletion(toolCallId: string, storeFilePath: string, attempts = 40) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const record = await getToolCallById(toolCallId, { storeFilePath });
    if (record?.status === 'completed' || record?.status === 'failed') {
      return record;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  return getToolCallById(toolCallId, { storeFilePath });
}

test('shell.exec stays queued until approval and then resumes asynchronously for streaming', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'codex-platform-exec-'));
  const storeFilePath = path.join(tempDir, 'codex-platform-store.json');

  const queued = await executeToolCall(
    {
      toolName: 'shell.exec',
      input: {
        command: 'printf "hello-codex"',
      },
      projectSpaceId: 'codex',
    },
    { storeFilePath },
  );

  assert.equal(queued.status, 'waiting_permission');
  assert.equal(queued.permission.status, 'pending');

  const resumed = await resolvePendingPermissionDecision(
    {
      permissionId: queued.permission.id,
      decision: 'approved',
    },
    { storeFilePath },
  );

  assert.ok(resumed);
  assert.equal(resumed?.status, 'running');
  assert.equal(resumed?.permission.status, 'approved');

  const completed = await waitForToolCallCompletion(queued.id, storeFilePath);
  assert.ok(completed);
  assert.equal(completed?.status, 'completed');
  assert.match(String(completed?.output.stdout ?? ''), /hello-codex/);

  const events = await listRuntimeEvents({ storeFilePath, runId: queued.id });
  assert.ok(events.some((event) => event.kind === 'permission_pending'));
  assert.ok(events.some((event) => event.kind === 'stdout' && /hello-codex/.test(event.message)));
  assert.ok(events.some((event) => event.kind === 'completed'));
});

test('shell.exec rejection keeps the rejection reason and writes failed events', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'codex-platform-exec-reject-'));
  const storeFilePath = path.join(tempDir, 'codex-platform-store.json');

  const queued = await executeToolCall(
    {
      toolName: 'shell.exec',
      input: {
        command: 'printf "should-not-run"',
      },
      projectSpaceId: 'codex',
    },
    { storeFilePath },
  );

  const rejected = await resolvePendingPermissionDecision(
    {
      permissionId: queued.permission.id,
      decision: 'rejected',
      reason: 'User rejected shell access.',
    },
    { storeFilePath },
  );

  assert.ok(rejected);
  assert.equal(rejected?.status, 'failed');
  assert.equal(rejected?.permission.status, 'rejected');
  assert.equal(rejected?.error, 'User rejected shell access.');

  const events = await listRuntimeEvents({ storeFilePath, runId: queued.id });
  assert.ok(events.some((event) => event.kind === 'permission_resolved' && /User rejected shell access\./.test(event.message)));
  assert.ok(events.some((event) => event.kind === 'failed' && /User rejected shell access\./.test(event.message)));
});

test('workspace agent execution emits stage stream and persists completed record', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'codex-platform-agent-'));
  const storeFilePath = path.join(tempDir, 'codex-platform-store.json');

  const run = await executeAgentRun(
    {
      agentType: 'workspace_overview',
      projectSpaceId: 'benyuan',
    },
    { storeFilePath },
  );

  assert.equal(run.status, 'completed');
  assert.ok(Array.isArray(run.output.summary));

  const events = await listRuntimeEvents({ storeFilePath, runId: run.id });
  assert.ok(events.some((event) => event.kind === 'stage' && /Load project space context/i.test(event.message)));
  assert.ok(events.some((event) => event.kind === 'completed'));

  const toolCalls = await listToolCalls({ storeFilePath });
  assert.equal(toolCalls.length, 0);
});
