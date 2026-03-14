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
import { useRouter } from 'next/navigation'
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
// AUTH REDIRECT (production only)
// ============================================================================

function AuthRedirect({ redirectTo }: { redirectTo: string }) {
  const router = useRouter()
  
  useEffect(() => {
    router.replace(redirectTo)
  }, [router, redirectTo])
  
  return <LoadingState />
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

  // Determine which branch we're in for diagnostics
  const getBranch = () => {
    if (!mounted) return 'ssr'
    if (isLoading) return 'loading'
    if (!isClerkAvailable) return 'fallback-preview'
    return 'clerk-production'
  }
  
  // Log final branch (only when mounted and not loading)
  useEffect(() => {
    if (mounted && !isLoading) {
      console.log('[v0] AuthGuard resolved:', { branch: getBranch(), isClerkAvailable, isLoading })
    }
  }, [mounted, isLoading, isClerkAvailable])

  // SSR
  if (!mounted) return <>{fallback ?? <LoadingState />}</>
  
  // Checking auth availability
  if (isLoading) return <>{fallback ?? <LoadingState />}</>

  // Preview mode: allow access without auth
  if (!isClerkAvailable) return <>{children}</>

  // Production mode: require authentication
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <AuthRedirect redirectTo={redirectTo} />
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
