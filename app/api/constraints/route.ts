import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { detectConstraints, detectConstraintsSync } from '@/lib/constraint-detection-engine'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Try async version first (with database readiness data)
    try {
      const constraints = await detectConstraints(userId)
      return NextResponse.json(constraints)
    } catch (asyncError) {
      // Fall back to sync version if async fails
      console.warn('[Constraints API] Async detection failed, using sync:', asyncError)
      const constraints = detectConstraintsSync()
      return NextResponse.json(constraints)
    }
  } catch (error) {
    console.error('[Constraints API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to detect constraints' },
      { status: 500 }
    )
  }
}
