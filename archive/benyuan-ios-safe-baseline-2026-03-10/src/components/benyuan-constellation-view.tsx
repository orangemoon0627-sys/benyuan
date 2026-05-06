"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GlassPanel, MetaPill, SectionTitle } from "@/components/framework-primitives";
import { BENYUAN_SESSION_STORAGE_KEY, type BenyuanSessionState } from "@/lib/benyuan-v3-client-session";
import type { PsycheConstellation } from "@/lib/benyuan-v3-types";

const labels: Record<string, string> = {
  openness: "开放性",
  independence: "独立性",
  emotional_depth: "情感深度",
  meaning_seeking: "意义追寻",
  aesthetic_sensitivity: "审美敏感",
  action_tendency: "行动力",
  relationship_need: "关系需求",
};

const recommendationMeta = [
  { key: "books", label: "书籍", icon: "📚" },
  { key: "films", label: "电影", icon: "🎬" },
  { key: "music", label: "音乐", icon: "🎵" },
] as const;

function pointAt(index: number, total: number, radius: number, center: number) {
  const angle = (-90 + index * (360 / total)) * (Math.PI / 180);
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

function polygonPoints(count: number, radius: number, center: number) {
  return Array.from({ length: count }, (_, index) => {
    const point = pointAt(index, count, radius, center);
    return `${point.x},${point.y}`;
  }).join(" ");
}

function dataPolygonPoints(values: Array<{ score: number }>, radius: number, center: number) {
  return values
    .map((value, index) => {
      const point = pointAt(index, values.length, (value.score / 100) * radius, center);
      return `${point.x},${point.y}`;
    })
    .join(" ");
}

export function BenyuanConstellationView() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PsycheConstellation | null>(null);
  const [runtime, setRuntime] = useState<Record<string, unknown> | null>(null);
  const [activeDimensionKey, setActiveDimensionKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadConstellation() {
      const storageSession = (() => {
        try {
          const raw = window.localStorage.getItem(BENYUAN_SESSION_STORAGE_KEY);
          return raw ? (JSON.parse(raw) as BenyuanSessionState) : null;
        } catch {
          return null;
        }
      })();
      const id = searchParams.get("constellation_id") ?? storageSession?.constellation_id;
      if (!id) {
        await Promise.resolve();
        if (!cancelled) setLoading(false);
        return;
      }

      const response = await fetch(`/api/constellation/${encodeURIComponent(id)}`);
      const payload = (await response.json()) as { constellation?: PsycheConstellation; runtime?: Record<string, unknown> };
      if (cancelled) return;
      setData(payload.constellation ?? null);
      setRuntime(payload.runtime ?? null);
      setLoading(false);
    }

    void loadConstellation();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const dimensions = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.seven_dimensions).map(([key, value]) => ({
      key,
      label: labels[key] ?? key,
      score: value.score,
      interpretation: value.interpretation,
    }));
  }, [data]);

  const activeDimension = dimensions.find((dimension) => dimension.key === activeDimensionKey) ?? dimensions[0] ?? null;

  if (loading) {
    return (
      <GlassPanel>
        <SectionTitle label="Loading" title="正在调入你的精神星图..." />
      </GlassPanel>
    );
  }

  if (!data) {
    return (
      <GlassPanel>
        <SectionTitle label="No Constellation" title="还没有可展示的精神星图。" description="先完成剧场体验，再回来查看结果。" />
      </GlassPanel>
    );
  }

  return (
    <div className="grid gap-6">
      <GlassPanel className="sticky top-[4.6rem] z-10 border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
          <a href="#section-archetype" className="border-b border-transparent pb-1 transition hover:border-[var(--accent-gold)] hover:text-[var(--text-primary)]">概览</a>
          <a href="#section-radar" className="border-b border-transparent pb-1 transition hover:border-[var(--accent-gold)] hover:text-[var(--text-primary)]">维度</a>
          <a href="#section-tensions" className="border-b border-transparent pb-1 transition hover:border-[var(--accent-gold)] hover:text-[var(--text-primary)]">张力</a>
          <a href="#section-growth" className="border-b border-transparent pb-1 transition hover:border-[var(--accent-gold)] hover:text-[var(--text-primary)]">建议</a>
          <a href="#section-recommendations" className="border-b border-transparent pb-1 transition hover:border-[var(--accent-gold)] hover:text-[var(--text-primary)]">推荐</a>
        </div>
      </GlassPanel>

      <section id="section-archetype" className="scroll-mt-28">
        <GlassPanel className="overflow-hidden bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.11),rgba(0,0,0,0.96)_56%)]">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.38em] text-[var(--text-tertiary)]">Archetype</p>
              <h2 className="mt-5 text-[2.3rem] leading-[1.04] text-[var(--text-primary)] md:text-[3.8rem]">{data.archetype.name}</h2>
              <p className="mt-4 text-sm uppercase tracking-[0.28em] text-[var(--accent-gold)]">{data.archetype.english_name}</p>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--text-secondary)] md:text-lg">{data.archetype.core_essence}</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {runtime?.mode ? <MetaPill>{String(runtime.mode)}</MetaPill> : null}
                {runtime?.model ? <MetaPill>{String(runtime.model)}</MetaPill> : null}
                <MetaPill>{new Date(data.generated_at).toLocaleString("zh-CN")}</MetaPill>
              </div>
            </div>

            <div className="relative min-h-[24rem] overflow-hidden border border-[rgba(212,175,55,0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.008))] p-6 md:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(212,175,55,0.18),transparent_24%),radial-gradient(circle_at_50%_68%,rgba(255,255,255,0.06),transparent_22%)]" />
              <div className="relative flex h-full flex-col justify-between">
                <p className="text-[11px] uppercase tracking-[0.38em] text-[var(--text-tertiary)]">Visual Prompt</p>
                <div className="flex flex-1 items-center justify-center py-8">
                  <div className="flex h-48 w-48 items-center justify-center rounded-full border border-[rgba(212,175,55,0.28)] bg-[radial-gradient(circle,rgba(212,175,55,0.16),rgba(0,0,0,0.12))] shadow-[0_0_40px_var(--glow)]">
                    <span className="text-5xl text-[var(--accent-gold)]">◆</span>
                  </div>
                </div>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{data.archetype.visual_prompt}</p>
              </div>
            </div>
          </div>
        </GlassPanel>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section id="section-radar" className="scroll-mt-28">
          <GlassPanel>
            <SectionTitle label="Radar" title="七维精神图谱" description="悬停或点击节点，查看这一维度在你身上的具体解释。" />
            <div className="mx-auto flex max-w-[38rem] justify-center">
              <svg viewBox="0 0 360 360" className="w-full max-w-[34rem]">
                {[0.25, 0.5, 0.75, 1].map((ratio) => (
                  <polygon
                    key={ratio}
                    points={polygonPoints(dimensions.length, 120 * ratio, 180)}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                  />
                ))}
                {dimensions.map((dimension, index) => {
                  const point = pointAt(index, dimensions.length, 120, 180);
                  const labelPoint = pointAt(index, dimensions.length, 146, 180);
                  const nodePoint = pointAt(index, dimensions.length, (dimension.score / 100) * 120, 180);
                  const active = activeDimension?.key === dimension.key;
                  return (
                    <g key={dimension.key}>
                      <line x1="180" y1="180" x2={point.x} y2={point.y} stroke="rgba(255,255,255,0.08)" />
                      <text x={labelPoint.x} y={labelPoint.y} fill={active ? "rgba(212,175,55,0.95)" : "rgba(255,255,255,0.82)"} fontSize="11" textAnchor="middle">
                        {dimension.label}
                      </text>
                      <circle
                        cx={nodePoint.x}
                        cy={nodePoint.y}
                        r={active ? 7 : 5}
                        fill="rgba(212,175,55,0.95)"
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setActiveDimensionKey(dimension.key)}
                        onClick={() => setActiveDimensionKey(dimension.key)}
                      />
                    </g>
                  );
                })}
                <polygon points={dataPolygonPoints(dimensions, 120, 180)} fill="rgba(212,175,55,0.14)" stroke="rgba(212,175,55,0.94)" strokeWidth="2" />
              </svg>
            </div>
          </GlassPanel>
        </section>

        <GlassPanel>
          <SectionTitle label="Dimension Focus" title={activeDimension?.label ?? "七维解读"} description="这张卡片会跟随你当前聚焦的维度变化。" />
          {activeDimension ? (
            <div className="border border-[rgba(212,175,55,0.22)] bg-[rgba(212,175,55,0.05)] p-5">
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--text-tertiary)]">当前维度</p>
              <p className="mt-4 text-[3rem] leading-none text-[var(--text-primary)]">{activeDimension.score}</p>
              <p className="mt-5 text-sm leading-7 text-[var(--text-secondary)]">{activeDimension.interpretation}</p>
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            {dimensions.map((dimension) => {
              const active = activeDimension?.key === dimension.key;
              return (
                <button
                  key={dimension.key}
                  type="button"
                  onMouseEnter={() => setActiveDimensionKey(dimension.key)}
                  onClick={() => setActiveDimensionKey(dimension.key)}
                  className={`w-full border px-4 py-4 text-left transition ${active ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.06)]" : "border-[var(--border)] bg-[rgba(255,255,255,0.012)] hover:border-[rgba(212,175,55,0.32)]"}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base text-[var(--text-primary)]">{dimension.label}</span>
                    <span className="font-mono text-sm text-[var(--text-secondary)]">{dimension.score}%</span>
                  </div>
                  <div className="mt-3 h-px w-full bg-[rgba(255,255,255,0.1)]">
                    <div className="h-px bg-[linear-gradient(90deg,rgba(212,175,55,0.95),rgba(212,175,55,0.35))]" style={{ width: `${dimension.score}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel>
        <SectionTitle label="Narrative" title="精神地形总览" description="这是 Part 1 与 Part 2 共同折叠出的整体叙事。" />
        <div className="mx-auto max-w-4xl space-y-6 text-[1.02rem] leading-9 text-[var(--text-secondary)] md:text-[1.08rem] md:leading-10">
          {data.narrative_overview.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </GlassPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <section id="section-tensions" className="scroll-mt-28">
          <GlassPanel>
            <SectionTitle label="Core Tensions" title="核心张力识别" />
            <div className="space-y-4">
              {data.core_tensions.map((tension) => (
                <div key={tension.tension_id} className="border border-[var(--border)] bg-[rgba(255,255,255,0.012)] p-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-gold)]">0{tension.tension_id}</p>
                  <h3 className="mt-4 text-[1.35rem] text-[var(--text-primary)]">{tension.name}</h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{tension.description}</p>
                  <p className="mt-5 text-sm leading-7 text-[var(--text-primary)]">{tension.growth_direction}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </section>

        <section id="section-growth" className="scroll-mt-28">
          <GlassPanel>
            <SectionTitle label="Growth" title="成长建议" />
            <div className="space-y-4">
              {data.growth_suggestions.map((item, index) => (
                <div key={item.title} className="border border-[var(--border)] bg-[rgba(255,255,255,0.012)] p-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-[var(--text-tertiary)]">建议 0{index + 1}</p>
                  <h3 className="mt-4 text-[1.3rem] text-[var(--text-primary)]">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{item.description}</p>
                  <ul className="mt-5 space-y-2 text-sm leading-7 text-[var(--text-primary)]">
                    {item.actionable_steps.map((step) => (
                      <li key={step}>- {step}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </GlassPanel>
        </section>
      </div>

      <section id="section-recommendations" className="scroll-mt-28">
        <GlassPanel>
          <SectionTitle label="Recommendations" title="为你推荐" />
          <div className="grid gap-4 xl:grid-cols-3">
            {recommendationMeta.map((group) => (
              <div key={group.key} className="border border-[var(--border)] bg-[rgba(255,255,255,0.012)] p-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{group.icon}</span>
                  <h3 className="text-lg text-[var(--text-primary)]">{group.label}</h3>
                </div>
                <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--text-secondary)]">
                  {group.key === "books"
                    ? data.recommendations.books.map((item) => (
                        <div key={`${item.title}-${item.author}`}>
                          <p className="text-[var(--text-primary)]">{item.title} · {item.author}</p>
                          <p>{item.reason}</p>
                        </div>
                      ))
                    : null}
                  {group.key === "films"
                    ? data.recommendations.films.map((item) => (
                        <div key={`${item.title}-${item.director}`}>
                          <p className="text-[var(--text-primary)]">{item.title} · {item.director}</p>
                          <p>{item.reason}</p>
                        </div>
                      ))
                    : null}
                  {group.key === "music"
                    ? data.recommendations.music.map((item) => (
                        <div key={`${item.artist}-${item.album}`}>
                          <p className="text-[var(--text-primary)]">{item.artist} · {item.album}</p>
                          <p>{item.reason}</p>
                        </div>
                      ))
                    : null}
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </section>
    </div>
  );
}
