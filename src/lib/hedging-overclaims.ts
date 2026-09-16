/**
 * Academic Hedging & Causal Overclaim Linguistic Analyzer
 * 
 * Heuristic academic phrasing and epistemic stance lexicon:
 * 1. Detects unhedged superlatives and hyperbole ("revolutionary", "unprecedented", "flawless")
 * 2. Flags strong causal claims ("definitely proves", "establishes direct causality")
 * 3. Identifies observational study designs claiming unwarranted mechanistic causation
 * 4. Computes a heuristic "Epistemic Hedging Index" (0-100) and provides concrete hedged rewrites
 */

export interface OverclaimMatch {
  id: string;
  category: "causal_overclaim" | "superlative_hyperbole" | "unwarranted_certainty" | "correlation_to_causation";
  severity: "critical" | "warning" | "advisory";
  matchedPhrase: string;
  suggestedRewrite: string;
  sentenceSnippet: string;
  explanation: string;
}

export interface HedgingAuditReport {
  totalOverclaimsFound: number;
  criticalCount: number;
  warningCount: number;
  epistemicBalanceIndex: number; // 0 to 100 heuristic indicator (100 = appropriately hedged academic prose)
  matches: OverclaimMatch[];
  summary: string;
  hasCausalVulnerabilities: boolean;
}

// -----------------------------------------------------------------------------
// ACADEMIC LEXICONS & RULES
// -----------------------------------------------------------------------------

interface OverclaimRule {
  pattern: RegExp;
  category: "causal_overclaim" | "superlative_hyperbole" | "unwarranted_certainty" | "correlation_to_causation";
  severity: "critical" | "warning" | "advisory";
  suggestedRewrite: string;
  explanation: string;
}

const OVERCLAIM_RULES: OverclaimRule[] = [
  // 1. Definite proof / irrefutable certainty
  {
    pattern: /\b(?:definitely|conclusively|irrefutably|unequivocally|undeniably)\s+(?:proves|demonstrates|establishes|shows)\b/gi,
    category: "unwarranted_certainty",
    severity: "critical",
    suggestedRewrite: "provides strong empirical evidence indicating",
    explanation: "Empirical science rarely 'conclusively proves' a hypothesis; peer reviewers expect epistemic modesty such as 'provides robust evidence consistent with'.",
  },
  {
    pattern: /\b(?:proves?\s+(?:definitively|beyond\s+(?:all\s+)?doubt|conclusively))\b/gi,
    category: "unwarranted_certainty",
    severity: "critical",
    suggestedRewrite: "strongly supports the hypothesis that",
    explanation: "Claims of proving beyond doubt frequently invite hostile peer review and desk-rejections for lack of scientific rigor.",
  },
  {
    pattern: /\b(?:is\s+the\s+definitive\s+proof)\b/gi,
    category: "unwarranted_certainty",
    severity: "critical",
    suggestedRewrite: "serves as compelling empirical confirmation",
    explanation: "Reframe as compelling confirmation rather than 'definitive proof'.",
  },

  // 2. Unjustified Superlatives & Marketing Buzzwords
  {
    pattern: /\b(?:revolutionary|groundbreaking|paradigm-shifting|game-changing)\s+(?:discovery|finding|breakthrough|advance|technology|method)\b/gi,
    category: "superlative_hyperbole",
    severity: "warning",
    suggestedRewrite: "substantive methodological advance",
    explanation: "Superlative marketing terminology ('revolutionary', 'game-changing') triggers skepticism among handling editors; let the data speak for itself.",
  },
  {
    pattern: /\b(?:unprecedented\s+(?:success|accuracy|performance|efficacy|results?))\b/gi,
    category: "superlative_hyperbole",
    severity: "warning",
    suggestedRewrite: "previously unreported degree of efficacy",
    explanation: "Reviewers often counter 'unprecedented' by citing earlier literature in niche journals.",
  },
  {
    pattern: /\b(?:flawless|perfect|infallible|bulletproof)\s+(?:accuracy|performance|design|methodology)\b/gi,
    category: "superlative_hyperbole",
    severity: "critical",
    suggestedRewrite: "exceptionally robust performance",
    explanation: "No experimental design or statistical classifier is 'flawless'; acknowledging error margins reinforces scholarly credibility.",
  },
  {
    pattern: /\b(?:completely\s+(?:eliminates|eradicates|solves|cures))\b/gi,
    category: "superlative_hyperbole",
    severity: "critical",
    suggestedRewrite: "substantially attenuates or mitigates",
    explanation: "Total eradication claims in biological, clinical, or algorithmic models are red flags for peer review panels.",
  },

  // 3. Causal Overclaim from Associational / Correlational Data
  {
    pattern: /\b(?:proves?\s+(?:that\s+)?(?:a\s+)?direct\s+causality|establishes\s+causality)\b/gi,
    category: "causal_overclaim",
    severity: "critical",
    suggestedRewrite: "suggests a mechanistic link consistent with a causal relationship",
    explanation: "Unless backed by randomized interventional trials or targeted knockout-rescue experiments, direct causality cannot be claimed.",
  },
  {
    pattern: /\b(?:is\s+the\s+(?:sole|only)\s+cause\s+of)\b/gi,
    category: "causal_overclaim",
    severity: "warning",
    suggestedRewrite: "represents a key contributing factor to",
    explanation: "Complex phenotypes and multidimensional systems are rarely driven by a single isolated variable.",
  },
  {
    pattern: /\b(?:demonstrates?\s+(?:that\s+)?[\w\s-]{2,25}\s+causes\s+[\w\s-]{2,25}|demonstrates?\s+(?:direct\s+)?causality)\b/gi,
    category: "causal_overclaim",
    severity: "warning",
    suggestedRewrite: "indicates that manipulation of the independent variable influences the outcome",
    explanation: "Specify the exact operational manipulation and boundary conditions rather than asserting broad causal mechanisms.",
  },

  // 4. Universal Generalizations without Population Sampling
  {
    pattern: /\b(?:universally\s+applicable|applies\s+to\s+all\s+(?:patients|cases|domains|datasets))\b/gi,
    category: "unwarranted_certainty",
    severity: "warning",
    suggestedRewrite: "broadly generalizable across the investigated cohorts",
    explanation: "Universal claims trigger Devil's Advocate critiques regarding boundary conditions, out-of-distribution shifts, and unstudied sub-populations.",
  },
  {
    pattern: /\b(?:without\s+any\s+(?:limitations|drawbacks|exceptions))\b/gi,
    category: "unwarranted_certainty",
    severity: "critical",
    suggestedRewrite: "while subject to specific operational constraints",
    explanation: "Claiming an absence of limitations will immediately lead to reviewer reprimands.",
  }
];

