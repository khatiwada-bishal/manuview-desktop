import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  BookOpen,
  History,
  Target,
  Filter,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import type { CandidateBlindspotPaper, CitationBlindspotsReport } from "@/lib/types";

interface CitationBlindspotsSectionProps {
  blindspots?: CitationBlindspotsReport;
  onAddReference?: (paper: CandidateBlindspotPaper) => void;
}

export const CitationBlindspotsSection: React.FC<CitationBlindspotsSectionProps> = ({
  blindspots,
  onAddReference,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "seminal" | "recent_landmark" | "methodological_peer"
  >("all");
  const [copiedDoi, setCopiedDoi] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<"bibtex" | "text" | null>(null);

  const candidates = blindspots?.candidatesFound || [];

  const filteredCandidates = useMemo(() => {
    if (selectedCategory === "all") return candidates;
    return candidates.filter((c) => c.category === selectedCategory);
  }, [candidates, selectedCategory]);

  const counts = useMemo(() => {
    return {
      all: candidates.length,
      seminal: candidates.filter((c) => c.category === "seminal").length,
      recent_landmark: candidates.filter((c) => c.category === "recent_landmark").length,
      methodological_peer: candidates.filter((c) => c.category === "methodological_peer").length,
    };
  }, [candidates]);

  const handleCopyText = (paper: CandidateBlindspotPaper) => {
    const authorStr = paper.authors.slice(0, 3).join(", ") + (paper.authors.length > 3 ? " et al." : "");
    const text = `${authorStr} (${paper.year}). ${paper.title}. ${paper.journal}. https://doi.org/${paper.doi}`;
    navigator.clipboard.writeText(text);
    setCopiedDoi(paper.doi);
    setCopiedFormat("text");
    setTimeout(() => {
      setCopiedDoi(null);
      setCopiedFormat(null);
    }, 2000);
  };

  const handleCopyBibTeX = (paper: CandidateBlindspotPaper) => {
    const firstAuthor = (paper.authors[0] || "Author").split(" ").pop()?.toLowerCase() || "author";
    const citeKey = `${firstAuthor}${paper.year || "2024"}${paper.title.split(" ")[0]?.toLowerCase() || "paper"}`;
    const bib = `@article{${citeKey},
  title = {${paper.title}},
  author = {${paper.authors.join(" and ")}},
  journal = {${paper.journal}},
  year = {${paper.year}},
  doi = {${paper.doi}}
}`;
    navigator.clipboard.writeText(bib);
    setCopiedDoi(paper.doi);
    setCopiedFormat("bibtex");
    setTimeout(() => {
      setCopiedDoi(null);
      setCopiedFormat(null);
    }, 2000);
  };

  if (!blindspots || candidates.length === 0) {
    return (
      <div className="rounded-3xl p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Citation Blindspot & Co-Citation Radar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automated literature discovery via OpenAlex graph analysis
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
          <span>
            {blindspots?.analyzedSeedCount
              ? `Audited ${blindspots.analyzedSeedCount} verified references. No critical high-centrality blindspots detected in the co-citation neighborhood.`
              : "Co-citation graph analysis will run automatically once verified DOIs are resolved in the bibliography."}
          </span>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Well-Referenced Baseline
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-6 bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Citation Blindspots & Omitted Literature
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {candidates.length} Detected Literature Gaps
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              High-centrality papers co-cited across your bibliography that are currently missing from the manuscript.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
              selectedCategory === "all"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("seminal")}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "seminal"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Seminal ({counts.seminal})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("recent_landmark")}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "recent_landmark"
                ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Recent ({counts.recent_landmark})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("methodological_peer")}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "methodological_peer"
                ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Methodological ({counts.methodological_peer})</span>
          </button>
        </div>
      </div>

      {/* Candidate List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCandidates.map((paper) => {
          const isHighRisk = paper.citationCount >= 250 || paper.coCitationScore >= 3;
          const isCopiedBib = copiedDoi === paper.doi && copiedFormat === "bibtex";
          const isCopiedText = copiedDoi === paper.doi && copiedFormat === "text";

          return (
            <div
              key={paper.doi}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between bg-white/90 dark:bg-slate-800/80 ${
                isHighRisk
                  ? "border-amber-500/40 shadow-xs hover:border-amber-500/70"
                  : "border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <div>
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {paper.category === "seminal" && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                        Seminal Foundation
                      </span>
                    )}
                    {paper.category === "recent_landmark" && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        Recent Landmark
                      </span>
                    )}
                    {paper.category === "methodological_peer" && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                        Methodological Peer
                      </span>
                    )}

                    {isHighRisk && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>High Reviewer Trap Risk</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {paper.year}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                  {paper.title}
                </h4>

                {/* Authors & Journal */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  {paper.authors.slice(0, 3).join(", ")}
                  {paper.authors.length > 3 ? " et al." : ""} •{" "}
                  <span className="italic">{paper.journal}</span>
                </p>

                {/* Relevance reason */}
                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Relevance: </span>
                  {paper.relevanceReason}
                </div>
              </div>

              {/* Bottom Meta & Actions */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {paper.citationCount.toLocaleString()}
                  </span>{" "}
                  cites
                  <span>•</span>
                  <span>Co-cited by {paper.coCitationScore}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyBibTeX(paper)}
                    title="Copy BibTeX entry"
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1"
                  >
                    {isCopiedBib ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopiedBib ? "Copied" : "BibTeX"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyText(paper)}
                    title="Copy APA Citation"
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1"
                  >
                    {isCopiedText ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopiedText ? "Copied" : "Cite"}</span>
                  </button>

                  {paper.doi && (
                    <a
                      href={paper.doi.startsWith("http") ? paper.doi : `https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open paper link"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
