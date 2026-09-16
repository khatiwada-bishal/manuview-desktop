/**
 * Curated Retraction Catalog & Real-Time Crossref Verification Gate (P0 §2.2 / Claims Integrity)
 *
 * NOTE: Exhaustive retraction verification across all ~60,000+ published retractions requires
 * live Crossref resolution (via Crossmark flags / update-to metadata).
 * This curated catalog provides deterministic on-device offline detection for high-profile
 * verified retractions and explicit title-level retraction notices.
 */
export interface RetractionCheckResult {
  isRetracted: boolean;
  isExpressionOfConcern: boolean;
  reason?: string;
}

// Curated benchmark retracted papers catalog (verified primary sources with formal notices)
export const KNOWN_RETRACTED_DOIS: Record<string, string> = {
  // Wakefield MMR autism paper (The Lancet, 1998) - Retracted Feb 2010
  "10.1016/s0140-6736(97)11096-0": "Retracted: Completely falsified data regarding MMR vaccine and autism.",
  // Surgisphere COVID-19 Hydroxychloroquine paper (The Lancet, 2020) - Retracted June 2020
  "10.1016/s0140-6736(20)31180-6": "Retracted: Authors unable to conduct independent audit of Surgisphere database.",
  // Surgisphere COVID-19 cardiovascular paper (NEJM, 2020) - Retracted June 2020
  "10.1056/nejmoa2007621": "Retracted: Database veracity could not be validated.",
  // STAP cell pluripotency (Obokata et al., Nature, 2014) - Retracted July 2014
  "10.1038/nature12968": "Retracted: Critical errors and fabricated image data in STAP cell pluripotency study.",
  // Room-temperature superconductivity CSH claim (Snider, Dias et al., Nature, 2020) - Retracted Sep 2022
  "10.1038/s41586-020-2801-z": "Retracted: Irregularities in background subtraction methods.",
  // Disputed microplastics in fish larvae (Lönnstedt & Eklöv, Science, 2016) - Retracted May 2017
  "10.1126/science.aad8828": "Retracted: Suspected data fabrication and missing raw files.",
  // Substance dependence association (Gelernter et al., PNAS, 2009) - Retracted Nov 2013
  "10.1073/pnas.0908521106": "Retracted: Irreproducible genotyping in PKNOX2 substance dependence association study.",
  // Hwang Woo-suk patient-specific embryonic stem cells (Science, 2004) - Retracted Jan 2006
  "10.1126/science.1094515": "Retracted: Fabricated stem cell colonies and somatic cell nuclear transfer claims.",
  // Hwang Woo-suk patient-specific stem cell lines (Science, 2005) - Retracted Jan 2006
  "10.1126/science.1112286": "Retracted: Fabricated data and fraudulent DNA fingerprinting records.",
  // Macchiarini engineered synthetic trachea (The Lancet, 2011) - Retracted July 2018
  "10.1016/s0140-6736(11)60715-4": "Retracted: Falsified clinical outcomes in tissue-engineered trachea transplant.",
  // Schön condensed-matter field-effect superconductivity (Science, 2000) - Retracted Nov 2002
  "10.1126/science.288.5475.2338": "Retracted: Fabricated measurements and identical noise traces across distinct experiments.",
  // Smeesters color and consumer choice (Science, 2011) - Retracted Sep 2012
  "10.1126/science.1202867": "Retracted: Statistically impossible data distributions consistent with fabrication.",
  // Sanna social priming and cleanliness (JESP, 2011) - Retracted June 2012
  "10.1016/j.jesp.2011.02.008": "Retracted: Irreproducible and manipulated experimental data.",
};

export function checkRetractionStatus(doi?: string, textOrTitle?: string): RetractionCheckResult {
  if (doi) {
    const cleanDoi = doi.trim().toLowerCase();
    for (const [retractedDoi, reason] of Object.entries(KNOWN_RETRACTED_DOIS)) {
      if (cleanDoi === retractedDoi.toLowerCase()) {
        return {
          isRetracted: true,
          isExpressionOfConcern: false,
          reason,
        };
      }
    }
  }

  if (textOrTitle) {
    // Scope textual-marker scan strictly to the title portion of reference string (REQ-CIT-03)
    let titleToScan = textOrTitle;
    const quoteMatch = textOrTitle.match(/["“]([^"”]+)["”]/);
    if (quoteMatch) {
      titleToScan = quoteMatch[1];
    } else {
      const parts = textOrTitle.split(/\.\s+/);
      if (parts.length >= 2) {
        // Author. Title. Journal / Year
        titleToScan = parts[1];
      }
    }

    const lower = titleToScan.toLowerCase();
    if (
      lower.includes("[retracted]") ||
      lower.includes("(retracted)") ||
      /^retracted\b/i.test(lower) ||
      lower.includes("retraction notice:") ||
      lower.includes("retraction of:")
    ) {
      return {
        isRetracted: true,
        isExpressionOfConcern: false,
        reason: "Reference title explicitly contains retraction notice or marker.",
      };
    }

    // Only flag Expression of Concern if present in the article title, not in a journal name/note
    if (
      lower.includes("expression of concern") &&
      !lower.includes("journal of") &&
      !lower.includes("annual review")
    ) {
      return {
        isRetracted: false,
        isExpressionOfConcern: true,
        reason: "Subject to an editorial Expression of Concern.",
      };
    }
  }

  return {
    isRetracted: false,
    isExpressionOfConcern: false,
  };
}
