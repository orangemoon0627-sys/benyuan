"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, History, RotateCcw, Sparkles } from "lucide-react";
import {
  getSchemaDefaultAnswerValue,
  hasDraftableAssessmentSchemaProgress,
  resolveAssessmentSchemaMode,
  resolveAssessmentSchemaVersion,
  type AssessmentSchemaAnswerValue as AssessmentAnswerValue,
  type AssessmentSchemaDefinition,
  type AssessmentSchemaFormState as FormState,
  type AssessmentSchemaNativePresentationHints,
  type AssessmentSchemaQuestion as QuestionDef,
} from "@/lib/assessment-schema";
import { buildAssessmentNativeScreenMap, buildAssessmentProgressSnapshot, buildAssessmentScreenCopy } from "@/lib/assessment-client-contract";

type DraftPayload = {
  currentStep: number;
  state: FormState;
  savedAt: string;
};

const emptyAssessmentDefinition: AssessmentSchemaDefinition = {
  status: "ok",
  mode: "lite",
  version: "lite.v1",
  title: "Loading",
  description: "",
  storageKey: "",
  initialState: { lifeStage: "", moodKeywords: [], answers: {} },
  totalSteps: 2,
  phases: [],
  moduleLabels: {},
  lifeStageOptions: [],
  moodKeywordOptions: [],
  questionTypes: [],
  questions: [],
  validation: {
    requireAtLeastOneOpenReflection: false,
    openReflectionQuestionIds: [],
  },
  flow: {
    pacing: {
      pattern: "single_question_progression",
      progressMetric: "step_index_ratio",
      supportsBackNavigation: true,
      supportsDraftPersistence: true,
      entryStep: 0,
      firstQuestionStep: 1,
      lastQuestionStep: 0,
      reviewStep: 1,
      questionStepCount: 0,
    },
    review: {
      requireLifeStage: true,
      minimumMoodKeywords: 1,
      requireAllRequiredQuestions: true,
      requiredOpenReflectionCount: 0,
      openReflectionQuestionIds: [],
      incompleteJumpStrategy: "first_incomplete_step",
    },
    steps: [],
  },
  native: buildAssessmentNativeScreenMap({
    pacing: {
      pattern: "single_question_progression",
      progressMetric: "step_index_ratio",
      supportsBackNavigation: true,
      supportsDraftPersistence: true,
      entryStep: 0,
      firstQuestionStep: 1,
      lastQuestionStep: 0,
      reviewStep: 1,
      questionStepCount: 0,
    },
    review: {
      requireLifeStage: true,
      minimumMoodKeywords: 1,
      requireAllRequiredQuestions: true,
      requiredOpenReflectionCount: 0,
      openReflectionQuestionIds: [],
      incompleteJumpStrategy: "first_incomplete_step",
    },
    steps: [],
  }),
  availableVersions: [],
  availableModes: [],
};


