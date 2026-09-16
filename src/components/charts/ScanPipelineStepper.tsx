"use client";

import React from "react";
import { FileSearch, ShieldAlert, Users, Sparkles, Check, RefreshCw } from "lucide-react";

export interface ScanStageInfo {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SCAN_STAGES: ScanStageInfo[] = [
  {
    id: "intake",
    title: "Document Intake & Parsing",
    shortLabel: "Intake & IMRaD",
    description: "Extracting structural sections, tables, and reference metadata",
    icon: FileSearch,
  },
  {
    id: "triage",
    title: "Scope & Triage Screening",
    shortLabel: "Editorial Triage",
    description: "Screening 6 desk-reject pillars, journal remit, and Crossref DOIs",
    icon: ShieldAlert,
  },
  {
    id: "panel",
    title: "Simulated Referee Panel",
    shortLabel: "Referee Panel",
    description: "Evaluating methodology, novelty, and claims across 5 personas",
    icon: Users,
  },
  {
    id: "synthesis",
    title: "Synthesis & Calibration",
    shortLabel: "Readiness Synthesis",
    description: "Calibrating readiness tier, priority fixes, and revision roadmap",
    icon: Sparkles,
  },
];

interface ScanPipelineStepperProps {
  currentStepMessage?: string;
  percent?: number;
  className?: string;
}

export function ScanPipelineStepper({
  currentStepMessage = "Running pre-submission diagnostics...",
  percent,
  className = "",
}: ScanPipelineStepperProps) {
  // Infer active stage index (0 to 3) from percent or text keywords
  const activeIndex = React.useMemo(() => {
    if (typeof percent === "number") {
      if (percent < 25) return 0;
      if (percent < 55) return 1;
      if (percent < 85) return 2;
      return 3;
    }

    const msg = (currentStepMessage || "").toLowerCase();
    if (msg.includes("extract") || msg.includes("pars") || msg.includes("text") || msg.includes("upload")) {
      return 0;
    }
    if (msg.includes("triage") || msg.includes("scope") || msg.includes("crossref") || msg.includes("retract") || msg.includes("pillar")) {
      return 1;
    }
    if (msg.includes("persona") || msg.includes("referee") || msg.includes("review") || msg.includes("debate") || msg.includes("panel")) {
      return 2;
    }
    if (msg.includes("calibrat") || msg.includes("synthes") || msg.includes("final") || msg.includes("readiness")) {
      return 3;
    }
    return 1;
  }, [percent, currentStepMessage]);

  const displayPercent = typeof percent === "number" ? Math.max(5, Math.min(100, Math.round(percent))) : (activeIndex + 1) * 25;

  return (
    <div
      className={`w-full max-w-2xl mx-auto space-y-6 text-center ${className}`}
      role="progressbar"
      aria-valuenow={displayPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Diagnostic scan pipeline progress"
    >
      {/* Visual Pipeline Nodes */}
      <div className="relative flex items-center justify-between px-2 sm:px-6">
        {/* Continuous background track */}
        <div className="absolute left-6 right-6 top-5 -translate-y-1/2 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full z-0" />
        
        {/* Continuous active progress fill */}
        <div
          className="absolute left-6 top-5 -translate-y-1/2 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full z-0 transition-all duration-700 ease-out"
          style={{
            width: `${typeof percent === "number" ? Math.max(0, Math.min(100, percent)) : Math.min(100, Math.max(0, (activeIndex / 3) * 100))}%`,
          }}
        />

        {SCAN_STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;
          const isPending = idx > activeIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center group">
              {/* Node Circle */}
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? "bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50 dark:ring-emerald-950/40"
                    : isActive
                    ? "bg-blue-600 text-white shadow-md ring-4 ring-blue-100 dark:ring-blue-900/40 animate-pulse"
                    : "bg-white dark:bg-[#1E293B] text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-neutral-700"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : isActive ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              {/* Node Title */}
              <div className="mt-2.5 hidden sm:block">
                <span
                  className={`text-[11px] font-bold block transition-colors ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : isCompleted
                      ? "text-neutral-900 dark:text-neutral-200 font-semibold"
                      : "text-neutral-400 dark:text-neutral-600"
                  }`}
                >
                  {stage.shortLabel}
                </span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block max-w-[110px] leading-tight mt-0.5">
                  {stage.id === "intake" ? "IMRaD Structure" : stage.id === "triage" ? "Desk-Reject Gate" : stage.id === "panel" ? "5 Referees" : "Calibration"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Status Display Card */}
      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 backdrop-blur-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
            Stage {activeIndex + 1} of 4: {SCAN_STAGES[activeIndex].title}
          </span>
          <span className="font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400">
            {displayPercent}%
          </span>
        </div>

        {/* Granular status message */}
        <p className="text-xs text-[#334155] dark:text-neutral-300 font-medium text-left truncate">
          {currentStepMessage}
        </p>

        {/* Micro progress line */}
        <div className="w-full bg-neutral-200/80 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-600 dark:bg-blue-400 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${displayPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
