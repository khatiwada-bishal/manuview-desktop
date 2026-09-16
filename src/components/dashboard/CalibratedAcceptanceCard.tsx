import React from "react";
import { BarChart3, ChevronDown, AlertTriangle, Sparkles, ShieldAlert } from "lucide-react";
import { SegmentedReadinessGauge } from "@/components/charts/SegmentedReadinessGauge";
import { DecisionDistributionBar } from "@/components/charts/DecisionDistributionBar";
import type { CalibratedAcceptanceRating } from "@/lib/types";

interface CalibratedAcceptanceCardProps {
  calibratedAcceptance: CalibratedAcceptanceRating;
  targetJournal?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export const CalibratedAcceptanceCard: React.FC<CalibratedAcceptanceCardProps> = ({
  calibratedAcceptance,
  targetJournal,
  isExpanded,
  onToggle,
}) => {
  if (!calibratedAcceptance) return null;

  const band = calibratedAcceptance.readinessBand || "Competitive / Moderate Readiness";

  const outcomeColor =
    band === "Desk Reject Hazard"
      ? "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
      : band === "Substantial Revision Needed"
      ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
      : band === "Competitive / Moderate Readiness"
      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
      : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";

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
            <BarChart3 className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                Pre-Submission Editorial Readiness &amp; Risk Assessment
              </h3>
            </div>
            <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
              Evaluated against {targetJournal || "target journal"} scope, empirical completeness, reference integrity, and review rigor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${outcomeColor}`}>
            {band}
          </span>
          <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-[#1E293B] flex items-center justify-center text-neutral-500 dark:text-neutral-400 ml-1 shrink-0">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-2 border-t border-[#E2E8F0] dark:border-[#1F2937] space-y-5 animate-fade-in">
          {/* Interactive Segmented Readiness Gauge */}
          <SegmentedReadinessGauge
            currentBand={band}
            calibrationAdvisory={calibratedAcceptance.calibrationAdvisory}
          />

          {/* 100% Stacked Expected Decision Distribution */}
          {calibratedAcceptance.decisionDistribution && (
            <DecisionDistributionBar
              distribution={calibratedAcceptance.decisionDistribution}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Readiness Band Card */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-neutral-400">
                Editorial Readiness Tier
              </span>
              <div className="pt-1">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black border ${outcomeColor}`}>
                  {band}
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block pt-1 font-medium">
                {calibratedAcceptance.decisionOutcome}
              </span>
            </div>

            {/* Target Venue Historical Baseline Selectivity */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-neutral-400">
                Target Venue Baseline Selectivity
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                  {calibratedAcceptance.baselineJournalRatePercent ? `${calibratedAcceptance.baselineJournalRatePercent}%` : "20–30%"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  catalog base rate
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block pt-1">
                Historical published acceptance rate for {targetJournal || "discipline benchmark"}
              </span>
            </div>

            {/* Composite Quality Score */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-neutral-400">
                Composite Academic Quality
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">
                  {calibratedAcceptance.overallScore}/100
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  multidimensional index
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block pt-1">
                Weighted across 6 peer-review dimensions
              </span>
            </div>
          </div>

          {/* Primary Hazard & Key Opportunity Callouts */}
          {(calibratedAcceptance.primaryHazard || calibratedAcceptance.keyOpportunity) && (
            <div className="space-y-2 pt-2 border-t border-[#E2E8F0] dark:border-[#1F2937]">
              {calibratedAcceptance.primaryHazard && (
                <div className="p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-900 dark:text-rose-200 block uppercase tracking-wider text-[10px]">
                      Primary Bottleneck Suppressing Acceptance:
                    </span>
                    <span className="text-rose-800 dark:text-rose-300 font-medium">
                      {calibratedAcceptance.primaryHazard}
                    </span>
                  </div>
                </div>
              )}
              {calibratedAcceptance.keyOpportunity && (
                <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-blue-900 dark:text-blue-200 block uppercase tracking-wider text-[10px]">
                      Highest-Leverage Pre-Submission Opportunity:
                    </span>
                    <span className="text-blue-800 dark:text-blue-300 font-medium">
                      {calibratedAcceptance.keyOpportunity}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scientific Calibration & Methodology Advisory */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-[#334155] text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
            <div className="flex items-center gap-2 font-bold text-neutral-800 dark:text-neutral-200">
              <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Methodological Integrity &amp; Calibration Advisory</span>
            </div>
            <p className="leading-relaxed">
              {calibratedAcceptance.calibrationAdvisory ||
                "Quantitative acceptance probability percentages are suppressed because pre-submission predictive calibration has not been statistically validated against real-world journal accept/reject datasets. Evaluated on editorial scope, methodological completeness, and verified reference integrity."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
