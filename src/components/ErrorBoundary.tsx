import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-800 border border-slate-700 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-bold font-display text-white">
                Something went wrong
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                The application encountered an unexpected display error.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-left text-xs font-mono text-rose-300 max-h-32 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#1d2547] hover:bg-[#283363] text-white text-xs font-bold border border-blue-500/30 cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
