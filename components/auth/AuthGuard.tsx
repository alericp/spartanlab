'use client'

/**
 * AuthGuard - Preview-safe wrapper for protected pages
 * 
 * Architecture:
 * - Preview mode: Allows access (for UI testing)
 * - Production mode: Requires auth, redirects to sign-in if needed
 * 
 * NO POLLING. Uses SignedIn/SignedOut components.
 */

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'
import { SignedIn, SignedOut } from '@/components/auth/ClerkComponents'

// ============================================================================
// TYPES
// ============================================================================

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
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
// AUTH REDIRECT (production only)
// ============================================================================

function AuthRedirect({ redirectTo, fallback }: { redirectTo: string; fallback?: ReactNode }) {
  const router = useRouter()
  
  useEffect(() => {
    router.replace(redirectTo)
  }, [router, redirectTo])
  
  return <>{fallback ?? <LoadingState />}</>
}

// ============================================================================
// AUTHGUARD COMPONENT
// ============================================================================

/**
 * AuthGuard - Protects pages that require authentication
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

  // SSR or Loading
  if (!mounted || isLoading) {
    return <>{fallback ?? <LoadingState />}</>
  }

  // Preview mode: allow access without auth (for UI testing)
  if (!isClerkAvailable) {
    return <>{children}</>
  }

  // Production mode: require authentication
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <AuthRedirect redirectTo={redirectTo} fallback={fallback} />
      </SignedOut>
    </>
  )
}

// ============================================================================
// OWNERONLY COMPONENT
// ============================================================================

/**
 * OwnerOnly - Only renders for the platform owner
 * 
 * Preview mode: Renders nothing
 * Production mode: Checks owner email
 */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [isOwner, setIsOwner] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Preview mode: never owner
    if (!isClerkAvailable) {
      setIsOwner(false)
      setChecked(true)
      return
    }

    // Production mode: load and check
    const checkOwner = async () => {
      try {
        const moduleName = ['@', 'clerk', '/', 'nextjs'].join('')
        const loader = new Function('m', 'return import(m)')
        const mod = await loader(moduleName) as { 
          useUser: () => { user: { primaryEmailAddress?: { emailAddress: string } } | null } 
        }
        
        // We can't use hooks here, so check Clerk global
        const clerkGlobal = (window as unknown as { 
          Clerk?: { user?: { primaryEmailAddress?: { emailAddress: string } } } 
        }).Clerk
        
        if (clerkGlobal?.user) {
          const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL
          const userEmail = clerkGlobal.user.primaryEmailAddress?.emailAddress
          setIsOwner(userEmail?.toLowerCase() === ownerEmail?.toLowerCase())
        }
      } catch {
        setIsOwner(false)
      }
      setChecked(true)
    }
    
    // Check once after Clerk loads
    const timeout = setTimeout(checkOwner, 1000)
    return () => clearTimeout(timeout)
  }, [isClerkAvailable])

  if (!mounted || isLoading || !checked || !isOwner) {
    return null
  }

  return <>{children}</>
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * useOwnerStatus - Returns owner status (always false in preview)
 */
export function useOwnerStatus(): { isOwner: boolean; isLoaded: boolean } {
  const { isLoading } = useClerkAvailability()
  
  // Always return false - OwnerOnly component handles actual check
  return { 
    isOwner: false, 
    isLoaded: !isLoading 
  }
}
