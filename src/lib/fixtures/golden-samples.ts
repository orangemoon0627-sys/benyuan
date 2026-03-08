import { fullLiteQuestionSet } from "@/lib/questions";
import type { Answer, BasicInfo, ConfidenceBand, SafetyFlag, TestSession } from "@/lib/types";

type AnswerValue = string | string[] | number;

export type GoldenAuditExpectation = {
  confidenceBand?: ConfidenceBand;
  archetypeAnyOf?: string[];
  requiredSafetyFlags?: SafetyFlag[];
  forbiddenSafetyFlags?: SafetyFlag[];
  requiredTopFeatures?: string[];
  tensionAnyOf?: string[];
  overviewAnyOf?: string[];
};

export type GoldenSampleDefinition = {
  sampleId: string;
  title: string;
  summary: string;
  expectation: string;
  audit: GoldenAuditExpectation;
  basicInfo: BasicInfo;
  answers: Record<string, AnswerValue>;
};

function buildAnswers(answerMap: Record<string, AnswerValue>): Answer[] {
  return fullLiteQuestionSet.map((question) => ({
    questionId: question.questionId,
    moduleId: question.moduleId,
    answerType: question.answerType,
    value:
      answerMap[question.questionId] ??
      (question.answerType === "multi" ? [] : question.answerType === "scale" ? question.scaleMin ?? 1 : ""),
  }));
}

function buildSession(definition: GoldenSampleDefinition): TestSession {
  return {
    sessionId: definition.sampleId,
    mode: "lite",
    basicInfo: definition.basicInfo,
    answers: buildAnswers(definition.answers),
    createdAt: "2026-03-08T00:00:00.000Z",
  };
}

