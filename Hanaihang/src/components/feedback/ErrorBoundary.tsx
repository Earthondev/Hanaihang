import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

import { BaseButton } from '../ui/BaseButton';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to analytics if available
    if (typeof window !== 'undefined' && (window as unknown).gtag) {
      (window as unknown).gtag('event', 'error_boundary_caught', {
        event_category: 'error',
        event_label: error.message,
        value: 1
      });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-red-100 grid place-items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-3">
              มีบางอย่างผิดปกติ
            </h2>
            <p className="text-sm text-red-700 mb-6">
              เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองรีเฟรชหน้า หรือติดต่อผู้ดูแลระบบ
            </p>
            <div className="space-y-3">
              <BaseButton 
                variant="primary" 
                onClick={this.resetError}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                ลองใหม่
              </BaseButton>
              <BaseButton 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                รีเฟรชหน้า
              </BaseButton>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-red-600 font-medium">
                  ดูรายละเอียดข้อผิดพลาด (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-700 bg-red-100 p-3 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
