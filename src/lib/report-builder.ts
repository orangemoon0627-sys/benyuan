import { sampleReport } from "@/lib/fixtures/report";
import { collectSafetySignals, getAnswerLabel, getFeatureSnapshot } from "@/lib/feature-mapper";
import type { AnalysisInput } from "@/lib/analysis/types";
import type {
  Archetype,
  ConfidenceBand,
  DimensionReading,
  EvidenceTrace,
  FeatureVector,
  RecommendationItem,
  ReportPayload,
  SafetyFlag,
  TensionInsight,
} from "@/lib/types";

const AESTHETIC_KEYS = [
  "aesthetic_literary_existential",
  "aesthetic_literary_tenderness",
  "aesthetic_music_intensity",
  "aesthetic_music_nocturnal",
  "aesthetic_visual_surreal",
  "aesthetic_visual_minimal",
  "aesthetic_niche_orientation",
] as const;

const EMOTIONAL_KEYS = [
  "emotional_granularity",
  "emotional_depth",
  "emotional_rhythm_tidal",
  "emotional_rhythm_stable",
  "emotional_transformation",
] as const;

const TEMPORAL_KEYS = [
  "temporal_past_weight",
  "temporal_present_depth",
  "temporal_future_pull",
  "temporal_narrative_coherence",
  "temporal_change_openness",
  "temporal_meaning_density",
] as const;

const FEATURE_LABELS: Record<string, string> = {
  aesthetic_literary_existential: "存在感与清醒追问",
  aesthetic_literary_tenderness: "温柔、余温与情感纹理",
  aesthetic_music_intensity: "强度与情绪冲击",
  aesthetic_music_nocturnal: "夜色、回声与低亮度氛围",
  aesthetic_visual_surreal: "梦境感与模糊边界",
  aesthetic_visual_minimal: "克制、留白与结构感",
  aesthetic_niche_orientation: "小众偏向与私人共鸣",
  emotional_granularity: "情绪命名能力",
  emotional_depth: "情绪深度",
  emotional_rhythm_tidal: "潮汐式情绪节律",
  emotional_rhythm_stable: "情绪稳定与收束感",
  emotional_transformation: "把情绪转成表达的能力",
  temporal_past_weight: "过去仍在场的重量",
  temporal_present_depth: "对当下的停驻能力",
  temporal_future_pull: "未来牵引力",
  temporal_narrative_coherence: "生命叙事连贯度",
  temporal_change_openness: "对变化的开放度",
  temporal_meaning_density: "时间中的意义密度",
};

type FeatureName = keyof FeatureVector["values"];

type EvidenceRef = {
  questionId: string;
  signal: string;
  feature?: FeatureName;
};

const confidenceFromValue = (value: number): ConfidenceBand => {
  if (value < 0.4) return "low";
  if (value < 0.75) return "medium";
  return "high";
};

function topFeature(vector: FeatureVector, keys: readonly string[]) {
  return getFeatureSnapshot(vector, keys as readonly never[])[0] as [string, number];
}

function topFeatures(vector: FeatureVector, keys: readonly string[], count = 2) {
  return getFeatureSnapshot(vector, keys as readonly never[]).slice(0, count) as Array<[string, number]>;
}

function getQuestionPrompt(input: AnalysisInput, questionId: string) {
  return input.questionMap.get(questionId)?.prompt ?? questionId;
}

function makeEvidence(input: AnalysisInput, vector: FeatureVector, ref: EvidenceRef): EvidenceTrace {
  const { session } = input;
  const featureScore = ref.feature ? vector.values[ref.feature] : undefined;

  return {
    questionId: ref.questionId,
    prompt: getQuestionPrompt(input, ref.questionId),
    answerLabel: getAnswerLabel(session, ref.questionId) || "未留下明确答案",
    signal: ref.signal,
    featureKey: ref.feature,
    featureScore,
  };
}

function buildEvidence(input: AnalysisInput, vector: FeatureVector, refs: EvidenceRef[]) {
  return refs.map((ref) => makeEvidence(input, vector, ref));
}

