/**
 * TypeSafe AI (Jev / System One) client.
 *
 * TypeSafe is NOT a text-generating LLM. It evaluates a `state` against a map of
 * typed `questions` (Choice / Score / Noul) and returns typed decisions with
 * calibrated probabilities and confidence. See https://docs.typesafe.ai/api
 *
 * This module is intentionally standalone from `llm.ts` (which handles chat/JSON
 * text-generation providers) because the request/response contract is different.
 */

import { getSecureApiKey } from "./secureStorage";
import { isDesktopApp } from "./desktop";
import { getEnv, sanitizeErrorMessage } from "./llm";

export const TYPESAFE_PROVIDER = "typesafe" as const;
export const TYPESAFE_BASE_URL = "https://api.typesafe.ai/v1";
export const TYPESAFE_DEFAULT_MODEL = "jev-latest";
/** Requests time out after this many ms of no response. */
const TYPESAFE_TIMEOUT_MS = 60_000;

// ---------------------------------------------------------------------------
// Request / response types (mirrors the documented /v1/systemone contract)
// ---------------------------------------------------------------------------

/** Anything TypeSafe accepts for `state`, `instructions`, and `criteria` values. */
export type TypeSafeEntry = string | number | boolean | null | TypeSafeEntryObject | TypeSafeEntry[];
export interface TypeSafeEntryObject {
  [key: string]: TypeSafeEntry;
}

export interface ChoiceQuestion {
  type: "choice";
  instructions: TypeSafeEntry;
  /** option id -> description (null when the id is self-explanatory). Max 255. */
  criteria: Record<string, TypeSafeEntry>;
}

export interface ScoreQuestion {
  type: "score";
  instructions: TypeSafeEntry;
  /** Ordered level descriptions, lowest first. 2–10 levels. */
  criteria: TypeSafeEntry[];
}

export interface NoulQuestion {
  type: "noul";
  instructions: TypeSafeEntry;
  /** Optional clarification of what a yes / no means. */
  criteria?: { true?: TypeSafeEntry; false?: TypeSafeEntry };
}

export type TypeSafeQuestion = ChoiceQuestion | ScoreQuestion | NoulQuestion;

export interface ChoiceAnswer {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}
export interface ScoreAnswer {
  type: "score";
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
}
export interface NoulAnswer {
  type: "noul";
  noul: number;
}
export type TypeSafeAnswer = ChoiceAnswer | ScoreAnswer | NoulAnswer;

export interface TypeSafeUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface SystemOneResponse {
  model: string;
  answers: Record<string, TypeSafeAnswer>;
  usage?: TypeSafeUsage;
}

export interface TypeSafeModelInfo {
  name: string;
  description?: string;
  release_date?: string;
}

// ---------------------------------------------------------------------------
// Question builders (ergonomic helpers)
// ---------------------------------------------------------------------------

export function choice(
  instructions: TypeSafeEntry,
  criteria: Record<string, TypeSafeEntry>
): ChoiceQuestion {
  return { type: "choice", instructions, criteria };
}

export function score(instructions: TypeSafeEntry, criteria: TypeSafeEntry[]): ScoreQuestion {
  return { type: "score", instructions, criteria };
}

export function noul(
  instructions: TypeSafeEntry,
  criteria?: { true?: TypeSafeEntry; false?: TypeSafeEntry }
): NoulQuestion {
  return { type: "noul", instructions, criteria };
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

interface TransportResult {
  ok: boolean;
  status: number;
  body: string;
}

/**
 * Performs the HTTP request. In the native desktop app the call is routed
 * through the Rust `call_llm_native` command, which bypasses the webview CSP
 * (api.typesafe.ai is not in `connect-src`) and browser CORS. In web-preview
 * mode it falls back to a direct fetch.
 */
async function typesafeTransport(
  url: string,
  method: "GET" | "POST",
  headers: Record<string, string>,
  body: string | null,
  signal?: AbortSignal
): Promise<TransportResult> {
  if (isDesktopApp()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const res = await invoke<{ status: number; body: string; ok: boolean }>("call_llm_native", {
        url,
        method,
        headers,
        body: body ?? null,
      });
      return { ok: res.ok, status: res.status, body: res.body };
    } catch (err) {
      // Surface native errors (e.g. SSRF allow-list) rather than silently
      // falling through to a fetch the CSP will also block.
      console.warn("TypeSafe native IPC call failed, falling back to fetch:", err);
    }
  }

  const res = await fetch(url, { method, headers, body: body ?? undefined, signal });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

// ---------------------------------------------------------------------------
// Credential resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the TypeSafe API key: explicit arg -> OS keychain / secure store ->
 * TYPESAFE_API_KEY environment variable.
 */
export async function resolveTypeSafeKey(explicit?: string): Promise<string> {
  const direct = (explicit || "").trim();
  if (direct) return direct;
  try {
    const secure = await getSecureApiKey(TYPESAFE_PROVIDER);
    if (secure && secure.trim()) return secure.trim();
  } catch (err) {
    console.warn("Failed to read secure TypeSafe key:", err);
  }
  const envKey = (
    getEnv("TYPESAFE_API_KEY") ||
    getEnv("VITE_TYPESAFE_API_KEY") ||
    getEnv("TYPESAFE_COMMUNITY_KEY") ||
    getEnv("VITE_TYPESAFE_COMMUNITY_KEY") ||
    ""
  ).trim();
  if (envKey) return envKey;

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("manuview_typesafe_community_key");
      if (stored && stored.trim()) return stored.trim();
    } catch {}
  }
  return "";
}

