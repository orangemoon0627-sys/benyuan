import type { PsycheConstellation } from "@/lib/benyuan-v3-types";

export const BENYUAN_V3_CONSTELLATION_ENGINE = {
  mode: "hybrid-structured.v1",
  promptVersion: "analyst.v4.hybrid.1",
  normalizationVersion: "constellation-normalize.v2",
  safetyVersion: "supportive-boundary.v1",
  deltaDoc: "/Users/fanhao/Documents/Playground/docs/benyuan-content-delta-2026-03-11.md",
} as const;

type ArchetypeProfile = {
  archetype: PsycheConstellation["archetype"];
  narrativeLead: string;
  narrativeFocus: string;
  relationshipLens: string;
  movementLens: string;
  closingLens: string;
  growthSuggestions: PsycheConstellation["growth_suggestions"];
  recommendations: PsycheConstellation["recommendations"];
};

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function fingerprint(value: string | null | undefined) {
  return cleanText(value ?? "").toLocaleLowerCase("zh-CN").replace(/[\s\p{P}\p{S}]+/gu, "");
}

const loneSeekerProfile: ArchetypeProfile = {
  archetype: {
    name: "远潮观月者",
    english_name: "The Far-Tide Moon Watcher",
    core_essence: "你常在幽暗、审美与记忆的回声里辨认意义，也愿意为真实保留足够的精神纵深。",
    visual_prompt: "A poetic archetype portrait for The Far-Tide Moon Watcher, cosmic horizon, deep sea dusk, lunar mist, restrained gold light, contemplative East Asian poster composition, intimate but vast, cinematic stillness, 16:9",
  },
  narrativeLead: "你给人的核心印象，不是张扬，而是一种安静却密度很高的存在感。",
  narrativeFocus: "你会把风景、音乐、句子和时间感当作真正的证据来阅读，所以外部世界对你来说从来不只是背景。",
  relationshipLens: "你不是不需要关系，而是很难把自己交给浅层交换；真正重要的是是否有人能跟上你的精神密度。",
  movementLens: "你更像在确认意义之后才行动，因此每一步都带着慎重，也带着一丝不肯草率的倔强。",
  closingLens: "你要找的并不是一个标准答案，而是一种能让你真切感到“这是真的”的存在方式。",
  growthSuggestions: [
    {
      title: "为记忆建立出口，而不是让它循环",
      description: "你很容易把情绪和记忆保存在体内，如果没有出口，它们会不断回放，慢慢挤压当下的空间。",
      actionable_steps: [
        "固定一个低噪音时段，只写下今天仍在回响的三个画面",
        "把反复出现的句子、旋律和场景整理成个人档案，而不是任由它们混在一起",
        "当某段回忆再次出现时，先记录它带来的身体感受，再决定是否继续解释",
      ],
    },
    {
      title: "把审美敏感转化为稳定创造",
      description: "你的审美不是装饰性的偏好，而是非常核心的理解方式。让它进入日常，会比单纯压抑更有恢复力。",
      actionable_steps: [
        "每周保留一次只为自己服务的创作或整理时间",
        "给喜欢的音乐、画面、文字分别建立收藏夹，持续更新你的精神索引",
        "把“我被什么击中”写清楚，而不只是保存结果",
      ],
    },
    {
      title: "练习小规模、可撤回的行动",
      description: "你并不缺少洞察，真正需要的是降低行动门槛，让深思熟虑之后还有现实里的推进。",
      actionable_steps: [
        "把一个抽象问题改写成一个一周内能完成的小实验",
        "每次深度思考后补一句：我今天能做的最小动作是什么",
        "允许行动只是试探，不要求它一次就解释完整个自己",
      ],
    },
  ],
  recommendations: {
    books: [
      { title: "《看不见的城市》", author: "伊塔洛·卡尔维诺", reason: "它像一面空间镜面：城市不是地点，而是记忆、欲望和自我认同的折射，能回应你从画面里辨认自己的方式。" },
      { title: "《悉达多》", author: "赫尔曼·黑塞", reason: "它适合作为精神旁证：寻找不是逃离现实，而是把河流、身体和时间重新听成自己的声音。" },
      { title: "《局外人》", author: "阿尔贝·加缪", reason: "加缪的存在主义会把距离感放到更清醒的光里，让你看见疏离并不等于没有感受。" },
    ],
    films: [
      { title: "《潜行者》", director: "安德烈·塔可夫斯基", reason: "如果你接受边界、象征和慢节奏，这部电影会非常接近你的精神空间。" },
      { title: "《穆赫兰道》", director: "大卫·林奇", reason: "它会回应你对梦境逻辑、身份裂缝和潜意识图景的偏爱。" },
      { title: "《生命之树》", director: "泰伦斯·马力克", reason: "当你想把个人感受放进更大的时间和宇宙尺度里看，它会给你很强的共鸣。" },
    ],
    music: [
      { artist: "Sigur Ros", album: "Agaetis byrjun", reason: "适合你把广阔、孤独与温柔并置在一起的情感结构。" },
      { artist: "Max Richter", album: "Sleep", reason: "如果你的精神节律偏夜晚与深流，这张专辑会像一张缓慢铺开的内在地图。" },
      { artist: "Ólafur Arnalds", album: "re:member", reason: "它把精密与情绪放在同一层里，能接住你既克制又深流的感受方式。" },
    ],
  },
};

