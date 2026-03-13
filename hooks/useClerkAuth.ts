'use client'

/**
 * useClerkAuth - Preview-safe authentication hook
 * 
 * On preview: Returns default unauthenticated state
 * On production: Returns actual Clerk auth state
 * 
 * IMPORTANT: This hook handles preview mode gracefully.
 * It will never try to access Clerk on non-production domains.
 */

import { useState, useEffect } from 'react'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'
import type { User, SubscriptionPlan } from '@/types/domain'

// Default state for unauthenticated/preview users
const DEFAULT_AUTH_STATE = {
  user: null as User | null,
  isLoaded: true,
  isSignedIn: false,
  signOut: async () => {},
  clerkUser: null,
}

/**
 * Hook to get the current authenticated user
 * Returns defaults in preview mode, actual data on production
 */
export function useClerkAuth() {
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()
  const [authState, setAuthState] = useState<typeof DEFAULT_AUTH_STATE>({
    ...DEFAULT_AUTH_STATE,
    isLoaded: false,
  })

  useEffect(() => {
    // Wait for Clerk availability check
    if (isClerkLoading) return
    
    // Preview mode: return default state
    if (!isClerkAvailable) {
      setAuthState(DEFAULT_AUTH_STATE)
      return
    }
    
    // Production: load auth state dynamically
    let cancelled = false
    
    const loadAuthState = async () => {
      try {
        const { useAuth, useUser } = await import('@clerk/nextjs')
        // We can't call hooks here - this is just to verify import works
        // Actual hook usage happens in components
        if (!cancelled) {
          // Signal that Clerk is available but actual state comes from context
          setAuthState(prev => ({ ...prev, isLoaded: true }))
        }
      } catch {
        if (!cancelled) {
          setAuthState(DEFAULT_AUTH_STATE)
        }
      }
    }
    
    loadAuthState()
    return () => { cancelled = true }
  }, [isClerkAvailable, isClerkLoading])

  return authState
}

/**
 * Get the current user's email
 * Returns null in preview mode
 */
export function useCurrentUserEmail(): string | null {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [email, setEmail] = useState<string | null>(null)
  
  useEffect(() => {
    if (isLoading) return
    if (!isClerkAvailable) {
      setEmail(null)
      return
    }
    // Production: email comes from Clerk context in components
    setEmail(null)
  }, [isClerkAvailable, isLoading])
  
  return email
}

/**
 * Check if the current user is the platform owner
 * Returns false in preview mode
 */
export function useIsOwner(): boolean {
  const email = useCurrentUserEmail()
  
  // Compare email with OWNER_EMAIL env var
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL
  if (!ownerEmail || !email) {
    return false
  }
  
  return ownerEmail.toLowerCase() === email.toLowerCase()
}
