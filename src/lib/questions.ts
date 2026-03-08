export type QuestionAnswerType = "single" | "multi" | "scale" | "text";

export type QuestionDef = {
  questionId: string;
  moduleId: string;
  answerType: QuestionAnswerType;
  prompt: string;
  options?: string[];
  minSelections?: number;
  maxSelections?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { low: string; high: string };
  optional?: boolean;
};

export const fullLiteQuestionSet: QuestionDef[] = [
  {
    questionId: "Q001",
    moduleId: "entry_state",
    answerType: "multi",
    prompt: "最近一段时间，你更常停留在哪几种内在天气里？",
    options: ["薄雾一样的恍惚", "持续低压的疲惫", "潮水起伏般的敏感", "短暂但明亮的希望", "说不清来由的急迫感", "难得的平稳与安静"],
    minSelections: 2,
    maxSelections: 3,
  },
  {
    questionId: "Q002",
    moduleId: "entry_state",
    answerType: "single",
    prompt: "如果把你最近的生活比作一段路，你更像是：",
    options: ["在雾里慢慢辨认方向", "刚从旧路上拐弯，脚下还不稳", "在一条熟路上走得越来越熟练", "快步朝一个很远的地方赶去", "暂时停在路边，想弄清自己为什么出发"],
  },
  {
    questionId: "Q003",
    moduleId: "entry_state",
    answerType: "single",
    prompt: "现在的你更容易被哪类片刻击中？",
    options: ["一句像替我说出心事的话", "一个安静到几乎静止的画面", "一段情绪突然漫上来的旋律", "一个让我想起很久以前的气味或场景", "一个关于未来的微小想象"],
  },
  {
    questionId: "Q004",
    moduleId: "emotional_weather",
    answerType: "single",
    prompt: "当情绪真正来临时，它更像：",
    options: ["骤雨，来得快也退得快", "连绵阴天，久久不散", "潮汐，有规律地反复涨落", "深海暗流，表面平静但里面很重", "晨雾，模糊却柔软"],
  },
  {
    questionId: "Q005",
    moduleId: "emotional_weather",
    answerType: "single",
    prompt: "当别人问你“你怎么了”，你最常见的真实状态是：",
    options: ["我知道自己在难过，只是不想解释", "我知道不对劲，但说不出具体是什么", "我能分清楚很多细微感受，但讲出来太费力", "我通常先说“没事”，等自己消化", "我会希望有人继续问下去"],
  },
  {
    questionId: "Q006",
    moduleId: "emotional_weather",
    answerType: "single",
    prompt: "你更像如何处理强烈情绪？",
    options: ["写下来或转成某种表达", "去散步，让身体先带我走出去", "先关起来，等它自己过去", "找一个可信的人说出来", "沉进去，把它感受完整"],
  },
  {
    questionId: "Q007",
    moduleId: "emotional_weather",
    answerType: "scale",
    prompt: "当情绪波动时，你能分辨它具体是“失落、羞耻、失望、空心、委屈、怀念”等不同形状吗？",
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: { low: "几乎不能", high: "大多数时候可以" },
  },
  {
    questionId: "Q008",
    moduleId: "emotional_weather",
    answerType: "single",
    prompt: "你最容易在哪个时刻感到情绪被放大？",
    options: ["深夜，一切安静下来之后", "事情结束以后回想时", "关系里被忽略或误解时", "看到别人继续往前走时", "忽然被某个作品击中时"],
  },
  {
    questionId: "Q009",
    moduleId: "emotional_weather",
    answerType: "single",
    prompt: "以下哪句话最接近你对脆弱的感受？",
    options: ["脆弱是我不轻易示人的部分", "脆弱是我理解别人的入口", "脆弱会让我失去秩序", "脆弱往往和创作或洞察一起出现", "我还不确定自己是否允许它存在"],
  },
  {
    questionId: "Q010",
    moduleId: "emotional_weather",
    answerType: "single",
    prompt: "当你从情绪里走出来，通常是因为：",
    options: ["我终于把它说清楚了", "时间慢慢冲淡了它", "我把它变成了某种作品或表达", "现实事务把我拉回来了", "有人让我感到自己没有被丢下"],
  },
  {
    questionId: "Q011",
    moduleId: "aesthetic_fingerprint",
    answerType: "single",
    prompt: "哪种阅读体验最容易让你产生‘这好像就是我没说出口的东西’？",
    options: ["荒诞中的孤独与异化", "绵长而潮湿的忧郁", "冷静、疏离、近乎透明的清醒", "缓慢但坚定的灵魂追索", "精致、克制、带一点苍凉的情感"],
  },
  {
    questionId: "Q012",
    moduleId: "aesthetic_fingerprint",
    answerType: "single",
    prompt: "下面哪种音乐场景最接近你现在的精神背景音？",
    options: ["深夜独处的爵士钢琴", "暴雨中的后摇器乐", "清晨宏大的古典乐章", "带一点冰冷荧光感的电子声场", "轻微沙哑、贴近耳边的民谣低语"],
  },
  {
    questionId: "Q013",
    moduleId: "aesthetic_fingerprint",
    answerType: "single",
    prompt: "如果必须在以下视觉空间里待上一下午，你会选：",
    options: ["光线克制、留白很多的房间", "旧物很多、带时间痕迹的空间", "梦境感强、边界不清的场景", "秩序清晰、材质冷冽的建筑内部", "自然疯长、略带荒废感的院落"],
  },
  {
    questionId: "Q014",
    moduleId: "aesthetic_fingerprint",
    answerType: "single",
    prompt: "你更容易被哪种“时间感”打动？",
    options: ["旧时代缓慢褪色的痕迹", "当下极短暂的一次发亮", "未来城市里有点孤独的光", "看不清年代、像神话又像梦的时空", "四季更替中反复回来的熟悉感"],
  },
  {
    questionId: "Q015",
    moduleId: "aesthetic_fingerprint",
    answerType: "multi",
    prompt: "哪些词会让你本能地靠近？",
    options: ["废墟", "雾", "回声", "留白", "微光", "潮汐", "密林", "异乡"],
    minSelections: 2,
    maxSelections: 3,
  },
  {
    questionId: "Q016",
    moduleId: "aesthetic_fingerprint",
    answerType: "single",
    prompt: "如果一件作品不那么“完美”，但带有真切裂痕，你通常会：",
    options: ["更容易被打动", "会先看它是否有结构支撑", "我偏爱完成度更高的东西", "要看它是否保留了真诚", "裂痕本身就是作品的核心"],
  },
  {
    questionId: "Q017",
    moduleId: "aesthetic_fingerprint",
    answerType: "single",
    prompt: "当你喜欢一首歌/一本书时，你最在意的是：",
    options: ["它是否替我说出了情绪", "它是否创造了一种能住进去的氛围", "它是否让我感到更清醒", "它是否把复杂体验处理得很克制", "它是否让我对自己产生新的理解"],
  },
  {
    questionId: "Q018",
    moduleId: "aesthetic_fingerprint",
    answerType: "single",
    prompt: "对于“小众”这件事，你更接近：",
    options: ["我会主动寻找少有人知但很像我的作品", "只要真有共鸣，热门或小众都无所谓", "我喜欢经过时间筛选后留下来的经典", "我常被朋友说审美有点偏门", "我更在意作品和我当下状态是否匹配"],
  },
  {
    questionId: "Q019",
    moduleId: "temporal_philosophy",
    answerType: "single",
    prompt: "你更常把自己放在哪个时间方向上理解？",
    options: ["不断回头看发生过什么", "努力守住此刻，不想被别的拉走", "经常被还没到来的事情牵引", "三个方向都会来，但轻重不同", "我更像在时间外观察自己的生活"],
  },
  {
    questionId: "Q020",
    moduleId: "temporal_philosophy",
    answerType: "single",
    prompt: "当你回忆过去时，它更像：",
    options: ["一部细节很多、经常倒带的电影", "几个发亮或发痛的碎片", "一片已经模糊但有气味的雾", "一条能解释今天的暗线", "我尽量不回头看"],
  },
  {
    questionId: "Q021",
    moduleId: "temporal_philosophy",
    answerType: "scale",
    prompt: "你觉得自己的生命故事目前有多连贯？",
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: { low: "很碎，很难串起来", high: "大致能看见一条线索" },
  },
  {
    questionId: "Q022",
    moduleId: "temporal_philosophy",
    answerType: "single",
    prompt: "面对变化时，你更常见的内在动作是：",
    options: ["先抗拒，等到不得不变", "一边不安，一边还是会往前试", "我会主动制造变化感", "如果变化有意义，我会接受它", "我更想先理解变化在夺走什么"],
  },
  {
    questionId: "Q023",
    moduleId: "open_reflection",
    answerType: "text",
    prompt: "有没有一句话、一首歌、一本书，曾让你觉得‘终于有人替我说出来了’？如果有，请写下它，以及它为什么击中你。",
    optional: true,
  },
  {
    questionId: "Q024",
    moduleId: "open_reflection",
    answerType: "text",
    prompt: "如果给半年前的自己留一句话，你会写什么？",
    optional: true,
  },
];

export const liteQuestionSet = fullLiteQuestionSet;

export const moodKeywordOptions = ["迷茫", "疲惫", "希望", "平静", "兴奋", "低压"];

export const lifeStageOptions = [
  { value: "student", label: "学生期" },
  { value: "early_career", label: "职场起步" },
  { value: "stable_period", label: "稳定阶段" },
  { value: "turning_point", label: "转折阶段" },
  { value: "exploration", label: "探索阶段" },
] as const;
