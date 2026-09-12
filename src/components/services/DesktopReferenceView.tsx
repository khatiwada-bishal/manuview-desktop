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
} from "lucide-react";
import { ReferenceVerification, FullReviewReport } from "@/lib/types";
import { batchVerifyReferences } from "@/lib/crossref";
import { extractReferencesFromText } from "@/lib/utils";
import { exportBibTeX } from "@/lib/export-generator";

const SAMPLE_BIBLIOGRAPHY = `1. Saunders D, et al. A DLL3-targeted antibody-drug conjugate for small cell lung cancer. Sci Transl Med. 2015. DOI: 10.1126/scitranslmed.aac9459
2. Wakefield AJ, et al. Ileal-lymphoid-nodular hyperplasia and pervasive developmental disorder in children. Lancet. 1998. DOI: 10.1016/S0140-6736(97)11096-0
3. NonExistent A, Hallucination B. Synthetic AI generated citation. J Bio. 2024. DOI: 10.1038/s41586-999-hallucinated01
4. Rudin CM, et al. Molecular subtypes of small cell lung cancer. Nat Rev Cancer. 2019. DOI: 10.1038/s41568-019-0133-9`;

export function DesktopReferenceView() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    retractedCount: number;
    unresolvableCount: number;
    verified: ReferenceVerification[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    try {
      const refList = extractReferencesFromText(input);
      if (refList.length === 0) {
        throw new Error("No references detected. Please provide numbered or DOI citations.");
      }

      const verified = await batchVerifyReferences(refList.slice(0, 30));
      const retractedCount = verified.filter((v) => v.isRetracted).length;
      const unresolvableCount = verified.filter((v) => v.status === "unresolvable").length;

      setResults({
        total: verified.length,
        retractedCount,
        unresolvableCount,
        verified,
      });
    } catch (err: any) {
      setError(err.message || "Failed to audit references.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-[#111827] dark:text-[#F8FAFC]">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Crossref Open API &amp; Retraction Watch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
            Reference Integrity &amp; Retraction Hazard Audit
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
            Audit manuscript bibliographies against live scholarly registers. Identify unresolvable citations, phantom DOIs, and retracted studies before peer review.
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

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass-btn-primary disabled:opacity-50 text-white text-xs font-semibold tracking-wide transition cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Resolving DOIs with Crossref...</span>
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
            {/* Retraction Alert Banner */}
            {results.retractedCount > 0 && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-rose-950/30 border-2 border-red-300 dark:border-rose-800 flex items-start gap-3 text-red-900 dark:text-rose-200 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm">
                    {results.retractedCount} Retracted Publication(s) Detected!
                  </h3>
                  <p className="text-xs text-red-700 dark:text-rose-300 mt-1">
                    Citing retracted studies is one of the most critical desk-rejection triggers in scholarly publishing. Immediately replace or remove these citations.
                  </p>
                </div>
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl liquid-glass-card">
                <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Total Audited</div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{results.total}</div>
              </div>
              <div className="p-4 rounded-2xl liquid-glass-card border border-emerald-500/20 bg-emerald-500/5">
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Verified Valid</div>
                <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">
                  {results.total - results.unresolvableCount - results.retractedCount}
                </div>
              </div>
              <div className="p-4 rounded-2xl liquid-glass-card border border-amber-500/20 bg-amber-500/5">
                <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase">Unresolvable</div>
                <div className="text-2xl font-bold text-amber-800 dark:text-amber-300 mt-1">{results.unresolvableCount}</div>
              </div>
              <div className="p-4 rounded-2xl liquid-glass-card border border-rose-500/20 bg-rose-500/5">
                <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase">Retracted</div>
                <div className="text-2xl font-bold text-rose-800 dark:text-rose-300 mt-1">{results.retractedCount}</div>
              </div>
            </div>

            {/* Citations Table */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Audited Reference Registry
                </h3>
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
                        totalReferences: results.total,
                        sampledCount: results.total,
                        checkedCount: results.verified.length,
                        coverageNote: "Live Crossref verification",
                        verifiedCount: results.verified.filter((v) => v.status === "valid").length,
                        unresolvableCount: results.unresolvableCount,
                        uncheckedCount: 0,
                        retractedCount: results.retractedCount,
                        retractionCheckAvailable: true,
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold liquid-glass-btn-secondary transition cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Export BibTeX (.bib)</span>
                </button>
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
                    {results.verified.map((ref, idx) => (
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
