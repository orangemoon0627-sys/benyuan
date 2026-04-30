import Link from "next/link";

import { CodexRuntimeConsole } from "@/components/codex-runtime-console";
import type { CodexPlatformBootstrap, ProjectSpace } from "@/lib/codex-platform/types";

type CodexPlatformShellProps = {
  bootstrap: CodexPlatformBootstrap;
  focusSpaceId?: string;
  mode: "shadow" | "takeover";
};

function summarizeCount(label: string, count: number) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

function toneForHealth(health: ProjectSpace["status"] | "healthy" | "watch" | "planned") {
  if (health === "healthy" || health === "active" || health === "live" || health === "platform") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }
  if (health === "watch") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-50";
  }
  return "border-white/15 bg-white/5 text-slate-200";
}

function toneForCompanion(mode: CodexPlatformBootstrap["companion"]["mode"]) {
  return mode === "remote"
    ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-50"
    : "border-amber-300/30 bg-amber-300/10 text-amber-50";
}

function formatStatusLabel(value: string) {
  return value.replace(/_/g, " ");
}

function renderRecordList(items: string[]) {
  if (!items.length) {
    return <p className="text-sm text-slate-400">还没有记录，先从 shadow rollout 的第一条 session 开始。</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-slate-200">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function CodexPlatformShell({ bootstrap, focusSpaceId = "codex", mode }: CodexPlatformShellProps) {
  const focusSpace = bootstrap.projectSpaces.find((space) => space.id === focusSpaceId) ?? bootstrap.projectSpaces[0];
  const focusManifest = bootstrap.projectManifests.find((manifest) => manifest.spaceId === focusSpace.id) ?? null;
  const pendingPermissions = bootstrap.permissions.filter((permission) => permission.status === "pending");
  const sessionLines = bootstrap.sessions
    .slice(0, 4)
    .map((session) => `${session.title} · ${session.projectSpaceId} · ${formatStatusLabel(session.status)}`);
  const toolLines = bootstrap.toolCalls
    .slice(0, 4)
    .map((toolCall) => `${toolCall.toolName} · ${formatStatusLabel(toolCall.status)} · ${toolCall.permission.riskLevel}`);
  const agentLines = bootstrap.agentRuns
    .slice(0, 4)
    .map((agentRun) => `${agentRun.agentType} · ${formatStatusLabel(agentRun.status)} · ${agentRun.projectSpaceId ?? "platform"}`);
  const planLines = bootstrap.planRuns
    .slice(0, 4)
    .map((planRun) => `${planRun.objective} · ${formatStatusLabel(planRun.status)} · ${planRun.projectSpaceId}`);
  const eventLines = bootstrap.runtimeEvents
    .slice(-6)
    .reverse()
    .map((event) => `${event.runType} · ${event.kind} · ${event.message}`);

  return (
    <main className="min-h-screen overflow-hidden bg-[#07111d] text-slate-100">
      <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.2),transparent_38%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_34%),linear-gradient(180deg,#091524_0%,#07111d_72%,#060c13_100%)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-cyan-50">
                  Codex Control Plane
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${toneForCompanion(bootstrap.companion.mode)}`}>
                  companion {bootstrap.companion.mode}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                  {mode === "takeover" ? "root takeover" : "shadow entry"}
                </span>
              </div>
              <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                把 Codex 升级成 Web 主控台 + 本地 companion 的平台内核，而不是继续堆在本源专用壳上。
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                一期先吸收 Claude Code 风格的 session、agent、tool、permission、memory、plugin 与 MCP 能力，
                再用兼容壳把本源、TradeWise、胚胎纳入统一的 project spaces。
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[26rem] xl:grid-cols-1">
              <Link
                href="/codex"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/12"
              >
                打开稳定影子入口 /codex
              </Link>
              <Link
                href={bootstrap.config.legacyHomeHref}
                className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-slate-200 transition hover:border-amber-300/40 hover:bg-amber-300/10"
              >
                回到旧入口 {bootstrap.config.legacyHomeHref}
              </Link>
              <Link
                href="/collect"
                className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-300/40 hover:bg-emerald-300/10"
              >
                继续本源主链路 /collect
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">root experience</p>
              <p className="mt-3 text-2xl font-semibold text-white">{bootstrap.homeExperience}</p>
              <p className="mt-2 text-sm text-slate-300">
                当前 {bootstrap.homeExperience === "codex" ? "根入口已切到 Codex 外壳" : "仍保持 legacy 首页"}。
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">companion</p>
              <p className="mt-3 text-2xl font-semibold text-white">{bootstrap.companion.bridgeHealth}</p>
              <p className="mt-2 text-sm text-slate-300">{bootstrap.companion.summary}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">skills & memory</p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {bootstrap.skills.filter((skill) => skill.status === "loaded").length} / {bootstrap.memories.filter((memory) => memory.status === "loaded").length}
              </p>
              <p className="mt-2 text-sm text-slate-300">全局 skills 与 profile / active / project memory 已接进平台视图。</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">plugin / mcp</p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {bootstrap.plugins.length} / {bootstrap.mcpConnections.length}
              </p>
              <p className="mt-2 text-sm text-slate-300">插件和 MCP 连接不再散落在本地配置里，而是进入统一平台观测面板。</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_minmax(0,0.95fr)]">
          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">project spaces</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">统一平台里的多项目工作区</h2>
              </div>
              <p className="max-w-sm text-right text-sm text-slate-300">旧本源主链路、TradeWise handoff、未来胚胎项目都先通过兼容壳挂到统一导航里。</p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {bootstrap.projectSpaces.map((space) => {
                const active = space.id === focusSpace.id;
                return (
                  <Link
                    key={space.id}
                    href={space.primaryHref}
                    className={`rounded-[1.6rem] border p-5 transition ${
                      active
                        ? "border-cyan-300/45 bg-cyan-300/10 shadow-[0_18px_36px_rgba(34,211,238,0.1)]"
                        : "border-white/10 bg-black/15 hover:border-white/20 hover:bg-white/8"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{space.shortTitle}</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">{space.title}</h3>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${toneForHealth(space.summary.health)}`}>
                        {space.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{space.tagline}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200">
                        {summarizeCount("session", space.summary.sessionCount)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200">
                        {summarizeCount("draft", space.summary.draftCount)}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-slate-400">{space.summary.signal}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">focus workspace</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">{focusSpace.title}</h2>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${toneForHealth(focusSpace.summary.health)}`}>
                  {focusSpace.summary.health}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{focusSpace.description}</p>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">capabilities</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {focusSpace.capabilities.map((capability) => (
                    <span key={capability} className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-xs text-slate-200">
                      {capability}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">surfaces</p>
                <div className="mt-3 grid gap-3">
                  {focusSpace.surfaces.map((surface) => (
                    <Link
                      key={`${surface.kind}-${surface.href}`}
                      href={surface.href}
                      className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                    >
                      <span className="font-medium text-white">{surface.label}</span>
                      <span className="ml-2 text-slate-400">· {surface.href}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {focusManifest ? (
                <>
                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">workspace narrative</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{focusManifest.narrative}</p>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">workbenches</p>
                    <div className="mt-3 grid gap-3">
                      {focusManifest.workbenches.map((workbench) => (
                        <Link
                          key={workbench.id}
                          href={workbench.href}
                          className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-white">{workbench.title}</span>
                            <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                              {workbench.kind}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-400">{workbench.detail}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{workbench.capability}</p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">platform vs project boundaries</p>
                    <div className="mt-3 space-y-3">
                      {focusManifest.boundaries.map((boundary) => (
                        <div key={boundary.id} className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-white">{boundary.title}</span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${toneForHealth(boundary.owner === "platform" ? "healthy" : "watch")}`}>
                              {boundary.owner}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-400">{boundary.detail}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{boundary.references.join(" · ")}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">next milestones</p>
                    <div className="mt-3 space-y-2">
                      {focusManifest.nextMilestones.map((milestone) => (
                        <div key={milestone} className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-slate-300">
                          {milestone}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">memory / skills / runtime</p>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-white">Memories</h3>
                  <div className="mt-2 space-y-2">
                    {bootstrap.memories.map((memory) => (
                      <div key={memory.id} className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-white">{memory.title}</span>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${toneForHealth(memory.status === "loaded" ? "healthy" : "watch")}`}>
                            {memory.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-400">{memory.preview}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <h3 className="text-sm font-medium text-white">Skills</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {bootstrap.skills.filter((skill) => skill.status === "loaded").length} loaded / {bootstrap.skills.length} tracked
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <h3 className="text-sm font-medium text-white">Companion URL</h3>
                    <p className="mt-2 text-sm text-slate-400">{bootstrap.companion.baseUrl}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <h3 className="text-sm font-medium text-white">Plugins</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {bootstrap.plugins.length ? (
                        bootstrap.plugins.map((plugin) => (
                          <span key={plugin.id} className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200">
                            {plugin.id}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">No plugin bindings detected.</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <h3 className="text-sm font-medium text-white">MCP</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {bootstrap.mcpConnections.length ? (
                        bootstrap.mcpConnections.map((connection) => (
                          <span key={connection.id} className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200">
                            {connection.id}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">No MCP servers detected.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <h3 className="text-sm font-medium text-white">Pending permissions</h3>
                    <div className="mt-3 space-y-2">
                      {pendingPermissions.length ? (
                        pendingPermissions.slice(0, 4).map((permission) => (
                          <div key={permission.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                            {permission.action} · {permission.riskLevel}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">当前没有待审批请求。</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <h3 className="text-sm font-medium text-white">Runtime stream</h3>
                    <div className="mt-3 space-y-2">
                      {eventLines.length ? (
                        eventLines.map((line) => (
                          <div key={line} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                            {line}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">等待第一条流式事件。</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        <CodexRuntimeConsole
          defaultProjectSpaceId={focusSpace.id}
          availableProjectSpaceIds={bootstrap.projectSpaces.map((space) => space.id)}
          initialToolCalls={bootstrap.toolCalls}
          initialAgentRuns={bootstrap.agentRuns}
          initialPermissions={bootstrap.permissions}
          initialEvents={bootstrap.runtimeEvents}
          title="Codex Runtime Console"
          description="在 `/codex` 里直接发起 project.scan、project.space.read、memory.read、workspace_overview 和 shell.exec，并消费审批卡与流式输出。"
        />

        <section className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">sessions</p>
            <h2 className="mt-2 text-xl font-semibold text-white">会话恢复与迁移检查点</h2>
            <div className="mt-4">{renderRecordList(sessionLines)}</div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">tools</p>
            <h2 className="mt-2 text-xl font-semibold text-white">工具流与权限闸门</h2>
            <div className="mt-4">{renderRecordList(toolLines)}</div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">agents</p>
            <h2 className="mt-2 text-xl font-semibold text-white">agent / migration guard</h2>
            <div className="mt-4">{renderRecordList(agentLines)}</div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">plans</p>
            <h2 className="mt-2 text-xl font-semibold text-white">阶段计划与回退节奏</h2>
            <div className="mt-4">{renderRecordList(planLines)}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
