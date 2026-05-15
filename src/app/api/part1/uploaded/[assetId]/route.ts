import { BenyuanAuthError, getRequiredBenyuanAuthSession } from "@/lib/benyuan-auth";
import { readUploadedAssetBufferForOwner } from "@/lib/benyuan-v3-assets";

export async function GET(request: Request, context: { params: Promise<{ assetId: string }> }) {
  let auth;
  try {
    auth = await getRequiredBenyuanAuthSession(request);
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return Response.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }

  const { assetId } = await context.params;
  const loaded = await readUploadedAssetBufferForOwner(assetId, auth.user.user_id);
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
