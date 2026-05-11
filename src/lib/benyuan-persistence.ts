import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import type { BenyuanV3Store } from "@/lib/benyuan-v3-types";

export type BenyuanPersistenceBackend = "json-file" | "postgres";
export type BenyuanObjectStorageBackend = "local-fs" | "oss" | "s3";

function configuredDataRoot() {
  return process.env.BENYUAN_DATA_ROOT?.trim();
}

function normalizePersistenceBackend(value: string | undefined): BenyuanPersistenceBackend {
  if (value === "postgres") return value;
  return "json-file";
}

function normalizeObjectStorageBackend(value: string | undefined): BenyuanObjectStorageBackend {
  if (value === "oss" || value === "s3") return value;
  return "local-fs";
}

export function readBenyuanPersistenceReadiness() {
  const recordBackend = normalizePersistenceBackend(process.env.BENYUAN_PERSISTENCE_BACKEND?.trim());
  const assetBackend = normalizeObjectStorageBackend(process.env.BENYUAN_OBJECT_STORAGE_BACKEND?.trim());
  const databaseConfigured = Boolean(process.env.BENYUAN_DATABASE_URL?.trim());
  const objectStorageBucketConfigured = Boolean(process.env.BENYUAN_OBJECT_STORAGE_BUCKET?.trim());
  const recordStoreProductionReady = recordBackend === "postgres" && databaseConfigured;
  const assetStoreProductionReady = assetBackend !== "local-fs" && objectStorageBucketConfigured;
  const blockers: string[] = [];

  if (!recordStoreProductionReady) {
    blockers.push(recordBackend === "postgres" ? "missing_database_url" : "record_store_json_file");
  }
  if (!assetStoreProductionReady) {
    blockers.push(assetBackend === "local-fs" ? "asset_store_local_fs" : "missing_object_storage_bucket");
  }

  return {
    recordBackend,
    assetBackend,
    databaseConfigured,
    objectStorageBucketConfigured,
    recordStoreProductionReady,
    assetStoreProductionReady,
    productionReady: recordStoreProductionReady && assetStoreProductionReady,
    backupRequiredBeforeMigration: recordBackend === "json-file" || assetBackend === "local-fs",
    blockers,
  };
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
    feedbackRecords: Object.keys(store.feedback_records).length,
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
  const readiness = readBenyuanPersistenceReadiness();

  return {
    dataRoot,
    storePath,
    uploadsDir,
    dataRootExists: await pathExists(dataRoot),
    storeExists: await pathExists(storePath),
    uploadsDirExists: await pathExists(uploadsDir),
    persistentDataRoot: Boolean(configuredDataRoot()) || dataRoot.endsWith(path.join("shared", "data")),
    readiness,
    counts: store ? summarizeBenyuanStoreCounts(store) : null,
  };
}
