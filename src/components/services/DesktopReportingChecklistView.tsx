"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  BookOpen,
  Filter,
  Layers,
} from "lucide-react";
import { saveFileDesktop } from "@/lib/desktop";
import { parseManuscriptText } from "@/lib/parser";
import {
  executeModularGuidelineAudit,
  getAllGuidelines,
  getGuidelineById,
} from "@/lib/guidelines";
import type { ReportingGuidelineCheck, ReportingGuidelineItem } from "@/lib/types";

const SAMPLE_CLINICAL_TRIAL = `Title: A Randomized, Double-Blind, Parallel-Group Trial of Novel Therapeutic X in Moderate Asthma

Abstract:
Background: Moderate asthma remains poorly controlled in a substantial patient subset.
Methods: We conducted a randomized, double-blind, parallel-group trial (allocation ratio 1:1) at three academic medical centers. Eligible patients were adults aged 18-65 with confirmed asthma. Patients were assigned to receive oral Compound X (100mg daily) or identical matching placebo for 12 weeks. Primary outcome was change in FEV1 at week 12. A sample size of 120 patients was calculated to provide 90% power with two-sided alpha = 0.05.
Results: 120 patients were randomized. Compound X produced a significant improvement in FEV1 (mean difference 0.34L, 95% CI [0.18, 0.50], p < 0.001). Adverse events were mild and comparable between groups.
Conclusions: Daily oral Compound X significantly improved pulmonary function in moderate asthma.

Methods:
Study Design and Participants:
Eligible patients met inclusion criteria: FEV1 between 60% and 80% predicted, reversibility >= 12%. Exclusion criteria included smoking history > 10 pack-years. The study protocol was approved by the Institutional Review Board (IRB #2024-8891) and registered at ClinicalTrials.gov (NCT04981234).
Randomization and Allocation Concealment:
A computer-generated random sequence using permuted blocks of 4 was implemented. Allocation concealment was maintained via central web-based automated assignment.
Blinding:
Participants, investigators, and outcome assessors were blinded to treatment assignment. Placebo tablets were identical in size, color, taste, and packaging.
Statistical Analysis:
Primary analysis followed intention-to-treat principles. Between-group comparisons used Student's t-test and multivariable regression adjusting for baseline characteristics.`;

