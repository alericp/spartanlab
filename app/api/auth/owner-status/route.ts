import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import {
  clerkEmailsEligibleForOwnerMatch,
  getOwnerEmail,
  resolveOwnerEntitlement,
} from '@/lib/owner-access'

/**
 * GET /api/auth/owner-status
 *
 * Owner status for the signed-in Clerk user. The comparison uses the
 * server owner email and verified Clerk addresses. The response is only
 * a boolean.
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ isOwner: false })
    }
    const clerkUser = await currentUser()
    const decision = resolveOwnerEntitlement({
      authenticatedUserId: userId,
      configuredOwnerEmail: getOwnerEmail(),
      verifiedEmails: clerkEmailsEligibleForOwnerMatch(
        clerkUser?.primaryEmailAddressId,
        clerkUser?.emailAddresses,
      ),
    })
    return NextResponse.json({ isOwner: decision.isOwner })
  } catch {
    return NextResponse.json({ isOwner: false })
  }
}
