import test from "node:test";
import assert from "node:assert/strict";
import { classifyDocument, parseManuscriptText } from "../src/lib/parser.ts";
import { calculateCalibratedAcceptanceProbability } from "../src/lib/engine/scoring-dimensions.ts";
import { ReviewerPersonaFeedback, AppConfig } from "../src/lib/types.ts";
import {
  runManuscriptDiagnostic,
  assembleAndDeduplicateReviewerPersonas,
} from "../src/lib/engine/diagnostic-orchestrator.ts";

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

// =========================================================================
// NEW: Document Classification Robustness Tests (False Positive Prevention)
// =========================================================================

test("classifyDocument: Quick Fit Title + Abstract (no file) is recognized as academic manuscript", () => {
  const synthetic = `Title: Single-cell transcriptional profiling of DLL3 activation in neuroendocrine lung carcinoma

Abstract:
Small cell lung cancer (SCLC) exhibits rapid recurrence and therapy resistance. Delta-like ligand 3 (DLL3) is an established cell-surface target for antibody-drug conjugates. Here, we perform marker-based CRISPR-Cas9 screens and identify POU2F1 as a primary driver of DLL3 expression.

Keywords: small cell lung cancer, DLL3, POU2F1, CRISPR screen, organoids`;

  const classification = classifyDocument(synthetic, "manuscript.txt");
  assert.equal(classification.isAcademicManuscript, true, `Expected academic, got: ${classification.category}`);
  assert.equal(classification.category, "academic_manuscript");
});

test("classifyDocument: Markdown-formatted manuscript with ## headings is recognized as academic", () => {
  const markdownPaper = `# Deep Learning for Protein Structure Prediction

## Abstract
We present a novel approach to predicting protein tertiary structures using transformer architectures with attention mechanisms.

## 1. Introduction
Protein folding remains one of the grand challenges in computational biology.

## 2. Proposed Method
Our architecture employs multi-head self-attention layers with residue-level embeddings derived from evolutionary profiles.

## 3. Experimental Results
Our model achieves 91.3% GDT-TS on CASP14 targets (p < 0.001), outperforming AlphaFold1 by 4.7%.

## References
[1] Jumper, J. et al. Highly accurate protein structure prediction with AlphaFold. Nature 2021.`;

  const classification = classifyDocument(markdownPaper, "paper.md");
  assert.equal(classification.isAcademicManuscript, true, `Expected academic, got: ${classification.category}`);
  assert.equal(classification.category, "academic_manuscript");
});

test("classifyDocument: paper with author email and grants section is NOT falsely flagged as resume", () => {
  const paperWithEmail = `Optimizing Carbon Taxation Under Supply Chain Uncertainty
John Smith, Alice Brown
Department of Economics, Harvard University
Email: jsmith@harvard.edu

Abstract
This paper analyzes the effect of carbon taxation on supply chains under uncertainty using a stochastic equilibrium model.

1. Introduction
Carbon pricing is a central policy tool for emission reduction.

2. Model Development
Consider a supply chain with one manufacturer and one retailer facing demand uncertainty.

3. Numerical Results
Our simulations show a 15% reduction in carbon emissions under optimal taxation.

4. Conclusion
We conclude that carbon taxes are effective when calibrated to supply chain structure.

Grants and Funding
This work was supported by NSF grant 12345.

References
1. Nordhaus, W. (2018). Climate change economics. American Economic Review.`;

  const classification = classifyDocument(paperWithEmail, "paper.pdf");
  assert.equal(classification.isAcademicManuscript, true, `Expected academic, got: ${classification.category}`);
  assert.notEqual(classification.category, "resume_cv", "Paper with author email must NOT be classified as resume");
});

