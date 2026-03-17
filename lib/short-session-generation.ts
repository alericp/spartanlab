/**
 * Short Session Generation Service
 * 
 * Generates intelligent short-duration training sessions (10-25 minutes)
 * using structured formats that preserve training quality.
 * 
 * KEY PRINCIPLE: Short sessions are NOT random circuits.
 * They use structured formats (EMOM, ladder, pyramid, density) that:
 * - Preserve skill progression logic
 * - Respect readiness levels
 * - Follow doctrine rules
 * - Maintain skill carryover
 */

import {
  buildEMOMStructure,
  buildLadderStructure,
  buildPyramidStructure,
  buildDensityBlockStructure,
  buildShortSessionStructure,
  buildSkillMicroSession,
  selectSessionStructure,
  adjustStructureForEnvelope,
  type SessionStructure,
  type SessionStructureType,
  type StructureSelectionInput,
  type ExerciseSlot,
} from './session-structure-engine'
import type { TrainingStyleMode } from './training-style-service'
import type { CoachingFrameworkId } from './coaching-framework-engine'
import type { SkillGoal } from './athlete-profile'

// =============================================================================
// TYPES
// =============================================================================

export type ShortSessionFormat = 
  | 'emom'
  | 'ladder' 
  | 'pyramid'
  | 'density_block'
  | 'express'
  | 'skill_micro'

export type ShortSessionDuration = 10 | 15 | 20 | 25

export interface ShortSessionPreference {
  enabled: boolean
  preferredFormat: ShortSessionFormat | 'auto'
  preferredDuration: ShortSessionDuration
  skillFocused: boolean
  allowDensityBlocks: boolean
}

export interface ShortSessionRequest {
  userId: string
  availableMinutes: ShortSessionDuration
  preferredFormat?: ShortSessionFormat | 'auto'
  
  // Athlete context
  trainingStyle: TrainingStyleMode
  frameworkId?: CoachingFrameworkId
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  
  // Current state
  fatigueLevel: 'fresh' | 'normal' | 'fatigued'
  isDeloadWeek?: boolean
  
  // Skill context
  primarySkill?: SkillGoal
  skillReadinessScore?: number
  limitingFactor?: string
  
  // Envelope limits
  envelopeTolerances?: {
    straightArmPull?: number
    straightArmPush?: number
    verticalPull?: number
  }
}

export interface ShortSessionExercise {
  id: string
  name: string
  sets: number
  reps: string
  rest: string
  notes: string[]
  slotType: 'skill' | 'strength' | 'support' | 'accessory' | 'conditioning'
  tier: 'tier1_core' | 'tier2_support' | 'tier3_optional'
  skillCarryover?: string[]
  isSubstitutable: boolean
}

export interface GeneratedShortSession {
  sessionId: string
  format: ShortSessionFormat
  formatLabel: string
  formatDescription: string
  
  // Timing
  durationMinutes: number
  estimatedActiveMinutes: number
  
  // Structure details
  structure: {
    rounds?: number
    repScheme?: string
    restPattern?: string
    density?: 'low' | 'moderate' | 'high'
  }
  
  // Exercises
  exercises: ShortSessionExercise[]
  
  // Coaching
  coachingExplanation: string
  focusAreas: string[]
  safetyNotes: string[]
  
  // Metadata
  generatedAt: string
  skillAlignment: number // 0-100, how well aligned with primary skill
  fatigueCost: 'very_low' | 'low' | 'moderate' | 'high'
}

// =============================================================================
// FORMAT LABELS AND DESCRIPTIONS
// =============================================================================

