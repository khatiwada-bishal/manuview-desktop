import test from "node:test";
import assert from "node:assert/strict";
import { calculateCalibratedAcceptanceProbability } from "../src/lib/engine/scoring-dimensions.ts";

test("calculateCalibratedAcceptanceProbability assigns honest readiness bands without false precision numbers", () => {
  // Scenario 1: Clean, high-scoring empirical paper targeting Nature (baseline 7.5%)
  const cleanResult = calculateCalibratedAcceptanceProbability({
    overallScore: 82,
    dimensions: {
      originality: { score: 4.5, label: "Originality", verdict: "Strong", strengths: [], vulnerabilities: [] },
      claims_vs_evidence: { score: 4.2, label: "Claims vs Evidence", verdict: "Rigorous", strengths: [], vulnerabilities: [] },
      methodology: { score: 4.5, label: "Methodology", verdict: "Exemplary", strengths: [], vulnerabilities: [] },
      broad_interest: { score: 4.0, label: "Broad Interest", verdict: "High", strengths: [], vulnerabilities: [] },
      clarity: { score: 4.2, label: "Clarity", verdict: "Clear", strengths: [], vulnerabilities: [] },
      prior_work: { score: 4.0, label: "Prior Work", verdict: "Comprehensive", strengths: [], vulnerabilities: [] },
    },
    targetJournal: "Nature",
    isScopeMismatch: false,
    isMethodsMissing: false,
  });

  assert.equal(cleanResult.readinessBand, "Strong Submission Readiness");
  assert.equal(cleanResult.decisionOutcome, "Strong Candidate / Likely Acceptance");
  // Numerical acceptance probability percent must be undefined (no false precision)
  assert.equal(cleanResult.acceptanceProbabilityPercent, undefined);
  assert.equal(cleanResult.probabilityRange, undefined);
  // Grounded catalog baseline
  assert.equal(cleanResult.baselineJournalRatePercent, 7.5);
  // Methodological transparency advisory
  assert.ok(cleanResult.calibrationAdvisory?.includes("Quantitative acceptance probability percentages are suppressed"));

  // Scenario 2: Scope mismatch triggers immediate Desk Reject Hazard
  const scopeMismatchResult = calculateCalibratedAcceptanceProbability({
    overallScore: 78,
    targetJournal: "Nature Medicine",
    isScopeMismatch: true,
  });

  assert.equal(scopeMismatchResult.readinessBand, "Desk Reject Hazard");
  assert.equal(scopeMismatchResult.decisionOutcome, "Desk Reject Hazard");
  assert.ok(scopeMismatchResult.primaryHazard?.includes("Out-of-Scope"));

  // Scenario 3: Missing methods triggers Desk Reject Hazard
  const missingMethodsResult = calculateCalibratedAcceptanceProbability({
    overallScore: 75,
    targetJournal: "PLOS ONE",
    isScopeMismatch: false,
    isMethodsMissing: true,
  });

  assert.equal(missingMethodsResult.readinessBand, "Desk Reject Hazard");
  assert.ok(missingMethodsResult.primaryHazard?.includes("Missing Materials and Methods"));

  // Scenario 4: Retracted citations trigger Desk Reject Hazard
  const retractionResult = calculateCalibratedAcceptanceProbability({
    overallScore: 80,
    targetJournal: "Science",
    citationIntegrity: {
      totalReferences: 40,
      sampledCount: 40,
      verifiedCount: 39,
      retractedCount: 1,
      expressionOfConcernCount: 0,
      unresolvableCount: 0,
      uncheckedCount: 0,
      retractionCheckAvailable: true,
      coverageNote: "",
    },
  });

  assert.equal(retractionResult.readinessBand, "Desk Reject Hazard");
  assert.ok(retractionResult.primaryHazard?.includes("Retracted Citations Detected"));

  // Scenario 5: Moderate submission needing revision
  const moderateResult = calculateCalibratedAcceptanceProbability({
    overallScore: 62,
    dimensions: {
      methodology: { score: 3.0, label: "Methodology", verdict: "Moderate", strengths: [], vulnerabilities: [] },
    },
    targetJournal: "PLOS ONE",
  });

  assert.equal(moderateResult.readinessBand, "Competitive / Moderate Readiness");
  assert.equal(moderateResult.decisionOutcome, "Competitive with Major Revisions");
});
