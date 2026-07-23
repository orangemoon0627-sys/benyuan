import type {
  BenyuanNativeGenerationEvent,
  BenyuanNativeGenerationEventType,
  BenyuanNativeGenerationJob,
} from "@/lib/benyuan-v3-types";

export const BENYUAN_NATIVE_GENERATION_EVENT_SCHEMA_VERSION = "native-generation-event.v1" as const;

export function appendNativeGenerationEvent(
  job: BenyuanNativeGenerationJob,
  input: {
    event_type: BenyuanNativeGenerationEventType;
    occurred_at: string;
    checkpoint?: string;
    behavior_profile_revision?: string;
    evidence_revision?: string;
  },
): BenyuanNativeGenerationJob {
  const previousSequence = Math.max(job.event_sequence ?? 0, job.events?.at(-1)?.sequence ?? 0);
  const sequence = previousSequence + 1;
  const event: BenyuanNativeGenerationEvent = {
    schema_version: BENYUAN_NATIVE_GENERATION_EVENT_SCHEMA_VERSION,
    event_id: `${job.job_id}:${sequence}`,
    sequence,
    job_id: job.job_id,
    kind: job.kind,
    event_type: input.event_type,
    status: job.status,
    stage: job.current_stage,
    occurred_at: input.occurred_at,
    message: job.message,
    checkpoint: input.checkpoint,
    behavior_profile_revision: input.behavior_profile_revision ?? job.behavior_profile_revision,
    evidence_revision: input.evidence_revision,
  };
  return {
    ...job,
    event_schema_version: BENYUAN_NATIVE_GENERATION_EVENT_SCHEMA_VERSION,
    event_sequence: sequence,
    events: [...(job.events ?? []), event],
  };
}

export function eventsAfterSequence(job: BenyuanNativeGenerationJob, afterSequence = 0) {
  const normalized = Number.isFinite(afterSequence) ? Math.max(0, Math.floor(afterSequence)) : 0;
  return (job.events ?? []).filter((event) => event.sequence > normalized);
}
