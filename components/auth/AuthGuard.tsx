'use client'

/**
 * AuthGuard - Wrapper for protected pages using Clerk authentication
 * 
 * Uses native Clerk components for authentication state
 */

import { useEffect, useState, ReactNode } from 'react'
import { useAuth, SignedIn, SignedOut } from '@clerk/nextjs'

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
  const { isLoaded } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR - return null to prevent blocking
  if (!mounted) return null
  
  // Still loading auth state
  if (!isLoaded) return <>{fallback ?? <LoadingState />}</>

  // Use Clerk's native SignedIn/SignedOut components
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
  const { isLoaded } = useAuth()
  const [isOwner, setIsOwner] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

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
  }, [isLoaded])

  if (!isLoaded || !checked || !isOwner) return null
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
