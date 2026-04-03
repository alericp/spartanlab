'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ProgramErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ProgramErrorBoundaryProps {
  children: React.ReactNode
  fallbackMessage?: string
  onRetry?: () => void
}

/**
 * Error Boundary for Program Display Components
 * [UI CONTRACT ALIGNMENT] - Catches undefined variable crashes and shows fallback UI
 */
export class ProgramErrorBoundary extends React.Component<
  ProgramErrorBoundaryProps,
  ProgramErrorBoundaryState
> {
  constructor(props: ProgramErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ProgramErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in dev mode only
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PROGRAM ERROR BOUNDARY] Caught render error:', {
        error: error.message,
        componentStack: errorInfo.componentStack?.slice(0, 500),
      })
    }
    this.setState({ errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="bg-[#1A1A1A] border-amber-500/30 p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
            <div>
              <h3 className="text-lg font-medium text-white mb-1">
                Display Error
              </h3>
              <p className="text-sm text-[#A5A5A5]">
                {this.props.fallbackMessage || 'There was an issue displaying this section. Your program data is safe.'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <p className="text-xs text-[#6A6A6A] mt-2 font-mono">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * Safe fallback text component for missing data
 */
export function SafeFallbackText({ 
  message = 'Data not available',
  className = ''
}: { 
  message?: string
  className?: string 
}) {
  return (
    <span className={`text-[#6A6A6A] text-sm italic ${className}`}>
      {message}
    </span>
  )
}
