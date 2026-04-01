import { NextResponse } from 'next/server'
import { getSession, getCurrentUserServer } from '@/lib/auth-service-server'
import { resolveCanonicalDbUserId } from '@/lib/subscription-service'
import { getCanonicalProfile } from '@/lib/canonical-profile-service'
import { executeAuthoritativeGeneration, logGenerationParityTable, type AuthoritativeGenerationRequest } from '@/lib/server/authoritative-program-generation'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * ==========================================================================
 * GENERATE FROM MODIFY BUILDER ROUTE - THIN ADAPTER
 * ==========================================================================
 * 
 * This route is now a THIN ADAPTER to the authoritative generation service.
 * It only:
 * 1. Validates the request
 * 2. Resolves authentication
 * 3. Resolves canonical profile (server + client fallback)
 * 4. Merges builder inputs with canonical profile
 * 5. Maps request to AuthoritativeGenerationRequest
 * 6. Calls executeAuthoritativeGeneration
 * 7. Returns the result
 * 
 * ALL generation logic lives in lib/server/authoritative-program-generation.ts
 * ==========================================================================
 */

export async function POST(request: Request) {
  const routeStartTime = Date.now()
  
  console.log('[modify-builder-route-thin-adapter-entry]', {
    timestamp: new Date().toISOString(),
    route: '/api/program/generate-from-modify-builder',
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
      builderInputs,
      currentProgramId,
      clientCanonicalSnapshot,
      modifyContext,
      canonicalProfileOverride: legacyCanonicalOverride,
    } = body
    
    if (!builderInputs) {
      return NextResponse.json({
        success: false,
        error: 'Missing builder inputs',
        failedStage: 'parse_request',
      }, { status: 400 })
    }
    
    // ==========================================================================
    // STEP 4: Resolve Canonical Profile with Material Validity Check
    // ==========================================================================
    const serverCanonicalProfile = await getCanonicalProfile()
    const clientFallbackSource = clientCanonicalSnapshot || legacyCanonicalOverride || {}
    
    const serverHasMaterialIdentity = !!(
      serverCanonicalProfile?.primaryGoal && 
      (serverCanonicalProfile?.selectedSkills?.length > 0 || serverCanonicalProfile?.trainingPathType)
    )
    
    const clientHasMaterialIdentity = !!(
      clientFallbackSource?.primaryGoal && 
      (clientFallbackSource?.selectedSkills?.length > 0 || clientFallbackSource?.trainingPathType)
    )
    
    // Choose the canonical base with the best material identity
    let canonicalBase: typeof serverCanonicalProfile
    let canonicalSourceWinner: string
    if (serverHasMaterialIdentity) {
      canonicalBase = serverCanonicalProfile
      canonicalSourceWinner = 'server_canonical_truth'
    } else if (clientHasMaterialIdentity) {
      canonicalBase = clientFallbackSource
      canonicalSourceWinner = 'client_canonical_fallback'
    } else {
      canonicalBase = clientFallbackSource || serverCanonicalProfile || {}
      canonicalSourceWinner = 'hard_defaults_fallback'
    }
    
    console.log('[modify-builder-canonical-resolution]', {
      serverHasMaterialIdentity,
      clientHasMaterialIdentity,
      canonicalSourceWinner,
      primaryGoal: canonicalBase?.primaryGoal,
    })
    
    // ==========================================================================
    // STEP 5: Build Canonical Profile from Builder Inputs + Canonical Base
    // Builder inputs are EDITABLE fields, canonical base provides NON-EDITABLE fields
    // ==========================================================================
    const canonicalProfile = {
      onboardingComplete: canonicalBase.onboardingComplete ?? true,
      // BUILDER-EDITABLE FIELDS - from builderInputs
      primaryGoal: builderInputs.primaryGoal,
      secondaryGoal: builderInputs.secondaryGoal ?? null,
      goalCategory: builderInputs.primaryGoal,
      selectedSkills: builderInputs.selectedSkills ?? [],
      selectedFlexibility: builderInputs.selectedFlexibility ?? [],
      goalCategories: builderInputs.goalCategories ?? [],
      trainingPathType: builderInputs.trainingPathType,
      experienceLevel: builderInputs.experienceLevel,
      scheduleMode: builderInputs.scheduleMode,
      sessionDurationMode: builderInputs.sessionDurationMode,
      trainingDaysPerWeek: builderInputs.trainingDaysPerWeek,
      sessionLengthMinutes: builderInputs.sessionLength,
      equipment: builderInputs.equipment ?? [],
      equipmentAvailable: builderInputs.equipment ?? [],
      // NON-BUILDER FIELDS - preserve from canonical base
      selectedStrength: canonicalBase.selectedStrength ?? [],
      bodyweight: canonicalBase.bodyweight,
      sex: canonicalBase.sex,
      trainingStyle: canonicalBase.trainingStyle,
      jointCautions: canonicalBase.jointCautions ?? [],
      weakestArea: canonicalBase.weakestArea,
      benchmarks: canonicalBase.benchmarks ?? {},
      skillBenchmarks: canonicalBase.skillBenchmarks ?? {},
      flexibilityBenchmarks: canonicalBase.flexibilityBenchmarks ?? {},
      weightedBenchmarks: canonicalBase.weightedBenchmarks ?? {},
      trainingMethodPreferences: canonicalBase.trainingMethodPreferences,
      sessionStylePreference: canonicalBase.sessionStylePreference,
      plancheProgression: canonicalBase.plancheProgression,
      frontLeverProgression: canonicalBase.frontLeverProgression,
      backLeverProgression: canonicalBase.backLeverProgression,
      muscleUpProgression: canonicalBase.muscleUpProgression,
      handstandProgression: canonicalBase.handstandProgression,
      weightedPullUp: canonicalBase.weightedPullUp,
      weightedDip: canonicalBase.weightedDip,
    }
    
    // ==========================================================================
    // STEP 6: Build Authoritative Generation Request
    // ==========================================================================
    const generationRequest: AuthoritativeGenerationRequest = {
      dbUserId,
      generationIntent: 'modify_submit',
      triggerSource: 'modify',
      canonicalProfile,
      builderInputs,
      existingProgramId: currentProgramId,
      isFreshBaselineBuild: false,  // Modify is NOT a fresh baseline
      preserveHistory: true,
      archiveCurrentProgram: false,
      modifyContext,
    }
    
    console.log('[modify-builder-route-dispatching-to-authoritative-service]', {
      generationIntent: generationRequest.generationIntent,
      triggerSource: generationRequest.triggerSource,
      isFreshBaselineBuild: generationRequest.isFreshBaselineBuild,
      primaryGoal: canonicalProfile.primaryGoal,
      selectedSkillsCount: canonicalProfile.selectedSkills?.length || 0,
      scheduleMode: canonicalProfile.scheduleMode,
      canonicalSourceWinner,
    })
    
    // ==========================================================================
    // STEP 7: Call Authoritative Generation Service
    // ==========================================================================
    const result = await executeAuthoritativeGeneration(generationRequest)
    
    // Log parity table for verification
    logGenerationParityTable()
    
    // ==========================================================================
    // STEP 8: Return Result
    // ==========================================================================
    const totalElapsed = Date.now() - routeStartTime
    
    console.log('[modify-builder-route-thin-adapter-complete]', {
      success: result.success,
      totalElapsedMs: totalElapsed,
      sessionCount: result.summary?.sessionCount,
      parityVerdict: result.parityVerdict.verdict,
      canonicalSourceWinner,
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
      diagnostics: {
        sessionCount: result.summary?.sessionCount,
        primaryGoal: result.summary?.primaryGoal,
        secondaryGoal: result.summary?.secondaryGoal,
        scheduleMode: result.summary?.scheduleMode,
        usedServerBuiltOverride: true,
        canonicalSourceWinner,
      },
      parityVerdict: result.parityVerdict,
    })
    
  } catch (error) {
    console.log('[modify-builder-route-thin-adapter-error]', {
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
