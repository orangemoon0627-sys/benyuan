import type { CreateAgentRunInput, RuntimeEventRecord, ToolCallInput } from './types';

export type RuntimeConsoleAction =
  | 'project.scan'
  | 'project.space.read'
  | 'memory.read'
  | 'shell.exec'
  | 'workspace_overview';

export type RuntimeConsoleRequestInput = {
  action: RuntimeConsoleAction;
  projectSpaceId: string;
  command?: string;
  cwd?: string;
};

export type RuntimeConsoleRequest =
  | {
      runType: 'tool';
      endpoint: '/api/internal/codex/tool-calls';
      payload: ToolCallInput;
    }
  | {
      runType: 'agent';
      endpoint: '/api/internal/codex/agent-runs';
      payload: CreateAgentRunInput;
    };

export function buildRuntimeConsoleRequest(input: RuntimeConsoleRequestInput): RuntimeConsoleRequest {
  if (input.action === 'workspace_overview') {
    return {
      runType: 'agent',
      endpoint: '/api/internal/codex/agent-runs',
      payload: {
        agentType: 'workspace_overview',
        projectSpaceId: input.projectSpaceId,
      },
    };
  }

  if (input.action === 'shell.exec') {
    return {
      runType: 'tool',
      endpoint: '/api/internal/codex/tool-calls',
      payload: {
        toolName: 'shell.exec',
        projectSpaceId: input.projectSpaceId,
        input: {
          command: input.command ?? '',
          ...(input.cwd ? { cwd: input.cwd } : {}),
        },
      },
    };
  }

  if (input.action === 'project.space.read') {
    return {
      runType: 'tool',
      endpoint: '/api/internal/codex/tool-calls',
      payload: {
        toolName: 'project.space.read',
        projectSpaceId: input.projectSpaceId,
        input: {
          projectSpaceId: input.projectSpaceId,
        },
      },
    };
  }

  return {
    runType: 'tool',
    endpoint: '/api/internal/codex/tool-calls',
    payload: {
      toolName: input.action,
      projectSpaceId: input.projectSpaceId,
      input: {},
    },
  };
}

export function appendRuntimeEvent(events: RuntimeEventRecord[], nextEvent: RuntimeEventRecord) {
  const deduped = events.filter((event) => event.id !== nextEvent.id).concat(nextEvent);
  return deduped.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}

export function mergeRuntimeRun<T extends { id: string }>(runs: T[], nextRun: T) {
  const merged = runs.filter((run) => run.id !== nextRun.id);
  return [nextRun, ...merged];
}
