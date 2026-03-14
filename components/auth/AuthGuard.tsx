'use client'

/**
 * AuthGuard - Preview-safe wrapper for protected pages
 * 
 * SIMPLIFIED ARCHITECTURE:
 * - Preview mode: Allows access for UI testing
 * - Production mode: Requires auth, uses SignedIn/SignedOut
 * 
 * NO window.Clerk checks. NO polling. Simple components.
 */

import { useEffect, useState, ReactNode } from 'react'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'
import { SignedIn, SignedOut } from '@/components/auth/ClerkComponents'

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
// SIGNED OUT FALLBACK (production only)
// ============================================================================

function SignedOutFallback({ redirectTo }: { redirectTo: string }) {
  // Log when this branch is reached
  console.log('[v0] AuthGuard: signed-out fallback rendered', { redirectTo })
  
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
        <p className="mt-4 text-xs text-[#6B7280]">
          AuthGuard: signed-out branch
        </p>
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
 * AuthGuard - Protects pages that require authentication
 * 
 * Preview: Allows access (for UI testing)
 * Production: Redirects to sign-in if not authenticated
 */
export function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/sign-in' 
}: AuthGuardProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading } = useClerkAvailability()

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR - return null to prevent blocking, let client handle auth
  if (!mounted) {
    console.log('[v0] AuthGuard: ssr - not mounted')
    return null
  }
  
  // Still loading - return null to prevent blocking the app shell
  if (isLoading) {
    console.log('[v0] AuthGuard: loading state')
    return null
  }

  // Preview mode: allow access without auth (for UI testing)
  if (!isClerkAvailable) {
    console.log('[v0] AuthGuard: preview-bypass - Clerk not available')
    return <>{children}</>
  }

  // Production mode: require authentication
  console.log('[v0] AuthGuard: production mode - rendering SignedIn/SignedOut')
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <SignedOutFallback redirectTo={redirectTo} />
      </SignedOut>
    </>
  )
}

// ============================================================================
// OWNERONLY COMPONENT (SIMPLIFIED)
// ============================================================================

/**
 * OwnerOnly - Only renders for the platform owner
 * 
 * SIMPLIFIED: Uses server-side owner check via API instead of
 * brittle client-side window.Clerk checks.
 * 
 * Preview mode: Renders nothing
 * Production mode: Checks owner status and renders accordingly
 */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [isOwner, setIsOwner] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Preview mode: not owner
    if (!isClerkAvailable) {
      setIsOwner(false)
      setChecked(true)
      return
    }

    // Production mode: check owner status via API
    // This is more reliable than client-side window.Clerk checks
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
  }, [isClerkAvailable])

  if (isLoading || !checked || !isOwner) return null
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
  const { isLoading } = useClerkAvailability()
  return { isOwner: false, isLoaded: !isLoading }
}
