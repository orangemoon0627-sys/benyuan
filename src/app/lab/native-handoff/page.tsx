import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { InternalLabNav } from "@/components/internal-lab-nav";
import { LabRouteDraftPanel } from "@/components/lab-route-draft-panel";
import {
  buildAssessmentContentWorkbench,
  buildAssessmentSchemaMigrationLedger,
  diffAssessmentNativeBlueprintSnapshots,
  getAssessmentDefinition,
  listAssessmentDefinitionSnapshots,
  listAssessmentVersions,
  serializeAssessmentQuestion,
} from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
import { buildAssessmentFlowContract, buildAssessmentNativeScreenMap } from "@/lib/assessment-client-contract";
import { getReleaseChainSnapshot } from "@/lib/release-chain";
import { buildNativeMigrationChecklist, buildNativeReferenceKit } from "@/lib/native-reference";
import { listDraftSessionsForRoute, syncWorkbenchDraftSessions } from "@/lib/store";

function Capsule({ children, className = "bg-white/[0.04] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" }: { children: ReactNode; className?: string }) {
  return <span className={`rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.18em] ${className}`}>{children}</span>;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">{children}</p>;
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

function riskTone(riskLevel: string) {
  if (riskLevel === "high") return "bg-rose-400/10 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.18)]";
  if (riskLevel === "medium") return "bg-amber-300/10 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.16)]";
  return "bg-emerald-400/10 text-emerald-200 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]";
}

function ChecklistCard({
  title,
  detail,
  ownerType,
  riskLevel,
  verificationStep,
}: {
  title: string;
  detail: string;
  ownerType: string;
  riskLevel: string;
  verificationStep: string;
}) {
  return (
    <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.16em] text-stone-100">{title}</p>
        <div className="flex flex-wrap gap-2">
          <Capsule>{ownerType}</Capsule>
          <Capsule className={riskTone(riskLevel)}>{riskLevel}</Capsule>
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-stone-300/82">{detail}</p>
      <p className="mt-3 text-sm leading-7 text-stone-400">验证：{verificationStep}</p>
    </div>
  );
}

function buildNativeHandoff(mode: "lite" | "deep", version?: string | null) {
  const definition = getAssessmentDefinition(mode, version);
  const flow = buildAssessmentFlowContract({
    totalSteps: definition.totalSteps,
    phases: definition.phases,
    questions: definition.questions.map((question) => serializeAssessmentQuestion(question)),
    validation: definition.validation,
    moduleLabels: definition.moduleLabels,
  });
  const native = buildAssessmentNativeScreenMap(flow);

  return {
    mode: definition.mode,
    version: definition.version,
    title: definition.title,
    description: definition.description,
    totalSteps: definition.totalSteps,
    native,
    referenceKit: buildNativeReferenceKit(native),
  };
}

