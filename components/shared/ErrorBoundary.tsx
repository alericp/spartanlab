'use client'

import React, { ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void  // [PHASE 10] Callback for exact error capture
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary - Catches React render errors and shows fallback UI
 * Prevents single widget crashes from taking down the entire page
 * [PHASE 10] Enhanced with exact error capture for debugging
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // [PHASE 10 TASK 1] Log exact error for debugging display crashes
    console.error('[phase10-display-exact-crash-capture]', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 stack frames
      componentStack: errorInfo.componentStack?.split('\n').slice(0, 10).join('\n'), // First 10 component frames
      crashedBeforeSessionsRendered: errorInfo.componentStack?.includes('AdaptiveSessionCard') ? false : true,
      verdict: 'DISPLAY_CRASH_CAPTURED_EXACT_ERROR',
    })
    
    // Call onError callback if provided
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="py-12">
            <div className="bg-[#1A1D23] border border-[#2A2F38] rounded-xl p-8 text-center">
              <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">Something went wrong</h2>
              <p className="text-[#A4ACB8] text-sm">
                Please try refreshing the page or contact support if the problem persists.
              </p>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
