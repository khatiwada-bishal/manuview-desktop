"use client";

import React from "react";
import {
  Sparkles,
  Compass,
  CheckCircle2,
  ShieldCheck,
  Plus,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  Trash2,
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
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA] p-6 sm:p-10 text-[#111827]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HERO SECTION */}
        <div className="rounded-3xl bg-white border border-[#E5E7EB] p-8 shadow-xs space-y-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Pre-Submission Manuscript Diagnostic Suite</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
                Welcome to ManuView Desktop
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-xl">
                Run pre-submission peer review simulations, benchmark against 1,300+ journal scopes, and validate citation integrity before formal submission.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenService("ai-review")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F172A] hover:bg-neutral-800 transition shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Review Scan</span>
            </button>
          </div>

          <div className="pt-2 border-t border-[#F3F4F6] flex flex-wrap items-center gap-4 text-[11px] text-neutral-400">
            <span className="flex items-center gap-1.5">
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Your Manuscripts ({papers.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {papers.map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => onOpenArticle(paper.id)}
                  className="group relative rounded-2xl bg-white border border-[#E5E7EB] hover:border-blue-300 p-4 shadow-2xs hover:shadow-sm transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-[#111827] group-hover:text-blue-600 transition truncate">
                          {paper.title || paper.shortName}
                        </h3>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
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
                        className="p-1 rounded-md text-neutral-300 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-100 text-[11px]">
                    <span className="font-semibold text-neutral-600">
                      Triage Readiness: {paper.score}%
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform">
                      Open <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUICK SERVICES */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 px-1">
            Research &amp; Diagnostic Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Pre-Submission AI Review */}
            <div
              onClick={() => onOpenService("ai-review")}
              className="rounded-2xl bg-white border border-[#E5E7EB] hover:border-blue-300 p-5 shadow-2xs hover:shadow-sm transition cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Full Pipeline
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#111827] group-hover:text-blue-600 transition">
                  Pre-Submission AI Review
                </h3>
                <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                  4-persona reviewer simulation (Methods, Stats, Skeptic, Desk Rejector) with causal overclaim screening.
                </p>
              </div>
            </div>

            {/* 2. Journal Fit */}
            <div
              onClick={() => onOpenService("journal-fit")}
              className="rounded-2xl bg-white border border-[#E5E7EB] hover:border-emerald-300 p-5 shadow-2xs hover:shadow-sm transition cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  1,300+ Catalogs
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#111827] group-hover:text-emerald-600 transition">
                  Journal Fit Predictor
                </h3>
                <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                  Match title and abstract against high-impact journals, acceptance odds, and editorial scopes.
                </p>
              </div>
            </div>

            {/* 3. Reference Checker */}
            <div
              onClick={() => onOpenService("reference-checker")}
              className="rounded-2xl bg-white border border-[#E5E7EB] hover:border-teal-300 p-5 shadow-2xs hover:shadow-sm transition cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  CrossRef &amp; Retractions
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#111827] group-hover:text-teal-600 transition">
                  Reference Integrity Audit
                </h3>
                <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                  Audit bibliography DOIs in real-time, detect retracted citations, and verify bibliographic accuracy.
                </p>
              </div>
            </div>

            {/* 4. Citation Claim Validator */}
            <div
              onClick={() => onOpenService("citation-claim")}
              className="rounded-2xl bg-white border border-[#E5E7EB] hover:border-amber-300 p-5 shadow-2xs hover:shadow-sm transition cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Evidence Alignment
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#111827] group-hover:text-amber-600 transition">
                  Citation Claim Validator
                </h3>
                <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                  Verify empirical assertions against cited literature to protect against misleading overgeneralization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
