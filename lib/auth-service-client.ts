// Client-safe auth utilities
// For Clerk auth state, use useAuth/useUser from @clerk/nextjs directly

import type { User, SubscriptionPlan } from '@/types/domain'

/**
 * Map Clerk user to our User type (utility, no Clerk imports needed)
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
