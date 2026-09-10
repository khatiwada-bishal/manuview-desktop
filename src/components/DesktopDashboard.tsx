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
  score: number;
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
  const overallScore = fullReport?.overallScore ?? data.score ?? 91;
  const targetJournal =
    fullReport?.targetJournal || data.targetJournal || "International Journal of Production Economics";
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
                {activeView === "personas" && "4 Reviewer Personas"}
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

              {/* Acceptance Potential Banner & Print Action */}
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
                Document Classification: {classification?.categoryLabel || "Empirical & Methodological Study in Supply Chain / Environmental Economics"}
              </h2>

              <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                <strong className="font-bold text-[#0F172A]">
                  {classification?.salutation ? (classification.salutation.endsWith(":") ? classification.salutation : `${classification.salutation}:`) : "Dear Author / Contributing Researcher:"}
                </strong>{" "}
                {classification?.advisoryMessage ||
                  "This manuscript is an exceptionally rigorous and methodologically sophisticated empirical investigation into e-waste import proxies, compositional divergence, and forecasting uncertainty using national customs microdata. It demonstrates profound statistical maturity and rare intellectual honesty regarding the limitations of data-scarce time series."}
              </p>

              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                {classification?.customGuidance ||
                  "Focus refinement on framing the causal-descriptive distinction of income-linked growth intensities and clarifying the out-of-sample forecasting benchmark limitations."}
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: 4 REVIEWER PERSONAS                                */}
        {/* ========================================================= */}
        {activeView === "personas" && (
          <div className="space-y-6 animate-fade-in">
            {/* Persona Switcher Buttons */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              {personas.map((p, idx) => {
                const isActive = selectedPersona === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPersona(idx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 border ${
                      isActive
                        ? "bg-[#0F172A] text-white border-[#0F172A] shadow-xs"
                        : "bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    <span>
                      {idx === 0 ? "🔬" : idx === 1 ? "🧬" : idx === 2 ? "📑" : "📊"}
                    </span>
                    <span>{p.name}</span>
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
              return (
                <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-8 space-y-6 shadow-xs">
                  {/* Persona Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-lg sm:text-xl font-serif font-bold text-[#0F172A]">
                          {active.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                          Decision: {active.decisionRecommendation}
                        </span>
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
        {activeView === "dimensions" && (
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
        {activeView === "issues" && (
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: TARGET JOURNALS                                    */}
        {/* ========================================================= */}
        {(activeView === "journals" || activeView === "recommendations") && (
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
