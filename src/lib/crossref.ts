import { ReferenceVerification, ReferenceStatus } from "./types";
import { checkRetractionStatus } from "./retractions";
import { normalizeTitle, titleSimilarity } from "./utils";

const POLITE_USER_AGENT = "ManuView-OpenPreSubmission/1.0 (mailto:research@manuview.org; https://github.com/khatiwada-bishal/manuview)";
const POLITE_MAILTO = "research@manuview.org";

/**
 * Searches Crossref using bibliographic metadata for references lacking explicit DOIs (A7)
 */
async function fetchCrossrefWithRetry(
  url: string,
  maxRetries = 2,
  maxTotalMs = 8000
): Promise<Response | null> {
  const startTime = Date.now();
  let attempt = 0;

  while (attempt <= maxRetries) {
    const elapsed = Date.now() - startTime;
    const remainingMs = Math.max(1000, maxTotalMs - elapsed);
    if (elapsed >= maxTotalMs) break;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.min(6000, remainingMs));

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": POLITE_USER_AGENT,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 429 && attempt < maxRetries) {
        attempt++;
        const retryHeader = res.headers.get("Retry-After");
        let delayMs = retryHeader ? parseInt(retryHeader, 10) * 1000 : Math.pow(2, attempt) * 1000;
        if (isNaN(delayMs) || delayMs <= 0) delayMs = 1000;
        delayMs = Math.min(delayMs, maxTotalMs - (Date.now() - startTime));
        if (delayMs > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
      }
      return res;
    } catch {
      clearTimeout(timeoutId);
      if (attempt >= maxRetries) return null;
      attempt++;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  return null;
}

// High-performance session in-memory DOI verification cache (E1)
const DOI_VERIFICATION_CACHE = new Map<string, Partial<ReferenceVerification>>();

export function clearDoiCache(): void {
  DOI_VERIFICATION_CACHE.clear();
}

export function getCachedDoiVerification(doi: string): Partial<ReferenceVerification> | undefined {
  const clean = doi.trim().toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").replace(/[.,;)\]]+$/, "");
  return DOI_VERIFICATION_CACHE.get(clean);
}

