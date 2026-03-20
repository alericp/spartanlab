/**
 * Preview Engine
 * Generates lightweight program previews for conversion without full onboarding.
 * Uses real exercise data and mirrors main engine logic in simplified form.
 */

import {
  PLANCHE_EXERCISES,
  FRONT_LEVER_EXERCISES,
  MUSCLE_UP_EXERCISES,
  HSPU_EXERCISES,
  IRON_CROSS_EXERCISES,
  WEIGHTED_STRENGTH_EXERCISES,
  COMPRESSION_EXERCISES,
  CORE_EXERCISES,
  SUPPORT_EXERCISES,
  type ExerciseTemplate,
} from '@/lib/program-templates'

// =============================================================================
// TYPES
// =============================================================================

export type PreviewGoal = 
  | 'planche'
  | 'front_lever'
  | 'muscle_up'
  | 'hspu'
  | 'iron_cross'
  | 'weighted_strength'
  | 'general_strength'
  | 'one_arm_pull_up'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type SessionDuration = 30 | 45 | 60

export type EquipmentLevel = 'basic' | 'weighted' | 'full'

export interface PreviewInput {
  primaryGoal: PreviewGoal
  secondaryGoal?: PreviewGoal
  experienceLevel: ExperienceLevel
  sessionDuration: SessionDuration
  equipment: EquipmentLevel
  pullUps?: number
  dips?: number
}

export interface PreviewExercise {
  name: string
  sets: number
  repsOrTime: string
  category: 'skill' | 'strength' | 'accessory' | 'core'
  note?: string
}

export interface PreviewSession {
  dayNumber: number
  dayLabel: string
  emphasis: string
  duration: string
  exercises: PreviewExercise[]
}

export interface PreviewProgram {
  title: string
  subtitle: string
  weeklyDays: number
  sessionLength: number
  sessions: PreviewSession[]
  focusExplanation: string
  trainingStyle: string
  keyFeatures: string[]
}

// =============================================================================
// GOAL METADATA
// =============================================================================

const GOAL_METADATA: Record<PreviewGoal, {
  label: string
  category: 'push' | 'pull' | 'transition' | 'strength' | 'general'
  emphasis: string
}> = {
  planche: {
    label: 'Planche',
    category: 'push',
    emphasis: 'Straight-arm pushing strength',
  },
  front_lever: {
    label: 'Front Lever',
    category: 'pull',
    emphasis: 'Horizontal pulling power',
  },
  muscle_up: {
    label: 'Muscle-Up',
    category: 'transition',
    emphasis: 'Explosive pull-to-push transition',
  },
  hspu: {
    label: 'Handstand Push-Up',
    category: 'push',
    emphasis: 'Vertical pressing mastery',
  },
  iron_cross: {
    label: 'Iron Cross',
    category: 'push',
    emphasis: 'Ring straight-arm strength',
  },
  weighted_strength: {
    label: 'Weighted Calisthenics',
    category: 'strength',
    emphasis: 'Progressive overload basics',
  },
  general_strength: {
    label: 'General Strength',
    category: 'general',
    emphasis: 'Balanced strength foundation',
  },
  one_arm_pull_up: {
    label: 'One-Arm Pull-Up',
    category: 'pull',
    emphasis: 'Elite unilateral pulling',
  },
}

// =============================================================================
// EXERCISE SELECTION
// =============================================================================

function getExercisesForGoal(goal: PreviewGoal, level: ExperienceLevel): ExerciseTemplate[] {
  const exerciseMap: Record<PreviewGoal, Record<ExperienceLevel, ExerciseTemplate[]>> = {
    planche: PLANCHE_EXERCISES,
    front_lever: FRONT_LEVER_EXERCISES,
    muscle_up: MUSCLE_UP_EXERCISES,
    hspu: HSPU_EXERCISES,
    iron_cross: IRON_CROSS_EXERCISES,
    weighted_strength: WEIGHTED_STRENGTH_EXERCISES,
    general_strength: WEIGHTED_STRENGTH_EXERCISES, // Uses weighted as base
    one_arm_pull_up: {
      beginner: [
        { name: 'Weighted Pull-Ups', sets: 4, repsOrTime: '5-6', category: 'strength' },
        { name: 'Archer Pull-Ups (Assisted)', sets: 3, repsOrTime: '5 each', category: 'skill' },
        { name: 'Scap Pull-Ups', sets: 3, repsOrTime: '10', category: 'accessory' },
      ],
      intermediate: [
        { name: 'Weighted Pull-Ups', sets: 5, repsOrTime: '3-5', note: 'Heavy', category: 'strength' },
        { name: 'Archer Pull-Ups', sets: 4, repsOrTime: '4-5 each', category: 'skill' },
        { name: 'One Arm Hang', sets: 3, repsOrTime: '10-15s each', category: 'skill' },
        { name: 'Uneven Pull-Ups', sets: 3, repsOrTime: '5 each', category: 'strength' },
      ],
      advanced: [
        { name: 'One Arm Pull-Up Negatives', sets: 4, repsOrTime: '2-3 each', note: '5s negative', category: 'skill' },
        { name: 'Weighted Pull-Ups', sets: 4, repsOrTime: '3', note: '+50% BW', category: 'strength' },
        { name: 'One Arm Assisted Pull-Ups', sets: 4, repsOrTime: '3-4 each', category: 'skill' },
        { name: 'Typewriter Pull-Ups', sets: 3, repsOrTime: '4 each', category: 'strength' },
      ],
    },
  }

  return exerciseMap[goal]?.[level] || WEIGHTED_STRENGTH_EXERCISES[level]
}

