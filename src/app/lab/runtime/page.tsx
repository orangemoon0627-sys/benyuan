import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { buildAnalysisInput, buildAnalysisPromptPayload, getAnalysisRuntimeStatus } from "@/lib/analysis";
import { goldenSampleSessions } from "@/lib/fixtures/golden-samples";

const runtimeScenarios = [
  { label: "lite / default", mode: "lite" as const, options: {} },
  { label: "deep / default", mode: "deep" as const, options: {} },
  { label: "deep / hybrid override", mode: "deep" as const, options: { engine: "hybrid" } },
  { label: "deep / hybrid + openai override", mode: "deep" as const, options: { engine: "hybrid", provider: "openai" } },
];

const deepSample = goldenSampleSessions.find((session) => session.mode === "deep") ?? goldenSampleSessions[0];
const promptPreview = buildAnalysisPromptPayload(buildAnalysisInput(deepSample));

export default function RuntimeLabPage() {
  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(189,218,255,0.12),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(109,80,131,0.12),transparent_28%),radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(123,153,183,0.16),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] tracking-[0.46em] text-stone-300/65 uppercase">internal / analysis runtime</p>
              <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">分析运行时面板</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-stone-300/82 md:text-lg">
                这里显示当前分析层的 engine、provider、fallback 与 prompt shaping 结构。后续接真实 AI 时，先从这里确认运行时状态是否符合预期。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/lab/golden" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm tracking-[0.18em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                黄金样本
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/golden/audit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm tracking-[0.18em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                审阅差异
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </div>
          </div>
        </section>

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
                  <p>env flags：OpenAI={runtime.openAIKeyConfigured ? "on" : "off"} · Anthropic={runtime.anthropicKeyConfigured ? "on" : "off"}</p>
                  <p>models：{runtime.openAIModel} · {runtime.anthropicModel}</p>
                  <p>live provider：{runtime.liveProviderEnabled ? "enabled" : "stub only"} · timeout {runtime.providerTimeoutMs}ms</p>
                </div>
              </ReportCard>
            );
          })}
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
                  <span key={signal} className="rounded-full bg-white/[0.03] px-3 py-2 text-xs tracking-[0.14em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] uppercase">
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
