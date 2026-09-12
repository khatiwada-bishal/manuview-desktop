"use client";

import React, { useState } from "react";
import { ExternalLink, Search, BookOpen, Sparkles, Filter } from "lucide-react";
import { JournalEntry, MatchedJournalItem } from "@/lib/journals";

export interface DesktopJournalMatchesListViewProps {
  otherJournals: MatchedJournalItem[];
  detectedDiscipline?: string;
  className?: string;
}

export function DesktopJournalMatchesListView({
  otherJournals,
  detectedDiscipline,
  className = "",
}: DesktopJournalMatchesListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAccess, setFilterAccess] = useState<string>("all");

  const filtered = otherJournals.filter((item) => {
    const j = item.journal;
    const matchesSearch =
      searchQuery === "" ||
      j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.aimsAndScope && j.aimsAndScope.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAccess =
      filterAccess === "all" ||
      (filterAccess === "gold" && j.openAccess === "Gold OA") ||
      (filterAccess === "hybrid" && j.openAccess === "Hybrid") ||
      (filterAccess === "subscription" && j.openAccess === "Subscription");

    return matchesSearch && matchesAccess;
  });

  if (!otherJournals || otherJournals.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-3xl liquid-glass-card overflow-hidden transition shadow-2xs ${className}`}
    >
      {/* Header bar */}
      <div className="p-5 sm:p-6 border-b border-[#E2E8F0] dark:border-[#1F2937] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-black/[0.01] dark:bg-white/[0.02]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-[#2563EB] dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white">
              Qualified Field &amp; Disciplinary Catalog Matches
            </h3>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {otherJournals.length} Alternative Venues
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-1.5 leading-relaxed">
            Peer-reviewed target journals calibrated against manuscript scope, methodological rigor, and citation benchmarks.
            Displaying qualified alternatives beyond the primary Reach, Realistic, and Fallback tiers.
          </p>
        </div>

        {/* Filter / Search Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {detectedDiscipline && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] text-neutral-700 dark:text-neutral-300 shadow-2xs">
              <span className="text-neutral-400 text-[10px] uppercase tracking-wider">Field:</span>
              <span className="text-[#2563EB] dark:text-blue-400 font-bold">{detectedDiscipline}</span>
            </span>
          )}

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter journals..."
              className="pl-8 pr-3 py-1 text-xs rounded-xl bg-white dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-44 transition"
            />
          </div>

          {/* Access Filter */}
          <select
            value={filterAccess}
            onChange={(e) => setFilterAccess(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-xl bg-white dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Access</option>
            <option value="gold">Gold OA</option>
            <option value="hybrid">Hybrid</option>
            <option value="subscription">Subscription</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] dark:border-[#1F2937] bg-black/[0.02] dark:bg-white/[0.02] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              <th className="py-3 px-3.5 w-10 text-center">#</th>
              <th className="py-3 px-4 min-w-[200px]">Journal &amp; Publisher</th>
              <th className="py-3 px-3 min-w-[130px]">Discipline</th>
              <th className="py-3 px-3 text-center min-w-[90px]">Impact Factor</th>
              <th className="py-3 px-3 text-center min-w-[90px]">Acceptance</th>
              <th className="py-3 px-3 text-center min-w-[120px]">Review Speed</th>
              <th className="py-3 px-3 text-center min-w-[90px]">Access</th>
              <th className="py-3 px-4 min-w-[240px]">Aims &amp; Scope Highlights</th>
              <th className="py-3 px-4 text-right min-w-[90px]">Venue Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-[#1F2937]/70">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
                  No journals match your search filter &ldquo;{searchQuery}&rdquo;.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => {
                const j = item.journal;
                const score = item.matchScore ?? 85;

                return (
                  <tr
                    key={j.name || idx}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors group"
                  >
                    <td className="py-3.5 px-3.5 text-center font-mono text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0F172A] dark:text-white flex items-center gap-1.5 flex-wrap">
                        <span className="group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors">
                          {j.name}
                        </span>
                        {j.isCrossDisciplinary && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Cross-Field
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {j.publisher}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700/80">
                        {j.discipline}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className="font-mono font-bold text-xs text-[#0F172A] dark:text-white">
                        {typeof j.impactFactor === "number" ? j.impactFactor.toFixed(1) : "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className="font-mono text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                        {j.acceptanceRate || "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {j.reviewSpeed || "—"}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          j.openAccess === "Gold OA"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                            : j.openAccess === "Hybrid"
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                            : "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
                        }`}
                      >
                        {j.openAccess}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-neutral-600 dark:text-neutral-300 max-w-sm leading-relaxed" title={j.aimsAndScope}>
                      <p className="line-clamp-2">
                        {j.aimsAndScope || (j.keyExpectations && j.keyExpectations.length > 0 ? j.keyExpectations.join("; ") : "Peer-reviewed venue")}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <a
                        href={`https://scholar.google.com/scholar?q=${encodeURIComponent(j.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#2563EB] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 transition cursor-pointer"
                        title={`Search ${j.name} on Google Scholar`}
                      >
                        <span>Explore</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count banner */}
      <div className="p-3 bg-black/[0.01] dark:bg-white/[0.01] border-t border-[#E2E8F0] dark:border-[#1F2937] text-[11px] text-[#64748B] dark:text-neutral-400 flex items-center justify-between px-5">
        <span>
          Showing {filtered.length} of {otherJournals.length} qualified journals
        </span>
        <span className="text-[10px] text-neutral-400">
          Click &ldquo;Explore&rdquo; to review recent publications and citation velocity on Google Scholar
        </span>
      </div>
    </div>
  );
}

export default DesktopJournalMatchesListView;
