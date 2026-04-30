export type FrameworkModule = {
  key: string;
  href: string;
  title: string;
  duration: string;
  summary: string;
  outputs: string[];
  items: string[];
};

export type FrameworkStage = {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  href?: string;
  outputs?: string[];
  bullets: string[];
};

export const part1Modules: FrameworkModule[] = [
  {
    key: "A",
    href: "/collect/a",
    title: "模块 A · 审美偏好",
    duration: "5 题",
    summary: "从核心意象、音乐歌单、文学共鸣、电影美学、灵感场景中提取审美风格画像。",
    outputs: ["审美风格画像", "情感基调", "原型暗示"],
    items: ["A1 核心意象", "A2 音乐偏好", "A3 文学共鸣", "A4 电影美学", "A5 灵感场景"],
  },
  {
    key: "B",
    href: "/collect/b",
    title: "模块 B · 哲学提问",
    duration: "5 题",
    summary: "围绕深夜思考、决策风格、情绪模式、时间哲学、关系哲学建立思维模式与价值取向。",
    outputs: ["思维模式", "价值取向", "时间与关系张力"],
    items: ["B1 深夜思考", "B2 决策风格", "B3 情绪模式", "B4 时间哲学", "B5 关系哲学"],
  },
  {
    key: "C",
    href: "/collect/c",
    title: "模块 C · 生命叙事",
    duration: "3 题",
    summary: "结合社交动态截图、珍贵照片与共鸣时刻，提取生命主题、情感模式与象征元素。",
    outputs: ["生命主题", "情感模式", "叙事线索"],
    items: ["C1 社交动态", "C2 珍贵照片", "C3 共鸣时刻"],
  },
];

export const systemStages: FrameworkStage[] = [
  {
    id: "part1",
    label: "Part 1",
    title: "特征数据收集（15-20 分钟）",
    subtitle: "三组模块共同形成 Part 1 完整数据与聚合特征。",
    href: "/collect",
    outputs: ["part1_data", "aggregated_traits"],
    bullets: [
      "模块 A / 审美偏好：视觉意象、音乐歌单、文学共鸣、电影美学、灵感场景",
      "模块 B / 哲学提问：深夜思考、决策风格、情绪模式、时间哲学、关系哲学",
      "模块 C / 生命叙事：社交动态截图、珍贵照片、共鸣时刻",
    ],
  },
  {
    id: "preprocess",
    label: "Pipeline",
    title: "数据预处理 + 多模态分析",
    subtitle: "OCR、图像理解、标签抽取、置信度聚合在这里完成。",
    bullets: [
      "音乐截图 -> 歌曲与流派识别",
      "社交动态 -> 文本情绪、主题、表达风格分析",
      "珍贵照片 -> 构图、色彩、象征元素与心理投射抽取",
    ],
  },
  {
    id: "director",
    label: "AI Agent 1",
    title: "剧场导演 Agent",
    subtitle: "根据 Part 1 完整数据生成三幕式个性化剧场脚本。",
    href: "/agent/director",
    outputs: ["theater_script"],
    bullets: [
      "输入：Part 1 完整数据（含图片分析结果）",
      "处理：个性化场景、选择分支、镜像对话与尾声生成",
      "输出：三幕式剧场脚本 JSON + AI 绘图 Prompt",
    ],
  },
  {
    id: "part2",
    label: "Part 2",
    title: "剧场模式体验（10-15 分钟）",
    subtitle: "沉浸式场景、选择分支、镜像对话与尾声过渡。",
    href: "/theater",
    outputs: ["act2_choices", "act3_mirror_responses", "metadata"],
    bullets: [
      "第一幕：沉浸式场景（全屏 + 打字机效果 + 环境音）",
      "第二幕：3 个选择点，测试行动 / 关系 / 价值",
      "第三幕：2-3 个镜像问题，纯选择，不做长文本输入",
      "收集：选择记录、停留时间、犹豫模式、hover 轨迹",
    ],
  },
  {
    id: "analyst",
    label: "AI Agent 2",
    title: "精神分析师 Agent",
    subtitle: "整合 Part 1、Part 2 与元数据，做深度心理分析与交叉验证。",
    href: "/agent/analyst",
    outputs: ["psyche_constellation"],
    bullets: [
      "识别精神原型与视觉 Prompt",
      "生成 800 字叙事总览与七维雷达图数据",
      "识别核心张力、成长建议与推荐内容",
    ],
  },
  {
    id: "part3",
    label: "Part 3",
    title: "精神星图呈现（永久保存）",
    subtitle: "把分析结果转化成可阅读、可交互、可保存的精神地形。",
    href: "/constellation",
    outputs: ["原型视觉", "叙事总览", "七维雷达图", "张力卡片", "建议与推荐"],
    bullets: [
      "精神原型视觉（AI 生成）",
      "精神地形总览（叙事文本）",
      "七维雷达图、核心张力、成长建议、书影乐推荐",
    ],
  },
];

export const directorOutputs = [
  "第一幕：场景设定（scene_description + visual_prompt + ambient_sound）",
  "第二幕：3 个选择点，每个 3-4 个选项，带 trait_signal 与 response",
  "第三幕：2-3 个镜像问题，每题 5-7 个纯选择答案",
  "尾声：回归现实 + transition_prompt + transition_animation",
];

export const theaterActs = [
  {
    title: "第一幕 · 沉浸式场景",
    description: "全屏黑场与 AI 场景图叠加，打字机效果逐字呈现场景描述，环境音循环。",
    data: ["阅读完成时间", "点击加速次数", "停留时长"],
  },
  {
    title: "第二幕 · 选择分支",
    description: "3 个关键选择点依次展开，卡片化选项测试行动倾向、关系模式与价值取向。",
    data: ["choice_id", "selected", "hesitation_time", "hover_sequence"],
  },
  {
    title: "第三幕 · 镜像对话",
    description: "镜像自我以对话气泡提出深层问题，用户仅通过纯选择回答，保留沉浸感。",
    data: ["question_id", "selected", "hesitation_time"],
  },
  {
    title: "尾声 · 过渡到星图",
    description: "场景淡出为星空，显示“正在绘制你的精神星图……”，接入分析管线。",
    data: ["transition_start", "transition_complete"],
  },
];

export const analystSteps = [
  "步骤 1：数据整合与交叉验证",
  "步骤 2：精神原型识别",
  "步骤 3：七维雷达图生成",
  "步骤 4：核心张力识别",
  "步骤 5：叙事总览生成（700-900 字）",
  "步骤 6：成长建议生成",
  "步骤 7：书籍 / 电影 / 音乐推荐",
];

export const constellationSections = [
  "精神原型视觉（全屏）",
  "精神地形总览（叙事文本）",
  "七维雷达图（交互式）",
  "核心张力（卡片式）",
  "成长建议（手风琴式）",
  "推荐内容（书籍 / 电影 / 音乐）",
];
