"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronRight, FlaskConical, Images, Sparkles, UploadCloud } from "lucide-react";
import { GlassPanel, MetaPill, PrimaryButton, SecondaryButton, SectionTitle, TextField } from "@/components/framework-primitives";
import { getBenyuanShellInfo, pickImagesWithBenyuanNativeShell, type BenyuanShellInfo } from "@/lib/benyuan-native-shell";
import {
  BENYUAN_PART1_STARTED_KEY,
  BENYUAN_PENDING_PART1_KEY,
  BENYUAN_PART1_STORAGE_KEY,
  BENYUAN_RUNTIME_STORAGE_KEY,
  type BenyuanPendingPart1,
} from "@/lib/benyuan-v3-client-session";
import { benyuanPart1Questions, benyuanQuestionsByModule } from "@/lib/benyuan-v3-schema";
import { benyuanTestPacks, type BenyuanTestPack, type BenyuanTestPackAsset } from "@/lib/benyuan-v3-test-packs";
import { benyuanDemoLinks as fallbackDemoLinks, type BenyuanDemoLink } from "@/lib/benyuan-v3-demo-links";
import type { AgentRuntimeOverride, BenyuanModuleKey, BenyuanQuestion, BenyuanUploadedAssetRef, Part1AnswerMap } from "@/lib/benyuan-v3-types";

const moduleTitles: Record<BenyuanModuleKey, string> = {
  A: "模块 A · 审美偏好",
  B: "模块 B · 哲学提问",
  C: "模块 C · 生命叙事",
};

const moduleDescriptions: Record<BenyuanModuleKey, string> = {
  A: "视觉意象、音乐歌单、文学共鸣、电影美学与灵感场景。",
  B: "深夜思考、决策风格、情绪模式、时间哲学与关系哲学。",
  C: "社交动态截图、珍贵照片与共鸣时刻。",
};

type RuntimeStatus = {
  provider?: string;
  model?: string;
  defaultBaseUrl?: string;
  liveProviderEnabled?: boolean;
  providerRequestMode?: string;
  wireApi?: string;
  softTimeoutMs?: number;
  apiKeyConfigured?: boolean;
  source?: string;
};

function createInitialAnswers(): Part1AnswerMap {
  return {
    A3_literature: [],
    B4_time_philosophy: { past: 34, present: 33, future: 33 },
    C3_resonance_moments: [],
    A2_music_analysis: [],
    C1_social_posts_analysis: [],
    C2_precious_photo_analysis: [],
  };
}

