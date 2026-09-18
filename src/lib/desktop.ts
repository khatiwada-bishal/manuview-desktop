/**
 * Desktop integration helpers for ManuView
 * Enables seamless capability detection between Web and Tauri Desktop app.
 */

export function isDesktopApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    // @ts-expect-error - Tauri injected globals
    window.__TAURI_INTERNALS__ || window.__TAURI__
  );
}

export function isMacOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Macintosh|Mac OS X/i.test(navigator.userAgent || "");
}

/**
 * Open a native OS file dialog for selecting a manuscript (.pdf, .docx).
 * Returns null if cancelled or in web browser mode.
 */
export async function pickManuscriptFileDesktop(): Promise<{
  name: string;
  bytes: Uint8Array;
} | null> {
  if (!isDesktopApp()) return null;

  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { readFile } = await import("@tauri-apps/plugin-fs");

    const selected = await open({
      multiple: false,
      directory: false,
      filters: [
        {
          name: "Manuscript Documents",
          extensions: ["pdf", "docx", "txt", "md"],
        },
      ],
    });

    if (!selected || typeof selected !== "string") return null;

    const bytes = await readFile(selected);
    const fileName = selected.split(/[\\/]/).pop() || "manuscript";

    return {
      name: fileName,
      bytes,
    };
  } catch (err) {
    console.warn("Native file picker failed, fallback to standard input:", err);
    return null;
  }
}

/**
 * Opens an external URL in the user's default browser (instead of navigating the desktop window).
 */
export async function openExternalLink(url: string): Promise<void> {
  if (!url || typeof url !== "string") return;
  const trimmed = url.trim();
  // Strictly enforce http and https schemes to prevent arbitrary URI/file execution (Audit Finding #11)
  if (!/^https?:\/\//i.test(trimmed)) {
    console.warn("Blocked potentially dangerous protocol in openExternalLink:", trimmed);
    return;
  }

  if (isDesktopApp()) {
    try {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(trimmed);
      return;
    } catch (err) {
      console.warn("Tauri shell open failed, falling back to window.open", err);
    }
  }

  if (typeof window !== "undefined") {
    window.open(trimmed, "_blank", "noopener,noreferrer");
  }
}

let isSavingDesktop = false;

function downloadBlobWeb(
  content: string | Uint8Array,
  filename: string,
  mimeType: string
): { success: boolean; filePath?: string; error?: string } {
  if (typeof window === "undefined") {
    return { success: false, error: "No window context" };
  }
  try {
    const blob = new Blob([content as any], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return { success: true, filePath: filename };
  } catch (blobErr) {
    console.error("Browser blob download failed:", blobErr);
    return { success: false, error: String(blobErr) };
  }
}

/**
 * Saves a file using the native desktop file save dialog if in Tauri,
 * or standard browser anchor download if in web preview.
 * Supports both string text and binary Uint8Array data (e.g. PDF).
 */
export async function saveFileDesktop(
  content: string | Uint8Array,
  defaultFilename: string,
  filters?: { name: string; extensions: string[] }[],
  mimeType: string = "text/plain;charset=utf-8"
): Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }> {
  // Prevent concurrent save operations
  if (isSavingDesktop) {
    return { success: false, error: "Save operation already in progress" };
  }

  if (isDesktopApp()) {
    isSavingDesktop = true;
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const filePath = await save({
        defaultPath: defaultFilename,
        filters: filters && filters.length > 0 ? filters : [
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (!filePath) {
        // User cancelled the save dialog
        return { success: false, cancelled: true };
      }

      // Write strictly via scoped official Tauri fs plugin (Audit Finding #2)
      try {
        if (typeof content === "string") {
          const { writeTextFile } = await import("@tauri-apps/plugin-fs");
          await writeTextFile(filePath, content);
        } else {
          const { writeFile } = await import("@tauri-apps/plugin-fs");
          await writeFile(filePath, content);
        }
        return { success: true, filePath };
      } catch (fsErr) {
        console.error("plugin-fs write failed, attempting browser download fallback:", fsErr);
        // Fallback to browser blob download if fs throws an unexpected permission or OS error
        const fallbackRes = downloadBlobWeb(content, defaultFilename, mimeType);
        if (fallbackRes.success) {
          return { success: true, filePath: defaultFilename };
        }
        return { success: false, error: String(fsErr) };
      }
    } catch (err) {
      console.error("Native save dialog error, attempting browser download fallback:", err);
      const fallbackRes = downloadBlobWeb(content, defaultFilename, mimeType);
      if (fallbackRes.success) {
        return { success: true, filePath: defaultFilename };
      }
      return { success: false, error: String(err) };
    } finally {
      isSavingDesktop = false;
    }
  }

  // Web preview mode (executed in standard browser or dev webview)
  return downloadBlobWeb(content, defaultFilename, mimeType);
}

/**
 * Opens a local folder or reveals a file in the system file manager (Finder on macOS, Explorer on Windows).
 */
export async function openFolder(folderOrFilePath?: string | null): Promise<boolean> {
  if (!folderOrFilePath || typeof folderOrFilePath !== "string") return false;
  const trimmed = folderOrFilePath.trim();
  if (!trimmed) return false;

  if (isDesktopApp()) {
    // 1. First attempt native Rust command (reveals file highlighted in Finder)
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("show_in_folder", { path: trimmed });
      return true;
    } catch (invokeErr) {
      console.warn("show_in_folder invoke failed, attempting shell fallback:", invokeErr);
    }

    // 2. Fallback to @tauri-apps/plugin-shell
    try {
      let targetDir = trimmed;
      const lastSlash = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
      if (lastSlash >= 0) {
        const filenamePart = trimmed.substring(lastSlash + 1);
        if (filenamePart.includes(".")) {
          targetDir = trimmed.substring(0, lastSlash) || (trimmed.startsWith("/") ? "/" : targetDir);
        }
      }
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(targetDir);
      return true;
    } catch (shellErr) {
      console.warn("Tauri shell open folder failed:", shellErr);
      return false;
    }
  }

  return false;
}
