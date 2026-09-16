import test from "node:test";
import assert from "node:assert/strict";
import {
  isStructuralAnchorResolvable,
  validateEvidenceSpansAndCoverage,
} from "../src/lib/engine/validation-gate.ts";
import { ReviewerPersonaFeedback, PriorityIssue } from "../src/lib/types.ts";

test("isStructuralAnchorResolvable validates real vs hallucinated tables and figures", () => {
  const manuscriptText = `
    We report the baseline demographics in Table 1.
    The primary ablation curves are plotted in Figure 2.
    Equation 3 defines the regularized loss function.
    As described in Section 2.1, the cohort was randomized.
  `;

  const sections = {
    introduction: "This study examines machine learning algorithms...",
    methods: "We trained a deep network on 10,000 images with cross-entropy loss...",
    results: "Table 1 lists the baseline characteristics...",
    discussion: "Our results indicate significant gains...",
    conclusion: "In conclusion, this method works well...",
  };

  // Resolvable items
  assert.equal(isStructuralAnchorResolvable("Table 1", manuscriptText, sections), true);
  assert.equal(isStructuralAnchorResolvable("Figure 2", manuscriptText, sections), true);
  assert.equal(isStructuralAnchorResolvable("Equation 3", manuscriptText, sections), true);
  assert.equal(isStructuralAnchorResolvable("Section 2.1", manuscriptText, sections), true);
  assert.equal(isStructuralAnchorResolvable("Materials and Methods", manuscriptText, sections), true);

  // Hallucinated items not present in manuscript
  assert.equal(isStructuralAnchorResolvable("Table 4", manuscriptText, sections), false);
  assert.equal(isStructuralAnchorResolvable("Figure 9", manuscriptText, sections), false);
  assert.equal(isStructuralAnchorResolvable("Equation 8", manuscriptText, sections), false);
  assert.equal(isStructuralAnchorResolvable("Section 7.3", manuscriptText, sections), false);
});

test("validateEvidenceSpansAndCoverage suppresses hallucinated structural anchors", () => {
  const manuscriptText = `
    The patient demographics are summarized in Table 1.
    Overall mortality in the treatment arm was 4.2% versus 8.9% in the control arm.
  `;

  const personas: ReviewerPersonaFeedback[] = [
    {
      persona: "methods_reviewer",
      name: "Reviewer 3: Research Methodology Referee",
      title: "Methodology Referee",
      roleDescription: "Evaluates methods",
      decisionRecommendation: "Major Revision",
      keyChallenge: "Sample sizing",
      assessment: "Methods need expansion.",
      majorCritiques: ["Missing Table 4 analysis."],
      missingControlsOrAnalyses: [],
      mustAddressItems: [],
      evidenceAnchors: [
        "Table 1", // Grounded table
        "Table 4", // Hallucinated table
      ],
      source: "llm",
    },
  ];

  const issues: PriorityIssue[] = [
    {
      id: "iss-1",
      priority: "A",
      title: "Ablation deficit",
      category: "Methodology",
      description: "Missing ablation table",
      evidenceAnchor: "Table 4", // Hallucinated anchor
      reviewerQuote: "",
      actionableFix: "Add table",
      source: "llm",
    },
  ];

  const result = validateEvidenceSpansAndCoverage(personas, issues, manuscriptText);

  // Table 1 should pass, Table 4 should be flagged as unverified
  const anchors = result.validatedPersonas[0].evidenceAnchors || [];
  assert.equal(anchors[0], "Table 1");
  assert.ok(anchors[1].includes("[Unverified excerpt flag]"), "Table 4 should be flagged ungrounded");

  // Priority issue with hallucinated anchor should have evidenceAnchor suppressed
  assert.equal(result.validatedIssues[0].evidenceAnchor, undefined, "Hallucinated issue anchor should be suppressed");
});
