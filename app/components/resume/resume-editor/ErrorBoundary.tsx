// app/components/resume/resume-editor/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  /**
   * The content to render when no error occurs
   */
  children: ReactNode;
  
  /**
   * Optional custom fallback UI to show when an error is caught
   * If not provided, a default error message will be shown
   */
  fallback?: ReactNode;
  
  /**
   * Optional callback function triggered when an error is caught
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  /**
   * Whether an error has been caught
   */
  hasError: boolean;
  
  /**
   * The error that was caught, if any
   */
  error?: Error;
  
  /**
   * Additional error information
   */
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary component that catches errors in its child components
 * and displays a fallback UI instead of crashing the entire app.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<p>Something went wrong</p>}>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false 
    };
  }

  /**
   * Update state when an error occurs
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error 
    };
  }

  /**
   * Log error details when an error is caught
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error("Error caught by ErrorBoundary:", error);
    console.error("Component stack:", errorInfo.componentStack);
    
    // Set error info in state
    this.setState({ errorInfo });
    
    // Call the optional onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    // If an error occurred, show the fallback UI
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise use default fallback
      return (
        <div className="p-6 bg-red-900/20 border border-red-700 rounded-lg text-center">
          <h2 className="text-xl font-bold text-red-500 mb-3">Something went wrong</h2>
          <p className="text-white mb-4">
            The resume editor encountered an error. Please try refreshing the page.
          </p>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <details className="text-left bg-gray-900 p-3 rounded text-sm text-gray-300 mt-2">
              <summary className="cursor-pointer font-medium mb-2">Error details (developers only)</summary>
              <p className="font-mono">{this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre className="mt-2 text-xs overflow-auto max-h-60 p-2 bg-gray-800 rounded">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    // Otherwise, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
