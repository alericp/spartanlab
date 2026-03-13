'use client'

/**
 * GlobalErrorBoundary - Catches any unhandled errors in the app
 * 
 * CRITICAL: This is the last line of defense against crashes.
 * If an auth component or any other client code throws during hydration
 * or runtime, this boundary catches it and shows a safe fallback.
 */

import { Component, ErrorInfo, ReactNode } from 'react'
import Link from 'next/link'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('[GlobalErrorBoundary] Caught error:', error)
    console.error('[GlobalErrorBoundary] Error info:', errorInfo)
    
    this.setState({ errorInfo })
    
    // In production, you might want to send this to an error reporting service
  }

  handleRetry = () => {
    // Do a hard refresh to ensure all state is reset
    // Simply clearing the error state would cause the same error to throw again
    if (typeof window !== 'undefined') {
      window.location.reload()
    } else {
      this.setState({ hasError: false, error: null, errorInfo: null })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F1115] p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-8">
              <div className="w-12 h-12 rounded-full bg-[#C1121F]/10 flex items-center justify-center mx-auto mb-4">
                <svg 
                  className="w-6 h-6 text-[#C1121F]" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
              
              <h1 className="text-xl font-semibold text-[#E6E9EF] mb-2">
                Something went wrong
              </h1>
              
              <p className="text-sm text-[#A4ACB8] mb-6">
                We encountered an unexpected error. Please try again.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full px-4 py-2 bg-[#C1121F] hover:bg-[#A30F1A] text-white font-medium rounded-lg transition-colors"
                >
                  Try Again
                </button>
                
                <Link
                  href="/"
                  className="w-full px-4 py-2 border border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF] hover:border-[#3A3A3A] font-medium rounded-lg transition-colors inline-block"
                >
                  Go to Home
                </Link>
              </div>
              
              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-6 pt-6 border-t border-[#2B313A] text-left">
                  <p className="text-xs text-[#6B7280] mb-2">Error Details:</p>
                  <pre className="text-xs text-[#C1121F] bg-[#0F1115] rounded p-3 overflow-auto max-h-32">
                    {this.state.error.toString()}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
