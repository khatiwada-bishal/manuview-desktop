import { PublishedArticleDetails } from "./types";
import { normalizeTitle, titleSimilarity } from "./utils";

const POLITE_USER_AGENT =
  "ManuView-OpenPreSubmission/1.0 (mailto:research@manuview.org; https://github.com/khatiwada-bishal/manuview)";

/**
 * Detects whether text or a DOI corresponds to a recognized preprint repository
 * (e.g. arXiv, bioRxiv, medRxiv, ChemRxiv, Research Square, SSRN, Preprints.org).
 * Preprints are pre-submission works and are explicitly eligible for peer-review simulation.
 */
export function extractPreprintMarkers(rawText: string, doi?: string): {
  isPreprint: boolean;
  serverName?: string;
  preprintId?: string;
} {
  const headerSlice = rawText.slice(0, 3500);

  // 1. Check DOI prefix
  if (doi) {
    if (/10\.48550\/arXiv/i.test(doi)) {
      return { isPreprint: true, serverName: "arXiv", preprintId: doi };
    }
    if (/10\.1101\//i.test(doi)) {
      const server = /medrxiv/i.test(headerSlice + doi) ? "medRxiv" : "bioRxiv";
      return { isPreprint: true, serverName: server, preprintId: doi };
    }
    if (/10\.26434\/chemrxiv/i.test(doi)) {
      return { isPreprint: true, serverName: "ChemRxiv", preprintId: doi };
    }
    if (/10\.21203\/rs\./i.test(doi)) {
      return { isPreprint: true, serverName: "Research Square", preprintId: doi };
    }
    if (/10\.2139\/ssrn/i.test(doi)) {
      return { isPreprint: true, serverName: "SSRN", preprintId: doi };
    }
    if (/10\.20944\/preprints/i.test(doi)) {
      return { isPreprint: true, serverName: "Preprints.org", preprintId: doi };
    }
    if (/10\.31219\/osf/i.test(doi)) {
      return { isPreprint: true, serverName: "OSF Preprints", preprintId: doi };
    }
  }

  // 2. Check header text markers
  const arxivMatch = headerSlice.match(/arXiv:\s*(\d{4}\.\d{4,5}(?:v\d+)?)/i);
  if (arxivMatch) {
    return { isPreprint: true, serverName: "arXiv", preprintId: arxivMatch[1] };
  }

  if (/\b(?:bioRxiv|medRxiv)\s+preprint\b/i.test(headerSlice) || /https?:\/\/(?:www\.)?(?:biorxiv|medrxiv)\.org/i.test(headerSlice)) {
    const isMed = /medrxiv/i.test(headerSlice);
    return { isPreprint: true, serverName: isMed ? "medRxiv" : "bioRxiv" };
  }

  if (/\bChemRxiv\s+preprint\b/i.test(headerSlice) || /https?:\/\/chemrxiv\.org/i.test(headerSlice)) {
    return { isPreprint: true, serverName: "ChemRxiv" };
  }

  if (/\bResearch\s*Square\b/i.test(headerSlice) && /preprint/i.test(headerSlice)) {
    return { isPreprint: true, serverName: "Research Square" };
  }

  if (/\bSSRN\b/i.test(headerSlice) && /preprint/i.test(headerSlice)) {
    return { isPreprint: true, serverName: "SSRN" };
  }

  if (/\bpreprints\.org\b/i.test(headerSlice) || /\bpreprints\s+\d{4},\s+\d+/i.test(headerSlice)) {
    return { isPreprint: true, serverName: "Preprints.org" };
  }

  if (/this\s+(?:article|paper|manuscript)\s+is\s+a\s+preprint/i.test(headerSlice) ||
      /not\s+(?:been\s+)?certified\s+by\s+peer\s+review/i.test(headerSlice) ||
      /preprint\s+under\s+review/i.test(headerSlice)) {
    return { isPreprint: true, serverName: "Preprint Repository" };
  }

  return { isPreprint: false };
}

/**
 * Scans text header for publication indicators and article DOI
 */