export default async function NativeHandoffPage() {
  const contentWorkbench = buildAssessmentContentWorkbench();
  const analysisWorkbench = buildAnalysisWorkbenchCatalog(contentWorkbench.draftBlueprints);
  await syncWorkbenchDraftSessions(contentWorkbench.draftBlueprints, analysisWorkbench.impactMatrix);
  const routeDrafts = await listDraftSessionsForRoute("/lab/native-handoff");
  const migrationLedger = buildAssessmentSchemaMigrationLedger(contentWorkbench.draftBlueprints, analysisWorkbench.impactMatrix);
  const releaseSnapshot = await getReleaseChainSnapshot();
  const releaseLaneMap = new Map(releaseSnapshot.unifiedLanes.map((lane) => [lane.draftId, lane]));

  const snapshots = listAssessmentDefinitionSnapshots();
  const modes = [...new Set(snapshots.map((item) => item.mode))] as Array<"lite" | "deep">;
  const modeGroups = modes.map((mode) => {
    const versions = listAssessmentVersions(mode);
    const defaultVersion = versions.find((version) => version.isDefault)?.version ?? versions[0]?.version;
    const handoffs = versions.map((version) => buildNativeHandoff(mode, version.version));

    return {
      mode,
      versions,
      defaultVersion,
      handoffs,
      diffs: versions
        .filter((version) => version.version !== defaultVersion)
        .map((version) => {
          const diff = diffAssessmentNativeBlueprintSnapshots(mode, version.version, defaultVersion);
          return {
            version: version.version,
            diff,
            checklist: buildNativeMigrationChecklist(diff),
            handoff: buildNativeHandoff(mode, version.version),
          };
        }),
    };
  });

  const nativeImpactRows = migrationLedger
    .filter((item) => item.migrationCounts.nativeContractChanges > 0 || item.linkedAnalysisDrafts.length > 0)
    .sort((left, right) => right.migrationCounts.nativeContractChanges - left.migrationCounts.nativeContractChanges);

  const totalBlueprints = modeGroups.reduce((sum, group) => sum + group.handoffs.reduce((inner, handoff) => inner + handoff.native.blueprintCatalog.length, 0), 0);
  const totalScreens = modeGroups.reduce((sum, group) => sum + group.handoffs.reduce((inner, handoff) => inner + handoff.native.screenMap.length, 0), 0);

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(189,218,255,0.12),transparent_23%),radial-gradient(circle_at_82%_18%,rgba(109,80,131,0.12),transparent_26%),radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-7xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(120,138,176,0.18),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.46em] text-stone-300/65">internal / native handoff</p>
              <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">原生交接面板</h1>
              <p className="mt-5 max-w-4xl text-base leading-8 text-stone-300/82 md:text-lg">
                这里把 schema 变化真正落到 iOS/RN blueprint：你不仅能看到每个版本该怎么搭 screen，还能看到版本变更具体会改动哪些 blueprint contract、哪些 screen sequence、以及它会牵动哪些 analysis 与验证路由。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/lab/schema" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                schema 面板
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
              <Link href="/api/internal/native-handoff" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                native api
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </div>
          </div>
          <InternalLabNav current="/lab/native-handoff" className="mt-6" />
        </section>

        <LabRouteDraftPanel routeTitle="原生交接面板" items={routeDrafts} />

        <section className="mt-10 grid gap-6 xl:grid-cols-4">
          <ReportCard eyebrow="native" title="总览">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>snapshots：{snapshots.length}</p>
              <p>mode groups：{modeGroups.length}</p>
              <p>native-impact drafts：{nativeImpactRows.length}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="native" title="blueprints">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>all blueprints：{totalBlueprints}</p>
              <p>all screens：{totalScreens}</p>
              <p>default versions：{modeGroups.map((item) => `${item.mode}:${item.defaultVersion ?? "-"}`).join(" · ")}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="native" title="contract drift">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>sequence changes：{nativeImpactRows.reduce((sum, item) => sum + item.nativeDiff.changedSequenceSteps.length, 0)}</p>
              <p>contract changes：{nativeImpactRows.reduce((sum, item) => sum + item.nativeDiff.changedBlueprintContracts.length, 0)}</p>
              <p>linked analysis drafts：{nativeImpactRows.reduce((sum, item) => sum + item.linkedAnalysisDrafts.length, 0)}</p>
            </div>
          </ReportCard>
          <ReportCard eyebrow="native" title="handoff status">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>route drafts：{routeDrafts.length}</p>
              <p>blocking validations：{nativeImpactRows.reduce((sum, item) => sum + item.validationSummary.blocking, 0)}</p>
              <p>top route：{nativeImpactRows[0]?.linkedRoutes[0] ?? "-"}</p>
              <p>release lanes：{releaseSnapshot.summary.actionableDrafts}</p>
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.56fr_0.44fr]">
          <ReportCard eyebrow="native / migration" title="Schema → Native 迁移账本">
            <div className="space-y-4">
              {nativeImpactRows.length === 0 ? (
                <p className="text-sm leading-7 text-stone-500">当前没有显式 native contract drift。</p>
              ) : (
                nativeImpactRows.map((item) => {
                  const lane = releaseLaneMap.get(item.draftId);
                  return (
                  <div key={`${item.draftId}-native-ledger`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.title}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{item.baseVersion} → {item.targetVersion}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <CountPill label="seq" value={item.nativeDiff.changedSequenceSteps.length} emphasis={item.nativeDiff.changedSequenceSteps.length > 0 ? "alert" : "good"} />
                        <CountPill label="contracts" value={item.nativeDiff.changedBlueprintContracts.length} emphasis={item.nativeDiff.changedBlueprintContracts.length > 0 ? "alert" : "good"} />
                        <CountPill label="analysis" value={item.linkedAnalysisDrafts.length} emphasis={item.linkedAnalysisDrafts.length > 0 ? "alert" : "good"} />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                      <p>release owner：{lane?.recommendedOwner ?? "-"}</p>
                      <p>next best：{lane?.nextBestAction ?? "-"}</p>
                      <p>primary route：{lane?.primaryRoute?.title ?? "-"}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link href="/lab/schema" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                        schema 回跳
                        <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                      </Link>
                      <Link href="/lab/release-chain" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                        release lane
                        <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                      </Link>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm leading-7 text-stone-300/82">
                      <div className="rounded-[18px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                        <p className="text-stone-100">sequence drift</p>
                        <div className="mt-3 space-y-2">
                          {item.nativeDiff.changedSequenceSteps.length === 0 ? <p className="text-stone-500">no sequence drift</p> : item.nativeDiff.changedSequenceSteps.slice(0, 4).map((entry) => <p key={`${item.draftId}-seq-${entry.step}`}>step {entry.step + 1}：{entry.from} → {entry.to}</p>)}
                        </div>
                      </div>
                      <div className="rounded-[18px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                        <p className="text-stone-100">blueprint contract drift</p>
                        <div className="mt-3 space-y-2">
                          {item.nativeDiff.changedBlueprintContracts.length === 0 ? <p className="text-stone-500">no contract drift</p> : item.nativeDiff.changedBlueprintContracts.slice(0, 4).map((entry) => <p key={`${item.draftId}-contract-${entry.blueprint}`}>{entry.blueprint}：{entry.changedKeys.join(" · ")}</p>)}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </ReportCard>

          <ReportCard eyebrow="native / checklist" title="原生迁移动作池">
            <div className="space-y-4">
              {modeGroups.flatMap((group) => group.diffs).map((item) => {
                const linkedLane = releaseSnapshot.unifiedLanes.find((lane) => lane.schemaLedger?.targetVersion === item.version && lane.schemaLedger?.mode === item.handoff.mode);
                return (
                <div key={`${item.handoff.mode}-${item.version}-checklist`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.handoff.mode} · {item.version}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-400">{item.diff.baseVersion} → {item.diff.targetVersion}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Capsule>{item.handoff.native.blueprintCatalog.length} blueprints</Capsule>
                      <Capsule>{item.handoff.native.screenMap.length} screens</Capsule>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>linked release lane：{linkedLane?.title ?? "-"}</p>
                    <p>lane blockers：{linkedLane?.blockers.map((blocker) => blocker.title).join(" · ") || "-"}</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {item.checklist.map((check) => (
                      <ChecklistCard
                        key={`${item.version}-${check.key}`}
                        title={check.title}
                        detail={check.detail}
                        ownerType={check.ownerType}
                        riskLevel={check.riskLevel}
                        verificationStep={check.verificationStep}
                      />
                    ))}
                  </div>
                </div>
                );
              })}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6">
          {modeGroups.map((group) => (
            <ReportCard key={`${group.mode}-handoff`} eyebrow={`${group.mode} / handoff`} title={`${group.mode} Native Blueprint Catalog`}>
              <div className="space-y-6">
                {group.handoffs.map((handoff) => (
                  <div key={`${handoff.mode}-${handoff.version}`} className="rounded-[28px] bg-black/16 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{handoff.version}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{handoff.title}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-300/82">{handoff.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.defaultVersion === handoff.version ? <Capsule className="bg-emerald-400/10 text-emerald-200 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]">default</Capsule> : null}
                        <Capsule>{handoff.native.blueprintCatalog.length} blueprints</Capsule>
                        <Capsule>{handoff.native.screenMap.length} screens</Capsule>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-[0.48fr_0.52fr]">
                      <div>
                        <SectionLabel>blueprint catalog</SectionLabel>
                        <div className="mt-3 space-y-3">
                          {handoff.native.blueprintCatalog.map((contract) => (
                            <div key={`${handoff.version}-${contract.blueprint}`} className="rounded-[24px] bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{contract.blueprint}</p>
                                  <p className="mt-2 text-sm leading-7 text-stone-400">{contract.recommendedComponentName}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Capsule>{contract.recommendedContainer}</Capsule>
                                  <Capsule>{contract.primaryInputSlot}</Capsule>
                                </div>
                              </div>
                              <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                                <p>footer：{contract.footerSlot}</p>
                                <p>required：{contract.requiredBlocks.join(" · ")}</p>
                                <p>optional：{contract.optionalBlocks.join(" · ") || "-"}</p>
                              </div>
                              <div className="mt-4">
                                <SectionLabel>implementation checklist</SectionLabel>
                                <div className="mt-2 space-y-2 text-sm leading-7 text-stone-300/82">
                                  {contract.implementationChecklist.map((item) => (
                                    <p key={`${handoff.version}-${contract.blueprint}-${item.key}`}>{item.label}：{item.doneWhen}</p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <SectionLabel>screen handoff list</SectionLabel>
                          <div className="mt-3 grid gap-3">
                            {handoff.native.screenMap.map((screen) => (
                              <div key={`${handoff.version}-${screen.screenId}`} className="rounded-[24px] bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                  <div>
                                    <p className="text-sm uppercase tracking-[0.18em] text-stone-100">step {screen.step + 1} · {screen.blueprint}</p>
                                    <p className="mt-2 text-sm leading-7 text-stone-400">{screen.primaryPrompt}</p>
                                  </div>
                                  <Capsule>{screen.primaryActionLabel}</Capsule>
                                </div>
                                <div className="mt-4 grid gap-2 text-sm leading-7 text-stone-300/78 md:grid-cols-2">
                                  <p>component：{screen.componentTokens.topBarStyle} / {screen.componentTokens.primaryActionStyle}</p>
                                  <p>interaction：{screen.interactionTokens.control} / {screen.interactionTokens.layout}</p>
                                  <p>transition：{screen.interactionTokens.transition} / {screen.interactionTokens.haptics}</p>
                                  <p>content：{screen.contentBlocks.join(" · ")}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <SectionLabel>reference component kit</SectionLabel>
                          <div className="mt-3 rounded-[24px] bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="text-sm leading-7 text-stone-300/82">
                                <p>generated at：{handoff.referenceKit.generatedAt}</p>
                                <p>platform：{handoff.referenceKit.summary.platform}</p>
                                <p>router：{handoff.referenceKit.summary.router}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Capsule>{handoff.referenceKit.files.length} files</Capsule>
                                <Capsule>{handoff.referenceKit.summary.blueprintCount} blueprints</Capsule>
                                <Capsule>{handoff.referenceKit.summary.screenCount} screens</Capsule>
                              </div>
                            </div>
                            <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                              <p>directories：{handoff.referenceKit.summary.recommendedDirectories.join(" · ")}</p>
                              <p>categories：{handoff.referenceKit.summary.categories.map((item) => `${item.category}:${item.count}`).join(" · ")}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ReportCard>
          ))}
        </section>
      </div>
    </main>
  );
}
