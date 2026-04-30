import process from "node:process";

import { POST } from "../src/app/api/tradewise/review/generate/route";
import {
  assertReviewSmokeResponse,
  buildReviewSmokePayload,
  formatReviewSmokeOutcome,
  formatReviewSmokeRuntimeDiagnostics,
  formatReviewSmokeSkip,
  readReviewSmokeOutcomeHeaders,
  resolveReviewSmokeProvider,
  resolveReviewSmokeRuntimeDiagnostics,
  resolveReviewSmokeSkipReason,
} from "./tradewise-review-smoke-helpers";

async function main() {
  const provider = resolveReviewSmokeProvider();
  const diagnostics = resolveReviewSmokeRuntimeDiagnostics(provider);
  const skipDecision = resolveReviewSmokeSkipReason(provider, diagnostics);
  if (skipDecision) {
    console.log(`tradewise:review:route:skip ${formatReviewSmokeSkip(diagnostics, skipDecision)}`);
    return;
  }

  console.log(
    `tradewise:review:route:diag ${formatReviewSmokeRuntimeDiagnostics(diagnostics)}`,
  );

  const startedAt = Date.now();
  const response = await POST(
    new Request("http://localhost/api/tradewise/review/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(buildReviewSmokePayload()),
    }),
  );

  const body = (await response.json()) as unknown;
  if (response.status !== 200) {
    throw new Error(
      `review_route_status_${response.status}:${JSON.stringify(body).slice(0, 240)}`,
    );
  }

  assertReviewSmokeResponse(body, provider);
  console.log(
    `tradewise:review:route:ok ${formatReviewSmokeRuntimeDiagnostics(diagnostics)} ${formatReviewSmokeOutcome(
      body.generatorVersion,
      Date.now() - startedAt,
      diagnostics,
      readReviewSmokeOutcomeHeaders(response.headers),
    )}`,
  );
  console.log(
    `tradewise:review:route:summary ${body.summary.slice(0, 48).replace(/\s+/g, " ")}`,
  );
  console.log("tradewise:review:route:pass");
}

main().catch((error) => {
  console.error(
    "tradewise:review:route:fail",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