const rationalBuilderProfile: ArchetypeProfile = {
  archetype: {
    name: "星图筑序者",
    english_name: "The Star-Map Architect",
    core_essence: "你用结构、秩序和可持续的节律把混沌折成可行的星图，也借此安放自己的复杂感受。",
    visual_prompt: "A poetic archetype portrait for The Star-Map Architect, geometric midnight skyline, restrained silver gold, clean negative space, ambient architecture, measured cinematic light, minimal but warm, East Asian editorial poster composition, 16:9",
  },
  narrativeLead: "你给人的第一印象不是热烈，而是清醒、安静、带着分寸的稳定感。",
  narrativeFocus: "你并不逃避复杂，反而相信复杂的问题应该被拆解、被命名，再被慢慢推进。",
  relationshipLens: "你珍视边界与节律，所以会在真正靠近之前先确认结构是否可靠。",
  movementLens: "你对未来有方向感，但也因此容易在框架还没完整之前延后行动。",
  closingLens: "你真正要练习的，并不是放弃秩序，而是让秩序成为承接情绪的容器，而不是情绪的替身。",
  growthSuggestions: [
    {
      title: "练习让感受先于解释出现",
      description: "你很擅长分析，但有时分析来得太快，会让真正的感受只露出一小部分。",
      actionable_steps: [
        "当情绪出现时，先用三个词描述体验，再决定是否解释它",
        "在重要对话前先记录自己的身体反应，而不急着整理结论",
        "给自己一个“暂不解释”的时间窗，让感受先完整存在十分钟",
      ],
    },
    {
      title: "把独处从防御升级为创造",
      description: "独处对你来说很必要，但如果它只承担恢复功能，就会浪费你本来就很强的建构力。",
      actionable_steps: [
        "把一个长期关心的问题拆成一个固定追踪清单",
        "把每周一次独处时段定义为“整理 + 输出”而不只是休息",
        "把你最常出现的思考主题变成笔记索引，形成自己的方法库",
      ],
    },
    {
      title: "在关系中尝试低风险揭示真实",
      description: "你不需要一次性交出全部自己，但可以练习用更低风险的方式让真实先出现一点。",
      actionable_steps: [
        "先从一个可信对象开始，表达一个还没完全想清楚的感受",
        "在对话里把“我已经想明白”改成“我现在的理解是”",
        "把边界说清楚的同时，也补一句你真正期待被回应的部分",
      ],
    },
  ],
  recommendations: {
    books: [
      { title: "《禅与摩托车维修艺术》", author: "罗伯特·M. 波西格", reason: "它把理性结构和精神品质放在同一张图里，像给你的秩序感找到了哲学镜面。" },
      { title: "《悉达多》", author: "赫尔曼·黑塞", reason: "它提醒你秩序之外仍有流动，时间不是表格，也可以是一条慢慢听见自己的河。" },
      { title: "《清醒思考的艺术》", author: "罗尔夫·多贝里", reason: "它适合作为现实侧的旁证：让分析继续服务行动，而不是把你留在无限校准里。" },
    ],
    films: [
      { title: "《降临》", director: "丹尼斯·维伦纽瓦", reason: "它会回应你对结构、语言与时间秩序的兴趣。" },
      { title: "《她》", director: "斯派克·琼斯", reason: "它能帮你看见理性秩序背后仍然渴望靠近的那部分自己。" },
      { title: "《完美的日子》", director: "维姆·文德斯", reason: "它会提醒你，稳定与细腻并不冲突。" },
    ],
    music: [
      { artist: "Brian Eno", album: "Music for Airports", reason: "它适合你需要秩序、呼吸感和低刺激环境的时候。" },
      { artist: "坂本龙一", album: "async", reason: "它把结构感和情绪余韵放在一起，很贴近你的精神节律。" },
      { artist: "Nils Frahm", album: "All Melody", reason: "当你想在理性和感受之间找到一座桥时，这张专辑会很好用。" },
    ],
  },
};

