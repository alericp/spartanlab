// Equipment Adaptation Engine
// Adapts exercise selection based on available equipment

import {
  getExerciseById,
  getExercisesByMovement,
  hasRequiredEquipment,
  type DifficultyLevel,
  type EquipmentType,
  type Exercise,
} from './adaptive-exercise-pool'
import { getExerciseLadder, getProgressionDown, getSubstitutes } from './progression-ladders'
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
  // Scap pull-ups are not replaced with scap push-ups. That swaps a pull
  // for a push and does not preserve the exercise purpose.
  
  // Parallette alternatives
  'l_sit': { alternative: 'l_sit_floor', note: 'Floor L-sit is harder on wrists but effective', impact: 'minimal' },
  
  // Band alternatives
  'band_pull_apart': { alternative: 'arm_circles', note: 'Without bands, dynamic mobility work substitutes for shoulder prep', impact: 'minimal' },
}

const DIFFICULTY_RANK: Record<DifficultyLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  elite: 4,
}

type MovementFamily = 'push' | 'pull' | 'core' | 'other'

function movementFamily(exercise: Exercise): MovementFamily {
  if (exercise.movementCategory === 'push' || exercise.movementCategory === 'pull') {
    return exercise.movementCategory
  }
  if (exercise.movementPattern === 'horizontal_push' || exercise.movementPattern === 'vertical_push') return 'push'
  if (exercise.movementPattern === 'horizontal_pull' || exercise.movementPattern === 'vertical_pull') return 'pull'
  if (exercise.movementPattern === 'core' || exercise.movementPattern === 'compression') return 'core'
  return 'other'
}

function isNotHarder(source: Exercise, candidate: Exercise): boolean {
  if (source.difficultyLevel && candidate.difficultyLevel) {
    if (DIFFICULTY_RANK[candidate.difficultyLevel] > DIFFICULTY_RANK[source.difficultyLevel]) return false
  }
  if (candidate.neuralDemand > source.neuralDemand) return false
  if (candidate.fatigueCost > source.fatigueCost) return false
  const sourceLadder = getExerciseLadder(source.id)
  const candidateLadder = getExerciseLadder(candidate.id)
  if (
    sourceLadder &&
    candidateLadder &&
    sourceLadder.ladderId === candidateLadder.ladderId &&
    candidateLadder.currentStep.level > sourceLadder.currentStep.level
  ) {
    return false
  }
  return true
}

function samePurpose(source: Exercise, candidate: Exercise): boolean {
  return movementFamily(source) === movementFamily(candidate) && movementFamily(source) !== 'other'
}

interface SubstituteCandidate {
  exercise: Exercise
  explicit: boolean
  note?: string
  impact?: 'minimal' | 'moderate' | 'significant'
}

function collectSubstituteCandidates(source: Exercise): SubstituteCandidate[] {
  const seen = new Set<string>()
  const candidates: SubstituteCandidate[] = []
  const add = (id: string | null | undefined, explicit: boolean, note?: string, impact?: SubstituteCandidate['impact']) => {
    if (!id || id === source.id || seen.has(id)) return
    const exercise = getExerciseById(id)
    if (!exercise) return
    seen.add(id)
    candidates.push({ exercise, explicit, note, impact })
  }

  add(source.progressionDown, true)
  add(getProgressionDown(source.id), true)
  for (const id of source.alternatives ?? []) add(id, true)
  for (const id of source.substitutionOptions ?? []) add(id, true)
  for (const substitute of getSubstitutes(source.id)) {
    if (substitute.fatigueAdjustment === 'harder') continue
    add(substitute.exerciseId, true, substitute.reason)
  }
  const mapped = EQUIPMENT_ALTERNATIVES[source.id]
  if (mapped) add(mapped.alternative, true, mapped.note, mapped.impact)

  for (const exercise of getExercisesByMovement(source.movementPattern)) {
    add(exercise.id, false)
  }
  return candidates
}

