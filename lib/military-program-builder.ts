/**
 * Military Program Builder
 * 
 * Generates test-specific training programs based on military fitness test requirements.
 * Adapts programming to user's current benchmarks, goal priority, and available equipment.
 */

import {
  type MilitaryProfile,
  type MilitaryTest,
  type MilitaryGoalPriority,
  type PhysicalQuality,
  TEST_CONFIGS,
  TEST_LABELS,
} from './military-test-config'

// =============================================================================
// TYPES
// =============================================================================

export type MilitaryProgramCategory = 
  | 'event_specific'      // Direct test event practice
  | 'strength_support'    // Foundational strength for events
  | 'run_development'     // Running/cardio specific work
  | 'work_capacity'       // Conditioning and density
  | 'core_trunk'          // Core and trunk endurance
  | 'mobility'            // Recovery and flexibility
  | 'test_simulation'     // Full or partial test runs

export interface MilitaryExercise {
  name: string
  sets: number | string
  reps: string
  rest?: string
  notes?: string
  category: MilitaryProgramCategory
  targetEvent?: string  // Which test event this supports
  targetQuality?: PhysicalQuality
}

export interface MilitaryProgramBlock {
  title: string
  category: MilitaryProgramCategory
  exercises: MilitaryExercise[]
  duration?: string
  rationale: string
}

export interface MilitaryDayPlan {
  dayNumber: number
  focus: string
  warmup: string[]
  blocks: MilitaryProgramBlock[]
  cooldown: string[]
  totalTime: string
}

export interface MilitaryWeekPlan {
  weekNumber: number
  phase: 'foundation' | 'build' | 'peak' | 'taper'
  emphasis: string
  days: MilitaryDayPlan[]
}

export interface MilitaryProgram {
  testId: MilitaryTest
  testName: string
  programName: string
  programDescription: string
  totalWeeks: number
  daysPerWeek: number
  currentWeek: MilitaryWeekPlan
  weakPoints: string[]
  keyFocus: string[]
  progressionNotes: string
}

// =============================================================================
// EXERCISE POOLS
// =============================================================================

const PULL_UP_EXERCISES: MilitaryExercise[] = [
  // Foundation
  { name: 'Band-Assisted Pull-Ups', sets: 3, reps: '8-10', category: 'strength_support', targetQuality: 'pull_endurance' },
  { name: 'Negative Pull-Ups', sets: 3, reps: '5-8 (5s descent)', category: 'strength_support', targetQuality: 'pull_endurance' },
  { name: 'Flexed Arm Hang', sets: 3, reps: '15-30s', category: 'strength_support', targetQuality: 'pull_endurance' },
  // Density/Volume
  { name: 'Pull-Up Ladders (1-2-3)', sets: '3-5 rounds', reps: 'ladder', rest: 'as needed', category: 'event_specific', targetQuality: 'pull_endurance' },
  { name: 'EMOM Pull-Ups', sets: '10 min', reps: '2-4/min', category: 'event_specific', targetQuality: 'pull_endurance' },
  { name: 'Grease the Groove Pull-Ups', sets: '5-8x/day', reps: '40-50% max', category: 'event_specific', targetQuality: 'pull_endurance' },
  // Max Reps
  { name: 'High-Rep Pull-Up Sets', sets: 3, reps: 'near max', rest: '3-4 min', category: 'event_specific', targetQuality: 'pull_endurance' },
  { name: 'Rest-Pause Pull-Ups', sets: 1, reps: 'max + clusters', category: 'event_specific', targetQuality: 'pull_endurance' },
  { name: 'Weighted Pull-Ups', sets: 4, reps: '5-6', category: 'strength_support', targetQuality: 'upper_body_strength' },
]

const PUSH_UP_EXERCISES: MilitaryExercise[] = [
  // Foundation
  { name: 'Incline Push-Ups', sets: 3, reps: '15-20', category: 'strength_support', targetQuality: 'push_endurance' },
  { name: 'Standard Push-Ups', sets: 3, reps: '10-15', category: 'strength_support', targetQuality: 'push_endurance' },
  // Density/Volume
  { name: 'Push-Up Pyramids', sets: '1-10-1', reps: 'pyramid', category: 'event_specific', targetQuality: 'push_endurance' },
  { name: 'EMOM Push-Ups', sets: '10 min', reps: '10-15/min', category: 'event_specific', targetQuality: 'push_endurance' },
  { name: '2-Minute Push-Up Test Practice', sets: 1, reps: 'timed 2 min', rest: 'N/A', category: 'test_simulation', targetQuality: 'push_endurance' },
  // Max Reps
  { name: 'High-Rep Push-Up Sets', sets: 3, reps: '30-50', rest: '2-3 min', category: 'event_specific', targetQuality: 'push_endurance' },
  { name: 'Hand-Release Push-Ups', sets: 3, reps: '15-25', category: 'event_specific', notes: 'ACFT-specific', targetQuality: 'push_endurance' },
  { name: 'Diamond Push-Ups', sets: 3, reps: '10-15', category: 'strength_support', targetQuality: 'push_endurance' },
]