function getCoreExercises(level: ExperienceLevel): ExerciseTemplate[] {
  if (level === 'beginner') {
    return CORE_EXERCISES.slice(0, 2)
  } else if (level === 'intermediate') {
    return [CORE_EXERCISES[2], CORE_EXERCISES[3]]
  } else {
    return [CORE_EXERCISES[4], CORE_EXERCISES[5]]
  }
}

function getSupportExercises(
  primaryCategory: 'push' | 'pull' | 'transition' | 'strength' | 'general',
  count: number
): ExerciseTemplate[] {
  // Balance with opposite pattern
  if (primaryCategory === 'push') {
    return SUPPORT_EXERCISES.pulling.slice(0, count)
  } else if (primaryCategory === 'pull') {
    return SUPPORT_EXERCISES.pushing.slice(0, count)
  } else {
    return [
      ...SUPPORT_EXERCISES.pulling.slice(0, 1),
      ...SUPPORT_EXERCISES.pushing.slice(0, 1),
    ]
  }
}

// =============================================================================
// WEEKLY STRUCTURE
// =============================================================================

function getWeeklyDays(duration: SessionDuration, level: ExperienceLevel): number {
  if (duration === 30) return level === 'beginner' ? 3 : 4
  if (duration === 45) return level === 'beginner' ? 3 : 4
  return level === 'advanced' ? 5 : 4
}

function generateSessionEmphasis(
  dayNumber: number,
  totalDays: number,
  primaryGoal: PreviewGoal,
  secondaryGoal?: PreviewGoal
): { label: string; emphasis: string; isPrimary: boolean } {
  const primary = GOAL_METADATA[primaryGoal]
  const secondary = secondaryGoal ? GOAL_METADATA[secondaryGoal] : null

  // Standard distribution: 60% primary, 30% secondary, 10% recovery/support
  if (totalDays === 3) {
    if (dayNumber === 1) return { label: `${primary.label} Focus`, emphasis: primary.emphasis, isPrimary: true }
    if (dayNumber === 2) return secondary 
      ? { label: `${secondary.label} Focus`, emphasis: secondary.emphasis, isPrimary: false }
      : { label: 'Strength & Support', emphasis: 'Building foundation', isPrimary: false }
    return { label: 'Mixed Skills', emphasis: 'Balanced work', isPrimary: true }
  }

  if (totalDays === 4) {
    if (dayNumber === 1) return { label: `${primary.label} Focus`, emphasis: primary.emphasis, isPrimary: true }
    if (dayNumber === 2) return secondary 
      ? { label: `${secondary.label} Focus`, emphasis: secondary.emphasis, isPrimary: false }
      : { label: 'Strength Work', emphasis: 'Progressive overload', isPrimary: false }
    if (dayNumber === 3) return { label: `${primary.label} Volume`, emphasis: 'Skill repetition', isPrimary: true }
    return { label: 'Recovery + Core', emphasis: 'Active recovery', isPrimary: false }
  }

  // 5-day
  if (dayNumber === 1) return { label: `${primary.label} Intensity`, emphasis: primary.emphasis, isPrimary: true }
  if (dayNumber === 2) return secondary 
    ? { label: `${secondary.label} Focus`, emphasis: secondary.emphasis, isPrimary: false }
    : { label: 'Push Strength', emphasis: 'Heavy pushing', isPrimary: false }
  if (dayNumber === 3) return { label: 'Pull Strength', emphasis: 'Heavy pulling', isPrimary: false }
  if (dayNumber === 4) return { label: `${primary.label} Volume`, emphasis: 'Skill repetition', isPrimary: true }
  return { label: 'Core & Mobility', emphasis: 'Recovery focus', isPrimary: false }
}

// =============================================================================
// MAIN PREVIEW GENERATOR
// =============================================================================

