/**
 * RECOVERY ADAPTATION SNAPSHOT CONTRACT  —  Phase S (Step 21.1)
 *
 * =============================================================================
 * AUTHORITATIVE RECOVERY / INJURY / DELOAD / READINESS DECISION FOUNDATION
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Provide a single canonical typed contract that consolidates all recovery,
 * readiness, injury, soreness, fatigue, and deload signals into one normalized
 * snapshot. This snapshot can be:
 *
 *   1) Derived from existing available profile/settings/log/session signals;
 *   2) Preserved through the program/session/live-workout corridor;
 *   3) Consumed later by deeper adaptive layers (deload automation, injury
 *      substitution, missed-day recomposition, live coaching adjustments);
 *   4) Displayed honestly — showing "unknown" when data is missing instead of
 *      inventing fake certainty.
 *
 * WHY THIS LAYER EXISTS (root cause this contract closes)
 * -------------------------------------------------------
 * Without a unified recovery/adaptation snapshot:
 *   - `recovery-fatigue-engine.ts` produces ReadinessAssessment in one shape;
 *   - `adaptive-deload-recovery-engine.ts` produces RecoveryPhase in another;
 *   - `recovery-engine.ts` produces RecoverySignal in yet another;
 *   - Canonical profile carries recoveryQuality/recoveryRaw separately;
 *   - Phase K carries stress classification separately;
 *   - Future deload/injury/missed-session logic would scatter across all of
 *     them with no single contract.
 *
 * This contract is the single authoritative owner of:
 *   - `RecoveryAdaptationSnapshot` (the unified typed shape)
 *   - `deriveRecoveryAdaptationSnapshot()` (the single pure helper)
 *   - Conservative "unknown/missing-data" semantics when signals are absent
 *
 * NON-GOALS / OUT OF SCOPE THIS PASS
 * ----------------------------------
 *   - Does NOT implement full deload automation yet (Phase S.S2+)
 *   - Does NOT implement injury-aware substitutions yet (Phase S.S3+)
 *   - Does NOT implement missed-day recomposition yet (Phase S.S4+)
 *   - Does NOT mutate program/session prescriptions in S.S1 (foundation only)
 *   - Does NOT invent recovery data; missing signals produce honest "unknown"
 *   - Does NOT compete with Phase K stress distribution; uses K as input
 *   - Does NOT rewrite live workout; only provides signals for future layers
 *
 * PURITY CONTRACT
 * ---------------
 *   - No React. No hooks. No localStorage. No fetch. No DB. No clock side effects.
 *   - Reads ONLY the supplied profile/session/stress inputs.
 *   - Returns plain JSON-safe objects.
 *   - Safe on server / client / build-time.
 */

// =============================================================================
// TYPES — READINESS VOCABULARY
// =============================================================================

/**
 * Overall readiness level — a traffic-light-style indicator of training
 * capacity. "unknown" is the honest state when we lack sufficient data.
 */
export type ReadinessLevel = 'unknown' | 'green' | 'yellow' | 'orange' | 'red'

/**
 * Fatigue accumulation level. Distinct from readiness — high fatigue can
 * coexist with moderate readiness if the athlete is adapted.
 */
export type FatigueLevel = 'unknown' | 'low' | 'moderate' | 'high' | 'very_high'

/**
 * Joint / connective tissue risk level. Elevated by straight-arm work,
 * repeated high-stress exposures, or user-reported joint concerns.
 */
export type JointRiskLevel = 'unknown' | 'low' | 'moderate' | 'high'

/**
 * Injury constraint level. Determines how conservative substitutions and
 * progressions should be.
 *   - "none": No active injury constraints
 *   - "watch": Monitor but train normally
 *   - "limit": Reduce load/volume on affected patterns
 *   - "avoid": Substitute away from affected patterns entirely
 */
export type InjuryConstraintLevel = 'none' | 'watch' | 'limit' | 'avoid'

/**
 * Deload signal — whether a deload is warranted based on accumulated stress,
 * performance trends, and recovery signals.
 *   - "none": No deload needed
 *   - "monitor": Approaching thresholds, watch closely
 *   - "recommended": Deload would be beneficial
 *   - "required": Deload is strongly advised for safety/performance
 */
export type DeloadSignal = 'none' | 'monitor' | 'recommended' | 'required'

/**
 * Missed/skipped session signal — tracks whether the athlete has incomplete
 * or skipped sessions that might affect weekly stress distribution.
 */
export type MissedSessionSignal =
  | 'none'
  | 'missed'                    // Session was completely missed
  | 'partial'                   // Session was partially completed
  | 'skipped_for_recovery'      // Intentionally skipped as a recovery decision

/**
 * Quality of the data sources used to derive the snapshot. Determines
 * confidence level for any decisions made from the snapshot.
 */
export type SourceQuality =
  | 'empty'           // No data available at all
  | 'profile_only'    // Only onboarding profile (static, potentially stale)
  | 'settings'        // Profile + recent settings updates
  | 'workout_log'     // Has recent workout log evidence
  | 'check_in'        // Has recent check-in / readiness input
  | 'mixed'           // Multiple sources combined

// =============================================================================
// TYPES — SNAPSHOT STRUCTURE
// =============================================================================

/**
 * Limiter codes that explain WHY a particular level/signal was assigned.
 * Stable machine-readable tokens for debugging, testing, and future rule
 * consumption.
 */
export type RecoveryLimiterCode =
  // Profile-derived
  | 'profile_recovery_poor'
  | 'profile_recovery_normal'
  | 'profile_recovery_good'
  | 'profile_sleep_poor'
  | 'profile_energy_low'
  | 'profile_stress_high'
  // Workout-derived
  | 'high_weekly_volume'
  | 'consecutive_hard_days'
  | 'straight_arm_accumulation'
  | 'recent_high_rpe_sessions'
  | 'tendon_stress_elevated'
  // Soreness/pain-derived
  | 'soreness_reported_moderate'
  | 'soreness_reported_severe'
  | 'joint_pain_reported'
  // Phase K stress-derived
  | 'week_stress_high'
  | 'adjacent_high_risk_days'
  // Deload-derived
  | 'weeks_since_deload_high'
  | 'performance_stagnation'
  // Missing data
  | 'no_recent_logs'
  | 'no_profile_recovery'
  | 'no_check_in_data'
  | 'insufficient_data'

