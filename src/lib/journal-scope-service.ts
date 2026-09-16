import { useEffect, useState, useRef } from "react";
import { searchJournalInOpenAlex, OpenAlexSource } from "./openalex";
import { JOURNAL_CATALOG, JournalEntry, inferJournalDiscipline, mapOpenAlexToDiscipline } from "./journals";

export interface JournalScopeProfile {
  journalName: string;
  officialName: string;
  publisher?: string;
  issn?: string[];
  issnL?: string;
  countryCode?: string;
  type?: string;
  impactMetric?: string;
  primaryDiscipline: string;
  keyConcepts: string[];
  primaryTopics: string[];
  summaryScope: string;
  aimsAndScope?: string;
  deskRejectHazards?: string[];
  source: "openalex" | "catalog" | "inferred";
  fetchedAt: number;

  // Rich OpenAlex scholarly fields
  openAlexId?: string;
  isOa?: boolean;
  isInDoaj?: boolean;
  apcUsd?: number | null;
  twoYearMeanCitedness?: number;
  hIndex?: number;
  i10Index?: number;
  worksCount?: number;
  citedByCount?: number;
  homepageUrl?: string;
  topicsDetailed?: { id: string; displayName: string; subfield?: string; field?: string; domain?: string }[];
}

const CACHE_KEY = "manuview_journal_scope_cache_v2";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory runtime cache
const memoryCache = new Map<string, JournalScopeProfile>();

function getLocalStorageCache(): Record<string, JournalScopeProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveToLocalStorageCache(key: string, profile: JournalScopeProfile): void {
  if (typeof window === "undefined") return;
  try {
    const store = getLocalStorageCache();
    store[key.toLowerCase().trim()] = profile;
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota limits
  }
}


/**
 * Searches the curated catalog for an exact or case-insensitive match
 */
function findInCuratedCatalog(journalName: string): JournalEntry | undefined {
  const norm = journalName.trim().toLowerCase();
  // 1. Exact match first
  const exact = JOURNAL_CATALOG.find((j) => j.name.toLowerCase() === norm);
  if (exact) return exact;

  // 2. Word boundary / strip subtitle or parentheses match
  const strippedNorm = norm.replace(/\s*\([^)]*\)/g, "").trim();
  const parenMatch = JOURNAL_CATALOG.find((j) => {
    const jClean = j.name.toLowerCase().replace(/\s*\([^)]*\)/g, "").trim();
    return jClean === norm || jClean === strippedNorm;
  });
  if (parenMatch) return parenMatch;

  // 3. Prefix match for queries >= 5 chars
  if (norm.length >= 5) {
    const prefixMatch = JOURNAL_CATALOG.find((j) => j.name.toLowerCase().startsWith(norm));
    if (prefixMatch) return prefixMatch;
  }

  return undefined;
}

/**
 * Fetches live journal scope in the background from open scholarly registries (OpenAlex / Catalog)
 */
