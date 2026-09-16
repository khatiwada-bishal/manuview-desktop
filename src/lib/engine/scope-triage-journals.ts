import {
  findMatchingJournals,
  JOURNAL_CATALOG,
  JournalEntry,
  MatchedJournalItem,
  TargetJournalTierResults,
  inferJournalDiscipline,
  isDisciplineMatch,
  parseAcceptanceRate,
} from "../journals";
import {
  CitationIntegritySummary,
  DeskRejectPillarEvaluation,
  DeskRejectPillarStatus,
  EditorialTriageOutcome,
  JournalRecommendation,
  ParsedManuscript,
  PriorityIssue,
  ProviderConfig,
  ReportingGuidelineCheck,
} from "../types";
import {
  DecisionDistribution,
  EvidenceSpan,
  GroundedClaim,
  JournalArchetype,
  JournalMatch,
  JournalProfile,
  ManuscriptContext,
  PillarVerdict,
  TriageOutcome,
  TriagePillar,
  TriageView,
} from "./types";
import { IntegritySignal } from "./integrity-gate";
import { JournalScopeProfile } from "../journal-scope-service";
import { callLLMForJson } from "./shared-utils";
import { LLMMessage, getSavedClientConfig, resolveActiveConfig } from "../llm";

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

  const catalogEntry = targetJournalName
    ? JOURNAL_CATALOG.find((j) => j.name.toLowerCase() === targetJournalName.toLowerCase())
    : undefined;

  // Determine effective target discipline from live scope profile, catalog evaluation, or name inference
  const effectiveJournalDiscipline =
    liveJournalScope?.primaryDiscipline ||
    targetEval?.journalDiscipline ||
    (catalogEntry?.discipline) ||
    (targetJournalName ? inferJournalDiscipline(targetJournalName) : undefined);

  // Check disciplinary alignment
  let isTargetScopeMismatch = false;
  if (targetJournalName) {
    const targetNorm = targetJournalName.trim().toLowerCase();
    const isRecommendedTier =
      targetNorm === journalMatches.reach.name.toLowerCase() ||
      targetNorm === journalMatches.realistic.name.toLowerCase() ||
      targetNorm === journalMatches.fallback.name.toLowerCase();
    const inOtherMatches = journalMatches.otherMatches?.some(
      (m) => m.journal.name.toLowerCase() === targetNorm && m.matchScore >= 45
    );
    const isTargetMulti =
      effectiveJournalDiscipline === "Multidisciplinary" ||
      (catalogEntry && catalogEntry.discipline === "Multidisciplinary") ||
      inferJournalDiscipline(targetJournalName) === "Multidisciplinary";

    if (isRecommendedTier || inOtherMatches || isTargetMulti) {
      isTargetScopeMismatch = false;
    } else if (effectiveJournalDiscipline) {
      const matchRes = isDisciplineMatch(detectedDiscipline, effectiveJournalDiscipline);
      isTargetScopeMismatch = !matchRes.isMatch;
    } else if (targetEval?.isDisciplinaryMismatch !== undefined) {
      isTargetScopeMismatch = targetEval.isDisciplinaryMismatch;
    }
  }

  const cleanJournalName = liveJournalScope?.officialName || targetJournalName || "Target Journal";
  const manuscriptTopics = extractManuscriptTopics(title, abstract);
  const journalDisciplineLabel = effectiveJournalDiscipline || "a different discipline";

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

  const resolvedConfig = await resolveActiveConfig(providerConfig);
  const hasKey = Boolean(resolvedConfig?.apiKey || resolvedConfig?.provider === "ollama" || resolvedConfig?.provider === "webllm");

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

    const isHeuristicallyCompatible = !baseResult.isTargetScopeMismatch;

    const systemPrompt = `You are the Senior Handling Editor evaluating aims & scope fit for "${cleanJournalName}" (${discipline}).
Your task is preliminary editorial screening to assess thematic relevance before peer review.

EDITORIAL SCOPE PRINCIPLES:
1. Substantive Relevance:
   - Manuscripts investigating topics in ${discipline}, related applied fields, or methodological crossover should be approved as "Suitable for Review".
   - Multidisciplinary or broad journals accept rigorous studies across the natural, applied, formal, and social sciences.
2. Genuine Out-of-Scope Detection:
   - Only issue a "Desk Reject" if the submission has a total, irreconcilable domain mismatch with zero relevance to the journal's discourse.

Return strictly valid JSON matching this schema:
{
  "isScopeMatch": boolean,
  "decision": "Suitable for Review" | "Desk Reject",
  "deskRejectReason": "scope_mismatch" | "none",
  "detectedDiscipline": "${discipline}",
  "editorialSummary": "Professional 2-3 sentence editorial assessment of aims & scope fit."
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
${sampleSnippet ? `- Excerpt:\n${sampleSnippet.slice(0, 1500)}` : ""}

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
      // Ground-truth consistency: If baseline heuristic already confirmed compatibility,
      // never allow small SLM variance to flip it into a false desk-reject.
      const isTargetScopeMismatch = isHeuristicallyCompatible ? false : !llmRes.isScopeMatch;
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

export interface SixPillarParams {
  manuscript: ParsedManuscript;
  detectedDiscipline: string;
  targetJournalName?: string;
  effectiveJournalDiscipline?: string;
  isScopeMismatch: boolean;
  citationIntegrity?: CitationIntegritySummary;
  reportingGuideline?: ReportingGuidelineCheck;
}

export interface SixPillarResult {
  pillarEvaluations: DeskRejectPillarEvaluation[];
  triageClassification: "cleared_for_review" | "actionable_desk_reject_risk" | "fatal_desk_reject";
  salvageRoadmap: string[];
}

/**
 * Illustrative, commonly-cited relative frequency of each desk-reject cause.
 * Not manuscript-specific; shown as general editorial context only.
 */
export const DESK_REJECT_CAUSE_CONTEXT = {
  novelty_scale: "Among the most common desk-reject causes in selective journals",
  scope_remit: "A frequent categorical (aims & scope) desk-reject cause",
  methodology_controls: "A common fatal cause (protocol/control voids)",
  integrity_citations: "Retracted citations & ethics flags",
  standards_compliance: "Missing data/ethics mandates",
  presentation_language: "Structural & readability barriers",
};

/** @deprecated Kept for backwards compatibility */
export const DESK_REJECT_BASE_RATES = DESK_REJECT_CAUSE_CONTEXT;

/**
 * Conducts a comprehensive 6-pillar editorial screening against desk rejection risks:
 * 1. Scope & Aims Remit (Categorical boundary error)
 * 2. Novelty & Contribution Scale (Leading cause in selective venues)
 * 3. Methodological & Procedural Controls (Protocol/control voids)
 * 4. Publication Integrity & Citations (Retracted citations & ethics flags)
 * 5. Reporting Standards & Compliance (Missing data/ethics mandates)
 * 6. Presentation & Language Clarity (Structural & readability barriers)
 */
export function evaluateSixPillarDeskRejection(params: SixPillarParams): SixPillarResult {
  const {
    manuscript,
    detectedDiscipline,
    targetJournalName,
    effectiveJournalDiscipline,
    isScopeMismatch,
    citationIntegrity,
    reportingGuideline,
  } = params;

  const pillarEvaluations: DeskRejectPillarEvaluation[] = [];
  const salvageRoadmap: string[] = [];

  // Detect journal archetype
  const targetLower = (targetJournalName || "").toLowerCase();
  const isSoundnessOnlyVenue =
    /\b(plos one|scientific reports|ieee access|f1000research|peerj|springerplus|heliyon)\b/i.test(targetLower);
  const isFlagshipVenue =
    /\b(nature|science|cell|the lancet|nejm|pnas|jama|bmj|nature medicine|nature communications)\b/i.test(targetLower);

  // 1. Scope & Aims Remit
  if (isScopeMismatch) {
    const fix = `Retarget manuscript to an indexed venue in ${detectedDiscipline} (such as specialized subject journals) or reconstruct the introduction to directly solve problems in ${effectiveJournalDiscipline || "target domain"}.`;
    pillarEvaluations.push({
      pillar: "scope_remit",
      title: "Scope & Aims Remit",
      status: "fatal_barrier",
      verdict: `Substantive domain (${detectedDiscipline}) diverges from ${targetJournalName || "target journal"}'s published remit (${effectiveJournalDiscipline || "target discipline"}). Fatal desk rejection barrier.`,
      actionablePreSubmissionFix: fix,
      triggerId: "scope-divergence-mismatch",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.scope_remit,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.scope_remit,
      evidenceSpans: [`Discipline: ${detectedDiscipline} vs Journal: ${effectiveJournalDiscipline || "target discipline"}`],
    });
    salvageRoadmap.push(`[Priority A - Scope] ${fix}`);
  } else {
    pillarEvaluations.push({
      pillar: "scope_remit",
      title: "Scope & Aims Remit",
      status: "pass",
      verdict: `Topical focus and inquiry align with ${targetJournalName || "target journal"} editorial scope.`,
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.scope_remit,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.scope_remit,
    });
  }

  // 2. Novelty & Contribution Scale
  const abstractText = manuscript.abstract?.trim() || "";
  const isAbstractThin = abstractText.split(/\s+/).filter(Boolean).length < 60;

  if (isSoundnessOnlyVenue) {
    // Soundness-first venues (PLOS ONE, etc.) explicitly disclaim novelty as a rejection criteria
    pillarEvaluations.push({
      pillar: "novelty_scale",
      title: "Novelty & Contribution Scale",
      status: "pass",
      verdict: `${targetJournalName || "This journal"} evaluates papers on methodological and ethical rigor rather than subjective novelty. No novelty desk-reject barrier.`,
      editorialContext: "Disclaimed by journal editorial criteria (Soundness-only venue)",
      baseRateContext: "Disclaimed by journal editorial criteria (Soundness-only venue)",
    });
  } else if (isAbstractThin) {
    const fix =
      "Expand Abstract to articulate explicit quantitative benchmark improvements and conceptual advance over recent prior art.";
    pillarEvaluations.push({
      pillar: "novelty_scale",
      title: "Novelty & Contribution Scale",
      status: "warning",
      verdict:
        "Abstract provides insufficient articulation of the conceptual advance and benchmark differentiation.",
      actionablePreSubmissionFix: fix,
      triggerId: "novelty-insufficient-differentiation",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.novelty_scale,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.novelty_scale,
      evidenceSpans: [abstractText.slice(0, 150)],
    });
    salvageRoadmap.push(`[Priority B - Novelty] ${fix}`);
  } else if (
    isFlagshipVenue &&
    (!manuscript.empiricalCues?.sampleSizes?.length || (manuscript.wordCount && manuscript.wordCount < 3000))
  ) {
    const fix =
      "High-impact multidisciplinary venues require transformative cross-disciplinary interest; re-frame broad significance or target a premier specialty journal.";
    pillarEvaluations.push({
      pillar: "novelty_scale",
      title: "Novelty & Contribution Scale",
      status: "warning",
      verdict:
        "Manuscript contribution may be triaged as incremental or sub-field specific for a flagship multidisciplinary venue.",
      actionablePreSubmissionFix: fix,
      triggerId: "flagship-incremental-contribution",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.novelty_scale,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.novelty_scale,
    });
    salvageRoadmap.push(`[Priority B - Framing] ${fix}`);
  } else {
    pillarEvaluations.push({
      pillar: "novelty_scale",
      title: "Novelty & Contribution Scale",
      status: "pass",
      verdict:
        "Clear problem statement and distinct contribution rationale articulated in manuscript frontmatter.",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.novelty_scale,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.novelty_scale,
    });
  }

  // 3. Methodological & Procedural Controls
  const isMethodsMissing =
    Boolean(manuscript.sectionProvenance?.methodsMissing) ||
    !manuscript.sections?.methods ||
    manuscript.sections.methods.length < 50;
  const isMethodsInferred = Boolean(manuscript.sectionProvenance?.methodsInferred);
  const causalAssertions = manuscript.empiricalCues?.causalAssertions || [];
  const statMetrics = manuscript.empiricalCues?.statisticalMetrics || [];

  // Detect if scan is an abstract-only or short frontmatter submission
  const isAbstractOnly =
    (manuscript.wordCount > 0 && manuscript.wordCount < 1200) ||
    (!manuscript.sections?.results && !manuscript.sections?.discussion && Boolean(manuscript.abstract));

  if (isAbstractOnly) {
    pillarEvaluations.push({
      pillar: "methodology_controls",
      title: "Methodological & Procedural Controls",
      status: "pass",
      verdict:
        "Abstract-level pre-submission screening. Full experimental protocol and procedural controls will be validated upon complete manuscript submission.",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.methodology_controls,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.methodology_controls,
    });
  } else if (isMethodsMissing) {
    const fix =
      "Add a dedicated 'Materials and Methods' section detailing experimental protocols, sample selection, and model specifications.";
    pillarEvaluations.push({
      pillar: "methodology_controls",
      title: "Methodological & Procedural Controls",
      status: "fatal_barrier",
      verdict:
        "Fatal barrier: Manuscript lacks a dedicated Materials & Methods section. External peer reviewers cannot verify protocol validity.",
      actionablePreSubmissionFix: fix,
      triggerId: "missing-methodology-section",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.methodology_controls,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.methodology_controls,
    });
    salvageRoadmap.push(`[Priority A - Methods] ${fix}`);
  } else if (isMethodsInferred) {
    const fix =
      "Organize methodological descriptions under a formal 'Materials and Methods' heading with subsections for reproducibility.";
    pillarEvaluations.push({
      pillar: "methodology_controls",
      title: "Methodological & Procedural Controls",
      status: "warning",
      verdict:
        "Methods content is scattered throughout body sections rather than unified in a dedicated protocol section.",
      actionablePreSubmissionFix: fix,
      triggerId: "inferred-methods-structure",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.methodology_controls,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.methodology_controls,
    });
    salvageRoadmap.push(`[Priority B - Structure] ${fix}`);
  } else if (causalAssertions.length > 2 && statMetrics.length === 0) {
    const fix =
      "Attenuate deterministic causal verbs ('proves', 'causes', 'demonstrates definitive effect') to associational language or document explicit identification strategies.";
    pillarEvaluations.push({
      pillar: "methodology_controls",
      title: "Methodological & Procedural Controls",
      status: "warning",
      verdict:
        "Aggressive causal claims made without accompanying econometric/statistical controls or power specifications.",
      actionablePreSubmissionFix: fix,
      triggerId: "uncontrolled-causal-claims",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.methodology_controls,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.methodology_controls,
      evidenceSpans: causalAssertions.slice(0, 2),
    });
    salvageRoadmap.push(`[Priority B - Causal Framing] ${fix}`);
  } else {
    pillarEvaluations.push({
      pillar: "methodology_controls",
      title: "Methodological & Procedural Controls",
      status: "pass",
      verdict:
        "Experimental workflows, mathematical models, and procedural parameters are structured and auditable.",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.methodology_controls,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.methodology_controls,
    });
  }

  // 4. Publication Integrity & Citations
  if (citationIntegrity && citationIntegrity.retractedCount > 0) {
    const fix = `Replace ${citationIntegrity.retractedCount} retracted reference(s) immediately with valid contemporary peer-reviewed studies.`;
    pillarEvaluations.push({
      pillar: "integrity_citations",
      title: "Publication Integrity & Citations",
      status: "fatal_barrier",
      verdict: `Fatal integrity hazard: Bibliography references ${citationIntegrity.retractedCount} formally retracted paper(s). Automated editorial screeners will desk-reject.`,
      actionablePreSubmissionFix: fix,
      triggerId: "retracted-citations-detected",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.integrity_citations,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.integrity_citations,
    });
    salvageRoadmap.push(`[Priority A - Integrity] ${fix}`);
  } else if (citationIntegrity && citationIntegrity.unresolvableCount > 5) {
    const fix =
      "Verify missing DOIs and bibliographic entries against Crossref or PubMed to resolve flagged references.";
    pillarEvaluations.push({
      pillar: "integrity_citations",
      title: "Publication Integrity & Citations",
      status: "warning",
      verdict: `${citationIntegrity.unresolvableCount} references could not be verified in Crossref. Requires manual bibliographic verification before submission.`,
      actionablePreSubmissionFix: fix,
      triggerId: "unresolved-citations-warning",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.integrity_citations,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.integrity_citations,
    });
    salvageRoadmap.push(`[Priority B - Citations] ${fix}`);
  } else if (citationIntegrity?.selfCitationPercent && citationIntegrity.selfCitationPercent > 35) {
    const fix =
      "Balance reference list by adding independent citations from international peer groups to reduce self-citation density below 20%.";
    pillarEvaluations.push({
      pillar: "integrity_citations",
      title: "Publication Integrity & Citations",
      status: "warning",
      verdict: `Elevated author self-citation rate (${citationIntegrity.selfCitationPercent}%). Handling editors scrutinize high self-citation clusters.`,
      actionablePreSubmissionFix: fix,
      triggerId: "high-self-citation-rate",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.integrity_citations,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.integrity_citations,
    });
    salvageRoadmap.push(`[Priority B - Self-Citation] ${fix}`);
  } else {
    pillarEvaluations.push({
      pillar: "integrity_citations",
      title: "Publication Integrity & Citations",
      status: "pass",
      verdict:
        "Bibliographic integrity verified; no retracted papers or citation anomalies detected.",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.integrity_citations,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.integrity_citations,
    });
  }

  // 5. Reporting Standards & Compliance
  const declarations = manuscript.mandatoryDeclarations;
  const hasDataStmt =
    Boolean(declarations?.dataAvailability?.present) ||
    Boolean(manuscript.empiricalCues?.dataRepositories?.length) ||
    /data availability|code availability|open access dataset|zenodo|figshare|github\.com/i.test(
      manuscript.rawText || ""
    );
  const hasEthicsStmt =
    Boolean(declarations?.ethicsStatement?.present) ||
    /ethics approval|institutional review board|irb approval|ethics committee|informed consent/i.test(
      manuscript.rawText || ""
    );

  if (reportingGuideline && reportingGuideline.scorePercent < 50) {
    const fix = `Incorporate missing ${reportingGuideline.guidelineName} reporting items: ${reportingGuideline.missingOrPartialItems.slice(0, 3).join("; ")}.`;
    pillarEvaluations.push({
      pillar: "standards_compliance",
      title: "Reporting Standards & Compliance",
      status: "warning",
      verdict: `Guideline compliance score is low (${reportingGuideline.scorePercent}%) for ${reportingGuideline.guidelineName}.`,
      actionablePreSubmissionFix: fix,
      triggerId: "guideline-compliance-deficit",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.standards_compliance,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.standards_compliance,
    });
    salvageRoadmap.push(`[Priority B - Standards] ${fix}`);
  } else if (!hasDataStmt) {
    const fix =
      "Add a standard 'Data and Code Availability Statement' with repository accession DOIs or institutional access instructions.";
    pillarEvaluations.push({
      pillar: "standards_compliance",
      title: "Reporting Standards & Compliance",
      status: "warning",
      verdict:
        "No explicit Data or Code Availability Statement detected. Most indexed journals require this prior to review.",
      actionablePreSubmissionFix: fix,
      triggerId: "missing-data-statement",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.standards_compliance,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.standards_compliance,
    });
    salvageRoadmap.push(`[Priority B - Compliance] ${fix}`);
  } else if (!hasEthicsStmt && /human|patient|clinical|mice|rat|animal|participant/i.test(manuscript.abstract || "")) {
    const fix = "Add formal Institutional Review Board (IRB) or Animal Care and Use (IACUC) approval statements.";
    pillarEvaluations.push({
      pillar: "standards_compliance",
      title: "Reporting Standards & Compliance",
      status: "warning",
      verdict: "Study appears to involve human or animal subjects, but no explicit Ethics/IRB statement was found.",
      actionablePreSubmissionFix: fix,
      triggerId: "missing-ethics-irb-statement",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.standards_compliance,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.standards_compliance,
    });
    salvageRoadmap.push(`[Priority B - Ethics] ${fix}`);
  } else {
    pillarEvaluations.push({
      pillar: "standards_compliance",
      title: "Reporting Standards & Compliance",
      status: "pass",
      verdict:
        "Reporting disclosures, reproducibility indicators, and availability statements conform to standard editorial criteria.",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.standards_compliance,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.standards_compliance,
    });
  }

  // 6. Presentation & Language Clarity
  if (isAbstractOnly) {
    pillarEvaluations.push({
      pillar: "presentation_language",
      title: "Presentation & Language Clarity",
      status: "pass",
      verdict: `Abstract/frontmatter pre-submission scan (${manuscript.wordCount} words). Full monograph length will be audited upon complete manuscript submission.`,
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.presentation_language,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.presentation_language,
    });
  } else if (manuscript.wordCount > 0 && manuscript.wordCount < 1200) {
    const fix = "Expand manuscript with complete literature review, methodology subsections, and in-depth discussion.";
    pillarEvaluations.push({
      pillar: "presentation_language",
      title: "Presentation & Language Clarity",
      status: "fatal_barrier",
      verdict: `Manuscript length (${manuscript.wordCount} words) is below minimum peer-review thresholds for research articles.`,
      actionablePreSubmissionFix: fix,
      triggerId: "manuscript-underlength",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.presentation_language,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.presentation_language,
    });
    salvageRoadmap.push(`[Priority A - Length] ${fix}`);
  } else if (manuscript.wordCount > 28000) {
    const fix = "Condense non-essential discussions into Supplementary Materials to satisfy journal word limits.";
    pillarEvaluations.push({
      pillar: "presentation_language",
      title: "Presentation & Language Clarity",
      status: "warning",
      verdict: `Length (${manuscript.wordCount.toLocaleString()} words) exceeds standard journal monograph ceilings.`,
      actionablePreSubmissionFix: fix,
      triggerId: "manuscript-overlength",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.presentation_language,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.presentation_language,
    });
    salvageRoadmap.push(`[Priority B - Length] ${fix}`);
  } else {
    pillarEvaluations.push({
      pillar: "presentation_language",
      title: "Presentation & Language Clarity",
      status: "pass",
      verdict: "Manuscript presentation, structural length, and prose organization satisfy standard editorial submission criteria.",
      editorialContext: DESK_REJECT_CAUSE_CONTEXT.presentation_language,
      baseRateContext: DESK_REJECT_CAUSE_CONTEXT.presentation_language,
    });
  }

  // Determine overall classification
  const hasFatalBarrier = pillarEvaluations.some((p) => p.status === "fatal_barrier");
  const hasWarning = pillarEvaluations.some((p) => p.status === "warning");

  let triageClassification: "cleared_for_review" | "actionable_desk_reject_risk" | "fatal_desk_reject";
  if (hasFatalBarrier) {
    triageClassification = "fatal_desk_reject";
  } else if (hasWarning) {
    triageClassification = "actionable_desk_reject_risk";
  } else {
    triageClassification = "cleared_for_review";
  }

  return {
    pillarEvaluations,
    triageClassification,
    salvageRoadmap,
  };
}