export async function searchReferenceBibliographic(referenceText: string): Promise<ReferenceVerification | null> {
  const cleanRef = referenceText.trim();
  if (!cleanRef || cleanRef.length < 15) return null;

  const url = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(cleanRef)}&rows=1&mailto=${encodeURIComponent(POLITE_MAILTO)}`;

  try {
    const res = await fetchCrossrefWithRetry(url);
    if (!res || !res.ok) return null;

    const data = await res.json();
    const item = data.message?.items?.[0];
    if (!item || !item.DOI) return null;

    const matchedTitle = item.title?.[0] || "";
    if (!matchedTitle) return null;

    // Check title similarity and word containment
    const sim = titleSimilarity(matchedTitle, cleanRef);
    const titleWords = normalizeTitle(matchedTitle).split(" ").filter((w: string) => w.length > 3);
    const refNormalized = normalizeTitle(cleanRef);
    const containedCount = titleWords.filter((w: string) => refNormalized.includes(w)).length;
    const containmentRatio = titleWords.length > 0 ? containedCount / titleWords.length : 0;

    // Confident match requires either significant Jaccard similarity or >=70% key title words present in citation
    if (sim < 0.45 && (containmentRatio < 0.70 || titleWords.length < 2)) {
      return null;
    }

    const doi = item.DOI;
    const journal = item["container-title"]?.[0];
    const year =
      item.published?.["date-parts"]?.[0]?.[0] ||
      item["created"]?.["date-parts"]?.[0]?.[0];
    const authors = item.author
      ?.map((a: { given?: string; family?: string }) => [a.given, a.family].filter(Boolean).join(" "))
      .filter(Boolean);
    const familyNames = item.author
      ?.map((a: { family?: string }) => a.family?.trim())
      .filter((f: string | undefined): f is string => Boolean(f));

    // G3: Year corroboration (±1 year agreement when year is present in citation)
    const refYearMatch = cleanRef.match(/\b(19\d\d|20\d\d)\b/);
    if (refYearMatch && year) {
      const refYear = parseInt(refYearMatch[1], 10);
      if (Math.abs(refYear - year) > 1) {
        return null; // Year mismatch: avoid attributing wrong DOI
      }
    }

    // G3: Author surname corroboration (≥1 author surname match in reference string)
    if (familyNames && familyNames.length > 0) {
      const refLower = cleanRef.toLowerCase();
      const hasAuthorSurnameMatch = familyNames.some((fam: string) => {
        const cleanFam = fam.toLowerCase().replace(/[^a-z]/g, "");
        if (cleanFam.length < 3) return false;
        const wordRegex = new RegExp(`\\b${cleanFam}\\b`, "i");
        return wordRegex.test(refLower);
      });

      if (!hasAuthorSurnameMatch) {
        return null; // Author mismatch: avoid attributing wrong DOI
      }
    }

    const matchConfidence = Math.round(Math.max(sim, containmentRatio) * 100) / 100;

    let isRetracted = false;
    let isExpressionOfConcern = false;
    let isRetractionNotice = false;
    let retractionDetails: string | undefined = undefined;

    // G2 Fix: ONLY inspect updated-by for retraction status of THIS target paper
    const updates = Array.isArray(item["updated-by"]) ? item["updated-by"] : [];
    for (const update of updates) {
      const uType = String(update.type || "").toLowerCase();
      const uLabel = String(update.label || "").toLowerCase();
      if (uType === "retraction" || uLabel.includes("retraction")) {
        isRetracted = true;
        retractionDetails = update.doi
          ? `Crossref metadata indicates retraction (Notice DOI: ${update.doi})`
          : "Crossref metadata indicates article has been retracted";
        break;
      } else if (uType === "expression_of_concern" || uLabel.includes("expression of concern")) {
        isExpressionOfConcern = true;
        retractionDetails = update.doi
          ? `Crossref metadata indicates Expression of Concern (Notice DOI: ${update.doi})`
          : "Subject to an editorial Expression of Concern";
      }
    }

    // G2: Check update-to (this work retracts another work -> this work is a retraction notice)
    const updateTo = Array.isArray(item["update-to"]) ? item["update-to"] : [];
    for (const ut of updateTo) {
      const uType = String(ut.type || "").toLowerCase();
      if (uType === "retraction" || uType.includes("retract")) {
        isRetractionNotice = true;
      }
    }

    if (item.type === "retraction") {
      isRetractionNotice = true;
    }

    const titleStr = typeof matchedTitle === "string" ? matchedTitle : "";
    if (/^retracted\b/i.test(titleStr) || /[\[(]retracted[\])]/i.test(titleStr)) {
      isRetracted = true;
      retractionDetails = retractionDetails || "Article title explicitly marked as RETRACTED";
    } else if (/[\[(]expression of concern[\])]/i.test(titleStr)) {
      isExpressionOfConcern = true;
      retractionDetails = retractionDetails || "Article title explicitly marked with Expression of Concern";
    }

    // E2: Consult local Retraction Watch database
    const knownStatus = checkRetractionStatus(doi, matchedTitle);
    if (knownStatus.isRetracted) {
      isRetracted = true;
      retractionDetails = knownStatus.reason || retractionDetails;
    } else if (knownStatus.isExpressionOfConcern && !isRetracted) {
      isExpressionOfConcern = true;
      retractionDetails = knownStatus.reason || retractionDetails;
    }
    if (knownStatus.isRetractionNotice) {
      isRetractionNotice = true;
    }

    const status: ReferenceStatus = isRetracted
      ? "retracted"
      : isExpressionOfConcern
      ? "expression_of_concern"
      : "valid";

    const result: ReferenceVerification = {
      raw: referenceText,
      doi,
      title: matchedTitle,
      journal,
      year,
      authors,
      familyNames,
      matchConfidence,
      status,
      isRetracted,
      isRetractionNotice,
      retractionDetails,
      crossrefUrl: item.URL || `https://doi.org/${doi}`,
      resolutionMethod: "bibliographic_search",
    };

    // Cache bibliographic match DOI
    if (doi) {
      const cleanKey = doi.trim().toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").replace(/[.,;)\]]+$/, "");
      DOI_VERIFICATION_CACHE.set(cleanKey, result);
    }

    return result;
  } catch {
    return null;
  }
}

