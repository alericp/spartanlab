// Daily Adjustment Engine
// Adapts sessions based on wellness state, available time, and athlete context

import type { AdaptiveSession, AdaptiveExercise } from './adaptive-program-builder'
import type { RecoveryLevel } from './recovery-engine'
import { calculateRecoverySignal } from './recovery-engine'
import { getConstraintInsight } from './constraint-engine'
import { getQuickEngineStatus, buildAthleteState, type FatigueState } from './adaptive-athlete-engine'

// =============================================================================
// TYPES
// =============================================================================

export type WellnessState = 'fresh' | 'normal' | 'fatigued'

export type SessionAdjustmentType = 
  | 'keep_as_planned'
  | 'shorten_session'
  | 'reduce_volume'
  | 'shift_emphasis'
  | 'recovery_bias'

export interface DailyState {
  wellnessState: WellnessState
  availableMinutes: number
  plannedMinutes: number
}

export interface SessionAdjustment {
  type: SessionAdjustmentType
  label: string
  original: AdaptiveSession
  adjusted: AdaptiveSession
  whatToKeep: string[]
  whatToCut: string[]
  whatToModify: string[]
  explanation: string
  wasAdjusted: boolean
}

// =============================================================================
// WELLNESS STATE ADJUSTMENTS
// =============================================================================

interface WellnessAdjustmentConfig {
  volumeMultiplier: number
  preserveSkillWork: boolean
  preserveStrengthWork: boolean
  reduceAccessory: boolean
  biasTowardQuality: boolean
  maxExercises: number | null
  explanation: string
}

const WELLNESS_CONFIGS: Record<WellnessState, WellnessAdjustmentConfig> = {
  fresh: {
    volumeMultiplier: 1.0,
    preserveSkillWork: true,
    preserveStrengthWork: true,
    reduceAccessory: false,
    biasTowardQuality: false,
    maxExercises: null,
    explanation: 'High readiness supports full session intensity.',
  },
  normal: {
    volumeMultiplier: 1.0,
    preserveSkillWork: true,
    preserveStrengthWork: true,
    reduceAccessory: false,
    biasTowardQuality: false,
    maxExercises: null,
    explanation: 'Standard session structure maintained.',
  },
  fatigued: {
    volumeMultiplier: 0.7,
    preserveSkillWork: true,
    preserveStrengthWork: true,
    reduceAccessory: true,
    biasTowardQuality: true,
    maxExercises: 5,
    explanation: 'Reduced volume to preserve training quality while managing fatigue.',
  },
}

// =============================================================================
// MAIN ADJUSTMENT FUNCTION
// =============================================================================

export function calculateSessionAdjustment(
  session: AdaptiveSession,
  dailyState: DailyState
): SessionAdjustment {
  const { wellnessState, availableMinutes, plannedMinutes } = dailyState
  
  // Check if any adjustment is needed
  const needsWellnessAdjustment = wellnessState === 'fatigued'
  const needsTimeAdjustment = availableMinutes < plannedMinutes - 5 // 5 min buffer
  
  if (!needsWellnessAdjustment && !needsTimeAdjustment) {
    return {
      type: 'keep_as_planned',
      label: 'Keep As Planned',
      original: session,
      adjusted: session,
      whatToKeep: session.exercises.map(e => e.name),
      whatToCut: [],
      whatToModify: [],
      explanation: 'No adjustment needed. Session fits your current state and available time.',
      wasAdjusted: false,
    }
  }
  
  // Determine adjustment type
  let adjustmentType: SessionAdjustmentType
  if (needsTimeAdjustment && needsWellnessAdjustment) {
    adjustmentType = availableMinutes < 40 ? 'recovery_bias' : 'reduce_volume'
  } else if (needsTimeAdjustment) {
    adjustmentType = availableMinutes < 35 ? 'shorten_session' : 'reduce_volume'
  } else {
    adjustmentType = wellnessState === 'fatigued' ? 'reduce_volume' : 'shift_emphasis'
  }
  
  // Apply adjustments
  const config = WELLNESS_CONFIGS[wellnessState]
  const adjusted = applyAdjustments(session, config, availableMinutes, plannedMinutes)
  
  // Track what changed
  const whatToKeep = adjusted.exercises.map(e => e.name)
  const whatToCut = session.exercises
    .filter(e => !adjusted.exercises.find(ae => ae.id === e.id))
    .map(e => e.name)
  const whatToModify = adjusted.exercises
    .filter(e => {
      const orig = session.exercises.find(oe => oe.id === e.id)
      return orig && orig.sets !== e.sets
    })
    .map(e => `${e.name}: sets adjusted`)
  
  // Generate explanation
  const explanation = generateAdjustmentExplanation(adjustmentType, wellnessState, availableMinutes, plannedMinutes)
  
  return {
    type: adjustmentType,
    label: getAdjustmentLabel(adjustmentType),
    original: session,
    adjusted,
    whatToKeep,
    whatToCut,
    whatToModify,
    explanation,
    wasAdjusted: true,
  }
}

