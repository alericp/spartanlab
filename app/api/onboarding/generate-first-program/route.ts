import { NextResponse } from 'next/server'
import { getSession, getCurrentUserServer } from '@/lib/auth-service-server'
import { resolveCanonicalDbUserId } from '@/lib/subscription-service'
import { executeAuthoritativeGeneration, logGenerationParityTable, type AuthoritativeGenerationRequest } from '@/lib/server/authoritative-program-generation'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * ==========================================================================
 * ONBOARDING FIRST PROGRAM ROUTE - THIN ADAPTER
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
  
  console.log('[onboarding-route-thin-adapter-entry]', {
    timestamp: new Date().toISOString(),
    route: '/api/onboarding/generate-first-program',
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
    const { programInputs, onboardingProfile } = body
    
    if (!programInputs || !onboardingProfile) {
      return NextResponse.json({
        success: false,
        error: 'Missing program inputs or onboarding profile',
        failedStage: 'parse_request',
      }, { status: 400 })
    }
    
    // Basic validation
    if (!programInputs.primaryGoal) {
      return NextResponse.json({
        success: false,
        error: 'Primary goal is required',
        failedStage: 'validation',
      }, { status: 400 })
    }
    
    // ==========================================================================
    // STEP 4: Build Canonical Profile from Onboarding Data
    // The onboarding route receives both programInputs and onboardingProfile
    // We merge them to create the canonical profile for generation
    // ==========================================================================
    const canonicalProfile = {
      onboardingComplete: onboardingProfile.onboardingComplete ?? true,
      primaryGoal: programInputs.primaryGoal,
      secondaryGoal: programInputs.secondaryGoal || null,
      goalCategory: onboardingProfile.goalCategory || programInputs.primaryGoal,
      selectedSkills: programInputs.selectedSkills || onboardingProfile.selectedSkills || [],
      selectedFlexibility: programInputs.selectedFlexibility || onboardingProfile.selectedFlexibility || [],
      selectedStrength: programInputs.selectedStrength || onboardingProfile.selectedStrength || [],
      goalCategories: programInputs.goalCategories || [],
      trainingPathType: programInputs.trainingPathType || onboardingProfile.trainingPathType || 'hybrid',
      equipment: programInputs.equipment || onboardingProfile.equipmentAvailable || [],
      equipmentAvailable: programInputs.equipment || onboardingProfile.equipmentAvailable || [],
      scheduleMode: programInputs.scheduleMode || onboardingProfile.scheduleMode || 'flexible',
      sessionDurationMode: programInputs.sessionDurationMode || onboardingProfile.sessionDurationMode || 'adaptive',
      trainingDaysPerWeek: programInputs.trainingDaysPerWeek || onboardingProfile.trainingDaysPerWeek || 4,
      sessionLengthMinutes: programInputs.sessionLength || onboardingProfile.sessionLengthMinutes || 45,
      experienceLevel: programInputs.experienceLevel || onboardingProfile.experienceLevel || 'intermediate',
      bodyweight: programInputs.bodyweight || onboardingProfile.bodyweight,
      sex: onboardingProfile.sex,
      trainingStyle: onboardingProfile.trainingStyle,
      jointCautions: onboardingProfile.jointCautions || [],
      weakestArea: onboardingProfile.weakestArea,
      benchmarks: onboardingProfile.benchmarks || {},
      skillBenchmarks: onboardingProfile.skillBenchmarks || {},
      flexibilityBenchmarks: onboardingProfile.flexibilityBenchmarks || {},
      weightedBenchmarks: onboardingProfile.weightedBenchmarks || {},
      trainingMethodPreferences: onboardingProfile.trainingMethodPreferences,
      sessionStylePreference: onboardingProfile.sessionStylePreference,
      plancheProgression: onboardingProfile.plancheProgression,
      frontLeverProgression: onboardingProfile.frontLeverProgression,
      backLeverProgression: onboardingProfile.backLeverProgression,
      muscleUpProgression: onboardingProfile.muscleUpProgression,
      handstandProgression: onboardingProfile.handstandProgression,
      weightedPullUp: onboardingProfile.weightedPullUp,
      weightedDip: onboardingProfile.weightedDip,
    }
    
    // ==========================================================================
    // STEP 5: Build Authoritative Generation Request
    // ==========================================================================
    const generationRequest: AuthoritativeGenerationRequest = {
      dbUserId,
      generationIntent: 'onboarding_first_build',
      triggerSource: 'onboarding',
      canonicalProfile,
      builderInputs: programInputs,
      existingProgramId: undefined,
      isFreshBaselineBuild: true,  // Onboarding is always a fresh baseline
      preserveHistory: false,
      archiveCurrentProgram: false,
    }
    
    console.log('[onboarding-route-dispatching-to-authoritative-service]', {
      generationIntent: generationRequest.generationIntent,
      triggerSource: generationRequest.triggerSource,
      isFreshBaselineBuild: generationRequest.isFreshBaselineBuild,
      primaryGoal: canonicalProfile.primaryGoal,
      selectedSkillsCount: canonicalProfile.selectedSkills?.length || 0,
      scheduleMode: canonicalProfile.scheduleMode,
    })
    
    // ==========================================================================
    // STEP 6: Call Authoritative Generation Service
    // ==========================================================================
    const result = await executeAuthoritativeGeneration(generationRequest)
    
    // Log parity table for verification
    logGenerationParityTable()
    
    // ==========================================================================
    // STEP 7: Return Result
    // ==========================================================================
    const totalElapsed = Date.now() - routeStartTime
    
    console.log('[onboarding-route-thin-adapter-complete]', {
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
    console.log('[onboarding-route-thin-adapter-error]', {
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
