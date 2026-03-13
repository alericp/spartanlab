/**
 * SpartanLab Program Adjustment Engine
 * 
 * Allows users to modify their current program without restarting,
 * preserving progression tracking, momentum, and recovery data.
 * 
 * Features:
 * - Session time rebalancing
 * - Exercise swapping with progression continuity
 * - Training day adjustment
 * - Intensity modification
 * - Equipment change handling
 */

import type { PrimaryGoal, ExperienceLevel, TrainingDays, SessionLength, GeneratedProgram } from './program-service'
import type { EquipmentType } from './adaptive-exercise-pool'
import { getProgressionUp, getProgressionDown, getBestSubstitute } from './progression-ladders'
import { findBestReplacement, type ExerciseIntelligenceContext } from './exercise-intelligence-engine'
import { getOnboardingProfile } from './athlete-profile'
import { getConsistencyStatus } from './consistency-momentum-engine'
import { getReadinessAssessment } from './recovery-fatigue-engine'

// =============================================================================
// TYPES
// =============================================================================

export type AdjustmentType = 
  | 'session_time'
  | 'exercise_swap'
  | 'exercise_remove'
  | 'training_days'
  | 'intensity'
  | 'equipment'

export interface ProgramAdjustment {
  type: AdjustmentType
  timestamp: string
  description: string
  preservedData: string[]
}

export interface AdjustmentRequest {
  type: AdjustmentType
  // Session time adjustment
  newSessionMinutes?: number
  // Exercise swap/remove
  exerciseId?: string
  replacementExerciseId?: string
  // Training days
  newTrainingDays?: TrainingDays
  // Intensity
  intensityReduction?: 'mild' | 'moderate' | 'significant'
  // Equipment
  newEquipment?: EquipmentType[]
}

export interface AdjustmentResult {
  success: boolean
  adjustment: ProgramAdjustment
  coachMessage: string
  warnings: string[]
  preservedItems: PreservedData
}

export interface PreservedData {
  progressionHistory: boolean
  momentumScore: boolean
  recoveryTrends: boolean
  skillReadiness: boolean
  goalProjections: boolean
}

export interface ProgramStatus {
  programId: string
  startDate: string
  currentWeek: number
  totalWeeks: number
  minimumRecommendedWeeks: number
  adjustmentsMade: ProgramAdjustment[]
  isEarlyExit: boolean
  daysRemaining: number
  completionPercentage: number
}

