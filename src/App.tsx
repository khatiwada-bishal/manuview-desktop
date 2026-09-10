import React, { useState, useEffect } from "react";
import { DesktopHeader } from "@/components/DesktopHeader";
import {
  DesktopSidebar,
  DesktopActiveView,
  PaperItem,
} from "@/components/DesktopSidebar";
import {
  DesktopDashboard,
  DesktopDashboardData,
} from "@/components/DesktopDashboard";
import {
  DesktopSearchModal,
  DesktopNewReviewModal,
} from "@/components/DesktopModals";
import { ProviderSettingsModal } from "@/components/ProviderSettingsModal";
import { useApiConnection } from "@/lib/useApiConnection";
import { FileText, Plus, Sparkles } from "lucide-react";

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

const SAMPLE_DASHBOARD_DATA: Record<string, DesktopDashboardData> = {
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
  const [openTabIds, setOpenTabIds] = useState<string[]>([
    "dll3-sclc",
    "crispr-screen",
  ]);
  const [activePaperId, setActivePaperId] = useState<string | null>("dll3-sclc");
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
  const [isNewReviewOpen, setIsNewReviewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Derive open tabs
  const openTabs = openTabIds
    .map((id) => papers.find((p) => p.id === id))
    .filter((p): p is PaperItem => Boolean(p));

  // Current active paper
  const currentPaper = papers.find((p) => p.id === activePaperId) || null;
  const dashboardData =
    (activePaperId && SAMPLE_DASHBOARD_DATA[activePaperId]) ||
    SAMPLE_DASHBOARD_DATA["dll3-sclc"];

  // Open an article in a tab
  const handleOpenArticle = (id: string) => {
    if (!openTabIds.includes(id)) {
      setOpenTabIds((prev) => [...prev, id]);
    }
    setActivePaperId(id);
    setActiveView("overview");
  };

  // Close a tab
  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openTabIds.filter((tabId) => tabId !== id);
    setOpenTabIds(remaining);
    if (activePaperId === id) {
      if (remaining.length > 0) {
        setActivePaperId(remaining[remaining.length - 1]);
      } else {
        setActivePaperId(null);
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

  const handleCreateReview = (
    title: string,
    journal: string,
    _file: File | null
  ) => {
    const newId = `paper-${Date.now()}`;
    const newPaper: PaperItem = {
      id: newId,
      title: `${title} Pre-Submission`,
      shortName: title.length > 24 ? title.substring(0, 24) + "..." : title,
      journal,
      score: 82,
    };

    SAMPLE_DASHBOARD_DATA[newId] = {
      paperTitle: newPaper.title,
      headlineTitle: `${journal} Pre-Submission`,
      targetJournal: journal,
      aiEngine: modelName || "AI ENGINE",
      latencyMs: latencyMs || 140,
      score: 82,
      statusText: "Ready for Polish",
      vulnerabilities: [
        {
          type: "generic",
          title: "Preliminary Findings Limitation",
          description:
            "Discussion should explicitly acknowledge prospective validation limitations.",
          severity: "warning",
        },
      ],
      reviewers: [
        {
          name: "Dr. Vance",
          role: "Methods",
          tag: "Minor",
          quote: "Methodology is rigorous; provide protocol details in supplement.",
        },
      ],
      citationAudit: {
        verifiedCount: 12,
        totalCount: 12,
        retractedCount: 0,
      },
    };

    setPapers((prev) => [newPaper, ...prev]);
    setOpenTabIds((prev) => [...prev, newId]);
    setActivePaperId(newId);
    setActiveView("overview");
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden select-none font-sans">
      {/* Top Window Header with Browser-style Tabs */}
      <DesktopHeader
        openTabs={openTabs}
        activePaperId={activePaperId}
        onSelectTab={(id) => {
          setActivePaperId(id);
          setActiveView("overview");
        }}
        onCloseTab={handleCloseTab}
        onNewTab={() => setIsNewReviewOpen(true)}
        isConnected={isConnected}
        isLoading={isApiLoading}
        activeModelName={modelName}
        latencyMs={latencyMs}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
      />

      {/* Main App Layout: Sidebar + Dashboard */}
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && (
          <DesktopSidebar
            papers={papers}
            activePaperId={activePaperId}
            activeView={activeView}
            isConnected={isConnected}
            provider={provider}
            onSelectPaper={handleOpenArticle}
            onSelectView={(view) => setActiveView(view)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onNewReview={() => setIsNewReviewOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* Active Article Tab Content or Empty State */}
        {activePaperId && currentPaper ? (
          <DesktopDashboard
            data={dashboardData}
            activeView={activeView}
            isConnected={isConnected}
            isLoading={isApiLoading}
            activeModelName={modelName}
            latencyMs={latencyMs}
            onSelectView={(view) => setActiveView(view)}
            onNewScan={() => setIsNewReviewOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#FAFAFA] text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-center mb-4 text-neutral-400">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-[#111827] mb-1">
              No Article Open
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mb-6">
              Select an article from the left sidebar to open it in a tab, or start a new manuscript peer-review scan.
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
                onClick={() => setIsNewReviewOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#111827] hover:bg-neutral-800 text-white transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New AI Review</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DesktopSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectItem={(id) => {
          if (papers.some((p) => p.id === id)) {
            handleOpenArticle(id);
          }
        }}
      />

      <DesktopNewReviewModal
        isOpen={isNewReviewOpen}
        onClose={() => setIsNewReviewOpen(false)}
        onSubmit={handleCreateReview}
      />

      <ProviderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
