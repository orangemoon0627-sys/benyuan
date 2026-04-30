import assert from 'node:assert/strict';
import test from 'node:test';

import { appendRuntimeEvent, buildRuntimeConsoleRequest, mergeRuntimeRun } from './runtime-console';
import type { RuntimeEventRecord, ToolCallRecord } from './types';

test('buildRuntimeConsoleRequest creates shell tool payload with cwd and command', () => {
  const request = buildRuntimeConsoleRequest({
    action: 'shell.exec',
    projectSpaceId: 'benyuan',
    command: 'pwd',
    cwd: '/tmp/playground',
  });

  assert.equal(request.runType, 'tool');
  assert.equal(request.endpoint, '/api/internal/codex/tool-calls');
  assert.deepEqual(request.payload, {
    toolName: 'shell.exec',
    projectSpaceId: 'benyuan',
    input: {
      command: 'pwd',
      cwd: '/tmp/playground',
    },
  });
});

test('buildRuntimeConsoleRequest creates workspace overview agent payload', () => {
  const request = buildRuntimeConsoleRequest({
    action: 'workspace_overview',
    projectSpaceId: 'tradewise',
  });

  assert.equal(request.runType, 'agent');
  assert.equal(request.endpoint, '/api/internal/codex/agent-runs');
  assert.deepEqual(request.payload, {
    agentType: 'workspace_overview',
    projectSpaceId: 'tradewise',
  });
});

test('appendRuntimeEvent keeps unique events in chronological order', () => {
  const earlier: RuntimeEventRecord = {
    id: 'evt_a',
    runId: 'tool_1',
    runType: 'tool',
    kind: 'requested',
    message: 'requested',
    createdAt: '2026-04-01T00:00:00.000Z',
  };
  const later: RuntimeEventRecord = {
    id: 'evt_b',
    runId: 'tool_1',
    runType: 'tool',
    kind: 'completed',
    message: 'completed',
    createdAt: '2026-04-01T00:00:01.000Z',
  };

  const events = appendRuntimeEvent([later], earlier);
  const deduped = appendRuntimeEvent(events, later);

  assert.deepEqual(
    deduped.map((event) => event.id),
    ['evt_a', 'evt_b'],
  );
});

test('mergeRuntimeRun updates matching runs without dropping untouched entries', () => {
  const current: ToolCallRecord = {
    id: 'tool_1',
    toolName: 'project.scan',
    projectSpaceId: 'codex',
    status: 'queued',
    input: {},
    output: {},
    permission: {
      id: 'perm_1',
      action: 'project.scan',
      scope: 'local-runtime',
      riskLevel: 'low',
      status: 'approved',
      source: 'fallback',
      reason: 'ok',
      createdAt: '2026-04-01T00:00:00.000Z',
    },
    startedAt: '2026-04-01T00:00:00.000Z',
  };

  const merged = mergeRuntimeRun(
    [
      current,
      {
        ...current,
        id: 'tool_2',
      },
    ],
    {
      ...current,
      status: 'completed',
      completedAt: '2026-04-01T00:00:01.000Z',
    },
  );

  assert.equal(merged[0]?.id, 'tool_1');
  assert.equal(merged[0]?.status, 'completed');
  assert.equal(merged[1]?.id, 'tool_2');
});
