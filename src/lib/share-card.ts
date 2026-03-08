import type { ReportPayload } from "@/lib/types";

export type ShareCardVariant = "portrait" | "square" | "story";

type VariantConfig = {
  width: number;
  height: number;
  padding: number;
  titleFontSize: number;
  subtitleFontSize: number;
  bodyFontSize: number;
  bodyLineHeight: number;
  overviewMaxChars: number;
  overviewMaxLines: number;
  signalCount: number;
  dimensionCount: number;
  recommendationMaxChars: number;
  titleMaxChars: number;
  subtitleMaxChars: number;
};

const SERIF_FONT = "Georgia, 'Times New Roman', 'Songti SC', 'STSong', serif";
const SANS_FONT = "'Inter', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif";

const confidenceLabel: Record<string, string> = {
  low: "初步草图",
  medium: "中等聚焦",
  high: "较高聚焦",
};

const VARIANTS: Record<ShareCardVariant, VariantConfig> = {
  portrait: {
    width: 1200,
    height: 1600,
    padding: 92,
    titleFontSize: 88,
    subtitleFontSize: 30,
    bodyFontSize: 29,
    bodyLineHeight: 44,
    overviewMaxChars: 148,
    overviewMaxLines: 5,
    signalCount: 3,
    dimensionCount: 3,
    recommendationMaxChars: 28,
    titleMaxChars: 16,
    subtitleMaxChars: 36,
  },
  square: {
    width: 1200,
    height: 1200,
    padding: 86,
    titleFontSize: 80,
    subtitleFontSize: 28,
    bodyFontSize: 27,
    bodyLineHeight: 40,
    overviewMaxChars: 112,
    overviewMaxLines: 4,
    signalCount: 2,
    dimensionCount: 2,
    recommendationMaxChars: 22,
    titleMaxChars: 14,
    subtitleMaxChars: 28,
  },
  story: {
    width: 1080,
    height: 1920,
    padding: 84,
    titleFontSize: 84,
    subtitleFontSize: 32,
    bodyFontSize: 31,
    bodyLineHeight: 48,
    overviewMaxChars: 162,
    overviewMaxLines: 5,
    signalCount: 3,
    dimensionCount: 3,
    recommendationMaxChars: 28,
    titleMaxChars: 16,
    subtitleMaxChars: 38,
  },
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const lines: string[] = [];
  let remaining = normalized;

  while (remaining.length > 0 && lines.length < maxLines) {
    if (remaining.length <= maxCharsPerLine) {
      lines.push(remaining);
      remaining = "";
      break;
    }

    let slice = remaining.slice(0, maxCharsPerLine);
    const breakIndex = Math.max(slice.lastIndexOf("，"), slice.lastIndexOf("。"), slice.lastIndexOf("、"), slice.lastIndexOf(" "));
    if (breakIndex > maxCharsPerLine * 0.42) {
      slice = slice.slice(0, breakIndex + 1);
    }

    lines.push(slice.trim());
    remaining = remaining.slice(slice.length).trim();
  }

  if (remaining.length > 0 && lines.length > 0) {
    lines[lines.length - 1] = truncate(lines[lines.length - 1] + remaining, maxCharsPerLine);
  }

  return lines;
}

function renderTextBlock(lines: string[], x: number, y: number, fontSize: number, lineHeight: number, fill: string, fontFamily: string, fontWeight?: string) {
  return `<text x="${x}" y="${y}" fill="${fill}" font-size="${fontSize}" font-family="${fontFamily}"${fontWeight ? ` font-weight="${fontWeight}"` : ""}>${lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("")}</text>`;
}

function renderCenteredText(text: string, x: number, y: number, fontSize: number, fill: string, letterSpacing = 0, fontFamily = SANS_FONT, fontWeight?: string) {
  return `<text x="${x}" y="${y}" text-anchor="middle" fill="${fill}" font-size="${fontSize}" font-family="${fontFamily}"${fontWeight ? ` font-weight="${fontWeight}"` : ""}${letterSpacing ? ` letter-spacing="${letterSpacing}"` : ""}>${escapeXml(text)}</text>`;
}

