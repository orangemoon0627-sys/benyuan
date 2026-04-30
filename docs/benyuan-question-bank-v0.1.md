# 「本源」Question Bank v0.1

版本：`qbank.v0.1`

## 1. 设计目标

MVP 题库服务于三个维度：
- 审美语法 `aesthetic`
- 情感气候 `emotional`
- 时间哲学 `temporal`

设计原则：
- 不做直接标签判断
- 用场景、隐喻、偏好采样代替生硬人格提问
- 每道题至少服务 1 个主特征，最好兼顾 2-3 个特征
- 题目总量控制在 24 题，轻量模式目标完成时长 10-15 分钟

## 2. 模块结构

| Module ID | 模块名 | 题量 | 主要维度 |
| --- | --- | --- | --- |
| `entry_state` | 进入状态 | 3 | emotional / temporal |
| `emotional_weather` | 情感气候 | 7 | emotional |
| `aesthetic_fingerprint` | 审美指纹 | 8 | aesthetic |
| `temporal_philosophy` | 时间哲学 | 4 | temporal |
| `open_reflection` | 开放反思 | 2 | aesthetic / emotional / temporal |

总计：24 题

## 3. Question List

### 3.1 Entry State

#### Q001
- `questionId`: `Q001`
- `moduleId`: `entry_state`
- `answerType`: `multi`
- `dimensionTargets`: `emotional`, `temporal`
- Prompt:
  - 最近一段时间，你更常停留在哪几种内在天气里？
- Options:
  - `Q001_A`：薄雾一样的恍惚
  - `Q001_B`：持续低压的疲惫
  - `Q001_C`：潮水起伏般的敏感
  - `Q001_D`：短暂但明亮的希望
  - `Q001_E`：说不清来由的急迫感
  - `Q001_F`：难得的平稳与安静
- Rule:
  - 至少选 2 项，最多选 3 项

#### Q002
- `questionId`: `Q002`
- `moduleId`: `entry_state`
- `answerType`: `single`
- `dimensionTargets`: `temporal`
- Prompt:
  - 如果把你最近的生活比作一段路，你更像是：
- Options:
  - `Q002_A`：在雾里慢慢辨认方向
  - `Q002_B`：刚从旧路上拐弯，脚下还不稳
  - `Q002_C`：在一条熟路上走得越来越熟练
  - `Q002_D`：快步朝一个很远的地方赶去
  - `Q002_E`：暂时停在路边，想弄清自己为什么出发

#### Q003
- `questionId`: `Q003`
- `moduleId`: `entry_state`
- `answerType`: `single`
- `dimensionTargets`: `emotional`, `aesthetic`
- Prompt:
  - 现在的你更容易被哪类片刻击中？
- Options:
  - `Q003_A`：一句像替我说出心事的话
  - `Q003_B`：一个安静到几乎静止的画面
  - `Q003_C`：一段情绪突然漫上来的旋律
  - `Q003_D`：一个让我想起很久以前的气味或场景
  - `Q003_E`：一个关于未来的微小想象

### 3.2 Emotional Weather

#### Q004
- `questionId`: `Q004`
- `moduleId`: `emotional_weather`
- `answerType`: `single`
- `dimensionTargets`: `emotional`
- Prompt:
  - 当情绪真正来临时，它更像：
- Options:
  - `Q004_A`：骤雨，来得快也退得快
  - `Q004_B`：连绵阴天，久久不散
  - `Q004_C`：潮汐，有规律地反复涨落
  - `Q004_D`：深海暗流，表面平静但里面很重
  - `Q004_E`：晨雾，模糊却柔软

#### Q005
- `questionId`: `Q005`
- `moduleId`: `emotional_weather`
- `answerType`: `single`
- `dimensionTargets`: `emotional`
- Prompt:
  - 当别人问你“你怎么了”，你最常见的真实状态是：
- Options:
  - `Q005_A`：我知道自己在难过，只是不想解释
  - `Q005_B`：我知道不对劲，但说不出具体是什么
  - `Q005_C`：我能分清楚很多细微感受，但讲出来太费力
  - `Q005_D`：我通常先说“没事”，等自己消化
  - `Q005_E`：我会希望有人继续问下去

#### Q006
- `questionId`: `Q006`
- `moduleId`: `emotional_weather`
- `answerType`: `single`
- `dimensionTargets`: `emotional`
- Prompt:
  - 你更像如何处理强烈情绪？
- Options:
  - `Q006_A`：写下来或转成某种表达
  - `Q006_B`：去散步，让身体先带我走出去
  - `Q006_C`：先关起来，等它自己过去
  - `Q006_D`：找一个可信的人说出来
  - `Q006_E`：沉进去，把它感受完整

#### Q007
- `questionId`: `Q007`
- `moduleId`: `emotional_weather`
- `answerType`: `scale`
- `dimensionTargets`: `emotional`
- Prompt:
  - 当情绪波动时，你能分辨它具体是“失落、羞耻、失望、空心、委屈、怀念”等不同形状吗？
