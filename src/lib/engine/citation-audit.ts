import { batchVerifyReferences } from "../crossref";
import { detectPublishedArticle } from "../publication-detector";
import { CitationIntegritySummary, ReferenceVerification } from "../types";
import { escapeRegex, normalizeAuthorName, parseManuscriptAuthor } from "./shared-utils";
import { MIN_VERIFIED_REFS_FOR_SELF_CITATION } from "./types";

export { batchVerifyReferences, detectPublishedArticle };

/**
 * Computes comprehensive citation integrity metrics across verified references:
 * - DOI resolution coverage and verification rate
 * - Retraction status and expression of concern flags
 * - Recency distribution profile (last 5 years vs older)
 * - Evidenced author self-citation ratio using disambiguated surname matching
 */
export function computeCitationIntegrity(
  verifiedRefs: ReferenceVerification[],
  totalRefsCount: number,
  manuscriptAuthors?: string[]
): CitationIntegritySummary {
  // Input immutability: clone incoming references so caller data remains pristine
  const safeRefs: ReferenceVerification[] = (verifiedRefs || []).map((r) => ({ ...r }));
  const totalReferences = totalRefsCount || safeRefs.length;
  const sampledCount = safeRefs.length;

  let retractedCount = 0;
  let expressionOfConcernCount = 0;
  let unresolvableCount = 0;
  let verifiedCount = 0;
  let uncheckedCount = 0;

  for (const r of safeRefs) {
    if (r.status === "retracted" || r.isRetracted) {
      retractedCount++;
    } else if (r.status === "expression_of_concern") {
      expressionOfConcernCount++;
    } else if (r.status === "unresolvable") {
      unresolvableCount++;
    } else if (r.status === "valid") {
      verifiedCount++;
    } else {
      uncheckedCount++;
    }
  }

  const checkedCount = sampledCount - uncheckedCount;
  const retractionCheckAvailable = checkedCount > 0;

  let coverageNote: string;
  if (totalReferences === 0) {
    coverageNote = "No bibliography references detected.";
  } else if (sampledCount < totalReferences) {
    const unconfirmed = sampledCount - verifiedCount;
    coverageNote = `${verifiedCount} of the first ${sampledCount} references verified (${totalReferences} total; ${unconfirmed} could not be checked).`;
  } else {
    const unconfirmed = totalReferences - verifiedCount;
    coverageNote =
      unconfirmed > 0
        ? `${verifiedCount} of ${totalReferences} references verified (${unconfirmed} could not be confirmed).`
        : `All ${totalReferences} references verified.`;
  }

  const currentYear = new Date().getFullYear();
  const datedRefs = safeRefs.filter((r) => typeof r.year === "number" && r.year <= currentYear + 1);
  const recentCount = datedRefs.filter((r) => {
    const diff = currentYear - (r.year as number);
    return diff >= 0 && diff <= 5;
  }).length;

  let recencyProfile: CitationIntegritySummary["recencyProfile"] = undefined;
  if (datedRefs.length > 0) {
    const last5 = Math.round((recentCount / datedRefs.length) * 100);
    recencyProfile = {
      last5YearsPercent: last5,
      olderThan5YearsPercent: 100 - last5,
    };
  }

  // Calculate evidenced self-citation ratio if author names are present (REQ-CIT-02)
  let selfCitationPercent: number | undefined = undefined;
  let selfCitationRatio: number | undefined = undefined;
  let selfCitationNote: string | undefined = undefined;

  if (!manuscriptAuthors || manuscriptAuthors.length === 0) {
    selfCitationNote = "Self-citation metric unavailable: no manuscript authors identified.";
  } else if (checkedCount < MIN_VERIFIED_REFS_FOR_SELF_CITATION) {
    selfCitationNote = `Self-citation metric requires at least ${MIN_VERIFIED_REFS_FOR_SELF_CITATION} verified references (${checkedCount} available).`;
  } else {
    const parsedManuscriptAuthors = manuscriptAuthors
      .map(parseManuscriptAuthor)
      .filter((a): a is { family: string; initial?: string } => Boolean(a));

    if (parsedManuscriptAuthors.length === 0) {
      selfCitationNote = "Self-citation metric unavailable: author names could not be resolved.";
    } else {
      let selfCount = 0;
      for (const ref of safeRefs) {
        if (ref.status === "unchecked") continue;

        let isMatch = false;
        const refFamilyNames: string[] =
          ref.familyNames && ref.familyNames.length > 0
            ? ref.familyNames
            : (ref.authors || [])
                .map((a: string) => {
                  const clean = normalizeAuthorName(a);
                  if (clean.includes(",")) return clean.split(",")[0].trim().replace(/[^a-z]/g, "");
                  const toks = clean.split(/\s+/).filter(Boolean);
                  return toks.length > 0 ? toks[toks.length - 1].replace(/[^a-z]/g, "") : "";
                })
                .filter(Boolean);

        if (refFamilyNames.length > 0) {
          for (const rawFam of refFamilyNames) {
            const fam = normalizeAuthorName(rawFam).replace(/[^a-z]/g, "");
            if (!fam) continue;

            for (const msAuth of parsedManuscriptAuthors) {
              if (msAuth.family === fam) {
                if (fam.length >= 4) {
                  // Standard surname (>= 4 chars): high confidence exact match
                  isMatch = true;
                  break;
                } else if (msAuth.initial) {
                  // Short surname (2-3 chars) WITH manuscript author initial: disambiguate against ref authors
                  const hasMatchingInitial = (ref.authors || []).some((ra: string) => {
                    const norm = normalizeAuthorName(ra);
                    if (norm.includes(fam)) {
                      const other = norm.replace(fam, "").replace(/[^a-z]/g, "");
                      return other.length > 0 && other[0] === msAuth.initial;
                    }
                    return false;
                  });
                  if (hasMatchingInitial) {
                    isMatch = true;
                    break;
                  }
                } else if (fam.length === 3) {
                  // 3-letter surname WITHOUT initial: match on exact token
                  isMatch = true;
                  break;
                }
              }
            }
            if (isMatch) break;
          }
        } else {
          // Unstructured fallback: flag as low confidence and exclude from headline ratio
          const rawTextLower = normalizeAuthorName(ref.raw || "").slice(0, 80);
          for (const msAuth of parsedManuscriptAuthors) {
            const escapedFam = escapeRegex(msAuth.family);
            if (new RegExp(`\\b${escapedFam}\\b`, "i").test(rawTextLower)) {
              ref.matchConfidence = 0.3;
              break;
            }
          }
        }

        if (isMatch) {
          ref.matchConfidence = 1.0;
          selfCount++;
        }
      }

      selfCitationPercent = Math.round((selfCount / checkedCount) * 1000) / 10;
      selfCitationRatio = selfCitationPercent;
      selfCitationNote = `Calculated across ${checkedCount} verified references against ${parsedManuscriptAuthors.length} author(s) (${selfCitationPercent}% self-citation rate).`;
    }
  }

  return {
    totalReferences,
    sampledCount,
    checkedCount,
    coverageNote,
    verifiedCount,
    unresolvableCount,
    uncheckedCount,
    retractedCount,
    expressionOfConcernCount,
    retractionCheckAvailable,
    selfCitationPercent,
    selfCitationRatio,
    selfCitationNote,
    recencyProfile,
    references: safeRefs,
  };
}
