/**
 * Laya Decision Model Service
 *
 * Manages client-side execution of Laya (ModernBERT-large, 421M parameters)
 * in-browser via Transformers.js (@huggingface/transformers).
 *
 * Executes zero-shot classification pipelines locally using WebGPU with WASM fallback.
 * Operates 100% offline with zero external API calls after initial model download.
 */

import { pipeline, env } from "@huggingface/transformers";

// Configure Transformers.js for in-browser client execution
if (typeof window !== "undefined") {
  env.allowLocalModels = false;
  env.useBrowserCache = true;
}

export interface LayaModelInfo {
  id: string;
  name: string;
  sizeMB: number;
  architecture: string;
  parameters: string;
  description: string;
}

export const LAYA_MODEL: LayaModelInfo = {
  id: "convaiinnovations/laya",
  name: "Laya Decision Model",
  sizeMB: 450,
  architecture: "ModernBERT-large",
  parameters: "421M",
  description: "On-device non-autoregressive decision model for structured manuscript screening, rigor rubric grading, and journal alignment. Zero external API calls.",
};

export type LayaModelState =
  | "not_downloaded"
  | "downloading"
  | "ready"
  | "running"
  | "error";

export interface LayaProgress {
  state: LayaModelState;
  progress: number; // 0 to 1
  statusText: string;
  error?: string;
  device?: "webgpu" | "wasm";
}

let activePipeline: any = null;
let activeDevice: "webgpu" | "wasm" = "webgpu";
let isInitializing = false;

let currentProgress: LayaProgress = {
  state: "not_downloaded",
  progress: 0,
  statusText: "Not downloaded",
};

type ProgressListener = (progress: LayaProgress) => void;
const listeners = new Set<ProgressListener>();

function notifyListeners(update: Partial<LayaProgress>) {
  currentProgress = { ...currentProgress, ...update };
  listeners.forEach((fn) => {
    try {
      fn(currentProgress);
    } catch (e) {
      console.error("Error in Laya progress listener:", e);
    }
  });
}

export function subscribeToLayaStatus(fn: ProgressListener): () => void {
  listeners.add(fn);
  fn(currentProgress);
  return () => {
    listeners.delete(fn);
  };
}

export function getLayaStatus(): LayaProgress {
  return currentProgress;
}

/**
 * Checks if the Laya model weights are already cached in browser CacheStorage.
 */
export async function isLayaCached(): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return false;
  }
  try {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      if (name.includes("transformers") || name.includes("huggingface")) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        const hasLaya = requests.some((req) =>
          req.url.includes("convaiinnovations") || req.url.includes("laya")
        );
        if (hasLaya) return true;
      }
    }
    const flag = localStorage.getItem("manuview_laya_cached");
    return flag === "true";
  } catch (err) {
    console.warn("Failed to inspect CacheStorage for Laya:", err);
    return false;
  }
}

/**
 * Deletes cached Laya model files from CacheStorage.
 */
export async function deleteLayaCache(): Promise<void> {
  unloadLayaModel();
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        if (name.includes("transformers") || name.includes("huggingface")) {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          for (const req of requests) {
            if (req.url.includes("convaiinnovations") || req.url.includes("laya")) {
              await cache.delete(req);
            }
          }
        }
      }
      localStorage.removeItem("manuview_laya_cached");
      notifyListeners({
        state: "not_downloaded",
        progress: 0,
        statusText: "Cache cleared",
      });
    } catch (err) {
      console.error("Failed to delete Laya cache:", err);
    }
  }
}

/**
 * Detects if WebGPU is available in the current environment.
 */
export async function checkLayaWebGPUSupport(): Promise<boolean> {
  if (typeof navigator === "undefined" || !(navigator as any).gpu) {
    return false;
  }
  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    return Boolean(adapter);
  } catch {
    return false;
  }
}

/**
 * Loads Laya into memory via Transformers.js zero-shot-classification pipeline.
 */
