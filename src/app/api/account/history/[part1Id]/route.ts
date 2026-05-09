import { NextResponse } from "next/server";
import { BenyuanAuthError, getCurrentAuthSession } from "@/lib/benyuan-auth";
import { deleteAccountHistoryForUser } from "@/lib/benyuan-v3-store";

export async function DELETE(request: Request, context: { params: Promise<{ part1Id: string }> }) {
  try {
    const auth = await getCurrentAuthSession(request);
    const { part1Id } = await context.params;
    const deleted = await deleteAccountHistoryForUser(auth.user.user_id, part1Id);
    if (!deleted) {
      return NextResponse.json({ error: "history_item_not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}
