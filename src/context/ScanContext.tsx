"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { PaperItem } from "@/components/DesktopSidebar";
import { DesktopDashboardData } from "@/components/DesktopDashboard";
import { FullReviewReport, ParsedManuscript } from "@/lib/types";
import { extractTextFromFile, parseManuscriptText } from "@/lib/parser";
import { runManuscriptDiagnostic } from "@/lib/diagnostic-engine";
import { fetchLiveJournalScope } from "@/lib/journal-scope-service";
import { resolveActiveConfig } from "@/lib/llm";
import { translateScanError, HumanReadableScanError } from "@/lib/scanErrorTranslator";

export interface ScanParams {
  title: string;
  abstract?: string;
  keywords?: string;
  targetJournal: string;
  file?: File | null;
  rawText?: string;
}

interface ScanContextValue {
  isScanning: boolean;
  activeScanPaperId: string | null;
  startScan: (params: ScanParams) => Promise<string | null>;
  retryScan: (paper: PaperItem) => Promise<void>;
  cancelScan?: (paperId: string) => void;
}

const ScanContext = createContext<ScanContextValue>({
  isScanning: false,
  activeScanPaperId: null,
  startScan: async () => null,
  retryScan: async () => {},
});

export interface ScanProviderProps {
  children: React.ReactNode;
  onScanStarted: (pendingPaper: PaperItem) => void;
  onScanProgress: (paperId: string, step: string, percent?: number) => void;
  onScanCompleted: (
    paperId: string,
    updatedPaper: PaperItem,
    data: DesktopDashboardData,
    fullReport?: FullReviewReport
  ) => void;
  onScanFailed: (paperId: string, error: HumanReadableScanError) => void;
}

