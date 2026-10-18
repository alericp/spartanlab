import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import { getPersonalRecordHistoryForUser, getPersonalRecordsByExercise } from '@/lib/history-service'
import type { PRType } from '@/types/history'
import { readOwnedAthleteResource } from '@/lib/server/athlete-ownership'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const requestedUserId = searchParams.get('userId')
  const exerciseKey = searchParams.get('exerciseKey')
  const limit = searchParams.get('limit')
  const prType = searchParams.get('prType')
  const { userId } = await getSession()

  try {
    const result = await readOwnedAthleteResource({
      authenticatedUserId: userId,
      requestedAthleteId: requestedUserId,
      missingIdError: 'userId is required',
      load: async (athleteId) => {
        if (exerciseKey) {
          const prs = await getPersonalRecordsByExercise(athleteId, exerciseKey, {
            limit: limit ? parseInt(limit) : undefined,
          })
          return { prs }
        }

        const prs = await getPersonalRecordHistoryForUser(athleteId, {
          limit: limit ? parseInt(limit) : 500,
          prType: prType ? (prType as PRType) : undefined,
        })
        return { prs }
      },
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('[API/history/prs] Error fetching PRs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PRs' },
      { status: 500 }
    )
  }
}
