// Exercise templates and definitions for program generation

export interface ExerciseTemplate {
  name: string
  sets: number
  repsOrTime: string
  note?: string
  category: 'skill' | 'strength' | 'accessory' | 'core'
}

export interface DayTemplate {
  dayLabel: string
  emphasis: string
  exercises: ExerciseTemplate[]
}

// Planche exercises by level
export const PLANCHE_EXERCISES = {
  beginner: [
    { name: 'Planche Leans', sets: 3, repsOrTime: '15s', category: 'skill' as const },
    { name: 'Pseudo Planche Push-Ups', sets: 3, repsOrTime: '6-8', category: 'strength' as const },
    { name: 'Straight Arm Plank Hold', sets: 3, repsOrTime: '20s', category: 'accessory' as const },
  ],
  intermediate: [
    { name: 'Tuck Planche Hold', sets: 4, repsOrTime: '8-12s', category: 'skill' as const },
    { name: 'Planche Leans', sets: 3, repsOrTime: '20s', category: 'skill' as const },
    { name: 'Pseudo Planche Push-Ups', sets: 4, repsOrTime: '6-8', category: 'strength' as const },
    { name: 'Dips', sets: 3, repsOrTime: '8-10', category: 'strength' as const },
  ],
  advanced: [
    { name: 'Adv Tuck Planche Hold', sets: 4, repsOrTime: '10-15s', category: 'skill' as const },
    { name: 'Tuck Planche Push-Ups', sets: 4, repsOrTime: '4-6', category: 'strength' as const },
    { name: 'Weighted Dips', sets: 4, repsOrTime: '5', note: 'Heavy', category: 'strength' as const },
    { name: 'Planche Leans (Extended)', sets: 3, repsOrTime: '25s', category: 'accessory' as const },
  ],
}

// Front Lever exercises by level
export const FRONT_LEVER_EXERCISES = {
  beginner: [
    { name: 'Tuck Front Lever Hold', sets: 3, repsOrTime: '10s', category: 'skill' as const },
    { name: 'Active Hang', sets: 3, repsOrTime: '20s', category: 'accessory' as const },
    { name: 'Bodyweight Rows', sets: 3, repsOrTime: '10-12', category: 'strength' as const },
  ],
  intermediate: [
    { name: 'Adv Tuck Front Lever Hold', sets: 4, repsOrTime: '8-12s', category: 'skill' as const },
    { name: 'Tuck FL Raises', sets: 3, repsOrTime: '6-8', category: 'strength' as const },
    { name: 'Weighted Pull-Ups', sets: 4, repsOrTime: '5-6', category: 'strength' as const },
    { name: 'Scap Pull-Ups', sets: 3, repsOrTime: '10', category: 'accessory' as const },
  ],
  advanced: [
    { name: 'One Leg Front Lever Hold', sets: 4, repsOrTime: '6-10s', category: 'skill' as const },
    { name: 'Adv Tuck FL Raises', sets: 4, repsOrTime: '5-6', category: 'strength' as const },
    { name: 'Weighted Pull-Ups', sets: 4, repsOrTime: '4-5', note: 'Heavy', category: 'strength' as const },
    { name: 'Front Lever Rows (Tuck)', sets: 3, repsOrTime: '6-8', category: 'strength' as const },
  ],
}

// Muscle Up exercises by level
export const MUSCLE_UP_EXERCISES = {
  beginner: [
    { name: 'Explosive Pull-Ups', sets: 3, repsOrTime: '5-6', category: 'skill' as const },
    { name: 'Straight Bar Dip Support', sets: 3, repsOrTime: '15s', category: 'accessory' as const },
    { name: 'Pull-Ups', sets: 3, repsOrTime: '8-10', category: 'strength' as const },
  ],
  intermediate: [
    { name: 'High Pull-Ups', sets: 4, repsOrTime: '5-6', category: 'skill' as const },
    { name: 'Muscle Up Negatives', sets: 3, repsOrTime: '3-4', category: 'skill' as const },
    { name: 'Weighted Pull-Ups', sets: 4, repsOrTime: '5-6', category: 'strength' as const },
    { name: 'Straight Bar Dips', sets: 3, repsOrTime: '6-8', category: 'strength' as const },
  ],
  advanced: [
    { name: 'Strict Muscle Ups', sets: 4, repsOrTime: '3-5', category: 'skill' as const },
    { name: 'Weighted Pull-Ups', sets: 4, repsOrTime: '4-5', note: 'Heavy', category: 'strength' as const },
    { name: 'Weighted Dips', sets: 4, repsOrTime: '5-6', category: 'strength' as const },
    { name: 'Transition Work', sets: 3, repsOrTime: '5', note: 'Focus on pull-to-push', category: 'accessory' as const },
  ],
}

