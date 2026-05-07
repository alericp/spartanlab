/**
 * STEP 22.1 — INJURY SUBSTITUTION ADVISORY CONTRACT
 *
 * =============================================================================
 * ADVISORY-FIRST INJURY SUBSTITUTION DECISION LAYER
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Provide a single authoritative typed contract that:
 *   1) Reads existing injury/pain/limitation signals from profile, readiness
 *      check-ins, workout logs, and existing joint caution fields.
 *   2) Normalizes those signals into a safe, bounded injury-substitution
 *      advisory context.
 *   3) Generates substitution recommendations for affected exercises/sessions
 *      WITHOUT mutating the saved program automatically.
 *   4) Surfaces a clear preview/advisory to the user.
 *   5) Requires explicit user confirmation before any actual substitution is
 *      applied in a later step.
 *
 * CRITICAL INVARIANTS
 * -------------------
 *   - This contract is ADVISORY ONLY. No program mutation ever occurs.
 *   - All recommendations require user confirmation (mutationAllowedNow: false).
 *   - No exercise identity changes. No sets/reps/rest changes.
 *   - No selected skills erasure. No method composition rewrite.
 *   - No diagnosis. No medical advice beyond conservative training guidance.
 *   - Pure function — safe on server/client/build-time.
 *
 * @step 22.1 of 22.3
 */

import type { JointCaution, JointDiscomfortFlag } from '@/lib/athlete-profile'
import type { MovementFamily } from '@/lib/movement-family-registry'
import type {
  RecoveryReadinessCheckIn,
  InjuryConstraintLevel,
} from './recovery-adaptation-snapshot-contract'

// =============================================================================
// TYPE DEFINITIONS — INJURY SIGNALS
// =============================================================================

/**
 * Source of an injury/pain signal.
 */
export type InjurySignalSource =
  | 'profile_joint_caution'      // From onboarding profile jointCautions
  | 'profile_discomfort_flag'    // From profile jointDiscomfortFlags
  | 'readiness_checkin'          // From daily readiness check-in jointPainAreas
  | 'workout_log_note'           // From workout log notes mentioning pain
  | 'workout_log_skip'           // From skipped exercise with pain reason
  | 'session_event'              // From session-level event (e.g. cut short)

/**
 * Severity level of an injury signal.
 */
export type InjurySignalSeverity = 'mild' | 'moderate' | 'high' | 'unknown'

/**
 * Confidence level of the signal interpretation.
 */
export type InjurySignalConfidence = 'low' | 'medium' | 'high'

/**
 * Normalized injury/pain signal from any source.
 */
export interface InjurySubstitutionSignal {
  /** Signal source */
  source: InjurySignalSource
  /** Affected joint or body region */
  jointOrRegion: string
  /** Severity assessment */
  severity: InjurySignalSeverity
  /** Confidence in the signal */
  confidence: InjurySignalConfidence
  /** Raw text if available (e.g., notes content) */
  rawText?: string
  /** When this signal was captured */
  timestamp?: string
  /** Related exercise ID if applicable */
  exerciseId?: string
  /** Related exercise name if applicable */
  exerciseName?: string
  /** Affected movement pattern if known */
  movementPattern?: MovementFamily
}

// =============================================================================
// TYPE DEFINITIONS — RECOMMENDATIONS
// =============================================================================

/**
 * Recommended action for an affected exercise.
 */
export type InjuryRecommendedAction =
  | 'keep_with_caution'           // Train but be mindful
  | 'reduce_range'                // Reduce range of motion
  | 'reduce_load'                 // Reduce intensity/volume
  | 'swap_exercise'               // Substitute with safer alternative
  | 'skip_and_replace_pattern'    // Skip entirely, replace movement pattern
  | 'seek_professional_guidance'  // Pain is concerning, suggest professional

/**
 * Risk level of continuing with the exercise.
 */
export type InjuryRiskLevel = 'low' | 'medium' | 'high'

/**
 * A single substitution recommendation for an affected exercise.
 */
export interface InjurySubstitutionRecommendation {
  /** Unique ID for this recommendation */
  recommendationId: string
  /** Affected exercise ID */
  affectedExerciseId?: string
  /** Affected exercise name */
  affectedExerciseName: string
  /** Affected session ID */
  affectedSessionId?: string
  /** Affected session day number */
  affectedSessionDayNumber?: number
  /** Which joint/region is the concern */
  jointOrRegion: string
  /** Why this recommendation exists */
  reason: string
  /** What action is recommended */
  recommendedAction: InjuryRecommendedAction
  /** Suggested alternative exercise name */
  suggestedAlternativeName?: string
  /** Why this alternative is safer */
  suggestedAlternativeReason?: string
  /** Risk of continuing with original exercise */
  riskLevel: InjuryRiskLevel
  /** ALWAYS TRUE in Step 22.1 — user must confirm */
  requiresUserConfirmation: true
  /** ALWAYS FALSE in Step 22.1 — no automatic mutation */
  mutationAllowedNow: false
  /** Source signals that led to this recommendation */
  sourceSignals: InjurySubstitutionSignal[]
  /** User-facing label for the advisory */
  visibleLabel: string
  /** Machine-readable proof code */
  proofCode: string
}

// =============================================================================
// TYPE DEFINITIONS — ADVISORY SNAPSHOT
// =============================================================================

/**
 * Overall advisory status.
 */
export type InjuryAdvisoryStatus =
  | 'none'               // No injury signals detected
  | 'watch'              // Monitor but no action needed
  | 'recommend_review'   // User should review recommendations
  | 'urgent_block'       // High-risk signals, strongly recommend review

/**
 * The complete injury substitution advisory snapshot.
 * This is the output of Step 22.1 — read-only, advisory-only.
 */
