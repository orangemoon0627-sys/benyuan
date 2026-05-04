import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { InternalLabNav } from "@/components/internal-lab-nav";
import { buildAssessmentContentWorkbench } from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
import { buildDraftDetailHref } from "@/lib/draft-routing";
import { getDraftDeliverySnapshot, syncWorkbenchDraftSessions } from "@/lib/store";
import type { DraftDeliveryStatus, DraftReviewPriority } from "@/lib/types";

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

function Capsule({ children, className = "bg-white/[0.04] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" }: { children: ReactNode; className?: string }) {
  return <span className={`rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.18em] ${className}`}>{children}</span>;
}

function priorityTone(priority: DraftReviewPriority) {
  if (priority === "critical") return "bg-rose-400/10 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.2)]";
  if (priority === "high") return "bg-amber-300/10 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.16)]";
  return "bg-sky-300/10 text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.16)]";
}

function deliveryTone(status: DraftDeliveryStatus) {
  if (status === "freeze_candidate") return "bg-fuchsia-400/10 text-fuchsia-100 shadow-[0_0_0_1px_rgba(232,121,249,0.18)]";
  if (status === "apply_queue") return "bg-cyan-300/10 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.18)]";
  return "bg-emerald-400/10 text-emerald-100 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]";
}

function checklistTone(status: "done" | "review" | "pending") {
  if (status === "done") return "bg-emerald-400/10 text-emerald-200 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]";
  if (status === "review") return "bg-amber-300/10 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.16)]";
  return "bg-rose-400/10 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.18)]";
}

function releaseTone(status: "done" | "review" | "pending" | "skip") {
  if (status === "done") return "bg-emerald-400/10 text-emerald-200 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]";
  if (status === "review") return "bg-amber-300/10 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.16)]";
  if (status === "skip") return "bg-white/[0.04] text-stone-400 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]";
  return "bg-rose-400/10 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.18)]";
}

