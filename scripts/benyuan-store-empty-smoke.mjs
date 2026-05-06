import { copyFile, mkdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const dataDir = path.join(root, "data");
const storePath = path.join(dataDir, "benyuan-store.json");
const backupPath = path.join(os.tmpdir(), `benyuan-store-${process.pid}.json`);

let hadStore = false;

try {
  await mkdir(dataDir, { recursive: true });
  try {
    await stat(storePath);
    hadStore = true;
    await copyFile(storePath, backupPath);
  } catch {
    hadStore = false;
  }

  await writeFile(storePath, "", "utf8");
  const result = spawnSync("npm", ["run", "build"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`empty-store build smoke failed with status ${result.status}`);
  }
  console.log("store-empty-smoke:ok build tolerated empty store file");
} finally {
  if (hadStore) {
    await copyFile(backupPath, storePath);
    await rm(backupPath, { force: true });
  } else {
    await rm(storePath, { force: true });
  }
}