export interface InjurySubstitutionAdvisorySnapshot {
  /** Overall advisory status */
  status: InjuryAdvisoryStatus
  /** Individual recommendations for affected exercises */
  recommendations: InjurySubstitutionRecommendation[]
  /** When this advisory was generated */
  generatedAt: string
  /** ALWAYS FALSE in Step 22.1 — no mutations applied */
  applied: false
  /** ALWAYS TRUE in Step 22.1 — this is advisory only */
  advisoryOnly: true
  /** ALWAYS FALSE in Step 22.1 — no program mutation */
  programMutation: false
  /** Normalized signals that fed into this advisory */
  sourceSignals: InjurySubstitutionSignal[]
  /** User-facing summary headline */
  visibleHeadline: string | null
  /** User-facing summary text */
  visibleSummary: string | null
  /** Number of affected exercises */
  affectedExerciseCount: number
  /** Number of affected sessions */
  affectedSessionCount: number
  /** Proof fields for debugging */
  proof: {
    step: '22.1'
    type: 'advisory_only'
    mutationAllowed: false
    requiresUserConfirmation: true
  }
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Exercise info for advisory derivation.
 */
export interface ExerciseInfo {
  id: string
  name: string
  sessionId?: string
  sessionDayNumber?: number
  movementFamily?: MovementFamily
  /** Additional tags that might indicate joint stress */
  tags?: string[]
}

/**
 * Input for deriving the injury substitution advisory.
 */
export interface InjurySubstitutionAdvisoryInput {
  /** Profile joint cautions from onboarding */
  profileJointCautions?: JointCaution[]
  /** Profile discomfort flags */
  profileDiscomfortFlags?: JointDiscomfortFlag[]
  /** Most recent readiness check-in */
  recentCheckIn?: RecoveryReadinessCheckIn | null
  /** Recovery snapshot injury constraint level */
  injuryConstraintLevel?: InjuryConstraintLevel
  /** Exercises in the current program/session */
  exercises?: ExerciseInfo[]
  /** Recent workout log notes that might mention pain */
  recentWorkoutNotes?: Array<{
    exerciseId?: string
    exerciseName?: string
    note: string
    timestamp: string
  }>
  /** Recent skipped exercises with reasons */
  recentSkippedExercises?: Array<{
    exerciseId?: string
    exerciseName?: string
    reason?: string
    timestamp: string
  }>
}

// =============================================================================
// JOINT → MOVEMENT PATTERN MAPPING
// =============================================================================

/**
 * Maps joints/regions to potentially affected movement patterns.
 * Conservative mapping — errs on the side of flagging.
 */
const JOINT_TO_MOVEMENT_PATTERNS: Record<string, MovementFamily[]> = {
  // Wrist issues
  wrists: [
    'horizontal_push',      // Planche leans, push-ups
    'straight_arm_push',    // Planche holds, maltese
    'vertical_push',        // HSPU (wrist extension)
    'joint_integrity',      // Wrist prep itself
  ],
  wrist_irritation: [
    'horizontal_push',
    'straight_arm_push',
    'vertical_push',
  ],
  
  // Elbow issues
  elbows: [
    'vertical_pull',        // Pull-ups, chin-ups
    'horizontal_pull',      // Rows
    'straight_arm_pull',    // Front lever
    'dip_pattern',          // Dips
    'explosive_pull',       // Muscle-up transitions
    'arm_isolation',        // Curls, tricep work
  ],
  elbow_tendon_pain: [
    'vertical_pull',
    'straight_arm_pull',
    'straight_arm_push',
    'dip_pattern',
    'explosive_pull',
  ],
  
  // Shoulder issues
  shoulders: [
    'vertical_push',        // HSPU
    'dip_pattern',          // Dips (deep range)
    'straight_arm_push',    // Planche
    'straight_arm_pull',    // Front/back lever
    'explosive_pull',       // Muscle-up transition
    'rings_strength',       // Iron cross, maltese
    'rings_stability',      // Ring support
    'shoulder_isolation',   // Lateral raises
  ],
  shoulder_instability: [
    'rings_strength',
    'rings_stability',
    'dip_pattern',
    'straight_arm_push',
    'straight_arm_pull',
  ],
  
  // Lower back issues
  lower_back: [
    'compression_core',     // Dragon flags, leg raises
    'anti_extension_core',  // Planks at high intensity
    'hinge_pattern',        // Hip hinges
    'barbell_hinge',        // Deadlifts
  ],
  
  // Knee issues
  knees: [
    'squat_pattern',        // Squats, pistols
    'unilateral_leg',       // Lunges, step-ups
  ],
  knee_discomfort: [
    'squat_pattern',
    'unilateral_leg',
  ],
  
  // Ankle issues
  ankle_stiffness: [
    'squat_pattern',        // Deep squat mobility
    'unilateral_leg',       // Lunges
  ],
  
  // Hip issues
  hip_tightness: [
    'compression_core',     // L-sit, V-sit
    'squat_pattern',        // Deep squat
    'mobility',             // Hip stretches (if aggressive)
  ],
  
  // Scapular issues
  scapular_weakness: [
    'scapular_control',
    'straight_arm_pull',
    'straight_arm_push',
    'rings_stability',
  ],
}

// =============================================================================
// RECOMMENDATION TEXT GENERATORS
// =============================================================================

function getRecommendationVisibleLabel(
  jointOrRegion: string,
  action: InjuryRecommendedAction,
): string {
  const regionLabel = jointOrRegion.replace(/_/g, ' ')
  
  switch (action) {
    case 'keep_with_caution':
      return `Monitor ${regionLabel} — train mindfully`
    case 'reduce_range':
      return `Reduce range of motion — ${regionLabel} caution`
    case 'reduce_load':
      return `Reduce intensity — ${regionLabel} sensitivity`
    case 'swap_exercise':
      return `Consider safer alternative — ${regionLabel} concern`
    case 'skip_and_replace_pattern':
      return `Skip and substitute — protect ${regionLabel}`
    case 'seek_professional_guidance':
      return `Review ${regionLabel} concern with professional`
    default:
      return `${regionLabel} advisory`
  }
}

function getRecommendationReason(
  jointOrRegion: string,
  exerciseName: string,
  severity: InjurySignalSeverity,
  movementFamily?: MovementFamily,
): string {
  const regionLabel = jointOrRegion.replace(/_/g, ' ')
  const familyLabel = movementFamily?.replace(/_/g, ' ') ?? 'this pattern'
  
  if (severity === 'high') {
    return `${exerciseName} involves ${familyLabel} which may stress ${regionLabel}. With your current ${regionLabel} concern, consider a safer alternative.`
  }
  if (severity === 'moderate') {
    return `${exerciseName} loads ${regionLabel} in ${familyLabel}. Given your ${regionLabel} sensitivity, reduced intensity or an alternative may help.`
  }
  return `${exerciseName} may involve ${regionLabel}. Stay aware and reduce intensity if discomfort appears.`
}

function getSuggestedAlternative(
  jointOrRegion: string,
  movementFamily?: MovementFamily,
): { name: string; reason: string } | null {
  // Wrist alternatives
  if (jointOrRegion === 'wrists' || jointOrRegion === 'wrist_irritation') {
    if (movementFamily === 'horizontal_push' || movementFamily === 'straight_arm_push') {
      return {
        name: 'Parallettes or elevated handles (if available)',
        reason: 'Reduces wrist extension angle while preserving push pattern',
      }
    }
  }
  
  // Elbow alternatives
  if (jointOrRegion === 'elbows' || jointOrRegion === 'elbow_tendon_pain') {
    if (movementFamily === 'vertical_pull') {
      return {
        name: 'Reduced volume pull-ups or neutral-grip rows',
        reason: 'Lower tendon stress while maintaining pulling strength',
      }
    }
    if (movementFamily === 'straight_arm_pull') {
      return {
        name: 'Bent-arm row variations',
        reason: 'Reduces straight-arm stress on elbow tendons',
      }
    }
  }
  
  // Shoulder alternatives
  if (jointOrRegion === 'shoulders' || jointOrRegion === 'shoulder_instability') {
    if (movementFamily === 'dip_pattern') {
      return {
        name: 'Push-up variations or reduced ROM dips',
        reason: 'Avoids deep shoulder extension under load',
      }
    }
    if (movementFamily === 'rings_strength' || movementFamily === 'rings_stability') {
      return {
        name: 'Bar-based alternatives (if available)',
        reason: 'More stable shoulder environment than rings',
      }
    }
  }
  
  // Lower back alternatives
  if (jointOrRegion === 'lower_back') {
    if (movementFamily === 'compression_core') {
      return {
        name: 'Dead bug or reverse crunch progressions',
        reason: 'Reduces spinal compression while building core',
      }
    }
  }
  
  // Knee alternatives
  if (jointOrRegion === 'knees' || jointOrRegion === 'knee_discomfort') {
    if (movementFamily === 'squat_pattern') {
      return {
        name: 'Box squat or supported split squat',
        reason: 'Controlled depth to reduce knee stress',
      }
    }
  }
  
  return null
}

function deriveRecommendedAction(
  severity: InjurySignalSeverity,
  confidence: InjurySignalConfidence,
): InjuryRecommendedAction {
  if (severity === 'high' && confidence === 'high') {
    return 'swap_exercise'
  }
  if (severity === 'high') {
    return 'seek_professional_guidance'
  }
  if (severity === 'moderate') {
    return 'reduce_load'
  }
  return 'keep_with_caution'
}

function deriveRiskLevel(
  severity: InjurySignalSeverity,
  confidence: InjurySignalConfidence,
): InjuryRiskLevel {
  if (severity === 'high') return 'high'
  if (severity === 'moderate' && confidence === 'high') return 'medium'
  if (severity === 'moderate') return 'low'
  return 'low'
}

// =============================================================================
// SIGNAL NORMALIZATION
// =============================================================================

/**
 * Normalize profile joint cautions into signals.
 */
function normalizeProfileJointCautions(
  cautions: JointCaution[] | undefined,
): InjurySubstitutionSignal[] {
  if (!cautions || cautions.length === 0) return []
  
  return cautions.map((caution) => ({
    source: 'profile_joint_caution' as InjurySignalSource,
    jointOrRegion: caution,
    severity: 'moderate' as InjurySignalSeverity,
    confidence: 'high' as InjurySignalConfidence,
  }))
}

/**
 * Normalize profile discomfort flags into signals.
 */
function normalizeProfileDiscomfortFlags(
  flags: JointDiscomfortFlag[] | undefined,
): InjurySubstitutionSignal[] {
  if (!flags || flags.length === 0) return []
  
  return flags.map((flag) => ({
    source: 'profile_discomfort_flag' as InjurySignalSource,
    jointOrRegion: flag,
    severity: 'moderate' as InjurySignalSeverity,
    confidence: 'high' as InjurySignalConfidence,
  }))
}

/**
 * Normalize readiness check-in into signals.
 */
function normalizeCheckInSignals(
  checkIn: RecoveryReadinessCheckIn | null | undefined,
): InjurySubstitutionSignal[] {
  if (!checkIn || !checkIn.jointPainReported) return []
  
  const areas = checkIn.jointPainAreas || []
  if (areas.length === 0) return []
  
  // Check-in pain is more acute — severity based on soreness level
  const severity: InjurySignalSeverity =
    checkIn.sorenessLevel === 'severe' ? 'high' :
    checkIn.sorenessLevel === 'moderate' ? 'moderate' :
    'mild'
  
  return areas.map((area) => ({
    source: 'readiness_checkin' as InjurySignalSource,
    jointOrRegion: area,
    severity,
    confidence: 'high' as InjurySignalConfidence,
    rawText: checkIn.notes ?? undefined,
    timestamp: checkIn.capturedAt,
  }))
}

/**
 * Normalize workout log notes mentioning pain keywords.
 */
function normalizeWorkoutNotes(
  notes: InjurySubstitutionAdvisoryInput['recentWorkoutNotes'],
): InjurySubstitutionSignal[] {
  if (!notes || notes.length === 0) return []
  
  const painKeywords = [
    'pain', 'hurt', 'sharp', 'ache', 'sore', 'tender', 'twinge',
    'discomfort', 'strain', 'pulled', 'tweak', 'aggravated',
  ]
  
  const jointKeywords: Record<string, string> = {
    wrist: 'wrists',
    elbow: 'elbows',
    shoulder: 'shoulders',
    back: 'lower_back',
    knee: 'knees',
    hip: 'hip_tightness',
    ankle: 'ankle_stiffness',
  }
  
  const signals: InjurySubstitutionSignal[] = []
  
  for (const entry of notes) {
    const lowerNote = entry.note.toLowerCase()
    const hasPainKeyword = painKeywords.some((kw) => lowerNote.includes(kw))
    
    if (hasPainKeyword) {
      // Try to identify which joint
      let jointOrRegion = 'unknown'
      for (const [keyword, region] of Object.entries(jointKeywords)) {
        if (lowerNote.includes(keyword)) {
          jointOrRegion = region
          break
        }
      }
      
      // Severity based on keywords
      const isSharp = lowerNote.includes('sharp') || lowerNote.includes('severe')
      
      signals.push({
        source: 'workout_log_note',
        jointOrRegion,
        severity: isSharp ? 'high' : 'moderate',
        confidence: jointOrRegion === 'unknown' ? 'low' : 'medium',
        rawText: entry.note,
        timestamp: entry.timestamp,
        exerciseId: entry.exerciseId,
        exerciseName: entry.exerciseName,
      })
    }
  }
  
  return signals
}

// =============================================================================
// EXERCISE MATCHING
// =============================================================================

/**
 * Check if an exercise is affected by injury signals.
 */
function isExerciseAffected(
  exercise: ExerciseInfo,
  signals: InjurySubstitutionSignal[],
): InjurySubstitutionSignal[] {
  const affectingSignals: InjurySubstitutionSignal[] = []
  
  for (const signal of signals) {
    const affectedPatterns = JOINT_TO_MOVEMENT_PATTERNS[signal.jointOrRegion] || []
    
    if (exercise.movementFamily && affectedPatterns.includes(exercise.movementFamily)) {
      affectingSignals.push({
        ...signal,
        movementPattern: exercise.movementFamily,
      })
    }
    
    // Also check exercise name for common patterns
    const exerciseNameLower = exercise.name.toLowerCase()
    
    // Wrist-loaded exercises
    if ((signal.jointOrRegion === 'wrists' || signal.jointOrRegion === 'wrist_irritation') &&
        (exerciseNameLower.includes('planche') ||
         exerciseNameLower.includes('pseudo') ||
         exerciseNameLower.includes('handstand') ||
         exerciseNameLower.includes('maltese'))) {
      if (!affectingSignals.includes(signal)) {
        affectingSignals.push(signal)
      }
    }
    
    // Elbow-loaded exercises
    if ((signal.jointOrRegion === 'elbows' || signal.jointOrRegion === 'elbow_tendon_pain') &&
        (exerciseNameLower.includes('pull') ||
         exerciseNameLower.includes('chin') ||
         exerciseNameLower.includes('muscle up') ||
         exerciseNameLower.includes('muscle-up') ||
         exerciseNameLower.includes('dip') ||
         exerciseNameLower.includes('lever'))) {
      if (!affectingSignals.includes(signal)) {
        affectingSignals.push(signal)
      }
    }
    
    // Shoulder-loaded exercises
    if ((signal.jointOrRegion === 'shoulders' || signal.jointOrRegion === 'shoulder_instability') &&
        (exerciseNameLower.includes('dip') ||
         exerciseNameLower.includes('ring') ||
         exerciseNameLower.includes('lever') ||
         exerciseNameLower.includes('cross') ||
         exerciseNameLower.includes('hspu') ||
         exerciseNameLower.includes('handstand push'))) {
      if (!affectingSignals.includes(signal)) {
        affectingSignals.push(signal)
      }
    }
    
    // Lower back exercises
    if (signal.jointOrRegion === 'lower_back' &&
        (exerciseNameLower.includes('dragon') ||
         exerciseNameLower.includes('leg raise') ||
         exerciseNameLower.includes('deadlift') ||
         exerciseNameLower.includes('hinge'))) {
      if (!affectingSignals.includes(signal)) {
        affectingSignals.push(signal)
      }
    }
    
    // Knee exercises
    if ((signal.jointOrRegion === 'knees' || signal.jointOrRegion === 'knee_discomfort') &&
        (exerciseNameLower.includes('squat') ||
         exerciseNameLower.includes('pistol') ||
         exerciseNameLower.includes('lunge') ||
         exerciseNameLower.includes('split'))) {
      if (!affectingSignals.includes(signal)) {
        affectingSignals.push(signal)
      }
    }
  }
  
  return affectingSignals
}

// =============================================================================
// MAIN DERIVATION FUNCTION
// =============================================================================

/**
 * Derive an injury substitution advisory snapshot from available signals.
 *
 * This is the SINGLE pure helper for Step 22.1. It:
 *   - Normalizes signals from profile, check-in, workout logs
 *   - Matches signals to exercises via movement patterns
 *   - Generates recommendations with visible labels and reasons
 *   - NEVER mutates program state
 *   - ALWAYS requires user confirmation
 *
 * Pure function — no side effects, safe on server/client/build.
 */
export function deriveInjurySubstitutionAdvisory(
  input: InjurySubstitutionAdvisoryInput,
): InjurySubstitutionAdvisorySnapshot {
  const now = new Date().toISOString()
  
  // ----- Normalize all signals -----
  const signals: InjurySubstitutionSignal[] = [
    ...normalizeProfileJointCautions(input.profileJointCautions),
    ...normalizeProfileDiscomfortFlags(input.profileDiscomfortFlags),
    ...normalizeCheckInSignals(input.recentCheckIn),
    ...normalizeWorkoutNotes(input.recentWorkoutNotes),
  ]
  
  // If no signals, return clean state
  if (signals.length === 0) {
    return {
      status: 'none',
      recommendations: [],
      generatedAt: now,
      applied: false,
      advisoryOnly: true,
      programMutation: false,
      sourceSignals: [],
      visibleHeadline: null,
      visibleSummary: null,
      affectedExerciseCount: 0,
      affectedSessionCount: 0,
      proof: {
        step: '22.1',
        type: 'advisory_only',
        mutationAllowed: false,
        requiresUserConfirmation: true,
      },
    }
  }
  
  // ----- Generate recommendations for affected exercises -----
  const recommendations: InjurySubstitutionRecommendation[] = []
  const affectedSessionIds = new Set<string>()
  
  const exercises = input.exercises || []
  
  for (const exercise of exercises) {
    const affectingSignals = isExerciseAffected(exercise, signals)
    
    if (affectingSignals.length > 0) {
      // Use the highest severity signal
      const sortedSignals = affectingSignals.sort((a, b) => {
        const severityOrder = { high: 3, moderate: 2, mild: 1, unknown: 0 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      })
      
      const primarySignal = sortedSignals[0]
      const action = deriveRecommendedAction(primarySignal.severity, primarySignal.confidence)
      const riskLevel = deriveRiskLevel(primarySignal.severity, primarySignal.confidence)
      const alternative = getSuggestedAlternative(primarySignal.jointOrRegion, exercise.movementFamily)
      
      recommendations.push({
        recommendationId: `rec_${exercise.id}_${primarySignal.jointOrRegion}`,
        affectedExerciseId: exercise.id,
        affectedExerciseName: exercise.name,
        affectedSessionId: exercise.sessionId,
        affectedSessionDayNumber: exercise.sessionDayNumber,
        jointOrRegion: primarySignal.jointOrRegion,
        reason: getRecommendationReason(
          primarySignal.jointOrRegion,
          exercise.name,
          primarySignal.severity,
          exercise.movementFamily,
        ),
        recommendedAction: action,
        suggestedAlternativeName: alternative?.name,
        suggestedAlternativeReason: alternative?.reason,
        riskLevel,
        requiresUserConfirmation: true,
        mutationAllowedNow: false,
        sourceSignals: affectingSignals,
        visibleLabel: getRecommendationVisibleLabel(primarySignal.jointOrRegion, action),
        proofCode: `STEP_22_1_ADVISORY_${primarySignal.jointOrRegion.toUpperCase()}_${action.toUpperCase()}`,
      })
      
      if (exercise.sessionId) {
        affectedSessionIds.add(exercise.sessionId)
      }
    }
  }
  
  // ----- Derive overall status -----
  let status: InjuryAdvisoryStatus = 'none'
  
  if (recommendations.length === 0 && signals.length > 0) {
    status = 'watch'
  } else if (recommendations.some((r) => r.riskLevel === 'high')) {
    status = 'urgent_block'
  } else if (recommendations.length > 0) {
    status = 'recommend_review'
  }
  
  // ----- Derive visible text -----
  let visibleHeadline: string | null = null
  let visibleSummary: string | null = null
  
  if (status === 'urgent_block') {
    visibleHeadline = 'Review safer options before training'
    visibleSummary = `${recommendations.length} exercise${recommendations.length > 1 ? 's' : ''} may stress areas where you reported concern. Preview alternatives below.`
  } else if (status === 'recommend_review') {
    visibleHeadline = 'Joint caution advisory'
    visibleSummary = `${recommendations.length} exercise${recommendations.length > 1 ? 's' : ''} may be affected by your ${signals[0].jointOrRegion.replace(/_/g, ' ')} concern. Consider reviewing.`
  } else if (status === 'watch') {
    visibleHeadline = null
    visibleSummary = null
  }
  
  return {
    status,
    recommendations,
    generatedAt: now,
    applied: false,
    advisoryOnly: true,
    programMutation: false,
    sourceSignals: signals,
    visibleHeadline,
    visibleSummary,
    affectedExerciseCount: recommendations.length,
    affectedSessionCount: affectedSessionIds.size,
    proof: {
      step: '22.1',
      type: 'advisory_only',
      mutationAllowed: false,
      requiresUserConfirmation: true,
    },
  }
}

// =============================================================================
// HELPER: CHECK IF ADVISORY HAS ACTIONABLE RECOMMENDATIONS
// =============================================================================

/**
 * Quick check if the advisory has any actionable recommendations.
 * Used to decide whether to show advisory UI.
 */
export function hasActionableInjuryAdvisory(
  advisory: InjurySubstitutionAdvisorySnapshot | null | undefined,
): boolean {
  if (!advisory) return false
  if (advisory.status === 'none') return false
  return advisory.recommendations.length > 0
}

/**
 * Get the highest risk level in the advisory.
 */
export function getHighestRiskLevel(
  advisory: InjurySubstitutionAdvisorySnapshot | null | undefined,
): InjuryRiskLevel | null {
  if (!advisory || advisory.recommendations.length === 0) return null
  
  const hasHigh = advisory.recommendations.some((r) => r.riskLevel === 'high')
  if (hasHigh) return 'high'
  
  const hasMedium = advisory.recommendations.some((r) => r.riskLevel === 'medium')
  if (hasMedium) return 'medium'
  
  return 'low'
}

/**
 * Get recommendations for a specific exercise.
 */
export function getRecommendationsForExercise(
  advisory: InjurySubstitutionAdvisorySnapshot | null | undefined,
  exerciseId: string,
): InjurySubstitutionRecommendation[] {
  if (!advisory) return []
  return advisory.recommendations.filter((r) => r.affectedExerciseId === exerciseId)
}

/**
 * Get recommendations for a specific session.
 */
export function getRecommendationsForSession(
  advisory: InjurySubstitutionAdvisorySnapshot | null | undefined,
  sessionId: string,
): InjurySubstitutionRecommendation[] {
  if (!advisory) return []
  return advisory.recommendations.filter((r) => r.affectedSessionId === sessionId)
}

// =============================================================================
// STEP 22.2 — USER-CONFIRMED CURRENT-SESSION INJURY SUBSTITUTION APPLY
// =============================================================================

/**
 * STEP 22.2 CONTRACT
 *
 * After Step 22.1 generates advisory recommendations, Step 22.2 allows the user
 * to explicitly confirm and apply a substitution for the CURRENT SESSION ONLY.
 *
 * CRITICAL INVARIANTS:
 *   - User must explicitly confirm (confirmedByUser: true)
 *   - Scope is ALWAYS current_session_only
 *   - Saved program is NEVER mutated (programMutation: false)
 *   - Payload is timestamped and expires
 *   - Payload is consumed once and cleared
 *   - Original exercise metadata preserved for reversal
 *
 * @step 22.2 of 22.4
 */

/**
 * The user-confirmed substitution payload for current session.
 * Created when user confirms a recommendation, consumed by workout session.
 */
export interface CurrentSessionInjurySubstitutionPayload {
  /** Unique payload ID for tracking */
  payloadId: string
  /** When this payload was created */
  createdAt: string
  /** When this payload expires (recommended: 1 hour) */
  expiresAt: string
  /** ALWAYS 'current_session_only' */
  scope: 'current_session_only'
  /** Source of the recommendation */
  source: 'injury_substitution_advisory'
  /** ID of the recommendation being applied */
  recommendationId: string
  /** Session ID if available */
  sessionId?: string
  /** Day number if available */
  dayNumber?: number
  /** Week number if available */
  weekNumber?: number
  /** Variant index if available */
  variantIndex?: number
  /** Original exercise ID */
  originalExerciseId?: string
  /** Original exercise name */
  originalExerciseName: string
  /** Substitute exercise ID (generated) */
  substituteExerciseId?: string
  /** Substitute exercise name */
  substituteExerciseName: string
  /** Why this substitution was recommended */
  substitutionReason: string
  /** Affected joint/region */
  affectedJointOrRegion: string
  /** Recommended action from advisory */
  recommendedAction: InjuryRecommendedAction
  /** Risk level from advisory */
  riskLevel: InjuryRiskLevel
  /** ALWAYS TRUE — user explicitly confirmed */
  confirmedByUser: true
  /** ALWAYS FALSE — no runtime/global program mutation */
  programMutation: false
  /** ALWAYS FALSE — saved program is never touched */
  savedProgramMutation: false
  /** TRUE — can be reversed during current session */
  reversible: true
}

/**
 * Applied substitution metadata attached to runtime exercise.
 */
export interface AppliedCurrentSessionInjurySubstitution {
  /** TRUE when applied */
  applied: true
  /** Payload ID for tracking */
  payloadId: string
  /** Recommendation ID from advisory */
  recommendationId: string
  /** Original exercise name (preserved for display/reversal) */
  originalExerciseName: string
  /** Original exercise ID (preserved for reversal) */
  originalExerciseId?: string
  /** Substitute exercise name */
  substituteExerciseName: string
  /** Affected joint/region */
  affectedJointOrRegion: string
  /** Reason for substitution */
  reason: string
  /** When this was applied */
  appliedAt: string
  /** ALWAYS 'current_session_only' */
  scope: 'current_session_only'
  /** TRUE if user restored original */
  restoredOriginal?: boolean
}

// =============================================================================
// STORAGE KEYS
// =============================================================================

const SUBSTITUTION_STORAGE_KEY = 'spartanlab:injury_substitution_payload'
const SUBSTITUTION_FRESHNESS_MS = 60 * 60 * 1000 // 1 hour

// =============================================================================
// PAYLOAD CREATION
// =============================================================================

/**
 * Create a current-session substitution payload from a confirmed recommendation.
 */
export function createSubstitutionPayload(
  recommendation: InjurySubstitutionRecommendation,
  sessionContext?: {
    sessionId?: string
    dayNumber?: number
    weekNumber?: number
    variantIndex?: number
  },
): CurrentSessionInjurySubstitutionPayload {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SUBSTITUTION_FRESHNESS_MS)
  
  return {
    payloadId: `subst_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    scope: 'current_session_only',
    source: 'injury_substitution_advisory',
    recommendationId: recommendation.recommendationId,
    sessionId: sessionContext?.sessionId ?? recommendation.affectedSessionId,
    dayNumber: sessionContext?.dayNumber ?? recommendation.affectedSessionDayNumber,
    weekNumber: sessionContext?.weekNumber,
    variantIndex: sessionContext?.variantIndex,
    originalExerciseId: recommendation.affectedExerciseId,
    originalExerciseName: recommendation.affectedExerciseName,
    substituteExerciseId: recommendation.suggestedAlternativeName
      ? `subst_${recommendation.affectedExerciseId ?? 'unknown'}`
      : undefined,
    substituteExerciseName: recommendation.suggestedAlternativeName ?? recommendation.affectedExerciseName,
    substitutionReason: recommendation.reason,
    affectedJointOrRegion: recommendation.jointOrRegion,
    recommendedAction: recommendation.recommendedAction,
    riskLevel: recommendation.riskLevel,
    confirmedByUser: true,
    programMutation: false,
    savedProgramMutation: false,
    reversible: true,
  }
}

// =============================================================================
// STORAGE BRIDGE — STAMP / READ / CLEAR
// =============================================================================

/**
 * Stamp the confirmed substitution payload to sessionStorage.
 * Called by Program Page / session card after user confirms.
 */
export function stampSubstitutionPayload(payload: CurrentSessionInjurySubstitutionPayload): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(SUBSTITUTION_STORAGE_KEY, JSON.stringify(payload))
  } catch (e) {
    console.warn('[injury-substitution] Failed to stamp payload:', e)
  }
}

/**
 * Read the substitution payload from sessionStorage.
 * Called by workout session page on mount.
 */
export function readSubstitutionPayload(): CurrentSessionInjurySubstitutionPayload | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SUBSTITUTION_STORAGE_KEY)
    if (!raw) return null
    const payload = JSON.parse(raw) as CurrentSessionInjurySubstitutionPayload
    return payload
  } catch (e) {
    console.warn('[injury-substitution] Failed to read payload:', e)
    return null
  }
}

/**
 * Clear the substitution payload from sessionStorage.
 * Called after successful application, restore, or session end.
 */
export function clearSubstitutionPayload(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(SUBSTITUTION_STORAGE_KEY)
  } catch {}
}

// =============================================================================
// VALIDATION — PAYLOAD FRESHNESS AND CONTEXT
// =============================================================================

/**
 * Validate a substitution payload for application.
 */
export function validateSubstitutionPayload(
  payload: CurrentSessionInjurySubstitutionPayload | null,
  currentContext?: {
    sessionId?: string
    dayNumber?: number
    variantIndex?: number
  },
): { valid: boolean; reason?: string } {
  if (!payload) {
    return { valid: false, reason: 'no_payload' }
  }
  
  // Check confirmation
  if (!payload.confirmedByUser) {
    return { valid: false, reason: 'not_confirmed' }
  }
  
  // Check scope
  if (payload.scope !== 'current_session_only') {
    return { valid: false, reason: 'invalid_scope' }
  }
  
  // Check mutation flags
  if (payload.programMutation !== false || payload.savedProgramMutation !== false) {
    return { valid: false, reason: 'mutation_flags_invalid' }
  }
  
  // Check freshness
  const now = Date.now()
  const expiresAt = new Date(payload.expiresAt).getTime()
  if (now > expiresAt) {
    return { valid: false, reason: 'expired' }
  }
  
  // Check context match if provided (loose match — allow missing fields)
  if (currentContext) {
    // Day number must match if both present
    if (
      currentContext.dayNumber !== undefined &&
      payload.dayNumber !== undefined &&
      currentContext.dayNumber !== payload.dayNumber
    ) {
      return { valid: false, reason: 'day_mismatch' }
    }
    // Variant must match if both present
    if (
      currentContext.variantIndex !== undefined &&
      payload.variantIndex !== undefined &&
      currentContext.variantIndex !== payload.variantIndex
    ) {
      return { valid: false, reason: 'variant_mismatch' }
    }
  }
  
  // Check required fields
  if (!payload.originalExerciseName || !payload.substituteExerciseName) {
    return { valid: false, reason: 'missing_exercise_names' }
  }
  
  return { valid: true }
}

// =============================================================================
// RUNTIME APPLICATION — APPLY TO CLONED SESSION
// =============================================================================

/**
 * Apply a validated substitution to a cloned exercise array.
 * NEVER mutates the original — always returns a new array.
 *
 * @param exercises - The session exercises (will be cloned)
 * @param payload - Validated substitution payload
 * @returns New exercise array with substitution applied + metadata
 */
export function applySubstitutionToExercises<T extends { id?: string; name?: string }>(
  exercises: T[],
  payload: CurrentSessionInjurySubstitutionPayload,
): {
  exercises: (T & { injurySubstitution?: AppliedCurrentSessionInjurySubstitution })[]
  applied: boolean
  appliedToIndex: number | null
} {
  // Clone exercises
  const cloned = exercises.map((ex) => ({ ...ex }))
  
  // Find the target exercise
  let appliedToIndex: number | null = null
  
  for (let i = 0; i < cloned.length; i++) {
    const ex = cloned[i]
    const matchesId = payload.originalExerciseId && ex.id === payload.originalExerciseId
    const matchesName =
      ex.name?.toLowerCase().trim() === payload.originalExerciseName.toLowerCase().trim()
    
    if (matchesId || matchesName) {
      // Apply substitution
      const appliedMeta: AppliedCurrentSessionInjurySubstitution = {
        applied: true,
        payloadId: payload.payloadId,
        recommendationId: payload.recommendationId,
        originalExerciseName: payload.originalExerciseName,
        originalExerciseId: payload.originalExerciseId,
        substituteExerciseName: payload.substituteExerciseName,
        affectedJointOrRegion: payload.affectedJointOrRegion,
        reason: payload.substitutionReason,
        appliedAt: new Date().toISOString(),
        scope: 'current_session_only',
      }
      
      // If substitute has a different name, update the display name
      if (payload.substituteExerciseName !== payload.originalExerciseName) {
        ;(cloned[i] as unknown as { name: string }).name = payload.substituteExerciseName
      }
      
      // Attach substitution metadata
      ;(cloned[i] as T & { injurySubstitution?: AppliedCurrentSessionInjurySubstitution }).injurySubstitution = appliedMeta
      
      appliedToIndex = i
      break // Only apply to first matching exercise
    }
  }
  
  return {
    exercises: cloned as (T & { injurySubstitution?: AppliedCurrentSessionInjurySubstitution })[],
    applied: appliedToIndex !== null,
    appliedToIndex,
  }
}

// =============================================================================
// RESTORE ORIGINAL — REVERT SUBSTITUTION IN RUNTIME
// =============================================================================

/**
 * Restore the original exercise in a runtime session.
 * NEVER mutates the original — always returns a new array.
 */
export function restoreOriginalExercise<T extends { id?: string; name?: string; injurySubstitution?: AppliedCurrentSessionInjurySubstitution }>(
  exercises: T[],
  payloadId: string,
): {
  exercises: T[]
  restored: boolean
  restoredIndex: number | null
} {
  const cloned = exercises.map((ex) => ({ ...ex }))
  
  let restoredIndex: number | null = null
  
  for (let i = 0; i < cloned.length; i++) {
    const subst = cloned[i].injurySubstitution
    if (subst?.applied && subst.payloadId === payloadId) {
      // Restore original name
      ;(cloned[i] as unknown as { name: string }).name = subst.originalExerciseName
      
      // Mark as restored
      ;(cloned[i] as { injurySubstitution?: AppliedCurrentSessionInjurySubstitution }).injurySubstitution = {
        ...subst,
        restoredOriginal: true,
      }
      
      restoredIndex = i
      break
    }
  }
  
  return {
    exercises: cloned,
    restored: restoredIndex !== null,
    restoredIndex,
  }
}

// =============================================================================
// STEP 22.3 — LIVE WORKOUT UI HELPERS
// =============================================================================

/**
 * STEP 22.3 — USER-VISIBLE PROOF + FLOW HARDENING
 *
 * These helpers support the live workout UI in showing:
 *   - Why a substitution was recommended
 *   - What original exercise is being replaced
 *   - What replacement is being applied
 *   - That it affects current session only
 *   - That saved program remains unchanged
 *
 * @step 22.3 of 22.4
 */

/**
 * Check if any exercise in the array has an active (not restored) substitution.
 */
export function hasActiveSubstitution<T extends { injurySubstitution?: AppliedCurrentSessionInjurySubstitution }>(
  exercises: T[],
): boolean {
  return exercises.some(
    (ex) => ex.injurySubstitution?.applied && !ex.injurySubstitution.restoredOriginal,
  )
}

/**
 * Get the active substitution metadata from an exercise, if any.
 */
export function getActiveSubstitution<T extends { injurySubstitution?: AppliedCurrentSessionInjurySubstitution }>(
  exercise: T,
): AppliedCurrentSessionInjurySubstitution | null {
  const subst = exercise.injurySubstitution
  if (subst?.applied && !subst.restoredOriginal) {
    return subst
  }
  return null
}

/**
 * Get visible label for substitution badge.
 * Example: "Safer option for shoulder"
 */
export function getSubstitutionBadgeLabel(
  substitution: AppliedCurrentSessionInjurySubstitution | null,
): string | null {
  if (!substitution || substitution.restoredOriginal) return null
  const region = substitution.affectedJointOrRegion.replace(/_/g, ' ')
  return `Safer option for ${region}`
}

/**
 * Get user-friendly display details for a substitution.
 */
export function getSubstitutionDisplayDetails(
  substitution: AppliedCurrentSessionInjurySubstitution | null,
): {
  visible: boolean
  originalExercise: string
  substituteExercise: string
  reason: string
  region: string
  scopeLabel: string
  savedProgramNote: string
} | null {
  if (!substitution || substitution.restoredOriginal) return null
  
  return {
    visible: true,
    originalExercise: substitution.originalExerciseName,
    substituteExercise: substitution.substituteExerciseName,
    reason: substitution.reason,
    region: substitution.affectedJointOrRegion.replace(/_/g, ' '),
    scopeLabel: 'Current workout only',
    savedProgramNote: 'Your saved program is unchanged',
  }
}

/**
 * Get confirmation dialog content for a pending substitution.
 */
export function getSubstitutionConfirmationContent(
  recommendation: InjurySubstitutionRecommendation,
): {
  title: string
  originalExercise: string
  substituteExercise: string
  reason: string
  region: string
  actionLabel: string
  declineLabel: string
  scopeNote: string
  savedProgramNote: string
  cautionNote: string
} {
  return {
    title: 'Safer Exercise Option',
    originalExercise: recommendation.affectedExerciseName,
    substituteExercise: recommendation.suggestedAlternativeName ?? recommendation.affectedExerciseName,
    reason: recommendation.reason,
    region: recommendation.jointOrRegion.replace(/_/g, ' '),
    actionLabel: 'Use safer option for this workout',
    declineLabel: 'Keep original',
    scopeNote: 'This change applies only to today\'s workout.',
    savedProgramNote: 'Your saved program will not be changed.',
    cautionNote: 'This is not medical advice. Stop if pain worsens.',
  }
}

/**
 * Check if a recommendation can be safely applied right now.
 */
export function canApplyRecommendation(
  recommendation: InjurySubstitutionRecommendation,
  currentExerciseName?: string,
): { canApply: boolean; reason?: string } {
  // Must have a suggested alternative
  if (!recommendation.suggestedAlternativeName) {
    return { canApply: false, reason: 'no_alternative_available' }
  }
  
  // If current exercise is provided, it must match
  if (currentExerciseName) {
    const matches = currentExerciseName.toLowerCase().trim() === 
      recommendation.affectedExerciseName.toLowerCase().trim()
    if (!matches) {
      return { canApply: false, reason: 'exercise_mismatch' }
    }
  }
  
  // Must require user confirmation (should always be true in Step 22.1)
  if (!recommendation.requiresUserConfirmation) {
    return { canApply: false, reason: 'auto_apply_blocked' }
  }
  
  return { canApply: true }
}

/**
 * Build completion log metadata for a substituted exercise.
 * Does NOT require schema changes — uses existing metadata patterns.
 */
export function buildSubstitutionLogMetadata(
  substitution: AppliedCurrentSessionInjurySubstitution,
): {
  wasSubstituted: true
  originalExerciseName: string
  substituteExerciseName: string
  substitutionReason: string
  affectedRegion: string
  appliedAt: string
  scope: 'current_session_only'
} {
  return {
    wasSubstituted: true,
    originalExerciseName: substitution.originalExerciseName,
    substituteExerciseName: substitution.substituteExerciseName,
    substitutionReason: substitution.reason,
    affectedRegion: substitution.affectedJointOrRegion,
    appliedAt: substitution.appliedAt,
    scope: 'current_session_only',
  }
}

// =============================================================================
// STEP 22.4 — POST-WORKOUT SAVED-PROGRAM SUBSTITUTION PROPOSAL QUEUE
// =============================================================================

/**
 * STEP 22.4 CONTRACT
 *
 * After a workout completes with current-session substitutions, collect evidence
 * and build a proposal queue for the user to review. The user may then choose
 * to keep the saved program unchanged, defer the decision, or mark the proposal
 * for future program update.
 *
 * CRITICAL INVARIANTS:
 *   - Proposal-first, review-first, user-confirmed only
 *   - No automatic saved-program mutation
 *   - No automatic permanent substitution
 *   - No fake medical or AI claims
 *   - No hidden program edits
 *   - User must explicitly approve before any saved-program change
 *
 * @step 22.4 of 22.x
 */

/**
 * Evidence collected from a completed workout's substitutions.
 */
export interface PostWorkoutSubstitutionEvidence {
  /** Unique evidence ID */
  evidenceId: string
  /** When workout completed */
  completedAt: string
  /** Session identifier if available */
  sessionId?: string
  /** Program ID if available */
  programId?: string
  /** Day key (e.g., "day1", "push") if available */
  dayKey?: string
  /** Variant key if available */
  variantKey?: string
  /** Original exercise ID */
  originalExerciseId?: string
  /** Original exercise name */
  originalExerciseName: string
  /** Substitute exercise name that was used */
  substituteExerciseName: string
  /** Affected joint/region */
  affectedJointOrRegion: string
  /** Reason for substitution */
  reason: string
  /** Source of evidence */
  source: 'current_session_injury_substitution'
  /** Scope of this evidence */
  scope: 'post_workout_review'
  /** ALWAYS FALSE — no automatic saved-program mutation */
  savedProgramMutation: false
  /** FALSE until user explicitly approves */
  userApprovedSavedProgramMutation: false
}

/**
 * Proposal confidence level based on evidence count.
 */
export type SubstitutionProposalConfidence = 'low' | 'moderate' | 'high'

/**
 * Proposal status for tracking user decisions.
 */
export type SubstitutionProposalStatus =
  | 'pending'
  | 'accepted_for_review'
  | 'dismissed'
  | 'deferred'
  | 'blocked'

/**
 * A proposal to update the saved program based on substitution evidence.
 */
export interface SavedProgramSubstitutionProposal {
  /** Unique proposal ID */
  proposalId: string
  /** Current status */
  status: SubstitutionProposalStatus
  /** Original exercise ID if available */
  originalExerciseId?: string
  /** Original exercise name */
  originalExerciseName: string
  /** Proposed substitute exercise name */
  proposedSubstituteExerciseName: string
  /** Affected joint/region */
  affectedJointOrRegion: string
  /** Reasons collected from evidence */
  reasons: string[]
  /** Number of times this substitution was used */
  evidenceCount: number
  /** When first seen */
  firstSeenAt: string
  /** When last seen */
  lastSeenAt: string
  /** Confidence based on evidence count */
  confidence: SubstitutionProposalConfidence
  /** User-friendly recommendation label */
  recommendationLabel: string
  /** Review copy for UI */
  reviewCopy: string
  /** Safety copy for UI */
  safetyCopy: string
  /** Scope of this proposal */
  scope: 'saved_program_proposal_only'
  /** ALWAYS TRUE — requires user approval */
  requiresUserApproval: true
  /** FALSE by default — no automatic mutation */
  savedProgramMutation: false
  /** FALSE by default — user has not approved yet */
  userApprovedSavedProgramMutation: false
  /** Evidence IDs that support this proposal */
  sourceEvidenceIds: string[]
  /** Whether saved-program update can be applied now (requires safe update corridor) */
  canApplyToSavedProgramNow: boolean
  /** If blocked, why */
  blockedReason?: string
}

/**
 * The full proposal queue for post-workout review.
 */
export interface PostWorkoutSubstitutionProposalQueue {
  /** Queue status */
  status: 'none' | 'pending_review' | 'blocked'
  /** Proposals to review */
  proposals: SavedProgramSubstitutionProposal[]
  /** Raw evidence used to build proposals */
  evidence: PostWorkoutSubstitutionEvidence[]
  /** When this queue was generated */
  generatedAt: string
  /** Proof metadata */
  proof: {
    source: 'step_22_4_post_workout_proposal'
    workoutCompletedAt: string
    substitutionCount: number
  }
  /** ALWAYS FALSE — no automatic saved-program mutation */
  savedProgramMutation: false
  /** ALWAYS TRUE — requires user approval */
  requiresUserApproval: true
}

// =============================================================================
// STEP 22.4 STORAGE KEYS
// =============================================================================

const PROPOSAL_QUEUE_STORAGE_KEY = 'spartanlab:postWorkoutSubstitutionProposals'

// =============================================================================
// STEP 22.4 EVIDENCE COLLECTION
// =============================================================================

/**
 * Collect post-workout substitution evidence from completed exercises.
 * Only collects evidence from exercises with applied (not restored) substitutions.
 */
export function collectPostWorkoutSubstitutionEvidence<
  T extends { name?: string; id?: string; injurySubstitution?: AppliedCurrentSessionInjurySubstitution },
>(
  exercises: T[],
  context?: {
    sessionId?: string
    programId?: string
    dayKey?: string
    variantKey?: string
  },
): PostWorkoutSubstitutionEvidence[] {
  const now = new Date().toISOString()
  const evidence: PostWorkoutSubstitutionEvidence[] = []

  for (const exercise of exercises) {
    const subst = exercise.injurySubstitution
    // Only collect evidence from applied substitutions that were NOT restored
    if (subst?.applied && !subst.restoredOriginal) {
      evidence.push({
        evidenceId: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        completedAt: now,
        sessionId: context?.sessionId,
        programId: context?.programId,
        dayKey: context?.dayKey,
        variantKey: context?.variantKey,
        originalExerciseId: subst.originalExerciseId,
        originalExerciseName: subst.originalExerciseName,
        substituteExerciseName: subst.substituteExerciseName,
        affectedJointOrRegion: subst.affectedJointOrRegion,
        reason: subst.reason,
        source: 'current_session_injury_substitution',
        scope: 'post_workout_review',
        savedProgramMutation: false,
        userApprovedSavedProgramMutation: false,
      })
    }
  }

  return evidence
}

// =============================================================================
// STEP 22.4 PROPOSAL BUILDING
// =============================================================================

/**
 * Get confidence level based on evidence count.
 */
function getProposalConfidence(evidenceCount: number): SubstitutionProposalConfidence {
  if (evidenceCount >= 3) return 'high'
  if (evidenceCount >= 2) return 'moderate'
  return 'low'
}

/**
 * Get recommendation label based on confidence.
 */
function getRecommendationLabel(confidence: SubstitutionProposalConfidence): string {
  switch (confidence) {
    case 'high':
      return 'Repeated substitute'
    case 'moderate':
      return 'Used twice'
    case 'low':
    default:
      return 'Used once'
  }
}

/**
 * Get review copy based on evidence count.
 */
function getReviewCopy(
  originalName: string,
  substituteName: string,
  evidenceCount: number,
): string {
  if (evidenceCount >= 3) {
    return `You have used ${substituteName} instead of ${originalName} multiple times. Consider keeping this as your planned substitute.`
  }
  if (evidenceCount >= 2) {
    return `You used ${substituteName} instead of ${originalName} twice. Track one more time before changing your saved program.`
  }
  return `You used ${substituteName} instead of ${originalName} once. Keep tracking before changing your saved program.`
}

/**
 * Build substitution proposals from evidence.
 * Groups evidence by original+substitute exercise pairs.
 */
export function buildSavedProgramSubstitutionProposals(
  evidence: PostWorkoutSubstitutionEvidence[],
  priorEvidence?: PostWorkoutSubstitutionEvidence[],
): PostWorkoutSubstitutionProposalQueue {
  const now = new Date().toISOString()

  if (evidence.length === 0) {
    return {
      status: 'none',
      proposals: [],
      evidence: [],
      generatedAt: now,
      proof: {
        source: 'step_22_4_post_workout_proposal',
        workoutCompletedAt: now,
        substitutionCount: 0,
      },
      savedProgramMutation: false,
      requiresUserApproval: true,
    }
  }

  // Combine current and prior evidence
  const allEvidence = [...evidence, ...(priorEvidence || [])]

  // Group by original+substitute pair
  const groups = new Map<
    string,
    {
      originalExerciseId?: string
      originalExerciseName: string
      substituteExerciseName: string
      affectedJointOrRegion: string
      reasons: Set<string>
      evidenceIds: string[]
      firstSeenAt: string
      lastSeenAt: string
    }
  >()

  for (const ev of allEvidence) {
    const key = `${ev.originalExerciseName.toLowerCase()}|${ev.substituteExerciseName.toLowerCase()}`
    const existing = groups.get(key)

    if (existing) {
      existing.reasons.add(ev.reason)
      existing.evidenceIds.push(ev.evidenceId)
      if (ev.completedAt < existing.firstSeenAt) {
        existing.firstSeenAt = ev.completedAt
      }
      if (ev.completedAt > existing.lastSeenAt) {
        existing.lastSeenAt = ev.completedAt
      }
    } else {
      groups.set(key, {
        originalExerciseId: ev.originalExerciseId,
        originalExerciseName: ev.originalExerciseName,
        substituteExerciseName: ev.substituteExerciseName,
        affectedJointOrRegion: ev.affectedJointOrRegion,
        reasons: new Set([ev.reason]),
        evidenceIds: [ev.evidenceId],
        firstSeenAt: ev.completedAt,
        lastSeenAt: ev.completedAt,
      })
    }
  }

  // Build proposals from groups
  const proposals: SavedProgramSubstitutionProposal[] = []

  for (const group of groups.values()) {
    const evidenceCount = group.evidenceIds.length
    const confidence = getProposalConfidence(evidenceCount)

    proposals.push({
      proposalId: `prop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: 'pending',
      originalExerciseId: group.originalExerciseId,
      originalExerciseName: group.originalExerciseName,
      proposedSubstituteExerciseName: group.substituteExerciseName,
      affectedJointOrRegion: group.affectedJointOrRegion,
      reasons: Array.from(group.reasons),
      evidenceCount,
      firstSeenAt: group.firstSeenAt,
      lastSeenAt: group.lastSeenAt,
      confidence,
      recommendationLabel: getRecommendationLabel(confidence),
      reviewCopy: getReviewCopy(
        group.originalExerciseName,
        group.substituteExerciseName,
        evidenceCount,
      ),
      safetyCopy: 'Not medical advice. Stop if pain worsens.',
      scope: 'saved_program_proposal_only',
      requiresUserApproval: true,
      savedProgramMutation: false,
      userApprovedSavedProgramMutation: false,
      sourceEvidenceIds: group.evidenceIds,
      // Saved-program mutation is NOT implemented yet — mark as blocked
      canApplyToSavedProgramNow: false,
      blockedReason: 'Saved-program update not yet implemented. Proposal saved for future review.',
    })
  }

  return {
    status: proposals.length > 0 ? 'pending_review' : 'none',
    proposals,
    evidence: allEvidence,
    generatedAt: now,
    proof: {
      source: 'step_22_4_post_workout_proposal',
      workoutCompletedAt: now,
      substitutionCount: evidence.length,
    },
    savedProgramMutation: false,
    requiresUserApproval: true,
  }
}

