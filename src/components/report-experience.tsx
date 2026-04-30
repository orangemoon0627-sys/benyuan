"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenText,
  Compass,
  Film,
  Music4,
  Orbit,
  ShieldAlert,
  Sparkles,
  Stars,
} from "lucide-react";
import { MotionFloat, MotionReveal } from "@/components/report-motion";
import { ReportReadingPath } from "@/components/report-reading-path";
import { ReportActions } from "@/components/report-actions";
import { getFeatureLabel } from "@/lib/report-builder";
import type {
  ConstellationDimensionReading,
  CuratedRecommendation,
  EvidenceTrace,
  RecommendationCollections,
  RecommendationItem,
  ReportPayload,
} from "@/lib/types";

export type ReportViewMode = "immersive" | "evidence";

const confidenceLabel: Record<string, string> = {
  low: "初步草图",
  medium: "中等聚焦",
  high: "较高聚焦",
};

const typeLabel: Record<string, string> = {
  philosophy: "哲思",
  book: "书籍",
  music: "音乐",
  practice: "练习",
};

const constellationColor: Record<ConstellationDimensionReading["key"], string> = {
  openness: "from-sky-200/24 via-cyan-200/14 to-transparent",
  independence: "from-violet-200/24 via-fuchsia-200/14 to-transparent",
  emotional_depth: "from-indigo-200/24 via-blue-200/14 to-transparent",
  meaning_seeking: "from-amber-200/24 via-yellow-200/14 to-transparent",
  aesthetic_sensitivity: "from-rose-200/24 via-orange-200/14 to-transparent",
  action_tendency: "from-emerald-200/24 via-teal-200/14 to-transparent",
  relationship_need: "from-pink-200/24 via-rose-200/14 to-transparent",
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getSafetyCopy(flags: string[]) {
  if (flags.includes("self_harm_risk")) {
    return {
      eyebrow: "照护提示",
      title: "先把安全放在一切解释之前",
      body: "如果你正处在可能伤害自己的时刻，请先暂停阅读这份结果，优先联系身边可信任的人、当地紧急援助，或你所在地区的危机支持资源。理解很重要，但安全永远更优先。",
    };
  }

  if (flags.includes("trauma_signal")) {
    return {
      eyebrow: "照护提示",
      title: "有些部分值得被更温柔地安放",
      body: "这份结果可以作为整理感受的入口，但它不适合替代更稳定的人际支持或专业帮助。若某些记忆反复拉扯你，慢一点、少一点、有人陪着，会比逼自己一次看清更重要。",
    };
  }

  if (flags.includes("existential_distress")) {
    return {
      eyebrow: "照护提示",
      title: "存在困惑不必被浪漫化，也不必被羞于承认",
      body: "当意义感变薄时，你更需要现实连接：睡眠、进食、见人、规律的白天和可触摸的日常。先把自己留在生活里，再慢慢和那些大的问题相处。",
    };
  }

  if (flags.includes("high_sensitivity")) {
    return {
      eyebrow: "照护提示",
      title: "敏感不是故障，但需要边界",
      body: "如果你很容易被氛围、关系或回忆放大影响，说明你的感受力很强。更重要的不是把它关掉，而是为它留出节律、空间和保护层。",
    };
  }

  if (flags.includes("low_information")) {
    return {
      eyebrow: "照护提示",
      title: "这更像一份阶段草图，而不是定稿",
      body: "当前线索还不够密，这份结果适合被当作临时镜面来读。等你愿意提供更多答案、更多时间或更多细节，它会变得更像你。",
    };
  }

  return {
    eyebrow: "边界说明",
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

function getScoreTone(score: number) {
  if (score >= 80) return "高密度";
  if (score >= 60) return "持续发亮";
  return "仍在形成";
}

const legacyDimensionLabel: Record<string, string> = {
  aesthetic: "审美语法",
  emotional: "情感气候",
  temporal: "时间哲学",
};

function formatSignalLabel(value: string) {
  if (legacyDimensionLabel[value]) return legacyDimensionLabel[value];
  const label = getFeatureLabel(value);
  return label === value ? value.replaceAll("_", " ") : label;
}

const constellationOrbitLayout: Record<ConstellationDimensionReading["key"], { x: string; y: string }> = {
  openness: { x: "50%", y: "6%" },
  independence: { x: "82%", y: "20%" },
  emotional_depth: { x: "92%", y: "54%" },
  meaning_seeking: { x: "74%", y: "86%" },
  aesthetic_sensitivity: { x: "26%", y: "86%" },
  action_tendency: { x: "8%", y: "54%" },
  relationship_need: { x: "18%", y: "20%" },
};

function getConstellationSummary(dimensions: ConstellationDimensionReading[]) {
  const ranked = [...dimensions].sort((left, right) => right.score - left.score);
  return {
    strongest: ranked.slice(0, 3),
    quietest: ranked[ranked.length - 1],
    average: Math.round(ranked.reduce((sum, item) => sum + item.score, 0) / ranked.length),
  };
}

function ConstellationAtlas({ dimensions, archetype, mode }: { dimensions: ConstellationDimensionReading[]; archetype: ReportPayload["archetype"]; mode: ReportViewMode }) {
  const summary = getConstellationSummary(dimensions);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.56fr_0.44fr]">
      <article
        className={cx(
          "relative overflow-hidden rounded-[32px] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] md:p-7",
          mode === "immersive" ? "bg-black/18" : "bg-[rgba(189,218,255,0.08)]",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(191,222,255,0.09),transparent_44%),radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.06),transparent_22%)]" />
        <div className="relative mx-auto aspect-square w-full max-w-[31rem]">
          <div className="absolute inset-[16%] rounded-full border border-white/8" />
          <div className="absolute inset-[28%] rounded-full border border-white/7" />
          <div className="absolute inset-[40%] rounded-full border border-white/6" />
          <div className="absolute left-1/2 top-[10%] h-[80%] w-px -translate-x-1/2 bg-white/6" />
          <div className="absolute left-[10%] top-1/2 h-px w-[80%] -translate-y-1/2 bg-white/6" />

          <div className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),rgba(255,255,255,0.05)_50%,transparent_78%)] text-center shadow-[0_0_60px_rgba(191,222,255,0.16)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-stone-400">当前原型</p>
            <p className="mt-3 max-w-[8rem] text-lg leading-7 text-stone-100">{archetype.name}</p>
          </div>

          {dimensions.map((dimension) => {
            const point = constellationOrbitLayout[dimension.key];
            const size = 14 + Math.round(dimension.score / 6);
            return (
              <div
                key={dimension.key}
                className="absolute"
                style={{ left: point.x, top: point.y, transform: "translate(-50%, -50%)" }}
              >
                <div
                  className="rounded-full border border-white/20 bg-[radial-gradient(circle,rgba(232,243,255,0.96),rgba(143,188,255,0.68))] shadow-[0_0_24px_rgba(191,222,255,0.34)]"
                  style={{ width: `${size}px`, height: `${size}px` }}
                />
                <div className="mt-3 min-w-[7rem] -translate-x-1/2 rounded-full bg-black/28 px-3 py-2 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-stone-500">{dimension.score}</p>
                  <p className="mt-1 text-xs leading-5 text-stone-200">{dimension.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <article
        className={cx(
          "rounded-[32px] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] md:p-7",
          mode === "immersive" ? "bg-black/18" : "bg-[rgba(189,218,255,0.08)]",
        )}
      >
        <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">星图摘要</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[24px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">平均亮度</p>
            <p className="mt-3 text-3xl text-stone-100">{summary.average}</p>
            <p className="mt-2 text-xs leading-6 text-stone-400">当前整体心理密度的平均亮度。</p>
          </div>
          <div className="rounded-[24px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">最亮轴线</p>
            <p className="mt-3 text-lg leading-7 text-stone-100">{summary.strongest[0]?.label ?? '-'}</p>
            <p className="mt-2 text-xs leading-6 text-stone-400">当前最亮的一根轴线，最能代表这轮结果的中心引力。</p>
          </div>
          <div className="rounded-[24px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">静默轴线</p>
            <p className="mt-3 text-lg leading-7 text-stone-100">{summary.quietest?.label ?? '-'}</p>
            <p className="mt-2 text-xs leading-6 text-stone-400">不是缺失，而是当前暂时没有被推到前景的部分。</p>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
          <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">最亮的三股引力</p>
          <div className="mt-4 space-y-3">
            {summary.strongest.map((dimension, index) => (
              <div key={dimension.key} className="rounded-[22px] bg-black/18 px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">0{index + 1}</p>
                    <p className="mt-1 text-base leading-7 text-stone-100">{dimension.label}</p>
                  </div>
                  <div className="rounded-full bg-white/[0.05] px-3 py-2 text-xs tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    {dimension.score}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-300/78">{dimension.interpretation}</p>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
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
        <p
          className={cx(
            "relative mt-4 max-w-3xl leading-7",
            mode === "immersive" ? "text-sm text-stone-400 md:text-base" : "text-sm text-stone-300/78 md:text-[0.98rem]",
          )}
        >
          {lead}
        </p>
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

  if (!evidence.length) return null;

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
          <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">证据链路</p>
          <p className="mt-2 text-sm leading-7 text-stone-400">
            {mode === "evidence"
              ? "证据阅读模式下，这部分默认展开，方便你直接核对它如何从答案推到结论。"
              : "展开这部分，你能看到它为何这样理解你，而不只是看到结论。"}
          </p>
        </div>
        <span
          className={cx(
            "rounded-full px-3 py-2 text-[10px] tracking-[0.18em] uppercase transition",
            mode === "evidence" ? "bg-sky-100/12 text-sky-100" : "bg-white/[0.05] text-stone-300",
          )}
        >
          {isOpen ? "线索已展开" : "点击展开线索"}
        </span>
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
              {item.featureKey ? (
                <span className="rounded-full bg-white/[0.05] px-2 py-1 tracking-[0.14em]">{getFeatureLabel(item.featureKey)}</span>
              ) : null}
              {typeof item.featureScore === "number" ? <span>信号 {Math.round(item.featureScore * 100)}%</span> : null}
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

function CuratedIcon({ group }: { group: keyof RecommendationCollections }) {
  if (group === "books") return <BookOpenText className="h-4 w-4" strokeWidth={1.5} />;
  if (group === "films") return <Film className="h-4 w-4" strokeWidth={1.5} />;
  return <Music4 className="h-4 w-4" strokeWidth={1.5} />;
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

function CuratedRecommendationGroup({
  title,
  group,
  items,
  mode,
}: {
  title: string;
  group: keyof RecommendationCollections;
  items: CuratedRecommendation[];
  mode: ReportViewMode;
}) {
  if (!items.length) return null;

  return (
    <article
      className={cx(
        "rounded-[30px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] md:p-6",
        mode === "immersive" ? "bg-black/16" : "bg-[rgba(189,218,255,0.08)]",
      )}
    >
      <div className="flex items-center gap-3 text-stone-300">
        <span className="rounded-full bg-white/[0.05] p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          <CuratedIcon group={group} />
        </span>
        <p className="text-[11px] tracking-[0.3em] text-stone-500 uppercase">{title}</p>
      </div>
      <div className="mt-5 space-y-4">
        {items.map((item, index) => (
          <div key={`${group}-${item.title}-${index}`} className="rounded-[22px] bg-white/[0.03] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-lg leading-8 text-stone-100">{item.title}</h3>
              {item.creator ? <p className="text-xs tracking-[0.18em] text-stone-500 uppercase">{item.creator}</p> : null}
            </div>
            <p className="mt-2 text-sm leading-7 text-stone-300/78">{item.reason}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function ReportExperience({ report }: { report: ReportPayload }) {
  const [mode, setMode] = useState<ReportViewMode>("immersive");
  const safetyCopy = getSafetyCopy(report.safetyFlags);
  const narrativeText = report.narrativeOverview ?? report.overview;
  const hasConstellation = Boolean(report.sevenDimensions?.length);
  const hasGrowthSuggestions = Boolean(report.growthSuggestions?.length);
  const hasCuratedRecommendations = Boolean(
    report.curatedRecommendations &&
      (report.curatedRecommendations.books.length || report.curatedRecommendations.films.length || report.curatedRecommendations.music.length),
  );

  const sectionIndex = useMemo(() => {
    const items = [
      { id: "overview", label: "01 / 精神地形" },
      { id: "dimensions", label: hasConstellation ? "02 / 七维星图" : "02 / 三维解读" },
      { id: "tensions", label: hasConstellation ? "03 / 核心张力" : "03 / 内在张力" },
      { id: "archetype", label: "04 / 原型说明" },
    ];

    if (hasGrowthSuggestions) {
      items.push({ id: "growth", label: "05 / 成长方向" });
    }

    items.push({ id: "recommendations", label: hasCuratedRecommendations ? "06 / 推荐内容" : "06 / 可带走之物" });
    items.push({ id: "care-note", label: "07 / 边界说明" });
    items.push({ id: "share-save", label: "08 / 保存与重返" });
    return items;
  }, [hasConstellation, hasCuratedRecommendations, hasGrowthSuggestions]);

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(189,218,255,0.12),transparent_23%),radial-gradient(circle_at_82%_18%,rgba(109,80,131,0.12),transparent_26%),radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.03),transparent_42%)]" />
      <MotionFloat className="pointer-events-none absolute left-1/2 top-28 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(191,222,255,0.14),transparent_66%)] blur-3xl" delay={0.4} />
      <MotionFloat className="pointer-events-none absolute right-[-8rem] top-[28rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(128,92,164,0.1),transparent_70%)] blur-3xl" delay={1.1} />

      <div className="relative mx-auto max-w-6xl">
        <MotionReveal delay={0.04}>
          <section className="relative overflow-hidden rounded-[44px] bg-[linear-gradient(135deg,rgba(153,117,124,0.22),rgba(185,215,246,0.12),rgba(255,255,255,0.03))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_40%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-[11px] tracking-[0.48em] text-stone-300/65 uppercase">精神原型 / 当前阶段</p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-3 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] tracking-[0.2em] text-stone-300 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
                    <Orbit className="h-3.5 w-3.5" strokeWidth={1.6} />
                    当前阶段精神原型
                  </div>
                  <ReportModeToggle mode={mode} onChange={setMode} />
                </div>
                <h1 className="mt-6 max-w-4xl text-5xl leading-[0.98] text-stone-50 md:text-7xl lg:text-[5.5rem]">{report.archetype.name}</h1>
                {report.archetype.englishName ? (
                  <p className="mt-4 text-[11px] tracking-[0.38em] text-stone-400 uppercase">{report.archetype.englishName}</p>
                ) : null}
                {report.archetype.subtitle ? (
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-200/86 md:text-[1.28rem]">{report.archetype.subtitle}</p>
                ) : null}
                {report.archetype.coreEssence ? (
                  <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300/82 md:text-lg">{report.archetype.coreEssence}</p>
                ) : null}
                <p className="mt-8 max-w-2xl text-base leading-8 text-stone-300/78 md:text-lg">
                  {mode === "immersive"
                    ? "这不是一次对你的定型，而是把此刻仍在发亮、仍在拉扯、仍在组织你的那些线索暂时排成一张可阅读的图。"
                    : "你现在看到的是同一份结果的另一种打开方式：少一点氛围，多一点证据，让每段理解都更容易回到它的来源。"}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className={cx("rounded-[28px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]", mode === "immersive" ? "bg-black/18" : "bg-[rgba(189,218,255,0.08)]")}>
                  <p className="text-[11px] tracking-[0.3em] text-stone-500 uppercase">结果聚焦</p>
                  <p className="mt-3 text-2xl text-stone-100">{confidenceLabel[report.confidenceBand] ?? report.confidenceBand}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-400">由这次回答密度与线索一致性整理得出。</p>
                </div>
                <div className={cx("rounded-[28px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]", mode === "immersive" ? "bg-black/18" : "bg-[rgba(189,218,255,0.08)]")}>
                  <p className="text-[11px] tracking-[0.3em] text-stone-500 uppercase">生成时间</p>
                  <p className="mt-3 text-2xl text-stone-100">{formatGeneratedAt(report.generatedAt)}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-400">这是一份当前阶段的阅读稿，不是终局判定。</p>
                </div>
                <div className={cx("rounded-[28px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]", mode === "immersive" ? "bg-black/18" : "bg-[rgba(189,218,255,0.08)]")}>
                  <p className="text-[11px] tracking-[0.3em] text-stone-500 uppercase">信号来源</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.archetype.sourceSignals.map((signal) => (
                      <span key={signal} className="rounded-full bg-white/[0.05] px-3 py-2 text-[10px] tracking-[0.16em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                        {formatSignalLabel(signal)}
                      </span>
                    ))}
                  </div>
                </div>
                {report.analysisMeta ? (
                  <div className={cx("rounded-[28px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]", mode === "immersive" ? "bg-black/18" : "bg-[rgba(189,218,255,0.08)]")}>
                    <p className="text-[11px] tracking-[0.3em] text-stone-500 uppercase">分析运行时</p>
                    <p className="mt-3 text-base leading-7 text-stone-100">{report.analysisMeta.engineLabel}</p>
                    <p className="mt-2 text-sm leading-7 text-stone-400">
                      {report.analysisMeta.providerKind} / {report.analysisMeta.providerModel ?? "规则链路"}
                    </p>
                    {report.analysisMeta.providerEnhancementStatus ? (
                      <p className="mt-2 text-xs leading-6 text-stone-500">
                        增强状态 {report.analysisMeta.providerEnhancementStatus}
                        {typeof report.analysisMeta.providerLatencyMs === "number" ? ` · ${report.analysisMeta.providerLatencyMs}ms` : ""}
                      </p>
                    ) : null}
                    {report.analysisMeta.providerCompletedScopes?.length ? (
                      <p className="mt-1 text-xs leading-6 text-stone-500">
                        覆盖范围：{report.analysisMeta.providerCompletedScopes.join(" · ")}
                      </p>
                    ) : null}
                    {typeof report.analysisMeta.providerTextReceived === "boolean" ? (
                      <p className="mt-1 text-xs leading-6 text-stone-500">流式文本：{report.analysisMeta.providerTextReceived ? "已收到" : "为空"}</p>
                    ) : null}
                    {report.analysisMeta.providerResponsePreview ? (
                      <p className="mt-1 line-clamp-3 text-xs leading-6 text-stone-500">预览：{report.analysisMeta.providerResponsePreview}</p>
                    ) : null}
                    {report.analysisMeta.providerFallbackReason ? (
                      <p className="mt-1 text-xs leading-6 text-stone-500">回退原因：{report.analysisMeta.providerFallbackReason}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </MotionReveal>

        <section className="mt-12 grid gap-12 xl:grid-cols-[0.28fr_0.72fr] xl:items-start">
          <MotionReveal className="xl:sticky xl:top-24" delay={0.08} y={18} blur={6}>
            <aside>
              <ReportReadingPath items={sectionIndex} mode={mode} />
            </aside>
          </MotionReveal>

          <div className="space-y-8 md:space-y-10">
            <MotionReveal delay={0.12}>
              <SectionShell
                id="overview"
                eyebrow="01 / 精神地形"
                title="精神地形总览"
                lead={
                  mode === "immersive"
                    ? "先不要急着判断准不准。先读这段镜像，看它是否触到了你此刻真正正在经历的天气。"
                    : "先读总览，再回头核对下面每一段证据。证据模式不是拆穿诗意，而是给诗意以来源。"
                }
                mode={mode}
              >
                <div className="grid gap-8 lg:grid-cols-[0.18fr_0.82fr] lg:items-start">
                  <div className="hidden lg:block">
                    <div className={cx("rounded-[28px] p-5 text-6xl leading-none shadow-[0_0_0_1px_rgba(255,255,255,0.05)]", mode === "immersive" ? "bg-white/[0.03] text-stone-200/60" : "bg-[rgba(189,218,255,0.08)] text-sky-100/70")}>“</div>
                  </div>
                  <div>
                    <p className={cx(mode === "immersive" ? "whitespace-pre-line text-xl leading-10 text-stone-100/88 md:text-[1.18rem] md:leading-10" : "whitespace-pre-line text-lg leading-9 text-stone-100/84 md:text-[1.08rem]")}>{narrativeText}</p>
                  </div>
                </div>
              </SectionShell>
            </MotionReveal>

            <MotionReveal delay={0.16}>
              <SectionShell
                id="dimensions"
                eyebrow={hasConstellation ? "02 / 七维星图" : "02 / 三维解读"}
                title={hasConstellation ? "七维精神星图" : "三维解读"}
                lead={
                  hasConstellation
                    ? "不是给你打分，而是把七条正在发光的心理轴线摆到同一张图上，帮助你看到自己此刻的结构。"
                    : "不是把你切成三块，而是从审美、情绪与时间这三条河道，看你如何被组织起来。"
                }
                mode={mode}
              >
                {hasConstellation ? (
                  <div className="space-y-8">
                    <ConstellationAtlas dimensions={report.sevenDimensions ?? []} archetype={report.archetype} mode={mode} />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {report.sevenDimensions?.map((dimension) => (
                        <article
                          key={dimension.key}
                          className={cx(
                            "relative overflow-hidden rounded-[30px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] md:p-6",
                            mode === "immersive" ? "bg-black/16" : "bg-[rgba(189,218,255,0.08)]",
                          )}
                        >
                          <div className={cx("pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b", constellationColor[dimension.key])} />
                          <div className="relative">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-[11px] tracking-[0.3em] text-stone-500 uppercase">{formatSignalLabel(dimension.key)}</p>
                                <h3 className="mt-3 text-2xl leading-[1.25] text-stone-100">{dimension.label}</h3>
                              </div>
                              <div className="rounded-full bg-white/[0.05] px-4 py-2 text-sm tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                                {dimension.score}
                              </div>
                            </div>
                            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                              <div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(239,246,255,0.92),rgba(129,198,255,0.72))]" style={{ width: `${dimension.score}%` }} />
                            </div>
                            <div className="mt-3 flex items-center justify-between text-[11px] tracking-[0.22em] text-stone-500 uppercase">
                              <span>当前亮度</span>
                              <span>{getScoreTone(dimension.score)}</span>
                            </div>
                            <p className="mt-5 text-sm leading-7 text-stone-300/80">{dimension.interpretation}</p>
                            <EvidencePanel evidence={dimension.evidence} mode={mode} />
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="space-y-5 border-t border-white/8 pt-2">
                      {report.dimensionReadings.map((reading, index) => (
                        <article key={reading.dimension} className={cx("rounded-[28px] p-5 transition duration-300 md:p-6", mode === "immersive" ? "bg-black/16 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]" : "bg-[rgba(189,218,255,0.08)] shadow-[0_0_0_1px_rgba(189,218,255,0.12)]")}>
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="max-w-2xl">
                              <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">0{index + 1} / 补充通道</p>
                              <h3 className="mt-3 text-2xl leading-[1.28] text-stone-100 md:text-[1.8rem]">{reading.title}</h3>
                            </div>
                            <div className={cx("rounded-full px-4 py-2 text-xs tracking-[0.18em] uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.06)]", mode === "immersive" ? "bg-white/[0.04] text-stone-300" : "bg-sky-100/10 text-sky-100")}>
                              {confidenceLabel[reading.confidenceBand] ?? reading.confidenceBand}
                            </div>
                          </div>
                          <p className={cx("mt-5 max-w-3xl leading-8", mode === "immersive" ? "text-base text-stone-300/86" : "text-[0.98rem] text-stone-200/88")}>{reading.summary}</p>
                          <EvidencePanel evidence={reading.evidence} mode={mode} />
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {report.dimensionReadings.map((reading, index) => (
                      <article key={reading.dimension} className={cx("rounded-[30px] p-5 transition duration-300 md:p-6", mode === "immersive" ? "bg-black/16 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-white/[0.035] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" : "bg-[rgba(189,218,255,0.08)] shadow-[0_0_0_1px_rgba(189,218,255,0.12)]")}>
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="max-w-2xl">
                            <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">0{index + 1} / {formatSignalLabel(reading.dimension)}</p>
                            <h3 className="mt-3 text-2xl leading-[1.28] text-stone-100 md:text-[2rem]">{reading.title}</h3>
                          </div>
                          <div className={cx("rounded-full px-4 py-2 text-xs tracking-[0.18em] uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.06)]", mode === "immersive" ? "bg-white/[0.04] text-stone-300" : "bg-sky-100/10 text-sky-100")}>
                            {confidenceLabel[reading.confidenceBand] ?? reading.confidenceBand}
                          </div>
                        </div>
                        <p className={cx("mt-5 max-w-3xl leading-8", mode === "immersive" ? "text-base text-stone-300/86 md:text-[1.03rem]" : "text-[0.98rem] text-stone-200/88")}>{reading.summary}</p>
                        <EvidencePanel evidence={reading.evidence} mode={mode} />
                      </article>
                    ))}
                  </div>
                )}
              </SectionShell>
            </MotionReveal>

            <MotionReveal delay={0.2}>
              <SectionShell id="tensions" eyebrow="03 / 核心张力" title="核心张力" lead="重要的不是消除张力，而是知道自己正被哪两股力量同时拉住，以及如何让它们在现实里继续共存。" mode={mode}>
                <div className="space-y-5">
                  {report.tensions.map((tension, index) => (
                    <article key={tension.tensionId} className={cx("rounded-[30px] p-5 transition duration-300 md:p-6", mode === "immersive" ? "bg-black/16 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-white/[0.035] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" : "bg-[rgba(189,218,255,0.08)] shadow-[0_0_0_1px_rgba(189,218,255,0.12)]")}>
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="max-w-2xl">
                          <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">0{index + 1} / 张力</p>
                          <h3 className="mt-3 text-2xl leading-[1.26] text-stone-100 md:text-[2rem]">{tension.name}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 md:max-w-sm md:justify-end">
                          {tension.poles.map((pole) => (
                            <span key={pole} className="rounded-full bg-white/[0.04] px-4 py-2 text-xs tracking-[0.18em] text-stone-300 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                              {pole}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-6 grid gap-5 lg:grid-cols-[0.62fr_0.38fr]">
                        <p className={cx("leading-8", mode === "immersive" ? "text-base text-stone-300/84" : "text-[0.98rem] text-stone-200/88")}>{tension.description}</p>
                        <div className={cx("rounded-[24px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]", mode === "immersive" ? "bg-white/[0.03]" : "bg-[#11151d]/75")}>
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
              <SectionShell id="archetype" eyebrow="04 / 原型说明" title="为什么是这个原型" lead="原型不是标签，而是这一阶段最能把你体内几股力量暂时拢在一起的名字。" mode={mode}>
                <div className={cx("rounded-[30px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] md:p-6", mode === "immersive" ? "bg-black/16" : "bg-[rgba(189,218,255,0.08)]")}>
                  <div className="grid gap-6 lg:grid-cols-[0.62fr_0.38fr]">
                    <div>
                      <p className={cx("max-w-3xl leading-9", mode === "immersive" ? "text-lg text-stone-200/88" : "text-[1.02rem] text-stone-100/88")}>{report.archetype.description}</p>
                      <div className="mt-6 flex flex-wrap gap-2 text-xs tracking-[0.18em] text-stone-400 uppercase">
                        {report.archetype.sourceSignals.map((signal) => (
                          <span key={signal} className="rounded-full bg-white/[0.03] px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">{formatSignalLabel(signal)}</span>
                        ))}
                      </div>
                    </div>
                    {report.archetype.visualPrompt ? (
                      <div className={cx("rounded-[24px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]", mode === "immersive" ? "bg-white/[0.03]" : "bg-[#11151d]/75")}>
                        <div className="flex items-center gap-3 text-stone-300">
                          <span className="rounded-full bg-white/[0.05] p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                            <Stars className="h-4 w-4" strokeWidth={1.5} />
                          </span>
                          <p className="text-[11px] tracking-[0.28em] text-stone-500 uppercase">视觉线索</p>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-stone-300/78">{report.archetype.visualPrompt}</p>
                      </div>
                    ) : null}
                  </div>
                  <EvidencePanel evidence={report.archetype.evidence} mode={mode} />
                </div>
              </SectionShell>
            </MotionReveal>

            {hasGrowthSuggestions ? (
              <MotionReveal delay={0.28}>
                <SectionShell id="growth" eyebrow="05 / 成长方向" title="接下来可以怎样生长" lead="这些建议不是标准答案，而是依据你当前的结构，为现实生活预留出的几条更贴身的下一步。" mode={mode}>
                  <div className="grid gap-4 xl:grid-cols-2">
                    {report.growthSuggestions?.map((item, index) => (
                      <article key={`${item.title}-${index}`} className={cx("rounded-[28px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] md:p-6", mode === "immersive" ? "bg-black/16 hover:bg-white/[0.035]" : "bg-[rgba(189,218,255,0.08)]")}>
                        <p className="text-[11px] tracking-[0.3em] text-stone-500 uppercase">成长建议</p>
                        <h3 className="mt-4 text-2xl leading-[1.3] text-stone-100">{item.title}</h3>
                        <p className="mt-4 text-sm leading-7 text-stone-300/78">{item.description}</p>
                        <div className="mt-5 space-y-3">
                          {item.actionableSteps.map((step, stepIndex) => (
                            <div key={`${item.title}-${stepIndex}`} className="rounded-[20px] bg-white/[0.03] px-4 py-3 text-sm leading-7 text-stone-200/84 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                              {step}
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </SectionShell>
              </MotionReveal>
            ) : null}

            <MotionReveal delay={0.32}>
              <SectionShell
                id="recommendations"
                eyebrow="06 / 推荐内容"
                title={hasCuratedRecommendations ? "与你相邻的书、影像与声音" : "接下来可以带走什么"}
                lead={
                  hasCuratedRecommendations
                    ? "这些不是泛泛的内容清单，而是基于你当前的审美结构、情绪语法与意义追问，向外延伸出的相邻可能。"
                    : mode === "immersive"
                      ? "这里不是效率清单，而是几件你可以带离这页、并在现实里慢慢试着安放的东西。"
                      : "证据阅读模式下，这些建议依然保留，但请先把它们理解成“和这份画像相匹配的下一步”，而不是标准答案。"
                }
                mode={mode}
              >
                {hasCuratedRecommendations ? (
                  <div className="space-y-8">
                    <div className="grid gap-4 xl:grid-cols-3">
                      <CuratedRecommendationGroup title="书籍" group="books" items={report.curatedRecommendations?.books ?? []} mode={mode} />
                      <CuratedRecommendationGroup title="电影" group="films" items={report.curatedRecommendations?.films ?? []} mode={mode} />
                      <CuratedRecommendationGroup title="音乐" group="music" items={report.curatedRecommendations?.music ?? []} mode={mode} />
                    </div>
                    {report.recommendations.length ? (
                      <div className="space-y-4 border-t border-white/8 pt-2">
                        <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">可带走的练习</p>
                        <div className="grid gap-4 md:grid-cols-2">
                          {report.recommendations.map((item, index) => (
                            <article key={`${item.title}-${index}`} className={cx("rounded-[28px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition duration-300 md:p-6", mode === "immersive" ? "bg-black/16 hover:bg-white/[0.035]" : "bg-[rgba(189,218,255,0.08)]")}>
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
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {report.recommendations.map((item, index) => (
                      <article key={`${item.title}-${index}`} className={cx("rounded-[28px] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition duration-300 md:p-6", mode === "immersive" ? "bg-black/16 hover:bg-white/[0.035]" : "bg-[rgba(189,218,255,0.08)]")}>
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
                )}
              </SectionShell>
            </MotionReveal>

            <MotionReveal delay={0.36}>
              <section id="care-note" className={cx("scroll-mt-24 rounded-[34px] p-6 backdrop-blur-xl md:p-8", mode === "immersive" ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] shadow-[0_0_0_1px_rgba(255,255,255,0.05)]" : "bg-[linear-gradient(180deg,rgba(255,244,212,0.05),rgba(255,255,255,0.03))] shadow-[0_0_0_1px_rgba(251,191,36,0.12)]")}>
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

            <MotionReveal delay={0.4}>
              <section id="share-save" className={cx("scroll-mt-24 rounded-[34px] p-6 backdrop-blur-xl md:p-8", mode === "immersive" ? "bg-white/[0.025] shadow-[0_0_0_1px_rgba(255,255,255,0.05)]" : "bg-[rgba(189,218,255,0.06)] shadow-[0_0_0_1px_rgba(189,218,255,0.12)]")}>
                <div className="space-y-3 text-center sm:text-left">
                  <p className="text-[11px] tracking-[0.36em] text-stone-500 uppercase">带走这份结果</p>
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
