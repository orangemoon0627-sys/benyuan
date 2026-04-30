import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { InternalLabNav } from "@/components/internal-lab-nav";
import { buildAssessmentContentWorkbench } from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
import { buildDraftDetailApiHref, buildDraftDetailHref, buildDraftSimulationApiHref, draftIdFromSegments } from "@/lib/draft-routing";
import { getDraftSession, getDraftWorkflowSummary, getLinkedDraftSessions, simulateDraftApplication, syncWorkbenchDraftSessions } from "@/lib/store";

function Capsule({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white/[0.04] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500">{children}</p>;
}

function EditorShell({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-[24px] bg-[#09090c] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
      <p className="text-[11px] uppercase tracking-[0.26em] text-stone-500">{title}</p>
      <pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap text-xs leading-6 text-stone-300/86">
        <code>{content}</code>
      </pre>
    </div>
  );
}

function SeverityCapsule({ severity }: { severity: "notice" | "warning" | "blocking" }) {
  const tone =
    severity === "blocking"
      ? "bg-rose-400/10 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.2)]"
      : severity === "warning"
        ? "bg-amber-300/10 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.16)]"
        : "bg-sky-300/10 text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.16)]";

  return <span className={`rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.18em] ${tone}`}>{severity}</span>;
}

function PriorityCapsule({ priority }: { priority: "critical" | "high" | "normal" }) {
  const tone =
    priority === "critical"
      ? "bg-rose-400/10 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.2)]"
      : priority === "high"
        ? "bg-amber-300/10 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.16)]"
        : "bg-sky-300/10 text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.16)]";

  return <span className={`rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.18em] ${tone}`}>{priority}</span>;
}

function DeliveryCapsule({ status }: { status: "freeze_candidate" | "apply_queue" | "archived" }) {
  const tone =
    status === "freeze_candidate"
      ? "bg-fuchsia-400/10 text-fuchsia-100 shadow-[0_0_0_1px_rgba(232,121,249,0.18)]"
      : status === "apply_queue"
        ? "bg-cyan-300/10 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.18)]"
        : "bg-emerald-400/10 text-emerald-100 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]";

  return <span className={`rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.18em] ${tone}`}>{status}</span>;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default async function DraftDetailPage({ params }: { params: Promise<{ draftId?: string[] }> }) {
  const resolvedParams = await params;
  const draftId = draftIdFromSegments(resolvedParams.draftId);
  const content = buildAssessmentContentWorkbench();
  const analysis = buildAnalysisWorkbenchCatalog(content.draftBlueprints);
  await syncWorkbenchDraftSessions(content.draftBlueprints, analysis.impactMatrix);

  const draft = await getDraftSession(draftId);
  const linkedDrafts = draft ? await getLinkedDraftSessions(draft.draftId) : [];
  const simulation = draft ? await simulateDraftApplication(draft.draftId) : null;
  const workflow = draft ? await getDraftWorkflowSummary(draft.draftId) : null;
  const contentDraft = content.draftBlueprints.find((item) => item.draftId === draftId) ?? null;
  const analysisDraft = analysis.impactMatrix.find((item) => item.draftId === draftId) ?? null;

  if (!draft) {
    return (
      <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
        <div className="relative mx-auto max-w-4xl">
          <ReportCard eyebrow="draft" title="草稿不存在">
            <p className="text-sm leading-7 text-stone-300/82">未找到 draft：{draftId}</p>
            <Link href="/lab/drafts" className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
              返回草稿库
            </Link>
          </ReportCard>
        </div>
      </main>
    );
  }

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(189,218,255,0.12),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(109,80,131,0.12),transparent_28%),radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(123,153,183,0.16),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <p className="text-[11px] uppercase tracking-[0.46em] text-stone-300/65">internal / draft detail</p>
          <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">{draft.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-stone-300/82 md:text-lg">{draft.summary}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Capsule>{draft.kind}</Capsule>
            <Capsule>{draft.status}</Capsule>
            <Capsule>{draft.draftId}</Capsule>
            {workflow ? <Capsule>{workflow.state}</Capsule> : null}
            {workflow ? <DeliveryCapsule status={workflow.deliveryStatus} /> : null}
            {simulation ? <Capsule>{simulation.impactAreas.length} impact areas</Capsule> : null}
          </div>
          <InternalLabNav current="/lab/drafts" className="mt-6" />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
          <ReportCard eyebrow="draft / meta" title="草稿元信息">
            <div className="space-y-3 text-sm leading-7 text-stone-300/82">
              <p>source：{draft.sourceKey}</p>
              <p>mode：{draft.mode ?? "-"}</p>
              <p>version：{draft.baseVersion ?? "-"}{" -> "}{draft.targetVersion ?? "-"}</p>
              <p>target files：{draft.targetFiles.join(" · ") || "-"}</p>
              <p>routes：{draft.linkedRoutes.join(" · ") || "-"}</p>
              <p>detail api：{buildDraftDetailApiHref(draft.draftId)}</p>
              <p>simulate api：{buildDraftSimulationApiHref(draft.draftId)}</p>
            </div>
          </ReportCard>

          <ReportCard eyebrow="draft / workflow" title="变更状态">
            {workflow ? (
              <div className="space-y-4 text-sm leading-7 text-stone-300/82">
                <div className="flex flex-wrap gap-2">
                  <Capsule>{workflow.state}</Capsule>
                  <PriorityCapsule priority={workflow.reviewPriority} />
                  <DeliveryCapsule status={workflow.deliveryStatus} />
                  <Capsule>{workflow.routeCount} routes</Capsule>
                  <Capsule>{workflow.linkedDraftCount} linked drafts</Capsule>
                  <Capsule>{workflow.readinessScore}% ready</Capsule>
                </div>
                <div className="space-y-2">
                  <p>last checked：{formatTimestamp(workflow.lastCheckedAt)}</p>
                  <p>blocking impacts：{workflow.blockingImpactCount}</p>
                  <p>delivery：{workflow.deliveryStatus}</p>
                  <p>next action：{workflow.nextAction}</p>
                  <p>route review completion：{workflow.routeProgress.filter((item) => item.state === "completed").length}/{workflow.routeProgress.length}</p>
                </div>
              </div>
            ) : null}
          </ReportCard>
        </section>

        {workflow ? (
          <section className="mt-10 grid gap-6 lg:grid-cols-[0.48fr_0.52fr]">
            <ReportCard eyebrow="draft / milestones" title="阶段轨迹">
              <div className="space-y-4">
                {workflow.milestones.map((item) => (
                  <div key={item.key} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{item.detail}</p>
                      </div>
                      <Capsule>{item.status}</Capsule>
                    </div>
                  </div>
                ))}
              </div>
            </ReportCard>

            <ReportCard eyebrow="draft / route completion" title="Route Review Completion">
              <div className="space-y-4">
                {workflow.routeProgress.map((item) => (
                  <div key={item.route} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{item.route}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Capsule>{item.priority}</Capsule>
                        <Capsule>{item.state}</Capsule>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-stone-300/82">checks：{item.completedChecks}/{item.totalChecks}</p>
                  </div>
                ))}
              </div>
            </ReportCard>
          </section>
        ) : null}

        <section className="mt-10 grid gap-6 lg:grid-cols-1">
          <ReportCard eyebrow="draft / simulation" title="Apply Simulation">
            {simulation ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Capsule>{simulation.status}</Capsule>
                  <Capsule>{simulation.impactedDraftIds.length} linked drafts</Capsule>
                  <Capsule>{simulation.refreshedRoutes.length} routes</Capsule>
                </div>
                <div className="space-y-2 text-sm leading-7 text-stone-300/82">
                  {simulation.applyOrder.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
                <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <SectionLabel>notes</SectionLabel>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-stone-300/82">
                    {simulation.notes.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </ReportCard>
        </section>

        {simulation ? (
          <section className="mt-10 grid gap-6 lg:grid-cols-[0.56fr_0.44fr]">
            <ReportCard eyebrow="draft / impact matrix" title="影响矩阵">
              <div className="space-y-4">
                {simulation.impactAreas.map((item) => (
                  <div key={item.key} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-300/82">{item.summary}</p>
                      </div>
                      <SeverityCapsule severity={item.severity} />
                    </div>
                    <div className="mt-4 space-y-2 text-sm leading-7 text-stone-400">
                      {item.reasons.map((reason) => (
                        <p key={reason}>{reason}</p>
                      ))}
                    </div>
                    {item.routes.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.routes.map((route) => (
                          <Link key={`${item.key}-${route}`} href={route} className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                            {route}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </ReportCard>

            <ReportCard eyebrow="draft / route checks" title="逐路由验证动作">
              <div className="space-y-4">
                {simulation.routeChecks.map((item) => (
                  <div key={item.route} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{item.reason}</p>
                      </div>
                      <Capsule>{item.priority}</Capsule>
                    </div>
                    <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                      {item.checks.map((check) => (
                        <p key={check}>{check}</p>
                      ))}
                    </div>
                    <Link href={item.route} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                      打开 {item.title}
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                    </Link>
                  </div>
                ))}
              </div>
            </ReportCard>
          </section>
        ) : null}

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <ReportCard eyebrow="draft / linked" title="关联草稿">
            <div className="space-y-3">
              {linkedDrafts.length === 0 ? (
                <p className="text-sm leading-7 text-stone-400">当前没有关联草稿。</p>
              ) : (
                linkedDrafts.map((item) => (
                  <div key={item.draftId} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-stone-400">{item.draftId}</p>
                    <p className="mt-2 text-sm leading-7 text-stone-300/82">{item.summary}</p>
                    <Link href={buildDraftDetailHref(item.draftId)} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                      查看关联草稿
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </ReportCard>

          <ReportCard eyebrow="draft / raw" title="草稿原始对象">
            <div className="space-y-4">
              <EditorShell title="draft session" content={JSON.stringify(draft, null, 2)} />
              {contentDraft ? <EditorShell title="content blueprint" content={JSON.stringify(contentDraft, null, 2)} /> : null}
              {analysisDraft ? <EditorShell title="analysis impact" content={JSON.stringify(analysisDraft, null, 2)} /> : null}
              {simulation ? <EditorShell title="simulation" content={JSON.stringify(simulation, null, 2)} /> : null}
            </div>
          </ReportCard>
        </section>
      </div>
    </main>
  );
}
