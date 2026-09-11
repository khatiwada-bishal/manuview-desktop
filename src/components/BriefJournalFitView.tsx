"use client";

import React from "react";
import { BriefJournalFitReport } from "@/lib/types";
import {
  ArrowLeft,
  Download,
  Printer,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Tag,
  FileText,
  SlidersHorizontal,
  Lightbulb,
  ShieldAlert,
  ArrowRight,
  Globe,
} from "lucide-react";
import { exportInteractiveHtmlReport, exportWordDocReport } from "@/lib/export-generator";

interface Props {
  report: BriefJournalFitReport;
  onBack: () => void;
  onDownloadPDF: () => void;
  activeProviderInfo: { name: string; model: string };
  onSwitchToFullUpload?: () => void;
}

export function BriefJournalFitView({
  report,
  onBack,
  onDownloadPDF,
  activeProviderInfo,
  onSwitchToFullUpload,
}: Props) {
  const getVerdictBadge = () => {
    if (report.verdictColor === "green") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EDF6EE] dark:bg-emerald-950/40 text-[#1E5A2A] dark:text-emerald-400 border border-[#CBE7CE] dark:border-emerald-800 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{report.verdict}</span>
        </span>
      );
    }
    if (report.verdictColor === "amber") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FBF3DB] dark:bg-amber-950/40 text-[#78510E] dark:text-amber-400 border border-[#F4E2B6] dark:border-amber-800 shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{report.verdict}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF0EF] dark:bg-rose-950/40 text-[#7C2D2B] dark:text-rose-400 border border-[#F7CECC] dark:border-rose-800 shadow-2xs">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>{report.verdict}</span>
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-[#1E5A2A] dark:text-emerald-400";
    if (score >= 50) return "text-[#78510E] dark:text-amber-400";
    return "text-[#7C2D2B] dark:text-rose-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return "bg-[#1E5A2A] dark:bg-emerald-500";
    if (score >= 50) return "bg-[#78510E] dark:bg-amber-500";
    return "bg-[#7C2D2B] dark:bg-rose-500";
  };

  return (
    <div className="space-y-6 animate-fadeIn print:hidden">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EBEBEA] dark:border-[#1F2937]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white hover:bg-[#F7F7F5] dark:hover:bg-[#1E293B] px-2.5 py-1.5 rounded-lg transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Edit Manuscript</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#787774] dark:text-neutral-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Target:</span>
            <span className="font-semibold text-[#2F3437] dark:text-white bg-[#F7F7F5] dark:bg-[#161F30] px-2 py-0.5 rounded border border-[#EBEBEA] dark:border-[#334155]">
              {report.targetJournal}
            </span>
          </div>

          <button
            type="button"
            onClick={() => exportInteractiveHtmlReport(report)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#161F30] text-[#2F3437] dark:text-neutral-200 hover:bg-[#F7F7F5] dark:hover:bg-[#1E293B] border border-[#D0D5DD] dark:border-[#334155] transition shadow-2xs cursor-pointer"
            title="Export self-contained Interactive Web Report (.html) for offline viewing and sharing"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Interactive HTML</span>
          </button>

          <button
            type="button"
            onClick={() => exportWordDocReport(report)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#161F30] text-[#2F3437] dark:text-neutral-200 hover:bg-[#F7F7F5] dark:hover:bg-[#1E293B] border border-[#D0D5DD] dark:border-[#334155] transition shadow-2xs cursor-pointer"
            title="Export Scope Fit Report as Microsoft Word Document (.doc / .docx)"
          >
            <FileText className="w-3.5 h-3.5 text-[#18569C] dark:text-blue-400" />
            <span className="hidden sm:inline">Word (.docx)</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-1.5 rounded-lg border border-[#EBEBEA] dark:border-[#334155] hover:bg-[#F7F7F5] dark:hover:bg-[#1E293B] text-[#787774] dark:text-neutral-400 transition"
            title="Print Brief Report"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2F3437] hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* Hero Editorial Scope Card */}
      <div className="p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#111827] border border-[#EBEBEA] dark:border-[#1F2937] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#787774] dark:text-neutral-400">
                Target Journal Scope Validation
              </span>
              {getVerdictBadge()}
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2F3437] dark:text-white tracking-tight">
              {report.targetJournal}
            </h2>
          </div>

          {/* Fit Score Badge */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-[#161F30] border border-[#EBEBEA] dark:border-[#334155] shadow-2xs self-start">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-[#787774] dark:text-neutral-400 font-semibold">
                Overall Scope Match
              </div>
              <div className={`text-2xl font-bold font-mono ${getScoreColor(report.fitScore)}`}>
                {report.fitScore}%
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#F7F7F5] dark:bg-[#1E293B] border border-[#EBEBEA] dark:border-[#334155] flex items-center justify-center font-bold text-xs">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-mono shadow-xs" style={{
                backgroundColor: report.fitScore >= 75 ? "#1E5A2A" : report.fitScore >= 50 ? "#78510E" : "#7C2D2B"
              }}>
                {report.fitScore >= 75 ? "FIT" : report.fitScore >= 50 ? "FAIR" : "RISK"}
              </div>
            </div>
          </div>
        </div>

        {/* Executive Scope Summary */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#161F30] border border-[#EBEBEA] dark:border-[#334155] text-xs text-[#2F3437] dark:text-neutral-200 leading-relaxed">
          <div className="font-semibold text-[11px] text-[#787774] dark:text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#0A85EA] dark:text-blue-400" />
            <span>Senior Editorial Triage Synthesis</span>
          </div>
          <p className="italic text-[#37352F] dark:text-neutral-300 text-xs sm:text-sm">
            &ldquo;{report.summary}&rdquo;
          </p>
        </div>
      </div>

      {/* Manuscript Information Preview Box */}
      <div className="p-4 rounded-xl bg-[#F7F7F5] dark:bg-[#161F30] border border-[#EBEBEA] dark:border-[#1F2937] text-xs space-y-2.5">
        <div>
          <span className="text-[10px] font-semibold text-[#787774] dark:text-neutral-400 uppercase tracking-wider block mb-0.5">
            Evaluated Manuscript Title
          </span>
          <span className="font-semibold text-xs sm:text-sm text-[#2F3437] dark:text-white block">
            {report.title}
          </span>
        </div>

        {report.keywords && report.keywords.length > 0 && (
          <div>
            <span className="text-[10px] font-semibold text-[#787774] dark:text-neutral-400 uppercase tracking-wider block mb-1">
              Author Keywords
            </span>
            <div className="flex flex-wrap gap-1.5">
              {report.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-[#1E293B] border border-[#EBEBEA] dark:border-[#334155] text-[11px] text-[#2F3437] dark:text-neutral-200 font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="text-[10px] font-semibold text-[#787774] dark:text-neutral-400 uppercase tracking-wider block mb-1">
            Abstract Synopsis
          </span>
          <p className="text-[11px] text-[#787774] dark:text-neutral-400 line-clamp-3 leading-relaxed bg-white dark:bg-[#1E293B] p-2.5 rounded-lg border border-[#EBEBEA] dark:border-[#334155]">
            {report.abstract}
          </p>
        </div>
      </div>

      {/* 4 Scope Dimensions Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-[#787774] dark:text-neutral-400 uppercase tracking-wider">
          Editorial Scope Dimensions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Dimension 1: Domain Match */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#EBEBEA] dark:border-[#1F2937] shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#2F3437] dark:text-white">1. Subject Domain Alignment</span>
              <span className={`font-mono font-bold ${getScoreColor(report.dimensions.domainMatch.score)}`}>
                {report.dimensions.domainMatch.score}%
              </span>
            </div>
            <div className="w-full bg-[#F7F7F5] dark:bg-[#1E293B] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full ${getScoreBg(report.dimensions.domainMatch.score)}`}
                style={{ width: `${report.dimensions.domainMatch.score}%` }}
              />
            </div>
            <p className="text-[11px] text-[#787774] dark:text-neutral-400 leading-relaxed pt-0.5">
              {report.dimensions.domainMatch.feedback}
            </p>
          </div>

          {/* Dimension 2: Novelty & Conceptual Depth */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#EBEBEA] dark:border-[#1F2937] shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#2F3437] dark:text-white">2. Conceptual Novelty &amp; Impact Tier</span>
              <span className={`font-mono font-bold ${getScoreColor(report.dimensions.noveltySignificance.score)}`}>
                {report.dimensions.noveltySignificance.score}%
              </span>
            </div>
            <div className="w-full bg-[#F7F7F5] dark:bg-[#1E293B] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full ${getScoreBg(report.dimensions.noveltySignificance.score)}`}
                style={{ width: `${report.dimensions.noveltySignificance.score}%` }}
              />
            </div>
            <p className="text-[11px] text-[#787774] dark:text-neutral-400 leading-relaxed pt-0.5">
              {report.dimensions.noveltySignificance.feedback}
            </p>
          </div>

          {/* Dimension 3: Readership & Community Fit */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#EBEBEA] dark:border-[#1F2937] shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#2F3437] dark:text-white">3. Readership &amp; Community Relevance</span>
              <span className={`font-mono font-bold ${getScoreColor(report.dimensions.readershipAlignment.score)}`}>
                {report.dimensions.readershipAlignment.score}%
              </span>
            </div>
            <div className="w-full bg-[#F7F7F5] dark:bg-[#1E293B] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full ${getScoreBg(report.dimensions.readershipAlignment.score)}`}
                style={{ width: `${report.dimensions.readershipAlignment.score}%` }}
              />
            </div>
            <p className="text-[11px] text-[#787774] dark:text-neutral-400 leading-relaxed pt-0.5">
              {report.dimensions.readershipAlignment.feedback}
            </p>
          </div>

          {/* Dimension 4: Keyword & Indexing Resonance */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#EBEBEA] dark:border-[#1F2937] shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#2F3437] dark:text-white">4. Keyword &amp; Search Indexing</span>
              <span className={`font-mono font-bold ${getScoreColor(report.dimensions.keywordRelevance.score)}`}>
                {report.dimensions.keywordRelevance.score}%
              </span>
            </div>
            <div className="w-full bg-[#F7F7F5] dark:bg-[#1E293B] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full ${getScoreBg(report.dimensions.keywordRelevance.score)}`}
                style={{ width: `${report.dimensions.keywordRelevance.score}%` }}
              />
            </div>
            <p className="text-[11px] text-[#787774] dark:text-neutral-400 leading-relaxed pt-0.5">
              {report.dimensions.keywordRelevance.feedback}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Section: Highlights vs Hazards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Key Highlights */}
        <div className="p-4 rounded-xl bg-[#EDF6EE]/60 dark:bg-emerald-950/20 border border-[#CBE7CE] dark:border-emerald-800/50 space-y-2">
          <div className="font-semibold text-[#1E5A2A] dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#1E5A2A] dark:text-emerald-400" />
            <span>Scope Strengths Supporting Submission</span>
          </div>
          <ul className="space-y-1.5 text-[#1E5A2A]/90 dark:text-emerald-300/90 pl-1">
            {report.keyHighlights.map((hl, i) => (
              <li key={i} className="flex items-start gap-1.5 leading-snug">
                <span className="text-[#1E5A2A] dark:text-emerald-400 font-bold mt-0.5">&bull;</span>
                <span>{hl}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Desk Reject Hazards */}
        <div className="p-4 rounded-xl bg-[#FDF0EF]/60 dark:bg-rose-950/20 border border-[#F7CECC] dark:border-rose-800/50 space-y-2">
          <div className="font-semibold text-[#7C2D2B] dark:text-rose-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#7C2D2B] dark:text-rose-400" />
            <span>Desk-Reject Hazards for {report.targetJournal}</span>
          </div>
          <ul className="space-y-1.5 text-[#7C2D2B]/90 dark:text-rose-300/90 pl-1">
            {report.deskRejectHazards.map((hz, i) => (
              <li key={i} className="flex items-start gap-1.5 leading-snug">
                <span className="text-[#7C2D2B] dark:text-rose-400 font-bold mt-0.5">&bull;</span>
                <span>{hz}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Abstract & Title Framing Suggestions */}
      {report.framingSuggestions && report.framingSuggestions.length > 0 && (
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#EBEBEA] dark:border-[#1F2937] shadow-2xs space-y-2 text-xs">
          <div className="font-semibold text-[#2F3437] dark:text-white flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-[#0A85EA] dark:text-blue-400" />
            <span>Recommendations to Optimize Title &amp; Abstract for {report.targetJournal}</span>
          </div>
          <div className="space-y-2 pl-1">
            {report.framingSuggestions.map((sug, i) => (
              <div key={i} className="flex items-start gap-2 text-[#787774] dark:text-neutral-400 leading-relaxed">
                <span className="font-mono text-[10px] font-bold bg-[#F7F7F5] dark:bg-[#1E293B] border border-[#EBEBEA] dark:border-[#334155] px-1.5 py-0.2 rounded text-[#2F3437] dark:text-neutral-200 mt-0.5">
                  {i + 1}
                </span>
                <span>{sug}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Journal Venues */}
      {report.alternativeJournals && report.alternativeJournals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#787774] dark:text-neutral-400 uppercase tracking-wider">
            Alternative &amp; Backup Journal Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {report.alternativeJournals.map((alt, idx) => {
              const tierBadge =
                alt.tier === "Reach"
                  ? "bg-[#F6EEFB] dark:bg-purple-950/40 text-[#783CB3] dark:text-purple-300 border-[#E9D4F7] dark:border-purple-800"
                  : alt.tier === "Realistic"
                  ? "bg-[#EDF6EE] dark:bg-emerald-950/40 text-[#1E5A2A] dark:text-emerald-300 border-[#CBE7CE] dark:border-emerald-800"
                  : "bg-[#F7F7F5] dark:bg-neutral-800 text-[#787774] dark:text-neutral-300 border-[#EBEBEA] dark:border-neutral-700";

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-[#EBEBEA] dark:border-[#1F2937] shadow-2xs flex flex-col justify-between space-y-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tierBadge}`}>
                        {alt.tier}
                      </span>
                      {alt.impactFactor && (
                        <span className="text-[10px] font-mono text-[#787774] dark:text-neutral-400">
                          IF {alt.impactFactor}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-xs text-[#2F3437] dark:text-white">
                      {alt.name}
                    </div>
                    {alt.publisher && (
                      <div className="text-[10px] text-[#9B9A97] dark:text-neutral-500">
                        {alt.publisher}
                      </div>
                    )}
                    <p className="text-[11px] text-[#787774] dark:text-neutral-400 leading-snug pt-1">
                      {alt.matchReason}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Audit Upgrade CTA Callout */}
      <div className="p-5 rounded-2xl bg-[#F0FDF4] dark:bg-emerald-950/30 text-[#111827] dark:text-white border border-[#BBF7D0] dark:border-emerald-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Ready for Deep Diagnostic?</span>
          </div>
          <h4 className="text-sm font-bold text-[#111827] dark:text-white">
            Run the Full 6-Dimension Pre-Submission Manuscript Audit
          </h4>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-xl">
            Upload your complete manuscript (.pdf, .docx) to audit causal claims, experimental controls, methodology power, 5 simulated peer-reviewer personas, and Crossref citation integrity.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0F172A] hover:bg-[#1E293B] dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition whitespace-nowrap self-start sm:self-auto cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <span>Upload Full Document</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function BriefJournalFitPrintView({
  report,
  activeProviderInfo,
}: {
  report: BriefJournalFitReport;
  activeProviderInfo: { name: string; model: string };
}) {
  return (
    <div className="space-y-4 text-xs font-sans text-[#111111] leading-relaxed">
      {/* Header */}
      <div className="border-b-2 border-black pb-3 flex items-center justify-between">
        <div>
          <div className="text-lg font-serif font-bold text-black">
            ManuView Journal Fit &amp; Scope Evaluation Report
          </div>
          <div className="text-[10px] text-[#555555] uppercase tracking-wider">
            Target Journal Editorial Alignment &bull; Desk-Reject Hazard Screening
          </div>
        </div>
        <div className="text-right text-[10px] text-[#555555]">
          <div><strong>Report ID:</strong> {report.id}</div>
          <div><strong>Date:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
      </div>

      {/* Target & Match Bar */}
      <div className="p-3 rounded-lg border border-[#CCCCCC] bg-[#F9F9F9] flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase text-[#666666] font-semibold">Target Journal</div>
          <div className="text-base font-serif font-bold text-black">{report.targetJournal}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase text-[#666666] font-semibold">Verdict &bull; Scope Match</div>
          <div className="text-sm font-bold text-black">
            {report.verdict} ({report.fitScore}%)
          </div>
        </div>
      </div>

      {/* Editorial Synthesis */}
      <div className="p-3 rounded-lg border border-[#DDDDDD] bg-white">
        <div className="text-[10px] uppercase font-bold text-[#444444] mb-1">
          Editorial Scope Assessment
        </div>
        <p className="italic text-[11px] text-[#222222]">
          &ldquo;{report.summary}&rdquo;
        </p>
      </div>

      {/* Manuscript Meta */}
      <div className="p-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] space-y-1">
        <div><strong>Title:</strong> {report.title}</div>
        {report.keywords && report.keywords.length > 0 && (
          <div><strong>Keywords:</strong> {report.keywords.join(", ")}</div>
        )}
      </div>

      {/* 4 Scope Dimensions Table */}
      <div>
        <div className="text-[10px] uppercase font-bold text-black border-b border-[#CCCCCC] pb-1 mb-2">
          Scope Dimensions Breakdown
        </div>
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-[#DDDDDD] text-left text-[10px] text-[#555555]">
              <th className="py-1">Dimension</th>
              <th className="py-1 text-center">Score</th>
              <th className="py-1">Editorial Feedback</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEEEEE]">
            <tr>
              <td className="py-1 font-semibold">Subject Domain Alignment</td>
              <td className="py-1 text-center font-mono font-bold">{report.dimensions.domainMatch.score}%</td>
              <td className="py-1 text-[#444444]">{report.dimensions.domainMatch.feedback}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold">Conceptual Novelty &amp; Tier</td>
              <td className="py-1 text-center font-mono font-bold">{report.dimensions.noveltySignificance.score}%</td>
              <td className="py-1 text-[#444444]">{report.dimensions.noveltySignificance.feedback}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold">Readership Relevance</td>
              <td className="py-1 text-center font-mono font-bold">{report.dimensions.readershipAlignment.score}%</td>
              <td className="py-1 text-[#444444]">{report.dimensions.readershipAlignment.feedback}</td>
            </tr>
            <tr>
              <td className="py-1 font-semibold">Keyword Search Indexing</td>
              <td className="py-1 text-center font-mono font-bold">{report.dimensions.keywordRelevance.score}%</td>
              <td className="py-1 text-[#444444]">{report.dimensions.keywordRelevance.feedback}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Hazards & Framing */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="p-3 border border-[#E0E0E0] rounded-lg">
          <div className="text-[10px] uppercase font-bold text-[#882222] mb-1">
            Desk-Reject Hazards for {report.targetJournal}
          </div>
          <ul className="list-disc pl-3 text-[10px] space-y-0.5 text-[#333333]">
            {report.deskRejectHazards.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
        <div className="p-3 border border-[#E0E0E0] rounded-lg">
          <div className="text-[10px] uppercase font-bold text-black mb-1">
            Framing Recommendations
          </div>
          <ul className="list-disc pl-3 text-[10px] space-y-0.5 text-[#333333]">
            {report.framingSuggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
