import test from "node:test";
import assert from "node:assert/strict";
import {
  generateFullReportHtml,
  generateFullReportWord,
  generateFullReportPdf,
  generateBriefReportHtml,
  generateBriefReportWord,
  generateBriefReportPdf,
  generateLatexRebuttal,
  generateBibTeX,
  exportInteractiveHtmlReport,
  exportWordDocReport,
  exportPdfReport,
  exportLatexRebuttalTable,
  exportBibTeX,
} from "../src/lib/export-generator.ts";
import type { FullReviewReport, BriefJournalFitReport } from "../src/lib/types.ts";

const mockFullReport: FullReviewReport = {
  id: "test-report-1",
  mode: "full",
  title: "Neural Architecture Search for Protein Secondary Structure Prediction",
  targetJournal: "Nature Methods",
  overallScore: 78,
  summary: "This manuscript presents a well-formulated neural search methodology with strong cross-benchmark evaluation.",
  isEligibleForReview: true,
  dimensions: {
    originality: {
      label: "Originality & Novelty",
      score: 4,
      verdict: "Substantial Novelty",
      strengths: ["New algorithmic formulation", "Benchmarked on CASP datasets"],
      vulnerabilities: ["Comparison with AlphaFold 3 could be more extensive"],
    },
    methodology: {
      label: "Methodological Rigor",
      score: 4,
      verdict: "Sound Design",
      strengths: ["Proper cross-validation", "Ablation study included"],
      vulnerabilities: ["Hyperparameter sensitivity not fully characterized"],
    },
  },
  reviewerPersonas: [
    {
      id: "rev-1",
      name: "Dr. Elena Rostova",
      title: "Senior Computational Biologist",
      affiliation: "EMBL-EBI",
      persona: "domain_specialist",
      decisionRecommendation: "Minor Revision",
      keyChallenge: "Baseline comparison needs validation on non-homologous splits.",
      assessment: "The proposed approach is compelling and technically robust.",
      evidenceAnchors: ["Section 3.2, paragraph 3", "Table 2"],
      majorCritiques: ["Expand validation across CASP15 targets."],
      mustAddressItems: ["Clarify cross-validation data leak prevention."],
    },
    {
      id: "rev-2",
      name: "Dr. Marcus Vance",
      title: "Adversarial Referee",
      affiliation: "Institute of Theoretical Computing",
      persona: "devils_advocate",
      decisionRecommendation: "Major Revision",
      keyChallenge: "Compute cost trade-off is understated compared to pre-trained foundation models.",
      assessment: "While inventive, the empirical utility over existing pre-trained weights is contested.",
      evidenceAnchors: ["Section 4.1"],
      majorCritiques: ["FLOP count not normalized across architectures."],
      mustAddressItems: ["Provide normalized GPU-hour benchmark table."],
      counterArguments: ["Foundation models require 100x parameter footprints."],
    },
  ],
  priorityIssues: [
    {
      id: "ISSUE-01",
      priority: "A",
      category: "Methodology",
      title: "Cross-Validation Data Leakage Risk",
      description: "Sequence homology between train and test splits was not explicitly controlled.",
      expectedEffort: "3-5 days",
      evidenceAnchor: "Section 2.3",
      impactAssessment: "Potential for inflated performance estimates could trigger immediate reviewer rejection.",
      reviewerQuote: "Without strict homology clustering, the claimed accuracy cannot be trusted.",
      actionableFix: "Re-partition the evaluation folds using MMseqs2 at 30% sequence identity threshold.",
      suggestedRewrite: "To prevent homology leakage, all sequences were clustered using MMseqs2 with a 30% sequence identity cut-off.",
      rebuttalStrategy: "Acknowledge the necessity of non-redundant splits and present updated benchmark tables alongside previous metrics.",
    },
  ],
  journalRecommendations: [
    {
      tier: "High Impact Reach",
      journalName: "Nature Methods",
      publisher: "Nature Publishing Group",
      impactFactor: "48.0",
      scopeRationale: "Pioneering computational biology toolkits are a primary focus.",
      rejectionRisks: ["Lack of wet-lab experimental validation."],
    },
  ],
  targetJournalEvaluation: {
    name: "Nature Methods",
    journalDiscipline: "Computational Biology & Methods",
    manuscriptDiscipline: "Computational Biology",
    fitScore: 88,
    isDisciplinaryMismatch: false,
    impactFactor: "48.0",
  },
  reportingGuideline: {
    guidelineName: "ARRIVE 2.0",
    standardType: "In Vivo Animal Research",
    scorePercent: 90,
    compliantItems: ["Sample size calculation", "Blinding of outcomes"],
    missingOrPartialItems: ["Housing and husbandry conditions"],
  },
  citationIntegrity: {
    totalReferencesFound: 1,
    verifiedViaCrossrefCount: 1,
    retractedCount: 0,
    selfCitationCount: 0,
    recencyPercentage: 100,
    references: [
      {
        doi: "10.1038/s41592-021-01234-x",
        title: "Highly accurate protein structure prediction with AlphaFold",
        authors: ["Jumper, J.", "Evans, R."],
        journal: "Nature",
        year: 2021,
      },
    ],
  },
};

