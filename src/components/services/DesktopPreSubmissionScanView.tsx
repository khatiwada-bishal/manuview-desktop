"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Users,
  BarChart3,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Hash,
  Tag,
  CheckSquare,
  GraduationCap,
  FlaskConical,
  Info,
  ArrowLeft,
  Activity,
  Zap,
  Check,
  ChevronDown,
  Download,
  Printer,
  Globe,
  Plus,
} from "lucide-react";
import {
  FullReviewReport,
  BriefJournalFitReport,
  ReviewReport,
  PriorityIssue,
  ReviewerPersonaFeedback,
  ProviderConfig,
  AvailableModel,
} from "@/lib/types";
import JournalCombobox from "@/components/JournalCombobox";
import { BriefJournalFitView, BriefJournalFitPrintView } from "@/components/BriefJournalFitView";
import { exportInteractiveHtmlReport, exportWordDocReport } from "@/lib/export-generator";
import { pickManuscriptFileDesktop, isDesktopApp } from "@/lib/desktop";
import { extractTextFromFile, parseManuscriptText } from "@/lib/parser";
import { runManuscriptDiagnostic, runBriefJournalFitAnalysis } from "@/lib/diagnostic-engine";
import { callLLM, fetchAvailableModels, testLLMConnection } from "@/lib/llm";
import { PaperItem } from "@/components/DesktopSidebar";
import { DesktopDashboardData } from "@/components/DesktopDashboard";
import { findMatchingJournals } from "@/lib/journals";
import DesktopJournalMatchesListView from "@/components/DesktopJournalMatchesListView";

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

