import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DOI_REGEX = /\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/gi;

/**
 * Normalizes title string for robust academic title comparison
 */
export function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Computes word overlap Jaccard similarity between two titles/strings
 */
export function titleSimilarity(t1: string, t2: string): number {
  const words1 = new Set(normalizeTitle(t1).split(" ").filter((w) => w.length > 2));
  const words2 = new Set(normalizeTitle(t2).split(" ").filter((w) => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;
  let intersection = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersection++;
  });
  const allWords = new Set<string>();
  words1.forEach((w) => allWords.add(w));
  words2.forEach((w) => allWords.add(w));
  const union = allWords.size;
  return union > 0 ? intersection / union : 0;
}

export function extractDOIs(text: string): string[] {
  // Matches typical DOIs like 10.1038/s41586-020-2649-2 or 10.1126/science.123456
  const matches = text.match(DOI_REGEX) || [];
  // Clean trailing punctuation
  return Array.from(new Set(matches.map(d => d.replace(/[.,;)\]]+$/, ''))));
}

export function extractReferencesFromText(text: string): string[] {
  if (!text || typeof text !== "string") return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  // 1. Locate "References", "Bibliography", "Literature Cited", "Works Cited", "Reference List"
  // Handles markdown: ## References, **References**, 10. References, etc.
  const refHeadingRegex = /(?:^|\n)[ \t]*(?:#{1,6}\s*|\*{1,2}|(?:\d+|[IVXLCDM]+)\.?[ \t]*)?(?:References|Bibliography|Literature Cited|Works Cited|Reference List)(?:\s*(?:and Notes|& Notes))?[ \t]*(?:\*{1,2})?[ \t]*(?::|\n|\r\n|$)/gi;
  const matches = Array.from(trimmed.matchAll(refHeadingRegex));

  let matchIndex = -1;
  let matchLength = 0;
  for (let i = matches.length - 1; i >= 0; i--) {
    const idx = matches[i].index;
    if (typeof idx === "number" && trimmed.length - idx >= 20) {
      matchIndex = idx;
      matchLength = matches[i][0].length;
      break;
    }
  }

  let refSection = trimmed;
  if (matchIndex !== -1) {
    refSection = trimmed.slice(matchIndex + matchLength);
    // If an appendix, acknowledgements, or declarations heading appears after references, slice before it
    const trailingSectionRegex = /(?:^|\n)[ \t]*(?:#{1,6}\s*|\*{1,2}|(?:\d+|[IVXLCDM]+)\.?[ \t]*)?(?:Appendix|Appendices|Acknowledgments|Acknowledgements|Declarations|Supplementary (?:Material|Data|Information|Files))[ \t]*(?:\*{1,2})?[ \t]*(?::|\n|\r\n|$)/i;
    const trailingMatch = refSection.match(trailingSectionRegex);
    if (trailingMatch && typeof trailingMatch.index === "number" && trailingMatch.index > 50) {
      refSection = refSection.slice(0, trailingMatch.index);
    }
  }

  // G5: Repair DOIs split across line breaks or hyphens from two-column PDF extractions
  refSection = refSection.replace(
    /(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]*?)[-\s]*[\r\n]+[ \t]*([^\s\r\n]+)/g,
    (match, p1, p2) => {
      // If p2 is the start of a numbered or bulleted reference or protocol, DO NOT merge across lines
      if (/^(?:\d+[\.\)]|\[\d+\]|\(\d+\)|[-*•]|doi:|https?:)/i.test(p2)) {
        return match;
      }
      // If p2 starts with an author name or capitalized word, DO NOT merge
      if (/^[A-Z][a-zA-Z'\-À-ÿ]+(?:,|\b)/.test(p2)) {
        return match;
      }
      // If p1 ends with a hyphen or slash, it is an authentic line-wrap in PDF extraction
      if (/[/-]$/.test(p1)) {
        const cleanP1 = p1.endsWith("-") ? p1.slice(0, -1) : p1;
        return cleanP1 + p2;
      }
      // If p2 is a continuation token of a DOI suffix (alphanumeric, no leading uppercase word)
      if (/^[a-z0-9][a-zA-Z0-9._\-]*$/i.test(p2) && !/^[A-Z]/.test(p2)) {
        return p1 + p2;
      }
      return match;
    }
  );

  // 2. Parse individual reference items from refSection
  const rawLines = refSection
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^(?:References|Bibliography|Literature Cited|Works Cited|Reference List)\b/i.test(l));

  if (rawLines.length === 0) {
    return [];
  }

  // Pattern identifying the start of a distinct reference entry
  const refStartPattern = /^(?:\[\d{1,4}\]|\(\d{1,4}\)|\d{1,4}[\.\)]\s+|[-*•]\s+(?:\[\d{1,4}\]|\d{1,4}\.)|(?:https?:\/\/)?doi\.org\/|doi:\s*|10\.\d{4,9}\/|[A-Z][a-zA-Z'\-À-ÿ]+,\s+[A-Z]|[A-Z][a-zA-Z'\-À-ÿ]+\s+(?:et\s+al\.?|[A-Z]\.))/;

  const refs: string[] = [];
  let currentRef = "";

  for (const line of rawLines) {
    // Ignore standalone page numbers or headers
    if (/^(?:page\s+\d+|\d+\s+of\s+\d+|\d+)$/i.test(line)) {
      continue;
    }

    if (refStartPattern.test(line)) {
      if (currentRef.trim().length >= 15) {
        refs.push(currentRef.trim());
      }
      currentRef = line;
    } else {
      if (currentRef) {
        currentRef += " " + line;
      } else {
        currentRef = line;
      }
    }
  }
  if (currentRef.trim().length >= 15) {
    refs.push(currentRef.trim());
  }

  // 3. Fallback: if no pattern-matched references found
  if (refs.length === 0) {
    // Try paragraph-based splitting (separated by blank lines)
    const paragraphs = refSection
      .split(/\n\s*\n+/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter((p) => p.length >= 25);

    const validParas = paragraphs.filter((p) => 
      /\b(19\d\d|20\d\d)\b/.test(p) ||
      /\b10\.\d{4,9}\//.test(p) ||
      /\b(?:doi|journal|vol|pp|press|university|springer|elsevier|ieee|wiley|nature|science)\b/i.test(p)
    );

    if (validParas.length > 0) {
      return validParas;
    }

    // Try standalone DOIs
    const doiMatches = refSection.match(/\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/g);
    if (doiMatches && doiMatches.length > 0) {
      return Array.from(new Set(doiMatches.map((d) => d.replace(/[.,;)\]]+$/, ""))));
    }

    // If input itself is a single citation
    if (trimmed.length >= 25 && (/\b(19\d\d|20\d\d)\b/.test(trimmed) || /\b10\.\d{4,9}\//.test(trimmed))) {
      return [trimmed.replace(/\s+/g, " ")];
    }
  }

  return refs;
}

