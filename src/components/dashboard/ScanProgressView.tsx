"use client";

import React from "react";
import {
  Sparkles,
  Compass,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { PaperItem } from "@/components/DesktopSidebar";

interface ScanProgressViewProps {
  paper: PaperItem;
  onOpenSettings?: () => void;
}

export function ScanProgressView({ paper, onOpenSettings }: ScanProgressViewProps) {
  const percent = paper.scanPercent ?? 25;
  const stepMessage = paper.scanStep || "Analyzing manuscript structure & methodology...";

  const PIPELINE_STEPS = [
    {
      id: "parse",
      name: "Document Ingestion",
      detail: "IMRaD structure & bibliography extraction",
      icon: FileText,
      minPercent: 15,
    },
    {
      id: "scope",
      name: "Target Scope Fit",
      detail: `Registry aims & scope for "${paper.journal}"`,
      icon: Compass,
      minPercent: 40,
    },
    {
      id: "personas",
      name: "5-Persona Peer Review",
      detail: "Statistical, causal, methodology, novelty & editor panel",
      icon: Sparkles,
      minPercent: 55,
    },
    {
      id: "citations",
      name: "Citation Integrity",
      detail: "Crossref DOI verification & retraction checks",
      icon: ShieldCheck,
      minPercent: 85,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-[#111827] dark:text-[#F8FAFC] relative">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Top Header Card */}
        <div className="p-6 rounded-3xl liquid-glass-card border border-blue-500/20 bg-blue-500/[0.03] dark:bg-blue-500/[0.05] shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600 dark:text-blue-400" />
                  <span>Review In Progress • {percent}%</span>
                </span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  Target: <strong className="text-neutral-700 dark:text-neutral-300 font-semibold">{paper.journal}</strong>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white truncate">
                {paper.title}
              </h1>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="truncate">{stepMessage}</span>
              </div>
              <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">{percent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Background Non-Blocking Processing Notice */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#111827]/70 border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-bold text-[#0F172A] dark:text-white">
              Background Execution Active
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              This review is processing safely in the background. You can freely switch to other articles, check target journals, or explore tools in the sidebar. When the evaluation finishes, your complete diagnostic rubric and 5-persona reports will automatically populate right here.
            </p>
          </div>
        </div>

        {/* 4-Phase Stepper Pipeline */}
        <div className="p-6 rounded-3xl liquid-glass-card border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Diagnostic Pipeline Stages
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PIPELINE_STEPS.map((stage, idx) => {
              const isCompleted = percent >= stage.minPercent + 20;
              const isCurrent = percent >= stage.minPercent && !isCompleted;
              const isUpcoming = percent < stage.minPercent;

              return (
                <div
                  key={stage.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCompleted
                      ? "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] border-emerald-500/30 text-neutral-800 dark:text-neutral-200"
                      : isCurrent
                      ? "bg-blue-500/[0.06] dark:bg-blue-500/[0.12] border-blue-500/40 text-neutral-900 dark:text-white shadow-xs"
                      : "bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.06] text-neutral-400 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-blue-600 text-white animate-pulse"
                          : "bg-black/[0.06] dark:bg-white/[0.08] text-neutral-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <stage.icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold truncate">
                          {idx + 1}. {stage.name}
                        </div>
                        {isCompleted && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Done
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 animate-pulse">
                            Processing
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                        {stage.detail}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
