import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { InternalLabNav } from "@/components/internal-lab-nav";
import { getBenyuanStatusSnapshot } from "@/lib/benyuan-status";

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

export default async function LabStatusPage() {
  const snapshot = await getBenyuanStatusSnapshot();
  const latest = snapshot.latestBenchmark;
  const baseline = snapshot.latestFullBaseline;

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(189,218,255,0.12),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(109,80,131,0.12),transparent_28%),radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(123,153,183,0.16),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <p className="text-[11px] uppercase tracking-[0.46em] text-stone-300/65">internal / benyuan status</p>
          <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">本源状态面板</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-stone-300/82 md:text-lg">
            这里直接展示 benyuan 当前 provider、latest benchmark、最近一次 fallback 错误链，以及最新成功的 constellation 结果，不用再翻聊天记录和终端日志。
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

          <ReportCard eyebrow="latest" title="最近一次 benchmark">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>{latest ? formatDateTime(latest.generatedAt) : "--"}</p>
              <p>packs：{latest?.selectedPacks.join(" / ") ?? "--"}</p>
              <p>results：{latest?.results.length ?? 0}</p>
              <p>file：{latest?.fileName ?? "--"}</p>
            </div>
          </ReportCard>

          <ReportCard eyebrow="baseline" title="最近全量基线">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>{baseline ? formatDateTime(baseline.generatedAt) : "--"}</p>
              <p>packs：{baseline?.selectedPacks.join(" / ") ?? "--"}</p>
              <p>results：{baseline?.results.length ?? 0}</p>
              <p>file：{baseline?.fileName ?? "--"}</p>
            </div>
          </ReportCard>

          <ReportCard eyebrow="success" title="最近成功星图">
            <div className="space-y-2 text-sm leading-7 text-stone-300/82">
              <p>{snapshot.latestConstellation?.archetype ?? "--"}</p>
              <p>{snapshot.latestConstellation?.constellationId ?? "--"}</p>
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

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <ReportCard eyebrow="benchmark / latest" title="最近一轮运行详情">
            {latest ? (
              <div className="space-y-4">
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

          <ReportCard eyebrow="fallback / trace" title="最近一次 fallback 错误链">
            {snapshot.recentFallback ? (
              <div className="space-y-4 text-sm leading-7 text-stone-300/82">
                <div className="rounded-[24px] bg-black/18 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <p>pack：{snapshot.recentFallback.pack ?? "--"}</p>
                  <p>stage：{snapshot.recentFallback.stage ?? "--"}</p>
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
        </section>

        {baseline ? (
          <section className="mt-10">
            <ReportCard eyebrow="baseline / frozen" title="当前可信全量基线">
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
