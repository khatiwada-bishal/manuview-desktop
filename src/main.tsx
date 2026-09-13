// Polyfill process and global for browser / WebView runtime
if (typeof window !== "undefined") {
  (window as any).process = (window as any).process || { env: {} };
  (window as any).global = (window as any).global || window;
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ApiConnectionProvider } from "@/lib/useApiConnection";
import "./index.css";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center p-8 bg-[#F3F4F6] text-[#111827]">
          <div className="max-w-md w-full p-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-base font-bold text-[#0F172A]">Something went wrong</h2>
            <p className="text-xs text-neutral-500">
              An unexpected error occurred in ManuView Desktop:
            </p>
            <div className="p-3 rounded-lg bg-neutral-100 text-left text-xs font-mono text-neutral-700 overflow-x-auto max-h-40">
              {this.state.error?.message || "Unknown error"}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium transition cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ApiConnectionProvider>
        <App />
      </ApiConnectionProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