export const SHORT_SESSION_FORMAT_INFO: Record<ShortSessionFormat, { label: string; description: string; icon: string }> = {
  emom: {
    label: 'EMOM',
    description: 'Every Minute On the Minute - structured timing with built-in rest',
    icon: 'Clock',
  },
  ladder: {
    label: 'Ladder',
    description: 'Progressive rep increase (1-2-3-4...) - builds work capacity',
    icon: 'TrendingUp',
  },
  pyramid: {
    label: 'Pyramid',
    description: 'Ascending then descending reps - strength-endurance focus',
    icon: 'Triangle',
  },
  density_block: {
    label: 'Density Block',
    description: 'Continuous work for set time - efficient skill reinforcement',
    icon: 'Layers',
  },
  express: {
    label: 'Express Session',
    description: 'Time-efficient traditional structure - core movements only',
    icon: 'Zap',
  },
  skill_micro: {
    label: 'Skill Micro',
    description: 'Low-fatigue skill practice - technique maintenance',
    icon: 'Target',
  },
}

// =============================================================================
// SKILL-SPECIFIC EXERCISE TEMPLATES
// =============================================================================

interface SkillExerciseTemplate {
  skill: ShortSessionExercise
  strength: ShortSessionExercise
  support: ShortSessionExercise
}

const SKILL_EXERCISE_TEMPLATES: Record<string, SkillExerciseTemplate> = {
  front_lever: {
    skill: {
      id: 'fl_hold',
      name: 'Tuck Front Lever Hold',
      sets: 3,
      reps: '6-10s',
      rest: '90s',
      notes: ['Focus on scapular depression', 'Maintain posterior pelvic tilt'],
      slotType: 'skill',
      tier: 'tier1_core',
      skillCarryover: ['front_lever', 'pulling_strength'],
      isSubstitutable: true,
    },
    strength: {
      id: 'fl_rows',
      name: 'Front Lever Rows',
      sets: 3,
      reps: '5-8',
      rest: '90s',
      notes: ['Control the negative', 'Pull to lower chest'],
      slotType: 'strength',
      tier: 'tier1_core',
      skillCarryover: ['front_lever', 'horizontal_pull'],
      isSubstitutable: true,
    },
    support: {
      id: 'scap_pulls',
      name: 'Scapular Pull-Ups',
      sets: 3,
      reps: '8-12',
      rest: '60s',
      notes: ['Controlled movement', 'Full range of motion'],
      slotType: 'support',
      tier: 'tier2_support',
      skillCarryover: ['front_lever', 'scapular_control'],
      isSubstitutable: true,
    },
  },
  planche: {
    skill: {
      id: 'pl_lean',
      name: 'Planche Lean',
      sets: 3,
      reps: '10-15s',
      rest: '90s',
      notes: ['Protract scapulae', 'Maintain hollow body'],
      slotType: 'skill',
      tier: 'tier1_core',
      skillCarryover: ['planche', 'pushing_strength'],
      isSubstitutable: true,
    },
    strength: {
      id: 'pppu',
      name: 'Pseudo Planche Push-Ups',
      sets: 3,
      reps: '5-8',
      rest: '90s',
      notes: ['Lean forward as far as possible', 'Control the descent'],
      slotType: 'strength',
      tier: 'tier1_core',
      skillCarryover: ['planche', 'horizontal_push'],
      isSubstitutable: true,
    },
    support: {
      id: 'support_hold',
      name: 'Ring Support Hold',
      sets: 3,
      reps: '20-30s',
      rest: '60s',
      notes: ['Turn rings out', 'Depress shoulders'],
      slotType: 'support',
      tier: 'tier2_support',
      skillCarryover: ['planche', 'ring_stability'],
      isSubstitutable: true,
    },
  },
  muscle_up: {
    skill: {
      id: 'mu_transition',
      name: 'Muscle-Up Transition Practice',
      sets: 3,
      reps: '3-5',
      rest: '120s',
      notes: ['Use band if needed', 'Focus on the catch'],
      slotType: 'skill',
      tier: 'tier1_core',
      skillCarryover: ['muscle_up', 'explosive_pull'],
      isSubstitutable: true,
    },
    strength: {
      id: 'high_pulls',
      name: 'High Pull-Ups',
      sets: 3,
      reps: '5-8',
      rest: '90s',
      notes: ['Pull to chest or higher', 'Explosive concentric'],
      slotType: 'strength',
      tier: 'tier1_core',
      skillCarryover: ['muscle_up', 'vertical_pull'],
      isSubstitutable: true,
    },
    support: {
      id: 'straight_bar_dips',
      name: 'Straight Bar Dips',
      sets: 3,
      reps: '8-12',
      rest: '60s',
      notes: ['Control the bottom', 'Lean forward slightly'],
      slotType: 'support',
      tier: 'tier2_support',
      skillCarryover: ['muscle_up', 'transition_strength'],
      isSubstitutable: true,
    },
  },
  handstand_pushup: {
    skill: {
      id: 'wall_hspu',
      name: 'Wall Handstand Push-Up',
      sets: 3,
      reps: '3-5',
      rest: '120s',
      notes: ['Full range of motion', 'Control the negative'],
      slotType: 'skill',
      tier: 'tier1_core',
      skillCarryover: ['handstand_pushup', 'vertical_push'],
      isSubstitutable: true,
    },
    strength: {
      id: 'pike_pushup',
      name: 'Pike Push-Ups',
      sets: 3,
      reps: '8-12',
      rest: '90s',
      notes: ['Elevate feet for more difficulty', 'Touch head to floor'],
      slotType: 'strength',
      tier: 'tier1_core',
      skillCarryover: ['handstand_pushup', 'shoulder_strength'],
      isSubstitutable: true,
    },
    support: {
      id: 'wall_walks',
      name: 'Wall Walks',
      sets: 3,
      reps: '3-5',
      rest: '60s',
      notes: ['Controlled movement', 'Touch chest to wall'],
      slotType: 'support',
      tier: 'tier2_support',
      skillCarryover: ['handstand_pushup', 'handstand_strength'],
      isSubstitutable: true,
    },
  },
}

