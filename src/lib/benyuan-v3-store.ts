import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  AgentRuntimeOverride,
  BenyuanAuthProvider,
  BenyuanAuthSession,
  BenyuanDataCohort,
  BenyuanDataEnvironment,
  BenyuanAuthProviderIndex,
  BenyuanAuthRateLimit,
  BenyuanBehaviorProfileSnapshotRecord,
  BenyuanFeedbackRecord,
  BenyuanNativeGenerationJob,
  BenyuanNativeGenerationJobKind,
  BenyuanNativeGenerationJobStage,
  BenyuanNativeGenerationJobStageTiming,
  BenyuanNativeGenerationJobStatus,
  BenyuanTestPlanItem,
  BenyuanAccountHistoryItem,
  BenyuanPhoneOtp,
  BenyuanStoredAsset,
  BenyuanUploadedAssetRef,
  BenyuanUser,
  BenyuanUserProfilePatch,
  BenyuanV3Store,
  ConstellationRecord,
  MultimodalInputItem,
  MusicAnalysis,
  Part1Record,
  Part2Record,
  PreciousPhotoAnalysis,
  SocialPostAnalysis,
  SocialPostOverallPattern,
  TheaterScriptRecord,
} from "@/lib/benyuan-v3-types";
import { classifyBenyuanMultimodalCacheStatus, recordBenyuanAgentTiming } from "@/lib/benyuan-agent-timing";
import { aggregateTraitsFromPart1, generateDeterministicConstellation } from "@/lib/benyuan-v3-engine";
import { generateConstellationWithAgent, generateTheaterScriptWithAgent, runMultimodalAnalysis } from "@/lib/benyuan-v3-agent";
import { normalizePsycheConstellation } from "@/lib/benyuan-v3-normalization";
import { isCanonicalBenyuanArchetypeName } from "@/lib/benyuan-v3-report-profile";
import { uploadedAssetsFromAnswer } from "@/lib/benyuan-upload-assets";
import { validateBenyuanUploadCapacity } from "@/lib/benyuan-upload-policy";
import { restorePart2ChoiceSemantics } from "@/lib/benyuan-v3-part2-semantics";
import { ensureBenyuanDataDirs, getBenyuanPersistenceHealth, getBenyuanV3StorePath, getBenyuanV3UploadsDir } from "@/lib/benyuan-persistence";
import { buildBehaviorProfileV2 } from "@/lib/benyuan-v3-behavior-profile";
import { appendNativeGenerationEvent } from "@/lib/benyuan-native-generation-events";
import {
  claimNativeGenerationLease,
  hasActiveNativeGenerationLease,
  releaseNativeGenerationLease,
  renewNativeGenerationLease,
} from "@/lib/benyuan-native-generation-lease";

const STORE_PATH = getBenyuanV3StorePath();
const TEMP_STORE_PATH = `${STORE_PATH}.${process.pid}.tmp`;
const NATIVE_GENERATION_JOB_STALE_MS = 3 * 60 * 1000;
const NATIVE_GENERATION_STAGE_EXPECTED_MS: Record<BenyuanNativeGenerationJobStage, number> = {
  queued: 4_000,
  multimodal: 16_000,
  theater: 24_000,
  constellation: 36_000,
  done: 1,
  failed: 1,
};

const EMPTY_STORE: BenyuanV3Store = {
  users: {},
  auth_sessions: {},
  phone_otps: {},
  auth_provider_index: {},
  auth_rate_limits: {},
  uploaded_assets: {},
  part1_records: {},
  theater_scripts: {},
  part2_records: {},
  constellations: {},
  native_generation_jobs: {},
  behavior_profile_snapshots: {},
  feedback_records: {},
  test_plan_items: {},
};

let storeWriteQueue: Promise<void> = Promise.resolve();
const activeNativeGenerationJobRuns = new Set<string>();

const PROFILE_PLACEHOLDER_NAMES = new Set(["Apple 用户", "微信用户", "手机用户", "访客", "我的本源档案"]);

function normalizeProfileDisplayName(value?: string) {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  if (!cleaned || PROFILE_PLACEHOLDER_NAMES.has(cleaned)) return undefined;
  return cleaned.slice(0, 32);
}

function deriveUserProfileStatus(user: BenyuanUser): BenyuanUser["profile_status"] {
  const hasName = Boolean(normalizeProfileDisplayName(user.display_name));
  const hasAvatar = Boolean(user.avatar_symbol?.trim());
  return hasName && hasAvatar ? "complete" : "incomplete";
}

export type BenyuanDataScope = {
  data_cohort: BenyuanDataCohort;
  data_environment: BenyuanDataEnvironment;
};

export class BenyuanUploadCapacityError extends Error {
  code: "user_upload_quota_exceeded" | "upload_capacity_exceeded";
  status: 429 | 507;

  constructor(code: "user_upload_quota_exceeded" | "upload_capacity_exceeded", status: 429 | 507) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function recommendationKey(item: { title?: string; author?: string; director?: string; artist?: string; album?: string }) {
  return [item.title, item.author, item.director, item.artist, item.album].filter(Boolean).join("::").toLocaleLowerCase("zh-CN");
}

function supplementRecommendations(preferred: ConstellationRecord["psyche_constellation"]["recommendations"], fallback: ConstellationRecord["psyche_constellation"]["recommendations"]) {
  const mergeItems = <T extends { title?: string; author?: string; director?: string; artist?: string; album?: string }>(items: T[], backup: T[], minCount: number) => {
    const next = [...items];
    const seen = new Set(next.map((item) => recommendationKey(item)));

    for (const item of backup) {
      const key = recommendationKey(item);
      if (seen.has(key)) continue;
      next.push(item);
      seen.add(key);
      if (next.length >= minCount) break;
    }

    return next;
  };

  return {
    books: mergeItems(preferred.books, fallback.books, Math.min(3, fallback.books.length || 2)),
    films: mergeItems(preferred.films, fallback.films, Math.min(3, fallback.films.length || 2)),
    music: mergeItems(preferred.music, fallback.music, Math.min(3, fallback.music.length || 2)),
  };
}

function supplementGrowthSuggestions(preferred: ConstellationRecord["psyche_constellation"]["growth_suggestions"], fallback: ConstellationRecord["psyche_constellation"]["growth_suggestions"]) {
  const next = [...preferred];
  const seen = new Set(next.map((item) => item.title.trim().toLocaleLowerCase("zh-CN")));

  for (const item of fallback) {
    const key = item.title.trim().toLocaleLowerCase("zh-CN");
    if (seen.has(key)) continue;
    next.push(item);
    seen.add(key);
    if (next.length >= 3) break;
  }

  return next;
}


function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeBenyuanDataCohort(value?: string): BenyuanDataCohort {
  return value === "public" || value === "local" || value === "beta" ? value : "beta";
}

function normalizeBenyuanDataEnvironment(value?: string): BenyuanDataEnvironment {
  return value === "production" || value === "staging" || value === "test" || value === "development"
    ? value
    : process.env.NODE_ENV === "production"
      ? "production"
      : process.env.NODE_ENV === "test"
        ? "test"
        : "development";
}

export function resolveBenyuanDataScope(): BenyuanDataScope {
  return {
    data_cohort: normalizeBenyuanDataCohort(process.env.BENYUAN_DATA_COHORT),
    data_environment: normalizeBenyuanDataEnvironment(process.env.BENYUAN_DATA_ENVIRONMENT ?? process.env.NODE_ENV),
  };
}

function withBenyuanDataScope<T extends Partial<BenyuanDataScope>>(record: T): T & BenyuanDataScope {
  const scope = resolveBenyuanDataScope();
  return {
    ...record,
    data_cohort: record.data_cohort ?? scope.data_cohort,
    data_environment: record.data_environment ?? scope.data_environment,
  };
}

function cohortForClear(record: Partial<BenyuanDataScope>) {
  return record.data_cohort ?? "beta";
}

function storedBenyuanDataScope<T extends Partial<BenyuanDataScope>>(record: T): T & BenyuanDataScope {
  return {
    ...record,
    data_cohort: record.data_cohort ?? "beta",
    data_environment: record.data_environment ?? "development",
  };
}

function scopeFromPart1(part1?: Pick<Part1Record, "data_cohort" | "data_environment">): BenyuanDataScope {
  const fallback = resolveBenyuanDataScope();
  return {
    data_cohort: part1?.data_cohort ?? fallback.data_cohort,
    data_environment: part1?.data_environment ?? fallback.data_environment,
  };
}

async function ensureStoreFile() {
  await ensureBenyuanDataDirs();
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await stat(STORE_PATH);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    try {
      await writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2), { encoding: "utf8", flag: "wx" });
    } catch (writeError) {
      if ((writeError as NodeJS.ErrnoException).code !== "EEXIST") throw writeError;
    }
  }
}

