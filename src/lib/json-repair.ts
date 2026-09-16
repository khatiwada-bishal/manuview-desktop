/**
 * Robust JSON Sanitizer and Repair Utility for LLM Outputs
 *
 * LLMs (especially compact SLMs such as Qwen-2.5, Llama-3.2, Mistral) frequently produce
 * slightly malformed JSON:
 * 1. Unquoted identifiers in array elements or values
 *    e.g. [need to add controls, need baseline comparisons]
 *    or "actionableFix": need to re-run regression with robust standard errors
 *    which causes "JSON Parse error: Unexpected identifier 'need'".
 * 2. Unquoted object keys
 *    e.g. { need: "value", tier: Realistic }
 * 3. Unescaped double quotes inside string values
 *    e.g. ["The author claims "novelty" without controls"]
 * 4. Truncated output when hitting token limits mid-string, mid-array, or mid-object.
 * 5. Trailing commas before closing brackets or braces.
 * 6. Literal unescaped control characters (\n, \r, \t) inside strings.
 * 7. Single-quoted strings and Python constants (None, True, False, NaN).
 * 8. Missing commas between adjacent properties or array items.
 * 9. Markdown code fences and conversational preamble/postscript text.
 */

export function cleanAndRepairJson<T = any>(raw: string, fallback?: T): T {
  if (!raw || typeof raw !== "string") {
    if (fallback !== undefined) return fallback;
    throw new Error("Empty JSON input");
  }

  // 1. Strip markdown fences and conversational wrappers
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");

  // Strip JavaScript / JSON comments
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1");

  // Locate the start of JSON structure ({ or [)
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx === -1) {
    if (fallback !== undefined) return fallback;
    throw new Error("AI response was received but could not be parsed as valid JSON (no JSON structure found).");
  }

  cleaned = cleaned.slice(startIdx);

  // Strategy A: Direct parse (fast path for valid JSON)
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Strategy B: Extract balanced root object if present
  const balanced = extractBalancedJson(cleaned);
  if (balanced) {
    try {
      return JSON.parse(balanced);
    } catch {}
  }

  // Strategy C: Slice to last matching closing brace/bracket
  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  const lastClose = Math.max(lastBrace, lastBracket);
  if (lastClose !== -1) {
    try {
      return JSON.parse(cleaned.slice(0, lastClose + 1));
    } catch {}
  }

  // Strategy D: Remove trailing commas
  let s = cleaned.replace(/,\s*([\}\]])/g, "$1");
  try {
    return JSON.parse(s);
  } catch {}

  // Strategy E: Python literals / JS constants normalization
  s = s.replace(/:\s*None\b/g, ": null")
       .replace(/:\s*True\b/g, ": true")
       .replace(/:\s*False\b/g, ": false")
       .replace(/:\s*NaN\b/g, ": null")
       .replace(/:\s*undefined\b/g, ": null");
  try {
    return JSON.parse(s);
  } catch {}

  // Strategy F: Deep Tokenizer-based repair pass
  // (Repairs unquoted keys, unquoted values/arrays, missing commas, internal quotes)
  let repaired = repairTokensAndStrings(s);
  try {
    return JSON.parse(repaired);
  } catch {}

  // Strategy G: Balanced slice of tokenizer-repaired string
  const balancedRepaired = extractBalancedJson(repaired);
  if (balancedRepaired) {
    try {
      return JSON.parse(balancedRepaired);
    } catch {}
  }

  // Strategy H: Trailing comma removal after tokenizer repair
  repaired = repaired.replace(/,\s*([\}\]])/g, "$1");
  try {
    return JSON.parse(repaired);
  } catch {}

  // Strategy I: Close truncated JSON (handles token limit cutoffs)
  let closed = closeTruncatedJson(repaired);
  try {
    return JSON.parse(closed);
  } catch {}

  closed = closed.replace(/,\s*([\}\]])/g, "$1");
  try {
    return JSON.parse(closed);
  } catch {}

  // Strategy J: Truncated closure on the raw cleaned string
  let rawClosed = closeTruncatedJson(cleaned);
  rawClosed = rawClosed.replace(/,\s*([\}\]])/g, "$1");
  try {
    return JSON.parse(rawClosed);
  } catch {}

  // Strategy K: Partial Object Recovery (Resilient field extractor)
  const partial = extractPartialObject<T>(cleaned);
  if (partial && Object.keys(partial).length > 0) {
    return partial;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error("AI response was received but could not be parsed as valid JSON.");
}