const PLANK_EXERCISES: MilitaryExercise[] = [
  // Foundation
  { name: 'Forearm Plank Hold', sets: 3, reps: '30-45s', category: 'core_trunk', targetQuality: 'trunk_endurance' },
  { name: 'High Plank Hold', sets: 3, reps: '30-45s', category: 'core_trunk', targetQuality: 'trunk_endurance' },
  // Progression
  { name: 'Extended Plank Hold', sets: 3, reps: '60-90s', category: 'event_specific', targetQuality: 'trunk_endurance' },
  { name: 'Plank to Max Hold', sets: 1, reps: 'max time', category: 'test_simulation', targetQuality: 'trunk_endurance' },
  // Variation
  { name: 'Plank with Shoulder Taps', sets: 3, reps: '20 taps', category: 'core_trunk', targetQuality: 'trunk_endurance' },
  { name: 'Dead Bug', sets: 3, reps: '12-15/side', category: 'core_trunk', targetQuality: 'trunk_endurance' },
  { name: 'Hollow Body Hold', sets: 3, reps: '20-30s', category: 'core_trunk', targetQuality: 'trunk_endurance' },
]

const RUN_EXERCISES: MilitaryExercise[] = [
  // Foundation
  { name: 'Easy Run', sets: 1, reps: '20-30 min', notes: 'conversational pace', category: 'run_development', targetQuality: 'run_endurance' },
  { name: 'Run/Walk Intervals', sets: 1, reps: '20-30 min', notes: '2:1 run:walk', category: 'run_development', targetQuality: 'run_endurance' },
  // Speed Work
  { name: '400m Repeats', sets: '4-6', reps: '400m @ goal pace', rest: '90s', category: 'run_development', targetQuality: 'run_endurance' },
  { name: '800m Repeats', sets: '3-4', reps: '800m @ goal pace', rest: '2-3 min', category: 'run_development', targetQuality: 'run_endurance' },
  { name: 'Mile Repeats', sets: '2-3', reps: '1 mile @ tempo', rest: '3-4 min', category: 'run_development', targetQuality: 'run_endurance' },
  // Test Specific
  { name: '1.5-Mile Time Trial', sets: 1, reps: 'full distance', category: 'test_simulation', targetQuality: 'run_endurance' },
  { name: '2-Mile Time Trial', sets: 1, reps: 'full distance', category: 'test_simulation', targetQuality: 'run_endurance' },
  { name: '3-Mile Time Trial', sets: 1, reps: 'full distance', category: 'test_simulation', targetQuality: 'run_endurance' },
  // Sprint Work
  { name: '100m Sprints', sets: '6-8', reps: '100m', rest: '60s', category: 'work_capacity', targetQuality: 'sprint_power' },
  { name: '200m Sprints', sets: '4-6', reps: '200m', rest: '90s', category: 'work_capacity', targetQuality: 'sprint_power' },
]

const CFT_EXERCISES: MilitaryExercise[] = [
  // Movement to Contact
  { name: '880-Yard Sprint Practice', sets: 1, reps: 'full distance', category: 'test_simulation', targetQuality: 'sprint_power' },
  { name: '400m Sprint Repeats', sets: '2-4', reps: '400m', rest: '2 min', category: 'event_specific', targetQuality: 'sprint_power' },
  // Ammo Lift
  { name: 'Ammo Can Press', sets: 3, reps: '30-40', rest: '90s', category: 'event_specific', targetQuality: 'upper_body_strength' },
  { name: 'DB/KB Shoulder Press AMRAP', sets: 1, reps: '2 min max', category: 'test_simulation', targetQuality: 'upper_body_strength' },
  { name: 'Push Press', sets: 4, reps: '10-12', category: 'strength_support', targetQuality: 'upper_body_strength' },
  // Maneuver Under Fire Components
  { name: 'Fireman Carry Practice', sets: '3-4', reps: '50m', category: 'event_specific', targetQuality: 'carry_capacity' },
  { name: 'Low Crawl', sets: 3, reps: '25m', category: 'event_specific', targetQuality: 'work_capacity' },
  { name: 'Buddy Drag', sets: '3-4', reps: '50m', category: 'event_specific', targetQuality: 'carry_capacity' },
  { name: 'Grenade Throw Practice', sets: 3, reps: '5-10 throws', category: 'event_specific', targetQuality: 'lower_body_power' },
]

