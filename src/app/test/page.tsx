"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, History, RotateCcw, Sparkles } from "lucide-react";
import {
  getAssessmentSchemaModuleLabel,
  getAssessmentSchemaStepContext,
  getSchemaDefaultAnswerValue,
  hasDraftableAssessmentSchemaProgress,
  isAssessmentSchemaQuestionAnswered,
  resolveAssessmentSchemaMode,
  resolveAssessmentSchemaVersion,
  type AssessmentSchemaAnswerValue as AssessmentAnswerValue,
  type AssessmentSchemaDefinition,
  type AssessmentSchemaFormState as FormState,
  type AssessmentSchemaQuestion as QuestionDef,
  type AssessmentSchemaStepContext as StepContext,
} from "@/lib/assessment-schema";

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
  availableVersions: [],
  availableModes: [],
};


function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-[38px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.016))] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:p-8">
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

function getRitualLine(context: StepContext) {
  if (context.mode === "entry") {
    return "先把你的天气、位置和内在底色轻轻放到桌面上。";
  }

  if (context.mode === "review") {
    return "你已经走完整条问题河道，现在只差最后一次回望。";
  }

  if (context.question.moduleId === "cognitive_topology") {
    return "这一段在看你如何处理复杂、矛盾与不确定，而不是判断聪明与否。";
  }

  if (context.question.moduleId === "emotional_weather") {
    return "这一段更像在辨认情绪天气，而不是做性格判断。";
  }

  if (context.question.moduleId === "desire_topology") {
    return "这一段会更靠近你真正想守住的东西，以及你最深的不安。";
  }

  if (context.question.moduleId === "relational_grammar") {
    return "这一段在看你如何允许靠近、如何退后，以及边界如何形成。";
  }

  if (context.question.moduleId === "aesthetic_fingerprint") {
    return "这一段在看你被什么击中：不是喜好清单，而是精神指纹。";
  }

  if (context.question.moduleId === "temporal_philosophy") {
    return "这一段在观察你如何与过去、当下和未来相处。";
  }

  if (context.question.moduleId === "spiritual_dimension") {
    return "这一段不在判断你信什么，而在看你如何理解意义、连接与超越。";
  }

  if (context.question.moduleId === "open_reflection") {
    return "这一段留给那些无法用选项说尽的部分。";
  }

  return "你不需要回答得标准，只需要回答得诚实。";
}

