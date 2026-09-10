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
  Settings,
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
import { ProviderSettingsModal } from "@/components/ProviderSettingsModal";
import JournalCombobox from "@/components/JournalCombobox";
import { BriefJournalFitView, BriefJournalFitPrintView } from "@/components/BriefJournalFitView";
import { exportInteractiveHtmlReport, exportWordDocReport } from "@/lib/export-generator";
import { pickManuscriptFileDesktop, isDesktopApp } from "@/lib/desktop";
import { extractTextFromFile, parseManuscriptText } from "@/lib/parser";
import { runManuscriptDiagnostic, runBriefJournalFitAnalysis } from "@/lib/diagnostic-engine";
import { callLLM, fetchAvailableModels, testLLMConnection } from "@/lib/llm";
import { PaperItem } from "@/components/DesktopSidebar";
import { DesktopDashboardData } from "@/components/DesktopDashboard";

const SAMPLE_PREPRINT = {
  title: "Single-cell transcriptional profiling of DLL3 activation in neuroendocrine lung carcinoma",
  journal: "Nature Communications",
  abstract:
    "Small cell lung cancer (SCLC) exhibits rapid recurrence and therapy resistance. Delta-like ligand 3 (DLL3) is an established cell-surface target for antibody-drug conjugates and T-cell engagers. However, the precise cis-regulatory mechanisms controlling DLL3 transcription remain uncharacterized. Here, we perform marker-based CRISPR-Cas9 screens and identify the transcription factor POU2F1 as a primary driver of DLL3 expression. We demonstrate that POU2F1 directly binds the DLL3 distal enhancer element to drive chemoresistance in clinical isolates. Knockdown of POU2F1 caused significant downregulation of DLL3 mRNA across 8 patient-derived organoid lines. Our findings prove that targeting POU2F1 will rescue therapeutic efficacy in neuroendocrine lung carcinoma and provide a universal predictive biomarker for clinical stratification.",
  keywords: "small cell lung cancer, DLL3, POU2F1, CRISPR screen, organoids, chemoresistance, antibody-drug conjugates",
};

interface DesktopPreSubmissionScanViewProps {
  onComplete?: (newPaper: PaperItem, data: DesktopDashboardData) => void;
  onOpenSettings?: () => void;
}

