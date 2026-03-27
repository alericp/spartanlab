import { NextResponse } from 'next/server'
import { getSession, getCurrentUserServer } from '@/lib/auth-service-server'
import { resolveCanonicalDbUserId } from '@/lib/subscription-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Allow up to 30 seconds for generation

/**
 * [PHASE 22B] Server-Side Modify Builder Generation Route
 * 
 * This endpoint mirrors the working onboarding/regenerate generation architecture:
 * 1. Receives builderInputs and canonicalProfileOverride from client
 * 2. Does NOT re-resolve canonical truth on server (client already built the override)
 * 3. Calls generateAdaptiveProgram with the client-passed override
 * 4. Returns the generated program
 * 
 * This fixes the architectural divergence where modify builder submit was using
 * direct client builder call while onboarding used server-side orchestration.
 * 
 * KEY DIFFERENCE from rebuild-adjustment route:
 * - rebuild-adjustment re-resolves canonical on server
 * - this route TRUSTS client-passed canonicalProfileOverride because modify builder
 *   has already shown user the correct values and user is submitting from that state
 */

interface StageTimings {
  [key: string]: number
}

export async function POST(request: Request) {
  const routeStartTime = Date.now()
  const timings: StageTimings = {}
  let currentStage = 'route_entry'
  
  const markStage = (stage: string) => {
    const elapsed = Date.now() - routeStartTime
    timings[currentStage] = elapsed
    currentStage = stage
    console.log(`[phase22b-modify-server-stage] ${stage} at ${elapsed}ms`)
  }
  
  // [PHASE 22B] Route entry audit
  console.log('[phase22b-modify-server-route-entry-audit]', {
    timestamp: new Date().toISOString(),
    route: '/api/program/generate-from-modify-builder',
    architectureClass: 'server_side_generation',
    mirrorsOnboardingPattern: true,
    clientTrustModel: 'trusts_client_canonical_override_from_modify_builder',
  })
  
  try {
    // ==========================================================================
    // STAGE: Authentication
    // ==========================================================================
    markStage('auth_start')
    const { userId: authUserId } = await getSession()
    
    if (!authUserId) {
      console.log('[phase22b-modify-server-route-error-audit]', {
        failedStage: 'auth',
        reason: 'unauthorized',
        elapsedMs: Date.now() - routeStartTime,
      })
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        failedStage: 'auth',
        timings,
      }, { status: 401 })
    }
    
    markStage('auth_verified')
    
    // ==========================================================================
    // STAGE: Resolve canonical DB user ID
    // ==========================================================================
    markStage('db_user_resolution_start')
    const currentUser = await getCurrentUserServer()
    const { dbUserId, error: userResolutionError } = await resolveCanonicalDbUserId(
      authUserId,
      currentUser?.email,
      currentUser?.username
    )
    
    if (!dbUserId) {
      console.log('[phase22b-modify-server-route-error-audit]', {
        failedStage: 'db_user_resolution',
        reason: userResolutionError,
        elapsedMs: Date.now() - routeStartTime,
      })
      return NextResponse.json({
        success: false,
        error: 'Failed to resolve user identity',
        failedStage: 'db_user_resolution',
        timings,
      }, { status: 500 })
    }
    
    markStage('db_user_resolved')
    
    // ==========================================================================
    // STAGE: Parse request body
    // ==========================================================================
    markStage('parse_request_start')
    const body = await request.json()
    const { 
      builderInputs,
      canonicalProfileOverride,
      modifyContext,
    } = body
    
    // [PHASE 22B] Payload audit
    console.log('[phase22b-modify-server-route-payload-audit]', {
      hasBuilderInputs: !!builderInputs,
      hasCanonicalProfileOverride: !!canonicalProfileOverride,
      hasModifyContext: !!modifyContext,
      builderInputsSummary: builderInputs ? {
        primaryGoal: builderInputs.primaryGoal,
        secondaryGoal: builderInputs.secondaryGoal,
        scheduleMode: builderInputs.scheduleMode,
        trainingDaysPerWeek: builderInputs.trainingDaysPerWeek,
        sessionDurationMode: builderInputs.sessionDurationMode,
        sessionLength: builderInputs.sessionLength,
        selectedSkillsCount: builderInputs.selectedSkills?.length ?? 0,
        trainingPathType: builderInputs.trainingPathType,
        experienceLevel: builderInputs.experienceLevel,
        equipmentCount: builderInputs.equipment?.length ?? 0,
      } : null,
      canonicalOverrideSummary: canonicalProfileOverride ? {
        primaryGoal: canonicalProfileOverride.primaryGoal,
        secondaryGoal: canonicalProfileOverride.secondaryGoal,
        scheduleMode: canonicalProfileOverride.scheduleMode,
        trainingDaysPerWeek: canonicalProfileOverride.trainingDaysPerWeek,
        sessionLengthMinutes: canonicalProfileOverride.sessionLengthMinutes,
        selectedSkillsCount: canonicalProfileOverride.selectedSkills?.length ?? 0,
        trainingPathType: canonicalProfileOverride.trainingPathType,
        experienceLevel: canonicalProfileOverride.experienceLevel,
        equipmentCount: canonicalProfileOverride.equipmentAvailable?.length ?? 0,
      } : null,
    })
    
    if (!builderInputs || !canonicalProfileOverride) {
      console.log('[phase22b-modify-server-route-error-audit]', {
        failedStage: 'parse_request',
        reason: 'missing_inputs_or_override',
        hasBuilderInputs: !!builderInputs,
        hasCanonicalProfileOverride: !!canonicalProfileOverride,
        elapsedMs: Date.now() - routeStartTime,
      })
      return NextResponse.json({
        success: false,
        error: 'Missing builder inputs or canonical profile override',
        failedStage: 'parse_request',
        timings,
      }, { status: 400 })
    }
    
    markStage('request_parsed')
    
    // ==========================================================================
    // STAGE: Dynamic import of generation service
    // ==========================================================================
    markStage('generation_service_import_start')
    
    const { generateAdaptiveProgram } = await import('@/lib/adaptive-program-builder')
    
    markStage('generation_service_start')
    
    // ==========================================================================
    // [PHASE 22B] STAGE: Run generation with client-passed override
    // This mirrors exactly what the working onboarding/regenerate routes do
    // ==========================================================================
    markStage('builder_entry')
    
    // [PHASE 22B] Builder dispatch audit
    console.log('[phase22b-modify-server-route-builder-dispatch-audit]', {
      dispatchMethod: 'generateAdaptiveProgram_with_canonicalProfileOverride',
      builderInputKeys: Object.keys(builderInputs),
      overrideKeys: Object.keys(canonicalProfileOverride),
      materialIdentity: {
        inputPrimaryGoal: builderInputs.primaryGoal,
        overridePrimaryGoal: canonicalProfileOverride.primaryGoal,
        inputScheduleMode: builderInputs.scheduleMode,
        overrideScheduleMode: canonicalProfileOverride.scheduleMode,
        inputSelectedSkillsCount: builderInputs.selectedSkills?.length ?? 0,
        overrideSelectedSkillsCount: canonicalProfileOverride.selectedSkills?.length ?? 0,
      },
    })
    
    const serverStageCallback = (stage: string) => {
      console.log(`[phase22b-modify-builder-stage] ${stage} at ${Date.now() - routeStartTime}ms`)
    }
    
    let program
    try {
      // [PHASE 22B] Pass client-built canonicalProfileOverride to builder
      // This ensures builder uses modify-builder truth, not stale localStorage canonical
      program = await generateAdaptiveProgram(builderInputs, serverStageCallback, {
        canonicalProfileOverride,
      })
    } catch (builderError) {
      console.log('[phase22b-modify-server-route-error-audit]', {
        failedStage: 'builder_execution',
        reason: String(builderError),
        elapsedMs: Date.now() - routeStartTime,
      })
      return NextResponse.json({
        success: false,
        error: `Builder failed: ${String(builderError)}`,
        failedStage: 'builder_execution',
        timings,
      }, { status: 500 })
    }
    
    markStage('builder_done')
    
    // ==========================================================================
    // STAGE: Validate generated program
    // ==========================================================================
    markStage('validation_start')
    
    if (!program || !Array.isArray(program.sessions) || program.sessions.length === 0) {
      console.log('[phase22b-modify-server-route-error-audit]', {
        failedStage: 'validation',
        reason: 'program_invalid_or_empty',
        elapsedMs: Date.now() - routeStartTime,
      })
      return NextResponse.json({
        success: false,
        error: 'Generated program is invalid or has no sessions',
        failedStage: 'validation',
        timings,
      }, { status: 500 })
    }
    
    markStage('validation_done')
    
    // [PHASE 22B] Result audit
    console.log('[phase22b-modify-server-route-result-audit]', {
      success: true,
      sessionCount: program.sessions.length,
      primaryGoal: program.primaryGoal,
      secondaryGoal: program.secondaryGoal,
      scheduleMode: program.scheduleMode,
      trainingPathType: program.trainingPathType,
      selectedSkillsSummary: program.selectedSkills?.slice(0, 5) || [],
      inputWasFlexible: builderInputs.scheduleMode === 'flexible',
      outputHas6PlusSessions: program.sessions.length >= 6,
      verdict: program.sessions.length >= 6 && builderInputs.scheduleMode === 'flexible'
        ? 'STRONG_6_SESSION_FLEXIBLE_IDENTITY_PRODUCED'
        : program.sessions.length === 4 && builderInputs.scheduleMode === 'flexible'
          ? 'WEAK_4_SESSION_COLLAPSE_DESPITE_CORRECT_ARCHITECTURE'
          : 'STATIC_MODE_OR_OTHER_SESSION_COUNT',
    })
    
    // ==========================================================================
    // STAGE: Success
    // ==========================================================================
    markStage('route_success')
    
    const totalElapsed = Date.now() - routeStartTime
    timings[currentStage] = totalElapsed
    
    console.log('[phase22b-modify-server-success]', {
      success: true,
      totalElapsedMs: totalElapsed,
      sessionCount: program.sessions.length,
      primaryGoal: program.primaryGoal,
      dbUserId: dbUserId?.slice(0, 12) + '...',
    })
    
    return NextResponse.json({
      success: true,
      program,
      timings,
      diagnostics: {
        sessionCount: program.sessions.length,
        primaryGoal: program.primaryGoal,
        secondaryGoal: program.secondaryGoal,
        scheduleMode: program.scheduleMode,
        usedCanonicalProfileOverride: true,
      },
    })
    
  } catch (error) {
    const totalElapsed = Date.now() - routeStartTime
    timings[currentStage] = totalElapsed
    
    console.log('[phase22b-modify-server-route-error-audit]', {
      failedStage: currentStage,
      reason: String(error),
      totalElapsedMs: totalElapsed,
      timings,
    })
    
    return NextResponse.json({
      success: false,
      error: String(error),
      failedStage: currentStage,
      timings,
    }, { status: 500 })
  }
}
