// Program Builder service layer for preview mode
// Uses localStorage for persistence, easy to swap to Prisma later

import {
  PLANCHE_EXERCISES,
  FRONT_LEVER_EXERCISES,
  MUSCLE_UP_EXERCISES,
  HSPU_EXERCISES,
  WEIGHTED_STRENGTH_EXERCISES,
  CORE_EXERCISES,
  SUPPORT_EXERCISES,
  type ExerciseTemplate,
  type DayTemplate,
} from './program-templates'
import { getSkillProgressions, getAthleteProfile } from './data-service'
import { getLatestRecords } from './strength-service'

export type PrimaryGoal = 'planche' | 'front_lever' | 'muscle_up' | 'handstand_pushup' | 'weighted_strength' | 'general' | 'skill' | 'strength' | 'endurance' | 'abs'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type SecondaryEmphasis = 'pulling_strength' | 'pushing_strength' | 'core_control' | 'skill_technique' | 'hypertrophy_support' | 'none'
export type SessionLength = 30 | 45 | 60 | 75 | '10-20' | '20-30' | '30-45' | '45-60' | '60+'
export type TrainingDays = 2 | 3 | 4 | 5

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
  const exerciseMap = {
    planche: PLANCHE_EXERCISES,
    front_lever: FRONT_LEVER_EXERCISES,
    muscle_up: MUSCLE_UP_EXERCISES,
    handstand_pushup: HSPU_EXERCISES,
    weighted_strength: WEIGHTED_STRENGTH_EXERCISES,
  }
  
  return exerciseMap[goal][level] || exerciseMap[goal].intermediate
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
  
  if (primaryGoal === 'planche' || primaryGoal === 'handstand_pushup') {
    // Push-focused goal
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

// Get default inputs from profile
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
  
  const profile = getAthleteProfile()
  const progressions = getSkillProgressions()
  
  // Determine primary goal from profile or first tracked skill
  let primaryGoal: PrimaryGoal = 'planche'
  if (profile.primaryGoal && ['planche', 'front_lever', 'muscle_up', 'handstand_pushup', 'weighted_strength'].includes(profile.primaryGoal)) {
    primaryGoal = profile.primaryGoal as PrimaryGoal
  } else if (progressions.length > 0) {
    const skillName = progressions[0].skillName
    if (['planche', 'front_lever', 'muscle_up', 'handstand_pushup'].includes(skillName)) {
      primaryGoal = skillName as PrimaryGoal
    }
  }
  
  return {
    primaryGoal,
    experienceLevel: profile.experienceLevel,
    trainingDaysPerWeek: (profile.trainingDaysPerWeek as TrainingDays) || 4,
    secondaryEmphasis: 'none',
    sessionLength: 45,
  }
}

// Goal labels for display
export const GOAL_LABELS: Record<PrimaryGoal, string> = {
  planche: 'Planche',
  front_lever: 'Front Lever',
  muscle_up: 'Muscle Up',
  handstand_pushup: 'Handstand Pushup',
  weighted_strength: 'Weighted Strength',
  general: 'General Fitness',
  skill: 'Skill Development',
  strength: 'Strength',
  endurance: 'Endurance',
  abs: 'Core / Abs',
}

export const EMPHASIS_LABELS: Record<SecondaryEmphasis, string> = {
  pulling_strength: 'Pulling Strength',
  pushing_strength: 'Pushing Strength',
  core_control: 'Core Control',
  skill_technique: 'Skill Technique',
  hypertrophy_support: 'Hypertrophy Support',
  none: 'None',
}
