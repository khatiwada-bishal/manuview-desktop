import test from "node:test";
import assert from "node:assert/strict";
import { classifyDocument } from "../src/lib/parser.ts";
import { calculateCalibratedAcceptanceProbability } from "../src/lib/engine/scoring-dimensions.ts";
import { ReviewerPersonaFeedback } from "../src/lib/types.ts";

test("classifyDocument: flags academic CVs as resume_cv even if they contain 'References' or 'Abstract'", () => {
  const academicCvText = `
Curriculum Vitae
Dr. Jane Doe
Email: jane.doe@university.edu | Phone: +1 (555) 019-2834
LinkedIn: linkedin.com/in/janedoe | GitHub: github.com/janedoe
GPA: 3.95 / 4.00

Education
Ph.D. in Computer Science, Stanford University, 2018 - 2023
B.S. in Electrical Engineering, MIT, 2014 - 2018

Work Experience
Senior Research Scientist, DeepMind, 2023 - Present
Graduate Research Assistant, Stanford AI Lab, 2018 - 2023

Technical Skills
Python, PyTorch, C++, CUDA, Distributed Systems, Transformer Architectures

Honors and Awards
NSF Graduate Research Fellowship, 2019
Best Paper Award, NeurIPS, 2022

Selected Publications
1. Doe, J. et al. Scalable Attention in Vision Transformers. NeurIPS 2022.
2. Doe, J. and Smith, A. Efficient Inference on Mobile Devices. ICML 2021.

References
Available upon request from former thesis advisors and industry managers.
  `;

  const classification = classifyDocument(academicCvText, "Jane_Doe_CV.pdf");
  assert.equal(classification.category, "resume_cv");
  assert.equal(classification.isAcademicManuscript, false);
  assert.ok(classification.salutation.includes("Candidate") || classification.salutation.includes("Professional"));
});

test("classifyDocument: flags Technical Product Requirements (PRD) as non-academic technical_doc", () => {
  const prdText = `
Product Requirements Document (PRD): ManuView Engine v2
Author: Tech Lead
Status: In Review

Architecture Overview & Goals
The objective of this project is to streamline local AI model execution.

Feature Spec & Acceptance Criteria
- User Story 1: As a user, I want on-device decision model scanning.
- API Reference: POST /api/scan with payload { text: string }
- Prerequisites: Node.js 20+, WebGPU supported browser
- Getting Started: Run npm install && npm run dev

Sprint Backlog & Roadmap
Q1: Finalize offline transformers integration.
Q2: Deploy desktop builds.
  `;

  const classification = classifyDocument(prdText, "PRD_ManuView.md");
  assert.equal(classification.category, "technical_doc");
  assert.equal(classification.isAcademicManuscript, false);
});

test("classifyDocument: flags shopping lists and unstructured fragments as random_unstructured", () => {
  const listText = `
- Buy milk and eggs
- Pick up groceries at supermarket
- Meeting tomorrow at 3pm
- Bread, cheese, coffee, bananas
- Hardware store: screws and supplies
  `;

  const classification = classifyDocument(listText, "todo.txt");
  assert.equal(classification.category, "random_unstructured");
  assert.equal(classification.isAcademicManuscript, false);
});