export function DesktopReportingChecklistView() {
  const [selectedGuidelineId, setSelectedGuidelineId] = useState("consort");
  const [input, setInput] = useState(SAMPLE_CLINICAL_TRIAL);
  const [auditReport, setAuditReport] = useState<ReportingGuidelineCheck | null>(() => {
    const parsed = parseManuscriptText(SAMPLE_CLINICAL_TRIAL);
    return executeModularGuidelineAudit("consort", parsed);
  });
  const [filterStatus, setFilterStatus] = useState<"all" | "evidenced" | "partial" | "absent">("all");
  const [copied, setCopied] = useState(false);

  const guidelines = getAllGuidelines();
  const currentGuideline = getGuidelineById(selectedGuidelineId) || guidelines[0];

  const handleRunAudit = () => {
    if (!input.trim()) return;
    const parsed = parseManuscriptText(input);
    const report = executeModularGuidelineAudit(selectedGuidelineId, parsed);
    setAuditReport(report);
  };

  const handleGuidelineChange = (id: string) => {
    setSelectedGuidelineId(id);
    if (input.trim()) {
      const parsed = parseManuscriptText(input);
      const report = executeModularGuidelineAudit(id, parsed);
      setAuditReport(report);
    }
  };

  const filteredItems = (auditReport?.items || []).filter((item) => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  const generateMarkdownTable = (): string => {
    if (!auditReport) return "";
    let md = `# Formal Reporting Guideline Checklist: ${auditReport.guidelineName}\n`;
    md += `**Standard Version**: ${auditReport.standardVersion} (${auditReport.standardUrl})\n`;
    md += `**Overall Adherence Score**: ${auditReport.scorePercent}% (${auditReport.evidencedCount} Compliant, ${auditReport.partialCount} Partial, ${auditReport.absentCount} Absent)\n\n`;
    md += `| Item # | Item Name | Section | Status | Extracted Evidence / Recommendation |\n`;
    md += `| :---: | :--- | :--- | :---: | :--- |\n`;

    for (const item of auditReport.items || []) {
      const statusLabel =
        item.status === "evidenced"
          ? "✅ PASS"
          : item.status === "partial"
          ? "⚠️ PARTIAL"
          : "❌ ABSENT";
      const detail =
        item.status === "evidenced"
          ? item.evidenceExcerpt || "Evidenced in text"
          : item.recommendation || "Item absent from manuscript";
      md += `| ${item.itemNumber} | ${item.name} | ${item.section} | ${statusLabel} | ${detail.replace(/\|/g, "-")} |\n`;
    }

    return md;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownTable();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportFile = async () => {
    const md = generateMarkdownTable();
    const filename = `${selectedGuidelineId}_reporting_checklist.md`;
    await saveFileDesktop(md, filename, [
      { name: "Markdown Document", extensions: ["md"] },
      { name: "All Files", extensions: ["*"] },
    ]);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Modular Reporting Guidelines Auditor</span>
          </h1>
          <p className="text-xs text-[#64748B] dark:text-neutral-400 mt-1">
            Standard-compliant verification for clinical trials (CONSORT), systematic reviews (PRISMA), animal studies (ARRIVE), machine learning, and observational epidemiology (STROBE).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="liquid-glass-btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied Table" : "Copy Table"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportFile}
            className="liquid-glass-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Checklist</span>
          </button>
        </div>
      </div>

      {/* Guideline Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {guidelines.map((g) => {
          const isSelected = selectedGuidelineId === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => handleGuidelineChange(g.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "liquid-glass-btn-secondary text-[#475569] dark:text-neutral-300"
              }`}
            >
              {g.name.split(" ")[0]}
              <span className="opacity-75 font-normal ml-1.5 text-[11px]">({g.itemSetSize} items)</span>
            </button>
          );
        })}
      </div>

      {/* Manuscript Input Drawer */}
      <div className="p-5 rounded-3xl liquid-glass-card border border-black/[0.08] dark:border-white/[0.1] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">
            Manuscript Text or Structured Abstract &amp; Methods:
          </label>
          <span className="text-[11px] text-neutral-400">
            {input.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          placeholder="Paste manuscript text, structured abstract, or methods section to audit..."
          className="w-full text-xs font-mono p-3 rounded-2xl bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 dark:text-neutral-200 leading-relaxed resize-y"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleRunAudit}
            className="liquid-glass-btn-primary px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            Audit Against {currentGuideline.name.split(" ")[0]}
          </button>
        </div>
      </div>

      {/* Audit Scorecard Banner */}
      {auditReport && (
        <div className="p-6 rounded-3xl liquid-glass-card border border-black/[0.08] dark:border-white/[0.1] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  {auditReport.guidelineName}
                </h2>
                <a
                  href={auditReport.standardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-indigo-600 transition"
                  title="Official standard documentation"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {auditReport.standardType} • Version: {auditReport.standardVersion}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {auditReport.scorePercent}%
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                  Compliance Score
                </span>
              </div>
            </div>
          </div>

          {/* Metric Counts */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center">
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {auditReport.evidencedCount}
              </span>
              <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                Evidenced / Pass
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-center">
              <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                {auditReport.partialCount}
              </span>
              <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase">
                Partial Location
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-center">
              <span className="text-lg font-bold text-rose-700 dark:text-rose-300">
                {auditReport.absentCount}
              </span>
              <span className="block text-[10px] text-rose-600 dark:text-rose-400 font-semibold uppercase">
                Absent / Missing
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Itemized Audit Table */}
      {auditReport && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Itemized Checklist ({filteredItems.length} of {auditReport.totalItems})
            </h3>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterStatus === "all"
                    ? "bg-neutral-800 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("evidenced")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterStatus === "evidenced"
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                }`}
              >
                Pass ({auditReport.evidencedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("partial")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterStatus === "partial"
                    ? "bg-amber-600 text-white"
                    : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                }`}
              >
                Partial ({auditReport.partialCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("absent")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterStatus === "absent"
                    ? "bg-rose-600 text-white"
                    : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                }`}
              >
                Absent ({auditReport.absentCount})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredItems.map((item) => (
              <div
                key={item.itemNumber}
                className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] shadow-2xs space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {item.itemNumber}
                    </span>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {item.name}
                    </h4>
                    <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                      §{item.section}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border self-start sm:self-auto flex items-center gap-1 ${
                      item.status === "evidenced"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                        : item.status === "partial"
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                    }`}
                  >
                    {item.status === "evidenced" ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Evidenced
                      </>
                    ) : item.status === "partial" ? (
                      <>
                        <AlertTriangle className="w-3 h-3" /> Partial
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Absent
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {item.description}
                </p>

                {item.evidenceExcerpt && (
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#161F30] border border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-700 dark:text-neutral-300 font-light italic">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 not-italic block mb-0.5">
                      Matched Excerpt ({item.evidenceSection || "text"}):
                    </span>
                    &ldquo;{item.evidenceExcerpt}&rdquo;
                  </div>
                )}

                {item.recommendation && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-start gap-1.5">
                    <span className="font-bold">Required Fix:</span>
                    <span>{item.recommendation}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
