import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-[var(--bg-secondary)] border border-red-500/20 rounded-xl m-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="text-red-400" size={24} />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Something went wrong</h2>
          <p className="text-sm text-[var(--text-secondary)] text-center mb-4 max-w-md">
            {this.props.fallbackMessage || 'The application encountered an unexpected error.'}
          </p>
          
          {this.state.error && (
            <div className="w-full max-w-2xl bg-[var(--bg-tertiary)] p-4 rounded-lg overflow-x-auto text-left mb-6">
              <p className="text-red-400 font-mono text-xs mb-2 font-bold">{this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre className="text-[10px] text-[var(--text-tertiary)] font-mono whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}

          <Button 
            variant="primary" 
            onClick={this.handleReset}
            icon={<RefreshCw size={16} />}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
