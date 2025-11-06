import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  feature?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
    
    // In production, you would send this to your error reporting service
    // errorReportingService.captureException(error, { extra: errorInfo })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <Card className="p-8 m-4 text-center border-red-200 bg-red-50">
          <div className="flex flex-col items-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            
            <div>
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Something went wrong{this.props.feature && ` in ${this.props.feature}`}
              </h2>
              <p className="text-red-700 mb-4">
                We encountered an unexpected error. Please try again or contact support if the problem persists.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left text-sm text-red-600 bg-red-100 p-3 rounded mb-4">
                  <summary className="cursor-pointer font-medium">Error Details (Dev Only)</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
                  {this.state.error.stack && (
                    <pre className="mt-2 text-xs whitespace-pre-wrap">{this.state.error.stack}</pre>
                  )}
                </details>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleReload}
                className="flex items-center gap-2"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components (React 16.8+)
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo)
    
    // In production, send to error reporting service
    // errorReportingService.captureException(error, { extra: errorInfo })
  }
}

export default ErrorBoundary
