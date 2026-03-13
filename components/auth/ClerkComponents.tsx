'use client'

/**
 * ClerkComponents - Minimal auth component wrappers
 * 
 * SIMPLIFIED ARCHITECTURE:
 * - Preview mode: Static behavior, zero Clerk code
 * - Production mode: Real Clerk components via context
 * 
 * These components ONLY handle rendering logic.
 * Runtime loading happens in ClerkProviderWrapper.
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
// RUNTIME LOADER (single shared implementation)
// ============================================================================

let clerkModulePromise: Promise<typeof import('@clerk/nextjs')> | null = null

function getClerkModule(): Promise<typeof import('@clerk/nextjs')> {
  if (!clerkModulePromise) {
    const moduleName = ['@', 'clerk', '/', 'nextjs'].join('')
    const loader = new Function('m', 'return import(m)')
    clerkModulePromise = loader(moduleName)
  }
  return clerkModulePromise
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
      .then(mod => setComp(() => mod.SignedIn))
      .catch(() => {})
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
      .then(mod => setComp(() => mod.SignedOut))
      .catch(() => {})
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
      .then(mod => setComp(() => mod.UserButton))
      .catch(() => {})
  }, [isLoading, isClerkAvailable])

  // Preview or not loaded: nothing
  if (!isClerkAvailable || !Comp) return null

  return <Comp afterSignOutUrl={afterSignOutUrl} />
}
