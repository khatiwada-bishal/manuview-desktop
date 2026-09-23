"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  X,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  HardDrive,
  Zap,
  Play,
  Check,
  ShieldCheck,
} from "lucide-react";
import {
  SUPPORTED_LOCAL_MODELS,
  LocalModelInfo,
  isWebGPUSupported,
  checkWebGPUCapabilities,
  type WebGPUCapabilityCheck,
  isModelCached,
  deleteModelFromCache,
  initLocalModel,
  generateWithLocalSLM,
  subscribeToLocalModelStatus,
  getLocalModelStatus,
  DEFAULT_LOCAL_MODEL,
  LocalModelProgress,
} from "@/lib/webllm/webllm-service";
import {
  LAYA_MODEL,
  subscribeToLayaStatus,
  getLayaStatus,
  isLayaCached,
  initLayaModel,
  deleteLayaCache,
  runLayaClassification,
  type LayaProgress,
} from "@/lib/laya/laya-service";
import { isDesktopApp, isMacOS } from "@/lib/desktop";

interface LocalModelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isScanning?: boolean;
}

export function LocalModelManagerModal({ isOpen, onClose, isScanning = false }: LocalModelManagerModalProps) {
  const [modelCategory, setModelCategory] = useState<"decision" | "slm">("decision");
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_LOCAL_MODEL);
  const [gpuCapability, setGpuCapability] = useState<WebGPUCapabilityCheck | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [checkingCache, setCheckingCache] = useState<boolean>(true);
  const [status, setStatus] = useState<LocalModelProgress>(getLocalModelStatus());

  // Laya Decision Model state
  const [layaCached, setLayaCached] = useState<boolean>(false);
  const [checkingLayaCache, setCheckingLayaCache] = useState<boolean>(true);
  const [layaStatus, setLayaStatus] = useState<LayaProgress>(getLayaStatus());
  const [layaTestPrompt, setLayaTestPrompt] = useState<string>(
    "This double-blind randomized clinical trial evaluated 450 participants and reported p < 0.001 with 95% confidence intervals."
  );
  const [layaTestOutput, setLayaTestOutput] = useState<string>("");
  const [isLayaTesting, setIsLayaTesting] = useState<boolean>(false);
  
  // SLM Test generation state
  const [testPrompt, setTestPrompt] = useState<string>("Summarize the importance of reporting effect sizes and sample sizes in academic research.");
  const [testOutput, setTestOutput] = useState<string>("");
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testStats, setTestStats] = useState<{ durationSec: number; tokenCount: number } | null>(null);

  useEffect(() => {
    let active = true;
    async function audit() {
      const cap = await checkWebGPUCapabilities();
      if (active) {
        setGpuCapability(cap);
      }
    }
    audit();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const unsub = subscribeToLocalModelStatus((prog) => {
      setStatus(prog);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToLayaStatus((prog) => {
      setLayaStatus(prog);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      setCheckingCache(true);
      const cached = await isModelCached(selectedModel);
      if (!cancelled) {
        setIsCached(cached);
        setCheckingCache(false);
      }
    }
    if (isOpen) {
      check();
    }
    return () => {
      cancelled = true;
    };
  }, [selectedModel, isOpen, status.state]);

  useEffect(() => {
    let cancelled = false;
    async function checkLaya() {
      setCheckingLayaCache(true);
      const cached = await isLayaCached();
      if (!cancelled) {
        setLayaCached(cached);
        setCheckingLayaCache(false);
      }
    }
    if (isOpen) {
      checkLaya();
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen, layaStatus.state]);

  const isMacDesktop = isDesktopApp() && isMacOS();
  const isBufferConstrained = Boolean(gpuCapability?.supported && !gpuCapability?.meetsBufferRequirement);
  const isWebGPUAvailable = gpuCapability ? Boolean(gpuCapability.supported && gpuCapability.meetsBufferRequirement) : true;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentModelInfo = SUPPORTED_LOCAL_MODELS.find((m) => m.id === selectedModel) || SUPPORTED_LOCAL_MODELS[0];

  const handleDownload = async () => {
    try {
      await initLocalModel(selectedModel);
      setIsCached(true);
    } catch (err: any) {
      console.error("Download failed:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Remove ${currentModelInfo.name} from local cache to free ~${currentModelInfo.sizeMB} MB?`)) {
      return;
    }
    try {
      await deleteModelFromCache(selectedModel);
      setIsCached(false);
      setTestOutput("");
      setTestStats(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleDownloadLaya = async () => {
    try {
      await initLayaModel();
      setLayaCached(true);
    } catch (err: any) {
      console.error("Laya download failed:", err);
    }
  };

  const handleDeleteLaya = async () => {
    if (!confirm(`Remove ${LAYA_MODEL.name} (~${LAYA_MODEL.sizeMB} MB) from local cache?`)) {
      return;
    }
    try {
      await deleteLayaCache();
      setLayaCached(false);
      setLayaTestOutput("");
    } catch (err) {
      console.error("Laya delete failed:", err);
    }
  };

  const handleRunLayaTest = async () => {
    if (!layaTestPrompt.trim()) return;
    setIsLayaTesting(true);
    setLayaTestOutput("");
    const startTime = performance.now();
    try {
      const res = await runLayaClassification(
        layaTestPrompt.trim(),
        [
          "Empirical study with quantitative statistics",
          "Theoretical essay without empirical statistics",
        ],
        { hypothesisTemplate: "This text describes a {}." }
      );
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      const topLabel = res.labels[0] || "Unknown";
      const topScore = res.scores[0] !== undefined ? Math.round(res.scores[0] * 100) : 0;
      setLayaTestOutput(
        `Classified as: "${topLabel}" (${topScore}% confidence) in ${duration}s on-device via Laya.`
      );
    } catch (err: any) {
      setLayaTestOutput(`Error: ${err.message || String(err)}`);
    } finally {
      setIsLayaTesting(false);
    }
  };

  const handleRunTest = async () => {
    if (!testPrompt.trim()) return;
    setIsTesting(true);
    setTestOutput("");
    setTestStats(null);

    const startTime = performance.now();
    let tokens = 0;

    try {
      await generateWithLocalSLM(
        [{ role: "user", content: testPrompt }],
        selectedModel,
        (_delta, acc) => {
          setTestOutput(acc);
          tokens = acc.split(/\s+/).filter(Boolean).length;
        }
      );
      const duration = (performance.now() - startTime) / 1000;
      setTestStats({
        durationSec: parseFloat(duration.toFixed(1)),
        tokenCount: tokens,
      });
    } catch (err: any) {
      setTestOutput(`Error: ${err.message || String(err)}`);
    } finally {
      setIsTesting(false);
    }
  };

  const isDownloading = status.state === "downloading" || status.state === "compiling";
  const isLayaDownloading = layaStatus.state === "downloading";

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[3px] animate-in fade-in duration-200 cursor-default"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl p-6 rounded-3xl bg-white dark:bg-[#0E1322] border border-black/10 dark:border-white/10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto cursor-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-black/5 dark:border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Cpu className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                On-Device Local AI &amp; Decision Models
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-lg leading-relaxed">
              Execute neural models completely offline on your device’s GPU. No data leaves your machine, ensuring 100% confidential peer-review evaluation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Active Banner */}
        {isScanning && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold">Manuscript Review in Progress</div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300">
                A background scan is currently utilizing the AI engine. Modifying or loading local models is locked until the review completes.
              </div>
            </div>
          </div>
        )}

        {/* Category Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={() => setModelCategory("decision")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
              modelCategory === "decision"
                ? "bg-white dark:bg-[#1E293B] text-blue-700 dark:text-blue-300 shadow-xs border border-blue-500/20"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span>Decision Model (Laya 421M)</span>
          </button>
          <button
            type="button"
            onClick={() => setModelCategory("slm")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
              modelCategory === "slm"
                ? "bg-white dark:bg-[#1E293B] text-purple-700 dark:text-purple-300 shadow-xs border border-purple-500/20"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-500" />
            <span>Generative SLMs (WebLLM)</span>
          </button>
        </div>

        {/* TAB 1: Laya Decision Model */}
        {modelCategory === "decision" ? (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Model Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-sky-50/40 dark:from-blue-950/20 dark:to-neutral-900/40 border border-blue-200/80 dark:border-blue-900/50 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                      {LAYA_MODEL.name}
                    </h3>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300">
                      ModernBERT ({LAYA_MODEL.parameters})
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed">
                    {LAYA_MODEL.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-500/15 text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
                <div>
                  <span className="text-neutral-400 block text-[10px]">WEIGHTS</span>
                  <span>~{LAYA_MODEL.sizeMB} MB</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">ARCHITECTURE</span>
                  <span>ModernBERT</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">ENGINE</span>
                  <span>Transformers.js</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">ACCELERATION</span>
                  <span>WebGPU / WASM</span>
                </div>
              </div>
            </div>

            {/* Cache Status & Actions */}
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Cache Storage Status
                  </span>
                </div>
                {checkingLayaCache ? (
                  <span className="text-[11px] text-neutral-400">Checking...</span>
                ) : layaCached ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> Cached &amp; Ready
                  </span>
                ) : (
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Not stored locally
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {isLayaDownloading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-600 dark:text-neutral-400">
                    <span className="truncate pr-2">{layaStatus.statusText || "Loading weights..."}</span>
                    <span className="font-bold shrink-0">{Math.round((layaStatus.progress || 0) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.round((layaStatus.progress || 0) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {layaStatus.state === "error" && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-rose-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-semibold">Download Failed</div>
                    <div className="opacity-90">{layaStatus.error || layaStatus.statusText}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {layaCached
                    ? "Permanently stored in browser cache. Runs 100% offline."
                    : `Requires a one-time ~${LAYA_MODEL.sizeMB} MB download.`}
                </p>

                <div className="flex items-center gap-2">
                  {layaCached ? (
                    <button
                      type="button"
                      onClick={handleDeleteLaya}
                      disabled={isLayaDownloading || isScanning}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-red-500/20 text-red-600 hover:text-red-700 hover:bg-red-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Free Disk Space</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDownloadLaya}
                      disabled={isLayaDownloading || isScanning}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {isLayaDownloading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Downloading Weights...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download {LAYA_MODEL.name}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live Test Benchmark for Laya */}
            {layaCached && (
              <div className="p-4 rounded-2xl bg-blue-500/[0.03] border border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Live On-Device Classification Test
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={layaTestPrompt}
                    onChange={(e) => setLayaTestPrompt(e.target.value)}
                    placeholder="Enter manuscript sentence..."
                    className="w-full px-3 py-2 rounded-xl liquid-glass-input text-xs focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleRunLayaTest}
                      disabled={isLayaTesting || !layaTestPrompt.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      {isLayaTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Evaluating...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Run Zero-Shot Evaluation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {layaTestOutput && (
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-sans text-neutral-800 dark:text-neutral-200 max-h-40 overflow-y-auto leading-relaxed">
                    {layaTestOutput}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: Generative SLMs (WebLLM) */
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* WebGPU Status Check */}
            {isBufferConstrained ? (
              <div className="p-4 rounded-2xl border text-xs bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-200 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <div className="font-semibold text-amber-950 dark:text-amber-100">
                        {isMacDesktop
                          ? `macOS WebGPU Storage Buffer Limit Detected (${gpuCapability?.storageBufferLimit ?? 9}/10 Buffers)`
                          : `Browser WebGPU Storage Buffer Limit Detected (${gpuCapability?.storageBufferLimit ?? 9}/10 Buffers)`}
                      </div>
                      <div className="opacity-90 text-[11px] mt-0.5 leading-relaxed">
                        {isMacDesktop
                          ? `macOS desktop webview restricts WebGPU storage buffers to ${gpuCapability?.storageBufferLimit ?? 9}. WebLLM requires 10 storage buffers to run model shaders. For local native models on macOS, Ollama is recommended.`
                          : `Your current browser (Safari / WebKit) restricts WebGPU storage buffers to ${gpuCapability?.storageBufferLimit ?? 9} for privacy fingerprinting protection. WebLLM requires 10 storage buffers to run model shaders.`}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-200 font-semibold shrink-0">
                    Buffer Limit
                  </span>
                </div>

                <div className="pl-6 pt-1 border-t border-amber-500/15 text-[11px] flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">How to run local models:</span>
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                    {isMacDesktop ? (
                      <>
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-black/30 border border-amber-500/30 text-amber-900 dark:text-amber-100 font-sans font-medium">
                          Use Ollama (Native Local Engine)
                        </span>
                        <span className="text-neutral-400">or</span>
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-black/30 border border-amber-500/30 text-amber-900 dark:text-amber-100 font-sans font-medium">
                          Open in Chrome / Edge (WebGPU)
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-black/30 border border-amber-500/30 text-amber-900 dark:text-amber-100 font-sans font-medium">
                          Open in Google Chrome or Edge
                        </span>
                        <span className="text-neutral-400">or</span>
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-black/30 border border-amber-500/30 text-amber-900 dark:text-amber-100 font-sans font-medium">
                          Use Ollama (Self-Hosted)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                isWebGPUAvailable
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
              }`}>
                <div className="flex items-center gap-2.5">
                  {isWebGPUAvailable ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  )}
                  <div>
                    <div className="font-semibold">
                      {isWebGPUAvailable ? "WebGPU Hardware Acceleration Supported" : "WebGPU Not Detected"}
                    </div>
                    <div className="opacity-80 text-[11px]">
                      {isWebGPUAvailable
                        ? "Your browser and graphics hardware can execute local models at high speeds."
                        : "Requires Chrome, Edge, Brave, or Safari 18+. Deterministic offline engines remain active."}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 font-semibold">
                  {isWebGPUAvailable ? "Active" : "Unavailable"}
                </span>
              </div>
            )}

            {/* Model Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Available Small Language Models
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SUPPORTED_LOCAL_MODELS.map((model) => {
                  const isSelected = selectedModel === model.id;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => setSelectedModel(model.id)}
                      className={`p-3 rounded-2xl border text-left transition relative cursor-pointer ${
                        isSelected
                          ? "bg-purple-500/10 border-purple-500 text-neutral-900 dark:text-white ring-1 ring-purple-500/50"
                          : "bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      {model.isDefault && (
                        <span className="absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white shadow-xs">
                          Fastest
                        </span>
                      )}
                      <div className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-1">
                        <span>{model.name}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                        {model.description}
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                        <span>~{model.sizeMB} MB</span>
                        <span>{model.vramMB} MB VRAM</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model Cache & Download Panel */}
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Local Cache Status ({currentModelInfo.name})
                  </span>
                </div>
                {checkingCache ? (
                  <span className="text-[11px] text-neutral-400">Checking...</span>
                ) : isCached ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> Cached &amp; Ready
                  </span>
                ) : (
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Not stored locally
                  </span>
                )}
              </div>

              {/* Progress bar during download/compilation */}
              {isDownloading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-600 dark:text-neutral-400">
                    <span className="truncate pr-2">{status.statusText || "Loading weights..."}</span>
                    <span className="font-bold shrink-0">{Math.round((status.progress || 0) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.round((status.progress || 0) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {status.state === "error" && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-rose-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-semibold">Download Failed</div>
                    <div className="opacity-90">{status.error || status.statusText || "An error occurred during model download."}</div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {isCached
                    ? "Permanently stored in browser cache. Operates 100% offline."
                    : `Requires a one-time ~${currentModelInfo.sizeMB} MB download.`}
                </p>

                <div className="flex items-center gap-2">
                  {isCached ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDownloading || isScanning}
                      title={isScanning ? "Model management is locked during an active scan" : undefined}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        isScanning
                          ? "text-neutral-400 border-neutral-200 dark:border-neutral-800 cursor-not-allowed opacity-50"
                          : "text-red-600 hover:text-red-700 hover:bg-red-500/10 border-red-500/20 cursor-pointer"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Free Disk Space</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={!isWebGPUAvailable || isDownloading || isScanning}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition ${
                        !isWebGPUAvailable || isScanning
                          ? "bg-black/5 dark:bg-white/5 text-neutral-400 dark:text-neutral-500 border border-black/10 dark:border-white/10 cursor-not-allowed opacity-60"
                          : "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                      }`}
                    >
                      {isDownloading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{status.state === "compiling" ? "Compiling Shaders..." : "Downloading Weights..."}</span>
                        </>
                      ) : isBufferConstrained ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span>{isMacDesktop ? "Requires Ollama / Chrome" : "Requires Chrome / Edge"}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download {currentModelInfo.name}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live Test Benchmark */}
            {isCached && (
              <div className="p-4 rounded-2xl bg-purple-500/[0.03] border border-purple-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Live On-Device Benchmark &amp; Test
                  </span>
                  {testStats && (
                    <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300">
                      ~{Math.round(testStats.tokenCount / testStats.durationSec)} tok/sec ({testStats.durationSec}s)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    placeholder="Enter a test prompt..."
                    className="w-full px-3 py-2 rounded-xl liquid-glass-input text-xs focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleRunTest}
                      disabled={isTesting || !testPrompt.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating On-Device...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Run Test Inference</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {testOutput && (
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-sans text-neutral-800 dark:text-neutral-200 max-h-40 overflow-y-auto leading-relaxed">
                    {testOutput}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-xs text-neutral-500 dark:text-neutral-400">
          <span>Weights cached in browser CacheStorage (`huggingface` / `webllm`)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl liquid-glass-btn-secondary text-xs font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
