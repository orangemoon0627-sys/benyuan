#!/usr/bin/env node
import assert from "node:assert/strict";
import { createServer } from "node:http";

const base = process.env.BENYUAN_BASE_URL ?? "http://127.0.0.1:3000";
const aliyunPort = Number(process.env.BENYUAN_ALIYUN_SMS_MOCK_PORT ?? 3038);
const received = [];

const server = createServer(async (request, response) => {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
  }
  received.push({
    method: request.method,
    url: request.url,
    headers: request.headers,
    body,
  });
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ Code: "OK", Message: "OK", RequestId: "mock-request" }));
});

await new Promise((resolve) => server.listen(aliyunPort, "127.0.0.1", resolve));

try {
  const providers = await fetch(`${base}/api/auth/providers`);
  assert.equal(providers.status, 200, "providers route should be reachable");
  const providerData = await providers.json();
  const phoneProvider = providerData.providers.find((item) => item.provider === "phone");
  assert.equal(phoneProvider?.enabled, true, "Aliyun SMS config should enable phone auth");
  assert.equal(phoneProvider?.status, "ready");

  const requestCode = await fetch(`${base}/api/auth/phone/request-code`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phone: "+8613800138000" }),
  });
  assert.equal(requestCode.status, 200, "Aliyun SMS provider should accept OTP requests");
  const data = await requestCode.json();
  assert.equal(data.phone, "+8613800138000");
  assert.equal(data.fixture_code, undefined, "Aliyun SMS mode must not leak OTP codes");

  assert.equal(received.length, 1, "Aliyun mock should receive one OpenAPI request");
  assert.equal(received[0].method, "POST");
  assert.equal(received[0].headers["x-acs-action"], "SendSms");
  assert.equal(received[0].headers["x-acs-version"], "2017-05-25");
  assert.equal(received[0].headers["authorization"]?.startsWith("ACS3-HMAC-SHA256 "), true);

  const params = new URLSearchParams(received[0].body);
  assert.equal(params.get("PhoneNumbers"), "+8613800138000");
  assert.equal(params.get("SignName"), "本源测试");
  assert.equal(params.get("TemplateCode"), "SMS_123456789");
  const template = JSON.parse(params.get("TemplateParam") ?? "{}");
  assert.match(template.code, /^\d{6}$/);

  console.log("auth-sms-aliyun:ok");
} finally {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}
