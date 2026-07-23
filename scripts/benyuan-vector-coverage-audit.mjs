import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildPart1DataFromAnswers, aggregateTraitsFromPart1 } from "../src/lib/benyuan-v3-engine.ts";
import { buildPsycheMetadataProfile } from "../src/lib/benyuan-v3-psyche-metadata.ts";
import { benyuanPart1Questions } from "../src/lib/benyuan-v3-schema.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function emptyRecord(answers) {
  return {
    part1_id: "vector_audit",
    user_id: "vector_audit",
    data_cohort: "local",
    data_environment: "test",
    created_at: "",
    updated_at: "",
    answers,
    part1_data: {
      aesthetics: { music_analysis: null },
      philosophy: {},
      narrative: { social_posts_analysis: null, social_posts_overall_pattern: null, precious_photo_analysis: null },
    },
    aggregated_traits: {
      big_five: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 },
      core_themes: [],
      archetype_hints: [],
    },
  };
}

const optionCoverage = benyuanPart1Questions
  .filter((question) => question.options?.length)
  .map((question) => {
    const options = question.options.map((option) => {
      const answer = question.kind === "multi" ? [option.id] : option.id;
      const profile = buildPsycheMetadataProfile(emptyRecord({ [question.id]: answer }));
      return { option_id: option.id, signals: profile.selectedSignals.map((signal) => signal.key).sort() };
    });
    const groups = new Map();
    for (const option of options) {
      const key = option.signals.join("|");
      groups.set(key, [...(groups.get(key) ?? []), option.option_id]);
    }
    return {
      question_id: question.id,
      option_count: options.length,
      signal_universe: [...new Set(options.flatMap((option) => option.signals))].sort(),
      uncovered_options: options.filter((option) => option.signals.length === 0).map((option) => option.option_id),
      indistinguishable_groups: [...groups.entries()]
        .filter(([, optionIds]) => optionIds.length > 1)
        .map(([signals, option_ids]) => ({ option_ids, signals: signals.split("|").filter(Boolean) })),
    };
  });

let randomState = 0x9e3779b9;
function random() {
  randomState = (randomState * 1664525 + 1013904223) >>> 0;
  return randomState / 2 ** 32;
}

function shuffled(values) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

const sampleCount = 20_000;
const archetypeCounts = {};
for (let sample = 0; sample < sampleCount; sample += 1) {
  const answers = {};
  for (const question of benyuanPart1Questions) {
    if (question.kind === "single") {
      answers[question.id] = question.options[Math.floor(random() * question.options.length)].id;
    } else if (question.kind === "multi") {
      const count = Math.max(question.minSelections ?? 1, Math.min(question.maxSelections ?? 2, 2));
      answers[question.id] = shuffled(question.options).slice(0, count).map((option) => option.id);
    } else if (question.kind === "distribution") {
      const past = Math.floor(random() * 101);
      const present = Math.floor(random() * (101 - past));
      answers[question.id] = { past, present, future: 100 - past - present };
    }
  }
  const part1Data = buildPart1DataFromAnswers(answers);
  const archetype = aggregateTraitsFromPart1(answers, part1Data).archetype_hints[0];
  archetypeCounts[archetype] = (archetypeCounts[archetype] ?? 0) + 1;
}

const archetypeDistribution = Object.fromEntries(
  Object.entries(archetypeCounts)
    .sort((left, right) => right[1] - left[1])
    .map(([key, count]) => [key, { count, percentage: Number(((count / sampleCount) * 100).toFixed(2)) }]),
);
const coverageFailures = optionCoverage.filter(
  (item) => item.uncovered_options.length > 0 || item.indistinguishable_groups.length > 0,
);
const report = {
  generated_at: new Date().toISOString(),
  question_option_coverage: optionCoverage,
  archetype_random_baseline: {
    note: "Uniform random legal answers are a calibration smoke test, not an expected user population.",
    sample_count: sampleCount,
    distribution: archetypeDistribution,
    below_one_percent: Object.entries(archetypeDistribution).filter(([, value]) => value.percentage < 1).map(([key]) => key),
    above_twenty_five_percent: Object.entries(archetypeDistribution).filter(([, value]) => value.percentage > 25).map(([key]) => key),
  },
  coverage_failures: coverageFailures,
};

const outputPath = path.join(root, "output", "benyuan-vector-audit.json");
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`benyuan-vector-coverage-audit:${coverageFailures.length === 0 ? "pass" : "fail"} -> ${outputPath}`);
console.log(JSON.stringify(report.archetype_random_baseline, null, 2));
if (coverageFailures.length > 0) process.exitCode = 1;
