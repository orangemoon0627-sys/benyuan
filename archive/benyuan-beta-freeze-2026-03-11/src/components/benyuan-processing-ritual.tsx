"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Clock3, RefreshCcw, Sparkles } from "lucide-react";
import { GlassPanel, MetaPill, SectionTitle } from "@/components/framework-primitives";
import {
  BENYUAN_PENDING_PART1_KEY,
  BENYUAN_PENDING_PART2_KEY,
  BENYUAN_RUNTIME_STORAGE_KEY,
  BENYUAN_SESSION_STORAGE_KEY,
  type BenyuanPendingPart1,
  type BenyuanPendingPart2,
  type BenyuanRuntimeSnapshot,
  type BenyuanSessionState,
} from "@/lib/benyuan-v3-client-session";

const stageLabels = {
  part1: [
    { key: "part1_submit", title: "写入 Part 1", detail: "先冻结 A / B / C 三组输入，把本轮收集结果保存为可追踪的记录。", estimateSec: 6 },
    { key: "multimodal", title: "多模态预处理", detail: "把歌单、动态和照片送入真实 API，生成结构化心理线索。", estimateSec: 90 },
    { key: "director", title: "剧场导演生成", detail: "根据 Part 1 与多模态结果，生成三幕式剧场脚本。", estimateSec: 95 },
    { key: "handoff", title: "进入剧场", detail: "把本次结果写入本地会话，准备跳转进入 Part 2。", estimateSec: 4 },
  ],
  constellation: [
    { key: "part2_submit", title: "写入 Part 2", detail: "先保存选择、犹豫时间、hover 与阶段时长，保留这次剧场轨迹。", estimateSec: 6 },
    { key: "analyst", title: "分析师显影", detail: "由分析师 Agent 结合 Part 1 / Part 2 生成精神星图。", estimateSec: 120 },
    { key: "handoff", title: "展开星图", detail: "把星图结果写入本地会话，准备跳转到 Part 3。", estimateSec: 4 },
  ],
} as const;

type RitualPhase = keyof typeof stageLabels;
type StageStatus = "pending" | "running" | "done" | "failed";
type StageRuntime = BenyuanRuntimeSnapshot | { label?: string };

type StageState = {
  key: string;
  title: string;
  detail: string;
  estimateSec: number;
  status: StageStatus;
  runtime?: StageRuntime;
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function clearKey(key: string) {
  window.localStorage.removeItem(key);
}

function buildInitialStages(phase: RitualPhase): StageState[] {
  return stageLabels[phase].map((stage) => ({ ...stage, status: "pending" as const }));
}

function buildResumedStages(phase: RitualPhase): StageState[] {
  const base = buildInitialStages(phase);
  if (typeof window === "undefined") return base;

  if (phase === "part1") {
    const pending = readJson<BenyuanPendingPart1>(BENYUAN_PENDING_PART1_KEY);
    const checkpoint = pending?.checkpoint;
    return base.map((stage) => {
      if (!checkpoint) return stage;
      if (stage.key === "part1_submit" && checkpoint.part1_id) return { ...stage, status: "done", runtime: { label: `part1 · ${checkpoint.part1_id}` } };
      if (stage.key === "multimodal" && checkpoint.multimodal_runtime) return { ...stage, status: "done", runtime: checkpoint.multimodal_runtime };
      if (stage.key === "director" && checkpoint.theater_script_id) return { ...stage, status: "done", runtime: checkpoint.theater_runtime ?? { label: `theater · ${checkpoint.theater_script_id}` } };
      if (stage.key === checkpoint.active_stage_key) return { ...stage, status: "running" };
      return stage;
    });
  }

  const pending = readJson<BenyuanPendingPart2>(BENYUAN_PENDING_PART2_KEY);
  const checkpoint = pending?.checkpoint;
  return base.map((stage) => {
    if (!checkpoint) return stage;
    if (stage.key === "part2_submit" && checkpoint.part2_id) return { ...stage, status: "done", runtime: { label: `part2 · ${checkpoint.part2_id}` } };
    if (stage.key === "analyst" && checkpoint.constellation_id) return { ...stage, status: "done", runtime: checkpoint.constellation_runtime ?? { label: `constellation · ${checkpoint.constellation_id}` } };
    if (stage.key === checkpoint.active_stage_key) return { ...stage, status: "running" };
    return stage;
  });
}

function statusTone(status: StageStatus) {
  if (status === "done") return "bg-[var(--accent-gold)] shadow-[0_0_18px_var(--glow)]";
  if (status === "running") return "bg-white shadow-[0_0_14px_rgba(255,255,255,0.18)]";
  if (status === "failed") return "bg-rose-400 shadow-[0_0_14px_rgba(251,113,133,0.28)]";
  return "bg-white/14";
}

function cardTone(status: StageStatus) {
  if (status === "done") return "border-[var(--accent-gold-dim)] bg-[rgba(212,175,55,0.05)]";
  if (status === "running") return "border-white/18 bg-[rgba(255,255,255,0.03)]";
  if (status === "failed") return "border-rose-300/22 bg-[rgba(251,113,133,0.05)]";
  return "border-[var(--border)] bg-[rgba(255,255,255,0.012)]";
}

function isRuntimeSnapshot(runtime: StageRuntime): runtime is BenyuanRuntimeSnapshot {
  return "provider" in runtime || "model" in runtime || "request_id" in runtime || "mode" in runtime || "error" in runtime;
}

function runtimeLabel(runtime?: StageRuntime) {
  if (!runtime) return undefined;
  if ("label" in runtime && runtime.label) return runtime.label;
  if (!isRuntimeSnapshot(runtime)) return undefined;
  const provider = runtime.provider ?? "fallback";
  const model = runtime.model ?? "-";
  const mode = runtime.mode ? ` · ${runtime.mode}` : "";
  return `${provider} · ${model}${mode}`;
}

function runtimeRequestId(runtime?: StageRuntime) {
  return runtime && isRuntimeSnapshot(runtime) ? runtime.request_id : undefined;
}

function formatSeconds(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? `${path}_failed`);
  return payload;
}

