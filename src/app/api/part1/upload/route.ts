import { NextResponse } from "next/server";
import { prewarmUploadedAssetMultimodalAnalysis } from "@/lib/benyuan-multimodal-prewarm";
import { persistUploadedAsset } from "@/lib/benyuan-v3-assets";

export async function POST(request: Request) {
  const formData = await request.formData();
  const questionId = formData.get("question_id");
  const fileEntries = formData.getAll("files");
  const uploadOrigin = formData.get("upload_origin");

  if (typeof questionId !== "string" || questionId.length === 0) {
    return NextResponse.json({ error: "missing_question_id" }, { status: 400 });
  }

  const files = fileEntries.filter((entry): entry is File => entry instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "missing_files" }, { status: 400 });
  }

  const assets = await Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return persistUploadedAsset({
        questionId,
        fileName: file.name,
        mimeType: file.type,
        buffer,
        uploadOrigin: typeof uploadOrigin === "string" && uploadOrigin.length > 0 ? uploadOrigin : undefined,
      });
    }),
  );
  assets.forEach((asset) => prewarmUploadedAssetMultimodalAnalysis(asset));

  return NextResponse.json({ question_id: questionId, assets });
}
