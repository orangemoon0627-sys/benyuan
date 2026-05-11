import { NextResponse } from "next/server";
import { listFeedbackRecords, updateFeedbackRecordStatus } from "@/lib/benyuan-v3-store";
import type { BenyuanFeedbackKind, BenyuanFeedbackStage, BenyuanFeedbackStatus } from "@/lib/benyuan-v3-types";

const FEEDBACK_KINDS = new Set<BenyuanFeedbackKind>(["issue", "ui", "content", "speed", "other"]);
const FEEDBACK_STAGES = new Set<BenyuanFeedbackStage>(["auth", "account", "collect", "processing", "theater", "constellation", "unknown"]);
const FEEDBACK_STATUSES = new Set<BenyuanFeedbackStatus>(["new", "processing", "completed", "declined"]);

function normalizeKind(value: string | null) {
  return value && FEEDBACK_KINDS.has(value as BenyuanFeedbackKind) ? (value as BenyuanFeedbackKind) : undefined;
}

function normalizeStage(value: string | null) {
  return value && FEEDBACK_STAGES.has(value as BenyuanFeedbackStage) ? (value as BenyuanFeedbackStage) : undefined;
}

function normalizeStatus(value: string | null) {
  return value && FEEDBACK_STATUSES.has(value as BenyuanFeedbackStatus) ? (value as BenyuanFeedbackStatus) : undefined;
}

function normalizeLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(1, Math.min(Math.trunc(parsed), 500));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = normalizeKind(searchParams.get("kind"));
  const stage = normalizeStage(searchParams.get("stage"));
  const status = normalizeStatus(searchParams.get("status"));
  const limit = normalizeLimit(searchParams.get("limit"));
  const records = await listFeedbackRecords({ kind, stage, status, limit });

  return NextResponse.json({
    status: "ok",
    filters: { kind: kind ?? null, stage: stage ?? null, status: status ?? null, limit },
    count: records.length,
    records,
  });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    feedback_id?: unknown;
    status?: unknown;
  };
  const feedbackId = typeof body.feedback_id === "string" ? body.feedback_id.trim() : "";
  const status = typeof body.status === "string" && FEEDBACK_STATUSES.has(body.status as BenyuanFeedbackStatus) ? (body.status as BenyuanFeedbackStatus) : null;

  if (!feedbackId) {
    return NextResponse.json({ error: "feedback_id_required" }, { status: 400 });
  }
  if (!status) {
    return NextResponse.json({ error: "invalid_feedback_status" }, { status: 400 });
  }

  const record = await updateFeedbackRecordStatus(feedbackId, status);
  if (!record) {
    return NextResponse.json({ error: "feedback_not_found" }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", record });
}