test("classifyDocument: text using the verb 'resume' is NOT falsely flagged as a CV", () => {
  const textWithResumeVerb = `Thermal Management in 5G Base Stations

Abstract
As 5G deployments resume after pandemic-related delays, thermal management becomes critical. We present cooling strategies for mmWave transceivers.

1. Introduction
Network operators resume infrastructure rollouts with higher power budgets.

2. Methods
We simulate thermal profiles using COMSOL Multiphysics across 12 transceiver configurations.

3. Results
Passive cooling achieves 23% lower junction temperatures (p < 0.05).

References
1. Zhang, Y. (2023). 5G Thermal Design. IEEE Trans. Components.`;

  const classification = classifyDocument(textWithResumeVerb, "thermal_paper.pdf");
  assert.equal(classification.isAcademicManuscript, true, `Expected academic, got: ${classification.category}`);
  assert.notEqual(classification.category, "resume_cv", "Verb 'resume' must NOT trigger CV classification");
});

test("classifyDocument: empty string returns non-academic (not crash)", () => {
  const classification = classifyDocument("", "untitled.txt");
  assert.equal(classification.isAcademicManuscript, false);
});

test("classifyDocument: peer-review diagnostic / evaluation report is flagged as non-academic", () => {
  const diagnosticReportText = `MANUVIEW DIAGNOSTIC SUITE Target: Science
Khatiwada_2026_EWaste_CV_Benchmark_1
Generated on 19 September 2026 • Peer-Review Calibrated Pre-Submission Evaluation
70 / 100 OVERALL ACCEPTANCE POTENTIAL SCORE
1. Editorial Synthesis & Triage Assessment
This manuscript presents a structured scholarly investigation within Multidisciplinary, comprising approximately 6,173 words and
supported by 25 bibliography citations. Diagnostic scanning identified quantitative inference relying on 1 statistical metric(s) (p = 0.5).

2. Simulated Peer-Review Panel (5 Expert Referees)
Reviewer 1: Lead Handling Editor Major Revision
Expertise Focus: Editorial triage, broad readership interest, and desk-rejection risk assessment
Key Challenge: Demarcating the conceptual advance and subscriber interest specifically for readers of Science.

3. Diagnostic Scoring Dimensions
Originality & Novelty 4 / 5
Methodological & Statistical Soundness 4 / 5

4. Priority Action Items (2 Items)
Priority B [Statistics] Sample Power Specification & Variance Reporting in Methodology`;

  const classification = classifyDocument(diagnosticReportText, "111.pdf");
  assert.equal(classification.isAcademicManuscript, false, "Diagnostic report must NOT be classified as manuscript");
  assert.equal(classification.category, "business_or_admin");
  assert.ok(
    classification.categoryLabel.toLowerCase().includes("diagnostic") ||
    classification.categoryLabel.toLowerCase().includes("evaluation"),
    `Expected label to mention diagnostic or evaluation, got ${classification.categoryLabel}`
  );
});

test("classifyDocument: random corporate report with Summary and University mention is flagged as non-academic", () => {
  const corporateReport = `
Quarterly Operations Update - Q3 Strategy
Prepared for Executive Leadership

Summary:
Over the past quarter, our logistical distribution networks have expanded across multiple regional hubs. We partnered with researchers at Stanford University to explore algorithmic routing improvements for supply chain efficiency.

Key Priorities:
1. Operational budget realignment
2. Software deployment timelines
3. Client stakeholder engagement

Next Steps:
Finalize vendor contracts and align team deliverables before the end of the fiscal year.
  `;

  const classification = classifyDocument(corporateReport, "q3_update.pdf");
  assert.equal(classification.isAcademicManuscript, false, "Corporate update must NOT be classified as manuscript");
  assert.notEqual(classification.category, "academic_manuscript");
});

