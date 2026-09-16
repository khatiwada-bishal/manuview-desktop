/**
 * Citation Recency & Bibliography Health Profiler
 * 
 * Performs publication-grade bibliometric audits without external APIs:
 * 1. Reference publication year distribution & citation half-life
 * 2. Recency benchmarks (% of citations in last 3 and 5 years)
 * 3. Author self-citation ratio calculation
 * 4. In-text citation callout matching (flags orphan bibliography entries)
 */

import { normalizeAuthorName, parseManuscriptAuthor } from "./engine/shared-utils";

export interface YearDistribution {
  year: number;
  count: number;
}

export interface CitationHealthReport {
  totalReferences: number;
  medianYear: number | null;
  citationHalfLifeYears: number | null;
  last3YearsCount: number;
  last3YearsPercent: number;
  last5YearsCount: number;
  last5YearsPercent: number;
  classicCount: number; // >15 years old
  classicPercent: number;
  selfCitationCount: number;
  selfCitationPercent: number;
  orphanReferencesCount: number;
  orphanReferenceSamples: string[];
  yearDistribution: YearDistribution[];
  summary: string;
  isStaleLiterature: boolean; // e.g. < 25% references in last 5 years in active fields
}

/**
 * Extracts 4-digit publication years from reference strings (between 1900 and current year + 1)
 */
export function extractYearFromReference(refText: string): number | null {
  if (!refText) return null;
  const currentYear = new Date().getFullYear();

  // Look for 4-digit years like 2023, (2021), 1998
  const yearMatches = refText.match(/\b(19\d\d|20[0-2]\d)\b/g);
  if (!yearMatches || yearMatches.length === 0) return null;

  // Prefer years that are enclosed in parentheses or near punctuation
  for (const ym of yearMatches) {
    const yr = parseInt(ym, 10);
    if (yr >= 1900 && yr <= currentYear + 1) {
      // Check if it's right next to a DOI prefix like 10.1038 or volume/issue
      const isDoiPrefix = new RegExp(`10\\.\\d{4,9}\\/[^\\s]*${yr}`).test(refText);
      if (!isDoiPrefix) {
        return yr;
      }
    }
  }

  // Fallback to first valid year
  const first = parseInt(yearMatches[0], 10);
  return first >= 1900 && first <= currentYear + 1 ? first : null;
}

/**
 * Scans manuscript body text for in-text citation markers
 * e.g., [1], [2, 3], [4-7], (Smith et al., 2020)
 */
export function extractInTextCitationNumbers(bodyText: string): Set<number> {
  const citedNumbers = new Set<number>();
  if (!bodyText) return citedNumbers;

  // Bracket numeric citations: [1], [1, 2], [1-3]
  const bracketRegex = /\[(\d+(?:\s*[,-]\s*\d+)*)\]/g;
  let match: RegExpExecArray | null;

  while ((match = bracketRegex.exec(bodyText)) !== null) {
    const inner = match[1];
    const parts = inner.split(",");
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [startStr, endStr] = trimmed.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end) && end >= start && end - start < 100) {
          for (let i = start; i <= end; i++) {
            citedNumbers.add(i);
          }
        }
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num)) {
          citedNumbers.add(num);
        }
      }
    }
  }

  return citedNumbers;
}

/**
 * Computes comprehensive citation recency, half-life, and self-citation statistics
 */
