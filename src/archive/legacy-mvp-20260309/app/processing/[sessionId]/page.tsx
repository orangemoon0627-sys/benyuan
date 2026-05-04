"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowUpRight, RefreshCcw, Sparkles } from "lucide-react";
import type { AnalysisJob, AnalysisPipelineStageRecord } from "@/lib/types";

type StageMeta = {
  title: string;
  eyebrow: string;
  body: string;
};

const stageMetaMap: Record<string, StageMeta> = {
  input_prepared: {
    title: "准备输入",
    eyebrow: "ritual / collect",
    body: "先把 session、题目合同与作答结构压成一份可读取的底稿，避免后续分析在噪声里打转。",
  },
  prompt_shaped: {
    title: "整理提示词",
    eyebrow: "ritual / shape",
    body: "根据当前 mode、题集与输出 schema 选择最合适的叙事模板，让后续增强有统一语境。",
  },
  feature_mapped: {
    title: "生成特征向量",
    eyebrow: "ritual / signals",
    body: "把审美、情绪与时间倾向映射成稳定信号，给最后的报告留下一条可追溯的证据链。",
  },
  provider_enhanced: {
    title: "外部增强",
    eyebrow: "ritual / provider",
    body: "如果 live provider 可用，就把基线报告送去做语言与洞察增强；如果超时，就优雅回退。",
  },
  report_built: {
    title: "生成报告",
    eyebrow: "ritual / constellation",
    body: "把原型、七维星图、张力与建议缝合为一份完整输出，确保结构和语气保持一致。",
  },
  persisted: {
    title: "写回存储",
    eyebrow: "ritual / archive",
    body: "最后把 feature vector、report 与作业轨迹一并落库，这样你回来时，结果仍然在那里。",
  },
};

const stageOrder = Object.keys(stageMetaMap);

const statusLabel: Record<string, string> = {
  queued: "已进入雾面缓冲层",
  running: "正在潜入",
  done: "即将显影",
  failed: "这次潜入被打断了",
};

const statusBody: Record<string, string> = {
  queued: "分析已经排进当前序列。系统会先稳住你的线索，再开始真正的整理。",
  running: "现在不是在算分，而是在让回答之间彼此照面，看它们能否组成一张更像你的图。",
  done: "线索已经接近完成，马上会把这次潜入带回到一份可阅读的结果里。",
  failed: "你的输入没有丢失，只是这次显影过程没有顺利走完。你可以重新发起一次。",
};

type ProcessingRuntime = {
  jobId?: AnalysisJob["jobId"];
  status: AnalysisJob["status"];
  currentStageKey?: AnalysisJob["currentStageKey"];
  pipelineStages?: AnalysisJob["pipelineStages"];
  providerId?: AnalysisJob["providerId"];
  providerModel?: AnalysisJob["providerModel"];
  effectiveRuntime?: AnalysisJob["effectiveRuntime"];
};

type AnalysisSessionResponse = {
  lifecycleStatus: string;
  reportReady: boolean;
  currentJob?: ProcessingRuntime;
  latestJob?: ProcessingRuntime;
};

function buildFallbackStages(status: string): AnalysisPipelineStageRecord[] {
  return stageOrder.map((key, index) => ({
    key,
    title: stageMetaMap[key].title,
    detail: stageMetaMap[key].body,
    status: status === "done" ? "done" : status === "failed" && index === 0 ? "failed" : status === "running" && index === 0 ? "running" : "pending",
  }));
}

function normalizeStages(stages: AnalysisPipelineStageRecord[] | undefined, status: string) {
  const source = stages?.length ? stages : buildFallbackStages(status);
  return source.map((stage) => ({
    ...stage,
    title: stage.title || stageMetaMap[stage.key]?.title || stage.key,
    detail: stage.detail || stageMetaMap[stage.key]?.body || "等待进入该阶段。",
  }));
}

function getActiveStage(stages: AnalysisPipelineStageRecord[], currentStageKey: string | undefined) {
  return (
    stages.find((stage) => stage.status === "running") ||
    stages.find((stage) => stage.key === currentStageKey) ||
    [...stages].reverse().find((stage) => stage.status === "done" || stage.status === "skipped") ||
    stages[0]
  );
}

function getProgress(stages: AnalysisPipelineStageRecord[], status: string) {
  if (status === "done") return 100;
  if (status === "failed") return Math.max(12, Math.round((stages.filter((stage) => stage.status === "done" || stage.status === "skipped").length / stages.length) * 100));

  const completed = stages.filter((stage) => stage.status === "done" || stage.status === "skipped").length;
  const running = stages.some((stage) => stage.status === "running") ? 0.6 : status === "running" ? 0.3 : 0;
  return Math.max(8, Math.min(96, Math.round(((completed + running) / stages.length) * 100)));
}

