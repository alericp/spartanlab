import { NextResponse } from 'next/server'
import { getSession, getCurrentUserServer } from '@/lib/auth-service-server'
import { resolveCanonicalDbUserId } from '@/lib/subscription-service'
import { getCanonicalProfile } from '@/lib/canonical-profile-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Allow up to 30 seconds for generation

/**
 * [PHASE 24F] Server-Side Modify Builder Generation Route
 * 
 * This endpoint NOW mirrors the working onboarding/rebuild-adjustment architecture:
 * 1. Receives builderInputs (editable fields) + clientCanonicalSnapshot (fallback) from client
 * 2. Resolves canonical truth on SERVER (does NOT trust client-built override)
 * 3. Constructs server-side canonicalProfileOverride by:
 *    - Using strongest server truth as BASE
 *    - Merging ONLY builder-editable fields from builderInputs on top
 * 4. Calls generateAdaptiveProgram with the server-built override
 * 5. Returns the generated program
 * 
 * KEY ARCHITECTURAL FIX from Phase 24F:
 * - REMOVED: Trusting client-passed canonicalProfileOverride as authoritative
 * - ADDED: Server resolves freshest truth and builds override itself
 * - This matches how rebuild-adjustment and onboarding work
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
    console.log(`[phase24f-modify-server-stage] ${stage} at ${elapsed}ms`)
  }
  
  // [PHASE 24F] Route entry audit - this now mirrors onboarding truth class
  console.log('[phase24f-modify-server-route-entry-audit]', {
    timestamp: new Date().toISOString(),
    route: '/api/program/generate-from-modify-builder',
    architectureClass: 'server_side_truth_construction',
    mirrorsOnboardingPattern: true,
    mirrorsRebuildAdjustmentPattern: true,
    clientTrustModel: 'server_resolves_truth_client_sends_builder_inputs_only',
  })
  
  try {
    // ==========================================================================
    // STAGE: Authentication
    // ==========================================================================
    markStage('auth_start')
    const { userId: authUserId } = await getSession()
    
    if (!authUserId) {
      console.log('[phase24f-modify-server-route-error-audit]', {
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
      console.log('[phase24f-modify-server-route-error-audit]', {
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
    // [PHASE 24F] Now expects builderInputs + clientCanonicalSnapshot, NOT canonicalProfileOverride
    // ==========================================================================
    markStage('parse_request_start')
    const body = await request.json()
    const { 
      builderInputs,
      currentProgramId,
      clientCanonicalSnapshot,
      modifyContext,
      // Legacy support - if client still sends this, we'll use it as fallback only
      canonicalProfileOverride: legacyCanonicalOverride,
    } = body
    
    // [PHASE 24F] Payload audit
    console.log('[phase24f-modify-server-route-payload-audit]', {
      hasBuilderInputs: !!builderInputs,
      hasCurrentProgramId: !!currentProgramId,
      hasClientCanonicalSnapshot: !!clientCanonicalSnapshot,
      hasLegacyCanonicalOverride: !!legacyCanonicalOverride,
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
      clientSnapshotSummary: clientCanonicalSnapshot ? {
        primaryGoal: clientCanonicalSnapshot.primaryGoal,
        scheduleMode: clientCanonicalSnapshot.scheduleMode,
        selectedSkillsCount: clientCanonicalSnapshot.selectedSkills?.length ?? 0,
      } : null,
    })
    
    // ==========================================================================
    // [PHASE 24K] CRITICAL: Full selectedSkills array at server route entry
    // This is the earliest server-side audit point
    // ==========================================================================
    console.log('[phase24k-server-route-entry-full-selectedSkills-trace]', {
      builderInputsSelectedSkillsFull: builderInputs?.selectedSkills ?? [],
      builderInputsSelectedSkillsCount: builderInputs?.selectedSkills?.length ?? 0,
      builderInputsHasBackLever: builderInputs?.selectedSkills?.includes('back_lever') ?? false,
      builderInputsHasDragonFlag: builderInputs?.selectedSkills?.includes('dragon_flag') ?? false,
      builderInputsHasPlanche: builderInputs?.selectedSkills?.includes('planche') ?? false,
      builderInputsHasFrontLever: builderInputs?.selectedSkills?.includes('front_lever') ?? false,
      clientSnapshotSelectedSkillsFull: clientCanonicalSnapshot?.selectedSkills ?? [],
      clientSnapshotHasBackLever: clientCanonicalSnapshot?.selectedSkills?.includes('back_lever') ?? false,
      clientSnapshotHasDragonFlag: clientCanonicalSnapshot?.selectedSkills?.includes('dragon_flag') ?? false,
      verdict: (builderInputs?.selectedSkills?.includes('back_lever') || builderInputs?.selectedSkills?.includes('dragon_flag'))
        ? 'BUILDER_INPUTS_CONTAIN_STALE_SKILLS'
        : 'BUILDER_INPUTS_CLEAN',
    })
    
    if (!builderInputs) {
      console.log('[phase24f-modify-server-route-error-audit]', {
        failedStage: 'parse_request',
        reason: 'missing_builder_inputs',
        hasBuilderInputs: !!builderInputs,
        elapsedMs: Date.now() - routeStartTime,
      })
      return NextResponse.json({
        success: false,
        error: 'Missing builder inputs',
        failedStage: 'parse_request',
        timings,
      }, { status: 400 })
    }
    
    markStage('request_parsed')
    
    // ==========================================================================
    // [PHASE 24F] STAGE: Resolve canonical truth on SERVER
    // This mirrors the rebuild-adjustment route pattern
    // ==========================================================================
    markStage('server_canonical_resolution_start')
    
    const serverCanonicalProfile = await getCanonicalProfile()
    
    // Use client snapshot or legacy override as fallback source
    const clientFallbackSource = clientCanonicalSnapshot || legacyCanonicalOverride || {}
    
    // [PHASE 24F] Material validity check - does server canonical have real user data?
    const serverHasMaterialIdentity = !!(
      serverCanonicalProfile?.primaryGoal && 
      (serverCanonicalProfile?.selectedSkills?.length > 0 || serverCanonicalProfile?.trainingPathType)
    )
    
    const clientHasMaterialIdentity = !!(
      clientFallbackSource?.primaryGoal && 
      (clientFallbackSource?.selectedSkills?.length > 0 || clientFallbackSource?.trainingPathType)
    )
    
    // [PHASE 24F] TASK 3 - Source candidates audit
    console.log('[phase24f-modify-server-source-candidates-audit]', {
      hasSavedProgramTruth: false, // TODO: Could resolve from DB if needed
      savedProgramId: currentProgramId ?? null,
      savedProgramCreatedAt: null,
      savedProgramSessionCount: null,
      serverCanonicalPrimaryGoal: serverCanonicalProfile?.primaryGoal ?? null,
      serverCanonicalScheduleMode: serverCanonicalProfile?.scheduleMode ?? null,
      serverCanonicalSelectedSkillsCount: serverCanonicalProfile?.selectedSkills?.length ?? 0,
      clientCanonicalPrimaryGoal: clientFallbackSource?.primaryGoal ?? null,
      clientCanonicalScheduleMode: clientFallbackSource?.scheduleMode ?? null,
      clientCanonicalSelectedSkillsCount: clientFallbackSource?.selectedSkills?.length ?? 0,
      serverCanonicalHasMaterialIdentity: serverHasMaterialIdentity,
      clientCanonicalHasMaterialIdentity: clientHasMaterialIdentity,
    })
    
    // [PHASE 24F] Choose canonical base with material validity gating
    // Same pattern as rebuild-adjustment route
    let canonicalBase: typeof serverCanonicalProfile
    let canonicalSourceWinner: 'server_canonical_truth' | 'client_canonical_fallback' | 'hard_defaults_fallback'
    let winnerReason: string
    
    if (serverHasMaterialIdentity) {
      canonicalBase = serverCanonicalProfile
      canonicalSourceWinner = 'server_canonical_truth'
      winnerReason = 'server_canonical_has_material_identity'
    } else if (clientHasMaterialIdentity) {
      canonicalBase = clientFallbackSource
      canonicalSourceWinner = 'client_canonical_fallback'
      winnerReason = 'server_canonical_incomplete_client_has_material_identity'
    } else {
      canonicalBase = clientFallbackSource || serverCanonicalProfile || {}
      canonicalSourceWinner = 'hard_defaults_fallback'
      winnerReason = 'both_sources_incomplete_using_best_available'
      console.warn('[phase24f-canonical-degraded-truth-warning]', {
        warning: 'Neither server canonical nor client snapshot has material identity',
        serverHasMaterialIdentity,
        clientHasMaterialIdentity,
      })
    }
    
    // [PHASE 24F] TASK 3 - Source winner verdict
    console.log('[phase24f-modify-server-source-winner-verdict]', {
      winner: canonicalSourceWinner,
      reason: winnerReason,
      currentProgramId: currentProgramId ?? null,
      winnerPrimaryGoal: canonicalBase?.primaryGoal ?? null,
      winnerScheduleMode: canonicalBase?.scheduleMode ?? null,
      winnerTrainingDaysPerWeek: canonicalBase?.trainingDaysPerWeek ?? null,
      winnerSelectedSkillsCount: canonicalBase?.selectedSkills?.length ?? 0,
      winnerTrainingPathType: canonicalBase?.trainingPathType ?? null,
      winnerExperienceLevel: canonicalBase?.experienceLevel ?? null,
    })
    
    markStage('server_canonical_resolved')
    
    // ==========================================================================
    // [PHASE 24F] STAGE: Build canonical profile override on SERVER
    // Use canonicalBase for NON-BUILDER fields, builderInputs for BUILDER-EDITABLE fields
    // ==========================================================================
    markStage('canonical_profile_construction_start')
    
    const canonicalProfileOverride = {
      // Required ProfileSnapshot fields
      snapshotId: `server-modify-${Date.now()}`,
      createdAt: new Date().toISOString(),
      onboardingComplete: canonicalBase.onboardingComplete ?? true,
      
      // ==========================================================================
      // BUILDER-EDITABLE FIELDS - override from builderInputs
      // These are the fields the user can change in the modify builder UI
      // ==========================================================================
      primaryGoal: builderInputs.primaryGoal,
      secondaryGoal: builderInputs.secondaryGoal ?? null,
      goalCategory: builderInputs.primaryGoal,
      selectedSkills: builderInputs.selectedSkills ?? [],
      selectedFlexibility: builderInputs.selectedFlexibility ?? [],
      goalCategories: builderInputs.goalCategories ?? [],
      trainingPathType: builderInputs.trainingPathType,
      experienceLevel: builderInputs.experienceLevel,
      
      // Schedule fields from builder
      scheduleMode: builderInputs.scheduleMode,
      sessionDurationMode: builderInputs.sessionDurationMode,
      trainingDaysPerWeek: builderInputs.trainingDaysPerWeek,
      sessionLengthMinutes: builderInputs.sessionLength,
      
      // Equipment from builder
      equipment: builderInputs.equipment ?? [],
      equipmentAvailable: builderInputs.equipment ?? [],
      
      // ==========================================================================
      // NON-BUILDER FIELDS - preserve from server canonical base
      // These are athlete profile fields the builder doesn't edit
      // ==========================================================================
      selectedStrength: canonicalBase.selectedStrength ?? [],
      bodyweight: canonicalBase.bodyweight,
      sex: canonicalBase.sex,
      trainingStyle: canonicalBase.trainingStyle,
      jointCautions: canonicalBase.jointCautions ?? [],
      weakestArea: canonicalBase.weakestArea,
      
      // Benchmark data - preserve from canonical base
      benchmarks: canonicalBase.benchmarks ?? {},
      skillBenchmarks: canonicalBase.skillBenchmarks ?? {},
      flexibilityBenchmarks: canonicalBase.flexibilityBenchmarks ?? {},
      weightedBenchmarks: canonicalBase.weightedBenchmarks ?? {},
    }
    
    // [PHASE 24F] TASK 3 - Final override audit
    console.log('[phase24f-modify-server-final-override-audit]', {
      finalOverridePrimaryGoal: canonicalProfileOverride.primaryGoal,
      finalOverrideSecondaryGoal: canonicalProfileOverride.secondaryGoal,
      finalOverrideScheduleMode: canonicalProfileOverride.scheduleMode,
      finalOverrideTrainingDaysPerWeek: canonicalProfileOverride.trainingDaysPerWeek,
      finalOverrideSessionLengthMinutes: canonicalProfileOverride.sessionLengthMinutes,
      finalOverrideSelectedSkillsCount: canonicalProfileOverride.selectedSkills?.length ?? 0,
      finalOverrideTrainingPathType: canonicalProfileOverride.trainingPathType,
      finalOverrideGoalCategoriesCount: canonicalProfileOverride.goalCategories?.length ?? 0,
      finalOverrideSelectedFlexibilityCount: canonicalProfileOverride.selectedFlexibility?.length ?? 0,
      finalOverrideExperienceLevel: canonicalProfileOverride.experienceLevel,
      finalOverrideEquipmentCount: canonicalProfileOverride.equipmentAvailable?.length ?? 0,
      finalOverrideHasBenchmarks: Object.keys(canonicalProfileOverride.benchmarks ?? {}).length > 0,
      finalOverrideHasSkillBenchmarks: Object.keys(canonicalProfileOverride.skillBenchmarks ?? {}).length > 0,
      finalOverrideHasWeightedBenchmarks: Object.keys(canonicalProfileOverride.weightedBenchmarks ?? {}).length > 0,
      finalOverrideHasBodyweight: !!canonicalProfileOverride.bodyweight,
      finalOverrideHasTrainingStyle: !!canonicalProfileOverride.trainingStyle,
    })
    
    // ==========================================================================
    // [PHASE 24J] TASK 1 - CRITICAL selectedSkills TRACE
    // Root-cause audit for identity drift between builder inputs and override
    // ==========================================================================
    console.log('[phase24j-modify-server-selectedSkills-trace]', {
      builderInputsSelectedSkills: builderInputs.selectedSkills ?? [],
      builderInputsSelectedSkillsCount: builderInputs.selectedSkills?.length ?? 0,
      canonicalBaseSelectedSkills: canonicalBase?.selectedSkills ?? [],
      canonicalBaseSelectedSkillsCount: canonicalBase?.selectedSkills?.length ?? 0,
      finalOverrideSelectedSkills: canonicalProfileOverride.selectedSkills ?? [],
      finalOverrideSelectedSkillsCount: canonicalProfileOverride.selectedSkills?.length ?? 0,
      builderInputsMatchesOverride: JSON.stringify(builderInputs.selectedSkills?.sort()) === JSON.stringify(canonicalProfileOverride.selectedSkills?.sort()),
      builderHasBackLever: builderInputs.selectedSkills?.includes('back_lever') ?? false,
      builderHasDragonFlag: builderInputs.selectedSkills?.includes('dragon_flag') ?? false,
      overrideHasBackLever: canonicalProfileOverride.selectedSkills?.includes('back_lever') ?? false,
      overrideHasDragonFlag: canonicalProfileOverride.selectedSkills?.includes('dragon_flag') ?? false,
      canonicalBaseHasBackLever: canonicalBase?.selectedSkills?.includes('back_lever') ?? false,
      canonicalBaseDragonFlag: canonicalBase?.selectedSkills?.includes('dragon_flag') ?? false,
      verdict: (builderInputs.selectedSkills?.length ?? 0) === (canonicalProfileOverride.selectedSkills?.length ?? 0)
        ? 'SELECTED_SKILLS_COUNT_MATCH'
        : 'SELECTED_SKILLS_COUNT_MISMATCH',
    })
    
    // [PHASE 24F] TASK 3 - Builder handoff parity verdict
    const hasAllMaterialFields = !!(
      canonicalProfileOverride.primaryGoal &&
      canonicalProfileOverride.scheduleMode &&
      canonicalProfileOverride.trainingDaysPerWeek &&
      canonicalProfileOverride.experienceLevel
    )
    
    console.log('[phase24f-modify-server-builder-handoff-parity-verdict]', {
      hasAllMaterialFields,
      hasPrimaryGoal: !!canonicalProfileOverride.primaryGoal,
      hasScheduleMode: !!canonicalProfileOverride.scheduleMode,
      hasTrainingDays: !!canonicalProfileOverride.trainingDaysPerWeek,
      hasExperienceLevel: !!canonicalProfileOverride.experienceLevel,
      hasSelectedSkills: (canonicalProfileOverride.selectedSkills?.length ?? 0) > 0,
      hasTrainingPathType: !!canonicalProfileOverride.trainingPathType,
      verdict: hasAllMaterialFields ? 'OVERRIDE_HAS_ALL_MATERIAL_FIELDS' : 'OVERRIDE_MISSING_MATERIAL_FIELDS',
    })
    
    markStage('canonical_profile_constructed')
    
    // ==========================================================================
    // STAGE: Dynamic import of generation service
    // ==========================================================================
    markStage('generation_service_import_start')
    
    const { generateAdaptiveProgram } = await import('@/lib/adaptive-program-builder')
    
    markStage('generation_service_start')
    
    // ==========================================================================
    // [PHASE 24F] STAGE: Run generation with SERVER-BUILT override
    // ==========================================================================
    markStage('builder_entry')
    
    console.log('[phase24f-modify-server-route-builder-dispatch-audit]', {
      dispatchMethod: 'generateAdaptiveProgram_with_server_built_override',
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
      architectureNote: 'SERVER_BUILT_OVERRIDE_NOT_CLIENT_TRUSTED',
    })
    
    const serverStageCallback = (stage: string) => {
      console.log(`[phase24f-modify-builder-stage] ${stage} at ${Date.now() - routeStartTime}ms`)
    }
    
    let program
    try {
      program = await generateAdaptiveProgram(builderInputs, serverStageCallback, {
        canonicalProfileOverride,
      })
    } catch (builderError) {
      console.log('[phase24f-modify-server-route-error-audit]', {
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
      console.log('[phase24f-modify-server-route-error-audit]', {
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
    
    // [PHASE 24F] Result audit
    console.log('[phase24f-modify-server-route-result-audit]', {
      success: true,
      sessionCount: program.sessions.length,
      primaryGoal: program.primaryGoal,
      secondaryGoal: program.secondaryGoal,
      scheduleMode: program.scheduleMode,
      trainingPathType: program.trainingPathType,
      selectedSkillsSummary: program.selectedSkills?.slice(0, 5) || [],
      inputWasFlexible: builderInputs.scheduleMode === 'flexible',
      outputHas6PlusSessions: program.sessions.length >= 6,
      serverTruthClassUsed: true,
      canonicalSourceWinner,
      verdict: program.sessions.length >= 6 && builderInputs.scheduleMode === 'flexible'
        ? 'STRONG_6_SESSION_FLEXIBLE_IDENTITY_PRODUCED'
        : program.sessions.length === 4 && builderInputs.scheduleMode === 'flexible'
          ? 'WEAK_4_SESSION_COLLAPSE_DESPITE_SERVER_TRUTH_CLASS'
          : 'STATIC_MODE_OR_OTHER_SESSION_COUNT',
    })
    
    // ==========================================================================
    // STAGE: Success
    // ==========================================================================
    markStage('route_success')
    
    const totalElapsed = Date.now() - routeStartTime
    timings[currentStage] = totalElapsed
    
    console.log('[phase24f-modify-server-success]', {
      success: true,
      totalElapsedMs: totalElapsed,
      sessionCount: program.sessions.length,
      primaryGoal: program.primaryGoal,
      dbUserId: dbUserId?.slice(0, 12) + '...',
      canonicalSourceWinner,
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
        usedServerBuiltOverride: true,
        canonicalSourceWinner,
      },
    })
    
  } catch (error) {
    const totalElapsed = Date.now() - routeStartTime
    timings[currentStage] = totalElapsed
    
    console.log('[phase24f-modify-server-route-error-audit]', {
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