export async function fetchLiveJournalScope(journalName: string): Promise<JournalScopeProfile | null> {
  const clean = journalName.trim();
  if (!clean || clean.length < 2) return null;
  const cacheKey = clean.toLowerCase();

  // 1. Check in-memory cache
  const inMem = memoryCache.get(cacheKey);
  if (inMem && Date.now() - inMem.fetchedAt < CACHE_TTL_MS) {
    return inMem;
  }

  // 2. Check localStorage cache
  const localStore = getLocalStorageCache();
  const cached = localStore[cacheKey];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    memoryCache.set(cacheKey, cached);
    return cached;
  }

  // 3. Check curated catalog first for rich benchmark metadata
  const catalogEntry = findInCuratedCatalog(clean);

  // 4. Query live scholarly registry via OpenAlex
  let openAlexSource: OpenAlexSource | null = null;
  try {
    const lookup = await searchJournalInOpenAlex(clean);
    if (lookup.outcome === "found") {
      openAlexSource = lookup.source;
    }
  } catch {
    // Graceful offline fallback
  }

  // 5. Synthesize unified JournalScopeProfile
  let profile: JournalScopeProfile;

  if (openAlexSource) {
    const rawConcepts = openAlexSource.concepts.map((c) => c.displayName);
    const rawTopics = openAlexSource.topics.map((t) => t.displayName);
    const keyConcepts = (rawConcepts.length > 0 ? rawConcepts : rawTopics).slice(0, 6);
    if (keyConcepts.length === 0 && catalogEntry?.keyExpectations) {
      keyConcepts.push(...catalogEntry.keyExpectations.slice(0, 3));
    }
    if (keyConcepts.length === 0 && catalogEntry?.discipline) {
      keyConcepts.push(catalogEntry.discipline);
    }

    const primaryTopics = openAlexSource.topics
      .slice(0, 4)
      .map((t) => t.displayName);

    const mappedDiscipline = mapOpenAlexToDiscipline(
      openAlexSource.topics[0]?.field,
      openAlexSource.topics[0]?.domain,
      openAlexSource.topics[0]?.subfield
    );

    const detectedDiscipline =
      catalogEntry?.discipline ||
      mappedDiscipline ||
      inferJournalDiscipline(openAlexSource.displayName) ||
      inferJournalDiscipline(clean) ||
      "Scholarly Research";

    const citedness = openAlexSource.twoYearMeanCitedness
      ? `2-Yr Citedness: ${openAlexSource.twoYearMeanCitedness.toFixed(1)}`
      : catalogEntry?.impactFactor
      ? `IF: ${catalogEntry.impactFactor.toFixed(1)}`
      : undefined;

    const summaryParts: string[] = [];
    if (openAlexSource.hostOrganization) {
      summaryParts.push(`Published by ${openAlexSource.hostOrganization}.`);
    }
    if (keyConcepts.length > 0) {
      summaryParts.push(`Primary subject domains: ${keyConcepts.slice(0, 3).join(", ")}.`);
    }
    if (catalogEntry?.aimsAndScope) {
      summaryParts.push(catalogEntry.aimsAndScope);
    }

    profile = {
      journalName: clean,
      officialName: openAlexSource.displayName,
      publisher: openAlexSource.hostOrganization || catalogEntry?.publisher || "Academic Publisher",
      issn: openAlexSource.issn,
      issnL: openAlexSource.issnL,
      countryCode: openAlexSource.countryCode,
      type: openAlexSource.type,
      impactMetric: citedness,
      primaryDiscipline: detectedDiscipline,
      keyConcepts,
      primaryTopics,
      summaryScope: summaryParts.join(" ") || `Peer-reviewed venue in ${detectedDiscipline}.`,
      aimsAndScope: catalogEntry?.aimsAndScope,
      deskRejectHazards: catalogEntry?.deskRejectHazards,
      source: "openalex",
      fetchedAt: Date.now(),
      // Rich OpenAlex metrics
      openAlexId: openAlexSource.id,
      isOa: openAlexSource.isOa,
      isInDoaj: openAlexSource.isInDoaj,
      apcUsd: openAlexSource.apcUsd,
      twoYearMeanCitedness: openAlexSource.twoYearMeanCitedness,
      hIndex: openAlexSource.hIndex,
      i10Index: openAlexSource.i10Index,
      worksCount: openAlexSource.worksCount,
      citedByCount: openAlexSource.citedByCount,
      homepageUrl: openAlexSource.homepageUrl,
      topicsDetailed: openAlexSource.topics,
    };
  } else if (catalogEntry) {
    profile = {
      journalName: clean,
      officialName: catalogEntry.name,
      publisher: catalogEntry.publisher,
      impactMetric: `IF: ${catalogEntry.impactFactor.toFixed(1)}`,
      primaryDiscipline: catalogEntry.discipline,
      keyConcepts: [catalogEntry.discipline],
      primaryTopics: [catalogEntry.discipline],
      summaryScope: catalogEntry.aimsAndScope,
      aimsAndScope: catalogEntry.aimsAndScope,
      deskRejectHazards: catalogEntry.deskRejectHazards,
      source: "catalog",
      fetchedAt: Date.now(),
    };
  } else {
    const inferred = inferJournalDiscipline(clean) || "Scholarly Research";
    profile = {
      journalName: clean,
      officialName: clean,
      publisher: "Academic Publisher",
      primaryDiscipline: inferred,
      keyConcepts: [inferred],
      primaryTopics: [inferred],
      summaryScope: `Academic journal operating primarily in ${inferred}.`,
      source: "inferred",
      fetchedAt: Date.now(),
    };
  }

  // Cache result
  memoryCache.set(cacheKey, profile);
  saveToLocalStorageCache(cacheKey, profile);

  return profile;
}

/**
 * React hook that fetches journal scope in the background with debouncing
 */
export function useJournalScope(journalName: string) {
  const [scope, setScope] = useState<JournalScopeProfile | null>(() => {
    if (!journalName) return null;
    const clean = journalName.trim().toLowerCase();
    return memoryCache.get(clean) || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const clean = (journalName || "").trim();
    if (!clean || clean.length < 3) {
      setScope(null);
      setIsLoading(false);
      return;
    }

    // If already in memory cache, update synchronously without loading flicker
    const cached = memoryCache.get(clean.toLowerCase());
    if (cached) {
      setScope(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    timerRef.current = setTimeout(async () => {
      try {
        const result = await fetchLiveJournalScope(clean);
        setScope(result);
      } catch (err: any) {
        setError(err.message || "Failed to retrieve journal scope");
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [journalName]);

  return { scope, isLoading, error };
}

/**
 * Resolves the official journal homepage (from OpenAlex or scope cache) and opens it in the default browser
 */
export async function openJournalWebsite(journalName: string, knownHomepage?: string): Promise<void> {
  const { openExternalLink } = await import("./desktop");

  if (knownHomepage && /^https?:\/\//i.test(knownHomepage.trim())) {
    await openExternalLink(knownHomepage.trim());
    return;
  }

  const clean = (journalName || "").trim();
  if (!clean) return;

  try {
    const scope = await fetchLiveJournalScope(clean);
    if (scope?.homepageUrl && /^https?:\/\//i.test(scope.homepageUrl.trim())) {
      await openExternalLink(scope.homepageUrl.trim());
      return;
    }
  } catch {
    // Fallback
  }

  await openExternalLink(`https://www.google.com/search?q=${encodeURIComponent(clean + " journal official website")}`);
}
