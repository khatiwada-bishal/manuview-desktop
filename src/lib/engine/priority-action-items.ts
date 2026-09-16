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
      title: "Absence of Formal Materials and Methods Section (Critical Desk-Reject Barrier)",
      category: "Methodology",
      description:
        "The manuscript lacks a dedicated, standalone Materials and Methods section. In peer-reviewed scientific publishing, empirical and quantitative manuscripts lacking dedicated procedural documentation face immediate desk rejection during initial technical triage. External reviewers cannot evaluate sampling validity, statistical power, experimental controls, or analytical replicability without an explicit methodological architecture.",
      impactAssessment:
        "Immediate editorial desk-rejection hazard (100% fatal triage gate across major journals). Handling editors decline manuscripts lacking identifiable methods prior to referee assignment to protect reviewer resources and adhere to ICMJE/COPE reporting mandates.",
      location: "Manuscript Structure",
      evidenceAnchor: "absence: §Methods heading not detected in manuscript",
      reviewerQuote:
        "'The manuscript omits an identifiable Materials and Methods section. Without explicit documentation of study design, cohort parameters, measurement instruments, and statistical specifications, the empirical validity cannot be peer reviewed.'",
      actionableFix:
        "1. Create a dedicated top-level 'Materials and Methods' section immediately following Introduction.\n2. Add Subsection 'Study Design & Sampling' documenting participant/sample inclusion criteria, cohort size, and recruitment timeframe.\n3. Add Subsection 'Experimental Procedures & Instrumentation' specifying exact protocols, equipment, assays, or data pipelines.\n4. Add Subsection 'Statistical Analysis' specifying all hypotheses, software packages (with version numbers), significance thresholds (alpha), power assumptions, and variance estimators.",
      suggestedRewrite:
        "## Materials and Methods\n\n### Study Design and Population\nWe conducted a [prospective/retrospective/cross-sectional] investigation evaluating [target population or experimental system] (N = [sample size]). Protocol adherence and ethics approvals were granted by [Institutional Review Board / Ethics Committee, Protocol #XXXX]. Inclusion criteria required [criterion 1] and [criterion 2], with exclusions for [exclusion criterion].\n\n### Statistical Analysis\nQuantitative outcomes were evaluated using [Statistical Model / Software, version X.X]. Continuous variables are reported as mean (SD) or median (IQR) based on Shapiro-Wilk normality testing. Between-group comparisons were evaluated using [Test Name], with significance set at two-tailed alpha = 0.05. Statistical power calculations confirmed >80% power to detect an effect size of d = 0.XX.",
      rebuttalStrategy:
        "1. Direct Concession: Concede the omission and thank the editor for the technical triage flag.\n2. Section Introduction: Reference the newly inserted formal 'Materials and Methods' section (pages X–Y, lines A–B).\n3. Replicability Assurance: Highlight that all procedural protocols, variable operationalizations, and statistical models are now fully specified in accordance with reporting standards.",
      expectedEffort: "Substantial (1-2 weeks)",
      source: "heuristic",
    });
  }

  if (citationIntegrity.retractedCount > 0) {
    priorityIssues.push({
      id: "iss-retract",
      priority: "A",
      title: `Retracted Reference Flagged in Bibliography (${citationIntegrity.retractedCount} identified)`,
      category: "Citations",
      description: `Automated cross-referencing against the Retraction Watch database and publisher registry confirmed that ${citationIntegrity.retractedCount} cited work(s) have been formally retracted by their issuing journals. Citing retracted literature introduces substantial research integrity risks, indicating compromised bibliographic verification or reliance on discredited empirical claims.`,
      impactAssessment:
        "Severe editorial integrity hazard. Modern submission screening software automatically flags retracted DOIs to the Editor-in-Chief. Citing retracted papers without explicit contextual framing as retracted work frequently leads to editorial desk rejection or demands for sweeping ethical audits.",
      location: "References",
      evidenceAnchor: "references: Retracted DOI detected in bibliography",
      reviewerQuote:
        "'The bibliography includes one or more citations that have been formally retracted due to data integrity failures or unreplicable findings. The authors must purge these citations and confirm whether their core claims relied upon them.'",
      actionableFix:
        "1. Audit every cited occurrence of the retracted reference across the Introduction, Results, and Discussion.\n2. Remove the retracted reference(s) from the bibliography and bibliography management system.\n3. Identify verified, peer-reviewed replacement literature (e.g., recent systematic reviews or independent replication studies) supporting the same conceptual point.\n4. Re-verify that no mathematical models, baseline assumptions, or parameter values in the manuscript were derived from the retracted paper.",
      suggestedRewrite:
        "Example citation replacement:\nReplace: [Retracted Citation] ... with verified contemporary replication: '[Replacement Author et al., Journal Name, 2023, DOI: 10.xxxx/...]'\nIf the retraction is discussed as a scientific case study, explicitly annotate: '...as demonstrated in the subsequently retracted study by Author et al. (Retraction notice: Journal Name, Year, DOI: 10.xxxx/...)'",
      rebuttalStrategy:
        "1. Immediate Purge Confirmation: Explicitly state that the retracted work has been entirely expunged from the bibliography and in-text citations.\n2. Claim Independence Audit: Certify that the manuscript's empirical claims and hypotheses were re-evaluated against independent literature and remain fully intact.\n3. Replacement Documentation: Provide the complete citation details of the updated, verified peer-reviewed replacement sources in the response letter.",
      expectedEffort: "Immediate (1-2 hours)",
      source: "heuristic",
    });
  }

  if (citationIntegrity.unresolvableCount >= 2) {
    priorityIssues.push({
      id: "iss-hallucinate",
      priority: "A",
      title: `Unresolvable DOI References in Bibliography (${citationIntegrity.unresolvableCount} unresolved)`,
      category: "Citations",
      description: `${citationIntegrity.unresolvableCount} cited DOIs failed resolution against the international Crossref registry (HTTP 404). In modern academic publishing, clusters of unresolvable DOIs trigger immediate suspicion of automated LLM-hallucinated citations or unverified secondary referencing, prompting editorial scrutiny before peer review.`,
      impactAssessment:
        "High desk-reject vulnerability. Journal editorial offices utilize automated pre-flight tools to validate reference lists; unresolved DOIs are flagged as potential synthetic citations or severe clerical negligence, stalling editorial workflow.",
      location: "References",
      evidenceAnchor: "references: DOIs returning 404 in Crossref",
      reviewerQuote:
        "'Several DOIs cited in the bibliography fail to resolve in Crossref or publisher catalogs. Are these authentic, verifiable publications? Please verify every citation against official journal registries.'",
      actionableFix:
        "1. Check each flagged DOI on doi.org and PubMed to distinguish typographical errors from nonexistent citations.\n2. Fix common OCR/formatting artifacts (e.g., trailing hyphens, truncated suffixes, merged punctuation).\n3. If a reference was erroneously synthesized or cannot be located, replace it with authentic indexed primary literature.\n4. Ensure every journal article in the bibliography provides an active, resolving https://doi.org/10.xxxx link.",
      suggestedRewrite:
        "Verify and format as standard active Crossref URL:\nBefore: DOI: 10.1038/s41586-999-fake404\nAfter: Author A, Author B. Title of Verified Paper. Journal Name. 2023;Vol(Issue):Page-Page. https://doi.org/10.1038/s41586-023-XXXXX-X",
      rebuttalStrategy:
        "1. Bibliographic Audit: State that every cited reference was manually audited against publisher landing pages and the Crossref registry.\n2. Typographical Correction: Provide a table in the response letter listing the corrected DOI strings alongside their active resolver URLs.\n3. Verified Source Reassurance: Confirm that all cited literature constitutes authentic, accessible peer-reviewed scholarship.",
      expectedEffort: "Immediate (1-2 hours)",
      source: "heuristic",
    });
  } else if (citationIntegrity.unresolvableCount === 1) {
    priorityIssues.push({
      id: "iss-unverified-doi",
      priority: "B",
      title: "Unverified Reference DOI String (Resolution Failure)",
      category: "Citations",
      description:
        "One DOI in the reference list failed resolution against the Crossref registry. While likely an inadvertent typographical error or PDF extraction artifact, unresolved DOIs hinder referee reference checks and delay post-acceptance production indexing.",
      impactAssessment:
        "Editorial formatting barrier and reviewer irritation. Minor technical objection that requires correction during revision or editorial pre-screening.",
      location: "References",
      evidenceAnchor: "references: 1 unverified DOI in Crossref",
      reviewerQuote:
        "'One of the cited DOIs fails to resolve. Please verify the bibliographic entry and provide the correct DOI string.'",
      actionableFix:
        "1. Locate the cited paper in Google Scholar, PubMed, or Crossref Search.\n2. Inspect the DOI string for transposed digits, missing prefix characters, or stray punctuation.\n3. Update the bibliography with the verified canonical DOI URL.",
      suggestedRewrite:
        "Corrected canonical entry:\nAuthor AA, Author BB. Article Title. Journal. Year;Vol:Pages. https://doi.org/10.XXXX/XXXXXX",
      rebuttalStrategy:
        "1. Acknowledge and resolve: Supply the verified, resolving DOI string in the response letter and updated manuscript text.",
      expectedEffort: "Immediate (1-2 hours)",
      source: "heuristic",
    });
  }

  if (causalCount > 0 && causalAssertions[0]) {
    priorityIssues.push({
      id: "iss-causal",
      priority: "B",
      title: "Calibration of Causal Claims to Observational & Empirical Boundaries",
      category: "Causal Claims",
      description: `The manuscript makes assertive causal declarations (e.g., stating that X "causes", "drives", or "proves" Y) that exceed the definitive inferential warrant of the presented empirical design for "${cleanTitle.slice(0, 60)}...". Without randomized interventional controls or exogenous instrument identification, observational associations cannot rule out confounding, selection bias, or reverse causality.`,
      impactAssessment:
        "High vulnerability to Reviewer 3 (Methods) and Reviewer 4 (Statistician). Methodological referees frequently reject submissions that overclaim causal mechanisms from correlational or observational data, demanding either interventional validation or extensive epistemic moderation.",
      location: "Abstract / Discussion",
      evidenceAnchor: `text: "${causalAssertions[0].slice(0, MAX_ASSERTION_SNIPPET_LENGTH)}"`,
      reviewerQuote: `'The assertion "${causalAssertions[0].slice(0, 55)}..." asserts a direct causal mechanism that the study design cannot definitively establish. The authors must moderate their causal claims and explicitly state inferential boundaries.'`,
      actionableFix:
        "1. Replace deterministic causal verbs ('proves', 'causes', 'demonstrates that X leads to') in the Abstract, Results, and Discussion with calibrated scholarly hedging.\n2. Frame outcomes in terms of empirical association, predictive validity, or evidence consistency ('is strongly associated with', 'provides evidence consistent with', 'suggests a contributory role').\n3. Add a dedicated 'Methodological Limitations' subsection explicitly discussing unmeasured confounders, measurement error, and directional ambiguity.\n4. Outline the exact randomized or interventional study design needed in future work to prove causality.",
      suggestedRewrite:
        "Before: 'Our findings prove that [Variable X] causes a significant reduction in [Variable Y], demonstrating its therapeutic efficacy.'\nAfter: 'Our findings demonstrate a robust, statistically significant inverse association between [Variable X] and [Variable Y] (beta = -0.XX, 95% CI [-0.XX, -0.XX], p < 0.001). While these empirical observations are consistent with a mechanistic role for [Variable X], randomized interventional trials remain essential to rule out unmeasured confounders and establish definitive causality.'",
      rebuttalStrategy:
        "1. Epistemic Alignment: Fully agree with the referee's critique regarding the limits of observational/empirical inference.\n2. Exhaustive Audit: Document all line-by-line text edits in the Abstract, Results, and Discussion where causal assertions were replaced with calibrated phrasing.\n3. Dedicated Limitations: Cite the newly added Limitations subsection delineating required future interventional trials.",
      expectedEffort: "Moderate (1-2 days)",
      source: "heuristic",
    });
  }

  priorityIssues.push({
    id: "iss-stats",
    priority: "B",
    title: "Sample Power Specification & Variance Reporting in Methodology",
    category: "Statistics",
    description: `Reporting of experimental observations (${sampleCount > 0 ? sampleSizes[0] : "cohort sample data"}) lacks explicit statistical power justification (target 1 - beta >= 0.80 at alpha = 0.05) and complete variance metrics (95% confidence intervals and exact test statistics) across primary outcome measures. Quantitative reviewers demand proof that sample sizes were sufficiently powered to detect the claimed effect sizes without Type II error inflation.`,
    impactAssessment:
      "Substantial hurdle with statistical referees. Quantitative reviewers routinely recommend 'Major Revision' or 'Reject' when manuscripts present p-values without confidence intervals, effect sizes (e.g., Cohen's d, partial eta^2), or statistical power validation.",
    location: "Methods §2 / Results",
    evidenceAnchor:
      sampleCount > 0
        ? `text: §Methods "${sampleSizes[0]}"`
        : "absence: §Methods lacks explicit statistical power calculation",
    reviewerQuote:
      "'Please provide an explicit statistical power calculation for the primary cohort. In addition, report exact test statistics, degrees of freedom, 95% confidence intervals, and standardized effect sizes for all primary comparisons rather than solitary p-values.'",
    actionableFix:
      "1. Perform an a priori (or post-hoc sensitivity) power calculation specifying alpha, target power (>=0.80), effect size d, and required sample size N.\n2. Add 95% confidence intervals [lower, upper] to every reported point estimate in the text, summary tables, and figure captions.\n3. Report exact test statistics and degrees of freedom (e.g., t(48) = 2.45, p = 0.018, d = 0.70) instead of bare 'p < 0.05'.\n4. Specify whether multiple testing corrections (e.g., Benjamini-Hochberg FDR or Bonferroni) were applied across secondary endpoints.",
    suggestedRewrite:
      "In Methods (§Statistical Analysis):\n'A prospective power calculation using G*Power 3.1 indicated that a sample size of N = XX participants was required to detect a medium effect size (Cohen's d = 0.50) with 80% statistical power at a two-tailed significance threshold of alpha = 0.05.'\nIn Results:\n'Group A exhibited significantly greater improvements compared to Group B (mean difference = 4.25 units, 95% CI [1.15, 7.35], t(58) = 2.74, p = 0.008, Cohen's d = 0.71). Multiple comparisons were adjusted using the Benjamini-Hochberg false discovery rate (q < 0.05).'",
    rebuttalStrategy:
      "1. Power Documentation: State that formal sample size power calculations have been added to Section X.X of Methods.\n2. Confidence Intervals Added: Confirm that all summary tables (Tables 1–3) and narrative results now report 95% CIs and effect sizes.\n3. Statistical Transparency: Provide a summary table in the response letter comparing the revised statistical reporting against the initial submission.",
    expectedEffort: "Moderate (1-2 days)",
    source: "heuristic",
  });

  priorityIssues.push({
    id: "iss-scope",
    priority: "B",
    title: `Editorial Scope & Disciplinary Contribution Demarcation for ${targetJournal}`,
    category: "Scope/Fit",
    description: `To maximize editorial acceptance at ${targetJournal}, the Introduction and Discussion must explicitly bridge the manuscript's findings to prevailing scholarly debates, theoretical frameworks, and subscriber interests in ${discipline}. Editors at top-tier venues desk-reject up to 60% of methodologically sound papers that fail to demonstrate immediate relevance to their core readership.`,
    impactAssessment:
      "Triage desk-rejection risk. The handling editor evaluates submissions during the first 48 hours specifically asking: 'Will our subscribers cite and read this work?' Manuscripts without explicit framing tailored to the journal's editorial charter are declined without peer review.",
    location: "Introduction & Discussion",
    evidenceAnchor: `text: §Introduction "${cleanTitle.slice(0, 65)}..."`,
    reviewerQuote: `'While the study is technically competent, the authors have not established why this work should be published in ${targetJournal} rather than a specialized sub-field repository. What is the broader conceptual takeaway for our audience?'`,
    actionableFix:
      `1. Rewrite the opening paragraphs of the Introduction to contextualize the research question within broader debates featured in recent issues of ${targetJournal}.\n2. Clearly demarcate the novel theoretical or empirical advance in the final paragraph of the Introduction.\n3. Add a dedicated 'Practical & Theoretical Implications' subsection in the Discussion connecting findings to translational, clinical, or policy applications relevant to ${targetJournal}.\n4. Provide 2-3 concise, bulleted 'Takeaway Messages for Practitioners/Researchers' in the Conclusion.`,
    suggestedRewrite:
      `In Introduction (Opening):\n'Recent investigations in ${discipline} have focused on [Core Problem] (e.g., [Target Journal Citation, 2023]). However, a critical unresolved question remains whether [Specific Gap]. In this study, we address this debate by demonstrating [Core Finding], providing direct empirical evidence that resolves [Scholarly Controversy].'\nIn Discussion (Implications):\n'These findings have three direct implications for the readership of ${targetJournal}: First, [Implication 1]; Second, [Implication 2]; Third, [Implication 3].'`,
    rebuttalStrategy:
      `1. Readership Alignment: Detail the specific Introduction and Discussion revisions highlighting conceptual contributions to ${targetJournal}.\n2. Contextual Framing: Emphasize how the revised framing directly engages literature published in ${targetJournal} over the preceding 24 months.\n3. Cover Letter Synergy: Ensure the submitted cover letter mirrors these highlighted contributions.`,
    expectedEffort: "Moderate (1-2 days)",
    source: "heuristic",
  });

  if (repoCount === 0) {
    priorityIssues.push({
      id: "iss-reproducibility",
      priority: "C",
      title: "Open Science Replication Archive & Persistent Data Access Statement",
      category: "Methodology",
      description: `Leading indexed journals in ${discipline} enforce strict open-science and data accessibility mandates (compliant with FAIR principles: Findable, Accessible, Interoperable, Reusable). The manuscript currently lacks a persistent repository accession link (e.g., Zenodo, OSF, Figshare, or GitHub DOI) and structured data availability statement.`,
      impactAssessment:
        "Editorial processing hold or conditional desk rejection. Automated submission systems at major publishers (Nature Portfolio, Elsevier, PLOS, IEEE, Wiley) halt manuscript ingestion if mandatory Data Availability Statements are missing or incomplete.",
      location: "Data Availability Statement",
      evidenceAnchor:
        "absence: §Data Availability statement missing persistent repository accession link",
      reviewerQuote:
        "'In accordance with journal reproducibility policy, the authors must provide an explicit Data Availability Statement including a persistent repository DOI for raw data and analytical scripts.'",
      actionableFix:
        "1. Package de-identified raw data, processed datasets, and analysis scripts (R, Python, Stata) into a version-controlled repository.\n2. Deposit the archive into a permanent academic repository (Zenodo, OSF, or Figshare) to generate a citable DOI.\n3. Insert a formal 'Data and Code Availability' section before References containing the repository link, DOI, and license terms.\n4. If data cannot be shared due to privacy or proprietary constraints, provide a compliant restricted-access justification with contact procedures.",
      suggestedRewrite:
        "## Data and Code Availability\nThe complete de-identified dataset, processing pipelines, and analytical scripts supporting the findings of this study have been deposited in the Zenodo open-access repository under a Creative Commons Attribution 4.0 International license (CC-BY 4.0) and are publicly accessible at https://doi.org/10.5281/zenodo.XXXXXXX. Operational software dependencies and environment specifications (requirements.txt / renv.lock) are included to ensure computational reproducibility.",
      rebuttalStrategy:
        "1. Open Repository Confirmation: Provide the persistent Zenodo/OSF repository DOI and access credentials in the response letter.\n2. Compliance Certification: Confirm that the newly inserted Data Availability Statement satisfies the target journal's reporting mandates.",
      expectedEffort: "Immediate (1-2 hours)",
      source: "heuristic",
    });
  }

  return priorityIssues;
}
