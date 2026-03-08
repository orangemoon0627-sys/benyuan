import type { ReportPayload } from "@/lib/types";

export const sampleReport: ReportPayload = {
  reportId: "rep_sample_001",
  sessionId: "sess_sample_001",
  overview:
    "你当下的精神气候，像一间凌晨仍亮着灯的房间：外面很安静，里面却有许多尚未说完的思绪。你似乎天然会被那些带有余温、裂缝与回声的东西吸引，因为它们既能容纳你的敏感，也能帮你替复杂感受找到形状。与此同时，你并不满足于只是沉在情绪里，你还会反复追问：这些波动究竟会把我带向哪里。于是，你的内在世界总在怀旧与生成之间轻轻拉扯，一边不愿失去曾经照亮过你的痕迹，一边又在等待某个更像自己的未来慢慢浮现。",
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
    subtitle: "在旧日余温与新生方向之间缓慢校准自己",
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
  safetyFlags: ["none"],
  confidenceBand: "medium",
  generatedAt: new Date().toISOString(),
  promptVersion: "prompt.v0.1",
  reportSchemaVersion: "report.v0.2",
};
