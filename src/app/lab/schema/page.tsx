import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { InternalLabNav } from "@/components/internal-lab-nav";
import { LabRouteDraftPanel } from "@/components/lab-route-draft-panel";
import {
  buildAssessmentContentWorkbench,
  buildAssessmentSchemaMigrationLedger,
  diffAssessmentDefinitionSnapshots,
  diffAssessmentFlowSnapshots,
  diffAssessmentNativeBlueprintSnapshots,
  getAssessmentDefinitionSnapshot,
  listAssessmentDefinitionSnapshots,
  listAssessmentVersions,
} from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
import { getReleaseChainSnapshot } from "@/lib/release-chain";
import { listDraftSessionsForRoute, syncWorkbenchDraftSessions } from "@/lib/store";

function Capsule({ children, className = "bg-white/[0.04] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" }: { children: ReactNode; className?: string }) {
  return <span className={`rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.18em] ${className}`}>{children}</span>;
}

function DiffPill({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.26em] text-stone-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={`${label}-${value}`} className="rounded-full bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.14em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function CountPill({ label, value, emphasis = "normal" }: { label: string; value: string | number; emphasis?: "normal" | "alert" | "good" }) {
  const tone =
    emphasis === "alert"
      ? "bg-rose-400/10 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.18)]"
      : emphasis === "good"
        ? "bg-emerald-400/10 text-emerald-200 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]"
        : "bg-white/[0.04] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]";

  return <span className={`rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.18em] ${tone}`}>{label} {value}</span>;
}

