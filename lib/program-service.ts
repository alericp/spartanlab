/**
 * PROGRAM SERVICE LAYER
 * 
 * =============================================================================
 * REGRESSION GUARD: THIS IS A LEGACY SERVICE - USE ADAPTIVE-PROGRAM-BUILDER.TS
 * =============================================================================
 * 
 * Uses localStorage for persistence, easy to swap to Prisma later.
 * 
 * CRITICAL ARCHITECTURAL NOTE:
 * This is the LEGACY program builder. For new features:
 * - Use adaptive-program-builder.ts -> generateAdaptiveProgram()
 * - Use canonical-profile-service.ts for profile reads
 * 
 * This service still exists for:
 * - Backward compatibility with existing programs
 * - Active program state management (getActiveProgram, setActiveProgram, clearActiveProgram)
 * - Program history retrieval
 * 
 * DO NOT:
 * - Use generateProgram() for new programs (use generateAdaptiveProgram instead)
 * - Add new fallback/default logic that bypasses canonical profile
 */

import {
  PLANCHE_EXERCISES,
  FRONT_LEVER_EXERCISES,
  MUSCLE_UP_EXERCISES,
  HSPU_EXERCISES,
  IRON_CROSS_EXERCISES,
  WEIGHTED_STRENGTH_EXERCISES,
  CORE_EXERCISES,
  SUPPORT_EXERCISES,
  type ExerciseTemplate,
  type DayTemplate,
} from './program-templates'
import { getSkillProgressions, getAthleteProfile } from './data-service'
import { getLatestRecords } from './strength-service'
import { getOnboardingProfile, isOnboardingComplete } from './athlete-profile'

export type PrimaryGoal = 'planche' | 'front_lever' | 'back_lever' | 'muscle_up' | 'handstand_pushup' | 'iron_cross' | 'weighted_strength' | 'general' | 'skill' | 'strength' | 'endurance' | 'abs' | 'pancake' | 'toe_touch' | 'front_splits' | 'side_splits' | 'flexibility'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type SecondaryEmphasis = 'pulling_strength' | 'pushing_strength' | 'core_control' | 'skill_technique' | 'hypertrophy_support' | 'none'
export type SessionLength = 30 | 45 | 60 | 75 | 90 | 120 | '10-20' | '20-30' | '30-45' | '45-60' | '60+'
// [TASK 5] Expanded to support 6 and 7 days/week for intensity-managed schedules
export type TrainingDays = 2 | 3 | 4 | 5 | 6 | 7

export interface ProgramInputs {
  primaryGoal: PrimaryGoal
  experienceLevel: ExperienceLevel
  trainingDaysPerWeek: TrainingDays
  secondaryEmphasis: SecondaryEmphasis
  sessionLength: SessionLength
}

export interface GeneratedProgram {
  id: string
  createdAt: string
  primaryGoal: PrimaryGoal
  experienceLevel: ExperienceLevel
  trainingDaysPerWeek: TrainingDays
  secondaryEmphasis: SecondaryEmphasis
  sessionLength: SessionLength
  generatedDays: DayTemplate[]
  strengthNote?: string
}

const STORAGE_KEY = 'spartanlab_programs'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Goal-specific exercise selection
function getGoalExercises(goal: PrimaryGoal, level: ExperienceLevel): ExerciseTemplate[] {
  const exerciseMap: Record<string, Record<string, ExerciseTemplate[]>> = {
    planche: PLANCHE_EXERCISES,
    front_lever: FRONT_LEVER_EXERCISES,
    muscle_up: MUSCLE_UP_EXERCISES,
    handstand_pushup: HSPU_EXERCISES,
    iron_cross: IRON_CROSS_EXERCISES,
    weighted_strength: WEIGHTED_STRENGTH_EXERCISES,
  }
  
  const exercises = exerciseMap[goal]
  if (!exercises) return []
  return exercises[level] || exercises.intermediate
}

// Get core exercise based on goal
function getCoreExercise(goal: PrimaryGoal): ExerciseTemplate {
  // Select appropriate core work based on goal
  if (goal === 'planche' || goal === 'front_lever') {
    return CORE_EXERCISES[0] // Hollow Body Hold
  }
  if (goal === 'muscle_up') {
    return CORE_EXERCISES[2] // Hanging Knee Raises
  }
  if (goal === 'handstand_pushup') {
    return CORE_EXERCISES[7] // Compression Work
  }
  return CORE_EXERCISES[1] // L-Sit Hold
}

