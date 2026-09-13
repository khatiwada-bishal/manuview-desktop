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
