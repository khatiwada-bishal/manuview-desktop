import React from "react";
import {
  Upload,
  Sparkles,
  FileText,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  FileUp,
  Tag,
  Layers,
  X,
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
  isScanning?: boolean;
  scanEngine?: "persona" | "laya" | "typesafe";
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
  isScanning = false,
  scanEngine = "persona",
}: ScanInputFormProps) {
  return (
    <form onSubmit={handleRunReview} className="rounded-3xl liquid-glass-card p-6 sm:p-7 space-y-6 relative z-10 border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
      {/* Header with Load Sample Preprint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs">
            <FileUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
              Manuscript Draft Studio
            </h3>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Upload full draft document for 6-dimension referee critique, or provide text for quick fit validation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleLoadSampleQuick}
            className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 transition cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 shadow-2xs"
            title="Loads Title, Abstract & Keywords for fast journal fit validation"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Load Quick Fit Sample</span>
          </button>
          <button
            type="button"
            onClick={handleLoadSampleFull}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 transition cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/50 shadow-2xs"
            title="Loads complete manuscript document with Methods, Results & References for full 6-dimension peer review"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Load Full Manuscript Sample</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: File Upload */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <span>Full Manuscript Document</span>
            </label>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200 dark:border-emerald-800">
              Deep 6-Dim Audit
            </span>
          </div>

          {file ? (
            /* Selected File State: Elevated Manuscript Preview Card */
            <div className="flex-1 flex flex-col items-center justify-center border border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/30 rounded-2xl p-6 text-center min-h-[260px] relative overflow-hidden group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3 group-hover:scale-105 transition">
                <FileText className="w-7 h-7" />
              </div>
              <span className="text-sm text-[#0F172A] dark:text-white font-bold truncate max-w-full px-3">
                {file.name || fileName}
              </span>
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium mt-1">
                {(file.size / 1024).toFixed(1)} KB • Document Ready
              </span>
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Full Rubric &amp; Crossref Audit Active</span>
              </div>

              <div className="flex items-center gap-2 mt-4">
                {isDesktopApp() ? (
                  <button
                    type="button"
                    onClick={handleNativePick}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer shadow-2xs"
                  >
                    Change File
                  </button>
                ) : (
                  <label className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer shadow-2xs">
                    <span>Change File</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setFileName(null);
                    setCompatibilityMatch(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer shadow-2xs"
                >
                  Remove File
                </button>
              </div>
            </div>
          ) : isDesktopApp() ? (
            <button
              type="button"
              onClick={handleNativePick}
              className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-blue-500/30 hover:border-blue-500 rounded-2xl p-6 bg-gradient-to-b from-blue-500/[0.04] via-purple-500/[0.02] to-transparent hover:bg-blue-50/30 dark:hover:bg-blue-950/30 cursor-pointer transition group min-h-[260px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md flex items-center justify-center mb-3 group-hover:scale-105 group-hover:shadow-blue-500/25 transition">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm text-[#0F172A] dark:text-white font-bold text-center truncate max-w-full px-2">
                Click to Choose Manuscript File
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 text-center max-w-xs px-2 leading-relaxed">
                Audits causal claims, missing controls, 5 referee personas &amp; Crossref DOIs
              </span>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.08] text-[10px] font-mono font-semibold text-neutral-600 dark:text-neutral-400 border border-black/[0.04] dark:border-white/[0.08]">
                  .PDF
                </span>
                <span className="px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.08] text-[10px] font-mono font-semibold text-neutral-600 dark:text-neutral-400 border border-black/[0.04] dark:border-white/[0.08]">
                  .DOCX
                </span>
                <span className="px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.08] text-[10px] font-mono font-semibold text-neutral-600 dark:text-neutral-400 border border-black/[0.04] dark:border-white/[0.08]">
                  .TXT
                </span>
              </div>
            </button>
          ) : (
            <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-blue-500/30 hover:border-blue-500 rounded-2xl p-6 bg-gradient-to-b from-blue-500/[0.04] via-purple-500/[0.02] to-transparent hover:bg-blue-50/30 dark:hover:bg-blue-950/30 cursor-pointer transition group min-h-[260px]">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md flex items-center justify-center mb-3 group-hover:scale-105 group-hover:shadow-blue-500/25 transition">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm text-[#0F172A] dark:text-white font-bold text-center truncate max-w-full px-2">
                Click to Choose Manuscript File
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 text-center max-w-xs px-2 leading-relaxed">
                Audits causal claims, missing controls, 5 referee personas &amp; Crossref DOIs
              </span>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.08] text-[10px] font-mono font-semibold text-neutral-600 dark:text-neutral-400 border border-black/[0.04] dark:border-white/[0.08]">
                  .PDF
                </span>
                <span className="px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.08] text-[10px] font-mono font-semibold text-neutral-600 dark:text-neutral-400 border border-black/[0.04] dark:border-white/[0.08]">
                  .DOCX
                </span>
                <span className="px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.08] text-[10px] font-mono font-semibold text-neutral-600 dark:text-neutral-400 border border-black/[0.04] dark:border-white/[0.08]">
                  .TXT
                </span>
              </div>
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Right Column: Title / Abstract / Keywords */}
        <div className="space-y-3.5 bg-white/70 dark:bg-[#161F30]/70 p-5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F172A] dark:text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Or Provide Title &amp; Abstract Directly</span>
            </span>
            <span className="text-[10px] font-semibold bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-[#334155]">
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
              className="w-full px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#1E293B] text-xs sm:text-sm text-[#111827] dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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
              className="w-full px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#1E293B] text-xs sm:text-sm text-[#111827] dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed resize-none transition"
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
              className="w-full px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#1E293B] text-xs sm:text-sm text-[#111827] dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
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
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 dark:bg-emerald-950/40 dark:border-emerald-800 space-y-2 animate-fade-in">
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
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] flex items-start gap-3 text-neutral-600 dark:text-neutral-400 text-xs leading-relaxed shadow-2xs">
        <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-[#0F172A] dark:text-white block">
            Manuscript Confidentiality &amp; Zero-Retention Guarantee
          </span>
          <span className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
            Direct Encrypted BYOK Connection: Official API calls with zero-retention flags. ManuView does not log, store, or relay your unpublished work through third-party intermediary servers.
          </span>
        </div>
      </div>

      {/* Morphing Action Slot: Submit Button morphs directly into Pipeline Stepper */}
      <div className="w-full fluid-morph-container space-y-3">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between gap-3 animate-fade-in shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="break-words font-medium">{error}</span>
            </div>
            {onOpenSettings &&
              (error.toLowerCase().includes("provider") ||
                error.toLowerCase().includes("settings") ||
                error.toLowerCase().includes("key")) && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs whitespace-nowrap transition cursor-pointer shrink-0 shadow-2xs"
                >
                  Configure Provider
                </button>
              )}
          </div>
        )}

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
            id="run-pre-submission-btn"
            onClick={(e) => handleRunReview(e)}
            disabled={isScanning}
            title={isScanning ? "A manuscript review is actively running in the background" : undefined}
            className={`w-full py-3.5 px-6 rounded-xl font-semibold text-xs sm:text-sm text-white shadow-xs transition-all duration-200 flex items-center justify-center gap-2.5 select-none ${
              isScanning
                ? "bg-neutral-300 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-not-allowed opacity-70 pointer-events-none"
                : scanEngine === "laya" || scanEngine === "typesafe"
                ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/25 cursor-pointer active:scale-[0.99]"
                : "liquid-glass-btn-primary cursor-pointer active:scale-[0.99]"
            }`}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-white/80" />
                <span className="truncate">Review in Progress in Background...</span>
              </>
            ) : scanEngine === "laya" || scanEngine === "typesafe" ? (
              <>
                <Sparkles className="w-4 h-4 text-white shrink-0" />
                <span className="truncate">Run Fast Pre-Submission Audit (Laya)</span>
                <ArrowRight className="w-4 h-4 shrink-0 opacity-80" />
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white/90 shrink-0" />
                <span className="truncate">Run Pre-Submission AI Review &amp; 5-Persona Simulation</span>
                <ArrowRight className="w-4 h-4 shrink-0 opacity-80" />
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
