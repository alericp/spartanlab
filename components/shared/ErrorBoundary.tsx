'use client'

import React, { ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary - Catches React render errors and shows fallback UI
 * Prevents single widget crashes from taking down the entire page
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
    // Log error for debugging
    console.error('[v0] ErrorBoundary caught error:', error, errorInfo)
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