test("classifyDocument: general essay with Introduction and Conclusion but no methods or references is flagged as non-academic", () => {
  const generalEssay = `
The Evolution of Digital Media and Modern Reading Habits
By Jordan Miller

Introduction
In the 21st century, digital platforms have fundamentally changed how people interact with written information. Where previous generations spent hours immersed in physical books, contemporary readers increasingly consume fragmented content across multiple electronic screens.

The Shift Toward Short-Form Content
Social media applications and endless scrolling feeds encourage rapid consumption patterns. Attention spans have adjusted to prioritize immediate feedback over prolonged analytical engagement.

Conclusion
While digital media offers unprecedented accessibility to global knowledge, cultivating deep reading habits remains vital for critical thinking. Balanced media consumption will define intellectual literacy in future decades.
  `;

  const classification = classifyDocument(generalEssay, "digital_media_essay.docx");
  assert.equal(classification.isAcademicManuscript, false, "General essay must NOT be classified as manuscript");
  assert.equal(classification.category, "general_or_creative");
});

test("diagnosticOrchestrator: Stage 0 immediately blocks non-academic documents across all engines without requiring API keys", async () => {
  const dummyResume = `Curriculum Vitae
Dr. Alex Mercer
Email: alex@example.com | Phone: (555) 012-3456
Education:
Ph.D. in Physics, MIT, 2020
Work Experience:
Postdoctoral Researcher, CERN, 2020-2024
Technical Skills:
Python, ROOT, Monte Carlo Simulations, C++`;

  const parsed = parseManuscriptText(dummyResume, "alex_cv.pdf");
  assert.equal(parsed.classification?.isAcademicManuscript, false);

  // Fake dummy config with no API key
  const mockConfig: AppConfig = {
    provider: "gemini",
    model: "gemini-2.5-flash",
    apiKey: "",
    customEndpoint: "",
    timeoutMs: 30000,
  };

  const report = await runManuscriptDiagnostic(parsed, mockConfig, "Nature");
  assert.equal(report.isEligibleForReview, false, "Must be marked ineligible for review");
  assert.equal(report.ineligibilityReason, "non_academic_document", "Ineligibility reason must be non_academic_document");
  assert.equal(report.overallScore, undefined, "Score must be suppressed");
  assert.equal(report.reviewerPersonas.length, 0, "No reviewer personas should be generated");
  assert.equal(report.funnelStageReached, "stage0_integrity");
});

test("classifyDocument: empirical engineering paper with hardware/pack/store terms is classified as academic, never random_unstructured", () => {
  const ewastePaperText = `Benchmarking Deep Convolutional and Vision Transformer Architectures for Autonomous E-Waste Component Classification in Mixed Scrap Streams
Bishal Khatiwada
Department of Environmental Management, Faculty of Environmental Management, Prince of Songkla University, Hat Yai, Songkhla 9110, Thailand
Correspondence: bishal.khatiwada@psu.ac.th

Abstract
Global electronic waste (e-waste) generation reached 62 million tonnes in 2022, yet only 22.3% was documented as properly collected and recycled. Automated visual sorting using deep learning can improve material recovery purity. We curate a harmonised dataset across seven categories including battery pack, hardware, and scrap inventory. All models benchmarked at 640x640 resolution with transfer learning. RT-DETR-L achieves mAP@50 of 92.5 ± 0.5%.

1. Introduction
Electronic waste (e-waste) is the fastest-growing waste stream globally. We evaluate GPU hardware accelerators to restore high-throughput sorting lines.

2. Materials and Methods
We curated 15,000 annotated images. The 7-class taxonomy maps material fractions and recovery targets. Models evaluate battery pack safety and hardware cost trade-offs.

3. Results
RT-DETR-L outperforms YOLOv9s by 7.0 percentage points. The Battery->Plastic misclassification rate reaches 3.2%.

4. Conclusions
This study presents a systematic benchmark for autonomous e-waste component classification in mixed scrap streams.

References
1. Baldé, C. P., et al. (2024). The Global E-waste Monitor 2024. ITU & UNITAR.
2. Zhao, Y., et al. (2024). DETRs beat YOLOs on real-time object detection. CVPR.`;

  const classification = classifyDocument(ewastePaperText, "Khatiwada_2026_EWaste_CV_Benchmark_1.pdf");
  assert.equal(classification.isAcademicManuscript, true, "Paper MUST be classified as an academic research manuscript");
  assert.equal(classification.category, "academic_manuscript");
  assert.notEqual(classification.category, "random_unstructured", "Paper must NEVER be flagged as unstructured text");
});

