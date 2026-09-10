"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Users,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { callLLM } from "@/lib/llm";
import { cleanAndRepairJson } from "@/lib/json-repair";
import { ProviderConfig } from "@/lib/types";

const SAMPLE_DECISION_LETTER = `Dear Author,

Thank you for submitting your manuscript "DLL3 SCLC Nature Pre-Submission" to Nature Communications. The reviewers have evaluated your work and recommend Major Revisions before publication can be considered.

Reviewer #1 (Methods):
The authors claim that POU2F1 directly drives DLL3 transcription, but sgRNA library coverage depth was only sequenced across 8 organoid lines without rescue controls. The authors must confirm sgRNA plasmid library representation across all biological replicates.

Reviewer #2 (Statistics):
In Figure 3D, a two-tailed Student's t-test is applied to sample sizes of n=8 without reporting Shapiro-Wilk normality tests. Given the skewness, non-parametric Wilcoxon rank-sum or Mann-Whitney tests should be utilized.

Reviewer #3 (Field Novelty):
The authors should explicitly clarify their enhancer assay distinction from the published promoter analysis in Cell Reports 2024.`;

interface RebuttalItem {
  reviewer: string;
  itemNumber: number;
  category: string;
  rawComment: string;
  actionRequired: string;
  draftResponse: string;
}

export function DesktopResponseBuilderView() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RebuttalItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleSample = () => {
    setInputText(SAMPLE_DECISION_LETTER);
  };

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setError("Please paste reviewer comments or a decision letter.");
      return;
    }

    setLoading(true);
    setError(null);
    setItems([]);

    try {
      const prompt = `Parse the following journal peer-review decision letter into structured, numbered critique points and generate an itemized revision response matrix:

DECISION LETTER & REVIEWER COMMENTS:
${inputText}

Return a JSON array of parsed reviewer comments with the following format:
[
  {
    "reviewer": "Reviewer 1" | "Reviewer 2" | "Editor",
    "itemNumber": 1,
    "category": "Methodology" | "Statistics" | "Additional Experiments" | "Clarification/Text" | "Citations",
    "rawComment": "The direct quote of the reviewer's concern",
    "actionRequired": "Concrete revision needed in the manuscript or rebuttal",
    "draftResponse": "Polite, rigorous, academic point-by-point rebuttal text acknowledging the point and detailing changes made (with [Line X-Y] placeholders)."
  }
]`;

      const savedConfig = localStorage.getItem("manuview_provider_config");
      const providerConfig: ProviderConfig | undefined = savedConfig
        ? JSON.parse(savedConfig)
        : undefined;

      const raw = await callLLM([{ role: "user", content: prompt }], providerConfig);
      let parsed: RebuttalItem[] = [];
      try {
        parsed = cleanAndRepairJson(raw, []);
      } catch {}

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Unable to parse structured reviewer critiques from input.");
      }

      setItems(parsed);
    } catch (err: any) {
      setError(err.message || "Failed to generate rebuttal matrix.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyItem = (item: RebuttalItem, idx: number) => {
    const text = `Point ${item.itemNumber} (${item.reviewer}): "${item.rawComment}"\nResponse: ${item.draftResponse}`;
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6 sm:p-10 text-[#111827]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Point-by-Point Rebuttal Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            Peer Review Response &amp; Rebuttal Builder
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl">
            Transform journal decision letters and referee reports into itemized, structured rebuttal matrices with academically calibrated counter-arguments.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleBuild} className="p-6 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Reviewer Critiques &amp; Decision Letter
            </span>
            <button
              type="button"
              onClick={handleSample}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Decision Letter</span>
            </button>
          </div>

          <textarea
            rows={6}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste reviewer comments, referee feedback, or editor decision letters..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none font-mono"
          />

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold tracking-wide transition cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Rebuttal Matrix...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>Generate Response Matrix</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Rebuttal Matrix Items */}
        {items.length > 0 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0F172A]">
                Itemized Rebuttal Points ({items.length})
              </h2>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-900 text-white">
                        {item.reviewer} · Point {item.itemNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                        {item.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyItem(item, idx)}
                      className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
                    >
                      {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIdx === idx ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-100/80 border border-neutral-200 text-xs text-neutral-700 italic">
                    "{item.rawComment}"
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-neutral-800">Action Required:</div>
                    <div className="text-neutral-600">{item.actionRequired}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] text-xs space-y-1">
                    <div className="font-semibold text-blue-700">Calibrated Author Response:</div>
                    <p className="text-neutral-800 leading-relaxed">{item.draftResponse}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
