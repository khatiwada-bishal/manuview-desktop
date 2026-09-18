import { PaperItem, DesktopActiveView } from "@/components/DesktopSidebar";
import { DesktopDashboardData } from "@/components/DesktopDashboard";
import { TabItem } from "@/components/DesktopHeader";
import { FullReviewReport } from "./types";
import { idbSet, idbDelete, idbGetAll } from "./indexed-db";
import { findMatchingJournals } from "./journals";

export interface SavedProject {
  paper: PaperItem;
  dashboardData: DesktopDashboardData;
  fullReport?: FullReviewReport;
  createdAt: string;
  updatedAt: string;
}

export interface SessionState {
  openTabs: TabItem[];
  activeTabId: string | null;
  activeView: DesktopActiveView;
  lastActiveAt: string;
}

const PROJECTS_STORAGE_KEY = "manuview_projects_v1";
const SESSION_STORAGE_KEY = "manuview_session_v1";

// Purge any old dummy IDs that might have been cached in user localStorage or IndexedDB
const LEGACY_DUMMY_IDS = new Set(["dll3-sclc", "crispr-screen", "paper-1", "paper-2", "nepal-ewaste-study"]);

/**
 * Clean up legacy mock data from localStorage and IndexedDB if present
 */
export function purgeLegacyDummyData(): void {
  if (typeof window === "undefined") return;
  try {
    for (const dummyId of LEGACY_DUMMY_IDS) {
      idbDelete(dummyId).catch(() => {});
    }

    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const projects: SavedProject[] = JSON.parse(raw);
      const cleaned = projects.filter((p) => !LEGACY_DUMMY_IDS.has(p.paper.id));
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(cleaned));
    }

    const sessionRaw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionRaw) {
      const session: SessionState = JSON.parse(sessionRaw);
      const cleanedTabs = (session.openTabs || []).filter(
        (tab) => !LEGACY_DUMMY_IDS.has(tab.id)
      );
      const activeId =
        session.activeTabId && !LEGACY_DUMMY_IDS.has(session.activeTabId)
          ? session.activeTabId
          : cleanedTabs[0]?.id || null;

      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          ...session,
          openTabs: cleanedTabs,
          activeTabId: activeId,
        })
      );
    }
  } catch (err) {
    console.warn("Failed to purge legacy dummy data:", err);
  }
}

/**
 * Sanitize project state to ensure scope mismatches are strictly classified as desk rejects
 */
export function sanitizeSavedProject(p: SavedProject): SavedProject {
  let isMismatch =
    p.fullReport?.targetJournalEvaluation?.isDisciplinaryMismatch === true ||
    p.paper?.targetJournalEvaluation?.isDisciplinaryMismatch === true ||
    p.paper?.ineligibilityReason === "scope_mismatch" ||
    p.paper?.editorialTriage?.outcome === "desk_reject" ||
    p.fullReport?.editorialTriage?.outcome === "desk_reject" ||
    p.fullReport?.ineligibilityReason === "scope_mismatch" ||
    p.dashboardData?.editorialTriage?.outcome === "desk_reject" ||
    p.dashboardData?.statusText?.includes("Desk Reject") ||
    p.paper?.isDeskReject === true ||
    p.dashboardData?.isDeskReject === true;

  if (!isMismatch && p.paper?.journal && p.paper?.title) {
    try {
      const match = findMatchingJournals(p.paper.title, p.fullReport?.summary || "", p.paper.journal, []);
      if (match?.targetJournalEvaluation?.isDisciplinaryMismatch) {
        isMismatch = true;
      }
    } catch {
      // Graceful fallback
    }
  }

  const paper: PaperItem = {
    ...p.paper,
    score: isMismatch ? undefined : p.paper.score,
    isDeskReject: isMismatch || p.paper.isDeskReject,
    isEligibleForReview: isMismatch ? false : p.paper.isEligibleForReview,
    ineligibilityReason: isMismatch ? "scope_mismatch" : p.paper.ineligibilityReason,
    targetJournalEvaluation: p.paper.targetJournalEvaluation || p.fullReport?.targetJournalEvaluation,
    createdAt: p.paper.createdAt || p.createdAt,
    updatedAt: p.paper.updatedAt || p.updatedAt,
  };

  const dashboardData: DesktopDashboardData = {
    ...p.dashboardData,
    score: isMismatch ? undefined : p.dashboardData?.score,
    isDeskReject: isMismatch || p.dashboardData?.isDeskReject,
    statusText: isMismatch ? "Editorial Desk Reject (Scope Mismatch)" : p.dashboardData?.statusText,
  };

  return {
    ...p,
    paper,
    dashboardData,
  };
}