/**
 * Decision reason codes that explain what actions the snapshot enables or
 * disables. These are consumed by future layers to gate mutations.
 */
export type DecisionReasonCode =
  | 'can_progress_normally'
  | 'should_maintain_not_push'
  | 'should_reduce_volume'
  | 'should_reduce_intensity'
  | 'should_extend_rest'
  | 'should_substitute_tendon'
  | 'should_avoid_pattern'
  | 'deload_monitor_only'
  | 'deload_recommended'
  | 'deload_required'
  | 'insufficient_data_for_decision'

/**
 * RecoveryAdaptationSnapshot — the canonical unified shape that consolidates
 * all recovery/readiness/injury/deload signals into one typed object.
 *
 * This is the SINGLE AUTHORITATIVE contract for recovery-based decisions.
 */
export interface RecoveryAdaptationSnapshot {
  // ----- Readiness classification -----
  readinessLevel: ReadinessLevel
  fatigueLevel: FatigueLevel
  jointRiskLevel: JointRiskLevel
  injuryConstraintLevel: InjuryConstraintLevel
  deloadSignal: DeloadSignal
  missedSessionSignal: MissedSessionSignal

  // ----- Provenance -----
  /** Stable machine reason codes describing limiters that influenced the classification. */
  recoveryLimiterCodes: RecoveryLimiterCode[]
  /** Stable machine reason codes describing enabled/disabled decisions. */
  decisionReasonCodes: DecisionReasonCode[]
  /** Quality of input data sources. */
  sourceQuality: SourceQuality

  // ----- Visible output -----
  /** Short label for proof chips. Null when nothing notable to display. */
  visibleSummaryLabel: string | null
  /** One-liner coach message. Null when no actionable guidance. */
  visibleCoachLine: string | null

  // ----- Decision gates (for future layers) -----
  /** Whether the snapshot has enough confidence to mutate program structure. */
  canMutateProgramNow: boolean
  /** Whether the snapshot has enough confidence to mutate individual sessions. */
  canMutateSessionNow: boolean
  /** When true, snapshot should only produce explanatory text, not mutations. */
  shouldOnlyExplainNow: boolean

  // ----- Timestamp -----
  /** ISO timestamp when this snapshot was derived. */
  derivedAt: string
}

// =============================================================================
// INPUT TYPES — WHAT THE SNAPSHOT DERIVES FROM
// =============================================================================

/**
 * Profile recovery signals from onboarding / settings.
 * These are relatively static but provide baseline context.
 */
export interface ProfileRecoverySignals {
  recoveryQuality: 'good' | 'normal' | 'poor' | null
  sleepQuality: 'good' | 'normal' | 'poor' | null
  energyLevel: 'good' | 'normal' | 'poor' | null
  stressLevel: 'good' | 'normal' | 'poor' | null  // 'good' = low stress
}

/**
 * Recent workout stress signals from Phase K / workout logs.
 */
export interface WorkoutStressSignals {
  recentSessionCount: number
  highStressDays: number
  moderateStressDays: number
  lowStressDays: number
  consecutiveHardDays: number
  adjacentHighRiskCount: number
  daysSinceLastSession: number
  daysSinceDeload: number | null  // null if never deloaded or unknown
}

/**
 * User-reported check-in signals (soreness, motivation, etc.).
 */
export interface CheckInSignals {
  hasRecentCheckIn: boolean
  lastCheckInDaysAgo: number | null
  sorenessLevel: 'none' | 'mild' | 'moderate' | 'severe' | null
  motivationLevel: 'low' | 'moderate' | 'high' | null
  jointPainReported: boolean
  jointPainAreas: string[]
}

/**
 * Combined input for deriving the snapshot.
 */
export interface RecoveryAdaptationInput {
  profileRecovery: ProfileRecoverySignals | null
  workoutStress: WorkoutStressSignals | null
  checkIn: CheckInSignals | null
  /** Phase K stress distribution plan summary, if available. */
  weeklyStressSummary: {
    totalSessions: number
    highStressDays: number
    highRiskAdjacencies: number
  } | null
}

// =============================================================================
// DERIVATION HELPER — SINGLE AUTHORITATIVE OWNER
// =============================================================================

/**
 * Derive a RecoveryAdaptationSnapshot from available input signals.
 *
 * This is the SINGLE pure helper responsible for normalization. It:
 *   - Accepts existing available profile/settings/log/session signals
 *   - Produces a normalized typed snapshot
 *   - Returns "unknown" or empty source quality when data is missing
 *   - Produces visible copy only from real reason codes
 *   - Keeps mutation flags conservative (prefers explain-only when data thin)
 *   - Never invents fake injury/readiness data
 *   - Never mutates program/session directly (S.S1 is foundation only)
 *
 * Pure function — no side effects, safe on server/client/build.
 */