function substitutionNote(source: Exercise, candidate: Exercise, goal: string | undefined, mappedNote?: string): string {
  if (mappedNote) return mappedNote
  const samePattern = candidate.movementPattern === source.movementPattern
  const patternText = samePattern
    ? `It keeps the ${candidate.movementPattern.replace(/_/g, ' ')} pattern`
    : `It stays in the ${movementFamily(candidate)} family`
  const goalText = goal && candidate.transferTo.includes(goal)
    ? ` and still supports ${goal.replace(/_/g, ' ')}.`
    : '.'
  return `${source.name} needs equipment that is not available. ${candidate.name} is used instead. ${patternText}${goalText}`
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
    // [EQUIPMENT-LITERAL-CANONICAL] EquipmentType uses `pull_bar`, not
    // the legacy `pullup_bar` literal. Use the canonical literal so the
    // verdict log compares against a real EquipmentType value.
    settingsPullUpBar: available.includes('pull_bar'),
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
  available: EquipmentType[],
  context?: { primaryGoal?: string },
): AdaptationResult {
  const source = exercise.exercise
  if (hasRequiredEquipment(source, available)) {
    return {
      adapted: exercise,
      wasAdapted: false,
      qualityImpact: 'none',
    }
  }

  const goal = context?.primaryGoal
  const eligible = collectSubstituteCandidates(source).filter((candidate) => {
    if (!hasRequiredEquipment(candidate.exercise, available)) return false
    if (!isNotHarder(source, candidate.exercise)) return false
    if (!samePurpose(source, candidate.exercise)) return false
    if (!candidate.explicit && candidate.exercise.movementPattern !== source.movementPattern) return false
    return true
  })

  eligible.sort((left, right) => {
    const goalScore = (candidate: SubstituteCandidate) =>
      goal && source.transferTo.includes(goal) && candidate.exercise.transferTo.includes(goal) ? 1 : 0
    const patternScore = (candidate: SubstituteCandidate) =>
      candidate.exercise.movementPattern === source.movementPattern ? 1 : 0
    const difficultyScore = (candidate: SubstituteCandidate) =>
      candidate.exercise.difficultyLevel ? DIFFICULTY_RANK[candidate.exercise.difficultyLevel] : 9
    return (
      goalScore(right) - goalScore(left) ||
      patternScore(right) - patternScore(left) ||
      (right.explicit ? 1 : 0) - (left.explicit ? 1 : 0) ||
      difficultyScore(left) - difficultyScore(right) ||
      left.exercise.neuralDemand - right.exercise.neuralDemand ||
      left.exercise.fatigueCost - right.exercise.fatigueCost ||
      left.exercise.name.localeCompare(right.exercise.name)
    )
  })

  const chosen = eligible[0]
  if (!chosen) {
    const limitation = `${source.name} needs equipment that is not available, and the exercise pool has no appropriate substitute. It was left unchanged.`
    return {
      adapted: {
        ...exercise,
        note: exercise.note ? `${exercise.note} ${limitation}` : limitation,
      },
      wasAdapted: false,
      adaptationNote: limitation,
      qualityImpact: 'significant',
    }
  }

  const note = substitutionNote(source, chosen.exercise, goal, chosen.note)
  const samePattern = chosen.exercise.movementPattern === source.movementPattern
  const qualityImpact = chosen.impact ?? (samePattern ? 'minimal' : 'moderate')
  return {
    adapted: {
      ...exercise,
      exercise: chosen.exercise,
      note,
      selectionReason: `Adapted: ${source.name} → ${chosen.exercise.name}`,
      wasSubstituted: true,
      originalExerciseId: source.id,
    },
    wasAdapted: true,
    adaptationNote: note,
    qualityImpact,
  }
}

export function adaptSessionForEquipment(
  exercises: SelectedExercise[],
  available: EquipmentType[],
  context?: { primaryGoal?: string },
): {
  adapted: SelectedExercise[]
  adaptationCount: number
  significantLimitations: string[]
} {
  const adapted: SelectedExercise[] = []
  let adaptationCount = 0
  const significantLimitations: string[] = []
  
  for (const exercise of exercises) {
    const result = adaptExerciseForEquipment(exercise, available, context)
    adapted.push(result.adapted)
    
    if (result.wasAdapted) {
      adaptationCount++
    }
    if (result.qualityImpact === 'significant' && result.adaptationNote) {
      significantLimitations.push(result.adaptationNote)
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
