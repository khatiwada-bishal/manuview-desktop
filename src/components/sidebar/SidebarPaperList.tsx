import React from "react";
import {
  FileText,
  Users,
  CheckCircle2,
  BookOpen,
  Plus,
  BarChart3,
  AlertCircle,
  Trash2,
  ShieldAlert,
  Clock,
  Check,
  X,
  Square,
} from "lucide-react";
import type { PaperItem, DesktopActiveView } from "@/components/DesktopSidebar";
import type { GroupedPapers } from "./sidebarUtils";

interface SidebarPaperListProps {
  papers: PaperItem[];
  groupedPapers: GroupedPapers[];
  activePaperId: string | null;
  activeView: DesktopActiveView;
  selectedPaperIds: Set<string>;
  onToggleSelectPaper: (paperId: string) => void;
  onClearSelection: () => void;
  onSelectPaper: (id: string) => void;
  onSelectView: (view: DesktopActiveView) => void;
  onNewReview: () => void;
  onDeleteMultiplePapers?: (papers: PaperItem[]) => void;
}

export function SidebarPaperList({
  papers,
  groupedPapers,
  activePaperId,
  activeView,
  selectedPaperIds,
  onToggleSelectPaper,
  onClearSelection,
  onSelectPaper,
  onSelectView,
  onNewReview,
  onDeleteMultiplePapers,
}: SidebarPaperListProps) {
  return (
    <div>
      <div className="flex items-center justify-between px-2 mb-1.5">
        <span className="text-[11px] font-bold text-[#9CA3AF] dark:text-neutral-400 uppercase tracking-wider">
          ARTICLES
        </span>
        <div className="flex items-center gap-1">
          {/* Trash can icon button in place of text "Select" */}
          {papers.length > 0 && (
            <button
              type="button"
              disabled={selectedPaperIds.size === 0}
              onClick={() => {
                if (selectedPaperIds.size > 0) {
                  const targets = papers.filter((p) => selectedPaperIds.has(p.id));
                  if (onDeleteMultiplePapers) {
                    onDeleteMultiplePapers(targets);
                  }
                }
              }}
              title={
                selectedPaperIds.size > 0
                  ? `Delete ${selectedPaperIds.size} selected article${selectedPaperIds.size > 1 ? "s" : ""}`
                  : "Hover over file icon to select and delete"
              }
              className={`p-1 rounded text-xs transition cursor-pointer flex items-center gap-1 ${
                selectedPaperIds.size > 0
                  ? "text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 bg-rose-500/10 cursor-pointer active:scale-95 animate-in fade-in"
                  : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 opacity-40 hover:opacity-75 cursor-default"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {selectedPaperIds.size > 0 && (
                <span className="text-[10px] font-bold leading-none">
                  {selectedPaperIds.size}
                </span>
              )}
            </button>
          )}
          {selectedPaperIds.size > 0 && (
            <button
              type="button"
              onClick={onClearSelection}
              title="Clear selection"
              className="p-1 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
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
          groupedPapers.map(({ category, papers: groupPapers }) => (
            <div key={category} className="space-y-1 mb-3 last:mb-0">
              <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5 text-[10px] font-semibold text-[#9CA3AF] dark:text-neutral-400 tracking-wider uppercase">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                  <span>{category}</span>
                </div>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-neutral-500 dark:text-neutral-400">
                  {groupPapers.length}
                </span>
              </div>

              {groupPapers.map((paper) => {
                const isSelected = paper.id === activePaperId;
                const isSelectedInBatch = selectedPaperIds.has(paper.id);
                const isDeskReject =
                  paper.editorialTriage?.outcome === "desk_reject" ||
                  paper.ineligibilityReason === "scope_mismatch" ||
                  paper.targetJournalEvaluation?.isDisciplinaryMismatch === true ||
                  paper.isDeskReject === true;
                return (
                  <div key={paper.id} className="space-y-0.5 group/article">
                    <div
                      onClick={() => {
                        if (selectedPaperIds.size > 0) {
                          onToggleSelectPaper(paper.id);
                        } else {
                          onSelectPaper(paper.id);
                          onSelectView("overview");
                        }
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                        isSelectedInBatch
                          ? "bg-blue-600/15 dark:bg-blue-500/25 border border-blue-500/40 text-blue-700 dark:text-blue-300 font-semibold"
                          : isSelected && activeView === "overview"
                          ? "liquid-glass-tab-active font-semibold text-[#111827] dark:text-white"
                          : isSelected
                          ? "bg-blue-600/10 dark:bg-blue-500/20 font-medium text-blue-700 dark:text-blue-300 border border-blue-500/20"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                        {/* Hover-to-reveal checkbox on file icon */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelectPaper(paper.id);
                          }}
                          className="relative w-4 h-4 shrink-0 flex items-center justify-center cursor-pointer"
                          title={isSelectedInBatch ? "Deselect article" : "Select article"}
                        >
                          {/* Checkbox: visible when selected OR on article hover */}
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                              isSelectedInBatch
                                ? "bg-blue-600 text-white opacity-100 scale-100 shadow-xs"
                                : "border border-neutral-400 dark:border-neutral-500 hover:border-blue-500 bg-white dark:bg-[#1e293b] opacity-0 group-hover/article:opacity-100 scale-95 hover:scale-100 shadow-xs"
                            }`}
                          >
                            {isSelectedInBatch ? (
                              <Check className="w-3 h-3 stroke-[3]" />
                            ) : (
                              <Square className="w-2.5 h-2.5 opacity-30 text-neutral-400 hover:text-blue-600" />
                            )}
                          </div>

                          {/* File icon: visible when NOT selected and NOT hovered */}
                          {!isSelectedInBatch && (
                            <FileText
                              className={`w-4 h-4 absolute inset-0 transition-opacity group-hover/article:opacity-0 ${
                                isSelected ? "text-blue-600 dark:text-blue-400" : "text-neutral-500 dark:text-neutral-400"
                              }`}
                            />
                          )}
                        </div>

                        <span className="truncate">
                          {paper.shortName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isDeskReject ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            Rejected
                          </span>
                        ) : paper.isEligibleForReview === false ? (
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
                      </div>
                    </div>

                    {/* Status notification when selected for ineligible papers */}
                    {selectedPaperIds.size === 0 && isSelected && paper.isEligibleForReview === false && !isDeskReject && (
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
                    {isSelected && (paper.isEligibleForReview !== false || isDeskReject) && (
                      <div className="pl-4 pr-2 py-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => onSelectView("personas")}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition text-left cursor-pointer btn-interactive ${
                            activeView === "personas"
                              ? "liquid-glass-tab-active font-semibold text-[#111827] dark:text-white"
                              : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white"
                          }`}
                        >
                          {isDeskReject ? (
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                          ) : (
                            <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                          <span className="truncate">
                            {isDeskReject
                              ? "Triage & 5-Persona Reviews"
                              : "5-Persona Reviews"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectView("dimensions")}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition text-left cursor-pointer btn-interactive ${
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
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition text-left cursor-pointer btn-interactive ${
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
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition text-left cursor-pointer btn-interactive ${
                            activeView === "journals" || activeView === "recommendations"
                              ? "liquid-glass-tab-active font-semibold text-[#111827] dark:text-white"
                              : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white"
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="truncate">Target Journals</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
