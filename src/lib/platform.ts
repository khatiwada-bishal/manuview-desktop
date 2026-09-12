import { openExternalLink } from "./desktop";

export type PlatformId = "mac-silicon" | "mac-intel" | "windows" | "linux";

export interface PlatformOption {
  id: PlatformId;
  label: string;
  sublabel: string;
  osName: string;
  extension: string;
  downloadUrl: string;
}

export const PLATFORMS: PlatformOption[] = [
  {
    id: "mac-silicon",
    label: "MacOS Silicon",
    sublabel: "Apple Silicon (M1/M2/M3/M4)",
    osName: "macOS",
    extension: ".dmg",
    downloadUrl: "https://github.com/khatiwada-bishal/manuview-desktop/releases/latest/download/ManuView_aarch64.dmg",
  },
  {
    id: "mac-intel",
    label: "MacOS Intel",
    sublabel: "Intel Processors",
    osName: "macOS",
    extension: ".dmg",
    downloadUrl: "https://github.com/khatiwada-bishal/manuview-desktop/releases/latest/download/ManuView_x64.dmg",
  },
  {
    id: "windows",
    label: "Windows",
    sublabel: "Windows 10 / 11 (64-bit)",
    osName: "Windows",
    extension: ".msi",
    downloadUrl: "https://github.com/khatiwada-bishal/manuview-desktop/releases/latest/download/ManuView_x64_en-US.msi",
  },
  {
    id: "linux",
    label: "Linux",
    sublabel: "x86_64 (.AppImage)",
    osName: "Linux",
    extension: ".AppImage",
    downloadUrl: "https://github.com/khatiwada-bishal/manuview-desktop/releases/latest/download/manuview_amd64.AppImage",
  },
];

export function detectPlatform(): PlatformId {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "mac-silicon";
  }
  const ua = (navigator.userAgent || "").toLowerCase();
  const platform = (
    (navigator as any).userAgentData?.platform ||
    navigator.platform ||
    ""
  ).toLowerCase();

  if (platform.includes("win") || ua.includes("windows")) {
    return "windows";
  }
  if (
    (platform.includes("linux") || ua.includes("linux")) &&
    !ua.includes("android")
  ) {
    return "linux";
  }
  if (
    platform.includes("mac") ||
    ua.includes("macintosh") ||
    ua.includes("mac os")
  ) {
    try {
      const gl = document.createElement("canvas").getContext("webgl");
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          const renderer = gl
            .getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            .toLowerCase();
          if (renderer.includes("intel")) return "mac-intel";
          if (renderer.includes("apple")) return "mac-silicon";
        }
      }
    } catch {}
    return "mac-silicon";
  }
  return "mac-silicon";
}

export function triggerPlatformDownload(platform: PlatformOption): void {
  try {
    const a = document.createElement("a");
    a.href = platform.downloadUrl;
    a.download = "";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    openExternalLink(platform.downloadUrl);
  }
}
