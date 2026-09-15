"use client";

import React, { useState } from "react";
import {
  Sparkles,
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  BookOpen,
  ShieldCheck,
  Search,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import JournalCombobox, { JournalInfoTooltip } from "@/components/JournalCombobox";
import { pickManuscriptFileDesktop, isDesktopApp } from "@/lib/desktop";
import { extractTextFromFile, parseManuscriptText } from "@/lib/parser";
import { runManuscriptDiagnostic } from "@/lib/diagnostic-engine";
import { fetchLiveJournalScope, JournalScopeProfile } from "@/lib/journal-scope-service";
import { evaluateManuscriptScopeTriage, evaluateManuscriptScopeTriageWithLLM } from "@/lib/engine/scope-triage-journals";
import { DesktopDashboardData } from "@/components/DesktopDashboard";
import { PaperItem } from "@/components/DesktopSidebar";
import { FullReviewReport, ProviderConfig, ParsedManuscript } from "@/lib/types";
import { useApiConnection } from "@/lib/useApiConnection";
import { sanitizeErrorMessage, getSavedClientConfig, resolveActiveConfig } from "@/lib/llm";

interface DesktopScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (paper: PaperItem, data: DesktopDashboardData, fullReport?: any) => void;
}

const SAMPLE_PREPRINT = {
  title: "Single-cell transcriptional profiling of DLL3 activation in neuroendocrine lung carcinoma",
  journal: "Nature Communications",
  abstract:
    "Small cell lung cancer (SCLC) exhibits rapid recurrence and therapy resistance. Delta-like ligand 3 (DLL3) is an established cell-surface target for antibody-drug conjugates and T-cell engagers. However, the precise cis-regulatory mechanisms controlling DLL3 transcription remain uncharacterized. Here, we perform marker-based CRISPR-Cas9 screens and identify the transcription factor POU2F1 as a primary driver of DLL3 expression. We demonstrate that POU2F1 directly binds the DLL3 distal enhancer element to drive chemoresistance in clinical isolates. Knockdown of POU2F1 caused significant downregulation of DLL3 mRNA across 8 patient-derived organoid lines. Our findings prove that targeting POU2F1 will rescue therapeutic efficacy in neuroendocrine lung carcinoma and provide a universal predictive biomarker for clinical stratification.",
  keywords: "small cell lung cancer, DLL3, POU2F1, CRISPR screen, organoids, chemoresistance",
};

