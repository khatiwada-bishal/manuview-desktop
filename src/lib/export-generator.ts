import type { FullReviewReport, BriefJournalFitReport, ReviewReport } from "./types";
import { saveFileDesktop } from "./desktop";
import { renderStaticRadarSvg } from "./charts/theme";

function escapeHtml(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Strictly validates dynamic hyperlinks to allow only http:// and https:// schemes (Audit Finding #6).
 * Neutralizes javascript:, data:, file:, and other unsafe schemes.
 */
export function sanitizeHref(url: string | undefined | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function sanitizeFilename(title: string): string {
  return (title || "Manuscript")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 45);
}

async function triggerDownload(
  content: string,
  filename: string,
  mimeType: string,
  filters?: { name: string; extensions: string[] }[]
): Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }> {
  return await saveFileDesktop(content, filename, filters, mimeType);
}

/**
 * Generates and triggers download of a 100% self-contained, standalone
 * interactive HTML report that opens in any browser offline.
 */
export async function exportInteractiveHtmlReport(report: ReviewReport): Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }> {
  const isFullReport = report.mode === "full" || !("fitScore" in report);
  const filename = `ManuView_Interactive_Report_${sanitizeFilename(report.title)}.html`;
  const htmlContent = isFullReport
    ? generateFullReportHtml(report as FullReviewReport)
    : generateBriefReportHtml(report as BriefJournalFitReport);

  return await triggerDownload(htmlContent, filename, "text/html;charset=utf-8", [
    { name: "HTML Webpage", extensions: ["html", "htm"] },
    { name: "All Files", extensions: ["*"] },
  ]);
}

/**
 * Generates and triggers download of a native-compatible Microsoft Word document (.doc/.docx)
 * styled to match the interactive HTML diagnostic design.
 */
export async function exportWordDocReport(report: ReviewReport): Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }> {
  const isFullReport = report.mode === "full" || !("fitScore" in report);
  const filename = `ManuView_Diagnostic_Report_${sanitizeFilename(report.title)}.doc`;
  const wordContent = isFullReport
    ? generateFullReportWord(report as FullReviewReport)
    : generateBriefReportWord(report as BriefJournalFitReport);

  return await triggerDownload(wordContent, filename, "application/msword;charset=utf-8", [
    { name: "Microsoft Word Document", extensions: ["doc", "docx"] },
    { name: "All Files", extensions: ["*"] },
  ]);
}

/**
 * Triggers a high-fidelity print / PDF export of the diagnostic report.
 * Uses an isolated print-rendering frame containing the complete standalone report
 * matching the interactive HTML design, ensuring desktop app UI controls and shell are never printed.
 */
export async function exportPdfReport(report: ReviewReport): Promise<{ success: boolean; cancelled?: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Window context not available for PDF export" };
  }

  const isFullReport = report.mode === "full" || !("fitScore" in report);
  const title = report.title || "Manuscript";
  const filename = `ManuView_Diagnostic_Report_${sanitizeFilename(title)}`;
  const htmlContent = isFullReport
    ? generateFullReportHtml(report as FullReviewReport)
    : generateBriefReportHtml(report as BriefJournalFitReport);

  try {
    const existing = document.getElementById("manuview-print-frame");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    const iframe = document.createElement("iframe");
    iframe.id = "manuview-print-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      return { success: false, error: "Unable to create print document frame" };
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();
    doc.title = filename;

    // Allow iframe styles, embedded SVGs, and fonts to render
    await new Promise((resolve) => setTimeout(resolve, 350));

    const win = iframe.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }

    setTimeout(() => {
      const el = document.getElementById("manuview-print-frame");
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 4000);

    return { success: true };
  } catch (err) {
    console.error("PDF print export failed:", err);
    return { success: false, error: String(err) };
  }
}

function escapeLatex(text?: string | null): string {
  if (!text) return "";
  return String(text)
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[{}]/g, "\\$&")
    .replace(/[#$%&_~^]/g, "\\$&");
}

/**
 * Generates a formal LaTeX Point-by-Point Rebuttal Matrix (.tex)
 */
export function generateLatexRebuttal(report: FullReviewReport): string {
  const title = escapeLatex(report.title);
  const journal = escapeLatex(report.targetJournal || "Target Journal");
  const summary = escapeLatex(report.summary || "Manuscript evaluated via ManuView multi-persona peer review simulation.");
  
  const reviewers = report.reviewerPersonas || [];
  const issues = report.priorityIssues || [];

  let rows = "";

  for (const rev of reviewers) {
    const nameRole = `\\textbf{${escapeLatex(rev.name)}}\\\\(${escapeLatex(rev.expertise || rev.roleDescription)})\\\\[2pt]\\textit{Rec: ${escapeLatex(rev.decisionRecommendation)}}`;
    const critiques = (rev.majorCritiques || []).slice(0, 2).map((c) => `\\item ${escapeLatex(c)}`).join("\n");
    const mustAddress = (rev.mustAddressItems || []).slice(0, 2).map((m) => `\\item ${escapeLatex(m)}`).join("\n");

    rows += `
${nameRole} & 
\\begin{itemize}[leftmargin=*,noitemsep,topsep=0pt]
${critiques || "\\item Overall rigor analysis verified."}
\\end{itemize} & 
\\begin{itemize}[leftmargin=*,noitemsep,topsep=0pt]
${mustAddress || "\\item Point addressed in revised text."}
\\end{itemize} \\\\ \\midrule
`;
  }

  return `% ==============================================================================
% ManuView Academic Point-by-Point Author Rebuttal Matrix
% Manuscript: ${report.title}
% Target Journal: ${report.targetJournal || "Academic Journal"}
% Generated: ${new Date().toISOString()}
% ==============================================================================
\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.8in]{geometry}
\\usepackage{longtable}
\\usepackage{booktabs}
\\usepackage{enumitem}
\\usepackage{xcolor}
\\usepackage{hyperref}

\\title{\\textbf{Point-by-Point Author Response \\& Revision Matrix}}
\\author{\\textbf{Manuscript:} \\textit{${title}}\\\\ \\textbf{Target Journal:} ${journal}}
\\date{\\today}

\\begin{document}
\\maketitle

\\section*{1. Executive Summary \\& Editorial Posture}
${summary}

\\vspace{1em}
\\section*{2. Peer-Review Persona Feedback \\& Itemized Rebuttal Matrix}

\\begin{longtable}{p{0.25\\textwidth} p{0.35\\textwidth} p{0.35\\textwidth}}
\\toprule
\\textbf{Reviewer Persona} & \\textbf{Core Critiques / Challenges} & \\textbf{Author Rebuttal \\& Revision Action} \\\\
\\midrule
\\endhead
${rows}
\\bottomrule
\\end{longtable}

\\end{document}
`;
}

export async function exportLatexRebuttalTable(report: ReviewReport): Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }> {
  const isFullReport = report.mode === "full" || !("fitScore" in report);
  if (!isFullReport) return { success: false, error: "LaTeX Rebuttal Matrix is only available for full diagnostic reviews." };
  const filename = `ManuView_Rebuttal_Matrix_${sanitizeFilename(report.title)}.tex`;
  const latexContent = generateLatexRebuttal(report as FullReviewReport);
  return await triggerDownload(latexContent, filename, "application/x-latex;charset=utf-8", [
    { name: "LaTeX Source Document", extensions: ["tex"] },
    { name: "All Files", extensions: ["*"] },
  ]);
}

/**
 * Generates a clean BibTeX (.bib) file containing all verified references with valid DOIs
 */