// Default template for general strength
const DEFAULT_EXERCISE_TEMPLATE: SkillExerciseTemplate = {
  skill: {
    id: 'hollow_hold',
    name: 'Hollow Body Hold',
    sets: 3,
    reps: '20-30s',
    rest: '60s',
    notes: ['Press lower back into floor', 'Engage core throughout'],
    slotType: 'skill',
    tier: 'tier1_core',
    skillCarryover: ['core_strength', 'body_tension'],
    isSubstitutable: true,
  },
  strength: {
    id: 'pull_ups',
    name: 'Pull-Ups',
    sets: 3,
    reps: '5-10',
    rest: '90s',
    notes: ['Full range of motion', 'Control the negative'],
    slotType: 'strength',
    tier: 'tier1_core',
    skillCarryover: ['pulling_strength'],
    isSubstitutable: true,
  },
  support: {
    id: 'dips',
    name: 'Dips',
    sets: 3,
    reps: '8-12',
    rest: '60s',
    notes: ['Full depth if possible', 'Control movement'],
    slotType: 'support',
    tier: 'tier2_support',
    skillCarryover: ['pushing_strength'],
    isSubstitutable: true,
  },
}

// =============================================================================
// SHORT SESSION GENERATION
// =============================================================================

/**
 * Generate a short training session based on athlete context
 */
export function generateShortSession(request: ShortSessionRequest): GeneratedShortSession {
  // Determine the best format
  const format = selectShortSessionFormat(request)
  
  // Get the session structure
  const structure = getStructureForFormat(format, request)
  
  // Select exercises based on skill focus
  const exercises = selectExercisesForShortSession(request, structure)
  
  // Apply envelope adjustments if needed
  const adjustedExercises = request.envelopeTolerances 
    ? applyEnvelopeAdjustments(exercises, request.envelopeTolerances)
    : exercises
  
  // Calculate fatigue cost
  const fatigueCost = calculateFatigueCost(format, adjustedExercises, request)
  
  // Generate coaching explanation
  const coachingExplanation = generateShortSessionExplanation(format, request, structure)
  
  // Calculate skill alignment
  const skillAlignment = calculateSkillAlignment(adjustedExercises, request.primarySkill)
  
  return {
    sessionId: `short_${format}_${Date.now()}`,
    format,
    formatLabel: SHORT_SESSION_FORMAT_INFO[format].label,
    formatDescription: SHORT_SESSION_FORMAT_INFO[format].description,
    
    durationMinutes: request.availableMinutes,
    estimatedActiveMinutes: Math.round(request.availableMinutes * 0.7),
    
    structure: {
      rounds: structure.cycleCount,
      repScheme: getRepSchemeDescription(format, structure),
      restPattern: getRestPatternDescription(format),
      density: structure.densityLevel === 'very_high' ? 'high' : structure.densityLevel,
    },
    
    exercises: adjustedExercises,
    
    coachingExplanation,
    focusAreas: getFocusAreas(request),
    safetyNotes: getSafetyNotes(request, format),
    
    generatedAt: new Date().toISOString(),
    skillAlignment,
    fatigueCost,
  }
}

