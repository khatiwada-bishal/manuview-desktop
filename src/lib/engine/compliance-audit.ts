import type {
  CitationIntegritySummary,
  ComplianceAuditItem,
  DeterministicComplianceAudit,
  ParsedManuscript,
  ReportingGuidelineCheck,
  TargetJournalEvaluation,
} from "../types";
import { detectReasonableRequestFormulation } from "../artifact-auditor";

export function buildDeterministicComplianceAudit(
  manuscript: ParsedManuscript,
  citationIntegrity: CitationIntegritySummary,
  reportingGuideline?: ReportingGuidelineCheck,
  targetJournalEvaluation?: TargetJournalEvaluation,
  detectedDiscipline?: string
): DeterministicComplianceAudit {
  const items: ComplianceAuditItem[] = [];

  const hasTitle = Boolean(manuscript.title && manuscript.title.trim().length > 5);
  items.push({
    id: "audit-title",
    category: "Structure",
    name: "Manuscript Title & Declarative Contribution",
    status: hasTitle ? "pass" : "fail",
    detail: hasTitle
      ? `Manuscript title identified: "${manuscript.title?.slice(0, 75)}${(manuscript.title?.length || 0) > 75 ? "..." : ""}"`
      : "No distinct manuscript title identified in submission header.",
    actionableRecommendation: hasTitle ? undefined : "Provide a clear declarative title summarizing the primary empirical contribution.",
  });

  const hasAbstract = Boolean(manuscript.abstract && manuscript.abstract.trim().length > 60);
  items.push({
    id: "audit-abstract",
    category: "Structure",
    name: "Abstract & Empirical Summary",
    status: hasAbstract ? "pass" : "warn",
    detail: hasAbstract
      ? `Structured abstract detected (${manuscript.abstract?.length || 0} characters).`
      : "Abstract is either missing or too brief (<60 chars) to convey background, methods, results, and significance.",
    actionableRecommendation: hasAbstract ? undefined : "Add a complete 150–250 word abstract stating research objectives, methodology, main quantitative findings, and implications.",
  });

  const hasExplicitMethods = Boolean(
    manuscript.sections?.methods ||
    /methods|methodology|experimental procedures|materials and methods|study design/i.test(manuscript.rawText || "")
  );
  items.push({
    id: "audit-methods",
    category: "Structure",
    name: "Explicit Methods / Protocol Section",
    status: hasExplicitMethods ? "pass" : "fail",
    detail: hasExplicitMethods
      ? "Dedicated Methods / Methodology section identified in the document structure."
      : "No explicit Methods heading detected — peer reviewers cannot locate protocol specifications or audit reproducibility.",
    actionableRecommendation: hasExplicitMethods ? undefined : "Add an explicit Methods heading detailing participant cohorts, instrumentation, experimental design, and analytical models.",
  });

  const sampleSizes = manuscript.empiricalCues?.sampleSizes || [];
  const statMetrics = manuscript.empiricalCues?.statisticalMetrics || [];
  const hasSampleCue = sampleSizes.length > 0;
  items.push({
    id: "audit-sample-size",
    category: "Methodology",
    name: "Sample Size / Cohort Specification",
    status: hasSampleCue ? "pass" : "warn",
    detail: hasSampleCue
      ? `Sample size specifications identified (${sampleSizes.slice(0, 3).join(", ")}).`
      : "No explicit sample size (e.g. n=..., N=..., cohort size) detected in text.",
    actionableRecommendation: hasSampleCue ? undefined : "Explicitly report sample size (n), participant breakdown, or dataset record counts in the methodology.",
  });

  const hasStats = statMetrics.length > 0;
  items.push({
    id: "audit-quantitative-rigor",
    category: "Methodology",
    name: "Statistical & Model Metrics",
    status: hasStats ? "pass" : "warn",
    detail: hasStats
      ? `Quantitative model metrics detected (${statMetrics.slice(0, 3).join(", ")}).`
      : "No standard statistical indicators (e.g. p-values, CI, R², AUC, F-statistic) detected in results text.",
    actionableRecommendation: hasStats ? undefined : "Report effect sizes, exact p-values, and confidence intervals rather than relying solely on descriptive claims.",
  });

  const artifactLinks = manuscript.extractedArtifactLinks || [];
  const hasArtifactLinks = artifactLinks.length > 0;
  const hasReasonableRequest = detectReasonableRequestFormulation(manuscript.rawText);

  items.push({
    id: "audit-data-code-availability",
    category: "Methodology",
    name: "Open Data, Code & Artifact Availability",
    status: hasArtifactLinks ? "pass" : hasReasonableRequest ? "warn" : "warn",
    detail: hasArtifactLinks
      ? `${artifactLinks.length} public artifact repository link(s) detected (${artifactLinks.map((l) => l.platform).join(", ")}).`
      : hasReasonableRequest
      ? "Manuscript relies on 'data/code available upon request'. High-impact journals (Nature, PLOS, IEEE) actively disfavor or reject this formulation."
      : "No public code or data repository links (GitHub, Zenodo, OSF, Figshare) identified in manuscript text.",
    actionableRecommendation: hasArtifactLinks
      ? undefined
      : "Deposit primary data, analysis scripts, or model weights in an open repository (Zenodo, OSF, or GitHub) with a persistent identifier.",
  });

  if (reportingGuideline) {
    const score = reportingGuideline.scorePercent ?? 0;
    const isPass = score >= 70;
    const isWarn = score >= 40 && score < 70;
    items.push({
      id: "audit-reporting-guideline",
      category: "Guidelines",
      name: `${reportingGuideline.guidelineName} Checklist Compliance`,
      status: isPass ? "pass" : isWarn ? "warn" : "fail",
      detail: `Checklist adherence score: ${score}% (${reportingGuideline.compliantItems?.length || 0} compliant, ${reportingGuideline.missingOrPartialItems?.length || 0} missing/partial items).`,
      actionableRecommendation: isPass ? undefined : `Address missing checklist items: ${reportingGuideline.missingOrPartialItems?.slice(0, 2).join("; ")}`,
    });
  }

  const retCount = citationIntegrity.retractedCount || 0;
  items.push({
    id: "audit-retractions",
    category: "Citations",
    name: "Retraction Watch & Publisher Correction Audit",
    status: retCount === 0 ? "pass" : "fail",
    detail: retCount === 0
      ? "Zero retracted references detected in cited bibliography."
      : `${retCount} cited reference(s) have been formally retracted by academic publishers.`,
    actionableRecommendation: retCount > 0 ? "Remove or replace retracted citations immediately prior to journal submission." : undefined,
  });

  const unresolvable = citationIntegrity.unresolvableCount || 0;
  items.push({
    id: "audit-doi-integrity",
    category: "Citations",
    name: "Crossref DOI Resolution & Verifiability",
    status: unresolvable === 0 ? "pass" : unresolvable === 1 ? "warn" : "fail",
    detail: unresolvable === 0
      ? `All checked DOIs resolved successfully in the Crossref registry (${citationIntegrity.verifiedCount} verified).`
      : `${unresolvable} cited DOI(s) failed resolution in Crossref (potential broken link or unverified reference).`,
    actionableRecommendation: unresolvable > 0 ? "Verify DOI strings against publisher websites to ensure no trailing characters were truncated." : undefined,
  });

  const selfCit = citationIntegrity.selfCitationPercent;
  if (selfCit !== undefined && (citationIntegrity.checkedCount || 0) >= 8) {
    const isSelfWarn = selfCit > 25 && selfCit <= 40;
    const isSelfFail = selfCit > 40;
    items.push({
      id: "audit-self-citation",
      category: "Citations",
      name: "Author Self-Citation Density",
      status: isSelfFail ? "fail" : isSelfWarn ? "warn" : "pass",
      detail: `Self-citation rate is ${selfCit.toFixed(1)}% (${citationIntegrity.selfCitationNote || ""}). Standard academic ceiling is 25%.`,
      actionableRecommendation: isSelfFail || isSelfWarn ? "Diversify bibliography with third-party, independent peer-reviewed references." : undefined,
    });
  }

  const assertions = manuscript.empiricalCues?.causalAssertions || [];
  const hasExcessiveCausal = assertions.length >= 3;
  items.push({
    id: "audit-causal-hedging",
    category: "Language",
    name: "Causal Assertion Bounding & Hedging",
    status: hasExcessiveCausal ? "warn" : "pass",
    detail: hasExcessiveCausal
      ? `${assertions.length} strong causal assertions detected that may warrant methodological bounding or hedging.`
      : "Causal claims appear appropriately bounded or within standard scholarly density limits.",
    actionableRecommendation: hasExcessiveCausal ? "Add explicit epistemic hedging (e.g., 'results suggest', 'findings are consistent with') around non-experimental inferences." : undefined,
  });

  if (targetJournalEvaluation) {
    const isMismatch = targetJournalEvaluation.isDisciplinaryMismatch;
    items.push({
      id: "audit-scope-fit",
      category: "Scope",
      name: "Target Journal Remit & Disciplinary Alignment",
      status: isMismatch ? "fail" : "pass",
      detail: isMismatch
        ? `Severe disciplinary mismatch: Manuscript study area is ${detectedDiscipline || "different field"}, while target journal "${targetJournalEvaluation.journalName}" operates in ${targetJournalEvaluation.journalDiscipline}. High desk-rejection hazard.`
        : `Target journal "${targetJournalEvaluation.journalName}" scope is compatible with ${detectedDiscipline || "manuscript field"}.`,
      actionableRecommendation: isMismatch ? "Target an appropriate disciplinary journal to avoid immediate editorial desk rejection." : undefined,
    });
  }

  const passedCount = items.filter((i) => i.status === "pass").length;
  const warnCount = items.filter((i) => i.status === "warn").length;
  const failedCount = items.filter((i) => i.status === "fail").length;

  return {
    items,
    passedCount,
    warnCount,
    failedCount,
    summary: `Deterministic compliance audit completed across ${items.length} structural and reporting checkpoints: ${passedCount} passed, ${warnCount} warning(s), and ${failedCount} critical blocker(s).`,
  };
}
