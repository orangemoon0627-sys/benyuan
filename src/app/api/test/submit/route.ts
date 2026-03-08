import { NextResponse } from "next/server";
import { defaultAssessmentMode, getAssessmentDefinition, validateAssessmentSubmission } from "@/features/assessment";
import { createSession } from "@/lib/store";
import type { Answer, BasicInfo, Mode } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    mode?: Mode;
    version?: string;
    basicInfo?: BasicInfo;
    answers?: Answer[];
  };

  const mode = body.mode ?? defaultAssessmentMode;
  const definition = getAssessmentDefinition(mode, body.version);

  if (!body.basicInfo || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const validation = validateAssessmentSubmission(mode, body.answers, definition.version);
  if (!validation.ok) {
    return NextResponse.json(validation, { status: 400 });
  }

  const session = await createSession({
    mode,
    assessmentVersion: definition.version,
    basicInfo: body.basicInfo,
    answers: body.answers,
  });

  return NextResponse.json({
    sessionId: session.sessionId,
    status: "accepted",
    next: `/processing/${session.sessionId}`,
  });
}