function mergeStore(raw: Partial<BenyuanV3Store> | null | undefined): BenyuanV3Store {
  return {
    users: raw?.users ?? {},
    auth_sessions: raw?.auth_sessions ?? {},
    phone_otps: raw?.phone_otps ?? {},
    auth_provider_index: raw?.auth_provider_index ?? {},
    auth_rate_limits: raw?.auth_rate_limits ?? {},
    uploaded_assets: raw?.uploaded_assets ?? {},
    part1_records: raw?.part1_records ?? {},
    theater_scripts: raw?.theater_scripts ?? {},
    part2_records: raw?.part2_records ?? {},
    constellations: raw?.constellations ?? {},
    native_generation_jobs: raw?.native_generation_jobs ?? {},
    behavior_profile_snapshots: raw?.behavior_profile_snapshots ?? {},
    feedback_records: raw?.feedback_records ?? {},
    test_plan_items: raw?.test_plan_items ?? {},
  };
}

async function parseStoreFile() {
  await ensureStoreFile();
  const raw = await readFile(STORE_PATH, "utf8");

  try {
    return mergeStore(JSON.parse(raw) as Partial<BenyuanV3Store>);
  } catch (error) {
    throw new Error("benyuan_store_corrupt", { cause: error });
  }
}

async function withStoreWrite<T>(updater: (store: BenyuanV3Store) => T | Promise<T>) {
  let result: T;

  const operation = storeWriteQueue.then(async () => {
    const store = await parseStoreFile();
    result = await updater(store);
    await writeFile(TEMP_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
    await rename(TEMP_STORE_PATH, STORE_PATH);
  });
  storeWriteQueue = operation.catch(() => undefined);

  await operation;
  return result!;
}

export async function readBenyuanV3Store() {
  await storeWriteQueue;
  return parseStoreFile();
}

export async function getBenyuanV3StoreHealth() {
  const store = await readBenyuanV3Store();
  return getBenyuanPersistenceHealth(store);
}

export function createBenyuanV3Id(prefix: "upload" | "part1" | "theater" | "part2" | "const" | "job") {
  return uid(prefix);
}

export function createBenyuanAuthId(prefix: "usr" | "auth") {
  return uid(prefix);
}

export function createBenyuanFeedbackId() {
  return uid("feedback");
}

export async function saveAuthUserAndSession(user: BenyuanUser, session: BenyuanAuthSession) {
  return withStoreWrite((store) => {
    const userScope = withBenyuanDataScope(user);
    const sessionScope = withBenyuanDataScope({
      ...session,
      data_cohort: session.data_cohort ?? userScope.data_cohort,
      data_environment: session.data_environment ?? userScope.data_environment,
    });
    store.users[user.user_id] = userScope;
    store.auth_sessions[session.token] = sessionScope;
    const timestamp = new Date().toISOString();
    for (const [provider, providerSubject] of Object.entries(user.providers)) {
      if (!providerSubject) continue;
      const indexKey = `${userScope.data_cohort}:${provider}:${providerSubject}`;
      const existing = store.auth_provider_index[indexKey];
      store.auth_provider_index[indexKey] = {
        provider: provider as BenyuanAuthProviderIndex["provider"],
        provider_subject: providerSubject,
        user_id: user.user_id,
        data_cohort: userScope.data_cohort,
        data_environment: userScope.data_environment,
        created_at: existing?.created_at ?? timestamp,
        updated_at: timestamp,
      };
    }
    return { user: userScope, session: sessionScope };
  });
}

export async function updateAuthUserDisplayName(userId: string, displayName: string) {
  return updateAuthUserProfile(userId, { display_name: displayName });
}

export async function updateAuthUserProfile(userId: string, patch: BenyuanUserProfilePatch) {
  return withStoreWrite((store) => {
    const user = store.users[userId];
    if (!user) return undefined;
    const timestamp = new Date().toISOString();
    const cleanedName = patch.display_name !== undefined ? patch.display_name.replace(/\s+/g, " ").trim().slice(0, 32) : user.display_name;
    if (patch.display_name !== undefined && !cleanedName) return undefined;
    const updated: BenyuanUser = {
      ...storedBenyuanDataScope(user),
      ...(patch.display_name !== undefined ? { display_name: cleanedName } : {}),
      ...(patch.avatar_symbol !== undefined ? { avatar_symbol: patch.avatar_symbol } : {}),
      ...(patch.birth_year !== undefined && patch.birth_year !== null ? { birth_year: patch.birth_year } : {}),
      ...(patch.gender !== undefined ? { gender: patch.gender } : {}),
      ...(patch.profile_bio !== undefined ? { profile_bio: patch.profile_bio } : {}),
      updated_at: timestamp,
    };
    if (patch.birth_year === null) delete updated.birth_year;
    updated.profile_status = deriveUserProfileStatus(updated);
    if (updated.profile_status === "complete" && !updated.registered_at) {
      updated.registered_at = timestamp;
    }
    store.users[userId] = updated;
    return updated;
  });
}

export async function getAuthSessionByToken(token: string) {
  const store = await readBenyuanV3Store();
  const session = store.auth_sessions[token];
  if (!session || session.revoked_at) return undefined;
  const user = store.users[session.user_id];
  if (!user) return undefined;
  const scopedSession = storedBenyuanDataScope(session);
  const scopedUser = storedBenyuanDataScope(user);
  const currentScope = resolveBenyuanDataScope();
  if (scopedSession.data_cohort !== currentScope.data_cohort || scopedUser.data_cohort !== currentScope.data_cohort) return undefined;
  return { session: scopedSession, user: scopedUser };
}

export async function findUserByProviderSubject(provider: BenyuanAuthProviderIndex["provider"], providerSubject: string) {
  const store = await readBenyuanV3Store();
  const scope = resolveBenyuanDataScope();
  const indexed =
    store.auth_provider_index[`${scope.data_cohort}:${provider}:${providerSubject}`] ??
    (scope.data_cohort === "beta" ? store.auth_provider_index[`${provider}:${providerSubject}`] : undefined);
  if (!indexed) return undefined;
  const user = store.users[indexed.user_id];
  const scopedUser = user ? storedBenyuanDataScope(user) : undefined;
  if (!scopedUser || scopedUser.data_cohort !== scope.data_cohort) return undefined;
  return scopedUser;
}

export async function revokeAuthSession(token: string, timestamp = new Date().toISOString()) {
  return withStoreWrite((store) => {
    const session = store.auth_sessions[token];
    if (!session) return undefined;
    const revoked = { ...session, updated_at: timestamp, revoked_at: timestamp };
    store.auth_sessions[token] = revoked;
    return revoked;
  });
}

export async function getAuthRateLimit(key: string) {
  const store = await readBenyuanV3Store();
  const scope = resolveBenyuanDataScope();
  return store.auth_rate_limits[`${scope.data_cohort}:${key}`];
}

export async function saveAuthRateLimit(limit: BenyuanAuthRateLimit) {
  return withStoreWrite((store) => {
    const scoped = withBenyuanDataScope(limit);
    store.auth_rate_limits[`${scoped.data_cohort}:${limit.key}`] = scoped;
    return scoped;
  });
}

export async function consumeAuthRateLimit(input: { key: string; windowMs: number; timestamp: string }) {
  return withStoreWrite((store) => {
    const scope = resolveBenyuanDataScope();
    const storeKey = `${scope.data_cohort}:${input.key}`;
    const existing = store.auth_rate_limits[storeKey];
    const resetAt = existing ? new Date(existing.reset_at).getTime() : 0;
    const next: BenyuanAuthRateLimit =
      !existing || resetAt <= Date.now()
        ? {
            key: input.key,
            ...scope,
            count: 1,
            reset_at: new Date(Date.now() + input.windowMs).toISOString(),
            updated_at: input.timestamp,
          }
        : { ...existing, count: existing.count + 1, updated_at: input.timestamp };
    store.auth_rate_limits[storeKey] = next;
    return next;
  });
}

export async function savePhoneOtp(otp: BenyuanPhoneOtp) {
  return withStoreWrite((store) => {
    const scoped = withBenyuanDataScope(otp);
    store.phone_otps[`${scoped.data_cohort}:${otp.phone}`] = scoped;
    return scoped;
  });
}

export async function getPhoneOtp(phone: string) {
  const store = await readBenyuanV3Store();
  const scope = resolveBenyuanDataScope();
  return store.phone_otps[`${scope.data_cohort}:${phone}`];
}

function countPart1Assets(part1: Part1Record) {
  return ["A2_music_analysis", "C1_social_posts_analysis", "C2_precious_photo_analysis"].reduce((total, key) => {
    const value = part1.answers[key];
    return total + uploadedAssetsFromAnswer(value).length;
  }, 0);
}

function findTheaterForPart1(store: BenyuanV3Store, part1Id: string) {
  return Object.values(store.theater_scripts).find((item) => item.part1_id === part1Id);
}

function findPart2ForPart1(store: BenyuanV3Store, part1Id: string) {
  return Object.values(store.part2_records).find((item) => item.part1_id === part1Id);
}

function restoreStoredPart2Semantics(store: BenyuanV3Store, record: Part2Record | undefined) {
  if (!record) return undefined;
  return restorePart2ChoiceSemantics(record, store.theater_scripts[record.theater_script_id]);
}

function findConstellationForPart1(store: BenyuanV3Store, part1Id: string) {
  return Object.values(store.constellations).find((item) => item.part1_id === part1Id);
}

function findConstellationForPart2(store: BenyuanV3Store, part1Id: string, part2Id: string) {
  return Object.values(store.constellations).find((item) => item.part1_id === part1Id && item.part2_id === part2Id);
}

function findNativeGenerationJob(store: BenyuanV3Store, input: { kind: BenyuanNativeGenerationJobKind; part1Id: string; part2Id?: string }) {
  return Object.values(store.native_generation_jobs).find((job) => {
    if (job.kind !== input.kind || job.part1_id !== input.part1Id) return false;
    if (input.kind === "constellation" && job.part2_id !== input.part2Id) return false;
    return job.status === "queued" || job.status === "running" || job.status === "done";
  });
}

function refsFromAnswer(value: unknown) {
  return uploadedAssetsFromAnswer(value).filter(
    (item): item is BenyuanUploadedAssetRef =>
      typeof item.asset_id === "string" &&
      typeof item.question_id === "string",
  );
}

function itemsFromRefs(refs: BenyuanUploadedAssetRef[], fallbackItems: MultimodalInputItem[] = []) {
  if (refs.length === 0) return fallbackItems;
  return refs.map((ref) => ({
    asset_id: ref.asset_id,
    source: ref.name,
    file_name: ref.name,
    mime_type: ref.mime_type,
    description: `${ref.question_id}:${ref.name}`,
  }));
}

function jobMessage(stage: BenyuanNativeGenerationJobStage) {
  switch (stage) {
    case "queued":
      return "云端任务已接收，正在排队进入分析。";
    case "multimodal":
      return "云端正在读取图片、音乐与叙事线索。";
    case "theater":
      return "云端正在生成连续剧场。";
    case "constellation":
      return "云端正在生成精神星图。";
    case "done":
      return "云端生成已完成，正在取回结果。";
    case "failed":
      return "云端生成失败，请稍后重试。";
  }
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function nativeGenerationStageBounds(kind: BenyuanNativeGenerationJobKind, stage: BenyuanNativeGenerationJobStage) {
  if (stage === "queued") return { min: 0.04, max: 0.16, stepIndex: 0, stepCount: kind === "theater" ? 3 : 1, label: "云端排队" };
  if (stage === "multimodal") return { min: 0.18, max: 0.46, stepIndex: 1, stepCount: 3, label: "影像线索" };
  if (stage === "theater") return { min: 0.50, max: 0.94, stepIndex: 2, stepCount: 3, label: "连续剧场" };
  if (stage === "constellation") return { min: 0.18, max: 0.96, stepIndex: 1, stepCount: 1, label: "精神星图" };
  return { min: 1, max: 1, stepIndex: kind === "theater" ? 3 : 1, stepCount: kind === "theater" ? 3 : 1, label: stage === "failed" ? "生成中断" : "生成完成" };
}

function buildNativeGenerationJobPresentation(
  job: BenyuanNativeGenerationJob,
  update: Partial<BenyuanNativeGenerationJob> = {},
  now = new Date(),
): Partial<BenyuanNativeGenerationJob> {
  const current = { ...job, ...update };
  const currentStage = current.current_stage;
  const nowIso = now.toISOString();
  const stageChanged = typeof update.current_stage === "string" && update.current_stage !== job.current_stage;
  const stageStartedAt = update.stage_started_at ?? (stageChanged ? nowIso : current.stage_started_at ?? current.updated_at ?? current.created_at ?? nowIso);
  const stageUpdatedAt = update.stage_updated_at ?? nowIso;
  const startedAtMs = new Date(stageStartedAt).getTime();
  const nowMs = now.getTime();
  const elapsedMs = Number.isFinite(startedAtMs) ? Math.max(0, nowMs - startedAtMs) : 0;
  const expectedMs = NATIVE_GENERATION_STAGE_EXPECTED_MS[currentStage] ?? 20_000;
  const stageProgress = currentStage === "done" || currentStage === "failed"
    ? 1
    : clampProgress(Math.max(update.stage_progress ?? current.stage_progress ?? 0, expectedMs > 0 ? elapsedMs / expectedMs : 0));
  const bounds = nativeGenerationStageBounds(current.kind, currentStage);
  const progress = currentStage === "done"
    ? 1
    : currentStage === "failed"
      ? clampProgress(update.progress ?? current.progress)
      : clampProgress(bounds.min + (bounds.max - bounds.min) * stageProgress);
  const previousStageTiming = current.stage_timings?.[currentStage];
  const timingStatus: BenyuanNativeGenerationJobStageTiming["status"] =
    currentStage === "done" ? "done" : currentStage === "failed" ? "failed" : current.status === "done" ? "done" : "running";
  const stageTiming = {
    status: timingStatus,
    started_at: previousStageTiming?.started_at ?? stageStartedAt,
    updated_at: stageUpdatedAt,
    duration_ms: currentStage === "done" || currentStage === "failed" ? previousStageTiming?.duration_ms : elapsedMs,
    cache_status: update.stage_detail?.cache_status ?? current.stage_detail?.cache_status ?? previousStageTiming?.cache_status,
    asset_count: update.stage_detail?.asset_count ?? current.stage_detail?.asset_count ?? previousStageTiming?.asset_count,
  };

  return {
    progress,
    stage_progress: stageProgress,
    progress_basis: currentStage === "done" ? "completed" : currentStage === "failed" ? "failed" : "server_stage_elapsed",
    stage_started_at: stageStartedAt,
    stage_updated_at: stageUpdatedAt,
    stage_detail: {
      label: update.stage_detail?.label ?? bounds.label,
      step_index: update.stage_detail?.step_index ?? bounds.stepIndex,
      step_count: update.stage_detail?.step_count ?? bounds.stepCount,
      progress_min: bounds.min,
      progress_max: bounds.max,
      elapsed_ms: elapsedMs,
      expected_ms: expectedMs,
      cache_status: update.stage_detail?.cache_status ?? current.stage_detail?.cache_status,
      asset_count: update.stage_detail?.asset_count ?? current.stage_detail?.asset_count,
    },
    stage_timings: {
      ...current.stage_timings,
      [currentStage]: stageTiming,
    },
  };
}

export function presentNativeGenerationJob(job: BenyuanNativeGenerationJob, now = new Date()): BenyuanNativeGenerationJob {
  const presentation = buildNativeGenerationJobPresentation(job, {}, now);
  const {
    shadow_archetype_diagnostic: _shadowDiagnostic,
    lease_owner: _leaseOwner,
    lease_expires_at: _leaseExpiresAt,
    last_heartbeat_at: _lastHeartbeatAt,
    run_attempt: _runAttempt,
    ...publicJob
  } = job;
  return {
    ...publicJob,
    ...presentation,
    progress: clampProgress(presentation.progress ?? publicJob.progress),
  } as BenyuanNativeGenerationJob;
}

async function updateNativeGenerationJob(
  jobId: string,
  update: Partial<Pick<BenyuanNativeGenerationJob, "status" | "current_stage" | "progress" | "stage_progress" | "progress_basis" | "stage_started_at" | "stage_updated_at" | "stage_detail" | "stage_timings" | "message" | "error" | "theater_script_id" | "constellation_id" | "finished_at" | "behavior_profile_revision" | "shadow_archetype_diagnostic">>,
  eventMetadata: {
    eventType?: "stage_started" | "checkpoint" | "resumed" | "completed" | "failed";
    checkpoint?: string;
    evidenceRevision?: string;
  } = {},
  leaseOwner?: string,
) {
  return withStoreWrite((store) => {
    const current = store.native_generation_jobs[jobId];
    if (!current) return undefined;
    const now = new Date();
    const leasedCurrent = leaseOwner ? renewNativeGenerationLease(current, { owner: leaseOwner, now }) : current;
    if (!leasedCurrent) return undefined;
    const nextBase: BenyuanNativeGenerationJob = {
      ...leasedCurrent,
      ...update,
      ...buildNativeGenerationJobPresentation(leasedCurrent, update, now),
      updated_at: now.toISOString(),
    };
    const inferredEventType = eventMetadata.eventType
      ?? (nextBase.status === "failed" && current.status !== "failed" ? "failed" : undefined)
      ?? (nextBase.status === "done" && current.status !== "done" ? "completed" : undefined)
      ?? (nextBase.current_stage !== current.current_stage ? "stage_started" : undefined)
      ?? (nextBase.behavior_profile_revision !== current.behavior_profile_revision ? "checkpoint" : undefined);
    const next = inferredEventType
      ? appendNativeGenerationEvent(nextBase, {
          event_type: inferredEventType,
          occurred_at: now.toISOString(),
          checkpoint: eventMetadata.checkpoint,
          behavior_profile_revision: nextBase.behavior_profile_revision,
          evidence_revision: eventMetadata.evidenceRevision,
        })
      : nextBase;
    store.native_generation_jobs[jobId] = next;
    return next;
  });
}

export function shouldResumeNativeGenerationJob(job: BenyuanNativeGenerationJob, nowMs = Date.now()) {
  if (job.status !== "running") return false;
  if (hasActiveNativeGenerationLease(job, nowMs)) return false;
  if (job.lease_owner) return true;
  const updatedAtMs = new Date(job.updated_at).getTime();
  if (!Number.isFinite(updatedAtMs)) return true;
  return nowMs - updatedAtMs >= NATIVE_GENERATION_JOB_STALE_MS;
}

async function claimNativeGenerationJobRun(jobId: string) {
  return withStoreWrite((store) => {
    const current = store.native_generation_jobs[jobId];
    if (!current) return { acquired: false as const, job: undefined, owner: undefined };
    const owner = uid("lease");
    const claim = claimNativeGenerationLease(current, {
      owner,
      now: new Date(),
      legacyStaleAfterMs: NATIVE_GENERATION_JOB_STALE_MS,
    });
    if (!claim.acquired) return { acquired: false as const, job: current, owner: undefined };
    store.native_generation_jobs[jobId] = claim.job;
    return { acquired: true as const, job: claim.job, owner };
  });
}

async function releaseNativeGenerationJobRun(jobId: string, owner: string) {
  return withStoreWrite((store) => {
    const current = store.native_generation_jobs[jobId];
    if (!current) return undefined;
    const released = releaseNativeGenerationLease(current, owner);
    if (!released) return current;
    store.native_generation_jobs[jobId] = released;
    return released;
  });
}

export async function ensureBehaviorProfileSnapshot(
  part1: Part1Record,
  part2?: Part2Record,
  profile = buildBehaviorProfileV2(part1, part2),
) {
  if (part2 && part2.part1_id !== part1.part1_id) throw new Error("behavior_profile_part2_mismatch");
  const expectedProfile = buildBehaviorProfileV2(part1, part2);
  if (JSON.stringify(profile) !== JSON.stringify(expectedProfile)) throw new Error("behavior_profile_source_mismatch");
  const record: BenyuanBehaviorProfileSnapshotRecord = {
    profile_revision: profile.revision,
    schema_version: profile.schema_version,
    source_revision: profile.source_revision,
    user_id: part1.user_id,
    part1_id: part1.part1_id,
    part2_id: part2?.part2_id,
    data_cohort: part1.data_cohort,
    data_environment: part1.data_environment,
    created_at: new Date().toISOString(),
    profile,
  };
  return withStoreWrite((store) => {
    const existing = store.behavior_profile_snapshots[profile.revision];
    if (existing) {
      if (JSON.stringify(existing.profile) !== JSON.stringify(profile)) throw new Error("behavior_profile_revision_collision");
      return existing;
    }
    store.behavior_profile_snapshots[profile.revision] = record;
    return record;
  });
}

export async function getBehaviorProfileSnapshot(revision: string) {
  const store = await readBenyuanV3Store();
  return store.behavior_profile_snapshots[revision];
}

function makeHistoryItem(store: BenyuanV3Store, part1: Part1Record): BenyuanAccountHistoryItem {
  const theater = findTheaterForPart1(store, part1.part1_id);
  const part2 = restoreStoredPart2Semantics(store, findPart2ForPart1(store, part1.part1_id));
  const constellation = findConstellationForPart1(store, part1.part1_id);
  const stage = constellation ? "constellation" : part2 ? "part2" : theater ? "theater" : "part1";
  const assetCount = countPart1Assets(part1);
  let archetypeName = constellation
    ? normalizePsycheConstellation(constellation.psyche_constellation).archetype.name
    : undefined;
  if (archetypeName && !isCanonicalBenyuanArchetypeName(archetypeName)) {
    const fallback = generateDeterministicConstellation(part1, part2);
    archetypeName = fallback.archetype.name;
  }
  const theme = visibleHistoryTheme(part1.aggregated_traits.core_themes[0]);
  const title = archetypeName ? `${archetypeName}的本源档案` : `${theme}的本源档案`;
  const subtitleParts = [`影像线索 ${assetCount} 个`];
  if (constellation) subtitleParts.push("星图已生成");
  else if (part2) subtitleParts.push("剧场已完成");
  else if (theater) subtitleParts.push("剧场进行中");
  else subtitleParts.push("收集中");
  const updatedAt = constellation?.created_at ?? part2?.created_at ?? theater?.created_at ?? part1.updated_at;

  return {
    part1_id: part1.part1_id,
    theater_script_id: theater?.theater_script_id,
    part2_id: part2?.part2_id,
    constellation_id: constellation?.constellation_id,
    stage,
    title,
    subtitle: subtitleParts.join(" / "),
    archetype_name: archetypeName,
    created_at: part1.created_at,
    updated_at: updatedAt,
    asset_count: assetCount,
  };
}

function visibleHistoryTheme(value: string | undefined) {
  const labels: Record<string, string> = {
    meaning_seeking: "意义追问",
    aesthetic_sensitivity: "审美线索",
    emotional_depth: "情感深处",
    relationship_need: "关系轨道",
    action_tendency: "行动线索",
    independence: "边界轨道",
    openness: "开放轨道",
    solitude: "独处线索",
    boundary: "边界线索",
    reflection: "自我回声",
    contemplation: "沉思线索",
    freedom: "自由线索",
  };
  const cleaned = (value ?? "").trim();
  if (!cleaned) return "私人月相";
  if (/^[a-z0-9_\-\s]+$/i.test(cleaned)) return labels[cleaned] ?? "私人月相";
  return cleaned;
}

export async function listAccountHistoryForUser(userId: string) {
  const store = await readBenyuanV3Store();
  return Object.values(store.part1_records)
    .filter((part1) => part1.user_id === userId)
    .map((part1) => makeHistoryItem(store, part1))
    .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());
}

export async function deleteAccountHistoryForUser(userId: string, part1Id: string) {
  return withStoreWrite((store) => {
    const part1 = store.part1_records[part1Id];
    if (!part1 || part1.user_id !== userId) return false;

    for (const [id, constellation] of Object.entries(store.constellations)) {
      if (constellation.part1_id === part1Id) delete store.constellations[id];
    }
    for (const [id, part2] of Object.entries(store.part2_records)) {
      if (part2.part1_id === part1Id) delete store.part2_records[id];
    }
    for (const [id, theater] of Object.entries(store.theater_scripts)) {
      if (theater.part1_id === part1Id) delete store.theater_scripts[id];
    }
    delete store.part1_records[part1Id];
    return true;
  });
}

export async function saveFeedbackRecord(record: BenyuanFeedbackRecord) {
  return withStoreWrite((store) => {
    const scoped = withBenyuanDataScope(record);
    store.feedback_records[record.feedback_id] = scoped;
    return scoped;
  });
}

export async function listFeedbackRecords(filters: {
  kind?: BenyuanFeedbackRecord["kind"];
  stage?: BenyuanFeedbackRecord["stage"];
  status?: NonNullable<BenyuanFeedbackRecord["status"]>;
  limit?: number;
} = {}) {
  const store = await readBenyuanV3Store();
  const limit = Math.max(1, Math.min(filters.limit ?? 100, 500));
  const normalizeStoredStatus = (status: BenyuanFeedbackRecord["status"]) =>
    status === "processing" || status === "completed" || status === "declined" || status === "new" ? status : "new";

  return Object.values(store.feedback_records)
    .map((record) => ({
      ...record,
      status: normalizeStoredStatus(record.status),
      status_updated_at: record.status_updated_at ?? record.created_at,
    }))
    .filter((record) => (filters.kind ? record.kind === filters.kind : true))
    .filter((record) => (filters.stage ? record.stage === filters.stage : true))
    .filter((record) => (filters.status ? record.status === filters.status : true))
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, limit);
}

