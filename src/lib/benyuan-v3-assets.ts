import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createBenyuanV3Id, getUploadedAsset, getUploadedAssetForOwner, resolveBenyuanDataScope, saveUploadedAsset } from "@/lib/benyuan-v3-store";
import { getBenyuanV3UploadsDir } from "@/lib/benyuan-persistence";
import type { BenyuanStoredAsset, BenyuanUploadedAssetRef } from "@/lib/benyuan-v3-types";

function sanitizeName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "upload";
}

function extensionFromName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  return ext || ".bin";
}

function hashBuffer(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function ensureStoredAssetHash(stored: BenyuanStoredAsset, buffer?: Buffer) {
  if (stored.sha256) return stored.sha256;
  const loadedBuffer = buffer ?? await readFile(stored.stored_path);
  const sha256 = hashBuffer(loadedBuffer);
  await saveUploadedAsset({ ...stored, sha256 });
  return sha256;
}

export async function persistUploadedAsset(params: {
  ownerUserId: string;
  questionId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  uploadOrigin?: string;
}) {
  const uploadsDir = getBenyuanV3UploadsDir();
  await mkdir(uploadsDir, { recursive: true });

  const assetId = createBenyuanV3Id("upload");
  const extension = extensionFromName(params.fileName);
  const safeBaseName = sanitizeName(path.basename(params.fileName, extension));
  const storedFileName = `${assetId}-${safeBaseName}${extension}`;
  const absolutePath = path.join(uploadsDir, storedFileName);
  const dataScope = resolveBenyuanDataScope();

  await writeFile(absolutePath, params.buffer);

  const stored: BenyuanStoredAsset = {
    asset_id: assetId,
    question_id: params.questionId,
    owner_user_id: params.ownerUserId,
    data_cohort: dataScope.data_cohort,
    data_environment: dataScope.data_environment,
    name: params.fileName,
    size: params.buffer.byteLength,
    mime_type: params.mimeType || "application/octet-stream",
    uploaded_at: new Date().toISOString(),
    sha256: createHash("sha256").update(params.buffer).digest("hex"),
    stored_path: absolutePath,
    upload_origin: params.uploadOrigin,
  };

  await saveUploadedAsset(stored);

  const ref: BenyuanUploadedAssetRef = {
    asset_id: stored.asset_id,
    question_id: stored.question_id,
    owner_user_id: stored.owner_user_id,
    data_cohort: stored.data_cohort,
    data_environment: stored.data_environment,
    name: stored.name,
    size: stored.size,
    mime_type: stored.mime_type,
    uploaded_at: stored.uploaded_at,
    sha256: stored.sha256,
    upload_origin: stored.upload_origin,
  };

  return ref;
}

export async function readUploadedAssetBuffer(assetId: string) {
  const stored = await getUploadedAsset(assetId);
  if (!stored) return null;
  const buffer = await readFile(stored.stored_path);
  const sha256 = await ensureStoredAssetHash(stored, buffer);
  return { stored: { ...stored, sha256 }, buffer };
}

export async function readUploadedAssetBufferForOwner(assetId: string, ownerUserId: string) {
  const stored = await getUploadedAssetForOwner(assetId, ownerUserId);
  if (!stored) return null;
  const buffer = await readFile(stored.stored_path);
  const sha256 = await ensureStoredAssetHash(stored, buffer);
  return { stored: { ...stored, sha256 }, buffer };
}

export async function readUploadedAssetDataUrl(assetId: string) {
  const loaded = await readUploadedAssetBuffer(assetId);
  if (!loaded) return null;
  return {
    stored: loaded.stored,
    dataUrl: `data:${loaded.stored.mime_type};base64,${loaded.buffer.toString("base64")}`,
  };
}
