import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const rootView = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellRootView.swift", "utf8");
const primitives = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeDesignPrimitives.swift", "utf8");
const manifest = readFileSync("mobile/benyuan_origin_ios_shell/shell-manifest.json", "utf8");
const readme = readFileSync("mobile/benyuan_origin_ios_shell/README.md", "utf8");
const checklist = readFileSync("mobile/benyuan_origin_ios_shell/NativeCapabilitiesChecklist.md", "utf8");

assert.match(rootView, /BenyuanNativeCollectView/, "native root must include the SwiftUI collect flow");
assert.match(rootView, /BenyuanNativeTheaterView/, "native root must include the SwiftUI theater flow");
assert.match(rootView, /BenyuanNativeConstellationView/, "native root must include the SwiftUI constellation flow");
assert.doesNotMatch(rootView, /if showsWebFallback/, "root view must not choose WebView as a runtime branch for the user flow");
assert.doesNotMatch(rootView, /打开 Web 备用入口/, "release-facing native errors must not offer a Web fallback entry");
assert.doesNotMatch(rootView, /Button\(showsWebFallback \? "Native" : "Web"\)/, "root debug toggle must not expose a Web/Native switch in the main native surface");
assert.match(rootView, /#if DEBUG[\s\S]*?BenyuanWebContainerView/, "WebView fallback may only exist behind DEBUG-only tooling");

assert.doesNotMatch(primitives, /Button\("WEB"\)/, "shared native top bar must not expose a WEB button");
assert.match(manifest, /"shellStrategy":\s*"native-swiftui-first"/, "iOS manifest must declare native SwiftUI as the primary app strategy");
assert.doesNotMatch(manifest, /hybrid-webview-first|webview-shell/, "iOS manifest must not describe the app as webview-first");
assert.match(readme, /SwiftUI 原生主流程/, "README must describe the current app as SwiftUI native-first");
assert.doesNotMatch(readme, /Recommended first implementation[\s\S]*?WKWebView/, "README must not present WKWebView as the recommended primary implementation anymore");
assert.match(checklist, /SwiftUI native main flow/, "native capabilities checklist must track the native main flow");
assert.doesNotMatch(checklist, /- WebView shell/, "native capabilities checklist must not list WebView shell as a current primary phase");

console.log("ios-native-only-contract:ok");
