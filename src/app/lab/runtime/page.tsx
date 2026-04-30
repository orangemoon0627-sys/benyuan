import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { InternalLabNav } from "@/components/internal-lab-nav";
import { LabRouteDraftPanel } from "@/components/lab-route-draft-panel";
import { buildAnalysisInput, buildAnalysisPromptPayload, buildAnalysisWorkbenchCatalog, getAnalysisRuntimeStatus, resolveAnalysisEngine } from "@/lib/analysis";
import { goldenSampleSessions } from "@/lib/fixtures/golden-samples";
import { listDraftSessionsForRoute, listSessionRuntimeSummaries, syncWorkbenchDraftSessions } from "@/lib/store";
import { buildAssessmentContentWorkbench } from "@/features/assessment";
import type { AnalysisPipelineStageRecord } from "@/lib/types";

const runtimeScenarios = [
  { label: "lite / default", mode: "lite" as const, options: {} },
  { label: "deep / default", mode: "deep" as const, options: {} },
  { label: "deep / hybrid override", mode: "deep" as const, options: { engine: "hybrid" } },
  { label: "deep / hybrid + openai override", mode: "deep" as const, options: { engine: "hybrid", provider: "openai" } },
];

const deepSample = goldenSampleSessions.find((session) => session.mode === "deep") ?? goldenSampleSessions[0];
const promptPreview = buildAnalysisPromptPayload(buildAnalysisInput(deepSample));

function formatTimestamp(value: string | undefined) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function stageTone(status: AnalysisPipelineStageRecord["status"]) {
  if (status === "done") return "bg-sky-100";
  if (status === "running") return "bg-white";
  if (status === "failed") return "bg-rose-300";
  if (status === "skipped") return "bg-violet-200/80";
  return "bg-white/18";
}

