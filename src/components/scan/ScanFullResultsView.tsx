import React from "react";
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Users,
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  CheckSquare,
  GraduationCap,
  FlaskConical,
  ArrowLeft,
  Printer,
  Globe,
  Lock,
  Clock,
  MessageSquare,
  FileCode,
  Sparkles,
} from "lucide-react";
import type {
  FullReviewReport,
  PriorityIssue,
  ReviewerPersonaFeedback,
  ScoreDimension,
} from "@/lib/types";
import { DimensionRadarChart } from "@/components/charts/DimensionRadarChart";
import { SegmentedReadinessGauge } from "@/components/charts/SegmentedReadinessGauge";
import DesktopJournalMatchesListView from "@/components/DesktopJournalMatchesListView";

interface ScanFullResultsViewProps {
  report: FullReviewReport;
  onBack: () => void;
  activeExportFormat: string | null;
  handleExport: (format: "pdf" | "html" | "word" | "latex" | "bibtex") => void;
  selectedPersona: number;
  setSelectedPersona: (idx: number) => void;
  selectedRadarDim: ScoreDimension | null;
  setSelectedRadarDim: (dim: ScoreDimension | null) => void;
  showAllScanRefs: boolean;
  setShowAllScanRefs: (show: boolean) => void;
  otherScanJournals: any[];
  scanMatchingData: any;
  exportToast: string | null;
}

