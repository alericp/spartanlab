import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import {
  getTrainingStyleProfile,
  saveTrainingStyleProfile,
  STYLE_MODE_DEFINITIONS,
  type TrainingStyleMode,
} from '@/lib/training-style-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/engine/style
 * 
 * Returns the athlete's training style profile.
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
    
    const profile = await getTrainingStyleProfile(userId)
    
    return NextResponse.json({
      success: true,
      profile,
      styleModes: Object.entries(STYLE_MODE_DEFINITIONS).map(([key, value]) => ({
        mode: key,
        label: value.label,
        description: value.description,
        defaultPriorities: value.priorities,
      })),
    })
    
  } catch (error) {
    console.error('[Training Style] Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training style' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/engine/style
 * 
 * Updates the athlete's training style profile.
 * 
 * Body:
 * - styleMode: TrainingStyleMode (required)
 * - skillPriority?: number
 * - strengthPriority?: number
 * - powerPriority?: number
 * - endurancePriority?: number
 * - hypertrophyPriority?: number
 * - preferHighFrequency?: boolean
 * - preferHeavyLoading?: boolean
 * - preferExplosiveWork?: boolean
 * - preferDensityWork?: boolean
 * - includeHypertrophySupport?: boolean
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
    
    const body = await request.json()
    
    // Validate styleMode
    const validModes: TrainingStyleMode[] = [
      'skill_focused',
      'strength_focused',
      'power_focused',
      'endurance_focused',
      'hypertrophy_supported',
      'balanced_hybrid',
    ]
    
    if (!body.styleMode || !validModes.includes(body.styleMode)) {
      return NextResponse.json(
        { error: 'Invalid styleMode' },
        { status: 400 }
      )
    }
    
    const profile = await saveTrainingStyleProfile(userId, {
      styleMode: body.styleMode,
      skillPriority: body.skillPriority,
      strengthPriority: body.strengthPriority,
      powerPriority: body.powerPriority,
      endurancePriority: body.endurancePriority,
      hypertrophyPriority: body.hypertrophyPriority,
      preferHighFrequency: body.preferHighFrequency,
      preferHeavyLoading: body.preferHeavyLoading,
      preferExplosiveWork: body.preferExplosiveWork,
      preferDensityWork: body.preferDensityWork,
      includeHypertrophySupport: body.includeHypertrophySupport,
      source: 'settings',
    })
    
    return NextResponse.json({
      success: true,
      profile,
      message: 'Training style updated. Your program may be regenerated to reflect this change.',
    })
    
  } catch (error) {
    console.error('[Training Style] Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update training style' },
      { status: 500 }
    )
  }
}
