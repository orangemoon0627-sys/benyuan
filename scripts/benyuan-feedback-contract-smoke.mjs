#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readRequired(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const types = readRequired("src/lib/benyuan-v3-types.ts");
const store = readRequired("src/lib/benyuan-v3-store.ts");
const feedbackRoute = readRequired("src/app/api/account/feedback/route.ts");
const internalFeedbackRoute = readRequired("src/app/api/internal/feedback/route.ts");
const labFeedbackPage = readRequired("src/app/lab/feedback/page.tsx");
const labRouteMeta = readRequired("src/lib/lab-route-meta.ts");
const internalLabNav = readRequired("src/components/internal-lab-nav.tsx");
const nativeModels = readRequired("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeModels.swift");
const nativeClient = readRequired("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanAPIClient.swift");
const nativeFlow = readRequired("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeFlowModel.swift");
const nativeAccountView = readRequired("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeAccountView.swift");
const authRuntimeSmoke = readRequired("scripts/benyuan-auth-runtime-smoke.mjs");
const packageJson = readRequired("package.json");

assert.match(types, /BenyuanFeedbackKind/, "types must define product feedback kinds");
assert.match(types, /BenyuanFeedbackStatus/, "types must define feedback handling statuses");
assert.match(types, /BenyuanFeedbackRecord/, "types must define feedback records");
assert.match(types, /BenyuanFeedbackSubmitResponse/, "types must define feedback submit response");
assert.match(types, /feedback_records:\s*Record<string,\s*BenyuanFeedbackRecord>/, "store type must persist feedback records");

assert.match(store, /feedback_records:\s*raw\?\.feedback_records/, "store merge must preserve feedback records");
assert.match(store, /createBenyuanFeedbackId/, "store must create feedback ids");
assert.match(store, /saveFeedbackRecord/, "store must expose feedback persistence");
assert.match(store, /listFeedbackRecords/, "store must expose feedback listing for internal QA");
assert.match(store, /updateFeedbackRecordStatus/, "store must expose feedback status updates for QA triage");
assert.match(store, /created_at/, "feedback listing must sort by creation time");

assert.match(feedbackRoute, /getCurrentAuthSession/, "feedback route must require an authenticated account");
assert.match(feedbackRoute, /saveFeedbackRecord/, "feedback route must persist feedback records");
assert.match(feedbackRoute, /feedback_required/, "feedback route must reject empty feedback");
assert.match(feedbackRoute, /feedback_too_long/, "feedback route must bound feedback size");
assert.match(feedbackRoute, /BenyuanAuthError/, "feedback route must surface auth errors predictably");
assert.match(internalFeedbackRoute, /listFeedbackRecords/, "internal feedback route must read persisted records");
assert.match(internalFeedbackRoute, /searchParams\.get\("kind"\)/, "internal feedback route must support kind filter");
assert.match(internalFeedbackRoute, /searchParams\.get\("stage"\)/, "internal feedback route must support stage filter");
assert.match(internalFeedbackRoute, /searchParams\.get\("status"\)/, "internal feedback route must support status filter");
assert.match(internalFeedbackRoute, /limit/, "internal feedback route must support limit filter");
assert.match(internalFeedbackRoute, /export async function PATCH/, "internal feedback route must update feedback status");
assert.match(internalFeedbackRoute, /updateFeedbackRecordStatus/, "internal feedback route must persist status changes");
assert.match(internalFeedbackRoute, /NextResponse\.json/, "internal feedback route must return JSON");

assert.match(labRouteMeta, /\/lab\/feedback/, "lab route meta must include feedback page");
assert.match(internalLabNav, /labRouteMeta/, "internal lab nav must render route meta links");
assert.match(labFeedbackPage, /反馈管理/, "lab feedback page must expose a management title");
assert.match(labFeedbackPage, /listFeedbackRecords/, "lab feedback page must read persisted feedback records");
assert.match(labFeedbackPage, /反馈意见/, "lab feedback page must center the feedback message");
assert.match(labFeedbackPage, /处理进度/, "lab feedback page must expose the handling progress");
assert.match(labFeedbackPage, /操作/, "lab feedback page must expose handling actions");
assert.match(labFeedbackPage, /table-fixed/, "lab feedback page should render as a compact operating table");
assert.match(labFeedbackPage, /处理总览/, "lab feedback page should keep the status summary operational, not decorative");
assert.doesNotMatch(labFeedbackPage, /rounded-xl bg-white shadow-sm/, "feedback management page should avoid card-like presentation chrome");
assert.doesNotMatch(labFeedbackPage, /InternalLabNav/, "feedback management page should not show lab route clutter");
assert.doesNotMatch(labFeedbackPage, /查看原始数据/, "feedback management page should not expose raw data as a primary action");
assert.match(labFeedbackPage, /待处理/, "lab feedback page must show new feedback status");
assert.match(labFeedbackPage, /处理中/, "lab feedback page must show processing feedback status");
assert.match(labFeedbackPage, /已完成/, "lab feedback page must show completed feedback status");
assert.match(labFeedbackPage, /不处理/, "lab feedback page must show declined feedback status");
assert.match(labFeedbackPage, /updateFeedbackStatusAction/, "lab feedback page must expose server action for status changes");
assert.doesNotMatch(labFeedbackPage, /device_context =/, "lab feedback page should not render noisy device context details");
assert.doesNotMatch(labFeedbackPage, /user_id：/, "lab feedback page should not render noisy user ids");

assert.match(nativeModels, /BenyuanFeedbackKind/, "native models must encode feedback kinds");
assert.match(nativeModels, /问题上报/, "native models must offer issue feedback kind");
assert.match(nativeModels, /BenyuanFeedbackSubmitResponse/, "native models must decode feedback submit response");
assert.match(nativeClient, /submitFeedback/, "native API client must submit account feedback");
assert.match(nativeClient, /\/api\/account\/feedback/, "native API client must call the feedback route");
assert.match(nativeFlow, /submitFeedback/, "native flow must expose feedback submission");
assert.match(nativeFlow, /isFeedbackComposerPresented/, "native flow must track feedback composer presentation");
assert.match(nativeFlow, /feedbackStatus/, "native flow must surface feedback status");
assert.match(nativeAccountView, /feedbackComposer/, "native account view must include a feedback composer");
assert.match(nativeAccountView, /反馈这次体验/, "native account view must expose a feedback entry");
assert.match(packageJson, /smoke:feedback:contract/, "package scripts should include feedback contract smoke");
assert.match(authRuntimeSmoke, /\/api\/internal\/feedback/, "auth runtime smoke must verify internal feedback listing");
assert.match(authRuntimeSmoke, /PATCH/, "auth runtime smoke must verify feedback status update");
assert.match(authRuntimeSmoke, /processing/, "auth runtime smoke must verify the processing status");
assert.match(authRuntimeSmoke, /accountFeedback\.data\.feedback_id/, "auth runtime smoke must look up the submitted feedback id");

console.log("benyuan-feedback-contract:ok");
