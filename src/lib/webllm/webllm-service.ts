/**
 * WebLLM Service
 * Manages on-device Small Language Model (SLM) execution via WebGPU.
 * Operates in a background Web Worker off the main UI thread.
 */

import {
  CreateWebWorkerMLCEngine,
  CreateMLCEngine,
  hasModelInCache,
  deleteModelAllInfoInCache,
  type MLCEngineInterface,
  type InitProgressReport,
} from "@mlc-ai/web-llm";

export interface LocalModelInfo {
  id: string;
  name: string;
  sizeMB: number;
  vramMB: number;
  description: string;
  isDefault?: boolean;
}

export const SUPPORTED_LOCAL_MODELS: LocalModelInfo[] = [
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 (0.5B Instruct)",
    sizeMB: 380,
    vramMB: 600,
    description: "Lightweight, ultra-fast local SLM. Perfect for structured output, quick summaries, and low-spec machines.",
    isDefault: true,
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
    name: "Llama 3.2 (1B Instruct)",
    sizeMB: 750,
    vramMB: 1200,
    description: "Meta's compact model with strong instruction-following and academic prose capabilities.",
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 (1.5B Instruct)",
    sizeMB: 980,
    vramMB: 1600,
    description: "Highest scientific reasoning quality in the compact class.",
  },
];

export const DEFAULT_LOCAL_MODEL = SUPPORTED_LOCAL_MODELS[0].id;

export type LocalModelState =
  | "unsupported"
  | "not_downloaded"
  | "downloading"
  | "compiling"
  | "ready"
  | "generating"
  | "error";

export interface LocalModelProgress {
  state: LocalModelState;
  modelId: string;
  progress: number; // 0 to 1
  statusText: string;
  error?: string;
}

let activeEngine: MLCEngineInterface | null = null;
let activeWorker: Worker | null = null;
let activeModelId: string | null = null;

let currentProgress: LocalModelProgress = {
  state: "not_downloaded",
  modelId: DEFAULT_LOCAL_MODEL,
  progress: 0,
  statusText: "Idle",
};

type ProgressListener = (progress: LocalModelProgress) => void;
const listeners = new Set<ProgressListener>();

function notifyListeners(update: Partial<LocalModelProgress>) {
  currentProgress = { ...currentProgress, ...update };
  listeners.forEach((fn) => {
    try {
      fn(currentProgress);
    } catch (e) {
      console.error("Error in WebLLM progress listener:", e);
    }
  });
}

export function subscribeToLocalModelStatus(fn: ProgressListener): () => void {
  listeners.add(fn);
  fn(currentProgress);
  return () => {
    listeners.delete(fn);
  };
}

export function getLocalModelStatus(): LocalModelProgress {
  return currentProgress;
}

/**
 * Comprehensive WebGPU capability status
 */
export interface WebGPUCapabilityCheck {
  supported: boolean;
  adapterAvailable: boolean;
  storageBufferLimit?: number;
  meetsBufferRequirement: boolean;
  reason?: string;
}

/**
 * Checks whether WebGPU is available in the current runtime environment.
 */
export function isWebGPUSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return "gpu" in navigator && Boolean((navigator as any).gpu);
}

/**
 * Audits WebGPU hardware and shader stage buffer limits.
 * WebLLM requires at least 10 maxStorageBuffersPerShaderStage.
 * Safari / WebKit clamps this to 9 by default, causing runtime failures.
 */
export async function checkWebGPUCapabilities(): Promise<WebGPUCapabilityCheck> {
  if (!isWebGPUSupported()) {
    return {
      supported: false,
      adapterAvailable: false,
      meetsBufferRequirement: false,
      reason: "WebGPU is not supported by your current browser or platform.",
    };
  }

  try {
    const gpu = (navigator as any).gpu;
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: true,
        adapterAvailable: false,
        meetsBufferRequirement: false,
        reason: "No compatible WebGPU graphics adapter found.",
      };
    }

    const maxStorageBuffers = adapter.limits?.maxStorageBuffersPerShaderStage ?? 0;
    const meetsBufferRequirement = maxStorageBuffers >= 10;

    if (!meetsBufferRequirement) {
      return {
        supported: true,
        adapterAvailable: true,
        storageBufferLimit: maxStorageBuffers,
        meetsBufferRequirement: false,
        reason: `Your browser limits maxStorageBuffersPerShaderStage to ${maxStorageBuffers} (WebLLM requires 10). Please use Google Chrome, Edge, or the native ManuView Desktop app.`,
      };
    }

    return {
      supported: true,
      adapterAvailable: true,
      storageBufferLimit: maxStorageBuffers,
      meetsBufferRequirement: true,
    };
  } catch (err: any) {
    return {
      supported: false,
      adapterAvailable: false,
      meetsBufferRequirement: false,
      reason: err?.message || "Failed to query WebGPU adapter.",
    };
  }
}

/**
 * Requests permanent storage permission to avoid browser cache eviction.
 */
export async function ensurePersistentStorage(): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Checks if a specific model is already cached locally in browser CacheStorage.
 */
export async function isModelCached(modelId: string = DEFAULT_LOCAL_MODEL): Promise<boolean> {
  try {
    return await hasModelInCache(modelId);
  } catch (err) {
    console.warn("Error checking model cache:", err);
    return false;
  }
}

