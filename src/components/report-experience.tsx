"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpenText, Compass, Music4, Orbit, Sparkles, ShieldAlert } from "lucide-react";
import { MotionFloat, MotionReveal } from "@/components/report-motion";
import { ReportReadingPath } from "@/components/report-reading-path";
import { ReportActions } from "@/components/report-actions";
import { getFeatureLabel } from "@/lib/report-builder";
import type { EvidenceTrace, RecommendationItem, ReportPayload } from "@/lib/types";

export type ReportViewMode = "immersive" | "evidence";

const confidenceLabel: Record<string, string> = {
  low: "初步草图",
  medium: "中等聚焦",
  high: "较高聚焦",
};

const typeLabel: Record<string, string> = {
  philosophy: "philosophy",
  book: "book",
  music: "music",
  practice: "practice",
};

const sectionIndex = [
  { id: "overview", label: "01 / 精神地形" },
  { id: "dimensions", label: "02 / 三维解读" },
  { id: "tensions", label: "03 / 内在张力" },
  { id: "archetype", label: "04 / 原型说明" },
  { id: "recommendations", label: "05 / 可带走之物" },
  { id: "care-note", label: "06 / 边界说明" },
  { id: "share-save", label: "07 / 保存与重返" },
] as const;

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getSafetyCopy(flags: string[]) {
  if (flags.includes("self_harm_risk")) {
    return {
      eyebrow: "care note",
      title: "先把安全放在一切解释之前",
      body: "如果你正处在可能伤害自己的时刻，请先暂停阅读这份结果，优先联系身边可信任的人、当地紧急援助，或你所在地区的危机支持资源。理解很重要，但安全永远更优先。",
    };
  }

  if (flags.includes("trauma_signal")) {
    return {
      eyebrow: "care note",
      title: "有些部分值得被更温柔地安放",
      body: "这份结果可以作为整理感受的入口，但它不适合替代更稳定的人际支持或专业帮助。若某些记忆反复拉扯你，慢一点、少一点、有人陪着，会比逼自己一次看清更重要。",
    };
  }

  if (flags.includes("existential_distress")) {
    return {
      eyebrow: "care note",
      title: "存在困惑不必被浪漫化，也不必被羞于承认",
      body: "当意义感变薄时，你更需要现实连接：睡眠、进食、见人、规律的白天和可触摸的日常。先把自己留在生活里，再慢慢和那些大的问题相处。",
    };
  }

  if (flags.includes("high_sensitivity")) {
    return {
      eyebrow: "care note",
      title: "敏感不是故障，但需要边界",
      body: "如果你很容易被氛围、关系或回忆放大影响，说明你的感受力很强。更重要的不是把它关掉，而是为它留出节律、空间和保护层。",
    };
  }

  if (flags.includes("low_information")) {
    return {
      eyebrow: "care note",
      title: "这更像一份阶段草图，而不是定稿",
      body: "当前线索还不够密，这份结果适合被当作临时镜面来读。等你愿意提供更多答案、更多时间或更多细节，它会变得更像你。",
    };
  }

  return {
    eyebrow: "boundary note",
    title: "这是一份理解性镜像，不是诊断结论",
    body: "本结果更适合作为整理感受的起点，而不是判决书。如果你最近承受着超出日常负荷的痛苦，优先让自己回到更稳定的支持关系和现实照料里。",
  };
}

