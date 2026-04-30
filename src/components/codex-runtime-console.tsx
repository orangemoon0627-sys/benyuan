'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { appendRuntimeEvent, buildRuntimeConsoleRequest, mergeRuntimeRun, type RuntimeConsoleAction } from '@/lib/codex-platform/runtime-console';
import type {
  AgentRunRecord,
  PermissionDecisionRecord,
  RuntimeEventKind,
  RuntimeEventRecord,
  ToolCallRecord,
} from '@/lib/codex-platform/types';

type CodexRuntimeConsoleProps = {
  defaultProjectSpaceId: string;
  availableProjectSpaceIds?: string[];
  initialToolCalls?: ToolCallRecord[];
  initialAgentRuns?: AgentRunRecord[];
  initialPermissions?: PermissionDecisionRecord[];
  initialEvents?: RuntimeEventRecord[];
  title?: string;
  description?: string;
};

type ConsoleRun = {
  id: string;
  runType: 'tool' | 'agent';
  title: string;
  projectSpaceId?: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
  output: Record<string, unknown>;
  permission?: PermissionDecisionRecord;
};

const runtimeEventKinds: RuntimeEventKind[] = [
  'requested',
  'permission_pending',
  'permission_resolved',
  'started',
  'stage',
  'stdout',
  'stderr',
  'completed',
  'failed',
];

function asToolRun(record: ToolCallRecord): ConsoleRun {
  return {
    id: record.id,
    runType: 'tool',
    title: record.toolName,
    projectSpaceId: record.projectSpaceId,
    status: record.status,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    error: record.error,
    output: record.output,
    permission: record.permission,
  };
}

function asAgentRun(record: AgentRunRecord): ConsoleRun {
  return {
    id: record.id,
    runType: 'agent',
    title: record.agentType,
    projectSpaceId: record.projectSpaceId,
    status: record.status,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    error: undefined,
    output: record.output,
  };
}

function buildInitialEventMap(events: RuntimeEventRecord[]) {
  return events.reduce<Record<string, RuntimeEventRecord[]>>((accumulator, event) => {
    accumulator[event.runId] = appendRuntimeEvent(accumulator[event.runId] ?? [], event);
    return accumulator;
  }, {});
}

function outputPreview(run: ConsoleRun) {
  if (run.error) return run.error;
  if (typeof run.output.stdout === 'string' && run.output.stdout.trim()) return String(run.output.stdout).trim();
  const json = JSON.stringify(run.output);
  return json === '{}' ? 'Waiting for output...' : json;
}

