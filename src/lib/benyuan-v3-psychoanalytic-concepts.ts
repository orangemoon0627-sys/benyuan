import { getQuestionOption, getQuestionOptionTags } from "@/lib/benyuan-v3-schema";
import { getTheaterAct2ChoiceText, getTheaterMirrorChoiceText } from "@/lib/benyuan-v3-theater-labels";
import type { Part1Record, Part2Record } from "@/lib/benyuan-v3-types";

export type PsychoanalyticConceptCard = {
  id: string;
  school: string;
  zhName: string;
  coreMeaning: string;
  useWhen: string[];
  avoid: string[];
  safeLanguage: string[];
  starMetaphors: string[];
  signalHints: string[];
};

export type SelectedPsychoanalyticConcept = {
  concept: PsychoanalyticConceptCard;
  strength: "strong_signal" | "medium_signal" | "weak_signal";
  evidence: string[];
};

export const BENYUAN_PSYCHOANALYTIC_CONCEPTS: PsychoanalyticConceptCard[] = [
  {
    id: "jung_shadow",
    school: "Jungian psychology",
    zhName: "阴影",
    coreMeaning: "个体不愿承认、暂时绕开或尚未整合的心理内容，它不必然负面，也可能包含生命力。",
    useWhen: ["用户反复绕开直接表达或直接进入", "素材里出现暗处、遮挡、裂缝、背影、低光"],
    avoid: ["不要判断用户有创伤", "不要把阴影写成危险或病态"],
    safeLanguage: ["你绕开的部分未必是敌人，它可能只是还没有被安放好的力量。"],
    starMetaphors: ["暗面", "食相", "背光星尘"],
    signalHints: ["shadow", "avoid", "withheld", "dark", "low light", "裂", "暗", "绕开"],
  },
  {
    id: "jung_persona",
    school: "Jungian psychology",
    zhName: "人格面具",
    coreMeaning: "个体为了进入外部世界而形成的适应性表面，它保护真实自我，也可能遮住真实需求。",
    useWhen: ["用户选择维持平静、表现得没事", "社交文本有克制、半公开、选择性表达"],
    avoid: ["不要说用户虚伪", "不要把适应性表达贬低成伪装"],
    safeLanguage: ["这层外壳不是虚假，而是你进入世界时使用的一种温和保护。"],
    starMetaphors: ["外层光壳", "薄月面具", "玻璃层"],
    signalHints: ["performativity", "self_presentation", "reserved", "mask", "没事", "表面"],
  },
  {
    id: "jung_individuation",
    school: "Jungian psychology",
    zhName: "个体化",
    coreMeaning: "把分散、矛盾和未命名的自我部分慢慢带回同一条生命轨道的过程。",
    useWhen: ["用户反复追问我是谁、如何成为自己", "选择不愿只按外界期待行动"],
    avoid: ["不要把个体化写成优越感", "不要许诺用户会抵达完整答案"],
    safeLanguage: ["这更像一条把分散的自己慢慢收回来的路。"],
    starMetaphors: ["主星成形", "内在星核", "归心轨道"],
    signalHints: ["self_exploration", "identity", "become", "我是谁", "自己"],
  },
  {
    id: "freud_defense",
    school: "Psychoanalysis",
    zhName: "防御方式",
    coreMeaning: "自我面对不确定、失控或过度刺激时，用来保护自身连续性的心理动作。",
    useWhen: ["用户多次选择先观察、分析、延迟、转移注意", "剧场里停下、回望、先看清再进入"],
    avoid: ["不要把防御写成缺陷", "不要输出临床诊断"],
    safeLanguage: ["这不是退缩，而是你让自己先保持完整的一种方式。"],
    starMetaphors: ["外层轨道", "防护环", "边界光圈"],
    signalHints: ["rational", "systematic", "observe", "delay", "avoidant", "停下", "先看清", "观察"],
  },
  {
    id: "freud_repression",
    school: "Psychoanalysis",
    zhName: "压抑",
    coreMeaning: "把一时难以承受的情绪、欲望或表达放到更深处，等待更安全的时机出现。",
    useWhen: ["用户选择先压住、先放一边、表面平静底下暗流", "文本里有未说出口、还没找到房间"],
    avoid: ["不要判断创伤", "不要鼓励强行挖掘"],
    safeLanguage: ["有些东西被你暂时放到深处，不是消失，而是在等待合适的容器。"],
    starMetaphors: ["沉入暗海", "低光海床", "未显影星尘"],
    signalHints: ["repressive", "implicit_emotion", "unsaid", "withheld", "没说出口", "暗流"],
  },
  {
    id: "freud_projection",
    school: "Psychoanalysis",
    zhName: "投射",
    coreMeaning: "内部感受借由外部画面、人物、作品或空间显影出来，让人得以间接辨认自己。",
    useWhen: ["用户被某类画面、作品、句子强烈击中", "上传素材呈现重复意象"],
    avoid: ["不要说用户误解外界", "不要把投射写成错误"],
    safeLanguage: ["这些画面像把你尚未说清的部分暂时保存到了外部。"],
    starMetaphors: ["镜面星云", "反光轨道", "外部星镜"],
    signalHints: ["aesthetic", "visual", "resonance", "projection", "画面", "句子", "作品"],
  },
  {
    id: "freud_repetition",
    school: "Psychoanalysis",
    zhName: "重复",
    coreMeaning: "个体反复回到相似情境、选择或关系姿态中，试图给未完成的东西找到新结局。",
    useWhen: ["多题出现同类选择", "剧场选择重复停留、回望、先确认边界"],
    avoid: ["不要说用户被困住", "不要写成命中注定"],
    safeLanguage: ["重复并不只是循环，也可能是你在寻找更能安放自己的新走法。"],
    starMetaphors: ["回环星轨", "潮汐回返", "重复轨道"],
    signalHints: ["repeated", "cycle", "return", "again", "回望", "反复", "循环"],
  },
  {
    id: "desire_structure",
    school: "Psychoanalysis",
    zhName: "欲望结构",
    coreMeaning: "用户被什么吸引、如何克制、如何试探靠近，以及什么会让生命力重新点燃。",
    useWhen: ["用户面对想要时先分析、压住、给小位置或冒险", "作品和场景里出现强吸引"],
    avoid: ["不要过度性化解释", "不要把欲望写成危险"],
    safeLanguage: ["你真正被吸引的方向，不一定要立刻改变全部生活，也可以先拥有一个小位置。"],
    starMetaphors: ["主星燃料", "引力源", "暗金火种"],
    signalHints: ["desire", "want", "attraction", "risk_taking", "靠近", "想要"],
  },
  {
    id: "lack",
    school: "Lacanian psychoanalysis",
    zhName: "缺失",
    coreMeaning: "一种始终觉得尚未完整、尚未抵达的内在空处，它会推动追问、审美和选择。",
    useWhen: ["用户反复选择远景、空房间、旧物、未完成问题", "夜间思考里出现尚未抵达自己"],
    avoid: ["不要说用户不完整", "不要制造匮乏焦虑"],
    safeLanguage: ["这片空处不一定是匮乏，也可能是你为意义保留的位置。"],
    starMetaphors: ["空心星核", "未命名星域", "深空留白"],
    signalHints: ["lack", "empty", "unfinished", "not arrived", "留白", "空", "未完成"],
  },
  {
    id: "mirror_stage",
    school: "Lacanian psychoanalysis",
    zhName: "镜像",
    coreMeaning: "个体通过他人的回应、作品的照见或镜面场景重新确认自身轮廓。",
    useWhen: ["用户选择需要被懂、被回应、被一句话照见", "剧场镜面问题承担确认功能"],
    avoid: ["不要说用户依赖评价", "不要把被看见需求写成脆弱"],
    safeLanguage: ["被看见不等于依赖外界，它也可以是你确认轮廓的一种方式。"],
    starMetaphors: ["反光轨道", "镜面月海", "回声星镜"],
    signalHints: ["mirror", "being_known", "external_reference", "understood", "被看见", "懂我"],
  },
  {
    id: "big_other",
    school: "Lacanian psychoanalysis",
    zhName: "他者",
    coreMeaning: "外部目光、规则和评价系统在主体内部留下的位置，会影响表达和选择。",
    useWhen: ["用户担心误解、别人的合理性、外部评价", "剧场选择调暗别人眼中的光"],
    avoid: ["不要把他者写成压迫阴谋", "不要武断判断家庭或社会创伤"],
    safeLanguage: ["外部目光曾经参与塑造你，但它不必永远决定你的方向。"],
    starMetaphors: ["远星引力", "外部光压", "他者轨道"],
    signalHints: ["external", "others", "validation", "别人", "评价", "目光"],
  },
  {
    id: "object_distance",
    school: "Object relations",
    zhName: "客体距离",
    coreMeaning: "人在亲密中调节靠近与保持自我位置的距离方式。",
    useWhen: ["用户选择靠近可以但不要太快知道全部", "关系题反复出现保留、缝隙、慢速"],
    avoid: ["不要判断依恋类型为疾病", "不要把保留写成拒绝亲密"],
    safeLanguage: ["你不是拒绝靠近，只是在寻找不会吞没自我位置的距离。"],
    starMetaphors: ["双星距离", "边界轨道", "半掩的月门"],
    signalHints: ["boundary", "strong_boundary", "slow_disclosure", "distance", "保留", "距离", "边界"],
  },
  {
    id: "engulfment_fear",
    school: "Object relations",
    zhName: "被吞没感",
    coreMeaning: "当连接太快或太满时，个体担心自己的轮廓被他人的需求、解释或期待淹没。",
    useWhen: ["用户强调不要太快进入、不要过早解释", "黑洞、强引力、靠近前确认光的温度"],
    avoid: ["不要把亲密写成危险", "不要暗示用户无法亲密"],
    safeLanguage: ["你警惕的不是靠近本身，而是没有边界的引力。"],
    starMetaphors: ["引力过载", "事件视界", "黑潮边缘"],
    signalHints: ["black_hole", "engulf", "too fast", "fusion_desire", "事件视界", "吞没", "黑洞"],
  },
  {
    id: "separation_anxiety",
    school: "Attachment theory",
    zhName: "分离焦虑",
    coreMeaning: "关系可能变远、回应可能断裂时，个体对连接连续性的高度敏感。",
    useWhen: ["用户注意语气变化、等待回应、夜里想起关系", "社交文本围绕未寄出的话"],
    avoid: ["不要诊断焦虑症", "不要把关系需求贬成不成熟"],
    safeLanguage: ["你对回应的敏感，也是在认真辨认连接是否仍然存在。"],
    starMetaphors: ["断裂星桥", "回声延迟", "潮汐牵引"],
    signalHints: ["attachment", "relationship", "reply", "response", "关系", "回应", "语气"],
  },
  {
    id: "winnicott_true_self",
    school: "Object relations",
    zhName: "真实自我",
    coreMeaning: "个体更自然、更有生命感的自我部分，常需要足够安全的环境才会出现。",
    useWhen: ["用户区分真实表达和适应性表达", "选择半成品表达、寻找不被打断的位置"],
    avoid: ["不要说外在自我是假的", "不要命令用户立刻袒露"],
    safeLanguage: ["真实不一定要一次全部交出，它也可以先在一个安全的小位置出现。"],
    starMetaphors: ["内在星核", "未点亮房间", "小型恒星"],
    signalHints: ["authentic", "true_self", "real", "真实", "袒露"],
  },
  {
    id: "winnicott_transitional_space",
    school: "Object relations",
    zhName: "过渡空间",
    coreMeaning: "介于现实与内在之间的安全空间，作品、照片、音乐和剧场可以承载这种过渡。",
    useWhen: ["用户依靠艺术、音乐、照片整理感受", "剧场把素材变成空间物件"],
    avoid: ["不要把过渡空间神秘化成预言", "不要脱离用户证据堆意象"],
    safeLanguage: ["这些作品和画面像一间过渡房间，让你把难说的部分先放进去。"],
    starMetaphors: ["玻璃剧场", "星云房间", "过渡月场"],
    signalHints: ["art_space", "music", "photo", "theater", "作品", "照片", "剧场"],
  },
  {
    id: "adler_compensation",
    school: "Individual psychology",
    zhName: "补偿",
    coreMeaning: "个体用准备、秩序、优秀或掌控来回应不安，让自己重新获得可站立的位置。",
    useWhen: ["用户偏好利弊分析、步骤、准备、结构", "行动前需要清晰路径"],
    avoid: ["不要说用户自卑", "不要把补偿写成虚荣"],
    safeLanguage: ["你用结构加固自己，不是为了伪装强大，而是为了让脚下更稳。"],
    starMetaphors: ["加固轨道", "秩序支架", "校准星图"],
    signalHints: ["systematic", "rational", "preparation", "steps", "秩序", "利弊", "步骤"],
  },
  {
    id: "meaning_orientation",
    school: "Existential psychology",
    zhName: "意义感",
    coreMeaning: "用户需要行动、关系和选择拥有内在理由，而不只是在外部看起来合理。",
    useWhen: ["用户反复追问意义、方向、是否真正想走", "文学/电影偏存在主义和时间哲学"],
    avoid: ["不要把意义追问写成矫情", "不要给出唯一答案"],
    safeLanguage: ["你不是拖延答案，而是在确认这条路是否真的能承载你。"],
    starMetaphors: ["深空坐标", "北极星", "意义星轴"],
    signalHints: ["meaning", "existential", "philosophical", "方向", "意义", "追问"],
  },
  {
    id: "solitude_capacity",
    school: "Object relations",
    zhName: "孤独能力",
    coreMeaning: "个体能够在独处中维持自我连续性，并从低噪音空间恢复精神秩序。",
    useWhen: ["用户选择独处、低光、远景、安静空间", "关系需求偏少而深"],
    avoid: ["不要把独处写成孤僻", "不要把独处能力浪漫化为逃避一切"],
    safeLanguage: ["独处不是远离世界，而是你恢复内在秩序的一种方式。"],
    starMetaphors: ["静默星域", "低噪音月面", "独处轨道"],
    signalHints: ["solitude", "introversion", "alone", "独处", "一个人", "低噪音"],
  },
  {
    id: "boundary",
    school: "Relational psychoanalysis",
    zhName: "边界",
    coreMeaning: "自我与他人、欲望与现实、靠近与保留之间的分界能力。",
    useWhen: ["用户选择有限表达、慢慢靠近、关系里保留房间", "素材中出现门、窗、岸线、边缘"],
    avoid: ["不要把边界写成冷漠", "不要要求用户放下边界"],
    safeLanguage: ["边界不是拒绝，它是你让靠近变得可持续的方式。"],
    starMetaphors: ["边界环", "月门", "岸线轨道"],
    signalHints: ["boundary", "door", "window", "shore", "门", "窗", "岸", "边界"],
  },
  {
    id: "sublimation",
    school: "Psychoanalysis",
    zhName: "升华",
    coreMeaning: "把冲突、欲望或难以命名的感受转化为创作、审美、秩序或作品。",
    useWhen: ["用户通过写作、拍照、剪视频、作品释放感受", "审美偏好承担情绪出口"],
    avoid: ["不要把创作当治疗承诺", "不要命令用户必须创作"],
    safeLanguage: ["你可以把难以直接说出的东西，先转成一束光、一段声音或一个可保存的形状。"],
    starMetaphors: ["星尘炼金", "光谱转译", "创作星云"],
    signalHints: ["creative", "making", "art", "write", "拍照", "写", "作品", "创作"],
  },
];

