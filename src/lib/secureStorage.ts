/**
 * Secure Credential Storage Layer for ManuView Desktop (Audit Finding #3)
 * Decouples API keys from browser localStorage and persists them natively
 * in the OS Keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service).
 */

import { isDesktopApp } from "./desktop";

const MEMORY_KEY_STORE = new Map<string, string>();

/**
 * Mask an API key for safe UI display without exposing the secret in DOM attributes.
 */
export function maskApiKey(key: string | undefined | null): string {
  if (!key) return "";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "••••••••";
  const start = trimmed.slice(0, 3);
  const end = trimmed.slice(-4);
  return `${start}...${end}`;
}

/**
 * Persist an API credential into the native OS credential manager over Tauri IPC,
 * or memory store if running in standard web preview mode.
 */
export async function saveSecureApiKey(provider: string, key: string): Promise<void> {
  const cleanProvider = (provider || "").trim().toLowerCase();
  const cleanKey = (key || "").trim();
  if (!cleanProvider) return;

  if (isDesktopApp()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_api_credential", { provider: cleanProvider, key: cleanKey });
      MEMORY_KEY_STORE.set(cleanProvider, cleanKey);
      return;
    } catch (err) {
      console.warn("Failed to store API credential via OS keychain, using secure memory store:", err);
    }
  }

  // Fallback: In-memory store (never written to plaintext localStorage)
  MEMORY_KEY_STORE.set(cleanProvider, cleanKey);
}

/**
 * Retrieve an API credential from the native OS credential manager over Tauri IPC.
 */
export async function getSecureApiKey(provider: string): Promise<string> {
  const cleanProvider = (provider || "").trim().toLowerCase();
  if (!cleanProvider) return "";

  if (MEMORY_KEY_STORE.has(cleanProvider)) {
    return MEMORY_KEY_STORE.get(cleanProvider) || "";
  }

  if (isDesktopApp()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const key = await invoke<string>("get_api_credential", { provider: cleanProvider });
      if (key) {
        MEMORY_KEY_STORE.set(cleanProvider, key);
        return key;
      }
    } catch (err) {
      console.warn("Failed to read API credential via OS keychain:", err);
    }
  }

  return MEMORY_KEY_STORE.get(cleanProvider) || "";
}

/**
 * Check whether an API credential is saved for the given provider.
 */
export async function hasSecureApiKey(provider: string): Promise<boolean> {
  const cleanProvider = (provider || "").trim().toLowerCase();
  if (!cleanProvider) return false;

  if (MEMORY_KEY_STORE.has(cleanProvider) && Boolean(MEMORY_KEY_STORE.get(cleanProvider))) {
    return true;
  }

  if (isDesktopApp()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke<boolean>("has_api_credential", { provider: cleanProvider });
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Delete an API credential from the native OS credential manager.
 */
export async function deleteSecureApiKey(provider: string): Promise<void> {
  const cleanProvider = (provider || "").trim().toLowerCase();
  if (!cleanProvider) return;

  MEMORY_KEY_STORE.delete(cleanProvider);

  if (isDesktopApp()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("delete_api_credential", { provider: cleanProvider });
    } catch (err) {
      console.warn("Failed to delete API credential via OS keychain:", err);
    }
  }
}

/**
 * One-time migration: purge any legacy plaintext API keys from browser localStorage
 * and migrate them into the native OS Keychain.
 */
export async function migrateLegacyLocalStorageKeys(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("manuview_provider_config");
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.apiKey === "string" && parsed.apiKey.trim().length > 0) {
      const provider = parsed.provider || "gemini";
      const key = parsed.apiKey.trim();

      // Securely store key into native keychain
      await saveSecureApiKey(provider, key);

      // Sanitize localStorage by completely stripping the plaintext apiKey field
      delete parsed.apiKey;
      parsed.hasSecureKey = true;
      localStorage.setItem("manuview_provider_config", JSON.stringify(parsed));
      console.info("Migrated legacy API key from localStorage to native secure storage.");
    }
  } catch (err) {
    console.warn("Failed to migrate legacy localStorage key:", err);
  }
}