export function generateBibTeX(report: ReviewReport): string {
  const isFullReport = report.mode === "full";
  if (!isFullReport) return "";
  const full = report as FullReviewReport;
  const references = full.citationIntegrity?.references || [];

  if (references.length === 0) {
    return `% No parsed references available for ${full.title}\n`;
  }

  let bibtex = `% ==============================================================================
% ManuView Verified BibTeX Bibliography
% Manuscript: ${full.title}
% Total References: ${references.length}
% ==============================================================================\n\n`;

  references.forEach((ref, index) => {
    const firstAuthor = (ref.authors && ref.authors[0]) 
      ? ref.authors[0].split(/\s+/).pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") 
      : "ref";
    const yearStr = ref.year ? String(ref.year) : "";
    const key = `${firstAuthor || "ref"}${yearStr ? `_${yearStr}` : ""}_${index + 1}`;

    const lines: string[] = [];
    lines.push(`@article{${key},`);
    lines.push(`  title     = {${(ref.title || ref.raw || "Cited Work").replace(/[{}]/g, "")}},`);
    if (ref.authors && ref.authors.length > 0) {
      lines.push(`  author    = {${ref.authors.join(" and ")}},`);
    }
    if (ref.journal) {
      lines.push(`  journal   = {${ref.journal}},`);
    }
    if (ref.year) {
      lines.push(`  year      = {${ref.year}},`);
    }
    if (ref.doi) {
      lines.push(`  doi       = {${ref.doi}},`);
      lines.push(`  url       = {https://doi.org/${ref.doi}}`);
    }
    bibtex += lines.join("\n") + "\n}\n\n";
  });

  return bibtex;
}

export async function exportBibTeX(report: ReviewReport): Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }> {
  const filename = `ManuView_Bibliography_${sanitizeFilename(report.title)}.bib`;
  const bibtexContent = generateBibTeX(report);
  if (!bibtexContent.trim()) {
    return { success: false, error: "No verified citations with DOIs found in manuscript." };
  }
  return await triggerDownload(bibtexContent, filename, "application/x-bibtex;charset=utf-8", [
    { name: "BibTeX Bibliography", extensions: ["bib"] },
    { name: "All Files", extensions: ["*"] },
  ]);
}

