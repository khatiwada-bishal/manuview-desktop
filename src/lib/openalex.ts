// OpenAlex free academic API client for bibliographic lookup and journal source retrieval
import { titleSimilarity, normalizeTitle } from "./utils";

const POLITE_USER_AGENT = "ManuView-OpenPreSubmission/1.0 (mailto:research@manuview.org)";
const POLITE_MAILTO = "research@manuview.org";

export interface OpenAlexWork {
  id: string;
  doi?: string;
  title: string;
  publicationYear?: number;
  citedByCount?: number;
  abstract?: string;
  isOpenAccess: boolean;
  authors?: string[];
  journal?: string;
  relatedWorks?: string[];
  referencedWorks?: string[];
}

export interface OpenAlexSource {
  id: string;
  displayName: string;
  hostOrganization?: string;
  issn?: string[];
  issnL?: string;
  type?: string;
  countryCode?: string;
  isOa: boolean;
  isInDoaj?: boolean;
  apcUsd?: number | null;
  apcPrices?: { price: number; currency: string }[];
  twoYearMeanCitedness?: number;
  hIndex?: number;
  i10Index?: number;
  concepts: { id: string; displayName: string; score: number }[];
  topics: { id: string; displayName: string; subfield?: string; field?: string; domain?: string }[];
  homepageUrl?: string;
  worksCount?: number;
  citedByCount?: number;
}

// OpenAlex inverted abstract reconstructor
function reconstructAbstract(invertedIndex?: Record<string, number[]>): string {
  if (!invertedIndex) return "";
  const words: { word: string; pos: number }[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push({ word, pos });
    }
  }
  words.sort((a, b) => a.pos - b.pos);
  return words.map(w => w.word).join(" ");
}

export function parseOpenAlexSource(hit: any): OpenAlexSource {
  const concepts = (hit.x_concepts || []).map((c: { id: string; display_name: string; score?: number }) => ({
    id: c.id,
    displayName: c.display_name,
    score: c.score || 0,
  }));

  const topics = (hit.topics || []).map((t: { id: string; display_name: string; subfield?: { display_name?: string }; field?: { display_name?: string }; domain?: { display_name?: string } }) => ({
    id: t.id,
    displayName: t.display_name,
    subfield: t.subfield?.display_name,
    field: t.field?.display_name,
    domain: t.domain?.display_name,
  }));

  return {
    id: hit.id,
    displayName: hit.display_name,
    hostOrganization: hit.host_organization_name,
    issn: hit.issn,
    issnL: hit.issn_l,
    type: hit.type,
    countryCode: hit.country_code,
    isOa: Boolean(hit.is_oa),
    isInDoaj: Boolean(hit.is_in_doaj),
    apcUsd: hit.apc_usd !== undefined && hit.apc_usd !== null ? Number(hit.apc_usd) : null,
    apcPrices: Array.isArray(hit.apc_prices)
      ? hit.apc_prices.map((p: any) => ({ price: Number(p.price), currency: String(p.currency) }))
      : undefined,
    twoYearMeanCitedness:
      hit.summary_stats?.["2yr_mean_citedness"] !== undefined
        ? Number(hit.summary_stats["2yr_mean_citedness"])
        : undefined,
    hIndex: hit.summary_stats?.["h_index"] !== undefined ? Number(hit.summary_stats["h_index"]) : undefined,
    i10Index: hit.summary_stats?.["i10_index"] !== undefined ? Number(hit.summary_stats["i10_index"]) : undefined,
    concepts,
    topics,
    homepageUrl: hit.homepage_url,
    worksCount: hit.works_count,
    citedByCount: hit.cited_by_count,
  };
}

export function parseOpenAlexWork(data: any): OpenAlexWork {
  const authors = Array.isArray(data.authorships)
    ? data.authorships
        .map((a: any) => a.author?.display_name || a.raw_author_name)
        .filter(Boolean)
    : undefined;

  const journal =
    data.primary_location?.source?.display_name ||
    data.host_venue?.display_name ||
    undefined;

  return {
    id: data.id,
    doi: data.doi,
    title: data.title || "Untitled",
    publicationYear: data.publication_year,
    citedByCount: data.cited_by_count ?? 0,
    abstract: reconstructAbstract(data.abstract_inverted_index),
    isOpenAccess: Boolean(data.open_access?.is_oa),
    authors,
    journal,
    relatedWorks: Array.isArray(data.related_works) ? data.related_works : [],
    referencedWorks: Array.isArray(data.referenced_works) ? data.referenced_works : [],
  };
}

