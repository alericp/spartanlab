// Server-only auth service with Clerk integration
// Only import this in Server Components, Route Handlers, or Server Actions
import 'server-only'

import { isClerkConfigured } from './auth-environment'
import { mapClerkUserToUser } from './auth-service'
import type { User } from '@/types/domain'

// ============================================================================
// PREVIEW MODE USER
// ============================================================================

const PREVIEW_USER: User = {
  id: 'preview-user',
  email: 'preview@spartanlab.local',
  username: 'Aleric',
  subscriptionPlan: 'pro',
  createdAt: new Date().toISOString(),
}

// ============================================================================
// CLERK MODULE CACHE
// ============================================================================

let clerkModule: typeof import('@clerk/nextjs/server') | null = null

/**
 * Get Clerk server module (lazy loaded)
 */
async function getClerkServer() {
  if (clerkModule) return clerkModule
  
  // Check if Clerk is configured
  if (!isClerkConfigured()) {
    return null
  }
  
  try {
    clerkModule = await import('@clerk/nextjs/server')
    return clerkModule
  } catch (error) {
    console.warn('[auth-service-server] Clerk not available:', error)
    return null
  }
}

/**
 * Check if we're in preview mode (server-side)
 * Uses environment check since server can't check domain
 */
function isServerPreviewMode(): boolean {
  return !isClerkConfigured()
}

// ============================================================================
// SERVER AUTH FUNCTIONS
// ============================================================================

/**
 * Get current user from Clerk (server component only)
 */
export async function getCurrentUserServer(): Promise<User | null> {
  if (isServerPreviewMode()) {
    return PREVIEW_USER
  }

  try {
    const clerk = await getClerkServer()
    if (!clerk?.auth) return null

    const { userId } = await clerk.auth()
    if (!userId) return null

    // Try to get full user details
    if (clerk.currentUser) {
      const clerkUser = await clerk.currentUser()
      if (clerkUser) {
        return mapClerkUserToUser(clerkUser, 'free')
      }
    }

    return {
      id: userId,
      email: '',
      username: userId,
      subscriptionPlan: 'free',
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.warn('[auth-service-server] Failed to get user:', error)
    return null
  }
}

/**
 * Check if user is authenticated (server component only)
 */
export async function isAuthenticatedServer(): Promise<boolean> {
  if (isServerPreviewMode()) return true

  try {
    const clerk = await getClerkServer()
    if (!clerk?.auth) return false

    const { userId } = await clerk.auth()
    return Boolean(userId)
  } catch {
    return false
  }
}

/**
 * Get Clerk auth state (server component only)
 */
export async function getAuthState(): Promise<{ userId: string | null }> {
  if (isServerPreviewMode()) {
    return { userId: PREVIEW_USER.id }
  }

  try {
    const clerk = await getClerkServer()
    if (!clerk?.auth) return { userId: null }

    return await clerk.auth()
  } catch {
    return { userId: null }
  }
}

/**
 * Get current user ID (server component only)
 */
export async function getCurrentUserIdServer(): Promise<string | null> {
  const user = await getCurrentUserServer()
  return user?.id || null
}

/**
 * Alias for getCurrentUserServer
 */
export const getCurrentUser = getCurrentUserServer
