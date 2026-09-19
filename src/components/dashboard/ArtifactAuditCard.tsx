import React, { useState } from "react";
import {
  Code2,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  FileCode,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  Copy,
  Check,
  Terminal,
  FileText,
} from "lucide-react";
import type { ArtifactAuditReport, RepositoryAuditResult } from "@/lib/types";

interface ArtifactAuditCardProps {
  artifactAudit?: ArtifactAuditReport;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const ArtifactAuditCard: React.FC<ArtifactAuditCardProps> = ({
  artifactAudit,
  isExpanded = true,
  onToggle,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!artifactAudit) return null;

  const {
    detectedLinks = [],
    repoAudits = [],
    hasReasonableRequestWarning,
    overallReproducibilityRisk,
    summary,
  } = artifactAudit;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "github":
        return <Code2 className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />;
      case "zenodo":
      case "osf":
      case "figshare":
        return <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <FileCode className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
    }
  };

  const accessibleCount = repoAudits.filter((r) => r.isAccessible).length;
  const highRiskCount = repoAudits.filter((r) => r.deskRejectionRisk === "high").length;

  return (
    <div className="rounded-3xl liquid-glass-card border border-black/[0.08] dark:border-white/[0.1] overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition select-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              overallReproducibilityRisk === "high"
                ? "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                : overallReproducibilityRisk === "low"
                ? "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                : "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                Code, Data &amp; Artifact Reproducibility Auditor
              </h2>
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                FAIR Principles
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-0.5">
              Live repository accessibility, open licensing, environment manifest checks, and data availability audit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <div className="flex items-center gap-2 text-xs font-medium bg-neutral-50 dark:bg-[#161F30] px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700">
            {detectedLinks.length > 0 ? (
              <>
                <span className="text-neutral-700 dark:text-neutral-300 font-semibold">
                  {detectedLinks.length} Deposited {detectedLinks.length === 1 ? "Link" : "Links"}
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <span
                  className={
                    accessibleCount === detectedLinks.length
                      ? "text-emerald-700 dark:text-emerald-400 font-bold"
                      : "text-amber-700 dark:text-amber-400 font-bold"
                  }
                >
                  {accessibleCount}/{detectedLinks.length} Live
                </span>
              </>
            ) : (
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                No Artifact Links
              </span>
            )}
            {hasReasonableRequestWarning && (
              <>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <span className="text-rose-700 dark:text-rose-400 font-bold">
                  Upon-Request Risk
                </span>
              </>
            )}
          </div>
          {onToggle && (
            <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-[#1E293B] flex items-center justify-center text-neutral-500 dark:text-neutral-400 ml-1 shrink-0">
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-2 border-t border-[#E2E8F0] dark:border-[#1F2937] space-y-4 animate-fade-in">
          {/* Summary / Banner */}
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
              overallReproducibilityRisk === "high"
                ? "bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 text-rose-900 dark:text-rose-200"
                : overallReproducibilityRisk === "low"
                ? "bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 text-amber-900 dark:text-amber-200"
                : "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200"
            }`}
          >
            {overallReproducibilityRisk === "high" ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : overallReproducibilityRisk === "low" ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{summary}</p>
              {hasReasonableRequestWarning && (
                <p className="mt-1.5 text-[11px] opacity-90">
                  <strong>Warning:</strong> &ldquo;Data/code available upon reasonable request&rdquo; statements face immediate desk rejection at Nature, PLOS, and IEEE journals unless coupled with persistent repository records.
                </p>
              )}
            </div>
          </div>

          {/* Repository Audits List */}
          {repoAudits.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Audited Artifact Repositories ({repoAudits.length})
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {repoAudits.map((repo, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] shadow-2xs space-y-3"
                  >
                    {/* Repository Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-[#1E293B] flex items-center justify-center shrink-0">
                          {getPlatformIcon(repo.platform)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                              {repo.url.replace(/^https?:\/\//, "")}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(repo.url)}
                              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
                              title="Copy URL"
                            >
                              {copiedUrl === repo.url ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <a
                              href={repo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
                              title="Open in browser"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 capitalize">
                            {repo.platform} Deposition
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {repo.isAccessible ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Live &amp; Accessible
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Broken / Inaccessible
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            repo.deskRejectionRisk === "high"
                              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                              : repo.deskRejectionRisk === "low"
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                          }`}
                        >
                          {repo.deskRejectionRisk === "high"
                            ? "High Desk-Reject Risk"
                            : repo.deskRejectionRisk === "low"
                            ? "Reviewer Query Risk"
                            : "Submission Ready"}
                        </span>
                      </div>
                    </div>

                    {/* Pre-Submission Checks Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                      {/* 1. License Check */}
                      <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#161F30] border border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>License</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {repo.hasLicense ? (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                              {repo.licenseType || "Open Source"}
                            </span>
                          ) : (
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              Missing License
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 2. Environment Manifests */}
                      <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#161F30] border border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Environment</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {repo.hasEnvironmentSpecs ? (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                              {repo.detectedSpecs.length > 0 ? repo.detectedSpecs[0] : "Verified"}
                            </span>
                          ) : (
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              No Spec File
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 3. Documentation (README) */}
                      <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#161F30] border border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                          <FileText className="w-3.5 h-3.5" />
                          <span>README</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {repo.hasReadme ? (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              Present
                            </span>
                          ) : (
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              Missing
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 4. Repository Access */}
                      <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#161F30] border border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Visibility</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {repo.isAccessible ? (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              Public
                            </span>
                          ) : (
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              Private / 404
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Risk & Suggested Fixes */}
                    {(repo.riskReasons.length > 0 || repo.suggestedFixes.length > 0) && (
                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] space-y-1.5">
                        {repo.riskReasons.map((risk, rIdx) => (
                          <p key={rIdx} className="text-rose-600 dark:text-rose-400 flex items-start gap-1.5">
                            <span className="shrink-0 font-bold">•</span>
                            <span>{risk}</span>
                          </p>
                        ))}
                        {repo.suggestedFixes.map((fix, fIdx) => (
                          <p key={fIdx} className="text-neutral-600 dark:text-neutral-400 flex items-start gap-1.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">Fix:</span>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{fix}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-neutral-500 dark:text-neutral-400">
              No code or data repository links were detected in the manuscript text. Consider depositing code on GitHub or Zenodo to maximize citation impact and satisfy journal open-science mandates.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
