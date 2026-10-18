/**
 * GET /api/audit/doctrine-corridor
 *
 * Phase 1 read-only audit endpoint that walks the doctrine truth corridor
 * (source-batches → runtime contract → builder → final program → Program page)
 * and returns a machine-readable PASS/FAIL map.
 *
 * This route is diagnostic only:
 * - Does not change generation behavior.
 * - Does not write to the doctrine DB.
 * - Requires the platform owner. A signed-in non-owner is denied.
 * - Does not accept an athlete id and does not return another athlete's records.
 *
 * /api/audit/doctrine-db uses the same owner gate.
 */

import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getSession } from '@/lib/auth-service-server'
import { buildDoctrineCorridorReport } from '@/lib/doctrine/doctrine-corridor-audit'
import { checkOwnerByEmail, getOwnerEmail, matchingOwnerEmail } from '@/lib/owner-access'
import { decideOwnerAccess } from '@/lib/server/athlete-ownership'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await getSession()
  const clerkUser = await currentUser()
  const access = decideOwnerAccess(
    userId,
    matchingOwnerEmail(
      getOwnerEmail(),
      clerkUser?.primaryEmailAddressId,
      clerkUser?.emailAddresses,
    ),
    checkOwnerByEmail,
  )
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  try {
    const report = await buildDoctrineCorridorReport()
    return NextResponse.json(report)
  } catch (error) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        phase: 'doctrine_corridor_audit_phase1',
        verdict: 'BLOCKED',
        blocker: error instanceof Error ? error.message : 'unknown_audit_error',
      },
      { status: 500 },
    )
  }
}