const gentleGuardianProfile: ArchetypeProfile = {
  archetype: {
    name: "月港栖岸者",
    english_name: "The Moon-Harbor Keeper",
    core_essence: "你用温度、稳定与连接感为重要的人点灯，也在学习把自己的容量放回中心。",
    visual_prompt: "A poetic archetype portrait for The Moon-Harbor Keeper, dawn moon harbor, soft mist, warm gold lamp, gentle dark green shadows, intimate atmosphere, quiet healing, delicate East Asian poster composition, black gold palette, 16:9",
  },
  narrativeLead: "你给人的靠近方式不是锋利的，而是温柔、克制、让人愿意放下防备的。",
  narrativeFocus: "你对世界的感受方式带着细腻度：不是靠碰撞确认自己，而是靠氛围、节律和真实情感来辨认什么值得停留。",
  relationshipLens: "你真正重视的不是热闹的注意力，而是少数关系里是否有足够的理解、安心和可持续。",
  movementLens: "你有行动力，但更愿意在确认安全和意义后前进，所以节奏往往显得柔和而不仓促。",
  closingLens: "你要学的不是变得更硬，而是在继续给予温度的同时，不把自己永远放在最后。",
  growthSuggestions: [
    {
      title: "把“少而深”的关系需求说清楚",
      description: "你的核心需求不是社交数量，而是关系质量。越早说清边界与期待，越容易减少误解。",
      actionable_steps: [
        "只挑 1-2 个真正重要的人练习更深表达",
        "在对话前先确认自己愿意暴露到什么程度",
        "当你感到被理解时，别立刻退开，允许这种经验多停留一会儿",
      ],
    },
    {
      title: "把审美感受转化为可见的自我照料系统",
      description: "你已经会自然借助音乐、风景和低刺激环境调节自己，下一步是把这种能力从偶然安慰升级成稳定支持。",
      actionable_steps: [
        "固定一个每周创作时段，用来写作、拍照或记录意象",
        "建立个人审美档案，持续收集会击中你的画面、音乐与句子",
        "把强烈情绪先转成素材，而不是急着给它下结论",
      ],
    },
    {
      title: "练习在确认感受后迅速迈出小步",
      description: "你不需要变成高压执行型人格，但可以减少“等完全确定再行动”的门槛。",
      actionable_steps: [
        "把一个抽象问题改写成一个本周就能尝试的小实验",
        "每次深度思考后补一句：我接下来具体做什么",
        "给自己设置足够小的开始动作，而不是等完全想清楚再开始",
      ],
    },
  ],
  recommendations: {
    books: [
      { title: "《瓦尔登湖》", author: "亨利·戴维·梭罗", reason: "它把独处写成一种清醒的生活实验，能回应你需要低噪音关系和稳定自我照料的部分。" },
      { title: "《爱与孤独》", author: "周国平", reason: "它适合作为亲密关系的镜面，帮助你把靠近、边界和被理解的愿望放到同一处看。" },
      { title: "《悉达多》", author: "赫尔曼·黑塞", reason: "它关注经验如何慢慢汇成意义，像把你的温柔、等待和精神河流放在一起。" },
    ],
    films: [
      { title: "《海街日记》", director: "是枝裕和", reason: "它会回应你对温柔、含蓄和关系深度的偏爱。" },
      { title: "《步履不停》", director: "是枝裕和", reason: "如果你容易被细微情绪和家庭关系的流动打动，这部电影会很贴近你。" },
      { title: "《小森林》", director: "森淳一", reason: "它把日常、季节、食物和独处织成一种可栖居的生活纹理。" },
    ],
    music: [
      { artist: "Ólafur Arnalds", album: "Near Light", reason: "它兼具空间感、克制与情绪流动，适合你整理内在感受时聆听。" },
      { artist: "久石让", album: "One Summer's Day", reason: "温柔明亮又带一点轻微感伤，很适合你偏好的清晨感与治愈感。" },
      { artist: "A Winged Victory for the Sullen", album: "Steep Hills of Vicodin Tears", reason: "缓慢铺展、情绪细腻，能回应你对低刺激但高密度情感的偏爱。" },
    ],
  },
};

const existentialWandererProfile: ArchetypeProfile = {
  archetype: {
    name: "存在游牧者",
    english_name: "The Existential Nomad",
    core_essence: "你不断移动、不断追问，也在变化和不确定里寻找一种仍能认出自己的活法。",
    visual_prompt: "A poetic archetype portrait for The Existential Nomad, moving horizon, dusk road beneath stars, floating clock fragments, deep blue black gold, cinematic existential atmosphere, soft wind, restless but luminous, East Asian poster composition, 16:9",
  },
  narrativeLead: "你更像一个不断移动的提问者，而不是停在原地等待答案的人。",
  narrativeFocus: "你会被那些尚未完全定型的状态吸引，因为你天然知道，很多重要的事情都发生在确定之前。",
  relationshipLens: "你既渴望真正的理解，也警惕任何太快给你下定义的关系方式。",
  movementLens: "你的行动往往和意义绑定得很深：一旦感到方向虚假，脚步就会自动慢下来。",
  closingLens: "你并不是迷路，只是比很多人更早地承认：真实人生本来就不总能被一条笔直路线解释。",
  growthSuggestions: [
    {
      title: "把提问保留下来，但给它现实落点",
      description: "你擅长提出真正的问题，下一步是让这些问题和生活发生具体连接，而不是只停在精神层。",
      actionable_steps: [
        "把一个长期困扰你的问题改写成一个本月能试验的主题",
        "每次深想结束后，补一个现实动作，不管它多小",
        "允许自己在“不完全确定”时也先向前挪一步",
      ],
    },
    {
      title: "为不确定感建立更温柔的容器",
      description: "你并不害怕复杂，但长期悬而未决也会消耗你。你需要的是容器，不是更用力的压制。",
      actionable_steps: [
        "给最常回来的问题设一个固定记录位置，而不是让它全天随机冒出",
        "当你感到失重时，先回到睡眠、饮食、步行这些现实节律",
        "用“我正在经历什么”替代“我必须马上想明白什么”",
      ],
    },
    {
      title: "练习向可信任的人交代你的阶段感",
      description: "你不一定需要立刻获得建议，但你需要让某些人知道你正在经历什么，而不是完全独自承担。",
      actionable_steps: [
        "挑一个不会急着给答案的人，只说明你现在所处的阶段",
        "把“我很乱”拆成更具体的两三个句子",
        "当你只想被听见时，直接说明你现在不需要解决方案",
      ],
    },
  ],
  recommendations: {
    books: [
      { title: "《局外人》", author: "阿尔贝·加缪", reason: "加缪会把疏离和清醒放在一起，像给你的存在追问留出一个不急着解释的镜面。" },
      { title: "《不能承受的生命之轻》", author: "米兰·昆德拉", reason: "它会回应自由、关系和意义之间的摇摆，让轻与重都不再只是抽象词。" },
      { title: "《悉达多》", author: "赫尔曼·黑塞", reason: "它提供一种非线性的成长旁证：你可以移动、迷路、回到河边，然后仍然认出自己。" },
    ],
    films: [
      { title: "《镜子》", director: "安德烈·塔可夫斯基", reason: "它会回应你对记忆、时间和存在感碎片的敏感。" },
      { title: "《春光乍泄》", director: "王家卫", reason: "如果你对漂移、失重和关系中的流动感特别敏感，它会击中你。" },
      { title: "《生命之树》", director: "泰伦斯·马力克", reason: "它适合你把个人困惑放进更大尺度里重新理解。" },
    ],
    music: [
      { artist: "Radiohead", album: "A Moon Shaped Pool", reason: "它能接住你对不确定、失重和深层情绪密度的感受。" },
      { artist: "Nils Frahm", album: "Spaces", reason: "它适合你在流动和结构之间寻找更柔和的平衡。" },
      { artist: "Phoebe Bridgers", album: "Punisher", reason: "如果你需要一种更贴近现实语境的脆弱感表达，它会很合适。" },
    ],
  },
};

