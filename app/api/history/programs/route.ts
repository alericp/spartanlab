import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import { getProgramHistoryForUser } from '@/lib/history-service'
import { readOwnedAthleteResource } from '@/lib/server/athlete-ownership'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const requestedUserId = searchParams.get('userId')
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const { userId } = await getSession()

  try {
    const result = await readOwnedAthleteResource({
      authenticatedUserId: userId,
      requestedAthleteId: requestedUserId,
      missingIdError: 'User ID required',
      load: async (athleteId) => {
        const programs = await getProgramHistoryForUser(athleteId, {
          limit,
          offset,
          sortOrder: 'desc',
        })
        return { programs }
      },
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('[ProgramsAPI] Error fetching programs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    )
  }
}
