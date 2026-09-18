import {
  Compass,
  CheckCircle2,
  ShieldCheck,
  Layers,
  FileText,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import type { PaperItem, DesktopActiveView } from "@/components/DesktopSidebar";

export type TimeCategory =
  | "Today"
  | "Yesterday"
  | "Previous 7 Days"
  | "Previous 30 Days"
  | "Older";

export interface GroupedPapers {
  category: TimeCategory;
  papers: PaperItem[];
}

export interface SidebarServiceItem {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  squircleBg?: string;
  action: () => void;
}

/**
 * Categorizes an ISO date string or timestamp into human time buckets:
 * "Today" | "Yesterday" | "Previous 7 Days" | "Previous 30 Days" | "Older"
 */
export function getTimeCategory(dateInput?: string | number | Date, paperId?: string): TimeCategory {
  let date: Date | null = null;
  if (dateInput) {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      date = d;
    }
  }
  if (!date && paperId) {
    // Try to extract 13-digit millisecond timestamp from id suffix (e.g. paper-1726300000000)
    const match = paperId.match(/(\d{13})/);
    if (match) {
      const ts = parseInt(match[1], 10);
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        date = d;
      }
    }
  }
  if (!date) return "Today";

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const sevenDaysAgoStart = todayStart - 6 * 86400000;
  const thirtyDaysAgoStart = todayStart - 29 * 86400000;

  const itemTime = date.getTime();

  if (itemTime >= todayStart) {
    return "Today";
  } else if (itemTime >= yesterdayStart) {
    return "Yesterday";
  } else if (itemTime >= sevenDaysAgoStart) {
    return "Previous 7 Days";
  } else if (itemTime >= thirtyDaysAgoStart) {
    return "Previous 30 Days";
  } else {
    return "Older";
  }
}

/**
 * Groups a list of PaperItems by their review/creation time in chronological bucket order.
 * Within each category, papers are sorted newest first.
 */
export function groupPapersByTime(papers: PaperItem[]): GroupedPapers[] {
  const categoriesOrder: TimeCategory[] = [
    "Today",
    "Yesterday",
    "Previous 7 Days",
    "Previous 30 Days",
    "Older",
  ];

  const map = new Map<TimeCategory, PaperItem[]>();
  for (const cat of categoriesOrder) {
    map.set(cat, []);
  }

  for (const paper of papers) {
    const cat = getTimeCategory(paper.createdAt || paper.updatedAt, paper.id);
    map.get(cat)!.push(paper);
  }

  const result: GroupedPapers[] = [];
  for (const cat of categoriesOrder) {
    const list = map.get(cat)!;
    if (list.length > 0) {
      list.sort((a, b) => {
        let timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
        if (isNaN(timeA) || timeA === 0) {
          const matchA = a.id?.match(/(\d{13})/);
          if (matchA) timeA = parseInt(matchA[1], 10);
        }
        let timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
        if (isNaN(timeB) || timeB === 0) {
          const matchB = b.id?.match(/(\d{13})/);
          if (matchB) timeB = parseInt(matchB[1], 10);
        }
        return (timeB || 0) - (timeA || 0);
      });
      result.push({ category: cat, papers: list });
    }
  }

  return result;
}

export function buildSidebarServices(params: {
  onSelectService?: (serviceId: string) => void;
  onSelectView: (view: DesktopActiveView) => void;
  onNewReview: () => void;
}): SidebarServiceItem[] {
  const { onSelectService, onSelectView, onNewReview } = params;

  return [
    {
      id: "journal-fit",
      name: "Journal Fit Predictor",
      description: "1,300+ catalog matcher",
      icon: Compass,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
      squircleBg: "bg-emerald-500 text-white shadow-xs",
      action: () => {
        if (onSelectService) onSelectService("journal-fit");
        else onNewReview();
      },
    },
    {
      id: "reference-checker",
      name: "Reference Integrity Audit",
      description: "Crossref & Retraction Watch",
      icon: CheckCircle2,
      color: "text-teal-600 bg-teal-50 dark:bg-teal-950/50 dark:text-teal-400",
      squircleBg: "bg-teal-500 text-white shadow-xs",
      action: () => {
        if (onSelectService) onSelectService("reference-checker");
        else onSelectView("citations");
      },
    },
    {
      id: "citation-claim",
      name: "Citation Claim Validator",
      description: "Evidence claim alignment",
      icon: ShieldCheck,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
      squircleBg: "bg-amber-500 text-white shadow-xs",
      action: () => {
        if (onSelectService) onSelectService("citation-claim");
        else onNewReview();
      },
    },
    {
      id: "prisma",
      name: "PRISMA Flow Diagram",
      description: "Systematic review generator",
      icon: Layers,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
      squircleBg: "bg-purple-500 text-white shadow-xs",
      action: () => {
        if (onSelectService) onSelectService("prisma");
        else onNewReview();
      },
    },
    {
      id: "cover-letter",
      name: "Journal Cover Letter",
      description: "Formal editor submission letter",
      icon: FileText,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400",
      squircleBg: "bg-sky-500 text-white shadow-xs",
      action: () => {
        if (onSelectService) onSelectService("cover-letter");
        else onNewReview();
      },
    },
    {
      id: "response-builder",
      name: "Review Response Builder",
      description: "Point-by-point rebuttal matrix",
      icon: MessageSquare,
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400",
      squircleBg: "bg-rose-500 text-white shadow-xs",
      action: () => {
        if (onSelectService) onSelectService("response-builder");
        else onSelectView("personas");
      },
    },
  ];
}