/**
 * Select the best format for a short session
 */
function selectShortSessionFormat(request: ShortSessionRequest): ShortSessionFormat {
  // If user specified a format, use it (unless 'auto')
  if (request.preferredFormat && request.preferredFormat !== 'auto') {
    return request.preferredFormat
  }
  
  // Use the session structure engine's selection logic
  const structureInput: StructureSelectionInput = {
    availableMinutes: request.availableMinutes,
    trainingStyle: request.trainingStyle,
    frameworkId: request.frameworkId,
    fatigueLevel: request.fatigueLevel,
    experienceLevel: request.experienceLevel,
    preferDensityTraining: request.trainingStyle === 'endurance_focused',
    isDeloadWeek: request.isDeloadWeek,
    primaryGoal: request.primarySkill,
    envelopeTolerances: request.envelopeTolerances,
  }
  
  const selection = selectSessionStructure(structureInput)
  
  // Map structure type to short session format
  const formatMap: Record<SessionStructureType, ShortSessionFormat> = {
    'standard': 'express',
    'emom': 'emom',
    'ladder': 'ladder',
    'pyramid': 'pyramid',
    'density_block': 'density_block',
    'short_circuit': 'express',
    'skill_micro': 'skill_micro',
  }
  
  return formatMap[selection.selectedStructure.structureType] || 'express'
}

/**
 * Get the session structure for a given format
 */
function getStructureForFormat(format: ShortSessionFormat, request: ShortSessionRequest): SessionStructure {
  const minutes = request.availableMinutes
  const skillFocus = request.trainingStyle === 'skill_focused'
  
  switch (format) {
    case 'emom':
      return buildEMOMStructure(
        Math.min(minutes, 20),
        minutes <= 12 ? 2 : 3,
        skillFocus ? 'skill' : 'mixed'
      )
    
    case 'ladder':
      return buildLadderStructure(
        request.experienceLevel === 'advanced' ? 7 : 5,
        minutes <= 20 ? 2 : 3
      )
    
    case 'pyramid':
      return buildPyramidStructure(10, 2)
    
    case 'density_block':
      return buildDensityBlockStructure(
        Math.min(minutes, 12),
        skillFocus ? 'skill' : 'weak_point',
        minutes <= 10 ? 2 : 3
      )
    
    case 'skill_micro':
      return buildSkillMicroSession(request.primarySkill || 'general', Math.min(minutes, 15))
    
    case 'express':
    default:
      return buildShortSessionStructure(
        minutes,
        skillFocus ? 'skill' : request.trainingStyle === 'strength_focused' ? 'strength' : 'conditioning'
      )
  }
}

/**
 * Select exercises for the short session based on skill focus
 */
function selectExercisesForShortSession(
  request: ShortSessionRequest,
  structure: SessionStructure
): ShortSessionExercise[] {
  const exercises: ShortSessionExercise[] = []
  
  // Get template based on primary skill
  const template = request.primarySkill 
    ? (SKILL_EXERCISE_TEMPLATES[request.primarySkill] || DEFAULT_EXERCISE_TEMPLATE)
    : DEFAULT_EXERCISE_TEMPLATE
  
  // Map slots to exercises
  for (const slot of structure.exerciseSlots) {
    let exercise: ShortSessionExercise
    
    switch (slot.slotType) {
      case 'skill':
        exercise = { ...template.skill }
        break
      case 'strength':
        exercise = { ...template.strength }
        break
      case 'support':
      case 'accessory':
        exercise = { ...template.support }
        break
      default:
        exercise = { ...template.support }
    }
    
    // Adjust reps based on structure
    exercise.reps = adjustRepsForStructure(slot.repRange, structure.structureType)
    exercise.rest = `${slot.restAfterSeconds}s`
    exercise.tier = slot.tier as 'tier1_core' | 'tier2_support' | 'tier3_optional'
    
    exercises.push(exercise)
  }
  
  return exercises
}

