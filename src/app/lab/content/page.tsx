import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { InternalLabNav } from "@/components/internal-lab-nav";
import { LabRouteDraftPanel } from "@/components/lab-route-draft-panel";
import { analysisPromptTemplateConfig } from "@/config/analysis/prompt-templates";
import { analysisReportSchemaConfig } from "@/config/analysis/report-schemas";
import { analysisRuntimePreviewPresetConfig } from "@/config/analysis/runtime-preview-presets";
import { buildAssessmentContentMigrationChecklist, buildAssessmentContentWorkbench, diffAssessmentDefinitionSnapshots, diffAssessmentQuestionSources } from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
import { buildDraftDetailHref } from "@/lib/draft-routing";
import { listDraftSessionsForRoute, syncWorkbenchDraftSessions } from "@/lib/store";
import type { Mode } from "@/lib/types";

function asSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
}

function buildContentHref(current: URLSearchParams, updates: Record<string, string | null>) {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }

  const query = next.toString();
  return query ? `/lab/content?${query}` : "/lab/content";
}

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

function EditorShell({ title, content, accent }: { title: string; content: string; accent?: string }) {
  return (
    <div className="rounded-[24px] bg-[#09090c] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.26em] text-stone-500">{title}</p>
        {accent ? <Capsule>{accent}</Capsule> : null}
      </div>
      <pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap text-xs leading-6 text-stone-300/86">
        <code>{content}</code>
      </pre>
    </div>
  );
}

