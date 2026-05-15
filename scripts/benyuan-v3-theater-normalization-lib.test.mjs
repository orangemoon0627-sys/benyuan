import assert from "node:assert/strict";
import test from "node:test";

import { dedupeMirrorQuestions } from "../src/lib/benyuan-v3-theater-normalization.ts";

function question(question_id, dialogue) {
  return {
    question_id,
    dialogue,
    question: "选择更接近你的答案：",
    options: [
      { id: `${question_id}A`, text: "靠近", trait_signal: "approach" },
      { id: `${question_id}B`, text: "停留", trait_signal: "pause" },
    ],
  };
}

test("dedupeMirrorQuestions replaces repeated live dialogue with fallback dialogue", () => {
  const live = [
    question(1, "追问中的你沉默片刻，目光落向更深处。"),
    question(2, "追问中的你沉默片刻，目光落向更深处。"),
  ];
  const fallback = [
    question(1, "第一道追问轻声补上。"),
    question(2, "第二道补问把动机移向你的掌心。"),
  ];

  const normalized = dedupeMirrorQuestions(live, fallback);

  assert.deepEqual(normalized.map((item) => item.dialogue), [
    "追问中的你沉默片刻，目光落向更深处。",
    "第二道补问把动机移向你的掌心。",
  ]);
});

test("dedupeMirrorQuestions uses a poetic fallback when live and fallback dialogue both repeat", () => {
  const repeated = "同一道追问重复发问。";
  const normalized = dedupeMirrorQuestions([question(1, repeated), question(2, repeated), question(3, repeated)], [question(1, repeated), question(2, repeated), question(3, repeated)]);

  assert.equal(normalized[2].dialogue, "第三道追问把一线月光移到你的掌心，等待那个更接近你的答案浮出水面。");
  assert.equal(new Set(normalized.map((item) => item.dialogue)).size, 3);
});

test("dedupeMirrorQuestions replaces repeated visible question text with fallback question text", () => {
  const repeatedQuestion = "如果要更准确地理解你，应该先看哪一部分？";
  const live = [
    { ...question(1, "第一道追问发问。"), question: "你更想先辨认哪一种动机？" },
    { ...question(2, "第二道补问发问。"), question: repeatedQuestion },
    { ...question(3, "第三道心性辨认发问。"), question: repeatedQuestion },
  ];
  const fallback = [
    { ...question(1, "第一道 fallback。"), question: "你更想先辨认哪一种动机？" },
    { ...question(2, "第二道 fallback。"), question: "如果要更准确地理解你，应该先看哪一部分？" },
    { ...question(3, "第三道 fallback。"), question: "哪一种原因最接近你想带走的答案？" },
  ];

  const normalized = dedupeMirrorQuestions(live, fallback);

  assert.deepEqual(normalized.map((item) => item.question), [
    "你更想先辨认哪一种动机？",
    repeatedQuestion,
    "哪一种原因最接近你想带走的答案？",
  ]);
  assert.equal(new Set(normalized.map((item) => item.question)).size, 3);
});