export function analyzeCitationRecency(
  references: string[],
  manuscriptBodyText?: string,
  authorNames?: string[]
): CitationHealthReport {
  const currentYear = new Date().getFullYear();
  const totalReferences = references.length;

  if (totalReferences === 0) {
    return {
      totalReferences: 0,
      medianYear: null,
      citationHalfLifeYears: null,
      last3YearsCount: 0,
      last3YearsPercent: 0,
      last5YearsCount: 0,
      last5YearsPercent: 0,
      classicCount: 0,
      classicPercent: 0,
      selfCitationCount: 0,
      selfCitationPercent: 0,
      orphanReferencesCount: 0,
      orphanReferenceSamples: [],
      yearDistribution: [],
      summary: "No bibliography items detected to analyze.",
      isStaleLiterature: false,
    };
  }

  const extractedYears: number[] = [];
  const yearCounts = new Map<number, number>();

  let last3YearsCount = 0;
  let last5YearsCount = 0;
  let classicCount = 0;

  for (const ref of references) {
    const yr = extractYearFromReference(ref);
    if (yr !== null) {
      extractedYears.push(yr);
      yearCounts.set(yr, (yearCounts.get(yr) || 0) + 1);

      if (yr >= currentYear - 3) last3YearsCount++;
      if (yr >= currentYear - 5) last5YearsCount++;
      if (yr < currentYear - 15) classicCount++;
    }
  }

  // Median Year & Citation Half-Life
  let medianYear: number | null = null;
  let citationHalfLifeYears: number | null = null;

  if (extractedYears.length > 0) {
    extractedYears.sort((a, b) => a - b);
    const mid = Math.floor(extractedYears.length / 2);
    medianYear = extractedYears.length % 2 === 0
      ? Math.round((extractedYears[mid - 1] + extractedYears[mid]) / 2)
      : extractedYears[mid];
    citationHalfLifeYears = Math.max(0, currentYear - medianYear);
  }

  const denominator = extractedYears.length > 0 ? extractedYears.length : totalReferences;
  const last3YearsPercent = Math.round((last3YearsCount / denominator) * 100);
  const last5YearsPercent = Math.round((last5YearsCount / denominator) * 100);
  const classicPercent = Math.round((classicCount / denominator) * 100);

  // Evidenced Self-Citation Analysis with Disambiguated Author Matching (P0 §2.4)
  let selfCitationCount = 0;
  if (authorNames && authorNames.length > 0) {
    const parsedManuscriptAuthors = authorNames
      .map(parseManuscriptAuthor)
      .filter((a): a is { family: string; initial?: string } => Boolean(a));

    if (parsedManuscriptAuthors.length > 0) {
      for (const ref of references) {
        // Isolate author block: text preceding the year or first period
        let authorBlock = ref;
        const yearMatch = ref.match(/\b(?:19|20)\d{2}\b/);
        if (yearMatch && yearMatch.index && yearMatch.index > 5) {
          authorBlock = ref.slice(0, yearMatch.index);
        } else {
          const parts = ref.split(/\.\s+/);
          if (parts.length >= 2) authorBlock = parts[0];
        }

        const normBlock = normalizeAuthorName(authorBlock);
        let isMatch = false;

        for (const msAuth of parsedManuscriptAuthors) {
          const fam = msAuth.family;
          if (!fam || fam.length < 2) continue;

          // Ensure surname appears as a distinct word in author block
          const famRegex = new RegExp(`\\b${fam}\\b`, "i");
          if (famRegex.test(normBlock)) {
            if (fam.length >= 4) {
              isMatch = true;
              break;
            } else if (msAuth.initial) {
              // 2-3 char surnames require author initial match in the author block
              const initRegex = new RegExp(`\\b${fam}\\b[\\s,]+${msAuth.initial}|\\b${msAuth.initial}[\\s.]*${fam}\\b`, "i");
              if (initRegex.test(normBlock)) {
                isMatch = true;
                break;
              }
            } else if (fam.length === 3) {
              isMatch = true;
              break;
            }
          }
        }
        if (isMatch) selfCitationCount++;
      }
    }
  }
  const selfCitationPercent = Math.round((selfCitationCount / totalReferences) * 100);

  // In-text citation orphan matching (if numeric citation style)
  let orphanReferencesCount = 0;
  const orphanReferenceSamples: string[] = [];

  if (manuscriptBodyText) {
    const citedSet = extractInTextCitationNumbers(manuscriptBodyText);
    if (citedSet.size > 0) {
      // Check if reference items (1 to totalReferences) were called in text
      for (let i = 1; i <= Math.min(totalReferences, 150); i++) {
        if (!citedSet.has(i)) {
          orphanReferencesCount++;
          if (orphanReferenceSamples.length < 3 && references[i - 1]) {
            orphanReferenceSamples.push(`Ref #${i}: ${references[i - 1].slice(0, 100)}...`);
          }
        }
      }
    }
  }

  // Sorted Year Distribution
  const yearDistribution: YearDistribution[] = Array.from(yearCounts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  // Literature Staleness Assessment
  const isStaleLiterature = last5YearsPercent < 30 && extractedYears.length >= 10;

  let summary = "";
  if (extractedYears.length === 0) {
    summary = `Analyzed ${totalReferences} references. Publication years were not consistently formatted.`;
  } else if (isStaleLiterature) {
    summary = `Literature aging alert: Only ${last5YearsPercent}% of references were published in the last 5 years (median year: ${medianYear}). In fast-moving scientific fields, reviewers may penalize omission of recent contemporary literature.`;
  } else {
    summary = `Healthy bibliometric recency: ${last5YearsPercent}% of cited references are from the last 5 years (median: ${medianYear}, citation half-life: ${citationHalfLifeYears} years). Self-citation rate is balanced at ${selfCitationPercent}%.`;
  }

  return {
    totalReferences,
    medianYear,
    citationHalfLifeYears,
    last3YearsCount,
    last3YearsPercent,
    last5YearsCount,
    last5YearsPercent,
    classicCount,
    classicPercent,
    selfCitationCount,
    selfCitationPercent,
    orphanReferencesCount,
    orphanReferenceSamples,
    yearDistribution,
    summary,
    isStaleLiterature,
  };
}
