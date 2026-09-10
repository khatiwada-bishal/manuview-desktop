"use client";

import React, { useState } from "react";
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
  PanelLeft,
} from "lucide-react";

export type DesktopActiveView =
  | "overview"
  | "personas"
  | "citations"
  | "recommendations";

export interface PaperItem {
  id: string;
  title: string;
  shortName: string;
  journal: string;
  score: number;
}

interface DesktopSidebarProps {
  papers: PaperItem[];
  activePaperId: string | null;
  activeView: DesktopActiveView;
  isConnected?: boolean;
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
}

export function DesktopSidebar({
  papers,
  activePaperId,
  activeView,
  isConnected = false,
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
}: DesktopSidebarProps) {
  const [servicesExpanded, setServicesExpanded] = useState(true);

  const SERVICES = [
    {
      id: "ai-review",
      name: "Pre-Submission AI Review",
      description: "4-Persona reviewer simulation",
      icon: Sparkles,
      color: "text-blue-600 bg-blue-50",
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
      color: "text-emerald-600 bg-emerald-50",
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
      color: "text-teal-600 bg-teal-50",
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
      color: "text-amber-600 bg-amber-50",
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
      color: "text-purple-600 bg-purple-50",
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
      color: "text-indigo-600 bg-indigo-50",
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
      color: "text-rose-600 bg-rose-50",
      action: () => {
        if (onSelectService) onSelectService("response-builder");
        else onSelectView("personas");
      },
    },
  ];

  // -------------------------------------------------------------
  // COLLAPSED SIDEBAR VIEW
  // -------------------------------------------------------------
  if (isCollapsed) {
    return (
      <aside className="w-[68px] bg-[#F9FAFB] border-r border-[#E5E7EB] flex flex-col h-full select-none shrink-0 text-[#1F2937] transition-all duration-200 ease-in-out relative z-40 overflow-visible">
        {/* LOGO: Hover reveals expand icon */}
        <div className="p-3 border-b border-[#E5E7EB]/70 flex justify-center">
          <div className="relative group flex justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] hover:border-neutral-300 shadow-xs flex items-center justify-center transition cursor-pointer relative overflow-hidden"
            >
              {/* Logo "M" */}
              <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-serif font-black text-sm shadow-xs transition-all duration-150 group-hover:opacity-0 group-hover:scale-75">
                M
              </div>
              {/* Expand sidebar icon on hover */}
              <div className="absolute inset-0 flex items-center justify-center text-[#0F172A] opacity-0 group-hover:opacity-100 transition-all duration-150 group-hover:scale-100">
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
          <div className="w-8 h-px bg-[#E5E7EB] mx-auto" />

          {/* Search Icon */}
          <div className="relative group flex justify-center">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-[#E5E7EB] hover:border-neutral-300 text-neutral-500 hover:text-neutral-800 transition shadow-2xs cursor-pointer"
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
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "bg-white border border-[#E5E7EB] hover:border-neutral-300 text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Submenu popover on hover */}
            <div className="absolute left-full top-0 ml-2 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-xl p-2.5 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-3 before:content-['']">
              <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-[#E5E7EB]">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Articles ({papers.length})
                </span>
                <button
                  type="button"
                  onClick={onNewReview}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 [scrollbar-width:thin]">
                {papers.length === 0 ? (
                  <div className="text-xs text-neutral-400 py-2 text-center">
                    No articles yet
                  </div>
                ) : (
                  papers.map((paper) => {
                    const isSelected = paper.id === activePaperId;
                    return (
                      <button
                        key={paper.id}
                        type="button"
                        onClick={() => {
                          onSelectPaper(paper.id);
                          onSelectView("overview");
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-[#F3F4F6] font-semibold text-[#111827]"
                            : "hover:bg-neutral-50 text-neutral-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <FileText
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? "text-blue-600" : "text-neutral-400"
                            }`}
                          />
                          <div className="truncate">
                            <div className="truncate font-medium text-xs text-[#111827]">
                              {paper.shortName}
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate">
                              {paper.journal}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200 shrink-0">
                          {paper.score}%
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER: Compact Settings Pill */}
        <div className="p-3 border-t border-[#E5E7EB] bg-white flex justify-center">
          <div className="relative group">
            <button
              type="button"
              onClick={onOpenSettings}
              title="AI Settings"
              className="w-10 h-10 rounded-full border border-[#86efac] bg-[#f0fdf4] text-[#065f46] hover:bg-[#dcfce7] hover:border-[#4ade80] transition shadow-2xs flex items-center justify-center cursor-pointer relative"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-[#10b981]" : "bg-amber-400"
                } absolute top-1.5 right-1.5`}
              />
              <Settings className="w-4 h-4 text-[#047857]" />
            </button>
            <div className="absolute left-full bottom-1 ml-3 px-2.5 py-1 bg-[#111827] text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span>{activeModelName || (isConnected ? "gemini-1.5-flash" : "Connect AI")}</span>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#111827]" />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // -------------------------------------------------------------
  // EXPANDED SIDEBAR VIEW
  // -------------------------------------------------------------
  return (
    <aside className="w-64 bg-[#F9FAFB] border-r border-[#E5E7EB] flex flex-col h-full select-none shrink-0 text-[#1F2937] transition-all duration-200 ease-in-out relative z-30">
      {/* 1. COMPANY HEADER: Logo + Title + Collapse Button */}
      <div className="p-3 border-b border-[#E5E7EB]/70">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-serif font-black text-sm shadow-xs shrink-0">
              M
            </div>
            <div className="truncate min-w-0">
              <div className="font-bold text-xs text-[#0F172A] tracking-tight">
                ManuView Desktop
              </div>
              <div className="text-[10px] text-neutral-400 font-medium">
                Research & Review Suite
              </div>
            </div>
          </div>
          {/* Collapse sidebar icon replacing the gear icon */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="p-1 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SCROLLABLE MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* 2. SERVICES LIST */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <button
              type="button"
              onClick={() => setServicesExpanded(!servicesExpanded)}
              className="flex items-center gap-1 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider hover:text-neutral-700 transition cursor-pointer"
            >
              {servicesExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <span>SERVICES</span>
            </button>
            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.2 rounded">
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
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#E5E7EB]/60 hover:text-[#111827] text-neutral-700 transition text-left cursor-pointer group"
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${service.color}`}
                    >
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="truncate min-w-0">
                      <div className="font-medium text-xs text-neutral-800 group-hover:text-black truncate">
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
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-neutral-500 bg-white border border-[#E5E7EB] hover:border-neutral-300 hover:text-neutral-900 transition shadow-2xs cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 transition" />
              <span className="text-xs">Search articles...</span>
            </div>
            <kbd className="text-[10px] font-mono text-neutral-400 bg-neutral-100 border border-neutral-200 rounded px-1.5 py-0.5 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* 4. ARTICLES LIST */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
              ARTICLES
            </span>
            <button
              type="button"
              onClick={onNewReview}
              title="Add new manuscript review"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium text-blue-600 hover:bg-blue-50 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-1">
            {papers.map((paper) => {
              const isSelected = paper.id === activePaperId;
              return (
                <div key={paper.id} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPaper(paper.id);
                      onSelectView("overview");
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                      isSelected && activeView === "overview"
                        ? "bg-[#E5E7EB] font-semibold text-[#111827] shadow-2xs"
                        : isSelected
                        ? "bg-[#F3F4F6] font-medium text-[#1F2937]"
                        : "text-[#4B5563] hover:bg-[#E5E7EB]/40 hover:text-[#111827]"
                    }`}
                  >
                    <FileText
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? "text-blue-600" : "text-neutral-500"
                      }`}
                    />
                    <span className="truncate">{paper.shortName}</span>
                  </button>

                  {/* Sub-views for active article */}
                  {isSelected && (
                    <div className="pl-4 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => onSelectView("personas")}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                          activeView === "personas"
                            ? "bg-[#E5E7EB] font-semibold text-[#111827]"
                            : "text-[#4B5563] hover:bg-[#E5E7EB]/40 hover:text-[#111827]"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">4-Persona Reviews</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectView("citations")}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                          activeView === "citations"
                            ? "bg-[#E5E7EB] font-semibold text-[#111827]"
                            : "text-[#4B5563] hover:bg-[#E5E7EB]/40 hover:text-[#111827]"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">CrossRef Audit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectView("recommendations")}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition text-left cursor-pointer ${
                          activeView === "recommendations"
                            ? "bg-[#E5E7EB] font-semibold text-[#111827]"
                            : "text-[#4B5563] hover:bg-[#E5E7EB]/40 hover:text-[#111827]"
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span className="truncate">
                          {paper.journal.split(" ")[0]} Recommendations
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER: App Version (left) + Model Pill & Settings (right) */}
      <div className="p-3 border-t border-[#E5E7EB] bg-white flex items-center justify-between">
        <span className="font-semibold text-neutral-400 text-[11px] pl-1 select-none">
          v0.1.0
        </span>
        <button
          type="button"
          onClick={onOpenSettings}
          title="AI Provider Settings"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#86efac] bg-[#f0fdf4] text-[#065f46] hover:bg-[#dcfce7] hover:border-[#4ade80] transition shadow-2xs cursor-pointer text-xs font-medium"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-[#10b981]" : "bg-amber-400"
            } shrink-0`}
          />
          <span className="truncate max-w-[110px]">
            {activeModelName || (isConnected ? "gemini-1.5-flash" : "Connect AI")}
          </span>
          <Settings className="w-3.5 h-3.5 text-[#047857] shrink-0" />
        </button>
      </div>
    </aside>
  );
}
