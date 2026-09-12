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
  if (isDesktopApp()) {
    try {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(url);
      return;
    } catch (err) {
      console.warn("Tauri shell open failed, falling back to window.open", err);
    }
  }

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Saves a file using the native desktop file save dialog if in Tauri,
 * or standard browser anchor download if in web preview.
 */
export async function saveFileDesktop(
  content: string,
  defaultFilename: string,
  filters?: { name: string; extensions: string[] }[]
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  if (isDesktopApp()) {
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
        return { success: false };
      }

      // 1. Try native Rust command first
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("save_file", { path: filePath, content });
        return { success: true, filePath };
      } catch (invokeErr) {
        console.warn("invoke save_file failed, trying plugin-fs writeTextFile:", invokeErr);
      }

      // 2. Try plugin-fs writeTextFile
      try {
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");
        await writeTextFile(filePath, content);
        return { success: true, filePath };
      } catch (fsErr) {
        console.warn("plugin-fs writeTextFile failed:", fsErr);
      }
    } catch (err) {
      console.error("Native save dialog failed, falling back to browser download:", err);
    }
  }

  // Fallback for web preview mode (and browser environments)
  if (typeof window !== "undefined") {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return { success: true, filePath: defaultFilename };
}
