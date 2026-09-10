import { PaperItem, DesktopActiveView } from "@/components/DesktopSidebar";
import { DesktopDashboardData } from "@/components/DesktopDashboard";
import { TabItem } from "@/components/DesktopHeader";

export interface SavedProject {
  paper: PaperItem;
  dashboardData: DesktopDashboardData;
  fullReport?: any;
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

// Purge any old dummy IDs that might have been cached in user localStorage
const LEGACY_DUMMY_IDS = new Set(["dll3-sclc", "crispr-screen", "paper-1", "paper-2"]);

/**
 * Clean up legacy mock data from localStorage if present
 */
export function purgeLegacyDummyData(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const projects: SavedProject[] = JSON.parse(raw);
      const cleaned = projects.filter((p) => !LEGACY_DUMMY_IDS.has(p.paper.id));
      if (cleaned.length !== projects.length) {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(cleaned));
      }
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
 * Load all saved projects from the user's computer
 */
export function loadSavedProjects(): SavedProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: SavedProject[] = JSON.parse(raw);
    // Filter out any legacy dummy records
    return parsed.filter((p) => !LEGACY_DUMMY_IDS.has(p.paper.id));
  } catch (err) {
    console.error("Error loading saved projects from localStorage:", err);
    return [];
  }
}

/**
 * Save or update a project on the user's computer
 */
export function saveProject(
  paper: PaperItem,
  dashboardData: DesktopDashboardData,
  fullReport?: any
): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadSavedProjects();
    const now = new Date().toISOString();
    const index = existing.findIndex((p) => p.paper.id === paper.id);

    const newProject: SavedProject = {
      paper,
      dashboardData,
      fullReport,
      createdAt: index >= 0 ? existing[index].createdAt : now,
      updatedAt: now,
    };

    let updated: SavedProject[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = newProject;
    } else {
      updated = [newProject, ...existing];
    }

    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Error saving project to localStorage:", err);
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
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filtered));

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
 * Load the user's active session (open tabs & active article)
 */
export function loadSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: SessionState = JSON.parse(raw);
    const validTabs = (parsed.openTabs || []).filter(
      (t) => !LEGACY_DUMMY_IDS.has(t.id)
    );
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