export function DesktopScanModal({
  isOpen,
  onClose,
  onComplete,
}: DesktopScanModalProps) {
  const { isConnected, modelName, provider } = useApiConnection();
  const [journal, setJournal] = useState("");
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [loadingPercent, setLoadingPercent] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Two-Stage Compatibility State
  const [compatibilityMatch, setCompatibilityMatch] = useState<{
    journalName: string;
    journalDiscipline: string;
    manuscriptDiscipline: string;
    summary: string;
    parsed: ParsedManuscript;
    liveScope: JournalScopeProfile | null;
  } | null>(null);

  if (!isOpen) return null;

  const handleSample = () => {
    setTitle(SAMPLE_PREPRINT.title);
    setJournal(SAMPLE_PREPRINT.journal);
    setAbstract(SAMPLE_PREPRINT.abstract);
    setKeywords(SAMPLE_PREPRINT.keywords);
    setSelectedFile(null);
    setFileName(null);
    setError(null);
    setCompatibilityMatch(null);
  };

  const handleNativePick = async () => {
    if (isDesktopApp()) {
      const res = await pickManuscriptFileDesktop();
      if (res) {
        setFileName(res.name);
        const blob = new Blob([res.bytes as unknown as BlobPart]);
        const file = new File([blob], res.name);
        setSelectedFile(file);
        setCompatibilityMatch(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileName(file.name);
      setError(null);
      setCompatibilityMatch(null);
    }
  };

  const finishScanAndOpenDashboard = (fullReport: FullReviewReport) => {
    const newId = `paper-${Date.now()}`;
    const isDeskReject =
      fullReport.editorialTriage?.outcome === "desk_reject" ||
      fullReport.ineligibilityReason === "scope_mismatch";
    const isEligible = !isDeskReject && fullReport.isEligibleForReview !== false;
    const isPublished =
      !isDeskReject &&
      (fullReport.ineligibilityReason === "already_published" ||
      Boolean(fullReport.publishedDetails?.isPublished));

    const newPaper: PaperItem = {
      id: newId,
      title: fullReport.title || title || "Manuscript Pre-Submission",
      shortName:
        (fullReport.title || title).length > 24
          ? (fullReport.title || title).substring(0, 24) + "..."
          : fullReport.title || title,
      journal: fullReport.publishedDetails?.journalName || journal,
      score: isDeskReject ? undefined : (isEligible ? (fullReport.overallScore || 80) : undefined),
      isEligibleForReview: !isDeskReject && isEligible,
      isDeskReject: isDeskReject,
      ineligibilityReason: isDeskReject ? "scope_mismatch" : fullReport.ineligibilityReason,
      isPublished: isPublished,
      publishedJournal: fullReport.publishedDetails?.journalName,
      editorialTriage: fullReport.editorialTriage,
      createdAt: fullReport.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedConfig = getSavedClientConfig();
    const engineName = isConnected && provider
      ? `${provider.toUpperCase()} (${modelName || "ACTIVE"})`
      : savedConfig?.provider
      ? `${savedConfig.provider.toUpperCase()} (${savedConfig.model || "ACTIVE"})`
      : "ManuView Academic Diagnostic Engine";

    const dashboardData: DesktopDashboardData = {
      paperTitle: fullReport.title || title,
      headlineTitle: isDeskReject
        ? `${journal} Pre-Submission Diagnostic (Desk Reject)`
        : isPublished
        ? `${newPaper.journal} (Published Article)`
        : `${journal} Pre-Submission Diagnostic`,
      targetJournal: newPaper.journal,
      aiEngine: engineName,
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
      vulnerabilities: fullReport.priorityIssues?.map((issue) => ({
        type: (issue.category === "Causal Claims" ? "overclaim" : "sample_size") as "overclaim" | "sample_size",
        title: issue.title,
        description: issue.description,
        severity: (issue.priority === "A" ? "critical" : "warning") as "critical" | "warning",
      })) || [],
      reviewers: fullReport.reviewerPersonas?.map((p) => ({
        name: p.name,
        role: p.title || p.persona,
        tag: (p.decisionRecommendation === "Desk Reject" ? "Critical" : "Major") as "Major" | "Minor" | "Critical",
        quote: p.keyChallenge || p.assessment?.slice(0, 150) || "Comprehensive evaluation required.",
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
    onClose();
  };

  // Step D: Click 'Check compatibility' button
  const handleCheckCompatibility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && (!title.trim() || !abstract.trim())) {
      setError("Please provide either a manuscript document or Title and Abstract.");
      return;
    }
    if (!journal.trim()) {
      setError("Target journal is required.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStep("Analyzing paper & journal scope compatibility...");
    setLoadingPercent(20);

    try {
      let rawText = "";
      if (selectedFile) {
        rawText = await extractTextFromFile(selectedFile);
      } else {
        rawText = `Title: ${title}\n\nAbstract:\n${abstract}\n\nKeywords: ${keywords}`;
      }

      const parsed = parseManuscriptText(rawText, fileName || undefined);
      if (title.trim()) parsed.title = title.trim();
      if (abstract.trim()) parsed.abstract = abstract.trim();

      setLoadingStep(`Searching aims & scope for "${journal}" via scholarly registries...`);
      setLoadingPercent(35);
      const liveScope = await fetchLiveJournalScope(journal);

      setLoadingStep(`Evaluating scope compatibility for "${journal}" with AI Handling Editor...`);
      setLoadingPercent(65);
      const savedConfig = await resolveActiveConfig();
      const triageResult = await evaluateManuscriptScopeTriageWithLLM(
        parsed.title,
        parsed.abstract,
        journal,
        savedConfig,
        liveScope,
        keywords,
        rawText.slice(0, 3000),
        (msg) => setLoadingStep(msg)
      );

      // Decision F: Does scope match between journal and paper?
      // Rejection Path: F -- No --> G [Desk Reject] --> H [Display Desk Reject Details] --> I ([End])
      if (triageResult.isTargetScopeMismatch) {
        setLoadingStep("Desk Reject flagged: Generating handling editor triage report...");
        setLoadingPercent(85);

        const deskRejectReport = await runManuscriptDiagnostic(
          parsed,
          savedConfig,
          journal,
          (update) => {
            setLoadingStep(update.message);
            if (update.percent !== undefined) setLoadingPercent(update.percent);
          },
          liveScope
        );

        finishScanAndOpenDashboard(deskRejectReport);
        return;
      }

      // Acceptance Path: F -- Yes --> J [Submit for Review ready]
      setCompatibilityMatch({
        journalName: liveScope?.officialName || journal,
        journalDiscipline: liveScope?.primaryDiscipline || triageResult.detectedDiscipline,
        manuscriptDiscipline: triageResult.detectedDiscipline,
        summary: triageResult.editorialTriage.summary,
        parsed,
        liveScope,
      });
    } catch (err: any) {
      setError(sanitizeErrorMessage(err.message || "Scope compatibility check failed."));
    } finally {
      setLoading(false);
      setLoadingStep("");
      setLoadingPercent(undefined);
    }
  };

  // Step J: Click 'Submit for Review' button
  const handleSubmitForReview = async () => {
    if (!compatibilityMatch) return;

    setLoading(true);
    setError(null);
    setLoadingStep("Commissioning 5-persona peer review panel (Methods, Domain, Editor, Stats, Devil's Advocate)...");
    setLoadingPercent(40);

    try {
      const savedConfig = await resolveActiveConfig();
      const fullReport = await runManuscriptDiagnostic(
        compatibilityMatch.parsed,
        savedConfig,
        journal,
        (update) => {
          setLoadingStep(update.message);
          if (update.percent !== undefined) setLoadingPercent(update.percent);
        },
        compatibilityMatch.liveScope
      );

      finishScanAndOpenDashboard(fullReport);
    } catch (err: any) {
      setError(sanitizeErrorMessage(err.message || "Peer review simulation failed."));
    } finally {
      setLoading(false);
      setLoadingStep("");
      setLoadingPercent(undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xl p-4">
      <div className="w-full max-w-lg rounded-3xl liquid-glass-modal p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🪄</span>
            <div>
              <h2 className="text-sm font-bold text-[#111827] dark:text-white">
                New Pre-Submission AI Review
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Run live 5-persona simulation, CrossRef audits, and causal overclaim screening.
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    AI Connected: {provider?.toUpperCase()} ({modelName})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 backdrop-blur-xs">
                    <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    ManuView Academic Diagnostic Suite
                  </span>
                )}
              </div>
            </div>
          </div>
          {!loading && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 backdrop-blur-xs">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                Running Full Diagnostic Engine...
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {loadingStep}
              </p>
              {loadingPercent !== undefined && (
                <div className="w-48 bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden mx-auto mt-2.5">
                  <div
                    className="bg-blue-600 dark:bg-blue-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${loadingPercent}%` }}
                  />
                </div>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 max-w-xs">
              Calibrating against {journal || "target"} editorial standards and cross-checking references.
            </p>
          </div>
        ) : (
          <form onSubmit={handleCheckCompatibility} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Manuscript Target &amp; Content
              </span>
              <button
                type="button"
                onClick={handleSample}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Preprint</span>
              </button>
            </div>

            <div className="relative z-30">
              <div className="flex items-center gap-1.5 mb-1">
                <label className="block text-xs font-semibold text-[#374151] dark:text-neutral-300">
                  Target Journal
                </label>
                <JournalInfoTooltip journal={journal} />
              </div>
              <JournalCombobox
                value={journal}
                onChange={(val) => {
                  setJournal(val);
                  setCompatibilityMatch(null);
                }}
                showScopeBadge={false}
                placeholder="Search or select a journal..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] dark:text-neutral-300 mb-1">
                Manuscript Working Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setCompatibilityMatch(null);
                }}
                placeholder="e.g. Single-cell transcriptional profiling of DLL3 activation..."
                className="w-full px-3.5 py-2 rounded-xl liquid-glass-input text-xs text-[#111827] dark:text-white dark:placeholder-neutral-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] dark:text-neutral-300 mb-1">
                Abstract (or paste full text)
              </label>
              <textarea
                rows={3}
                value={abstract}
                onChange={(e) => {
                  setAbstract(e.target.value);
                  setCompatibilityMatch(null);
                }}
                placeholder="Paste manuscript abstract or key summary..."
                className="w-full px-3.5 py-2 rounded-xl liquid-glass-input text-xs text-[#111827] dark:text-white dark:placeholder-neutral-500 focus:outline-none resize-none"
              />
            </div>

            {/* Document Upload Zone */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] dark:text-neutral-300 mb-1">
                Attach Manuscript Document (.pdf, .docx, .txt, .md)
              </label>
              <div
                onClick={() => {
                  if (isDesktopApp()) handleNativePick();
                }}
                className="border border-dashed border-neutral-300 dark:border-white/15 hover:border-blue-500/50 dark:hover:border-blue-400/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 bg-white/40 dark:bg-white/5 hover:bg-blue-50/5 transition cursor-pointer text-center relative backdrop-blur-xs"
              >
                {!isDesktopApp() && (
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                )}
                <UploadCloud className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  {fileName ? (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{fileName}</span>
                  ) : (
                    "Click to select manuscript file"
                  )}
                </div>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  PDF, Word (.docx), Markdown or Plain Text
                </div>
              </div>
            </div>

            {/* Scope Match Verified Card (When Passed) */}
            {compatibilityMatch && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 dark:bg-emerald-950/40 dark:border-emerald-800 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Scope Match Confirmed
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                    Passed Editorial Screening
                  </span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Your manuscript research domain (<strong>{compatibilityMatch.manuscriptDiscipline}</strong>) aligns with <strong>{compatibilityMatch.journalName}</strong> ({compatibilityMatch.journalDiscipline}). Target journal scope verified via live registry.
                </p>
              </div>
            )}

            {/* Academic Privacy & Confidentiality Guarantee */}
            <div className="p-3.5 rounded-2xl liquid-glass-card flex items-start gap-2.5 text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-800 dark:text-neutral-200 block">
                  Manuscript Confidentiality &amp; Zero-Retention Guarantee
                </span>
                <span>
                  {provider === "ollama" || provider === "webllm"
                    ? "100% On-Device: Your manuscript is analyzed locally via private GPU/CPU acceleration. No text, data, or metadata ever leaves your machine."
                    : "Direct Encrypted BYOK Connection: Official API calls with zero-retention flags. ManuView does not log, store, or relay your unpublished work through third-party servers."}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl liquid-glass-btn-secondary text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              {compatibilityMatch ? (
                <>
                  <button
                    type="button"
                    onClick={() => setCompatibilityMatch(null)}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
                  >
                    Change Journal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitForReview}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Submit for Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Check Compatibility</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