function normalize(value: string) {
  return value.toLocaleLowerCase("zh-CN");
}

function selectedOptionEvidence(part1: Part1Record) {
  const evidence: string[] = [];

  for (const [questionId, rawValue] of Object.entries(part1.answers)) {
    const optionIds = Array.isArray(rawValue) ? rawValue : typeof rawValue === "string" ? [rawValue] : [];
    for (const optionId of optionIds) {
      const option = getQuestionOption(questionId, optionId);
      if (!option) continue;
      evidence.push(option.text, option.psychologicalSignal ?? "", ...getQuestionOptionTags(questionId, optionId));
    }
  }

  return evidence;
}

function part1TextEvidence(part1: Part1Record) {
  const music = part1.part1_data.aesthetics.music_analysis;
  const photo = part1.part1_data.narrative.precious_photo_analysis;
  const posts = part1.part1_data.narrative.social_posts_analysis ?? [];
  const overall = part1.part1_data.narrative.social_posts_overall_pattern;

  return [
    ...selectedOptionEvidence(part1),
    ...(music?.primary_genres ?? []),
    music?.emotional_tone ?? "",
    ...Object.keys(music?.personality_signals ?? {}),
    ...Object.values(music?.personality_signals ?? {}),
    ...(posts.flatMap((post) => [
      post.text_content,
      post.emotional_tone,
      post.expression_style,
      post.self_presentation,
      post.time_clue,
      ...post.themes,
      ...post.psychological_signals,
    ])),
    overall?.dominant_emotion ?? "",
    ...(overall?.core_themes ?? []),
    overall?.expression_authenticity ?? "",
    photo?.visual_content ?? "",
    photo?.composition ?? "",
    photo?.lighting ?? "",
    photo?.color_mood ?? "",
    ...(photo?.symbolic_elements ?? []),
    ...(photo?.psychological_interpretation.core_themes ?? []),
    photo?.psychological_interpretation.emotional_tone ?? "",
    photo?.psychological_interpretation.self_concept ?? "",
    photo?.psychological_interpretation.existential_stance ?? "",
    ...(photo?.psychological_interpretation.traits ?? []),
    ...part1.aggregated_traits.core_themes,
    ...part1.aggregated_traits.archetype_hints,
  ].filter(Boolean);
}

