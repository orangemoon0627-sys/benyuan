import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import type { BenyuanV3Store } from "@/lib/benyuan-v3-types";

function configuredDataRoot() {
  return process.env.BENYUAN_DATA_ROOT?.trim();
}

export function getBenyuanDataRoot() {
  return path.resolve(configuredDataRoot() || path.join(process.cwd(), "data"));
}

export function getBenyuanV3StorePath() {
  const configured = process.env.BENYUAN_V3_STORE_PATH?.trim();
  return configured ? path.resolve(configured) : path.join(getBenyuanDataRoot(), "benyuan-v3-store.json");
}

export function getBenyuanV3UploadsDir() {
  const configured = process.env.BENYUAN_V3_UPLOADS_DIR?.trim();
  return configured ? path.resolve(configured) : path.join(getBenyuanDataRoot(), "benyuan-v3-uploads");
}

export async function ensureBenyuanDataDirs() {
  await mkdir(getBenyuanDataRoot(), { recursive: true });
  await mkdir(getBenyuanV3UploadsDir(), { recursive: true });
}

export function summarizeBenyuanStoreCounts(store: BenyuanV3Store) {
  return {
    users: Object.keys(store.users).length,
    authSessions: Object.keys(store.auth_sessions).length,
    phoneOtps: Object.keys(store.phone_otps).length,
    providerIndexes: Object.keys(store.auth_provider_index).length,
    uploadedAssets: Object.keys(store.uploaded_assets).length,
    part1Records: Object.keys(store.part1_records).length,
    theaterScripts: Object.keys(store.theater_scripts).length,
    part2Records: Object.keys(store.part2_records).length,
    constellations: Object.keys(store.constellations).length,
  };
}

async function pathExists(targetPath: string) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function getBenyuanPersistenceHealth(store?: BenyuanV3Store) {
  const dataRoot = getBenyuanDataRoot();
  const storePath = getBenyuanV3StorePath();
  const uploadsDir = getBenyuanV3UploadsDir();

  return {
    dataRoot,
    storePath,
    uploadsDir,
    dataRootExists: await pathExists(dataRoot),
    storeExists: await pathExists(storePath),
    uploadsDirExists: await pathExists(uploadsDir),
    persistentDataRoot: Boolean(configuredDataRoot()) || dataRoot.endsWith(path.join("shared", "data")),
    counts: store ? summarizeBenyuanStoreCounts(store) : null,
  };
}
