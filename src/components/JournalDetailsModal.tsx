"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  BookOpen,
  Globe,
  Award,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Tag,
  Hash,
  RefreshCw,
  Layers,
  FileText,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { fetchLiveJournalScope, JournalScopeProfile } from "@/lib/journal-scope-service";

interface JournalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  journalName?: string;
  initialProfile?: JournalScopeProfile | null;
}

export default function JournalDetailsModal({
  isOpen,
  onClose,
  journalName = "",
  initialProfile = null,
}: JournalDetailsModalProps) {
  const [profile, setProfile] = useState<JournalScopeProfile | null>(initialProfile);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (initialProfile) {
      setProfile(initialProfile);
      return;
    }

    const clean = journalName.trim();
    if (!clean) {
      setProfile(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchLiveJournalScope(clean)
      .then((res) => {
        if (isMounted) {
          setProfile(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || "Failed to load journal details from scholarly registries.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, journalName, initialProfile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "—";
    return num.toLocaleString();
  };

  const formatCurrency = (usd?: number | null) => {
    if (usd === undefined) return undefined;
    if (usd === null || usd === 0) return "No APC / Free to Publish";
    return `$${usd.toLocaleString()} USD`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#121B2B] rounded-3xl border border-[#E2E8F0] dark:border-[#334155] shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[#E2E8F0] dark:border-[#1F2937] flex items-start justify-between gap-4 bg-black/[0.01] dark:bg-white/[0.02]">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <Globe className="w-3 h-3" />
                <span>OpenAlex Scholarly Registry</span>
              </span>
              {profile?.countryCode && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-300">
                  {profile.countryCode}
                </span>
              )}
              {profile?.type && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 capitalize">
                  {profile.type}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0F172A] dark:text-white tracking-tight leading-snug">
              {profile?.officialName || journalName || "Journal Details"}
            </h2>

            <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-neutral-400">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>{profile?.publisher || "Publisher Not Specified"}</span>
              {profile?.primaryDiscipline && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{profile.primaryDiscipline}</span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Querying OpenAlex scholarly registry for indexed journal metrics...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Registry Lookup Error:</span> {error}
              </div>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Primary Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 2-Year Citedness / IF */}
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] space-y-1">
                  <div className="flex items-center justify-between text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                    <span>2-Yr Citedness</span>
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-lg font-bold text-[#0F172A] dark:text-white">
                    {profile.twoYearMeanCitedness !== undefined
                      ? profile.twoYearMeanCitedness.toFixed(2)
                      : profile.impactMetric || "—"}
                  </div>
                  <div className="text-[10px] text-[#64748B] dark:text-neutral-400">
                    OpenAlex IF equivalent
                  </div>
                </div>

                {/* H-Index */}
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] space-y-1">
                  <div className="flex items-center justify-between text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                    <span>H-Index</span>
                    <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-lg font-bold text-[#0F172A] dark:text-white">
                    {profile.hIndex !== undefined ? profile.hIndex.toLocaleString() : "—"}
                  </div>
                  <div className="text-[10px] text-[#64748B] dark:text-neutral-400">
                    {profile.i10Index ? `i10: ${formatNumber(profile.i10Index)}` : "Scholarly citation depth"}
                  </div>
                </div>

                {/* Open Access Model */}
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] space-y-1">
                  <div className="flex items-center justify-between text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                    <span>Access Model</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-[#0F172A] dark:text-white pt-0.5">
                    {profile.isOa ? (
                      <span className="text-emerald-700 dark:text-emerald-400">Open Access</span>
                    ) : (
                      <span className="text-neutral-700 dark:text-neutral-300">Hybrid / Sub</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#64748B] dark:text-neutral-400">
                    {profile.isInDoaj ? "DOAJ Indexed ✓" : "Standard Indexing"}
                  </div>
                </div>

                {/* Article Processing Charge */}
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] space-y-1">
                  <div className="flex items-center justify-between text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                    <span>APC Charge</span>
                    <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-sm font-bold text-[#0F172A] dark:text-white pt-0.5 truncate">
                    {formatCurrency(profile.apcUsd) || "Check journal"}
                  </div>
                  <div className="text-[10px] text-[#64748B] dark:text-neutral-400">
                    Publication fee
                  </div>
                </div>
              </div>

              {/* Bibliographic Numbers Strip */}
              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#E2E8F0] dark:border-[#334155] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-neutral-500 dark:text-neutral-400">ISSN:</span>
                  <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                    {profile.issn?.join(", ") || profile.issnL || "Not listed"}
                  </span>
                  {profile.issnL && profile.issn?.length && profile.issn.length > 1 && (
                    <span className="text-[10px] text-neutral-400">(Linking: {profile.issnL})</span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-neutral-500 dark:text-neutral-400">
                  {profile.worksCount !== undefined && (
                    <span>
                      <strong className="text-neutral-800 dark:text-neutral-200">{formatNumber(profile.worksCount)}</strong> Works Indexed
                    </span>
                  )}
                  {profile.citedByCount !== undefined && (
                    <span>
                      <strong className="text-neutral-800 dark:text-neutral-200">{formatNumber(profile.citedByCount)}</strong> Total Citations
                    </span>
                  )}
                </div>
              </div>

              {/* Scope & Editorial Summary */}
              {profile.summaryScope && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Editorial Scope &amp; Remit</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] text-xs leading-relaxed text-[#334155] dark:text-neutral-300">
                    {profile.summaryScope}
                  </div>
                </div>
              )}

              {/* Research Topics from OpenAlex Taxonomy */}
              {((profile.topicsDetailed && profile.topicsDetailed.length > 0) ||
                (profile.primaryTopics && profile.primaryTopics.length > 0)) && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>OpenAlex Indexed Topics &amp; Subfields</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.topicsDetailed && profile.topicsDetailed.length > 0
                      ? profile.topicsDetailed.map((topic, tIdx) => (
                          <div
                            key={tIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40"
                          >
                            <span className="font-semibold">{topic.displayName}</span>
                            {topic.subfield && (
                              <span className="text-[10px] text-purple-500 dark:text-purple-400 font-mono">
                                ({topic.subfield})
                              </span>
                            )}
                          </div>
                        ))
                      : profile.primaryTopics.map((topic, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2.5 py-1 rounded-xl text-xs bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 font-medium"
                          >
                            {topic}
                          </span>
                        ))}
                  </div>
                </div>
              )}

              {/* Key Scientific Concepts */}
              {profile.keyConcepts && profile.keyConcepts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Key Conceptual Headings</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.keyConcepts.map((c, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Desk Reject Hazards (if present from catalog) */}
              {profile.deskRejectHazards && profile.deskRejectHazards.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#DC2626] dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Editorial Screening Desk-Reject Hazards</span>
                  </div>
                  <div className="space-y-1.5">
                    {profile.deskRejectHazards.map((hazard, hIdx) => (
                      <div
                        key={hIdx}
                        className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/50 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2"
                      >
                        <span className="font-mono font-bold text-rose-500 mt-0.5">•</span>
                        <span>{hazard}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-neutral-400">
              No journal profile found. Please search for a specific journal.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E2E8F0] dark:border-[#1F2937] bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {profile?.homepageUrl && (
              <a
                href={profile.homepageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] text-blue-600 dark:text-blue-400 hover:bg-neutral-50 dark:hover:bg-white/5 transition"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Official Journal Website</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}
            {profile?.openAlexId && (
              <a
                href={profile.openAlexId}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#161F30] border border-[#E2E8F0] dark:border-[#334155] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>OpenAlex Source Record</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
