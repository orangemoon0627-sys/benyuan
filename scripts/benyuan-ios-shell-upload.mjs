#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const outputDir = path.join(root, "output");
const archivePath = process.env.BENYUAN_IOS_ARCHIVE_PATH ?? path.join(outputDir, "BenyuanOriginShell.xcarchive");
const uploadPath = process.env.BENYUAN_IOS_UPLOAD_PATH ?? path.join(outputDir, "testflight-upload");
const exportOptionsPath = path.join(outputDir, "ExportOptions-upload-app-store-connect.plist");
const summaryPath = path.join(outputDir, "benyuan-ios-shell-upload.json");
const teamId = process.env.BENYUAN_IOS_DEVELOPMENT_TEAM ?? "CY3DD3J5CU";

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

function uploadOptionsPlist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store-connect</string>
  <key>destination</key>
  <string>upload</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>teamID</key>
  <string>${plistEscape(teamId)}</string>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>uploadSymbols</key>
  <true/>
  <key>manageAppVersionAndBuildNumber</key>
  <false/>
</dict>
</plist>
`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await mkdir(uploadPath, { recursive: true });
  await writeFile(exportOptionsPath, uploadOptionsPlist());

  const startedAt = new Date().toISOString();
  const uploadOutput = run("xcodebuild", [
    "-exportArchive",
    "-archivePath",
    archivePath,
    "-exportPath",
    uploadPath,
    "-exportOptionsPlist",
    exportOptionsPath,
    "-allowProvisioningUpdates",
  ]);

  const summary = {
    generatedAt: new Date().toISOString(),
    startedAt,
    archivePath,
    uploadPath,
    exportOptionsPath,
    method: "app-store-connect",
    destination: "upload",
    teamId,
    uploadOutput,
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
