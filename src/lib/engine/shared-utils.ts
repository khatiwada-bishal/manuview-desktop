import { JOURNAL_CATALOG } from "../journals";
import { callLLM, LLMMessage } from "../llm";
import { cleanAndRepairJson } from "../json-repair";
import { ProviderConfig } from "../types";
import {
  DESK_REJECT_SCORE_CEILING,
  MAX_MICRO_REPAIR_PAYLOAD_CHARS,
  MIN_AUTHOR_FAMILY_NAME_LENGTH,
} from "./types";

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return String(err);
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Clamps an overall score to the desk-reject ceiling. */
export function clampDeskRejectScore(score: number): number {
  return Math.min(DESK_REJECT_SCORE_CEILING, score);
}

export function generateReportId(prefix = "rev_"): string {
  try {
    if (typeof crypto !== "undefined") {
      if (typeof crypto.randomUUID === "function") {
        return `${prefix}${crypto.randomUUID().slice(0, 8)}`;
      }
      if (typeof crypto.getRandomValues === "function") {
        const buf = new Uint8Array(4);
        crypto.getRandomValues(buf);
        const hex = Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
        return `${prefix}${hex}`;
      }
    }
  } catch (err: unknown) {
    console.debug("Cryptographic UUID generation failed, using fallback:", getErrorMessage(err));
  }
  return `${prefix}${Math.random().toString(36).substring(2, 10)}`;
}

export function normalizeAuthorName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function parseManuscriptAuthor(authorStr: string): { family: string; initial?: string } | null {
  const clean = normalizeAuthorName(authorStr);
  if (!clean) return null;
  if (clean.includes(",")) {
    const [famPart, givenPart] = clean.split(",", 2).map((s) => s.trim());
    const family = famPart.replace(/[^a-z]/g, "");
    const givenClean = givenPart.replace(/[^a-z]/g, "");
    const initial = givenClean.length > 0 ? givenClean[0] : undefined;
    return family.length >= MIN_AUTHOR_FAMILY_NAME_LENGTH ? { family, initial } : null;
  }
  const tokens = clean.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;
  const familyToken = tokens[tokens.length - 1].replace(/[^a-z]/g, "");
  const givenToken = tokens.length > 1 ? tokens[0].replace(/[^a-z]/g, "") : "";
  const initial = givenToken.length > 0 ? givenToken[0] : undefined;
  return familyToken.length >= MIN_AUTHOR_FAMILY_NAME_LENGTH ? { family: familyToken, initial } : null;
}

export function normalizeJournalName(rawName: string): string {
  if (!rawName) return "";
  let norm = rawName
    .trim()
    .replace(/^["'«“]+|["'»”]+$/g, "")
    .replace(/[.,;:]+$/, "")
    .trim();

  // Check exact or direct match in catalog first
  const lowerTrim = norm.toLowerCase();
  const directMatch = JOURNAL_CATALOG.find((j) => j.name.toLowerCase() === lowerTrim);
  if (directMatch) return directMatch.name;

  // Multi-word compound abbreviations (Must take precedence before single-word abbreviations)
  norm = norm
    .replace(/\bProc\.?\s+(?:Natl?\.?\s+)?Acad\.?\s+Sci\.?(?:\s+USA)?\b/gi, "Proceedings of the National Academy of Sciences")
    .replace(/\bNat\.?\s+Acad\.?\s+Sci\.?\b/gi, "National Academy of Sciences")
    .replace(/\bNatl?\.?\s+Acad\.?\b/gi, "National Academy")
    .replace(/\bJ\.?\s+Am\.?\s+Chem\.?\s+Soc\.?\b/gi, "Journal of the American Chemical Society")
    .replace(/\bPhys\.?\s+Rev\.?\s+Lett\.?\b/gi, "Physical Review Letters")
    .replace(/\bPhys\.?\s+Rev\.?\b/gi, "Physical Review")
    .replace(/\bAnn\.?\s+Intern\.?\s+Med\.?\b/gi, "Annals of Internal Medicine")
    .replace(/\bNew\s+Engl\.?\s+J\.?\s+Med\.?\b/gi, "New England Journal of Medicine")
    .replace(/\bN\.?\s*Engl\.?\s*J\.?\s*Med\.?\b/gi, "New England Journal of Medicine")
    .replace(/\bIEEE\s+Trans\.?\b/gi, "IEEE Transactions on")
    .replace(/\bACM\s+Trans\.?\b/gi, "ACM Transactions on");

  // Disambiguated single-word expansions
  norm = norm
    .replace(/\bNatl\b\.?/gi, "National")
    .replace(/\bNat\b\.?(?!\s*Acad)/gi, "Nature")
    .replace(/\bJ\b\.(?=\s|[A-Z]|$)/gi, "Journal")
    .replace(/\bInt\b\.?/gi, "International")
    .replace(/\bAm\b\.?/gi, "American")
    .replace(/\bSoc\b\.?/gi, "Society")
    .replace(/\bMed\b\.?/gi, "Medicine")
    .replace(/\bRev\b\.?/gi, "Review")
    .replace(/\bSci\b\.?/gi, "Science")
    .replace(/\bProc\b\.?/gi, "Proceedings")
    .replace(/\bBiol\b\.?/gi, "Biological")
    .replace(/\bChem\b\.?/gi, "Chemistry")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();

  const minorWords = new Set(["of", "the", "and", "in", "on", "for", "with", "a", "an", "&"]);
  const capitalized = norm
    .split(" ")
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && minorWords.has(lower)) return lower;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");

  const catalogMatch = JOURNAL_CATALOG.find((j) => j.name.toLowerCase() === capitalized.toLowerCase());
  return catalogMatch ? catalogMatch.name : capitalized;
}

/**
 * Calls the LLM expecting a JSON payload, parses it, and — if the initial parse
 * fails on a substantive response — runs a single automated micro-repair pass
 * (a targeted follow-up call that fixes JSON syntax) before giving up.
 */
export async function callLLMForJson<T>(
  messages: LLMMessage[],
  config: ProviderConfig,
  opts?: {
    onChunk?: (delta: string, accumulated: string) => void;
    onRepairStart?: () => void;
    maxRepairChars?: number;
  }
): Promise<T> {
  const raw = await callLLM(messages, config, opts?.onChunk, { jsonMode: true });
  try {
    return cleanAndRepairJson<T>(raw);
  } catch (parseErr: unknown) {
    console.warn("JSON repair could not parse initial LLM output:", getErrorMessage(parseErr));
    if (!raw || raw.trim().length <= 100) {
      throw new Error("AI response was received but could not be parsed as valid JSON.");
    }

    opts?.onRepairStart?.();
    const max = opts?.maxRepairChars ?? MAX_MICRO_REPAIR_PAYLOAD_CHARS;
    const payload = raw.length <= max ? raw : raw.slice(0, max);
    const repairMessages: LLMMessage[] = [
      {
        role: "system",
        content:
          "You are an automated JSON syntax repair engine. The provided text contains a valid JSON payload that was truncated, has unescaped quotes, missing closing braces, or syntax errors. Fix all syntax errors and output ONLY the valid JSON object. Do not include markdown codeblocks or conversational text.",
      },
      {
        role: "user",
        content: `Repair this malformed JSON and return valid JSON:\n\n${payload}`,
      },
    ];
    const repairedRaw = await callLLM(repairMessages, config, undefined, { jsonMode: true });
    return cleanAndRepairJson<T>(repairedRaw);
  }
}