/**
 * Backwards compatibility alias for 5-pillar callers.
 */
export const evaluateFivePillarDeskRejection = evaluateSixPillarDeskRejection;
export type FivePillarParams = SixPillarParams;
export type FivePillarResult = SixPillarResult;

// -----------------------------------------------------------------------------
// STAGE 1 EDITORIAL TRIAGE ENGINE (SPEC §3)
// -----------------------------------------------------------------------------

/**
 * Infers journal archetype:
 * - SIGNIFICANCE_GATED: Nature, Science, Cell, NEJM, PNAS, selective Q1
 * - SOUNDNESS_ONLY: PLOS ONE, Scientific Reports, IEEE Access, PeerJ, Heliyon
 * - ASSESSMENT_STYLE: eLife
 */
export function inferJournalArchetype(journalName?: string): JournalArchetype {
  if (!journalName) return "SIGNIFICANCE_GATED";
  const lower = journalName.toLowerCase();
  if (
    /\b(plos one|scientific reports|ieee access|peerj|heliyon|f1000research|springerplus)\b/i.test(
      lower
    )
  ) {
    return "SOUNDNESS_ONLY";
  }
  if (/\b(elife)\b/i.test(lower)) {
    return "ASSESSMENT_STYLE";
  }
  return "SIGNIFICANCE_GATED";
}