export default async function RuntimeLabPage() {
  const deterministicRun = await resolveAnalysisEngine(deepSample.mode, "deterministic").run(buildAnalysisInput(deepSample));
  const hybridRun = await resolveAnalysisEngine(deepSample.mode, "hybrid").run(buildAnalysisInput(deepSample));
  const contentWorkbench = buildAssessmentContentWorkbench();
  const analysisWorkbench = buildAnalysisWorkbenchCatalog(contentWorkbench.draftBlueprints);
  await syncWorkbenchDraftSessions(contentWorkbench.draftBlueprints, analysisWorkbench.impactMatrix);
  const routeDrafts = await listDraftSessionsForRoute("/lab/runtime");
  const liveSessions = await listSessionRuntimeSummaries(4);

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(189,218,255,0.12),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(109,80,131,0.12),transparent_28%),radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(123,153,183,0.16),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.46em] text-stone-300/65">internal / analysis runtime</p>
              <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">分析运行时面板</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-stone-300/82 md:text-lg">
                这里显示当前分析层的 engine、provider、fallback 与 prompt shaping 结构。现在也补上了真实 session 的阶段快照，方便你直接看每次分析到底走到哪一层。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/lab/golden" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm tracking-[0.18em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                黄金样本
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/schema" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm tracking-[0.18em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                schema 面板
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/golden/audit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm tracking-[0.18em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                审阅差异
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/kernel" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm tracking-[0.18em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                kernel 工作台
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </div>
          </div>
        </section>

        <InternalLabNav current="/lab/runtime" className="mt-6" />
        <LabRouteDraftPanel routeTitle="Runtime 面板" items={routeDrafts} />

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          {runtimeScenarios.map((scenario) => {
            const runtime = getAnalysisRuntimeStatus(scenario.mode, scenario.options);
            return (
              <ReportCard key={scenario.label} eyebrow={scenario.label} title={`${runtime.engineLabel} / ${runtime.providerId}`}>
                <div className="space-y-3 text-sm leading-7 text-stone-300/78">
                  <p>effective runtime：{runtime.effectiveRuntime}</p>
                  <p>fallback active：{runtime.fallbackActive ? "yes" : "no"}</p>
                  <p>provider available：{runtime.providerAvailable ? "yes" : "no"}</p>
                  <p>provider reason：{runtime.providerReason ?? "configured"}</p>
                  <p>provider mode：{runtime.providerRequestMode}</p>
                  <p>provider model：{runtime.providerModel ?? "n/a"}</p>
                  <p>prompt template：{runtime.selectedPromptTemplateKey}</p>
                  <p>env flags：OpenAI={runtime.openAIKeyConfigured ? "on" : "off"} · Anthropic={runtime.anthropicKeyConfigured ? "on" : "off"} · Custom={runtime.customKeyConfigured ? "on" : "off"}</p>
                  <p>models：{runtime.openAIModel} · {runtime.anthropicModel} · {runtime.customModel}</p>
                  <p>live provider：{runtime.liveProviderEnabled ? "enabled" : "stub only"} · soft timeout {runtime.providerSoftTimeoutMs}ms · hard timeout {runtime.providerTimeoutMs}ms</p>
                </div>
              </ReportCard>
            );
          })}
        </section>

        <section className="mt-10">
          <ReportCard eyebrow="live / pipeline" title="真实分析阶段快照">
            {liveSessions.length === 0 ? (
              <p className="text-sm leading-7 text-stone-400">当前 store 里还没有真实 session，可先跑一轮 `/test → /processing → /report`。</p>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {liveSessions.map((session) => (
                  <div key={session.sessionId} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{session.sessionId}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{session.mode} / {session.assessmentVersion} / {session.lifecycleStatus}</p>
                      </div>
                      <div className="text-right text-xs leading-6 text-stone-400">
                        <p>updated {formatTimestamp(session.updatedAt)}</p>
                        <p>{session.reportReady ? "report ready" : "report pending"}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm leading-7 text-stone-300/82 md:grid-cols-2">
                      <p>current job：{session.currentJobId ?? "-"}</p>
                      <p>current stage：{session.currentStageKey ?? session.latestJobStatus ?? "idle"}</p>
                    </div>

                    {session.pipelineStages?.length ? (
                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        {session.pipelineStages.map((stage) => (
                          <div key={`${session.sessionId}-${stage.key}`} className="rounded-[20px] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-stone-200">{stage.title}</p>
                              <span className={`h-2.5 w-2.5 rounded-full ${stageTone(stage.status)}`} />
                            </div>
                            <p className="mt-2 text-xs leading-6 text-stone-400">{stage.status} · {stage.detail}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm leading-7 text-stone-400">该 session 还没有 pipeline stages 记录。</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          {[
            { label: "deterministic trace", run: deterministicRun },
            { label: "hybrid trace", run: hybridRun },
          ].map((entry) => (
            <ReportCard key={entry.label} eyebrow={entry.label} title={`${entry.run.trace.engineLabel} / ${entry.run.trace.effectiveRuntime}`}>
              <div className="space-y-3 text-sm leading-7 text-stone-300/78">
                <p>provider：{entry.run.trace.providerId} / {entry.run.trace.providerKind}</p>
                <p>prompt template：{entry.run.trace.promptTemplateId} / {entry.run.trace.promptTemplateVersion}</p>
                <p>answered：{entry.run.trace.answeredCount} · reflections：{entry.run.trace.openReflectionCount}</p>
                <p>top signals：{entry.run.trace.topSignals.join(" · ") || "-"}</p>
                <p>report schema：{entry.run.report.reportSchemaVersion} · prompt：{entry.run.report.promptVersion}</p>
              </div>
            </ReportCard>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.38fr_0.62fr]">
          <ReportCard eyebrow="prompt shaping" title="provider 输入整形预览">
            <div className="space-y-3 text-sm leading-7 text-stone-300/78">
              <p>session：{promptPreview.payload.metadata.sessionId}</p>
              <p>mode：{promptPreview.payload.metadata.mode}</p>
              <p>question count：{promptPreview.payload.metadata.questionCount}</p>
              <p>open reflections：{promptPreview.summary.openReflectionCount}</p>
              <p>template：{promptPreview.template.id} / {promptPreview.template.version}</p>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">top signals</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {promptPreview.summary.topSignals.map((signal) => (
                  <span key={signal} className="rounded-full bg-white/[0.03] px-3 py-2 text-xs tracking-[0.14em] text-stone-300 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          </ReportCard>

          <ReportCard eyebrow="payload excerpt" title="provider payload 片段">
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-[24px] bg-black/18 p-5 text-xs leading-6 text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              {JSON.stringify(promptPreview.payload, null, 2)}
            </pre>
          </ReportCard>
        </section>
      </div>
    </main>
  );
}
