import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import {
  getWorkoutHistoryForUser,
  getProgramHistoryForUser,
  getPersonalRecordHistoryForUser,
  getTotalPRCount,
} from '@/lib/history-service'
import { readOwnedAthleteResource } from '@/lib/server/athlete-ownership'

export async function GET(request: NextRequest) {
  const requestedUserId = request.nextUrl.searchParams.get('userId')
  const { userId } = await getSession()

  try {
    const result = await readOwnedAthleteResource({
      authenticatedUserId: userId,
      requestedAthleteId: requestedUserId,
      missingIdError: 'User ID required',
      load: async (athleteId) => {
        const [workoutHistory, programHistory, recentPRs, totalPRs] = await Promise.all([
          getWorkoutHistoryForUser(athleteId, { limit: 20, sortOrder: 'desc' }),
          getProgramHistoryForUser(athleteId, { limit: 10, sortOrder: 'desc' }),
          getPersonalRecordHistoryForUser(athleteId, { limit: 5, sortOrder: 'desc' }),
          getTotalPRCount(athleteId),
        ])
        return { workoutHistory, programHistory, recentPRs, totalPRs }
      },
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('[HistoryAPI] Error fetching history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
