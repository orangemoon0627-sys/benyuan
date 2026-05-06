#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const outputDir = path.join(root, "output");
const archivePath = process.env.BENYUAN_IOS_ARCHIVE_PATH ?? path.join(outputDir, "BenyuanOriginShell.xcarchive");
const method = process.env.BENYUAN_IOS_EXPORT_METHOD ?? "debugging";
const teamId = process.env.BENYUAN_IOS_DEVELOPMENT_TEAM ?? "CY3DD3J5CU";
const exportDir =
  process.env.BENYUAN_IOS_EXPORT_PATH ??
  path.join(outputDir, method === "app-store-connect" ? "testflight-export" : "development-export");
const exportOptionsPath = path.join(outputDir, `ExportOptions-${method}.plist`);
const summaryPath = path.join(outputDir, "benyuan-ios-shell-export.json");

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function plistEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function exportOptionsPlist() {
  const appStoreKeys =
    method === "app-store-connect"
      ? `
  <key>uploadSymbols</key>
  <true/>
  <key>manageAppVersionAndBuildNumber</key>
  <false/>`
      : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>${plistEscape(method)}</string>
  <key>destination</key>
  <string>export</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>teamID</key>
  <string>${plistEscape(teamId)}</string>
  <key>stripSwiftSymbols</key>
  <true/>${appStoreKeys}
</dict>
</plist>
`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await mkdir(exportDir, { recursive: true });
  await writeFile(exportOptionsPath, exportOptionsPlist());

  run("xcodebuild", [
    "-exportArchive",
    "-archivePath",
    archivePath,
    "-exportPath",
    exportDir,
    "-exportOptionsPlist",
    exportOptionsPath,
    "-allowProvisioningUpdates",
  ]);

  const summary = {
    generatedAt: new Date().toISOString(),
    archivePath,
    exportDir,
    exportOptionsPath,
    method,
    teamId,
    ipaPath: path.join(exportDir, "BenyuanOriginShell.ipa"),
  };

  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  const stdout = typeof error?.stdout === "string" ? error.stdout.trim() : "";
  const stderr = typeof error?.stderr === "string" ? error.stderr.trim() : "";
  const message = [error instanceof Error ? error.message : String(error), stdout, stderr]
    .filter(Boolean)
    .join("\n\n");
  console.error(message);
  process.exit(1);
});
