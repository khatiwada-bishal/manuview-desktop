import React, { useState } from "react";
import { Info, Globe, RefreshCw, BookOpen, ExternalLink, Award, DollarSign } from "lucide-react";
import { useJournalScope, openJournalWebsite } from "@/lib/journal-scope-service";

interface JournalInfoTooltipProps {
  journal?: string;
  className?: string;
}

export default function JournalInfoTooltip({
  journal = "",
  className = "",
}: JournalInfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { scope, isLoading } = useJournalScope(journal);

  const hasJournal = Boolean(journal?.trim());

  const handleOpenWebsite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasJournal) {
      openJournalWebsite(journal, scope?.homepageUrl);
    }
  };

  return (
    <div
      className={`relative inline-flex items-center group ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label="Target journal scope details"
        onClick={handleOpenWebsite}
        className="p-0.5 rounded-full text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer focus:outline-none"
        title={hasJournal ? `Click to open official website for ${journal}` : "Target journal information"}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {/* Popover / Tooltip */}
      <div
        className={`absolute left-0 bottom-full mb-2 w-80 p-3.5 bg-white dark:bg-[#161F30] rounded-2xl shadow-xl border border-neutral-200/90 dark:border-[#334155] text-neutral-700 dark:text-neutral-200 text-xs transition-all duration-150 z-50 ${
          isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-1 pointer-events-none"
        }`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {hasJournal ? (
          isLoading && !scope ? (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 py-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span className="text-[11px] font-medium">Verifying aims &amp; scope in OpenAlex registry...</span>
            </div>
          ) : scope ? (
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-[#0F172A] dark:text-white leading-snug">
                    {scope.officialName || journal}
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-neutral-400 truncate">
                    {scope.publisher || "Academic Publisher"} {scope.countryCode ? `• ${scope.countryCode}` : ""}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    {scope.twoYearMeanCitedness !== undefined ? (
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-800/60">
                        2-Yr Cited: {scope.twoYearMeanCitedness.toFixed(1)}
                      </span>
                    ) : scope.impactMetric ? (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/50">
                        {scope.impactMetric}
                      </span>
                    ) : null}

                    {scope.hIndex !== undefined && (
                      <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200/60 dark:border-purple-800/60 flex items-center gap-0.5">
                        <Award className="w-2.5 h-2.5" />
                        H: {scope.hIndex}
                      </span>
                    )}

                    {scope.isOa && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                        Open Access
                      </span>
                    )}

                    {scope.apcUsd !== undefined && (
                      <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60 flex items-center gap-0.5">
                        <DollarSign className="w-2.5 h-2.5" />
                        {scope.apcUsd ? `$${scope.apcUsd.toLocaleString()}` : "Free"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {scope.keyConcepts && scope.keyConcepts.length > 0 && (
                <div className="text-[11px] text-[#64748B] dark:text-neutral-400 pt-1.5 border-t border-neutral-100 dark:border-[#1F2937]">
                  <span className="font-medium text-neutral-600 dark:text-neutral-300">Topics:</span>{" "}
                  {scope.keyConcepts.slice(0, 4).join(", ")}
                </div>
              )}

              <div className="pt-1.5 border-t border-neutral-100 dark:border-[#1F2937] flex items-center justify-between">
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono border border-emerald-200/60 dark:border-emerald-800/60">
                  OpenAlex Verified
                </span>
                <button
                  type="button"
                  onClick={handleOpenWebsite}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Visit Journal Website</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Journal aims and scope will be evaluated during compatibility check.
              </div>
              <button
                type="button"
                onClick={handleOpenWebsite}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Search Official Journal Website</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-[#0F172A] dark:text-white">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Target Journal Scope</span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
              Select a target journal to retrieve live OpenAlex metrics, acceptance characteristics, and desk-rejection risk.
            </p>
          </div>
        )}

        {/* Arrow pointer */}
        <div className="absolute left-3 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white dark:border-t-[#161F30]" />
      </div>
    </div>
  );
}
