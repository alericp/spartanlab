// Equipment Adaptation Engine
// Adapts exercise selection based on available equipment

import type { EquipmentType, Exercise } from './adaptive-exercise-pool'
import type { SelectedExercise } from './program-exercise-selector'

// =============================================================================
// [TASK 2] EQUIPMENT KEY NORMALIZATION
// The codebase has TWO EquipmentType definitions with different keys:
//   - athlete-profile.ts: 'pullup_bar', 'resistance_bands'
//   - adaptive-exercise-pool.ts: 'pull_bar', 'bands'
// This normalizer ensures both systems can communicate.
// =============================================================================
type AnyEquipmentKey = string

const EQUIPMENT_KEY_ALIASES: Record<string, string[]> = {
  'pull_bar': ['pullup_bar', 'pull-up-bar', 'pullUpBar', 'Pull-Up Bar'],
  'bands': ['resistance_bands', 'resistanceBands', 'Resistance Bands'],
  'dip_bars': ['dipBars', 'Dip Bars'],
  'rings': ['Rings'],
  'parallettes': ['Parallettes'],
  'weights': ['Weights'],
}

/**
 * Check if equipment is available, accounting for key aliases
 */
function hasEquipment(available: AnyEquipmentKey[], canonicalKey: string): boolean {
  const aliases = EQUIPMENT_KEY_ALIASES[canonicalKey] || []
  return available.includes(canonicalKey) || aliases.some(alias => available.includes(alias))
}

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
  // ==========================================================================
  // [TASK 1] EQUIPMENT TRUTH AUDIT
  // Log the equipment state at analysis time for debugging
  // ==========================================================================
  const hasPullBar = hasEquipment(available, 'pull_bar')
  const hasDipBars = hasEquipment(available, 'dip_bars')
  const hasRings = hasEquipment(available, 'rings')
  const hasBands = hasEquipment(available, 'bands')
  const hasWeights = hasEquipment(available, 'weights')
  
  console.log('[equipment-truth-audit]', {
    rawAvailableKeys: available.slice(0, 10),
    normalizedPullBar: hasPullBar,
    normalizedDipBars: hasDipBars,
    normalizedRings: hasRings,
    normalizedBands: hasBands,
    normalizedWeights: hasWeights,
    note: 'Using alias-aware equipment checking',
  })
  
  const criticalEquipment: EquipmentType[] = ['pull_bar', 'dip_bars']
  // Use alias-aware check for missing critical equipment
  const missingCritical = criticalEquipment.filter(eq => !hasEquipment(available, eq))
  
  const notes: string[] = []
  
  // [TASK 2] Use alias-aware checks for equipment warnings
  if (!hasPullBar) {
    notes.push('Pull-up bar missing — vertical pulling will be limited. Consider doorframe bar or outdoor bars.')
  }
  
  if (!hasDipBars) {
    notes.push('Dip bars missing — weighted dips not possible. Push-up progressions will substitute.')
  }
  
  if (!hasRings) {
    notes.push('Rings not available — ring exercises will use bar/floor alternatives.')
  }
  
  if (hasPullBar && hasDipBars) {
    notes.push('Core equipment available — full programming possible.')
  }
  
  // [TASK 9] Final equipment verdict
  const hasFullSetup = missingCritical.length === 0
  console.log('[equipment-final-verdict]', {
    settingsPullUpBar: available.includes('pullup_bar'),
    canonicalPullUpBar: hasPullBar,
    warningCardPullUpBarMissing: !hasPullBar,
    verticalPullingNowEligible: hasPullBar,
    weightedPullingNowEligible: hasPullBar && hasWeights,
    finalVerdict: hasFullSetup ? 'fully_aligned' : 'equipment_limited',
  })
  
  return {
    available,
    hasFullSetup,
    missingCritical,
    adaptationNotes: notes,
  }
}

export function adaptExerciseForEquipment(
  exercise: SelectedExercise,
  available: EquipmentType[]
): AdaptationResult {
  // [TASK 2] Check if exercise can be performed with available equipment using alias-aware check
  const canPerform = exercise.exercise.equipment.some(eq => 
    eq === 'floor' || eq === 'wall' || hasEquipment(available, eq)
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
  
  // [TASK 2] Pull bar is essential for any pulling goal - use alias-aware check
  if (!hasEquipment(available, 'pull_bar')) {
    recommendations.push({
      equipment: 'pull_bar',
      priority: 'essential',
      reason: 'Required for pull-ups, front lever, muscle-up, and most pull training',
      approximateCost: '$20-50 (doorframe) or $50-150 (freestanding)',
    })
  }
  
  // Dip bars for push goals - use alias-aware check
  if (!hasEquipment(available, 'dip_bars') && 
      (primaryGoal === 'planche' || primaryGoal === 'muscle_up' || primaryGoal === 'weighted_strength')) {
    recommendations.push({
      equipment: 'dip_bars',
      priority: 'essential',
      reason: 'Required for weighted dips and optimal push strength development',
      approximateCost: '$30-80 (portable) or part of power tower',
    })
  }
  
  // Rings for advanced work - use alias-aware check
  if (!hasEquipment(available, 'rings')) {
    recommendations.push({
      equipment: 'rings',
      priority: 'recommended',
      reason: 'Adds instability training and enables ring-specific movements',
      approximateCost: '$30-60',
    })
  }
  
  // Parallettes for planche/L-sit - use alias-aware check
  if (!hasEquipment(available, 'parallettes') && 
      (primaryGoal === 'planche' || primaryGoal === 'handstand_pushup')) {
    recommendations.push({
      equipment: 'parallettes',
      priority: 'recommended',
      reason: 'Easier on wrists and allows greater depth for planche work',
      approximateCost: '$25-60',
    })
  }
  
  // Bands for warmup - use alias-aware check
  if (!hasEquipment(available, 'bands')) {
    recommendations.push({
      equipment: 'bands',
      priority: 'nice_to_have',
      reason: 'Useful for warmup, assisted progressions, and shoulder health',
      approximateCost: '$10-30 for a set',
    })
  }
  
  return recommendations
}
