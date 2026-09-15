export type ScoreDimension = 
  | 'originality'
  | 'broad_interest'
  | 'claims_vs_evidence'
  | 'methodology'
  | 'clarity'
  | 'prior_work';

export const VALID_SCORE_DIMENSIONS: ReadonlySet<ScoreDimension> = new Set<ScoreDimension>([
  'originality',
  'broad_interest',
  'claims_vs_evidence',
  'methodology',
  'clarity',
  'prior_work',
]);

export function isScoreDimension(value: unknown): value is ScoreDimension {
  return typeof value === 'string' && VALID_SCORE_DIMENSIONS.has(value as ScoreDimension);
}

export interface DimensionScore {
  score: number; // 1 to 5
  label: string;
  verdict: string;
  strengths: string[];
  vulnerabilities: string[];
  source?: 'llm' | 'heuristic';
}

export type PriorityLevel = 'A' | 'B' | 'C';

export interface PriorityIssue {
  id: string;
  priority: PriorityLevel;
  title: string;
  category: 'Methodology' | 'Causal Claims' | 'Statistics' | 'Citations' | 'Scope/Fit' | 'Clarity';
  description: string;
  location?: string;
  evidenceAnchor?: string; // Typed anchor: text: §X "...", equation: Eq. Y, absence: ...
  reviewerQuote: string; // How a reviewer or editor would formulate this critique
  actionableFix: string; // Specific concrete step to resolve before submission
  rebuttalStrategy?: string; // Point-by-point author rebuttal framing for journal response letter
  source?: 'llm' | 'heuristic' | 'crossref';
}

export interface ReviewerConcreteSolution {
  issue: string;
  proposedFix: string;
  exampleRewrite?: string;
}

export interface ReviewerPersonaFeedback {
  persona: 'methods_reviewer' | 'domain_expert' | 'journal_editor' | 'statistician' | 'devils_advocate';
  name: string;
  title: string;
  affiliation: string;
  expertise: string;
  roleDescription: string;
  decisionRecommendation: 'Major Revision' | 'Reject / Resubmit' | 'Desk Reject' | 'Minor Revision';
  keyChallenge: string;
  assessment: string;
  strengths?: string[];
  majorCritiques: string[];
  concreteSolutions?: ReviewerConcreteSolution[];
  missingControlsOrAnalyses: string[];
  mustAddressItems: string[];
  minorComments?: string[];
  evidenceAnchors?: string[];
  counterArguments?: string[];
  confidence?: 'high' | 'medium' | 'low';
  isAbstained?: boolean;
  abstentionReason?: string;
  source?: 'llm' | 'heuristic';
  /** Simulated handling editor confidential comments to editorial board (P0-3) */
  confidentialEditorNote?: string;
}

export type ReferenceStatus = 'valid' | 'retracted' | 'expression_of_concern' | 'unresolvable' | 'unchecked';

export interface ReferenceVerification {
  raw: string;
  doi?: string;
  title?: string;
  authors?: string[];
  familyNames?: string[];
  matchConfidence?: number;
  year?: number;
  journal?: string;
  status: ReferenceStatus;
  isRetracted: boolean;
  retractionDetails?: string;
  crossrefUrl?: string;
  resolutionMethod?: 'doi' | 'bibliographic_search' | 'unresolved';
}

export interface CitationIntegritySummary {
  totalReferences: number;
  sampledCount: number;
  checkedCount: number;
  coverageNote: string;
  verifiedCount: number;
  unresolvableCount: number; // Potential AI hallucination (confirmed 404)
  uncheckedCount: number; // References without DOI or lookup offline/rate-limited
  retractedCount: number;
  expressionOfConcernCount?: number;
  retractionCheckAvailable: boolean; // false if Crossref/network failed or offline
  selfCitationPercent?: number; // 0 to 100 percentage of verified references matching manuscript authors
  selfCitationRatio?: number; // Backward-compatible alias matching selfCitationPercent (0 to 100)
  selfCitationNote?: string; // Transparent explanation when ratio is omitted or calculated
  recencyProfile?: {
    last5YearsPercent: number;
    olderThan5YearsPercent: number;
  };
  references: ReferenceVerification[];
}

export interface JournalRecommendation {
  tier: 'Reach' | 'Realistic' | 'Fallback';
  journalName: string;
  impactFactor: number | string;
  publisher: string;
  fitScore: number; // percentage 0-100
  scopeRationale: string;
  rejectionRisks: string[];
  requiredRevisionsForFit: string[];
}

