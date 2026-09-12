"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Sparkles,
  Settings,
  FileText,
  Users,
  CheckCircle2,
  BookOpen,
  Plus,
  ShieldCheck,
  Layers,
  MessageSquare,
  Compass,
  ChevronDown,
  ChevronRight,
  BarChart3,
  AlertCircle,
  PanelLeft,
  Trash2,
  AlertTriangle,
  Info,
} from "lucide-react";

export type DesktopActiveView =
  | "overview"
  | "personas"
  | "dimensions"
  | "issues"
  | "journals"
  | "citations"
  | "recommendations";

export interface PaperItem {
  id: string;
  title: string;
  shortName: string;
  journal: string;
  score?: number;
  isEligibleForReview?: boolean;
  ineligibilityReason?: "already_published" | "non_academic_document";
  isPublished?: boolean;
  publishedJournal?: string;
}

interface DesktopSidebarProps {
  papers: PaperItem[];
  activePaperId: string | null;
  activeView: DesktopActiveView;
  isConnected?: boolean;
  isLoading?: boolean;
  provider?: string | null;
  activeModelName?: string | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectPaper: (id: string) => void;
  onSelectView: (view: DesktopActiveView) => void;
  onOpenSearch: () => void;
  onNewReview: () => void;
  onOpenSettings: () => void;
  onSelectService?: (serviceId: string) => void;
  onDeletePaper?: (paper: PaperItem, e: React.MouseEvent) => void;
}

