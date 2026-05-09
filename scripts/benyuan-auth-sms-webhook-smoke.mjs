#!/usr/bin/env node
import assert from "node:assert/strict";
import { createServer } from "node:http";

const base = process.env.BENYUAN_BASE_URL ?? "http://127.0.0.1:3000";
const webhookPort = Number(process.env.BENYUAN_SMS_WEBHOOK_PORT ?? 3037);
const webhookUrl = `http://127.0.0.1:${webhookPort}/sms`;
const received = [];

const webhook = createServer(async (request, response) => {
  if (request.method !== "POST") {
    response.writeHead(405);
    response.end();
    return;
  }

  let body = "";
  for await (const chunk of request) {
    body += chunk;
  }
  received.push({
    authorization: request.headers.authorization,
    body: JSON.parse(body),
  });
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ ok: true }));
});

await new Promise((resolve) => webhook.listen(webhookPort, "127.0.0.1", resolve));

try {
  const providers = await fetch(`${base}/api/auth/providers`);
  assert.equal(providers.status, 200, "providers route should be reachable");
  const providerData = await providers.json();
  const phoneProvider = providerData.providers.find((item) => item.provider === "phone");
  assert.equal(phoneProvider?.enabled, true, "configured SMS provider should enable phone auth");
  assert.equal(phoneProvider?.status, "ready");

  const requestCode = await fetch(`${base}/api/auth/phone/request-code`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phone: "+8613800138000" }),
  });
  assert.equal(requestCode.status, 200, "configured SMS provider should accept phone OTP requests");
  const data = await requestCode.json();
  assert.equal(data.phone, "+8613800138000");
  assert.equal(data.fixture_code, undefined, "real SMS mode must not leak OTP codes");

  assert.equal(received.length, 1, "SMS webhook should receive exactly one request");
  assert.equal(received[0].authorization, "Bearer test-sms-token");
  assert.equal(received[0].body.phone, "+8613800138000");
  assert.match(received[0].body.code, /^\d{6}$/);
  assert.equal(received[0].body.app, "benyuan");
  assert.ok(received[0].body.expires_at);
  assert.equal(process.env.BENYUAN_SMS_WEBHOOK_URL, webhookUrl, "server and smoke must point to the same webhook URL");

  console.log("auth-sms-webhook:ok");
} finally {
  await new Promise((resolve, reject) => webhook.close((error) => (error ? reject(error) : resolve())));
}
