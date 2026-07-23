import { NextResponse } from "next/server";
import { BenyuanAuthError, checkUploadRateLimit, getRequiredBenyuanAuthSession } from "@/lib/benyuan-auth";
import { prewarmUploadedAssetMultimodalAnalysis } from "@/lib/benyuan-multimodal-prewarm";
import { BenyuanAssetStorageError, persistUploadedAssets } from "@/lib/benyuan-v3-assets";
import { benyuanQuestionsById } from "@/lib/benyuan-v3-schema";
import {
  BENYUAN_UPLOAD_MAX_REQUEST_BYTES,
  validateBenyuanUploadFileSignatures,
  validateBenyuanUploadFiles,
} from "@/lib/benyuan-upload-policy";

async function readBoundedMultipartFormData(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return { error: NextResponse.json({ error: "invalid_content_type" }, { status: 415 }) };
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      return { error: NextResponse.json({ error: "invalid_content_length" }, { status: 400 }) };
    }
    if (parsedLength > BENYUAN_UPLOAD_MAX_REQUEST_BYTES) {
      return { error: NextResponse.json({ error: "upload_request_too_large" }, { status: 413 }) };
    }
  }

  if (!request.body) {
    return { error: NextResponse.json({ error: "missing_body" }, { status: 400 }) };
  }

  const reader = request.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > BENYUAN_UPLOAD_MAX_REQUEST_BYTES) {
      await reader.cancel();
      return { error: NextResponse.json({ error: "upload_request_too_large" }, { status: 413 }) };
    }
    chunks.push(Buffer.from(value));
  }

  try {
    const formData = await new Response(Buffer.concat(chunks), {
      headers: { "content-type": contentType },
    }).formData();
    return { formData };
  } catch {
    return { error: NextResponse.json({ error: "invalid_multipart_body" }, { status: 400 }) };
  }
}

export async function POST(request: Request) {
  let auth;
  try {
    auth = await getRequiredBenyuanAuthSession(request);
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }

  try {
    await checkUploadRateLimit(request, auth.user.user_id);
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }

  const parsed = await readBoundedMultipartFormData(request);
  if (parsed.error) return parsed.error;
  const formData = parsed.formData;
  const questionId = formData.get("question_id");
  const fileEntries = formData.getAll("files");
  const uploadOrigin = formData.get("upload_origin");

  if (typeof questionId !== "string" || questionId.length === 0) {
    return NextResponse.json({ error: "missing_question_id" }, { status: 400 });
  }
  if (benyuanQuestionsById[questionId]?.kind !== "upload") {
    return NextResponse.json({ error: "invalid_upload_question" }, { status: 400 });
  }

  const files = fileEntries.filter((entry): entry is File => entry instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "missing_files" }, { status: 400 });
  }
  if (files.length !== fileEntries.length) {
    return NextResponse.json({ error: "invalid_files" }, { status: 400 });
  }
  const policyError = validateBenyuanUploadFiles(files);
  if (policyError) {
    return NextResponse.json({ error: policyError.error }, { status: policyError.status });
  }
  const signatureError = await validateBenyuanUploadFileSignatures(files);
  if (signatureError) {
    return NextResponse.json({ error: signatureError.error }, { status: signatureError.status });
  }

  const uploadParams = [];
  for (const file of files) {
    uploadParams.push({
      ownerUserId: auth.user.user_id,
      questionId,
      fileName: file.name,
      mimeType: file.type,
      buffer: Buffer.from(await file.arrayBuffer()),
      uploadOrigin: typeof uploadOrigin === "string" && uploadOrigin.length > 0 ? uploadOrigin : undefined,
    });
  }

  let assets;
  try {
    assets = await persistUploadedAssets(uploadParams);
  } catch (error) {
    if (error instanceof BenyuanAssetStorageError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
  assets.forEach((asset) => prewarmUploadedAssetMultimodalAnalysis(asset));

  return NextResponse.json({ question_id: questionId, assets });
}