export default async function SchemaLabPage() {
  const contentWorkbench = buildAssessmentContentWorkbench();
  const analysisWorkbench = buildAnalysisWorkbenchCatalog(contentWorkbench.draftBlueprints);
  await syncWorkbenchDraftSessions(contentWorkbench.draftBlueprints, analysisWorkbench.impactMatrix);
  const routeDrafts = await listDraftSessionsForRoute("/lab/schema");
  const migrationLedger = buildAssessmentSchemaMigrationLedger(contentWorkbench.draftBlueprints, analysisWorkbench.impactMatrix);
  const releaseSnapshot = await getReleaseChainSnapshot();
  const releaseLaneMap = new Map(releaseSnapshot.unifiedLanes.map((lane) => [lane.draftId, lane]));

  const snapshots = listAssessmentDefinitionSnapshots();
  const modes = [...new Set(snapshots.map((item) => item.mode))];
  const versionMatrix = contentWorkbench.modeMatrix;
  const modeGroups = modes.map((mode) => {
    const versions = listAssessmentVersions(mode);
    const defaultVersion = versions.find((version) => version.isDefault)?.version ?? versions[0]?.version;
    const comparisonRows = versions.map((version) => {
      const snapshot = getAssessmentDefinitionSnapshot(mode, version.version);
      const diff = version.version === defaultVersion ? null : diffAssessmentDefinitionSnapshots(mode, version.version, defaultVersion);
      const flowDiff = version.version === defaultVersion ? null : diffAssessmentFlowSnapshots(mode, version.version, defaultVersion);
      const nativeDiff = version.version === defaultVersion ? null : diffAssessmentNativeBlueprintSnapshots(mode, version.version, defaultVersion);
      return {
        version,
        snapshot,
        diff,
        flowDiff,
        nativeDiff,
      };
    });

    return {
      mode,
      defaultVersion,
      versions,
      comparisonRows,
      phaseCatalog: Array.from(
        new Map(
          comparisonRows.flatMap((row) => row.snapshot.phases.map((phase) => [phase.id, phase.label])),
        ).entries(),
      ).map(([id, label]) => ({ id, label })),
    };
  });

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(189,218,255,0.12),transparent_23%),radial-gradient(circle_at_82%_18%,rgba(109,80,131,0.12),transparent_26%),radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-7xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(120,138,176,0.18),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.46em] text-stone-300/65">internal / schema matrix</p>
              <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">题库结构面板</h1>
              <p className="mt-5 max-w-4xl text-base leading-8 text-stone-300/82 md:text-lg">
                这页现在不只是“列出版本”，而是把题库结构真正拆成三层来看：版本矩阵、phase 覆盖、flow/native diff。后面我们要换题型、调 phase、改 iOS 节奏时，先看这里就能知道会动到哪一层契约。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/api/internal/schema-matrix" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                schema api
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/native-handoff" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                native handoff
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/delivery" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                交付调度台
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/release-chain" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                发布链路台
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm uppercase tracking-[0.2em]">
            <CountPill label="snapshots" value={snapshots.length} />
            <CountPill label="modes" value={modes.join(" · ")} />
            <CountPill label="drafts linked" value={routeDrafts.length} emphasis={routeDrafts.length > 0 ? "alert" : "good"} />
          </div>
          <InternalLabNav current="/lab/schema" className="mt-6" />
        </section>

        <LabRouteDraftPanel routeTitle="题库结构面板" items={routeDrafts} />

        <section className="mt-10 grid gap-6 xl:grid-cols-4">
          <ReportCard eyebrow="matrix" title="版本总览">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>all snapshots：{snapshots.length}</p>
              <p>mode groups：{versionMatrix.length}</p>
              <p>default versions：{versionMatrix.map((item) => `${item.mode}:${item.defaultVersion ?? "-"}`).join(" · ")}</p>
              <p>migration ledgers：{migrationLedger.length}</p>
              <p>release lanes：{releaseSnapshot.summary.actionableDrafts}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="contract" title="question range">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              {versionMatrix.map((item) => (
                <p key={`${item.mode}-range`}>{item.mode}：{item.questionCountRange.min} - {item.questionCountRange.max}</p>
              ))}
            </div>
          </ReportCard>
          <ReportCard eyebrow="contract" title="phase coverage">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              {versionMatrix.map((item) => (
                <p key={`${item.mode}-phases`}>{item.mode}：{item.phaseIds.join(" · ")}</p>
              ))}
            </div>
          </ReportCard>
          <ReportCard eyebrow="contract" title="source files">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              {versionMatrix.map((item) => (
                <p key={`${item.mode}-sources`}>{item.mode}：{item.sourceFiles.join(" · ")}</p>
              ))}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6">
          {modeGroups.map((group) => (
            <ReportCard key={`${group.mode}-matrix`} eyebrow={`${group.mode} / version matrix`} title={`${group.mode} 版本矩阵`}>
              <div className="grid gap-4 xl:grid-cols-[0.36fr_0.64fr]">
                <div className="space-y-4 rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <p className="text-sm uppercase tracking-[0.18em] text-stone-100">mode fingerprint</p>
                  <div className="space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>default：{group.defaultVersion ?? "-"}</p>
                    <p>versions：{group.versions.length}</p>
                    <p>phase ids：{group.phaseCatalog.map((item) => item.id).join(" · ") || "-"}</p>
                    <p>question span：{Math.min(...group.comparisonRows.map((item) => item.snapshot.questionCount))} - {Math.max(...group.comparisonRows.map((item) => item.snapshot.questionCount))}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {group.comparisonRows.map(({ version, snapshot }) => (
                    <div key={`${group.mode}-${version.version}`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{version.version}</p>
                          <p className="mt-2 text-sm leading-7 text-stone-400">{version.title}</p>
                          <p className="mt-2 text-sm leading-7 text-stone-300/82">{version.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {version.isDefault ? <Capsule className="bg-emerald-400/10 text-emerald-200 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]">default</Capsule> : null}
                          <Capsule>{snapshot.questionCount} questions</Capsule>
                          <Capsule>{snapshot.totalSteps} steps</Capsule>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm leading-7 text-stone-300/82">
                        <div className="rounded-[18px] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                          <p className="text-stone-100">storage key</p>
                          <p className="mt-2 text-stone-400">{snapshot.storageKey}</p>
                        </div>
                        <div className="rounded-[18px] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                          <p className="text-stone-100">modules</p>
                          <p className="mt-2 text-stone-400">{snapshot.modules.join(" · ")}</p>
                        </div>
                        <div className="rounded-[18px] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                          <p className="text-stone-100">open reflections</p>
                          <p className="mt-2 text-stone-400">{snapshot.openReflectionQuestionIds.join(" · ") || "-"}</p>
                        </div>
                        <div className="rounded-[18px] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                          <p className="text-stone-100">phases</p>
                          <p className="mt-2 text-stone-400">{snapshot.phases.map((phase) => `${phase.id}:${phase.questionCount}`).join(" · ")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ReportCard>
          ))}
        </section>

        <section className="mt-10 grid gap-6">
          {modeGroups.map((group) => (
            <ReportCard key={`${group.mode}-phase-grid`} eyebrow={`${group.mode} / phase coverage`} title={`${group.mode} Phase 覆盖矩阵`}>
              <div className="overflow-hidden rounded-[24px] bg-black/16 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <div
                  className="grid border-b border-white/8 bg-white/[0.03] px-5 py-4 text-[11px] uppercase tracking-[0.2em] text-stone-400"
                  style={{ gridTemplateColumns: `minmax(180px,1.1fr) repeat(${group.comparisonRows.length}, minmax(140px,1fr))` }}
                >
                  <p>phase</p>
                  {group.comparisonRows.map(({ version }) => (
                    <p key={`${group.mode}-${version.version}-header`}>{version.version}</p>
                  ))}
                </div>
                <div>
                  {group.phaseCatalog.map((phase) => (
                    <div
                      key={`${group.mode}-${phase.id}`}
                      className="grid border-b border-white/6 px-5 py-4 text-sm leading-7 text-stone-300/82 last:border-b-0"
                      style={{ gridTemplateColumns: `minmax(180px,1.1fr) repeat(${group.comparisonRows.length}, minmax(140px,1fr))` }}
                    >
                      <div>
                        <p className="text-stone-100">{phase.id}</p>
                        <p className="text-stone-500">{phase.label}</p>
                      </div>
                      {group.comparisonRows.map(({ version, snapshot }) => {
                        const match = snapshot.phases.find((item) => item.id === phase.id);
                        return (
                          <div key={`${group.mode}-${phase.id}-${version.version}`}>
                            <p>{match ? `${match.questionCount} questions` : "-"}</p>
                            <p className="text-stone-500">{match ? match.moduleIds.join(" · ") : "missing"}</p>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </ReportCard>
          ))}
        </section>

        <section className="mt-10 grid gap-6">
          {modeGroups.map((group) => {
            const deltas = group.comparisonRows.filter((item) => !item.version.isDefault && item.diff && item.flowDiff && item.nativeDiff);
            if (deltas.length === 0) return null;

            return (
              <ReportCard key={`${group.mode}-deltas`} eyebrow={`${group.mode} / delta radar`} title={`${group.mode} 版本差异雷达`}>
                <div className="space-y-4">
                  {deltas.map(({ version, diff, flowDiff, nativeDiff }) => {
                    if (!diff || !flowDiff || !nativeDiff) return null;

                    return (
                      <div key={`${group.mode}-${version.version}-delta`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{version.version} vs {group.defaultVersion}</p>
                            <p className="mt-2 text-sm leading-7 text-stone-400">这个版本相对默认版的结构变化，会直接影响单题推进、review 回跳与 native blueprint。</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <CountPill label="qΔ" value={diff.questionCountDelta} emphasis={diff.questionCountDelta !== 0 ? "alert" : "good"} />
                            <CountPill label="stepΔ" value={diff.totalStepsDelta} emphasis={diff.totalStepsDelta !== 0 ? "alert" : "good"} />
                            <CountPill label="phase moves" value={flowDiff.changedStepPhaseIds.length} emphasis={flowDiff.changedStepPhaseIds.length > 0 ? "alert" : "good"} />
                            <CountPill label="native" value={nativeDiff.changedBlueprintContracts.length} emphasis={nativeDiff.changedBlueprintContracts.length > 0 ? "alert" : "good"} />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 xl:grid-cols-3">
                          <div className="rounded-[18px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                            <p className="text-sm uppercase tracking-[0.18em] text-stone-100">schema diff</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <CountPill label="added q" value={diff.addedQuestions.length} emphasis={diff.addedQuestions.length > 0 ? "alert" : "good"} />
                              <CountPill label="removed q" value={diff.removedQuestions.length} emphasis={diff.removedQuestions.length > 0 ? "alert" : "good"} />
                              <CountPill label="phase count" value={diff.changedPhaseQuestionCounts.length} emphasis={diff.changedPhaseQuestionCounts.length > 0 ? "alert" : "good"} />
                            </div>
                            <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300/82">
                              <p>storage key changed：{diff.storageKeyChanged ? "yes" : "no"}</p>
                              <DiffPill label="added phases" values={diff.addedPhases} />
                              <DiffPill label="removed phases" values={diff.removedPhases} />
                              <DiffPill label="added modules" values={diff.addedModules} />
                              <DiffPill label="removed modules" values={diff.removedModules} />
                            </div>
                          </div>

                          <div className="rounded-[18px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                            <p className="text-sm uppercase tracking-[0.18em] text-stone-100">flow diff</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <CountPill label="pacing" value={flowDiff.pacingChangedKeys.length} emphasis={flowDiff.pacingChangedKeys.length > 0 ? "alert" : "good"} />
                              <CountPill label="review" value={flowDiff.reviewChangedKeys.length} emphasis={flowDiff.reviewChangedKeys.length > 0 ? "alert" : "good"} />
                              <CountPill label="step title" value={flowDiff.changedStepTitles.length} emphasis={flowDiff.changedStepTitles.length > 0 ? "alert" : "good"} />
                            </div>
                            <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300/82">
                              <DiffPill label="pacing keys" values={flowDiff.pacingChangedKeys} />
                              <DiffPill label="review keys" values={flowDiff.reviewChangedKeys} />
                              <DiffPill label="added step keys" values={flowDiff.addedStepKeys.slice(0, 6)} />
                              <DiffPill label="removed step keys" values={flowDiff.removedStepKeys.slice(0, 6)} />
                            </div>
                          </div>

                          <div className="rounded-[18px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                            <p className="text-sm uppercase tracking-[0.18em] text-stone-100">native diff</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <CountPill label="seq moves" value={nativeDiff.changedSequenceSteps.length} emphasis={nativeDiff.changedSequenceSteps.length > 0 ? "alert" : "good"} />
                              <CountPill label="contract keys" value={nativeDiff.changedBlueprintContracts.length} emphasis={nativeDiff.changedBlueprintContracts.length > 0 ? "alert" : "good"} />
                              <CountPill label="added blueprints" value={nativeDiff.addedBlueprints.length} emphasis={nativeDiff.addedBlueprints.length > 0 ? "alert" : "good"} />
                            </div>
                            <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300/82">
                              <DiffPill label="added blueprints" values={nativeDiff.addedBlueprints} />
                              <DiffPill label="removed blueprints" values={nativeDiff.removedBlueprints} />
                              <DiffPill label="added sequence" values={nativeDiff.addedSequenceBlueprints} />
                              <DiffPill label="removed sequence" values={nativeDiff.removedSequenceBlueprints} />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 xl:grid-cols-3 text-sm leading-7 text-stone-300/82">
                          <div className="rounded-[18px] bg-white/[0.02] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                            <p className="text-stone-100">phase remap</p>
                            <div className="mt-3 space-y-2">
                              {flowDiff.changedStepPhaseIds.length === 0 ? <p className="text-stone-500">no phase remap</p> : flowDiff.changedStepPhaseIds.slice(0, 6).map((item) => <p key={`${version.version}-phase-${item.step}`}>step {item.step + 1}：{item.from} → {item.to}</p>)}
                            </div>
                          </div>
                          <div className="rounded-[18px] bg-white/[0.02] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                            <p className="text-stone-100">question title drift</p>
                            <div className="mt-3 space-y-2">
                              {flowDiff.changedStepTitles.length === 0 ? <p className="text-stone-500">no title drift</p> : flowDiff.changedStepTitles.slice(0, 4).map((item) => <p key={`${version.version}-title-${item.step}`}>step {item.step + 1}：{item.from} → {item.to}</p>)}
                            </div>
                          </div>
                          <div className="rounded-[18px] bg-white/[0.02] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                            <p className="text-stone-100">native contract drift</p>
                            <div className="mt-3 space-y-2">
                              {nativeDiff.changedBlueprintContracts.length === 0 ? <p className="text-stone-500">no native contract drift</p> : nativeDiff.changedBlueprintContracts.slice(0, 4).map((item) => <p key={`${version.version}-native-${item.blueprint}`}>{item.blueprint}：{item.changedKeys.join(" · ")}</p>)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ReportCard>
            );
          })}
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.56fr_0.44fr]">
          <ReportCard eyebrow="migration / ledger" title="Step / Question 迁移账本">
            <div className="space-y-4">
              {migrationLedger.map((item) => {
                const lane = releaseLaneMap.get(item.draftId);
                return (
                <div key={item.draftId} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{item.baseVersion} → {item.targetVersion} · {item.draftId}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <CountPill label="q move" value={item.migrationCounts.questionMoves} emphasis={item.migrationCounts.questionMoves > 0 ? "alert" : "good"} />
                      <CountPill label="phase" value={item.migrationCounts.phaseMoves} emphasis={item.migrationCounts.phaseMoves > 0 ? "alert" : "good"} />
                      <CountPill label="native" value={item.migrationCounts.nativeContractChanges} emphasis={item.migrationCounts.nativeContractChanges > 0 ? "alert" : "good"} />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>release owner：{lane?.recommendedOwner ?? "-"}</p>
                    <p>next best：{lane?.nextBestAction ?? "-"}</p>
                    <p>primary route：{lane?.primaryRoute?.title ?? "-"}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href="/lab/native-handoff" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                      native 回跳
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                    </Link>
                    <Link href="/lab/release-chain" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                      release lane
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm leading-7 text-stone-300/82">
                    <div className="rounded-[18px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                      <p className="text-stone-100">question migration</p>
                      <div className="mt-3 space-y-2">
                        {item.sourceDiff.changedQuestionPositions.length === 0 && item.flowDiff.changedStepQuestionIds.length === 0 ? (
                          <p className="text-stone-500">no question migration</p>
                        ) : (
                          <>
                            {item.sourceDiff.changedQuestionPositions.slice(0, 4).map((entry) => <p key={`${item.draftId}-qp-${entry.questionId}`}>{entry.questionId}：{entry.from} → {entry.to}</p>)}
                            {item.flowDiff.changedStepQuestionIds.slice(0, 4).map((entry) => <p key={`${item.draftId}-sq-${entry.step}`}>step {entry.step + 1}：{entry.from ?? "-"} → {entry.to ?? "-"}</p>)}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="rounded-[18px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                      <p className="text-stone-100">interaction drift</p>
                      <div className="mt-3 space-y-2">
                        {item.sourceDiff.changedAnswerTypes.length === 0 && item.sourceDiff.changedPresentationKinds.length === 0 && item.flowDiff.changedStepNativeControls.length === 0 ? (
                          <p className="text-stone-500">no interaction drift</p>
                        ) : (
                          <>
                            {item.sourceDiff.changedAnswerTypes.slice(0, 3).map((entry) => <p key={`${item.draftId}-at-${entry.questionId}`}>{entry.questionId}：{entry.from} → {entry.to}</p>)}
                            {item.sourceDiff.changedPresentationKinds.slice(0, 3).map((entry) => <p key={`${item.draftId}-pk-${entry.questionId}`}>{entry.questionId}：{entry.from} → {entry.to}</p>)}
                            {item.flowDiff.changedStepNativeControls.slice(0, 3).map((entry) => <p key={`${item.draftId}-nc-${entry.step}`}>step {entry.step + 1}：{entry.from} → {entry.to}</p>)}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </ReportCard>

          <ReportCard eyebrow="impact / chain" title="Schema → Draft → Route 影响链">
            <div className="space-y-4">
              {migrationLedger.map((item) => {
                const lane = releaseLaneMap.get(item.draftId);
                return (
                <div key={`${item.draftId}-impact`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.baseVersion} → {item.targetVersion}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-300/82">{item.linkedRoutes.join(" · ")}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <CountPill label="analysis drafts" value={item.linkedAnalysisDrafts.length} emphasis={item.linkedAnalysisDrafts.length > 0 ? "alert" : "good"} />
                      <CountPill label="blocking" value={item.validationSummary.blocking} emphasis={item.validationSummary.blocking > 0 ? "alert" : "good"} />
                    </div>
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300/82">
                    <p>target files：{item.targetFiles.join(" · ")}</p>
                    <p>linked analysis：{item.linkedAnalysisDrafts.map((draft) => `${draft.title}(${draft.surfaceKey})`).join(" · ") || "-"}</p>
                    <p>verification routes：{Array.from(new Set(item.linkedAnalysisDrafts.flatMap((draft) => draft.verificationRoutes))).join(" · ") || "-"}</p>
                    <p>release owner：{lane?.recommendedOwner ?? "-"}</p>
                    <p>lane blockers：{lane?.blockers.map((blocker) => blocker.title).join(" · ") || "-"}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href="/lab/release-chain" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                      打开发布链
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                    </Link>
                    <Link href="/lab/native-handoff" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                      打开 native
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                    </Link>
                  </div>
                </div>
                );
              })}
            </div>
          </ReportCard>
        </section>
      </div>
    </main>
  );
}
