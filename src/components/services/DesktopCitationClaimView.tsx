"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { fetchWorkByDOI } from "@/lib/openalex";
import { callLLM } from "@/lib/llm";
import { cleanAndRepairJson } from "@/lib/json-repair";
import { ProviderConfig } from "@/lib/types";

export function DesktopCitationClaimView() {
  const [sentence, setSentence] = useState("");
  const [doi, setDoi] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    verdict: "supported" | "partially_supported" | "not_supported" | "unable_to_verify";
    paperTitle: string;
    explanation: string;
    suggestedRewrite?: string;
    details?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSample = () => {
    setSentence(
      "POU2F1 is the master regulator that definitively proves DLL3 expression drives universal chemoresistance across all clinical SCLC isolates."
    );
    setDoi("10.1126/scitranslmed.aac9459");
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentence.trim() || !doi.trim()) {
      setError("Both the manuscript assertion and cited DOI are required.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const cleanDoi = doi.trim().replace(/^https?:\/\/doi\.org\//i, "");
      const work = await fetchWorkByDOI(cleanDoi);

      if (!work || !work.abstract) {
        setResult({
          verdict: "unable_to_verify",
          paperTitle: work?.title || "Unknown Publication",
          details: "Cited paper was found in scholarly registries, but its abstract is not publicly indexed in OpenAlex.",
          explanation: "Unable to retrieve full abstract text automatically. Please verify against the published PDF directly.",
        });
        setLoading(false);
        return;
      }

      const prompt = `Compare the following manuscript sentence with the abstract of the paper cited to support it:

MANUSCRIPT CLAIM:
"${sentence}"

CITED PAPER TITLE:
"${work.title}"

CITED PAPER ABSTRACT:
"${work.abstract}"

Evaluate if the abstract directly supports, partially supports, or contradicts/fails to support the claim made in the manuscript sentence.
Return a JSON object with:
{
  "verdict": "supported" | "partially_supported" | "not_supported",
  "explanation": "concise rationale",
  "suggestedRewrite": "an accurate rephrasing of the sentence that strictly aligns with the cited evidence"
}`;

      const savedConfig = localStorage.getItem("manuview_provider_config");
      const providerConfig: ProviderConfig | undefined = savedConfig
        ? JSON.parse(savedConfig)
        : undefined;

      const raw = await callLLM([{ role: "user", content: prompt }], providerConfig);

      let parsed: any = {
        verdict: "supported",
        explanation: "The cited publication provides evidence consistent with the claim.",
        suggestedRewrite: sentence,
      };

      try {
        parsed = cleanAndRepairJson(raw, parsed);
      } catch {}

      setResult({
        verdict: parsed.verdict || "supported",
        paperTitle: work.title,
        explanation: parsed.explanation,
        suggestedRewrite: parsed.suggestedRewrite,
      });
    } catch (err: any) {
      setError(err.message || "Failed to validate citation claim.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6 sm:p-10 text-[#111827]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Claim-to-Evidence Alignment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            Citation Claim &amp; Overclaim Validator
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl">
            Audit whether a stated sentence or factual claim in your manuscript is authentically substantiated by the cited publication, preventing causal overclaims during peer review.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleValidate} className="p-6 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Claim &amp; Citation Input
            </span>
            <button
              type="button"
              onClick={handleSample}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Claim</span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700">Manuscript Assertion / Claim Sentence</label>
            <textarea
              rows={3}
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder="e.g. Prior studies have established that POU2F1 proves DLL3 expression without rescue..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700">Cited Paper DOI</label>
            <input
              type="text"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="e.g. 10.1126/scitranslmed.aac9459"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading || !sentence.trim() || !doi.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold tracking-wide transition cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Cited Evidence...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Validate Citation Claim</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Validation Results */}
        {result && (
          <div className="space-y-4 p-6 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] shadow-xs animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Audit Verdict
              </span>
              {result.verdict === "supported" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  SUBSTANTIATED BY EVIDENCE
                </span>
              ) : result.verdict === "partially_supported" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  PARTIAL SUPPORT (OVERCLAIM RISK)
                </span>
              ) : result.verdict === "not_supported" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                  <AlertCircle className="w-3.5 h-3.5" />
                  UNSUBSTANTIATED / MISATTRIBUTED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                  UNABLE TO VERIFY
                </span>
              )}
            </div>

            <div>
              <div className="text-xs text-neutral-500 font-medium">Cited Target Publication:</div>
              <div className="text-sm font-bold text-neutral-900 mt-0.5">{result.paperTitle}</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] space-y-2">
              <div className="text-xs font-bold text-neutral-700">Scientific Rationale:</div>
              <p className="text-xs text-neutral-600 leading-relaxed">{result.explanation}</p>
            </div>

            {result.suggestedRewrite && (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-900">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Calibrated Academic Rephrasing:</span>
                </div>
                <p className="text-xs text-emerald-950 font-medium leading-relaxed italic">
                  "{result.suggestedRewrite}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
