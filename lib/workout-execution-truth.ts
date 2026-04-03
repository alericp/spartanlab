/**
 * Workout Execution Truth
 * 
 * Authoritative runtime contract for the live workout page.
 * Replaces scattered field inference with a single source of truth.
 * 
 * GUARDRAILS:
 * - All fields must have safe fallbacks for older programs
 * - Never crash if a field is missing
 * - Preserve backward compatibility
 */

import type { AdaptiveSession, AdaptiveExercise } from './adaptive-program-builder'
import type { ResistanceBandColor } from './band-progression-engine'

// =============================================================================
// SESSION RUNTIME TRUTH
// =============================================================================

export type AdaptationConfidence = 'low' | 'medium' | 'high'

export interface SessionRuntimeTruth {
  // Identity
  sessionId: string
  programId: string | null
  dayNumber: number
  dayLabel: string
  
  // Progress tracking
  currentExerciseCount: number
  totalExerciseCount: number
  totalSetCount: number
  
  // Adaptation state
  adaptationConfidence: AdaptationConfidence
  firstWorkoutsCalibrationMode: boolean
  workoutsCompletedInProgram: number
  
  // Feature flags
  supportsBackNavigation: boolean
  supportsBetweenExerciseRest: boolean
  supportsNotesCapture: boolean
  supportsTimerAlerts: boolean
  
  // Session type context
  sessionFocus: string
  estimatedDurationMinutes: number
}

// =============================================================================
// PER-EXERCISE RUNTIME TRUTH
// =============================================================================

export type DisplayType = 'reps' | 'hold' | 'time'
export type ProgressionMode = 'load' | 'progression' | 'hold_duration' | 'assistance' | 'fixed'

export interface ProgressionFallback {
  id: string
  name: string
  type: 'named_exercise' | 'adjustment'
  direction: 'easier' | 'harder'
  description: string
}

export interface ExerciseContextFlag {
  type: 'pain' | 'grip_issue' | 'sleep_fatigue' | 'technique_breakdown' | 'too_easy' | 'too_hard' | 'custom'
  label: string
  icon?: string
}

export interface ExerciseRuntimeTruth {
  // Identity
  exerciseId: string
  exerciseName: string
  originalName?: string
  category: string
  
  // Display configuration
  displayType: DisplayType
  targetValue: number
  targetUnit: string
  targetRPE: number
  
  // Rest configuration
  restSecondsIntraSet: number
  restSecondsInterExercise: number
  
  // Progression context
  progressionFamily: string | null
  progressionMode: ProgressionMode
  canAdjustProgression: boolean
  progressionFallbacks: ProgressionFallback[]
  
  // Assistance/band context
  supportsBandAdjustment: boolean
  recommendedBandColor: ResistanceBandColor | null
  
  // Notes and flags
  supportsNotes: boolean
  supportsPainFlag: boolean
  supportsFatigueFlag: boolean
  availableContextFlags: ExerciseContextFlag[]
  
  // Fixed exercise explanation
  isFixedPrescription: boolean
  fixedPrescriptionReason: string | null
  
  // Override state
  isOverridden: boolean
  overrideType: 'replaced' | 'skipped' | 'progression_adjusted' | null
}

// =============================================================================
// CONTEXT FLAGS DEFINITIONS
// =============================================================================

export const AVAILABLE_CONTEXT_FLAGS: ExerciseContextFlag[] = [
  { type: 'pain', label: 'Pain/Discomfort', icon: '⚠️' },
  { type: 'grip_issue', label: 'Grip Fatigue', icon: '✋' },
  { type: 'sleep_fatigue', label: 'Low Energy', icon: '😴' },
  { type: 'technique_breakdown', label: 'Form Broke Down', icon: '📉' },
  { type: 'too_easy', label: 'Too Easy', icon: '💪' },
  { type: 'too_hard', label: 'Too Hard', icon: '🏋️' },
]

// =============================================================================
// REST TIME DEFAULTS BY CATEGORY
// =============================================================================

