import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("DashboardErrorBoundary caught an error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center rounded-2xl bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 shadow-sm m-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">
            {this.props.fallbackTitle || "Unable to render this section"}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mb-4">
            An unexpected display error occurred. Your review data is safe and preserved. You can refresh this view or switch tabs.
          </p>
          {this.state.error?.message && (
            <div className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 rounded-lg mb-4 max-w-md truncate">
              {this.state.error.message}
            </div>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Section</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