export function deriveRecoveryAdaptationSnapshot(
  input: RecoveryAdaptationInput,
): RecoveryAdaptationSnapshot {
  const limiterCodes: RecoveryLimiterCode[] = []
  const decisionCodes: DecisionReasonCode[] = []

  // ----- Source quality -----
  const sourceQuality = deriveSourceQuality(input)

  // ----- Profile-based signals -----
  const { readinessFromProfile, fatigueFromProfile } = deriveFromProfile(
    input.profileRecovery,
    limiterCodes,
  )

  // ----- Workout-based signals -----
  const { fatigueFromWorkout, jointRiskFromWorkout, deloadFromWorkout } = deriveFromWorkout(
    input.workoutStress,
    input.weeklyStressSummary,
    limiterCodes,
  )

  // ----- Check-in-based signals -----
  const { readinessFromCheckIn, sorenessAdjustment, jointRiskFromCheckIn } = deriveFromCheckIn(
    input.checkIn,
    limiterCodes,
  )

  // ----- Combine into final levels -----
  const readinessLevel = combineReadiness(readinessFromProfile, readinessFromCheckIn, sourceQuality)
  const fatigueLevel = combineFatigue(fatigueFromProfile, fatigueFromWorkout, sourceQuality)
  const jointRiskLevel = combineJointRisk(jointRiskFromWorkout, jointRiskFromCheckIn, sourceQuality)
  const deloadSignal = finalizeDeloadSignal(deloadFromWorkout, fatigueLevel, limiterCodes)

  // ----- Injury constraint (conservative — only from explicit check-in) -----
  const injuryConstraintLevel = deriveInjuryConstraint(input.checkIn, limiterCodes)

  // ----- Missed session signal (placeholder — requires session state) -----
  const missedSessionSignal: MissedSessionSignal = 'none'

  // ----- Decision codes -----
  deriveDecisionCodes(
    readinessLevel,
    fatigueLevel,
    jointRiskLevel,
    deloadSignal,
    sourceQuality,
    decisionCodes,
  )

  // ----- Visible output -----
  const visibleSummaryLabel = deriveVisibleSummaryLabel(
    readinessLevel,
    deloadSignal,
    jointRiskLevel,
    sourceQuality,
  )
  const visibleCoachLine = deriveVisibleCoachLine(
    readinessLevel,
    fatigueLevel,
    deloadSignal,
    sourceQuality,
    limiterCodes,
  )

  // ----- Decision gates (conservative in S.S1) -----
  const hasMinimalData = sourceQuality !== 'empty'
  const hasGoodData = sourceQuality === 'workout_log' || sourceQuality === 'check_in' || sourceQuality === 'mixed'

  return {
    readinessLevel,
    fatigueLevel,
    jointRiskLevel,
    injuryConstraintLevel,
    deloadSignal,
    missedSessionSignal,
    recoveryLimiterCodes: limiterCodes,
    decisionReasonCodes: decisionCodes,
    sourceQuality,
    visibleSummaryLabel,
    visibleCoachLine,
    // S.S1 is foundation-only: mutation gates are conservative
    canMutateProgramNow: false,  // Deferred to S.S2+
    canMutateSessionNow: false,  // Deferred to S.S2+
    shouldOnlyExplainNow: true,  // S.S1 only explains, does not mutate
    derivedAt: new Date().toISOString(),
  }
}

// =============================================================================
// INTERNAL DERIVATION HELPERS
// =============================================================================

function deriveSourceQuality(input: RecoveryAdaptationInput): SourceQuality {
  const hasProfile = input.profileRecovery !== null
  const hasWorkout = input.workoutStress !== null && input.workoutStress.recentSessionCount > 0
  const hasCheckIn = input.checkIn !== null && input.checkIn.hasRecentCheckIn

  if (!hasProfile && !hasWorkout && !hasCheckIn) return 'empty'
  if (hasCheckIn && hasWorkout) return 'mixed'
  if (hasCheckIn) return 'check_in'
  if (hasWorkout) return 'workout_log'
  if (hasProfile) return 'profile_only'
  return 'settings'
}

function deriveFromProfile(
  profile: ProfileRecoverySignals | null,
  limiterCodes: RecoveryLimiterCode[],
): { readinessFromProfile: ReadinessLevel; fatigueFromProfile: FatigueLevel } {
  if (!profile) {
    limiterCodes.push('no_profile_recovery')
    return { readinessFromProfile: 'unknown', fatigueFromProfile: 'unknown' }
  }

  let readinessFromProfile: ReadinessLevel = 'green'
  let fatigueFromProfile: FatigueLevel = 'low'

  // Recovery quality
  if (profile.recoveryQuality === 'poor') {
    limiterCodes.push('profile_recovery_poor')
    readinessFromProfile = downgradeReadiness(readinessFromProfile, 'yellow')
    fatigueFromProfile = upgradeFatigue(fatigueFromProfile, 'moderate')
  } else if (profile.recoveryQuality === 'good') {
    limiterCodes.push('profile_recovery_good')
  } else if (profile.recoveryQuality === 'normal') {
    limiterCodes.push('profile_recovery_normal')
  }

  // Sleep quality
  if (profile.sleepQuality === 'poor') {
    limiterCodes.push('profile_sleep_poor')
    readinessFromProfile = downgradeReadiness(readinessFromProfile, 'yellow')
  }

  // Energy level
  if (profile.energyLevel === 'poor') {
    limiterCodes.push('profile_energy_low')
    readinessFromProfile = downgradeReadiness(readinessFromProfile, 'yellow')
    fatigueFromProfile = upgradeFatigue(fatigueFromProfile, 'moderate')
  }

  // Stress level ('good' = low stress, 'poor' = high stress)
  if (profile.stressLevel === 'poor') {
    limiterCodes.push('profile_stress_high')
    readinessFromProfile = downgradeReadiness(readinessFromProfile, 'yellow')
  }

  return { readinessFromProfile, fatigueFromProfile }
}

function deriveFromWorkout(
  workout: WorkoutStressSignals | null,
  weeklyStress: RecoveryAdaptationInput['weeklyStressSummary'],
  limiterCodes: RecoveryLimiterCode[],
): { fatigueFromWorkout: FatigueLevel; jointRiskFromWorkout: JointRiskLevel; deloadFromWorkout: DeloadSignal } {
  if (!workout || workout.recentSessionCount === 0) {
    limiterCodes.push('no_recent_logs')
    return { fatigueFromWorkout: 'unknown', jointRiskFromWorkout: 'unknown', deloadFromWorkout: 'none' }
  }

  let fatigueFromWorkout: FatigueLevel = 'low'
  let jointRiskFromWorkout: JointRiskLevel = 'low'
  let deloadFromWorkout: DeloadSignal = 'none'

  // High stress days accumulation
  if (workout.highStressDays >= 4) {
    limiterCodes.push('high_weekly_volume')
    fatigueFromWorkout = upgradeFatigue(fatigueFromWorkout, 'high')
  } else if (workout.highStressDays >= 2) {
    fatigueFromWorkout = upgradeFatigue(fatigueFromWorkout, 'moderate')
  }

  // Consecutive hard days
  if (workout.consecutiveHardDays >= 3) {
    limiterCodes.push('consecutive_hard_days')
    fatigueFromWorkout = upgradeFatigue(fatigueFromWorkout, 'high')
    jointRiskFromWorkout = upgradeJointRisk(jointRiskFromWorkout, 'moderate')
  } else if (workout.consecutiveHardDays >= 2) {
    fatigueFromWorkout = upgradeFatigue(fatigueFromWorkout, 'moderate')
  }

  // Adjacent high-risk days (from Phase K)
  if (weeklyStress && weeklyStress.highRiskAdjacencies >= 2) {
    limiterCodes.push('adjacent_high_risk_days')
    jointRiskFromWorkout = upgradeJointRisk(jointRiskFromWorkout, 'high')
    fatigueFromWorkout = upgradeFatigue(fatigueFromWorkout, 'high')
  } else if (weeklyStress && weeklyStress.highRiskAdjacencies >= 1) {
    limiterCodes.push('adjacent_high_risk_days')
    jointRiskFromWorkout = upgradeJointRisk(jointRiskFromWorkout, 'moderate')
  }

  // Weeks since deload
  if (workout.daysSinceDeload !== null && workout.daysSinceDeload >= 42) {
    limiterCodes.push('weeks_since_deload_high')
    deloadFromWorkout = 'monitor'
    if (workout.daysSinceDeload >= 56 && fatigueFromWorkout === 'high') {
      deloadFromWorkout = 'recommended'
    }
  }

  return { fatigueFromWorkout, jointRiskFromWorkout, deloadFromWorkout }
}

