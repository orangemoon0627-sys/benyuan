"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, FlaskConical, Sparkles, UploadCloud } from "lucide-react";
import { GlassPanel, MetaPill, SectionTitle } from "@/components/framework-primitives";
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
}: {
  question: BenyuanQuestion;
  value: unknown;
  onSingle: (optionId: string) => void;
  onToggleMulti: (optionId: string) => void;
  onDistribution: (key: "past" | "present" | "future", value: number) => void;
  onUpload: (files: FileList | null) => Promise<void>;
  uploading: boolean;
  uploadError?: string;
}) {
  const uploadedAssets = uploadedAssetsFromValue(value);

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
                <div className="text-base leading-8 text-[var(--text-primary)]">{option.text}</div>
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
                <div className="text-base leading-8 text-[var(--text-primary)]">{option.text}</div>
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
        <div className="mx-auto mt-10 grid max-w-5xl gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <label className="group block border border-dashed border-[var(--border)] bg-transparent p-8 transition hover:border-[var(--accent-gold-dim)] hover:bg-[rgba(212,175,55,0.03)]">
            <div className="flex items-center gap-3 text-[var(--text-primary)]">
              <div className="border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-3">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base">上传图片素材</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">支持拖入或点击选择；大图会先在浏览器端压缩，再上传到服务端进入多模态分析</p>
              </div>
            </div>
            <input
              type="file"
              accept={question.acceptedFiles}
              multiple={(question.uploadRange?.max ?? 1) > 1}
              disabled={uploading}
              className="mt-5 block w-full text-sm text-[var(--text-secondary)]"
              onChange={(event) => {
                void onUpload(event.target.files);
                event.currentTarget.value = "";
              }}
            />
            {question.analysisDimensions?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {question.analysisDimensions.map((item) => (
                  <MetaPill key={item}>{item}</MetaPill>
                ))}
              </div>
            ) : null}
            {uploadError ? <p className="mt-4 text-sm text-red-300">{uploadError}</p> : null}
          </label>
          <div className="border border-[var(--border)] bg-[rgba(255,255,255,0.012)] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-tertiary)]">已上传文件</p>
            <div className="mt-4 space-y-3">
              {uploadedAssets.length > 0 ? (
                uploadedAssets.map((file, index) => (
                  <div key={`${file.asset_id}-${index}`} className="border border-[var(--border)] bg-transparent px-4 py-3">
                    <p className="text-sm text-[var(--text-primary)]">{file.name ?? `文件 ${index + 1}`}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-tertiary)]">
                      <span>{formatBytes(file.size)}</span>
                      <span>{file.mime_type}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="border border-[var(--border)] bg-transparent px-4 py-5 text-sm text-[var(--text-tertiary)]">还没有上传文件</div>
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
  const activeQuestionNumber = ritualQuestion ? benyuanPart1Questions.findIndex((question) => question.id === ritualQuestion.id) + 1 : 0;
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

  async function uploadFiles(questionId: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingQuestionId(questionId);
    setUploadErrors((current) => ({ ...current, [questionId]: "" }));
    setStatus("正在上传图片素材...");

    try {
      const formData = new FormData();
      formData.append("question_id", questionId);
      const preparedUploads = await Promise.all(Array.from(files).map((file) => optimizeUploadFile(file)));
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

  async function uploadAssetBundle(questionId: string, assets: BenyuanTestPackAsset[]) {
    if (assets.length === 0) return [];

    const files = await Promise.all(assets.map((asset, index) => fetchAssetAsFile(asset, `${questionId}-${index + 1}`)));
    const formData = new FormData();
    formData.append("question_id", questionId);
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
      {!moduleFilter ? (
        <GlassPanel>
          <SectionTitle
            label="Test Packs"
            title="A / B / C 测试素材包已经就位。"
            description="点一下就会自动填充结构化答案，并把对应歌单、动态、照片素材上传进当前会话，方便你反复压测整条真实链路。"
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
                  <button
                    type="button"
                    onClick={() => void applyTestPack(pack)}
                    disabled={Boolean(packLoadingId) || submitting || Boolean(uploadingQuestionId)}
                    className="mt-6 inline-flex min-h-11 items-center justify-center border border-[var(--accent-gold)] bg-[rgba(212,175,55,0.06)] px-4 py-3 text-sm text-[var(--text-primary)] transition hover:bg-[rgba(212,175,55,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingPack ? `正在载入 ${pack.id}...` : `载入并上传 ${pack.id} 包`}
                  </button>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      ) : null}

      {!moduleFilter ? (
        <GlassPanel>
          <SectionTitle
            label="Instant Demo"
            title="上一轮真实分析结果，也可以直接体验。"
            description="下面这组入口直接指向刚刚通过真实 API 跑出来的剧场与星图，方便你跳过 Part 1 立即验证体验与视觉。"
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
            <SectionTitle label="Part 1 Modules" title="三组模块" description="每次只面对一个问题，让采集过程更像一场仪式，而不是一张表单。" />
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
                <p className="text-[11px] uppercase tracking-[0.38em] text-[var(--text-tertiary)]">Part 1 Ritual</p>
                <h2 className="mt-4 text-[2rem] leading-[1.08] text-[var(--text-primary)] md:text-[3rem]">先只面对一个问题，再进入下一扇门。</h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] md:text-base">
                  当前停留在 {moduleTitles[activeModule]}。系统会持续保留你的作答与上传结果，你可以按顺序推进，也可以随时切换模块。
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
              onUpload={(files) => uploadFiles(ritualQuestion.id, files)}
              uploading={uploadingQuestionId === ritualQuestion.id}
              uploadError={uploadErrors[ritualQuestion.id]}
            />
          ) : null}

          <GlassPanel>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--text-tertiary)]">Question Navigator</p>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                  {activeQuestionAnswered ? "这一题已经留下痕迹，你可以继续前进。" : "先完成这一题，再决定是否继续。"}
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
          <SectionTitle label="Ready to Enter" title="完成 Part 1 后，直接进入剧场。" description="这里会真实调用新的 v3 API 链路：Part 1 提交、多模态分析、剧场导演生成，然后把你送进剧场体验。" />

          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              {errors.length > 0 ? (
                <div className="mb-4 border border-red-400/30 bg-red-500/8 p-4 text-sm leading-7 text-red-200">
                  {errors.map((error) => (
                    <div key={error}>{error}</div>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onClick={submitFlow}
                disabled={submitting || Boolean(uploadingQuestionId)}
                className="inline-flex min-h-11 items-center gap-3 border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-7 py-4 text-sm font-medium text-black transition hover:shadow-[0_0_24px_var(--glow)] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Sparkles className="h-4 w-4" />
                {submitting ? "正在生成你的入口剧场..." : "进入剧场并开始分析"}
              </button>
              <p className="mt-4 text-sm text-[var(--text-secondary)]">{status || "填写完成后会先走真实 API 链路；若未检测到 live provider，则自动回退到内置分析。"}</p>
            </div>
            <div className="border border-[var(--border)] bg-[rgba(255,255,255,0.012)] p-5">
              <p className="text-[11px] tracking-[0.32em] text-stone-400 uppercase">Agent Runtime</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">已经优先读取你本机 Codex 的 provider 配置，并优先走 Responses 流式接口；你也可以在这里手动覆盖 Base URL 或 Model。</p>
              <div className="mt-4 grid gap-3">
                <input className="border border-[var(--border)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)]" placeholder="Provider Name" value={runtimeOverride.provider_name ?? ""} onChange={(event) => setRuntimeOverride((current) => ({ ...current, provider_name: event.target.value }))} />
                <input className="border border-[var(--border)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)]" placeholder="Model" value={runtimeOverride.model ?? ""} onChange={(event) => setRuntimeOverride((current) => ({ ...current, model: event.target.value }))} />
                <input className="border border-[var(--border)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)]" placeholder="Base URL (OpenAI-compatible)" value={runtimeOverride.base_url ?? ""} onChange={(event) => setRuntimeOverride((current) => ({ ...current, base_url: event.target.value }))} />
                <input className="border border-[var(--border)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)]" type="password" placeholder="API Key（留空则使用本机 Codex Auth）" value={runtimeOverride.api_key ?? ""} onChange={(event) => setRuntimeOverride((current) => ({ ...current, api_key: event.target.value }))} />
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
