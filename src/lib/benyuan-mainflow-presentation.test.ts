import assert from "node:assert/strict";
import test from "node:test";

import type { PsycheConstellation } from "@/lib/benyuan-v3-types";
import {
  buildCollectPrimaryActionModel,
  buildConstellationShortFlow,
  buildProcessingPresentation,
} from "@/lib/benyuan-mainflow-presentation";

test("collect primary action advances to next module when current module is complete", () => {
  const action = buildCollectPrimaryActionModel({
    moduleFilter: undefined,
    allModulesComplete: false,
    activeModuleComplete: true,
    nextActionableModule: "B",
    activeQuestionAnswered: true,
    primaryActionDisabled: false,
  });

  assert.deepEqual(action, {
    label: "进入 B",
    disabled: false,
    intent: "next-module",
  });
});

test("collect primary action becomes enter theater when all modules are complete", () => {
  const action = buildCollectPrimaryActionModel({
    moduleFilter: undefined,
    allModulesComplete: true,
    activeModuleComplete: true,
    nextActionableModule: null,
    activeQuestionAnswered: true,
    primaryActionDisabled: false,
  });

  assert.deepEqual(action, {
    label: "进入剧场",
    disabled: false,
    intent: "submit",
  });
});

test("processing presentation collapses empty state to a single waiting message", () => {
  const view = buildProcessingPresentation({
    phase: "part1",
    kind: "empty",
    progress: 0,
    doneCount: 0,
    totalCount: 4,
  });

  assert.equal(view.backHref, "/collect");
  assert.equal(view.eyebrow, "等待显影");
  assert.equal(view.title, "线索未至");
  assert.equal(view.description, "先回到问题。");
});

test("processing presentation keeps only one stage sentence while running", () => {
  const view = buildProcessingPresentation({
    phase: "constellation",
    kind: "running",
    progress: 62,
    doneCount: 1,
    totalCount: 3,
    activeStageTitle: "精神分析",
    activeStageDetail: "正在把这些线索显影成星图。",
  });

  assert.equal(view.backHref, "/theater");
  assert.equal(view.eyebrow, "第 2 段 / 3");
  assert.equal(view.title, "精神分析");
  assert.equal(view.description, "正在把这些线索显影成星图。");
});

test("constellation short flow keeps only the three highest dimensions and first tension/path", () => {
  const source = createConstellationFixture();

  const flow = buildConstellationShortFlow(source);

  assert.equal(flow.essence.lead, "意义追寻 92%");
  assert.equal(flow.essence.support, "情感深度 86%");
  assert.deepEqual(
    flow.structure.topDimensions.map((item) => `${item.label}:${item.score}`),
    ["意义追寻:92", "情感深度:86", "开放性:79"],
  );
  assert.equal(flow.moment.tension?.name, "理想与现实之间的拉扯");
  assert.equal(flow.moment.path?.title, "允许问题继续存在");
  assert.equal(flow.folded.secondaryTensions.length, 1);
  assert.equal(flow.folded.secondaryPaths.length, 1);
  assert.equal(flow.folded.narrativeParagraphs.length, 3);
});

function createConstellationFixture(): PsycheConstellation {
  return {
    user_id: "usr_1",
    generated_at: "2026-04-20T10:00:00.000Z",
    archetype: {
      name: "追寻者",
      english_name: "The Seeker",
      core_essence: "在迷雾里持续寻找确定性的人。",
      visual_prompt: "placeholder",
    },
    seven_dimensions: {
      openness: { score: 79, interpretation: "你会自然朝向陌生与变化。" },
      independence: { score: 61, interpretation: "你会保留自己的边界感。" },
      emotional_depth: { score: 86, interpretation: "你的感受经常进入更深层。"},
      meaning_seeking: { score: 92, interpretation: "你很难停留在表层答案。" },
      aesthetic_sensitivity: { score: 74, interpretation: "你对氛围和细节都很敏感。" },
      action_tendency: { score: 57, interpretation: "你行动前通常会先观察。"},
      relationship_need: { score: 64, interpretation: "你需要真正被理解的连接。" },
    },
    narrative_overview: [
      "第一段，解释你为什么总会回到更深的问题。",
      "第二段，解释你如何在连接与独处之间摆动。",
      "第三段，解释你为什么会被带有留白的东西吸引。",
    ].join("\n\n"),
    core_tensions: [
      {
        tension_id: 1,
        name: "理想与现实之间的拉扯",
        description: "你很清楚现实的重量，但你又不愿意彻底向它让步。",
        growth_direction: "先守住最重要的一条线，再判断哪些现实值得妥协。",
      },
      {
        tension_id: 2,
        name: "独处与连接之间的犹疑",
        description: "你需要空间，也需要真正能靠近你的人。",
        growth_direction: "先识别让你变轻的人，而不是让你更耗竭的人。",
      },
    ],
    growth_suggestions: [
      {
        title: "允许问题继续存在",
        description: "有些问题不需要立刻被解答，它们更像你还在走的那段路。",
        actionable_steps: ["先写下一句仍然成立的问题。"],
      },
      {
        title: "给行动留下入口",
        description: "不是所有理解都要先完整，再开始动作。",
        actionable_steps: ["把今天能做的一步缩到十分钟以内。"],
      },
    ],
    recommendations: {
      books: [{ title: "悉达多", author: "黑塞", reason: "它会回应你对意义的耐心追问。" }],
      films: [{ title: "降临", director: "丹尼斯·维伦纽瓦", reason: "它会回应你对时间与理解的敏感。" }],
      music: [{ artist: "Sigur Rós", album: "( )", reason: "它和你的留白感会互相照亮。" }],
    },
  };
}