const melancholicPoetProfile: ArchetypeProfile = {
  archetype: {
    name: "雨窗抒写者",
    english_name: "The Rain-Window Scribe",
    core_essence: "你会把复杂情绪、审美回声与记忆细节留得很近，再慢慢把它们变成理解世界的语言。",
    visual_prompt: "A poetic archetype portrait for The Rain-Window Scribe, rain-lit window, blue black velvet night, soft gold reflection, tactile paper textures, intimate melancholy, lyrical cinematic framing, delicate surrealism, East Asian poster composition, 16:9",
  },
  narrativeLead: "你对世界的感受不是粗线条的，而像一层层细密叠起来的回声。",
  narrativeFocus: "很多别人会很快略过的句子、旋律、光线和关系气味，在你这里都会留下更长的停留时间。",
  relationshipLens: "你在关系里要的从来不是热闹，而是那种能穿过表面、真正抵达情绪密度的理解。",
  movementLens: "你不缺洞察，真正困难的是如何不让情绪的深度拖慢现实里的节奏。",
  closingLens: "你不需要把敏感修剪成平庸版本，而是要让它拥有更稳定的出口。",
  growthSuggestions: [
    {
      title: "给高密度情绪一个更稳定的出口",
      description: "你很容易把细微情绪收得很深，如果没有出口，它们会在体内持续发酵。",
      actionable_steps: [
        "保留一个只写情绪质地而不写结论的记录本",
        "用一张图、一句诗或一段旋律去承接当天最强的感受",
        "当情绪很重时，先把它转成素材，不要求立刻变成观点",
      ],
    },
    {
      title: "让关系里的真实表达再早一点出现",
      description: "你并不是不会表达，而是往往等到情绪足够确认后才开口，这会让很多重要内容晚了一拍。",
      actionable_steps: [
        "练习用“我现在有点……”这样的半成品句子开头",
        "别把每次表达都当成一次最终定稿",
        "在你想退回沉默之前，先留下一句最低限度的真实说明",
      ],
    },
    {
      title: "在现实节律里安放诗意，而不是只在夜里保存它",
      description: "诗意感是你的优势，但它需要进入现实时间表，才能真正转化成支持。",
      actionable_steps: [
        "把一个最常重复的意象变成持续创作主题",
        "为自己建立一个白天也能进入的低刺激空间",
        "把创作、散步、整理和休息安排成可重复的节律，而不是只靠灵感发生",
      ],
    },
  ],
  recommendations: {
    books: [
      { title: "《海边的卡夫卡》", author: "村上春树", reason: "它把梦、回声和自我寻找放在同一片海边，像给你的情绪月相找到了文学镜面。" },
      { title: "《一个陌生女人的来信》", author: "斯蒂芬·茨威格", reason: "它能照见情感如何在未说尽处持续发亮，也提醒你不要只把自己留在回声里。" },
      { title: "《情书》", author: "岩井俊二", reason: "它适合你在记忆、误差和留白之间停留，像一枚温柔但不消失的精神旁证。" },
    ],
    films: [
      { title: "《花样年华》", director: "王家卫", reason: "它把节制、遗憾和诗意情绪都保留得很完整。" },
      { title: "《蓝》", director: "克日什托夫·基耶斯洛夫斯基", reason: "如果你想看见情绪如何在色彩和空间里继续流动，这部电影会很适合。" },
      { title: "《情书》", director: "岩井俊二", reason: "它会回应你对记忆、误差和柔软感伤的偏爱。" },
    ],
    music: [
      { artist: "Agnes Obel", album: "Aventine", reason: "它的克制、冷感和情绪余温会很贴近你的内在气候。" },
      { artist: "Hania Rani", album: "Home", reason: "当你想把情绪从夜色里慢慢带回现实，它会成为很好的过渡。" },
      { artist: "王菲", album: "浮躁", reason: "如果你需要一种更贴近中文语境的迷离与诗意，它会很合适。" },
    ],
  },
};

