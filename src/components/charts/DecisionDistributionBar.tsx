"use client";

import React, { useState } from "react";
import type { DecisionCategoryDistribution } from "@/lib/types";
import { DECISION_CATEGORY_THEME } from "@/lib/charts/theme";
import { AlertCircle, HelpCircle } from "lucide-react";

interface DecisionDistributionBarProps {
  distribution: DecisionCategoryDistribution;
  className?: string;
}

const ORDERED_KEYS: (keyof Pick<
  DecisionCategoryDistribution,
  "p_desk_reject" | "p_reject_after_review" | "p_major_revision" | "p_minor_revision" | "p_accept"
>)[] = [
  "p_desk_reject",
  "p_reject_after_review",
  "p_major_revision",
  "p_minor_revision",
  "p_accept",
];

export function DecisionDistributionBar({
  distribution,
  className = "",
}: DecisionDistributionBarProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const activeKey = hoveredKey || "p_major_revision";
  const activeTheme = DECISION_CATEGORY_THEME[activeKey];
  const activePercent = (distribution as any)[activeKey] ?? 0;

  return (
    <div
      className={`p-5 rounded-2xl bg-white dark:bg-[#161F30] border border-black/[0.08] dark:border-white/[0.1] space-y-4 ${className}`}
      role="region"
      aria-label="Expected Peer-Review Decision Distribution"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-neutral-400">
            Expected Peer-Review Decision Distribution
          </span>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Calibrated likelihood breakdown across editorial and referee decision milestones (100% total)
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 self-start sm:self-auto">
          Confidence: {distribution.confidence?.toUpperCase() || "MEDIUM"}
        </span>
      </div>

      {/* 100% Stacked Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-5 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex overflow-hidden p-0.5 gap-0.5 border border-black/[0.06] dark:border-white/[0.08]">
          {ORDERED_KEYS.map((key) => {
            const val = distribution[key] || 0;
            if (val <= 0) return null;
            const theme = DECISION_CATEGORY_THEME[key];
            const isHovered = hoveredKey === key;

            return (
              <div
                key={key}
                onMouseEnter={() => setHoveredKey(key)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{ width: `${val}%`, backgroundColor: theme.color }}
                className={`h-full first:rounded-l-lg last:rounded-r-lg transition-all duration-200 cursor-pointer ${
                  isHovered ? "brightness-110 scale-y-110 shadow-xs" : "opacity-90 hover:opacity-100"
                }`}
                title={`${theme.label}: ${val}% — ${theme.description}`}
              />
            );
          })}
        </div>

        {/* Dynamic Detail Tooltip Card */}
        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#1E293B] border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: activeTheme?.color }}
            />
            <span className="font-bold text-[#0F172A] dark:text-white">
              {activeTheme?.label}:
            </span>
            <span className="text-[#475569] dark:text-neutral-300 truncate">
              {activeTheme?.description}
            </span>
          </div>
          <span className="font-mono font-extrabold text-sm text-[#0F172A] dark:text-white shrink-0">
            {activePercent}%
          </span>
        </div>
      </div>

      {/* Legend Chips */}
      <div className="flex flex-wrap gap-2 pt-1">
        {ORDERED_KEYS.map((key) => {
          const val = distribution[key] || 0;
          const theme = DECISION_CATEGORY_THEME[key];
          const isHovered = hoveredKey === key;

          return (
            <button
              key={key}
              type="button"
              onMouseEnter={() => setHoveredKey(key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                isHovered
                  ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-400 dark:border-neutral-600 font-bold"
                  : "bg-white dark:bg-[#1E293B] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: theme.color }}
              />
              <span>{theme.shortLabel}</span>
              <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                {val}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Competitive Mid-Tier Notice */}
      {distribution.messy_middle_flag && (
        <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Competitive Mid-Tier Variance Notice</span>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
              {distribution.baseRateDisclaimer ||
                "Submissions in this score range exhibit substantial peer-review variance; final decisions often hinge on reviewer assignment and addressing minor methodological caveats."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