export function ScanFullResultsView({
  report,
  onBack,
  activeExportFormat,
  handleExport,
  selectedPersona,
  setSelectedPersona,
  selectedRadarDim,
  setSelectedRadarDim,
  showAllScanRefs,
  setShowAllScanRefs,
  otherScanJournals,
  scanMatchingData,
  exportToast,
}: ScanFullResultsViewProps) {
  const isDeskReject = Boolean(
    report.editorialTriage?.outcome === "desk_reject" ||
    report.ineligibilityReason === "scope_mismatch" ||
    report.targetJournalEvaluation?.isDisciplinaryMismatch
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Navigation Bar in Results */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#1F2937]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 dark:bg-[#161F30] dark:hover:bg-[#1E293B] dark:text-neutral-300 dark:hover:text-white px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#334155] transition shadow-2xs cursor-pointer font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Input</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden md:flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mr-1">
            <span>Target:</span>
            <span className="px-2.5 py-1 rounded-md bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] dark:bg-amber-950/40 dark:border-amber-800/50 dark:text-amber-300 font-medium text-xs">
              {report.targetJournal || "General High Impact"}
            </span>
          </div>

          <button
            type="button"
            disabled={activeExportFormat !== null}
            onClick={() => handleExport("html")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-neutral-700 hover:bg-neutral-50 dark:bg-[#161F30] dark:hover:bg-[#1E293B] dark:text-neutral-300 dark:hover:text-white border border-[#E5E7EB] dark:border-[#334155] transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{activeExportFormat === "html" ? "Exporting..." : "Interactive HTML"}</span>
          </button>

          <button
            type="button"
            disabled={activeExportFormat !== null}
            onClick={() => handleExport("word")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-neutral-700 hover:bg-neutral-50 dark:bg-[#161F30] dark:hover:bg-[#1E293B] dark:text-neutral-300 dark:hover:text-white border border-[#E5E7EB] dark:border-[#334155] transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>{activeExportFormat === "word" ? "Exporting..." : "Word (.doc)"}</span>
          </button>

          <button
            type="button"
            disabled={activeExportFormat !== null}
            onClick={() => handleExport("pdf")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0F172A] hover:bg-[#1E293B] dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5 text-rose-400" />
            <span>{activeExportFormat === "pdf" ? "Preparing PDF..." : "PDF Report"}</span>
          </button>
        </div>
      </div>

      {/* Document Title Header */}
      <div className="space-y-2">
        <div className="text-3xl select-none">📑</div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-snug">
          {report.title}
        </h2>
      </div>

      {/* Document Classification (Only for review-eligible manuscripts) */}
      {!isDeskReject && report.isEligibleForReview !== false && report.classification?.isAcademicManuscript && (
        <div
          className={`p-5 rounded-2xl border text-xs space-y-3 ${
            report.classification.isAcademicManuscript
              ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-300"
              : "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E] dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-300"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-base select-none">
                {report.classification.isAcademicManuscript ? "🔬" : "⚠️"}
              </span>
              <span className="font-bold text-sm">
                Document Classification: {report.classification.categoryLabel}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10">
                {report.classification.isAcademicManuscript ? "Academic Paper" : "Non-Manuscript Content"}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-semibold">{report.classification.salutation}</div>
            <p className="leading-relaxed opacity-90">{report.classification.advisoryMessage}</p>
          </div>
        </div>
      )}

      {/* Ineligibility Banner OR Desk Reject Banner OR Score & Editorial Triage Block */}
      {isDeskReject ? (
        <div className="p-6 rounded-2xl bg-rose-50/80 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/50 shadow-2xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                  Editorial Triage: Immediate Desk Reject
                </h3>
                <p className="text-xs text-rose-800 dark:text-rose-400">
                  Target Journal Scope Mismatch &bull; External Peer-Review Panel Bypassed
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700">
              Desk Reject
            </span>
          </div>
          <p className="text-xs sm:text-sm text-rose-900/90 dark:text-rose-300/90 leading-relaxed pt-2 border-t border-rose-200/70 dark:border-rose-800/40">
            {report.editorialTriage?.summary ||
              `The manuscript's substantive domain falls outside the published aims and scope of "${report.targetJournal || "the target journal"}". In scholarly publishing, out-of-scope manuscripts are declined during preliminary editorial screening and do not proceed to peer review.`}
          </p>
        </div>
      ) : report.isEligibleForReview === false ? (
        report.ineligibilityReason === "already_published" ? (
          <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50 shadow-2xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">Already Published Article Detected</h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400">
                    Established record in scholarly literature. Pre-submission peer-review simulation safely bypassed.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700">
                Published Article
              </span>
            </div>

            {report.publishedDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-emerald-200/70 dark:border-emerald-800/40 text-xs">
                {report.publishedDetails.journalName && (
                  <div className="p-3 rounded-xl bg-white/90 border border-emerald-200/60 dark:bg-[#111827] dark:border-emerald-800/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Published Journal</span>
                    <span className="font-semibold text-emerald-950 dark:text-emerald-200 truncate block mt-0.5" title={report.publishedDetails.journalName}>
                      {report.publishedDetails.journalName}
                    </span>
                  </div>
                )}
                {report.publishedDetails.publicationDate && (
                  <div className="p-3 rounded-xl bg-white/90 border border-emerald-200/60 dark:bg-[#111827] dark:border-emerald-800/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Publication Date</span>
                    <span className="font-semibold text-emerald-950 dark:text-emerald-200 block mt-0.5">
                      {report.publishedDetails.publicationDate}
                    </span>
                  </div>
                )}
                {report.publishedDetails.publisher && (
                  <div className="p-3 rounded-xl bg-white/90 border border-emerald-200/60 dark:bg-[#111827] dark:border-emerald-800/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Publisher</span>
                    <span className="font-semibold text-emerald-950 dark:text-emerald-200 truncate block mt-0.5" title={report.publishedDetails.publisher}>
                      {report.publishedDetails.publisher}
                    </span>
                  </div>
                )}
                {report.publishedDetails.doi && (
                  <div className="p-3 rounded-xl bg-white/90 border border-emerald-200/60 dark:bg-[#111827] dark:border-emerald-800/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Official Article DOI</span>
                    <a
                      href={`https://doi.org/${report.publishedDetails.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 hover:underline inline-flex items-center gap-1 truncate block mt-0.5"
                    >
                      <span className="truncate">{report.publishedDetails.doi}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 rounded-xl bg-white/80 border border-emerald-200/60 dark:bg-[#111827] dark:border-emerald-800/40 text-xs text-neutral-700 dark:text-neutral-300">
              <span className="font-bold text-emerald-950 dark:text-emerald-200 block mb-1">Status Note:</span>
              <p className="leading-relaxed">{report.summary}</p>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50 shadow-2xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">Document Ineligible for Peer-Review Evaluation</h3>
                <p className="text-xs text-amber-800 dark:text-amber-400">
                  Classified as {report.classification?.categoryLabel || "Non-Academic File"} • Review Bypassed
                </p>
              </div>
            </div>
            <p className="text-xs text-amber-900/90 dark:text-amber-300 leading-relaxed pt-2 border-t border-amber-200/70 dark:border-amber-800/40">
              {report.classification?.advisoryMessage || report.summary}
            </p>
            {report.classification?.customGuidance && (
              <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
                {report.classification.customGuidance}
              </p>
            )}
          </div>
        )
      ) : (
        <div className="space-y-4">
          {'calibratedAcceptance' in report && report.calibratedAcceptance && (
            <SegmentedReadinessGauge
              currentBand={report.calibratedAcceptance.readinessBand || "Competitive / Moderate Readiness"}
              calibrationAdvisory={report.calibratedAcceptance.calibrationAdvisory}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Readiness Score Card */}
            <div className="p-6 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] flex flex-col justify-center items-center text-center shadow-2xs">
              {report.overallScore !== undefined ? (
                <>
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                    Readiness Score
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-4xl font-extrabold text-[#111827] dark:text-white">{report.overallScore}</span>
                    <span className="text-neutral-400 text-sm font-semibold">/100</span>
                  </div>
                  <div
                    className={`mt-1.5 px-3 py-1 rounded-md text-xs font-semibold border ${
                      report.overallScore >= 80
                        ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                        : report.overallScore >= 65
                        ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                        : "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                    }`}
                  >
                    {report.overallScore >= 80
                      ? "Submission Ready"
                      : report.overallScore >= 65
                      ? "Revision Prioritized"
                      : "Substantive Hazards"}
                  </div>
                  {report.panelConsensus && (
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium mt-1">
                      Outlook: {report.panelConsensus.consensusLevel.toUpperCase()}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                    Evaluation Mode
                  </div>
                  <div className="my-1.5 flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Scope Screening</span>
                  </div>
                  <div className="mt-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                    External Review Bypassed
                  </div>
                </>
              )}
            </div>

            {/* Editorial Summary Callout */}
            <div className="md:col-span-3 p-6 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] flex flex-col justify-center shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                <span className="text-base select-none">📌</span>
                <span>Editorial Triage Synthesis</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">{report.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Only show 6 dimensions, prioritized action plan, and 5 personas if review eligible */}
      {report.isEligibleForReview !== false && (
        <>
          {/* The 6 Evaluation Dimensions */}
          {report.dimensions && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#111827] dark:text-white">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>6-Dimension Scholarly Rubric Evaluation</span>
              </div>

              {/* Interactive 6-Dimension Radar / Spider Chart */}
              <DimensionRadarChart
                dimensions={report.dimensions}
                selectedDimension={selectedRadarDim}
                onSelectDimension={(dim) => {
                  setSelectedRadarDim(dim);
                  const el = document.getElementById(`scan-dim-card-${dim}`);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(report.dimensions).map(([key, dim]) => (
                  <div
                    key={key}
                    id={`scan-dim-card-${key}`}
                    className={`p-5 rounded-2xl bg-white border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] flex flex-col justify-between hover:border-neutral-300 dark:hover:border-[#334155] shadow-2xs transition ${
                      selectedRadarDim === key ? "ring-2 ring-blue-500 shadow-md" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-start sm:items-center justify-between gap-2.5 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-xs font-bold text-[#111827] dark:text-white truncate" title={dim.label}>
                            {dim.label}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold shrink-0 whitespace-nowrap ml-2 border ${
                            dim.score >= 4
                              ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                              : dim.score === 3
                              ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                              : "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                          }`}
                        >
                          {dim.score} / 5
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">{dim.verdict}</p>
                    </div>

                    {dim.vulnerabilities && dim.vulnerabilities.length > 0 && (
                      <div className="pt-2.5 border-t border-[#E5E7EB] dark:border-[#1F2937] text-[11px] text-[#991B1B] dark:text-rose-400 flex items-start gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-500" />
                        <span className="truncate">{dim.vulnerabilities[0]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prioritized Action Plan */}
          {report.priorityIssues && report.priorityIssues.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#111827] dark:text-white">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Prioritized Action Plan before Submission</span>
              </div>

              <div className="space-y-4">
                {report.priorityIssues.map((issue: PriorityIssue) => (
                  <div
                    key={issue.id}
                    className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] space-y-3.5 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            issue.priority === "A"
                              ? "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                              : issue.priority === "B"
                              ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
                          }`}
                        >
                          Priority {issue.priority}
                        </span>
                        <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                          {issue.category}
                        </span>
                        {issue.expectedEffort && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
                            <span>Effort: {issue.expectedEffort}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                        {issue.priority === "A" ? "Desk-Reject Vulnerability" : "Major Reviewer Challenge"}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#111827] dark:text-white">{issue.title}</h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">{issue.description}</p>

                    {issue.impactAssessment && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="font-bold text-[#111827] dark:text-amber-200 block text-xs">
                            Editorial Risk &amp; Scholarly Consequence (Why Reviewers Object):
                          </span>
                          <p className="leading-relaxed text-amber-950/90 dark:text-amber-300/90 font-light">
                            {issue.impactAssessment}
                          </p>
                        </div>
                      </div>
                    )}

                    {issue.evidenceAnchor && (
                      <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#161F30] border border-[#E5E7EB] dark:border-[#1F2937] text-xs font-mono text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-500 dark:text-neutral-400">
                          Anchor
                        </span>
                        <span className="truncate">{issue.evidenceAnchor}</span>
                      </div>
                    )}

                    {issue.reviewerQuote && (
                      <div className="border-l-2 border-neutral-300 dark:border-neutral-600 pl-3.5 py-1 text-xs italic text-neutral-700 dark:text-neutral-300 bg-neutral-50/50 dark:bg-[#161F30] rounded-r-lg font-serif">
                        &ldquo;{issue.reviewerQuote}&rdquo;
                      </div>
                    )}

                    {issue.actionableFix && (
                      <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] dark:bg-emerald-950/30 dark:border-emerald-800/50 text-xs text-[#166534] dark:text-emerald-300 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1 w-full">
                          <span className="font-bold text-[#111827] dark:text-white block text-xs">
                            Required Pre-Submission Operational Fix:
                          </span>
                          <div className="leading-relaxed whitespace-pre-line text-[#166534] dark:text-emerald-300 font-light">
                            {issue.actionableFix}
                          </div>
                        </div>
                      </div>
                    )}

                    {issue.suggestedRewrite && (
                      <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700/60 text-xs text-neutral-800 dark:text-neutral-200 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#111827] dark:text-neutral-100 flex items-center gap-1.5 text-xs">
                            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            Ready-to-Use Manuscript Revision / Specification:
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">Suggested Draft</span>
                        </div>
                        <pre className="text-xs font-mono bg-black/[0.03] dark:bg-black/30 p-3 rounded-lg border border-black/5 dark:border-white/5 whitespace-pre-wrap leading-relaxed text-neutral-800 dark:text-neutral-200 overflow-x-auto">
                          {issue.suggestedRewrite}
                        </pre>
                      </div>
                    )}

                    {issue.rebuttalStrategy && (
                      <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] dark:bg-blue-950/30 dark:border-blue-800/50 text-xs text-[#1E40AF] dark:text-blue-300 flex items-start gap-2.5">
                        <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 w-full">
                          <span className="font-bold text-[#1E3A8A] dark:text-blue-200 block text-xs">
                            Point-by-Point Author Rebuttal Framing (for Journal Response Letter):
                          </span>
                          <p className="leading-relaxed font-light whitespace-pre-line text-[#1E40AF] dark:text-blue-300">
                            {issue.rebuttalStrategy}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editorial triage desk-reject banner */}
          {report.editorialTriage?.outcome === "desk_reject" && (
            <div className="p-5 rounded-2xl bg-rose-50/80 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/50 shadow-2xs space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                    Desk Rejected at Editorial Triage — Peer Review Bypassed
                  </h3>
                  <p className="text-xs text-rose-800 dark:text-rose-400">
                    Out-of-scope submissions are declined by the handling editor during initial screening and are never sent to Reviewers 2–5.
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-rose-900/90 dark:text-rose-300/90 pl-1">
                {report.editorialTriage.summary}
              </p>
            </div>
          )}

          {/* Deterministic Compliance Audit */}
          {report.complianceAudit && report.complianceAudit.items && report.complianceAudit.items.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-[#111827] dark:text-white">
                  <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Deterministic Compliance Audit</span>
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                    Rule-Based
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{report.complianceAudit.passedCount} Passed</span>
                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <span className="text-amber-700 dark:text-amber-400 font-bold">{report.complianceAudit.warnCount} Warnings</span>
                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <span className="text-rose-700 dark:text-rose-400 font-bold">{report.complianceAudit.failedCount} Failures</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.complianceAudit.items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition shadow-2xs ${
                      item.status === "pass"
                        ? "bg-white border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937]"
                        : item.status === "warn"
                        ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40"
                        : "bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">{item.name}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border shrink-0 ${
                          item.status === "pass"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                            : item.status === "warn"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{item.detail}</p>
                    {item.actionableRecommendation && (
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-start gap-1.5">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 shrink-0">Remedy:</span>
                        <span>{item.actionableRecommendation}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Peer-review panel */}
          {report.reviewerPersonas && report.reviewerPersonas.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-[#111827] dark:text-white">
                  <Users className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  <span>
                    {isDeskReject
                      ? (report.reviewerPersonas.length <= 1 ? "Editorial Triage Decision" : "5-Persona Peer-Review Simulation (Editorial Scope Triage)")
                      : "5-Persona Peer-Review Simulation"}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                    ⚖️ Simulated Panel (Synthetic)
                  </span>
                </div>
                <span className="text-xs text-neutral-400">
                  {isDeskReject
                    ? (report.reviewerPersonas.length <= 1 ? "Handling editor screening only — no peer reviewers engaged" : "Editorial scope triage with multi-disciplinary stress tests")
                    : "Independent domain evaluations"}
                </span>
              </div>

              {/* Panel Consensus Card */}
              {report.panelConsensus && (
                <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] shadow-2xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                        Reviewer Perspectives:
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        report.panelConsensus.consensusLevel === "unanimous"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                          : report.panelConsensus.consensusLevel === "majority"
                          ? "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                          : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                      }`}>
                        {report.panelConsensus.consensusLevel.toUpperCase()} OUTLOOK
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 flex-wrap">
                      {report.panelConsensus.distribution.deskReject > 0 && (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">
                          Desk Reject ×{report.panelConsensus.distribution.deskReject}
                        </span>
                      )}
                      {report.panelConsensus.distribution.reject > 0 && (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                          Reject ×{report.panelConsensus.distribution.reject}
                        </span>
                      )}
                      {report.panelConsensus.distribution.majorRevision > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                          Major Rev ×{report.panelConsensus.distribution.majorRevision}
                        </span>
                      )}
                      {report.panelConsensus.distribution.minorRevision > 0 && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          Minor Rev ×{report.panelConsensus.distribution.minorRevision}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {report.panelConsensus.borderlineDiagnosis}
                  </p>
                </div>
              )}

              {/* Partial LLM Generation Notice */}
              {report.missingPersonaRoles && report.missingPersonaRoles.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 shadow-2xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>Partial Reviewer Generation:</strong> {report.reviewerPersonas.length} of 5 reviewer perspectives generated by the AI provider (missing: {report.missingPersonaRoles.join(", ")}). Missing perspectives are honestly omitted rather than synthetically backfilled.
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 border-b border-[#E5E7EB] dark:border-[#1F2937] pb-2 overflow-x-auto">
                {report.reviewerPersonas.map((p: ReviewerPersonaFeedback, idx: number) => {
                  const isActive = selectedPersona === idx;
                  return (
                    <button
                      key={p.persona}
                      onClick={() => setSelectedPersona(idx)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition cursor-pointer font-medium ${
                        isActive
                          ? "bg-[#0F172A] dark:bg-blue-600 text-white shadow-xs"
                          : "bg-[#F9FAFB] dark:bg-[#161F30] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-[#E5E7EB] dark:border-[#334155] hover:bg-neutral-100 dark:hover:bg-[#1E293B]"
                      }`}
                    >
                      <span>
                        {p.persona === "journal_editor"
                          ? "📑"
                          : p.persona === "domain_expert"
                          ? "🧬"
                          : p.persona === "methods_reviewer"
                          ? "🔬"
                          : p.persona === "statistician"
                          ? "📊"
                          : "⚡"}
                      </span>
                      <span>
                        {p.persona === "journal_editor"
                          ? "Reviewer 1 (Editor)"
                          : p.persona === "domain_expert"
                          ? "Reviewer 2 (Domain)"
                          : p.persona === "methods_reviewer"
                          ? "Reviewer 3 (Methods)"
                          : p.persona === "statistician"
                          ? "Reviewer 4 (Stats)"
                          : "Reviewer 5 (Adversary)"}
                      </span>
                      {p.decisionRecommendation && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : p.decisionRecommendation.includes("Reject")
                              ? "text-[#991B1B] dark:text-rose-300 bg-red-50 dark:bg-rose-950/50 border border-red-200 dark:border-rose-800"
                              : "text-[#92400E] dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {p.decisionRecommendation}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {report.reviewerPersonas[selectedPersona] && (() => {
                const active = report.reviewerPersonas[selectedPersona];
                const isReject = active.decisionRecommendation?.includes("Reject");
                const fallbackRoleName =
                  active.persona === "journal_editor"
                    ? "Reviewer 1: Lead Handling Editor"
                    : active.persona === "domain_expert"
                    ? "Reviewer 2: Target Domain Specialist"
                    : active.persona === "methods_reviewer"
                    ? "Reviewer 3: Research Methodology Referee"
                    : active.persona === "statistician"
                    ? "Reviewer 4: Statistical & Quantitative Auditor"
                    : "Reviewer 5: Adversarial Translation Referee";

                return (
                  <div className="p-6 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] space-y-5 animate-fade-in shadow-2xs">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-4 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-[#111827] dark:text-white">
                            {active.name?.startsWith("Reviewer") ? active.name : fallbackRoleName}
                          </h4>
                          {active.decisionRecommendation && (
                            <span
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                                isReject
                                  ? "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                                  : "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                              }`}
                            >
                              Decision: {active.decisionRecommendation}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-700 dark:text-neutral-300 font-semibold">{active.title}</div>
                        {active.affiliation && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{active.affiliation}</span>
                          </div>
                        )}
                      </div>

                      {active.expertise && (
                        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] dark:bg-[#161F30] dark:border-[#334155] text-xs text-neutral-600 dark:text-neutral-400 md:max-w-sm shadow-2xs">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-0.5">Area of Expertise &amp; Scope:</span>
                          {active.expertise}
                        </div>
                      )}
                    </div>

                    {active.confidentialEditorNote && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 text-xs space-y-1 shadow-2xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                          <Lock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                          <span>Confidential Editorial Office Memo (Simulation):</span>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-300 italic leading-relaxed">
                          &ldquo;{active.confidentialEditorNote}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Scholarly Merits & Strengths */}
                    {active.strengths && active.strengths.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-[#065F46] dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Scholarly Merits &amp; Recognized Strengths:</span>
                        </div>
                        <div className="space-y-1.5">
                          {active.strengths.map((str: string, sIdx: number) => (
                            <div
                              key={sIdx}
                              className="p-2.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] dark:bg-emerald-950/30 dark:border-emerald-800/60 text-xs text-[#166534] dark:text-emerald-300 flex items-start gap-2 shadow-2xs"
                            >
                              <span className="font-mono text-emerald-600 font-bold text-xs mt-0.5">+{sIdx + 1}</span>
                              <span className="leading-relaxed font-medium">{str}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] dark:bg-rose-950/30 dark:border-rose-800/50 text-xs text-[#991B1B] dark:text-rose-300 flex items-start gap-2.5">
                      <span className="text-base select-none">⚠️</span>
                      <div>
                        <span className="font-bold text-[#7F1D1D] dark:text-rose-200 block mb-0.5 uppercase tracking-wider text-[10px]">
                          Fatal Reviewer Objection:
                        </span>
                        {active.keyChallenge}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Detailed Peer-Review Assessment:
                      </div>
                      <div className="text-xs leading-relaxed p-4 rounded-xl bg-white border border-[#E5E7EB] dark:bg-[#161F30] dark:border-[#334155] text-neutral-700 dark:text-neutral-300 whitespace-pre-line shadow-2xs">
                        {active.assessment}
                      </div>
                    </div>

                    {active.majorCritiques && active.majorCritiques.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-[#991B1B] dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Major Methodological Vulnerabilities:</span>
                        </div>
                        <div className="space-y-2">
                          {active.majorCritiques.map((critique: string, i: number) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl bg-white border border-[#E5E7EB] dark:bg-[#161F30] dark:border-[#334155] text-xs text-neutral-800 dark:text-neutral-300 flex items-start gap-2 shadow-2xs"
                            >
                              <span className="font-mono text-[#991B1B] dark:text-rose-400 font-bold text-xs mt-0.5">
                                [{i + 1}]
                              </span>
                              <span className="leading-relaxed">{critique}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Concrete Actionable Solutions & Example Rewrites */}
                    {active.concreteSolutions && active.concreteSolutions.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>Concrete Author Solutions &amp; Suggested Text Rewrites:</span>
                        </div>
                        <div className="space-y-2.5">
                          {active.concreteSolutions.map((sol: any, solIdx: number) => (
                            <div
                              key={solIdx}
                              className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] dark:bg-[#161F30] dark:border-[#334155] text-xs space-y-2 shadow-2xs"
                            >
                              <div className="flex items-start gap-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                                  Issue #{solIdx + 1}
                                </span>
                                <span className="font-semibold text-neutral-800 dark:text-neutral-200 leading-snug">
                                  {sol.issue}
                                </span>
                              </div>
                              <div className="pl-2 border-l-2 border-blue-500/50 space-y-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                                  Recommended Action:
                                </span>
                                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                  {sol.proposedFix}
                                </p>
                              </div>
                              {sol.exampleRewrite && (
                                <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] space-y-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                                  Suggested Text Rewrite:
                                </span>
                                <p className="font-mono text-[11px] text-neutral-800 dark:text-neutral-200 leading-relaxed select-all">
                                  {sol.exampleRewrite}
                                </p>
                              </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {active.missingControlsOrAnalyses && active.missingControlsOrAnalyses.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-[#92400E] dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5" />
                          <span>Missing Experimental Controls &amp; Analyses:</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {active.missingControlsOrAnalyses.map((ctrl: string, i: number) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl bg-white border border-[#E5E7EB] dark:bg-[#161F30] dark:border-[#334155] text-xs text-neutral-800 dark:text-neutral-300 flex items-start gap-2 shadow-2xs"
                            >
                              <span className="text-amber-600 font-bold">•</span>
                              <span className="leading-relaxed">{ctrl}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-[#E5E7EB] dark:border-[#1F2937]">
                      <div className="text-xs font-bold text-[#065F46] dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Mandatory Revisions Demanded for Re-Review:</span>
                      </div>
                      <div className="space-y-1.5">
                        {active.mustAddressItems.map((item: string, i: number) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-white border border-[#E5E7EB] dark:bg-[#161F30] dark:border-[#334155] text-xs text-neutral-800 dark:text-neutral-300 flex items-start gap-2 shadow-2xs"
                          >
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span className="leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Minor Comments */}
                    {active.minorComments && active.minorComments.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB] dark:border-[#1F2937]">
                        <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Minor Comments &amp; Formatting:</span>
                        </div>
                        <div className="space-y-1">
                          {active.minorComments.map((mc: string, idx: number) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-[#334155] text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2"
                            >
                              <span className="text-neutral-400 font-mono text-xs">•</span>
                              <span className="leading-relaxed">{mc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* Citation & Reference Integrity Audit */}
      {report.citationIntegrity && report.citationIntegrity.totalReferences > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#111827] dark:text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Citation &amp; Reference Integrity Audit</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] text-center shadow-2xs">
              <div className="text-2xl font-bold text-[#111827] dark:text-white">
                {report.citationIntegrity.totalReferences}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Total References</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] text-center shadow-2xs">
              <div className="text-2xl font-bold text-emerald-600">
                {report.citationIntegrity.verifiedCount}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Crossref Verified</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] text-center shadow-2xs">
              <div
                className={`text-2xl font-bold ${
                  report.citationIntegrity.unresolvableCount > 0 ? "text-red-600" : "text-[#111827] dark:text-white"
                }`}
              >
                {report.citationIntegrity.unresolvableCount}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Unresolvable DOIs</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] text-center shadow-2xs">
              <div
                className={`text-2xl font-bold ${
                  report.citationIntegrity.retractedCount > 0 ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {report.citationIntegrity.retractedCount}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Retracted Flagged</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] overflow-hidden shadow-2xs">
            <div className="p-3.5 bg-[#F9FAFB] dark:bg-[#161F30] border-b border-[#E5E7EB] dark:border-[#1F2937] flex items-center justify-between text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
              <span>Bibliography References ({report.citationIntegrity.references.length})</span>
              {report.citationIntegrity.references.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllScanRefs(!showAllScanRefs)}
                  className="text-[11px] normal-case font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                >
                  {showAllScanRefs ? "Show First 5 Only" : `Show All (${report.citationIntegrity.references.length})`}
                </button>
              )}
            </div>
            <div className="divide-y divide-[#E5E7EB] dark:divide-[#1F2937]">
              {(showAllScanRefs
                ? report.citationIntegrity.references
                : report.citationIntegrity.references.slice(0, 5)
              ).map((ref, idx) => (
                <div
                  key={idx}
                  className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5 max-w-xl">
                    <div className="text-[#111827] dark:text-white font-medium truncate">{ref.title || ref.raw}</div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                      {ref.doi && <span>DOI: {ref.doi}</span>}
                      {ref.journal && <span>&bull; {ref.journal}</span>}
                      {ref.year && <span>&bull; {ref.year}</span>}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {ref.isRetracted ? (
                      <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
                        RETRACTED
                      </span>
                    ) : ref.status === "valid" ? (
                      <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                        Crossref Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                        Unverified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Target Journal Recommendation Tiers */}
      {report.isEligibleForReview !== false && report.journalRecommendations && report.journalRecommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#111827] dark:text-white">
            <BookOpen className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <span>Target Journal Recommendation Tiers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.journalRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] flex flex-col justify-between shadow-2xs hover:border-neutral-300 dark:hover:border-[#334155] transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        rec.tier === "Reach"
                          ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
                          : rec.tier === "Realistic"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                      }`}
                    >
                      {rec.tier} Tier
                    </span>
                    <div className="flex items-center gap-2">
                      {rec.fitScore !== undefined && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                          Fit: {rec.fitScore}%
                        </span>
                      )}
                      <span className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400">
                        IF: {rec.impactFactor}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-[#111827] dark:text-white mb-0.5">{rec.journalName}</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">{rec.publisher}</p>

                  <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] dark:bg-[#161F30] dark:border-[#334155] text-xs text-neutral-600 dark:text-neutral-400 mb-3 shadow-2xs">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-200 block mb-0.5">Scope Rationale:</span>
                    {rec.scopeRationale}
                  </div>
                </div>

                <div className="text-xs text-[#991B1B] dark:text-rose-400 pt-3 border-t border-[#E5E7EB] dark:border-[#1F2937]">
                  <span className="font-bold block mb-0.5">Desk-Reject Hazard:</span>
                  {rec.rejectionRisks[0] || "Methodological rigor requirements"}
                </div>
              </div>
            ))}
          </div>

          {/* Qualified Field & Catalog Matches (10+ List View) */}
          <div className="pt-2">
            <DesktopJournalMatchesListView
              otherJournals={otherScanJournals}
              detectedDiscipline={scanMatchingData?.detectedDiscipline}
            />
          </div>
        </div>
      )}

      {exportToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium shadow-xl border border-neutral-700 dark:border-neutral-200 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{exportToast}</span>
        </div>
      )}
    </div>
  );
}
