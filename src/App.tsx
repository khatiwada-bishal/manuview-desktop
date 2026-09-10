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
import { DesktopPreSubmissionScanView } from "@/components/services/DesktopPreSubmissionScanView";
import { DesktopJournalFitView } from "@/components/services/DesktopJournalFitView";
import { DesktopReferenceView } from "@/components/services/DesktopReferenceView";
import { DesktopCitationClaimView } from "@/components/services/DesktopCitationClaimView";
import { DesktopPrismaView } from "@/components/services/DesktopPrismaView";
import { DesktopCoverLetterView } from "@/components/services/DesktopCoverLetterView";
import { DesktopResponseBuilderView } from "@/components/services/DesktopResponseBuilderView";
import { DesktopEmptyDashboard } from "@/components/DesktopEmptyDashboard";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { ProviderSettingsModal } from "@/components/ProviderSettingsModal";
import { useApiConnection } from "@/lib/useApiConnection";
import {
  loadSavedProjects,
  saveProject,
  deleteProject,
  loadSession,
  saveSession,
  purgeLegacyDummyData,
} from "@/lib/projectStorage";

export default function App() {
  // Purge legacy mock data on startup
  useEffect(() => {
    purgeLegacyDummyData();
  }, []);

  // Saved papers loaded from local storage
  const [papers, setPapers] = useState<PaperItem[]>(() => {
    purgeLegacyDummyData();
    const saved = loadSavedProjects();
    return saved.map((s) => s.paper);
  });

  const [dashboardStore, setDashboardStore] = useState<Record<string, DesktopDashboardData>>(() => {
    const saved = loadSavedProjects();
    const store: Record<string, DesktopDashboardData> = {};
    for (const item of saved) {
      store[item.paper.id] = item.dashboardData;
    }
    return store;
  });

  // Open tabs list restored from user's last session
  const [openTabs, setOpenTabs] = useState<TabItem[]>(() => {
    const session = loadSession();
    return session?.openTabs || [];
  });

  const [activeTabId, setActiveTabId] = useState<string | null>(() => {
    const session = loadSession();
    return session?.activeTabId || null;
  });

  const [activeView, setActiveView] = useState<DesktopActiveView>(() => {
    const session = loadSession();
    return session?.activeView || "overview";
  });

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
  const [paperToDelete, setPaperToDelete] = useState<PaperItem | null>(null);

  // Automatically persist user session state (open tabs, active tab, active view)
  useEffect(() => {
    saveSession({
      openTabs,
      activeTabId,
      activeView,
      lastActiveAt: new Date().toISOString(),
    });
  }, [openTabs, activeTabId, activeView]);

  // Current active paper if activeTab is an article
  const currentPaper = papers.find((p) => p.id === activeTabId) || null;
  const currentDashboardData =
    (activeTabId && dashboardStore[activeTabId]) || null;

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
    const toolMap: Record<string, { title: string; shortName: string }> = {
      "ai-review": { title: "Pre-Submission AI Review", shortName: "AI Review" },
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

  // Handle project deletion confirmed by user
  const handleDeleteProjectConfirm = () => {
    if (!paperToDelete) return;
    const id = paperToDelete.id;

    // 1. Delete from local persistent storage on user's computer
    deleteProject(id);

    // 2. Remove from React state
    setPapers((prev) => prev.filter((p) => p.id !== id));
    setDashboardStore((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    // 3. Close open tab if present
    setOpenTabs((prev) => {
      const remaining = prev.filter((t) => t.id !== id);
      if (activeTabId === id) {
        setActiveTabId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
      }
      return remaining;
    });

    setPaperToDelete(null);
  };

  // When live scan completes
  const handleScanComplete = (newPaper: PaperItem, data: DesktopDashboardData) => {
    // 1. Persist to local computer storage
    saveProject(newPaper, data);

    // 2. Update state
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
        <DesktopEmptyDashboard
          papers={papers}
          onOpenArticle={handleOpenArticle}
          onOpenService={handleOpenService}
          onDeletePaper={(paper) => setPaperToDelete(paper)}
        />
      );
    }

    if (activeTabId === "tool-ai-review" || activeTabId === "tool-pre-submission") {
      return (
        <DesktopPreSubmissionScanView
          onComplete={handleScanComplete}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
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
    if (currentPaper && currentDashboardData) {
      return (
        <DesktopDashboard
          data={currentDashboardData}
          activeView={activeView}
          isConnected={isConnected}
          isLoading={isApiLoading}
          activeModelName={modelName}
          latencyMs={latencyMs}
          onSelectView={(view) => setActiveView(view)}
          onNewScan={() => handleOpenService("ai-review")}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onDeleteArticle={() => setPaperToDelete(currentPaper)}
        />
      );
    }

    return (
      <DesktopEmptyDashboard
        papers={papers}
        onOpenArticle={handleOpenArticle}
        onOpenService={handleOpenService}
        onDeletePaper={(paper) => setPaperToDelete(paper)}
      />
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden select-none font-sans">
      {/* Top Window Header with Browser-style Tabs */}
      <DesktopHeader
        openTabs={openTabs}
        activeTabId={activeTabId}
        onSelectTab={(id) => setActiveTabId(id)}
        onCloseTab={handleCloseTab}
        onNewTab={() => handleOpenService("ai-review")}
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
        <DesktopSidebar
          papers={papers}
          activePaperId={activeTabId}
          activeView={activeView}
          isConnected={isConnected}
          isLoading={isApiLoading}
          provider={provider}
          activeModelName={modelName}
          isCollapsed={!sidebarOpen}
          onToggleCollapse={() => setSidebarOpen((prev) => !prev)}
          onSelectPaper={handleOpenArticle}
          onSelectView={(view) => setActiveView(view)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onNewReview={() => handleOpenService("ai-review")}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSelectService={handleOpenService}
          onDeletePaper={(paper) => setPaperToDelete(paper)}
        />

        {/* View Content */}
        {renderActiveTabContent()}
      </div>

      {/* Modals */}
      <DesktopSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        papers={papers}
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

      {/* Project Deletion Confirmation Modal */}
      <DeleteConfirmationModal
        paper={paperToDelete}
        isOpen={Boolean(paperToDelete)}
        onClose={() => setPaperToDelete(null)}
        onConfirm={handleDeleteProjectConfirm}
      />

      <ProviderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
