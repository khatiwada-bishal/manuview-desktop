import React from "react";
import { BookOpen, AlertTriangle, Globe } from "lucide-react";
import { DesktopJournalMatchesListView } from "@/components/DesktopJournalMatchesListView";
import type { JournalRecommendation } from "@/lib/types";
import type { MatchedJournalItem } from "@/lib/journals";

interface DashboardJournalsSectionProps {
  isDeskReject?: boolean;
  matchingJournalsData: any;
  targetJournal: string;
  displayJournals: JournalRecommendation[];
  otherJournals: MatchedJournalItem[];
  openJournalWebsite: (name: string) => void;
}

export const DashboardJournalsSection: React.FC<DashboardJournalsSectionProps> = ({
  isDeskReject,
  matchingJournalsData,
  targetJournal,
  displayJournals,
  otherJournals,
  openJournalWebsite,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
            <span>Target Journal Recommendation Tiers</span>
          </h2>
          <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
            Peer-review calibrated recommendations across Reach, Realistic, and Fallback tiers
          </p>
        </div>
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Verified authentic indexed journals
        </span>
      </div>

      {/* Scope Mismatch Warning Banner */}
      {isDeskReject && matchingJournalsData?.targetJournalEvaluation?.isDisciplinaryMismatch && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-bold text-sm text-rose-900 dark:text-rose-300">
              Critical Scope Mismatch: &ldquo;{targetJournal}&rdquo; ({matchingJournalsData.targetJournalEvaluation.journalDiscipline})
            </div>
            <p className="leading-relaxed text-rose-800 dark:text-rose-200/90">
              {matchingJournalsData.targetJournalEvaluation.mismatchWarning ||
                `The author-specified target journal "${targetJournal}" publishes in ${matchingJournalsData.targetJournalEvaluation.journalDiscipline}, while this manuscript belongs to ${matchingJournalsData.detectedDiscipline}. Submitting out of scope carries a very high probability of immediate editorial desk rejection.`}
            </p>
            <p className="text-[11px] text-rose-700 dark:text-rose-300/80 pt-1 font-medium">
              The strategic tiers below have been dynamically recalibrated to peer-reviewed venues directly within <strong>{matchingJournalsData.detectedDiscipline}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* 3 Strategic Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {displayJournals.map((j, idx) => (
          <div
            key={idx}
            className="rounded-3xl liquid-glass-card liquid-glass-card-interactive p-5 space-y-3.5 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${
                  j.tier === "Reach"
                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                    : j.tier === "Realistic"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                    : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                }`}>
                  {j.tier} Tier
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                  Fit: {j.fitScore}%
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openJournalWebsite(j.journalName)}
                  className="text-base font-bold text-[#0F172A] dark:text-white leading-snug hover:text-blue-600 dark:hover:text-blue-400 text-left cursor-pointer hover:underline"
                  title={`Visit official website for ${j.journalName}`}
                >
                  {j.journalName}
                </button>
                <button
                  type="button"
                  onClick={() => openJournalWebsite(j.journalName)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition cursor-pointer shrink-0"
                  title={`Visit official website for ${j.journalName}`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Website</span>
                </button>
              </div>
              <p className="text-xs text-[#64748B] dark:text-neutral-400">
                {(typeof j.impactFactor === "number" || (typeof j.impactFactor === "string" && j.impactFactor !== "N/A" && j.impactFactor !== "Unverified")) ? (
                  <>Impact Factor: <strong>{j.impactFactor}</strong> &bull; </>
                ) : null}
                {j.publisher}
              </p>

              <p className="text-xs text-[#334155] dark:text-neutral-300 leading-relaxed pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                {j.scopeRationale}
              </p>
            </div>

            {j.rejectionRisks && j.rejectionRisks.length > 0 && (
              <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                <span className="text-[10px] font-bold text-[#DC2626] dark:text-rose-400 uppercase tracking-wider block mb-1">
                  DESK-REJECT RISKS:
                </span>
                <ul className="space-y-1 text-xs text-[#B91C1C] dark:text-rose-300 pl-3 list-disc">
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

      {/* Qualified Field & Catalog Matches in List View (10+ journals) */}
      <DesktopJournalMatchesListView
        otherJournals={otherJournals}
        detectedDiscipline={matchingJournalsData?.detectedDiscipline}
      />
    </div>
  );
};
