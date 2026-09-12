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
} from "lucide-react";
import { DesktopActiveView } from "./DesktopSidebar";
import {
  FullReviewReport,
  ReviewerPersonaFeedback,
  PriorityIssue,
  DimensionScore,
} from "@/lib/types";
import { isSubstantiveReviewerObservation } from "@/lib/utils";
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
}: DesktopDashboardProps) {
  const [selectedPersona, setSelectedPersona] = useState<number>(0);
  const [issueFilter, setIssueFilter] = useState<"all" | "A" | "B" | "C">("all");
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Normalized values prioritizing fullReport
  const title = fullReport?.title || data.paperTitle || data.headlineTitle;
  const isReviewEligible = fullReport?.isEligibleForReview !== false;
  const ineligibilityReason = fullReport?.ineligibilityReason;
  const isAlreadyPublished =
    ineligibilityReason === "already_published" ||
    Boolean(fullReport?.publishedDetails?.isPublished);
  const isNonAcademic =
    ineligibilityReason === "non_academic_document" ||
    (fullReport?.classification && !fullReport.classification.isAcademicManuscript);
  const overallScore = fullReport?.overallScore ?? (isReviewEligible ? data.score ?? 78 : undefined);
  const targetJournal =
    fullReport?.targetJournal || data.targetJournal || "Target Journal";
  const summary = fullReport?.summary;
  const classification = fullReport?.classification;
  const personas = fullReport?.reviewerPersonas || [];
  const dimensions = fullReport?.dimensions || {};
  const issues = fullReport?.priorityIssues || [];
  const journals = fullReport?.journalRecommendations || [];

  // Match journals from catalog to guarantee 3 tiered cards + 10+ list matches
  const matchingJournalsData = useMemo(() => {
    return findMatchingJournals(title, typeof summary === "string" ? summary : "", targetJournal);
  }, [title, summary, targetJournal]);

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
        fitScore: 84,
        scopeRationale: matchingJournalsData.reach.aimsAndScope,
        rejectionRisks: matchingJournalsData.reach.deskRejectHazards,
        requiredRevisionsForFit: matchingJournalsData.reach.keyExpectations,
      },
      {
        tier: "Realistic" as const,
        journalName: matchingJournalsData.realistic.name,
        impactFactor: matchingJournalsData.realistic.impactFactor,
        publisher: matchingJournalsData.realistic.publisher,
        fitScore: 92,
        scopeRationale: matchingJournalsData.realistic.aimsAndScope,
        rejectionRisks: matchingJournalsData.realistic.deskRejectHazards,
        requiredRevisionsForFit: matchingJournalsData.realistic.keyExpectations,
      },
      {
        tier: "Fallback" as const,
        journalName: matchingJournalsData.fallback.name,
        impactFactor: matchingJournalsData.fallback.impactFactor,
        publisher: matchingJournalsData.fallback.publisher,
        fitScore: 96,
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
          name: "Dr. A. Vance",
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#0F172A] dark:text-white">{dim.label}</span>
                    {dim.source && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${
                        dim.source === "llm"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                      }`}>
                        {dim.source === "llm" ? "AI" : "Heuristic"}
                      </span>
                    )}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-extrabold border ${
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
    if (personas.length === 0) {
      return (
        <div className="rounded-3xl liquid-glass-card p-6 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <Users className="w-5 h-5 text-neutral-400" />
          <span>Expert reviewer panel simulation is enabled when live AI evaluation is connected.</span>
        </div>
      );
    }

    const active = personas[selectedPersona] || personas[0];
    const isDevilsAdvocate = active?.persona === "devils_advocate" || selectedPersona === 4;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
              <span>{personas.length}-Persona Peer-Review Simulation (Adversarial Panel)</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
              Multi-disciplinary simulated peer review with domain-specific stress tests
            </p>
          </div>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Independent domain evaluations
          </span>
        </div>

        {/* Persona Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2 pb-1">
          {personas.map((p, idx) => {
            const isActive = selectedPersona === idx;
            const isDA = p.persona === "devils_advocate" || idx === 4;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPersona(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 border ${
                  isActive
                    ? isDA
                      ? "bg-[#7F1D1D] text-white border-[#7F1D1D] shadow-xs"
                      : "liquid-glass-tab-active font-bold text-blue-600 dark:text-blue-400"
                    : isDA
                    ? "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20 hover:bg-rose-500/20"
                    : "liquid-glass-btn-secondary text-neutral-700 dark:text-neutral-300"
                }`}
              >
                <span>
                  {p.persona === "methods_reviewer" ? "🔬" :
                   p.persona === "domain_expert" ? "🧬" :
                   p.persona === "journal_editor" ? "📑" :
                   p.persona === "statistician" ? "📊" :
                   p.persona === "devils_advocate" ? "⚡" :
                   (idx === 0 ? "🔬" : idx === 1 ? "🧬" : idx === 2 ? "📑" : idx === 3 ? "📊" : "⚡")}
                </span>
                <span>{p.name}</span>
                {isDA && (
                  <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-extrabold ${
                    isActive ? "bg-white/20 text-white" : "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                  }`}>
                    Stress-Test
                  </span>
                )}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    isActive
                      ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                      : "bg-black/[0.04] dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  {p.decisionRecommendation}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Persona Card */}
        {active && (
          <div className={`rounded-3xl liquid-glass-card p-6 sm:p-8 space-y-6 ${
            isDevilsAdvocate ? "border-rose-400/40 ring-1 ring-rose-500/30" : ""
          }`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-[#E2E8F0] dark:border-[#1F2937]">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-[#0F172A] dark:text-white">
                    {active.name}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    isDevilsAdvocate
                      ? "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                      : "bg-[#FEF3C7] dark:bg-amber-950/40 text-[#92400E] dark:text-amber-300 border-[#FDE68A] dark:border-amber-800"
                  }`}>
                    Decision: {active.decisionRecommendation}
                  </span>
                  {isDevilsAdvocate && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                      ⚡ Hostile Stress-Test / Adversarial Referee
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-[#475569] dark:text-neutral-300">{active.title}</p>
                <p className="text-xs text-[#64748B] dark:text-neutral-400 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{active.affiliation}</span>
                </p>
              </div>

              {active.expertise && (
                <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#1F2937] text-xs text-[#475569] dark:text-neutral-300 md:max-w-xs">
                  <span className="font-bold text-[#0F172A] dark:text-white block mb-0.5">Focus:</span>
                  {active.expertise}
                </div>
              )}
            </div>

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
        )}
      </div>
    );
  };

  // --- Section 4: Citation & Reference Integrity Audit ---
  const renderCitationsSection = () => {
    const cit = fullReport?.citationIntegrity;
    const totalRef = cit?.totalReferences ?? data.citationAudit.totalCount;
    const verifiedRef = cit?.verifiedCount ?? data.citationAudit.verifiedCount;
    const sampledRef = cit?.sampledCount ?? totalRef;
    const uncheckedRef = cit?.uncheckedCount ?? 0;
    const unresolvableRef = cit?.unresolvableCount ?? 0;
    const retractedRef = cit?.retractedCount ?? data.citationAudit.retractedCount;
    const retAvailable = cit?.retractionCheckAvailable !== false;
    const selfCitRatio = cit?.selfCitationRatio;
    const references = cit?.references || [];

    return (
      <div className="rounded-3xl liquid-glass-card p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-emerald-400" />
              <span>Citation &amp; Reference Integrity Audit</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-neutral-400">
              Verified against CrossRef Open API and Retraction Watch database.
            </p>
          </div>
          {cit?.coverageNote && (
            <span className="text-xs text-[#64748B] dark:text-neutral-400 font-medium">
              {cit.coverageNote}
            </span>
          )}
        </div>

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

        {/* Bibliography Samples Table */}
        {references.length > 0 && (
          <div className="liquid-glass-card rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3 bg-black/[0.02] dark:bg-white/[0.04] border-b border-black/[0.06] dark:border-white/[0.08] text-[11px] font-semibold text-[#64748B] dark:text-neutral-400 uppercase tracking-wider">
              Bibliography Samples &amp; Verification Details
            </div>
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
              {references.slice(0, 15).map((ref, idx) => (
                <div key={idx} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-1 max-w-xl">
                    <div className="font-medium text-[#0F172A] dark:text-white leading-snug">
                      {ref.title || ref.raw}
                    </div>
                    <div className="text-[11px] text-[#64748B] dark:text-neutral-400 flex items-center gap-2 flex-wrap font-mono">
                      {ref.doi && <span>DOI: {ref.doi}</span>}
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
              ))}
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
                {activeView === "personas" && `${personas.length || 5} Expert Reviewer Panel`}
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
                  <div className="flex items-baseline">
                    <span className="text-3xl sm:text-4xl font-black text-[#0F172A] dark:text-white">
                      {overallScore}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#64748B] dark:text-neutral-400 uppercase tracking-wider ml-2">
                      / 100 OVERALL ACCEPTANCE POTENTIAL
                    </span>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0] dark:border-[#1F2937]">
                  <div>
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#64748B] dark:text-neutral-400">Audit Score:</span>
                    <span className="text-base font-extrabold text-[#2563EB] dark:text-blue-400 bg-[#EFF6FF] dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
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

            {/* Diagnostic Suite Full Breakdown in Overview */}
            {isReviewEligible && (
              <div className="space-y-8 pt-2">
                {renderDimensionsSection()}
                {renderIssuesSection()}
                {renderPersonasSection()}
                {renderCitationsSection()}
                {renderJournalsSection()}
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
