"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDown, BookOpen, Film, Music } from "lucide-react";
import { GlassPanel, ImmersivePassiveState, ImmersiveTopBar, PrimaryButton, SecondaryButton } from "@/components/framework-primitives";
import { benyuanUiRecipes, cx } from "@/config/benyuan-ui-recipes";
import { buildConstellationShortFlow } from "@/lib/benyuan-mainflow-presentation";
import { BENYUAN_SESSION_STORAGE_KEY, benyuanFetch, type BenyuanSessionState } from "@/lib/benyuan-v3-client-session";
import { shareWithBenyuanNativeShell } from "@/lib/benyuan-native-shell";
import { deriveConstellationSupportTone } from "@/lib/benyuan-v3-report-profile";
import type { PsycheConstellation } from "@/lib/benyuan-v3-types";

const labels: Record<string, string> = {
  openness: "潜意识开放度",
  independence: "边界完整度",
  emotional_depth: "情绪沉潜度",
  meaning_seeking: "意义欲望",
  aesthetic_sensitivity: "象征感受力",
  action_tendency: "现实落地力",
  relationship_need: "客体联结需求",
};

const recommendationMeta = [
  { key: "books", label: "书籍", Icon: BookOpen },
  { key: "films", label: "电影", Icon: Film },
  { key: "music", label: "音乐", Icon: Music },
] as const;

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

function stripDimensionPrefixes(value: string) {
  return value
    .replace(/^(结论|核心结论|潜在防御|潜在意图|盲点|可用方向)[：:]/u, "")
    .replace(/\s+(潜在防御|潜在意图|盲点|可用方向)[：:]/gu, " ")
    .trim();
}

function sentenceWithSpace(value: string) {
  const text = value.trim();
  if (!text) return "";
  return /^[，。；、,.!?！？]/u.test(text) ? text : ` ${text}`;
}

function constellationDisplayName(data: PsycheConstellation) {
  return data.archetype.name;
}

