"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileText,
  Sparkles,
  Info,
  Bookmark,
  Download,
  Search,
} from "lucide-react";
import { ReferenceVerification, FullReviewReport, CitationIntegritySummary } from "@/lib/types";
import { batchVerifyReferences } from "@/lib/crossref";
import { extractReferencesFromText, deduplicateReferences, detectReferenceExtractionQuality } from "@/lib/utils";
import { computeCitationIntegrity } from "@/lib/engine/citation-audit";
import { exportBibTeX } from "@/lib/export-generator";

const SAMPLE_BIBLIOGRAPHY = `1. Saunders D, et al. A DLL3-targeted antibody-drug conjugate for small cell lung cancer. Sci Transl Med. 2015. DOI: 10.1126/scitranslmed.aac9459
2. Wakefield AJ, et al. Ileal-lymphoid-nodular hyperplasia and pervasive developmental disorder in children. Lancet. 1998. DOI: 10.1016/S0140-6736(97)11096-0
3. NonExistent A, Hallucination B. Synthetic AI generated citation. J Bio. 2024. DOI: 10.1038/s41586-999-hallucinated01
4. Rudin CM, et al. Molecular subtypes of small cell lung cancer. Nat Rev Cancer. 2019. DOI: 10.1038/s41568-019-0133-9
5. Obokata H, et al. Retraction: Stimulus-triggered fate conversion of somatic cells into pluripotency. Nature. 2014. DOI: 10.1038/nature13598`;

