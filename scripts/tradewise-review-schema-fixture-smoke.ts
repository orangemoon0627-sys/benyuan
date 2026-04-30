import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  validateReviewGenerateResponse,
  type TradeWiseReviewScoreSet,
} from "../src/lib/tradewise/review-contract";
import { normalizeTradeWiseReviewPayload } from "../src/lib/tradewise/review-provider";
import { buildReviewSmokePayload } from "./tradewise-review-smoke-helpers";

const fixturePath = path.join(
  process.cwd(),
  "src/lib/fixtures/tradewise-crs-review-schema-sample.json",
);

const expectedScoreKeys: Array<keyof TradeWiseReviewScoreSet> = [
  "emotion",
  "logic",
  "discipline",
  "industryInsight",
  "timing",
  "riskManagement",
];

function assertHasContractScoreKeys(scores: TradeWiseReviewScoreSet) {
  const actualKeys = Object.keys(scores).sort();
  const expectedKeys = [...expectedScoreKeys].sort();
  if (actualKeys.join(",") !== expectedKeys.join(",")) {
    throw new Error(
      `review_score_keys_mismatch actual=${actualKeys.join(",")} expected=${expectedKeys.join(",")}`,
    );
  }
}

function assertNormalizedSample(
  raw: Record<string, unknown>,
  fallbackGeneratorVersion: string,
  requiredAliases: string[],
) {
  const { review, scoreAliasMappings, normalizationNotes } = normalizeTradeWiseReviewPayload(
    raw,
    buildReviewSmokePayload(),
    fallbackGeneratorVersion,
  );

  if (!validateReviewGenerateResponse(review)) {
    throw new Error(`review_schema_fixture_invalid_shape:${fallbackGeneratorVersion}`);
  }
  if (review.generatorVersion === "server.review.fallback.mock.schema.v1") {
    throw new Error(`review_schema_fixture_unexpected_schema_fallback:${fallbackGeneratorVersion}`);
  }

  assertHasContractScoreKeys(review.scores);

  for (const alias of requiredAliases) {
    if (!scoreAliasMappings.includes(alias)) {
      throw new Error(`review_schema_fixture_missing_alias_mapping:${fallbackGeneratorVersion}:${alias}`);
    }
  }

  return { review, scoreAliasMappings, normalizationNotes };
}