export default async function LabDeliveryPage() {
  const contentWorkbench = buildAssessmentContentWorkbench();
  const analysisWorkbench = buildAnalysisWorkbenchCatalog(contentWorkbench.draftBlueprints);
  await syncWorkbenchDraftSessions(contentWorkbench.draftBlueprints, analysisWorkbench.impactMatrix);

  const snapshot = await getDraftDeliverySnapshot();
  const deliveryBuckets = [
    {
      title: "freeze candidate",
      detail: "仍处于冻结前检查层，优先处理阻塞与跨路由缺口。",
      status: "freeze_candidate" as const,
      items: snapshot.buckets.freezeCandidate,
    },
    {
      title: "apply queue",
      detail: "核心 review 基本完成，可按顺序进入 apply 队列。",
      status: "apply_queue" as const,
      items: snapshot.buckets.applyQueue,
    },
    {
      title: "archived",
      detail: "交付完成并归档，保留可回溯记录与只读参照。",
      status: "archived" as const,
      items: snapshot.buckets.archived,
    },
  ];

  const actionableItems = [...snapshot.buckets.freezeCandidate, ...snapshot.buckets.applyQueue];

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(189,218,255,0.12),transparent_24%),radial-gradient(circle_at_84%_20%,rgba(109,80,131,0.11),transparent_26%),radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-7xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(123,153,183,0.16),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.46em] text-stone-300/65">internal / delivery cockpit</p>
              <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">交付调度台</h1>
              <p className="mt-5 max-w-4xl text-base leading-8 text-stone-300/82 md:text-lg">
                这页现在不只是看状态，而是把 freeze checklist、apply checklist 和 release chain 摆到一起。你可以一眼看到每个 draft 还差哪一步、应该先在哪条路由补验证、以及它在整条 release 链上的当前落点。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/lab/drafts" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                草稿库
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/schema" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                schema 面板
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/release-chain" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                发布链路台
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/api/internal/delivery" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                delivery api
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </div>
          </div>
          <InternalLabNav current="/lab/delivery" className="mt-6" />
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-4">
          <ReportCard eyebrow="delivery" title="总体摘要">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>all drafts：{snapshot.summary.totalDrafts}</p>
              <p>critical drafts：{snapshot.summary.criticalDrafts}</p>
              <p>avg readiness：{snapshot.summary.averageReadiness}%</p>
              <p>generated：{formatTimestamp(snapshot.generatedAt)}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="delivery" title="冻结层">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>freeze candidates：{snapshot.summary.freezeCandidates}</p>
              <p>freeze outstanding：{snapshot.summary.freezeChecklistOutstanding}</p>
              <p>top route：{snapshot.routeLoad[0]?.title ?? "-"}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="delivery" title="应用层">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>apply queue：{snapshot.summary.applyQueue}</p>
              <p>apply outstanding：{snapshot.summary.applyChecklistOutstanding}</p>
              <p>top apply action：{snapshot.nextActions.find((item) => item.applyQueueCount > 0)?.action ?? "-"}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="delivery" title="归档层">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>archived：{snapshot.summary.archived}</p>
              <p>latest archived：{snapshot.buckets.archived[0]?.draft.title ?? "-"}</p>
              <p>traceability kept：yes</p>
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-3">
          {deliveryBuckets.map((bucket) => (
            <ReportCard key={bucket.status} eyebrow="queue" title={bucket.title}>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm leading-7 text-stone-300/82">{bucket.detail}</p>
                  <Capsule className={deliveryTone(bucket.status)}>{bucket.status}</Capsule>
                </div>
                {bucket.items.length === 0 ? (
                  <p className="text-sm leading-7 text-stone-500">当前没有草稿落在这一层。</p>
                ) : (
                  bucket.items.map((item) => (
                    <div key={`${bucket.status}-${item.draft.draftId}`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.draft.title}</p>
                          <p className="mt-2 text-sm leading-7 text-stone-400">{item.draft.draftId}</p>
                          <p className="mt-2 text-sm leading-7 text-stone-300/82">{item.draft.summary}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Capsule className={priorityTone(item.workflow.reviewPriority)}>{item.workflow.reviewPriority}</Capsule>
                          <Capsule>{item.workflow.readinessScore}%</Capsule>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                        <p>next：{item.nextBestAction}</p>
                        <p>owner：{item.recommendedOwner} · support：{item.supportOwners.join(" · ") || "-"}</p>
                        <p>routes：{item.draft.linkedRoutes.join(" · ") || "-"}</p>
                        <p>blocking impacts：{item.workflow.blockingImpactCount}</p>
                        <p>impact areas：{item.simulation?.impactAreas.map((entry) => entry.title).join(" · ") || "-"}</p>
                        <p>last checked：{formatTimestamp(item.workflow.lastCheckedAt)}</p>
                      </div>
                      <div className="mt-4 grid gap-2 text-sm leading-7 text-stone-300/82">
                        {(bucket.status === "freeze_candidate" ? item.freezeChecklist : item.applyChecklist).slice(0, 2).map((check) => (
                          <div key={`${item.draft.draftId}-${check.key}`} className="rounded-[18px] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-stone-100">{check.title}</p>
                              <Capsule className={checklistTone(check.status)}>{check.status}</Capsule>
                            </div>
                            <p className="mt-2 text-stone-400">{check.detail}</p>
                          </div>
                        ))}
                      </div>
                      <Link href={buildDraftDetailHref(item.draft.draftId)} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                        打开草稿详情
                        <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </ReportCard>
          ))}
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.56fr_0.44fr]">
          <ReportCard eyebrow="checklist / freeze" title="Freeze Checklist 执行面">
            <div className="space-y-4">
              {actionableItems.map((item) => (
                <div key={`${item.draft.draftId}-freeze`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.draft.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{item.workflow.deliveryStatus}</p>
                    </div>
                    <Capsule>{item.freezeChecklist.filter((entry) => entry.status !== "done").length} open</Capsule>
                  </div>
                  <div className="mt-4 space-y-3">
                    {item.freezeChecklist.map((check) => (
                      <div key={`${item.draft.draftId}-${check.key}`} className="rounded-[18px] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm text-stone-100">{check.title}</p>
                          <Capsule className={checklistTone(check.status)}>{check.status}</Capsule>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{check.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard eyebrow="checklist / apply" title="Apply Checklist 执行面">
            <div className="space-y-4">
              {actionableItems.map((item) => (
                <div key={`${item.draft.draftId}-apply`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.draft.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{item.draft.targetFiles.join(" · ")}</p>
                    </div>
                    <Capsule>{item.applyChecklist.filter((entry) => entry.status !== "done").length} open</Capsule>
                  </div>
                  <div className="mt-4 space-y-3">
                    {item.applyChecklist.map((check) => (
                      <div key={`${item.draft.draftId}-${check.key}`} className="rounded-[18px] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm text-stone-100">{check.title}</p>
                          <Capsule className={checklistTone(check.status)}>{check.status}</Capsule>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{check.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.52fr_0.48fr]">
          <ReportCard eyebrow="release / chain" title="统一 Release Chain">
            <div className="space-y-4">
              {snapshot.releaseChain.map((item) => (
                <div key={`${item.draftId}-chain`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{item.draftId}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule className={deliveryTone(item.deliveryStatus)}>{item.deliveryStatus}</Capsule>
                      <Capsule>{item.recommendedOwner}</Capsule>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>next best：{item.nextBestAction}</p>
                    <p>route order：{item.recommendedRouteOrder.map((route) => route.title).join(" · ") || "-"}</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {item.chain.map((step) => (
                      <div key={`${item.draftId}-${step.key}`} className="rounded-[18px] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm text-stone-100">{step.layer}</p>
                          <Capsule className={releaseTone(step.status)}>{step.status}</Capsule>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{step.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>

          <div className="grid gap-6">
            <ReportCard eyebrow="delivery / route load" title="路由压力图">
              <div className="space-y-4">
                {snapshot.routeLoad.map((item) => (
                  <div key={item.route} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{item.route}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Capsule>{item.linkedDrafts} drafts</Capsule>
                        <Capsule>{item.averageReadiness}% ready</Capsule>
                        <Capsule className={item.criticalCount > 0 ? priorityTone("critical") : undefined}>{item.criticalCount} critical</Capsule>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                      <p>freeze：{item.freezeCandidateCount}</p>
                      <p>apply queue：{item.applyQueueCount}</p>
                      <p>archived：{item.archivedCount}</p>
                      <p>next actions：{item.nextActions.join(" · ") || "-"}</p>
                    </div>
                    <Link href={item.route} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                      打开路由
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                    </Link>
                  </div>
                ))}
              </div>
            </ReportCard>

            <ReportCard eyebrow="delivery / action stack" title="执行动作池">
              <div className="space-y-4">
                {snapshot.nextActions.map((item) => (
                  <div key={item.action} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="max-w-xl text-sm leading-7 text-stone-100">{item.action}</p>
                      <div className="flex flex-wrap gap-2">
                        <Capsule>{item.count} drafts</Capsule>
                        {item.criticalCount > 0 ? <Capsule className={priorityTone("critical")}>{item.criticalCount} critical</Capsule> : null}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                      <p>freeze candidates：{item.freezeCandidateCount}</p>
                      <p>apply queue：{item.applyQueueCount}</p>
                      <p>draft ids：{item.draftIds.join(" · ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ReportCard>
          </div>
        </section>
      </div>
    </main>
  );
}
