import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const auth = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeAuthView.swift", "utf8");
const account = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeAccountView.swift", "utf8");
const collect = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeCollectView.swift", "utf8");
const processing = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeProcessingView.swift", "utf8");
const theater = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeTheaterView.swift", "utf8");
const constellation = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeConstellationView.swift", "utf8");
const primitives = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeDesignPrimitives.swift", "utf8");

assert.match(
  auth,
  /Text\("进入你的私人月相档案"\)[\s\S]*?\.font\(\.system\(size:\s*34,\s*weight:\s*\.semibold\)\)/,
  "native auth hero title should use a quieter 34pt semibold setting, not a heavy poster headline"
);
assert.match(
  auth,
  /Text\("用 Apple 继续"\)[\s\S]*?\.font\(\.system\(size:\s*16,\s*weight:\s*\.semibold\)\)/,
  "native Apple login label should avoid extra-black typography inside the capsule"
);
assert.doesNotMatch(
  auth,
  /Text\("先以访客进入"\)/,
  "native auth view should no longer expose guest exploration before login"
);

assert.match(
  account,
  /Text\(model\.session\.user\?\.displayName \?\? "我的本源档案"\)[\s\S]*?\.font\(\.system\(size:\s*30,\s*weight:\s*\.semibold\)\)/,
  "native account identity title should stay large but not return to oversized poster scale"
);
assert.match(
  account,
  /Text\("档案设置"\)[\s\S]*?\.font\(\.system\(size:\s*15,\s*weight:\s*\.semibold\)\)/,
  "native account binding entry should stay compact on the main account page"
);
assert.match(
  account,
  /Text\("探索历史"\)[\s\S]*?\.font\(\.system\(size:\s*20,\s*weight:\s*\.semibold\)\)/,
  "native account history title should match the calmer app-section scale"
);
assert.match(
  account,
  /private func bindingRow[\s\S]*?Text\(title\)[\s\S]*?\.font\(\.system\(size:\s*14,\s*weight:\s*\.semibold\)\)/,
  "native account binding rows should live in a compact secondary sheet, not oversized main-page cards"
);
assert.match(
  account,
  /Text\(item\.titleForNativeDisplay\)[\s\S]*?\.font\(\.system\(size:\s*16,\s*weight:\s*\.semibold\)\)/,
  "native account history cards should keep a readable archive title scale"
);
assert.match(
  account,
  /Text\("问题收集"\)[\s\S]*?\.font\(\.system\(size:\s*22,\s*weight:\s*\.semibold\)\)/,
  "feedback composer title should feel like an app sheet, not a poster block"
);
assert.doesNotMatch(
  account,
  /\.safeAreaInset\(edge:\s*\.bottom/,
  "native account bottom dock should be a layout sibling, not an overlay that can cover account binding or history content"
);
assert.match(
  account,
  /GeometryReader \{ geometry in[\s\S]*?VStack\(spacing:\s*0\) \{[\s\S]*?ScrollView\(showsIndicators:\s*false\)[\s\S]*?\.padding\(\.bottom,\s*BenyuanSpacing\.x6\)[\s\S]*?accountBottomActionDock[\s\S]*?\.frame\(height:\s*accountDockHeight \+ geometry\.safeAreaInsets\.bottom\)/,
  "native account scroll content should reserve visible layout space above the fixed bottom dock"
);
assert.match(
  account,
  /TextEditor\(text:\s*\$model\.feedbackDraft\)[\s\S]*?\.font\(\.system\(size:\s*15,\s*weight:\s*\.regular\)\)/,
  "feedback editor body copy should use regular reading weight"
);
assert.match(
  account,
  /Text\(model\.isFeedbackSubmitting \? "提交中" : "提交问题"\)[\s\S]*?\.font\(\.system\(size:\s*15,\s*weight:\s*\.semibold\)\)/,
  "feedback submit button should keep a calmer semibold CTA"
);

assert.match(
  collect,
  /Text\(question\.prompt\)[\s\S]*?\.font\(\.system\(size:\s*questionTitleSize\(question\.prompt\),\s*weight:\s*\.semibold\)\)/,
  "native collect question titles should use semibold reading hierarchy instead of black poster weight"
);
assert.match(
  collect,
  /Text\(question\.prompt\)[\s\S]*?\.font\(\.system\(size:\s*uploadQuestionTitleSize\(question\.prompt\),\s*weight:\s*\.semibold\)\)/,
  "native upload question titles should keep the same calmer title hierarchy"
);
assert.match(
  collect,
  /private func questionTitleSize\(_ value: String\) -> CGFloat \{[\s\S]*?if value\.count > 30 \{ return 26 \}[\s\S]*?return 30[\s\S]*?\}/,
  "native collect question titles should cap at 30pt after visual screenshot review"
);
assert.match(
  collect,
  /private func uploadQuestionTitleSize\(_ value: String\) -> CGFloat \{[\s\S]*?if value\.count > 30 \{ return 23 \}[\s\S]*?return 26[\s\S]*?\}/,
  "native upload question titles should use a compact cap after first-screen screenshot review"
);
assert.match(
  collect,
  /\.frame\(height:\s*132\)[\s\S]*?\.clipShape\(RoundedRectangle\(cornerRadius:\s*30,\s*style:\s*\.continuous\)\)/,
  "native upload celestial art panel should stay compact enough to keep selected thumbnails above the bottom dock"
);
assert.match(
  collect,
  /\.frame\(width:\s*98,\s*height:\s*102\)/,
  "native upload thumbnails should stay compact enough for the first-screen manage strip"
);
assert.match(
  collect,
  /ScrollView\(showsIndicators:\s*false\)[\s\S]*?\.safeAreaInset\(edge:\s*\.bottom,\s*spacing:\s*0\)[\s\S]*?bottomBar/,
  "native collect bottom dock should be installed as a safe-area inset so the final upload thumbnail row remains readable"
);

assert.match(
  processing,
  /Text\(model\.processingTitle\)[\s\S]*?\.font\(\.system\(size:\s*34,\s*weight:\s*\.semibold\)\)/,
  "native processing title should feel like a calm state label, not a 42pt poster headline"
);
assert.match(
  processing,
  /Text\(model\.processingDetail\)[\s\S]*?\.font\(\.system\(size:\s*15,\s*weight:\s*\.regular\)\)/,
  "native processing detail should use regular reading type under the celestial body"
);

assert.match(
  theater,
  /act1ReadingScroll\([\s\S]*?ForEach\(Array\(readingParagraphs\(text\)\.enumerated\(\)\),\s*id:\s*\\\.offset\)[\s\S]*?Text\(paragraph\)[\s\S]*?\.font\(\.system\(size:\s*theaterAct1ReadingSize\(text\),\s*weight:\s*\.semibold\)\)/,
  "native theater act1 should render long copy as paragraph-separated semibold reading text"
);
assert.match(
  theater,
  /private func readingParagraphs\(_ text:\s*String\) -> \[String\][\s\S]*?components\(separatedBy:\s*"\\n\\n"\)/,
  "native theater act1 should split generated long copy into readable paragraphs"
);
assert.match(
  theater,
  /theaterLensCard\([\s\S]*?title:\s*displayText\(choice\.scene[\s\S]*?Text\(title\)[\s\S]*?\.font\(\.system\(size:\s*theaterTitleSize\(title\),\s*weight:\s*\.semibold\)\)/,
  "native theater act2 scene title should use sanitized semibold text inside the lens card, not black"
);
assert.doesNotMatch(
  theater,
  /title:\s*displayText\(question\.question|currentMirrorQuestion|chooseAct3/,
  "native theater must not keep the removed Act3 follow-up question surface"
);
assert.match(
  theater,
  /private func theaterTitleSize\(_ value: String\) -> CGFloat \{[\s\S]*?if value\.count > 92 \{ return 19 \}[\s\S]*?if value\.count > 64 \{ return 22 \}[\s\S]*?if value\.count > 36 \{ return 25 \}[\s\S]*?return 29[\s\S]*?\}/,
  "native theater title sizing should leave more breathing room after visual screenshot review"
);

assert.match(
  constellation,
  /Text\("是你此刻的精神坐标。"\)[\s\S]*?\.font\(\.system\(size:\s*31,\s*weight:\s*\.semibold\)\)/,
  "constellation closing line should end quietly enough to leave room for the fixed action dock"
);
assert.match(
  constellation,
  /Text\(title\)[\s\S]*?\.font\(\.system\(size:\s*14,\s*weight:\s*\.semibold\)\)[\s\S]*?\.minimumScaleFactor\(0\.78\)/,
  "constellation bottom dock buttons should use restrained type and keep long labels stable"
);
assert.match(
  constellation,
  /firstViewportReserve:\s*96/,
  "constellation first viewport should leave a clearer visual gap before seven-dimensional orbit content appears under the bottom dock"
);
assert.match(
  constellation,
  /pathExplanation\(/,
  "constellation path section must explain why the path exists before showing a small action"
);
assert.match(
  constellation,
  /resonanceItem\(/,
  "constellation resonance section must render individual works with reasons, not only a title list"
);
assert.match(
  constellation,
  /\.reason/,
  "constellation resonance section must surface book, film, and music reasons from the generated report"
);
for (const label of ["补足什么", "照见什么", "适合在什么时候靠近", "这条路径的作用"]) {
  assert.doesNotMatch(constellation, new RegExp(label), `constellation should not expose stiff resonance label ${label}`);
}
for (const label of ["为什么做", "会带来什么"]) {
  assert.match(constellation, new RegExp(label), `constellation path should expose action purpose and expected effect via ${label}`);
}

assert.match(
  primitives,
  /struct BenyuanNativeTopBar[\s\S]*?Text\("本源"\)[\s\S]*?\.font\(\.system\(size:\s*18,\s*weight:\s*\.bold\)\)/,
  "native top bar brand should stay crisp without returning to black-weight chrome"
);

console.log("ios-typography-layout-contract:ok");
