"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Tag,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Trash2,
  Printer,
  Globe,
  FileText,
  Users,
  BarChart3,
  AlertCircle,
  BookOpen,
  GraduationCap,
  CheckSquare,
  FlaskConical,
  Info,
  ExternalLink,
  ArrowLeft,
  MessageSquare,
  FileCode,
  ShieldAlert,
  Scale,
  Upload,
  Download,
  ChevronDown,
  Bookmark,
  Lock,
  Search,
  Plus,
  ChevronLeft,
  X,
} from "lucide-react";
import { DesktopActiveView } from "./DesktopSidebar";
import {
  FullReviewReport,
  ReviewerPersonaFeedback,
  PriorityIssue,
  DimensionScore,
} from "@/lib/types";
import { isSubstantiveReviewerObservation, extractReferencesFromText } from "@/lib/utils";
import { batchVerifyReferences } from "@/lib/crossref";
import { computeCitationIntegrity } from "@/lib/engine/citation-audit";
import {
  exportInteractiveHtmlReport,
  exportWordDocReport,
  exportLatexRebuttalTable,
  exportBibTeX,
} from "@/lib/export-generator";
import { DesktopJournalMatchesListView } from "./DesktopJournalMatchesListView";
import { findMatchingJournals, JournalEntry, MatchedJournalItem } from "@/lib/journals";

export interface DesktopDashboardData {
  paperTitle: string;
  headlineTitle: string;
  targetJournal: string;
  aiEngine: string;
  latencyMs: number;
  score?: number;
  statusText: string;
  vulnerabilities: Array<{
    type: "overclaim" | "sample_size" | "control" | "generic";
    title: string;
    description: string;
    severity: "critical" | "warning";
  }>;
  reviewers: Array<{
    name: string;
    role: string;
    tag: "Major" | "Minor" | "Critical";
    quote: string;
    detail?: string;
  }>;
  citationAudit: {
    verifiedCount: number;
    totalCount: number;
    retractedCount: number;
    notes?: string;
  };
}

interface DesktopDashboardProps {
  data: DesktopDashboardData;
  fullReport?: FullReviewReport | null;
  activeView: DesktopActiveView;
  isConnected?: boolean;
  isLoading?: boolean;
  activeModelName?: string | null;
  latencyMs?: number | null;
  onSelectView: (view: DesktopActiveView) => void;
  onNewScan: () => void;
  onOpenSettings?: () => void;
  onDeleteArticle?: () => void;
  onUpdateFullReport?: (updatedReport: FullReviewReport, updatedData?: DesktopDashboardData) => void;
}