function deriveFromCheckIn(
  checkIn: CheckInSignals | null,
  limiterCodes: RecoveryLimiterCode[],
): { readinessFromCheckIn: ReadinessLevel; sorenessAdjustment: number; jointRiskFromCheckIn: JointRiskLevel } {
  if (!checkIn || !checkIn.hasRecentCheckIn) {
    limiterCodes.push('no_check_in_data')
    return { readinessFromCheckIn: 'unknown', sorenessAdjustment: 0, jointRiskFromCheckIn: 'unknown' }
  }

  let readinessFromCheckIn: ReadinessLevel = 'green'
  let sorenessAdjustment = 0
  let jointRiskFromCheckIn: JointRiskLevel = 'low'

  // Soreness
  if (checkIn.sorenessLevel === 'severe') {
    limiterCodes.push('soreness_reported_severe')
    readinessFromCheckIn = 'red'
    sorenessAdjustment = -30
  } else if (checkIn.sorenessLevel === 'moderate') {
    limiterCodes.push('soreness_reported_moderate')
    readinessFromCheckIn = 'orange'
    sorenessAdjustment = -15
  } else if (checkIn.sorenessLevel === 'mild') {
    readinessFromCheckIn = 'yellow'
    sorenessAdjustment = -5
  }

  // Motivation (affects readiness if low)
  if (checkIn.motivationLevel === 'low') {
    readinessFromCheckIn = downgradeReadiness(readinessFromCheckIn, 'yellow')
  }

  // Joint pain
  if (checkIn.jointPainReported) {
    limiterCodes.push('joint_pain_reported')
    jointRiskFromCheckIn = 'high'
    readinessFromCheckIn = downgradeReadiness(readinessFromCheckIn, 'orange')
  }

  return { readinessFromCheckIn, sorenessAdjustment, jointRiskFromCheckIn }
}

function deriveInjuryConstraint(
  checkIn: CheckInSignals | null,
  _limiterCodes: RecoveryLimiterCode[],
): InjuryConstraintLevel {
  if (!checkIn) return 'none'

  if (checkIn.jointPainReported && checkIn.jointPainAreas.length > 0) {
    // S.S1 is conservative: only "watch" from check-in signals
    // "limit" and "avoid" require explicit user injury selection (future S.S3)
    return 'watch'
  }

  return 'none'
}

// ----- Combination helpers -----

function combineReadiness(
  fromProfile: ReadinessLevel,
  fromCheckIn: ReadinessLevel,
  sourceQuality: SourceQuality,
): ReadinessLevel {
  if (sourceQuality === 'empty') return 'unknown'

  // Check-in is more recent/specific, so it takes priority
  if (fromCheckIn !== 'unknown') return fromCheckIn
  if (fromProfile !== 'unknown') return fromProfile
  return 'unknown'
}

function combineFatigue(
  fromProfile: FatigueLevel,
  fromWorkout: FatigueLevel,
  sourceQuality: SourceQuality,
): FatigueLevel {
  if (sourceQuality === 'empty') return 'unknown'

  // Take the worse of the two
  const levels: FatigueLevel[] = ['unknown', 'low', 'moderate', 'high', 'very_high']
  const profileIdx = levels.indexOf(fromProfile)
  const workoutIdx = levels.indexOf(fromWorkout)

  // If both unknown, stay unknown
  if (profileIdx <= 0 && workoutIdx <= 0) return 'unknown'

  // Take the higher (worse) fatigue level
  return levels[Math.max(profileIdx, workoutIdx)] as FatigueLevel
}

function combineJointRisk(
  fromWorkout: JointRiskLevel,
  fromCheckIn: JointRiskLevel,
  sourceQuality: SourceQuality,
): JointRiskLevel {
  if (sourceQuality === 'empty') return 'unknown'

  // Take the worse of the two
  const levels: JointRiskLevel[] = ['unknown', 'low', 'moderate', 'high']
  const workoutIdx = levels.indexOf(fromWorkout)
  const checkInIdx = levels.indexOf(fromCheckIn)

  if (workoutIdx <= 0 && checkInIdx <= 0) return 'unknown'

  return levels[Math.max(workoutIdx, checkInIdx)] as JointRiskLevel
}

function finalizeDeloadSignal(
  fromWorkout: DeloadSignal,
  fatigueLevel: FatigueLevel,
  limiterCodes: RecoveryLimiterCode[],
): DeloadSignal {
  // Escalate deload if fatigue is very high
  if (fatigueLevel === 'very_high' && fromWorkout === 'none') {
    return 'monitor'
  }
  if (fatigueLevel === 'very_high' && fromWorkout === 'monitor') {
    return 'recommended'
  }
  return fromWorkout
}

// ----- Level upgrade/downgrade helpers -----

function downgradeReadiness(current: ReadinessLevel, target: ReadinessLevel): ReadinessLevel {
  const order: ReadinessLevel[] = ['green', 'yellow', 'orange', 'red']
  const currentIdx = order.indexOf(current)
  const targetIdx = order.indexOf(target)
  if (currentIdx === -1) return target
  if (targetIdx === -1) return current
  return order[Math.max(currentIdx, targetIdx)] as ReadinessLevel
}

