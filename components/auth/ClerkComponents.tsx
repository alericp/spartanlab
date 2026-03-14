'use client'

/**
 * ClerkComponents - Auth component wrappers using single provider source
 * 
 * ARCHITECTURE:
 * - Preview mode: Static behavior, no Clerk components
 * - Production mode: Uses Clerk components from ClerkProviderWrapper context
 * 
 * CRITICAL: These components do NOT import @clerk/nextjs directly.
 * All Clerk components come from the provider context to ensure single boot path.
 */

import { ReactNode } from 'react'
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
// SIGNEDIN COMPONENT
// ============================================================================

/**
 * SignedIn - Renders children only when user is signed in
 * 
 * Preview: Renders nothing (no auth state available)
 * Production: Uses real Clerk SignedIn from provider context
 */
export function SignedIn({ children }: AuthComponentProps) {
  const { isClerkAvailable, isLoading, components } = useClerkAvailability()

  // Preview or loading: render nothing
  if (isLoading || !isClerkAvailable) return null
  
  // No component available
  const Comp = components.SignedIn
  if (!Comp) return null
  
  return <Comp>{children}</Comp>
}

// ============================================================================
// SIGNEDOUT COMPONENT
// ============================================================================

/**
 * SignedOut - Renders children when user is NOT signed in
 * 
 * Preview: Always renders children (no auth = signed out)
 * Production: Uses real Clerk SignedOut from provider context
 * 
 * CRITICAL: During loading, render nothing to prevent auth state mismatch
 * where SignedOut shows content while SignedIn returns null.
 */
export function SignedOut({ children }: AuthComponentProps) {
  const { isClerkAvailable, isLoading, components } = useClerkAvailability()

  // CRITICAL: During loading, render nothing to prevent "Sign In" flash
  // This must be checked FIRST before checking isClerkAvailable
  if (isLoading) return null
  
  // Preview mode (auth resolved, Clerk not available): show children
  if (!isClerkAvailable) return <>{children}</>
  
  // No component available: show children
  const Comp = components.SignedOut
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
 * Production: Uses real Clerk UserButton from provider context
 */
export function UserButton({ afterSignOutUrl = '/' }: UserButtonProps) {
  const { isClerkAvailable, isLoading, components } = useClerkAvailability()

  // Preview or loading: render nothing
  if (isLoading || !isClerkAvailable) return null

  // No component available
  const Comp = components.UserButton
  if (!Comp) return null

  return <Comp afterSignOutUrl={afterSignOutUrl} />
}
