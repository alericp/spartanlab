/**
 * [LIVE-WORKOUT-NORMALIZERS] Canonical Live Input Normalization
 * 
 * This module normalizes all meaningful live workout inputs into structured
 * control signals that can drive:
 * - Current exercise adjustments
 * - Remaining set adjustments  
 * - Support/load suggestions
 * - Skip-intent consequences
 * - Future session memory
 * 
 * ALL live input normalization flows through this module.
 * No parallel normalization paths allowed.
 */

import type { RPEValue } from '@/lib/rpe-adjustment-engine'
import type { ResistanceBandColor } from '@/lib/band-progression-engine'
import type { 
  CoachingSignalTag, 
  MultiBandSelection,
  SkipDecision,
  ExerciseInputMode,
  WorkoutExecutionMode,
} from './live-workout-authority-contract'
import { createMultiBandSelection } from './live-workout-authority-contract'

// =============================================================================
// CANONICAL NORMALIZED LIVE INPUT STRUCTURE
// =============================================================================

/**
 * Performance outcome from a completed set.
 */
export interface NormalizedPerformanceOutcome {
  actualReps: number
  targetReps: number | null
  actualHoldSeconds: number | null
  targetHoldSeconds: number | null
  actualRPE: RPEValue
  targetRPE: number
  
  // Derived comparisons
  repsDeviation: number         // actual - target, positive = exceeded
  holdDeviation: number         // actual - target, positive = exceeded
  rpeDeviation: number          // actual - target, positive = harder than expected
  volumeOutcome: 'exceeded' | 'met' | 'missed'
  effortOutcome: 'easy' | 'target' | 'hard' | 'max_effort'
  
  // Pattern detection (requires history)
  isRepeatedFatigue: boolean
  isRepeatedMiss: boolean
  isConsistentOverperform: boolean
}

/**
 * Support/load input normalized for any exercise type.
 */
export interface NormalizedSupportLoad {
  mode: 'none' | 'band_assisted' | 'weighted'
  
  // Band assistance (when mode = 'band_assisted')
  selectedBands: ResistanceBandColor[]
  multiBandSelection: MultiBandSelection | null
  totalAssistanceLevel: number  // 0-100 combined assistance
  assistanceCategory: 'none' | 'minimal' | 'light' | 'medium' | 'heavy'
  
  // Weighted load (when mode = 'weighted')
  prescribedLoad: number | null
  prescribedLoadUnit: string
  actualLoadUsed: number | null
  actualLoadUnit: string
  loadDeviation: number         // actual - prescribed
  loadDeviationPercent: number
  loadOutcome: 'lighter' | 'prescribed' | 'heavier'
}

/**
 * Coaching signals extracted from notes/tags.
 * These are ACTIVE signals that feed the planner, not passive history.
 */
export interface NormalizedCoachingSignals {
  // Raw inputs preserved
  rawTags: CoachingSignalTag[]
  rawFreeText: string | null
  
  // Normalized signal flags (canonical, planner-readable)
  tooEasy: boolean
  tooHard: boolean
  painDetected: boolean
  discomfortDetected: boolean
  fatigueDetected: boolean
  gripLimited: boolean
  formIssue: boolean
  balanceIssue: boolean
  focusLost: boolean
  breathingIssue: boolean
  jointStress: boolean
  muscleCramping: boolean
  
  // Derived from free text (safe keyword extraction only)
  straightArmFatigue: boolean
  supportMismatch: boolean
  loadMismatch: boolean
  recoveryConcern: boolean
  
  // Aggregate severity
  hasCriticalSignal: boolean
  hasWarningSignal: boolean
  signalSeverity: 'none' | 'info' | 'warning' | 'critical'
}

/**
 * Skip intent normalized and typed.
 */
export interface NormalizedSkipIntent {
  type: 'none' | 'skip_current_set' | 'skip_remaining_sets' | 'end_exercise_early'
  reason: string | null
  triggeredBy: 'user_choice' | 'pain_protection' | 'fatigue_protection' | 'time_constraint'
  