function upgradeFatigue(current: FatigueLevel, target: FatigueLevel): FatigueLevel {
  const order: FatigueLevel[] = ['low', 'moderate', 'high', 'very_high']
  const currentIdx = order.indexOf(current)
  const targetIdx = order.indexOf(target)
  if (currentIdx === -1) return target
  if (targetIdx === -1) return current
  return order[Math.max(currentIdx, targetIdx)] as FatigueLevel
}

function upgradeJointRisk(current: JointRiskLevel, target: JointRiskLevel): JointRiskLevel {
  const order: JointRiskLevel[] = ['low', 'moderate', 'high']
  const currentIdx = order.indexOf(current)
  const targetIdx = order.indexOf(target)
  if (currentIdx === -1) return target
  if (targetIdx === -1) return current
  return order[Math.max(currentIdx, targetIdx)] as JointRiskLevel
}

// ----- Decision codes derivation -----

function deriveDecisionCodes(
  readiness: ReadinessLevel,
  fatigue: FatigueLevel,
  jointRisk: JointRiskLevel,
  deload: DeloadSignal,
  sourceQuality: SourceQuality,
  codes: DecisionReasonCode[],
): void {
  if (sourceQuality === 'empty') {
    codes.push('insufficient_data_for_decision')
    return
  }

  // Deload signals
  if (deload === 'required') {
    codes.push('deload_required')
  } else if (deload === 'recommended') {
    codes.push('deload_recommended')
  } else if (deload === 'monitor') {
    codes.push('deload_monitor_only')
  }

  // Readiness-based decisions
  if (readiness === 'green' && fatigue !== 'high' && fatigue !== 'very_high') {
    codes.push('can_progress_normally')
  } else if (readiness === 'yellow') {
    codes.push('should_maintain_not_push')
  } else if (readiness === 'orange') {
    codes.push('should_reduce_volume')
    codes.push('should_extend_rest')
  } else if (readiness === 'red') {
    codes.push('should_reduce_volume')
    codes.push('should_reduce_intensity')
    codes.push('should_extend_rest')
  }

  // Joint risk decisions
  if (jointRisk === 'high') {
    codes.push('should_substitute_tendon')
  } else if (jointRisk === 'moderate') {
    codes.push('should_extend_rest')
  }
}

// ----- Visible output derivation -----

function deriveVisibleSummaryLabel(
  readiness: ReadinessLevel,
  deload: DeloadSignal,
  jointRisk: JointRiskLevel,
  sourceQuality: SourceQuality,
): string | null {
  if (sourceQuality === 'empty') return null

  if (deload === 'required') return 'Deload recommended'
  if (deload === 'recommended') return 'Recovery watch'
  if (jointRisk === 'high') return 'Joint care'

  if (readiness === 'red') return 'Recovery day'
  if (readiness === 'orange') return 'Lighter day'
  if (readiness === 'yellow') return 'Maintain focus'
  if (readiness === 'green') return null  // No chip needed when all good

  return null
}

function deriveVisibleCoachLine(
  readiness: ReadinessLevel,
  fatigue: FatigueLevel,
  deload: DeloadSignal,
  sourceQuality: SourceQuality,
  limiterCodes: RecoveryLimiterCode[],
): string | null {
  if (sourceQuality === 'empty') {
    return 'Recovery status: not enough recent data yet'
  }

  if (sourceQuality === 'profile_only') {
    return 'Recovery signals from profile only — log sessions for better guidance'
  }

  if (deload === 'required') {
    return 'Consider a deload week to restore performance capacity'
  }

  if (deload === 'recommended') {
    return 'Accumulated stress is elevated — a deload would be beneficial'
  }

  if (deload === 'monitor') {
    return 'Watching recovery — maintain quality over intensity this week'
  }

  if (limiterCodes.includes('joint_pain_reported')) {
    return 'Joint discomfort noted — prioritize conservative progressions'
  }

  if (limiterCodes.includes('consecutive_hard_days')) {
    return 'Multiple hard days in a row — extra rest between sets today'
  }

  if (limiterCodes.includes('soreness_reported_severe')) {
    return 'Significant soreness — active recovery recommended'
  }

  if (limiterCodes.includes('soreness_reported_moderate')) {
    return 'Moderate soreness — maintain movement quality over volume'
  }

  if (readiness === 'red') {
    return 'Recovery day indicated — light movement or rest'
  }

  if (readiness === 'orange') {
    return 'Elevated fatigue — train at controlled intensity'
  }

  if (readiness === 'yellow') {
    return 'Good baseline — maintain focus without pushing PRs'
  }

  if (readiness === 'green' && fatigue === 'low') {
    return null  // No coach line when everything is optimal
  }

  return null
}

// =============================================================================
// UTILITY — BUILD INPUT FROM CANONICAL SOURCES
// =============================================================================

/**
 * Build RecoveryAdaptationInput from canonical profile.
 * This helper extracts the relevant fields from the canonical profile shape.
 */
export function buildProfileRecoverySignals(canonicalProfile: {
  recoveryQuality?: string | null
  recoveryRaw?: {
    sleepQuality?: string | null
    energyLevel?: string | null
    stressLevel?: string | null
  } | null
}): ProfileRecoverySignals | null {
  if (!canonicalProfile.recoveryQuality && !canonicalProfile.recoveryRaw) {
    return null
  }

  return {
    recoveryQuality: normalizeRecoveryValue(canonicalProfile.recoveryQuality),
    sleepQuality: normalizeRecoveryValue(canonicalProfile.recoveryRaw?.sleepQuality),
    energyLevel: normalizeRecoveryValue(canonicalProfile.recoveryRaw?.energyLevel),
    stressLevel: normalizeRecoveryValue(canonicalProfile.recoveryRaw?.stressLevel),
  }
}

function normalizeRecoveryValue(value: string | null | undefined): 'good' | 'normal' | 'poor' | null {
  if (!value) return null
  const lower = value.toLowerCase()
  if (lower === 'good') return 'good'
  if (lower === 'normal') return 'normal'
  if (lower === 'poor') return 'poor'
  return null
}

