import test from "node:test";
import assert from "node:assert/strict";
import {
  DESK_REJECT_CAUSE_CONTEXT,
  DESK_REJECT_BASE_RATES,
  evaluateSixPillarDeskRejection,
} from "../src/lib/engine/scope-triage-journals.ts";
import type { ParsedManuscript } from "../src/lib/types.ts";
import { findMatchingJournals } from "../src/lib/journals.ts";
import { calculateCalibratedAcceptanceProbability } from "../src/lib/engine/scoring-dimensions.ts";
import { sanitizeSavedProject } from "../src/lib/projectStorage.ts";

test("Desk Reject Pillar Context: Qualitative cause framing without uncited percentage decimals", () => {
  // 1. Verify DESK_REJECT_CAUSE_CONTEXT is populated with qualitative text and no percentage symbols
  const pillars = [
    "novelty_scale",
    "scope_remit",
    "methodology_controls",
    "integrity_citations",
    "standards_compliance",
    "presentation_language",
  ] as const;

  for (const pillar of pillars) {
    const text = DESK_REJECT_CAUSE_CONTEXT[pillar];
    assert.ok(typeof text === "string" && text.length > 0, `Pillar ${pillar} should have text`);
    assert.ok(!text.includes("%"), `Pillar ${pillar} context should not contain percentage symbols: ${text}`);
    assert.ok(!/\b\d+\.\d+%\b/.test(text), `Pillar ${pillar} should not contain decimal percentages`);
  }

  // 2. Verify backward-compatible alias exists and matches
  assert.equal(DESK_REJECT_BASE_RATES, DESK_REJECT_CAUSE_CONTEXT);
});

test("evaluateSixPillarDeskRejection: populates editorialContext and baseRateContext without spurious percentages", () => {
  const manuscript: ParsedManuscript = {
    title: "Quantum Error Correction via Surface Codes",
    abstract:
      "We investigate surface code topologies for fault-tolerant quantum computation. We demonstrate threshold improvements using syndrome extraction circuits validated on superconducting transmon architectures.",
    rawText: "Introduction\nQuantum error correction is vital...\nMaterials and Methods\nWe simulated circuits...\nData availability: Data is at zenodo.org/10.1234/test\nEthics statement: Not applicable",
    sections: {
      introduction: "Quantum error correction is vital...",
      methods: "We simulated circuits with standard Pauli noise models...",
      results: "Threshold fidelity reached 99.4% under 17-qubit layouts...",
      discussion: "These results provide realistic paths to fault tolerance...",
    },
    wordCount: 4500,
  };

  const result = evaluateSixPillarDeskRejection({
    manuscript,
    detectedDiscipline: "Physics",
    targetJournalName: "Physical Review Letters",
    effectiveJournalDiscipline: "Physics",
    isScopeMismatch: false,
  });

  assert.equal(result.pillarEvaluations.length, 6, "Should evaluate all 6 pillars");

  for (const evaluation of result.pillarEvaluations) {
    assert.ok(evaluation.editorialContext, `Pillar ${evaluation.pillar} must define editorialContext`);
    assert.ok(evaluation.baseRateContext, `Pillar ${evaluation.pillar} must define baseRateContext`);
    assert.equal(
      evaluation.editorialContext,
      evaluation.baseRateContext,
      "editorialContext and baseRateContext should be consistent"
    );
    assert.ok(
      !evaluation.editorialContext.includes("%"),
      `Pillar ${evaluation.pillar} editorialContext should not contain uncited percentage: ${evaluation.editorialContext}`
    );
  }
});

