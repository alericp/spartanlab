// Equipment Adaptation Engine
// Adapts exercise selection based on available equipment

import type { EquipmentType, Exercise } from './adaptive-exercise-pool'
import type { SelectedExercise } from './program-exercise-selector'

export interface EquipmentProfile {
  available: EquipmentType[]
  hasFullSetup: boolean
  missingCritical: EquipmentType[]
  adaptationNotes: string[]
}

export interface AdaptationResult {
  adapted: SelectedExercise
  wasAdapted: boolean
  adaptationNote?: string
  qualityImpact: 'none' | 'minimal' | 'moderate' | 'significant'
}

// Equipment alternatives mapping
const EQUIPMENT_ALTERNATIVES: Record<string, { alternative: string; note: string; impact: 'minimal' | 'moderate' | 'significant' }> = {
  // Ring alternatives
  'ring_row': { alternative: 'bodyweight_row', note: 'Bar rows work well but rings allow more scap freedom', impact: 'minimal' },
  'ring_pushup': { alternative: 'push_up', note: 'Floor push-ups are effective but rings add instability training', impact: 'minimal' },
  
  // Dip bar alternatives
  'weighted_dip': { alternative: 'deep_pushup', note: 'Push-ups with elevation can substitute but weighted dips are superior for strength', impact: 'significant' },
  'dip': { alternative: 'push_up', note: 'Push-ups are a reasonable substitute for bodyweight dips', impact: 'moderate' },
  
  // Pull bar alternatives (limited options)
  'weighted_pull_up': { alternative: 'bodyweight_row', note: 'Rows cannot fully replace vertical pulling — consider getting a pull-up bar', impact: 'significant' },
  'pull_up': { alternative: 'bodyweight_row', note: 'Horizontal pulling is not equivalent to vertical — pull-up bar highly recommended', impact: 'significant' },
  'scap_pull_up': { alternative: 'scap_pushup', note: 'Scap push-ups train different patterns — pull-up bar recommended for pull goals', impact: 'moderate' },
  
  // Parallette alternatives
  'l_sit': { alternative: 'l_sit_floor', note: 'Floor L-sit is harder on wrists but effective', impact: 'minimal' },
  
  // Band alternatives
  'band_pull_apart': { alternative: 'arm_circles', note: 'Without bands, dynamic mobility work substitutes for shoulder prep', impact: 'minimal' },
}

// Floor-based alternatives for common exercises
const FLOOR_ALTERNATIVES: Record<string, Exercise> = {
  deep_pushup: {
    id: 'deep_pushup',
    name: 'Deep Push-Ups (Elevated)',
    category: 'strength',
    movementPattern: 'vertical_push',
    primaryMuscles: ['chest', 'triceps', 'anterior_deltoid'],
    equipment: ['floor'],
    neuralDemand: 2,
    fatigueCost: 2,
    transferTo: ['planche'],
    defaultSets: 4,
    defaultRepsOrTime: '8-10',
    notes: 'Hands on books/blocks for depth',
  },
  l_sit_floor: {
    id: 'l_sit_floor',
    name: 'L-Sit Hold (Floor)',
    category: 'core',
    movementPattern: 'core',
    primaryMuscles: ['hip_flexors', 'rectus_abdominis', 'triceps'],
    equipment: ['floor'],
    neuralDemand: 3,
    fatigueCost: 2,
    transferTo: ['planche'],
    defaultSets: 3,
    defaultRepsOrTime: '8-12s',
    notes: 'Palms flat, focus on elevation',
  },
}

// =============================================================================
// MAIN ADAPTATION FUNCTION
// =============================================================================

export function analyzeEquipmentProfile(available: EquipmentType[]): EquipmentProfile {
  const criticalEquipment: EquipmentType[] = ['pull_bar', 'dip_bars']
  const missingCritical = criticalEquipment.filter(eq => !available.includes(eq))
  
  const notes: string[] = []
  
  if (!available.includes('pull_bar')) {
    notes.push('Pull-up bar missing — vertical pulling will be limited. Consider doorframe bar or outdoor bars.')
  }
  
  if (!available.includes('dip_bars')) {
    notes.push('Dip bars missing — weighted dips not possible. Push-up progressions will substitute.')
  }
  
  if (!available.includes('rings')) {
    notes.push('Rings not available — ring exercises will use bar/floor alternatives.')
  }
  
  if (available.includes('pull_bar') && available.includes('dip_bars')) {
    notes.push('Core equipment available — full programming possible.')
  }
  
  return {
    available,
    hasFullSetup: missingCritical.length === 0,
    missingCritical,
    adaptationNotes: notes,
  }
}