/**
 * Load all saved projects from the user's computer
 */
export function loadSavedProjects(): SavedProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: SavedProject[] = JSON.parse(raw);
    const cleaned = parsed.filter((p) => !LEGACY_DUMMY_IDS.has(p.paper.id));
    return cleaned.map(sanitizeSavedProject);
  } catch (err) {
    console.error("Error loading saved projects from localStorage:", err);
    return [];
  }
}

/**
 * Asynchronously initialize and synchronize IndexedDB storage
 */
export async function initIndexedDBStorage(): Promise<SavedProject[]> {
  if (typeof window === "undefined") return [];
  try {
    // Delete any legacy dummy records from IndexedDB
    for (const dummyId of LEGACY_DUMMY_IDS) {
      await idbDelete(dummyId).catch(() => {});
    }

    const local = loadSavedProjects();
    const idbProjects = await idbGetAll<SavedProject & { id: string }>();
    const validIdb = idbProjects
      .filter((p) => !LEGACY_DUMMY_IDS.has(p.id))
      .map(({ id, ...rest }) => sanitizeSavedProject(rest as SavedProject));

    // Reconcile the two stores by id, keeping whichever copy was updated most
    // recently (ISO timestamps compare lexicographically). This avoids clobbering
    // a newer IndexedDB record with a stale localStorage snapshot, and vice versa.
    const byId = new Map<string, SavedProject>();
    for (const p of validIdb) byId.set(p.paper.id, p);
    for (const p of local) {
      const existing = byId.get(p.paper.id);
      if (!existing || (p.updatedAt || "") > (existing.updatedAt || "")) {
        byId.set(p.paper.id, p);
      }
    }
    const merged = Array.from(byId.values()).sort((a, b) =>
      (b.updatedAt || "").localeCompare(a.updatedAt || "")
    );

    // Write the reconciled set back to IndexedDB (source of truth) and refresh
    // the localStorage cache best-effort.
    for (const proj of merged) {
      await idbSet({ id: proj.paper.id, ...proj }).catch(() => {});
    }
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Cache refresh is best-effort; IndexedDB already holds the reconciled set.
    }

    return merged;
  } catch (err) {
    console.warn("IndexedDB sync warning:", err);
    return loadSavedProjects();
  }
}

/**
 * Save or update a project on the user's computer.
 *
 * IndexedDB is the source of truth (virtually unlimited quota for large PDFs &
 * reports); localStorage is a best-effort fast cache. The project list is
 * merged against the IndexedDB superset — not the (possibly smaller)
 * localStorage snapshot — so projects that only fit in IndexedDB are never
 * dropped when the cache is rewritten.
 */
export async function saveProject(
  paper: PaperItem,
  dashboardData: DesktopDashboardData,
  fullReport?: FullReviewReport
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const now = new Date().toISOString();

    // Base the merge on the IndexedDB superset; fall back to the localStorage
    // cache only if IndexedDB is empty or unavailable.
    let existing: SavedProject[] = [];
    try {
      const idbProjects = await idbGetAll<SavedProject & { id: string }>();
      existing = idbProjects
        .filter((p) => !LEGACY_DUMMY_IDS.has(p.id))
        .map(({ id, ...rest }) => rest as SavedProject);
    } catch (idbErr) {
      console.warn("IndexedDB read failed during save; using localStorage cache:", idbErr);
    }
    if (existing.length === 0) {
      existing = loadSavedProjects();
    }

    const index = existing.findIndex((p) => p.paper.id === paper.id);
    const createdAt =
      paper.createdAt ||
      (index >= 0 ? existing[index].createdAt || existing[index].paper?.createdAt : undefined) ||
      now;
    const updatedAt = now;
    const paperWithTimestamps: PaperItem = {
      ...paper,
      createdAt,
      updatedAt,
    };
    const newProject: SavedProject = {
      paper: paperWithTimestamps,
      dashboardData,
      fullReport,
      createdAt,
      updatedAt,
    };

    const updated =
      index >= 0
        ? existing.map((p, i) => (i === index ? newProject : p))
        : [newProject, ...existing];

    // 1. Persist to IndexedDB (source of truth) and await it so the write is
    //    durable before we report completion.
    try {
      await idbSet({ id: paper.id, ...newProject });
    } catch (err) {
      console.warn("Failed to persist project to IndexedDB:", err);
    }

    // 2. Persist the localStorage cache (best-effort; may hit quota on large reports).
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (quotaErr) {
      console.warn("localStorage quota exceeded; project safely stored in IndexedDB:", quotaErr);
    }
  } catch (err) {
    console.error("Error saving project:", err);
  }
}

