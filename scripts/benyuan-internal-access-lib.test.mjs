import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { evaluateBenyuanInternalAccess } from "../src/lib/benyuan-internal-access.ts";

test("proxy covers internal pages, internal APIs, and runtime diagnostics", async () => {
  const proxySource = await readFile(new URL("../src/proxy.ts", import.meta.url), "utf8");
  for (const route of ["/lab/:path*", "/agent/:path*", "/api/internal/:path*", "/api/agent/:path*", "/api/analysis/runtime"]) {
    assert.ok(proxySource.includes(route), `proxy must protect ${route}`);
  }
});

test("internal routes remain available during local development", () => {
  assert.deepEqual(evaluateBenyuanInternalAccess({ nodeEnv: "development" }), {
    allowed: true,
    reason: "development",
  });
});

test("production hides internal routes when no access token is configured", () => {
  assert.deepEqual(evaluateBenyuanInternalAccess({ nodeEnv: "production" }), {
    allowed: false,
    status: 404,
    reason: "missing_configuration",
  });
});

test("production accepts a matching bearer token", () => {
  assert.deepEqual(
    evaluateBenyuanInternalAccess({
      nodeEnv: "production",
      configuredToken: "test-internal-token",
      authorization: "Bearer test-internal-token",
    }),
    { allowed: true, reason: "authorized" },
  );
});

test("production accepts Basic auth with the benyuan username", () => {
  const credentials = Buffer.from("benyuan:test-internal-token", "utf8").toString("base64");
  assert.deepEqual(
    evaluateBenyuanInternalAccess({
      nodeEnv: "production",
      configuredToken: "test-internal-token",
      authorization: `Basic ${credentials}`,
    }),
    { allowed: true, reason: "authorized" },
  );
});

test("production rejects incorrect or malformed authorization", () => {
  for (const authorization of [undefined, "Bearer wrong", "Basic !!!", `Basic ${Buffer.from("other:test-internal-token").toString("base64")}`]) {
    assert.deepEqual(
      evaluateBenyuanInternalAccess({
        nodeEnv: "production",
        configuredToken: "test-internal-token",
        authorization,
      }),
      { allowed: false, status: 401, reason: "invalid_authorization" },
    );
  }
});
