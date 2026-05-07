import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const gate = readFileSync("scripts/benyuan-product-test-gate.mjs", "utf8");

const scripts = packageJson.scripts ?? {};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(scripts["test:product:gate"] === "node scripts/benyuan-product-test-gate.mjs", "package.json must expose test:product:gate");
assert(scripts["smoke:product:gate:contract"] === "node scripts/benyuan-product-test-gate-contract-smoke.mjs", "package.json must expose smoke:product:gate:contract");
assert(gate.includes("BENYUAN_BASE_URL"), "gate must accept BENYUAN_BASE_URL for staging/public checks");
assert(gate.includes("BENYUAN_PACKS"), "gate must pass BENYUAN_PACKS through to benchmark packs");
assert(gate.includes("smoke:deploy:artifact"), "gate must include deploy artifact safety smoke");
assert(gate.includes("smoke:constellation:ui"), "gate must include constellation UI contract");
assert(gate.includes("smoke:processing:ui"), "gate must include processing UI contract");
assert(gate.includes("smoke:theater:ui"), "gate must include theater UI contract");
assert(gate.includes("smoke:benyuan:test-packs"), "gate must include test pack manifest audit");
assert(gate.includes("smoke:runtime:gate"), "gate must include runtime mode gate");
assert(gate.includes("smoke:runtime:page"), "gate must include runtime page probe");
assert(gate.includes("smoke:benyuan:golden"), "gate must include golden audit");
assert(gate.includes("smoke:benyuan:benchmark"), "gate must include A/B/C benchmark flow");
assert(gate.includes("output/benyuan-product-test-gate-summary.json"), "gate must write a stable summary artifact");
assert(gate.includes("failures"), "gate summary must record failures");

console.log("product-test-gate-contract:ok");