const blackHoleEventHorizonProfile: ArchetypeProfile = {
  archetype: {
    name: "事件视界沉潜者",
    english_name: "The Event Horizon Diver",
    core_essence: "你会靠近别人不敢久看的深处，在高密度情绪、边界与真相之间辨认自己的引力中心。",
    visual_prompt: "A poetic archetype portrait for The Event Horizon Diver, black hole event horizon, antique gold accretion rim, deep ink space, solitary silhouette, restrained cosmic gravity, cinematic East Asian editorial poster, 16:9",
  },
  narrativeLead: "你身上最明显的不是阴郁，而是一种敢于承认深处存在的清醒。",
  narrativeFocus: "你会把失重、裂缝和无法轻易命名的感受当作重要证据，而不是急着把它们修饰成明亮版本。",
  relationshipLens: "你需要关系尊重你的边界，也需要对方不害怕你偶尔沉入更深的地方。",
  movementLens: "你行动之前常会先确认真正的危险在哪里；一旦确认，反而能穿过别人绕开的区域。",
  closingLens: "你的成长不是离开深渊，而是在深渊边缘建立可以返回现实的轨道。",
  growthSuggestions: [
    {
      title: "给高密度情绪设置返回点",
      description: "你可以进入很深的感受，但需要一套稳定的现实返回机制，避免被同一个问题持续吸住。",
      actionable_steps: ["为强烈情绪设置二十分钟记录窗口", "记录结束后做一个身体动作，比如洗脸、步行或整理桌面", "把反复出现的问题标记为主题，而不是每次都从头承受"],
    },
    {
      title: "把边界说成坐标，而不是墙",
      description: "边界对你很重要，但如果只以撤退呈现，别人很难知道怎样靠近才是安全的。",
      actionable_steps: ["用“我现在能给到的距离是……”表达边界", "把不想谈的内容和愿意谈的内容分开放置", "选择一个可信对象练习低风险说明"],
    },
    {
      title: "让洞察落到一个可完成的小实验",
      description: "你不缺深度，真正需要的是把深度带回可操作的时间里。",
      actionable_steps: ["每次想清一个结论后写下一个本周动作", "优先做能减少失重感的小事", "用完成记录代替反复验证自己是否足够清醒"],
    },
  ],
  recommendations: {
    books: [
      { title: "《黑暗的左手》", author: "厄休拉·勒古恩", reason: "它把未知、边界和他者理解放进寒冷星球，很适合作为你的深空镜面。" },
      { title: "《地下室手记》", author: "陀思妥耶夫斯基", reason: "它能照见过度自省如何形成回声，也提醒你把清醒带回生活表面。" },
      { title: "《当尼采哭泣》", author: "欧文·亚隆", reason: "它会把思想、痛苦和关系中的互相拯救放在同一张精神图上。" },
    ],
    films: [
      { title: "《星际穿越》", director: "克里斯托弗·诺兰", reason: "事件视界、时间和牵挂共同构成一套与你相近的引力语言。" },
      { title: "《第一归正会》", director: "保罗·施拉德", reason: "它适合你观看信念、孤独和精神压力如何在现实中互相拉扯。" },
      { title: "《湮灭》", director: "亚历克斯·加兰", reason: "它把自我、毁灭和变形写成一片发光的危险地带。" },
    ],
    music: [
      { artist: "Ben Frost", album: "By the Throat", reason: "粗粝低频和冷感空间能承接你面对深处时的紧绷与清醒。" },
      { artist: "Jóhann Jóhannsson", album: "Orphee", reason: "它像一条从黑暗里慢慢返回的声线，保留哀伤也保留秩序。" },
      { artist: "Tim Hecker", album: "Ravedeath, 1972", reason: "噪声、崩塌和光感并置，适合你处理难以简化的精神质地。" },
    ],
  },
};

