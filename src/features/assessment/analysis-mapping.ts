import type { FeatureKey, PartialFeatureScores } from "@/lib/feature-space";

type QuestionOptionMap = Record<string, PartialFeatureScores>;

const OPTION_MAPPINGS: Record<string, QuestionOptionMap> = {
  Q001: {
    "薄雾一样的恍惚": { emotional_depth: 0.6, temporal_present_depth: 0.3 },
    "持续低压的疲惫": { emotional_depth: 0.6, temporal_past_weight: 0.3 },
    "潮水起伏般的敏感": { emotional_rhythm_tidal: 1 },
    "短暂但明亮的希望": { temporal_future_pull: 0.6, temporal_change_openness: 0.3 },
    "说不清来由的急迫感": { temporal_future_pull: 0.6, emotional_depth: 0.3 },
    "难得的平稳与安静": { emotional_rhythm_stable: 1 },
  },
  Q002: {
    "在雾里慢慢辨认方向": { temporal_present_depth: 0.6 },
    "刚从旧路上拐弯，脚下还不稳": { temporal_past_weight: 0.6, temporal_change_openness: 0.3 },
    "在一条熟路上走得越来越熟练": { temporal_narrative_coherence: 0.6 },
    "快步朝一个很远的地方赶去": { temporal_future_pull: 1 },
    "暂时停在路边，想弄清自己为什么出发": { temporal_meaning_density: 0.6, temporal_present_depth: 0.3 },
  },
  Q003: {
    "一句像替我说出心事的话": { emotional_granularity: 0.6, aesthetic_literary_tenderness: 0.3 },
    "一个安静到几乎静止的画面": { aesthetic_visual_minimal: 0.6, temporal_present_depth: 0.3 },
    "一段情绪突然漫上来的旋律": { aesthetic_music_intensity: 0.6, emotional_depth: 0.3 },
    "一个让我想起很久以前的气味或场景": { temporal_past_weight: 0.6, temporal_meaning_density: 0.3 },
    "一个关于未来的微小想象": { temporal_future_pull: 0.6 },
  },
  Q004: {
    "骤雨，来得快也退得快": { emotional_rhythm_tidal: 0.6 },
    "连绵阴天，久久不散": { emotional_depth: 0.6 },
    "潮汐，有规律地反复涨落": { emotional_rhythm_tidal: 1 },
    "深海暗流，表面平静但里面很重": { emotional_depth: 1 },
    "晨雾，模糊却柔软": { emotional_depth: 0.6, emotional_granularity: 0.3 },
  },
  Q005: {
    "我知道自己在难过，只是不想解释": { emotional_depth: 1 },
    "我知道不对劲，但说不出具体是什么": { emotional_granularity: 0.3 },
    "我能分清楚很多细微感受，但讲出来太费力": { emotional_granularity: 1 },
    "我通常先说“没事”，等自己消化": { emotional_transformation: 0.3 },
    "我会希望有人继续问下去": { emotional_depth: 0.3, emotional_transformation: 0.3 },
  },
  Q006: {
    "写下来或转成某种表达": { emotional_transformation: 1, aesthetic_literary_tenderness: 0.3 },
    "去散步，让身体先带我走出去": { emotional_rhythm_stable: 0.6 },
    "先关起来，等它自己过去": { emotional_depth: 0.3 },
    "找一个可信的人说出来": { emotional_transformation: 0.6 },
    "沉进去，把它感受完整": { emotional_depth: 1 },
  },
  Q008: {
    "深夜，一切安静下来之后": { aesthetic_music_nocturnal: 0.3, emotional_depth: 0.8 },
    "事情结束以后回想时": { temporal_past_weight: 0.6, temporal_meaning_density: 0.3 },
    "关系里被忽略或误解时": { emotional_depth: 0.6 },
    "看到别人继续往前走时": { temporal_future_pull: 0.6 },
    "忽然被某个作品击中时": { aesthetic_music_intensity: 0.3, emotional_transformation: 0.3 },
  },
  Q009: {
    "脆弱是我不轻易示人的部分": { emotional_depth: 0.6 },
    "脆弱是我理解别人的入口": { emotional_transformation: 0.6 },
    "脆弱会让我失去秩序": { emotional_rhythm_stable: 0.3 },
    "脆弱往往和创作或洞察一起出现": { emotional_transformation: 1, emotional_depth: 0.4 },
    "我还不确定自己是否允许它存在": { emotional_granularity: 0.3 },
  },
  Q010: {
    "我终于把它说清楚了": { emotional_granularity: 0.6, emotional_transformation: 0.3 },
    "时间慢慢冲淡了它": { emotional_rhythm_stable: 0.6 },
    "我把它变成了某种作品或表达": { emotional_transformation: 1, emotional_depth: 0.2 },
    "现实事务把我拉回来了": { temporal_present_depth: 0.3 },
    "有人让我感到自己没有被丢下": { emotional_depth: 0.3 },
  },
  Q011: {
    "荒诞中的孤独与异化": { aesthetic_literary_existential: 1 },
    "绵长而潮湿的忧郁": { aesthetic_literary_tenderness: 0.6, aesthetic_music_nocturnal: 0.3, emotional_depth: 0.3 },
    "冷静、疏离、近乎透明的清醒": { aesthetic_literary_existential: 0.6, aesthetic_visual_minimal: 0.3 },
    "缓慢但坚定的灵魂追索": { temporal_meaning_density: 0.6, aesthetic_literary_existential: 0.3 },
    "精致、克制、带一点苍凉的情感": { aesthetic_literary_tenderness: 1 },
  },
  Q012: {
    "深夜独处的爵士钢琴": { aesthetic_music_nocturnal: 1, emotional_depth: 0.2 },
    "暴雨中的后摇器乐": { aesthetic_music_intensity: 1, emotional_depth: 0.3 },
    "清晨宏大的古典乐章": { temporal_future_pull: 0.3, temporal_meaning_density: 0.3 },
    "带一点冰冷荧光感的电子声场": { aesthetic_visual_surreal: 0.3, aesthetic_music_intensity: 0.6 },
    "轻微沙哑、贴近耳边的民谣低语": { aesthetic_literary_tenderness: 0.3, aesthetic_music_nocturnal: 0.6 },
  },
  Q013: {
    "光线克制、留白很多的房间": { aesthetic_visual_minimal: 1 },
    "旧物很多、带时间痕迹的空间": { temporal_past_weight: 0.3, aesthetic_literary_tenderness: 0.3 },
    "梦境感强、边界不清的场景": { aesthetic_visual_surreal: 1 },
    "秩序清晰、材质冷冽的建筑内部": { aesthetic_visual_minimal: 0.6 },
    "自然疯长、略带荒废感的院落": { aesthetic_visual_surreal: 0.6, temporal_meaning_density: 0.3 },
  },
  Q014: {
    "旧时代缓慢褪色的痕迹": { temporal_past_weight: 1 },
    "当下极短暂的一次发亮": { temporal_present_depth: 1 },
    "未来城市里有点孤独的光": { temporal_future_pull: 1 },
    "看不清年代、像神话又像梦的时空": { aesthetic_visual_surreal: 0.6, temporal_meaning_density: 0.6 },
    "四季更替中反复回来的熟悉感": { temporal_past_weight: 0.3, temporal_present_depth: 0.3 },
  },
  Q015: {
    废墟: { aesthetic_literary_existential: 0.6 },
    雾: { aesthetic_visual_surreal: 0.3, aesthetic_music_nocturnal: 0.3 },
    回声: { temporal_meaning_density: 0.3 },
    留白: { aesthetic_visual_minimal: 0.6 },
    微光: { temporal_present_depth: 0.3 },
    潮汐: { emotional_rhythm_tidal: 0.6 },
    密林: { aesthetic_visual_surreal: 0.6 },
    异乡: { aesthetic_niche_orientation: 0.6, temporal_future_pull: 0.3 },
  },
  Q016: {
    "更容易被打动": { aesthetic_literary_tenderness: 0.6 },
    "会先看它是否有结构支撑": { aesthetic_visual_minimal: 0.3 },
    "我偏爱完成度更高的东西": { aesthetic_visual_minimal: 0.6 },
    "要看它是否保留了真诚": { aesthetic_literary_tenderness: 0.6, emotional_transformation: 0.3 },
    "裂痕本身就是作品的核心": { aesthetic_literary_existential: 0.6, emotional_depth: 0.3 },
  },
  Q017: {
    "它是否替我说出了情绪": { emotional_granularity: 0.3, aesthetic_literary_tenderness: 0.6 },
    "它是否创造了一种能住进去的氛围": { aesthetic_visual_surreal: 0.3, aesthetic_music_nocturnal: 0.3 },
    "它是否让我感到更清醒": { aesthetic_literary_existential: 0.6 },
    "它是否把复杂体验处理得很克制": { aesthetic_visual_minimal: 0.3, emotional_granularity: 0.3 },
    "它是否让我对自己产生新的理解": { temporal_meaning_density: 0.3, emotional_transformation: 0.3 },
  },
  Q018: {
    "我会主动寻找少有人知但很像我的作品": { aesthetic_niche_orientation: 1 },
    "只要真有共鸣，热门或小众都无所谓": { aesthetic_niche_orientation: 0.3 },
    "我喜欢经过时间筛选后留下来的经典": { temporal_past_weight: 0.3 },
    "我常被朋友说审美有点偏门": { aesthetic_niche_orientation: 0.6 },
    "我更在意作品和我当下状态是否匹配": { temporal_present_depth: 0.3 },
  },
  Q019: {
    "不断回头看发生过什么": { temporal_past_weight: 1 },
    "努力守住此刻，不想被别的拉走": { temporal_present_depth: 1 },
    "经常被还没到来的事情牵引": { temporal_future_pull: 1 },
    "三个方向都会来，但轻重不同": { temporal_narrative_coherence: 0.6 },
    "我更像在时间外观察自己的生活": { temporal_meaning_density: 0.6 },
  },
  Q020: {
    "一部细节很多、经常倒带的电影": { temporal_past_weight: 1, temporal_narrative_coherence: 0.3 },
    "几个发亮或发痛的碎片": { emotional_depth: 0.3, temporal_past_weight: 0.6 },
    "一片已经模糊但有气味的雾": { aesthetic_music_nocturnal: 0.3, temporal_past_weight: 0.3 },
    "一条能解释今天的暗线": { temporal_narrative_coherence: 0.6, temporal_meaning_density: 0.3 },
    "我尽量不回头看": { temporal_future_pull: 0.3 },
  },
  Q022: {
    "先抗拒，等到不得不变": { temporal_change_openness: 0 },
    "一边不安，一边还是会往前试": { temporal_change_openness: 0.6, temporal_future_pull: 0.3 },
    "我会主动制造变化感": { temporal_change_openness: 1 },
    "如果变化有意义，我会接受它": { temporal_change_openness: 0.8, temporal_meaning_density: 0.3 },
    "我更想先理解变化在夺走什么": { temporal_meaning_density: 0.6 },
  },
  D001: {
    "旧秩序正在松动": { temporal_past_weight: 0.4, temporal_change_openness: 0.3 },
    "新方向已经发亮但还没成形": { temporal_future_pull: 0.6, temporal_change_openness: 0.3 },
    "关系结构在悄悄改写": { emotional_depth: 0.3, temporal_change_openness: 0.3 },
    "我在重新学习如何安顿自己": { temporal_present_depth: 0.4, emotional_transformation: 0.2 },
    "一切看似平稳，但内里在慢慢位移": { emotional_depth: 0.3, temporal_meaning_density: 0.3 },
  },
  D005: {
    "身体先变重，语言变慢": { emotional_depth: 0.6 },
    "脑子突然非常清醒，像被冷光照住": { aesthetic_literary_existential: 0.4, emotional_depth: 0.2 },
    "会想立刻逃开或切断感受": { emotional_rhythm_stable: 0.2 },
    "我反而更想靠近它，弄懂它": { emotional_depth: 0.6, emotional_transformation: 0.4 },
    "像被潮水推远，与周围暂时失去同步": { emotional_rhythm_tidal: 0.6, emotional_depth: 0.2 },
  },
  D010: {
    镜子: { temporal_meaning_density: 0.3 },
    废墟: { aesthetic_literary_existential: 0.4, temporal_past_weight: 0.2 },
    "门缝里的光": { temporal_future_pull: 0.4, aesthetic_literary_tenderness: 0.2 },
    海岸线: { temporal_future_pull: 0.2, temporal_present_depth: 0.2 },
    长廊: { temporal_narrative_coherence: 0.3 },
    回声: { aesthetic_music_nocturnal: 0.4 },
    密林: { aesthetic_visual_surreal: 0.5 },
    "未寄出的信": { aesthetic_literary_tenderness: 0.4, temporal_past_weight: 0.2 },
  },
  D011: {
    "愿意直面黑暗，但不故作夸张": { aesthetic_literary_existential: 0.6, emotional_depth: 0.2 },
    "看似克制，却留下很深回响": { aesthetic_visual_minimal: 0.4, aesthetic_literary_tenderness: 0.4 },
    "能把孤独写得很辽阔": { aesthetic_literary_existential: 0.4, aesthetic_music_nocturnal: 0.2 },
    "能把混乱组织成某种秩序": { aesthetic_visual_minimal: 0.6 },
    "没有给答案，却给了陪伴感": { aesthetic_literary_tenderness: 0.6 },
  },
  D012: {
    "过去常常把我拉回去": { temporal_past_weight: 1 },
    "我在练习把自己留在此刻": { temporal_present_depth: 1 },
    "未来像一束很远但稳定的光": { temporal_future_pull: 1 },
    "三者经常同时发声，很难分主次": { temporal_narrative_coherence: 0.5, temporal_meaning_density: 0.2 },
    "我更像站在时间边缘看它们流动": { temporal_meaning_density: 0.7 },
  },
  D014: {
    "它像一种被现实磨薄但仍未熄灭的火": { temporal_meaning_density: 0.5, emotional_depth: 0.2 },
    "它来自与人、自然或作品的深层连接": { aesthetic_literary_tenderness: 0.3, temporal_meaning_density: 0.4 },
    "它更像需要自己一点点建造": { temporal_change_openness: 0.3, temporal_meaning_density: 0.5 },
    "我还没有稳定答案，但会持续追问": { aesthetic_literary_existential: 0.3, temporal_meaning_density: 0.5 },
    "它只在极少数高峰时刻短暂出现": { temporal_present_depth: 0.3, temporal_meaning_density: 0.3 },
  },
};

