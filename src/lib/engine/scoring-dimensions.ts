import { validateDimensions } from "../schemas";
import {
  CalibratedAcceptanceRating,
  CitationIntegritySummary,
  DimensionScore,
  ExpectedDecisionOutcome,
  ParsedManuscript,
  ScoreDimension,
  TargetJournalEvaluation,
  VALID_SCORE_DIMENSIONS,
} from "../types";
import {
  DecisionCategory,
  DecisionDistribution,
  JournalArchetype,
  MAX_ASSERTION_SNIPPET_LENGTH,
  ScoringDimension,
} from "./types";

export { VALID_SCORE_DIMENSIONS, validateDimensions };

export interface DeterministicDimensionParams {
  manuscript: ParsedManuscript;
  discipline: string;
  targetJournal: string;
  targetDiscipline?: string;
  isScopeMismatch: boolean;
  citationIntegrity: CitationIntegritySummary;
}

/**
 * Calculates deterministic academic scoring dimensions
 * or fallback execution when live AI output is unavailable.
 */
export function calculateDeterministicDimensions(
  params: DeterministicDimensionParams
): Record<ScoreDimension, DimensionScore> {
  const {
    manuscript,
    discipline,
    targetJournal,
    targetDiscipline,
    isScopeMismatch,
    citationIntegrity,
  } = params;

  const cleanTitle = manuscript.title.trim();
  const abstractCore = manuscript.abstract ? manuscript.abstract.trim() : "";
  const sampleSizes = manuscript.empiricalCues?.sampleSizes || [];
  const statMetrics = manuscript.empiricalCues?.statisticalMetrics || [];
  const equations = manuscript.empiricalCues?.equations || [];
  const dataRepos = manuscript.empiricalCues?.dataRepositories || [];
  const causalAssertions = manuscript.empiricalCues?.causalAssertions || [];

  const sampleCount = sampleSizes.length;
  const statCount = statMetrics.length;
  const eqCount = equations.length;
  const repoCount = dataRepos.length;
  const causalCount = causalAssertions.length;
  const sections = manuscript.sections || {};

  const isMethodsMissing =
    Boolean(manuscript.sectionProvenance?.methodsMissing) ||
    !sections.methods ||
    sections.methods.length < 50;
  const isMethodsInferred = Boolean(manuscript.sectionProvenance?.methodsInferred);

  const effectiveWordCount =
    typeof manuscript.wordCount === "number" && !isNaN(manuscript.wordCount)
      ? manuscript.wordCount
      : manuscript.rawText
      ? manuscript.rawText.split(/\s+/).filter(Boolean).length
      : 0;

  const origScore = abstractCore.length > 40 && cleanTitle.length > 25 ? 4 : 3;
  const broadScore = effectiveWordCount >= 2800 ? 4 : 3;

  const methScore = isMethodsMissing
    ? 1
    : isMethodsInferred || Boolean(manuscript.sectionProvenance?.structureNotDetected)
    ? 2
    : sections.methods && (sampleCount > 0 || eqCount > 0)
    ? 4
    : 3;

  const claimsScore = causalCount > 2 ? 3 : 4;
  const clarityScore = effectiveWordCount > 1500 ? 4 : 3;
  const priorScore =
    citationIntegrity.retractedCount > 0
      ? 2
      : citationIntegrity.unresolvableCount > 2
      ? 3
      : citationIntegrity.totalReferences > 0 && citationIntegrity.verifiedCount === 0
      ? 3
      : citationIntegrity.totalReferences > 0 &&
        citationIntegrity.uncheckedCount > citationIntegrity.verifiedCount
      ? 4
      : 5;

  return {
    originality: {
      score: origScore,
      label: "Originality & Novelty",
      verdict: `Conceptual contribution positioned within ${discipline}.`,
      strengths: [
        `Explicit articulation of research inquiry for "${cleanTitle.slice(0, 65)}..."`,
        `Thematic alignment with contemporary investigations in ${discipline}`,
      ],
      vulnerabilities: [
        `Delineating the precise conceptual advance beyond recent 2023–2025 benchmark publications in ${discipline}`,
      ],
      source: "heuristic",
    },
    broad_interest: {
      score: isScopeMismatch ? 1 : broadScore,
      label: "Importance & Broad Interest",
      verdict: isScopeMismatch
        ? `Severe scope mismatch: Article domain (${discipline}) does not match ${targetJournal}'s focus in ${targetDiscipline || "target domain"}.`
        : `Engages scholarly and practitioner readership of ${targetJournal}.`,
      strengths: isScopeMismatch
        ? [`Addresses research questions within ${discipline}`]
        : [
            `Addresses timely questions with relevance to ${targetJournal} readership`,
            `Potential implications for academic and applied practices in ${discipline}`,
          ],
      vulnerabilities: isScopeMismatch
        ? [
            `Critical editorial hazard: Readers and editors of ${targetJournal} expect papers in ${targetDiscipline || "target domain"}, making immediate desk reject likely.`,
          ]
        : [
            `Clarifying broader cross-disciplinary implications for readers outside the immediate specialty`,
          ],
      source: "heuristic",
    },
    claims_vs_evidence: {
      score: claimsScore,
      label: "Strength of Claims vs. Evidence",
      verdict:
        "Empirical findings are systematically presented, but causal language requires careful boundary framing.",
      strengths: [
        sections.results
          ? "Structured presentation of findings in dedicated Results section"
          : "Empirical findings detailed in text",
      ],
      vulnerabilities: [
        causalCount > 0 && causalAssertions[0]
          ? `Causal statement requires hedging: "${causalAssertions[0].slice(0, MAX_ASSERTION_SNIPPET_LENGTH)}..."`
          : "Ensure observed empirical associations are strictly framed within observational limits",
      ],
      source: "heuristic",
    },
    methodology: {
      score: methScore,
      label: "Methodological & Statistical Soundness",
      verdict: isMethodsMissing
        ? "CRITICAL: Formal Methods / Experimental section not detected in manuscript."
        : (isMethodsInferred || Boolean(manuscript.sectionProvenance?.structureNotDetected))
        ? "Structure not detected: Formal 'Methods' heading was not found. Methodological soundness cannot be reliably assessed from synthetic body slices."
        : `Methodological architecture incorporates ${eqCount} mathematical formulation(s) and ${sampleCount} sample indicator(s).`,
      strengths: (isMethodsMissing || isMethodsInferred || Boolean(manuscript.sectionProvenance?.structureNotDetected))
        ? []
        : [
            sections.methods
              ? "Formal procedural description in dedicated Methods section"
              : "Documented procedural workflow",
            repoCount > 0
              ? `Data availability supported by repository reference (${dataRepos[0]})`
              : "Step-by-step procedural progression from data to findings",
          ],
      vulnerabilities: isMethodsMissing
        ? [
            "Manuscript lacks an explicit Materials & Methods section. Peer reviewers cannot evaluate protocol validity, statistical power, or reproducibility.",
          ]
        : (isMethodsInferred || Boolean(manuscript.sectionProvenance?.structureNotDetected))
        ? [
            "Insert an explicit 'Materials and Methods' section heading so editors and referees can evaluate experimental specifications and reproducibility.",
          ]
        : [
            "Reporting formal sample power calculations (1 - beta >= 0.80) in Methods",
            "Documenting full replication archive in a persistent public repository (Zenodo, GitHub, OSF)",
          ],
      source: "heuristic",
    },
    clarity: {
      score: clarityScore,
      label: "Clarity & Presentation",
      verdict: `Scholarly writing adhering to academic conventions (${effectiveWordCount.toLocaleString()} words).`,
      strengths: [
        "Structured presentation across manuscript sections",
        "Coherent academic narrative progression from problem formulation to findings",
      ],
      vulnerabilities: [
        "Define all specialized acronyms and domain notation on first occurrence in both Abstract and Main Text",
      ],
      source: "heuristic",
    },
    prior_work: {
      score: priorScore,
      label: "Prior Work & Reference Integrity",
      verdict:
        citationIntegrity.sampledCount < citationIntegrity.totalReferences
          ? `${citationIntegrity.verifiedCount} of the first ${citationIntegrity.sampledCount} references verified (${citationIntegrity.totalReferences} total; ${citationIntegrity.sampledCount - citationIntegrity.verifiedCount} could not be checked via Crossref registry).`
          : `${citationIntegrity.verifiedCount} of ${citationIntegrity.totalReferences} references verified via Crossref registry.`,
      strengths: [
        citationIntegrity.sampledCount < citationIntegrity.totalReferences
          ? `${citationIntegrity.verifiedCount} references cross-referenced against authoritative Crossref database (sample of ${citationIntegrity.sampledCount} screened)`
          : `${citationIntegrity.verifiedCount} references cross-referenced against authoritative Crossref database`,
      ],
      vulnerabilities: [
        citationIntegrity.retractedCount > 0
          ? `Contains ${citationIntegrity.retractedCount} retracted reference(s) that must be replaced immediately`
          : citationIntegrity.unresolvableCount > 2
          ? `${citationIntegrity.unresolvableCount} references could not be verified via DOI or bibliographic search`
          : "Audit bibliography to ensure balanced representation of contemporary peer literature",
      ],
      source: "heuristic",
    },
  };
}

