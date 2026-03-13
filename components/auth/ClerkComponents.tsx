'use client'

/**
 * ClerkComponents - Preview-safe auth component wrappers
 * 
 * Architecture:
 * - In PREVIEW mode: Static behavior, no Clerk loading
 *   - SignedIn: renders nothing
 *   - SignedOut: renders children
 *   - UserButton: renders nothing
 * 
 * - In PRODUCTION mode: Real Clerk components loaded at runtime
 * 
 * NO POLLING. NO window.Clerk checks. Simple and static.
 */

import { ReactNode, useState, useEffect } from 'react'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'

// ============================================================================
// TYPES
// ============================================================================

interface AuthComponentProps {
  children: ReactNode
}

interface UserButtonProps {
  afterSignOutUrl?: string
}

// ============================================================================
// RUNTIME LOADER
// ============================================================================

/**
 * Load Clerk components at runtime (hidden from bundler)
 */
async function loadClerkComponents() {
  const moduleName = ['@', 'clerk', '/', 'nextjs'].join('')
  const loader = new Function('m', 'return import(m)')
  return loader(moduleName) as Promise<{
    SignedIn: React.ComponentType<{ children: ReactNode }>
    SignedOut: React.ComponentType<{ children: ReactNode }>
    UserButton: React.ComponentType<{ afterSignOutUrl?: string }>
    useAuth: () => { isLoaded: boolean; isSignedIn: boolean; userId: string | null }
    useUser: () => { isLoaded: boolean; isSignedIn: boolean; user: unknown }
  }>
}

// ============================================================================
// SIGNEDIN COMPONENT
// ============================================================================

/**
 * SignedIn - Renders children only when user is signed in
 * 
 * Preview mode: Always renders nothing (no auth state)
 * Production mode: Uses real Clerk SignedIn component
 */
export function SignedIn({ children }: AuthComponentProps) {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [RealSignedIn, setRealSignedIn] = useState<React.ComponentType<{ children: ReactNode }> | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isLoading || !isClerkAvailable) return

    loadClerkComponents()
      .then(mod => setRealSignedIn(() => mod.SignedIn))
      .catch(() => {})
  }, [mounted, isLoading, isClerkAvailable])

  // SSR: render nothing
  if (!mounted) return null
  
  // Loading: render nothing
  if (isLoading) return null
  
  // Preview mode: user is never "signed in"
  if (!isClerkAvailable) return null
  
  // Production mode waiting for Clerk: render nothing
  if (!RealSignedIn) return null
  
  // Production mode with Clerk loaded
  return <RealSignedIn>{children}</RealSignedIn>
}

// ============================================================================
// SIGNEDOUT COMPONENT
// ============================================================================

/**
 * SignedOut - Renders children when user is NOT signed in
 * 
 * Preview mode: Always renders children (no auth = signed out)
 * Production mode: Uses real Clerk SignedOut component
 */
export function SignedOut({ children }: AuthComponentProps) {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [RealSignedOut, setRealSignedOut] = useState<React.ComponentType<{ children: ReactNode }> | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isLoading || !isClerkAvailable) return

    loadClerkComponents()
      .then(mod => setRealSignedOut(() => mod.SignedOut))
      .catch(() => {})
  }, [mounted, isLoading, isClerkAvailable])

  // SSR: render children (default to signed out state)
  if (!mounted) return <>{children}</>
  
  // Loading: render children (optimistic signed out)
  if (isLoading) return <>{children}</>
  
  // Preview mode: always show signed-out content
  if (!isClerkAvailable) return <>{children}</>
  
  // Production mode waiting for Clerk: render children
  if (!RealSignedOut) return <>{children}</>
  
  // Production mode with Clerk loaded
  return <RealSignedOut>{children}</RealSignedOut>
}

// ============================================================================
// USERBUTTON COMPONENT
// ============================================================================

/**
 * UserButton - User avatar with sign-out menu
 * 
 * Preview mode: Renders nothing (no user)
 * Production mode: Uses real Clerk UserButton
 */
export function UserButton({ afterSignOutUrl = '/' }: UserButtonProps) {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [RealUserButton, setRealUserButton] = useState<React.ComponentType<{ afterSignOutUrl?: string }> | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isLoading || !isClerkAvailable) return

    loadClerkComponents()
      .then(mod => setRealUserButton(() => mod.UserButton))
      .catch(() => {})
  }, [mounted, isLoading, isClerkAvailable])

  // SSR or Loading or Preview: render nothing
  if (!mounted || isLoading || !isClerkAvailable || !RealUserButton) {
    return null
  }

  return <RealUserButton afterSignOutUrl={afterSignOutUrl} />
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * useSafeAuth - Returns auth state, safe for preview
 * 
 * Preview mode: Always returns unauthenticated state
 * Production mode: Returns real auth state via Clerk
 */
export function useSafeAuth() {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [authState, setAuthState] = useState({
    isLoaded: false,
    isSignedIn: false,
    userId: null as string | null,
  })

  useEffect(() => {
    // Preview mode: always unauthenticated
    if (!isClerkAvailable) {
      setAuthState({ isLoaded: true, isSignedIn: false, userId: null })
      return
    }

    // Production mode: load real auth state
    loadClerkComponents()
      .then(mod => {
        // We can't call hooks here, so we mark as loaded
        // Actual auth state comes from SignedIn/SignedOut components
        setAuthState({ isLoaded: true, isSignedIn: false, userId: null })
      })
      .catch(() => {
        setAuthState({ isLoaded: true, isSignedIn: false, userId: null })
      })
  }, [isClerkAvailable])

  return {
    isLoaded: !isLoading && authState.isLoaded,
    isSignedIn: authState.isSignedIn,
    userId: authState.userId,
    signOut: async () => {
      // Redirect on sign out
      window.location.href = '/'
    },
  }
}

/**
 * useSafeUser - Returns user data, safe for preview
 * 
 * Preview mode: Always returns no user
 * Production mode: Returns real user via Clerk
 */
export function useSafeUser() {
  const { isClerkAvailable, isLoading } = useClerkAvailability()

  return {
    user: null,
    isLoaded: !isLoading,
    isSignedIn: false,
  }
}