// =============================================================================
// APPLY ADJUSTMENTS
// =============================================================================

function applyAdjustments(
  session: AdaptiveSession,
  config: WellnessAdjustmentConfig,
  availableMinutes: number,
  plannedMinutes: number
): AdaptiveSession {
  const timeRatio = availableMinutes / plannedMinutes
  
  // Sort exercises by priority
  const prioritized = [...session.exercises].sort((a, b) => {
    const priority: Record<string, number> = { skill: 0, strength: 1, accessory: 2, core: 3 }
    return (priority[a.category] ?? 4) - (priority[b.category] ?? 4)
  })
  
  // Determine which exercises to keep
  let exercisesToKeep = prioritized
  
  // Apply time-based filtering
  if (timeRatio < 0.5) {
    // Heavy compression - keep only essentials
    exercisesToKeep = prioritized.filter(e => 
      e.category === 'skill' || e.category === 'strength'
    ).slice(0, 4)
    
    // Always try to include one core movement
    const coreExercise = prioritized.find(e => e.category === 'core')
    if (coreExercise && exercisesToKeep.length < 5) {
      exercisesToKeep.push(coreExercise)
    }
  } else if (timeRatio < 0.7) {
    // Moderate compression
    exercisesToKeep = prioritized.slice(0, 5)
  } else if (config.reduceAccessory) {
    // Light compression - reduce accessories
    exercisesToKeep = prioritized.filter(e => 
      e.category !== 'accessory' || prioritized.indexOf(e) < 3
    )
  }
  
  // Apply max exercises limit
  if (config.maxExercises !== null) {
    exercisesToKeep = exercisesToKeep.slice(0, config.maxExercises)
  }
  
  // Apply volume multiplier
  const adjustedExercises: AdaptiveExercise[] = exercisesToKeep.map(e => {
    let adjustedSets = Math.round(e.sets * config.volumeMultiplier)
    
    // Never drop below 2 sets for key movements
    if (e.category === 'skill' || e.category === 'strength') {
      adjustedSets = Math.max(2, adjustedSets)
    } else {
      adjustedSets = Math.max(1, adjustedSets)
    }
    
    // Further reduce if time is very limited
    if (timeRatio < 0.6) {
      adjustedSets = Math.max(2, adjustedSets - 1)
    }
    
    return {
      ...e,
      sets: adjustedSets,
      wasAdapted: adjustedSets !== e.sets,
    }
  })
  
  // Adjust warmup and cooldown
  let warmup = [...session.warmup]
  let cooldown = [...session.cooldown]
  
  if (timeRatio < 0.5) {
    warmup = warmup.slice(0, 2).map(e => ({ ...e, sets: 1 }))
    cooldown = cooldown.slice(0, 1)
  } else if (timeRatio < 0.7) {
    warmup = warmup.slice(0, 3)
    cooldown = cooldown.slice(0, 2)
  }
  
  return {
    ...session,
    exercises: adjustedExercises,
    warmup,
    cooldown,
    estimatedMinutes: availableMinutes,
    adaptationNotes: [
      ...(session.adaptationNotes || []),
      `Session adapted for ${availableMinutes} minutes and ${config.biasTowardQuality ? 'fatigued' : 'current'} state.`
    ],
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function getAdjustmentLabel(type: SessionAdjustmentType): string {
  const labels: Record<SessionAdjustmentType, string> = {
    keep_as_planned: 'Keep As Planned',
    shorten_session: 'Shortened Session',
    reduce_volume: 'Reduced Volume',
    shift_emphasis: 'Shifted Emphasis',
    recovery_bias: 'Recovery-Focused',
  }
  return labels[type]
}

function generateAdjustmentExplanation(
  type: SessionAdjustmentType,
  wellness: WellnessState,
  available: number,
  planned: number
): string {
  const parts: string[] = []
  
  if (available < planned) {
    parts.push(`Session compressed from ${planned} to ${available} minutes.`)
  }
  
  if (wellness === 'fatigued') {
    parts.push('Volume reduced to maintain training quality while managing accumulated fatigue.')
  }
  
  switch (type) {
    case 'shorten_session':
      parts.push('Skill work and primary strength preserved; accessories removed.')
      break
    case 'reduce_volume':
      parts.push('Set counts reduced while preserving key movement patterns.')
      break
    case 'shift_emphasis':
      parts.push('Session rebalanced toward higher-quality skill work.')
      break
    case 'recovery_bias':
      parts.push('Focus shifted to technique and lower-fatigue movements.')
      break
  }
  
  return parts.join(' ')
}

// =============================================================================
// GET CURRENT WELLNESS STATE
// =============================================================================

export function inferWellnessFromRecovery(): WellnessState {
  const recovery = calculateRecoverySignal()
  
  if (recovery.level === 'HIGH') return 'fresh'
  if (recovery.level === 'LOW') return 'fatigued'
  return 'normal'
}

/**
 * Enhanced wellness inference using Adaptive Athlete Engine
 * This considers the full athlete state, not just recovery signal
 */
export function inferWellnessFromEngine(): {
  wellness: WellnessState
  engineFatigue: FatigueState
  shouldReduceLoad: boolean
  reason: string | null
} {
  const state = buildAthleteState()
  const engineStatus = getQuickEngineStatus()
  
  // Map engine fatigue state to wellness
  let wellness: WellnessState
  if (state.fatigueState === 'overtrained' || state.fatigueState === 'fatigued') {
    wellness = 'fatigued'
  } else if (state.fatigueState === 'fresh') {
    wellness = 'fresh'
  } else {
    wellness = 'normal'
  }
  
  // Determine if load should be reduced based on engine signals
  const shouldReduceLoad = 
    state.fatigueState === 'overtrained' ||
    state.fatigueState === 'fatigued' ||
    state.deloadStatus === 'deload_recommended' ||
    state.deloadStatus === 'lighten_next_session' ||
    state.trainingMomentum === 'regressing'
  
  let reason: string | null = null
  if (state.deloadStatus === 'deload_recommended') {
    reason = 'Multiple fatigue signals indicate a deload is recommended.'
  } else if (state.trainingMomentum === 'regressing') {
    reason = 'Recent performance decline suggests reducing load.'
  } else if (state.fatigueState === 'fatigued') {
    reason = 'Recovery indicators suggest elevated fatigue.'
  }
  
  return {
    wellness,
    engineFatigue: state.fatigueState,
    shouldReduceLoad,
    reason,
  }
}

// =============================================================================
// QUICK ADJUSTMENT PRESETS
// =============================================================================

export interface QuickAdjustmentPreset {
  id: string
  label: string
  description: string
  minutes: number
  wellness: WellnessState
}

export const QUICK_ADJUSTMENT_PRESETS: QuickAdjustmentPreset[] = [
  {
    id: 'full_fresh',
    label: 'Full Session (Fresh)',
    description: 'Complete planned workout',
    minutes: 75,
    wellness: 'fresh',
  },
  {
    id: 'full_normal',
    label: 'Full Session',
    description: 'Standard execution',
    minutes: 60,
    wellness: 'normal',
  },
  {
    id: 'moderate_fatigued',
    label: 'Lighter Session',
    description: 'Reduced for recovery',
    minutes: 60,
    wellness: 'fatigued',
  },
  {
    id: 'quick_45',
    label: '45 Min Session',
    description: 'Time-compressed',
    minutes: 45,
    wellness: 'normal',
  },
  {
    id: 'quick_30',
    label: '30 Min Session',
    description: 'Essential only',
    minutes: 30,
    wellness: 'normal',
  },
  {
    id: 'recovery',
    label: 'Recovery Session',
    description: 'Low fatigue focus',
    minutes: 30,
    wellness: 'fatigued',
  },
]
