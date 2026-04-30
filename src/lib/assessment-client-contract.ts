import {
  getAssessmentSchemaModuleLabel,
  getAssessmentSchemaStepContext,
  isAssessmentSchemaQuestionAnswered,
  type AssessmentSchemaCompanionNote,
  type AssessmentSchemaDefinition,
  type AssessmentSchemaFlowContract,
  type AssessmentSchemaFlowStep,
  type AssessmentSchemaFormState,
  type AssessmentSchemaNativeBlueprintContract,
  type AssessmentSchemaNativeMap,
  type AssessmentSchemaNativePresentationHints,
  type AssessmentSchemaPhase,
  type AssessmentSchemaQuestion,
  type AssessmentSchemaStepContext,
  type AssessmentSchemaNativeBlueprint,
  type AssessmentSchemaNativeContentBlock,
  type AssessmentSchemaNativeScreen,
} from "@/lib/assessment-schema";

export type AssessmentCompanionNote = AssessmentSchemaCompanionNote;

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

type AssessmentFlowDefinitionInput = Pick<
  AssessmentSchemaDefinition,
  "totalSteps" | "phases" | "questions" | "validation" | "moduleLabels"
>;

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

function getNativePresentationHints(context: AssessmentSchemaStepContext): AssessmentSchemaNativePresentationHints {
  if (context.mode === "entry") {
    return {
      screenStyle: "entry_sheet",
      accentTone: "mist",
      iosPreferredControl: "tag_picker",
      iosPreferredTransition: "blur_expand",
      responseLayout: "chips",
      haptics: "selection",
      topBarStyle: "ambient_back",
      primaryActionStyle: "floating_capsule",
      optionChrome: "ghost_chips",
      backgroundTreatment: "breathing_mist",
      motionPreset: "slow_breathe",
      spacingDensity: "airy",
      keepPrimaryActionPinned: true,
      supportsLongformInput: false,
      recommendedInputMinHeight: null,
      recommendedSelectionCount: { min: 1, max: null },
    };
  }

  if (context.mode === "review") {
    return {
      screenStyle: "review_summary",
      accentTone: "review",
      iosPreferredControl: "summary_list",
      iosPreferredTransition: "cross_dissolve",
      responseLayout: "summary",
      haptics: "soft_impact",
      topBarStyle: "summary_header",
      primaryActionStyle: "immersive_submit",
      optionChrome: "summary_panels",
      backgroundTreatment: "review_halo",
      motionPreset: "still_focus",
      spacingDensity: "balanced",
      keepPrimaryActionPinned: true,
      supportsLongformInput: false,
      recommendedInputMinHeight: null,
      recommendedSelectionCount: null,
    };
  }

  if (context.question.typeMeta.family === "text") {
    return {
      screenStyle: "reflection_editor",
      accentTone: "memory",
      iosPreferredControl: "multiline_text",
      iosPreferredTransition: "fade",
      responseLayout: "editor",
      haptics: "none",
      topBarStyle: "progress_header",
      primaryActionStyle: "pinned_footer_cta",
      optionChrome: "journal_surface",
      backgroundTreatment: "memory_fog",
      motionPreset: "still_focus",
      spacingDensity: "airy",
      keepPrimaryActionPinned: true,
      supportsLongformInput: true,
      recommendedInputMinHeight: 180,
      recommendedSelectionCount: null,
    };
  }

  if (context.question.typeMeta.family === "scale") {
    return {
      screenStyle: "focused_scale",
      accentTone: context.question.moduleId === "temporal_philosophy" ? "memory" : "signal",
      iosPreferredControl: "stepper_scale",
      iosPreferredTransition: "push",
      responseLayout: "slider",
      haptics: "selection",
      topBarStyle: "progress_header",
      primaryActionStyle: "pinned_footer_cta",
      optionChrome: "numbered_scale",
      backgroundTreatment: context.question.moduleId === "temporal_philosophy" ? "memory_fog" : "signal_glow",
      motionPreset: "guided_push",
      spacingDensity: "balanced",
      keepPrimaryActionPinned: true,
      supportsLongformInput: false,
      recommendedInputMinHeight: null,
      recommendedSelectionCount: { min: 1, max: 1 },
    };
  }

  if (context.question.typeMeta.cardinality === "multi") {
    return {
      screenStyle: "immersive_choice",
      accentTone: context.question.moduleId === "aesthetic_fingerprint" ? "memory" : "signal",
      iosPreferredControl: "multi_select_chips",
      iosPreferredTransition: "push",
      responseLayout: "chips",
      haptics: "selection",
      topBarStyle: "progress_header",
      primaryActionStyle: "pinned_footer_cta",
      optionChrome: "ghost_chips",
      backgroundTreatment: context.question.moduleId === "aesthetic_fingerprint" ? "memory_fog" : "signal_glow",
      motionPreset: "guided_push",
      spacingDensity: "balanced",
      keepPrimaryActionPinned: true,
      supportsLongformInput: false,
      recommendedInputMinHeight: null,
      recommendedSelectionCount: {
        min: context.question.minSelections ?? 1,
        max: context.question.maxSelections ?? null,
      },
    };
  }

  return {
    screenStyle: "immersive_choice",
    accentTone:
      context.question.moduleId === "aesthetic_fingerprint" || context.question.moduleId === "open_reflection"
        ? "memory"
        : context.question.moduleId === "temporal_philosophy"
          ? "mist"
          : "signal",
    iosPreferredControl: "single_select_cards",
    iosPreferredTransition: "push",
    responseLayout: context.question.presentation?.columns === 2 ? "grid_2" : "stack",
    haptics: "selection",
    topBarStyle: "progress_header",
    primaryActionStyle: "pinned_footer_cta",
    optionChrome: "mist_cards",
    backgroundTreatment:
      context.question.moduleId === "aesthetic_fingerprint"
        ? "memory_fog"
        : context.question.moduleId === "temporal_philosophy"
          ? "breathing_mist"
          : "signal_glow",
    motionPreset: "guided_push",
    spacingDensity: context.question.presentation?.columns === 2 ? "compact" : "balanced",
    keepPrimaryActionPinned: true,
    supportsLongformInput: false,
    recommendedInputMinHeight: null,
    recommendedSelectionCount: { min: 1, max: 1 },
  };
}

