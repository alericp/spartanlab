/**
 * [LIVE-WORKOUT-AUTHORITY] Authoritative Runtime Contract
 * 
 * This module establishes single-source-of-truth ownership for:
 * 1. Workout execution mode (30/45/full)
 * 2. Exercise input mode classification
 * 3. Multi-band support for band-assisted exercises
 * 4. Live input adaptation horizon classification
 * 5. Skip vs End Exercise semantics
 * 6. Structured coaching signals from notes/tags
 * 
 * All live workout runtime truth flows through this contract.
 */

import type { ResistanceBandColor } from '@/lib/band-progression-engine'
import type { RPEValue } from '@/lib/rpe-adjustment-engine'

// =============================================================================
// WORKOUT EXECUTION MODE
// =============================================================================

/**
 * Workout duration mode selected before starting.
 * Once started, this becomes the authoritative runtime mode.
 */
export type WorkoutExecutionMode = '30_min' | '45_min' | 'full'

export const EXECUTION_MODE_LABELS: Record<WorkoutExecutionMode, string> = {
  '30_min': '30 Minutes',
  '45_min': '45 Minutes',
  'full': 'Full Session',
}

export const EXECUTION_MODE_TARGET_MINUTES: Record<WorkoutExecutionMode, number | null> = {
  '30_min': 30,
  '45_min': 45,
  'full': null, // No time constraint
}

// =============================================================================
// EXERCISE INPUT MODE
// =============================================================================

/**
 * Input mode classification for each exercise.
 * Determines which UI controls and data capture fields are shown.
 */
export type ExerciseInputMode = 
  | 'band_assisted_skill'    // Band selection + reps/hold + RPE
  | 'weighted_strength'      // Load input + reps + RPE
  | 'bodyweight_strength'    // Reps + RPE (no band, no weight)
  | 'timed_hold'             // Duration + RPE (static holds)
  | 'reps_per_side'          // Reps per side + RPE (unilateral)
  | 'density_block'          // Time-based density work

export interface ExerciseInputModeContract {
  mode: ExerciseInputMode
  showBandSelector: boolean
  showMultiBandSelector: boolean
  showLoadInput: boolean
  showRepsInput: boolean
  showHoldInput: boolean
  showPerSideToggle: boolean
  showRPEInput: boolean
  primaryInputLabel: string
}

/**
 * Resolve input mode for an exercise based on its metadata.
 */