function getCompanionNote(context: StepContext) {
  if (context.mode === "entry") {
    return {
      eyebrow: "entry note",
      title: "这不是登记表，而是入口温度",
      body: "先给它几个坐标：你在生命的什么位置，最近的天气偏向哪里。接下来的每一道题都会在这些坐标之上展开。",
    };
  }

  if (context.mode === "review") {
    return {
      eyebrow: "handoff note",
      title: "提交前，不必再追求完美",
      body: "如果有些题你仍犹豫，也没关系。这里需要的不是最正确的你，而是此刻最接近真实的你。",
    };
  }

  if (context.mode === "question" && context.question.moduleId === "cognitive_topology") {
    return {
      eyebrow: "cognitive cue",
      title: "这里记录的是你的思考地形，不是标准答案",
      body: "有些人先找结构，有些人先捕捉直觉。系统关心的是你怎样抵达理解，而不是你像不像某种模板。",
    };
  }

  if (context.mode === "question" && context.question.moduleId === "desire_topology") {
    return {
      eyebrow: "desire cue",
      title: "这部分更私密，可以慢一点",
      body: "关于匮乏、理想与恐惧的题，不需要答得漂亮，只需要比平时更接近真实一点。",
    };
  }

  if (context.mode === "question" && context.question.moduleId === "relational_grammar") {
    return {
      eyebrow: "relation cue",
      title: "关系并不只关乎别人，也关乎你如何保护自己",
      body: "你在靠近时如何退后、在独处时如何安顿，都会构成你独特的关系语法。",
    };
  }

  if (context.question.answerType === "text") {
    return {
      eyebrow: "open reflection",
      title: "一句没有被迅速撤回的话，就够了",
      body: "开放题不是作文。哪怕只留下一个画面、一个梦、一个反复出现的念头，它也会让结果更像你。",
    };
  }

  if (context.question.answerType === "scale") {
    return {
      eyebrow: "scale cue",
      title: "不必找绝对值，只找眼下最接近的刻度",
      body: "分数不是评价高低，而是帮系统分辨：这件事在你身上更轻，还是更重。",
    };
  }

  if (context.question.answerType === "multi") {
    return {
      eyebrow: "selection cue",
      title: "你可以同时被几种东西拉住",
      body: "多选的意义不在于贪多，而在于承认复杂感有时并不只属于一个方向。",
    };
  }

  return {
    eyebrow: "single choice cue",
    title: "选那个真正让你停下来的选项",
    body: "如果两个答案都合理，优先选那个更像直觉靠近的，而不是更像标准答案的。",
  };
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

  const context = getAssessmentSchemaStepContext(assessmentDefinition, currentStep);
  const progress = ((currentStep + 1) / assessmentDefinition.totalSteps) * 100;
  const openTextCount = assessmentDefinition.validation.openReflectionQuestionIds.reduce((count, key) => {
    const value = state.answers[key];
    return typeof value === "string" && value.trim().length > 0 ? count + 1 : count;
  }, 0);

  const requiredQuestionsAnswered = assessmentDefinition.questions.every((question) => isAssessmentSchemaQuestionAnswered(question, state.answers));
  const requiredOpenReflectionCount = assessmentDefinition.validation.requireAtLeastOneOpenReflection ? 1 : 0;
  const reviewReady = requiredQuestionsAnswered && openTextCount >= requiredOpenReflectionCount && state.moodKeywords.length > 0 && Boolean(state.lifeStage);
  const firstIncompleteStep = useMemo(() => {
    const missingRequiredIndex = assessmentDefinition.questions.findIndex((question) => !isAssessmentSchemaQuestionAnswered(question, state.answers));

    if (missingRequiredIndex >= 0) {
      return missingRequiredIndex + 1;
    }

    if (openTextCount === 0) {
      const firstOpenQuestionIndex = assessmentDefinition.questions.findIndex((question) => question.answerType === "text");
      return firstOpenQuestionIndex >= 0 ? firstOpenQuestionIndex + 1 : assessmentDefinition.totalSteps - 1;
    }

    return null;
  }, [assessmentDefinition.questions, assessmentDefinition.totalSteps, openTextCount, state.answers]);

  const firstIncompleteLabel = useMemo(() => {
    if (firstIncompleteStep === null || firstIncompleteStep <= 0 || firstIncompleteStep >= assessmentDefinition.totalSteps - 1) {
      return null;
    }

    const targetQuestion = assessmentDefinition.questions[firstIncompleteStep - 1];
    return `${getAssessmentSchemaModuleLabel(assessmentDefinition, targetQuestion.moduleId)} · 问题 ${firstIncompleteStep} / ${assessmentDefinition.questions.length}`;
  }, [assessmentDefinition, firstIncompleteStep]);

  const canProceed = useMemo(() => {
    if (context.mode === "entry") {
      return Boolean(state.lifeStage) && state.moodKeywords.length > 0;
    }

    if (context.mode === "review") {
      return reviewReady;
    }

    return isAssessmentSchemaQuestionAnswered(context.question, state.answers);
  }, [context, reviewReady, state.answers, state.lifeStage, state.moodKeywords]);

  const currentModuleLabel =
    context.mode === "question" ? getAssessmentSchemaModuleLabel(assessmentDefinition, context.question.moduleId) : context.mode === "entry" ? "进入状态" : "提交前回望";

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
  }

  function goNext() {
    if (!canProceed || currentStep >= assessmentDefinition.totalSteps - 1) return;
    setCurrentStep((value) => value + 1);
  }

  function goBack() {
    if (currentStep === 0) return;
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
    setCurrentStep(firstIncompleteStep);
    setError(null);
  }

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
          {(question.options ?? []).map((option) => (
            <OptionButton key={option.id} active={currentValue === option.label} pressed={currentValue === option.label} onClick={() => setAnswer(question.questionId, option.label)}>
              {option.label}
            </OptionButton>
          ))}
        </div>
      );
    }

    if (question.answerType === "multi") {
      const values = Array.isArray(currentValue) ? currentValue : [];
      return (
        <div>
          <div className="grid gap-3 md:grid-cols-2">
            {(question.options ?? []).map((option) => (
              <OptionButton key={option.id} active={values.includes(option.label)} pressed={values.includes(option.label)} onClick={() => toggleMulti(question, option.label)}>
                {option.label}
              </OptionButton>
            ))}
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
            {values.map((value) => {
              const active = currentValue === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAnswer(question.questionId, value)}
                  className={`flex min-h-16 items-center justify-center rounded-[24px] text-lg transition ${
                    active
                      ? "bg-[linear-gradient(135deg,rgba(232,243,255,0.17),rgba(167,193,228,0.11))] text-stone-100 shadow-[0_0_0_1px_rgba(216,232,255,0.18)]"
                      : "bg-black/16 text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                  }`}
                >
                  {value}
                </button>
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

      return (
        <div className="space-y-6">
          <div className="rounded-[28px] bg-[linear-gradient(135deg,rgba(191,222,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_0_0_1px_rgba(191,222,255,0.12)]">
            <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">review atmosphere</p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300/82">这一页不是检查你有没有做对，而是在把散开的线索收拢起来。再看一眼，然后把它交给分析流程去慢慢显影。</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[26px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">完成情况</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300/78">
                <p>生命阶段：{assessmentDefinition.lifeStageOptions.find((item) => item.value === state.lifeStage)?.label ?? state.lifeStage}</p>
                <p>心境关键词：{state.moodKeywords.join(" · ")}</p>
                <p>已回答题目：{answeredCount} / {assessmentDefinition.questions.length}</p>
                <p>开放反思：{openTextCount} / {Math.max(assessmentDefinition.validation.openReflectionQuestionIds.length, requiredOpenReflectionCount)}</p>
              </div>
            </div>
            <div className="rounded-[26px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <p className="text-[11px] tracking-[0.32em] text-stone-500 uppercase">提交前提醒</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300/78">
                <p>接下来会进入异步分析流程，生成一份更像阅读而不是评分的结果。</p>
                <p>至少回答开放反思中的 {requiredOpenReflectionCount} 道，结果会更接近你。</p>
                {!reviewReady ? <p className="text-amber-200/85">当前还有未完成的必答题，或开放反思尚未达到最低数量。</p> : <p className="text-stone-200/88">你已经可以把它交给雾里了。</p>}
              </div>
              {!reviewReady && firstIncompleteStep !== null ? (
                <div className="mt-5 space-y-3">
                  {firstIncompleteLabel ? <p className="text-xs leading-6 text-stone-500">建议先回到：{firstIncompleteLabel}</p> : null}
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

  const heroHeadline = !schemaReady && !schemaError
    ? "正在读取这次的进入方式。"
    : schemaError
      ? "这次入口暂时起雾了。"
      : context.mode === "entry"
        ? "进入你的内在荒野。"
        : context.mode === "review"
          ? "把线索交给雾里。"
          : "不要急着回答，先让问题落在身上。";

  const title = !schemaReady && !schemaError
    ? "正在校准这次进入方式。"
    : schemaError
      ? "这次入口暂时起雾了。"
      : context.mode === "entry"
        ? "先给它几个最基础的坐标。"
        : context.mode === "review"
          ? "最后看一眼，再把它交给雾里。"
          : context.question.prompt;

  const description = !schemaReady && !schemaError
    ? "系统正在加载这次测评的结构与节奏，稍等片刻。"
    : schemaError
      ? schemaError
      : context.mode === "entry"
        ? "这一页不求准确，只求给接下来的阅读一个足够温柔的入口。"
        : context.mode === "review"
          ? "接下来会进入异步分析流程，生成一份更像阅读而不是评分的结果。"
          : context.question.typeMeta.family === "choice" && context.question.typeMeta.cardinality === "multi"
            ? "这不是测你像谁，而是让它看见你反复停留的地方。"
            : context.question.answerType === "scale"
              ? "不必追求绝对答案，只要给出眼下最接近的一格。"
              : context.question.typeMeta.family === "text"
                ? "不用写很多，写一句不会轻易消失的话就够了。"
                : "选最让你停下来的那一个，而不是最合理的那一个。";

  const ritualLine = !schemaReady && !schemaError ? "正在从内核读取这次问题序列。" : getRitualLine(context);
  const companionNote = !schemaReady && !schemaError
    ? { eyebrow: "schema loading", title: "前端现在直接读取测评 schema", body: "这意味着题库、phase、校验与展示节奏都由后端 contract 驱动，后续改题时前端不需要再同步改源码。" }
    : schemaError
      ? { eyebrow: "schema error", title: "结构暂时未能抵达页面", body: "你可以稍后刷新再试；这不会影响已经存在的报告与后端测评定义。" }
      : getCompanionNote(context);

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(185,215,246,0.12),transparent_24%),radial-gradient(circle_at_82%_22%,rgba(113,83,132,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute left-1/2 top-36 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(184,219,255,0.14),transparent_64%)] blur-3xl" />

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
              <h2 className="max-w-2xl text-4xl leading-[1.06] text-stone-100 md:text-[3.45rem]">{heroHeadline}</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-stone-300/76 md:text-lg">{ritualLine}</p>
            </div>
            <div className="rounded-[24px] bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <p className="text-[11px] tracking-[0.28em] text-stone-500 uppercase">当前段落</p>
              <p className="mt-3 text-xl text-stone-100">{currentModuleLabel}</p>
              <p className="mt-2 text-sm leading-7 text-stone-400">{context.mode === "question" ? `问题 ${context.questionIndex + 1} / ${assessmentDefinition.questions.length}` : context.mode === "entry" ? "进入前校准" : "提交前回望"}</p>
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

        <Shell>
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
            <div className="mt-8">{renderStepBody()}</div>
          </motion.div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
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
                  disabled={!canProceed || submitting || !schemaReady || Boolean(schemaError)}
                  onClick={goNext}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(192,220,249,0.92))] px-7 py-3 text-sm tracking-[0.2em] text-[#0b0d14] uppercase transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  下一步
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