  // Context for training data
  completedSetsBeforeSkip: number
  skippedSetCount: number
  remainingSetsSkipped: number
  
  // Logging metadata
  timestamp: number
  shouldPreserveAsTrainingData: boolean
}

/**
 * Session execution mode normalized.
 */
export interface NormalizedSessionExecution {
  selectedMode: WorkoutExecutionMode
  targetMinutes: number | null
  isTimeConstrained: boolean
  
  // Runtime tracking
  elapsedMinutes: number
  isOverBudget: boolean
  remainingMinutes: number | null
  
  // Exercise list authority
  exerciseCountForMode: number
  isUsingCorrectExerciseList: boolean
}

/**
 * Exercise intent classification for rep range/set count expression.
 */
export interface NormalizedExerciseIntent {
  primaryIntent: 'strength' | 'skill_quality' | 'technical_practice' | 'controlled_volume' | 'assistance_progression' | 'recovery_exposure'
  isStrengthPriority: boolean
  isQualityPriority: boolean
  isTechnicalPriority: boolean
  isVolumePriority: boolean
  isRecoveryProtected: boolean
  
  // Target classification
  targetRepsCategory: 'strength' | 'hypertrophy' | 'endurance' | 'skill'
  setsCategory: 'low' | 'moderate' | 'high'
}

/**
 * Complete canonical normalized live input for a set.
 */
export interface CanonicalNormalizedInput {
  exerciseIndex: number
  setNumber: number
  timestamp: number
  
  performance: NormalizedPerformanceOutcome
  supportLoad: NormalizedSupportLoad
  coachingSignals: NormalizedCoachingSignals
  skipIntent: NormalizedSkipIntent
  sessionExecution: NormalizedSessionExecution
  exerciseIntent: NormalizedExerciseIntent
}

// =============================================================================
// PERFORMANCE OUTCOME NORMALIZATION
// =============================================================================

export function normalizePerformanceOutcome(
  input: {
    actualReps: number
    targetReps?: number
    actualHoldSeconds?: number
    targetHoldSeconds?: number
    actualRPE: RPEValue
    targetRPE?: number
    // History for pattern detection
    previousSets?: Array<{
      actualReps: number
      targetReps?: number
      actualRPE: RPEValue
    }>
  }
): NormalizedPerformanceOutcome {
  const targetReps = input.targetReps ?? null
  const targetHoldSeconds = input.targetHoldSeconds ?? null
  const targetRPE = input.targetRPE ?? 8
  const actualHoldSeconds = input.actualHoldSeconds ?? null
  
  // Calculate deviations
  const repsDeviation = targetReps !== null ? input.actualReps - targetReps : 0
  const holdDeviation = (targetHoldSeconds !== null && actualHoldSeconds !== null) 
    ? actualHoldSeconds - targetHoldSeconds 
    : 0
  const rpeDeviation = (input.actualRPE as number) - targetRPE
  
  // Volume outcome
  let volumeOutcome: NormalizedPerformanceOutcome['volumeOutcome'] = 'met'
  if (targetReps !== null) {
    if (input.actualReps >= targetReps) {
      volumeOutcome = input.actualReps > targetReps ? 'exceeded' : 'met'
    } else {
      volumeOutcome = 'missed'
    }
  }
  
  // Effort outcome
  const rpe = input.actualRPE as number
  let effortOutcome: NormalizedPerformanceOutcome['effortOutcome'] = 'target'
  if (rpe >= 10) {
    effortOutcome = 'max_effort'
  } else if (rpe >= targetRPE + 1) {
    effortOutcome = 'hard'
  } else if (rpe <= targetRPE - 2) {
    effortOutcome = 'easy'
  }
  
  // Pattern detection from history
  let isRepeatedFatigue = false
  let isRepeatedMiss = false
  let isConsistentOverperform = false
  
  if (input.previousSets && input.previousSets.length >= 2) {
    const recentSets = input.previousSets.slice(-2)
    
    // Check for repeated high RPE (fatigue)
    isRepeatedFatigue = recentSets.every(s => (s.actualRPE as number) >= 9)
    
    // Check for repeated misses
    isRepeatedMiss = recentSets.every(s => 
      s.targetReps !== undefined && s.actualReps < s.targetReps
    )
    
    // Check for consistent overperformance
    isConsistentOverperform = recentSets.every(s =>
      s.targetReps !== undefined && s.actualReps >= s.targetReps && (s.actualRPE as number) <= 7
    )
  }
  
  return {
    actualReps: input.actualReps,
    targetReps,
    actualHoldSeconds,
    targetHoldSeconds,
    actualRPE: input.actualRPE,
    targetRPE,
    repsDeviation,
    holdDeviation,
    rpeDeviation,
    volumeOutcome,
    effortOutcome,
    isRepeatedFatigue,
    isRepeatedMiss,
    isConsistentOverperform,
  }
}