function statusTone(status: AnalysisPipelineStageRecord["status"]) {
  if (status === "done") return "bg-sky-100 shadow-[0_0_18px_rgba(191,219,254,0.45)]";
  if (status === "running") return "bg-white shadow-[0_0_22px_rgba(255,255,255,0.4)]";
  if (status === "failed") return "bg-rose-300 shadow-[0_0_18px_rgba(251,113,133,0.38)]";
  if (status === "skipped") return "bg-violet-200/80";
  return "bg-white/18";
}

function cardTone(status: AnalysisPipelineStageRecord["status"]) {
  if (status === "done") return "bg-[linear-gradient(135deg,rgba(232,243,255,0.11),rgba(167,193,228,0.08))]";
  if (status === "running") return "bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(196,213,232,0.08))]";
  if (status === "failed") return "bg-[linear-gradient(135deg,rgba(127,29,29,0.22),rgba(127,29,29,0.12))]";
  if (status === "skipped") return "bg-[linear-gradient(135deg,rgba(109,80,131,0.14),rgba(255,255,255,0.04))]";
  return "bg-black/16";
}

export default function ProcessingPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [jobState, setJobState] = useState<ProcessingRuntime>({ status: "queued" });
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    async function start() {
      try {
        setError(null);
        setJobState({ status: "queued" });

        const runtimeResponse = await fetch(`/api/analysis/session/${params.sessionId}`, { cache: "no-store" });
        const runtimeData = runtimeResponse.ok ? ((await runtimeResponse.json()) as AnalysisSessionResponse) : null;

        if (!active) return;

        if (runtimeData?.reportReady) {
          router.replace(`/report/${params.sessionId}`);
          return;
        }

        let nextJob = runtimeData?.currentJob;

        if (!nextJob?.jobId || nextJob.status === "done" || nextJob.status === "failed") {
          const response = await fetch("/api/analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: params.sessionId }),
          });
          const data = (await response.json()) as { jobId: string; status: AnalysisJob["status"]; hasReport?: boolean };

          if (!active) return;

          if (data.hasReport || data.status === "done") {
            router.replace(`/report/${params.sessionId}`);
            return;
          }

          nextJob = {
            jobId: data.jobId,
            status: data.status,
          };
        }

        setJobState((current) => ({
          ...current,
          ...nextJob,
          status: nextJob?.status ?? "queued",
        }));

        if (!nextJob?.jobId) {
          throw new Error("missing_job_id");
        }

        timer = window.setInterval(async () => {
          const poll = await fetch(`/api/analysis/${nextJob?.jobId}`, { cache: "no-store" });
          const result = (await poll.json()) as ProcessingRuntime;
          if (!active) return;

          setJobState(result);

          if (result.status === "done") {
            window.clearInterval(timer);
            window.setTimeout(() => {
              router.replace(`/report/${params.sessionId}`);
            }, 420);
          }

          if (result.status === "failed") {
            window.clearInterval(timer);
            setError("这次整理你的线索时出现了中断。我们会保留这次输入，你可以重新发起分析。");
          }
        }, 900);
      } catch {
        setError("分析流程没有成功启动，请稍后重试。");
        setJobState({ status: "failed" });
      }
    }

    start();

    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [params.sessionId, retryKey, router]);

  const stages = useMemo(() => normalizeStages(jobState.pipelineStages, jobState.status), [jobState.pipelineStages, jobState.status]);
  const activeStage = useMemo(() => getActiveStage(stages, jobState.currentStageKey), [jobState.currentStageKey, stages]);
  const activeMeta = stageMetaMap[activeStage?.key ?? "input_prepared"] ?? stageMetaMap.input_prepared;
  const progress = useMemo(() => getProgress(stages, jobState.status), [jobState.status, stages]);
  const doneCount = stages.filter((stage) => stage.status === "done" || stage.status === "skipped").length;
  const currentStatusLabel = statusLabel[jobState.status] ?? jobState.status;
  const currentStatusBody = error ?? activeStage?.detail ?? statusBody[jobState.status] ?? statusBody.running;

  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#08080a] px-6 py-16 text-stone-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(190,221,255,0.16),transparent_18%),radial-gradient(circle_at_18%_62%,rgba(109,80,131,0.12),transparent_24%),radial-gradient(circle_at_82%_58%,rgba(95,118,168,0.12),transparent_28%)]" />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-30" />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[46%] h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(185,215,246,0.22),rgba(128,154,204,0.1)_34%,transparent_70%)] blur-3xl"
        animate={{ opacity: [0.28, 0.5, 0.28], scale: [1, 1.11, 1] }}
        transition={{ duration: 6.2, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[10%] top-[28%] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(139,112,169,0.16),transparent_70%)] blur-3xl"
        animate={{ opacity: [0.22, 0.34, 0.22], y: [0, -12, 0] }}
        transition={{ duration: 8.5, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-160px)] max-w-5xl flex-col items-center justify-center">
        <motion.p
          className="text-[11px] uppercase tracking-[0.44em] text-stone-400"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          processing / ritual state
        </motion.p>
        <motion.h1
          className="mt-5 max-w-4xl text-center text-4xl leading-[1.14] text-stone-100 md:text-6xl lg:text-[4.4rem]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          正在把这次回答，
          <br className="hidden md:block" />
          缓慢显影成一张可阅读的图。
        </motion.h1>
        <motion.p
          className="mt-6 max-w-2xl text-center text-base leading-8 text-stone-300/76 md:text-lg"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          现在这块不再是假动作。你会直接看到本次分析真正走到哪一层：输入整理、特征映射、provider 增强，以及最终的报告落库。
        </motion.p>

        <motion.div
          className="mt-12 w-full overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.016))] p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-2xl md:p-9"
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.95, delay: 0.28 }}
        >
          <div className="grid gap-6 lg:grid-cols-[0.6fr_0.4fr] lg:items-start">
            <div>
              <div className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] tracking-[0.24em] text-stone-300 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                {currentStatusLabel}
              </div>
              <p className="mt-5 max-w-2xl text-base leading-8 text-stone-200/86">{currentStatusBody}</p>

              <div className="mt-7">
                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.24em] text-stone-500">
                  <span>pipeline progress</span>
                  <span>{doneCount}/{stages.length} stages settled · {progress}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,rgba(214,232,255,0.92),rgba(139,168,210,0.82),rgba(199,221,255,0.92))]"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.2em] text-stone-400">
                <span className="rounded-full bg-white/[0.03] px-4 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">job · {jobState.jobId ?? "pending"}</span>
                <span className="rounded-full bg-white/[0.03] px-4 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">runtime · {jobState.effectiveRuntime ?? "booting"}</span>
                <span className="rounded-full bg-white/[0.03] px-4 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">provider · {jobState.providerModel ?? jobState.providerId ?? "deterministic"}</span>
              </div>
            </div>

            <div className="rounded-[28px] bg-black/18 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <p className="text-[11px] tracking-[0.28em] text-stone-500 uppercase">{activeMeta.eyebrow}</p>
              <h2 className="mt-3 text-2xl leading-[1.24] text-stone-100">{activeStage?.title ?? activeMeta.title}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-300/78">{activeMeta.body}</p>
              <div className="mt-5 rounded-[22px] bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">live detail</p>
                <p className="mt-3 text-sm leading-7 text-stone-200/84">{activeStage?.detail ?? "等待进入当前阶段。"}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stages.map((stage, index) => {
              const active = stage.status === "running";
              return (
                <motion.div
                  key={stage.key}
                  className={`rounded-[24px] px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] ${cardTone(stage.status)}`}
                  animate={active ? { y: [0, -4, 0], opacity: [0.84, 1, 0.84] } : { y: 0, opacity: 0.78 }}
                  transition={{ duration: 2.4, repeat: active ? Number.POSITIVE_INFINITY : 0, ease: "easeInOut" }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[11px] tracking-[0.22em] text-stone-500 uppercase">stage {index + 1}</p>
                    <span className={`h-2.5 w-2.5 rounded-full ${statusTone(stage.status)}`} />
                  </div>
                  <p className="mt-2 text-base leading-7 text-stone-200/84">{stage.title}</p>
                  <p className="mt-2 text-xs leading-6 text-stone-400">{stage.status} · {stage.detail}</p>
                </motion.div>
              );
            })}
          </div>

          {error ? (
            <div className="mt-8 flex flex-col gap-4 rounded-[28px] bg-[rgba(255,238,238,0.04)] p-5 shadow-[0_0_0_1px_rgba(251,113,133,0.12)] md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] tracking-[0.28em] text-rose-200/70 uppercase">fallback path</p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-rose-200/86">{error}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setRetryKey((value) => value + 1)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(192,220,249,0.92))] px-5 py-3 text-sm tracking-[0.18em] text-[#0b0d14] uppercase transition hover:scale-[1.01]"
                >
                  <RefreshCcw className="h-4 w-4" strokeWidth={1.5} />
                  重试分析
                </button>
                <Link
                  href="/test"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm tracking-[0.18em] text-stone-300 uppercase transition hover:text-stone-100"
                >
                  回到问题流
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                </Link>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </main>
  );
}
