/**
 * Offline Academic Templates and Decision Letter Parser
 * Provides 100% deterministic, local generation for:
 * 1. Journal Submission Cover Letters (Nature, Elsevier, IEEE, PLOS, Standard)
 * 2. Point-by-Point Referee Response Rebuttal Matrices
 */

export type CoverLetterFormat = "standard" | "nature" | "elsevier" | "ieee" | "plos";

export interface CoverLetterParams {
  title: string;
  targetJournal: string;
  abstract: string;
  keywords?: string;
  mainFindings?: string;
  broadSignificance?: string;
  format?: CoverLetterFormat;
  correspondingAuthor?: string;
  institution?: string;
  email?: string;
}

export function generateOfflineCoverLetter(params: CoverLetterParams): string {
  const {
    title,
    targetJournal,
    abstract,
    keywords = "",
    mainFindings = "",
    broadSignificance = "",
    format = "standard",
    correspondingAuthor = "[Corresponding Author Name, Ph.D.]",
    institution = "[Affiliated Department & University / Research Institution]",
    email = "[author.email@institution.edu]",
  } = params;

  const dateStr = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const cleanTitle = title.trim().replace(/\.$/, "");
  const cleanJournal = targetJournal.trim();
  const cleanAbstract = abstract.trim();

  // Extract key summary sentences from abstract if findings not provided
  let summaryFindings = mainFindings.trim();
  if (!summaryFindings) {
    const sentences = cleanAbstract.split(/(?<=[.!?])\s+/);
    if (sentences.length > 2) {
      // Middle to later sentences usually contain the main discovery
      summaryFindings = sentences.slice(1, Math.min(4, sentences.length)).join(" ");
    } else {
      summaryFindings = cleanAbstract;
    }
  }

  let significanceText = broadSignificance.trim();
  if (!significanceText) {
    significanceText = `This study directly advances the scientific community's understanding within the core scope of ${cleanJournal} by elucidating previously uncharacterized mechanisms and providing an empirical foundation for subsequent investigation.`;
  }

  // Format-specific editorial nuances
  let recipientTitle = `Editor-in-Chief / Editorial Board\n${cleanJournal}`;
  let openingSalutation = "Dear Editor,";
  let specificCompliance = "";

  switch (format) {
    case "nature":
      recipientTitle = `Senior Editorial Board\n${cleanJournal}\nNature Portfolio`;
      openingSalutation = "Dear Editors,";
      specificCompliance = `In accordance with Nature Portfolio editorial policies:
1. This manuscript represents original research that has not been published previously and is not under consideration for publication elsewhere.
2. All primary datasets, raw experimental values, and analytical scripts supporting the findings will be made openly accessible via institutional or public repositories (e.g., Zenodo / GitHub) upon provisional acceptance.
3. All listed co-authors have thoroughly reviewed, contributed to, and approved the final manuscript.
4. Any relevant research approvals (IRB / animal care committee protocols) were obtained prior to study initiation, and the authors declare no competing financial or non-financial interests.`;
      break;

    case "elsevier":
      recipientTitle = `Editor-in-Chief\n${cleanJournal}\nElsevier Academic Press`;
      openingSalutation = "Dear Editor-in-Chief,";
      specificCompliance = `In alignment with Elsevier publication standards:
1. The submission is an original contribution not previously published and not currently submitted to any other peer-reviewed venue.
2. The manuscript adheres to the Guide for Authors of ${cleanJournal}, including graphical abstract readiness and data availability guidelines.
3. All authors have approved the manuscript for submission and take collective responsibility for its scientific integrity.
4. The authors declare no conflict of interest or external commercial bias in the preparation of this research.`;
      break;

    case "ieee":
      recipientTitle = `Editor-in-Chief / Publications Committee\n${cleanJournal}\nIEEE Transactions`;
      openingSalutation = "Dear Editor-in-Chief,";
      specificCompliance = `In accordance with IEEE submission standards:
1. This work presents novel theoretical and experimental results that have not appeared in any other conference or journal publication.
2. Full source code, algorithmic implementations, and benchmark datasets have been documented to ensure reproducible evaluation by referees and readers.
3. All listed contributors have verified the technical validity and sanctioned this submission.
4. No conflicts of interest exist regarding this submission.`;
      break;

    case "plos":
      recipientTitle = `Academic Editor & Staff\n${cleanJournal}\nPublic Library of Science (PLOS)`;
      openingSalutation = "Dear Academic Editor,";
      specificCompliance = `In adherence to PLOS Open Science and Open Access mandates:
1. All relevant underlying data are fully described within the manuscript and supplementary files, and raw data will be permanently deposited in a public repository with an assigned DOI.
2. The manuscript is original, unsubmitted elsewhere, and meets all community-specific reporting guidelines (e.g., ARRIVE / STROBE / CONSORT where applicable).
3. All authors have reviewed and approved the submission.
4. The authors declare that no competing interests exist.`;
      break;

    case "standard":
    default:
      recipientTitle = `Senior Editor-in-Chief\n${cleanJournal}`;
      openingSalutation = "Dear Editor-in-Chief,";
      specificCompliance = `We confirm the following editorial statements:
1. The manuscript is an original work that has not been published previously and is not currently under consideration by any other journal.
2. All co-authors have critically evaluated and approved the contents of this manuscript.
3. Relevant ethical committee approvals and consent procedures were adhered to where required.
4. Complete raw datasets and reproducible analytical materials will be made available upon request or via public data repositories upon publication.
5. The authors declare no conflicts of interest.`;
      break;
  }

  const keywordSection = keywords.trim()
    ? `\nKeywords: ${keywords.trim()}\n`
    : "";

  return `${dateStr}

To:
${recipientTitle}

Subject: Submission of Original Research Manuscript: "${cleanTitle}"

${openingSalutation}

Please find enclosed our original research manuscript entitled "${cleanTitle}", which we formally submit for publication consideration as a Research Article in ${cleanJournal}.

${summaryFindings}

We believe that our work aligns directly with the editorial scope and readership of ${cleanJournal}. Specifically, ${significanceText}

${specificCompliance}

Suggested Non-Conflicted Reviewers:
1. [Potential Reviewer 1, Department, Institution, Email, Field of Expertise]
2. [Potential Reviewer 2, Department, Institution, Email, Field of Expertise]
3. [Potential Reviewer 3, Department, Institution, Email, Field of Expertise]
${keywordSection}
Thank you very much for your time, editorial evaluation, and consideration of our work. We look forward to hearing from you.

Sincerely,

${correspondingAuthor}
${institution}
Email: ${email}
ORCID: [0000-000X-XXXX-XXXX]`;
}