export async function fetchWorkByDOI(doi: string): Promise<OpenAlexWork | null> {
  const cleanDoi = encodeURIComponent(doi.trim().replace(/^https?:\/\/doi\.org\//i, ""));
  const url = `https://api.openalex.org/works/https://doi.org/${cleanDoi}?mailto=${encodeURIComponent(POLITE_MAILTO)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": POLITE_USER_AGENT,
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    return parseOpenAlexWork(data);
  } catch {
    return null;
  }
}

/**
 * Fetches OpenAlex works in batch for a set of DOIs with chunking (up to 25 per request)
 * and retrieves their metadata, citation counts, and related works graph connections.
 */
export async function fetchRelatedWorksBatch(dois: string[]): Promise<OpenAlexWork[]> {
  const cleanDois = Array.from(
    new Set(
      dois
        .map((d) => d.trim().replace(/^https?:\/\/doi\.org\//i, "").toLowerCase())
        .filter((d) => d.length > 5 && d.includes("/"))
    )
  );

  if (cleanDois.length === 0) return [];

  const CHUNK_SIZE = 25;
  const results: OpenAlexWork[] = [];

  for (let i = 0; i < cleanDois.length; i += CHUNK_SIZE) {
    const chunk = cleanDois.slice(i, i + CHUNK_SIZE);
    const filterParam = chunk.map((d) => `doi:https://doi.org/${encodeURIComponent(d)}`).join("|");
    const url = `https://api.openalex.org/works?filter=${filterParam}&per_page=${chunk.length}&mailto=${encodeURIComponent(POLITE_MAILTO)}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        headers: {
          "User-Agent": POLITE_USER_AGENT,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const data = await res.json();
      if (Array.isArray(data.results)) {
        for (const item of data.results) {
          results.push(parseOpenAlexWork(item));
        }
      }
    } catch {
      // Gracefully continue to next chunk on network/timeout error
    }
  }

  return results;
}

/**
 * Fetches OpenAlex works by OpenAlex IDs (e.g. ['https://openalex.org/W12345', 'W67890'])
 */
export async function fetchWorksByIdsBatch(ids: string[]): Promise<OpenAlexWork[]> {
  const cleanIds = Array.from(
    new Set(
      ids
        .map((id) => id.trim().replace(/^https?:\/\/openalex\.org\//i, ""))
        .filter((id) => id.startsWith("W") && id.length > 3)
    )
  );

  if (cleanIds.length === 0) return [];

  const CHUNK_SIZE = 25;
  const results: OpenAlexWork[] = [];

  for (let i = 0; i < cleanIds.length; i += CHUNK_SIZE) {
    const chunk = cleanIds.slice(i, i + CHUNK_SIZE);
    const filterParam = chunk.map((id) => `openalex:${id}`).join("|");
    const url = `https://api.openalex.org/works?filter=${filterParam}&per_page=${chunk.length}&mailto=${encodeURIComponent(POLITE_MAILTO)}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        headers: {
          "User-Agent": POLITE_USER_AGENT,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const data = await res.json();
      if (Array.isArray(data.results)) {
        for (const item of data.results) {
          results.push(parseOpenAlexWork(item));
        }
      }
    } catch {
      // Gracefully continue
    }
  }

  return results;
}

export type OpenAlexLookup =
  | { outcome: 'found'; source: OpenAlexSource }
  | { outcome: 'not_found' }
  | { outcome: 'low_confidence'; candidate: string; similarity: number }
  | { outcome: 'unavailable'; reason: string };

/**
 * Searches OpenAlex /sources for live journal scope concepts, metrics, and topics (A5, REQ-OA-01)
 */
