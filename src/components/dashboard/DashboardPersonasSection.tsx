import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Users,
  AlertCircle,
  Check,
  Copy,
  GraduationCap,
  Lock,
  CheckCircle2,
  Sparkles,
  FileCode,
  FlaskConical,
  CheckSquare,
  FileText,
} from "lucide-react";
import type { ReviewerPersonaFeedback, FullReviewReport, EditorialTriageOutcome } from "@/lib/types";

interface DashboardPersonasSectionProps {
  personas: ReviewerPersonaFeedback[];
  selectedPersona: number;
  setSelectedPersona: (idx: number) => void;
  fullReport?: FullReviewReport | null;
  currentReport?: any;
  editorialTriage?: EditorialTriageOutcome;
  matchingJournalsData: any;
  targetJournal: string;
  title: string;
  copiedReportIndex: number | null;
  handleCopyRefereeReport: (p: ReviewerPersonaFeedback, idx: number) => void;
  copiedSnippetIndex: number | null;
  handleCopySnippet: (text: string, idx: number) => void;
  onSelectView: (view: any) => void;
  journalsCount: number;
}

export const DashboardPersonasSection: React.FC<DashboardPersonasSectionProps> = ({
  personas,
  selectedPersona,
  setSelectedPersona,
  fullReport,
  currentReport,
  editorialTriage,
  matchingJournalsData,
  targetJournal,
  title,
  copiedReportIndex,
  handleCopyRefereeReport,
  copiedSnippetIndex,
  handleCopySnippet,
  onSelectView,
  journalsCount,
}) => {
  const triage = fullReport?.editorialTriage || currentReport?.editorialTriage || editorialTriage;
  const isDeskReject = triage?.outcome === "desk_reject";

  if (isDeskReject && personas.length <= 1) {
    const mismatch = matchingJournalsData?.targetJournalEvaluation;
    const targetJournalDiscipline = mismatch?.journalDiscipline || "Different Academic Discipline";
    const paperDiscipline = matchingJournalsData?.detectedDiscipline || "Scholarly Research";

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2 flex-wrap">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span>Editorial Triage: Direct Desk Reject</span>
              <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                ⛔ Declined at Editorial Screening
              </span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
              Manuscript does not meet the published aims and scope of the target journal — external peer review bypassed
            </p>
          </div>
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900">
            No Referees Convened
          </span>
        </div>

        {/* Core Alert Banner */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 dark:border-rose-800/60 dark:bg-rose-950/40 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Why Was This Submission Desk-Rejected Before Peer Review?
              </h3>
              <p className="text-xs text-rose-800/90 dark:text-rose-300/90 leading-relaxed">
                In academic publishing, when a submission falls outside a journal&apos;s stated aims and scope, the handling editor declines the paper during initial screening (desk reject). Because out-of-scope papers are never assigned to external referees, peer-review simulation is bypassed to maintain academic integrity and avoid generating fabricated review reports.
              </p>
            </div>
          </div>
        </div>

        {/* Handling Editor's Triage Statement */}
        <div className="rounded-2xl liquid-glass-card p-6 space-y-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-xs">
                ED
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">
                  Handling Editor&apos;s Official Triage Statement
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Lead Editorial Office &bull; Preliminary Screening Review
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              Decision: Desk Reject
            </span>
          </div>

          <div className="text-xs leading-relaxed text-[#334155] dark:text-neutral-300 whitespace-pre-line bg-neutral-50/60 dark:bg-neutral-900/40 p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
            {triage?.summary || fullReport?.summary || `The manuscript substantive focus lies in ${paperDiscipline}, which falls outside the scope of ${targetJournal} (${targetJournalDiscipline}). The submission is declined during editorial screening.`}
          </div>
        </div>

        {/* Scope Contrast Comparison */}
        {triage?.scopeComparison ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl liquid-glass-card p-5 space-y-3 border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Target Journal Remit &amp; Scope
                </span>
                <span className="text-[11px] font-semibold text-neutral-400">Declared Target</span>
              </div>
              <div>
                <div className="text-sm font-bold text-[#0F172A] dark:text-white">
                  {triage.scopeComparison.journalName}
                </div>
                {triage.scopeComparison.journalPublisher && (
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Publisher: {triage.scopeComparison.journalPublisher}
                  </div>
                )}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-300">
                Published discipline: <strong className="text-rose-700 dark:text-rose-300 font-semibold">{triage.scopeComparison.journalDiscipline}</strong>
              </div>
              {triage.scopeComparison.journalKeyConcepts && triage.scopeComparison.journalKeyConcepts.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Key Registry Concepts</span>
                  <div className="flex flex-wrap gap-1">
                    {triage.scopeComparison.journalKeyConcepts.map((c, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100/70 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {triage.scopeComparison.journalScopeSummary && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-rose-100 dark:border-rose-900/40 pt-2">
                  {triage.scopeComparison.journalScopeSummary}
                </p>
              )}
            </div>

            <div className="rounded-2xl liquid-glass-card p-5 space-y-3 border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Manuscript Domain &amp; Subject Matter
                </span>
                <span className="text-[11px] font-semibold text-neutral-400">Detected Content</span>
              </div>
              <div>
                <div className="text-sm font-bold text-[#0F172A] dark:text-white line-clamp-1">
                  {title || "Uploaded Manuscript"}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                  Substantive field: <strong className="text-emerald-700 dark:text-emerald-300 font-semibold">{triage.scopeComparison.manuscriptDiscipline}</strong>
                </div>
              </div>
              {triage.scopeComparison.manuscriptTopics && triage.scopeComparison.manuscriptTopics.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Key Focus Areas</span>
                  <div className="flex flex-wrap gap-1">
                    {triage.scopeComparison.manuscriptTopics.map((t, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-emerald-100 dark:border-emerald-900/40 pt-2">
                Empirical findings, methodology, and theoretical contributions belong squarely to {triage.scopeComparison.manuscriptDiscipline}.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl liquid-glass-card p-5 space-y-2 border border-rose-200/60 dark:border-rose-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Target Journal Remit
                </span>
                <span className="text-[11px] font-semibold text-neutral-400">Declared Target</span>
              </div>
              <div className="text-sm font-bold text-[#0F172A] dark:text-white">
                {targetJournal}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Operates in discipline: <strong className="text-neutral-800 dark:text-neutral-200">{targetJournalDiscipline}</strong>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Articles must directly contribute to the published scope and readership of {targetJournalDiscipline}.
              </p>
            </div>

            <div className="rounded-2xl liquid-glass-card p-5 space-y-2 border border-emerald-200/60 dark:border-emerald-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Manuscript Focus
                </span>
                <span className="text-[11px] font-semibold text-neutral-400">Detected Scope</span>
              </div>
              <div className="text-sm font-bold text-[#0F172A] dark:text-white">
                {title || "Uploaded Manuscript"}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Study domain: <strong className="text-emerald-700 dark:text-emerald-300">{paperDiscipline}</strong>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Empirical findings and literature foundation belong squarely to {paperDiscipline}.
              </p>
            </div>
          </div>
        )}

        {/* Recommended Next Steps Card */}
        <div className="rounded-2xl liquid-glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/40 to-transparent dark:from-blue-950/20">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Redirect Manuscript to In-Scope Journals</span>
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-xl">
              ManuView has calibrated Reach, Realistic, and Fallback journal tiers matching your manuscript&apos;s substantive domain ({paperDiscipline}). View in-scope journals to maximize acceptance probability.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectView("journals")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition shrink-0 cursor-pointer"
          >
            <span>View Matching Journals ({journalsCount})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (personas.length === 0) {
    return (
      <div className="rounded-3xl liquid-glass-card p-6 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
        <Users className="w-5 h-5 text-neutral-400" />
        <span>
          {isDeskReject
            ? "Editorial Triage Decision: Submission is out of scope for the target journal."
            : "Expert reviewer panel simulation is enabled when live AI evaluation is connected."}
        </span>
      </div>
    );
  }

  const active = personas[selectedPersona] || personas[0];
  const isDevilsAdvocate = active?.persona === "devils_advocate" || selectedPersona === 4;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2 flex-wrap">
            <Users className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />
            <span>
              {isDeskReject && personas.length <= 1
                ? "Editorial Triage Decision"
                : isDeskReject
                ? `${personas.length}-Persona Reviewer Panel (Editorial Scope Triage)`
                : `${personas.length}-Persona Peer-Review Simulation (Adversarial Panel)`}
            </span>
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700">
              ⚖️ Simulated Panel (Synthetic)
            </span>
          </h2>
          <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
            {isDeskReject && personas.length <= 1
              ? "Handling editor desk-rejected the submission — peer reviewers were not engaged"
              : isDeskReject
              ? "Handling editor desk-reject triage with domain, methodological, statistical, and adversarial evaluations"
              : "Multi-disciplinary simulated peer review with domain-specific stress tests"}
          </p>
        </div>
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {isDeskReject && personas.length <= 1 ? "Editorial screening only" : "Independent domain evaluations"}
        </span>
      </div>

      {/* Simulated Reviewer Perspectives Recommendation Distribution */}
      {fullReport?.panelConsensus && (
        <div className="p-4 rounded-2xl liquid-glass-card shadow-2xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                Reviewer Perspectives:
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                fullReport.panelConsensus.consensusLevel === "unanimous"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                  : fullReport.panelConsensus.consensusLevel === "majority"
                  ? "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                  : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
              }`}>
                {fullReport.panelConsensus.consensusLevel.toUpperCase()} OUTLOOK
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 flex-wrap">
              {fullReport.panelConsensus.distribution.deskReject > 0 && (
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">
                  Desk Reject ×{fullReport.panelConsensus.distribution.deskReject}
                </span>
              )}
              {fullReport.panelConsensus.distribution.reject > 0 && (
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                  Reject ×{fullReport.panelConsensus.distribution.reject}
                </span>
              )}
              {fullReport.panelConsensus.distribution.majorRevision > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                  Major Rev ×{fullReport.panelConsensus.distribution.majorRevision}
                </span>
              )}
              {fullReport.panelConsensus.distribution.minorRevision > 0 && (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  Minor Rev ×{fullReport.panelConsensus.distribution.minorRevision}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {fullReport.panelConsensus.borderlineDiagnosis}
          </p>
        </div>
      )}

      {/* Partial LLM Generation Notice (P0-1) */}
      {fullReport?.missingPersonaRoles && fullReport.missingPersonaRoles.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>Partial Reviewer Generation:</strong> {personas.length} of 5 reviewer perspectives generated by the AI provider (missing: {fullReport.missingPersonaRoles.join(", ")}). Missing perspectives are not fabricated to maintain academic integrity.
          </span>
        </div>
      )}

      {/* Persona Switcher - Segmented Control Bar */}
      <div className="bg-[#F1F5F9]/90 dark:bg-[#161F30]/90 p-1.5 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
          {personas.map((p, idx) => {
            const isActive = selectedPersona === idx;
            const isDA = p.persona === "devils_advocate" || idx === 4;
            const isReject = p.decisionRecommendation?.includes("Reject");
            const isAccept = p.decisionRecommendation?.includes("Accept");
            const roleName =
              p.persona === "journal_editor" || idx === 0
                ? "Editor"
                : p.persona === "domain_expert" || idx === 1
                ? "Domain"
                : p.persona === "methods_reviewer" || idx === 2
                ? "Methods"
                : p.persona === "statistician" || idx === 3
                ? "Stats"
                : "Adversary";
            const icon =
              p.persona === "journal_editor" || idx === 0
                ? "📑"
                : p.persona === "domain_expert" || idx === 1
                ? "🧬"
                : p.persona === "methods_reviewer" || idx === 2
                ? "🔬"
                : p.persona === "statistician" || idx === 3
                ? "📊"
                : "⚡";

            const decisionBadgeColor = isReject
              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
              : isAccept
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPersona(idx)}
                className={`px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-center gap-1 relative select-none ${
                  isActive
                    ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-xs border border-black/10 dark:border-white/10 ring-1 ring-black/5"
                    : "text-[#64748B] dark:text-neutral-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full min-w-0">
                  <span className="text-xs font-bold flex items-center gap-1.5 truncate">
                    <span className="text-sm shrink-0">{icon}</span>
                    <span className="truncate">Reviewer {idx + 1}</span>
                  </span>
                  {isDA && (
                    <span className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded shrink-0 ${
                      isActive
                        ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                        : "bg-rose-100/70 text-rose-600 dark:text-rose-400"
                    }`}>
                      Stress
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1 w-full min-w-0 text-[11px]">
                  <span className={`truncate ${isActive ? "text-[#334155] dark:text-neutral-200 font-semibold" : "text-neutral-500 dark:text-neutral-400"}`}>
                    {roleName}
                  </span>
                  {p.decisionRecommendation && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 truncate max-w-[85px] ${decisionBadgeColor}`}>
                      {p.decisionRecommendation}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Persona Detail Card */}
      {active && (() => {
        const isReject = active.decisionRecommendation?.includes("Reject");
        const isAccept = active.decisionRecommendation?.includes("Accept");
        const fallbackRoleName =
          active.persona === "journal_editor"
            ? "Reviewer 1: Lead Handling Editor"
            : active.persona === "domain_expert"
            ? "Reviewer 2: Target Domain Specialist"
            : active.persona === "methods_reviewer"
            ? "Reviewer 3: Research Methodology Referee"
            : active.persona === "statistician"
            ? "Reviewer 4: Statistical & Quantitative Auditor"
            : "Reviewer 5: Adversarial Translation Referee";

        const roleDiscipline =
          active.persona === "journal_editor"
            ? "Handling Editor • Journal Scope & Fit"
            : active.persona === "domain_expert"
            ? "Domain Specialist • Theoretical Grounding"
            : active.persona === "methods_reviewer"
            ? "Methodology Referee • Experimental Rigor"
            : active.persona === "statistician"
            ? "Quantitative Auditor • Statistical Power"
            : "Adversarial Referee • Translation Stress-Test";

        return (
          <div className={`rounded-3xl liquid-glass-card p-6 sm:p-8 space-y-6 ${
            isDevilsAdvocate ? "border-rose-400/40 ring-1 ring-rose-500/20" : ""
          }`}>
            {/* Header: Badges, Title, Affiliation & Actions */}
            <div className="pb-5 border-b border-[#E2E8F0] dark:border-[#1F2937] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    Reviewer {selectedPersona + 1} &bull; {roleDiscipline}
                  </span>
                  {isDevilsAdvocate && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      ⚡ Hostile Stress-Test
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
                  {active.decisionRecommendation && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      isReject
                        ? "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                        : isAccept
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    }`}>
                      Recommendation: {active.decisionRecommendation}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopyRefereeReport(active, selectedPersona)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1E293B] border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 shadow-2xs transition cursor-pointer"
                    title="Copy full referee report in Markdown format"
                  >
                    {copiedReportIndex === selectedPersona ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-300">Report Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                        <span>Copy Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#0F172A] dark:text-white leading-snug">
                  {active.name?.startsWith("Reviewer") ? active.name : fallbackRoleName}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-[#64748B] dark:text-neutral-400 flex-wrap font-medium">
                  <span className="text-[#334155] dark:text-neutral-200 font-semibold">{active.title}</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-neutral-400" /> {active.affiliation}</span>
                  {active.expertise && (
                    <>
                      <span>&bull;</span>
                      <span className="text-[#2563EB] dark:text-blue-400">Area: {active.expertise}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Confidential Editorial Note */}
            {active.confidentialEditorNote && (
              <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] text-xs space-y-1 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-[#475569] dark:text-neutral-300 uppercase tracking-wider text-[10px]">
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Confidential Handling Editor Office Memo (Simulation):</span>
                </div>
                <p className="text-[#334155] dark:text-neutral-300 italic leading-relaxed pl-5 font-light">
                  &ldquo;{active.confidentialEditorNote}&rdquo;
                </p>
              </div>
            )}

            {/* Key Challenge / Bottleneck */}
            {active.keyChallenge && (
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-900 dark:text-rose-200 space-y-1 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-rose-800 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Primary Objection / Core Bottleneck:</span>
                </div>
                <p className="leading-relaxed pl-5 text-rose-950 dark:text-rose-100 font-medium">
                  {active.keyChallenge}
                </p>
              </div>
            )}

            {/* Detailed Peer-Review Assessment Narrative */}
            {active.assessment && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider block">
                  Detailed Peer-Review Assessment:
                </span>
                <div className="text-xs sm:text-sm text-[#334155] dark:text-neutral-300 leading-relaxed p-5 rounded-2xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] font-light whitespace-pre-line shadow-2xs">
                  {active.assessment}
                </div>
              </div>
            )}

            {/* Balanced Strengths & Critiques Grid */}
            {((active.strengths && active.strengths.length > 0) || (active.majorCritiques && active.majorCritiques.length > 0)) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Scholarly Merits & Strengths */}
                {active.strengths && active.strengths.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F0FDF4]/70 dark:bg-emerald-950/20 border border-[#BBF7D0] dark:border-emerald-800/60 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#166534] dark:text-emerald-300 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-emerald-400" />
                      <span>Scholarly Merits &amp; Strengths:</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#166534] dark:text-emerald-200">
                      {active.strengths.map((str, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">•</span>
                          <span className="leading-relaxed">{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Major Scholarly Critiques */}
                {active.majorCritiques && active.majorCritiques.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFBEB]/70 dark:bg-amber-950/20 border border-[#FDE68A] dark:border-amber-800/60 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#92400E] dark:text-amber-300 uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-[#D97706] dark:text-amber-400" />
                      <span>Major Critiques &amp; Concerns:</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#92400E] dark:text-amber-200">
                      {active.majorCritiques.map((critique, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-2">
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">[{cIdx + 1}]</span>
                          <span className="leading-relaxed">{critique}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Concrete Actionable Solutions & Example Rewrites */}
            {active.concreteSolutions && active.concreteSolutions.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
                  <span>Concrete Author Solutions &amp; Suggested Rewrites:</span>
                </div>
                <div className="space-y-3">
                  {active.concreteSolutions.map((sol, solIdx) => (
                    <div
                      key={solIdx}
                      className="p-4 rounded-2xl bg-white dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] text-xs space-y-2.5 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-[#0F172A] dark:text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] shrink-0 font-mono">
                            {solIdx + 1}
                          </span>
                          {sol.issue}
                        </span>
                        <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed pl-6 font-light">
                          {sol.proposedFix}
                        </p>
                      </div>

                      {sol.exampleRewrite && (
                        <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 text-xs space-y-1 ml-6">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                              Suggested Line-Level Text Rewrite:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopySnippet(sol.exampleRewrite!, solIdx)}
                              className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white font-medium cursor-pointer transition"
                            >
                              {copiedSnippetIndex === solIdx ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Snippet</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="font-mono text-[11px] text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap select-all">
                            {sol.exampleRewrite}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manuscript Evidence Anchors */}
            {active.evidenceAnchors && active.evidenceAnchors.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#475569] dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
                  <span>Manuscript Evidence Anchors (Grounding):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {active.evidenceAnchors.map((anchor, aIdx) => (
                    <span
                      key={aIdx}
                      className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-[#F8FAFC] dark:bg-[#161F30] border border-[#CBD5E1] dark:border-[#334155] text-[#1E293B] dark:text-neutral-200"
                    >
                      {anchor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Controls or Robustness Checks */}
            {active.missingControlsOrAnalyses && active.missingControlsOrAnalyses.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-[#0284C7] dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Missing Empirical Controls &amp; Robustness Checks:</span>
                </div>
                <div className="space-y-2">
                  {active.missingControlsOrAnalyses.map((missing, mIdx) => (
                    <div
                      key={mIdx}
                      className="p-3 rounded-xl bg-[#F0F9FF] dark:bg-sky-950/30 border border-[#BAE6FD] dark:border-sky-800/60 text-xs text-[#0369A1] dark:text-sky-300 flex items-start gap-2.5 shadow-2xs"
                    >
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-xs mt-0.5">•</span>
                      <span className="leading-relaxed">{missing}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Adversarial Defenses & Pre-emptive Arguments */}
            {active.counterArguments && active.counterArguments.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-[#7C3AED] dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Pre-emptive Rebuttal Arguments &amp; Defenses:</span>
                </div>
                <div className="space-y-2">
                  {active.counterArguments.map((arg, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-3 rounded-xl bg-[#F5F3FF] dark:bg-purple-950/30 border border-[#DDD6FE] dark:border-purple-800/50 text-xs text-[#5B21B6] dark:text-purple-300 flex items-start gap-2.5 shadow-2xs"
                    >
                      <span className="font-mono text-[#7C3AED] dark:text-purple-400 font-bold text-xs mt-0.5">[{cIdx + 1}]</span>
                      <span className="leading-relaxed">{arg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Must Address Prior to Submission */}
            {active.mustAddressItems && active.mustAddressItems.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0] dark:border-[#1F2937]">
                <div className="text-xs font-bold text-[#16A34A] dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Must-Address Items Prior to Submission:</span>
                </div>
                <div className="space-y-2">
                  {active.mustAddressItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#F0FDF4] dark:bg-emerald-950/30 border border-[#BBF7D0] dark:border-emerald-800/60 text-xs text-[#166534] dark:text-emerald-300 flex items-start gap-2.5 shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Minor Editorial Comments */}
            {active.minorComments && active.minorComments.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0] dark:border-[#1F2937]">
                <div className="text-xs font-bold text-[#64748B] dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Minor Presentation &amp; Formatting Comments:</span>
                </div>
                <div className="space-y-1.5">
                  {active.minorComments.map((mc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] text-xs text-[#475569] dark:text-neutral-300 flex items-start gap-2"
                    >
                      <span className="font-mono text-neutral-400 text-xs mt-0.5">•</span>
                      <span className="leading-relaxed">{mc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
