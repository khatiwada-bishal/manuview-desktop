import type { ParsedManuscript, ReportingGuidelineCheck, ReportingGuidelineItem } from "../types";
import type { GuidelineDefinition, GuidelineDefinitionItem } from "./types";
import { stripReferences } from "./utils";
import { strobeGuideline } from "./strobe";
import { consortGuideline } from "./consort";
import { arriveGuideline } from "./arrive";
import { prismaGuideline } from "./prisma";
import { mlReproducibilityGuideline } from "./ml-reproducibility";
import { surveyEmpiricalGuideline } from "./survey-q";

export * from "./types";
export * from "./utils";
export * from "./strobe";
export * from "./consort";
export * from "./arrive";
export * from "./prisma";
export * from "./ml-reproducibility";
export * from "./survey-q";

export const GUIDELINE_REGISTRY: Record<string, GuidelineDefinition> = {
  strobe: strobeGuideline,
  consort: consortGuideline,
  arrive: arriveGuideline,
  prisma: prismaGuideline,
  ml_reproducibility: mlReproducibilityGuideline,
  survey_empirical: surveyEmpiricalGuideline,
};

import { parseManuscriptText } from "../parser";

export function getAllGuidelines(): GuidelineDefinition[] {
  return Object.values(GUIDELINE_REGISTRY);
}

export function getGuidelineById(id: string): GuidelineDefinition | undefined {
  return GUIDELINE_REGISTRY[id.toLowerCase()] || Object.values(GUIDELINE_REGISTRY).find((g) => g.id === id);
}

/**
 * Executes an audit of the provided manuscript against any modular reporting standard.
 */
export function executeModularGuidelineAudit(
  guidelineId: string,
  input: ParsedManuscript | string,
  discipline = "Multidisciplinary Research"
): ReportingGuidelineCheck {
  const guideline = getGuidelineById(guidelineId) || strobeGuideline;

  const manuscript: ParsedManuscript =
    typeof input === "string" ? parseManuscriptText(input) : input;

  const fullText = manuscript.rawText || "";
  const bodyText = stripReferences(fullText);

  const structuredItems: ReportingGuidelineItem[] = [];
  const compliantItems: string[] = [];
  const missingOrPartialItems: string[] = [];

  let evidencedCount = 0;
  let partialCount = 0;
  let absentCount = 0;

  for (const item of guideline.items) {
    const check = item.detector(bodyText, manuscript);

    if (check.matched && !check.partial) {
      evidencedCount++;
      structuredItems.push({
        itemNumber: item.itemNumber,
        name: item.name,
        section: item.section,
        description: item.description,
        status: "evidenced",
        evidenceExcerpt: check.excerpt,
        evidenceSection: check.evidenceSection,
        evidenceOffset: check.evidenceOffset,
      });

      const label = `Item ${item.itemNumber} (${item.name}): Evidenced${
        check.excerpt ? ` — "${check.excerpt}"` : ""
      }`;
      compliantItems.push(label);
    } else if (check.matched && check.partial) {
      partialCount++;
      structuredItems.push({
        itemNumber: item.itemNumber,
        name: item.name,
        section: item.section,
        description: item.description,
        status: "partial",
        evidenceExcerpt: check.excerpt,
        evidenceSection: check.evidenceSection || "document-wide",
        evidenceOffset: check.evidenceOffset,
        recommendation: `Mentioned in ${check.evidenceSection || "text"}, but recommended in formal ${item.section} section.`,
      });

      const label = `Item ${item.itemNumber} (${item.name}): Partial — found in ${check.evidenceSection || "text"}${
        check.excerpt ? `: "${check.excerpt}"` : ""
      }`;
      missingOrPartialItems.push(label);
    } else {
      absentCount++;
      structuredItems.push({
        itemNumber: item.itemNumber,
        name: item.name,
        section: item.section,
        description: item.description,
        status: "absent",
        recommendation: item.recommendationIfAbsent,
      });

      const label = `Item ${item.itemNumber} (${item.name}): Absent — ${item.recommendationIfAbsent}`;
      missingOrPartialItems.push(label);
    }
  }

  const totalItems = guideline.items.length;
  const scorePercent =
    totalItems > 0
      ? Math.round(((evidencedCount + 0.5 * partialCount) / totalItems) * 100)
      : 0;

  return {
    guidelineName: guideline.name,
    standardType: guideline.standardType,
    scorePercent,
    totalItems,
    evidencedCount,
    partialCount,
    absentCount,
    itemSetScope: guideline.itemSetScope,
    itemSetSize: guideline.itemSetSize,
    standardVersion: guideline.standardVersion,
    standardUrl: guideline.standardUrl,
    items: structuredItems,
    compliantItems,
    missingOrPartialItems,
  };
}
