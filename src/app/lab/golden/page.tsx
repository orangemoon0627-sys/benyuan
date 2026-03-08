import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { goldenAuditSummary } from "@/lib/golden-audit";
import { goldenRegressionSnapshots } from "@/lib/golden-regression";
import { getFeatureLabel } from "@/lib/report-builder";

const confidenceLabel: Record<string, string> = {
  low: "初步草图",
  medium: "中等聚焦",
  high: "较高聚焦",
};

export default function GoldenLabPage() {
  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(189,218,255,0.12),transparent_23%),radial-gradient(circle_at_82%_18%,rgba(109,80,131,0.12),transparent_26%),radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(153,117,124,0.18),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] tracking-[0.46em] text-stone-300/65 uppercase">internal / golden regression</p>
              <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">黄金样本回归面板</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-stone-300/82 md:text-lg">
                这里保存 6 组 MVP 阶段的标准样本，用于持续检查 feature mapping、report 生成、safety flags 和 archetype 是否偏离预期。
              </p>
            </div>
            <Link href="/lab/golden/audit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm tracking-[0.18em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
              审阅差异面板
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm uppercase tracking-[0.2em]">
            <span className="rounded-full bg-emerald-400/10 px-4 py-3 text-emerald-200 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]">pass {goldenAuditSummary.passed}</span>
            <span className="rounded-full bg-rose-400/10 px-4 py-3 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.18)]">fail {goldenAuditSummary.failed}</span>
          </div>
        </section>

        <section className="mt-10 grid gap-6">
          {goldenRegressionSnapshots.map((snapshot, index) => (
            <ReportCard key={snapshot.sampleId} eyebrow={`0${index + 1} / ${snapshot.sampleId}`} title={snapshot.title}>
              <div className="grid gap-6 md:grid-cols-[0.34fr_0.66fr]">
                <div className="space-y-4 text-sm leading-7 text-stone-300/78">
                  <div>
                    <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">sample profile</p>
                    <p className="mt-2">{snapshot.summary}</p>
                    <p className="mt-2 text-stone-500">预期：{snapshot.expectation}</p>
                  </div>
                  <div>
                    <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">runtime output</p>
                    <p className="mt-2">原型：{snapshot.report.archetype.name}</p>
                    <p>置信度：{confidenceLabel[snapshot.report.confidenceBand] ?? snapshot.report.confidenceBand}</p>
                    <p>安全标记：{snapshot.report.safetyFlags.join(" · ")}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">top features</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {snapshot.topFeatures.map((feature) => (
                        <span key={feature.key} className="rounded-full bg-white/[0.03] px-3 py-2 text-xs tracking-[0.14em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] uppercase">
                          {getFeatureLabel(feature.key)} · {Math.round(feature.score * 100)}%
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                      <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">tensions</p>
                      <div className="mt-3 space-y-2 text-sm leading-7 text-stone-300/78">
                        {snapshot.report.tensions.map((tension) => (
                          <p key={tension.tensionId}>{tension.name}</p>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                      <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">overview excerpt</p>
                      <p className="mt-3 text-sm leading-7 text-stone-300/78">{snapshot.report.overview}</p>
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