// =============================================================================
// SUPPORT/LOAD NORMALIZATION
// =============================================================================

const BAND_ASSISTANCE_VALUES: Record<ResistanceBandColor, number> = {
  'black': 100,
  'purple': 80,
  'green': 60,
  'blue': 45,
  'red': 30,
  'yellow': 15,
  'orange': 10,
}

export function normalizeSupportLoad(
  input: {
    inputMode: ExerciseInputMode
    selectedBands?: ResistanceBandColor[]
    prescribedLoad?: number
    prescribedLoadUnit?: string
    actualLoadUsed?: number
    actualLoadUnit?: string
  }
): NormalizedSupportLoad {
  // Determine mode from input mode
  let mode: NormalizedSupportLoad['mode'] = 'none'
  if (input.inputMode === 'band_assisted_skill') {
    mode = 'band_assisted'
  } else if (input.inputMode === 'weighted_strength' || input.inputMode === 'reps_per_side') {
    mode = 'weighted'
  }
  
  // Band assistance
  const selectedBands = input.selectedBands || []
  const multiBandSelection = selectedBands.length > 0 
    ? createMultiBandSelection(selectedBands) 
    : null
  
  const totalAssistanceLevel = selectedBands.reduce(
    (sum, band) => sum + (BAND_ASSISTANCE_VALUES[band] || 20), 
    0
  )
  
  let assistanceCategory: NormalizedSupportLoad['assistanceCategory'] = 'none'
  if (totalAssistanceLevel >= 80) {
    assistanceCategory = 'heavy'
  } else if (totalAssistanceLevel >= 50) {
    assistanceCategory = 'medium'
  } else if (totalAssistanceLevel >= 25) {
    assistanceCategory = 'light'
  } else if (totalAssistanceLevel > 0) {
    assistanceCategory = 'minimal'
  }
  
  // Weighted load
  const prescribedLoad = input.prescribedLoad ?? null
  const actualLoadUsed = input.actualLoadUsed ?? null
  const loadDeviation = (prescribedLoad !== null && actualLoadUsed !== null)
    ? actualLoadUsed - prescribedLoad
    : 0
  const loadDeviationPercent = (prescribedLoad && prescribedLoad > 0)
    ? (loadDeviation / prescribedLoad) * 100
    : 0
  
  let loadOutcome: NormalizedSupportLoad['loadOutcome'] = 'prescribed'
  if (loadDeviation < -0.5) {
    loadOutcome = 'lighter'
  } else if (loadDeviation > 0.5) {
    loadOutcome = 'heavier'
  }
  
  return {
    mode,
    selectedBands,
    multiBandSelection,
    totalAssistanceLevel,
    assistanceCategory,
    prescribedLoad,
    prescribedLoadUnit: input.prescribedLoadUnit || 'lbs',
    actualLoadUsed,
    actualLoadUnit: input.actualLoadUnit || 'lbs',
    loadDeviation,
    loadDeviationPercent,
    loadOutcome,
  }
}

// =============================================================================
// COACHING SIGNALS NORMALIZATION
// =============================================================================

/**
 * Safe keyword patterns for free text signal extraction.
 * Only simple, unambiguous patterns are used.
 */
