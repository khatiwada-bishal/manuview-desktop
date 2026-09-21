import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ShieldCheck,
  FileUp,
  FileText,
  Loader2,
  AlertCircle,
  Settings as SettingsIcon,
  Sparkles,
  CircleCheck,
  CircleAlert,
  CircleX,
  Info,
  Gauge,
  X,
} from "lucide-react";
import { extractTextFromFile } from "@/lib/parser";
import { getSavedClientConfig } from "@/lib/llm";
import { resolveTypeSafeKey, TYPESAFE_DEFAULT_MODEL } from "@/lib/typesafe";
import {
  runTypeSafeScan,
  type TypeSafeScanResult,
  type ScanSignal,
  type SignalTone,
} from "@/lib/typesafe-scan";

interface Props {
  onOpenSettings: () => void;
}

const TONE_STYLES: Record<SignalTone, { dot: string; text: string; Icon: typeof CircleCheck }> = {
  good: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    Icon: CircleCheck,
  },
  warn: {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    Icon: CircleAlert,
  },
  bad: { dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-400", Icon: CircleX },
  info: { dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-300", Icon: Info },
};

function readinessColor(pct: number): string {
  if (pct >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 65) return "text-lime-600 dark:text-lime-400";
  if (pct >= 45) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function estimateCostUsd(inputTokens: number | undefined): string {
  if (!inputTokens) return "—";
  // Jev 1.13: $42 per billion input tokens ($0.042 / Mtok). Output tokens are free.
  const usd = (inputTokens / 1_000_000_000) * 42;
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(4)}`;
}

export function DesktopTypeSafeScanView({ onOpenSettings }: Props) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TypeSafeScanResult | null>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const model = useMemo(() => {
    const saved = getSavedClientConfig();
    return saved?.provider === "typesafe" && saved.model ? saved.model : TYPESAFE_DEFAULT_MODEL;
  }, []);

  useEffect(() => {
    let active = true;
    resolveTypeSafeKey()
      .then((k) => active && setHasKey(Boolean(k)))
      .catch(() => active && setHasKey(false));
    return () => {
      active = false;
    };
  }, []);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setParsingFile(true);
    try {
      const extracted = await extractTextFromFile(file);
      setText(extracted);
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const runScan = async () => {
    if (!text.trim()) {
      setError("Paste manuscript text or upload a document first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const scan = await runTypeSafeScan(text, { model });
      setResult(scan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The TypeSafe scan failed.");
    } finally {
      setLoading(false);
    }
  };

  const clearInput = () => {
    setText("");
    setFileName(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
              TypeSafe Structured Scan
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              Fast, typed document diagnostics powered by TypeSafe&apos;s Jev model. One request
              runs {" "}
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                every check in parallel
              </span>{" "}
              and returns calibrated decisions with confidence — no prose, no hallucinations.
            </p>
          </div>
        </div>

        {/* Key notice */}
        {hasKey === false && (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-sm">
            <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                No TypeSafe API key found. Add your Jev key to run structured scans.
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition shrink-0 cursor-pointer"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              Open AI Settings
            </button>
          </div>
        )}

        {/* Input */}
        <div className="rounded-2xl border border-neutral-200 dark:border-[#334155] bg-white dark:bg-[#161F30] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Manuscript
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md,.tex"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsingFile || loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-[#1E293B] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#26344a] transition cursor-pointer disabled:opacity-50"
              >
                {parsingFile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileUp className="w-3.5 h-3.5" />
                )}
                Upload
              </button>
              {(text || fileName) && (
                <button
                  type="button"
                  onClick={clearInput}
                  disabled={loading}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {fileName && (
            <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="truncate">{fileName}</span>
            </div>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your manuscript here, or upload a PDF / DOCX / TXT above…"
            rows={10}
            className="w-full resize-y rounded-xl bg-neutral-50 dark:bg-[#0F172A] border border-neutral-200 dark:border-[#334155] focus:border-blue-500 focus:outline-none p-3 text-sm text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 transition"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
              {wordCount.toLocaleString()} words · model {model}
            </span>
            <button
              type="button"
              onClick={runScan}
              disabled={loading || parsingFile || !text.trim() || hasKey === false}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:bg-neutral-200 dark:disabled:bg-[#1E293B] disabled:text-neutral-400 dark:disabled:text-neutral-600 transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Structured Scan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-sm text-rose-800 dark:text-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {result && <ScanResults result={result} />}
      </div>
    </div>
  );
}

function ScanResults({ result }: { result: TypeSafeScanResult }) {
  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="rounded-2xl border border-neutral-200 dark:border-[#334155] bg-white dark:bg-[#161F30] p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Gauge className={`w-8 h-8 ${readinessColor(result.readiness)}`} />
            <div>
              <div className={`text-3xl font-bold leading-none ${readinessColor(result.readiness)}`}>
                {result.readiness}
                <span className="text-base font-semibold text-neutral-400">/100</span>
              </div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                {result.readinessLabel}
              </div>
            </div>
          </div>
          <div className="h-10 w-px bg-neutral-200 dark:bg-[#334155] hidden sm:block" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-xs">
            <Meta label="Document" value={result.documentType} />
            <Meta label="Model" value={result.model} />
            <Meta label="Input tokens" value={(result.usage?.input_tokens ?? 0).toLocaleString()} />
            <Meta label="Est. cost" value={estimateCostUsd(result.usage?.input_tokens)} />
          </div>
        </div>
      </div>

      {/* Attention flags */}
      {result.flags.length > 0 && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <CircleAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              Needs attention ({result.flags.length})
            </h3>
          </div>
          <ul className="space-y-1.5">
            {result.flags.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-neutral-700 dark:text-neutral-300">{s.label}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className={`font-medium ${TONE_STYLES[s.tone].text}`}>{s.display}</span>
                  {s.needsReview && (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                      low confidence
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grouped signals */}
      {result.groups.map((group) => (
        <div
          key={group.name}
          className="rounded-2xl border border-neutral-200 dark:border-[#334155] bg-white dark:bg-[#161F30] overflow-hidden"
        >
          <div className="px-4 py-2.5 border-b border-neutral-100 dark:border-[#26344a] bg-neutral-50/60 dark:bg-[#0F172A]/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {group.name}
            </h3>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-[#26344a]">
            {group.signals.map((s) => (
              <SignalRow key={s.id} signal={s} />
            ))}
          </div>
        </div>
      ))}

      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed">
        Signals are calibrated probabilities from TypeSafe&apos;s Jev model, composed into an overall
        score in code. Confidence reflects how peaked the model&apos;s answer is; low-confidence items
        are flagged for human review. This is decision support, not an editorial verdict.
      </p>
    </div>
  );
}

function SignalRow({ signal }: { signal: ScanSignal }) {
  const tone = TONE_STYLES[signal.tone];
  const ToneIcon = tone.Icon;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <ToneIcon className={`w-4 h-4 shrink-0 ${tone.text}`} />
        <span className="text-sm text-neutral-700 dark:text-neutral-200 truncate">
          {signal.label}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {typeof signal.confidence === "number" && (
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
            conf {signal.confidence.toFixed(2)}
          </span>
        )}
        <span className={`text-sm font-medium ${tone.text}`}>{signal.display}</span>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        {label}
      </div>
      <div className="text-neutral-800 dark:text-neutral-100 font-medium truncate">{value}</div>
    </div>
  );
}