export function resolveExerciseInputMode(
  exercise: {
    name: string
    category?: string
    method?: string
    executionTruth?: {
      bandSelectable?: boolean
      isWeighted?: boolean
      isTimedHold?: boolean
      isUnilateral?: boolean
    }
    prescribedLoad?: {
      load?: number
      unit?: string
    }
  }
): ExerciseInputModeContract {
  const name = exercise.name?.toLowerCase() || ''
  const category = exercise.category?.toLowerCase() || ''
  const method = exercise.method?.toLowerCase() || ''
  const exec = exercise.executionTruth || {}
  
  // Band-assisted skill work
  if (exec.bandSelectable === true) {
    return {
      mode: 'band_assisted_skill',
      showBandSelector: true,
      showMultiBandSelector: true, // Enable multi-band selection
      showLoadInput: false,
      showRepsInput: true,
      showHoldInput: true,
      showPerSideToggle: false,
      showRPEInput: true,
      primaryInputLabel: 'Reps or Hold Time',
    }
  }
  
  // Weighted strength exercises
  // [LIVE-INPUT-AUTHORITY] Only real weighted signals classify as weighted_strength.
  // Category-only heuristics like category === 'strength' or name.includes('pull-up')
  // were over-expanding classification and incorrectly hiding band UI for bodyweight
  // movements while simultaneously allowing downstream render gates to leak band UI
  // onto real weighted movements. Keep this strict: explicit isWeighted flag,
  // a valid prescribed external load, or an explicit "weighted" name token.
  const hasPrescribedLoad =
    typeof exercise.prescribedLoad?.load === 'number' && exercise.prescribedLoad.load > 0
  if (
    exec.isWeighted === true ||
    hasPrescribedLoad ||
    name.includes('weighted')
  ) {
    // Check if also unilateral
    const isUnilateral = exec.isUnilateral === true ||
      name.includes('archer') ||
      name.includes('one-arm') ||
      name.includes('single-leg') ||
      name.includes('single leg') ||
      name.includes('unilateral')
    
    if (isUnilateral) {
      return {
        mode: 'reps_per_side',
        showBandSelector: false,
        showMultiBandSelector: false,
        showLoadInput: true,
        showRepsInput: true,
        showHoldInput: false,
        showPerSideToggle: true,
        showRPEInput: true,
        primaryInputLabel: 'Reps per Side',
      }
    }
    
    return {
      mode: 'weighted_strength',
      showBandSelector: false,
      showMultiBandSelector: false,
      showLoadInput: true,
      showRepsInput: true,
      showHoldInput: false,
      showPerSideToggle: false,
      showRPEInput: true,
      primaryInputLabel: 'Reps',
    }
  }
  
  // Timed hold exercises
  if (
    exec.isTimedHold === true ||
    name.includes('hold') ||
    name.includes('hang') ||
    name.includes('planche') ||
    name.includes('lever') ||
    name.includes('l-sit') ||
    name.includes('l sit') ||
    name.includes('support')
  ) {
    return {
      mode: 'timed_hold',
      showBandSelector: false,
      showMultiBandSelector: false,
      showLoadInput: false,
      showRepsInput: false,
      showHoldInput: true,
      showPerSideToggle: false,
      showRPEInput: true,
      primaryInputLabel: 'Hold Time (seconds)',
    }
  }
  
  // Density block
  if (method === 'density_block' || method === 'emom') {
    return {
      mode: 'density_block',
      showBandSelector: false,
      showMultiBandSelector: false,
      showLoadInput: false,
      showRepsInput: true,
      showHoldInput: false,
      showPerSideToggle: false,
      showRPEInput: true,
      primaryInputLabel: 'Rounds/Reps',
    }
  }
  
  // Unilateral bodyweight
  const isUnilateral = exec.isUnilateral === true ||
    name.includes('archer') ||
    name.includes('one-arm') ||
    name.includes('single-leg') ||
    name.includes('single leg') ||
    name.includes('pistol')
  
  if (isUnilateral) {
    return {
      mode: 'reps_per_side',
      showBandSelector: false,
      showMultiBandSelector: false,
      showLoadInput: false,
      showRepsInput: true,
      showHoldInput: false,
      showPerSideToggle: true,
      showRPEInput: true,
      primaryInputLabel: 'Reps per Side',
    }
  }
  
  // Default: bodyweight strength
  return {
    mode: 'bodyweight_strength',
    showBandSelector: false,
    showMultiBandSelector: false,
    showLoadInput: false,
    showRepsInput: true,
    showHoldInput: false,
    showPerSideToggle: false,
    showRPEInput: true,
    primaryInputLabel: 'Reps',
  }
}

// =============================================================================
// MULTI-BAND SUPPORT
// =============================================================================

/**
 * Multi-band selection for band-assisted exercises.
 * Stores which bands are combined (e.g., red + light blue for intermediate assistance).
 */
export interface MultiBandSelection {
  bands: ResistanceBandColor[]
  combinedAssistanceLevel: 'heavy' | 'medium' | 'light' | 'minimal'
  displayLabel: string
}

/**
 * Combine multiple bands into a structured selection.
 */
export function createMultiBandSelection(bands: ResistanceBandColor[]): MultiBandSelection {
  if (bands.length === 0) {
    return {
      bands: [],
      combinedAssistanceLevel: 'minimal',
      displayLabel: 'No Band',
    }
  }
  
  // Assistance levels (approximate)
  const bandAssistance: Record<ResistanceBandColor, number> = {
    'black': 100,
    'purple': 80,
    'green': 60,
    'blue': 45,
    'red': 30,
    'yellow': 15,
    'orange': 10,
  }
  
  const totalAssistance = bands.reduce((sum, band) => sum + (bandAssistance[band] || 20), 0)
  
  const combinedAssistanceLevel: MultiBandSelection['combinedAssistanceLevel'] = 
    totalAssistance >= 80 ? 'heavy' :
    totalAssistance >= 50 ? 'medium' :
    totalAssistance >= 25 ? 'light' : 'minimal'
  
  const displayLabel = bands.length === 1 
    ? bands[0].charAt(0).toUpperCase() + bands[0].slice(1)
    : bands.map(b => b.charAt(0).toUpperCase()).join('+')
  
  return {
    bands,
    combinedAssistanceLevel,
    displayLabel,
  }
}

// =============================================================================
// ADAPTATION HORIZON CLASSIFICATION
// =============================================================================

/**
 * Adaptation horizons for live input effects.
 * Each input can affect one or more horizons.
 */
export type AdaptationHorizon = 
  | 'current_set'           // Affects only current set (display update)
  | 'next_set'              // Affects next set recommendation
  | 'rest_recommendation'   // Affects rest time recommendation
  | 'remaining_exercise'    // Affects remaining sets of this exercise
  | 'next_exercise'         // Affects next exercise caution/load
  | 'future_session'        // Affects future session/program adaptation

