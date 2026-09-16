import test from "node:test";
import assert from "node:assert/strict";
import {
  findMatchingJournals,
  computeCanonicalJournalFit,
  lookupJournalInCatalog,
} from "../src/lib/journals.ts";
import { runBriefJournalFitAnalysis } from "../src/lib/engine/diagnostic-orchestrator.ts";

test("Journal Fit Consistency: Recommendation tier cards match Brief Journal Fit check exactly", async () => {
  const title = "Deep Residual Learning for Image Recognition";
  const abstract =
    "We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. Comprehensive empirical evidence shows that these residual networks are easier to optimize and gain accuracy from considerably increased depth on ImageNet benchmarks.";

  // 1. Initial recommendation matching without target journal
  const matches = findMatchingJournals(title, abstract);

  assert.ok(matches.reach, "Should recommend a Reach journal");
  assert.ok(matches.realistic, "Should recommend a Realistic journal");
  assert.ok(matches.fallback, "Should recommend a Fallback journal");

  // 2. Check Reach journal: Brief check vs recommendation score
  const briefReach = await runBriefJournalFitAnalysis({
    title,
    abstract,
    targetJournal: matches.reach.name,
  });
  assert.ok(typeof briefReach.fitScore === "number");
  assert.equal(
    briefReach.fitScore,
    matches.reachFitScore,
    `Brief check fit score (${briefReach.fitScore}) must match Reach recommendation score (${matches.reachFitScore})`
  );

  // 3. Check Realistic journal: Brief check vs recommendation score
  const briefRealistic = await runBriefJournalFitAnalysis({
    title,
    abstract,
    targetJournal: matches.realistic.name,
  });
  assert.ok(typeof briefRealistic.fitScore === "number");
  assert.equal(
    briefRealistic.fitScore,
    matches.realisticFitScore,
    `Brief check fit score (${briefRealistic.fitScore}) must match Realistic recommendation score (${matches.realisticFitScore})`
  );

  // 4. Check Fallback journal: Brief check vs recommendation score
  const briefFallback = await runBriefJournalFitAnalysis({
    title,
    abstract,
    targetJournal: matches.fallback.name,
  });
  assert.ok(typeof briefFallback.fitScore === "number");
  assert.equal(
    briefFallback.fitScore,
    matches.fallbackFitScore,
    `Brief check fit score (${briefFallback.fitScore}) must match Fallback recommendation score (${matches.fallbackFitScore})`
  );

  // 5. Target Journal Evaluation parity in findMatchingJournals
  const targetReachMatches = findMatchingJournals(title, abstract, matches.reach.name);
  assert.ok(targetReachMatches.targetJournalEvaluation);
  assert.equal(
    targetReachMatches.targetJournalEvaluation.fitScore,
    matches.reachFitScore,
    `targetJournalEvaluation.fitScore must match reachFitScore for Reach journal`
  );

  const targetRealisticMatches = findMatchingJournals(title, abstract, matches.realistic.name);
  assert.ok(targetRealisticMatches.targetJournalEvaluation);
  assert.equal(
    targetRealisticMatches.targetJournalEvaluation.fitScore,
    matches.realisticFitScore,
    `targetJournalEvaluation.fitScore must match realisticFitScore for Realistic journal`
  );

  const targetFallbackMatches = findMatchingJournals(title, abstract, matches.fallback.name);
  assert.ok(targetFallbackMatches.targetJournalEvaluation);
  assert.equal(
    targetFallbackMatches.targetJournalEvaluation.fitScore,
    matches.fallbackFitScore,
    `targetJournalEvaluation.fitScore must match fallbackFitScore for Fallback journal`
  );
});

test("Cross-Field Mismatch Consistency: Low-band score (<=35%) and desk reject hazard on both surfaces", async () => {
  const clinicalTitle =
    "Efficacy and Safety of Empagliflozin in Patients with Heart Failure and Reduced Ejection Fraction";
  const clinicalAbstract =
    "A multicenter randomized double-blind placebo-controlled trial enrolled 3730 patients with heart failure to evaluate primary endpoints of cardiovascular death and hospital admission for worsening heart failure.";

  const csJournal = "IEEE Transactions on Software Engineering";

  // 1. In findMatchingJournals target evaluation
  const matches = findMatchingJournals(clinicalTitle, clinicalAbstract, csJournal);
  assert.ok(matches.targetJournalEvaluation);
  assert.equal(matches.targetJournalEvaluation.isDisciplinaryMismatch, true);
  assert.ok(
    matches.targetJournalEvaluation.fitScore <= 35,
    `Target fit score for cross-domain submission should be <= 35%, got ${matches.targetJournalEvaluation.fitScore}`
  );
  assert.ok(
    matches.targetJournalEvaluation.mismatchWarning?.includes("Severe Disciplinary Scope Mismatch"),
    "Mismatch warning must be present"
  );

  // 2. In runBriefJournalFitAnalysis check
  const brief = await runBriefJournalFitAnalysis({
    title: clinicalTitle,
    abstract: clinicalAbstract,
    targetJournal: csJournal,
  });

  assert.ok(typeof brief.fitScore === "number");
  assert.ok(
    brief.fitScore <= 35,
    `Brief check fit score for cross-domain submission should be <= 35%, got ${brief.fitScore}`
  );
  assert.equal(brief.verdict, "Scope Mismatch / High Desk-Reject Hazard");
  assert.equal(brief.verdictColor, "red");
  assert.ok(
    brief.dimensions.domainMatch.score !== undefined && brief.dimensions.domainMatch.score <= 35,
    "domainMatch dimension score must be <= 35 on severe mismatch"
  );
  assert.ok(
    brief.summary.includes("CRITICAL SCOPE MISMATCH"),
    "Summary must state critical scope mismatch"
  );

  // 3. Absolute parity between surfaces
  assert.equal(
    brief.fitScore,
    matches.targetJournalEvaluation.fitScore,
    `Brief fit score (${brief.fitScore}) and findMatchingJournals target score (${matches.targetJournalEvaluation.fitScore}) must match`
  );
});

test("Discipline of Record & Canonical Fit: Catalog vs Name-Only consistency", () => {
  const text = "Machine learning architectures and convolutional neural networks for vision classification";
  const natureEntry = lookupJournalInCatalog("Nature");
  assert.ok(natureEntry);

  const fitFromCatalog = computeCanonicalJournalFit({
    manuscriptText: text,
    manuscriptDiscipline: "Computer Science",
    journal: { source: "catalog", entry: natureEntry },
    tier: "Reach",
    isTarget: true,
  });

  const fitFromName = computeCanonicalJournalFit({
    manuscriptText: text,
    manuscriptDiscipline: "Computer Science",
    journal: { source: "name_only", name: "Nature" },
    tier: "Reach",
    isTarget: true,
  });

  assert.equal(fitFromCatalog.disciplineOfRecord, "Multidisciplinary");
  assert.equal(fitFromName.disciplineOfRecord, "Multidisciplinary");
  assert.equal(fitFromCatalog.fitScore, fitFromName.fitScore);
  assert.equal(fitFromCatalog.isDisciplinaryMismatch, false);
});
