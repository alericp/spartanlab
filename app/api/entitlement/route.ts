/**
 * GET /api/entitlement
 * 
 * Canonical entitlement endpoint - single source of truth for subscription status.
 * 
 * This endpoint:
 * 1. Reads subscription status from DATABASE (not localStorage)
 * 2. Applies owner override if applicable
 * 3. Returns normalized entitlement object for client hydration
 * 
 * All client-side subscription state should be derived from this endpoint.
 */

import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserSubscription } from '@/lib/subscription-service'
import { checkOwnerByEmail } from '@/lib/owner-access'

export interface EntitlementResponse {
  isSignedIn: boolean
  plan: 'free' | 'pro'
  isPro: boolean
  isTrialing: boolean
  isOwner: boolean
  hasProAccess: boolean
  accessSource: 'database' | 'owner' | 'unauthenticated'
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = await auth()
    
    // Not signed in
    if (!userId) {
      return NextResponse.json<EntitlementResponse>({
        isSignedIn: false,
        plan: 'free',
        isPro: false,
        isTrialing: false,
        isOwner: false,
        hasProAccess: false,
        accessSource: 'unauthenticated',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      })
    }

    // Get user email for owner check
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || null
    const isOwner = email ? checkOwnerByEmail(email) : false

    // Get subscription from database (canonical source)
    const subscription = await getUserSubscription(userId)
    
    // Determine if user has Pro access
    // Pro access = (plan === 'pro') OR (isOwner)
    const isPro = subscription.plan === 'pro'
    const isTrialing = subscription.status === 'trialing'
    const hasProAccess = isPro || isOwner

    return NextResponse.json<EntitlementResponse>({
      isSignedIn: true,
      plan: subscription.plan,
      isPro,
      isTrialing,
      isOwner,
      hasProAccess,
      accessSource: isOwner ? 'owner' : 'database',
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    })

  } catch (error) {
    console.error('[Entitlement API] Error:', error)
    // Fail closed - return free tier on error
    return NextResponse.json<EntitlementResponse>({
      isSignedIn: false,
      plan: 'free',
      isPro: false,
      isTrialing: false,
      isOwner: false,
      hasProAccess: false,
      accessSource: 'unauthenticated',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    }, { status: 500 })
  }
}
