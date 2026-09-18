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
  Loader2,
} from "lucide-react";
import type { PaperItem, DesktopActiveView } from "@/components/DesktopSidebar";
import type { GroupedPapers } from "./sidebarUtils";

interface SidebarPaperListProps {
  papers: PaperItem[];
  groupedPapers: GroupedPapers[];
  activePaperId: string | null;
  activeView: DesktopActiveView;
  selectedPaperIds: Set<string>;
  isScanning?: boolean;
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
  isScanning = false,
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
              disabled={isScanning}
              onClick={onNewReview}
              title={isScanning ? "A manuscript review is currently running in the background" : "Start Review"}
              className={`mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                isScanning
                  ? "opacity-50 cursor-not-allowed bg-neutral-200 dark:bg-neutral-800 text-neutral-400"
                  : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer"
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>{isScanning ? "Reviewing..." : "Start Review"}</span>
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
                const isReviewing = paper.status === "reviewing";
                const isFailed = paper.status === "failed";
                const isDeskReject =
                  !isReviewing &&
                  !isFailed &&
                  (paper.editorialTriage?.outcome === "desk_reject" ||
                    paper.ineligibilityReason === "scope_mismatch" ||
                    paper.targetJournalEvaluation?.isDisciplinaryMismatch === true ||
                    paper.isDeskReject === true);

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
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                        isSelectedInBatch
                          ? "bg-blue-600/15 dark:bg-blue-500/25 border border-blue-500/40 text-blue-700 dark:text-blue-300 font-semibold"
                          : isSelected && activeView === "overview"
                          ? "bg-white dark:bg-white/10 shadow-xs border border-black/[0.06] dark:border-white/[0.08] font-bold text-[#0F172A] dark:text-white"
                          : isSelected
                          ? "bg-white/80 dark:bg-white/5 border border-black/[0.05] dark:border-white/[0.07] font-semibold text-[#0F172A] dark:text-white shadow-2xs"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#0F172A] dark:hover:text-white border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1.5">
                        {/* Squircle container with icon OR hover checkbox */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelectPaper(paper.id);
                          }}
                          className={`relative w-6 h-6 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition shadow-2xs ${
                            isReviewing
                              ? "bg-blue-600 text-white animate-pulse"
                              : isFailed
                              ? "bg-rose-500 text-white"
                              : isDeskReject
                              ? "bg-rose-500 text-white"
                              : paper.isEligibleForReview === false && paper.ineligibilityReason === "already_published"
                              ? "bg-emerald-500 text-white"
                              : paper.isEligibleForReview === false
                              ? "bg-amber-500 text-white"
                              : isSelected
                              ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                              : "bg-blue-500/90 text-white"
                          }`}
                          title={isSelectedInBatch ? "Deselect article" : "Select article"}
                        >
                          {/* Checkbox visible when batch selected or hover */}
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              isSelectedInBatch
                                ? "bg-blue-600 text-white opacity-100 scale-100"
                                : "border border-neutral-400 dark:border-neutral-500 hover:border-blue-500 bg-white dark:bg-[#1e293b] opacity-0 group-hover/article:opacity-100 scale-95 hover:scale-100"
                            }`}
                          >
                            {isSelectedInBatch ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <Square className="w-3 h-3 opacity-40 text-neutral-400 hover:text-blue-600" />
                            )}
                          </div>

                          {/* Squircle Icon visible when NOT batch selected */}
                          {!isSelectedInBatch && (
                            <div className="absolute inset-0 flex items-center justify-center transition-opacity group-hover/article:opacity-0">
                              {isReviewing ? (
                                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                              ) : isFailed ? (
                                <AlertCircle className="w-3.5 h-3.5 text-white" />
                              ) : isDeskReject ? (
                                <ShieldAlert className="w-3.5 h-3.5 text-white" />
                              ) : paper.isEligibleForReview === false && paper.ineligibilityReason === "already_published" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-white" />
                              )}
                            </div>
                          )}
                        </div>

                        <span className="truncate font-medium">
                          {paper.shortName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isReviewing ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
                            <span>{paper.scanPercent ? `${paper.scanPercent}%` : "Reviewing"}</span>
                          </span>
                        ) : isFailed ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                            Failed
                          </span>
                        ) : isDeskReject ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                            Desk
                          </span>
                        ) : paper.isEligibleForReview === false ? (
                          paper.ineligibilityReason === "already_published" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                              PUB
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                              N/A
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                            {paper.score ?? 0}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status notification when selected for reviewing or failed papers */}
                    {selectedPaperIds.size === 0 && isSelected && isReviewing && (
                      <div className="pl-4 pr-2 py-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-blue-700 dark:text-blue-400 font-medium bg-blue-500/10 px-2 py-1.5 rounded-lg border border-blue-500/20">
                          <Loader2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 animate-spin" />
                          <span className="truncate">{paper.scanStep || "Reviewing in background..."}</span>
                        </div>
                      </div>
                    )}

                    {selectedPaperIds.size === 0 && isSelected && isFailed && (
                      <div className="pl-4 pr-2 py-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-rose-700 dark:text-rose-400 font-medium bg-rose-500/10 px-2 py-1.5 rounded-lg border border-rose-500/20">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span className="truncate">{paper.scanError?.title || "Review interrupted"}</span>
                        </div>
                      </div>
                    )}

                    {/* Status notification when selected for ineligible papers */}
                    {selectedPaperIds.size === 0 && isSelected && !isReviewing && !isFailed && paper.isEligibleForReview === false && !isDeskReject && (
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

                    {/* Sub-views list for currently selected paper (only for completed papers) */}
                    {isSelected && !isReviewing && !isFailed && (paper.isEligibleForReview !== false || isDeskReject) && (
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
