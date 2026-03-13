'use client'

/**
 * useClerkAuth - Preview-safe authentication hook
 * 
 * On preview: Returns default unauthenticated state
 * On production: Components should use SignedIn/SignedOut from ClerkComponents
 * 
 * IMPORTANT: This hook does NOT import @clerk/nextjs.
 * It provides a simple interface for checking auth availability.
 * For actual auth state on production, use the ClerkComponents (SignedIn, SignedOut).
 */

import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'
import type { User } from '@/types/domain'

// Default state for unauthenticated/preview users
const DEFAULT_AUTH_STATE = {
  user: null as User | null,
  isLoaded: true,
  isSignedIn: false,
  signOut: async () => {},
  clerkUser: null,
}

/**
 * Hook to get auth state info
 * 
 * NOTE: This hook returns minimal state. For rendering auth-dependent UI,
 * use the SignedIn and SignedOut components from ClerkComponents.
 */
export function useClerkAuth() {
  const { isClerkAvailable, isLoading } = useClerkAvailability()

  return {
    ...DEFAULT_AUTH_STATE,
    isLoaded: !isLoading,
    isClerkAvailable,
  }
}

/**
 * Get the current user's email
 * Returns null - use SignedIn component for actual user data
 */
export function useCurrentUserEmail(): string | null {
  // On production, user email comes from Clerk context in SignedIn components
  // This hook just returns null as a safe default
  return null
}

/**
 * Check if the current user is the platform owner
 * Returns false by default - actual check happens server-side or in protected components
 */
export function useIsOwner(): boolean {
  return false
}
