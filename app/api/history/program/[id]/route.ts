import { NextRequest, NextResponse } from 'next/server'
import { getProgramHistoryById } from '@/lib/history-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Program ID required' }, { status: 400 })
  }

  try {
    const program = await getProgramHistoryById(id)

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    return NextResponse.json(program)
  } catch (error) {
    console.error('[ProgramAPI] Error fetching program:', error)
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    )
  }
}
