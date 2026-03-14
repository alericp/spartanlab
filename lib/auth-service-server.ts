// Server-only auth service using native Clerk
// Only import this in Server Components, Route Handlers, or Server Actions
import 'server-only'

import { auth, currentUser } from '@clerk/nextjs/server'
import type { User, SubscriptionPlan } from '@/types/domain'

// ============================================================================
// USER MAPPING
// ============================================================================

/**
 * Map Clerk user to our User type
 */
function mapClerkUserToUser(
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

// ============================================================================
// SERVER AUTH FUNCTIONS
// ============================================================================

/**
 * Get current user from Clerk (server component only)
 */
export async function getCurrentUserServer(): Promise<User | null> {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) return null
    return mapClerkUserToUser(clerkUser, 'free')
  } catch (error) {
    console.warn('[auth-service-server] Failed to get user:', error)
    return null
  }
}

/**
 * Check if user is authenticated (server component only)
 */
export async function isAuthenticatedServer(): Promise<boolean> {
  try {
    const { userId } = await auth()
    return Boolean(userId)
  } catch {
    return false
  }
}

/**
 * Get Clerk auth state (server component only)
 */
export async function getAuthState(): Promise<{ userId: string | null }> {
  try {
    return await auth()
  } catch {
    return { userId: null }
  }
}

/**
 * Get current user ID (server component only)
 */
export async function getCurrentUserIdServer(): Promise<string | null> {
  try {
    const { userId } = await auth()
    return userId
  } catch {
    return null
  }
}

/**
 * Alias for getCurrentUserServer
 */
export const getCurrentUser = getCurrentUserServer