const SAMPLE_PREPRINT = {
  title: SAMPLE_PREPRINT_TITLE,
  journal: SAMPLE_PREPRINT_JOURNAL,
  abstract: SAMPLE_PREPRINT_ABSTRACT,
  keywords: SAMPLE_PREPRINT_KEYWORDS,
};

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
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [loadingPercent, setLoadingPercent] = useState<number | undefined>(undefined);
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<number>(0);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "unconfigured" | "error">("checking");
  const [apiErrorMessage, setApiErrorMessage] = useState<string>("");
  const [scanPingResult, setScanPingResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    error?: string;
  } | null>(null);
  const [activeProviderInfo, setActiveProviderInfo] = useState<{
    name: string;
    model: string;
  }>({ name: "AI Engine", model: "Checking status..." });

  const scanMatchingData = React.useMemo(() => {
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

  const otherScanJournals = React.useMemo(() => {
    return scanMatchingData?.otherMatches || [];
  }, [scanMatchingData]);

  useEffect(() => {
    checkProviderStatus();
  }, []);

  const checkProviderStatus = async () => {
    setPinging(true);
    setApiStatus("checking");
    setApiErrorMessage("");

    const saved = localStorage.getItem("manuview_provider_config");
    let browserConfig: ProviderConfig | null = null;
    if (saved) {
      try {
        browserConfig = JSON.parse(saved);
      } catch {}
    }

    const hasClientKey = !!(browserConfig && browserConfig.apiKey?.trim());
    const isOllama = browserConfig?.provider === "ollama";

    if (!hasClientKey && !isOllama) {
      setActiveProviderInfo({
        name: "No Provider",
        model: "Requires API Key",
      });
      setApiStatus("unconfigured");
      setScanPingResult(null);
      setPinging(false);
      return;
    }

    const models = await fetchAvailableModels(browserConfig || undefined);
    setAvailableModels(models);

    setActiveProviderInfo({
      name: isOllama ? "Local Ollama" : (browserConfig?.provider || "AI").toUpperCase(),
      model: browserConfig?.model || (models[0]?.id || "active"),
    });

    try {
      const pingRes = await testLLMConnection(browserConfig || undefined);
      if (pingRes.success) {
        setApiStatus("connected");
        setScanPingResult({
          success: true,
          latencyMs: pingRes.latencyMs || 0,
          message: pingRes.message || "Connection operational",
        });
      } else {
        setApiStatus("error");
        const errMsg = pingRes.error || pingRes.message || "Connection failed";
        setApiErrorMessage(errMsg);
        setScanPingResult({
          success: false,
          latencyMs: pingRes.latencyMs || 0,
          message: "Connection failed",
          error: errMsg,
        });
      }
    } catch (err: any) {
      setApiStatus("error");
      const errMsg = err?.message || "Network error checking connection";
      setApiErrorMessage(errMsg);
      setScanPingResult({
        success: false,
        latencyMs: 0,
        message: "Network test failed",
        error: errMsg,
      });
    } finally {
      setPinging(false);
    }
  };

  const handleSelectModel = (modelId: string) => {
    const saved = localStorage.getItem("manuview_provider_config");
    let current: ProviderConfig = { provider: "gemini", model: modelId };
    if (saved) {
      try {
        current = JSON.parse(saved);
      } catch {}
    }
    current.model = modelId;
    localStorage.setItem("manuview_provider_config", JSON.stringify(current));
    setActiveProviderInfo((prev) => ({ ...prev, model: modelId }));
    setModelDropdownOpen(false);
  };

  const handleTargetJournalChange = (val: string) => {
    setTargetJournal(val);
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
  };

  const handleLoadSample = handleLoadSampleQuick;

  const handleNativePick = async () => {
    if (isDesktopApp()) {
      const res = await pickManuscriptFileDesktop();
      if (res) {
        setFileName(res.name);
        const blob = new Blob([res.bytes as unknown as BlobPart]);
        const f = new File([blob], res.name);
        setFile(f);
        setError(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setFileName(f.name);
      setError(null);
    }
  };

  const handleDownloadPDF = () => {
    if (!report) return;
    const originalTitle = document.title;
    const sanitized = (report.title || "Manuscript")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 45);
    document.title = `ManuView_Diagnostic_Report_${sanitized}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  const handleExportHTML = () => {
    if (!report) return;
    exportInteractiveHtmlReport(report);
  };

  const handleExportWord = () => {
    if (!report) return;
    exportWordDocReport(report);
  };

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiStatus !== "connected") {
      setError(
        apiStatus === "unconfigured"
          ? "Pre-submission scan is disabled: No LLM API connection configured. Please set your API key in AI Settings."
          : "Pre-submission scan is disabled: The configured LLM connection is not working. Please fix your credentials in AI Settings."
      );
      return;
    }

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

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const savedConfig = localStorage.getItem("manuview_provider_config");
      const providerConfig: ProviderConfig | undefined = savedConfig
        ? JSON.parse(savedConfig)
        : undefined;

      if (isFileScan) {
        // Full document audit
        setLoadingStep("Extracting sections and parsing bibliography...");
        setLoadingPercent(10);

        const extracted = await extractTextFromFile(file);
        const parsed = parseManuscriptText(extracted, file.name || "manuscript.txt");
        if (manuscriptTitle.trim()) parsed.title = manuscriptTitle.trim();
        if (manuscriptAbstract.trim()) parsed.abstract = manuscriptAbstract.trim();

        const fullReport = await runManuscriptDiagnostic(
          parsed,
          providerConfig,
          targetJournal,
          (update) => {
            setLoadingStep(update.message);
            if (update.percent !== undefined) setLoadingPercent(update.percent);
          }
        );
        setReport(fullReport);

        // Register paper in articles store if onComplete provided
        if (onComplete) {
          const isEligible = fullReport.isEligibleForReview !== false;
          const isPublished =
            fullReport.ineligibilityReason === "already_published" ||
            Boolean(fullReport.publishedDetails?.isPublished);

          const newPaper: PaperItem = {
            id: `paper-${Date.now()}`,
            title: fullReport.title || manuscriptTitle || "Untitled Manuscript",
            shortName: (fullReport.title || manuscriptTitle || "Manuscript")
              .split(" ")
              .slice(0, 3)
              .join(" "),
            journal: fullReport.publishedDetails?.journalName || targetJournal,
            score: isEligible ? (fullReport.overallScore || 80) : undefined,
            isEligibleForReview: isEligible,
            ineligibilityReason: fullReport.ineligibilityReason,
            isPublished: isPublished,
            publishedJournal: fullReport.publishedDetails?.journalName,
          };

          const dashboardData: DesktopDashboardData = {
            paperTitle: newPaper.title,
            headlineTitle: isPublished
              ? `${newPaper.journal} (Published Article)`
              : `${targetJournal} Pre-Submission Diagnostic`,
            targetJournal: newPaper.journal,
            aiEngine: activeProviderInfo.name || "AI ENGINE",
            latencyMs: 120,
            score: isEligible ? (fullReport.overallScore || 80) : undefined,
            statusText: !isEligible
              ? isPublished
                ? "Already Published Article"
                : "Ineligible Document Type"
              : (fullReport.overallScore || 80) >= 80
              ? "High Acceptance Probability"
              : "Revision Prioritized",
            vulnerabilities:
              fullReport.priorityIssues?.map((issue) => ({
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
              fullReport.reviewerPersonas?.map((p) => ({
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
              verifiedCount: fullReport.citationIntegrity?.verifiedCount || 10,
              totalCount: fullReport.citationIntegrity?.totalReferences || 10,
              retractedCount: fullReport.citationIntegrity?.retractedCount || 0,
              notes: fullReport.citationIntegrity?.references?.length
                ? `Verified ${fullReport.citationIntegrity.verifiedCount} DOIs via CrossRef Open API.`
                : undefined,
            },
          };

          onComplete(newPaper, dashboardData, fullReport);
        }
      } else {
        // Fast editorial scope validation
        setLoadingStep("Evaluating manuscript title & abstract scope...");
        setLoadingPercent(20);

        const briefReport = await runBriefJournalFitAnalysis(
          {
            title: manuscriptTitle,
            abstract: manuscriptAbstract,
            keywords: manuscriptKeywords,
            targetJournal: targetJournal || "Target Journal",
            providerConfig,
          },
          (update) => {
            setLoadingStep(update.message);
            if (update.percent !== undefined) setLoadingPercent(update.percent);
          }
        );
        setReport(briefReport);
      }
    } catch (err: any) {
      console.error("Diagnostic scan error:", err);
      setError(err?.message || "Failed to generate diagnostic report. Please verify your AI provider credentials.");
    } finally {
      setLoading(false);
      setLoadingStep("");
      setLoadingPercent(undefined);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-[#111827] dark:text-[#F8FAFC] relative">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>5-Persona AI Review &amp; Diagnostic Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
              Pre-Submission AI Review &amp; Diagnostic
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
              Calibrated peer-review rubric to surface desk-rejection hazards, causal overclaims, missing controls, and citation integrity bugs before submission.
            </p>
          </div>
        </div>

        {/* Configuration & Calibration Card */}
        <div className="rounded-3xl liquid-glass-card p-5 sm:p-6 space-y-4 relative z-30">
          {/* Target Journal */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm relative z-30">
            <span className="w-36 flex items-center gap-2 font-semibold text-[#6B7280] dark:text-neutral-400">
              <Tag className="w-4 h-4 text-[#9CA3AF] dark:text-neutral-500" />
              Target Journal <span className="text-red-500">*</span>
            </span>
            <div className="flex-1 max-w-lg relative z-30">
              <JournalCombobox
                value={targetJournal}
                onChange={handleTargetJournalChange}
                hasError={targetJournalError}
                placeholder="Type at least 3 letters to search 1,390+ journals..."
              />
              {targetJournalError && (
                <div className="text-[11px] text-[#991B1B] dark:text-rose-400 font-medium flex items-center gap-1 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#991B1B] dark:text-rose-400" />
                  <span>Target Journal is required for calibrated rubric evaluation.</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Engine */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
            <span className="w-36 flex items-center gap-2 font-semibold text-[#6B7280] dark:text-neutral-400">
              <SlidersHorizontal className="w-4 h-4 text-[#9CA3AF] dark:text-neutral-500" />
              AI Engine
            </span>
            <div className="flex-1 flex flex-wrap items-center gap-2">
              {apiStatus === "connected" && (
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#ECFDF5] dark:bg-emerald-950/50 text-[#065F46] dark:text-emerald-300 border border-[#A7F3D0] dark:border-emerald-800 hover:bg-[#D1FAE5] dark:hover:bg-emerald-900/50 transition shadow-2xs cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span>
                      {activeProviderInfo.name}: <span className="font-mono">{activeProviderInfo.model}</span>
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#065F46] dark:text-emerald-300 ml-0.5" />
                  </button>

                  {modelDropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-72 rounded-2xl bg-white dark:bg-[#161F30] border border-[#E5E7EB] dark:border-[#334155] shadow-xl p-2.5 z-40 animate-fade-in text-xs">
                      <div className="px-2 py-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 border-b border-[#E5E7EB] dark:border-[#334155] uppercase tracking-wider flex items-center justify-between">
                        <span>Select Available Model</span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                          {availableModels.length} models
                        </span>
                      </div>
                      <div className="max-h-56 overflow-y-auto py-1 space-y-1 [scrollbar-width:thin]">
                        {availableModels.map((m) => {
                          const isCur = activeProviderInfo.model === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSelectModel(m.id)}
                              className={`w-full text-left px-2.5 py-2 rounded-xl transition flex items-start justify-between gap-2 ${
                                isCur
                                  ? "bg-neutral-100 dark:bg-[#1E293B] text-[#111827] dark:text-white font-semibold border border-neutral-300 dark:border-neutral-600"
                                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#1E293B]/50"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs truncate">{m.id}</span>
                                  {m.tag && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                      {m.tag}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">{m.description}</div>
                              </div>
                              {isCur && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                      <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#334155] flex items-center justify-between px-1">
                        <button
                          type="button"
                          onClick={() => {
                            setModelDropdownOpen(false);
                            if (onOpenSettings) onOpenSettings();
                          }}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                        >
                          AI Settings &amp; Custom Keys &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {apiStatus === "unconfigured" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEF3C7] dark:bg-amber-950/40 text-[#92400E] dark:text-amber-300 border border-[#FDE68A] dark:border-amber-800">
                  <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                  No API Key (Setup Required)
                </span>
              )}

              {apiStatus === "error" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEF2F2] dark:bg-rose-950/40 text-[#991B1B] dark:text-rose-300 border border-[#FECACA] dark:border-rose-800">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                  {activeProviderInfo.name}: Connection Error
                </span>
              )}

              {apiStatus === "checking" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                  Testing Connection...
                </span>
              )}

              <button
                type="button"
                onClick={checkProviderStatus}
                disabled={pinging}
                className="isolate inline-flex items-center justify-center gap-1.5 text-xs px-2.5 py-1 min-w-[110px] rounded-lg bg-white dark:bg-[#1E293B] hover:bg-neutral-50 dark:hover:bg-[#334155] border border-[#E5E7EB] dark:border-[#334155] text-neutral-700 dark:text-neutral-300 shadow-2xs transition-colors disabled:opacity-60 cursor-pointer select-none"
                style={{ transform: "translateZ(0)" }}
                title="Test API connection & ping latency"
              >
                {pinging ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                )}
                {pinging ? (
                  <span key="pinging">Testing...</span>
                ) : (
                  <span key="idle">Check Latency</span>
                )}
              </button>

              {scanPingResult && (
                <span
                  title={scanPingResult.error || scanPingResult.message}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium border ${
                    scanPingResult.success
                      ? "bg-[#ECFDF5] dark:bg-emerald-950/50 text-[#065F46] dark:text-emerald-300 border-[#A7F3D0] dark:border-emerald-800"
                      : "bg-[#FEF2F2] dark:bg-rose-950/50 text-[#991B1B] dark:text-rose-300 border-[#FECACA] dark:border-rose-800"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span>
                    {scanPingResult.success
                      ? `${scanPingResult.latencyMs}ms`
                      : `Failed`}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Diagnostic Scope */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
            <span className="w-36 flex items-center gap-2 font-semibold text-[#6B7280] dark:text-neutral-400">
              <Hash className="w-4 h-4 text-[#9CA3AF] dark:text-neutral-500" />
              Diagnostic Scope
            </span>
            <div className="flex-1 text-neutral-600 dark:text-neutral-400 text-xs">
              6 Evaluation Dimensions &bull; 5 Reviewer Personas &bull; Live Crossref DOI Validation &bull; Retraction Screening
            </div>
          </div>

          {/* Data Retention */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
            <span className="w-36 flex items-center gap-2 font-semibold text-[#6B7280] dark:text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-[#9CA3AF] dark:text-neutral-500" />
              Data Retention
            </span>
            <div className="flex-1 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-medium text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Zero-storage &bull; In-memory only &bull; Never used to train models</span>
            </div>
          </div>
        </div>

        {/* Input Form Card */}
        {!report && (
          <form onSubmit={handleRunScan} className="rounded-3xl liquid-glass-card p-6 space-y-6 relative z-10">
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
                    onChange={(e) => setManuscriptKeywords(e.target.value)}
                    placeholder="e.g. small cell lung cancer, DLL3, CRISPR screen, organoids"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs sm:text-sm text-[#111827] dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-[#FEF2F2] dark:bg-rose-950/40 border border-[#FECACA] dark:border-rose-800 text-[#991B1B] dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-[#0F172A] dark:bg-blue-600 hover:bg-[#1E293B] dark:hover:bg-blue-500 text-white transition-colors duration-150 flex items-center justify-center gap-2 shadow-xs disabled:cursor-not-allowed disabled:bg-[#1E293B] disabled:text-white/80 cursor-pointer isolate relative overflow-hidden select-none"
            >
              {loading ? (
                <span key="btn-loading-state" className="flex items-center justify-center gap-2 truncate max-w-full">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                  <span key={loadingStep || "analyzing-step"} className="truncate">
                    {loadingStep || "Analyzing Manuscript..."}
                    {loadingPercent !== undefined ? ` (${loadingPercent}%)` : ""}
                  </span>
                </span>
              ) : (
                <span key="btn-idle-state" className="flex items-center justify-center gap-2 truncate max-w-full">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">
                    {file ? "Run Pre-Submission Diagnostic Scan" : "Validate Target Journal Scope & Fit"}
                  </span>
                </span>
              )}
              {loading && loadingPercent !== undefined && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-blue-500 dark:bg-blue-400 transition-all duration-300"
                  style={{ width: `${loadingPercent}%` }}
                />
              )}
            </button>
          </form>
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
            <div className="space-y-8 animate-fade-in">
              {/* Top Navigation Bar in Results */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                <button
                  onClick={() => setReport(null)}
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
                    onClick={handleExportHTML}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-neutral-700 hover:bg-neutral-50 dark:bg-[#161F30] dark:hover:bg-[#1E293B] dark:text-neutral-300 dark:hover:text-white border border-[#E5E7EB] dark:border-[#334155] transition shadow-2xs cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>Interactive HTML</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportWord}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-neutral-700 hover:bg-neutral-50 dark:bg-[#161F30] dark:hover:bg-[#1E293B] dark:text-neutral-300 dark:hover:text-white border border-[#E5E7EB] dark:border-[#334155] transition shadow-2xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Word (.docx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0F172A] hover:bg-[#1E293B] dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF Report</span>
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

              {/* Document Classification (Only for review-eligible manuscripts; omitted for published articles and non-academic files) */}
              {report.isEligibleForReview !== false && report.classification?.isAcademicManuscript && (
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

              {/* Ineligibility Banner OR Score & Editorial Triage Block */}
              {report.isEligibleForReview === false ? (
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Readiness Score Card */}
                  <div className="p-6 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] flex flex-col justify-center items-center text-center shadow-2xs">
                    <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                      Readiness Score
                    </div>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-4xl font-extrabold text-[#111827] dark:text-white">{report.overallScore ?? 75}</span>
                      <span className="text-neutral-400 text-sm font-semibold">/100</span>
                    </div>
                    <div
                      className={`mt-1.5 px-3 py-1 rounded-md text-xs font-semibold border ${
                        (report.overallScore ?? 75) >= 80
                          ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                          : (report.overallScore ?? 75) >= 65
                          ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                          : "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                      }`}
                    >
                      {(report.overallScore ?? 75) >= 80
                        ? "Submission Ready"
                        : (report.overallScore ?? 75) >= 65
                        ? "Revision Prioritized"
                        : "Substantive Hazards"}
                    </div>
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
              )}

              {/* Only show 6 dimensions, prioritized action plan, and 5 personas if review eligible */}
              {report.isEligibleForReview !== false && (
                <>
                  {/* The 6 Evaluation Dimensions */}
                  {report.dimensions && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#111827] dark:text-white">
                        <BarChart3 className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                        <span>The 6 Evaluation Dimensions (1–5 Scale)</span>
                      </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.dimensions).map(([key, dim]) => (
                    <div
                      key={key}
                      className="p-5 rounded-2xl bg-white border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] flex flex-col justify-between hover:border-neutral-300 dark:hover:border-[#334155] shadow-2xs transition"
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

                <div className="space-y-3">
                  {report.priorityIssues.map((issue: PriorityIssue) => (
                    <div
                      key={issue.id}
                      className="p-5 rounded-2xl bg-white border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
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
                        </div>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                          {issue.priority === "A" ? "Desk-Reject Vulnerability" : "Major Reviewer Challenge"}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#111827] dark:text-white">{issue.title}</h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{issue.description}</p>

                      <div className="border-l-2 border-neutral-300 dark:border-neutral-600 pl-3 py-1 text-xs italic text-neutral-700 dark:text-neutral-400 bg-neutral-50/50 dark:bg-[#161F30] rounded-r-lg">
                        &ldquo;{issue.reviewerQuote}&rdquo;
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] dark:bg-emerald-950/30 dark:border-emerald-800/50 text-xs text-[#166534] dark:text-emerald-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[#111827] dark:text-white block mb-0.5">Required Pre-Submission Fix:</span>
                          {issue.actionableFix}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5-Persona Peer-Review Simulation */}
            {report.reviewerPersonas && report.reviewerPersonas.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#111827] dark:text-white">
                    <Users className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    <span>5-Persona Peer-Review Simulation</span>
                  </div>
                  <span className="text-xs text-neutral-400">Independent domain evaluations</span>
                </div>

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
                          {p.persona === "methods_reviewer"
                            ? "🔬"
                            : p.persona === "domain_expert"
                            ? "🧬"
                            : p.persona === "journal_editor"
                            ? "📑"
                            : "📊"}
                        </span>
                        <span>{p.name.split(" ")[0]} {p.name.split(" ")[1]}</span>
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
                  return (
                    <div className="p-6 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] space-y-5 animate-fade-in shadow-2xs">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-4 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-bold text-[#111827] dark:text-white">{active.name}</h4>
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
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{active.title}</div>
                          {active.affiliation && (
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{active.affiliation}</span>
                            </div>
                          )}
                        </div>

                        {active.expertise && (
                          <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] dark:bg-[#161F30] dark:border-[#334155] text-xs text-neutral-600 dark:text-neutral-400 md:max-w-xs shadow-2xs">
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-0.5">Focus:</span>
                            {active.expertise}
                          </div>
                        )}
                      </div>

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
              <div className="p-3.5 bg-[#F9FAFB] dark:bg-[#161F30] border-b border-[#E5E7EB] dark:border-[#1F2937] text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                Bibliography Samples
              </div>
              <div className="divide-y divide-[#E5E7EB] dark:divide-[#1F2937]">
                {report.citationIntegrity.references.slice(0, 5).map((ref, idx) => (
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
          </div>
        ))}
      </div>
    </div>
  );
}
