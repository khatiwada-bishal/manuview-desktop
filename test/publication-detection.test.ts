import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractPublicationMarkers,
  extractPreprintMarkers,
  detectPublishedArticle,
} from "../src/lib/publication-detector";
import { runLayaScan } from "../src/lib/laya/laya-scan";
import { runManuscriptDiagnostic } from "../src/lib/engine/diagnostic-orchestrator";

describe("Scholarly Publication Detection & Routing", () => {
  const publishedPaperText = `
Journal of Computer Assisted Learning (2022), Vol. 38, Issue 4, pp. 912-928
Published by Wiley-Blackwell. © 2022 The Authors. All rights reserved.
DOI: 10.1111/jcal.12654
Available online: 15 March 2022

# Scaffolding metacognitive regulation in collaborative inquiry learning

Abstract
Metacognitive scaffolding improves student regulation during open-ended scientific investigations. In this randomized controlled trial of 240 secondary school students, we examined adaptive prompts.

## Introduction
Collaborative inquiry learning environments require active regulation of cognitive processes.

## Methods
Participants were randomized into prompt scaffolding (n=120) and control (n=120) conditions.

## Results
The intervention group demonstrated significant gains in self-efficacy (p < 0.001) and post-test scores.

## References
[1] Azevedo, R., et al. (2019). Metacognition in digital learning. Educational Psychologist, 54(2), 89-104.
`;

  const preprintPaperText = `
arXiv:2305.12345v2 [cs.LG] 18 May 2023
https://doi.org/10.48550/arXiv.2305.12345

# Adaptive Quantization for Edge Transformers

Abstract
Pre-submission preprint under review. We propose a dynamic quantization scheme for low-power vision transformers.

## Introduction
Edge deployment demands extreme compression while preserving top-1 accuracy.

## Methodology
We quantize weights and activations to 4-bit integers with learned scale vectors.

## Experimental Results
ImageNet top-1 accuracy reaches 81.2% with 3.4x latency reduction.

## References
[1] Vaswani, A., et al. (2017). Attention is all you need. NeurIPS.
`;

  const unpublishedDraftText = `
# Empirical Investigation of Quantum Annealing for Portfolio Allocation

Dr. Jane Smith, Department of Computer Science, University of Edinburgh
Target Venue: IEEE Transactions on Quantum Engineering

## Abstract
We present a novel formulation of the mean-variance portfolio optimization problem on D-Wave Advantage quantum annealers.

## Introduction
Quadratic unconstrained binary optimization (QUBO) provides an effective mapping for combinatorial finance problems.

## Mathematical Formulation & Methods
We encode 50 assets into a Chimera graph using minor-embedding algorithms.

## Numerical Results & Discussion
Quantum annealing finds Pareto-optimal configurations 12% faster than simulated annealing.

## References
[1] Lucas, A. (2014). Ising formulations of many NP problems. Frontiers in Physics, 2, 5.
`;

  it("extractPreprintMarkers discriminates preprints from finalized published papers", () => {
    const preprintCheck = extractPreprintMarkers(preprintPaperText, "10.48550/arXiv.2305.12345");
    assert.strictEqual(preprintCheck.isPreprint, true);
    assert.strictEqual(preprintCheck.serverName, "arXiv");

    const publishedCheck = extractPreprintMarkers(publishedPaperText, "10.1111/jcal.12654");
    assert.strictEqual(publishedCheck.isPreprint, false);
  });

  it("extractPublicationMarkers extracts DOI, publisher, volume, and publication dates", () => {
    const markers = extractPublicationMarkers(publishedPaperText);
    assert.strictEqual(markers.doi, "10.1111/jcal.12654");
    assert.strictEqual(markers.isPreprint, false);
    assert.strictEqual(markers.hasPublishedMarkers, true);
    assert.ok(markers.publisher?.includes("Wiley"));
    assert.strictEqual(markers.volume, "38");
    assert.strictEqual(markers.issue, "4");
    assert.ok(markers.publicationDate?.includes("2022"));
  });

  it("extractPublicationMarkers captures DOI located in extended page-1 footer (up to 8000 chars)", () => {
    // Generate text where the DOI appears at character 4500
    const padding = "Author Affiliations and institutional disclosure notes. ".repeat(75); // ~4200 chars
    const deepDoiText = `
Journal of Environmental Sciences
Elsevier B.V. All rights reserved.
${padding}
doi: 10.1016/j.envsci.2023.10.012

# Microplastic Contamination in Subtropical Estuaries
## Abstract
Microplastics pose severe ecological threats to coastal estuaries.
## Methods
We collected 120 sediment core samples across 8 estuarine transects.
## Results
Average concentration reached 420 particles/kg dry sediment.
## References
[1] Thompson, R. C., et al. (2004). Lost at sea. Science, 304, 838.
`;
    const markers = extractPublicationMarkers(deepDoiText);
    assert.strictEqual(markers.doi, "10.1016/j.envsci.2023.10.012");
    assert.strictEqual(markers.hasPublishedMarkers, true);
    assert.ok(markers.publisher?.includes("Elsevier"));
  });

  it("detectPublishedArticle identifies already published article and returns metadata", async () => {
    const details = await detectPublishedArticle(publishedPaperText, "Scaffolding metacognitive regulation in collaborative inquiry learning");
    assert.ok(details, "Expected published article details to be returned");
    assert.strictEqual(details?.isPublished, true);
    assert.strictEqual(details?.isPreprint, false);
    assert.strictEqual(details?.doi, "10.1111/jcal.12654");
    assert.ok(details?.publisher?.includes("Wiley"));
  });

  it("detectPublishedArticle allows preprints to proceed as pre-submission manuscripts", async () => {
    const details = await detectPublishedArticle(preprintPaperText, "Adaptive Quantization for Edge Transformers");
    assert.ok(details, "Expected preprint details to be returned");
    assert.strictEqual(details?.isPublished, false);
    assert.strictEqual(details?.isPreprint, true);
    assert.strictEqual(details?.preprintServer, "arXiv");
  });

  it("detectPublishedArticle returns null for clean unpublished draft", async () => {
    const details = await detectPublishedArticle(unpublishedDraftText, "Empirical Investigation of Quantum Annealing for Portfolio Allocation");
    assert.strictEqual(details, null);
  });

  it("runLayaScan cleanly flags published paper with ineligibilityReason already_published and readiness 0", async () => {
    const result = await runLayaScan(publishedPaperText, {
      targetJournal: "Journal of Computer Assisted Learning",
    });

    assert.strictEqual(result.ineligibilityReason, "already_published");
    assert.strictEqual(result.readiness, 0);
    assert.strictEqual(result.readinessLabel, "Already Published");
    assert.strictEqual(result.isAcademic, true);
    assert.ok(result.publishedDetails, "Expected publishedDetails to be attached");
    assert.strictEqual(result.publishedDetails?.isPublished, true);
    assert.strictEqual(result.publishedDetails?.doi, "10.1111/jcal.12654");
  });

  it("runManuscriptDiagnostic Stage 0 immediately intercepts published papers without requiring LLM credentials", async () => {
    const mockParsed = {
      title: "Scaffolding metacognitive regulation in collaborative inquiry learning",
      abstract: "Metacognitive scaffolding improves student regulation during open-ended scientific investigations.",
      rawText: publishedPaperText,
      authors: ["Jane Doe", "John Smith"],
      sections: [],
      references: ["[1] Azevedo, R., et al. (2019). Metacognition in digital learning. Educational Psychologist, 54(2), 89-104."],
    };

    // Note: passing empty/unconfigured config to verify it does NOT throw an LLM config error
    const report = await runManuscriptDiagnostic(
      mockParsed,
      {} as any,
      "Journal of Computer Assisted Learning"
    );

    assert.strictEqual(report.isEligibleForReview, false);
    assert.strictEqual(report.ineligibilityReason, "already_published");
    assert.strictEqual(report.overallScore, undefined);
    assert.ok(report.publishedDetails, "Expected report to contain publishedDetails");
    assert.strictEqual(report.publishedDetails?.isPublished, true);
    assert.strictEqual(report.publishedDetails?.doi, "10.1111/jcal.12654");
  });
});