function constellationDisplaySubtitle(data: PsycheConstellation) {
  return data.archetype.english_name;
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
  addLines([constellationDisplayName(data)], 58, "#FFFFFF", 64, 300);
  addLines([constellationDisplaySubtitle(data)], 22, "rgba(255,255,255,0.78)", 30, 400);
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

function WebCelestialGlyph({ archetypeName }: { archetypeName: string }) {
  const name = archetypeName.toLowerCase();
  const variant = name.includes("事件视界") || name.includes("event horizon")
    ? "black-hole"
    : name.includes("星云") || name.includes("nebula")
      ? "nebula"
      : name.includes("日冕") || name.includes("solar")
        ? "corona"
        : name.includes("类地") || name.includes("terrestrial")
          ? "earth"
          : name.includes("锚定") || name.includes("anchor")
            ? "anchor"
            : name.includes("雨窗") || name.includes("rain")
              ? "rain"
              : name.includes("筑序") || name.includes("architect")
                ? "architect"
                : name.includes("游牧") || name.includes("nomad")
                  ? "nomad"
                  : name.includes("月港") || name.includes("harbor")
                    ? "harbor"
                    : "moon";

  return (
    <div className="web-celestial-glyph" data-celestial={variant} aria-hidden>
      <span className="web-celestial-glyph__ring" />
      <span className="web-celestial-glyph__body" />
      <span className="web-celestial-glyph__dust" />
    </div>
  );
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

      const response = await benyuanFetch(`/api/constellation/${encodeURIComponent(id)}`);
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
      interpretation: stripDimensionPrefixes(value.interpretation),
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
      `本源｜${constellationDisplayName(data)}`,
      constellationDisplaySubtitle(data),
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
  const primaryTension = shortFlow?.moment.tension;
  const primaryPath = shortFlow?.moment.path;
  const foldedNarrative = shortFlow?.folded.narrativeParagraphs ?? narrativeParagraphs;
  const recommendationLead = [
    data?.recommendations.books[0] ? `${data.recommendations.books[0].title} · ${data.recommendations.books[0].author}` : null,
    data?.recommendations.films[0] ? `${data.recommendations.films[0].title} · ${data.recommendations.films[0].director}` : null,
    data?.recommendations.music[0] ? `${data.recommendations.music[0].artist} · ${data.recommendations.music[0].album}` : null,
  ].filter(Boolean).join(" / ");

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
        title: `本源｜${constellationDisplayName(data)}`,
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
      await exportSvgAsPng(exportSvg, `benyuan-${constellationDisplayName(data)}-summary.png`, 1080, 1680);
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
    <div className={cx(benyuanUiRecipes.immersiveFlowNarrow, "constellation-moon-scroll")} data-constellation-state="ready">
      <ImmersiveTopBar backHref="/theater" progressValue={100} progressText="星图抵达" />

      <GlassPanel className="constellation-lens-stage mx-auto w-full max-w-[30rem]" data-constellation-section="archetype">
        <div className="constellation-lens-stage__inner">
          <div className="constellation-core-orb" aria-hidden>
            <div className="constellation-core-orb__axis" />
            <WebCelestialGlyph archetypeName={data.archetype.name} />
          </div>
          <p className="constellation-kicker">精神星图</p>
          <h2 className="constellation-archetype-title">{constellationDisplayName(data)}</h2>
          <p className="constellation-archetype-subtitle">{constellationDisplaySubtitle(data)}</p>
          <p className="constellation-essence-copy">{data.archetype.core_essence}</p>
          <a href="#constellation-map" className="constellation-scroll-cue" aria-label="继续查看星图">
            <ArrowDown className="h-4 w-4" strokeWidth={1.5} />
          </a>
        </div>
      </GlassPanel>

      <section id="constellation-map" className="constellation-dimension-orbit mx-auto w-full max-w-[30rem]" data-constellation-section="dimensions">
        <div className="constellation-section-intro">
          <p>七维轨道</p>
          <h3>{topStructureDimensions.map((item) => item.label).join(" · ") || "精神结构"}</h3>
          <span>{activeStructureSummary || essenceSupport}</span>
        </div>
        <div className="constellation-dimension-orbit__plane">
          <div className="constellation-dimension-orbit__center">
            <span>{activeDimension?.score ?? "--"}%</span>
            <p>{activeDimension?.label ?? "主导维度"}</p>
          </div>
          {dimensions.map((dimension, index) => {
            const active = activeDimension?.key === dimension.key;
            return (
              <button
                key={dimension.key}
                type="button"
                className="constellation-dimension-node"
                data-active={active ? "true" : "false"}
                style={{ "--orbit-index": index, "--dimension-score": `${dimension.score}%` } as CSSProperties}
                onMouseEnter={() => setActiveDimensionKey(dimension.key)}
                onClick={() => setActiveDimensionKey(dimension.key)}
              >
                <span>{dimension.label}</span>
                <strong>{dimension.score}</strong>
              </button>
            );
          })}
        </div>
        <p className="constellation-dimension-reading">{activeDimension?.interpretation ?? essenceLead}</p>
      </section>

      <section className="constellation-narrative-river mx-auto w-full max-w-[30rem]" data-constellation-section="river">
        <div className="constellation-river-line" aria-hidden />
        <article className="constellation-river-moment">
          <p>本质</p>
          <h3>{essenceLead}</h3>
          <span>{essenceSupport}</span>
        </article>
        <article className="constellation-river-moment">
          <p>张力</p>
          <h3>{primaryTension?.name ?? "--"}</h3>
          <span>{primaryTension?.description ?? "--"}</span>
          {primaryTension?.growth_direction ? <em>{primaryTension.growth_direction}</em> : null}
        </article>
        <article className="constellation-river-moment">
          <p>路径</p>
          <h3>{primaryPath?.title ?? "下一步"}</h3>
          <span>{primaryActionStep || primaryPath?.description || supportHint}</span>
        </article>
        {foldedNarrative.slice(0, 3).map((paragraph, index) => (
          <article key={index} className="constellation-river-paragraph">
            <p>{String(index + 1).padStart(2, "0")}</p>
            <span>{paragraph}</span>
          </article>
        ))}
      </section>

      <section className="constellation-resonance-field mx-auto w-full max-w-[30rem]" data-constellation-section="resonance">
        <div className="constellation-section-intro">
          <p>回响</p>
          <h3>继续共鸣的内容</h3>
          <span>{recommendationLead || "把一个回响带回现实就够了。"}</span>
        </div>
        <div className="constellation-resonance-list">
          {recommendationMeta.map((group) => (
            <article key={group.key} className="constellation-resonance-item">
              <div>
                <group.Icon className="h-4 w-4" strokeWidth={1.5} />
                <p>{group.label}</p>
              </div>
              {group.key === "books"
                ? data.recommendations.books.slice(0, 2).map((item) => (
                    <span key={`${item.title}-${item.author}`}><strong>{item.title} · {item.author}</strong>{sentenceWithSpace(item.reason)}</span>
                  ))
                : null}
              {group.key === "films"
                ? data.recommendations.films.slice(0, 2).map((item) => (
                    <span key={`${item.title}-${item.director}`}><strong>{item.title} · {item.director}</strong>{sentenceWithSpace(item.reason)}</span>
                  ))
                : null}
              {group.key === "music"
                ? data.recommendations.music.slice(0, 2).map((item) => (
                    <span key={`${item.artist}-${item.album}`}><strong>{item.artist} · {item.album}</strong>{sentenceWithSpace(item.reason)}</span>
                  ))
                : null}
            </article>
          ))}
        </div>
      </section>

      <section className="constellation-closing-lens mx-auto w-full max-w-[30rem]" data-constellation-section="closing">
        <p>这不是结论</p>
        <h3>是你此刻的精神坐标。</h3>
        <span>{supportHint}</span>
      </section>

      <div className="constellation-final-dock mx-auto w-full max-w-[30rem]">
        {actionHint ? <p role="status" aria-live="polite" className="constellation-action-hint">{actionHint}</p> : null}
        <div className="constellation-final-dock__buttons">
          <SecondaryButton type="button" onClick={() => void handleShare()} className="constellation-action-button disabled:cursor-not-allowed disabled:opacity-50">
            {shareState === "done" ? "已分享" : shareState === "error" ? "分享失败" : "分享"}
          </SecondaryButton>
          <SecondaryButton type="button" onClick={() => void handleExportPng()} className="constellation-action-button disabled:cursor-not-allowed disabled:opacity-50">
            {pngState === "done" ? "已保存" : pngState === "error" ? "保存失败" : "保存"}
          </SecondaryButton>
          <a href="/collect" className={cx(benyuanUiRecipes.secondaryLink, "constellation-action-button")}>重新探索</a>
        </div>
      </div>
    </div>
  );
}