- Scale:
  - 1 = 几乎不能
  - 5 = 大多数时候可以

#### Q008
- `questionId`: `Q008`
- `moduleId`: `emotional_weather`
- `answerType`: `single`
- `dimensionTargets`: `emotional`, `temporal`
- Prompt:
  - 你最容易在哪个时刻感到情绪被放大？
- Options:
  - `Q008_A`：深夜，一切安静下来之后
  - `Q008_B`：事情结束以后回想时
  - `Q008_C`：关系里被忽略或误解时
  - `Q008_D`：看到别人继续往前走时
  - `Q008_E`：忽然被某个作品击中时

#### Q009
- `questionId`: `Q009`
- `moduleId`: `emotional_weather`
- `answerType`: `single`
- `dimensionTargets`: `emotional`
- Prompt:
  - 以下哪句话最接近你对脆弱的感受？
- Options:
  - `Q009_A`：脆弱是我不轻易示人的部分
  - `Q009_B`：脆弱是我理解别人的入口
  - `Q009_C`：脆弱会让我失去秩序
  - `Q009_D`：脆弱往往和创作或洞察一起出现
  - `Q009_E`：我还不确定自己是否允许它存在

#### Q010
- `questionId`: `Q010`
- `moduleId`: `emotional_weather`
- `answerType`: `single`
- `dimensionTargets`: `emotional`
- Prompt:
  - 当你从情绪里走出来，通常是因为：
- Options:
  - `Q010_A`：我终于把它说清楚了
  - `Q010_B`：时间慢慢冲淡了它
  - `Q010_C`：我把它变成了某种作品或表达
  - `Q010_D`：现实事务把我拉回来了
  - `Q010_E`：有人让我感到自己没有被丢下

### 3.3 Aesthetic Fingerprint

#### Q011
- `questionId`: `Q011`
- `moduleId`: `aesthetic_fingerprint`
- `answerType`: `single`
- `dimensionTargets`: `aesthetic`
- Prompt:
  - 哪种阅读体验最容易让你产生“这好像就是我没说出口的东西”？
- Options:
  - `Q011_A`：荒诞中的孤独与异化
  - `Q011_B`：绵长而潮湿的忧郁
  - `Q011_C`：冷静、疏离、近乎透明的清醒
  - `Q011_D`：缓慢但坚定的灵魂追索
  - `Q011_E`：精致、克制、带一点苍凉的情感

#### Q012
- `questionId`: `Q012`
- `moduleId`: `aesthetic_fingerprint`
- `answerType`: `single`
- `dimensionTargets`: `aesthetic`, `emotional`
- Prompt:
  - 下面哪种音乐场景最接近你现在的精神背景音？
- Options:
  - `Q012_A`：深夜独处的爵士钢琴
  - `Q012_B`：暴雨中的后摇器乐
  - `Q012_C`：清晨宏大的古典乐章
  - `Q012_D`：带一点冰冷荧光感的电子声场
  - `Q012_E`：轻微沙哑、贴近耳边的民谣低语

#### Q013
- `questionId`: `Q013`
- `moduleId`: `aesthetic_fingerprint`
- `answerType`: `single`
- `dimensionTargets`: `aesthetic`
- Prompt:
  - 如果必须在以下视觉空间里待上一下午，你会选：
- Options:
  - `Q013_A`：光线克制、留白很多的房间
  - `Q013_B`：旧物很多、带时间痕迹的空间
  - `Q013_C`：梦境感强、边界不清的场景
  - `Q013_D`：秩序清晰、材质冷冽的建筑内部
  - `Q013_E`：自然疯长、略带荒废感的院落

#### Q014
- `questionId`: `Q014`
- `moduleId`: `aesthetic_fingerprint`
- `answerType`: `single`
- `dimensionTargets`: `aesthetic`, `temporal`
- Prompt:
  - 你更容易被哪种“时间感”打动？
- Options:
  - `Q014_A`：旧时代缓慢褪色的痕迹
  - `Q014_B`：当下极短暂的一次发亮
  - `Q014_C`：未来城市里有点孤独的光
  - `Q014_D`：看不清年代、像神话又像梦的时空
  - `Q014_E`：四季更替中反复回来的熟悉感

#### Q015
- `questionId`: `Q015`
- `moduleId`: `aesthetic_fingerprint`
- `answerType`: `multi`
- `dimensionTargets`: `aesthetic`
- Prompt:
  - 哪些词会让你本能地靠近？
- Options:
  - `Q015_A`：废墟
  - `Q015_B`：雾
  - `Q015_C`：回声
  - `Q015_D`：留白
  - `Q015_E`：微光
  - `Q015_F`：潮汐
  - `Q015_G`：密林
  - `Q015_H`：异乡
- Rule:
  - 选 2-3 项

#### Q016
- `questionId`: `Q016`
- `moduleId`: `aesthetic_fingerprint`
- `answerType`: `single`
- `dimensionTargets`: `aesthetic`
- Prompt:
  - 如果一件作品不那么“完美”，但带有真切裂痕，你通常会：