const nebulaWeaverProfile: ArchetypeProfile = {
  archetype: {
    name: "星云织梦者",
    english_name: "The Nebula Weaver",
    core_essence: "你擅长把碎片、梦境、色彩和直觉织成新的秩序，让尚未成形的东西先拥有可感的轮廓。",
    visual_prompt: "A poetic archetype portrait for The Nebula Weaver, luminous nebula threads, soft violet ink and silver dust, tactile dream fabric, delicate surreal cosmic studio, East Asian editorial poster, 16:9",
  },
  narrativeLead: "你不像在寻找唯一答案，更像在让许多散落的线索彼此发生关系。",
  narrativeFocus: "梦、画面、旋律和偶然的句子会在你这里重新编织，形成别人一开始看不见的结构。",
  relationshipLens: "你需要能欣赏复杂联想的人，也需要对方允许你保留尚未解释的部分。",
  movementLens: "你的行动常从灵感开始，再慢慢长出形状；太早被框住会让你失去创造性的空气。",
  closingLens: "你的任务不是把自己压成清晰标签，而是学会给灵感稳定的容器。",
  growthSuggestions: [
    {
      title: "为灵感建立收束节律",
      description: "你能产生很多联想，但如果没有收束方式，灵感会变成持续漂浮的星云。",
      actionable_steps: ["把灵感分成素材、主题和待行动三类", "每周只选择一个主题推进到可见产物", "用时间盒限制无限扩散"],
    },
    {
      title: "允许作品先不完整地出现",
      description: "创造性常常需要半成品阶段，你不必等所有意义都对齐后才开始。",
      actionable_steps: ["保留一个只放草稿的空间", "把完成标准降到能被看见而不是完美", "每次输出后只修改一个最重要的问题"],
    },
    {
      title: "把关系里的含混翻译成一句真实话",
      description: "你习惯用意象表达，但亲密关系有时需要更直接的坐标。",
      actionable_steps: ["把“我说不清”改成“我现在最接近的感觉是”", "先表达需要，再解释画面", "选择一个低风险场景练习直接请求"],
    },
  ],
  recommendations: {
    books: [
      { title: "《小王子》", author: "安托万·德·圣-埃克苏佩里", reason: "它用星球、关系和童话结构保存了你珍视的柔软直觉。" },
      { title: "《夜航西飞》", author: "柏瑞尔·马卡姆", reason: "飞行、夜色与自我叙述会回应你对自由和未知轮廓的敏感。" },
      { title: "《沙丘》", author: "弗兰克·赫伯特", reason: "它把预感、生态和命运编成宏大的精神织物。" },
    ],
    films: [
      { title: "《梦》", director: "黑泽明", reason: "它几乎就是由梦境片段织成的视觉星云。" },
      { title: "《千年女优》", director: "今敏", reason: "记忆、表演和追寻在其中不断变形，很贴近你的内在剪辑方式。" },
      { title: "《云图》", director: "沃卓斯基姐妹、汤姆·提克威", reason: "它适合你观看碎片如何跨越时间互相牵引。" },
    ],
    music: [
      { artist: "Cocteau Twins", album: "Heaven or Las Vegas", reason: "朦胧人声和闪烁质地像一团会发光的情绪星云。" },
      { artist: "M83", album: "Hurry Up, We're Dreaming", reason: "它会放大你的梦境感、青春感和宇宙式想象。" },
      { artist: "Kaitlyn Aurelia Smith", album: "EARS", reason: "合成器纹理像植物和星尘同时生长，适合你的感知方式。" },
    ],
  },
};

const solarCoronaProfile: ArchetypeProfile = {
  archetype: {
    name: "日冕引燃者",
    english_name: "The Solar Corona",
    core_essence: "你带着向外扩散的热度、行动力与生命感，擅长把沉睡的东西重新照亮并推向发生。",
    visual_prompt: "A poetic archetype portrait for The Solar Corona, dark sun with radiant corona, restrained gold and white fire, kinetic but elegant, cinematic cosmic warmth, East Asian editorial poster, 16:9",
  },
  narrativeLead: "你身上有一种能把环境带动起来的热度，不一定喧哗，却很难被忽略。",
  narrativeFocus: "你更愿意让生命向前发生，而不是长期停在未完成的解释里。",
  relationshipLens: "你会被有活力、有回应、能共同创造现实经验的关系吸引。",
  movementLens: "当你确认方向有生命力，就会倾向先行动，再在行动里修正路线。",
  closingLens: "你的成长重点是让热度保持可持续，而不是把自己一次性燃尽。",
  growthSuggestions: [
    {
      title: "把热度变成可持续节律",
      description: "你启动很快，但真正重要的是让能量有续航，而不是被短期兴奋带走。",
      actionable_steps: ["把新计划拆成三段节奏", "每次启动前写下停止条件", "给高能量日之后预留恢复时间"],
    },
    {
      title: "让他人的慢速也进入视野",
      description: "你的行动感很强，但关系和团队里并不是所有人都以同样速度燃烧。",
      actionable_steps: ["重要推进前询问对方的节奏", "把催促改成共同确认下一步", "为需要慢一点的人保留解释空间"],
    },
    {
      title: "在明亮处保留真实阴影",
      description: "你容易被期待成为带动者，但你也需要承认疲惫、迟疑和低落。",
      actionable_steps: ["每周记录一次不想照亮任何人的时刻", "把求助视为能量管理而非失败", "允许自己在关系里表达低电量"],
    },
  ],
  recommendations: {
    books: [
      { title: "《活出生命的意义》", author: "维克多·弗兰克尔", reason: "它会把你的行动热度接到更深的意义来源上。" },
      { title: "《太阳照常升起》", author: "欧内斯特·海明威", reason: "它适合你观看热烈生活背后的空缺与继续向前。" },
      { title: "《心流》", author: "米哈里·契克森米哈赖", reason: "它能帮你把能量、专注和创造放进稳定结构里。" },
    ],
    films: [
      { title: "《阳光小美女》", director: "乔纳森·戴顿、维莱莉·法瑞斯", reason: "它把混乱、热情和真实支持放在同一辆车上。" },
      { title: "《日日是好日》", director: "大森立嗣", reason: "它提醒你热度也可以沉淀成细水长流的练习。" },
      { title: "《白日梦想家》", director: "本·斯蒂勒", reason: "它会回应你把想象推向现实旅程的那部分自己。" },
    ],
    music: [
      { artist: "Jon Hopkins", album: "Immunity", reason: "它兼具推进、光感和身体节律，很适合你的启动能量。" },
      { artist: "Four Tet", album: "Rounds", reason: "明亮颗粒与流动结构能帮你保持创造性的呼吸。" },
      { artist: "Tycho", album: "Dive", reason: "它像一层温暖日冕，适合把行动感调到更舒展的频率。" },
    ],
  },
};

