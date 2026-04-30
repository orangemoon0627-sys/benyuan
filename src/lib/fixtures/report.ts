import type { ReportPayload } from "@/lib/types";

export const sampleReport: ReportPayload = {
  reportId: "rep_sample_001",
  sessionId: "sess_sample_001",
  overview:
    "你当下的精神气候，像一间凌晨仍亮着灯的房间：外面很安静，里面却有许多尚未说完的思绪。你似乎天然会被那些带有余温、裂缝与回声的东西吸引，因为它们既能容纳你的敏感，也能帮你替复杂感受找到形状。与此同时，你并不满足于只是沉在情绪里，你还会反复追问：这些波动究竟会把我带向哪里。于是，你的内在世界总在怀旧与生成之间轻轻拉扯，一边不愿失去曾经照亮过你的痕迹，一边又在等待某个更像自己的未来慢慢浮现。",
  narrativeOverview:
    "你现在呈现出的原型，是回声里的守夜人（The Echo Keeper）。这并不意味着你只属于夜晚，而是说明你很擅长在安静中听见那些尚未散去的东西：旧关系的余温、某句话的回响、一段旋律里的隐痛，甚至是自己没有来得及解释清楚的部分。你会把别人很快略过的细节留下来，再慢慢判断，哪些值得珍藏，哪些可以送它们离开。\n\n从精神星图来看，最突出的部分是审美敏感、情感深度与意义追寻。你并不只是“感受很多”，你更像在用感受理解世界。音乐、文字、空间、光线、时间感，这些对别人也许只是氛围，对你却是实实在在的线索。你会从一首歌的低亮度、一本书的留白、一个场景的旧痕迹里，判断自己此刻正处在哪种精神天气之中。\n\n你也因此活在一种典型张力里：一边回望，一边前行。过去并没有真正离场，它仍以气味、片段和熟悉句子的方式反复回来；但未来又在远处持续发光，提醒你不能一直住在回声里。这份张力不是缺陷，而更像你的生命结构：你需要回头确认重要之物仍在，才愿意继续往前。\n\n你对关系并不是没有需求，只是你要的从来不是热闹，而是有效理解。你会保护自己的节奏和边界，但真正被看见时，复原也会明显加快。对你来说，这份报告不是终局判定，而是一张当前阶段的精神地形图：让你知道自己正被什么照亮、被什么拉扯，以及下一步可以把哪一部分，先温柔而真实地带回现实。",
  dimensionReadings: [
    {
      dimension: "aesthetic",
      title: "审美语法：你靠近有裂痕但仍发光的东西",
      summary:
        "你对作品的判断，不太建立在完美与否之上，而更在意它是否保留了真实的温度。那些带夜色、留白、旧痕迹与细微克制感的作品，往往更容易让你停下来，因为它们像是在替你保存复杂情绪的纹理。",
      confidenceBand: "high",
      evidence: [
        {
          questionId: "Q012",
          prompt: "下面哪种音乐场景最接近你现在的精神背景音？",
          answerLabel: "深夜独处的爵士钢琴",
          signal: "低亮度、夜行性、带回声的声音空间明显占优。",
          featureKey: "aesthetic_music_nocturnal",
          featureScore: 0.78,
        },
        {
          questionId: "Q013",
          prompt: "如果必须在以下视觉空间里待上一下午，你会选：",
          answerLabel: "光线克制、留白很多的房间",
          signal: "你会主动靠近留白和克制感，而不是信息过载。",
          featureKey: "aesthetic_visual_minimal",
          featureScore: 0.61,
        },
      ],
    },
    {
      dimension: "emotional",
      title: "情感气候：你更像深流，而不是骤雨",
      summary:
        "你的情绪并不总是显眼地爆发，但常常有持续而缓慢的深度。你会认真感受，也会试图给情绪找到能承载它的出口，因此敏感对你来说并不只是负担，它也构成了理解他人与理解自己的入口。",
      confidenceBand: "medium",
      evidence: [
        {
          questionId: "Q004",
          prompt: "当情绪真正来临时，它更像：",
          answerLabel: "深海暗流，表面平静但里面很重",
          signal: "情绪不是浅层闪过，而是持续留存在体内。",
          featureKey: "emotional_depth",
          featureScore: 0.76,
        },
        {
          questionId: "Q006",
          prompt: "你更像如何处理强烈情绪？",
          answerLabel: "写下来或转成某种表达",
          signal: "你会主动给情绪找出口，而不是只靠压住它。",
          featureKey: "emotional_transformation",
          featureScore: 0.62,
        },
      ],
    },
    {
      dimension: "temporal",
      title: "时间哲学：你在回望与前行之间寻找自己的线索",
      summary:
        "你对时间的体验不是单一朝向未来的推进，而更像不断回看、整理、再向前试探。过去对你并没有彻底结束，它仍以气味、句子、音乐和片段的方式停留。但你并不只想停在那里，你还想弄清这些旧痕迹如何通往新的自己。",
      confidenceBand: "medium",
      evidence: [
        {
          questionId: "Q019",
          prompt: "你更常把自己放在哪个时间方向上理解？",
          answerLabel: "三个方向都会来，但轻重不同",
          signal: "你已经意识到自己不是单一时间方向的人。",
          featureKey: "temporal_narrative_coherence",
          featureScore: 0.58,
        },
        {
          questionId: "Q020",
          prompt: "当你回忆过去时，它更像：",
          answerLabel: "一部细节很多、经常倒带的电影",
          signal: "过去仍会以高度具象的方式反复回返。",
          featureKey: "temporal_past_weight",
          featureScore: 0.69,
        },
      ],
    },
  ],
  sevenDimensions: [
    {
      key: "openness",
      label: "开放性",
      score: 84,
      interpretation: "你会主动靠近复杂、含混和仍未被说尽的事物。新的审美、新的解释框架与新的生命路径，对你来说更像召唤而不是威胁。",
      evidence: [],
    },
    {
      key: "independence",
      label: "独立性",
      score: 73,
      interpretation: "你既重视独处，也并不排斥连接。你更在意的是关系有没有分寸，而不是简单地靠近或疏远。",
      evidence: [],
    },
    {
      key: "emotional_depth",
      label: "情感深度",
      score: 86,
      interpretation: "你的情绪不是轻轻掠过，而是会沉入身体、记忆和叙事。你对细微波动的感受力很强，也因此更容易活在多层次的情绪里。",
      evidence: [],
    },
    {
      key: "meaning_seeking",
      label: "意义追寻",
      score: 82,
      interpretation: "意义对你不是装饰性问题，而是会反复回来的核心命题。你需要知道自己为何这样活、这样爱、这样继续向前。",
      evidence: [],
    },
    {
      key: "aesthetic_sensitivity",
      label: "审美敏感",
      score: 89,
      interpretation: "你对光线、质地、节奏、留白和象征有很高的分辨力。美对你来说不是装饰，而是理解世界与理解自己的路径之一。",
      evidence: [],
    },
    {
      key: "action_tendency",
      label: "行动力",
      score: 56,
      interpretation: "你会在思考和行动之间反复校准。多数时候你能动起来，但需要一个足够像自己的理由。",
      evidence: [],
    },
    {
      key: "relationship_need",
      label: "关系需求",
      score: 64,
      interpretation: "你对连接有明确需要，但不会为了连接放弃全部边界。你要的不是很多人，而是少数真正有效的回应。",
      evidence: [],
    },
  ],
  tensions: [
    {
      tensionId: "nostalgia_vs_becoming",
      name: "怀旧与生成中的未来",
      poles: ["回望", "前行"],
      description:
        "你会反复回头，不是因为不愿前进，而是因为你需要从过去里确认某些尚未丢失的部分。可与此同时，你又隐约知道，真正适合你的生活不在旧日复刻里，而在新的生成里。",
      suggestion:
        "也许你不需要强迫自己立即走出怀旧。更适合你的方式，是把过去当成素材，而不是住处。",
      confidenceScore: 0.76,
      evidence: [
        {
          questionId: "Q019",
          prompt: "你更常把自己放在哪个时间方向上理解？",
          answerLabel: "三个方向都会来，但轻重不同",
          signal: "回望和前行同时存在，只是权重不同。",
          featureKey: "temporal_past_weight",
          featureScore: 0.69,
        },
        {
          questionId: "Q022",
          prompt: "面对变化时，你更常见的内在动作是：",
          answerLabel: "一边不安，一边还是会往前试",
          signal: "变化让你不安，但没有让你停住。",
          featureKey: "temporal_future_pull",
          featureScore: 0.55,
        },
      ],
    },
    {
      tensionId: "intensity_vs_gentleness",
      name: "强烈与温柔的并存",
      poles: ["深度感受", "克制表达"],
      description:
        "你不是没有强烈情绪，而是更习惯用较轻的方式把它们安放下来。这让你看起来很平静，但真正重要的部分，往往都藏在看似轻声的表达里。",
      suggestion:
        "试着给自己留下小范围但高密度的表达空间，而不是等到情绪很满时才一次性倾倒。",
      confidenceScore: 0.71,
      evidence: [
        {
          questionId: "Q012",
          prompt: "下面哪种音乐场景最接近你现在的精神背景音？",
          answerLabel: "暴雨中的后摇器乐",
          signal: "强度感并不陌生，它只是没总在表面出现。",
          featureKey: "aesthetic_music_intensity",
          featureScore: 0.64,
        },
        {
          questionId: "Q011",
          prompt: "哪种阅读体验最容易让你产生‘这好像就是我没说出口的东西’？",
          answerLabel: "精致、克制、带一点苍凉的情感",
          signal: "表达方式仍偏爱细腻和克制。",
          featureKey: "aesthetic_literary_tenderness",
          featureScore: 0.73,
        },
      ],
    },
  ],
  archetype: {
    name: "回声里的守夜人",
    englishName: "The Echo Keeper",
    subtitle: "在旧日余温与新生方向之间缓慢校准自己",
    coreEssence: "在安静处辨认仍未散去的回声，在旧日余温与未来方向之间缓慢校准自己。",
    visualPrompt:
      "A solitary night sentinel standing inside a dim shoreline observatory, echoes of old letters and piano notes dissolving into mist, deep indigo and moon-silver palette, cinematic surreal realism, poetic darkness, soft volumetric light, reflective water, 16:9",
    description:
      "这个原型成立，不是因为你只属于夜晚或怀旧，而是因为你擅长在安静处听见仍未消散的回声。你会把那些别人很快略过的细节留下来，再慢慢判断，哪些值得珍藏，哪些应该送它们离开。",
    sourceSignals: ["aesthetic_music_nocturnal", "emotional_depth", "temporal_past_weight"],
    evidence: [
      {
        questionId: "Q012",
        prompt: "下面哪种音乐场景最接近你现在的精神背景音？",
        answerLabel: "深夜独处的爵士钢琴",
        signal: "夜色与回声决定了原型的底色。",
        featureKey: "aesthetic_music_nocturnal",
        featureScore: 0.78,
      },
      {
        questionId: "Q004",
        prompt: "当情绪真正来临时，它更像：",
        answerLabel: "深海暗流，表面平静但里面很重",
        signal: "深流式情绪体验让原型更偏向守夜而非宣泄。",
        featureKey: "emotional_depth",
        featureScore: 0.76,
      },
    ],
  },
  recommendations: [
    {
      type: "philosophy",
      title: "给敏感留一块结构化空间",
      description: "与其压住情绪，不如每天给它 10 分钟的固定时段，让它有地方可去。",
    },
    {
      type: "book",
      title: "《悉达多》",
      description: "它适合现在的你，因为它不急着给答案，而是允许人在流动中慢慢理解自己。",
    },
    {
      type: "book",
      title: "《挪威的森林》",
      description: "如果你熟悉绵长的情绪回声，这本书会让你感到一种被安静接住的共鸣。",
    },
    {
      type: "music",
      title: "Nils Frahm - Says",
      description: "适合那些需要一点时间，才能让情绪慢慢浮上来的夜晚。",
    },
    {
      type: "music",
      title: "Olafur Arnalds - Near Light",
      description: "它会把你的克制、留白和微亮感轻轻托住。",
    },
    {
      type: "practice",
      title: "旧时刻回看练习",
      description: "选一个你反复回想的旧片段，只写它的气味、光线和身体感受，不写结论。",
    },
  ],
  growthSuggestions: [
    {
      title: "练习整合「怀旧与生成中的未来」",
      description: "你不必强迫自己立刻告别旧时刻。更适合你的方式，是把过去转成素材，而不是继续把它当成唯一住处。",
      actionableSteps: [
        "保留一个旧时刻档案，但只记录事实、气味和画面。",
        "每周做一件只属于未来的微小动作，让新的自己有现实落点。",
        "当你再次回头时，先问自己：这次回望是在取材，还是在停住？",
      ],
    },
    {
      title: "让审美敏感进入现实结构",
      description: "你的感受力与审美能力已经很强，真正需要的是把它们稳定地放进生活，而不是只在某些瞬间被动发生。",
      actionableSteps: [
        "开始一个只对自己负责的小型创作档案。",
        "每周记录一个让你停下来的画面，并写下它为何成立。",
        "把喜欢的氛围拆成颜色、声音、句子与节奏，训练表达词汇。",
      ],
    },
  ],
  curatedRecommendations: {
    books: [
      {
        title: "《挪威的森林》",
        creator: "村上春树",
        reason: "它会接住你对关系余温、旧时刻和绵长回声的敏感。",
      },
      {
        title: "《孤独六讲》",
        creator: "蒋勋",
        reason: "如果你需要重新理解孤独，它能把孤独从缺口慢慢改写成一种能力。",
      },
    ],
    films: [
      {
        title: "《花样年华》",
        creator: "王家卫",
        reason: "如果你熟悉克制表达与情感余温，这部片会把那些未说尽的部分显影。",
      },
      {
        title: "《镜子》",
        creator: "安德烈·塔可夫斯基",
        reason: "它会让你重新观看记忆、时间与自我之间的关系。",
      },
    ],
    music: [
      {
        title: "Says",
        creator: "Nils Frahm",
        reason: "适合那些需要时间让情绪慢慢浮上来的夜晚。",
      },
      {
        title: "Near Light",
        creator: "Olafur Arnalds",
        reason: "它会把你的克制、留白与微亮感轻轻托住。",
      },
    ],
  },
  safetyFlags: ["none"],
  confidenceBand: "medium",
  generatedAt: new Date().toISOString(),
  promptVersion: "prompt.v3.0",
  reportSchemaVersion: "report.v3.0",
};
