import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  RefreshCw,
  Plus,
  Bookmark,
  AlertTriangle,
  FileText,
  Search,
  ExternalLink,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { batchVerifyReferences } from "@/lib/crossref";
import { computeCitationIntegrity } from "@/lib/engine/citation-audit";
import { extractReferencesFromText } from "@/lib/utils";
import type { CitationIntegritySummary, FullReviewReport } from "@/lib/types";

interface DashboardCitationsSectionProps {
  citationIntegrity?: CitationIntegritySummary;
  dataCitationAudit: {
    totalCount: number;
    verifiedCount: number;
    retractedCount: number;
    notes?: string;
  };
  authors?: string[];
  effectiveReport?: FullReviewReport | null;
  onUpdateCitationIntegrity: (updatedCit: CitationIntegritySummary) => void;
  onExportBibTeX?: () => Promise<void>;
}

const REFS_PER_PAGE = 10;

export const DashboardCitationsSection: React.FC<DashboardCitationsSectionProps> = ({
  citationIntegrity,
  dataCitationAudit,
  authors,
  effectiveReport,
  onUpdateCitationIntegrity,
  onExportBibTeX,
}) => {
  const [isValidatingRefs, setIsValidatingRefs] = useState(false);
  const [validateProgress, setValidateProgress] = useState("");
  const [isAddRefsOpen, setIsAddRefsOpen] = useState(false);
  const [pastedRefsText, setPastedRefsText] = useState("");
  const [pastedRefsError, setPastedRefsError] = useState<string | null>(null);

  const [refSearchQuery, setRefSearchQuery] = useState("");
  const [refStatusFilter, setRefStatusFilter] = useState<
    "all" | "valid" | "retracted" | "unresolvable" | "unchecked"
  >("all");
  const [refPage, setRefPage] = useState(1);
  const [showAllRefs, setShowAllRefs] = useState(false);

  const references = citationIntegrity?.references || [];

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
        authors || effectiveReport?.authors
      );
      onUpdateCitationIntegrity(updatedCit);
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
        authors || effectiveReport?.authors
      );

      onUpdateCitationIntegrity(updatedCit);
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
          r.raw?.toLowerCase().includes(q) ||
          r.title?.toLowerCase().includes(q) ||
          r.doi?.toLowerCase().includes(q) ||
          r.journal?.toLowerCase().includes(q) ||
          r.authors?.some((a) => a.toLowerCase().includes(q))
      );
    }
    return list;
  }, [references, refStatusFilter, refSearchQuery]);

  const totalRefPages = Math.ceil(filteredReferences.length / REFS_PER_PAGE) || 1;
  const paginatedReferences = useMemo(() => {
    if (showAllRefs) return filteredReferences;
    const start = (refPage - 1) * REFS_PER_PAGE;
    return filteredReferences.slice(start, start + REFS_PER_PAGE);
  }, [filteredReferences, refPage, showAllRefs]);

  const totalRef = citationIntegrity?.totalReferences ?? dataCitationAudit.totalCount;
  const verifiedRef = citationIntegrity?.verifiedCount ?? dataCitationAudit.verifiedCount;
  const sampledRef = citationIntegrity?.sampledCount ?? totalRef;
  const uncheckedRef = citationIntegrity?.uncheckedCount ?? 0;
  const unresolvableRef = citationIntegrity?.unresolvableCount ?? 0;
  const retractedRef = citationIntegrity?.retractedCount ?? dataCitationAudit.retractedCount;
  const retAvailable = citationIntegrity?.retractionCheckAvailable !== false;
  const selfCitRatio = citationIntegrity?.selfCitationPercent ?? citationIntegrity?.selfCitationRatio;

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

          {references.length > 0 && onExportBibTeX && (
            <button
              type="button"
              onClick={onExportBibTeX}
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

      {/* Add / Paste References Modal */}
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

              <button
                type="button"
                disabled={isValidatingRefs || !pastedRefsText.trim()}
                onClick={() => handleLoadPastedReferences("append")}
                className="px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-btn-secondary transition cursor-pointer disabled:opacity-50"
              >
                Append to Existing ({references.length})
              </button>

              <button
                type="button"
                disabled={isValidatingRefs || !pastedRefsText.trim()}
                onClick={() => handleLoadPastedReferences("replace")}
                className="px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-btn-primary text-white transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                Replace Bibliography
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
