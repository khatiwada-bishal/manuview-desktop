"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  BarChart3, 
  BookOpen, 
  Layers, 
  Check, 
  Search, 
  ShieldCheck, 
  ChevronRight, 
  RefreshCw, 
  ExternalLink, 
  MessageSquare, 
  FileText, 
  FlaskConical, 
  GraduationCap, 
  PanelLeft, 
  Download, 
  Printer, 
  Compass, 
  ShieldAlert, 
  Trash2, 
  Moon, 
  Sun, 
  X, 
  ChevronDown, 
  Settings, 
  Shuffle, 
  Zap, 
  Heart 
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { openExternalLink } from "@/lib/desktop";

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

function detectPlatform(): PlatformId {
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

const AppleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 170 170" className={className} fill="currentColor">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.83-12-14.36-6.19-9.35-11-20.35-14.42-33-3.42-12.65-5.13-24.3-5.13-34.95 0-14.36 3.6-26.35 10.8-35.97 7.2-9.62 16.4-14.53 27.6-14.75 5.26 0 11.05 1.41 17.37 4.23 6.32 2.82 10.22 4.3 11.7 4.43 1.96-.24 5.98-1.78 12.06-4.63 6.08-2.85 11.66-4.14 16.74-3.87 12.72.65 22.86 5.48 30.42 14.49-11.09 6.74-16.52 16.03-16.3 27.87.22 9.35 3.86 17.17 10.92 23.48 7.06 6.3 15.43 9.89 25.1 10.76-2.17 6.74-4.89 13.59-8.15 20.55zM119.22 31.84c0-7.18 2.61-13.91 7.83-20.2 5.22-6.29 11.74-10.43 19.56-12.43.22 1.3.33 2.39.33 3.26 0 7.18-2.67 14.13-8.01 20.87-5.34 6.74-12.06 10.76-20.17 12.06-.22-.76-.33-1.42-.33-2.07l.79-1.49z" />
  </svg>
);

const WindowsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 88 88" className={className} fill="currentColor">
    <path d="M0 12.402l35.687-4.86.016 34.423-35.67.202L0 12.402zm35.67 33.529l.028 34.453L0 75.48v-29.75l35.67.201zm4.326-39.027L87.914 0v41.527l-47.918.375V6.904zm47.918 38.928v42.168l-47.918-6.735V45.629l47.918.203z" />
  </svg>
);

const LinuxIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.002 0c-3.13 0-5.67 2.54-5.67 5.67 0 .58.09 1.14.25 1.67-1.74.83-2.95 2.6-2.95 4.66 0 1.25.44 2.4 1.18 3.3-.23.67-.37 1.39-.37 2.14 0 3.63 3.37 6.56 7.56 6.56s7.56-2.93 7.56-6.56c0-.75-.14-1.47-.37-2.14.74-.9 1.18-2.05 1.18-3.3 0-2.06-1.21-3.83-2.95-4.66.16-.53.25-1.09.25-1.67 0-3.13-2.54-5.67-5.67-5.67z" />
  </svg>
);

const CHARACTER_LAYOUTS = [
  // Preset 0: "Orbiting Workshop" (Cross-diagonal scatter)
  {
    name: "Orbiting Workshop",
    drafter: "-left-28 xl:-left-44 -top-8 rotate-[-3deg] animate-float-1",
    citations: "-left-24 xl:-left-40 top-[52%] rotate-[2deg] animate-float-3",
    referees: "right-6 lg:right-24 xl:right-12 -top-16 rotate-[2deg] animate-float-2",
    editor: "-right-24 xl:-right-40 bottom-6 rotate-[-2deg] animate-float-4",
  },
  // Preset 1: "Constellation Scatter"
  {
    name: "Constellation Scatter",
    citations: "left-6 lg:left-20 xl:left-12 -top-16 rotate-[-2deg] animate-float-1",
    drafter: "-left-28 xl:-left-44 top-[45%] rotate-[3deg] animate-float-3",
    editor: "-right-24 xl:-right-40 -top-10 rotate-[2deg] animate-float-2",
    referees: "-right-24 xl:-right-44 bottom-12 rotate-[-3deg] animate-float-4",
  },
  // Preset 2: "Dynamic Editorial Desk"
  {
    name: "Dynamic Editorial Desk",
    referees: "-left-24 xl:-left-44 top-[25%] rotate-[-2deg] animate-float-2",
    editor: "-left-28 xl:-left-40 -bottom-10 rotate-[3deg] animate-float-4",
    drafter: "-right-28 xl:-right-44 -top-6 rotate-[2deg] animate-float-1",
    citations: "-right-24 xl:-right-40 top-[55%] rotate-[-3deg] animate-float-3",
  },
  // Preset 3: "Adversarial Field"
  {
    name: "Adversarial Field",
    editor: "left-12 lg:left-28 xl:left-16 -top-16 rotate-[-3deg] animate-float-3",
    referees: "-left-28 xl:-left-44 bottom-4 rotate-[2deg] animate-float-1",
    citations: "-right-24 xl:-right-40 -top-8 rotate-[-2deg] animate-float-4",
    drafter: "-right-28 xl:-right-44 top-[48%] rotate-[3deg] animate-float-2",
  },
];

export interface DesktopWebLandingPageProps {
  onLaunchApp: () => void;
  onOpenScan?: () => void;
  onOpenService?: (serviceId: string) => void;
  onOpenSettings?: () => void;
  isConnected?: boolean;
  isApiLoading?: boolean;
  modelName?: string | null;
  latencyMs?: number | null;
}

