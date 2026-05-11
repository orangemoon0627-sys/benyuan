import { NextResponse } from "next/server";
import { BenyuanAuthError, getCurrentAuthSession } from "@/lib/benyuan-auth";
import { createBenyuanFeedbackId, saveFeedbackRecord } from "@/lib/benyuan-v3-store";
import type { BenyuanFeedbackKind, BenyuanFeedbackStage } from "@/lib/benyuan-v3-types";

const FEEDBACK_KINDS = new Set<BenyuanFeedbackKind>(["issue", "ui", "content", "speed", "other"]);
const FEEDBACK_STAGES = new Set<BenyuanFeedbackStage>(["auth", "account", "collect", "processing", "theater", "constellation", "unknown"]);
const MAX_FEEDBACK_LENGTH = 1200;

type FeedbackBody = {
  kind?: unknown;
  message?: unknown;
  stage?: unknown;
  part1_id?: unknown;
  theater_script_id?: unknown;
  part2_id?: unknown;
  constellation_id?: unknown;
  device_context?: unknown;
};

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeKind(value: unknown): BenyuanFeedbackKind {
  if (typeof value === "string" && FEEDBACK_KINDS.has(value as BenyuanFeedbackKind)) {
    return value as BenyuanFeedbackKind;
  }
  return "other";
}

function normalizeStage(value: unknown): BenyuanFeedbackStage {
  if (typeof value === "string" && FEEDBACK_STAGES.has(value as BenyuanFeedbackStage)) {
    return value as BenyuanFeedbackStage;
  }
  return "unknown";
}

function normalizeDeviceContext(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const auth = await getCurrentAuthSession(request);
    const body = (await request.json().catch(() => ({}))) as FeedbackBody;
    const message = normalizeOptionalString(body.message);

    if (!message) {
      return NextResponse.json({ error: "feedback_required" }, { status: 400 });
    }
    if (message.length > MAX_FEEDBACK_LENGTH) {
      return NextResponse.json({ error: "feedback_too_long" }, { status: 400 });
    }

    const createdAt = new Date().toISOString();
    const record = await saveFeedbackRecord({
      feedback_id: createBenyuanFeedbackId(),
      user_id: auth.user.user_id,
      auth_session_id: auth.session.session_id,
      kind: normalizeKind(body.kind),
      status: "new",
      status_updated_at: createdAt,
      message,
      stage: normalizeStage(body.stage),
      part1_id: normalizeOptionalString(body.part1_id),
      theater_script_id: normalizeOptionalString(body.theater_script_id),
      part2_id: normalizeOptionalString(body.part2_id),
      constellation_id: normalizeOptionalString(body.constellation_id),
      device_context: normalizeDeviceContext(body.device_context),
      created_at: createdAt,
    });

    return NextResponse.json({ ok: true, feedback_id: record.feedback_id, created_at: record.created_at });
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}