export async function searchJournalInOpenAlex(journalName: string): Promise<OpenAlexLookup> {
  const cleanName = journalName.trim();
  if (!cleanName || cleanName.length < 3) return { outcome: 'not_found' };

  const url = `https://api.openalex.org/sources?search=${encodeURIComponent(cleanName)}&mailto=${encodeURIComponent(POLITE_MAILTO)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": POLITE_USER_AGENT,
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 429) {
      return { outcome: 'unavailable', reason: 'OpenAlex API rate limit reached (HTTP 429)' };
    }

    if (!res.ok) {
      return { outcome: 'unavailable', reason: `OpenAlex service returned HTTP ${res.status}` };
    }

    const data = await res.json();
    const hit = data.results?.[0];
    if (!hit || !hit.display_name) {
      return { outcome: 'not_found' };
    }

    // Verify name match confidence
    const sim = titleSimilarity(hit.display_name, cleanName);
    const normHit = normalizeTitle(hit.display_name);
    const normQuery = normalizeTitle(cleanName);

    if (sim < 0.35 && !normHit.includes(normQuery) && !normQuery.includes(normHit)) {
      return { outcome: 'low_confidence', candidate: hit.display_name, similarity: sim };
    }

    const source = parseOpenAlexSource(hit);
    return { outcome: 'found', source };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { outcome: 'unavailable', reason: 'OpenAlex request timed out' };
    }
    return { outcome: 'unavailable', reason: err?.message || 'OpenAlex service unreachable' };
  }
}

/**
 * Live search multiple journal candidates from OpenAlex /sources (e.g. for autocomplete or discovery)
 */
export async function searchJournalsInOpenAlex(query: string, limit: number = 10): Promise<OpenAlexSource[]> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  const url = `https://api.openalex.org/sources?search=${encodeURIComponent(clean)}&per-page=${limit}&mailto=${encodeURIComponent(POLITE_MAILTO)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": POLITE_USER_AGENT,
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    const results = data.results || [];
    return results.map((hit: any) => parseOpenAlexSource(hit));
  } catch {
    return [];
  }
}

/**
 * Fetches comprehensive journal details by OpenAlex ID or direct name
 */
export async function fetchJournalDetails(journalNameOrId: string): Promise<OpenAlexSource | null> {
  const clean = journalNameOrId.trim();
  if (!clean) return null;

  // If it is an OpenAlex ID (e.g. "https://openalex.org/S137773608" or "S137773608")
  const idMatch = clean.match(/([sS]\d+)$/);
  if (idMatch) {
    const rawId = idMatch[1].toUpperCase();
    const url = `https://api.openalex.org/sources/${rawId}?mailto=${encodeURIComponent(POLITE_MAILTO)}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        headers: {
          "User-Agent": POLITE_USER_AGENT,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const hit = await res.json();
        return parseOpenAlexSource(hit);
      }
    } catch {
      // fallback to search
    }
  }

  const lookup = await searchJournalInOpenAlex(clean);
  if (lookup.outcome === "found") {
    return lookup.source;
  }
  return null;
}

/**
 * Computes semantic scope overlap between a manuscript and an OpenAlex journal source profile
 */
export function evaluateOpenAlexScopeFit(
  source: OpenAlexSource,
  manuscriptText: string,
  keywords: string[] = []
): {
  isScopeMatch: boolean;
  matchedConcepts: string[];
  scopeConfidence: number;
  summary: string;
} {
  const normText = normalizeTitle(manuscriptText);
  const normKeywords = keywords.map((k) => normalizeTitle(k));

  const matchedConcepts: string[] = [];

  for (const c of source.concepts) {
    const conceptLower = c.displayName.toLowerCase();
    const isConceptInText = normText.includes(conceptLower);
    const isConceptInKeywords = normKeywords.some((k) => k.includes(conceptLower) || conceptLower.includes(k));

    if (isConceptInText || isConceptInKeywords) {
      matchedConcepts.push(c.displayName);
    }
  }

  for (const t of source.topics) {
    if (t.subfield && normText.includes(t.subfield.toLowerCase())) {
      if (!matchedConcepts.includes(t.subfield)) matchedConcepts.push(t.subfield);
    }
    if (t.field && normText.includes(t.field.toLowerCase())) {
      if (!matchedConcepts.includes(t.field)) matchedConcepts.push(t.field);
    }
  }

  const isScopeMatch = matchedConcepts.length > 0;
  const scopeConfidence = isScopeMatch
    ? Math.min(92, Math.max(72, 72 + (matchedConcepts.length - 1) * 6))
    : 44;

  const summary = isScopeMatch
    ? `Thematic scope alignment verified via OpenAlex concept indexing: ${matchedConcepts.slice(0, 3).join(", ")}.`
    : `Manuscript shows limited direct keyword overlap with OpenAlex primary subject headings for ${source.displayName}.`;

  return {
    isScopeMatch,
    matchedConcepts,
    scopeConfidence,
    summary,
  };
}
