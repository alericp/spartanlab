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
