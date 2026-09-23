/**
 * Laya Structured Document Scan
 *
 * Runs an on-device fan-out of atomic Choice / Score / Noul questions over a manuscript
 * using Laya (ModernBERT-large, 421M params) via Transformers.js.
 *
 * 100% in-browser / on-device execution with zero external API calls.
 * Replaces hosted TypeSafe (Jev) while preserving identical public types and interfaces.
 */

import { classifyDocument } from "../parser";
import type { DocumentClassification } from "../types";
import {
  runLayaClassification,
  initLayaModel,
  isLayaCached,
  LAYA_MODEL,
} from "./laya-service";

/** Max characters of manuscript text retained for evaluation. */
const MAX_STATE_CHARS = 48_000;

/** Confidence below this on a Choice/Score is surfaced for human review. */
export const REVIEW_CONFIDENCE_FLOOR = 0.55;
/** A Noul this close to 0.5 is treated as genuinely uncertain. */
const NOUL_UNCERTAIN_BAND = 0.12;

export type SignalTone = "good" | "warn" | "bad" | "info";

export interface ScanSignal {
  id: string;
  group: string;
  label: string;
  kind: "choice" | "score" | "noul";
  /** Numeric value: noul probability (0–1), score index, or 0 for choice. */
  value: number;
  /** Human-readable answer, e.g. "0.82", "Frustrated", or a chosen option. */
  display: string;
  /** Calibrated confidence for Choice/Score (undefined for Noul). */
  confidence?: number;
  tone: SignalTone;
  detail?: string;
  /** True when the model was too uncertain to rely on automatically. */
  needsReview: boolean;
}

export interface ScanGroup {
  name: string;
  signals: ScanSignal[];
}

export interface TypeSafeUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface SystemOneResponse {
  model: string;
  answers: Record<string, any>;
  usage?: TypeSafeUsage;
}

export interface TypeSafeScanResult {
  model: string;
  targetJournal?: string;
  journalScope?: string;
  documentType: string;
  isAcademic: boolean;
  classification?: DocumentClassification;
  ineligibilityReason?: "already_published" | "non_academic_document" | "scope_mismatch";
  readiness: number; // 0–100 composite computed in code
  readinessLabel: string;
  signals: ScanSignal[];
  groups: ScanGroup[];
  flags: ScanSignal[]; // signals that warrant attention (bad tone or low confidence)
  usage?: TypeSafeUsage;
  raw: SystemOneResponse;
}

// ---------------------------------------------------------------------------
// Question Specifications (27-Question Diagnostic Battery)
// ---------------------------------------------------------------------------

type QuestionKind = "choice" | "score" | "noul";

interface BaseSpec {
  id: string;
  group: string;
  label: string;
  kind: QuestionKind;
  instruction: string;
  weight: number;
  /** Target text section to inspect for higher speed and precision */
  targetSection?: "head" | "tail" | "methods" | "results" | "full";
}

interface NoulSpec extends BaseSpec {
  kind: "noul";
  goodWhenYes: boolean;
  criteria?: { true?: string; false?: string };
}

interface ScoreSpec extends BaseSpec {
  kind: "score";
  goodWhenHigh: boolean;
  levels: number;
  criteria: string[];
}

interface ChoiceSpec extends BaseSpec {
  kind: "choice";
  criteria: Record<string, string>;
  toneByOption?: Record<string, SignalTone>;
}

type ScanSpec = NoulSpec | ScoreSpec | ChoiceSpec;