const FREE_TEXT_SIGNAL_PATTERNS: Array<{
  pattern: RegExp
  signal: keyof Pick<NormalizedCoachingSignals, 
    'straightArmFatigue' | 'supportMismatch' | 'loadMismatch' | 'recoveryConcern'
  >
}> = [
  { pattern: /straight\s*arm|connective|elbow\s*(stress|pain)/i, signal: 'straightArmFatigue' },
  { pattern: /band\s*(too|not enough)|need\s*(more|less)\s*(support|assistance)/i, signal: 'supportMismatch' },
  { pattern: /weight\s*(too|not)|load\s*(too|heavy|light)|need\s*(more|less)\s*weight/i, signal: 'loadMismatch' },
  { pattern: /sore|tired|recovery|rest\s*day|need\s*rest/i, signal: 'recoveryConcern' },
]

export function normalizeCoachingSignals(
  input: {
    tags?: CoachingSignalTag[]
    freeText?: string | null
  }
): NormalizedCoachingSignals {
  const tags = input.tags || []
  const freeText = input.freeText || null
  
  // Map tags to boolean flags
  const tooEasy = tags.includes('too_easy')
  const tooHard = tags.includes('too_hard')
  const painDetected = tags.includes('pain')
  const discomfortDetected = tags.includes('discomfort')
  const fatigueDetected = tags.includes('fatigue')
  const gripLimited = tags.includes('grip_limited')
  const formIssue = tags.includes('form_issue')
  const balanceIssue = tags.includes('balance_issue')
  const focusLost = tags.includes('focus_lost')
  const breathingIssue = tags.includes('breathing_issue')
  const jointStress = tags.includes('joint_stress')
  const muscleCramping = tags.includes('muscle_cramping')
  
  // Safe free text signal extraction
  let straightArmFatigue = false
  let supportMismatch = false
  let loadMismatch = false
  let recoveryConcern = false
  
  if (freeText && freeText.length > 0) {
    for (const { pattern, signal } of FREE_TEXT_SIGNAL_PATTERNS) {
      if (pattern.test(freeText)) {
        switch (signal) {
          case 'straightArmFatigue': straightArmFatigue = true; break
          case 'supportMismatch': supportMismatch = true; break
          case 'loadMismatch': loadMismatch = true; break
          case 'recoveryConcern': recoveryConcern = true; break
        }
      }
    }
  }
  
  // Aggregate severity
  const hasCriticalSignal = painDetected || jointStress
  const hasWarningSignal = tooHard || discomfortDetected || fatigueDetected || 
    formIssue || breathingIssue || muscleCramping || straightArmFatigue
  
  let signalSeverity: NormalizedCoachingSignals['signalSeverity'] = 'none'
  if (hasCriticalSignal) {
    signalSeverity = 'critical'
  } else if (hasWarningSignal) {
    signalSeverity = 'warning'
  } else if (tags.length > 0) {
    signalSeverity = 'info'
  }
  
  return {
    rawTags: tags,
    rawFreeText: freeText,
    tooEasy,
    tooHard,
    painDetected,
    discomfortDetected,
    fatigueDetected,
    gripLimited,
    formIssue,
    balanceIssue,
    focusLost,
    breathingIssue,
    jointStress,
    muscleCramping,
    straightArmFatigue,
    supportMismatch,
    loadMismatch,
    recoveryConcern,
    hasCriticalSignal,
    hasWarningSignal,
    signalSeverity,
  }
}

// =============================================================================
// SKIP INTENT NORMALIZATION
// =============================================================================

