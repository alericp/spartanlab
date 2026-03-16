import { NextRequest, NextResponse } from 'next/server'
import { getAthleteSkillReadiness } from '@/lib/readiness-service'

/**
 * GET /api/readiness
 *
 * Fetch skill readiness data for an athlete
 *
 * Query params:
 * - athleteId: the athlete's ID
 */
export async function GET(request: NextRequest) {
  try {
    const athleteId = request.nextUrl.searchParams.get('athleteId')

    if (!athleteId) {
      return NextResponse.json(
        { error: 'athleteId is required' },
        { status: 400 }
      )
    }

    const readiness = await getAthleteSkillReadiness(athleteId)
    return NextResponse.json(readiness)
  } catch (error) {
    console.error('[API] Readiness error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch readiness data' },
      { status: 500 }
    )
  }
}
