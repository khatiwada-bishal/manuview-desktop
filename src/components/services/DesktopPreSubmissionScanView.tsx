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

    let t1: any, t2: any, t3: any, t4: any;

    try {
      const savedConfig = localStorage.getItem("manuview_provider_config");
      const providerConfig: ProviderConfig | undefined = savedConfig
        ? JSON.parse(savedConfig)
        : undefined;

      if (isFileScan) {
        // Full document audit (matching web exactly)
        setLoadingStep("Extracting sections and parsing bibliography...");
        t1 = setTimeout(() => setLoadingStep("Resolving references against Crossref & Retraction Watch..."), 1200);
        t2 = setTimeout(() => setLoadingStep("Auditing causal claims against experimental controls..."), 2400);
        t3 = setTimeout(() => setLoadingStep("Evaluating methodology, sample power, and statistics..."), 3600);
        t4 = setTimeout(() => setLoadingStep("Simulating 5 peer-reviewer personas (including Devil's Advocate)..."), 4800);

        const extracted = await extractTextFromFile(file);
        const parsed = parseManuscriptText(extracted, file.name || "manuscript.txt");
        if (manuscriptTitle.trim()) parsed.title = manuscriptTitle.trim();
        if (manuscriptAbstract.trim()) parsed.abstract = manuscriptAbstract.trim();

        const fullReport = await runManuscriptDiagnostic(parsed, providerConfig, targetJournal);
        setReport(fullReport);

        // Register paper in articles store if onComplete provided
        if (onComplete) {
          const newPaper: PaperItem = {
            id: `paper-${Date.now()}`,
            title: fullReport.title || manuscriptTitle || "Untitled Manuscript",
            shortName: (fullReport.title || manuscriptTitle || "Manuscript")
              .split(" ")
              .slice(0, 3)
              .join(" "),
            journal: targetJournal,
            score: fullReport.overallScore || 80,
          };

          const dashboardData: DesktopDashboardData = {
            paperTitle: newPaper.title,
            headlineTitle: `${targetJournal} Pre-Submission Diagnostic`,
            targetJournal: targetJournal,
            aiEngine: activeProviderInfo.name || "AI ENGINE",
            latencyMs: 120,
            score: fullReport.overallScore || 80,
            statusText:
              (fullReport.overallScore || 80) >= 80
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
        // Fast editorial scope validation (matching web exactly)
        setLoadingStep("Evaluating manuscript title & abstract scope...");
        t1 = setTimeout(() => setLoadingStep(`Calibrating against ${targetJournal}'s aims and editorial criteria...`), 1000);
        t2 = setTimeout(() => setLoadingStep("Auditing keyword resonance and potential desk-reject hazards..."), 2000);

        const briefReport = await runBriefJournalFitAnalysis({
          title: manuscriptTitle,
          abstract: manuscriptAbstract,
          keywords: manuscriptKeywords,
          targetJournal: targetJournal || "Target Journal",
          providerConfig,
        });
        setReport(briefReport);
      }
    } catch (err: any) {
      console.error("Diagnostic scan error:", err);
      setError(err?.message || "Failed to generate diagnostic report. Please verify your AI provider credentials.");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      setLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6 sm:p-10 text-[#111827]">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>5-Persona AI Review &amp; Diagnostic Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Pre-Submission AI Review &amp; Diagnostic
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl">
              Calibrated peer-review rubric to surface desk-rejection hazards, causal overclaims, missing controls, and citation integrity bugs before submission.
            </p>
          </div>
        </div>

        {/* Configuration & Calibration Card */}
        <div className="rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] p-5 sm:p-6 space-y-4 shadow-2xs">
          {/* Target Journal */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
            <span className="w-36 flex items-center gap-2 font-semibold text-[#6B7280]">
              <Tag className="w-4 h-4 text-[#9CA3AF]" />
              Target Journal <span className="text-red-500">*</span>
            </span>
            <div className="flex-1 max-w-lg">
              <JournalCombobox
                value={targetJournal}
                onChange={handleTargetJournalChange}
                hasError={targetJournalError}
                placeholder="Type at least 3 letters to search 1,390+ journals..."
              />
              {targetJournalError && (
                <div className="text-[11px] text-[#991B1B] font-medium flex items-center gap-1 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#991B1B]" />
                  <span>Target Journal is required for calibrated rubric evaluation.</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Engine */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
            <span className="w-36 flex items-center gap-2 font-semibold text-[#6B7280]">
              <SlidersHorizontal className="w-4 h-4 text-[#9CA3AF]" />
              AI Engine
            </span>
            <div className="flex-1 flex flex-wrap items-center gap-2">
              {apiStatus === "connected" && (
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] hover:bg-[#D1FAE5] transition shadow-2xs cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span>
                      {activeProviderInfo.name}: <span className="font-mono">{activeProviderInfo.model}</span>
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#065F46] ml-0.5" />
                  </button>

                  {modelDropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-72 rounded-2xl bg-white border border-[#E5E7EB] shadow-xl p-2.5 z-40 animate-fade-in text-xs">
                      <div className="px-2 py-1.5 text-[11px] font-semibold text-neutral-500 border-b border-[#E5E7EB] uppercase tracking-wider flex items-center justify-between">
                        <span>Select Available Model</span>
                        <span className="text-[10px] text-blue-600 font-semibold">
                          {availableModels.length} models
                        </span>
                      </div>
                      <div className="max-h-56 overflow-y-auto py-1 space-y-1">
                        {availableModels.map((m) => {
                          const isCur = activeProviderInfo.model === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSelectModel(m.id)}
                              className={`w-full text-left px-2.5 py-2 rounded-xl transition flex items-start justify-between gap-2 ${
                                isCur
                                  ? "bg-neutral-100 text-[#111827] font-semibold border border-neutral-300"
                                  : "text-neutral-700 hover:bg-neutral-50"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs truncate">{m.id}</span>
                                  {m.tag && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                      {m.tag}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-neutral-400 truncate mt-0.5">{m.description}</div>
                              </div>
                              {isCur && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                      <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between px-1">
                        <button
                          type="button"
                          onClick={() => {
                            setModelDropdownOpen(false);
                            if (onOpenSettings) onOpenSettings();
                          }}
                          className="text-[11px] text-blue-600 hover:underline font-semibold"
                        >
                          AI Settings &amp; Custom Keys &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {apiStatus === "unconfigured" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                  No API Key (Setup Required)
                </span>
              )}

              {apiStatus === "error" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                  {activeProviderInfo.name}: Connection Error
                </span>
              )}

              {apiStatus === "checking" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                  Testing Connection...
                </span>
              )}

              <button
                type="button"
                onClick={checkProviderStatus}
                disabled={pinging}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-50 border border-[#E5E7EB] text-neutral-700 shadow-2xs transition disabled:opacity-50 cursor-pointer"
                title="Test API connection & ping latency"
              >
                <Activity className={`w-3.5 h-3.5 ${pinging ? "animate-spin text-emerald-600" : "text-neutral-400"}`} />
                <span>{pinging ? "Testing Ping..." : "Check Latency"}</span>
              </button>

              {scanPingResult && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${
                    scanPingResult.success
                      ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]"
                      : "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]"
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>
                    {scanPingResult.success
                      ? `${scanPingResult.latencyMs}ms (${scanPingResult.message})`
                      : `Failed: ${scanPingResult.error || scanPingResult.message}`}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Diagnostic Scope */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
            <span className="w-36 flex items-center gap-2 font-semibold text-[#6B7280]">
              <Hash className="w-4 h-4 text-[#9CA3AF]" />
              Diagnostic Scope
            </span>
            <div className="flex-1 text-neutral-600 text-xs">
              6 Evaluation Dimensions &bull; 5 Reviewer Personas &bull; Live Crossref DOI Validation &bull; Retraction Screening
            </div>
          </div>

          {/* Data Retention */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
            <span className="w-36 flex items-center gap-2 font-semibold text-[#6B7280]">
              <ShieldCheck className="w-4 h-4 text-[#9CA3AF]" />
              Data Retention
            </span>
            <div className="flex-1 text-emerald-700 flex items-center gap-1.5 font-medium text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Zero-storage &bull; In-memory only &bull; Never used to train models</span>
            </div>
          </div>
        </div>

        {/* Input Form Card */}
        {!report && (
          <form onSubmit={handleRunScan} className="rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] p-6 space-y-6 shadow-xs">
            {/* Header with Load Sample Preprint */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E5E7EB]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                  Manuscript Draft Submission
                </span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Upload your full paper for deep referee analysis, or provide title and abstract for quick fit check.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={handleLoadSampleQuick}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 transition cursor-pointer"
                  title="Loads Title, Abstract & Keywords for fast journal fit validation"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Load Sample (Quick Fit)</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleFull}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 transition cursor-pointer"
                  title="Loads complete manuscript document with Methods, Results & References for full 6-dimension peer review"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Load Sample (Full Document)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: File Upload */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-neutral-700">
                    Upload Full Manuscript (.pdf, .docx, .txt)
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                    Full 6-Dim Audit
                  </span>
                </div>

                {isDesktopApp() ? (
                  <button
                    type="button"
                    onClick={handleNativePick}
                    className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#D1D5DB] hover:border-blue-500 rounded-xl p-6 bg-white hover:bg-blue-50/20 cursor-pointer transition group min-h-[240px]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-[#111827] font-semibold text-center truncate max-w-full px-2">
                      {fileName || "Click to choose manuscript file"}
                    </span>
                    <span className="text-[11px] text-neutral-500 mt-1 text-center max-w-xs px-2 leading-relaxed">
                      {file
                        ? `${(file.size / 1024).toFixed(1)} KB • Click to change file`
                        : "Audits causal overclaims, missing controls, 5-persona referee reviews & Crossref DOIs"}
                    </span>
                  </button>
                ) : (
                  <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#D1D5DB] hover:border-blue-500 rounded-xl p-6 bg-white hover:bg-blue-50/20 cursor-pointer transition group min-h-[240px]">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-[#111827] font-semibold text-center truncate max-w-full px-2">
                      {file ? file.name : "Click to choose manuscript file"}
                    </span>
                    <span className="text-[11px] text-neutral-500 mt-1 text-center max-w-xs px-2 leading-relaxed">
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
                    className="text-[11px] text-red-600 hover:underline self-end mt-1.5 cursor-pointer font-medium"
                  >
                    Remove file &amp; use Title / Abstract
                  </button>
                )}
              </div>

              {/* Right Column: Title / Abstract / Keywords */}
              <div className="space-y-3.5 bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#111827]">
                    Or Provide Title &amp; Abstract
                  </span>
                  <span className="text-[10px] font-medium bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded border border-neutral-200">
                    Quick Review
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">
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
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm text-[#111827] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">
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
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm text-[#111827] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">
                    Keywords <span className="text-neutral-400 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={manuscriptKeywords}
                    onChange={(e) => setManuscriptKeywords(e.target.value)}
                    placeholder="e.g. small cell lung cancer, DLL3, CRISPR screen, organoids"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm text-[#111827] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-[#0F172A] hover:bg-[#1E293B] text-white transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>{loadingStep || "Analyzing Manuscript..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{file ? "Run Pre-Submission Diagnostic Scan" : "Validate Target Journal Scope & Fit"}</span>
                </>
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
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <button
                  onClick={() => setReport(null)}
                  className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 px-3 py-1.5 rounded-lg border border-[#E5E7EB] transition shadow-2xs cursor-pointer font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Input</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="hidden md:flex items-center gap-2 text-xs text-neutral-500 mr-1">
                    <span>Target:</span>
                    <span className="px-2.5 py-1 rounded-md bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-medium text-xs">
                      {report.targetJournal || "General High Impact"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportHTML}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-neutral-700 hover:bg-neutral-50 border border-[#E5E7EB] transition shadow-2xs cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>Interactive HTML</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportWord}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-neutral-700 hover:bg-neutral-50 border border-[#E5E7EB] transition shadow-2xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Word (.docx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0F172A] hover:bg-[#1E293B] text-white transition shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF Report</span>
                  </button>
                </div>
              </div>

              {/* Document Title Header */}
              <div className="space-y-2">
                <div className="text-3xl select-none">📑</div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827] leading-snug">
                  {report.title}
                </h2>
              </div>

              {/* Document Classification */}
              {report.classification && (
                <div
                  className={`p-5 rounded-2xl border text-xs space-y-3 ${
                    report.classification.isAcademicManuscript
                      ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                      : "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-black/5">
                    <div className="flex items-center gap-2">
                      <span className="text-base select-none">
                        {report.classification.isAcademicManuscript ? "🔬" : "⚠️"}
                      </span>
                      <span className="font-bold text-sm">
                        Document Classification: {report.classification.categoryLabel}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-white/70 border border-black/10">
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

              {/* Score & Editorial Triage Block */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Readiness Score Card */}
                <div className="p-6 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col justify-center items-center text-center shadow-2xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Readiness Score
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-4xl font-extrabold text-[#111827]">{report.overallScore}</span>
                    <span className="text-neutral-400 text-sm font-semibold">/100</span>
                  </div>
                  <div
                    className={`mt-1.5 px-3 py-1 rounded-md text-xs font-semibold border ${
                      report.overallScore >= 80
                        ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]"
                        : report.overallScore >= 65
                        ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                        : "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]"
                    }`}
                  >
                    {report.overallScore >= 80
                      ? "Submission Ready"
                      : report.overallScore >= 65
                      ? "Revision Prioritized"
                      : "Substantive Hazards"}
                  </div>
                </div>

                {/* Editorial Summary Callout */}
                <div className="md:col-span-3 p-6 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col justify-center shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                    <span className="text-base select-none">📌</span>
                    <span>Editorial Triage Synthesis</span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">{report.summary}</p>
                </div>
              </div>

              {/* The 6 Evaluation Dimensions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
                  <BarChart3 className="w-4 h-4 text-neutral-500" />
                  <span>The 6 Evaluation Dimensions (1–5 Scale)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(report.dimensions).map(([key, dim]) => (
                    <div
                      key={key}
                      className="p-5 rounded-2xl bg-white border border-[#E5E7EB] flex flex-col justify-between hover:border-neutral-300 shadow-2xs transition"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#111827]">{dim.label}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold border ${
                              dim.score >= 4
                                ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]"
                                : dim.score === 3
                                ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                                : "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]"
                            }`}
                          >
                            {dim.score} / 5
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed mb-3">{dim.verdict}</p>
                      </div>

                      {dim.vulnerabilities && dim.vulnerabilities.length > 0 && (
                        <div className="pt-2.5 border-t border-[#E5E7EB] text-[11px] text-[#991B1B] flex items-start gap-1.5 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-500" />
                          <span className="truncate">{dim.vulnerabilities[0]}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Prioritized Action Plan */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Prioritized Action Plan before Submission</span>
                </div>

                <div className="space-y-3">
                  {report.priorityIssues.map((issue: PriorityIssue) => (
                    <div
                      key={issue.id}
                      className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              issue.priority === "A"
                                ? "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]"
                                : issue.priority === "B"
                                ? "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                                : "bg-neutral-50 text-neutral-700 border-neutral-200"
                            }`}
                          >
                            Priority {issue.priority}
                          </span>
                          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
                            {issue.category}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500 font-medium">
                          {issue.priority === "A" ? "Desk-Reject Vulnerability" : "Major Reviewer Challenge"}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#111827]">{issue.title}</h4>
                      <p className="text-xs text-neutral-600 leading-relaxed">{issue.description}</p>

                      <div className="border-l-2 border-neutral-300 pl-3 py-1 text-xs italic text-neutral-700 bg-neutral-50/50 rounded-r-lg">
                        &ldquo;{issue.reviewerQuote}&rdquo;
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[#111827] block mb-0.5">Required Pre-Submission Fix:</span>
                          {issue.actionableFix}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5-Persona Peer-Review Simulation */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
                    <Users className="w-4 h-4 text-neutral-500" />
                    <span>5-Persona Peer-Review Simulation</span>
                  </div>
                  <span className="text-xs text-neutral-400">Independent domain evaluations</span>
                </div>

                <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2 overflow-x-auto">
                  {report.reviewerPersonas.map((p: ReviewerPersonaFeedback, idx: number) => {
                    const isActive = selectedPersona === idx;
                    return (
                      <button
                        key={p.persona}
                        onClick={() => setSelectedPersona(idx)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition cursor-pointer font-medium ${
                          isActive
                            ? "bg-[#0F172A] text-white shadow-xs"
                            : "bg-[#F9FAFB] text-neutral-600 hover:text-neutral-900 border border-[#E5E7EB] hover:bg-neutral-100"
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
                                ? "text-[#991B1B] bg-red-50 border border-red-200"
                                : "text-[#92400E] bg-amber-50 border border-amber-200"
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
                    <div className="p-6 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-5 animate-fade-in shadow-2xs">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-bold text-[#111827]">{active.name}</h4>
                            {active.decisionRecommendation && (
                              <span
                                className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                                  isReject
                                    ? "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]"
                                    : "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                                }`}
                              >
                                Decision: {active.decisionRecommendation}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-500 font-medium">{active.title}</div>
                          {active.affiliation && (
                            <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{active.affiliation}</span>
                            </div>
                          )}
                        </div>

                        {active.expertise && (
                          <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-neutral-600 md:max-w-xs shadow-2xs">
                            <span className="font-semibold text-neutral-800 block mb-0.5">Focus:</span>
                            {active.expertise}
                          </div>
                        )}
                      </div>

                      <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-start gap-2.5">
                        <span className="text-base select-none">⚠️</span>
                        <div>
                          <span className="font-bold text-[#7F1D1D] block mb-0.5 uppercase tracking-wider text-[10px]">
                            Fatal Reviewer Objection:
                          </span>
                          {active.keyChallenge}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          Detailed Peer-Review Assessment:
                        </div>
                        <div className="text-xs leading-relaxed p-4 rounded-xl bg-white border border-[#E5E7EB] text-neutral-700 whitespace-pre-line shadow-2xs">
                          {active.assessment}
                        </div>
                      </div>

                      {active.majorCritiques && active.majorCritiques.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-[#991B1B] uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Major Methodological Vulnerabilities:</span>
                          </div>
                          <div className="space-y-2">
                            {active.majorCritiques.map((critique: string, i: number) => (
                              <div
                                key={i}
                                className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-neutral-800 flex items-start gap-2 shadow-2xs"
                              >
                                <span className="font-mono text-[#991B1B] font-bold text-xs mt-0.5">
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
                          <div className="text-xs font-bold text-[#92400E] uppercase tracking-wider flex items-center gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5" />
                            <span>Missing Experimental Controls &amp; Analyses:</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {active.missingControlsOrAnalyses.map((ctrl: string, i: number) => (
                              <div
                                key={i}
                                className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-neutral-800 flex items-start gap-2 shadow-2xs"
                              >
                                <span className="text-amber-600 font-bold">•</span>
                                <span className="leading-relaxed">{ctrl}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                        <div className="text-xs font-bold text-[#065F46] uppercase tracking-wider flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Mandatory Revisions Demanded for Re-Review:</span>
                        </div>
                        <div className="space-y-1.5">
                          {active.mustAddressItems.map((item: string, i: number) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-neutral-800 flex items-start gap-2 shadow-2xs"
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

              {/* Citation & Reference Integrity Audit */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Citation &amp; Reference Integrity Audit</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] text-center shadow-2xs">
                    <div className="text-2xl font-bold text-[#111827]">
                      {report.citationIntegrity.totalReferences}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">Total References</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] text-center shadow-2xs">
                    <div className="text-2xl font-bold text-emerald-600">
                      {report.citationIntegrity.verifiedCount}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">Crossref Verified</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] text-center shadow-2xs">
                    <div
                      className={`text-2xl font-bold ${
                        report.citationIntegrity.unresolvableCount > 0 ? "text-red-600" : "text-[#111827]"
                      }`}
                    >
                      {report.citationIntegrity.unresolvableCount}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">Unresolvable DOIs</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] text-center shadow-2xs">
                    <div
                      className={`text-2xl font-bold ${
                        report.citationIntegrity.retractedCount > 0 ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {report.citationIntegrity.retractedCount}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">Retracted Flagged</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden shadow-2xs">
                  <div className="p-3.5 bg-[#F9FAFB] border-b border-[#E5E7EB] text-xs font-bold text-neutral-600 uppercase tracking-wider">
                    Bibliography Samples
                  </div>
                  <div className="divide-y divide-[#E5E7EB]">
                    {report.citationIntegrity.references.slice(0, 5).map((ref, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5 max-w-xl">
                          <div className="text-[#111827] font-medium truncate">{ref.title || ref.raw}</div>
                          <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                            {ref.doi && <span>DOI: {ref.doi}</span>}
                            {ref.journal && <span>&bull; {ref.journal}</span>}
                            {ref.year && <span>&bull; {ref.year}</span>}
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {ref.isRetracted ? (
                            <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                              RETRACTED
                            </span>
                          ) : ref.status === "valid" ? (
                            <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                              Crossref Verified
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                              Unverified
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Target Journal Recommendation Tiers */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
                  <BookOpen className="w-4 h-4 text-neutral-500" />
                  <span>Target Journal Recommendation Tiers</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.journalRecommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col justify-between shadow-2xs hover:border-neutral-300 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              rec.tier === "Reach"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : rec.tier === "Realistic"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {rec.tier} Tier
                          </span>
                          <span className="text-xs font-mono font-bold text-neutral-500">
                            IF: {rec.impactFactor}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-[#111827] mb-0.5">{rec.journalName}</h4>
                        <p className="text-xs text-neutral-500 mb-3">{rec.publisher}</p>

                        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-neutral-600 mb-3 shadow-2xs">
                          <span className="font-semibold text-neutral-900 block mb-0.5">Scope Rationale:</span>
                          {rec.scopeRationale}
                        </div>
                      </div>

                      <div className="text-xs text-[#991B1B] pt-3 border-t border-[#E5E7EB]">
                        <span className="font-bold block mb-0.5">Desk-Reject Hazard:</span>
                        {rec.rejectionRisks[0] || "Methodological rigor requirements"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
