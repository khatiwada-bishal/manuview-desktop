import { z } from "zod";
import { ScoreDimension, PriorityLevel, JournalRecommendation } from "./types";

export const VALID_SCORE_DIMENSIONS: ScoreDimension[] = [
  "originality",
  "broad_interest",
  "claims_vs_evidence",
  "methodology",
  "clarity",
  "prior_work",
];

export const DimensionScoreSchema = z.object({
  score: z.number().transform((v) => Math.min(5, Math.max(1, Math.round(v)))),
  label: z.string().min(1),
  verdict: z.string().min(1),
  strengths: z.array(z.string()).default([]),
  vulnerabilities: z.array(z.string()).default([]),
});

export const PriorityCategorySchema = z.enum([
  "Methodology",
  "Causal Claims",
  "Statistics",
  "Citations",
  "Scope/Fit",
  "Clarity",
]);

export const PriorityIssueSchema = z.object({
  id: z.string().default(() => `iss-${Math.random().toString(36).substring(2, 7)}`),
  priority: z.enum(["A", "B", "C"]).or(
    z.string().transform((val) => {
      const u = val.toUpperCase().trim();
      return u === "A" || u === "B" || u === "C" ? (u as PriorityLevel) : "B";
    })
  ),
  title: z.string().min(1),
  category: PriorityCategorySchema.catch("Methodology"),
  description: z.string().min(1),
  location: z.string().default("Manuscript Structure"),
  evidenceAnchor: z.string().default("text: §General"),
  reviewerQuote: z.string().default(""),
  actionableFix: z.string().min(1),
  rebuttalStrategy: z.string().default("Address in revision and clarify methodology bounds"),
});

export const ReviewerPersonaTypeSchema = z.string().transform((val) => {
  const norm = (val || "").toLowerCase().replace(/[\s\-_]+/g, "_").trim();
  if (norm.includes("method")) return "methods_reviewer" as const;
  if (norm.includes("stat") || norm.includes("quant")) return "statistician" as const;
  if (norm.includes("devil") || norm.includes("adversar") || norm.includes("stress")) return "devils_advocate" as const;
  if (norm.includes("editor") || norm.includes("journal")) return "journal_editor" as const;
  return "domain_expert" as const;
});

export const DecisionRecommendationSchema = z.enum([
  "Major Revision",
  "Reject / Resubmit",
  "Desk Reject",
  "Minor Revision",
]);

const StringOrArray = z.union([
  z.array(z.string()),
  z.string().transform((s) => [s]),
]);

export const ReviewerConcreteSolutionSchema = z.object({
  issue: z.preprocess((val) => (typeof val === "string" ? val.trim() : ""), z.string()).default(""),
  proposedFix: z.preprocess((val) => (typeof val === "string" ? val.trim() : ""), z.string()).default(""),
  exampleRewrite: z.preprocess((val) => (typeof val === "string" ? val.trim() : undefined), z.string().optional()),
});

export const ReviewerPersonaSchema = z.object({
  persona: ReviewerPersonaTypeSchema.default("domain_expert"),
  name: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : "Reviewer"), z.string()),
  title: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : "Senior Peer Reviewer"), z.string()),
  affiliation: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : "Editorial Review Board"), z.string()),
  expertise: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : "Domain Specialist"), z.string()),
  roleDescription: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : "Panel Referee"), z.string()),
  decisionRecommendation: DecisionRecommendationSchema.default("Major Revision"),
  keyChallenge: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : "Methodological rigor and contribution significance"), z.string()),
  assessment: z.preprocess((val) => (typeof val === "string" && val.trim() ? val.trim() : "Thorough evaluation of manuscript rigor and validity required."), z.string()),
  strengths: StringOrArray.default([]),
  majorCritiques: StringOrArray.default(["Explicit parameter and control documentation required."]),
  concreteSolutions: z.array(ReviewerConcreteSolutionSchema).default([]),
  missingControlsOrAnalyses: StringOrArray.default([]),
  mustAddressItems: StringOrArray.default([]),
  minorComments: StringOrArray.default([]),
  evidenceAnchors: StringOrArray.default([]),
  counterArguments: StringOrArray.default([]),
  confidentialEditorNote: z.string().optional(),
});

export const JournalTierSchema = z.enum(["Reach", "Realistic", "Fallback"]);