function createInitialRuntime(): AgentRuntimeOverride {
  return {
    provider_name: "crs",
    model: "gpt-5.4",
    reasoning_effort: "medium",
    disable_response_storage: true,
    live: true,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeAnswers(value: unknown): Part1AnswerMap {
  if (!isRecord(value)) return createInitialAnswers();
  return { ...createInitialAnswers(), ...value };
}

function normalizeRuntime(value: unknown): AgentRuntimeOverride {
  if (!isRecord(value)) return createInitialRuntime();
  return { ...createInitialRuntime(), ...(value as AgentRuntimeOverride) };
}

function isQuestionAnswered(question: BenyuanQuestion, answers: Part1AnswerMap) {
  const value = answers[question.id];
  if (question.kind === "single") return typeof value === "string" && value.length > 0;
  if (question.kind === "multi") return Array.isArray(value) && value.length > 0;
  if (question.kind === "distribution") return isRecord(value);
  if (question.kind === "upload") return Array.isArray(value) && value.length > 0;
  return false;
}

function countAnswered(questions: BenyuanQuestion[], answers: Part1AnswerMap) {
  return questions.filter((question) => isQuestionAnswered(question, answers)).length;
}

function validateLocal(answers: Part1AnswerMap, questions: BenyuanQuestion[]) {
  const errors: string[] = [];
  for (const question of questions) {
    const value = answers[question.id];
    if (question.kind === "single" && (!value || typeof value !== "string")) errors.push(`${question.title} 尚未完成`);
    if (question.kind === "multi") {
      const selected = Array.isArray(value) ? value : [];
      if ((question.minSelections ?? 1) > selected.length) errors.push(`${question.title} 至少选择 ${question.minSelections} 项`);
    }
    if (question.kind === "distribution") {
      if (!isRecord(value) || Number(value.past ?? 0) + Number(value.present ?? 0) + Number(value.future ?? 0) !== 100) {
        errors.push(`${question.title} 的过去 / 现在 / 未来总和必须等于 100`);
      }
    }
    if (question.kind === "upload") {
      const files = Array.isArray(value) ? value : [];
      const min = question.uploadRange?.min ?? 1;
      const max = question.uploadRange?.max ?? min;
      if (files.length < min || files.length > max) errors.push(`${question.title} 需要上传 ${min}-${max} 项`);
    }
  }
  return errors;
}

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 1024 / 102.4) / 10} MB`;
}

function formatOptionText(text: string) {
  const stripped = text.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, "").trim();
  return stripped.length > 0 ? stripped : text;
}

function formatUploadOriginLabel(origin?: string) {
  switch (origin) {
    case "native-library":
      return "原生相册";
    case "native-camera":
      return "原生拍照";
    case "test-pack":
      return "测试素材";
    case "web-upload":
      return "网页上传";
    default:
      return "已上传";
  }
}

function summarizeUploadOrigins(assets: BenyuanUploadedAssetRef[]) {
  const counts = new Map<string, number>();
  for (const asset of assets) {
    const label = formatUploadOriginLabel(asset.upload_origin);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

type PreparedUpload = {
  file: File;
  originalSize: number;
  optimized: boolean;
};

async function optimizeUploadFile(file: File): Promise<PreparedUpload> {
  if (typeof window === "undefined" || !file.type.startsWith("image/") || file.size <= 900 * 1024 || file.type === "image/gif" || file.type === "image/svg+xml") {
    return { file, originalSize: file.size, optimized: false };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      bitmap.close();
      return { file, originalSize: file.size, optimized: false };
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const outputType = file.type === "image/webp" ? "image/webp" : "image/jpeg";
    const quality = outputType === "image/webp" ? 0.84 : 0.82;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) resolve(value);
        else reject(new Error("image_encode_failed"));
      }, outputType, quality);
    });

    if (blob.size >= file.size * 0.96) {
      return { file, originalSize: file.size, optimized: false };
    }

    const extension = outputType === "image/webp" ? ".webp" : ".jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "upload";
    const optimizedFile = new File([blob], `${baseName}-optimized${extension}`, {
      type: outputType,
      lastModified: file.lastModified,
    });

    return { file: optimizedFile, originalSize: file.size, optimized: true };
  } catch {
    return { file, originalSize: file.size, optimized: false };
  }
}

async function fetchAssetAsFile(asset: BenyuanTestPackAsset, prefix: string) {
  const response = await fetch(asset.url);
  if (!response.ok) throw new Error(`asset_fetch_failed:${asset.url}`);
  const blob = await response.blob();
  const extension = asset.url.split(".").pop() ?? "png";
  const safeName = asset.name.replace(/[^a-zA-Z0-9_-]+/g, "-").toLowerCase();
  return new File([blob], `${prefix}-${safeName}.${extension}`, {
    type: blob.type || "image/png",
    lastModified: Date.now(),
  });
}

function uploadedAssetsFromValue(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is BenyuanUploadedAssetRef =>
      typeof item === "object" && item !== null && typeof (item as BenyuanUploadedAssetRef).asset_id === "string",
  );
}

function QuestionBlock({
  question,
  value,
  onSingle,
  onToggleMulti,
  onDistribution,
  onUpload,
  uploading,
  uploadError,
  onNativeUploadFromLibrary,
  onNativeUploadFromCamera,
  nativeUploadEnabled,
}: {
  question: BenyuanQuestion;
  value: unknown;
  onSingle: (optionId: string) => void;
  onToggleMulti: (optionId: string) => void;
  onDistribution: (key: "past" | "present" | "future", value: number) => void;
  onUpload: (files: FileList | File[] | null) => Promise<void>;
  onNativeUploadFromLibrary?: () => Promise<void>;
  onNativeUploadFromCamera?: () => Promise<void>;
  nativeUploadEnabled?: boolean;
  uploading: boolean;
  uploadError?: string;
}) {
  const uploadedAssets = uploadedAssetsFromValue(value);
  const [dragActive, setDragActive] = useState(false);
  const uploadInputId = `upload-input-${question.id}`;
  const uploadMin = question.uploadRange?.min ?? 1;
  const uploadMax = question.uploadRange?.max ?? uploadMin;
  const remainingUploads = Math.max(0, uploadMax - uploadedAssets.length);
  const uploadOriginSummary = summarizeUploadOrigins(uploadedAssets);
  const uploadHint = uploading
    ? "正在整理并上传素材，完成后会自动写回当前问题。"
    : dragActive
      ? "松开即可把图片送入当前问题。"
      : uploadedAssets.length > 0
        ? remainingUploads > 0
          ? `还可以继续补充 ${remainingUploads} 张图片。`
          : "当前问题的上传数量已经满足要求。"
        : "点击选择文件，或把图片拖到此处。";

  return (
    <section className="border border-[var(--border)] bg-[rgba(255,255,255,0.012)] px-5 py-6 md:px-8 md:py-9">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--text-tertiary)]">{question.title}</p>
          <h3 className="mt-4 text-center text-[1.9rem] leading-[1.45] text-[var(--text-primary)] md:text-[2.2rem]">{question.prompt}</h3>
          {question.helperText ? <p className="mt-4 text-center text-sm leading-7 text-[var(--text-secondary)]">{question.helperText}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {question.minSelections ? <MetaPill>至少 {question.minSelections} 项</MetaPill> : null}
          {question.maxSelections ? <MetaPill>最多 {question.maxSelections} 项</MetaPill> : null}
          {question.uploadRange ? <MetaPill>{question.uploadRange.min}-{question.uploadRange.max} 张</MetaPill> : null}
          {uploading ? <MetaPill>上传中</MetaPill> : null}
        </div>
      </div>

      {question.kind === "single" ? (
        <div className="mx-auto mt-10 grid max-w-3xl gap-3">
          {question.options?.map((option) => {
            const active = value === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSingle(option.id)}
                className={`group min-h-11 border px-6 py-5 text-center transition ${active ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.08)] shadow-[0_0_22px_var(--glow)]" : "border-[var(--border)] bg-transparent hover:border-[var(--accent-gold-dim)] hover:bg-[rgba(212,175,55,0.04)] hover:translate-x-1"}`}
              >
                <div className="text-base leading-8 text-[var(--text-primary)]">{formatOptionText(option.text)}</div>
              </button>
            );
          })}
        </div>
      ) : null}

      {question.kind === "multi" ? (
        <div className="mx-auto mt-10 grid max-w-3xl gap-3">
          {question.options?.map((option) => {
            const selected = Array.isArray(value) && value.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onToggleMulti(option.id)}
                className={`min-h-11 border px-6 py-5 text-center transition ${selected ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.08)] shadow-[0_0_22px_var(--glow)]" : "border-[var(--border)] bg-transparent hover:border-[var(--accent-gold-dim)] hover:bg-[rgba(212,175,55,0.04)] hover:translate-x-1"}`}
              >
                <div className="text-base leading-8 text-[var(--text-primary)]">{formatOptionText(option.text)}</div>
              </button>
            );
          })}
        </div>
      ) : null}

      {question.kind === "distribution" ? (
        <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          {question.distributionKeys?.map((item) => {
            const distribution = isRecord(value) ? (value as { past: number; present: number; future: number }) : { past: 34, present: 33, future: 33 };
            return (
              <div key={item.key} className="border border-[var(--border)] bg-[rgba(255,255,255,0.012)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                  <MetaPill>{distribution[item.key]}%</MetaPill>
                </div>
                <input className="mt-5 w-full accent-[var(--accent-gold)]" type="range" min={0} max={100} value={distribution[item.key]} onChange={(event) => onDistribution(item.key, Number(event.target.value))} />
              </div>
            );
          })}
        </div>
      ) : null}

      {question.kind === "upload" ? (
        <div className="mx-auto mt-10 grid max-w-5xl gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <input
              id={uploadInputId}
              type="file"
              accept={question.acceptedFiles}
              multiple={uploadMax > 1}
              disabled={uploading}
              className="sr-only"
              onChange={(event) => {
                void onUpload(event.target.files);
                event.currentTarget.value = "";
              }}
            />
            <div
              className={`border border-dashed p-8 transition ${
                dragActive
                  ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.06)] shadow-[0_0_28px_var(--glow)]"
                  : "border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.006))] hover:border-[var(--accent-gold-dim)] hover:bg-[rgba(212,175,55,0.035)]"
              } ${uploading ? "opacity-80" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                if (!uploading) setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragActive(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                if (!uploading) {
                  void onUpload(event.dataTransfer.files);
                }
              }}
            >
              <div className="flex items-start gap-4 text-[var(--text-primary)]">
                <div className="border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.08)] p-3 text-[var(--accent-gold)] shadow-[0_0_22px_var(--glow)]">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base">上传图片素材</p>
                    <MetaPill>网页入口</MetaPill>
                    {uploading ? <MetaPill>处理中</MetaPill> : null}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">支持拖入或点击选择；大图会先在浏览器端压缩，再上传到服务端进入多模态分析。</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <MetaPill>{`要求 ${uploadMin}-${uploadMax} 张`}</MetaPill>
                    <MetaPill>{question.acceptedFiles}</MetaPill>
                    <MetaPill>{remainingUploads > 0 ? `剩余 ${remainingUploads} 张` : "已达目标数量"}</MetaPill>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <label
                  htmlFor={uploadInputId}
                  className={`inline-flex min-h-11 items-center justify-center border border-[var(--accent-gold)] px-5 py-3 text-sm text-[var(--accent-gold)] transition ${
                    uploading ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[rgba(212,175,55,0.06)]"
                  }`}
                >
                  选择文件
                </label>
                <div className="flex min-h-11 flex-1 items-center border border-[var(--border)] bg-black/10 px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {uploadHint}
                </div>
              </div>
              {question.analysisDimensions?.length ? (
                <div className="mt-5">
                  <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-tertiary)]">分析维度</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {question.analysisDimensions.map((item) => (
                      <MetaPill key={item}>{item}</MetaPill>
                    ))}
                  </div>
                </div>
              ) : null}
              {uploadError ? <p className="mt-4 border border-red-400/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">{uploadError}</p> : null}
            </div>
            {nativeUploadEnabled ? (
              <div className="border border-[rgba(212,175,55,0.18)] bg-[linear-gradient(180deg,rgba(212,175,55,0.06),rgba(255,255,255,0.01))] p-5">
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-[var(--text-primary)]">iPhone 原生入口</p>
                      <MetaPill>shell only</MetaPill>
                      <MetaPill>同一 API 链路</MetaPill>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-[var(--text-tertiary)]">你可以直接从系统相册带入，或现场拍照；素材仍然回到当前 Part 1 上传接口，不会分叉分析链路。</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void onNativeUploadFromLibrary?.()}
                      disabled={uploading}
                      className="group min-h-11 border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-4 text-left transition hover:border-[rgba(212,175,55,0.34)] hover:bg-[rgba(212,175,55,0.05)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="border border-[var(--border)] bg-black/12 p-2 text-[var(--accent-gold)]">
                          <Images className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm text-[var(--text-primary)]">从相册选择</p>
                          <p className="mt-1 text-xs leading-6 text-[var(--text-tertiary)]">适合歌单截图、社交动态与已有照片。</p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => void onNativeUploadFromCamera?.()}
                      disabled={uploading}
                      className="group min-h-11 border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-4 text-left transition hover:border-[rgba(212,175,55,0.34)] hover:bg-[rgba(212,175,55,0.05)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="border border-[var(--border)] bg-black/12 p-2 text-[var(--accent-gold)]">
                          <Camera className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm text-[var(--text-primary)]">直接拍照</p>
                          <p className="mt-1 text-xs leading-6 text-[var(--text-tertiary)]">适合当下场景、物件或想即时记录的线索。</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div className="border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.014),rgba(255,255,255,0.006))] p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-tertiary)]">已上传文件</p>
              <MetaPill>{uploadedAssets.length} / {uploadMax}</MetaPill>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <MetaPill>至少 {uploadMin} 张</MetaPill>
              <MetaPill>{remainingUploads > 0 ? `剩余 ${remainingUploads} 张` : "已满足上传数量"}</MetaPill>
              {uploadOriginSummary.map((item) => (
                <MetaPill key={item.label}>{item.label} × {item.count}</MetaPill>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {uploading ? (
                <div className="border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.05)] px-4 py-4 text-sm text-[var(--text-secondary)] animate-pulse">
                  正在把素材写入 Benyuan store，并同步回当前问题。
                </div>
              ) : null}
              {uploadedAssets.length > 0 ? (
                uploadedAssets.map((file, index) => (
                  <div key={`${file.asset_id}-${index}`} className="border border-[var(--border)] bg-[rgba(255,255,255,0.01)] p-3 transition hover:border-[rgba(212,175,55,0.22)]">
                    <div className="flex gap-3">
                      {file.mime_type.startsWith("image/") ? (
                        <Image src={`/api/part1/uploaded/${file.asset_id}`} alt={file.name ?? `文件 ${index + 1}`} width={80} height={80} unoptimized className="h-20 w-20 border border-[var(--border)] object-cover" />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center border border-[var(--border)] text-xs text-[var(--text-tertiary)]">FILE</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap gap-2">
                            <MetaPill>{formatUploadOriginLabel(file.upload_origin)}</MetaPill>
                            <MetaPill>{file.mime_type}</MetaPill>
                          </div>
                          <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">#{index + 1}</span>
                        </div>
                        <p className="mt-3 truncate text-sm text-[var(--text-primary)]">{file.name ?? `文件 ${index + 1}`}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-tertiary)]">
                          <span>{formatBytes(file.size)}</span>
                          <span>{new Date(file.uploaded_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="border border-[rgba(212,175,55,0.12)] bg-[rgba(255,255,255,0.01)] px-4 py-5 text-sm text-[var(--text-tertiary)]">
                  <p className="text-sm text-[var(--text-primary)]">还没有上传文件</p>
                  <p className="mt-2 text-xs leading-6 text-[var(--text-tertiary)]">上传后，这里会显示缩略图、来源、时间与大小，方便你确认真正进入分析的素材。</p>
                  <div className="mt-4 grid gap-2 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center justify-between border border-[var(--border)] px-3 py-3">
                      <span>目标数量</span>
                      <span>{uploadMin}-{uploadMax} 张</span>
                    </div>
                    <div className="flex items-center justify-between border border-[var(--border)] px-3 py-3">
                      <span>写入位置</span>
                      <span>/api/part1/upload</span>
                    </div>
                    <div className="flex items-center justify-between border border-[var(--border)] px-3 py-3">
                      <span>可用入口</span>
                      <span>{nativeUploadEnabled ? "网页 / 相册 / 拍照" : "网页上传"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function BenyuanPart1Workflow({ moduleFilter, demoLinks = fallbackDemoLinks }: { moduleFilter?: BenyuanModuleKey; demoLinks?: BenyuanDemoLink[] }) {
  const router = useRouter();
  const [activeModule, setActiveModule] = useState<BenyuanModuleKey>(moduleFilter ?? "A");
  const questions = moduleFilter ? benyuanQuestionsByModule[moduleFilter] : benyuanPart1Questions;
  const [answers, setAnswers] = useState<Part1AnswerMap>(createInitialAnswers);
  const [runtimeOverride, setRuntimeOverride] = useState<AgentRuntimeOverride>(createInitialRuntime);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [packLoadingId, setPackLoadingId] = useState<string | null>(null);
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [shellInfo] = useState<BenyuanShellInfo | null>(() => getBenyuanShellInfo());
  const [ritualQuestionIndex, setRitualQuestionIndex] = useState(0);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const currentQuestionIdsRef = useRef<string[]>([]);

  useEffect(() => {
    const savedAnswers = window.localStorage.getItem(BENYUAN_PART1_STORAGE_KEY);
    if (savedAnswers) setAnswers(normalizeAnswers(JSON.parse(savedAnswers)));

    const savedRuntime = window.localStorage.getItem(BENYUAN_RUNTIME_STORAGE_KEY);
    if (savedRuntime) {
      setRuntimeOverride(normalizeRuntime(JSON.parse(savedRuntime)));
    }

    if (!window.localStorage.getItem(BENYUAN_PART1_STARTED_KEY)) {
      window.localStorage.setItem(BENYUAN_PART1_STARTED_KEY, String(Date.now()));
    }

    fetch("/api/agent/runtime")
      .then((response) => response.json())
      .then((runtime: RuntimeStatus) => {
        setRuntimeStatus(runtime);
        if (!savedRuntime) {
          setRuntimeOverride((current) => ({
            ...current,
            provider_name: runtime.provider ?? current.provider_name,
            model: runtime.model ?? current.model,
            base_url: runtime.defaultBaseUrl ?? current.base_url,
            live: runtime.liveProviderEnabled ?? current.live,
          }));
        }
      })
      .catch(() => {
        setRuntimeStatus(null);
      });
  }, []);

  useEffect(() => {
    clearAutoAdvanceTimer();
    if (moduleFilter) setActiveModule(moduleFilter);
    setRitualQuestionIndex(0);
  }, [moduleFilter]);

  useEffect(() => {
    window.localStorage.setItem(BENYUAN_PART1_STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    window.localStorage.setItem(BENYUAN_RUNTIME_STORAGE_KEY, JSON.stringify(runtimeOverride));
  }, [runtimeOverride]);

  useEffect(() => {
    clearAutoAdvanceTimer();
    setRitualQuestionIndex(0);
  }, [activeModule]);

  const currentQuestions = useMemo(() => (moduleFilter ? questions : benyuanQuestionsByModule[activeModule]), [activeModule, moduleFilter, questions]);
  const ritualQuestion = currentQuestions[ritualQuestionIndex] ?? currentQuestions[0] ?? null;
  const totalQuestions = moduleFilter ? questions.length : benyuanPart1Questions.length;
  const activeQuestionNumber = ritualQuestion
    ? (moduleFilter ? currentQuestions.findIndex((question) => question.id === ritualQuestion.id) : benyuanPart1Questions.findIndex((question) => question.id === ritualQuestion.id)) + 1
    : 0;
  const activeQuestionAnswered = ritualQuestion ? isQuestionAnswered(ritualQuestion, answers) : false;

  useEffect(() => {
    currentQuestionIdsRef.current = currentQuestions.map((question) => question.id);
  }, [currentQuestions]);

  useEffect(() => () => {
    if (autoAdvanceTimerRef.current) {
      window.clearTimeout(autoAdvanceTimerRef.current);
    }
  }, []);
  const moduleProgress = useMemo(
    () => ({
      A: countAnswered(benyuanQuestionsByModule.A, answers),
      B: countAnswered(benyuanQuestionsByModule.B, answers),
      C: countAnswered(benyuanQuestionsByModule.C, answers),
    }),
    [answers],
  );
  const answeredTotal = moduleProgress.A + moduleProgress.B + moduleProgress.C;
  const uploadedAssetCount = [answers.A2_music_analysis, answers.C1_social_posts_analysis, answers.C2_precious_photo_analysis].reduce<number>(
    (total, value) => total + uploadedAssetsFromValue(value).length,
    0,
  );
  const flowStateLabel = submitting
    ? "正在进入显影流程"
    : packLoadingId
      ? `正在载入 pack ${packLoadingId}`
      : uploadingQuestionId
        ? "正在整理并上传素材"
        : activeQuestionAnswered
          ? "当前问题已完成，可以继续推进"
          : "等待当前问题完成";

  function clearAutoAdvanceTimer() {
    if (autoAdvanceTimerRef.current) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }

  function scheduleAutoAdvance(questionId: string, delay = 520) {
    clearAutoAdvanceTimer();
    autoAdvanceTimerRef.current = window.setTimeout(() => {
      setRitualQuestionIndex((current) => {
        const ids = currentQuestionIdsRef.current;
        if (ids[current] !== questionId) return current;
        return Math.min(ids.length - 1, current + 1);
      });
      autoAdvanceTimerRef.current = null;
    }, delay);
  }

  function updateAnswer(questionId: string, value: unknown) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function toggleMulti(questionId: string, optionId: string) {
    clearAutoAdvanceTimer();
    const current = Array.isArray(answers[questionId]) ? (answers[questionId] as string[]) : [];
    updateAnswer(questionId, current.includes(optionId) ? current.filter((item) => item !== optionId) : [...current, optionId]);
  }

  function updateDistribution(key: "past" | "present" | "future", nextValue: number) {
    clearAutoAdvanceTimer();
    const current = isRecord(answers.B4_time_philosophy) ? (answers.B4_time_philosophy as { past: number; present: number; future: number }) : { past: 34, present: 33, future: 33 };
    const otherKeys = ["past", "present", "future"].filter((item) => item !== key) as Array<"past" | "present" | "future">;
    const remaining = 100 - nextValue;
    const currentOtherTotal = current[otherKeys[0]] + current[otherKeys[1]] || 1;
    const first = Math.max(0, Math.round((current[otherKeys[0]] / currentOtherTotal) * remaining));
    const second = Math.max(0, remaining - first);
    updateAnswer("B4_time_philosophy", { ...current, [key]: nextValue, [otherKeys[0]]: first, [otherKeys[1]]: second });
  }

  async function uploadFiles(questionId: string, files: FileList | File[] | null, uploadOrigin = "web-upload") {
    const incomingFiles = Array.from(files ?? []);
    if (incomingFiles.length === 0) return;
    setUploadingQuestionId(questionId);
    setUploadErrors((current) => ({ ...current, [questionId]: "" }));
    setStatus("正在上传图片素材...");

    try {
      const formData = new FormData();
      formData.append("question_id", questionId);
      formData.append("upload_origin", uploadOrigin);
      const preparedUploads = await Promise.all(incomingFiles.map((file) => optimizeUploadFile(file)));
      preparedUploads.forEach(({ file }) => formData.append("files", file));

      const response = await fetch("/api/part1/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "upload_failed");

      updateAnswer(questionId, payload.assets);
      scheduleAutoAdvance(questionId, 680);
      const optimizedCount = preparedUploads.filter((item) => item.optimized).length;
      const savedBytes = preparedUploads.reduce((total, item) => total + Math.max(0, item.originalSize - item.file.size), 0);
      setStatus(
        optimizedCount > 0
          ? `素材已上传，已在浏览器端优化 ${optimizedCount} 张图片，减少 ${formatBytes(savedBytes)} 传输体积。`
          : "素材已上传，提交 Part 1 后会进入真实多模态分析。",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "upload_failed";
      setUploadErrors((current) => ({ ...current, [questionId]: message }));
      setStatus("图片上传失败，请重试。");
    } finally {
      setUploadingQuestionId(null);
    }
  }

  async function openNativeImagePicker(question: BenyuanQuestion, source: "library" | "camera") {
    if (question.kind !== "upload") return;

    setUploadErrors((current) => ({ ...current, [question.id]: "" }));
    setStatus(source === "camera" ? "正在打开 iPhone 相机..." : "正在打开 iPhone 原生相册...");

    try {
      const files = await pickImagesWithBenyuanNativeShell({
        questionId: question.id,
        maxCount: source === "camera" ? 1 : question.uploadRange?.max ?? 1,
        source,
      });

      if (files.length === 0) {
        setStatus(source === "camera" ? "已取消原生拍照。当前问题的上传结果保持不变。" : "已取消原生选图。当前问题的上传结果保持不变。");
        return;
      }

      await uploadFiles(question.id, files, source === "camera" ? "native-camera" : "native-library");
    } catch (error) {
      const message = error instanceof Error ? error.message : "native_picker_failed";
      setUploadErrors((current) => ({ ...current, [question.id]: message }));
      setStatus(source === "camera" ? "原生拍照没有完成，你仍然可以继续使用网页上传入口。" : "原生选图没有完成，你仍然可以继续使用网页上传入口。");
    }
  }

  async function uploadAssetBundle(questionId: string, assets: BenyuanTestPackAsset[]) {
    if (assets.length === 0) return [];

    const files = await Promise.all(assets.map((asset, index) => fetchAssetAsFile(asset, `${questionId}-${index + 1}`)));
    const formData = new FormData();
    formData.append("question_id", questionId);
    formData.append("upload_origin", "test-pack");
    files.forEach((file) => formData.append("files", file));

    const response = await fetch("/api/part1/upload", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "sample_asset_upload_failed");
    return payload.assets as BenyuanUploadedAssetRef[];
  }

  async function applyTestPack(pack: BenyuanTestPack) {
    setPackLoadingId(pack.id);
    setUploadingQuestionId("test-pack");
    setErrors([]);
    setUploadErrors({});
    setStatus(`正在载入测试包 ${pack.id} · ${pack.name}...`);

    try {
      const baseAnswers: Part1AnswerMap = {
        ...createInitialAnswers(),
        ...pack.answers,
        A2_music_analysis: [],
        C1_social_posts_analysis: [],
        C2_precious_photo_analysis: [],
      };
      setAnswers(baseAnswers);
      setActiveModule("A");

      const [musicAssets, socialAssets, photoAssets] = await Promise.all([
        uploadAssetBundle("A2_music_analysis", pack.assets.A2_music_analysis),
        uploadAssetBundle("C1_social_posts_analysis", pack.assets.C1_social_posts_analysis),
        uploadAssetBundle("C2_precious_photo_analysis", pack.assets.C2_precious_photo_analysis),
      ]);

      setAnswers({
        ...baseAnswers,
        A2_music_analysis: musicAssets,
        C1_social_posts_analysis: socialAssets,
        C2_precious_photo_analysis: photoAssets,
      });
      setStatus(`测试包 ${pack.id} 已填充并上传 ${musicAssets.length + socialAssets.length + photoAssets.length} 个素材，现在可以直接提交整条流程。`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "测试包载入失败");
    } finally {
      setPackLoadingId(null);
      setUploadingQuestionId(null);
    }
  }

  async function submitFlow() {
    const localErrors = validateLocal(answers, benyuanPart1Questions);
    setErrors(localErrors);
    if (localErrors.length > 0) {
      setStatus("请先完成所有题目，再进入剧场。");
      return;
    }

    setSubmitting(true);
    setStatus("已锁定 Part 1，正在进入显影页并依次调用多模态分析与剧场导演...");

    try {
      const pending: BenyuanPendingPart1 = {
        user_id: "usr_local",
        answers,
        runtime_override: runtimeOverride,
        part1_started_at: Number(window.localStorage.getItem(BENYUAN_PART1_STARTED_KEY) ?? Date.now()),
        submitted_at: Date.now(),
      };
      window.localStorage.setItem(BENYUAN_PENDING_PART1_KEY, JSON.stringify(pending));
      router.push("/processing/benyuan?phase=part1");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "提交失败");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8">
      <GlassPanel className="overflow-hidden bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.09),rgba(0,0,0,0.96)_62%)]">
        <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <SectionTitle
              label="当前态势"
              title="采集进度、素材与 runtime 都集中在这里。"
              description="不用来回切页，当前完成度、素材入链数量和 live runtime 状态都能在这一屏看到。"
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="border border-[var(--border)] bg-[rgba(255,255,255,0.018)] p-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--text-tertiary)]">完成度</p>
                <p className="mt-4 text-2xl text-[var(--text-primary)]">{answeredTotal} / {totalQuestions}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">已经写入当前 Part 1 链路的问题数。</p>
              </div>
              <div className="border border-[var(--border)] bg-[rgba(255,255,255,0.018)] p-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--text-tertiary)]">当前模块</p>
                <p className="mt-4 text-2xl text-[var(--text-primary)]">{activeModule}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{moduleProgress[activeModule]} / {currentQuestions.length} 已完成。</p>
              </div>
              <div className="border border-[var(--border)] bg-[rgba(255,255,255,0.018)] p-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--text-tertiary)]">素材入链</p>
                <p className="mt-4 text-2xl text-[var(--text-primary)]">{uploadedAssetCount}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">歌单、动态与照片总素材数。</p>
              </div>
              <div className="border border-[var(--border)] bg-[rgba(255,255,255,0.018)] p-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--text-tertiary)]">Runtime</p>
                <p className="mt-4 text-xl text-[var(--text-primary)]">{runtimeOverride.provider_name ?? runtimeStatus?.provider ?? "crs"}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{runtimeStatus?.wireApi ?? "responses"} · {runtimeStatus?.liveProviderEnabled ? "live ready" : "fallback ready"}</p>
              </div>
            </div>
          </div>

          <div className="border border-[rgba(212,175,55,0.18)] bg-[rgba(212,175,55,0.05)] p-5">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--text-tertiary)]">实时状态</p>
            <p className="mt-4 text-[1.35rem] leading-8 text-[var(--text-primary)]">{flowStateLabel}</p>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              {status || "当前问题、测试包载入、素材上传和真实 API 提交，都会在这里给出即时反馈。"}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {ritualQuestion ? <MetaPill>{`当前问题 · ${ritualQuestion.title}`}</MetaPill> : null}
              <MetaPill>{runtimeStatus?.softTimeoutMs ? `${Math.round(runtimeStatus.softTimeoutMs / 1000)}s timeout` : "timeout --"}</MetaPill>
              {packLoadingId ? <MetaPill>{`pack ${packLoadingId}`}</MetaPill> : null}
              {uploadingQuestionId ? <MetaPill>素材处理中</MetaPill> : null}
            </div>
          </div>
        </div>
      </GlassPanel>
      {!moduleFilter ? (
        <GlassPanel>
          <SectionTitle
            label="测试素材包"
            title="A / B / C 压测素材已经就位。"
            description="一键就会填充结构化答案，并把歌单、动态、照片素材送进当前会话，适合反复压测同一条真实分析链路。"
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {benyuanTestPacks.map((pack) => {
              const loadingPack = packLoadingId === pack.id;
              return (
                <div key={pack.id} className="border border-[var(--border)] bg-[rgba(255,255,255,0.015)] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--text-tertiary)]">pack {pack.id}</p>
                      <h3 className="mt-2 text-2xl text-[var(--text-primary)]">{pack.name}</h3>
                      <p className="mt-2 text-sm text-[var(--accent-gold)]">{pack.archetype}</p>
                    </div>
                    <FlaskConical className="mt-1 h-5 w-5 text-[var(--accent-gold)]" />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{pack.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <MetaPill>{pack.assets.A2_music_analysis.length} 张歌单</MetaPill>
                    <MetaPill>{pack.assets.C1_social_posts_analysis.length} 张动态</MetaPill>
                    <MetaPill>{pack.assets.C2_precious_photo_analysis.length} 张照片</MetaPill>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--text-tertiary)]">
                    {pack.assets.A2_music_analysis.concat(pack.assets.C1_social_posts_analysis, pack.assets.C2_precious_photo_analysis).slice(0, 3).map((asset) => (
                      <a key={asset.url} href={asset.url} target="_blank" rel="noreferrer" className="border border-[var(--border)] px-3 py-1 transition hover:border-[var(--accent-gold-dim)] hover:text-[var(--text-primary)]">
                        {asset.name}
                      </a>
                    ))}
                  </div>
                  <SecondaryButton
                    type="button"
                    onClick={() => void applyTestPack(pack)}
                    disabled={Boolean(packLoadingId) || submitting || Boolean(uploadingQuestionId)}
                    className="mt-6 bg-[rgba(212,175,55,0.06)] hover:bg-[rgba(212,175,55,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingPack ? `正在载入 ${pack.id}...` : `载入并上传 ${pack.id} 包`}
                  </SecondaryButton>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      ) : null}

      {!moduleFilter ? (
        <GlassPanel>
          <SectionTitle
            label="即时体验"
            title="也可以直接进入上一轮真实结果。"
            description="下面这组入口直接指向刚刚通过真实 API 跑出来的剧场与星图，方便你跳过 Part 1 立即验证视觉和结果页节奏。"
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {demoLinks.map((item) => (
              <div key={item.pack} className="border border-[var(--border)] bg-[rgba(255,255,255,0.012)] p-5">
                <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--text-tertiary)]">demo {item.pack}</p>
                <h3 className="mt-2 text-2xl text-[var(--text-primary)]">{item.name}</h3>
                <p className="mt-2 text-sm text-[var(--accent-gold)]">{item.archetype}</p>
                <div className="mt-6 flex gap-3">
                  <a href={item.theaterHref} className="inline-flex min-h-11 flex-1 items-center justify-center border border-[var(--border)] px-4 py-3 text-sm text-[var(--text-primary)] transition hover:border-[var(--accent-gold-dim)] hover:bg-[rgba(212,175,55,0.05)]">进入剧场</a>
                  <a href={item.constellationHref} className="inline-flex min-h-11 flex-1 items-center justify-center border border-[var(--accent-gold)] bg-[rgba(212,175,55,0.06)] px-4 py-3 text-sm text-[var(--text-primary)] transition hover:bg-[rgba(212,175,55,0.12)]">查看星图</a>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      ) : null}

      <section className={`grid gap-4 ${moduleFilter ? "" : "xl:grid-cols-[0.95fr_2.05fr]"}`}>
        {!moduleFilter ? (
          <GlassPanel className="xl:sticky xl:top-24 xl:h-fit">
            <SectionTitle label="Part 1 · 模块" title="三组模块，维持同一条采集链。" description="每次只面对一个问题，让采集更像一场仪式；所有选择、上传与测试包都写回同一条 Part 1 链路。" />
            <div className="space-y-3">
              {(["A", "B", "C"] as BenyuanModuleKey[]).map((module) => {
                const active = activeModule === module;
                const total = benyuanQuestionsByModule[module].length;
                return (
                  <button
                    key={module}
                    type="button"
                    onClick={() => {
                      clearAutoAdvanceTimer();
                      setActiveModule(module);
                      setRitualQuestionIndex(0);
                    }}
                    className={`w-full border px-5 py-5 text-left transition ${active ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.06)]" : "border-white/8 bg-black/10 hover:border-white/18 hover:bg-white/[0.04]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-[var(--text-primary)]">{moduleTitles[module]}</p>
                        <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{moduleDescriptions[module]}</p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 text-[var(--text-tertiary)]" />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                      <span>{moduleProgress[module]} / {total}</span>
                      <span>{Math.round((moduleProgress[module] / total) * 100)}%</span>
                    </div>
                    <div className="mt-2 h-px overflow-hidden bg-[rgba(255,255,255,0.1)]">
                      <div className="h-full bg-[linear-gradient(90deg,rgba(212,175,55,0.2),rgba(212,175,55,1))]" style={{ width: `${(moduleProgress[module] / total) * 100}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassPanel>
        ) : null}

        <div className="grid gap-6">
          <GlassPanel className="overflow-hidden bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.08),rgba(0,0,0,0.96)_58%)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.38em] text-[var(--text-tertiary)]">Part 1 · 采集仪式</p>
                <h2 className="mt-4 text-[2rem] leading-[1.08] text-[var(--text-primary)] md:text-[3rem]">先只面对一个问题，再进入下一扇门。</h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] md:text-base">
                  当前停留在 {moduleTitles[activeModule]}。系统会持续保留你的作答与上传结果；你可以按顺序推进，也可以在 A / B / C 间切换，不会打断当前链路。
                </p>
              </div>
              <div className="grid gap-2 text-sm text-[var(--text-secondary)] md:text-right">
                <p>当前问题 · {activeQuestionNumber} / {totalQuestions}</p>
                <p>模块进度 · {moduleProgress[activeModule]} / {currentQuestions.length}</p>
              </div>
            </div>

            <div className="mt-8 h-px overflow-hidden bg-[rgba(255,255,255,0.08)]">
              <div className="h-full bg-[linear-gradient(90deg,rgba(212,175,55,0.18),rgba(212,175,55,0.98))]" style={{ width: `${totalQuestions > 0 ? (activeQuestionNumber / totalQuestions) * 100 : 0}%` }} />
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-5">
              {currentQuestions.map((question, index) => {
                const active = ritualQuestion?.id === question.id;
                const answered = isQuestionAnswered(question, answers);
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => { clearAutoAdvanceTimer(); setRitualQuestionIndex(index); }}
                    className={`border px-4 py-4 text-left transition ${active ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.08)]" : "border-[var(--border)] bg-[rgba(255,255,255,0.012)] hover:border-[rgba(212,175,55,0.28)]"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">{index + 1}</span>
                      <span className={`h-2 w-2 rounded-full ${answered ? "bg-[var(--accent-gold)]" : "bg-[rgba(255,255,255,0.12)]"}`} />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[var(--text-primary)]">{question.title}</p>
                  </button>
                );
              })}
            </div>
          </GlassPanel>

          {ritualQuestion ? (
            <QuestionBlock
              key={ritualQuestion.id}
              question={ritualQuestion}
              value={answers[ritualQuestion.id]}
              onSingle={(optionId) => {
                updateAnswer(ritualQuestion.id, optionId);
                scheduleAutoAdvance(ritualQuestion.id);
              }}
              onToggleMulti={(optionId) => toggleMulti(ritualQuestion.id, optionId)}
              onDistribution={(key, value) => updateDistribution(key, value)}
              onUpload={(files) => uploadFiles(ritualQuestion.id, files, "web-upload")}
              onNativeUploadFromLibrary={() => openNativeImagePicker(ritualQuestion, "library")}
              onNativeUploadFromCamera={() => openNativeImagePicker(ritualQuestion, "camera")}
              nativeUploadEnabled={Boolean(shellInfo?.bridge?.includes("pickImages"))}
              uploading={uploadingQuestionId === ritualQuestion.id}
              uploadError={uploadErrors[ritualQuestion.id]}
            />
          ) : null}

          <GlassPanel>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--text-tertiary)]">节奏控制</p>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                  {activeQuestionAnswered ? "这一题已经写入当前节奏，你可以继续推进。" : "先完成这一题，再决定是否切到下一扇门。"}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => { clearAutoAdvanceTimer(); setRitualQuestionIndex((current) => Math.max(0, current - 1)); }}
                  disabled={ritualQuestionIndex === 0}
                  className="inline-flex min-h-11 items-center justify-center border border-[var(--border)] px-5 py-3 text-sm text-[var(--text-primary)] transition hover:border-[var(--accent-gold-dim)] disabled:opacity-40"
                >
                  上一题
                </button>
                <button
                  type="button"
                  onClick={() => { clearAutoAdvanceTimer(); setRitualQuestionIndex((current) => Math.min(currentQuestions.length - 1, current + 1)); }}
                  disabled={ritualQuestionIndex >= currentQuestions.length - 1}
                  className="inline-flex min-h-11 items-center justify-center border border-[var(--accent-gold)] px-5 py-3 text-sm text-[var(--accent-gold)] transition hover:bg-[rgba(212,175,55,0.06)] disabled:opacity-40"
                >
                  下一题
                </button>
              </div>
            </div>
          </GlassPanel>
        </div>
      </section>

      {!moduleFilter ? (
        <GlassPanel className="border-[var(--border)] bg-[rgba(255,255,255,0.012)]">
          <SectionTitle label="分析入口" title="完成 Part 1 后，直接进入剧场与分析。" description="这里会真实调用当前 v3 API 链路：Part 1 提交、多模态分析、剧场导演生成，然后把你送进剧场体验。" />

          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              {errors.length > 0 ? (
                <div className="mb-4 border border-red-400/30 bg-red-500/8 p-4 text-sm leading-7 text-red-200">
                  {errors.map((error) => (
                    <div key={error}>{error}</div>
                  ))}
                </div>
              ) : null}
              <PrimaryButton
                type="button"
                onClick={submitFlow}
                disabled={submitting || Boolean(uploadingQuestionId)}
                className="gap-3 px-7 py-4 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Sparkles className="h-4 w-4" />
                {submitting ? "正在生成你的入口剧场..." : "进入剧场并开始分析"}
              </PrimaryButton>
              <p className="mt-4 text-sm text-[var(--text-secondary)]">{status || "填写完成后会先走同一条真实 API 链路；若未检测到 live provider，则自动回退到内置分析。"}</p>
            </div>
            <div className="border border-[var(--border)] bg-[rgba(255,255,255,0.012)] p-5">
              <p className="text-[11px] tracking-[0.32em] text-stone-400 uppercase">Agent Runtime</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">已经优先读取你本机 Codex 的 provider 配置，并优先走 Responses 流式接口；你也可以在这里手动覆盖 Base URL 或 Model。</p>
              <div className="mt-4 grid gap-3">
                <TextField placeholder="Provider Name" value={runtimeOverride.provider_name ?? ""} onChange={(event) => setRuntimeOverride((current) => ({ ...current, provider_name: event.target.value }))} />
                <TextField placeholder="Model" value={runtimeOverride.model ?? ""} onChange={(event) => setRuntimeOverride((current) => ({ ...current, model: event.target.value }))} />
                <TextField placeholder="Base URL (OpenAI-compatible)" value={runtimeOverride.base_url ?? ""} onChange={(event) => setRuntimeOverride((current) => ({ ...current, base_url: event.target.value }))} />
                <TextField type="password" placeholder="API Key（留空则使用本机 Codex Auth）" value={runtimeOverride.api_key ?? ""} onChange={(event) => setRuntimeOverride((current) => ({ ...current, api_key: event.target.value }))} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <MetaPill>{runtimeOverride.provider_name ?? runtimeStatus?.provider ?? "crs"}</MetaPill>
                <MetaPill>{runtimeOverride.model ?? runtimeStatus?.model ?? "gpt-5.4"}</MetaPill>
                <MetaPill>{runtimeStatus?.wireApi ?? "responses"}</MetaPill>
                <MetaPill>{runtimeStatus?.source === "codex-config" ? "codex runtime" : runtimeOverride.live ? "live requested" : "fallback only"}</MetaPill>
                {runtimeStatus?.apiKeyConfigured && runtimeStatus?.liveProviderEnabled ? <MetaPill>api ready</MetaPill> : null}
                {runtimeStatus?.softTimeoutMs ? <MetaPill>{Math.round(runtimeStatus.softTimeoutMs / 1000)}s timeout</MetaPill> : null}
              </div>
            </div>
          </div>
        </GlassPanel>
      ) : null}
    </div>
  );
}
