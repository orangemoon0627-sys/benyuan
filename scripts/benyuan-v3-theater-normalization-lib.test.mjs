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
    question(1, "镜中的你沉默片刻，目光落向更深处。"),
    question(2, "镜中的你沉默片刻，目光落向更深处。"),
  ];
  const fallback = [
    question(1, "第一道镜面轻声发问。"),
    question(2, "第二道镜面把光移向你的掌心。"),
  ];

  const normalized = dedupeMirrorQuestions(live, fallback);

  assert.deepEqual(normalized.map((item) => item.dialogue), [
    "镜中的你沉默片刻，目光落向更深处。",
    "第二道镜面把光移向你的掌心。",
  ]);
});

test("dedupeMirrorQuestions uses a poetic fallback when live and fallback dialogue both repeat", () => {
  const repeated = "同一道镜面重复发问。";
  const normalized = dedupeMirrorQuestions([question(1, repeated), question(2, repeated), question(3, repeated)], [question(1, repeated), question(2, repeated), question(3, repeated)]);

  assert.equal(normalized[2].dialogue, "第三道镜面把一线月光移到你的掌心，等待那个尚未命名的答案浮出水面。");
  assert.equal(new Set(normalized.map((item) => item.dialogue)).size, 3);
});
