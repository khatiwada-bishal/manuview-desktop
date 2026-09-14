import {
  ParsedManuscript,
  CitationIntegritySummary,
  PublishedArticleDetails,
} from "../types";

export interface Stage0GateResult {
  passed: boolean;
  hardBlock: boolean;
  blockReason?: 'already_published' | 'non_academic_document' | 'critical_integrity_failure';
  summary: string;
  warnings: string[];
  blockers: string[];
  mandatoryDeclarationsStatus: {
    ethics: { present: boolean; excerpt?: string; warning?: string };
    dataAvailability: { present: boolean; excerpt?: string; warning?: string };
    competingInterests: { present: boolean; excerpt?: string; warning?: string };
    authorContributions: { present: boolean; excerpt?: string; warning?: string };
  };
  citationIntegrity: {
    retractedCount: number;
    expressionOfConcernCount: number;
    unresolvableCount: number;
    hasCriticalRetraction: boolean;
    citationAlertMessage?: string;
  };
  technicalCompleteness: {
    wordCount: number;
    isWordCountAcceptable: boolean;
    wordCountIssue?: string;
    missingKeySections: string[];
    injectionAlerts: string[];
  };
}

/**
 * Stage 0: Technical Completeness and Integrity Screening Gate.
 * Runs deterministically before any LLM triage or peer review to catch:
 * 1. Prior publication (preprints exempted)
 * 2. Non-academic documents
 * 3. Prompt injection / invisible text payload attacks
 * 4. Missing core sections (Methods, Results)
 * 5. Mandatory publishing declarations (Ethics, Data, COI, Author Contributions)
 * 6. Critical citation alerts (Retracted works, Expressions of Concern)
 */
export function runStage0Screening(
  manuscript: ParsedManuscript,
  publishedCheck?: PublishedArticleDetails,
  citations?: CitationIntegritySummary
): Stage0GateResult {
  const warnings: string[] = [];
  const blockers: string[] = [];

  // 1. Prior publication check (preprints are permitted)
  if (publishedCheck?.isPublished && !publishedCheck.isPreprint) {
    blockers.push(
      `Manuscript appears already published in ${publishedCheck.journalName || "a peer-reviewed venue"} (DOI: ${publishedCheck.doi || "detected"}).`
    );
    return {
      passed: false,
      hardBlock: true,
      blockReason: 'already_published',
      summary: 'Manuscript fails Stage 0: Already published in a peer-reviewed venue.',
      warnings,
      blockers,
      mandatoryDeclarationsStatus: getDeclarationsStatus(manuscript),
      citationIntegrity: getCitationMetrics(citations),
      technicalCompleteness: getTechnicalMetrics(manuscript),
    };
  }

  // 2. Non-academic classification check
  if (
    manuscript.classification &&
    !manuscript.classification.isAcademicManuscript &&
    manuscript.classification.category !== 'academic_manuscript'
  ) {
    blockers.push(
      `Document identified as ${manuscript.classification.categoryLabel || manuscript.classification.category}, not a scholarly research manuscript.`
    );
    return {
      passed: false,
      hardBlock: true,
      blockReason: 'non_academic_document',
      summary: 'Manuscript fails Stage 0: Document is non-academic.',
      warnings,
      blockers,
      mandatoryDeclarationsStatus: getDeclarationsStatus(manuscript),
      citationIntegrity: getCitationMetrics(citations),
      technicalCompleteness: getTechnicalMetrics(manuscript),
    };
  }

  // 3. Prompt injection flags
  const injectionAlerts: string[] = [];
  if (manuscript.injectionSuspicionFlags && manuscript.injectionSuspicionFlags.length > 0) {
    injectionAlerts.push(...manuscript.injectionSuspicionFlags);
    warnings.push(
      `Security/Sanitization alert: ${manuscript.injectionSuspicionFlags.length} anomalous pattern(s) sanitized from manuscript text.`
    );
  }

  // 4. Missing key sections check
  const missingKeySections: string[] = [];
  if (manuscript.sectionProvenance?.methodsMissing) {
    missingKeySections.push("Methods / Methodology");
    warnings.push("Essential Methods section not explicitly demarcated in text.");
  }
  if (manuscript.sectionProvenance?.resultsMissing) {
    missingKeySections.push("Results / Findings");
    warnings.push("Essential Results section not explicitly demarcated in text.");
  }

  // 5. Word count thresholds
  let isWordCountAcceptable = true;
  let wordCountIssue: string | undefined;
  if (manuscript.wordCount > 0 && manuscript.wordCount < 1200) {
    isWordCountAcceptable = false;
    wordCountIssue = `Very short length (${manuscript.wordCount.toLocaleString()} words). Most empirical journals expect at least 2,500-3,500 words.`;
    warnings.push(wordCountIssue);
  } else if (manuscript.wordCount > 28000) {
    isWordCountAcceptable = false;
    wordCountIssue = `Extremely long text (${manuscript.wordCount.toLocaleString()} words) exceeds standard journal monograph word limits.`;
    warnings.push(wordCountIssue);
  }

  // 6. Mandatory publishing declarations
  const declarations = getDeclarationsStatus(manuscript);
  if (!declarations.ethics.present) {
    warnings.push("Ethics & IRB approval statement is missing or not detected.");
  }
  if (!declarations.dataAvailability.present) {
    warnings.push("Data Availability Statement is missing (mandatory for Nature, Science, Springer, Elsevier, PLOS).");
  }
  if (!declarations.competingInterests.present) {
    warnings.push("Conflict of Interest / Competing Interests declaration is missing.");
  }
  if (!declarations.authorContributions.present) {
    warnings.push("Author Contributions / CRediT statement is missing.");
  }

  // 7. Citation integrity
  const citationIntegrity = getCitationMetrics(citations);
  if (citationIntegrity.hasCriticalRetraction) {
    warnings.push(
      `CRITICAL CITATION ALERT: Paper cites ${citationIntegrity.retractedCount} retracted work(s). Handling editors will require immediate removal or formal justification.`
    );
  }
  if (citationIntegrity.expressionOfConcernCount > 0) {
    warnings.push(
      `Paper cites ${citationIntegrity.expressionOfConcernCount} work(s) flagged with Expressions of Concern.`
    );
  }
  if (citationIntegrity.unresolvableCount > 0) {
    warnings.push(
      `${citationIntegrity.unresolvableCount} reference(s) could not be resolved via bibliographic databases. Note: This requires manual author verification, not an indictment of hallucination.`
    );
  }

  const passed = blockers.length === 0;
  const summary = passed
    ? (warnings.length === 0
      ? "Stage 0 Passed: Manuscript meets all baseline technical and integrity screening criteria."
      : `Stage 0 Passed with ${warnings.length} advisory warning(s): Review proceeding to Stage 1 editorial triage.`)
    : `Stage 0 Blocked: ${blockers.join("; ")}`;

  return {
    passed,
    hardBlock: blockers.length > 0,
    summary,
    warnings,
    blockers,
    mandatoryDeclarationsStatus: declarations,
    citationIntegrity,
    technicalCompleteness: {
      wordCount: manuscript.wordCount,
      isWordCountAcceptable,
      wordCountIssue,
      missingKeySections,
      injectionAlerts,
    },
  };
}

