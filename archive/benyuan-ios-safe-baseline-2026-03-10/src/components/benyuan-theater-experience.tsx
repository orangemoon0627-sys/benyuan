"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassPanel, MetaPill, SectionTitle } from "@/components/framework-primitives";
import {
  BENYUAN_PENDING_PART2_KEY,
  BENYUAN_RUNTIME_STORAGE_KEY,
  BENYUAN_SESSION_STORAGE_KEY,
  type BenyuanPendingPart2,
  type BenyuanSessionState,
} from "@/lib/benyuan-v3-client-session";
import type { AgentRuntimeOverride, Part2ChoiceRecord, Part2MirrorRecord, TheaterScriptRecord } from "@/lib/benyuan-v3-types";

const phaseMeta = [
  { id: "act1", label: "第一幕", title: "沉浸式场景" },
  { id: "act2", label: "第二幕", title: "选择分支" },
  { id: "act3", label: "第三幕", title: "镜像对话" },
  { id: "epilogue", label: "尾声", title: "回归现实" },
] as const;

type PhaseId = (typeof phaseMeta)[number]["id"];

function currentTimestamp() {
  return Date.now();
}

function getPhaseIndex(phase: PhaseId) {
  return phaseMeta.findIndex((item) => item.id === phase);
}

export function BenyuanTheaterExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<TheaterScriptRecord | null>(null);
  const [phase, setPhase] = useState<PhaseId>("act1");
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [hoverSequence, setHoverSequence] = useState<string[]>([]);
  const [choiceLogs, setChoiceLogs] = useState<Part2ChoiceRecord[]>([]);
  const [mirrorLogs, setMirrorLogs] = useState<Part2MirrorRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const interactionStartedAtRef = useRef(0);
  const phaseStartedAtRef = useRef(0);
  const phaseDurationsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadTheater() {
      const fromQuery = {
        part1_id: searchParams.get("part1_id"),
        theater_script_id: searchParams.get("theater_script_id"),
      };
      const fromStorage = (() => {
        try {
          const raw = window.localStorage.getItem(BENYUAN_SESSION_STORAGE_KEY);
          return raw ? (JSON.parse(raw) as BenyuanSessionState) : {};
        } catch {
          return {};
        }
      })();
      const theaterScriptId = fromQuery.theater_script_id ?? fromStorage.theater_script_id;
      if (!theaterScriptId) {
        await Promise.resolve();
        if (!cancelled) setLoading(false);
        return;
      }

      const response = await fetch(`/api/theater/${encodeURIComponent(theaterScriptId)}`);
      const data = (await response.json()) as TheaterScriptRecord;
      if (cancelled) return;

      const now = currentTimestamp();
      const nextSession: BenyuanSessionState = {
        ...fromStorage,
        part1_id: fromQuery.part1_id ?? fromStorage.part1_id ?? data.part1_id,
        theater_script_id: theaterScriptId,
        part2_started_at: fromStorage.part2_started_at ?? now,
      };
      window.localStorage.setItem(BENYUAN_SESSION_STORAGE_KEY, JSON.stringify(nextSession));

      setRecord(data);
      interactionStartedAtRef.current = now;
      phaseStartedAtRef.current = now;
      setLoading(false);
    }

    void loadTheater();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const currentChoice = useMemo(() => record?.theater_script.act2.choices[choiceIndex] ?? null, [choiceIndex, record]);
  const currentQuestion = useMemo(() => record?.theater_script.act3.mirror_questions[questionIndex] ?? null, [questionIndex, record]);
  const phaseIndex = getPhaseIndex(phase);
  const act2Progress = record ? `${choiceIndex + 1} / ${record.theater_script.act2.choices.length}` : "-";
  const act3Progress = record ? `${questionIndex + 1} / ${record.theater_script.act3.mirror_questions.length}` : "-";

  function resetInteractionTimer() {
    interactionStartedAtRef.current = currentTimestamp();
    setHoverSequence([]);
  }

  function transitionTo(nextPhase: Exclude<PhaseId, "act1">) {
    const now = currentTimestamp();
    phaseDurationsRef.current[phase] = Number(((now - phaseStartedAtRef.current) / 1000).toFixed(1));
    phaseStartedAtRef.current = now;
    interactionStartedAtRef.current = now;
    setHoverSequence([]);
    setPhase(nextPhase);
  }

  function advanceFromAct1() {
    transitionTo("act2");
  }

  function chooseAct2(optionId: string) {
    if (!currentChoice || selectedChoiceId) return;
    setSelectedChoiceId(optionId);
    const hesitation = (currentTimestamp() - interactionStartedAtRef.current) / 1000;
    setChoiceLogs((current) => [
      ...current,
      {
        choice_id: currentChoice.choice_id,
        selected: optionId,
        hesitation_time: Number(hesitation.toFixed(1)),
        hover_sequence: hoverSequence,
        timestamp: new Date().toISOString(),
      },
    ]);

    window.setTimeout(() => {
      setSelectedChoiceId(null);
      if (record && choiceIndex < record.theater_script.act2.choices.length - 1) {
        setChoiceIndex((current) => current + 1);
        resetInteractionTimer();
        return;
      }
      transitionTo("act3");
    }, 1200);
  }

  function chooseAct3(optionId: string) {
    if (!currentQuestion) return;
    const hesitation = (currentTimestamp() - interactionStartedAtRef.current) / 1000;
    setMirrorLogs((current) => [
      ...current,
      {
        question_id: currentQuestion.question_id,
        selected: optionId,
        hesitation_time: Number(hesitation.toFixed(1)),
        timestamp: new Date().toISOString(),
      },
    ]);

    if (record && questionIndex < record.theater_script.act3.mirror_questions.length - 1) {
      setQuestionIndex((current) => current + 1);
      resetInteractionTimer();
      return;
    }

    transitionTo("epilogue");
  }

  async function finishJourney() {
    if (!record) return;
    setSubmitting(true);
    setStatus("正在提交剧场选择并生成精神星图...");
    try {
      const now = currentTimestamp();
      phaseDurationsRef.current.epilogue = Number(((now - phaseStartedAtRef.current) / 1000).toFixed(1));

      const sessionRaw = window.localStorage.getItem(BENYUAN_SESSION_STORAGE_KEY);
      const runtimeRaw = window.localStorage.getItem(BENYUAN_RUNTIME_STORAGE_KEY);
      const session = sessionRaw ? (JSON.parse(sessionRaw) as BenyuanSessionState) : {};
      const runtime = runtimeRaw ? (JSON.parse(runtimeRaw) as AgentRuntimeOverride) : undefined;

      const part1StartedAt = session.part1_started_at ?? now;
      const part1CompletedAt = session.part1_completed_at ?? part1StartedAt;
      const part2StartedAt = session.part2_started_at ?? part1CompletedAt;
      const metadata = {
        total_time: Math.max(0, Math.round((now - part1StartedAt) / 1000)),
        part1_time: session.part1_time ?? Math.max(0, Math.round((part1CompletedAt - part1StartedAt) / 1000)),
        part2_time: Math.max(0, Math.round((now - part2StartedAt) / 1000)),
        device: window.innerWidth < 768 ? "mobile" : "web",
        phase_durations: phaseDurationsRef.current,
        hover_totals: {
          act2: choiceLogs.reduce((total, item) => total + (item.hover_sequence?.length ?? 0), 0),
          act3: 0,
        },
        hesitation_patterns: [
          ...choiceLogs.map((item) => ({
            phase: "act2",
            node_id: item.choice_id,
            hesitation_time: item.hesitation_time,
            hover_count: item.hover_sequence?.length ?? 0,
            selected: item.selected,
          })),
          ...mirrorLogs.map((item) => ({
            phase: "act3",
            node_id: item.question_id,
            hesitation_time: item.hesitation_time,
            selected: item.selected,
          })),
        ],
      };

      const pending: BenyuanPendingPart2 = {
        part1_id: session.part1_id ?? record.part1_id,
        theater_script_id: session.theater_script_id ?? record.theater_script_id,
        runtime_override: runtime,
        choice_logs: choiceLogs,
        mirror_logs: mirrorLogs,
        metadata,
      };

      window.localStorage.setItem(BENYUAN_PENDING_PART2_KEY, JSON.stringify(pending));
      router.push("/processing/benyuan?phase=constellation");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "生成失败");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <GlassPanel>
        <SectionTitle label="Loading" title="正在调入你的剧场脚本..." />
      </GlassPanel>
    );
  }

  if (!record) {
    return (
      <GlassPanel>
        <SectionTitle label="No Script" title="还没有可体验的剧场脚本。" description="先去 Part 1 完成输入，系统生成 theater_script 后再回来。" />
      </GlassPanel>
    );
  }

  return (
    <div className="grid gap-6">
      <GlassPanel className="overflow-hidden bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.1),rgba(0,0,0,0.96)_58%)]">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.38em] text-[var(--text-tertiary)]">Theater Runtime</p>
            <h2 className="mt-4 text-[2rem] leading-[1.06] text-[var(--text-primary)] md:text-[3rem]">你的故事已经成形，现在进入剧场。</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] md:text-base">
              导演 Agent 会把你的审美、哲学和生命线索折叠成一段可体验的戏剧路径；系统会同步记录你的选择、迟疑与停顿。
            </p>
          </div>
          <div className="grid gap-2 text-sm text-[var(--text-secondary)] md:text-right">
            <p>原型线索 · {record.theater_script.personalization_summary.core_archetype}</p>
            <p>情绪基调 · {record.theater_script.personalization_summary.emotional_tone}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {phaseMeta.map((item, index) => {
            const active = item.id === phase;
            const complete = index < phaseIndex;
            return (
              <div
                key={item.id}
                className={`border px-4 py-4 transition ${active ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.08)] shadow-[0_0_26px_var(--glow)]" : complete ? "border-[rgba(212,175,55,0.22)] bg-[rgba(212,175,55,0.03)]" : "border-[var(--border)] bg-[rgba(255,255,255,0.012)]"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-tertiary)]">0{index + 1}</span>
                  <span className={`h-2 w-2 rounded-full ${active || complete ? "bg-[var(--accent-gold)]" : "bg-[rgba(255,255,255,0.12)]"}`} />
                </div>
                <p className="mt-5 text-base text-[var(--text-primary)]">{item.label}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.title}</p>
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {phase === "act1" ? (
        <GlassPanel className="min-h-[72vh] overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.1),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.008))]">
          <div className="grid min-h-[62vh] gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
            <div className="flex flex-col justify-between gap-6 border border-[var(--border)] bg-[rgba(255,255,255,0.012)] p-6 md:p-8">
              <div>
                <p className="text-[11px] uppercase tracking-[0.38em] text-[var(--text-tertiary)]">第一幕 / Act 1</p>
                <h3 className="mt-5 text-[2.2rem] leading-[1.08] text-[var(--text-primary)] md:text-[3.4rem]">沉浸式场景</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <MetaPill>{record.theater_script.personalization_summary.aesthetic_style}</MetaPill>
                <MetaPill>{record.theater_script.act1.ambient_sound}</MetaPill>
                <MetaPill>{record.theater_script.act1.duration}s</MetaPill>
              </div>
              <div className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
                <p>核心主题</p>
                <div className="flex flex-wrap gap-2">
                  {record.theater_script.personalization_summary.key_themes.map((theme) => (
                    <MetaPill key={theme}>{theme}</MetaPill>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative flex min-h-[28rem] flex-col justify-end border border-[rgba(212,175,55,0.22)] bg-[linear-gradient(180deg,rgba(0,0,0,0.34),rgba(0,0,0,0.82))] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] md:p-10">
              <div className="pointer-events-none absolute inset-x-10 top-10 h-px bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.4),transparent)]" />
              <p className="max-w-3xl text-xl font-light leading-[2.1] text-[var(--text-primary)] md:text-[1.6rem]">
                {record.theater_script.act1.scene_description}
              </p>
              <p className="mt-8 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">视觉生成提示词：{record.theater_script.act1.visual_prompt}</p>
              <div className="mt-10 flex justify-end">
                <button
                  type="button"
                  onClick={advanceFromAct1}
                  className="inline-flex min-h-11 items-center justify-center border border-[var(--accent-gold)] px-6 py-4 text-sm text-[var(--accent-gold)] transition hover:bg-[rgba(212,175,55,0.08)] hover:text-[var(--text-primary)]"
                >
                  继续进入选择 →
                </button>
              </div>
            </div>
          </div>
        </GlassPanel>
      ) : null}

      {phase === "act2" && currentChoice ? (
        <GlassPanel className="min-h-[72vh] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.08),transparent_20%)]">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[11px] uppercase tracking-[0.38em] text-[var(--text-tertiary)]">第二幕 / Choice {act2Progress}</p>
            <h3 className="mt-5 text-[2rem] leading-[1.1] text-[var(--text-primary)] md:text-[3rem]">迷雾中的分支正向你展开。</h3>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[var(--text-secondary)]">{currentChoice.scene}</p>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-4">
            {currentChoice.options.map((option, index) => {
              const active = selectedChoiceId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onMouseEnter={() => setHoverSequence((current) => [...current, option.id])}
                  onClick={() => chooseAct2(option.id)}
                  disabled={Boolean(selectedChoiceId)}
                  className={`group relative overflow-hidden border px-6 py-6 text-left transition ${active ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.1)] shadow-[0_0_28px_var(--glow)]" : "border-[var(--border)] bg-[rgba(255,255,255,0.012)] hover:translate-x-1 hover:border-[rgba(212,175,55,0.35)] hover:bg-[rgba(212,175,55,0.04)]"}`}
                >
                  <div className="flex items-start gap-5">
                    <span className="mt-1 text-[11px] uppercase tracking-[0.3em] text-[var(--text-tertiary)]">0{index + 1}</span>
                    <div className="flex-1">
                      <p className="text-base leading-8 text-[var(--text-primary)]">{option.text}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.25em] text-[var(--text-tertiary)]">{option.trait_signal}</p>
                      {active ? <p className="mt-5 text-sm leading-7 text-[var(--text-secondary)]">{option.response}</p> : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassPanel>
      ) : null}

      {phase === "act3" && currentQuestion ? (
        <GlassPanel className="min-h-[72vh] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.08),transparent_18%)]">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <span className="text-[2.6rem] leading-none text-[var(--accent-gold)]">◆</span>
            <p className="mt-6 text-[11px] uppercase tracking-[0.38em] text-[var(--text-tertiary)]">第三幕 / Mirror {act3Progress}</p>
            <h3 className="mt-5 text-[1.9rem] leading-[1.14] text-[var(--text-primary)] md:text-[2.9rem]">{currentQuestion.question}</h3>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">{record.theater_script.act3.scene_description}</p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.05)] px-6 py-5 text-center text-base leading-8 text-[var(--text-primary)]">
            {currentQuestion.dialogue}
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-7 text-[var(--text-secondary)]">{record.theater_script.act3.mirror_final_words}</p>

          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                onClick={() => chooseAct3(option.id)}
                className="block min-h-11 w-full border border-[var(--border)] bg-[rgba(255,255,255,0.012)] px-5 py-5 text-left transition hover:translate-x-1 hover:border-[rgba(212,175,55,0.35)] hover:bg-[rgba(212,175,55,0.04)]"
              >
                <div className="flex items-start gap-5">
                  <span className="mt-1 text-[11px] uppercase tracking-[0.3em] text-[var(--text-tertiary)]">0{index + 1}</span>
                  <div>
                    <p className="text-base leading-8 text-[var(--text-primary)]">{option.text}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.25em] text-[var(--text-tertiary)]">{option.trait_signal}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </GlassPanel>
      ) : null}

      {phase === "epilogue" ? (
        <GlassPanel className="min-h-[68vh] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),rgba(0,0,0,0.96)_58%)]">
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-8 text-center">
            <p className="text-[11px] uppercase tracking-[0.38em] text-[var(--text-tertiary)]">尾声 / Epilogue</p>
            <h3 className="mt-6 text-[2rem] leading-[1.1] text-[var(--text-primary)] md:text-[3.2rem]">你的旅程结束了，但理解才刚刚开始。</h3>
            <p className="mt-8 text-lg leading-10 text-[var(--text-primary)]">{record.theater_script.epilogue.scene_description}</p>
            <p className="mt-6 text-base leading-8 text-[var(--text-secondary)]">{record.theater_script.epilogue.closing_text}</p>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--text-tertiary)]">{record.theater_script.epilogue.transition_prompt}</p>
            <button
              type="button"
              onClick={finishJourney}
              disabled={submitting}
              className="mt-12 inline-flex min-h-11 items-center justify-center border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-6 py-4 text-sm text-black transition hover:shadow-[0_0_24px_var(--glow)] disabled:opacity-60"
            >
              {submitting ? "正在绘制你的精神星图..." : "生成精神星图"}
            </button>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">{status || "会同步提交选择记录、hover 轨迹与阶段耗时。"}</p>
          </div>
        </GlassPanel>
      ) : null}
    </div>
  );
}
