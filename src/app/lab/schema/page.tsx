import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { diffAssessmentDefinitionSnapshots, listAssessmentDefinitionSnapshots, listAssessmentVersions } from "@/features/assessment";

const snapshots = listAssessmentDefinitionSnapshots();
const modes = [...new Set(snapshots.map((item) => item.mode))];
const modeGroups = modes.map((mode) => {
  const versions = listAssessmentVersions(mode);
  const defaultVersion = versions.find((version) => version.isDefault)?.version ?? versions[0]?.version;
  return {
    mode,
    versions,
    diffs: versions
      .filter((version) => version.version !== defaultVersion)
      .map((version) => diffAssessmentDefinitionSnapshots(mode, version.version, defaultVersion)),
  };
});

function DiffPill({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] tracking-[0.26em] text-stone-500 uppercase">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={`${label}-${value}`} className="rounded-full bg-white/[0.03] px-3 py-2 text-xs tracking-[0.14em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] uppercase">
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SchemaLabPage() {
  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(189,218,255,0.12),transparent_23%),radial-gradient(circle_at_82%_18%,rgba(109,80,131,0.12),transparent_26%),radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(120,138,176,0.18),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] tracking-[0.46em] text-stone-300/65 uppercase">internal / schema matrix</p>
              <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">题库结构面板</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-stone-300/82 md:text-lg">
                这里专门看本源测评结构本身：mode、version、phase、question 数、开放反思入口，以及默认版本状态。现在也开始支持版本差异卡片，后面扩到 v2 / v3 时可以直接看变化点。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/lab/runtime" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm tracking-[0.18em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                runtime 面板
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/golden" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm tracking-[0.18em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                golden 面板
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm uppercase tracking-[0.2em]">
            <span className="rounded-full bg-sky-400/10 px-4 py-3 text-sky-200 shadow-[0_0_0_1px_rgba(125,211,252,0.18)]">版本数 {snapshots.length}</span>
            <span className="rounded-full bg-white/[0.04] px-4 py-3 text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">modes {modes.join(" · ")}</span>
          </div>
        </section>

        <section className="mt-10 grid gap-6">
          {modeGroups.map((group) => (
            <ReportCard key={group.mode} eyebrow={`${group.mode} / diff`} title={`${group.mode} 版本对比`}>
              {group.diffs.length === 0 ? (
                <p className="text-sm leading-7 text-stone-400">当前这个 mode 还没有第二个版本可供对比。一旦你加上新的 version，这里会直接显示 question / phase / module / step 的差异。</p>
              ) : (
                <div className="grid gap-4">
                  {group.diffs.map((diff) => (
                    <div key={`${diff.baseVersion}-${diff.targetVersion}`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{diff.baseVersion} → {diff.targetVersion}</p>
                          <p className="mt-2 text-sm leading-7 text-stone-400">question delta {diff.questionCountDelta >= 0 ? `+${diff.questionCountDelta}` : diff.questionCountDelta} · step delta {diff.totalStepsDelta >= 0 ? `+${diff.totalStepsDelta}` : diff.totalStepsDelta} · storage key changed {diff.storageKeyChanged ? 'yes' : 'no'}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <DiffPill label="added questions" values={diff.addedQuestions} />
                        <DiffPill label="removed questions" values={diff.removedQuestions} />
                        <DiffPill label="added modules" values={diff.addedModules} />
                        <DiffPill label="removed modules" values={diff.removedModules} />
                        <DiffPill label="added phases" values={diff.addedPhases} />
                        <DiffPill label="removed phases" values={diff.removedPhases} />
                        <DiffPill label="added open reflections" values={diff.addedOpenReflections} />
                        <DiffPill label="removed open reflections" values={diff.removedOpenReflections} />
                      </div>
                      {diff.changedPhaseQuestionCounts.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          <p className="text-[11px] tracking-[0.26em] text-stone-500 uppercase">phase question count changes</p>
                          {diff.changedPhaseQuestionCounts.map((item) => (
                            <p key={item.phaseId} className="text-sm leading-7 text-stone-300/82">{item.phaseId}：{item.from} → {item.to}</p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </ReportCard>
          ))}
        </section>

        <section className="mt-10 grid gap-6">
          {snapshots.map((snapshot) => (
            <ReportCard key={`${snapshot.mode}-${snapshot.version}`} eyebrow={`${snapshot.mode} / ${snapshot.version}`} title={snapshot.title}>
              <div className="grid gap-6 md:grid-cols-[0.36fr_0.64fr]">
                <div className="space-y-4 text-sm leading-7 text-stone-300/78">
                  <div>
                    <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">summary</p>
                    <p className="mt-2">{snapshot.description}</p>
                    <p className="mt-2">默认版本：{snapshot.isDefaultVersion ? "yes" : "no"}</p>
                    <p>storage key：{snapshot.storageKey}</p>
                    <p>question count：{snapshot.questionCount}</p>
                    <p>total steps：{snapshot.totalSteps}</p>
                  </div>
                  <div>
                    <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">modules</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {snapshot.modules.map((moduleId) => (
                        <span key={moduleId} className="rounded-full bg-white/[0.03] px-3 py-2 text-xs tracking-[0.14em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] uppercase">
                          {moduleId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">phases</p>
                    <div className="mt-3 grid gap-3">
                      {snapshot.phases.map((phase) => (
                        <div key={phase.id} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{phase.label}</p>
                              <p className="mt-2 text-sm leading-7 text-stone-400">{phase.description}</p>
                            </div>
                            <span className="rounded-full bg-white/[0.04] px-3 py-2 text-[11px] tracking-[0.18em] text-stone-300 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
                              {phase.questionCount} q
                            </span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {phase.moduleIds.map((moduleId) => (
                              <span key={moduleId} className="rounded-full bg-white/[0.03] px-3 py-2 text-xs tracking-[0.14em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] uppercase">
                                {moduleId}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">question ids</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {snapshot.questionIds.map((questionId) => (
                        <span key={questionId} className="rounded-full bg-white/[0.03] px-3 py-2 text-xs tracking-[0.14em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] uppercase">
                          {questionId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ReportCard>
          ))}
        </section>
      </div>
    </main>
  );
}
