'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import type { User, SubscriptionPlan } from '@/types/domain'

/**
 * Hook to get the current authenticated user from Clerk
 * ClerkProvider is in the root layout, so these hooks work everywhere
 */
export function useClerkAuth() {
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn } = useUser()
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
    isSignedIn: isSignedIn || false,
    signOut,
    clerkUser,
  }
}

/**
 * Get the current user's email from Clerk
 */
export function useCurrentUserEmail(): string | null {
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