export default async function ContentPreviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedMode: Mode = asSingleValue(resolvedSearchParams.mode) === "deep" ? "deep" : "lite";

  const workbench = buildAssessmentContentWorkbench();
  const analysisWorkbench = buildAnalysisWorkbenchCatalog(workbench.draftBlueprints);
  await syncWorkbenchDraftSessions(workbench.draftBlueprints, analysisWorkbench.impactMatrix);
  const routeDrafts = await listDraftSessionsForRoute("/lab/content");
  const promptTemplates = Object.entries(analysisPromptTemplateConfig).map(([key, value]) => ({ key, ...value }));
  const reportSchemas = Object.entries(analysisReportSchemaConfig).map(([key, value]) => ({ key, ...value }));
  const defaultMap = workbench.defaultVersionMap.find((entry) => entry.mode === selectedMode) ?? workbench.defaultVersionMap[0];
  const versionOptions = defaultMap?.versions ?? [];
  const selectedVersionParam = asSingleValue(resolvedSearchParams.version);
  const selectedVersion = versionOptions.some((version) => version.version === selectedVersionParam)
    ? (selectedVersionParam as string)
    : (defaultMap?.defaultVersion ?? versionOptions[0]?.version ?? "lite.v1");
  const compareOptions = versionOptions.filter((version) => version.version !== selectedVersion);
  const compareVersionParam = asSingleValue(resolvedSearchParams.compare);
  const selectedCompareVersion = compareOptions.some((version) => version.version === compareVersionParam)
    ? compareVersionParam
    : (compareOptions[0]?.version ?? null);

  const selectedManifest = workbench.manifests.find((manifest) => manifest.mode === selectedMode && manifest.version === selectedVersion) ?? workbench.manifests[0];
  const compareManifest = selectedCompareVersion
    ? workbench.manifests.find((manifest) => manifest.mode === selectedMode && manifest.version === selectedCompareVersion) ?? null
    : null;
  const selectedSource = workbench.questionSources.find((source) => source.key === selectedManifest.questionSetKey) ?? workbench.questionSources[0];
  const compareSource = compareManifest
    ? workbench.questionSources.find((source) => source.key === compareManifest.questionSetKey) ?? null
    : null;
  const selectedManifestDiff = compareManifest ? diffAssessmentDefinitionSnapshots(selectedMode, compareManifest.version, selectedManifest.version) : null;
  const selectedQuestionSourceDiff = compareManifest ? diffAssessmentQuestionSources(selectedMode, compareManifest.version, selectedManifest.version) : null;
  const migrationChecklist = buildAssessmentContentMigrationChecklist(selectedManifestDiff, selectedQuestionSourceDiff);
  const selectedDraftBlueprint = selectedCompareVersion
    ? workbench.draftBlueprints.find((item) => item.mode === selectedMode && item.baseVersion === selectedVersion && item.targetVersion === selectedCompareVersion) ?? null
    : null;
  const linkedAnalysisDrafts = selectedDraftBlueprint
    ? analysisWorkbench.impactMatrix.filter((item) => item.linkedContentDraftKeys.includes(selectedDraftBlueprint.key))
    : [];

  const query = new URLSearchParams();
  query.set("mode", selectedMode);
  query.set("version", selectedVersion);
  if (selectedCompareVersion) query.set("compare", selectedCompareVersion);

  const selectedModeMatrix = workbench.modeMatrix.find((entry) => entry.mode === selectedMode) ?? workbench.modeMatrix[0];
  const modeQuestionSources = workbench.questionSources.filter((source) => source.mode === selectedMode);
  const modeManifestDiffs = workbench.manifestDiffs.filter((diff) => diff.mode === selectedMode);
  const modeSourceDiffs = workbench.questionSourceDiffs.filter((diff) => diff.mode === selectedMode);

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(189,218,255,0.12),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(109,80,131,0.12),transparent_28%),radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(123,153,183,0.16),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.46em] text-stone-300/65">internal / content preview</p>
              <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">内容预览台</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-stone-300/82 md:text-lg">
                这里把 assessment manifest、question source、prompt schema 和 runtime preset 放到同一张内容地图里，不直接改配置，但先把版本、差异、文件关系和迁移风险看清楚。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/lab/kernel-admin" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                kernel admin
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/kernel" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                kernel workbench
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/schema" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                schema
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/runtime" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                runtime
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/drafts" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                drafts
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/native-handoff" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                native handoff
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </div>
          </div>
        </section>


        <InternalLabNav current="/lab/content" className="mt-6" />
        <LabRouteDraftPanel routeTitle="内容预览台" items={routeDrafts} />
        <section className="mt-10 grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
          <ReportCard eyebrow="content / selector" title="当前查看上下文">
            <div className="space-y-5">
              <div>
                <SectionLabel>mode</SectionLabel>
                <div className="mt-3 flex flex-wrap gap-2">
                  {workbench.defaultVersionMap.map((entry) => (
                    <ControlLink
                      key={entry.mode}
                      href={buildContentHref(query, {
                        mode: entry.mode,
                        version: entry.defaultVersion,
                        compare: entry.versions.find((version) => version.version !== entry.defaultVersion)?.version ?? null,
                      })}
                      active={entry.mode === selectedMode}
                    >
                      {entry.mode}
                    </ControlLink>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>version</SectionLabel>
                <div className="mt-3 flex flex-wrap gap-2">
                  {versionOptions.map((version) => (
                    <ControlLink
                      key={version.version}
                      href={buildContentHref(query, {
                        version: version.version,
                        compare: versionOptions.find((item) => item.version !== version.version)?.version ?? null,
                      })}
                      active={version.version === selectedVersion}
                    >
                      {version.version}
                    </ControlLink>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>compare</SectionLabel>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ControlLink href={buildContentHref(query, { compare: null })} active={!selectedCompareVersion}>
                    no compare
                  </ControlLink>
                  {compareOptions.map((version) => (
                    <ControlLink key={version.version} href={buildContentHref(query, { compare: version.version })} active={version.version === selectedCompareVersion}>
                      {version.version}
                    </ControlLink>
                  ))}
                </div>
              </div>
            </div>
          </ReportCard>

          <ReportCard eyebrow="content / overview" title={`${selectedManifest.title} · 结构概览`}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <SectionLabel>selected manifest</SectionLabel>
                <p className="mt-3 text-sm leading-7 text-stone-300/82">{selectedManifest.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Capsule>{selectedManifest.version}</Capsule>
                  <Capsule>{selectedManifest.questionCount} questions</Capsule>
                  <Capsule>{selectedManifest.moduleCount} modules</Capsule>
                  <Capsule>{selectedManifest.openReflectionCount} open reflections</Capsule>
                </div>
                <p className="mt-4 text-sm leading-7 text-stone-400">storage：{selectedManifest.storageKey}</p>
                <p className="text-sm leading-7 text-stone-400">question source：{selectedManifest.questionSetKey}</p>
              </div>

              <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <SectionLabel>mode matrix</SectionLabel>
                <div className="mt-3 space-y-2 text-sm leading-7 text-stone-300/82">
                  <p>default version：{selectedModeMatrix.defaultVersion ?? "-"}</p>
                  <p>version count：{selectedModeMatrix.versionCount}</p>
                  <p>question range：{selectedModeMatrix.questionCountRange.min} → {selectedModeMatrix.questionCountRange.max}</p>
                  <p>phase ids：{selectedModeMatrix.phaseIds.join(" · ") || "-"}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedModeMatrix.sourceFiles.map((item) => (
                    <Capsule key={`${selectedMode}-${item}`}>{item.split("/").pop()}</Capsule>
                  ))}
                </div>
              </div>
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <ReportCard eyebrow="assessment / manifest" title="版本与题库映射">
            <div className="space-y-4">
              <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{selectedManifest.version}</p>
                    <p className="mt-2 text-sm leading-7 text-stone-400">{selectedManifest.sourceFile ?? "-"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Capsule>{selectedManifest.questionSetKey}</Capsule>
                    {selectedManifest.isDefault ? <Capsule>default</Capsule> : null}
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm leading-7 text-stone-300/82">
                  {selectedManifest.phaseQuestionCounts.map((phase) => (
                    <p key={`${selectedManifest.version}-${phase.phaseId}`}>
                      {phase.phaseId} · {phase.label}：{phase.questionCount}
                    </p>
                  ))}
                </div>
              </div>

              {compareManifest ? (
                <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{compareManifest.version}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{compareManifest.sourceFile ?? "-"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{compareManifest.questionSetKey}</Capsule>
                      {compareManifest.isDefault ? <Capsule>default</Capsule> : null}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm leading-7 text-stone-300/82">
                    {compareManifest.phaseQuestionCounts.map((phase) => (
                      <p key={`${compareManifest.version}-${phase.phaseId}`}>
                        {phase.phaseId} · {phase.label}：{phase.questionCount}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </ReportCard>

          <ReportCard eyebrow="assessment / question sources" title="当前 mode 的题库地图">
            <div className="grid gap-3">
              {modeQuestionSources.map((source) => {
                const active = source.key === selectedSource.key || source.key === compareSource?.key;
                return (
                  <div key={source.key} className={`rounded-[24px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] ${active ? "bg-[linear-gradient(135deg,rgba(130,163,198,0.14),rgba(255,255,255,0.04))]" : "bg-black/16"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{source.title}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{source.sourceFile}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Capsule>{source.questionCount} questions</Capsule>
                        <Capsule>{source.optionalQuestionCount} optional</Capsule>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-stone-300/82">{source.intent}</p>
                    <p className="mt-2 text-sm leading-7 text-stone-400">linked manifests：{source.linkedManifestVersions.join(" · ") || "-"}</p>
                    <p className="text-sm leading-7 text-stone-400">answer types：{source.answerTypes.join(" · ") || "-"}</p>
                    <p className="text-sm leading-7 text-stone-400">presentation：{source.presentationKinds.join(" · ") || "-"}</p>
                  </div>
                );
              })}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <ReportCard eyebrow="assessment / selected diff" title="当前对比视图">
            {!selectedManifestDiff || !selectedQuestionSourceDiff ? (
              <p className="text-sm leading-7 text-stone-400">当前没有启用版本对比，选择 compare 后这里会显示结构差异。</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Capsule>{selectedManifestDiff.baseVersion}</Capsule>
                    <Capsule>{selectedManifestDiff.targetVersion}</Capsule>
                    {selectedManifestDiff.storageKeyChanged ? <Capsule>storage changed</Capsule> : null}
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>question delta：{selectedManifestDiff.questionCountDelta}</p>
                    <p>step delta：{selectedManifestDiff.totalStepsDelta}</p>
                    <p>added modules：{selectedManifestDiff.addedModules.join(" · ") || "-"}</p>
                    <p>removed modules：{selectedManifestDiff.removedModules.join(" · ") || "-"}</p>
                    <p>added questions：{selectedManifestDiff.addedQuestions.join(" · ") || "-"}</p>
                    <p>removed questions：{selectedManifestDiff.removedQuestions.join(" · ") || "-"}</p>
                    <p>phase count changes：{selectedManifestDiff.changedPhaseQuestionCounts.map((item) => `${item.phaseId}:${item.from}->${item.to}`).join(" · ") || "-"}</p>
                  </div>
                </div>

                <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <SectionLabel>question source diff</SectionLabel>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>added answer types：{selectedQuestionSourceDiff.addedAnswerTypes.join(" · ") || "-"}</p>
                    <p>removed answer types：{selectedQuestionSourceDiff.removedAnswerTypes.join(" · ") || "-"}</p>
                    <p>added presentation：{selectedQuestionSourceDiff.addedPresentationKinds.join(" · ") || "-"}</p>
                    <p>removed presentation：{selectedQuestionSourceDiff.removedPresentationKinds.join(" · ") || "-"}</p>
                    <p>reordered questions：{selectedQuestionSourceDiff.changedQuestionPositions.slice(0, 6).map((item) => `${item.questionId}:${item.from}->${item.to}`).join(" · ") || "-"}</p>
                    <p>answer type mutations：{selectedQuestionSourceDiff.changedAnswerTypes.map((item) => `${item.questionId}:${item.from}->${item.to}`).join(" · ") || "-"}</p>
                    <p>presentation mutations：{selectedQuestionSourceDiff.changedPresentationKinds.map((item) => `${item.questionId}:${item.from}->${item.to}`).join(" · ") || "-"}</p>
                  </div>
                </div>

                <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <SectionLabel>migration checklist</SectionLabel>
                  <div className="mt-4 space-y-3">
                    {migrationChecklist.map((item) => (
                      <div key={item.key} className="rounded-[20px] bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                        <div className="flex flex-wrap gap-2">
                          <Capsule>{item.ownerType}</Capsule>
                          <Capsule>risk {item.riskLevel}</Capsule>
                        </div>
                        <p className="mt-3 text-sm uppercase tracking-[0.16em] text-stone-100">{item.title}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-300/82">{item.detail}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-400">验证：{item.verificationStep}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ReportCard>

          <ReportCard eyebrow="assessment / mode diff catalog" title="预置差异目录">
            <div className="space-y-4">
              {modeManifestDiffs.length === 0 && modeSourceDiffs.length === 0 ? (
                <p className="text-sm leading-7 text-stone-400">当前 mode 只有一个版本，还没有形成预置差异。</p>
              ) : null}

              {modeManifestDiffs.map((diff) => (
                <div key={`${diff.baseVersion}-${diff.targetVersion}`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{diff.baseVersion} → {diff.targetVersion}</p>
                    <div className="flex flex-wrap gap-2">
                      {diff.questionSetChanged ? <Capsule>source switched</Capsule> : null}
                      {diff.sourceFileChanged ? <Capsule>file changed</Capsule> : null}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-stone-400">{diff.baseSourceFile ?? "-"} → {diff.targetSourceFile ?? "-"}</p>
                </div>
              ))}

              {modeSourceDiffs.map((diff) => (
                <div key={`${diff.baseVersion}-${diff.targetVersion}-source`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{diff.baseVersion} → {diff.targetVersion}</p>
                  <p className="mt-3 text-sm leading-7 text-stone-300/82">新增题型：{diff.addedAnswerTypes.join(" · ") || "-"}</p>
                  <p className="text-sm leading-7 text-stone-300/82">新增展示：{diff.addedPresentationKinds.join(" · ") || "-"}</p>
                  <p className="text-sm leading-7 text-stone-400">位移题目：{diff.changedQuestionPositions.length}</p>
                </div>
              ))}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <ReportCard eyebrow="draft / patch blueprint" title="配置草案演练板">
            {!selectedDraftBlueprint ? (
              <p className="text-sm leading-7 text-stone-400">选择 compare 版本后，这里会生成一份 pseudo patch，用来模拟真正编辑器要改哪些文件、哪些校验要先跑。</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Capsule>{selectedDraftBlueprint.baseVersion}</Capsule>
                    <Capsule>{selectedDraftBlueprint.targetVersion}</Capsule>
                    <Capsule>{selectedDraftBlueprint.linkedQuestionSource}</Capsule>
                    <Capsule>{selectedDraftBlueprint.questionDelta >= 0 ? `+${selectedDraftBlueprint.questionDelta}` : selectedDraftBlueprint.questionDelta} questions</Capsule>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-stone-300/82">{selectedDraftBlueprint.summary}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-400">draft id：{selectedDraftBlueprint.draftId}</p>
                  <Link href={buildDraftDetailHref(selectedDraftBlueprint.draftId)} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                    打开草稿详情
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                  </Link>
                  <p className="mt-2 text-sm leading-7 text-stone-400">target files：{selectedDraftBlueprint.targetFiles.join(" · ")}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-400">validation summary：blocking {selectedDraftBlueprint.validationSummary.blocking} · warning {selectedDraftBlueprint.validationSummary.warning} · notice {selectedDraftBlueprint.validationSummary.notice}</p>
                </div>

                <div className="space-y-3">
                  {selectedDraftBlueprint.patchLines.map((line) => (
                    <div key={line.key} className="rounded-[20px] bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                      <div className="flex flex-wrap gap-2">
                        <Capsule>{line.changeType}</Capsule>
                        <Capsule>{line.targetFile.split("/").pop()}</Capsule>
                      </div>
                      <p className="mt-3 text-sm uppercase tracking-[0.16em] text-stone-100">{line.label}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-300/82">{line.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ReportCard>

          <ReportCard eyebrow="draft / presave validation" title="预保存校验队列">
            {!selectedDraftBlueprint ? (
              <p className="text-sm leading-7 text-stone-400">当前没有激活草案，预保存校验暂时为空。</p>
            ) : (
              <div className="space-y-3">
                {selectedDraftBlueprint.validations.map((item) => (
                  <div key={item.key} className="rounded-[20px] bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{item.severity}</Capsule>
                      <Capsule>{item.ownerType}</Capsule>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-stone-300/82">{item.detail}</p>
                  </div>
                ))}
                <div className="rounded-[20px] bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                  <p className="text-sm uppercase tracking-[0.16em] text-stone-100">linked routes</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedDraftBlueprint.linkedRoutes.map((route) => (
                      <Capsule key={route}>{route}</Capsule>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <ReportCard eyebrow="draft / patch json" title="Pseudo Patch JSON">
            {selectedDraftBlueprint ? (
              <EditorShell
                title="assessment draft patch"
                accent={selectedDraftBlueprint.key}
                content={JSON.stringify(selectedDraftBlueprint.patchDocument, null, 2)}
              />
            ) : (
              <p className="text-sm leading-7 text-stone-400">当前没有激活草案 patch，可先选择 compare 版本。</p>
            )}
          </ReportCard>

          <ReportCard eyebrow="draft / apply flow" title="Apply 前检查摘要">
            {selectedDraftBlueprint ? (
              <div className="space-y-4">
                <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <SectionLabel>apply order</SectionLabel>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>1. 更新 manifest / source 文件</p>
                    <p>2. 复核 schema / analysis mapping 契约</p>
                    <p>3. 跑 test / report / native handoff 的联动校验</p>
                  </div>
                </div>
                <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <SectionLabel>save gates</SectionLabel>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>blocking：{selectedDraftBlueprint.validationSummary.blocking}</p>
                    <p>warning：{selectedDraftBlueprint.validationSummary.warning}</p>
                    <p>notice：{selectedDraftBlueprint.validationSummary.notice}</p>
                    <p>routes：{selectedDraftBlueprint.linkedRoutes.join(" · ")}</p>
                  </div>
                </div>
                <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <SectionLabel>linked analysis drafts</SectionLabel>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-stone-300/82">
                    {linkedAnalysisDrafts.length === 0 ? <p>-</p> : linkedAnalysisDrafts.map((item) => <p key={item.draftId}>{item.draftId} · {item.title} · {item.riskLevel}</p>)}
                    {selectedDraftBlueprint ? (
                      <Link href={buildDraftDetailHref(selectedDraftBlueprint.draftId)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                        草稿详情
                        <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-7 text-stone-400">当前没有待应用的 patch。</p>
            )}
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <ReportCard eyebrow="analysis / prompts" title="Prompt Templates">
            <div className="space-y-3">
              {promptTemplates.map((template) => (
                <div key={template.key} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{template.key}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-400">{template.id} / {template.version}</p>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard eyebrow="analysis / schemas" title="Report Schemas">
            <div className="space-y-3">
              {reportSchemas.map((schema) => (
                <div key={schema.key} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{schema.key}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-400">{schema.id} / {schema.version}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-300/82">{schema.dimensionOrder.join(" → ")}</p>
                </div>
              ))}
            </div>
          </ReportCard>

          <ReportCard eyebrow="analysis / presets" title="Runtime Presets">
            <div className="space-y-3">
              {analysisRuntimePreviewPresetConfig.map((preset) => (
                <div key={preset.key} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{preset.key}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-400">{preset.label}</p>
                  <p className="mt-3 text-sm leading-7 text-stone-300/82">{preset.intent}</p>
                </div>
              ))}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <ReportCard eyebrow="readonly editor / assessment" title="Assessment Config 只读视图">
            <div className="space-y-4">
              <EditorShell title={selectedManifest.sourceFile ?? "src/config/assessment/version-manifests.ts"} accent="question source" content={JSON.stringify(selectedSource, null, 2)} />
              <EditorShell title="src/config/assessment/version-manifests.ts" accent={selectedManifest.version} content={JSON.stringify(selectedManifest, null, 2)} />
              {compareManifest ? <EditorShell title="compare manifest" accent={compareManifest.version} content={JSON.stringify(compareManifest, null, 2)} /> : null}
            </div>
          </ReportCard>

          <ReportCard eyebrow="readonly editor / diff + analysis" title="Diff 与内核配置只读视图">
            <div className="space-y-4">
              <EditorShell title="selected diff" accent={selectedCompareVersion ? `${selectedManifest.version} → ${selectedCompareVersion}` : "inactive"} content={JSON.stringify({ manifest: selectedManifestDiff, source: selectedQuestionSourceDiff }, null, 2)} />
              <EditorShell title="src/config/analysis/prompt-templates.ts" content={JSON.stringify(promptTemplates, null, 2)} />
              <EditorShell title="src/config/analysis/report-schemas.ts" content={JSON.stringify(reportSchemas, null, 2)} />
            </div>
          </ReportCard>
        </section>
      </div>
    </main>
  );
}