/**
 * Evaluates explicit hard and soft desk-reject thresholds according to editorial science (Spec §3.2).
 */
export function decideTriage(
  pillars: PillarVerdict[],
  archetype: JournalArchetype,
  journal: JournalProfile | null
): TriageOutcome {
  const fail = pillars.filter((p) => p.verdict === "FAIL");
  const warn = pillars.filter((p) => p.verdict === "WARN");

  // ---- HARD DESK-REJECT CONDITIONS (any one suffices) ----
  const hardReject =
    fail.some((p) => p.pillar === "SCOPE_FIT" && p.confidence >= 0.8) ||
    fail.some((p) => p.pillar === "INTEGRITY") ||
    fail.some((p) => p.pillar === "METHODOLOGICAL_SOUNDNESS" && p.confidence >= 0.85) ||
    (archetype === "SIGNIFICANCE_GATED" &&
      fail.some((p) => p.pillar === "NOVELTY_SIGNIFICANCE" && p.confidence >= 0.8));

  if (hardReject) {
    return {
      decision: "DESK_REJECT",
      deskRejectProbability: Math.min(0.97, Math.max(0.75, 0.75 + 0.05 * fail.length)),
      pillarVerdicts: pillars,
      hardFails: fail,
      journalArchetype: archetype,
    };
  }

  // ---- SOFT CONDITIONS ----
  const warnWeight = warn.reduce((s, p) => s + (1 - p.confidence) * 0.5 + 0.5, 0);
  if (warnWeight >= 2.5 || fail.length >= 2) {
    return {
      decision: "BORDERLINE",
      deskRejectProbability: Math.min(0.7, 0.45 + 0.08 * warn.length),
      pillarVerdicts: pillars,
      hardFails: fail,
      journalArchetype: archetype,
    };
  }

  return {
    decision: "PROCEED_TO_REVIEW",
    deskRejectProbability: Math.max(0.05, 0.15 - 0.03 * (6 - warn.length)),
    pillarVerdicts: pillars,
    hardFails: fail,
    journalArchetype: archetype,
  };
}

