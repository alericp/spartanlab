import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import { recalculateAthleteReadiness } from '@/lib/readiness-calculation-service'
import { decideRequestedAthleteAccess } from '@/lib/server/athlete-ownership'

/**
 * POST /api/readiness/recalculate
 *
 * Recalculate readiness for the authenticated athlete only.
 * Body athleteId must match the Clerk user id.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await getSession()
    const body = await request.json().catch(() => ({}))
    const athleteId = typeof body?.athleteId === 'string' ? body.athleteId : null
    const decision = decideRequestedAthleteAccess(
      userId,
      athleteId,
      'athleteId is required',
    )

    if (!decision.allowed) {
      return NextResponse.json({ error: decision.error }, { status: decision.status })
    }

    recalculateAthleteReadiness(decision.athleteId).catch((error) => {
      console.error('[API] Readiness recalc error:', error)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Readiness recalc error:', error)
    return NextResponse.json(
      { error: 'Failed to trigger readiness recalculation' },
      { status: 500 }
    )
  }
}
