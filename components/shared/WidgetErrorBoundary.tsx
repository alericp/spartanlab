'use client'

/**
 * WidgetErrorBoundary - Catches errors in individual dashboard widgets
 * 
 * This prevents a single broken widget from crashing the entire dashboard.
 * Shows a minimal error state inline instead of triggering the global error boundary.
 */

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Fallback to show on error. Defaults to a minimal error message. */
  fallback?: ReactNode
  /** Widget name for error logging */
  widgetName?: string
  /** Whether to completely hide on error (vs showing error state) */
  hideOnError?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with widget context
    const widgetName = this.props.widgetName || 'unknown'
    console.error(
      `[v0] Widget crash detected: ${widgetName}`,
      error.message
    )
    console.error(
      `[v0] Stack trace for ${widgetName}:`,
      error.stack
    )
    console.error('[v0] Component stack:', errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      // Option to completely hide failed widget
      if (this.props.hideOnError) {
        return null
      }
      
      // Custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }
      
      // Default minimal error state
      return (
        <div className="bg-[#1A1F26] border border-[#2B313A] rounded-lg p-4">
          <p className="text-sm text-[#6B7280]">
            Unable to load this section
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * SafeWidget - Convenience wrapper for dashboard widgets
 * 
 * Usage:
 * <SafeWidget name="TrainingMomentum">
 *   <TrainingMomentumCard momentum={momentum} />
 * </SafeWidget>
 */
export function SafeWidget({ 
  children, 
  name,
  hideOnError = false,
}: { 
  children: ReactNode
  name: string
  hideOnError?: boolean
}) {
  return (
    <WidgetErrorBoundary widgetName={name} hideOnError={hideOnError}>
      {children}
    </WidgetErrorBoundary>
  )
}
