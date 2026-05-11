import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const tokens = readFileSync("mobile/benyuan_origin_ios_shell/BenyuanDesignTokens.swift", "utf8");
const account = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeAccountView.swift", "utf8");

function extractRgb(name) {
  const match = tokens.match(new RegExp(`static let ${name} = Color\\(red: ([0-9.]+) \\/ 255\\.0, green: ([0-9.]+) \\/ 255\\.0, blue: ([0-9.]+) \\/ 255\\.0\\)`));
  assert.ok(match, `missing ${name} token`);
  return {
    red: Number(match[1]),
    green: Number(match[2]),
    blue: Number(match[3]),
  };
}

for (const name of ["bgVoid", "bgSurface", "aubergineBlack", "lunarBlueDeep", "nebulaViolet", "planetEdge"]) {
  const { red, blue } = extractRgb(name);
  assert.ok(blue - red <= 16, `${name} must stay near black or muted aubergine, not saturated blue-purple`);
}

const glassFill = extractRgb("glassFill");
assert.ok(glassFill.blue - glassFill.red <= 8, "glassFill must use warm silver instead of cool blue-white");

function extractFunctionSlice(source, name, nextName) {
  const start = source.indexOf(`private var ${name}`);
  assert.ok(start >= 0, `missing ${name}`);
  const end = nextName ? source.indexOf(`private func ${nextName}`, start) : -1;
  assert.ok(end > start, `missing ${nextName} after ${name}`);
  return source.slice(start, end);
}

const accountDock = extractFunctionSlice(account, "accountBottomActionDock", "accountDockIconButton");

assert.doesNotMatch(
  account,
  /feedbackComposer[\s\S]*?BenyuanColor\.lunarBlueDeep\.opacity\(0\.98\)/,
  "feedback composer must not reintroduce a blue-purple panel into the native account surface"
);

assert.doesNotMatch(
  accountDock,
  /\.foregroundStyle\(BenyuanColor\.primaryCTAText\)[\s\S]*?\.background\(Capsule\(\)\.fill\(BenyuanColor\.textPrimary\)\)/,
  "native account bottom dock must not render white CTA text on a white capsule"
);

assert.match(
  account,
  /foregroundStyle\(model\.feedbackKind == kind \? Color\.black : BenyuanColor\.textSecondary\)/,
  "selected feedback kind chip must render pure black text on its white selected capsule"
);

assert.match(
  account,
  /fill\(model\.feedbackKind == kind \? Color\.white : BenyuanColor\.bgSurface\.opacity\(0\.86\)\)/,
  "selected feedback kind chip must use a pure white capsule, not muted gold or off-white"
);

assert.match(
  account,
  /if model\.feedbackKind == kind \{[\s\S]*?Image\(systemName: "checkmark"\)/,
  "selected feedback kind chip must include an explicit checkmark indicator"
);

console.log("ios-color-language-contract:ok");
