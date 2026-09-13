import {
  findMatchingJournals,
  JOURNAL_CATALOG,
  MatchedJournalItem,
  TargetJournalTierResults,
  inferJournalDiscipline,
  isDisciplineMatch,
} from "../journals";
import { EditorialTriageOutcome, JournalRecommendation, PriorityIssue } from "../types";
import { JournalScopeProfile } from "../journal-scope-service";

/**
 * Extracts salient domain topics and keywords from manuscript title and abstract.
 */
export function extractManuscriptTopics(title: string, abstract: string): string[] {
  const combined = `${title} ${abstract}`.toLowerCase();
  const candidates = [
    "machine learning", "deep learning", "neural networks", "computer vision",
    "natural language processing", "optimization", "stochastic programming",
    "integer programming", "operations research", "supply chain", "causal inference",
    "oncology", "cancer", "immunotherapy", "biomarker", "clinical trial", "cardiovascular",
    "econometrics", "macroeconomics", "corporate finance", "asset pricing",
    "quantum computing", "bioinformatics", "genomics", "materials science", "robotics"
  ];
  const matched = candidates.filter((c) => combined.includes(c));
  if (matched.length > 0) {
    return matched.slice(0, 5);
  }
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !["using", "based", "study", "analysis", "approach", "novel", "towards"].includes(w.toLowerCase()));
  return words.slice(0, 4);
}

/**
 * Builds the canonical Priority-A "critical journal scope mismatch" issue.
 * Used when a manuscript's substantive field does not match the target journal.
 */
export function buildScopeMismatchIssue(params: {
  detectedDiscipline: string;
  targetJournalName: string;
  targetDiscipline: string;
  realisticJournalName?: string;
  /** Pass "" to suppress the quote (heuristic-offline mode); omit for the default. */
  reviewerQuote?: string;
}): PriorityIssue {
  const { detectedDiscipline, targetJournalName, targetDiscipline, realisticJournalName } = params;
  const reviewerQuote =
    params.reviewerQuote ??
    `'This submission is outside the editorial remit and readership interest of ${targetJournalName}. We strongly advise the authors to redirect their work to a suitable journal in ${detectedDiscipline}.'`;
  return {
    id: "iss-scope-mismatch",
    priority: "A",
    title: `Critical Journal Scope Mismatch (${detectedDiscipline} vs ${targetDiscipline})`,
    category: "Scope/Fit",
    description: `The manuscript's core research domain (${detectedDiscipline}) falls outside the published aims and scope of ${targetJournalName} (${targetDiscipline}). Submitting out-of-scope manuscripts is the primary cause of immediate editorial desk rejection without external review.`,
    location: "Target Journal Alignment",
    evidenceAnchor: `discipline-mismatch: ${detectedDiscipline} vs ${targetJournalName} [${targetDiscipline}]`,
    reviewerQuote,
    actionableFix: `Redirect submission to a domain-appropriate venue in ${detectedDiscipline} (such as ${realisticJournalName || "a journal in your field"}), or restructure the manuscript to directly address core problems in ${targetDiscipline}.`,
    rebuttalStrategy:
      "1. Retarget submission: Redirect to an indexed journal whose aims & scope align with your primary methodology and findings.\n2. Cross-disciplinary framing: If the paper has genuine cross-field application, explicitly rewrite the Abstract and Introduction to articulate direct relevance and methodological utility for the target journal's audience.",
    source: "heuristic",
  };
}

/**
 * Result of early scope triage screening before the main review pipeline.
 */
export interface ScopeTriageResult {
  detectedDiscipline: string;
  isTargetScopeMismatch: boolean;
  editorialTriage: EditorialTriageOutcome;
  journalMatches: TargetJournalTierResults;
}

/**
 * Evaluates the manuscript's substantive scope against the designated target journal.
 * In academic publishing, out-of-scope manuscripts trigger an immediate Editorial Desk Reject
 * during preliminary screening and are NEVER forwarded to external peer reviewers.
 */