function buildScreenCopyForContext(context: AssessmentSchemaStepContext): AssessmentScreenCopy {
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

function findPhaseForQuestion(phases: AssessmentSchemaPhase[], question: AssessmentSchemaQuestion) {
  return phases.find((phase) => phase.moduleIds.includes(question.moduleId));
}

function getFallbackPhase(kind: AssessmentSchemaFlowStep["kind"]): AssessmentSchemaPhase {
  if (kind === "entry") {
    return {
      id: "entry",
      label: "进入状态",
      description: "给这次探索一个起点坐标。",
      moduleIds: ["entry_state"],
    };
  }

  return {
    id: "review",
    label: "提交前回望",
    description: "收拢线索，准备进入分析。",
    moduleIds: ["review_state"],
  };
}

function resolveFlowStepMeta(definition: AssessmentFlowDefinitionInput, step: number) {
  const context = getAssessmentSchemaStepContext(definition, step);
  const kind: AssessmentSchemaFlowStep["kind"] = context.mode;
  const copy = buildScreenCopyForContext(context);

  if (context.mode === "question") {
    const phase = findPhaseForQuestion(definition.phases, context.question) ?? getFallbackPhase("review");
    const phaseQuestions = definition.questions.filter((question) => phase.moduleIds.includes(question.moduleId));
    const phaseQuestionIndex = phaseQuestions.findIndex((question) => question.questionId === context.question.questionId);

    return {
      context,
      kind,
      copy,
      phase,
      moduleId: context.question.moduleId,
      moduleLabel: getAssessmentSchemaModuleLabel(definition, context.question.moduleId),
      questionId: context.question.questionId,
      questionIndex: context.questionIndex,
      answerType: context.question.answerType,
      questionCount: definition.questions.length,
      phaseStepIndex: phaseQuestionIndex >= 0 ? phaseQuestionIndex + 1 : 1,
      phaseStepCount: phaseQuestions.length || 1,
    };
  }

  const phase = context.mode === "entry" ? definition.phases[0] ?? getFallbackPhase("entry") : getFallbackPhase("review");
  const moduleId = context.mode === "entry" ? "entry_state" : "review_state";
  const moduleLabel = context.mode === "entry" ? "进入状态" : "提交前回望";

  return {
    context,
    kind,
    copy,
    phase,
    moduleId,
    moduleLabel,
    questionId: null,
    questionIndex: null,
    answerType: null,
    questionCount: definition.questions.length,
    phaseStepIndex: 1,
    phaseStepCount: 1,
  };
}

export function buildAssessmentFlowContract(definition: AssessmentFlowDefinitionInput): AssessmentSchemaFlowContract {
  const requiredOpenReflectionCount = definition.validation.requireAtLeastOneOpenReflection ? 1 : 0;
  const steps = Array.from({ length: definition.totalSteps }, (_, step) => {
    const meta = resolveFlowStepMeta(definition, step);

    return {
      step,
      progress: ((step + 1) / definition.totalSteps) * 100,
      kind: meta.kind,
      phaseId: meta.phase.id,
      phaseLabel: meta.phase.label,
      phaseDescription: meta.phase.description,
      moduleId: meta.moduleId,
      moduleLabel: meta.moduleLabel,
      questionId: meta.questionId,
      questionIndex: meta.questionIndex,
      questionCount: meta.questionCount,
      phaseStepIndex: meta.phaseStepIndex,
      phaseStepCount: meta.phaseStepCount,
      previousStep: step > 0 ? step - 1 : null,
      nextStep: step < definition.totalSteps - 1 ? step + 1 : null,
      answerType: meta.answerType,
      heroHeadline: meta.copy.heroHeadline,
      title: meta.copy.title,
      description: meta.copy.description,
      ritualLine: meta.copy.ritualLine,
      companionNote: meta.copy.companionNote,
      nativeHints: getNativePresentationHints(meta.context),
    } satisfies AssessmentSchemaFlowStep;
  });

  return {
    pacing: {
      pattern: "single_question_progression",
      progressMetric: "step_index_ratio",
      supportsBackNavigation: true,
      supportsDraftPersistence: true,
      entryStep: 0,
      firstQuestionStep: 1,
      lastQuestionStep: Math.max(definition.totalSteps - 2, 0),
      reviewStep: Math.max(definition.totalSteps - 1, 0),
      questionStepCount: definition.questions.length,
    },
    review: {
      requireLifeStage: true,
      minimumMoodKeywords: 1,
      requireAllRequiredQuestions: true,
      requiredOpenReflectionCount,
      openReflectionQuestionIds: definition.validation.openReflectionQuestionIds,
      incompleteJumpStrategy: "first_incomplete_step",
    },
    steps,
  };
}

function getNativeScreenBlueprint(step: AssessmentSchemaFlowStep): AssessmentSchemaNativeBlueprint {
  if (step.kind === "entry") return "entry_calibration";
  if (step.kind === "review") return "review_handoff";
  if (step.nativeHints.iosPreferredControl === "multiline_text") return "reflection_journal";
  if (step.nativeHints.iosPreferredControl === "stepper_scale") return "scale_focus";
  if (step.nativeHints.iosPreferredControl === "multi_select_chips") return "multi_choice_ritual";
  return "single_choice_ritual";
}

function getNativeScreenContentBlocks(step: AssessmentSchemaFlowStep): AssessmentSchemaNativeContentBlock[] {
  if (step.kind === "entry") return ["hero", "progress", "prompt", "options", "companion_note"];
  if (step.kind === "review") return ["hero", "summary", "companion_note"];
  if (step.nativeHints.iosPreferredControl === "multiline_text") return ["hero", "progress", "prompt", "reflection", "companion_note"];
  return ["hero", "progress", "prompt", "options", "companion_note"];
}

function getNativePrimaryActionLabel(step: AssessmentSchemaFlowStep) {
  return step.kind === "review" ? "提交并开始分析" : "继续";
}

function buildNativeBlueprintCatalog(): AssessmentSchemaNativeBlueprintContract[] {
  return [
    {
      blueprint: "entry_calibration",
      recommendedComponentName: "EntryCalibrationScreen",
      recommendedContainer: "immersive_scroll_shell",
      primaryInputSlot: "entry_tag_stack",
      footerSlot: "floating_continue",
      requiredBlocks: ["hero", "prompt", "options", "companion_note"],
      optionalBlocks: ["progress"],
      propsContract: [
        { name: "lifeStageOptions", type: "Array<Option>", required: true, description: "生命阶段选项列表。" },
        { name: "moodKeywordOptions", type: "Array<string>", required: true, description: "可选心境标签集合。" },
        { name: "selectedLifeStage", type: "string", required: true, description: "当前已选生命阶段值。" },
        { name: "selectedMoodKeywords", type: "Array<string>", required: true, description: "当前已选心境标签值。" },
      ],
      implementationChecklist: [
        { key: "entry-sync", label: "入口状态双向绑定", doneWhen: "修改 life stage / mood keywords 后能实时写回表单状态。" },
        { key: "entry-cta", label: "CTA 可用性校验", doneWhen: "至少选中 1 个 mood keyword 且有 life stage 后继续按钮才可用。" },
      ],
      implementationNotes: [
        "将生命阶段与心境标签合并为同一屏的双区块输入。",
        "CTA 建议漂浮在底部雾层之上，弱化传统导航感。",
      ],
    },
    {
      blueprint: "single_choice_ritual",
      recommendedComponentName: "SingleChoiceRitualScreen",
      recommendedContainer: "immersive_scroll_shell",
      primaryInputSlot: "choice_card_stack",
      footerSlot: "sticky_continue",
      requiredBlocks: ["hero", "progress", "prompt", "options", "companion_note"],
      optionalBlocks: [],
      propsContract: [
        { name: "question", type: "SchemaQuestion", required: true, description: "当前题目及其选项。" },
        { name: "selectedOptionId", type: "string | null", required: true, description: "当前单选答案。" },
        { name: "progress", type: "number", required: true, description: "当前步骤进度百分比。" },
        { name: "companionNote", type: "CompanionNote", required: true, description: "右侧/下方陪伴性说明。" },
      ],
      implementationChecklist: [
        { key: "single-focus", label: "单题聚焦呈现", doneWhen: "一屏只显示当前问题，不混入下一题内容。" },
        { key: "single-submit", label: "答案驱动 CTA", doneWhen: "未选择时继续按钮不可用，选择后立即可进入下一步。" },
      ],
      implementationNotes: [
        "单选题优先使用纵向卡片流，保持一屏聚焦一个问题。",
        "如果 layout 为 grid_2，可切换为两列但保留相同 CTA 区。",
      ],
    },
    {
      blueprint: "multi_choice_ritual",
      recommendedComponentName: "MultiChoiceRitualScreen",
      recommendedContainer: "immersive_scroll_shell",
      primaryInputSlot: "choice_chip_cloud",
      footerSlot: "sticky_continue",
      requiredBlocks: ["hero", "progress", "prompt", "options", "companion_note"],
      optionalBlocks: [],
      propsContract: [
        { name: "question", type: "SchemaQuestion", required: true, description: "包含 min/max 约束的多选题。" },
        { name: "selectedOptionIds", type: "Array<string>", required: true, description: "当前多选答案集合。" },
        { name: "selectionRange", type: "{min:number,max:number|null}", required: true, description: "多选约束，供底部状态提示使用。" },
        { name: "progress", type: "number", required: true, description: "当前步骤进度百分比。" },
      ],
      implementationChecklist: [
        { key: "multi-range", label: "最小/最大选择反馈", doneWhen: "在未达到 min 或超过 max 时，界面给出明确约束反馈。" },
        { key: "multi-state", label: "多选态视觉一致", doneWhen: "选中与未选中 chips/card 状态在动效与色调上保持一致。" },
      ],
      implementationNotes: [
        "多选题建议使用 wrap chips 或轻卡片云，选中状态依赖色调与轻 haptic。",
        "当存在 min/max 选择限制时，优先在 CTA 附近给即时反馈。",
      ],
    },
    {
      blueprint: "scale_focus",
      recommendedComponentName: "ScaleFocusScreen",
      recommendedContainer: "focus_scroll_shell",
      primaryInputSlot: "scale_stepper",
      footerSlot: "sticky_continue",
      requiredBlocks: ["hero", "progress", "prompt", "options", "companion_note"],
      optionalBlocks: [],
      propsContract: [
        { name: "question", type: "SchemaQuestion", required: true, description: "包含 scaleMin / scaleMax / scaleLabels 的量表题。" },
        { name: "selectedValue", type: "number | null", required: true, description: "当前量表值。" },
        { name: "scaleLabels", type: "{low:string,high:string}", required: false, description: "量表两端文案。" },
        { name: "progress", type: "number", required: true, description: "当前步骤进度百分比。" },
      ],
      implementationChecklist: [
        { key: "scale-center", label: "量表为视觉中心", doneWhen: "用户进入页面后第一注意力落在量表控件而不是外层容器。" },
        { key: "scale-tap", label: "离散刻度可点击", doneWhen: "每个刻度都可直接点击，不要求拖拽才能完成选择。" },
      ],
      implementationNotes: [
        "量表题建议让刻度本身成为视觉中心，避免和普通选择题共用卡片壳。",
        "适合使用横向 stepper、分段 slider 或 tappable marks。",
      ],
    },
    {
      blueprint: "reflection_journal",
      recommendedComponentName: "ReflectionJournalScreen",
      recommendedContainer: "focus_scroll_shell",
      primaryInputSlot: "journal_editor",
      footerSlot: "sticky_continue",
      requiredBlocks: ["hero", "progress", "prompt", "reflection", "companion_note"],
      optionalBlocks: [],
      propsContract: [
        { name: "question", type: "SchemaQuestion", required: true, description: "当前开放反思题。" },
        { name: "textValue", type: "string", required: true, description: "当前输入内容。" },
        { name: "minEditorHeight", type: "number", required: false, description: "建议输入区域最小高度。" },
        { name: "canSkip", type: "boolean", required: true, description: "是否允许用户留空继续。" },
      ],
      implementationChecklist: [
        { key: "journal-focus", label: "输入区优先级", doneWhen: "键盘展开后输入区与 CTA 都仍然可见。" },
        { key: "journal-softness", label: "开放题语气提示", doneWhen: "companion note 或 hint 能明确传达‘不求长，只求真’。" },
      ],
      implementationNotes: [
        "开放题优先保证输入面干净、键盘抬起后 CTA 仍可达。",
        "建议保留 companion note，帮助用户理解这里不求篇幅，只求真实。",
      ],
    },
    {
      blueprint: "review_handoff",
      recommendedComponentName: "ReviewHandoffScreen",
      recommendedContainer: "summary_scroll_shell",
      primaryInputSlot: "summary_review_list",
      footerSlot: "immersive_submit",
      requiredBlocks: ["hero", "summary", "companion_note"],
      optionalBlocks: ["progress"],
      propsContract: [
        { name: "summaryItems", type: "Array<SummaryRow>", required: true, description: "回顾页展示的已答状态与摘要条目。" },
        { name: "reviewReady", type: "boolean", required: true, description: "当前是否满足提交条件。" },
        { name: "firstIncompleteStep", type: "number | null", required: true, description: "首个未完成步骤，用于跳转。" },
        { name: "submitLabel", type: "string", required: true, description: "底部提交按钮文案。" },
      ],
      implementationChecklist: [
        { key: "review-gate", label: "提交门槛与提示", doneWhen: "未满足 reviewReady 时能看到阻塞原因且 CTA 不可提交。" },
        { key: "review-jump", label: "跳回未完成处", doneWhen: "存在未完成步骤时可一键跳回对应 step。" },
      ],
      implementationNotes: [
        "review 屏建议强化‘回望与交付’感，而不是传统表单确认页。",
        "如果 supportsProgressJump=true，可在摘要块内提供跳回未完成处的动作。",
      ],
    },
  ];
}

export function buildAssessmentNativeScreenMap(flow: AssessmentSchemaFlowContract): AssessmentSchemaNativeMap {
  const screenMap = flow.steps.map((step) => {
    const blueprint = getNativeScreenBlueprint(step);
    return {
      step: step.step,
      screenId: `step-${String(step.step + 1).padStart(2, "0")}-${blueprint}`,
      blueprint,
      headline: step.heroHeadline,
      primaryPrompt: step.title,
      componentTokens: {
        topBarStyle: step.nativeHints.topBarStyle,
        primaryActionStyle: step.nativeHints.primaryActionStyle,
        optionChrome: step.nativeHints.optionChrome,
      },
      interactionTokens: {
        control: step.nativeHints.iosPreferredControl,
        transition: step.nativeHints.iosPreferredTransition,
        layout: step.nativeHints.responseLayout,
        haptics: step.nativeHints.haptics,
      },
      atmosphereTokens: {
        accentTone: step.nativeHints.accentTone,
        backgroundTreatment: step.nativeHints.backgroundTreatment,
        motionPreset: step.nativeHints.motionPreset,
        spacingDensity: step.nativeHints.spacingDensity,
      },
      contentBlocks: getNativeScreenContentBlocks(step),
      primaryActionLabel: getNativePrimaryActionLabel(step),
      supportsProgressJump: step.kind === "review",
    } satisfies AssessmentSchemaNativeScreen;
  });

  return {
    platform: "ios",
    blueprintSequence: screenMap.map((screen) => screen.blueprint),
    blueprintCatalog: buildNativeBlueprintCatalog(),
    screenMap,
  };
}

function getFlowStep(definition: AssessmentSchemaDefinition, currentStep: number) {
  return definition.flow.steps[currentStep] ?? definition.flow.steps[0] ?? null;
}

export function buildAssessmentProgressSnapshot(
  definition: AssessmentSchemaDefinition,
  currentStep: number,
  state: AssessmentSchemaFormState,
): AssessmentProgressSnapshot {
  const context = getAssessmentSchemaStepContext(definition, currentStep);
  const flowStep = getFlowStep(definition, currentStep);
  const progress = flowStep?.progress ?? ((currentStep + 1) / definition.totalSteps) * 100;
  const openTextCount = definition.flow.review.openReflectionQuestionIds.reduce((count, key) => {
    const value = state.answers[key];
    return typeof value === "string" && value.trim().length > 0 ? count + 1 : count;
  }, 0);

  const requiredQuestionsAnswered = definition.questions.every((question) => isAssessmentSchemaQuestionAnswered(question, state.answers));
  const requiredOpenReflectionCount = definition.flow.review.requiredOpenReflectionCount;
  const hasMinimumMoodKeywords = state.moodKeywords.length >= definition.flow.review.minimumMoodKeywords;
  const hasRequiredLifeStage = !definition.flow.review.requireLifeStage || Boolean(state.lifeStage);
  const reviewReady = requiredQuestionsAnswered && openTextCount >= requiredOpenReflectionCount && hasMinimumMoodKeywords && hasRequiredLifeStage;

  let firstIncompleteStep: number | null = null;
  if (!hasRequiredLifeStage || !hasMinimumMoodKeywords) {
    firstIncompleteStep = definition.flow.pacing.entryStep;
  } else {
    const firstIncompleteQuestionIndex = definition.questions.findIndex((question) => !isAssessmentSchemaQuestionAnswered(question, state.answers));
    if (firstIncompleteQuestionIndex >= 0) {
      firstIncompleteStep = firstIncompleteQuestionIndex + definition.flow.pacing.firstQuestionStep;
    } else if (openTextCount < requiredOpenReflectionCount) {
      const firstOpenQuestionIndex = definition.questions.findIndex((question) => definition.flow.review.openReflectionQuestionIds.includes(question.questionId));
      firstIncompleteStep = firstOpenQuestionIndex >= 0 ? firstOpenQuestionIndex + definition.flow.pacing.firstQuestionStep : definition.flow.pacing.reviewStep;
    }
  }

  const firstIncompleteLabel =
    firstIncompleteStep === null || firstIncompleteStep <= definition.flow.pacing.entryStep || firstIncompleteStep >= definition.flow.pacing.reviewStep
      ? null
      : (() => {
          const incompleteStep = getFlowStep(definition, firstIncompleteStep);
          if (!incompleteStep || incompleteStep.questionIndex === null) return null;
          return `${incompleteStep.moduleLabel} · 问题 ${incompleteStep.questionIndex + 1} / ${definition.questions.length}`;
        })();

  const canProceed =
    context.mode === "entry"
      ? hasRequiredLifeStage && hasMinimumMoodKeywords
      : context.mode === "review"
        ? reviewReady
        : isAssessmentSchemaQuestionAnswered(context.question, state.answers);

  const currentModuleLabel = flowStep?.moduleLabel ?? (context.mode === "question" ? getAssessmentSchemaModuleLabel(definition, context.question.moduleId) : context.mode === "entry" ? "进入状态" : "提交前回望");

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

  const flowStep = getFlowStep(definition, currentStep);
  if (flowStep) {
    return {
      heroHeadline: flowStep.heroHeadline,
      title: flowStep.title,
      description: flowStep.description,
      ritualLine: flowStep.ritualLine,
      companionNote: flowStep.companionNote,
    };
  }

  return buildScreenCopyForContext(snapshot.context);
}