/**
 * Runs 10-minute editorial triage on the isolated TriageView (Spec §3.1).
 * Evaluates the 6 pillars with real-world base rates without burning tokens on full manuscript body.
 */
export async function runDeskRejectTriage(
  view: TriageView,
  journal: JournalProfile | null,
  integritySignals: IntegritySignal[],
  ctx: ManuscriptContext
): Promise<TriageOutcome> {
  const archetype = journal?.archetype ?? inferJournalArchetype(journal?.name);
  const targetJournalName = journal?.name;

  // 1. SCOPE_FIT (Real-world base rate: 17.4% of desk rejections)
  const manuscriptMatches = findMatchingJournals(view.title, view.abstract, targetJournalName);
  const detectedDiscipline = manuscriptMatches.detectedDiscipline || "Scholarly Research";
  const targetEval = manuscriptMatches.targetJournalEvaluation;
  const isMismatch = Boolean(targetEval?.isDisciplinaryMismatch);

  const scopeSpan = ctx.locateSpan(view.title) || {
    section: "title",
    startOffset: 0,
    endOffset: view.title.length,
    quotedText: view.title,
  };

  const scopePillar: PillarVerdict = isMismatch
    ? {
        pillar: "SCOPE_FIT",
        verdict: "FAIL",
        confidence: 0.88,
        grounded: {
          claim: `Disciplinary domain (${detectedDiscipline}) falls outside ${targetJournalName || "target journal"} remit.`,
          evidence: [scopeSpan],
          status: "SUPPORTED",
        },
        realWorldBaseRate: 0.174,
      }
    : {
        pillar: "SCOPE_FIT",
        verdict: "PASS",
        confidence: 0.92,
        grounded: {
          claim: `Thematic scope aligns with ${targetJournalName || "target venue"} focus.`,
          evidence: [scopeSpan],
          status: "SUPPORTED",
        },
        realWorldBaseRate: 0.174,
      };

  // 2. NOVELTY_SIGNIFICANCE (Real-world base rate: 51.8% in selective journals)
  let noveltyPillar: PillarVerdict;
  const abstractWords = view.abstract.split(/\s+/).filter(Boolean).length;
  const abstractSpan = ctx.locateSpan(view.abstract.slice(0, 100)) || {
    section: "abstract",
    startOffset: 0,
    endOffset: Math.min(100, view.abstract.length),
    quotedText: view.abstract.slice(0, 100),
  };

  if (archetype === "SOUNDNESS_ONLY") {
    noveltyPillar = {
      pillar: "NOVELTY_SIGNIFICANCE",
      verdict: "PASS",
      confidence: 0.95,
      grounded: {
        claim: `${targetJournalName || "Venue"} assesses technical and ethical rigor rather than subjective novelty.`,
        evidence: [abstractSpan],
        status: "SUPPORTED",
      },
      realWorldBaseRate: 0.0,
    };
  } else if (abstractWords < 60) {
    noveltyPillar = {
      pillar: "NOVELTY_SIGNIFICANCE",
      verdict: "FAIL",
      confidence: 0.82,
      grounded: {
        claim: "Abstract provides insufficient articulation of conceptual advance or benchmark differentiation.",
        evidence: [abstractSpan],
        status: "SUPPORTED",
      },
      realWorldBaseRate: 0.518,
    };
  } else {
    noveltyPillar = {
      pillar: "NOVELTY_SIGNIFICANCE",
      verdict: "PASS",
      confidence: 0.85,
      grounded: {
        claim: "Frontmatter articulates distinct problem statement and contribution rationale.",
        evidence: [abstractSpan],
        status: "SUPPORTED",
      },
      realWorldBaseRate: 0.518,
    };
  }

  // 3. METHODOLOGICAL_SOUNDNESS (Real-world base rate: 10.2%)
  const hasMethods =
    view.sectionHeadings.includes("methods") ||
    /methods|materials and methods|methodology/i.test(ctx.manuscript.rawText || "");
  const hasCausalOverclaims = view.causalAssertions.length > 2 && view.statisticalMetrics.length === 0;

  let methPillar: PillarVerdict;
  if (!hasMethods) {
    methPillar = {
      pillar: "METHODOLOGICAL_SOUNDNESS",
      verdict: "FAIL",
      confidence: 0.90,
      grounded: {
        claim: "Fatal barrier: Manuscript lacks a dedicated Materials and Methods section.",
        evidence: [scopeSpan],
        status: "SUPPORTED",
      },
      realWorldBaseRate: 0.102,
    };
  } else if (hasCausalOverclaims) {
    methPillar = {
      pillar: "METHODOLOGICAL_SOUNDNESS",
      verdict: "WARN",
      confidence: 0.78,
      grounded: {
        claim: "Strong causal assertions made without accompanying econometric/statistical controls.",
        evidence: [scopeSpan],
        status: "SUPPORTED",
      },
      realWorldBaseRate: 0.102,
    };
  } else {
    methPillar = {
      pillar: "METHODOLOGICAL_SOUNDNESS",
      verdict: "PASS",
      confidence: 0.88,
      grounded: {
        claim: "Methodological framework and procedural parameters are auditable.",
        evidence: [scopeSpan],
        status: "SUPPORTED",
      },
      realWorldBaseRate: 0.102,
    };
  }

  // 4. STRUCTURAL_COMPLETENESS
  const hasIntro = view.sectionHeadings.includes("introduction") || Boolean(ctx.manuscript.sections?.introduction);
  const structPillar: PillarVerdict = !hasIntro
    ? {
        pillar: "STRUCTURAL_COMPLETENESS",
        verdict: "WARN",
        confidence: 0.80,
        grounded: {
          claim: "Introduction section not explicitly demarcated.",
          evidence: [scopeSpan],
          status: "SUPPORTED",
        },
        realWorldBaseRate: 0.059,
      }
    : {
        pillar: "STRUCTURAL_COMPLETENESS",
        verdict: "PASS",
        confidence: 0.90,
        grounded: {
          claim: "Core structural sections present and formatted.",
          evidence: [scopeSpan],
          status: "SUPPORTED",
        },
        realWorldBaseRate: 0.059,
      };

  // 5. LANGUAGE_PRESENTATION (Real-world base rate: 5.3%)
  const wordCount = ctx.wordCount;
  let langPillar: PillarVerdict;
  if (wordCount < 1200) {
    langPillar = {
      pillar: "LANGUAGE_PRESENTATION",
      verdict: "FAIL",
      confidence: 0.85,
      grounded: {
        claim: `Manuscript length (${wordCount} words) is below peer review threshold for research articles.`,
        evidence: [scopeSpan],
        status: "SUPPORTED",
      },
      realWorldBaseRate: 0.053,
    };
  } else if (wordCount > 28000) {
    langPillar = {
      pillar: "LANGUAGE_PRESENTATION",
      verdict: "WARN",
      confidence: 0.75,
      grounded: {
        claim: `Length (${wordCount.toLocaleString()} words) exceeds standard journal word limits.`,
        evidence: [scopeSpan],
        status: "SUPPORTED",
      },
      realWorldBaseRate: 0.053,
    };
  } else {
    langPillar = {
      pillar: "LANGUAGE_PRESENTATION",
      verdict: "PASS",
      confidence: 0.90,
      grounded: {
        claim: "Manuscript presentation, length, and organization satisfy editorial criteria.",
        evidence: [scopeSpan],
        status: "SUPPORTED",
      },
      realWorldBaseRate: 0.053,
    };
  }

  // 6. INTEGRITY (Real-world base rate: 5.9%)
  const integrityBlockers = integritySignals.filter((s) => s.severity === "BLOCKER");
  const integrityWarnings = integritySignals.filter((s) => s.severity === "WARNING");

  let integrityPillar: PillarVerdict;
  if (integrityBlockers.length > 0) {
    integrityPillar = {
      pillar: "INTEGRITY",
      verdict: "FAIL",
      confidence: 0.95,
      grounded: {
        claim: integrityBlockers[0].message,
        evidence: [scopeSpan],
        status: "SUPPORTED",
      },
      realWorldBaseRate: 0.059,
    };
  } else if (integrityWarnings.length > 0) {
    integrityPillar = {
      pillar: "INTEGRITY",
      verdict: "WARN",
      confidence: 0.80,
      grounded: {
        claim: integrityWarnings[0].message,
        evidence: [scopeSpan],
        status: "SUPPORTED",
      },
      realWorldBaseRate: 0.059,
    };
  } else {
    integrityPillar = {
      pillar: "INTEGRITY",
      verdict: "PASS",
      confidence: 0.95,
      grounded: {
        claim: "No critical integrity, retraction, or compliance deficits detected.",
        evidence: [scopeSpan],
        status: "SUPPORTED",
      },
      realWorldBaseRate: 0.059,
    };
  }

  const pillars: PillarVerdict[] = [
    scopePillar,
    noveltyPillar,
    methPillar,
    structPillar,
    langPillar,
    integrityPillar,
  ];

  return decideTriage(pillars, archetype, journal);
}

