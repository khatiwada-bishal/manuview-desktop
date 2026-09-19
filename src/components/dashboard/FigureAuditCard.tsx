import React from "react";
import {
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Layers,
  Table as TableIcon,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import type { DisplayItemAuditReport } from "@/lib/types";

interface FigureAuditCardProps {
  displayItemAudit?: DisplayItemAuditReport;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const FigureAuditCard: React.FC<FigureAuditCardProps> = ({
  displayItemAudit,
  isExpanded = true,
  onToggle,
}) => {
  if (!displayItemAudit) return null;

  const {
    figuresInText = [],
    tablesInText = [],
    figureCaptions = [],
    tableCaptions = [],
    consistencyIssues = [],
    statisticalLegendChecks = [],
    summary,
    complianceStatus,
  } = displayItemAudit;

  const phantomIssues = consistencyIssues.filter((i) => i.type === "phantom");
  const orphanIssues = consistencyIssues.filter((i) => i.type === "orphan");
  const sequenceIssues = consistencyIssues.filter((i) => i.type === "non_sequential");
  const legendIssues = statisticalLegendChecks.filter((c) => c.issues.length > 0);

  const getStatusBadge = () => {
    switch (complianceStatus) {
      case "pass":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Display Items Validated
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Pre-Flight Warnings ({consistencyIssues.length + legendIssues.length})
          </span>
        );
      case "needs_attention":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-full">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Inconsistencies Detected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-3xl liquid-glass-card border border-black/[0.08] dark:border-white/[0.1] overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition select-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              complianceStatus === "needs_attention"
                ? "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                : complianceStatus === "warning"
                ? "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                : "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                Display Items, Figures &amp; Visual Pre-Flight Auditor
              </h2>
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                Visual Inspection
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
              Callout consistency, orphan/phantom figure detection, sequential numbering, and statistical legend verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {getStatusBadge()}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 sm:px-7 pb-6 sm:pb-7 pt-1 border-t border-black/[0.05] dark:border-white/[0.06] space-y-6">
          {/* Top Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Figures</span>
                <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-bold text-neutral-900 dark:text-white">
                  {summary.totalFigures}
                </span>
                <span className="text-[11px] text-neutral-500">
                  {figureCaptions.length} captions / {figuresInText.length} in text
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Tables</span>
                <TableIcon className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-bold text-neutral-900 dark:text-white">
                  {summary.totalTables}
                </span>
                <span className="text-[11px] text-neutral-500">
                  {tableCaptions.length} captions / {tablesInText.length} in text
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Sequence</span>
                <Layers className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                {summary.isSequential ? (
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Sequential
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Gaps / Skips
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Error Bar Legends</span>
                <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                {summary.legendDeficiencyCount === 0 ? (
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Compliant
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> {summary.legendDeficiencyCount} Undefined
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Consistency Issues Alerts */}
          {consistencyIssues.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Callout &amp; Caption Discrepancies ({consistencyIssues.length})
              </h3>
              <div className="space-y-2">
                {phantomIssues.map((issue, idx) => (
                  <div
                    key={`phantom-${idx}`}
                    className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3"
                  >
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                        Phantom Display Item: {issue.message}
                      </p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                        Manuscripts with uncaptioned figures or phantom citations fail pre-flight checks at top journals.
                      </p>
                    </div>
                  </div>
                ))}

                {orphanIssues.map((issue, idx) => (
                  <div
                    key={`orphan-${idx}`}
                    className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Orphan Display Item: {issue.message}
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                        Ensure every figure and table is explicitly introduced and discussed in the narrative.
                      </p>
                    </div>
                  </div>
                ))}

                {sequenceIssues.map((issue, idx) => (
                  <div
                    key={`seq-${idx}`}
                    className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Numbering Sequence: {issue.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistical Legend Details */}
          {statisticalLegendChecks.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Statistical Caption Legends &amp; Rigor
              </h3>
              <div className="space-y-2">
                {statisticalLegendChecks.map((legend, idx) => {
                  const hasIssue = legend.issues.length > 0;
                  return (
                    <div
                      key={`legend-${idx}`}
                      className={`p-3.5 rounded-2xl border ${
                        hasIssue
                          ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40"
                          : "bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-neutral-800"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">
                            Figure {legend.number} Caption
                          </span>
                          {legend.hasErrorBarsMentioned && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                legend.hasErrorBarDefinition
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                              }`}
                            >
                              {legend.hasErrorBarDefinition
                                ? "Error Bars Defined (SD/SEM/CI)"
                                : "Error Bars Undefined!"}
                            </span>
                          )}
                          {legend.hasSampleSizeMentioned && (
                            <span className="text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                              Sample Size (n) Stated
                            </span>
                          )}
                          {legend.hasPValueThresholds && (
                            <span className="text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full">
                              p-value / Significance Defined
                            </span>
                          )}
                        </div>
                      </div>

                      {legend.captionSnippet && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 italic mt-1.5 line-clamp-2">
                          "{legend.captionSnippet}"
                        </p>
                      )}

                      {legend.issues.map((msg, mIdx) => (
                        <div
                          key={`msg-${mIdx}`}
                          className="mt-2 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>{msg}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clean Success State */}
          {consistencyIssues.length === 0 && legendIssues.length === 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Flawless Display Item &amp; Callout Hygiene
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  All {summary.totalFigures} figures and {summary.totalTables} tables are introduced in strictly sequential order, with no missing captions or orphaned items.
                </p>
              </div>
            </div>
          )}

          {/* Editorial Guidelines Callout */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
              <strong className="font-semibold">Editorial Desk-Reject Prevention:</strong> Leading journals (e.g., Nature, Cell, IEEE, Elsevier) reject or return manuscripts at technical check if figures are not cited in chronological order in the main text or if error bars omit explicit definitions (e.g. mean ± SD vs mean ± SEM).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
