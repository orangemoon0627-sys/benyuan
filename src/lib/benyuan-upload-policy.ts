export const BENYUAN_UPLOAD_MAX_FILES = 3;
export const BENYUAN_UPLOAD_MAX_FILE_BYTES = 8 * 1024 * 1024;
export const BENYUAN_UPLOAD_MAX_TOTAL_BYTES = 20 * 1024 * 1024;
export const BENYUAN_UPLOAD_MAX_REQUEST_BYTES = 21 * 1024 * 1024;
export const BENYUAN_UPLOAD_MAX_USER_BYTES = 256 * 1024 * 1024;
export const BENYUAN_UPLOAD_MAX_COHORT_BYTES = 5 * 1024 * 1024 * 1024;

export const BENYUAN_UPLOAD_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type BenyuanUploadPolicyError = {
  error:
    | "too_many_files"
    | "file_too_large"
    | "upload_too_large"
    | "unsupported_file_type"
    | "invalid_file_signature"
    | "user_upload_quota_exceeded"
    | "upload_capacity_exceeded";
  status: 413 | 415 | 429 | 507;
};

export type BenyuanUploadCapacityPolicyError = {
  error: "user_upload_quota_exceeded" | "upload_capacity_exceeded";
  status: 429 | 507;
};

export function validateBenyuanUploadFiles(files: File[]): BenyuanUploadPolicyError | null {
  if (files.length > BENYUAN_UPLOAD_MAX_FILES) {
    return { error: "too_many_files", status: 413 };
  }

  let totalBytes = 0;
  for (const file of files) {
    if (!BENYUAN_UPLOAD_ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return { error: "unsupported_file_type", status: 415 };
    }
    if (file.size > BENYUAN_UPLOAD_MAX_FILE_BYTES) {
      return { error: "file_too_large", status: 413 };
    }
    totalBytes += file.size;
    if (totalBytes > BENYUAN_UPLOAD_MAX_TOTAL_BYTES) {
      return { error: "upload_too_large", status: 413 };
    }
  }

  return null;
}

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function hasHeifBrand(bytes: Uint8Array) {
  if (bytes.length < 12 || ascii(bytes, 4, 4) !== "ftyp") return false;
  const allowedBrands = new Set(["heic", "heix", "hevc", "hevx", "heis", "heim", "hevm", "hevs", "mif1", "msf1"]);
  if (allowedBrands.has(ascii(bytes, 8, 4))) return true;
  for (let offset = 16; offset + 4 <= bytes.length; offset += 4) {
    if (allowedBrands.has(ascii(bytes, offset, 4))) return true;
  }
  return false;
}

function hasExpectedSignature(mimeType: string, bytes: Uint8Array) {
  switch (mimeType.toLowerCase()) {
    case "image/jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP";
    case "image/heic":
    case "image/heif":
      return hasHeifBrand(bytes);
    default:
      return false;
  }
}

export async function validateBenyuanUploadFileSignatures(files: File[]): Promise<BenyuanUploadPolicyError | null> {
  for (const file of files) {
    const header = new Uint8Array(await file.slice(0, 64).arrayBuffer());
    if (!hasExpectedSignature(file.type, header)) {
      return { error: "invalid_file_signature", status: 415 };
    }
  }
  return null;
}

export function validateBenyuanUploadCapacity(input: {
  ownerBytes: number;
  cohortBytes: number;
  incomingBytes: number;
}): BenyuanUploadCapacityPolicyError | null {
  if (input.ownerBytes + input.incomingBytes > BENYUAN_UPLOAD_MAX_USER_BYTES) {
    return { error: "user_upload_quota_exceeded", status: 429 };
  }
  if (input.cohortBytes + input.incomingBytes > BENYUAN_UPLOAD_MAX_COHORT_BYTES) {
    return { error: "upload_capacity_exceeded", status: 507 };
  }
  return null;
}
