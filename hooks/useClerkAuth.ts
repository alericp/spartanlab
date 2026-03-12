'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { isPreviewMode } from '@/lib/app-mode'
import type { User, SubscriptionPlan } from '@/types/domain'

// Preview mode mock user
const PREVIEW_USER: User = {
  id: 'preview-user',
  email: 'preview@spartanlab.local',
  username: 'Aleric',
  subscriptionPlan: 'pro',
  createdAt: new Date().toISOString(),
}

/**
 * Hook to get the current authenticated user from Clerk
 * Falls back to preview user in preview mode
 */
export function useClerkAuth() {
  // Always call hooks unconditionally
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn } = useUser()
  const { signOut } = useAuth()
  
  // Preview mode: return mock data
  if (isPreviewMode()) {
    return {
      user: PREVIEW_USER,
      isLoaded: true,
      isSignedIn: true,
      signOut: () => console.log('[SpartanLab] Sign out called in preview mode'),
      clerkUser: null,
    }
  }
  
  // Production mode: use Clerk
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
    username: clerkUser.username || clerkUser.firstName || clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Athlete',
    subscriptionPlan: 'free' as SubscriptionPlan, // Default to free, will be updated from database
    createdAt: new Date(clerkUser.createdAt).toISOString(),
  } : null
  
  return {
    user: user || PREVIEW_USER,
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
  
  if (isPreviewMode()) {
    return PREVIEW_USER.email
  }
  
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
  
  if (isPreviewMode()) {
    // In preview mode, check localStorage for owner email match
    if (typeof window !== 'undefined') {
      const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || localStorage.getItem('spartanlab_owner_email')
      const currentEmail = localStorage.getItem('spartanlab_current_user_email') || PREVIEW_USER.email
      if (ownerEmail && currentEmail) {
        return ownerEmail.toLowerCase() === currentEmail.toLowerCase()
      }
    }
    return true // Default to owner in preview for testing
  }
  
  // Production mode: compare Clerk email with OWNER_EMAIL env var
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL
  if (!ownerEmail || !email) {
    return false
  }
  
  return ownerEmail.toLowerCase() === email.toLowerCase()
}