/**
 * Deletes a cached model from browser CacheStorage to free up disk space.
 */
export async function deleteModelFromCache(modelId: string = DEFAULT_LOCAL_MODEL): Promise<void> {
  try {
    if (activeModelId === modelId && activeEngine) {
      await unloadLocalModel();
    }
    await deleteModelAllInfoInCache(modelId);
    notifyListeners({
      state: "not_downloaded",
      modelId,
      progress: 0,
      statusText: "Model cache deleted",
    });
  } catch (err: any) {
    console.error("Failed to delete model cache:", err);
    throw err;
  }
}

/**
 * Unloads the currently active engine from memory.
 */
export async function unloadLocalModel(): Promise<void> {
  if (activeEngine) {
    try {
      await activeEngine.unload();
    } catch {}
    activeEngine = null;
  }
  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
  }
  activeModelId = null;
  notifyListeners({
    state: "not_downloaded",
    progress: 0,
    statusText: "Model unloaded",
  });
}

/**
 * Initializes and loads a local SLM via WebGPU.
 * Runs inside a background Web Worker to preserve 60 FPS UI performance.
 */
export async function initLocalModel(
  modelId: string = DEFAULT_LOCAL_MODEL,
  onProgress?: (progress: number, text: string) => void
): Promise<MLCEngineInterface> {
  const gpuAudit = await checkWebGPUCapabilities();
  if (!gpuAudit.supported) {
    const reason = gpuAudit.reason || "WebGPU is not supported by your current browser or platform.";
    notifyListeners({
      state: "unsupported",
      modelId,
      statusText: reason,
      error: reason,
    });
    throw new Error(reason);
  }

  if (!gpuAudit.meetsBufferRequirement) {
    const errorMsg =
      gpuAudit.reason ||
      `Browser WebGPU storage buffer limit too low (${gpuAudit.storageBufferLimit ?? "unknown"} < 10). Please use Google Chrome, Edge, or the native ManuView Desktop app.`;
    notifyListeners({
      state: "error",
      modelId,
      progress: 0,
      statusText: "WebGPU Storage Buffer Limit Exceeded",
      error: errorMsg,
    });
    throw new Error(errorMsg);
  }

  // If already loaded with the same model, return existing engine
  if (activeEngine && activeModelId === modelId) {
    notifyListeners({
      state: "ready",
      modelId,
      progress: 1,
      statusText: "Model ready in memory",
    });
    return activeEngine;
  }

  // Request persistent storage
  await ensurePersistentStorage();

  notifyListeners({
    state: "downloading",
    modelId,
    progress: 0,
    statusText: "Initializing local WebGPU engine...",
  });

  const progressCallback = (report: InitProgressReport) => {
    const isCompiling = report.text.toLowerCase().includes("compil") || report.text.toLowerCase().includes("shader");
    const state: LocalModelState = isCompiling ? "compiling" : "downloading";
    
    notifyListeners({
      state,
      modelId,
      progress: report.progress,
      statusText: report.text,
    });
    onProgress?.(report.progress, report.text);
  };

  try {
    // Load WebLLM engine with direct WebGPU access
    // Bypasses Web Worker messaging issues in Tauri / WKWebView and connects directly to GPU
    activeEngine = await CreateMLCEngine(modelId, {
      initProgressCallback: progressCallback,
    });

    activeModelId = modelId;

    notifyListeners({
      state: "ready",
      modelId,
      progress: 1,
      statusText: `Model ${modelId} loaded and ready.`,
    });

    return activeEngine;
  } catch (err: any) {
    console.error("Failed to initialize WebLLM engine:", err);
    let errorMessage = err?.message || String(err);
    if (errorMessage.includes("maxStorageBuffersPerShaderStage")) {
      errorMessage =
        "Your browser (Safari/WebKit) restricts WebGPU storage buffers to 9 (WebLLM requires 10). For offline GPU SLM execution, please open ManuView in Google Chrome / Edge or use the native ManuView Desktop application.";
    }
    notifyListeners({
      state: "error",
      modelId,
      progress: 0,
      statusText: "Failed to initialize local model",
      error: errorMessage,
    });
    throw new Error(errorMessage);
  }
}

/**
 * Runs text generation using the local SLM.
 */
export async function generateWithLocalSLM(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  modelId: string = DEFAULT_LOCAL_MODEL,
  onChunk?: (delta: string, accumulated: string) => void
): Promise<string> {
  const engine = await initLocalModel(modelId);

  notifyListeners({
    state: "generating",
    modelId,
    progress: 1,
    statusText: "Generating response on-device...",
  });

  try {
    const completion = await engine.chat.completions.create({
      messages: messages as any,
      stream: true,
      temperature: 0.6,
      max_tokens: 1500,
    });

    let accumulated = "";
    for await (const chunk of completion) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) {
        accumulated += delta;
        onChunk?.(delta, accumulated);
      }
    }

    notifyListeners({
      state: "ready",
      modelId,
      progress: 1,
      statusText: "Inference completed",
    });

    return accumulated;
  } catch (err: any) {
    console.error("Local SLM generation failed:", err);
    notifyListeners({
      state: "error",
      modelId,
      progress: 0,
      statusText: "Generation error",
      error: err.message || String(err),
    });
    throw err;
  }
}