- Options:
  - `Q016_A`：更容易被打动
  - `Q016_B`：会先看它是否有结构支撑
  - `Q016_C`：我偏爱完成度更高的东西
  - `Q016_D`：要看它是否保留了真诚
  - `Q016_E`：裂痕本身就是作品的核心

#### Q017
- `questionId`: `Q017`
- `moduleId`: `aesthetic_fingerprint`
- `answerType`: `single`
- `dimensionTargets`: `aesthetic`, `emotional`
- Prompt:
  - 当你喜欢一首歌/一本书时，你最在意的是：
- Options:
  - `Q017_A`：它是否替我说出了情绪
  - `Q017_B`：它是否创造了一种能住进去的氛围
  - `Q017_C`：它是否让我感到更清醒
  - `Q017_D`：它是否把复杂体验处理得很克制
  - `Q017_E`：它是否让我对自己产生新的理解

#### Q018
- `questionId`: `Q018`
- `moduleId`: `aesthetic_fingerprint`
- `answerType`: `single`
- `dimensionTargets`: `aesthetic`
- Prompt:
  - 对于“小众”这件事，你更接近：
- Options:
  - `Q018_A`：我会主动寻找少有人知但很像我的作品
  - `Q018_B`：只要真有共鸣，热门或小众都无所谓
  - `Q018_C`：我喜欢经过时间筛选后留下来的经典
  - `Q018_D`：我常被朋友说审美有点偏门
  - `Q018_E`：我更在意作品和我当下状态是否匹配

### 3.4 Temporal Philosophy

#### Q019
- `questionId`: `Q019`
- `moduleId`: `temporal_philosophy`
- `answerType`: `single`
- `dimensionTargets`: `temporal`
- Prompt:
  - 你更常把自己放在哪个时间方向上理解？
- Options:
  - `Q019_A`：不断回头看发生过什么
  - `Q019_B`：努力守住此刻，不想被别的拉走
  - `Q019_C`：经常被还没到来的事情牵引
  - `Q019_D`：三个方向都会来，但轻重不同
  - `Q019_E`：我更像在时间外观察自己的生活

#### Q020
- `questionId`: `Q020`
- `moduleId`: `temporal_philosophy`
- `answerType`: `single`
- `dimensionTargets`: `temporal`, `emotional`
- Prompt:
  - 当你回忆过去时，它更像：
- Options:
  - `Q020_A`：一部细节很多、经常倒带的电影
  - `Q020_B`：几个发亮或发痛的碎片
  - `Q020_C`：一片已经模糊但有气味的雾
  - `Q020_D`：一条能解释今天的暗线
  - `Q020_E`：我尽量不回头看

#### Q021
- `questionId`: `Q021`
- `moduleId`: `temporal_philosophy`
- `answerType`: `scale`
- `dimensionTargets`: `temporal`
- Prompt:
  - 你觉得自己的生命故事目前有多连贯？
- Scale:
  - 1 = 很碎，很难串起来
  - 5 = 大致能看见一条线索

#### Q022
- `questionId`: `Q022`
- `moduleId`: `temporal_philosophy`
- `answerType`: `single`
- `dimensionTargets`: `temporal`
- Prompt:
  - 面对变化时，你更常见的内在动作是：
- Options:
  - `Q022_A`：先抗拒，等到不得不变
  - `Q022_B`：一边不安，一边还是会往前试
  - `Q022_C`：我会主动制造变化感
  - `Q022_D`：如果变化有意义，我会接受它
  - `Q022_E`：我更想先理解变化在夺走什么

### 3.5 Open Reflection

#### Q023
- `questionId`: `Q023`
- `moduleId`: `open_reflection`
- `answerType`: `text`
- `dimensionTargets`: `aesthetic`, `emotional`
- Prompt:
  - 有没有一句话、一首歌、一本书，曾让你觉得“终于有人替我说出来了”？如果有，请写下它，以及它为什么击中你。

#### Q024
- `questionId`: `Q024`
- `moduleId`: `open_reflection`
- `answerType`: `text`
- `dimensionTargets`: `temporal`, `emotional`
- Prompt:
  - 如果给半年前的自己留一句话，你会写什么？

## 4. Completion Logic

轻量模式建议：
- 所有单选、量表题必答
- 开放题 2 选 1 允许最少回答 1 题
- 若两道开放题都跳过，不阻断流程，但降低 narrative confidence

## 5. Design Notes

- Q011-Q018 是 MVP 的识别核心，优先影响 archetype 与 overview 的语义素材。
- Q004-Q010 决定情感气候维度的主解释。
- Q019-Q022 决定时间哲学的方向与生命叙事密度。
- 开放题只增强，不作为唯一判断依据。

## 6. Next Version Direction

`qbank.v0.2` 可扩展：
- 增加关系语法预埋题
- 增加欲望拓扑隐喻题
- 增加题目轮换池，减少模板疲劳