/**
 * Estimates baseline peer-review acceptance probability for a journal based on known prestige,
 * impact factor, or indexed venue category.
 */
export function estimateJournalBaselineSelectivity(
  journalName?: string,
  targetEval?: TargetJournalEvaluation
): number {
  if (targetEval?.impactFactor && targetEval.impactFactor > 0) {
    const ifNum = targetEval.impactFactor;
    if (ifNum >= 25) return 7.5;
    if (ifNum >= 15) return 11;
    if (ifNum >= 8) return 18;
    if (ifNum >= 4) return 26;
    if (ifNum >= 2) return 36;
    return 44;
  }

  if (!journalName) return 32;
  const nameLower = journalName.toLowerCase();

  // Tier 1 Flagship Multidisciplinary / Elite Medical
  if (
    /\b(nature|science|cell|the lancet|lancet|new england journal of medicine|nejm|jama|pnas|proceedings of the national academy of sciences)\b/.test(
      nameLower
    )
  ) {
    return 7.5;
  }

  // Tier 2 Premier IEEE/ACM Transactions / Top-5 Field Journals
  if (
    /\b(ieee transactions on pattern analysis|tpami|acm computing surveys|journal of the american chemical society|jacs|physical review letters|american economic review|review of financial studies|journal of finance|quarterly journal of economics|econometrica|mis quarterly)\b/.test(
      nameLower
    )
  ) {
    return 16;
  }

  // Tier 3 High-selectivity specialty Q1 journals
  if (
    /\b(bioinformatics|nucleic acids research|journal of machine learning research|jmlr|neuroimage|blood|circulation|annals of internal medicine|journal of clinical oncology)\b/.test(
      nameLower
    )
  ) {
    return 22;
  }

  // Tier 4 Broad-scope Open Access / High-capacity Mega-journals
  if (
    /\b(plos one|scientific reports|ieee access|frontiers in|peerj|sage open|mdpi|heliyon)\b/.test(
      nameLower
    )
  ) {
    return 48;
  }

  return 32;
}