async function main() {
  const raw = JSON.parse(readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
  const primary = assertNormalizedSample(raw, "crs.gpt-5.4", [
    "emotion<-emotionStability",
    "logic<-execution",
    "industryInsight<-logic",
    "riskManagement<-riskControl",
  ]);

  const alternateRaw = {
    ...raw,
    scores: {
      discipline: 9,
      timing: 8,
      riskControl: 8,
      strategyFit: 9,
      emotionControl: 7,
    },
  } as Record<string, unknown>;
  const alternate = assertNormalizedSample(alternateRaw, "crs.gpt-5.4", [
    "emotion<-emotionControl",
    "logic<-strategyFit",
    "industryInsight<-logic",
    "riskManagement<-riskControl",
  ]);

  const routeLikeRaw = {
    ...raw,
    scores: {
      timing: 8,
      riskControl: 8,
      planExecution: 10,
      sectorUnderstanding: 8,
      emotionalStability: 7,
    },
    profitMetrics: {
      turnover: 211300,
      buyAmount: 168800,
      sellAmount: 42500,
      plannedTradeRatio: 100,
    },
  } as Record<string, unknown>;
  const routeLike = assertNormalizedSample(routeLikeRaw, "TradeWise-AI-1.0", [
    "emotion<-emotionalStability",
    "logic<-sectorUnderstanding",
    "discipline<-planExecution",
    "industryInsight<-sectorUnderstanding",
  ]);

  const directLikeRaw = {
    ...raw,
    scores: {
      timing: 8,
      riskControl: 8,
      planExecution: 10,
      sectorJudgment: 7,
      emotionControl: 8,
    },
    profitMetrics: {
      turnover: 211300,
      buyAmount: 168800,
      sellAmount: 42500,
      plannedTradeRatio: 100,
    },
  } as Record<string, unknown>;
  const directLike = assertNormalizedSample(directLikeRaw, "tradewise-review-v1.0", [
    "emotion<-emotionControl",
    "logic<-sectorJudgment",
    "discipline<-planExecution",
    "industryInsight<-sectorJudgment",
    "riskManagement<-riskControl",
  ]);

  const routeFallbackRaw = {
    ...raw,
    scores: {
      discipline: 9,
      timing: 8,
      riskControl: 8,
      planExecution: 10,
      sectorRotation: 8,
      emotionControl: 7,
    },
    profitMetrics: {
      totalTurnover: 211300,
      buyAmount: 168800,
      sellAmount: 42500,
      planExecutionRate: 100,
    },
  } as Record<string, unknown>;
  const routeFallback = assertNormalizedSample(routeFallbackRaw, "TradeWise-AI-1.0", [
    "emotion<-emotionControl",
    "logic<-sectorRotation",
    "industryInsight<-sectorRotation",
    "riskManagement<-riskControl",
  ]);

  const directObservedRaw = {
    ...raw,
    scores: {
      discipline: 9,
      timing: 8,
      riskControl: 8,
      planExecution: 10,
      sectorRhythm: 8,
      emotionStability: 7,
    },
    profitMetrics: {
      totalTurnover: 211300,
      buyAmount: 168800,
      sellAmount: 42500,
      planExecutionRate: 100,
    },
  } as Record<string, unknown>;
  const directObserved = assertNormalizedSample(directObservedRaw, "TradeWise-Review-v1.0", [
    "emotion<-emotionStability",
    "logic<-sectorRhythm",
    "industryInsight<-sectorRhythm",
    "riskManagement<-riskControl",
  ]);

  const routeObservedRaw = {
    ...raw,
    scores: {
      discipline: 9,
      timing: 8,
      selection: 8,
      riskControl: 8,
      execution: 9,
      mindset: 7,
    },
    profitMetrics: {
      turnover: 211300,
      buyAmount: 168800,
      sellAmount: 42500,
      planCompliance: 100,
    },
  } as Record<string, unknown>;
  const routeObserved = assertNormalizedSample(routeObservedRaw, "TradeWise-Review-Engine-1.0", [
    "emotion<-mindset",
    "logic<-execution",
    "industryInsight<-selection",
    "riskManagement<-riskControl",
  ]);

  const latestObservedRaw = {
    ...raw,
    scores: {
      discipline: 9,
      timing: 8,
      riskControl: 8,
      execution: 9,
      strategyConsistency: 8,
      emotionManagement: 8,
    },
    profitMetrics: {
      totalTurnover: 211300,
      buyAmount: 168800,
      sellAmount: 42500,
      planExecutionRate: 100,
    },
  } as Record<string, unknown>;
  const latestObserved = assertNormalizedSample(latestObservedRaw, "TradeWise-Review-v1.0", [
    "emotion<-emotionManagement",
    "logic<-execution",
    "industryInsight<-logic",
    "riskManagement<-riskControl",
  ]);

  console.log(
    `tradewise:review:schema-fixture:ok version=${primary.review.generatorVersion} scoreAliasMappings=${primary.scoreAliasMappings.join("|")} altScoreAliasMappings=${alternate.scoreAliasMappings.join("|")} routeLikeNormalizations=${routeLike.scoreAliasMappings.join("|")}+${routeLike.normalizationNotes.join("|")} directLikeNormalizations=${directLike.scoreAliasMappings.join("|")}+${directLike.normalizationNotes.join("|")} routeFallbackNormalizations=${routeFallback.scoreAliasMappings.join("|")}+${routeFallback.normalizationNotes.join("|")} directObservedNormalizations=${directObserved.scoreAliasMappings.join("|")}+${directObserved.normalizationNotes.join("|")} routeObservedNormalizations=${routeObserved.scoreAliasMappings.join("|")}+${routeObserved.normalizationNotes.join("|")} latestObservedNormalizations=${latestObserved.scoreAliasMappings.join("|")}+${latestObserved.normalizationNotes.join("|")}`,
  );
  console.log("tradewise:review:schema-fixture:pass");
}

main().catch((error) => {
  console.error(
    "tradewise:review:schema-fixture:fail",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
