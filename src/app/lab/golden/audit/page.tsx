import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { goldenAuditResults, goldenAuditSummary } from "@/lib/golden-audit";
import { buildGoldenBaselineDiff } from "@/lib/golden-baseline-diff";
import { goldenBaselineHistory } from "@/lib/golden-baseline-history";

type GoldenAuditPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function getBaselineHref(versionId: string) {
  return `/lab/golden/audit?baseline=${encodeURIComponent(versionId)}`;
}

function getFreezeCandidateHref(targetVersion: string, sourceBaselineVersion: string) {
  return `/api/internal/golden-freeze-candidate?version=${encodeURIComponent(targetVersion)}&sourceBaseline=${encodeURIComponent(sourceBaselineVersion)}`;
}

export default async function GoldenAuditPage({ searchParams }: GoldenAuditPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const baselineParam = Array.isArray(resolvedSearchParams.baseline)
    ? resolvedSearchParams.baseline[0]
    : resolvedSearchParams.baseline;
  const comparison = buildGoldenBaselineDiff(baselineParam);
  const { baselineSummary, diffResults, diffSummary, availableBaselines } = comparison;

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(189,218,255,0.12),transparent_23%),radial-gradient(circle_at_82%_18%,rgba(109,80,131,0.12),transparent_26%),radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(153,117,124,0.18),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] tracking-[0.46em] text-stone-300/65 uppercase">internal / reviewer audit</p>
              <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">黄金样本审阅差异面板</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-stone-300/82 md:text-lg">
                这页同时做两件事：一是检查当前输出是否满足黄金样本的最低预期，二是对比冻结基线，暴露 archetype、safety、top features 和 overview 是否发生漂移。
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm uppercase tracking-[0.2em]">
              <span className="rounded-full bg-emerald-400/10 px-4 py-3 text-emerald-200 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]">audit pass {goldenAuditSummary.passed}</span>
              <span className="rounded-full bg-rose-400/10 px-4 py-3 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.18)]">audit fail {goldenAuditSummary.failed}</span>
              <span className="rounded-full bg-sky-400/10 px-4 py-3 text-sky-200 shadow-[0_0_0_1px_rgba(125,211,252,0.16)]">baseline {baselineSummary.resolvedVersion}</span>
              <span className={`rounded-full px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] ${diffSummary.drifted === 0 ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-400/10 text-amber-200"}`}>drift {diffSummary.drifted}</span>
              {baselineSummary.isFallback ? (
                <span className="rounded-full bg-amber-400/10 px-4 py-3 text-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.16)]">fallback from {baselineSummary.requestedVersion}</span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <ReportCard eyebrow="baseline / selection" title="选择对照基线">
            <div className="flex flex-wrap gap-3">
              {availableBaselines.map((baseline) => {
                const active = baseline.id === baselineSummary.resolvedVersion;

                return (
                  <Link
                    key={baseline.id}
                    href={getBaselineHref(baseline.id)}
                    className={`inline-flex min-h-11 items-center rounded-full px-5 py-3 text-xs uppercase tracking-[0.2em] transition ${active ? "bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(192,220,249,0.92))] text-[#0b0d14]" : "bg-white/[0.04] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/[0.08] hover:text-stone-100"}`}
                  >
                    {baseline.id}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">active baseline</p>
                <h3 className="mt-4 text-xl leading-[1.35] text-stone-100">{baselineSummary.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-300/78">{baselineSummary.fixtureVersion} · {baselineSummary.total} samples</p>
                <p className="mt-2 text-sm leading-7 text-stone-500">冻结时间：{baselineSummary.frozenAt}</p>
                <p className="text-sm leading-7 text-stone-500">schema：{baselineSummary.schemaVersion}</p>
                <p className="text-sm leading-7 text-stone-500">prompt：{baselineSummary.promptVersion}</p>
              </div>

              <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">selection note</p>
                <p className="mt-4 text-sm leading-7 text-stone-300/78">
                  所有 drift 都基于当前选中的冻结版本计算。等 v0.2 生成后，这里可以同时保留 v0.1 与 v0.2，方便比对 prompt、mapping 或 safety rewrite 前后的变化。
                </p>
                <p className="mt-3 text-sm leading-7 text-stone-500">文件：{baselineSummary.filePath}</p>
              </div>
            </div>
          </ReportCard>

          <ReportCard eyebrow="freeze / checklist" title="下一次冻结前必须记录的东西">
            <div className="space-y-3 text-sm leading-7 text-stone-300/78">
              <p>1. 冻结触发原因：prompt rewrite、mapping 变化、safety copy 调整，还是 export/visual schema 升级。</p>
              <p>2. 样本覆盖范围：是否沿用全量 golden set，是否新增高风险、低信息或审美主导样本。</p>
              <p>3. 漂移裁定：哪些 drift 被允许，哪些 drift 一出现就必须阻断冻结。</p>
              <p>4. 工件同步：baseline JSON、审计截图、周报、状态板、share-card 版本是否一起更新。</p>
              <p>5. Signoff：谁确认了这次冻结可以作为新的回归锚点。</p>
            </div>
            <div className="mt-5 rounded-[22px] bg-white/[0.03] p-4 text-sm leading-7 text-stone-500 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
              详细流程见：<span className="text-stone-300">docs/benyuan-baseline-freeze-checklist-v0.1.md</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={getFreezeCandidateHref("v0.2", baselineSummary.resolvedVersion)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.05] px-5 py-3 text-xs uppercase tracking-[0.2em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.08]">
                查看 v0.2 候选 JSON
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </a>
              <a href={`${getFreezeCandidateHref("v0.2", baselineSummary.resolvedVersion)}&download=1`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-xs uppercase tracking-[0.2em] text-stone-300 transition hover:text-stone-100">
                下载候选冻结文件
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </a>
            </div>
          </ReportCard>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <ReportCard eyebrow="history / baseline" title="冻结基线时间线">
            <div className="space-y-4">
              {goldenBaselineHistory.map((entry) => {
                const active = entry.id === baselineSummary.resolvedVersion;

                return (
                  <div key={entry.version} className={`rounded-[24px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] ${active ? "bg-sky-400/10" : "bg-black/16"}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-3 py-2 text-[10px] tracking-[0.22em] uppercase shadow-[0_0_0_1px_rgba(125,211,252,0.16)] ${active ? "bg-[rgba(239,246,255,0.92)] text-[#0b0d14]" : "bg-sky-400/10 text-sky-200"}`}>{entry.id}</span>
                      <span className="text-sm text-stone-500">{entry.sampleCount} samples</span>
                      {entry.isCurrent ? <span className="text-sm text-stone-500">latest</span> : null}
                    </div>
                    <h3 className="mt-4 text-xl leading-[1.35] text-stone-100">{entry.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-stone-300/78">{entry.notes}</p>
                    <p className="mt-3 text-sm leading-7 text-stone-500">冻结时间：{entry.frozenAt}</p>
                    <p className="text-sm leading-7 text-stone-500">schema / prompt：{entry.schemaVersion} / {entry.promptVersion}</p>
                    <p className="text-sm leading-7 text-stone-500">signoff：{entry.reviewerSignoff}</p>
                  </div>
                );
              })}
            </div>
          </ReportCard>

          <ReportCard eyebrow="history / rationale" title="当前基线为什么被冻结">
            <div className="space-y-4 text-sm leading-7 text-stone-300/78">
              {goldenBaselineHistory
                .filter((entry) => entry.id === baselineSummary.resolvedVersion)
                .map((entry) => (
                  <div key={entry.id} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <p><span className="text-stone-500">freeze reason：</span>{entry.freezeReason}</p>
                    <p className="mt-3"><span className="text-stone-500">allowed drift：</span>{entry.allowedDrift}</p>
                    <p className="mt-3"><span className="text-stone-500">file：</span>{entry.filePath}</p>
                  </div>
                ))}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6">
          {goldenAuditResults.map((result, index) => {
            const diff = diffResults.find((item) => item.sampleId === result.sampleId);

            return (
              <ReportCard key={result.sampleId} eyebrow={`0${index + 1} / ${result.sampleId}`} title={result.title}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-4 py-2 text-xs tracking-[0.22em] uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] ${result.status === "pass" ? "bg-emerald-400/10 text-emerald-200" : "bg-rose-400/10 text-rose-200"}`}>
                    audit {result.status}
                  </span>
                  <span className={`rounded-full px-4 py-2 text-xs tracking-[0.22em] uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] ${diff?.status === "unchanged" ? "bg-sky-400/10 text-sky-200" : diff?.status === "drifted" ? "bg-amber-400/10 text-amber-200" : "bg-stone-400/10 text-stone-200"}`}>
                    baseline {diff?.status ?? "missing"}
                  </span>
                  <span className="text-sm text-stone-500">{result.passedChecks} passed / {result.failedChecks} failed · drift {diff?.driftCount ?? 0}</span>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  <div className="space-y-4">
                    {result.checks.map((check) => (
                      <div key={check.label} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">{check.label}</p>
                          <span className={`rounded-full px-3 py-1 text-[10px] tracking-[0.22em] uppercase ${check.passed ? "bg-emerald-400/10 text-emerald-200" : "bg-rose-400/10 text-rose-200"}`}>
                            {check.passed ? "pass" : "fail"}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-stone-500">期望：{check.expected}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-200/84">实际：{check.actual}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                      <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">baseline drift</p>
                      {diff && diff.drifts.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          {diff.drifts.map((drift) => (
                            <div key={drift.field} className="rounded-[18px] bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                              <p className="text-[11px] tracking-[0.28em] text-stone-500 uppercase">{drift.field}</p>
                              <p className="mt-2 text-sm leading-7 text-stone-500">baseline：{drift.baseline}</p>
                              <p className="mt-2 text-sm leading-7 text-stone-200/84">current：{drift.current}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm leading-7 text-stone-300/78">当前输出与冻结基线一致，尚未观察到结构性漂移。</p>
                      )}
                    </div>
                  </div>
                </div>
              </ReportCard>
            );
          })}
        </section>

        <div className="mt-10 flex flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-center">
          <Link href="/lab/golden" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(192,220,249,0.92))] px-7 py-3 text-sm tracking-[0.2em] text-[#0b0d14] uppercase transition hover:scale-[1.01]">
            返回回归面板
          </Link>
          <a href="/api/internal/golden-audit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm tracking-[0.18em] text-stone-300/86 uppercase transition hover:text-stone-100">
            查看 audit JSON
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
          </a>
          <a href={`/api/internal/golden-regression?baseline=${encodeURIComponent(baselineSummary.resolvedVersion)}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm tracking-[0.18em] text-stone-300/86 uppercase transition hover:text-stone-100">
            查看 baseline JSON
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
          </a>
          <a href={getFreezeCandidateHref("v0.2", baselineSummary.resolvedVersion)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm tracking-[0.18em] text-stone-300/86 uppercase transition hover:text-stone-100">
            查看候选冻结 JSON
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
          </a>
        </div>
      </div>
    </main>
  );
}