export function DesktopReferenceView() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamProgress, setStreamProgress] = useState<{ completed: number; total: number } | null>(null);
  const [results, setResults] = useState<{
    summary: CitationIntegritySummary;
    verified: ReferenceVerification[];
    duplicateCount: number;
    rawCount: number;
    extractionWarnings: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "valid" | "retracted" | "expression_of_concern" | "unresolvable" | "unchecked">("all");

  const handleSample = () => {
    setInput(SAMPLE_BIBLIOGRAPHY);
  };

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      setError("Please paste a bibliography or reference list.");
      return;
    }

    setLoading(true);
    setError(null);
    setStreamProgress(null);

    try {
      const refList = extractReferencesFromText(input);
      if (refList.length === 0) {
        throw new Error("No references detected. Please provide references with numbers, DOIs, or author citations.");
      }

      // G5: Extraction fidelity check
      const extractionQuality = detectReferenceExtractionQuality(input, refList);

      // G4: Deduplicate references before counting & verification
      const dedupeResult = deduplicateReferences(refList);
      const uniqueRefs = dedupeResult.unique;

      // E5: Cap policy — verify up to 200 with Crossref, with honest coverage disclosure (G6)
      const MAX_CROSSREF_AUDIT = 200;
      const refsToVerify = uniqueRefs.slice(0, MAX_CROSSREF_AUDIT);

      setStreamProgress({ completed: 0, total: refsToVerify.length });

      // E3: Stream progressive results
      const verified = await batchVerifyReferences(refsToVerify, (item, completed, total) => {
        setStreamProgress({ completed, total });
      });

      // C1: Compute identical unified citation integrity summary
      const summary = computeCitationIntegrity(verified, uniqueRefs.length);

      setResults({
        summary,
        verified,
        duplicateCount: dedupeResult.duplicateCount,
        rawCount: refList.length,
        extractionWarnings: extractionQuality.warnings,
      });
    } catch (err: any) {
      setError(err.message || "Failed to audit references.");
    } finally {
      setLoading(false);
      setStreamProgress(null);
    }
  };

  const filteredVerified = React.useMemo(() => {
    if (!results) return [];
    let list = results.verified;
    if (statusFilter !== "all") {
      if (statusFilter === "retracted") {
        list = list.filter((r) => r.isRetracted || r.status === "retracted");
      } else if (statusFilter === "expression_of_concern") {
        list = list.filter((r) => r.status === "expression_of_concern");
      } else if (statusFilter === "valid") {
        list = list.filter((r) => r.status === "valid" && !r.isRetracted);
      } else {
        list = list.filter((r) => r.status === statusFilter);
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
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
  }, [results, statusFilter, searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-[#111827] dark:text-[#F8FAFC]">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Crossref Open API &amp; Retraction Watch (61k+ offline catalog)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
            Reference Integrity &amp; Retraction Hazard Audit
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
            Audit manuscript bibliographies against live scholarly registers and the exhaustive Retraction Watch index. Identify unresolvable citations, phantom DOIs, and retracted studies before peer review.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAudit} className="p-6 rounded-3xl liquid-glass-card space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Manuscript Bibliography / Citations
            </span>
            <button
              type="button"
              onClick={handleSample}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Citations</span>
            </button>
          </div>

          <textarea
            rows={6}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your manuscript reference list, bibliography, or DOIs..."
            className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs sm:text-sm focus:outline-none font-mono resize-none"
          />

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-700 dark:text-rose-300 border border-red-500/20 text-xs backdrop-blur-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* E3: Live Streaming Progress Bar */}
          {loading && streamProgress && (
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                  <span>Auditing references with Crossref &amp; Retraction Watch...</span>
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {streamProgress.completed} / {streamProgress.total} ({Math.round((streamProgress.completed / Math.max(1, streamProgress.total)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-full rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${Math.round((streamProgress.completed / Math.max(1, streamProgress.total)) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass-btn-primary disabled:opacity-50 text-white text-xs font-semibold tracking-wide transition cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Resolving DOIs...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Audit References</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Audit Results */}
        {results && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* G6: Honest Coverage Disclosure Banner */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-[#334155] flex items-start gap-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-neutral-900 dark:text-white">
                  Audit Coverage &amp; Verification Note
                </div>
                <div>{results.summary.coverageNote}</div>
                {results.duplicateCount > 0 && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    Consolidated {results.duplicateCount} duplicate reference(s) (analyzed {results.summary.totalReferences} unique entries from {results.rawCount} total citations).
                  </div>
                )}
                {results.extractionWarnings.length > 0 && (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    Extraction Warning: {results.extractionWarnings.join(" ")}
                  </div>
                )}
              </div>
            </div>

            {/* Retraction Alert Banner */}
            {results.summary.retractedCount > 0 && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-rose-950/30 border-2 border-red-300 dark:border-rose-800 flex items-start gap-3 text-red-900 dark:text-rose-200 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm">
                    {results.summary.retractedCount} Retracted Publication(s) Detected!
                  </h3>
                  <p className="text-xs text-red-700 dark:text-rose-300 mt-1">
                    Citing retracted studies is one of the most critical desk-rejection triggers in scholarly publishing. Immediately replace or remove these citations.
                  </p>
                </div>
              </div>
            )}

            {/* C1 Unified Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl liquid-glass-card">
                <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Unique Refs</div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                  {results.summary.totalReferences}
                </div>
              </div>
              <div className="p-4 rounded-2xl liquid-glass-card border border-emerald-500/20 bg-emerald-500/5">
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Verified Valid</div>
                <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">
                  {results.summary.verifiedCount}
                </div>
              </div>
              <div className="p-4 rounded-2xl liquid-glass-card border border-rose-500/20 bg-rose-500/5">
                <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase">Retracted</div>
                <div className="text-2xl font-bold text-rose-800 dark:text-rose-300 mt-1">
                  {results.summary.retractedCount}
                </div>
              </div>
              <div className="p-4 rounded-2xl liquid-glass-card border border-amber-500/20 bg-amber-500/5">
                <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase">Unresolvable (404)</div>
                <div className="text-2xl font-bold text-amber-800 dark:text-amber-300 mt-1">
                  {results.summary.unresolvableCount}
                </div>
              </div>
              <div className="p-4 rounded-2xl liquid-glass-card border border-neutral-300 dark:border-neutral-700">
                <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Unchecked</div>
                <div className="text-2xl font-bold text-neutral-700 dark:text-neutral-300 mt-1">
                  {results.summary.uncheckedCount}
                </div>
              </div>
            </div>

            {/* Recency Profile (when available) */}
            {results.summary.recencyProfile && (
              <div className="p-4 rounded-2xl liquid-glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 block">Citation Recency Profile</span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Distribution of publication dates across verified bibliography items
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold">
                    Last 5 Years: {results.summary.recencyProfile.last5YearsPercent}%
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold">
                    Older: {results.summary.recencyProfile.olderThan5YearsPercent}%
                  </span>
                </div>
              </div>
            )}

            {/* Citations Controls & Table */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Audited Reference Registry ({filteredVerified.length} of {results.summary.sampledCount})
                  </h3>
                  {/* Status filter pills */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {(
                      [
                        { id: "all", label: `All (${results.summary.sampledCount})` },
                        { id: "valid", label: `Verified (${results.summary.verifiedCount})` },
                        { id: "retracted", label: `Retracted (${results.summary.retractedCount})` },
                        { id: "expression_of_concern", label: `Concern (${results.summary.expressionOfConcernCount || 0})` },
                        { id: "unresolvable", label: `Unresolvable (${results.summary.unresolvableCount})` },
                        { id: "unchecked", label: `Unchecked (${results.summary.uncheckedCount})` },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStatusFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          statusFilter === tab.id
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.08] dark:hover:bg-white/[0.1]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search citations or DOIs..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl liquid-glass-input text-xs focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await exportBibTeX({
                        mode: "full",
                        id: "bib-export",
                        createdAt: new Date().toISOString(),
                        title: "Audited_Bibliography",
                        targetJournal: "Target Journal",
                        overallScore: 80,
                        summary: "Audited Bibliography",
                        citationIntegrity: {
                          ...results.summary,
                          references: results.verified,
                        },
                        priorityIssues: [],
                        reviewerPersonas: [],
                        journalRecommendations: [],
                        dimensions: {} as any,
                        classification: {
                          category: "academic_manuscript",
                          categoryLabel: "Academic Manuscript",
                          isAcademicManuscript: true,
                          confidence: 1,
                          detectedFeatures: [],
                          salutation: "",
                          advisoryMessage: "",
                          customGuidance: "",
                        },
                      } as FullReviewReport);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold liquid-glass-btn-secondary transition cursor-pointer shrink-0"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Export BibTeX</span>
                  </button>
                </div>
              </div>

              <div className="liquid-glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Reference / Article Title</th>
                      <th className="px-4 py-3">Journal &amp; Year</th>
                      <th className="px-4 py-3 text-right">Identifier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1F2937]">
                    {filteredVerified.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-neutral-400 text-xs">
                          No references match your current filter or search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredVerified.map((ref, idx) => (
                      <tr
                        key={idx}
                        className={
                          ref.isRetracted
                            ? "bg-rose-500/10"
                            : ref.status === "expression_of_concern"
                            ? "bg-amber-500/10"
                            : ref.status === "unresolvable"
                            ? "bg-amber-500/5"
                            : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                        }
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          {ref.isRetracted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              RETRACTED
                            </span>
                          ) : ref.status === "expression_of_concern" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              EXPRESSION OF CONCERN
                            </span>
                          ) : ref.status === "valid" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              VERIFIED
                            </span>
                          ) : ref.status === "unresolvable" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                              <Info className="w-2.5 h-2.5" />
                              UNRESOLVABLE (404)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border border-neutral-500/30">
                              <Info className="w-2.5 h-2.5" />
                              NOT CHECKED (NO DOI)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-neutral-900 dark:text-white line-clamp-2">
                            {ref.title || ref.raw}
                          </div>
                          {ref.authors && ref.authors.length > 0 && (
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                              {ref.authors.join(", ")}
                            </div>
                          )}
                          {ref.retractionDetails && (
                            <div className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold mt-1">
                              {ref.retractionDetails}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                          {ref.journal && <div className="font-medium text-neutral-800 dark:text-neutral-200">{ref.journal}</div>}
                          {ref.year && <div className="text-[11px] text-neutral-400 dark:text-neutral-500">{ref.year}</div>}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {ref.doi ? (
                            <a
                              href={`https://doi.org/${ref.doi}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono text-[11px]"
                            >
                              <span>{ref.doi}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[11px]">No DOI</span>
                          )}
                        </td>
                      </tr>
                    )))}
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
