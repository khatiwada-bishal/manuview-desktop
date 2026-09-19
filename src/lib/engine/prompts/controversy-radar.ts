import type { CounterEvidenceProfile, ParsedManuscript } from "../../types";

/**
 * System prompt to extract central empirical or theoretical claims from an academic manuscript.
 */
export const EXTRACT_CORE_CLAIMS_PROMPT = `
You are an expert scientific epistemologist and senior academic referee.
Your objective is to isolate the top 3 central empirical or theoretical claims from the provided manuscript text (focusing on Abstract, Results, and Discussion).

CRITICAL CONSTRAINTS:
1. Do not invent claims. Every extracted claim must be directly grounded in the author's stated findings.
2. Focus on claims with potential controversy, strong causal assertions, or novel theoretical mechanisms.
3. Return output strictly as JSON with array of string claims: {"claims": ["claim 1", "claim 2", "claim 3"]}
`;

/**
 * System prompt to evaluate scholarly disputes, rival theories, and counter-evidence for extracted claims.
 */
export const EVALUATE_DISPUTE_AND_COUNTER_EVIDENCE_PROMPT = `
You are an adversarial peer reviewer ("Reviewer 2") and leading domain specialist.
Given the manuscript's central claims, evaluate them against known scientific literature controversies, alternative mechanistic pathways, and unmeasured confounders.

For each claim:
1. Determine dispute status: "heavily_disputed", "emerging_debate", or "consensus".
2. Identify the primary opposing school of thought, rival theory, or alternative mechanism.
3. Formulate a pointed "Reviewer 2 Objection" (the exact tough objection an adversarial referee will raise during peer review).
4. Craft a "Preemptive Rebuttal Snippet": an authentic, line-level scholarly paragraph that the authors can paste into their Discussion section to preemptively diffuse the objection.

Return output strictly as a JSON object:
{
  "profiles": [
    {
      "claim": "string",
      "disputedStatus": "heavily_disputed" | "emerging_debate" | "consensus",
      "opposingSchoolOfThought": "string",
      "reviewer2Objection": "string",
      "preemptiveRebuttalSnippet": "string"
    }
  ]
}
`;

/**
 * Deterministic heuristic generator for counter-evidence profiles.
 * Runs in offline/local mode to guarantee that authors always receive grounded,
 * adversarial dispute analysis even when unassisted by cloud LLMs.
 */
export function generateCounterEvidenceProfiles(
  manuscript: ParsedManuscript,
  discipline = "Multidisciplinary Research"
): CounterEvidenceProfile[] {
  const profiles: CounterEvidenceProfile[] = [];
  const text = manuscript.rawText || "";
  const title = manuscript.title || "the investigated phenomenon";

  // 1. Extract candidate claims from abstract / empirical cues
  const candidateClaims: string[] = [];

  if (manuscript.abstract && manuscript.abstract.length > 30) {
    const sentences = manuscript.abstract
      .replace(/\r?\n+/g, " ")
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    const keySentence = sentences.find((s) =>
      /\b(we find|we demonstrate|results indicate|we show|findings reveal|we establish|proves that|leads to)\b/i.test(s)
    );
    if (keySentence) {
      candidateClaims.push(keySentence);
    } else if (sentences.length > 1) {
      candidateClaims.push(sentences[sentences.length - 1]);
    }
  }

  // Look for causal assertions
  const causalAssertions = manuscript.empiricalCues?.causalAssertions || [];
  for (const assertion of causalAssertions.slice(0, 2)) {
    if (!candidateClaims.includes(assertion)) {
      candidateClaims.push(assertion);
    }
  }

  // Fallback claim if text is brief
  if (candidateClaims.length === 0) {
    candidateClaims.push(`The core empirical relationship reported regarding ${title.slice(0, 70)}.`);
  }

  // Build grounded counter-evidence profiles
  for (let idx = 0; idx < Math.min(candidateClaims.length, 3); idx++) {
    const rawClaim = candidateClaims[idx];
    const isCausal = /\b(causes?|leads to|drives|determines|proves|impacts?)\b/i.test(rawClaim);
    const isObservational = !/\b(randomized|double-blind|rct|in vitro|counterfactual)\b/i.test(text);

    let disputedStatus: "heavily_disputed" | "emerging_debate" | "consensus" = "emerging_debate";
    let opposingSchool = `Alternative mechanistic frameworks and unobserved confounders in ${discipline}`;
    let reviewer2Objection = "";
    let rebuttalSnippet = "";

    if (isCausal && isObservational) {
      disputedStatus = "heavily_disputed";
      opposingSchool = "Reverse Causality & Omitted Endogeneity Models";
      reviewer2Objection = `The manuscript asserts a direct causal link in "${rawClaim.slice(0, 80)}...", yet the non-randomized observational structure fails to isolate this from simultaneous reverse causation or omitted cohort selection bias.`;
      rebuttalSnippet = `While our empirical observations align with a directional relationship, we acknowledge that unmeasured confounders or simultaneous selection mechanisms could account for a proportion of the observed variance. Future longitudinal and counterfactual investigations are required to definitively isolate the causal pathway from reverse-directional feedback loops.`;
    } else if (idx === 0) {
      disputedStatus = "emerging_debate";
      opposingSchool = `Equifinality & Boundary-Condition Perspectives in ${discipline}`;
      reviewer2Objection = `While the authors demonstrate significant effects under their chosen operationalization, competing studies in ${discipline} observe diminished or null effects when testing across broader cross-sectional strata.`;
      rebuttalSnippet = `We emphasize that our findings should be interpreted within the contextual boundary conditions of the sampled population. Divergences from earlier benchmark literature likely reflect differences in operational parameter definitions, measurement resolution, or baseline demographic stratification rather than fundamental theoretical contradictions.`;
    } else {
      disputedStatus = "consensus";
      opposingSchool = `Standard Baseline and Null-Model Benchmarks`;
      reviewer2Objection = `The incremental novelty of this assertion over canonical domain models requires more explicit empirical demarcation and sensitivity benchmarking.`;
      rebuttalSnippet = `In contrast to canonical baseline assumptions that treat these dynamics as static, our data reveal substantial dynamic variability across conditions. This empirical nuance refines rather than overturns prevailing models, providing an operational bridge between competing theoretical perspectives.`;
    }

    profiles.push({
      claim: rawClaim,
      disputedStatus,
      opposingSchoolOfThought: opposingSchool,
      reviewer2Objection,
      preemptiveRebuttalSnippet: rebuttalSnippet,
    });
  }

  return profiles;
}
