"use client";

import React, { useState, useEffect } from "react";
import { usePrefersReducedMotion } from "@/lib/motion";
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle } from "lucide-react";

export interface ReferenceStatusData {
  valid: number;
  retracted: number;
  concern: number;
  unresolvable: number;
  unchecked: number;
  total: number;
}

interface ReferenceStatusDonutProps {
  data: ReferenceStatusData;
  activeFilter?: string;
  onSelectFilter?: (filter: string) => void;
  className?: string;
}

interface DonutSlice {
  id: string;
  label: string;
  count: number;
  percent: number;
  color: string;
  hoverColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function ReferenceStatusDonut({
  data,
  activeFilter = "all",
  onSelectFilter,
  className = "",
}: ReferenceStatusDonutProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const total = Math.max(1, data.total);

  const slices: DonutSlice[] = [
    {
      id: "valid",
      label: "Verified Valid",
      count: data.valid,
      percent: Math.round((data.valid / total) * 100),
      color: "#10B981", // emerald-500
      hoverColor: "#059669",
      icon: CheckCircle2,
    },
    {
      id: "retracted",
      label: "Retracted",
      count: data.retracted,
      percent: Math.round((data.retracted / total) * 100),
      color: "#EF4444", // rose-500
      hoverColor: "#DC2626",
      icon: AlertTriangle,
    },
    {
      id: "expression_of_concern",
      label: "Concern",
      count: data.concern,
      percent: Math.round((data.concern / total) * 100),
      color: "#F59E0B", // amber-500
      hoverColor: "#D97706",
      icon: AlertTriangle,
    },
    {
      id: "unresolvable",
      label: "Unresolvable",
      count: data.unresolvable,
      percent: Math.round((data.unresolvable / total) * 100),
      color: "#94A3B8", // slate-400
      hoverColor: "#64748B",
      icon: HelpCircle,
    },
    {
      id: "unchecked",
      label: "Unchecked",
      count: data.unchecked,
      percent: Math.round((data.unchecked / total) * 100),
      color: "#CBD5E1", // slate-300
      hoverColor: "#94A3B8",
      icon: HelpCircle,
    },
  ].filter((s) => s.count > 0);

  // SVG Geometry
  const size = 180;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate cumulative offsets
  let accumulatedPercent = 0;
  const sliceArcs = slices.map((s) => {
    const slicePercent = s.count / total;
    const strokeDasharray = `${slicePercent * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += slicePercent;
    return {
      ...s,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeFocusSlice = hoveredId
    ? slices.find((s) => s.id === hoveredId)
    : activeFilter !== "all"
    ? slices.find((s) => s.id === activeFilter)
    : null;

  return (
    <div
      className={`p-5 rounded-2xl liquid-glass-card border border-black/[0.08] dark:border-white/[0.1] flex flex-col sm:flex-row items-center justify-between gap-6 ${className}`}
      role="region"
      aria-label="Reference Verification Status Breakdown"
    >
      {/* Circular SVG Donut */}
      <div className="relative w-44 h-44 shrink-0 flex items-center justify-center select-none">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full -rotate-90 transform overflow-visible"
        >
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-neutral-100 dark:text-neutral-800/80"
          />

          {/* Slices */}
          {sliceArcs.map((slice) => {
            const isHovered = hoveredId === slice.id;
            const isSelected = activeFilter === slice.id;

            return (
              <circle
                key={slice.id}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered || isSelected ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={
                  mounted || prefersReducedMotion ? slice.strokeDasharray : `0 ${circumference}`
                }
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-500 ease-out"
                style={{
                  filter: isHovered || isSelected ? `drop-shadow(0 0 6px ${slice.color}50)` : "none",
                }}
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectFilter?.(activeFilter === slice.id ? "all" : slice.id)}
              />
            );
          })}
        </svg>

        {/* Center Display: Count + Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
          {activeFocusSlice ? (
            <div className="animate-in fade-in zoom-in-95 duration-150">
              <span className="font-mono text-xl font-extrabold text-[#0F172A] dark:text-white leading-none">
                {activeFocusSlice.count}
              </span>
              <span className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[90px]">
                {activeFocusSlice.label}
              </span>
              <span className="block text-[9px] font-semibold text-blue-600 dark:text-blue-400">
                {activeFocusSlice.percent}%
              </span>
            </div>
          ) : (
            <div>
              <span className="font-mono text-2xl font-extrabold text-[#0F172A] dark:text-white leading-none">
                {data.total}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mt-1">
                References
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Legend & Filter Chips */}
      <div className="flex-1 w-full space-y-3">
        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-2">
          <span className="text-xs font-bold text-[#0F172A] dark:text-white">
            Audit Distribution
          </span>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
            Click slice to filter
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {slices.map((slice) => {
            const isSelected = activeFilter === slice.id;
            const isHovered = hoveredId === slice.id;

            return (
              <button
                key={slice.id}
                type="button"
                onClick={() => onSelectFilter?.(activeFilter === slice.id ? "all" : slice.id)}
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs btn-interactive cursor-pointer ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 shadow-xs"
                    : isHovered
                    ? "bg-neutral-50 dark:bg-neutral-800/80 border-neutral-300 dark:border-neutral-700"
                    : "bg-white/60 dark:bg-[#1E293B]/60 border-neutral-200 dark:border-neutral-800"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300 truncate text-[11px]">
                    {slice.label}
                  </span>
                </div>
                <span className="font-mono font-bold text-neutral-900 dark:text-white shrink-0 ml-1 text-xs">
                  {slice.count}
                </span>
              </button>
            );
          })}
        </div>

        {activeFilter !== "all" && (
          <button
            type="button"
            onClick={() => onSelectFilter?.("all")}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer block pt-1"
          >
            &larr; Reset filter (show all {data.total} references)
          </button>
        )}
      </div>
    </div>
  );
}