export async function hasTypeSafeKeyAvailable(): Promise<boolean> {
  const key = await resolveTypeSafeKey();
  return Boolean(key && key.trim().length > 0);
}

function translateStatusError(status: number, rawBody: string): string {
  let detail = "";
  try {
    const parsed = JSON.parse(rawBody);
    detail = parsed?.error?.message || parsed?.message || parsed?.detail || "";
  } catch {
    detail = rawBody ? rawBody.slice(0, 300) : "";
  }
  const safe = sanitizeErrorMessage(detail);
  switch (status) {
    case 401:
      return "TypeSafe rejected the API key (401). Check your key in AI Settings → TypeSafe.";
    case 422:
      return `TypeSafe could not process the request (422). ${safe || "A question or the state failed validation."}`;
    case 429:
      return "TypeSafe rate limit reached (429). Wait a moment and try again.";
    case 529:
      return "TypeSafe is temporarily overloaded (529). Retry shortly.";
    default:
      return `TypeSafe API error (${status})${safe ? `: ${safe}` : ""}`;
  }
}

// ---------------------------------------------------------------------------
// Core API calls
// ---------------------------------------------------------------------------

export interface SystemOneParams {
  state: TypeSafeEntry;
  questions: Record<string, TypeSafeQuestion>;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  signal?: AbortSignal;
}

/**
 * Evaluates one `state` against a map of typed `questions` in a single request.
 * All questions are evaluated in parallel against the same state.
 */
export async function systemOne(params: SystemOneParams): Promise<SystemOneResponse> {
  const apiKey = await resolveTypeSafeKey(params.apiKey);
  if (!apiKey) {
    throw new Error(
      "No TypeSafe API key configured. Add your key in AI Settings → TypeSafe (Jev)."
    );
  }
  if (!params.questions || Object.keys(params.questions).length === 0) {
    throw new Error("At least one TypeSafe question is required.");
  }

  const base = (params.baseUrl || TYPESAFE_BASE_URL).replace(/\/+$/, "");
  const url = `${base}/systemone`;
  const payload = {
    state: params.state,
    model: params.model || TYPESAFE_DEFAULT_MODEL,
    questions: params.questions,
  };

  // Idle timeout so a slow network is aborted, but honor an external signal too.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TYPESAFE_TIMEOUT_MS);
  if (params.signal) {
    if (params.signal.aborted) controller.abort();
    else params.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const res = await typesafeTransport(
      url,
      "POST",
      {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      JSON.stringify(payload),
      controller.signal
    );

    if (!res.ok) {
      throw new Error(translateStatusError(res.status, res.body));
    }

    let parsed: SystemOneResponse;
    try {
      parsed = JSON.parse(res.body);
    } catch {
      throw new Error("TypeSafe returned a response that could not be parsed as JSON.");
    }
    if (!parsed || typeof parsed !== "object" || !parsed.answers) {
      throw new Error("TypeSafe response was missing the expected `answers` field.");
    }
    return parsed;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`TypeSafe request timed out after ${TYPESAFE_TIMEOUT_MS / 1000}s.`);
    }
    if (err instanceof Error) throw new Error(sanitizeErrorMessage(err.message));
    throw new Error("TypeSafe request failed.");
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Lists the models the account can use. Falls back to an empty list on failure;
 * callers can merge with a curated list.
 */
export async function listTypeSafeModels(apiKey?: string, baseUrl?: string): Promise<TypeSafeModelInfo[]> {
  const key = await resolveTypeSafeKey(apiKey);
  if (!key) return [];
  const base = (baseUrl || TYPESAFE_BASE_URL).replace(/\/+$/, "");
  const res = await typesafeTransport(
    `${base}/models`,
    "GET",
    { Authorization: `Bearer ${key}` },
    null
  );
  if (!res.ok) {
    throw new Error(translateStatusError(res.status, res.body));
  }
  try {
    const parsed = JSON.parse(res.body);
    const models = Array.isArray(parsed?.models) ? parsed.models : [];
    return models as TypeSafeModelInfo[];
  } catch {
    return [];
  }
}

/**
 * Lightweight connectivity check used by AI Settings. Sends one trivial Noul.
 */
export async function testTypeSafeConnection(apiKey?: string, model?: string): Promise<boolean> {
  const response = await systemOne({
    state: "ok",
    model,
    apiKey,
    questions: {
      __ping: noul("Is this text non-empty?"),
    },
  });
  return Boolean(response?.answers?.__ping);
}
