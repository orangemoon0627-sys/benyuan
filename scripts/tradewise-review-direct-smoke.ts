import process from "node:process";

import {
  generateTradeWiseReview,
  readTradeWiseReviewResultDiagnostic,
} from "../src/lib/tradewise/review-provider";
import {
  assertReviewSmokeResponse,
  buildReviewSmokePayload,
  formatReviewSmokeOutcome,
  formatReviewSmokeRuntimeDiagnostics,
  formatReviewSmokeSkip,
  resolveReviewSmokeProvider,
  resolveReviewSmokeRuntimeDiagnostics,
  resolveReviewSmokeSkipReason,
} from "./tradewise-review-smoke-helpers";

async function main() {
  const provider = resolveReviewSmokeProvider();
  const diagnostics = resolveReviewSmokeRuntimeDiagnostics(provider);
  const skipDecision = resolveReviewSmokeSkipReason(provider, diagnostics);
  if (skipDecision) {
    console.log(`tradewise:review:direct:skip ${formatReviewSmokeSkip(diagnostics, skipDecision)}`);
    return;
  }

  console.log(
    `tradewise:review:direct:diag ${formatReviewSmokeRuntimeDiagnostics(diagnostics)}`,
  );

  const startedAt = Date.now();
  const review = await generateTradeWiseReview(buildReviewSmokePayload());
  assertReviewSmokeResponse(review, provider);

  console.log(
    `tradewise:review:direct:ok ${formatReviewSmokeRuntimeDiagnostics(diagnostics)} ${formatReviewSmokeOutcome(
      review.generatorVersion,
      Date.now() - startedAt,
      diagnostics,
      readTradeWiseReviewResultDiagnostic(review),
    )}`,
  );
  console.log(
    `tradewise:review:direct:summary ${review.summary.slice(0, 48).replace(/\s+/g, " ")}`,
  );
  console.log("tradewise:review:direct:pass");
}

main().catch((error) => {
  console.error(
    "tradewise:review:direct:fail",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
