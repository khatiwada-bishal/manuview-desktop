import React, { useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, FolderOpen, X, FileText } from "lucide-react";
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
  autoCloseMs = 8000,
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
      }, 4000);
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
  const displayFileName = toast.fileName || (toast.filePath ? toast.filePath.split(/[\\/]/).pop() : undefined);
  const showFolderLink = isSuccess && Boolean(toast.filePath && isDesktopApp());

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed bottom-5 right-5 z-50 w-[380px] max-w-[calc(100vw-32px)] bg-white dark:bg-[#161F30] border border-neutral-200/90 dark:border-[#334155] rounded-2xl shadow-2xl p-4 transition-all duration-200 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-full shrink-0 mt-0.5">
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
              {isSuccess ? "Report Exported" : "Export Failed"}
            </h4>
            <button
              type="button"
              onClick={onClose}
              className="p-1 -mr-1 -mt-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {toast.message}
          </p>

          {displayFileName && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100/80 dark:bg-[#1E293B]/80 text-[11px] text-neutral-700 dark:text-neutral-300 font-mono truncate border border-neutral-200/60 dark:border-[#334155]/60">
              <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{displayFileName}</span>
            </div>
          )}

          {showFolderLink && (
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenFolder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F172A] hover:bg-[#1E293B] text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-[#0F172A] transition shadow-xs cursor-pointer group"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600 group-hover:scale-110 transition-transform" />
                <span>{isMacOS() ? "Reveal in Finder" : "Open Folder"}</span>
              </button>
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                View saved file
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