const ACFT_EXERCISES: MilitaryExercise[] = [
  // Deadlift
  { name: 'Trap Bar Deadlift', sets: 4, reps: '5', category: 'strength_support', targetQuality: 'lower_body_power' },
  { name: 'Romanian Deadlift', sets: 3, reps: '8-10', category: 'strength_support', targetQuality: 'lower_body_power' },
  { name: 'Hip Hinge Pattern Work', sets: 3, reps: '10', category: 'strength_support', targetQuality: 'lower_body_power' },
  // Standing Power Throw
  { name: 'Med Ball Backward Throw', sets: '5-8', reps: '3-5', category: 'event_specific', targetQuality: 'lower_body_power' },
  { name: 'Broad Jumps', sets: 4, reps: '5', category: 'strength_support', targetQuality: 'lower_body_power' },
  { name: 'Box Jumps', sets: 3, reps: '5-8', category: 'strength_support', targetQuality: 'lower_body_power' },
  // Sprint-Drag-Carry
  { name: 'Sprint-Drag-Carry Practice', sets: 1, reps: 'full event', category: 'test_simulation', targetQuality: 'work_capacity' },
  { name: 'Sled Drag', sets: '4-6', reps: '50m', category: 'event_specific', targetQuality: 'carry_capacity' },
  { name: 'Farmer Carries', sets: '3-4', reps: '50m', category: 'event_specific', targetQuality: 'carry_capacity' },
  { name: 'Lateral Shuffle', sets: '4-6', reps: '50m', category: 'event_specific', targetQuality: 'agility' },
  // Leg Tuck
  { name: 'Hanging Knee Raise', sets: 3, reps: '10-15', category: 'core_trunk', targetQuality: 'trunk_endurance' },
  { name: 'Leg Tuck Practice', sets: 3, reps: '5-10', category: 'event_specific', targetQuality: 'trunk_endurance' },
  { name: 'Toes to Bar Progression', sets: 3, reps: '5-8', category: 'event_specific', targetQuality: 'trunk_endurance' },
]

const WARMUP_EXERCISES = [
  'Light jog or jump rope (3-5 min)',
  'Arm circles (forward/backward)',
  'Leg swings (front/side)',
  'Hip circles',
  'Walking lunges',
  'Inchworms',
  'High knees',
  'Butt kicks',
  'Dynamic stretching',
]

const COOLDOWN_EXERCISES = [
  'Light walking (3-5 min)',
  'Static stretching (major muscle groups)',
  'Hip flexor stretch',
  'Hamstring stretch',
  'Shoulder stretch',
  'Deep breathing',
  'Foam rolling (if available)',
]

// =============================================================================
// PROGRAM GENERATION
// =============================================================================

export function generateMilitaryProgram(
  profile: MilitaryProfile,
  trainingDaysPerWeek: number,
  weekNumber: number = 1
): MilitaryProgram | null {
  if (!profile.targetTest || !profile.branch) {
    return null
  }

  const testConfig = TEST_CONFIGS[profile.targetTest]
  const weakPoints = analyzeWeakPoints(profile)
  const phase = determinePhase(profile, weekNumber)
  const emphasis = determineEmphasis(profile, weakPoints)

  const currentWeek: MilitaryWeekPlan = {
    weekNumber,
    phase,
    emphasis: emphasis.join(', '),
    days: generateWeekDays(profile, trainingDaysPerWeek, phase, weakPoints),
  }

  return {
    testId: profile.targetTest,
    testName: testConfig.testName,
    programName: `${TEST_LABELS[profile.targetTest]} Prep Program`,
    programDescription: generateProgramDescription(profile, testConfig),
    totalWeeks: calculateTotalWeeks(profile),
    daysPerWeek: trainingDaysPerWeek,
    currentWeek,
    weakPoints,
    keyFocus: emphasis,
    progressionNotes: generateProgressionNotes(profile, phase),
  }
}