export type DocumentCategory = 
  | 'academic_manuscript'        // Research paper, empirical study, review, clinical study, preprint
  | 'source_code'                // Programming scripts (Python, JS, C++, etc.), configs
  | 'resume_cv'                  // Resume, Curriculum Vitae, bio
  | 'grant_proposal'             // Grant application, project proposal, funding narrative
  | 'technical_doc'              // Technical spec, API docs, release notes, manual
  | 'business_or_admin'          // Invoice, financial report, business memo, agreement
  | 'general_or_creative'        // Essay, fiction, journalism, blog post
  | 'random_unstructured';       // Shopping list, notes, fragments, disorganized text

export const VALID_DOCUMENT_CATEGORIES: ReadonlySet<DocumentCategory> = new Set<DocumentCategory>([
  'academic_manuscript',
  'source_code',
  'resume_cv',
  'grant_proposal',
  'technical_doc',
  'business_or_admin',
  'general_or_creative',
  'random_unstructured',
]);

export function isDocumentCategory(value: unknown): value is DocumentCategory {
  return typeof value === 'string' && VALID_DOCUMENT_CATEGORIES.has(value as DocumentCategory);
}

export interface DocumentClassification {
  category: DocumentCategory;
  categoryLabel: string;
  isAcademicManuscript: boolean;
  confidence: number; // 0 to 1
  detectedFeatures: string[];
  salutation: string; // e.g. "Dear Author / Researcher", "Hello Developer / Software Engineer"
  advisoryMessage: string; // Direct address explaining the file classification and context
  customGuidance: string; // Actionable advice tailored to this specific file type
}

export interface ManuscriptSection {
  title: string;
  content: string;
}

export interface SectionProvenance {
  methodsInferred?: boolean;
  resultsInferred?: boolean;
  methodsMissing?: boolean;
  resultsMissing?: boolean;
  introductionInferred?: boolean;
  discussionInferred?: boolean;
}

export interface ParsedManuscript {
  title: string;
  abstract: string;
  authors: string[];
  wordCount: number;
  sections: {
    introduction?: string;
    methods?: string;
    results?: string;
    discussion?: string;
    conclusion?: string;
  };
  sectionProvenance?: SectionProvenance;
  rawText: string;
  references: string[];
  classification?: DocumentClassification;
  empiricalCues?: {
    sampleSizes?: string[];
    statisticalMetrics?: string[];
    equations?: string[];
    dataRepositories?: string[];
    causalAssertions?: string[];
    detectedGuidelines?: string[];
    declaredLimitations?: string[];
  };
  citationStats?: {
    totalReferences?: number;
    crossrefVerified?: number;
    retractedCount?: number;
    doiCount?: number;
    pre2015Count?: number;
    authorSelfCitationCount?: number;
    authorSelfCitationRatio?: number;
  };
  injectionSuspicionFlags?: string[];
  mandatoryDeclarations?: {
    ethicsStatement?: { present: boolean; excerpt?: string };
    dataAvailability?: { present: boolean; excerpt?: string };
    competingInterests?: { present: boolean; excerpt?: string };
    authorContributions?: { present: boolean; excerpt?: string };
  };
}

export interface ReportingGuidelineItem {
  itemNumber: number;
  name: string;
  section: string;
  description?: string;
  status: 'evidenced' | 'partial' | 'absent';
  evidenceExcerpt?: string;
  evidenceSection?: string;
  evidenceOffset?: number;
  recommendation?: string;
}

export interface ReportingGuidelineCheck {
  guidelineName: string; // e.g. STROBE, CONSORT, PRISMA, ARRIVE, Econometric Rigor
  standardType: string; // e.g. "Observational / Customs Microdata", "Randomized Controlled Trial", "Nonlinear Model"
  scorePercent: number; // 0 - 100
  totalItems?: number;
  evidencedCount?: number;
  partialCount?: number;
  absentCount?: number;
  itemSetScope?: 'full' | 'core_subset';
  itemSetSize?: number;
  standardVersion?: string;
  standardUrl?: string;
  items?: ReportingGuidelineItem[];
  compliantItems: string[];
  missingOrPartialItems: string[];
  additionalReviewerObservations?: string[];
}

export interface PublishedArticleDetails {
  isPublished: boolean;
  doi?: string;
  journalName?: string;
  publisher?: string;
  publicationDate?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  articleUrl?: string;
  citationCount?: number;
  detectedVia: string;
  isPreprint?: boolean;
  preprintServer?: string;
}

export interface TargetJournalEvaluation {
  name: string;
  journalName?: string;
  foundInCatalog: boolean;
  tier: 'Reach' | 'Realistic' | 'Fallback';
  fitScore: number;
  impactFactor: number;
  discipline?: string;
  journalDiscipline?: string;
  manuscriptDiscipline?: string;
  isDisciplinaryMismatch?: boolean;
  mismatchWarning?: string;
}