/**
 * Delete a project permanently from the user's computer
 */
export function deleteProject(projectId: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadSavedProjects();
    const filtered = existing.filter((p) => p.paper.id !== projectId);
    
    // Delete from localStorage
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filtered));
    } catch {}

    // Delete from IndexedDB
    idbDelete(projectId).catch((err) => {
      console.warn("Failed to delete project from IndexedDB:", err);
    });

    // Also remove from saved session if open
    const session = loadSession();
    if (session) {
      const remainingTabs = session.openTabs.filter((t) => t.id !== projectId);
      const newActiveId =
        session.activeTabId === projectId
          ? remainingTabs[remainingTabs.length - 1]?.id || null
          : session.activeTabId;

      saveSession({
        ...session,
        openTabs: remainingTabs,
        activeTabId: newActiveId,
      });
    }
  } catch (err) {
    console.error("Error deleting project from localStorage:", err);
  }
}

/**
 * Delete multiple projects permanently from the user's computer in batch
 */
export function deleteProjects(projectIds: string[]): void {
  if (typeof window === "undefined" || !projectIds || projectIds.length === 0) return;
  const idSet = new Set(projectIds);
  try {
    const existing = loadSavedProjects();
    const filtered = existing.filter((p) => !idSet.has(p.paper.id));

    // Delete from localStorage
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filtered));
    } catch {}

    // Delete from IndexedDB in parallel
    for (const id of projectIds) {
      idbDelete(id).catch((err) => {
        console.warn("Failed to delete project from IndexedDB:", err);
      });
    }

    // Also remove from saved session if open
    const session = loadSession();
    if (session) {
      const remainingTabs = session.openTabs.filter((t) => !idSet.has(t.id));
      const newActiveId = idSet.has(session.activeTabId || "")
        ? remainingTabs[remainingTabs.length - 1]?.id || null
        : session.activeTabId;

      saveSession({
        ...session,
        openTabs: remainingTabs,
        activeTabId: newActiveId,
      });
    }
  } catch (err) {
    console.error("Error batch deleting projects from localStorage:", err);
  }
}

/**
 * Load the user's active session (open tabs & active article)
 */
export function loadSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return {
        openTabs: [],
        activeTabId: null,
        activeView: "overview",
        lastActiveAt: new Date().toISOString(),
      };
    }
    const parsed: SessionState = JSON.parse(raw);
    const validTabs = (parsed.openTabs || []).filter(
      (t) => !LEGACY_DUMMY_IDS.has(t.id)
    );
    if (validTabs.length === 0) {
      return {
        openTabs: [],
        activeTabId: null,
        activeView: "overview",
        lastActiveAt: new Date().toISOString(),
      };
    }
    return {
      ...parsed,
      openTabs: validTabs,
      activeTabId:
        parsed.activeTabId && !LEGACY_DUMMY_IDS.has(parsed.activeTabId)
          ? parsed.activeTabId
          : validTabs[0]?.id || null,
    };
  } catch (err) {
    console.error("Error loading session state:", err);
    return null;
  }
}

/**
 * Save active session state (open tabs, active tab, active view)
 */
export function saveSession(session: SessionState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...session,
        lastActiveAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error("Error saving session state:", err);
  }
}

/**
 * Clear the current session
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error("Error clearing session:", err);
  }
}