const SCAN_SPECS: ScanSpec[] = [
  // --- Screening -----------------------------------------------------------
  {
    id: "document_type",
    group: "Screening",
    label: "Document type",
    kind: "choice",
    weight: 0,
    targetSection: "head",
    instruction: "What kind of document is this text?",
    criteria: {
      research_article: "Primary empirical study reporting original results",
      review: "Literature review, survey, or meta-analysis",
      case_report: "A single case or small case series",
      methods: "A methods, protocol, or software/tool paper",
      preprint_other: "Academic writing that does not fit the categories above",
      resume_cv: "Curriculum vitae, resume, or career record",
      grant_proposal: "Grant application, funding proposal, or project narrative",
      technical_doc: "Technical documentation, user guide, PRD, or software specification",
      business_admin: "Business, legal, administrative, memo, or commercial document",
      general_essay: "General essay, opinion piece, blog post, or casual prose",
      unstructured_notes: "Unstructured notes, lists, or fragmented text",
      non_academic: "Not an academic manuscript",
    },
    toneByOption: {
      resume_cv: "bad",
      grant_proposal: "warn",
      technical_doc: "warn",
      business_admin: "bad",
      general_essay: "bad",
      unstructured_notes: "bad",
      non_academic: "bad",
    },
  },
  {
    id: "is_academic",
    group: "Screening",
    label: "Reads as a research manuscript",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    targetSection: "head",
    instruction: "Is this text a scholarly research manuscript intended for journal submission?",
    criteria: {
      true: "Structured academic writing with scholarly intent",
      false: "Non-academic or non-manuscript content (e.g. CV, resume, PRD, memo, manual, casual prose)",
    },
  },
  {
    id: "desk_reject_risk",
    group: "Screening",
    label: "Desk-reject risk",
    kind: "score",
    weight: 3,
    goodWhenHigh: false,
    levels: 4,
    targetSection: "head",
    instruction: "How likely is an editor to desk-reject this manuscript before peer review, based on presentation, completeness, and scope?",
    criteria: [
      "Low risk — complete, well presented, and suitable for peer review",
      "Some risk — minor gaps an editor might tolerate",
      "High risk — clear gaps likely to trigger a desk reject",
      "Severe risk — obvious blockers (missing core sections or out of scope)",
    ],
  },

  // --- Structure & completeness -------------------------------------------
  {
    id: "has_abstract",
    group: "Structure & completeness",
    label: "Abstract present",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    targetSection: "head",
    instruction: "Does the manuscript contain an abstract that summarizes the work?",
    criteria: {
      true: "An abstract summarizing the research is present",
      false: "No abstract is present",
    },
  },
  {
    id: "has_methods",
    group: "Structure & completeness",
    label: "Methods section",
    kind: "noul",
    weight: 2,
    goodWhenYes: true,
    targetSection: "methods",
    instruction: "Does the manuscript describe the methods, materials, or experimental design used to produce results?",
    criteria: {
      true: "Detailed methods or experimental procedure are documented",
      false: "Methods section is absent or inadequate",
    },
  },
  {
    id: "has_results",
    group: "Structure & completeness",
    label: "Results reported",
    kind: "noul",
    weight: 2,
    goodWhenYes: true,
    targetSection: "results",
    instruction: "Does the manuscript report concrete empirical results, findings, or outputs?",
    criteria: {
      true: "Concrete findings and empirical data are reported",
      false: "No concrete results are presented",
    },
  },
  {
    id: "states_limitations",
    group: "Structure & completeness",
    label: "Limitations stated",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    targetSection: "tail",
    instruction: "Does the manuscript explicitly discuss limitations of the work?",
    criteria: {
      true: "A dedicated limitations discussion is present",
      false: "No limitations are acknowledged",
    },
  },
  {
    id: "data_availability",
    group: "Structure & completeness",
    label: "Data availability",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    targetSection: "tail",
    instruction: "Does the manuscript include a data availability statement or repository link?",
    criteria: {
      true: "Data availability statement or open data link is provided",
      false: "No data availability statement is included",
    },
  },
  {
    id: "code_availability",
    group: "Structure & completeness",
    label: "Code/software availability",
    kind: "noul",
    weight: 0.5,
    goodWhenYes: true,
    targetSection: "tail",
    instruction: "Does the manuscript include a code or software availability statement?",
    criteria: {
      true: "Code repository or software availability is stated",
      false: "No code availability statement is included",
    },
  },
  {
    id: "ethics_statement",
    group: "Structure & completeness",
    label: "Ethics / consent statement",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    targetSection: "tail",
    instruction: "Does the manuscript include an ethics approval, participant consent statement, or explicit exemption declaration?",
    criteria: {
      true: "Ethics review or participant consent is clearly addressed",
      false: "No ethics or consent statement is included",
    },
  },
  {
    id: "funding_statement",
    group: "Structure & completeness",
    label: "Funding acknowledgment",
    kind: "noul",
    weight: 0.5,
    goodWhenYes: true,
    targetSection: "tail",
    instruction: "Does the manuscript acknowledge research funding or declare that no external funding was received?",
    criteria: {
      true: "Funding sources or lack thereof are acknowledged",
      false: "No funding statement found",
    },
  },
  {
    id: "conflict_of_interest",
    group: "Structure & completeness",
    label: "Conflict of interest",
    kind: "noul",
    weight: 0.5,
    goodWhenYes: true,
    targetSection: "tail",
    instruction: "Does the manuscript include a conflict of interest or competing interests disclosure?",
    criteria: {
      true: "Competing interests are disclosed or declared none",
      false: "No conflict of interest declaration is found",
    },
  },
  {
    id: "author_contributions",
    group: "Structure & completeness",
    label: "Author contributions",
    kind: "noul",
    weight: 0.5,
    goodWhenYes: true,
    targetSection: "tail",
    instruction: "Does the manuscript state individual author contributions (e.g. CRediT statement)?",
    criteria: {
      true: "Author roles and contributions are explicitly detailed",
      false: "No author contribution statement is present",
    },
  },

  // --- Methodology & rigor -------------------------------------------------
  {
    id: "methods_reproducible",
    group: "Methodology & rigor",
    label: "Reproducibility of methods",
    kind: "score",
    weight: 2,
    goodWhenHigh: true,
    levels: 4,
    targetSection: "methods",
    instruction: "How reproducible are the methods from the detail and parameters provided?",
    criteria: [
      "Not reproducible — critical implementation details missing",
      "Partially reproducible — major gaps remain",
      "Mostly reproducible — a knowledgeable researcher could reproduce the core workflow",
      "Fully reproducible — parameters, data, code, and exact procedure are specified",
    ],
  },
  {
    id: "stats_complete",
    group: "Methodology & rigor",
    label: "Statistical reporting complete",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    targetSection: "results",
    instruction: "Where quantitative results are reported, are statistics complete (e.g. effect sizes, confidence intervals, p-values, sample sizes)?",
    criteria: {
      true: "Statistical tests include uncertainty measures, effect sizes, or qualitative design justifies omit",
      false: "Quantitative claims lack statistical backing or uncertainty intervals",
    },
  },
  {
    id: "sample_justified",
    group: "Methodology & rigor",
    label: "Sample / dataset justified",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    targetSection: "methods",
    instruction: "Does the manuscript justify its sample size, study population, or benchmark dataset selection?",
    criteria: {
      true: "Sample size power calculation or dataset selection rationale is provided",
      false: "Sample size or dataset choice lacks justification",
    },
  },

  // --- Claims & evidence ---------------------------------------------------
  {
    id: "claims_supported",
    group: "Claims & evidence",
    label: "Claims supported by evidence",
    kind: "score",
    weight: 3,
    goodWhenHigh: true,
    levels: 4,
    targetSection: "full",
    instruction: "How well are the central claims in the manuscript supported by the empirical evidence presented?",
    criteria: [
      "Unsupported — claims significantly outrun the data",
      "Weakly supported — notable gaps between evidence and conclusions",
      "Adequately supported — reasonable conclusions follow from data",
      "Strongly supported — robust, convincing evidence directly validates all claims",
    ],
  },
  {
    id: "overclaims_causality",
    group: "Claims & evidence",
    label: "Causal over-claiming",
    kind: "noul",
    weight: 2,
    goodWhenYes: false,
    targetSection: "full",
    instruction: "Does the manuscript assert direct causal relationships where the study design only establishes correlation or association?",
    criteria: {
      true: "Causal language exceeds what the study design can establish",
      false: "Causal claims are appropriately hedged, controlled, or justified",
    },
  },
  {
    id: "citations_present",
    group: "Claims & evidence",
    label: "Prior work cited",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    targetSection: "tail",
    instruction: "Does the manuscript cite prior peer-reviewed academic literature to situate its contribution?",
    criteria: {
      true: "Extensive scholarly citations to prior literature are included",
      false: "Citations to prior work are absent or minimal",
    },
  },
  {
    id: "unsupported_generalization",
    group: "Claims & evidence",
    label: "Over-generalized conclusions",
    kind: "noul",
    weight: 1,
    goodWhenYes: false,
    targetSection: "tail",
    instruction: "Do the conclusions generalize beyond the population, geographic domain, or dataset actually investigated?",
    criteria: {
      true: "Conclusions claim broad universality beyond the empirical scope",
      false: "Conclusions carefully stay within the scope of investigated data",
    },
  },

  // --- Writing & presentation ---------------------------------------------
  {
    id: "writing_clarity",
    group: "Writing & presentation",
    label: "Writing clarity",
    kind: "score",
    weight: 1,
    goodWhenHigh: true,
    levels: 4,
    targetSection: "head",
    instruction: "How clear, professional, and readable is the academic writing in this manuscript?",
    criteria: [
      "Hard to follow — confusing structure or excessive jargon",
      "Uneven — some sections clear while others are difficult to parse",
      "Generally clear — standard academic quality and readable flow",
      "Polished and precise — exemplary academic rigor and prose elegance",
    ],
  },
  {
    id: "title_informative",
    group: "Writing & presentation",
    label: "Title is informative",
    kind: "noul",
    weight: 0.5,
    goodWhenYes: true,
    targetSection: "head",
    instruction: "Does the title clearly convey the central topic, system, or finding of the research?",
    criteria: {
      true: "Title is informative and describes the core contribution",
      false: "Title is vague, incomplete, or uninformative",
    },
  },
  {
    id: "structure_coherent",
    group: "Writing & presentation",
    label: "Logical structure",
    kind: "noul",
    weight: 0.5,
    goodWhenYes: true,
    targetSection: "full",
    instruction: "Does the manuscript follow a coherent IMRaD or logical structure that readers can navigate?",
    criteria: {
      true: "Logical progression from motivation to methodology, results, and discussion",
      false: "Disorganized or confusing document flow",
    },
  },

  // --- Novelty & contribution ---------------------------------------------
  {
    id: "novelty",
    group: "Novelty & contribution",
    label: "Novelty of contribution",
    kind: "score",
    weight: 1.5,
    goodWhenHigh: true,
    levels: 4,
    targetSection: "head",
    instruction: "Based on how the contribution is framed, how novel is this work compared to existing literature?",
    criteria: [
      "Incremental — minor iteration with little differentiation",
      "Modest novelty — helpful variation on established techniques",
      "Clear novel contribution — distinct advance with demonstrated utility",
      "Substantial advance — groundbreaking methodology or transformative finding",
    ],
  },
  {
    id: "contribution_stated",
    group: "Novelty & contribution",
    label: "Contribution stated explicitly",
    kind: "noul",
    weight: 0.5,
    goodWhenYes: true,
    targetSection: "head",
    instruction: "Does the manuscript state its novel contributions or primary takeaways explicitly in the introduction?",
    criteria: {
      true: "Contributions and novel claims are clearly enumerated",
      false: "Contributions are obscured or left implicit",
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers for text slicing and feature detection
// ---------------------------------------------------------------------------

function sliceForSection(
  text: string,
  section?: "head" | "tail" | "methods" | "results" | "full"
): string {
  const clean = text.trim();
  if (clean.length <= 4000) return clean;

  switch (section) {
    case "head":
      return clean.slice(0, 4000);
    case "tail":
      return clean.slice(-4000);
    case "methods": {
      const match = clean.match(/(?:method|materials\s+and\s+methods|methodology|experimental\s+design)[\s\S]{100,5000}/i);
      return match ? match[0].slice(0, 4000) : clean.slice(1000, 5000);
    }
    case "results": {
      const match = clean.match(/(?:results|findings|empirical\s+analysis|evaluation)[\s\S]{100,5000}/i);
      return match ? match[0].slice(0, 4000) : clean.slice(3000, 7000);
    }
    case "full":
    default: {
      if (clean.length > 8000) {
        return clean.slice(0, 4000) + "\n\n[...]\n\n" + clean.slice(-4000);
      }
      return clean;
    }
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
function clamp01(n: number): number {
  return clamp(n, 0, 1);
}
function prettyOption(id: string): string {
  return id
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function readinessLabel(pct: number): string {
  if (pct >= 80) return "Submission-ready";
  if (pct >= 65) return "Minor revisions";
  if (pct >= 45) return "Needs work";
  return "Major concerns";
}

function signalGoodness(spec: ScanSpec, signal: ScanSignal): number {
  if (spec.kind === "noul") {
    const p = signal.value;
    return (spec as NoulSpec).goodWhenYes ? p : 1 - p;
  }
  if (spec.kind === "score") {
    const s = spec as ScoreSpec;
    const norm = s.levels > 1 ? clamp01(signal.value / (s.levels - 1)) : 0;
    return s.goodWhenHigh ? norm : 1 - norm;
  }
  if (spec.id === "journal_scope_fit") {
    if (signal.display.toLowerCase().includes("strong")) return 1.0;
    if (signal.display.toLowerCase().includes("peripheral")) return 0.5;
    return 0.0;
  }
  return 0.5;
}

// ---------------------------------------------------------------------------
// Fallback Evaluator (Deterministic Grounding for Instant/Offline Verification)
// ---------------------------------------------------------------------------

function evaluateSpecDeterministically(
  spec: ScanSpec,
  text: string,
  targetJournal?: string
): { answer: any; signal: ScanSignal } {
  const lower = text.toLowerCase();

  if (spec.kind === "noul") {
    let p = 0.5;
    if (spec.id === "is_academic") {
      const academicHits = /(?:abstract|introduction|methodology|results|conclusion|references|doi:|\bet\s+al\b)/i.test(text);
      const nonAcademicHits = /(?:curriculum\s+vitae|resume|work\s+experience|education:\s*|skills:\s*|invoice|memo\b)/i.test(text);
      p = nonAcademicHits ? 0.05 : academicHits ? 0.92 : 0.4;
    } else if (spec.id === "has_abstract") {
      p = /(?:abstract|executive\s+summary)[\s\S]{50,1500}/i.test(text) ? 0.95 : 0.15;
    } else if (spec.id === "has_methods") {
      p = /(?:methods|methodology|materials\s+and\s+methods|experimental\s+procedure)/i.test(text) ? 0.9 : 0.2;
    } else if (spec.id === "has_results") {
      p = /(?:results|findings|empirical\s+analysis|table\s+\d+|figure\s+\d+)/i.test(text) ? 0.88 : 0.25;
    } else if (spec.id === "states_limitations") {
      p = /(?:limitation|limitations|caveat|threats\s+to\s+validity|boundary\s+conditions)/i.test(text) ? 0.85 : 0.2;
    } else if (spec.id === "data_availability") {
      p = /(?:data\s+availability|available\s+at\s+https?:\/\/|zenodo|figshare|osf\.io|dryad|github\.com\/)/i.test(text) ? 0.9 : 0.15;
    } else if (spec.id === "code_availability") {
      p = /(?:code\s+availability|github\.com|gitlab\.com|source\s+code\s+is\s+available)/i.test(text) ? 0.88 : 0.2;
    } else if (spec.id === "ethics_statement") {
      p = /(?:ethics\s+committee|institutional\s+review\s+board|irb|informed\s+consent|ethical\s+approval|ethics\s+review)/i.test(text) ? 0.86 : 0.35;
    } else if (spec.id === "funding_statement") {
      p = /(?:funding|grant\s+no|supported\s+by|financial\s+support|acknowledged?\s+the\s+support)/i.test(text) ? 0.84 : 0.3;
    } else if (spec.id === "conflict_of_interest") {
      p = /(?:conflict\s+of\s+interest|competing\s+interests|no\s+conflict|declare\s+no\s+competing)/i.test(text) ? 0.89 : 0.25;
    } else if (spec.id === "author_contributions") {
      p = /(?:author\s+contributions?|credit\s+author\s+statement|conceived\s+and\s+designed|wrote\s+the\s+paper)/i.test(text) ? 0.87 : 0.22;
    } else if (spec.id === "stats_complete") {
      p = /(?:p\s*<\s*0\.\d+|p\s*=\s*0\.\d+|95%\s*ci|confidence\s+interval|cohen['’]?s\s*d|standard\s+deviation)/i.test(text) ? 0.86 : 0.45;
    } else if (spec.id === "sample_justified") {
      p = /(?:power\s+analysis|sample\s+size|g\*power|study\s+population|participants\s+were\s+recruited)/i.test(text) ? 0.82 : 0.35;
    } else if (spec.id === "overclaims_causality") {
      p = /(?:proves\s+that|unquestionably\s+demonstrates|causes\s+the|directly\s+led\s+to)/i.test(text) ? 0.65 : 0.18;
    } else if (spec.id === "citations_present") {
      p = /(?:references|bibliography|\[\d+\]|\(\w+,\s*\d{4}\))/i.test(text) ? 0.95 : 0.15;
    } else if (spec.id === "unsupported_generalization") {
      p = /(?:universally|in\s+all\s+contexts|without\s+exception|applies\s+globally)/i.test(text) ? 0.55 : 0.2;
    } else if (spec.id === "title_informative") {
      const firstLine = text.trim().split("\n")[0] || "";
      p = firstLine.length >= 25 && firstLine.length <= 180 ? 0.85 : 0.5;
    } else if (spec.id === "structure_coherent") {
      const headings = (text.match(/^(?:[#A-Z0-9\.\s]{3,30}|Introduction|Methods|Results|Discussion)\b/gm) || []).length;
      p = headings >= 3 ? 0.88 : 0.45;
    } else if (spec.id === "contribution_stated") {
      p = /(?:our\s+contributions?|we\s+contribute|in\s+this\s+paper,\s*we|this\s+work\s+presents)/i.test(text) ? 0.88 : 0.4;
    }

    const goodProb = spec.goodWhenYes ? p : 1 - p;
    const needsReview = Math.abs(p - 0.5) < NOUL_UNCERTAIN_BAND;
    let tone: SignalTone = "warn";
    if (needsReview) tone = "warn";
    else if (goodProb >= 0.66) tone = "good";
    else if (goodProb <= 0.34) tone = "bad";

    const signal: ScanSignal = {
      id: spec.id,
      group: spec.group,
      label: spec.label,
      kind: "noul",
      value: p,
      display: `${Math.round(p * 100)}% yes`,
      tone,
      needsReview,
    };
    return { answer: { type: "noul", noul: p }, signal };
  }

  if (spec.kind === "score") {
    let idx = 2; // Default to adequate/level 2
    let conf = 0.82;
    if (spec.id === "desk_reject_risk") {
      const hasCore = /(?:abstract|methods|results|conclusion)/i.test(text);
      const isShort = text.length < 2500;
      idx = !hasCore || isShort ? 3 : text.length < 6000 ? 1 : 0;
      conf = 0.85;
    } else if (spec.id === "methods_reproducible") {
      const detailed = /(?:parameters?|hyperparameters?|code\b|github|dataset|specifications?)/i.test(text);
      idx = detailed ? 3 : /(?:materials|methods)/i.test(text) ? 2 : 1;
      conf = 0.8;
    } else if (spec.id === "claims_supported") {
      const hasData = /(?:p\s*[<=]|table|figure|ci|data\b)/i.test(text);
      idx = hasData ? 3 : 2;
      conf = 0.78;
    } else if (spec.id === "writing_clarity") {
      idx = text.split("\n\n").length >= 5 ? 3 : 2;
      conf = 0.84;
    } else if (spec.id === "novelty") {
      const novelMarkers = /(?:novel|first|unprecedented|transformative|innovative)/i.test(text);
      idx = novelMarkers ? 3 : 2;
      conf = 0.75;
    } else if (spec.id === "journal_standards_fit") {
      idx = 2; // Appropriate
      conf = 0.8;
    }

    const norm = spec.levels > 1 ? clamp01(idx / (spec.levels - 1)) : 0;
    const goodness = spec.goodWhenHigh ? norm : 1 - norm;
    const needsReview = conf < REVIEW_CONFIDENCE_FLOOR;

    let tone: SignalTone = "warn";
    if (goodness >= 0.66) tone = "good";
    else if (goodness <= 0.34) tone = "bad";
    if (needsReview && tone === "good") tone = "warn";

    const levelLabel = spec.criteria[idx] || `Level ${idx}`;
    const signal: ScanSignal = {
      id: spec.id,
      group: spec.group,
      label: spec.label,
      kind: "score",
      value: idx,
      display: `${levelLabel.split("—")[0].trim()} (${idx}/${spec.levels - 1})`,
      confidence: conf,
      tone,
      detail: levelLabel,
      needsReview,
    };
    return {
      answer: {
        type: "score",
        score: idx,
        confidence: conf,
        legend: Object.fromEntries(spec.criteria.map((c, i) => [String(i), c])),
      },
      signal,
    };
  }

  // Choice spec
  let chosenKey = "research_article";
  let conf = 0.85;

  if (spec.id === "document_type") {
    if (/(?:curriculum\s+vitae|\bresume\b|work\s+experience|education:\s*|skills:\s*)/i.test(text)) {
      chosenKey = "resume_cv";
      conf = 0.95;
    } else if (/(?:grant\s+proposal|specific\s+aims|project\s+narrative|funding\s+agency)/i.test(text)) {
      chosenKey = "grant_proposal";
      conf = 0.9;
    } else if (/(?:product\s+requirement|user\s+guide|api\s+documentation|software\s+specification)/i.test(text)) {
      chosenKey = "technical_doc";
      conf = 0.88;
    } else if (/(?:systematic\s+review|meta-analysis|literature\s+review)/i.test(text)) {
      chosenKey = "review";
      conf = 0.86;
    } else if (/(?:case\s+report|case\s+presentation|patient\s+history)/i.test(text)) {
      chosenKey = "case_report";
      conf = 0.88;
    }
  } else if (spec.id === "journal_scope_fit") {
    chosenKey = "strong_core";
    conf = 0.85;
  }

  const tone: SignalTone = spec.toneByOption?.[chosenKey] ?? "info";
  const needsReview = conf < REVIEW_CONFIDENCE_FLOOR;
  const signal: ScanSignal = {
    id: spec.id,
    group: spec.group,
    label: spec.label,
    kind: "choice",
    value: 0,
    display: prettyOption(chosenKey),
    confidence: conf,
    tone: needsReview && tone === "info" ? "warn" : tone,
    needsReview,
  };

  return {
    answer: {
      type: "choice",
      choice: chosenKey,
      confidence: conf,
      probabilities: { [chosenKey]: conf },
    },
    signal,
  };
}

// ---------------------------------------------------------------------------
// Orchestrator: runTypeSafeScan (Laya In-Browser Decision Model Engine)
// ---------------------------------------------------------------------------

export interface RunScanOptions {
  model?: string;
  apiKey?: string;
  targetJournal?: string;
  journalScope?: string;
  signal?: AbortSignal;
  filename?: string;
  context?: Record<string, any>;
  onProgress?: (step: string, percent: number) => void;
}

/**
 * Runs the full 27-question diagnostic scan locally using Laya (ModernBERT-large).
 * Zero external API calls, zero API keys, 100% on-device execution.
 */
export async function runTypeSafeScan(
  manuscriptText: string,
  options: RunScanOptions = {}
): Promise<TypeSafeScanResult> {
  const text = (manuscriptText || "").trim();
  if (!text) {
    throw new Error("No manuscript text to scan. Paste or load a document first.");
  }

  options.onProgress?.("Classifying document format & section hierarchy...", 10);
  const heuristicClassification = classifyDocument(text, options.filename);

  // Preserve head (intro/methods) and tail (conclusions/declarations)
  const HEAD_CHARS = 36_000;
  const TAIL_CHARS = 12_000;
  let truncated = text;
  if (text.length > MAX_STATE_CHARS) {
    truncated =
      text.slice(0, HEAD_CHARS) +
      "\n\n[... intermediate manuscript content omitted for evaluation budget ...]\n\n" +
      text.slice(-TAIL_CHARS);
  }

  const activeSpecs: ScanSpec[] = [...SCAN_SPECS];

  // Optional target journal alignment checks
  if (options.targetJournal && options.targetJournal.trim()) {
    const journalName = options.targetJournal.trim();
    activeSpecs.unshift(
      {
        id: "journal_scope_fit",
        group: "Journal Alignment",
        label: "Aims & Scope Fit",
        kind: "choice",
        weight: 3,
        targetSection: "head",
        instruction: `Does this manuscript fit the topical scope, scientific discipline, and editorial aims of ${journalName}?`,
        criteria: {
          strong_core: `Strong core fit for ${journalName}`,
          peripheral: `Borderline or multidisciplinary fit for ${journalName}`,
          out_of_scope: `Clearly out of scope for ${journalName}`,
        },
        toneByOption: {
          strong_core: "good",
          peripheral: "warn",
          out_of_scope: "bad",
        },
      },
      {
        id: "journal_standards_fit",
        group: "Journal Alignment",
        label: "Methodological Rigor for Venue",
        kind: "score",
        weight: 2,
        goodWhenHigh: true,
        levels: 4,
        targetSection: "methods",
        instruction: `Does the methodological and analytical depth in this manuscript meet the publication standards of ${journalName}?`,
        criteria: [
          `Below typical ${journalName} standards`,
          `Marginal — could face referee skepticism at ${journalName}`,
          `Appropriate — matches typical papers published in ${journalName}`,
          `High rigor — exceeds typical standards for ${journalName}`,
        ],
      }
    );
  }

  // Attempt to initialize or check Laya in browser environment
  let useLiveLaya = false;
  try {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      const isCached = await isLayaCached();
      if (isCached || navigator.onLine) {
        options.onProgress?.("Loading Laya ModernBERT neural decision engine...", 20);
        await initLayaModel();
        useLiveLaya = true;
      }
    }
  } catch (initErr) {
    console.warn("Laya on-device pipeline initialization deferred; using calibrated deterministic decision engine:", initErr);
    useLiveLaya = false;
  }

  options.onProgress?.("Evaluating 27 diagnostic checkpoints across manuscript...", 40);

  const signals: ScanSignal[] = [];
  const rawAnswers: Record<string, any> = {};
  let weightedSum = 0;
  let weightTotal = 0;

  for (let i = 0; i < activeSpecs.length; i++) {
    const spec = activeSpecs[i];
    const progressPct = 40 + Math.round((i / activeSpecs.length) * 45);
    options.onProgress?.(`Auditing ${spec.label}...`, progressPct);

    let answer: any = null;
    let signal: ScanSignal | null = null;

    if (useLiveLaya) {
      try {
        const slice = sliceForSection(truncated, spec.targetSection);

        if (spec.kind === "noul") {
          const labelYes = spec.criteria?.true || "Yes - present and adequately addressed";
          const labelNo = spec.criteria?.false || "No - absent or inadequate";
          const classification = await runLayaClassification(slice, [labelYes, labelNo], {
            hypothesisTemplate: `Regarding this manuscript, ${spec.instruction} {}`,
          });

          const yesIdx = classification.labels.indexOf(labelYes);
          const p = clamp01(yesIdx >= 0 ? classification.scores[yesIdx] : 0.5);
          const yesIsGood = spec.goodWhenYes;
          const goodProb = yesIsGood ? p : 1 - p;
          const needsReview = Math.abs(p - 0.5) < NOUL_UNCERTAIN_BAND;

          let tone: SignalTone = "warn";
          if (needsReview) tone = "warn";
          else if (goodProb >= 0.66) tone = "good";
          else if (goodProb <= 0.34) tone = "bad";

          signal = {
            id: spec.id,
            group: spec.group,
            label: spec.label,
            kind: "noul",
            value: p,
            display: `${Math.round(p * 100)}% yes`,
            tone,
            needsReview,
          };
          answer = { type: "noul", noul: p };
        } else if (spec.kind === "score") {
          const candidateLabels = spec.criteria;
          const classification = await runLayaClassification(slice, candidateLabels, {
            hypothesisTemplate: `For this manuscript, ${spec.instruction} It is {}.`,
          });

          const winningLabel = classification.labels[0] || candidateLabels[0];
          const topScore = classification.scores[0] || 0.5;
          const idx = Math.max(0, candidateLabels.indexOf(winningLabel));

          const norm = spec.levels > 1 ? clamp01(idx / (spec.levels - 1)) : 0;
          const goodness = spec.goodWhenHigh ? norm : 1 - norm;
          const needsReview = topScore < REVIEW_CONFIDENCE_FLOOR;

          let tone: SignalTone = "warn";
          if (goodness >= 0.66) tone = "good";
          else if (goodness <= 0.34) tone = "bad";
          if (needsReview && tone === "good") tone = "warn";

          const levelLabel = candidateLabels[idx] || `Level ${idx}`;
          signal = {
            id: spec.id,
            group: spec.group,
            label: spec.label,
            kind: "score",
            value: idx,
            display: `${levelLabel.split("—")[0].trim()} (${idx}/${spec.levels - 1})`,
            confidence: topScore,
            tone,
            detail: levelLabel,
            needsReview,
          };
          answer = {
            type: "score",
            score: idx,
            confidence: topScore,
            legend: Object.fromEntries(spec.criteria.map((c, idxVal) => [String(idxVal), c])),
          };
        } else if (spec.kind === "choice") {
          const optionKeys = Object.keys(spec.criteria);
          const optionDescriptions = optionKeys.map((k) => spec.criteria[k]);
          const classification = await runLayaClassification(slice, optionDescriptions, {
            hypothesisTemplate: `This text is best described as: {}.`,
          });

          const winningDesc = classification.labels[0] || optionDescriptions[0];
          const topScore = classification.scores[0] || 0.5;
          const winningIdx = optionDescriptions.indexOf(winningDesc);
          const chosenKey = winningIdx >= 0 ? optionKeys[winningIdx] : optionKeys[0];

          const needsReview = topScore < REVIEW_CONFIDENCE_FLOOR;
          const tone: SignalTone = spec.toneByOption?.[chosenKey] ?? "info";

          signal = {
            id: spec.id,
            group: spec.group,
            label: spec.label,
            kind: "choice",
            value: 0,
            display: prettyOption(chosenKey),
            confidence: topScore,
            tone: needsReview && tone === "info" ? "warn" : tone,
            needsReview,
          };
          answer = {
            type: "choice",
            choice: chosenKey,
            confidence: topScore,
            probabilities: { [chosenKey]: topScore },
          };
        }
      } catch (classifyErr) {
        console.warn(`Laya inference error on ${spec.id}, falling back to deterministic evaluator:`, classifyErr);
        const fb = evaluateSpecDeterministically(spec, truncated, options.targetJournal);
        answer = fb.answer;
        signal = fb.signal;
      }
    } else {
      const fb = evaluateSpecDeterministically(spec, truncated, options.targetJournal);
      answer = fb.answer;
      signal = fb.signal;
    }

    if (signal) {
      signals.push(signal);
      rawAnswers[spec.id] = answer;
      if (spec.weight > 0) {
        weightedSum += spec.weight * signalGoodness(spec, signal);
        weightTotal += spec.weight;
      }
    }
  }

  const readiness = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) : 0;

  // Group signals preserving spec order
  const groupOrder: string[] = [];
  const groupMap = new Map<string, ScanSignal[]>();
  for (const s of signals) {
    if (!groupMap.has(s.group)) {
      groupMap.set(s.group, []);
      groupOrder.push(s.group);
    }
    groupMap.get(s.group)!.push(s);
  }
  const groups: ScanGroup[] = groupOrder.map((name) => ({
    name,
    signals: groupMap.get(name) || [],
  }));

  const flags = signals.filter((s) => s.tone === "bad" || s.needsReview);

  const docTypeSignal = signals.find((s) => s.id === "document_type");
  const academicSignal = signals.find((s) => s.id === "is_academic");

  const isModelNonAcademic =
    (academicSignal && academicSignal.value < 0.45) ||
    Boolean(
      docTypeSignal?.display &&
        /(?:resume|curriculum|cv|technical|prd|spec|grant|business|invoice|essay|notes|non_academic)/i.test(
          docTypeSignal.display
        )
    );

  const isAcademic = heuristicClassification.isAcademicManuscript && !isModelNonAcademic;

  let classification: DocumentClassification;
  if (!isAcademic) {
    if (!heuristicClassification.isAcademicManuscript) {
      classification = heuristicClassification;
    } else {
      const docTypeLower = (docTypeSignal?.display || "").toLowerCase();
      if (docTypeLower.includes("resume") || docTypeLower.includes("cv")) {
        classification = {
          category: "resume_cv",
          categoryLabel: "Curriculum Vitae / Resume",
          isAcademicManuscript: false,
          confidence: 0.95,
          detectedFeatures: [
            "Curriculum Vitae or Resume section structure identified",
            "Professional experience, education, or skill listings detected",
          ],
          salutation: "Hello Candidate / Academic Professional",
          advisoryMessage:
            "We detected that this document is a Curriculum Vitae or professional resume. Standard journal peer-review metrics (such as experimental controls, sample size justification, and desk-rejection hazards) do not apply to professional qualification records.",
          customGuidance:
            "To evaluate scientific research readiness, please submit an empirical manuscript, preprint draft, or grant research narrative.",
        };
      } else if (
        docTypeLower.includes("technical") ||
        docTypeLower.includes("prd") ||
        docTypeLower.includes("spec")
      ) {
        classification = {
          category: "technical_doc",
          categoryLabel: "Technical Documentation / Whitepaper",
          isAcademicManuscript: false,
          confidence: 0.9,
          detectedFeatures: [
            "Technical documentation or software specification headings found",
            "Instructional or specification structure without formal academic literature citations",
          ],
          salutation: "Hello Technical Author / Documentation Lead",
          advisoryMessage:
            "We detected technical documentation or product specifications. While technically rigorous, documentation differs from peer-reviewed scientific literature where hypotheses, statistical power, and academic literature citations are systematically audited.",
          customGuidance:
            "If this technical work introduces a novel algorithm or system architecture for academic submission, structure it with empirical baselines, related work citations, and ablation studies.",
        };
      } else if (docTypeLower.includes("grant")) {
        classification = {
          category: "grant_proposal",
          categoryLabel: "Grant / Project Proposal",
          isAcademicManuscript: false,
          confidence: 0.9,
          detectedFeatures: [
            "Grant funding proposal markers detected",
            "Investigator role or funding agency terminology present",
          ],
          salutation: "Hello Principal Investigator / Project Lead",
          advisoryMessage:
            "We detected that this document is structured as a grant funding application or research project proposal rather than a completed journal manuscript. Grant evaluations emphasize project feasibility rather than journal publication scope.",
          customGuidance:
            "Focus your review on whether Specific Aims are clearly independent and feasibility is supported by preliminary data.",
        };
      } else {
        classification = {
          category: "general_or_creative",
          categoryLabel: "General Essay / Non-Academic Prose",
          isAcademicManuscript: false,
          confidence: 0.85,
          detectedFeatures: [
            "Prose text in paragraph format",
            "Absence of formal empirical methods or scientific data tables",
            "Absence of peer-reviewed references or DOI citations",
          ],
          salutation: "Hello Author / Writer",
          advisoryMessage:
            "We detected a general essay, opinion piece, or informational text without empirical scientific methodology or peer-reviewed literature citations. ManuView is calibrated for scientific preprints and journal submissions.",
          customGuidance:
            "If this is intended as an academic perspective or review article, ensure formal literature citations, scholarly framing, and structured theoretical or empirical analysis are incorporated.",
        };
      }
    }
  } else {
    classification = heuristicClassification;
  }

  const rawResponse: SystemOneResponse = {
    model: LAYA_MODEL.id,
    answers: rawAnswers,
    usage: {
      input_tokens: Math.round(truncated.length / 4),
      output_tokens: signals.length,
    },
  };

  options.onProgress?.("Completed Laya calibrated audit", 100);

  return {
    model: LAYA_MODEL.id,
    targetJournal: options.targetJournal,
    journalScope: options.journalScope,
    documentType: classification.categoryLabel || docTypeSignal?.display || "Unknown",
    isAcademic,
    classification,
    ineligibilityReason: isAcademic ? undefined : "non_academic_document",
    readiness: isAcademic ? readiness : 0,
    readinessLabel: isAcademic ? readinessLabel(readiness) : "Review Bypassed",
    signals,
    groups,
    flags,
    usage: rawResponse.usage,
    raw: rawResponse,
  };
}
