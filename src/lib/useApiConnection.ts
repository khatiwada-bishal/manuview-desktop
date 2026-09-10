"use client";

import { useState, useEffect, useCallback } from "react";
import { ProviderConfig } from "./types";
import { testLLMConnection } from "./llm";

export interface ApiConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  modelName: string | null;
  latencyMs: number | null;
  provider: string | null;
  errorMessage?: string;
}

export function useApiConnection() {
  const [state, setState] = useState<ApiConnectionState>({
    isConnected: false,
    isLoading: true,
    modelName: null,
    latencyMs: null,
    provider: null,
  });

  const checkConnection = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
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

      const data = await testLLMConnection(config);
      if (data && data.success) {
        const rawModel = data.model || "AI Model";
        const cleanModel = rawModel.toUpperCase().replace(/-/g, " ");
        setState({
          isConnected: true,
          isLoading: false,
          modelName: cleanModel,
          latencyMs: data.latencyMs || 120,
          provider: data.provider || "AI",
        });
      } else {
        setState({
          isConnected: false,
          isLoading: false,
          modelName: null,
          latencyMs: null,
          provider: null,
          errorMessage: data?.message || "Not connected",
        });
      }
    } catch (err: any) {
      setState({
        isConnected: false,
        isLoading: false,
        modelName: null,
        latencyMs: null,
        provider: null,
        errorMessage: err?.message || "Connection failed",
      });
    }
  }, []);

  useEffect(() => {
    checkConnection();

    const handleConfigChange = () => {
      checkConnection();
    };

    window.addEventListener("manuview_config_changed", handleConfigChange);
    return () => {
      window.removeEventListener("manuview_config_changed", handleConfigChange);
    };
  }, [checkConnection]);

  return {
    ...state,
    refresh: checkConnection,
  };
}
