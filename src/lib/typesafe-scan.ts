/**
 * TypeSafe structured document scan.
 *
 * Runs a fan-out of atomic Choice / Score / Noul questions over a manuscript in
 * a single System One request, then composes the typed answers into diagnostic
 * signals and an overall readiness score — in code, per TypeSafe's design
 * philosophy (decompose broad judgments into atomic questions, combine with
 * logic you control). See https://docs.typesafe.ai/concepts/how-to-build-with-system-one
 */

import {
  systemOne,
  choice,
  score,
  noul,
  type TypeSafeQuestion,
  type TypeSafeAnswer,
  type ChoiceAnswer,
  type ScoreAnswer,
  type NoulAnswer,
  type SystemOneResponse,
  type TypeSafeUsage,
  type TypeSafeEntryObject,
} from "./typesafe";

/** Max characters of manuscript text sent as state. Jev's budget is 32k tokens
 * for state + longest question; ~48k chars keeps us comfortably inside it while
 * covering the substance of most manuscripts. */
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

export interface TypeSafeScanResult {
  model: string;
  targetJournal?: string;
  journalScope?: string;
  documentType: string;
  isAcademic: boolean;
  readiness: number; // 0–100 composite computed in code
  readinessLabel: string;
  signals: ScanSignal[];
  groups: ScanGroup[];
  flags: ScanSignal[]; // signals that warrant attention (bad tone or low confidence)
  usage?: TypeSafeUsage;
  raw: SystemOneResponse;
}

// ---------------------------------------------------------------------------
// Question specification
// ---------------------------------------------------------------------------

type QuestionKind = "choice" | "score" | "noul";

interface BaseSpec {
  id: string;
  group: string;
  label: string;
  kind: QuestionKind;
  question: TypeSafeQuestion;
  /** Relative importance in the composite readiness score. 0 = excluded. */
  weight: number;
}

interface NoulSpec extends BaseSpec {
  kind: "noul";
  /** Whether "yes" (high probability) is the good outcome. */
  goodWhenYes: boolean;
}

interface ScoreSpec extends BaseSpec {
  kind: "score";
  /** Whether a higher level is the good outcome. */
  goodWhenHigh: boolean;
  levels: number;
}

interface ChoiceSpec extends BaseSpec {
  kind: "choice";
  /** Optional per-option tone mapping for interpretation. */
  toneByOption?: Record<string, SignalTone>;
}

type ScanSpec = NoulSpec | ScoreSpec | ChoiceSpec;

/**
 * The diagnostic battery. Each question is atomic and points at the manuscript
 * text held in `state.manuscript`. Weights drive the composite readiness score;
 * detection/classification questions carry weight 0 (informational).
 */
