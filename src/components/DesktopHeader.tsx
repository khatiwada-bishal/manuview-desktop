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
        default:
          return <FileText className={`w-3.5 h-3.5 shrink-0 ${activeClass}`} />;
      }
    }
    return <FileText className={`w-3.5 h-3.5 shrink-0 ${activeClass}`} />;
  };

  return (
    <header
      data-tauri-drag-region
      className="h-11 border-b border-[#E5E7EB] bg-[#F3F4F6] flex items-center select-none shrink-0 z-20"
    >
      {/* LEFT CONTROLS (Window Traffic Light Spacer + Sidebar Toggle) */}
      <div
        className={`h-full flex items-center border-r border-[#E5E7EB] bg-[#F9FAFB] transition-all duration-150 shrink-0 ${
          sidebarOpen ? "w-64 px-3" : "w-auto px-3"
        }`}
      >
        {/* macOS traffic light spacer */}
        <div className="w-[68px] shrink-0" />

        {/* Sidebar Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="p-1.5 rounded-md hover:bg-[#E5E7EB] text-neutral-500 hover:text-neutral-800 transition cursor-pointer"
          >
            <SidebarIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* CENTER: BROWSER-STYLE TAB BAR */}
      <div
        data-tauri-drag-region
        className="flex-1 h-full flex items-center overflow-x-auto min-w-0 px-2 scrollbar-none"
      >
        <div className="flex items-center gap-1 h-full py-1">
          {openTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                title={tab.title}
                className={`group flex items-center gap-2 h-[30px] px-3 rounded-lg text-xs transition cursor-pointer max-w-[210px] border shrink-0 ${
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

          {/* New Tab Button */}
          <button
            type="button"
            onClick={onNewTab}
            title="Open new manuscript review"
            className="h-[28px] w-[28px] flex items-center justify-center rounded-lg hover:bg-neutral-200/80 text-neutral-500 hover:text-neutral-800 transition cursor-pointer shrink-0 ml-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