export function DesktopDashboard({
  data,
  fullReport,
  activeView,
  isConnected = false,
  isLoading = false,
  activeModelName,
  latencyMs,
  onSelectView,
  onNewScan,
  onOpenSettings,
  onDeleteArticle,
  onUpdateFullReport,
}: DesktopDashboardProps) {
  const [activeReport, setActiveReport] = useState<FullReviewReport | null>(fullReport || null);
  useEffect(() => {
    setActiveReport(fullReport || null);
  }, [fullReport]);

  const [selectedPersona, setSelectedPersona] = useState<number>(0);
  const [issueFilter, setIssueFilter] = useState<"all" | "A" | "B" | "C">("all");
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Citation Section Interactive States
  const [refSearchQuery, setRefSearchQuery] = useState("");
  const [refStatusFilter, setRefStatusFilter] = useState<"all" | "valid" | "retracted" | "unresolvable" | "unchecked">("all");
  const [showAllRefs, setShowAllRefs] = useState(false);
  const [refPage, setRefPage] = useState(1);
  const [isValidatingRefs, setIsValidatingRefs] = useState(false);
  const [validateProgress, setValidateProgress] = useState("");
  const [isAddRefsOpen, setIsAddRefsOpen] = useState(false);
  const [pastedRefsText, setPastedRefsText] = useState("");
  const [pastedRefsError, setPastedRefsError] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentReport = activeReport || fullReport;

  // Normalized values prioritizing fullReport
  const title = currentReport?.title || data.paperTitle || data.headlineTitle;
  const isReviewEligible = currentReport?.isEligibleForReview !== false;
  const ineligibilityReason = currentReport?.ineligibilityReason;
  const isAlreadyPublished =
    ineligibilityReason === "already_published" ||
    Boolean(currentReport?.publishedDetails?.isPublished);
  const isNonAcademic =
    ineligibilityReason === "non_academic_document" ||
    (currentReport?.classification && !currentReport.classification.isAcademicManuscript);
  const overallScore = currentReport ? currentReport.overallScore : (isReviewEligible ? data.score : undefined);
  const targetJournal =
    currentReport?.targetJournal || data.targetJournal || "Target Journal";
  const summary = currentReport?.summary;
  const classification = currentReport?.classification;
  const dimensions = currentReport?.dimensions || {};
  const isDeskReject = currentReport?.editorialTriage?.outcome === "desk_reject";
  const personas: ReviewerPersonaFeedback[] = useMemo(() => {
    if (isDeskReject) {
      return [];
    }
    if (fullReport?.reviewerPersonas && fullReport.reviewerPersonas.length > 0) {
      return fullReport.reviewerPersonas;
    }
    if (!isDeskReject && data?.reviewers && data.reviewers.length > 0) {
      return data.reviewers.map((r, idx) => ({
        persona: (idx === 0
          ? "journal_editor"
          : idx === 1
          ? "domain_expert"
          : idx === 2
          ? "methods_reviewer"
          : idx === 3
          ? "statistician"
          : "devils_advocate") as ReviewerPersonaFeedback["persona"],
        name: r.name || `Reviewer ${idx + 1}`,
        title: r.role || "Peer Reviewer",
        affiliation: "Editorial Review Panel",
        expertise: "Scholarly Evaluation",
        roleDescription: r.role || "Peer Reviewer",
        decisionRecommendation: (r.tag === "Critical"
          ? "Reject / Resubmit"
          : "Major Revision") as ReviewerPersonaFeedback["decisionRecommendation"],
        keyChallenge: r.quote || "Methodological rigor",
        assessment: r.detail || r.quote || "Detailed evaluation required.",
        majorCritiques: [r.quote || "Rigorous evaluation required."],
        missingControlsOrAnalyses: [],
        mustAddressItems: [],
        evidenceAnchors: [],
        counterArguments: [],
        confidentialEditorNote: undefined,
      }));
    }
    return [];
  }, [fullReport?.reviewerPersonas, fullReport?.editorialTriage?.outcome, data?.reviewers, isDeskReject]);
  const issues = fullReport?.priorityIssues || [];
  const journals = fullReport?.journalRecommendations || [];

  // Extract cited journals from full report if available
  const citedJournals = useMemo(() => {
    const refs = fullReport?.citationIntegrity?.references || [];
    return refs.map((r) => r.journal || "").filter(Boolean);
  }, [fullReport]);

  // Match journals from catalog to guarantee 3 tiered cards + 10+ list matches
  const matchingJournalsData = useMemo(() => {
    return findMatchingJournals(title, typeof summary === "string" ? summary : "", targetJournal, citedJournals);
  }, [title, summary, targetJournal, citedJournals]);

  const otherJournals = useMemo(() => {
    return matchingJournalsData.otherMatches || [];
  }, [matchingJournalsData]);

  const displayJournals = useMemo(() => {
    if (journals && journals.length >= 3) return journals;
    return [
      {
        tier: "Reach" as const,
        journalName: matchingJournalsData.reach.name,
        impactFactor: matchingJournalsData.reach.impactFactor,
        publisher: matchingJournalsData.reach.publisher,
        fitScore: matchingJournalsData.reachFitScore,
        scopeRationale: matchingJournalsData.reach.aimsAndScope,
        rejectionRisks: matchingJournalsData.reach.deskRejectHazards,
        requiredRevisionsForFit: matchingJournalsData.reach.keyExpectations,
      },
      {
        tier: "Realistic" as const,
        journalName: matchingJournalsData.realistic.name,
        impactFactor: matchingJournalsData.realistic.impactFactor,
        publisher: matchingJournalsData.realistic.publisher,
        fitScore: matchingJournalsData.realisticFitScore,
        scopeRationale: matchingJournalsData.realistic.aimsAndScope,
        rejectionRisks: matchingJournalsData.realistic.deskRejectHazards,
        requiredRevisionsForFit: matchingJournalsData.realistic.keyExpectations,
      },
      {
        tier: "Fallback" as const,
        journalName: matchingJournalsData.fallback.name,
        impactFactor: matchingJournalsData.fallback.impactFactor,
        publisher: matchingJournalsData.fallback.publisher,
        fitScore: matchingJournalsData.fallbackFitScore,
        scopeRationale: matchingJournalsData.fallback.aimsAndScope,
        rejectionRisks: matchingJournalsData.fallback.deskRejectHazards,
        requiredRevisionsForFit: matchingJournalsData.fallback.keyExpectations,
      },
    ];
  }, [journals, matchingJournalsData]);

  // Filter issues based on priority filter pill
  const filteredIssues = issues.filter(
    (iss) => issueFilter === "all" || iss.priority === issueFilter
  );

  // Synthesize fallback FullReviewReport if fullReport was not loaded into state
  const effectiveReport: FullReviewReport = useMemo(() => {
    if (activeReport) return activeReport;
    if (fullReport) return fullReport;
    return {
      id: "report-current",
      createdAt: new Date().toISOString(),
      title: title || "Manuscript Diagnostic Report",
      targetJournal: targetJournal || "Target Journal",
      overallScore: overallScore ?? 78,
      isEligibleForReview: isReviewEligible,
      ineligibilityReason: ineligibilityReason,
      summary: typeof summary === "string" ? summary : "Manuscript diagnostic analysis generated by ManuView.",
      classification: classification || {
        category: "academic_manuscript",
        categoryLabel: "Empirical Research Manuscript",
        isAcademicManuscript: true,
        confidence: 0.95,
        detectedFeatures: ["Abstract", "Methodology", "Empirical Findings"],
        salutation: "Dear Author / Researcher",
        advisoryMessage: "Academic manuscript format successfully recognized.",
        customGuidance: "Proceed with diagnostic review and journal alignment.",
      },
      dimensions: fullReport?.dimensions,
      priorityIssues: issues.length > 0 ? issues : (data.vulnerabilities || []).map((v, i) => ({
        id: `issue-${i + 1}`,
        priority: (v.severity === "critical" ? "A" : "B") as "A" | "B" | "C",
        title: v.title || v.type,
        category: "Methodology" as const,
        description: v.description,
        location: "Main Text / Methods",
        reviewerQuote: `The treatment of ${v.title || v.type} requires methodological clarification before submission.`,
        actionableFix: `Revise and strengthen ${v.title || v.type} addressing the identified vulnerability.`,
      })),
      reviewerPersonas: personas.length > 0 ? personas : [
        {
          persona: "methods_reviewer" as const,
          name: "Reviewer 3: Research Methodology Referee",
          title: "Senior Methodology Reviewer",
          affiliation: "Editorial Board Reviewer",
          expertise: "Research Methodology and Experimental Rigor",
          roleDescription: "Evaluates methodological validity and control measures",
          decisionRecommendation: "Minor Revision" as const,
          keyChallenge: "Methodological rigor and contribution clarity",
          assessment: "The manuscript demonstrates a solid foundation. Address the highlighted issues before final journal submission.",
          majorCritiques: ["Clarify sample selection and baseline controls."],
          missingControlsOrAnalyses: [],
          mustAddressItems: ["Address priority methodological remarks."],
        },
      ],
      journalRecommendations: journals,
      citationIntegrity: fullReport?.citationIntegrity || {
        totalReferences: data.citationAudit?.totalCount ?? 0,
        sampledCount: data.citationAudit?.totalCount ?? 0,
        checkedCount: data.citationAudit?.verifiedCount ?? 0,
        coverageNote: "Automated bibliographic screening.",
        verifiedCount: data.citationAudit?.verifiedCount ?? 0,
        unresolvableCount: 0,
        uncheckedCount: 0,
        retractedCount: data.citationAudit?.retractedCount ?? 0,
        retractionCheckAvailable: true,
        selfCitationRatio: 0.05,
        recencyProfile: {
          last5YearsPercent: 75,
          olderThan5YearsPercent: 25,
        },
        references: [],
      },
    };
  }, [
    activeReport,
    fullReport,
    title,
    targetJournal,
    overallScore,
    isReviewEligible,
    ineligibilityReason,
    summary,
    classification,
    dimensions,
    issues,
    personas,
    journals,
    data.vulnerabilities,
    data.citationAudit,
  ]);

  const isExportingRef = useRef<boolean>(false);
  const [activeExportFormat, setActiveExportFormat] = useState<string | null>(null);

  const handleExportFormat = async (
    format: "word" | "html" | "latex" | "bibtex",
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Prevent double invocation or concurrent exports
    if (isExportingRef.current) return;
    isExportingRef.current = true;
    setActiveExportFormat(format);
    setIsExportOpen(false);

    try {
      let res: { success: boolean; filePath?: string; error?: string } | undefined;
      let label = "";

      if (format === "word") {
        label = "Word Document (.doc)";
        res = await exportWordDocReport(effectiveReport);
      } else if (format === "html") {
        label = "Interactive HTML (.html)";
        res = await exportInteractiveHtmlReport(effectiveReport);
      } else if (format === "latex") {
        label = "LaTeX Rebuttal Table (.tex)";
        res = await exportLatexRebuttalTable(effectiveReport);
      } else if (format === "bibtex") {
        label = "BibTeX Citations (.bib)";
        res = await exportBibTeX(effectiveReport);
      }

      if (res?.success) {
        setExportToast(`Report exported successfully as ${label}`);
        setTimeout(() => setExportToast(null), 3500);
      }
    } catch (err) {
      console.error(`Failed to export ${format}:`, err);
    } finally {
      setActiveExportFormat(null);
      setTimeout(() => {
        isExportingRef.current = false;
      }, 400);
    }
  };

  const handlePrint = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsExportOpen(false);
    window.print();
  };

  // --- Section 1: The 6 Evaluation Dimensions ---
  const renderDimensionsSection = () => {
    const dimEntries = Object.entries(dimensions) as [string, DimensionScore][];
    if (dimEntries.length === 0) {
      return (
        <div className="rounded-3xl liquid-glass-card p-6 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <BarChart3 className="w-5 h-5 text-neutral-400" />
          <span>Dimensional scoring is calibrated during pre-submission AI evaluation.</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
            <span>The 6 Evaluation Dimensions (1–5 Scale)</span>
          </h2>
          <span className="text-xs text-[#64748B] dark:text-neutral-400">Calibrated against top-tier standards</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dimEntries.map(([key, dim]) => (
            <div
              key={key}
              className="rounded-3xl liquid-glass-card liquid-glass-card-interactive p-5 space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#0F172A] dark:text-white truncate" title={dim.label}>
                      {dim.label}
                    </span>
                    {dim.source && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 border ${
                        dim.source === "llm"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                      }`}>
                        {dim.source === "llm" ? "AI" : "Heuristic"}
                      </span>
                    )}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-extrabold shrink-0 whitespace-nowrap ml-2 border ${
                    dim.score >= 4
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                      : dim.score === 3
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                      : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                  }`}>
                    {dim.score} / 5
                  </span>
                </div>
                <p className="text-xs text-[#475569] dark:text-neutral-300 leading-relaxed font-medium">
                  {dim.verdict}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                {dim.strengths && dim.strengths.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-[#166534] dark:text-emerald-400 uppercase tracking-wider block mb-1">
                      STRENGTHS:
                    </span>
                    <ul className="space-y-1 text-xs text-[#334155] dark:text-neutral-300 pl-3 list-disc">
                      {dim.strengths.map((s, i) => (
                        <li key={i} className="leading-relaxed">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {dim.vulnerabilities && dim.vulnerabilities.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-[#DC2626] dark:text-rose-400 uppercase tracking-wider block mb-1">
                      VULNERABILITIES:
                    </span>
                    <ul className="space-y-1 text-xs text-[#B91C1C] dark:text-rose-300 pl-3 list-disc">
                      {dim.vulnerabilities.map((v, i) => (
                        <li key={i} className="leading-relaxed">
                          {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- Section 2: Prioritized Action Plan before Submission ---
  const renderIssuesSection = () => {
    const countA = issues.filter((i) => i.priority === "A").length;
    const countB = issues.filter((i) => i.priority === "B").length;
    const countC = issues.filter((i) => i.priority === "C").length;

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC2626] dark:text-rose-400" />
              <span>Prioritized Action Plan before Submission</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
              Ranked pre-submission hazards and recommended author rebuttal framing
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIssueFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                issueFilter === "all"
                  ? "liquid-glass-tab-active font-bold text-blue-600 dark:text-blue-400"
                  : "liquid-glass-btn-secondary text-[#475569] dark:text-neutral-300"
              }`}
            >
              All Issues ({issues.length})
            </button>

            <button
              type="button"
              onClick={() => setIssueFilter("A")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                issueFilter === "A"
                  ? "bg-rose-600 text-white shadow-xs border border-rose-500"
                  : "liquid-glass-btn-secondary text-[#DC2626] dark:text-rose-400"
              }`}
            >
              🚨 Priority A ({countA})
            </button>

            <button
              type="button"
              onClick={() => setIssueFilter("B")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                issueFilter === "B"
                  ? "bg-amber-600 text-white shadow-xs border border-amber-500"
                  : "liquid-glass-btn-secondary text-[#D97706] dark:text-amber-400"
              }`}
            >
              ⚠️ Priority B ({countB})
            </button>

            <button
              type="button"
              onClick={() => setIssueFilter("C")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                issueFilter === "C"
                  ? "bg-emerald-600 text-white shadow-xs border border-emerald-500"
                  : "liquid-glass-btn-secondary text-[#16A34A] dark:text-emerald-400"
              }`}
            >
              💡 Priority C ({countC})
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredIssues.length === 0 ? (
            <div className="rounded-3xl liquid-glass-card p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#16A34A] dark:text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                {issueFilter === "all" ? "No Priority Issues Found" : `No Priority ${issueFilter} Issues Identified`}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-neutral-400 max-w-sm mx-auto">
                {issueFilter === "A"
                  ? "Zero critical desk-reject blockers identified in this category."
                  : issueFilter === "B"
                  ? "Zero major methodological objections flagged in this category."
                  : issueFilter === "C"
                  ? "Zero minor presentation or clarity refinements pending."
                  : "The manuscript cleared automated peer-review integrity heuristics."}
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="rounded-3xl liquid-glass-card p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        issue.priority === "A"
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                          : issue.priority === "B"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      Priority {issue.priority}
                    </span>
                    <span className="text-xs font-bold text-[#475569] dark:text-neutral-300 uppercase tracking-wider">
                      {issue.category}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
                      {issue.id}
                    </span>
                    {issue.source && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${
                        issue.source === "crossref"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                          : issue.source === "llm"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                      }`}>
                        {issue.source === "crossref" ? "Registry" : issue.source === "llm" ? "AI" : "Heuristic"}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                    {issue.priority === "A" ? "Desk-Reject Hazard" : "Reviewer Objection"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white mb-1">
                    {issue.title}
                  </h3>
                  <p className="text-xs text-[#334155] dark:text-neutral-300 leading-relaxed font-light">
                    {issue.description}
                  </p>
                </div>

                {issue.evidenceAnchor && (
                  <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-[#CBD5E1] dark:border-[#334155] text-xs font-mono text-[#0F172A] dark:text-neutral-200 flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 shrink-0" />
                    <span className="font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.08] text-neutral-500 dark:text-neutral-400">
                      Anchor
                    </span>
                    <span className="truncate">{issue.evidenceAnchor}</span>
                  </div>
                )}

                {issue.reviewerQuote && (
                  <div className="border-l-2 border-neutral-300 dark:border-[#334155] pl-3.5 py-0.5 text-xs italic text-[#0F172A] dark:text-neutral-200 font-serif">
                    &ldquo;{issue.reviewerQuote}&rdquo;
                  </div>
                )}

                {issue.actionableFix && (
                  <div className="p-3.5 rounded-xl bg-[#F0FDF4] dark:bg-emerald-950/30 border border-[#BBF7D0] dark:border-emerald-800/60 text-xs text-[#166534] dark:text-emerald-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#0F172A] dark:text-white block mb-0.5">
                        Required Pre-Submission Fix:
                      </span>
                      <span className="leading-relaxed">{issue.actionableFix}</span>
                    </div>
                  </div>
                )}

                {issue.rebuttalStrategy && (
                  <div className="p-3.5 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/30 border border-[#BFDBFE] dark:border-blue-800/60 text-xs text-[#1E40AF] dark:text-blue-300 flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-[#2563EB] dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#1E3A8A] dark:text-blue-200 block mb-0.5">
                        Point-by-Point Author Rebuttal Framing (for Journal Response Letter):
                      </span>
                      <p className="leading-relaxed font-light whitespace-pre-line text-[#1E40AF] dark:text-blue-300">
                        {issue.rebuttalStrategy}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // --- Section 3: 5-Persona Peer-Review Simulation (Adversarial Panel) ---
  const renderPersonasSection = () => {
    const triage = fullReport?.editorialTriage;
    const isDeskReject = triage?.outcome === "desk_reject";

    if (isDeskReject) {
      const mismatch = matchingJournalsData.targetJournalEvaluation;
      const targetJournalDiscipline = mismatch?.journalDiscipline || "Different Academic Discipline";
      const paperDiscipline = matchingJournalsData.detectedDiscipline || "Scholarly Research";

      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2 flex-wrap">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <span>Editorial Triage: Direct Desk Reject</span>
                <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                  ⛔ Declined at Editorial Screening
                </span>
              </h2>
              <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
                Manuscript does not meet the published aims and scope of the target journal — external peer review bypassed
              </p>
            </div>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900">
              No Referees Convened
            </span>
          </div>

          {/* Core Alert Banner */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 dark:border-rose-800/60 dark:bg-rose-950/40 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  Why Was This Submission Desk-Rejected Before Peer Review?
                </h3>
                <p className="text-xs text-rose-800/90 dark:text-rose-300/90 leading-relaxed">
                  In academic publishing, when a submission falls outside a journal&apos;s stated aims and scope, the handling editor declines the paper during initial screening (desk reject). Because out-of-scope papers are never assigned to external referees, peer-review simulation is bypassed to maintain academic integrity and avoid generating fabricated review reports.
                </p>
              </div>
            </div>
          </div>

          {/* Handling Editor's Triage Statement */}
          <div className="rounded-2xl liquid-glass-card p-6 space-y-4 border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-xs">
                  ED
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">
                    Handling Editor&apos;s Official Triage Statement
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Lead Editorial Office &bull; Preliminary Screening Review
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                Decision: Desk Reject
              </span>
            </div>

            <div className="text-xs leading-relaxed text-[#334155] dark:text-neutral-300 whitespace-pre-line bg-neutral-50/60 dark:bg-neutral-900/40 p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
              {triage?.summary || fullReport?.summary || `The manuscript substantive focus lies in ${paperDiscipline}, which falls outside the scope of ${targetJournal} (${targetJournalDiscipline}). The submission is declined during editorial screening.`}
            </div>
          </div>

          {/* Scope Contrast Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl liquid-glass-card p-5 space-y-2 border border-rose-200/60 dark:border-rose-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Target Journal Remit
                </span>
                <span className="text-[11px] font-semibold text-neutral-400">Declared Target</span>
              </div>
              <div className="text-sm font-bold text-[#0F172A] dark:text-white">
                {targetJournal}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Operates in discipline: <strong className="text-neutral-800 dark:text-neutral-200">{targetJournalDiscipline}</strong>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Articles must directly contribute to the published scope and readership of {targetJournalDiscipline}.
              </p>
            </div>

            <div className="rounded-2xl liquid-glass-card p-5 space-y-2 border border-emerald-200/60 dark:border-emerald-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Manuscript Focus
                </span>
                <span className="text-[11px] font-semibold text-neutral-400">Detected Scope</span>
              </div>
              <div className="text-sm font-bold text-[#0F172A] dark:text-white">
                {title || "Uploaded Manuscript"}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Study domain: <strong className="text-emerald-700 dark:text-emerald-300">{paperDiscipline}</strong>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Empirical findings and literature foundation belong squarely to {paperDiscipline}.
              </p>
            </div>
          </div>

          {/* Recommended Next Steps Card */}
          <div className="rounded-2xl liquid-glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/40 to-transparent dark:from-blue-950/20">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Redirect Manuscript to In-Scope Journals</span>
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-xl">
                ManuView has calibrated Reach, Realistic, and Fallback journal tiers matching your manuscript&apos;s substantive domain ({paperDiscipline}). View in-scope journals to maximize acceptance probability.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectView("journals")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition shrink-0 cursor-pointer"
            >
              <span>View Matching Journals ({journals.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    if (personas.length === 0) {
      return (
        <div className="rounded-3xl liquid-glass-card p-6 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <Users className="w-5 h-5 text-neutral-400" />
          <span>
            {fullReport?.executionMode === "heuristic_offline"
              ? "Expert reviewer panel simulation is offline. Connect an AI provider in AI Settings and re-run the scan to generate live simulated peer reviews."
              : "Expert reviewer panel simulation is enabled when live AI evaluation is connected."}
          </span>
        </div>
      );
    }

    const active = personas[selectedPersona] || personas[0];
    const isDevilsAdvocate = active?.persona === "devils_advocate" || selectedPersona === 4;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2 flex-wrap">
              <Users className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
              <span>
                {isDeskReject && personas.length <= 1
                  ? "Editorial Triage Decision"
                  : `${personas.length}-Persona Peer-Review Simulation (Adversarial Panel)`}
              </span>
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700">
                ⚖️ Simulated Panel (Synthetic)
              </span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
              {isDeskReject && personas.length <= 1
                ? "Handling editor desk-rejected the submission — peer reviewers were not engaged"
                : "Multi-disciplinary simulated peer review with domain-specific stress tests"}
            </p>
          </div>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {isDeskReject && personas.length <= 1 ? "Editorial screening only" : "Independent domain evaluations"}
          </span>
        </div>

        {isDeskReject && triage?.summary && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 dark:border-rose-800/50 dark:bg-rose-950/30 p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-rose-900/90 dark:text-rose-300/90">
              {triage.summary}
            </p>
          </div>
        )}

        {/* Panel Consensus & Score Uncertainty Card (P0-3) */}
        {fullReport?.panelConsensus && (
          <div className="p-4 rounded-2xl liquid-glass-card shadow-2xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  Panel Consensus:
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  fullReport.panelConsensus.consensusLevel === "unanimous"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                    : fullReport.panelConsensus.consensusLevel === "majority"
                    ? "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                    : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                }`}>
                  {fullReport.panelConsensus.consensusLevel.toUpperCase()} (±{fullReport.panelConsensus.uncertaintyMargin} Margin)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 flex-wrap">
                {fullReport.panelConsensus.distribution.deskReject > 0 && (
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">
                    Desk Reject ×{fullReport.panelConsensus.distribution.deskReject}
                  </span>
                )}
                {fullReport.panelConsensus.distribution.reject > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                    Reject ×{fullReport.panelConsensus.distribution.reject}
                  </span>
                )}
                {fullReport.panelConsensus.distribution.majorRevision > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                    Major Rev ×{fullReport.panelConsensus.distribution.majorRevision}
                  </span>
                )}
                {fullReport.panelConsensus.distribution.minorRevision > 0 && (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    Minor Rev ×{fullReport.panelConsensus.distribution.minorRevision}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {fullReport.panelConsensus.borderlineDiagnosis}
            </p>
          </div>
        )}

        {/* Partial LLM Generation Notice (P0-1) */}
        {fullReport?.missingPersonaRoles && fullReport.missingPersonaRoles.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Partial Reviewer Generation:</strong> {personas.length} of 5 reviewer perspectives generated by the AI provider (missing: {fullReport.missingPersonaRoles.join(", ")}). Missing perspectives are not fabricated to maintain academic integrity.
            </span>
          </div>
        )}

        {/* Persona Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 border-b border-[#E2E8F0] dark:border-[#1F2937]">
          {personas.map((p, idx) => {
            const isActive = selectedPersona === idx;
            const isDA = p.persona === "devils_advocate" || idx === 4;
            const isReject = p.decisionRecommendation?.includes("Reject");
            const isAccept = p.decisionRecommendation?.includes("Accept");
            const shortLabel =
              p.persona === "journal_editor" || idx === 0
                ? "Reviewer 1 (Editor)"
                : p.persona === "domain_expert" || idx === 1
                ? "Reviewer 2 (Domain)"
                : p.persona === "methods_reviewer" || idx === 2
                ? "Reviewer 3 (Methods)"
                : p.persona === "statistician" || idx === 3
                ? "Reviewer 4 (Stats)"
                : "Reviewer 5 (Adversary)";
            const icon =
              p.persona === "journal_editor" || idx === 0
                ? "📑"
                : p.persona === "domain_expert" || idx === 1
                ? "🧬"
                : p.persona === "methods_reviewer" || idx === 2
                ? "🔬"
                : p.persona === "statistician" || idx === 3
                ? "📊"
                : "⚡";

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPersona(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 border ${
                  isActive
                    ? "bg-[#0F172A] dark:bg-blue-600 text-white border-[#0F172A] dark:border-blue-600 shadow-xs"
                    : isDA
                    ? "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20 hover:bg-rose-500/20"
                    : "liquid-glass-btn-secondary text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B]"
                }`}
              >
                <span>{icon}</span>
                <span>{shortLabel}</span>
                {isDA && !isActive && (
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-extrabold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    Stress-Test
                  </span>
                )}
                {p.decisionRecommendation && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                      isActive
                        ? "bg-white/20 text-white border-white/30"
                        : isReject
                        ? "bg-red-50 text-[#991B1B] border-red-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                        : isAccept
                        ? "bg-emerald-50 text-[#065F46] border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-amber-50 text-[#92400E] border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                    }`}
                  >
                    {p.decisionRecommendation}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Persona Card */}
        {active && (() => {
          const isReject = active.decisionRecommendation?.includes("Reject");
          const isAccept = active.decisionRecommendation?.includes("Accept");
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
            <div className={`rounded-3xl liquid-glass-card p-6 sm:p-8 space-y-6 ${
              isDevilsAdvocate ? "border-rose-400/40 ring-1 ring-rose-500/30" : ""
            }`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-[#E2E8F0] dark:border-[#1F2937]">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-[#0F172A] dark:text-white">
                      {active.name?.startsWith("Reviewer") ? active.name : fallbackRoleName}
                    </h3>
                    {active.decisionRecommendation && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        isReject
                          ? "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                          : isAccept
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : "bg-[#FEF3C7] dark:bg-amber-950/40 text-[#92400E] dark:text-amber-300 border-[#FDE68A] dark:border-amber-800"
                      }`}>
                        Decision: {active.decisionRecommendation}
                      </span>
                    )}
                    {isDevilsAdvocate && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                        ⚡ Hostile Stress-Test / Adversarial Referee
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-[#475569] dark:text-neutral-300">{active.title}</p>
                  <p className="text-xs text-[#64748B] dark:text-neutral-400 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{active.affiliation}</span>
                  </p>
                </div>

                {active.expertise && (
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] text-xs text-[#475569] dark:text-neutral-300 md:max-w-sm shadow-2xs">
                    <span className="font-bold text-[#0F172A] dark:text-white block mb-0.5">Area of Expertise & Scope:</span>
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

            {active.evidenceAnchors && active.evidenceAnchors.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#475569] dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
                  <span>Manuscript Evidence Anchors (Grounding):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {active.evidenceAnchors.map((anchor, aIdx) => (
                    <span
                      key={aIdx}
                      className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-[#F8FAFC] dark:bg-[#161F30] border border-[#CBD5E1] dark:border-[#334155] text-[#1E293B] dark:text-neutral-200"
                    >
                      {anchor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-[#FEF2F2] dark:bg-rose-950/30 border-l-4 border-[#EF4444] dark:border-rose-600 text-xs text-[#991B1B] dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626] dark:text-rose-400" />
              <div>
                <span className="font-bold block uppercase tracking-wide text-[10px] text-[#7F1D1D] dark:text-rose-400 mb-0.5">
                  Key Challenge / Reviewer Objection:
                </span>
                {active.keyChallenge}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-[#64748B] dark:text-neutral-400 uppercase tracking-wider">
                Detailed Peer-Review Assessment:
              </div>
              <div className="text-xs sm:text-sm text-[#334155] dark:text-neutral-300 leading-relaxed p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#1F2937] font-light whitespace-pre-line">
                {active.assessment}
              </div>
            </div>

            {active.counterArguments && active.counterArguments.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-[#7C3AED] dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Adversarial Defenses &amp; Pre-emptive Arguments to Prepare:</span>
                </div>
                <div className="space-y-2">
                  {active.counterArguments.map((arg, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-3 rounded-xl bg-[#F5F3FF] dark:bg-purple-950/30 border border-[#DDD6FE] dark:border-purple-800/50 text-xs text-[#5B21B6] dark:text-purple-300 flex items-start gap-2.5 shadow-2xs"
                    >
                      <span className="font-mono text-[#7C3AED] dark:text-purple-400 font-bold text-xs mt-0.5">
                        [{cIdx + 1}]
                      </span>
                      <span className="leading-relaxed">{arg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {active.mustAddressItems && active.mustAddressItems.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0] dark:border-[#1F2937]">
                <div className="text-xs font-bold text-[#16A34A] dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Must-Address Prior to Submission:</span>
                </div>
                <div className="space-y-2">
                  {active.mustAddressItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#F0FDF4] dark:bg-emerald-950/30 border border-[#BBF7D0] dark:border-emerald-800/60 text-xs text-[#166534] dark:text-emerald-300 flex items-start gap-2.5 shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          );
        })()}
      </div>
    );
  };

  // --- Citation & Reference Integrity Audit Handlers ---
  const cit = effectiveReport?.citationIntegrity;
  const references = cit?.references || [];

  const handleReauditReferences = async () => {
    if (references.length === 0) {
      setIsAddRefsOpen(true);
      return;
    }

    setIsValidatingRefs(true);
    setValidateProgress(`Auditing ${references.length} references via Crossref Open API & Retraction Watch...`);
    try {
      const verified = await batchVerifyReferences(references);
      const updatedCit = computeCitationIntegrity(
        verified,
        verified.length,
        effectiveReport?.authors
      );

      const updatedReport: FullReviewReport = {
        ...(effectiveReport || ({} as FullReviewReport)),
        citationIntegrity: updatedCit,
      };

      const updatedData: DesktopDashboardData = {
        ...data,
        citationAudit: {
          verifiedCount: updatedCit.verifiedCount,
          totalCount: updatedCit.totalReferences,
          retractedCount: updatedCit.retractedCount,
          notes: `Verified ${updatedCit.verifiedCount} DOIs via CrossRef Open API.`,
        },
      };

      setActiveReport(updatedReport);
      if (onUpdateFullReport) {
        onUpdateFullReport(updatedReport, updatedData);
      }
    } catch (err: any) {
      console.error("Failed to re-audit references:", err);
    } finally {
      setIsValidatingRefs(false);
      setValidateProgress("");
    }
  };

  const handleLoadPastedReferences = async (mode: "replace" | "append") => {
    if (!pastedRefsText.trim()) {
      setPastedRefsError("Please paste or type reference entries.");
      return;
    }

    setPastedRefsError(null);
    setIsValidatingRefs(true);
    setValidateProgress("Extracting citations & querying Crossref...");

    try {
      const extracted = extractReferencesFromText(pastedRefsText);
      if (extracted.length === 0) {
        throw new Error("No references could be detected. Please provide numbered references, DOIs, or author citations.");
      }

      const verified = await batchVerifyReferences(extracted);

      let finalVerified = verified;
      if (mode === "append" && references.length > 0) {
        finalVerified = [...references, ...verified];
      }

      const updatedCit = computeCitationIntegrity(
        finalVerified,
        finalVerified.length,
        effectiveReport?.authors
      );

      const updatedReport: FullReviewReport = {
        ...(effectiveReport || ({} as FullReviewReport)),
        citationIntegrity: updatedCit,
      };

      const updatedData: DesktopDashboardData = {
        ...data,
        citationAudit: {
          verifiedCount: updatedCit.verifiedCount,
          totalCount: updatedCit.totalReferences,
          retractedCount: updatedCit.retractedCount,
          notes: `Verified ${updatedCit.verifiedCount} DOIs via CrossRef Open API.`,
        },
      };

      setActiveReport(updatedReport);
      if (onUpdateFullReport) {
        onUpdateFullReport(updatedReport, updatedData);
      }
      setIsAddRefsOpen(false);
      setPastedRefsText("");
    } catch (err: any) {
      setPastedRefsError(err.message || "Failed to audit references.");
    } finally {
      setIsValidatingRefs(false);
      setValidateProgress("");
    }
  };

  const filteredReferences = useMemo(() => {
    let list = references;
    if (refStatusFilter !== "all") {
      if (refStatusFilter === "retracted") {
        list = list.filter((r) => r.isRetracted || r.status === "retracted");
      } else if (refStatusFilter === "valid") {
        list = list.filter((r) => r.status === "valid" && !r.isRetracted);
      } else {
        list = list.filter((r) => r.status === refStatusFilter);
      }
    }

    if (refSearchQuery.trim()) {
      const q = refSearchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          (r.title && r.title.toLowerCase().includes(q)) ||
          (r.raw && r.raw.toLowerCase().includes(q)) ||
          (r.doi && r.doi.toLowerCase().includes(q)) ||
          (r.journal && r.journal.toLowerCase().includes(q)) ||
          (r.authors && r.authors.some((a) => a.toLowerCase().includes(q)))
      );
    }
    return list;
  }, [references, refStatusFilter, refSearchQuery]);

  const REFS_PER_PAGE = 20;
  const totalRefPages = Math.ceil(filteredReferences.length / REFS_PER_PAGE) || 1;
  const paginatedReferences = useMemo(() => {
    if (showAllRefs) return filteredReferences;
    const start = (refPage - 1) * REFS_PER_PAGE;
    return filteredReferences.slice(start, start + REFS_PER_PAGE);
  }, [filteredReferences, showAllRefs, refPage]);

  // --- Section 4: Citation & Reference Integrity Audit ---
  const renderCitationsSection = () => {
    const totalRef = cit?.totalReferences ?? data.citationAudit.totalCount;
    const verifiedRef = cit?.verifiedCount ?? data.citationAudit.verifiedCount;
    const sampledRef = cit?.sampledCount ?? totalRef;
    const uncheckedRef = cit?.uncheckedCount ?? 0;
    const unresolvableRef = cit?.unresolvableCount ?? 0;
    const retractedRef = cit?.retractedCount ?? data.citationAudit.retractedCount;
    const retAvailable = cit?.retractionCheckAvailable !== false;
    const selfCitRatio = cit?.selfCitationPercent ?? cit?.selfCitationRatio;

    return (
      <div className="rounded-3xl liquid-glass-card p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-emerald-400" />
              <span>Citation &amp; Reference Integrity Audit</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-neutral-400">
              Verified against CrossRef Open API and Retraction Watch database.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleReauditReferences}
              disabled={isValidatingRefs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold liquid-glass-btn-secondary transition cursor-pointer disabled:opacity-50 shadow-xs"
              title="Re-verify all bibliography DOIs and check Retraction Watch"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isValidatingRefs ? "animate-spin text-blue-600" : "text-neutral-600 dark:text-neutral-300"}`} />
              <span>{isValidatingRefs ? "Auditing..." : "Audit / Re-validate"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPastedRefsError(null);
                setIsAddRefsOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold liquid-glass-btn-primary text-white transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Load / Add References</span>
            </button>

            {references.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  if (effectiveReport) {
                    await exportBibTeX(effectiveReport);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold liquid-glass-btn-secondary transition cursor-pointer shadow-xs"
                title="Export all validated references to BibTeX"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Export BibTeX</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Validation Progress Banner */}
        {isValidatingRefs && (
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2.5 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{validateProgress || "Auditing references via Crossref Open API..."}</span>
          </div>
        )}

        {/* Retraction Alert Banner */}
        {retractedRef > 0 && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 flex items-start gap-3 text-rose-900 dark:text-rose-200 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">
                {retractedRef} Retracted Reference(s) Detected in Cited Bibliography!
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                Formal publisher retractions flag discredited findings. Editors and referees routinely desk-reject manuscripts that rely on retracted literature. Replace or remove flagged studies prior to submission.
              </p>
            </div>
          </div>
        )}

        {/* 6-Stat Tiles Grid */}
        <div className={`grid grid-cols-2 ${selfCitRatio !== undefined ? "sm:grid-cols-6" : "sm:grid-cols-5"} gap-3`}>
          <div className="liquid-glass-card p-3.5 rounded-2xl text-center">
            <div className="text-xl font-bold font-serif text-[#0F172A] dark:text-white">{totalRef}</div>
            <div className="text-[11px] text-[#64748B] dark:text-neutral-400 mt-0.5">Total References</div>
          </div>
          <div className="liquid-glass-card p-3.5 rounded-2xl text-center">
            <div className="text-xl font-bold font-serif text-[#16A34A] dark:text-emerald-400">{verifiedRef}</div>
            <div className="text-[11px] text-[#64748B] dark:text-neutral-400 mt-0.5">
              {sampledRef < totalRef ? `Verified (in ${sampledRef})` : "Crossref Verified"}
            </div>
          </div>
          <div className="liquid-glass-card p-3.5 rounded-2xl text-center">
            <div className="text-xl font-bold font-serif text-[#64748B] dark:text-neutral-400">{uncheckedRef}</div>
            <div className="text-[11px] text-[#64748B] dark:text-neutral-400 mt-0.5">Not Checked</div>
          </div>
          <div className="liquid-glass-card p-3.5 rounded-2xl text-center">
            <div className={`text-xl font-bold font-serif ${unresolvableRef > 0 ? "text-rose-600 dark:text-rose-400" : "text-[#0F172A] dark:text-white"}`}>
              {unresolvableRef}
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-neutral-400 mt-0.5">Unresolvable DOIs</div>
          </div>
          <div className="liquid-glass-card p-3.5 rounded-2xl text-center">
            <div className={`text-xl font-bold font-serif ${!retAvailable ? "text-neutral-400 text-sm pt-1" : retractedRef > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {retAvailable ? retractedRef : "Not screened"}
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-neutral-400 mt-0.5">Retracted Flagged</div>
          </div>
          {selfCitRatio !== undefined && (
            <div className="liquid-glass-card p-3.5 rounded-2xl text-center">
              <div className="text-xl font-bold font-serif text-[#0F172A] dark:text-white">{selfCitRatio}%</div>
              <div className="text-[11px] text-[#64748B] dark:text-neutral-400 mt-0.5">Self-Citation Rate</div>
            </div>
          )}
        </div>

        {/* Empty State when no references */}
        {references.length === 0 && (
          <div className="p-8 rounded-2xl border-2 border-dashed border-black/10 dark:border-white/10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="font-bold text-sm text-[#0F172A] dark:text-white">
                No Bibliography References Detected
              </h3>
              <p className="text-xs text-[#64748B] dark:text-neutral-400">
                This manuscript does not have parsed citations, or references were omitted during file extraction. Load or paste your bibliography to perform a live Crossref DOI and Retraction Watch audit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPastedRefsError(null);
                setIsAddRefsOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl liquid-glass-btn-primary text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Load / Paste References</span>
            </button>
          </div>
        )}

        {/* Bibliography Registry Table & Filters */}
        {references.length > 0 && (
          <div className="space-y-3">
            {/* Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { id: "all", label: `All (${references.length})` },
                    { id: "valid", label: `Verified (${references.filter((r) => r.status === "valid" && !r.isRetracted).length})` },
                    { id: "retracted", label: `Retracted (${references.filter((r) => r.isRetracted || r.status === "retracted").length})` },
                    { id: "unresolvable", label: `Unresolvable (${references.filter((r) => r.status === "unresolvable").length})` },
                    { id: "unchecked", label: `Not Checked (${references.filter((r) => r.status === "unchecked").length})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setRefStatusFilter(tab.id);
                      setRefPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      refStatusFilter === tab.id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.08] dark:hover:bg-white/[0.1]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={refSearchQuery}
                  onChange={(e) => {
                    setRefSearchQuery(e.target.value);
                    setRefPage(1);
                  }}
                  placeholder="Search citations or DOIs..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl liquid-glass-input text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="liquid-glass-card rounded-2xl overflow-hidden shadow-xs">
              <div className="p-3 bg-black/[0.02] dark:bg-white/[0.04] border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[11px] font-semibold text-[#64748B] dark:text-neutral-400 uppercase tracking-wider">
                <span>
                  Bibliography Registry ({filteredReferences.length} of {references.length})
                </span>
                {filteredReferences.length > REFS_PER_PAGE && (
                  <button
                    type="button"
                    onClick={() => setShowAllRefs(!showAllRefs)}
                    className="normal-case font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                  >
                    {showAllRefs ? `Show Paginated (${REFS_PER_PAGE}/page)` : `Show All (${filteredReferences.length})`}
                  </button>
                )}
              </div>

              <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                {paginatedReferences.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-400">
                    No references match your current search or filter.
                  </div>
                ) : (
                  paginatedReferences.map((ref, idx) => (
                    <div key={idx} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-1 max-w-xl">
                        <div className="font-medium text-[#0F172A] dark:text-white leading-snug">
                          {ref.title || ref.raw}
                        </div>
                        {ref.authors && ref.authors.length > 0 && (
                          <div className="text-[11px] text-[#64748B] dark:text-neutral-400">
                            {ref.authors.join(", ")}
                          </div>
                        )}
                        <div className="text-[11px] text-[#64748B] dark:text-neutral-400 flex items-center gap-2 flex-wrap font-mono">
                          {ref.doi && (
                            <a
                              href={`https://doi.org/${ref.doi}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                            >
                              <span>DOI: {ref.doi}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {ref.journal && <span>&bull; {ref.journal}</span>}
                          {ref.year && <span>&bull; {ref.year}</span>}
                        </div>
                        {ref.retractionDetails && (
                          <div className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold">
                            {ref.retractionDetails}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {ref.isRetracted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            RETRACTED
                          </span>
                        ) : ref.status === "expression_of_concern" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            EXPRESSION OF CONCERN
                          </span>
                        ) : ref.status === "valid" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            VERIFIED
                          </span>
                        ) : ref.status === "unresolvable" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            <Info className="w-2.5 h-2.5" />
                            UNRESOLVABLE (404)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border border-neutral-500/30">
                            <Info className="w-2.5 h-2.5" />
                            NOT CHECKED
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination footer */}
              {!showAllRefs && totalRefPages > 1 && (
                <div className="p-3 bg-black/[0.02] dark:bg-white/[0.04] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs text-[#64748B] dark:text-neutral-400">
                  <div>
                    Showing {(refPage - 1) * REFS_PER_PAGE + 1} -{" "}
                    {Math.min(refPage * REFS_PER_PAGE, filteredReferences.length)} of {filteredReferences.length}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={refPage <= 1}
                      onClick={() => setRefPage((p) => Math.max(1, p - 1))}
                      className="px-2 py-1 rounded-lg border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 font-medium">
                      Page {refPage} of {totalRefPages}
                    </span>
                    <button
                      type="button"
                      disabled={refPage >= totalRefPages}
                      onClick={() => setRefPage((p) => Math.min(totalRefPages, p + 1))}
                      className="px-2 py-1 rounded-lg border border-black/10 dark:border-white/10 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Section 5: Target Journal Recommendations & 10+ List View ---
  const renderJournalsSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
              <span>Target Journal Recommendation Tiers</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
              Peer-review calibrated recommendations across Reach, Realistic, and Fallback tiers
            </p>
          </div>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Verified authentic indexed journals
          </span>
        </div>

        {/* Scope Mismatch Warning Banner */}
        {matchingJournalsData.targetJournalEvaluation?.isDisciplinaryMismatch && (
          <div className="p-4 sm:p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-sm text-rose-900 dark:text-rose-300">
                Critical Scope Mismatch: &ldquo;{targetJournal}&rdquo; ({matchingJournalsData.targetJournalEvaluation.journalDiscipline})
              </div>
              <p className="leading-relaxed text-rose-800 dark:text-rose-200/90">
                {matchingJournalsData.targetJournalEvaluation.mismatchWarning ||
                  `The author-specified target journal "${targetJournal}" publishes in ${matchingJournalsData.targetJournalEvaluation.journalDiscipline}, while this manuscript belongs to ${matchingJournalsData.detectedDiscipline}. Submitting out of scope carries a very high probability of immediate editorial desk rejection.`}
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300/80 pt-1 font-medium">
                The strategic tiers below have been dynamically recalibrated to peer-reviewed venues directly within <strong>{matchingJournalsData.detectedDiscipline}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* 3 Strategic Recommendation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {displayJournals.map((j, idx) => (
            <div
              key={idx}
              className="rounded-3xl liquid-glass-card liquid-glass-card-interactive p-5 space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${
                    j.tier === "Reach"
                      ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                      : j.tier === "Realistic"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                  }`}>
                    {j.tier} Tier
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                    Fit: {j.fitScore}%
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#0F172A] dark:text-white leading-snug">
                  {j.journalName}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-neutral-400">
                  Impact Factor: <strong>{j.impactFactor}</strong> &bull; {j.publisher}
                </p>

                <p className="text-xs text-[#334155] dark:text-neutral-300 leading-relaxed pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                  {j.scopeRationale}
                </p>
              </div>

              {j.rejectionRisks && j.rejectionRisks.length > 0 && (
                <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-[10px] font-bold text-[#DC2626] dark:text-rose-400 uppercase tracking-wider block mb-1">
                    DESK-REJECT RISKS:
                  </span>
                  <ul className="space-y-1 text-xs text-[#B91C1C] dark:text-rose-300 pl-3 list-disc">
                    {j.rejectionRisks.map((risk, rIdx) => (
                      <li key={rIdx} className="leading-relaxed">
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Qualified Field & Catalog Matches in List View (10+ journals) */}
        <DesktopJournalMatchesListView
          otherJournals={otherJournals}
          detectedDiscipline={matchingJournalsData.detectedDiscipline}
        />
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-[#1E293B] dark:text-[#E2E8F0]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ========================================================= */}
        {/* SUB-VIEW TOP NAVIGATION (Only visible when in a sub-view) */}
        {/* ========================================================= */}
        {activeView !== "overview" && (
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onSelectView("overview")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold liquid-glass-btn-secondary text-[#2563EB] dark:text-blue-400 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Overview</span>
              </button>
              <span className="text-neutral-300 dark:text-neutral-600">/</span>
              <span className="text-xs font-bold text-[#0F172A] dark:text-white">
                {activeView === "personas" && (isDeskReject ? "Editorial Triage Decision" : `${personas.length || 5} Expert Reviewer Panel`)}
                {activeView === "dimensions" && "6 Scoring Dimensions"}
                {activeView === "issues" && `Priority Action Items (${issues.length})`}
                {(activeView === "journals" || activeView === "recommendations") &&
                  `Target Journals (${journals.length || 3})`}
                {activeView === "citations" && "Reference Integrity"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium truncate max-w-md hidden md:inline">
                {title}
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold liquid-glass-btn-secondary text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MAIN ARTICLE VIEW (EXACTLY 3 CARDS AS PER DESIGN SPEC)   */}
        {/* ========================================================= */}
        {activeView === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* CARD 1: ManuView Diagnostic Suite Header Card */}
            <div className="rounded-3xl liquid-glass-card p-6 sm:p-8 space-y-6">
              {/* Brand line & Target badge */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]/80 dark:border-[#1F2937]">
                <div className="flex items-center">
                  <span className="font-bold text-base tracking-tight text-[#0F172A] dark:text-white">
                    Manu<span className="text-[#2563EB] dark:text-blue-400">View</span> Diagnostic Suite
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#EFF6FF] dark:bg-blue-950/50 border border-[#BFDBFE]/70 dark:border-blue-800/70 text-xs font-semibold text-[#2563EB] dark:text-blue-400">
                    Target: {targetJournal}
                  </span>

                  {/* Export Options Dropdown */}
                  <div className="relative" ref={exportDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsExportOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#161F30] text-neutral-700 dark:text-neutral-200 border border-[#E5E7EB] dark:border-[#334155] hover:bg-neutral-50 dark:hover:bg-[#1E293B] transition shadow-2xs cursor-pointer"
                      title="Export diagnostic report in multiple academic formats"
                      aria-expanded={isExportOpen}
                    >
                      <Download className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
                      <span>Export</span>
                      <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isExportOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isExportOpen && (
                      <div className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-white dark:bg-[#161F30] border border-[#E5E7EB] dark:border-[#334155] shadow-lg py-1.5 z-30 transition-all animate-fade-in">
                        <button
                          type="button"
                          disabled={activeExportFormat !== null}
                          onClick={(e) => handleExportFormat("word", e)}
                          className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          <span>{activeExportFormat === "word" ? "Exporting Word..." : "Word Document (.doc)"}</span>
                        </button>
                        <button
                          type="button"
                          disabled={activeExportFormat !== null}
                          onClick={(e) => handleExportFormat("html", e)}
                          className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
                        >
                          <Globe className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{activeExportFormat === "html" ? "Exporting HTML..." : "Interactive HTML (.html)"}</span>
                        </button>
                        <button
                          type="button"
                          disabled={activeExportFormat !== null}
                          onClick={(e) => handleExportFormat("latex", e)}
                          className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
                        >
                          <FileCode className="w-3.5 h-3.5 text-purple-500" />
                          <span>{activeExportFormat === "latex" ? "Exporting LaTeX..." : "LaTeX Rebuttal (.tex)"}</span>
                        </button>
                        <button
                          type="button"
                          disabled={activeExportFormat !== null}
                          onClick={(e) => handleExportFormat("bibtex", e)}
                          className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                          <span>{activeExportFormat === "bibtex" ? "Exporting BibTeX..." : "BibTeX Citations (.bib)"}</span>
                        </button>
                        <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                        <button
                          type="button"
                          onClick={(e) => handlePrint(e)}
                          className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Print / Save as PDF</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {onDeleteArticle && (
                    <button
                      type="button"
                      onClick={onDeleteArticle}
                      title="Delete manuscript project"
                      className="p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-neutral-200/60 dark:border-[#334155] hover:border-rose-200 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Manuscript Title */}
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#0F172A] dark:text-white leading-snug">
                  {title}
                </h1>
                <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-2 font-medium">
                  Generated on September 10, 2026 • Peer-Review Calibrated Pre-Submission Diagnostic
                </p>
              </div>

              {/* Heuristic Offline Degradation Notice */}
              {fullReport?.executionMode === "heuristic_offline" && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs leading-relaxed animate-fade-in">
                  <span className="text-base select-none">⚡</span>
                  <div>
                    <div className="font-semibold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-0.5">
                      Deterministic Heuristic Calibration Active
                    </div>
                    <div>
                      {fullReport.llmCallError ? (
                        <span className="font-medium text-rose-600 dark:text-rose-400">Notice: {fullReport.llmCallError}. </span>
                      ) : null}
                      Diagnostics were generated using deterministic structural heuristics, Crossref registry checks, and disciplinary catalog calibrations. To enable live deep LLM critiques and multi-persona adversarial debates, connect an AI provider in <strong>AI Settings</strong>.
                    </div>
                  </div>
                </div>
              )}

              {/* Acceptance Potential Banner OR Ineligibility Banner */}
              {isAlreadyPublished ? (
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
                    {fullReport?.publishedDetails?.journalName && (
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-[#161F30]/80 border border-emerald-200/60 dark:border-emerald-800/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Published Journal</span>
                        <span className="font-semibold text-emerald-950 dark:text-emerald-100 truncate block mt-0.5" title={fullReport.publishedDetails.journalName}>
                          {fullReport.publishedDetails.journalName}
                        </span>
                      </div>
                    )}
                    {fullReport?.publishedDetails?.publicationDate && (
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-[#161F30]/80 border border-emerald-200/60 dark:border-emerald-800/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Publication Date</span>
                        <span className="font-semibold text-emerald-950 dark:text-emerald-100 block mt-0.5">
                          {fullReport.publishedDetails.publicationDate}
                        </span>
                      </div>
                    )}
                    {fullReport?.publishedDetails?.publisher && (
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-[#161F30]/80 border border-emerald-200/60 dark:border-emerald-800/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Publisher</span>
                        <span className="font-semibold text-emerald-950 dark:text-emerald-100 truncate block mt-0.5" title={fullReport.publishedDetails.publisher}>
                          {fullReport.publishedDetails.publisher}
                        </span>
                      </div>
                    )}
                    {fullReport?.publishedDetails?.doi && (
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-[#161F30]/80 border border-emerald-200/60 dark:border-emerald-800/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Official Article DOI</span>
                        <a
                          href={`https://doi.org/${fullReport.publishedDetails.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:underline inline-flex items-center gap-1 truncate block mt-0.5"
                        >
                          <span className="truncate">{fullReport.publishedDetails.doi}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-emerald-800/90 dark:text-emerald-400 pt-1 flex items-center justify-between flex-wrap gap-2">
                    <span>Verified via: {fullReport?.publishedDetails?.detectedVia || "Official Crossref Registry"}</span>
                    {fullReport?.publishedDetails?.citationCount !== undefined && (
                      <span>Scholarly Citation Count: <strong>{fullReport.publishedDetails.citationCount}</strong></span>
                    )}
                  </div>
                </div>
              ) : isNonAcademic ? (
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
                      <button
                        type="button"
                        onClick={onNewScan}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Manuscript</span>
                      </button>
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
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl liquid-glass-card">
                  <div className="flex items-center flex-wrap gap-2.5">
                    {overallScore !== undefined ? (
                      <div className="flex items-baseline">
                        <span className="text-3xl sm:text-4xl font-black text-[#0F172A] dark:text-white">
                          {overallScore}
                        </span>
                        {fullReport?.scoreUncertaintyMargin !== undefined && (
                          <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 ml-1.5">
                            ±{fullReport.scoreUncertaintyMargin}
                          </span>
                        )}
                        <span className="text-xs sm:text-sm font-bold text-[#64748B] dark:text-neutral-400 uppercase tracking-wider ml-2">
                          / 100 OVERALL ACCEPTANCE POTENTIAL
                        </span>
                        {fullReport?.scoreUncertaintyMargin !== undefined && (
                          <span className="text-[11px] ml-2 px-2.5 py-0.5 rounded-full font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                            Band: [{Math.max(0, overallScore - fullReport.scoreUncertaintyMargin)} - {Math.min(100, overallScore + fullReport.scoreUncertaintyMargin)}]
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                          Deterministic Compliance Audit Mode
                        </span>
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">
                          Algorithmic peer-review scoring suppressed for scholarly integrity in offline heuristic mode.
                        </span>
                      </div>
                    )}
                    {matchingJournalsData.targetJournalEvaluation?.isDisciplinaryMismatch && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Target Journal Scope Mismatch
                      </span>
                    )}
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
              )}
            </div>

            {/* CARD 2: Editorial Synthesis & Triage Assessment Card (Omitted for non-academic documents) */}
            {!isNonAcademic && (
              <div className="rounded-3xl liquid-glass-card p-6 sm:p-7 space-y-3">
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  Editorial Synthesis &amp; Triage Assessment
                </h2>
                <p className="text-xs sm:text-sm text-[#334155] dark:text-neutral-300 leading-relaxed font-light whitespace-pre-line">
                  {summary || data.statusText}
                </p>
              </div>
            )}

            {/* CARD 3: Document Classification Card (Only for review-eligible manuscripts; omitted for published articles and non-academic documents) */}
            {isReviewEligible && (
              <div className="rounded-3xl liquid-glass-card border-l-4 border-l-[#2563EB] dark:border-l-blue-500 p-6 sm:p-7 space-y-3">
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  Document Classification: {classification?.categoryLabel || "Academic Research Manuscript"}
                </h2>

                <p className="text-xs sm:text-sm text-[#334155] dark:text-neutral-300 leading-relaxed">
                  <strong className="font-bold text-[#0F172A] dark:text-white">
                    {classification?.salutation ? (classification.salutation.endsWith(":") ? classification.salutation : `${classification.salutation}:`) : "Dear Author / Contributing Researcher:"}
                  </strong>{" "}
                  {classification?.advisoryMessage ||
                    "This manuscript has undergone rigorous pre-submission peer-review calibration across core methodological, empirical, and bibliographic dimensions against the target journal's editorial standards."}
                </p>

                {/* Detected Academic Features Pills */}
                {classification?.detectedFeatures && classification.detectedFeatures.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {classification.detectedFeatures.map((feat, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                      >
                        &bull; {feat}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs sm:text-sm text-[#64748B] dark:text-neutral-400 leading-relaxed">
                  {classification?.customGuidance ||
                    "Review prioritized action items and simulated referee assessments before submitting to your target journal."}
                </p>
              </div>
            )}

            {/* CARD 4: Reporting Guideline Compliance Audit (Only for eligible manuscripts) */}
            {isReviewEligible && fullReport?.reportingGuideline && (
              <div className="rounded-3xl liquid-glass-card p-6 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0] dark:border-[#1F2937]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#2563EB] dark:text-blue-400 shrink-0" />
                      <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                        Reporting Guideline Compliance: {fullReport.reportingGuideline.guidelineName}
                      </h2>
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
                      Standard: {fullReport.reportingGuideline.standardType}
                      {fullReport.reportingGuideline.standardUrl && (
                        <>
                          {" "}&bull;{" "}
                          <a
                            href={fullReport.reportingGuideline.standardUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline hover:text-blue-600 dark:hover:text-blue-300 text-neutral-600 dark:text-neutral-400"
                          >
                            Official Checklist &amp; Guidelines &rarr;
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <span className="text-xs font-semibold text-[#64748B] dark:text-neutral-400 whitespace-nowrap">Audit Score:</span>
                    <span className="text-sm sm:text-base font-extrabold text-[#2563EB] dark:text-blue-400 bg-[#EFF6FF] dark:bg-blue-950/50 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 shrink-0 whitespace-nowrap">
                      {fullReport.reportingGuideline.itemSetScope === "core_subset"
                        ? `${fullReport.reportingGuideline.evidencedCount}/${fullReport.reportingGuideline.totalItems} core items evidenced (${fullReport.reportingGuideline.itemSetSize} in full standard; ${fullReport.reportingGuideline.scorePercent}%)`
                        : fullReport.reportingGuideline.evidencedCount !== undefined && fullReport.reportingGuideline.totalItems !== undefined
                        ? `${fullReport.reportingGuideline.evidencedCount}/${fullReport.reportingGuideline.totalItems} Evidenced (${fullReport.reportingGuideline.scorePercent}%)`
                        : `${fullReport.reportingGuideline.scorePercent}%`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F0FDF4] dark:bg-emerald-950/30 border border-[#BBF7D0] dark:border-emerald-800/60 space-y-2">
                    <span className="text-xs font-bold text-[#166534] dark:text-emerald-300 uppercase tracking-wider block">
                      Compliant Checklist Items:
                    </span>
                    <ul className="space-y-2 text-xs text-[#166534] dark:text-emerald-300">
                      {fullReport.reportingGuideline.compliantItems.map((item, idx) => {
                        const [heading, ...rest] = item.split(" — ");
                        const excerpt = rest.join(" — ");
                        return (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#16A34A] dark:text-emerald-400" />
                            <div className="space-y-0.5">
                              <span className="font-semibold">{heading}</span>
                              {excerpt && (
                                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 italic pl-2 border-l-2 border-emerald-300 dark:border-emerald-700">
                                  {excerpt}
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FFFBEB] dark:bg-amber-950/30 border border-[#FDE68A] dark:border-amber-800/60 space-y-2">
                    <span className="text-xs font-bold text-[#92400E] dark:text-amber-300 uppercase tracking-wider block">
                      Missing or Partial Reporting Items:
                    </span>
                    <ul className="space-y-2 text-xs text-[#92400E] dark:text-amber-300">
                      {fullReport.reportingGuideline.missingOrPartialItems.map((item, idx) => {
                        const [heading, ...rest] = item.split(" — ");
                        const recommendation = rest.join(" — ");
                        return (
                          <li key={idx} className="flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D97706] dark:text-amber-400" />
                            <div className="space-y-0.5">
                              <span className="font-semibold">{heading}</span>
                              {recommendation && (
                                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 pl-2 border-l-2 border-amber-300 dark:border-amber-700">
                                  {recommendation}
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {(() => {
                    const substantiveObservations = (
                      fullReport.reportingGuideline.additionalReviewerObservations || []
                    ).filter(isSubstantiveReviewerObservation);

                    if (substantiveObservations.length === 0) return null;

                    return (
                      <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-[#E2E8F0] dark:border-[#334155] space-y-2 text-xs md:col-span-2">
                        <span className="font-semibold text-[#475569] dark:text-neutral-300 uppercase tracking-wider text-[10px] block">
                          Additional Reviewer Observations:
                        </span>
                        <ul className="space-y-1 text-[#334155] dark:text-neutral-300">
                          {substantiveObservations.map((obs, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-gray-400">&bull;</span>
                              <span>{obs}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* CARD 5: Deterministic Compliance Audit (P0-1) */}
            {fullReport?.complianceAudit && fullReport.complianceAudit.items && fullReport.complianceAudit.items.length > 0 && (
              <div className="rounded-3xl liquid-glass-card p-6 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0] dark:border-[#1F2937]">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                      Deterministic Compliance Audit
                    </h2>
                    <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                      Rule-Based
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">{fullReport.complianceAudit.passedCount} Passed</span>
                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                    <span className="text-amber-700 dark:text-amber-400 font-bold">{fullReport.complianceAudit.warnCount} Warnings</span>
                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                    <span className="text-rose-700 dark:text-rose-400 font-bold">{fullReport.complianceAudit.failedCount} Failures</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {fullReport.complianceAudit.items.map((item) => (
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
          </div>
        )}

        {/* ========================================================= */}
        {/* INELIGIBILITY NOTICE FOR PEER-REVIEW SUBVIEWS            */}
        {/* ========================================================= */}
        {activeView !== "overview" && activeView !== "citations" && !isReviewEligible && (
          <div className="rounded-3xl liquid-glass-card p-8 sm:p-12 text-center space-y-4 shadow-xs animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
                {isAlreadyPublished ? "Already Published Article" : "Ineligible for Pre-Submission Simulation"}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-1 leading-relaxed">
                {isAlreadyPublished
                  ? "This article has already been published in the peer-reviewed scientific literature. Simulated referee personas, scoring dimensions, and pre-submission action items are not applicable."
                  : "Simulated peer-reviewer personas, scoring dimensions, and target journal calibrations are only generated for empirical research manuscripts."}
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => onSelectView("overview")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-btn-primary transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Overview</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: 5 REVIEWER PERSONAS (ADVERSARIAL PANEL)            */}
        {/* ========================================================= */}
        {activeView === "personas" && isReviewEligible && renderPersonasSection()}

        {/* ========================================================= */}
        {/* TAB 3: 6 SCORING DIMENSIONS                               */}
        {/* ========================================================= */}
        {activeView === "dimensions" && isReviewEligible && renderDimensionsSection()}

        {/* ========================================================= */}
        {/* TAB 4: ACTION PLAN & CRITICAL ISSUES                      */}
        {/* ========================================================= */}
        {activeView === "issues" && isReviewEligible && renderIssuesSection()}

        {/* ========================================================= */}
        {/* TAB 5: TARGET JOURNAL RECOMMENDATIONS                     */}
        {/* ========================================================= */}
        {activeView === "journals" && isReviewEligible && renderJournalsSection()}

        {/* ========================================================= */}
        {/* TAB 6: CITATION INTEGRITY AUDIT                           */}
        {/* ========================================================= */}
        {activeView === "citations" && renderCitationsSection()}
      </div>

      {/* Load / Add References Modal */}
      {isAddRefsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl liquid-glass-card p-6 sm:p-8 space-y-4 shadow-2xl bg-white/95 dark:bg-[#111827]/95 border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Load / Add References</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-neutral-400">
                  Paste references or DOIs to audit against Crossref Open API and Retraction Watch.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddRefsOpen(false);
                  setPastedRefsError(null);
                }}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0F172A] dark:text-white">Bibliography Text or DOIs</span>
                <button
                  type="button"
                  onClick={() => {
                    setPastedRefsText(
                      `1. Saunders D, et al. A DLL3-targeted antibody-drug conjugate for small cell lung cancer. Sci Transl Med. 2015. DOI: 10.1126/scitranslmed.aac9459\n` +
                      `2. Wakefield AJ, et al. Ileal-lymphoid-nodular hyperplasia and pervasive developmental disorder in children. Lancet. 1998. DOI: 10.1016/S0140-6736(97)11096-0\n` +
                      `3. NonExistent A, Hallucination B. Synthetic citation. J Bio. 2024. DOI: 10.1038/s41586-999-hallucinated01\n` +
                      `4. Rudin CM, et al. Molecular subtypes of small cell lung cancer. Nat Rev Cancer. 2019. DOI: 10.1038/s41568-019-0133-9`
                    );
                  }}
                  className="text-blue-600 hover:underline dark:text-blue-400 cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Load Sample References</span>
                </button>
              </div>

              <textarea
                rows={8}
                value={pastedRefsText}
                onChange={(e) => setPastedRefsText(e.target.value)}
                placeholder="Paste bibliography, numbered citations, or DOIs here..."
                className="w-full p-3 rounded-2xl liquid-glass-input text-xs font-mono resize-none focus:outline-none"
              />
            </div>

            {pastedRefsError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pastedRefsError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isValidatingRefs}
                onClick={() => {
                  setIsAddRefsOpen(false);
                  setPastedRefsError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>

              {references.length > 0 && (
                <button
                  type="button"
                  disabled={isValidatingRefs || !pastedRefsText.trim()}
                  onClick={() => handleLoadPastedReferences("append")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-btn-secondary disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  Append to Existing ({references.length})
                </button>
              )}

              <button
                type="button"
                disabled={isValidatingRefs || !pastedRefsText.trim()}
                onClick={() => handleLoadPastedReferences("replace")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-btn-primary text-white disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isValidatingRefs ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing Crossref...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{references.length > 0 ? "Replace & Audit" : "Audit & Save References"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Toast Notification */}
      {exportToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#0F172A] dark:bg-neutral-800 text-white text-xs font-medium rounded-xl shadow-2xl border border-neutral-700/80 animate-fade-in pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{exportToast}</span>
        </div>
      )}
    </div>
  );
}