const terrestrialPlanetProfile: ArchetypeProfile = {
  archetype: {
    name: "类地栖居者",
    english_name: "The Terrestrial Planet",
    core_essence: "你珍视可栖居的现实、稳定关系与身体节律，擅长把意义落在可触摸的生活表面。",
    visual_prompt: "A poetic archetype portrait for The Terrestrial Planet, dark earth-like planet, quiet forests and shorelines, warm window lights, grounded silver gold atmosphere, intimate cosmic home, East Asian editorial poster, 16:9",
  },
  narrativeLead: "你给人的稳定感不是僵硬，而是一种能让情绪落地的可栖居气候。",
  narrativeFocus: "你会从日常、自然、身体和长期关系里确认意义，而不是只在抽象处寻找答案。",
  relationshipLens: "你重视少数稳定而真实的连接，也愿意为重要的人持续经营生活纹理。",
  movementLens: "你的行动常以稳为前提；一旦确认安全和价值，就能长久推进。",
  closingLens: "你的成长不是离开地面，而是让地面容纳更多真实变化。",
  growthSuggestions: [
    {
      title: "让稳定保留更新空间",
      description: "稳定是你的优势，但如果过度追求可控，新的生命感会很难进入。",
      actionable_steps: ["每月安排一次低风险的新体验", "在固定节律里留一个自由窗口", "把变化视为生态更新而不是秩序破坏"],
    },
    {
      title: "把照料也分配给自己",
      description: "你擅长提供安稳，但也需要让自己的身体和需求被同样认真对待。",
      actionable_steps: ["把自我照料写进日程而不是等空闲", "为疲惫设置明确休息边界", "向重要的人说明你需要怎样被支持"],
    },
    {
      title: "把意义放进具体生活仪式",
      description: "你适合通过可重复的小仪式保存内在价值。",
      actionable_steps: ["固定一个整理空间或做饭的仪式", "把重要关系的连接频率提前约定", "用照片、植物或音乐标记阶段变化"],
    },
  ],
  recommendations: {
    books: [
      { title: "《瓦尔登湖》", author: "亨利·戴维·梭罗", reason: "它把自然、独处和生活实验写成一颗可居住的精神星球。" },
      { title: "《平如美棠》", author: "饶平如", reason: "长期关系和日常细节会回应你珍视的稳定深情。" },
      { title: "《少有人走的路》", author: "M. 斯科特·派克", reason: "它适合你把爱、责任和成长放进现实练习里。" },
    ],
    films: [
      { title: "《小森林》", director: "森淳一", reason: "季节、食物和劳动像你的内在秩序一样缓慢成形。" },
      { title: "《完美的日子》", director: "维姆·文德斯", reason: "它会回应你对重复、清洁和日常微光的理解。" },
      { title: "《海街日记》", director: "是枝裕和", reason: "稳定关系里的温柔和裂缝都被放得很轻，很适合你。" },
    ],
    music: [
      { artist: "Nick Drake", album: "Pink Moon", reason: "朴素、近身而带自然气息，适合你的地面感。" },
      { artist: "久石让", album: "Piano Stories", reason: "温柔旋律能把日常空间慢慢调亮。" },
      { artist: "Penguin Cafe Orchestra", album: "Music from the Penguin Cafe", reason: "轻盈、重复又有生活感，能陪你建立稳定节律。" },
    ],
  },
};