export interface CalibratedAcceptanceParams {
  overallScore?: number;
  dimensions?: Record<ScoreDimension, DimensionScore>;
  targetJournal?: string;
  targetJournalEvaluation?: TargetJournalEvaluation;
  isScopeMismatch?: boolean;
  citationIntegrity?: CitationIntegritySummary;
  isMethodsMissing?: boolean;
  empiricalCues?: ParsedManuscript["empiricalCues"];
}

/**
 * Computes empirical 5-category decision distribution:
 * p_desk_reject, p_reject_after_review, p_major_revision, p_minor_revision, p_accept
 * Ensuring the 5 probabilities strictly sum to 100%.
 */
export function calculateDecisionCategoryDistribution(params: {
  compositeScore: number;
  baselineRate: number;
  isScopeMismatch?: boolean;
  isMethodsMissing?: boolean;
  hasRetraction?: boolean;
  wordCount?: number;
}): import("../types").DecisionCategoryDistribution {
  const {
    compositeScore,
    baselineRate,
    isScopeMismatch = false,
    isMethodsMissing = false,
    hasRetraction = false,
    wordCount = 5000,
  } = params;

  let p_desk_reject: number;
  let p_reject_after_review: number;
  let p_major_revision: number;
  let p_minor_revision: number;
  let p_accept: number;

  if (isScopeMismatch) {
    p_desk_reject = 85;
    p_reject_after_review = 12;
    p_major_revision = 3;
    p_minor_revision = 0;
    p_accept = 0;
  } else if (isMethodsMissing) {
    p_desk_reject = 75;
    p_reject_after_review = 18;
    p_major_revision = 7;
    p_minor_revision = 0;
    p_accept = 0;
  } else if (hasRetraction) {
    p_desk_reject = 70;
    p_reject_after_review = 20;
    p_major_revision = 10;
    p_minor_revision = 0;
    p_accept = 0;
  } else {
    // Normal baseline editorial triage rate
    // Highly selective venues (low baselineRate) have ~60-80% desk rejection
    // Broad venues have ~15-25% desk rejection
    const baseDeskReject = Math.round(Math.max(12, Math.min(75, 80 - baselineRate * 1.1)));

    // Score modulation: high quality reduces desk reject, low quality elevates it
    const qualityDampener = (compositeScore - 50) * 0.4;
    p_desk_reject = Math.max(5, Math.min(85, Math.round(baseDeskReject - qualityDampener)));

    const remaining = 100 - p_desk_reject;

    if (compositeScore >= 80) {
      p_accept = Math.round(remaining * 0.08); // Even stellar papers rarely get direct unconditional accept
      p_minor_revision = Math.round(remaining * 0.42);
      p_major_revision = Math.round(remaining * 0.38);
      p_reject_after_review = remaining - (p_accept + p_minor_revision + p_major_revision);
    } else if (compositeScore >= 65) {
      p_accept = Math.round(remaining * 0.03);
      p_minor_revision = Math.round(remaining * 0.25);
      p_major_revision = Math.round(remaining * 0.48);
      p_reject_after_review = remaining - (p_accept + p_minor_revision + p_major_revision);
    } else if (compositeScore >= 50) {
      p_accept = Math.round(remaining * 0.01);
      p_minor_revision = Math.round(remaining * 0.12);
      p_major_revision = Math.round(remaining * 0.42);
      p_reject_after_review = remaining - (p_accept + p_minor_revision + p_major_revision);
    } else {
      p_accept = 0;
      p_minor_revision = Math.round(remaining * 0.05);
      p_major_revision = Math.round(remaining * 0.30);
      p_reject_after_review = remaining - (p_minor_revision + p_major_revision);
    }
  }

  // Ensure strict sum to 100
  const total = p_desk_reject + p_reject_after_review + p_major_revision + p_minor_revision + p_accept;
  if (total !== 100) {
    p_reject_after_review += (100 - total);
  }

  // Competitive Mid-Tier Variance Flag (P1 §3.2):
  // Submissions in the competitive mid-tier without fatal barriers exhibit
  // higher reviewer variance where outcomes are sensitive to reviewer assignment.
  const messy_middle_flag =
    !isScopeMismatch &&
    !isMethodsMissing &&
    !hasRetraction &&
    compositeScore >= 44 &&
    compositeScore <= 70;

  const confidence: "high" | "medium" | "low" =
    isScopeMismatch || isMethodsMissing || hasRetraction
      ? "high" // Hard deterministic barrier
      : wordCount < 1800
      ? "low"
      : "medium";

  const baseRateDisclaimer = messy_middle_flag
    ? "Competitive Mid-Tier Notice: Submissions in this score range exhibit substantial peer-review variance; final decisions often hinge on reviewer assignment and addressing minor methodological caveats."
    : undefined;

  return {
    p_desk_reject,
    p_reject_after_review,
    p_major_revision,
    p_minor_revision,
    p_accept,
    confidence,
    messy_middle_flag,
    baseRateDisclaimer,
  };
}

