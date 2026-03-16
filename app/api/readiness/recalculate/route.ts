import { NextRequest, NextResponse } from 'next/server'
import { recalculateAthleteReadiness } from '@/lib/readiness-calculation-service'

/**
 * POST /api/readiness/recalculate
 *
 * Trigger readiness recalculation for an athlete
 * Called after workout logged, profile update, or strength benchmark change
 *
 * Body:
 * - athleteId: the athlete's ID
 */
export async function POST(request: NextRequest) {
  try {
    const { athleteId } = await request.json()

    if (!athleteId) {
      return NextResponse.json(
        { error: 'athleteId is required' },
        { status: 400 }
      )
    }

    // Trigger recalculation asynchronously
    // Don't await - this is fire-and-forget to keep response fast
    recalculateAthleteReadiness(athleteId).catch((error) => {
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
