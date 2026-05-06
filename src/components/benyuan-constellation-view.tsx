"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Film, Music } from "lucide-react";
import { DetailCard, GlassPanel, ImmersivePassiveState, ImmersiveSigil, ImmersiveTopBar, PrimaryButton, SecondaryButton } from "@/components/framework-primitives";
import { benyuanUiRecipes, cx } from "@/config/benyuan-ui-recipes";
import { buildConstellationShortFlow } from "@/lib/benyuan-mainflow-presentation";
import { BENYUAN_SESSION_STORAGE_KEY, type BenyuanSessionState } from "@/lib/benyuan-v3-client-session";
import { shareWithBenyuanNativeShell } from "@/lib/benyuan-native-shell";
import { deriveConstellationSupportTone } from "@/lib/benyuan-v3-report-profile";
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
  { key: "books", label: "书籍", Icon: BookOpen },
  { key: "films", label: "电影", Icon: Film },
  { key: "music", label: "音乐", Icon: Music },
] as const;

function ResultSectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">{label}</p>
      <h3 className="mt-2 text-[1.25rem] font-semibold tracking-[0em] text-[var(--text-primary)] md:text-[1.45rem]">{title}</h3>
    </div>
  );
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function measureChar(char: string) {
  return /[\u0000-\u00ff]/.test(char) ? 0.56 : 1;
}

function wrapText(value: string, maxUnits: number) {
  const source = value.replace(/\s+/g, " ").trim();
  if (!source) return [] as string[];

  const lines: string[] = [];
  let current = "";
  let width = 0;

  for (const char of source) {
    const nextWidth = measureChar(char);
    if (current && width + nextWidth > maxUnits) {
      lines.push(current);
      current = char;
      width = nextWidth;
      continue;
    }

    current += char;
    width += nextWidth;
  }

  if (current) lines.push(current);
  return lines;
}

function shortenText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;

  const separators = ["。", "！", "？", "；"];
  for (const separator of separators) {
    const index = normalized.indexOf(separator);
    if (index >= 24 && index <= maxLength) {
      return normalized.slice(0, index + 1).trim();
    }
  }

  return `${normalized.slice(0, maxLength).trim()}……`;
}