export interface ExitIntention {
  reason: 'time_constraint' | 'exercise_dislike' | 'equipment_change' | 'fatigue' | 'schedule_change' | 'goal_change' | 'other'
  canBeAddressedWithAdjustment: boolean
  suggestedAdjustments: AdjustmentType[]
  recommendContinuing: boolean
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PROGRAM_STATE_KEY = 'spartanlab_program_state'
const ADJUSTMENT_HISTORY_KEY = 'spartanlab_adjustment_history'
const MINIMUM_RECOMMENDED_WEEKS = 4

// Priority order for preserving work when session time decreases
const SESSION_PRIORITY = [
  'skill_work',
  'primary_strength',
  'mobility_flexibility',
  'accessories',
  'density_finishers',
] as const

// Intensity reduction mappings
const INTENSITY_REDUCTION_MAP = {
  mild: {
    rpeReduction: 1,
    volumeMultiplier: 0.9,
    progressionHold: false,
  },
  moderate: {
    rpeReduction: 2,
    volumeMultiplier: 0.75,
    progressionHold: true,
  },
  significant: {
    rpeReduction: 3,
    volumeMultiplier: 0.6,
    progressionHold: true,
  },
}

// =============================================================================
// STORAGE
// =============================================================================

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

interface StoredProgramState {
  programId: string
  startDate: string
  adjustments: ProgramAdjustment[]
  originalInputs: {
    sessionMinutes: number
    trainingDays: TrainingDays
    equipment: EquipmentType[]
  }
  currentInputs: {
    sessionMinutes: number
    trainingDays: TrainingDays
    equipment: EquipmentType[]
  }
}

function getStoredProgramState(): StoredProgramState | null {
  if (!isBrowser()) return null
  try {
    const stored = localStorage.getItem(PROGRAM_STATE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveProgramState(state: StoredProgramState): void {
  if (!isBrowser()) return
  localStorage.setItem(PROGRAM_STATE_KEY, JSON.stringify(state))
}

function getAdjustmentHistory(): ProgramAdjustment[] {
  if (!isBrowser()) return []
  try {
    const stored = localStorage.getItem(ADJUSTMENT_HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveAdjustmentHistory(history: ProgramAdjustment[]): void {
  if (!isBrowser()) return
  localStorage.setItem(ADJUSTMENT_HISTORY_KEY, JSON.stringify(history))
}

// =============================================================================
// PROGRAM STATUS
// =============================================================================

export function getProgramStatus(): ProgramStatus | null {
  const state = getStoredProgramState()
  if (!state) return null

  const startDate = new Date(state.startDate)
  const now = new Date()
  const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const currentWeek = Math.floor(daysSinceStart / 7) + 1
  const totalWeeks = 8 // Default program length
  const daysRemaining = Math.max(0, (totalWeeks * 7) - daysSinceStart)
  const completionPercentage = Math.min(100, Math.round((daysSinceStart / (totalWeeks * 7)) * 100))

  return {
    programId: state.programId,
    startDate: state.startDate,
    currentWeek,
    totalWeeks,
    minimumRecommendedWeeks: MINIMUM_RECOMMENDED_WEEKS,
    adjustmentsMade: state.adjustments,
    isEarlyExit: currentWeek < MINIMUM_RECOMMENDED_WEEKS,
    daysRemaining,
    completionPercentage,
  }
}

export function initializeProgramState(programId: string, inputs: {
  sessionMinutes: number
  trainingDays: TrainingDays
  equipment: EquipmentType[]
}): void {
  const state: StoredProgramState = {
    programId,
    startDate: new Date().toISOString(),
    adjustments: [],
    originalInputs: { ...inputs },
    currentInputs: { ...inputs },
  }
  saveProgramState(state)
}

// =============================================================================
// EXIT INTENTION ANALYSIS
// =============================================================================

export function analyzeExitIntention(reason: ExitIntention['reason']): ExitIntention {
  const adjustmentMap: Record<ExitIntention['reason'], AdjustmentType[]> = {
    time_constraint: ['session_time', 'training_days'],
    exercise_dislike: ['exercise_swap', 'exercise_remove'],
    equipment_change: ['equipment', 'exercise_swap'],
    fatigue: ['intensity', 'training_days'],
    schedule_change: ['training_days', 'session_time'],
    goal_change: [], // Requires new program
    other: [],
  }

  const suggestedAdjustments = adjustmentMap[reason]
  const canBeAddressedWithAdjustment = suggestedAdjustments.length > 0

  return {
    reason,
    canBeAddressedWithAdjustment,
    suggestedAdjustments,
    recommendContinuing: canBeAddressedWithAdjustment,
  }
}

// =============================================================================
// SESSION TIME REBALANCER
// =============================================================================

export interface SessionRebalanceResult {
  newStructure: {
    skillWorkMinutes: number
    strengthMinutes: number
    mobilityMinutes: number
    accessoryMinutes: number
    finisherMinutes: number
  }
  removedBlocks: string[]
  preservedBlocks: string[]
  coachNote: string
}

export function rebalanceSessionTime(
  currentMinutes: number,
  newMinutes: number
): SessionRebalanceResult {
  const reduction = currentMinutes - newMinutes
  const reductionPercent = reduction / currentMinutes

  // Base allocation for a 60-minute session
  const baseAllocation = {
    skillWorkMinutes: 20,
    strengthMinutes: 15,
    mobilityMinutes: 10,
    accessoryMinutes: 10,
    finisherMinutes: 5,
  }

  const removedBlocks: string[] = []
  const preservedBlocks: string[] = ['Skill Work', 'Primary Strength']

  // Calculate new allocation based on priority
  let newAllocation = { ...baseAllocation }
  
  if (newMinutes <= 30) {
    // Minimal session: skill + strength only
    newAllocation = {
      skillWorkMinutes: 15,
      strengthMinutes: 10,
      mobilityMinutes: 5,
      accessoryMinutes: 0,
      finisherMinutes: 0,
    }
    removedBlocks.push('Accessories', 'Density Finishers')
    preservedBlocks.push('Core Mobility')
  } else if (newMinutes <= 45) {
    // Short session: trim accessories and finishers
    newAllocation = {
      skillWorkMinutes: 18,
      strengthMinutes: 12,
      mobilityMinutes: 8,
      accessoryMinutes: 5,
      finisherMinutes: 2,
    }
    removedBlocks.push('Extended Finishers')
    preservedBlocks.push('Mobility', 'Light Accessories')
  } else if (newMinutes <= 60) {
    // Standard session: slight trim
    const scale = newMinutes / 60
    newAllocation = {
      skillWorkMinutes: Math.round(20 * scale),
      strengthMinutes: Math.round(15 * scale),
      mobilityMinutes: Math.round(10 * scale),
      accessoryMinutes: Math.round(10 * scale),
      finisherMinutes: Math.round(5 * scale),
    }
    preservedBlocks.push('Mobility', 'Accessories', 'Finishers')
  } else {
    // Extended session: full allocation
    const scale = Math.min(1.3, newMinutes / 60)
    newAllocation = {
      skillWorkMinutes: Math.round(20 * scale),
      strengthMinutes: Math.round(18 * scale),
      mobilityMinutes: Math.round(12 * scale),
      accessoryMinutes: Math.round(12 * scale),
      finisherMinutes: Math.round(8 * scale),
    }
    preservedBlocks.push('Mobility', 'Accessories', 'Extended Finishers')
  }

  // Generate coach note
  let coachNote = ''
  if (reductionPercent > 0.3) {
    coachNote = 'Session time significantly reduced. Skill work remains priority. Accessory volume trimmed.'
  } else if (reductionPercent > 0) {
    coachNote = 'Session adjusted while maintaining core training focus.'
  } else if (reductionPercent < 0) {
    coachNote = 'More time allows for additional accessory and finisher work.'
  } else {
    coachNote = 'Session structure unchanged.'
  }

  return {
    newStructure: newAllocation,
    removedBlocks,
    preservedBlocks,
    coachNote,
  }
}

// =============================================================================
// EXERCISE SWAP ENGINE
// =============================================================================

export interface ExerciseSwapResult {
  originalExercise: string
  newExercise: string
  swapReason: string
  progressionContinuity: boolean
  alternativeOptions: string[]
}

export function swapExercise(
  exerciseId: string,
  reason: 'dislike' | 'equipment' | 'too_hard' | 'too_easy' | 'injury',
  availableEquipment: EquipmentType[]
): ExerciseSwapResult {
  const profile = getOnboardingProfile()
  
  // Build context for exercise intelligence
  const context: ExerciseIntelligenceContext = {
    experienceLevel: (profile?.experienceLevel as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
    availableEquipment,
    primaryGoal: profile?.primaryGoal || 'front_lever',
    targetSkills: [profile?.primaryGoal as any || 'front_lever'],
    fatigueLevel: 'moderate',
    sessionMinutes: 60,
  }

  // Find replacement using exercise intelligence
  const replacement = findBestReplacement(exerciseId, reason, context)

  // Map reason to user-friendly message
  const reasonMessages: Record<typeof reason, string> = {
    dislike: 'Exercise replaced with similar movement pattern',
    equipment: 'Exercise swapped due to equipment constraints',
    too_hard: 'Easier variation selected to match current level',
    too_easy: 'Harder variation selected for progression',
    injury: 'Joint-friendly alternative selected',
  }

  return {
    originalExercise: exerciseId,
    newExercise: replacement?.exerciseId || exerciseId,
    swapReason: reasonMessages[reason],
    progressionContinuity: true,
    alternativeOptions: replacement?.alternatives?.map(a => a.exerciseId) || [],
  }
}

// =============================================================================
// TRAINING DAY ADJUSTMENT
// =============================================================================

export interface TrainingDayAdjustmentResult {
  originalDays: TrainingDays
  newDays: TrainingDays
  mergedBlocks: string[]
  preservedSkillWork: boolean
  weeklyVolumeChange: string
  coachNote: string
}

export function adjustTrainingDays(
  originalDays: TrainingDays,
  newDays: TrainingDays
): TrainingDayAdjustmentResult {
  const mergedBlocks: string[] = []
  let weeklyVolumeChange = 'unchanged'
  let coachNote = ''

  if (newDays < originalDays) {
    // Reducing days - need to merge work
    const dayReduction = originalDays - newDays
    
    if (dayReduction === 1) {
      mergedBlocks.push('Accessory work consolidated')
      weeklyVolumeChange = 'slightly reduced (-10-15%)'
      coachNote = 'One fewer training day. Accessory work merged into remaining sessions.'
    } else if (dayReduction === 2) {
      mergedBlocks.push('Accessory work consolidated', 'Density work reduced')
      weeklyVolumeChange = 'moderately reduced (-20-30%)'
      coachNote = 'Training condensed to maintain skill focus while reducing total volume.'
    } else {
      mergedBlocks.push('Significant restructuring', 'Accessory minimized', 'Focus on essentials')
      weeklyVolumeChange = 'significantly reduced (-40%+)'
      coachNote = 'Major schedule change. Program restructured to preserve skill work.'
    }
  } else if (newDays > originalDays) {
    // Adding days - can distribute work better
    weeklyVolumeChange = 'slightly increased (+10-15%)'
    coachNote = 'Additional training days allow for better recovery between sessions.'
  } else {
    coachNote = 'Training frequency unchanged.'
  }

  return {
    originalDays,
    newDays,
    mergedBlocks,
    preservedSkillWork: true,
    weeklyVolumeChange,
    coachNote,
  }
}

// =============================================================================
// INTENSITY REDUCTION
// =============================================================================

export interface IntensityAdjustmentResult {
  level: 'mild' | 'moderate' | 'significant'
  rpeTarget: number
  volumeMultiplier: number
  progressionPaused: boolean
  variationChanges: string[]
  coachNote: string
}

export function adjustIntensity(
  level: 'mild' | 'moderate' | 'significant'
): IntensityAdjustmentResult {
  const config = INTENSITY_REDUCTION_MAP[level]
  const baseRPE = 8 // Default target RPE
  const newRPE = baseRPE - config.rpeReduction

  const variationChanges: string[] = []
  let coachNote = ''

  if (level === 'mild') {
    variationChanges.push('Slightly easier variations where appropriate')
    coachNote = 'Training intensity slightly reduced to support recovery.'
  } else if (level === 'moderate') {
    variationChanges.push('Regression to previous progression level', 'Reduced volume per exercise')
    coachNote = 'Moderate intensity reduction. Progression paused until recovery improves.'
  } else {
    variationChanges.push('Significant regression to easier variations', 'Focus on movement quality', 'Volume halved')
    coachNote = 'Training significantly reduced. Focus on consistency over intensity.'
  }

  return {
    level,
    rpeTarget: newRPE,
    volumeMultiplier: config.volumeMultiplier,
    progressionPaused: config.progressionHold,
    variationChanges,
    coachNote,
  }
}

// =============================================================================
// EQUIPMENT CHANGE HANDLING
// =============================================================================

export interface EquipmentChangeResult {
  addedEquipment: EquipmentType[]
  removedEquipment: EquipmentType[]
  affectedExercises: {
    original: string
    replacement: string
    reason: string
  }[]
  coachNote: string
}

export function handleEquipmentChange(
  originalEquipment: EquipmentType[],
  newEquipment: EquipmentType[]
): EquipmentChangeResult {
  const addedEquipment = newEquipment.filter(e => !originalEquipment.includes(e))
  const removedEquipment = originalEquipment.filter(e => !newEquipment.includes(e))
  
  const affectedExercises: EquipmentChangeResult['affectedExercises'] = []
  
  // Map common equipment-dependent swaps
  const equipmentSwapMap: Record<string, { requires: EquipmentType; alternatives: string[] }> = {
    dips: { requires: 'dip_station', alternatives: ['decline_pushups', 'pseudo_planche_pushups', 'tricep_dips_bench'] },
    ring_dips: { requires: 'rings', alternatives: ['bar_dips', 'decline_pushups'] },
    ring_rows: { requires: 'rings', alternatives: ['inverted_rows', 'band_rows'] },
    weighted_pullups: { requires: 'weights', alternatives: ['pullups', 'band_resisted_pullups'] },
  }

  for (const [exercise, config] of Object.entries(equipmentSwapMap)) {
    if (removedEquipment.includes(config.requires)) {
      affectedExercises.push({
        original: exercise,
        replacement: config.alternatives[0],
        reason: `${config.requires} no longer available`,
      })
    }
  }

  let coachNote = ''
  if (removedEquipment.length > 0 && addedEquipment.length > 0) {
    coachNote = 'Equipment updated. Some exercises have been swapped to match your setup.'
  } else if (removedEquipment.length > 0) {
    coachNote = `${removedEquipment.length} equipment item(s) removed. Exercises adjusted accordingly.`
  } else if (addedEquipment.length > 0) {
    coachNote = 'New equipment added. You may see additional exercise options.'
  } else {
    coachNote = 'Equipment unchanged.'
  }

  return {
    addedEquipment,
    removedEquipment,
    affectedExercises,
    coachNote,
  }
}

// =============================================================================
// MAIN ADJUSTMENT FUNCTION
// =============================================================================

export function applyProgramAdjustment(request: AdjustmentRequest): AdjustmentResult {
  const state = getStoredProgramState()
  const preservedItems: PreservedData = {
    progressionHistory: true,
    momentumScore: true,
    recoveryTrends: true,
    skillReadiness: true,
    goalProjections: true,
  }
  
  let description = ''
  let coachMessage = ''
  const warnings: string[] = []

  switch (request.type) {
    case 'session_time': {
      if (!request.newSessionMinutes) {
        return {
          success: false,
          adjustment: { type: request.type, timestamp: new Date().toISOString(), description: 'Failed', preservedData: [] },
          coachMessage: 'Session time not specified.',
          warnings: ['Missing session time parameter'],
          preservedItems,
        }
      }
      const currentMinutes = state?.currentInputs.sessionMinutes || 60
      const result = rebalanceSessionTime(currentMinutes, request.newSessionMinutes)
      description = `Session time: ${currentMinutes}min → ${request.newSessionMinutes}min`
      coachMessage = result.coachNote
      
      if (result.removedBlocks.length > 0) {
        warnings.push(`Removed: ${result.removedBlocks.join(', ')}`)
      }
      
      // Update state
      if (state) {
        state.currentInputs.sessionMinutes = request.newSessionMinutes
        saveProgramState(state)
      }
      break
    }

    case 'exercise_swap':
    case 'exercise_remove': {
      if (!request.exerciseId) {
        return {
          success: false,
          adjustment: { type: request.type, timestamp: new Date().toISOString(), description: 'Failed', preservedData: [] },
          coachMessage: 'Exercise not specified.',
          warnings: ['Missing exercise parameter'],
          preservedItems,
        }
      }
      const equipment = state?.currentInputs.equipment || []
      const swapResult = swapExercise(request.exerciseId, 'dislike', equipment)
      description = `Exercise swap: ${swapResult.originalExercise} → ${swapResult.newExercise}`
      coachMessage = swapResult.swapReason
      break
    }

    case 'training_days': {
      if (!request.newTrainingDays) {
        return {
          success: false,
          adjustment: { type: request.type, timestamp: new Date().toISOString(), description: 'Failed', preservedData: [] },
          coachMessage: 'Training days not specified.',
          warnings: ['Missing training days parameter'],
          preservedItems,
        }
      }
      const originalDays = state?.currentInputs.trainingDays || 3
      const dayResult = adjustTrainingDays(originalDays, request.newTrainingDays)
      description = `Training days: ${originalDays} → ${request.newTrainingDays} days/week`
      coachMessage = dayResult.coachNote
      
      if (dayResult.mergedBlocks.length > 0) {
        warnings.push(...dayResult.mergedBlocks)
      }
      
      // Update state
      if (state) {
        state.currentInputs.trainingDays = request.newTrainingDays
        saveProgramState(state)
      }
      break
    }

    case 'intensity': {
      if (!request.intensityReduction) {
        return {
          success: false,
          adjustment: { type: request.type, timestamp: new Date().toISOString(), description: 'Failed', preservedData: [] },
          coachMessage: 'Intensity level not specified.',
          warnings: ['Missing intensity parameter'],
          preservedItems,
        }
      }
      const intensityResult = adjustIntensity(request.intensityReduction)
      description = `Intensity reduced: ${request.intensityReduction}`
      coachMessage = intensityResult.coachNote
      
      if (intensityResult.progressionPaused) {
        warnings.push('Progression temporarily paused')
      }
      break
    }

    case 'equipment': {
      if (!request.newEquipment) {
        return {
          success: false,
          adjustment: { type: request.type, timestamp: new Date().toISOString(), description: 'Failed', preservedData: [] },
          coachMessage: 'Equipment list not specified.',
          warnings: ['Missing equipment parameter'],
          preservedItems,
        }
      }
      const originalEquipment = state?.currentInputs.equipment || []
      const equipResult = handleEquipmentChange(originalEquipment, request.newEquipment)
      description = `Equipment updated: ${equipResult.affectedExercises.length} exercise(s) affected`
      coachMessage = equipResult.coachNote
      
      // Update state
      if (state) {
        state.currentInputs.equipment = request.newEquipment
        saveProgramState(state)
      }
      break
    }
  }

  const adjustment: ProgramAdjustment = {
    type: request.type,
    timestamp: new Date().toISOString(),
    description,
    preservedData: Object.keys(preservedItems).filter(k => preservedItems[k as keyof PreservedData]),
  }

  // Save adjustment to history
  if (state) {
    state.adjustments.push(adjustment)
    saveProgramState(state)
  }

  const history = getAdjustmentHistory()
  history.push(adjustment)
  saveAdjustmentHistory(history)

  return {
    success: true,
    adjustment,
    coachMessage: coachMessage + '\n\nYour progression data, momentum score, and recovery tracking remain intact.',
    warnings,
    preservedItems,
  }
}

// =============================================================================
// COACH MESSAGES
// =============================================================================

export function getExitInterceptMessage(): {
  title: string
  body: string
  recommendation: string
} {
  const status = getProgramStatus()
  
  if (!status) {
    return {
      title: 'Program Adjustment',
      body: 'No active program found.',
      recommendation: 'Start a new program to begin training.',
    }
  }

  const weeksIn = status.currentWeek
  const weeksRemaining = MINIMUM_RECOMMENDED_WEEKS - weeksIn

  if (weeksRemaining > 0) {
    return {
      title: 'Program Adjustment',
      body: `Programs are designed to run for at least **${MINIMUM_RECOMMENDED_WEEKS} weeks** to produce the best results.\n\nYou're currently in week ${weeksIn}. Switching too early may slow your progress.`,
      recommendation: `If your schedule or preferences have changed, you can make small adjustments without restarting your program.`,
    }
  }

  return {
    title: 'Program Adjustment',
    body: `You've completed ${weeksIn} weeks of training. Great consistency!\n\nYou can continue with this program, make adjustments, or start a new program with updated goals.`,
    recommendation: 'Your progress and data will be preserved regardless of your choice.',
  }
}

export function getAdjustmentConfirmationMessage(result: AdjustmentResult): string {
  if (!result.success) {
    return 'Adjustment could not be applied. Please try again.'
  }

  return `Your program has been adjusted while maintaining your training goals.\n\n**${result.adjustment.description}**\n\n${result.coachMessage}\n\nConsistency is the most important factor for progress.`
}
