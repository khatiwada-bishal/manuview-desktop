import React, { useState, useEffect } from "react";
import { DesktopHeader, TabItem } from "@/components/DesktopHeader";
import {
  DesktopSidebar,
  DesktopActiveView,
  PaperItem,
} from "@/components/DesktopSidebar";
import {
  DesktopDashboard,
  DesktopDashboardData,
} from "@/components/DesktopDashboard";
import { DesktopSearchModal } from "@/components/DesktopModals";
import { DesktopScanModal } from "@/components/services/DesktopScanModal";
import { DesktopJournalFitView } from "@/components/services/DesktopJournalFitView";
import { DesktopReferenceView } from "@/components/services/DesktopReferenceView";
import { DesktopCitationClaimView } from "@/components/services/DesktopCitationClaimView";
import { DesktopPrismaView } from "@/components/services/DesktopPrismaView";
import { DesktopCoverLetterView } from "@/components/services/DesktopCoverLetterView";
import { DesktopResponseBuilderView } from "@/components/services/DesktopResponseBuilderView";
import { ProviderSettingsModal } from "@/components/ProviderSettingsModal";
import { useApiConnection } from "@/lib/useApiConnection";
import { FileText, Plus } from "lucide-react";

// Initial reference papers
const INITIAL_PAPERS: PaperItem[] = [
  {
    id: "dll3-sclc",
    title: "DLL3 SCLC Nature Pre-Submission",
    shortName: "DLL3 Activation Paper",
    journal: "Nature Communications",
    score: 78,
  },
  {
    id: "crispr-screen",
    title: "CRISPR-Cas9 Screens in Organoid Models",
    shortName: "CRISPR Screen Paper",
    journal: "Cancer Discovery",
    score: 84,
  },
];

const INITIAL_DASHBOARD_DATA: Record<string, DesktopDashboardData> = {
  "dll3-sclc": {
    paperTitle: "DLL3 SCLC Nature Pre-Submission",
    headlineTitle: "Nature Communications Pre-Submission",
    targetJournal: "Nature Communications",
    aiEngine: "GEMINI 2.5 FLASH",
    latencyMs: 142,
    score: 78,
    statusText: "Revision Prioritized",
    vulnerabilities: [
      {
        type: "overclaim",
        title: "Causal Overclaim",
        description:
          "Abstract claims POU2F1 proves DLL3 expression without rescue control.",
        severity: "critical",
      },
      {
        type: "sample_size",
        title: "Sample Size Power",
        description:
          "Cohort n=8 lacks a priori statistical power calculation.",
        severity: "warning",
      },
    ],
    reviewers: [
      {
        name: "Dr. Vance",
        role: "Methods",
        tag: "Major",
        quote: "sgRNA library coverage depth must be confirmed in organoids.",
        detail:
          "Perform deep NGS re-sequencing of the sgRNA plasmid library representation across all 8 replicates.",
      },
      {
        name: "Dr. Sorkin",
        role: "Stats",
        tag: "Major",
        quote:
          "Parametric t-test used on small sample size without normality test.",
        detail:
          "Switch to non-parametric Wilcoxon rank-sum or Mann-Whitney U test given n=8.",
      },
      {
        name: "Dr. Alistair",
        role: "Big-Picture Skeptic",
        tag: "Minor",
        quote:
          "Translational relevance to clinical small-cell lung cancer requires more emphasis.",
        detail:
          "Add correlation plots showing POU2F1 expression in TCGA or primary SCLC cohorts.",
      },
      {
        name: "Dr. Thorne",
        role: "Desk Rejector",
        tag: "Critical",
        quote:
          "Novelty over recent Cell Reports 2024 paper needs clear demarcation in Introduction.",
        detail:
          "Explicitly distinguish your enhancer binding assay from the published promoter study.",
      },
    ],
    citationAudit: {
      verifiedCount: 15,
      totalCount: 15,
      retractedCount: 0,
      notes: "All 15 DOIs resolved via CrossRef Open API.",
    },
  },
  "crispr-screen": {
    paperTitle: "CRISPR-Cas9 Screens in Organoid Models",
    headlineTitle: "Cancer Discovery Pre-Submission",
    targetJournal: "Cancer Discovery",
    aiEngine: "GEMINI 2.5 FLASH",
    latencyMs: 135,
    score: 84,
    statusText: "High Acceptance Probability",
    vulnerabilities: [
      {
        type: "control",
        title: "Off-Target Validation",
        description:
          "Guide RNA specificity requires whole-genome sequencing confirmation in primary organoids.",
        severity: "warning",
      },
    ],
    reviewers: [
      {
        name: "Dr. Vance",
        role: "Methods",
        tag: "Minor",
        quote:
          "Solid screen depth. Recommend reporting biological replicates variance in Supplementary Table 2.",
      },
    ],
    citationAudit: {
      verifiedCount: 22,
      totalCount: 22,
      retractedCount: 0,
      notes: "All DOIs verified via CrossRef.",
    },
  },
};

