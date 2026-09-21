import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CircleCheck,
  CircleAlert,
  CircleX,
  Info,
  Tag,
  Gauge,
  BookOpen,
  Scale,
  FileCheck,
  Printer,
  ChevronDown,
  ChevronUp,
  Settings,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { PaperItem } from "@/components/DesktopSidebar";
import type { TypeSafeScanResult, ScanSignal, SignalTone } from "@/lib/typesafe-scan";

interface DesktopTypeSafeDashboardViewProps {
  paper: PaperItem;
  scanResult?: TypeSafeScanResult;
  onOpenSettings?: () => void;
}

const TONE_BADGES: Record<SignalTone, { bg: string; text: string; border: string; Icon: typeof CircleCheck }> = {
  good: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30",
    Icon: CircleCheck,
  },
  warn: {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/30",
    Icon: CircleAlert,
  },
  bad: {
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/30",
    Icon: CircleX,
  },
  info: {
    bg: "bg-slate-500/10 dark:bg-slate-500/15",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-500/30",
    Icon: Info,
  },
};

function getScoreTheme(score: number) {
  if (score >= 80) {
    return {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      label: "High Acceptance Readiness",
    };
  }
  if (score >= 65) {
    return {
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      label: "Minor Revisions Anticipated",
    };
  }
  if (score >= 45) {
    return {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      label: "Major Revisions Prioritized",
    };
  }
  return {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    label: "High Desk-Reject Hazard",
  };
}

export function DesktopTypeSafeDashboardView({
  paper,
  scanResult,
  onOpenSettings,
}: DesktopTypeSafeDashboardViewProps) {
  const result: TypeSafeScanResult | undefined = scanResult || paper.typesafeResult;
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const score = result?.readiness ?? paper.score ?? 70;
  const theme = getScoreTheme(score);

  // Separate journal signals from general signals
  const journalSignals = result?.signals.filter((s) => s.group === "Journal Alignment") || [];
  const flags = result?.flags || [];

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-[#111827] dark:text-[#F8FAFC]">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* =========================================================================
            1. HEADER BANNER: Title, Venue, Model & Cost
           ========================================================================= */}
        <div className="rounded-3xl bg-white dark:bg-[#161F30] border border-black/[0.08] dark:border-white/[0.08] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>TypeSafe (Jev) Calibrated Audit</span>
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-300 font-mono">
                  {result?.model || "jev-latest"}
                </span>
                {result?.documentType && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-300 font-medium">
                    {result.documentType}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white leading-snug">
                {paper.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Target Venue:</span>
                  <strong className="text-neutral-800 dark:text-neutral-200">{paper.journal}</strong>
                </span>
                {result?.usage && (
                  <span className="flex items-center gap-1 text-neutral-400">
                    <span>•</span>
                    <span>Tokens: {result.usage.input_tokens.toLocaleString()}</span>
                    <span>•</span>
                    <span>Cost: ${( (result.usage.input_tokens / 1_000_000_000) * 42 ).toFixed(5)}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-[#1E293B] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#26344a] transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-[#1E293B] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#26344a] transition cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>AI Settings</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. TOP METRICS ROW: Gauge + Journal Alignment + Screening
           ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Calibrated Readiness Score */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#161F30] border border-black/[0.08] dark:border-white/[0.08] shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-400">
              <span>Calibrated Readiness</span>
              <Gauge className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${theme.text}`}>
                {score}
              </span>
              <span className="text-xl font-medium text-neutral-400">/ 100</span>
            </div>
            <div className={`p-2.5 rounded-xl border text-xs font-semibold ${theme.bg} ${theme.text} ${theme.border}`}>
              {result?.readinessLabel || theme.label}
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Synthesized by TypeSafe Jev via 20+ atomic criteria with calibrated probabilities.
            </p>
          </div>

          {/* Target Journal Alignment */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#161F30] border border-black/[0.08] dark:border-white/[0.08] shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-400">
              <span>Target Venue Alignment</span>
              <Tag className="w-4 h-4 text-purple-500" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-bold text-[#0F172A] dark:text-white truncate">
                {paper.journal}
              </div>
              {journalSignals.length > 0 ? (
                <div className="space-y-2">
                  {journalSignals.map((s) => {
                    const tone = TONE_BADGES[s.tone];
                    return (
                      <div
                        key={s.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${tone.bg} ${tone.text} ${tone.border}`}
                      >
                        <span className="font-semibold">{s.label}:</span>
                        <span>{s.display}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-300 text-xs">
                  Scope evaluated against venue criteria.
                </div>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Audits disciplinary focus, methodological rigor, and desk-rejection risk for this venue.
            </p>
          </div>

          {/* Desk-Reject Risk & Screening */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#161F30] border border-black/[0.08] dark:border-white/[0.08] shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-400">
              <span>Desk-Rejection Triage</span>
              <Scale className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-bold text-[#0F172A] dark:text-white">
                {paper.isDeskReject ? "High Desk-Reject Risk" : "Low Desk-Reject Hazard"}
              </div>
              <div
                className={`p-2.5 rounded-xl border text-xs font-semibold ${
                  paper.isDeskReject
                    ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                }`}
              >
                {paper.isDeskReject
                  ? "Requires addressing core gaps before journal submission"
                  : "Passes initial editorial presentation & completeness screening"}
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Evaluates title, abstract, IMRaD completeness, and clear scientific contribution.
            </p>
          </div>
        </div>

        {/* =========================================================================
            3. NEEDS ATTENTION: Priority Action Items & Omissions
           ========================================================================= */}
        {flags.length > 0 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-amber-500/[0.04] dark:bg-amber-500/[0.08] border border-amber-500/25 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h2 className="text-lg font-bold">Needs Attention ({flags.length} items)</h2>
              </div>
              <span className="text-xs text-amber-800/80 dark:text-amber-300/80 font-medium">
                Items marked as high risk or flagged for human review
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {flags.map((flag) => {
                const tone = TONE_BADGES[flag.tone];
                const Icon = tone.Icon;
                return (
                  <div
                    key={flag.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#161F30] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${tone.text}`} />
                        <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {flag.label}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tone.bg} ${tone.text} shrink-0`}>
                        {flag.display}
                      </span>
                    </div>
                    {flag.detail && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        {flag.detail}
                      </p>
                    )}
                    {flag.confidence !== undefined && (
                      <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                        <span>Model Confidence:</span>
                        <span className="font-mono font-semibold text-neutral-600 dark:text-neutral-300">
                          {(flag.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            4. COMPREHENSIVE DIAGNOSTIC GROUPS: Detailed Breakdown
           ========================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
              Detailed Diagnostic Evaluation Battery
            </h2>
            <span className="text-xs text-neutral-400">
              {result?.signals.length ?? 0} total evaluated signals
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result?.groups.map((group) => {
              const isExpanded = expandedGroup === group.name;
              return (
                <div
                  key={group.name}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#161F30] overflow-hidden shadow-2xs transition"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedGroup(isExpanded ? null : group.name)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        {group.name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-300 font-semibold">
                        {group.signals.length} checks
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>

                  <div className="p-4 pt-0 space-y-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                    {group.signals.map((signal) => {
                      const tone = TONE_BADGES[signal.tone];
                      const Icon = tone.Icon;
                      return (
                        <div
                          key={signal.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-50/50 dark:bg-[#1E293B]/40 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${tone.text}`} />
                            <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                              {signal.label}
                            </span>
                          </div>
                          <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${tone.bg} ${tone.text} shrink-0`}>
                            {signal.display}
                          </span>
                        </div>
                      );
                    })}
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