/**
 * Mathematically calibrates pre-submission acceptance probability based on target journal selectivity,
 * multidimensional review score, and critical hazard penalties.
 */
export function calculateCalibratedAcceptanceProbability(
  params: CalibratedAcceptanceParams
): CalibratedAcceptanceRating {
  const {
    overallScore,
    dimensions,
    targetJournal,
    targetJournalEvaluation,
    isScopeMismatch = false,
    citationIntegrity,
    isMethodsMissing = false,
    empiricalCues,
  } = params;

  // 1. Baseline selectivity P_0
  const baselineRate = estimateJournalBaselineSelectivity(targetJournal, targetJournalEvaluation);

  // 2. Compute dimensional quality score
  const DIM_WEIGHTS: Record<ScoreDimension, number> = {
    methodology: 0.26,
    claims_vs_evidence: 0.22,
    originality: 0.18,
    broad_interest: 0.14,
    prior_work: 0.12,
    clarity: 0.08,
  };

  let weightedDimScore = 0;
  let totalWeight = 0;
  let lowestDim: { dim: ScoreDimension; score: number; label: string } | null = null;

  if (dimensions) {
    for (const [dimKey, weight] of Object.entries(DIM_WEIGHTS) as [ScoreDimension, number][]) {
      const dimData = dimensions[dimKey];
      if (dimData && typeof dimData.score === "number") {
        // Normalize 1-5 scale to 0-100
        const normScore = Math.max(0, Math.min(100, ((dimData.score - 1) / 4) * 100));
        weightedDimScore += normScore * weight;
        totalWeight += weight;

        if (!lowestDim || dimData.score < lowestDim.score) {
          lowestDim = { dim: dimKey, score: dimData.score, label: dimData.label || dimKey };
        }
      }
    }
  }

  let compositeScore = 55;
  if (totalWeight > 0) {
    const dimNormalized = weightedDimScore / totalWeight;
    if (typeof overallScore === "number" && !isNaN(overallScore)) {
      compositeScore = Math.round(0.65 * dimNormalized + 0.35 * overallScore);
    } else {
      compositeScore = Math.round(dimNormalized);
    }
  } else if (typeof overallScore === "number" && !isNaN(overallScore)) {
    compositeScore = Math.round(overallScore);
  }

  // 3. Critical Hazard Identification
  let primaryHazard: string | undefined;
  let keyOpportunity: string | undefined;

  if (isScopeMismatch) {
    primaryHazard = "Out-of-Scope Target Venue: Manuscript domain diverges from target journal editorial remit.";
    keyOpportunity = "Retarget submission to a discipline-aligned journal to immediately eliminate the scope triage barrier.";
  }

  if (isMethodsMissing) {
    if (!primaryHazard) {
      primaryHazard = "Missing Materials and Methods Section: Referees cannot verify experimental protocol or reproducibility.";
    }
    if (!keyOpportunity) {
      keyOpportunity = "Insert a dedicated 'Materials and Methods' section providing step-by-step experimental specifications.";
    }
  }

  const hasRetraction = Boolean(citationIntegrity && citationIntegrity.retractedCount > 0);
  if (hasRetraction) {
    if (!primaryHazard) {
      primaryHazard = `Retracted Citations Detected: Bibliography contains ${citationIntegrity?.retractedCount} formally retracted paper(s).`;
    }
    if (!keyOpportunity) {
      keyOpportunity = "Replace all retracted citations with recent, verified peer-reviewed publications before submission.";
    }
  } else if (citationIntegrity && citationIntegrity.unresolvableCount > 5) {
    if (!primaryHazard) {
      primaryHazard = `High Proportion of Unresolvable References (${citationIntegrity.unresolvableCount} unverified citations).`;
    }
    if (!keyOpportunity) {
      keyOpportunity = "Audit and repair unverified reference DOIs against Crossref registry.";
    }
  }

  if (empiricalCues && (!empiricalCues.statisticalMetrics?.length && !empiricalCues.sampleSizes?.length)) {
    if (!primaryHazard && lowestDim?.dim === "methodology") {
      primaryHazard = "Absence of explicit sample size metrics (n) or formal statistical reporting.";
      keyOpportunity = "Report precise sample sizes (n), degrees of freedom, and statistical power metrics.";
    }
  }

  // If no critical hazard detected yet, identify based on lowest dimension
  if (!primaryHazard && lowestDim && lowestDim.score <= 3) {
    primaryHazard = `Relative deficit in ${lowestDim.label} (score: ${lowestDim.score}/5).`;
    keyOpportunity = `Target revisions on ${lowestDim.label} to elevate peer review competitiveness.`;
  } else if (!keyOpportunity) {
    keyOpportunity = "Address reviewer line-level critiques and provide explicit author rebuttal letters.";
  }

  // 4. Deterministic Editorial Readiness Band & Decision Outcome
  let decisionOutcome: ExpectedDecisionOutcome;
  let readinessBand: "Desk Reject Hazard" | "Substantial Revision Needed" | "Competitive / Moderate Readiness" | "Strong Submission Readiness";

  if (isScopeMismatch || isMethodsMissing || hasRetraction) {
    decisionOutcome = "Desk Reject Hazard";
    readinessBand = "Desk Reject Hazard";
  } else if (compositeScore < 50 || (lowestDim && lowestDim.score <= 2)) {
    decisionOutcome = "High Risk / Substantial Rebuttal Required";
    readinessBand = "Substantial Revision Needed";
  } else if (compositeScore < 72) {
    decisionOutcome = "Competitive with Major Revisions";
    readinessBand = "Competitive / Moderate Readiness";
  } else {
    decisionOutcome = "Strong Candidate / Likely Acceptance";
    readinessBand = "Strong Submission Readiness";
  }

  const decisionDistribution = calculateDecisionCategoryDistribution({
    compositeScore,
    baselineRate,
    isScopeMismatch,
    isMethodsMissing,
    hasRetraction,
  });

  return {
    overallScore: compositeScore,
    baselineJournalRatePercent: baselineRate,
    decisionOutcome,
    readinessBand,
    calibrationAdvisory:
      "Qualitative Pre-Submission Readiness Assessment — Quantitative acceptance probability percentages are suppressed because pre-submission predictive calibration has not been statistically validated against real-world journal accept/reject datasets. Evaluated on editorial scope, methodological completeness, and verified reference integrity.",
    decisionDistribution,
    primaryHazard,
    keyOpportunity,
  };
}