const deepSpaceAnchorProfile: ArchetypeProfile = {
  archetype: {
    name: "深空锚定者",
    english_name: "The Deep Space Anchor",
    core_essence: "你在辽阔、沉默和边界中保持方向感，擅长成为自己精神宇宙里那枚不轻易漂移的锚。",
    visual_prompt: "A poetic archetype portrait for The Deep Space Anchor, lone silver anchor in deep black space, distant stars, calm geometry, restrained moonlight, quiet disciplined cosmic poster, East Asian editorial composition, 16:9",
  },
  narrativeLead: "你给人的感觉安静、遥远，却并不飘散，像在深空里保留了自己的坐标。",
  narrativeFocus: "你会通过知识、秩序、独处和边界来维持内在方向，不轻易被外界噪音改写。",
  relationshipLens: "你需要少量但高质量的连接；对方越尊重你的空间，你反而越可能靠近。",
  movementLens: "你的推进不一定快，但一旦锚点确认，就会展现很强的耐力和持续性。",
  closingLens: "你的成长不是放弃独立，而是让独立不再成为所有靠近的延迟按钮。",
  growthSuggestions: [
    {
      title: "让边界之外也有可进入的门",
      description: "你的空间感很清楚，但真正值得的人需要知道哪扇门可以敲。",
      actionable_steps: ["明确告诉重要的人你的可联系时段", "把拒绝和邀请分开表达", "每周安排一次主动发起的低负担连接"],
    },
    {
      title: "把长期耐力转成阶段反馈",
      description: "你能长期坚持，但如果没有阶段反馈，容易把自己放进孤立的真空。",
      actionable_steps: ["为长期目标设置两周一次的可见检查点", "把进展发给一个可信对象", "记录哪些坚持真的增加了生命感"],
    },
    {
      title: "允许不确定先被共享一点",
      description: "你习惯等想清楚再说，但关系有时需要看见过程而不只是结论。",
      actionable_steps: ["用“我还没想完，但现在是这样”开头", "分享一个小疑问而不是完整方案", "把求证从独自完成改成共同校准"],
    },
  ],
  recommendations: {
    books: [
      { title: "《禅与摩托车维修艺术》", author: "罗伯特·M. 波西格", reason: "它把秩序、品质和精神追问放在一条耐心的长路上。" },
      { title: "《漫长的告别》", author: "雷蒙德·钱德勒", reason: "冷静、边界和孤独中的道德感会贴近你的深空坐标。" },
      { title: "《悉达多》", author: "赫尔曼·黑塞", reason: "它提醒你锚定不是僵住，而是在河流中听见自己的方向。" },
    ],
    films: [
      { title: "《2001太空漫游》", director: "斯坦利·库布里克", reason: "沉默、尺度和秩序感会与你的深空气质相互映照。" },
      { title: "《降临》", director: "丹尼斯·维伦纽瓦", reason: "它把语言、时间和耐心理解放进克制的宇宙场里。" },
      { title: "《永恒和一日》", director: "西奥·安哲罗普洛斯", reason: "缓慢、边界和时间感适合你安静而持久的内在节奏。" },
    ],
    music: [
      { artist: "Stars of the Lid", album: "And Their Refinement of the Decline", reason: "它像深空里的长时间呼吸，适合你稳定内在坐标。" },
      { artist: "Brian Eno", album: "Apollo: Atmospheres and Soundtracks", reason: "冷静、辽阔又不失温度，贴合你的深空锚点。" },
      { artist: "Ryuichi Sakamoto", album: "async", reason: "它把克制、秩序和脆弱并置，能回应你不轻易外露的部分。" },
    ],
  },
};

const archetypeProfiles: Record<string, ArchetypeProfile> = {
  lone_seeker: loneSeekerProfile,
  rational_builder: rationalBuilderProfile,
  gentle_guardian: gentleGuardianProfile,
  existential_wanderer: existentialWandererProfile,
  melancholic_poet: melancholicPoetProfile,
  black_hole_event_horizon: blackHoleEventHorizonProfile,
  nebula_weaver: nebulaWeaverProfile,
  solar_corona: solarCoronaProfile,
  terrestrial_planet: terrestrialPlanetProfile,
  deep_space_anchor: deepSpaceAnchorProfile,
};

const archetypeAliases: Record<string, ArchetypeProfile> = {
  gas_giant: gentleGuardianProfile,
};

export function getBenyuanArchetypeProfile(hint: string | null | undefined) {
  return archetypeProfiles[hint ?? ""] ?? archetypeAliases[hint ?? ""] ?? loneSeekerProfile;
}

const bookCatalog = Object.values(archetypeProfiles)
  .flatMap((profile) => profile.recommendations.books)
  .reduce<Record<string, PsycheConstellation["recommendations"]["books"][number]>>((acc, item) => {
    acc[fingerprint(item.title)] = item;
    return acc;
  }, {});

const filmCatalog = Object.values(archetypeProfiles)
  .flatMap((profile) => profile.recommendations.films)
  .reduce<Record<string, PsycheConstellation["recommendations"]["films"][number]>>((acc, item) => {
    acc[fingerprint(item.title)] = item;
    return acc;
  }, {});

const musicCatalog = Object.values(archetypeProfiles)
  .flatMap((profile) => profile.recommendations.music)
  .reduce<Record<string, PsycheConstellation["recommendations"]["music"][number]>>((acc, item) => {
    acc[`${fingerprint(item.artist)}:${fingerprint(item.album)}`] = item;
    acc[fingerprint(item.album)] = item;
    return acc;
  }, {});

export function repairCanonicalBook(title: string | null | undefined) {
  return bookCatalog[fingerprint(title)] ?? null;
}

export function repairCanonicalFilm(title: string | null | undefined) {
  return filmCatalog[fingerprint(title)] ?? null;
}

export function repairCanonicalMusic(artist: string | null | undefined, album: string | null | undefined) {
  return musicCatalog[`${fingerprint(artist)}:${fingerprint(album)}`] ?? musicCatalog[fingerprint(album)] ?? null;
}

export function isSuspiciousArchetypeName(value: string | null | undefined) {
  const cleaned = cleanText(value ?? "");
  if (!cleaned) return true;
  if (/^[a-z0-9_\-\s]+$/i.test(cleaned) && /[_-]/.test(cleaned)) return true;
  if (/^[a-z]+(?:\s[a-z]+){0,3}$/i.test(cleaned) && cleaned === cleaned.toLowerCase()) return true;
  return false;
}

export function deriveConstellationSupportTone(constellation: Pick<PsycheConstellation, "seven_dimensions">) {
  const emotionalDepth = constellation.seven_dimensions.emotional_depth.score;
  const meaningSeeking = constellation.seven_dimensions.meaning_seeking.score;
  const actionTendency = constellation.seven_dimensions.action_tendency.score;

  return emotionalDepth >= 78 && meaningSeeking >= 74 && actionTendency <= 58 ? "supportive" : "standard";
}