test("reviewer personas: deduplicates duplicate LLM persona roles down to 5 canonical reviewers", () => {
  const fallbackPersonas: ReviewerPersonaFeedback[] = [
    { persona: "journal_editor", name: "Reviewer 1", title: "", decisionRecommendation: "Major Revision", keyChallenge: "", assessment: "", majorCritiques: [] },
    { persona: "domain_expert", name: "Reviewer 2", title: "", decisionRecommendation: "Major Revision", keyChallenge: "", assessment: "", majorCritiques: [] },
    { persona: "methods_reviewer", name: "Reviewer 3", title: "", decisionRecommendation: "Major Revision", keyChallenge: "", assessment: "", majorCritiques: [] },
    { persona: "statistician", name: "Reviewer 4", title: "", decisionRecommendation: "Major Revision", keyChallenge: "", assessment: "", majorCritiques: [] },
    { persona: "devils_advocate", name: "Reviewer 5", title: "", decisionRecommendation: "Major Revision", keyChallenge: "", assessment: "", majorCritiques: [] },
  ];

  // Simulating the user's reported bug where LLM returned Reviewer 3: Research Methodology Referee 4 times (total 8 items)
  const candidatePersonas: ReviewerPersonaFeedback[] = [
    { persona: "journal_editor", decisionRecommendation: "Major Revision", keyChallenge: "Scope", assessment: "Editor notes", majorCritiques: ["Scope focus"] },
    { persona: "domain_expert", decisionRecommendation: "Major Revision", keyChallenge: "Domain", assessment: "Domain notes", majorCritiques: ["Domain depth"] },
    { persona: "methods_reviewer", decisionRecommendation: "Major Revision", keyChallenge: "Methods 1", assessment: "Method critique 1", majorCritiques: ["Critique A"] },
    { persona: "methods_reviewer", decisionRecommendation: "Major Revision", keyChallenge: "Methods 2", assessment: "Method critique 2", majorCritiques: ["Critique B"] },
    { persona: "methods_reviewer", decisionRecommendation: "Major Revision", keyChallenge: "Methods 3", assessment: "Method critique 3", majorCritiques: ["Critique C"] },
    { persona: "methods_reviewer", decisionRecommendation: "Major Revision", keyChallenge: "Methods 4", assessment: "Method critique 4", majorCritiques: ["Critique D"] },
    { persona: "statistician", decisionRecommendation: "Major Revision", keyChallenge: "Stats", assessment: "Stats critique", majorCritiques: ["Sample power"] },
    { persona: "devils_advocate", decisionRecommendation: "Major Revision", keyChallenge: "Adversarial", assessment: "Adversarial critique", majorCritiques: ["Counter-evidence"] },
  ];

  const { finalPersonas } = assembleAndDeduplicateReviewerPersonas(candidatePersonas, fallbackPersonas);

  assert.equal(finalPersonas.length, 5, `Expected exactly 5 personas, got ${finalPersonas.length}`);

  const roleSet = new Set(finalPersonas.map((p) => p.persona));
  assert.equal(roleSet.size, 5, `Expected 5 unique persona roles, got ${roleSet.size}`);

  const nameSet = new Set(finalPersonas.map((p) => p.name));
  assert.equal(nameSet.size, 5, `Expected 5 unique reviewer names, got ${nameSet.size}`);

  // Reviewer 3 must occur exactly once
  const reviewer3List = finalPersonas.filter((p) => p.persona === "methods_reviewer");
  assert.equal(reviewer3List.length, 1);
  assert.equal(reviewer3List[0].name, "Reviewer 3: Research Methodology Referee");
  // Critiques from duplicates should have been merged
  assert.ok(reviewer3List[0].majorCritiques.includes("Critique A"));
  assert.ok(reviewer3List[0].majorCritiques.includes("Critique B"));
});

