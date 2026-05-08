#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const root = process.cwd();
const baseUrl = (process.env.BENYUAN_BASE_URL ?? "").trim().replace(/\/$/, "");
const packs = (process.env.BENYUAN_PACKS ?? "A,B,C").trim();
const outputRelativePath = "output/benyuan-product-test-gate-summary.json";
const outputPath = path.join(root, outputRelativePath);

const localChecks = [
  ["deploy artifact policy", ["npm", "run", "smoke:deploy:artifact"]],
  ["constellation ui contract", ["npm", "run", "smoke:constellation:ui"]],
  ["processing ui contract", ["npm", "run", "smoke:processing:ui"]],
  ["theater ui contract", ["npm", "run", "smoke:theater:ui"]],
  ["visible archetype labels", ["npm", "run", "smoke:visible-archetypes"]],
  ["test pack manifest", ["npm", "run", "smoke:benyuan:test-packs"]],
];

const publicChecks = [
  ["runtime gate", ["npm", "run", "smoke:runtime:gate"]],
  ["runtime page", ["npm", "run", "smoke:runtime:page"]],
  ["golden audit", ["npm", "run", "smoke:benyuan:golden"]],
  ["benchmark packs", ["npm", "run", "smoke:benyuan:benchmark"]],
];

function runCommand(label, command, env) {
  const [bin, ...args] = command;
  const startedAt = Date.now();

  return new Promise((resolve) => {
    console.log(`\n[product-gate] ${label}`);
    console.log(`+ ${[bin, ...args].join(" ")}`);

    const child = spawn(bin, args, {
      cwd: root,
      env,
      shell: false,
      stdio: "inherit",
    });

    child.on("close", (code, signal) => {
      resolve({
        label,
        command: [bin, ...args].join(" "),
        code,
        signal,
        durationMs: Date.now() - startedAt,
        ok: code === 0,
      });
    });
  });
}

async function writeSummary(summary) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}

async function main() {
  const startedAt = new Date().toISOString();
  const env = {
    ...process.env,
    ...(baseUrl ? { BENYUAN_BASE_URL: baseUrl } : {}),
    ...(packs ? { BENYUAN_PACKS: packs } : {}),
  };
  const checks = baseUrl ? [...localChecks, ...publicChecks] : localChecks;
  const results = [];

  console.log(`[product-gate] mode=${baseUrl ? "public" : "local-contract"} base=${baseUrl || "(none)"} packs=${packs || "(default)"}`);

  for (const [label, command] of checks) {
    const result = await runCommand(label, command, env);
    results.push(result);
    if (!result.ok) break;
  }

  const failures = results.filter((result) => !result.ok);
  const summary = {
    generatedAt: new Date().toISOString(),
    startedAt,
    baseUrl: baseUrl || null,
    packs,
    status: failures.length === 0 ? "pass" : "fail",
    failures,
    results,
  };

  await writeSummary(summary);
  console.log(`\n[product-gate] summary -> ${outputPath}`);

  if (failures.length > 0) {
    console.error(`[product-gate] failed: ${failures.map((failure) => failure.label).join(", ")}`);
    process.exit(1);
  }

  console.log("[product-gate] pass");
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  await writeSummary({
    generatedAt: new Date().toISOString(),
    baseUrl: baseUrl || null,
    packs,
    status: "fail",
    failures: [{ label: "product gate runtime", message }],
    results: [],
  });
  console.error("[product-gate] fail", message);
  process.exit(1);
});
