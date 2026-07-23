import assert from "node:assert/strict";
import test from "node:test";

import { resolveBenyuanClientIp } from "../src/lib/benyuan-client-ip.ts";

test("client IP trusts reverse-proxy X-Real-IP over a client-injected XFF prefix", () => {
  const headers = new Headers({
    "x-real-ip": "203.0.113.20",
    "x-forwarded-for": "198.51.100.7, 203.0.113.20",
  });
  assert.equal(resolveBenyuanClientIp(headers), "203.0.113.20");
});

test("client IP falls back to the rightmost valid forwarded address", () => {
  const headers = new Headers({
    "x-forwarded-for": "attacker-controlled, 198.51.100.12",
  });
  assert.equal(resolveBenyuanClientIp(headers), "198.51.100.12");
});

test("client IP rejects malformed forwarding values", () => {
  const headers = new Headers({
    "x-real-ip": "not-an-ip",
    "x-forwarded-for": "also-not-an-ip",
  });
  assert.equal(resolveBenyuanClientIp(headers), "unknown");
});
