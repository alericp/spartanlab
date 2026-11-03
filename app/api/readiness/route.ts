import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import { getAthleteSkillReadiness } from '@/lib/readiness-service'
import { readOwnedAthleteResource } from '@/lib/server/athlete-ownership'

/**
 * GET /api/readiness
 *
 * Fetch skill readiness for the authenticated athlete.
 * athleteId must match the Clerk user id.
 */
export async function GET(request: NextRequest) {
  const requestedAthleteId = request.nextUrl.searchParams.get('athleteId')
  const { userId } = await getSession()

  try {
    const result = await readOwnedAthleteResource({
      authenticatedUserId: userId,
      requestedAthleteId,
      missingIdError: 'athleteId is required',
      load: (athleteId) => getAthleteSkillReadiness(athleteId),
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('[API] Readiness error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch readiness data' },
      { status: 500 }
    )
  }
}