/**
 * Editorial triage (desk-review) outcome. In the real submission workflow a
 * manuscript is first screened by the handling editor for aims-&-scope fit and
 * baseline quality. Roughly two-thirds are desk-rejected here — and a
 * desk-rejected paper is NEVER sent to peer reviewers. Scope mismatch is the
 * single most common desk-rejection trigger.
 */
export interface ScopeComparisonDetail {
  manuscriptDiscipline: string;
  manuscriptTopics: string[];
  journalName: string;
  journalDiscipline: string;
  journalPublisher?: string;
  journalScopeSummary?: string;
  journalKeyConcepts?: string[];
  mismatchExplanation?: string;
  isScopeMatch: boolean;
  suggestedVenues?: string[];
}

export type DeskRejectPillarStatus = 'pass' | 'warning' | 'fatal_barrier';

export interface DeskRejectPillarEvaluation {
  pillar: 'scope_remit' | 'novelty_scale' | 'methodology_controls' | 'integrity_citations' | 'standards_compliance' | 'presentation_language';
  title: string;
  status: DeskRejectPillarStatus;
  verdict: string;
  actionablePreSubmissionFix?: string;
  evidenceSpans?: string[];
  triggerId?: string;
  baseRateContext?: string;
}

export type ExpectedDecisionOutcome =
  | 'Desk Reject Hazard'
  | 'High Risk / Substantial Rebuttal Required'
  | 'Competitive with Major Revisions'
  | 'Strong Candidate / Likely Acceptance';

export interface DecisionCategoryDistribution {
  p_desk_reject: number; // e.g. 15 (%)
  p_reject_after_review: number; // e.g. 35 (%)
  p_major_revision: number; // e.g. 32 (%)
  p_minor_revision: number; // e.g. 15 (%)
  p_accept: number; // e.g. 3 (%)
  confidence: 'high' | 'medium' | 'low';
  messy_middle_flag: boolean; // NeurIPS 2014 reality (57% second committee flip)
  baseRateDisclaimer?: string;
}

export interface VerificationCoverageSummary {
  totalCritiques: number;
  verifiedSpans: number;
  suppressedCount: number;
  coveragePercent: number;
}

export interface CalibratedAcceptanceRating {
  overallScore: number; // 0-100 composite academic quality score
  acceptanceProbabilityPercent: number; // e.g. 15 (%)
  probabilityRange: [number, number]; // e.g. [11, 19] confidence bounds
  baselineJournalRatePercent: number; // Target journal baseline selectivity, e.g. 7.5 (%)
  decisionOutcome: ExpectedDecisionOutcome;
  decisionDistribution: DecisionCategoryDistribution;
  dimensionalMultiplier: number; // Composite quality multiplier MQ (e.g. 1.85)
  hazardPenaltyMultiplier: number; // Compounded deficit penalty (e.g. 0.85)
  primaryHazard?: string; // Leading bottleneck suppressing probability
  keyOpportunity?: string; // Highest-leverage fix to boost acceptance odds
  verificationCoverage?: VerificationCoverageSummary;
}

export interface EditorialTriageOutcome {
  outcome: 'sent_for_review' | 'desk_reject';
  triageClassification?: 'cleared_for_review' | 'actionable_desk_reject_risk' | 'fatal_desk_reject';
  /** True only when the manuscript cleared triage and reached the reviewer panel. */
  sentToPeerReview: boolean;
  deskRejectReason?: 'scope_mismatch' | 'fatal_methodology' | 'retracted_citations' | 'inadequate_novelty' | 'integrity_compliance';
  /** The handling editor's triage decision (present on desk reject). */
  handlingEditorDecision?: ReviewerPersonaFeedback['decisionRecommendation'];
  /** Human-readable explanation of the triage outcome. */
  summary: string;
  /** Detailed comparison of manuscript domain vs. fetched journal scope */
  scopeComparison?: ScopeComparisonDetail;
  /** 6-Pillar Editorial Screening Evaluation */
  pillarEvaluations?: DeskRejectPillarEvaluation[];
  /** Actionable roadmap to overturn or resolve desk reject hazards */
  salvageRoadmap?: string[];
}

/**
 * Deterministic compliance audit item (P0-1). Used in heuristic/offline mode
 * to present factual, verifiable checks rather than fabricated referee opinions.
 */
export interface ComplianceAuditItem {
  id: string;
  category: 'Structure' | 'Methodology' | 'Guidelines' | 'Citations' | 'Language' | 'Scope';
  name: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  evidenceExcerpt?: string;
  actionableRecommendation?: string;
}

