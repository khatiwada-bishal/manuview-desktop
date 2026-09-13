import { validateDimensions } from "../schemas";
import {
  CitationIntegritySummary,
  DimensionScore,
  ParsedManuscript,
  ScoreDimension,
  VALID_SCORE_DIMENSIONS,
} from "../types";
import { MAX_ASSERTION_SNIPPET_LENGTH } from "./types";

export { VALID_SCORE_DIMENSIONS, validateDimensions };

export interface DeterministicDimensionParams {
  manuscript: ParsedManuscript;
  discipline: string;
  targetJournal: string;
  targetDiscipline?: string;
  isScopeMismatch: boolean;
  citationIntegrity: CitationIntegritySummary;
}

/**
 * Calculates deterministic academic scoring dimensions for heuristic/offline mode
 * or fallback execution when live AI output is unavailable.
 */
export function calculateDeterministicDimensions(
  params: DeterministicDimensionParams
): Record<ScoreDimension, DimensionScore> {
  const {
    manuscript,
    discipline,
    targetJournal,
    targetDiscipline,
    isScopeMismatch,
    citationIntegrity,
  } = params;

  const cleanTitle = manuscript.title.trim();
  const abstractCore = manuscript.abstract ? manuscript.abstract.trim() : "";
  const sampleSizes = manuscript.empiricalCues?.sampleSizes || [];
  const statMetrics = manuscript.empiricalCues?.statisticalMetrics || [];
  const equations = manuscript.empiricalCues?.equations || [];
  const dataRepos = manuscript.empiricalCues?.dataRepositories || [];
  const causalAssertions = manuscript.empiricalCues?.causalAssertions || [];

  const sampleCount = sampleSizes.length;
  const statCount = statMetrics.length;
  const eqCount = equations.length;
  const repoCount = dataRepos.length;
  const causalCount = causalAssertions.length;
  const sections = manuscript.sections || {};

  const isMethodsMissing =
    Boolean(manuscript.sectionProvenance?.methodsMissing) ||
    !sections.methods ||
    sections.methods.length < 50;
  const isMethodsInferred = Boolean(manuscript.sectionProvenance?.methodsInferred);

  const origScore = abstractCore.length > 40 && cleanTitle.length > 25 ? 4 : 3;
  const broadScore = manuscript.wordCount >= 2800 ? 4 : 3;

  const methScore = isMethodsMissing
    ? 1
    : isMethodsInferred
    ? sampleCount > 0 || eqCount > 0
      ? 3
      : 2
    : sections.methods && (sampleCount > 0 || eqCount > 0)
    ? 4
    : 3;

  const claimsScore = causalCount > 2 ? 3 : 4;
  const clarityScore = manuscript.wordCount > 1500 ? 4 : 3;
  const priorScore =
    citationIntegrity.retractedCount > 0
      ? 2
      : citationIntegrity.unresolvableCount > 2
      ? 3
      : citationIntegrity.totalReferences > 0 && citationIntegrity.verifiedCount === 0
      ? 3
      : citationIntegrity.totalReferences > 0 &&
        citationIntegrity.uncheckedCount > citationIntegrity.verifiedCount
      ? 4
      : 5;

  return {
    originality: {
      score: origScore,
      label: "Originality & Novelty",
      verdict: `Conceptual contribution positioned within ${discipline}.`,
      strengths: [
        `Explicit articulation of research inquiry for "${cleanTitle.slice(0, 65)}..."`,
        `Thematic alignment with contemporary investigations in ${discipline}`,
      ],
      vulnerabilities: [
        `Delineating the precise conceptual advance beyond recent 2023–2025 benchmark publications in ${discipline}`,
      ],
      source: "heuristic",
    },
    broad_interest: {
      score: isScopeMismatch ? 1 : broadScore,
      label: "Importance & Broad Interest",
      verdict: isScopeMismatch
        ? `Severe scope mismatch: Article domain (${discipline}) does not match ${targetJournal}'s focus in ${targetDiscipline || "target domain"}.`
        : `Engages scholarly and practitioner readership of ${targetJournal}.`,
      strengths: isScopeMismatch
        ? [`Addresses research questions within ${discipline}`]
        : [
            `Addresses timely questions with relevance to ${targetJournal} readership`,
            `Potential implications for academic and applied practices in ${discipline}`,
          ],
      vulnerabilities: isScopeMismatch
        ? [
            `Critical editorial hazard: Readers and editors of ${targetJournal} expect papers in ${targetDiscipline || "target domain"}, making immediate desk reject likely.`,
          ]
        : [
            `Clarifying broader cross-disciplinary implications for readers outside the immediate specialty`,
          ],
      source: "heuristic",
    },
    claims_vs_evidence: {
      score: claimsScore,
      label: "Strength of Claims vs. Evidence",
      verdict:
        "Empirical findings are systematically presented, but causal language requires careful boundary framing.",
      strengths: [
        sections.results
          ? "Structured presentation of findings in dedicated Results section"
          : "Empirical findings detailed in text",
      ],
      vulnerabilities: [
        causalCount > 0 && causalAssertions[0]
          ? `Causal statement requires hedging: "${causalAssertions[0].slice(0, MAX_ASSERTION_SNIPPET_LENGTH)}..."`
          : "Ensure observed empirical associations are strictly framed within observational limits",
      ],
      source: "heuristic",
    },
    methodology: {
      score: methScore,
      label: "Methodological & Statistical Soundness",
      verdict: isMethodsMissing
        ? "CRITICAL: Formal Methods / Experimental section not detected in manuscript."
        : isMethodsInferred
        ? `Methodological narrative inferred from manuscript body (${eqCount} equation(s), ${sampleCount} sample indicator(s)); explicit 'Methods' heading was absent.`
        : `Methodological architecture incorporates ${eqCount} mathematical formulation(s) and ${sampleCount} sample indicator(s).`,
      strengths: isMethodsMissing
        ? []
        : [
            !isMethodsInferred && sections.methods
              ? "Formal procedural description in dedicated Methods section"
              : "Documented procedural workflow",
            repoCount > 0
              ? `Data availability supported by repository reference (${dataRepos[0]})`
              : "Step-by-step procedural progression from data to findings",
          ],
      vulnerabilities: isMethodsMissing
        ? [
            "Manuscript lacks an explicit Materials & Methods section. Peer reviewers cannot evaluate protocol validity, statistical power, or reproducibility.",
          ]
        : [
            isMethodsInferred
              ? "Insert an explicit 'Materials and Methods' section heading so editors and referees can immediately locate experimental specifications"
              : "Reporting formal sample power calculations (1 - beta >= 0.80) in Methods",
            "Documenting full replication archive in a persistent public repository (Zenodo, GitHub, OSF)",
          ],
      source: "heuristic",
    },
    clarity: {
      score: clarityScore,
      label: "Clarity & Presentation",
      verdict: `Scholarly writing adhering to academic conventions (${manuscript.wordCount.toLocaleString()} words).`,
      strengths: [
        "Structured presentation across manuscript sections",
        "Coherent academic narrative progression from problem formulation to findings",
      ],
      vulnerabilities: [
        "Define all specialized acronyms and domain notation on first occurrence in both Abstract and Main Text",
      ],
      source: "heuristic",
    },
    prior_work: {
      score: priorScore,
      label: "Prior Work & Reference Integrity",
      verdict:
        citationIntegrity.sampledCount < citationIntegrity.totalReferences
          ? `${citationIntegrity.verifiedCount} of the first ${citationIntegrity.sampledCount} references verified (${citationIntegrity.totalReferences} total; ${citationIntegrity.sampledCount - citationIntegrity.verifiedCount} could not be checked via Crossref registry).`
          : `${citationIntegrity.verifiedCount} of ${citationIntegrity.totalReferences} references verified via Crossref registry.`,
      strengths: [
        citationIntegrity.sampledCount < citationIntegrity.totalReferences
          ? `${citationIntegrity.verifiedCount} references cross-referenced against authoritative Crossref database (sample of ${citationIntegrity.sampledCount} screened)`
          : `${citationIntegrity.verifiedCount} references cross-referenced against authoritative Crossref database`,
      ],
      vulnerabilities: [
        citationIntegrity.retractedCount > 0
          ? `Contains ${citationIntegrity.retractedCount} retracted reference(s) that must be replaced immediately`
          : citationIntegrity.unresolvableCount > 2
          ? `${citationIntegrity.unresolvableCount} references could not be verified via DOI or bibliographic search`
          : "Audit bibliography to ensure balanced representation of contemporary peer literature",
      ],
      source: "heuristic",
    },
  };
}
