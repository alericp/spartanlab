'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import type { User, SubscriptionPlan } from '@/types/domain'

/**
 * Hook to get the current authenticated user from Clerk
 * ClerkProvider is in the root layout, so these hooks work everywhere
 */
export function useClerkAuth() {
  let clerkUser = null
  let isUserLoaded = false
  let isSignedIn = false
  let signOutFn = async () => {}
  
  // Wrap Clerk hooks in try-catch to handle domain mismatch errors
  try {
    const userResult = useUser()
    const authResult = useAuth()
    clerkUser = userResult.user
    isUserLoaded = userResult.isLoaded
    isSignedIn = userResult.isSignedIn || false
    signOutFn = authResult.signOut
  } catch {
    // Clerk failed to initialize - treat as not signed in
    isUserLoaded = true
    isSignedIn = false
  }
  
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
    isSignedIn: isSignedIn,
    signOut: signOutFn,
    clerkUser,
  }
}

/**
 * Get the current user's email from Clerk
 */
export function useCurrentUserEmail(): string | null {
  try {
    const { user: clerkUser, isLoaded } = useUser()
    
    if (!isLoaded || !clerkUser) {
      return null
    }
    
    return clerkUser.emailAddresses?.[0]?.emailAddress || null
  } catch {
    // Clerk failed to initialize
    return null
  }
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
