"use client";

import React, { useState } from "react";
import { Info, Globe, RefreshCw, BookOpen } from "lucide-react";
import { useJournalScope } from "@/lib/journal-scope-service";

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

  return (
    <div
      className={`relative inline-flex items-center group ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label="Target journal scope details"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className="p-0.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-help focus:outline-none"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {/* Popover / Tooltip */}
      <div
        className={`absolute left-0 bottom-full mb-2 w-72 sm:w-80 p-3 bg-white dark:bg-[#161F30] rounded-xl shadow-xl border border-neutral-200/90 dark:border-[#334155] text-neutral-700 dark:text-neutral-200 text-xs transition-all duration-150 z-50 pointer-events-none ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
        }`}
      >
        {hasJournal ? (
          isLoading && !scope ? (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 py-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span className="text-[11px] font-medium">Verifying aims &amp; scope in scholarly registry...</span>
            </div>
          ) : scope ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-[#0F172A] dark:text-white leading-snug">
                    {scope.publisher ? `${scope.publisher} • ` : ""}{scope.primaryDiscipline}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {scope.impactMetric && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/50">
                        {scope.impactMetric}
                      </span>
                    )}
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono border border-blue-200/60 dark:border-blue-800/60">
                      {scope.source === "openalex" ? "Live Registry" : scope.source === "catalog" ? "Curated" : "Inferred"}
                    </span>
                  </div>
                </div>
              </div>

              {scope.keyConcepts && scope.keyConcepts.length > 0 && (
                <div className="text-[11px] text-[#64748B] dark:text-neutral-400 pt-1 border-t border-neutral-100 dark:border-[#1F2937]">
                  <span className="font-medium text-neutral-600 dark:text-neutral-300">Topics:</span>{" "}
                  {scope.keyConcepts.slice(0, 5).join(", ")}
                </div>
              )}

              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 pt-1">
                Used to evaluate scope compatibility and journal-specific desk rejection criteria.
              </p>
            </div>
          ) : (
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Journal aims and scope will be inferred during compatibility check.
            </div>
          )
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-[#0F172A] dark:text-white">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Target Journal Scope</span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
              Select a target journal to evaluate aims &amp; scope compatibility, peer reviewer personas, and desk-rejection risk.
            </p>
          </div>
        )}

        {/* Arrow pointer */}
        <div className="absolute left-3 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white dark:border-t-[#161F30]" />
      </div>
    </div>
  );
}
