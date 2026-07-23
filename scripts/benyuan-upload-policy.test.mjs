import assert from "node:assert/strict";
import test from "node:test";

import {
  BENYUAN_UPLOAD_MAX_COHORT_BYTES,
  BENYUAN_UPLOAD_MAX_FILE_BYTES,
  BENYUAN_UPLOAD_MAX_USER_BYTES,
  validateBenyuanUploadCapacity,
  validateBenyuanUploadFileSignatures,
  validateBenyuanUploadFiles,
} from "../src/lib/benyuan-upload-policy.ts";

function signature(type) {
  switch (type) {
    case "image/jpeg": return [0xff, 0xd8, 0xff, 0xe0];
    case "image/png": return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    case "image/webp": return [...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")];
    case "image/heic":
    case "image/heif":
      return [0, 0, 0, 24, ...Buffer.from("ftyp"), ...Buffer.from("heic"), 0, 0, 0, 0, ...Buffer.from("mif1")];
    default: return [];
  }
}

function file(size, type = "image/jpeg", name = "fixture.jpg") {
  const bytes = new Uint8Array(size);
  bytes.set(signature(type).slice(0, size));
  return new File([bytes], name, { type });
}

test("upload policy accepts up to three supported images", () => {
  assert.equal(validateBenyuanUploadFiles([file(32), file(64, "image/png"), file(96, "image/heic")]), null);
});

test("upload policy rejects too many files", () => {
  assert.deepEqual(validateBenyuanUploadFiles([file(1), file(1), file(1), file(1)]), {
    error: "too_many_files",
    status: 413,
  });
});

test("upload policy rejects unsupported MIME types", () => {
  assert.deepEqual(validateBenyuanUploadFiles([file(32, "application/pdf", "fixture.pdf")]), {
    error: "unsupported_file_type",
    status: 415,
  });
});

test("upload policy rejects an oversized file", () => {
  assert.deepEqual(validateBenyuanUploadFiles([file(BENYUAN_UPLOAD_MAX_FILE_BYTES + 1)]), {
    error: "file_too_large",
    status: 413,
  });
});

test("upload policy validates supported image signatures", async () => {
  assert.equal(await validateBenyuanUploadFileSignatures([
    file(32, "image/jpeg"),
    file(32, "image/png"),
    file(32, "image/webp"),
    file(32, "image/heic"),
    file(32, "image/heif"),
  ]), null);
});

test("upload policy rejects HTML disguised as an image", async () => {
  const disguised = new File(["<html>private payload</html>"], "fixture.png", { type: "image/png" });
  assert.deepEqual(await validateBenyuanUploadFileSignatures([disguised]), {
    error: "invalid_file_signature",
    status: 415,
  });
});

test("upload capacity protects user and cohort storage budgets", () => {
  assert.deepEqual(validateBenyuanUploadCapacity({
    ownerBytes: BENYUAN_UPLOAD_MAX_USER_BYTES,
    cohortBytes: BENYUAN_UPLOAD_MAX_USER_BYTES,
    incomingBytes: 1,
  }), {
    error: "user_upload_quota_exceeded",
    status: 429,
  });
  assert.deepEqual(validateBenyuanUploadCapacity({
    ownerBytes: 0,
    cohortBytes: BENYUAN_UPLOAD_MAX_COHORT_BYTES,
    incomingBytes: 1,
  }), {
    error: "upload_capacity_exceeded",
    status: 507,
  });
});
