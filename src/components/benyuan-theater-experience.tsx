"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassPanel, ImmersivePassiveState, ImmersiveSigil, PrimaryButton } from "@/components/framework-primitives";
import { benyuanUiRecipes, cx } from "@/config/benyuan-ui-recipes";
import {
  BENYUAN_PENDING_PART2_KEY,
  BENYUAN_RUNTIME_STORAGE_KEY,
  BENYUAN_SESSION_STORAGE_KEY,
  type BenyuanPendingPart2,
  type BenyuanSessionState,
} from "@/lib/benyuan-v3-client-session";
import type { AgentRuntimeOverride, Part2ChoiceRecord, TheaterScriptRecord } from "@/lib/benyuan-v3-types";

type PhaseId = "act1" | "act2";

function currentTimestamp() {
  return Date.now();
}

function visualUnits(text: string) {
  return Array.from(text.replace(/\s+/g, "").trim()).reduce((total, char) => total + (/[\u0000-\u00ff]/.test(char) ? 0.58 : 1), 0);
}

function act1SceneClass(scene: string) {
  const units = visualUnits(scene);
  if (units > 56) {
    return "max-h-[40vh] overflow-y-auto pr-2 text-[1.42rem] font-black leading-[1.16] tracking-[0em] md:max-h-[42vh] md:text-[2.2rem] md:leading-[1.06]";
  }
  if (units > 36) {
    return "text-[1.7rem] font-black leading-[1.1] tracking-[0em] md:text-[2.6rem] md:leading-[1.03]";
  }
  return "text-[2.04rem] font-black leading-[1.02] tracking-[0em] md:text-[3.05rem] md:leading-[0.98]";
}

function theaterHeadingClass(text: string) {
  const units = visualUnits(text);
  if (units > 34) {
    return "text-[1.48rem] font-black leading-[1.14] tracking-[0em] md:text-[2.36rem] md:leading-[1.06]";
  }
  if (units > 22) {
    return "text-[1.74rem] font-black leading-[1.08] tracking-[0em] md:text-[2.72rem] md:leading-[1.01]";
  }
  return "text-[1.98rem] font-black leading-[1.03] tracking-[0em] md:text-[3.12rem] md:leading-[0.96]";
}

function optionIndexLabel(index: number) {
  return String.fromCharCode(65 + index);
}

function splitAct1Scene(scene: string) {
  const normalized = scene.trim();
  if (normalized.length <= 64) return { lead: normalized, tail: "" };

  const separators = ["。", "！", "？", "；"];
  for (const separator of separators) {
    const index = normalized.indexOf(separator);
    if (index >= 16 && index <= 48) {
      return {
        lead: normalized.slice(0, index + 1).trim(),
        tail: normalized.slice(index + 1).trim(),
      };
    }
  }

  const fallbackIndex = Math.min(46, normalized.length);
  return {
    lead: `${normalized.slice(0, fallbackIndex).trim()}……`,
    tail: normalized.slice(fallbackIndex).trim(),
  };
}

function shortSceneLine(text: string, maxLength = 52) {
  const normalized = text.trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;

  const separators = ["。", "！", "？", "；"];
  for (const separator of separators) {
    const index = normalized.indexOf(separator);
    if (index >= 18 && index <= maxLength) {
      return normalized.slice(0, index + 1).trim();
    }
  }

  return `${normalized.slice(0, maxLength).trim()}……`;
}

