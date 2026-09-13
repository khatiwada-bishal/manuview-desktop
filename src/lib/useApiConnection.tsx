"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ProviderConfig, AvailableModel, LLMProvider } from "./types";
import { testLLMConnection, fetchAvailableModels } from "./llm";

export type ApiStatus = "checking" | "connected" | "unconfigured" | "error";

export interface ApiConnectionState {
  status: ApiStatus;
  isConnected: boolean;
  isLoading: boolean;
  modelName: string | null;
  rawModelId: string | null;
  latencyMs: number | null;
  provider: LLMProvider | null;
  providerName: string;
  availableModels: AvailableModel[];
  errorMessage?: string;
  refresh: () => Promise<void>;
  selectModel: (modelId: string) => void;
}

const defaultState: ApiConnectionState = {
  status: "checking",
  isConnected: false,
  isLoading: true,
  modelName: null,
  rawModelId: null,
  latencyMs: null,
  provider: null,
  providerName: "AI ENGINE",
  availableModels: [],
  errorMessage: undefined,
  refresh: async () => {},
  selectModel: () => {},
};

const ApiConnectionContext = createContext<ApiConnectionState>(defaultState);

export function ApiConnectionProvider({ children }: { children: React.ReactNode }) {
  const [connectionData, setConnectionData] = useState<Omit<ApiConnectionState, "refresh" | "selectModel">>({
    status: "checking",
    isConnected: false,
    isLoading: true,
    modelName: null,
    rawModelId: null,
    latencyMs: null,
    provider: null,
    providerName: "AI ENGINE",
    availableModels: [],
    errorMessage: undefined,
  });

  const checkConnection = useCallback(async () => {
    setConnectionData((prev) => ({
      ...prev,
      isLoading: true,
      status: "checking",
    }));

    try {
      let config: ProviderConfig | undefined;
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("manuview_provider_config");
        if (saved) {
          try {
            config = JSON.parse(saved);
          } catch {}
        }
      }

      // Fetch test connection and available models in parallel
      const [data, models] = await Promise.all([
        testLLMConnection(config),
        fetchAvailableModels(config).catch(() => [] as AvailableModel[]),
      ]);

      const resolvedModels = models && models.length > 0 ? models : data?.availableModels || [];
      const currentProvider = (data?.provider || config?.provider || "gemini") as LLMProvider;
      const providerLabel =
        currentProvider === "ollama"
          ? "Local Ollama"
          : currentProvider.toUpperCase();

      if (data && data.success) {
        const rawModel = data.model || config?.model || "AI Model";
        const cleanModel = rawModel.toUpperCase().replace(/-/g, " ");

        setConnectionData({
          status: "connected",
          isConnected: true,
          isLoading: false,
          modelName: cleanModel,
          rawModelId: data.model || config?.model || rawModel,
          latencyMs: data.latencyMs || 120,
          provider: currentProvider,
          providerName: providerLabel,
          availableModels: resolvedModels,
          errorMessage: undefined,
        });
      } else {
        const errMsg = data?.error || data?.message || "Not connected";
        const isUnconfigured =
          errMsg.toLowerCase().includes("no api key") ||
          errMsg.toLowerCase().includes("please provide a valid") ||
          errMsg.toLowerCase().includes("requires api key");

        setConnectionData({
          status: isUnconfigured ? "unconfigured" : "error",
          isConnected: false,
          isLoading: false,
          modelName: null,
          rawModelId: null,
          latencyMs: null,
          provider: currentProvider,
          providerName: providerLabel,
          availableModels: resolvedModels,
          errorMessage: errMsg,
        });
      }
    } catch (err: any) {
      setConnectionData({
        status: "error",
        isConnected: false,
        isLoading: false,
        modelName: null,
        rawModelId: null,
        latencyMs: null,
        provider: null,
        providerName: "AI ENGINE",
        availableModels: [],
        errorMessage: err?.message || "Connection test failed",
      });
    }
  }, []);

  const selectModel = useCallback(
    (modelId: string) => {
      let current: ProviderConfig = { provider: "gemini", model: modelId };
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("manuview_provider_config");
        if (saved) {
          try {
            current = JSON.parse(saved);
          } catch {}
        }
        current.model = modelId;
        localStorage.setItem("manuview_provider_config", JSON.stringify(current));
        window.dispatchEvent(new Event("manuview_config_changed"));
      }
    },
    []
  );

  useEffect(() => {
    checkConnection();

    const handleConfigChange = () => {
      checkConnection();
    };

    window.addEventListener("manuview_config_changed", handleConfigChange);
    window.addEventListener("storage", handleConfigChange);

    return () => {
      window.removeEventListener("manuview_config_changed", handleConfigChange);
      window.removeEventListener("storage", handleConfigChange);
    };
  }, [checkConnection]);

  const value: ApiConnectionState = {
    ...connectionData,
    refresh: checkConnection,
    selectModel,
  };

  return (
    <ApiConnectionContext.Provider value={value}>
      {children}
    </ApiConnectionContext.Provider>
  );
}

export function useApiConnection(): ApiConnectionState {
  const context = useContext(ApiConnectionContext);
  return context;
}