function stableHash(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function pickVariant<T>(seed: string, options: T[]) {
  return options[stableHash(seed) % options.length];
}

function hasMood(moodKeywords: string[], targets: string[]) {
  return targets.some((target) => moodKeywords.includes(target));
}

function getAestheticReading(input: AnalysisInput, vector: FeatureVector): DimensionReading {
  const { session } = input;
  const [feature, strength] = topFeature(vector, AESTHETIC_KEYS);

  if (feature === "aesthetic_music_nocturnal") {
    return {
      dimension: "aesthetic",
      title: "审美语法：你会被夜色里仍有余温的东西留住",
      summary:
        "你对作品的靠近方式，常常先发生在气氛里。带夜色、回声、低亮度和呼吸感的音乐或文字，更容易让你停下来，因为它们允许复杂感受慢慢浮上来，而不是被立即解释完。",
      confidenceBand: confidenceFromValue(strength),
      evidence: buildEvidence(input, vector, [
        { questionId: "Q012", signal: "精神背景音明显偏向低亮度、私密、夜行性的声音空间。", feature: "aesthetic_music_nocturnal" },
        { questionId: "Q015", signal: "你本能靠近雾、回声、异乡等词，说明你会被氛围型意象吸住。", feature: "aesthetic_music_nocturnal" },
        { questionId: "Q017", signal: "你更在意能否住进去的氛围，而不只是表面的完成度。", feature: "aesthetic_music_nocturnal" },
      ]),
    };
  }

  if (feature === "aesthetic_visual_minimal") {
    return {
      dimension: "aesthetic",
      title: "审美语法：你信任留白，而不是喧哗",
      summary:
        "你偏爱的美，不靠堆满信息来取胜，而靠克制、节制和边缘处的质感说话。对你来说，真正有力量的作品往往保留了安静的空间，让人可以把自己的感受放进去继续生长。",
      confidenceBand: confidenceFromValue(strength),
      evidence: buildEvidence(input, vector, [
        { questionId: "Q013", signal: "偏好光线克制、留白很多的空间，说明你会主动靠近安静结构。", feature: "aesthetic_visual_minimal" },
        { questionId: "Q016", signal: "你会先判断作品是否有结构支撑，证明你对秩序感并不排斥。", feature: "aesthetic_visual_minimal" },
        { questionId: "Q017", signal: "你被克制处理过的复杂体验打动，而不是被直接宣泄打动。", feature: "aesthetic_visual_minimal" },
      ]),
    };
  }

  if (feature === "aesthetic_visual_surreal") {
    return {
      dimension: "aesthetic",
      title: "审美语法：你容易被梦境边缘的画面唤醒",
      summary:
        "你对不完全可解释的东西有天然亲近。边界模糊、像神话又像梦的图像，会比过分明确的表达更触发你，因为你并不急着把感受归档，而愿意让它在你体内多停留一会儿。",
      confidenceBand: confidenceFromValue(strength),
      evidence: buildEvidence(input, vector, [
        { questionId: "Q013", signal: "你愿意在梦境感、边界不清的空间里停留很久。", feature: "aesthetic_visual_surreal" },
        { questionId: "Q014", signal: "偏好神话般、难以定年代的时空感，说明你对模糊性有耐受。", feature: "aesthetic_visual_surreal" },
        { questionId: "Q015", signal: "雾与密林等意象反复出现，让精神场景更偏向朦胧与象征。", feature: "aesthetic_visual_surreal" },
      ]),
    };
  }

  if (feature === "aesthetic_literary_existential") {
    return {
      dimension: "aesthetic",
      title: "审美语法：你会被能刺穿表面的作品吸住",
      summary:
        "当作品里出现荒诞、清醒、异化或意义感的追问时，你往往更难轻易略过。你并不满足于温和共鸣，你还希望作品能把隐藏在日常之下的那层真实揭开，让你短暂地面对更深的自己。",
      confidenceBand: confidenceFromValue(strength),
      evidence: buildEvidence(input, vector, [
        { questionId: "Q011", signal: "文学击中方式偏向荒诞、异化或清醒感，说明你会被存在问题吸住。", feature: "aesthetic_literary_existential" },
        { questionId: "Q016", signal: "当裂痕本身成为作品核心时，你并不会退开，反而会更靠近。", feature: "aesthetic_literary_existential" },
        { questionId: "Q017", signal: "你在意作品是否让你变得更清醒，这是一种深层审美要求。", feature: "aesthetic_literary_existential" },
      ]),
    };
  }

  return {
    dimension: "aesthetic",
    title: "审美语法：你靠近仍保留温度的表达",
    summary:
      "你喜欢的东西很少是纯粹光滑或标准化的。你更在意它有没有留下人性、裂缝、余温和停顿，因此审美对你不只是偏好，它也是你整理复杂情绪的一套私人语法。",
    confidenceBand: confidenceFromValue(strength),
    evidence: buildEvidence(input, vector, [
      { questionId: "Q011", signal: "被文学击中时，你更关注情绪是否被准确保存。", feature: "aesthetic_literary_tenderness" },
      { questionId: "Q016", signal: "你对带裂痕但真诚的作品更宽容，也更容易被打动。", feature: "aesthetic_literary_tenderness" },
      { questionId: "Q017", signal: "你会因为作品替你说出细微感受而停下来。", feature: "aesthetic_literary_tenderness" },
    ]),
  };
}

function getEmotionalReading(input: AnalysisInput, vector: FeatureVector): DimensionReading {
  const { session } = input;
  const [feature, strength] = topFeature(vector, EMOTIONAL_KEYS);
  const q006 = getAnswerLabel(session, "Q006");

  if (feature === "emotional_depth") {
    return {
      dimension: "emotional",
      title: "情感气候：你更像深流，而不是骤雨",
      summary:
        `你的情绪通常不是来一下就散，而更像在体内持续流动的暗河。它未必总是外显，却会以更慢、更深的方式影响你。特别是像“${q006 || "把它感受完整"}”这样的处理路径，说明你并不急着逃开感受。`,
      confidenceBand: confidenceFromValue(strength),
      evidence: buildEvidence(input, vector, [
        { questionId: "Q004", signal: "你对情绪来临的想象更接近深海暗流或连绵阴天，而不是短促阵雨。", feature: "emotional_depth" },
        { questionId: "Q006", signal: "你更愿意把感受完整经历一遍，而不是立刻切断。", feature: "emotional_depth" },
        { questionId: "Q008", signal: "某些安静或关系受损时刻会放大感受，说明情绪深度会持续滞留。", feature: "emotional_depth" },
      ]),
    };
  }

  if (feature === "emotional_transformation") {
    return {
      dimension: "emotional",
      title: "情感气候：你倾向把情绪炼成可承载的东西",
      summary:
        "你并不只是在承受情绪，也在寻找它可以落脚的形式。表达、书写、对话或某种创造，对你来说不是附加动作，而是把混沌重新整理成可理解形状的重要路径。",
      confidenceBand: confidenceFromValue(strength),
      evidence: buildEvidence(input, vector, [
        { questionId: "Q006", signal: "你处理强烈情绪的方式本身就带有转化倾向。", feature: "emotional_transformation" },
        { questionId: "Q009", signal: "你把脆弱看成理解他人或创作洞察的入口，而不是纯弱点。", feature: "emotional_transformation" },
        { questionId: "Q010", signal: "你更容易通过表达、创作或被理解的连接走出情绪。", feature: "emotional_transformation" },
      ]),
    };
  }

  if (feature === "emotional_rhythm_tidal") {
    return {
      dimension: "emotional",
      title: "情感气候：你的内在节律更接近潮汐",
      summary:
        "你对情绪的体验具有明显周期感，不一定总是剧烈，却常常会在某些时段、场景和关系触发里反复回来。这并不意味着你不稳定，而是意味着你的感受系统对世界更有回声。",
      confidenceBand: confidenceFromValue(strength),
      evidence: buildEvidence(input, vector, [
        { questionId: "Q001", signal: "最近的内在天气里，潮汐式敏感是核心词之一。", feature: "emotional_rhythm_tidal" },
        { questionId: "Q004", signal: "你直接把情绪比成会反复涨落的潮汐。", feature: "emotional_rhythm_tidal" },
        { questionId: "Q015", signal: "潮汐等意象会本能吸引你，说明节律感已进入你的审美语言。", feature: "emotional_rhythm_tidal" },
      ]),
    };
  }

  return {
    dimension: "emotional",
    title: "情感气候：你在辨认与维持之间来回校准",
    summary:
      "你一方面希望把情绪看清楚、说清楚，另一方面也在努力维持日常的秩序感。这让你对自己的内在天气相当敏感，但表达时又常带着分寸，因此你并不简单外露，也并非全然封闭。",
    confidenceBand: confidenceFromValue(strength),
    evidence: buildEvidence(input, vector, [
      { questionId: "Q005", signal: "你能感觉到不对劲，但不一定马上愿意完整展开。", feature: "emotional_granularity" },
      { questionId: "Q007", signal: "你对不同情绪形状的辨认能力，为后续自我理解提供了基础。", feature: "emotional_granularity" },
      { questionId: "Q010", signal: "你走出情绪的路径既需要整理，也需要一点结构和时间。", feature: "emotional_rhythm_stable" },
    ]),
  };
}

function getTemporalReading(input: AnalysisInput, vector: FeatureVector): DimensionReading {
  const { session } = input;
  const [feature, strength] = topFeature(vector, TEMPORAL_KEYS);

  if (feature === "temporal_past_weight") {
    return {
      dimension: "temporal",
      title: "时间哲学：过去对你并没有真正离场",
      summary:
        "你与时间的关系，不是单向往前，而更像不断回看、回听、回到某些细节里确认自己。过去对你不是包袱本身，它更像还没完全整理完的素材库，仍在影响你今天如何理解自己。",
      confidenceBand: confidenceFromValue(strength),
      evidence: buildEvidence(input, vector, [
        { questionId: "Q019", signal: "你会本能地把自己放在不断回头看的方向上理解。", feature: "temporal_past_weight" },
        { questionId: "Q020", signal: "回忆过去时，你更容易感到倒带、碎片或雾状残留。", feature: "temporal_past_weight" },
        { questionId: "Q014", signal: "你会被旧时代褪色的痕迹或反复回来的熟悉感击中。", feature: "temporal_past_weight" },
      ]),
    };
  }

  if (feature === "temporal_future_pull") {
    return {
      dimension: "temporal",
      title: "时间哲学：你会被尚未到来的自己牵引",
      summary:
        "未来对你不是抽象口号，而是一种持续存在的牵引力。你会反复想象更适合自己的方向，因此即便脚下不总是稳定，内在仍保留着向前试探、想再靠近一点的冲动。",
      confidenceBand: confidenceFromValue(strength),
      evidence: buildEvidence(input, vector, [
        { questionId: "Q002", signal: "最近的生活更像快步朝远处赶去，说明未来一直在前方发光。", feature: "temporal_future_pull" },
        { questionId: "Q019", signal: "你常被还没到来的事情牵引，说明未来感在持续介入当下。", feature: "temporal_future_pull" },
        { questionId: "Q022", signal: "即使不安，你仍会往前试，变化并没有把你彻底钉住。", feature: "temporal_future_pull" },
      ]),
    };
  }

  if (feature === "temporal_meaning_density") {
    return {
      dimension: "temporal",
      title: "时间哲学：你不只是经历时间，你还会追问它的意义密度",
      summary:
        "你对时间的感受往往带着解释冲动。很多人只是把一天过完，但你会想知道，这些片段之间究竟有没有暗线、有没有生成感、有没有一种更深层的指向。",
      confidenceBand: confidenceFromValue(strength),
      evidence: buildEvidence(input, vector, [
        { questionId: "Q002", signal: "你并不满足于走路本身，还会追问自己为什么出发。", feature: "temporal_meaning_density" },
        { questionId: "Q019", signal: "你会像在时间外观察自己的生活，这是一种高意义密度视角。", feature: "temporal_meaning_density" },
        { questionId: "Q020", signal: "你会主动去找今天和过去之间的暗线。", feature: "temporal_meaning_density" },
      ]),
    };
  }

  return {
    dimension: "temporal",
    title: "时间哲学：你在回望、守住当下与继续前行之间寻找比例",
    summary:
      "你对时间的体验不是单一方向，而像不断调节焦距。过去会回来，现在需要守住，未来也在隐约发光。你真正做的事，往往不是选边站，而是为这些不同时间感找到可共处的顺序。",
    confidenceBand: confidenceFromValue(strength),
    evidence: buildEvidence(input, vector, [
      { questionId: "Q019", signal: "你已经意识到自己不是单一时间方向的人。", feature: "temporal_narrative_coherence" },
      { questionId: "Q021", signal: "你对生命故事连贯度的自评，决定了这些时间线能否连成一条可读的线。", feature: "temporal_narrative_coherence" },
      { questionId: "Q022", signal: "你面对变化时的内在动作，揭示了你如何给时间赋形。", feature: "temporal_change_openness" },
    ]),
  };
}

function buildOverview(input: AnalysisInput, vector: FeatureVector) {
  const { session } = input;
  const aestheticTop = topFeatures(vector, AESTHETIC_KEYS, 2).map(([feature]) => feature);
  const emotionalTop = topFeatures(vector, EMOTIONAL_KEYS, 2).map(([feature]) => feature);
  const temporalTop = topFeatures(vector, TEMPORAL_KEYS, 2).map(([feature]) => feature);
  const moodKeywords = session.basicInfo.moodKeywords;
  const moods = moodKeywords.join("、") || "未命名的天气";
  const overviewSeed = [session.sessionId, ...aestheticTop, ...emotionalTop, ...temporalTop, moods].join("|");

  const openingLine = hasMood(moodKeywords, ["迷茫", "疲惫", "焦虑", "低压"])
    ? pickVariant(`${overviewSeed}:opening:heavy`, [
        `你当前的心境关键词里有${moods}，所以整张精神底图会先显出一点阴影与迟疑；但这并不意味着停滞，它更像一次需要慢慢辨认光源的过渡。`,
        `此刻围绕你的关键词是${moods}。这让你的整体气候带着低气压与自我回望，但也正因此，很多真正重要的感受没有被你轻易跳过。`,
      ])
    : hasMood(moodKeywords, ["希望", "兴奋", "平静"])
      ? pickVariant(`${overviewSeed}:opening:lifted`, [
          `你当前的心境关键词里有${moods}，于是你的整体气候虽然仍保留敏感，却已经出现了某种向前、向亮处挪动的趋势。`,
          `此刻围绕你的关键词是${moods}。这让你并非只是脆弱地感受世界，你也在缓慢积攒一种继续靠近生活的意愿。`,
        ])
      : pickVariant(`${overviewSeed}:opening:mixed`, [
          `你当前的心境关键词里有${moods}，这让你的整体气候既带着感受力，也保留着一点尚未被命名完的悬而未决。`,
          `此刻围绕你的关键词是${moods}。你的状态并不单一，更像几种天气正在同一片天幕下彼此牵制、彼此照亮。`,
        ]);

  const aestheticLine = aestheticTop.includes("aesthetic_music_nocturnal")
    ? pickVariant(`${overviewSeed}:aesthetic:nocturnal`, [
        "你像一间很晚还亮着微光的房间，真正重要的线索常常在安静下来以后才慢慢浮现。",
        "你的审美像夜色中的低频回声，不急着说明自己，却会在安静时把真正的情绪轮廓显出来。",
      ])
    : aestheticTop.includes("aesthetic_visual_surreal")
      ? pickVariant(`${overviewSeed}:aesthetic:surreal`, [
          "你的精神场景更接近一片带雾的地带：边界并不清晰，但正因如此，很多别人略过的感受会在你这里留下回声。",
          "你会本能停在那些边界模糊、意味未尽的地方，因为雾感对你不是障碍，而是一种允许复杂性继续存在的空间。",
        ])
      : aestheticTop.includes("aesthetic_visual_minimal")
        ? pickVariant(`${overviewSeed}:aesthetic:minimal`, [
            "你的内在并不嘈杂，却有很高的密度。你常被克制、留白和少量却准确的表达打动，因为那更接近你理解世界的方式。",
            "你信任被节制过的表达。比起热闹地铺陈一切，你更容易被结构、呼吸感与留白里那点未说尽的部分打动。",
          ])
        : pickVariant(`${overviewSeed}:aesthetic:tender`, [
            "你会天然靠近带着裂纹、余温和真实质感的东西，因为那比完整无瑕更像生活本身。",
            "真正吸住你的，往往不是过分完美的作品，而是那些仍留着手感、温差和人味的东西。",
          ]);

  const emotionalLine = emotionalTop.includes("emotional_depth")
    ? pickVariant(`${overviewSeed}:emotion:depth`, [
        "情绪对你来说很少只是表面经过，它更像缓慢下沉的水流，会在身体和记忆里停留一阵，直到你找到能容纳它的方式。",
        "你的感受通常不会轻轻掠过。它们会沉进去、留下来，并要求一个足够诚实的容器，才肯慢慢松手。",
      ])
    : emotionalTop.includes("emotional_transformation")
      ? pickVariant(`${overviewSeed}:emotion:transformation`, [
          "你并不满足于单纯承受情绪，你更想把它们转译成一句话、一段旋律、一次散步后的清楚感，让感受有地方可去。",
          "你有一种把感受重新加工的冲动：不是压下去，而是试着把它变成能被携带、被表达、被呼吸的形式。",
        ])
      : pickVariant(`${overviewSeed}:emotion:rhythm`, [
          "你的情绪系统带着明显节律，有时稳住，有时起伏，但这种波动并不只是负担，它也构成了你理解他人的入口。",
          "你的内在天气不是静止的，它有自己的涨落规律。而你对这种节律的熟悉，也让你更容易察觉别人没说出口的变化。",
        ]);

  const temporalLine = temporalTop.includes("temporal_past_weight") && temporalTop.includes("temporal_future_pull")
    ? pickVariant(`${overviewSeed}:time:bridge`, [
        "于是，你常站在回望与前行之间：一边不愿轻易丢下旧日里仍有重量的部分，一边又被尚未到来的自己持续牵引。",
        "你常像站在两股时间流之间的人：过去不肯轻易退场，未来又在远处发亮，于是你学会了一种边整理边前进的姿态。",
      ])
    : temporalTop.includes("temporal_past_weight")
      ? pickVariant(`${overviewSeed}:time:past`, [
          "过去对你并没有真正结束，它仍以片段、气味、画面和熟悉句子的方式留在当下，像在提醒你别太快略过自己。",
          "对你来说，过去不是一页已经翻完的纸。它仍会以碎片、场景和微小触发的形式回返，要求被再次辨认。",
        ])
      : temporalTop.includes("temporal_future_pull")
        ? pickVariant(`${overviewSeed}:time:future`, [
            "你也不是停在原地的人。即使此刻仍在辨认方向，未来仍像一束远光，提醒你还有别的可能性等待被靠近。",
            "即使还没完全想清，你体内仍有一股向前的牵引力。它不喧哗，却会不断提醒你：现在不是终点。",
          ])
        : pickVariant(`${overviewSeed}:time:meaning`, [
            "你与时间的关系带着意义感：比起赶路，你更在意这些片段最终会不会连成一条能被自己认出的线。",
            "你并不只是想把日子过完。你更在意这些片段最后能否连成一种你愿意承认的生命纹理。",
          ]);

  return [openingLine, aestheticLine, emotionalLine, temporalLine].join("");
}

function buildTensions(input: AnalysisInput, vector: FeatureVector) {
  const { session } = input;
  const tensions: TensionInsight[] = [];
  const q005 = getAnswerLabel(session, "Q005");
  const textCount = [getAnswerLabel(session, "Q023"), getAnswerLabel(session, "Q024")].filter(Boolean).length;

  if (vector.values.emotional_depth > 0.7 && vector.values.emotional_rhythm_stable > 0.55) {
    tensions.push({
      tensionId: "depth_vs_stability",
      name: "深流与秩序的并置",
      poles: ["深度感受", "维持秩序"],
      description: pickVariant(`${session.sessionId}:tension:depth_vs_stability:description`, [
        "你并不是没有情绪波浪，而是经常一边深深感受，一边努力让外部生活保持可运转状态。这会让你看起来很稳，但真正重要的波动往往发生在更私密、更晚一些的时刻。",
        "你的内在深度并没有消失，只是常被你安置在一个不轻易打扰日常的位置。于是别人先看到的是稳定，较少看到的是那股持续流动的深水。",
      ]),
      suggestion: pickVariant(`${session.sessionId}:tension:depth_vs_stability:suggestion`, [
        "与其等情绪堆满，不如给它固定、可预测的出口，让深度感受与日常秩序并存。",
        "试着为深处那部分自己预留稳定时段，而不是只在快溢出来时才被动处理。",
      ]),
      confidenceScore: 0.76,
      evidence: buildEvidence(input, vector, [
        { questionId: "Q004", signal: "情绪被描述为深流，但你又并未完全失去节律。", feature: "emotional_depth" },
        { questionId: "Q006", signal: "你会认真感受情绪，同时试图用自己的方式把它安置好。", feature: "emotional_rhythm_stable" },
        { questionId: "Q010", signal: "你走出情绪时需要一点收束和恢复秩序的过程。", feature: "emotional_rhythm_stable" },
      ]),
    });
  }

  if (vector.values.temporal_past_weight > 0.65 && vector.values.temporal_future_pull > 0.6) {
    tensions.push({
      tensionId: "nostalgia_vs_becoming",
      name: "怀旧与生成中的未来",
      poles: ["回望", "前行"],
      description: pickVariant(`${session.sessionId}:tension:nostalgia_vs_becoming:description`, [
        "你会反复回头，不是因为不愿前进，而是因为需要先确认那些真正属于你的部分还没有被丢失。与此同时，未来又在持续牵引你，提醒你不能只住在回声里。",
        "你对过去的回望并不等于停滞，它更像一种确认动作：先确认重要之物仍在，再决定自己要把什么带向未来。",
      ]),
      suggestion: pickVariant(`${session.sessionId}:tension:nostalgia_vs_becoming:suggestion`, [
        "把过去当素材，而不是住处。允许旧痕迹参与现在，但别让它垄断未来。",
        "保留回望的权利，但替未来留出主动命名的空间，不要只由旧时刻决定你是谁。",
      ]),
      confidenceScore: 0.8,
      evidence: buildEvidence(input, vector, [
        { questionId: "Q019", signal: "时间方向同时出现回望与前行的牵引。", feature: "temporal_past_weight" },
        { questionId: "Q020", signal: "过去仍以电影、碎片、气味等方式反复回返。", feature: "temporal_past_weight" },
        { questionId: "Q022", signal: "面对变化时你虽不一定轻松，但并不会完全停在原地。", feature: "temporal_future_pull" },
      ]),
    });
  }

  if (vector.values.emotional_transformation > 0.65 && (textCount === 0 || /不想解释|没事/u.test(q005))) {
    tensions.push({
      tensionId: "expression_vs_protection",
      name: "表达冲动与自我保护",
      poles: ["想说出来", "不愿暴露"],
      description: pickVariant(`${session.sessionId}:tension:expression_vs_protection:description`, [
        "你内在其实有把感受转成表达的能力，但真正轮到自己时，又常常会把最核心的部分收回去。于是你会呈现一种微妙状态：有表达欲，却也很谨慎。",
        "你并不缺少表达资源，真正困难的是决定何时、向谁、以什么尺度暴露自己。因此你既想说，又会在最后一刻替自己关上一半门。",
      ]),
      suggestion: pickVariant(`${session.sessionId}:tension:expression_vs_protection:suggestion`, [
        "不必一次说完整。先允许自己留下片段式表达，慢慢建立安全感。",
        "先练习小范围、低风险的表达，不必把每次开口都变成一次彻底袒露。",
      ]),
      confidenceScore: 0.72,
      evidence: buildEvidence(input, vector, [
        { questionId: "Q005", signal: "你感到难过时不一定立刻愿意解释，这强化了保护边界的一面。", feature: "emotional_transformation" },
        { questionId: "Q006", signal: "你本来就有把情绪转成表达或对话的能力。", feature: "emotional_transformation" },
        { questionId: "Q023", signal: "开放题留白较多时，说明真实表达仍带谨慎。" },
      ]),
    });
  }

  if (vector.values.aesthetic_music_intensity > 0.65 && vector.values.aesthetic_literary_tenderness > 0.6) {
    tensions.push({
      tensionId: "intensity_vs_gentleness",
      name: "强烈与温柔的并存",
      poles: ["强烈感受", "轻声安放"],
      description: pickVariant(`${session.sessionId}:tension:intensity_vs_gentleness:description`, [
        "你不是没有强烈情绪，相反，你对强度并不陌生。只是你不总是用强烈的方式表达它，更常见的情况是把它们安放进较轻、较柔软的形式里。",
        "你能承受强度，却不总愿意让它以最锋利的样子出现。于是你经常把浓烈感受包进温柔形式里，让它既保留力量，也不至于伤人。",
      ]),
      suggestion: pickVariant(`${session.sessionId}:tension:intensity_vs_gentleness:suggestion`, [
        "保留你的温柔表达，但别让温柔变成过度稀释；偶尔让强度原样出现，也是一种诚实。",
        "继续珍惜你的细腻处理方式，但也给未经稀释的力量一点合法位置。",
      ]),
      confidenceScore: 0.71,
      evidence: buildEvidence(input, vector, [
        { questionId: "Q012", signal: "音乐偏好中存在明显强度感。", feature: "aesthetic_music_intensity" },
        { questionId: "Q011", signal: "文学击中方式又保留了温柔、苍凉和细纹感。", feature: "aesthetic_literary_tenderness" },
        { questionId: "Q017", signal: "你既要情绪击中，也要它被处理得足够细腻。", feature: "aesthetic_literary_tenderness" },
      ]),
    });
  }

  if (tensions.length === 0) {
    tensions.push({
      tensionId: "clarity_vs_mist",
      name: "清晰与雾感之间",
      poles: ["想弄清", "想保留模糊"],
      description: pickVariant(`${session.sessionId}:tension:clarity_vs_mist:description`, [
        "你既希望理解自己，又不愿过度定义自己。于是很多时候，你会一边整理线索，一边保留雾气，这并不是摇摆，而是你保护复杂性的方式。",
        "你想要清楚，但也知道过快下定义会损伤真实感。因此你保留一部分模糊，不是逃避，而是替复杂性争取呼吸空间。",
      ]),
      suggestion: pickVariant(`${session.sessionId}:tension:clarity_vs_mist:suggestion`, [
        "把理解当成持续校准，而不是一次定论。你不需要一次说尽自己。",
        "允许自己边命名边修正，不急着把流动中的部分一次性归档。",
      ]),
      confidenceScore: 0.64,
      evidence: buildEvidence(input, vector, [
        { questionId: "Q002", signal: "你想弄清为何出发，但不急着把自己定死。", feature: "temporal_meaning_density" },
        { questionId: "Q013", signal: "审美上允许雾感和边界不清存在。", feature: "aesthetic_visual_surreal" },
        { questionId: "Q021", signal: "生命故事的连贯程度仍在形成，而不是已经盖章。", feature: "temporal_narrative_coherence" },
      ]),
    });
  }

  return tensions.slice(0, 3);
}

function buildArchetype(input: AnalysisInput, vector: FeatureVector): Archetype {
  const { session } = input;
  const values = vector.values;

  if (values.aesthetic_music_nocturnal > 0.62 && values.temporal_past_weight > 0.6 && values.emotional_depth > 0.65) {
    return {
      name: "回声里的守夜人",
      subtitle: "在旧日余温与新生方向之间缓慢校准自己",
      description:
        "这个原型并不意味着你只属于夜晚，而是说明你擅长在安静处听见仍未散去的回声。你会把别人很快略过的细节留下来，再一点点判断，哪些值得珍藏，哪些可以送它们离开。",
      sourceSignals: ["aesthetic_music_nocturnal", "emotional_depth", "temporal_past_weight"],
      evidence: buildEvidence(input, vector, [
        { questionId: "Q012", signal: "夜色与低亮度音乐场景，是原型氛围的核心底色。", feature: "aesthetic_music_nocturnal" },
        { questionId: "Q004", signal: "情绪更像深流或暗潮，而不是表面闪过。", feature: "emotional_depth" },
        { questionId: "Q020", signal: "过去仍会以细节和碎片的方式回来，像反复出现的回声。", feature: "temporal_past_weight" },
      ]),
    };
  }

  if (values.aesthetic_visual_surreal > 0.65 && values.temporal_future_pull > 0.6 && values.temporal_change_openness > 0.55) {
    return {
      name: "雾中的制图师",
      subtitle: "在不确定里前行，也在不确定里命名自己",
      description:
        "你不是先看清一切才出发的人。你更像一边向前，一边在雾里画地图的人：对未知有戒备，但也保持好奇，因此真正属于你的方向，往往是在前进中才逐渐显影。",
      sourceSignals: ["aesthetic_visual_surreal", "temporal_future_pull", "temporal_change_openness"],
      evidence: buildEvidence(input, vector, [
        { questionId: "Q013", signal: "你愿意停在边界模糊的空间里，这让雾感成为原型环境。", feature: "aesthetic_visual_surreal" },
        { questionId: "Q019", signal: "未来牵引力一直存在，说明你不是停在原地的人。", feature: "temporal_future_pull" },
        { questionId: "Q022", signal: "你面对变化虽不轻松，但总体愿意继续往前试。", feature: "temporal_change_openness" },
      ]),
    };
  }

  if (values.aesthetic_visual_minimal > 0.65 && values.emotional_transformation > 0.6) {
    return {
      name: "留白中的炼金者",
      subtitle: "把复杂感受熬成可呼吸的形式",
      description:
        "你不倾向用喧哗证明自己，而更擅长把真正重要的感受熬成少量但准确的表达。你会在沉默里工作，在留白里完成转化，让那些说不清的东西拥有更清楚的轮廓。",
      sourceSignals: ["aesthetic_visual_minimal", "emotional_transformation", "emotional_granularity"],
      evidence: buildEvidence(input, vector, [
        { questionId: "Q013", signal: "你会主动靠近留白和克制感，这决定了原型的美学语法。", feature: "aesthetic_visual_minimal" },
        { questionId: "Q006", signal: "你处理情绪时有明显的转化冲动。", feature: "emotional_transformation" },
        { questionId: "Q007", signal: "你能辨认情绪形状，因此复杂感受可以被更准确地提炼。", feature: "emotional_granularity" },
      ]),
    };
  }

  if (values.aesthetic_literary_existential > 0.68 && values.emotional_depth > 0.64) {
    return {
      name: "深渊边的抄写员",
      subtitle: "被存在问题吸住，也仍想把生活写下去",
      description:
        "你会被那些刺穿表面的命题吸住：荒诞、孤独、存在、意义。可你并不是为了停在深渊边上，而是想把这些问题重新写回生活，让它们不只是重，也能成为洞察。",
      sourceSignals: ["aesthetic_literary_existential", "emotional_depth", "temporal_meaning_density"],
      evidence: buildEvidence(input, vector, [
        { questionId: "Q011", signal: "作品中的异化、清醒或灵魂追索，会直接击中你。", feature: "aesthetic_literary_existential" },
        { questionId: "Q004", signal: "你的情绪不是浅层掠过，而会长久停留。", feature: "emotional_depth" },
        { questionId: "Q019", signal: "你并不只想活着经过，还会不断问这些经历意味着什么。", feature: "temporal_meaning_density" },
      ]),
    };
  }

  return {
    name: "微光的收藏者",
    subtitle: "在细微之处辨认仍值得留下的东西",
    description:
      "你并不一定总是把自己表达得很响亮，但会认真保存那些真正照亮过你的细小事物。你擅长从碎片里辨认价值，也会在日常中悄悄完成属于自己的校准与修复。",
    sourceSignals: ["aesthetic_literary_tenderness", "temporal_present_depth", "emotional_transformation"],
    evidence: buildEvidence(input, vector, [
      { questionId: "Q003", signal: "你很容易被一句替自己说出心事的话击中。", feature: "aesthetic_literary_tenderness" },
      { questionId: "Q014", signal: "你会记住当下短暂发亮的片刻。", feature: "temporal_present_depth" },
      { questionId: "Q010", signal: "你倾向通过表达、整理或连接，把感受慢慢带回可呼吸状态。", feature: "emotional_transformation" },
    ]),
  };
}

function buildRecommendations(vector: FeatureVector, safetyFlags: SafetyFlag[]): RecommendationItem[] {
  const values = vector.values;
  const items: RecommendationItem[] = [];
  const recommendationSeed = [
    ...topFeatures(vector, AESTHETIC_KEYS, 2).map(([feature]) => feature),
    ...topFeatures(vector, EMOTIONAL_KEYS, 2).map(([feature]) => feature),
    ...topFeatures(vector, TEMPORAL_KEYS, 2).map(([feature]) => feature),
    safetyFlags.join("|"),
  ].join("|");

  items.push(
    safetyFlags.includes("high_sensitivity")
      ? {
          type: "philosophy",
          title: pickVariant(`${recommendationSeed}:philosophy:sensitive:title`, [
            "把敏感当作感受力，而不是故障",
            "先照顾感受器，再谈向前走",
          ]),
          description: pickVariant(`${recommendationSeed}:philosophy:sensitive:description`, [
            "你不需要先把自己变钝，才配过得更轻松。更适合你的方法，是为敏感建立边界和节律，而不是把它整体关掉。",
            "与其逼自己尽快适应一切，不如先承认：你确实接收得更多。所以真正有效的不是麻木，而是建立筛选、停顿与恢复机制。",
          ]),
        }
      : {
          type: "philosophy",
          title: pickVariant(`${recommendationSeed}:philosophy:general:title`, [
            "给复杂感受一块固定空间",
            "为内在天气预留可回来的地方",
          ]),
          description: pickVariant(`${recommendationSeed}:philosophy:general:description`, [
            "与其等情绪满溢，不如每天给它 10 到 15 分钟的固定时段，让感受有地方可去，也让日常不必一直为它腾挪。",
            "把感受安排进生活，并不是削弱它，而是让它不必用失控的方式提醒你自己仍在里面。",
          ]),
        },
  );

  if (values.aesthetic_literary_existential > 0.62) {
    items.push({
      type: "book",
      title: "《悉达多》",
      description: pickVariant(`${recommendationSeed}:book:siddhartha`, [
        "它适合现在的你，因为它允许人在流动、偏离与自我追索里慢慢理解自己，而不是急着得出结论。",
        "这本书的价值不在于提供答案，而在于陪人经历偏离、困惑与重新靠近自我的过程。",
      ]),
    });
    items.push({
      type: "book",
      title: pickVariant(`${recommendationSeed}:book:existential:title`, ["《局外人》", "《卡拉马佐夫兄弟》"]),
      description:
        values.emotional_depth > 0.7
          ? "如果你熟悉清醒、疏离与存在追问，它会像一面不太温柔却足够诚实的镜子。"
          : "当你想把存在问题放进更大的伦理与信念冲突里看，它能继续拉开你的思考纵深。",
    });
  } else if (values.temporal_past_weight > 0.62 || values.aesthetic_literary_tenderness > 0.62) {
    items.push({
      type: "book",
      title: pickVariant(`${recommendationSeed}:book:tender:title`, ["《挪威的森林》", "《呼兰河传》"]),
      description:
        values.temporal_past_weight > 0.68
          ? "如果你熟悉绵长、潮湿又难以一刀切开的情绪回声，它会让你感到某种被安静接住的共鸣。"
          : "它适合那些会从气味、余温、关系细纹里辨认自己的时刻。",
    });
    items.push({
      type: "book",
      title: "《The Waves》",
      description: pickVariant(`${recommendationSeed}:book:waves`, [
        "它适合那些对时间、回声与内在独白敏感的人，会帮你感到：碎片感也可以拥有诗性的结构。",
        "如果你常觉得自己是由许多片段组成的，这本书会告诉你：片段并不妨碍你拥有整体。",
      ]),
    });
  } else {
    items.push({
      type: "book",
      title: pickVariant(`${recommendationSeed}:book:room:title`, ["《一个人的房间》", "《观看之道》"]),
      description:
        values.aesthetic_visual_minimal > 0.6
          ? "它会提醒你，留白、边界和自我空间并不是奢侈品，而是许多深层理解得以发生的前提。"
          : "它能把你对形式、观看与自我空间的敏感，重新整理成更清楚的语言。",
    });
    items.push({
      type: "book",
      title: "《海边的卡夫卡》",
      description: pickVariant(`${recommendationSeed}:book:kafka`, [
        "如果你喜欢梦境感、边界模糊和自我生成的旅程，这本书能继续打开你与潜意识之间的通道。",
        "它适合那些不抗拒象征、迷路和自我生成的人，会让模糊感继续长出形状。",
      ]),
    });
  }

  items.push(
    values.aesthetic_music_nocturnal > 0.6
      ? {
          type: "music",
          title: pickVariant(`${recommendationSeed}:music:nocturnal:title`, ["Nils Frahm - Says", "A Winged Victory for the Sullen - Steep Hills of Vicodin Tears"]),
          description: pickVariant(`${recommendationSeed}:music:nocturnal:description`, [
            "适合那些需要一点时间，才让情绪慢慢浮上来的夜晚。",
            "当你不想被立刻解释，只想让感受自己显形时，可以把它当成一块低亮度容器。",
          ]),
        }
      : {
          type: "music",
          title: pickVariant(`${recommendationSeed}:music:intensity:title`, ["Sigur Ros - Untitled #8", "Jon Hopkins - Abandon Window"]),
          description: pickVariant(`${recommendationSeed}:music:intensity:description`, [
            "当你需要把强度安全地放出来时，它会像一块足够宽的情绪容器。",
            "它适合那些既需要力量，也需要缓冲层的时刻。",
          ]),
        },
  );

  items.push({
    type: "music",
    title:
      values.aesthetic_visual_surreal > 0.6
        ? pickVariant(`${recommendationSeed}:music:mist:title`, ["Ryuichi Sakamoto - Solari", "Balmorhea - Remembrance"])
        : pickVariant(`${recommendationSeed}:music:light:title`, ["Olafur Arnalds - Near Light", "Max Richter - On the Nature of Daylight"]),
    description:
      values.aesthetic_visual_surreal > 0.6
        ? pickVariant(`${recommendationSeed}:music:mist:description`, [
            "它适合带雾感、边界不清但仍有微光的时刻。",
            "当你想停在模糊里，却又不想彻底失焦时，它会提供一种柔软的坐标。",
          ])
        : pickVariant(`${recommendationSeed}:music:light:description`, [
            "它会把你的克制、留白和仍在发亮的部分轻轻托住。",
            "如果你习惯把情绪收得很稳，它会给那些没说出口的部分一个缓慢升起的通道。",
          ]),
  });

  items.push({
    type: "practice",
    title:
      values.temporal_past_weight > 0.62
        ? pickVariant(`${recommendationSeed}:practice:past:title`, ["旧时刻回看练习", "回声素材整理"])
        : pickVariant(`${recommendationSeed}:practice:present:title`, ["七天情绪形状记录", "一周身体感受日志"]),
    description:
      values.temporal_past_weight > 0.62
        ? pickVariant(`${recommendationSeed}:practice:past:description`, [
            "选一个你总会回想的旧片段，只写气味、光线、身体感受，不写结论。让过去先以素材出现，而不是再次变成判断。",
            "挑一个总会回返的记忆，记录它出现时的场景、温度和身体反应，先不要解释，让旧时刻先恢复成具体而非抽象的重量。",
          ])
        : pickVariant(`${recommendationSeed}:practice:present:description`, [
            "连续七天，只记录当天最明显的一种情绪形状和它在身体里的位置，不分析原因，先练习看见。",
            "给自己一周时间，每天只写一种最强烈的身体感受与对应情绪，不解释对错，先训练命名能力。",
          ]),
  });

  return items.slice(0, 6);
}

export function buildReport(input: AnalysisInput, vector: FeatureVector): ReportPayload {
  const { session } = input;
  const safetyFlags = collectSafetySignals(input, vector);
  const dimensionReadings = [
    getAestheticReading(input, vector),
    getEmotionalReading(input, vector),
    getTemporalReading(input, vector),
  ];
  const tensions = buildTensions(input, vector);
  const archetype = buildArchetype(input, vector);
  const recommendations = buildRecommendations(vector, safetyFlags);

  return {
    ...sampleReport,
    reportId: `rep_${Math.random().toString(36).slice(2, 10)}`,
    sessionId: session.sessionId,
    overview: buildOverview(input, vector),
    dimensionReadings,
    tensions,
    archetype,
    recommendations,
    safetyFlags,
    confidenceBand: safetyFlags.includes("low_information") ? "low" : vector.confidenceBand,
    generatedAt: new Date().toISOString(),
    promptVersion: "prompt.v0.2",
    reportSchemaVersion: "report.v0.3",
  };
}

export function getFeatureLabel(featureKey: string) {
  return FEATURE_LABELS[featureKey] ?? featureKey;
}
