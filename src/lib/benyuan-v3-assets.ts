import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createBenyuanV3Id, getUploadedAsset, saveUploadedAsset } from "@/lib/benyuan-v3-store";
import type { BenyuanStoredAsset, BenyuanUploadedAssetRef } from "@/lib/benyuan-v3-types";

const UPLOADS_DIR = path.join(process.cwd(), "data", "benyuan-v3-uploads");

function sanitizeName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "upload";
}

function extensionFromName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  return ext || ".bin";
}

export async function persistUploadedAsset(params: {
  questionId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  uploadOrigin?: string;
}) {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const assetId = createBenyuanV3Id("upload");
  const extension = extensionFromName(params.fileName);
  const safeBaseName = sanitizeName(path.basename(params.fileName, extension));
  const storedFileName = `${assetId}-${safeBaseName}${extension}`;
  const absolutePath = path.join(UPLOADS_DIR, storedFileName);

  await writeFile(absolutePath, params.buffer);

  const stored: BenyuanStoredAsset = {
    asset_id: assetId,
    question_id: params.questionId,
    name: params.fileName,
    size: params.buffer.byteLength,
    mime_type: params.mimeType || "application/octet-stream",
    uploaded_at: new Date().toISOString(),
    stored_path: absolutePath,
    upload_origin: params.uploadOrigin,
  };

  await saveUploadedAsset(stored);

  const ref: BenyuanUploadedAssetRef = {
    asset_id: stored.asset_id,
    question_id: stored.question_id,
    name: stored.name,
    size: stored.size,
    mime_type: stored.mime_type,
    uploaded_at: stored.uploaded_at,
    upload_origin: stored.upload_origin,
  };

  return ref;
}

export async function readUploadedAssetBuffer(assetId: string) {
  const stored = await getUploadedAsset(assetId);
  if (!stored) return null;
  const buffer = await readFile(stored.stored_path);
  return { stored, buffer };
}

export async function readUploadedAssetDataUrl(assetId: string) {
  const loaded = await readUploadedAssetBuffer(assetId);
  if (!loaded) return null;
  return {
    stored: loaded.stored,
    dataUrl: `data:${loaded.stored.mime_type};base64,${loaded.buffer.toString("base64")}`,
  };
}