// =============================================================================
// STEP 22.4 PROPOSAL ACTIONS
// =============================================================================

/**
 * Mark a proposal as dismissed.
 */
export function markProposalDismissed(
  queue: PostWorkoutSubstitutionProposalQueue,
  proposalId: string,
): PostWorkoutSubstitutionProposalQueue {
  return {
    ...queue,
    proposals: queue.proposals.map((p) =>
      p.proposalId === proposalId ? { ...p, status: 'dismissed' as const } : p,
    ),
  }
}

/**
 * Mark a proposal as deferred (remind later).
 */
export function markProposalDeferred(
  queue: PostWorkoutSubstitutionProposalQueue,
  proposalId: string,
): PostWorkoutSubstitutionProposalQueue {
  return {
    ...queue,
    proposals: queue.proposals.map((p) =>
      p.proposalId === proposalId ? { ...p, status: 'deferred' as const } : p,
    ),
  }
}

/**
 * Mark a proposal as accepted for review (does NOT mutate saved program).
 * Actual saved-program mutation requires a separate explicit confirmation
 * through a safe update corridor (not yet implemented).
 */
export function markProposalAcceptedForReview(
  queue: PostWorkoutSubstitutionProposalQueue,
  proposalId: string,
): PostWorkoutSubstitutionProposalQueue {
  return {
    ...queue,
    proposals: queue.proposals.map((p) =>
      p.proposalId === proposalId
        ? {
            ...p,
            status: 'accepted_for_review' as const,
            // Still does NOT approve saved-program mutation
            userApprovedSavedProgramMutation: false,
          }
        : p,
    ),
  }
}

