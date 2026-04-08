import { NextResponse } from 'next/server'
import { getSession, getCurrentUserServer } from '@/lib/auth-service-server'
import { resolveCanonicalDbUserId } from '@/lib/subscription-service'
import { executeAuthoritativeGeneration, logGenerationParityTable, type AuthoritativeGenerationRequest } from '@/lib/server/authoritative-program-generation'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * ==========================================================================
 * REGENERATE ROUTE - THIN ADAPTER
 * ==========================================================================
 * 
 * This route is now a THIN ADAPTER to the authoritative generation service.
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
  
  console.log('[regenerate-route-thin-adapter-entry]', {
    timestamp: new Date().toISOString(),
    route: '/api/program/regenerate',
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
      programInputs,
      regenerationReason,
      currentProgramId,
    } = body
    
    // [ROOT-CAUSE-DIAGNOSTIC] Log request body structure for debugging
    console.log('[regenerate-route-request-body-audit]', {
      hasCanonicalProfile: !!canonicalProfile,
      canonicalProfileKeys: canonicalProfile ? Object.keys(canonicalProfile).slice(0, 10) : [],
      primaryGoal: canonicalProfile?.primaryGoal,
      selectedSkillsCount: canonicalProfile?.selectedSkills?.length || 0,
      scheduleMode: canonicalProfile?.scheduleMode,
      hasProgramInputs: !!programInputs,
      programInputsKeys: programInputs ? Object.keys(programInputs).slice(0, 10) : [],
      hasCurrentProgramId: !!currentProgramId,
      regenerationReason,
    })
    
    if (!canonicalProfile || !programInputs) {
      return NextResponse.json({
        success: false,
        error: 'Missing canonical profile or program inputs',
        failedStage: 'parse_request',
        diagnostics: {
          hasCanonicalProfile: !!canonicalProfile,
          hasProgramInputs: !!programInputs,
        },
      }, { status: 400 })
    }
    
    // ==========================================================================
    // STEP 4: Build Authoritative Generation Request
    // ==========================================================================
    const generationRequest: AuthoritativeGenerationRequest = {
      dbUserId,
      generationIntent: 'regenerate',
      triggerSource: 'regenerate',
      canonicalProfile,
      builderInputs: programInputs,
      existingProgramId: currentProgramId,
      isFreshBaselineBuild: true,  // Regenerate is a fresh baseline rebuild
      preserveHistory: true,
      archiveCurrentProgram: false,
      regenerationReason: regenerationReason || 'rebuild_from_current_settings',
    }
    
    console.log('[regenerate-route-dispatching-to-authoritative-service]', {
      generationIntent: generationRequest.generationIntent,
      triggerSource: generationRequest.triggerSource,
      isFreshBaselineBuild: generationRequest.isFreshBaselineBuild,
      primaryGoal: canonicalProfile?.primaryGoal,
      selectedSkillsCount: canonicalProfile?.selectedSkills?.length || 0,
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
    
    console.log('[regenerate-route-thin-adapter-complete]', {
      success: result.success,
      totalElapsedMs: totalElapsed,
      sessionCount: result.summary?.sessionCount,
      parityVerdict: result.parityVerdict.verdict,
    })
    
    if (!result.success) {
      console.log('[regenerate-route-generation-failed]', {
        error: result.error,
        failedStage: result.failedStage,
        timings: result.timings,
      })
      
      return NextResponse.json({
        success: false,
        error: result.error,
        failedStage: result.failedStage,
        timings: result.timings,
        diagnostics: {
          routeStage: 'authoritative_service_call',
          serviceStage: result.failedStage,
          generationIntent: 'regenerate',
          triggerSource: 'regenerate',
        },
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    const stackPreview = error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : 'no stack'
    
    console.log('[regenerate-route-thin-adapter-error]', {
      error: errorMessage,
      stackPreview,
      totalElapsedMs: Date.now() - routeStartTime,
    })
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      failedStage: 'route_error',
      diagnostics: {
        routeStage: 'route_catch_block',
        serviceStage: 'unknown',
        stackPreview: stackPreview?.substring(0, 500),
        generationIntent: 'regenerate',
        triggerSource: 'regenerate',
      },
    }, { status: 500 })
  }
}