// Handstand Pushup exercises by level
export const HSPU_EXERCISES = {
  beginner: [
    { name: 'Wall Handstand Hold', sets: 3, repsOrTime: '20-30s', category: 'skill' as const },
    { name: 'Pike Push-Ups', sets: 3, repsOrTime: '8-10', category: 'strength' as const },
    { name: 'Box Pike Push-Ups', sets: 3, repsOrTime: '6-8', category: 'strength' as const },
  ],
  intermediate: [
    { name: 'Wall HSPU (Partial)', sets: 4, repsOrTime: '5-6', category: 'skill' as const },
    { name: 'Pike Push-Ups (Elevated)', sets: 4, repsOrTime: '8-10', category: 'strength' as const },
    { name: 'Wall Handstand Hold', sets: 3, repsOrTime: '45s', category: 'accessory' as const },
    { name: 'Shoulder Taps', sets: 3, repsOrTime: '10 each', category: 'accessory' as const },
  ],
  advanced: [
    { name: 'Wall HSPU (Full ROM)', sets: 4, repsOrTime: '4-6', category: 'skill' as const },
    { name: 'Deficit HSPU', sets: 3, repsOrTime: '3-5', category: 'strength' as const },
    { name: 'Freestanding Handstand', sets: 4, repsOrTime: '20-30s', category: 'skill' as const },
    { name: 'Pike Press Work', sets: 3, repsOrTime: '3-4', category: 'accessory' as const },
  ],
}

// Iron Cross exercises by level (rings skill)
export const IRON_CROSS_EXERCISES = {
  beginner: [
    { name: 'Ring Support Hold', sets: 3, repsOrTime: '20-30s', category: 'skill' as const },
    { name: 'Ring Turned Out Support', sets: 3, repsOrTime: '15-20s', note: 'RTO focus', category: 'skill' as const },
    { name: 'Wide Ring Support', sets: 3, repsOrTime: '15s', note: 'Lowered rings', category: 'skill' as const },
    { name: 'Ring Dips', sets: 3, repsOrTime: '6-8', category: 'strength' as const },
  ],
  intermediate: [
    { name: 'Cross Pulls (Assisted)', sets: 4, repsOrTime: '5-6', note: 'Band or pulley assist', category: 'skill' as const },
    { name: 'Cross Eccentrics', sets: 3, repsOrTime: '3-4', note: '5s negative', category: 'skill' as const },
    { name: 'Wide Ring Push-Ups', sets: 4, repsOrTime: '8-10', category: 'strength' as const },
    { name: 'Bent Arm Cross Hold', sets: 3, repsOrTime: '8-12s', note: '45° arm angle', category: 'skill' as const },
  ],
  advanced: [
    { name: 'Iron Cross Hold', sets: 4, repsOrTime: '3-5s', category: 'skill' as const },
    { name: 'Cross Pulls (Minimal Assist)', sets: 4, repsOrTime: '3-4', category: 'skill' as const },
    { name: 'Cross to L-Sit', sets: 3, repsOrTime: '2-3', category: 'skill' as const },
    { name: 'Archer Ring Dips', sets: 3, repsOrTime: '4-6 each', category: 'strength' as const },
  ],
}

// Weighted Strength exercises
export const WEIGHTED_STRENGTH_EXERCISES = {
  beginner: [
    { name: 'Weighted Pull-Ups', sets: 3, repsOrTime: '6-8', note: 'Light weight', category: 'strength' as const },
    { name: 'Weighted Dips', sets: 3, repsOrTime: '6-8', note: 'Light weight', category: 'strength' as const },
    { name: 'Bodyweight Rows', sets: 3, repsOrTime: '10-12', category: 'accessory' as const },
  ],
  intermediate: [
    { name: 'Weighted Pull-Ups', sets: 4, repsOrTime: '5-6', category: 'strength' as const },
    { name: 'Weighted Dips', sets: 4, repsOrTime: '5-6', category: 'strength' as const },
    { name: 'Pull-Ups', sets: 3, repsOrTime: '8-10', note: 'Volume work', category: 'accessory' as const },
    { name: 'Dips', sets: 3, repsOrTime: '10-12', note: 'Volume work', category: 'accessory' as const },
  ],
  advanced: [
    { name: 'Weighted Pull-Ups', sets: 5, repsOrTime: '3-5', note: 'Heavy singles/doubles', category: 'strength' as const },
    { name: 'Weighted Dips', sets: 5, repsOrTime: '3-5', note: 'Heavy singles/doubles', category: 'strength' as const },
    { name: 'Weighted Muscle Ups', sets: 3, repsOrTime: '3-4', category: 'strength' as const },
    { name: 'Pause Reps', sets: 3, repsOrTime: '5', note: '2s pause at bottom', category: 'accessory' as const },
  ],
}