// =============================================================================
// STEP 22.4 STORAGE HELPERS
// =============================================================================

/**
 * Save proposal queue to sessionStorage for post-workout review persistence.
 */
export function saveProposalQueue(queue: PostWorkoutSubstitutionProposalQueue): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(PROPOSAL_QUEUE_STORAGE_KEY, JSON.stringify(queue))
  } catch (e) {
    console.warn('[injury-substitution] Failed to save proposal queue:', e)
  }
}

/**
 * Load proposal queue from sessionStorage.
 */
export function loadProposalQueue(): PostWorkoutSubstitutionProposalQueue | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PROPOSAL_QUEUE_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PostWorkoutSubstitutionProposalQueue
  } catch (e) {
    console.warn('[injury-substitution] Failed to load proposal queue:', e)
    return null
  }
}

/**
 * Clear proposal queue from sessionStorage.
 */
export function clearProposalQueue(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(PROPOSAL_QUEUE_STORAGE_KEY)
  } catch {}
}

// =============================================================================
// STEP 22.4 UI HELPERS
// =============================================================================

/**
 * Check if there are any pending proposals to review.
 */
export function hasPendingProposals(queue: PostWorkoutSubstitutionProposalQueue | null): boolean {
  if (!queue) return false
  return queue.proposals.some((p) => p.status === 'pending')
}