test("evaluateSixPillarDeskRejection: handles soundness-only venues with explicit editorial disclaimers", () => {
  const manuscript: ParsedManuscript = {
    title: "Empirical Reproduction of Algorithm X",
    abstract: "We perform an independent replication of prior algorithmic benchmarks across ten datasets.",
    rawText: "Introduction\nReplication study...\nMaterials and Methods\nWe used seeds...\nData availability: github.com/test/repo",
    sections: {
      methods: "Detailed seeds and hardware configurations.",
    },
    wordCount: 3000,
  };

  const result = evaluateSixPillarDeskRejection({
    manuscript,
    detectedDiscipline: "Computer Science",
    targetJournalName: "PLOS ONE",
    effectiveJournalDiscipline: "Computer Science",
    isScopeMismatch: false,
  });

  const noveltyPillar = result.pillarEvaluations.find((p) => p.pillar === "novelty_scale");
  assert.ok(noveltyPillar, "novelty_scale pillar should exist");
  assert.equal(noveltyPillar.status, "pass");
  assert.ok(
    noveltyPillar.editorialContext?.includes("Disclaimed by journal editorial criteria"),
    `Soundness-only venue should disclaim novelty: ${noveltyPillar.editorialContext}`
  );
  assert.equal(noveltyPillar.editorialContext, noveltyPillar.baseRateContext);
});