export async function updateFeedbackRecordStatus(
  feedbackId: string,
  status: NonNullable<BenyuanFeedbackRecord["status"]>,
  timestamp = new Date().toISOString(),
) {
  return withStoreWrite((store) => {
    const record = store.feedback_records[feedbackId];
    if (!record) return undefined;
    const updated: BenyuanFeedbackRecord = {
      ...record,
      status,
      status_updated_at: timestamp,
    };
    store.feedback_records[feedbackId] = updated;
    return updated;
  });
}

const TEST_PLAN_SEED_ITEMS: Array<Omit<BenyuanTestPlanItem, "created_at" | "updated_at">> = [
  {
    test_plan_item_id: "image_assets",
    title: "图片可以自由选择、预览和删除",
    area: "图片上传",
    source: "system_regression",
    execution_state: "implemented_needs_verification",
    status: "pending",
    verification: "模拟器和真机分别验证相册选择、多图删除、重新选择后提交。",
    feedback_keywords: ["图片", "选择", "删除", "相册", "上传"],
  },
  {
    test_plan_item_id: "theater_api",
    title: "剧场生成必须真实调用 API",
    area: "剧场",
    source: "system_regression",
    execution_state: "implemented_needs_verification",
    status: "passed",
    verification: "已通过 staging native E2E：multimodal/theater/constellation 均为 live，theater timing 的 part1_id 属于本次 native session。",
    feedback_keywords: ["剧场", "api", "调用", "生成"],
  },
  {
    test_plan_item_id: "theater_story",
    title: "剧场问题要有连续剧情和角色代入",
    area: "剧场",
    source: "system_regression",
    execution_state: "implemented_needs_verification",
    status: "testing",
    verification: "已加 prompt contract：Act1/Act2/Act3 必须复现证据母题，Act2 不可拆成三道独立问卷；待真实生成内容抽样。",
    feedback_keywords: ["剧情", "连续", "代入", "宿命", "角色"],
  },
  {
    test_plan_item_id: "constellation_motion",
    title: "星图结果页和流程动效保持真实深邃",
    area: "星图",
    source: "system_regression",
    execution_state: "implemented_needs_verification",
    status: "passed",
    verification: "已通过本地 iPhone 17 模拟器原生预览截图；星图结尾正文和底部分享/保存/重新探索 dock 不互相遮挡。",
    feedback_keywords: ["星图", "动效", "月球", "黑洞", "按钮", "遮住"],
  },
  {
    test_plan_item_id: "feedback_modal",
    title: "App 内反馈弹层只负责收集意见",
    area: "反馈",
    source: "system_regression",
    execution_state: "implemented_needs_verification",
    status: "pending",
    verification: "确认 TestFlight 内只显示反馈弹层，不出现 Web 管理端反馈清单。",
    feedback_keywords: ["反馈", "弹层", "意见", "体验"],
  },
  {
    test_plan_item_id: "auth_binding",
    title: "Apple、微信和手机号绑定流程可用",
    area: "登录绑定",
    source: "system_regression",
    execution_state: "blocked_external_resources",
    status: "pending",
    verification: "模拟器验证 Apple 状态展示，真机验证微信/手机绑定配置就绪后的登录链路。",
    feedback_keywords: ["Apple", "微信", "手机", "绑定", "登录"],
  },
  {
    test_plan_item_id: "history_account",
    title: "用户历史记录可查看和删除",
    area: "我的",
    source: "system_regression",
    execution_state: "implemented_needs_verification",
    status: "pending",
    verification: "完成一次探索后进入我的页面，验证历史记录展示、删除和重新探索入口。",
    feedback_keywords: ["历史", "记录", "删除", "重新探索", "我的"],
  },
];

