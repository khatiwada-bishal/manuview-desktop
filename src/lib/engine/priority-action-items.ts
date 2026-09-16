import { validatePriorityIssues } from "../schemas";
import { CitationIntegritySummary, ParsedManuscript, PriorityIssue } from "../types";
import { MAX_ASSERTION_SNIPPET_LENGTH } from "./types";

export { validatePriorityIssues };

const STOPWORDS = new Set([
  "the", "and", "a", "to", "of", "in", "is", "that", "for", "with",
  "as", "by", "on", "at", "from", "this", "was", "were", "it", "be",
  "are", "an", "or", "which", "we", "our", "not", "but", "can", "have",
  "has", "had", "been", "their", "they", "all", "any", "such", "into"
]);

/**
 * Grounds an LLM-generated evidence anchor against the genuine manuscript text.
 * Prevents LLMs from hallucinating verbatim quotes that the authors never wrote.
 * If a quote cannot be verified in the document or structured sections,
 * it is safely transformed into a grounded contextual thematic anchor.
 */
export function groundEvidenceAnchor(
  anchor: string,
  rawText: string,
  sections?: Record<string, string> | null
): string {
  if (!anchor || typeof anchor !== "string") {
    return "text: §General";
  }

  const trimmed = anchor.trim();
  if (!trimmed) return "text: §General";

  // Non-verbatim structural anchors (absence, references, equation, table, figure, context)
  if (
    trimmed.startsWith("absence:") ||
    trimmed.startsWith("references:") ||
    trimmed.startsWith("equation:") ||
    trimmed.startsWith("table:") ||
    trimmed.startsWith("figure:") ||
    trimmed.startsWith("context:")
  ) {
    return trimmed;
  }

  // Extract explicit section identifier if present, e.g., §Methods, §Introduction, §Results
  const sectionMatch = trimmed.match(/§([A-Za-z0-9_\-]+)/);
  const explicitSection = sectionMatch ? `§${sectionMatch[1]}` : "§General";

  // Extract quoted text within double quotes, smart quotes, or single quotes
  let quoteCandidate: string | null = null;
  const quoteMatch = trimmed.match(/["“]([^"”]+)["”]/);
  if (quoteMatch && quoteMatch[1].trim().length > 0) {
    quoteCandidate = quoteMatch[1].trim();
  } else {
    // If no quotes, check if prefixed with text:
    const textPrefixMatch = trimmed.match(/^text:\s*(?:§[A-Za-z0-9_\-]+\s*)?(.*)/i);
    if (textPrefixMatch && textPrefixMatch[1].trim().length > 0) {
      quoteCandidate = textPrefixMatch[1].trim();
    }
  }

  if (!quoteCandidate) {
    return trimmed;
  }

  // Normalize document content for resilient matching
  const docCorpus = [
    rawText || "",
    ...Object.values(sections || {})
  ].join(" ").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ");

  const normQuote = quoteCandidate
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normQuote.length < 4) {
    return `context: ${explicitSection} (brief reference: "${quoteCandidate}")`;
  }

  // 1. Direct normalized substring match
  if (docCorpus.includes(normQuote)) {
    return `text: ${explicitSection} "${quoteCandidate}"`;
  }

  // 2. Contiguous 4-word window n-gram match (resilient to minor paraphrasing or punctuation)
  const words = normQuote.split(" ").filter((w) => w.length > 0);
  let hasContiguousMatch = false;

  if (words.length >= 4) {
    for (let i = 0; i <= words.length - 4; i++) {
      const windowStr = words.slice(i, i + 4).join(" ");
      if (docCorpus.includes(windowStr)) {
        hasContiguousMatch = true;
        break;
      }
    }
  }

  if (hasContiguousMatch) {
    return `text: ${explicitSection} "${quoteCandidate}"`;
  }

  // 3. Hallucinated Quote: Convert from false verbatim claim to thematic context anchor
  const informativeTokens = words
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 5);

  if (informativeTokens.length > 0) {
    return `context: ${explicitSection} (thematic focus: ${informativeTokens.join(", ")})`;
  }

  return `context: ${explicitSection} (unverified reference)`;
}

export interface DeterministicPriorityIssuesParams {
  manuscript: ParsedManuscript;
  discipline: string;
  targetJournal: string;
  citationIntegrity: CitationIntegritySummary;
}

/**
 * Calculates deterministic priority action items for baseline or fallback execution.
 */
