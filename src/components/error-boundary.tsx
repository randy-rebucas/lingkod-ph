'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { reportClientError } from '@/lib/error-monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: null,
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report error to monitoring service
    const errorId = await reportClientError(
      error,
      'ErrorBoundary',
      'component_did_catch',
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      }
    );

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const { error, errorId } = this.state;
    if (error && errorId) {
      // In a real implementation, this would open a bug report form
      // with pre-filled error information
      const bugReportUrl = `/support/bug-report?errorId=${errorId}`;
      window.open(bugReportUrl, '_blank');
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription>
                We're sorry, but something unexpected happened. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert>
                  <Bug className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div>
                        <strong>Error:</strong> {this.state.error.message}
                      </div>
                      {this.state.errorId && (
                        <div>
                          <strong>Error ID:</strong> {this.state.errorId}
                        </div>
                      )}
                      {this.state.error.stack && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium">
                            Stack Trace
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {this.state.error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
                {this.state.errorId && (
                  <Button variant="outline" onClick={this.handleReportBug} className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Report Bug
                  </Button>
                )}
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  If this problem persists, please contact our support team.
                  {this.state.errorId && (
                    <span> Reference ID: <code className="bg-gray-100 px-1 rounded">{this.state.errorId}</code></span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: string) => {
    reportClientError(
      error,
      context || 'useErrorHandler',
      'manual_error_report',
      {
        hookBased: true,
      }
    );
  }, []);

  return handleError;
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