export function CodexRuntimeConsole({
  defaultProjectSpaceId,
  availableProjectSpaceIds,
  initialToolCalls = [],
  initialAgentRuns = [],
  initialPermissions = [],
  initialEvents = [],
  title = 'Runtime Console',
  description = '直接从主控台发起 tool / agent run，并消费审批与流式输出。',
}: CodexRuntimeConsoleProps) {
  const selectableSpaces = useMemo(
    () => Array.from(new Set([defaultProjectSpaceId, ...(availableProjectSpaceIds ?? [])])),
    [availableProjectSpaceIds, defaultProjectSpaceId],
  );
  const [projectSpaceId, setProjectSpaceId] = useState(defaultProjectSpaceId);
  const [shellCommand, setShellCommand] = useState('pwd');
  const [shellCwd, setShellCwd] = useState('');
  const [submittingAction, setSubmittingAction] = useState<RuntimeConsoleAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<ConsoleRun[]>(() =>
    [...initialToolCalls.map(asToolRun), ...initialAgentRuns.map(asAgentRun)].sort((left, right) => {
      return new Date(right.completedAt ?? right.startedAt).getTime() - new Date(left.completedAt ?? left.startedAt).getTime();
    }),
  );
  const [pendingPermissions, setPendingPermissions] = useState<PermissionDecisionRecord[]>(() =>
    initialPermissions.filter((permission) => permission.status === 'pending'),
  );
  const [eventsByRunId, setEventsByRunId] = useState<Record<string, RuntimeEventRecord[]>>(() => buildInitialEventMap(initialEvents));
  const streamRefs = useRef<Map<string, EventSource>>(new Map());

  useEffect(() => {
    const streams = streamRefs.current;
    return () => {
      for (const stream of streams.values()) {
        stream.close();
      }
      streams.clear();
    };
  }, []);

  async function refreshRun(runType: ConsoleRun['runType'], runId: string) {
    const endpoint = runType === 'tool' ? '/api/internal/codex/tool-calls' : '/api/internal/codex/agent-runs';
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) return;
    const payload = (await response.json()) as { toolCalls?: ToolCallRecord[]; agentRuns?: AgentRunRecord[] };
    const nextRun =
      runType === 'tool'
        ? payload.toolCalls?.find((item) => item.id === runId)
        : payload.agentRuns?.find((item) => item.id === runId);

    if (!nextRun) return;

    setRuns((current) => mergeRuntimeRun(current, runType === 'tool' ? asToolRun(nextRun as ToolCallRecord) : asAgentRun(nextRun as AgentRunRecord)));
  }

  function subscribeToRun(runType: ConsoleRun['runType'], runId: string) {
    const key = `${runType}:${runId}`;
    if (streamRefs.current.has(key)) return;

    const stream = new EventSource(`/api/internal/codex/stream/${runType}/${runId}`);
    streamRefs.current.set(key, stream);

    const handleEvent = (event: MessageEvent<string>) => {
      const runtimeEvent = JSON.parse(event.data) as RuntimeEventRecord;
      setEventsByRunId((current) => ({
        ...current,
        [runId]: appendRuntimeEvent(current[runId] ?? [], runtimeEvent),
      }));

      if (runtimeEvent.kind === 'completed' || runtimeEvent.kind === 'failed') {
        void refreshRun(runType, runId);
        stream.close();
        streamRefs.current.delete(key);
      }
    };

    for (const kind of runtimeEventKinds) {
      stream.addEventListener(kind, handleEvent as EventListener);
    }

    stream.onerror = () => {
      stream.close();
      streamRefs.current.delete(key);
      void refreshRun(runType, runId);
    };
  }

  async function submitAction(action: RuntimeConsoleAction) {
    if (action === 'shell.exec' && !shellCommand.trim()) {
      setError('shell.exec 需要 command。');
      return;
    }

    setSubmittingAction(action);
    setError(null);

    try {
      const request = buildRuntimeConsoleRequest({
        action,
        projectSpaceId,
        command: shellCommand.trim(),
        cwd: shellCwd.trim(),
      });
      const response = await fetch(request.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request.payload),
      });

      if (!response.ok) {
        throw new Error(`runtime_console_${response.status}`);
      }

      const payload = (await response.json()) as { toolCall?: ToolCallRecord; agentRun?: AgentRunRecord };
      const nextRun = request.runType === 'tool' ? asToolRun(payload.toolCall as ToolCallRecord) : asAgentRun(payload.agentRun as AgentRunRecord);

      setRuns((current) => mergeRuntimeRun(current, nextRun));

      if (request.runType === 'tool' && payload.toolCall?.permission.status === 'pending') {
        setPendingPermissions((current) => mergeRuntimeRun(current, payload.toolCall?.permission as PermissionDecisionRecord));
      } else {
        subscribeToRun(request.runType, nextRun.id);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'runtime_console_failed');
    } finally {
      setSubmittingAction(null);
    }
  }

  async function resolvePermission(permissionId: string, decision: 'approved' | 'rejected') {
    setError(null);

    try {
      const response = await fetch(`/api/internal/codex/permissions/${permissionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decision }),
      });

      if (!response.ok) {
        throw new Error(`permission_resolution_${response.status}`);
      }

      const payload = (await response.json()) as { toolCall: ToolCallRecord };
      const nextRun = asToolRun(payload.toolCall);

      setRuns((current) => mergeRuntimeRun(current, nextRun));
      setPendingPermissions((current) => current.filter((permission) => permission.id !== permissionId));
      subscribeToRun('tool', nextRun.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'permission_resolution_failed');
    }
  }

  return (
    <section className="rounded-[1.9rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">runtime / approval / stream</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">{title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{description}</p>
        </div>

        {selectableSpaces.length > 1 ? (
          <label className="text-sm text-slate-300">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">target space</span>
            <select
              value={projectSpaceId}
              onChange={(event) => setProjectSpaceId(event.target.value)}
              className="min-w-[13rem] rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
            >
              {selectableSpaces.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { action: 'project.scan' as const, label: 'Project Scan' },
          { action: 'project.space.read' as const, label: 'Read Space' },
          { action: 'memory.read' as const, label: 'Read Memory' },
          { action: 'workspace_overview' as const, label: 'Workspace Overview' },
        ].map((item) => (
          <button
            key={item.action}
            type="button"
            onClick={() => void submitAction(item.action)}
            disabled={Boolean(submittingAction)}
            className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-left text-sm text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">quick action</span>
            <span className="mt-2 block font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem_10rem]">
          <label className="text-sm text-slate-300">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">shell command</span>
            <input
              value={shellCommand}
              onChange={(event) => setShellCommand(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
              placeholder="pwd"
            />
          </label>
          <label className="text-sm text-slate-300">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">cwd</span>
            <input
              value={shellCwd}
              onChange={(event) => setShellCwd(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
              placeholder="optional"
            />
          </label>
          <button
            type="button"
            onClick={() => void submitAction('shell.exec')}
            disabled={Boolean(submittingAction)}
            className="self-end rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-medium text-amber-50 transition hover:border-amber-200/40 hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Run shell.exec
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
      </div>

      {pendingPermissions.length ? (
        <div className="mt-6 grid gap-3 xl:grid-cols-2">
          {pendingPermissions.map((permission) => (
            <div key={permission.id} className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-50">pending permission</p>
              <p className="mt-3 text-sm font-medium text-white">{permission.action}</p>
              <p className="mt-2 text-sm leading-6 text-amber-50/90">{permission.reason}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-amber-100/75">{permission.riskLevel} risk</p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => void resolvePermission(permission.id, 'approved')}
                  className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-emerald-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void resolvePermission(permission.id, 'rejected')}
                  className="rounded-full border border-rose-300/30 bg-rose-300/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-rose-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {runs.slice(0, 8).map((run) => {
          const events = eventsByRunId[run.id] ?? [];
          return (
            <div key={`${run.runType}-${run.id}`} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{run.runType}</p>
                  <p className="mt-2 text-sm font-medium text-white">{run.title}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{run.projectSpaceId ?? 'platform'} · {run.status}</p>
                </div>
                {run.permission ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                    {run.permission.status}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">{outputPreview(run)}</p>

              <div className="mt-4 space-y-2">
                {events.length ? (
                  events.slice(-5).map((event) => (
                    <div key={event.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{event.kind}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-200">{event.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400">
                    等待第一条 runtime 事件。
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
