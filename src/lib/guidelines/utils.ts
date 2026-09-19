import type { ParsedManuscript } from "../types";
import type { GuidelineDetectorResult } from "./types";

/**
 * Extracts the exact sentence spanning the matched keyword or regex
 */
export function extractSentenceExcerpt(text: string, matchIndex: number, matchLength: number): string {
  if (!text || matchIndex < 0 || matchIndex >= text.length) return "";
  const matchedText = text.slice(matchIndex, matchIndex + matchLength).trim();
  if (!matchedText) return "";

  // Locate sentence that spans matchIndex
  let start = 0;
  for (let i = matchIndex - 1; i >= 0; i--) {
    if (/[.?!]/.test(text[i]) && (i + 1 === text.length || /\s/.test(text[i + 1]))) {
      start = i + 1;
      break;
    }
  }

  let end = text.length;
  for (let i = matchIndex + matchLength; i < text.length; i++) {
    if (/[.?!]/.test(text[i]) && (i + 1 === text.length || /\s/.test(text[i + 1]))) {
      end = i + 1;
      break;
    }
  }

  let sentence = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (sentence.length > 220) {
    const localStart = Math.max(0, matchIndex - start - 80);
    const localEnd = Math.min(sentence.length, matchIndex - start + matchLength + 80);
    sentence = sentence.slice(localStart, localEnd).trim();
  }

  if (!sentence.toLowerCase().includes(matchedText.toLowerCase())) {
    return "";
  }

  return sentence;
}

/**
 * Strips bibliography / references section from raw text
 */
export function stripReferences(rawText: string): string {
  if (!rawText) return "";
  const refIndex = rawText.search(/\n\s*(?:references|bibliography|works cited)\b/i);
  if (refIndex !== -1 && refIndex > rawText.length * 0.3) {
    return rawText.slice(0, refIndex);
  }
  return rawText;
}

export function regexMatcher(pattern: RegExp, preferredSection?: string) {
  return (bodyText: string, manuscript: ParsedManuscript): GuidelineDetectorResult => {
    let targetText: string | undefined = undefined;

    if (preferredSection === "abstract" && manuscript.abstract) {
      targetText = manuscript.abstract;
    } else if (
      preferredSection &&
      manuscript.sections &&
      manuscript.sections[preferredSection as keyof typeof manuscript.sections]
    ) {
      targetText = manuscript.sections[preferredSection as keyof typeof manuscript.sections]!;
    }

    if (targetText) {
      const match = targetText.match(pattern);
      if (match && typeof match.index === "number") {
        const excerpt = extractSentenceExcerpt(targetText, match.index, match[0].length);
        return {
          matched: true,
          partial: false,
          excerpt,
          evidenceSection: preferredSection,
          evidenceOffset: match.index,
        };
      }
    }

    const hasTargetSection = Boolean(
      preferredSection &&
        ((preferredSection === "abstract" && Boolean(manuscript.abstract)) ||
          Boolean(manuscript.sections?.[preferredSection as keyof typeof manuscript.sections]))
    );

    // Fall back to entire body text
    const match = bodyText.match(pattern);
    if (match && typeof match.index === "number") {
      const excerpt = extractSentenceExcerpt(bodyText, match.index, match[0].length);
      return {
        matched: true,
        partial: hasTargetSection,
        excerpt,
        evidenceSection: "body-text",
        evidenceOffset: match.index,
      };
    }

    return { matched: false };
  };
}