const SCAN_SPECS: ScanSpec[] = [
  // --- Screening -----------------------------------------------------------
  {
    id: "document_type",
    group: "Screening",
    label: "Document type",
    kind: "choice",
    weight: 0,
    question: choice(
      "What kind of document is `manuscript`?",
      {
        research_article: "Primary empirical study reporting original results",
        review: "Literature review, survey, or meta-analysis",
        case_report: "A single case or small case series",
        methods: "A methods, protocol, or software/tool paper",
        preprint_other: "Academic writing that does not fit the categories above",
        non_academic: "Not an academic manuscript (e.g. blog, memo, marketing)",
      }
    ),
    toneByOption: { non_academic: "bad" },
  },
  {
    id: "is_academic",
    group: "Screening",
    label: "Reads as a research manuscript",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    question: noul("Is `manuscript` a scholarly research manuscript intended for journal submission?", {
      true: "Structured academic writing with scholarly intent",
      false: "Non-academic or non-manuscript content",
    }),
  },
  {
    id: "desk_reject_risk",
    group: "Screening",
    label: "Desk-reject risk",
    kind: "score",
    weight: 3,
    goodWhenHigh: false,
    levels: 4,
    question: score(
      "How likely is an editor to desk-reject `manuscript` before peer review, based only on presentation, completeness, and scope?",
      [
        "Low risk — complete and well presented",
        "Some risk — minor gaps an editor might tolerate",
        "High risk — clear gaps likely to trigger a desk reject",
        "Severe risk — obvious blockers (out of scope, missing core sections)",
      ]
    ),
  },

  // --- Structure & completeness -------------------------------------------
  {
    id: "has_abstract",
    group: "Structure & completeness",
    label: "Abstract present",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    question: noul("Does `manuscript` contain an abstract that summarizes the work?"),
  },
  {
    id: "has_methods",
    group: "Structure & completeness",
    label: "Methods section",
    kind: "noul",
    weight: 2,
    goodWhenYes: true,
    question: noul("Does `manuscript` describe the methods or materials used to produce its results?"),
  },
  {
    id: "has_results",
    group: "Structure & completeness",
    label: "Results reported",
    kind: "noul",
    weight: 2,
    goodWhenYes: true,
    question: noul("Does `manuscript` report concrete results, findings, or outputs?"),
  },
  {
    id: "states_limitations",
    group: "Structure & completeness",
    label: "Limitations stated",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    question: noul("Does `manuscript` explicitly discuss limitations of the work?", {
      true: "A limitations discussion is present",
      false: "No limitations are acknowledged",
    }),
  },
  {
    id: "data_availability",
    group: "Structure & completeness",
    label: "Data/code availability",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    question: noul("Does `manuscript` include a data-availability or code-availability statement?"),
  },
  {
    id: "ethics_statement",
    group: "Structure & completeness",
    label: "Ethics / consent statement",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    question: noul(
      "Does `manuscript` include an ethics approval, consent, or a clear statement that ethics review was not applicable?",
      {
        true: "Ethics/consent addressed, or explicitly not applicable",
        false: "Human/animal or sensitive work with no ethics statement",
      }
    ),
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
    question: score(
      "How reproducible are the methods in `manuscript` from the detail provided?",
      [
        "Not reproducible — critical detail missing",
        "Partially — major gaps remain",
        "Mostly — a knowledgeable reader could largely reproduce it",
        "Fully — parameters, data, and procedure are specified",
      ]
    ),
  },
  {
    id: "stats_complete",
    group: "Methodology & rigor",
    label: "Statistical reporting complete",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    question: noul(
      "Where `manuscript` reports quantitative results, are the statistics reported completely (e.g. effect sizes, tests, and uncertainty such as CIs or p-values)?",
      {
        true: "Statistics are reported with appropriate detail, or no statistics are needed",
        false: "Quantitative claims lack the supporting statistics",
      }
    ),
  },
  {
    id: "sample_justified",
    group: "Methodology & rigor",
    label: "Sample / dataset justified",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    question: noul("Does `manuscript` justify its sample size, dataset, or study population?"),
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
    question: score(
      "How well are the central claims in `manuscript` supported by the evidence it presents?",
      [
        "Unsupported — claims outrun the evidence",
        "Weakly supported — notable gaps",
        "Adequately supported",
        "Strongly supported — conclusions follow from the evidence",
      ]
    ),
  },
  {
    id: "overclaims_causality",
    group: "Claims & evidence",
    label: "Causal over-claiming",
    kind: "noul",
    weight: 2,
    goodWhenYes: false,
    question: noul(
      "Does `manuscript` claim a causal effect where the design only supports a correlational or associational conclusion?",
      {
        true: "Causal language exceeds what the design supports",
        false: "Causal claims are appropriately hedged or justified",
      }
    ),
  },
  {
    id: "citations_present",
    group: "Claims & evidence",
    label: "Prior work cited",
    kind: "noul",
    weight: 1,
    goodWhenYes: true,
    question: noul("Does `manuscript` cite prior work to situate its contribution?"),
  },
  {
    id: "unsupported_generalization",
    group: "Claims & evidence",
    label: "Over-generalized conclusions",
    kind: "noul",
    weight: 1,
    goodWhenYes: false,
    question: noul(
      "Do the conclusions in `manuscript` generalize beyond the population, setting, or data actually studied?",
      {
        true: "Conclusions are generalized beyond the evidence",
        false: "Conclusions stay within the scope of the study",
      }
    ),
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
    question: score("How clear and readable is the writing in `manuscript`?", [
      "Hard to follow",
      "Uneven — some sections unclear",
      "Generally clear",
      "Polished and precise",
    ]),
  },
  {
    id: "title_informative",
    group: "Writing & presentation",
    label: "Title is informative",
    kind: "noul",
    weight: 0.5,
    goodWhenYes: true,
    question: noul("Does the title of `manuscript` clearly convey what the work is about?"),
  },
  {
    id: "structure_coherent",
    group: "Writing & presentation",
    label: "Logical structure",
    kind: "noul",
    weight: 0.5,
    goodWhenYes: true,
    question: noul("Does `manuscript` follow a coherent structure that a reader can navigate?"),
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
    question: score(
      "Based on how `manuscript` frames its contribution, how novel does the work appear?",
      [
        "Incremental — little beyond existing work",
        "Modest novelty",
        "Clear novel contribution",
        "Substantial, clearly differentiated advance",
      ]
    ),
  },
  {
    id: "contribution_stated",
    group: "Novelty & contribution",
    label: "Contribution stated explicitly",
    kind: "noul",
    weight: 0.5,
    goodWhenYes: true,
    question: noul("Does `manuscript` state its contribution or main claim explicitly?"),
  },
];

