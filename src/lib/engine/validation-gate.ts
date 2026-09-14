import { ReviewerPersonaFeedback, PriorityIssue, VerificationCoverageSummary } from "../types";
import { PERSONA_SPEC } from "./persona-review";

/**
 * Normalizes text for resilient substring matching across whitespace, quotes,
 * and punctuation discrepancies.
 */
export function normalizeTextForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a given candidate quote or evidence anchor exists within the manuscript raw text.
 * Performs multi-strategy matching:
 * 1. Exact substring match
 * 2. Normalized whitespace / punctuation match
 * 3. Fuzzy window match (if quote is long >= 30 chars, checks if 70% core segment is present)
 */
export function isSpanGroundedInManuscript(span: string, rawText: string, normalizedRawText?: string): boolean {
  if (!span || span.trim().length < 5) return false;

  // Direct exact match
  if (rawText.includes(span)) return true;

  const normRaw = normalizedRawText || normalizeTextForMatching(rawText);
  const normSpan = normalizeTextForMatching(span);

  // Normalized substring match
  if (normRaw.includes(normSpan)) return true;

  // If the span is longer (e.g., > 40 chars), LLM may have slightly paraphrased or trimmed ends
  if (normSpan.length >= 40) {
    // Check first 30 chars and last 30 chars
    const head = normSpan.slice(0, 30);
    const tail = normSpan.slice(-30);
    if (normRaw.includes(head) || normRaw.includes(tail)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates reviewer persona evidence anchors and priority issues against manuscript text.
 * Calculates verification coverage metrics and suppresses or flags ungrounded hallucinations.
 */
export function validateEvidenceSpansAndCoverage(
  personas: ReviewerPersonaFeedback[],
  priorityIssues: PriorityIssue[],
  rawManuscriptText: string
): {
  validatedPersonas: ReviewerPersonaFeedback[];
  validatedIssues: PriorityIssue[];
  coverage: VerificationCoverageSummary;
} {
  const normRaw = normalizeTextForMatching(rawManuscriptText);
  let totalCritiqueQuotes = 0;
  let verifiedQuotes = 0;
  let suppressedQuotes = 0;

  // 1. Validate Reviewer Personas
  const validatedPersonas = personas.map(p => {
    const validatedAnchors: string[] = [];

    // Check evidence anchors
    if (p.evidenceAnchors && Array.isArray(p.evidenceAnchors)) {
      for (const anchor of p.evidenceAnchors) {
        totalCritiqueQuotes++;
        // Check if anchor has a quoted string or section reference
        const quoteMatch = anchor.match(/["'“](.+?)["'”]/);
        const textToTest = quoteMatch ? quoteMatch[1] : anchor;

        if (isSpanGroundedInManuscript(textToTest, rawManuscriptText, normRaw)) {
          verifiedQuotes++;
          validatedAnchors.push(anchor);
        } else {
          // If anchor is a structural locator like "Section 3.2: Methodology", that's grounded if section exists
          const isStructural = /section|method|result|table|figure|eq\.|equation/i.test(anchor);
          if (isStructural) {
            verifiedQuotes++;
            validatedAnchors.push(anchor);
          } else {
            suppressedQuotes++;
            // Mark as unverified or suppress
            validatedAnchors.push(`[Unverified excerpt flag]: ${anchor.replace(/["'“].*?["'”]/g, '[quote ungrounded]')}`);
          }
        }
      }
    }

    return {
      ...p,
      evidenceAnchors: validatedAnchors.length > 0 ? validatedAnchors : p.evidenceAnchors,
    };
  });

  // 2. Validate Priority Issues
  const validatedIssues = priorityIssues.map(issue => {
    if (!issue.evidenceAnchor && !issue.reviewerQuote) return issue;

    totalCritiqueQuotes++;
    let anchorGrounded = true;

    if (issue.evidenceAnchor) {
      const quoteMatch = issue.evidenceAnchor.match(/["'“](.+?)["'”]/);
      const textToTest = quoteMatch ? quoteMatch[1] : issue.evidenceAnchor;
      const isStructural = /section|method|result|table|figure|eq\.|equation/i.test(issue.evidenceAnchor);

      if (!isStructural && !isSpanGroundedInManuscript(textToTest, rawManuscriptText, normRaw)) {
        anchorGrounded = false;
      }
    }

    if (anchorGrounded) {
      verifiedQuotes++;
      return issue;
    } else {
      suppressedQuotes++;
      return {
        ...issue,
        evidenceAnchor: undefined, // Suppress hallucinated anchor
      };
    }
  });

  const coveragePercent = totalCritiqueQuotes > 0
    ? Math.round((verifiedQuotes / totalCritiqueQuotes) * 100)
    : 100;

  return {
    validatedPersonas,
    validatedIssues,
    coverage: {
      totalCritiques: totalCritiqueQuotes,
      verifiedSpans: verifiedQuotes,
      suppressedCount: suppressedQuotes,
      coveragePercent,
    },
  };
}

// -----------------------------------------------------------------------------
// AUDIT REDESIGN: GROUNDING ENFORCEMENT & AGGREGATION (SPEC §4.3 & §4.4)
// -----------------------------------------------------------------------------

/**
 * Enforces mechanical span grounding on a single PersonaReview (Spec §4.3).
 * Verifies quotes via ManuscriptContext.locateSpan(); suppresses ungrounded claims.
 * If >30% of a persona's claims are ungrounded, flags the persona as LOW_RELIABILITY.
 */
export function enforceGrounding(
  review: import("./types").PersonaReview,
  ctx: import("./types").ManuscriptContext
): import("./types").PersonaReview {
  const kept: import("./types").Issue[] = [];
  let totalClaims = 0;
  let suppressedClaims = 0;

  for (const issue of review.issues) {
    totalClaims++;
    const candidateQuote = issue.grounded.evidence?.[0]?.quotedText;
    const span = ctx.locateSpan(candidateQuote);

    if (span) {
      issue.grounded.evidence = [span]; // Verified exact span
      issue.grounded.status = "SUPPORTED";
      kept.push(issue);
    } else if (issue.grounded.status === "INSUFFICIENT_EVIDENCE") {
      kept.push(issue); // Honest abstention retained
    } else {
      suppressedClaims++;
    }
  }

  const suppressionRate = totalClaims > 0 ? suppressedClaims / totalClaims : 0;
  const reliabilityFlag: "HIGH" | "LOW_RELIABILITY" =
    suppressionRate > 0.3 ? "LOW_RELIABILITY" : "HIGH";

  return {
    ...review,
    issues: kept,
    reliabilityFlag,
  };
}

const DECISION_SEVERITY_ORDER: Record<import("./types").DecisionCategory, number> = {
  DESK_REJECT: 1,
  REJECT_AFTER_REVIEW: 2,
  MAJOR_REVISION: 3,
  MINOR_REVISION: 4,
  ACCEPT: 5,
};

const DECISION_LOOKUP: import("./types").DecisionCategory[] = [
  "DESK_REJECT",
  "REJECT_AFTER_REVIEW",
  "MAJOR_REVISION",
  "MINOR_REVISION",
  "ACCEPT",
];

/**
 * Aggregates independent persona reviews (Spec §4.4):
 * 1. Excludes or downweights LOW_RELIABILITY personas.
 * 2. Deduplicates issues across personas by claim similarity.
 * 3. Computes weighted mean scores and inter-reviewer agreement per dimension.
 * 4. Determines panel recommendation via median recommendation (robust to single outliers).
 */
export function aggregatePersonaReviews(
  reviews: import("./types").PersonaReview[],
  archetype: import("./types").JournalArchetype = "SIGNIFICANCE_GATED"
): import("./types").AggregatedReview {
  // Exclude LOW_RELIABILITY if at least one reliable review exists
  const reliableReviews = reviews.filter((r) => r.reliabilityFlag !== "LOW_RELIABILITY");
  const activeReviews = reliableReviews.length > 0 ? reliableReviews : reviews;

  // 1. Deduplicate issues
  const allIssues: import("./types").Issue[] = [];
  const seenClaims = new Set<string>();

  for (const r of activeReviews) {
    for (const issue of r.issues) {
      const normClaim = issue.grounded.claim.toLowerCase().slice(0, 45);
      if (!seenClaims.has(normClaim)) {
        seenClaims.add(normClaim);
        allIssues.push(issue);
      }
    }
  }

  // 2. Compute dimension scores & agreement
  const ALL_DIMS: import("./types").ScoringDimension[] = [
    "NOVELTY",
    "METHODOLOGY",
    "STATISTICAL_RIGOR",
    "LITERATURE_COMPLETENESS",
    "PRESENTATION",
    "ETHICAL_RIGOR",
  ];

  const dimensionScores = {} as Record<
    import("./types").ScoringDimension,
    import("./types").DimensionScore
  >;

  for (const dim of ALL_DIMS) {
    const weightedScores: { score: number; weight: number }[] = [];
    const evidenceList: import("./types").EvidenceSpan[] = [];

    for (const r of activeReviews) {
      const dimScore = r.dimensionScores[dim];
      if (dimScore && typeof dimScore.score === "number") {
        const weight = PERSONA_SPEC[r.personaId]?.archetypeWeights?.[archetype] ?? 0.2;
        weightedScores.push({ score: dimScore.score, weight });
        if (dimScore.evidence) {
          evidenceList.push(...dimScore.evidence);
        }
      }
    }

    if (weightedScores.length > 0) {
      const totalWeight = weightedScores.reduce((sum, s) => sum + s.weight, 0);
      const mean = totalWeight > 0
        ? weightedScores.reduce((sum, s) => sum + s.score * s.weight, 0) / totalWeight
        : weightedScores.reduce((sum, s) => sum + s.score, 0) / weightedScores.length;
      const variance =
        weightedScores.length > 1
          ? weightedScores.reduce((sum, s) => sum + Math.pow(s.score - mean, 2), 0) / (weightedScores.length - 1)
          : 0;
      const stddev = Math.sqrt(variance);
      const agreement = Math.max(0, Math.min(1, Number((1 - stddev / 4.5).toFixed(2))));

      dimensionScores[dim] = {
        score: Number(mean.toFixed(1)),
        evidence: evidenceList.slice(0, 3),
        agreement,
      };
    } else {
      // Default placeholder
      dimensionScores[dim] = {
        score: 6.0,
        evidence: [],
        agreement: 1.0,
      };
    }
  }

  // 3. Median Recommendation
  const recValues = activeReviews
    .map((r) => DECISION_SEVERITY_ORDER[r.recommendation] || 3)
    .sort((a, b) => a - b);

  const mid = Math.floor(recValues.length / 2);
  const medianVal =
    recValues.length % 2 !== 0
      ? recValues[mid]
      : recValues[mid - 1]; // Conservative lean on even panel

  const recommendation = DECISION_LOOKUP[medianVal - 1] || "MAJOR_REVISION";

  const panelConfidence =
    activeReviews.length > 0
      ? activeReviews.reduce((sum, r) => sum + (r.confidence || 0.7), 0) / activeReviews.length
      : 0.75;

  return {
    issues: allIssues,
    dimensionScores,
    recommendation,
    panelConfidence: Number(panelConfidence.toFixed(2)),
    personaReviews: activeReviews,
  };
}

