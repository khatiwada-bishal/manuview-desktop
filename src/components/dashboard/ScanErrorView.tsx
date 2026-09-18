"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  RotateCw,
  Settings,
  Trash2,
  Key,
  WifiOff,
  Clock,
  Cpu,
  ChevronDown,
  BookOpen,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { PaperItem } from "@/components/DesktopSidebar";
import { useScanManager } from "@/context/ScanContext";

interface ScanErrorViewProps {
  paper: PaperItem;
  onOpenSettings?: () => void;
  onDeleteArticle?: () => void;
}

export function ScanErrorView({
  paper,
  onOpenSettings,
  onDeleteArticle,
}: ScanErrorViewProps) {
  const { retryScan, isScanning } = useScanManager();
  const [showTechnical, setShowTechnical] = useState(false);

  const error = paper.scanError || {
    title: "Diagnostic Review Interrupted",
    explanation:
      "The pre-submission diagnostic evaluation could not finish. This typically happens if the AI provider's connection timed out or the API credentials were not accepted.",
    action: "Please verify your AI model credentials in Settings (Cmd+,) and click Retry.",
    category: "general",
  };

  const getErrorIcon = (category?: string) => {
    switch (category) {
      case "auth":
        return <Key className="w-6 h-6 text-amber-500" />;
      case "rate_limit":
        return <ShieldAlert className="w-6 h-6 text-orange-500" />;
      case "network":
        return <WifiOff className="w-6 h-6 text-rose-500" />;
      case "context_length":
        return <BookOpen className="w-6 h-6 text-purple-500" />;
      case "device_memory":
        return <Cpu className="w-6 h-6 text-indigo-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-rose-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-[#111827] dark:text-[#F8FAFC] relative">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Manuscript Title Card */}
        <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08]">
          <div className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
            Diagnostic Review Attempted For:
          </div>
          <h2 className="text-base font-bold text-[#0F172A] dark:text-white truncate mt-0.5">
            {paper.title}
          </h2>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Target Venue: <strong className="text-neutral-700 dark:text-neutral-300">{paper.journal}</strong>
          </div>
        </div>

        {/* Human-Understandable Error Card */}
        <div className="p-6 sm:p-8 rounded-3xl liquid-glass-card border border-rose-500/20 bg-rose-500/[0.03] dark:bg-rose-500/[0.06] shadow-xs space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/20">
              {getErrorIcon(error.category)}
            </div>
            <div className="space-y-1.5 min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Diagnostic Scan Halted
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                {error.title}
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed pt-1">
                {error.explanation}
              </p>
            </div>
          </div>

          {/* Recommended Resolution Box */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs space-y-1.5">
            <div className="text-xs font-bold text-[#0F172A] dark:text-white flex items-center gap-1.5">
              <span>💡 Recommended Next Step:</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {error.action}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isScanning}
              onClick={() => retryScan(paper)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass-btn-primary text-white font-semibold text-xs transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-white/80" />
              ) : (
                <RotateCw className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{isScanning ? "Scan in progress..." : "Retry Review Scan"}</span>
            </button>

            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl liquid-glass-btn-secondary text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 shrink-0" />
                <span>Configure AI Provider (Cmd+,)</span>
              </button>
            )}

            {onDeleteArticle && (
              <button
                type="button"
                onClick={onDeleteArticle}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition cursor-pointer ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Article</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Technical Details for Developer / Diagnostics */}
        {error.technical && (
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setShowTechnical((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer"
            >
              <span>Technical Diagnostics &amp; Raw Exception</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showTechnical ? "rotate-180" : ""
                }`}
              />
            </button>

            {showTechnical && (
              <pre className="mt-3 p-3 rounded-xl bg-neutral-900 text-neutral-200 text-[11px] font-mono leading-relaxed overflow-x-auto select-text">
                {error.technical}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
