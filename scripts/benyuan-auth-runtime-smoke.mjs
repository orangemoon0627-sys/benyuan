#!/usr/bin/env node
import assert from "node:assert/strict";

const base = process.env.BENYUAN_BASE_URL ?? "http://127.0.0.1:3000";
const fixtureAuthEnabled = process.env.BENYUAN_AUTH_ALLOW_FIXTURE === "1";
const phoneFixtureEnabled = process.env.BENYUAN_AUTH_ALLOW_PHONE_FIXTURE === "1";
const wechatFixtureEnabled = process.env.BENYUAN_AUTH_ALLOW_WECHAT_FIXTURE === "1";
const smsProviderEnabled = Boolean(process.env.BENYUAN_SMS_PROVIDER);
const rateLimitLimit = Number(process.env.BENYUAN_AUTH_RATE_LIMIT_MAX ?? 5);
const runDigits = `${Date.now()}${Math.floor(Math.random() * 1_000_000)
  .toString()
  .padStart(6, "0")}`.slice(-8);
const primaryPhone = `+86139${runDigits}`;
const duplicatePhoneNumber = `+86138${runDigits}`;
const rateLimitPhone = `+86137${runDigits}`;

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  const text = await response.text();
  const data = text.length > 0 ? JSON.parse(text) : {};
  return { response, data };
}

