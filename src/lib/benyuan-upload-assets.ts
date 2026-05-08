import type { BenyuanUploadedAssetRef } from "@/lib/benyuan-v3-types";

export function uploadedAssetsFromAnswer(value: unknown): BenyuanUploadedAssetRef[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is BenyuanUploadedAssetRef =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as BenyuanUploadedAssetRef).asset_id === "string" &&
      (item as BenyuanUploadedAssetRef).asset_id.length > 0,
  );
}

export function mergeUploadedAssets(currentValue: unknown, incomingValue: unknown, maxCount: number): BenyuanUploadedAssetRef[] {
  const max = Math.max(0, maxCount);
  const merged: BenyuanUploadedAssetRef[] = [];
  const seen = new Set<string>();

  for (const asset of [...uploadedAssetsFromAnswer(currentValue), ...uploadedAssetsFromAnswer(incomingValue)]) {
    if (seen.has(asset.asset_id)) continue;
    seen.add(asset.asset_id);
    merged.push(asset);
    if (merged.length >= max) break;
  }

  return merged;
}

export function removeUploadedAsset(currentValue: unknown, assetId: string): BenyuanUploadedAssetRef[] {
  return uploadedAssetsFromAnswer(currentValue).filter((asset) => asset.asset_id !== assetId);
}

export function remainingUploadSlots(currentValue: unknown, maxCount: number): number {
  return Math.max(0, maxCount - uploadedAssetsFromAnswer(currentValue).length);
}
