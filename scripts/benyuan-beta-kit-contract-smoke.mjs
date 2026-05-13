import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const scripts = packageJson.scripts ?? {};

const requiredFiles = [
  "docs/beta/README.md",
  "docs/beta/tester-guide.md",
  "docs/beta/feedback-form-fields.md",
  "docs/beta/release-checklist.md",
  "docs/beta/known-issues.md",
  "docs/beta/ios-testflight-runbook.md",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const filePath of requiredFiles) {
  assert(existsSync(filePath), `missing beta kit file: ${filePath}`);
  const source = readFileSync(filePath, "utf8");
  assert(source.includes("本源"), `${filePath} must describe 本源`);
  assert(!/(TBD|TODO|待补|占位)/i.test(source), `${filePath} must not contain placeholders`);
}

const readme = readFileSync("docs/beta/README.md", "utf8");
assert(readme.includes("http://120.26.126.88"), "beta README must include current staging URL");
assert(readme.includes("npm run test:product:gate"), "beta README must include product gate command");
assert(readme.includes("BENYUAN_BASE_URL=http://120.26.126.88"), "beta README must include staging product gate command");

const testerGuide = readFileSync("docs/beta/tester-guide.md", "utf8");
for (const route of ["/collect", "/processing/benyuan", "/theater", "/constellation"]) {
  assert(testerGuide.includes(route), `tester guide must include route ${route}`);
}
for (const action of ["分享", "保存", "重新探索"]) {
  assert(testerGuide.includes(action), `tester guide must include final action ${action}`);
}

const feedback = readFileSync("docs/beta/feedback-form-fields.md", "utf8");
for (const field of ["iPhone 型号", "iOS 版本", "卡住的步骤", "最有共鸣的内容", "不准确的结果", "是否愿意复测"]) {
  assert(feedback.includes(field), `feedback form must include ${field}`);
}

const releaseChecklist = readFileSync("docs/beta/release-checklist.md", "utf8");
for (const command of ["npm run lint", "npm run build", "npm run test:product:gate", "npm run ios:shell:build"]) {
  assert(releaseChecklist.includes(command), `release checklist must include ${command}`);
}

const iosRunbook = readFileSync("docs/beta/ios-testflight-runbook.md", "utf8");
for (const command of ["ios:shell:testflight:preflight", "ios:shell:archive", "ios:shell:export", "ios:shell:upload"]) {
  assert(iosRunbook.includes(command), `iOS runbook must include ${command}`);
}
assert(iosRunbook.includes("com.fanhao.benyuan.origin.shell"), "iOS runbook must include Bundle ID");

assert(scripts["smoke:beta:kit"] === "node scripts/benyuan-beta-kit-contract-smoke.mjs", "package.json must expose smoke:beta:kit");
assert(scripts["ios:shell:build"] === "node scripts/benyuan-ios-shell-build.mjs", "package.json must use simulator-aware iOS shell build");
assert(scripts["ios:shell:testflight:preflight"] === "node scripts/benyuan-ios-testflight-preflight.mjs", "package.json must expose iOS TestFlight preflight");
assert(
  scripts["smoke:ios:testflight:preflight:contract"] === "node --test scripts/benyuan-ios-testflight-preflight-lib.test.mjs",
  "package.json must expose iOS TestFlight preflight contract smoke",
);
assert(scripts["ios:shell:archive"] === "node scripts/benyuan-ios-shell-archive.mjs", "package.json must expose iOS archive");
assert(scripts["ios:shell:export"] === "node scripts/benyuan-ios-shell-export.mjs", "package.json must expose iOS export");
assert(scripts["ios:shell:upload"] === "node scripts/benyuan-ios-shell-upload.mjs", "package.json must expose iOS upload");

console.log("beta-kit-contract:ok");