export async function verifyDOIWithCrossref(doi: string): Promise<Partial<ReferenceVerification>> {
  const cleanDoiKey = doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/[.,;)\]]+$/, "");

  // E1: Check in-memory cache first
  if (DOI_VERIFICATION_CACHE.has(cleanDoiKey)) {
    return { ...DOI_VERIFICATION_CACHE.get(cleanDoiKey)! };
  }

  // E2: Local-first retraction lookup (instant local resolution)
  const localRetraction = checkRetractionStatus(cleanDoiKey);

  const cleanDoi = encodeURIComponent(cleanDoiKey);
  // Append mailto parameter so polite pool works reliably even when browser fetch strips custom User-Agent headers
  const url = `https://api.crossref.org/works/${cleanDoi}?mailto=${encodeURIComponent(POLITE_MAILTO)}`;

  try {
    const res = await fetchCrossrefWithRetry(url);
    if (!res) {
      const fallbackResult: Partial<ReferenceVerification> = {
        doi: cleanDoiKey,
        status: localRetraction.isRetracted
          ? "retracted"
          : localRetraction.isExpressionOfConcern
          ? "expression_of_concern"
          : "unchecked",
        isRetracted: localRetraction.isRetracted,
        isRetractionNotice: localRetraction.isRetractionNotice,
        retractionDetails: localRetraction.reason || "Crossref lookup timed out or rate-limited. Status unconfirmed.",
        resolutionMethod: "doi",
      };
      DOI_VERIFICATION_CACHE.set(cleanDoiKey, fallbackResult);
      return fallbackResult;
    }

    // Only genuine 404 indicates an unresolvable / nonexistent DOI
    if (res.status === 404) {
      const notFoundResult: Partial<ReferenceVerification> = {
        doi: cleanDoiKey,
        status: localRetraction.isRetracted ? "retracted" : "unresolvable",
        isRetracted: localRetraction.isRetracted,
        isRetractionNotice: localRetraction.isRetractionNotice,
        retractionDetails: localRetraction.reason || "DOI not found in Crossref registry (HTTP 404)",
        resolutionMethod: "doi",
      };
      DOI_VERIFICATION_CACHE.set(cleanDoiKey, notFoundResult);
      return notFoundResult;
    }

    // Rate limit after retries exhausted - do NOT accuse user of AI hallucination
    if (res.status === 429) {
      const rateLimitedResult: Partial<ReferenceVerification> = {
        doi: cleanDoiKey,
        status: localRetraction.isRetracted ? "retracted" : "unchecked",
        isRetracted: localRetraction.isRetracted,
        isRetractionNotice: localRetraction.isRetractionNotice,
        retractionDetails: localRetraction.reason || "Crossref rate limit reached (HTTP 429). Reference remains unconfirmed.",
        resolutionMethod: "doi",
      };
      return rateLimitedResult;
    }

    if (!res.ok) {
      const errResult: Partial<ReferenceVerification> = {
        doi: cleanDoiKey,
        status: localRetraction.isRetracted ? "retracted" : "unchecked",
        isRetracted: localRetraction.isRetracted,
        isRetractionNotice: localRetraction.isRetractionNotice,
        retractionDetails: localRetraction.reason || `Crossref registry lookup encountered HTTP ${res.status}. Status unconfirmed.`,
        resolutionMethod: "doi",
      };
      return errResult;
    }

    const data = await res.json();
    const message = data.message;
    if (!message) {
      const emptyResult: Partial<ReferenceVerification> = {
        doi: cleanDoiKey,
        status: localRetraction.isRetracted ? "retracted" : "unchecked",
        isRetracted: localRetraction.isRetracted,
        isRetractionNotice: localRetraction.isRetractionNotice,
        retractionDetails: localRetraction.reason || "Crossref returned empty payload. Status unconfirmed.",
        resolutionMethod: "doi",
      };
      return emptyResult;
    }

    const title = message.title?.[0];
    const journal = message["container-title"]?.[0];
    const year = message.published?.["date-parts"]?.[0]?.[0] || message["created"]?.["date-parts"]?.[0]?.[0];
    const authors = message.author
      ?.map((a: { given?: string; family?: string }) => [a.given, a.family].filter(Boolean).join(" "))
      .filter(Boolean);
    const familyNames = message.author
      ?.map((a: { family?: string }) => a.family?.trim())
      .filter((f: string | undefined): f is string => Boolean(f));

    let isRetracted = localRetraction.isRetracted;
    let isExpressionOfConcern = localRetraction.isExpressionOfConcern;
    let isRetractionNotice = Boolean(localRetraction.isRetractionNotice);
    let retractionDetails: string | undefined = localRetraction.reason;

    // G2 Fix: ONLY updated-by contains records that update THIS work (retraction notices, errata, expressions of concern)
    const updatedBy = Array.isArray(message["updated-by"]) ? message["updated-by"] : [];
    for (const update of updatedBy) {
      const uType = String(update.type || "").toLowerCase();
      const uLabel = String(update.label || "").toLowerCase();

      if (uType === "retraction" || uLabel.includes("retract")) {
        isRetracted = true;
        retractionDetails = update.doi
          ? `Crossref metadata indicates retraction (Notice DOI: ${update.doi})`
          : "Crossref metadata indicates article has been retracted";
        break;
      } else if (uType === "expression_of_concern" || uLabel.includes("expression of concern")) {
        isExpressionOfConcern = true;
        retractionDetails = update.doi
          ? `Crossref metadata indicates Expression of Concern (Notice DOI: ${update.doi})`
          : "Subject to an editorial Expression of Concern";
      }
    }

    // G2 Fix: update-to contains records that THIS work updates -> this work is a retraction notice, not a retracted paper
    const updateTo = Array.isArray(message["update-to"]) ? message["update-to"] : [];
    for (const ut of updateTo) {
      const uType = String(ut.type || "").toLowerCase();
      if (uType === "retraction" || uType.includes("retract")) {
        isRetractionNotice = true;
      }
    }

    if (message.type === "retraction") {
      isRetractionNotice = true;
    }

    // Check for explicit title prefix/marker
    const titleStr = typeof title === "string" ? title : "";
    if (/^retracted\b/i.test(titleStr) || /[\[(]retracted[\])]/i.test(titleStr)) {
      isRetracted = true;
      retractionDetails = retractionDetails || "Article title explicitly marked as RETRACTED";
    } else if (/[\[(]expression of concern[\])]/i.test(titleStr)) {
      isExpressionOfConcern = true;
      retractionDetails = retractionDetails || "Article title explicitly marked with Expression of Concern";
    }

    // Also check title against Retraction Watch
    if (!isRetracted) {
      const titleRetraction = checkRetractionStatus(undefined, titleStr);
      if (titleRetraction.isRetracted) {
        isRetracted = true;
        retractionDetails = titleRetraction.reason || retractionDetails;
      }
    }

    const finalStatus: ReferenceStatus = isRetracted
      ? "retracted"
      : isExpressionOfConcern
      ? "expression_of_concern"
      : "valid";

    const verifiedResult: Partial<ReferenceVerification> = {
      doi: cleanDoiKey,
      title,
      journal,
      year,
      authors,
      familyNames,
      matchConfidence: 1.0,
      status: finalStatus,
      isRetracted,
      isRetractionNotice,
      retractionDetails,
      crossrefUrl: message.URL || `https://doi.org/${cleanDoiKey}`,
      resolutionMethod: "doi",
    };

    DOI_VERIFICATION_CACHE.set(cleanDoiKey, verifiedResult);
    return verifiedResult;
  } catch {
    // If request timed out or network error, mark as unchecked, NOT unresolvable
    const netErrResult: Partial<ReferenceVerification> = {
      doi: cleanDoiKey,
      status: localRetraction.isRetracted
        ? "retracted"
        : localRetraction.isExpressionOfConcern
        ? "expression_of_concern"
        : "unchecked",
      isRetracted: localRetraction.isRetracted,
      isRetractionNotice: localRetraction.isRetractionNotice,
      retractionDetails: localRetraction.reason || "Crossref lookup timed out or network unavailable. Status unconfirmed.",
      resolutionMethod: "doi",
    };
    return netErrResult;
  }
}

