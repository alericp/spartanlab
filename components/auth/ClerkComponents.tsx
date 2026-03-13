'use client'

/**
 * ClerkComponents - Production-safe auth component wrappers
 * 
 * SIMPLIFIED ARCHITECTURE:
 * - Preview mode: Static behavior, zero Clerk code
 * - Production mode: Real Clerk components via safe dynamic import
 * 
 * These components ONLY handle rendering logic.
 * CRITICAL: Uses safe dynamic import to prevent production crashes
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
// SAFE CLERK MODULE LOADER
// ============================================================================

let clerkModuleCache: Promise<typeof import('@clerk/nextjs') | null> | null = null

/**
 * Safely load Clerk module with error handling
 */
async function getClerkModule(): Promise<typeof import('@clerk/nextjs') | null> {
  if (clerkModuleCache) {
    return clerkModuleCache
  }

  clerkModuleCache = (async () => {
    try {
      // Direct dynamic import - safe for production
      const mod = await import('@clerk/nextjs')
      return mod
    } catch (error) {
      console.error('[ClerkComponents] Failed to load Clerk:', error)
      return null
    }
  })()

  return clerkModuleCache
}

// ============================================================================
// SIGNEDIN COMPONENT
// ============================================================================

/**
 * SignedIn - Renders children only when user is signed in
 * 
 * Preview: Renders nothing (no auth state available)
 * Production: Uses real Clerk SignedIn
 */
export function SignedIn({ children }: AuthComponentProps) {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [Comp, setComp] = useState<React.ComponentType<{ children: ReactNode }> | null>(null)

  useEffect(() => {
    if (isLoading || !isClerkAvailable) return
    
    getClerkModule()
      .then(mod => {
        if (mod?.SignedIn) {
          setComp(() => mod.SignedIn)
        }
      })
      .catch(() => {
        // Silently fail - component will stay null and render nothing
      })
  }, [isLoading, isClerkAvailable])

  // Preview or loading: render nothing
  if (!isClerkAvailable || !Comp) return null
  
  return <Comp>{children}</Comp>
}

// ============================================================================
// SIGNEDOUT COMPONENT
// ============================================================================

/**
 * SignedOut - Renders children when user is NOT signed in
 * 
 * Preview: Always renders children (no auth = signed out)
 * Production: Uses real Clerk SignedOut
 */
export function SignedOut({ children }: AuthComponentProps) {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [Comp, setComp] = useState<React.ComponentType<{ children: ReactNode }> | null>(null)

  useEffect(() => {
    if (isLoading || !isClerkAvailable) return
    
    getClerkModule()
      .then(mod => {
        if (mod?.SignedOut) {
          setComp(() => mod.SignedOut)
        }
      })
      .catch(() => {
        // Silently fail - will show children as fallback
      })
  }, [isLoading, isClerkAvailable])

  // Preview: always show children
  if (!isClerkAvailable) return <>{children}</>
  
  // Loading or component not ready: show children (optimistic)
  if (!Comp) return <>{children}</>
  
  return <Comp>{children}</Comp>
}

// ============================================================================
// USERBUTTON COMPONENT
// ============================================================================

/**
 * UserButton - User avatar with sign-out menu
 * 
 * Preview: Renders nothing
 * Production: Uses real Clerk UserButton
 */
export function UserButton({ afterSignOutUrl = '/' }: UserButtonProps) {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [Comp, setComp] = useState<React.ComponentType<{ afterSignOutUrl?: string }> | null>(null)

  useEffect(() => {
    if (isLoading || !isClerkAvailable) return
    
    getClerkModule()
      .then(mod => {
        if (mod?.UserButton) {
          setComp(() => mod.UserButton)
        }
      })
      .catch(() => {
        // Silently fail - component will stay null and render nothing
      })
  }, [isLoading, isClerkAvailable])

  // Preview or not loaded: nothing
  if (!isClerkAvailable || !Comp) return null

  return <Comp afterSignOutUrl={afterSignOutUrl} />
}
