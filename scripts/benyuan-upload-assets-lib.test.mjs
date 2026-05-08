import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeUploadedAssets,
  removeUploadedAsset,
  remainingUploadSlots,
  uploadedAssetsFromAnswer,
} from "../src/lib/benyuan-upload-assets.ts";

function asset(asset_id, question_id = "A2_music_analysis") {
  return {
    asset_id,
    question_id,
    name: `${asset_id}.jpg`,
    size: 1024,
    mime_type: "image/jpeg",
    uploaded_at: "2026-05-07T00:00:00.000Z",
  };
}

test("uploadedAssetsFromAnswer keeps only valid uploaded asset refs", () => {
  assert.deepEqual(uploadedAssetsFromAnswer([asset("one"), null, { asset_id: "" }, { asset_id: "two" }]).map((item) => item.asset_id), ["one", "two"]);
});

test("mergeUploadedAssets appends incoming assets without replacing existing picks", () => {
  const next = mergeUploadedAssets([asset("one"), asset("two")], [asset("three")], 4);

  assert.deepEqual(next.map((item) => item.asset_id), ["one", "two", "three"]);
});

test("mergeUploadedAssets dedupes and caps assets at the upload max", () => {
  const next = mergeUploadedAssets([asset("one"), asset("two")], [asset("two"), asset("three"), asset("four")], 3);

  assert.deepEqual(next.map((item) => item.asset_id), ["one", "two", "three"]);
  assert.equal(remainingUploadSlots(next, 3), 0);
});

test("removeUploadedAsset removes exactly one picked asset by asset_id", () => {
  const next = removeUploadedAsset([asset("one"), asset("two"), asset("three")], "two");

  assert.deepEqual(next.map((item) => item.asset_id), ["one", "three"]);
});