export async function initLayaModel(forceDevice?: "webgpu" | "wasm"): Promise<any> {
  if (activePipeline) {
    notifyListeners({
      state: "ready",
      progress: 1,
      statusText: `Ready (${activeDevice.toUpperCase()})`,
      device: activeDevice,
    });
    return activePipeline;
  }

  if (isInitializing) {
    // Wait for in-flight initialization
    return new Promise((resolve, reject) => {
      const unsub = subscribeToLayaStatus((status) => {
        if (status.state === "ready") {
          unsub();
          resolve(activePipeline);
        } else if (status.state === "error") {
          unsub();
          reject(new Error(status.error || "Initialization failed"));
        }
      });
    });
  }

  isInitializing = true;
  notifyListeners({
    state: "downloading",
    progress: 0,
    statusText: "Initializing Laya...",
  });

  const preferredDevice = forceDevice || ((await checkLayaWebGPUSupport()) ? "webgpu" : "wasm");

  const progressCallback = (info: any) => {
    if (!info) return;
    if (info.status === "progress" && typeof info.progress === "number") {
      const normalized = Math.min(1, Math.max(0, info.progress / 100));
      notifyListeners({
        state: "downloading",
        progress: normalized,
        statusText: `Loading ${info.file || "weights"} (${Math.round(info.progress)}%)...`,
      });
    } else if (info.status === "done") {
      notifyListeners({
        state: "downloading",
        progress: 0.95,
        statusText: "Compiling ONNX pipeline...",
      });
    } else if (info.status === "ready") {
      notifyListeners({
        state: "ready",
        progress: 1,
        statusText: "Ready",
      });
    }
  };

  try {
    activeDevice = preferredDevice;
    activePipeline = await pipeline("zero-shot-classification", LAYA_MODEL.id, {
      device: activeDevice,
      progress_callback: progressCallback,
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("manuview_laya_cached", "true");
    }

    notifyListeners({
      state: "ready",
      progress: 1,
      statusText: `Ready (${activeDevice.toUpperCase()})`,
      device: activeDevice,
    });

    return activePipeline;
  } catch (gpuError: any) {
    if (activeDevice === "webgpu") {
      console.warn("WebGPU initialization failed for Laya, attempting WASM fallback:", gpuError);
      try {
        activeDevice = "wasm";
        notifyListeners({
          state: "downloading",
          progress: 0.5,
          statusText: "Falling back to WASM engine...",
        });

        activePipeline = await pipeline("zero-shot-classification", LAYA_MODEL.id, {
          device: "wasm",
          progress_callback: progressCallback,
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("manuview_laya_cached", "true");
        }

        notifyListeners({
          state: "ready",
          progress: 1,
          statusText: "Ready (WASM Fallback)",
          device: "wasm",
        });

        return activePipeline;
      } catch (wasmError: any) {
        const errorMsg = wasmError?.message || String(wasmError);
        notifyListeners({
          state: "error",
          progress: 0,
          statusText: "Failed to initialize Laya",
          error: errorMsg,
        });
        throw wasmError;
      }
    } else {
      const errorMsg = gpuError?.message || String(gpuError);
      notifyListeners({
        state: "error",
        progress: 0,
        statusText: "Failed to initialize Laya",
        error: errorMsg,
      });
      throw gpuError;
    }
  } finally {
    isInitializing = false;
  }
}

/**
 * Releases the active pipeline from memory.
 */
export function unloadLayaModel(): void {
  activePipeline = null;
  notifyListeners({
    state: "not_downloaded",
    progress: 0,
    statusText: "Not loaded",
  });
}

export interface ClassificationOptions {
  hypothesisTemplate?: string;
  multiLabel?: boolean;
}

export interface ClassificationResult {
  labels: string[];
  scores: number[];
}

/**
 * Executes a single zero-shot classification pass with Laya.
 */
export async function runLayaClassification(
  text: string,
  labels: string[],
  options?: ClassificationOptions
): Promise<ClassificationResult> {
  const classifier = await initLayaModel();
  notifyListeners({ state: "running", statusText: "Evaluating manuscript signals..." });

  try {
    const rawResult = await classifier(text, labels, {
      hypothesis_template: options?.hypothesisTemplate || "This text {} .",
      multi_label: options?.multiLabel ?? false,
    });

    // Handle single or array response
    const res = Array.isArray(rawResult) ? rawResult[0] : rawResult;
    return {
      labels: res.labels || [],
      scores: res.scores || [],
    };
  } finally {
    notifyListeners({ state: "ready", statusText: `Ready (${activeDevice.toUpperCase()})` });
  }
}