const TEST_PLAN_PROGRESS_MIGRATIONS: Record<string, Pick<BenyuanTestPlanItem, "execution_state" | "status">> = {
  theater_api: {
    execution_state: "implemented_needs_verification",
    status: "passed",
  },
  theater_story: {
    execution_state: "implemented_needs_verification",
    status: "testing",
  },
  constellation_motion: {
    execution_state: "implemented_needs_verification",
    status: "passed",
  },
};

export async function seedBenyuanTestPlanItems() {
  const timestamp = new Date().toISOString();
  return withStoreWrite((store) => {
    for (const item of TEST_PLAN_SEED_ITEMS) {
      const existing = store.test_plan_items[item.test_plan_item_id];
      const migration = TEST_PLAN_PROGRESS_MIGRATIONS[item.test_plan_item_id];
      const isInitialUnverifiedItem = existing?.status === "pending" && existing?.execution_state === "needs_hardening";
      const isTheaterApiInterimMigration =
        item.test_plan_item_id === "theater_api" &&
        existing?.status === "testing" &&
        existing?.execution_state === "implemented_needs_verification";
      const shouldApplyProgressMigration =
        Boolean(migration) &&
        (isInitialUnverifiedItem || isTheaterApiInterimMigration);

      store.test_plan_items[item.test_plan_item_id] = {
        ...item,
        status: shouldApplyProgressMigration ? migration.status : (existing?.status ?? item.status),
        source: existing?.source ?? item.source,
        execution_state: shouldApplyProgressMigration ? migration.execution_state : (existing?.execution_state ?? item.execution_state),
        created_at: existing?.created_at ?? timestamp,
        updated_at: shouldApplyProgressMigration ? timestamp : (existing?.updated_at ?? timestamp),
      };
    }
    return Object.values(store.test_plan_items);
  });
}

