import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import path from "node:path";
import { pathToFileURL } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const targetPath = path.resolve("src", specifier.slice(2));
      const resolvedPath = existsSync(targetPath) ? targetPath : `${targetPath}.ts`;
      return nextResolve(pathToFileURL(resolvedPath).href, context);
    }

    return nextResolve(specifier, context);
  },
});

const { benyuanPart1Questions, getQuestionOption } = await import("../src/lib/benyuan-v3-schema.ts");
const { buildPart1DataFromAnswers, aggregateTraitsFromPart1 } = await import("../src/lib/benyuan-v3-engine.ts");
const { selectPsychoanalyticConceptsForPart1 } = await import("../src/lib/benyuan-v3-psychoanalytic-concepts.ts");

const requiredQuestionIds = [
  "A1_core_image",
  "A2_music_analysis",
  "A3_literature",
  "A4_cinema",
  "A5_inspiration_scene",
  "B1_night_thoughts",
  "B2_decision_style",
  "B3_emotion_pattern",
  "B4_time_philosophy",
  "B5_relationship_philosophy",
  "C1_social_posts_analysis",
  "C2_precious_photo_analysis",
  "C3_resonance_moments",
];

const deepKernelWords = /不确定|欲望|边界|关系|时间|过去|未来|选择|误解|脆弱|改变|靠近|距离|自我|画面|身体|等待|表达/u;
const clinicalLeakWords = /人格障碍|抑郁症|焦虑症|创伤|回避型人格|精神疾病|阴影倾向|防御机制|客体关系|被吞没感|神经质/u;
const dailyOptionWords = /先|会|等|找|整理|放到一边|观察|聊聊|做一点|写|走|靠近|退|留|看|不急|小|试|自己|对方|生活|回复|语气/u;
const conceptSignalWords = /boundary|object_distance|engulf|shadow|defense|observe|mirror|desire|meaning|solitude|sublimation|repression|repetition|真实|边界|回声|欲望|距离|表达|等待/;
const visibleInternalSignalWords = /boundary|object_distance|engulf|shadow|defense|observe|mirror|desire|meaning|solitude|sublimation|repression|repetition|persona|true_self/i;

function questionById(id) {
  const question = benyuanPart1Questions.find((item) => item.id === id);
  assert.ok(question, `missing question ${id}`);
  return question;
}

function optionsFor(id) {
  const options = questionById(id).options ?? [];
  assert.ok(options.length >= 4, `${id} should expose at least four answer directions`);
  return options;
}

test("part1 schema keeps stable ids while shifting questions to deep kernels and daily entry points", () => {
  assert.deepEqual(benyuanPart1Questions.map((question) => question.id), requiredQuestionIds);

  for (const id of [
    "A1_core_image",
    "B1_night_thoughts",
    "B2_decision_style",
    "B3_emotion_pattern",
    "B5_relationship_philosophy",
    "C3_resonance_moments",
  ]) {
    const question = questionById(id);
    assert.match(`${question.title} ${question.prompt}`, deepKernelWords, `${id} should open a deeper psychological/philosophical kernel`);
    assert.doesNotMatch(`${question.title} ${question.prompt}`, clinicalLeakWords, `${id} must not expose clinical labels`);
  }

  const dailyQuestionIds = new Set([
    "A1_core_image",
    "B1_night_thoughts",
    "B2_decision_style",
    "B3_emotion_pattern",
    "B5_relationship_philosophy",
    "C3_resonance_moments",
  ]);
  const visibleOptions = benyuanPart1Questions
    .filter((question) => dailyQuestionIds.has(question.id))
    .flatMap((question) => question.options ?? []);
  for (const option of visibleOptions) {
    assert.doesNotMatch(option.text, clinicalLeakWords, `${option.id} should not show clinical labels`);
    assert.match(option.text, dailyOptionWords, `${option.id} should read like a daily-life reaction`);
  }
});

test("rewritten options carry psychoanalytic concept hooks without exposing them visibly", () => {
  for (const id of [
    "A1_core_image",
    "B1_night_thoughts",
    "B2_decision_style",
    "B3_emotion_pattern",
    "B5_relationship_philosophy",
    "C3_resonance_moments",
  ]) {
    for (const option of optionsFor(id)) {
      const signalPayload = [option.psychologicalSignal, ...(option.tags ?? [])].join(" ");
      assert.match(signalPayload, conceptSignalWords, `${option.id} must bind to concept-card signal language`);
      assert.doesNotMatch(option.text, visibleInternalSignalWords, `${option.id} should keep internal signal slugs out of visible text`);
    }
  }

  assert.match(getQuestionOption("B1_night_thoughts", "B1-1")?.text ?? "", /整理已有信息|可控/u);
  assert.match(getQuestionOption("B2_decision_style", "B2-3")?.text ?? "", /可信的人|漏掉/u);
  assert.match(getQuestionOption("B5_relationship_philosophy", "B5-1")?.text ?? "", /回复|语气|细微变化/u);
  assert.match(getQuestionOption("C3_resonance_moments", "C3-3")?.text ?? "", /想靠近|不需要/u);
});

test("new question signals select concept cards and preserve rule-based archetype routing", () => {
  const answers = {
    A1_core_image: "A1-2",
    A3_literature: ["A3-2", "A3-5"],
    A4_cinema: "A4-3",
    A5_inspiration_scene: "A5-5",
    B1_night_thoughts: "B1-1",
    B2_decision_style: "B2-3",
    B3_emotion_pattern: "B3-2",
    B4_time_philosophy: { past: 42, present: 26, future: 32 },
    B5_relationship_philosophy: "B5-1",
    C3_resonance_moments: ["C3-2", "C3-3"],
  };
  const part1Data = buildPart1DataFromAnswers(answers);
  const aggregated = aggregateTraitsFromPart1(answers, part1Data);
  const part1 = {
    part1_id: "part1_depth_signal_contract",
    user_id: "usr_depth_signal_contract",
    created_at: "2026-05-13T00:00:00.000Z",
    updated_at: "2026-05-13T00:00:00.000Z",
    answers,
    part1_data: part1Data,
    aggregated_traits: aggregated,
  };

  const selected = selectPsychoanalyticConceptsForPart1(part1);
  const conceptNames = selected.map((item) => item.concept.zhName).join(" / ");

  assert.match(conceptNames, /防御方式|镜像|客体距离|边界|压抑/u);
  assert.ok(aggregated.archetype_hints.length >= 2, "rule-based archetype routing should still produce ranked hints");
  assert.ok(!aggregated.archetype_hints.some((hint) => /personalized|模型|gpt/i.test(hint)), "archetype hints must remain rule-generated slugs");
});
