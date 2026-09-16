import React, { useState } from "react";
import { BarChart3 } from "lucide-react";
import { DimensionRadarChart } from "@/components/charts/DimensionRadarChart";
import type { DimensionScore, ScoreDimension } from "@/lib/types";

interface DashboardDimensionsSectionProps {
  dimensions: Record<string, DimensionScore>;
}

export const DashboardDimensionsSection: React.FC<DashboardDimensionsSectionProps> = ({
  dimensions,
}) => {
  const [selectedRadarDimension, setSelectedRadarDimension] = useState<ScoreDimension | null>(null);
  const dimEntries = Object.entries(dimensions) as [string, DimensionScore][];

  if (dimEntries.length === 0) {
    return (
      <div className="rounded-3xl liquid-glass-card p-6 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
        <BarChart3 className="w-5 h-5 text-neutral-400" />
        <span>Dimensional scoring is calibrated during pre-submission AI evaluation.</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
          <span>The 6 Evaluation Dimensions (1–5 Scale)</span>
        </h2>
        <span className="text-xs text-[#64748B] dark:text-neutral-400">Calibrated against top-tier standards</span>
      </div>

      {/* Interactive 6-Dimension Radar / Spider Chart */}
      <DimensionRadarChart
        dimensions={dimensions}
        selectedDimension={selectedRadarDimension}
        onSelectDimension={(dim) => {
          setSelectedRadarDimension(dim);
          const el = document.getElementById(`dimension-card-${dim}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dimEntries.map(([key, dim]) => (
          <div
            key={key}
            id={`dimension-card-${key}`}
            className={`rounded-3xl liquid-glass-card liquid-glass-card-interactive p-5 space-y-3.5 flex flex-col justify-between transition-all duration-300 ${
              selectedRadarDimension === key
                ? "ring-2 ring-blue-500 shadow-md"
                : ""
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-xs font-bold text-[#0F172A] dark:text-white truncate" title={dim.label}>
                    {dim.label}
                  </span>
                  {dim.source && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 border ${
                      dim.source === "llm"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                    }`}>
                      {dim.source === "llm" ? "AI" : "Heuristic"}
                    </span>
                  )}
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-extrabold shrink-0 whitespace-nowrap ml-2 border ${
                  dim.score >= 4
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                    : dim.score === 3
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                }`}>
                  {dim.score} / 5
                </span>
              </div>
              <p className="text-xs text-[#475569] dark:text-neutral-300 leading-relaxed font-medium">
                {dim.verdict}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
              {dim.strengths && dim.strengths.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[#166534] dark:text-emerald-400 uppercase tracking-wider block mb-1">
                    STRENGTHS:
                  </span>
                  <ul className="space-y-1 text-xs text-[#334155] dark:text-neutral-300 pl-3 list-disc">
                    {dim.strengths.map((s, i) => (
                      <li key={i} className="leading-relaxed">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {dim.vulnerabilities && dim.vulnerabilities.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[#DC2626] dark:text-rose-400 uppercase tracking-wider block mb-1">
                    VULNERABILITIES:
                  </span>
                  <ul className="space-y-1 text-xs text-[#B91C1C] dark:text-rose-300 pl-3 list-disc">
                    {dim.vulnerabilities.map((v, i) => (
                      <li key={i} className="leading-relaxed">
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
