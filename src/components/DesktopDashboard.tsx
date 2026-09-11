"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { DesktopActiveView } from "./DesktopSidebar";
import {
  FullReviewReport,
  ReviewerPersonaFeedback,
  PriorityIssue,
  DimensionScore,
} from "@/lib/types";
import {
  exportInteractiveHtmlReport,
  exportWordDocReport,
} from "@/lib/export-generator";

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

  // Filter issues based on priority filter pill
  const filteredIssues = issues.filter(
    (iss) => issueFilter === "all" || iss.priority === issueFilter
  );

  const handleExportHTML = () => {
    if (fullReport) {
      exportInteractiveHtmlReport(fullReport);
    }
  };

  const handleExportWord = () => {
    if (fullReport) {
      exportWordDocReport(fullReport);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 sm:p-10 text-[#1E293B]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ========================================================= */}
        {/* SUB-VIEW TOP NAVIGATION (Only visible when in a sub-view) */}
        {/* ========================================================= */}
        {activeView !== "overview" && (
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onSelectView("overview")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-[#2563EB] border border-blue-200 hover:bg-blue-50 transition shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Overview</span>
              </button>
              <span className="text-neutral-300">/</span>
              <span className="text-xs font-bold text-[#0F172A]">
                {activeView === "personas" && `${personas.length || 5} Expert Reviewer Panel`}
                {activeView === "dimensions" && "6 Scoring Dimensions"}
                {activeView === "issues" && `Priority Action Items (${issues.length})`}
                {(activeView === "journals" || activeView === "recommendations") &&
                  `Target Journals (${journals.length || 3})`}
                {activeView === "citations" && "Reference Integrity"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-medium truncate max-w-md hidden md:inline">
                {title}
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 transition cursor-pointer"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-neutral-600" />
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
            <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
              {/* Brand line & Target badge */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]/80">
                <div className="flex items-center">
                  <span className="font-bold text-base tracking-tight text-[#0F172A]">
                    Manu<span className="text-[#2563EB]">View</span> Diagnostic Suite
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE]/70 text-xs font-semibold text-[#2563EB]">
                    Target: {targetJournal}
                  </span>

                  {onDeleteArticle && (
                    <button
                      type="button"
                      onClick={onDeleteArticle}
                      title="Delete manuscript project"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 border border-neutral-200/60 hover:border-rose-200 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Manuscript Title */}
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#0F172A] leading-snug">
                  {title}
                </h1>
                <p className="text-xs text-[#64748B] mt-2 font-medium">
                  Generated on September 10, 2026 • Peer-Review Calibrated Pre-Submission Diagnostic
                </p>
              </div>

              {/* Acceptance Potential Banner OR Ineligibility Banner */}
              {isAlreadyPublished ? (
                <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-emerald-950 block">
                          Already Published Article Detected
                        </span>
                        <span className="text-[11px] text-emerald-800">
                          Established Record in Scholarly Literature • Pre-Submission Peer-Review Simulation Bypassed
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Published Article
                      </span>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100/50 transition cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Published Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-emerald-200/70 text-xs">
                    {fullReport?.publishedDetails?.journalName && (
                      <div className="p-2.5 rounded-lg bg-white/80 border border-emerald-200/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Published Journal</span>
                        <span className="font-semibold text-emerald-950 truncate block mt-0.5" title={fullReport.publishedDetails.journalName}>
                          {fullReport.publishedDetails.journalName}
                        </span>
                      </div>
                    )}
                    {fullReport?.publishedDetails?.publicationDate && (
                      <div className="p-2.5 rounded-lg bg-white/80 border border-emerald-200/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Publication Date</span>
                        <span className="font-semibold text-emerald-950 block mt-0.5">
                          {fullReport.publishedDetails.publicationDate}
                        </span>
                      </div>
                    )}
                    {fullReport?.publishedDetails?.publisher && (
                      <div className="p-2.5 rounded-lg bg-white/80 border border-emerald-200/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Publisher</span>
                        <span className="font-semibold text-emerald-950 truncate block mt-0.5" title={fullReport.publishedDetails.publisher}>
                          {fullReport.publishedDetails.publisher}
                        </span>
                      </div>
                    )}
                    {fullReport?.publishedDetails?.doi && (
                      <div className="p-2.5 rounded-lg bg-white/80 border border-emerald-200/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Official Article DOI</span>
                        <a
                          href={`https://doi.org/${fullReport.publishedDetails.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-emerald-700 hover:text-emerald-900 hover:underline inline-flex items-center gap-1 truncate block mt-0.5"
                        >
                          <span className="truncate">{fullReport.publishedDetails.doi}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-emerald-800/90 pt-1 flex items-center justify-between flex-wrap gap-2">
                    <span>Verified via: {fullReport?.publishedDetails?.detectedVia || "Official Crossref Registry"}</span>
                    {fullReport?.publishedDetails?.citationCount !== undefined && (
                      <span>Scholarly Citation Count: <strong>{fullReport.publishedDetails.citationCount}</strong></span>
                    )}
                  </div>
                </div>
              ) : isNonAcademic ? (
                <div className="p-5 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-amber-950 block">
                          Document Ineligible for Peer-Review Evaluation
                        </span>
                        <span className="text-[11px] text-amber-800">
                          Classified as {classification?.categoryLabel || "Non-Academic Document"} • Pre-Submission Simulation Bypassed
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
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

                  <p className="text-xs text-amber-900/90 leading-relaxed pt-2 border-t border-amber-200/70">
                    {classification?.advisoryMessage ||
                      "This document does not contain empirical scientific research, IMRaD sections, or scholarly bibliography citations. Acceptance scoring and persona simulations have been safely skipped."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-[#F1F5F9]/80 border border-[#E2E8F0]">
                  <div className="flex items-baseline">
                    <span className="text-3xl sm:text-4xl font-black text-[#0F172A]">
                      {overallScore}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#64748B] uppercase tracking-wider ml-2">
                      / 100 OVERALL ACCEPTANCE POTENTIAL
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#1E293B] hover:bg-[#0F172A] text-white transition shadow-xs cursor-pointer"
                      title="Print or Save as PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-white" />
                      <span>Print / Save as PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 2: Editorial Synthesis & Triage Assessment Card */}
            <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-7 space-y-3 shadow-xs">
              <h2 className="text-base font-bold text-[#0F172A]">
                Editorial Synthesis &amp; Triage Assessment
              </h2>
              <p className="text-xs sm:text-sm text-[#334155] leading-relaxed font-light whitespace-pre-line">
                {summary || data.statusText}
              </p>
            </div>

            {/* CARD 3: Document Classification Card (with solid blue left border) */}
            <div className="rounded-2xl bg-white border border-[#E2E8F0] border-l-4 border-l-[#2563EB] p-6 sm:p-7 space-y-3 shadow-xs">
              <h2 className="text-base font-bold text-[#0F172A]">
                Document Classification: {classification?.categoryLabel || "Academic Research Manuscript"}
              </h2>

              <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                <strong className="font-bold text-[#0F172A]">
                  {classification?.salutation ? (classification.salutation.endsWith(":") ? classification.salutation : `${classification.salutation}:`) : "Dear Author / Contributing Researcher:"}
                </strong>{" "}
                {classification?.advisoryMessage ||
                  "This manuscript has undergone rigorous pre-submission peer-review calibration across core methodological, empirical, and bibliographic dimensions against the target journal's editorial standards."}
              </p>

              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                {classification?.customGuidance ||
                  "Review prioritized action items and simulated referee assessments before submitting to your target journal."}
              </p>
            </div>

            {/* CARD 4: Reporting Guideline Compliance Audit (Only for eligible manuscripts) */}
            {isReviewEligible && fullReport?.reportingGuideline && (
              <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-7 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
                  <div>
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#2563EB]" />
                      <h2 className="text-base font-bold text-[#0F172A]">
                        Reporting Guideline Compliance: {fullReport.reportingGuideline.guidelineName}
                      </h2>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Standard: {fullReport.reportingGuideline.standardType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#64748B]">Audit Score:</span>
                    <span className="text-base font-extrabold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-blue-200">
                      {fullReport.reportingGuideline.scorePercent}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2">
                    <span className="text-xs font-bold text-[#166534] uppercase tracking-wider block">
                      Compliant Checklist Items:
                    </span>
                    <ul className="space-y-1.5 text-xs text-[#166534]">
                      {fullReport.reportingGuideline.compliantItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#16A34A]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] space-y-2">
                    <span className="text-xs font-bold text-[#92400E] uppercase tracking-wider block">
                      Missing or Partial Reporting Items:
                    </span>
                    <ul className="space-y-1.5 text-xs text-[#92400E]">
                      {fullReport.reportingGuideline.missingOrPartialItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D97706]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* INELIGIBILITY NOTICE FOR PEER-REVIEW SUBVIEWS            */}
        {/* ========================================================= */}
        {activeView !== "overview" && activeView !== "citations" && !isReviewEligible && (
          <div className="rounded-2xl bg-white border border-[#E2E8F0] p-8 sm:p-12 text-center space-y-4 shadow-xs animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">
                {isAlreadyPublished ? "Already Published Article" : "Ineligible for Pre-Submission Simulation"}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mt-1 leading-relaxed">
                {isAlreadyPublished
                  ? "This article has already been published in the peer-reviewed scientific literature. Simulated referee personas, scoring dimensions, and pre-submission action items are not applicable."
                  : "Simulated peer-reviewer personas, scoring dimensions, and target journal calibrations are only generated for empirical research manuscripts."}
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => onSelectView("overview")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
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
        {activeView === "personas" && isReviewEligible && (
          <div className="space-y-6 animate-fade-in">
            {/* Persona Switcher Buttons */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              {personas.map((p, idx) => {
                const isActive = selectedPersona === idx;
                const isDevilsAdvocate = p.persona === "devils_advocate" || idx === 4;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPersona(idx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 border ${
                      isActive
                        ? isDevilsAdvocate
                          ? "bg-[#7F1D1D] text-white border-[#7F1D1D] shadow-xs"
                          : "bg-[#0F172A] text-white border-[#0F172A] shadow-xs"
                        : isDevilsAdvocate
                        ? "bg-rose-50/60 text-rose-800 border-rose-200 hover:bg-rose-100/70"
                        : "bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F1F5F9]"
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
                    {isDevilsAdvocate && (
                      <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-extrabold ${
                        isActive ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700 border border-rose-200"
                      }`}>
                        Stress-Test
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {p.decisionRecommendation}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Persona Card */}
            {personas[selectedPersona] && (() => {
              const active = personas[selectedPersona];
              const isDevilsAdvocate = active.persona === "devils_advocate";
              return (
                <div className={`rounded-2xl bg-white border p-6 sm:p-8 space-y-6 shadow-xs ${
                  isDevilsAdvocate ? "border-rose-200 ring-1 ring-rose-200/50" : "border-[#E2E8F0]"
                }`}>
                  {/* Persona Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-lg sm:text-xl font-serif font-bold text-[#0F172A]">
                          {active.name}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          isDevilsAdvocate
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]"
                        }`}>
                          Decision: {active.decisionRecommendation}
                        </span>
                        {isDevilsAdvocate && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                            ⚡ Hostile Stress-Test / Adversarial Referee
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#475569]">{active.title}</p>
                      <p className="text-xs text-[#64748B] flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{active.affiliation}</span>
                      </p>
                    </div>

                    {active.expertise && (
                      <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#475569] md:max-w-xs">
                        <span className="font-bold text-[#0F172A] block mb-0.5">Focus:</span>
                        {active.expertise}
                      </div>
                    )}
                  </div>

                  {/* Evidence Anchors (Grounding) */}
                  {active.evidenceAnchors && active.evidenceAnchors.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Manuscript Evidence Anchors (Grounding):</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {active.evidenceAnchors.map((anchor, aIdx) => (
                          <span
                            key={aIdx}
                            className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-[#1E293B]"
                          >
                            {anchor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fatal Reviewer Objection / Key Challenge */}
                  <div className="p-4 rounded-xl bg-[#FEF2F2] border-l-4 border-[#EF4444] text-xs text-[#991B1B] flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                    <div>
                      <span className="font-bold block uppercase tracking-wide text-[10px] text-[#7F1D1D] mb-0.5">
                        Key Challenge / Reviewer Objection:
                      </span>
                      {active.keyChallenge}
                    </div>
                  </div>

                  {/* Detailed Peer-Review Assessment */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                      Detailed Peer-Review Assessment:
                    </div>
                    <div className="text-xs sm:text-sm text-[#334155] leading-relaxed p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-light whitespace-pre-line">
                      {active.assessment}
                    </div>
                  </div>

                  {/* Adversarial Defenses & Counter-Arguments (if present) */}
                  {active.counterArguments && active.counterArguments.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Adversarial Defenses &amp; Pre-emptive Arguments to Prepare:</span>
                      </div>
                      <div className="space-y-2">
                        {active.counterArguments.map((arg, cIdx) => (
                          <div
                            key={cIdx}
                            className="p-3 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] text-xs text-[#5B21B6] flex items-start gap-2.5 shadow-2xs"
                          >
                            <span className="font-mono text-[#7C3AED] font-bold text-xs mt-0.5">
                              [{cIdx + 1}]
                            </span>
                            <span className="leading-relaxed">{arg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Major Methodological Critiques */}
                  {active.majorCritiques && active.majorCritiques.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Major Methodological Vulnerabilities:</span>
                      </div>
                      <div className="space-y-2">
                        {active.majorCritiques.map((critique, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#334155] flex items-start gap-2.5 shadow-2xs"
                          >
                            <span className="font-mono text-[#DC2626] font-bold text-xs mt-0.5">
                              [{idx + 1}]
                            </span>
                            <span className="leading-relaxed">{critique}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Experimental Controls & Analyses */}
                  {active.missingControlsOrAnalyses && active.missingControlsOrAnalyses.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-[#D97706] uppercase tracking-wider flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>Supplementary Analyses &amp; Control Checks:</span>
                      </div>
                      <div className="space-y-2">
                        {active.missingControlsOrAnalyses.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#334155] flex items-start gap-2 shadow-2xs"
                          >
                            <span className="text-[#D97706] font-bold">&bull;</span>
                            <span className="leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mandatory Revisions Checklist */}
                  {active.mustAddressItems && active.mustAddressItems.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0]">
                      <div className="text-xs font-bold text-[#16A34A] uppercase tracking-wider flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Must-Address Prior to Submission:</span>
                      </div>
                      <div className="space-y-2">
                        {active.mustAddressItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] flex items-start gap-2.5 shadow-2xs"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
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
        )}

        {/* ========================================================= */}
        {/* TAB 3: 6 SCORING DIMENSIONS                              */}
        {/* ========================================================= */}
        {activeView === "dimensions" && isReviewEligible && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                <span>The 6 Evaluation Dimensions (1–5 Rubric)</span>
              </h2>
              <span className="text-xs text-[#64748B]">Calibrated against top-tier standards</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.entries(dimensions) as [string, DimensionScore][]).map(([key, dim]) => (
                <div
                  key={key}
                  className="rounded-2xl bg-white border border-[#E2E8F0] p-5 space-y-3.5 shadow-xs flex flex-col justify-between hover:border-[#CBD5E1] transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A]">{dim.label}</span>
                      <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-extrabold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                        {dim.score} / 5
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] leading-relaxed font-medium">
                      {dim.verdict}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                    {dim.strengths && dim.strengths.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-[#166534] uppercase tracking-wider block mb-1">
                          STRENGTHS:
                        </span>
                        <ul className="space-y-1 text-xs text-[#334155] pl-3 list-disc">
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
                        <span className="text-[10px] font-bold text-[#DC2626] uppercase tracking-wider block mb-1">
                          VULNERABILITIES:
                        </span>
                        <ul className="space-y-1 text-xs text-[#B91C1C] pl-3 list-disc">
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
        )}

        {/* ========================================================= */}
        {/* TAB 4: PRIORITY ACTION ITEMS                              */}
        {/* ========================================================= */}
        {activeView === "issues" && isReviewEligible && (
          <div className="space-y-5 animate-fade-in">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIssueFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  issueFilter === "all"
                    ? "bg-[#0F172A] text-white border-[#0F172A]"
                    : "bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]"
                }`}
              >
                All Issues ({issues.length})
              </button>

              <button
                type="button"
                onClick={() => setIssueFilter("A")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  issueFilter === "A"
                    ? "bg-[#DC2626] text-white border-[#DC2626]"
                    : "bg-white text-[#DC2626] border-[#FECACA] hover:bg-[#FEF2F2]"
                }`}
              >
                🚨 Priority A (Desk-Reject Risk)
              </button>

              <button
                type="button"
                onClick={() => setIssueFilter("B")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  issueFilter === "B"
                    ? "bg-[#D97706] text-white border-[#D97706]"
                    : "bg-white text-[#D97706] border-[#FDE68A] hover:bg-[#FFFBEB]"
                }`}
              >
                ⚠️ Priority B (Major Technical)
              </button>

              <button
                type="button"
                onClick={() => setIssueFilter("C")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  issueFilter === "C"
                    ? "bg-[#16A34A] text-white border-[#16A34A]"
                    : "bg-white text-[#16A34A] border-[#BBF7D0] hover:bg-[#F0FDF4]"
                }`}
              >
                💡 Priority C (Presentation)
              </button>
            </div>

            {/* Issues List */}
            <div className="space-y-4">
              {filteredIssues.map((iss) => (
                <div
                  key={iss.id}
                  className="rounded-2xl bg-white border border-[#E2E8F0] p-6 space-y-3.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border ${
                          iss.priority === "A"
                            ? "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]"
                            : iss.priority === "B"
                            ? "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]"
                            : "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
                        }`}
                      >
                        Priority {iss.priority}: {iss.category}
                      </span>
                      <span className="font-mono text-[11px] text-[#64748B]">{iss.id}</span>
                    </div>

                    <span className="text-[11px] font-medium text-[#64748B]">
                      {iss.priority === "A" ? "Desk-Reject Hazard" : "Reviewer Objection"}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">{iss.title}</h3>
                  <p className="text-xs text-[#475569] leading-relaxed">{iss.description}</p>

                  {/* Typed Evidence Anchor */}
                  {iss.evidenceAnchor && (
                    <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-[11px] font-mono text-[#334155] flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                      <span className="font-bold text-[#475569] uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded bg-white border border-[#CBD5E1]">
                        Anchor
                      </span>
                      <span className="truncate">{iss.evidenceAnchor}</span>
                    </div>
                  )}

                  {/* Reviewer Anticipated Reaction */}
                  {iss.reviewerQuote && (
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border-l-2 border-[#94A3B8] text-xs italic text-[#334155]">
                      &ldquo;{iss.reviewerQuote}&rdquo;
                    </div>
                  )}

                  {/* Required Actionable Fix */}
                  {iss.actionableFix && (
                    <div className="p-3.5 rounded-xl bg-[#ECFDF5] border-l-4 border-[#10B981] text-xs text-[#065F46] flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-0.5 text-[#047857]">
                          Required Pre-Submission Fix:
                        </span>
                        {iss.actionableFix}
                      </div>
                    </div>
                  )}

                  {/* Author Rebuttal Strategy for Journal Response Letter */}
                  {iss.rebuttalStrategy && (
                    <div className="p-3.5 rounded-xl bg-[#EFF6FF] border-l-4 border-[#3B82F6] text-xs text-[#1E40AF] flex items-start gap-2.5">
                      <MessageSquare className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-0.5 text-[#1D4ED8]">
                          Point-by-Point Author Rebuttal Framing (for Journal Response Letter):
                        </span>
                        <p className="leading-relaxed whitespace-pre-line text-[#1E3A8A] font-light">
                          {iss.rebuttalStrategy}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: TARGET JOURNAL RECOMMENDATIONS                     */}
        {/* ========================================================= */}
        {(activeView === "journals" || activeView === "recommendations") && isReviewEligible && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#2563EB]" />
                <span>Target Journal Recommendation Tiers</span>
              </h2>
              <span className="text-xs text-[#64748B]">Verified authentic peer-reviewed journals</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {journals.map((j, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-[#E2E8F0] p-5 space-y-3.5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-[#2563EB] tracking-wide">
                        {j.tier} Match
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                        Fit: {j.fitScore}%
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#0F172A] leading-snug">
                      {j.journalName}
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Impact Factor: <strong>{j.impactFactor}</strong> &bull; {j.publisher}
                    </p>

                    <p className="text-xs text-[#334155] leading-relaxed pt-2 border-t border-[#E2E8F0]">
                      {j.scopeRationale}
                    </p>
                  </div>

                  {j.rejectionRisks && j.rejectionRisks.length > 0 && (
                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <span className="text-[10px] font-bold text-[#DC2626] uppercase tracking-wider block mb-1">
                        DESK-REJECT RISKS:
                      </span>
                      <ul className="space-y-1 text-xs text-[#B91C1C] pl-3 list-disc">
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
          </div>
        )}

        {/* ========================================================= */}
        {/* CROSSREF CITATIONS VIEW (if opened from old link)         */}
        {/* ========================================================= */}
        {activeView === "citations" && (
          <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-8 space-y-5 animate-fade-in shadow-xs">
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>Reference Integrity &amp; Retraction Verification</span>
            </h2>
            <p className="text-xs text-[#64748B]">
              Verified against CrossRef Open API and Retraction Watch database.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                <span className="text-xs text-[#64748B] font-medium">Total References</span>
                <p className="text-2xl font-bold text-[#0F172A] mt-1">
                  {fullReport?.citationIntegrity?.totalReferences || data.citationAudit.totalCount}
                </p>
              </div>
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                <span className="text-xs text-[#166534] font-medium">CrossRef Verified</span>
                <p className="text-2xl font-bold text-[#16A34A] mt-1">
                  {fullReport?.citationIntegrity?.verifiedCount || data.citationAudit.verifiedCount}
                </p>
              </div>
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                <span className="text-xs text-[#64748B] font-medium">Retraction Flags</span>
                <p className="text-2xl font-bold text-[#16A34A] mt-1">
                  {fullReport?.citationIntegrity?.retractedCount || data.citationAudit.retractedCount}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
