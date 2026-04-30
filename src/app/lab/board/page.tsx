import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { InternalLabNav } from "@/components/internal-lab-nav";
import { buildAssessmentContentWorkbench } from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
import { buildDraftDetailHref } from "@/lib/draft-routing";
import { goldenAuditResults, goldenAuditSummary } from "@/lib/golden-audit";
import { labRouteMeta } from "@/lib/lab-route-meta";
import { projectRoadmapBoard, type ProjectBoardStatus } from "@/lib/project-roadmap";
import { listDraftSessionsForRoute, listDraftWorkflowSummaries, listSessionRuntimeSummaries, syncWorkbenchDraftSessions } from "@/lib/store";
import type { DraftReviewPriority } from "@/lib/types";

function rankPriority(priority: DraftReviewPriority) {
  if (priority === "critical") return 3;
  if (priority === "high") return 2;
  return 1;
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function statusTone(status: ProjectBoardStatus) {
  if (status === "done") return "bg-emerald-400/10 text-emerald-200 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]";
  if (status === "in_progress") return "bg-sky-400/10 text-sky-200 shadow-[0_0_0_1px_rgba(125,211,252,0.18)]";
  if (status === "review_ready") return "bg-amber-300/10 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.16)]";
  return "bg-white/[0.04] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]";
}

function priorityTone(priority: DraftReviewPriority) {
  if (priority === "critical") return "bg-rose-400/10 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.2)]";
  if (priority === "high") return "bg-amber-300/10 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.16)]";
  return "bg-sky-300/10 text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.16)]";
}

function deliveryTone(status: "freeze_candidate" | "apply_queue" | "archived") {
  if (status === "freeze_candidate") return "bg-fuchsia-400/10 text-fuchsia-100 shadow-[0_0_0_1px_rgba(232,121,249,0.18)]";
  if (status === "apply_queue") return "bg-cyan-300/10 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.18)]";
  return "bg-emerald-400/10 text-emerald-100 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]";
}

function activityTone(kind: "draft" | "runtime" | "golden" | "roadmap") {
  if (kind === "draft") return "bg-sky-300/10 text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.16)]";
  if (kind === "runtime") return "bg-violet-300/10 text-violet-100 shadow-[0_0_0_1px_rgba(196,181,253,0.18)]";
  if (kind === "golden") return "bg-amber-300/10 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.16)]";
  return "bg-emerald-400/10 text-emerald-100 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]";
}

function Capsule({ children, className = "bg-white/[0.04] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" }: { children: ReactNode; className?: string }) {
  return <span className={`rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.18em] ${className}`}>{children}</span>;
}

export default async function LabBoardPage() {
  const contentWorkbench = buildAssessmentContentWorkbench();
  const analysisWorkbench = buildAnalysisWorkbenchCatalog(contentWorkbench.draftBlueprints);
  await syncWorkbenchDraftSessions(contentWorkbench.draftBlueprints, analysisWorkbench.impactMatrix);

  const draftWorkflows = await listDraftWorkflowSummaries();
  const runtimeSessions = await listSessionRuntimeSummaries(8);
  const routeBoards = await Promise.all(
    labRouteMeta
      .filter((item) => item.href !== "/lab/board" && item.href !== "/lab/delivery")
      .map(async (item) => ({
        meta: item,
        items: await listDraftSessionsForRoute(item.href),
      })),
  );

  const prioritizedDrafts = draftWorkflows
    .slice()
    .sort((left, right) => {
      const priorityDelta = rankPriority(right.workflow.reviewPriority) - rankPriority(left.workflow.reviewPriority);
      if (priorityDelta !== 0) return priorityDelta;
      return right.workflow.blockingImpactCount - left.workflow.blockingImpactCount;
    })
    .slice(0, 6);

  const routeCoverage = routeBoards.map(({ meta, items }) => ({
    ...meta,
    linkedDrafts: items.length,
    reviewRequired: items.filter((item) => item.workflow?.state === "review_required").length,
    critical: items.filter((item) => item.workflow?.reviewPriority === "critical").length,
    nextAction: items[0]?.workflow?.nextAction ?? "当前没有草稿依赖该页。",
  }));

  const currentStages = runtimeSessions
    .map((item) => item.currentStageKey ?? item.latestJobStatus ?? item.lifecycleStatus)
    .filter(Boolean)
    .slice(0, 4);

  const deliveryCounts = {
    freezeCandidate: draftWorkflows.filter((item) => item.workflow.deliveryStatus === "freeze_candidate").length,
    applyQueue: draftWorkflows.filter((item) => item.workflow.deliveryStatus === "apply_queue").length,
    archived: draftWorkflows.filter((item) => item.workflow.deliveryStatus === "archived").length,
  };

  const deliveryQueues = {
    freezeCandidate: draftWorkflows
      .filter((item) => item.workflow.deliveryStatus === "freeze_candidate")
      .sort((left, right) => new Date(right.workflow.lastCheckedAt).getTime() - new Date(left.workflow.lastCheckedAt).getTime())
      .slice(0, 4),
    applyQueue: draftWorkflows
      .filter((item) => item.workflow.deliveryStatus === "apply_queue")
      .sort((left, right) => new Date(right.workflow.lastCheckedAt).getTime() - new Date(left.workflow.lastCheckedAt).getTime())
      .slice(0, 4),
    archived: draftWorkflows
      .filter((item) => item.workflow.deliveryStatus === "archived")
      .sort((left, right) => new Date(right.workflow.lastCheckedAt).getTime() - new Date(left.workflow.lastCheckedAt).getTime())
      .slice(0, 4),
  };

  const boardSnapshotAt = `${projectRoadmapBoard.snapshotDate}T12:00:00.000Z`;
  const recentActivity = [
    ...draftWorkflows.map((item) => ({
      key: `draft-${item.draft.draftId}`,
      kind: "draft" as const,
      title: item.draft.title,
      detail: `${item.workflow.deliveryStatus} · ${item.workflow.nextAction}`,
      at: item.workflow.lastCheckedAt,
    })),
    ...runtimeSessions.map((item) => ({
      key: `runtime-${item.sessionId}`,
      kind: "runtime" as const,
      title: item.sessionId,
      detail: `${item.lifecycleStatus} · ${item.currentStageKey ?? item.latestJobStatus ?? "idle"}`,
      at: item.updatedAt,
    })),
    ...goldenAuditResults.slice(0, 4).map((item) => ({
      key: `golden-${item.sampleId}`,
      kind: "golden" as const,
      title: item.title,
      detail: `${item.status} · ${item.failedChecks} failed checks`,
      at: boardSnapshotAt,
    })),
    {
      key: "roadmap-snapshot",
      kind: "roadmap" as const,
      title: "project roadmap",
      detail: projectRoadmapBoard.currentObjective,
      at: boardSnapshotAt,
    },
  ]
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
    .slice(0, 10);

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(189,218,255,0.12),transparent_24%),radial-gradient(circle_at_86%_20%,rgba(109,80,131,0.11),transparent_26%),radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-7xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(123,153,183,0.16),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.46em] text-stone-300/65">internal / project board</p>
              <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">本源研发看板</h1>
              <p className="mt-5 max-w-4xl text-base leading-8 text-stone-300/82 md:text-lg">
                这是独立于产品页面的内部项目总控台，把 draft workflow、route 验证节点、runtime、golden 与阶段推进汇总到一张板上，方便你随时看清我们现在做到哪、下一步该做什么。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/lab/drafts" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                草稿会话库
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/delivery" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                交付调度台
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/release-chain" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                发布链路台
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/kernel-admin" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                内核管理台
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </div>
          </div>
          <InternalLabNav current="/lab/board" className="mt-6" />
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-4">
          <ReportCard eyebrow="live / drafts" title="Draft Workflow">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>all drafts：{draftWorkflows.length}</p>
              <p>critical：{draftWorkflows.filter((item) => item.workflow.reviewPriority === "critical").length}</p>
              <p>review required：{draftWorkflows.filter((item) => item.workflow.state === "review_required").length}</p>
              <p>ready to apply：{draftWorkflows.filter((item) => item.workflow.state === "ready_to_apply").length}</p>
              <p>freeze candidates：{deliveryCounts.freezeCandidate}</p>
              <p>apply queue：{deliveryCounts.applyQueue}</p>
              <p>archived：{deliveryCounts.archived}</p>
              <p>avg readiness：{draftWorkflows.length === 0 ? 0 : Math.round(draftWorkflows.reduce((sum, item) => sum + item.workflow.readinessScore, 0) / draftWorkflows.length)}%</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="live / runtime" title="Runtime Snapshot">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>sessions captured：{runtimeSessions.length}</p>
              <p>report ready：{runtimeSessions.filter((item) => item.reportReady).length}</p>
              <p>feature vector ready：{runtimeSessions.filter((item) => item.featureVectorReady).length}</p>
              <p>current stages：{currentStages.join(" · ") || "-"}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="live / golden" title="Golden Audit">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>pass：{goldenAuditSummary.passed}</p>
              <p>fail：{goldenAuditSummary.failed}</p>
              <p>needs attention：{goldenAuditSummary.failed}</p>
              <p>samples：{goldenAuditSummary.total}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="focus" title="当前推进">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>focus：{projectRoadmapBoard.currentFocus}</p>
              <p>objective：{projectRoadmapBoard.currentObjective}</p>
              <p>next：{projectRoadmapBoard.nextObjective}</p>
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.56fr_0.44fr]">
          <ReportCard eyebrow="queue / critical first" title="当前优先草稿队列">
            <div className="space-y-4">
              {prioritizedDrafts.map(({ draft, workflow, simulation }) => (
                <div key={draft.draftId} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{draft.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{draft.draftId}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-300/82">{draft.summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{workflow.state}</Capsule>
                      <Capsule className={priorityTone(workflow.reviewPriority)}>{workflow.reviewPriority}</Capsule>
                      <Capsule className={deliveryTone(workflow.deliveryStatus)}>{workflow.deliveryStatus}</Capsule>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>next：{workflow.nextAction}</p>
                    <p>blocking impacts：{workflow.blockingImpactCount}</p>
                    <p>routes：{draft.linkedRoutes.join(" · ") || "-"}</p>
                    <p>impact areas：{simulation?.impactAreas.map((item) => item.title).join(" · ") || "-"}</p>
                    <p>last checked：{formatTimestamp(workflow.lastCheckedAt)}</p>
                    <p>route completion：{workflow.routeProgress.filter((item) => item.state === "completed").length}/{workflow.routeProgress.length}</p>
                  </div>
                  <Link href={buildDraftDetailHref(draft.draftId)} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                    打开草稿详情
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                  </Link>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard eyebrow="validation / route coverage" title="验证节点覆盖">
            <div className="space-y-4">
              {routeCoverage.map((route) => (
                <div key={route.href} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{route.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{route.detail}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{route.linkedDrafts} drafts</Capsule>
                      <Capsule>{route.reviewRequired} review</Capsule>
                      <Capsule className={route.critical > 0 ? priorityTone("critical") : priorityTone("normal")}>{route.critical} critical</Capsule>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-stone-300/82">next：{route.nextAction}</p>
                  <Link href={route.href} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                    打开验证节点
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                  </Link>
                </div>
              ))}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.48fr_0.52fr]">
          <ReportCard eyebrow="delivery / queue" title="交付状态队列">
            <div className="space-y-4">
              {[
                {
                  title: "freeze candidate",
                  status: "freeze_candidate" as const,
                  count: deliveryCounts.freezeCandidate,
                  items: deliveryQueues.freezeCandidate,
                },
                {
                  title: "apply queue",
                  status: "apply_queue" as const,
                  count: deliveryCounts.applyQueue,
                  items: deliveryQueues.applyQueue,
                },
                {
                  title: "archived",
                  status: "archived" as const,
                  count: deliveryCounts.archived,
                  items: deliveryQueues.archived,
                },
              ].map((bucket) => (
                <div key={bucket.status} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{bucket.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{bucket.count} drafts</p>
                    </div>
                    <Capsule className={deliveryTone(bucket.status)}>{bucket.status}</Capsule>
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300/82">
                    {bucket.items.length === 0 ? (
                      <p className="text-stone-500">当前没有草稿落在这一层。</p>
                    ) : (
                      bucket.items.map(({ draft, workflow }) => (
                        <div key={`${bucket.status}-${draft.draftId}`} className="rounded-[18px] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-stone-100">{draft.title}</p>
                            <Capsule>{workflow.readinessScore}%</Capsule>
                          </div>
                          <p className="mt-2 text-stone-400">{draft.draftId}</p>
                          <p>{workflow.nextAction}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard eyebrow="activity / recent" title="最近变动流">
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.key} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{item.detail}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule className={activityTone(item.kind)}>{item.kind}</Capsule>
                      <Capsule>{formatTimestamp(item.at)}</Capsule>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-2">
          <ReportCard eyebrow="workflow / milestones" title="草稿阶段轨迹概览">
            <div className="space-y-4">
              {prioritizedDrafts.slice(0, 4).map(({ draft, workflow }) => (
                <div key={`${draft.draftId}-milestones`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{draft.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{draft.draftId}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{workflow.readinessScore}%</Capsule>
                      <Capsule className={priorityTone(workflow.reviewPriority)}>{workflow.reviewPriority}</Capsule>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {workflow.milestones.map((item) => (
                      <div key={item.key} className="rounded-[18px] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-stone-100">{item.title}</p>
                          <Capsule>{item.status}</Capsule>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard eyebrow="workflow / route review" title="Route Review Completion 概览">
            <div className="space-y-4">
              {routeBoards.slice(0, 6).map(({ meta, items }) => (
                <div key={`${meta.href}-progress`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{meta.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{meta.href}</p>
                    </div>
                    <Capsule>{items.length} drafts</Capsule>
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>completed routes：{items.reduce((sum, item) => sum + (item.workflow?.routeProgress.filter((entry) => entry.state === "completed").length ?? 0), 0)}</p>
                    <p>in progress：{items.reduce((sum, item) => sum + (item.workflow?.routeProgress.filter((entry) => entry.state === "in_progress").length ?? 0), 0)}</p>
                    <p>pending：{items.reduce((sum, item) => sum + (item.workflow?.routeProgress.filter((entry) => entry.state === "pending").length ?? 0), 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.58fr_0.42fr]">
          <ReportCard eyebrow="roadmap / lanes" title="研发主线">
            <div className="space-y-4">
              {projectRoadmapBoard.lanes.map((lane) => (
                <div key={lane.id} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{lane.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{lane.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{lane.progress}%</Capsule>
                      <Capsule className={statusTone(lane.status)}>{lane.status}</Capsule>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300/82">
                    {lane.steps.map((step) => (
                      <div key={step.id} className="rounded-[18px] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-stone-100">{step.title}</p>
                          <Capsule className={statusTone(step.status)}>{step.status}</Capsule>
                        </div>
                        <p className="mt-2 text-stone-400">purpose：{step.purpose}</p>
                        <p>action：{step.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>

          <div className="grid gap-6">
            <ReportCard eyebrow="framework" title="架构层进度">
              <div className="space-y-4">
                {projectRoadmapBoard.frameworkLayers.map((layer) => (
                  <div key={layer.id} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{layer.title}</p>
                      <div className="flex flex-wrap gap-2">
                        <Capsule>{layer.progress}%</Capsule>
                        <Capsule className={statusTone(layer.status)}>{layer.status}</Capsule>
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-stone-400">{layer.scope}</p>
                    <p className="mt-2 text-sm leading-7 text-stone-300/82">artifacts：{layer.artifacts.join(" · ")}</p>
                  </div>
                ))}
              </div>
            </ReportCard>

            <ReportCard eyebrow="delivery" title="工作区 / 校验项">
              <div className="space-y-4 text-sm leading-7 text-stone-300/82">
                <div>
                  <p className="text-stone-100">worktrees</p>
                  <div className="mt-3 space-y-3">
                    {projectRoadmapBoard.worktrees.map((tree) => (
                      <div key={tree.path} className="rounded-[18px] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                        <p>{tree.name} · {tree.role}</p>
                        <p className="text-stone-500">{tree.path}</p>
                        <p className="text-stone-500">branch：{tree.branch}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-stone-100">validation</p>
                  <div className="mt-3 space-y-2">
                    {projectRoadmapBoard.validation.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>
              </div>
            </ReportCard>
          </div>
        </section>
      </div>
    </main>
  );
}
