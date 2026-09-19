import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  executeModularGuidelineAudit,
  getAllGuidelines,
  getGuidelineById,
} from "../src/lib/guidelines";

describe("Modular Domain Reporting Guidelines Engine (Phase 4)", () => {
  it("provides complete registry with all canonical reporting standards", () => {
    const guidelines = getAllGuidelines();
    assert.ok(guidelines.length >= 5);

    const ids = guidelines.map((g) => g.id);
    assert.ok(ids.includes("consort"));
    assert.ok(ids.includes("prisma"));
    assert.ok(ids.includes("arrive"));
    assert.ok(ids.includes("ml_reproducibility"));
    assert.ok(ids.includes("strobe"));

    const consort = getGuidelineById("consort");
    assert.equal(consort?.id, "consort");
    assert.equal(consort?.itemSetSize, 25);
  });

  it("audits randomized clinical trial text against CONSORT 2010", () => {
    const rctText = `
      Title: A Randomized, Double-Blind Controlled Trial of Compound X
      Abstract:
      We conducted a randomized, double-blind, parallel-group clinical trial (1:1 allocation).
      Methods:
      Eligible patients met strict inclusion criteria.
      A computer-generated random sequence was generated.
      Participants and assessors were double-blinded to treatment using identical matching placebos.
      Primary analysis followed intention-to-treat protocols.
      Results:
      Table 1 shows baseline characteristics across groups.
      Adverse events were monitored throughout the trial.
      Registered at ClinicalTrials.gov (NCT01234567).
    `;

    const report = executeModularGuidelineAudit("consort", rctText);
    assert.equal(report.guidelineName, "CONSORT 2010 (Randomized Controlled Trials)");
    assert.ok(report.scorePercent > 40);
    assert.ok(report.evidencedCount >= 4);

    const titleItem = report.items?.find((i) => i.itemNumber === 1);
    assert.equal(titleItem?.status, "evidenced");

    const blindingItem = report.items?.find((i) => i.itemNumber === 9);
    assert.equal(blindingItem?.status, "evidenced");
  });

  it("audits systematic review text against PRISMA 2020", () => {
    const srText = `
      Title: Systematic Review and Meta-Analysis of Pediatric Interventions
      Abstract:
      Background: Interventions vary widely across clinics.
      Objectives: We addressed the review question.
      Results: Pooled analysis showed efficacy.
      Conclusions: Review highlights evidence.

      Introduction:
      We addressed the research question using the PICO framework.
      There is an unresolved questions gap in the literature.

      Methods:
      Searched PubMed, Embase, and Cochrane Library from inception.
      Two reviewers screened independently.
      Cochrane risk of bias tool was applied.
      Random-effects models were fitted with I2 statistic assessing heterogeneity.

      Results:
      Pooled analysis revealed significant efficacy across all cohorts.
    `;

    const report = executeModularGuidelineAudit("prisma", srText);
    assert.equal(report.guidelineName, "PRISMA 2020 (Systematic Reviews & Meta-Analyses)");
    assert.ok(report.evidencedCount >= 4);

    const picoItem = report.items?.find((i) => i.name.includes("Objectives & Framework"));
    assert.ok(picoItem);
  });

  it("audits preclinical animal research against ARRIVE 2.0", () => {
    const animalText = `
      Title: Murine Behavioral Phenotype
      Abstract:
      We evaluated in vivo neural markers in animal models.
      Methods:
      All protocols were approved by the Institutional Animal Care and Use Committee (IACUC #2023-11).
      Male C57BL/6 mice (8 weeks of age) were housed under a 12-h light/dark cycle.
      Animals were anesthetized with isoflurane and euthanized via cervical dislocation.
      Mice were randomly assigned to treatment arms and investigator was blinded to treatment.
    `;

    const report = executeModularGuidelineAudit("arrive", animalText);
    assert.equal(report.guidelineName, "ARRIVE 2.0 (In Vivo Animal Research)");
    assert.ok(report.evidencedCount >= 4);
    assert.ok(report.scorePercent >= 60);
  });

  it("audits machine learning paper against ML Reproducibility Checklist", () => {
    const mlText = `
      Title: Latent Diffusion Neural Solvers
      Abstract:
      We develop an algorithmic solver for optimization benchmarks.
      Methods:
      The objective function minimizes loss according to Algorithm 1.
      Our code is available at https://github.com/lab/deep-reproducibility.
      Hyperparameter search tested learning rate configurations with Adam optimizer.
      Experiments were executed on NVIDIA GPUs using PyTorch.
      Results:
      Results are reported across multiple random seeds with mean ± std error bars.
    `;

    const report = executeModularGuidelineAudit("ml_reproducibility", mlText);
    assert.equal(report.guidelineName, "NeurIPS / ICML Machine Learning Reproducibility Checklist");
    assert.ok(report.scorePercent >= 80);
    assert.ok(report.evidencedCount >= 4);
  });
});