function formatGeneratedAt(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function SectionShell({
  id,
  eyebrow,
  title,
  lead,
  children,
  mode,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
  children: ReactNode;
  mode: ReportViewMode;
}) {
  return (
    <section
      id={id}
      className={cx(
        "relative scroll-mt-24 overflow-hidden rounded-[36px] p-6 backdrop-blur-2xl md:p-9",
        mode === "immersive"
          ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
          : "bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_0_0_1px_rgba(191,222,255,0.1)]",
      )}
    >
      <div className="pointer-events-none absolute right-[-10%] top-[-25%] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(185,215,246,0.12),transparent_72%)] blur-3xl" />
      <p className="relative text-[11px] tracking-[0.42em] text-stone-500 uppercase">{eyebrow}</p>
      <h2 className="relative mt-4 max-w-3xl text-3xl leading-[1.15] text-stone-100 md:text-[2.4rem]">{title}</h2>
      {lead ? (
        <p className={cx("relative mt-4 max-w-3xl leading-7", mode === "immersive" ? "text-sm text-stone-400 md:text-base" : "text-sm text-stone-300/78 md:text-[0.98rem]")}>{lead}</p>
      ) : null}
      <div className="relative mt-8">{children}</div>
    </section>
  );
}

function EvidencePanel({ evidence, mode }: { evidence: EvidenceTrace[]; mode: ReportViewMode }) {
  const [isOpen, setIsOpen] = useState(mode === "evidence");

  useEffect(() => {
    setIsOpen(mode === "evidence");
  }, [mode]);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen((event.currentTarget as HTMLDetailsElement).open)}
      className={cx(
        "group mt-6 rounded-[24px] p-4 transition duration-300 md:p-5",
        mode === "immersive"
          ? "bg-black/18 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] open:bg-white/[0.035]"
          : "bg-[rgba(189,218,255,0.08)] shadow-[0_0_0_1px_rgba(189,218,255,0.16)] open:bg-[rgba(189,218,255,0.1)]",
      )}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left marker:hidden">
        <div>
          <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">evidence trace</p>
          <p className="mt-2 text-sm leading-7 text-stone-400">
            {mode === "evidence" ? "证据阅读模式下，这部分默认展开，方便你直接核对它如何从答案推到结论。" : "展开这部分，你能看到它为何这样理解你，而不只是看到结论。"}
          </p>
        </div>
        <span className={cx("rounded-full px-3 py-2 text-[10px] tracking-[0.18em] uppercase transition", mode === "evidence" ? "bg-sky-100/12 text-sky-100" : "bg-white/[0.05] text-stone-300")}>{isOpen ? "线索已展开" : "点击展开线索"}</span>
      </summary>
      <div className={cx("mt-5 space-y-3 border-l pl-4 md:pl-5", mode === "evidence" ? "border-sky-100/20" : "border-white/8")}>
        {evidence.map((item) => (
          <div
            key={`${item.questionId}-${item.signal}`}
            className={cx(
              "relative rounded-[20px] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]",
              mode === "evidence" ? "bg-[#11151d]/80" : "bg-white/[0.03]",
            )}
          >
            <div className="flex flex-wrap items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-stone-500">
              <span>{item.questionId}</span>
              {item.featureKey ? <span className="rounded-full bg-white/[0.05] px-2 py-1 tracking-[0.14em]">{getFeatureLabel(item.featureKey)}</span> : null}
              {typeof item.featureScore === "number" ? <span>signal {Math.round(item.featureScore * 100)}%</span> : null}
            </div>
            <p className="mt-3 text-sm leading-7 text-stone-400">{item.prompt}</p>
            <p className="mt-2 text-sm leading-7 text-stone-100/88">“{item.answerLabel}”</p>
            <p className="mt-2 text-sm leading-7 text-stone-300/76">{item.signal}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

function RecommendationIcon({ type }: { type: RecommendationItem["type"] }) {
  if (type === "book") return <BookOpenText className="h-4 w-4" strokeWidth={1.5} />;
  if (type === "music") return <Music4 className="h-4 w-4" strokeWidth={1.5} />;
  if (type === "practice") return <Compass className="h-4 w-4" strokeWidth={1.5} />;
  return <Sparkles className="h-4 w-4" strokeWidth={1.5} />;
}

function ReportModeToggle({ mode, onChange }: { mode: ReportViewMode; onChange: (mode: ReportViewMode) => void }) {
  return (
    <div className="inline-flex rounded-full bg-white/[0.04] p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-xl">
      {[
        { key: "immersive", label: "沉浸阅读" },
        { key: "evidence", label: "证据阅读" },
      ].map((item) => {
        const active = item.key === mode;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key as ReportViewMode)}
            className={cx(
              "min-h-11 rounded-full px-5 text-sm tracking-[0.18em] uppercase transition",
              active
                ? "bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(192,220,249,0.9))] text-[#0b0d14]"
                : "text-stone-300 hover:text-stone-100",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function ReportExperience({ report }: { report: ReportPayload }) {
  const [mode, setMode] = useState<ReportViewMode>("immersive");
  const safetyCopy = getSafetyCopy(report.safetyFlags);

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(189,218,255,0.12),transparent_23%),radial-gradient(circle_at_82%_18%,rgba(109,80,131,0.12),transparent_26%),radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.03),transparent_42%)]" />
      <MotionFloat className="pointer-events-none absolute left-1/2 top-28 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(191,222,255,0.14),transparent_66%)] blur-3xl" delay={0.4} />
      <MotionFloat className="pointer-events-none absolute right-[-8rem] top-[28rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(128,92,164,0.1),transparent_70%)] blur-3xl" delay={1.1} />

      <div className="relative mx-auto max-w-6xl">
        <MotionReveal delay={0.04}>
          <section className="relative overflow-hidden rounded-[44px] bg-[linear-gradient(135deg,rgba(153,117,124,0.22),rgba(185,215,246,0.12),rgba(255,255,255,0.03))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_40%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-[11px] tracking-[0.48em] text-stone-300/65 uppercase">mental portrait / archetype</p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-3 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] tracking-[0.2em] text-stone-300 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
                    <Orbit className="h-3.5 w-3.5" strokeWidth={1.6} />
                    当前阶段精神原型
                  </div>
                  <ReportModeToggle mode={mode} onChange={setMode} />
                </div>
                <h1 className="mt-6 max-w-4xl text-5xl leading-[0.98] text-stone-50 md:text-7xl lg:text-[5.5rem]">{report.archetype.name}</h1>
                {report.archetype.subtitle ? <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-200/86 md:text-[1.28rem]">{report.archetype.subtitle}</p> : null}
                <p className="mt-8 max-w-2xl text-base leading-8 text-stone-300/78 md:text-lg">
                  {mode === "immersive"
                    ? "这不是一次对你的定型，而是把此刻仍在发亮、仍在拉扯、仍在组织你的那些线索暂时排成一张可阅读的图。"
                    : "你现在看到的是同一份结果的另一种打开方式：少一点氛围，多一点证据，让每段理解都更容易回到它的来源。"}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
                <div className={cx("rounded-[28px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]", mode === "immersive" ? "bg-black/18" : "bg-[rgba(189,218,255,0.08)]") }>
                  <p className="text-[11px] tracking-[0.3em] text-stone-500 uppercase">focus</p>
                  <p className="mt-3 text-2xl text-stone-100">{confidenceLabel[report.confidenceBand] ?? report.confidenceBand}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-400">由这次回答密度与线索一致性整理得出。</p>
                </div>
                <div className={cx("rounded-[28px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]", mode === "immersive" ? "bg-black/18" : "bg-[rgba(189,218,255,0.08)]") }>
                  <p className="text-[11px] tracking-[0.3em] text-stone-500 uppercase">generated</p>
                  <p className="mt-3 text-2xl text-stone-100">{formatGeneratedAt(report.generatedAt)}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-400">这是一份当前阶段的阅读稿，不是终局判定。</p>
                </div>
                <div className={cx("rounded-[28px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]", mode === "immersive" ? "bg-black/18" : "bg-[rgba(189,218,255,0.08)]") }>
                  <p className="text-[11px] tracking-[0.3em] text-stone-500 uppercase">signals</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.archetype.sourceSignals.map((signal) => (
                      <span key={signal} className="rounded-full bg-white/[0.05] px-3 py-2 text-[10px] tracking-[0.16em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                        {signal.replaceAll("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </MotionReveal>

        <section className="mt-12 grid gap-12 xl:grid-cols-[0.28fr_0.72fr] xl:items-start">
          <MotionReveal className="xl:sticky xl:top-24" delay={0.08} y={18} blur={6}>
            <aside>
              <ReportReadingPath items={[...sectionIndex]} mode={mode} />
            </aside>
          </MotionReveal>

          <div className="space-y-8 md:space-y-10">
            <MotionReveal delay={0.12}>
              <SectionShell
                id="overview"
                eyebrow="01 / overview"
                title="精神地形总览"
                lead={mode === "immersive" ? "先不要急着判断准不准。先读这段氛围，看它是否触到了你此刻真正正在经历的天气。" : "先读总览，再回头核对下面每一段证据。证据模式不是拆穿诗意，而是给诗意以来源。"}
                mode={mode}
              >
                <div className="grid gap-8 lg:grid-cols-[0.2fr_0.8fr] lg:items-start">
                  <div className="hidden lg:block">
                    <div className={cx("rounded-[28px] p-5 text-6xl leading-none shadow-[0_0_0_1px_rgba(255,255,255,0.05)]", mode === "immersive" ? "bg-white/[0.03] text-stone-200/60" : "bg-[rgba(189,218,255,0.08)] text-sky-100/70")}>“</div>
                  </div>
                  <div>
                    <p className={cx(mode === "immersive" ? "text-xl leading-10 text-stone-100/88 md:text-[1.24rem] md:leading-10" : "text-lg leading-9 text-stone-100/84 md:text-[1.1rem]")}>{report.overview}</p>
                  </div>
                </div>
              </SectionShell>
            </MotionReveal>

            <MotionReveal delay={0.16}>
              <SectionShell id="dimensions" eyebrow="02 / dimensions" title="三维解读" lead="不是把你切成三块，而是从审美、情绪与时间这三条河道，看你如何被组织起来。" mode={mode}>
                <div className="space-y-5">
                  {report.dimensionReadings.map((reading, index) => (
                    <article key={reading.dimension} className={cx("rounded-[30px] p-5 transition duration-300 md:p-6", mode === "immersive" ? "bg-black/16 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-white/[0.035] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" : "bg-[rgba(189,218,255,0.08)] shadow-[0_0_0_1px_rgba(189,218,255,0.12)]") }>
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="max-w-2xl">
                          <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">0{index + 1} / {reading.dimension}</p>
                          <h3 className="mt-3 text-2xl leading-[1.28] text-stone-100 md:text-[2rem]">{reading.title}</h3>
                        </div>
                        <div className={cx("rounded-full px-4 py-2 text-xs tracking-[0.18em] uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.06)]", mode === "immersive" ? "bg-white/[0.04] text-stone-300" : "bg-sky-100/10 text-sky-100")}>{confidenceLabel[reading.confidenceBand] ?? reading.confidenceBand}</div>
                      </div>
                      <p className={cx("mt-5 max-w-3xl leading-8", mode === "immersive" ? "text-base text-stone-300/86 md:text-[1.03rem]" : "text-[0.98rem] text-stone-200/88")}>{reading.summary}</p>
                      <EvidencePanel evidence={reading.evidence} mode={mode} />
                    </article>
                  ))}
                </div>
              </SectionShell>
            </MotionReveal>

            <MotionReveal delay={0.2}>
              <SectionShell id="tensions" eyebrow="03 / tensions" title="内在张力" lead="重要的不是消除张力，而是知道自己正被哪两股力量同时拉住。" mode={mode}>
                <div className="space-y-5">
                  {report.tensions.map((tension, index) => (
                    <article key={tension.tensionId} className={cx("rounded-[30px] p-5 transition duration-300 md:p-6", mode === "immersive" ? "bg-black/16 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-white/[0.035] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" : "bg-[rgba(189,218,255,0.08)] shadow-[0_0_0_1px_rgba(189,218,255,0.12)]") }>
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="max-w-2xl">
                          <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">0{index + 1} / tension</p>
                          <h3 className="mt-3 text-2xl leading-[1.26] text-stone-100 md:text-[2rem]">{tension.name}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 md:max-w-sm md:justify-end">
                          {tension.poles.map((pole) => (
                            <span key={pole} className="rounded-full bg-white/[0.04] px-4 py-2 text-xs tracking-[0.18em] text-stone-300 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">{pole}</span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-6 grid gap-5 lg:grid-cols-[0.62fr_0.38fr]">
                        <p className={cx("leading-8", mode === "immersive" ? "text-base text-stone-300/84" : "text-[0.98rem] text-stone-200/88")}>{tension.description}</p>
                        <div className={cx("rounded-[24px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]", mode === "immersive" ? "bg-white/[0.03]" : "bg-[#11151d]/75") }>
                          <p className="text-[11px] tracking-[0.28em] text-stone-500 uppercase">与之相处</p>
                          <p className="mt-3 text-sm leading-7 text-stone-200/86">{tension.suggestion}</p>
                        </div>
                      </div>
                      <EvidencePanel evidence={tension.evidence} mode={mode} />
                    </article>
                  ))}
                </div>
              </SectionShell>
            </MotionReveal>

            <MotionReveal delay={0.24}>
              <SectionShell id="archetype" eyebrow="04 / archetype reading" title="为什么是这个原型" lead="原型不是标签，而是这一阶段最能把你体内几股力量暂时拢在一起的名字。" mode={mode}>
                <div className={cx("rounded-[30px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] md:p-6", mode === "immersive" ? "bg-black/16" : "bg-[rgba(189,218,255,0.08)]") }>
                  <p className={cx("max-w-3xl leading-9", mode === "immersive" ? "text-lg text-stone-200/88" : "text-[1.02rem] text-stone-100/88")}>{report.archetype.description}</p>
                  <div className="mt-6 flex flex-wrap gap-2 text-xs tracking-[0.18em] text-stone-400 uppercase">
                    {report.archetype.sourceSignals.map((signal) => (
                      <span key={signal} className="rounded-full bg-white/[0.03] px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">{signal}</span>
                    ))}
                  </div>
                  <EvidencePanel evidence={report.archetype.evidence} mode={mode} />
                </div>
              </SectionShell>
            </MotionReveal>

            <MotionReveal delay={0.28}>
              <SectionShell id="recommendations" eyebrow="05 / recommendations" title="接下来可以带走什么" lead={mode === "immersive" ? "这里不是效率清单，而是几件你可以带离这页、并在现实里慢慢试着安放的东西。" : "证据阅读模式下，这些建议依然保留，但请先把它们理解成“和这份画像相匹配的下一步”，而不是标准答案。"} mode={mode}>
                <div className="grid gap-4 md:grid-cols-2">
                  {report.recommendations.map((item) => (
                    <article key={item.title} className={cx("rounded-[28px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition duration-300 md:p-6", mode === "immersive" ? "bg-black/16 hover:bg-white/[0.035]" : "bg-[rgba(189,218,255,0.08)]") }>
                      <div className="flex items-center gap-3 text-stone-300">
                        <span className="rounded-full bg-white/[0.05] p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                          <RecommendationIcon type={item.type} />
                        </span>
                        <p className="text-[11px] tracking-[0.3em] text-stone-500 uppercase">{typeLabel[item.type] ?? item.type}</p>
                      </div>
                      <h3 className="mt-4 text-2xl leading-[1.3] text-stone-100">{item.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-stone-300/78">{item.description}</p>
                    </article>
                  ))}
                </div>
              </SectionShell>
            </MotionReveal>

            <MotionReveal delay={0.32}>
              <section id="care-note" className={cx("scroll-mt-24 rounded-[34px] p-6 backdrop-blur-xl md:p-8", mode === "immersive" ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] shadow-[0_0_0_1px_rgba(255,255,255,0.05)]" : "bg-[linear-gradient(180deg,rgba(255,244,212,0.05),rgba(255,255,255,0.03))] shadow-[0_0_0_1px_rgba(251,191,36,0.12)]") }>
                <div className="flex items-start gap-4">
                  <span className="mt-1 rounded-full bg-amber-200/10 p-3 text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.14)]">
                    <ShieldAlert className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">{safetyCopy.eyebrow}</p>
                    <h3 className="mt-3 text-2xl leading-[1.35] text-stone-100 md:text-[2rem]">{safetyCopy.title}</h3>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-400">{safetyCopy.body}</p>
                  </div>
                </div>
              </section>
            </MotionReveal>

            <MotionReveal delay={0.36}>
              <section id="share-save" className={cx("scroll-mt-24 rounded-[34px] p-6 backdrop-blur-xl md:p-8", mode === "immersive" ? "bg-white/[0.025] shadow-[0_0_0_1px_rgba(255,255,255,0.05)]" : "bg-[rgba(189,218,255,0.06)] shadow-[0_0_0_1px_rgba(189,218,255,0.12)]") }>
                <div className="space-y-3 text-center sm:text-left">
                  <p className="text-[11px] tracking-[0.36em] text-stone-500 uppercase">share & save</p>
                  <h3 className="text-2xl leading-[1.3] text-stone-100 md:text-[2rem]">把这一阶段的自己带走</h3>
                  <p className="max-w-3xl text-sm leading-7 text-stone-400">你可以先分享摘要、复制全文，或把这份结果保存成一份可离线回看的文本档案。等下一次回来，它也能成为你观看变化的旧坐标。</p>
                </div>
                <div className="mt-6">
                  <ReportActions report={report} />
                </div>
                <div className="mt-8 flex flex-col gap-4 pt-2 text-center sm:flex-row sm:items-center sm:justify-center">
                  <Link href="/test" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(192,220,249,0.92))] px-7 py-3 text-sm tracking-[0.2em] text-[#0b0d14] uppercase transition hover:scale-[1.01]">
                    再次进入
                  </Link>
                  <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm tracking-[0.18em] text-stone-300/86 uppercase transition hover:text-stone-100">
                    回到序章
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                  </Link>
                </div>
              </section>
            </MotionReveal>
          </div>
        </section>
      </div>
    </main>
  );
}
