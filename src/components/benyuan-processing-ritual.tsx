"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { ImmersivePassiveState, PrimaryButton, SecondaryButton } from "@/components/framework-primitives";
import { buildProcessingPresentation } from "@/lib/benyuan-mainflow-presentation";
import {
  BENYUAN_PENDING_PART1_KEY,
  BENYUAN_PENDING_PART2_KEY,
  BENYUAN_RUNTIME_STORAGE_KEY,
  BENYUAN_SESSION_STORAGE_KEY,
  type BenyuanPendingPart1,
  type BenyuanPendingPart2,
  type BenyuanSessionState,
} from "@/lib/benyuan-v3-client-session";

const stageLabels = {
  part1: [
    { key: "part1_submit", title: "收束线索", detail: "正在把你的回答合拢。", estimateSec: 6 },
    { key: "multimodal", title: "解析光谱", detail: "审美线索正在显出纹理。", estimateSec: 90 },
    { key: "director", title: "构建剧场", detail: "正在把你的线索折成一幕剧场。", estimateSec: 95 },
    { key: "handoff", title: "剧场就位", detail: "下一幕正在靠近。", estimateSec: 4 },
  ],
  constellation: [
    { key: "part2_submit", title: "记录选择", detail: "正在收束你的剧场轨迹。", estimateSec: 6 },
    { key: "analyst", title: "折成星图", detail: "星图正在从暗处浮现。", estimateSec: 120 },
    { key: "handoff", title: "原型显形", detail: "准备进入结果页。", estimateSec: 4 },
  ],
} as const;

type RitualPhase = keyof typeof stageLabels;
type StageStatus = "pending" | "running" | "done" | "failed";
type StageRuntime = { label?: string; provider?: string; model?: string; mode?: string; request_id?: string; error?: string };

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

function readActiveStageStartedAt(phase: RitualPhase) {
  if (typeof window === "undefined") return null;
  if (phase === "part1") {
    return readJson<BenyuanPendingPart1>(BENYUAN_PENDING_PART1_KEY)?.checkpoint?.active_stage_started_at ?? null;
  }
  return readJson<BenyuanPendingPart2>(BENYUAN_PENDING_PART2_KEY)?.checkpoint?.active_stage_started_at ?? null;
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
  const [stageClock, setStageClock] = useState(() => Date.now());
  const [activeStageStartedAt, setActiveStageStartedAt] = useState<number | null>(() => readActiveStageStartedAt(phase));
  const [headline, setHeadline] = useState(phase === "part1" ? "正在把你的输入折叠成下一幕。" : "正在把这段旅程显影成星图。");
  const [body, setBody] = useState(
    phase === "part1"
      ? "完成后会自动进入剧场。"
      : "完成后会自动进入结果页。",
  );
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const [emptyStateHref, setEmptyStateHref] = useState<string | null>(null);
  const [emptyStateLabel, setEmptyStateLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!running || activeStageStartedAt === null) return;
    const timer = window.setInterval(() => setStageClock(Date.now()), 900);
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
      setStageClock(startedAt);
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
        setHeadline("当前还没有待继续的显影任务。");
        setBody("先回到特征收集页。");
        setStages(buildInitialStages("part1"));
        setRunning(false);
        setEmptyStateHref("/collect");
        setEmptyStateLabel("回到当前问题");
        return;
      }

      setHeadline("正在把你的输入折叠成剧场入口。");
      setBody("完成后会自动进入下一幕。");

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
        setHeadline("当前还没有待继续的星图任务。");
        setBody("先回到剧场。");
        setStages(buildInitialStages("constellation"));
        setRunning(false);
        setEmptyStateHref("/theater");
        setEmptyStateLabel("前往剧场");
        return;
      }

      setHeadline("正在把剧场轨迹显影成精神星图。");
      setBody("完成后会自动打开星图。");

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
    const runningStage = stages.find((item) => item.status === "running");
    if (emptyStateHref) return 0;
    if (error) return Math.max(14, Math.round((done / stages.length) * 100));
    if (!running) return 100;
    if (!runningStage) return Math.max(10, Math.min(96, Math.round((done / stages.length) * 100)));

    const elapsedMs = activeStageStartedAt ? Math.max(0, stageClock - activeStageStartedAt) : 0;
    const estimatedMs = Math.max((runningStage.estimateSec ?? 1) * 1000, 1);
    const stageFraction = activeStageStartedAt ? Math.max(0.16, Math.min(0.82, (elapsedMs / estimatedMs) * 0.82)) : 0.38;

    return Math.max(10, Math.min(96, Math.round(((done + stageFraction) / stages.length) * 100)));
  }, [activeStageStartedAt, emptyStateHref, error, running, stageClock, stages]);

  const activeStage = stages.find((item) => item.status === "running") ?? stages.find((item) => item.status === "failed") ?? stages[stages.length - 1];
  const visibleStageTitle = emptyStateHref ? "等待" : activeStage?.title ?? headline;
  const visibleStageDetail = emptyStateHref ? undefined : activeStage?.detail ?? body;
  const doneCount = stages.filter((item) => item.status === "done").length;
  const presentation = buildProcessingPresentation({
    phase,
    kind: emptyStateHref ? "empty" : error ? "error" : running ? "running" : "complete",
    progress,
    doneCount,
    totalCount: stages.length,
    activeStageTitle: visibleStageTitle,
    activeStageDetail: visibleStageDetail,
    errorMessage: error ?? undefined,
  });

  return (
    <ImmersivePassiveState
      backHref={presentation.backHref}
      topProgressValue={presentation.progress}
      eyebrow={presentation.eyebrow}
      title={presentation.title}
      description={presentation.description}
      actions={
        error ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton type="button" onClick={onRetry} className="min-h-12 gap-2 px-6 py-3 text-sm">
              <RefreshCcw className="h-4 w-4" strokeWidth={1.5} />
              重试当前阶段
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => router.push(phase === "part1" ? "/collect" : "/theater")} className="min-h-12 px-6 py-3 text-sm">
              回到上一步
            </SecondaryButton>
          </div>
        ) : emptyStateHref ? (
          <PrimaryButton type="button" onClick={() => router.push(emptyStateHref)} className="min-h-12 gap-2 px-6 py-3 text-sm">
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            {emptyStateLabel ?? "返回上一步"}
          </PrimaryButton>
        ) : null
      }
    />
  );
}

export function BenyuanProcessingRitual() {
  const searchParams = useSearchParams();
  const [attempt, setAttempt] = useState(0);
  const phase = (searchParams.get("phase") === "constellation" ? "constellation" : "part1") as RitualPhase;

  return <RitualRunner key={`${phase}-${attempt}`} phase={phase} onRetry={() => setAttempt((value) => value + 1)} />;
}
