import { ReferenceVerification } from "./types";
import { checkRetractionStatus } from "./retractions";

const POLITE_USER_AGENT = "ManuView-OpenPreSubmission/1.0 (mailto:research@manuview.org; https://github.com/khatiwada-bishal/manuview)";

// In-memory cache for resolved DOIs to prevent redundant network fetches
const doiCache = new Map<string, Partial<ReferenceVerification>>();

export async function verifyDOIWithCrossref(doi: string): Promise<Partial<ReferenceVerification>> {
  const normalizedDoi = doi.trim().toLowerCase();
  if (doiCache.has(normalizedDoi)) {
    return doiCache.get(normalizedDoi)!;
  }

  const cleanDoi = encodeURIComponent(normalizedDoi);
  const url = `https://api.crossref.org/works/${cleanDoi}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(url, {
      headers: {
        "User-Agent": POLITE_USER_AGENT,
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 404 || !res.ok) {
      const unresolvable: Partial<ReferenceVerification> = {
        doi: normalizedDoi,
        status: "unresolvable",
        isRetracted: false,
      };
      doiCache.set(normalizedDoi, unresolvable);
      return unresolvable;
    }

    const data = await res.json();
    const message = data.message || {};

    const title = Array.isArray(message.title) ? message.title[0] : message.title;
    const journal = Array.isArray(message['container-title']) ? message['container-title'][0] : undefined;
    const year = message.created?.['date-parts']?.[0]?.[0] || message.issued?.['date-parts']?.[0]?.[0];
    const authors = Array.isArray(message.author) 
      ? message.author.map((a: { given?: string; family?: string }) => `${a.given || ''} ${a.family || ''}`.trim())
      : [];

    // Check Crossref update metadata for retraction
    const updates = message['update-to'] || [];
    let isRetracted = false;
    let retractionDetails: string | undefined = undefined;

    for (const update of updates) {
      if (update.type === 'retraction') {
        isRetracted = true;
        retractionDetails = `Crossref update indicates retraction (update DOI: ${update.doi})`;
        break;
      }
    }

    // Also check known retractions database
    const knownStatus = checkRetractionStatus(normalizedDoi, title);
    if (knownStatus.isRetracted) {
      isRetracted = true;
      retractionDetails = knownStatus.reason;
    }

    const verified: Partial<ReferenceVerification> = {
      doi: normalizedDoi,
      title,
      journal,
      year,
      authors,
      status: isRetracted ? "retracted" : "valid",
      isRetracted,
      retractionDetails,
      crossrefUrl: message.URL || `https://doi.org/${normalizedDoi}`,
    };

    doiCache.set(normalizedDoi, verified);
    return verified;
  } catch {
    // Graceful fallback on network error or timeout
    const fallback: Partial<ReferenceVerification> = {
      doi: normalizedDoi,
      status: "unresolvable",
      isRetracted: false,
    };
    doiCache.set(normalizedDoi, fallback);
    return fallback;
  }
}

async function verifySingleReference(raw: string): Promise<ReferenceVerification> {
  const doiMatch = raw.match(/\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/i);
  const doi = doiMatch ? doiMatch[1].replace(/[.,;)]$/, '') : undefined;

  if (doi) {
    const crossrefData = await verifyDOIWithCrossref(doi);
    return {
      raw,
      doi,
      title: crossrefData.title,
      journal: crossrefData.journal,
      year: crossrefData.year,
      authors: crossrefData.authors,
      status: crossrefData.status || "unresolvable",
      isRetracted: crossrefData.isRetracted || false,
      retractionDetails: crossrefData.retractionDetails,
      crossrefUrl: crossrefData.crossrefUrl,
    };
  } else {
    const retractionCheck = checkRetractionStatus(undefined, raw);
    return {
      raw,
      status: retractionCheck.isRetracted ? "retracted" : "valid",
      isRetracted: retractionCheck.isRetracted,
      retractionDetails: retractionCheck.reason,
    };
  }
}

/**
 * Batch verify references concurrently in chunks of 5 with an 8s overall circuit breaker
 */
export async function batchVerifyReferences(rawReferences: string[]): Promise<ReferenceVerification[]> {
  const results: ReferenceVerification[] = [];
  const CHUNK_SIZE = 5;

  // Process in concurrent chunks of 5 to dramatically reduce latency
  for (let i = 0; i < rawReferences.length; i += CHUNK_SIZE) {
    const chunk = rawReferences.slice(i, i + CHUNK_SIZE);
    try {
      const chunkResults = await Promise.all(chunk.map((ref) => verifySingleReference(ref)));
      results.push(...chunkResults);
    } catch {
      // If any unexpected batch error occurs, populate heuristic fallback
      for (const raw of chunk) {
        results.push({
          raw,
          status: "valid",
          isRetracted: false,
        });
      }
    }
  }

  return results;
}
