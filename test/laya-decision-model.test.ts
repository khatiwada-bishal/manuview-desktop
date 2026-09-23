import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runTypeSafeScan } from "../src/lib/typesafe-scan";

describe("Laya On-Device Decision Model Battery", () => {
  const sampleManuscript = `
# Deep Residual Shrinkage Networks for Fault Diagnosis Under Severe Noise

## Abstract
Fault diagnosis under severe noise is a critical challenge in industrial condition monitoring. In this study, we propose deep residual shrinkage networks (DRSN) incorporating soft thresholding mechanisms as trainable sub-networks. We evaluate the proposed architecture against standard deep architectures across three benchmark vibration datasets. Experimental results demonstrate an average accuracy improvement of 4.2% (p < 0.001, 95% CI [2.8%, 5.6%]).

## Introduction
Condition-based monitoring relies on feature extraction from acoustic and vibration time series. However, noise contamination remains a central failure mode for standard convolutional neural networks.

## Methodology & Experimental Design
We implemented the network in PyTorch using AdamW optimizer with a learning rate of 1e-4 and weight decay of 1e-2. The sample consisted of 12,000 vibration samples collected across 4 load conditions (1 HP to 4 HP). Random seeds were fixed to 42 for reproducibility. Hyperparameters and architecture specifications are published in our repository.

## Results & Discussion
The proposed DRSN achieved 98.4% diagnostic accuracy under -6dB Signal-to-Noise Ratio (SNR). Table 1 presents full comparative ablation results.

## Limitations
The current study was evaluated strictly on steady-state rotational bearing datasets. Transient speed conditions and compound faults were not evaluated.

## Data and Code Availability
All experimental data and source code are openly available at https://github.com/example/drsn-benchmarks.

## Ethics and Declarations
No human or animal subjects were involved in this research. The authors declare no competing financial or non-financial interests.

## Funding
This research was supported in part by Grant NSF-CNS-202401.

## Author Contributions
A.B. conceived the methodology; C.D. developed the software; all authors reviewed the manuscript.

## References
[1] He, K., et al. (2016). Deep residual learning for image recognition. CVPR.
[2] Zhao, M., et al. (2020). Deep residual shrinkage networks. IEEE TII.
`;

  const sampleResume = `
Jane Doe, Ph.D.
Senior Research Scientist | Machine Learning Specialist
Email: jane.doe@example.com | Phone: (555) 123-4567 | San Francisco, CA

Professional Summary
Experienced AI researcher with 8+ years leading computer vision and deep learning teams in biotechnology.

Work Experience
Senior Staff Scientist — BioTech AI Labs (2020 – Present)
- Led research on protein folding algorithms using PyTorch and JAX.
- Managed a team of 6 research engineers and published 4 patents.

Education
Ph.D. in Computer Science — Stanford University (2016 – 2020)
B.S. in Electrical Engineering — MIT (2012 – 2016)

Skills
Python, PyTorch, TensorFlow, C++, Machine Learning, Leadership
`;

  it("evaluates academic manuscript across 27-question battery", async () => {
    const result = await runTypeSafeScan(sampleManuscript, {
      targetJournal: "IEEE Transactions on Industrial Informatics",
    });

    assert.equal(result.isAcademic, true);
    assert.equal(result.ineligibilityReason, undefined);
    assert.ok(result.readiness > 60, `Expected readiness > 60, got ${result.readiness}`);
    assert.ok(result.signals.length >= 25, `Expected >= 25 signals, got ${result.signals.length}`);

    // Verify key signal groups exist
    const groupNames = result.groups.map((g) => g.name);
    assert.ok(groupNames.includes("Screening"));
    assert.ok(groupNames.includes("Structure & completeness"));
    assert.ok(groupNames.includes("Methodology & rigor"));
    assert.ok(groupNames.includes("Claims & evidence"));
    assert.ok(groupNames.includes("Writing & presentation"));
    assert.ok(groupNames.includes("Novelty & contribution"));
    assert.ok(groupNames.includes("Journal Alignment"));

    // Verify critical signals
    const abstractSig = result.signals.find((s) => s.id === "has_abstract");
    assert.ok(abstractSig);
    assert.equal(abstractSig.tone, "good");

    const dataSig = result.signals.find((s) => s.id === "data_availability");
    assert.ok(dataSig);
    assert.equal(dataSig.tone, "good");

    const limSig = result.signals.find((s) => s.id === "states_limitations");
    assert.ok(limSig);
    assert.equal(limSig.tone, "good");

    const scopeSig = result.signals.find((s) => s.id === "journal_scope_fit");
    assert.ok(scopeSig);
  });

  it("accurately classifies and flags non-academic documents (e.g. Resume/CV)", async () => {
    const result = await runTypeSafeScan(sampleResume, {
      filename: "Jane_Doe_Resume.pdf",
    });

    assert.equal(result.isAcademic, false);
    assert.equal(result.ineligibilityReason, "non_academic_document");
    assert.equal(result.readiness, 0);
    assert.equal(result.readinessLabel, "Review Bypassed");
    assert.ok(result.classification);
    assert.equal(result.classification.category, "resume_cv");
  });
});