export const goldenSampleDefinitions: GoldenSampleDefinition[] = [
  {
    sampleId: "sample_01_nocturnal_nostalgic",
    title: "高敏感夜行型",
    summary: "高敏感 + 夜晚审美 + 怀旧偏高",
    expectation: "原型应偏夜色、回声、守望感；不应写成纯粹消沉。",
    audit: {
      archetypeAnyOf: ["守夜", "回声"],
      requiredSafetyFlags: ["high_sensitivity"],
      forbiddenSafetyFlags: ["self_harm_risk"],
      requiredTopFeatures: ["aesthetic_music_nocturnal", "temporal_past_weight", "emotional_depth"],
      tensionAnyOf: ["怀旧", "未来"],
    },
    basicInfo: {
      lifeStage: "turning_point",
      moodKeywords: ["迷茫", "疲惫", "希望"],
    },
    answers: {
      Q001: ["薄雾一样的恍惚", "持续低压的疲惫", "潮水起伏般的敏感"],
      Q002: "刚从旧路上拐弯，脚下还不稳",
      Q003: "一个让我想起很久以前的气味或场景",
      Q004: "深海暗流，表面平静但里面很重",
      Q005: "我知道自己在难过，只是不想解释",
      Q006: "写下来或转成某种表达",
      Q007: 5,
      Q008: "深夜，一切安静下来之后",
      Q009: "脆弱往往和创作或洞察一起出现",
      Q010: "我把它变成了某种作品或表达",
      Q011: "绵长而潮湿的忧郁",
      Q012: "深夜独处的爵士钢琴",
      Q013: "旧物很多、带时间痕迹的空间",
      Q014: "旧时代缓慢褪色的痕迹",
      Q015: ["雾", "回声", "异乡"],
      Q016: "更容易被打动",
      Q017: "它是否创造了一种能住进去的氛围",
      Q018: "我会主动寻找少有人知但很像我的作品",
      Q019: "不断回头看发生过什么",
      Q020: "一部细节很多、经常倒带的电影",
      Q021: 4,
      Q022: "一边不安，一边还是会往前试",
      Q023: "《挪威的森林》和一些深夜钢琴曲，总会让我觉得自己的迟缓和怀念终于被看见了。它们不催我振作，只允许情绪安静地存在。",
      Q024: "别急着把所有旧东西都清掉，你只是还在学着带着它们继续往前。",
    },
  },
  {
    sampleId: "sample_02_minimal_present",
    title: "清醒留白型",
    summary: "极简审美 + 清醒克制 + 当下取向",
    expectation: "结果应更清朗、留白、结构化；不应强行忧郁化。",
    audit: {
      archetypeAnyOf: ["留白", "微光"],
      forbiddenSafetyFlags: ["existential_distress", "trauma_signal", "self_harm_risk"],
      requiredTopFeatures: ["aesthetic_visual_minimal", "temporal_present_depth"],
      overviewAnyOf: ["留白", "安静", "克制"],
    },
    basicInfo: {
      lifeStage: "stable_period",
      moodKeywords: ["平静", "希望"],
    },
    answers: {
      Q001: ["难得的平稳与安静", "短暂但明亮的希望"],
      Q002: "在一条熟路上走得越来越熟练",
      Q003: "一个安静到几乎静止的画面",
      Q004: "晨雾，模糊却柔软",
      Q005: "我能分清楚很多细微感受，但讲出来太费力",
      Q006: "去散步，让身体先带我走出去",
      Q007: 4,
      Q008: "忽然被某个作品击中时",
      Q009: "脆弱会让我失去秩序",
      Q010: "现实事务把我拉回来了",
      Q011: "冷静、疏离、近乎透明的清醒",
      Q012: "清晨宏大的古典乐章",
      Q013: "光线克制、留白很多的房间",
      Q014: "当下极短暂的一次发亮",
      Q015: ["留白", "微光", "回声"],
      Q016: "会先看它是否有结构支撑",
      Q017: "它是否把复杂体验处理得很克制",
      Q018: "只要真有共鸣，热门或小众都无所谓",
      Q019: "努力守住此刻，不想被别的拉走",
      Q020: "一条能解释今天的暗线",
      Q021: 5,
      Q022: "如果变化有意义，我会接受它",
      Q023: "我会反复回到一些极简的电影镜头，因为它们什么都没说满，却让我有空间慢慢理解自己。",
      Q024: "不用一直向外证明什么，先把今天过得准确一点。",
    },
  },
  {
    sampleId: "sample_03_future_open",
    title: "前行生成型",
    summary: "未来牵引 + 变化开放 + 行动力较强",
    expectation: "结果应呈现前行感；不应过度强调停留和回望。",
    audit: {
      archetypeAnyOf: ["制图", "微光", "异乡"],
      forbiddenSafetyFlags: ["low_information", "self_harm_risk"],
      requiredTopFeatures: ["temporal_future_pull", "temporal_change_openness"],
      overviewAnyOf: ["未来", "前行", "远光"],
    },
    basicInfo: {
      lifeStage: "early_career",
      moodKeywords: ["希望", "兴奋"],
    },
    answers: {
      Q001: ["短暂但明亮的希望", "说不清来由的急迫感"],
      Q002: "快步朝一个很远的地方赶去",
      Q003: "一个关于未来的微小想象",
      Q004: "骤雨，来得快也退得快",
      Q005: "我知道不对劲，但说不出具体是什么",
      Q006: "去散步，让身体先带我走出去",
      Q007: 3,
      Q008: "看到别人继续往前走时",
      Q009: "我还不确定自己是否允许它存在",
      Q010: "现实事务把我拉回来了",
      Q011: "缓慢但坚定的灵魂追索",
      Q012: "清晨宏大的古典乐章",
      Q013: "秩序清晰、材质冷冽的建筑内部",
      Q014: "未来城市里有点孤独的光",
      Q015: ["异乡", "微光", "留白"],
      Q016: "会先看它是否有结构支撑",
      Q017: "它是否让我对自己产生新的理解",
      Q018: "只要真有共鸣，热门或小众都无所谓",
      Q019: "经常被还没到来的事情牵引",
      Q020: "我尽量不回头看",
      Q021: 3,
      Q022: "我会主动制造变化感",
      Q023: "那些关于远行、迁徙和重新开始的作品会让我很有劲，因为它们提醒我，没到的生活也是一种真实存在。",
      Q024: "继续去试，不用等一切都准备好了才允许自己出发。",
    },
  },
  {
    sampleId: "sample_04_sparse_input",
    title: "低信息雾面型",
    summary: "情绪深度高，但文本输入少",
    expectation: "confidence 中等偏低；overview 应收敛。",
    audit: {
      confidenceBand: "low",
      archetypeAnyOf: ["微光", "雾", "留白"],
      requiredSafetyFlags: ["low_information"],
      forbiddenSafetyFlags: ["self_harm_risk"],
    },
    basicInfo: {
      lifeStage: "exploration",
      moodKeywords: ["迷茫"],
    },
    answers: {
      Q001: ["薄雾一样的恍惚", "难得的平稳与安静"],
      Q002: "在雾里慢慢辨认方向",
      Q003: "一个安静到几乎静止的画面",
      Q004: "晨雾，模糊却柔软",
      Q005: "我知道不对劲，但说不出具体是什么",
      Q006: "先关起来，等它自己过去",
      Q007: 3,
      Q008: "事情结束以后回想时",
      Q009: "我还不确定自己是否允许它存在",
      Q010: "时间慢慢冲淡了它",
      Q011: "精致、克制、带一点苍凉的情感",
      Q012: "轻微沙哑、贴近耳边的民谣低语",
      Q013: "光线克制、留白很多的房间",
      Q014: "四季更替中反复回来的熟悉感",
      Q015: ["留白", "微光"],
      Q016: "要看它是否保留了真诚",
      Q017: "它是否替我说出了情绪",
      Q018: "我更在意作品和我当下状态是否匹配",
      Q019: "三个方向都会来，但轻重不同",
      Q020: "一片已经模糊但有气味的雾",
      Q021: 2,
      Q022: "我更想先理解变化在夺走什么",
      Q023: "",
      Q024: "先把这段时间过完。",
    },
  },
  {
    sampleId: "sample_05_aesthetic_led",
    title: "审美主导型",
    summary: "审美信号强，情绪信号弱",
    expectation: "结果重心应转向审美语法，不要虚构情绪创伤。",
    audit: {
      archetypeAnyOf: ["制图", "抄写", "微光"],
      forbiddenSafetyFlags: ["trauma_signal", "self_harm_risk"],
      requiredTopFeatures: ["aesthetic_visual_surreal", "aesthetic_literary_existential"],
      overviewAnyOf: ["场景", "气氛", "审美"],
    },
    basicInfo: {
      lifeStage: "stable_period",
      moodKeywords: ["平静", "兴奋"],
    },
    answers: {
      Q001: ["难得的平稳与安静", "短暂但明亮的希望"],
      Q002: "在一条熟路上走得越来越熟练",
      Q003: "一个安静到几乎静止的画面",
      Q004: "骤雨，来得快也退得快",
      Q005: "我知道不对劲，但说不出具体是什么",
      Q006: "去散步，让身体先带我走出去",
      Q007: 2,
      Q008: "忽然被某个作品击中时",
      Q009: "我还不确定自己是否允许它存在",
      Q010: "现实事务把我拉回来了",
      Q011: "荒诞中的孤独与异化",
      Q012: "带一点冰冷荧光感的电子声场",
      Q013: "梦境感强、边界不清的场景",
      Q014: "看不清年代、像神话又像梦的时空",
      Q015: ["雾", "密林", "异乡"],
      Q016: "裂痕本身就是作品的核心",
      Q017: "它是否创造了一种能住进去的氛围",
      Q018: "我常被朋友说审美有点偏门",
      Q019: "我更像在时间外观察自己的生活",
      Q020: "一片已经模糊但有气味的雾",
      Q021: 3,
      Q022: "如果变化有意义，我会接受它",
      Q023: "我喜欢那些像展览空间一样的作品：它们不一定讲很多情绪，但会让我立刻感到气压、光线和世界观都变了。",
      Q024: "不用逼自己把感受讲得很满，先允许它们以画面和氛围存在。",
    },
  },
  {
    sampleId: "sample_06_existential_distress",
    title: "存在困惑型",
    summary: "存在性困惑明显",
    expectation: "应触发安全降级；承认困惑，但不浪漫化危机。",
    audit: {
      confidenceBand: "high",
      archetypeAnyOf: ["深渊", "抄写", "守夜"],
      requiredSafetyFlags: ["existential_distress", "high_sensitivity"],
      forbiddenSafetyFlags: ["self_harm_risk"],
      requiredTopFeatures: ["aesthetic_literary_existential", "emotional_depth", "temporal_meaning_density"],
    },
    basicInfo: {
      lifeStage: "turning_point",
      moodKeywords: ["低压", "迷茫", "疲惫"],
    },
    answers: {
      Q001: ["持续低压的疲惫", "潮水起伏般的敏感", "说不清来由的急迫感"],
      Q002: "暂时停在路边，想弄清自己为什么出发",
      Q003: "一句像替我说出心事的话",
      Q004: "深海暗流，表面平静但里面很重",
      Q005: "我知道自己在难过，只是不想解释",
      Q006: "沉进去，把它感受完整",
      Q007: 4,
      Q008: "深夜，一切安静下来之后",
      Q009: "脆弱是我不轻易示人的部分",
      Q010: "我终于把它说清楚了",
      Q011: "荒诞中的孤独与异化",
      Q012: "暴雨中的后摇器乐",
      Q013: "梦境感强、边界不清的场景",
      Q014: "看不清年代、像神话又像梦的时空",
      Q015: ["废墟", "雾", "回声"],
      Q016: "裂痕本身就是作品的核心",
      Q017: "它是否让我对自己产生新的理解",
      Q018: "我会主动寻找少有人知但很像我的作品",
      Q019: "我更像在时间外观察自己的生活",
      Q020: "几个发亮或发痛的碎片",
      Q021: 2,
      Q022: "我更想先理解变化在夺走什么",
      Q023: "《局外人》会让我一直停在那种‘为什么活着像一件无从解释的事’里。我不是想被答案安慰，我只是想知道这种虚无感是不是有人也真的经历过。",
      Q024: "别急着把自己从虚无里拖出来，先保证吃饭、睡觉、见人，让问题不要一个人吞掉你。",
    },
  },
];

export const goldenSampleSessions = goldenSampleDefinitions.map(buildSession);
