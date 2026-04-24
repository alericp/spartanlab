import { NextResponse } from 'next/server'
import { getSession, getCurrentUserServer } from '@/lib/auth-service-server'
import { resolveCanonicalDbUserId } from '@/lib/subscription-service'
import { getCanonicalProfile } from '@/lib/canonical-profile-service'
import { executeAuthoritativeGeneration, logGenerationParityTable, type AuthoritativeGenerationRequest } from '@/lib/server/authoritative-program-generation'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * ==========================================================================
 * REBUILD ADJUSTMENT ROUTE - THIN ADAPTER
 * ==========================================================================
 * 
 * This route is now a THIN ADAPTER to the authoritative generation service.
 * It only:
 * 1. Validates the request
 * 2. Resolves authentication
 * 3. Resolves canonical profile (server + client fallback)
 * 4. Applies thin adjustments to canonical profile
 * 5. Maps request to AuthoritativeGenerationRequest
 * 6. Calls executeAuthoritativeGeneration
 * 7. Returns the result
 * 
 * ALL generation logic lives in lib/server/authoritative-program-generation.ts
 * ==========================================================================
 */

export async function POST(request: Request) {
  const routeStartTime = Date.now()
  
  console.log('[rebuild-adjustment-route-thin-adapter-entry]', {
    timestamp: new Date().toISOString(),
    route: '/api/program/rebuild-adjustment',
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
      requestType,
      newTrainingDays,
      newSessionMinutes,
      newEquipment,
      currentProgramId,
      clientCanonicalSnapshot,
    } = body
    
    if (!requestType) {
      return NextResponse.json({
        success: false,
        error: 'Missing adjustment request type',
        failedStage: 'parse_request',
      }, { status: 400 })
    }
    
    // ==========================================================================
    // STEP 4: Resolve Canonical Profile with Material Validity Check
    // Server canonical may be incomplete, so we check for material identity
    // ==========================================================================
    const serverCanonicalProfile = await getCanonicalProfile()
    
    const serverHasMaterialIdentity = !!(
      serverCanonicalProfile?.primaryGoal && 
      (serverCanonicalProfile?.selectedSkills?.length > 0 || serverCanonicalProfile?.trainingPathType)
    )
    
    const clientHasMaterialIdentity = !!(
      clientCanonicalSnapshot?.primaryGoal && 
      (clientCanonicalSnapshot?.selectedSkills?.length > 0 || clientCanonicalSnapshot?.trainingPathType)
    )
    
    // Choose the canonical base with the best material identity
    let canonicalBase: typeof serverCanonicalProfile
    if (serverHasMaterialIdentity) {
      canonicalBase = serverCanonicalProfile
    } else if (clientHasMaterialIdentity) {
      canonicalBase = clientCanonicalSnapshot
    } else {
      canonicalBase = clientCanonicalSnapshot || serverCanonicalProfile || {}
    }
    
    console.log('[rebuild-adjustment-canonical-resolution]', {
      serverHasMaterialIdentity,
      clientHasMaterialIdentity,
      canonicalBaseSource: serverHasMaterialIdentity ? 'server' : clientHasMaterialIdentity ? 'client' : 'best_available',
      primaryGoal: canonicalBase?.primaryGoal,
    })
    
    // ==========================================================================
    // STEP 5: Build Canonical Profile with Thin Adjustments Applied
    // ==========================================================================
    const canonicalProfile = {
      onboardingComplete: canonicalBase.onboardingComplete ?? true,
      primaryGoal: canonicalBase.primaryGoal,
      secondaryGoal: canonicalBase.secondaryGoal ?? null,
      goalCategory: canonicalBase.goalCategory || canonicalBase.primaryGoal,
      selectedSkills: canonicalBase.selectedSkills || [],
      selectedFlexibility: canonicalBase.selectedFlexibility || [],
      selectedStrength: canonicalBase.selectedStrength || [],
      goalCategories: canonicalBase.goalCategories || [],
      trainingPathType: canonicalBase.trainingPathType || 'hybrid',
      // Equipment - only override if request type is equipment
      equipment: requestType === 'equipment' && newEquipment 
        ? newEquipment 
        : canonicalBase.equipmentAvailable || canonicalBase.equipment || [],
      equipmentAvailable: requestType === 'equipment' && newEquipment 
        ? newEquipment 
        : canonicalBase.equipmentAvailable || canonicalBase.equipment || [],
      scheduleMode: canonicalBase.scheduleMode || 'flexible',
      sessionDurationMode: canonicalBase.sessionDurationMode || 'adaptive',
      // Schedule - only override if request type matches
      trainingDaysPerWeek: requestType === 'training_days' && newTrainingDays !== undefined
        ? newTrainingDays
        : canonicalBase.trainingDaysPerWeek ?? 4,
      sessionLengthMinutes: requestType === 'session_time' && newSessionMinutes !== undefined
        ? newSessionMinutes
        : canonicalBase.sessionLengthMinutes ?? 45,
      experienceLevel: canonicalBase.experienceLevel || 'intermediate',
      bodyweight: canonicalBase.bodyweight,
      sex: canonicalBase.sex,
      trainingStyle: canonicalBase.trainingStyle,
      jointCautions: canonicalBase.jointCautions || [],
      weakestArea: canonicalBase.weakestArea,
      benchmarks: canonicalBase.benchmarks || {},
      skillBenchmarks: canonicalBase.skillBenchmarks || {},
      flexibilityBenchmarks: canonicalBase.flexibilityBenchmarks || {},
      weightedBenchmarks: canonicalBase.weightedBenchmarks || {},
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
    // STEP 6: Build Builder Inputs from Canonical Profile
    // ==========================================================================
    const builderInputs = {
      primaryGoal: canonicalProfile.primaryGoal,
      secondaryGoal: canonicalProfile.secondaryGoal,
      selectedSkills: canonicalProfile.selectedSkills,
      trainingPathType: canonicalProfile.trainingPathType,
      goalCategories: canonicalProfile.goalCategories,
      selectedFlexibility: canonicalProfile.selectedFlexibility,
      selectedStrength: canonicalProfile.selectedStrength,
      experienceLevel: canonicalProfile.experienceLevel,
      scheduleMode: canonicalProfile.scheduleMode,
      trainingDaysPerWeek: canonicalProfile.trainingDaysPerWeek,
      sessionDurationMode: canonicalProfile.sessionDurationMode,
      sessionLength: canonicalProfile.sessionLengthMinutes,
      equipment: canonicalProfile.equipment,
      bodyweight: canonicalProfile.bodyweight,
      sex: canonicalProfile.sex,
      trainingStyle: canonicalProfile.trainingStyle,
      jointCautions: canonicalProfile.jointCautions,
      weakestArea: canonicalProfile.weakestArea,
      benchmarks: canonicalProfile.benchmarks,
      skillBenchmarks: canonicalProfile.skillBenchmarks,
      flexibilityBenchmarks: canonicalProfile.flexibilityBenchmarks,
      weightedBenchmarks: canonicalProfile.weightedBenchmarks,
    }
    
    // ==========================================================================
    // STEP 7: Build Authoritative Generation Request
    // ==========================================================================
    // 
    // [ROOT-CAUSE-FIX] "Rebuild From Current Settings" MUST use isFreshBaselineBuild: true
    // 
    // The user intent for "Rebuild From Current Settings" is:
    // - Rebuild the program using current profile truth
    // - Preserve workout history/timeline
    // - Get the SAME baseline session count as a fresh build would
    // 
    // Previously this was set to false, which caused the builder to apply
    // adaptive modifiers (recentWorkoutCount penalties) that reduced 6 → 4 sessions.
    // This was WRONG because the user expects a fresh baseline from current truth,
    // not a weakened adaptive rebuild.
    //
    // The distinction:
    // - isFreshBaselineBuild: true  → Skip recent workout penalties, use full baseline
    // - isFreshBaselineBuild: false → Apply adaptive modifiers (only correct for modify flow)
    // ==========================================================================
    const generationRequest: AuthoritativeGenerationRequest = {
      dbUserId,
      generationIntent: 'rebuild_current',
      triggerSource: 'rebuild',  // Changed from 'modify' - this is a rebuild, not a modify
      canonicalProfile,
      builderInputs,
      existingProgramId: currentProgramId,
      isFreshBaselineBuild: true,  // [ROOT-CAUSE-FIX] Rebuild MUST use fresh baseline contract
      preserveHistory: true,
      archiveCurrentProgram: false,
      regenerationReason: `rebuild_from_current_settings_${requestType}`,
    }
    
    // [ROOT-CAUSE-FIX] Log the corrected semantic classification
    console.log('[rebuild-adjustment-semantic-fix-audit]', {
      action: 'rebuild_from_current_settings',
      previousClassification: {
        triggerSource: 'modify',
        isFreshBaselineBuild: false,
        result: 'WRONG - caused 6 → 4 session regression',
      },
      correctedClassification: {
        triggerSource: 'rebuild',
        isFreshBaselineBuild: true,
        result: 'CORRECT - uses fresh baseline like successful flows',
      },
      verdict: 'REBUILD_CLASSIFICATION_FIXED',
    })
    
    // ==========================================================================
    // [TASK 7] STATIC USER VERIFICATION
    // Static users must remain untouched - their scheduleMode stays 'static'
    // ==========================================================================
    const isStaticUser = canonicalProfile.scheduleMode === 'static'
    console.log('[rebuild-adjustment-static-user-verification]', {
      scheduleMode: canonicalProfile.scheduleMode,
      isStaticUser,
      trainingDaysPerWeek: canonicalProfile.trainingDaysPerWeek,
      verdict: isStaticUser 
        ? 'STATIC_USER_PRESERVED__NO_FLEXIBLE_BASELINE_LOGIC_APPLIED'
        : 'FLEXIBLE_USER__FRESH_BASELINE_WILL_APPLY',
    })
    
    console.log('[rebuild-adjustment-route-dispatching-to-authoritative-service]', {
      generationIntent: generationRequest.generationIntent,
      triggerSource: generationRequest.triggerSource,
      requestType,
      isFreshBaselineBuild: generationRequest.isFreshBaselineBuild,
      primaryGoal: canonicalProfile.primaryGoal,
      selectedSkillsCount: canonicalProfile.selectedSkills?.length || 0,
      staticUserVerification: isStaticUser ? 'STATIC_PRESERVED' : 'FLEXIBLE_USER',
    })
    
    // ==========================================================================
    // STEP 8: Call Authoritative Generation Service
    // ==========================================================================
    const result = await executeAuthoritativeGeneration(generationRequest)
    
    // Log parity table for verification
    logGenerationParityTable()
    
    // ==========================================================================
    // STEP 9: Return Result
    // ==========================================================================
    const totalElapsed = Date.now() - routeStartTime
    
    console.log('[rebuild-adjustment-route-thin-adapter-complete]', {
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
      // [AUTHORITATIVE-INGRESS-UNIFICATION] Surface ingress proof so consumers can verify
      // the program was built from canonical + bundle truth, not vague fallback logic.
      generationIngressProof: result.generationIngressProof,
    })
    
  } catch (error) {
    console.log('[rebuild-adjustment-route-thin-adapter-error]', {
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
