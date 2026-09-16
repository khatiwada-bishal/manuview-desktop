import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCode,
  FileText,
  MessageSquare,
} from "lucide-react";
import type { PriorityIssue } from "@/lib/types";

interface DashboardIssuesSectionProps {
  issues: PriorityIssue[];
}

export const DashboardIssuesSection: React.FC<DashboardIssuesSectionProps> = ({
  issues,
}) => {
  const [issueFilter, setIssueFilter] = useState<"all" | "A" | "B" | "C">("all");

  const countA = issues.filter((i) => i.priority === "A").length;
  const countB = issues.filter((i) => i.priority === "B").length;
  const countC = issues.filter((i) => i.priority === "C").length;

  const filteredIssues = issues.filter(
    (i) => issueFilter === "all" || i.priority === issueFilter
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626] dark:text-rose-400" />
            <span>Prioritized Action Plan before Submission</span>
          </h2>
          <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
            Ranked pre-submission hazards and recommended author rebuttal framing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIssueFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              issueFilter === "all"
                ? "liquid-glass-tab-active font-bold text-blue-600 dark:text-blue-400"
                : "liquid-glass-btn-secondary text-[#475569] dark:text-neutral-300"
            }`}
          >
            All Issues ({issues.length})
          </button>

          <button
            type="button"
            onClick={() => setIssueFilter("A")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              issueFilter === "A"
                ? "bg-rose-600 text-white shadow-xs border border-rose-500"
                : "liquid-glass-btn-secondary text-[#DC2626] dark:text-rose-400"
            }`}
          >
            🚨 Priority A ({countA})
          </button>

          <button
            type="button"
            onClick={() => setIssueFilter("B")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              issueFilter === "B"
                ? "bg-amber-600 text-white shadow-xs border border-amber-500"
                : "liquid-glass-btn-secondary text-[#D97706] dark:text-amber-400"
            }`}
          >
            ⚠️ Priority B ({countB})
          </button>

          <button
            type="button"
            onClick={() => setIssueFilter("C")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              issueFilter === "C"
                ? "bg-emerald-600 text-white shadow-xs border border-emerald-500"
                : "liquid-glass-btn-secondary text-[#16A34A] dark:text-emerald-400"
            }`}
          >
            💡 Priority C ({countC})
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="rounded-3xl liquid-glass-card p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#16A34A] dark:text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
              {issueFilter === "all" ? "No Priority Issues Found" : `No Priority ${issueFilter} Issues Identified`}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-neutral-400 max-w-sm mx-auto">
              {issueFilter === "A"
                ? "Zero critical desk-reject blockers identified in this category."
                : issueFilter === "B"
                ? "Zero major methodological objections flagged in this category."
                : issueFilter === "C"
                ? "Zero minor presentation or clarity refinements pending."
                : "The manuscript cleared automated peer-review integrity heuristics."}
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="rounded-3xl liquid-glass-card p-5 sm:p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                      issue.priority === "A"
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                        : issue.priority === "B"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    Priority {issue.priority}
                  </span>
                  <span className="text-xs font-bold text-[#475569] dark:text-neutral-300 uppercase tracking-wider">
                    {issue.category}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
                    {issue.id}
                  </span>
                  {issue.source && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${
                      issue.source === "crossref"
                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                        : issue.source === "llm"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                    }`}>
                      {issue.source === "crossref" ? "Registry" : issue.source === "llm" ? "AI" : "Heuristic"}
                    </span>
                  )}

                  {issue.expectedEffort && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
                      <span>Effort: {issue.expectedEffort}</span>
                    </span>
                  )}
                </div>

                <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                  {issue.priority === "A" ? "Desk-Reject Hazard" : "Reviewer Objection"}
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white mb-1">
                  {issue.title}
                </h3>
                <p className="text-xs text-[#334155] dark:text-neutral-300 leading-relaxed font-light">
                  {issue.description}
                </p>
              </div>

              {issue.impactAssessment && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-[#0F172A] dark:text-amber-200 block text-xs">
                      Editorial Risk &amp; Scholarly Consequence (Why Reviewers Object):
                    </span>
                    <p className="leading-relaxed text-amber-950/90 dark:text-amber-300/90 font-light">
                      {issue.impactAssessment}
                    </p>
                  </div>
                </div>
              )}

              {issue.evidenceAnchor && (
                <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-[#CBD5E1] dark:border-[#334155] text-xs font-mono text-[#0F172A] dark:text-neutral-200 flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 shrink-0" />
                  <span className="font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.08] text-neutral-500 dark:text-neutral-400">
                    Anchor
                  </span>
                  <span className="truncate">{issue.evidenceAnchor}</span>
                </div>
              )}

              {issue.reviewerQuote && (
                <div className="border-l-2 border-neutral-300 dark:border-[#334155] pl-3.5 py-0.5 text-xs italic text-[#0F172A] dark:text-neutral-200 font-serif">
                  &ldquo;{issue.reviewerQuote}&rdquo;
                </div>
              )}

              {issue.actionableFix && (
                <div className="p-3.5 rounded-xl bg-[#F0FDF4] dark:bg-emerald-950/30 border border-[#BBF7D0] dark:border-emerald-800/60 text-xs text-[#166534] dark:text-emerald-300 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 w-full">
                    <span className="font-bold text-[#0F172A] dark:text-white block text-xs">
                      Required Pre-Submission Operational Fix:
                    </span>
                    <div className="leading-relaxed whitespace-pre-line text-[#166534] dark:text-emerald-300 font-light">
                      {issue.actionableFix}
                    </div>
                  </div>
                </div>
              )}

              {issue.suggestedRewrite && (
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700/60 text-xs text-neutral-800 dark:text-neutral-200 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#0F172A] dark:text-neutral-100 flex items-center gap-1.5 text-xs">
                      <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      Ready-to-Use Manuscript Revision / Specification:
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">Suggested Draft</span>
                  </div>
                  <pre className="text-xs font-mono bg-black/[0.03] dark:bg-black/30 p-3 rounded-lg border border-black/5 dark:border-white/5 whitespace-pre-wrap leading-relaxed text-neutral-800 dark:text-neutral-200 overflow-x-auto">
                    {issue.suggestedRewrite}
                  </pre>
                </div>
              )}

              {issue.rebuttalStrategy && (
                <div className="p-3.5 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/30 border border-[#BFDBFE] dark:border-blue-800/60 text-xs text-[#1E40AF] dark:text-blue-300 flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-[#2563EB] dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 w-full">
                    <span className="font-bold text-[#1E3A8A] dark:text-blue-200 block text-xs">
                      Point-by-Point Author Rebuttal Framing (for Journal Response Letter):
                    </span>
                    <p className="leading-relaxed font-light whitespace-pre-line text-[#1E40AF] dark:text-blue-300">
                      {issue.rebuttalStrategy}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
