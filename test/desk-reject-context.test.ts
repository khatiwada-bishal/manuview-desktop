import test from "node:test";
import assert from "node:assert/strict";
import {
  DESK_REJECT_CAUSE_CONTEXT,
  DESK_REJECT_BASE_RATES,
  evaluateSixPillarDeskRejection,
} from "../src/lib/engine/scope-triage-journals.ts";
import type { ParsedManuscript } from "../src/lib/types.ts";

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