/**
 * Apply envelope tolerances to exercise selection
 */
function applyEnvelopeAdjustments(
  exercises: ShortSessionExercise[],
  tolerances: { straightArmPull?: number; straightArmPush?: number; verticalPull?: number }
): ShortSessionExercise[] {
  return exercises.map(ex => {
    const adjusted = { ...ex }
    
    // Check if exercise involves straight-arm work
    const isStraightArmPull = ex.skillCarryover?.includes('front_lever') || ex.name.toLowerCase().includes('lever')
    const isStraightArmPush = ex.skillCarryover?.includes('planche') || ex.name.toLowerCase().includes('planche')
    
    // Reduce volume if envelope is limited
    if (isStraightArmPull && tolerances.straightArmPull !== undefined && tolerances.straightArmPull < 50) {
      adjusted.sets = Math.max(2, adjusted.sets - 1)
      adjusted.notes = [...adjusted.notes, 'Volume reduced for envelope safety']
    }
    
    if (isStraightArmPush && tolerances.straightArmPush !== undefined && tolerances.straightArmPush < 50) {
      adjusted.sets = Math.max(2, adjusted.sets - 1)
      adjusted.notes = [...adjusted.notes, 'Volume reduced for envelope safety']
    }
    
    return adjusted
  })
}

/**
 * Calculate fatigue cost of the session
 */
function calculateFatigueCost(
  format: ShortSessionFormat,
  exercises: ShortSessionExercise[],
  request: ShortSessionRequest
): 'very_low' | 'low' | 'moderate' | 'high' {
  // Base fatigue by format
  const formatFatigue: Record<ShortSessionFormat, number> = {
    skill_micro: 1,
    express: 2,
    emom: 2,
    ladder: 3,
    density_block: 3,
    pyramid: 4,
  }
  
  let fatigue = formatFatigue[format]
  
  // Adjust based on duration
  if (request.availableMinutes >= 20) fatigue += 1
  
  // Adjust based on experience (beginners tire faster)
  if (request.experienceLevel === 'beginner') fatigue += 1
  
  // Map to category
  if (fatigue <= 1) return 'very_low'
  if (fatigue <= 2) return 'low'
  if (fatigue <= 3) return 'moderate'
  return 'high'
}

/**
 * Generate coaching explanation for the session
 */
function generateShortSessionExplanation(
  format: ShortSessionFormat,
  request: ShortSessionRequest,
  structure: SessionStructure
): string {
  const formatName = SHORT_SESSION_FORMAT_INFO[format].label
  const minutes = request.availableMinutes
  
  let explanation = `This ${minutes}-minute ${formatName} session uses a structured format to maximize efficiency in limited time. `
  
  switch (format) {
    case 'emom':
      explanation += 'The EMOM structure ensures quality reps with consistent rest periods, preventing fatigue-induced technique breakdown.'
      break
    case 'ladder':
      explanation += 'The ladder progression naturally manages fatigue while building work capacity through increasing volume.'
      break
    case 'pyramid':
      explanation += 'The pyramid structure provides excellent strength-endurance stimulus by ramping up then back down.'
      break
    case 'density_block':
      explanation += 'The density block accumulates meaningful volume efficiently, ideal for skill reinforcement.'
      break
    case 'skill_micro':
      explanation += 'This low-fatigue session maintains motor patterns and technique without accumulating significant fatigue.'
      break
    case 'express':
    default:
      explanation += 'Essential movements are prioritized while maintaining training quality despite time constraints.'
  }
  
  if (request.primarySkill) {
    explanation += ` All exercises support your ${request.primarySkill.replace(/_/g, ' ')} progression.`
  }
  
  return explanation
}

