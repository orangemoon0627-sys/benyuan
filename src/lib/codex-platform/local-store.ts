import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  AgentRunRecord,
  CreateSessionInput,
  PermissionDecisionRecord,
  PlanRunRecord,
  PlatformSession,
  RuntimeEventRecord,
  ToolCallRecord,
} from './types';

type PersistedCodexPlatformStore = {
  sessions: Record<string, PlatformSession>;
  toolCalls: Record<string, ToolCallRecord>;
  agentRuns: Record<string, AgentRunRecord>;
  planRuns: Record<string, PlanRunRecord>;
  permissions: Record<string, PermissionDecisionRecord>;
  runtimeEvents: Record<string, RuntimeEventRecord>;
};

type StoreOptions = {
  storeFilePath?: string;
};

const DEFAULT_STORE_FILE = path.join(process.cwd(), 'data', 'codex-platform-store.json');

function resolveStoreFilePath(options: StoreOptions = {}) {
  return options.storeFilePath ?? DEFAULT_STORE_FILE;
}

function defaultStore(): PersistedCodexPlatformStore {
  return {
    sessions: {},
    toolCalls: {},
    agentRuns: {},
    planRuns: {},
    permissions: {},
    runtimeEvents: {},
  };
}

async function ensureStoreFile(storeFilePath: string) {
  await mkdir(path.dirname(storeFilePath), { recursive: true });

  try {
    await readFile(storeFilePath, 'utf8');
  } catch {
    await writeFile(storeFilePath, JSON.stringify(defaultStore(), null, 2), 'utf8');
  }
}

async function readStore(options: StoreOptions = {}) {
  const storeFilePath = resolveStoreFilePath(options);
  await ensureStoreFile(storeFilePath);
  const raw = await readFile(storeFilePath, 'utf8');
  const parsed = JSON.parse(raw) as Partial<PersistedCodexPlatformStore>;

  return {
    storeFilePath,
    store: {
      ...defaultStore(),
      ...parsed,
      sessions: parsed.sessions ?? {},
      toolCalls: parsed.toolCalls ?? {},
      agentRuns: parsed.agentRuns ?? {},
      planRuns: parsed.planRuns ?? {},
      permissions: parsed.permissions ?? {},
      runtimeEvents: parsed.runtimeEvents ?? {},
    } satisfies PersistedCodexPlatformStore,
  };
}