// Get support exercise based on emphasis
function getSupportExercise(emphasis: SecondaryEmphasis): ExerciseTemplate | null {
  if (emphasis === 'pulling_strength') {
    return SUPPORT_EXERCISES.pulling[Math.floor(Math.random() * SUPPORT_EXERCISES.pulling.length)]
  }
  if (emphasis === 'pushing_strength') {
    return SUPPORT_EXERCISES.pushing[Math.floor(Math.random() * SUPPORT_EXERCISES.pushing.length)]
  }
  if (emphasis === 'hypertrophy_support') {
    return SUPPORT_EXERCISES.hypertrophy[Math.floor(Math.random() * SUPPORT_EXERCISES.hypertrophy.length)]
  }
  if (emphasis === 'core_control') {
    return CORE_EXERCISES[Math.floor(Math.random() * CORE_EXERCISES.length)]
  }
  return null
}

// Get max exercises based on session length
function getMaxExercises(sessionLength: SessionLength): number {
  if (sessionLength === 30) return 4
  if (sessionLength === 45) return 5
  if (sessionLength === 60) return 5
  return 6
}

// Generate strength note based on user's records
function generateStrengthNote(): string | undefined {
  if (!isBrowser()) return undefined
  
  const records = getLatestRecords()
  const notes: string[] = []
  
  if (records.weighted_pull_up) {
    notes.push(`Based on your weighted pull-up history (+${records.weighted_pull_up.weightAdded}lbs x${records.weighted_pull_up.reps}), maintain low-rep strength work.`)
  }
  if (records.weighted_dip) {
    notes.push(`Your dip strength (+${records.weighted_dip.weightAdded}lbs) supports push progression.`)
  }
  
  return notes.length > 0 ? notes[0] : undefined
}

// Build a single training day
function buildTrainingDay(
  dayNumber: number,
  isPush: boolean,
  inputs: ProgramInputs
): DayTemplate {
  const { primaryGoal, experienceLevel, secondaryEmphasis, sessionLength } = inputs
  const maxExercises = getMaxExercises(sessionLength)
  const exercises: ExerciseTemplate[] = []
  
  // Determine day emphasis
  let emphasis = ''
  const goalExercises = getGoalExercises(primaryGoal, experienceLevel)
  
if (primaryGoal === 'planche' || primaryGoal === 'handstand_pushup' || primaryGoal === 'iron_cross') {
  // Push-focused goal (includes Iron Cross - rings pressing skill)
  emphasis = isPush ? 'Skill Push + Strength' : 'Pull Strength + Support'
    
    if (isPush) {
      // Add skill work (1-2 exercises)
      const skillExercises = goalExercises.filter(e => e.category === 'skill')
      exercises.push(...skillExercises.slice(0, 2))
      
      // Add strength work
      const strengthExercises = goalExercises.filter(e => e.category === 'strength')
      exercises.push(...strengthExercises.slice(0, 2))
    } else {
      // Pull day support
      exercises.push({ name: 'Weighted Pull-Ups', sets: 4, repsOrTime: experienceLevel === 'beginner' ? '6-8' : '5', category: 'strength' })
      exercises.push({ name: 'Bodyweight Rows', sets: 3, repsOrTime: '10-12', category: 'accessory' })
      exercises.push({ name: 'Scap Pull-Ups', sets: 3, repsOrTime: '10', category: 'accessory' })
    }
  } else if (primaryGoal === 'front_lever' || primaryGoal === 'muscle_up') {
    // Pull-focused goal
    emphasis = isPush ? 'Push Strength + Support' : 'Skill Pull + Strength'
    
    if (!isPush) {
      // Add skill work
      const skillExercises = goalExercises.filter(e => e.category === 'skill')
      exercises.push(...skillExercises.slice(0, 2))
      
      // Add strength work
      const strengthExercises = goalExercises.filter(e => e.category === 'strength')
      exercises.push(...strengthExercises.slice(0, 2))
    } else {
      // Push day support
      exercises.push({ name: 'Weighted Dips', sets: 4, repsOrTime: experienceLevel === 'beginner' ? '6-8' : '5', category: 'strength' })
      exercises.push({ name: 'Push-Ups', sets: 3, repsOrTime: '15-20', category: 'accessory' })
      exercises.push({ name: 'Pike Push-Ups', sets: 3, repsOrTime: '8-10', category: 'accessory' })
    }
  } else {
    // Weighted strength goal - full body focus
    emphasis = isPush ? 'Push Strength Focus' : 'Pull Strength Focus'
    
    if (isPush) {
      exercises.push({ name: 'Weighted Dips', sets: 5, repsOrTime: experienceLevel === 'advanced' ? '3-5' : '5-6', note: 'Primary', category: 'strength' })
      exercises.push({ name: 'Dips', sets: 3, repsOrTime: '10-12', note: 'Volume', category: 'accessory' })
      exercises.push({ name: 'Push-Ups', sets: 3, repsOrTime: '15-20', category: 'accessory' })
    } else {
      exercises.push({ name: 'Weighted Pull-Ups', sets: 5, repsOrTime: experienceLevel === 'advanced' ? '3-5' : '5-6', note: 'Primary', category: 'strength' })
      exercises.push({ name: 'Pull-Ups', sets: 3, repsOrTime: '10-12', note: 'Volume', category: 'accessory' })
      exercises.push({ name: 'Bodyweight Rows', sets: 3, repsOrTime: '12-15', category: 'accessory' })
    }
  }
  
  // Add support exercise based on emphasis
  if (secondaryEmphasis !== 'none' && exercises.length < maxExercises) {
    const supportExercise = getSupportExercise(secondaryEmphasis)
    if (supportExercise && !exercises.some(e => e.name === supportExercise.name)) {
      exercises.push(supportExercise)
    }
  }
  
  // Add core work if space allows
  if (exercises.length < maxExercises) {
    const coreExercise = getCoreExercise(primaryGoal)
    exercises.push(coreExercise)
  }
  
  // Trim to max exercises
  const trimmedExercises = exercises.slice(0, maxExercises)
  
  return {
    dayLabel: `Day ${dayNumber}`,
    emphasis,
    exercises: trimmedExercises,
  }
}

