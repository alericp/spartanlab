import { NextRequest, NextResponse } from 'next/server'
import { 
  getWorkoutHistoryForUser, 
  getProgramHistoryForUser,
  getPersonalRecordHistoryForUser,
} from '@/lib/history-service'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    // Fetch all history data in parallel
    const [workoutHistory, programHistory, recentPRs] = await Promise.all([
      getWorkoutHistoryForUser(userId, { limit: 20, sortOrder: 'desc' }),
      getProgramHistoryForUser(userId, { limit: 10, sortOrder: 'desc' }),
      getPersonalRecordHistoryForUser(userId, { limit: 5, sortOrder: 'desc' }),
    ])

    // Get total PR count (could be optimized with a COUNT query)
    const allPRs = await getPersonalRecordHistoryForUser(userId, { limit: 1000 })

    return NextResponse.json({
      workoutHistory,
      programHistory,
      recentPRs,
      totalPRs: allPRs.length,
    })
  } catch (error) {
    console.error('[HistoryAPI] Error fetching history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
