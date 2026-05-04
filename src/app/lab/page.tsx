import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { InternalLabNav } from "@/components/internal-lab-nav";
import { buildAssessmentContentWorkbench } from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
import { labRouteMeta } from "@/lib/lab-route-meta";
import { getDraftDeliverySnapshot, listDraftSessions, listSessionRuntimeSummaries, syncWorkbenchDraftSessions } from "@/lib/store";

export default async function LabOverviewPage() {
  const assessment = buildAssessmentContentWorkbench();
  const analysis = buildAnalysisWorkbenchCatalog(assessment.draftBlueprints);
  await syncWorkbenchDraftSessions(assessment.draftBlueprints, analysis.impactMatrix);
  const sessions = await listSessionRuntimeSummaries(6);
  const drafts = await listDraftSessions();
  const delivery = await getDraftDeliverySnapshot();

  const routes = labRouteMeta;


  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(189,218,255,0.12),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(109,80,131,0.12),transparent_28%),radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(123,153,183,0.16),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <p className="text-[11px] uppercase tracking-[0.46em] text-stone-300/65">internal / lab overview</p>
          <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">本源实验室总览</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-stone-300/82 md:text-lg">
            这是本源内部开发面的总入口，不是给用户看的产品首页，而是把题库、分析内核、原生交接和回归校验串成一条可浏览的工程路线。
          </p>
          <InternalLabNav current="/lab" className="mt-6" />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-4">
          <ReportCard eyebrow="assessment" title="题库结构">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>manifests：{assessment.manifests.length}</p>
              <p>question sources：{assessment.questionSources.length}</p>
              <p>manifest diffs：{assessment.manifestDiffs.length}</p>
              <p>source diffs：{assessment.questionSourceDiffs.length}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="analysis" title="内核配置">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>prompt templates：{analysis.promptTemplates.length}</p>
              <p>report schemas：{analysis.reportSchemas.length}</p>
              <p>preview presets：{analysis.previewMatrix.length}</p>
              <p>impact matrix：{analysis.impactMatrix.length}</p>
              <p>draft sessions：{drafts.length}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="runtime" title="最近 session">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>captured：{sessions.length}</p>
              <p>latest stages：{sessions.slice(0, 3).map((item) => item.currentStageKey ?? item.lifecycleStatus).filter(Boolean).join(" · ") || "-"}</p>
              <p>job status：{sessions.slice(0, 3).map((item) => item.latestJobStatus ?? item.currentJobStatus ?? "-").join(" · ") || "-"}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="delivery" title="交付状态">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>freeze candidates：{delivery.summary.freezeCandidates}</p>
              <p>apply queue：{delivery.summary.applyQueue}</p>
              <p>archived：{delivery.summary.archived}</p>
              <p>top action：{delivery.nextActions[0]?.action ?? "-"}</p>
              <p>release chain：/lab/release-chain</p>
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {routes.map((route) => (
            <ReportCard key={route.href} eyebrow="lab route" title={route.title}>
              <p className="text-sm leading-7 text-stone-300/82">{route.detail}</p>
              <Link href={route.href} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                打开
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </ReportCard>
          ))}
        </section>
      </div>
    </main>
  );
}