// -----------------------------------------------------------------------------
// AUDIT RUNNER
// -----------------------------------------------------------------------------

/**
 * Scans manuscript text and reports all causal overclaims and unhedged hyperbole
 */
export function runHedgingAndOverclaimAudit(manuscriptText: string): HedgingAuditReport {
  if (!manuscriptText || typeof manuscriptText !== "string") {
    return {
      totalOverclaimsFound: 0,
      criticalCount: 0,
      warningCount: 0,
      epistemicBalanceIndex: 100,
      matches: [],
      summary: "No text available to evaluate.",
      hasCausalVulnerabilities: false,
    };
  }

  const matches: OverclaimMatch[] = [];
  let matchId = 0;

  for (const rule of OVERCLAIM_RULES) {
    let m: RegExpExecArray | null;
    const regex = new RegExp(rule.pattern.source, "gi");

    while ((m = regex.exec(manuscriptText)) !== null) {
      matchId++;
      const start = Math.max(0, m.index - 60);
      const end = Math.min(manuscriptText.length, m.index + m[0].length + 60);
      const sentenceSnippet = manuscriptText.substring(start, end).replace(/\s+/g, " ").trim();

      matches.push({
        id: `overclaim-${matchId}`,
        category: rule.category,
        severity: rule.severity,
        matchedPhrase: m[0],
        suggestedRewrite: rule.suggestedRewrite,
        sentenceSnippet,
        explanation: rule.explanation,
      });
    }
  }

  const criticalCount = matches.filter((m) => m.severity === "critical").length;
  const warningCount = matches.filter((m) => m.severity === "warning").length;
  const totalOverclaimsFound = matches.length;

  // Calculate Epistemic Balance Index (0-100)
  // Deduct 12 pts for each critical overclaim, 5 pts for each warning
  const penalty = (criticalCount * 12) + (warningCount * 5);
  const epistemicBalanceIndex = Math.max(20, Math.min(100, 100 - penalty));

  let summary = "";
  if (totalOverclaimsFound === 0) {
    summary = "Linguistic tone is exemplary: Claims are carefully hedged and calibrated to empirical evidence.";
  } else if (criticalCount > 0) {
    summary = `Flagged ${criticalCount} critical causal overclaim(s) and ${warningCount} promotional hyperbole phrases that risk immediate editorial skepticism.`;
  } else {
    summary = `Detected ${warningCount} phrase(s) with mild promotional hyperbole; replacing them with hedged academic terminology will strengthen scientific credibility.`;
  }

  return {
    totalOverclaimsFound,
    criticalCount,
    warningCount,
    epistemicBalanceIndex,
    matches,
    summary,
    hasCausalVulnerabilities: criticalCount > 0,
  };
}
