import { NextRequest, NextResponse } from 'next/server'
import { 
  getWorkoutHistoryForUser, 
  getProgramHistoryForUser,
  getPersonalRecordHistoryForUser,
  getTotalPRCount,
} from '@/lib/history-service'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    // Fetch all history data in parallel with optimized count query
    const [workoutHistory, programHistory, recentPRs, totalPRs] = await Promise.all([
      getWorkoutHistoryForUser(userId, { limit: 20, sortOrder: 'desc' }),
      getProgramHistoryForUser(userId, { limit: 10, sortOrder: 'desc' }),
      getPersonalRecordHistoryForUser(userId, { limit: 5, sortOrder: 'desc' }),
      getTotalPRCount(userId),
    ])

    return NextResponse.json({
      workoutHistory,
      programHistory,
      recentPRs,
      totalPRs,
    })
  } catch (error) {
    console.error('[HistoryAPI] Error fetching history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
