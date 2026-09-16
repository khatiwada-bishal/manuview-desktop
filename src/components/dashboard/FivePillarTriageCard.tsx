import React from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, ChevronDown, Sparkles } from "lucide-react";
import type { EditorialTriageOutcome } from "@/lib/types";

interface FivePillarTriageCardProps {
  triage?: EditorialTriageOutcome;
  isDeskReject?: boolean;
  isAccordion?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const FivePillarTriageCard: React.FC<FivePillarTriageCardProps> = ({
  triage,
  isDeskReject = false,
  isAccordion = true,
  isExpanded = true,
  onToggle,
}) => {
  const pillars = triage?.pillarEvaluations;
  if (!pillars || pillars.length === 0) return null;

  const classification = triage?.triageClassification || (isDeskReject ? "fatal_desk_reject" : "cleared_for_review");

  const badgeClasses =
    classification === "fatal_desk_reject"
      ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
      : classification === "actionable_desk_reject_risk"
      ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
      : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";

  const badgeLabel =
    classification === "fatal_desk_reject"
      ? "⛔ Fatal Desk Reject Barrier"
      : classification === "actionable_desk_reject_risk"
      ? "⚠️ Actionable Desk Reject Risk"
      : "✅ Cleared Editorial Screening";

  const content = (
    <>
      {/* 6-Pillar Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pillars.map((p, idx) => {
          const isFatal = p.status === "fatal_barrier";
          const isWarn = p.status === "warning";
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border text-xs space-y-2 shadow-2xs ${
                isFatal
                  ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                  : isWarn
                  ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60"
                  : "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/70 dark:border-emerald-800/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 min-w-0 flex-1">
                  {isFatal ? (
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  ) : isWarn ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate">{p.title}</span>
                </span>
                <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border whitespace-nowrap ${
                  isFatal
                    ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/60 dark:text-rose-200"
                    : isWarn
                    ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200"
                    : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200"
                }`}>
                  {isFatal ? "Fatal" : isWarn ? "Warning" : "Pass"}
                </span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                {p.verdict}
              </p>
              {(p.editorialContext || p.baseRateContext) && (
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 italic">
                  Editorial Context: {p.editorialContext || p.baseRateContext}
                </div>
              )}
              {p.actionablePreSubmissionFix && (
                <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] text-[11px] space-y-0.5">
                  <span className="font-bold text-[#0F172A] dark:text-white block">Pre-Submission Fix:</span>
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    {p.actionablePreSubmissionFix}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Editorial Salvage Roadmap */}
      {triage?.salvageRoadmap && triage.salvageRoadmap.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              Editorial Salvage Roadmap (Prioritized Action Sequence)
            </span>
          </div>
          <div className="space-y-1.5">
            {triage.salvageRoadmap.map((step, sIdx) => (
              <div key={sIdx} className="text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                  {sIdx + 1}.
                </span>
                <span className="leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (!isAccordion) {
    return (
      <div className="rounded-3xl liquid-glass-card p-6 sm:p-7 space-y-5 border border-black/[0.08] dark:border-white/[0.1]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0] dark:border-[#1F2937]">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                Handling Editor Screening Matrix (6-Pillar Triage)
              </h3>
            </div>
            <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
              Handling editor pre-review triage evaluating fatal desk-reject barriers vs. actionable submission hazards across empirical base rates
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeClasses}`}>
            {badgeLabel}
          </span>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="rounded-3xl liquid-glass-card border border-black/[0.08] dark:border-white/[0.1] overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition select-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
              Handling Editor Screening Matrix (6-Pillar Triage)
            </h3>
            <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
              Handling editor pre-review triage evaluating fatal desk-reject barriers vs. actionable submission hazards across empirical base rates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeClasses}`}>
            {badgeLabel}
          </span>
          <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-[#1E293B] flex items-center justify-center text-neutral-500 dark:text-neutral-400 ml-1 shrink-0">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-2 border-t border-[#E2E8F0] dark:border-[#1F2937] space-y-5 animate-fade-in">
          {content}
        </div>
      )}
    </div>
  );
};