// Main program generation function
export function generateProgram(inputs: ProgramInputs): GeneratedProgram {
  const { trainingDaysPerWeek } = inputs
  const days: DayTemplate[] = []
  
  // Generate days based on frequency
  if (trainingDaysPerWeek === 2) {
    // Full body split
    days.push(buildTrainingDay(1, true, inputs))
    days.push(buildTrainingDay(2, false, inputs))
  } else if (trainingDaysPerWeek === 3) {
    // Push / Pull / Mixed
    days.push(buildTrainingDay(1, true, inputs))
    days.push(buildTrainingDay(2, false, inputs))
    days.push(buildTrainingDay(3, true, inputs))
  } else if (trainingDaysPerWeek === 4) {
    // Push / Pull / Push / Pull
    days.push(buildTrainingDay(1, true, inputs))
    days.push(buildTrainingDay(2, false, inputs))
    days.push(buildTrainingDay(3, true, inputs))
    days.push(buildTrainingDay(4, false, inputs))
  } else {
    // 5 days: Push / Pull / Push / Pull / Mixed
    days.push(buildTrainingDay(1, true, inputs))
    days.push(buildTrainingDay(2, false, inputs))
    days.push(buildTrainingDay(3, true, inputs))
    days.push(buildTrainingDay(4, false, inputs))
    days.push(buildTrainingDay(5, true, inputs))
  }
  
  const program: GeneratedProgram = {
    id: `prog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    ...inputs,
    generatedDays: days,
    strengthNote: generateStrengthNote(),
  }
  
  return program
}

// Get all saved programs
export function getSavedPrograms(): GeneratedProgram[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

// Get latest program
export function getLatestProgram(): GeneratedProgram | null {
  const programs = getSavedPrograms()
  if (programs.length === 0) return null
  
  return programs.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0]
}

// Save a program
export function saveProgram(program: GeneratedProgram): GeneratedProgram {
  if (!isBrowser()) return program
  
  const programs = getSavedPrograms()
  programs.push(program)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(programs))
  
  return program
}

// Delete a program
export function deleteProgram(id: string): boolean {
  if (!isBrowser()) return false
  
  const programs = getSavedPrograms()
  const filtered = programs.filter(p => p.id !== id)
  
  if (filtered.length === programs.length) return false
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

// Get default inputs from profile - prioritizes onboarding profile if complete
export function getDefaultInputs(): ProgramInputs {
  if (!isBrowser()) {
    return {
      primaryGoal: 'planche',
      experienceLevel: 'intermediate',
      trainingDaysPerWeek: 4,
      secondaryEmphasis: 'none',
      sessionLength: 45,
    }
  }
  
  // Check onboarding profile first (contains most complete data)
  const onboardingProfile = getOnboardingProfile()
  if (onboardingProfile && isOnboardingComplete()) {
    // Map onboarding data to program inputs
    let primaryGoal: PrimaryGoal = 'planche'
    
    // Use first selected skill as primary goal
    if (onboardingProfile.selectedSkills.length > 0) {
      const firstSkill = onboardingProfile.selectedSkills[0]
if (['planche', 'front_lever', 'back_lever', 'muscle_up', 'handstand_pushup', 'iron_cross'].includes(firstSkill)) {
  primaryGoal = firstSkill as PrimaryGoal
  }
    }
    
    // Map training outcome to primary goal if no skill selected
    if (onboardingProfile.primaryTrainingOutcome === 'strength') {
      primaryGoal = 'weighted_strength'
    } else if (onboardingProfile.primaryTrainingOutcome === 'general_fitness') {
      primaryGoal = 'general'
    }
    
    // Map experience level
    const experienceLevel: ExperienceLevel = 
      onboardingProfile.trainingExperience === 'new' || onboardingProfile.trainingExperience === 'some'
        ? 'beginner'
        : onboardingProfile.trainingExperience === 'intermediate'
          ? 'intermediate'
          : 'advanced'
    
    // Map training days
    const trainingDays = typeof onboardingProfile.trainingDaysPerWeek === 'number'
      ? (onboardingProfile.trainingDaysPerWeek as TrainingDays)
      : 4
    
    // Map session length
    let sessionLength: SessionLength = 45
    if (typeof onboardingProfile.sessionLengthMinutes === 'number') {
      const pref = onboardingProfile.sessionLengthMinutes
      sessionLength = pref <= 30 ? 30 : pref <= 45 ? 45 : pref <= 60 ? 60 : 75
    }
    
    return {
      primaryGoal,
      experienceLevel,
      trainingDaysPerWeek: trainingDays,
      secondaryEmphasis: 'none',
      sessionLength,
    }
  }
  
  // Fall back to athlete profile from data-service
  const profile = getAthleteProfile()
  const progressions = getSkillProgressions()
  
  // Determine primary goal from profile or first tracked skill
  let primaryGoal: PrimaryGoal = 'planche'
  if (profile.primaryGoal && ['planche', 'front_lever', 'back_lever', 'muscle_up', 'handstand_pushup', 'weighted_strength'].includes(profile.primaryGoal)) {
    primaryGoal = profile.primaryGoal as PrimaryGoal
  } else if (progressions.length > 0) {
    const skillName = progressions[0].skillName
if (['planche', 'front_lever', 'back_lever', 'muscle_up', 'handstand_pushup', 'iron_cross'].includes(skillName)) {
  primaryGoal = skillName as PrimaryGoal
  }
  }
  
  // REGRESSION GUARD: Use canonical profile values, avoid silent fallbacks
  // trainingDaysPerWeek fallback to 4 only if profile field is genuinely missing
  // sessionLength fallback to 45 only if profile field is genuinely missing
  return {
    primaryGoal,
    experienceLevel: profile.experienceLevel,
    // Note: These fallbacks are for legacy compatibility - new users go through canonical flow
    trainingDaysPerWeek: (profile.trainingDaysPerWeek as TrainingDays) || 4,
    secondaryEmphasis: 'none',
    sessionLength: profile.sessionLengthMinutes as SessionLength || 45,
  }
}

// Goal labels for display
export const GOAL_LABELS: Record<PrimaryGoal, string> = {
  planche: 'Planche',
  front_lever: 'Front Lever',
  back_lever: 'Back Lever',
  muscle_up: 'Muscle Up',
  handstand_pushup: 'Handstand Pushup',
  iron_cross: 'Iron Cross',
  weighted_strength: 'Weighted Strength',
  general: 'General Fitness',
  skill: 'Skill Development',
  strength: 'Strength',
  endurance: 'Endurance',
  abs: 'Core / Abs',
  pancake: 'Pancake',
  toe_touch: 'Toe Touch',
  front_splits: 'Front Splits',
  side_splits: 'Side Splits',
  flexibility: 'Flexibility',
}

export const EMPHASIS_LABELS: Record<SecondaryEmphasis, string> = {
  pulling_strength: 'Pulling Strength',
  pushing_strength: 'Pushing Strength',
  core_control: 'Core Control',
  skill_technique: 'Skill Technique',
  hypertrophy_support: 'Hypertrophy Support',
  none: 'None',
}

// =============================================================================
// ACTIVE PROGRAM MANAGEMENT
// =============================================================================
// Handles the currently active program for the athlete.
// Used by settings to trigger program regeneration when profile changes.

const ACTIVE_PROGRAM_KEY = 'spartanlab_active_program'

/**
 * Get the currently active program
 * This is the program the athlete is currently following
 */
export function getActiveProgram(): GeneratedProgram | null {
  if (!isBrowser()) return null
  
  const stored = localStorage.getItem(ACTIVE_PROGRAM_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }
  return null
}

/**
 * Set the active program
 * Called when a new program is generated and assigned to the athlete
 */
export function setActiveProgram(program: GeneratedProgram): void {
  if (!isBrowser()) return
  localStorage.setItem(ACTIVE_PROGRAM_KEY, JSON.stringify(program))
}

/**
 * Clear the active program
 * Called when profile changes require program regeneration.
 * This preserves workout history but signals that a new program is needed.
 * The next visit to the program builder will regenerate with new settings.
 */
export function clearActiveProgram(): void {
  if (!isBrowser()) return
  localStorage.removeItem(ACTIVE_PROGRAM_KEY)
}

/**
 * Check if the active program needs regeneration
 * Based on whether clearActiveProgram() was called
 */
export function needsProgramRegeneration(): boolean {
  if (!isBrowser()) return false
  return getActiveProgram() === null && getSavedPrograms().length > 0
}
