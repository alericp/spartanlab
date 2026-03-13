'use client'

/**
 * AuthGuard - Preview-safe wrapper for protected pages
 * 
 * On preview: Allows access without authentication (for testing UI)
 * On production: Requires authentication, redirects to sign-in if needed
 */

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'
import { SignedIn, SignedOut } from '@/components/auth/ClerkComponents'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

/**
 * AuthGuard wraps protected page content
 * - In preview: allows access without auth
 * - On production: requires authentication
 */
export function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/sign-in' 
}: AuthGuardProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR/initial render
  if (!mounted) {
    return fallback ?? <LoadingState />
  }

  // Wait for Clerk availability check
  if (isClerkLoading) {
    return fallback ?? <LoadingState />
  }

  // Preview mode: allow access without auth
  if (!isClerkAvailable) {
    return <>{children}</>
  }

  // Production: use auth-aware rendering
  return (
    <AuthGuardProduction redirectTo={redirectTo} fallback={fallback}>
      {children}
    </AuthGuardProduction>
  )
}

/**
 * Production auth guard - only rendered when Clerk is available
 */
function AuthGuardProduction({ 
  children, 
  fallback,
  redirectTo 
}: AuthGuardProps) {
  const router = useRouter()
  
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <AuthRedirect redirectTo={redirectTo ?? '/sign-in'} fallback={fallback} />
      </SignedOut>
    </>
  )
}

/**
 * Redirects unauthenticated users
 */
function AuthRedirect({ redirectTo, fallback }: { redirectTo: string; fallback?: ReactNode }) {
  const router = useRouter()
  
  useEffect(() => {
    router.replace(redirectTo)
  }, [router, redirectTo])
  
  return fallback ?? <LoadingState />
}

/**
 * OwnerOnly - Only renders content for the platform owner
 * Returns nothing in preview mode
 */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR/loading
  if (!mounted || isClerkLoading) return null

  // Preview mode: never show owner content
  if (!isClerkAvailable) return null

  // Production: use owner check component
  return <OwnerOnlyProduction>{children}</OwnerOnlyProduction>
}

/**
 * Owner check component - only rendered on production
 * Loads OwnerOnlyInner from ClerkComponentsInner dynamically
 */
function OwnerOnlyProduction({ children }: { children: ReactNode }) {
  const [Component, setComponent] = useState<React.ComponentType<{ children: ReactNode }> | null>(null)
  
  useEffect(() => {
    import('./ClerkComponentsInner')
      .then(mod => setComponent(() => mod.OwnerOnlyInner))
      .catch(() => setComponent(null))
  }, [])
  
  if (!Component) return null
  return <Component>{children}</Component>
}

/**
 * useOwnerStatus - Hook to check if current user is the owner
 * Returns isOwner: false in preview mode
 * 
 * NOTE: For accurate owner status on production, use the OwnerOnly component
 * which properly checks via Clerk context.
 */
export function useOwnerStatus(): { isOwner: boolean; isLoaded: boolean } {
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()

  // Always return false for isOwner from this hook
  // Actual owner check happens in OwnerOnly component
  return {
    isOwner: false,
    isLoaded: !isClerkLoading,
  }
}
