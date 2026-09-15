"use client";

import React, { useEffect } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { PaperItem } from "./DesktopSidebar";

interface DeleteConfirmationModalProps {
  paper?: PaperItem | null;
  papers?: PaperItem[] | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({
  paper,
  papers,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmationModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const targetPapers = papers && papers.length > 0 ? papers : paper ? [paper] : [];
  if (!isOpen || targetPapers.length === 0) return null;

  const isMultiple = targetPapers.length > 1;
  const singleItem = targetPapers[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xl p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-3xl liquid-glass-modal p-6 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 backdrop-blur-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827] dark:text-white">
                {isMultiple
                  ? `Delete ${targetPapers.length} Manuscript Projects`
                  : "Delete Manuscript Project"}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isMultiple
                  ? `Permanently remove ${targetPapers.length} selected manuscripts.`
                  : "This action is permanent and cannot be undone."}
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

        {/* Project details card */}
        {isMultiple ? (
          <div className="rounded-2xl liquid-glass-card p-3 space-y-2 text-left max-h-48 overflow-y-auto [scrollbar-width:thin]">
            <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-1">
              Selected Manuscripts ({targetPapers.length})
            </div>
            <div className="space-y-1.5">
              {targetPapers.map((p) => (
                <div
                  key={p.id}
                  className="p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#111827] dark:text-white truncate">
                      {p.title || p.shortName}
                    </div>
                    <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                      {p.journal}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 shrink-0">
                    {p.score ?? 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl liquid-glass-card p-3.5 space-y-1.5 text-left">
            <div className="text-xs font-semibold text-[#111827] dark:text-white truncate">
              {singleItem.title || singleItem.shortName}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">{singleItem.journal}</span>
              <span>&bull;</span>
              {singleItem.isDeskReject || singleItem.editorialTriage?.outcome === "desk_reject" || singleItem.ineligibilityReason === "scope_mismatch" ? (
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  Editorial Desk Reject
                </span>
              ) : singleItem.isEligibleForReview === false ? (
                <span className="font-medium text-neutral-500 dark:text-neutral-400">
                  {singleItem.ineligibilityReason === "already_published" ? "Already Published" : "Non-Article"}
                </span>
              ) : (
                <span className="font-mono text-neutral-500 dark:text-neutral-400">Score: {singleItem.score ?? 0}%</span>
              )}
            </div>
          </div>
        )}

        {/* Warning text */}
        <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 bg-amber-500/10 border border-amber-500/25 backdrop-blur-xs rounded-2xl p-3.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>
            {isMultiple
              ? `All diagnostic evaluations, persona reviewer reports, and causal claim analyses for these ${targetPapers.length} manuscripts will be permanently removed from your computer.`
              : "All diagnostic evaluations, persona reviewer reports, and causal claim analyses for this manuscript will be permanently removed from your computer."}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-black/10 dark:border-white/10">
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
              onConfirm();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-xs transition cursor-pointer active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {isMultiple ? `Delete ${targetPapers.length} Projects` : "Delete Project"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