export function normalizeSkipIntent(
  input: {
    skipDecision?: SkipDecision | null
    currentSetNumber: number
    totalSets: number
    hasPainSignal?: boolean
    hasFatigueSignal?: boolean
    isOverTimeBudget?: boolean
  }
): NormalizedSkipIntent {
  if (!input.skipDecision) {
    return {
      type: 'none',
      reason: null,
      triggeredBy: 'user_choice',
      completedSetsBeforeSkip: input.currentSetNumber - 1,
      skippedSetCount: 0,
      remainingSetsSkipped: 0,
      timestamp: Date.now(),
      shouldPreserveAsTrainingData: false,
    }
  }
  
  const { action, reason, completedSets, skippedSets, remainingSets, timestamp } = input.skipDecision
  
  // Determine skip type
  let type: NormalizedSkipIntent['type'] = 'none'
  if (action === 'skip_set') {
    type = 'skip_current_set'
  } else if (action === 'end_exercise') {
    type = remainingSets > 1 ? 'skip_remaining_sets' : 'end_exercise_early'
  }
  
  // Determine trigger reason
  let triggeredBy: NormalizedSkipIntent['triggeredBy'] = 'user_choice'
  if (input.hasPainSignal) {
    triggeredBy = 'pain_protection'
  } else if (input.hasFatigueSignal) {
    triggeredBy = 'fatigue_protection'
  } else if (input.isOverTimeBudget) {
    triggeredBy = 'time_constraint'
  }
  
  return {
    type,
    reason: reason || null,
    triggeredBy,
    completedSetsBeforeSkip: completedSets,
    skippedSetCount: skippedSets,
    remainingSetsSkipped: remainingSets,
    timestamp,
    shouldPreserveAsTrainingData: true, // Always preserve for training data
  }
}

// =============================================================================
// SESSION EXECUTION NORMALIZATION
// =============================================================================

export function normalizeSessionExecution(
  input: {
    selectedMode: WorkoutExecutionMode
    elapsedSeconds: number
    exerciseCountForMode: number
    actualExerciseCount: number
  }
): NormalizedSessionExecution {
  const targetMinutesMap: Record<WorkoutExecutionMode, number | null> = {
    '30_min': 30,
    '45_min': 45,
    'full': null,
  }
  
  const targetMinutes = targetMinutesMap[input.selectedMode]
  const elapsedMinutes = Math.floor(input.elapsedSeconds / 60)
  const isTimeConstrained = targetMinutes !== null
  const isOverBudget = isTimeConstrained && elapsedMinutes > targetMinutes
  const remainingMinutes = isTimeConstrained ? Math.max(0, targetMinutes - elapsedMinutes) : null
  
  return {
    selectedMode: input.selectedMode,
    targetMinutes,
    isTimeConstrained,
    elapsedMinutes,
    isOverBudget,
    remainingMinutes,
    exerciseCountForMode: input.exerciseCountForMode,
    isUsingCorrectExerciseList: input.actualExerciseCount === input.exerciseCountForMode,
  }
}

// =============================================================================
// EXERCISE INTENT NORMALIZATION
// =============================================================================

export function normalizeExerciseIntent(
  input: {
    targetReps?: number
    targetSets?: number
    inputMode: ExerciseInputMode
    exerciseName: string
    sessionIntent?: 'strength' | 'skill' | 'conditioning' | 'recovery'
  }
): NormalizedExerciseIntent {
  const targetReps = input.targetReps ?? 8
  const targetSets = input.targetSets ?? 3
  const name = input.exerciseName.toLowerCase()
  
  // Target reps category
  let targetRepsCategory: NormalizedExerciseIntent['targetRepsCategory'] = 'strength'
  if (targetReps <= 5) {
    targetRepsCategory = 'strength'
  } else if (targetReps <= 12) {
    targetRepsCategory = 'hypertrophy'
  } else if (targetReps <= 20) {
    targetRepsCategory = 'endurance'
  } else {
    targetRepsCategory = 'skill'  // High rep skill work
  }
  
  // Override for skill-based input modes
  if (input.inputMode === 'band_assisted_skill' || input.inputMode === 'timed_hold') {
    targetRepsCategory = 'skill'
  }
  
  // Sets category
  let setsCategory: NormalizedExerciseIntent['setsCategory'] = 'moderate'
  if (targetSets <= 2) {
    setsCategory = 'low'
  } else if (targetSets >= 5) {
    setsCategory = 'high'
  }
  
  // Determine primary intent
  let primaryIntent: NormalizedExerciseIntent['primaryIntent'] = 'strength'
  
  if (input.inputMode === 'band_assisted_skill') {
    primaryIntent = 'assistance_progression'
  } else if (input.inputMode === 'timed_hold') {
    primaryIntent = 'skill_quality'
  } else if (targetRepsCategory === 'skill') {
    primaryIntent = 'technical_practice'
  } else if (name.includes('recovery') || name.includes('mobility')) {
    primaryIntent = 'recovery_exposure'
  } else if (targetRepsCategory === 'strength') {
    primaryIntent = 'strength'
  } else {
    primaryIntent = 'controlled_volume'
  }
  
  // Recovery-sensitive detection
  const isRecoveryProtected = 
    name.includes('straight arm') ||
    name.includes('planche') ||
    name.includes('lever') ||
    name.includes('maltese') ||
    name.includes('iron cross')
  
  return {
    primaryIntent,
    isStrengthPriority: primaryIntent === 'strength',
    isQualityPriority: primaryIntent === 'skill_quality' || primaryIntent === 'technical_practice',
    isTechnicalPriority: primaryIntent === 'technical_practice',
    isVolumePriority: primaryIntent === 'controlled_volume',
    isRecoveryProtected,
    targetRepsCategory,
    setsCategory,
  }
}