const REST_DEFAULTS = {
  // Intra-set rest (between sets of same exercise)
  intraSet: {
    skill: 120,      // 2 min for neural recovery
    strength: 120,   // 2 min for strength work
    pull: 90,        // 90s for pull work
    push: 90,        // 90s for push work
    core: 60,        // 60s for core
    accessory: 60,   // 60s for accessories
    warmup: 45,      // 45s for warmup
    mobility: 30,    // 30s for mobility
    default: 90,
  },
  // Inter-exercise rest (between different exercises)
  interExercise: {
    skill: 90,       // Shorter between exercises for skill work
    strength: 75,    // Moderate transition
    pull: 60,        // Quick transition
    push: 60,        // Quick transition
    core: 45,        // Short for core
    accessory: 45,   // Short for accessories
    warmup: 30,      // Very short for warmup
    mobility: 15,    // Minimal for mobility
    default: 60,
  },
}

// =============================================================================
// BUILDERS
// =============================================================================

/**
 * Build session runtime truth from raw session data.
 * Always returns a valid object with safe fallbacks.
 */
export function buildSessionRuntimeTruth(
  session: AdaptiveSession | null,
  options: {
    programId?: string | null
    workoutsCompleted?: number
    sessionIndex?: number
  } = {}
): SessionRuntimeTruth {
  const { programId = null, workoutsCompleted = 0, sessionIndex = 0 } = options
  
  // Safe extraction with fallbacks
  const exercises = session?.exercises ?? []
  const dayNumber = session?.dayNumber ?? (sessionIndex + 1)
  const dayLabel = session?.label ?? session?.focus ?? `Day ${dayNumber}`
  
  // Calculate total sets
  const totalSetCount = exercises.reduce((sum, ex) => sum + (ex?.sets ?? 3), 0)
  
  // Determine adaptation confidence based on workout history
  let adaptationConfidence: AdaptationConfidence = 'low'
  if (workoutsCompleted >= 6) {
    adaptationConfidence = 'high'
  } else if (workoutsCompleted >= 2) {
    adaptationConfidence = 'medium'
  }
  
  // First workouts calibration mode (first 2 workouts)
  const firstWorkoutsCalibrationMode = workoutsCompleted < 2
  
  return {
    sessionId: session?.id || `session-${Date.now()}`,
    programId,
    dayNumber,
    dayLabel,
    currentExerciseCount: 0,
    totalExerciseCount: exercises.length,
    totalSetCount,
    adaptationConfidence,
    firstWorkoutsCalibrationMode,
    workoutsCompletedInProgram: workoutsCompleted,
    supportsBackNavigation: true,
    supportsBetweenExerciseRest: true, // Now enabled!
    supportsNotesCapture: true,
    supportsTimerAlerts: true,
    sessionFocus: session?.focus ?? 'general',
    estimatedDurationMinutes: session?.estimatedMinutes ?? 45,
  }
}

/**
 * Build per-exercise runtime truth.
 * Always returns a valid object with safe fallbacks.
 */
