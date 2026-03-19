import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import {
  createProgramVersion,
  createInitialProgramHistoryEntry,
  getFullProgramHistory,
} from '@/lib/program-history-versioning'
import { getActiveProgramHistory } from '@/lib/history-service'
import { startNewProgram, getProgramHistoryStats, type ResetReason } from '@/lib/program-history-helpers'
import { isProgramHistorySchemaReady } from '@/lib/db'
import type { GenerationReason } from '@/lib/program-version-service'

export const dynamic = 'force-dynamic'

// Response type for when history schema is not available
const HISTORY_UNAVAILABLE_RESPONSE = {
  success: true,
  activeProgram: null,
  archivedPrograms: [],
  totalVersions: 0,
  historyAvailable: false,
}

/**
 * GET /api/program/history
 * 
 * Returns the user's program history (active + archived programs)
 * 
 * Query params:
 * - stats=true: Return summary statistics instead of full history
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getSession()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // PHASE 1: Check schema readiness before any DB operations
    const schemaReady = await isProgramHistorySchemaReady()
    if (!schemaReady) {
      console.log('[Program History] Schema not ready - returning unavailable state')
      return NextResponse.json(HISTORY_UNAVAILABLE_RESPONSE)
    }
    
    // Check if stats requested
    const url = new URL(request.url)
    const includeStats = url.searchParams.get('stats') === 'true'
    
    if (includeStats) {
      const stats = await getProgramHistoryStats(userId)
      return NextResponse.json({
        success: true,
        stats,
        historyAvailable: true,
      })
    }
    
    const history = await getFullProgramHistory(userId)
    
    return NextResponse.json({
      success: true,
      historyAvailable: true,
      ...history,
    })
    
  } catch (error) {
    console.error('[Program History] Error fetching history:', error)
    // Check if this is a schema-missing error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      console.log('[Program History] Schema missing - returning unavailable state')
      return NextResponse.json(HISTORY_UNAVAILABLE_RESPONSE)
    }
    return NextResponse.json(
      { error: 'Failed to fetch program history', historyAvailable: false },
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
    
    // PHASE 1: Check schema readiness before any DB operations
    const schemaReady = await isProgramHistorySchemaReady()
    if (!schemaReady) {
      console.log('[Program History] Schema not ready - cannot persist program history')
      return NextResponse.json({
        success: false,
        historyAvailable: false,
        error: 'Program history persistence is not available yet',
        programHistoryId: null,
        versionNumber: 0,
        reasonSummary: 'History persistence unavailable - program saved locally only',
      }, { status: 202 }) // 202 Accepted - request understood but not fully processed
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
        { error: result.error || 'Failed to create program history', historyAvailable: true },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      historyAvailable: true,
      programHistoryId: result.programHistoryId,
      versionNumber: result.versionNumber,
      reasonSummary: result.reasonSummary,
    })
    
  } catch (error) {
    console.error('[Program History] Error creating history:', error)
    // Check if this is a schema-missing error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return NextResponse.json({
        success: false,
        historyAvailable: false,
        error: 'Program history persistence is not available yet',
      }, { status: 202 })
    }
    return NextResponse.json(
      { error: 'Failed to create program history', historyAvailable: false },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/program/history
 * 
 * Start a new program (hard reset)
 * Archives current program and creates a new one
 * 
 * Body:
 * - program: AdaptiveProgram - The new program data
 * - resetReason?: ResetReason - Why the user is starting fresh
 */
export async function PUT(request: Request) {
  try {
    const { userId } = await getSession()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { program, resetReason } = body
    
    if (!program) {
      return NextResponse.json(
        { error: 'Program data is required' },
        { status: 400 }
      )
    }
    
    // PHASE 1: Check schema readiness before any DB operations
    const schemaReady = await isProgramHistorySchemaReady()
    if (!schemaReady) {
      console.log('[Program History] Schema not ready - cannot persist new program')
      return NextResponse.json({
        success: false,
        historyAvailable: false,
        error: 'Program history persistence is not available yet',
        programHistoryId: null,
        versionNumber: 0,
        reasonSummary: 'History persistence unavailable - program saved locally only',
      }, { status: 202 })
    }
    
    // Use startNewProgram which handles archiving and version creation
    const result = await startNewProgram(userId, program, resetReason as ResetReason)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to start new program', historyAvailable: true },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      historyAvailable: true,
      programHistoryId: result.programHistoryId,
      versionNumber: result.versionNumber,
      reasonSummary: result.reasonSummary,
      message: 'New program started. Your previous program has been archived.',
    })
    
  } catch (error) {
    console.error('[Program History] Error starting new program:', error)
    // Check if this is a schema-missing error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return NextResponse.json({
        success: false,
        historyAvailable: false,
        error: 'Program history persistence is not available yet',
      }, { status: 202 })
    }
    return NextResponse.json(
      { error: 'Failed to start new program', historyAvailable: false },
      { status: 500 }
    )
  }
}
