import React from "react";
import {
  SlidersHorizontal,
  Hash,
  ShieldCheck,
  RefreshCw,
  Activity,
  Zap,
  Check,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import type { AvailableModel } from "@/lib/types";

interface ScanModelPickerBarProps {
  apiStatus: string;
  isApiLoading: boolean;
  activeProviderInfo: { name: string; model: string };
  availableModels: AvailableModel[];
  apiErrorMessage: string | null;
  latencyMs: number | null;
  modelDropdownOpen: boolean;
  setModelDropdownOpen: (open: boolean) => void;
  modelSearchQuery: string;
  setModelSearchQuery: (q: string) => void;
  handleSelectModel: (id: string) => void;
  checkProviderStatus: () => void;
  onOpenSettings?: () => void;
}

export function ScanModelPickerBar({
  apiStatus,
  isApiLoading,
  activeProviderInfo,
  availableModels,
  apiErrorMessage,
  latencyMs,
  modelDropdownOpen,
  setModelDropdownOpen,
  modelSearchQuery,
  setModelSearchQuery,
  handleSelectModel,
  checkProviderStatus,
  onOpenSettings,
}: ScanModelPickerBarProps) {
  const filteredModels = React.useMemo(() => {
    if (!modelSearchQuery.trim()) return availableModels;
    const q = modelSearchQuery.toLowerCase();
    return availableModels.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.tag && m.tag.toLowerCase().includes(q))
    );
  }, [availableModels, modelSearchQuery]);

  return (
    <>
      {/* AI Engine */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
        <span className="w-48 sm:w-52 shrink-0 flex items-center gap-2 font-semibold text-[#6B7280] dark:text-neutral-400 whitespace-nowrap">
          <SlidersHorizontal className="w-4 h-4 text-[#9CA3AF] dark:text-neutral-500" />
          AI Engine
        </span>
        <div className="flex-1 flex flex-wrap items-center gap-2">
          {apiStatus === "connected" && (
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#ECFDF5] dark:bg-emerald-950/50 text-[#065F46] dark:text-emerald-300 border border-[#A7F3D0] dark:border-emerald-800 hover:bg-[#D1FAE5] dark:hover:bg-emerald-900/50 transition shadow-2xs cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>
                  {activeProviderInfo.name}: <span className="font-mono">{activeProviderInfo.model}</span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#065F46] dark:text-emerald-300 ml-0.5" />
              </button>

              {modelDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-[480px] max-w-[92vw] rounded-2xl bg-white dark:bg-[#161F30] border border-[#E5E7EB] dark:border-[#334155] shadow-2xl p-3 z-50 animate-fade-in text-xs">
                  <div className="px-2 py-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 border-b border-[#E5E7EB] dark:border-[#334155] uppercase tracking-wider flex items-center justify-between">
                    <span>Select Available Model</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                      {availableModels.length} models
                    </span>
                  </div>

                  {/* Search Bar */}
                  {availableModels.length > 5 && (
                    <div className="pt-2.5 pb-1 px-0.5">
                      <div className="relative flex items-center">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={modelSearchQuery}
                          onChange={(e) => setModelSearchQuery(e.target.value)}
                          placeholder="Search models (e.g. flash, pro, 3.1)..."
                          className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-neutral-50 dark:bg-[#1E293B] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {modelSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setModelSearchQuery("")}
                            className="absolute right-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="max-h-72 overflow-y-auto py-1 space-y-1 [scrollbar-width:thin]">
                    {filteredModels.map((m) => {
                      const isCur = activeProviderInfo.model === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            handleSelectModel(m.id);
                            setModelDropdownOpen(false);
                            setModelSearchQuery("");
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl transition flex items-start justify-between gap-3 ${
                            isCur
                              ? "bg-neutral-100 dark:bg-[#1E293B] text-[#111827] dark:text-white font-semibold border border-neutral-300 dark:border-neutral-600"
                              : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#1E293B]/60"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-semibold text-[#0F172A] dark:text-neutral-100">
                                {m.id}
                              </span>
                              {m.tag && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  {m.tag}
                                </span>
                              )}
                            </div>
                            {m.description && (
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                                {m.description}
                              </div>
                            )}
                          </div>
                          {isCur && (
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                    {filteredModels.length === 0 && (
                      <div className="py-6 text-center text-xs text-neutral-400">
                        No models found matching &ldquo;{modelSearchQuery}&rdquo;
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#334155] flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setModelDropdownOpen(false);
                        if (onOpenSettings) onOpenSettings();
                      }}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      AI Settings &amp; Custom Keys &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {apiStatus === "unconfigured" && (
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEF3C7] dark:bg-amber-950/40 text-[#92400E] dark:text-amber-300 border border-[#FDE68A] dark:border-amber-800">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                No API Key (Setup Required)
              </span>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                >
                  Configure Provider &rarr;
                </button>
              )}
            </div>
          )}

          {apiStatus === "error" && (
            <div className="inline-flex items-center gap-2">
              <span
                title={apiErrorMessage || "Connection error"}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEF2F2] dark:bg-rose-950/40 text-[#991B1B] dark:text-rose-300 border border-[#FECACA] dark:border-rose-800"
              >
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                {activeProviderInfo.name}: Connection Error
              </span>
              <button
                type="button"
                onClick={() => checkProviderStatus()}
                disabled={isApiLoading}
                className="text-xs text-neutral-600 dark:text-neutral-400 font-medium hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isApiLoading ? "animate-spin" : ""}`} />
                Retry
              </button>
            </div>
          )}

          {apiStatus === "checking" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
              Testing Connection...
            </span>
          )}

          {/* Latency Test Button & Result (only visible when connected) */}
          {apiStatus === "connected" && (
            <>
              <button
                type="button"
                onClick={() => checkProviderStatus()}
                disabled={isApiLoading}
                className="isolate inline-flex items-center justify-center gap-1.5 text-xs px-2.5 py-1 min-w-[110px] rounded-lg bg-white dark:bg-[#1E293B] hover:bg-neutral-50 dark:hover:bg-[#334155] border border-[#E5E7EB] dark:border-[#334155] text-neutral-700 dark:text-neutral-300 shadow-2xs transition-colors disabled:opacity-60 cursor-pointer select-none"
                style={{ transform: "translateZ(0)" }}
                title="Test API connection & ping latency"
              >
                {isApiLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                )}
                {isApiLoading ? (
                  <span key="pinging">Testing...</span>
                ) : (
                  <span key="idle">Check Latency</span>
                )}
              </button>

              {latencyMs !== null && !isApiLoading && (
                <span
                  title={`Response latency: ${latencyMs}ms`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium border bg-[#ECFDF5] dark:bg-emerald-950/50 text-[#065F46] dark:text-emerald-300 border-[#A7F3D0] dark:border-emerald-800"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span>{latencyMs}ms</span>
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Diagnostic Scope */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
        <span className="w-48 sm:w-52 shrink-0 flex items-center gap-2 font-semibold text-[#6B7280] dark:text-neutral-400 whitespace-nowrap">
          <Hash className="w-4 h-4 text-[#9CA3AF] dark:text-neutral-500" />
          Diagnostic Scope
        </span>
        <div className="flex-1 text-neutral-600 dark:text-neutral-400 text-xs">
          6 Evaluation Dimensions &bull; 5 Reviewer Personas &bull; Scope &amp; Triage Alignment &bull; Actionable Prioritization
        </div>
      </div>

      {/* Data Retention */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
        <span className="w-48 sm:w-52 shrink-0 flex items-center gap-2 font-semibold text-[#6B7280] dark:text-neutral-400 whitespace-nowrap">
          <ShieldCheck className="w-4 h-4 text-[#9CA3AF] dark:text-neutral-500" />
          Data Retention
        </span>
        <div className="flex-1 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-medium text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Zero-storage &bull; In-memory only &bull; Never used to train models</span>
        </div>
      </div>
    </>
  );
}
