import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  BenyuanAuthProvider,
  BenyuanAuthSession,
  BenyuanAuthProviderIndex,
  BenyuanAuthRateLimit,
  BenyuanFeedbackRecord,
  BenyuanTestPlanItem,
  BenyuanAccountHistoryItem,
  BenyuanPhoneOtp,
  BenyuanStoredAsset,
  BenyuanUser,
  BenyuanV3Store,
  ConstellationRecord,
  Part1Record,
  Part2Record,
  TheaterScriptRecord,
} from "@/lib/benyuan-v3-types";
import { normalizePsycheConstellation } from "@/lib/benyuan-v3-normalization";
import { isSuspiciousArchetypeName } from "@/lib/benyuan-v3-report-profile";
import { generateDeterministicConstellation } from "@/lib/benyuan-v3-engine";
import { uploadedAssetsFromAnswer } from "@/lib/benyuan-upload-assets";
import { ensureBenyuanDataDirs, getBenyuanPersistenceHealth, getBenyuanV3StorePath } from "@/lib/benyuan-persistence";

const STORE_PATH = getBenyuanV3StorePath();
const TEMP_STORE_PATH = `${STORE_PATH}.${process.pid}.tmp`;

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
  feedback_records: {},
  test_plan_items: {},
};

let storeWriteQueue: Promise<void> = Promise.resolve();

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

async function ensureStoreFile() {
  await ensureBenyuanDataDirs();
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await readFile(STORE_PATH, "utf8");
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2), "utf8");
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
    feedback_records: raw?.feedback_records ?? {},
    test_plan_items: raw?.test_plan_items ?? {},
  };
}

async function parseStoreFile() {
  await ensureStoreFile();
  const raw = await readFile(STORE_PATH, "utf8");

  try {
    return mergeStore(JSON.parse(raw) as Partial<BenyuanV3Store>);
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2), "utf8");
    return { ...EMPTY_STORE };
  }
}

async function withStoreWrite<T>(updater: (store: BenyuanV3Store) => T | Promise<T>) {
  let result: T;

  storeWriteQueue = storeWriteQueue.then(async () => {
    const store = await parseStoreFile();
    result = await updater(store);
    await writeFile(TEMP_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
    await rename(TEMP_STORE_PATH, STORE_PATH);
  });

  await storeWriteQueue;
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

export function createBenyuanV3Id(prefix: "upload" | "part1" | "theater" | "part2" | "const") {
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
    store.users[user.user_id] = user;
    store.auth_sessions[session.token] = session;
    const timestamp = new Date().toISOString();
    for (const [provider, providerSubject] of Object.entries(user.providers)) {
      if (!providerSubject) continue;
      const indexKey = `${provider}:${providerSubject}`;
      const existing = store.auth_provider_index[indexKey];
      store.auth_provider_index[indexKey] = {
        provider: provider as BenyuanAuthProviderIndex["provider"],
        provider_subject: providerSubject,
        user_id: user.user_id,
        created_at: existing?.created_at ?? timestamp,
        updated_at: timestamp,
      };
    }
    return { user, session };
  });
}

export async function getAuthSessionByToken(token: string) {
  const store = await readBenyuanV3Store();
  const session = store.auth_sessions[token];
  if (!session || session.revoked_at) return undefined;
  const user = store.users[session.user_id];
  if (!user) return undefined;
  return { session, user };
}

export async function findUserByProviderSubject(provider: BenyuanAuthProviderIndex["provider"], providerSubject: string) {
  const store = await readBenyuanV3Store();
  const indexed = store.auth_provider_index[`${provider}:${providerSubject}`];
  if (!indexed) return undefined;
  return store.users[indexed.user_id];
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
  return store.auth_rate_limits[key];
}

export async function saveAuthRateLimit(limit: BenyuanAuthRateLimit) {
  return withStoreWrite((store) => {
    store.auth_rate_limits[limit.key] = limit;
    return limit;
  });
}

export async function savePhoneOtp(otp: BenyuanPhoneOtp) {
  return withStoreWrite((store) => {
    store.phone_otps[otp.phone] = otp;
    return otp;
  });
}

export async function getPhoneOtp(phone: string) {
  const store = await readBenyuanV3Store();
  return store.phone_otps[phone];
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

function findConstellationForPart1(store: BenyuanV3Store, part1Id: string) {
  return Object.values(store.constellations).find((item) => item.part1_id === part1Id);
}

function makeHistoryItem(store: BenyuanV3Store, part1: Part1Record): BenyuanAccountHistoryItem {
  const theater = findTheaterForPart1(store, part1.part1_id);
  const part2 = findPart2ForPart1(store, part1.part1_id);
  const constellation = findConstellationForPart1(store, part1.part1_id);
  const stage = constellation ? "constellation" : part2 ? "part2" : theater ? "theater" : "part1";
  const assetCount = countPart1Assets(part1);
  const archetypeName = constellation?.psyche_constellation.archetype.name;
  const theme = part1.aggregated_traits.core_themes[0] ?? "私人月相";
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
    store.feedback_records[record.feedback_id] = record;
    return record;
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
    store.uploaded_assets[asset.asset_id] = asset;
    return asset;
  });
}

export async function getUploadedAsset(assetId: string) {
  const store = await readBenyuanV3Store();
  return store.uploaded_assets[assetId];
}

export async function savePart1Record(record: Part1Record) {
  return withStoreWrite((store) => {
    store.part1_records[record.part1_id] = record;
    return record;
  });
}

export async function getPart1Record(part1Id: string) {
  const store = await readBenyuanV3Store();
  return store.part1_records[part1Id];
}

export async function saveTheaterScriptRecord(record: TheaterScriptRecord) {
  return withStoreWrite((store) => {
    store.theater_scripts[record.theater_script_id] = record;
    return record;
  });
}

export async function getTheaterScriptRecord(theaterScriptId: string) {
  const store = await readBenyuanV3Store();
  return store.theater_scripts[theaterScriptId];
}

export async function savePart2Record(record: Part2Record) {
  return withStoreWrite((store) => {
    store.part2_records[record.part2_id] = record;
    return record;
  });
}

export async function getPart2Record(part2Id: string) {
  const store = await readBenyuanV3Store();
  return store.part2_records[part2Id];
}

export async function getPart2RecordForPart1(part1Id: string, part2Id?: string) {
  const store = await readBenyuanV3Store();
  if (part2Id) {
    const record = store.part2_records[part2Id];
    return record?.part1_id === part1Id ? record : undefined;
  }
  return findPart2ForPart1(store, part1Id);
}

export async function saveConstellationRecord(record: ConstellationRecord) {
  return withStoreWrite((store) => {
    store.constellations[record.constellation_id] = record;
    return record;
  });
}

export async function getConstellationRecord(constellationId: string) {
  const store = await readBenyuanV3Store();
  const record = store.constellations[constellationId];
  if (!record) return undefined;

  let normalized = normalizePsycheConstellation(record.psyche_constellation);
  const part1 = store.part1_records[record.part1_id];
  const part2 = store.part2_records[record.part2_id];

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
      archetype: isSuspiciousArchetypeName(normalized.archetype.name) ? fallback.archetype : normalized.archetype,
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
