import React from "react";
import {
  ShieldAlert,
  ChevronRight,
  BookOpen,
  Printer,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  Upload,
} from "lucide-react";
import type { EditorialTriageOutcome } from "@/lib/types";

interface EditorialTriageBannerProps {
  isDeskReject: boolean;
  isAlreadyPublished: boolean;
  isNonAcademic: boolean;
  editorialTriage?: EditorialTriageOutcome;
  publishedDetails?: any;
  classification?: any;
  targetJournal?: string;
  detectedDiscipline?: string;
  targetJournalEvaluation?: any;
  overallScore?: number;
  onSelectView: (view: any) => void;
  onNewScan?: () => void;
  handlePrint: (e?: React.MouseEvent) => void;
}

export const EditorialTriageBanner: React.FC<EditorialTriageBannerProps> = ({
  isDeskReject,
  isAlreadyPublished,
  isNonAcademic,
  editorialTriage,
  publishedDetails,
  classification,
  targetJournal,
  detectedDiscipline,
  targetJournalEvaluation,
  overallScore,
  onSelectView,
  onNewScan,
  handlePrint,
}) => {
  if (isDeskReject) {
    return (
      <div className="p-5 sm:p-6 rounded-2xl border-2 border-rose-500/40 bg-gradient-to-br from-rose-50/90 via-white/80 to-rose-50/50 dark:from-rose-950/40 dark:via-[#161F30] dark:to-rose-950/20 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200/60 dark:border-rose-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200 flex items-center gap-2 flex-wrap">
                <span>Editorial Triage: Immediate Desk Reject</span>
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70 border border-rose-300/60 dark:border-rose-800/60 px-2 py-0.5 rounded-full">
                  Preliminary Screening
                </span>
              </h3>
              <p className="text-xs text-rose-800/90 dark:text-rose-400">
                Target Journal Scope Mismatch &bull; External Peer-Review Panel Bypassed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onSelectView("personas")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition cursor-pointer"
            >
              <span>Triage Rationale</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSelectView("journals")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Matching Journals</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#111827] text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shadow-2xs"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-rose-950/90 dark:text-rose-200/90 leading-relaxed font-normal">
          {editorialTriage?.summary ||
            `The manuscript substantive focus lies in ${detectedDiscipline || "a different discipline"}, which falls outside the scope of "${targetJournal}". In scholarly publishing, out-of-scope manuscripts are declined during preliminary editorial screening and are never forwarded to external peer reviewers.`}
        </p>

        {editorialTriage?.scopeComparison && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-rose-200/60 dark:border-rose-900/40 text-xs">
            <div className="p-3 rounded-xl bg-white/80 dark:bg-[#161F30]/80 border border-rose-200/60 dark:border-rose-900/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                Target Journal Remit ({editorialTriage.scopeComparison.journalName || targetJournal})
              </span>
              <div className="font-semibold text-rose-950 dark:text-rose-100">
                {editorialTriage.scopeComparison.journalDiscipline || "Target Domain"}
                {editorialTriage.scopeComparison.journalPublisher ? ` • ${editorialTriage.scopeComparison.journalPublisher}` : ""}
              </div>
              {editorialTriage.scopeComparison.journalScopeSummary && (
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1">
                  {editorialTriage.scopeComparison.journalScopeSummary}
                </p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-white/80 dark:bg-[#161F30]/80 border border-rose-200/60 dark:border-rose-900/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                Manuscript Substantive Focus
              </span>
              <div className="font-semibold text-rose-950 dark:text-rose-100">
                {editorialTriage.scopeComparison.manuscriptDiscipline || detectedDiscipline || "Manuscript Domain"}
              </div>
              {editorialTriage.scopeComparison.manuscriptTopics && editorialTriage.scopeComparison.manuscriptTopics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {editorialTriage.scopeComparison.manuscriptTopics.slice(0, 4).map((t, idx) => (
                    <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isAlreadyPublished) {
    return (
      <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-emerald-950 dark:text-emerald-200 block">
                Already Published Article Detected
              </span>
              <span className="text-[11px] text-emerald-800 dark:text-emerald-400">
                Established Record in Scholarly Literature • Pre-Submission Peer-Review Simulation Bypassed
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              Published Article
            </span>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#111827] text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Published Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-emerald-200/70 dark:border-emerald-800/60 text-xs">
          {publishedDetails?.journalName && (
            <div className="p-2.5 rounded-lg bg-white/80 dark:bg-[#161F30]/80 border border-emerald-200/60 dark:border-emerald-800/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Published Journal</span>
              <span className="font-semibold text-emerald-950 dark:text-emerald-100 truncate block mt-0.5" title={publishedDetails.journalName}>
                {publishedDetails.journalName}
              </span>
            </div>
          )}
          {publishedDetails?.publicationDate && (
            <div className="p-2.5 rounded-lg bg-white/80 dark:bg-[#161F30]/80 border border-emerald-200/60 dark:border-emerald-800/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Publication Date</span>
              <span className="font-semibold text-emerald-950 dark:text-emerald-100 block mt-0.5">
                {publishedDetails.publicationDate}
              </span>
            </div>
          )}
          {publishedDetails?.publisher && (
            <div className="p-2.5 rounded-lg bg-white/80 dark:bg-[#161F30]/80 border border-emerald-200/60 dark:border-emerald-800/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Publisher</span>
              <span className="font-semibold text-emerald-950 dark:text-emerald-100 truncate block mt-0.5" title={publishedDetails.publisher}>
                {publishedDetails.publisher}
              </span>
            </div>
          )}
          {publishedDetails?.doi && (
            <div className="p-2.5 rounded-lg bg-white/80 dark:bg-[#161F30]/80 border border-emerald-200/60 dark:border-emerald-800/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Official Article DOI</span>
              <a
                href={`https://doi.org/${publishedDetails.doi}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:underline inline-flex items-center gap-1 truncate block mt-0.5"
              >
                <span className="truncate">{publishedDetails.doi}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}
        </div>

        <div className="text-[11px] text-emerald-800/90 dark:text-emerald-400 pt-1 flex items-center justify-between flex-wrap gap-2">
          <span>Verified via: {publishedDetails?.detectedVia || "Official Crossref Registry"}</span>
          {publishedDetails?.citationCount !== undefined && (
            <span>Scholarly Citation Count: <strong>{publishedDetails.citationCount}</strong></span>
          )}
        </div>
      </div>
    );
  }

  if (isNonAcademic) {
    return (
      <div className="p-5 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-amber-950/30 border border-amber-200 dark:border-amber-800/60 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-amber-950 dark:text-amber-200 block">
                Document Ineligible for Peer-Review Evaluation
              </span>
              <span className="text-[11px] text-amber-800 dark:text-amber-400">
                Classified as {classification?.categoryLabel || "Non-Academic Document"} • Pre-Submission Simulation Bypassed
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              Review Bypassed (N/A)
            </span>
            {onNewScan && (
              <button
                type="button"
                onClick={onNewScan}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Manuscript</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-amber-900/90 dark:text-amber-300/90 leading-relaxed pt-2 border-t border-amber-200/70 dark:border-amber-800/60">
          {classification?.advisoryMessage ||
            "This document does not contain empirical scientific research, IMRaD sections, or scholarly bibliography citations. Acceptance scoring and persona simulations have been safely skipped."}
        </p>
        {classification?.customGuidance && (
          <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
            {classification.customGuidance}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl liquid-glass-card">
      <div className="flex items-center flex-wrap gap-2.5">
        {overallScore !== undefined ? (
          <div className="flex items-baseline">
            <span className="text-3xl sm:text-4xl font-black text-[#0F172A] dark:text-white">
              {overallScore}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#64748B] dark:text-neutral-400 uppercase tracking-wider ml-2">
              / 100 OVERALL ACCEPTANCE POTENTIAL
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
              Pre-Submission Audit
            </span>
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              Acceptance potential calculation is pending or not applicable.
            </span>
          </div>
        )}
        {targetJournalEvaluation?.isDisciplinaryMismatch ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Target Journal Scope Mismatch
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold liquid-glass-btn-primary transition cursor-pointer"
          title="Print or Save as PDF"
        >
          <Printer className="w-3.5 h-3.5 text-white" />
          <span>Print / Save as PDF</span>
        </button>
      </div>
    </div>
  );
};
