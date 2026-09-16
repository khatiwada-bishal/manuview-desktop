"use client";

import React, { useState, useEffect } from "react";
import type { ScoreDimension, DimensionScore } from "@/lib/types";
import {
  DIMENSION_AXES,
  DIMENSION_LABELS,
  getRadarVertexCoordinate,
  formatPolygonPoints,
} from "@/lib/charts/theme";
import { Info } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/motion";

interface DimensionRadarChartProps {
  dimensions: Record<string, DimensionScore>;
  onSelectDimension?: (dim: ScoreDimension) => void;
  selectedDimension?: ScoreDimension | null;
  className?: string;
  isHeuristicOnly?: boolean;
}

const RADAR_AXIS_CONFIG: Record<
  ScoreDimension,
  {
    lines: [string, string?];
    anchor: "start" | "middle" | "end";
    labelOffsetRadius: number;
    yOffset: number;
  }
> = {
  originality: {
    lines: ["Originality & Novelty"],
    anchor: "middle",
    labelOffsetRadius: 16,
    yOffset: -6,
  },
  broad_interest: {
    lines: ["Broad Subject", "Interest"],
    anchor: "start",
    labelOffsetRadius: 14,
    yOffset: -4,
  },
  claims_vs_evidence: {
    lines: ["Claims vs", "Evidence"],
    anchor: "start",
    labelOffsetRadius: 14,
    yOffset: -4,
  },
  methodology: {
    lines: ["Methodological", "Rigor"],
    anchor: "middle",
    labelOffsetRadius: 18,
    yOffset: 2,
  },
  clarity: {
    lines: ["Presentation &", "Clarity"],
    anchor: "end",
    labelOffsetRadius: 14,
    yOffset: -4,
  },
  prior_work: {
    lines: ["Prior Work", "Context"],
    anchor: "end",
    labelOffsetRadius: 14,
    yOffset: -4,
  },
};

const DIMENSION_CHIP_LABELS: Record<ScoreDimension, string> = {
  originality: "Originality",
  broad_interest: "Broad Scope",
  claims_vs_evidence: "Evidence",
  methodology: "Methodology",
  clarity: "Clarity",
  prior_work: "Prior Work",
};

