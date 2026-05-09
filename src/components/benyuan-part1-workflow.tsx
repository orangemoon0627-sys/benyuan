"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, FlaskConical, Images, UploadCloud, X } from "lucide-react";
import { BottomActionBar, DetailCard, GlassPanel, ImmersiveTopBar, MetaPill, MicroSwitch, SecondaryButton, SectionTitle, TextField } from "@/components/framework-primitives";
import { benyuanUiRecipes, cx } from "@/config/benyuan-ui-recipes";
import { buildCollectPrimaryActionModel } from "@/lib/benyuan-mainflow-presentation";
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
import { mergeUploadedAssets, removeUploadedAsset, remainingUploadSlots, uploadedAssetsFromAnswer } from "@/lib/benyuan-upload-assets";
import type { AgentRuntimeOverride, BenyuanModuleKey, BenyuanQuestion, BenyuanUploadedAssetRef, Part1AnswerMap } from "@/lib/benyuan-v3-types";

const moduleTitles: Record<BenyuanModuleKey, string> = {
  A: "模块 A · 审美偏好",
  B: "模块 B · 哲学提问",
  C: "模块 C · 生命叙事",
};

const moduleOrder: BenyuanModuleKey[] = ["A", "B", "C"];

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

function formatRuntimeAvailability(runtimeStatus: RuntimeStatus | null) {
  if (!runtimeStatus) return "runtime checking";
  return runtimeStatus.liveProviderEnabled ? "live available" : "fallback standby";
}

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
    provider_name: "xiaoye",
    model: "gpt-5.5",
    reasoning_effort: "xhigh",
    disable_response_storage: true,
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
  const runtime = { ...createInitialRuntime(), ...(value as AgentRuntimeOverride) };
  if (runtime.provider_name === "qingyan") {
    delete runtime.provider_name;
    delete runtime.base_url;
  }
  if (runtime.api_key === "") delete runtime.api_key;
  return runtime;
}