function downloadFile(filename: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function exportSvgAsPng(svg: string, filename: string, width: number, height: number) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("canvas_context_unavailable"));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            reject(new Error("png_blob_unavailable"));
            return;
          }
          downloadFile(filename, pngBlob, "image/png");
          resolve();
        }, "image/png");
      };
      image.onerror = () => reject(new Error("image_load_failed"));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function buildConstellationExportSvg(
  data: PsycheConstellation,
  dimensionLeaders: Array<{ label: string; score: number }>,
  supportTone: "supportive" | "standard",
) {
  const width = 1080;
  const height = 1680;
  const side = 104;
  const blocks: string[] = [];
  let y = 128;

  const addLines = (lines: string[], fontSize: number, fill: string, lineHeight: number, weight = 400) => {
    if (lines.length === 0) return;
    const text = lines
      .map((line, index) => `<tspan x="${side}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
      .join("");
    blocks.push(`<text x="${side}" y="${y}" fill="${fill}" font-size="${fontSize}" font-weight="${weight}" font-family="SF Pro Display, PingFang SC, sans-serif">${text}</text>`);
    y += lineHeight * Math.max(lines.length - 1, 0) + lineHeight;
  };

  const addParagraph = (value: string, options: { fontSize: number; fill: string; lineHeight: number; maxUnits: number; weight?: number; gap?: number }) => {
    addLines(wrapText(value, options.maxUnits), options.fontSize, options.fill, options.lineHeight, options.weight ?? 400);
    y += options.gap ?? 18;
  };

  const narrativeSnippet = data.narrative_overview.split(/\n\n+/).filter((item) => item.trim().length > 0).slice(0, 2).join(" ");
  const topDimensions = dimensionLeaders.slice(0, 3).map((item) => `${item.label} ${item.score}%`).join(" · ");
  const firstTension = data.core_tensions[0]?.name ?? "--";
  const firstGrowth = data.growth_suggestions[0]?.actionable_steps.slice(0, 2).join("；") ?? data.growth_suggestions[0]?.title ?? "--";
  const recommendationTrail = [
    ...data.recommendations.books.slice(0, 1).map((item) => `${item.title} · ${item.author}`),
    ...data.recommendations.films.slice(0, 1).map((item) => `${item.title} · ${item.director}`),
    ...data.recommendations.music.slice(0, 1).map((item) => `${item.artist} · ${item.album}`),
  ].join(" / ");
  const boundaryNote =
    supportTone === "supportive"
      ? "边界说明：如果你今天状态偏重，只需要先带走一条动作，不必一次读完整份结果。"
      : "边界说明：这份星图是一种理解性镜像，不构成医疗或心理诊断。";

  blocks.push(`
    <rect width="1080" height="1680" fill="#000000" />
    <rect x="72" y="72" width="936" height="1536" fill="none" stroke="rgba(255,255,255,0.09)" />
    <circle cx="860" cy="220" r="180" fill="rgba(212,175,55,0.08)" />
    <circle cx="260" cy="1260" r="220" fill="rgba(255,255,255,0.04)" />
    <line x1="104" y1="96" x2="224" y2="96" stroke="#D4AF37" stroke-width="2" />
  `);

  addLines(["本源 · 精神星图"], 22, "#D4AF37", 28, 500);
  addLines([data.archetype.name], 58, "#FFFFFF", 64, 300);
  addLines([data.archetype.english_name], 18, "rgba(212,175,55,0.88)", 24, 500);
  y += 8;
  addParagraph(data.archetype.core_essence, { fontSize: 26, fill: "rgba(255,255,255,0.9)", lineHeight: 38, maxUnits: 28, weight: 300, gap: 28 });

  addLines(["本质"], 20, "#D4AF37", 24, 500);
  addParagraph(`主导维度：${topDimensions}`, { fontSize: 22, fill: "rgba(255,255,255,0.88)", lineHeight: 34, maxUnits: 34, gap: 14 });
  addParagraph(`核心张力：${firstTension}`, { fontSize: 22, fill: "rgba(255,255,255,0.88)", lineHeight: 34, maxUnits: 34, gap: 14 });
  addParagraph(`行动入口：${firstGrowth}`, { fontSize: 22, fill: "rgba(255,255,255,0.88)", lineHeight: 34, maxUnits: 34, gap: 14 });
  addParagraph(`推荐起点：${recommendationTrail || "--"}`, { fontSize: 22, fill: "rgba(255,255,255,0.88)", lineHeight: 34, maxUnits: 34, gap: 26 });

  addLines(["继续阅读"], 20, "#D4AF37", 24, 500);
  addParagraph(narrativeSnippet, { fontSize: 21, fill: "rgba(255,255,255,0.82)", lineHeight: 34, maxUnits: 37, gap: 26 });

  addLines(["边界说明"], 20, "#D4AF37", 24, 500);
  addParagraph(boundaryNote, { fontSize: 20, fill: "rgba(255,255,255,0.78)", lineHeight: 32, maxUnits: 38, gap: 36 });

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${blocks.join("")}
  </svg>`;
}

export function BenyuanConstellationView() {
  const searchParams = useSearchParams();
  const resetTimerRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PsycheConstellation | null>(null);
  const [activeDimensionKey, setActiveDimensionKey] = useState<string | null>(null);
  const [shareState, setShareState] = useState<"idle" | "done" | "error">("idle");
  const [pngState, setPngState] = useState<"idle" | "done" | "error">("idle");
  const [actionHint, setActionHint] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

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
      const payload = (await response.json()) as { constellation?: PsycheConstellation };
      if (cancelled) return;
      setData(payload.constellation ?? null);
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

  const dimensionLeaders = useMemo(() => [...dimensions].sort((a, b) => b.score - a.score), [dimensions]);
  const activeDimension = dimensions.find((dimension) => dimension.key === activeDimensionKey) ?? dimensionLeaders[0] ?? null;
  const narrativeParagraphs = useMemo(() => (data ? data.narrative_overview.split(/\n\n+/).filter((item) => item.trim().length > 0) : []), [data]);
  const supportTone = data ? deriveConstellationSupportTone(data) : "standard";
  const supportHint =
    supportTone === "supportive"
      ? "这份星图更适合慢慢读。先带走一条动作就够了。"
      : "先抓住一条张力，再带走一条动作。";
  const summaryPayload = useMemo(() => {
    if (!data) return "";
    const topDimensions = dimensionLeaders.slice(0, 3).map((item) => `${item.label} ${item.score}%`).join(" / ");
    const firstTension = data.core_tensions[0]?.name ?? "--";
    const firstAction = data.growth_suggestions[0]?.actionable_steps[0] ?? data.growth_suggestions[0]?.title ?? "--";

    return [
      `本源｜${data.archetype.name}`,
      data.archetype.core_essence,
      `主导维度：${topDimensions || "--"}`,
      `核心张力：${firstTension}`,
      `最小行动：${firstAction}`,
      `阅读提示：${supportHint}`,
    ].join("\n\n");
  }, [data, dimensionLeaders, supportHint]);
  const exportSvg = useMemo(() => (data ? buildConstellationExportSvg(data, dimensionLeaders, supportTone) : null), [data, dimensionLeaders, supportTone]);
  const topStructureDimensions = dimensionLeaders.slice(0, 3);
  const activeStructureSummary = activeDimension ? shortenText(activeDimension.interpretation, 38) : "";
  const shortFlow = useMemo(() => (data ? buildConstellationShortFlow(data) : null), [data]);
  const essenceLead = shortFlow?.essence.lead ?? "--";
  const essenceSupport = shortFlow?.essence.support ?? "--";
  const primaryActionStep = shortFlow?.moment.path?.actionable_steps[0] ?? shortFlow?.moment.path?.title ?? "";

  function resetActionFeedback(kind: "share" | "png") {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      if (kind === "share") setShareState("idle");
      if (kind === "png") setPngState("idle");
      setActionHint(null);
      resetTimerRef.current = null;
    }, 1800);
  }

  async function handleShare() {
    if (!data) return;

    try {
      const channel = await shareWithBenyuanNativeShell({
        title: `本源｜${data.archetype.name}`,
        text: summaryPayload,
        url: window.location.href,
      });

      setShareState("done");
      setActionHint(
        channel === "native"
          ? "已调用 iOS shell 原生分享面板。"
          : channel === "web"
            ? "系统分享面板已打开。"
            : "当前环境未提供系统分享，仍可先保存。",
      );
      resetActionFeedback("share");
    } catch {
      setShareState("error");
      setActionHint("这次没能触发分享，你仍然可以先保存当前结果。");
      resetActionFeedback("share");
    }
  }

  async function handleExportPng() {
    if (!data || !exportSvg) return;

    try {
      await exportSvgAsPng(exportSvg, `benyuan-${data.archetype.name}-summary.png`, 1080, 1680);
      setPngState("done");
      setActionHint("PNG 摘要已开始导出。你可以把它当作当前结果卡带走。 ");
      resetActionFeedback("png");
    } catch {
      setPngState("error");
      setActionHint("这次没能导出 PNG，你仍然可以继续分享或稍后再试。");
      resetActionFeedback("png");
    }
  }

  if (loading) {
    return (
      <ImmersivePassiveState
        backHref="/theater"
        topProgressValue={84}
        eyebrow="星图装载"
        title="星图显形"
        description="原型一旦显形，就直接抵达这一页。"
      />
    );
  }

  if (!data) {
    return (
      <ImmersivePassiveState
        backHref="/theater"
        topProgressValue={100}
        eyebrow="暂无星图"
        title="等待星图"
        description="先完成剧场体验，再回来查看结果。"
        actions={
          <PrimaryButton type="button" onClick={() => window.location.assign("/theater")} className="min-h-12 px-6 py-3 text-sm">
            回到剧场
          </PrimaryButton>
        }
      />
    );
  }

  return (
    <div className={cx(benyuanUiRecipes.immersiveFlowNarrow, "cosmic-result-one-shot")}>
      <ImmersiveTopBar backHref="/theater" progressValue={100} />

      <GlassPanel className={cx(benyuanUiRecipes.heroAccentPanel, "cosmic-result-hero mx-auto w-full max-w-[30rem]")}>
        <div className="mx-auto flex min-h-[52vh] max-w-[21rem] flex-col items-center justify-center text-center md:max-w-[25rem]">
          <ImmersiveSigil size="md" />
          <h2 className="mt-6 max-w-[18rem] text-[3.35rem] font-black leading-[0.9] tracking-[0em] text-[var(--text-primary)] md:max-w-none md:text-[5.2rem]">{data.archetype.name}</h2>
          <p className="mt-4 text-[10px] uppercase tracking-[0.32em] text-[var(--text-tertiary)]">{data.archetype.english_name}</p>
          <div className="mt-6 h-px w-16 bg-[linear-gradient(90deg,transparent,rgba(217,214,223,0.54),transparent)]" />
          <p className="mt-7 max-w-[18.5rem] text-[1.12rem] leading-[1.62] text-[var(--text-primary)] md:max-w-[23rem] md:text-[1.48rem]">{data.archetype.core_essence}</p>
          <p className="cosmic-result-hero-hint">继续向下接收星图</p>
        </div>
      </GlassPanel>

      <div className="cosmic-result-sequence mx-auto grid w-full max-w-[30rem] grid-cols-1 gap-2.5">
        <button
          type="button"
          onClick={() => activeDimension && setActiveDimensionKey(activeDimension.key)}
          className="cosmic-result-card"
          data-benyuan-pressable="true"
        >
          <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">ESSENCE</span>
          <span className="mt-2 text-[1.22rem] font-black tracking-[0em] text-[var(--text-primary)] md:text-[1.5rem]">本质</span>
          <span className="mt-1 text-[10px] text-[var(--text-secondary)]">为什么出发</span>
          <span className="mt-5 text-[0.95rem] leading-7 text-[var(--text-primary)]">{essenceLead}</span>
          <span className="mt-2 text-[0.82rem] leading-6 text-[var(--text-tertiary)]">{essenceSupport}</span>
        </button>
        <button
          type="button"
          onClick={() => activeDimension && setActiveDimensionKey(activeDimension.key)}
          className="cosmic-result-card"
          data-benyuan-pressable="true"
        >
          <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">STRUCTURE</span>
          <span className="mt-2 text-[1.22rem] font-black tracking-[0em] text-[var(--text-primary)] md:text-[1.5rem]">结构</span>
          <span className="mt-1 text-[10px] text-[var(--text-secondary)]">如何前行</span>
          <span className="mt-5 text-[0.95rem] leading-7 text-[var(--text-primary)]">
            {topStructureDimensions.map((item) => item.label).join(" · ") || "--"}
          </span>
          <span className="mt-2 text-[0.82rem] leading-6 text-[var(--text-tertiary)]">{activeStructureSummary || "--"}</span>
        </button>
        <div className="cosmic-result-card">
          <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">NOW</span>
          <span className="mt-2 text-[1.22rem] font-black tracking-[0em] text-[var(--text-primary)] md:text-[1.5rem]">此刻</span>
          <span className="mt-1 text-[10px] text-[var(--text-secondary)]">你的当下指引</span>
          <span className="mt-5 text-[0.95rem] leading-7 text-[var(--text-primary)]">{shortFlow?.moment.tension?.name ?? "--"}</span>
          <span className="mt-2 text-[0.82rem] leading-6 text-[var(--text-tertiary)]">{primaryActionStep || shortFlow?.moment.path?.title || "--"}</span>
        </div>
      </div>

      <details className={cx(benyuanUiRecipes.collapsiblePanel, "mx-auto w-full max-w-[30rem]")}>
        <summary className="cursor-pointer list-none px-5 py-5 text-left md:px-6">
          <p className="text-sm font-medium tracking-[0em] text-[var(--text-primary)]">继续阅读全部结果</p>
        </summary>
        <div className="border-t border-[rgba(255,255,255,0.08)] px-5 py-5 md:px-6">
          <div className="space-y-6">
            <div>
              <ResultSectionHeading label="完整结构" title="七维星图" />
              <div className="grid gap-3 sm:grid-cols-2">
                {dimensions.map((dimension) => {
                  const active = activeDimension?.key === dimension.key;
                  return (
                    <button
                      key={dimension.key}
                      type="button"
                      onMouseEnter={() => setActiveDimensionKey(dimension.key)}
                      onClick={() => setActiveDimensionKey(dimension.key)}
                      className={cx(benyuanUiRecipes.interactiveCard(active, "accent"), "px-4 py-4")}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-base text-[var(--text-primary)]">{dimension.label}</span>
                        <span className="font-mono text-sm text-[var(--text-secondary)]">{dimension.score}%</span>
                      </div>
                      <div className="mt-3 h-[3px] w-full rounded-full bg-[rgba(255,255,255,0.1)]">
                        <div className="h-[3px] rounded-full bg-[linear-gradient(90deg,rgba(243,241,234,0.9),rgba(217,214,223,0.44))]" style={{ width: `${dimension.score}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {shortFlow && shortFlow.folded.secondaryTensions.length > 0 ? (
              <div>
                <ResultSectionHeading label="更多张力" title="其余的内在拉扯" />
                <div className="space-y-4">
                  {shortFlow.folded.secondaryTensions.map((tension, index) => (
                    <DetailCard key={tension.tension_id} label={`张力 0${index + 2}`} title={tension.name} description={tension.description} tone="accent">
                      <p className="text-sm leading-7 text-[var(--text-primary)]">{tension.growth_direction}</p>
                    </DetailCard>
                  ))}
                </div>
              </div>
            ) : null}

            {shortFlow && shortFlow.folded.secondaryPaths.length > 0 ? (
              <div>
                <ResultSectionHeading label="更多路径" title="其余可继续带走的动作" />
                <div className="space-y-4">
                  {shortFlow.folded.secondaryPaths.map((item, index) => (
                    <DetailCard key={`${item.title}-${index + 1}`} label={`路径 0${index + 2}`} title={item.title} description={item.description}>
                      <ul className="mt-5 space-y-2 text-sm leading-7 text-[var(--text-primary)]">
                        {item.actionable_steps.map((step, stepIndex) => (
                          <li key={`${item.title}-${step}-${stepIndex}`}>- {step}</li>
                        ))}
                      </ul>
                    </DetailCard>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
                <ResultSectionHeading label="地形" title="精神地形总览" />
                <div className="space-y-4">
                  {(shortFlow?.folded.narrativeParagraphs ?? narrativeParagraphs).map((paragraph, index) => (
                    <DetailCard key={index} label={`段落 0${index + 1}`} title={<span className="text-[1rem] leading-8 text-[var(--text-secondary)] md:text-[1.05rem] md:leading-9">{paragraph}</span>} />
                  ))}
                </div>
            </div>

            <div>
              <ResultSectionHeading label="回响" title="继续共鸣的内容" />
              <div className="grid gap-4 xl:grid-cols-3">
                {recommendationMeta.map((group) => (
                  <div key={group.key} className={cx("p-5", benyuanUiRecipes.sectionPanel)}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(243,241,234,0.12)] bg-[rgba(255,255,255,0.035)] text-[var(--text-secondary)]">
                        <group.Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg text-[var(--text-primary)]">{group.label}</h3>
                    </div>
                    <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--text-secondary)]">
                      {group.key === "books"
                        ? data.recommendations.books.map((item) => (
                            <div key={`${item.title}-${item.author}`} className="border-b border-[rgba(255,255,255,0.06)] pb-4 last:border-b-0 last:pb-0">
                              <p className="text-[var(--text-primary)]">{item.title} · {item.author}</p>
                              <p>{item.reason}</p>
                            </div>
                          ))
                        : null}
                      {group.key === "films"
                        ? data.recommendations.films.map((item) => (
                            <div key={`${item.title}-${item.director}`} className="border-b border-[rgba(255,255,255,0.06)] pb-4 last:border-b-0 last:pb-0">
                              <p className="text-[var(--text-primary)]">{item.title} · {item.director}</p>
                              <p>{item.reason}</p>
                            </div>
                          ))
                        : null}
                      {group.key === "music"
                        ? data.recommendations.music.map((item) => (
                            <div key={`${item.artist}-${item.album}`} className="border-b border-[rgba(255,255,255,0.06)] pb-4 last:border-b-0 last:pb-0">
                              <p className="text-[var(--text-primary)]">{item.artist} · {item.album}</p>
                              <p>{item.reason}</p>
                            </div>
                          ))
                        : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </details>

      <section className="cosmic-result-final mx-auto w-full max-w-[30rem]" aria-label="星图收束">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">RETURN</p>
        <h3 className="mt-4 text-[2.05rem] font-black leading-none tracking-[0em] text-[var(--text-primary)] md:text-[2.7rem]">这不是结论</h3>
        <p className="mt-4 text-[1.02rem] leading-8 text-[var(--text-primary)]">是你此刻的精神坐标。</p>
        <p className="mt-5 text-sm leading-7 text-[var(--text-secondary)]">{supportHint}</p>
      </section>

      <div className="cosmic-result-action-dock mx-auto w-full max-w-[30rem]">
        {actionHint ? <p role="status" aria-live="polite" className="cosmic-result-action-hint">{actionHint}</p> : null}
        <div className="grid grid-cols-3 gap-2">
          <SecondaryButton type="button" onClick={() => void handleShare()} className="cosmic-result-action-button disabled:cursor-not-allowed disabled:opacity-50">
            {shareState === "done" ? "已分享" : shareState === "error" ? "分享失败" : "分享"}
          </SecondaryButton>
          <SecondaryButton type="button" onClick={() => void handleExportPng()} className="cosmic-result-action-button disabled:cursor-not-allowed disabled:opacity-50">
            {pngState === "done" ? "已保存" : pngState === "error" ? "保存失败" : "保存"}
          </SecondaryButton>
          <a href="/collect" className={cx(benyuanUiRecipes.secondaryLink, "cosmic-result-action-button")}>重新探索</a>
        </div>
      </div>
    </div>
  );
}
