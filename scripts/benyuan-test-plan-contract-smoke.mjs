#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readRequired(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const packageJson = readRequired("package.json");
const types = readRequired("src/lib/benyuan-v3-types.ts");
const store = readRequired("src/lib/benyuan-v3-store.ts");
const labRouteMeta = readRequired("src/lib/lab-route-meta.ts");
const testPlanPage = readRequired("src/app/lab/test-plan/page.tsx");

assert.match(packageJson, /smoke:test-plan:contract/, "package scripts should include test plan contract smoke");

assert.match(types, /BenyuanTestPlanStatus/, "types must define test plan statuses");
assert.match(types, /BenyuanTestPlanSource/, "types must define whether a test item is system seeded or feedback derived");
assert.match(types, /BenyuanTestPlanExecutionState/, "types must define the engineering execution state");
assert.match(types, /BenyuanTestPlanItem/, "types must define test plan items");
assert.match(types, /test_plan_items:\s*Record<string,\s*BenyuanTestPlanItem>/, "store type must persist test plan items");

assert.match(store, /test_plan_items:\s*raw\?\.test_plan_items/, "store merge must preserve test plan items");
assert.match(store, /seedBenyuanTestPlanItems/, "store must seed the initial app test checklist");
assert.match(store, /system_regression/, "test plan seed must clearly mark system regression items");
assert.match(store, /implemented_needs_verification/, "test plan seed must mark items already implemented but awaiting regression");
assert.match(store, /needs_hardening/, "test plan seed must mark items that still need product hardening");
assert.match(store, /blocked_external_resources/, "test plan seed must mark external-resource blockers");
assert.match(store, /listTestPlanItems/, "store must expose test plan listing");
assert.match(store, /updateTestPlanItemStatus/, "store must expose test plan status updates");
assert.match(store, /image_assets/, "test plan seed must include image selection and deletion");
assert.match(store, /theater_api/, "test plan seed must include theater API generation");
assert.match(store, /theater_story/, "test plan seed must include theater continuity");
assert.match(store, /constellation_motion/, "test plan seed must include constellation motion");
assert.match(store, /feedback_modal/, "test plan seed must include app feedback modal");
assert.match(store, /auth_binding/, "test plan seed must include Apple WeChat phone binding");
assert.match(store, /history_account/, "test plan seed must include account history");

assert.match(labRouteMeta, /\/lab\/test-plan/, "lab route meta must include test plan page");

assert.match(testPlanPage, /测试任务清单/, "test plan page must expose a clear title");
assert.match(testPlanPage, /系统回归项/, "test plan page must explain that seeded items are system regression items");
assert.match(testPlanPage, /真实用户反馈只进入反馈管理/, "test plan page must not imply seeded tasks are real user feedback");
assert.match(testPlanPage, /测试项/, "test plan page must show test item column");
assert.match(testPlanPage, /当前状态/, "test plan page must show current status column");
assert.match(testPlanPage, /工程定位/, "test plan page must show execution state column");
assert.match(testPlanPage, /验证方式/, "test plan page must show verification method column");
assert.match(testPlanPage, /真实反馈命中/, "test plan page must show real feedback keyword hits instead of implying fake issues");
assert.match(testPlanPage, /关键词命中/, "test plan page must explain feedback hits are keyword matches");
assert.match(testPlanPage, /待测试/, "test plan page must show pending status");
assert.match(testPlanPage, /测试中/, "test plan page must show testing status");
assert.match(testPlanPage, /需修复/, "test plan page must show needs-fix status");
assert.match(testPlanPage, /已通过/, "test plan page must show passed status");
assert.match(testPlanPage, /updateTestPlanStatusAction/, "test plan page must expose server action for status changes");
assert.doesNotMatch(testPlanPage, /device_context =/, "test plan page should not render noisy device context details");

console.log("benyuan-test-plan-contract:ok");