function analyzeWeakPoints(profile: MilitaryProfile): string[] {
  const weakPoints: string[] = []
  const testConfig = TEST_CONFIGS[profile.targetTest!]
  const benchmarks = profile.currentBenchmarks

  // Analyze each event
  testConfig.events.forEach(event => {
    const currentValue = benchmarks[event.benchmarkField as keyof typeof benchmarks]
    if (currentValue === undefined || currentValue === null) {
      weakPoints.push(`${event.name} (not tested)`)
    }
    // Could add more sophisticated analysis comparing to minimum standards
  })

  return weakPoints.slice(0, 3) // Top 3 weak points
}

function determinePhase(
  profile: MilitaryProfile,
  weekNumber: number
): 'foundation' | 'build' | 'peak' | 'taper' {
  const totalWeeks = calculateTotalWeeks(profile)
  
  if (weekNumber <= Math.floor(totalWeeks * 0.25)) {
    return 'foundation'
  } else if (weekNumber <= Math.floor(totalWeeks * 0.6)) {
    return 'build'
  } else if (weekNumber <= Math.floor(totalWeeks * 0.9)) {
    return 'peak'
  } else {
    return 'taper'
  }
}

function determineEmphasis(profile: MilitaryProfile, weakPoints: string[]): string[] {
  const testConfig = TEST_CONFIGS[profile.targetTest!]
  const emphasis: string[] = []

  // Add primary qualities from test config
  testConfig.primaryQualities.slice(0, 2).forEach(quality => {
    emphasis.push(formatQuality(quality))
  })

  // Add weak point focus if goal is competitive or max
  if (profile.goalPriority === 'competitive' || profile.goalPriority === 'max_score') {
    if (weakPoints.length > 0) {
      emphasis.push('Weak Point Focus')
    }
  }

  return emphasis
}

function formatQuality(quality: PhysicalQuality): string {
  const labels: Record<PhysicalQuality, string> = {
    pull_endurance: 'Pull-Up Endurance',
    push_endurance: 'Push-Up Endurance',
    trunk_endurance: 'Core Endurance',
    run_endurance: 'Running',
    sprint_power: 'Sprint Power',
    carry_capacity: 'Carry Capacity',
    lower_body_power: 'Explosive Power',
    upper_body_strength: 'Upper Body Strength',
    grip_endurance: 'Grip Endurance',
    agility: 'Agility',
    work_capacity: 'Work Capacity',
  }
  return labels[quality] || quality
}

function calculateTotalWeeks(profile: MilitaryProfile): number {
  if (profile.testDate) {
    const now = new Date()
    const testDate = new Date(profile.testDate)
    const diffTime = testDate.getTime() - now.getTime()
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
    return Math.max(4, Math.min(diffWeeks, 16)) // 4-16 weeks
  }
  
  // Default based on goal priority
  switch (profile.goalPriority) {
    case 'pass_minimum': return 8
    case 'competitive': return 12
    case 'max_score': return 16
    default: return 8
  }
}

function generateWeekDays(
  profile: MilitaryProfile,
  daysPerWeek: number,
  phase: 'foundation' | 'build' | 'peak' | 'taper',
  weakPoints: string[]
): MilitaryDayPlan[] {
  const days: MilitaryDayPlan[] = []
  const testId = profile.targetTest!

  // Day templates based on test type
  for (let i = 1; i <= daysPerWeek; i++) {
    days.push(generateDayPlan(testId, i, daysPerWeek, phase, profile))
  }

  return days
}

function generateDayPlan(
  testId: MilitaryTest,
  dayNumber: number,
  totalDays: number,
  phase: 'foundation' | 'build' | 'peak' | 'taper',
  profile: MilitaryProfile
): MilitaryDayPlan {
  const testConfig = TEST_CONFIGS[testId]
  
  // Determine day focus based on rotation
  const dayFocus = getDayFocus(testId, dayNumber, totalDays)
  
  const blocks = generateBlocks(testId, dayFocus, phase, profile)
  
  return {
    dayNumber,
    focus: dayFocus,
    warmup: WARMUP_EXERCISES.slice(0, 4),
    blocks,
    cooldown: COOLDOWN_EXERCISES.slice(0, 3),
    totalTime: estimateTotalTime(blocks),
  }
}

