"use client";

import React from "react";
import {
  Sidebar as SidebarIcon,
  X,
  Plus,
  FileText,
  Zap,
  RefreshCw,
  Settings,
} from "lucide-react";
import { PaperItem } from "./DesktopSidebar";

interface DesktopHeaderProps {
  openTabs: PaperItem[];
  activePaperId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
  isConnected: boolean;
  isLoading?: boolean;
  activeModelName?: string | null;
  latencyMs?: number | null;
  onOpenSettings: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function DesktopHeader({
  openTabs,
  activePaperId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  isConnected,
  isLoading = false,
  activeModelName,
  latencyMs,
  onOpenSettings,
  onToggleSidebar,
  sidebarOpen = true,
}: DesktopHeaderProps) {
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
      <div className="flex-1 h-full flex items-center overflow-x-auto min-w-0 px-1 scrollbar-none">
        <div className="flex items-center gap-1 h-full py-1">
          {openTabs.map((paper) => {
            const isActive = paper.id === activePaperId;
            return (
              <div
                key={paper.id}
                onClick={() => onSelectTab(paper.id)}
                title={paper.title}
                className={`group flex items-center gap-2 h-[30px] px-3 rounded-lg text-xs transition cursor-pointer max-w-[200px] border shrink-0 ${
                  isActive
                    ? "bg-white text-[#111827] font-medium border-[#E5E7EB] shadow-xs"
                    : "bg-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/60 border-transparent"
                }`}
              >
                <FileText
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? "text-blue-600" : "text-neutral-400 group-hover:text-neutral-600"
                  }`}
                />
                <span className="truncate text-xs">{paper.shortName}</span>
                <button
                  type="button"
                  title="Close tab"
                  onClick={(e) => onCloseTab(paper.id, e)}
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

      {/* RIGHT CONTROLS: AI Status & Settings */}
      <div className="flex items-center gap-2 px-3 shrink-0 border-l border-[#E5E7EB] bg-white h-full">
        {isLoading ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200 text-neutral-500 text-xs font-semibold tracking-wide transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3 h-3 animate-spin text-neutral-400" />
            <span>Checking...</span>
          </button>
        ) : !isConnected ? (
          <button
            type="button"
            onClick={onOpenSettings}
            title="No AI API connection. Click to configure API keys."
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] text-[#991B1B] text-xs font-semibold tracking-wide transition cursor-pointer shadow-2xs"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-[#EF4444]" />
            <span>Not Connected</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenSettings}
            title="Click to configure AI Engine & Models"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ECFDF5] border border-[#A7F3D0] hover:bg-[#D1FAE5] text-[#065F46] text-xs font-semibold tracking-wide transition cursor-pointer shadow-2xs"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>{activeModelName || "AI MODEL"}</span>
            {latencyMs !== undefined && latencyMs !== null && (
              <span className="text-emerald-700/80 font-mono text-[11px] flex items-center">
                ( <Zap className="w-3 h-3 text-amber-500 fill-amber-500 inline mr-0.5" />
                {latencyMs}ms )
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
