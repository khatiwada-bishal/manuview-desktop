import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  detectCaptions,
  detectFigureAndTableCallouts,
  auditCalloutConsistency,
  auditStatisticalLegendCompliance,
  auditManuscriptDisplayItems,
} from "../src/lib/figure-auditor";

describe("Display Items, Figures & Visual Pre-Flight Auditor (Phase 5)", () => {
  it("detects figure and table captions across standard academic conventions", () => {
    const text = `
      Introduction:
      We describe novel findings.

      Figure 1: Overview of the experimental pipeline showing sample preparation.
      
      Results:
      Table 1. Demographic characteristics of study cohort.

      Fig. 2 - Quantitative kinetic measurements of enzyme inhibition over time.
    `;

    const { figureCaptions, tableCaptions } = detectCaptions(text);

    assert.equal(figureCaptions.length, 2);
    assert.equal(figureCaptions[0].number, 1);
    assert.ok(figureCaptions[0].captionText.includes("Overview of the experimental pipeline"));
    assert.equal(figureCaptions[1].number, 2);

    assert.equal(tableCaptions.length, 1);
    assert.equal(tableCaptions[0].number, 1);
    assert.ok(tableCaptions[0].captionText.includes("Demographic characteristics"));
  });

  it("extracts narrative callouts without conflating caption headers", () => {
    const text = `
      As shown in Figure 1, the response was linear across all doses.
      Later observations (see Figs. 2 and 3) confirmed persistent activation.
      Summary data are tabulated in Table 1 and Table 2.

      Figure 1: Dose response curves.
      Figure 2: Activation profiles.
      Figure 3: Long-term kinetics.
      Table 1: Baseline parameters.
      Table 2: Endpoint metrics.
    `;

    const captions = detectCaptions(text);
    const { figuresInText, tablesInText } = detectFigureAndTableCallouts(text, captions);

    assert.deepEqual(figuresInText.sort(), [1, 2, 3]);
    assert.deepEqual(tablesInText.sort(), [1, 2]);
  });

  it("flags orphan, phantom, and non-sequential display items", () => {
    // Scenario 1: Phantom figure (Fig 3 cited, but no caption)
    const phantomIssues = auditCalloutConsistency([1, 2, 3], [1, 2], "figure");
    assert.ok(phantomIssues.some((i) => i.type === "phantom" && i.number === 3));

    // Scenario 2: Orphan table (Table 2 caption exists, but never cited in narrative)
    const orphanIssues = auditCalloutConsistency([1], [1, 2], "table");
    assert.ok(orphanIssues.some((i) => i.type === "orphan" && i.number === 2));

    // Scenario 3: Sequence gap (Figure 1 and Figure 3, skipping Figure 2)
    const gapIssues = auditCalloutConsistency([1, 3], [1, 3], "figure");
    assert.ok(gapIssues.some((i) => i.type === "non_sequential"));
  });

  it("audits statistical error bar legend compliance", () => {
    // Caption with undefined error bars
    const undefinedCaption = "Figure 2: Mean binding affinity across treatments. Error bars represent variability.";
    const check1 = auditStatisticalLegendCompliance(undefinedCaption, 2, "figure");
    assert.equal(check1.hasErrorBarsMentioned, true);
    assert.equal(check1.hasErrorBarDefinition, false);
    assert.ok(check1.issues.length > 0);
    assert.ok(check1.issues[0].includes("Standard Deviation (SD)"));

    // Caption with compliant error bar definition and sample size
    const compliantCaption = "Figure 2: Mean binding affinity across treatments. Error bars denote mean ± SEM (n = 6 biological replicates; *p < 0.01 by two-tailed Student's t-test).";
    const check2 = auditStatisticalLegendCompliance(compliantCaption, 2, "figure");
    assert.equal(check2.hasErrorBarsMentioned, true);
    assert.equal(check2.hasErrorBarDefinition, true);
    assert.equal(check2.hasSampleSizeMentioned, true);
    assert.equal(check2.hasPValueThresholds, true);
    assert.equal(check2.issues.length, 0);
  });

  it("performs end-to-end manuscript display item audit", () => {
    const compliantManuscript = `
      Title: Synthetic Biology Pathways
      Abstract:
      We analyze pathway flux in engineered microbes.

      Methods:
      Culture conditions were maintained under standard protocols.

      Results:
      As depicted in Figure 1, the yield increased markedly.
      These changes are detailed in Table 1.
      Subsequent validation in Figure 2 confirmed stability.

      Figure 1: Pathway yield under optimized conditions. Error bars indicate mean ± SD (n = 4 independent runs).
      
      Table 1: Growth parameters and carbon conversion efficiency.

      Figure 2: Long-term fermentation profile over 72 hours.
    `;

    const report = auditManuscriptDisplayItems(compliantManuscript);
    assert.equal(report.summary.totalFigures, 2);
    assert.equal(report.summary.totalTables, 1);
    assert.equal(report.summary.orphanCount, 0);
    assert.equal(report.summary.phantomCount, 0);
    assert.equal(report.summary.legendDeficiencyCount, 0);
    assert.equal(report.complianceStatus, "pass");

    // Deficient manuscript with phantom and undefined error bars
    const deficientManuscript = `
      Results:
      We observed a drop as shown in Figure 3.

      Figure 1: Enzyme rates. Error bars represent variance.
    `;
    const deficientReport = auditManuscriptDisplayItems(deficientManuscript);
    assert.ok(deficientReport.summary.phantomCount > 0 || deficientReport.summary.orphanCount > 0);
    assert.ok(deficientReport.summary.legendDeficiencyCount > 0);
    assert.notEqual(deficientReport.complianceStatus, "pass");
  });
});
