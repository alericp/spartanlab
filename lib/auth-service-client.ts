// Client-safe auth service - NO server imports
// For client components that need basic auth state

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
 * Get the current authenticated user (client-safe)
 * In preview mode: returns mock user
 * In production mode: returns preview user as fallback
 */
export function getCurrentUser(): User {
  if (isPreviewMode()) {
    return PREVIEW_USER
  }
  // Production mode: fall back to preview user if Clerk not fully integrated
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
 * In preview mode: always true (mock user)
 * In production mode: check for app data
 */
export function isAuthenticated(): boolean {
  if (isPreviewMode()) {
    return true
  }
  // Production mode: would check Clerk session via useAuth hook
  return true
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

/**
 * Stub for sign-out (will be implemented with Clerk on client)
 */
export function signOut(): void {
  if (isPreviewMode()) {
    console.log('[SpartanLab] Sign out called in preview mode')
    return
  }
}
