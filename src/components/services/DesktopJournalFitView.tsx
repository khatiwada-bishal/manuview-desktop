"use client";

import React, { useState } from "react";
import {
  Compass,
  Sparkles,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Shield,
  Clock,
  Award,
} from "lucide-react";
import { findMatchingJournals, JournalEntry, JOURNAL_CATALOG } from "@/lib/journals";

export function DesktopJournalFitView() {
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    reach: JournalEntry;
    realistic: JournalEntry;
    fallback: JournalEntry;
    allMatches: { journal: JournalEntry; matchScore: number }[];
  } | null>(null);

  const handleSample = () => {
    setTitle("Single-cell transcriptional profiling of DLL3 activation in neuroendocrine lung carcinoma");
    setAbstract(
      "Small cell lung cancer (SCLC) exhibits rapid recurrence and therapy resistance. Delta-like ligand 3 (DLL3) is an established cell-surface target for antibody-drug conjugates. Here we perform marker-based CRISPR-Cas9 screens and identify transcription factor POU2F1 as a primary driver of DLL3 expression. We demonstrate that POU2F1 directly binds the DLL3 distal enhancer element to drive chemoresistance across 8 patient-derived organoid lines."
    );
  };

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !abstract.trim()) return;

    setLoading(true);
    setTimeout(() => {
      const matchResult = findMatchingJournals(title, abstract);
      setResults(matchResult);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#080B11] p-6 sm:p-10 text-[#111827] dark:text-[#F8FAFC]">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
            <Compass className="w-3.5 h-3.5" />
            <span>1,300+ Journal Catalog Matcher</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
            Journal Fit Predictor &amp; Submission Strategy
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
            Evaluate your manuscript abstract against indexed academic journals to discover Reach, Realistic, and Fallback publication targets with calculated acceptance likelihood.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handlePredict} className="p-6 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Manuscript Details
            </span>
            <button
              type="button"
              onClick={handleSample}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Preprint</span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Manuscript Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Single-cell transcriptional profiling of DLL3 activation..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white dark:bg-[#1E293B] dark:border-[#334155] dark:text-white dark:placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Manuscript Abstract</label>
            <textarea
              rows={4}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Paste the manuscript abstract or key summary..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white dark:bg-[#1E293B] dark:border-[#334155] dark:text-white dark:placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading || (!title.trim() && !abstract.trim())}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold tracking-wide transition cursor-pointer shadow-xs"
            >
              <Compass className="w-4 h-4" />
              <span>{loading ? "Matching against 1,300+ journals..." : "Predict Journal Fit"}</span>
            </button>
          </div>
        </form>

        {/* Prediction Results */}
        {results && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">
                Strategic Submission Tiers
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Calibrated across Impact Factor, Acceptance Probability, and Scope Overlap.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Reach Target */}
              <div className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                    <TrendingUp className="w-3 h-3" />
                    REACH TARGET
                  </span>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    IF {results.reach.impactFactor}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A] dark:text-white">{results.reach.name}</h3>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{results.reach.publisher}</div>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-amber-200/60 dark:border-amber-800/40 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex justify-between">
                    <span>Acceptance Rate:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{results.reach.acceptanceRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Turnaround:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{results.reach.reviewSpeed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Access Model:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{results.reach.openAccess}</span>
                  </div>
                </div>
              </div>

              {/* Realistic Target */}
              <div className="p-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/60 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    OPTIMAL FIT (RECOMMENDED)
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    IF {results.realistic.impactFactor}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A] dark:text-white">{results.realistic.name}</h3>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{results.realistic.publisher}</div>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex justify-between">
                    <span>Acceptance Rate:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{results.realistic.acceptanceRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Turnaround:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{results.realistic.reviewSpeed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Access Model:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{results.realistic.openAccess}</span>
                  </div>
                </div>
              </div>

              {/* Fallback Target */}
              <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                    <Shield className="w-3 h-3" />
                    FALLBACK / SAFETY
                  </span>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                    IF {results.fallback.impactFactor}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A] dark:text-white">{results.fallback.name}</h3>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{results.fallback.publisher}</div>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-blue-200/60 dark:border-blue-800/40 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex justify-between">
                    <span>Acceptance Rate:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{results.fallback.acceptanceRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Turnaround:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{results.fallback.reviewSpeed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Access Model:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{results.fallback.openAccess}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Matches Table */}
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                All Qualified Catalog Matches ({results.allMatches.length})
              </h3>
              <div className="border border-[#E5E7EB] dark:border-[#1F2937] rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F9FAFB] dark:bg-[#161F30] border-b border-[#E5E7EB] dark:border-[#1F2937] text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Journal &amp; Publisher</th>
                      <th className="px-4 py-3">Fit Score</th>
                      <th className="px-4 py-3">Impact Factor</th>
                      <th className="px-4 py-3">Acceptance</th>
                      <th className="px-4 py-3">Turnaround</th>
                      <th className="px-4 py-3 text-right">Venue Search</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1F2937]">
                    {results.allMatches.slice(0, 10).map((match, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/70 dark:hover:bg-[#161F30] transition">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-neutral-900 dark:text-white">{match.journal.name}</div>
                          <div className="text-[11px] text-neutral-400 dark:text-neutral-500">{match.journal.publisher}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 text-[11px]">
                            {match.matchScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-neutral-800 dark:text-neutral-200">
                          {match.journal.impactFactor}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                          {match.journal.acceptanceRate}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                          {match.journal.reviewSpeed}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(match.journal.name + " journal")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            <span>Scope</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