test("classifyDocument: categorizes Computer Vision e-waste benchmark as Computational & Algorithmic Research", () => {
  const cvBenchmarkPaper = `
Benchmarking Object Detection Models for Automated E-Waste Component Sorting

Alice Khatiwada, Bob Researcher
Department of Robotics and Artificial Intelligence

Abstract
Global electronic waste (e-waste) generation reached 62 million tonnes in 2024. In this study, we evaluate the detection accuracy and inference latency of RT-DETR-L, YOLOv8, and Faster R-CNN on an empirical benchmark dataset of circuit boards and connectors. Our experimental findings demonstrate that RT-DETR-L achieves 92.4% mean average precision (mAP@50) while maintaining 38 FPS inference speed.

1. Introduction
Automated e-waste sorting requires real-time object detection models with high spatial precision across dense component packaging.

2. Materials and Methods
We train RT-DETR-L, YOLOv8-X, and Faster R-CNN with a ResNet-50 backbone. Bounding box annotations were partitioned into 70% train, 15% validation, and 15% test splits. Models were evaluated using mean average precision (mAP) and FLOPs.

3. Results
Numerical experiments confirm that RT-DETR-L outperforms YOLOv8 by +3.1% mAP on small surface-mount capacitors (p < 0.01).

4. Discussion
While Faster R-CNN provides strong localization, its 14 FPS latency prohibits conveyor-belt deployment.

5. Conclusion
RT-DETR represents an optimal balance between precision and real-time inference for automated robotic dismantling.

References
1. Lin, T. et al. Feature Pyramid Networks for Object Detection. CVPR 2017. DOI: 10.1109/CVPR.2017.106
2. Jocher, G. YOLO by Ultralytics. 2023. DOI: 10.5281/zenodo.7347926
  `;

  const classification = classifyDocument(cvBenchmarkPaper, "Khatiwada_2026_EWaste_CV_Benchmark_1.pdf");
  assert.equal(classification.category, "academic_manuscript");
  assert.equal(classification.isAcademicManuscript, true);
  assert.ok(
    classification.categoryLabel.includes("Computational & Algorithmic Research"),
    `Expected Computational & Algorithmic Research, got: ${classification.categoryLabel}`
  );
  assert.ok(!classification.categoryLabel.includes("Environmental & Resource Economics"));
});