export function buildExerciseRuntimeTruth(
  exercise: AdaptiveExercise | null,
  exerciseIndex: number,
  overrideState?: {
    isOverridden: boolean
    overrideType: 'replaced' | 'skipped' | 'progression_adjusted' | null
    currentName?: string
  }
): ExerciseRuntimeTruth {
  if (!exercise) {
    return getDefaultExerciseRuntimeTruth(exerciseIndex)
  }
  
  // Parse display type from repsOrTime
  const { displayType, targetValue, targetUnit } = parseRepsOrTime(exercise.repsOrTime)
  
  // Determine category for rest times
  const category = (exercise.category ?? 'general').toLowerCase()
  
  // Get rest times based on category
  const restSecondsIntraSet = exercise.restSeconds ?? REST_DEFAULTS.intraSet[category as keyof typeof REST_DEFAULTS.intraSet] ?? REST_DEFAULTS.intraSet.default
  const restSecondsInterExercise = REST_DEFAULTS.interExercise[category as keyof typeof REST_DEFAULTS.interExercise] ?? REST_DEFAULTS.interExercise.default
  
  // Build progression fallbacks
  const progressionFallbacks = buildProgressionFallbacks(exercise)
  
  // Determine progression mode
  const progressionMode = determineProgressionMode(exercise)
  
  // Check if band adjustment is supported
  const supportsBandAdjustment = checkBandSupport(exercise)
  
  // Check if this is a fixed prescription
  const { isFixed, reason } = checkFixedPrescription(exercise)
  
  return {
    exerciseId: exercise.id ?? `exercise-${exerciseIndex}`,
    exerciseName: overrideState?.currentName ?? exercise.name ?? 'Unknown Exercise',
    originalName: exercise.name,
    category: exercise.category ?? 'general',
    displayType,
    targetValue,
    targetUnit,
    targetRPE: exercise.targetRPE ?? 8,
    restSecondsIntraSet,
    restSecondsInterExercise,
    progressionFamily: inferProgressionFamily(exercise),
    progressionMode,
    canAdjustProgression: !isFixed && progressionFallbacks.length > 0,
    progressionFallbacks,
    supportsBandAdjustment,
    recommendedBandColor: exercise.executionTruth?.recommendedBandColor ?? null,
    supportsNotes: true,
    supportsPainFlag: true,
    supportsFatigueFlag: true,
    availableContextFlags: AVAILABLE_CONTEXT_FLAGS,
    isFixedPrescription: isFixed,
    fixedPrescriptionReason: reason,
    isOverridden: overrideState?.isOverridden ?? false,
    overrideType: overrideState?.overrideType ?? null,
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function getDefaultExerciseRuntimeTruth(index: number): ExerciseRuntimeTruth {
  return {
    exerciseId: `exercise-${index}`,
    exerciseName: 'Unknown Exercise',
    category: 'general',
    displayType: 'reps',
    targetValue: 8,
    targetUnit: 'reps',
    targetRPE: 8,
    restSecondsIntraSet: 90,
    restSecondsInterExercise: 60,
    progressionFamily: null,
    progressionMode: 'fixed',
    canAdjustProgression: false,
    progressionFallbacks: [],
    supportsBandAdjustment: false,
    recommendedBandColor: null,
    supportsNotes: true,
    supportsPainFlag: true,
    supportsFatigueFlag: true,
    availableContextFlags: AVAILABLE_CONTEXT_FLAGS,
    isFixedPrescription: true,
    fixedPrescriptionReason: 'Exercise data unavailable',
    isOverridden: false,
    overrideType: null,
  }
}

/**
 * Parse repsOrTime string into structured data
 */
function parseRepsOrTime(repsOrTime?: string): { displayType: DisplayType; targetValue: number; targetUnit: string } {
  if (!repsOrTime) {
    return { displayType: 'reps', targetValue: 8, targetUnit: 'reps' }
  }
  
  const normalized = repsOrTime.toLowerCase().trim()
  
  // Check for hold/time patterns
  if (normalized.includes('hold') || normalized.includes('sec') || normalized.includes('s hold')) {
    const match = normalized.match(/(\d+)/)
    return {
      displayType: 'hold',
      targetValue: match ? parseInt(match[1], 10) : 30,
      targetUnit: 'seconds',
    }
  }
  
  // Check for time patterns (AMRAP, etc)
  if (normalized.includes('amrap') || normalized.includes('min')) {
    const match = normalized.match(/(\d+)/)
    return {
      displayType: 'time',
      targetValue: match ? parseInt(match[1], 10) : 60,
      targetUnit: 'seconds',
    }
  }
  
  // Default to reps - extract the target (use upper bound of range if present)
  const rangeMatch = normalized.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (rangeMatch) {
    // Use midpoint of range for target
    const lower = parseInt(rangeMatch[1], 10)
    const upper = parseInt(rangeMatch[2], 10)
    return {
      displayType: 'reps',
      targetValue: Math.round((lower + upper) / 2),
      targetUnit: 'reps',
    }
  }
  
  const singleMatch = normalized.match(/(\d+)/)
  return {
    displayType: 'reps',
    targetValue: singleMatch ? parseInt(singleMatch[1], 10) : 8,
    targetUnit: 'reps',
  }
}

/**
 * Build progression fallbacks for an exercise
 */
function buildProgressionFallbacks(exercise: AdaptiveExercise): ProgressionFallback[] {
  const fallbacks: ProgressionFallback[] = []
  const name = (exercise.name ?? '').toLowerCase()
  const category = (exercise.category ?? '').toLowerCase()
  
  // Add category-specific fallbacks
  if (category === 'core' || name.includes('leg raise') || name.includes('hollow') || name.includes('plank')) {
    fallbacks.push(
      { id: 'reduce_hold', name: 'Reduce Hold Duration', type: 'adjustment', direction: 'easier', description: 'Reduce target hold by 25%' },
      { id: 'cluster_hold', name: 'Clustered Mini-Holds', type: 'adjustment', direction: 'easier', description: 'Split into shorter holds with brief rest' },
      { id: 'tuck_variation', name: 'Tucked Variation', type: 'adjustment', direction: 'easier', description: 'Use tucked legs to reduce lever' },
    )
  }
  
  if (category === 'skill' || name.includes('lever') || name.includes('planche') || name.includes('l-sit')) {
    fallbacks.push(
      { id: 'band_assist', name: 'Add Band Assistance', type: 'adjustment', direction: 'easier', description: 'Use resistance band for support' },
      { id: 'reduce_hold', name: 'Shorter Hold Target', type: 'adjustment', direction: 'easier', description: 'Reduce target time by 25%' },
      { id: 'tuck_regression', name: 'Tuck Position', type: 'adjustment', direction: 'easier', description: 'Regress to tucked variation' },
    )
  }
  
  if (category === 'pull' || name.includes('pull') || name.includes('row') || name.includes('chin')) {
    fallbacks.push(
      { id: 'band_assist', name: 'Band Assisted', type: 'adjustment', direction: 'easier', description: 'Add band assistance for reps' },
      { id: 'reduce_rom', name: 'Partial ROM', type: 'adjustment', direction: 'easier', description: 'Use half reps to build strength' },
      { id: 'eccentric_focus', name: 'Eccentric Only', type: 'adjustment', direction: 'easier', description: 'Focus on slow negatives' },
    )
  }
  
  if (category === 'push' || name.includes('push') || name.includes('dip') || name.includes('press')) {
    fallbacks.push(
      { id: 'band_assist', name: 'Band Assisted', type: 'adjustment', direction: 'easier', description: 'Add band assistance for reps' },
      { id: 'incline_variation', name: 'Elevated/Incline', type: 'adjustment', direction: 'easier', description: 'Use incline to reduce load' },
      { id: 'reduce_rom', name: 'Partial ROM', type: 'adjustment', direction: 'easier', description: 'Use partial range to build strength' },
    )
  }
  
  // Always add a keep current option
  fallbacks.push(
    { id: 'keep_current', name: 'Keep Current Prescription', type: 'adjustment', direction: 'easier', description: 'Maintain current exercise as prescribed' }
  )
  
  // Add harder options
  if (category !== 'warmup' && category !== 'mobility') {
    fallbacks.push(
      { id: 'increase_target', name: 'Increase Target', type: 'adjustment', direction: 'harder', description: 'Increase reps/hold by 25%' },
    )
    
    if (exercise.prescribedLoad?.load) {
      fallbacks.push(
        { id: 'increase_load', name: 'Increase Load', type: 'adjustment', direction: 'harder', description: 'Add 5-10% more weight' },
      )
    }
  }
  
  return fallbacks
}

/**
 * Determine the progression mode for an exercise
 */
function determineProgressionMode(exercise: AdaptiveExercise): ProgressionMode {
  const name = (exercise.name ?? '').toLowerCase()
  const category = (exercise.category ?? '').toLowerCase()
  
  // Check for weighted exercises
  if (exercise.prescribedLoad?.load && exercise.prescribedLoad.load > 0) {
    return 'load'
  }
  
  // Check for hold exercises
  if (name.includes('hold') || exercise.repsOrTime?.toLowerCase().includes('hold')) {
    return 'hold_duration'
  }
  
  // Check for assisted exercises
  if (name.includes('assisted') || name.includes('band')) {
    return 'assistance'
  }
  
  // Skills use progression ladder
  if (category === 'skill') {
    return 'progression'
  }
  
  // Warmup and mobility are generally fixed
  if (category === 'warmup' || category === 'mobility') {
    return 'fixed'
  }
  
  // Default to progression
  return 'progression'
}

/**
 * Check if an exercise supports band adjustment
 */
function checkBandSupport(exercise: AdaptiveExercise): boolean {
  // Check execution truth first
  if (exercise.executionTruth?.bandSelectable) {
    return true
  }
  if (exercise.executionTruth?.assistedAllowed) {
    return true
  }
  
  // Fallback to heuristics for older programs
  const name = (exercise.name ?? '').toLowerCase()
  const category = (exercise.category ?? '').toLowerCase()
  
  const bandSupportedCategories = ['skill', 'pull', 'push']
  const bandSupportedPatterns = ['lever', 'planche', 'muscle up', 'pull-up', 'pullup', 'dip', 'assisted']
  
  if (bandSupportedCategories.includes(category)) {
    return true
  }
  
  return bandSupportedPatterns.some(pattern => name.includes(pattern))
}

/**
 * Check if an exercise has a fixed prescription (should not be adjusted)
 */
function checkFixedPrescription(exercise: AdaptiveExercise): { isFixed: boolean; reason: string | null } {
  const category = (exercise.category ?? '').toLowerCase()
  
  // Warmup exercises are typically fixed
  if (category === 'warmup') {
    return { isFixed: true, reason: 'Warmup exercises follow a standard protocol' }
  }
  
  // Mobility work is typically fixed
  if (category === 'mobility') {
    return { isFixed: true, reason: 'Mobility work is prescribed for recovery' }
  }
  
  // Check if explicitly marked as non-overrideable
  if (exercise.isOverrideable === false) {
    return { isFixed: true, reason: 'This exercise is part of a structured progression' }
  }
  
  return { isFixed: false, reason: null }
}

/**
 * Infer progression family from exercise
 */
function inferProgressionFamily(exercise: AdaptiveExercise): string | null {
  const name = (exercise.name ?? '').toLowerCase()
  
  if (name.includes('pull-up') || name.includes('pullup') || name.includes('chin-up') || name.includes('chinup')) {
    return 'pull_up'
  }
  if (name.includes('dip')) {
    return 'dip'
  }
  if (name.includes('push-up') || name.includes('pushup')) {
    return 'push_up'
  }
  if (name.includes('front lever')) {
    return 'front_lever'
  }
  if (name.includes('back lever')) {
    return 'back_lever'
  }
  if (name.includes('planche')) {
    return 'planche'
  }
  if (name.includes('l-sit') || name.includes('l sit')) {
    return 'l_sit'
  }
  if (name.includes('handstand') || name.includes('hspu')) {
    return 'handstand'
  }
  if (name.includes('muscle up') || name.includes('muscle-up')) {
    return 'muscle_up'
  }
  if (name.includes('row')) {
    return 'row'
  }
  if (name.includes('leg raise') || name.includes('hollow')) {
    return 'core_compression'
  }
  
  return null
}

// =============================================================================
// EXERCISE NOTES & FLAGS
// =============================================================================

export interface ExerciseNote {
  exerciseIndex: number
  flags: ExerciseContextFlag['type'][]
  freeText: string
  timestamp: number
}

export interface SessionNotes {
  exerciseNotes: Record<number, ExerciseNote>
  sessionNote: string
}

/**
 * Create empty session notes
 */
export function createEmptySessionNotes(): SessionNotes {
  return {
    exerciseNotes: {},
    sessionNote: '',
  }
}

/**
 * Add or update a note for an exercise
 */
export function updateExerciseNote(
  notes: SessionNotes,
  exerciseIndex: number,
  flags: ExerciseContextFlag['type'][],
  freeText: string
): SessionNotes {
  return {
    ...notes,
    exerciseNotes: {
      ...notes.exerciseNotes,
      [exerciseIndex]: {
        exerciseIndex,
        flags,
        freeText,
        timestamp: Date.now(),
      },
    },
  }
}

// =============================================================================
// TIMER ALERTS
// =============================================================================

export interface TimerAlertSettings {
  soundEnabled: boolean
  vibrationEnabled: boolean
  volume: number // 0-1
}

const DEFAULT_TIMER_ALERT_SETTINGS: TimerAlertSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  volume: 0.5,
}

const TIMER_SETTINGS_KEY = 'spartanlab_timer_alerts'

export function getTimerAlertSettings(): TimerAlertSettings {
  if (typeof window === 'undefined') return DEFAULT_TIMER_ALERT_SETTINGS
  try {
    const stored = localStorage.getItem(TIMER_SETTINGS_KEY)
    if (stored) {
      return { ...DEFAULT_TIMER_ALERT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch {}
  return DEFAULT_TIMER_ALERT_SETTINGS
}

export function saveTimerAlertSettings(settings: Partial<TimerAlertSettings>): void {
  if (typeof window === 'undefined') return
  try {
    const current = getTimerAlertSettings()
    localStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify({ ...current, ...settings }))
  } catch {}
}

/**
 * Play timer completion alert safely
 */
export async function playTimerCompletionAlert(): Promise<void> {
  const settings = getTimerAlertSettings()
  
  // Try vibration first (more reliable on mobile)
  if (settings.vibrationEnabled && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]) // Short vibration pattern
    } catch {
      // Silently fail
    }
  }
  
  // Try sound
  if (settings.soundEnabled) {
    try {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800 // Hz
      oscillator.type = 'sine'
      gainNode.gain.value = settings.volume * 0.3 // Keep it subtle
      
      oscillator.start()
      
      // Short beep
      setTimeout(() => {
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1)
        setTimeout(() => {
          oscillator.stop()
          audioContext.close()
        }, 100)
      }, 150)
    } catch {
      // Audio failed, that's okay - session continues normally
    }
  }
}

