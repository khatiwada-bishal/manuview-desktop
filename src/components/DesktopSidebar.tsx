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

  return (
    <aside className="w-64 bg-[#F9FAFB] border-r border-[#E5E7EB] flex flex-col h-full select-none shrink-0 text-[#1F2937]">
      {/* 1. COMPANY HEADER: ManuView Desktop */}
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
          <button
            type="button"
            onClick={onOpenSettings}
            title="Desktop Settings"
            className="p-1 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition"
          >
            <Settings className="w-3.5 h-3.5" />
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

        {/* 4. ARTICLES LIST (Renamed from WORKSPACES) */}
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
                  {/* Article button -> Clicking opens/activates tab */}
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
                    <FileText className={`w-4 h-4 shrink-0 ${isSelected ? "text-blue-600" : "text-neutral-500"}`} />
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

      {/* FOOTER: Status & Connection */}
      <div className="p-3 border-t border-[#E5E7EB] bg-white text-[11px] text-neutral-500 flex items-center justify-between">
        <span className="font-semibold text-neutral-700">v0.1.0</span>
        {isConnected ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {provider?.toUpperCase() || "AI READY"}
          </span>
        ) : (
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Connect AI
          </button>
        )}
      </div>
    </aside>
  );
}