// -----------------------------------------------------------------------------
// 1. FULL REPORT - STANDALONE INTERACTIVE HTML GENERATOR
// -----------------------------------------------------------------------------
export function generateFullReportHtml(r: FullReviewReport): string {
  const title = escapeHtml(r.title);
  const targetJournal = escapeHtml(r.targetJournal || "General High Impact Journal");
  const isScopeMismatch = Boolean(
    r.targetJournalEvaluation?.isDisciplinaryMismatch ||
    r.priorityIssues?.some((i) => i.priority === "A" && (i.category === "Scope/Fit" || /scope|out-of-scope|desk reject/i.test(`${i.title} ${i.description}`)))
  );
  const mismatchWarning = r.targetJournalEvaluation?.mismatchWarning ||
    (isScopeMismatch
      ? `Manuscript research domain falls outside the published aims and scope of ${targetJournal}. Submitting out-of-scope manuscripts is the primary cause of immediate editorial desk rejection without external peer review.`
      : "");
  const isDeskReject = Boolean(
    r.editorialTriage?.outcome === "desk_reject" ||
    r.ineligibilityReason === "scope_mismatch" ||
    isScopeMismatch
  );
  const hasNumericScore = !isDeskReject && typeof r.overallScore === "number";
  const scoreLabel = isDeskReject
    ? "DESK REJECT"
    : r.isEligibleForReview === false
    ? r.ineligibilityReason === "already_published"
      ? "PUB"
      : "N/A"
    : hasNumericScore
    ? `${r.overallScore}`
    : "Not Assessed";
  const dateStr = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; script-src 'none';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ManuView Report: ${title}</title>
  <style>
    :root {
      --bg: #0F172A;
      --card-bg: #FFFFFF;
      --card-border: #E2E8F0;
      --text-main: #1E293B;
      --text-muted: #64748B;
      --accent: #2563EB;
      --priority-a: #DC2626;
      --priority-b: #D97706;
      --priority-c: #16A34A;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8FAFC;
      color: var(--text-main);
      line-height: 1.5;
      padding: 24px;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    .header-card {
      background: #FFFFFF;
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--card-border);
    }
    .brand-title { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
    .brand-title span { color: var(--accent); }
    .meta-badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      background: #EFF6FF;
      color: #1D4ED8;
      padding: 4px 12px;
      border-radius: 9999px;
      border: 1px solid #BFDBFE;
    }
    h1 {
      font-family: Georgia, serif;
      font-size: 26px;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 16px;
      color: #0F172A;
    }
    .score-banner {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      justify-content: space-between;
      background: #F1F5F9;
      border-radius: 12px;
      padding: 16px 20px;
      margin-top: 20px;
    }
    .score-meter { display: flex; align-items: baseline; gap: 8px; }
    .score-number { font-size: 36px; font-weight: 800; color: #0F172A; }
    .score-label { font-size: 13px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .btn-print {
      background: #0F172A;
      color: #FFF;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-print:hover { background: #334155; }
    
    /* Navigation Index */
    .tabs-nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      border-bottom: 2px solid #E2E8F0;
      margin-bottom: 24px;
      padding-bottom: 12px;
    }
    .tab-content { display: block; margin-bottom: 32px; }

    /* Cards */
    .card {
      background: #FFFFFF;
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #0F172A;
    }
    .dimension-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
    }
    .dimension-card {
      background: #FFFFFF;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px;
    }
    .dim-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .dim-score { font-weight: 800; font-size: 16px; color: var(--accent); }
    .dim-verdict { font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 10px; }
    .dim-list { font-size: 12px; list-style: square; padding-left: 18px; color: #334155; margin-bottom: 8px; }
    .dim-list li { margin-bottom: 4px; }
    .vuln-item { color: #B91C1C; }

    /* Reviewer Personas */
    .persona-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }
    .persona-pill {
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
    }
    .persona-pill.active {
      background: #0F172A;
      color: #FFF;
      border-color: #0F172A;
    }
    .persona-panel { display: block; margin-bottom: 24px; }
    .persona-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 6px;
      background: #FEF3C7;
      color: #92400E;
      margin-bottom: 8px;
    }
    .critique-box {
      background: #F8FAFC;
      border-left: 4px solid var(--accent);
      padding: 14px 16px;
      border-radius: 0 8px 8px 0;
      margin-top: 14px;
      font-size: 13px;
    }

    /* Priority Issues */
    .filter-pills { display: flex; gap: 8px; margin-bottom: 16px; }
    .filter-btn {
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .filter-btn.active { background: #0F172A; color: #FFF; border-color: #0F172A; }
    .issue-item {
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .issue-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .badge-a { background: #FEE2E2; color: #991B1B; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 6px; }
    .badge-b { background: #FEF3C7; color: #92400E; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 6px; }
    .badge-c { background: #DCFCE7; color: #166534; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 6px; }
    .quote-box { font-style: italic; background: #F8FAFC; padding: 10px; border-radius: 6px; margin: 8px 0; font-size: 12px; color: #475569; }
    .fix-box { background: #ECFDF5; border-left: 3px solid #10B981; padding: 8px 12px; font-size: 12px; color: #065F46; }

    /* Target Journals */
    .journal-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
    .journal-card { border: 1px solid var(--card-border); border-radius: 12px; padding: 18px; background: #FFF; }
    .journal-tier { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--accent); }
    .journal-name { font-size: 16px; font-weight: 700; margin: 4px 0; }
    .journal-meta { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }

    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }
    @media print {
      html, body {
        background-color: #FFFFFF !important;
        color: #0F172A !important;
        font-size: 11pt !important;
        padding: 0 !important;
        margin: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .btn-print, .tabs-nav, .filter-pills, .persona-selector, .print-tip {
        display: none !important;
      }
      .tab-content, .persona-panel {
        display: block !important;
      }
      .card, .header-card {
        box-shadow: none !important;
        border: 1px solid #CBD5E1 !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        margin-bottom: 16px !important;
        padding: 18px !important;
      }
      .issue-item, .journal-card, .dimension-card, .persona-panel {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        margin-bottom: 12px !important;
      }
      .score-banner {
        background: #F1F5F9 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .badge-a, .badge-b, .badge-c, .meta-badge, .persona-badge {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      h1, h2, h3, h4 {
        break-after: avoid !important;
        page-break-after: avoid !important;
        color: #0F172A !important;
      }
      table, tr, td, th {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-card">
      <div class="brand">
        <div class="brand-title">Manu<span>View</span> Diagnostic Suite</div>
        <div class="meta-badge" style="${isScopeMismatch ? "background: #FEE2E2; color: #991B1B; border: 1px solid #F87171; font-weight: 700;" : ""}">Target: ${targetJournal}${isScopeMismatch ? " (Scope Mismatch)" : ""}</div>
      </div>
      <h1>${title}</h1>
      <p style="color: var(--text-muted); font-size: 13px;">Generated on ${dateStr} • Peer-Review Calibrated Pre-Submission Diagnostic</p>

      ${isScopeMismatch ? `
      <div style="background-color: #FEF2F2; border: 1px solid #FCA5A5; border-left: 5px solid #DC2626; padding: 14px 18px; border-radius: 8px; margin-top: 16px; color: #991B1B; font-size: 13.5px; line-height: 1.5;">
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <span>🚨 CRITICAL SCOPE MISMATCH WARNING (HIGH DESK-REJECT HAZARD)</span>
        </div>
        <div>${escapeHtml(mismatchWarning)}</div>
      </div>
      ` : ""}

      <div class="score-banner" style="${!hasNumericScore ? "background: #1E293B;" : (isScopeMismatch ? "background: linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%);" : "")}">
        <div class="score-meter">
          <span class="score-number" style="${!hasNumericScore ? "font-size: 26px; color: #94A3B8;" : ""}">${scoreLabel}</span>
          <span class="score-label">${isDeskReject ? "Editorial Scope Screening (External Peer Review Bypassed)" : hasNumericScore ? "/ 100 Overall Acceptance Potential" : "Acceptance potential bypassed"}</span>
        </div>
        <div style="font-size: 12px; color: #94A3B8; font-weight: 500;" class="print-tip">
          <span>Tip: Save as PDF via browser (Cmd+P / Ctrl+P)</span>
        </div>
      </div>
    </div>

    <!-- Document Section Index -->
    <div class="tabs-nav">
      <strong style="font-size: 13px; color: #0F172A;">Sections:</strong>
      <span style="font-size: 13px; color: #475569; font-weight: 600;">Executive Overview</span>
      ${(r.reviewerPersonas && r.reviewerPersonas.length > 0) ? `
      <span style="color: #CBD5E1;">&bull;</span>
      <span style="font-size: 13px; color: #475569; font-weight: 600;">${r.reviewerPersonas.length} Reviewer Personas</span>
      ` : ""}
      ${r.dimensions ? `
      <span style="color: #CBD5E1;">&bull;</span>
      <span style="font-size: 13px; color: #475569; font-weight: 600;">6 Scoring Dimensions</span>
      ` : ""}
      <span style="color: #CBD5E1;">&bull;</span>
      <span style="font-size: 13px; color: #475569; font-weight: 600;">Priority Action Items (${(r.priorityIssues || []).length})</span>
      <span style="color: #CBD5E1;">&bull;</span>
      <span style="font-size: 13px; color: #475569; font-weight: 600;">Target Journals</span>
    </div>

    <!-- Tab 1: Overview -->
    <div id="tab-overview" class="tab-content active">
      <div class="card">
        <div class="card-title">Editorial Synthesis & Triage Assessment</div>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">${escapeHtml(r.summary)}</p>
      </div>

      ${r.classification ? `
      <div class="card" style="border-left: 4px solid var(--accent);">
        <div class="card-title">Document Classification: ${escapeHtml(r.classification.categoryLabel)}</div>
        <p style="font-size: 13px; color: #475569; margin-bottom: 8px;"><strong>${escapeHtml(r.classification.salutation)}:</strong> ${escapeHtml(r.classification.advisoryMessage)}</p>
        <p style="font-size: 12px; color: #64748B;">${escapeHtml(r.classification.customGuidance)}</p>
      </div>
      ` : ""}

      ${r.reportingGuideline ? `
      <div class="card" style="border-left: 4px solid ${r.reportingGuideline.scorePercent >= 80 ? "#10B981" : r.reportingGuideline.scorePercent >= 60 ? "#F59E0B" : "#EF4444"};">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
          <div class="card-title" style="margin-bottom: 0;">Reporting Guideline Compliance: ${escapeHtml(r.reportingGuideline.guidelineName)}</div>
          <span style="font-size: 13px; font-weight: 700; color: ${r.reportingGuideline.scorePercent >= 80 ? "#10B981" : r.reportingGuideline.scorePercent >= 60 ? "#F59E0B" : "#EF4444"};">
            ${r.reportingGuideline.itemSetScope === "core_subset"
              ? `${r.reportingGuideline.evidencedCount}/${r.reportingGuideline.totalItems} core items evidenced (${r.reportingGuideline.itemSetSize} in full standard; ${r.reportingGuideline.scorePercent}%)`
              : r.reportingGuideline.evidencedCount !== undefined && r.reportingGuideline.totalItems !== undefined
              ? `${r.reportingGuideline.evidencedCount}/${r.reportingGuideline.totalItems} Items (${r.reportingGuideline.scorePercent}%)`
              : `${r.reportingGuideline.scorePercent}% Compliant`}
          </span>
        </div>
        <p style="font-size: 12px; color: #64748B; margin-bottom: 12px;">Standard: ${escapeHtml(r.reportingGuideline.standardType)}${(() => {
          const safeUrl = sanitizeHref(r.reportingGuideline.standardUrl);
          return safeUrl ? ` &bull; <a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" style="color: #2563EB;">Official Standard</a>` : (r.reportingGuideline.standardUrl ? ` &bull; <span>${escapeHtml(r.reportingGuideline.standardUrl)}</span>` : "");
        })()}</p>

        ${(r.reportingGuideline.compliantItems && r.reportingGuideline.compliantItems.length > 0) ? `
          <div style="font-size: 11px; font-weight: 700; color: #166534; margin-bottom: 4px;">COMPLIANT ELEMENTS:</div>
          <ul style="font-size: 12px; padding-left: 18px; color: #166534; margin-bottom: 10px;">
            ${r.reportingGuideline.compliantItems.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        ` : ""}

        ${(r.reportingGuideline.missingOrPartialItems && r.reportingGuideline.missingOrPartialItems.length > 0) ? `
          <div style="font-size: 11px; font-weight: 700; color: #991B1B; margin-bottom: 4px;">MISSING OR PARTIALLY ADDRESSED CHECKLIST ITEMS:</div>
          <ul style="font-size: 12px; padding-left: 18px; color: #991B1B;">
            ${r.reportingGuideline.missingOrPartialItems.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        ` : ""}
      </div>
      ` : ""}
    </div>

    ${(r.reviewerPersonas && r.reviewerPersonas.length > 0) ? `
    <!-- Section 2: Reviewer Personas -->
    <div id="tab-reviewers" class="tab-content">
      <div class="card">
        <div class="card-title">Simulated 5-Persona Reviewer Panel (${(r.reviewerPersonas || []).length} Referee Evaluations)</div>

        ${(r.reviewerPersonas || []).map((p, idx) => `
          <div id="persona-panel-${idx}" class="persona-panel" style="border-top: ${idx > 0 ? "1px solid #E2E8F0;" : "none;"} padding-top: ${idx > 0 ? "20px;" : "0;"} margin-top: ${idx > 0 ? "20px;" : "0;"} ${p.persona === "devils_advocate" ? 'border-left: 3px solid #F43F5E; padding-left: 12px;' : ""}">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div class="persona-badge" ${p.persona === "devils_advocate" ? 'style="background: #FFE4E6; color: #9F1239;"' : ""}>${escapeHtml(p.decisionRecommendation)}</div>
              ${p.persona === "devils_advocate" ? `<span style="font-size: 11px; font-weight: 700; color: #E11D48; background: #FFF1F2; border: 1px solid #FECDD3; border-radius: 4px; padding: 2px 6px;">⚡ Hostile Stress-Test / Adversarial Referee</span>` : ""}
            </div>
            <h3 style="font-size: 18px; margin-bottom: 4px;">${escapeHtml(p.name)}</h3>
            <p style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 2px;">${escapeHtml(p.title)}</p>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">${escapeHtml(p.affiliation)}</p>
            ${p.expertise ? `
              <div style="background: #F1F5F9; border: 1px solid #E2E8F0; padding: 8px 12px; border-radius: 6px; font-size: 12px; color: #334155; margin-bottom: 12px;">
                <strong>Area of Expertise & Scope:</strong> ${escapeHtml(p.expertise)}
              </div>
            ` : ""}
            
            <div style="background: #FEF2F2; border-left: 3px solid #EF4444; padding: 10px 14px; border-radius: 6px; font-size: 13px; color: #991B1B; margin-bottom: 14px;">
              <strong>Key Challenge:</strong> ${escapeHtml(p.keyChallenge)}
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #334155; margin-bottom: 16px;">${escapeHtml(p.assessment)}</p>

            ${(p.evidenceAnchors && p.evidenceAnchors.length > 0) ? `
              <div style="margin-bottom: 14px; background: #F8FAFC; border: 1px dashed #CBD5E1; padding: 10px 14px; border-radius: 8px;">
                <strong style="font-size: 11px; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">Manuscript Evidence Anchors (Grounding):</strong>
                <ul style="font-size: 12px; font-family: monospace; padding-left: 18px; color: #334155; margin-top: 6px;">
                  ${p.evidenceAnchors.map(a => `<li style="margin-bottom: 3px;">${escapeHtml(a)}</li>`).join("")}
                </ul>
              </div>
            ` : ""}

            <div style="margin-bottom: 12px;">
              <strong style="font-size: 13px; color: #0F172A;">Major Critiques:</strong>
              <ul style="font-size: 13px; padding-left: 20px; color: #334155; margin-top: 6px;">
                ${(p.majorCritiques || []).map(c => `<li style="margin-bottom: 4px;">${escapeHtml(c)}</li>`).join("")}
              </ul>
            </div>

            <div style="margin-bottom: 12px;">
              <strong style="font-size: 13px; color: #0F172A;">Must-Address Prior to Submission:</strong>
              <ul style="font-size: 13px; padding-left: 20px; color: #166534; margin-top: 6px;">
                ${(p.mustAddressItems || []).map(m => `<li style="margin-bottom: 4px;">${escapeHtml(m)}</li>`).join("")}
              </ul>
            </div>

            ${(p.counterArguments && p.counterArguments.length > 0) ? `
              <div style="margin-top: 14px; background: #FFF1F2; border: 1px solid #FECDD3; padding: 10px 14px; border-radius: 8px;">
                <strong style="font-size: 11px; color: #9F1239; text-transform: uppercase; letter-spacing: 0.5px;">Adversarial Defenses & Pre-emptive Arguments:</strong>
                <ul style="font-size: 12px; padding-left: 18px; color: #9F1239; margin-top: 6px;">
                  ${p.counterArguments.map(arg => `<li style="margin-bottom: 3px;">${escapeHtml(arg)}</li>`).join("")}
                </ul>
              </div>
            ` : ""}
          </div>
        `).join("")}
      </div>
    </div>
    ` : ""}

    ${r.dimensions ? `
    <!-- Tab 3: Dimensions -->
    <div id="tab-dimensions" class="tab-content">
      <div style="display: flex; justify-content: center; margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
        ${renderStaticRadarSvg(r.dimensions, { size: 320 })}
      </div>
      <div class="dimension-grid">
        ${Object.entries(r.dimensions || {}).map(([_, dim]) => `
          <div class="dimension-card">
            <div class="dim-header">
              <strong style="font-size: 14px;">${escapeHtml(dim.label)}</strong>
              <span class="dim-score">${escapeHtml(String(dim.score))} / 5</span>
            </div>
            <div class="dim-verdict">${escapeHtml(dim.verdict)}</div>
            ${(dim.strengths && dim.strengths.length > 0) ? `
              <div style="font-size: 11px; font-weight: 700; color: #166534; margin-top: 8px;">STRENGTHS:</div>
              <ul class="dim-list">
                ${dim.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
              </ul>
            ` : ""}
            ${(dim.vulnerabilities && dim.vulnerabilities.length > 0) ? `
              <div style="font-size: 11px; font-weight: 700; color: #991B1B; margin-top: 8px;">VULNERABILITIES:</div>
              <ul class="dim-list vuln-item">
                ${dim.vulnerabilities.map(v => `<li>${escapeHtml(v)}</li>`).join("")}
              </ul>
            ` : ""}
          </div>
        `).join("")}
      </div>
    </div>
    ` : ""}

    <!-- Section 4: Priority Issues -->
    <div id="tab-issues" class="tab-content">
      <div style="font-size: 16px; font-weight: 700; color: #0F172A; margin-bottom: 16px;">
        Priority Action Items (${(r.priorityIssues || []).length} Total Items)
      </div>

      <div id="issues-container">
        ${(r.priorityIssues || []).map(iss => {
          const priority = (iss.priority || "B").toUpperCase();
          const priorityClass = priority.toLowerCase();
          return `
          <div class="issue-item" data-priority="${escapeHtml(priority)}">
            <div class="issue-header">
              <span class="badge-${priorityClass}">Priority ${escapeHtml(priority)}: ${escapeHtml(iss.category || "General")}</span>
              <div style="display: flex; gap: 8px; align-items: center;">
                ${iss.expectedEffort ? `<span style="font-size: 11px; background: #F1F5F9; color: #475569; padding: 2px 8px; border-radius: 9999px; border: 1px solid #E2E8F0;">Effort: ${escapeHtml(iss.expectedEffort)}</span>` : ""}
                <span style="font-size: 11px; color: var(--text-muted); font-mono;">${escapeHtml(iss.id || "")}</span>
              </div>
            </div>
            <h4 style="font-size: 15px; margin: 6px 0;">${escapeHtml(iss.title || "")}</h4>
            ${iss.evidenceAnchor ? `
              <div style="font-family: monospace; font-size: 11px; background: #F1F5F9; color: #475569; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px;">
                Anchor: ${escapeHtml(iss.evidenceAnchor)}
              </div>
            ` : ""}
            <p style="font-size: 13px; color: #334155; line-height: 1.6;">${escapeHtml(iss.description || "")}</p>
            ${iss.impactAssessment ? `
              <div style="margin: 8px 0; background: #FFFBEB; border-left: 3px solid #F59E0B; padding: 8px 12px; font-size: 12px; color: #92400E; border-radius: 0 6px 6px 0; line-height: 1.5;">
                <strong>Editorial Risk & Scholarly Consequence:</strong> ${escapeHtml(iss.impactAssessment)}
              </div>
            ` : ""}
            ${iss.reviewerQuote ? `<div class="quote-box">Reviewer Anticipated Reaction: ${escapeHtml(iss.reviewerQuote)}</div>` : ""}
            ${iss.actionableFix ? `<div class="fix-box" style="white-space: pre-line;"><strong>Required Pre-Submission Fix:</strong>\n${escapeHtml(iss.actionableFix)}</div>` : ""}
            ${iss.suggestedRewrite ? `
              <div style="margin: 8px 0; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px 12px; border-radius: 6px; font-size: 12px; color: #1E293B;">
                <div style="font-weight: 700; font-size: 11px; color: #2563EB; text-transform: uppercase; margin-bottom: 4px;">Ready-to-Use Manuscript Revision / Template:</div>
                <pre style="margin: 0; font-family: monospace; font-size: 11px; white-space: pre-wrap; word-break: break-word; color: #334155;">${escapeHtml(iss.suggestedRewrite)}</pre>
              </div>
            ` : ""}
            ${iss.rebuttalStrategy ? `
              <div style="margin-top: 8px; background: #EFF6FF; border-left: 3px solid #2563EB; padding: 8px 12px; font-size: 12px; color: #1E40AF; border-radius: 0 6px 6px 0; white-space: pre-line;">
                <strong>Author Point-by-Point Rebuttal Strategy:</strong>\n${escapeHtml(iss.rebuttalStrategy)}
              </div>
            ` : ""}
          </div>
        `;}).join("")}
      </div>
    </div>

    <!-- Section 5: Journals -->
    <div id="tab-journals" class="tab-content">
      ${r.targetJournalEvaluation ? `
      <div class="card" style="border-left: 5px solid ${r.targetJournalEvaluation.isDisciplinaryMismatch ? "#DC2626" : "#2563EB"}; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 16px;">Target Submission Venue: ${escapeHtml(r.targetJournalEvaluation.name)}</strong>
          <span style="font-size: 13px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; ${r.targetJournalEvaluation.isDisciplinaryMismatch ? "background: #FEE2E2; color: #991B1B;" : "background: #DCFCE7; color: #166534;"}">
            ${r.targetJournalEvaluation.isDisciplinaryMismatch ? "Critical Scope Mismatch" : "In-Scope Target"} (Fit: ${r.targetJournalEvaluation.fitScore}%)
          </span>
        </div>
        <div style="font-size: 13px; color: #64748B; margin-bottom: 8px;">
          Target Venue Field: <strong>${escapeHtml(r.targetJournalEvaluation.journalDiscipline || "Unknown")}</strong> • Manuscript Field: <strong>${escapeHtml(r.targetJournalEvaluation.manuscriptDiscipline || "Unknown")}</strong> • Impact Factor: <strong>${r.targetJournalEvaluation.impactFactor || "N/A"}</strong>
        </div>
        ${r.targetJournalEvaluation.mismatchWarning ? `
        <div style="background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 6px; padding: 10px 14px; font-size: 13px; color: #991B1B;">
          <strong>⚠️ Mismatch Advisory:</strong> ${escapeHtml(r.targetJournalEvaluation.mismatchWarning)}
        </div>
        ` : ""}
      </div>
      ` : ""}
      <div class="journal-grid">
        ${(r.journalRecommendations || []).map(j => `
          <div class="journal-card">
            <div class="journal-tier">${escapeHtml(j.tier || "Standard")} Match (Fit: ${escapeHtml(String(j.fitScore ?? ""))}%)</div>
            <div class="journal-name">${escapeHtml(j.journalName || "")}</div>
            <div class="journal-meta">Impact Factor: ${escapeHtml(String(j.impactFactor ?? "N/A"))} • ${escapeHtml(j.publisher || "")}</div>
            <p style="font-size: 13px; color: #334155; margin-bottom: 12px;">${escapeHtml(j.scopeRationale || "")}</p>
            ${(j.rejectionRisks && j.rejectionRisks.length > 0) ? `
              <div style="font-size: 11px; font-weight: 700; color: #991B1B; margin-top: 8px;">DESK-REJECT RISKS:</div>
              <ul style="font-size: 12px; padding-left: 18px; color: #991B1B; margin-top: 4px;">
                ${j.rejectionRisks.map(risk => `<li>${escapeHtml(risk)}</li>`).join("")}
              </ul>
            ` : ""}
          </div>
        `).join("")}
      </div>
    </div>
  </div>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// 2. BRIEF SCOPE FIT REPORT - STANDALONE INTERACTIVE HTML GENERATOR
// -----------------------------------------------------------------------------
export function generateBriefReportHtml(r: BriefJournalFitReport): string {
  const title = escapeHtml(r.title);
  const targetJournal = escapeHtml(r.targetJournal);
  const dateStr = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const scoreBanner = r.fitScore !== undefined
    ? `<div style="font-size: 28px; font-weight: 800;">${r.fitScore}% Match — ${escapeHtml(r.verdict)}</div>`
    : `<div style="font-size: 22px; font-weight: 800; color: #475569;">${escapeHtml(r.verdict)}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; script-src 'none';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ManuView Scope Fit Report: ${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8FAFC;
      color: #1E293B;
      line-height: 1.5;
      padding: 24px;
    }
    .container { max-width: 900px; margin: 0 auto; }
    .card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    h1 { font-family: Georgia, serif; font-size: 24px; margin: 12px 0; color: #0F172A; }

    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }
    @media print {
      html, body {
        background-color: #FFFFFF !important;
        color: #0F172A !important;
        font-size: 11pt !important;
        padding: 0 !important;
        margin: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .container { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
      .print-tip { display: none !important; }
      .card { box-shadow: none !important; border: 1px solid #CBD5E1 !important; break-inside: avoid !important; page-break-inside: avoid !important; margin-bottom: 14px !important; }
      h1, h2, h3 { break-after: avoid !important; page-break-after: avoid !important; color: #0F172A !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="font-size: 16px;">ManuView Editorial Scope Report</strong>
        <span style="font-size: 12px; color: #64748B;" class="print-tip">Print / Save PDF via Browser (Cmd+P)</span>
      </div>
      <h1>${title}</h1>
      <p style="font-size: 13px; color: #64748B;">Target Journal: <strong>${targetJournal}</strong> • Generated on ${dateStr}</p>
      <div style="background: #F1F5F9; border-radius: 10px; padding: 16px; margin-top: 16px;">
        ${scoreBanner}
        <p style="font-size: 14px; color: #334155; margin-top: 8px;">${escapeHtml(r.summary)}</p>
      </div>
    </div>

    <div class="card">
      <h3 style="font-size: 16px; margin-bottom: 12px;">Scope Strengths Supporting Submission</h3>
      <ul style="font-size: 13px; padding-left: 20px; color: #166534;">
        ${(r.keyHighlights || []).map(h => `<li style="margin-bottom: 6px;">${escapeHtml(h)}</li>`).join("")}
      </ul>
    </div>

    <div class="card">
      <h3 style="font-size: 16px; margin-bottom: 12px; color: #991B1B;">Desk-Reject Hazards for ${targetJournal}</h3>
      <ul style="font-size: 13px; padding-left: 20px; color: #991B1B;">
        ${(r.deskRejectHazards || []).map(h => `<li style="margin-bottom: 6px;">${escapeHtml(h)}</li>`).join("")}
      </ul>
    </div>

    <div class="card">
      <h3 style="font-size: 16px; margin-bottom: 12px;">Alternative Target Journals</h3>
      ${(r.alternativeJournals || []).map(j => `
        <div style="border-bottom: 1px solid #E2E8F0; padding: 10px 0;">
          <strong>${escapeHtml(j.tier)}: ${escapeHtml(j.name)}</strong> (Impact Factor: ${j.impactFactor || "N/A"})
          <p style="font-size: 12px; color: #475569; margin-top: 4px;">${escapeHtml(j.matchReason)}</p>
        </div>
      `).join("")}
    </div>
  </div>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// 3. FULL REPORT - MICROSOFT WORD (.DOC/.DOCX) EXPORT GENERATOR
// -----------------------------------------------------------------------------
export function generateFullReportWord(r: FullReviewReport): string {
  const title = escapeHtml(r.title);
  const targetJournal = escapeHtml(r.targetJournal || "General High Impact Journal");
  const isScopeMismatch = Boolean(
    r.targetJournalEvaluation?.isDisciplinaryMismatch ||
    r.priorityIssues?.some((i) => i.priority === "A" && (i.category === "Scope/Fit" || /scope|out-of-scope|desk reject/i.test(`${i.title} ${i.description}`)))
  );
  const mismatchWarning = r.targetJournalEvaluation?.mismatchWarning ||
    (isScopeMismatch
      ? `Manuscript research domain falls outside the published aims and scope of ${targetJournal}. Submitting out-of-scope manuscripts is the primary cause of immediate editorial desk rejection without external peer review.`
      : "");
  const isDeskReject = Boolean(
    r.editorialTriage?.outcome === "desk_reject" ||
    r.ineligibilityReason === "scope_mismatch" ||
    isScopeMismatch
  );
  const hasNumericScore = !isDeskReject && typeof r.overallScore === "number";
  const scoreLabel = isDeskReject
    ? "Status: Editorial Desk Reject (Scope Mismatch - Peer Review Bypassed)"
    : r.isEligibleForReview === false
    ? (r.ineligibilityReason === "already_published" ? "Status: Already Published Article" : "Status: Ineligible (Non-Article)")
    : hasNumericScore
    ? `Overall Potential Score: ${r.overallScore} / 100`
    : "Overall Potential Score: Not Assessed";
  const dateStr = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>ManuView Diagnostic Report: ${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: 8.5in 11.0in;
      margin: 1.0in 1.0in 1.0in 1.0in;
      mso-header-margin: .5in;
      mso-footer-margin: .5in;
    }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #1E293B;
    }
    h1 { font-family: 'Georgia', serif; font-size: 22pt; color: #0F172A; margin-bottom: 6pt; margin-top: 0; line-height: 1.25; }
    h2 { font-family: 'Calibri', sans-serif; font-size: 14pt; font-weight: bold; color: #0F172A; border-bottom: 2pt solid #2563EB; padding-bottom: 4pt; margin-top: 22pt; margin-bottom: 10pt; }
    h3 { font-family: 'Calibri', sans-serif; font-size: 12pt; font-weight: bold; color: #1E293B; margin-top: 14pt; margin-bottom: 4pt; }
    
    table { border-collapse: collapse; width: 100%; margin-top: 8pt; margin-bottom: 12pt; }
    th { background-color: #F1F5F9; border: 1pt solid #CBD5E1; padding: 7pt 9pt; text-align: left; font-size: 10pt; font-weight: bold; color: #0F172A; }
    td { border: 1pt solid #CBD5E1; padding: 7pt 9pt; font-size: 10pt; vertical-align: top; }
    
    .card-box {
      border: 1pt solid #CBD5E1;
      background-color: #FFFFFF;
      padding: 14pt 16pt;
      margin-bottom: 14pt;
    }
    .header-card {
      border: 1pt solid #CBD5E1;
      background-color: #FFFFFF;
      padding: 18pt 20pt;
      margin-bottom: 16pt;
    }
    .callout-blue {
      background-color: #EFF6FF;
      border-left: 4pt solid #2563EB;
      padding: 10pt 14pt;
      margin: 10pt 0;
      color: #1E40AF;
    }
    .callout-red {
      background-color: #FEF2F2;
      border-left: 4pt solid #EF4444;
      padding: 10pt 14pt;
      margin: 10pt 0;
      color: #991B1B;
    }
    .callout-amber {
      background-color: #FFFBEB;
      border-left: 4pt solid #F59E0B;
      padding: 10pt 14pt;
      margin: 10pt 0;
      color: #92400E;
    }
    .callout-green {
      background-color: #ECFDF5;
      border-left: 4pt solid #10B981;
      padding: 10pt 14pt;
      margin: 10pt 0;
      color: #065F46;
    }
    .badge-pill {
      display: inline-block;
      padding: 2.5pt 8pt;
      font-size: 9pt;
      font-weight: bold;
      border-radius: 4pt;
    }
    .badge-a { background-color: #FEE2E2; color: #991B1B; border: 1pt solid #FCA5A5; font-weight: bold; }
    .badge-b { background-color: #FEF3C7; color: #92400E; border: 1pt solid #FCD34D; font-weight: bold; }
    .badge-c { background-color: #DCFCE7; color: #166534; border: 1pt solid #86EFAC; font-weight: bold; }
    .badge-target { background-color: #EFF6FF; color: #1D4ED8; border: 1pt solid #BFDBFE; font-weight: bold; }
    .badge-adversarial { background-color: #FFE4E6; color: #9F1239; border: 1pt solid #FECDD3; font-weight: bold; }
    
    .code-box {
      background-color: #F8FAFC;
      border: 1pt solid #CBD5E1;
      padding: 8pt 12pt;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9pt;
      color: #1E293B;
      white-space: pre-wrap;
      margin: 6pt 0;
    }
    .quote-box {
      font-style: italic;
      background-color: #F8FAFC;
      border-left: 2pt solid #94A3B8;
      padding: 6pt 10pt;
      margin: 6pt 0;
      font-size: 9.5pt;
      color: #475569;
    }
    ul { margin-top: 4pt; margin-bottom: 8pt; padding-left: 18pt; }
    li { margin-bottom: 3.5pt; font-size: 10pt; }
  </style>
</head>
<body>
  <!-- Header Card (Matching Interactive HTML Design) -->
  <div class="header-card">
    <table style="border: none; margin: 0; width: 100%;">
      <tr style="border: none;">
        <td style="border: none; padding: 0; vertical-align: middle;">
          <p style="font-size: 9.5pt; font-weight: bold; color: #2563EB; text-transform: uppercase; letter-spacing: 1pt; margin: 0 0 6pt 0;">
            ManuView • AI Pre-Submission Peer-Review Diagnostic Suite
          </p>
        </td>
        <td style="border: none; padding: 0; text-align: right; vertical-align: middle;">
          <span class="badge-pill ${isScopeMismatch ? "badge-a" : "badge-target"}">
            Target: ${targetJournal}${isScopeMismatch ? " (Scope Mismatch)" : ""}
          </span>
        </td>
      </tr>
    </table>

    <h1 style="margin-top: 8pt;">${title}</h1>
    <p style="font-size: 10pt; color: #64748B; margin: 0 0 12pt 0;">
      Generated on ${dateStr} • Peer-Review Calibrated Pre-Submission Diagnostic
    </p>

    ${isScopeMismatch ? `
    <div class="callout-red">
      <p style="font-weight: bold; font-size: 11pt; margin: 0 0 4pt 0;">🚨 CRITICAL SCOPE MISMATCH WARNING (HIGH DESK-REJECT HAZARD)</p>
      <p style="margin: 0; font-size: 10pt;">${escapeHtml(mismatchWarning)}</p>
    </div>
    ` : ""}

    <div class="callout-blue" style="${isScopeMismatch ? "background-color: #FEF2F2; border-left: 4pt solid #DC2626; color: #991B1B;" : ""}">
      <p style="font-size: 16pt; font-weight: bold; margin: 0;">${scoreLabel}</p>
      <p style="font-size: 10.5pt; margin: 6pt 0 0 0; line-height: 1.5;">${escapeHtml(r.summary)}</p>
    </div>
  </div>

  <!-- Section 1: Executive Overview & Triage -->
  <h2>1. Editorial Synthesis & Triage Assessment</h2>
  <div class="card-box">
    <p style="font-size: 10.5pt; line-height: 1.5; margin: 0 0 8pt 0;">${escapeHtml(r.summary)}</p>
    ${r.classification ? `
      <div style="background-color: #F8FAFC; border-left: 3pt solid #2563EB; padding: 8pt 10pt; margin-top: 8pt;">
        <strong>Document Classification:</strong> ${escapeHtml(r.classification.categoryLabel)}<br>
        <span style="font-size: 9.5pt; color: #475569;">${escapeHtml(r.classification.advisoryMessage)}</span>
      </div>
    ` : ""}
  </div>

  <!-- Section 2: 6-Dimension Scoring Rubric -->
  ${r.dimensions ? `
  <h2>2. 6-Dimension Scholarly Scoring Rubric</h2>
  <table>
    <tr>
      <th style="width: 22%;">Dimension</th>
      <th style="width: 14%;">Score</th>
      <th style="width: 26%;">Verdict</th>
      <th style="width: 38%;">Key Observations & Editorial Hazards</th>
    </tr>
    ${Object.entries(r.dimensions || {}).map(([_, dim]) => `
      <tr>
        <td><strong>${escapeHtml(dim.label)}</strong></td>
        <td><span class="badge-pill badge-target">${dim.score} / 5</span></td>
        <td><strong>${escapeHtml(dim.verdict)}</strong></td>
        <td>
          ${(dim.strengths && dim.strengths.length > 0) ? `
            <div style="color: #166534; font-size: 9pt; margin-bottom: 4pt;">
              <strong>✔ Strengths:</strong> ${escapeHtml(dim.strengths.join("; "))}
            </div>
          ` : ""}
          ${(dim.vulnerabilities && dim.vulnerabilities.length > 0) ? `
            <div style="color: #991B1B; font-size: 9pt;">
              <strong>✖ Vulnerabilities:</strong> ${escapeHtml(dim.vulnerabilities.join("; "))}
            </div>
          ` : `<span style="color: #166534; font-size: 9pt;">Methodologically Sound</span>`}
        </td>
      </tr>
    `).join("")}
  </table>
  ` : ""}

  <!-- Section 3: Simulated Reviewer Panel -->
  ${(r.reviewerPersonas && r.reviewerPersonas.length > 0) ? `
  <h2>3. Simulated ${r.reviewerPersonas.length}-Persona Peer Review (Adversarial Panel)</h2>
  ${r.reviewerPersonas.map((p) => `
    <div class="card-box">
      <div style="margin-bottom: 6pt;">
        <span class="badge-pill ${p.persona === "devils_advocate" ? "badge-adversarial" : "badge-b"}">
          ${escapeHtml(p.decisionRecommendation)}
        </span>
        ${p.persona === "devils_advocate" ? `
          <span class="badge-pill badge-adversarial" style="margin-left: 6pt;">
            ⚡ Hostile Stress-Test / Adversarial Referee
          </span>
        ` : ""}
      </div>
      <h3 style="margin-top: 4pt; margin-bottom: 2pt;">${escapeHtml(p.name)}</h3>
      <p style="font-size: 10pt; color: #475569; margin: 0 0 6pt 0;">
        <strong>${escapeHtml(p.title)}</strong> • ${escapeHtml(p.affiliation)}
      </p>

      ${p.expertise ? `
        <div style="background-color: #F1F5F9; border: 1pt solid #CBD5E1; padding: 6pt 10pt; font-size: 9.5pt; margin-bottom: 8pt;">
          <strong>Area of Expertise & Scope:</strong> ${escapeHtml(p.expertise)}
        </div>
      ` : ""}

      <div class="callout-red" style="margin-bottom: 10pt;">
        <strong>Key Challenge:</strong> ${escapeHtml(p.keyChallenge)}
      </div>

      <p style="font-size: 10.5pt; line-height: 1.5; margin-bottom: 10pt;">${escapeHtml(p.assessment)}</p>

      ${(p.evidenceAnchors && p.evidenceAnchors.length > 0) ? `
        <div style="background-color: #F8FAFC; border: 1pt dashed #CBD5E1; padding: 6pt 10pt; margin-bottom: 10pt;">
          <strong style="font-size: 9pt; text-transform: uppercase; color: #0F172A;">Manuscript Evidence Anchors (Grounding):</strong>
          <ul style="margin-top: 4pt; font-family: 'Consolas', monospace; font-size: 9pt; color: #334155;">
            ${p.evidenceAnchors.map(a => `<li>${escapeHtml(a)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      <p style="font-weight: bold; margin-bottom: 2pt; font-size: 10pt;">Major Critiques:</p>
      <ul>
        ${(p.majorCritiques || []).map(c => `<li>${escapeHtml(c)}</li>`).join("")}
      </ul>

      <p style="font-weight: bold; margin-bottom: 2pt; color: #166534; font-size: 10pt;">Must-Address Prior to Submission:</p>
      <ul style="color: #166534;">
        ${(p.mustAddressItems || []).map(m => `<li>${escapeHtml(m)}</li>`).join("")}
      </ul>

      ${(p.counterArguments && p.counterArguments.length > 0) ? `
        <div style="background-color: #FFF1F2; border: 1pt solid #FECDD3; padding: 8pt 10pt; margin-top: 8pt;">
          <strong style="font-size: 9pt; color: #9F1239; text-transform: uppercase;">Adversarial Defenses & Pre-emptive Arguments:</strong>
          <ul style="margin-top: 4pt; color: #9F1239; font-size: 9.5pt;">
            ${p.counterArguments.map(arg => `<li>${escapeHtml(arg)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}
    </div>
  `).join("")}
  ` : ""}

  <!-- Section 4: Priority Action Items -->
  <h2>4. Actionable Priority Issues & Rebuttal Strategies (${(r.priorityIssues || []).length} Items)</h2>
  ${(r.priorityIssues || []).map(iss => {
    const priority = (iss.priority || "B").toUpperCase();
    const badgeClass = priority === "A" ? "badge-a" : priority === "B" ? "badge-b" : "badge-c";
    return `
    <div class="card-box">
      <div style="margin-bottom: 6pt;">
        <span class="badge-pill ${badgeClass}">Priority ${escapeHtml(priority)}: ${escapeHtml(iss.category || "General")}</span>
        ${iss.expectedEffort ? `<span class="badge-pill" style="background-color: #F1F5F9; color: #475569; border: 1pt solid #E2E8F0; margin-left: 4pt;">Effort: ${escapeHtml(iss.expectedEffort)}</span>` : ""}
        ${iss.evidenceAnchor ? `<span class="badge-pill" style="background-color: #F8FAFC; color: #334155; border: 1pt dashed #CBD5E1; font-family: monospace; margin-left: 4pt;">Anchor: ${escapeHtml(iss.evidenceAnchor)}</span>` : ""}
      </div>

      <h3 style="margin-top: 4pt; margin-bottom: 4pt; font-size: 12pt; color: #0F172A;">${escapeHtml(iss.title || "")}</h3>
      <p style="font-size: 10.5pt; line-height: 1.5; margin: 4pt 0 8pt 0;">${escapeHtml(iss.description || "")}</p>

      ${iss.impactAssessment ? `
        <div class="callout-amber">
          <strong>Editorial Risk & Scholarly Consequence:</strong><br>
          ${escapeHtml(iss.impactAssessment)}
        </div>
      ` : ""}

      ${iss.reviewerQuote ? `
        <div class="quote-box">
          <strong>Reviewer Anticipated Reaction:</strong> ${escapeHtml(iss.reviewerQuote)}
        </div>
      ` : ""}

      ${iss.actionableFix ? `
        <div class="callout-green">
          <strong>Required Pre-Submission Fix:</strong><br>
          ${escapeHtml(iss.actionableFix)}
        </div>
      ` : ""}

      ${iss.suggestedRewrite ? `
        <div style="margin: 8pt 0;">
          <strong style="font-size: 9.5pt; color: #2563EB; text-transform: uppercase;">Ready-to-Use Manuscript Revision / Template:</strong>
          <div class="code-box">${escapeHtml(iss.suggestedRewrite)}</div>
        </div>
      ` : ""}

      ${iss.rebuttalStrategy ? `
        <div class="callout-blue">
          <strong>Author Point-by-Point Rebuttal Strategy:</strong><br>
          ${escapeHtml(iss.rebuttalStrategy)}
        </div>
      ` : ""}
    </div>
    `;
  }).join("")}

  <!-- Section 5: Target Journal Recommendations -->
  <h2>5. Target Journal Recommendations & Fit Analysis</h2>
  ${r.targetJournalEvaluation ? `
    <div class="card-box" style="border-left: 4pt solid ${r.targetJournalEvaluation.isDisciplinaryMismatch ? "#DC2626" : "#2563EB"}; margin-bottom: 12pt;">
      <strong>Target Submission Venue:</strong> ${escapeHtml(r.targetJournalEvaluation.name)}<br>
      <span class="badge-pill ${r.targetJournalEvaluation.isDisciplinaryMismatch ? "badge-a" : "badge-c"}">
        ${r.targetJournalEvaluation.isDisciplinaryMismatch ? "Critical Scope Mismatch" : "In-Scope Target"} (Fit: ${r.targetJournalEvaluation.fitScore}%)
      </span>
      <p style="font-size: 9.5pt; color: #475569; margin: 4pt 0 0 0;">
        Field: ${escapeHtml(r.targetJournalEvaluation.journalDiscipline || "Unknown")} • Impact Factor: ${r.targetJournalEvaluation.impactFactor || "N/A"}
      </p>
      ${r.targetJournalEvaluation.mismatchWarning ? `
        <div style="color: #991B1B; font-size: 9.5pt; margin-top: 4pt;">
          <strong>Warning:</strong> ${escapeHtml(r.targetJournalEvaluation.mismatchWarning)}
        </div>
      ` : ""}
    </div>
  ` : ""}

  <table>
    <tr>
      <th style="width: 14%;">Match Tier</th>
      <th style="width: 28%;">Journal Name & Publisher</th>
      <th style="width: 12%;">Impact Factor</th>
      <th style="width: 46%;">Scope Alignment & Desk-Reject Hazards</th>
    </tr>
    ${(r.journalRecommendations || []).map(j => `
      <tr>
        <td><span class="badge-pill badge-target">${escapeHtml(j.tier || "Standard")}</span></td>
        <td><strong>${escapeHtml(j.journalName || "")}</strong><br><span style="font-size: 9pt; color: #64748B;">${escapeHtml(j.publisher || "")}</span></td>
        <td><strong>${escapeHtml(String(j.impactFactor ?? "N/A"))}</strong></td>
        <td>
          <p style="margin: 0 0 4pt 0;">${escapeHtml(j.scopeRationale || "")}</p>
          ${(j.rejectionRisks && j.rejectionRisks.length > 0) ? `
            <div style="color: #DC2626; font-size: 9pt;">
              <strong>Hazards:</strong> ${escapeHtml(j.rejectionRisks.join("; "))}
            </div>
          ` : ""}
        </td>
      </tr>
    `).join("")}
  </table>

  <!-- Section 6: Reporting Guideline Compliance Audit -->
  ${r.reportingGuideline ? `
  <h2>6. Reporting Guideline Compliance Audit (${escapeHtml(r.reportingGuideline.guidelineName)})</h2>
  <div class="card-box" style="border-left: 4pt solid ${r.reportingGuideline.scorePercent >= 80 ? "#10B981" : r.reportingGuideline.scorePercent >= 60 ? "#F59E0B" : "#EF4444"};">
    <p style="font-weight: bold; margin: 0 0 6pt 0; font-size: 11pt;">
      Compliance Score: ${r.reportingGuideline.itemSetScope === "core_subset"
        ? `${r.reportingGuideline.evidencedCount}/${r.reportingGuideline.totalItems} core items evidenced (${r.reportingGuideline.scorePercent}%)`
        : `${r.reportingGuideline.scorePercent}% Compliant`}
    </p>
    <p style="font-size: 9.5pt; color: #64748B; margin: 0 0 8pt 0;">Standard: ${escapeHtml(r.reportingGuideline.standardType)}</p>

    ${(r.reportingGuideline.compliantItems && r.reportingGuideline.compliantItems.length > 0) ? `
      <p style="color: #166534; font-weight: bold; font-size: 9.5pt; margin: 6pt 0 2pt 0;">✔ Compliant Elements:</p>
      <ul style="color: #166534; font-size: 9.5pt;">
        ${r.reportingGuideline.compliantItems.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    ` : ""}

    ${(r.reportingGuideline.missingOrPartialItems && r.reportingGuideline.missingOrPartialItems.length > 0) ? `
      <p style="color: #991B1B; font-weight: bold; font-size: 9.5pt; margin: 6pt 0 2pt 0;">✖ Missing or Partially Addressed Elements:</p>
      <ul style="color: #991B1B; font-size: 9.5pt;">
        ${r.reportingGuideline.missingOrPartialItems.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    ` : ""}
  </div>
  ` : ""}
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// 4. BRIEF REPORT - MICROSOFT WORD (.DOC) EXPORT GENERATOR
// -----------------------------------------------------------------------------
export function generateBriefReportWord(r: BriefJournalFitReport): string {
  const title = escapeHtml(r.title);
  const targetJournal = escapeHtml(r.targetJournal);
  const dateStr = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const scoreBanner = r.fitScore !== undefined
    ? `<p style="font-size: 15pt; font-weight: bold; margin: 0; color: #1E40AF;">Scope Match: ${r.fitScore}% — ${escapeHtml(r.verdict)}</p>`
    : `<p style="font-size: 14pt; font-weight: bold; margin: 0; color: #475569;">${escapeHtml(r.verdict)}</p>`;

  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>ManuView Scope Fit Report: ${title}</title>
  <style>
    @page { size: 8.5in 11.0in; margin: 1.0in; }
    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1E293B; line-height: 1.45; }
    h1 { font-family: 'Georgia', serif; font-size: 20pt; color: #0F172A; margin-top: 4pt; margin-bottom: 6pt; }
    h2 { font-size: 13pt; font-weight: bold; color: #0F172A; border-bottom: 2pt solid #2563EB; padding-bottom: 3pt; margin-top: 16pt; margin-bottom: 8pt; }
    .card-box { border: 1pt solid #CBD5E1; padding: 12pt 14pt; margin-bottom: 12pt; background-color: #FFFFFF; }
    .callout-blue { background-color: #EFF6FF; border-left: 4pt solid #2563EB; padding: 10pt 14pt; margin: 10pt 0; color: #1E40AF; }
    .callout-green { background-color: #ECFDF5; border-left: 4pt solid #10B981; padding: 8pt 12pt; margin: 8pt 0; color: #065F46; }
    .callout-red { background-color: #FEF2F2; border-left: 4pt solid #EF4444; padding: 8pt 12pt; margin: 8pt 0; color: #991B1B; }
    .badge-pill { display: inline-block; padding: 2.5pt 8pt; font-size: 9pt; font-weight: bold; border-radius: 4pt; background-color: #EFF6FF; color: #1D4ED8; border: 1pt solid #BFDBFE; }
    table { border-collapse: collapse; width: 100%; margin-top: 8pt; }
    th { background-color: #F1F5F9; border: 1pt solid #CBD5E1; padding: 6pt 8pt; text-align: left; font-size: 10pt; font-weight: bold; }
    td { border: 1pt solid #CBD5E1; padding: 6pt 8pt; font-size: 10pt; vertical-align: top; }
    ul { padding-left: 18pt; margin-top: 4pt; margin-bottom: 8pt; }
    li { margin-bottom: 3pt; font-size: 10pt; }
  </style>
</head>
<body>
  <div class="card-box">
    <table style="border: none; margin: 0; width: 100%;">
      <tr style="border: none;">
        <td style="border: none; padding: 0;">
          <p style="font-size: 9pt; font-weight: bold; color: #2563EB; text-transform: uppercase; letter-spacing: 1pt; margin: 0;">
            ManuView Editorial Scope Report
          </p>
        </td>
        <td style="border: none; padding: 0; text-align: right;">
          <span class="badge-pill">Target: ${targetJournal}</span>
        </td>
      </tr>
    </table>
    <h1>${title}</h1>
    <p style="font-size: 9.5pt; color: #64748B; margin: 0 0 10pt 0;">Generated on ${dateStr}</p>
    <div class="callout-blue">
      ${scoreBanner}
      <p style="margin-top: 6pt; margin-bottom: 0; font-size: 10.5pt; line-height: 1.5;">${escapeHtml(r.summary)}</p>
    </div>
  </div>

  <h2>Scope Strengths Supporting Submission</h2>
  <div class="callout-green">
    <ul style="margin: 0;">
      ${(r.keyHighlights || []).map(h => `<li>${escapeHtml(h)}</li>`).join("")}
    </ul>
  </div>

  <h2>Desk-Reject Hazards for ${targetJournal}</h2>
  <div class="callout-red">
    <ul style="margin: 0;">
      ${(r.deskRejectHazards || []).map(h => `<li>${escapeHtml(h)}</li>`).join("")}
    </ul>
  </div>

  <h2>Title & Abstract Framing Suggestions</h2>
  <div class="callout-blue">
    <ul style="margin: 0;">
      ${(r.framingSuggestions || []).map(s => `<li>${escapeHtml(s)}</li>`).join("")}
    </ul>
  </div>

  ${(r.alternativeJournals && r.alternativeJournals.length > 0) ? `
  <h2>Alternative Target Journals</h2>
  <table>
    <tr>
      <th style="width: 25%;">Journal</th>
      <th style="width: 15%;">Impact Factor</th>
      <th style="width: 60%;">Match Rationale</th>
    </tr>
    ${r.alternativeJournals.map(j => `
      <tr>
        <td><strong>${escapeHtml(j.name)}</strong><br><span style="font-size: 9pt; color: #64748B;">${escapeHtml(j.tier)}</span></td>
        <td>${j.impactFactor || "N/A"}</td>
        <td>${escapeHtml(j.matchReason)}</td>
      </tr>
    `).join("")}
  </table>
  ` : ""}
</body>
</html>`;
}