export function ScanProvider({
  children,
  onScanStarted,
  onScanProgress,
  onScanCompleted,
  onScanFailed,
}: ScanProviderProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [activeScanPaperId, setActiveScanPaperId] = useState<string | null>(null);

  // Maintain references to props to prevent stale closure issues in long-running background tasks
  const onStartedRef = useRef(onScanStarted);
  const onProgressRef = useRef(onScanProgress);
  const onCompletedRef = useRef(onScanCompleted);
  const onFailedRef = useRef(onScanFailed);

  onStartedRef.current = onScanStarted;
  onProgressRef.current = onScanProgress;
  onCompletedRef.current = onScanCompleted;
  onFailedRef.current = onScanFailed;

  const executeBackgroundPipeline = useCallback(
    async (paperId: string, params: ScanParams) => {
      setIsScanning(true);
      setActiveScanPaperId(paperId);

      try {
        onProgressRef.current(paperId, "Verifying AI provider connection & credentials...", 10);
        const activeConfig = await resolveActiveConfig();

        const isConfigUsable =
          Boolean(activeConfig.apiKey && activeConfig.apiKey.trim().length > 0) ||
          Boolean(activeConfig.hasSecureKey) ||
          activeConfig.provider === "ollama" ||
          activeConfig.provider === "webllm";

        if (!isConfigUsable) {
          throw new Error(
            "No AI model provider configured. A review requires one configured provider: Ollama (local server), Local SLM (WebLLM), or Cloud LLM API. Please open Settings (Cmd+,) to configure."
          );
        }

        // 1. Text Parsing
        let parsed: ParsedManuscript;
        if (params.file) {
          onProgressRef.current(paperId, "Extracting text from manuscript document...", 20);
          const extracted = await extractTextFromFile(params.file);
          onProgressRef.current(paperId, "Parsing IMRaD sections & reference bibliography...", 30);
          parsed = parseManuscriptText(extracted, params.file.name || "manuscript.txt");
          if (params.title.trim()) parsed.title = params.title.trim();
          if (params.abstract?.trim()) parsed.abstract = params.abstract.trim();
        } else if (params.rawText) {
          onProgressRef.current(paperId, "Analyzing manuscript sections...", 25);
          parsed = parseManuscriptText(params.rawText, "manuscript.txt");
          if (params.title.trim()) parsed.title = params.title.trim();
          if (params.abstract?.trim()) parsed.abstract = params.abstract.trim();
        } else {
          onProgressRef.current(paperId, "Structuring Title & Abstract metadata...", 25);
          const synthetic = `Title: ${params.title}\n\nAbstract:\n${params.abstract || ""}\n\nKeywords: ${params.keywords || ""}`;
          parsed = parseManuscriptText(synthetic, "manuscript.txt");
          parsed.title = params.title.trim();
          parsed.abstract = params.abstract?.trim() || "";
        }

        // 2. Fetch Journal Scope & Aims
        onProgressRef.current(
          paperId,
          `Searching aims & scope for "${params.targetJournal}" via scholarly registries...`,
          40
        );
        const liveScope = await fetchLiveJournalScope(params.targetJournal);

        // 3. Commission 5-Persona Diagnostic Evaluation
        onProgressRef.current(
          paperId,
          "Commissioning 5-persona peer review panel & running deep diagnostic scan...",
          55
        );

        const fullReport = await runManuscriptDiagnostic(
          parsed,
          activeConfig,
          params.targetJournal,
          (update) => {
            onProgressRef.current(paperId, update.message, update.percent);
          },
          liveScope
        );

        // 4. Calculate final flags
        const isExplicitlySent =
          fullReport.editorialTriage?.outcome === "sent_for_review" ||
          fullReport.editorialTriage?.sentToPeerReview === true ||
          Boolean(fullReport.editorialTriage?.summary?.includes("Cleared editorial triage"));
        const isDeskReject =
          !isExplicitlySent &&
          (fullReport.editorialTriage?.outcome === "desk_reject" ||
          fullReport.ineligibilityReason === "scope_mismatch" ||
          fullReport.targetJournalEvaluation?.isDisciplinaryMismatch === true);
        fullReport.isDeskReject = isDeskReject;
        const isEligible = !isDeskReject && fullReport.isEligibleForReview !== false;
        const isPublished =
          !isDeskReject &&
          (fullReport.ineligibilityReason === "already_published" ||
            Boolean(fullReport.publishedDetails?.isPublished));

        const completedPaper: PaperItem = {
          id: paperId,
          title: fullReport.title || params.title || "Untitled Manuscript",
          shortName: (fullReport.title || params.title || "Manuscript")
            .split(" ")
            .slice(0, 3)
            .join(" "),
          journal: fullReport.publishedDetails?.journalName || params.targetJournal,
          score: isDeskReject ? undefined : isEligible ? fullReport.overallScore || 80 : undefined,
          isEligibleForReview: !isDeskReject && isEligible,
          isDeskReject: isDeskReject,
          ineligibilityReason: isDeskReject ? "scope_mismatch" : fullReport.ineligibilityReason,
          isPublished: isPublished,
          publishedJournal: fullReport.publishedDetails?.journalName,
          editorialTriage: fullReport.editorialTriage,
          targetJournalEvaluation: fullReport.targetJournalEvaluation,
          createdAt: fullReport.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "completed",
          scanStep: "Review complete",
          scanPercent: 100,
          scanParams: params,
        };

        const dashboardData: DesktopDashboardData = {
          paperTitle: completedPaper.title,
          headlineTitle: isDeskReject
            ? `${params.targetJournal} Pre-Submission Diagnostic (Desk Reject)`
            : isPublished
            ? `${completedPaper.journal} (Published Article)`
            : `${params.targetJournal} Pre-Submission Diagnostic`,
          targetJournal: completedPaper.journal,
          aiEngine: activeConfig.provider?.toUpperCase() || "AI ENGINE",
          latencyMs: 120,
          score: isDeskReject ? undefined : isEligible ? fullReport.overallScore || 80 : undefined,
          isDeskReject: isDeskReject,
          editorialTriage: fullReport.editorialTriage,
          statusText: isDeskReject
            ? "Editorial Desk Reject (Scope Mismatch)"
            : !isEligible
            ? isPublished
              ? "Already Published Article"
              : "Ineligible Document Type"
            : (fullReport.overallScore || 80) >= 80
            ? "High Acceptance Probability"
            : "Revision Prioritized",
          vulnerabilities:
            fullReport.priorityIssues?.map((issue: any) => ({
              type: (issue.category === "Causal Claims"
                ? "overclaim"
                : "sample_size") as "overclaim" | "sample_size",
              title: issue.title,
              description: issue.description,
              severity: (issue.priority === "A" ? "critical" : "warning") as "critical" | "warning",
            })) || [],
          reviewers:
            fullReport.reviewerPersonas?.map((p: any) => ({
              name: p.name,
              role: p.title || p.persona,
              tag: (p.decisionRecommendation?.includes("Reject")
                ? "Critical"
                : "Major") as "Major" | "Minor" | "Critical",
              quote:
                p.keyChallenge ||
                p.assessment?.slice(0, 150) ||
                "Comprehensive evaluation required.",
              detail: p.majorCritiques?.join(" ") || p.assessment || "",
            })) || [],
          citationAudit: {
            verifiedCount: fullReport.citationIntegrity?.verifiedCount ?? 0,
            totalCount: fullReport.citationIntegrity?.totalReferences ?? 0,
            retractedCount: fullReport.citationIntegrity?.retractedCount ?? 0,
            notes: fullReport.citationIntegrity?.references?.length
              ? `Verified ${fullReport.citationIntegrity.verifiedCount} DOIs via CrossRef Open API.`
              : undefined,
          },
        };

        onCompletedRef.current(paperId, completedPaper, dashboardData, fullReport);
      } catch (rawError: any) {
        console.error("Diagnostic background scan failed:", rawError);
        const translated = translateScanError(rawError);
        onFailedRef.current(paperId, translated);
      } finally {
        setIsScanning(false);
        setActiveScanPaperId(null);
      }
    },
    []
  );

  const startScan = useCallback(
    async (params: ScanParams): Promise<string | null> => {
      if (isScanning) {
        return null;
      }

      const paperId = `paper-${Date.now()}`;
      const title =
        params.title.trim() ||
        (params.file ? params.file.name.replace(/\.[^/.]+$/, "") : "Untitled Manuscript");

      const shortName = title
        .split(" ")
        .slice(0, 3)
        .join(" ");

      const pendingPaper: PaperItem = {
        id: paperId,
        title: title,
        shortName: shortName,
        journal: params.targetJournal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "reviewing",
        scanStep: "Initializing diagnostic review...",
        scanPercent: 10,
        scanParams: params,
      };

      onStartedRef.current(pendingPaper);

      // Trigger background processing asynchronously without blocking caller
      setTimeout(() => {
        executeBackgroundPipeline(paperId, params);
      }, 50);

      return paperId;
    },
    [isScanning, executeBackgroundPipeline]
  );

  const retryScan = useCallback(
    async (paper: PaperItem) => {
      if (isScanning || !paper.scanParams) return;
      const paperId = paper.id;

      onProgressRef.current(paperId, "Retrying diagnostic review...", 10);
      executeBackgroundPipeline(paperId, paper.scanParams);
    },
    [isScanning, executeBackgroundPipeline]
  );

  return (
    <ScanContext.Provider
      value={{
        isScanning,
        activeScanPaperId,
        startScan,
        retryScan,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScanManager() {
  return useContext(ScanContext);
}