export async function listTestPlanItems() {
  await seedBenyuanTestPlanItems();
  const store = await readBenyuanV3Store();
  return TEST_PLAN_SEED_ITEMS.map((item) => store.test_plan_items[item.test_plan_item_id]).filter(Boolean);
}

export async function updateTestPlanItemStatus(
  testPlanItemId: string,
  status: BenyuanTestPlanItem["status"],
  timestamp = new Date().toISOString(),
) {
  await seedBenyuanTestPlanItems();
  return withStoreWrite((store) => {
    const item = store.test_plan_items[testPlanItemId];
    if (!item) return undefined;
    const updated: BenyuanTestPlanItem = {
      ...item,
      status,
      updated_at: timestamp,
    };
    store.test_plan_items[testPlanItemId] = updated;
    return updated;
  });
}

export async function saveUploadedAsset(asset: BenyuanStoredAsset) {
  return withStoreWrite((store) => {
    const scoped = withBenyuanDataScope(asset);
    store.uploaded_assets[asset.asset_id] = scoped;
    return scoped;
  });
}

export async function saveUploadedAssetsWithCapacity(assets: BenyuanStoredAsset[]) {
  if (assets.length === 0) return [];

  return withStoreWrite((store) => {
    const scopedAssets = assets.map((asset) => withBenyuanDataScope(asset));
    const ownerUserId = scopedAssets[0].owner_user_id;
    const cohort = scopedAssets[0].data_cohort;
    if (scopedAssets.some((asset) => asset.owner_user_id !== ownerUserId || asset.data_cohort !== cohort)) {
      throw new Error("upload_batch_scope_mismatch");
    }

    let ownerBytes = 0;
    let cohortBytes = 0;
    for (const existing of Object.values(store.uploaded_assets)) {
      const scoped = storedBenyuanDataScope(existing);
      if (scoped.data_cohort !== cohort) continue;
      const size = Number.isFinite(existing.size) && existing.size > 0 ? existing.size : 0;
      cohortBytes += size;
      if (existing.owner_user_id === ownerUserId) ownerBytes += size;
    }

    const incomingBytes = scopedAssets.reduce((total, asset) => total + Math.max(0, asset.size), 0);
    const capacityError = validateBenyuanUploadCapacity({ ownerBytes, cohortBytes, incomingBytes });
    if (capacityError?.error === "user_upload_quota_exceeded" || capacityError?.error === "upload_capacity_exceeded") {
      throw new BenyuanUploadCapacityError(capacityError.error, capacityError.status);
    }

    for (const asset of scopedAssets) {
      store.uploaded_assets[asset.asset_id] = asset;
    }
    return scopedAssets;
  });
}