export function BenyuanTheaterExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<TheaterScriptRecord | null>(null);
  const [phase, setPhase] = useState<PhaseId>("act1");
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [hoverSequence, setHoverSequence] = useState<string[]>([]);
  const [choiceLogs, setChoiceLogs] = useState<Part2ChoiceRecord[]>([]);
  const [completedChoiceLogs, setCompletedChoiceLogs] = useState<Part2ChoiceRecord[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [act1Expanded, setAct1Expanded] = useState(false);
  const interactionStartedAtRef = useRef(0);
  const phaseStartedAtRef = useRef(0);
  const phaseDurationsRef = useRef<Record<string, number>>({});
  const advanceChoiceTimerRef = useRef<number | null>(null);

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
      setAct1Expanded(false);
      setChoiceIndex(0);
      setSelectedChoiceId(null);
      setChoiceLogs([]);
      setCompletedChoiceLogs(null);
      interactionStartedAtRef.current = now;
      phaseStartedAtRef.current = now;
      setLoading(false);
    }

    void loadTheater();
    return () => {
      cancelled = true;
      if (advanceChoiceTimerRef.current) {
        window.clearTimeout(advanceChoiceTimerRef.current);
      }
    };
  }, [searchParams]);

  const visibleChoices = useMemo(() => record?.theater_script.act2.choices.slice(0, 4) ?? [], [record]);
  const requiredChoiceCount = visibleChoices.length;
  const currentChoice = useMemo(() => visibleChoices[choiceIndex] ?? null, [visibleChoices, choiceIndex]);
  const act1Scene = useMemo(() => splitAct1Scene(record?.theater_script.act1.scene_description ?? ""), [record]);
  const act2SceneLine = useMemo(() => shortSceneLine(currentChoice?.scene ?? "", 30), [currentChoice]);

  function resetInteractionTimer() {
    interactionStartedAtRef.current = currentTimestamp();
    setHoverSequence([]);
  }

  function transitionTo(nextPhase: "act2") {
    const now = currentTimestamp();
    phaseDurationsRef.current[phase] = Number(((now - phaseStartedAtRef.current) / 1000).toFixed(1));
    phaseStartedAtRef.current = now;
    interactionStartedAtRef.current = now;
    setHoverSequence([]);
    setPhase(nextPhase);
    setChoiceIndex(0);
    setSelectedChoiceId(null);
    setChoiceLogs([]);
    setCompletedChoiceLogs(null);
    setStatus("");
  }

  function advanceFromAct1() {
    transitionTo("act2");
  }

  function chooseAct2(optionId: string) {
    if (!currentChoice || selectedChoiceId || submitting || choiceLogs.length !== choiceIndex) return;
    setSelectedChoiceId(optionId);
    setStatus("");
    const hesitation = (currentTimestamp() - interactionStartedAtRef.current) / 1000;
    const nextChoiceLogs = [
      ...choiceLogs,
      {
        choice_id: currentChoice.choice_id,
        selected: optionId,
        hesitation_time: Number(hesitation.toFixed(1)),
        hover_sequence: hoverSequence,
        timestamp: new Date().toISOString(),
      },
    ];
    setChoiceLogs(nextChoiceLogs);

    if (nextChoiceLogs.length >= requiredChoiceCount) {
      setCompletedChoiceLogs(nextChoiceLogs);
      return;
    }

    advanceChoiceTimerRef.current = window.setTimeout(() => {
      setChoiceIndex(nextChoiceLogs.length);
      setSelectedChoiceId(null);
      resetInteractionTimer();
      advanceChoiceTimerRef.current = null;
    }, 520);
  }

  async function finishJourney(finalChoiceLogs: Part2ChoiceRecord[] = choiceLogs) {
    if (!record) return;
    if (finalChoiceLogs.length < requiredChoiceCount) {
      setStatus("还有一轮剧场选择没有完成。");
      return;
    }
    setSubmitting(true);
    setStatus("正在让星图显形。");
    try {
      const now = currentTimestamp();
      phaseDurationsRef.current[phase] = Number(((now - phaseStartedAtRef.current) / 1000).toFixed(1));

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
          act2: finalChoiceLogs.reduce((total, item) => total + (item.hover_sequence?.length ?? 0), 0),
        },
        hesitation_patterns: finalChoiceLogs.map((item, index) => ({
          phase: "act2",
          node_id: item.choice_id,
          round_index: index,
          hesitation_time: item.hesitation_time,
          hover_count: item.hover_sequence?.length ?? 0,
          selected: item.selected,
        })),
      };

      const pending: BenyuanPendingPart2 = {
        part1_id: session.part1_id ?? record.part1_id,
        theater_script_id: session.theater_script_id ?? record.theater_script_id,
        runtime_override: runtime,
        choice_logs: finalChoiceLogs,
        mirror_logs: [],
        metadata,
      };

      window.localStorage.setItem(BENYUAN_PENDING_PART2_KEY, JSON.stringify(pending));
      router.push("/processing/benyuan?phase=constellation");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "这一页暂时没有抵达。");
      setSubmitting(false);
      setSelectedChoiceId(null);
    }
  }

  if (loading) {
    return (
      <ImmersivePassiveState
        backHref="/collect"
        topProgressValue={24}
        eyebrow="剧场装载"
        title="剧场就位"
        description="场景一旦抵达，就直接进入这一幕。"
      />
    );
  }

  if (!record) {
    return (
      <ImmersivePassiveState
        backHref="/collect"
        topProgressValue={0}
        eyebrow="暂无剧场"
        title="等待剧场"
        description="先完成当前输入，再回来进入这一幕。"
        actions={
          <PrimaryButton type="button" onClick={() => router.push("/collect")} className="min-h-12 px-6 py-3 text-sm">
            回到收集
          </PrimaryButton>
        }
      />
    );
  }

  return (
    <div className={benyuanUiRecipes.immersiveFlowNarrow}>
      {phase === "act1" ? (
        <GlassPanel
          data-theater-phase="act1"
          className={cx("cosmic-open-stage theater-lens-stage theater-lens-stage--opening mx-auto min-h-[68vh] w-full max-w-[30rem]", benyuanUiRecipes.stagePanel)}
        >
          <div className="theater-lens-stage__inner relative flex min-h-[60vh] flex-col justify-between px-0 py-1 md:px-3 md:py-3">
            <div className="pt-3">
              <ImmersiveSigil size="sm" className="theater-stage-sigil mb-6 opacity-85" />
            </div>
            <div className="cosmic-editorial-stage theater-scene-copy pl-5">
              <p className={cx("max-w-[23rem] text-[var(--text-primary)] md:max-w-[28rem]", act1SceneClass(act1Scene.lead))}>
                {act1Scene.lead}
              </p>
            </div>
            <div className="theater-bottom-intent space-y-4 pl-5">
              {act1Scene.tail ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setAct1Expanded((current) => !current)}
                    className="theater-ghost-trigger inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--lunar-border)] bg-[rgba(143,151,232,0.11)] px-4 text-[10px] tracking-[0.12em] text-[var(--text-secondary)] transition duration-150 hover:text-[var(--text-primary)] active:translate-y-px"
                  >
                    {act1Expanded ? "收起" : "展开场景"}
                  </button>
                  {act1Expanded ? (
                    <div className="theater-scene-tail rounded-[1.7rem] border border-[rgba(243,241,234,0.09)] bg-[rgba(255,255,255,0.035)] px-5 py-4 text-left backdrop-blur-[22px]">
                      <p className="text-sm leading-7 text-[var(--text-secondary)]">{act1Scene.tail}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <PrimaryButton type="button" onClick={advanceFromAct1} className="w-full md:w-auto md:min-w-[15rem] md:px-8 md:py-4">
                进入这一幕
              </PrimaryButton>
            </div>
          </div>
        </GlassPanel>
      ) : null}

      {phase === "act2" && currentChoice ? (
        <GlassPanel
          data-theater-phase="act2"
          className={cx("cosmic-open-stage theater-lens-stage theater-lens-stage--choice mx-auto min-h-[68vh] w-full max-w-[30rem]", benyuanUiRecipes.stagePanel, "px-0 py-7 md:px-4 md:py-9")}
        >
          <div className="theater-lens-stage__inner mx-auto flex min-h-[59vh] max-w-[25rem] flex-col justify-center md:max-w-[28rem]">
            <div className="cosmic-editorial-stage theater-scene-copy pl-5 text-left">
              <p className="theater-phase-whisper">靠近一个方向</p>
              <h3 className={cx("text-[var(--text-primary)]", theaterHeadingClass(act2SceneLine || "你要走向哪一条轨道？"))}>{act2SceneLine || "你要走向哪一条轨道？"}</h3>
            </div>
            <div className="theater-choice-stack mt-8 grid gap-2.5">
              {currentChoice.options.slice(0, 4).map((option, index) => {
                const active = selectedChoiceId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onMouseEnter={() => setHoverSequence((current) => [...current, option.id])}
                    onClick={() => chooseAct2(option.id)}
                    disabled={Boolean(selectedChoiceId) || submitting}
                    data-active={active ? "true" : "false"}
                    className={cx(benyuanUiRecipes.interactiveCard(active, "accent"), "group min-h-[4.35rem] overflow-hidden px-4 py-3.5 text-left disabled:opacity-70")}
                  >
                    <div className="flex items-center gap-4">
                      <span className="postmodern-option-index" aria-hidden>{optionIndexLabel(index)}</span>
                      <p className="theater-option-copy min-w-0 flex-1 text-[1rem] font-semibold leading-6 text-[var(--text-primary)]">{option.text}</p>
                      <span className="cosmic-option-select" aria-hidden />
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedChoiceId && completedChoiceLogs ? (
              <div className="theater-bottom-intent mt-7 space-y-3 px-1">
                <p className="px-4 text-sm leading-6 text-[var(--text-secondary)]">四轮选择已经收束。</p>
                <PrimaryButton
                  type="button"
                  onClick={() => void finishJourney(completedChoiceLogs)}
                  disabled={submitting}
                  className="w-full md:px-8 md:py-4"
                >
                  {submitting ? "正在进入星图" : "进入生成星图"}
                </PrimaryButton>
              </div>
            ) : null}
            {status ? <p className="mt-5 px-5 text-sm leading-6 text-[var(--text-secondary)]">{status}</p> : null}
          </div>
        </GlassPanel>
      ) : null}
    </div>
  );
}