export interface AdaptationClassification {
  horizons: AdaptationHorizon[]
  priority: 'immediate' | 'deferred' | 'session_end'
  triggerType: 'performance' | 'feedback' | 'skip' | 'override'
  reason: string
}

/**
 * Classify which adaptation horizons a live input affects.
 */
export function classifyAdaptationHorizons(
  input: {
    type: 'set_complete' | 'skip_set' | 'end_exercise' | 'tag_added' | 'note_added' | 'load_changed'
    rpe?: RPEValue | null
    targetRPE?: number
    tags?: string[]
    loadDeviation?: 'higher' | 'lower' | 'same'
    setsRemaining?: number
  }
): AdaptationClassification {
  const horizons: AdaptationHorizon[] = []
  let priority: AdaptationClassification['priority'] = 'deferred'
  let reason = ''
  
  switch (input.type) {
    case 'set_complete': {
      horizons.push('current_set')
      
      // RPE-based recommendations
      if (input.rpe !== null && input.rpe !== undefined) {
        const rpe = input.rpe as number
        const targetRPE = input.targetRPE || 8
        
        if (rpe >= 9) {
          // High RPE - affects rest and potentially remaining sets
          horizons.push('rest_recommendation', 'next_set')
          if (rpe >= 10) {
            horizons.push('remaining_exercise')
            reason = 'Max effort detected - may need load/rep adjustment'
          } else {
            reason = 'High effort - extended rest recommended'
          }
          priority = 'immediate'
        } else if (rpe <= 6) {
          // Low RPE - affects next set load recommendation
          horizons.push('next_set')
          reason = 'Low effort - consider increasing difficulty'
          priority = 'immediate'
        } else {
          // Normal range
          horizons.push('next_set')
          reason = 'Normal execution'
        }
      }
      
      // Always capture for future session analysis
      horizons.push('future_session')
      break
    }
    
    case 'skip_set': {
      horizons.push('current_set', 'future_session')
      reason = 'Set skipped - captured for analysis'
      priority = 'deferred'
      break
    }
    
    case 'end_exercise': {
      horizons.push('current_set', 'remaining_exercise', 'next_exercise', 'future_session')
      reason = 'Exercise ended early - affects session flow'
      priority = 'immediate'
      break
    }
    
    case 'tag_added': {
      horizons.push('current_set')
      
      const tags = input.tags || []
      
      // Pain/discomfort affects remaining exercise and next
      if (tags.includes('pain') || tags.includes('discomfort')) {
        horizons.push('remaining_exercise', 'next_exercise', 'future_session')
        reason = 'Pain signal - protective adaptation triggered'
        priority = 'immediate'
      }
      // Fatigue affects remaining sets
      else if (tags.includes('fatigue') || tags.includes('too_hard')) {
        horizons.push('remaining_exercise', 'rest_recommendation')
        reason = 'Fatigue signal - may affect remaining work'
        priority = 'immediate'
      }
      // Form issues for future
      else if (tags.includes('form_issue') || tags.includes('balance')) {
        horizons.push('future_session')
        reason = 'Form signal - captured for future adjustment'
        priority = 'deferred'
      }
      // Too easy
      else if (tags.includes('too_easy')) {
        horizons.push('next_set', 'future_session')
        reason = 'Ease signal - consider progression'
        priority = 'deferred'
      }
      break
    }
    
    case 'note_added': {
      // Notes are primarily for future analysis
      horizons.push('current_set', 'future_session')
      reason = 'Note captured for analysis'
      priority = 'session_end'
      break
    }
    
    case 'load_changed': {
      horizons.push('current_set', 'next_set', 'future_session')
      
      if (input.loadDeviation === 'lower') {
        horizons.push('remaining_exercise')
        reason = 'Load reduced - may affect remaining sets'
      } else if (input.loadDeviation === 'higher') {
        reason = 'Load increased - strong performance'
      } else {
        reason = 'Load as prescribed'
      }
      priority = 'immediate'
      break
    }
  }
  
  return {
    horizons: [...new Set(horizons)], // Dedupe
    priority,
    triggerType: input.type === 'set_complete' ? 'performance' :
                 input.type === 'skip_set' || input.type === 'end_exercise' ? 'skip' :
                 input.type === 'tag_added' || input.type === 'note_added' ? 'feedback' : 'override',
    reason,
  }
}

// =============================================================================
// SKIP VS END EXERCISE SEMANTICS
// =============================================================================

