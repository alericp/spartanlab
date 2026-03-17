import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import {
  createProgramVersion,
  createInitialProgramHistoryEntry,
  getFullProgramHistory,
} from '@/lib/program-history-versioning'
import { getActiveProgramHistory } from '@/lib/history-service'
import { startNewProgram, getProgramHistoryStats, type ResetReason } from '@/lib/program-history-helpers'
import type { GenerationReason } from '@/lib/program-version-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/program/history
 * 
 * Returns the user's program history (active + archived programs)
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
    
    const history = await getFullProgramHistory(userId)
    
    return NextResponse.json({
      success: true,
      ...history,
    })
    
  } catch (error) {
    console.error('[Program History] Error fetching history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch program history' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/program/history
 * 
 * Creates a new program history entry (initial or version update)
 * 
 * Body:
 * - program: AdaptiveProgram - The generated program data
 * - reason?: GenerationReason - Why the program was created/regenerated
 * - isInitial?: boolean - Whether this is the initial program
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
    const { program, reason, isInitial } = body
    
    if (!program) {
      return NextResponse.json(
        { error: 'Program data is required' },
        { status: 400 }
      )
    }
    
    // Check if user already has an active program
    const existingActive = await getActiveProgramHistory(userId)
    
    // Determine generation reason
    const generationReason: GenerationReason = reason || 
      (isInitial || !existingActive ? 'onboarding_initial_generation' : 'manual_regeneration')
    
    // Create program history entry
    const result = isInitial && !existingActive
      ? await createInitialProgramHistoryEntry(userId, program)
      : await createProgramVersion({
          userId,
          program,
          generationReason,
        })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create program history' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      programHistoryId: result.programHistoryId,
      versionNumber: result.versionNumber,
      reasonSummary: result.reasonSummary,
    })
    
  } catch (error) {
    console.error('[Program History] Error creating history:', error)
    return NextResponse.json(
      { error: 'Failed to create program history' },
      { status: 500 }
    )
  }
}