test("laya scan parity: applied CV benchmark targeting Science is calibrated to Major Revisions (score 60-68) instead of uncalibrated 86%", async () => {
  const ewastePaperText = `Benchmarking Deep Convolutional and Vision Transformer Architectures for Autonomous E-Waste Component Classification in Mixed Scrap Streams
Bishal Khatiwada
Department of Environmental Management, Faculty of Environmental Management, Prince of Songkla University, Hat Yai, Songkhla 9110, Thailand
Correspondence: bishal.khatiwada@psu.ac.th

Abstract
Global electronic waste (e-waste) generation reached 62 million tonnes in 2022, yet only 22.3% was documented as properly collected and recycled. Automated visual sorting using deep learning can improve material recovery purity. We curate a harmonised dataset across seven categories including battery pack, hardware, and scrap inventory. All models benchmarked at 640x640 resolution with transfer learning. RT-DETR-L achieves mAP@50 of 92.5 ± 0.5%.

1. Introduction
Electronic waste (e-waste) is the fastest-growing waste stream globally. We evaluate GPU hardware accelerators to restore high-throughput sorting lines.

2. Materials and Methods
We curated 15,000 annotated images. The 7-class taxonomy maps material fractions and recovery targets. Models evaluate battery pack safety and hardware cost trade-offs.

3. Results
RT-DETR-L outperforms YOLOv9s by 7.0 percentage points. The Battery->Plastic misclassification rate reaches 3.2%.

4. Conclusions
This study presents a systematic benchmark for autonomous e-waste component classification in mixed scrap streams.

References
1. Baldé, C. P., et al. (2024). The Global E-waste Monitor 2024. ITU & UNITAR.
2. Zhao, Y., et al. (2024). DETRs beat YOLOs on real-time object detection. CVPR.`;

  const { runLayaScan } = await import("../src/lib/laya/laya-scan.ts");
  const result = await runLayaScan(ewastePaperText, {
    targetJournal: "Science",
  });

  assert.equal(result.isAcademic, true);
  // Calibrated score for Science must reflect elite selectivity ceiling (60-68), NOT raw 86%
  assert.ok(
    result.readiness >= 55 && result.readiness <= 68,
    `Expected calibrated readiness for Science between 55 and 68, got: ${result.readiness}`
  );
  assert.equal(result.readinessLabel, "Major Revisions Prioritized");
  // Technical completeness preserves checklist score
  assert.ok(
    result.technicalCompleteness !== undefined && result.technicalCompleteness > 0,
    `Expected technicalCompleteness > 0, got ${result.technicalCompleteness}`
  );
});

test("laya scan parity: out-of-scope target journal triggers Desk Reject Hazard (score <= 25)", async () => {
  const ewastePaperText = `Benchmarking Deep Convolutional and Vision Transformer Architectures for Autonomous E-Waste Component Classification in Mixed Scrap Streams
Abstract: Automated visual sorting using deep learning for e-waste.
1. Introduction: E-waste sorting.
2. Methods: RT-DETR and YOLOv8 training.
3. Results: RT-DETR achieves 92.5% mAP.
References:
1. Lin, T. CVPR 2017.`;

  const { runLayaScan } = await import("../src/lib/laya/laya-scan.ts");
  const result = await runLayaScan(ewastePaperText, {
    targetJournal: "Journal of Clinical Oncology",
  });

  assert.equal(result.isAcademic, true);
  assert.ok(
    result.readiness <= 25,
    `Expected desk reject score <= 25 for out-of-scope journal, got: ${result.readiness}`
  );
  assert.equal(result.readinessLabel, "High Desk-Reject Hazard");
});