const mockBriefReport: BriefJournalFitReport = {
  id: "test-brief-1",
  mode: "brief_fit",
  title: "A Survey of Federated Learning in Healthcare",
  targetJournal: "Journal of Medical Internet Research",
  fitScore: 82,
  verdict: "Strong Disciplinary Alignment",
  summary: "Manuscript demonstrates strong topical fit for JMIR healthcare informatics readership.",
  keyHighlights: ["Focus on decentralized clinical AI", "Clear digital health implications"],
  deskRejectHazards: ["Review-only papers may require systematic PRISMA structure."],
  framingSuggestions: ["Emphasize clinical translational barriers in title."],
  alternativeJournals: [
    {
      name: "Lancet Digital Health",
      tier: "High Impact",
      impactFactor: "36.6",
      matchReason: "Broad clinical AI audience",
    },
  ],
};

test("Export: generateFullReportHtml includes @page, @media print, and clean card styling", () => {
  const html = generateFullReportHtml(mockFullReport);
  assert.ok(html.includes("<!DOCTYPE html>"), "Must be valid HTML5 document");
  assert.ok(html.includes("@page"), "Must include @page print layout rules");
  assert.ok(html.includes("@media print"), "Must include @media print styles");
  assert.ok(html.includes("print-tip"), "Must include print-tip class for clean printing");
  assert.ok(html.includes("Nature Methods"), "Must include target journal");
  assert.ok(html.includes("78"), "Must include overall score");
  assert.ok(html.includes("Dr. Marcus Vance"), "Must include adversarial persona");
  assert.ok(html.includes("Cross-Validation Data Leakage Risk"), "Must include priority action items");
  assert.ok(html.includes("ARRIVE 2.0"), "Must include reporting guideline audit");
});

test("Export: generateFullReportWord produces Word HTML with styled cards and callouts", () => {
  const doc = generateFullReportWord(mockFullReport);
  assert.ok(doc.includes("xmlns:w='urn:schemas-microsoft-com:office:word'"), "Must have Word XML namespace");
  assert.ok(doc.includes("font-family: 'Georgia', serif"), "Must include Georgia serif title styling");
  assert.ok(doc.includes("Overall Potential Score: 78 / 100"), "Must include score banner");
  assert.ok(doc.includes("Nature Methods"), "Must include target journal");
  assert.ok(doc.includes("Priority A"), "Must include Priority A badge");
  assert.ok(doc.includes("Editorial Risk &amp; Scholarly Consequence") || doc.includes("Editorial Risk & Scholarly Consequence"), "Must include editorial risk callout");
  assert.ok(doc.includes("Required Pre-Submission Fix"), "Must include required fix callout");
  assert.ok(doc.includes("Author Point-by-Point Rebuttal Strategy"), "Must include rebuttal strategy callout");
  assert.ok(doc.includes("Dr. Elena Rostova"), "Must include reviewer personas");
});

test("Export: generateBriefReportHtml and generateBriefReportWord format scope checks cleanly", () => {
  const html = generateBriefReportHtml(mockBriefReport);
  assert.ok(html.includes("Scope Match") || html.includes("82% Match"), "HTML must include scope match");
  assert.ok(html.includes("@media print"), "HTML must include print styles");

  const word = generateBriefReportWord(mockBriefReport);
  assert.ok(word.includes("Scope Match: 82%"), "Word must include scope match banner");
  assert.ok(word.includes("Journal of Medical Internet Research"), "Word must include target journal");
  assert.ok(word.includes("Lancet Digital Health"), "Word must include alternative journals");
});

test("Export: generateLatexRebuttal and generateBibTeX produce valid academic source", () => {
  const tex = generateLatexRebuttal(mockFullReport);
  assert.ok(tex.includes("\\documentclass"), "Must be valid LaTeX document");
  assert.ok(tex.includes("Dr. Elena Rostova"), "Must include reviewer in rebuttal table");

  const bib = generateBibTeX(mockFullReport);
  assert.ok(bib.includes("@article{"), "Must include BibTeX entry");
  assert.ok(bib.includes("10.1038/s41592-021-01234-x"), "Must include verified DOI");
});

test("Export: functions are defined and exported correctly", () => {
  assert.equal(typeof exportInteractiveHtmlReport, "function");
  assert.equal(typeof exportWordDocReport, "function");
  assert.equal(typeof exportPdfReport, "function");
  assert.equal(typeof exportLatexRebuttalTable, "function");
  assert.equal(typeof exportBibTeX, "function");
  assert.equal(typeof generateFullReportPdf, "function");
  assert.equal(typeof generateBriefReportPdf, "function");
});

test("Export: generateFullReportPdf produces valid PDF binary buffer", () => {
  const bytes = generateFullReportPdf(mockFullReport);
  assert.ok(bytes instanceof Uint8Array, "Must return Uint8Array binary buffer");
  assert.ok(bytes.byteLength > 1000, "PDF must contain substantive byte data");
  // Check PDF signature: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  const header = String.fromCharCode(...bytes.slice(0, 5));
  assert.equal(header, "%PDF-", "Binary buffer must begin with valid PDF signature");
});

test("Export: generateBriefReportPdf produces valid PDF binary buffer", () => {
  const bytes = generateBriefReportPdf(mockBriefReport);
  assert.ok(bytes instanceof Uint8Array, "Must return Uint8Array binary buffer");
  assert.ok(bytes.byteLength > 1000, "PDF must contain substantive byte data");
  const header = String.fromCharCode(...bytes.slice(0, 5));
  assert.equal(header, "%PDF-", "Binary buffer must begin with valid PDF signature");
});