/**
 * Build WorkoutStressSignals from Phase K weekly stress distribution summary.
 */
export function buildWorkoutStressSignalsFromPhaseK(
  weeklyStressSummary: {
    totalSessions: number
    highStressDays: number
    moderateStressDays: number
    lowStressDays: number
    highRiskAdjacencies: number
  } | null,
  additionalContext?: {
    daysSinceLastSession?: number
    daysSinceDeload?: number | null
    consecutiveHardDays?: number
  },
): WorkoutStressSignals | null {
  if (!weeklyStressSummary) return null

  return {
    recentSessionCount: weeklyStressSummary.totalSessions,
    highStressDays: weeklyStressSummary.highStressDays,
    moderateStressDays: weeklyStressSummary.moderateStressDays,
    lowStressDays: weeklyStressSummary.lowStressDays,
    consecutiveHardDays: additionalContext?.consecutiveHardDays ?? 0,
    adjacentHighRiskCount: weeklyStressSummary.highRiskAdjacencies,
    daysSinceLastSession: additionalContext?.daysSinceLastSession ?? 0,
    daysSinceDeload: additionalContext?.daysSinceDeload ?? null,
  }
}

// =============================================================================
// PHASE L2 — USER CHECK-IN INPUT TYPES AND ADAPTERS
// =============================================================================

/**
 * User-entered readiness check-in input (L2). This is captured via UI and
 * converted into CheckInSignals for the L1 snapshot derivation.
 */
export interface RecoveryReadinessCheckIn {
  /** How ready does the user feel to train today? */
  readinessToday: 'great' | 'normal' | 'low' | 'very_low' | null
  /** Current soreness level */
  sorenessLevel: 'none' | 'mild' | 'moderate' | 'severe' | null
  /** Sleep/recovery quality last night */
  sleepQuality: 'good' | 'normal' | 'poor' | 'very_poor' | null
  /** Any joint pain? */
  jointPainReported: boolean
  /** Which joints hurt (if any) */
  jointPainAreas: string[]
  /** Free-text notes */
  notes: string | null
  /** When this check-in was captured */
  capturedAt: string
}

/**
 * Create an empty/default check-in (user skipped or hasn't checked in).
 */
export function createEmptyCheckIn(): RecoveryReadinessCheckIn {
  return {
    readinessToday: null,
    sorenessLevel: null,
    sleepQuality: null,
    jointPainReported: false,
    jointPainAreas: [],
    notes: null,
    capturedAt: new Date().toISOString(),
  }
}

/**
 * Convert user check-in input into CheckInSignals for the L1 snapshot.
 * This adapter normalizes the UI input shape into the contract's expected shape.
 */
export function buildCheckInSignalsFromUserInput(
  checkIn: RecoveryReadinessCheckIn | null,
  lastCheckInDaysAgo?: number,
): CheckInSignals {
  if (!checkIn || (!checkIn.readinessToday && !checkIn.sorenessLevel && !checkIn.sleepQuality)) {
    return {
      hasRecentCheckIn: false,
      lastCheckInDaysAgo: null,
      sorenessLevel: null,
      motivationLevel: null,
      jointPainReported: false,
      jointPainAreas: [],
    }
  }

  // Map readiness to motivation (rough equivalence for L1 contract)
  const motivationLevel: 'low' | 'moderate' | 'high' | null =
    checkIn.readinessToday === 'great' ? 'high' :
    checkIn.readinessToday === 'normal' ? 'moderate' :
    checkIn.readinessToday === 'low' ? 'low' :
    checkIn.readinessToday === 'very_low' ? 'low' :
    null

  return {
    hasRecentCheckIn: true,
    lastCheckInDaysAgo: lastCheckInDaysAgo ?? 0,
    sorenessLevel: checkIn.sorenessLevel,
    motivationLevel,
    jointPainReported: checkIn.jointPainReported,
    jointPainAreas: checkIn.jointPainAreas,
  }
}

/**
 * Adapter from existing recovery-fatigue-engine's UserRecoveryInput format
 * to our L1/L2 RecoveryReadinessCheckIn. Allows reusing existing localStorage
 * data if available.
 */
export function adaptLegacyRecoveryInput(
  legacyInput: {
    date: string
    sleepQuality?: 'poor' | 'moderate' | 'good'
    soreness?: 'none' | 'mild' | 'moderate' | 'severe'
    motivation?: 'low' | 'moderate' | 'high'
    notes?: string
  } | null,
): RecoveryReadinessCheckIn | null {
  if (!legacyInput) return null

  // Map legacy sleep quality
  const sleepQuality: RecoveryReadinessCheckIn['sleepQuality'] =
    legacyInput.sleepQuality === 'good' ? 'good' :
    legacyInput.sleepQuality === 'moderate' ? 'normal' :
    legacyInput.sleepQuality === 'poor' ? 'poor' :
    null

  // Map legacy motivation to readiness
  const readinessToday: RecoveryReadinessCheckIn['readinessToday'] =
    legacyInput.motivation === 'high' ? 'great' :
    legacyInput.motivation === 'moderate' ? 'normal' :
    legacyInput.motivation === 'low' ? 'low' :
    null

  // Detect joint pain from notes (basic keyword scan)
  const notesLower = (legacyInput.notes || '').toLowerCase()
  const jointKeywords = ['joint', 'wrist', 'elbow', 'shoulder', 'back', 'hip', 'knee', 'ankle', 'pain']
  const jointPainReported = jointKeywords.some(kw => notesLower.includes(kw))
  const jointPainAreas: string[] = []
  if (notesLower.includes('wrist')) jointPainAreas.push('wrist')
  if (notesLower.includes('elbow')) jointPainAreas.push('elbow')
  if (notesLower.includes('shoulder')) jointPainAreas.push('shoulder')
  if (notesLower.includes('back')) jointPainAreas.push('back')
  if (notesLower.includes('hip')) jointPainAreas.push('hip')
  if (notesLower.includes('knee')) jointPainAreas.push('knee')
  if (notesLower.includes('ankle')) jointPainAreas.push('ankle')

  return {
    readinessToday,
    sorenessLevel: legacyInput.soreness ?? null,
    sleepQuality,
    jointPainReported,
    jointPainAreas,
    notes: legacyInput.notes ?? null,
    capturedAt: new Date(legacyInput.date).toISOString(),
  }
}