// ---------------------------------------------------------------------------
// Interpretation
// ---------------------------------------------------------------------------

function interpretNoul(spec: NoulSpec, answer: NoulAnswer): ScanSignal {
  const p = clamp01(answer.noul);
  const yesIsGood = spec.goodWhenYes;
  // Goodness from the model's perspective (probability of the desirable outcome).
  const goodProb = yesIsGood ? p : 1 - p;
  const needsReview = Math.abs(p - 0.5) < NOUL_UNCERTAIN_BAND;

  let tone: SignalTone;
  if (needsReview) tone = "warn";
  else if (goodProb >= 0.66) tone = "good";
  else if (goodProb <= 0.34) tone = "bad";
  else tone = "warn";

  return {
    id: spec.id,
    group: spec.group,
    label: spec.label,
    kind: "noul",
    value: p,
    display: `${Math.round(p * 100)}% yes`,
    tone,
    needsReview,
  };
}

function interpretScore(spec: ScoreSpec, answer: ScoreAnswer): ScanSignal {
  const levels = spec.levels;
  const idx = answer.score;
  const norm = levels > 1 ? clamp01(idx / (levels - 1)) : 0;
  const goodness = spec.goodWhenHigh ? norm : 1 - norm;
  const confidence = answer.confidence;
  const needsReview = confidence < REVIEW_CONFIDENCE_FLOOR;

  let tone: SignalTone;
  if (goodness >= 0.66) tone = "good";
  else if (goodness <= 0.34) tone = "bad";
  else tone = "warn";
  if (needsReview && tone === "good") tone = "warn";

  const nearest = Math.round(clamp(idx, 0, levels - 1));
  const levelLabel = answer.legend?.[String(nearest)] ?? `Level ${nearest}`;

  return {
    id: spec.id,
    group: spec.group,
    label: spec.label,
    kind: "score",
    value: idx,
    display: `${levelLabel} (${idx.toFixed(2)}/${levels - 1})`,
    confidence,
    tone,
    detail: levelLabel,
    needsReview,
  };
}

function interpretChoice(spec: ChoiceSpec, answer: ChoiceAnswer): ScanSignal {
  const confidence = answer.confidence;
  const needsReview = confidence < REVIEW_CONFIDENCE_FLOOR;
  const tone: SignalTone = spec.toneByOption?.[answer.choice] ?? "info";
  return {
    id: spec.id,
    group: spec.group,
    label: spec.label,
    kind: "choice",
    value: 0,
    display: prettyOption(answer.choice),
    confidence,
    tone: needsReview && tone === "info" ? "warn" : tone,
    needsReview,
  };
}

/** Normalized 0–1 "goodness" of a weighted signal, for the composite score. */
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
  return 0.5;
}

