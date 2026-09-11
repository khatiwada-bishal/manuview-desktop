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
  FileCode,
  Download,
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
    const text = `Point ${item.itemNumber} (${item.reviewer}):\nComment: ${item.rawComment}\nAction: ${item.actionRequired}\nResponse: ${item.draftResponse}`;
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleExportLatex = () => {
    let rows = "";
    items.forEach((item) => {
      const reviewer = item.reviewer.replace(/[#$%&_~^]/g, "\\$0");
      const comment = item.rawComment.replace(/[#$%&_~^]/g, "\\$0");
      const response = item.draftResponse.replace(/[#$%&_~^]/g, "\\$0");
      rows += `\\textbf{${reviewer} (Pt ${item.itemNumber})} & \\textit{${comment}} & ${response} \\\\ \\midrule\n`;
    });

    const doc = `% ==============================================================================
% ManuView Academic Point-by-Point Author Rebuttal Matrix
% Generated: ${new Date().toISOString()}
% ==============================================================================
\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.8in]{geometry}
\\usepackage{longtable}
\\usepackage{booktabs}
\\title{\\textbf{Point-by-Point Author Response \\& Revision Matrix}}
\\date{\\today}
\\begin{document}
\\maketitle
\\begin{longtable}{p{0.2\\textwidth} p{0.38\\textwidth} p{0.38\\textwidth}}
\\toprule
\\textbf{Reviewer / Item} & \\textbf{Referee Comment} & \\textbf{Author Response \\& Action} \\\\
\\midrule
\\endhead
${rows}
\\bottomrule
\\end{longtable}
\\end{document}`;

    const blob = new Blob([doc], { type: "application/x-latex;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ManuView_Response_Matrix_${Date.now()}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#080B11] p-6 sm:p-10 text-[#1E293B] dark:text-[#E2E8F0]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-[#0F172A] dark:text-white">
              Response to Reviewers Rebuttal Matrix
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
            Automatically ingest editorial decision letters and referee reports. Isolates discrete critique items, categorizes required changes, and drafts diplomatically calibrated author responses.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleBuild} className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
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
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white dark:bg-[#1E293B] dark:border-[#334155] dark:text-white dark:placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none font-mono"
          />

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-rose-950/30 text-red-700 dark:text-rose-300 border border-red-200 dark:border-rose-800 text-xs">
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
              <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                Itemized Rebuttal Points ({items.length})
              </h2>
              <button
                type="button"
                onClick={handleExportLatex}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#161F30] text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition shadow-2xs cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Export LaTeX Table (.tex)</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-[#E5E7EB] dark:border-[#1F2937] bg-[#FAFAFA] dark:bg-[#111827] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-900 dark:bg-blue-600 text-white">
                        {item.reviewer} · Point {item.itemNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 dark:bg-[#1E293B] dark:text-neutral-400 dark:border-[#334155]">
                        {item.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyItem(item, idx)}
                      className="flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                    >
                      {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIdx === idx ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-100/80 dark:bg-[#161F30] border border-neutral-200 dark:border-[#334155] text-xs text-neutral-700 dark:text-neutral-400 italic">
                    &ldquo;{item.rawComment}&rdquo;
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-neutral-800 dark:text-neutral-200">Action Required:</div>
                    <div className="text-neutral-600 dark:text-neutral-400">{item.actionRequired}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] dark:bg-[#161F30] dark:border-[#334155] text-xs space-y-1">
                    <div className="font-semibold text-blue-700 dark:text-blue-400">Calibrated Author Response:</div>
                    <p className="text-neutral-800 dark:text-neutral-300 leading-relaxed">{item.draftResponse}</p>
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