/**
 * Get pending proposals for review.
 */
export function getPendingProposals(
  queue: PostWorkoutSubstitutionProposalQueue | null,
): SavedProgramSubstitutionProposal[] {
  if (!queue) return []
  return queue.proposals.filter((p) => p.status === 'pending')
}

/**
 * Get proposal display info for UI.
 */
export function getProposalDisplayInfo(proposal: SavedProgramSubstitutionProposal): {
  title: string
  original: string
  substitute: string
  region: string
  reason: string
  evidenceNote: string
  scopeNote: string
  savedProgramNote: string
  safetyCopy: string
  confidenceBadge: string
  confidenceColor: string
} {
  return {
    title: 'Safer Substitute Used',
    original: proposal.originalExerciseName,
    substitute: proposal.proposedSubstituteExerciseName,
    region: proposal.affectedJointOrRegion.replace(/_/g, ' '),
    reason: proposal.reasons[0] || 'Discomfort signal',
    evidenceNote:
      proposal.evidenceCount === 1
        ? 'Used once this workout'
        : `Used ${proposal.evidenceCount} times`,
    scopeNote: 'Saved program unchanged',
    savedProgramNote: 'Your saved program has not been changed.',
    safetyCopy: proposal.safetyCopy,
    confidenceBadge: proposal.recommendationLabel,
    confidenceColor:
      proposal.confidence === 'high'
        ? 'text-teal-400'
        : proposal.confidence === 'moderate'
          ? 'text-amber-400'
          : 'text-[#6B7280]',
  }
}
