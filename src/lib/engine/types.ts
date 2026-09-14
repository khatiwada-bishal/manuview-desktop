import { PriorityIssue, ReviewerPersonaFeedback } from "../types";

// -----------------------------------------------------------------------------
// CONSTANTS & CONFIGURATION LIMITS
// -----------------------------------------------------------------------------
export const DEFAULT_MAX_SAMPLED_REFS = 200;
export const DEFAULT_DISPLAYED_REFS = 25;
export const MIN_SUMMARY_LENGTH = 50;
export const MAX_ASSERTION_SNIPPET_LENGTH = 85;
export const MIN_VERIFIED_REFS_FOR_SELF_CITATION = 10;
export const MIN_AUTHOR_FAMILY_NAME_LENGTH = 2; // Supports 2-letter Asian surnames (Li, Wu, Xu, Ho, Ng, Yu)
export const MAX_MICRO_REPAIR_PAYLOAD_CHARS = 48000;
export const BOUNDARY_DELIMITER = "MANUSCRIPT_UNTRUSTED_CONTENT_VERBATIM";

/**
 * Overall-score ceiling applied whenever a critical desk-reject condition
 * (severe disciplinary scope mismatch, Priority-A Scope/Fit issue) is present.
 */
export const DESK_REJECT_SCORE_CEILING = 28;

export const PROVIDER_CONTEXT_CHAR_LIMITS: Record<string, number> = {
  gemini: 65000,
  anthropic: 55000,
  openai: 55000,
  groq: 20000,
  ollama: 22000,
};
export const DEFAULT_CONTEXT_CHAR_LIMIT = 45000;

// -----------------------------------------------------------------------------
// RAW LLM RESPONSE INTERFACES (Compile-Time Type Safety)
// -----------------------------------------------------------------------------
export interface RawDimensionScore {
  score?: number | string;
  label?: string;
  verdict?: string;
  strengths?: unknown[];
  vulnerabilities?: unknown[];
}

export interface RawPriorityIssue {
  id?: string;
  priority?: "A" | "B" | "C" | string;
  title?: string;
  category?: PriorityIssue["category"] | string;
  description?: string;
  location?: string;
  evidenceAnchor?: string;
  reviewerQuote?: string;
  actionableFix?: string;
  rebuttalStrategy?: string;
}

export interface RawReviewerPersona {
  persona?: ReviewerPersonaFeedback["persona"] | string;
  name?: string;
  title?: string;
  affiliation?: string;
  expertise?: string;
  roleDescription?: string;
  decisionRecommendation?: ReviewerPersonaFeedback["decisionRecommendation"] | string;
  keyChallenge?: string;
  assessment?: string;
  majorCritiques?: unknown[];
  missingControlsOrAnalyses?: unknown[];
  mustAddressItems?: unknown[];
  evidenceAnchors?: unknown[];
  counterArguments?: unknown[];
}

export interface RawJournalRecommendation {
  name?: string;
  tier?: "Reach" | "Realistic" | "Safe Fallback" | string;
  matchReason?: string;
  publisher?: string;
  impactFactor?: number | string;
}

export interface RawLLMDiagnosticResponse {
  classification?: {
    category?: string;
    categoryLabel?: string;
    isAcademicManuscript?: boolean | string;
    confidence?: number;
    salutation?: string;
    advisoryMessage?: string;
    customGuidance?: string;
    detectedFeatures?: string[];
  };
  overallScore?: number;
  summary?: string;
  dimensions?: Record<string, RawDimensionScore | undefined>;
  priorityIssues?: RawPriorityIssue[];
  reviewerPersonas?: RawReviewerPersona[];
  reportingGuideline?: {
    guidelineName?: string;
    standardType?: string;
    scorePercent?: number;
    compliantItems?: string[];
    missingOrPartialItems?: string[];
  };
  journalRecommendations?: RawJournalRecommendation[];
}

export interface RawLLMBriefFitResponse {
  fitScore?: number;
  verdict?: "Strong Editorial Fit" | "Moderate Scope Match" | "Scope Mismatch / High Desk-Reject Hazard" | string;
  summary?: string;
  dimensions?: {
    domainMatch?: { score?: number; feedback?: string };
    noveltySignificance?: { score?: number; feedback?: string };
    readershipAlignment?: { score?: number; feedback?: string };
    keywordRelevance?: { score?: number; feedback?: string };
  };
  keyHighlights?: string[];
  deskRejectHazards?: string[];
  framingSuggestions?: string[];
}