/**
 * Calculate how well exercises align with primary skill
 */
function calculateSkillAlignment(exercises: ShortSessionExercise[], primarySkill?: SkillGoal): number {
  if (!primarySkill) return 50 // Neutral if no skill focus
  
  const aligned = exercises.filter(ex => 
    ex.skillCarryover?.includes(primarySkill) || 
    ex.skillCarryover?.some(sc => sc.includes(primarySkill.split('_')[0]))
  ).length
  
  return Math.round((aligned / exercises.length) * 100)
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function adjustRepsForStructure(repRange: [number, number], structureType: SessionStructureType): string {
  switch (structureType) {
    case 'emom':
      return `${repRange[0]}-${Math.min(repRange[1], 6)}` // Lower reps for EMOM
    case 'pyramid':
      return `2-${repRange[1]}-2` // Pyramid notation
    case 'ladder':
      return `1-${Math.min(repRange[1], 5)}` // Ladder range
    default:
      return `${repRange[0]}-${repRange[1]}`
  }
}

function getRepSchemeDescription(format: ShortSessionFormat, structure: SessionStructure): string {
  switch (format) {
    case 'emom':
      return `${structure.cycleCount} rounds, 1 exercise per minute`
    case 'ladder':
      return 'Progressive 1-2-3-4-5... reps'
    case 'pyramid':
      return 'Ascending then descending reps'
    case 'density_block':
      return 'Continuous work for set time'
    default:
      return 'Standard sets and reps'
  }
}

function getRestPatternDescription(format: ShortSessionFormat): string {
  switch (format) {
    case 'emom':
      return 'Rest is remainder of each minute'
    case 'ladder':
      return 'Brief rest between sets, longer between rounds'
    case 'pyramid':
      return 'Rest increases at peak, decreases on descent'
    case 'density_block':
      return 'Minimal rest, self-regulated'
    case 'skill_micro':
      return 'Full rest for quality'
    default:
      return 'Standard rest periods'
  }
}

function getFocusAreas(request: ShortSessionRequest): string[] {
  const areas: string[] = []
  
  if (request.primarySkill) {
    areas.push(request.primarySkill.replace(/_/g, ' '))
  }
  
  if (request.trainingStyle === 'skill_focused') {
    areas.push('skill maintenance')
  } else if (request.trainingStyle === 'strength_focused') {
    areas.push('strength development')
  } else if (request.trainingStyle === 'endurance_focused') {
    areas.push('work capacity')
  }
  
  if (request.limitingFactor) {
    areas.push(request.limitingFactor.replace(/_/g, ' '))
  }
  
  return areas
}

function getSafetyNotes(request: ShortSessionRequest, format: ShortSessionFormat): string[] {
  const notes: string[] = []
  
  // Always include quality reminder
  notes.push('Prioritize movement quality over completing all prescribed work')
  
  // Format-specific notes
  if (format === 'pyramid' || format === 'density_block') {
    notes.push('Stop if form breaks down significantly')
  }
  
  if (format === 'emom' && request.experienceLevel === 'beginner') {
    notes.push('Skip a round if needed to maintain quality')
  }
  
  // Envelope notes
  if (request.envelopeTolerances?.straightArmPull !== undefined && request.envelopeTolerances.straightArmPull < 50) {
    notes.push('Monitor straight-arm pulling fatigue carefully')
  }
  
  if (request.fatigueLevel === 'fatigued') {
    notes.push('Consider this a recovery-focused session')
  }
  
  return notes
}

// =============================================================================
// EXPORTS FOR DISPLAY
// =============================================================================

export function getAvailableShortSessionFormats(): { format: ShortSessionFormat; info: typeof SHORT_SESSION_FORMAT_INFO['emom'] }[] {
  return Object.entries(SHORT_SESSION_FORMAT_INFO).map(([format, info]) => ({
    format: format as ShortSessionFormat,
    info,
  }))
}

export function getShortSessionDurationOptions(): { value: ShortSessionDuration; label: string }[] {
  return [
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 25, label: '25 minutes' },
  ]
}