function updatePendingPart1(patch: Partial<BenyuanPendingPart1>) {
  const current = readJson<BenyuanPendingPart1>(BENYUAN_PENDING_PART1_KEY);
  if (!current) return;
  writeJson(BENYUAN_PENDING_PART1_KEY, { ...current, ...patch, checkpoint: { ...current.checkpoint, ...patch.checkpoint } });
}

function updatePendingPart2(patch: Partial<BenyuanPendingPart2>) {
  const current = readJson<BenyuanPendingPart2>(BENYUAN_PENDING_PART2_KEY);
  if (!current) return;
  writeJson(BENYUAN_PENDING_PART2_KEY, { ...current, ...patch, checkpoint: { ...current.checkpoint, ...patch.checkpoint } });
}

function RitualRunner({ phase, onRetry }: { phase: RitualPhase; onRetry: () => void }) {
  const router = useRouter();
  const [stages, setStages] = useState<StageState[]>(() => buildResumedStages(phase));
  const [headline, setHeadline] = useState(phase === "part1" ? "正在把你的输入折叠成剧场入口。" : "正在把剧场轨迹显影成精神星图。");
  const [body, setBody] = useState(
    phase === "part1"
      ? "这一步不再是假加载。系统会沿着同一条真实 API 链路完成保存、多模态分析和导演生成，然后直接把你送进 Part 2。"
      : "现在系统会先写入 Part 2 选择，再沿着同一条真实分析链路调用分析师 Agent，最后跳转到 Part 3。",
  );
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const [emptyStateHref, setEmptyStateHref] = useState<string | null>(null);
  const [emptyStateLabel, setEmptyStateLabel] = useState<string | null>(null);
  const [activeStageStartedAt, setActiveStageStartedAt] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    if (phase === "part1") return readJson<BenyuanPendingPart1>(BENYUAN_PENDING_PART1_KEY)?.checkpoint?.active_stage_started_at ?? null;
    return readJson<BenyuanPendingPart2>(BENYUAN_PENDING_PART2_KEY)?.checkpoint?.active_stage_started_at ?? null;
  });
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [resumedFromCheckpoint] = useState(() => {
    if (typeof window === "undefined") return false;
    if (phase === "part1") {
      const checkpoint = readJson<BenyuanPendingPart1>(BENYUAN_PENDING_PART1_KEY)?.checkpoint;
      return Boolean(checkpoint?.part1_id || checkpoint?.multimodal_runtime || checkpoint?.theater_script_id || checkpoint?.active_stage_key);
    }
    const checkpoint = readJson<BenyuanPendingPart2>(BENYUAN_PENDING_PART2_KEY)?.checkpoint;
    return Boolean(checkpoint?.part2_id || checkpoint?.constellation_id || checkpoint?.active_stage_key);
  });

  useEffect(() => {
    if (!running || !activeStageStartedAt) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeStageStartedAt, running]);

  useEffect(() => {
    let active = true;

    function setStage(index: number, patch: Partial<StageState>) {
      if (!active) return;
      setStages((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
    }

    function markRunning(index: number, stageKey: string) {
      const startedAt = Date.now();
      setStage(index, { status: "running" });
      setActiveStageStartedAt(startedAt);
      setNowMs(startedAt);
      if (phase === "part1") {
        updatePendingPart1({ checkpoint: { active_stage_key: stageKey, active_stage_started_at: startedAt } });
      } else {
        updatePendingPart2({ checkpoint: { active_stage_key: stageKey, active_stage_started_at: startedAt } });
      }
    }

    function clearActiveStage() {
      setActiveStageStartedAt(null);
      if (phase === "part1") {
        updatePendingPart1({ checkpoint: { active_stage_key: undefined, active_stage_started_at: undefined } });
      } else {
        updatePendingPart2({ checkpoint: { active_stage_key: undefined, active_stage_started_at: undefined } });
      }
    }

    async function runPart1Flow() {
      const pending = readJson<BenyuanPendingPart1>(BENYUAN_PENDING_PART1_KEY);
      if (!pending) {
        setHeadline("当前没有待继续的 Part 1 处理任务。");
        setBody("请先从特征收集页完成 A / B / C 模块，processing 页面才会沿着真实链路依次调用保存、多模态分析与导演 Agent。");
        setStages(buildInitialStages("part1"));
        setRunning(false);
        setEmptyStateHref("/collect");
        setEmptyStateLabel("返回 Part 1");
        return;
      }

      setHeadline("正在把你的输入折叠成剧场入口。");
      setBody("系统会先写入 Part 1，再调用多模态和导演 Agent。处理完成后会自动进入剧场，不需要你继续停留在采集页。");

      const checkpoint = pending.checkpoint ?? {};
      let part1Id = checkpoint.part1_id;
      let multimodalRuntime = checkpoint.multimodal_runtime;
      let theaterScriptId = checkpoint.theater_script_id;
      let theaterRuntime = checkpoint.theater_runtime;

      if (part1Id) setStage(0, { status: "done", runtime: { label: `part1 · ${part1Id}` } });
      if (multimodalRuntime) setStage(1, { status: "done", runtime: multimodalRuntime });
      if (theaterScriptId) setStage(2, { status: "done", runtime: theaterRuntime ?? { label: `theater · ${theaterScriptId}` } });

      if (!part1Id) {
        markRunning(0, "part1_submit");
        const part1 = await postJson("/api/part1/submit", { user_id: pending.user_id, answers: pending.answers });
        part1Id = part1.part1_id;
        updatePendingPart1({ checkpoint: { part1_id: part1Id } });
        setStage(0, { status: "done", runtime: { label: `part1 · ${part1Id}` } });
      }

      if (!multimodalRuntime) {
        markRunning(1, "multimodal");
        const multimodal = await postJson("/api/analyze/multimodal", { part1_id: part1Id, runtime_override: pending.runtime_override });
        multimodalRuntime = multimodal.runtime;
        updatePendingPart1({ checkpoint: { multimodal_runtime: multimodalRuntime } });
        setStage(1, { status: "done", runtime: multimodalRuntime });
      }

      if (!theaterScriptId) {
        markRunning(2, "director");
        const theater = await postJson("/api/theater/generate", { part1_id: part1Id, runtime_override: pending.runtime_override });
        theaterScriptId = theater.theater_script_id;
        theaterRuntime = theater.runtime;
        updatePendingPart1({ checkpoint: { theater_script_id: theaterScriptId, theater_runtime: theaterRuntime } });
        setStage(2, { status: "done", runtime: theaterRuntime ?? { label: `theater · ${theaterScriptId}` } });
      }

      markRunning(3, "handoff");
      const now = Date.now();
      const nextSession: BenyuanSessionState = {
        ...(readJson<BenyuanSessionState>(BENYUAN_SESSION_STORAGE_KEY) ?? {}),
        part1_id: part1Id,
        theater_script_id: theaterScriptId,
        runtime_override: pending.runtime_override,
        multimodal_runtime: multimodalRuntime,
        theater_runtime: theaterRuntime,
        part1_started_at: pending.part1_started_at,
        part1_completed_at: pending.submitted_at,
        part1_time: Math.max(0, Math.round((pending.submitted_at - pending.part1_started_at) / 1000)),
        part2_started_at: now,
      };
      writeJson(BENYUAN_SESSION_STORAGE_KEY, nextSession);
      writeJson(BENYUAN_RUNTIME_STORAGE_KEY, pending.runtime_override ?? {});
      clearKey(BENYUAN_PENDING_PART1_KEY);
      clearActiveStage();
      setStage(3, { status: "done", runtime: { label: "handoff ready" } });
      setRunning(false);
      window.setTimeout(() => {
        router.replace(`/theater?part1_id=${encodeURIComponent(part1Id ?? "")}&theater_script_id=${encodeURIComponent(theaterScriptId ?? "")}`);
      }, 700);
    }

    async function runConstellationFlow() {
      const pending = readJson<BenyuanPendingPart2>(BENYUAN_PENDING_PART2_KEY);
      if (!pending) {
        setHeadline("当前没有待继续的 Part 2 处理任务。");
        setBody("请先完成剧场体验并提交选择记录，processing 页面才会沿着真实链路调用分析师 Agent。");
        setStages(buildInitialStages("constellation"));
        setRunning(false);
        setEmptyStateHref("/theater");
        setEmptyStateLabel("前往剧场");
        return;
      }

      setHeadline("正在把剧场轨迹显影成精神星图。");
      setBody("这一步会先把你的行动和镜像选择写回同一条链路，再调用分析师 Agent 生成最终星图；完成后自动跳转。");

      const checkpoint = pending.checkpoint ?? {};
      let part2Id = checkpoint.part2_id;
      let constellationId = checkpoint.constellation_id;
      let constellationRuntime = checkpoint.constellation_runtime;

      if (part2Id) setStage(0, { status: "done", runtime: { label: `part2 · ${part2Id}` } });
      if (constellationId) setStage(1, { status: "done", runtime: constellationRuntime ?? { label: `constellation · ${constellationId}` } });

      if (!part2Id) {
        markRunning(0, "part2_submit");
        const part2 = await postJson("/api/part2/submit", {
          part1_id: pending.part1_id,
          theater_script_id: pending.theater_script_id,
          act2_choices: pending.choice_logs,
          act3_responses: pending.mirror_logs,
          metadata: pending.metadata,
        });
        part2Id = part2.part2_id;
        updatePendingPart2({ checkpoint: { part2_id: part2Id } });
        setStage(0, { status: "done", runtime: { label: `part2 · ${part2Id}` } });
      }

      if (!constellationId) {
        markRunning(1, "analyst");
        const constellation = await postJson("/api/constellation/generate", {
          part1_id: pending.part1_id,
          part2_id: part2Id,
          runtime_override: pending.runtime_override,
        });
        constellationId = constellation.constellation_id;
        constellationRuntime = constellation.runtime;
        updatePendingPart2({ checkpoint: { constellation_id: constellationId, constellation_runtime: constellationRuntime } });
        setStage(1, { status: "done", runtime: constellationRuntime ?? { label: `constellation · ${constellationId}` } });
      }

      markRunning(2, "handoff");
      const nextSession: BenyuanSessionState = {
        ...(readJson<BenyuanSessionState>(BENYUAN_SESSION_STORAGE_KEY) ?? {}),
        part1_id: pending.part1_id,
        theater_script_id: pending.theater_script_id,
        constellation_id: constellationId,
        runtime_override: pending.runtime_override,
        constellation_runtime: constellationRuntime,
      };
      writeJson(BENYUAN_SESSION_STORAGE_KEY, nextSession);
      clearKey(BENYUAN_PENDING_PART2_KEY);
      clearActiveStage();
      setStage(2, { status: "done", runtime: { label: "constellation ready" } });
      setRunning(false);
      window.setTimeout(() => {
        router.replace(`/constellation?constellation_id=${encodeURIComponent(constellationId ?? "")}`);
      }, 700);
    }

    async function run() {
      try {
        setError(null);
        setEmptyStateHref(null);
        setEmptyStateLabel(null);
        if (phase === "part1") {
          await runPart1Flow();
        } else {
          await runConstellationFlow();
        }
      } catch (nextError) {
        if (!active) return;
        const message = nextError instanceof Error ? nextError.message : "processing_failed";
        setError(message);
        setRunning(false);
        setStages((current) => {
          const firstRunning = current.findIndex((item) => item.status === "running");
          if (firstRunning === -1) return current;
          return current.map((item, index) => (index === firstRunning ? { ...item, status: "failed" } : item));
        });
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [phase, router]);

  const progress = useMemo(() => {
    const done = stages.filter((item) => item.status === "done").length;
    const runningStage = stages.some((item) => item.status === "running") ? 0.55 : 0;
    if (emptyStateHref) return 0;
    if (error) return Math.max(14, Math.round((done / stages.length) * 100));
    if (!running) return 100;
    return Math.max(10, Math.min(96, Math.round(((done + runningStage) / stages.length) * 100)));
  }, [emptyStateHref, error, running, stages]);

  const configuredRuntime = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    if (phase === "part1") {
      const pending = readJson<BenyuanPendingPart1>(BENYUAN_PENDING_PART1_KEY);
      return pending?.runtime_override;
    }
    const pending = readJson<BenyuanPendingPart2>(BENYUAN_PENDING_PART2_KEY);
    return pending?.runtime_override;
  }, [phase]);

  const latestRuntime = useMemo(() => {
    return [...stages].reverse().map((stage) => stage.runtime).find(Boolean);
  }, [stages]);

  const activeElapsedSeconds = useMemo(() => {
    if (!activeStageStartedAt) return 0;
    return Math.max(0, Math.round((nowMs - activeStageStartedAt) / 1000));
  }, [activeStageStartedAt, nowMs]);

  const remainingSeconds = useMemo(() => {
    if (emptyStateHref) return 0;
    const activeStage = stages.find((item) => item.status === "running");
    const pendingStages = stages.filter((item) => item.status === "pending");
    const pendingEstimate = pendingStages.reduce((total, stage) => total + stage.estimateSec, 0);
    if (!activeStage || !activeStageStartedAt) return pendingEstimate;
    return Math.max(0, activeStage.estimateSec - activeElapsedSeconds) + pendingEstimate;
  }, [activeElapsedSeconds, activeStageStartedAt, emptyStateHref, stages]);

  return (
    <div className="grid gap-6">
      <GlassPanel className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),rgba(0,0,0,0.96)_62%)]">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute right-[-8%] top-[-18%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.18),transparent_66%)] blur-3xl"
          animate={{ opacity: [0.26, 0.42, 0.26], scale: [0.98, 1.06, 0.98] }}
          transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <SectionTitle label={phase === "part1" ? "Part 1 → Part 2" : "Part 2 → Part 3"} title={headline} description={body} />
        <div className="flex flex-wrap gap-2">
          <MetaPill>{phase === "part1" ? "collect → multimodal → director" : "part2 → analyst → constellation"}</MetaPill>
          <MetaPill>{progress}%</MetaPill>
          {running ? <MetaPill>处理中</MetaPill> : <MetaPill>{emptyStateHref ? "等待开始" : error ? "已中断" : "即将跳转"}</MetaPill>}
          {resumedFromCheckpoint ? <MetaPill>已从检查点恢复</MetaPill> : null}
          <MetaPill><Clock3 className="mr-1 inline h-3 w-3" />{emptyStateHref ? "等待任务进入" : `预计剩余 ${formatSeconds(remainingSeconds)}`}</MetaPill>
          {running && activeStageStartedAt ? <MetaPill>本阶段已运行 {formatSeconds(activeElapsedSeconds)}</MetaPill> : null}
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-[linear-gradient(90deg,rgba(212,175,55,0.2),rgba(212,175,55,1))]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <GlassPanel>
          <SectionTitle label="链路阶段" title="现在系统真实走到哪一步，你可以直接看到。" description="这不是静止 loading，而是按阶段推进的真实链路显影。" />
          <div className="grid gap-3 md:grid-cols-2">
            {stages.map((stage, index) => (
              <motion.div
                key={stage.key}
                className={`border p-5 ${cardTone(stage.status)}`}
                animate={stage.status === "running" ? { y: [0, -4, 0], opacity: [0.84, 1, 0.84] } : { y: 0, opacity: 1 }}
                transition={{ duration: 2.6, repeat: stage.status === "running" ? Number.POSITIVE_INFINITY : 0, ease: "easeInOut" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">stage {index + 1}</p>
                  <span className={`h-2.5 w-2.5 rounded-full ${statusTone(stage.status)}`} />
                </div>
                <p className="mt-3 text-lg text-[var(--text-primary)]">{stage.title}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{stage.detail}</p>
                {stage.status === "running" && activeStageStartedAt ? (
                  <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    已运行 {formatSeconds(activeElapsedSeconds)} / 预计 {formatSeconds(stage.estimateSec)}
                  </p>
                ) : null}
                {runtimeLabel(stage.runtime) ? <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{runtimeLabel(stage.runtime)}</p> : null}
                {runtimeRequestId(stage.runtime) ? <p className="mt-2 break-all text-xs text-[var(--text-tertiary)]">request_id: {runtimeRequestId(stage.runtime)}</p> : null}
              </motion.div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <SectionTitle label="当前状态" title={emptyStateHref ? "当前还没有待处理任务。" : error ? "这次处理中断了。" : running ? "这条链路正在稳定显影。" : "已经准备跳转。"} />
          <div className="space-y-4 text-sm leading-7 text-[var(--text-secondary)]">
            <p>
              {error
                ? "你的输入没有丢。刷新页面后会从已完成阶段继续，而不是整条链路从头重跑。"
                : emptyStateHref
                  ? "一旦你从上一页提交新的任务，这里就会沿着同一条真实链路开始显影。"
                  : phase === "part1"
                    ? "处理完成后会直接带着 theater_script 进入剧场，并保留运行时与时间信息。"
                    : "处理完成后会直接打开精神星图页，并把本次分析运行时一起带过去。"}
            </p>
            <div className="border border-[var(--border)] bg-[rgba(255,255,255,0.012)] p-4">
              <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-tertiary)]">当前运行时</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {runtimeLabel(latestRuntime) ? <MetaPill>{runtimeLabel(latestRuntime)}</MetaPill> : configuredRuntime?.provider_name || configuredRuntime?.model ? <MetaPill>{[configuredRuntime?.provider_name ?? "provider", configuredRuntime?.model ?? "model"].join(" · ")}</MetaPill> : <MetaPill>等待 provider 返回</MetaPill>}
                {runtimeRequestId(latestRuntime) ? <MetaPill>{runtimeRequestId(latestRuntime)}</MetaPill> : null}
              </div>
            </div>
            <div className="border border-[var(--border)] bg-[rgba(255,255,255,0.012)] p-4">
              <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--text-tertiary)]">续跑策略</p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                当前阶段与已完成结果会写进本地缓存。即使刷新，只要 pending 数据还在，系统就会直接从下一步继续跑。
                {resumedFromCheckpoint ? " 你现在看到的就是一次从检查点恢复后的续跑。" : ""}
              </p>
            </div>
            {error ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-5 py-3 text-sm tracking-[0.16em] text-black uppercase transition hover:shadow-[0_0_24px_var(--glow)]"
              >
                <RefreshCcw className="h-4 w-4" strokeWidth={1.5} />
                重试当前阶段
              </button>
            ) : emptyStateHref ? (
              <button
                type="button"
                onClick={() => router.push(emptyStateHref)}
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-5 py-3 text-sm tracking-[0.16em] text-black uppercase transition hover:shadow-[0_0_24px_var(--glow)]"
              >
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                {emptyStateLabel ?? "返回上一步"}
              </button>
            ) : (
              <div className="inline-flex min-h-11 items-center gap-2 border border-[var(--border)] bg-[rgba(255,255,255,0.015)] px-4 py-3 text-sm text-[var(--text-primary)]">
                <Sparkles className="h-4 w-4" strokeWidth={1.4} />
                {running ? "这条链路正在推进" : "正在为你打开下一幕"}
                <ArrowRight className="h-4 w-4" strokeWidth={1.4} />
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

export function BenyuanProcessingRitual() {
  const searchParams = useSearchParams();
  const [attempt, setAttempt] = useState(0);
  const phase = (searchParams.get("phase") === "constellation" ? "constellation" : "part1") as RitualPhase;

  return <RitualRunner key={`${phase}-${attempt}`} phase={phase} onRetry={() => setAttempt((value) => value + 1)} />;
}