export default function App() {
  const [papers, setPapers] = useState<PaperItem[]>(INITIAL_PAPERS);
  const [dashboardStore, setDashboardStore] = useState<Record<string, DesktopDashboardData>>(
    INITIAL_DASHBOARD_DATA
  );

  // Open tabs list
  const [openTabs, setOpenTabs] = useState<TabItem[]>([
    {
      id: "dll3-sclc",
      type: "article",
      title: "DLL3 SCLC Nature Pre-Submission",
      shortName: "DLL3 Activation Paper",
    },
    {
      id: "tool-journal-fit",
      type: "tool",
      title: "Journal Fit Predictor",
      shortName: "Journal Fit",
      toolType: "journal-fit",
    },
  ]);

  const [activeTabId, setActiveTabId] = useState<string | null>("dll3-sclc");
  const [activeView, setActiveView] = useState<DesktopActiveView>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Live API Connection state
  const {
    isConnected,
    isLoading: isApiLoading,
    modelName,
    latencyMs,
    provider,
  } = useApiConnection();

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Current active paper if activeTab is an article
  const currentPaper = papers.find((p) => p.id === activeTabId) || null;
  const currentDashboardData =
    (activeTabId && dashboardStore[activeTabId]) ||
    dashboardStore["dll3-sclc"];

  // Open an article in a tab
  const handleOpenArticle = (id: string) => {
    const paper = papers.find((p) => p.id === id);
    if (!paper) return;

    if (!openTabs.some((t) => t.id === id)) {
      setOpenTabs((prev) => [
        ...prev,
        {
          id: paper.id,
          type: "article",
          title: paper.title,
          shortName: paper.shortName,
        },
      ]);
    }
    setActiveTabId(id);
    setActiveView("overview");
  };

  // Open a service tool in a tab
  const handleOpenService = (serviceId: string) => {
    if (serviceId === "ai-review") {
      setIsScanOpen(true);
      return;
    }

    const toolMap: Record<string, { title: string; shortName: string }> = {
      "journal-fit": { title: "Journal Fit Predictor", shortName: "Journal Fit" },
      "reference-checker": { title: "Reference Integrity Audit", shortName: "Reference Audit" },
      "citation-claim": { title: "Citation Claim Validator", shortName: "Citation Claim" },
      prisma: { title: "PRISMA Flow Diagram", shortName: "PRISMA 2020" },
      "cover-letter": { title: "Journal Cover Letter", shortName: "Cover Letter" },
      "response-builder": { title: "Review Response Builder", shortName: "Response Matrix" },
    };

    const toolInfo = toolMap[serviceId];
    if (!toolInfo) return;

    const tabId = `tool-${serviceId}`;
    if (!openTabs.some((t) => t.id === tabId)) {
      setOpenTabs((prev) => [
        ...prev,
        {
          id: tabId,
          type: "tool",
          title: toolInfo.title,
          shortName: toolInfo.shortName,
          toolType: serviceId,
        },
      ]);
    }
    setActiveTabId(tabId);
  };

  // Close a tab
  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openTabs.filter((t) => t.id !== id);
    setOpenTabs(remaining);
    if (activeTabId === id) {
      if (remaining.length > 0) {
        setActiveTabId(remaining[remaining.length - 1].id);
      } else {
        setActiveTabId(null);
      }
    }
  };

  // Global keyboard shortcut for Search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // When live scan completes
  const handleScanComplete = (newPaper: PaperItem, data: DesktopDashboardData) => {
    setPapers((prev) => [newPaper, ...prev]);
    setDashboardStore((prev) => ({ ...prev, [newPaper.id]: data }));
    setOpenTabs((prev) => [
      ...prev,
      {
        id: newPaper.id,
        type: "article",
        title: newPaper.title,
        shortName: newPaper.shortName,
      },
    ]);
    setActiveTabId(newPaper.id);
    setActiveView("overview");
  };

  // Render view corresponding to active tab
  const renderActiveTabContent = () => {
    if (!activeTabId) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#FAFAFA] text-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-center mb-4 text-neutral-400">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-[#111827] mb-1">
            No Workspace Tab Open
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mb-6">
            Select an article or research service from the left sidebar, or run a new pre-submission review scan.
          </p>
          <div className="flex items-center gap-3">
            {papers.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenArticle(papers[0].id)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-white border border-[#E5E7EB] hover:bg-neutral-50 text-neutral-700 transition cursor-pointer shadow-xs"
              >
                Open {papers[0].shortName}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsScanOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#111827] hover:bg-neutral-800 text-white transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Pre-Submission Review</span>
            </button>
          </div>
        </div>
      );
    }

    if (activeTabId === "tool-journal-fit") {
      return <DesktopJournalFitView />;
    }
    if (activeTabId === "tool-reference-checker") {
      return <DesktopReferenceView />;
    }
    if (activeTabId === "tool-citation-claim") {
      return <DesktopCitationClaimView />;
    }
    if (activeTabId === "tool-prisma") {
      return <DesktopPrismaView />;
    }
    if (activeTabId === "tool-cover-letter") {
      return <DesktopCoverLetterView />;
    }
    if (activeTabId === "tool-response-builder") {
      return <DesktopResponseBuilderView />;
    }

    // Default: Article Review Dashboard
    if (currentPaper) {
      return (
        <DesktopDashboard
          data={currentDashboardData}
          activeView={activeView}
          isConnected={isConnected}
          isLoading={isApiLoading}
          activeModelName={modelName}
          latencyMs={latencyMs}
          onSelectView={(view) => setActiveView(view)}
          onNewScan={() => setIsScanOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      );
    }

    return null;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden select-none font-sans">
      {/* Top Window Header with Browser-style Tabs */}
      <DesktopHeader
        openTabs={openTabs}
        activeTabId={activeTabId}
        onSelectTab={(id) => setActiveTabId(id)}
        onCloseTab={handleCloseTab}
        onNewTab={() => setIsScanOpen(true)}
        isConnected={isConnected}
        isLoading={isApiLoading}
        activeModelName={modelName}
        latencyMs={latencyMs}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
      />

      {/* Main Layout: Sidebar + Active View */}
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && (
          <DesktopSidebar
            papers={papers}
            activePaperId={activeTabId}
            activeView={activeView}
            isConnected={isConnected}
            provider={provider}
            onSelectPaper={handleOpenArticle}
            onSelectView={(view) => setActiveView(view)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onNewReview={() => setIsScanOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onSelectService={handleOpenService}
          />
        )}

        {/* View Content */}
        {renderActiveTabContent()}
      </div>

      {/* Modals */}
      <DesktopSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectItem={(id) => {
          if (papers.some((p) => p.id === id)) {
            handleOpenArticle(id);
          } else if (id.startsWith("tool-")) {
            handleOpenService(id.replace("tool-", ""));
          }
        }}
      />

      {/* Live Pre-Submission AI Review Scan Modal */}
      <DesktopScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onComplete={handleScanComplete}
      />

      <ProviderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
