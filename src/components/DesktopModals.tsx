"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  UploadCloud,
  FileText,
  Sparkles,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import JournalCombobox from "@/components/JournalCombobox";
import { pickManuscriptFileDesktop, isDesktopApp } from "@/lib/desktop";
import { PaperItem } from "./DesktopSidebar";

interface DesktopSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (id: string) => void;
  papers?: PaperItem[];
}

export function DesktopSearchModal({
  isOpen,
  onClose,
  onSelectItem,
  papers = [],
}: DesktopSearchModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Toggle
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const staticServices = [
    { id: "tool-ai-review", title: "Pre-Submission AI Review (5-Persona Diagnostic)", cat: "Service" },
    { id: "tool-journal-fit", title: "Journal Fit Predictor (1,300+ Catalogs)", cat: "Service" },
    { id: "tool-reference-checker", title: "Reference Integrity Audit (CrossRef & Retractions)", cat: "Service" },
    { id: "tool-citation-claim", title: "Citation Claim Validator", cat: "Service" },
    { id: "tool-prisma", title: "PRISMA 2020 Flow Diagram Generator", cat: "Service" },
    { id: "tool-cover-letter", title: "Journal Cover Letter Generator", cat: "Service" },
    { id: "tool-response-builder", title: "Review Response Rebuttal Matrix", cat: "Service" },
  ];

  const paperItems = papers.map((p) => ({
    id: p.id,
    title: p.title || p.shortName,
    subtitle: `${p.journal} • Score: ${p.score}%`,
    cat: "Manuscript",
  }));

  const items = [...paperItems, ...staticServices].filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-xl p-4">
      <div className="w-full max-w-xl rounded-3xl liquid-glass-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/10 dark:border-white/10">
          <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers, vulnerabilities, reviewer comments..."
            className="flex-1 bg-transparent text-sm text-[#111827] dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
              No matching items found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectItem(item.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-left transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-neutral-400 dark:text-neutral-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition" />
                    <span className="text-xs font-medium text-[#111827] dark:text-neutral-200">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-400 bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 px-2 py-0.5 rounded-md">
                    {item.cat}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DesktopNewReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, journal: string, file: File | null) => void;
}

export function DesktopNewReviewModal({
  isOpen,
  onClose,
  onSubmit,
}: DesktopNewReviewModalProps) {
  const [journal, setJournal] = useState("");
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNativePick = async () => {
    if (isDesktopApp()) {
      const res = await pickManuscriptFileDesktop();
      if (res) {
        setFileName(res.name);
        // Create synthetic File object
        const blob = new Blob([res.bytes as unknown as BlobPart]);
        const file = new File([blob], res.name);
        setSelectedFile(file);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xl p-4">
      <div className="w-full max-w-lg rounded-3xl liquid-glass-modal p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🪄</span>
            <div>
              <h2 className="text-sm font-bold text-[#111827] dark:text-white">
                New Pre-Submission Review
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Run 5-persona simulations &amp; cross-ref audits on your manuscript.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#374151] dark:text-neutral-300 mb-1">
              Target Journal
            </label>
            <JournalCombobox
              value={journal}
              onChange={setJournal}
              placeholder="Type at least 3 letters to search journals..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] dark:text-neutral-300 mb-1">
              Manuscript Working Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Single-cell transcriptional profiling of DLL3 activation..."
              className="w-full px-3.5 py-2 rounded-xl liquid-glass-input text-xs text-[#111827] dark:text-white dark:placeholder-neutral-500 focus:outline-none"
            />
          </div>

          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] dark:text-neutral-300 mb-1">
              Manuscript Document (.pdf or .docx)
            </label>
            <div
              onClick={() => {
                if (isDesktopApp()) {
                  handleNativePick();
                }
              }}
              className="border border-dashed border-neutral-300 dark:border-white/15 hover:border-blue-500/50 dark:hover:border-blue-400/50 rounded-2xl p-6 text-center cursor-pointer transition bg-white/40 dark:bg-white/5 hover:bg-blue-500/5 backdrop-blur-xs"
            >
              <UploadCloud className="w-8 h-8 text-neutral-400 dark:text-neutral-500 mx-auto mb-2" />
              {fileName ? (
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{fileName}</p>
              ) : (
                <>
                  <p className="text-xs font-semibold text-[#111827] dark:text-white">
                    Click to select manuscript file
                  </p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                    PDF, DOCX, or Markdown supported
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl liquid-glass-btn-secondary text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSubmit(title || "Untitled Manuscript", journal, selectedFile);
              onClose();
            }}
            className="px-5 py-2 rounded-xl liquid-glass-btn-primary text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Start Review</span>
          </button>
        </div>
      </div>
    </div>
  );
}