export interface DiagnosticProgressUpdate {
  stage:
    | "parsing"
    | "classifying"
    | "verifying_references"
    | "matching_journals"
    | "editorial_triage"
    | "generating_review"
    | "streaming_review"
    | "completed";
  message: string;
  percent?: number;
  details?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// AUDIT REDESIGN: SHARED CORE TYPES & EVIDENCE GROUNDING
// -----------------------------------------------------------------------------

export type JournalArchetype =
  | "SIGNIFICANCE_GATED" // Nature/Science/Cell/NEJM tier: novelty+impact gate first
  | "SOUNDNESS_ONLY" // PLOS ONE / Sci Rep / Heliyon: rigor only, no novelty gate
  | "ASSESSMENT_STYLE"; // eLife model: significance + strength-of-evidence vocab

export type DecisionCategory =
  | "DESK_REJECT"
  | "REJECT_AFTER_REVIEW"
  | "MAJOR_REVISION"
  | "MINOR_REVISION"
  | "ACCEPT";

export type Severity = "CRITICAL" | "MAJOR" | "MINOR";

export interface EvidenceSpan {
  section: string; // 'abstract' | 'methods' | 'results' | ...
  startOffset: number; // char offset into normalized manuscript text
  endOffset: number;
  quotedText: string; // exact substring — mechanically verified, never trusted from LLM
}

export interface GroundedClaim {
  claim: string;
  evidence: EvidenceSpan[]; // MUST be non-empty unless status === 'INSUFFICIENT_EVIDENCE'
  status: "SUPPORTED" | "INSUFFICIENT_EVIDENCE";
}

export type TriagePillar =
  | "SCOPE_FIT"
  | "NOVELTY_SIGNIFICANCE"
  | "METHODOLOGICAL_SOUNDNESS"
  | "STRUCTURAL_COMPLETENESS"
  | "LANGUAGE_PRESENTATION"
  | "INTEGRITY"; // Retraction, similarity, declarations

export interface PillarVerdict {
  pillar: TriagePillar;
  verdict: "PASS" | "WARN" | "FAIL";
  confidence: number; // 0..1, rubric-anchored
  grounded: GroundedClaim;
  realWorldBaseRate?: number; // e.g. novelty = 0.518 of desk rejects
}

export interface TriageOutcome {
  decision: "DESK_REJECT" | "PROCEED_TO_REVIEW" | "BORDERLINE";
  pillarVerdicts: PillarVerdict[];
  hardFails: PillarVerdict[];
  journalArchetype: JournalArchetype;
  deskRejectProbability: number; // calibrated vs. target-journal tier base rate
}

export type PersonaId =
  | "DOMAIN_EXPERT"
  | "METHODOLOGICAL_SPECIALIST"
  | "STATISTICAL_REVIEWER"
  | "LITERATURE_REVIEWER"
  | "JOURNAL_EDITOR";

export type ScoringDimension =
  | "NOVELTY"
  | "METHODOLOGY"
  | "STATISTICAL_RIGOR"
  | "LITERATURE_COMPLETENESS"
  | "PRESENTATION"
  | "ETHICAL_RIGOR";

export interface DimensionScore {
  score: number; // 1..10, rubric-anchored
  evidence: EvidenceSpan[];
  agreement: number; // inter-persona agreement on this dimension 0..1
}

export interface DecisionDistribution {
  probabilities: Record<DecisionCategory, number>; // sums to 1
  calibration: {
    baseRateUsed: number; // real acceptance rate of target journal/tier
    leniencyCorrection: number; // subtracted bias term (up to +0.8 documented)
    modelVersion: string; // pinned model, for drift re-calibration
  };
  messyMiddle: boolean; // true when distribution is near-uniform
}

export interface Issue {
  id: string;
  pillar: TriagePillar | null;
  dimension: ScoringDimension | null;
  severity: Severity;
  grounded: GroundedClaim; // anti-hallucination anchor
  recommendation: string;
  source: "PERSONA" | "TRIAGE" | "INTEGRITY" | "REFERENCE_AUDIT";
  personaId?: PersonaId;
}

export interface PersonaReview {
  personaId: PersonaId;
  summary: string;
  issues: Issue[]; // all span-grounded
  dimensionScores: Partial<Record<ScoringDimension, DimensionScore>>;
  recommendation: DecisionCategory;
  confidence: number;
  abstentions: string[]; // topics persona explicitly declined to judge
  reliabilityFlag?: "HIGH" | "LOW_RELIABILITY";
}

export interface AggregatedReview {
  issues: Issue[];
  dimensionScores: Record<ScoringDimension, DimensionScore>;
  recommendation: DecisionCategory;
  panelConfidence: number;
  personaReviews: PersonaReview[];
}

export interface JournalProfile {
  id: string;
  name: string;
  issn?: string;
  archetype: JournalArchetype;
  acceptanceRate?: number; // from KB or live fetch; used as base rate
  deskRejectRate?: number;
  aimsAndScope: string; // live-fetched, cached with TTL
  scopeEmbedding?: number[]; // vector for semantic scope match
  articleTypes: string[];
  wordLimits?: Record<string, number>;
  requiresDataStatement: boolean;
  requiresEthicsStatement: boolean;
  openAccess: boolean;
  apcUsd?: number;
  impactFactor?: number;
  quartile?: "Q1" | "Q2" | "Q3" | "Q4";
  lastVerifiedAt: string; // staleness guard
}

export interface JournalMatch {
  journal: JournalProfile;
  matchScore: number; // 0..100 composite
  components: {
    scopeSimilarity: number; // embedding cosine sim, 0..1
    archetypeFit: number; // would paper survive THIS archetype's rubric
    tierFit: number; // calibrated decision dist vs journal selectivity
    complianceFit: number; // article type, word limits, required statements
  };
  predictedOutcome: DecisionDistribution;
  rationale: GroundedClaim[];
  warnings: string[]; // e.g. "APC $2,690", "acceptance rate 7%"
}

export interface TriageView {
  title: string;
  abstract: string;
  introductionFirstParagraph: string;
  conclusionOrDiscussionSummary: string;
  sectionHeadings: string[];
  sampleSizes: string[];
  statisticalMetrics: string[];
  causalAssertions: string[];
  mandatoryDeclarations: import("../types").ParsedManuscript["mandatoryDeclarations"];
}

export type SectionSelector = (
  | keyof import("../types").ParsedManuscript["sections"]
  | "abstract"
  | "ALL"
)[];

export interface ManuscriptContext {
  manuscript: import("../types").ParsedManuscript;
  normalizedText: string;
  getSections: (selectors: SectionSelector) => string;
  locateSpan: (candidateText?: string) => EvidenceSpan | null;
  extractTriageView: () => TriageView;
  scopeFingerprint: () => string;
  wordCount: number;
  articleType: string;
}