test("Target Journal Scope Mismatch triggers immediate desk reject triage and suppresses acceptance score", () => {
  const title = "Benchmarking Deep Convolutional and Vision Transformer Architectures for Autonomous E-Waste Component Classification in Mixed Scrap Streams";
  const targetJournal = "Cancer";

  // 1. findMatchingJournals detects scope mismatch
  const matchResult = findMatchingJournals(title, "", targetJournal, []);
  assert.ok(matchResult.targetJournalEvaluation, "Should evaluate target journal");
  assert.equal(matchResult.targetJournalEvaluation.isDisciplinaryMismatch, true, "Cancer must be flagged as disciplinary mismatch for e-waste computer science paper");

  // 2. sanitizeSavedProject retroactively repairs papers with numerical scores if target journal is out-of-scope
  const staleSavedProject = {
    paper: {
      id: "paper-123",
      title,
      shortName: "Benchmarking Deep Convo",
      journal: "Cancer",
      score: 86,
      isDeskReject: false,
      isEligibleForReview: true,
    },
    dashboardData: {
      paperTitle: title,
      targetJournal: "Cancer",
      score: 86,
      isDeskReject: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sanitized = sanitizeSavedProject(staleSavedProject);
  assert.equal(sanitized.paper.isDeskReject, true, "Paper must be marked as desk reject");
  assert.equal(sanitized.paper.score, undefined, "Paper numerical score must be suppressed to undefined");
  assert.equal(sanitized.paper.isEligibleForReview, false, "Review eligibility must be false");
  assert.equal(sanitized.paper.ineligibilityReason, "scope_mismatch", "Ineligibility reason must be scope_mismatch");
  assert.equal(sanitized.dashboardData.isDeskReject, true, "Dashboard data must be marked as desk reject");
  assert.equal(sanitized.dashboardData.score, undefined, "Dashboard score must be undefined");

  // 3. calculateCalibratedAcceptanceProbability returns Desk Reject Hazard
  const calib = calculateCalibratedAcceptanceProbability({
    overallScore: 86,
    dimensions: undefined,
    targetJournal: "Cancer",
    targetJournalEvaluation: matchResult.targetJournalEvaluation,
    isScopeMismatch: true,
  });

  assert.equal(calib.readinessBand, "Desk Reject Hazard", "Readiness band must be Desk Reject Hazard");
  assert.equal(calib.decisionOutcome, "Desk Reject Hazard", "Decision outcome must be Desk Reject Hazard");
  assert.equal(calib.decisionDistribution.p_desk_reject, 85, "Desk reject probability must be 85%");
  assert.equal(calib.decisionDistribution.p_accept, 0, "Acceptance probability must be 0%");
});

test("Authoritative scan with sent_for_review outcome preserves score and prevents false desk rejection across navigation", () => {
  const title = "Robust Deep Learning Architectures for Computer Vision in Recycling";
  const targetJournal = "IEEE Transactions on Pattern Analysis and Machine Intelligence";

  const scannedProject = {
    paper: {
      id: "paper-456",
      title,
      shortName: "Robust Deep Learning",
      journal: targetJournal,
      score: 82,
      isDeskReject: false,
      isEligibleForReview: true,
      editorialTriage: {
        outcome: "sent_for_review" as const,
        sentToPeerReview: true,
        summary: `Cleared editorial triage (aims & scope aligned with ${targetJournal}) and advanced to the peer-review panel for full evaluation.`,
      },
    },
    dashboardData: {
      paperTitle: title,
      targetJournal,
      score: 82,
      isDeskReject: false,
      editorialTriage: {
        outcome: "sent_for_review" as const,
        sentToPeerReview: true,
      },
    },
    fullReport: {
      id: "rev_123",
      title,
      targetJournal,
      overallScore: 82,
      isEligibleForReview: true,
      editorialTriage: {
        outcome: "sent_for_review" as const,
        sentToPeerReview: true,
        summary: `Cleared editorial triage (aims & scope aligned with ${targetJournal}) and advanced to the peer-review panel for full evaluation.`,
      },
    } as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Run sanitizeSavedProject (which runs on sidebar navigation / project loading)
  const sanitized = sanitizeSavedProject(scannedProject);

  assert.equal(sanitized.paper.isDeskReject, false, "Paper must not be flipped to desk reject");
  assert.equal(sanitized.paper.score, 82, "Paper numerical score must remain 82");
  assert.equal(sanitized.paper.isEligibleForReview, true, "Paper must remain eligible for review");
  assert.equal(sanitized.dashboardData.isDeskReject, false, "DashboardData must not be desk reject");
  assert.equal(sanitized.dashboardData.score, 82, "DashboardData score must remain 82");
  assert.equal(sanitized.fullReport?.isEligibleForReview, true, "FullReport must remain eligible for review");
  assert.equal(sanitized.fullReport?.overallScore, 82, "FullReport overallScore must remain 82");
  assert.equal(sanitized.fullReport?.editorialTriage?.outcome, "sent_for_review", "Outcome must stay sent_for_review");
});

test("Sanitizer heals corrupted review project if editorial triage cleared it", () => {
  const corruptedProject = {
    paper: {
      id: "paper-789",
      title: "Novel Transformers in Image Processing",
      shortName: "Novel Transformers",
      journal: "IEEE Transactions on Pattern Analysis and Machine Intelligence",
      score: undefined,
      isDeskReject: true, // corrupted by previous bug
      isEligibleForReview: false,
    },
    dashboardData: {
      paperTitle: "Novel Transformers in Image Processing",
      targetJournal: "IEEE Transactions on Pattern Analysis and Machine Intelligence",
      score: undefined,
      isDeskReject: true,
      statusText: "Editorial Desk Reject (Scope Mismatch)",
    },
    fullReport: {
      id: "rev_789",
      title: "Novel Transformers in Image Processing",
      targetJournal: "IEEE Transactions on Pattern Analysis and Machine Intelligence",
      overallScore: 80,
      isEligibleForReview: false, // corrupted
      editorialTriage: {
        outcome: "desk_reject" as const, // corrupted
        sentToPeerReview: false,
        summary: "Cleared editorial triage (aims & scope aligned with IEEE Transactions on Pattern Analysis and Machine Intelligence) and advanced to the peer-review panel for full evaluation.",
      },
    } as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const healed = sanitizeSavedProject(corruptedProject);

  assert.equal(healed.paper.isDeskReject, false, "Healed paper must have isDeskReject: false");
  assert.equal(healed.paper.score, 80, "Healed paper must restore score: 80");
  assert.equal(healed.paper.isEligibleForReview, true, "Healed paper must have isEligibleForReview: true");
  assert.equal(healed.dashboardData.isDeskReject, false, "Healed dashboardData must have isDeskReject: false");
  assert.equal(healed.dashboardData.score, 80, "Healed dashboardData must restore score: 80");
  assert.equal(healed.fullReport?.editorialTriage?.outcome, "sent_for_review", "Outcome must be healed to sent_for_review");
  assert.equal(healed.fullReport?.overallScore, 80, "FullReport score must be 80");
});
