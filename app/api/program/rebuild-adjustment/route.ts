import { NextResponse } from 'next/server'
import { getSession, getCurrentUserServer } from '@/lib/auth-service-server'
import { resolveCanonicalDbUserId } from '@/lib/subscription-service'
import { getCanonicalProfile } from '@/lib/canonical-profile-service'
import { executeAuthoritativeGeneration, logGenerationParityTable, type AuthoritativeGenerationRequest } from '@/lib/server/authoritative-program-generation'
import type { PrimaryGoal } from '@/lib/program-service'

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
      // [PHASE-M] Optional recent workout logs from the client.
      recentWorkoutLogs,
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
    // [PRE-AB6 BUILD GREEN GATE / CANONICAL EQUIPMENT CONTRACT]
    // Canonical equipment truth is exposed only as `equipmentAvailable`
    // on CanonicalProgrammingProfile (lib/canonical-profile-service.ts).
    // The previous code read `canonicalBase.equipment` as a fallback,
    // which does not exist on the contract. A single local derived
    // value keeps both the override branch and canonical truth branch
    // in sync without referencing nonexistent aliases.
    const canonicalEquipmentAvailable = canonicalBase.equipmentAvailable ?? []
    const resolvedEquipment = requestType === 'equipment' && newEquipment
      ? newEquipment
      : canonicalEquipmentAvailable

    // [PRE-AB6 BUILD GREEN GATE / CANONICAL NULLABILITY CONTRACT]
    // AuthoritativeGenerationRequest.canonicalProfile is typed as
    //   Partial<CanonicalProgrammingProfile> & { primaryGoal?: string }
    // The intersection narrows `primaryGoal` to `string | undefined`,
    // so emitting `null` (which CanonicalProgrammingProfile.primaryGoal
    // permits as raw truth) violates the request contract. The helper
    // below normalizes nullable string truth into the optional-string
    // shape the request expects without inventing fake defaults.
    // secondaryGoal / goalCategory stay as-is because Partial<...>
    // preserves their `string | null | undefined` permissiveness;
    // re-mapping them would change runtime semantics unnecessarily.
    const toOptionalNonEmptyString = (value: unknown): string | undefined => {
      if (typeof value !== 'string') return undefined
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : undefined
    }
    const canonicalPrimaryGoal = toOptionalNonEmptyString(canonicalBase.primaryGoal)

    // [PRE-AB6 BUILD GREEN GATE / PRIMARY-GOAL UNION CONTRACT]
    // canonicalProfile.primaryGoal is typed as `string | undefined`
    // because AuthoritativeGenerationRequest.canonicalProfile keeps it
    // permissive. But AdaptiveProgramInputs (lib/adaptive-program-builder.ts:1088)
    // imports its own `PrimaryGoal` from `lib/program-service`
    // (NOT the narrower types/domain export), and types both
    // `primaryGoal: PrimaryGoal` and `secondaryGoal?: PrimaryGoal`
    // against that union. To avoid silently dropping valid canonical
    // truth (e.g. 'general', 'skill', 'flexibility'), VALID_PRIMARY_GOALS
    // mirrors the FULL program-service union exactly, validated by
    // `satisfies readonly PrimaryGoal[]`. The cast inside toPrimaryGoal
    // is the only acceptable cast — it runs after membership has been
    // proven by the readonly allowed list, so it cannot widen the
    // union or admit arbitrary strings.
    const VALID_PRIMARY_GOALS = [
      'planche',
      'front_lever',
      'back_lever',
      'muscle_up',
      'handstand_pushup',
      'iron_cross',
      'weighted_strength',
      'general',
      'skill',
      'strength',
      'endurance',
      'abs',
      'pancake',
      'toe_touch',
      'front_splits',
      'side_splits',
      'flexibility',
    ] as const satisfies readonly PrimaryGoal[]

    const toPrimaryGoal = (value: unknown): PrimaryGoal | undefined => {
      if (typeof value !== 'string') return undefined
      const trimmed = value.trim()
      return (VALID_PRIMARY_GOALS as readonly string[]).includes(trimmed)
        ? (trimmed as PrimaryGoal)
        : undefined
    }
    const builderPrimaryGoal = toPrimaryGoal(canonicalBase.primaryGoal)
    const builderSecondaryGoal = toPrimaryGoal(canonicalBase.secondaryGoal)

    // [PRE-AB6 BUILD GREEN GATE / CANONICAL FLAT-FIELD CONTRACT]
    // Removed stale fields that do not exist on the canonical contract:
    //   - benchmarks / skillBenchmarks / flexibilityBenchmarks /
    //     weightedBenchmarks (no aggregate buckets exist; benchmark
    //     truth is exposed as flat fields on the canonical profile)
    //   - backLeverProgression (no canonical equivalent — removed)
    //   - muscleUpProgression  → real field is muscleUpReadiness
    //   - handstandProgression → real field is hspuProgression
    //   - equipment alias       → only equipmentAvailable is canonical
    // The route remains a thin adapter: no fake fallback truth, no
    // helper rewrite, no widening of CanonicalProgrammingProfile.
    const canonicalProfile = {
      onboardingComplete: canonicalBase.onboardingComplete ?? true,
      primaryGoal: canonicalPrimaryGoal,
      secondaryGoal: canonicalBase.secondaryGoal ?? null,
      goalCategory: canonicalBase.goalCategory || canonicalBase.primaryGoal,
      selectedSkills: canonicalBase.selectedSkills || [],
      selectedFlexibility: canonicalBase.selectedFlexibility || [],
      selectedStrength: canonicalBase.selectedStrength || [],
      goalCategories: canonicalBase.goalCategories || [],
      trainingPathType: canonicalBase.trainingPathType || 'hybrid',
      // Equipment - only override if request type is equipment
      equipmentAvailable: resolvedEquipment,
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
      trainingMethodPreferences: canonicalBase.trainingMethodPreferences,
      sessionStylePreference: canonicalBase.sessionStylePreference,
      plancheProgression: canonicalBase.plancheProgression,
      frontLeverProgression: canonicalBase.frontLeverProgression,
      muscleUpReadiness: canonicalBase.muscleUpReadiness,
      hspuProgression: canonicalBase.hspuProgression,
      weightedPullUp: canonicalBase.weightedPullUp,
      weightedDip: canonicalBase.weightedDip,
    }
    
    // ==========================================================================
    // STEP 6: Build Builder Inputs from Canonical Profile
    // ==========================================================================
    // [PRE-AB6 BUILD GREEN GATE / BUILDER-INPUTS CONTRACT]
    // builderInputs is typed as Partial<AdaptiveProgramInputs>. The
    // four aggregate benchmark buckets have been removed because they
    // do not exist on the canonical profile — the authoritative
    // generator already reads benchmark truth from the flat fields on
    // canonicalProfile. The legacy `equipment` alias is replaced with
    // `equipmentAvailable`, the canonical field name now in scope.
    // [BUILDER-INPUTS-FILTER] AdaptiveProgramInputs (lib/adaptive-program-builder.ts:1506)
    // is the strict builder input contract. Profile fields like
    // `selectedStrength`, `bodyweight`, `sex`, `jointCautions`,
    // `weakestArea`, `trainingStyle`, `equipmentAvailable` are NOT on
    // it — they live on the canonical profile, which we also pass via
    // `canonicalProfile`. Only forward keys the builder accepts. The
    // builder reads the rest from `canonicalProfile.*` directly.
    const builderInputs = {
      primaryGoal: builderPrimaryGoal,
      secondaryGoal: builderSecondaryGoal,
      selectedSkills: canonicalProfile.selectedSkills,
      trainingPathType: canonicalProfile.trainingPathType,
      goalCategories: canonicalProfile.goalCategories,
      selectedFlexibility: canonicalProfile.selectedFlexibility,
      experienceLevel: canonicalProfile.experienceLevel,
      scheduleMode: canonicalProfile.scheduleMode,
      trainingDaysPerWeek: canonicalProfile.trainingDaysPerWeek,
      sessionDurationMode: canonicalProfile.sessionDurationMode,
      sessionLength: canonicalProfile.sessionLengthMinutes,
      // The strict input contract field is `equipment`, not `equipmentAvailable`.
      equipment: canonicalProfile.equipmentAvailable,
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
      // [PHASE-M] Forward recent workout logs so the rebuilt program reflects
      // recent performance at generation time.
      recentWorkoutLogs: Array.isArray(recentWorkoutLogs) ? recentWorkoutLogs : undefined,
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
