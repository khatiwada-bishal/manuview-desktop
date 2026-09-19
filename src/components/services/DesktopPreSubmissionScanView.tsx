"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Tag,
  AlertCircle,
  Compass,
  Cpu,
} from "lucide-react";
import {
  FullReviewReport,
  BriefJournalFitReport,
  ReviewReport,
  ParsedManuscript,
  ScoreDimension,
} from "@/lib/types";
import JournalCombobox, { JournalInfoTooltip } from "@/components/JournalCombobox";
import { BriefJournalFitView } from "@/components/BriefJournalFitView";
import {
  exportInteractiveHtmlReport,
  exportWordDocReport,
  exportPdfReport,
} from "@/lib/export-generator";
import { ExportCompletedToast, type ExportToastData } from "@/components/ExportCompletedToast";
import { pickManuscriptFileDesktop, isDesktopApp } from "@/lib/desktop";
import { extractTextFromFile, parseManuscriptText } from "@/lib/parser";
import { runManuscriptDiagnostic } from "@/lib/diagnostic-engine";
import { fetchLiveJournalScope, JournalScopeProfile } from "@/lib/journal-scope-service";
import { sanitizeErrorMessage, resolveActiveConfig } from "@/lib/llm";
import { useApiConnection } from "@/lib/useApiConnection";
import { PaperItem } from "@/components/DesktopSidebar";
import { DesktopDashboardData } from "@/components/DesktopDashboard";
import { findMatchingJournals } from "@/lib/journals";
import { ScanModelPickerBar } from "@/components/scan/ScanModelPickerBar";
import { ScanInputForm } from "@/components/scan/ScanInputForm";
import { ScanFullResultsView } from "@/components/scan/ScanFullResultsView";
import { DashboardGlassIllustration } from "@/components/dashboard/DashboardGlassIllustration";
import { useScanManager } from "@/context/ScanContext";

const SAMPLE_PREPRINT_TITLE = "Single-cell transcriptional profiling of DLL3 activation in neuroendocrine lung carcinoma";
const SAMPLE_PREPRINT_JOURNAL = "Nature Communications";
const SAMPLE_PREPRINT_ABSTRACT =
  "Small cell lung cancer (SCLC) exhibits rapid recurrence and therapy resistance. Delta-like ligand 3 (DLL3) is an established cell-surface target for antibody-drug conjugates and T-cell engagers. However, the precise cis-regulatory mechanisms controlling DLL3 transcription remain uncharacterized. Here, we perform marker-based CRISPR-Cas9 screens and identify the transcription factor POU2F1 as a primary driver of DLL3 expression. We demonstrate that POU2F1 directly binds the DLL3 distal enhancer element to drive chemoresistance in clinical isolates. Knockdown of POU2F1 caused significant downregulation of DLL3 mRNA across 8 patient-derived organoid lines. Our findings prove that targeting POU2F1 will rescue therapeutic efficacy in neuroendocrine lung carcinoma and provide a universal predictive biomarker for clinical stratification.";
const SAMPLE_PREPRINT_KEYWORDS =
  "small cell lung cancer, DLL3, POU2F1, CRISPR screen, organoids, chemoresistance, antibody-drug conjugates";
const SAMPLE_PREPRINT_TEXT = `Title: Single-cell transcriptional profiling of DLL3 activation in neuroendocrine lung carcinoma

Abstract:
Small cell lung cancer (SCLC) exhibits rapid recurrence and therapy resistance. Delta-like ligand 3 (DLL3) is an established cell-surface target for antibody-drug conjugates and T-cell engagers. However, the precise cis-regulatory mechanisms controlling DLL3 transcription remain uncharacterized. Here, we perform marker-based CRISPR-Cas9 screens and identify the transcription factor POU2F1 as a primary driver of DLL3 expression. We demonstrate that POU2F1 directly binds the DLL3 distal enhancer element to drive chemoresistance in clinical isolates. Knockdown of POU2F1 caused significant downregulation of DLL3 mRNA across 8 patient-derived organoid lines. Our findings prove that targeting POU2F1 will rescue therapeutic efficacy in neuroendocrine lung carcinoma and provide a universal predictive biomarker for clinical stratification.

Methods:
Patient-derived neuroendocrine organoids (n=8) were maintained in 3D Matrigel culture. For CRISPR knockout screens, a custom sgRNA library targeting 1,200 chromatin regulators was transduced at an MOI of 0.3. Differential expression was evaluated using single-cell RNA sequencing on Illumina NovaSeq 6000. Significance testing was conducted via two-tailed unpaired Student's t-tests (p < 0.05 considered significant).

Results:
POU2F1 was nominated as the top hit in the genome-wide enrichment assay (Fold Change = 4.2, p = 0.002). Correlative RNA-seq analysis indicated elevated POU2F1 expression in recurrent vs. treatment-naive cohorts. Western blot analysis confirmed reduction of DLL3 upon shRNA treatment.

Discussion:
Our study proves that POU2F1 is the essential master regulator of neuroendocrine identity in lung cancer. Targeting this regulatory axis will prevent relapse in all patients receiving DLL3-targeted therapeutics.

References:
1. Saunders D, et al. A DLL3-targeted antibody-drug conjugate for small cell lung cancer. Sci Transl Med. 2015. DOI: 10.1126/scitranslmed.aac9459
2. Rudin CM, et al. Molecular subtypes of small cell lung cancer: a synthesis of biology and therapeutics. Nat Rev Cancer. 2019. DOI: 10.1038/s41568-019-0133-9
3. Fake A, Hallucinated B. AI generated non-existent reference. J Cancer. 2024. DOI: 10.1038/s41586-999-fake01
4. Wakefield AJ, et al. Ileal-lymphoid-nodular hyperplasia and pervasive developmental disorder in children. Lancet. 1998. DOI: 10.1016/S0140-6736(97)11096-0`;

