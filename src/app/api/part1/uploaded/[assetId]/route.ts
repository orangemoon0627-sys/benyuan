import { readUploadedAssetBuffer } from "@/lib/benyuan-v3-assets";

export async function GET(_: Request, context: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await context.params;
  const loaded = await readUploadedAssetBuffer(assetId);
  if (!loaded) {
    return new Response("asset_not_found", { status: 404 });
  }

  return new Response(loaded.buffer, {
    headers: {
      "Content-Type": loaded.stored.mime_type,
      "Cache-Control": "private, max-age=3600",
      "Content-Length": String(loaded.buffer.byteLength),
    },
  });
}
