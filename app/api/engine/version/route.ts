import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import { buildUnifiedContext } from '@/lib/unified-coaching-engine'
import {
  getActiveProgramVersion,
  getProgramVersionHistory,
  regenerateProgramIfNeeded,
  getVersionChangeMessage,
} from '@/lib/program-version-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/engine/version
 * 
 * Returns the current active program version and version history.
 */
export async function GET() {
  try {
    const { userId } = await getSession()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const [activeVersion, history] = await Promise.all([
      getActiveProgramVersion(userId),
      getProgramVersionHistory(userId, 5),
    ])
    
    return NextResponse.json({
      success: true,
      activeVersion,
      history,
      meta: {
        hasActiveVersion: !!activeVersion,
        versionCount: history.length,
      },
    })
    
  } catch (error) {
    console.error('[Program Version] Error fetching version:', error)
    return NextResponse.json(
      { error: 'Failed to fetch program version' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/engine/version
 * 
 * Checks if program regeneration is needed and creates a new version if so.
 * Can also force regeneration with a manual reason.
 * 
 * Body:
 * - forceRegenerate?: boolean - Force regeneration even if no changes detected
 * - reason?: string - Manual reason for regeneration
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getSession()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const body = await request.json().catch(() => ({}))
    
    // Build current context
    const context = await buildUnifiedContext(userId)
    
    // Check for regeneration (or force it)
    const manualReason = body.forceRegenerate ? 'manual_regeneration' : undefined
    
    const result = await regenerateProgramIfNeeded(userId, context, manualReason)
    
    // Get message for user
    const previousVersion = result.regenerated
      ? (await getProgramVersionHistory(userId, 2))[1] || null
      : null
    
    const message = result.regenerated && result.version
      ? getVersionChangeMessage(previousVersion, result.version)
      : 'No program changes needed.'
    
    return NextResponse.json({
      success: true,
      regenerated: result.regenerated,
      version: result.version,
      explanation: result.explanation,
      message,
    })
    
  } catch (error) {
    console.error('[Program Version] Error regenerating:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate program' },
      { status: 500 }
    )
  }
}
