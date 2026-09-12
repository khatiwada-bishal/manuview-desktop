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
import { findMatchingJournals, JournalEntry, JOURNAL_CATALOG, TargetJournalTierResults } from "@/lib/journals";
import JournalCombobox from "@/components/JournalCombobox";

export function DesktopJournalFitView() {
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [targetJournal, setTargetJournal] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TargetJournalTierResults | null>(null);

  const handleSample = () => {
    setTitle("Single-cell transcriptional profiling of DLL3 activation in neuroendocrine lung carcinoma");
    setAbstract(
      "Small cell lung cancer (SCLC) exhibits rapid recurrence and therapy resistance. Delta-like ligand 3 (DLL3) is an established cell-surface target for antibody-drug conjugates. Here we perform marker-based CRISPR-Cas9 screens and identify transcription factor POU2F1 as a primary driver of DLL3 expression. We demonstrate that POU2F1 directly binds the DLL3 distal enhancer element to drive chemoresistance across 8 patient-derived organoid lines."
    );
    setTargetJournal("Cancer Discovery");
  };

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !abstract.trim()) return;

    setLoading(true);
    setTimeout(() => {
      const matchResult = findMatchingJournals(title, abstract, targetJournal);
      setResults(matchResult);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-[#111827] dark:text-[#F8FAFC]">
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
        <form onSubmit={handlePredict} className="p-6 rounded-3xl liquid-glass-card space-y-4">
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
              className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs sm:text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Target Journal <span className="text-neutral-400 font-normal">(Optional anchor for Reach / Realistic / Fallback calibration)</span>
            </label>
            <JournalCombobox
              value={targetJournal}
              onChange={setTargetJournal}
              placeholder="Search or enter target journal (e.g. Cancer Discovery, TPAMI, JACS)..."
              inputClassName="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs sm:text-sm focus:outline-none h-[42px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Manuscript Abstract</label>
            <textarea
              rows={4}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Paste the manuscript abstract or key summary..."
              className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs sm:text-sm focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading || (!title.trim() && !abstract.trim())}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass-btn-primary disabled:opacity-50 text-white text-xs font-semibold tracking-wide transition cursor-pointer shadow-xs"
            >
              <Compass className="w-4 h-4" />
              <span>{loading ? "Matching against 1,300+ journals..." : "Predict Journal Fit"}</span>
            </button>
          </div>
        </form>

        {/* Prediction Results */}
        {results && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">
                  Strategic Submission Tiers
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Calibrated across Impact Factor, Acceptance Probability, and Disciplinary Scope.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 w-fit">
                Field: <strong>{results.detectedDiscipline}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Reach Target */}
              <div className="p-5 rounded-3xl liquid-glass-card border border-amber-500/20 bg-amber-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 backdrop-blur-xs">
                    <TrendingUp className="w-3 h-3" />
                    REACH TARGET
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      Fit: {results.reachFitScore}%
                    </span>
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      IF {results.reach.impactFactor}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A] dark:text-white">{results.reach.name}</h3>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{results.reach.publisher}</div>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-black/5 dark:border-white/5 text-xs text-neutral-600 dark:text-neutral-400">
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
              <div className="p-5 rounded-3xl liquid-glass-card border border-emerald-500/25 bg-emerald-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    OPTIMAL FIT (RECOMMENDED)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Fit: {results.realisticFitScore}%
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      IF {results.realistic.impactFactor}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A] dark:text-white">{results.realistic.name}</h3>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{results.realistic.publisher}</div>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-black/5 dark:border-white/5 text-xs text-neutral-600 dark:text-neutral-400">
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
              <div className="p-5 rounded-3xl liquid-glass-card border border-blue-500/20 bg-blue-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 backdrop-blur-xs">
                    <Shield className="w-3 h-3" />
                    FALLBACK / SAFETY
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                      Fit: {results.fallbackFitScore}%
                    </span>
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                      IF {results.fallback.impactFactor}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A] dark:text-white">{results.fallback.name}</h3>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{results.fallback.publisher}</div>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-black/5 dark:border-white/5 text-xs text-neutral-600 dark:text-neutral-400">
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
              <div className="liquid-glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
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
