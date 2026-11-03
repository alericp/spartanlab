import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import { getProgramHistoryById } from '@/lib/history-service'
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
    return NextResponse.json({ error: 'Program ID required' }, { status: 400 })
  }

  try {
    const result = await readOwnedRecord({
      authenticatedUserId: userId,
      notFoundError: 'Program not found',
      load: () => getProgramHistoryById(id, { reportErrors: true }),
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('[ProgramAPI] Error fetching program:', error)
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    )
  }
}