async function writeStore(storeFilePath: string, store: PersistedCodexPlatformStore) {
  const tempFile = `${storeFilePath}.${process.pid}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  await writeFile(tempFile, JSON.stringify(store, null, 2), 'utf8');
  await rename(tempFile, storeFilePath);
}

async function mutateStore<T>(options: StoreOptions, mutator: (store: PersistedCodexPlatformStore) => T | Promise<T>) {
  const { storeFilePath, store } = await readStore(options);
  const result = await mutator(store);
  await writeStore(storeFilePath, store);
  return result;
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function sortByUpdatedAt<T extends { createdAt: string; updatedAt?: string }>(records: T[]) {
  return [...records].sort((left, right) => {
    const leftTime = new Date(left.updatedAt ?? left.createdAt).getTime();
    const rightTime = new Date(right.updatedAt ?? right.createdAt).getTime();
    return rightTime - leftTime;
  });
}

function sortByCompletedAt<T extends { startedAt: string; completedAt?: string }>(records: T[]) {
  return [...records].sort((left, right) => {
    const leftTime = new Date(left.completedAt ?? left.startedAt).getTime();
    const rightTime = new Date(right.completedAt ?? right.startedAt).getTime();
    return rightTime - leftTime;
  });
}

export async function createPlatformSession(input: CreateSessionInput, options: StoreOptions = {}): Promise<PlatformSession> {
  return mutateStore(options, async (store) => {
    const now = new Date().toISOString();
    const session: PlatformSession = {
      id: uid('sess'),
      title: input.title?.trim() || `Codex ${input.projectSpaceId} session`,
      projectSpaceId: input.projectSpaceId,
      status: 'idle',
      createdAt: now,
      updatedAt: now,
      recoveryHint: `Resume ${input.projectSpaceId} from the latest workspace checkpoint.`,
    };

    store.sessions[session.id] = session;
    return session;
  });
}

export async function listPlatformSessions(options: StoreOptions = {}) {
  const { store } = await readStore(options);
  return sortByUpdatedAt(Object.values(store.sessions));
}

export async function getToolCallById(toolCallId: string, options: StoreOptions = {}) {
  const { store } = await readStore(options);
  return store.toolCalls[toolCallId] ?? null;
}

export async function listToolCalls(options: StoreOptions = {}) {
  const { store } = await readStore(options);
  return sortByCompletedAt(Object.values(store.toolCalls));
}

export async function getAgentRunById(agentRunId: string, options: StoreOptions = {}) {
  const { store } = await readStore(options);
  return store.agentRuns[agentRunId] ?? null;
}

export async function listAgentRuns(options: StoreOptions = {}) {
  const { store } = await readStore(options);
  return sortByCompletedAt(Object.values(store.agentRuns));
}

export async function listPlanRuns(options: StoreOptions = {}) {
  const { store } = await readStore(options);
  return sortByUpdatedAt(Object.values(store.planRuns));
}

export async function getPermissionDecisionById(permissionId: string, options: StoreOptions = {}) {
  const { store } = await readStore(options);
  return store.permissions[permissionId] ?? null;
}

export async function listPermissionDecisions(options: StoreOptions = {}) {
  const { store } = await readStore(options);
  return sortByUpdatedAt(
    Object.values(store.permissions).map((decision) => ({
      ...decision,
      updatedAt: decision.resolvedAt ?? decision.createdAt,
    })),
  ).map(({ updatedAt: _updatedAt, ...decision }) => decision);
}

export async function listRuntimeEvents(
  options: StoreOptions & {
    runId?: string;
    runType?: RuntimeEventRecord['runType'];
  } = {},
) {
  const { store } = await readStore(options);
  return Object.values(store.runtimeEvents)
    .filter((event) => (options.runId ? event.runId === options.runId : true))
    .filter((event) => (options.runType ? event.runType === options.runType : true))
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}

export async function persistToolCall(record: ToolCallRecord, options: StoreOptions = {}) {
  return mutateStore(options, async (store) => {
    store.toolCalls[record.id] = record;
    store.permissions[record.permission.id] = record.permission;
    return record;
  });
}

export async function updateToolCall(
  toolCallId: string,
  updater: (record: ToolCallRecord) => ToolCallRecord,
  options: StoreOptions = {},
) {
  return mutateStore(options, async (store) => {
    const current = store.toolCalls[toolCallId];
    if (!current) return null;
    const next = updater(current);
    store.toolCalls[toolCallId] = next;
    store.permissions[next.permission.id] = next.permission;
    return next;
  });
}

export async function persistAgentRun(record: AgentRunRecord, options: StoreOptions = {}) {
  return mutateStore(options, async (store) => {
    store.agentRuns[record.id] = record;
    return record;
  });
}

export async function updateAgentRun(
  agentRunId: string,
  updater: (record: AgentRunRecord) => AgentRunRecord,
  options: StoreOptions = {},
) {
  return mutateStore(options, async (store) => {
    const current = store.agentRuns[agentRunId];
    if (!current) return null;
    const next = updater(current);
    store.agentRuns[agentRunId] = next;
    return next;
  });
}

export async function persistPlanRun(record: PlanRunRecord, options: StoreOptions = {}) {
  return mutateStore(options, async (store) => {
    store.planRuns[record.id] = record;
    return record;
  });
}

export async function persistPermissionDecision(record: PermissionDecisionRecord, options: StoreOptions = {}) {
  return mutateStore(options, async (store) => {
    store.permissions[record.id] = record;
    return record;
  });
}

export async function updatePermissionDecision(
  permissionId: string,
  updater: (record: PermissionDecisionRecord) => PermissionDecisionRecord,
  options: StoreOptions = {},
) {
  return mutateStore(options, async (store) => {
    const current = store.permissions[permissionId];
    if (!current) return null;
    const next = updater(current);
    store.permissions[permissionId] = next;

    for (const toolCall of Object.values(store.toolCalls)) {
      if (toolCall.permission.id === permissionId) {
        store.toolCalls[toolCall.id] = {
          ...toolCall,
          permission: next,
        };
      }
    }

    return next;
  });
}

export async function persistRuntimeEvent(record: RuntimeEventRecord, options: StoreOptions = {}) {
  return mutateStore(options, async (store) => {
    store.runtimeEvents[record.id] = record;
    return record;
  });
}
