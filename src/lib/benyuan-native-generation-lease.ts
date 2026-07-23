import type { BenyuanNativeGenerationJob } from "@/lib/benyuan-v3-types";

export const BENYUAN_NATIVE_GENERATION_LEASE_MS = 5 * 60 * 1000;

function validTimestamp(value: string | undefined) {
  const parsed = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function hasActiveNativeGenerationLease(job: BenyuanNativeGenerationJob, nowMs = Date.now()) {
  const expiresAt = validTimestamp(job.lease_expires_at);
  return Boolean(job.lease_owner && expiresAt !== undefined && expiresAt > nowMs);
}

export function claimNativeGenerationLease(
  job: BenyuanNativeGenerationJob,
  input: { owner: string; now: Date; legacyStaleAfterMs: number; leaseMs?: number },
) {
  if (job.status === "done" || job.status === "failed") return { acquired: false, job };
  const nowMs = input.now.getTime();
  if (hasActiveNativeGenerationLease(job, nowMs)) return { acquired: false, job };
  if (job.status === "running" && !job.lease_owner) {
    const updatedAt = validTimestamp(job.updated_at);
    if (updatedAt !== undefined && nowMs - updatedAt < input.legacyStaleAfterMs) return { acquired: false, job };
  }
  const nowIso = input.now.toISOString();
  const leaseMs = input.leaseMs ?? BENYUAN_NATIVE_GENERATION_LEASE_MS;
  return {
    acquired: true,
    job: {
      ...job,
      lease_owner: input.owner,
      lease_expires_at: new Date(nowMs + leaseMs).toISOString(),
      last_heartbeat_at: nowIso,
      run_attempt: (job.run_attempt ?? 0) + 1,
      updated_at: nowIso,
    },
  };
}

export function renewNativeGenerationLease(
  job: BenyuanNativeGenerationJob,
  input: { owner: string; now: Date; leaseMs?: number },
) {
  if (job.lease_owner !== input.owner) return undefined;
  const nowMs = input.now.getTime();
  const nowIso = input.now.toISOString();
  return {
    ...job,
    lease_expires_at: new Date(nowMs + (input.leaseMs ?? BENYUAN_NATIVE_GENERATION_LEASE_MS)).toISOString(),
    last_heartbeat_at: nowIso,
    updated_at: nowIso,
  };
}

export function releaseNativeGenerationLease(job: BenyuanNativeGenerationJob, owner: string, now = new Date()) {
  if (job.lease_owner !== owner) return undefined;
  return {
    ...job,
    lease_owner: undefined,
    lease_expires_at: undefined,
    last_heartbeat_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}
