"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, ImageDown, Share2 } from "lucide-react";
import { shareWithBenyuanNativeShell } from "@/lib/benyuan-native-shell";
import type { ReportPayload } from "@/lib/types";

const textTypeLabel: Record<ReportPayload["recommendations"][number]["type"], string> = {
  philosophy: "哲思",
  book: "书籍",
  music: "音乐",
  practice: "练习",
};

function formatReportAsText(report: ReportPayload) {
  const narrative = report.narrativeOverview ?? report.overview;
  const dimensionSectionTitle = report.sevenDimensions?.length ? "【七维星图】" : "【三维解读】";
  const sections = [
    `本源｜${report.archetype.name}`,
    report.archetype.subtitle ?? "",
    "",
    "【精神地形总览】",
    narrative,
    "",
    dimensionSectionTitle,
    ...report.dimensionReadings.flatMap((reading) => [`${reading.title}（${reading.confidenceBand}）`, reading.summary, ""]),
    "【核心张力】",
    ...report.tensions.flatMap((tension) => [tension.name, `两极：${tension.poles.join(" / ")}`, tension.description, `与之相处：${tension.suggestion}`, ""]),
    "【精神原型】",
    report.archetype.description,
    "",
    ...(report.growthSuggestions?.length
      ? [
          "【成长方向】",
          ...report.growthSuggestions.flatMap((item) => [item.title, item.description, ...item.actionableSteps, ""]),
        ]
      : []),
    "【可带走的东西】",
    ...report.recommendations.flatMap((item) => [`${textTypeLabel[item.type] ?? item.type}｜${item.title}`, item.description, ""]),
    "【边界说明】",
    "本结果是一种理解性镜像，不构成心理或医学诊断。",
  ];

  return sections.join("\n");
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

export function ReportActions({ report }: { report: ReportPayload }) {
  const [shareState, setShareState] = useState<"idle" | "done" | "error">("idle");
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [saveState, setSaveState] = useState<"idle" | "done">("idle");
  const [cardState, setCardState] = useState<"idle" | "done" | "error">("idle");
  const [actionHint, setActionHint] = useState<string | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const textPayload = useMemo(() => formatReportAsText(report), [report]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  function resetActionState(kind: "share" | "copy" | "save" | "card") {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      if (kind === "share") setShareState("idle");
      if (kind === "copy") setCopyState("idle");
      if (kind === "save") setSaveState("idle");
      if (kind === "card") setCardState("idle");
      setActionHint(null);
      resetTimerRef.current = null;
    }, 1800);
  }

  async function handleShare() {
    const shareText = [report.archetype.name, report.overview].join("\n\n");

    try {
      const channel = await shareWithBenyuanNativeShell({
        title: `本源｜${report.archetype.name}`,
        text: shareText,
        url: window.location.href,
      });

      setActionHint(
        channel === "native"
          ? "已调用 iOS shell 原生分享面板，这段摘要已经进入系统分享链路。"
          : channel === "web"
            ? "系统分享面板已打开，这段摘要已经进入当前设备的分享链路。"
            : "当前环境未提供系统分享，已改为保留可复制的摘要。",
      );

      setShareState("done");
      resetActionState("share");
    } catch {
      setShareState("error");
      setActionHint("当前环境不支持系统分享或剪贴板写入。你仍然可以复制全文，或把结果保存为文本档案。");
      resetActionState("share");
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(textPayload);
      setCopyState("done");
      setActionHint("全文已复制到剪贴板，这份结果可以继续沿你的外部工作流流转。");
      resetActionState("copy");
    } catch {
      setCopyState("error");
      setActionHint("当前环境不支持剪贴板写入。你可以先使用“保存为文本”，把这份结果留在本地。");
      resetActionState("copy");
    }
  }

  function handleSave() {
    downloadFile(`benyuan-${report.archetype.name}.txt`, textPayload, "text/plain;charset=utf-8");
    setSaveState("done");
    setActionHint("文本档案已开始下载，这份结果已经被折叠成可离线回看的记录。");
    resetActionState("save");
  }

  async function handlePngCardDownload() {
    try {
      const response = await fetch(`/api/report/${report.sessionId}/card?variant=square`);
      if (!response.ok) throw new Error("card_download_failed");
      const svg = await response.text();
      await exportSvgAsPng(svg, `benyuan-${report.archetype.name}-social.png`, 1200, 1200);
      setCardState("done");
      setActionHint("PNG 卡片已开始导出，这份阶段快照已经可以被带走。");
      resetActionState("card");
    } catch {
      setCardState("error");
      setActionHint("PNG 导出这次没有成功，你可以先使用下方 SVG 下载继续带走这份结果。");
      resetActionState("card");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(192,220,249,0.92))] px-6 py-3 text-sm tracking-[0.18em] text-[#0b0d14] uppercase transition hover:scale-[1.01]"
        >
          {shareState === "done" ? <Check className="h-4 w-4" strokeWidth={1.6} /> : <Share2 className="h-4 w-4" strokeWidth={1.6} />}
          {shareState === "done" ? "已分享" : shareState === "error" ? "分享失败" : "分享摘要"}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/[0.03] px-6 py-3 text-sm tracking-[0.18em] text-stone-100 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.05]"
        >
          {copyState === "done" ? <Check className="h-4 w-4" strokeWidth={1.6} /> : <Copy className="h-4 w-4" strokeWidth={1.6} />}
          {copyState === "done" ? "已复制" : copyState === "error" ? "复制失败" : "复制全文"}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/[0.03] px-6 py-3 text-sm tracking-[0.18em] text-stone-100 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.05]"
        >
          {saveState === "done" ? <Check className="h-4 w-4" strokeWidth={1.6} /> : <Download className="h-4 w-4" strokeWidth={1.6} />}
          {saveState === "done" ? "已保存" : "保存为文本"}
        </button>
        <button
          type="button"
          onClick={handlePngCardDownload}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/[0.03] px-6 py-3 text-sm tracking-[0.18em] text-stone-100 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.05]"
        >
          {cardState === "done" ? <Check className="h-4 w-4" strokeWidth={1.6} /> : <ImageDown className="h-4 w-4" strokeWidth={1.6} />}
          {cardState === "done" ? "PNG 已导出" : cardState === "error" ? "导出失败" : "导出 PNG 卡片"}
        </button>
      </div>

      {actionHint ? <p role="status" aria-live="polite" className="text-sm leading-7 text-stone-400">{actionHint}</p> : null}

      <div className="flex flex-wrap items-center gap-4 text-xs tracking-[0.18em] text-stone-500 uppercase">
        <span>SVG 下载</span>
        <a href={`/api/report/${report.sessionId}/card?variant=portrait`} className="transition hover:text-stone-300">
          海报版
        </a>
        <a href={`/api/report/${report.sessionId}/card?variant=square`} className="transition hover:text-stone-300">
          方卡版
        </a>
        <a href={`/api/report/${report.sessionId}/card?variant=story`} className="transition hover:text-stone-300">
          Story 竖版
        </a>
      </div>
    </div>
  );
}