function Shell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`relative overflow-hidden rounded-[38px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.016))] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:p-8 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(189,218,255,0.08),transparent_20%),radial-gradient(circle_at_90%_0%,rgba(120,92,149,0.08),transparent_24%)]" />
      <div className="pointer-events-none absolute right-[-10%] top-[-20%] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(185,215,246,0.12),transparent_68%)] blur-3xl" />
      <div className="relative">{children}</div>
    </section>
  );
}

function OptionButton({ active, children, onClick, pressed }: { active: boolean; children: React.ReactNode; onClick: () => void; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      data-active={active ? "true" : "false"}
      className={`flex min-h-14 w-full items-center rounded-[24px] px-5 text-left text-base leading-7 transition duration-300 ${
        active
          ? "bg-[linear-gradient(135deg,rgba(232,243,255,0.17),rgba(167,193,228,0.11))] text-stone-100 shadow-[0_0_0_1px_rgba(216,232,255,0.18)]"
          : "bg-black/16 text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/[0.035] hover:text-stone-100"
      }`}
    >
      {children}
    </button>
  );
}

function formatSavedAt(savedAt: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(savedAt));
  } catch {
    return savedAt;
  }
}


function getCurrentFlowStep(definition: AssessmentSchemaDefinition, step: number) {
  return definition.flow.steps[step] ?? null;
}

function getAtmosphereLabel(backgroundTreatment: string | undefined) {
  if (backgroundTreatment === "memory_fog") return "记忆雾场";
  if (backgroundTreatment === "signal_glow") return "信号辉光";
  if (backgroundTreatment === "review_halo") return "回望光晕";
  return "呼吸雾面";
}

function getPhaseIndex(definition: AssessmentSchemaDefinition, phaseId: string | undefined) {
  if (!phaseId) return null;
  const index = definition.phases.findIndex((phase) => phase.id === phaseId);
  return index >= 0 ? index + 1 : null;
}


type TheaterAct = {
  id: string;
  label: string;
  title: string;
  body: string;
  phaseIds: string[];
};

const theaterActs: TheaterAct[] = [
  {
    id: "act-i",
    label: "第一幕",
    title: "辨认你的内在轮廓",
    body: "从认知、情绪与欲望的底层纹理开始，先看清你怎样感受、怎样思考、怎样被牵引。",
    phaseIds: ["entry", "cognition", "emotion", "desire"],
  },
  {
    id: "act-ii",
    label: "第二幕",
    title: "进入关系与审美的镜厅",
    body: "让你和他人的距离、你和作品的距离，以及你与时间的关系同时显影。",
    phaseIds: ["relation", "aesthetic", "temporal"],
  },
  {
    id: "act-iii",
    label: "第三幕",
    title: "把未说尽的部分交给雾里",
    body: "最后收拢意义、灵性与开放反思，把无法被选项完全装下的部分也留下来。",
    phaseIds: ["spiritual", "reflection", "review"],
  },
];

function getCurrentTheaterAct(phaseId: string | undefined) {
  return theaterActs.find((act) => act.phaseIds.includes(phaseId ?? "review")) ?? theaterActs[0];
}

type AtmosphereTheme = {
  pageGlow: string;
  centerGlow: string;
  shellTone: string;
  transitionTone: string;
  cueTone: string;
  companionTone: string;
};

function getAtmosphereTheme(hints?: AssessmentSchemaNativePresentationHints): AtmosphereTheme {
  switch (hints?.backgroundTreatment) {
    case "signal_glow":
      return {
        pageGlow:
          "bg-[radial-gradient(circle_at_18%_14%,rgba(166,205,255,0.16),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(108,141,255,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]",
        centerGlow: "bg-[radial-gradient(circle,rgba(170,213,255,0.18),transparent_62%)]",
        shellTone: "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_0%_0%,rgba(163,205,255,0.08),transparent_26%)] before:content-['']",
        transitionTone: "bg-[linear-gradient(135deg,rgba(214,232,255,0.11),rgba(95,126,198,0.09),rgba(255,255,255,0.03))]",
        cueTone: "bg-[linear-gradient(135deg,rgba(214,232,255,0.09),rgba(255,255,255,0.03))]",
        companionTone: "bg-[linear-gradient(180deg,rgba(7,10,18,0.44),rgba(7,10,18,0.22))]",
      };
    case "memory_fog":
      return {
        pageGlow:
          "bg-[radial-gradient(circle_at_16%_18%,rgba(163,132,198,0.16),transparent_26%),radial-gradient(circle_at_84%_22%,rgba(185,215,246,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0))]",
        centerGlow: "bg-[radial-gradient(circle,rgba(193,176,228,0.16),transparent_64%)]",
        shellTone: "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_12%_0%,rgba(170,144,214,0.09),transparent_26%)] before:content-['']",
        transitionTone: "bg-[linear-gradient(135deg,rgba(192,176,228,0.11),rgba(138,112,166,0.08),rgba(255,255,255,0.02))]",
        cueTone: "bg-[linear-gradient(135deg,rgba(194,176,228,0.08),rgba(255,255,255,0.03))]",
        companionTone: "bg-[linear-gradient(180deg,rgba(16,10,25,0.42),rgba(7,10,18,0.22))]",
      };
    case "review_halo":
      return {
        pageGlow:
          "bg-[radial-gradient(circle_at_16%_14%,rgba(255,245,210,0.1),transparent_22%),radial-gradient(circle_at_82%_24%,rgba(191,222,255,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]",
        centerGlow: "bg-[radial-gradient(circle,rgba(229,236,255,0.16),transparent_64%)]",
        shellTone: "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_0%,rgba(255,245,215,0.07),transparent_24%)] before:content-['']",
        transitionTone: "bg-[linear-gradient(135deg,rgba(242,246,255,0.11),rgba(191,222,255,0.08),rgba(255,255,255,0.03))]",
        cueTone: "bg-[linear-gradient(135deg,rgba(239,246,255,0.08),rgba(255,255,255,0.03))]",
        companionTone: "bg-[linear-gradient(180deg,rgba(18,18,24,0.44),rgba(9,11,17,0.24))]",
      };
    default:
      return {
        pageGlow:
          "bg-[radial-gradient(circle_at_18%_14%,rgba(185,215,246,0.12),transparent_24%),radial-gradient(circle_at_82%_22%,rgba(113,83,132,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0))]",
        centerGlow: "bg-[radial-gradient(circle,rgba(184,219,255,0.14),transparent_64%)]",
        shellTone: "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_12%_0%,rgba(184,219,255,0.08),transparent_24%)] before:content-['']",
        transitionTone: "bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(185,215,246,0.05),rgba(255,255,255,0.02))]",
        cueTone: "bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]",
        companionTone: "bg-black/18",
      };
  }
}

function TestPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [schemaReady, setSchemaReady] = useState(false);
  const [advanceSignal, setAdvanceSignal] = useState(0);
  const [autoAdvancePending, setAutoAdvancePending] = useState(false);
  const [showActOverlay, setShowActOverlay] = useState(false);
  const assessmentMode = resolveAssessmentSchemaMode(searchParams.get("mode"));
  const assessmentVersion = resolveAssessmentSchemaVersion(searchParams.get("version"));
  const [loadedAssessmentDefinition, setLoadedAssessmentDefinition] = useState<AssessmentSchemaDefinition | null>(null);
  const assessmentDefinition = loadedAssessmentDefinition ?? emptyAssessmentDefinition;
  const [draftAvailableOnLoad, setDraftAvailableOnLoad] = useState(false);
  const [draftMeta, setDraftMeta] = useState<{ currentStep: number; savedAt: string } | null>(null);
  const [state, setState] = useState<FormState>(emptyAssessmentDefinition.initialState);

  useEffect(() => {
    let cancelled = false;

    async function loadSchema() {
      setSchemaReady(false);
      setSchemaError(null);
      setDraftReady(false);
      setDraftAvailableOnLoad(false);
      setDraftMeta(null);
      setDraftRestored(false);
      setAutoAdvancePending(false);
      setCurrentStep(0);

      try {
        const schemaQuery = new URLSearchParams({ mode: assessmentMode });
        if (assessmentVersion) schemaQuery.set("version", assessmentVersion);
        const response = await fetch(`/api/test/schema?${schemaQuery.toString()}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("schema_load_failed");
        }

        const payload = (await response.json()) as AssessmentSchemaDefinition;
        if (cancelled) return;
        setLoadedAssessmentDefinition(payload);
        setState(payload.initialState);
      } catch {
        if (cancelled) return;
        setLoadedAssessmentDefinition(null);
        setState(emptyAssessmentDefinition.initialState);
        setSchemaError("测评结构加载失败，请稍后刷新再试。");
      } finally {
        if (!cancelled) {
          setSchemaReady(true);
        }
      }
    }

    void loadSchema();

    return () => {
      cancelled = true;
    };
  }, [assessmentMode, assessmentVersion]);

  const progressSnapshot = useMemo(
    () => buildAssessmentProgressSnapshot(assessmentDefinition, currentStep, state),
    [assessmentDefinition, currentStep, state],
  );
  const {
    context,
    progress,
    openTextCount,
    requiredOpenReflectionCount,
    reviewReady,
    firstIncompleteStep,
    firstIncompleteLabel,
    canProceed,
    currentModuleLabel,
  } = progressSnapshot;

  useEffect(() => {
    if (!assessmentDefinition.storageKey) {
      setDraftReady(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(assessmentDefinition.storageKey);
      if (!raw) {
        setDraftReady(true);
        return;
      }

      const draft = JSON.parse(raw) as DraftPayload;
      if (draft?.state) {
        const restoredStep = Math.max(0, Math.min(draft.currentStep ?? 0, assessmentDefinition.totalSteps - 1));
        setState(draft.state);
        setCurrentStep(restoredStep);
        setDraftMeta({ currentStep: restoredStep, savedAt: draft.savedAt ?? new Date().toISOString() });
        setDraftAvailableOnLoad(true);
        setDraftRestored(true);
      }
    } catch {
      // Ignore corrupted drafts and continue with a clean session.
    } finally {
      setDraftReady(true);
    }
  }, [assessmentDefinition.storageKey, assessmentDefinition.totalSteps]);

  useEffect(() => {
    if (!draftReady) return;

    if (!assessmentDefinition.storageKey || !hasDraftableAssessmentSchemaProgress(assessmentDefinition, currentStep, state)) {
      if (assessmentDefinition.storageKey) {
        window.localStorage.removeItem(assessmentDefinition.storageKey);
      }
      setDraftMeta(null);
      return;
    }

    const payload: DraftPayload = {
      currentStep,
      state,
      savedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(assessmentDefinition.storageKey, JSON.stringify(payload));
    setDraftMeta({ currentStep, savedAt: payload.savedAt });
  }, [assessmentDefinition, currentStep, draftReady, state]);

  function setAnswer(questionId: string, value: AssessmentAnswerValue) {
    setState((current) => ({ ...current, answers: { ...current.answers, [questionId]: value } }));
    setAdvanceSignal((value) => value + 1);
  }

  function toggleMulti(question: QuestionDef, option: string) {
    setState((current) => {
      const currentValues = Array.isArray(current.answers[question.questionId]) ? (current.answers[question.questionId] as string[]) : [];
      const hasOption = currentValues.includes(option);
      const maximum = question.maxSelections ?? question.options?.length ?? 99;
      const next = hasOption ? currentValues.filter((item) => item !== option) : [...currentValues, option].slice(0, maximum);

      return {
        ...current,
        answers: {
          ...current.answers,
          [question.questionId]: next,
        },
      };
    });
    setAdvanceSignal((value) => value + 1);
  }

  function goNext() {
    if (!canProceed || currentStep >= assessmentDefinition.totalSteps - 1) return;
    setAutoAdvancePending(false);
    setCurrentStep((value) => value + 1);
  }

  function goBack() {
    if (currentStep === 0) return;
    setAutoAdvancePending(false);
    setCurrentStep((value) => value - 1);
  }

  function restoreDraftPosition() {
    if (!draftMeta) return;
    setCurrentStep(draftMeta.currentStep);
    setDraftRestored(true);
  }

  function clearDraft() {
    if (assessmentDefinition.storageKey) {
      window.localStorage.removeItem(assessmentDefinition.storageKey);
    }
    setState(assessmentDefinition.initialState);
    setCurrentStep(0);
    setDraftMeta(null);
    setDraftAvailableOnLoad(false);
    setDraftRestored(false);
    setError(null);
  }

  function jumpToFirstIncomplete() {
    if (firstIncompleteStep === null) return;
    setAutoAdvancePending(false);
    setCurrentStep(firstIncompleteStep);
    setError(null);
  }


  useEffect(() => {
    setAutoAdvancePending(false);

    if (!schemaReady || submitting || !canProceed || context.mode !== "question") {
      return;
    }

    const shouldAutoAdvance = context.question.answerType === "single" || context.question.answerType === "scale";
    if (!shouldAutoAdvance || advanceSignal === 0) {
      return;
    }

    setAutoAdvancePending(true);
    const timer = window.setTimeout(() => {
      setAutoAdvancePending(false);
      setCurrentStep((value) => Math.min(value + 1, assessmentDefinition.totalSteps - 1));
    }, 560);

    return () => window.clearTimeout(timer);
  }, [advanceSignal, assessmentDefinition.totalSteps, canProceed, context, schemaReady, submitting]);

  async function handleSubmit() {
    if (!reviewReady) return;

    setSubmitting(true);
    setError(null);

    const answers = assessmentDefinition.questions.map((question) => ({
      questionId: question.questionId,
      moduleId: question.moduleId,
      answerType: question.answerType,
      value: state.answers[question.questionId] ?? getSchemaDefaultAnswerValue(question),
    }));

    const payload = {
      mode: assessmentDefinition.mode,
      version: assessmentDefinition.version,
      basicInfo: {
        lifeStage: state.lifeStage,
        moodKeywords: state.moodKeywords,
      },
      answers,
    };

    try {
      const response = await fetch("/api/test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("提交失败");
      }

      const data = (await response.json()) as { next: string };
      if (assessmentDefinition.storageKey) {
        window.localStorage.removeItem(assessmentDefinition.storageKey);
      }
      setDraftMeta(null);
      router.push(data.next);
    } catch {
      setError("这次提交没有成功，你的答案还在。稍等片刻再试一次。");
      setSubmitting(false);
    }
  }

  function renderQuestion(question: QuestionDef) {
    const currentValue = state.answers[question.questionId];

    const questionTypeMeta = question.typeMeta;

    if (questionTypeMeta.webImplementation === "planned") {
      return (
        <div className="rounded-[28px] bg-[rgba(255,244,214,0.05)] p-5 shadow-[0_0_0_1px_rgba(245,208,120,0.14)]">
          <p className="text-[11px] tracking-[0.28em] text-amber-200/70 uppercase">planned question type</p>
          <p className="mt-3 text-sm leading-7 text-stone-300/82">
            这种题型已经在 assessment 内核里注册完成，但当前 Web MVP 还没有启用对应交互。后面接入图片、音频或排序题时，可以直接沿用这个内核扩展。
          </p>
        </div>
      );
    }

    if (question.answerType === "single") {
      return (
        <div className="space-y-3">
          {(question.options ?? []).map((option, index) => {
            const active = currentValue === option.label;
            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.32, delay: 0.05 * index, ease: [0.16, 1, 0.3, 1] }}
              >
                <OptionButton active={active} pressed={active} onClick={() => setAnswer(question.questionId, option.label)}>
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs tracking-[0.18em] uppercase ${active ? "bg-white/16 text-stone-50" : "bg-white/[0.04] text-stone-400"}`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>{option.label}</span>
                    </div>
                    <span className={`text-[10px] uppercase tracking-[0.22em] ${active ? "text-stone-100" : "text-stone-500"}`}>
                      {active ? "已选" : "轻触选择"}
                    </span>
                  </div>
                </OptionButton>
              </motion.div>
            );
          })}
          {autoAdvancePending ? <p className="text-sm leading-7 text-sky-100/82">已捕捉到你的选择，正在把你带进下一幕。</p> : null}
        </div>
      );
    }

    if (question.answerType === "multi") {
      const values = Array.isArray(currentValue) ? currentValue : [];
      return (
        <div>
          <div className="grid gap-3 md:grid-cols-2">
            {(question.options ?? []).map((option, index) => {
              const active = values.includes(option.label);
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.32, delay: 0.05 * index, ease: [0.16, 1, 0.3, 1] }}
                >
                  <OptionButton active={active} pressed={active} onClick={() => toggleMulti(question, option.label)}>
                    <div className="flex w-full items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-xs tracking-[0.18em] uppercase ${active ? "bg-white/16 text-stone-50" : "bg-white/[0.04] text-stone-400"}`}>
                          {index + 1}
                        </span>
                        <span>{option.label}</span>
                      </div>
                      <span className={`text-[10px] uppercase tracking-[0.22em] ${active ? "text-stone-100" : "text-stone-500"}`}>
                        {active ? "已纳入" : "可叠加"}
                      </span>
                    </div>
                  </OptionButton>
                </motion.div>
              );
            })}
          </div>
          <p className="mt-5 text-sm leading-7 text-stone-500">
            至少选择 {question.minSelections ?? 1} 项，最多 {question.maxSelections ?? question.options?.length ?? 1} 项。
          </p>
        </div>
      );
    }

    if (question.answerType === "scale") {
      const min = question.scaleMin ?? 1;
      const max = question.scaleMax ?? 5;
      const values = Array.from({ length: max - min + 1 }, (_, index) => min + index);
      return (
        <div>
          <div className="grid grid-cols-5 gap-3">
            {values.map((value, index) => {
              const active = currentValue === value;
              return (
                <motion.div
                  key={value}
                  initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.28, delay: 0.04 * index, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    type="button"
                    onClick={() => setAnswer(question.questionId, value)}
                    className={`flex min-h-16 w-full items-center justify-center rounded-[24px] text-lg transition ${
                      active
                        ? "bg-[linear-gradient(135deg,rgba(232,243,255,0.17),rgba(167,193,228,0.11))] text-stone-100 shadow-[0_0_0_1px_rgba(216,232,255,0.18)]"
                        : "bg-black/16 text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                    }`}
                  >
                    {value}
                  </button>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between gap-4 text-sm leading-7 text-stone-500">
            <span>{question.scaleLabels?.low}</span>
            <span>{question.scaleLabels?.high}</span>
          </div>
        </div>
      );
    }

    return (
      <div>
        <textarea
          value={typeof currentValue === "string" ? currentValue : ""}
          rows={6}
          className="min-h-[180px] w-full resize-none rounded-[28px] bg-black/18 px-5 py-4 text-base leading-8 text-stone-100 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] outline-none transition placeholder:text-stone-600 focus:shadow-[0_0_0_1px_rgba(216,232,255,0.28)]"
          onChange={(event) => setAnswer(question.questionId, event.target.value)}
          placeholder={question.optional ? "如果此刻没有，也可以留白。" : "写一句真正留下来的话。"}
        />
        <div className="mt-5 flex items-start gap-3 text-sm leading-7 text-stone-500">
          <Sparkles className="mt-1 h-4 w-4 shrink-0" strokeWidth={1.4} />
          <p>{question.optional ? "这道题可以跳过，但至少回答两道开放题中的一道，会让结果更像你。" : "只要一句真话就够了。它不会决定全部，但会让最后的结果更像你。"}</p>
        </div>
      </div>
    );
  }

  function renderStepBody() {
    if (!schemaReady && !schemaError) {
      return (
        <div className="rounded-[28px] bg-[linear-gradient(135deg,rgba(191,222,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_0_0_1px_rgba(191,222,255,0.12)]">
          <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">schema loading</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300/82">正在从 `/api/test/schema` 读取这次测评的题目、phase 与校验规则。后续无论你改题型还是改模块，页面都会优先跟 contract 对齐。</p>
        </div>
      );
    }

    if (schemaError) {
      return (
        <div className="rounded-[28px] bg-[rgba(255,244,214,0.05)] p-6 shadow-[0_0_0_1px_rgba(245,208,120,0.14)]">
          <p className="text-[11px] tracking-[0.32em] text-amber-200/70 uppercase">schema unavailable</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300/82">{schemaError}</p>
        </div>
      );
    }

    if (context.mode === "entry") {
      return (
        <div className="space-y-6">
          <div className="rounded-[28px] bg-[linear-gradient(135deg,rgba(191,222,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_0_0_1px_rgba(191,222,255,0.12)]">
            <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">entry atmosphere</p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300/82">你不需要在这里把自己说清，只需要给接下来的问题一层足够柔软的底色。生命阶段和心境关键词，会决定这次阅读从哪里开始。</p>
          </div>
          <div className="grid gap-8 md:grid-cols-[0.46fr_0.54fr] md:gap-10">
          <label className="space-y-3 text-sm text-stone-300">
            <span className="tracking-[0.22em] text-stone-500 uppercase">当前生命阶段</span>
            <select
              className="min-h-12 w-full appearance-none rounded-[22px] bg-black/18 px-5 text-stone-100 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] outline-none transition focus:shadow-[0_0_0_1px_rgba(216,232,255,0.36)]"
              value={state.lifeStage}
              onChange={(event) => setState((current) => ({ ...current, lifeStage: event.target.value }))}
            >
              {assessmentDefinition.lifeStageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-3 text-sm text-stone-300">
            <span className="tracking-[0.22em] text-stone-500 uppercase">近期心境关键词</span>
            <div className="flex flex-wrap gap-3">
              {assessmentDefinition.moodKeywordOptions.map((keyword) => {
                const active = state.moodKeywords.includes(keyword);
                return (
                  <button
                    key={keyword}
                    type="button"
                    className={`min-h-11 rounded-full px-4 text-sm transition ${
                      active
                        ? "bg-[linear-gradient(135deg,rgba(230,241,255,0.18),rgba(167,193,228,0.15))] text-stone-100 shadow-[0_0_0_1px_rgba(216,232,255,0.2)]"
                        : "bg-white/[0.03] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                    }`}
                    onClick={() =>
                      setState((current) => ({
                        ...current,
                        moodKeywords: current.moodKeywords.includes(keyword)
                          ? current.moodKeywords.filter((item) => item !== keyword)
                          : [...current.moodKeywords, keyword],
                      }))
                    }
                  >
                    {keyword}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      );
    }

    if (context.mode === "review") {
      const answeredCount = assessmentDefinition.questions.reduce((count, question) => {
        const value = state.answers[question.questionId];
        const answered =
          question.answerType === "multi"
            ? Array.isArray(value) && value.length > 0
            : question.answerType === "text"
              ? typeof value === "string" && value.trim().length > 0
              : question.answerType === "scale"
                ? typeof value === "number"
                : typeof value === "string" && value.length > 0;
        return count + (answered ? 1 : 0);
      }, 0);
      const reviewCompletion = Math.round((answeredCount / Math.max(assessmentDefinition.questions.length, 1)) * 100);
      const handoffStages = ["收束答题线索", "生成叙事镜像", "绘制精神星图"];

      return (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
            <div className="rounded-[30px] bg-[linear-gradient(135deg,rgba(242,246,255,0.08),rgba(191,222,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_0_0_1px_rgba(191,222,255,0.14)]">
              <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">final handoff</p>
              <h3 className="mt-4 text-2xl leading-[1.25] text-stone-100">第三幕的尾声，不是检查，而是显影前的最后一次回望。</h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300/82">
                这一页会把你刚刚留下的心境、开放反思和停顿感收拢起来。提交之后，系统会先稳定叙事骨架，再补成长建议与相邻推荐，最后把它们组织成一份更接近阅读体验的结果。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {handoffStages.map((stage, index) => (
                  <span
                    key={stage}
                    className="rounded-full bg-white/[0.05] px-4 py-2 text-[11px] tracking-[0.22em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                  >
                    {String(index + 1).padStart(2, "0")} · {stage}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[30px] bg-black/16 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">completion</p>
              <div className="mt-5 flex items-end justify-between gap-5">
                <div>
                  <p className="text-4xl leading-none text-stone-100">{reviewCompletion}%</p>
                  <p className="mt-3 text-sm leading-7 text-stone-400">已回答 {answeredCount} / {assessmentDefinition.questions.length} 题</p>
                </div>
                <div className="h-24 w-24 rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_65%)] p-2">
                  <div className="flex h-full w-full items-center justify-center rounded-full border border-white/10 text-[11px] tracking-[0.22em] text-stone-300 uppercase">
                    ready
                  </div>
                </div>
              </div>
              <div className="mt-5 h-px overflow-hidden rounded-full bg-white/6">
                <motion.div className="h-full bg-[linear-gradient(90deg,rgba(216,232,255,0.84),rgba(167,193,228,0.72))]" initial={{ width: 0 }} animate={{ width: `${reviewCompletion}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-[0.34fr_0.33fr_0.33fr]">
            <div className="rounded-[26px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">你的轮廓</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300/78">
                <p>生命阶段：{assessmentDefinition.lifeStageOptions.find((item) => item.value === state.lifeStage)?.label ?? state.lifeStage}</p>
                <p>心境关键词：{state.moodKeywords.join(" · ") || "尚未选择"}</p>
                <p>开放反思：{openTextCount} / {Math.max(assessmentDefinition.validation.openReflectionQuestionIds.length, requiredOpenReflectionCount)}</p>
              </div>
            </div>
            <div className="rounded-[26px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">提交后会发生什么</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300/78">
                <p>会先用规则引擎稳定底稿，保证结果始终可生成。</p>
                <p>如果外部 AI provider 响应足够快，会补充叙事语言、成长建议与相邻推荐。</p>
                <p>随后你会进入异步处理中转页，等它把这份报告慢慢显影出来。</p>
              </div>
            </div>
            <div className="rounded-[26px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">最后校准</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300/78">
                {!reviewReady ? <p className="text-amber-200/85">当前还有未完成的必答题，或开放反思尚未达到最低数量。</p> : <p className="text-stone-200/88">你已经可以把它交给雾里了。</p>}
                <p>至少回答开放反思中的 {requiredOpenReflectionCount} 道，结果会更接近你，而不是更像模板。</p>
                {firstIncompleteLabel ? <p className="text-stone-500">如果要回头，先去补上：{firstIncompleteLabel}</p> : null}
              </div>
              {!reviewReady && firstIncompleteStep !== null ? (
                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={jumpToFirstIncomplete}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-xs tracking-[0.22em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]"
                  >
                    回到未完成处
                    <ArrowRight className="h-4 w-4" strokeWidth={1.4} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    return renderQuestion(context.question);
  }

  const screenCopy = useMemo(
    () => buildAssessmentScreenCopy({ definition: assessmentDefinition, currentStep, state, schemaReady, schemaError }),
    [assessmentDefinition, currentStep, state, schemaReady, schemaError],
  );
  const currentFlowStep = useMemo(
    () => getCurrentFlowStep(assessmentDefinition, currentStep),
    [assessmentDefinition, currentStep],
  );
  const currentPhaseIndex = getPhaseIndex(assessmentDefinition, currentFlowStep?.phaseId);
  const currentAct = getCurrentTheaterAct(currentFlowStep?.phaseId ?? (context.mode === "review" ? "review" : "entry"));
  const currentActIndex = theaterActs.findIndex((act) => act.id === currentAct.id);
  const atmosphereLabel = getAtmosphereLabel(currentFlowStep?.nativeHints.backgroundTreatment);
  const atmosphereTheme = getAtmosphereTheme(currentFlowStep?.nativeHints);
  const phaseTransitionVisible = Boolean(
    currentFlowStep?.kind === "question" && currentFlowStep.phaseStepIndex === 1 && currentFlowStep.questionIndex !== null && currentFlowStep.questionIndex > 0,
  );
  const { heroHeadline, title, description, ritualLine, companionNote } = screenCopy;
  const footerHint =
    context.mode === "review"
      ? reviewReady
        ? "准备把这一轮回答交给分析引擎，进入异步显影。"
        : "先补完未完成的题目，再把这次旅程完整交出去。"
      : autoAdvancePending
        ? "系统正在接住你的选择，并把它推向下一题。"
        : currentFlowStep?.kind === "question"
          ? currentFlowStep.answerType === "single" || currentFlowStep.answerType === "scale"
            ? "做出选择后会自然滑向下一题，尽量跟随第一反应。"
            : "这一题保留手动推进，让你把多股拉力一起留下来。"
          : "先给这次进入一个柔软但准确的坐标。";

  useEffect(() => {
    if (!phaseTransitionVisible) {
      setShowActOverlay(false);
      return;
    }

    setShowActOverlay(true);
    const timer = window.setTimeout(() => setShowActOverlay(false), 1550);
    return () => window.clearTimeout(timer);
  }, [currentAct.id, phaseTransitionVisible]);

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-28 pt-10 text-stone-100 md:pb-36 md:pt-14">
      {showActOverlay ? (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-[rgba(8,8,10,0.58)] px-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`max-w-2xl rounded-[34px] ${atmosphereTheme.transitionTone} px-7 py-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.08)]`}
          >
            <p className="text-[11px] uppercase tracking-[0.36em] text-stone-400">{currentAct.label}</p>
            <h2 className="mt-5 text-3xl leading-[1.18] text-stone-100 md:text-[2.8rem]">{currentFlowStep?.phaseLabel}</h2>
            <p className="mt-5 text-base leading-8 text-stone-300/82">{currentAct.body}</p>
          </motion.div>
        </motion.div>
      ) : null}
      <div className={`pointer-events-none absolute inset-0 ${atmosphereTheme.pageGlow}`} />
      <motion.div
        animate={{ scale: [1, 1.04, 1], opacity: [0.72, 1, 0.72] }}
        transition={{ duration: 6.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className={`pointer-events-none absolute left-1/2 top-36 h-72 w-72 -translate-x-1/2 rounded-full ${atmosphereTheme.centerGlow} blur-3xl`}
      />

      <div className="relative mx-auto max-w-4xl">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] tracking-[0.42em] text-stone-500 uppercase">step ritual / {currentStep + 1} of {assessmentDefinition.totalSteps}</p>
            <Link href="/report/sess_sample_001" className="inline-flex items-center gap-2 text-xs tracking-[0.28em] text-stone-400 uppercase transition hover:text-stone-200">
              查看样例
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
            </Link>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-[0.64fr_0.36fr] md:items-end">
            <div>
              <div className="flex flex-wrap gap-2">
                {currentActIndex >= 0 ? <span className="rounded-full bg-white/[0.04] px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">act {String(currentActIndex + 1).padStart(2, "0")}</span> : null}
                {currentPhaseIndex ? <span className="rounded-full bg-white/[0.04] px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">phase {String(currentPhaseIndex).padStart(2, "0")}</span> : null}
                {currentFlowStep?.kind === "question" ? <span className="rounded-full bg-white/[0.04] px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">scene {currentFlowStep.phaseStepIndex}/{currentFlowStep.phaseStepCount}</span> : null}
                <span className="rounded-full bg-white/[0.04] px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">{atmosphereLabel}</span>
              </div>
              <h2 className="mt-5 max-w-2xl text-4xl leading-[1.06] text-stone-100 md:text-[3.45rem]">{heroHeadline}</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-stone-300/76 md:text-lg">{ritualLine}</p>
              {currentFlowStep?.phaseDescription ? <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-500">{currentFlowStep.phaseDescription}</p> : null}
            </div>
            <div className="rounded-[24px] bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <p className="text-[11px] tracking-[0.28em] text-stone-500 uppercase">当前段落</p>
              <p className="mt-3 text-xl text-stone-100">{currentFlowStep?.phaseLabel ?? currentModuleLabel}</p>
              <p className="mt-2 text-sm leading-7 text-stone-400">{context.mode === "question" ? `问题 ${context.questionIndex + 1} / ${assessmentDefinition.questions.length} · ${currentModuleLabel}` : context.mode === "entry" ? "进入前校准" : "提交前回望"}</p>
              {currentFlowStep?.kind === "question" ? (
                <div className="mt-4 flex items-center gap-2">
                  {Array.from({ length: currentFlowStep.phaseStepCount }, (_, index) => {
                    const active = index + 1 === currentFlowStep.phaseStepIndex;
                    const done = index + 1 < currentFlowStep.phaseStepIndex;
                    return (
                      <span
                        key={`${currentFlowStep.phaseId}-${index + 1}`}
                        className={`h-1.5 rounded-full transition-all ${active ? "w-8 bg-stone-100" : done ? "w-5 bg-stone-400/70" : "w-5 bg-white/10"}`}
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {draftAvailableOnLoad && draftMeta ? (
            <div className="mt-4 flex flex-col gap-4 rounded-[26px] bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 text-sm leading-7 text-stone-300/78">
                <History className="mt-1 h-4 w-4 shrink-0 text-stone-400" strokeWidth={1.5} />
                <div>
                  <p className="text-stone-200/86">{draftRestored ? "已自动恢复你上次停下的位置。" : "检测到一份未完成草稿。"}</p>
                  <p className="text-stone-500">最近保存：{formatSavedAt(draftMeta.savedAt)} · 停留在第 {draftMeta.currentStep + 1} 步</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={restoreDraftPosition}
                  disabled={submitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-xs tracking-[0.22em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07] disabled:opacity-50"
                >
                  <History className="h-4 w-4" strokeWidth={1.5} />
                  回到草稿
                </button>
                <button
                  type="button"
                  onClick={clearDraft}
                  disabled={submitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs tracking-[0.22em] text-stone-400 uppercase transition hover:text-stone-200 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
                  清空重来
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-5 h-px overflow-hidden rounded-full bg-white/6">
            <motion.div className="h-full bg-[linear-gradient(90deg,rgba(216,232,255,0.84),rgba(167,193,228,0.72))]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} />
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {theaterActs.map((act, index) => {
              const active = index === currentActIndex;
              const done = index < currentActIndex;
              return (
                <div
                  key={act.id}
                  className={`rounded-[24px] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] ${active ? "bg-[linear-gradient(135deg,rgba(232,243,255,0.12),rgba(167,193,228,0.08))]" : done ? "bg-white/[0.04]" : "bg-black/16"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">{act.label}</p>
                    <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-sky-100" : done ? "bg-stone-300/80" : "bg-white/16"}`} />
                  </div>
                  <p className="mt-3 text-base leading-7 text-stone-100">{act.title}</p>
                  <p className="mt-2 text-xs leading-6 text-stone-400">{act.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(assessmentDefinition.moduleLabels).map(([key, label]) => {
              const active = context.mode === "question" ? context.question.moduleId === key : context.mode === "entry" ? key === "entry_state" : key === "open_reflection";
              return (
                <span
                  key={key}
                  className={`rounded-full px-3 py-2 text-[10px] tracking-[0.24em] uppercase ${
                    active
                      ? "bg-[linear-gradient(135deg,rgba(230,241,255,0.18),rgba(167,193,228,0.14))] text-stone-100 shadow-[0_0_0_1px_rgba(216,232,255,0.18)]"
                      : "bg-transparent text-stone-600 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
                  }`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </motion.section>

        {phaseTransitionVisible ? (
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 rounded-[30px] bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(185,215,246,0.04))] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
          >
            <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500">scene transition</p>
            <h3 className="mt-3 text-2xl leading-[1.28] text-stone-100">{currentAct.label} · {currentFlowStep?.phaseLabel}</h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-300/78">
              {currentAct.body} 现在开始进入“{currentFlowStep?.phaseLabel}”。先不要急着回答，让这一幕先落在你身上，再决定你更靠近哪一种回应。
            </p>
          </motion.div>
        ) : null}

        <Shell className={atmosphereTheme.shellTone}>
          <motion.div key={currentStep} initial={{ opacity: 0, y: 22, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
            <div className="grid gap-6 lg:grid-cols-[0.68fr_0.32fr] lg:items-start">
              <div>
                <p className="text-[11px] tracking-[0.4em] text-stone-500 uppercase">{currentModuleLabel}</p>
                <h1 className="mt-4 max-w-3xl text-3xl leading-[1.28] text-stone-100 md:text-5xl">{title}</h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-stone-300/76 md:text-lg">{description}</p>
              </div>
              <div className="rounded-[24px] bg-black/18 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <p className="text-[11px] tracking-[0.28em] text-stone-500 uppercase">{companionNote.eyebrow}</p>
                <h3 className="mt-3 text-xl leading-[1.35] text-stone-100">{companionNote.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-300/76">{companionNote.body}</p>
              </div>
            </div>
            {currentFlowStep?.kind === "question" ? (
              <div className="mt-8 grid gap-4 md:grid-cols-[0.62fr_0.38fr]">
                <div className={`rounded-[24px] ${atmosphereTheme.cueTone} p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]`}>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">scene cue</p>
                  <p className="mt-3 text-base leading-8 text-stone-200/84">
                    {currentFlowStep.phaseLabel}正在展开。不要先想标准答案，先感受你更想靠近哪一种回应。这个场景会记住你的停顿，也会记住你的直觉。
                  </p>
                </div>
                <div className={`rounded-[24px] ${atmosphereTheme.companionTone} p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]`}>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">interaction</p>
                  <p className="mt-3 text-sm leading-7 text-stone-300/76">
                    {currentFlowStep.answerType === "single" || currentFlowStep.answerType === "scale"
                      ? "单选与刻度题会在你确认后自动滑向下一题，更接近 App 式单题推进。"
                      : currentFlowStep.answerType === "multi"
                        ? "多选题保留手动推进，让你有空间把几股同时出现的拉力一起纳入。"
                        : "开放题不会催促你，留下一句不打算立刻撤回的话就够了。"}
                  </p>
                </div>
              </div>
            ) : null}
            <div className="mt-8">{renderStepBody()}</div>
          </motion.div>

          <div className="sticky bottom-3 z-20 mt-10 flex flex-col gap-4 rounded-[28px] border border-white/8 bg-[rgba(8,8,10,0.78)] px-4 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between sm:px-5 md:bottom-4">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">ritual footer</p>
              <p className="max-w-md text-sm leading-6 text-stone-300/78">{footerHint}</p>
            </div>
            <button
              type="button"
              onClick={goBack}
              disabled={currentStep === 0 || submitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm tracking-[0.18em] text-stone-300 uppercase transition hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.4} />
              上一步
            </button>

            <div className="flex flex-col items-end gap-3 sm:items-center md:flex-row">
              {error ? <p className="max-w-md text-right text-sm leading-7 text-rose-300 md:text-left">{error}</p> : null}
              {context.mode === "review" ? (
                <button
                  type="button"
                  disabled={!reviewReady || submitting || !schemaReady || Boolean(schemaError)}
                  onClick={handleSubmit}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(192,220,249,0.92))] px-7 py-3 text-sm tracking-[0.2em] text-[#0b0d14] uppercase transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-4 w-4" strokeWidth={1.5} />
                  {submitting ? "正在整理线索" : "提交并开始分析"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canProceed || submitting || !schemaReady || Boolean(schemaError) || autoAdvancePending}
                  onClick={goNext}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(192,220,249,0.92))] px-7 py-3 text-sm tracking-[0.2em] text-[#0b0d14] uppercase transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {autoAdvancePending ? "正在进入下一题" : "下一步"}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.4} />
                </button>
              )}
            </div>
          </div>
        </Shell>
      </div>
    </main>
  );
}

export default function TestPage() {
  return (
    <Suspense fallback={<main className="min-h-[60vh] bg-[#08080a]" />}>
      <TestPageClient />
    </Suspense>
  );
}
