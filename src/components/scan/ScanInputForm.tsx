import React from "react";
import {
  Upload,
  Sparkles,
  FileText,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { isDesktopApp } from "@/lib/desktop";
import { ScanPipelineStepper } from "@/components/charts/ScanPipelineStepper";
import type { ParsedManuscript } from "@/lib/types";
import type { JournalScopeProfile } from "@/lib/journal-scope-service";

interface ScanInputFormProps {
  manuscriptTitle: string;
  setManuscriptTitle: (val: string) => void;
  manuscriptAbstract: string;
  setManuscriptAbstract: (val: string) => void;
  manuscriptKeywords: string;
  setManuscriptKeywords: (val: string) => void;
  file: File | null;
  fileName: string | null;
  setFile: (file: File | null) => void;
  setFileName: (name: string | null) => void;
  error: string | null;
  setError: (err: string | null) => void;
  compatibilityMatch: {
    journalName: string;
    journalDiscipline: string;
    manuscriptDiscipline: string;
    summary: string;
    parsed: ParsedManuscript;
    liveScope: JournalScopeProfile | null;
  } | null;
  setCompatibilityMatch: (val: any) => void;
  loading: boolean;
  loadingStep: string;
  loadingPercent?: number;
  handleLoadSampleQuick: () => void;
  handleLoadSampleFull: () => void;
  handleNativePick: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRunReview: (e?: React.FormEvent) => void;
  onOpenSettings?: () => void;
}

export function ScanInputForm({
  manuscriptTitle,
  setManuscriptTitle,
  manuscriptAbstract,
  setManuscriptAbstract,
  manuscriptKeywords,
  setManuscriptKeywords,
  file,
  fileName,
  setFile,
  setFileName,
  error,
  setError,
  compatibilityMatch,
  setCompatibilityMatch,
  loading,
  loadingStep,
  loadingPercent,
  handleLoadSampleQuick,
  handleLoadSampleFull,
  handleNativePick,
  handleFileChange,
  handleRunReview,
  onOpenSettings,
}: ScanInputFormProps) {
  return (
    <form onSubmit={handleRunReview} className="rounded-3xl liquid-glass-card p-6 space-y-6 relative z-10">
      {/* Header with Load Sample Preprint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E5E7EB] dark:border-[#1F2937]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
            Manuscript Draft Submission
          </span>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Upload your full paper for deep referee analysis, or provide title and abstract for quick fit check.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleLoadSampleQuick}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 transition cursor-pointer"
            title="Loads Title, Abstract & Keywords for fast journal fit validation"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Load Sample (Quick Fit)</span>
          </button>
          <button
            type="button"
            onClick={handleLoadSampleFull}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
            title="Loads complete manuscript document with Methods, Results & References for full 6-dimension peer review"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Load Sample (Full Document)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: File Upload */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Upload Full Manuscript (.pdf, .docx, .txt)
            </label>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded font-medium border border-emerald-200 dark:border-emerald-800">
              Full 6-Dim Audit
            </span>
          </div>

          {isDesktopApp() ? (
            <button
              type="button"
              onClick={handleNativePick}
              className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#D1D5DB] dark:border-[#334155] hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-6 bg-white dark:bg-[#161F30] hover:bg-blue-50/20 dark:hover:bg-blue-950/20 cursor-pointer transition group min-h-[240px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs text-[#111827] dark:text-white font-semibold text-center truncate max-w-full px-2">
                {fileName || "Click to choose manuscript file"}
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 text-center max-w-xs px-2 leading-relaxed">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB • Click to change file`
                  : "Audits causal overclaims, missing controls, 5-persona referee reviews & Crossref DOIs"}
              </span>
            </button>
          ) : (
            <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#D1D5DB] dark:border-[#334155] hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-6 bg-white dark:bg-[#161F30] hover:bg-blue-50/20 dark:hover:bg-blue-950/20 cursor-pointer transition group min-h-[240px]">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs text-[#111827] dark:text-white font-semibold text-center truncate max-w-full px-2">
                {file ? file.name : "Click to choose manuscript file"}
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 text-center max-w-xs px-2 leading-relaxed">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB • Click to change file`
                  : "Audits causal overclaims, missing controls, 5-persona referee reviews & Crossref DOIs"}
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

          {file && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setFileName(null);
                setCompatibilityMatch(null);
              }}
              className="text-[11px] text-red-600 dark:text-red-400 hover:underline self-end mt-1.5 cursor-pointer font-medium"
            >
              Remove file &amp; use Title / Abstract
            </button>
          )}
        </div>

        {/* Right Column: Title / Abstract / Keywords */}
        <div className="space-y-3.5 bg-white dark:bg-[#161F30] p-5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#111827] dark:text-white">
              Or Provide Title &amp; Abstract
            </span>
            <span className="text-[10px] font-medium bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded border border-neutral-200 dark:border-[#334155]">
              Quick Review
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Manuscript Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={manuscriptTitle}
              onChange={(e) => {
                setManuscriptTitle(e.target.value);
                setCompatibilityMatch(null);
                if (error) setError(null);
              }}
              placeholder="e.g. Single-cell transcriptional profiling of DLL3..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs sm:text-sm text-[#111827] dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Abstract <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={manuscriptAbstract}
              onChange={(e) => {
                setManuscriptAbstract(e.target.value);
                setCompatibilityMatch(null);
                if (error) setError(null);
              }}
              placeholder="Paste background, methodology, key findings, and conclusions..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs sm:text-sm text-[#111827] dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Keywords <span className="text-neutral-400 dark:text-neutral-500 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={manuscriptKeywords}
              onChange={(e) => {
                setManuscriptKeywords(e.target.value);
                setCompatibilityMatch(null);
              }}
              placeholder="e.g. small cell lung cancer, DLL3, CRISPR screen, organoids"
              className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs sm:text-sm text-[#111827] dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] dark:bg-rose-950/40 border border-[#FECACA] dark:border-rose-800 text-[#991B1B] dark:text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="break-words">{error}</span>
          </div>
          {onOpenSettings && (error.toLowerCase().includes("provider") || error.toLowerCase().includes("settings") || error.toLowerCase().includes("key")) && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs whitespace-nowrap transition cursor-pointer shrink-0"
            >
              Configure Provider
            </button>
          )}
        </div>
      )}

      {/* Scope Match Verified Card (When Passed) */}
      {compatibilityMatch && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 dark:bg-emerald-950/40 dark:border-emerald-800 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Scope Compatibility Verified
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
              Passed Initial Scope Screening
            </span>
          </div>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
            Your manuscript research domain (<strong>{compatibilityMatch.manuscriptDiscipline}</strong>) aligns with target journal <strong>{compatibilityMatch.journalName}</strong> ({compatibilityMatch.journalDiscipline}). Target journal scope verified via live registry. Ready for full 5-persona peer review simulation.
          </p>
        </div>
      )}

      {/* Academic Privacy & Confidentiality Guarantee */}
      <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#161F30] border border-neutral-200/80 dark:border-[#334155] flex items-start gap-2.5 text-neutral-600 dark:text-neutral-400 text-xs leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-neutral-800 dark:text-neutral-200 block">
            Manuscript Confidentiality &amp; Zero-Retention Guarantee
          </span>
          <span>
            Direct Encrypted BYOK Connection: Official API calls with zero-retention flags. ManuView does not log, store, or relay your unpublished work through third-party intermediary servers.
          </span>
        </div>
      </div>

      {/* Morphing Action Slot: Submit Button morphs directly into Pipeline Stepper */}
      <div className="w-full fluid-morph-container">
        {loading ? (
          <div className="w-full rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-white/90 dark:bg-[#161F30]/90 backdrop-blur-md p-5 sm:p-6 shadow-md animate-fluid-in ring-1 ring-blue-500/20">
            <ScanPipelineStepper
              currentStepMessage={loadingStep || "Running full pre-submission scan..."}
              percent={loadingPercent}
            />
          </div>
        ) : (
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl font-semibold text-xs sm:text-sm bg-[#0F172A] dark:bg-blue-600 hover:bg-[#1E293B] dark:hover:bg-blue-500 text-white transition-all duration-300 flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg cursor-pointer isolate relative overflow-hidden select-none group hover:scale-[1.005] active:scale-[0.995]"
          >
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0 group-hover:rotate-12 transition-transform duration-300" />
            <span className="truncate font-bold">Run Pre-Submission AI Review &amp; 5-Persona Simulation</span>
            <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform duration-300" />
          </button>
        )}
      </div>
    </form>
  );
}
