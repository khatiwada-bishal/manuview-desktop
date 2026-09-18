export interface HumanReadableScanError {
  title: string;
  explanation: string;
  action: string;
  technical?: string;
  category: "auth" | "rate_limit" | "network" | "context_length" | "device_memory" | "registry" | "general";
}

/**
 * Translates raw low-level exceptions (HTTP status codes, provider errors, network drops)
 * into friendly, clear, human-understandable diagnostic messages.
 */
export function translateScanError(rawError: any): HumanReadableScanError {
  const errString = String(rawError?.message || rawError?.error || rawError || "");
  const lower = errString.toLowerCase();

  // 1. Authentication & API Key Errors
  if (
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("invalid api key") ||
    lower.includes("incorrect api key") ||
    lower.includes("unauthorized") ||
    lower.includes("authentication") ||
    lower.includes("invalid_api_key")
  ) {
    return {
      title: "API Key Authentication Error",
      explanation:
        "The API key provided for your selected AI model was rejected or has expired. The diagnostic scan could not authenticate with the provider.",
      action:
        "Open Settings (Cmd+,) to verify your API credentials, check that the key has active permissions, and confirm your account balance.",
      technical: errString,
      category: "auth",
    };
  }

  // 2. Rate Limits & Quota Exhaustion
  if (
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("ratelimit") ||
    lower.includes("too many requests") ||
    lower.includes("quota") ||
    lower.includes("insufficient_quota") ||
    lower.includes("resource has been exhausted")
  ) {
    return {
      title: "AI Provider Rate Limit Reached",
      explanation:
        "Your AI provider has temporarily paused requests due to rate limits or exhausted API credits. No data was lost.",
      action:
        "Please wait 30–60 seconds and click 'Retry Review Scan', or open Settings to switch to another configured provider.",
      technical: errString,
      category: "rate_limit",
    };
  }

  // 3. Network, Offline & Connection Timeouts
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("socket hang up") ||
    lower.includes("offline")
  ) {
    return {
      title: "Network Connection Timeout",
      explanation:
        "Unable to establish a reliable connection to the AI provider endpoint. The request timed out or network connectivity was lost.",
      action:
        "Check your internet connection. If using a local model server (Ollama), ensure the Ollama desktop app or service is running on http://127.0.0.1:11434.",
      technical: errString,
      category: "network",
    };
  }

  // 4. Context Window & Manuscript Length Limits
  if (
    lower.includes("context_length_exceeded") ||
    lower.includes("maximum context length") ||
    lower.includes("token limit") ||
    lower.includes("context window") ||
    lower.includes("too long") ||
    lower.includes("prompt is too large")
  ) {
    return {
      title: "Manuscript Exceeds Model Capacity",
      explanation:
        "The uploaded manuscript text exceeds the maximum context window supported by the selected AI model.",
      action:
        "Select a high-capacity model with a larger context window (e.g., Gemini 2.5 Flash, Claude 3.5 Sonnet, or GPT-4o) in Settings, or run the review using the Title & Abstract input.",
      technical: errString,
      category: "context_length",
    };
  }

  // 5. Local WebGPU / Device Memory (SLM)
  if (
    lower.includes("webgpu") ||
    lower.includes("out of memory") ||
    lower.includes("device lost") ||
    lower.includes("buffer allocation") ||
    lower.includes("gpu memory")
  ) {
    return {
      title: "Device Memory Exhausted (WebGPU)",
      explanation:
        "Your device's graphics memory ran out while compiling or running the on-device Small Language Model.",
      action:
        "Close other GPU-intensive browser tabs or desktop applications, or switch to a Cloud Provider (OpenAI, Anthropic, Gemini, Groq) in Settings.",
      technical: errString,
      category: "device_memory",
    };
  }

  // 6. Scholarly Registry / Crossref / Aims & Scope
  if (
    lower.includes("crossref") ||
    lower.includes("openalex") ||
    lower.includes("journal scope") ||
    lower.includes("doi lookup")
  ) {
    return {
      title: "Scholarly Registry Unavailable",
      explanation:
        "The public academic registry was temporarily unreachable while verifying citation integrity and journal scopes.",
      action:
        "Click 'Retry Review Scan' to resume. The review engine will automatically use cached journal catalogs if external registries stay unavailable.",
      technical: errString,
      category: "registry",
    };
  }

  // 7. General Diagnostic Halt Fallback
  return {
    title: "Diagnostic Scan Interrupted",
    explanation:
      "The pre-submission analysis could not complete due to an unexpected response from the AI provider.",
    action:
      "Click 'Retry Review Scan' below. If the problem persists, check your provider configuration in Settings (Cmd+,).",
    technical: errString || "Unknown diagnostic execution error",
    category: "general",
  };
}
