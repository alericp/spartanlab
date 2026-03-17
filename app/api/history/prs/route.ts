import { NextRequest, NextResponse } from 'next/server'
import { getPersonalRecordHistoryForUser, getPersonalRecordsByExercise } from '@/lib/history-service'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const exerciseKey = searchParams.get('exerciseKey')
  const limit = searchParams.get('limit')
  const prType = searchParams.get('prType')

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    )
  }

  try {
    // If exerciseKey is provided, get PRs for that specific exercise
    if (exerciseKey) {
      const prs = await getPersonalRecordsByExercise(userId, exerciseKey, {
        limit: limit ? parseInt(limit) : undefined,
      })
      return NextResponse.json({ prs })
    }

    // Otherwise, get all PRs for the user
    const prs = await getPersonalRecordHistoryForUser(userId, {
      limit: limit ? parseInt(limit) : 500,
      prType: prType as any || undefined,
    })

    return NextResponse.json({ prs })
  } catch (error) {
    console.error('[API/history/prs] Error fetching PRs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PRs' },
      { status: 500 }
    )
  }
}
