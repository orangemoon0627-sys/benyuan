import Link from 'next/link';

import { CodexRuntimeConsole } from '@/components/codex-runtime-console';
import { WorkspaceSectionView } from '@/components/workspace-section-view';
import type {
  AgentRunRecord,
  PermissionDecisionRecord,
  ProjectSpace,
  ProjectSpaceManifest,
  RuntimeEventRecord,
  ToolCallRecord,
  WorkspaceSectionId,
} from '@/lib/codex-platform/types';

type ProjectSpaceWorkspaceProps = {
  projectSpace: ProjectSpace;
  manifest: ProjectSpaceManifest;
  sectionId: WorkspaceSectionId;
  runtime: {
    toolCalls: ToolCallRecord[];
    agentRuns: AgentRunRecord[];
    permissions: PermissionDecisionRecord[];
    events: RuntimeEventRecord[];
  };
};

export function ProjectSpaceWorkspace({
  projectSpace,
  manifest,
  sectionId,
  runtime,
}: ProjectSpaceWorkspaceProps) {
  const activeWorkbench =
    manifest.workbenches.find((workbench) => workbench.sectionId === sectionId) ??
    manifest.workbenches.find((workbench) => workbench.sectionId === manifest.defaultSection) ??
    manifest.workbenches[0];

  return (
    <main className="min-h-screen bg-[#07111d] text-slate-100">
      <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_30%),linear-gradient(180deg,#091524_0%,#07111d_72%,#060c13_100%)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-cyan-50">
                  Project Space
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  {projectSpace.status}
                </span>
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">{projectSpace.title}</h1>
              <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">{projectSpace.description}</p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">{manifest.narrative}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[28rem] xl:grid-cols-1">
              <Link
                href={projectSpace.primaryHref}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/12"
              >
                打开工作区总览 {projectSpace.primaryHref}
              </Link>
              {activeWorkbench?.compatibilityHref ? (
                <Link
                  href={activeWorkbench.compatibilityHref}
                  className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-slate-200 transition hover:border-amber-300/40 hover:bg-amber-300/10"
                >
                  打开兼容入口 {activeWorkbench.compatibilityHref}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {manifest.workbenches.map((workbench) => {
              const active = workbench.sectionId === sectionId;
              return (
                <Link
                  key={workbench.id}
                  href={workbench.href}
                  className={`rounded-2xl border px-4 py-4 text-sm transition ${
                    active
                      ? 'border-cyan-300/35 bg-cyan-300/10 text-white'
                      : 'border-white/10 bg-black/15 text-slate-200 hover:border-white/20 hover:bg-white/8'
                  }`}
                >
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-500">{workbench.sectionId}</span>
                  <span className="mt-2 block font-medium">{workbench.title}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.75fr)]">
          <WorkspaceSectionView spaceId={projectSpace.id} sectionId={sectionId} />

          <div className="space-y-6">
            <CodexRuntimeConsole
              defaultProjectSpaceId={projectSpace.id}
              availableProjectSpaceIds={[projectSpace.id]}
              initialToolCalls={runtime.toolCalls}
              initialAgentRuns={runtime.agentRuns}
              initialPermissions={runtime.permissions}
              initialEvents={runtime.events}
              title={`${projectSpace.shortTitle} Runtime Console`}
              description="直接从当前项目空间发起 tool / agent run，并在同一页面里处理审批与流式输出。"
            />

            <section className="rounded-[1.9rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">project boundaries</p>
              <div className="mt-4 space-y-3">
                {manifest.boundaries.map((boundary) => (
                  <div key={boundary.id} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{boundary.title}</p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                        {boundary.owner}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{boundary.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