function runtimeOverrideForRequest(runtime: AgentRuntimeOverride): AgentRuntimeOverride | undefined {
  const requestRuntime: AgentRuntimeOverride = {};
  if (runtime.provider_name?.trim()) requestRuntime.provider_name = runtime.provider_name.trim();
  if (runtime.model?.trim()) requestRuntime.model = runtime.model.trim();
  if (runtime.base_url?.trim()) requestRuntime.base_url = runtime.base_url.trim();
  if (runtime.reasoning_effort) requestRuntime.reasoning_effort = runtime.reasoning_effort;
  if (typeof runtime.disable_response_storage === "boolean") requestRuntime.disable_response_storage = runtime.disable_response_storage;
  return Object.keys(requestRuntime).length > 0 ? requestRuntime : undefined;
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

function findFirstIncompleteQuestionIndex(module: BenyuanModuleKey, answers: Part1AnswerMap) {
  const questions = benyuanQuestionsByModule[module];
  const index = questions.findIndex((question) => !isQuestionAnswered(question, answers));
  return index >= 0 ? index : 0;
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

function visualUnits(text: string) {
  return Array.from(text.replace(/\s+/g, "").trim()).reduce((total, char) => total + (/[\u0000-\u00ff]/.test(char) ? 0.58 : 1), 0);
}

function questionPromptClass(prompt: string) {
  const units = visualUnits(prompt);
  if (units > 34) {
    return "text-[1.18rem] font-extrabold leading-[1.24] tracking-[0em] md:text-[1.92rem] md:leading-[1.12]";
  }
  if (units > 24) {
    return "text-[1.34rem] font-extrabold leading-[1.18] tracking-[0em] md:text-[2.18rem] md:leading-[1.07]";
  }
  return "text-[1.62rem] font-black leading-[1.08] tracking-[0em] md:text-[2.55rem] md:leading-[1.01]";
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

function optionIndexLabel(index: number) {
  return String.fromCharCode(65 + index);
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

function QuestionBlock({
  question,
  questionNumber,
  totalQuestions,
  moduleKey,
  value,
  onSingle,
  onToggleMulti,
  onDistribution,
  onUpload,
  onRemoveUploadAsset,
  uploading,
  uploadError,
  onNativeUploadFromLibrary,
  onNativeUploadFromCamera,
  nativeUploadEnabled,
}: {
  question: BenyuanQuestion;
  questionNumber: number;
  totalQuestions: number;
  moduleKey: BenyuanModuleKey;
  value: unknown;
  onSingle: (optionId: string) => void;
  onToggleMulti: (optionId: string) => void;
  onDistribution: (key: "past" | "present" | "future", value: number) => void;
  onUpload: (files: FileList | File[] | null) => Promise<void>;
  onRemoveUploadAsset: (assetId: string) => void;
  onNativeUploadFromLibrary?: () => Promise<void>;
  onNativeUploadFromCamera?: () => Promise<void>;
  nativeUploadEnabled?: boolean;
  uploading: boolean;
  uploadError?: string;
}) {
  const uploadedAssets = uploadedAssetsFromAnswer(value);
  const [dragActive, setDragActive] = useState(false);
  const uploadInputId = `upload-input-${question.id}`;
  const uploadMin = question.uploadRange?.min ?? 1;
  const uploadMax = question.uploadRange?.max ?? uploadMin;
  const remainingUploads = Math.max(0, uploadMax - uploadedAssets.length);
  const showHelperText = Boolean(question.helperText && question.kind === "distribution");
  const uploadHint = uploading
    ? "正在整理这条线索。"
    : dragActive
      ? "松开，它会进入当前问题。"
      : uploadedAssets.length > 0
        ? remainingUploads > 0
          ? `还可补充 ${remainingUploads} 张。`
          : "这一题的素材已经足够。"
        : "选择一张图，交出一条审美线索。";
  const questionStep = `${String(questionNumber).padStart(2, "0")} / ${String(totalQuestions).padStart(2, "0")}`;
  const uploadCountLine =
    uploadedAssets.length > 0
      ? `已加入 ${uploadedAssets.length} / ${uploadMax} 张${remainingUploads > 0 ? ` · 还可补充 ${remainingUploads} 张` : ""}`
      : `至少 ${uploadMin} 张${uploadMax > uploadMin ? ` · 最多 ${uploadMax} 张` : ""}`;

  return (
    <section
      className={cx(
        "relative mx-auto flex min-h-[calc(100svh_-_11rem)] w-full max-w-full flex-col justify-start px-0 pb-4 pt-[clamp(1.15rem,4.5svh,3rem)] md:min-h-[calc(100svh_-_11.5rem)] md:max-w-[30rem] md:py-5",
      )}
    >
      <div className="postmodern-question-stage relative mx-auto w-full max-w-full text-left md:max-w-[30rem]">
        <div className="postmodern-question-kicker">
          <span>{questionStep}</span>
          <span>MODULE {moduleKey}</span>
        </div>
        <h3 className={cx("postmodern-question-title mt-4 max-w-[20.75rem] text-[var(--text-primary)] md:mt-5 md:max-w-[26rem]", questionPromptClass(question.prompt))}>{question.prompt}</h3>
        {showHelperText ? <p className="mt-4 max-w-[22rem] text-sm leading-7 text-[var(--text-secondary)] md:max-w-[26rem]">{question.helperText}</p> : null}
        {question.kind === "upload" ? (
          <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-[var(--text-tertiary)]">{uploadCountLine}</p>
        ) : null}
      </div>

      {question.kind === "single" ? (
        <div className="mx-auto mt-3 grid max-h-[47svh] w-full max-w-full gap-2.5 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mt-5 md:max-h-[42svh] md:max-w-[30rem]">
          {question.options?.map((option, index) => {
            const active = value === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSingle(option.id)}
                data-active={active ? "true" : "false"}
                className={cx(benyuanUiRecipes.interactiveCard(active, "accent"), "group min-h-[4.1rem] cursor-pointer px-4 py-3.5 text-left md:min-h-[4.35rem] md:px-5 md:py-4")}
              >
                <div className="flex items-center gap-4">
                  <span className="postmodern-option-index" aria-hidden>{optionIndexLabel(index)}</span>
                  <div className="min-w-0 flex-1 text-[0.98rem] font-semibold leading-6 text-[var(--text-primary)] md:text-[1rem]">{formatOptionText(option.text)}</div>
                  <div className="cosmic-option-select" aria-hidden />
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {question.kind === "multi" ? (
        <div className="mx-auto mt-3 grid max-h-[47svh] w-full max-w-full gap-2.5 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mt-5 md:max-h-[42svh] md:max-w-[30rem]">
          {question.options?.map((option, index) => {
            const selected = Array.isArray(value) && value.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onToggleMulti(option.id)}
                data-active={selected ? "true" : "false"}
                className={cx(benyuanUiRecipes.interactiveCard(selected, "accent"), "min-h-[4.1rem] cursor-pointer px-4 py-3.5 text-left md:min-h-[4.35rem] md:px-5 md:py-4")}
              >
                <div className="flex items-center gap-4">
                  <span className="postmodern-option-index" aria-hidden>{optionIndexLabel(index)}</span>
                  <div className="min-w-0 flex-1 text-[0.98rem] font-semibold leading-6 text-[var(--text-primary)] md:text-[1rem]">{formatOptionText(option.text)}</div>
                  <div className="cosmic-option-select" aria-hidden />
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {question.kind === "distribution" ? (
        <div className="mx-auto mt-5 grid w-full max-w-full gap-3 md:grid-cols-3">
          {question.distributionKeys?.map((item) => {
            const distribution = isRecord(value) ? (value as { past: number; present: number; future: number }) : { past: 34, present: 33, future: 33 };
            return (
              <DetailCard key={item.key} label={item.label} title={<span className="text-3xl font-black tracking-[0em] text-[var(--text-primary)]">{distribution[item.key]}%</span>} className="postmodern-meter-card rounded-[2rem] p-6">
                <input className="mt-6 w-full accent-[var(--accent-gold)]" type="range" min={0} max={100} value={distribution[item.key]} onChange={(event) => onDistribution(item.key, Number(event.target.value))} />
              </DetailCard>
            );
          })}
        </div>
      ) : null}

      {question.kind === "upload" ? (
        <div className="mx-auto mt-5 flex w-full max-w-full flex-col gap-3.5 md:mt-6 md:max-w-[30rem]">
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
              className={`postmodern-upload-stage rounded-[2rem] p-4 transition md:p-6 ${
                dragActive
                  ? "border-[rgba(196,177,122,0.44)] bg-[rgba(232,228,208,0.12)] shadow-[0_0_28px_rgba(196,177,122,0.13)]"
                  : "hover:border-[rgba(196,177,122,0.28)] hover:bg-[rgba(238,241,255,0.08)]"
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
                    <div className="rounded-full border border-[rgba(196,177,122,0.22)] bg-[rgba(246,248,255,0.08)] p-3 text-[var(--starlight-white)] shadow-[0_0_14px_rgba(196,177,122,0.08)]">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black tracking-[0em] text-[var(--text-primary)]">上传你的审美线索</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{uploadHint}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label
                  htmlFor={uploadInputId}
                  data-benyuan-pressable="true"
                  className={`inline-flex min-h-[3.4rem] items-center justify-center rounded-full border border-[var(--border)] px-5 py-3 text-sm text-[var(--text-primary)] transition ${
                    uploading ? "pointer-events-none opacity-50" : "cursor-pointer duration-150 will-change-transform hover:bg-[rgba(255,255,255,0.055)] active:translate-y-px active:scale-[0.985]"
                  }`}
                >
                  选择线索
                </label>
                <div className="flex min-h-[3.4rem] flex-1 items-center rounded-full border border-[rgba(225,230,255,0.12)] bg-[rgba(8,10,18,0.28)] px-4 py-3 text-sm text-[var(--text-secondary)]">{uploadCountLine}</div>
              </div>
              {nativeUploadEnabled ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void onNativeUploadFromLibrary?.()}
                    disabled={uploading}
                    className={cx(benyuanUiRecipes.interactiveCard(false, "accent"), "group min-h-[3.6rem] p-4 disabled:cursor-not-allowed disabled:opacity-50")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-[1rem] border border-[var(--border)] bg-black/12 p-2 text-[var(--moon-silver)]">
                        <Images className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-[var(--text-primary)]">从相册选择</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void onNativeUploadFromCamera?.()}
                    disabled={uploading}
                    className={cx(benyuanUiRecipes.interactiveCard(false, "accent"), "group min-h-[3.6rem] p-4 disabled:cursor-not-allowed disabled:opacity-50")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-[1rem] border border-[var(--border)] bg-black/12 p-2 text-[var(--moon-silver)]">
                        <Camera className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-[var(--text-primary)]">直接拍照</p>
                      </div>
                    </div>
                  </button>
                </div>
              ) : null}
              {uploadError ? <p className="mt-4 rounded-[1rem] border border-[rgba(240,238,244,0.16)] bg-[rgba(240,238,244,0.045)] px-4 py-3 text-sm text-[var(--text-primary)]">{uploadError}</p> : null}
              {uploading ? <p className="mt-5 text-sm text-[var(--text-secondary)] animate-pulse">正在让这条线索归位。</p> : null}
              {uploadedAssets.length > 0 ? (
                <div className="mt-5">
                  <div className={benyuanUiRecipes.thumbnailRail}>
                    {uploadedAssets.map((file, index) => (
                      <div key={`${file.asset_id}-${index}`} className={cx(benyuanUiRecipes.thumbnailCard, "relative")}>
                        <button
                          type="button"
                          aria-label={`删除线索 ${index + 1}`}
                          onClick={() => onRemoveUploadAsset(file.asset_id)}
                          disabled={uploading}
                          className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/65 text-stone-100 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </button>
                        {file.mime_type.startsWith("image/") ? (
                          <Image
                            src={`/api/part1/uploaded/${file.asset_id}`}
                            alt={file.name ?? `文件 ${index + 1}`}
                            width={140}
                            height={140}
                            unoptimized
                            className="h-28 w-full rounded-[1.1rem] border border-[var(--border)] object-cover"
                          />
                        ) : (
                          <div className="flex h-28 w-full items-center justify-center rounded-[1.1rem] border border-[var(--border)] text-xs text-[var(--text-tertiary)]">FILE</div>
                        )}
                        <p className="mt-3 text-center text-[11px] tracking-[0.14em] text-[var(--text-tertiary)]">线索 {String(index + 1).padStart(2, "0")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}


export function BenyuanPart1Workflow({
  moduleFilter,
  demoLinks = fallbackDemoLinks,
  showAuxiliaryPanels = false,
}: {
  moduleFilter?: BenyuanModuleKey;
  demoLinks?: BenyuanDemoLink[];
  showAuxiliaryPanels?: boolean;
}) {
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
  const [showRuntimeControls, setShowRuntimeControls] = useState(false);
  const [ritualQuestionIndex, setRitualQuestionIndex] = useState(0);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const currentQuestionIdsRef = useRef<string[]>([]);
  const answersRef = useRef<Part1AnswerMap>(createInitialAnswers());
  const activeModuleRef = useRef<BenyuanModuleKey>(moduleFilter ?? "A");

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

    if (!showAuxiliaryPanels) return;

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
  }, [showAuxiliaryPanels]);

  useEffect(() => {
    clearAutoAdvanceTimer();
    if (moduleFilter) setActiveModule(moduleFilter);
    setRitualQuestionIndex(findFirstIncompleteQuestionIndex(moduleFilter ?? activeModuleRef.current, answersRef.current));
  }, [moduleFilter]);

  useEffect(() => {
    window.localStorage.setItem(BENYUAN_PART1_STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    window.localStorage.setItem(BENYUAN_RUNTIME_STORAGE_KEY, JSON.stringify(runtimeOverride));
  }, [runtimeOverride]);

  useEffect(() => {
    clearAutoAdvanceTimer();
    setRitualQuestionIndex(findFirstIncompleteQuestionIndex(activeModule, answersRef.current));
  }, [activeModule]);

  useEffect(() => {
    activeModuleRef.current = activeModule;
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
  const activeModuleTotal = moduleFilter ? currentQuestions.length : benyuanQuestionsByModule[activeModule].length;
  const activeModuleComplete = moduleProgress[activeModule] >= activeModuleTotal;
  const allModulesComplete = answeredTotal >= benyuanPart1Questions.length;
  const nextSequentialModule = moduleOrder
    .slice(moduleOrder.indexOf(activeModule) + 1)
    .find((module) => moduleProgress[module] < benyuanQuestionsByModule[module].length);
  const overallProgressPercent = Math.round((answeredTotal / Math.max(totalQuestions, 1)) * 100);
  const nextPendingModule = moduleOrder.find((module) => moduleProgress[module] < benyuanQuestionsByModule[module].length);
  const nextActionableModule = nextSequentialModule ?? (nextPendingModule && nextPendingModule !== activeModule ? nextPendingModule : null);
  const runtimeAvailabilityLabel = formatRuntimeAvailability(runtimeStatus);
  const showDebugPanels = showAuxiliaryPanels && !moduleFilter;
  const primaryActionDisabled = submitting || Boolean(uploadingQuestionId) || packLoadingId !== null;
  const primaryAction = buildCollectPrimaryActionModel({
    moduleFilter,
    allModulesComplete,
    activeModuleComplete,
    nextActionableModule,
    activeQuestionAnswered,
    primaryActionDisabled,
  });
  function clearAutoAdvanceTimer() {
    if (autoAdvanceTimerRef.current) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }

  function focusModule(module: BenyuanModuleKey, statusMessage?: string) {
    clearAutoAdvanceTimer();
    setActiveModule(module);
    setRitualQuestionIndex(findFirstIncompleteQuestionIndex(module, answersRef.current));
    if (statusMessage) setStatus(statusMessage);
  }

  function scheduleAutoAdvance(questionId: string, delay = 520) {
    clearAutoAdvanceTimer();
    autoAdvanceTimerRef.current = window.setTimeout(() => {
      const ids = currentQuestionIdsRef.current;
      if (!ids.includes(questionId)) {
        autoAdvanceTimerRef.current = null;
        return;
      }

      const currentModule = activeModuleRef.current;
      const answeredInModule = countAnswered(benyuanQuestionsByModule[currentModule], answersRef.current);
      const totalInModule = benyuanQuestionsByModule[currentModule].length;

      if (answeredInModule >= totalInModule) {
        if (!moduleFilter) {
          const nextModule =
            moduleOrder
              .slice(moduleOrder.indexOf(currentModule) + 1)
              .find((module) => countAnswered(benyuanQuestionsByModule[module], answersRef.current) < benyuanQuestionsByModule[module].length) ??
            moduleOrder.find((module) => countAnswered(benyuanQuestionsByModule[module], answersRef.current) < benyuanQuestionsByModule[module].length);

          if (nextModule && nextModule !== currentModule) {
            focusModule(nextModule, `${moduleTitles[currentModule]} 已完成，已进入 ${moduleTitles[nextModule]}。`);
            autoAdvanceTimerRef.current = null;
            return;
          }

          setStatus("三组模块已经全部完成，可以直接进入剧场分析。");
        } else {
          setStatus(`${moduleTitles[currentModule]} 已完成，可以返回总览继续后续模块。`);
        }
      }

      setRitualQuestionIndex(findFirstIncompleteQuestionIndex(currentModule, answersRef.current));
      autoAdvanceTimerRef.current = null;
    }, delay);
  }

  function updateAnswer(questionId: string, value: unknown) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function findUploadQuestion(questionId: string) {
    return benyuanPart1Questions.find((question) => question.id === questionId && question.kind === "upload");
  }

  function updateUploadedAnswer(questionId: string, incomingAssets: BenyuanUploadedAssetRef[]) {
    const question = findUploadQuestion(questionId);
    const uploadMax = question?.uploadRange?.max ?? incomingAssets.length;
    const nextAssets = mergeUploadedAssets(answersRef.current[questionId], incomingAssets, uploadMax);
    answersRef.current = { ...answersRef.current, [questionId]: nextAssets };
    setAnswers((current) => ({ ...current, [questionId]: nextAssets }));

    return { nextCount: nextAssets.length, uploadMax };
  }

  function removeUploadAsset(questionId: string, assetId: string) {
    clearAutoAdvanceTimer();
    setAnswers((current) => ({ ...current, [questionId]: removeUploadedAsset(current[questionId], assetId) }));
    setStatus("已移除这条图片线索，可以重新选择。");
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

      const uploadedAssets = (payload.assets ?? []) as BenyuanUploadedAssetRef[];
      const { nextCount, uploadMax } = updateUploadedAnswer(questionId, uploadedAssets);
      if (nextCount >= uploadMax) scheduleAutoAdvance(questionId, 680);
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

    const uploadMax = question.uploadRange?.max ?? 1;
    const remaining = remainingUploadSlots(answersRef.current[question.id], uploadMax);
    if (remaining <= 0) {
      setStatus("这一题的图片线索已经足够。先删除一张，再重新选择。");
      return;
    }

    setUploadErrors((current) => ({ ...current, [question.id]: "" }));
    setStatus(source === "camera" ? "正在打开 iPhone 相机..." : "正在打开 iPhone 原生相册...");

    try {
      const files = await pickImagesWithBenyuanNativeShell({
        questionId: question.id,
        maxCount: source === "camera" ? 1 : remaining,
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
        runtime_override: runtimeOverrideForRequest(runtimeOverride),
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

  function handlePrimaryAction() {
    if (primaryAction.disabled) return;

    if (primaryAction.intent === "submit") {
      void submitFlow();
      return;
    }

    if (primaryAction.intent === "next-module" && nextActionableModule) {
      focusModule(nextActionableModule, `已进入 ${moduleTitles[nextActionableModule]}。继续沿同一条 Part 1 链路推进。`);
      return;
    }

    if (primaryAction.intent === "return-overview") {
      router.push("/collect");
      return;
    }

    clearAutoAdvanceTimer();
    setRitualQuestionIndex(findFirstIncompleteQuestionIndex(activeModule, answersRef.current));
  }

  return (
    <div className={benyuanUiRecipes.immersiveFlow}>
      <ImmersiveTopBar
        backHref={moduleFilter ? "/collect" : "/"}
        progressValue={overallProgressPercent}
      />

      {!moduleFilter ? (
        <div className="-mt-1 flex justify-center">
          <MicroSwitch
            items={moduleOrder.map((module) => {
              const total = benyuanQuestionsByModule[module].length;
              const progress = moduleProgress[module];
              const active = activeModule === module;
              return {
                id: module,
                label: `${module}`,
                tone: active ? "active" : progress >= total ? "done" : "idle",
                onClick: () => {
                  clearAutoAdvanceTimer();
                  setActiveModule(module);
                  setRitualQuestionIndex(findFirstIncompleteQuestionIndex(module, answers));
                },
              };
            })}
          />
        </div>
      ) : null}

      {ritualQuestion ? (
        <QuestionBlock
          key={ritualQuestion.id}
          question={ritualQuestion}
          questionNumber={activeQuestionNumber}
          totalQuestions={totalQuestions}
          moduleKey={activeModule}
          value={answers[ritualQuestion.id]}
          onSingle={(optionId) => {
            updateAnswer(ritualQuestion.id, optionId);
            scheduleAutoAdvance(ritualQuestion.id);
          }}
          onToggleMulti={(optionId) => toggleMulti(ritualQuestion.id, optionId)}
          onDistribution={(key, value) => updateDistribution(key, value)}
          onUpload={(files) => uploadFiles(ritualQuestion.id, files, "web-upload")}
          onRemoveUploadAsset={(assetId) => removeUploadAsset(ritualQuestion.id, assetId)}
          onNativeUploadFromLibrary={() => openNativeImagePicker(ritualQuestion, "library")}
          onNativeUploadFromCamera={() => openNativeImagePicker(ritualQuestion, "camera")}
          nativeUploadEnabled={Boolean(shellInfo?.bridge?.includes("pickImages"))}
          uploading={uploadingQuestionId === ritualQuestion.id}
          uploadError={uploadErrors[ritualQuestion.id]}
        />
      ) : (
        <GlassPanel className={cx(benyuanUiRecipes.stagePanel, "mx-auto w-full max-w-[34rem] md:max-w-[38rem]")}>
          <div className="py-10 text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">等待问题</p>
            <h3 className="mt-4 text-2xl text-[var(--text-primary)]">当前没有可展示的问题</h3>
          </div>
        </GlassPanel>
      )}

      {errors.length > 0 ? (
        <div className="rounded-[1.5rem] border border-[rgba(240,238,244,0.16)] bg-[rgba(240,238,244,0.045)] px-5 py-4 text-sm leading-7 text-[var(--text-primary)]">
          {errors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      ) : null}

      <BottomActionBar className="bottom-1 px-1 py-3 md:px-4">
        <div className="mx-auto grid w-full max-w-full grid-cols-[5.7rem_minmax(0,1fr)] gap-1.5 rounded-full border border-[rgba(225,230,255,0.12)] bg-[rgba(4,5,14,0.72)] p-1.5 shadow-[0_18px_52px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[30px] md:min-w-[20rem] md:max-w-[30rem] md:grid-cols-[7.8rem_minmax(0,1fr)]">
          <button
            type="button"
            onClick={() => {
              clearAutoAdvanceTimer();
              setRitualQuestionIndex((current) => Math.max(0, current - 1));
            }}
            disabled={ritualQuestionIndex === 0}
            className={cx(benyuanUiRecipes.secondaryLink, "w-full disabled:opacity-40")}
          >
            上一题
          </button>
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={primaryAction.disabled}
            className={cx(benyuanUiRecipes.primaryLink, "w-full pr-14 disabled:opacity-40")}
          >
            {submitting ? "正在显影" : primaryAction.label}
          </button>
        </div>
      </BottomActionBar>
      {showDebugPanels ? (
        <GlassPanel className={cx(benyuanUiRecipes.stagePanel, "mx-auto w-full max-w-6xl")}>
              <SectionTitle
                label="调试入口"
                title="测试包、演示入口与运行时覆盖只在这里展示。"
                description="主流程默认不显示这些信息；需要排查时再通过显式调试入口进入。"
              />
              <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
                <div className="space-y-6">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-tertiary)]">测试素材包</p>
                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                      {benyuanTestPacks.map((pack) => {
                        const loadingPack = packLoadingId === pack.id;
                        return (
                          <div key={pack.id} className={cx("flex h-full flex-col p-5", benyuanUiRecipes.sectionPanel)}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--text-tertiary)]">pack {pack.id}</p>
                                <h3 className="mt-2 text-xl text-[var(--text-primary)]">{pack.name}</h3>
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
                            <SecondaryButton
                              type="button"
                              onClick={() => void applyTestPack(pack)}
                              disabled={Boolean(packLoadingId) || submitting || Boolean(uploadingQuestionId)}
                              className="mt-6 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {loadingPack ? `正在载入 ${pack.id}` : `载入 ${pack.id}`}
                            </SecondaryButton>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-tertiary)]">freeze demo</p>
                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                      {demoLinks.map((item) => (
                        <div key={item.pack} className={cx("p-5", benyuanUiRecipes.sectionPanel)}>
                          <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--text-tertiary)]">demo {item.pack}</p>
                          <h3 className="mt-2 text-xl text-[var(--text-primary)]">{item.name}</h3>
                          <p className="mt-2 text-sm text-[var(--accent-gold)]">{item.archetype}</p>
                          <div className="mt-6 flex gap-3">
                            <a href={item.theaterHref} className={cx(benyuanUiRecipes.secondaryLink, "flex-1")}>剧场</a>
                            <a href={item.constellationHref} className={cx(benyuanUiRecipes.primaryLink, "flex-1")}>星图</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={cx(benyuanUiRecipes.sectionPanel, "p-5")}>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-tertiary)]">runtime override</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">正常体验不需要改 provider / model / base url；这里只为排查 live provider 或多模态问题保留。</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <MetaPill>{runtimeOverride.provider_name ?? runtimeStatus?.provider ?? "custom"}</MetaPill>
                    <MetaPill>{runtimeOverride.model ?? runtimeStatus?.model ?? "gpt-5.5"}</MetaPill>
                    <MetaPill>{runtimeStatus?.wireApi ?? "responses"}</MetaPill>
                    <MetaPill>{runtimeAvailabilityLabel}</MetaPill>
                    {runtimeStatus?.apiKeyConfigured && runtimeStatus?.liveProviderEnabled ? <MetaPill>api ready</MetaPill> : null}
                    {runtimeStatus?.softTimeoutMs ? <MetaPill>{Math.round(runtimeStatus.softTimeoutMs / 1000)}s timeout</MetaPill> : null}
                  </div>
                  <div className="mt-5 border border-[var(--border)] bg-black/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">高级设置</p>
                        <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">只在调试入口使用，主流程默认不会暴露。</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRuntimeControls((current) => !current)}
                        className="inline-flex min-h-11 items-center justify-center border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-primary)] transition duration-150 will-change-transform hover:border-[var(--accent-gold-dim)] hover:bg-[rgba(212,175,55,0.05)] active:translate-y-px active:scale-[0.985]"
                      >
                        {showRuntimeControls ? "收起设置" : "展开设置"}
                      </button>
                    </div>
                    {showRuntimeControls ? (
                      <div className="mt-4 grid gap-3">
                        <TextField placeholder="Provider Name" value={runtimeOverride.provider_name ?? ""} onChange={(event) => setRuntimeOverride((current) => ({ ...current, provider_name: event.target.value }))} />
                        <TextField placeholder="Model" value={runtimeOverride.model ?? ""} onChange={(event) => setRuntimeOverride((current) => ({ ...current, model: event.target.value }))} />
                        <TextField placeholder="Base URL (OpenAI-compatible)" value={runtimeOverride.base_url ?? ""} onChange={(event) => setRuntimeOverride((current) => ({ ...current, base_url: event.target.value }))} />
                        <TextField type="password" placeholder="API Key（留空则使用本机 Codex Auth）" value={runtimeOverride.api_key ?? ""} onChange={(event) => setRuntimeOverride((current) => ({ ...current, api_key: event.target.value }))} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
        </GlassPanel>
      ) : null}
    </div>
  );
}