async function post(path, body, headers = {}) {
  return request(path, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function patch(path, body, headers = {}) {
  return request(path, {
    method: "PATCH",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function requireOption(schema, questionId, index = 0) {
  const question = schema.questions.find((item) => item.id === questionId);
  assert.ok(question, `missing question ${questionId}`);
  const option = question.options?.[index];
  assert.ok(option?.id, `missing option ${questionId}[${index}]`);
  return option.id;
}

function fixtureAct2Choices() {
  return Array.from({ length: 4 }, (_, index) => ({
    choice_id: index + 1,
    selected: `runtime_act2_choice_${index + 1}`,
    hesitation_time: 1.4 + index * 0.2,
    hover_sequence: [`runtime_act2_choice_${index + 1}`],
    timestamp: new Date(Date.now() + index * 1000).toISOString(),
  }));
}

const providers = await request("/api/auth/providers");
assert.equal(providers.response.status, 200, "providers route should be reachable");
assert.equal(providers.data.providers.find((item) => item.provider === "apple")?.enabled, true);
assert.equal(providers.data.providers.find((item) => item.provider === "anonymous")?.enabled, true);
assert.equal(providers.data.providers.find((item) => item.provider === "wechat")?.status, wechatFixtureEnabled || Boolean(process.env.BENYUAN_WECHAT_APP_ID) ? "ready" : "reserved");
assert.equal(providers.data.providers.find((item) => item.provider === "wechat")?.enabled, wechatFixtureEnabled || Boolean(process.env.BENYUAN_WECHAT_APP_ID));
assert.equal(providers.data.providers.find((item) => item.provider === "phone")?.status, smsProviderEnabled || phoneFixtureEnabled ? "ready" : "reserved");
assert.equal(providers.data.providers.find((item) => item.provider === "phone")?.enabled, smsProviderEnabled || phoneFixtureEnabled);
assert.ok(providers.data.capabilities.includes("bind_wechat"));
assert.ok(providers.data.capabilities.includes("bind_phone"));

const emptyApple = await post("/api/auth/apple", {});
assert.equal(emptyApple.response.status, 400, "Apple route should reject missing credentials");
assert.equal(emptyApple.data.error, "missing_apple_credential");

const emptyWechat = await post("/api/auth/wechat", {});
assert.equal(emptyWechat.response.status, 400, "WeChat route should reject missing authorization codes");
assert.equal(emptyWechat.data.error, "missing_wechat_code");

const invalidPhone = await post("/api/auth/phone/request-code", { phone: "12" });
assert.equal(invalidPhone.response.status, 400, "phone request route should reject invalid phone numbers");
assert.equal(invalidPhone.data.error, "invalid_phone");

const phoneRequest = await post("/api/auth/phone/request-code", { phone: primaryPhone });
if (phoneFixtureEnabled) {
  assert.equal(phoneRequest.response.status, 200, "phone fixture mode should issue a verification code");
  assert.equal(phoneRequest.data.phone, primaryPhone);
  assert.equal(phoneRequest.data.fixture_code, "246810");
} else {
  assert.equal(phoneRequest.response.status, 503, "phone request should not pretend to send SMS without a provider");
  assert.equal(phoneRequest.data.error, "sms_provider_not_configured");
}

const fixtureApple = await post("/api/auth/apple", {
  identity_token: "fixture.apple.identity",
  authorization_code: "fixture.apple.code",
  display_name: "Apple 测试",
});
if (fixtureAuthEnabled) {
  assert.equal(fixtureApple.response.status, 200, "fixture Apple auth should be allowed only with BENYUAN_AUTH_ALLOW_FIXTURE=1");
  assert.equal(fixtureApple.data.user.primary_provider, "apple");
  assert.match(fixtureApple.data.session.token, /^bya_apple_/);
} else {
  assert.equal(fixtureApple.response.status, 401, "fixture Apple auth should be rejected by default");
  assert.equal(fixtureApple.data.error, "invalid_apple_identity_token");
}

const anonymous = await post("/api/auth/anonymous", {});
assert.equal(anonymous.response.status, 200, "anonymous route should create a session");
assert.equal(anonymous.data.user.primary_provider, "anonymous");
assert.match(anonymous.data.session.token, /^bya_anonymous_/);

const currentAnonymous = await request("/api/auth/me", {
  headers: { authorization: `Bearer ${anonymous.data.session.token}` },
});
assert.equal(currentAnonymous.response.status, 200, "me route should return the authenticated account");
assert.equal(currentAnonymous.data.user.user_id, anonymous.data.user.user_id);
assert.equal(currentAnonymous.data.session.token, anonymous.data.session.token);

const initialHistory = await request("/api/account/history", {
  headers: { authorization: `Bearer ${anonymous.data.session.token}` },
});
assert.equal(initialHistory.response.status, 200, "history route should return an empty list for new users");
assert.deepEqual(initialHistory.data.items, []);

const unauthenticatedFeedback = await post("/api/account/feedback", {
  kind: "issue",
  message: "未登录反馈应该被拒绝。",
  stage: "account",
});
assert.equal(unauthenticatedFeedback.response.status, 401, "feedback route should require auth");
assert.equal(unauthenticatedFeedback.data.error, "auth_required");

const accountFeedback = await post(
  "/api/account/feedback",
  {
    kind: "issue",
    message: "星图生成后，底部按钮偶尔会遮住最后一段文字。",
    stage: "constellation",
    part1_id: "part1_feedback_runtime",
    device_context: {
      platform: "ios-native",
      build: "runtime-smoke",
    },
  },
  { authorization: `Bearer ${anonymous.data.session.token}` },
);
assert.equal(accountFeedback.response.status, 200, "feedback route should accept authenticated feedback");
assert.equal(accountFeedback.data.ok, true);
assert.match(accountFeedback.data.feedback_id, /^feedback_/, "feedback route should return a persisted feedback id");
assert.ok(accountFeedback.data.created_at, "feedback route should return created_at");

const internalFeedbackList = await request("/api/internal/feedback?kind=issue&stage=constellation&status=new&limit=20");
assert.equal(internalFeedbackList.response.status, 200, "internal feedback route should list persisted feedback");
assert.equal(internalFeedbackList.data.status, "ok");
assert.ok(
  internalFeedbackList.data.records.some((record) => record.feedback_id === accountFeedback.data.feedback_id),
  "internal feedback route should return the submitted feedback id",
);

const feedbackStatusUpdate = await patch("/api/internal/feedback", {
  feedback_id: accountFeedback.data.feedback_id,
  status: "processing",
});
assert.equal(feedbackStatusUpdate.response.status, 200, "internal feedback route should update feedback status");
assert.equal(feedbackStatusUpdate.data.status, "ok");
assert.equal(feedbackStatusUpdate.data.record.status, "processing");

const processingFeedbackList = await request("/api/internal/feedback?status=processing&limit=20");
assert.equal(processingFeedbackList.response.status, 200, "internal feedback route should filter by updated status");
assert.ok(
  processingFeedbackList.data.records.some((record) => record.feedback_id === accountFeedback.data.feedback_id && record.status === "processing"),
  "internal feedback route should return the submitted feedback after status update",
);

const fixtureWechat = await post(
  "/api/auth/wechat",
  { code: "fixture.wechat.code", display_name: "微信测试" },
  { authorization: `Bearer ${anonymous.data.session.token}` },
);
if (wechatFixtureEnabled) {
  assert.equal(fixtureWechat.response.status, 200, "fixture WeChat auth should be allowed only with BENYUAN_AUTH_ALLOW_WECHAT_FIXTURE=1");
  assert.equal(fixtureWechat.data.user.user_id, anonymous.data.user.user_id, "bearer auth should bind WeChat to the existing user");
  assert.equal(fixtureWechat.data.user.wechat_bound, true);
  assert.equal(fixtureWechat.data.session.provider, "wechat");
  assert.match(fixtureWechat.data.session.token, /^bya_wechat_/);

  const duplicateWechat = await post("/api/auth/wechat", { code: "fixture.wechat.code", display_name: "微信测试" });
  assert.equal(duplicateWechat.response.status, 200, "duplicate WeChat subject should reuse the existing user");
  assert.equal(duplicateWechat.data.user.user_id, anonymous.data.user.user_id);
} else {
  assert.equal(fixtureWechat.response.status, 503, "unconfigured WeChat auth should be rejected by default");
  assert.equal(fixtureWechat.data.error, "wechat_not_configured");
}

const phoneVerify = await post("/api/auth/phone/verify-code", { phone: primaryPhone, code: "246810" });
if (phoneFixtureEnabled) {
  assert.equal(phoneVerify.response.status, 200, "phone fixture mode should create a phone session");
  assert.equal(phoneVerify.data.user.primary_provider, "phone");
  assert.equal(phoneVerify.data.user.phone_bound, true);
  assert.match(phoneVerify.data.session.token, /^bya_phone_/);

  const duplicatePhoneRequest = await post("/api/auth/phone/request-code", { phone: duplicatePhoneNumber });
  assert.equal(duplicatePhoneRequest.response.status, 200, "phone fixture should issue a second test code");
  const duplicatePhone = await post("/api/auth/phone/verify-code", { phone: duplicatePhoneNumber, code: "246810" });
  assert.equal(duplicatePhone.response.status, 200, "phone fixture should create the first phone session");
  const duplicatePhoneRequestAgain = await post("/api/auth/phone/request-code", { phone: duplicatePhoneNumber });
  assert.equal(duplicatePhoneRequestAgain.response.status, 200, "phone fixture should issue a fresh code for duplicate login");
  const duplicatePhoneAgain = await post("/api/auth/phone/verify-code", { phone: duplicatePhoneNumber, code: "246810" });
  assert.equal(duplicatePhoneAgain.response.status, 200, "duplicate phone subject should login to the same user");
  assert.equal(duplicatePhoneAgain.data.user.user_id, duplicatePhone.data.user.user_id);
} else {
  assert.equal(phoneVerify.response.status, 401, "phone verify should reject missing/unissued codes");
  assert.equal(phoneVerify.data.error, "invalid_phone_code");
}

const logout = await post("/api/auth/logout", {}, { authorization: `Bearer ${anonymous.data.session.token}` });
assert.equal(logout.response.status, 200, "logout route should revoke the current session");
assert.equal(logout.data.ok, true);

const afterLogout = await request("/api/auth/me", {
  headers: { authorization: `Bearer ${anonymous.data.session.token}` },
});
assert.equal(afterLogout.response.status, 401, "revoked tokens must not return account details");
assert.equal(afterLogout.data.error, "auth_required");

if (phoneFixtureEnabled) {
  let limited;
  for (let index = 0; index < rateLimitLimit + 1; index += 1) {
    limited = await post("/api/auth/phone/request-code", { phone: rateLimitPhone });
  }
  assert.equal(limited.response.status, 429, "phone OTP requests should be rate limited");
  assert.equal(limited.data.error, "rate_limited");
}

const secondAnonymous = await post("/api/auth/anonymous", {});
assert.equal(secondAnonymous.response.status, 200, "second anonymous route should create a session");
const ownerAnonymous = await post("/api/auth/anonymous", {});
assert.equal(ownerAnonymous.response.status, 200, "owner anonymous route should create a session for ownership checks");

const schemaResult = await request("/api/part1/schema");
assert.equal(schemaResult.response.status, 200, "schema route should be reachable");
const schema = schemaResult.data;
const answers = {
  A1_core_image: requireOption(schema, "A1_core_image", 0),
  A2_music_analysis: [{ visible_text: "post-rock ambient", source: "fixture" }],
  A3_literature: [requireOption(schema, "A3_literature", 0), requireOption(schema, "A3_literature", 1)],
  A4_cinema: requireOption(schema, "A4_cinema", 0),
  A5_inspiration_scene: requireOption(schema, "A5_inspiration_scene", 0),
  B1_night_thoughts: requireOption(schema, "B1_night_thoughts", 0),
  B2_decision_style: requireOption(schema, "B2_decision_style", 0),
  B3_emotion_pattern: requireOption(schema, "B3_emotion_pattern", 0),
  B4_time_philosophy: { past: 34, present: 33, future: 33 },
  B5_relationship_philosophy: requireOption(schema, "B5_relationship_philosophy", 0),
  C1_social_posts_analysis: [{ visible_text: "雨夜、海、对话", source: "fixture" }],
  C2_precious_photo_analysis: [{ visible_text: "海边背影", source: "fixture" }],
  C3_resonance_moments: [requireOption(schema, "C3_resonance_moments", 0)],
};

const submit = await post(
  "/api/part1/submit",
  { user_id: "usr_should_not_win", answers },
  { authorization: `Bearer ${ownerAnonymous.data.session.token}` },
);
assert.equal(submit.response.status, 200, "part1 submit should accept authenticated answers");
assert.equal(submit.data.user_id, ownerAnonymous.data.user.user_id, "bearer token user should override body user_id");
assert.notEqual(submit.data.user_id, "usr_should_not_win");

const ownerHistoryAfterPart1 = await request("/api/account/history", {
  headers: { authorization: `Bearer ${ownerAnonymous.data.session.token}` },
});
assert.equal(ownerHistoryAfterPart1.response.status, 200, "history route should list owned draft explorations");
assert.equal(ownerHistoryAfterPart1.data.items.length, 1);
assert.equal(ownerHistoryAfterPart1.data.items[0].part1_id, submit.data.part1_id);
assert.equal(ownerHistoryAfterPart1.data.items[0].stage, "part1");
assert.equal(ownerHistoryAfterPart1.data.items[0].asset_count, 0);
assert.ok(ownerHistoryAfterPart1.data.items[0].title, "history item should expose a display title");

const crossUserTheater = await post(
  "/api/theater/generate",
  { part1_id: submit.data.part1_id },
  { authorization: `Bearer ${secondAnonymous.data.session.token}` },
);
assert.equal(crossUserTheater.response.status, 403, "another user must not generate theater for this part1");
assert.equal(crossUserTheater.data.error, "part1_forbidden");

const ownerTheater = await post(
  "/api/theater/generate",
  { part1_id: submit.data.part1_id },
  { authorization: `Bearer ${ownerAnonymous.data.session.token}` },
);
assert.equal(ownerTheater.response.status, 200, "owner should generate theater for this part1");
assert.ok(ownerTheater.data.theater_script_id, "theater generation should return a script id");

const unauthenticatedTheaterDetail = await request(`/api/theater/${ownerTheater.data.theater_script_id}`);
assert.equal(unauthenticatedTheaterDetail.response.status, 401, "theater detail should require auth");
assert.equal(unauthenticatedTheaterDetail.data.error, "auth_required");

const crossUserTheaterDetail = await request(`/api/theater/${ownerTheater.data.theater_script_id}`, {
  headers: { authorization: `Bearer ${secondAnonymous.data.session.token}` },
});
assert.equal(crossUserTheaterDetail.response.status, 403, "another user must not read this theater detail");
assert.equal(crossUserTheaterDetail.data.error, "part1_forbidden");

const ownerTheaterDetail = await request(`/api/theater/${ownerTheater.data.theater_script_id}`, {
  headers: { authorization: `Bearer ${ownerAnonymous.data.session.token}` },
});
assert.equal(ownerTheaterDetail.response.status, 200, "owner should read theater detail");
assert.equal(ownerTheaterDetail.data.theater_script_id, ownerTheater.data.theater_script_id);

const ownerPart2 = await post(
  "/api/part2/submit",
  {
    part1_id: submit.data.part1_id,
    theater_script_id: ownerTheater.data.theater_script_id,
    act2_choices: fixtureAct2Choices(),
    act3_responses: [
      {
        question_id: 1,
        selected: "runtime_mirror_choice",
        hesitation_time: 2.2,
        timestamp: new Date().toISOString(),
      },
    ],
    metadata: {
      device: "runtime-smoke",
      phase_durations: { act1: 3.5, act2: 4.5, act3: 5.5 },
    },
  },
  { authorization: `Bearer ${ownerAnonymous.data.session.token}` },
);
assert.equal(ownerPart2.response.status, 200, "owner should submit Part2 theater choices");
assert.ok(ownerPart2.data.part2_id, "Part2 submit should return a record id");
assert.equal(ownerPart2.data.act2_choice_count, 4);
assert.equal(ownerPart2.data.act3_response_count, 1);

const unauthenticatedPart2Detail = await request(`/api/account/history/${submit.data.part1_id}/part2?part2_id=${ownerPart2.data.part2_id}`);
assert.equal(unauthenticatedPart2Detail.response.status, 401, "part2 history detail should require auth");
assert.equal(unauthenticatedPart2Detail.data.error, "auth_required");

const crossUserPart2Detail = await request(`/api/account/history/${submit.data.part1_id}/part2?part2_id=${ownerPart2.data.part2_id}`, {
  headers: { authorization: `Bearer ${secondAnonymous.data.session.token}` },
});
assert.equal(crossUserPart2Detail.response.status, 403, "another user must not read saved Part2 choices");
assert.equal(crossUserPart2Detail.data.error, "part1_forbidden");

const ownerPart2Detail = await request(`/api/account/history/${submit.data.part1_id}/part2?part2_id=${ownerPart2.data.part2_id}`, {
  headers: { authorization: `Bearer ${ownerAnonymous.data.session.token}` },
});
assert.equal(ownerPart2Detail.response.status, 200, "owner should read saved Part2 choices for native history replay");
assert.equal(ownerPart2Detail.data.part2_id, ownerPart2.data.part2_id);
assert.equal(ownerPart2Detail.data.part1_id, submit.data.part1_id);
assert.equal(ownerPart2Detail.data.theater_script_id, ownerTheater.data.theater_script_id);
assert.deepEqual(ownerPart2Detail.data.act2_choices.map((item) => item.selected), [
  "runtime_act2_choice_1",
  "runtime_act2_choice_2",
  "runtime_act2_choice_3",
  "runtime_act2_choice_4",
]);
assert.deepEqual(ownerPart2Detail.data.act3_responses.map((item) => item.selected), ["runtime_mirror_choice"]);
assert.equal(ownerPart2Detail.data.metadata.phase_durations.act3, 5.5);

const deleteCrossUserHistory = await request(`/api/account/history/${submit.data.part1_id}`, {
  method: "DELETE",
  headers: { authorization: `Bearer ${secondAnonymous.data.session.token}` },
});
assert.equal(deleteCrossUserHistory.response.status, 404, "another user must not delete this history item");

const deleteOwnerHistory = await request(`/api/account/history/${submit.data.part1_id}`, {
  method: "DELETE",
  headers: { authorization: `Bearer ${ownerAnonymous.data.session.token}` },
});
assert.equal(deleteOwnerHistory.response.status, 200, "owner should delete a history item");
assert.equal(deleteOwnerHistory.data.ok, true);

const ownerHistoryAfterDelete = await request("/api/account/history", {
  headers: { authorization: `Bearer ${ownerAnonymous.data.session.token}` },
});
assert.equal(ownerHistoryAfterDelete.response.status, 200, "history route should stay reachable after deletion");
assert.deepEqual(ownerHistoryAfterDelete.data.items, []);

console.log("auth-runtime:ok");