export async function getUploadedAsset(assetId: string) {
  const store = await readBenyuanV3Store();
  return store.uploaded_assets[assetId];
}

export async function getUploadedAssetForOwner(assetId: string, ownerUserId: string) {
  const asset = await getUploadedAsset(assetId);
  if (!asset || asset.owner_user_id !== ownerUserId) return undefined;
  return asset;
}

export async function savePart1Record(record: Part1Record) {
  return withStoreWrite((store) => {
    const scoped = withBenyuanDataScope(record);
    store.part1_records[record.part1_id] = scoped;
    return scoped;
  });
}

export async function getPart1Record(part1Id: string) {
  const store = await readBenyuanV3Store();
  return store.part1_records[part1Id];
}

export async function saveTheaterScriptRecord(record: TheaterScriptRecord) {
  return withStoreWrite((store) => {
    const scoped = withBenyuanDataScope({
      ...record,
      ...scopeFromPart1(store.part1_records[record.part1_id]),
    });
    store.theater_scripts[record.theater_script_id] = scoped;
    return scoped;
  });
}

export async function getTheaterScriptRecord(theaterScriptId: string) {
  const store = await readBenyuanV3Store();
  return store.theater_scripts[theaterScriptId];
}

export async function savePart2Record(record: Part2Record) {
  return withStoreWrite((store) => {
    const scoped = withBenyuanDataScope({
      ...record,
      ...scopeFromPart1(store.part1_records[record.part1_id]),
    });
    store.part2_records[record.part2_id] = scoped;
    return scoped;
  });
}

export async function getPart2Record(part2Id: string) {
  const store = await readBenyuanV3Store();
  return restoreStoredPart2Semantics(store, store.part2_records[part2Id]);
}

export async function getPart2RecordForPart1(part1Id: string, part2Id?: string) {
  const store = await readBenyuanV3Store();
  if (part2Id) {
    const record = store.part2_records[part2Id];
    return record?.part1_id === part1Id ? restoreStoredPart2Semantics(store, record) : undefined;
  }
  return restoreStoredPart2Semantics(store, findPart2ForPart1(store, part1Id));
}

export async function clearBenyuanCohortData(cohort: BenyuanDataCohort) {
  const cleared = await withStoreWrite((store) => {
    const part1Ids = new Set(
      Object.values(store.part1_records)
        .filter((record) => cohortForClear(record) === cohort)
        .map((record) => record.part1_id),
    );
    const assetIds = new Set(
      Object.values(store.uploaded_assets)
        .filter((asset) => cohortForClear(asset) === cohort)
        .map((asset) => asset.asset_id),
    );
    const assetPaths = [...assetIds]
      .map((assetId) => store.uploaded_assets[assetId]?.stored_path)
      .filter((storedPath): storedPath is string => Boolean(storedPath));

    for (const part1Id of part1Ids) delete store.part1_records[part1Id];
    for (const assetId of assetIds) delete store.uploaded_assets[assetId];
    for (const [id, user] of Object.entries(store.users)) {
      if (cohortForClear(user) === cohort) delete store.users[id];
    }
    for (const [token, session] of Object.entries(store.auth_sessions)) {
      if (cohortForClear(session) === cohort) delete store.auth_sessions[token];
    }
    for (const [id, index] of Object.entries(store.auth_provider_index)) {
      if (cohortForClear(index) === cohort || id.startsWith(`${cohort}:`)) delete store.auth_provider_index[id];
    }
    for (const [id, otp] of Object.entries(store.phone_otps)) {
      if (cohortForClear(otp) === cohort) delete store.phone_otps[id];
    }
    for (const [id, limit] of Object.entries(store.auth_rate_limits)) {
      if (cohortForClear(limit) === cohort) delete store.auth_rate_limits[id];
    }
    for (const [id, theater] of Object.entries(store.theater_scripts)) {
      if (part1Ids.has(theater.part1_id) || cohortForClear(theater) === cohort) delete store.theater_scripts[id];
    }
    for (const [id, part2] of Object.entries(store.part2_records)) {
      if (part1Ids.has(part2.part1_id) || cohortForClear(part2) === cohort) delete store.part2_records[id];
    }
    for (const [id, constellation] of Object.entries(store.constellations)) {
      if (part1Ids.has(constellation.part1_id) || cohortForClear(constellation) === cohort) delete store.constellations[id];
    }
    for (const [id, job] of Object.entries(store.native_generation_jobs)) {
      if (part1Ids.has(job.part1_id) || cohortForClear(job) === cohort) delete store.native_generation_jobs[id];
    }
    let deletedBehaviorProfileSnapshots = 0;
    for (const [id, snapshot] of Object.entries(store.behavior_profile_snapshots)) {
      if (part1Ids.has(snapshot.part1_id) || cohortForClear(snapshot) === cohort) {
        delete store.behavior_profile_snapshots[id];
        deletedBehaviorProfileSnapshots += 1;
      }
    }
    for (const [id, feedback] of Object.entries(store.feedback_records)) {
      if (part1Ids.has(feedback.part1_id ?? "") || cohortForClear(feedback) === cohort) delete store.feedback_records[id];
    }

    return {
      cohort,
      deleted_part1_records: part1Ids.size,
      deleted_uploaded_assets: assetIds.size,
      deleted_behavior_profile_snapshots: deletedBehaviorProfileSnapshots,
      asset_paths: assetPaths,
    };
  });

  const uploadsDir = path.resolve(getBenyuanV3UploadsDir());
  let deletedUploadFiles = 0;
  let missingUploadFiles = 0;
  let rejectedUploadPaths = 0;
  let uploadFileDeleteFailures = 0;
  for (const storedPath of new Set(cleared.asset_paths)) {
    const absolutePath = path.resolve(storedPath);
    const relativePath = path.relative(uploadsDir, absolutePath);
    if (!relativePath || relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
      rejectedUploadPaths += 1;
      continue;
    }
    try {
      await unlink(absolutePath);
      deletedUploadFiles += 1;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        missingUploadFiles += 1;
      } else {
        uploadFileDeleteFailures += 1;
      }
    }
  }

  const { clearCachedMultimodalAnalysisForCohort } = await import("@/lib/benyuan-multimodal-cache");
  const deletedMultimodalCacheEntries = await clearCachedMultimodalAnalysisForCohort(cohort);
  const { asset_paths: _, ...result } = cleared;
  return {
    ...result,
    deleted_upload_files: deletedUploadFiles,
    missing_upload_files: missingUploadFiles,
    rejected_upload_paths: rejectedUploadPaths,
    upload_file_delete_failures: uploadFileDeleteFailures,
    deleted_multimodal_cache_entries: deletedMultimodalCacheEntries,
  };
}

