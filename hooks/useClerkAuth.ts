'use client'

import { useSafeAuth, useSafeUser } from '@/components/auth/ClerkComponents'
import type { User, SubscriptionPlan } from '@/types/domain'

/**
 * Hook to get the current authenticated user
 * Uses safe wrappers that handle preview mode gracefully
 * 
 * IMPORTANT: This hook returns default values when Clerk isn't available
 * in preview mode, preventing crashes and allowing the app to function.
 */
export function useClerkAuth() {
  const { isLoaded: isAuthLoaded, isSignedIn, signOut } = useSafeAuth()
  const { user: clerkUser, isLoaded: isUserLoaded } = useSafeUser()
  
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
    username: clerkUser.username || clerkUser.firstName || clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Athlete',
    subscriptionPlan: 'free' as SubscriptionPlan, // Default to free, will be updated from database
    createdAt: new Date(clerkUser.createdAt).toISOString(),
  } : null
  
  return {
    user,
    isLoaded: isAuthLoaded && isUserLoaded,
    isSignedIn: isSignedIn || false,
    signOut,
    clerkUser,
  }
}

/**
 * Get the current user's email
 * Returns null in preview mode
 */
export function useCurrentUserEmail(): string | null {
  const { user: clerkUser, isLoaded } = useSafeUser()
  
  if (!isLoaded || !clerkUser) {
    return null
  }
  
  return clerkUser.emailAddresses?.[0]?.emailAddress || null
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