// =============================================================================
// FULL CANONICAL INPUT BUILDER
// =============================================================================

export function buildCanonicalNormalizedInput(
  input: {
    exerciseIndex: number
    setNumber: number
    exerciseName: string
    inputMode: ExerciseInputMode
    
    // Performance
    actualReps: number
    targetReps?: number
    actualHoldSeconds?: number
    targetHoldSeconds?: number
    actualRPE: RPEValue
    targetRPE?: number
    previousSets?: Array<{
      actualReps: number
      targetReps?: number
      actualRPE: RPEValue
    }>
    
    // Support/Load
    selectedBands?: ResistanceBandColor[]
    prescribedLoad?: number
    prescribedLoadUnit?: string
    actualLoadUsed?: number
    actualLoadUnit?: string
    
    // Coaching
    tags?: CoachingSignalTag[]
    freeText?: string | null
    
    // Skip
    skipDecision?: SkipDecision | null
    totalSets?: number
    
    // Session
    executionMode: WorkoutExecutionMode
    elapsedSeconds: number
    exerciseCountForMode: number
    actualExerciseCount: number
  }
): CanonicalNormalizedInput {
  const coachingSignals = normalizeCoachingSignals({
    tags: input.tags,
    freeText: input.freeText,
  })
  
  return {
    exerciseIndex: input.exerciseIndex,
    setNumber: input.setNumber,
    timestamp: Date.now(),
    
    performance: normalizePerformanceOutcome({
      actualReps: input.actualReps,
      targetReps: input.targetReps,
      actualHoldSeconds: input.actualHoldSeconds,
      targetHoldSeconds: input.targetHoldSeconds,
      actualRPE: input.actualRPE,
      targetRPE: input.targetRPE,
      previousSets: input.previousSets,
    }),
    
    supportLoad: normalizeSupportLoad({
      inputMode: input.inputMode,
      selectedBands: input.selectedBands,
      prescribedLoad: input.prescribedLoad,
      prescribedLoadUnit: input.prescribedLoadUnit,
      actualLoadUsed: input.actualLoadUsed,
      actualLoadUnit: input.actualLoadUnit,
    }),
    
    coachingSignals,
    
    skipIntent: normalizeSkipIntent({
      skipDecision: input.skipDecision,
      currentSetNumber: input.setNumber,
      totalSets: input.totalSets ?? 3,
      hasPainSignal: coachingSignals.painDetected,
      hasFatigueSignal: coachingSignals.fatigueDetected,
    }),
    
    sessionExecution: normalizeSessionExecution({
      selectedMode: input.executionMode,
      elapsedSeconds: input.elapsedSeconds,
      exerciseCountForMode: input.exerciseCountForMode,
      actualExerciseCount: input.actualExerciseCount,
    }),
    
    exerciseIntent: normalizeExerciseIntent({
      targetReps: input.targetReps,
      targetSets: input.totalSets,
      inputMode: input.inputMode,
      exerciseName: input.exerciseName,
    }),
  }
}
