import type { PsycheConstellation } from "@/lib/benyuan-v3-types";

export const BENYUAN_V3_CONSTELLATION_ENGINE = {
  mode: "hybrid-structured.v1",
  promptVersion: "analyst.v3.hybrid.1",
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
    name: "孤独求索者",
    english_name: "The Solitary Seeker",
    core_essence: "你在孤独与审美里寻找意义，也愿意为真实保留足够的精神纵深。",
    visual_prompt: "A poetic archetype portrait for The Solitary Seeker, cosmic horizon, deep sea dusk, luminous loneliness, tactile fog, restrained gold light, contemplative East Asian poster composition, intimate but vast, cinematic stillness, 16:9",
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
      { title: "《看不见的城市》", author: "伊塔洛·卡尔维诺", reason: "它会回应你对空间、记忆与意义的敏感阅读方式。" },
      { title: "《悉达多》", author: "赫尔曼·黑塞", reason: "它适合仍在追问“我究竟在寻找什么”的你。" },
      { title: "《局外人》", author: "阿尔贝·加缪", reason: "当你想把孤独、距离感与存在追问放到更冷静的光线里看时，它会很贴近你。" },
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
    name: "理性建构者",
    english_name: "The Rational Builder",
    core_essence: "你用结构、秩序和可持续的节律感来理解世界，也用它们保护自己的复杂感受。",
    visual_prompt: "A poetic archetype portrait for The Rational Builder, geometric midnight skyline, restrained silver gold, clean negative space, ambient architecture, measured cinematic light, minimal but warm, East Asian editorial poster composition, 16:9",
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
      { title: "《禅与摩托车维修艺术》", author: "罗伯特·M. 波西格", reason: "它会让你感到“结构”和“意义”并不必然分开。" },
      { title: "《悉达多》", author: "赫尔曼·黑塞", reason: "它能帮你把秩序之外的流动重新纳入视野。" },
      { title: "《清醒思考的艺术》", author: "罗尔夫·多贝里", reason: "当你希望继续保留方法感，同时修正过度控制的惯性时，它会很有用。" },
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
    name: "温柔守护者",
    english_name: "The Gentle Keeper",
    core_essence: "你用温度、稳定与连接感托住自己和重要的人，也在练习先照顾自己的容量。",
    visual_prompt: "A poetic archetype portrait for The Gentle Keeper, dawn mountain theater, soft mist, warm gold lamp, gentle green shadows, intimate atmosphere, quiet healing, delicate East Asian poster composition, black gold palette, 16:9",
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
      { title: "《瓦尔登湖》", author: "亨利·戴维·梭罗", reason: "它会回应你对自然节律、独处感和低噪音生活的偏爱。" },
      { title: "《爱与孤独》", author: "周国平", reason: "它适合你继续思考亲密、边界与真实连接之间的平衡。" },
      { title: "《悉达多》", author: "赫尔曼·黑塞", reason: "它关注内在经验如何慢慢汇成意义，这与你的精神底色很贴近。" },
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
    name: "存在漫游者",
    english_name: "The Existential Wanderer",
    core_essence: "你不断移动、不断追问，也在变化和不确定里寻找一种仍能认出自己的活法。",
    visual_prompt: "A poetic archetype portrait for The Existential Wanderer, moving horizon, dusk road, floating clock fragments, deep blue black gold, cinematic existential atmosphere, soft wind, restless but luminous, East Asian poster composition, 16:9",
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
      { title: "《局外人》", author: "阿尔贝·加缪", reason: "它能陪你把疏离、存在感和真实困惑放在更冷静的光里看。" },
      { title: "《不能承受的生命之轻》", author: "米兰·昆德拉", reason: "如果你总在自由、关系和意义之间来回摆动，它会很贴近你。" },
      { title: "《悉达多》", author: "赫尔曼·黑塞", reason: "当你需要一种更流动、更不线性的成长视角时，它会很有帮助。" },
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
    name: "忧郁诗人",
    english_name: "The Melancholic Poet",
    core_essence: "你会把复杂情绪、审美回声与记忆细节留得很近，再慢慢把它们变成理解世界的语言。",
    visual_prompt: "A poetic archetype portrait for The Melancholic Poet, rain-lit window, blue black velvet night, soft gold reflection, tactile paper textures, intimate melancholy, lyrical cinematic framing, delicate surrealism, East Asian poster composition, 16:9",
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
      { title: "《海边的卡夫卡》", author: "村上春树", reason: "它会回应你对梦感、回声和暧昧现实的偏爱。" },
      { title: "《一个陌生女人的来信》", author: "斯蒂芬·茨威格", reason: "如果你容易被情感密度和未说尽的关系张力击中，它会很贴近你。" },
      { title: "《情书》", author: "岩井俊二", reason: "它适合你在记忆、留白和情绪回响之间继续停留。" },
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

const archetypeProfiles: Record<string, ArchetypeProfile> = {
  lone_seeker: loneSeekerProfile,
  rational_builder: rationalBuilderProfile,
  gentle_guardian: gentleGuardianProfile,
  existential_wanderer: existentialWandererProfile,
  melancholic_poet: melancholicPoetProfile,
};

export function getBenyuanArchetypeProfile(hint: string | null | undefined) {
  return archetypeProfiles[hint ?? ""] ?? loneSeekerProfile;
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