/**
 * Derive visible recovery status label from the snapshot — for UI display.
 * Returns a compact, truthful label or null when nothing notable.
 */
export function getRecoveryStatusLabel(snapshot: RecoveryAdaptationSnapshot): string | null {
  // Priority: deload > injury > readiness
  if (snapshot.deloadSignal === 'required') {
    return 'Deload recommended'
  }
  if (snapshot.injuryConstraintLevel === 'avoid') {
    return 'Injury watch — limit painful movements'
  }
  if (snapshot.injuryConstraintLevel === 'limit') {
    return 'Joint watch — conservative progressions'
  }
  if (snapshot.readinessLevel === 'red') {
    return 'Low readiness — recovery focus'
  }
  if (snapshot.readinessLevel === 'orange') {
    return 'Reduced readiness — maintain quality'
  }
  if (snapshot.sourceQuality === 'empty') {
    return null // Don't show "no data" label, just hide
  }
  if (snapshot.readinessLevel === 'green' && snapshot.fatigueLevel === 'low') {
    return 'Ready to push'
  }
  return null
}

// =============================================================================
// PHASE L4 — DELOAD RECOMMENDATION DECISION LAYER (Step 21.4.1)
// =============================================================================

/**
 * Deload recommendation level — a ladder of increasingly strong recommendations.
 * This is ADVISORY ONLY in L4 — no automatic program mutation occurs.
 */
export type DeloadRecommendationLevel =
  | 'NONE'                      // No deload needed
  | 'WATCH'                     // Mild strain, monitor recovery
  | 'CONSIDER_DELOAD'           // Moderate strain, consider lighter training
  | 'STRONGLY_RECOMMEND_DELOAD' // High strain, deload strongly recommended

/**
 * Reason codes explaining WHY a deload recommendation was made.
 * Machine-readable, stable tokens for debugging/testing/future rule consumption.
 */
export type DeloadReasonCode =
  | 'LOW_READINESS'
  | 'HIGH_FATIGUE'
  | 'VERY_HIGH_FATIGUE'
  | 'HIGH_SORENESS'
  | 'SEVERE_SORENESS'
  | 'POOR_SLEEP'
  | 'JOINT_PAIN_REPORTED'
  | 'INJURY_CONSTRAINT_ACTIVE'
  | 'MISSED_OR_PARTIAL_SESSION'
  | 'HIGH_WEEKLY_STRESS'
  | 'CONSECUTIVE_HARD_DAYS'
  | 'WEEKS_SINCE_DELOAD_HIGH'
  | 'PERFORMANCE_STAGNATION'
  | 'MULTIPLE_STRAIN_FACTORS'
  | 'RED_READINESS'
  | 'ORANGE_READINESS'
  | 'DELOAD_SIGNAL_REQUIRED'
  | 'DELOAD_SIGNAL_RECOMMENDED'
  | 'NO_DELOAD_FACTORS'

/**
 * Source signal snapshot for the deload recommendation — tracks what inputs
 * were used to make the decision.
 */
export interface DeloadSourceSignals {
  readinessLevel: ReadinessLevel | null
  fatigueLevel: FatigueLevel | null
  sorenessLevel: string | null
  sleepQuality: string | null
  jointPainReported: boolean
  jointPainAreas: string[]
  injuryConstraintLevel: InjuryConstraintLevel | null
  missedSessionSignal: MissedSessionSignal | null
  deloadSignalFromSnapshot: DeloadSignal | null
  weeklyStressSignal: string | null
  daysSinceDeload: number | null
  sourceQuality: SourceQuality | null
}

/**
 * DeloadRecommendationDecision — the L4 canonical deload recommendation object.
 *
 * This is ADVISORY ONLY. It computes and exposes a deload recommendation
 * based on L1/L2/L3 signals but does NOT mutate workouts, programs, or sessions.
 *
 * Future phases (L6+) may consume this decision to actually apply deloads.
 */
export interface DeloadRecommendationDecision {
  // ----- Recommendation state -----
  active: boolean
  recommendationLevel: DeloadRecommendationLevel
  recommendationLabel: string
  
  // ----- Reason tracing -----
  recommendationReasonCodes: DeloadReasonCode[]
  primaryDrivers: string[]
  
  // ----- Source signals -----
  sourceSignals: DeloadSourceSignals
  
  // ----- User-facing output -----
  userFacingSummary: string
  
  // ----- Non-mutation guarantees (L4 is advisory only) -----
  appliedToProgram: false
  mutationAllowed: false
  recommendationOnly: true
  
  // ----- Timestamp -----
  generatedAt: string
}

/**
 * Derive a DeloadRecommendationDecision from a RecoveryAdaptationSnapshot
 * and optional L2 check-in data.
 *
 * This is the SINGLE pure L4 helper. It:
 *   - Reads existing L1 snapshot fields
 *   - Optionally incorporates L2 check-in signals
 *   - Produces a recommendation level with reason codes
 *   - Returns user-facing summary text
 *   - Guarantees appliedToProgram=false and mutationAllowed=false
 *
 * Pure function — no side effects, safe on server/client/build.
 */