function renderSignalPill(label: string, x: number, y: number, width: number) {
  return `<rect x="${x}" y="${y}" width="${width}" height="50" rx="25" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)"/>
  ${renderCenteredText(label, x + width / 2, y + 31, 17, "#D6DAE3", 1.2)}`;
}

function renderDimensionColumn(title: string, summary: string, x: number, y: number, width: number, height: number) {
  const titleLines = wrapText(truncate(title, 20), 8, 2);
  const summaryLines = wrapText(truncate(summary, 56), 17, 3);

  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="28" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.08)"/>
  ${renderTextBlock(titleLines, x + 24, y + 64, 24, 32, "#F2EEE6", SERIF_FONT, "700")}
  ${renderTextBlock(summaryLines, x + 24, y + 134, 18, 28, "#BFC6D4", SANS_FONT)}`;
}

export function getShareCardVariant(value: string | null | undefined): ShareCardVariant {
  if (value === "square" || value === "story" || value === "portrait") return value;
  return "portrait";
}

export function buildShareCardSvg(report: ReportPayload, variant: ShareCardVariant = "portrait") {
  const config = VARIANTS[variant];
  const { width, height, padding } = config;
  const contentWidth = width - padding * 2;

  const title = truncate(report.archetype.name, config.titleMaxChars);
  const subtitle = truncate(report.archetype.subtitle ?? "你不是被定义的，而是被理解的。", config.subtitleMaxChars);
  const overviewLines = wrapText(truncate(report.overview, config.overviewMaxChars), variant === "square" ? 17 : 20, config.overviewMaxLines);
  const dimensions = report.dimensionReadings.slice(0, config.dimensionCount);
  const signals = report.archetype.sourceSignals.slice(0, config.signalCount).map((signal) => signal.replaceAll("_", " "));
  const recommendation = truncate(report.recommendations[0]?.title ?? "给复杂感受一块固定空间", config.recommendationMaxChars);

  const heroY = padding + 138;
  const subtitleY = heroY + config.titleFontSize + 20;
  const overviewY = padding + (variant === "story" ? 370 : 338);
  const overviewHeight = variant === "square" ? 258 : variant === "story" ? 332 : 300;
  const signalY = overviewY + overviewHeight + 42;
  const dimensionsY = signalY + 100;
  const dimensionGap = dimensions.length === 3 ? 26 : 24;
  const dimensionWidth = Math.floor((contentWidth - dimensionGap * (dimensions.length - 1)) / dimensions.length);
  const dimensionHeight = variant === "square" ? 220 : 242;
  const recommendationY = dimensionsY + dimensionHeight + 54;
  const footerY = height - 62;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${width}" y2="${height}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#101118"/>
      <stop offset="0.52" stop-color="#090A0E"/>
      <stop offset="1" stop-color="#050608"/>
    </linearGradient>
    <radialGradient id="mistA" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${Math.round(width * 0.22)} ${Math.round(height * 0.16)}) rotate(42) scale(${Math.round(width * 0.34)} ${Math.round(width * 0.34)})">
      <stop stop-color="#BFDFFF" stop-opacity="0.24"/>
      <stop offset="1" stop-color="#BFDFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="mistB" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${Math.round(width * 0.78)} ${Math.round(height * 0.16)}) rotate(90) scale(${Math.round(width * 0.24)} ${Math.round(width * 0.24)})">
      <stop stop-color="#8A6E92" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#8A6E92" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="mistC" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${Math.round(width * 0.48)} ${Math.round(height * 0.62)}) rotate(90) scale(${Math.round(width * 0.34)} ${Math.round(width * 0.34)})">
      <stop stop-color="#F5F4EF" stop-opacity="0.09"/>
      <stop offset="1" stop-color="#F5F4EF" stop-opacity="0"/>
    </radialGradient>
    <filter id="noise" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0 0.025 0.05"/>
      </feComponentTransfer>
    </filter>
    <filter id="blurXL"><feGaussianBlur stdDeviation="64" /></filter>
  </defs>

  <rect width="${width}" height="${height}" rx="44" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" rx="44" fill="#FFFFFF" filter="url(#noise)" opacity="0.36"/>
  <circle cx="${Math.round(width * 0.22)}" cy="${Math.round(height * 0.16)}" r="${Math.round(width * 0.24)}" fill="url(#mistA)" filter="url(#blurXL)"/>
  <circle cx="${Math.round(width * 0.78)}" cy="${Math.round(height * 0.16)}" r="${Math.round(width * 0.18)}" fill="url(#mistB)" filter="url(#blurXL)"/>
  <circle cx="${Math.round(width * 0.48)}" cy="${Math.round(height * 0.62)}" r="${Math.round(width * 0.22)}" fill="url(#mistC)" filter="url(#blurXL)"/>

  <rect x="${padding}" y="${padding - 4}" width="242" height="44" rx="22" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)"/>
  <text x="${padding + 24}" y="${padding + 23}" fill="#C7CFDC" font-size="17" font-family="${SANS_FONT}" letter-spacing="3.2">本源｜精神肖像</text>
  <text x="${padding + 272}" y="${padding + 23}" fill="#8D96A4" font-size="17" font-family="${SANS_FONT}">当前阶段原型</text>

  ${renderTextBlock([title], padding, heroY, config.titleFontSize, config.titleFontSize + 8, "#F4F1EB", SERIF_FONT, "700")}
  ${renderTextBlock([subtitle], padding, subtitleY, config.subtitleFontSize, config.subtitleFontSize + 6, "#CDD2DC", SERIF_FONT)}

  <text x="${padding}" y="${padding + 272}" fill="#7E8797" font-size="20" font-family="${SANS_FONT}" letter-spacing="5.5">精神地形总览</text>
  <rect x="${padding}" y="${overviewY}" width="${contentWidth}" height="${overviewHeight}" rx="34" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.08)"/>
  <text x="${padding + 28}" y="${overviewY + 74}" fill="#E9E3D8" font-size="74" font-family="${SERIF_FONT}">“</text>
  ${renderTextBlock(overviewLines, padding + 94, overviewY + 92, config.bodyFontSize, config.bodyLineHeight, "#ECE7DD", SERIF_FONT)}
  <text x="${padding + 94}" y="${overviewY + overviewHeight - 34}" fill="#9CA5B2" font-size="20" font-family="${SANS_FONT}">置信度：${escapeXml(confidenceLabel[report.confidenceBand] ?? report.confidenceBand)}</text>

  <text x="${padding}" y="${signalY - 18}" fill="#7E8797" font-size="20" font-family="${SANS_FONT}" letter-spacing="5.5">原型线索</text>
  ${signals
    .map((signal, index) => {
      const pillWidth = Math.max(172, Math.min(260, signal.length * 13 + 54));
      const x = padding + index * (pillWidth + 18);
      return renderSignalPill(signal, x, signalY, pillWidth);
    })
    .join("")}

  <text x="${padding}" y="${dimensionsY - 18}" fill="#7E8797" font-size="20" font-family="${SANS_FONT}" letter-spacing="5.5">阅读切面</text>
  ${dimensions
    .map((reading, index) => {
      const x = padding + index * (dimensionWidth + dimensionGap);
      return renderDimensionColumn(reading.title, reading.summary, x, dimensionsY, dimensionWidth, dimensionHeight);
    })
    .join("")}

  <rect x="${padding}" y="${recommendationY}" width="${contentWidth}" height="${variant === "square" ? 132 : 148}" rx="34" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)"/>
  <text x="${padding + 30}" y="${recommendationY + 46}" fill="#7E8797" font-size="20" font-family="${SANS_FONT}" letter-spacing="5.5">带走一句</text>
  ${renderTextBlock([recommendation], padding + 30, recommendationY + 96, variant === "square" ? 34 : 40, 46, "#F3EFE8", SERIF_FONT, "700")}
  <text x="${padding + 30}" y="${recommendationY + (variant === "square" ? 114 : 126)}" fill="#A0A8B4" font-size="19" font-family="${SANS_FONT}">你不是被定义的，而是被理解的。</text>

  <text x="${padding}" y="${footerY}" fill="#6A7381" font-size="18" font-family="${SANS_FONT}">benyuan.app / ${variant} portrait card</text>
</svg>`;
}