export interface RebuttalItem {
  reviewer: string;
  itemNumber: number;
  category: string;
  rawComment: string;
  actionRequired: string;
  draftResponse: string;
}

/**
 * Parses referee decision letters offline into discrete critique points
 * and populates rigorous academic rebuttal draft frames.
 */
export function parseDecisionLetterOffline(rawText: string): RebuttalItem[] {
  const text = (rawText || "").trim();
  if (!text) return [];

  const items: RebuttalItem[] = [];

  // 1. Identify Reviewer / Editor boundaries
  const reviewerHeaderRegex = /(?:^|\n)(?:#{1,4}\s*)?(?:(?:Reviewer|Referee)\s*#?\s*([0-9A-Za-z]+)|(Editor(?:'s)?(?:\s+Comments?)?|(?:Associate\s+)?Editor))[\s\S]*?(?=(?:(?:\n(?:#{1,4}\s*)?(?:(?:Reviewer|Referee)\s*#?\s*[0-9A-Za-z]+|(?:Associate\s+)?Editor))|$))/gi;

  const matches = [...text.matchAll(reviewerHeaderRegex)];

  if (matches.length > 0) {
    let globalItemCounter = 1;

    for (const match of matches) {
      const fullSection = match[0].trim();
      const reviewerId = match[1]
        ? `Reviewer ${match[1]}`
        : (match[2] ? match[2].trim() : "Reviewer");

      const contentLines = fullSection.split("\n");
      contentLines.shift(); // remove header
      const sectionContent = contentLines.join("\n").trim();

      if (!sectionContent) continue;

      const parsedPoints = extractPointsFromSection(sectionContent, reviewerId, globalItemCounter);
      items.push(...parsedPoints);
      globalItemCounter += parsedPoints.length;
    }
  } else {
    items.push(...extractPointsFromSection(text, "Reviewer 1", 1));
  }

  if (items.length === 0 && text.length > 0) {
    items.push(generateRebuttalItem("Reviewer 1", 1, text));
  }

  return items;
}

function extractPointsFromSection(
  sectionText: string,
  reviewerLabel: string,
  startingNumber: number
): RebuttalItem[] {
  const items: RebuttalItem[] = [];

  const pointPattern = /(?:^|\n)\s*(?:(\d+)[\.\)]|(?:Point|Comment|Critique)\s*#?\s*(\d+)[:\.]?|[-*•]\s+)([\s\S]*?)(?=(?:\n\s*(?:\d+[\.\)]|(?:Point|Comment|Critique)\s*#?\s*\d+[:\.]?|[-*•]\s+))|$)/gi;

  const matches = [...sectionText.matchAll(pointPattern)];

  if (matches.length > 0) {
    let count = 0;
    for (const match of matches) {
      const explicitNum = match[1] || match[2];
      const commentContent = (match[3] || match[0]).trim();

      if (commentContent.length > 10) {
        count++;
        const itemNumber = explicitNum ? parseInt(explicitNum, 10) : (startingNumber + count - 1);
        items.push(generateRebuttalItem(reviewerLabel, itemNumber, commentContent));
      }
    }
  }

  if (items.length === 0) {
    const paragraphs = sectionText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 25 && !p.toLowerCase().startsWith("dear") && !p.toLowerCase().includes("thank you for submitting"));

    paragraphs.forEach((para, idx) => {
      items.push(generateRebuttalItem(reviewerLabel, startingNumber + idx, para));
    });
  }

  return items;
}

