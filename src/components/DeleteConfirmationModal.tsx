"use client";

import React, { useEffect } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { PaperItem } from "./DesktopSidebar";

interface DeleteConfirmationModalProps {
  paper: PaperItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({
  paper,
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

  if (!isOpen || !paper) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] p-6 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">
                Delete Manuscript Project
              </h3>
              <p className="text-xs text-neutral-500">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Project details card */}
        <div className="rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 space-y-1.5 text-left">
          <div className="text-xs font-semibold text-[#111827] truncate">
            {paper.title || paper.shortName}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
            <span className="font-medium text-neutral-600">{paper.journal}</span>
            <span>&bull;</span>
            <span className="font-mono text-neutral-500">Score: {paper.score}%</span>
          </div>
        </div>

        {/* Warning text */}
        <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            All diagnostic evaluations, persona reviewer reports, and causal claim analyses for this manuscript will be permanently removed from your computer.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-[#E5E7EB]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-neutral-700 bg-white border border-[#E5E7EB] hover:bg-neutral-50 transition cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Project</span>
          </button>
        </div>
      </div>
    </div>
  );
}
