import { listProjectSpaces, getProjectSpaceById } from './project-spaces';
import type {
  AgentRunRecord,
  CreateAgentRunInput,
  CreatePlanRunInput,
  PermissionDecisionRecord,
  PlanRunRecord,
  ToolCallInput,
  ToolCallRecord,
  ToolCallStatus,
} from './types';

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function buildPermissionDecision(action: string): PermissionDecisionRecord {
  if (action === 'shell.exec') {
    return {
      id: uid('perm'),
      action,
      scope: 'local-runtime',
      riskLevel: 'high',
      status: 'pending',
      source: 'policy',
      reason: 'Shell execution stays gated until the companion approval loop is wired.',
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: uid('perm'),
    action,
    scope: 'local-runtime',
    riskLevel: 'low',
    status: 'approved',
    source: 'fallback',
    reason: 'Read-only platform inspection tool.',
    createdAt: new Date().toISOString(),
  };
}

export async function resolveLocalToolCallResult(payload: ToolCallInput): Promise<{
  status: ToolCallStatus;
  output: Record<string, unknown>;
  error?: string;
}> {
  if (payload.toolName === 'project.scan') {
    return {
      status: 'completed',
      output: {
        projectSpaces: listProjectSpaces(),
      },
    };
  }

  if (payload.toolName === 'project.space.read') {
    const projectSpaceId = String(payload.input.projectSpaceId ?? '');
    const projectSpace = getProjectSpaceById(projectSpaceId);
    return {
      status: projectSpace ? 'completed' : 'failed',
      output: projectSpace ? { projectSpace } : {},
      error: projectSpace ? undefined : `Unknown project space: ${projectSpaceId}`,
    };
  }

  if (payload.toolName === 'memory.read') {
    return {
      status: 'completed',
      output: {
        memoryScopes: ['profile', 'active', 'project'],
      },
    };
  }

  return {
    status: 'failed',
    output: {},
    error: `Unsupported tool: ${payload.toolName}`,
  };
}

export async function runLocalToolCall(payload: ToolCallInput): Promise<ToolCallRecord> {
  const permission = buildPermissionDecision(payload.toolName);
  const startedAt = new Date().toISOString();

  if (permission.status !== 'approved') {
    return {
      id: uid('tool'),
      toolName: payload.toolName,
      sessionId: payload.sessionId,
      projectSpaceId: payload.projectSpaceId,
      status: 'failed',
      input: payload.input,
      output: {},
      error: permission.reason,
      permission,
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }

  const result = await resolveLocalToolCallResult(payload);

  return {
    id: uid('tool'),
    toolName: payload.toolName,
    sessionId: payload.sessionId,
    projectSpaceId: payload.projectSpaceId,
    status: result.status,
    input: payload.input,
    output: result.output,
    error: result.error,
    permission,
    startedAt,
    completedAt: new Date().toISOString(),
  };
}

export async function createLocalAgentRun(input: CreateAgentRunInput): Promise<AgentRunRecord> {
  const startedAt = new Date().toISOString();
  const projectSpace = getProjectSpaceById(input.projectSpaceId);
  const stageLog = [
    'Load project space context.',
    'Apply compatibility guardrails.',
    'Build deterministic platform summary.',
  ];

  if (input.agentType === 'migration_guard') {
    stageLog.push('Recommend shadow rollout and feature-flag checkpoints.');
  } else {
    stageLog.push('Summarize current session/tool/runtime posture.');
  }

  return {
    id: uid('agent'),
    agentType: input.agentType,
    sessionId: input.sessionId,
    projectSpaceId: input.projectSpaceId,
    status: 'completed',
    input,
    output: {
      headline:
        input.agentType === 'migration_guard'
          ? `Protect ${projectSpace?.shortTitle ?? input.projectSpaceId} behind adapters and staged takeover.`
          : `Workspace overview ready for ${projectSpace?.shortTitle ?? input.projectSpaceId}.`,
      summary:
        input.agentType === 'migration_guard'
          ? [
              'Keep legacy product routes reachable during root takeover.',
              'Move orchestration into Codex platform services before rewriting project pages.',
              'Treat shell execution as gated until companion approval is stable.',
            ]
          : [
              'Project space registry is available.',
              'Fallback runtime can create sessions, tools, and plans locally.',
              'Companion connection is optional and should never block the shell.',
            ],
    },
    stageLog,
    startedAt,
    completedAt: new Date().toISOString(),
  };
}

export async function createLocalPlanRun(input: CreatePlanRunInput): Promise<PlanRunRecord> {
  const createdAt = new Date().toISOString();

  return {
    id: uid('plan'),
    objective: input.objective,
    projectSpaceId: input.projectSpaceId,
    sessionId: input.sessionId,
    status: 'drafted',
    steps: [
      'Stabilize routing takeover behind a feature flag.',
      'Wire the project space registry into the shell and adapters.',
      'Keep companion connectivity optional with local fallback paths.',
      'Verify legacy product routes still open after root takeover.',
    ],
    createdAt,
    updatedAt: createdAt,
  };
}