function readinessLabel(pct: number): string {
  if (pct >= 80) return "Submission-ready";
  if (pct >= 65) return "Minor revisions";
  if (pct >= 45) return "Needs work";
  return "Major concerns";
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export interface RunScanOptions {
  model?: string;
  apiKey?: string;
  targetJournal?: string;
  journalScope?: string;
  signal?: AbortSignal;
  /** Extra structured context merged into the state (e.g. target journal). */
  context?: TypeSafeEntryObject;
}

/**
 * Runs the full structured scan against a manuscript in one TypeSafe request.
 */
export async function runTypeSafeScan(
  manuscriptText: string,
  options: RunScanOptions = {}
): Promise<TypeSafeScanResult> {
  const text = (manuscriptText || "").trim();
  if (!text) {
    throw new Error("No manuscript text to scan. Paste or load a document first.");
  }

  // Preserve both the opening (Abstract, Methods) and the closing (Limitations, Ethics, Data Availability)
  const HEAD_CHARS = 36_000;
  const TAIL_CHARS = 12_000;
  let truncated = text;
  if (text.length > MAX_STATE_CHARS) {
    truncated =
      text.slice(0, HEAD_CHARS) +
      "\n\n[... intermediate manuscript content omitted for evaluation budget ...]\n\n" +
      text.slice(-TAIL_CHARS);
  }

  const state: TypeSafeEntryObject = { manuscript: truncated };
  if (text.length > MAX_STATE_CHARS) {
    state.note =
      "Manuscript was windowed to fit single-pass budget. Opening sections (Abstract/Intro/Methods) and closing declarations (Discussion/Limitations/Ethics/Data availability) were fully preserved.";
  }
  if (options.targetJournal) {
    state.target_journal = options.targetJournal;
  }
  if (options.journalScope) {
    state.target_journal_scope = options.journalScope;
  }
  if (options.context && Object.keys(options.context).length > 0) {
    state.context = options.context;
  }

  const activeSpecs: ScanSpec[] = [...SCAN_SPECS];
  if (options.targetJournal && options.targetJournal.trim()) {
    activeSpecs.unshift(
      {
        id: "journal_scope_fit",
        group: "Journal Alignment",
        label: "Aims & Scope Fit",
        kind: "choice",
        weight: 3,
        question: choice(
          `Does \`manuscript\` fit the topical scope, scientific discipline, and editorial aims of \`${options.targetJournal}\`?`,
          {
            strong_core: `Strong core fit for ${options.targetJournal}`,
            peripheral: `Borderline or multidisciplinary fit for ${options.targetJournal}`,
            out_of_scope: `Clearly out of scope for ${options.targetJournal}`,
          }
        ),
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
        question: score(
          `Does the methodological and analytical depth in \`manuscript\` meet the publication standards of \`${options.targetJournal}\`?`,
          [
            "Below typical journal standards",
            "Marginal — could face referee skepticism",
            "Appropriate — matches typical papers in this journal",
            "High rigor — exceeds typical standards",
          ]
        ),
      }
    );
  }

  const questions: Record<string, TypeSafeQuestion> = {};
  for (const spec of activeSpecs) {
    questions[spec.id] = spec.question;
  }

  const response = await systemOne({
    state,
    questions,
    model: options.model,
    apiKey: options.apiKey,
    signal: options.signal,
  });

  const signals: ScanSignal[] = [];
  let weightedSum = 0;
  let weightTotal = 0;

  for (const spec of activeSpecs) {
    const answer = response.answers[spec.id] as TypeSafeAnswer | undefined;
    if (!answer) continue;
    let signal: ScanSignal | null = null;
    if (spec.kind === "noul" && answer.type === "noul") {
      signal = interpretNoul(spec, answer);
    } else if (spec.kind === "score" && answer.type === "score") {
      signal = interpretScore(spec, answer);
    } else if (spec.kind === "choice" && answer.type === "choice") {
      signal = interpretChoice(spec, answer);
    }
    if (!signal) continue;
    signals.push(signal);
    if (spec.weight > 0) {
      weightedSum += spec.weight * signalGoodness(spec, signal);
      weightTotal += spec.weight;
    }
  }

  const readiness = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) : 0;

  // Group signals preserving spec order.
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

  return {
    model: response.model,
    targetJournal: options.targetJournal,
    journalScope: options.journalScope,
    documentType: docTypeSignal?.display ?? "Unknown",
    isAcademic: academicSignal ? academicSignal.value >= 0.5 : true,
    readiness,
    readinessLabel: readinessLabel(readiness),
    signals,
    groups,
    flags,
    usage: response.usage,
    raw: response,
  };
}

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

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
