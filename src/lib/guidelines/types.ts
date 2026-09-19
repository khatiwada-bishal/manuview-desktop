import type { ParsedManuscript, ReportingGuidelineItem } from "../types";

export interface GuidelineDetectorResult {
  matched: boolean;
  excerpt?: string;
  partial?: boolean;
  evidenceSection?: string;
  evidenceOffset?: number;
}

export interface GuidelineDefinitionItem {
  itemNumber: number;
  name: string;
  section: string;
  description: string;
  detector: (bodyText: string, manuscript: ParsedManuscript) => GuidelineDetectorResult;
  recommendationIfAbsent: string;
}

export interface GuidelineDefinition {
  id: string;
  name: string;
  standardType: string;
  standardVersion: string;
  standardUrl: string;
  itemSetScope: "full" | "core_subset";
  itemSetSize: number;
  items: GuidelineDefinitionItem[];
}