function part2TextEvidence(part2?: Part2Record) {
  if (!part2) return [];
  return [
    ...part2.act2_choices.flatMap((choice) => [
      choice.selected,
      getTheaterAct2ChoiceText(choice.selected) ?? "",
      choice.hesitation_time && choice.hesitation_time >= 6 ? "停留 迟疑 慢下来" : "",
    ]),
    ...part2.act3_responses.flatMap((response) => [
      response.selected,
      getTheaterMirrorChoiceText(response.selected) ?? "",
      response.hesitation_time && response.hesitation_time >= 6 ? "停留 迟疑 慢下来" : "",
    ]),
  ].filter(Boolean);
}

function strengthFromScore(score: number): SelectedPsychoanalyticConcept["strength"] {
  if (score >= 4) return "strong_signal";
  if (score >= 2) return "medium_signal";
  return "weak_signal";
}

export function selectPsychoanalyticConceptsForPart1(part1: Part1Record, part2?: Part2Record, limit = 6): SelectedPsychoanalyticConcept[] {
  const haystackItems = [...part1TextEvidence(part1), ...part2TextEvidence(part2)];
  const haystack = normalize(haystackItems.join("\n"));

  const selected = BENYUAN_PSYCHOANALYTIC_CONCEPTS.map((concept) => {
    const matches = concept.signalHints.filter((hint) => haystack.includes(normalize(hint)));
    const evidence = haystackItems
      .filter((item) => concept.signalHints.some((hint) => normalize(item).includes(normalize(hint))))
      .slice(0, 3);
    return {
      concept,
      matches: matches.length,
      evidence,
    };
  })
    .filter((item) => item.matches > 0)
    .sort((left, right) => right.matches - left.matches)
    .slice(0, limit)
    .map((item) => ({
      concept: item.concept,
      strength: strengthFromScore(item.matches),
      evidence: item.evidence.length > 0 ? item.evidence : item.concept.useWhen.slice(0, 2),
    }));

  const requiredIds = ["object_distance", "boundary", "freud_defense", "meaning_orientation"];
  for (const id of requiredIds) {
    if (selected.some((item) => item.concept.id === id)) continue;
    const concept = BENYUAN_PSYCHOANALYTIC_CONCEPTS.find((item) => item.id === id);
    if (concept) selected.push({ concept, strength: "weak_signal", evidence: concept.useWhen.slice(0, 2) });
  }

  return selected.slice(0, limit);
}