export function deriveDeloadRecommendation(
  snapshot: RecoveryAdaptationSnapshot | null,
  checkIn: RecoveryReadinessCheckIn | null = null,
): DeloadRecommendationDecision {
  const reasonCodes: DeloadReasonCode[] = []
  const primaryDrivers: string[] = []
  const now = new Date().toISOString()
  
  // Build source signals snapshot
  const sourceSignals: DeloadSourceSignals = {
    readinessLevel: snapshot?.readinessLevel ?? null,
    fatigueLevel: snapshot?.fatigueLevel ?? null,
    sorenessLevel: checkIn?.sorenessLevel ?? null,
    sleepQuality: checkIn?.sleepQuality ?? null,
    jointPainReported: checkIn?.jointPainReported ?? false,
    jointPainAreas: checkIn?.jointPainAreas ?? [],
    injuryConstraintLevel: snapshot?.injuryConstraintLevel ?? null,
    missedSessionSignal: snapshot?.missedSessionSignal ?? null,
    deloadSignalFromSnapshot: snapshot?.deloadSignal ?? null,
    weeklyStressSignal: null, // Can be extended with Phase K data
    daysSinceDeload: null,    // Can be extended with workout log data
    sourceQuality: snapshot?.sourceQuality ?? null,
  }
  
  // ----- No snapshot = no recommendation -----
  if (!snapshot) {
    return {
      active: false,
      recommendationLevel: 'NONE',
      recommendationLabel: 'No data',
      recommendationReasonCodes: ['NO_DELOAD_FACTORS'],
      primaryDrivers: ['Insufficient recovery data'],
      sourceSignals,
      userFacingSummary: 'Not enough recovery data to make a recommendation.',
      appliedToProgram: false,
      mutationAllowed: false,
      recommendationOnly: true,
      generatedAt: now,
    }
  }
  
  // ----- Collect strain factors -----
  let strainScore = 0
  
  // Readiness factors
  if (snapshot.readinessLevel === 'red') {
    reasonCodes.push('RED_READINESS')
    reasonCodes.push('LOW_READINESS')
    primaryDrivers.push('Low readiness')
    strainScore += 3
  } else if (snapshot.readinessLevel === 'orange') {
    reasonCodes.push('ORANGE_READINESS')
    primaryDrivers.push('Reduced readiness')
    strainScore += 2
  }
  
  // Fatigue factors
  if (snapshot.fatigueLevel === 'very_high') {
    reasonCodes.push('VERY_HIGH_FATIGUE')
    primaryDrivers.push('Very high fatigue')
    strainScore += 3
  } else if (snapshot.fatigueLevel === 'high') {
    reasonCodes.push('HIGH_FATIGUE')
    primaryDrivers.push('High fatigue')
    strainScore += 2
  }
  
  // Soreness factors (from check-in)
  if (checkIn?.sorenessLevel === 'severe') {
    reasonCodes.push('SEVERE_SORENESS')
    primaryDrivers.push('Severe soreness')
    strainScore += 3
  } else if (checkIn?.sorenessLevel === 'moderate') {
    reasonCodes.push('HIGH_SORENESS')
    primaryDrivers.push('Moderate soreness')
    strainScore += 1
  }
  
  // Sleep factors (from check-in)
  if (checkIn?.sleepQuality === 'very_poor' || checkIn?.sleepQuality === 'poor') {
    reasonCodes.push('POOR_SLEEP')
    primaryDrivers.push('Poor sleep quality')
    strainScore += 1
  }
  
  // Joint pain factors
  if (checkIn?.jointPainReported || snapshot.jointRiskLevel === 'high') {
    reasonCodes.push('JOINT_PAIN_REPORTED')
    primaryDrivers.push('Joint pain reported')
    strainScore += 2
  }
  
  // Injury constraint factors
  if (snapshot.injuryConstraintLevel === 'avoid') {
    reasonCodes.push('INJURY_CONSTRAINT_ACTIVE')
    primaryDrivers.push('Injury constraint active')
    strainScore += 2
  } else if (snapshot.injuryConstraintLevel === 'limit') {
    strainScore += 1
  }
  
  // Missed session factors
  if (snapshot.missedSessionSignal === 'missed' || snapshot.missedSessionSignal === 'partial') {
    reasonCodes.push('MISSED_OR_PARTIAL_SESSION')
    primaryDrivers.push('Missed or partial session')
    strainScore += 1
  }
  
  // Existing deload signal from L1 snapshot
  if (snapshot.deloadSignal === 'required') {
    reasonCodes.push('DELOAD_SIGNAL_REQUIRED')
    strainScore += 2
  } else if (snapshot.deloadSignal === 'recommended') {
    reasonCodes.push('DELOAD_SIGNAL_RECOMMENDED')
    strainScore += 1
  }
  
  // Check for multiple strain factors
  if (reasonCodes.length >= 3) {
    reasonCodes.push('MULTIPLE_STRAIN_FACTORS')
  }
  
  // ----- Derive recommendation level from strain score -----
  let recommendationLevel: DeloadRecommendationLevel
  let recommendationLabel: string
  let userFacingSummary: string
  
  if (strainScore >= 5) {
    recommendationLevel = 'STRONGLY_RECOMMEND_DELOAD'
    recommendationLabel = 'Deload strongly recommended'
    userFacingSummary = 'Multiple strain signals are elevated. A deload is strongly recommended before pushing intensity.'
  } else if (strainScore >= 3) {
    recommendationLevel = 'CONSIDER_DELOAD'
    recommendationLabel = 'Consider a deload'
    userFacingSummary = 'Recovery signals suggest considering a lighter training day or deload.'
  } else if (strainScore >= 1) {
    recommendationLevel = 'WATCH'
    recommendationLabel = 'Recovery watch'
    userFacingSummary = 'Some recovery strain is showing. Train carefully and monitor performance.'
  } else {
    recommendationLevel = 'NONE'
    recommendationLabel = 'Recovery acceptable'
    userFacingSummary = 'Recovery looks acceptable today. Continue as planned.'
    reasonCodes.push('NO_DELOAD_FACTORS')
  }
  
  const active = recommendationLevel !== 'NONE'
  
  return {
    active,
    recommendationLevel,
    recommendationLabel,
    recommendationReasonCodes: reasonCodes,
    primaryDrivers: primaryDrivers.length > 0 ? primaryDrivers : ['No significant strain factors'],
    sourceSignals,
    userFacingSummary,
    appliedToProgram: false,
    mutationAllowed: false,
    recommendationOnly: true,
    generatedAt: now,
  }
}

/**
 * Get a compact display object for the deload recommendation.
 * For use in UI proof chips and data attributes.
 */
export function getDeloadRecommendationDisplay(decision: DeloadRecommendationDecision): {
  level: DeloadRecommendationLevel
  label: string
  summary: string
  active: boolean
  reasonCount: number
  appliedToProgram: boolean
} {
  return {
    level: decision.recommendationLevel,
    label: decision.recommendationLabel,
    summary: decision.userFacingSummary,
    active: decision.active,
    reasonCount: decision.recommendationReasonCodes.length,
    appliedToProgram: decision.appliedToProgram,
  }
}