export const JournalRecommendationSchema = z.object({
  tier: z
    .string()
    .transform((val) => {
      const u = (val || "").trim().toLowerCase();
      if (u === "reach") return "Reach" as const;
      if (u === "fallback") return "Fallback" as const;
      return "Realistic" as const;
    })
    .default("Realistic"),
  journalName: z.string().min(1),
  impactFactor: z.union([z.number(), z.string()]).optional(),
  publisher: z.string().default("Academic Publisher"),
  fitScore: z.number().transform((v) => Math.min(100, Math.max(0, Math.round(v)))).default(75),
  scopeRationale: z.string().min(1),
  rejectionRisks: z.array(z.string()).default([]),
  requiredRevisionsForFit: z.array(z.string()).default([]),
});

export interface SectionValidationResult<T> {
  isValid: boolean;
  data?: T;
  source: "llm" | "heuristic";
}

const isScoreDimension = (key: string): key is ScoreDimension =>
  (VALID_SCORE_DIMENSIONS as readonly string[]).includes(key);

/**
 * Validates dimensions object per-field against ScoreDimension keys and clamps scores (REQ-EN-05)
 */
export function validateDimensions(
  rawDimensions: any
): SectionValidationResult<Record<ScoreDimension, z.infer<typeof DimensionScoreSchema>>> {
  if (!rawDimensions || typeof rawDimensions !== "object") {
    return { isValid: false, source: "heuristic" };
  }

  const validDimensions: Partial<Record<ScoreDimension, z.infer<typeof DimensionScoreSchema>>> = {};
  for (const [key, value] of Object.entries(rawDimensions)) {
    if (isScoreDimension(key)) {
      const parsed = DimensionScoreSchema.safeParse(value);
      if (parsed.success) {
        validDimensions[key] = parsed.data;
      }
    }
  }

  const validCount = Object.keys(validDimensions).length;
  if (validCount >= 3) {
    return {
      isValid: true,
      data: validDimensions as Record<ScoreDimension, z.infer<typeof DimensionScoreSchema>>,
      source: "llm",
    };
  }

  return { isValid: false, source: "heuristic" };
}

/**
 * Validates priority issues array per-item with Zod (REQ-EN-05)
 */
export function validatePriorityIssues(
  rawIssues: any
): SectionValidationResult<z.infer<typeof PriorityIssueSchema>[]> {
  if (!Array.isArray(rawIssues)) {
    return { isValid: false, source: "heuristic" };
  }

  const validIssues: z.infer<typeof PriorityIssueSchema>[] = [];
  for (const item of rawIssues) {
    const parsed = PriorityIssueSchema.safeParse(item);
    if (parsed.success) {
      validIssues.push(parsed.data);
    }
  }

  if (validIssues.length >= 2) {
    return { isValid: true, data: validIssues, source: "llm" };
  }

  return { isValid: false, source: "heuristic" };
}

/**
 * Validates reviewer personas array per-item with Zod (REQ-EN-05)
 */
export function validateReviewerPersonas(
  rawPersonas: any
): SectionValidationResult<z.infer<typeof ReviewerPersonaSchema>[]> {
  if (!Array.isArray(rawPersonas)) {
    return { isValid: false, source: "heuristic" };
  }

  const validPersonas: z.infer<typeof ReviewerPersonaSchema>[] = [];
  for (const item of rawPersonas) {
    if (item && typeof item === "object") {
      const parsed = ReviewerPersonaSchema.safeParse(item);
      if (parsed.success) {
        validPersonas.push(parsed.data);
      }
    }
  }

  if (validPersonas.length >= 1) {
    return { isValid: true, data: validPersonas, source: "llm" };
  }

  return { isValid: false, source: "heuristic" };
}

/**
 * Validates journal recommendations array per-item with Zod (REQ-EN-05)
 */
export function validateJournalRecommendations(
  rawRecs: any
): SectionValidationResult<JournalRecommendation[]> {
  if (!Array.isArray(rawRecs)) {
    return { isValid: false, source: "heuristic" };
  }

  const validRecs: JournalRecommendation[] = [];
  for (const item of rawRecs) {
    const parsed = JournalRecommendationSchema.safeParse(item);
    if (parsed.success) {
      validRecs.push(parsed.data);
    }
  }

  if (validRecs.length >= 3) {
    return { isValid: true, data: validRecs.slice(0, 3), source: "llm" };
  }

  return { isValid: false, source: "heuristic" };
}
