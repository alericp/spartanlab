import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import { getWorkoutSessionHistoryById } from '@/lib/history-service'
import { readOwnedRecord } from '@/lib/server/athlete-ownership'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { userId } = await getSession()

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  if (!id) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    )
  }

  try {
    const result = await readOwnedRecord({
      authenticatedUserId: userId,
      notFoundError: 'Session not found',
      load: () => getWorkoutSessionHistoryById(id),
    })

    if (result.status !== 200 || !('id' in result.body)) {
      return NextResponse.json(result.body, { status: result.status })
    }

    return NextResponse.json({ session: result.body })
  } catch (error) {
    console.error('[API/history/sessions] Error fetching session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}