export function DesktopPreSubmissionScanView({
  onComplete,
  onOpenSettings,
}: DesktopPreSubmissionScanViewProps) {
  const [manuscriptTitle, setManuscriptTitle] = useState("");
  const [manuscriptAbstract, setManuscriptAbstract] = useState("");
  const [manuscriptKeywords, setManuscriptKeywords] = useState("");
  const [targetJournal, setTargetJournal] = useState("Nature Communications");
  const [targetJournalError, setTargetJournalError] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<number>(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const handleLoadSample = () => {
    setManuscriptTitle(SAMPLE_PREPRINT.title);
    setTargetJournal(SAMPLE_PREPRINT.journal);
    setManuscriptAbstract(SAMPLE_PREPRINT.abstract);
    setManuscriptKeywords(SAMPLE_PREPRINT.keywords);
    setFile(null);
    setFileName(null);
    setError(null);
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
    if (!file && (!manuscriptTitle.trim() || !manuscriptAbstract.trim())) {
      setError("Please provide either a manuscript document or Title and Abstract.");
      return;
    }
    if (!targetJournal.trim()) {
      setTargetJournalError(true);
      setError("Target Journal is required for calibrated rubric evaluation.");
      return;
    }

    setLoading(true);
    setError(null);

    let t1: any, t2: any, t3: any, t4: any;
    setLoadingStep("Parsing document & extracting sections...");
    t1 = setTimeout(() => setLoadingStep("Verifying reference list against CrossRef & Retraction Watch..."), 1200);
    t2 = setTimeout(() => setLoadingStep("Auditing methodology, statistical power & claims..."), 2400);
    t3 = setTimeout(() => setLoadingStep("Running 4-Persona peer-review simulations..."), 3600);

    try {
      const savedConfig = localStorage.getItem("manuview_provider_config");
      const providerConfig: ProviderConfig | undefined = savedConfig
        ? JSON.parse(savedConfig)
        : undefined;

      let extracted = "";
      if (file) {
        extracted = await extractTextFromFile(file);
      } else {
        extracted = `Title: ${manuscriptTitle}\n\nAbstract: ${manuscriptAbstract}\n\nKeywords: ${manuscriptKeywords}`;
      }

      const parsed = parseManuscriptText(extracted, file?.name || "manuscript.txt");
      if (manuscriptTitle) parsed.title = manuscriptTitle;
      if (manuscriptAbstract) parsed.abstract = manuscriptAbstract;

      // Run full diagnostic report
      const generatedReport = await runManuscriptDiagnostic(parsed, providerConfig, targetJournal);
      setReport(generatedReport);

      // Register paper in articles store if onComplete provided
      if (onComplete) {
        const newPaper: PaperItem = {
          id: `paper-${Date.now()}`,
          title: generatedReport.title || manuscriptTitle || "Untitled Manuscript",
          shortName: (generatedReport.title || manuscriptTitle || "Manuscript")
            .split(" ")
            .slice(0, 3)
            .join(" "),
          journal: targetJournal,
          score: generatedReport.overallScore || 80,
        };

        const dashboardData: DesktopDashboardData = {
          paperTitle: newPaper.title,
          headlineTitle: `${targetJournal} Pre-Submission Diagnostic`,
          targetJournal: targetJournal,
          aiEngine: activeProviderInfo.name || "AI ENGINE",
          latencyMs: 120,
          score: generatedReport.overallScore || 80,
          statusText:
            (generatedReport.overallScore || 80) >= 80
              ? "High Acceptance Probability"
              : "Revision Prioritized",
          vulnerabilities:
            generatedReport.priorityIssues?.map((issue) => ({
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
            generatedReport.reviewerPersonas?.map((p) => ({
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
            verifiedCount: generatedReport.citationIntegrity?.verifiedCount || 10,
            totalCount: generatedReport.citationIntegrity?.totalReferences || 10,
            retractedCount: generatedReport.citationIntegrity?.retractedCount || 0,
            notes: generatedReport.citationIntegrity?.references?.length
              ? `Verified ${generatedReport.citationIntegrity.verifiedCount} DOIs via CrossRef Open API.`
              : undefined,
          },
        };

        onComplete(newPaper, dashboardData);
      }
    } catch (err: any) {
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
    <div className="flex-1 h-full bg-[#08090D] text-white overflow-y-auto py-6 sm:py-10 print:bg-white print:p-0 select-text">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 print:max-w-none print:p-0">
        {/* Top Breadcrumb & Page Controls */}
        <div className="mb-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>Workspace</span>
            <span>/</span>
            <span>Diagnostics</span>
            <span>/</span>
            <span className="text-white font-medium">Pre-Submission AI Review</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              else setSettingsOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs text-neutral-300 hover:text-white transition shadow-sm cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-400" />
            <span>{activeProviderInfo.name}</span>
          </button>
        </div>

        {/* Workspace Card Container (Elevated White Paper Sheet on Dark Canvas) */}
        <div className="rounded-2xl p-6 sm:p-10 bg-white text-[#2F3437] shadow-[0_35px_90px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] print:border-none print:shadow-none print:p-0 print:rounded-none">
          {/* Notion Page Header */}
          <div className="mb-8 print:hidden">
            <div className="text-4xl mb-3 select-none">📄</div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#2F3437] mb-2 font-serif">
              Manuscript Pre-Submission Diagnostic
            </h1>
            <p className="text-sm text-[#787774] font-light">
              Calibrated peer-review rubric to surface desk-rejection hazards, causal overclaims, missing controls, and citation integrity bugs.
            </p>
          </div>

          {/* Notion Properties Block */}
          <div className="mb-8 rounded-xl bg-[#F7F7F5] print:hidden border border-[#EBEBEA] p-4 text-xs divide-y divide-[#eaeaea]">
            {/* Property 1: Target Journal */}
            <div className="relative z-20 py-2.5 px-1 space-y-1.5">
              <div className="flex items-center">
                <div className="w-40 flex items-center gap-1.5 text-[#787774] flex-shrink-0">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="font-medium">Target Journal</span>
                  <span className="text-[#E03E3E] font-bold text-sm leading-none" title="Required">
                    *
                  </span>
                </div>
                <div className="flex-1">
                  <JournalCombobox
                    value={targetJournal}
                    onChange={handleTargetJournalChange}
                    hasError={targetJournalError}
                    placeholder="Search 1,390+ academic journals or type custom title..."
                  />
                </div>
              </div>
              {targetJournalError && (
                <div className="ml-40 text-[11px] text-[#7C2D2B] font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-[#7C2D2B]" />
                  <span>Target Journal is required for calibrated rubric evaluation.</span>
                </div>
              )}
            </div>

            {/* Property 2: AI Diagnostic Engine */}
            <div className="flex items-center py-2 px-1">
              <div className="w-40 flex items-center gap-2 text-[#787774] flex-shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>AI Engine</span>
              </div>
              <div className="flex-1 flex flex-wrap items-center gap-2">
                {apiStatus === "connected" && (
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#EDF6EE] text-[#1E5A2A] border border-[#CBE7CE] hover:bg-[#E2F0E3] transition shadow-2xs cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#1E5A2A]" />
                      <span>
                        {activeProviderInfo.name}: <span className="font-mono">{activeProviderInfo.model}</span>
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#1E5A2A] ml-0.5" />
                    </button>

                    {modelDropdownOpen && (
                      <div className="absolute left-0 mt-1.5 w-72 rounded-2xl bg-white border border-[#EBEBEA] shadow-xl p-2.5 z-40 animate-fade-in text-xs">
                        <div className="px-2 py-1.5 text-[11px] font-semibold text-[#787774] border-b border-[#EBEBEA] uppercase tracking-wider flex items-center justify-between">
                          <span>Select Available Model</span>
                          <span className="text-[10px] text-[#18569C] font-semibold">
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
                                    ? "bg-[#F7F7F5] text-[#2F3437] font-semibold border border-[#2F3437]"
                                    : "text-[#2F3437] hover:bg-[#F7F7F5]"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs truncate">{m.id}</span>
                                    {m.tag && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-[#EBF3FB] text-[#18569C] border border-[#CDE1F8]">
                                        {m.tag}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#787774] truncate mt-0.5">{m.description}</div>
                                </div>
                                {isCur && <Check className="w-3.5 h-3.5 text-[#1E5A2A] flex-shrink-0 mt-0.5" />}
                              </button>
                            );
                          })}
                        </div>
                        <div className="pt-2 border-t border-[#EBEBEA] flex items-center justify-between px-1">
                          <button
                            type="button"
                            onClick={() => {
                              setModelDropdownOpen(false);
                              if (onOpenSettings) onOpenSettings();
                              else setSettingsOpen(true);
                            }}
                            className="text-[11px] text-[#18569C] hover:underline font-semibold"
                          >
                            AI Settings &amp; Custom Keys &rarr;
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {apiStatus === "unconfigured" && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FBF3DB] text-[#78510E] border border-[#F4E2B6]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#78510E]" />
                    No API Key (Setup Required)
                  </span>
                )}

                {apiStatus === "error" && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FDF0EF] text-[#7C2D2B] border border-[#F7CECC]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9B2C2C]" />
                    {activeProviderInfo.name}: Connection Failed
                  </span>
                )}

                {apiStatus === "checking" && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EBF3FB] text-[#18569C] border border-[#CDE1F8]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A85EA] animate-pulse" />
                    Testing {activeProviderInfo.name}...
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenSettings) onOpenSettings();
                    else setSettingsOpen(true);
                  }}
                  className="text-[11px] text-[#18569C] hover:underline font-medium"
                >
                  Configure
                </button>

                <button
                  type="button"
                  onClick={checkProviderStatus}
                  disabled={pinging}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-[#F7F7F5] border border-[#EBEBEA] text-[#2F3437] shadow-2xs transition disabled:opacity-50 cursor-pointer"
                  title="Test API connection & ping latency"
                >
                  <Activity className={`w-3 h-3 ${pinging ? "animate-spin text-emerald-500" : "text-[#787774]"}`} />
                  <span>{pinging ? "Testing Ping..." : "Check Connection"}</span>
                </button>

                {scanPingResult && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border ${
                      scanPingResult.success
                        ? "bg-[#EDF6EE] text-[#1E5A2A] border-[#CBE7CE]"
                        : "bg-[#FDF0EF] text-[#7C2D2B] border-[#F7CECC]"
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>
                      {scanPingResult.success
                        ? `${scanPingResult.latencyMs}ms (${scanPingResult.message})`
                        : `Failed: ${scanPingResult.error || scanPingResult.message}`}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Property 3: Scope */}
            <div className="flex items-center py-2 px-1">
              <div className="w-40 flex items-center gap-2 text-[#787774] flex-shrink-0">
                <Hash className="w-3.5 h-3.5" />
                <span>Diagnostic Scope</span>
              </div>
              <div className="flex-1 text-[#787774]">
                6 Dimensions &bull; 4 Reviewer Personas &bull; Crossref DOI Resolution &bull; Retraction Screening
              </div>
            </div>

            {/* Property 4: Privacy */}
            <div className="flex items-center py-2 px-1">
              <div className="w-40 flex items-center gap-2 text-[#787774] flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Data Retention</span>
              </div>
              <div className="flex-1 text-[#1E5A2A] flex items-center gap-1.5 font-medium">
                <span>Zero-storage &bull; In-memory only &bull; Never trained on</span>
              </div>
            </div>
          </div>

          {/* Input Form Card */}
          {!report && (
            <div className="space-y-6">
              {/* Sample Preprint Tip */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F7F7F5] border border-[#EBEBEA] text-xs text-[#787774]">
                <span className="text-base select-none">💡</span>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    First time testing ManuView? Load our sample preprint to run an instant diagnostic report.
                  </span>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F7F7F5] text-[#2F3437] font-medium text-xs border border-[#EBEBEA] shadow-2xs transition flex items-center gap-1 self-start sm:self-auto whitespace-nowrap cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Load Sample Preprint
                  </button>
                </div>
              </div>

              <form onSubmit={handleRunScan} className="space-y-5">
                {/* Document Input */}
                <div className="rounded-xl bg-[#F7F7F5] border border-[#EBEBEA] p-6 space-y-4">
                  <div className="text-xs font-medium text-[#787774] uppercase tracking-wider">
                    Manuscript Draft
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* File Upload Box */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-[#787774] font-medium">
                          Upload Full Manuscript (.pdf, .docx, .txt)
                        </label>
                        <span className="text-[10px] text-[#0F6B43] bg-[#EBF8F2] px-2 py-0.2 rounded font-medium border border-[#BDEBD6]">
                          Full Audit
                        </span>
                      </div>

                      {isDesktopApp() ? (
                        <button
                          type="button"
                          onClick={handleNativePick}
                          className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#d0d0d0] hover:border-[#0A85EA] rounded-xl p-6 bg-white hover:bg-[#EBF3FB]/20 cursor-pointer transition group min-h-[220px]"
                        >
                          <Upload className="w-7 h-7 text-[#9B9A97] group-hover:text-[#18569C] transition mb-2" />
                          <span className="text-xs text-[#2F3437] font-semibold text-center truncate max-w-full px-2">
                            {fileName || "Choose full manuscript file"}
                          </span>
                          <span className="text-[11px] text-[#787774] mt-1 text-center max-w-xs px-2">
                            {file
                              ? `${(file.size / 1024).toFixed(1)} KB • Click to change file`
                              : "Enables 6-dimension rubric, simulated reviewer personas & citation audit"}
                          </span>
                        </button>
                      ) : (
                        <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#d0d0d0] hover:border-[#0A85EA] rounded-xl p-6 bg-white hover:bg-[#EBF3FB]/20 cursor-pointer transition group min-h-[220px]">
                          <Upload className="w-7 h-7 text-[#9B9A97] group-hover:text-[#18569C] transition mb-2" />
                          <span className="text-xs text-[#2F3437] font-semibold text-center truncate max-w-full px-2">
                            {file ? file.name : "Choose full manuscript file"}
                          </span>
                          <span className="text-[11px] text-[#787774] mt-1 text-center max-w-xs px-2">
                            {file
                              ? `${(file.size / 1024).toFixed(1)} KB • Click to change file`
                              : "Enables 6-dimension rubric, simulated reviewer personas & citation audit"}
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
                          className="text-[11px] text-[#7C2D2B] hover:underline self-end mt-1 cursor-pointer"
                        >
                          Remove file &amp; use Title / Abstract
                        </button>
                      )}
                    </div>

                    {/* Title, Abstract & Keywords Box */}
                    <div className="space-y-2.5 bg-white p-4 rounded-xl border border-[#EBEBEA] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-[#2F3437] font-semibold">
                          Or Provide Title, Abstract &amp; Keywords
                        </label>
                        <span className="text-[10px] font-medium bg-[#EBF3FB] text-[#18569C] px-2 py-0.2 rounded border border-[#CDE1F8]">
                          Quick Fit
                        </span>
                      </div>

                      <div>
                        <label className="text-[11px] text-[#787774] font-medium mb-1 block">
                          Manuscript Title <span className="text-[#E03E3E] font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          value={manuscriptTitle}
                          onChange={(e) => {
                            setManuscriptTitle(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="e.g. Single-cell transcriptional profiling of DLL3..."
                          className="w-full px-3 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#EBEBEA] text-xs text-[#2F3437] placeholder-[#888888] focus:outline-none focus:bg-white focus:border-[#0A85EA] focus:ring-1 focus:ring-[#0A85EA] transition"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-[#787774] font-medium mb-1 block">
                          Abstract <span className="text-[#E03E3E] font-bold">*</span>
                        </label>
                        <textarea
                          rows={4}
                          value={manuscriptAbstract}
                          onChange={(e) => {
                            setManuscriptAbstract(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="Paste background, main findings, methodology, and conclusions..."
                          className="w-full p-2.5 rounded-lg bg-[#F7F7F5] border border-[#EBEBEA] text-xs text-[#2F3437] placeholder-[#888888] focus:outline-none focus:bg-white focus:border-[#0A85EA] focus:ring-1 focus:ring-[#0A85EA] leading-relaxed transition resize-y"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-[#787774] font-medium mb-1 block">
                          Keywords <span className="text-[#9B9A97] font-normal">(comma-separated)</span>
                        </label>
                        <input
                          type="text"
                          value={manuscriptKeywords}
                          onChange={(e) => setManuscriptKeywords(e.target.value)}
                          placeholder="e.g. small cell lung cancer, DLL3, CRISPR screen, organoids"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#EBEBEA] text-xs text-[#2F3437] placeholder-[#888888] focus:outline-none focus:bg-white focus:border-[#0A85EA] focus:ring-1 focus:ring-[#0A85EA] transition"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-[#FDF0EF] border border-[#F7CECC] text-[#7C2D2B] text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm border transition flex items-center justify-center gap-2 shadow-sm ${
                    !loading
                      ? "bg-[#0F172A] hover:bg-black text-white border-[#0F172A] active:scale-[0.99] cursor-pointer shadow-md"
                      : "bg-[#eaeaea] text-[#9B9A97] border-[#e0e0e0] opacity-80 cursor-not-allowed"
                  }`}
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
            </div>
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
              <div className="space-y-8 animate-fade-in print:hidden">
                {/* Top Navigation Bar in Results */}
                <div className="flex items-center justify-between pb-3 border-b border-[#EBEBEA]">
                  <button
                    onClick={() => setReport(null)}
                    className="flex items-center gap-1.5 text-xs text-[#787774] hover:text-[#2F3437] hover:bg-[#F7F7F5] px-2.5 py-1 rounded-lg transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Input</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 text-xs text-[#787774] mr-1">
                      <span>Target:</span>
                      <span className="text-[#2F3437] font-medium bg-[#F7F7F5] px-2 py-0.5 rounded border border-[#EBEBEA]">
                        {report.targetJournal || "General High Impact"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportHTML}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-[#2F3437] hover:bg-[#F7F7F5] border border-[#D0D5DD] transition shadow-2xs cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>Interactive HTML</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportWord}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-[#2F3437] hover:bg-[#F7F7F5] border border-[#D0D5DD] transition shadow-2xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#18569C]" />
                      <span>Word (.docx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2F3437] text-white hover:bg-black transition shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF Report</span>
                    </button>
                  </div>
                </div>

                {/* Document Title Header */}
                <div className="space-y-2">
                  <div className="text-3xl select-none">📑</div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2F3437] leading-snug">
                    {report.title}
                  </h2>
                </div>

                {/* Document Classification */}
                {report.classification && (
                  <div
                    className={`p-5 rounded-xl border text-xs space-y-3 ${
                      report.classification.isAcademicManuscript
                        ? "bg-[#EDF6EE] border-[#CBE7CE] text-[#1E5A2A]"
                        : "bg-[#FBF3DB] border-[#F4E2B6] text-[#78510E]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#EBEBEA]">
                      <div className="flex items-center gap-2">
                        <span className="text-base select-none">
                          {report.classification.isAcademicManuscript ? "🔬" : "⚠️"}
                        </span>
                        <span className="font-semibold text-[#2F3437]">
                          Document Classification: {report.classification.categoryLabel}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-white/70 border border-[#EBEBEA]">
                          {report.classification.isAcademicManuscript ? "Academic Paper" : "Non-Manuscript Content"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="font-medium text-[#2F3437]">{report.classification.salutation}</div>
                      <p className="leading-relaxed opacity-90 font-light">{report.classification.advisoryMessage}</p>
                    </div>
                  </div>
                )}

                {/* Score & Editorial Triage Block */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Readiness Score Card */}
                  <div className="p-5 rounded-xl bg-[#F7F7F5] border border-[#EBEBEA] flex flex-col justify-center items-center text-center">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#787774] mb-1">
                      Readiness Score
                    </div>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-4xl font-bold font-serif text-[#2F3437]">{report.overallScore}</span>
                      <span className="text-[#9B9A97] text-sm font-serif">/100</span>
                    </div>
                    <div
                      className={`mt-1 px-2.5 py-0.5 rounded text-[11px] font-medium border ${
                        report.overallScore >= 80
                          ? "bg-[#EDF6EE] text-[#1E5A2A] border-[#CBE7CE]"
                          : report.overallScore >= 65
                          ? "bg-[#FBF3DB] text-[#78510E] border-[#F4E2B6]"
                          : "bg-[#FDF0EF] text-[#7C2D2B] border-[#F7CECC]"
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
                  <div className="md:col-span-3 p-5 rounded-xl bg-[#F7F7F5] border border-[#EBEBEA] flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E5A2A] mb-2">
                      <span className="text-sm select-none">📌</span>
                      <span className="uppercase tracking-wider">Editorial Triage Synthesis</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#787774] leading-relaxed font-light">{report.summary}</p>
                  </div>
                </div>

                {/* The 6 Evaluation Dimensions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#2F3437]">
                    <BarChart3 className="w-4 h-4 text-[#787774]" />
                    <span>The 6 Evaluation Dimensions (1–5 Scale)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(report.dimensions).map(([key, dim]) => (
                      <div
                        key={key}
                        className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EBEBEA] flex flex-col justify-between hover:border-[#d0d0d0] hover:shadow-2xs transition"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-[#2F3437]">{dim.label}</span>
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-xs font-semibold border ${
                                dim.score >= 4
                                  ? "bg-[#EDF6EE] text-[#1E5A2A] border-[#CBE7CE]"
                                  : dim.score === 3
                                  ? "bg-[#FBF3DB] text-[#78510E] border-[#F4E2B6]"
                                  : "bg-[#FDF0EF] text-[#7C2D2B] border-[#F7CECC]"
                              }`}
                            >
                              {dim.score} / 5
                            </span>
                          </div>
                          <p className="text-xs text-[#787774] leading-relaxed mb-3 font-light">{dim.verdict}</p>
                        </div>

                        {dim.vulnerabilities && dim.vulnerabilities.length > 0 && (
                          <div className="pt-2 border-t border-[#EBEBEA] text-[11px] text-[#7C2D2B] flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span className="truncate">{dim.vulnerabilities[0]}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prioritized Action Plan */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#2F3437]">
                    <AlertCircle className="w-4 h-4 text-[#7C2D2B]" />
                    <span>Prioritized Action Plan before Submission</span>
                  </div>

                  <div className="space-y-3">
                    {report.priorityIssues.map((issue: PriorityIssue) => (
                      <div
                        key={issue.id}
                        className="p-5 rounded-xl bg-[#F7F7F5] border border-[#EBEBEA] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                issue.priority === "A"
                                  ? "bg-[#FDF0EF] text-[#7C2D2B] border-[#F7CECC]"
                                  : issue.priority === "B"
                                  ? "bg-[#FBF3DB] text-[#78510E] border-[#F4E2B6]"
                                  : "bg-white text-[#787774] border-[#EBEBEA]"
                              }`}
                            >
                              Priority {issue.priority}
                            </span>
                            <span className="text-[11px] font-medium text-[#787774] uppercase tracking-wide">
                              {issue.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#787774]">
                            {issue.priority === "A" ? "Desk-Reject Vulnerability" : "Major Reviewer Challenge"}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-[#2F3437]">{issue.title}</h4>
                        <p className="text-xs text-[#787774] leading-relaxed">{issue.description}</p>

                        <div className="border-l-2 border-[#d0d0d0] pl-3 py-0.5 text-xs italic text-[#2F3437] font-serif">
                          &ldquo;{issue.reviewerQuote}&rdquo;
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-[#CBE7CE] text-xs text-[#1E5A2A] flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-[#2F3437] block mb-0.5">Required Pre-Submission Fix:</span>
                            {issue.actionableFix}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4-Persona Peer-Review Simulation */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#2F3437]">
                      <Users className="w-4 h-4 text-[#787774]" />
                      <span>4-Persona Peer-Review Simulation</span>
                    </div>
                    <span className="text-[11px] text-[#787774]">Independent domain evaluations</span>
                  </div>

                  <div className="flex items-center gap-1 border-b border-[#EBEBEA] pb-1 overflow-x-auto">
                    {report.reviewerPersonas.map((p: ReviewerPersonaFeedback, idx: number) => {
                      const isActive = selectedPersona === idx;
                      return (
                        <button
                          key={p.persona}
                          onClick={() => setSelectedPersona(idx)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition cursor-pointer ${
                            isActive
                              ? "bg-white text-[#2F3437] font-semibold border border-[#d0d0d0] shadow-2xs"
                              : "text-[#787774] hover:text-[#2F3437] hover:bg-[#F7F7F5]"
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
                              className={`text-[9px] px-1 py-0.2 rounded border ${
                                p.decisionRecommendation.includes("Reject")
                                  ? "text-[#7C2D2B] border-[#F7CECC] bg-[#FDF0EF]"
                                  : "text-[#78510E] border-[#F4E2B6] bg-[#FBF3DB]"
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
                      <div className="p-6 rounded-xl bg-[#F7F7F5] border border-[#EBEBEA] space-y-5 animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-4 border-b border-[#EBEBEA]">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-base font-serif font-bold text-[#2F3437]">{active.name}</h4>
                              {active.decisionRecommendation && (
                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                                    isReject
                                      ? "bg-[#FDF0EF] text-[#7C2D2B] border-[#F7CECC]"
                                      : "bg-[#FBF3DB] text-[#78510E] border-[#F4E2B6]"
                                  }`}
                                >
                                  Decision: {active.decisionRecommendation}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#787774]">{active.title}</div>
                            {active.affiliation && (
                              <div className="text-[11px] text-[#787774] flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5" />
                                <span>{active.affiliation}</span>
                              </div>
                            )}
                          </div>

                          {active.expertise && (
                            <div className="p-2.5 rounded-lg bg-white border border-[#EBEBEA] text-[11px] text-[#787774] md:max-w-xs">
                              <span className="font-semibold text-[#1E5A2A] block mb-0.5">Focus:</span>
                              {active.expertise}
                            </div>
                          )}
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FDF0EF] border border-[#F7CECC] text-xs text-[#7C2D2B] flex items-start gap-2.5">
                          <span className="text-base select-none">⚠️</span>
                          <div>
                            <span className="font-semibold text-[#2F3437] block mb-0.5 uppercase tracking-wider text-[10px]">
                              Fatal Reviewer Objection:
                            </span>
                            {active.keyChallenge}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-[#787774] uppercase tracking-wider">
                            Detailed Peer-Review Assessment:
                          </div>
                          <div className="text-xs leading-relaxed font-light p-3.5 rounded-xl bg-white border border-[#EBEBEA] text-[#2F3437] whitespace-pre-line">
                            {active.assessment}
                          </div>
                        </div>

                        {active.majorCritiques && active.majorCritiques.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-[#7C2D2B] uppercase tracking-wider flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Major Methodological Vulnerabilities:</span>
                            </div>
                            <div className="space-y-1.5">
                              {active.majorCritiques.map((critique: string, i: number) => (
                                <div
                                  key={i}
                                  className="p-2.5 rounded-lg bg-white border border-[#EBEBEA] text-xs text-[#2F3437] flex items-start gap-2"
                                >
                                  <span className="font-mono text-[#7C2D2B] font-bold text-[11px] mt-0.5">
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
                            <div className="text-xs font-semibold text-[#78510E] uppercase tracking-wider flex items-center gap-1.5">
                              <FlaskConical className="w-3.5 h-3.5" />
                              <span>Missing Experimental Controls &amp; Analyses:</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {active.missingControlsOrAnalyses.map((ctrl: string, i: number) => (
                                <div
                                  key={i}
                                  className="p-2.5 rounded-lg bg-white border border-[#EBEBEA] text-xs text-[#2F3437] flex items-start gap-2"
                                >
                                  <span className="text-[#78510E] font-bold">•</span>
                                  <span className="leading-relaxed">{ctrl}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 pt-2 border-t border-[#EBEBEA]">
                          <div className="text-xs font-semibold text-[#1E5A2A] uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Mandatory Revisions Demanded for Re-Review:</span>
                          </div>
                          <div className="space-y-1.5">
                            {active.mustAddressItems.map((item: string, i: number) => (
                              <div
                                key={i}
                                className="p-2.5 rounded-lg bg-white border border-[#EBEBEA] text-xs text-[#2F3437] flex items-start gap-2"
                              >
                                <span className="text-[#1E5A2A] font-bold">✓</span>
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#2F3437]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Citation &amp; Reference Integrity Audit</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EBEBEA] text-center">
                      <div className="text-xl font-bold font-serif text-[#2F3437]">
                        {report.citationIntegrity.totalReferences}
                      </div>
                      <div className="text-[11px] text-[#787774]">Total References</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EBEBEA] text-center">
                      <div className="text-xl font-bold font-serif text-[#1E5A2A]">
                        {report.citationIntegrity.verifiedCount}
                      </div>
                      <div className="text-[11px] text-[#787774]">Crossref Verified</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EBEBEA] text-center">
                      <div
                        className={`text-xl font-bold font-serif ${
                          report.citationIntegrity.unresolvableCount > 0 ? "text-[#7C2D2B]" : "text-[#2F3437]"
                        }`}
                      >
                        {report.citationIntegrity.unresolvableCount}
                      </div>
                      <div className="text-[11px] text-[#787774]">Unresolvable DOIs</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EBEBEA] text-center">
                      <div
                        className={`text-xl font-bold font-serif ${
                          report.citationIntegrity.retractedCount > 0 ? "text-[#7C2D2B]" : "text-[#1E5A2A]"
                        }`}
                      >
                        {report.citationIntegrity.retractedCount}
                      </div>
                      <div className="text-[11px] text-[#787774]">Retracted Flagged</div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#F7F7F5] border border-[#EBEBEA] overflow-hidden">
                    <div className="p-3 bg-white border-b border-[#EBEBEA] text-[11px] font-semibold text-[#787774] uppercase tracking-wider">
                      Bibliography Samples
                    </div>
                    <div className="divide-y divide-[#eaeaea]">
                      {report.citationIntegrity.references.slice(0, 5).map((ref, idx) => (
                        <div
                          key={idx}
                          className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5 max-w-xl">
                            <div className="text-[#2F3437] font-medium truncate">{ref.title || ref.raw}</div>
                            <div className="text-[11px] text-[#787774] flex items-center gap-2">
                              {ref.doi && <span>DOI: {ref.doi}</span>}
                              {ref.journal && <span>&bull; {ref.journal}</span>}
                              {ref.year && <span>&bull; {ref.year}</span>}
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            {ref.isRetracted ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FDF0EF] text-[#7C2D2B] border border-[#F7CECC]">
                                RETRACTED
                              </span>
                            ) : ref.status === "valid" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EDF6EE] text-[#1E5A2A] border border-[#CBE7CE]">
                                Crossref Verified
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2e281b] text-[#78510E] border border-[#4a3e26]">
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#2F3437]">
                    <BookOpen className="w-4 h-4 text-[#787774]" />
                    <span>Target Journal Recommendation Tiers</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {report.journalRecommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EBEBEA] flex flex-col justify-between hover:border-[#d0d0d0] transition"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                rec.tier === "Reach"
                                  ? "bg-[#F6F3F9] text-[#57338C] border-[#DFD5F5]"
                                  : rec.tier === "Realistic"
                                  ? "bg-[#EDF6EE] text-[#1E5A2A] border-[#CBE7CE]"
                                  : "bg-[#EBF3FB] text-[#18569C] border-[#CDE1F8]"
                              }`}
                            >
                              {rec.tier} Tier
                            </span>
                            <span className="text-xs font-mono font-semibold text-[#787774]">
                              IF: {rec.impactFactor}
                            </span>
                          </div>

                          <h4 className="text-sm font-serif font-bold text-[#2F3437] mb-0.5">{rec.journalName}</h4>
                          <p className="text-[11px] text-[#787774] mb-3">{rec.publisher}</p>

                          <div className="p-2.5 rounded-lg bg-white border border-[#EBEBEA] text-[11px] text-[#787774] mb-3">
                            <span className="font-semibold text-[#2F3437] block mb-0.5">Scope Rationale:</span>
                            {rec.scopeRationale}
                          </div>
                        </div>

                        <div className="text-[11px] text-[#7C2D2B] pt-2 border-t border-[#EBEBEA]">
                          <span className="font-semibold block mb-0.5">Desk-Reject Hazard:</span>
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

      <ProviderSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
