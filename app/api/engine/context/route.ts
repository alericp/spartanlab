import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import { buildUnifiedContext } from '@/lib/unified-coaching-engine'

export const dynamic = 'force-dynamic'

/**
 * GET /api/engine/context
 * 
 * Returns the complete unified engine context for the authenticated athlete.
 * This is the single source of truth for all coaching decisions.
 */
export async function GET() {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const context = await buildUnifiedContext(session.user.id)
    
    return NextResponse.json({
      success: true,
      context,
      meta: {
        engineVersion: context.engineVersion,
        dataQuality: context.dataQuality,
        lastUpdated: context.lastUpdated,
      }
    })
    
  } catch (error) {
    console.error('[Unified Engine] Error building context:', error)
    return NextResponse.json(
      { error: 'Failed to build unified context' },
      { status: 500 }
    )
  }
}
