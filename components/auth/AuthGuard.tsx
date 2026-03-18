// AUTH_TRUTH_PASS_V5
'use client'

/**
 * AuthGuard - Uses only useAuth with userId branching
 * No SignedIn/SignedOut components
 * 
 * CRITICAL: This component is fail-soft. If Clerk auth fails during
 * hydration, we show a clean sign-in prompt rather than crashing.
 */

import { useEffect, useState, ReactNode, Component } from 'react'
import { useAuth } from '@clerk/nextjs'

// ============================================================================
// ERROR BOUNDARY FOR AUTH CRASHES
// ============================================================================

class AuthErrorBoundary extends Component<{ children: ReactNode; redirectTo: string }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; redirectTo: string }) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  
  componentDidCatch(error: Error) {
    console.error('[v0] AuthGuard crashed (caught safely):', error.message)
  }
  
  render() {
    if (this.state.hasError) {
      // Show sign-in fallback on auth crash
      return (
        <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
          <div className="bg-[#1A1D23] border border-[#2B313A] rounded-lg p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#2B313A] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#A4ACB8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#E6E9EF] mb-2">Session Error</h2>
            <p className="text-[#A4ACB8] mb-6">Unable to verify your session. Please sign in again.</p>
            <a 
              href={this.props.redirectTo}
              className="inline-block w-full px-4 py-3 bg-[#C1121F] hover:bg-[#A30F1A] text-white font-medium rounded-lg transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================================
// LOADING STATE
// ============================================================================

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ============================================================================
// SIGNED OUT FALLBACK
// ============================================================================

function SignedOutFallback({ redirectTo }: { redirectTo: string }) {
  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
      <div className="bg-[#1A1D23] border border-[#2B313A] rounded-lg p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#2B313A] flex items-center justify-center">
          <svg className="w-6 h-6 text-[#A4ACB8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[#E6E9EF] mb-2">Sign in required</h2>
        <p className="text-[#A4ACB8] mb-6">You need to sign in to access this page.</p>
        <a 
          href={redirectTo}
          className="inline-block w-full px-4 py-3 bg-[#C1121F] hover:bg-[#A30F1A] text-white font-medium rounded-lg transition-colors"
        >
          Sign In
        </a>
      </div>
    </div>
  )
}

// ============================================================================
// AUTHGUARD COMPONENT
// ============================================================================

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
}

/**
 * Inner AuthGuard logic - can throw if useAuth fails
 */
function AuthGuardInner({ 
  children, 
  fallback,
  redirectTo = '/sign-in' 
}: AuthGuardProps) {
  const { isLoaded, userId } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR - return null to prevent blocking
  if (!mounted) return null
  
  // Auth not yet loaded
  if (!isLoaded) return <>{fallback ?? <LoadingState />}</>

  // Not signed in - show fallback
  if (!userId) return <SignedOutFallback redirectTo={redirectTo} />

  // Signed in - render children
  return <>{children}</>
}

/**
 * AuthGuard - Protects pages that require authentication
 * 
 * Uses only useAuth with explicit userId branching.
 * Wrapped in error boundary to prevent auth crashes from taking down the page.
 */
export function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/sign-in' 
}: AuthGuardProps) {
  return (
    <AuthErrorBoundary redirectTo={redirectTo}>
      <AuthGuardInner fallback={fallback} redirectTo={redirectTo}>
        {children}
      </AuthGuardInner>
    </AuthErrorBoundary>
  )
}

// ============================================================================
// OWNERONLY COMPONENT (SIMPLIFIED)
// ============================================================================

/**
 * OwnerOnly - Only renders for the platform owner
 */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const { isLoaded, userId } = useAuth()
  const [isOwner, setIsOwner] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isLoaded || !userId) return

    // Check owner status via API
    fetch('/api/auth/owner-status')
      .then(res => {
        if (!res.ok) return { isOwner: false }
        return res.json()
      })
      .then(data => {
        setIsOwner(data?.isOwner === true)
        setChecked(true)
      })
      .catch(() => {
        setIsOwner(false)
        setChecked(true)
      })
  }, [isLoaded, userId])

  if (!isLoaded || !userId || !checked || !isOwner) return null
  return <>{children}</>
}

// ============================================================================
// HOOK (SIMPLIFIED)
// ============================================================================

/**
 * useOwnerStatus - Returns owner status
 * Always returns false - use OwnerOnly component instead
 */
export function useOwnerStatus(): { isOwner: boolean; isLoaded: boolean } {
  const { isLoaded } = useAuth()
  return { isOwner: false, isLoaded }
}
