import { NextResponse } from "next/server";
import { fullLiteQuestionSet } from "@/features/assessment";
import { createSession } from "@/lib/store";
import type { Answer, BasicInfo } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    mode?: "lite" | "deep";
    basicInfo?: BasicInfo;
    answers?: Answer[];
  };

  if (!body.mode || !body.basicInfo || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const answerMap = new Map(body.answers.map((answer) => [answer.questionId, answer]));
  const requiredQuestions = fullLiteQuestionSet.filter((question) => !question.optional);

  const missingRequired = requiredQuestions.some((question) => {
    const answer = answerMap.get(question.questionId);
    if (!answer) return true;

    if (question.answerType === "multi") {
      return !Array.isArray(answer.value) || answer.value.length < (question.minSelections ?? 1);
    }

    if (question.answerType === "scale") {
      return typeof answer.value !== "number";
    }

    if (question.answerType === "text") {
      return typeof answer.value !== "string" || answer.value.trim().length === 0;
    }

    return typeof answer.value !== "string" || answer.value.length === 0;
  });

  const openReflectionAnswered = ["Q023", "Q024"].some((id) => {
    const answer = answerMap.get(id);
    return typeof answer?.value === "string" && answer.value.trim().length > 0;
  });

  if (missingRequired || !openReflectionAnswered) {
    return NextResponse.json({ error: "missing_required_answers" }, { status: 400 });
  }

  const session = await createSession({
    mode: body.mode,
    basicInfo: body.basicInfo,
    answers: body.answers,
  });

  return NextResponse.json({
    sessionId: session.sessionId,
    status: "accepted",
    next: `/processing/${session.sessionId}`,
  });
}