/**
 * Checks if the upcoming token sequence represents an object key (either quoted or unquoted with a following colon).
 */
function isKeyLookahead(str: string, fromIndex: number): boolean {
  let p = fromIndex;
  while (p < str.length && (str[p] === " " || str[p] === "\t" || str[p] === "\n" || str[p] === "\r")) p++;
  if (p >= str.length) return false;
  if (str[p] === '"' || str[p] === "'") {
    const quote = str[p];
    p++;
    while (p < str.length && str[p] !== quote) {
      if (str[p] === "\\") p++;
      p++;
    }
    if (p < str.length && str[p] === quote) {
      p++;
      while (p < str.length && (str[p] === " " || str[p] === "\t" || str[p] === "\n" || str[p] === "\r")) p++;
      return p < str.length && str[p] === ":";
    }
    return false;
  }
  const match = str.slice(p).match(/^[a-zA-Z_$][a-zA-Z0-9_$-]*\s*:/);
  return Boolean(match);
}

/**
 * Robust lexical scanner that repairs unquoted keys, unquoted string values,
 * unquoted array items, unescaped internal quotes, single quotes, and missing commas.
 */
function repairTokensAndStrings(input: string): string {
  let out = "";
  let i = 0;
  const n = input.length;

  type Context = { type: "object"; state: "expect_key" | "expect_colon" | "expect_val" } | { type: "array" };
  const stack: Context[] = [];

  while (i < n) {
    const c = input[i];

    // Whitespace
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      out += c;
      i++;
      continue;
    }

    // Double quoted string
    if (c === '"') {
      out += '"';
      i++;
      let escaped = false;
      while (i < n) {
        const sc = input[i];
        if (escaped) {
          out += sc;
          escaped = false;
          i++;
          continue;
        }
        if (sc === "\\") {
          out += sc;
          escaped = true;
          i++;
          continue;
        }
        if (sc === '"') {
          // Look ahead to check if this is a closing quote or unescaped internal quote
          let j = i + 1;
          while (j < n && (input[j] === " " || input[j] === "\t" || input[j] === "\n" || input[j] === "\r")) j++;
          const next = j < n ? input[j] : "";
          const top = stack[stack.length - 1];

          if (top && top.type === "object" && top.state === "expect_key") {
            if (next === ":") {
              out += '"';
              i++;
              top.state = "expect_colon";
              break;
            } else {
              out += '\\"';
              i++;
              continue;
            }
          } else {
            // Inside value or array element
            if (next === "," || next === "}" || next === "]" || next === ":" || next === "") {
              out += '"';
              i++;
              if (top && top.type === "object" && top.state === "expect_val") {
                top.state = "expect_key";
              }
              break;
            } else if (top && top.type === "object" && isKeyLookahead(input, j)) {
              // Missing comma before next key in object!
              out += '",';
              i++;
              top.state = "expect_key";
              break;
            } else if (top && top.type === "array" && (next === '"' || next === "{" || next === "[")) {
              // Missing comma before next element in array!
              out += '",';
              i++;
              break;
            } else {
              out += '\\"';
              i++;
              continue;
            }
          }
        }
        // Normalize literal control characters inside string literals
        if (sc === "\n") out += "\\n";
        else if (sc === "\r") out += "\\r";
        else if (sc === "\t") out += "\\t";
        else out += sc;
        i++;
      }
      continue;
    }

    // Single quoted string -> normalize to double quotes
    if (c === "'") {
      out += '"';
      i++;
      let escaped = false;
      while (i < n) {
        const sc = input[i];
        if (escaped) {
          out += sc;
          escaped = false;
          i++;
          continue;
        }
        if (sc === "\\") {
          out += sc;
          escaped = true;
          i++;
          continue;
        }
        if (sc === "'") {
          out += '"';
          i++;
          const top = stack[stack.length - 1];
          if (top && top.type === "object") {
            if (top.state === "expect_key") top.state = "expect_colon";
            else if (top.state === "expect_val") top.state = "expect_key";
          }
          break;
        }
        if (sc === '"') out += '\\"';
        else if (sc === "\n") out += "\\n";
        else if (sc === "\r") out += "\\r";
        else if (sc === "\t") out += "\\t";
        else out += sc;
        i++;
      }
      continue;
    }

    // Structural: {
    if (c === "{") {
      out += "{";
      stack.push({ type: "object", state: "expect_key" });
      i++;
      continue;
    }

    // Structural: }
    if (c === "}") {
      out += "}";
      if (stack.length > 0 && stack[stack.length - 1].type === "object") {
        stack.pop();
      }
      const top = stack[stack.length - 1];
      if (top && top.type === "object") {
        top.state = "expect_key";
      }
      i++;
      continue;
    }

    // Structural: [
    if (c === "[") {
      out += "[";
      stack.push({ type: "array" });
      i++;
      continue;
    }

    // Structural: ]
    if (c === "]") {
      out += "]";
      if (stack.length > 0 && stack[stack.length - 1].type === "array") {
        stack.pop();
      }
      const top = stack[stack.length - 1];
      if (top && top.type === "object") {
        top.state = "expect_key";
      }
      i++;
      continue;
    }

    // Structural: :
    if (c === ":") {
      out += ":";
      const top = stack[stack.length - 1];
      if (top && top.type === "object") {
        top.state = "expect_val";
      }
      i++;
      continue;
    }

    // Structural: ,
    if (c === ",") {
      out += ",";
      const top = stack[stack.length - 1];
      if (top && top.type === "object") {
        top.state = "expect_key";
      }
      i++;
      continue;
    }

    const top = stack[stack.length - 1];

    // Inside object expecting key: unquoted key identifier (e.g. need: or tier:)
    if (top && top.type === "object" && top.state === "expect_key") {
      let key = "";
      while (i < n && input[i] !== ":" && input[i] !== "}" && input[i] !== "\n" && input[i] !== ",") {
        key += input[i];
        i++;
      }
      key = key.trim();
      if (key) {
        out += `"${key}"`;
        top.state = "expect_colon";
      }
      continue;
    }

    // Check standard JSON literals: true, false, null, numbers
    const rest = input.slice(i);
    const litMatch = rest.match(/^(true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/);
    if (litMatch) {
      out += litMatch[1];
      i += litMatch[1].length;
      if (top && top.type === "object" && top.state === "expect_val") {
        top.state = "expect_key";
      }
      // Check if missing comma after literal
      let k = i;
      while (k < n && (input[k] === " " || input[k] === "\t" || input[k] === "\n" || input[k] === "\r")) k++;
      if (top && top.type === "object" && isKeyLookahead(input, k)) {
        out += ",";
      } else if (top && top.type === "array" && k < n && (input[k] === '"' || input[k] === "{" || input[k] === "[")) {
        out += ",";
      }
      continue;
    }

    // Python constants (None, True, False, NaN)
    const pyMatch = rest.match(/^(None|True|False|NaN)\b/);
    if (pyMatch) {
      const mapped = (pyMatch[1] === "None" || pyMatch[1] === "NaN") ? "null" : pyMatch[1].toLowerCase();
      out += mapped;
      i += pyMatch[1].length;
      if (top && top.type === "object" && top.state === "expect_val") {
        top.state = "expect_key";
      }
      continue;
    }

    // Unquoted value in array OR object
    if ((top && top.type === "array") || (top && top.type === "object" && top.state === "expect_val")) {
      let val = "";
      const stopChars = top.type === "array" ? [",", "]"] : [",", "}"];
      while (i < n && !stopChars.includes(input[i]) && input[i] !== "\n") {
        val += input[i];
        i++;
      }
      val = val.trim();
      if (val) {
        const escaped = val.replace(/"/g, '\\"');
        out += `"${escaped}"`;
      }
      if (top.type === "object") {
        top.state = "expect_key";
      }
      continue;
    }

    out += c;
    i++;
  }

  return out;
}

/**
 * Extracts the largest balanced root JSON block from text.
 */
function extractBalancedJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escaped) { escaped = false; continue; }
    if (c === "\\") { escaped = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (!inString) {
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

/**
 * Closes unclosed strings, arrays, and objects caused by LLM token limit cutoffs.
 */
function closeTruncatedJson(jsonStr: string): string {
  let str = jsonStr.trim();
  str = str.replace(/[,:\s]+$/, "");

  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let lastStringStart = -1;

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (c === "\\") {
      escaped = true;
      continue;
    }
    if (c === '"') {
      if (!inString) {
        inString = true;
        lastStringStart = i;
      } else {
        inString = false;
      }
      continue;
    }
    if (!inString) {
      if (c === "{") stack.push("}");
      else if (c === "[") stack.push("]");
      else if (c === "}" || c === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === c) {
          stack.pop();
        }
      }
    }
  }

  const top = stack[stack.length - 1];

  // If ended inside a string while expecting an object key, prune the incomplete key
  let prevChar = "";
  if (lastStringStart > 0) {
    let p = lastStringStart - 1;
    while (p >= 0 && (str[p] === " " || str[p] === "\t" || str[p] === "\n" || str[p] === "\r")) {
      p--;
    }
    if (p >= 0) prevChar = str[p];
  }

  if (inString) {
    if (top === "}" && (prevChar === "," || prevChar === "{")) {
      if (prevChar === ",") {
        str = str.slice(0, lastStringStart).replace(/,\s*$/, "");
      } else if (prevChar === "{") {
        str = str.slice(0, lastStringStart).trim();
      }
    } else {
      str += '"';
    }
  } else {
    if (top === "}") {
      str = str.replace(/,\s*"[^"]*"\s*:\s*$/, "");
      str = str.replace(/\{\s*"[^"]*"\s*:\s*$/, "{");
      str = str.replace(/,\s*"[^"]*"\s*$/, "");
      str = str.replace(/\{\s*"[^"]*"\s*$/, "{");
    }
  }

  str = str.replace(/[,:\s]+$/, "");

  // Recompute closing stack for the clean string
  const finalStack: string[] = [];
  let finalInString = false;
  let finalEscaped = false;

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (finalEscaped) {
      finalEscaped = false;
      continue;
    }
    if (c === "\\") {
      finalEscaped = true;
      continue;
    }
    if (c === '"') {
      finalInString = !finalInString;
      continue;
    }
    if (!finalInString) {
      if (c === "{") finalStack.push("}");
      else if (c === "[") finalStack.push("]");
      else if (c === "}" || c === "]") {
        if (finalStack.length > 0 && finalStack[finalStack.length - 1] === c) {
          finalStack.pop();
        }
      }
    }
  }

  if (finalInString) {
    str += '"';
  }
  str = str.replace(/[,:\s]+$/, "");

  while (finalStack.length > 0) {
    str += finalStack.pop();
  }

  return str;
}

/**
 * Resilient Partial Object Recovery:
 * Extracts recognized JSON properties from severely corrupted text as a last resort.
 */
function extractPartialObject<T>(raw: string): T | null {
  const result: Record<string, any> = {};

  const scoreMatch = raw.match(/"overallScore"\s*:\s*(\d+)/i);
  if (scoreMatch) {
    result.overallScore = parseInt(scoreMatch[1], 10);
  }

  const summaryMatch = raw.match(/"summary"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i);
  if (summaryMatch) {
    result.summary = summaryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
  }

  const fitScoreMatch = raw.match(/"fitScore"\s*:\s*(\d+)/i);
  if (fitScoreMatch) {
    result.fitScore = parseInt(fitScoreMatch[1], 10);
  }

  const verdictMatch = raw.match(/"verdict"\s*:\s*"([^"]+)"/i);
  if (verdictMatch) {
    result.verdict = verdictMatch[1];
  }

  if (Object.keys(result).length > 0) {
    return result as T;
  }
  return null;
}