test("calculateCalibratedAcceptanceProbability: caps score at <= 45 when any reviewer votes Reject/Resubmit", () => {
  // Mirroring the scenario from the uploaded user document:
  // Raw LLM hallucinated 100, dimensions average 4/5, but 4 reviewers voted Major Revision and 1 voted Reject
  const personas: ReviewerPersonaFeedback[] = [
    { persona: "journal_editor", decisionRecommendation: "Major Revision", focusArea: "Scope", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
    { persona: "domain_expert", decisionRecommendation: "Major Revision", focusArea: "Domain", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
    { persona: "methods_reviewer", decisionRecommendation: "Major Revision", focusArea: "Methods", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
    { persona: "statistician", decisionRecommendation: "Major Revision", focusArea: "Stats", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
    { persona: "devils_advocate", decisionRecommendation: "Reject / Resubmit", focusArea: "Falsification", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
  ];

  const result = calculateCalibratedAcceptanceProbability({
    overallScore: 100, // Raw LLM number that previously caused 100/100 bug!
    dimensions: {
      originality: { score: 4.0, label: "Originality", verdict: "Good", strengths: [], vulnerabilities: [] },
      broad_interest: { score: 4.0, label: "Broad Interest", verdict: "Good", strengths: [], vulnerabilities: [] },
      claims_vs_evidence: { score: 4.0, label: "Claims vs Evidence", verdict: "Good", strengths: [], vulnerabilities: [] },
      methodology: { score: 4.0, label: "Methodology", verdict: "Good", strengths: [], vulnerabilities: [] },
      clarity: { score: 4.0, label: "Clarity", verdict: "Good", strengths: [], vulnerabilities: [] },
      prior_work: { score: 3.0, label: "Prior Work", verdict: "Moderate", strengths: [], vulnerabilities: [] },
    },
    reviewerPersonas: personas,
    targetJournal: "Sustainability (Switzerland)",
  });

  // Must be strictly capped at <= 45 because Reviewer 5 voted Reject / Resubmit
  assert.ok(
    result.overallScore <= 45,
    `Overall score must be <= 45 due to Reject vote, but was ${result.overallScore}`
  );
  assert.equal(result.readinessBand, "Substantial Revision Needed");
  assert.equal(result.decisionOutcome, "High Risk / Substantial Rebuttal Required");
});

test("calculateCalibratedAcceptanceProbability: caps score at <= 65 when 3+ reviewers vote Major Revision", () => {
  const personas: ReviewerPersonaFeedback[] = [
    { persona: "journal_editor", decisionRecommendation: "Major Revision", focusArea: "Scope", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
    { persona: "domain_expert", decisionRecommendation: "Major Revision", focusArea: "Domain", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
    { persona: "methods_reviewer", decisionRecommendation: "Major Revision", focusArea: "Methods", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
    { persona: "statistician", decisionRecommendation: "Major Revision", focusArea: "Stats", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
    { persona: "devils_advocate", decisionRecommendation: "Major Revision", focusArea: "Falsification", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
  ];

  const result = calculateCalibratedAcceptanceProbability({
    overallScore: 95,
    dimensions: {
      originality: { score: 4.5, label: "Originality", verdict: "Strong", strengths: [], vulnerabilities: [] },
      broad_interest: { score: 4.5, label: "Broad Interest", verdict: "Strong", strengths: [], vulnerabilities: [] },
      claims_vs_evidence: { score: 4.5, label: "Claims vs Evidence", verdict: "Strong", strengths: [], vulnerabilities: [] },
      methodology: { score: 4.5, label: "Methodology", verdict: "Strong", strengths: [], vulnerabilities: [] },
      clarity: { score: 4.5, label: "Clarity", verdict: "Strong", strengths: [], vulnerabilities: [] },
      prior_work: { score: 4.5, label: "Prior Work", verdict: "Strong", strengths: [], vulnerabilities: [] },
    },
    reviewerPersonas: personas,
    targetJournal: "Nature Communications",
  });

  assert.ok(
    result.overallScore <= 65,
    `Overall score must be <= 65 with 5 Major Revisions, got ${result.overallScore}`
  );
  assert.equal(result.readinessBand, "Competitive / Moderate Readiness");
});

test("calculateCalibratedAcceptanceProbability: score of 100 is strictly impossible in pre-submission peer review", () => {
  // Even with flawless 5/5 across all dimensions and all Accept/Minor Revision verdicts
  const flawlessPersonas: ReviewerPersonaFeedback[] = [
    { persona: "journal_editor", decisionRecommendation: "Accept", focusArea: "Scope", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
    { persona: "domain_expert", decisionRecommendation: "Accept", focusArea: "Domain", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
    { persona: "methods_reviewer", decisionRecommendation: "Minor Revision", focusArea: "Methods", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
    { persona: "statistician", decisionRecommendation: "Minor Revision", focusArea: "Stats", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
    { persona: "devils_advocate", decisionRecommendation: "Minor Revision", focusArea: "Falsification", coreChallenge: "", detailedReview: "", majorCritiques: [], mustAddressBeforeSubmission: [], adversarialDefenses: [] },
  ];

  const result = calculateCalibratedAcceptanceProbability({
    overallScore: 100,
    dimensions: {
      originality: { score: 5.0, label: "Originality", verdict: "Exemplary", strengths: [], vulnerabilities: [] },
      broad_interest: { score: 5.0, label: "Broad Interest", verdict: "Exemplary", strengths: [], vulnerabilities: [] },
      claims_vs_evidence: { score: 5.0, label: "Claims vs Evidence", verdict: "Exemplary", strengths: [], vulnerabilities: [] },
      methodology: { score: 5.0, label: "Methodology", verdict: "Exemplary", strengths: [], vulnerabilities: [] },
      clarity: { score: 5.0, label: "Clarity", verdict: "Exemplary", strengths: [], vulnerabilities: [] },
      prior_work: { score: 5.0, label: "Prior Work", verdict: "Exemplary", strengths: [], vulnerabilities: [] },
    },
    reviewerPersonas: flawlessPersonas,
    targetJournal: "Science",
  });

  assert.ok(
    result.overallScore <= 96,
    `Pre-submission peer review score must never reach 100; expected <= 96, got ${result.overallScore}`
  );
  assert.equal(result.readinessBand, "Strong Submission Readiness");
});
