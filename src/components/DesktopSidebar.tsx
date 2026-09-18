"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Settings, PanelLeft } from "lucide-react";
import { isDesktopApp } from "@/lib/desktop";
import { EditorialTriageOutcome } from "@/lib/types";
import {
  type TimeCategory,
  type GroupedPapers,
  getTimeCategory,
  groupPapersByTime,
  buildSidebarServices,
} from "./sidebar/sidebarUtils";
import { SidebarCollapsedView } from "./sidebar/SidebarCollapsedView";
import { SidebarPaperList } from "./sidebar/SidebarPaperList";
import { SidebarServicesList } from "./sidebar/SidebarServicesList";
import { SidebarDisclaimerPopover } from "./sidebar/SidebarDisclaimerPopover";

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
  ineligibilityReason?: "already_published" | "non_academic_document" | "scope_mismatch";
  isPublished?: boolean;
  publishedJournal?: string;
  editorialTriage?: EditorialTriageOutcome;
  targetJournalEvaluation?: any;
  isDeskReject?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export { getTimeCategory, groupPapersByTime };
export type { TimeCategory, GroupedPapers };

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
  onDeleteMultiplePapers?: (papers: PaperItem[]) => void;
  onGoHome?: () => void;
  selectedPaperIds?: Set<string>;
  onToggleSelectPaper?: (id: string) => void;
  onClearSelectedPapers?: () => void;
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
  onDeleteMultiplePapers,
  onGoHome,
  selectedPaperIds: controlledSelectedPaperIds,
  onToggleSelectPaper,
  onClearSelectedPapers,
}: DesktopSidebarProps) {
  const [localSelectedPaperIds, setLocalSelectedPaperIds] = useState<Set<string>>(new Set());
  const selectedPaperIds = controlledSelectedPaperIds ?? localSelectedPaperIds;

  const handleToggleSelect = (paperId: string) => {
    if (onToggleSelectPaper) {
      onToggleSelectPaper(paperId);
    } else {
      setLocalSelectedPaperIds((prev) => {
        const next = new Set(prev);
        if (next.has(paperId)) next.delete(paperId);
        else next.add(paperId);
        return next;
      });
    }
  };

  const handleClearSelection = () => {
    if (onClearSelectedPapers) {
      onClearSelectedPapers();
    } else {
      setLocalSelectedPaperIds(new Set());
    }
  };

  // Auto-prune any selected IDs when papers are removed or deleted
  useEffect(() => {
    const validIds = new Set(papers.map((p) => p.id));
    setLocalSelectedPaperIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set<string>();
      for (const id of prev) {
        if (validIds.has(id)) next.add(id);
      }
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [papers]);

  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isFirstRender = useRef(true);
  const prevCollapsedRef = useRef(isCollapsed);

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

  const groupedPapers = useMemo(() => {
    return groupPapersByTime(papers);
  }, [papers]);

  const services = useMemo(() => {
    return buildSidebarServices({
      onSelectService,
      onSelectView,
      onNewReview,
    });
  }, [onSelectService, onSelectView, onNewReview]);

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
      <SidebarCollapsedView
        isCollapsed={isCollapsed}
        isTransitioning={isTransitioning}
        onToggleCollapse={onToggleCollapse}
        activePaperId={activePaperId}
        activeView={activeView}
        papers={papers}
        groupedPapers={groupedPapers}
        services={services}
        connectionStatus={connectionStatus}
        connectionLabel={connectionLabel}
        onSelectPaper={onSelectPaper}
        onSelectView={onSelectView}
        onNewReview={onNewReview}
        onOpenSettings={onOpenSettings}
        onDeletePaper={onDeletePaper}
      />

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
        {/* 1. COMPANY HEADER: Logo + Title + Collapse Button (Desktop only: web mode shows this in DesktopHeader) */}
        {isDesktopApp() && (
          <div className="p-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="h-[46px] flex items-center justify-between px-2 py-1.5 rounded-xl liquid-glass-card shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0 select-none">
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
                    Research &amp; Review Suite
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
        )}

        {/* SCROLLABLE MAIN CONTENT: ARTICLES LIST */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 [scrollbar-width:thin]">
          <SidebarPaperList
            papers={papers}
            groupedPapers={groupedPapers}
            activePaperId={activePaperId}
            activeView={activeView}
            selectedPaperIds={selectedPaperIds}
            onToggleSelectPaper={handleToggleSelect}
            onClearSelection={handleClearSelection}
            onSelectPaper={onSelectPaper}
            onSelectView={onSelectView}
            onNewReview={onNewReview}
            onDeleteMultiplePapers={onDeleteMultiplePapers}
          />
        </div>

        {/* 2. DOCKED BOTTOM SECTION: SERVICES & DISCLAIMER */}
        <div className="px-3 pt-2 pb-1 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2 shrink-0">
          <SidebarServicesList
            services={services}
            servicesExpanded={servicesExpanded}
            onToggleServicesExpanded={() => setServicesExpanded((prev) => !prev)}
            activePaperId={activePaperId}
          />
          <SidebarDisclaimerPopover />
        </div>

        {/* FOOTER: App Version (left) + Model Pill & Settings (right) */}
        <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <span className="font-semibold text-neutral-400 dark:text-neutral-500 text-[11px] pl-1 select-none">
            v0.3.97
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
