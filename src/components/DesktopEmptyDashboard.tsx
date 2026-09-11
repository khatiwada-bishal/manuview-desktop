"use client";

import React from "react";
import {
  Sparkles,
  Compass,
  CheckCircle2,
  ShieldCheck,
  Plus,
  FileText,
  Layers,
  ArrowRight,
  Trash2,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { PaperItem } from "./DesktopSidebar";

interface DesktopEmptyDashboardProps {
  papers: PaperItem[];
  onOpenArticle: (id: string) => void;
  onOpenService: (serviceId: string) => void;
  onDeletePaper?: (paper: PaperItem) => void;
}

export function DesktopEmptyDashboard({
  papers,
  onOpenArticle,
  onOpenService,
  onDeletePaper,
}: DesktopEmptyDashboardProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-[#111827] dark:text-[#F8FAFC]">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* HERO / WELCOME CARD */}
        <div className="relative rounded-3xl liquid-glass-card p-6 sm:p-8 space-y-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pre-Submission Manuscript Intelligence</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                Welcome to ManuView Desktop
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Run pre-submission diagnostics, multi-reviewer simulations, reference audits, and journal fit matching completely locally on your machine.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenService("triage")}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Review Scan</span>
            </button>
          </div>

          <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-wrap items-center gap-3.5 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              100% Local &amp; Private Storage
            </span>
            <span>&bull;</span>
            <span>All reports saved on your computer</span>
            <span>&bull;</span>
            <span>Fast Native Performance</span>
          </div>
        </div>

        {/* SAVED MANUSCRIPTS SECTION (if any exist) */}
        {papers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Your Manuscripts ({papers.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {papers.map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => onOpenArticle(paper.id)}
                  className="group relative rounded-2xl liquid-glass-card liquid-glass-card-interactive p-4 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-[#111827] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                          {paper.title || paper.shortName}
                        </h3>
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                          {paper.journal}
                        </p>
                      </div>
                    </div>
                    {onDeletePaper && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePaper(paper);
                        }}
                        title="Delete manuscript"
                        className="p-1 rounded-md text-neutral-300 dark:text-neutral-600 hover:text-rose-600 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-[11px]">
                    <span className="font-semibold text-neutral-600 dark:text-neutral-400">
                      {paper.isEligibleForReview === false
                        ? paper.ineligibilityReason === "already_published"
                          ? "Status: Already Published"
                          : "Status: Review Ineligible"
                        : `Triage Readiness: ${paper.score ?? 0}%`}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUICK SERVICES */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-1">
            Research &amp; Diagnostic Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* 1. Journal Fit Predictor */}
            <div
              onClick={() => onOpenService("journal-fit")}
              className="rounded-2xl liquid-glass-card liquid-glass-card-interactive p-5 transition cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  1,300+ Catalogs
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#111827] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                  Journal Fit Predictor
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  Match title and abstract against high-impact journals, acceptance odds, and editorial scopes.
                </p>
              </div>
            </div>

            {/* 2. Reference Integrity Audit */}
            <div
              onClick={() => onOpenService("reference-checker")}
              className="rounded-2xl liquid-glass-card liquid-glass-card-interactive p-5 transition cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                  CrossRef &amp; Retractions
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#111827] dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                  Reference Integrity Audit
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  Audit bibliography DOIs in real-time, detect retracted citations, and verify bibliographic accuracy.
                </p>
              </div>
            </div>

            {/* 3. Citation Claim Validator */}
            <div
              onClick={() => onOpenService("citation-claim")}
              className="rounded-2xl liquid-glass-card liquid-glass-card-interactive p-5 transition cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  Evidence Alignment
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#111827] dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  Citation Claim Validator
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  Verify empirical assertions against cited literature to protect against misleading overgeneralization.
                </p>
              </div>
            </div>

            {/* 4. PRISMA Flow Diagram */}
            <div
              onClick={() => onOpenService("prisma")}
              className="rounded-2xl liquid-glass-card liquid-glass-card-interactive p-5 transition cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  Systematic Review
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#111827] dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                  PRISMA Flow Diagram
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  Interactive PRISMA 2020 flow generator for systematic reviews and meta-analyses with SVG export.
                </p>
              </div>
            </div>

            {/* 5. Journal Cover Letter */}
            <div
              onClick={() => onOpenService("cover-letter")}
              className="rounded-2xl liquid-glass-card liquid-glass-card-interactive p-5 transition cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                  Editor Submission
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#111827] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                  Journal Cover Letter
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  Draft calibrated, formal submission letters to journal editors highlighting novelty and ethical compliance.
                </p>
              </div>
            </div>

            {/* 6. Review Response Builder */}
            <div
              onClick={() => onOpenService("response-builder")}
              className="rounded-2xl liquid-glass-card liquid-glass-card-interactive p-5 transition cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                  Rebuttal Matrix
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#111827] dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">
                  Review Response Builder
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  Structure point-by-point rebuttal matrices and author response letters addressing referee critiques.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FULL DETAILED AI DISCLAIMER & SCHOLARLY USAGE SECTION */}
        <div className="rounded-2xl liquid-glass-card p-6 border border-black/[0.06] dark:border-white/[0.08] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                  AI Advisory &amp; Publication Disclaimer
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Scholarly Decision-Support System &bull; Guidelines for Responsible Academic Use
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-full font-medium bg-neutral-100 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300 border border-black/[0.05] dark:border-white/[0.08]">
                Adheres to COPE &amp; ICMJE Standards
              </span>
              <span className="px-2.5 py-1 rounded-full font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                100% Local &amp; Private
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Disclaimer Point 1 */}
            <div className="p-4 rounded-xl bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border border-amber-500/15 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <h4>Use AI with Caution</h4>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-[11px]">
                Generative AI models can produce hallucinations, factual inaccuracies, or imprecise critique points. Authors and researchers must exercise independent scholarly judgment and independently verify all cited literature, methodological critiques, and statistical bounds before acting upon diagnostic feedback.
              </p>
            </div>

            {/* Disclaimer Point 2 */}
            <div className="p-4 rounded-xl bg-blue-500/[0.04] dark:bg-blue-500/[0.06] border border-blue-500/15 space-y-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <h4>Supporting Purpose Only</h4>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-[11px]">
                ManuView is an assistive pre-submission diagnostic simulation platform designed to aid editorial triage preparation. It is not an automated co-author, does not substitute for domain expertise, and cannot replace formal institutional review, ethical approvals, or human peer review.
              </p>
            </div>

            {/* Disclaimer Point 3 */}
            <div className="p-4 rounded-xl bg-rose-500/[0.04] dark:bg-rose-500/[0.06] border border-rose-500/15 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <h4>No Acceptance Guarantee</h4>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-[11px]">
                No diagnostic platform or algorithmic review can guarantee manuscript acceptance, favorable peer review outcomes, or publication in any academic journal. Editorial decisions remain solely within the exclusive authority of journal editors and external peer reviewers.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-[11px] text-neutral-400 dark:text-neutral-500">
            <span>
              All evaluations are processed locally on your hardware. Your unpublished manuscripts and research findings are never uploaded or retained by external servers.
            </span>
            <span className="font-medium text-neutral-500 dark:text-neutral-400">
              ManuView Scholarly Integrity
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