function getDayFocus(testId: MilitaryTest, dayNumber: number, totalDays: number): string {
  // Test-specific day rotations
  const focusRotations: Record<string, string[]> = {
    marine_ist: ['Upper Body + Core', 'Run Development', 'Full Body + Conditioning'],
    marine_pft: ['Pull-Ups + Plank', 'Run Development', 'Upper Body Endurance', 'Test Simulation'],
    marine_cft: ['Sprint + Power', 'Ammo Lift + Core', 'MUF Practice', 'Conditioning'],
    army_acft: ['Strength (DL/SPT)', 'Conditioning (SDC)', 'Push + Core', 'Run Development', 'Full Event Practice'],
    navy_prt: ['Push-Up Endurance', 'Core + Plank', 'Run Development'],
    air_force_pt: ['Push-Ups + Sit-Ups', 'Run Development', 'Full Body Conditioning'],
    space_force_pt: ['Push-Ups + Sit-Ups', 'Run Development', 'Full Body Conditioning'],
    coast_guard_pt: ['Push-Ups + Core', 'Run Development', 'Test Practice'],
    general_recruit_prep: ['Upper Body', 'Lower Body + Run', 'Full Body', 'Conditioning'],
    boot_camp_readiness: ['Calisthenics Density', 'Run Development', 'Work Capacity', 'Recovery'],
  }

  const rotation = focusRotations[testId] || ['Full Body', 'Run', 'Recovery']
  return rotation[(dayNumber - 1) % rotation.length]
}

function generateBlocks(
  testId: MilitaryTest,
  dayFocus: string,
  phase: 'foundation' | 'build' | 'peak' | 'taper',
  profile: MilitaryProfile
): MilitaryProgramBlock[] {
  const blocks: MilitaryProgramBlock[] = []

  // Select exercises based on test and day focus
  if (dayFocus.includes('Pull') || dayFocus.includes('Upper')) {
    blocks.push({
      title: 'Pull-Up Development',
      category: 'event_specific',
      exercises: selectExercises(PULL_UP_EXERCISES, phase, 3),
      rationale: 'Building pull-up capacity for test standards',
    })
  }

  if (dayFocus.includes('Push') || dayFocus.includes('Upper')) {
    blocks.push({
      title: 'Push-Up Work',
      category: 'event_specific',
      exercises: selectExercises(PUSH_UP_EXERCISES, phase, 3),
      rationale: 'Developing push-up endurance and form',
    })
  }

  if (dayFocus.includes('Core') || dayFocus.includes('Plank')) {
    blocks.push({
      title: 'Core & Trunk Endurance',
      category: 'core_trunk',
      exercises: selectExercises(PLANK_EXERCISES, phase, 3),
      rationale: 'Building trunk stability and plank endurance',
    })
  }

  if (dayFocus.includes('Run')) {
    blocks.push({
      title: 'Run Development',
      category: 'run_development',
      exercises: selectExercises(RUN_EXERCISES, phase, 2),
      rationale: 'Improving running pace and endurance',
    })
  }

  if (testId === 'marine_cft' && (dayFocus.includes('Ammo') || dayFocus.includes('MUF') || dayFocus.includes('Sprint'))) {
    blocks.push({
      title: 'CFT Event Practice',
      category: 'event_specific',
      exercises: selectExercises(CFT_EXERCISES, phase, 4),
      rationale: 'Specific preparation for CFT events',
    })
  }

  if (testId === 'army_acft' && (dayFocus.includes('Strength') || dayFocus.includes('SDC'))) {
    blocks.push({
      title: 'ACFT Event Work',
      category: 'event_specific',
      exercises: selectExercises(ACFT_EXERCISES, phase, 4),
      rationale: 'Specific preparation for ACFT events',
    })
  }

  if (dayFocus.includes('Conditioning') || dayFocus.includes('Work Capacity')) {
    blocks.push({
      title: 'Work Capacity Circuit',
      category: 'work_capacity',
      exercises: [
        { name: 'Burpees', sets: 3, reps: '10-15', category: 'work_capacity', targetQuality: 'work_capacity' },
        { name: 'Mountain Climbers', sets: 3, reps: '30s', category: 'work_capacity', targetQuality: 'work_capacity' },
        { name: 'Jump Squats', sets: 3, reps: '12-15', category: 'work_capacity', targetQuality: 'work_capacity' },
      ],
      rationale: 'Building general work capacity and fatigue tolerance',
    })
  }

  if (dayFocus.includes('Test') || dayFocus.includes('Simulation') || dayFocus.includes('Practice')) {
    blocks.push({
      title: 'Test Simulation',
      category: 'test_simulation',
      exercises: getTestSimulationExercises(testId),
      rationale: 'Full or partial test practice for confidence and pacing',
    })
  }

  return blocks
}

