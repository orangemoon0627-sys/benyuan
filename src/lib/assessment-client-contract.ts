import {
  getAssessmentSchemaModuleLabel,
  getAssessmentSchemaStepContext,
  isAssessmentSchemaQuestionAnswered,
  type AssessmentSchemaDefinition,
  type AssessmentSchemaFormState,
  type AssessmentSchemaStepContext,
} from "@/lib/assessment-schema";

export type AssessmentCompanionNote = {
  eyebrow: string;
  title: string;
  body: string;
};

export type AssessmentProgressSnapshot = {
  context: AssessmentSchemaStepContext;
  progress: number;
  openTextCount: number;
  requiredOpenReflectionCount: number;
  requiredQuestionsAnswered: boolean;
  reviewReady: boolean;
  firstIncompleteStep: number | null;
  firstIncompleteLabel: string | null;
  canProceed: boolean;
  currentModuleLabel: string;
};

export type AssessmentScreenCopy = {
  heroHeadline: string;
  title: string;
  description: string;
  ritualLine: string;
  companionNote: AssessmentCompanionNote;
};

function getRitualLine(context: AssessmentSchemaStepContext) {
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

function getCompanionNote(context: AssessmentSchemaStepContext): AssessmentCompanionNote {
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

  if (context.mode === "question" && context.question.answerType === "text") {
    return {
      eyebrow: "open reflection",
      title: "一句没有被迅速撤回的话，就够了",
      body: "开放题不是作文。哪怕只留下一个画面、一个梦、一个反复出现的念头，它也会让结果更像你。",
    };
  }

  if (context.mode === "question" && context.question.answerType === "scale") {
    return {
      eyebrow: "scale cue",
      title: "不必找绝对值，只找眼下最接近的刻度",
      body: "分数不是评价高低，而是帮系统分辨：这件事在你身上更轻，还是更重。",
    };
  }

  if (context.mode === "question" && context.question.answerType === "multi") {
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

export function buildAssessmentProgressSnapshot(
  definition: AssessmentSchemaDefinition,
  currentStep: number,
  state: AssessmentSchemaFormState,
): AssessmentProgressSnapshot {
  const context = getAssessmentSchemaStepContext(definition, currentStep);
  const progress = ((currentStep + 1) / definition.totalSteps) * 100;
  const openTextCount = definition.validation.openReflectionQuestionIds.reduce((count, key) => {
    const value = state.answers[key];
    return typeof value === "string" && value.trim().length > 0 ? count + 1 : count;
  }, 0);

  const requiredQuestionsAnswered = definition.questions.every((question) => isAssessmentSchemaQuestionAnswered(question, state.answers));
  const requiredOpenReflectionCount = definition.validation.requireAtLeastOneOpenReflection ? 1 : 0;
  const reviewReady = requiredQuestionsAnswered && openTextCount >= requiredOpenReflectionCount && state.moodKeywords.length > 0 && Boolean(state.lifeStage);

  let firstIncompleteStep: number | null = definition.questions.findIndex((question) => !isAssessmentSchemaQuestionAnswered(question, state.answers));
  if (firstIncompleteStep >= 0) {
    firstIncompleteStep += 1;
  } else if (openTextCount === 0) {
    const firstOpenQuestionIndex = definition.questions.findIndex((question) => question.answerType === "text");
    firstIncompleteStep = firstOpenQuestionIndex >= 0 ? firstOpenQuestionIndex + 1 : definition.totalSteps - 1;
  } else {
    firstIncompleteStep = null;
  }

  const firstIncompleteLabel =
    firstIncompleteStep === null || firstIncompleteStep <= 0 || firstIncompleteStep >= definition.totalSteps - 1
      ? null
      : `${getAssessmentSchemaModuleLabel(definition, definition.questions[firstIncompleteStep - 1].moduleId)} · 问题 ${firstIncompleteStep} / ${definition.questions.length}`;

  const canProceed =
    context.mode === "entry"
      ? Boolean(state.lifeStage) && state.moodKeywords.length > 0
      : context.mode === "review"
        ? reviewReady
        : isAssessmentSchemaQuestionAnswered(context.question, state.answers);

  const currentModuleLabel =
    context.mode === "question"
      ? getAssessmentSchemaModuleLabel(definition, context.question.moduleId)
      : context.mode === "entry"
        ? "进入状态"
        : "提交前回望";

  return {
    context,
    progress,
    openTextCount,
    requiredOpenReflectionCount,
    requiredQuestionsAnswered,
    reviewReady,
    firstIncompleteStep,
    firstIncompleteLabel,
    canProceed,
    currentModuleLabel,
  };
}

export function buildAssessmentScreenCopy(options: {
  definition: AssessmentSchemaDefinition;
  currentStep: number;
  state: AssessmentSchemaFormState;
  schemaReady: boolean;
  schemaError: string | null;
}): AssessmentScreenCopy {
  const { definition, currentStep, state, schemaReady, schemaError } = options;
  const snapshot = buildAssessmentProgressSnapshot(definition, currentStep, state);

  if (!schemaReady && !schemaError) {
    return {
      heroHeadline: "正在读取这次的进入方式。",
      title: "正在校准这次进入方式。",
      description: "系统正在加载这次测评的结构与节奏，稍等片刻。",
      ritualLine: "正在从内核读取这次问题序列。",
      companionNote: {
        eyebrow: "schema loading",
        title: "前端现在直接读取测评 schema",
        body: "这意味着题库、phase、校验与展示节奏都由后端 contract 驱动，后续改题时前端不需要再同步改源码。",
      },
    };
  }

  if (schemaError) {
    return {
      heroHeadline: "这次入口暂时起雾了。",
      title: "这次入口暂时起雾了。",
      description: schemaError,
      ritualLine: getRitualLine(snapshot.context),
      companionNote: {
        eyebrow: "schema error",
        title: "结构暂时未能抵达页面",
        body: "你可以稍后刷新再试；这不会影响已经存在的报告与后端测评定义。",
      },
    };
  }

  const { context } = snapshot;

  return {
    heroHeadline:
      context.mode === "entry"
        ? "进入你的内在荒野。"
        : context.mode === "review"
          ? "把线索交给雾里。"
          : "不要急着回答，先让问题落在身上。",
    title:
      context.mode === "entry"
        ? "先给它几个最基础的坐标。"
        : context.mode === "review"
          ? "最后看一眼，再把它交给雾里。"
          : context.question.prompt,
    description:
      context.mode === "entry"
        ? "这一页不求准确，只求给接下来的阅读一个足够温柔的入口。"
        : context.mode === "review"
          ? "接下来会进入异步分析流程，生成一份更像阅读而不是评分的结果。"
          : context.question.typeMeta.family === "choice" && context.question.typeMeta.cardinality === "multi"
            ? "这不是测你像谁，而是让它看见你反复停留的地方。"
            : context.question.answerType === "scale"
              ? "不必追求绝对答案，只要给出眼下最接近的一格。"
              : context.question.typeMeta.family === "text"
                ? "不用写很多，写一句不会轻易消失的话就够了。"
                : "选最让你停下来的那一个，而不是最合理的那一个。",
    ritualLine: getRitualLine(context),
    companionNote: getCompanionNote(context),
  };
}
