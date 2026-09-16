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
/**
 * Verifies whether a structural locator (e.g. "Table 2", "Figure 3", "Section 4.1", "Methodology")
 * actually resolves to a detected element in the manuscript text or parsed sections (P1 §1.5).
 */
export function isStructuralAnchorResolvable(
  anchor: string,
  rawManuscriptText: string,
  sections?: { introduction?: string; methods?: string; results?: string; discussion?: string; conclusion?: string }
): boolean {
  const cleanAnchor = anchor.trim().toLowerCase();

  // 1. Table / Figure checks: e.g. "Table 2", "Figure 1", "Fig. 3"
  const tableFigMatch = cleanAnchor.match(/\b(table|figure|fig\.)\s*([0-9a-z]+)\b/i);
  if (tableFigMatch) {
    const isFig = tableFigMatch[1].toLowerCase().startsWith("fig");
    const typePattern = isFig ? "(?:figure|fig\\.?)" : "table";
    const num = tableFigMatch[2];
    const pat = new RegExp(`\\b${typePattern}\\s*${num}\\b`, "i");
    return pat.test(rawManuscriptText);
  }

  // 2. Equation check: e.g. "Equation 3", "Eq. (2)"
  const eqMatch = cleanAnchor.match(/\b(equation|eq\.)\s*\(?([0-9a-z]+)\)?/i);
  if (eqMatch) {
    const num = eqMatch[2];
    const pat = new RegExp(`\\b(?:equation|eq\\.?)\\s*\\(?${num}\\)?`, "i");
    return pat.test(rawManuscriptText);
  }

  // 3. Named Section checks: "Methodology", "Results", "Discussion", "Introduction"
  if (sections) {
    if (/\b(?:method|materials?\s+and\s+methods?)\b/i.test(cleanAnchor)) {
      return Boolean(sections.methods && sections.methods.length > 50);
    }
    if (/\b(?:results?|findings?)\b/i.test(cleanAnchor)) {
      return Boolean(sections.results && sections.results.length > 50);
    }
    if (/\b(?:discussion)\b/i.test(cleanAnchor)) {
      return Boolean(sections.discussion && sections.discussion.length > 50);
    }
    if (/\b(?:introduction|background)\b/i.test(cleanAnchor)) {
      return Boolean(sections.introduction && sections.introduction.length > 50);
    }
    if (/\b(?:conclusion)\b/i.test(cleanAnchor)) {
      return Boolean(sections.conclusion && sections.conclusion.length > 50);
    }
  }

  // 4. Numbered section check: e.g. "Section 3.2", "§3"
  const sectionNumMatch = cleanAnchor.match(/(?:section|§)\s*([0-9]+(?:\.[0-9]+)*)/i);
  if (sectionNumMatch) {
    const secNum = sectionNumMatch[1].replace(/\./g, "\\.");
    const pat = new RegExp(`(?:section|§)\\s*${secNum}\\b`, "i");
    return pat.test(rawManuscriptText);
  }

  // 5. Fallback: If anchor text itself appears in raw text (>= 6 chars)
  if (cleanAnchor.length >= 6) {
    return rawManuscriptText.toLowerCase().includes(cleanAnchor);
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
  rawManuscriptText: string,
  sections?: { introduction?: string; methods?: string; results?: string; discussion?: string; conclusion?: string }
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
          // If anchor is a structural locator, verify that the referenced element actually exists (P1 §1.5)
          const isStructural = /section|method|result|table|figure|fig\.|eq\.|equation/i.test(anchor);
          if (isStructural && isStructuralAnchorResolvable(anchor, rawManuscriptText, sections)) {
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
      const isStructural = /section|method|result|table|figure|fig\.|eq\.|equation/i.test(issue.evidenceAnchor);

      if (isStructural) {
        if (!isStructuralAnchorResolvable(issue.evidenceAnchor, rawManuscriptText, sections)) {
          anchorGrounded = false;
        }
      } else if (!isSpanGroundedInManuscript(textToTest, rawManuscriptText, normRaw)) {
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


