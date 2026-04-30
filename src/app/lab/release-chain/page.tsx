import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { InternalLabNav } from "@/components/internal-lab-nav";
import { ReportCard } from "@/components/report-card";
import { buildDraftDetailHref } from "@/lib/draft-routing";
import { getReleaseChainSnapshot } from "@/lib/release-chain";

type DeliveryStatus = "freeze_candidate" | "apply_queue" | "archived";
type ReviewPriority = "critical" | "high" | "normal";
type ChainStatus = "done" | "review" | "pending" | "skip";
type ChecklistStatus = "done" | "review" | "pending";

function Capsule({
  children,
  className = "bg-white/[0.04] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.18em] ${className}`}>{children}</span>;
}

function deliveryTone(status: DeliveryStatus) {
  if (status === "freeze_candidate") return "bg-fuchsia-400/10 text-fuchsia-100 shadow-[0_0_0_1px_rgba(232,121,249,0.18)]";
  if (status === "apply_queue") return "bg-cyan-300/10 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.18)]";
  return "bg-emerald-400/10 text-emerald-100 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]";
}

function priorityTone(priority: ReviewPriority) {
  if (priority === "critical") return "bg-rose-400/10 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.2)]";
  if (priority === "high") return "bg-amber-300/10 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.16)]";
  return "bg-sky-300/10 text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.16)]";
}

function chainTone(status: ChainStatus | ChecklistStatus) {
  if (status === "done") return "bg-emerald-400/10 text-emerald-200 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]";
  if (status === "review") return "bg-amber-300/10 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.16)]";
  if (status === "skip") return "bg-white/[0.04] text-stone-400 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]";
  return "bg-rose-400/10 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.18)]";
}

export default async function LabReleaseChainPage() {
  const snapshot = await getReleaseChainSnapshot();
  const topLanes = snapshot.unifiedLanes.slice(0, 6);

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(189,218,255,0.12),transparent_24%),radial-gradient(circle_at_84%_20%,rgba(109,80,131,0.11),transparent_26%),radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-7xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(123,153,183,0.16),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.46em] text-stone-300/65">internal / unified release chain</p>
              <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">发布链路台</h1>
              <p className="mt-5 max-w-4xl text-base leading-8 text-stone-300/82 md:text-lg">
                这页把 content、schema、native、analysis、delivery 串成一张统一发布图。现在不仅知道草稿在哪，还能看到 blocker、owner handoff、首个验证路由，以及进入 apply 之前最值钱的一步动作。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/lab/delivery" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                交付调度台
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/schema" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                题库结构面板
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/native-handoff" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                原生交接面板
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </div>
          </div>
          <InternalLabNav current="/lab/release-chain" className="mt-6" />
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-4">
          <ReportCard eyebrow="release / summary" title="统一链路摘要">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>actionable drafts：{snapshot.summary.actionableDrafts}</p>
              <p>critical drafts：{snapshot.summary.criticalDrafts}</p>
              <p>route lanes：{snapshot.summary.routeLanes}</p>
              <p>owner groups：{snapshot.summary.ownerGroups}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="content / analysis" title="链路输入面">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>content drafts：{snapshot.summary.contentDrafts}</p>
              <p>analysis drafts：{snapshot.summary.analysisDrafts}</p>
              <p>schema migrations：{snapshot.summary.schemaMigrations}</p>
              <p>next action pool：{snapshot.delivery.nextActions.length}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="roadmap / current" title="当前推进目标">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>focus：{snapshot.roadmap.currentFocus}</p>
              <p>objective：{snapshot.roadmap.currentObjective}</p>
              <p>next：{snapshot.roadmap.nextObjective}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="delivery / health" title="交付健康度">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>freeze：{snapshot.delivery.summary.freezeCandidates}</p>
              <p>apply：{snapshot.delivery.summary.applyQueue}</p>
              <p>archived：{snapshot.delivery.summary.archived}</p>
              <p>blockers：{snapshot.summary.totalBlockers}</p>
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.46fr_0.54fr]">
          <ReportCard eyebrow="release / owner load" title="Owner 调度面">
            <div className="space-y-4">
              {snapshot.ownerLoad.map((item) => (
                <div key={item.owner} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.owner}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">把 primary owner 和 support owner 拆开看，方便决定谁先接单、谁做联动配合。</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{item.primaryCount} primary</Capsule>
                      <Capsule>{item.supportCount} support</Capsule>
                      {item.criticalCount > 0 ? <Capsule className={priorityTone("critical")}>{item.criticalCount} critical</Capsule> : null}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>draft ids：{item.draftIds.join(" · ") || "-"}</p>
                    <p>next picks：{item.nextActions.slice(0, 2).join(" · ") || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard eyebrow="release / route lanes" title="优先路由顺序">
            <div className="space-y-4">
              {snapshot.routePriority.map((item) => (
                <div key={item.route} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{item.route}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{item.priorityMentions} mentions</Capsule>
                      <Capsule>{item.draftIds.length} drafts</Capsule>
                      {item.criticalMentions > 0 ? <Capsule className={priorityTone("critical")}>{item.criticalMentions} critical</Capsule> : null}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>owners：{item.owners.join(" · ") || "-"}</p>
                    <p>why：{item.reasons.slice(0, 2).join(" · ") || "-"}</p>
                  </div>
                  <Link href={item.route} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                    打开路由
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                  </Link>
                </div>
              ))}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
          <ReportCard eyebrow="release / handoff" title="Owner Handoff 队列">
            <div className="space-y-4">
              {snapshot.handoffSummary.map((item) => (
                <div key={`${item.draftId}-handoff`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{item.draftId}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{item.leadOwner}</Capsule>
                      <Capsule>{item.blockerCount} blockers</Capsule>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>support：{item.supportOwners.join(" · ") || "-"}</p>
                    <p>primary route：{item.primaryRoute}</p>
                    <p>next best：{item.nextBestAction}</p>
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard eyebrow="release / executable" title="可执行发布泳道">
            <div className="space-y-4">
              {topLanes.map((item) => (
                <div key={item.draftId} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{item.draftId}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-300/82">{item.summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule className={priorityTone(item.reviewPriority)}>{item.reviewPriority}</Capsule>
                      <Capsule className={deliveryTone(item.deliveryStatus)}>{item.deliveryStatus}</Capsule>
                      <Capsule>{item.recommendedOwner}</Capsule>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 xl:grid-cols-[0.34fr_0.33fr_0.33fr]">
                    <div className="rounded-[18px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">lane brief</p>
                      <div className="mt-3 space-y-2 text-sm leading-7 text-stone-300/82">
                        <p>next best：{item.nextBestAction}</p>
                        <p>support：{item.supportOwners.join(" · ") || "-"}</p>
                        <p>primary route：{item.primaryRoute?.title ?? "-"}</p>
                        <p>schema signals：{item.schemaSignals}</p>
                      </div>
                    </div>
                    <div className="rounded-[18px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">blockers</p>
                      <div className="mt-3 space-y-3">
                        {item.blockers.length === 0 ? (
                          <p className="text-sm leading-7 text-stone-500">当前没有 blocker，可继续推进 apply。</p>
                        ) : (
                          item.blockers.map((blocker, index) => (
                            <div key={`${item.draftId}-blocker-${index}`} className="rounded-[16px] bg-black/18 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm text-stone-100">{blocker.title}</p>
                                <Capsule className={chainTone(blocker.kind)}>{blocker.kind}</Capsule>
                              </div>
                              <p className="mt-2 text-sm leading-7 text-stone-400">{blocker.detail}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="rounded-[18px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">handoff chain</p>
                      <div className="mt-3 space-y-3 text-sm leading-7 text-stone-300/82">
                        {item.handoffChain.map((handoff, index) => (
                          <div key={`${item.draftId}-handoff-${index}`}>
                            <div className="flex flex-wrap items-center gap-2">
                              <Capsule>{handoff.stage}</Capsule>
                              <Capsule>{handoff.owner}</Capsule>
                            </div>
                            <p className="mt-2 text-stone-100">{handoff.title}</p>
                            <p>{handoff.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 xl:grid-cols-[0.48fr_0.52fr]">
                    <div className="rounded-[18px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">route order</p>
                      <div className="mt-3 space-y-3 text-sm leading-7 text-stone-300/82">
                        {item.recommendedRouteOrder.map((route) => (
                          <div key={`${item.draftId}-${route.route}`}>
                            <p className="text-stone-100">{route.title}</p>
                            <p>{route.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[18px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">release chain</p>
                      <div className="mt-3 space-y-3">
                        {item.releaseChain.map((step) => (
                          <div key={`${item.draftId}-${step.key}`} className="rounded-[16px] bg-black/18 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-sm text-stone-100">{step.layer}</p>
                              <Capsule className={chainTone(step.status)}>{step.status}</Capsule>
                            </div>
                            <p className="mt-2 text-sm leading-7 text-stone-400">{step.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href={buildDraftDetailHref(item.draftId)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                      草稿详情
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                    </Link>
                    {item.primaryRoute ? (
                      <Link href={item.primaryRoute.route} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                        首个验证路由
                        <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                      </Link>
                    ) : null}
                    <Link href="/lab/native-handoff" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                      原生回跳
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.44fr_0.56fr]">
          <ReportCard eyebrow="release / cross-layer" title="跨层联动摘要">
            <div className="space-y-4">
              {snapshot.crossLayerLinks.map((item) => (
                <div key={item.key} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{item.detail}</p>
                    </div>
                    <Capsule>{item.count}</Capsule>
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard eyebrow="release / highest lanes" title="高优先级发布泳道">
            <div className="space-y-4">
              {topLanes.map((item) => (
                <div key={`${item.draftId}-compact`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{item.draftId}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule className={priorityTone(item.reviewPriority)}>{item.reviewPriority}</Capsule>
                      <Capsule>{item.blockerCount} blockers</Capsule>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>next best：{item.nextBestAction}</p>
                    <p>impact areas：{item.impactAreas.map((area) => area.title).join(" · ") || "-"}</p>
                    <p>route order：{item.recommendedRouteOrder.map((route) => route.title).join(" · ") || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>
        </section>
      </div>
    </main>
  );
}