export function extractPublicationMarkers(rawText: string): {
  doi?: string;
  journalName?: string;
  publisher?: string;
  publicationDate?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  hasPublishedMarkers: boolean;
  markerCount: number;
  isPreprint: boolean;
  preprintServer?: string;
} {
  // Inspect the first 3,500 characters (page 1 / header) to avoid reference list citations
  const headerSlice = rawText.slice(0, 3500);

  // 1. Article DOI in header
  let doi: string | undefined = undefined;
  const doiMatch = headerSlice.match(
    /(?:https?:\/\/doi\.org\/|doi:\s*|doi\.org\/)(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i
  );
  if (doiMatch && doiMatch[1]) {
    doi = doiMatch[1].trim().replace(/[.,;)]+$/, "");
  }

  // Check preprint classification first
  const preprintInfo = extractPreprintMarkers(rawText, doi);

  // 2. Publication lifecycle dates
  let publicationDate: string | undefined = undefined;
  const publishedDateMatch = headerSlice.match(
    /(?:published\s+(?:online\s+)?[:\s]+|available\s+online\s+[:\s]+)(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2}|[A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]+,?\s+\d{4})/i
  );
  if (publishedDateMatch && publishedDateMatch[1]) {
    publicationDate = publishedDateMatch[1].trim();
  }

  const acceptedMatch = /(?:accepted(?:\s+date)?\s*[:\s]+(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2}|[A-Za-z]+\s+\d{1,2},?\s+\d{4}))/i.test(
    headerSlice
  );

  // 3. Volume / Issue / Pages / Article Number
  let volume: string | undefined = undefined;
  let issue: string | undefined = undefined;
  let pages: string | undefined = undefined;

  const volMatch = headerSlice.match(/(?:Volume\s+(\d+)|Vol\.\s*(\d+))/i);
  if (volMatch) volume = volMatch[1] || volMatch[2];

  const issMatch = headerSlice.match(/(?:Issue\s+(\d+)|No\.\s*(\d+))/i);
  if (issMatch) issue = issMatch[1] || issMatch[2];

  const pageMatch = headerSlice.match(
    /(?:pp\.?|pages|article)\s+([A-Za-z0-9]+[\u2013-][A-Za-z0-9]+|\d{5,8})/i
  );
  if (pageMatch) pages = pageMatch[1];

  // 4. Publisher copyright / publication notices
  let publisher: string | undefined = undefined;
  const publisherMatch = headerSlice.match(
    /(?:Elsevier|Springer\s*Nature|Wiley|IEEE|Nature\s+Publishing\s+Group|Taylor\s*&\s*Francis|Sage|MDPI|Frontiers|Oxford\s+University\s+Press|Cambridge\s+University\s+Press|PLOS|BioMed\s+Central)/i
  );
  if (publisherMatch) publisher = publisherMatch[0];

  const copyrightMatch = /(?:©\s*\d{4}\s+[A-Za-z\s]+|All rights reserved|This is an open access article under the CC BY|Published by [A-Za-z\s]+)/i.test(
    headerSlice
  );

  // 5. Journal name in header banner
  let journalName: string | undefined = undefined;
  const journalHeaderMatch = headerSlice.match(
    /(?:Journal\s+of\s+[A-Za-z\s]{4,40}|International\s+Journal\s+of\s+[A-Za-z\s]{4,40}|Nature\s+[A-Za-z\s]{4,30}|IEEE\s+Transactions\s+on\s+[A-Za-z\s]{4,35})/i
  );
  if (journalHeaderMatch) {
    journalName = journalHeaderMatch[0]
      .trim()
      .replace(/\s+(vol|volume|issue|no)\b.*$/i, "");
  }

  let markerCount = 0;
  if (doi && !preprintInfo.isPreprint) markerCount += 3;
  if (publicationDate) markerCount += 3;
  if (acceptedMatch) markerCount += 2;
  if (volume || issue || pages) markerCount += 2;
  if (publisher || copyrightMatch) markerCount += 2;
  if (journalName) markerCount += 1;

  // If the document is an un-refereed preprint, it must NOT be marked as already published
  const hasPublishedMarkers =
    !preprintInfo.isPreprint &&
    (((!!doi && (!!publicationDate || acceptedMatch || !!volume || !!publisher || copyrightMatch)) ||
      (!!publicationDate && (acceptedMatch || !!volume || copyrightMatch)) ||
      markerCount >= 5));

  return {
    doi,
    journalName,
    publisher,
    publicationDate,
    volume,
    issue,
    pages,
    hasPublishedMarkers,
    markerCount,
    isPreprint: preprintInfo.isPreprint,
    preprintServer: preprintInfo.serverName,
  };
}

/**
 * Detects whether a manuscript has already been published.
 * Uses local header metadata extraction with Crossref registry verification.
 */
