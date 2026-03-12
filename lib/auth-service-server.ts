// Server-only auth service with Clerk integration
// Only import this in Server Components, Route Handlers, or Server Actions
import 'server-only'

import { isPreviewMode, isAuthEnabled } from './app-mode'
import { mapClerkUserToUser } from './auth-service'
import type { User, SubscriptionPlan } from '@/types/domain'

// Preview mode mock user
const PREVIEW_USER: User = {
  id: 'preview-user',
  email: 'preview@spartanlab.local',
  username: 'Aleric',
  subscriptionPlan: 'pro',
  createdAt: new Date().toISOString(),
}

// Cache for Clerk module
let clerkModule: typeof import('@clerk/nextjs/server') | null = null

/**
 * Get Clerk module (lazy loaded)
 */
async function getClerk() {
  if (clerkModule) return clerkModule
  
  if (isPreviewMode() || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return null
  }
  
  try {
    clerkModule = await import('@clerk/nextjs/server')
    return clerkModule
  } catch (error) {
    console.warn('[SpartanLab Auth Server] Clerk not available:', error)
    return null
  }
}

/**
 * Get current user from Clerk (server component only)
 */
export async function getCurrentUserServer(): Promise<User | null> {
  if (isPreviewMode()) {
    return PREVIEW_USER
  }

  try {
    const clerk = await getClerk()
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
    console.warn('[SpartanLab Auth Server] Failed to get user:', error)
    return null
  }
}

/**
 * Check if user is authenticated (server component only)
 */
export async function isAuthenticatedServer(): Promise<boolean> {
  if (isPreviewMode()) return true

  try {
    const clerk = await getClerk()
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
  if (isPreviewMode()) {
    return { userId: PREVIEW_USER.id }
  }

  try {
    const clerk = await getClerk()
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
