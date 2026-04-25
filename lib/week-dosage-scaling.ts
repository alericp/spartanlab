/**
 * Week Dosage Scaling Service
 * 
 * =============================================================================
 * PHASE: WEEK PROGRESSION TRUTH
 * =============================================================================
 * 
 * This service provides REAL week-over-week progression by computing
 * scaled dosage based on the current weekNumber. The stored program contains
 * week 1 (acclimation) dosage, and this service DERIVES the correct dosage
 * for week 2, 3, 4 etc. at display/consumption time.
 * 
 * CORE PRINCIPLES:
 * - Week 1 = stored acclimation dosage (conservative first-week values)
 * - Week 2+ = scaled UP from acclimation to normal/progressive dosage
 * - Scaling is computed, not stored - preserves program identity
 * - Week 4 may include slight deload or maintain progression
 * 
 * DOSAGE SCALING PHILOSOPHY:
 * - Week 1: ~70-80% of normal volume/intensity (acclimation)
 * - Week 2: ~90% of normal volume, normal intensity
 * - Week 3: 100% normal volume and intensity
 * - Week 4: 95-100% or slight deload depending on cycle design
 */

import type { AdaptiveSession, AdaptiveExercise } from './adaptive-program-builder'

// =============================================================================
// TYPES
// =============================================================================

export interface WeekDosageScalingResult {
  weekNumber: number
  scalingApplied: boolean
  phaseLabel: 'acclimation' | 'ramp_up' | 'peak' | 'consolidation'
  volumeMultiplier: number
  intensityMultiplier: number
  holdDurationMultiplier: number
  restMultiplier: number // >1 = more rest for early weeks, <1 = less rest for peak weeks
  scalingReason: string
  // [DOCTRINE-STRENGTHENING] Session character flags for visible week differentiation
  densityAllowed: boolean // Can include density blocks/supersets
  finishersAllowed: boolean // Can include finisher exercises
  skillExposureLevel: 'conservative' | 'moderate' | 'full' // How much skill work is allowed
  sessionIntensityCap: number // Max RPE allowed (6-10 scale)
}

export interface ScaledExercise extends AdaptiveExercise {
  // Scaled values for display
  scaledSets?: number
  scaledReps?: string
  scaledHoldDuration?: number
  scaledTargetRPE?: number
  scaledRestPeriod?: number
  // Metadata about scaling
  weekScalingApplied?: boolean
  originalSets?: number
  originalReps?: string
  originalTargetRPE?: number
}