export async function detectPublishedArticle(
  rawText: string,
  title?: string
): Promise<PublishedArticleDetails | null> {
  const localMarkers = extractPublicationMarkers(rawText);

  // If the document is identified as a preprint, it is explicitly an unpublished pre-submission manuscript
  if (localMarkers.isPreprint) {
    return {
      isPublished: false,
      isPreprint: true,
      preprintServer: localMarkers.preprintServer || "Preprint Repository",
      doi: localMarkers.doi,
      detectedVia: `${localMarkers.preprintServer || "Preprint Repository"} Pre-Submission Draft`,
    };
  }

  // Case A: Article DOI was directly found in the header
  if (localMarkers.doi) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `https://api.crossref.org/works/${encodeURIComponent(localMarkers.doi)}`,
        {
          headers: {
            "User-Agent": POLITE_USER_AGENT,
            Accept: "application/json",
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const msg = json.message || {};

        // Crossref records preprints under type: "posted-content" or subtype: "preprint"
        const isPreprintType =
          msg.type === "posted-content" ||
          msg.subtype === "preprint" ||
          /biorxiv|medrxiv|arxiv|chemrxiv|research\s*square|preprints\.org|ssrn/i.test(
            (msg.publisher || "") + " " + (msg["container-title"]?.[0] || "") + " " + (msg.institution?.[0]?.name || "")
          );

        if (isPreprintType) {
          return {
            isPublished: false,
            isPreprint: true,
            preprintServer: msg.publisher || localMarkers.preprintServer || "Preprint Repository",
            doi: localMarkers.doi,
            articleUrl: `https://doi.org/${localMarkers.doi}`,
            detectedVia: "Scholarly Preprint Registry (Eligible for Review)",
          };
        }

        const crJournal = Array.isArray(msg["container-title"])
          ? msg["container-title"][0]
          : undefined;
        const crYear =
          msg.issued?.["date-parts"]?.[0]?.[0] ||
          msg.created?.["date-parts"]?.[0]?.[0];
        const crMonth = msg.issued?.["date-parts"]?.[0]?.[1];
        const crDate = crYear
          ? crMonth
            ? `${crYear}-${String(crMonth).padStart(2, "0")}`
            : `${crYear}`
          : localMarkers.publicationDate;

        return {
          isPublished: true,
          doi: localMarkers.doi,
          journalName: crJournal || localMarkers.journalName || "Academic Journal",
          publisher: msg.publisher || localMarkers.publisher || "Academic Publisher",
          publicationDate: crDate,
          volume: msg.volume || localMarkers.volume,
          issue: msg.issue || localMarkers.issue,
          pages: msg.page || localMarkers.pages,
          citationCount:
            typeof msg["is-referenced-by-count"] === "number"
              ? msg["is-referenced-by-count"]
              : undefined,
          articleUrl: `https://doi.org/${localMarkers.doi}`,
          detectedVia: "Crossref Official Article Registry",
        };
      }
    } catch {
      // Network request failed - fall back to strong local header evidence (only if NOT a preprint)
      if (!localMarkers.isPreprint && localMarkers.hasPublishedMarkers) {
        return {
          isPublished: true,
          doi: localMarkers.doi,
          journalName: localMarkers.journalName || "Academic Journal",
          publisher: localMarkers.publisher,
          publicationDate: localMarkers.publicationDate,
          volume: localMarkers.volume,
          issue: localMarkers.issue,
          pages: localMarkers.pages,
          articleUrl: `https://doi.org/${localMarkers.doi}`,
          detectedVia: "Publisher Header Metadata & Article DOI",
        };
      }
    }
  }

  // Case B: Query Crossref by Manuscript Title (if title is sufficiently distinct)
  const cleanTitle = (title || "").trim();
  if (cleanTitle.length > 25 && !/^untitled/i.test(cleanTitle)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `https://api.crossref.org/works?query.title=${encodeURIComponent(
          cleanTitle
        )}&rows=1`,
        {
          headers: {
            "User-Agent": POLITE_USER_AGENT,
            Accept: "application/json",
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const topItem = json.message?.items?.[0];
        if (topItem) {
          const topTitle = Array.isArray(topItem.title)
            ? topItem.title[0]
            : topItem.title;
          const sim = titleSimilarity(cleanTitle, topTitle || "");
          const isJournalArticle =
            topItem.type === "journal-article" ||
            topItem.type === "proceedings-article";
          const crJournal = Array.isArray(topItem["container-title"])
            ? topItem["container-title"][0]
            : undefined;

          // If title similarity is high (>0.75) and confirmed journal article in Crossref
          if (sim >= 0.75 && isJournalArticle && crJournal) {
            const crYear = topItem.issued?.["date-parts"]?.[0]?.[0];
            const crMonth = topItem.issued?.["date-parts"]?.[0]?.[1];
            const crDate = crYear
              ? crMonth
                ? `${crYear}-${String(crMonth).padStart(2, "0")}`
                : `${crYear}`
              : undefined;

            return {
              isPublished: true,
              doi: topItem.DOI,
              journalName: crJournal,
              publisher: topItem.publisher,
              publicationDate: crDate,
              volume: topItem.volume,
              issue: topItem.issue,
              pages: topItem.page,
              citationCount: topItem["is-referenced-by-count"],
              articleUrl: topItem.DOI
                ? `https://doi.org/${topItem.DOI}`
                : undefined,
              detectedVia: `Crossref Title Match (${Math.round(sim * 100)}% match)`,
            };
          }
        }
      }
    } catch {
      // Network lookup failed
    }
  }

  // Case C: Strong local markers alone indicate already published
  if (
    localMarkers.hasPublishedMarkers &&
    (localMarkers.publicationDate || localMarkers.volume)
  ) {
    return {
      isPublished: true,
      doi: localMarkers.doi,
      journalName: localMarkers.journalName || "Academic Journal",
      publisher: localMarkers.publisher,
      publicationDate: localMarkers.publicationDate,
      volume: localMarkers.volume,
      issue: localMarkers.issue,
      pages: localMarkers.pages,
      articleUrl: localMarkers.doi
        ? `https://doi.org/${localMarkers.doi}`
        : undefined,
      detectedVia: "Publisher Header Metadata & Publication Lifecycle Dates",
    };
  }

  return null;
}