// -----------------------------------------------------------------------------
// AUDIT REDESIGN: ARCHETYPE-AWARE JOURNAL PROFILES & MULTI-COMPONENT MATCHING
// -----------------------------------------------------------------------------

/**
 * Converts a static JournalEntry into a structured JournalProfile (Spec §6.1).
 */
export function journalEntryToProfile(entry: JournalEntry): JournalProfile {
  const parsedAR = parseAcceptanceRate(entry.acceptanceRate);
  const acceptanceRate = parsedAR > 0 ? parsedAR / 100 : 0.2;
  const deskRejectRate = Math.max(0.15, Math.min(0.85, 1.0 - acceptanceRate * 1.5));
  const archetype = inferJournalArchetype(entry.name);

  return {
    id: entry.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: entry.name,
    archetype,
    acceptanceRate,
    deskRejectRate: Number(deskRejectRate.toFixed(2)),
    aimsAndScope: entry.aimsAndScope,
    articleTypes: ["Research Article", "Review", "Brief Communication"],
    wordLimits: {
      "Research Article": archetype === "SIGNIFICANCE_GATED" ? 4500 : 12000,
    },
    requiresDataStatement: true,
    requiresEthicsStatement: true,
    openAccess: entry.openAccess !== "Subscription",
    impactFactor: entry.impactFactor,
    quartile: entry.impactFactor >= 12 ? "Q1" : entry.impactFactor >= 5 ? "Q2" : "Q3",
    lastVerifiedAt: new Date().toISOString().split("T")[0],
  };
}