export type SkipAction = 'skip_set' | 'end_exercise'

export interface SkipDecision {
  action: SkipAction
  reason?: string
  completedSets: number
  skippedSets: number
  remainingSets: number
  timestamp: number
}

/**
 * Create a skip set decision record.
 */
export function createSkipSetDecision(
  currentSet: number,
  totalSets: number,
  reason?: string
): SkipDecision {
  return {
    action: 'skip_set',
    reason,
    completedSets: currentSet - 1,
    skippedSets: 1,
    remainingSets: totalSets - currentSet,
    timestamp: Date.now(),
  }
}

/**
 * Create an end exercise decision record.
 */
export function createEndExerciseDecision(
  currentSet: number,
  totalSets: number,
  reason?: string
): SkipDecision {
  return {
    action: 'end_exercise',
    reason,
    completedSets: currentSet - 1,
    skippedSets: totalSets - currentSet + 1,
    remainingSets: 0,
    timestamp: Date.now(),
  }
}

// =============================================================================
// STRUCTURED COACHING SIGNALS
// =============================================================================

/**
 * Structured coaching signal tags.
 * These flow into adaptation logic, unlike passive notes.
 */
export const COACHING_SIGNAL_TAGS = [
  'too_easy',
  'too_hard',
  'pain',
  'discomfort', 
  'fatigue',
  'grip_limited',
  'form_issue',
  'balance_issue',
  'focus_lost',
  'breathing_issue',
  'joint_stress',
  'muscle_cramping',
  // [LIVE-WORKOUT-NORMALIZERS] Additional canonical signals for adaptive control
  'straight_arm_fatigue',
  'support_mismatch',
  'load_mismatch',
  'recovery_concern',
  'technique_breakdown',
  'endurance_limited',
] as const

export type CoachingSignalTag = typeof COACHING_SIGNAL_TAGS[number]

export const COACHING_SIGNAL_LABELS: Record<CoachingSignalTag, string> = {
  'too_easy': 'Too Easy',
  'too_hard': 'Too Hard',
  'pain': 'Pain',
  'discomfort': 'Discomfort',
  'fatigue': 'Fatigued',
  'grip_limited': 'Grip Limited',
  'form_issue': 'Form Issue',
  'balance_issue': 'Balance Issue',
  'focus_lost': 'Lost Focus',
  'breathing_issue': 'Breathing Issue',
  'joint_stress': 'Joint Stress',
  'muscle_cramping': 'Cramping',
  // [LIVE-WORKOUT-NORMALIZERS] Additional signal labels
  'straight_arm_fatigue': 'Straight-Arm Fatigue',
  'support_mismatch': 'Band Support Issue',
  'load_mismatch': 'Load Issue',
  'recovery_concern': 'Recovery Concern',
  'technique_breakdown': 'Technique Breaking',
  'endurance_limited': 'Endurance Limited',
}

export const COACHING_SIGNAL_SEVERITY: Record<CoachingSignalTag, 'info' | 'warning' | 'critical'> = {
  'too_easy': 'info',
  'too_hard': 'warning',
  'pain': 'critical',
  'discomfort': 'warning',
  'fatigue': 'warning',
  'grip_limited': 'info',
  'form_issue': 'warning',
  'balance_issue': 'info',
  'focus_lost': 'info',
  'breathing_issue': 'warning',
  'joint_stress': 'critical',
  'muscle_cramping': 'warning',
  // [LIVE-WORKOUT-NORMALIZERS] Additional signal severities
  'straight_arm_fatigue': 'warning',
  'support_mismatch': 'warning',
  'load_mismatch': 'warning',
  'recovery_concern': 'warning',
  'technique_breakdown': 'warning',
  'endurance_limited': 'info',
}

export interface StructuredCoachingInput {
  signals: CoachingSignalTag[]
  freeTextNote: string | null
  timestamp: number
  exerciseIndex: number
  setNumber: number
}

// =============================================================================
// RUNTIME RECOMMENDATION TRIGGERS
// =============================================================================

export interface RuntimeRecommendation {
  id: string
  type: 'rest_extension' | 'load_reduction' | 'rep_cap' | 'exercise_caution' | 'skip_suggestion'
  message: string
  severity: 'info' | 'warning' | 'critical'
  actions: Array<{
    label: string
    action: 'accept' | 'dismiss' | 'modify'
    payload?: unknown
  }>
  triggerReason: string
  shouldShow: boolean
}

/**
 * Check if a recommendation should be triggered based on performance data.
 */