export function evaluateManuscriptScopeTriage(
  title: string,
  abstract: string,
  targetJournalName?: string,
  citedJournals?: string[],
  liveJournalScope?: JournalScopeProfile | null
): ScopeTriageResult {
  const journalMatches = findMatchingJournals(title, abstract, targetJournalName, citedJournals);
  const detectedDiscipline = journalMatches.detectedDiscipline || "Scholarly Research";
  const targetEval = journalMatches.targetJournalEvaluation;

  // Determine effective target discipline from live scope profile, catalog evaluation, or name inference
  const effectiveJournalDiscipline =
    liveJournalScope?.primaryDiscipline ||
    targetEval?.journalDiscipline ||
    (targetJournalName ? inferJournalDiscipline(targetJournalName) : undefined);

  // Check disciplinary alignment
  let isTargetScopeMismatch = false;
  if (effectiveJournalDiscipline) {
    const matchRes = isDisciplineMatch(detectedDiscipline, effectiveJournalDiscipline);
    isTargetScopeMismatch = !matchRes.isMatch;
  } else if (targetEval?.isDisciplinaryMismatch !== undefined) {
    isTargetScopeMismatch = targetEval.isDisciplinaryMismatch;
  }

  const cleanJournalName = liveJournalScope?.officialName || targetJournalName || "Target Journal";
  const manuscriptTopics = extractManuscriptTopics(title, abstract);
  const journalDisciplineLabel = effectiveJournalDiscipline || "a different discipline";

  const catalogEntry = targetJournalName
    ? JOURNAL_CATALOG.find((j) => j.name.toLowerCase() === targetJournalName.toLowerCase())
    : undefined;

  const editorialTriage: EditorialTriageOutcome = isTargetScopeMismatch
    ? {
        outcome: "desk_reject",
        sentToPeerReview: false,
        deskRejectReason: "scope_mismatch",
        handlingEditorDecision: "Desk Reject",
        summary: `Desk rejected at editorial triage: "${cleanJournalName}" publishes in ${journalDisciplineLabel}${liveJournalScope?.publisher ? ` (${liveJournalScope.publisher})` : ""}, whereas this manuscript's substantive domain is ${detectedDiscipline}. Out-of-scope submissions are declined by the handling editor during initial screening and do not proceed to peer review. Redirect the work to a ${detectedDiscipline} venue before resubmitting.`,
        scopeComparison: {
          manuscriptDiscipline: detectedDiscipline,
          manuscriptTopics,
          journalName: cleanJournalName,
          journalDiscipline: journalDisciplineLabel,
          journalPublisher: liveJournalScope?.publisher || catalogEntry?.publisher,
          journalScopeSummary: liveJournalScope?.summaryScope || liveJournalScope?.aimsAndScope || catalogEntry?.aimsAndScope,
          journalKeyConcepts: liveJournalScope?.keyConcepts || [journalDisciplineLabel],
          mismatchExplanation: `The manuscript's core research domain (${detectedDiscipline}) falls outside the published aims and scope of ${cleanJournalName} (${journalDisciplineLabel}). Out-of-scope manuscripts face immediate editorial desk rejection without external referee assignment.`,
          isScopeMatch: false,
          suggestedVenues: [journalMatches.realistic.name, journalMatches.reach.name, journalMatches.fallback.name],
        },
      }
    : {
        outcome: "sent_for_review",
        sentToPeerReview: true,
        summary: `Cleared editorial triage (aims & scope aligned with "${cleanJournalName}" in ${journalDisciplineLabel}) and advanced to the peer-review panel for full evaluation.`,
        scopeComparison: targetJournalName
          ? {
              manuscriptDiscipline: detectedDiscipline,
              manuscriptTopics,
              journalName: cleanJournalName,
              journalDiscipline: journalDisciplineLabel,
              journalPublisher: liveJournalScope?.publisher || catalogEntry?.publisher,
              journalScopeSummary: liveJournalScope?.summaryScope || liveJournalScope?.aimsAndScope || catalogEntry?.aimsAndScope,
              journalKeyConcepts: liveJournalScope?.keyConcepts || [journalDisciplineLabel],
              isScopeMatch: true,
            }
          : undefined,
      };

  return {
    detectedDiscipline,
    isTargetScopeMismatch,
    editorialTriage,
    journalMatches,
  };
}

/**
 * Builds fallback catalog recommendations for Reach, Realistic, and Fallback tiers.
 */
export function buildCatalogJournalRecommendations(
  journalMatches: TargetJournalTierResults,
  detectedDiscipline: string
): JournalRecommendation[] {
  return [
    {
      tier: "Reach",
      journalName: journalMatches.reach.name,
      impactFactor: journalMatches.reach.impactFactor,
      publisher: journalMatches.reach.publisher || "Academic Publisher",
      fitScore: journalMatches.reachFitScore,
      scopeRationale: `Top-tier benchmark journal for high-impact research in ${detectedDiscipline}.`,
      rejectionRisks: [
        "Extremely high rejection rate (>85%) requires exceptional conceptual novelty and definitive causal proof.",
      ],
      requiredRevisionsForFit: [
        "Strengthen generalizability across multi-cohort samples and benchmark against current state-of-the-art literature.",
      ],
    },
    {
      tier: "Realistic",
      journalName: journalMatches.realistic.name,
      impactFactor: journalMatches.realistic.impactFactor,
      publisher: journalMatches.realistic.publisher || "Academic Publisher",
      fitScore: journalMatches.realisticFitScore,
      scopeRationale: `Primary indexed outlet with direct topical alignment for rigorous empirical research in ${detectedDiscipline}.`,
      rejectionRisks: [
        "Requires methodological transparency and pre-registered or explicitly justified control variables.",
      ],
      requiredRevisionsForFit: [
        "Provide explicit parameter sensitivity analyses and complete repository replication code.",
      ],
    },
    {
      tier: "Fallback",
      journalName: journalMatches.fallback.name,
      impactFactor: journalMatches.fallback.impactFactor,
      publisher: journalMatches.fallback.publisher || "Academic Publisher",
      fitScore: journalMatches.fallbackFitScore,
      scopeRationale: `High-acceptance, accessible specialty venue for validated studies and descriptive findings in ${detectedDiscipline}.`,
      rejectionRisks: [
        "May require formatting adjustments to fit specific methodological communication formats.",
      ],
      requiredRevisionsForFit: [
        "Ensure concise discussion of practical and translational applications.",
      ],
    },
  ];
}
