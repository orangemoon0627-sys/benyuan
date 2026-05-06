import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { InternalLabNav } from "@/components/internal-lab-nav";
import { getBenyuanStatusSnapshot } from "@/lib/benyuan-status";
import { benyuanBetaFreezeCurrent } from "@/lib/benyuan-beta-freeze";

function formatDateTime(value: string | null | undefined) {
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

function modeTone(mode: string | undefined) {
  if (mode === "live") return "text-emerald-300";
  if (mode === "fallback") return "text-amber-300";
  return "text-stone-400";
}

function readinessTone(status: string) {
  if (status === "ready") return "text-emerald-300";
  if (status === "pending_real_device") return "text-amber-200";
  return "text-rose-300";
}

function readinessLabel(status: string) {
  if (status === "ready") return "可继续推进 pilot";
  if (status === "pending_real_device") return "自动化已稳，待补真机";
  return "暂不建议继续外扩";
}

function basename(value: string) {
  return value.split("/").filter(Boolean).pop() ?? value;
}

export default async function LabStatusPage() {
  const snapshot = await getBenyuanStatusSnapshot();
  const latest = snapshot.latestBenchmark;
  const baseline = snapshot.latestFullBaseline;
  const regression = snapshot.regression;
  const ios = snapshot.ios;

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(189,218,255,0.12),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(109,80,131,0.12),transparent_28%),radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(123,153,183,0.16),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <p className="text-[11px] uppercase tracking-[0.46em] text-stone-300/65">internal / benyuan status</p>
          <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">本源状态面板</h1>
          <p className="mt-5 max-w-4xl text-base leading-8 text-stone-300/82 md:text-lg">
            这里不只看链路是否通，还直接显示当前结果引擎版本、最近一次 benchmark、内容回归状态、pilot 判断和 iOS 壳级验收进度。
          </p>
          <InternalLabNav current="/lab/status" className="mt-6" />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-4">
          <ReportCard eyebrow="runtime" title="Provider 运行态">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>{snapshot.runtime.provider} · {snapshot.runtime.model}</p>
              <p>{snapshot.runtime.baseUrl ?? "base url not configured"}</p>
              <p>{snapshot.runtime.liveProviderEnabled ? "live enabled" : "fallback only"} · {snapshot.runtime.wireApi}</p>
              <p>{snapshot.runtime.apiKeyConfigured ? "api key ready" : "api key missing"} · {Math.round(snapshot.runtime.softTimeoutMs / 1000)}s timeout</p>
            </div>
          </ReportCard>

          <ReportCard eyebrow="engine" title="结果引擎版本">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>{snapshot.reportEngine.mode}</p>
              <p>prompt：{snapshot.reportEngine.promptVersion}</p>
              <p>normalize：{snapshot.reportEngine.normalizationVersion}</p>
              <p>safety：{snapshot.reportEngine.safetyVersion}</p>
              <p>delta：{basename(snapshot.reportEngine.deltaDoc)}</p>
            </div>
          </ReportCard>

          <ReportCard eyebrow="pilot" title="当前 pilot 判断">
            <div className="space-y-3 text-sm leading-7 text-stone-300/82">
              <p className={`text-base ${readinessTone(snapshot.pilotReadiness.status)}`}>{readinessLabel(snapshot.pilotReadiness.status)}</p>
              <p>{snapshot.pilotReadiness.summary}</p>
              <p>freeze 对齐：{snapshot.freezeReference.benchmarkAligned ? "yes" : "no"}</p>
            </div>
          </ReportCard>

          <ReportCard eyebrow="constellation" title="最近成功星图">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>{snapshot.latestConstellation?.archetype ?? "--"}</p>
              <p>{snapshot.latestConstellation?.topDimension ?? "--"}</p>
              <p>{snapshot.latestConstellation?.firstTension ?? "--"}</p>
              <p>{formatDateTime(snapshot.latestConstellation?.createdAt)}</p>
              {snapshot.latestConstellation ? (
                <Link href={`/constellation?constellation_id=${snapshot.latestConstellation.constellationId}`} className="inline-flex items-center gap-2 text-stone-100 transition hover:text-white">
                  打开星图
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                </Link>
              ) : null}
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <ReportCard eyebrow="benchmark / latest" title="最近一轮运行详情">
            {latest ? (
              <div className="space-y-5">
                <div className="rounded-[24px] bg-black/18 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1 text-sm leading-7 text-stone-300/82">
                      <p>time：{formatDateTime(latest.generatedAt)}</p>
                      <p>packs：{latest.selectedPacks.join(" / ") || "--"}</p>
                      <p>file：{latest.fileName}</p>
                    </div>
                    <div className="space-y-1 text-sm leading-7 text-stone-300/82">
                      <p>stages：{snapshot.latestBenchmarkHealth?.liveStages ?? 0}/{snapshot.latestBenchmarkHealth?.totalStages ?? 0} live</p>
                      <p>fallback：{snapshot.latestBenchmarkHealth?.fallbackStages ?? 0}</p>
                      <p>avg total：{snapshot.latestBenchmarkHealth?.averageDuration ?? "--"}s</p>
                    </div>
                  </div>
                </div>

                {latest.results.map((result) => (
                  <div key={`${latest.fileName}-${result.pack}`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-stone-100">pack {result.pack}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{result.label ?? result.archetype ?? "--"}</p>
                      </div>
                      <div className="text-right text-xs leading-6 text-stone-400">
                        <p>total {result.durations?.total ?? "--"}s</p>
                        <p>{result.ids?.constellation_id ?? "no constellation"}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {[
                        { label: "multimodal", runtime: result.runtime?.multimodal, duration: result.durations?.multimodal },
                        { label: "theater", runtime: result.runtime?.theater, duration: result.durations?.theater_generate },
                        { label: "constellation", runtime: result.runtime?.constellation, duration: result.durations?.constellation_generate },
                      ].map((stage) => (
                        <div key={`${result.pack}-${stage.label}`} className="rounded-[20px] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                          <p className="text-xs uppercase tracking-[0.16em] text-stone-300">{stage.label}</p>
                          <p className={`mt-2 text-sm ${modeTone(stage.runtime?.mode)}`}>{stage.runtime?.mode ?? "--"}</p>
                          <p className="mt-1 text-xs leading-6 text-stone-400">{stage.duration ?? "--"}s</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-stone-400">当前还没有 benchmark 输出。</p>
            )}
          </ReportCard>

          <div className="grid gap-6">
            <ReportCard eyebrow="regression" title="内容层回归可见性">
              <div className="space-y-4 text-sm leading-7 text-stone-300/82">
                <div className="rounded-[24px] bg-black/18 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <p>golden regression：{formatDateTime(regression.goldenRegression?.generatedAt)}</p>
                  <p>baseline：{regression.goldenRegression?.baseline?.resolvedVersion ?? "--"}</p>
                  <p>prompt：{regression.goldenRegression?.baseline?.promptVersion ?? "--"}</p>
                  <p>diff：{regression.goldenRegression?.diffSummary?.drifted ?? "--"} drift / {regression.goldenRegression?.diffSummary?.missingBaseline ?? "--"} missing</p>
                </div>
                <div className="rounded-[24px] bg-black/18 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <p>golden audit：{formatDateTime(regression.goldenAudit?.generatedAt)}</p>
                  <p>passed：{regression.goldenAudit?.passed ?? "--"} / {regression.goldenAudit?.total ?? "--"}</p>
                  <p>failed：{regression.goldenAudit?.failed ?? "--"}</p>
                </div>
              </div>
            </ReportCard>

            <ReportCard eyebrow="pilot / checklist" title="推进前最后一眼">
              <div className="space-y-3 text-sm leading-7 text-stone-300/82">
                {snapshot.pilotReadiness.checklist.map((item) => (
                  <div key={item.label} className="rounded-[20px] bg-black/18 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                    <div className="flex items-start justify-between gap-3">
                      <p className={item.ok ? "text-emerald-200" : "text-amber-200"}>{item.label}</p>
                      <span className="text-xs uppercase tracking-[0.16em] text-stone-500">{item.ok ? "ok" : "pending"}</span>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-stone-400">{item.detail}</p>
                  </div>
                ))}
              </div>
            </ReportCard>
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <ReportCard eyebrow="fallback / trace" title="最近一次 fallback 错误链">
            {snapshot.recentFallback ? (
              <div className="space-y-4 text-sm leading-7 text-stone-300/82">
                <div className="rounded-[24px] bg-black/18 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <p>pack：{snapshot.recentFallback.pack ?? "--"}</p>
                  <p>stage：{snapshot.recentFallback.stageLabel}</p>
                  <p>attempt：{snapshot.recentFallback.attempt ?? "--"}</p>
                  <p>recorded：{formatDateTime(snapshot.recentFallback.recordedAt ?? snapshot.recentFallback.generatedAt)}</p>
                  <p className="mt-3 break-words text-amber-200">{snapshot.recentFallback.error ?? "--"}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm leading-7 text-stone-300/82">
                <p>最近 benchmark 没有记录到 fallback 事件。</p>
                <p>如果后续出现 provider 抖动，这里会直接显示 pack / stage / error chain。</p>
              </div>
            )}
          </ReportCard>

          <ReportCard eyebrow="ios / readiness" title="iOS 壳级验收状态">
            <div className="space-y-4 text-sm leading-7 text-stone-300/82">
              <div className="rounded-[24px] bg-black/18 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <p>regression：{formatDateTime(ios.regression?.generatedAt)}</p>
                <p>checks：{ios.regression?.passed ?? "--"} / {ios.regression?.total ?? "--"}</p>
                <p>failed：{ios.regression?.failed ?? "--"}</p>
              </div>
              <div className="rounded-[24px] bg-black/18 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <p>native smoke：{formatDateTime(ios.nativeSmoke?.generatedAt)}</p>
                <p>device：{ios.nativeSmoke?.deviceName ?? "--"}</p>
                <p>bundle：{ios.nativeSmoke?.bundleId ?? "--"}</p>
                <p className="text-amber-200">真机 camera/library allow-deny-cancel 仍待人工补齐。</p>
              </div>
              <Link href="/lab/native-handoff" className="inline-flex items-center gap-2 text-stone-100 transition hover:text-white">
                打开 native handoff
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </div>
          </ReportCard>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <ReportCard eyebrow="freeze / beta" title="当前 beta 冻结参照">
            <div className="space-y-3 text-sm leading-7 text-stone-300/82">
              <p>freeze：{benyuanBetaFreezeCurrent.freezeId}</p>
              <p>snapshot：{basename(benyuanBetaFreezeCurrent.benchmarkSnapshot)}</p>
              <p>archive：{basename(benyuanBetaFreezeCurrent.archiveTarball)}</p>
              <p>doc：{basename(benyuanBetaFreezeCurrent.docs.freezeDoc)}</p>
              <p>current full baseline：{baseline?.fileName ?? "--"}</p>
            </div>
          </ReportCard>

          <ReportCard eyebrow="latest / result" title="最近星图摘要">
            {snapshot.latestConstellation ? (
              <div className="space-y-3 text-sm leading-7 text-stone-300/82">
                <p>id：{snapshot.latestConstellation.constellationId}</p>
                <p>archetype：{snapshot.latestConstellation.archetype}</p>
                <p>support tone：{snapshot.latestConstellation.supportTone}</p>
                <p>narrative：{snapshot.latestConstellation.paragraphCount} 段</p>
                <p>recommendations：{snapshot.latestConstellation.recommendationCount} 条</p>
              </div>
            ) : (
              <p className="text-sm leading-7 text-stone-400">当前还没有可展示的星图摘要。</p>
            )}
          </ReportCard>
        </section>

        {baseline ? (
          <section className="mt-10">
            <ReportCard eyebrow="baseline / frozen" title="当前可信全量基线">
              <div className="mb-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-[20px] bg-black/18 px-4 py-4 text-sm leading-7 text-stone-300/82 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                  <p>generated：{formatDateTime(baseline.generatedAt)}</p>
                  <p>packs：{baseline.selectedPacks.join(" / ")}</p>
                  <p>avg total：{snapshot.latestFullBaselineHealth?.averageDuration ?? "--"}s</p>
                </div>
                <div className="rounded-[20px] bg-black/18 px-4 py-4 text-sm leading-7 text-stone-300/82 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                  <p>live stages：{snapshot.latestFullBaselineHealth?.liveStages ?? 0}</p>
                  <p>fallback stages：{snapshot.latestFullBaselineHealth?.fallbackStages ?? 0}</p>
                  <p>error stages：{snapshot.latestFullBaselineHealth?.errorStages ?? 0}</p>
                </div>
                <div className="rounded-[20px] bg-black/18 px-4 py-4 text-sm leading-7 text-stone-300/82 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                  <p>freeze aligned：{snapshot.freezeReference.benchmarkAligned ? "yes" : "no"}</p>
                  <p>freeze file：{snapshot.freezeReference.benchmarkFileName}</p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                {baseline.results.map((result) => (
                  <div key={`${baseline.fileName}-${result.pack}`} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <p className="text-sm uppercase tracking-[0.18em] text-stone-100">pack {result.pack}</p>
                    <p className="mt-2 text-sm leading-7 text-stone-400">{result.archetype ?? result.label ?? "--"}</p>
                    <div className="mt-4 space-y-1 text-xs leading-6 text-stone-400">
                      <p>part1：{result.ids?.part1_id ?? "--"}</p>
                      <p>theater：{result.ids?.theater_script_id ?? "--"}</p>
                      <p>part2：{result.ids?.part2_id ?? "--"}</p>
                      <p>constellation：{result.ids?.constellation_id ?? "--"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ReportCard>
          </section>
        ) : null}
      </div>
    </main>
  );
}