export function checkRecommendationTrigger(
  data: {
    consecutiveHighRPE: number
    consecutiveMissedReps: number
    painSignalActive: boolean
    fatigueSignalActive: boolean
    timeOverBudget: boolean
    loadDeviationPercent: number
  }
): RuntimeRecommendation | null {
  // Pain signal - critical
  if (data.painSignalActive) {
    return {
      id: `pain_${Date.now()}`,
      type: 'exercise_caution',
      message: 'Pain signal detected. Consider modifying or skipping remaining sets.',
      severity: 'critical',
      actions: [
        { label: 'Reduce Load', action: 'modify', payload: { type: 'reduce_load' } },
        { label: 'End Exercise', action: 'accept', payload: { type: 'end_exercise' } },
        { label: 'Continue', action: 'dismiss' },
      ],
      triggerReason: 'pain_signal_active',
      shouldShow: true,
    }
  }
  
  // Repeated high RPE
  if (data.consecutiveHighRPE >= 2) {
    return {
      id: `high_rpe_${Date.now()}`,
      type: 'rest_extension',
      message: 'Multiple high-effort sets detected. Consider extending rest or reducing load.',
      severity: 'warning',
      actions: [
        { label: 'Extend Rest +30s', action: 'accept', payload: { restExtension: 30 } },
        { label: 'Reduce Load', action: 'modify', payload: { type: 'reduce_load' } },
        { label: 'Continue', action: 'dismiss' },
      ],
      triggerReason: `${data.consecutiveHighRPE}_consecutive_high_rpe`,
      shouldShow: true,
    }
  }
  
  // Fatigue signal with remaining work
  if (data.fatigueSignalActive && data.consecutiveHighRPE >= 1) {
    return {
      id: `fatigue_${Date.now()}`,
      type: 'rep_cap',
      message: 'Fatigue detected. Consider capping remaining sets.',
      severity: 'warning',
      actions: [
        { label: 'Cap Sets', action: 'accept', payload: { type: 'cap_sets' } },
        { label: 'Continue', action: 'dismiss' },
      ],
      triggerReason: 'fatigue_with_high_effort',
      shouldShow: true,
    }
  }
  
  // Time budget overrun
  if (data.timeOverBudget) {
    return {
      id: `time_${Date.now()}`,
      type: 'skip_suggestion',
      message: 'Approaching time limit. Consider focusing on remaining priority exercises.',
      severity: 'info',
      actions: [
        { label: 'Skip Accessories', action: 'accept', payload: { type: 'skip_accessories' } },
        { label: 'Continue', action: 'dismiss' },
      ],
      triggerReason: 'time_budget_exceeded',
      shouldShow: true,
    }
  }
  
  return null
}

// =============================================================================
// AUTHORITATIVE RUNTIME STATE EXTENSION
// =============================================================================

/**
 * Extension to WorkoutMachineState for live workout authority.
 * These fields should be added to the machine state.
 */
export interface LiveWorkoutAuthorityState {
  // Execution mode (locked at workout start)
  executionMode: WorkoutExecutionMode
  targetDurationMinutes: number | null
  
  // Multi-band support
  multiBandSelection: MultiBandSelection | null
  
  // Adaptation tracking
  adaptationEvents: Array<{
    timestamp: number
    classification: AdaptationClassification
    inputData: unknown
  }>
  
  // Skip tracking
  skipDecisions: SkipDecision[]
  
  // Structured coaching signals
  coachingInputs: StructuredCoachingInput[]
  
  // Active recommendation (if any)
  activeRecommendation: RuntimeRecommendation | null
  dismissedRecommendationIds: string[]
  
  // Performance tracking for recommendations
  consecutiveHighRPECount: number
  consecutiveMissedRepsCount: number
}

/**
 * Create initial authority state extension.
 */
export function createInitialAuthorityState(
  executionMode: WorkoutExecutionMode = 'full'
): LiveWorkoutAuthorityState {
  return {
    executionMode,
    targetDurationMinutes: EXECUTION_MODE_TARGET_MINUTES[executionMode],
    multiBandSelection: null,
    adaptationEvents: [],
    skipDecisions: [],
    coachingInputs: [],
    activeRecommendation: null,
    dismissedRecommendationIds: [],
    consecutiveHighRPECount: 0,
    consecutiveMissedRepsCount: 0,
  }
}

// =============================================================================
// LOGGING
// =============================================================================

export function logLiveWorkoutAuthority(
  event: string,
  data: Record<string, unknown>
): void {
  console.log(`[LIVE-WORKOUT-AUTHORITY] ${event}`, {
    timestamp: Date.now(),
    ...data,
  })
}
