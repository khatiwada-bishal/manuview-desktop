"use client";

import React, { useState, useEffect, useRef } from "react";
import { ProviderConfig, LLMProvider, AvailableModel } from "@/lib/types";
import {
  fetchAvailableModels,
  testLLMConnection,
} from "@/lib/llm";
import { Settings, ShieldCheck, X, CheckCircle2, Activity, RefreshCw, AlertCircle, Zap, Check, ChevronDown, Sparkles, Search } from "lucide-react";
import { GeminiLogo, OpenAILogo, GroqLogo, AnthropicLogo, OllamaLogo } from "./BrandLogos";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: ProviderConfig) => void;
}

export const DEFAULT_CONFIG: ProviderConfig = {
  provider: "gemini",
  model: "gemini-2.5-flash",
  baseUrl: "http://localhost:11434",
  apiKey: "",
};

export function ProviderSettingsModal({ isOpen, onClose, onSave }: Props) {
  const [config, setConfig] = useState<ProviderConfig>(DEFAULT_CONFIG);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [hasFetchedLive, setHasFetchedLive] = useState(false);
  const [fetchFeedback, setFetchFeedback] = useState<{
    type: "success" | "error";
    message: string;
    count?: number;
  } | null>(null);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    provider: string;
    model: string;
    latencyMs: number;
    message: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    // Check browser local storage
    const saved = localStorage.getItem("manuview_provider_config");
    let currentConfig = DEFAULT_CONFIG;
    if (saved) {
      try {
        currentConfig = JSON.parse(saved);
        setConfig(currentConfig);
      } catch {}
    }

    setTestResult(null);
    setFetchFeedback(null);
    setHasFetchedLive(false);

    // Fetch models for current provider
    loadModelsForProvider(currentConfig);
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadModelsForProvider = async (targetConfig: ProviderConfig) => {
    setLoadingModels(true);
    try {
      const models = await fetchAvailableModels(targetConfig);
      if (Array.isArray(models) && models.length > 0) {
        setAvailableModels(models);
        if (models.some((m) => m.isLive)) {
          setHasFetchedLive(true);
        }
        // If current model is not set or empty, pick the recommended or first
        if (!targetConfig.model) {
          const rec = models.find((m: AvailableModel) => m.recommended) || models[0];
          setConfig((prev) => ({ ...prev, model: rec.id }));
        }
      }
    } catch (err) {
      console.error("Failed to load models for provider:", err);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleFetchModels = async () => {
    if (!config.apiKey?.trim() && config.provider !== "ollama") {
      setFetchFeedback({
        type: "error",
        message: `Please enter your ${config.provider.toUpperCase()} API key first.`,
      });
      return;
    }

    setFetchingModels(true);
    setFetchFeedback(null);
    try {
      const models = await fetchAvailableModels(config, { throwOnError: true });
      if (Array.isArray(models) && models.length > 0) {
        setAvailableModels(models);
        setHasFetchedLive(true);
        setFetchFeedback({
          type: "success",
          message: `Successfully retrieved ${models.length} authorized models from ${config.provider.toUpperCase()}! Select a model below.`,
          count: models.length,
        });

        // If current model is not in the live list, pick the recommended or first
        const exists = models.some((m) => m.id === config.model);
        if (!exists) {
          const rec = models.find((m: AvailableModel) => m.recommended) || models[0];
          setConfig((prev) => ({ ...prev, model: rec.id }));
        }

        // Open the dropdown so the user can easily review the fetched models
        setModelDropdownOpen(true);
      } else {
        setFetchFeedback({
          type: "error",
          message: `No models returned from ${config.provider.toUpperCase()}.`,
        });
      }
    } catch (err: any) {
      setFetchFeedback({
        type: "error",
        message: err.message || `Failed to fetch models from ${config.provider.toUpperCase()}. Please check your API key.`,
      });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleProviderChange = (newProvider: LLMProvider) => {
    const defaultModel =
      newProvider === "gemini"
        ? "gemini-2.5-flash"
        : newProvider === "openai"
        ? "gpt-4o"
        : newProvider === "anthropic"
        ? "claude-3-7-sonnet-20250219"
        : newProvider === "groq"
        ? "llama-3.3-70b-versatile"
        : "llama3.3";

    const updated = {
      ...config,
      provider: newProvider,
      model: defaultModel,
    };
    setConfig(updated);
    setTestResult(null);
    setFetchFeedback(null);
    setHasFetchedLive(false);
    loadModelsForProvider(updated);
  };

  const handleCheckConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testLLMConnection(config);
      setTestResult(result);
      if (Array.isArray(result.availableModels) && result.availableModels.length > 0) {
        setAvailableModels(result.availableModels);
        if (result.availableModels.some((m: AvailableModel) => m.isLive)) {
          setHasFetchedLive(true);
        }
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        provider: config.provider,
        model: config.model,
        latencyMs: 0,
        message: "Connection failed",
        error: err.message || "Failed to reach diagnostic test server",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem("manuview_provider_config", JSON.stringify(config));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("manuview_config_changed"));
    }
    if (onSave) onSave(config);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl liquid-glass-modal p-6 sm:p-7 text-[#2F3437] dark:text-neutral-200 my-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white hover:bg-[#F7F7F5] dark:hover:bg-[#1E293B] rounded-md transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="text-2xl select-none">⚙️</div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[#2F3437] dark:text-white">
              AI Diagnostic Engine &amp; Models
            </h3>
            <p className="text-xs text-[#787774] dark:text-neutral-400 mt-0.5">
              Select your LLM provider, verify the connection, and pick verified diagnostic models.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* 1. Provider Selection Grid (Compact buttons with Logo & Main Name) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#787774] dark:text-neutral-400 mb-2">
              1. Select AI Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* Google */}
              <button
                type="button"
                onClick={() => handleProviderChange("gemini")}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  config.provider === "gemini"
                    ? "bg-[#F7F7F5] dark:bg-[#1E293B] border-[#2F3437] dark:border-blue-500 ring-1 ring-[#2F3437] dark:ring-blue-500 text-[#2F3437] dark:text-white shadow-2xs"
                    : "bg-white dark:bg-[#161F30] border-[#EBEBEA] dark:border-[#334155] hover:bg-[#F7F7F5] dark:hover:bg-[#1E293B] text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white"
                }`}
              >
                <GeminiLogo className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Google</span>
              </button>

              {/* OpenAI */}
              <button
                type="button"
                onClick={() => handleProviderChange("openai")}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  config.provider === "openai"
                    ? "bg-[#F7F7F5] dark:bg-[#1E293B] border-[#2F3437] dark:border-blue-500 ring-1 ring-[#2F3437] dark:ring-blue-500 text-[#2F3437] dark:text-white shadow-2xs"
                    : "bg-white dark:bg-[#161F30] border-[#EBEBEA] dark:border-[#334155] hover:bg-[#F7F7F5] dark:hover:bg-[#1E293B] text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white"
                }`}
              >
                <div className="p-0.5 rounded bg-[#000000] text-white flex items-center justify-center flex-shrink-0">
                  <OpenAILogo className="w-2.5 h-2.5 text-white" />
                </div>
                <span>OpenAI</span>
              </button>

              {/* Anthropic */}
              <button
                type="button"
                onClick={() => handleProviderChange("anthropic")}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  config.provider === "anthropic"
                    ? "bg-[#F7F7F5] dark:bg-[#1E293B] border-[#2F3437] dark:border-blue-500 ring-1 ring-[#2F3437] dark:ring-blue-500 text-[#2F3437] dark:text-white shadow-2xs"
                    : "bg-white dark:bg-[#161F30] border-[#EBEBEA] dark:border-[#334155] hover:bg-[#F7F7F5] dark:hover:bg-[#1E293B] text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white"
                }`}
              >
                <AnthropicLogo className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Anthropic</span>
              </button>

              {/* Groq */}
              <button
                type="button"
                onClick={() => handleProviderChange("groq")}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  config.provider === "groq"
                    ? "bg-[#F7F7F5] dark:bg-[#1E293B] border-[#2F3437] dark:border-blue-500 ring-1 ring-[#2F3437] dark:ring-blue-500 text-[#2F3437] dark:text-white shadow-2xs"
                    : "bg-white dark:bg-[#161F30] border-[#EBEBEA] dark:border-[#334155] hover:bg-[#F7F7F5] dark:hover:bg-[#1E293B] text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white"
                }`}
              >
                <GroqLogo className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Groq</span>
              </button>

              {/* Ollama */}
              <button
                type="button"
                onClick={() => handleProviderChange("ollama")}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  config.provider === "ollama"
                    ? "bg-[#F7F7F5] dark:bg-[#1E293B] border-[#2F3437] dark:border-blue-500 ring-1 ring-[#2F3437] dark:ring-blue-500 text-[#2F3437] dark:text-white shadow-2xs"
                    : "bg-white dark:bg-[#161F30] border-[#EBEBEA] dark:border-[#334155] hover:bg-[#F7F7F5] dark:hover:bg-[#1E293B] text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white"
                }`}
              >
                <OllamaLogo className="w-3.5 h-3.5 text-[#1E5A2A] dark:text-emerald-400 flex-shrink-0" />
                <span>Ollama</span>
              </button>
            </div>
          </div>

          {/* 2. API Key / Endpoint Configuration with in-line Fetch Models Button */}
          {config.provider !== "ollama" ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#2F3437] dark:text-white">
                  2. {config.provider === "openai" ? "API Key" : `${config.provider === "gemini" ? "Google" : config.provider.toUpperCase()} API Key`}
                </label>
                {config.provider === "gemini" && (
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#0A85EA] dark:text-blue-400 hover:underline font-medium"
                  >
                    Get free Google key &rarr;
                  </a>
                )}
                {config.provider === "groq" && (
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#78510E] dark:text-amber-400 hover:underline font-medium"
                  >
                    Get free Groq key &rarr;
                  </a>
                )}
                {config.provider === "anthropic" && (
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#78510E] dark:text-amber-400 hover:underline font-medium"
                  >
                    Get Anthropic key &rarr;
                  </a>
                )}
              </div>

              {/* API Key Input and Fetch Models Button in the SAME LINE */}
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={config.apiKey || ""}
                  onChange={(e) => {
                    setConfig({ ...config, apiKey: e.target.value });
                    setFetchFeedback(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleFetchModels();
                    }
                  }}
                  placeholder={
                    config.provider === "gemini"
                      ? "AIzaSy..."
                      : config.provider === "anthropic"
                      ? "sk-ant-..."
                      : "sk-..."
                  }
                  className="flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EBEBEA] dark:border-[#334155] focus:border-[#2F3437] dark:focus:border-blue-500 focus:outline-none text-xs text-[#2F3437] dark:text-white font-mono transition shadow-2xs placeholder:text-[#9B9A97] dark:placeholder:text-neutral-500"
                />

                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={fetchingModels || !config.apiKey?.trim()}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2F3437] dark:bg-blue-600 text-white hover:bg-black dark:hover:bg-blue-500 disabled:bg-[#F7F7F5] dark:disabled:bg-[#1E293B] disabled:text-[#9B9A97] dark:disabled:text-neutral-600 disabled:border-[#EBEBEA] dark:disabled:border-[#334155] border border-[#2F3437] dark:border-blue-600 transition shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
                  title="Fetch verified models authorized for this API key"
                >
                  {fetchingModels ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Fetch Models</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-[#787774] dark:text-neutral-400">Client keys are stored locally on your machine.</span>
                {hasFetchedLive && (
                  <span className="text-[#1E5A2A] dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#1E5A2A] dark:text-emerald-400" />
                    {availableModels.length} models loaded
                  </span>
                )}
              </div>

              {config.provider === "openai" && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-[#2F3437] dark:text-white mb-1">
                    API Base URL (Optional for Proxies / Custom Endpoints)
                  </label>
                  <input
                    type="text"
                    value={config.baseUrl || ""}
                    onChange={(e) => {
                      setConfig({ ...config, baseUrl: e.target.value });
                      setFetchFeedback(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleFetchModels();
                      }
                    }}
                    placeholder="https://api.openai.com/v1 (or your custom proxy URL)"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EBEBEA] dark:border-[#334155] focus:border-[#2F3437] dark:focus:border-blue-500 focus:outline-none text-xs text-[#2F3437] dark:text-white font-mono transition shadow-2xs placeholder:text-[#9B9A97] dark:placeholder:text-neutral-500"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#2F3437] dark:text-white mb-1.5">
                2. Local Ollama Server URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={config.baseUrl || "http://localhost:11434"}
                  onChange={(e) => {
                    setConfig({ ...config, baseUrl: e.target.value });
                    setFetchFeedback(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleFetchModels();
                    }
                  }}
                  className="flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EBEBEA] dark:border-[#334155] focus:border-[#2F3437] dark:focus:border-blue-500 focus:outline-none text-xs text-[#2F3437] dark:text-white font-mono transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={fetchingModels}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2F3437] dark:bg-blue-600 text-white hover:bg-black dark:hover:bg-blue-500 disabled:bg-[#F7F7F5] dark:disabled:bg-[#1E293B] disabled:text-[#9B9A97] dark:disabled:text-neutral-600 disabled:border-[#EBEBEA] dark:disabled:border-[#334155] border border-[#2F3437] dark:border-blue-600 transition shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
                  title="Fetch local models installed in Ollama"
                >
                  {fetchingModels ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Fetch Models</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-[#787774] dark:text-neutral-400">
                  Ensure <code className="text-[#1E5A2A] dark:text-emerald-400 font-semibold">ollama serve</code> is running.
                </span>
                {hasFetchedLive && (
                  <span className="text-[#1E5A2A] dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#1E5A2A] dark:text-emerald-400" />
                    {availableModels.length} local models
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Fetch Status / Error Feedback Banner */}
          {fetchFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                fetchFeedback.type === "success"
                  ? "bg-[#EDF6EE] dark:bg-emerald-950/40 border-[#CBE7CE] dark:border-emerald-800 text-[#1E5A2A] dark:text-emerald-300"
                  : "bg-[#FDF0EF] dark:bg-rose-950/40 border-[#F7CECC] dark:border-rose-800 text-[#7C2D2B] dark:text-rose-300"
              }`}
            >
              {fetchFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-[#1E5A2A] dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#7C2D2B] dark:text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium leading-relaxed">
                {fetchFeedback.message}
              </div>
              <button
                type="button"
                onClick={() => setFetchFeedback(null)}
                className="text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 3. Available Models Picker (Dropdown Selector) */}
          <div ref={dropdownRef} className="relative z-20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-[#2F3437] dark:text-white">
                  3. Select Model
                </label>
                {hasFetchedLive ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EDF6EE] dark:bg-emerald-950/40 border border-[#CBE7CE] dark:border-emerald-800 text-[#1E5A2A] dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3 text-[#1E5A2A] dark:text-emerald-400" />
                    {availableModels.length} Live Models
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F7F7F5] dark:bg-[#1E293B] border border-[#EBEBEA] dark:border-[#334155] text-[#787774] dark:text-neutral-400 font-medium">
                    {availableModels.length} available
                  </span>
                )}
                {fetchingModels && (
                  <RefreshCw className="w-3 h-3 text-[#787774] dark:text-neutral-400 animate-spin ml-1" />
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(!showCustomInput);
                  setModelDropdownOpen(false);
                }}
                className="text-[11px] text-[#0A85EA] dark:text-blue-400 hover:underline font-medium cursor-pointer"
              >
                {showCustomInput ? "Show Model List" : "Manual Model ID"}
              </button>
            </div>

            {/* If user toggles custom input */}
            {showCustomInput ? (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  placeholder="e.g. gemini-2.5-flash or custom-model-id"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EBEBEA] dark:border-[#334155] focus:border-[#2F3437] dark:focus:border-blue-500 focus:outline-none text-xs text-[#2F3437] dark:text-white font-mono transition shadow-2xs"
                />
                <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                  Enter any model ID supported by your endpoint.
                </p>
              </div>
            ) : (
              /* Dropdown Trigger & Populated Models Menu */
              <div className="relative">
                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="w-full text-left p-3 rounded-xl bg-white dark:bg-[#161F30] hover:bg-[#F7F7F5] dark:hover:bg-[#1E293B] border border-[#EBEBEA] dark:border-[#334155] hover:border-[#D0D0CE] dark:hover:border-[#475569] transition flex items-center justify-between gap-2 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0075eb]/20"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#2F3437] dark:text-white">
                        {config.model || "Select a model..."}
                      </span>
                      {(() => {
                        const cur = availableModels.find((m) => m.id === config.model);
                        if (cur?.tag) {
                          return (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.2 rounded-md border ${
                                cur.recommended
                                  ? "bg-[#EBF3FB] dark:bg-blue-950/40 text-[#18569C] dark:text-blue-300 border-[#CDE1F8] dark:border-blue-800"
                                  : cur.tag.includes("Fast") || cur.tag.includes("Instant")
                                  ? "bg-[#EDF6EE] dark:bg-emerald-950/40 text-[#1E5A2A] dark:text-emerald-300 border-[#CBE7CE] dark:border-emerald-800"
                                  : cur.tag.includes("Reasoning") || cur.tag.includes("Frontier")
                                  ? "bg-[#F6F3F9] dark:bg-purple-950/40 text-[#57338C] dark:text-purple-300 border-[#DFD5F5] dark:border-purple-800"
                                  : "bg-[#FBF3DB] dark:bg-amber-950/40 text-[#78510E] dark:text-amber-300 border-[#F4E2B6] dark:border-amber-800"
                              }`}
                            >
                              {cur.tag}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <p className="text-[11px] text-[#787774] dark:text-neutral-400 truncate mt-0.5">
                      {availableModels.find((m) => m.id === config.model)?.description ||
                        "Click to view and choose from available models"}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#787774] dark:text-neutral-400 flex-shrink-0 transition-transform ${
                      modelDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Populated Dropdown Menu */}
                {modelDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-full rounded-2xl bg-white dark:bg-[#111827] border border-[#EBEBEA] dark:border-[#1F2937] shadow-2xl p-2 z-50 text-xs animate-fadeIn">
                    {/* Search inside dropdown */}
                    <div className="relative mb-2 px-1">
                      <input
                        type="text"
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                        placeholder={`Search ${availableModels.length} models...`}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#F7F7F5] dark:bg-[#1E293B] border border-[#EBEBEA] dark:border-[#334155] text-xs text-[#2F3437] dark:text-white placeholder-[#9B9A97] dark:placeholder:text-neutral-500 focus:outline-none focus:bg-white dark:focus:bg-[#161F30] focus:ring-1 focus:ring-[#0075eb]"
                        autoFocus
                      />
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#9B9A97] dark:text-neutral-500 pointer-events-none" />
                    </div>

                    {/* Header banner inside dropdown */}
                    {hasFetchedLive ? (
                      <div className="px-2.5 py-1.5 mb-1.5 border-b border-[#EBEBEA] dark:border-[#1F2937] flex items-center justify-between text-[11px] text-[#1E5A2A] dark:text-emerald-400 bg-[#EDF6EE]/70 dark:bg-emerald-950/40 rounded-lg">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Sparkles className="w-3 h-3 text-[#1E5A2A] dark:text-emerald-400" />
                          Verified live models from {config.provider.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-[#1E5A2A] dark:text-emerald-400">{availableModels.length} total</span>
                      </div>
                    ) : (
                      <div className="px-2.5 py-1.5 mb-1.5 border-b border-[#EBEBEA] dark:border-[#1F2937] flex items-center justify-between text-[11px] text-[#78510E] dark:text-amber-400 bg-[#FBF3DB]/70 dark:bg-amber-950/40 rounded-lg">
                        <span>Curated preset models</span>
                        <span className="text-[10px] text-[#787774] dark:text-neutral-400">Click "Fetch Models" above to load live</span>
                      </div>
                    )}

                    {/* Populated Models List */}
                    <div className="max-h-60 overflow-y-auto divide-y divide-[#F7F7F5] dark:divide-[#1F2937] overscroll-contain">
                      {(() => {
                        const filtered = availableModels.filter(
                          (m) =>
                            m.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                            (m.tag && m.tag.toLowerCase().includes(modelSearchQuery.toLowerCase())) ||
                            (m.description && m.description.toLowerCase().includes(modelSearchQuery.toLowerCase()))
                        );

                        if (filtered.length === 0) {
                          return (
                            <div className="p-4 text-center text-xs text-[#787774] dark:text-neutral-400">
                              No models matching "{modelSearchQuery}"
                            </div>
                          );
                        }

                        return filtered.map((m) => {
                          const isSelected = config.model === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setConfig({ ...config, model: m.id });
                                setModelDropdownOpen(false);
                                setModelSearchQuery("");
                              }}
                              className={`w-full text-left p-2.5 rounded-xl transition flex items-start justify-between gap-2.5 ${
                                isSelected
                                  ? "bg-[#F7F7F5] dark:bg-[#1E293B] text-[#2F3437] dark:text-white font-semibold"
                                  : "text-[#2F3437] dark:text-neutral-300 hover:bg-[#FAF9F7] dark:hover:bg-[#161F30]"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-mono text-xs font-semibold text-[#2F3437] dark:text-white">
                                    {m.id}
                                  </span>
                                  {m.isLive && (
                                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-md border bg-[#EDF6EE] dark:bg-emerald-950/50 text-[#1E5A2A] dark:text-emerald-400 border-[#CBE7CE] dark:border-emerald-800">
                                      Live
                                    </span>
                                  )}
                                  {m.tag && (
                                    <span
                                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md border ${
                                        m.recommended
                                          ? "bg-[#EBF3FB] dark:bg-blue-950/50 text-[#18569C] dark:text-blue-300 border-[#CDE1F8] dark:border-blue-800"
                                          : m.tag.includes("Fast") || m.tag.includes("Instant")
                                          ? "bg-[#EDF6EE] dark:bg-emerald-950/50 text-[#1E5A2A] dark:text-emerald-300 border-[#CBE7CE] dark:border-emerald-800"
                                          : m.tag.includes("Reasoning") || m.tag.includes("Frontier")
                                          ? "bg-[#F6F3F9] dark:bg-purple-950/50 text-[#57338C] dark:text-purple-300 border-[#DFD5F5] dark:border-purple-800"
                                          : "bg-[#FBF3DB] dark:bg-amber-950/50 text-[#78510E] dark:text-amber-300 border-[#F4E2B6] dark:border-amber-800"
                                      }`}
                                    >
                                      {m.tag}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#787774] dark:text-neutral-400 truncate mt-0.5">
                                  {m.description || m.name}
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-[#0A85EA] dark:text-blue-400 flex-shrink-0 mt-1" />
                              )}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Connection Test Feedback Box (Notion Pastel & High Contrast) */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs animate-fade-in ${
                testResult.success
                  ? "bg-[#EDF6EE] dark:bg-emerald-950/40 border-[#CBE7CE] dark:border-emerald-800 text-[#1E5A2A] dark:text-emerald-300"
                  : "bg-[#FDF0EF] dark:bg-rose-950/40 border-[#F7CECC] dark:border-rose-800 text-[#7C2D2B] dark:text-rose-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-[#1E5A2A] dark:text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#9B2C2C] dark:text-rose-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-bold block sm:inline">
                      {testResult.success ? "Connection Operational" : "Connection Test Failed"}
                    </span>
                    <span className="text-[11px] opacity-90 block sm:inline sm:ml-2 truncate">
                      {testResult.message}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 rounded-md border font-bold flex items-center gap-1 bg-white dark:bg-[#161F30] ${
                      testResult.success
                        ? "text-[#1E5A2A] dark:text-emerald-400 border-[#CBE7CE] dark:border-emerald-800"
                        : "text-[#7C2D2B] dark:text-rose-400 border-[#F7CECC] dark:border-rose-800"
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    {testResult.latencyMs} ms
                  </span>
                </div>
              </div>

              {!testResult.success && testResult.error && (
                <div className="mt-2.5 pt-2 border-t border-[#F7CECC] dark:border-rose-800/80 text-[11px] font-mono leading-relaxed break-words text-[#7C2D2B] dark:text-rose-300">
                  {testResult.error}
                </div>
              )}
            </div>
          )}

          {/* Privacy Footnote */}
          <div className="p-3 rounded-xl liquid-glass-card flex items-center gap-2 text-[11px] text-[#787774] dark:text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Zero data retention &bull; Processed strictly in memory &bull; Never trained on.</span>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
            {/* Check Connection Button */}
            <button
              type="button"
              onClick={handleCheckConnection}
              disabled={testing}
              className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl liquid-glass-btn-secondary disabled:opacity-50 text-[#2F3437] dark:text-neutral-300 font-medium text-xs transition"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0A85EA] dark:text-blue-400" />
                  <span>Pinging API &amp; Fetching Models...</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 text-[#0A85EA] dark:text-blue-400" />
                  <span>Check Connection &amp; Refresh Models</span>
                </>
              )}
            </button>

            {/* Save & Cancel */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl liquid-glass-btn-primary font-medium text-xs transition cursor-pointer"
              >
                {savedSuccess ? "Saved!" : "Save & Activate"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