const SCALE_MAPPINGS: Record<string, FeatureKey> = {
  Q007: "emotional_granularity",
  Q021: "temporal_narrative_coherence",
  D004: "emotional_granularity",
  D013: "temporal_narrative_coherence",
};

const TRAUMA_REGEX = /创伤|虐待|暴力|阴影|崩溃|噩梦|窒息|抛弃|遗弃|羞辱|伤害|失控/u;
const SELF_HARM_REGEX = /不想活|想消失|结束自己|自残|轻生|活着没意义/u;
const EXISTENTIAL_REGEX = /意义|虚无|存在|荒诞|空心|为什么活|为何存在/u;
const TIME_REFERENCE_REGEX = /半年前|以前|当时|后来|现在|那时|去年|从前|曾经/u;
const CHANGE_REGEX = /变化|离开|开始|重新|往前|转弯|新生活|改变/u;
const SELF_SOOTHING_REGEX = /慢一点|没关系|辛苦了|允许|接纳|理解自己|别怕|已经很好/u;
const EMOTION_WORD_REGEX = /孤独|难过|忧郁|平静|怀念|羞耻|失望|委屈|希望|疲惫|焦虑|痛苦/u;

export const assessmentOptionMappings = OPTION_MAPPINGS;
export const assessmentScaleMappings = SCALE_MAPPINGS;
export const assessmentTraumaRegex = TRAUMA_REGEX;
export const assessmentSelfHarmRegex = SELF_HARM_REGEX;
export const assessmentExistentialRegex = EXISTENTIAL_REGEX;
export const assessmentTimeReferenceRegex = TIME_REFERENCE_REGEX;
export const assessmentChangeRegex = CHANGE_REGEX;
export const assessmentSelfSoothingRegex = SELF_SOOTHING_REGEX;
export const assessmentEmotionWordRegex = EMOTION_WORD_REGEX;
export const assessmentMappingVersion = "mapping.v0.1";