export function calculateDeterministicPriorityIssues(
  params: DeterministicPriorityIssuesParams
): PriorityIssue[] {
  const { manuscript, discipline, targetJournal, citationIntegrity } = params;
  const cleanTitle = manuscript.title.trim();
  const sampleSizes = manuscript.empiricalCues?.sampleSizes || [];
  const causalAssertions = manuscript.empiricalCues?.causalAssertions || [];
  const dataRepos = manuscript.empiricalCues?.dataRepositories || [];

  const sampleCount = sampleSizes.length;
  const causalCount = causalAssertions.length;
  const repoCount = dataRepos.length;

  const sections = manuscript.sections || {};
  const isMethodsMissing =
    Boolean(manuscript.sectionProvenance?.methodsMissing) ||
    !sections.methods ||
    sections.methods.length < 50;
  const isMethodsInferred = Boolean(manuscript.sectionProvenance?.methodsInferred);

  const priorityIssues: PriorityIssue[] = [];

  if (isMethodsMissing) {
    priorityIssues.push({
      id: "iss-missing-methods",
      priority: "A",
      title: "Missing Formal Materials and Methods Section",
      category: "Methodology",
      description:
        "The manuscript does not contain an explicit Materials and Methods section. In peer-reviewed scientific publishing, experimental and empirical papers lacking a dedicated methods section trigger immediate editorial rejection because reviewers cannot evaluate procedural validity, sample selection, or experimental controls.",
      location: "Manuscript Structure",
      evidenceAnchor: "absence: §Methods heading not detected in manuscript",
      reviewerQuote:
        "'The manuscript does not include an identifiable Methods section. We cannot assess the validity, statistical power, or reproducibility of these findings.'",
      actionableFix:
        "Insert an explicit 'Materials and Methods' or 'Methodology' section detailing study design, sample recruitment, instrumentation, and statistical models.",
      rebuttalStrategy:
        "1. Insert an explicit Materials & Methods section with formal protocol specifications.\n2. Detail data collection and experimental controls in full.\n3. Add statistical analysis paragraph specifying all test assumptions.",
      source: "heuristic",
    });
  }

  if (citationIntegrity.retractedCount > 0) {
    priorityIssues.push({
      id: "iss-retract",
      priority: "A",
      title: `Retracted Reference Flagged in Bibliography (${citationIntegrity.retractedCount} detected)`,
      category: "Citations",
      description:
        "Citing retracted peer-reviewed literature is a critical editorial hazard that frequently triggers desk rejection or ethical inquiry.",
      location: "References",
      evidenceAnchor: "references: Retracted DOI detected in bibliography",
      reviewerQuote:
        "'The manuscript cites a retracted publication. The authors must replace or remove this reference immediately.'",
      actionableFix:
        "Audit the bibliography and replace the retracted reference with verified contemporary peer-reviewed citations.",
      rebuttalStrategy:
        "1. Concede and remove: Confirm immediate removal of the retracted citation.\n2. Verify that core analytical conclusions remain unaffected by replacing with alternative peer-reviewed sources.\n3. Add clarifying note in response letter confirming bibliographic audit.",
      source: "heuristic",
    });
  }

  if (citationIntegrity.unresolvableCount >= 2) {
    priorityIssues.push({
      id: "iss-hallucinate",
      priority: "A",
      title: `Unresolvable DOI References Detected (${citationIntegrity.unresolvableCount} found)`,
      category: "Citations",
      description:
        "Multiple DOIs in the bibliography failed resolution against the Crossref registry. Editors frequently flag this pattern as potential AI-hallucinated citations.",
      location: "References",
      evidenceAnchor: "references: DOIs returning 404 in Crossref",
      reviewerQuote:
        "'Several cited DOIs cannot be resolved in international registries. Are these genuine peer-reviewed citations?'",
      actionableFix:
        "Verify each cited work's official DOI directly on the publisher's journal website.",
      rebuttalStrategy:
        "1. Check DOIs against publisher landing pages and supply corrected DOI strings.\n2. Provide direct journal URLs for any non-DOI grey literature citations.",
      source: "heuristic",
    });
  } else if (citationIntegrity.unresolvableCount === 1) {
    priorityIssues.push({
      id: "iss-unverified-doi",
      priority: "B",
      title: "Unverified Reference DOI (1 reference)",
      category: "Citations",
      description:
        "One DOI in the bibliography failed resolution against the Crossref registry. This may indicate a typographical error in the DOI string.",
      location: "References",
      evidenceAnchor: "references: 1 unverified DOI in Crossref",
      reviewerQuote:
        "'One of the cited DOIs did not resolve in Crossref. Please verify the DOI string.'",
      actionableFix:
        "Verify the cited paper's official DOI directly on the publisher's journal website.",
      rebuttalStrategy:
        "1. Check the DOI string against the publisher website and provide corrected DOI in bibliography.",
      source: "heuristic",
    });
  }

  if (causalCount > 0 && causalAssertions[0]) {
    priorityIssues.push({
      id: "iss-causal",
      priority: "B",
      title: "Moderation of Causal Assertions to Empirical Boundary",
      category: "Causal Claims",
      description: `The manuscript asserts strong causal mechanisms that should be moderated to reflect observational or empirical boundaries for "${cleanTitle.slice(0, 60)}...".`,
      location: "Abstract / Discussion",
      evidenceAnchor: `text: "${causalAssertions[0].slice(0, MAX_ASSERTION_SNIPPET_LENGTH)}"`,
      reviewerQuote: `'The assertion "${causalAssertions[0].slice(0, 55)}..." overstates what the presented empirical data can definitively prove.'`,
      actionableFix:
        "Reframe statements using calibrated hedging language (e.g. 'is strongly associated with' or 'provides empirical evidence consistent with') rather than unconditional causal claims.",
      rebuttalStrategy:
        "1. Acknowledge inferential limits: Concede that observational evidence cannot rule out unmeasured confounders.\n2. Soften causal verbs throughout Abstract, Results, and Discussion.\n3. Add dedicated Limitations subsection outlining required interventional studies for future work.",
      source: "heuristic",
    });
  }

  priorityIssues.push({
    id: "iss-stats",
    priority: "B",
    title: "Sample Power & Variance Reporting in Methodology",
    category: "Statistics",
    description: `Reporting of sample observations (${sampleCount > 0 ? sampleSizes[0] : "cohort data"}) requires explicit statistical power calculations (1 - beta >= 0.80) and 95% confidence intervals across all primary estimates.`,
    location: "Methods §2",
    evidenceAnchor:
      sampleCount > 0
        ? `text: §Methods "${sampleSizes[0]}"`
        : "absence: §Methods lacks explicit statistical power calculation",
    reviewerQuote:
      "'Please report exact test statistics, p-values, 95% confidence intervals, and explicit sample size power calculations for all primary outcomes.'",
    actionableFix:
      "Include post-hoc power calculations and add 95% confidence intervals to all tabular and graphical data summaries.",
    rebuttalStrategy:
      "1. Calculate power: Document that the sample size achieves >80% power to detect the observed effect size at alpha = 0.05.\n2. Add confidence intervals to all summary tables.\n3. Detail test assumptions and distribution verification in Methods.",
    source: "heuristic",
  });

  priorityIssues.push({
    id: "iss-scope",
    priority: "B",
    title: `Editorial Scope & Contribution Demarcation for ${targetJournal}`,
    category: "Scope/Fit",
    description: `To maximize editorial acceptance at ${targetJournal}, the introduction and discussion must explicitly connect findings to key debates and subscriber interests in ${discipline}.`,
    location: "Introduction & Conclusion",
    evidenceAnchor: `text: §Introduction "${cleanTitle.slice(0, 65)}..."`,
    reviewerQuote: `'Authors must clearly articulate the conceptual advance and practical implications specifically for the readership of ${targetJournal}.'`,
    actionableFix: `Refine the Introduction to highlight the theoretical and empirical advance specifically for ${targetJournal}.`,
    rebuttalStrategy:
      "1. Emphasize domain novelty in the revised Abstract and Introduction.\n2. Synthesize practical/theoretical implications in a dedicated discussion subsection.\n3. Provide an executive summary of key takeaways.",
    source: "heuristic",
  });

  if (repoCount === 0) {
    priorityIssues.push({
      id: "iss-reproducibility",
      priority: "C",
      title: "Replication Archive & Open Data Accessibility",
      category: "Methodology",
      description: `Leading journals in ${discipline} require persistent data and code access statements. Providing a persistent DOI repository link (e.g. Zenodo, OSF, GitHub) significantly reduces desk-reject friction.`,
      location: "Data Availability Statement",
      evidenceAnchor:
        "absence: §Data Availability statement missing persistent repository accession link",
      reviewerQuote:
        "'Complete methodological reproducibility requires depositing raw data or analysis scripts in a persistent open repository.'",
      actionableFix:
        "Deposit data and analysis scripts in an open repository (Zenodo, GitHub, OSF) and cite the accession DOI in the Data Availability Statement.",
      rebuttalStrategy:
        "1. Confirm open-science commitment by depositing scripts and data with a persistent DOI.\n2. Add formal Data Availability Statement with persistent link in revised manuscript.",
      source: "heuristic",
    });
  }

  return priorityIssues;
}