export function DesktopSidebar({
  papers,
  activePaperId,
  activeView,
  isConnected = false,
  isLoading = false,
  provider,
  activeModelName,
  isCollapsed = false,
  onToggleCollapse,
  onSelectPaper,
  onSelectView,
  onOpenSearch,
  onNewReview,
  onOpenSettings,
  onSelectService,
  onDeletePaper,
}: DesktopSidebarProps) {
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const disclaimerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const prevCollapsedRef = useRef(isCollapsed);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (disclaimerRef.current && !disclaimerRef.current.contains(e.target as Node)) {
        setShowDisclaimer(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (prevCollapsedRef.current !== isCollapsed) {
      prevCollapsedRef.current = isCollapsed;
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 520);
      return () => clearTimeout(timer);
    }
  }, [isCollapsed]);

  // Connection status: "connected" (green) | "connecting" (orange/yellow) | "disconnected" (red)
  const connectionStatus = isLoading
    ? "connecting"
    : isConnected
    ? "connected"
    : "disconnected";

  const connectionLabel =
    connectionStatus === "connected"
      ? activeModelName || "AI Connected"
      : connectionStatus === "connecting"
      ? "Connecting..."
      : "Connect AI";

  const SERVICES = [
    {
      id: "ai-review",
      name: "Pre-Submission AI Review",
      description: "5-Persona reviewer simulation",
      icon: Sparkles,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
      action: () => {
        if (onSelectService) onSelectService("ai-review");
        else onNewReview();
      },
    },
    {
      id: "journal-fit",
      name: "Journal Fit Predictor",
      description: "1,300+ catalog matcher",
      icon: Compass,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
      action: () => {
        if (onSelectService) onSelectService("journal-fit");
        else onNewReview();
      },
    },
    {
      id: "reference-checker",
      name: "Reference Integrity Audit",
      description: "Crossref & Retraction Watch",
      icon: CheckCircle2,
      color: "text-teal-600 bg-teal-50 dark:bg-teal-950/50 dark:text-teal-400",
      action: () => {
        if (onSelectService) onSelectService("reference-checker");
        else onSelectView("citations");
      },
    },
    {
      id: "citation-claim",
      name: "Citation Claim Validator",
      description: "Evidence claim alignment",
      icon: ShieldCheck,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
      action: () => {
        if (onSelectService) onSelectService("citation-claim");
        else onNewReview();
      },
    },
    {
      id: "prisma",
      name: "PRISMA Flow Diagram",
      description: "Systematic review generator",
      icon: Layers,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
      action: () => {
        if (onSelectService) onSelectService("prisma");
        else onNewReview();
      },
    },
    {
      id: "cover-letter",
      name: "Journal Cover Letter",
      description: "Formal editor submission letter",
      icon: FileText,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400",
      action: () => {
        if (onSelectService) onSelectService("cover-letter");
        else onNewReview();
      },
    },
    {
      id: "response-builder",
      name: "Review Response Builder",
      description: "Point-by-point rebuttal matrix",
      icon: MessageSquare,
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400",
      action: () => {
        if (onSelectService) onSelectService("response-builder");
        else onSelectView("personas");
      },
    },
  ];

  return (
    <aside
      className={`h-full select-none shrink-0 flex flex-col relative liquid-glass-sidebar text-[#1F2937] dark:text-[#E2E8F0] sidebar-elastic-spring ${
        isCollapsed ? "w-[68px] z-40" : "w-64 z-30"
      } ${
        isTransitioning
          ? "overflow-hidden"
          : "overflow-visible"
      }`}
    >
      {/* ------------------------------------------------------------- */}
      {/* COLLAPSED SIDEBAR VIEW LAYER                                  */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`absolute inset-y-0 left-0 w-[68px] flex flex-col h-full transition-opacity duration-200 ease-in-out ${
          isCollapsed
            ? "opacity-100 pointer-events-auto z-20"
            : "opacity-0 pointer-events-none z-10"
        } ${isTransitioning ? "overflow-hidden" : "overflow-visible"}`}
      >
        {/* LOGO: Hover reveals expand icon */}
        <div className="p-3 border-b border-[#E5E7EB]/70 dark:border-[#1E293B] flex justify-center">
          <div className="relative group flex justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className="w-10 h-10 rounded-xl bg-white dark:bg-[#161F30] border border-[#E5E7EB] dark:border-[#1E293B] hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs flex items-center justify-center transition cursor-pointer relative overflow-hidden"
            >
              {/* Official ManuView Icon */}
              <img
                src="/icon.svg"
                alt="ManuView Logo"
                className="w-8 h-8 rounded-lg shadow-xs transition-all duration-150 group-hover:opacity-0 group-hover:scale-75 select-none"
              />
              {/* Expand sidebar icon on hover */}
              <div className="absolute inset-0 flex items-center justify-center text-[#0F172A] dark:text-white opacity-0 group-hover:opacity-100 transition-all duration-150 group-hover:scale-100">
                <PanelLeft className="w-4 h-4" />
              </div>
            </button>

            {/* Tooltip outside overflow-hidden button */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-[#111827] text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              Expand sidebar
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#111827]" />
            </div>
          </div>
        </div>

        {/* ICONS BENEATH LOGO (overflow-visible so tooltips and submenus fly out cleanly) */}
        <div className="flex-1 overflow-visible px-2 py-3 space-y-3">
          {/* Services Icons */}
          <div className="space-y-1.5 flex flex-col items-center">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.id} className="relative group flex justify-center">
                  <button
                    type="button"
                    onClick={service.action}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer hover:scale-105 shadow-2xs ${service.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                  {/* Tooltip on right */}
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-[#111827] text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {service.name}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#111827]" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="w-8 h-px bg-[#E5E7EB] dark:bg-[#1E293B] mx-auto" />

          {/* Search Icon */}
          <div className="relative group flex justify-center">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-[#161F30] border border-[#E5E7EB] dark:border-[#1E293B] hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition shadow-2xs cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-[#111827] text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              Search articles (⌘K)
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#111827]" />
            </div>
          </div>

          {/* Articles Icon with Right-side Submenu */}
          <div className="relative group flex justify-center">
            <button
              type="button"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer shadow-2xs ${
                activePaperId
                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                  : "bg-white dark:bg-[#161F30] border border-[#E5E7EB] dark:border-[#1E293B] hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
              }`}
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Submenu popover on hover */}
            <div className="absolute left-full top-0 ml-2 w-64 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl shadow-xl p-2.5 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-3 before:content-['']">
              <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Articles ({papers.length})
                </span>
                <button
                  type="button"
                  onClick={onNewReview}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 [scrollbar-width:thin]">
                {papers.length === 0 ? (
                  <div className="text-xs text-neutral-400 dark:text-neutral-500 py-2 text-center">
                    No articles yet
                  </div>
                ) : (
                  papers.map((paper) => {
                    const isSelected = paper.id === activePaperId;
                    return (
                      <div key={paper.id} className="space-y-0.5">
                        <div
                          onClick={() => {
                            onSelectPaper(paper.id);
                            onSelectView("overview");
                          }}
                          className={`group/item w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition cursor-pointer ${
                            isSelected && activeView === "overview"
                              ? "bg-[#E5E7EB] dark:bg-[#1E293B] font-semibold text-[#111827] dark:text-white"
                              : isSelected
                              ? "bg-[#F3F4F6] dark:bg-[#161F30] font-medium text-[#111827] dark:text-white"
                              : "hover:bg-neutral-50 dark:hover:bg-[#1E293B]/50 text-neutral-700 dark:text-neutral-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <FileText
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? "text-blue-600 dark:text-blue-400" : "text-neutral-400 dark:text-neutral-500"
                              }`}
                            />
                            <div className="truncate">
                              <div className="truncate font-medium text-xs text-[#111827] dark:text-neutral-100">
                                {paper.shortName}
                              </div>
                              <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                                {paper.journal}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {paper.isEligibleForReview === false ? (
                              paper.ineligibilityReason === "already_published" ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  PUB
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                  N/A
                                </span>
                              )
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-[#334155]">
                                {paper.score ?? 0}%
                              </span>
                            )}
                            {onDeletePaper && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeletePaper(paper, e);
                                }}
                                title="Delete manuscript project"
                                className="p-1 rounded text-neutral-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition opacity-0 group-hover/item:opacity-100 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Status notification when selected for ineligible papers */}
                        {isSelected && paper.isEligibleForReview === false && (
                          <div className="pl-3 pr-1 py-1 space-y-0.5">
                            {paper.ineligibilityReason === "already_published" ? (
                              <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50/70 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-200/50 dark:border-emerald-800/50">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="truncate">Already Published</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[10px] text-amber-700 dark:text-amber-400 font-medium bg-amber-50/70 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200/50 dark:border-amber-800/50">
                                <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span className="truncate">Review Bypassed</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 4 Sub-menus in flyout when selected (Only for eligible manuscripts) */}
                        {isSelected && paper.isEligibleForReview !== false && (
                          <div className="pl-3 space-y-0.5 pt-0.5 pb-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectView("personas");
                              }}
                              className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition text-left cursor-pointer ${
                                activeView === "personas"
                                  ? "bg-[#E5E7EB] dark:bg-[#1E293B] font-semibold text-[#111827] dark:text-white"
                                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B]/60 hover:text-neutral-900 dark:hover:text-white"
                              }`}
                            >
                              <Users className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="truncate">5-Persona Reviews</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectView("dimensions");
                              }}
                              className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition text-left cursor-pointer ${
                                activeView === "dimensions"
                                  ? "bg-[#E5E7EB] dark:bg-[#1E293B] font-semibold text-[#111827] dark:text-white"
                                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B]/60 hover:text-neutral-900 dark:hover:text-white"
                              }`}
                            >
                              <BarChart3 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="truncate">6 Scoring Dimensions</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectView("issues");
                              }}
                              className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition text-left cursor-pointer ${
                                activeView === "issues"
                                  ? "bg-[#E5E7EB] dark:bg-[#1E293B] font-semibold text-[#111827] dark:text-white"
                                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B]/60 hover:text-neutral-900 dark:hover:text-white"
                              }`}
                            >
                              <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span className="truncate">Priority Action Items</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectView("journals");
                              }}
                              className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition text-left cursor-pointer ${
                                activeView === "journals" || activeView === "recommendations"
                                  ? "bg-[#E5E7EB] dark:bg-[#1E293B] font-semibold text-[#111827] dark:text-white"
                                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B]/60 hover:text-neutral-900 dark:hover:text-white"
                              }`}
                            >
                              <BookOpen className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span className="truncate">Target Journals</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectView("citations");
                              }}
                              className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition text-left cursor-pointer ${
                                activeView === "citations"
                                  ? "bg-[#E5E7EB] dark:bg-[#1E293B] font-semibold text-[#111827] dark:text-white"
                                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B]/60 hover:text-neutral-900 dark:hover:text-white"
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                              <span className="truncate">Citation Integrity</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER: Compact Settings Pill */}
        <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-center">
          <div className="relative group">
            <button
              type="button"
              onClick={onOpenSettings}
              title={
                connectionStatus === "connected"
                  ? "AI Connected - Provider Settings"
                  : connectionStatus === "connecting"
                  ? "Connecting to AI..."
                  : "Connect AI - Provider Settings"
              }
              className={`w-10 h-10 rounded-full border transition shadow-2xs flex items-center justify-center cursor-pointer relative ${
                connectionStatus === "connected"
                  ? "border-[#86efac] dark:border-[#065f46] bg-[#f0fdf4] dark:bg-[#064e3b]/30 text-[#065f46] dark:text-[#34d399] hover:bg-[#dcfce7] dark:hover:bg-[#064e3b]/50 hover:border-[#4ade80]"
                  : connectionStatus === "connecting"
                  ? "border-[#fde68a] dark:border-[#78350f] bg-[#fffbeb] dark:bg-[#78350f]/30 text-[#92400e] dark:text-[#fbbf24] hover:bg-[#fef3c7] hover:border-[#fcd34d]"
                  : "border-[#fecaca] dark:border-[#7f1d1d] bg-[#fef2f2] dark:bg-[#7f1d1d]/30 text-[#991b1b] dark:text-[#f87171] hover:bg-[#fee2e2] hover:border-[#fca5a5]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full absolute top-1.5 right-1.5 ${
                  connectionStatus === "connected"
                    ? "bg-[#10b981]"
                    : connectionStatus === "connecting"
                    ? "bg-[#f59e0b] animate-pulse"
                    : "bg-[#ef4444]"
                }`}
              />
              <Settings
                className={`w-4 h-4 ${
                  connectionStatus === "connected"
                    ? "text-[#047857] dark:text-[#34d399]"
                    : connectionStatus === "connecting"
                    ? "text-[#b45309] dark:text-[#fbbf24]"
                    : "text-[#dc2626] dark:text-[#f87171]"
                }`}
              />
            </button>
            <div className="absolute left-full bottom-1 ml-3 px-2.5 py-1 bg-[#111827] text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-[#10b981]"
                    : connectionStatus === "connecting"
                    ? "bg-[#f59e0b]"
                    : "bg-[#ef4444]"
                }`}
              />
              <span>{connectionLabel}</span>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#111827]" />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EXPANDED SIDEBAR VIEW LAYER                                   */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`absolute inset-y-0 left-0 w-64 flex flex-col h-full transition-opacity duration-200 ease-in-out ${
          !isCollapsed
            ? "opacity-100 pointer-events-auto z-20"
            : "opacity-0 pointer-events-none z-10"
        } overflow-hidden`}
      >
      {/* 1. COMPANY HEADER: Logo + Title + Collapse Button */}
      <div className="p-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center justify-between p-2 rounded-xl liquid-glass-card shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/icon.svg"
              alt="ManuView Logo"
              className="w-7 h-7 rounded-lg shadow-xs shrink-0 select-none"
            />
            <div className="truncate min-w-0">
              <div className="font-bold text-xs text-[#0F172A] dark:text-white tracking-tight">
                ManuView Desktop
              </div>
              <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                Research & Review Suite
              </div>
            </div>
          </div>
          {/* Collapse sidebar icon replacing the gear icon */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.1] text-neutral-400 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SCROLLABLE MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 [scrollbar-width:thin]">
        {/* 2. SERVICES LIST */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <button
              type="button"
              onClick={() => setServicesExpanded(!servicesExpanded)}
              className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 dark:text-neutral-400 uppercase tracking-wider hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer"
            >
              {servicesExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <span>SERVICES</span>
            </button>
            <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-400 bg-black/[0.04] dark:bg-white/[0.08] px-1.5 py-0.2 rounded-md">
              {SERVICES.length}
            </span>
          </div>

          {servicesExpanded && (
            <div className="space-y-0.5">
              {SERVICES.map((service) => {
                const Icon = service.icon;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={service.action}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white text-neutral-700 dark:text-neutral-300 transition text-left cursor-pointer group"
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${service.color}`}
                    >
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="truncate min-w-0">
                      <div className="font-medium text-xs text-neutral-800 dark:text-neutral-200 group-hover:text-black dark:group-hover:text-white truncate">
                        {service.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. SEARCH BAR (Directly under Services) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-neutral-500 dark:text-neutral-400 liquid-glass-input hover:text-neutral-900 dark:hover:text-white transition shadow-2xs cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 transition" />
              <span className="text-xs">Search articles...</span>
            </div>
            <kbd className="text-[10px] font-mono text-neutral-400 dark:text-neutral-400 bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.1] rounded px-1.5 py-0.5 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* 4. ARTICLES LIST */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-bold text-[#9CA3AF] dark:text-neutral-400 uppercase tracking-wider">
              ARTICLES
            </span>
            <button
              type="button"
              onClick={onNewReview}
              title="Add new manuscript review"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-1">
            {papers.length === 0 ? (
              <div className="px-3 py-4 text-center rounded-xl bg-white dark:bg-[#111827] border border-dashed border-[#E5E7EB] dark:border-[#1F2937]">
                <FileText className="w-5 h-5 mx-auto text-neutral-300 dark:text-neutral-600 mb-1.5" />
                <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">No manuscripts yet</p>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">Run a review to track your paper</p>
                <button
                  type="button"
                  onClick={onNewReview}
                  className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Start Review</span>
                </button>
              </div>
            ) : (
              papers.map((paper) => {
                const isSelected = paper.id === activePaperId;
                return (
                  <div key={paper.id} className="space-y-0.5 group/article">
                    <div
                      onClick={() => {
                        onSelectPaper(paper.id);
                        onSelectView("overview");
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                        isSelected && activeView === "overview"
                          ? "liquid-glass-tab-active font-semibold text-[#111827] dark:text-white"
                          : isSelected
                          ? "bg-blue-600/10 dark:bg-blue-500/20 font-medium text-blue-700 dark:text-blue-300 border border-blue-500/20"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                        <FileText
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? "text-blue-600 dark:text-blue-400" : "text-neutral-500 dark:text-neutral-400"
                          }`}
                        />
                        <span className="truncate">{paper.shortName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {paper.isEligibleForReview === false ? (
                          paper.ineligibilityReason === "already_published" ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              PUB
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              N/A
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 border border-black/[0.06] dark:border-white/[0.1]">
                            {paper.score ?? 0}%
                          </span>
                        )}
                        {onDeletePaper && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePaper(paper, e);
                            }}
                            title="Delete manuscript project"
                            className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-500/10 transition opacity-0 group-hover/article:opacity-100 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status notification when selected for ineligible papers */}
                    {isSelected && paper.isEligibleForReview === false && (
                      <div className="pl-4 pr-2 py-1 space-y-0.5">
                        {paper.ineligibilityReason === "already_published" ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1.5 rounded-lg border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate">Already Published</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 font-medium bg-amber-500/10 px-2 py-1.5 rounded-lg border border-amber-500/20">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="truncate">Ineligible Review Type</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub-views list for currently selected paper */}
                    {isSelected && paper.isEligibleForReview !== false && (
                      <div className="pl-4 pr-2 py-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => onSelectView("personas")}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                            activeView === "personas"
                              ? "liquid-glass-tab-active font-semibold text-[#111827] dark:text-white"
                              : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white"
                          }`}
                        >
                          <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="truncate">5-Persona Reviews</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectView("dimensions")}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                            activeView === "dimensions"
                              ? "liquid-glass-tab-active font-semibold text-[#111827] dark:text-white"
                              : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white"
                          }`}
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">6 Scoring Dimensions</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectView("issues")}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                            activeView === "issues"
                              ? "liquid-glass-tab-active font-semibold text-[#111827] dark:text-white"
                              : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white"
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate">Priority Action Items</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectView("journals")}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                            activeView === "journals" || activeView === "recommendations"
                              ? "liquid-glass-tab-active font-semibold text-[#111827] dark:text-white"
                              : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white"
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="truncate">Target Journals</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectView("citations")}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                            activeView === "citations"
                              ? "liquid-glass-tab-active font-semibold text-[#111827] dark:text-white"
                              : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span className="truncate">Citation Integrity Audit</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>
        </div>

        {/* AI DISCLAIMER & USAGE PILL (Positioned in designated sidebar zone above footer) */}
        <div className="px-3 pb-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
          <div ref={disclaimerRef} className="relative group">
            <button
              type="button"
              onClick={() => setShowDisclaimer((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20 transition cursor-pointer shadow-2xs"
              title="View AI Advisory & Publication Disclaimer"
            >
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Disclaimer &amp; Usage</span>
              </div>
              <Info className="w-3.5 h-3.5 text-amber-500/80 dark:text-amber-400/80 shrink-0" />
            </button>

            {/* macOS Liquid Glass Tooltip Popover (Positioned directly above the pill, matching sidebar width) */}
            <div
              className={`absolute bottom-full mb-2.5 left-0 right-0 w-full rounded-2xl p-3.5 bg-white/95 dark:bg-[#151D2A]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_20px_45px_-10px_rgba(0,0,0,0.22),0_0_0_1px_rgba(255,255,255,0.7)_inset] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.12)_inset] z-50 text-left space-y-2.5 transition-all duration-200 ${
                showDisclaimer
                  ? "opacity-100 pointer-events-auto translate-y-0"
                  : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 translate-y-1"
              }`}
            >
              {/* macOS Popover Pointer Notch (pointing down to the pill) */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] w-2.5 h-2.5 rotate-45 bg-white/95 dark:bg-[#151D2A]/95 border-r border-b border-black/[0.08] dark:border-white/[0.12]" />

              {/* Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-[#0F172A] dark:text-white truncate">
                    AI Advisory &amp; Disclaimer
                  </h4>
                  <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium block truncate">
                    Scholarly Decision Support
                  </span>
                </div>
              </div>

              {/* Body Content */}
              <div className="space-y-2 text-[10.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                <div className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                  <p>
                    <strong className="text-[#0F172A] dark:text-white font-semibold">Caution:</strong> Generative AI can make errors or hallucinate. Independently verify all citations, methodological critiques, and findings.
                  </p>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1" />
                  <p>
                    <strong className="text-[#0F172A] dark:text-white font-semibold">Supporting Only:</strong> Assistive pre-submission diagnostic simulation; does not replace domain expertise or ethical review.
                  </p>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1" />
                  <p>
                    <strong className="text-[#0F172A] dark:text-white font-semibold">No Guarantee:</strong> No automated system guarantees manuscript acceptance; editorial decisions rest solely with journal editors and reviewers.
                  </p>
                </div>
              </div>

              {/* Footer badge */}
              <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-[9.5px] text-neutral-400 dark:text-neutral-500">
                <span>COPE &amp; ICMJE</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Local</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER: App Version (left) + Model Pill & Settings (right) */}
      <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
        <span className="font-semibold text-neutral-400 dark:text-neutral-500 text-[11px] pl-1 select-none">
          v0.1.0
        </span>
        <button
          type="button"
          onClick={onOpenSettings}
          title={
            connectionStatus === "connected"
              ? "AI Connected - Provider Settings"
              : connectionStatus === "connecting"
              ? "Connecting to AI..."
              : "Connect AI - Provider Settings"
          }
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition shadow-2xs cursor-pointer text-xs font-medium ${
            connectionStatus === "connected"
              ? "border-[#86efac] dark:border-[#065f46] bg-[#f0fdf4] dark:bg-[#064e3b]/30 text-[#065f46] dark:text-[#34d399] hover:bg-[#dcfce7] dark:hover:bg-[#064e3b]/50 hover:border-[#4ade80]"
              : connectionStatus === "connecting"
              ? "border-[#fde68a] dark:border-[#78350f] bg-[#fffbeb] dark:bg-[#78350f]/30 text-[#92400e] dark:text-[#fbbf24] hover:bg-[#fef3c7] hover:border-[#fcd34d]"
              : "border-[#fecaca] dark:border-[#7f1d1d] bg-[#fef2f2] dark:bg-[#7f1d1d]/30 text-[#991b1b] dark:text-[#f87171] hover:bg-[#fee2e2] hover:border-[#fca5a5]"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              connectionStatus === "connected"
                ? "bg-[#10b981]"
                : connectionStatus === "connecting"
                ? "bg-[#f59e0b] animate-pulse"
                : "bg-[#ef4444]"
            }`}
          />
          <span className="truncate max-w-[110px]">
            {connectionLabel}
          </span>
          <Settings
            className={`w-3.5 h-3.5 shrink-0 ${
              connectionStatus === "connected"
                ? "text-[#047857] dark:text-[#34d399]"
                : connectionStatus === "connecting"
                ? "text-[#b45309] dark:text-[#fbbf24]"
                : "text-[#dc2626] dark:text-[#f87171]"
            }`}
          />
        </button>
      </div>
      </div>
    </aside>
  );
}