function selectExercises(
  pool: MilitaryExercise[],
  phase: 'foundation' | 'build' | 'peak' | 'taper',
  count: number
): MilitaryExercise[] {
  // Filter based on phase
  let filtered = pool
  
  if (phase === 'foundation') {
    filtered = pool.filter(e => 
      e.category === 'strength_support' || 
      e.category === 'core_trunk'
    )
  } else if (phase === 'peak' || phase === 'taper') {
    filtered = pool.filter(e => 
      e.category === 'event_specific' || 
      e.category === 'test_simulation'
    )
  }

  // If not enough exercises after filtering, use full pool
  if (filtered.length < count) {
    filtered = pool
  }

  // Return random selection
  return filtered.slice(0, count)
}

function getTestSimulationExercises(testId: MilitaryTest): MilitaryExercise[] {
  const simulations: Record<string, MilitaryExercise[]> = {
    marine_ist: [
      { name: 'Full IST Run-Through', sets: 1, reps: 'all events', category: 'test_simulation', notes: 'Pull-ups → Plank → 1.5mi Run' },
    ],
    marine_pft: [
      { name: 'Full PFT Simulation', sets: 1, reps: 'all events', category: 'test_simulation', notes: 'Pull-ups → Plank → 3mi Run' },
    ],
    marine_cft: [
      { name: 'Full CFT Simulation', sets: 1, reps: 'all events', category: 'test_simulation', notes: 'MTC → AL → MUF' },
    ],
    army_acft: [
      { name: 'ACFT Partial Practice', sets: 1, reps: '3 events', category: 'test_simulation', notes: 'Rotate which events' },
    ],
    navy_prt: [
      { name: 'Full PRT Practice', sets: 1, reps: 'all events', category: 'test_simulation' },
    ],
    air_force_pt: [
      { name: 'Full PT Test Practice', sets: 1, reps: 'all events', category: 'test_simulation' },
    ],
    space_force_pt: [
      { name: 'Full PT Test Practice', sets: 1, reps: 'all events', category: 'test_simulation' },
    ],
    coast_guard_pt: [
      { name: 'Full PT Test Practice', sets: 1, reps: 'all events', category: 'test_simulation' },
    ],
    general_recruit_prep: [
      { name: 'Basic Fitness Assessment', sets: 1, reps: 'pull-ups, push-ups, run', category: 'test_simulation' },
    ],
    boot_camp_readiness: [
      { name: 'Boot Camp Simulation', sets: 1, reps: 'extended calisthenics circuit', category: 'test_simulation' },
    ],
  }

  return simulations[testId] || [
    { name: 'General Test Practice', sets: 1, reps: 'event simulation', category: 'test_simulation' },
  ]
}

function estimateTotalTime(blocks: MilitaryProgramBlock[]): string {
  // Rough estimate: ~15-20 min per block plus warmup/cooldown
  const blockTime = blocks.length * 17
  const warmupCooldown = 15
  const total = blockTime + warmupCooldown
  return `${total}-${total + 10} min`
}

function generateProgramDescription(profile: MilitaryProfile, testConfig: typeof TEST_CONFIGS[MilitaryTest]): string {
  const goalText = profile.goalPriority === 'pass_minimum' 
    ? 'meet minimum standards' 
    : profile.goalPriority === 'competitive' 
      ? 'achieve a competitive score' 
      : 'maximize your score'

  return `A structured program designed to help you ${goalText} on the ${testConfig.testName}. ` +
         `This program focuses on ${testConfig.primaryQualities.slice(0, 2).map(formatQuality).join(' and ')} ` +
         `with specific preparation for each test event.`
}

function generateProgressionNotes(
  profile: MilitaryProfile,
  phase: 'foundation' | 'build' | 'peak' | 'taper'
): string {
  const notes: Record<string, string> = {
    foundation: 'Focus on building base fitness and movement quality. Volume is moderate, intensity is controlled.',
    build: 'Increasing specificity and intensity. Event practice becomes more frequent.',
    peak: 'High-intensity event-specific work. Test simulations and confidence-building.',
    taper: 'Reduced volume, maintained intensity. Focus on rest and final preparation.',
  }

  return notes[phase]
}

// =============================================================================
// EXPORTS
// =============================================================================

export function getMilitaryProgramSummary(program: MilitaryProgram): string {
  return `${program.testName} - ${program.currentWeek.phase.charAt(0).toUpperCase() + program.currentWeek.phase.slice(1)} Phase (Week ${program.currentWeek.weekNumber})`
}

export function isMilitaryTestSupported(testId: MilitaryTest): boolean {
  return testId in TEST_CONFIGS
}
