import { NextResponse } from "next/server";
import {
  applyTradeWiseReviewDiagnosticHeaders,
  generateTradeWiseReview,
} from "@/lib/tradewise/review-provider";
import { validateReviewGenerateRequest } from "@/lib/tradewise/review-contract";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const validation = validateReviewGenerateRequest(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  if (validation.value.trades.length === 0) {
    return NextResponse.json(
      { error: "missing_trades_for_review_date" },
      { status: 400 },
    );
  }

  try {
    const review = await generateTradeWiseReview(validation.value);
    const response = NextResponse.json(review);
    applyTradeWiseReviewDiagnosticHeaders(response.headers, review);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "review_generation_failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
