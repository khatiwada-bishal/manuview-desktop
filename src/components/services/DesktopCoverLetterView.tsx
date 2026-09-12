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

export function formatCoverLetterText(raw: string, targetJournal: string, title: string): string {
  let cleaned = (raw || "").trim();

  // 1. Strip markdown code fences if wrapped
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json|markdown|text)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }

  // 2. Detect and extract JSON object if the model output raw JSON
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed === "object" && parsed !== null) {
        const recipient = (parsed.recipient || parsed.to || `Senior Editor-in-Chief, ${targetJournal}`).trim();
        const subject = (parsed.subject || `Submission of manuscript: ${title}`).trim();
        const body = (parsed.body || parsed.letter || parsed.coverLetter || parsed.content || "").trim();

        if (body) {
          const dateStr = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date());
          
          let headerBlock = `${dateStr}\n\nTo:\n${recipient}`;
          if (!recipient.toLowerCase().includes(targetJournal.toLowerCase())) {
            headerBlock += `\n${targetJournal}`;
          }
          headerBlock += `\n\nSubject: ${subject}\n\n`;

          if (body.toLowerCase().startsWith("dear ")) {
            return `${headerBlock}${body}`;
          } else if (body.toLowerCase().includes("subject:")) {
            return body;
          } else {
            return `${headerBlock}${body}`;
          }
        }
      }
    } catch {
      // Regex fallback if JSON has unescaped quotes/newlines
      const bodyMatch = cleaned.match(/"body"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"|"\s*\})/);
      const recipientMatch = cleaned.match(/"recipient"\s*:\s*"([\s\S]*?)"/);
      const subjectMatch = cleaned.match(/"subject"\s*:\s*"([\s\S]*?)"/);

      if (bodyMatch && bodyMatch[1]) {
        const extractedBody = bodyMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').trim();
        const recipient = recipientMatch ? recipientMatch[1].replace(/\\"/g, '"').trim() : `Senior Editor-in-Chief, ${targetJournal}`;
        const subject = subjectMatch ? subjectMatch[1].replace(/\\"/g, '"').trim() : `Submission of manuscript: ${title}`;
        const dateStr = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date());

        return `${dateStr}\n\nTo:\n${recipient}\n\nSubject: ${subject}\n\n${extractedBody}`;
      }
    }
  }

  // 3. If raw text starts with leftover JSON braces or quotes, strip them
  cleaned = cleaned.replace(/^\{[\r\n\s]*/, "").replace(/[\r\n\s]*\}$/, "").trim();

  return cleaned;
}

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
7. Tone: Rigorous, articulate, respectful, and free of superficial marketing superlatives.

IMPORTANT OUTPUT INSTRUCTIONS:
- Return ONLY the clean, final, submission-ready formal cover letter as plain text.
- Do NOT return JSON.
- Do NOT wrap in markdown code blocks.
- Do NOT include conversational greetings before or after the letter.`;

      const savedConfig = localStorage.getItem("manuview_provider_config");
      const providerConfig: ProviderConfig | undefined = savedConfig
        ? JSON.parse(savedConfig)
        : undefined;

      const generated = await callLLM([{ role: "user", content: prompt }], providerConfig);
      const cleanFormatted = formatCoverLetterText(generated, targetJournal, title);
      setLetter(cleanFormatted);
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
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-[#111827] dark:text-[#F8FAFC]">
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
        <form onSubmit={handleGenerate} className="p-6 rounded-3xl liquid-glass-card space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-30">
            <div className="space-y-1 relative z-30">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Target Journal</label>
              <JournalCombobox
                value={targetJournal}
                onChange={setTargetJournal}
                placeholder="Select or type target journal..."
                inputClassName="h-[42px] w-full pl-9 pr-16 py-2.5 rounded-xl liquid-glass-input text-xs sm:text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Manuscript Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Single-cell transcriptional profiling of..."
                className="h-[42px] w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs sm:text-sm focus:outline-none"
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
              className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs sm:text-sm focus:outline-none resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Key Conceptual Advance (Optional)</label>
            <input
              type="text"
              value={broadSignificance}
              onChange={(e) => setBroadSignificance(e.target.value)}
              placeholder="Why this matters to the journal's readership..."
              className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs sm:text-sm focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-700 dark:text-rose-300 border border-red-500/20 text-xs backdrop-blur-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading || !title.trim() || !targetJournal.trim() || !abstract.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass-btn-primary disabled:opacity-50 text-white text-xs font-semibold tracking-wide transition cursor-pointer shadow-xs"
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
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl liquid-glass-btn-secondary text-xs font-semibold transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Text"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl liquid-glass-btn-primary text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            {/* Formal Clean Academic Letter Document (Width matches form card) */}
            <div className="w-full p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#0D121F] border border-black/10 dark:border-white/10 shadow-lg text-neutral-800 dark:text-neutral-100 font-serif leading-relaxed text-sm sm:text-base selection:bg-blue-500/20 space-y-5">
              {/* Document Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.08] dark:border-white/[0.1] text-xs font-sans">
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 font-medium">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-neutral-900 dark:text-white">{targetJournal}</span>
                  <span className="text-neutral-300 dark:text-neutral-600">&bull;</span>
                  <span>Submission Cover Letter</span>
                </div>
                <div className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Ready for Submission
                </div>
              </div>

              {/* Rendered Letter Paragraphs */}
              <div className="space-y-4">
                {letter.split(/\n\s*\n/).map((paragraph, idx) => {
                  const trimmed = paragraph.trim();
                  if (!trimmed) return null;

                  // Date header
                  if (idx === 0 && (trimmed.match(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/) || trimmed.startsWith("Date:"))) {
                    return (
                      <div key={idx} className="text-xs font-sans text-neutral-500 dark:text-neutral-400 font-medium pb-1">
                        {trimmed}
                      </div>
                    );
                  }

                  // Recipient block
                  if (trimmed.startsWith("To:\n") || (trimmed.toLowerCase().includes("editor") && !trimmed.toLowerCase().startsWith("dear"))) {
                    return (
                      <div key={idx} className="text-xs sm:text-sm font-sans font-medium text-neutral-700 dark:text-neutral-300 pb-1 leading-relaxed">
                        {trimmed.split("\n").map((line, lIdx) => (
                          <div key={lIdx}>{line}</div>
                        ))}
                      </div>
                    );
                  }

                  // Subject line Callout
                  if (trimmed.toLowerCase().startsWith("subject:") || trimmed.toLowerCase().startsWith("re:")) {
                    return (
                      <div key={idx} className="p-3.5 my-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 font-sans font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white">
                        {trimmed}
                      </div>
                    );
                  }

                  // Formal Sign-off and Author Placeholders
                  if (trimmed.includes("[Corresponding Author Name") || trimmed.includes("Sincerely,") || trimmed.startsWith("Sincerely")) {
                    return (
                      <div key={idx} className="pt-4 font-sans text-xs sm:text-sm leading-normal space-y-1">
                        {trimmed.split("\n").map((line, lIdx) => {
                          const isPlaceholder = line.trim().startsWith("[") && line.trim().endsWith("]");
                          return (
                            <div
                              key={lIdx}
                              className={
                                isPlaceholder
                                  ? "text-blue-600 dark:text-blue-400 font-mono text-xs font-normal"
                                  : "font-semibold text-neutral-800 dark:text-neutral-200"
                              }
                            >
                              {line}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // Regular letter paragraph
                  return (
                    <p key={idx} className="text-[14px] sm:text-[15px] leading-relaxed sm:leading-7 text-neutral-800 dark:text-neutral-200 text-justify">
                      {trimmed}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
