import { spawn } from 'node:child_process';

import { publishRuntimeEvent } from './execution-bus';
import {
  getPermissionDecisionById,
  getToolCallById,
  listToolCalls,
  persistAgentRun,
  persistPermissionDecision,
  persistRuntimeEvent,
  persistToolCall,
  updateAgentRun,
  updatePermissionDecision,
  updateToolCall,
} from './local-store';
import {
  buildPermissionDecision,
  createLocalAgentRun,
  resolveLocalToolCallResult,
} from './runtime';
import type {
  AgentRunRecord,
  CreateAgentRunInput,
  PermissionDecisionRecord,
  PermissionResolutionInput,
  RuntimeEventKind,
  RuntimeEventRecord,
  ToolCallInput,
  ToolCallRecord,
} from './types';

type RuntimeServiceOptions = {
  storeFilePath?: string;
  shellPath?: string;
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function recordRuntimeEvent(
  runId: string,
  runType: RuntimeEventRecord['runType'],
  kind: RuntimeEventKind,
  message: string,
  options: RuntimeServiceOptions = {},
  data?: Record<string, unknown>,
) {
  const event: RuntimeEventRecord = {
    id: uid('evt'),
    runId,
    runType,
    kind,
    message,
    data,
    createdAt: new Date().toISOString(),
  };

  await persistRuntimeEvent(event, options);
  publishRuntimeEvent(event);
  return event;
}

function updatePermissionRecord(
  current: PermissionDecisionRecord,
  decision: PermissionResolutionInput['decision'],
  reason?: string,
): PermissionDecisionRecord {
  return {
    ...current,
    status: decision,
    source: 'user',
    reason: reason?.trim() || (decision === 'approved' ? 'Approved from Codex permission loop.' : 'Rejected from Codex permission loop.'),
    resolvedAt: new Date().toISOString(),
  };
}

async function finalizeToolCall(
  toolCallId: string,
  partial: Pick<ToolCallRecord, 'status' | 'output' | 'error' | 'permission'>,
  options: RuntimeServiceOptions = {},
) {
  return updateToolCall(
    toolCallId,
    (record) => ({
      ...record,
      ...partial,
      completedAt:
        partial.status === 'completed' || partial.status === 'failed'
          ? new Date().toISOString()
          : record.completedAt,
    }),
    options,
  );
}

async function runApprovedShellToolCall(
  toolCall: ToolCallRecord,
  options: RuntimeServiceOptions = {},
  execution: { alreadyRunning?: boolean } = {},
) {
  const command = String((toolCall.input as Record<string, unknown>)?.command ?? '').trim();
  const cwd = typeof (toolCall.input as Record<string, unknown>)?.cwd === 'string' ? String((toolCall.input as Record<string, unknown>).cwd) : process.cwd();
  const shellPath = options.shellPath ?? process.env.SHELL ?? '/bin/zsh';

  if (!command) {
    const failed = await finalizeToolCall(
      toolCall.id,
      {
        status: 'failed',
        output: {},
        error: 'shell.exec requires input.command',
        permission: toolCall.permission,
      },
      options,
    );
    await recordRuntimeEvent(toolCall.id, 'tool', 'failed', 'shell.exec is missing input.command.', options);
    return failed;
  }

  if (!execution.alreadyRunning) {
    await updateToolCall(
      toolCall.id,
      (record) => ({
        ...record,
        status: 'running',
        error: undefined,
        completedAt: undefined,
      }),
      options,
    );
  }
  await recordRuntimeEvent(toolCall.id, 'tool', 'started', `Running shell.exec in ${cwd}`, options, {
    command,
    cwd,
  });

  let stdout = '';
  let stderr = '';
  const streamWrites: Promise<unknown>[] = [];

  const result = await new Promise<{
    exitCode: number | null;
    signal: NodeJS.Signals | null;
  }>((resolve, reject) => {
    const child = spawn(shellPath, ['-lc', command], {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', async (chunk) => {
      const text = String(chunk);
      stdout += text;
      const message = text.trim();
      if (message) {
        streamWrites.push(recordRuntimeEvent(toolCall.id, 'tool', 'stdout', message, options));
      }
    });

    child.stderr.on('data', async (chunk) => {
      const text = String(chunk);
      stderr += text;
      const message = text.trim();
      if (message) {
        streamWrites.push(recordRuntimeEvent(toolCall.id, 'tool', 'stderr', message, options));
      }
    });

    child.on('error', reject);
    child.on('close', (exitCode, signal) => resolve({ exitCode, signal }));
  }).catch(async (error) => {
    await recordRuntimeEvent(
      toolCall.id,
      'tool',
      'failed',
      error instanceof Error ? error.message : 'shell.exec failed',
      options,
    );
    return {
      exitCode: -1,
      signal: null,
      error,
    };
  });

  if ('error' in result) {
    await Promise.all(streamWrites);
    return finalizeToolCall(
      toolCall.id,
      {
        status: 'failed',
        output: {
          command,
          cwd,
          stdout,
          stderr,
        },
        error: result.error instanceof Error ? result.error.message : 'shell.exec failed',
        permission: toolCall.permission,
      },
      options,
    );
  }

  await Promise.all(streamWrites);

  const completed = await finalizeToolCall(
    toolCall.id,
    {
      status: result.exitCode === 0 ? 'completed' : 'failed',
      output: {
        command,
        cwd,
        stdout,
        stderr,
        exitCode: result.exitCode,
        signal: result.signal ?? undefined,
      },
      error: result.exitCode === 0 ? undefined : `shell.exec exited with code ${result.exitCode}`,
      permission: toolCall.permission,
    },
    options,
  );

  await recordRuntimeEvent(
    toolCall.id,
    'tool',
    result.exitCode === 0 ? 'completed' : 'failed',
    result.exitCode === 0 ? 'shell.exec completed.' : `shell.exec failed with code ${result.exitCode}`,
    options,
    {
      exitCode: result.exitCode ?? undefined,
    },
  );

  return completed;
}

export async function executeToolCall(payload: ToolCallInput, options: RuntimeServiceOptions = {}): Promise<ToolCallRecord> {
  const permission = buildPermissionDecision(payload.toolName);
  const now = new Date().toISOString();
  const initialStatus = permission.status === 'pending' ? 'waiting_permission' : 'queued';
  const record: ToolCallRecord = {
    id: uid('tool'),
    toolName: payload.toolName,
    sessionId: payload.sessionId,
    projectSpaceId: payload.projectSpaceId,
    status: initialStatus,
    input: payload.input,
    output: {},
    permission,
    startedAt: now,
  };

  await persistToolCall(record, options);
  await recordRuntimeEvent(record.id, 'tool', 'requested', `${payload.toolName} requested.`, options);

  if (permission.status === 'pending') {
    await persistPermissionDecision(permission, options);
    await recordRuntimeEvent(record.id, 'tool', 'permission_pending', permission.reason, options, {
      permissionId: permission.id,
    });
    return record;
  }

  await persistPermissionDecision(
    {
      ...permission,
      resolvedAt: now,
    },
    options,
  );
  await recordRuntimeEvent(record.id, 'tool', 'permission_resolved', permission.reason, options, {
    permissionId: permission.id,
    status: permission.status,
  });
  await updateToolCall(
    record.id,
    (current) => ({
      ...current,
      status: 'running',
    }),
    options,
  );
  await recordRuntimeEvent(record.id, 'tool', 'started', `${payload.toolName} started.`, options);

  const result = await resolveLocalToolCallResult(payload);
  const completed = await finalizeToolCall(
    record.id,
    {
      status: result.status,
      output: result.output,
      error: result.error,
      permission: {
        ...permission,
        resolvedAt: now,
      },
    },
    options,
  );
  await recordRuntimeEvent(
    record.id,
    'tool',
    result.status === 'completed' ? 'completed' : 'failed',
    result.status === 'completed' ? `${payload.toolName} completed.` : result.error ?? `${payload.toolName} failed.`,
    options,
  );

  return completed ?? record;
}

export async function resolvePendingPermissionDecision(
  input: PermissionResolutionInput,
  options: RuntimeServiceOptions = {},
) {
  const permission = await getPermissionDecisionById(input.permissionId, options);
  if (!permission) return null;

  const updatedPermission = updatePermissionRecord(permission, input.decision, input.reason);
  await updatePermissionDecision(permission.id, () => updatedPermission, options);

  const toolCall = (await listToolCalls(options)).find((record) => record.permission.id === permission.id);
  if (!toolCall) {
    return null;
  }

  await recordRuntimeEvent(toolCall.id, 'tool', 'permission_resolved', updatedPermission.reason, options, {
    permissionId: permission.id,
    status: updatedPermission.status,
  });

  if (updatedPermission.status === 'rejected') {
    const failed = await finalizeToolCall(
      toolCall.id,
      {
        status: 'failed',
        output: {
          permissionId: updatedPermission.id,
        },
        error: updatedPermission.reason,
        permission: updatedPermission,
      },
      options,
    );
    await recordRuntimeEvent(toolCall.id, 'tool', 'failed', updatedPermission.reason, options);
    return failed;
  }

  const current = await getToolCallById(toolCall.id, options);
  if (!current) return null;

  const running = await updateToolCall(
    toolCall.id,
    (record) => ({
      ...record,
      status: 'running',
      error: undefined,
      completedAt: undefined,
      permission: updatedPermission,
    }),
    options,
  );

  const backgroundRecord = {
    ...(running ?? current),
    permission: updatedPermission,
  };

  void runApprovedShellToolCall(backgroundRecord, options, { alreadyRunning: true }).catch(async (error) => {
    await finalizeToolCall(
      toolCall.id,
      {
        status: 'failed',
        output: {},
        error: error instanceof Error ? error.message : 'shell.exec failed',
        permission: updatedPermission,
      },
      options,
    );
    await recordRuntimeEvent(
      toolCall.id,
      'tool',
      'failed',
      error instanceof Error ? error.message : 'shell.exec failed',
      options,
    );
  });

  return running ?? current;
}

export async function executeAgentRun(input: CreateAgentRunInput, options: RuntimeServiceOptions = {}): Promise<AgentRunRecord> {
  const now = new Date().toISOString();
  const queued: AgentRunRecord = {
    id: uid('agent'),
    agentType: input.agentType,
    sessionId: input.sessionId,
    projectSpaceId: input.projectSpaceId,
    status: 'queued',
    input,
    output: {},
    stageLog: [],
    startedAt: now,
  };

  await persistAgentRun(queued, options);
  await recordRuntimeEvent(queued.id, 'agent', 'requested', `${input.agentType} requested.`, options);
  await updateAgentRun(
    queued.id,
    (record) => ({
      ...record,
      status: 'running',
    }),
    options,
  );
  await recordRuntimeEvent(queued.id, 'agent', 'started', `${input.agentType} started.`, options);

  const resolved = await createLocalAgentRun(input);

  for (const stage of resolved.stageLog) {
    await delay(10);
    await recordRuntimeEvent(queued.id, 'agent', 'stage', stage, options);
  }

  const completed = await updateAgentRun(
    queued.id,
    (record) => ({
      ...record,
      status: resolved.status,
      output: resolved.output,
      stageLog: resolved.stageLog,
      completedAt: new Date().toISOString(),
    }),
    options,
  );

  await recordRuntimeEvent(queued.id, 'agent', 'completed', `${input.agentType} completed.`, options);
  return completed ?? queued;
}