export async function startNativeGenerationJob(input: {
  kind: BenyuanNativeGenerationJobKind;
  part1Id: string;
  part2Id?: string;
  runtimeOverride?: AgentRuntimeOverride;
}) {
  return withStoreWrite((store) => {
    const part1 = store.part1_records[input.part1Id];
    if (!part1) return undefined;
    const existingJob = findNativeGenerationJob(store, input);
    if (existingJob) return existingJob;

    const existingTheater = input.kind === "theater" ? findTheaterForPart1(store, input.part1Id) : undefined;
    const existingConstellation =
      input.kind === "constellation" && input.part2Id
        ? findConstellationForPart2(store, input.part1Id, input.part2Id)
        : undefined;
    const timestamp = new Date().toISOString();
    const status: BenyuanNativeGenerationJobStatus = existingTheater || existingConstellation ? "done" : "queued";
    const currentStage: BenyuanNativeGenerationJobStage =
      existingTheater || existingConstellation ? "done" : "queued";
    const baseJob: BenyuanNativeGenerationJob = {
      job_id: createBenyuanV3Id("job"),
      user_id: part1.user_id,
      part1_id: input.part1Id,
      part2_id: input.part2Id,
      theater_script_id: existingTheater?.theater_script_id,
      constellation_id: existingConstellation?.constellation_id,
      data_cohort: part1.data_cohort,
      data_environment: part1.data_environment,
      kind: input.kind,
      status,
      current_stage: currentStage,
      progress: 0.18,
      message: jobMessage(currentStage),
      can_resume_in_background: true,
      created_at: timestamp,
      updated_at: timestamp,
      finished_at: status === "done" ? timestamp : undefined,
    };
    let job: BenyuanNativeGenerationJob = {
      ...baseJob,
      ...buildNativeGenerationJobPresentation(baseJob, {}, new Date(timestamp)),
    };
    if (status === "done") {
      job.progress = 1;
    }
    job = appendNativeGenerationEvent(job, {
      event_type: "created",
      occurred_at: timestamp,
      checkpoint: status === "done" ? "existing_result_reused" : "accepted",
    });
    store.native_generation_jobs[job.job_id] = job;
    return job;
  });
}

export async function getNativeGenerationJob(jobId: string) {
  const store = await readBenyuanV3Store();
  return store.native_generation_jobs[jobId];
}

