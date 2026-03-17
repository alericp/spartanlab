/**
 * Server-Side Pro Access Enforcement
 * 
 * Provides backend enforcement for Pro-only features.
 * This is the server-side gate that CANNOT be bypassed by client manipulation.
 * 
 * Access is granted if ANY of these are true:
 * 1. User has an active Pro subscription (subscription_plan = 'pro')
 * 2. User is on an active trial (trialing status)
 * 3. User is the platform owner (OWNER_EMAIL match)
 * 
 * IMPORTANT: 
 * - This is server-only and reads from the DATABASE, not localStorage.
 * - Owner simulation mode (for testing) is CLIENT-ONLY and does NOT affect server checks.
 * - Server always enforces real database subscription status.
 */

import 'server-only'

import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserSubscription } from '@/lib/subscription-service'
import { checkOwnerByEmail, getOwnerEmail } from '@/lib/owner-access'

export interface ProAccessResult {
  hasAccess: boolean
  reason: 'pro' | 'trial' | 'owner' | 'free' | 'unauthenticated' | 'error'
  userId: string | null
  email: string | null
}

/**
 * Check if the current user has Pro access (server-side)
 * 
 * This function:
 * 1. Verifies authentication via Clerk
 * 2. Checks if user is the platform owner (bypasses subscription check)
 * 3. Queries the database for subscription status
 * 4. Returns access decision
 * 
 * Safe to call - returns false on any error (fail-secure)
 */
export async function checkProAccess(): Promise<ProAccessResult> {
  try {
    // 1. Check authentication
    const { userId } = await auth()
    
    if (!userId) {
      return {
        hasAccess: false,
        reason: 'unauthenticated',
        userId: null,
        email: null,
      }
    }

    // 2. Get user email for owner check
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || null

    // 3. Check owner bypass FIRST (owner always has access)
    if (email && checkOwnerByEmail(email)) {
      return {
        hasAccess: true,
        reason: 'owner',
        userId,
        email,
      }
    }

    // 4. Check database subscription status
    const subscription = await getUserSubscription(userId)

    // Pro plan with active status
    if (subscription.plan === 'pro') {
      // Check if it's a trial or active subscription
      // Note: getUserSubscription returns 'active' if there's a stripe_subscription_id
      // Trials are still considered active in our system
      return {
        hasAccess: true,
        reason: subscription.status === 'trialing' ? 'trial' : 'pro',
        userId,
        email,
      }
    }

    // Free user - no access
    return {
      hasAccess: false,
      reason: 'free',
      userId,
      email,
    }

  } catch (error) {
    console.error('[requirePro] Error checking access:', error)
    // Fail secure - deny access on error
    return {
      hasAccess: false,
      reason: 'error',
      userId: null,
      email: null,
    }
  }
}

/**
 * Simple boolean check for Pro access
 * Use this when you just need a yes/no answer
 */
export async function hasServerProAccess(): Promise<boolean> {
  const result = await checkProAccess()
  return result.hasAccess
}

/**
 * Get a JSON response for denied Pro access
 * Use this in API routes to return consistent 403 responses
 */
export function proAccessDeniedResponse() {
  return Response.json(
    { 
      error: 'Pro subscription required',
      code: 'PRO_REQUIRED',
      upgrade: '/upgrade'
    },
    { status: 403 }
  )
}

/**
 * Middleware-style function for protecting routes
 * Returns null if access is granted, or an error Response if denied
 * 
 * Usage in API route:
 * ```
 * const denied = await requireProAccess()
 * if (denied) return denied
 * // ... continue with Pro-only logic
 * ```
 */
export async function requireProAccess(): Promise<Response | null> {
  const result = await checkProAccess()
  
  if (!result.hasAccess) {
    if (result.reason === 'unauthenticated') {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.log(`[requirePro] Access denied: user=${result.userId}, reason=${result.reason}`)
    return proAccessDeniedResponse()
  }
  
  // Access granted
  return null
}