export function adaptExerciseForEquipment(
  exercise: SelectedExercise,
  available: EquipmentType[]
): AdaptationResult {
  // Check if exercise can be performed with available equipment
  const canPerform = exercise.exercise.equipment.some(eq => 
    eq === 'floor' || eq === 'wall' || available.includes(eq)
  )
  
  if (canPerform) {
    return {
      adapted: exercise,
      wasAdapted: false,
      qualityImpact: 'none',
    }
  }
  
  // Need adaptation
  const altInfo = EQUIPMENT_ALTERNATIVES[exercise.exercise.id]
  
  if (altInfo && FLOOR_ALTERNATIVES[altInfo.alternative]) {
    const altExercise = FLOOR_ALTERNATIVES[altInfo.alternative]
    return {
      adapted: {
        ...exercise,
        exercise: altExercise,
        note: altInfo.note,
        selectionReason: `Adapted: ${exercise.exercise.name} → ${altExercise.name}`,
      },
      wasAdapted: true,
      adaptationNote: altInfo.note,
      qualityImpact: altInfo.impact,
    }
  }
  
  // Generic floor fallback
  return {
    adapted: {
      ...exercise,
      note: `Equipment limited — this is the best available alternative`,
    },
    wasAdapted: true,
    adaptationNote: 'Limited equipment reduces exercise specificity',
    qualityImpact: 'moderate',
  }
}

export function adaptSessionForEquipment(
  exercises: SelectedExercise[],
  available: EquipmentType[]
): {
  adapted: SelectedExercise[]
  adaptationCount: number
  significantLimitations: string[]
} {
  const adapted: SelectedExercise[] = []
  let adaptationCount = 0
  const significantLimitations: string[] = []
  
  for (const exercise of exercises) {
    const result = adaptExerciseForEquipment(exercise, available)
    adapted.push(result.adapted)
    
    if (result.wasAdapted) {
      adaptationCount++
      if (result.qualityImpact === 'significant') {
        significantLimitations.push(result.adaptationNote || exercise.exercise.name)
      }
    }
  }
  
  return {
    adapted,
    adaptationCount,
    significantLimitations,
  }
}

// =============================================================================
// EQUIPMENT RECOMMENDATIONS
// =============================================================================

export interface EquipmentRecommendation {
  equipment: EquipmentType
  priority: 'essential' | 'recommended' | 'nice_to_have'
  reason: string
  approximateCost: string
}

export function getEquipmentRecommendations(
  primaryGoal: string,
  available: EquipmentType[]
): EquipmentRecommendation[] {
  const recommendations: EquipmentRecommendation[] = []
  
  // Pull bar is essential for any pulling goal
  if (!available.includes('pull_bar')) {
    recommendations.push({
      equipment: 'pull_bar',
      priority: 'essential',
      reason: 'Required for pull-ups, front lever, muscle-up, and most pull training',
      approximateCost: '$20-50 (doorframe) or $50-150 (freestanding)',
    })
  }
  
  // Dip bars for push goals
  if (!available.includes('dip_bars') && 
      (primaryGoal === 'planche' || primaryGoal === 'muscle_up' || primaryGoal === 'weighted_strength')) {
    recommendations.push({
      equipment: 'dip_bars',
      priority: 'essential',
      reason: 'Required for weighted dips and optimal push strength development',
      approximateCost: '$30-80 (portable) or part of power tower',
    })
  }
  
  // Rings for advanced work
  if (!available.includes('rings')) {
    recommendations.push({
      equipment: 'rings',
      priority: 'recommended',
      reason: 'Adds instability training and enables ring-specific movements',
      approximateCost: '$30-60',
    })
  }
  
  // Parallettes for planche/L-sit
  if (!available.includes('parallettes') && 
      (primaryGoal === 'planche' || primaryGoal === 'handstand_pushup')) {
    recommendations.push({
      equipment: 'parallettes',
      priority: 'recommended',
      reason: 'Easier on wrists and allows greater depth for planche work',
      approximateCost: '$25-60',
    })
  }
  
  // Bands for warmup
  if (!available.includes('bands')) {
    recommendations.push({
      equipment: 'bands',
      priority: 'nice_to_have',
      reason: 'Useful for warmup, assisted progressions, and shoulder health',
      approximateCost: '$10-30 for a set',
    })
  }
  
  return recommendations
}