export interface DeterministicComplianceAudit {
  items: ComplianceAuditItem[];
  passedCount: number;
  warnCount: number;
  failedCount: number;
  summary: string;
}

/**
 * Panel consensus and decision variance distribution across the simulated reviewers (P0-3).
 */
export interface PanelConsensus {
  distribution: {
    deskReject: number;
    reject: number;
    majorRevision: number;
    minorRevision: number;
  };
  consensusLevel: 'unanimous' | 'majority' | 'split';
  borderlineDiagnosis: string;
  uncertaintyMargin: number; // e.g. ±3 (unanimous) to ±10 (split)
  scoreRange?: [number, number]; // [minScore, maxScore]
}

export interface FullReviewReport {
  mode?: 'full';
  id: string;
  createdAt: string;
  title: string;
  authors?: string[];
  targetJournal?: string;
  targetJournalEvaluation?: TargetJournalEvaluation;
  /** Editorial desk-review gate result; determines whether peer review occurred. */
  editorialTriage?: EditorialTriageOutcome;
  /** Calibrated Acceptance Probability & Selectivity Analysis */
  calibratedAcceptance?: CalibratedAcceptanceRating;
  overallScore?: number; // 0 to 100 (omitted if non-academic, already published, or heuristic-sourced)
  scoreUncertaintyMargin?: number; // e.g., ±3 (unanimous) to ±10 (split panel)
  panelConsensus?: PanelConsensus;
  complianceAudit?: DeterministicComplianceAudit;
  isEligibleForReview?: boolean; // false if already published OR non-academic manuscript OR scope mismatch desk reject
  ineligibilityReason?: 'already_published' | 'non_academic_document' | 'scope_mismatch';
  publishedDetails?: PublishedArticleDetails;
  summary: string;
  classification: DocumentClassification;
  dimensions?: Record<ScoreDimension, DimensionScore>;
  priorityIssues: PriorityIssue[];
  reviewerPersonas: ReviewerPersonaFeedback[];
  missingPersonaRoles?: ReviewerPersonaFeedback['persona'][];
  journalRecommendations: JournalRecommendation[];
  citationIntegrity: CitationIntegritySummary;
  reportingGuideline?: ReportingGuidelineCheck;
  statcheck?: import('./statcheck').StatcheckReport;
  hedgingAudit?: import('./hedging-overclaims').HedgingAuditReport;
  citationHealth?: import('./citation-recency').CitationHealthReport;
  executionMode?: 'llm_synthesized' | 'partial_llm' | 'heuristic_offline';
  llmCallError?: string;
  verificationCoverage?: VerificationCoverageSummary;
  funnelStageReached?: 'stage0_integrity' | 'stage1_triage' | 'stage2_deep_review' | 'stage3_synthesis';
}

export interface BriefJournalFitReport {
  mode: 'brief_fit';
  id: string;
  createdAt: string;
  title: string;
  abstract: string;
  keywords: string[];
  targetJournal: string;
  fitScore?: number; // 0 to 100 (omitted when not assessed)
  verdict:
    | 'Strong Editorial Fit'
    | 'Moderate Scope Match'
    | 'Scope Mismatch / High Desk-Reject Hazard'
    | 'Not Assessed — journal profile unavailable';
  verdictColor: 'green' | 'amber' | 'red' | 'grey';
  scopeAssessment: {
    method: 'curated_catalog' | 'openalex_profile' | 'llm_only' | 'unavailable';
    reason?: string;
  };
  summary: string;
  dimensions: {
    domainMatch: { score?: number; feedback: string };
    noveltySignificance: { score?: number; feedback: string };
    readershipAlignment: { score?: number; feedback: string };
    keywordRelevance: { score?: number; feedback: string };
  };
  keyHighlights: string[];
  deskRejectHazards: string[];
  framingSuggestions: string[];
  alternativeJournals: {
    name: string;
    publisher?: string;
    impactFactor?: number;
    tier: 'Reach' | 'Realistic' | 'Safe Fallback';
    matchReason: string;
  }[];
  openAlexMetrics?: {
    twoYearMeanCitedness?: number;
    hIndex?: number;
    matchedConcepts?: string[];
    sourceId?: string;
  };
}

export type ReviewReport = FullReviewReport | BriefJournalFitReport;

export type LLMProvider = 'ollama' | 'gemini' | 'groq' | 'openai' | 'anthropic';

export interface ProviderConfig {
  provider: LLMProvider;
  model: string;
  baseUrl?: string; // e.g. http://localhost:11434 for Ollama
  apiKey?: string;
  hasSecureKey?: boolean;
}

export interface AvailableModel {
  id: string;
  name: string;
  description: string;
  tag?: string;
  recommended?: boolean;
  isLive?: boolean;
}

