"use client";

import React from "react";
import {
  X,
  FileText,
  Compass,
  CheckCircle2,
  ShieldCheck,
  Layers,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export interface TabItem {
  id: string;
  type: "article" | "tool";
  title: string;
  shortName: string;
  toolType?: string;
}

interface DesktopHeaderProps {
  openTabs: TabItem[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
  onNewTab?: () => void;
  isConnected?: boolean;
  isLoading?: boolean;
  activeModelName?: string | null;
  latencyMs?: number | null;
  onOpenSettings?: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function DesktopHeader({
  openTabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  sidebarOpen = true,
}: DesktopHeaderProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tabsScrollRef = React.useRef<HTMLDivElement>(null);
  const activeTabRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [hasOverflow, setHasOverflow] = React.useState(false);

  // Window drag handler for Tauri native window
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // Only primary (left) button
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    // Don't drag if interacting with buttons, inputs, tabs, or non-draggable elements
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea") ||
      target.closest("[data-no-drag]")
    ) {
      return;
    }
    try {
      const appWin = getCurrentWindow();
      if (appWin) {
        appWin.startDragging();
      }
    } catch {
      // Browser preview fallback
    }
  };

  const checkScroll = React.useCallback(() => {
    const scrollEl = tabsScrollRef.current;
    const containerEl = containerRef.current;
    if (!scrollEl || !containerEl) return;

    // Available width in top bar tab area
    const availableWidth = containerEl.clientWidth;
    // Actual width required by all tabs combined
    const contentWidth = scrollEl.scrollWidth;

    // Tabs only overflow when their combined width genuinely exceeds the available top bar width
    const overflow = contentWidth > availableWidth + 4;
    setHasOverflow(overflow);

    if (overflow) {
      setCanScrollLeft(scrollEl.scrollLeft > 4);
      setCanScrollRight(scrollEl.scrollLeft + scrollEl.clientWidth < scrollEl.scrollWidth - 4);
    } else {
      setCanScrollLeft(false);
      setCanScrollRight(false);
    }
  }, []);

  React.useEffect(() => {
    checkScroll();
    const containerEl = containerRef.current;
    const scrollEl = tabsScrollRef.current;
    if (!containerEl || !scrollEl) return;

    const observer = new ResizeObserver(() => checkScroll());
    observer.observe(containerEl);
    observer.observe(scrollEl);
    window.addEventListener("resize", checkScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, openTabs]);

  // Smooth scroll active tab into view when activeTabId changes
  React.useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [activeTabId]);

  const handleScrollLeft = () => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollBy({ left: -220, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollBy({ left: 220, behavior: "smooth" });
    }
  };

  const getTabIcon = (tab: TabItem, isActive: boolean) => {
    const activeClass = isActive ? "text-blue-600" : "text-neutral-400 group-hover:text-neutral-600";
    if (tab.type === "tool") {
      switch (tab.toolType) {
        case "journal-fit":
          return <Compass className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-emerald-600" : "text-neutral-400"}`} />;
        case "reference-checker":
          return <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-teal-600" : "text-neutral-400"}`} />;
        case "citation-claim":
          return <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-amber-600" : "text-neutral-400"}`} />;
        case "prisma":
          return <Layers className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-purple-600" : "text-neutral-400"}`} />;
        case "cover-letter":
          return <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-indigo-600" : "text-neutral-400"}`} />;
        case "response-builder":
          return <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-rose-600" : "text-neutral-400"}`} />;
        case "ai-review":
        case "pre-submission":
          return <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-600" : "text-neutral-400"}`} />;
        default:
          return <FileText className={`w-3.5 h-3.5 shrink-0 ${activeClass}`} />;
      }
    }
    return <FileText className={`w-3.5 h-3.5 shrink-0 ${activeClass}`} />;
  };

  return (
    <header
      data-tauri-drag-region
      onMouseDown={handleHeaderMouseDown}
      className="h-[52px] border-b border-[#E5E7EB] bg-[#F3F4F6] flex select-none shrink-0 z-20 cursor-default relative"
    >
      {/* macOS traffic light spacer (covers window traffic controls, leaves comfortable gap) */}
      <div data-tauri-drag-region className="w-[84px] h-full shrink-0" />

      {/* CENTER: BROWSER-STYLE SCROLLABLE TAB BAR WITH OVERFLOW ARROWS */}
      <div
        ref={containerRef}
        data-tauri-drag-region
        className="flex-1 h-full flex items-end pb-1 min-w-0 px-2 relative"
      >
        {/* Left Scroll Arrow (Shown ONLY when tabs genuinely overflow and can scroll left) */}
        {hasOverflow && canScrollLeft && (
          <button
            type="button"
            onClick={handleScrollLeft}
            title="Scroll tabs left"
            className="w-6 h-[38px] flex items-center justify-center rounded-md hover:bg-neutral-200/80 text-neutral-600 transition shrink-0 z-10 mr-1 cursor-pointer bg-white/90 border border-[#E5E7EB] shadow-2xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Scrollable Tabs Container (Takes full available width, only scrolls on true overflow) */}
        <div
          ref={tabsScrollRef}
          onScroll={checkScroll}
          data-tauri-drag-region
          className="flex-1 flex items-center gap-1 h-[42px] min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth overflow-x-auto"
        >
          {openTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                data-no-drag
                ref={isActive ? activeTabRef : undefined}
                onClick={() => onSelectTab(tab.id)}
                title={tab.title}
                className={`group flex items-center gap-2 h-[38px] px-3 rounded-lg text-xs transition cursor-pointer max-w-[210px] min-w-[120px] border shrink-0 ${
                  isActive
                    ? "bg-white text-[#111827] font-medium border-[#E5E7EB] shadow-xs"
                    : "bg-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/60 border-transparent"
                }`}
              >
                {getTabIcon(tab, isActive)}
                <span className="truncate text-xs">{tab.shortName}</span>
                <button
                  type="button"
                  title="Close tab"
                  onClick={(e) => onCloseTab(tab.id, e)}
                  className={`p-0.5 rounded-md hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 transition opacity-0 group-hover:opacity-100 ${
                    isActive ? "opacity-70" : ""
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Scroll Arrow (Shown ONLY when tabs genuinely overflow and can scroll right) */}
        {hasOverflow && canScrollRight && (
          <button
            type="button"
            onClick={handleScrollRight}
            title="Scroll tabs right"
            className="w-6 h-[38px] flex items-center justify-center rounded-md hover:bg-neutral-200/80 text-neutral-600 transition shrink-0 z-10 ml-1 cursor-pointer bg-white/90 border border-[#E5E7EB] shadow-2xs"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Dedicated Window Drag Region at the far right */}
        <div
          data-tauri-drag-region
          onMouseDown={handleHeaderMouseDown}
          className="w-4 h-full shrink-0"
        />
      </div>
    </header>
  );
}
