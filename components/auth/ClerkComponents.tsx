'use client'

/**
 * ClerkComponents - Preview-safe auth components
 * 
 * STRICT ISOLATION ARCHITECTURE:
 * - This file contains NO imports from @clerk/nextjs
 * - On preview domains, these components render static fallbacks
 * - On production domains, these components load inner components
 *   from ClerkComponentsInner.tsx via dynamic import
 * 
 * The key insight: by keeping ALL Clerk imports in a separate file
 * that's only dynamically imported on production, we ensure the
 * Clerk bundle is never loaded in preview.
 */

import { ReactNode, useState, useEffect } from 'react'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'

interface AuthComponentProps {
  children: ReactNode
}

/**
 * SignedIn - renders children only when user is signed in
 * Preview: renders nothing (user is never signed in)
 */
export function SignedIn({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [InnerComponent, setInnerComponent] = useState<React.ComponentType<AuthComponentProps> | null>(null)

  useEffect(() => {
    setMounted(true)
    
    // Only load the inner component on production
    if (isClerkAvailable && !isLoading) {
      import('./ClerkComponentsInner')
        .then(mod => setInnerComponent(() => mod.SignedInInner))
        .catch(() => {})
    }
  }, [isClerkAvailable, isLoading])

  // SSR or initial mount
  if (!mounted || isLoading) return null
  
  // Preview mode: never signed in
  if (!isClerkAvailable) return null

  // Production with component loaded
  if (InnerComponent) {
    return <InnerComponent>{children}</InnerComponent>
  }

  // Production loading - show nothing while loading
  return null
}

/**
 * SignedOut - renders children when user is NOT signed in
 * Preview: always renders children (user is always signed out)
 */
export function SignedOut({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [InnerComponent, setInnerComponent] = useState<React.ComponentType<AuthComponentProps> | null>(null)

  useEffect(() => {
    setMounted(true)
    
    // Only load the inner component on production
    if (isClerkAvailable && !isLoading) {
      import('./ClerkComponentsInner')
        .then(mod => setInnerComponent(() => mod.SignedOutInner))
        .catch(() => {
          // On error, set a passthrough component
          setInnerComponent(() => ({ children }: AuthComponentProps) => <>{children}</>)
        })
    }
  }, [isClerkAvailable, isLoading])

  // SSR or initial mount
  if (!mounted || isLoading) return null
  
  // Preview mode: always signed out
  if (!isClerkAvailable) return <>{children}</>

  // Production with component loaded
  if (InnerComponent) {
    return <InnerComponent>{children}</InnerComponent>
  }

  // Production loading - show children (assume signed out while loading)
  return <>{children}</>
}

interface UserButtonProps {
  afterSignOutUrl?: string
}

/**
 * UserButton - user avatar with sign-out menu
 * Preview: renders nothing
 */
export function UserButton({ afterSignOutUrl = '/' }: UserButtonProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [InnerComponent, setInnerComponent] = useState<React.ComponentType<{ afterSignOutUrl: string }> | null>(null)

  useEffect(() => {
    setMounted(true)
    
    // Only load the inner component on production
    if (isClerkAvailable && !isLoading) {
      import('./ClerkComponentsInner')
        .then(mod => setInnerComponent(() => mod.UserButtonInner))
        .catch(() => {})
    }
  }, [isClerkAvailable, isLoading])

  // SSR or initial mount
  if (!mounted || isLoading) return null
  
  // Preview mode: no user button
  if (!isClerkAvailable) return null

  // Production with component loaded
  if (InnerComponent) {
    return <InnerComponent afterSignOutUrl={afterSignOutUrl} />
  }

  // Production loading
  return null
}

/**
 * useSafeAuth - Preview-safe hook for auth state
 * Returns defaults in preview mode
 */
export function useSafeAuth() {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  
  return {
    isLoaded: !isLoading,
    isSignedIn: false,
    userId: null as string | null,
    signOut: async () => {},
    // Components should use SignedIn/SignedOut for rendering logic
  }
}

/**
 * useSafeUser - Preview-safe hook for user data
 * Returns null user in preview mode
 */
export function useSafeUser() {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  
  return {
    user: null as {
      id: string
      firstName?: string | null
      primaryEmailAddress?: { emailAddress: string } | null
      emailAddresses?: Array<{ emailAddress: string }>
      createdAt: number
      username?: string | null
    } | null,
    isLoaded: !isLoading,
    isSignedIn: false,
  }
}
