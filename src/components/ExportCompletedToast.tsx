import React, { useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, FolderOpen, X } from "lucide-react";
import { openFolder, isMacOS, isDesktopApp } from "@/lib/desktop";

export interface ExportToastData {
  id: number;
  status: "success" | "error";
  message: string;
  fileName?: string;
  filePath?: string;
}

interface ExportCompletedToastProps {
  toast: ExportToastData | null;
  onClose: () => void;
  autoCloseMs?: number;
}

export function ExportCompletedToast({
  toast,
  onClose,
  autoCloseMs = 7000,
}: ExportCompletedToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!toast) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onClose();
    }, autoCloseMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast, onClose, autoCloseMs]);

  if (!toast) return null;

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, 3500);
    }
  };

  const handleOpenFolder = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (toast.filePath) {
      await openFolder(toast.filePath);
    }
  };

  const isSuccess = toast.status === "success";
  const showFolderLink = isSuccess && Boolean(toast.filePath && isDesktopApp());

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium shadow-2xl border border-neutral-700 dark:border-neutral-200 animate-fade-in select-none"
    >
      {isSuccess ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-rose-400 dark:text-rose-600 shrink-0" />
      )}

      <span className="truncate max-w-[320px]">{toast.message}</span>

      {showFolderLink && (
        <>
          <span className="text-neutral-600 dark:text-neutral-300">|</span>
          <button
            type="button"
            onClick={handleOpenFolder}
            className="inline-flex items-center gap-1 font-semibold text-blue-400 dark:text-blue-600 hover:underline cursor-pointer shrink-0 underline-offset-2"
            title={isMacOS() ? "Reveal exported file in Finder" : "Open containing folder"}
          >
            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
            <span>{isMacOS() ? "Show in Finder" : "Show in Folder"}</span>
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onClose}
        className="p-0.5 ml-1 -mr-1.5 rounded text-neutral-400 hover:text-white dark:text-neutral-500 dark:hover:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition cursor-pointer shrink-0"
        title="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