export function buildPsychoanalyticConceptBrief(selected: SelectedPsychoanalyticConcept[]) {
  const concepts = selected.length > 0
    ? selected
    : BENYUAN_PSYCHOANALYTIC_CONCEPTS.slice(0, 6).map((concept) => ({
        concept,
        strength: "weak_signal" as const,
        evidence: concept.useWhen.slice(0, 2),
      }));

  return [
    "精神分析概念卡（供内部生成使用，不要逐字暴露给用户；这是精神分析启发，不是心理诊断）：",
    ...concepts.map(({ concept, strength, evidence }) => [
      `- ${concept.zhName} / ${concept.school} / ${strength}`,
      `  核心含义：${concept.coreMeaning}`,
      `  适用信号：${concept.useWhen.join("；")}`,
      `  用户输入证据：${evidence.join("；")}`,
      `  星图转译：${concept.starMetaphors.join("、")}`,
      `  安全表达：${concept.safeLanguage.join("；")}`,
      `  禁止误用：${concept.avoid.join("；")}`,
    ].join("\n")),
  ].join("\n");
}

export function summarizePsychoanalyticStarReading(selected: SelectedPsychoanalyticConcept[]) {
  const primary = selected[0]?.concept ?? BENYUAN_PSYCHOANALYTIC_CONCEPTS.find((item) => item.id === "boundary")!;
  const secondary = selected.find((item) => item.concept.id !== primary.id)?.concept ?? BENYUAN_PSYCHOANALYTIC_CONCEPTS.find((item) => item.id === "meaning_orientation")!;
  return {
    primaryConcept: primary.zhName,
    secondaryConcept: secondary.zhName,
    starMetaphor: primary.starMetaphors[0] ?? "边界轨道",
    safeLine: primary.safeLanguage[0] ?? "这不是缺陷，而是一种可以被理解的内在结构。",
    combinedLine: `从精神分析启发的角度看，这更靠近${primary.zhName}与${secondary.zhName}的交界：${primary.safeLanguage[0]}在星图里，它会显影成${primary.starMetaphors[0] ?? "边界轨道"}。`,
  };
}
