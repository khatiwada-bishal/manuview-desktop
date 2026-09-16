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

const StringOrArray = z.union([
  z.array(z.string()),
  z.string().transform((s) => [s]),
]);

export const DimensionScoreSchema = z.object({
  score: z
    .union([z.number(), z.string()])
    .transform((v) => {
      if (typeof v === "number") return Math.min(5, Math.max(1, Math.round(v)));
      const match = String(v).match(/\d+(\.\d+)?/);
      const num = match ? parseFloat(match[0]) : 3;
      return Math.min(5, Math.max(1, Math.round(num)));
    })
    .default(3),
  label: z.string().default("Dimension"),
  verdict: z.string().default("Evaluated"),
  strengths: StringOrArray.default([]),
  vulnerabilities: StringOrArray.default([]),
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
  ).default("B"),
  title: z.string().default("Methodological finding"),
  category: PriorityCategorySchema.catch("Methodology"),
  description: z.string().default("Further empirical clarification needed."),
  location: z.string().default("Manuscript Structure"),
  evidenceAnchor: z.string().default("text: §General"),
  reviewerQuote: z.string().default(""),
  impactAssessment: z.string().optional(),
  actionableFix: z.string().default("Clarify and document this aspect in the revision."),
  suggestedRewrite: z.string().optional(),
  rebuttalStrategy: z.string().default("Address in revision and clarify methodology bounds"),
  expectedEffort: z.string().optional(),
});

export const ReviewerPersonaTypeSchema = z.string().transform((val) => {
  const norm = (val || "").toLowerCase().replace(/[\s\-_]+/g, "_").trim();
  if (norm.includes("method")) return "methods_reviewer" as const;
  if (norm.includes("stat") || norm.includes("quant")) return "statistician" as const;
  if (norm.includes("devil") || norm.includes("adversar") || norm.includes("stress")) return "devils_advocate" as const;
  if (norm.includes("editor") || norm.includes("journal")) return "journal_editor" as const;
  return "domain_expert" as const;
});

export const DecisionRecommendationSchema = z.string().transform((val) => {
  const s = (val || "").toLowerCase();
  if (s.includes("desk")) return "Desk Reject" as const;
  if (s.includes("reject")) return "Reject / Resubmit" as const;
  if (s.includes("minor")) return "Minor Revision" as const;
  return "Major Revision" as const;
});

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

function normalizeDimensionKey(key: string): ScoreDimension | null {
  const norm = (key || "").toLowerCase().replace(/[^a-z0-9_]/g, "_");
  if (norm.includes("orig") || norm.includes("novel")) return "originality";
  if (norm.includes("broad") || norm.includes("interest") || norm.includes("import")) return "broad_interest";
  if (norm.includes("claim") || norm.includes("evidence")) return "claims_vs_evidence";
  if (norm.includes("method") || norm.includes("statist") || norm.includes("sound")) return "methodology";
  if (norm.includes("clar") || norm.includes("present") || norm.includes("writ")) return "clarity";
  if (norm.includes("prior") || norm.includes("ref") || norm.includes("liter") || norm.includes("work")) return "prior_work";
  return null;
}

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

  if (Array.isArray(rawDimensions)) {
    for (const item of rawDimensions) {
      if (item && typeof item === "object") {
        const dimName = item.dimension || item.name || item.label || item.key || "";
        const normKey = normalizeDimensionKey(dimName);
        if (normKey) {
          const parsed = DimensionScoreSchema.safeParse(item);
          if (parsed.success) {
            validDimensions[normKey] = parsed.data;
          }
        }
      }
    }
  } else {
    for (const [key, value] of Object.entries(rawDimensions)) {
      const normKey = isScoreDimension(key) ? key : normalizeDimensionKey(key);
      if (normKey) {
        const parsed = DimensionScoreSchema.safeParse(value);
        if (parsed.success) {
          validDimensions[normKey] = parsed.data;
        }
      }
    }
  }

  const validCount = Object.keys(validDimensions).length;
  if (validCount >= 1) {
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
  const issuesArray = Array.isArray(rawIssues)
    ? rawIssues
    : rawIssues && typeof rawIssues === "object"
    ? Object.values(rawIssues)
    : null;

  if (!issuesArray) {
    return { isValid: false, source: "heuristic" };
  }

  const validIssues: z.infer<typeof PriorityIssueSchema>[] = [];
  for (const item of issuesArray) {
    if (item && typeof item === "object") {
      const normalizedItem = {
        ...item,
        title: item.title || item.issue || item.name || item.heading || "Identified Review Issue",
        description: item.description || item.detail || item.summary || item.critique || item.title || "Requires revision",
        actionableFix: item.actionableFix || item.actionable_fix || item.proposedFix || item.fix || item.solution || item.recommendation || "Address in revision",
        category: item.category || "Methodology",
        priority: item.priority || "B",
        impactAssessment: item.impactAssessment || item.impact_assessment || item.editorialImpact || item.risk || undefined,
        suggestedRewrite: item.suggestedRewrite || item.suggested_rewrite || item.exampleRewrite || item.example_rewrite || undefined,
        rebuttalStrategy: item.rebuttalStrategy || item.rebuttal_strategy || item.rebuttal || undefined,
        expectedEffort: item.expectedEffort || item.expected_effort || item.effort || undefined,
      };
      const parsed = PriorityIssueSchema.safeParse(normalizedItem);
      if (parsed.success) {
        validIssues.push(parsed.data);
      }
    }
  }

  if (validIssues.length >= 1) {
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
  const personasArray = Array.isArray(rawPersonas)
    ? rawPersonas
    : rawPersonas && typeof rawPersonas === "object"
    ? Object.values(rawPersonas)
    : null;

  if (!personasArray) {
    return { isValid: false, source: "heuristic" };
  }

  const validPersonas: z.infer<typeof ReviewerPersonaSchema>[] = [];
  for (const item of personasArray) {
    if (item && typeof item === "object") {
      const normalizedItem = {
        ...item,
        decisionRecommendation: item.decisionRecommendation || item.decision || item.recommendation || "Major Revision",
        majorCritiques: item.majorCritiques || item.critiques || item.major_critiques || [],
        concreteSolutions: item.concreteSolutions || item.solutions || item.concrete_solutions || [],
      };
      const parsed = ReviewerPersonaSchema.safeParse(normalizedItem);
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
  const recsArray = Array.isArray(rawRecs)
    ? rawRecs
    : rawRecs && typeof rawRecs === "object"
    ? Object.values(rawRecs)
    : null;

  if (!recsArray) {
    return { isValid: false, source: "heuristic" };
  }

  const validRecs: JournalRecommendation[] = [];
  for (const item of recsArray) {
    if (item && typeof item === "object") {
      const normalizedItem = {
        ...item,
        journalName: item.journalName || item.name || item.journal || "Recommended Journal",
        scopeRationale: item.scopeRationale || item.rationale || item.reason || item.matchReason || "Scope alignment with manuscript topic.",
      };
      const parsed = JournalRecommendationSchema.safeParse(normalizedItem);
      if (parsed.success) {
        validRecs.push(parsed.data);
      }
    }
  }

  if (validRecs.length >= 1) {
    return { isValid: true, data: validRecs.slice(0, 3), source: "llm" };
  }

  return { isValid: false, source: "heuristic" };
}