// =============================================================================
// CALIBRATION MESSAGING
// =============================================================================

export interface CalibrationMessage {
  show: boolean
  title: string
  description: string
}

export function getCalibrationMessage(runtimeTruth: SessionRuntimeTruth): CalibrationMessage {
  if (!runtimeTruth.firstWorkoutsCalibrationMode) {
    return { show: false, title: '', description: '' }
  }
  
  const workoutNumber = runtimeTruth.workoutsCompletedInProgram + 1
  
  if (workoutNumber === 1) {
    return {
      show: true,
      title: 'Calibration Session',
      description: 'This session is learning your working capacity. Log your effort honestly so future prescriptions become sharper.',
    }
  }
  
  if (workoutNumber === 2) {
    return {
      show: true,
      title: 'Still Calibrating',
      description: 'Second session in the calibration phase. Your performance today helps fine-tune recovery and progression estimates.',
    }
  }
  
  return { show: false, title: '', description: '' }
}

// =============================================================================
// ADAPTIVE COACHING NOTES
// =============================================================================

export interface AdaptiveCoachingNote {
  type: 'effort_feedback' | 'progression_hint' | 'recovery_signal'
  message: string
  severity: 'info' | 'warning'
}

/**
 * Generate coaching notes based on set performance
 */
export function generateAdaptiveCoachingNote(
  actualReps: number,
  targetReps: number,
  actualRPE: number,
  targetRPE: number
): AdaptiveCoachingNote | null {
  const repRatio = actualReps / targetReps
  
  // Way over target with low effort
  if (repRatio > 1.2 && actualRPE < targetRPE - 1) {
    return {
      type: 'effort_feedback',
      message: 'Exceeding target easily suggests room for progression. Next session may increase.',
      severity: 'info',
    }
  }
  
  // Under target with high effort
  if (repRatio < 0.8 && actualRPE > targetRPE + 1) {
    return {
      type: 'recovery_signal',
      message: 'High effort below target may indicate fatigue. Focus on quality over quantity.',
      severity: 'warning',
    }
  }
  
  // Hit target but RPE way off (too easy)
  if (repRatio >= 0.9 && repRatio <= 1.1 && actualRPE < targetRPE - 2) {
    return {
      type: 'progression_hint',
      message: 'Target reached with low effort. Consider increasing difficulty for better adaptation.',
      severity: 'info',
    }
  }
  
  // Hit target but RPE way off (too hard)
  if (repRatio >= 0.9 && repRatio <= 1.1 && actualRPE > targetRPE + 1) {
    return {
      type: 'recovery_signal',
      message: 'Target reached but required more effort than expected. This still counts as progress.',
      severity: 'info',
    }
  }
  
  return null
}
