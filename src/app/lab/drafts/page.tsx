import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { InternalLabNav } from "@/components/internal-lab-nav";
import { buildAssessmentContentWorkbench } from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
import { buildDraftDetailHref } from "@/lib/draft-routing";
import { listDraftWorkflowSummaries, syncWorkbenchDraftSessions } from "@/lib/store";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function Capsule({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white/[0.04] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      {children}
    </span>
  );
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

export default async function DraftSessionsPage() {
  const content = buildAssessmentContentWorkbench();
  const analysis = buildAnalysisWorkbenchCatalog(content.draftBlueprints);
  await syncWorkbenchDraftSessions(content.draftBlueprints, analysis.impactMatrix);
  const drafts = await listDraftWorkflowSummaries();

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(189,218,255,0.12),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(109,80,131,0.12),transparent_28%),radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(123,153,183,0.16),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <p className="text-[11px] uppercase tracking-[0.46em] text-stone-300/65">internal / draft sessions</p>
          <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">草稿会话库</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-stone-300/82 md:text-lg">
            这里把内容草稿和 analysis 草稿都收成稳定 draft session，便于单独查看、对比和模拟 apply。
          </p>
          <InternalLabNav current="/lab/drafts" className="mt-6" />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-4">
          <ReportCard eyebrow="drafts" title="概览">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>all drafts：{drafts.length}</p>
              <p>apply candidates：{drafts.filter((item) => item.workflow.state === "apply_candidate").length}</p>
              <p>review required：{drafts.filter((item) => item.workflow.state === "review_required").length}</p>
              <p>ready to apply：{drafts.filter((item) => item.workflow.state === "ready_to_apply").length}</p>
              <p>freeze candidates：{drafts.filter((item) => item.workflow.deliveryStatus === "freeze_candidate").length}</p>
              <p>apply queue：{drafts.filter((item) => item.workflow.deliveryStatus === "apply_queue").length}</p>
              <p>archived：{drafts.filter((item) => item.workflow.deliveryStatus === "archived").length}</p>
              <p>avg readiness：{drafts.length === 0 ? 0 : Math.round(drafts.reduce((sum, item) => sum + item.workflow.readinessScore, 0) / drafts.length)}%</p>
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          {drafts.map(({ draft, simulation, workflow }) => (
            <ReportCard key={draft.draftId} eyebrow={draft.kind} title={draft.title}>
              <div className="space-y-4 text-sm leading-7 text-stone-300/82">
                <div className="flex flex-wrap gap-2">
                  <Capsule>{workflow.state}</Capsule>
                  <PriorityCapsule priority={workflow.reviewPriority} />
                  <DeliveryCapsule status={workflow.deliveryStatus} />
                  <Capsule>{workflow.routeCount} routes</Capsule>
                  <Capsule>{workflow.linkedDraftCount} linked</Capsule>
                  <Capsule>{workflow.readinessScore}% ready</Capsule>
                </div>
                <div className="space-y-2">
                  <p>draft id：{draft.draftId}</p>
                  <p>status：{draft.status}</p>
                  <p>source：{draft.sourceKey}</p>
                  <p>last checked：{formatTimestamp(workflow.lastCheckedAt)}</p>
                  <p>next action：{workflow.nextAction}</p>
                  <p>delivery：{workflow.deliveryStatus}</p>
                  <p>routes：{draft.linkedRoutes.join(" · ") || "-"}</p>
                  <p>blocking impacts：{workflow.blockingImpactCount}</p>
                  <p>linked drafts：{draft.linkedDraftIds.join(" · ") || "-"}</p>
                  <p>impact areas：{simulation?.impactAreas.map((item) => item.title).join(" · ") || "-"}</p>
                </div>
              </div>
              <Link href={buildDraftDetailHref(draft.draftId)} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                打开草稿
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </ReportCard>
          ))}
        </section>
      </div>
    </main>
  );
}