export async function runNativeGenerationJob(jobId: string) {
  if (activeNativeGenerationJobRuns.has(jobId)) {
    return getNativeGenerationJob(jobId);
  }
  activeNativeGenerationJobRuns.add(jobId);
  let leaseOwner: string | undefined;
  try {
    const claim = await claimNativeGenerationJobRun(jobId);
    if (!claim.acquired || !claim.job || !claim.owner) return claim.job;
    const existing = claim.job;
    leaseOwner = claim.owner;
    const updateJob = (
      update: Parameters<typeof updateNativeGenerationJob>[1],
      eventMetadata?: Parameters<typeof updateNativeGenerationJob>[2],
    ) => updateNativeGenerationJob(jobId, update, eventMetadata, leaseOwner);
    const isResume = existing.status === "running";
    const started = existing.kind === "theater"
      ? await updateJob({
          status: "running",
          current_stage: "multimodal",
          stage_progress: 0,
          message: jobMessage("multimodal"),
          error: undefined,
        }, isResume ? { eventType: "resumed", checkpoint: "multimodal_resume" } : undefined)
      : await updateJob({
          status: "running",
          current_stage: "constellation",
          stage_progress: 0,
          message: jobMessage("constellation"),
          error: undefined,
        }, isResume ? { eventType: "resumed", checkpoint: "constellation_resume" } : undefined);
    if (!started) return getNativeGenerationJob(jobId);

    if (existing.kind === "theater") {
      const record = await getPart1Record(existing.part1_id);
      if (!record) throw new Error("part1_not_found");
      const existingTheater = findTheaterForPart1(await readBenyuanV3Store(), record.part1_id);
      if (existingTheater) {
        return updateJob({
          status: "done",
          current_stage: "done",
          progress: 1,
          message: jobMessage("done"),
          theater_script_id: existingTheater.theater_script_id,
          finished_at: new Date().toISOString(),
        });
      }

      const musicRefs = refsFromAnswer(record.answers.A2_music_analysis);
      const socialRefs = refsFromAnswer(record.answers.C1_social_posts_analysis);
      const photoRefs = refsFromAnswer(record.answers.C2_precious_photo_analysis);
      const multimodalStartedAt = Date.now();
      const analysis = await runMultimodalAnalysis({
        music_inputs: itemsFromRefs(musicRefs),
        social_post_inputs: itemsFromRefs(socialRefs),
        precious_photo_input: photoRefs[0]
          ? {
              asset_id: photoRefs[0].asset_id,
              source: photoRefs[0].name,
              file_name: photoRefs[0].name,
              mime_type: photoRefs[0].mime_type,
              description: `${photoRefs[0].question_id}:${photoRefs[0].name}`,
            }
          : undefined,
      });
      const multimodalLease = await updateJob({ stage_progress: 0.9 });
      if (!multimodalLease) return getNativeGenerationJob(jobId);
      await recordBenyuanAgentTiming({
        stage: "multimodal",
        duration_ms: Date.now() - multimodalStartedAt,
        runtime_mode: analysis.runtime.mode,
        provider: analysis.runtime.provider,
        model: analysis.runtime.model,
        error: analysis.runtime.error,
        request_id: analysis.runtime.request_id,
        part1_id: record.part1_id,
        ...classifyBenyuanMultimodalCacheStatus(analysis.runtime.error, {
          music: musicRefs.length,
          social: socialRefs.length,
          photo: photoRefs.length,
        }),
      });
      const updatedPart1: Part1Record = {
        ...record,
        updated_at: new Date().toISOString(),
        part1_data: {
          ...record.part1_data,
          aesthetics: {
            ...record.part1_data.aesthetics,
            music_analysis: analysis.result.music_analysis as MusicAnalysis,
          },
          narrative: {
            ...record.part1_data.narrative,
            social_posts_analysis: analysis.result.social_posts_analysis as SocialPostAnalysis[],
            social_posts_overall_pattern: analysis.result.social_posts_overall_pattern as SocialPostOverallPattern,
            precious_photo_analysis: analysis.result.precious_photo_analysis as PreciousPhotoAnalysis,
          },
        },
      };
      updatedPart1.aggregated_traits = aggregateTraitsFromPart1(updatedPart1.answers, updatedPart1.part1_data);
      await savePart1Record(updatedPart1);
      const behaviorProfile = buildBehaviorProfileV2(updatedPart1);
      await ensureBehaviorProfileSnapshot(updatedPart1, undefined, behaviorProfile);

      const theaterStage = await updateJob({
        current_stage: "theater",
        stage_progress: 0,
        message: jobMessage("theater"),
        behavior_profile_revision: behaviorProfile.revision,
        shadow_archetype_diagnostic: behaviorProfile.shadow_archetype,
      }, {
        checkpoint: "behavior_profile_ready",
        evidenceRevision: updatedPart1.updated_at,
      });
      if (!theaterStage) return getNativeGenerationJob(jobId);

      const theaterStartedAt = Date.now();
      const result = await generateTheaterScriptWithAgent(updatedPart1, undefined, behaviorProfile);
      const theaterLease = await updateJob({ stage_progress: 0.96 });
      if (!theaterLease) return getNativeGenerationJob(jobId);
      await recordBenyuanAgentTiming({
        stage: "theater",
        duration_ms: Date.now() - theaterStartedAt,
        runtime_mode: result.runtime.mode,
        provider: result.runtime.provider,
        model: result.runtime.model,
        error: result.runtime.error,
        request_id: result.runtime.request_id,
        part1_id: updatedPart1.part1_id,
      });
      const theaterRecord: TheaterScriptRecord = {
        theater_script_id: createBenyuanV3Id("theater"),
        part1_id: updatedPart1.part1_id,
        data_cohort: updatedPart1.data_cohort,
        data_environment: updatedPart1.data_environment,
        created_at: new Date().toISOString(),
        runtime: result.runtime,
        behavior_profile_revision: behaviorProfile.revision,
        theater_script: result.theaterScript,
      };
      await saveTheaterScriptRecord(theaterRecord);
      return updateJob({
        status: "done",
        current_stage: "done",
        progress: 1,
        message: jobMessage("done"),
        theater_script_id: theaterRecord.theater_script_id,
        finished_at: new Date().toISOString(),
      });
    }

    const [part1, part2] = await Promise.all([getPart1Record(existing.part1_id), existing.part2_id ? getPart2Record(existing.part2_id) : undefined]);
    if (!part1) throw new Error("part1_not_found");
    if (!part2) throw new Error("part2_not_found");
    if (part2.part1_id !== part1.part1_id) throw new Error("part2_part1_mismatch");

    const behaviorProfile = buildBehaviorProfileV2(part1, part2);
    await ensureBehaviorProfileSnapshot(part1, part2, behaviorProfile);
    const constellationProfileCheckpoint = await updateJob({
      behavior_profile_revision: behaviorProfile.revision,
      shadow_archetype_diagnostic: behaviorProfile.shadow_archetype,
    }, {
      eventType: "checkpoint",
      checkpoint: "behavior_profile_ready",
      evidenceRevision: `${part1.updated_at}:${part2.created_at}`,
    });
    if (!constellationProfileCheckpoint) return getNativeGenerationJob(jobId);

    const existingConstellation = findConstellationForPart2(await readBenyuanV3Store(), part1.part1_id, part2.part2_id);
    if (existingConstellation) {
      return updateJob({
        status: "done",
        current_stage: "done",
        progress: 1,
        message: jobMessage("done"),
        constellation_id: existingConstellation.constellation_id,
        finished_at: new Date().toISOString(),
      });
    }

    const constellationStartedAt = Date.now();
    const result = await generateConstellationWithAgent(part1, part2, undefined, behaviorProfile);
    const constellationLease = await updateJob({ stage_progress: 0.98 });
    if (!constellationLease) return getNativeGenerationJob(jobId);
    await recordBenyuanAgentTiming({
      stage: "constellation",
      duration_ms: Date.now() - constellationStartedAt,
      runtime_mode: result.runtime.mode,
      provider: result.runtime.provider,
      model: result.runtime.model,
      error: result.runtime.error,
      request_id: result.runtime.request_id,
      part1_id: part1.part1_id,
      part2_id: part2.part2_id,
    });
    const constellationRecord: ConstellationRecord = {
      constellation_id: createBenyuanV3Id("const"),
      part1_id: part1.part1_id,
      part2_id: part2.part2_id,
      data_cohort: part1.data_cohort,
      data_environment: part1.data_environment,
      created_at: new Date().toISOString(),
      runtime: result.runtime,
      behavior_profile_revision: behaviorProfile.revision,
      psyche_constellation: result.constellation,
    };
    await saveConstellationRecord(constellationRecord);
    return updateJob({
      status: "done",
      current_stage: "done",
      progress: 1,
      message: jobMessage("done"),
      constellation_id: constellationRecord.constellation_id,
      finished_at: new Date().toISOString(),
    });
  } catch (error) {
    if (!leaseOwner) throw error;
    return updateNativeGenerationJob(jobId, {
      status: "failed",
      current_stage: "failed",
      progress: 1,
      message: jobMessage("failed"),
      error: error instanceof Error ? error.message : "native_generation_failed",
      finished_at: new Date().toISOString(),
    }, undefined, leaseOwner);
  } finally {
    if (leaseOwner) await releaseNativeGenerationJobRun(jobId, leaseOwner);
    activeNativeGenerationJobRuns.delete(jobId);
  }
}

export async function saveConstellationRecord(record: ConstellationRecord) {
  return withStoreWrite((store) => {
    const scoped = withBenyuanDataScope({
      ...record,
      ...scopeFromPart1(store.part1_records[record.part1_id]),
      psyche_constellation: normalizePsycheConstellation(record.psyche_constellation),
    });
    store.constellations[record.constellation_id] = scoped;
    return scoped;
  });
}

export async function getConstellationRecord(constellationId: string) {
  const store = await readBenyuanV3Store();
  const record = store.constellations[constellationId];
  if (!record) return undefined;

  let normalized = normalizePsycheConstellation(record.psyche_constellation);
  const part1 = store.part1_records[record.part1_id];
  const part2 = restoreStoredPart2Semantics(store, store.part2_records[record.part2_id]);

  if (part1) {
    const fallback = generateDeterministicConstellation(part1, part2);
    const recommendationTotal = normalized.recommendations.books.length + normalized.recommendations.films.length + normalized.recommendations.music.length;
    const hasGenericTensions =
      normalized.core_tensions.length >= 2 &&
      normalized.core_tensions[0]?.name === "独立性与连接需求的张力" &&
      normalized.core_tensions[1]?.name === "意义追寻与现实节奏的张力";
    const narrativeParagraphs = normalized.narrative_overview.split(/\n\n+/).filter((item) => item.trim().length > 0);

    normalized = normalizePsycheConstellation({
      ...normalized,
      archetype: !isCanonicalBenyuanArchetypeName(normalized.archetype.name) ? fallback.archetype : normalized.archetype,
      narrative_overview: normalized.narrative_overview.trim().length < 420 || narrativeParagraphs.length < 4
        ? fallback.narrative_overview
        : normalized.narrative_overview,
      recommendations: recommendationTotal < 6 ? fallback.recommendations : supplementRecommendations(normalized.recommendations, fallback.recommendations),
      core_tensions: hasGenericTensions || normalized.core_tensions.length < 2 ? fallback.core_tensions : normalized.core_tensions,
      growth_suggestions: normalized.growth_suggestions.length < 3
        ? supplementGrowthSuggestions(normalized.growth_suggestions, fallback.growth_suggestions)
        : normalized.growth_suggestions,
    });
  }

  return {
    ...record,
    psyche_constellation: normalized,
  };
}