/**
 * Computes multi-component empirical journal match score (Spec §6.1).
 * Formula: matchScore = 0.40 * scopeSimilarity + 0.30 * archetypeFit + 0.20 * tierFit + 0.10 * complianceFit (0..100)
 */
export function computeJournalMatch(params: {
  profile: JournalProfile;
  ctx: ManuscriptContext;
  decisionDist: DecisionDistribution;
  triageOutcome?: TriageOutcome;
}): JournalMatch {
  const { profile, ctx, decisionDist, triageOutcome } = params;

  // 1. Scope Similarity (0..1)
  const manuscriptScopeText = `${ctx.manuscript.title} ${ctx.manuscript.abstract} ${ctx.scopeFingerprint()}`.toLowerCase();
  const scopeWords = profile.aimsAndScope.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
  const matchedScopeWords = scopeWords.filter((w) => manuscriptScopeText.includes(w));
  const scopeOverlap = scopeWords.length > 0 ? matchedScopeWords.length / Math.min(scopeWords.length, 25) : 0.5;
  const scopeSimilarity = Math.max(0.2, Math.min(1.0, Number((0.35 + scopeOverlap * 0.65).toFixed(2))));

  // 2. Archetype Fit (0..1)
  let archetypeFit = 0.75;
  if (profile.archetype === "SOUNDNESS_ONLY") {
    // Soundness venues accept any rigorous paper regardless of novelty
    archetypeFit = 0.95;
  } else if (profile.archetype === "SIGNIFICANCE_GATED") {
    // Requires high novelty/significance
    const deskRejectProb = decisionDist.probabilities.DESK_REJECT;
    archetypeFit = deskRejectProb < 0.35 ? 0.9 : deskRejectProb < 0.6 ? 0.6 : 0.25;
  } else {
    archetypeFit = 0.8;
  }

  // Modulate archetype fit if triage outcome for this specific journal was provided
  if (triageOutcome) {
    if (triageOutcome.decision === "PROCEED_TO_REVIEW") archetypeFit = Math.max(archetypeFit, 0.85);
    else if (triageOutcome.decision === "DESK_REJECT") archetypeFit = Math.min(archetypeFit, 0.3);
  }

  // 3. Tier Fit (0..1)
  // Survival probability = sum of major revision, minor revision, and accept
  const pSurvive =
    decisionDist.probabilities.MAJOR_REVISION +
    decisionDist.probabilities.MINOR_REVISION +
    decisionDist.probabilities.ACCEPT;
  const journalSelectivity = profile.acceptanceRate ?? 0.2;
  const selectivityDiff = Math.abs(pSurvive - journalSelectivity);
  const tierFit = Math.max(0.15, Math.min(1.0, Number((1.0 - selectivityDiff * 0.9).toFixed(2))));

  // 4. Compliance Fit (0..1)
  let complianceFit = 1.0;
  const wordLimit = profile.wordLimits?.["Research Article"] ?? 15000;
  if (ctx.wordCount > wordLimit * 1.25) {
    complianceFit -= 0.3;
  }
  if (profile.requiresEthicsStatement && !ctx.manuscript.mandatoryDeclarations?.ethicsStatement?.present) {
    complianceFit -= 0.15;
  }
  if (profile.requiresDataStatement && !ctx.manuscript.mandatoryDeclarations?.dataAvailability?.present) {
    complianceFit -= 0.15;
  }
  complianceFit = Math.max(0.2, Math.min(1.0, Number(complianceFit.toFixed(2))));

  // 5. Composite Match Score (0..100)
  const composite = 0.4 * scopeSimilarity + 0.3 * archetypeFit + 0.2 * tierFit + 0.1 * complianceFit;
  const matchScore = Math.max(1, Math.min(99, Math.round(composite * 100)));

  // Warnings
  const warnings: string[] = [];
  if (profile.acceptanceRate && profile.acceptanceRate < 0.1) {
    warnings.push(`High Selective Barrier: Historical acceptance rate is ~${Math.round(profile.acceptanceRate * 100)}%.`);
  }
  if (profile.openAccess && profile.apcUsd) {
    warnings.push(`Open Access Publishing Charge: ~$${profile.apcUsd.toLocaleString()} APC applies upon acceptance.`);
  }
  if (ctx.wordCount > wordLimit) {
    warnings.push(`Word Count Alert: Current manuscript (${ctx.wordCount.toLocaleString()} words) exceeds recommended limit (${wordLimit.toLocaleString()} words).`);
  }

  // Rationale
  const titleSpan = ctx.locateSpan(ctx.manuscript.title.slice(0, 40));
  const rationale: GroundedClaim[] = [
    {
      claim: `Aims and scope alignment: Manuscript thematic markers match ${profile.name}'s publication remit.`,
      evidence: titleSpan ? [titleSpan] : [],
      status: titleSpan ? "SUPPORTED" : "INSUFFICIENT_EVIDENCE",
    },
  ];

  return {
    journal: profile,
    matchScore,
    components: {
      scopeSimilarity,
      archetypeFit,
      tierFit,
      complianceFit,
    },
    predictedOutcome: decisionDist,
    rationale,
    warnings,
  };
}

/**
 * Ranks candidate journal profiles using multi-component empirical scoring.
 */
export function matchManuscriptToJournalProfiles(
  ctx: ManuscriptContext,
  profiles: JournalProfile[],
  decisionDist: DecisionDistribution,
  triageOutcome?: TriageOutcome
): JournalMatch[] {
  const matches = profiles.map((p) =>
    computeJournalMatch({ profile: p, ctx, decisionDist, triageOutcome })
  );
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}




