import { NextRequest, NextResponse } from 'next/server'
import { getWorkoutHistoryForUser } from '@/lib/history-service'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    const workouts = await getWorkoutHistoryForUser(userId, { 
      limit, 
      offset, 
      sortOrder: 'desc' 
    })

    return NextResponse.json({ workouts })
  } catch (error) {
    console.error('[WorkoutsAPI] Error fetching workouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    )
  }
}
