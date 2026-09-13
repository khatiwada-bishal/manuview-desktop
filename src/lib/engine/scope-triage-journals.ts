import {
  findMatchingJournals,
  JOURNAL_CATALOG,
  MatchedJournalItem,
  TargetJournalTierResults,
  inferJournalDiscipline,
  isDisciplineMatch,
} from "../journals";
import { EditorialTriageOutcome, JournalRecommendation, PriorityIssue, ProviderConfig } from "../types";
import { JournalScopeProfile } from "../journal-scope-service";
import { callLLMForJson } from "./shared-utils";
import { LLMMessage, getSavedClientConfig } from "../llm";

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
 * Evaluates the manuscript's substantive scope against the designated target journal
 * using the configured LLM API (BYOK) for nuanced editorial triage.
 *
 * This explicitly handles Multidisciplinary journals (e.g., Nature, Science, PNAS, PLOS ONE),
 * where "Multidisciplinary" does NOT mean every paper is compatible:
 * - High-impact multidisciplinary venues require broad cross-disciplinary interest and transformative breakthroughs.
 * - Specialized, routine, or incremental studies are desk rejected despite the journal being multidisciplinary.
 * - If the LLM API is unavailable, it falls back to heuristic triage.
 */
export async function evaluateManuscriptScopeTriageWithLLM(
  title: string,
  abstract: string,
  targetJournalName?: string,
  providerConfig?: ProviderConfig,
  liveJournalScope?: JournalScopeProfile | null,
  keywords?: string,
  sampleSnippet?: string,
  onProgress?: (message: string) => void
): Promise<ScopeTriageResult> {
  // 1. Baseline heuristic analysis
  const baseResult = evaluateManuscriptScopeTriage(
    title,
    abstract,
    targetJournalName,
    undefined,
    liveJournalScope
  );

  if (!targetJournalName || !targetJournalName.trim()) {
    return baseResult;
  }

  const resolvedConfig = providerConfig || getSavedClientConfig();
  const hasKey = Boolean(resolvedConfig?.apiKey || resolvedConfig?.provider === "ollama");

  if (!hasKey) {
    // If no LLM credentials configured, return heuristic result
    return baseResult;
  }

  onProgress?.(`Consulting AI Handling Editor on aims & scope for "${targetJournalName}"...`);

  try {
    const cleanJournalName = liveJournalScope?.officialName || targetJournalName;
    const publisher = liveJournalScope?.publisher || "Academic Publisher";
    const discipline = liveJournalScope?.primaryDiscipline || baseResult.detectedDiscipline;
    const scopeSummary = liveJournalScope?.summaryScope || liveJournalScope?.aimsAndScope || "Scholarly journal";
    const concepts = liveJournalScope?.keyConcepts?.join(", ") || discipline;
    const impact = liveJournalScope?.impactMetric ? `Impact: ${liveJournalScope.impactMetric}` : "";

    const systemPrompt = `You are the Senior Handling Editor and Scope Triage Chair for the academic journal "${cleanJournalName}".
Your task is preliminary editorial screening (triage) before peer review to determine if this manuscript should be DESK REJECTED at the editorial office or if it is SUITABLE FOR EXTERNAL REVIEW.

CRITICAL EDITORIAL SCOPE POLICIES:
1. Multidisciplinary & Broad Journals (CRITICAL RULE):
   - A journal being "Multidisciplinary" (e.g., Nature, Science, PNAS, Nature Communications, PLOS ONE, Scientific Reports, Cell Reports) does NOT automatically make every paper compatible.
   - Elite general-interest journals (e.g. Nature, Science, PNAS) ONLY accept work of extraordinary, transformative general scientific significance commanding readership across multiple scientific fields. Routine, narrow, specialized, single-locality, or incremental disciplinary studies (e.g., standard case reports, localized surveys, narrow engineering optimization, incremental laboratory assays) MUST BE DESK REJECTED for lack of broad general interest, even if the methodology is sound.
   - Broad open-access multidisciplinary journals (e.g. PLOS ONE, Scientific Reports) focus on technical execution and data soundness, but still reject papers that lack primary empirical data, are purely speculative hypotheses/essays, or fail publication criteria.
2. Domain-Specific Journals:
   - Specialized journals (e.g. Nature Medicine, IEEE TPAMI, Journal of Financial Economics, Cancer Discovery) require direct relevance to their specific domain. A paper whose core methodology or findings do not address the journal's domain MUST BE DESK REJECTED.
3. Decisive Triage:
   - If the manuscript does not genuinely match the journal's remit or standard of general/field significance, you must issue an immediate "Desk Reject".
   - If the manuscript has clear scope compatibility and appropriate breadth, approve it as "Suitable for Review".

You must respond with a strict JSON object following this exact schema:
{
  "isScopeMatch": boolean,
  "decision": "Desk Reject" | "Suitable for Review",
  "deskRejectReason": "scope_mismatch" | "lacks_broad_multidisciplinary_interest" | "insufficient_general_significance" | "format_ineligible" | "none",
  "detectedDiscipline": "e.g. Operations Research & Management",
  "editorialSummary": "Professional 2-3 sentence editorial justification explaining the decision to the author.",
  "scopeContrast": {
    "journalRemit": "1-2 sentences on this journal's actual scope and readership criteria.",
    "manuscriptFocus": "1-2 sentences on this paper's substantive research topic.",
    "mismatchExplanation": "Detailed explanation of why the paper's scope or level of generality conflicts with the journal.",
    "suggestedVenues": ["3-4 specific journals that are a better thematic match"]
  }
}`;

    const userPrompt = `TARGET JOURNAL:
- Name: ${cleanJournalName}
- Publisher: ${publisher}
- Primary Field: ${discipline}
- Aims & Scope Summary: ${scopeSummary}
- Key Topics / Concepts: ${concepts}
${impact ? `- Metrics: ${impact}` : ""}

MANUSCRIPT DETAILS:
- Title: ${title}
- Abstract: ${abstract}
${keywords ? `- Keywords: ${keywords}` : ""}
${sampleSnippet ? `- Excerpt:\n${sampleSnippet.slice(0, 2000)}` : ""}

Please evaluate scope compatibility and return valid JSON.`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const llmRes = await callLLMForJson<{
      isScopeMatch: boolean;
      decision: "Desk Reject" | "Suitable for Review";
      deskRejectReason?: string;
      detectedDiscipline?: string;
      editorialSummary: string;
      scopeContrast?: {
        journalRemit?: string;
        manuscriptFocus?: string;
        mismatchExplanation?: string;
        suggestedVenues?: string[];
      };
    }>(messages, resolvedConfig);

    if (llmRes && typeof llmRes.isScopeMatch === "boolean") {
      const isTargetScopeMismatch = !llmRes.isScopeMatch;
      const detectedDiscipline = llmRes.detectedDiscipline || baseResult.detectedDiscipline;
      const manuscriptTopics = extractManuscriptTopics(title, abstract);

      const editorialTriage: EditorialTriageOutcome = isTargetScopeMismatch
        ? {
            outcome: "desk_reject",
            sentToPeerReview: false,
            deskRejectReason: (llmRes.deskRejectReason as any) || "scope_mismatch",
            handlingEditorDecision: "Desk Reject",
            summary:
              llmRes.editorialSummary ||
              `Desk rejected at editorial triage: "${cleanJournalName}" scope mismatch. Out-of-scope manuscripts do not proceed to peer review.`,
            scopeComparison: {
              manuscriptDiscipline: detectedDiscipline,
              manuscriptTopics,
              journalName: cleanJournalName,
              journalDiscipline: discipline,
              journalPublisher: publisher,
              journalScopeSummary: scopeSummary,
              journalKeyConcepts: liveJournalScope?.keyConcepts || [discipline],
              mismatchExplanation:
                llmRes.scopeContrast?.mismatchExplanation ||
                llmRes.editorialSummary ||
                `The manuscript's core research focus (${detectedDiscipline}) does not meet the editorial remit or breadth requirements of ${cleanJournalName}.`,
              isScopeMatch: false,
              suggestedVenues:
                llmRes.scopeContrast?.suggestedVenues && llmRes.scopeContrast.suggestedVenues.length > 0
                  ? llmRes.scopeContrast.suggestedVenues
                  : [baseResult.journalMatches.realistic.name, baseResult.journalMatches.reach.name, baseResult.journalMatches.fallback.name],
            },
          }
        : {
            outcome: "sent_for_review",
            sentToPeerReview: true,
            summary:
              llmRes.editorialSummary ||
              `Cleared editorial triage: aims & scope aligned with "${cleanJournalName}". Advanced to peer-review panel.`,
            scopeComparison: {
              manuscriptDiscipline: detectedDiscipline,
              manuscriptTopics,
              journalName: cleanJournalName,
              journalDiscipline: discipline,
              journalPublisher: publisher,
              journalScopeSummary: scopeSummary,
              journalKeyConcepts: liveJournalScope?.keyConcepts || [discipline],
              isScopeMatch: true,
            },
          };

      return {
        detectedDiscipline,
        isTargetScopeMismatch,
        editorialTriage,
        journalMatches: baseResult.journalMatches,
      };
    }
  } catch (err) {
    console.warn("LLM scope triage check failed, falling back to heuristic evaluation:", err);
  }

  // Fallback to base result
  return baseResult;
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
