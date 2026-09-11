"use client";

import React, { useState } from "react";
import {
  FileText,
  RefreshCw,
  Copy,
  Check,
  Download,
  Sparkles,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import JournalCombobox from "@/components/JournalCombobox";
import { callLLM } from "@/lib/llm";
import { ProviderConfig } from "@/lib/types";

export function DesktopCoverLetterView() {
  const [title, setTitle] = useState("");
  const [targetJournal, setTargetJournal] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [mainFindings, setMainFindings] = useState("");
  const [broadSignificance, setBroadSignificance] = useState("");
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSample = () => {
    setTitle("Single-cell transcriptional profiling of DLL3 activation in neuroendocrine lung carcinoma");
    setTargetJournal("Nature Communications");
    setAbstract(
      "Small cell lung cancer (SCLC) exhibits rapid recurrence and therapy resistance. Delta-like ligand 3 (DLL3) is an established cell-surface target for antibody-drug conjugates. Here we perform marker-based CRISPR-Cas9 screens and identify transcription factor POU2F1 as a primary driver of DLL3 expression. We demonstrate that POU2F1 directly binds the DLL3 distal enhancer element to drive chemoresistance across 8 patient-derived organoid lines."
    );
    setKeywords("small cell lung cancer, DLL3, POU2F1, CRISPR screen, organoids, chemoresistance");
    setMainFindings("Identified POU2F1 as the essential transcription factor controlling DLL3 enhancer activation in human organoids.");
    setBroadSignificance("Provides the first mechanistic rationale for stratifying patients receiving DLL3-targeted antibody-drug conjugates.");
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetJournal.trim() || !abstract.trim()) {
      setError("Title, Target Journal, and Abstract are required.");
      return;
    }

    setLoading(true);
    setError(null);
    setLetter(null);

    try {
      const prompt = `You are an expert Senior Academic Editor. Write a formal, compelling, high-impact journal submission cover letter addressed to the Senior Editor-in-Chief of "${targetJournal}".

MANUSCRIPT METADATA:
- Target Journal: ${targetJournal}
- Manuscript Title: ${title}
- Abstract:
${abstract}

- Keywords: ${keywords}

ADDITIONAL CONTEXT:
- Primary Findings & Evidence: ${mainFindings.trim() || "Synthesize the primary findings, experimental models, and quantitative evidence directly from the Abstract."}
- Broader Impact & Readership Fit: ${broadSignificance.trim() || `Articulate why this discovery provides a major conceptual advance that appeals directly to the readership and editorial scope of "${targetJournal}".`}

LETTER COMPOSITION REQUIREMENTS:
1. Formally introduce the submission of "${title}" for publication consideration in "${targetJournal}".
2. Articulate the critical scientific bottleneck or unresolved question in the field.
3. Highlight the core methodological advance and empirical findings with precise terminology drawn from the abstract.
4. Detail exactly why the paper is of direct relevance and broad interest to "${targetJournal}"'s readership.
5. Standard mandatory editorial confirmations: confirming originality, that the work has not been published or simultaneously submitted elsewhere, adherence to ethical guidelines/approvals, and that all co-authors have approved the submission.
6. Clear sign-off with placeholders: [Corresponding Author Name, Ph.D.], [Academic Title & Department], [Affiliated University / Research Institution], [Official Institutional Email], [ORCID ID].
7. Tone: Rigorous, articulate, respectful, and free of superficial marketing superlatives.`;

      const savedConfig = localStorage.getItem("manuview_provider_config");
      const providerConfig: ProviderConfig | undefined = savedConfig
        ? JSON.parse(savedConfig)
        : undefined;

      const generated = await callLLM([{ role: "user", content: prompt }], providerConfig);
      setLetter(generated);
    } catch (err: any) {
      setError(err.message || "Failed to generate cover letter.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!letter) return;
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!letter) return;
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cover_Letter_${targetJournal.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#080B11] p-6 sm:p-10 text-[#111827] dark:text-[#F8FAFC]">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800">
            <FileText className="w-3.5 h-3.5" />
            <span>Editor-Calibrated Formal Letter</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
            Journal Cover Letter Generator
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
            Generate formal, high-impact submission cover letters tailored to your target journal's editorial criteria, highlighting novel discoveries and mandatory compliance affirmations.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerate} className="p-6 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] dark:bg-[#111827] dark:border-[#1F2937] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Manuscript Details
            </span>
            <button
              type="button"
              onClick={handleSample}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Preprint</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Target Journal</label>
              <JournalCombobox value={targetJournal} onChange={setTargetJournal} placeholder="Select or type target journal..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Manuscript Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Single-cell transcriptional profiling of..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white dark:bg-[#1E293B] dark:border-[#334155] dark:text-white dark:placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Abstract</label>
            <textarea
              rows={4}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Paste abstract..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white dark:bg-[#1E293B] dark:border-[#334155] dark:text-white dark:placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Key Conceptual Advance (Optional)</label>
            <input
              type="text"
              value={broadSignificance}
              onChange={(e) => setBroadSignificance(e.target.value)}
              placeholder="Why this matters to the journal's readership..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white dark:bg-[#1E293B] dark:border-[#334155] dark:text-white dark:placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-rose-950/30 text-red-700 dark:text-rose-300 border border-red-200 dark:border-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading || !title.trim() || !targetJournal.trim() || !abstract.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold tracking-wide transition cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calibrating with Editorial Standards...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Generate Formal Cover Letter</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Output */}
        {letter && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Generated Submission Letter
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#161F30] hover:bg-neutral-50 dark:hover:bg-[#1E293B] text-neutral-700 dark:text-neutral-300 text-xs font-medium transition cursor-pointer shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Text"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111827] dark:bg-blue-600 hover:bg-neutral-800 dark:hover:bg-blue-500 text-white text-xs font-medium transition cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-[#E5E7EB] dark:border-[#1F2937] bg-[#FAFAFA] dark:bg-[#111827] font-serif text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap shadow-xs">
              {letter}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