export function DesktopWebLandingPage({
  onLaunchApp,
  onOpenScan,
  onOpenService,
  onOpenSettings,
}: DesktopWebLandingPageProps) {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<
    "overview" | "personas" | "references" | "dimensions" | "issues" | "journals"
  >("overview");
  const [layoutPreset, setLayoutPreset] = useState<number>(0);

  // Operating system detection & download dropdown state
  const [detectedPlatformId, setDetectedPlatformId] = useState<PlatformId>("mac-silicon");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformOption>(PLATFORMS[0]);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const detected = detectPlatform();
    setDetectedPlatformId(detected);
    const matched = PLATFORMS.find((p) => p.id === detected) || PLATFORMS[0];
    setSelectedPlatform(matched);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        downloadDropdownRef.current &&
        !downloadDropdownRef.current.contains(e.target as Node)
      ) {
        setDownloadDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Randomize layout preset on mount so every visit has an organic, fresh scatter
  useEffect(() => {
    setLayoutPreset(Math.floor(Math.random() * CHARACTER_LAYOUTS.length));
  }, []);

  const shuffleLayout = () => {
    setLayoutPreset((prev) => (prev + 1) % CHARACTER_LAYOUTS.length);
  };

  const currentLayout = CHARACTER_LAYOUTS[layoutPreset] || CHARACTER_LAYOUTS[0];

  const handleDownload = (platform: PlatformOption) => {
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
  };

  const handleToolClick = (toolId: string) => {
    if (onOpenService) {
      onOpenService(toolId);
    } else {
      onLaunchApp();
    }
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-neutral-900 dark:text-white bg-[#FFFFFF] dark:bg-[#080B11]">
      {/* ------------------------------------------------------------- */}
      {/* 0. STICKY TOP NAVBAR / HEADER (Exact match with screenshot)    */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 w-full border-b border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#080B11]/85 backdrop-blur-xl transition-colors duration-200">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Brand Identity: Circular Blue 'M' Badge + ManuView */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-bold tracking-tight group cursor-pointer"
          >
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-blue-600 text-white font-serif font-bold text-xs sm:text-sm shadow-xs group-hover:scale-105 transition-transform duration-200">
              M
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-neutral-900 dark:text-white">
              Manu<span className="text-blue-600 dark:text-blue-400">View</span>
            </span>
          </button>

          {/* Right Action Controls: Dark/Light Mode, GitHub Link, Launch App Button */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Dark / Light Mode Toggle Button with Wave Transition */}
            <button
              type="button"
              onClick={(e) => toggleTheme(e)}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme mode"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/15 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-300 cursor-pointer active:scale-95 group relative overflow-hidden"
            >
              <div className="relative w-4 h-4 flex items-center justify-center pointer-events-none">
                <Sun
                  className={`w-3.5 h-3.5 text-amber-400 absolute transition-all duration-700 ease-[cubic-bezier(0.4,0,0.15,1)] transform ${
                    theme === "dark"
                      ? "rotate-0 scale-100 opacity-100"
                      : "rotate-90 scale-0 opacity-0"
                  } group-hover:rotate-45`}
                />
                <Moon
                  className={`w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 absolute transition-all duration-700 ease-[cubic-bezier(0.4,0,0.15,1)] transform ${
                    theme === "dark"
                      ? "-rotate-90 scale-0 opacity-0"
                      : "rotate-0 scale-100 opacity-100"
                  } group-hover:-rotate-12`}
                />
              </div>
            </button>

            {/* GitHub Link Button */}
            <button
              type="button"
              onClick={() =>
                openExternalLink("https://github.com/khatiwada-bishal/manuview-desktop")
              }
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/15 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
              title="View on GitHub"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </button>

            {/* Launch App Primary Button */}
            <button
              type="button"
              onClick={onLaunchApp}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-xs transition active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Launch App</span>
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION                                               */}
      {/* ------------------------------------------------------------- */}
      <section className="relative pt-14 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden aura-bg-gradient aura-grid-pattern">
        <div className="mx-auto max-w-5xl text-center">
          {/* AI Badge Chip */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium mb-6 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="font-mono text-[11px]">Pre-Submission Scientific Diagnostics</span>
          </div>

          {/* Main Headline with Iconic Inline Peach Review Pill */}
          <h1 className="text-4xl sm:text-6xl md:text-[68px] font-bold text-neutral-900 dark:text-white tracking-[-0.03em] leading-[1.08] mb-6">
            Where researchers and <br />
            agents{" "}
            <span className="inline-flex items-center gap-2 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-[#fcedd7] text-[#915809] border border-[#f5dcb7] font-semibold text-2xl sm:text-4xl md:text-5xl align-middle mx-1 sm:mx-2 shadow-md select-none">
              <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-[#e38817] inline-block" />
              Review
            </span>{" "}
            together.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto leading-relaxed font-normal">
            Catch desk-reject flaws, citation hallucinations, and causal overclaims before submitting to top journals. A free, open-source editorial diagnostic for science.
          </p>

          {/* Action Buttons: OS-Aware Split Download Button + Explore Tools */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14 sm:mb-18">
            {/* Split Download Button with Platform Detection & Dropdown */}
            <div className="relative inline-flex items-center" ref={downloadDropdownRef}>
              <div className="inline-flex items-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all duration-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleDownload(selectedPlatform)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm cursor-pointer hover:bg-blue-700/40 transition active:scale-[0.98]"
                  title={`Download ManuView for ${selectedPlatform.label}`}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Download for {selectedPlatform.label}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDownloadDropdownOpen((prev) => !prev);
                  }}
                  aria-label="Other operating system downloads"
                  className="px-2.5 py-2.5 border-l border-white/20 hover:bg-blue-700/50 cursor-pointer transition flex items-center justify-center"
                  title="Choose other operating system (MacOS Intel, Windows, Linux)"
                >
                  <ChevronDown
                    className={`w-4 h-4 text-white transition-transform duration-200 ${
                      downloadDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Dropdown Menu for Other Operating Systems */}
              {downloadDropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-0 top-full mt-2 w-72 rounded-2xl liquid-glass-modal bg-white dark:bg-[#0f172a] p-2 shadow-2xl border border-black/10 dark:border-white/10 z-50 animate-fade-in backdrop-blur-2xl">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                    <span>Operating Systems</span>
                    <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400">
                      Desktop v0.1.0
                    </span>
                  </div>
                  <div className="space-y-1 mt-1.5">
                    {PLATFORMS.map((plat) => {
                      const isCurrentSelected = plat.id === selectedPlatform.id;
                      const isDetected = plat.id === detectedPlatformId;
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => {
                            setSelectedPlatform(plat);
                            setDownloadDropdownOpen(false);
                            handleDownload(plat);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between group cursor-pointer ${
                            isCurrentSelected
                              ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold"
                              : "hover:bg-black/5 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                plat.id.startsWith("mac")
                                  ? "bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white"
                                  : plat.id === "windows"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {plat.id.startsWith("mac") ? (
                                <AppleIcon className="w-4 h-4 fill-current" />
                              ) : plat.id === "windows" ? (
                                <WindowsIcon className="w-4 h-4 fill-current" />
                              ) : (
                                <LinuxIcon className="w-4 h-4 fill-current" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                <span>{plat.label}</span>
                                {isDetected && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-normal bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    Detected
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-normal">
                                {plat.sublabel} ({plat.extension})
                              </div>
                            </div>
                          </div>
                          <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 ml-2" />
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/10 px-2 py-1 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Verified &amp; Signed</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDownloadDropdownOpen(false);
                        openExternalLink(
                          "https://github.com/khatiwada-bishal/manuview-desktop/releases"
                        );
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>All Releases</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Secondary Button: Explore Research Tools */}
            <button
              type="button"
              onClick={() => scrollToSection("tools")}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-white/[0.05] hover:bg-black/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 font-medium text-sm transition cursor-pointer shadow-2xs"
            >
              <span>Explore Research Tools</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* --------------------------------------------------------- */}
          {/* 4-Stage Scholarly Review & Publication Interactive Ribbon */}
          {/* --------------------------------------------------------- */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12 select-none">
            {/* 1: The Author Drafter */}
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`group relative flex items-center gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl transition-all duration-300 text-left border cursor-pointer ${
                activeTab === "overview"
                  ? "liquid-glass-card bg-white/95 dark:bg-white/10 border-blue-500/50 dark:border-blue-400/50 shadow-md ring-2 ring-blue-500/20"
                  : "liquid-glass-card hover:bg-white/70 dark:hover:bg-white/[0.07] border-black/5 dark:border-white/10"
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center overflow-hidden shrink-0 border border-blue-500/20">
                <img
                  src="/illustrations/researcher-typing-laptop.png"
                  alt="Author Drafter"
                  className="w-9 h-9 object-contain dark:invert dark:brightness-150 transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">1. Author Drafter</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Self-Audit</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Pre-submission diagnostics</p>
              </div>
            </button>

            {/* 2: The Co-Authors / Referees */}
            <button
              type="button"
              onClick={() => setActiveTab("personas")}
              className={`group relative flex items-center gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl transition-all duration-300 text-left border cursor-pointer ${
                activeTab === "personas"
                  ? "liquid-glass-card bg-white/95 dark:bg-white/10 border-purple-500/50 dark:border-purple-400/50 shadow-md ring-2 ring-purple-500/20"
                  : "liquid-glass-card hover:bg-white/70 dark:hover:bg-white/[0.07] border-black/5 dark:border-white/10"
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center overflow-hidden shrink-0 border border-purple-500/20">
                <img
                  src="/illustrations/researchers-collaborating.png"
                  alt="Simulated Referees"
                  className="w-9 h-9 object-contain dark:invert dark:brightness-150 transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">2. Referee Simulation</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">5 Personas</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Stress-test controls &amp; claims</p>
              </div>
            </button>

            {/* 3: Citation & Literature Integrity Audit */}
            <button
              type="button"
              onClick={() => setActiveTab("references")}
              className={`group relative flex items-center gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl transition-all duration-300 text-left border cursor-pointer ${
                activeTab === "references"
                  ? "liquid-glass-card bg-white/95 dark:bg-white/10 border-teal-500/50 dark:border-teal-400/50 shadow-md ring-2 ring-teal-500/20"
                  : "liquid-glass-card hover:bg-white/70 dark:hover:bg-white/[0.07] border-black/5 dark:border-white/10"
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-teal-500/10 flex items-center justify-center overflow-hidden shrink-0 border border-teal-500/20">
                <img
                  src="/illustrations/researcher-reading-paper.png"
                  alt="Citation & Evidence Auditor"
                  className="w-9 h-9 object-contain dark:invert dark:brightness-150 transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">3. Citation &amp; Evidence Audit</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">DOI &amp; Retractions</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Crossref &amp; Retraction Watch</p>
              </div>
            </button>

            {/* 4: The Journal Editor */}
            <button
              type="button"
              onClick={() => setActiveTab("journals")}
              className={`group relative flex items-center gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl transition-all duration-300 text-left border cursor-pointer ${
                activeTab === "journals"
                  ? "liquid-glass-card bg-white/95 dark:bg-white/10 border-emerald-500/50 dark:border-emerald-400/50 shadow-md ring-2 ring-emerald-500/20"
                  : "liquid-glass-card hover:bg-white/70 dark:hover:bg-white/[0.07] border-black/5 dark:border-white/10"
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center overflow-hidden shrink-0 border border-emerald-500/20">
                <img
                  src="/illustrations/researcher-reading-journal.png"
                  alt="Editorial Decision"
                  className="w-9 h-9 object-contain dark:invert dark:brightness-150 transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">4. Editorial Decision</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Acceptance</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Journal fit &amp; zero retractions</p>
              </div>
            </button>

            {/* Playful Interactive Layout Shuffle Button */}
            <button
              type="button"
              onClick={shuffleLayout}
              className="group relative flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl liquid-glass-btn-secondary text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer border border-black/5 dark:border-white/10 shadow-xs"
              title={`Layout: ${currentLayout.name}. Click to randomize/shuffle positions!`}
            >
              <Shuffle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:rotate-180 transition-transform duration-500" />
              <span className="hidden sm:inline">Shuffle Desk</span>
            </button>
          </div>

          {/* --------------------------------------------------------- */}
          {/* Hero macOS Desktop App Mockup                             */}
          {/* --------------------------------------------------------- */}
          <div id="demo" className="relative mx-auto max-w-5xl text-left">

            {/* Dynamically Positioned Character 1: Author Drafter */}
            <div className={`hidden xl:block absolute w-40 z-30 pointer-events-auto transition-all duration-700 ease-out ${currentLayout.drafter}`}>
              <div 
                className="relative group cursor-pointer" 
                onClick={() => setActiveTab("overview")}
                title="Click to view manuscript self-audit report"
              >
                <div className="mb-2 p-3 rounded-2xl liquid-glass-card border border-black/10 dark:border-white/15 text-[11px] text-neutral-800 dark:text-neutral-200 shadow-xl transition-all duration-300 group-hover:translate-y-[-2px] group-hover:shadow-glow-blue/30">
                  <div className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 text-[10px] uppercase tracking-wider mb-0.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Author Drafter</span>
                  </div>
                  &ldquo;Auditing sample power &amp; controls before our referees see it.&rdquo;
                </div>
                <div className="relative p-2 rounded-2xl liquid-glass-card/60 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:rotate-0">
                  <img
                    src="/illustrations/researcher-typing-laptop.png"
                    alt="Author Drafter"
                    className="w-full h-auto drop-shadow-md dark:invert dark:brightness-150"
                  />
                </div>
              </div>
            </div>

            {/* Dynamically Positioned Character 2: Citation Auditor */}
            <div className={`hidden xl:block absolute w-40 z-30 pointer-events-auto transition-all duration-700 ease-out ${currentLayout.citations}`}>
              <div 
                className="relative group cursor-pointer" 
                onClick={() => setActiveTab("references")}
                title="Click to view citation integrity & retraction audit"
              >
                <div className="relative p-2 rounded-2xl liquid-glass-card/60 backdrop-blur-sm mb-2 transition-all duration-300 group-hover:scale-105 group-hover:rotate-0">
                  <img
                    src="/illustrations/researcher-reading-paper.png"
                    alt="Citation Auditor"
                    className="w-full h-auto drop-shadow-md dark:invert dark:brightness-150"
                  />
                </div>
                <div className="p-3 rounded-2xl liquid-glass-card border border-black/10 dark:border-white/15 text-[11px] text-neutral-800 dark:text-neutral-200 shadow-xl transition-all duration-300 group-hover:translate-y-[-2px] group-hover:shadow-glow-teal/30">
                  <div className="flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400 text-[10px] uppercase tracking-wider mb-0.5">
                    <BookOpen className="w-3 h-3" />
                    <span>Citation Integrity</span>
                  </div>
                  &ldquo;Crossref DOI verified. Flagged retracted citation in Fig 4!&rdquo;
                </div>
              </div>
            </div>

            {/* Dynamically Positioned Character 3: Simulated Peer Reviewers */}
            <div className={`hidden xl:block absolute w-44 z-30 pointer-events-auto transition-all duration-700 ease-out ${currentLayout.referees}`}>
              <div 
                className="relative group cursor-pointer" 
                onClick={() => setActiveTab("personas")}
                title="Click to view 5-persona simulated reviews"
              >
                <div className="mb-2 p-3 rounded-2xl liquid-glass-card border border-black/10 dark:border-white/15 text-[11px] text-neutral-800 dark:text-neutral-200 shadow-xl transition-all duration-300 group-hover:translate-y-[-2px] group-hover:shadow-glow-violet/30">
                  <div className="flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400 text-[10px] uppercase tracking-wider mb-0.5">
                    <Users className="w-3 h-3" />
                    <span>5 Referees Simulated</span>
                  </div>
                  &ldquo;Devil&apos;s advocate caught a missing control in Fig 3B!&rdquo;
                </div>
                <div className="relative p-2 rounded-2xl liquid-glass-card/60 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:rotate-0">
                  <img
                    src="/illustrations/researchers-collaborating.png"
                    alt="Peer Reviewers"
                    className="w-full h-auto drop-shadow-md dark:invert dark:brightness-150"
                  />
                </div>
              </div>
            </div>

            {/* Dynamically Positioned Character 4: Journal Editor */}
            <div className={`hidden xl:block absolute w-40 z-30 pointer-events-auto transition-all duration-700 ease-out ${currentLayout.editor}`}>
              <div 
                className="relative group cursor-pointer" 
                onClick={() => setActiveTab("journals")}
                title="Click to view target journal fit recommendations"
              >
                <div className="relative p-2 rounded-2xl liquid-glass-card/60 backdrop-blur-sm mb-2 transition-all duration-300 group-hover:scale-105 group-hover:rotate-0">
                  <img
                    src="/illustrations/researcher-reading-journal.png"
                    alt="Journal Editor"
                    className="w-full h-auto drop-shadow-md dark:invert dark:brightness-150"
                  />
                </div>
                <div className="p-3 rounded-2xl liquid-glass-card border border-black/10 dark:border-white/15 text-[11px] text-neutral-800 dark:text-neutral-200 shadow-xl transition-all duration-300 group-hover:translate-y-[-2px] group-hover:shadow-glow-emerald/30">
                  <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-wider mb-0.5">
                    <BookOpen className="w-3 h-3" />
                    <span>Accepted Article</span>
                  </div>
                  &ldquo;Immediate acceptance. Cleanest bibliography in months.&rdquo;
                </div>
              </div>
            </div>

            {/* Main Window Frame */}
            <div className="rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 liquid-glass-canvas shadow-[0_30px_90px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.4)] dark:shadow-[0_30px_90px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] overflow-hidden">
              
              {/* 1. macOS Top Chrome / Tab Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5 dark:border-white/10 liquid-glass-header select-none text-xs gap-3">
                {/* Left: macOS Traffic Lights */}
                <div className="flex items-center gap-2 mr-2 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
                </div>

                {/* Center / Navigation Tabs */}
                <div className="flex items-center gap-1.5 overflow-hidden no-scrollbar py-0.5 flex-1 min-w-0 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 cursor-pointer transition ${
                      activeTab === "overview"
                        ? "bg-white dark:bg-[#1E2536] text-neutral-900 dark:text-white font-semibold shadow-xs border border-black/5 dark:border-white/10"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>AI Review</span>
                  </button>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2536] text-neutral-900 dark:text-white font-semibold shadow-xs border border-black/5 dark:border-white/10 text-xs shrink-0">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="truncate max-w-[120px] sm:max-w-[160px]">Single-cell transcripti...</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("journals")}
                    className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition cursor-pointer ${
                      activeTab === "journals"
                        ? "bg-white dark:bg-[#1E2536] text-neutral-900 dark:text-white font-semibold shadow-xs border border-black/5 dark:border-white/10"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Journal Fit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("references")}
                    className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition cursor-pointer ${
                      activeTab === "references"
                        ? "bg-white dark:bg-[#1E2536] text-neutral-900 dark:text-white font-semibold shadow-xs border border-black/5 dark:border-white/10"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                    <span>Reference Audit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToolClick("prisma")}
                    className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 text-xs font-medium shrink-0 transition cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                    <span>PRISMA 2020</span>
                  </button>
                </div>

                {/* Right Top Bar Controls: Launch into Workspace */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onLaunchApp}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
                    title="Open live desktop workspace"
                  >
                    <span>Open in App</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 2. Window Body: Sidebar + Main Content Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
                
                {/* Left Desktop Sidebar */}
                <div className="hidden lg:flex lg:col-span-4 xl:col-span-3 border-r border-black/5 dark:border-white/10 liquid-glass-sidebar p-3.5 text-xs flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-2 rounded-xl liquid-glass-card">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-serif font-bold text-xs flex items-center justify-center shrink-0">
                          M
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-xs text-neutral-900 dark:text-white">ManuView Suite</div>
                          <div className="text-[10px] text-neutral-400 dark:text-neutral-500">Research &amp; Review</div>
                        </div>
                      </div>
                      <button type="button" className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 dark:text-neutral-500 transition">
                        <PanelLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Services Section */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-2 pb-1 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        <span>Services</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-neutral-200/80 dark:bg-white/10 text-[9px] font-semibold text-neutral-600 dark:text-neutral-300">
                          7
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => setActiveTab("overview")}
                          className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold cursor-pointer transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="truncate">Pre-Submission AI Review</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("journals")}
                          className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition"
                        >
                          <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">Journal Fit Predictor</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("references")}
                          className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span className="truncate">Reference Integrity Audit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToolClick("citation-claim")}
                          className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate">Citation Claim Validator</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToolClick("prisma")}
                          className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition"
                        >
                          <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span className="truncate">PRISMA Flow Diagram</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToolClick("cover-letter")}
                          className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="truncate">Journal Cover Letter</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToolClick("response-builder")}
                          className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span className="truncate">Review Response Builder</span>
                        </button>
                      </div>
                    </div>

                    {/* Search Input Box */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        readOnly
                        value="Search articles..."
                        className="w-full pl-8 pr-8 py-1.5 rounded-xl liquid-glass-input text-[11px] text-neutral-400 select-none cursor-default"
                      />
                      <span className="absolute right-2 top-2 px-1.5 py-0.2 text-[9px] font-mono rounded bg-neutral-200/80 dark:bg-white/10 text-neutral-500 dark:text-neutral-400 border border-black/5 dark:border-white/10">
                        ⌘K
                      </span>
                    </div>

                    {/* Articles Section */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-2 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        <span>Articles</span>
                        <button
                          type="button"
                          onClick={onOpenScan || onLaunchApp}
                          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                        >
                          + New
                        </button>
                      </div>

                      {/* Active Article Card */}
                      <button
                        type="button"
                        onClick={() => setActiveTab("overview")}
                        className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between gap-1.5 cursor-pointer ${
                          activeTab === "overview"
                            ? "bg-white dark:bg-white/10 shadow-xs border border-black/5 dark:border-white/10"
                            : "hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="truncate font-semibold text-neutral-900 dark:text-white text-xs">
                            Single-cell transcr...
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0">
                          35%
                        </span>
                      </button>

                      {/* Sub-tree Navigation Items */}
                      <div className="pl-5 space-y-0.5 border-l border-black/5 dark:border-white/10 ml-3.5">
                        <button
                          type="button"
                          onClick={() => setActiveTab("personas")}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition text-[11px] font-medium cursor-pointer ${
                            activeTab === "personas"
                              ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold"
                              : "text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                        >
                          <Users className="w-3 h-3 text-purple-500" />
                          <span>5-Persona Reviews</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("references")}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition text-[11px] font-medium cursor-pointer ${
                            activeTab === "references"
                              ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold"
                              : "text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                        >
                          <BookOpen className="w-3 h-3 text-teal-500" />
                          <span>Citation Integrity</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("dimensions")}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition text-[11px] font-medium cursor-pointer ${
                            activeTab === "dimensions"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold"
                              : "text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                        >
                          <BarChart3 className="w-3 h-3 text-amber-500" />
                          <span>6 Dimensions</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("issues")}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition text-[11px] font-medium cursor-pointer ${
                            activeTab === "issues"
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold"
                              : "text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          <span>Action Plan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("journals")}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition text-[11px] font-medium cursor-pointer ${
                            activeTab === "journals"
                              ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold"
                              : "text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                        >
                          <BookOpen className="w-3 h-3 text-blue-500" />
                          <span>Target Journals</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Footer */}
                  <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-2">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Disclaimer &amp; Usage</span>
                      </div>
                      <span className="text-[10px] opacity-70">ⓘ</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 px-1 pt-1">
                      <span className="font-mono text-[10px]">v1.0.0</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-semibold border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        GEMINI 3.1 FLAS...
                      </span>
                      <button
                        type="button"
                        onClick={onOpenSettings}
                        className="hover:text-neutral-800 dark:hover:text-white cursor-pointer transition"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8 xl:col-span-9 p-4 sm:p-6 lg:p-7 space-y-4 overflow-y-auto no-scrollbar max-h-[640px]">
                  {activeTab === "overview" && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="rounded-2xl sm:rounded-3xl liquid-glass-card p-5 sm:p-7 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
                          <span className="font-bold text-sm sm:text-base tracking-tight text-neutral-900 dark:text-white">
                            Manu<span className="text-blue-600 dark:text-blue-400">View</span> Diagnostic Suite
                          </span>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs font-semibold text-blue-600 dark:text-blue-400">
                              Target: Journal of Adhesion Science and Technology
                            </span>

                            <button
                              type="button"
                              onClick={onLaunchApp}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold liquid-glass-btn-secondary text-neutral-700 dark:text-neutral-200 transition cursor-pointer"
                            >
                              <Download className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>Export</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              className="p-1.5 rounded-lg liquid-glass-btn-secondary text-neutral-400 hover:text-rose-500 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h2 className="text-lg sm:text-xl font-serif font-bold text-neutral-900 dark:text-white leading-snug">
                            Single-cell transcriptional profiling of DLL3 activation in neuroendocrine lung carcinoma
                          </h2>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                            Generated on September 10, 2026 · Peer-Review Calibrated Pre-Submission Diagnostic
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl liquid-glass-card">
                          <div className="flex items-baseline">
                            <span className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
                              35
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider ml-2">
                              / 100 OVERALL ACCEPTANCE POTENTIAL
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={onLaunchApp}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print / Save as PDF</span>
                          </button>
                        </div>
                      </div>

                      <div className="rounded-2xl sm:rounded-3xl liquid-glass-card p-5 sm:p-6 space-y-2">
                        <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                          Editorial Synthesis &amp; Triage Assessment
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                          The manuscript presents a potentially interesting link between POU2F1 and DLL3 in SCLC. However, the study suffers from severe methodological limitations, including a small sample size (n=8), lack of mechanistic validation beyond simple knockdown, and egregious issues with the bibliography, including a retracted paper and hallucinated citations.
                        </p>
                      </div>

                      <div className="rounded-2xl sm:rounded-3xl liquid-glass-card p-5 sm:p-6 space-y-2">
                        <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                          Document Classification: Empirical Laboratory Study
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
                          <strong>Dear Author:</strong> Your manuscript requires urgent attention regarding reference integrity and the over-extension of causal claims before submission.
                        </p>
                        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                          The current draft contains non-existent references and a retracted citation. These must be purged immediately to avoid automatic desk rejection.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "personas" && (
                    <div className="space-y-3.5 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                            5-Persona Peer Review Panel Simulation
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("overview")}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          &larr; Back to Overview
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="p-4 rounded-2xl liquid-glass-card space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-neutral-900 dark:text-white">Methodological Skeptic</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Critical</span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-300 italic leading-relaxed font-serif">
                            &ldquo;Two-tailed Student&apos;s t-test was applied to small cohorts (n=8) without normality testing. Wilcoxon rank-sum required.&rdquo;
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl liquid-glass-card space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-neutral-900 dark:text-white">Senior Editor (Scope)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">Triage</span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-300 italic leading-relaxed font-serif">
                            &ldquo;Universal biomarker claim is premature for a retrospective cohort. Narrow scope to match empirical data.&rdquo;
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl liquid-glass-card space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-neutral-900 dark:text-white">Mechanistic Oncologist</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Promising</span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-300 italic leading-relaxed font-serif">
                            &ldquo;Direct POU2F1 regulation of DLL3 is biologically exciting and clinically actionable with proper controls.&rdquo;
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl liquid-glass-card space-y-2 sm:col-span-2 lg:col-span-1 border border-rose-500/30">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-rose-600 dark:text-rose-400">Prof. Thorne (Devil&apos;s Advocate)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Adversarial</span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-300 italic leading-relaxed font-serif">
                            &ldquo;Rival hypothesis: DLL3 elevation may be an epiphenomenon of neuroendocrine lineage switching rather than a causal oncogenic driver. Rescue experiments are essential.&rdquo;
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "references" && (
                    <div className="space-y-3.5 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                            Citation Integrity &amp; Literature Grounding Audit
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("overview")}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          &larr; Back to Overview
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl liquid-glass-card border-l-4 border-l-rose-500 space-y-2 bg-rose-50/40 dark:bg-rose-950/20">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            <span className="font-bold text-xs text-rose-700 dark:text-rose-300">
                              Retraction Watch Database Match Flagged
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            Immediate Desk-Reject Hazard
                          </span>
                        </div>
                        <p className="text-xs text-neutral-700 dark:text-neutral-300">
                          Reference #4: <em>Wakefield et al. (1998) Lancet</em> &mdash; Formal editorial retraction confirmed via Crossref DOI metadata. Must be expunged before journal submission.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-2xl liquid-glass-card space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Crossref DOI Status</span>
                          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">47 / 48 Verified</div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">97.9% authentic citations</p>
                        </div>

                        <div className="p-4 rounded-2xl liquid-glass-card space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Evidence Grounding</span>
                          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">92% Anchored</div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Claims cite concrete findings</p>
                        </div>

                        <div className="p-4 rounded-2xl liquid-glass-card space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Self-Citation Index</span>
                          <div className="text-xl font-bold text-neutral-900 dark:text-white">4.2% (Low Risk)</div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Well below 15% alert threshold</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "dimensions" && (
                    <div className="space-y-3.5 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                          The 6 Evaluation Dimensions (1–5 Scale)
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab("overview")}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          &larr; Back to Overview
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { title: "Methodological Rigor & Reproducibility", score: "2.1 / 5", status: "Critical Attention", desc: "Missing positive/negative controls for organoid knockdown assays. Reagent catalog numbers absent." },
                          { title: "Evidence Grounding & Citation Integrity", score: "1.4 / 5", status: "Urgent Remediation", desc: "Detected 1 formally retracted paper and 2 unverifiable DOIs. Immediate desk-reject hazard." },
                          { title: "Statistical Validity & Data Architecture", score: "2.8 / 5", status: "Moderate Flaws", desc: "Parametric tests used on non-normal distributions (n=8). FDR correction omitted." },
                          { title: "Conceptual Framing & Narrative Novelty", score: "3.9 / 5", status: "Solid", desc: "POU2F1 pathway link to DLL3 is biologically compelling and aligns with recent literature." },
                          { title: "Reporting Standards & Completeness", score: "3.2 / 5", status: "Borderline", desc: "Blinding during histological scoring not disclosed. Sample size justification needed." },
                          { title: "Publication Readiness & Editorial Polish", score: "2.4 / 5", status: "Needs Revision", desc: "Overclaiming in Abstract and Title. Abstract exceeds target word count by 42 words." },
                        ].map((dim, i) => (
                          <div key={i} className="p-4 rounded-2xl liquid-glass-card space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-neutral-900 dark:text-white">{dim.title}</span>
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{dim.score}</span>
                            </div>
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300">
                              {dim.status}
                            </span>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">{dim.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "issues" && (
                    <div className="space-y-3.5 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                          Priority Action Items (Desk-Reject Risks)
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab("overview")}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          &larr; Back to Overview
                        </button>
                      </div>
                      <div className="space-y-2.5">
                        <div className="p-4 rounded-2xl liquid-glass-card border-l-4 border-l-rose-500 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">1. Causal Overclaim in Title and Abstract</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">High Risk</span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-300">
                            Reframe claims of &ldquo;proves universal efficacy&rdquo; to correlative findings in organoids (n=8) to avoid instant editorial rejection.
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl liquid-glass-card border-l-4 border-l-amber-500 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">2. Sample Size Statistical Power</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">Medium Risk</span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-300">
                            Include a priori power calculations and replace unpaired Student&apos;s t-test with non-parametric Mann-Whitney test.
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl liquid-glass-card border-l-4 border-l-rose-500 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">3. Retracted Citation in Bibliography</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">Immediate Flag</span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-300">
                            Reference #4 (Wakefield et al., Lancet 1998) is retracted. Must be completely expunged from the bibliography.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "journals" && (
                    <div className="space-y-3.5 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                          Target Journal Recommendations
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab("overview")}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          &larr; Back to Overview
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-2xl liquid-glass-card space-y-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">Reach · IF 14.7</span>
                          <h4 className="font-bold text-sm text-neutral-900 dark:text-white">Nature Communications</h4>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Mechanistic rescue controls required before consideration.</p>
                        </div>
                        <div className="p-4 rounded-2xl liquid-glass-card space-y-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">Realistic · IF 8.8</span>
                          <h4 className="font-bold text-sm text-neutral-900 dark:text-white">Cell Reports</h4>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">High thematic fit for POU2F1 target with moderated claims.</p>
                        </div>
                        <div className="p-4 rounded-2xl liquid-glass-card space-y-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">Fallback · IF 5.2</span>
                          <h4 className="font-bold text-sm text-neutral-900 dark:text-white">Oncogene</h4>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Strong publication venue if organoid rescue cannot be completed.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. LOGO BAR (Scholarly Publisher Venues)                      */}
      {/* ------------------------------------------------------------- */}
      <section className="py-10 border-y border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-[#12151B]/60 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
            Calibrated for formatting and editorial standards of leading peer-reviewed venues
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-sm sm:text-base font-serif font-bold text-neutral-600 dark:text-neutral-300 tracking-wider">
            <span className="hover:text-neutral-900 dark:hover:text-white transition">NATURE</span>
            <span className="hover:text-neutral-900 dark:hover:text-white transition">SCIENCE</span>
            <span className="hover:text-neutral-900 dark:hover:text-white transition">CELL</span>
            <span className="hover:text-neutral-900 dark:hover:text-white transition">THE LANCET</span>
            <span className="hover:text-neutral-900 dark:hover:text-white transition">PNAS</span>
            <span className="hover:text-neutral-900 dark:hover:text-white transition">PLOS ONE</span>
            <span className="hover:text-neutral-900 dark:hover:text-white transition">IEEE TPAMI</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. BENTO GRID SECTION: "AI where your research works."        */}
      {/* ------------------------------------------------------------- */}
      <section id="personas" className="py-20 sm:py-28 px-4 sm:px-6 bg-transparent">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3 border border-blue-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Agent Scientific Reasoning</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight mb-4">
              AI where your research works.
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
              ManuView embeds directly into your pre-submission workflow to simulate adversarial review panels, resolve citations with Crossref, and detect critical methodological flaws.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="rounded-3xl liquid-glass-card p-7 sm:p-8 flex flex-col justify-between transition">
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-semibold">Triage &amp; Diagnostics</span>
                  <div className="w-4 h-4 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px]">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight mb-4">
                  Fast, deep pre-submission diagnostics in 1 click.
                </h3>
              </div>

              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-4 text-xs space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900 dark:text-white">Methodological Flaws</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">2 Critical</span>
                </div>
                <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-rose-500 w-[68%] rounded-full" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
                  <span>Statistical power (n=8)</span>
                  <span className="font-mono">p &lt; 0.05 questionable</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl liquid-glass-card p-7 sm:p-8 flex flex-col justify-between transition">
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-semibold">Citation Audit</span>
                  <div className="w-4 h-4 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px]">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight mb-4">
                  Get answers instantly with live verification.
                </h3>
              </div>

              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-4 text-xs space-y-3 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full border-4 border-blue-500 border-t-blue-500 border-r-blue-500 border-b-blue-200 dark:border-b-blue-900 border-l-blue-500 flex items-center justify-center font-bold text-sm text-blue-600 dark:text-blue-400">
                    94%
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-white">Recency Profile</div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">94% citations published within last 5 years</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-white/[0.06] border border-black/5 dark:border-white/10 shadow-xs text-xs">
                  <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-neutral-500 dark:text-neutral-400 truncate">What are our biggest desk-reject risks?</span>
                  <button
                    type="button"
                    onClick={onLaunchApp}
                    className="ml-auto w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] cursor-pointer"
                  >
                    &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Middle Row: 5 Persona Cards */}
          <div className="rounded-3xl liquid-glass-card p-7 sm:p-8 mb-6 transition">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
              <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-semibold">Peer-Review Simulation</span>
              <div className="w-4 h-4 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px]">
                <Check className="w-2.5 h-2.5" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight mb-4">
              Keep reviews moving 24/7 with expert referee agents.
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 mt-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-xs space-y-2.5 hover:shadow-md transition">
                <div className="flex items-center gap-2 font-semibold text-xs text-emerald-800 dark:text-emerald-300">
                  <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Methods Specialist</span>
                </div>
                <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Assesses CRISPR library representation, sequencing coverage, and negative controls.
                </p>
                <div className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-white/70 dark:bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                  Protocol Reproducibility
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 shadow-xs space-y-2.5 hover:shadow-md transition">
                <div className="flex items-center gap-2 font-semibold text-xs text-purple-800 dark:text-purple-300">
                  <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Domain Expert</span>
                </div>
                <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Evaluates biological plausibility, pathway mechanism, and novelty against 2024 literature.
                </p>
                <div className="text-[10px] font-semibold text-purple-800 dark:text-purple-300 bg-white/70 dark:bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded">
                  Mechanistic Novelty
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-xs space-y-2.5 hover:shadow-md transition">
                <div className="flex items-center gap-2 font-semibold text-xs text-amber-800 dark:text-amber-300">
                  <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Senior Journal Editor</span>
                </div>
                <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Screens broad interest, translational implications, and immediate desk-rejection hazards.
                </p>
                <div className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-white/70 dark:bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded">
                  Desk-Reject Triage
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-xs space-y-2.5 hover:shadow-md transition">
                <div className="flex items-center gap-2 font-semibold text-xs text-cyan-800 dark:text-cyan-300">
                  <BarChart3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Biostatistician</span>
                </div>
                <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Audits sample power calculations, multiplicity adjustments (FDR), and variance metrics.
                </p>
                <div className="text-[10px] font-semibold text-cyan-800 dark:text-cyan-300 bg-white/70 dark:bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded">
                  Statistical Validity
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-xs space-y-2.5 hover:shadow-md transition">
                <div className="flex items-center gap-2 font-semibold text-xs text-rose-800 dark:text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Devil&apos;s Advocate</span>
                </div>
                <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Attacks rival hypotheses, unruled-out confounders, and overclaimed causal mechanisms.
                </p>
                <div className="text-[10px] font-semibold text-rose-800 dark:text-rose-300 bg-white/70 dark:bg-rose-950/40 border border-rose-500/20 px-2 py-0.5 rounded">
                  Adversarial Stress-Test
                </div>
              </div>
            </div>
          </div>

          {/* 5 Bottom Quick Tool Integration Cards */}
          <div id="tools" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <button
              type="button"
              onClick={() => handleToolClick("reference-checker")}
              className="p-4 rounded-2xl liquid-glass-card-interactive flex flex-col justify-between group text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-between">
                  <span>Reference Audit</span>
                  <span className="text-neutral-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Crossref &amp; retractions</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleToolClick("journal-fit")}
              className="p-4 rounded-2xl liquid-glass-card-interactive flex flex-col justify-between group text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center justify-center mb-3">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-between">
                  <span>Journal Fit</span>
                  <span className="text-neutral-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Match 1,300+ journals</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleToolClick("prisma")}
              className="p-4 rounded-2xl liquid-glass-card-interactive flex flex-col justify-between group text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 flex items-center justify-center mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 flex items-center justify-between">
                  <span>PRISMA 2020</span>
                  <span className="text-neutral-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Systematic flow charts</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleToolClick("citation-claim")}
              className="p-4 rounded-2xl liquid-glass-card-interactive flex flex-col justify-between group text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center justify-between">
                  <span>Citation Claim</span>
                  <span className="text-neutral-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Audit claim accuracy</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleToolClick("cover-letter")}
              className="p-4 rounded-2xl liquid-glass-card-interactive flex flex-col justify-between group text-left cursor-pointer col-span-2 sm:col-span-1"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 flex items-center justify-center mb-3">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center justify-between">
                  <span>Cover Letter</span>
                  <span className="text-neutral-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Editor-grade letters</p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. SCHOLARLY STANDARDS & VERIFIABLE INTEGRITY                 */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 bg-transparent border-t border-black/5 dark:border-white/10">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight mb-4">
              Built for verifiable publishing standards.
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
              Designed around empirical integrity checks, real-time registry lookups, and standardized editorial guidelines to catch fatal rejection hazards before journal submission.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl liquid-glass-card p-7 flex flex-col justify-between transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-lg mb-5 shadow-xs">
                  🔍
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">CrossRef Registry Verification</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Directly resolves cited DOIs against CrossRef APIs to flag unresolvable citations, dead URLs, and hallucinated reference titles that trigger immediate editorial red flags.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="font-semibold text-neutral-900 dark:text-neutral-200">Deterministic Audit</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">api.crossref.org</span>
              </div>
            </div>

            <div className="rounded-3xl liquid-glass-card p-7 flex flex-col justify-between transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-lg mb-5 shadow-xs">
                  ⚠️
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">Retraction Screening</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Screens bibliography DOIs against retraction registries and publisher notices. Automatically detects whether your foundational literature has been retracted or corrected.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="font-semibold text-neutral-900 dark:text-neutral-200">Integrity Shield</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">Zero Retraction Policy</span>
              </div>
            </div>

            <div className="rounded-3xl liquid-glass-card p-7 flex flex-col justify-between transition">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg mb-5 shadow-xs">
                  📋
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">Reporting Guideline Compliance</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Calibrated against EQUATOR Network checklists (PRISMA 2020, CONSORT, STROBE) to ensure sample size power justifications, randomization, and blinding statements are complete.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="font-semibold text-neutral-900 dark:text-neutral-200">EQUATOR Guidelines</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">Checklist Auditing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. GET STARTED TODAY CTA SECTION                              */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 border-t border-black/5 dark:border-white/10 text-center relative overflow-hidden aura-bg-gradient">
        <div className="mx-auto max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Open Source Scientific Integrity</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight mb-4 font-serif">
            Empower your next submission.
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-8 max-w-lg mx-auto leading-relaxed">
            Diagnose methodological vulnerabilities, verify cited DOIs in real time, and simulate 5 expert peer reviews before journal editors do.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => handleDownload(selectedPlatform)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl liquid-glass-btn-primary text-white font-semibold text-sm shadow-xs transition active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Download ManuView for {selectedPlatform.label}</span>
            </button>

            <button
              type="button"
              onClick={onLaunchApp}
              className="px-5 py-2.5 rounded-xl liquid-glass-btn-secondary text-neutral-700 dark:text-neutral-200 font-medium text-sm transition cursor-pointer"
            >
              Launch Web Workspace
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. COMPREHENSIVE FOOTER                                       */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-black/5 dark:border-white/10 bg-white/60 dark:bg-[#0A0B0E]/80 backdrop-blur-xl text-neutral-600 dark:text-neutral-400 text-xs py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 sm:col-span-3 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-200 font-semibold text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-serif font-bold text-xs shadow-xs">
                  M
                </div>
                <span className="tracking-tight text-base font-semibold">ManuView</span>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-xs">
                Open-source pre-submission scientific peer-review diagnostics. Free and open to every researcher worldwide.
              </p>
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-[11px] pt-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero-retention &bull; Privacy by default</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-200 mb-3 text-xs">Product</h4>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li><button type="button" onClick={onLaunchApp} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer">Launch App</button></li>
                <li><button type="button" onClick={() => scrollToSection("demo")} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer">Interactive Preview</button></li>
                <li><button type="button" onClick={() => { setActiveTab("dimensions"); scrollToSection("demo"); }} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer">The 6 Scoring Rubrics</button></li>
                <li><button type="button" onClick={() => { setActiveTab("personas"); scrollToSection("demo"); }} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer">5-Persona Peer Review</button></li>
                <li><button type="button" onClick={() => handleToolClick("journal-fit")} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer">Journal Fit Predictor</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-200 mb-3 text-xs">Research Tools</h4>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li><button type="button" onClick={() => handleToolClick("reference-checker")} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer">Reference &amp; Retraction Audit</button></li>
                <li><button type="button" onClick={() => handleToolClick("citation-claim")} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer">Citation Claim Validator</button></li>
                <li><button type="button" onClick={() => handleToolClick("prisma")} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer">PRISMA 2020 Flow Generator</button></li>
                <li><button type="button" onClick={() => handleToolClick("cover-letter")} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer">Cover Letter Generator</button></li>
                <li><button type="button" onClick={() => handleToolClick("response-builder")} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer">Rebuttal Response Matrix</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-200 mb-3 text-xs">Downloads</h4>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li><button type="button" onClick={() => handleDownload(PLATFORMS[0])} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer">macOS Apple Silicon (.dmg)</button></li>
                <li><button type="button" onClick={() => handleDownload(PLATFORMS[1])} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer">macOS Intel (.dmg)</button></li>
                <li><button type="button" onClick={() => handleDownload(PLATFORMS[2])} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer">Windows 10 / 11 (.msi)</button></li>
                <li><button type="button" onClick={() => handleDownload(PLATFORMS[3])} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer">Linux AppImage (.AppImage)</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-200 mb-3 text-xs">Open Science</h4>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  <button
                    type="button"
                    onClick={() => openExternalLink("https://github.com/khatiwada-bishal/manuview-desktop")}
                    className="hover:text-neutral-900 dark:hover:text-neutral-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    GitHub Repository
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openExternalLink("https://github.com/khatiwada-bishal/manuview-desktop/blob/main/LICENSE")}
                    className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer"
                  >
                    MIT License
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openExternalLink("https://github.com/khatiwada-bishal/manuview-desktop/releases")}
                    className="hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer"
                  >
                    Releases &amp; Changelog
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-neutral-500 dark:text-neutral-400 text-[11px]">
            <div className="flex flex-wrap items-center gap-4">
              <span>&copy; 2026 ManuView. Dedicated to open scientific inquiry.</span>
              <span className="hover:text-neutral-900 dark:hover:text-neutral-200 cursor-pointer transition">Zero Data Retention</span>
              <span className="hover:text-neutral-900 dark:hover:text-neutral-200 cursor-pointer transition">MIT Open Source</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                <span>Made with</span>
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" />
                <span>for science</span>
              </div>
              <span className="px-2 py-0.5 rounded border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.05] text-neutral-700 dark:text-neutral-300 font-medium text-[10px]">
                🌐 English (US)
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
