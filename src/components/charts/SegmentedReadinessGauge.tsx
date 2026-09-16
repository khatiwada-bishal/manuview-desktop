"use client";

import React, { useState } from "react";
import { READINESS_BAND_THEME } from "@/lib/charts/theme";
import { ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, Info } from "lucide-react";

interface SegmentedReadinessGaugeProps {
  currentBand: string; // e.g. "Competitive / Moderate Readiness"
  calibrationAdvisory?: string;
  className?: string;
}

const BANDS = [
  "Desk Reject Hazard",
  "Substantial Revision Needed",
  "Competitive / Moderate Readiness",
  "Strong Submission Readiness",
] as const;

export function SegmentedReadinessGauge({
  currentBand,
  calibrationAdvisory,
  className = "",
}: SegmentedReadinessGaugeProps) {
  const [inspectedBand, setInspectedBand] = useState<string | null>(null);

  const activeTheme = READINESS_BAND_THEME[currentBand] || READINESS_BAND_THEME["Competitive / Moderate Readiness"];
  const activeIndex = activeTheme.stepIndex;

  const displayBand = inspectedBand || currentBand;
  const displayTheme = READINESS_BAND_THEME[displayBand] || activeTheme;

  return (
    <div
      className={`p-5 rounded-2xl bg-white dark:bg-[#161F30] border border-black/[0.08] dark:border-white/[0.1] space-y-4 ${className}`}
      role="region"
      aria-label="Editorial Readiness Tier Assessment"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-neutral-400">
            Editorial Readiness Spectrum
          </span>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
            (Qualitative Tier Gauge)
          </span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border self-start sm:self-auto ${activeTheme.badgeClass}`}>
          {activeTheme.label}
        </span>
      </div>

      {/* Segmented Progress Track */}
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-2">
          {BANDS.map((bandName, idx) => {
            const theme = READINESS_BAND_THEME[bandName];
            const isCurrent = idx === activeIndex;
            const isPassed = idx < activeIndex;
            const isInspected = inspectedBand === bandName;

            let segmentClass = "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 opacity-50";
            if (isCurrent) {
              segmentClass =
                idx === 0
                  ? "bg-rose-500 border-rose-600 ring-2 ring-rose-200 dark:ring-rose-900/50 shadow-xs"
                  : idx === 1
                  ? "bg-amber-500 border-amber-600 ring-2 ring-amber-200 dark:ring-amber-900/50 shadow-xs"
                  : idx === 2
                  ? "bg-blue-600 border-blue-700 ring-2 ring-blue-200 dark:ring-blue-900/50 shadow-xs"
                  : "bg-emerald-500 border-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-900/50 shadow-xs";
            } else if (isPassed) {
              segmentClass = "bg-neutral-300 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 opacity-70";
            }

            return (
              <button
                key={bandName}
                type="button"
                onMouseEnter={() => setInspectedBand(bandName)}
                onMouseLeave={() => setInspectedBand(null)}
                className={`h-3 rounded-lg border transition-all duration-200 cursor-pointer ${segmentClass} ${
                  isInspected ? "scale-y-125" : ""
                }`}
                title={`${theme.label}: ${theme.description}`}
                aria-label={theme.label}
              />
            );
          })}
        </div>

        {/* Step Labels */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {BANDS.map((bandName, idx) => {
            const isCurrent = idx === activeIndex;
            return (
              <span
                key={bandName}
                className={`text-[10px] font-semibold leading-tight block ${
                  isCurrent
                    ? "text-[#0F172A] dark:text-white font-bold"
                    : "text-neutral-400 dark:text-neutral-500"
                }`}
              >
                {idx === 0
                  ? "Desk Hazard"
                  : idx === 1
                  ? "Major Revisions"
                  : idx === 2
                  ? "Competitive"
                  : "Strong Ready"}
              </span>
            );
          })}
        </div>
      </div>

      {/* Dynamic Tier Context Card */}
      <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1E293B] border border-neutral-200/80 dark:border-neutral-800 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#0F172A] dark:text-white flex items-center gap-1.5">
            {displayBand === "Desk Reject Hazard" ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            ) : displayBand === "Substantial Revision Needed" ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            ) : displayBand === "Competitive / Moderate Readiness" ? (
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{displayTheme.label}</span>
          </span>
          {inspectedBand && inspectedBand !== currentBand && (
            <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 italic">
              (Previewing Tier Criteria)
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#475569] dark:text-neutral-300 leading-relaxed">
          {displayTheme.description}
        </p>
      </div>

      {calibrationAdvisory && (
        <div className="flex items-start gap-2 pt-1 text-[11px] text-[#64748B] dark:text-neutral-400 italic leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-400" />
          <span>{calibrationAdvisory}</span>
        </div>
      )}
    </div>
  );
}
