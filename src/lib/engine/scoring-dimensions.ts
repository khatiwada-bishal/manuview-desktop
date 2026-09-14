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
 * Calculates deterministic academic scoring dimensions for heuristic/offline mode
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
    : isMethodsInferred
    ? sampleCount > 0 || eqCount > 0
      ? 3
      : 2
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
        : isMethodsInferred
        ? `Methodological narrative inferred from manuscript body (${eqCount} equation(s), ${sampleCount} sample indicator(s)); explicit 'Methods' heading was absent.`
        : `Methodological architecture incorporates ${eqCount} mathematical formulation(s) and ${sampleCount} sample indicator(s).`,
      strengths: isMethodsMissing
        ? []
        : [
            !isMethodsInferred && sections.methods
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
        : [
            isMethodsInferred
              ? "Insert an explicit 'Materials and Methods' section heading so editors and referees can immediately locate experimental specifications"
              : "Reporting formal sample power calculations (1 - beta >= 0.80) in Methods",
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

  // NeurIPS 2014 "Messy Middle" flag:
  // In empirical experiments, papers in the 42-68 score band with split assessments
  // had a 57% chance of receiving a flipped decision with another reviewer panel.
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
    ? "Messy Middle Range: Empirical peer-review studies (e.g. NeurIPS committee experiment) demonstrate that submissions in this competitive mid-tier experience significant reviewer variance, where final outcome hinges heavily on referee assignment."
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

  // 3. Dimensional Multiplier M_Q = (Score / 65)^2.2
  const dimensionalMultiplier = Math.max(
    0.05,
    Math.min(3.5, Math.pow(Math.max(1, compositeScore) / 65, 2.2))
  );

  // 4. Critical Hazard Multipliers
  let hazardMultiplier = 1.0;
  let primaryHazard: string | undefined;
  let keyOpportunity: string | undefined;

  if (isScopeMismatch) {
    hazardMultiplier *= 0.05;
    primaryHazard = "Out-of-Scope Target Venue: Manuscript domain diverges from target journal editorial remit.";
    keyOpportunity = "Retarget submission to a discipline-aligned journal to immediately eliminate the 95% scope triage barrier.";
  }

  if (isMethodsMissing) {
    hazardMultiplier *= 0.20;
    if (!primaryHazard) {
      primaryHazard = "Missing Materials and Methods Section: Referees cannot verify experimental protocol or reproducibility.";
    }
    if (!keyOpportunity) {
      keyOpportunity = "Insert a dedicated 'Materials and Methods' section providing step-by-step experimental specifications.";
    }
  }

  const hasRetraction = Boolean(citationIntegrity && citationIntegrity.retractedCount > 0);
  if (hasRetraction) {
    hazardMultiplier *= 0.35;
    if (!primaryHazard) {
      primaryHazard = `Retracted Citations Detected: Bibliography contains ${citationIntegrity?.retractedCount} formally retracted paper(s).`;
    }
    if (!keyOpportunity) {
      keyOpportunity = "Replace all retracted citations with recent, verified peer-reviewed publications before submission.";
    }
  } else if (citationIntegrity && citationIntegrity.unresolvableCount > 5) {
    hazardMultiplier *= 0.75;
    if (!primaryHazard) {
      primaryHazard = `High Proportion of Unresolvable References (${citationIntegrity.unresolvableCount} unverified citations).`;
    }
    if (!keyOpportunity) {
      keyOpportunity = "Audit and repair unverified reference DOIs against Crossref registry.";
    }
  }

  if (empiricalCues && (!empiricalCues.statisticalMetrics?.length && !empiricalCues.sampleSizes?.length)) {
    hazardMultiplier *= 0.85;
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

  // 5. Calibrated Acceptance Probability
  const rawProb = baselineRate * dimensionalMultiplier * hazardMultiplier;
  const calibratedProb = Math.max(1, Math.min(95, Math.round(rawProb)));

  // 6. Confidence bounds range
  const halfWidth = Math.max(2, Math.min(7, Math.round(calibratedProb * 0.18)));
  const probabilityRange: [number, number] = [
    Math.max(1, calibratedProb - halfWidth),
    Math.min(99, calibratedProb + halfWidth),
  ];

  // 7. Decision Outcome
  let decisionOutcome: ExpectedDecisionOutcome;
  if (calibratedProb < 10 || isScopeMismatch || isMethodsMissing) {
    decisionOutcome = "Desk Reject Hazard";
  } else if (calibratedProb < 25) {
    decisionOutcome = "High Risk / Substantial Rebuttal Required";
  } else if (calibratedProb < 55) {
    decisionOutcome = "Competitive with Major Revisions";
  } else {
    decisionOutcome = "Strong Candidate / Likely Acceptance";
  }

  // 8. 5-Category Probability Distribution
  const decisionDistribution = calculateDecisionCategoryDistribution({
    compositeScore,
    baselineRate,
    isScopeMismatch,
    isMethodsMissing,
    hasRetraction,
  });

  return {
    overallScore: compositeScore,
    acceptanceProbabilityPercent: calibratedProb,
    probabilityRange,
    baselineJournalRatePercent: baselineRate,
    decisionOutcome,
    decisionDistribution,
    dimensionalMultiplier: Number(dimensionalMultiplier.toFixed(2)),
    hazardPenaltyMultiplier: Number(hazardMultiplier.toFixed(2)),
    primaryHazard,
    keyOpportunity,
  };
}

// -----------------------------------------------------------------------------
// AUDIT REDESIGN: BEHAVIORAL ANCHORS, LENIENCY CORRECTION & CALIBRATED DISTRIBUTION
// -----------------------------------------------------------------------------

export const BEHAVIORAL_ANCHORS: Record<
  ScoringDimension,
  {
    "1-2": string;
    "3-4": string;
    "5-6": string;
    "7-8": string;
    "9-10": string;
  }
> = {
  NOVELTY: {
    "9-10": "Paradigm-shifting conceptual or empirical advance opening a new area of inquiry.",
    "7-8": "Substantive conceptual advance that resolves known ambiguities or outperforms contemporary benchmarks.",
    "5-6": "Incremental refinement or extension of established frameworks; solid utility but limited conceptual leap.",
    "3-4": "Marginal variation with negligible differentiation from existing 2023-2025 published literature.",
    "1-2": "Derivative replication lacking demonstrable novelty or conceptual contribution.",
  },
  METHODOLOGY: {
    "9-10": "Gold-standard protocol: preregistered, exhaustive controls, validated instrumentation, and fully open artifacts.",
    "7-8": "Methodologically rigorous design with minor parameter caveats; fully reproducible with standard effort.",
    "5-6": "Plausible workflow, but key baseline controls, ablations, or hyperparameter details are underspecified.",
    "3-4": "Severe confounding, uncalibrated instruments, high risk of bias, or missing negative controls.",
    "1-2": "Fatal protocol flaw, invalid study design, or missing Materials and Methods section.",
  },
  STATISTICAL_RIGOR: {
    "9-10": "A-priori power calculation, 95% CIs for all estimates, exact p-values, and FDR multiplicity control.",
    "7-8": "Appropriate inferential tests with confidence intervals and effect sizes; minor multiplicity caveats.",
    "5-6": "Bare p-values without confidence intervals or effect sizes; multiple comparisons uncorrected.",
    "3-4": "Underpowered cohort without justification, or p-value contradictory with reported confidence interval.",
    "1-2": "P-hacking signatures, fabricated degrees of freedom, or total absence of quantitative uncertainty metrics.",
  },
  LITERATURE_COMPLETENESS: {
    "9-10": "Exemplary synthesis of foundational and contemporary (2023-2025) literature with nuanced positioning.",
    "7-8": "Solid coverage of core frameworks; minor omissions of secondary preprints or non-English studies.",
    "5-6": "Omits key competitive baselines or rival hypotheses; citation distribution is somewhat narrow.",
    "3-4": "Heavily biased citations, excessive self-citation (>25%), or reliance on superseded literature.",
    "1-2": "Cites retracted papers without acknowledgement or exhibits complete blindness to domain state-of-the-art.",
  },
  PRESENTATION: {
    "9-10": "Flawless scholarly prose, intuitive publication-grade data visualizations, and clear caption legends.",
    "7-8": "Clear, readable academic organization with minor typographical or formatting blemishes.",
    "5-6": "Dense, ambiguous phrasing; undefined acronyms; cluttered or low-resolution figures.",
    "3-4": "Obscure narrative structure, inconsistent notation across sections, or illegible diagrams.",
    "1-2": "Incoherent prose, severe fragmentation, or language barriers preventing substantive peer review.",
  },
  ETHICAL_RIGOR: {
    "9-10": "Explicit IRB/ethics protocol, informed consent, FAIR data repository DOI, and full COI disclosure.",
    "7-8": "Declared ethics compliance and data availability; minor missing accession details.",
    "5-6": "Generic statements ('data available on request'); ethics committee approval details unspecified.",
    "3-4": "Omitted IRB protocol for human/animal subjects or undisclosed commercial competing interests.",
    "1-2": "Severe compliance breach, tortured phrases / text synthesis artifacts, or research misconduct indicators.",
  },
};

export const DEFAULT_LENIENCY_CORRECTION = 0.60;

/**
 * Corrects for systematic LLM scoring leniency (+0.4 to +0.8 bias documented in empirical evaluations).
 */
export function applyLeniencyCorrection(
  score: number,
  bias: number = DEFAULT_LENIENCY_CORRECTION
): number {
  return Math.max(1.0, Math.min(10.0, Number((score - bias).toFixed(1))));
}

/**
 * Empirical Bayesian shrinkage pulling observed quality estimates toward venue base rates.
 * p_calibrated = (1 - alpha) * p_observed + alpha * baseRate
 */
export function applyBaseRateShrinkage(
  pObserved: number,
  baseRate: number,
  alpha: number = 0.50
): number {
  const result = (1 - alpha) * pObserved + alpha * baseRate;
  return Math.max(0.001, Math.min(0.999, Number(result.toFixed(3))));
}

/**
 * Implements critical issue caps (Spec §5.2).
 * When critical issues are present (e.g. fatal methodological flaw, retracted citations),
 * positive outcomes (ACCEPT and MINOR_REVISION) are capped at (0.15 / criticalCount).
 * The surplus probability is shifted to REJECT_AFTER_REVIEW or DESK_REJECT.
 */
export function applyCriticalIssueCaps(
  probs: Record<DecisionCategory, number>,
  criticalCount: number
): Record<DecisionCategory, number> {
  if (criticalCount <= 0) return { ...probs };

  const cap = Math.min(0.15, Number((0.15 / criticalCount).toFixed(3)));
  let excess = 0;

  const result = { ...probs };

  if (result.ACCEPT > cap * 0.2) {
    excess += result.ACCEPT - cap * 0.2;
    result.ACCEPT = Number((cap * 0.2).toFixed(3));
  }
  if (result.MINOR_REVISION > cap * 0.8) {
    excess += result.MINOR_REVISION - cap * 0.8;
    result.MINOR_REVISION = Number((cap * 0.8).toFixed(3));
  }

  // Shift excess to REJECT_AFTER_REVIEW and DESK_REJECT
  result.REJECT_AFTER_REVIEW = Number((result.REJECT_AFTER_REVIEW + excess * 0.7).toFixed(3));
  result.DESK_REJECT = Number((result.DESK_REJECT + excess * 0.3).toFixed(3));

  // Re-normalize to exactly 1.000
  const sum = Object.values(result).reduce((a, b) => a + b, 0);
  if (sum > 0 && Math.abs(sum - 1.0) > 0.0001) {
    result.REJECT_AFTER_REVIEW = Number((result.REJECT_AFTER_REVIEW + (1.0 - sum)).toFixed(3));
  }

  return result;
}

export interface CalibrateDecisionDistributionParams {
  rawCompositeScore: number; // 0..100 or 1..10
  baselineRate?: number; // 0..1, e.g. 0.08 for Nature, 0.48 for PLOS ONE
  targetJournal?: string;
  archetype?: JournalArchetype;
  criticalCount?: number;
  isScopeMismatch?: boolean;
  isMethodsMissing?: boolean;
  hasRetraction?: boolean;
  leniencyCorrection?: number;
  modelVersion?: string;
}

/**
 * Calibrates the discrete 5-category decision distribution anchored to venue selectivity base rates
 * and modulated by empirical leniency correction and critical defect caps (Spec §5.1 & §5.2).
 */
export function calibrateDecisionDistribution(
  params: CalibrateDecisionDistributionParams
): DecisionDistribution {
  const {
    rawCompositeScore,
    baselineRate = 0.25,
    criticalCount = 0,
    isScopeMismatch = false,
    isMethodsMissing = false,
    hasRetraction = false,
    leniencyCorrection = DEFAULT_LENIENCY_CORRECTION,
    modelVersion = "manuview-calibrated-v2",
  } = params;

  // Normalize composite score to 0..100
  const score100 = rawCompositeScore <= 10 ? (rawCompositeScore - 1) * 11.11 : rawCompositeScore;
  // Apply leniency adjustment to effective score (subtracted bias term)
  const adjustedScore = Math.max(0, Math.min(100, score100 - leniencyCorrection * 10));

  let probs: Record<DecisionCategory, number>;

  if (isScopeMismatch) {
    probs = {
      DESK_REJECT: 0.88,
      REJECT_AFTER_REVIEW: 0.09,
      MAJOR_REVISION: 0.03,
      MINOR_REVISION: 0.0,
      ACCEPT: 0.0,
    };
  } else if (isMethodsMissing) {
    probs = {
      DESK_REJECT: 0.78,
      REJECT_AFTER_REVIEW: 0.16,
      MAJOR_REVISION: 0.06,
      MINOR_REVISION: 0.0,
      ACCEPT: 0.0,
    };
  } else if (hasRetraction) {
    probs = {
      DESK_REJECT: 0.72,
      REJECT_AFTER_REVIEW: 0.20,
      MAJOR_REVISION: 0.08,
      MINOR_REVISION: 0.0,
      ACCEPT: 0.0,
    };
  } else {
    // Base desk-reject rate derived from venue baseline selectivity
    const venueDeskRate = Math.max(0.12, Math.min(0.80, 0.82 - baselineRate * 1.15));
    // Quality dampener: higher adjustedScore reduces desk reject
    const qualityDampener = ((adjustedScore - 50) / 100) * 0.45;
    const pDesk = Math.max(0.05, Math.min(0.85, venueDeskRate - qualityDampener));

    const rem = 1.0 - pDesk;

    let pAccept: number;
    let pMinor: number;
    let pMajor: number;
    let pReject: number;

    if (adjustedScore >= 80) {
      pAccept = rem * 0.08;
      pMinor = rem * 0.42;
      pMajor = rem * 0.36;
      pReject = rem - (pAccept + pMinor + pMajor);
    } else if (adjustedScore >= 65) {
      pAccept = rem * 0.03;
      pMinor = rem * 0.26;
      pMajor = rem * 0.46;
      pReject = rem - (pAccept + pMinor + pMajor);
    } else if (adjustedScore >= 50) {
      pAccept = rem * 0.01;
      pMinor = rem * 0.12;
      pMajor = rem * 0.45;
      pReject = rem - (pAccept + pMinor + pMajor);
    } else {
      pAccept = 0.0;
      pMinor = rem * 0.04;
      pMajor = rem * 0.32;
      pReject = rem - (pMinor + pMajor);
    }

    // Shrink positive outcome with venue baseline rate
    pAccept = applyBaseRateShrinkage(pAccept, baselineRate * 0.1, 0.4);
    pMinor = applyBaseRateShrinkage(pMinor, baselineRate * 0.4, 0.4);

    probs = {
      DESK_REJECT: Number(pDesk.toFixed(3)),
      REJECT_AFTER_REVIEW: Number(pReject.toFixed(3)),
      MAJOR_REVISION: Number(pMajor.toFixed(3)),
      MINOR_REVISION: Number(pMinor.toFixed(3)),
      ACCEPT: Number(pAccept.toFixed(3)),
    };
  }

  // Apply critical issue caps
  if (criticalCount > 0) {
    probs = applyCriticalIssueCaps(probs, criticalCount);
  }

  // Ensure strict sum to 1.000
  const sum = Object.values(probs).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.0001) {
    probs.REJECT_AFTER_REVIEW = Number((probs.REJECT_AFTER_REVIEW + (1.0 - sum)).toFixed(3));
  }

  // Messy middle flag: activated when score is in the competitive mid-tier (42..68)
  // and no deterministic barrier exists
  const messyMiddle =
    !isScopeMismatch &&
    !isMethodsMissing &&
    !hasRetraction &&
    criticalCount === 0 &&
    adjustedScore >= 42 &&
    adjustedScore <= 68;

  return {
    probabilities: probs,
    calibration: {
      baseRateUsed: baselineRate,
      leniencyCorrection,
      modelVersion,
    },
    messyMiddle,
  };
}



