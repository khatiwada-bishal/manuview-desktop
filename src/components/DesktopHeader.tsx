"use client";

import React from "react";
import {
  Sidebar as SidebarIcon,
  X,
  Plus,
  FileText,
  Compass,
  CheckCircle2,
  ShieldCheck,
  Layers,
  MessageSquare,
  Sparkles,
  ChevronDown,
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
  onNewTab: () => void;
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
  onNewTab,
  onToggleSidebar,
  sidebarOpen = true,
}: DesktopHeaderProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState<number>(800);
  const [overflowMenuOpen, setOverflowMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Measure tab bar width dynamically
  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Close overflow dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOverflowMenuOpen(false);
      }
    };
    if (overflowMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [overflowMenuOpen]);

  // Tab allocation: dynamically calculate how many tabs adjust in the width
  const reservedWithoutOverflow = 44; // + button (30px) + margins
  const reservedWithOverflow = 104; // + button + overflow indicator button
  const minTabWidth = 140; // minimum comfortable width for a tab

  let visibleTabs: TabItem[] = openTabs;
  let overflowTabs: TabItem[] = [];

  const totalNeededAll = openTabs.length * minTabWidth + reservedWithoutOverflow;
  if (totalNeededAll > containerWidth && openTabs.length > 1) {
    const availableForTabs = Math.max(minTabWidth, containerWidth - reservedWithOverflow);
    const maxVisibleCount = Math.max(1, Math.floor(availableForTabs / minTabWidth));

    if (maxVisibleCount < openTabs.length) {
      const activeIdx = openTabs.findIndex((t) => t.id === activeTabId);
      if (activeIdx === -1 || activeIdx < maxVisibleCount) {
        visibleTabs = openTabs.slice(0, maxVisibleCount);
        overflowTabs = openTabs.slice(maxVisibleCount);
      } else {
        // Active tab is outside the initial visible slice; keep activeTab visible!
        const head = openTabs.slice(0, maxVisibleCount - 1);
        const activeTab = openTabs[activeIdx];
        visibleTabs = [...head, activeTab];
        overflowTabs = openTabs.filter(
          (t) => !visibleTabs.some((vt) => vt.id === t.id)
        );
      }
    }
  }

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

      {/* CENTER: BROWSER-STYLE TAB BAR (with dynamic width adjustment & overflow handling) */}
      <div
        ref={containerRef}
        data-tauri-drag-region
        className="flex-1 h-full flex items-end pb-1 overflow-x-auto min-w-0 px-2 macos-scrollbar"
      >
        <div className="flex items-center gap-1 h-[42px]">
          {visibleTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
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

          {/* Overflow Indicator (+N button with macOS-styled popover menu) */}
          {overflowTabs.length > 0 && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setOverflowMenuOpen((prev) => !prev)}
                title={`${overflowTabs.length} more tabs`}
                className={`h-[32px] px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer mb-0.5 border ${
                  overflowMenuOpen
                    ? "bg-white text-[#111827] border-[#E5E7EB] shadow-xs"
                    : "bg-neutral-200/80 hover:bg-neutral-300/80 text-neutral-700 border-transparent"
                }`}
              >
                <span>+{overflowTabs.length}</span>
                <ChevronDown
                  className={`w-3 h-3 text-neutral-500 transition-transform duration-150 ${
                    overflowMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {overflowMenuOpen && (
                <div className="absolute left-0 mt-1 w-64 rounded-xl bg-white border border-[#E5E7EB] shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-[#E5E7EB] flex items-center justify-between">
                    <span>Overflow Tabs</span>
                    <span className="font-mono text-neutral-500">{overflowTabs.length}</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto macos-scrollbar py-1">
                    {overflowTabs.map((tab) => {
                      const isAct = tab.id === activeTabId;
                      return (
                        <div
                          key={tab.id}
                          onClick={() => {
                            onSelectTab(tab.id);
                            setOverflowMenuOpen(false);
                          }}
                          className={`group flex items-center justify-between px-3 py-2 hover:bg-neutral-100 transition cursor-pointer ${
                            isAct ? "bg-neutral-50 text-blue-600 font-medium" : "text-neutral-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                            {getTabIcon(tab, isAct)}
                            <span className="truncate text-xs">{tab.shortName || tab.title}</span>
                          </div>
                          <button
                            type="button"
                            title="Close tab"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCloseTab(tab.id, e);
                            }}
                            className="p-1 rounded-md hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New Tab Button */}
          <button
            type="button"
            onClick={onNewTab}
            title="Open new manuscript review"
            className="h-[30px] w-[30px] flex items-center justify-center rounded-lg hover:bg-neutral-200/80 text-neutral-500 hover:text-neutral-800 transition cursor-pointer shrink-0 ml-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