// Core exercises
export const CORE_EXERCISES = [
  { name: 'Hollow Body Hold', sets: 3, repsOrTime: '20-30s', category: 'core' as const },
  { name: 'L-Sit Hold', sets: 3, repsOrTime: '10-15s', category: 'core' as const },
  { name: 'Hanging Knee Raises', sets: 3, repsOrTime: '12-15', category: 'core' as const },
  { name: 'Hanging Leg Raises', sets: 3, repsOrTime: '8-10', category: 'core' as const },
  { name: 'Dragon Flag Negatives', sets: 3, repsOrTime: '5-6', category: 'core' as const },
  { name: 'Ab Wheel Rollouts', sets: 3, repsOrTime: '8-10', category: 'core' as const },
  { name: 'Arch Body Hold', sets: 3, repsOrTime: '20s', category: 'core' as const },
  { name: 'Compression Work', sets: 3, repsOrTime: '10', category: 'core' as const },
]

// Compression skill exercises (L-sit, V-sit, I-sit pathway)
export const COMPRESSION_EXERCISES = {
  beginner: [
    { name: 'Tucked L-Sit Hold', sets: 3, repsOrTime: '10-15s', category: 'skill' as const },
    { name: 'Compression Pulses', sets: 3, repsOrTime: '10', note: 'Seated, lift legs', category: 'core' as const },
    { name: 'Hanging Knee Raises', sets: 3, repsOrTime: '12', category: 'core' as const },
    { name: 'Pike Stretch', sets: 2, repsOrTime: '30s', category: 'accessory' as const },
  ],
  intermediate: [
    { name: 'L-Sit Hold', sets: 4, repsOrTime: '15-20s', category: 'skill' as const },
    { name: 'Straddle L-Sit Hold', sets: 3, repsOrTime: '10-15s', category: 'skill' as const },
    { name: 'Hanging Leg Raises (Straight)', sets: 3, repsOrTime: '10', category: 'core' as const },
    { name: 'Seated Leg Lifts', sets: 3, repsOrTime: '8 each', category: 'core' as const },
  ],
  advanced: [
    { name: 'V-Sit Hold', sets: 4, repsOrTime: '8-12s', category: 'skill' as const },
    { name: 'L-Sit to V-Sit', sets: 3, repsOrTime: '5', category: 'skill' as const },
    { name: 'Elevated L-Sit Hold', sets: 3, repsOrTime: '20s', category: 'skill' as const },
    { name: 'Manna Progressions', sets: 3, repsOrTime: '5-8s', note: 'Early I-sit work', category: 'skill' as const },
  ],
}

// Endurance finisher templates
export const ENDURANCE_FINISHERS = {
  ab_finisher: [
    { name: 'Hollow Hold', sets: 1, repsOrTime: '30s', category: 'core' as const },
    { name: 'Crunches', sets: 1, repsOrTime: '20', category: 'core' as const },
    { name: 'Leg Raises', sets: 1, repsOrTime: '15', category: 'core' as const },
    { name: 'Plank', sets: 1, repsOrTime: '30s', category: 'core' as const },
  ],
  density_block: [
    { name: 'Push-Ups', sets: 1, repsOrTime: 'AMRAP', note: '2 min', category: 'accessory' as const },
    { name: 'Bodyweight Rows', sets: 1, repsOrTime: 'AMRAP', note: '2 min', category: 'accessory' as const },
    { name: 'Air Squats', sets: 1, repsOrTime: 'AMRAP', note: '2 min', category: 'accessory' as const },
  ],
  circuit: [
    { name: 'Burpees', sets: 1, repsOrTime: '10', category: 'accessory' as const },
    { name: 'Mountain Climbers', sets: 1, repsOrTime: '20', category: 'core' as const },
    { name: 'Jump Squats', sets: 1, repsOrTime: '15', category: 'accessory' as const },
  ],
}

// Support/accessory exercises
export const SUPPORT_EXERCISES = {
  pulling: [
    { name: 'Bodyweight Rows', sets: 3, repsOrTime: '10-12', category: 'accessory' as const },
    { name: 'Scap Pull-Ups', sets: 3, repsOrTime: '10', category: 'accessory' as const },
    { name: 'Face Pulls', sets: 3, repsOrTime: '15', category: 'accessory' as const },
    { name: 'Ring Rows', sets: 3, repsOrTime: '10-12', category: 'accessory' as const },
  ],
  pushing: [
    { name: 'Push-Ups', sets: 3, repsOrTime: '15-20', category: 'accessory' as const },
    { name: 'Diamond Push-Ups', sets: 3, repsOrTime: '10-12', category: 'accessory' as const },
    { name: 'Dips', sets: 3, repsOrTime: '10-12', category: 'accessory' as const },
    { name: 'Archer Push-Ups', sets: 3, repsOrTime: '8 each', category: 'accessory' as const },
  ],
  hypertrophy: [
    { name: 'Pull-Ups', sets: 3, repsOrTime: '10-12', note: 'Controlled tempo', category: 'accessory' as const },
    { name: 'Dips', sets: 3, repsOrTime: '12-15', note: 'Controlled tempo', category: 'accessory' as const },
    { name: 'Ring Push-Ups', sets: 3, repsOrTime: '12-15', category: 'accessory' as const },
    { name: 'Australian Pull-Ups', sets: 3, repsOrTime: '15', category: 'accessory' as const },
  ],
}
