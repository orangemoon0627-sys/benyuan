import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { InternalLabNav } from "@/components/internal-lab-nav";
import { LabRouteDraftPanel } from "@/components/lab-route-draft-panel";
import { buildAssessmentContentWorkbench, listAssessmentDefinitionSnapshots, listAssessmentVersions } from "@/features/assessment";
import {
  buildAnalysisWorkbenchCatalog,
  diffAnalysisPromptTemplates,
  diffAnalysisReportSchemas,
  getAnalysisRuntimeStatus,
} from "@/lib/analysis";
import { listDraftSessionsForRoute, listSessionRuntimeSummaries, syncWorkbenchDraftSessions } from "@/lib/store";
import type { Mode } from "@/lib/types";

function Capsule({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white/[0.04] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">{children}</p>;
}

function buildKernelHref(current: URLSearchParams, updates: Record<string, string | null>) {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }

  const query = next.toString();
  return query ? `/lab/kernel?${query}` : "/lab/kernel";
}

function ControlLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] transition ${
        active
          ? "bg-[linear-gradient(135deg,rgba(232,243,255,0.17),rgba(167,193,228,0.11))] text-stone-100 shadow-[0_0_0_1px_rgba(216,232,255,0.18)]"
          : "bg-white/[0.03] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/[0.05] hover:text-stone-100"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function KernelWorkbenchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedMode = resolvedSearchParams.mode === "deep" ? "deep" : "lite";
  const selectedEngine = typeof resolvedSearchParams.engine === "string" ? resolvedSearchParams.engine : null;
  const selectedProvider = typeof resolvedSearchParams.provider === "string" ? resolvedSearchParams.provider : null;
  const selectedPromptTemplate = typeof resolvedSearchParams.promptTemplate === "string" ? resolvedSearchParams.promptTemplate : null;
  const selectedReportSchema = typeof resolvedSearchParams.reportSchema === "string" ? resolvedSearchParams.reportSchema : null;

  const query = new URLSearchParams();
  if (selectedMode) query.set("mode", selectedMode);
  if (selectedEngine) query.set("engine", selectedEngine);
  if (selectedProvider) query.set("provider", selectedProvider);
  if (selectedPromptTemplate) query.set("promptTemplate", selectedPromptTemplate);
  if (selectedReportSchema) query.set("reportSchema", selectedReportSchema);

  const snapshots = listAssessmentDefinitionSnapshots();
  const modes = [...new Set(snapshots.map((snapshot) => snapshot.mode))] as Mode[];
  const sessions = await listSessionRuntimeSummaries(12);
  const runtimes = {
    lite: getAnalysisRuntimeStatus("lite"),
    deep: getAnalysisRuntimeStatus("deep"),
  };
  const contentWorkbench = buildAssessmentContentWorkbench();
  const workbench = buildAnalysisWorkbenchCatalog(contentWorkbench.draftBlueprints);
  await syncWorkbenchDraftSessions(contentWorkbench.draftBlueprints, workbench.impactMatrix);
  const routeDrafts = await listDraftSessionsForRoute("/lab/kernel");
  const selectedPreview = getAnalysisRuntimeStatus(selectedMode, {
    engine: selectedEngine,
    provider: selectedProvider,
    promptTemplate: selectedPromptTemplate,
    reportSchema: selectedReportSchema,
  });
  const selectedPromptDiff =
    selectedMode === "deep" && selectedPreview.selectedPromptTemplateKey === "depth"
      ? diffAnalysisPromptTemplates("core", "depth", "deep")
      : diffAnalysisPromptTemplates("core", "core", selectedMode);
  const selectedReportDiff =
    selectedMode === "deep" && selectedPreview.selectedReportSchemaKey === "deep_focus"
      ? diffAnalysisReportSchemas("standard", "deep_focus", "deep")
      : diffAnalysisReportSchemas("standard", "standard", selectedMode);

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(189,218,255,0.12),transparent_24%),radial-gradient(circle_at_86%_20%,rgba(109,80,131,0.11),transparent_26%),radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(123,153,183,0.16),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.46em] text-stone-300/65">internal / kernel workbench</p>
              <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">本源内核工作台</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-stone-300/82 md:text-lg">
                这里不是产品界面，而是整个分析内核的可观测层：看 runtime、看 prompt/report schema、看 session 生命周期、看 pipeline stage 是否真的按预期流动。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/lab/schema" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                schema
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/runtime" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                runtime
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/content" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                content preview
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/native-handoff" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                native handoff
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/kernel-admin" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                kernel admin
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </div>
          </div>
        </section>


        <InternalLabNav current="/lab/kernel" className="mt-6" />
        <LabRouteDraftPanel routeTitle="内核工作台" items={routeDrafts} />
        <section className="mt-10 grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
          <ReportCard eyebrow="analysis / runtime sandbox" title="Runtime 组合沙盒">
            <div className="space-y-5">
              <div>
                <SectionLabel>mode</SectionLabel>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["lite", "deep"] as const).map((mode) => (
                    <ControlLink
                      key={mode}
                      href={buildKernelHref(query, {
                        mode,
                        promptTemplate: mode === "lite" ? "core" : selectedPromptTemplate,
                        reportSchema: mode === "lite" ? "standard" : selectedReportSchema,
                      })}
                      active={selectedMode === mode}
                    >
                      {mode}
                    </ControlLink>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>engine</SectionLabel>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: "default", value: null },
                    { label: "deterministic", value: "deterministic" },
                    { label: "hybrid", value: "hybrid" },
                  ].map((item) => (
                    <ControlLink key={item.label} href={buildKernelHref(query, { engine: item.value })} active={(selectedEngine ?? "default") === (item.value ?? "default")}>
                      {item.label}
                    </ControlLink>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>provider</SectionLabel>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: "default", value: null },
                    { label: "disabled", value: "disabled" },
                    { label: "openai", value: "openai" },
                    { label: "anthropic", value: "anthropic" },
                  ].map((item) => (
                    <ControlLink key={item.label} href={buildKernelHref(query, { provider: item.value })} active={(selectedProvider ?? "default") === (item.value ?? "default")}>
                      {item.label}
                    </ControlLink>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>prompt template</SectionLabel>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: "default", value: null },
                    { label: "core", value: "core" },
                    { label: "depth", value: selectedMode === "deep" ? "depth" : null },
                  ]
                    .filter((item) => item.label !== "depth" || selectedMode === "deep")
                    .map((item) => (
                      <ControlLink key={item.label} href={buildKernelHref(query, { promptTemplate: item.value })} active={(selectedPromptTemplate ?? "default") === (item.value ?? "default")}>
                        {item.label}
                      </ControlLink>
                    ))}
                </div>
              </div>

              <div>
                <SectionLabel>report schema</SectionLabel>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: "default", value: null },
                    { label: "standard", value: "standard" },
                    { label: "deep_focus", value: selectedMode === "deep" ? "deep_focus" : null },
                  ]
                    .filter((item) => item.label !== "deep_focus" || selectedMode === "deep")
                    .map((item) => (
                      <ControlLink key={item.label} href={buildKernelHref(query, { reportSchema: item.value })} active={(selectedReportSchema ?? "default") === (item.value ?? "default")}>
                        {item.label}
                      </ControlLink>
                    ))}
                </div>
              </div>
            </div>
          </ReportCard>

          <ReportCard eyebrow="analysis / selected preview" title={`${selectedPreview.engineLabel} / ${selectedPreview.reportSchemaVersion}`}>
            <div className="space-y-3 text-sm leading-7 text-stone-300/82">
              <p>effective runtime：{selectedPreview.effectiveRuntime}</p>
              <p>provider：{selectedPreview.providerId} / {selectedPreview.providerKind}</p>
              <p>provider mode：{selectedPreview.providerRequestMode} / {selectedPreview.providerModel ?? "n/a"}</p>
              <p>prompt：{selectedPreview.promptTemplateId} / {selectedPreview.promptTemplateVersion}</p>
              <p>report schema：{selectedPreview.reportSchemaId} / {selectedPreview.reportSchemaVersion}</p>
              <p>fallback：{selectedPreview.fallbackActive ? "yes" : "no"}</p>
            </div>
            <pre className="mt-5 overflow-x-auto rounded-[20px] bg-[#09090c] p-4 text-xs leading-6 text-stone-300/86 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
              <code>{JSON.stringify(selectedPreview, null, 2)}</code>
            </pre>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6">
          <ReportCard eyebrow="analysis / runtime preview matrix" title="Runtime 组合预览矩阵">
            <div className="grid gap-3 md:grid-cols-2">
              {workbench.previewMatrix.map((scenario) => (
                <div key={scenario.key} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{scenario.label}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{scenario.runtime.engineId} / {scenario.runtime.providerId}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{scenario.runtime.selectedPromptTemplateKey}</Capsule>
                      <Capsule>{scenario.runtime.selectedReportSchemaKey}</Capsule>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm leading-7 text-stone-300/82">
                    <p>effective runtime：{scenario.runtime.effectiveRuntime}</p>
                    <p>prompt：{scenario.runtime.promptTemplateId} / {scenario.runtime.promptTemplateVersion}</p>
                    <p>report schema：{scenario.runtime.reportSchemaId} / {scenario.runtime.reportSchemaVersion}</p>
                    <p>provider mode：{scenario.runtime.providerRequestMode} · model {scenario.runtime.providerModel ?? "n/a"}</p>
                  </div>
                  <div className="mt-4">
                    <ControlLink href={buildKernelHref(query, scenario.options)} active={false}>
                      使用这组参数
                    </ControlLink>
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <ReportCard eyebrow="analysis / prompt registry" title="Prompt 模板注册表">
            <div className="grid gap-3">
              {workbench.promptTemplates.map((template) => (
                <div key={template.key} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{template.label}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{template.id} / {template.version}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{template.key}</Capsule>
                      {template.supportedModes.map((mode) => <Capsule key={`${template.key}-${mode}`}>{mode}</Capsule>)}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    {template.emphasis.map((item) => <p key={`${template.key}-${item}`}>{item}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard eyebrow="analysis / prompt diff" title="Prompt 模板差异预览">
            <div className="space-y-4">
              <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <p className="text-sm uppercase tracking-[0.18em] text-stone-100">当前选中 diff</p>
                <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                  <p>system changed：{selectedPromptDiff.systemChanged ? "yes" : "no"}</p>
                  <p>added guidance：{selectedPromptDiff.addedGuidance.join(" · ") || "-"}</p>
                  <p>added emphasis：{selectedPromptDiff.addedEmphasis.join(" · ") || "-"}</p>
                </div>
              </div>
              {workbench.promptTemplateDiffs.map((diff) => (
                <div key={`${diff.baseKey}-${diff.targetKey}`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{diff.baseKey} → {diff.targetKey}</p>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>system changed：{diff.systemChanged ? "yes" : "no"}</p>
                    <p>added guidance：{diff.addedGuidance.join(" · ") || "-"}</p>
                    <p>removed guidance：{diff.removedGuidance.join(" · ") || "-"}</p>
                    <p>added emphasis：{diff.addedEmphasis.join(" · ") || "-"}</p>
                    <p>removed emphasis：{diff.removedEmphasis.join(" · ") || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <ReportCard eyebrow="analysis / report schema registry" title="Report Schema 注册表">
            <div className="grid gap-3">
              {workbench.reportSchemas.map((schema) => (
                <div key={schema.key} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{schema.label}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{schema.id} / {schema.version}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{schema.key}</Capsule>
                      <Capsule>{schema.recommendationLimit} recs</Capsule>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-stone-300/82">order：{schema.dimensionOrder.join(" → ")}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-400">{schema.note}</p>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard eyebrow="analysis / report schema diff" title="Report Schema 差异预览">
            <div className="space-y-4">
              <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <p className="text-sm uppercase tracking-[0.18em] text-stone-100">当前选中 diff</p>
                <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                  <p>recommendation delta：{selectedReportDiff.recommendationLimitDelta}</p>
                  <p>dimension order changed：{selectedReportDiff.dimensionOrderChanged ? "yes" : "no"}</p>
                  <p>from：{selectedReportDiff.baseDimensionOrder.join(" → ")}</p>
                  <p>to：{selectedReportDiff.targetDimensionOrder.join(" → ")}</p>
                </div>
              </div>
              {workbench.reportSchemaDiffs.map((diff) => (
                <div key={`${diff.baseKey}-${diff.targetKey}`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{diff.baseKey} → {diff.targetKey}</p>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>recommendation delta：{diff.recommendationLimitDelta}</p>
                    <p>dimension order changed：{diff.dimensionOrderChanged ? "yes" : "no"}</p>
                    <p>from：{diff.baseDimensionOrder.join(" → ")}</p>
                    <p>to：{diff.targetDimensionOrder.join(" → ")}</p>
                    <p>note changed：{diff.noteChanged ? "yes" : "no"}</p>
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.36fr_0.64fr]">
          <ReportCard eyebrow="assessment / versions" title="题库版本矩阵">
            <div className="space-y-4">
              {modes.map((mode) => (
                <div key={mode} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{mode}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {listAssessmentVersions(mode).map((version) => (
                      <Capsule key={`${mode}-${version.version}`}>{version.version}{version.isDefault ? " default" : ""}</Capsule>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard eyebrow="session / lifecycle" title="最近 session 状态">
            {sessions.length === 0 ? (
              <p className="text-sm leading-7 text-stone-400">当前还没有真实测试 session 被写入 store。</p>
            ) : (
              <div className="grid gap-3">
                {sessions.map((session) => (
                  <div key={session.sessionId} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{session.sessionId}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{session.mode} / {session.assessmentVersion} / {session.lifecycleStatus}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Capsule>{session.answerCount} answers</Capsule>
                        <Capsule>{session.moodKeywordCount} moods</Capsule>
                        <Capsule>{session.reportReady ? "report ready" : "report pending"}</Capsule>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm leading-7 text-stone-300/82 md:grid-cols-2">
                      <p>created：{session.createdAt}</p>
                      <p>updated：{session.updatedAt}</p>
                      <p>current job：{session.currentJobId ?? "-"} / {session.currentJobStatus ?? "-"}</p>
                      <p>current stage：{session.currentStageKey ?? "-"}</p>
                    </div>
                    {session.pipelineStages?.length ? (
                      <div className="mt-4">
                        <SectionLabel>pipeline stages</SectionLabel>
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {session.pipelineStages.map((stage) => (
                            <div key={`${session.sessionId}-${stage.key}`} className="rounded-[20px] bg-white/[0.02] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                              <p className="text-xs uppercase tracking-[0.16em] text-stone-200">{stage.title}</p>
                              <p className="mt-2 text-xs leading-6 text-stone-400">{stage.status} · {stage.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </ReportCard>
        </section>
      </div>
    </main>
  );
}
