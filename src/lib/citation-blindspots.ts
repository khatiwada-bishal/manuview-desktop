import { ReferenceVerification, CandidateBlindspotPaper, CitationBlindspotsReport } from "./types";
import { fetchRelatedWorksBatch, fetchWorksByIdsBatch, OpenAlexWork } from "./openalex";
import { normalizeTitle } from "./utils";

/**
 * Extracts unique, valid, and normalized DOIs from verified references.
 */
export function extractResolvedDois(references: ReferenceVerification[]): string[] {
  if (!Array.isArray(references)) return [];
  const dois = new Set<string>();

  for (const r of references) {
    const rawDoi = r.doi || (r as { resolvedDoi?: string }).resolvedDoi;
    if (typeof rawDoi === "string") {
      const clean = rawDoi.trim().replace(/^https?:\/\/doi\.org\//i, "").toLowerCase();
      if (clean.length > 5 && clean.includes("/")) {
        dois.add(clean);
      }
    }
  }

  return Array.from(dois);
}

/**
 * Computes paper prestige score based on co-citation strength, absolute citation volume, and recency.
 */
export function calculatePaperPrestige(
  candidate: { citationCount: number; coCitationScore: number; year?: number },
  seedDoisCount: number
): number {
  const coCiteWeight = Math.min(1.0, candidate.coCitationScore / Math.max(1, seedDoisCount * 0.4)) * 60;
  const citationLog = Math.min(1.0, Math.log10(Math.max(1, candidate.citationCount)) / 4) * 25;

  const currentYear = new Date().getFullYear();
  const pubYear = candidate.year || currentYear;
  const age = Math.max(0, currentYear - pubYear);
  const recencyBoost = age <= 3 ? 15 : age <= 7 ? 10 : 5;

  return Math.round((coCiteWeight + citationLog + recencyBoost) * 10) / 10;
}

/**
 * Classifies a candidate blindspot into an actionable academic category.
 */
export function classifyBlindspotCategory(
  paper: { year: number; citationCount: number; coCitationScore: number },
  manuscriptYear: number = new Date().getFullYear()
): 'seminal' | 'recent_landmark' | 'methodological_peer' {
  if (paper.citationCount >= 250 && paper.year <= manuscriptYear - 4) {
    return 'seminal';
  }
  if (paper.year >= manuscriptYear - 2 && (paper.citationCount >= 15 || paper.coCitationScore >= 2)) {
    return 'recent_landmark';
  }
  return 'methodological_peer';
}

/**
 * Discovers omitted high-centrality literature by analyzing 1-to-2-hop co-citation connections
 * from the manuscript's verified seed DOIs using OpenAlex.
 */
export async function fetchCoCitationNetwork(
  seedDois: string[],
  maxCandidates: number = 12,
  existingReferences: ReferenceVerification[] = []
): Promise<CandidateBlindspotPaper[]> {
  const cleanSeeds = Array.from(
    new Set(
      seedDois
        .map((d) => d.trim().replace(/^https?:\/\/doi\.org\//i, "").toLowerCase())
        .filter((d) => d.length > 5 && d.includes("/"))
    )
  );

  if (cleanSeeds.length === 0) return [];

  try {
    // 1. Fetch seed works to collect their graph relationships
    const seedWorks = await fetchRelatedWorksBatch(cleanSeeds.slice(0, 30));
    if (seedWorks.length === 0) return [];

    // 2. Count co-occurrences of candidate work IDs
    const candidateScoreMap = new Map<string, { count: number; seedSourceCount: number }>();
    const seedIdSet = new Set(seedWorks.map((w) => w.id.toLowerCase()));
    const seedDoiSet = new Set(cleanSeeds);

    for (const work of seedWorks) {
      const candidatesInWork = new Set<string>();

      // Check related works
      for (const relId of work.relatedWorks || []) {
        const normId = relId.trim();
        if (normId && !seedIdSet.has(normId.toLowerCase())) {
          candidatesInWork.add(normId);
        }
      }

      // Check referenced works
      for (const refId of work.referencedWorks || []) {
        const normId = refId.trim();
        if (normId && !seedIdSet.has(normId.toLowerCase())) {
          candidatesInWork.add(normId);
        }
      }

      for (const candId of candidatesInWork) {
        const existing = candidateScoreMap.get(candId) || { count: 0, seedSourceCount: 0 };
        existing.count += 1;
        existing.seedSourceCount += 1;
        candidateScoreMap.set(candId, existing);
      }
    }

    if (candidateScoreMap.size === 0) return [];

    // 3. Sort candidates by frequency and select top candidate IDs
    const sortedCandidateIds = Array.from(candidateScoreMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, Math.min(30, maxCandidates * 3))
      .map(([id]) => id);

    // 4. Batch fetch metadata for top candidates
    const candidateWorks = await fetchWorksByIdsBatch(sortedCandidateIds);
    if (candidateWorks.length === 0) return [];

    // 5. Existing manuscript references cache for duplicate elimination
    const citedNormalizedTitles = new Set(
      existingReferences
        .map((r) => r.title ? normalizeTitle(r.title) : "")
        .filter(Boolean)
    );

    const currentYear = new Date().getFullYear();
    const candidatePapers: CandidateBlindspotPaper[] = [];

    for (const work of candidateWorks) {
      const workDoi = work.doi ? work.doi.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase() : "";

      // Check if already cited
      const isDoiCited = workDoi ? seedDoiSet.has(workDoi) : false;
      const isTitleCited = work.title ? citedNormalizedTitles.has(normalizeTitle(work.title)) : false;
      const isAlreadyCited = isDoiCited || isTitleCited;

      // Skip if already in the bibliography
      if (isAlreadyCited) continue;

      const coCitationScore = candidateScoreMap.get(work.id)?.count || 1;
      const year = work.publicationYear || currentYear;
      const citationCount = work.citedByCount || 0;

      const category = classifyBlindspotCategory({ year, citationCount, coCitationScore }, currentYear);

      let relevanceReason = "";
      if (category === "seminal") {
        relevanceReason = `Foundational benchmark cited ${citationCount.toLocaleString()} times across related literature; frequently scrutinized by peer reviewers.`;
      } else if (category === "recent_landmark") {
        relevanceReason = `Recent high-impact study (${year}, ${citationCount.toLocaleString()} citations) co-cited by ${coCitationScore} of your references.`;
      } else {
        relevanceReason = `Co-cited by ${coCitationScore} references in your bibliography; shares primary methodology or domain context.`;
      }

      candidatePapers.push({
        doi: workDoi || work.id,
        title: work.title,
        authors: work.authors || ["Unknown Author"],
        year,
        journal: work.journal || "Academic Venue",
        citationCount,
        coCitationScore,
        category,
        relevanceReason,
        isAlreadyCited: false,
      });
    }

    // Sort by prestige and slice to maxCandidates
    candidatePapers.sort((a, b) => {
      const prestigeA = calculatePaperPrestige(a, cleanSeeds.length);
      const prestigeB = calculatePaperPrestige(b, cleanSeeds.length);
      return prestigeB - prestigeA;
    });

    return candidatePapers.slice(0, maxCandidates);
  } catch (err) {
    console.warn("Co-citation network lookup paused:", err);
    return [];
  }
}

/**
 * Builds a complete CitationBlindspotsReport from references and seed DOIs.
 */
export async function generateCitationBlindspotsReport(
  references: ReferenceVerification[],
  maxCandidates: number = 10
): Promise<CitationBlindspotsReport> {
  const seedDois = extractResolvedDois(references);
  if (seedDois.length === 0) {
    return {
      analyzedSeedCount: 0,
      candidatesFound: [],
      detectedGapsCount: 0,
    };
  }

  const candidatesFound = await fetchCoCitationNetwork(seedDois, maxCandidates, references);

  return {
    analyzedSeedCount: seedDois.length,
    candidatesFound,
    detectedGapsCount: candidatesFound.length,
  };
}
