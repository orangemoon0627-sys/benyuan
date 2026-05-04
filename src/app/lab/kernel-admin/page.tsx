import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, FileCode2 } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { InternalLabNav } from "@/components/internal-lab-nav";
import { LabRouteDraftPanel } from "@/components/lab-route-draft-panel";
import { analysisPromptTemplateConfig } from "@/config/analysis/prompt-templates";
import { analysisReportSchemaConfig } from "@/config/analysis/report-schemas";
import { analysisRuntimePreviewPresetConfig } from "@/config/analysis/runtime-preview-presets";
import { buildAssessmentContentWorkbench } from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog, getAnalysisRuntimeStatus } from "@/lib/analysis";
import { listDraftSessionsForRoute, syncWorkbenchDraftSessions } from "@/lib/store";
import { buildDraftDetailHref } from "@/lib/draft-routing";

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

export default async function KernelAdminPage() {
  const defaults = {
    lite: getAnalysisRuntimeStatus("lite"),
    deep: getAnalysisRuntimeStatus("deep"),
  };
  const contentWorkbench = buildAssessmentContentWorkbench();
  const workbench = buildAnalysisWorkbenchCatalog(contentWorkbench.draftBlueprints);
  await syncWorkbenchDraftSessions(contentWorkbench.draftBlueprints, workbench.impactMatrix);
  const routeDrafts = await listDraftSessionsForRoute("/lab/kernel-admin");

  const configSources = [
    {
      title: "Prompt Templates",
      path: "src/config/analysis/prompt-templates.ts",
      count: Object.keys(analysisPromptTemplateConfig).length,
      detail: "管理 analysis 语气、系统指令、guidance 与 emphasis。",
    },
    {
      title: "Report Schemas",
      path: "src/config/analysis/report-schemas.ts",
      count: Object.keys(analysisReportSchemaConfig).length,
      detail: "管理报告结构、推荐数量、dimension 顺序。",
    },
    {
      title: "Runtime Preview Presets",
      path: "src/config/analysis/runtime-preview-presets.ts",
      count: analysisRuntimePreviewPresetConfig.length,
      detail: "管理内核工作台的预设组合与评审意图。",
    },
  ];

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(189,218,255,0.12),transparent_24%),radial-gradient(circle_at_82%_22%,rgba(109,80,131,0.12),transparent_28%),radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(123,153,183,0.16),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.46em] text-stone-300/65">internal / kernel admin</p>
              <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">内核管理台</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-stone-300/82 md:text-lg">
                这里开始承担“改配置前的总控入口”职责：不仅看 analysis config 源，还要看到这些改动会怎么波及题库结构、内核 runtime 和回归基线。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/lab/kernel" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                kernel workbench
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
              <Link href="/lab/drafts" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                drafts
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </div>
          </div>
        </section>

        <InternalLabNav current="/lab/kernel-admin" className="mt-6" />
        <LabRouteDraftPanel routeTitle="内核管理台" items={routeDrafts} />

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          {configSources.map((source) => (
            <ReportCard key={source.path} eyebrow="config source" title={source.title}>
              <div className="space-y-3 text-sm leading-7 text-stone-300/82">
                <div className="flex items-center gap-2 text-stone-100">
                  <FileCode2 className="h-4 w-4" strokeWidth={1.4} />
                  <span>{source.path}</span>
                </div>
                <p>count：{source.count}</p>
                <p>{source.detail}</p>
              </div>
            </ReportCard>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          {Object.entries(defaults).map(([mode, runtime]) => (
            <ReportCard key={mode} eyebrow={`${mode} / defaults`} title={`${runtime.selectedPromptTemplateKey} / ${runtime.selectedReportSchemaKey}`}>
              <div className="space-y-3 text-sm leading-7 text-stone-300/82">
                <p>engine：{runtime.engineLabel}</p>
                <p>provider：{runtime.providerId}</p>
                <p>prompt：{runtime.promptTemplateId} / {runtime.promptTemplateVersion}</p>
                <p>schema：{runtime.reportSchemaId} / {runtime.reportSchemaVersion}</p>
              </div>
            </ReportCard>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <ReportCard eyebrow="draft surfaces" title="可演练配置草案">
            <div className="space-y-4">
              {workbench.adminDraftSurfaces.map((surface) => (
                <div key={surface.key} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{surface.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{surface.targetFile}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {surface.modes.map((mode) => (
                        <Capsule key={`${surface.key}-${mode}`}>{mode}</Capsule>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300/82">
                    <p>editable fields：{surface.editableFields.join(" · ")}</p>
                    <p>patch preview：{surface.patchPreview.join(" / ")}</p>
                    <p>validation：{surface.validationChecks.join(" / ")}</p>
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard eyebrow="impact map" title="改动影响矩阵">
            <div className="space-y-4">
              {workbench.impactMatrix.map((item) => (
                <div key={item.surfaceKey} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-300/82">{item.why}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{item.riskLevel}</Capsule>
                      <Capsule>{item.affectedPresetKeys.length} presets</Capsule>
                      <Link href={buildDraftDetailHref(item.draftId)} className="inline-flex">
                        <Capsule>{item.draftId}</Capsule>
                      </Link>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-400">
                    <p>default modes：{item.defaultModes.join(" · ") || "-"}</p>
                    <p>linked drafts：{item.linkedContentDraftKeys.join(" · ") || "-"}</p>
                    <p>routes：{item.verificationRoutes.join(" · ")}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <SectionLabel>route quick links</SectionLabel>
                <div className="mt-3 flex flex-wrap gap-2">
                  {workbench.impactRoutes.map((route) => (
                    <Link key={route.route} href={route.route} className="inline-flex min-h-10 items-center justify-center rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                      {route.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.58fr_0.42fr]">
          <ReportCard eyebrow="cross impact / content to analysis" title="题库草案联动影响">
            <div className="space-y-4">
              {contentWorkbench.draftBlueprints.map((draft) => (
                <div key={draft.key} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{draft.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{draft.linkedQuestionSource}</p>
                      <Link href={buildDraftDetailHref(draft.draftId)} className="mt-1 inline-flex text-sm leading-7 text-stone-400 transition hover:text-stone-200">
                        {draft.draftId}
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{draft.mode}</Capsule>
                      <Capsule>{draft.questionDelta >= 0 ? `+${draft.questionDelta}` : draft.questionDelta} questions</Capsule>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-stone-300/82">{draft.summary}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <SectionLabel>patch focus</SectionLabel>
                      <div className="mt-3 space-y-2 text-sm leading-7 text-stone-300/82">
                        {draft.patchLines.slice(0, 3).map((line) => (
                          <p key={line.key}>{line.targetFile.split("/").pop()} · {line.label}</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <SectionLabel>presave gates</SectionLabel>
                      <div className="mt-3 space-y-2 text-sm leading-7 text-stone-300/82">
                        {draft.validations.slice(0, 3).map((item) => (
                          <p key={item.key}>{item.severity} · {item.detail}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard eyebrow="registry summary" title="当前 registry 摘要">
            <div className="space-y-4 text-sm leading-7 text-stone-300/82">
              <div>
                <p className="text-stone-100">prompt templates</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {workbench.promptTemplates.map((item) => (
                    <Capsule key={item.key}>{item.key}</Capsule>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-stone-100">report schemas</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {workbench.reportSchemas.map((item) => (
                    <Capsule key={item.key}>{item.key}</Capsule>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-stone-100">runtime presets</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {workbench.previewMatrix.map((item) => (
                    <Capsule key={item.key}>{item.key}</Capsule>
                  ))}
                </div>
              </div>
            </div>
          </ReportCard>
        </section>
      </div>
    </main>
  );
}