function getDeclarationsStatus(manuscript: ParsedManuscript) {
  const d = manuscript.mandatoryDeclarations;
  return {
    ethics: {
      present: !!d?.ethicsStatement?.present,
      excerpt: d?.ethicsStatement?.excerpt,
      warning: !d?.ethicsStatement?.present ? "Missing institutional ethics / IRB oversight statement" : undefined,
    },
    dataAvailability: {
      present: !!d?.dataAvailability?.present,
      excerpt: d?.dataAvailability?.excerpt,
      warning: !d?.dataAvailability?.present ? "Missing Data Availability Statement" : undefined,
    },
    competingInterests: {
      present: !!d?.competingInterests?.present,
      excerpt: d?.competingInterests?.excerpt,
      warning: !d?.competingInterests?.present ? "Missing Competing Interests / COI disclosure" : undefined,
    },
    authorContributions: {
      present: !!d?.authorContributions?.present,
      excerpt: d?.authorContributions?.excerpt,
      warning: !d?.authorContributions?.present ? "Missing Author Contribution / CRediT statement" : undefined,
    },
  };
}

function getCitationMetrics(citations?: CitationIntegritySummary) {
  if (!citations) {
    return {
      retractedCount: 0,
      expressionOfConcernCount: 0,
      unresolvableCount: 0,
      hasCriticalRetraction: false,
    };
  }

  const retractedCount = citations.retractedCount || 0;
  const expressionOfConcernCount = citations.expressionOfConcernCount || 0;
  const unresolvableCount = citations.unresolvableCount || 0;

  let citationAlertMessage: string | undefined;
  if (retractedCount > 0) {
    citationAlertMessage = `Detected ${retractedCount} citation(s) to retracted literature.`;
  } else if (expressionOfConcernCount > 0) {
    citationAlertMessage = `Detected ${expressionOfConcernCount} citation(s) under Expression of Concern.`;
  }

  return {
    retractedCount,
    expressionOfConcernCount,
    unresolvableCount,
    hasCriticalRetraction: retractedCount > 0,
    citationAlertMessage,
  };
}

function getTechnicalMetrics(manuscript: ParsedManuscript) {
  return {
    wordCount: manuscript.wordCount,
    isWordCountAcceptable: manuscript.wordCount >= 1200 && manuscript.wordCount <= 28000,
    missingKeySections: [
      ...(manuscript.sectionProvenance?.methodsMissing ? ["Methods / Methodology"] : []),
      ...(manuscript.sectionProvenance?.resultsMissing ? ["Results / Findings"] : []),
    ],
    injectionAlerts: manuscript.injectionSuspicionFlags || [],
  };
}
