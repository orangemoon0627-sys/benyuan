type MirrorQuestion = {
  question_id: number;
  dialogue: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    trait_signal: string;
  }>;
};

function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function fingerprint(value: string) {
  return cleanText(value).toLocaleLowerCase("zh-CN").replace(/[\s\p{P}\p{S}]+/gu, "");
}

const fallbackDialogues = [
  "第一道镜面把雨声收拢成一束暗光，等你说出最先浮现的方向。",
  "第二道镜面把海面推近半步，像在确认你愿意把哪一种真实留下。",
  "第三道镜面把一线月光移到你的掌心，等待那个尚未命名的答案浮出水面。",
];

const fallbackQuestionTexts = [
  "让镜面停在一个方向上：",
  "你愿意先移动哪一半光？",
  "哪一种回声最接近你想带走的答案？",
];

export function dedupeMirrorQuestions(questions: MirrorQuestion[], fallbackQuestions: MirrorQuestion[]) {
  const seenDialogues = new Set<string>();
  const seenQuestions = new Set<string>();

  return questions.map((question, index) => {
    const dialogue = cleanText(question.dialogue);
    const dialogueKey = fingerprint(dialogue);
    const visibleQuestion = cleanText(question.question);
    const questionKey = fingerprint(visibleQuestion);
    let nextQuestion = question.question;

    if (visibleQuestion && !seenQuestions.has(questionKey)) {
      seenQuestions.add(questionKey);
    } else {
      const fallback = fallbackQuestions[index] ?? fallbackQuestions[fallbackQuestions.length - 1];
      const fallbackQuestion = cleanText(fallback?.question);
      const fallbackKey = fingerprint(fallbackQuestion);
      nextQuestion =
        fallbackQuestion && !seenQuestions.has(fallbackKey)
          ? fallbackQuestion
          : fallbackQuestionTexts[index] ?? "这一次，你愿意让哪一个答案先浮上来？";
      seenQuestions.add(fingerprint(nextQuestion));
    }

    if (dialogue && !seenDialogues.has(dialogueKey)) {
      seenDialogues.add(dialogueKey);
      return {
        ...question,
        question: nextQuestion,
      };
    }

    const fallback = fallbackQuestions[index] ?? fallbackQuestions[fallbackQuestions.length - 1];
    const fallbackDialogue = cleanText(fallback?.dialogue);
    const fallbackKey = fingerprint(fallbackDialogue);
    const nextDialogue =
      fallbackDialogue && !seenDialogues.has(fallbackKey)
        ? fallbackDialogue
        : fallbackDialogues[index] ?? "另一道镜面把光线移向更深处，等待你重新辨认自己的答案。";

    seenDialogues.add(fingerprint(nextDialogue));
    return {
      ...question,
      dialogue: nextDialogue,
      question: nextQuestion,
    };
  });
}
