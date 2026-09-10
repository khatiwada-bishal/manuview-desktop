"use client";

import React from "react";
import {
  Sidebar as SidebarIcon,
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
  onToggleSidebar,
  sidebarOpen = true,
}: DesktopHeaderProps) {
  const tabsScrollRef = React.useRef<HTMLDivElement>(null);
  const activeTabRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [hasOverflow, setHasOverflow] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 2;
    setHasOverflow(overflow);
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = tabsScrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => checkScroll());
    observer.observe(el);
    return () => observer.disconnect();
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
      className="h-[52px] border-b border-[#E5E7EB] bg-[#F3F4F6] flex select-none shrink-0 z-20"
    >
      {/* LEFT CONTROLS (Window Traffic Light Spacer + Sidebar Toggle + Sidebar Separation) */}
      <div
        className={`h-full flex items-end pb-1 border-r border-[#E5E7EB] bg-[#F9FAFB] transition-all duration-150 shrink-0 ${
          sidebarOpen ? "w-64" : "w-auto"
        }`}
      >
        {/* macOS traffic light spacer (covers 0..88px: traffic lights from x=16..68px with a 20px gap) */}
        <div className="w-[88px] shrink-0" />

        {/* Sidebar Toggle Button (positioned with mb-[6px], zero margin on icon) */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#E5E7EB] text-neutral-500 hover:text-neutral-800 transition cursor-pointer mb-[6px]"
          >
            <SidebarIcon className="w-4 h-4 m-0" strokeWidth={1.75} />
          </button>
        )}

        {!sidebarOpen && <div className="w-3 shrink-0" />}
      </div>

      {/* CENTER: BROWSER-STYLE SCROLLABLE TAB BAR WITH OVERFLOW ARROWS */}
      <div className="flex-1 h-full flex items-end pb-1 min-w-0 px-1 relative">
        {/* Left Scroll Arrow (Shown when tabs overflow) */}
        {hasOverflow && (
          <button
            type="button"
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            title="Scroll tabs left"
            className={`w-6 h-[38px] flex items-center justify-center rounded-md transition shrink-0 z-10 mr-0.5 ${
              canScrollLeft
                ? "hover:bg-neutral-200/80 text-neutral-600 cursor-pointer"
                : "text-neutral-300 cursor-default opacity-40"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Tabs Container (No scrollbar visible) */}
        <div
          ref={tabsScrollRef}
          onScroll={checkScroll}
          data-tauri-drag-region
          className="flex-1 flex items-center gap-1 h-[42px] overflow-x-auto min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
        >
          {openTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
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

        {/* Right Scroll Arrow (Shown when tabs overflow) */}
        {hasOverflow && (
          <button
            type="button"
            onClick={handleScrollRight}
            disabled={!canScrollRight}
            title="Scroll tabs right"
            className={`w-6 h-[38px] flex items-center justify-center rounded-md transition shrink-0 z-10 ml-0.5 ${
              canScrollRight
                ? "hover:bg-neutral-200/80 text-neutral-600 cursor-pointer"
                : "text-neutral-300 cursor-default opacity-40"
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