export interface ScaledSession extends Omit<AdaptiveSession, 'exercises'> {
  exercises: ScaledExercise[]
  weekScalingApplied: boolean
  weekNumber: number
  dosageScaling: WeekDosageScalingResult
  // [DOCTRINE-STRENGTHENING] Session-level week character flags
  weekCharacter: {
    densityAllowed: boolean
    finishersAllowed: boolean
    skillExposureLevel: 'conservative' | 'moderate' | 'full'
    sessionIntensityCap: number
    phaseLabel: 'acclimation' | 'ramp_up' | 'peak' | 'consolidation'
  }
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Week-specific scaling factors
 * These define how dosage scales across a 4-week cycle
 * 
 * [DOCTRINE-STRENGTHENING] Made multipliers MORE PRONOUNCED so users can actually
 * see meaningful week-to-week differences in their program:
 * - Week 1: 2 sets base (conservative acclimation)
 * - Week 2: 3 sets (ramp-up, +50% from base)
 * - Week 3: 4 sets (peak, +100% from base)
 * - Week 4: 3 sets (consolidation, maintain without overreaching)
 */
const WEEK_SCALING_PROFILES: Record<number, WeekDosageScalingResult> = {
  1: {
    weekNumber: 1,
    scalingApplied: false, // Week 1 uses stored acclimation values as-is
    phaseLabel: 'acclimation',
    volumeMultiplier: 1.0, // Base acclimation - typically 2 sets per exercise
    intensityMultiplier: 1.0, // Conservative RPE
    holdDurationMultiplier: 1.0, // Base hold times
    restMultiplier: 1.2, // MORE rest in acclimation (longer recovery)
    scalingReason: 'Acclimation: Conservative entry with reduced volume and extended rest',
    // [DOCTRINE] Week 1 is protective - no density, no finishers, capped intensity
    densityAllowed: false,
    finishersAllowed: false,
    skillExposureLevel: 'conservative',
    sessionIntensityCap: 7,
  },
  2: {
    weekNumber: 2,
    scalingApplied: true,
    phaseLabel: 'ramp_up',
    volumeMultiplier: 1.50, // 50% more sets (2→3 sets)
    intensityMultiplier: 1.10, // Moderate RPE increase
    holdDurationMultiplier: 1.25, // 25% longer holds
    restMultiplier: 1.0, // Normal rest periods
    scalingReason: 'Ramp-Up: Building toward full training capacity',
    // [DOCTRINE] Week 2 starts to open up - some density allowed
    densityAllowed: true,
    finishersAllowed: false,
    skillExposureLevel: 'moderate',
    sessionIntensityCap: 8,
  },
  3: {
    weekNumber: 3,
    scalingApplied: true,
    phaseLabel: 'peak',
    volumeMultiplier: 2.0, // Double the sets (2→4 sets)
    intensityMultiplier: 1.15, // Higher RPE targets
    holdDurationMultiplier: 1.50, // 50% longer holds
    restMultiplier: 0.85, // Reduced rest for density
    scalingReason: 'Peak: Maximum productive volume and intensity',
    // [DOCTRINE] Week 3 is full exposure - everything allowed
    densityAllowed: true,
    finishersAllowed: true,
    skillExposureLevel: 'full',
    sessionIntensityCap: 9,
  },
  4: {
    weekNumber: 4,
    scalingApplied: true,
    phaseLabel: 'consolidation',
    volumeMultiplier: 1.80, // 90% of peak (slightly reduced from 100%, not a full deload)
    intensityMultiplier: 1.12, // Maintain intensity but reduce volume stress
    holdDurationMultiplier: 1.40, // Moderate-high holds
    restMultiplier: 0.90, // Moderate rest (between ramp-up and peak)
    scalingReason: 'Consolidation: Maintain adaptations while managing fatigue',
    // [DOCTRINE] Week 4 consolidates - maintain quality but reduce stress
    densityAllowed: true,
    finishersAllowed: false, // No finishers - focus on core work
    skillExposureLevel: 'moderate',
    sessionIntensityCap: 8,
  },
}

// =============================================================================
// MAIN SCALING FUNCTIONS
// =============================================================================

/**
 * Get the dosage scaling profile for a given week number
 */
export function getWeekDosageScaling(weekNumber: number): WeekDosageScalingResult {
  // Clamp to valid range
  const clampedWeek = Math.max(1, Math.min(4, weekNumber))
  return WEEK_SCALING_PROFILES[clampedWeek] || WEEK_SCALING_PROFILES[1]
}

// =============================================================================
// [BASE-WEEK-AUTHORITY-LOCK] ROLE-AWARE PHASE SCALING GUARDRAILS
// =============================================================================
//
// PURPOSE
// -------
// The weekly-session-role-contract (lib/program/weekly-session-role-contract.ts)
// is the AUTHORITATIVE base-week composition layer. It assigns each day a role
// (primary_strength_emphasis / skill_quality_emphasis / broad_mixed_volume /
// secondary_support / density_capacity / recovery_supportive) and an
// authoritative `prescriptionShape` with `setsBias`, `rpeCap`, `repIntent`,
// `progressionAggressiveness`. The builder consumes that contract once during
// prescription-shaping (adaptive-program-builder.ts ~line 12012) so the BASE
// WEEK already reads with role-correct sets, reps, and RPE.
//
// THE BUG THIS LOCK CLOSES
// -------------------------
// `scaleExerciseForWeek` previously applied the same volume / intensity
// multipliers to EVERY row regardless of role:
//   - Week 3 peak: 2.0× sets, 1.15× RPE
//   - Week 4 consolidation: 1.8× sets, 1.12× RPE
// A recovery_supportive day with `setsBias: -1` and `rpeCap: 6` (giving 2
// sets at RPE 6 in week 1) was inflated to 4 sets at RPE 7+ in week 3.
// A skill_quality_emphasis day with `rpeCap: 7` was inflated to RPE 8+.
// A density_capacity day already carried high method fatigue from supersets
// /circuits, then was multiplied by 2.0× on top.
//
// In short: PHASE SCALING WAS OVERRIDING THE ROLE CONTRACT. The user's
// observation — "weekly scaling appears to be scaling a too-generic base"
// — was exactly this: scaling was scaling a base that LOOKED generic
// because the role contract had been overwritten by the multiplier.
//
// THE LOCK
// --------
// Phase scaling is now SUBORDINATE to the role contract. For each role:
//   1. `volumeMultiplier` is capped at a role-specific ceiling. Recovery and
//      skill-quality days never grow past 1.0× (they hold their base).
//      Heavy days cap at 1.5× (a heavy day getting doubled grinds to mush).
//      Only broad_mixed / secondary_support / density days take the full
//      phase multiplier, and density caps slightly lower because the method
//      itself is the work-density.
//   2. `intensityMultiplier` is capped per role too. Recovery never grows
//      past 1.0×. Skill-quality caps at 1.05×. Heavy day takes the full
//      bump because that is the day the user wants more from in week 3.
//   3. `sessionIntensityCap` is taken as the STRICTER of the phase cap and
//      the role's `rpeCap`. So a recovery role that capped at RPE 6 in
//      week 1 still caps at RPE 6 in week 3 — phase cannot push it to 9.
//   4. The post-scaling sets clamp tightens by role: heavy days max 4 sets
//      per row (no 6-set accessory grinders); recovery max 2; skill 3;
//      others max 5.
//
// SAFE ABSENCE
// ------------
// If a session has no `compositionMetadata.weeklyRole` (e.g. legacy programs
// generated before the role contract shipped), behavior falls back to the
// previous global multipliers. New programs always have a role; legacy
// programs degrade gracefully without breaking.

type WeeklyRoleId =
  | 'primary_strength_emphasis'
  | 'skill_quality_emphasis'
  | 'broad_mixed_volume'
  | 'secondary_support'
  | 'density_capacity'
  | 'recovery_supportive'

interface RoleScalingCaps {
  /** Maximum allowed volumeMultiplier. Phase value is min'd against this. */
  volumeMultiplierCap: number
  /** Maximum allowed intensityMultiplier. Phase value is min'd against this. */
  intensityMultiplierCap: number
  /** Hard ceiling on RPE for this role. Stricter of this and phase cap wins. */
  rpeCap: number
  /** Hard ceiling on sets-per-row after scaling. Replaces global Math.min(6, ...). */
  setsPerRowCap: number
  /** Floor on sets-per-row after scaling. Prevents over-trim of recovery to 1. */
  setsPerRowFloor: number
}

const ROLE_SCALING_CAPS: Record<WeeklyRoleId, RoleScalingCaps> = {
  // Heavy day: full RPE allowed, but volume must NOT double — a heavy day
  // doubled grinds. Sets cap at 4 so accessory rows don't balloon to 6.
  primary_strength_emphasis: {
    volumeMultiplierCap: 1.5,
    intensityMultiplierCap: 1.15,
    rpeCap: 9,
    setsPerRowCap: 4,
    setsPerRowFloor: 2,
  },
  // Skill-quality day: CNS freshness is the whole point. Volume holds at
  // base (1.0×); intensity barely creeps up (1.05×). RPE hard cap 7 so
  // skill quality > grind, even at peak week.
  skill_quality_emphasis: {
    volumeMultiplierCap: 1.0,
    intensityMultiplierCap: 1.05,
    rpeCap: 7,
    setsPerRowCap: 3,
    setsPerRowFloor: 2,
  },
  // Broad mixed: this is the day phase scaling is for — full multiplier.
  broad_mixed_volume: {
    volumeMultiplierCap: 2.0,
    intensityMultiplierCap: 1.15,
    rpeCap: 8,
    setsPerRowCap: 5,
    setsPerRowFloor: 2,
  },
  // Secondary support: full multiplier; like broad but slightly lower RPE
  // because primary expression is upstream on a different day.
  secondary_support: {
    volumeMultiplierCap: 2.0,
    intensityMultiplierCap: 1.15,
    rpeCap: 8,
    setsPerRowCap: 5,
    setsPerRowFloor: 2,
  },
  // Density: methods (supersets/circuits) ALREADY add work-density per round.
  // Multiplying sets ON TOP would explode total fatigue. Cap volume at 1.5×;
  // RPE caps at 7 so density doesn't grind into failure-budget territory.
  density_capacity: {
    volumeMultiplierCap: 1.5,
    intensityMultiplierCap: 1.10,
    rpeCap: 7,
    setsPerRowCap: 4,
    setsPerRowFloor: 2,
  },
  // Recovery: holds base. No volume growth; no intensity growth; hard RPE 6.
  // This is the day the user must clearly see is easier, every week.
  recovery_supportive: {
    volumeMultiplierCap: 1.0,
    intensityMultiplierCap: 1.0,
    rpeCap: 6,
    setsPerRowCap: 2,
    setsPerRowFloor: 1,
  },
}

/**
 * Default caps for sessions without an attached weekly role (legacy programs).
 * Equivalent to broad_mixed_volume — preserves prior behavior for backward
 * compatibility while still enforcing the global RPE-10 sanity floor.
 */
const FALLBACK_SCALING_CAPS: RoleScalingCaps = {
  volumeMultiplierCap: 2.0,
  intensityMultiplierCap: 1.15,
  rpeCap: 9,
  setsPerRowCap: 6, // legacy hard ceiling
  setsPerRowFloor: 2,
}

/**
 * Read the role's scaling caps from a session if a weeklyRole is attached.
 * Sessions emitted by the current builder include
 * `compositionMetadata.weeklyRole.roleId`. Missing role → fallback caps.
 */
function getScalingCapsForSession(session: AdaptiveSession | undefined): RoleScalingCaps {
  if (!session) return FALLBACK_SCALING_CAPS
  // [BASE-WEEK-AUTHORITY-LOCK] Read role from compositionMetadata where the
  // builder writes it (adaptive-program-builder.ts line 27748). Avoid throwing
  // if session shape is not exactly typed — legacy/test inputs are tolerated.
  const meta = (session as unknown as { compositionMetadata?: { weeklyRole?: { roleId?: string } | null } }).compositionMetadata
  const roleId = meta?.weeklyRole?.roleId
  if (!roleId) return FALLBACK_SCALING_CAPS
  if (roleId in ROLE_SCALING_CAPS) {
    return ROLE_SCALING_CAPS[roleId as WeeklyRoleId]
  }
  return FALLBACK_SCALING_CAPS
}

/**
 * Apply week-specific dosage scaling to a single exercise
 */
export function scaleExerciseForWeek(
  exercise: AdaptiveExercise,
  weekNumber: number,
  // [BASE-WEEK-AUTHORITY-LOCK] Optional role caps. When called via
  // scaleSessionForWeek the caller resolves caps from the session's
  // weeklyRole and passes them in. Direct callers (legacy / tests) get the
  // fallback caps automatically.
  roleCaps: RoleScalingCaps = FALLBACK_SCALING_CAPS,
): ScaledExercise {
  const phaseScaling = getWeekDosageScaling(weekNumber)
  // [BASE-WEEK-AUTHORITY-LOCK] Subordinate phase scaling to the role contract.
  // Each phase multiplier is min'd against the role's ceiling so a recovery
  // day cannot be doubled by week 3 and a heavy day cannot be inflated past
  // 1.5× by peak. This is what makes the BASE WEEK the real intelligence
  // layer and weeks 1-4 honest scaling of that base, not invention.
  const scaling: WeekDosageScalingResult = {
    ...phaseScaling,
    volumeMultiplier: Math.min(phaseScaling.volumeMultiplier, roleCaps.volumeMultiplierCap),
    intensityMultiplier: Math.min(phaseScaling.intensityMultiplier, roleCaps.intensityMultiplierCap),
    sessionIntensityCap: Math.min(phaseScaling.sessionIntensityCap, roleCaps.rpeCap),
  }
  
  // Week 1: acclimation - still apply dosage fields for consistent display
  // [WEEK-SCALING-FIX] Always attach scaled fields even for week 1 so display contract works
  // [PRESCRIPTION-TYPE-FIX] Use repsOrTime field (canonical) with fallback to reps for compatibility
  const rawRepsOrTime = exercise.repsOrTime || (exercise as { reps?: string }).reps || '8-12'
  
  if (!scaling.scalingApplied || weekNumber === 1) {
    const originalSets = typeof exercise.sets === 'number' ? exercise.sets : parseInt(String(exercise.sets)) || 3
    const originalTargetRPE = exercise.targetRPE || 8
    // [PRESCRIPTION-TYPE-FIX] Preserve hold format for week 1 display
    const holdDuration = parseHoldDuration(rawRepsOrTime)
    const scaledReps = holdDuration !== null ? formatHoldDuration(holdDuration) : rawRepsOrTime
    return {
      ...exercise,
      scaledSets: originalSets, // Same as original for week 1
      scaledReps,
      scaledHoldDuration: holdDuration ?? undefined,
      scaledTargetRPE: originalTargetRPE,
      weekScalingApplied: false,
    }
  }
  
  // Parse original values
  const originalSets = typeof exercise.sets === 'number' ? exercise.sets : parseInt(String(exercise.sets)) || 3
  const originalTargetRPE = exercise.targetRPE || 8
  const originalRestPeriod = exercise.restPeriod || 90
  const originalHoldDuration = parseHoldDuration(rawRepsOrTime)
  
  // Apply scaling
  const scaledSets = Math.round(originalSets * scaling.volumeMultiplier)
  // [DOCTRINE-STRENGTHENING] RPE is scaled but ALSO capped by week's sessionIntensityCap
  const scaledTargetRPE = Math.min(
    scaling.sessionIntensityCap, // Week-based cap
    10, // Absolute max
    Math.round((originalTargetRPE * scaling.intensityMultiplier) * 10) / 10
  )
  const scaledRestPeriod = Math.round(originalRestPeriod * scaling.restMultiplier)
  
  // [PRESCRIPTION-TYPE-FIX] Scale hold durations for isometric exercises, preserve reps for rep-based
  let scaledReps = rawRepsOrTime
  let scaledHoldDuration: number | undefined
  
  if (originalHoldDuration !== null) {
    // Hold-based exercise: scale hold duration, keep format as "Xs hold"
    scaledHoldDuration = Math.round(originalHoldDuration * scaling.holdDurationMultiplier)
    scaledReps = formatHoldDuration(scaledHoldDuration)
  } else {
    // Rep-based exercise: scale rep range
    scaledReps = scaleRepRange(rawRepsOrTime, scaling.volumeMultiplier)
  }
  
  return {
    ...exercise,
    // Scaled values for display
    // [BASE-WEEK-AUTHORITY-LOCK] Sets-per-row clamp is now ROLE-AWARE. The
    // ceiling comes from the role's `setsPerRowCap` (heavy=4, skill=3,
    // recovery=2, broad/support=5, density=4). Replaces the old hard
    // Math.min(6, ...) which let recovery rows balloon to 6 sets.
    scaledSets: Math.max(roleCaps.setsPerRowFloor, Math.min(roleCaps.setsPerRowCap, scaledSets)),
    scaledReps,
    scaledHoldDuration,
    // [BASE-WEEK-AUTHORITY-LOCK] RPE floor stays at 6 globally, but the
    // ceiling above (scaling.sessionIntensityCap) is already the stricter of
    // phase cap and role cap, so a recovery role's RPE 6 ceiling is honored.
    scaledTargetRPE: Math.max(6, scaledTargetRPE),
    scaledRestPeriod: Math.max(60, scaledRestPeriod), // Minimum 60s rest
    // Metadata
    weekScalingApplied: true,
    originalSets,
    originalReps: rawRepsOrTime,
    originalTargetRPE,
  }
}

/**
 * Apply week-specific dosage scaling to an entire session
 *
 * [BASE-WEEK-AUTHORITY-LOCK] Resolves the session's weeklyRole ONCE here and
 * threads role-specific scaling caps to every exercise. Sessions without a
 * role (legacy programs) get fallback caps and behave as before.
 */
export function scaleSessionForWeek(
  session: AdaptiveSession,
  weekNumber: number
): ScaledSession {
  const phaseScaling = getWeekDosageScaling(weekNumber)
  const roleCaps = getScalingCapsForSession(session)
  // [BASE-WEEK-AUTHORITY-LOCK] Build a session-level scaling result that
  // reflects the role-clamped multipliers, so audits / display layers that
  // read `scaling.volumeMultiplier` see the EFFECTIVE truth (post role clamp),
  // not the raw phase multiplier.
  const scaling: WeekDosageScalingResult = {
    ...phaseScaling,
    volumeMultiplier: Math.min(phaseScaling.volumeMultiplier, roleCaps.volumeMultiplierCap),
    intensityMultiplier: Math.min(phaseScaling.intensityMultiplier, roleCaps.intensityMultiplierCap),
    sessionIntensityCap: Math.min(phaseScaling.sessionIntensityCap, roleCaps.rpeCap),
  }

  const scaledExercises = (session.exercises || []).map(ex =>
    scaleExerciseForWeek(ex, weekNumber, roleCaps)
  )
  
  return {
    ...session,
    exercises: scaledExercises,
    weekScalingApplied: scaling.scalingApplied,
    weekNumber,
    dosageScaling: scaling,
    // [DOCTRINE-STRENGTHENING] Include week character for UI differentiation
    weekCharacter: {
      densityAllowed: scaling.densityAllowed,
      finishersAllowed: scaling.finishersAllowed,
      skillExposureLevel: scaling.skillExposureLevel,
      sessionIntensityCap: scaling.sessionIntensityCap,
      phaseLabel: scaling.phaseLabel,
    },
  }
}

/**
 * Apply week-specific dosage scaling to all sessions in a program
 */
export function scaleSessionsForWeek(
  sessions: AdaptiveSession[],
  weekNumber: number
): ScaledSession[] {
  return sessions.map(session => scaleSessionForWeek(session, weekNumber))
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse hold duration from reps string (e.g., "20s hold" -> 20)
 */
function parseHoldDuration(reps: string | undefined): number | null {
  if (!reps) return null
  
  const holdMatch = reps.match(/(\d+)\s*s(?:ec)?(?:ond)?s?\s*(?:hold)?/i)
  if (holdMatch) {
    return parseInt(holdMatch[1], 10)
  }
  
  return null
}

/**
 * Format hold duration back to string
 * [PRESCRIPTION-TYPE-FIX] Output format matches builder: "Xs" (e.g., "20s")
 */
function formatHoldDuration(seconds: number): string {
  return `${seconds}s`
}

/**
 * Clean Rep Band Normalization
 * 
 * [DOCTRINE-CLEAN-BANDS] Volume scaling applies to SETS, not rep ranges.
 * Rep ranges should remain clean and doctrine-appropriate based on exercise intent.
 * This function normalizes any awkward ranges into clean coaching-credible bands.
 * 
 * Clean Band Families:
 * - Strength/Neural: 3-5, 4-6, 5-8
 * - Hybrid Strength-Hypertrophy: 6-8, 6-10, 8-10
 * - Hypertrophy: 8-12, 10-12, 10-15
 * - Endurance/Burnout: 12-15, 15-20
 */
function normalizeToCleanBand(reps: string, _multiplier: number): string {
  // Handle "XxY" format (e.g., "3x8") - preserve sets part, normalize reps
  const setRepMatch = reps.match(/(\d+)\s*x\s*(\d+)/i)
  if (setRepMatch) {
    const sets = parseInt(setRepMatch[1], 10)
    const repCount = parseInt(setRepMatch[2], 10)
    const cleanReps = normalizeRepCountToCleanBand(repCount)
    return `${sets}x${cleanReps}`
  }
  
  // Handle range format (e.g., "8-12")
  const rangeMatch = reps.match(/(\d+)\s*-\s*(\d+)/)
  if (rangeMatch) {
    const low = parseInt(rangeMatch[1], 10)
    const high = parseInt(rangeMatch[2], 10)
    return normalizeRangeToCleanBand(low, high)
  }
  
  // Handle single number - keep as clean single rep target
  const singleMatch = reps.match(/^(\d+)$/)
  if (singleMatch) {
    return singleMatch[1]
  }
  
  // Return unchanged if format not recognized (AMRAP, special formats)
  return reps
}

/**
 * Normalize a single rep count to the nearest clean band midpoint
 */
function normalizeRepCountToCleanBand(repCount: number): number {
  // Keep single rep targets clean - don't change them
  return repCount
}

/**
 * Normalize a rep range to the nearest clean doctrine-friendly band
 * 
 * [DOCTRINE-CLEAN-BANDS] Maps any range to clean coaching bands:
 * - Very low (1-4): 3-5 (neural/max strength)
 * - Low (5-7): 5-8 (strength)
 * - Moderate (8-10): 8-10 (hybrid)
 * - Standard hypertrophy (11-13): 8-12 (classic hypertrophy)
 * - Higher (14+): 10-15 (higher volume hypertrophy)
 */
function normalizeRangeToCleanBand(low: number, high: number): string {
  const mid = (low + high) / 2
  const span = high - low
  
  // If already a clean narrow band (span <= 4), keep it
  if (span <= 4) {
    return `${low}-${high}`
  }
  
  // Wide ugly ranges get normalized to clean bands based on midpoint
  if (mid <= 4) {
    return '3-5'
  } else if (mid <= 6) {
    return '4-6'
  } else if (mid <= 7) {
    return '5-8'
  } else if (mid <= 9) {
    return '6-10'
  } else if (mid <= 11) {
    return '8-12'
  } else if (mid <= 14) {
    return '10-15'
  } else {
    return '12-15'
  }
}

// Backward compatibility alias
function scaleRepRange(reps: string, multiplier: number): string {
  return normalizeToCleanBand(reps, multiplier)
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Get a human-readable description of the current week's training phase
 */
export function getWeekPhaseDescription(weekNumber: number): string {
  const scaling = getWeekDosageScaling(weekNumber)
  
  switch (scaling.phaseLabel) {
    case 'acclimation':
      return 'Acclimation Week - Conservative volume to establish baseline'
    case 'ramp_up':
      return 'Ramp-Up Week - Increasing volume and intensity'
    case 'peak':
      return 'Peak Week - Full training volume and intensity'
    case 'consolidation':
      return 'Consolidation Week - Maintaining gains before next cycle'
    default:
      return `Week ${weekNumber}`
  }
}

/**
 * Get short phase label for UI chips
 */
export function getWeekPhaseLabel(weekNumber: number): string {
  const scaling = getWeekDosageScaling(weekNumber)
  
  switch (scaling.phaseLabel) {
    case 'acclimation':
      return 'Acclimation'
    case 'ramp_up':
      return 'Ramp Up'
    case 'peak':
      return 'Peak'
    case 'consolidation':
      return 'Consolidation'
    default:
      return `Week ${weekNumber}`
  }
}

/**
 * Get volume indicator for display
 * [WEEK-PHASE-DOCTRINE-FIX] Percentages now show meaningful distinct values per week phase
 * instead of all collapsing to 100% after capping
 */
export function getWeekVolumeIndicator(weekNumber: number): { label: string; percentage: number; description: string } {
  const scaling = getWeekDosageScaling(weekNumber)
  
  // [DOCTRINE-FIX] Show percentages relative to PEAK week (Week 3 = 100%)
  // This makes the progression visible: 50% → 75% → 100% → 90%
  // Week 4 is consolidation (90%), not a full deload (75%)
  switch (scaling.phaseLabel) {
    case 'acclimation':
      return { 
        label: 'Reduced', 
        percentage: 50, 
        description: 'Conservative entry volume for safe adaptation'
      }
    case 'ramp_up':
      return { 
        label: 'Building', 
        percentage: 75, 
        description: 'Progressing toward full training capacity'
      }
    case 'peak':
      return { 
        label: 'Full', 
        percentage: 100, 
        description: 'Maximum productive volume for this cycle'
      }
    case 'consolidation':
      return { 
        label: 'Maintained', 
        percentage: 90, 
        description: 'Preserving gains while managing fatigue'
      }
    default:
      return { label: 'Normal', percentage: 100, description: 'Standard training volume' }
  }
}

/**
 * [WEEK-PHASE-DOCTRINE-FIX] Get comprehensive week phase context for UI display
 * This replaces stale static explanations with dynamic week-aware content
 */
export interface WeekPhaseContext {
  weekNumber: number
  phaseLabel: string
  phaseName: string
  isProtectiveWeek: boolean
  coachingHeadline: string
  volumeDescription: string
  keyCharacteristics: string[]
  scalingReason: string
}

export function getWeekPhaseContext(weekNumber: number): WeekPhaseContext {
  const scaling = getWeekDosageScaling(weekNumber)
  const volumeIndicator = getWeekVolumeIndicator(weekNumber)
  
  switch (scaling.phaseLabel) {
    case 'acclimation':
      return {
        weekNumber,
        phaseLabel: scaling.phaseLabel,
        phaseName: 'Acclimation',
        isProtectiveWeek: true,
        coachingHeadline: 'Building your foundation with controlled exposure',
        volumeDescription: volumeIndicator.description,
        keyCharacteristics: [
          'Conservative volume to prevent overload',
          'Extended rest between sets',
          'No high-density or finisher work',
          'Focus on movement quality'
        ],
        scalingReason: scaling.scalingReason
      }
    case 'ramp_up':
      return {
        weekNumber,
        phaseLabel: scaling.phaseLabel,
        phaseName: 'Ramp Up',
        isProtectiveWeek: false,
        coachingHeadline: 'Progressing toward full training capacity',
        volumeDescription: volumeIndicator.description,
        keyCharacteristics: [
          'Increased volume from acclimation',
          'Normal rest periods',
          'Density work now permitted',
          'Building toward peak performance'
        ],
        scalingReason: scaling.scalingReason
      }
    case 'peak':
      return {
        weekNumber,
        phaseLabel: scaling.phaseLabel,
        phaseName: 'Peak',
        isProtectiveWeek: false,
        coachingHeadline: 'Maximum productive training volume',
        volumeDescription: volumeIndicator.description,
        keyCharacteristics: [
          'Highest volume of the cycle',
          'Reduced rest for density',
          'Finishers and advanced work unlocked',
          'Full skill exposure'
        ],
        scalingReason: scaling.scalingReason
      }
    case 'consolidation':
      return {
        weekNumber,
        phaseLabel: scaling.phaseLabel,
        phaseName: 'Consolidation',
        isProtectiveWeek: false,
        coachingHeadline: 'Maintaining gains while managing fatigue',
        volumeDescription: volumeIndicator.description,
        keyCharacteristics: [
          'Reduced volume from peak',
          'No finishers - focus on core work',
          'Preserving adaptations',
          'Preparing for next cycle'
        ],
        scalingReason: scaling.scalingReason
      }
    default:
      return {
        weekNumber,
        phaseLabel: 'normal',
        phaseName: 'Normal',
        isProtectiveWeek: false,
        coachingHeadline: 'Standard training week',
        volumeDescription: 'Normal training volume',
        keyCharacteristics: ['Standard training parameters'],
        scalingReason: 'Normal training week'
      }
  }
}