interface DesktopPreSubmissionScanViewProps {
  onComplete?: (newPaper: PaperItem, data: DesktopDashboardData, fullReport?: FullReviewReport) => void;
  onOpenSettings?: () => void;
}

export function DesktopPreSubmissionScanView({
  onComplete,
  onOpenSettings,
}: DesktopPreSubmissionScanViewProps) {
  const [manuscriptTitle, setManuscriptTitle] = useState("");
  const [manuscriptAbstract, setManuscriptAbstract] = useState("");
  const [manuscriptKeywords, setManuscriptKeywords] = useState("");
  const [targetJournal, setTargetJournal] = useState("");
  const [targetJournalError, setTargetJournalError] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [loadingPercent, setLoadingPercent] = useState<number | undefined>(undefined);
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<number>(0);
  const [selectedRadarDim, setSelectedRadarDim] = useState<ScoreDimension | null>(null);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [showAllScanRefs, setShowAllScanRefs] = useState(false);
  const [activeExportFormat, setActiveExportFormat] = useState<string | null>(null);
  const [exportToast, setExportToast] = useState<ExportToastData | null>(null);
  const [compatibilityMatch, setCompatibilityMatch] = useState<{
    journalName: string;
    journalDiscipline: string;
    manuscriptDiscipline: string;
    summary: string;
    parsed: ParsedManuscript;
    liveScope: JournalScopeProfile | null;
  } | null>(null);

  const { isScanning, startScan } = useScanManager();

  const {
    status: apiStatus,
    isLoading: isApiLoading,
    providerName,
    modelName,
    rawModelId,
    latencyMs,
    availableModels,
    errorMessage: apiErrorMessage,
    refresh: checkProviderStatus,
    selectModel: handleSelectModel,
  } = useApiConnection();

  const activeProviderInfo = useMemo(() => ({
    name: providerName || "AI Engine",
    model: rawModelId || modelName || "Checking status...",
  }), [providerName, rawModelId, modelName]);

  const scanMatchingData = useMemo(() => {
    if (!report) return null;
    const citedJournals =
      "citationIntegrity" in report && report.citationIntegrity
        ? (report.citationIntegrity.references || []).map((r) => r.journal || "").filter(Boolean)
        : [];
    return findMatchingJournals(
      report.title || "",
      report.summary || "",
      report.targetJournal || "",
      citedJournals
    );
  }, [report]);

  const otherScanJournals = useMemo(() => {
    return scanMatchingData?.otherMatches || [];
  }, [scanMatchingData]);

  const handleTargetJournalChange = (val: string) => {
    setTargetJournal(val);
    setCompatibilityMatch(null);
    if (val.trim()) {
      setTargetJournalError(false);
    }
  };

  const handleLoadSampleQuick = () => {
    setManuscriptTitle(SAMPLE_PREPRINT_TITLE);
    setTargetJournal(SAMPLE_PREPRINT_JOURNAL);
    setManuscriptAbstract(SAMPLE_PREPRINT_ABSTRACT);
    setManuscriptKeywords(SAMPLE_PREPRINT_KEYWORDS);
    setFile(null);
    setFileName(null);
    setError(null);
    setCompatibilityMatch(null);
  };

  const handleLoadSampleFull = () => {
    setManuscriptTitle(SAMPLE_PREPRINT_TITLE);
    setTargetJournal(SAMPLE_PREPRINT_JOURNAL);
    setManuscriptAbstract(SAMPLE_PREPRINT_ABSTRACT);
    setManuscriptKeywords(SAMPLE_PREPRINT_KEYWORDS);
    const blob = new Blob([SAMPLE_PREPRINT_TEXT], { type: "text/plain;charset=utf-8" });
    const sampleFile = new File([blob], "sample_sclc_manuscript.txt", { type: "text/plain" });
    setFile(sampleFile);
    setFileName("sample_sclc_manuscript.txt");
    setError(null);
    setCompatibilityMatch(null);
  };

  const handleNativePick = async () => {
    if (isDesktopApp()) {
      const res = await pickManuscriptFileDesktop();
      if (res) {
        setFileName(res.name);
        const blob = new Blob([res.bytes as unknown as BlobPart]);
        const f = new File([blob], res.name);
        setFile(f);
        setError(null);
        setCompatibilityMatch(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setFileName(f.name);
      setError(null);
      setCompatibilityMatch(null);
    }
  };

  const handleExport = async (format: "pdf" | "html" | "word") => {
    if (!report || activeExportFormat) return;
    setActiveExportFormat(format);

    try {
      let res: { success: boolean; filePath?: string; cancelled?: boolean; error?: string } | undefined;
      let label = "";

      if (format === "pdf") {
        label = "PDF Report (.pdf)";
        res = await exportPdfReport(report);
      } else if (format === "html") {
        label = "Interactive HTML (.html)";
        res = await exportInteractiveHtmlReport(report);
      } else if (format === "word") {
        label = "Word Document (.doc)";
        res = await exportWordDocReport(report);
      }

      if (res?.success) {
        setExportToast({
          id: Date.now(),
          status: "success",
          message: `Report exported successfully as ${label}`,
          fileName: res.filePath ? res.filePath.split(/[\\/]/).pop() : undefined,
          filePath: res.filePath,
        });
      } else if (res?.error) {
        setExportToast({
          id: Date.now(),
          status: "error",
          message: `Export failed: ${res.error}`,
        });
      }
    } catch (err) {
      console.error(`Export ${format} error:`, err);
      setExportToast({
        id: Date.now(),
        status: "error",
        message: `Failed to export ${format}: ${String(err)}`,
      });
    } finally {
      setActiveExportFormat(null);
    }
  };

  const handleDownloadPDF = () => {
    handleExport("pdf");
  };

  const registerCompletedScan = (fullReport: any) => {
    if (!onComplete) return;
    const isExplicitlySent =
      fullReport.editorialTriage?.outcome === "sent_for_review" ||
      fullReport.editorialTriage?.sentToPeerReview === true ||
      Boolean(fullReport.editorialTriage?.summary?.includes("Cleared editorial triage"));
    const isDeskReject =
      !isExplicitlySent &&
      (fullReport.editorialTriage?.outcome === "desk_reject" ||
      fullReport.ineligibilityReason === "scope_mismatch" ||
      fullReport.targetJournalEvaluation?.isDisciplinaryMismatch === true);
    fullReport.isDeskReject = isDeskReject;
    const isEligible = !isDeskReject && fullReport.isEligibleForReview !== false;
    const isPublished =
      !isDeskReject &&
      (fullReport.ineligibilityReason === "already_published" ||
      Boolean(fullReport.publishedDetails?.isPublished));

    const newPaper: PaperItem = {
      id: `paper-${Date.now()}`,
      title: fullReport.title || manuscriptTitle || "Untitled Manuscript",
      shortName: (fullReport.title || manuscriptTitle || "Manuscript")
        .split(" ")
        .slice(0, 3)
        .join(" "),
      journal: fullReport.publishedDetails?.journalName || targetJournal,
      score: isDeskReject ? undefined : (isEligible ? (fullReport.overallScore || 80) : undefined),
      isEligibleForReview: !isDeskReject && isEligible,
      isDeskReject: isDeskReject,
      ineligibilityReason: isDeskReject ? "scope_mismatch" : fullReport.ineligibilityReason,
      isPublished: isPublished,
      publishedJournal: fullReport.publishedDetails?.journalName,
      editorialTriage: fullReport.editorialTriage,
      targetJournalEvaluation: fullReport.targetJournalEvaluation,
      createdAt: fullReport.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const dashboardData: DesktopDashboardData = {
      paperTitle: newPaper.title,
      headlineTitle: isDeskReject
        ? `${targetJournal} Pre-Submission Diagnostic (Desk Reject)`
        : isPublished
        ? `${newPaper.journal} (Published Article)`
        : `${targetJournal} Pre-Submission Diagnostic`,
      targetJournal: newPaper.journal,
      aiEngine: activeProviderInfo.name || "AI ENGINE",
      latencyMs: 120,
      score: isDeskReject ? undefined : (isEligible ? (fullReport.overallScore || 80) : undefined),
      isDeskReject: isDeskReject,
      editorialTriage: fullReport.editorialTriage,
      statusText: isDeskReject
        ? "Editorial Desk Reject (Scope Mismatch)"
        : !isEligible
        ? isPublished
          ? "Already Published Article"
          : "Ineligible Document Type"
        : (fullReport.overallScore || 80) >= 80
        ? "High Acceptance Probability"
        : "Revision Prioritized",
      vulnerabilities:
        fullReport.priorityIssues?.map((issue: any) => ({
          type: (issue.category === "Causal Claims"
            ? "overclaim"
            : "sample_size") as "overclaim" | "sample_size",
          title: issue.title,
          description: issue.description,
          severity: (issue.priority === "A" ? "critical" : "warning") as
            | "critical"
            | "warning",
        })) || [],
      reviewers:
        fullReport.reviewerPersonas?.map((p: any) => ({
          name: p.name,
          role: p.title || p.persona,
          tag: (p.decisionRecommendation?.includes("Reject")
            ? "Critical"
            : "Major") as "Major" | "Minor" | "Critical",
          quote:
            p.keyChallenge ||
            p.assessment?.slice(0, 150) ||
            "Comprehensive evaluation required.",
          detail: p.majorCritiques?.join(" ") || p.assessment || "",
        })) || [],
      citationAudit: {
        verifiedCount: fullReport.citationIntegrity?.verifiedCount ?? 0,
        totalCount: fullReport.citationIntegrity?.totalReferences ?? 0,
        retractedCount: fullReport.citationIntegrity?.retractedCount ?? 0,
        notes: fullReport.citationIntegrity?.references?.length
          ? `Verified ${fullReport.citationIntegrity.verifiedCount} DOIs via CrossRef Open API.`
          : undefined,
      },
    };

    onComplete(newPaper, dashboardData, fullReport);
  };

  // Unified 1-click execution: Run Pre-Submission AI Review & 5-Persona Simulation
  const handleRunReview = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isScanning || isInitiating) return;

    if (!targetJournal.trim()) {
      setTargetJournalError(true);
      setError("Target Journal is required for calibrated rubric evaluation.");
      return;
    }

    const isFileScan = !!file;
    const hasMetadata = !!(manuscriptTitle.trim() && manuscriptAbstract.trim());

    if (!isFileScan && !hasMetadata) {
      setError("Please provide either a manuscript document or Title and Abstract.");
      return;
    }

    setError(null);
    setIsInitiating(true);
    try {
      await startScan({
        title: manuscriptTitle.trim() || (file?.name ? file.name.replace(/\.[^/.]+$/, "") : "Untitled Manuscript"),
        abstract: manuscriptAbstract.trim(),
        keywords: manuscriptKeywords.trim(),
        targetJournal: targetJournal.trim(),
        file: file,
      });
    } catch (err: any) {
      console.error("Diagnostic scan initiation error:", err);
      setError(
        sanitizeErrorMessage(
          err?.message || "Failed to initiate diagnostic scan. Please verify your AI provider credentials."
        )
      );
    } finally {
      setIsInitiating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-[#111827] dark:text-[#F8FAFC] relative">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Creative Showcase Hero Card (PureMac / Dark Aesthetic) */}
        <div className="rounded-3xl bg-[#0B0F17] text-white shadow-2xl p-6 sm:p-8 overflow-hidden relative border border-white/[0.08]">
          {/* Ambient atmosphere glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              {/* Glowing Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15 backdrop-blur-md shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="font-mono text-[11px] tracking-wide text-blue-300">
                  AI PRE-SUBMISSION DIAGNOSTIC
                </span>
                <span className="text-white/40">•</span>
                <span className="text-white/70 text-[11px]">CALIBRATED v0.3.97</span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                  Manuscript Review Studio
                </h1>
                <p className="text-xs sm:text-sm text-neutral-300 font-normal leading-relaxed">
                  Calibrated 5-persona peer-review simulation uncovering desk-rejection hazards, causal overclaims, missing experimental controls, and citation integrity bugs prior to journal submission.
                </p>
              </div>

              {/* Feature Highlights Pills */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] font-medium text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  5 Referee Personas
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] font-medium text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  48,000+ Journal Scopes
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] font-medium text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  Crossref &amp; Retractions
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] font-medium text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Zero Retention
                </span>
              </div>
            </div>

            {/* Right side 3D Glass Stack Illustration */}
            <div className="shrink-0 hidden sm:flex items-center justify-center lg:pr-4">
              <DashboardGlassIllustration className="w-56 h-44 lg:w-64 lg:h-48" />
            </div>
          </div>
        </div>

        {/* Configuration & Calibration Card */}
        <div className="rounded-3xl liquid-glass-card p-5 sm:p-6 space-y-4 relative z-30 border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Target Venue &amp; Model Calibration
                </h3>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  Calibrate acceptance rubric and referee strictness to your chosen journal
                </p>
              </div>
            </div>
            {targetJournal && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Rubric Calibrated
              </span>
            )}
          </div>

          {/* Target Journal */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm relative z-30 pt-1">
            <span className="w-48 sm:w-52 shrink-0 flex items-center gap-1.5 font-semibold text-[#6B7280] dark:text-neutral-400 whitespace-nowrap">
              <Tag className="w-4 h-4 text-[#9CA3AF] dark:text-neutral-500" />
              <span>Target Journal <span className="text-red-500">*</span></span>
              <JournalInfoTooltip journal={targetJournal} />
            </span>
            <div className="flex-1 max-w-lg relative z-30">
              <JournalCombobox
                value={targetJournal}
                onChange={handleTargetJournalChange}
                hasError={targetJournalError}
                showScopeBadge={false}
                placeholder="Search or select from 48,000+ journals..."
              />
              {targetJournalError && (
                <div className="text-[11px] text-[#991B1B] dark:text-rose-400 font-medium flex items-center gap-1 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#991B1B] dark:text-rose-400" />
                  <span>Target Journal is required for calibrated rubric evaluation.</span>
                </div>
              )}
            </div>
          </div>

          <ScanModelPickerBar
            apiStatus={apiStatus}
            isApiLoading={isApiLoading}
            activeProviderInfo={activeProviderInfo}
            availableModels={availableModels}
            apiErrorMessage={apiErrorMessage}
            latencyMs={latencyMs}
            modelDropdownOpen={modelDropdownOpen}
            setModelDropdownOpen={setModelDropdownOpen}
            modelSearchQuery={modelSearchQuery}
            setModelSearchQuery={setModelSearchQuery}
            handleSelectModel={handleSelectModel}
            checkProviderStatus={checkProviderStatus}
            onOpenSettings={onOpenSettings}
            isScanning={isScanning}
          />
        </div>

        {/* Input Form Card */}
        {!report && (
          <ScanInputForm
            manuscriptTitle={manuscriptTitle}
            setManuscriptTitle={setManuscriptTitle}
            manuscriptAbstract={manuscriptAbstract}
            setManuscriptAbstract={setManuscriptAbstract}
            manuscriptKeywords={manuscriptKeywords}
            setManuscriptKeywords={setManuscriptKeywords}
            file={file}
            fileName={fileName}
            setFile={setFile}
            setFileName={setFileName}
            error={error}
            setError={setError}
            compatibilityMatch={compatibilityMatch}
            setCompatibilityMatch={setCompatibilityMatch}
            loading={loading}
            loadingStep={loadingStep}
            loadingPercent={loadingPercent}
            handleLoadSampleQuick={handleLoadSampleQuick}
            handleLoadSampleFull={handleLoadSampleFull}
            handleNativePick={handleNativePick}
            handleFileChange={handleFileChange}
            handleRunReview={handleRunReview}
            onOpenSettings={onOpenSettings}
            isScanning={isScanning || isInitiating}
          />
        )}

        {/* Diagnostic Report Results */}
        {report &&
          (report.mode === "brief_fit" ? (
            <BriefJournalFitView
              report={report as BriefJournalFitReport}
              onBack={() => setReport(null)}
              onDownloadPDF={handleDownloadPDF}
              activeProviderInfo={activeProviderInfo}
            />
          ) : (
            <ScanFullResultsView
              report={report as FullReviewReport}
              onBack={() => setReport(null)}
              activeExportFormat={activeExportFormat}
              handleExport={handleExport}
              selectedPersona={selectedPersona}
              setSelectedPersona={setSelectedPersona}
              selectedRadarDim={selectedRadarDim}
              setSelectedRadarDim={setSelectedRadarDim}
              showAllScanRefs={showAllScanRefs}
              setShowAllScanRefs={setShowAllScanRefs}
              otherScanJournals={otherScanJournals}
              scanMatchingData={scanMatchingData}
              exportToast={null}
            />
          ))}

        {/* Bottom-right toast notification with folder navigation link */}
        <ExportCompletedToast
          toast={exportToast}
          onClose={() => setExportToast(null)}
        />
      </div>
    </div>
  );
}