function categorizeComment(comment: string): string {
  const lower = comment.toLowerCase();

  if (/\b(statistic|p-value|p\s*[<=]|t-test|anova|wilcoxon|mann-whitney|normality|shapiro|bonferroni|fdr|power analysis|confidence interval|error bar|standard deviation|sem|sd)\b/i.test(lower)) {
    return "Statistics";
  }
  if (/\b(method|protocol|assay|replicate|batch|pipeline|technique|parameter|experimental design|control group|vehicle|primer|antibody|organoid|cell line)\b/i.test(lower)) {
    return "Methodology";
  }
  if (/\b(additional experiment|in vivo|in vitro|knockdown|knockout|overexpression|validation cohort|replicate|repeat|functional assay|benchmarking)\b/i.test(lower)) {
    return "Additional Experiments";
  }
  if (/\b(cite|citation|reference|literature|et al|prior work|published in|previous study|bibliography|missing reference)\b/i.test(lower)) {
    return "Citations";
  }
  return "Clarification/Text";
}

function generateRebuttalItem(reviewer: string, itemNumber: number, comment: string): RebuttalItem {
  const cleanComment = comment.trim();
  const category = categorizeComment(cleanComment);

  let actionRequired = "";
  let draftResponse = "";

  switch (category) {
    case "Statistics":
      actionRequired = "Re-evaluate statistical assumptions, report exact degrees of freedom and p-values, and update figure legends with precise n and error bar definitions.";
      draftResponse = `We thank the reviewer for this critical statistical observation. We have re-examined our analytical approach and confirmed the statistical assumptions for this dataset. Specifically, we have performed [e.g., test for normality / non-parametric verification] and verified that our findings remain robust (p = 0.0XX). 

In the revised manuscript, we have updated Figure [X] and amended the corresponding text and legend to report exact sample sizes (n = [X] biological replicates), test statistics, degrees of freedom, and precise p-values (see Section [X.X], Lines [XX–YY]).`;
      break;

    case "Methodology":
      actionRequired = "Clarify experimental protocol, provide reagent/concentration specifics, and expand Methods section to guarantee reproducibility.";
      draftResponse = `We appreciate the reviewer highlighting this important methodological detail. In response, we have substantially expanded the Methods section to provide full experimental transparency. Specifically, we have clarified [insert protocol details, e.g., cell line authentication, antibody dilutions, incubation conditions, or computational pipeline parameters].

These protocol modifications and quality control metrics are now documented in detail in Section [Methods, Lines XX–YY].`;
      break;

    case "Additional Experiments":
      actionRequired = "Perform targeted validation experiment / orthogonal assay or provide clear justification with existing supporting data.";
      draftResponse = `We thank the reviewer for this insightful suggestion. To directly address this concern, we conducted [additional experiment / validation assay] across [number] biological replicates. Consistent with our initial model, the new data demonstrate that [brief experimental finding].

These new results have been integrated into the revised manuscript as Figure [X] / Supplementary Figure [S#] and are discussed in detail on Lines [XX–YY].`;
      break;

    case "Citations":
      actionRequired = "Incorporate suggested literature citations and discuss contextual relevance in Introduction/Discussion.";
      draftResponse = `We agree with the reviewer that discussing these prior studies contextualizes our findings. We have incorporated references to [Author et al., Year] and related work in both the Introduction and Discussion sections (Lines [XX–YY]). We now explicitly highlight how our current findings corroborate and extend beyond these earlier observations.`;
      break;

    case "Clarification/Text":
    default:
      actionRequired = "Revise manuscript text, tighten phrasing, and address ambiguities identified by the referee.";
      draftResponse = `We are grateful to the reviewer for pointing this out. We acknowledge that the original phrasing could lead to misinterpretation. We have thoroughly revised the text in Section [X] to explicitly state [clarified interpretation], ensuring complete precision (Lines [XX–YY]).`;
      break;
  }

  return {
    reviewer,
    itemNumber,
    category,
    rawComment: cleanComment,
    actionRequired,
    draftResponse,
  };
}
