import { NextResponse } from 'next/server'
import {
  generateShortSession,
  getAvailableShortSessionFormats,
  getShortSessionDurationOptions,
  type ShortSessionRequest,
  type ShortSessionFormat,
  type ShortSessionDuration,
} from '@/lib/short-session-generation'
import type { TrainingStyleMode } from '@/lib/training-style-service'

// =============================================================================
// GET - Get available formats and duration options
// =============================================================================

export async function GET() {
  try {
    const formats = getAvailableShortSessionFormats()
    const durations = getShortSessionDurationOptions()
    
    return NextResponse.json({
      success: true,
      data: {
        formats,
        durations,
      },
    })
  } catch (error) {
    console.error('Error fetching short session options:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch short session options' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST - Generate a short session
// =============================================================================

interface ShortSessionRequestBody {
  userId: string
  availableMinutes: ShortSessionDuration
  preferredFormat?: ShortSessionFormat | 'auto'
  trainingStyle?: TrainingStyleMode
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
  fatigueLevel?: 'fresh' | 'normal' | 'fatigued'
  isDeloadWeek?: boolean
  primarySkill?: string
  skillReadinessScore?: number
  limitingFactor?: string
  envelopeTolerances?: {
    straightArmPull?: number
    straightArmPush?: number
    verticalPull?: number
  }
}

export async function POST(request: Request) {
  try {
    const body: ShortSessionRequestBody = await request.json()
    
    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }
    
    if (!body.availableMinutes || ![10, 15, 20, 25].includes(body.availableMinutes)) {
      return NextResponse.json(
        { success: false, error: 'availableMinutes must be 10, 15, 20, or 25' },
        { status: 400 }
      )
    }
    
    // Build the request with defaults
    const shortSessionRequest: ShortSessionRequest = {
      userId: body.userId,
      availableMinutes: body.availableMinutes,
      preferredFormat: body.preferredFormat || 'auto',
      trainingStyle: body.trainingStyle || 'balanced_hybrid',
      experienceLevel: body.experienceLevel || 'intermediate',
      fatigueLevel: body.fatigueLevel || 'normal',
      isDeloadWeek: body.isDeloadWeek || false,
      primarySkill: body.primarySkill as ShortSessionRequest['primarySkill'],
      skillReadinessScore: body.skillReadinessScore,
      limitingFactor: body.limitingFactor,
      envelopeTolerances: body.envelopeTolerances,
    }
    
    // Generate the session
    const session = generateShortSession(shortSessionRequest)
    
    return NextResponse.json({
      success: true,
      data: session,
    })
  } catch (error) {
    console.error('Error generating short session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate short session' },
      { status: 500 }
    )
  }
}
