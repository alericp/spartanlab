// Auth service - universal utilities (no server imports)
// NOTE: For actual Clerk user data, use @clerk/nextjs hooks in client components
// or auth-service-server.ts in server components

import type { User, SubscriptionPlan } from '@/types/domain'

/**
 * Map Clerk user to our User type
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