const BARE_SECTION_OR_GENERIC_LABELS = new Set([
  "title",
  "abstract",
  "introduction",
  "background",
  "methods",
  "methodology",
  "materials and methods",
  "results",
  "discussion",
  "conclusion",
  "conclusions",
  "references",
  "bibliography",
  "limitations",
  "acknowledgements",
  "appendix",
  "figures",
  "tables",
  "study design",
  "data availability",
  "funding",
  "competing interests",
  "declarations",
]);

/**
 * Filters out bare manuscript section headers, generic labels, or trivial fragments from reviewer observations
 */
export function isSubstantiveReviewerObservation(item: string): boolean {
  if (typeof item !== "string") return false;
  const clean = item.trim();
  // Too short to be an actionable reviewer critique or observation
  if (clean.length < 25) return false;

  const lower = clean.toLowerCase();
  // Exact match against bare section headings
  if (BARE_SECTION_OR_GENERIC_LABELS.has(lower)) return false;

  // Header patterns like "Section: Methods", "Part 2: Discussion", "Methods Section"
  if (/^(?:section|heading|part|item)\s*(?:\d+|:|\-)\s*\w+$/i.test(clean)) return false;
  if (/^(?:title|abstract|introduction|methods|results|discussion|conclusion|references)\s*(?:section|header)?$/i.test(clean)) return false;

  // Must contain at least 4 words
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 4) return false;

  return true;
}

/**
 * G4: Deduplicates manuscript references by normalized DOI or normalized text fingerprint
 */
export function deduplicateReferences<T extends string | { raw?: string }>(
  references: T[]
): {
  unique: T[];
  totalCount: number;
  duplicateCount: number;
} {
  const seenKeys = new Set<string>();
  const unique: T[] = [];
  let duplicateCount = 0;

  for (const item of references) {
    const raw = typeof item === "string" ? item : item?.raw || "";
    if (!raw.trim()) continue;

    // Check for DOI first as canonical identifier
    const doiMatch = raw.match(/\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/i);
    let key: string;
    if (doiMatch) {
      key = "doi:" + doiMatch[1].trim().toLowerCase().replace(/[.,;)\]]+$/, "");
    } else {
      // Alphanumeric normalized title / start key (strip numbering like "[1]", "1.")
      const cleanText = raw
        .replace(/^(?:\[\d+\]|\(\d+\)|\d+[\.\)]|[-*•])\s*/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 100);
      key = "text:" + cleanText;
    }

    if (key.length > 5 && seenKeys.has(key)) {
      duplicateCount++;
    } else {
      if (key.length > 5) seenKeys.add(key);
      unique.push(item);
    }
  }

  return {
    unique,
    totalCount: references.length,
    duplicateCount,
  };
}

export interface ReferenceExtractionFidelity {
  isHighConfidence: boolean;
  warnings: string[];
  extractedCount: number;
  abnormallyLongCount: number;
  abnormallyShortCount: number;
}

/**
 * G5: Assesses extraction fidelity and detects potential section truncation or paragraph merging
 */
export function detectReferenceExtractionQuality(
  fullText: string,
  extractedRefs: string[]
): ReferenceExtractionFidelity {
  const warnings: string[] = [];
  const extractedCount = extractedRefs.length;

  let abnormallyLongCount = 0;
  let abnormallyShortCount = 0;

  for (const r of extractedRefs) {
    if (r.length > 800) abnormallyLongCount++;
    if (r.length < 25) abnormallyShortCount++;
  }

  if (abnormallyLongCount > 0) {
    warnings.push(`${abnormallyLongCount} reference entry appears abnormally long (>800 chars), suggesting merged citations.`);
  }

  if (abnormallyShortCount > 0) {
    warnings.push(`${abnormallyShortCount} reference fragment is under 25 chars.`);
  }

  // Count in-text numeric citations like [1], [2], [1-5]
  const inTextMatches = fullText.match(/\[\d{1,3}(?:[–-]\d{1,3}|,\s*\d{1,3})*\]/g) || [];
  const inTextCitations = inTextMatches.length;

  if (inTextCitations >= 15 && extractedCount < Math.min(5, inTextCitations * 0.2)) {
    warnings.push(`Manuscript has ~${inTextCitations} in-text citation markers, but only ${extractedCount} bibliography reference(s) were parsed.`);
  }

  const isHighConfidence = warnings.length === 0 && extractedCount > 0;

  return {
    isHighConfidence,
    warnings,
    extractedCount,
    abnormallyLongCount,
    abnormallyShortCount,
  };
}