export function generatePreviewProgram(input: PreviewInput): PreviewProgram {
  const {
    primaryGoal,
    secondaryGoal,
    experienceLevel,
    sessionDuration,
    equipment,
  } = input

  const primaryMeta = GOAL_METADATA[primaryGoal]
  const secondaryMeta = secondaryGoal ? GOAL_METADATA[secondaryGoal] : null
  const weeklyDays = getWeeklyDays(sessionDuration, experienceLevel)

  // Calculate exercise counts based on duration
  const exerciseCount = sessionDuration === 30 ? 4 : sessionDuration === 45 ? 5 : 6

  // Generate sessions
  const sessions: PreviewSession[] = []

  for (let day = 1; day <= weeklyDays; day++) {
    const sessionInfo = generateSessionEmphasis(day, weeklyDays, primaryGoal, secondaryGoal)
    const exercises: PreviewExercise[] = []

    // Get primary exercises based on session focus
    const goalForSession = sessionInfo.isPrimary ? primaryGoal : (secondaryGoal || primaryGoal)
    const goalExercises = getExercisesForGoal(goalForSession, experienceLevel)

    // Add skill/main exercises
    exercises.push(...goalExercises.slice(0, Math.ceil(exerciseCount * 0.5)).map(e => ({
      name: e.name,
      sets: e.sets,
      repsOrTime: e.repsOrTime,
      category: e.category,
      note: e.note,
    })))

    // Add support work
    const supportCount = Math.floor(exerciseCount * 0.3)
    const support = getSupportExercises(GOAL_METADATA[goalForSession].category, supportCount)
    exercises.push(...support.map(e => ({
      name: e.name,
      sets: e.sets,
      repsOrTime: e.repsOrTime,
      category: e.category,
    })))

    // Add core work
    const coreExercises = getCoreExercises(experienceLevel)
    if (exercises.length < exerciseCount) {
      exercises.push({
        ...coreExercises[0],
      })
    }

    sessions.push({
      dayNumber: day,
      dayLabel: `Day ${day}`,
      emphasis: sessionInfo.label,
      duration: `~${sessionDuration} min`,
      exercises: exercises.slice(0, exerciseCount),
    })
  }

  // Build focus explanation
  const focusExplanation = secondaryMeta
    ? `This plan prioritizes ${primaryMeta.label} development while supporting ${secondaryMeta.label} progress. Training alternates between primary skill work and secondary development, with balanced recovery.`
    : `This plan focuses on ${primaryMeta.label} with progressive skill and strength work. Sessions build ${primaryMeta.emphasis.toLowerCase()} through proven progressions and support exercises.`

  // Determine training style
  const trainingStyle = primaryMeta.category === 'push' || primaryMeta.category === 'pull'
    ? 'Skill-Focused Periodization'
    : primaryMeta.category === 'transition'
    ? 'Explosive Power Development'
    : 'Strength-Biased Programming'

  // Key features based on inputs
  const keyFeatures = [
    `${weeklyDays} sessions per week`,
    `~${sessionDuration} minutes per session`,
    secondaryMeta ? `${primaryMeta.label} + ${secondaryMeta.label} hybrid` : `${primaryMeta.label} specialization`,
    equipment === 'full' ? 'Rings & weighted equipment' : equipment === 'weighted' ? 'Weighted progressions' : 'Bodyweight focus',
  ]

  return {
    title: `${primaryMeta.label}-Focused Program`,
    subtitle: secondaryMeta 
      ? `with ${secondaryMeta.label} Support`
      : `${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)} Level`,
    weeklyDays,
    sessionLength: sessionDuration,
    sessions,
    focusExplanation,
    trainingStyle,
    keyFeatures,
  }
}

// =============================================================================
// GOAL OPTIONS FOR UI
// =============================================================================

export const PREVIEW_GOAL_OPTIONS: { value: PreviewGoal; label: string; description: string }[] = [
  { value: 'planche', label: 'Planche', description: 'Horizontal pushing mastery' },
  { value: 'front_lever', label: 'Front Lever', description: 'Horizontal pulling strength' },
  { value: 'muscle_up', label: 'Muscle-Up', description: 'Explosive transition skill' },
  { value: 'hspu', label: 'Handstand Push-Up', description: 'Vertical pressing power' },
  { value: 'weighted_strength', label: 'Weighted Calisthenics', description: 'Build raw strength' },
  { value: 'one_arm_pull_up', label: 'One-Arm Pull-Up', description: 'Elite pulling strength' },
  { value: 'iron_cross', label: 'Iron Cross', description: 'Ring straight-arm skill' },
  { value: 'general_strength', label: 'General Strength', description: 'Balanced foundation' },
]

export const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'New to structured training' },
  { value: 'intermediate', label: 'Intermediate', description: '6+ months consistent training' },
  { value: 'advanced', label: 'Advanced', description: '2+ years, solid basics' },
]

export const DURATION_OPTIONS: { value: SessionDuration; label: string }[] = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
]

export const EQUIPMENT_OPTIONS: { value: EquipmentLevel; label: string; description: string }[] = [
  { value: 'basic', label: 'Basic', description: 'Pull-up bar, dip station' },
  { value: 'weighted', label: 'Weighted', description: '+ Dip belt, weight plates' },
  { value: 'full', label: 'Full', description: '+ Rings, parallettes' },
]
