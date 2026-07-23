import { createHash } from "node:crypto";
import { mkdir, readFile, statfs, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  BenyuanUploadCapacityError,
  createBenyuanV3Id,
  getUploadedAsset,
  getUploadedAssetForOwner,
  resolveBenyuanDataScope,
  saveUploadedAsset,
  saveUploadedAssetsWithCapacity,
} from "@/lib/benyuan-v3-store";
import { getBenyuanV3UploadsDir } from "@/lib/benyuan-persistence";
import type { BenyuanStoredAsset, BenyuanUploadedAssetRef } from "@/lib/benyuan-v3-types";

function sanitizeName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "upload";
}

function extensionFromMimeType(mimeType: string) {
  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
  };
  return extensions[mimeType.toLowerCase()] ?? ".bin";
}

function hashBuffer(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export class BenyuanAssetStorageError extends Error {
  code: "upload_storage_unavailable" | "user_upload_quota_exceeded" | "upload_capacity_exceeded";
  status: number;

  constructor(code: "upload_storage_unavailable" | "user_upload_quota_exceeded" | "upload_capacity_exceeded", status = 507) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

let uploadWriteQueue: Promise<void> = Promise.resolve();

async function withUploadWrite<T>(operation: () => Promise<T>) {
  let result: T;
  const pending = uploadWriteQueue.then(async () => {
    result = await operation();
  });
  uploadWriteQueue = pending.catch(() => undefined);
  await pending;
  return result!;
}

export async function ensureBenyuanUploadStorageCapacity(incomingBytes: number) {
  const uploadsDir = getBenyuanV3UploadsDir();
  await mkdir(uploadsDir, { recursive: true });
  const filesystem = await statfs(uploadsDir, { bigint: true });
  const availableBytes = filesystem.bsize * filesystem.bavail;
  const configuredReserve = Number(process.env.BENYUAN_UPLOAD_MIN_FREE_BYTES);
  const reserveBytes = Number.isSafeInteger(configuredReserve) && configuredReserve > 0
    ? BigInt(configuredReserve)
    : BigInt(2 * 1024 * 1024 * 1024);

  if (availableBytes - BigInt(incomingBytes) < reserveBytes) {
    throw new BenyuanAssetStorageError("upload_storage_unavailable");
  }
}

export async function ensureStoredAssetHash(stored: BenyuanStoredAsset, buffer?: Buffer) {
  if (stored.sha256) return stored.sha256;
  const loadedBuffer = buffer ?? await readFile(stored.stored_path);
  const sha256 = hashBuffer(loadedBuffer);
  await saveUploadedAsset({ ...stored, sha256 });
  return sha256;
}

type PersistUploadedAssetParams = {
  ownerUserId: string;
  questionId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  uploadOrigin?: string;
};

function uploadedAssetRef(stored: BenyuanStoredAsset): BenyuanUploadedAssetRef {
  return {
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
}

export async function persistUploadedAssets(paramsList: PersistUploadedAssetParams[]) {
  if (paramsList.length === 0) return [];

  return withUploadWrite(async () => {
    const uploadsDir = getBenyuanV3UploadsDir();
    const incomingBytes = paramsList.reduce((total, params) => total + params.buffer.byteLength, 0);
    await ensureBenyuanUploadStorageCapacity(incomingBytes);
    await mkdir(uploadsDir, { recursive: true });
    const dataScope = resolveBenyuanDataScope();
    const storedAssets = paramsList.map((params): BenyuanStoredAsset => {
      const assetId = createBenyuanV3Id("upload");
      const extension = extensionFromMimeType(params.mimeType);
      const safeBaseName = sanitizeName(path.basename(params.fileName, extension));
      return {
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
        stored_path: path.join(uploadsDir, `${assetId}-${safeBaseName}${extension}`),
        upload_origin: params.uploadOrigin,
      };
    });

    try {
      for (let index = 0; index < storedAssets.length; index += 1) {
        await writeFile(storedAssets[index].stored_path, paramsList[index].buffer);
      }
      const saved = await saveUploadedAssetsWithCapacity(storedAssets);
      return saved.map(uploadedAssetRef);
    } catch (error) {
      await Promise.all(storedAssets.map((asset) => unlink(asset.stored_path).catch(() => undefined)));
      if (error instanceof BenyuanUploadCapacityError) {
        throw new BenyuanAssetStorageError(error.code, error.status);
      }
      throw error;
    }
  });
}

export async function persistUploadedAsset(params: PersistUploadedAssetParams) {
  const [ref] = await persistUploadedAssets([params]);

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
