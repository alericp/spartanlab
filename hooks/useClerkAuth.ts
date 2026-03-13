'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import type { User, SubscriptionPlan } from '@/types/domain'

/**
 * Hook to get the current authenticated user from Clerk
 * ClerkProvider is in the root layout, so these hooks work everywhere
 * 
 * IMPORTANT: All hooks are called unconditionally to follow React rules of hooks.
 * Error handling is done via Clerk's isLoaded state, not try/catch.
 */
export function useClerkAuth() {
  // Call hooks unconditionally at top level - React rules of hooks
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn: userSignedIn } = useUser()
  const { signOut } = useAuth()
  
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
    username: clerkUser.username || clerkUser.firstName || clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Athlete',
    subscriptionPlan: 'free' as SubscriptionPlan, // Default to free, will be updated from database
    createdAt: new Date(clerkUser.createdAt).toISOString(),
  } : null
  
  return {
    user,
    isLoaded: isUserLoaded,
    isSignedIn: userSignedIn || false,
    signOut,
    clerkUser,
  }
}

/**
 * Get the current user's email from Clerk
 */
export function useCurrentUserEmail(): string | null {
  // Call hooks unconditionally at top level - React rules of hooks
  const { user: clerkUser, isLoaded } = useUser()
  
  if (!isLoaded || !clerkUser) {
    return null
  }
  
  return clerkUser.emailAddresses?.[0]?.emailAddress || null
}

/**
 * Check if the current user is the platform owner
 */
export function useIsOwner(): boolean {
  const email = useCurrentUserEmail()
  
  // Compare Clerk email with OWNER_EMAIL env var
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL
  if (!ownerEmail || !email) {
    return false
  }
  
  return ownerEmail.toLowerCase() === email.toLowerCase()
}