export async function batchVerifyReferences(
  rawReferences: (string | { raw?: string })[],
  onProgress?: (verified: ReferenceVerification, completedIndex: number, total: number) => void
): Promise<ReferenceVerification[]> {
  const results: ReferenceVerification[] = new Array(rawReferences.length);
  const concurrency = 6;
  let currentIndex = 0;
  let completedCount = 0;

  async function worker() {
    while (currentIndex < rawReferences.length) {
      const idx = currentIndex++;
      const item = rawReferences[idx];
      const raw = typeof item === "string" ? item : item?.raw || "";

      // Extract DOI if present, stripping trailing punctuation (dots, commas, semicolons, brackets)
      const doiMatch = raw.match(/\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/i);
      const doi = doiMatch ? doiMatch[1].replace(/[.,;)\]]+$/, "") : undefined;

      if (doi) {
        const crossrefData = await verifyDOIWithCrossref(doi);
        results[idx] = {
          raw,
          doi,
          title: crossrefData.title,
          journal: crossrefData.journal,
          year: crossrefData.year,
          authors: crossrefData.authors,
          familyNames: crossrefData.familyNames,
          matchConfidence: crossrefData.matchConfidence,
          status: crossrefData.status || "unchecked",
          isRetracted: crossrefData.isRetracted || false,
          isRetractionNotice: crossrefData.isRetractionNotice || false,
          retractionDetails: crossrefData.retractionDetails,
          crossrefUrl: crossrefData.crossrefUrl,
          resolutionMethod: crossrefData.resolutionMethod || "doi",
        };
      } else {
        // 1. E2: Check for explicit textual retraction or local database markers
        const retractionCheck = checkRetractionStatus(undefined, raw);
        if (retractionCheck.isRetracted || retractionCheck.isExpressionOfConcern) {
          results[idx] = {
            raw,
            status: retractionCheck.isRetracted ? "retracted" : "expression_of_concern",
            isRetracted: retractionCheck.isRetracted,
            isRetractionNotice: retractionCheck.isRetractionNotice || false,
            retractionDetails: retractionCheck.reason,
            resolutionMethod: "unresolved",
          };
        } else {
          // 2. A7: Attempt Crossref bibliographic query resolution for DOI-less citations with G3 corroboration
          const resolvedBibliographic = await searchReferenceBibliographic(raw);
          if (resolvedBibliographic && resolvedBibliographic.doi) {
            results[idx] = {
              raw,
              doi: resolvedBibliographic.doi,
              title: resolvedBibliographic.title,
              journal: resolvedBibliographic.journal,
              year: resolvedBibliographic.year,
              authors: resolvedBibliographic.authors,
              familyNames: resolvedBibliographic.familyNames,
              matchConfidence: resolvedBibliographic.matchConfidence,
              status: resolvedBibliographic.status || "valid",
              isRetracted: resolvedBibliographic.isRetracted || false,
              isRetractionNotice: resolvedBibliographic.isRetractionNotice || false,
              retractionDetails: resolvedBibliographic.retractionDetails,
              crossrefUrl: resolvedBibliographic.crossrefUrl,
              resolutionMethod: "bibliographic_search",
            };
          } else {
            // Without a confident DOI or corroborated bibliographic match, references are UNCHECKED (honest)
            results[idx] = {
              raw,
              status: "unchecked",
              isRetracted: false,
              isRetractionNotice: false,
              retractionDetails: "No explicit DOI identified and bibliographic match unconfirmed. Status unverified.",
              resolutionMethod: "unresolved",
            };
          }
        }
      }

      completedCount++;
      if (onProgress) {
        onProgress(results[idx], completedCount, rawReferences.length);
      }
    }
  }

  const workerCount = Math.min(concurrency, rawReferences.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  return results;
}
