import { NextResponse } from 'next/server'
import { getSession, getCurrentUserServer } from '@/lib/auth-service-server'
import { resolveCanonicalDbUserId } from '@/lib/subscription-service'
import { executeAuthoritativeGeneration, logGenerationParityTable, type AuthoritativeGenerationRequest } from '@/lib/server/authoritative-program-generation'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * ==========================================================================
 * GENERATE FRESH (MAIN BUILD) ROUTE - THIN ADAPTER
 * ==========================================================================
 * 
 * This route handles fresh main builder generation (NOT modify, NOT regenerate).
 * It is used by page.tsx handleGenerate for new builds.
 * 
 * This route is a THIN ADAPTER to the authoritative generation service.
 * It only:
 * 1. Validates the request
 * 2. Resolves authentication
 * 3. Maps request to AuthoritativeGenerationRequest
 * 4. Calls executeAuthoritativeGeneration
 * 5. Returns the result
 * 
 * ALL generation logic lives in lib/server/authoritative-program-generation.ts
 * ==========================================================================
 */

export async function POST(request: Request) {
  const routeStartTime = Date.now()
  
  console.log('[generate-fresh-route-thin-adapter-entry]', {
    timestamp: new Date().toISOString(),
    route: '/api/program/generate-fresh',
    adapterType: 'thin_adapter_to_authoritative_service',
  })
  
  try {
    // ==========================================================================
    // STEP 1: Authentication
    // ==========================================================================
    const { userId: authUserId } = await getSession()
    
    if (!authUserId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        failedStage: 'auth',
      }, { status: 401 })
    }
    
    // ==========================================================================
    // STEP 2: Resolve DB User ID
    // ==========================================================================
    const currentUser = await getCurrentUserServer()
    const { dbUserId, error: userResolutionError } = await resolveCanonicalDbUserId(
      authUserId,
      currentUser?.email,
      currentUser?.username
    )
    
    if (!dbUserId) {
      return NextResponse.json({
        success: false,
        error: 'Failed to resolve user identity',
        failedStage: 'db_user_resolution',
      }, { status: 500 })
    }
    
    // ==========================================================================
    // STEP 3: Parse Request Body
    // ==========================================================================
    const body = await request.json()
    const { 
      canonicalProfile,
      builderInputs,
      existingProgramId,
    } = body
    
    if (!canonicalProfile || !builderInputs) {
      return NextResponse.json({
        success: false,
        error: 'Missing canonical profile or builder inputs',
        failedStage: 'parse_request',
      }, { status: 400 })
    }
    
    // Basic validation
    if (!builderInputs.primaryGoal) {
      return NextResponse.json({
        success: false,
        error: 'Primary goal is required',
        failedStage: 'validation',
      }, { status: 400 })
    }
    
    // ==========================================================================
    // STEP 4: Build Authoritative Generation Request
    // ==========================================================================
    const generationRequest: AuthoritativeGenerationRequest = {
      dbUserId,
      generationIntent: 'fresh_main_build',
      triggerSource: 'main_build',
      canonicalProfile,
      builderInputs,
      existingProgramId,
      isFreshBaselineBuild: true,  // Fresh main build uses baseline contract
      preserveHistory: false,
      archiveCurrentProgram: false,
    }
    
    console.log('[generate-fresh-route-dispatching-to-authoritative-service]', {
      generationIntent: generationRequest.generationIntent,
      triggerSource: generationRequest.triggerSource,
      isFreshBaselineBuild: generationRequest.isFreshBaselineBuild,
      primaryGoal: canonicalProfile?.primaryGoal,
      selectedSkillsCount: canonicalProfile?.selectedSkills?.length || 0,
      scheduleMode: canonicalProfile?.scheduleMode,
    })
    
    // ==========================================================================
    // STEP 5: Call Authoritative Generation Service
    // ==========================================================================
    const result = await executeAuthoritativeGeneration(generationRequest)
    
    // Log parity table for verification
    logGenerationParityTable()
    
    // ==========================================================================
    // STEP 6: Return Result
    // ==========================================================================
    const totalElapsed = Date.now() - routeStartTime
    
    console.log('[generate-fresh-route-thin-adapter-complete]', {
      success: result.success,
      totalElapsedMs: totalElapsed,
      sessionCount: result.summary?.sessionCount,
      parityVerdict: result.parityVerdict.verdict,
    })
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        failedStage: result.failedStage,
        timings: result.timings,
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      program: result.program,
      timings: result.timings,
      summary: result.summary,
      parityVerdict: result.parityVerdict,
    })
    
  } catch (error) {
    console.log('[generate-fresh-route-thin-adapter-error]', {
      error: String(error),
      totalElapsedMs: Date.now() - routeStartTime,
    })
    
    return NextResponse.json({
      success: false,
      error: String(error),
      failedStage: 'route_error',
    }, { status: 500 })
  }
}
