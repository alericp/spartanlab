// Client-safe auth service - NO server imports
// For client components that need basic auth state
// For full Clerk integration, use the useClerkAuth hook

import { isPreviewMode, isAuthEnabled } from './app-mode'
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
 * Get the current authenticated user (client-safe fallback)
 * 
 * NOTE: In production with Clerk, use the useClerkAuth() hook instead.
 * This function returns the preview user for compatibility.
 */
export function getCurrentUser(): User {
  if (isPreviewMode()) {
    return PREVIEW_USER
  }
  // Production mode: return preview user as fallback
  // Real user data comes from useClerkAuth() hook
  return PREVIEW_USER
}

/**
 * Get the current user ID
 */
export function getCurrentUserId(): string {
  return getCurrentUser().id
}

/**
 * Check if user is authenticated (client-safe)
 * 
 * NOTE: In production with Clerk, use SignedIn/SignedOut components
 * or the useClerkAuth() hook instead.
 */
export function isAuthenticated(): boolean {
  if (isPreviewMode()) {
    return true
  }
  // Production mode: this is a fallback
  // Real auth state comes from Clerk's useAuth() hook
  return false
}

/**
 * Get user's subscription plan
 */
export function getUserPlan(): SubscriptionPlan {
  return getCurrentUser().subscriptionPlan
}

/**
 * Check if auth services are fully configured
 */
export function isAuthConfigured(): boolean {
  return isAuthEnabled()
}

/**
 * Map Clerk user to our User type (utility, no imports needed)
 */
export function mapClerkUserToUser(
  clerkUser: {
    id: string
    emailAddresses: { emailAddress: string }[]
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    createdAt: number
  },
  subscriptionPlan: SubscriptionPlan = 'free'
): User {
  const email = clerkUser.emailAddresses?.[0]?.emailAddress || ''
  const username =
    clerkUser.username || clerkUser.firstName || email.split('@')[0] || 'Athlete'

  return {
    id: clerkUser.id,
    email,
    username,
    subscriptionPlan,
    createdAt: new Date(clerkUser.createdAt).toISOString(),
  }
}