export function DimensionRadarChart({
  dimensions,
  onSelectDimension,
  selectedDimension,
  className = "",
  isHeuristicOnly = false,
}: DimensionRadarChartProps) {
  const [hoveredDim, setHoveredDim] = useState<ScoreDimension | null>(null);
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(timer);
  }, []);

  // Self-contained geometric coordinate space with generous margins
  const width = 380;
  const height = 300;
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = 78;

  // Concentric guideline webs (1 to 5)
  const gridLevels = [1, 2, 3, 4, 5];

  // Calculate coordinates for manuscript score polygon
  const scoreCoordinates = React.useMemo(() => {
    return DIMENSION_AXES.map((dim, i) => {
      const dimData = dimensions[dim];
      const rawScore = dimData?.score ?? 3;
      const clamped = Math.max(1, Math.min(5, rawScore));
      const targetR = (maxRadius * clamped) / 5;
      const r = (!mounted && !prefersReducedMotion) ? maxRadius * 0.15 : targetR;
      return {
        dim,
        coord: getRadarVertexCoordinate(cx, cy, r, i),
        score: rawScore,
        label: dimData?.label || DIMENSION_LABELS[dim] || dim,
        verdict: dimData?.verdict || "No verdict available",
        source: dimData?.source,
      };
    });
  }, [dimensions, cx, cy, maxRadius, mounted, prefersReducedMotion]);

  const activeFocusDim = hoveredDim || selectedDimension;
  const activeDetail = activeFocusDim
    ? scoreCoordinates.find((s) => s.dim === activeFocusDim)
    : null;

  return (
    <div
      className={`relative flex flex-col lg:flex-row items-center lg:items-stretch justify-between gap-6 p-6 sm:p-7 rounded-3xl liquid-glass-card border border-black/[0.08] dark:border-white/[0.1] overflow-hidden ${className}`}
    >
      {/* Chart SVG Container */}
      <div className="relative w-full max-w-[340px] lg:max-w-[380px] shrink-0 flex items-center justify-center mx-auto select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="Six Evaluation Dimensions Radar Chart"
        >
          {/* Level guidelines */}
          {gridLevels.map((lvl) => {
            const r = (maxRadius * lvl) / 5;
            const pts = DIMENSION_AXES.map((_, i) =>
              getRadarVertexCoordinate(cx, cy, r, i)
            );
            return (
              <g key={`ring-${lvl}`}>
                <polygon
                  points={formatPolygonPoints(pts)}
                  fill={lvl % 2 === 0 ? "currentColor" : "transparent"}
                  stroke="currentColor"
                  strokeWidth={lvl === 5 ? 1.5 : 1}
                  strokeDasharray={lvl === 5 ? "none" : "2,2"}
                  className={`${
                    lvl % 2 === 0
                      ? "text-neutral-500/5 dark:text-neutral-400/5"
                      : ""
                  } stroke-neutral-300 dark:stroke-neutral-700`}
                />
                {/* Scale marker at 12 o'clock */}
                <text
                  x={cx + 4}
                  y={cy - r + 3}
                  className="fill-neutral-400 dark:fill-neutral-500 text-[8px] font-mono select-none"
                >
                  {lvl}
                </text>
              </g>
            );
          })}

          {/* Radial axis lines and labels */}
          {DIMENSION_AXES.map((dim, i) => {
            const end = getRadarVertexCoordinate(cx, cy, maxRadius, i);
            const cfg = RADAR_AXIS_CONFIG[dim];
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const rLabel = maxRadius + cfg.labelOffsetRadius;
            const labelX = cx + rLabel * Math.cos(angle);
            const labelY = cy + rLabel * Math.sin(angle) + cfg.yOffset;
            const isHovered = activeFocusDim === dim;

            return (
              <g
                key={`axis-${dim}`}
                className="cursor-pointer group"
                onClick={() => onSelectDimension?.(dim)}
                onMouseEnter={() => setHoveredDim(dim)}
                onMouseLeave={() => setHoveredDim(null)}
              >
                <line
                  x1={cx}
                  y1={cy}
                  x2={end.x}
                  y2={end.y}
                  stroke="currentColor"
                  strokeWidth={isHovered ? 2 : 1}
                  className={`transition-colors duration-200 ${
                    isHovered
                      ? "stroke-blue-500 dark:stroke-blue-400"
                      : "stroke-neutral-300 dark:stroke-neutral-700"
                  }`}
                />
                {/* Multi-line wrapped axis label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={cfg.anchor}
                  className={`text-[9px] font-bold transition-colors select-none ${
                    isHovered
                      ? "fill-blue-600 dark:fill-blue-400"
                      : "fill-neutral-600 dark:fill-neutral-300 group-hover:fill-neutral-900 dark:group-hover:fill-white"
                  }`}
                >
                  <tspan x={labelX} dy="0">
                    {cfg.lines[0]}
                  </tspan>
                  {cfg.lines[1] && (
                    <tspan x={labelX} dy="11">
                      {cfg.lines[1]}
                    </tspan>
                  )}
                </text>
              </g>
            );
          })}

          {/* Manuscript polygon */}
          <polygon
            points={formatPolygonPoints(scoreCoordinates.map((s) => s.coord))}
            className="fill-blue-500/25 dark:fill-blue-400/30 stroke-blue-600 dark:stroke-blue-400 transition-all duration-300"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Interactive vertex dots */}
          {scoreCoordinates.map((s) => {
            const isHovered = activeFocusDim === s.dim;
            return (
              <circle
                key={`dot-${s.dim}`}
                cx={s.coord.x}
                cy={s.coord.y}
                r={isHovered ? 6 : 4}
                className={`transition-all duration-200 cursor-pointer ${
                  isHovered
                    ? "fill-white stroke-blue-600 stroke-[3px] ring-2 ring-blue-500 shadow-sm"
                    : "fill-blue-600 dark:fill-blue-400 stroke-white dark:stroke-[#0F172A] stroke-2"
                }`}
                onClick={() => onSelectDimension?.(s.dim)}
                onMouseEnter={() => setHoveredDim(s.dim)}
                onMouseLeave={() => setHoveredDim(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400/80 dark:text-neutral-500/80">
            6D Profile
          </span>
        </div>
      </div>

      {/* Right Column: Interactive Drill-down & Dimensional Context */}
      <div className="flex-1 w-full min-w-0 flex flex-col justify-between space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-[#0F172A] dark:text-white truncate">
              Multidimensional Quality Profile
            </h4>
            <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5 leading-relaxed">
              Hover axes to inspect specific verdicts; click to drill to detailed strengths &amp; vulnerabilities
            </p>
          </div>
          {isHeuristicOnly && (
            <span className="shrink-0 self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 whitespace-nowrap">
              Structural Heuristic
            </span>
          )}
        </div>

        {activeDetail ? (
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-2 transition-all duration-300 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-xs text-blue-900 dark:text-blue-200 truncate">
                {activeDetail.label}
              </span>
              <span className="shrink-0 px-2.5 py-0.5 rounded-full font-mono text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                {activeDetail.score} / 5
              </span>
            </div>
            <p className="text-xs text-[#334155] dark:text-neutral-300 leading-relaxed font-medium">
              {activeDetail.verdict}
            </p>
            {onSelectDimension && (
              <button
                type="button"
                onClick={() => onSelectDimension(activeDetail.dim)}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1 inline-block cursor-pointer transition-colors"
              >
                View Strengths &amp; Actionable Vulnerabilities &rarr;
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-neutral-50/80 dark:bg-[#161F30] border border-neutral-200/80 dark:border-neutral-800 space-y-2 transition-all duration-300">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <Info className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>Interactive Dimensional Guidance</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Top-tier selective venues prioritize balanced dimensional geometry. Deficits in methodology or claims-vs-evidence represent leading causes of peer-review rejection.
            </p>
          </div>
        )}

        {/* Dimension Quick Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {scoreCoordinates.map((s) => {
            const isSelected = selectedDimension === s.dim;
            const scoreColor =
              s.score >= 4
                ? "border-emerald-200 text-emerald-700 dark:text-emerald-300 dark:border-emerald-800"
                : s.score === 3
                ? "border-amber-200 text-amber-700 dark:text-amber-300 dark:border-amber-800"
                : "border-rose-200 text-rose-700 dark:text-rose-300 dark:border-rose-800";

            const chipLabel = DIMENSION_CHIP_LABELS[s.dim] || s.label.split(" ")[0];

            return (
              <button
                key={s.dim}
                type="button"
                onClick={() => onSelectDimension?.(s.dim)}
                onMouseEnter={() => setHoveredDim(s.dim)}
                onMouseLeave={() => setHoveredDim(null)}
                className={`text-[10.5px] font-medium px-2.5 py-1 rounded-xl border transition-all btn-interactive cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : `bg-white dark:bg-[#1E293B] hover:bg-neutral-50 dark:hover:bg-neutral-800 ${scoreColor}`
                }`}
              >
                {chipLabel}: <span className="font-mono font-bold">{s.score}/5</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
