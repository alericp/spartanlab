/**
 * Military Test Prep Configuration System
 * 
 * Defines all military branches, fitness tests, events, standards,
 * and configuration needed for test-specific programming.
 */

// =============================================================================
// TYPES
// =============================================================================

export type MilitaryBranch = 
  | 'marine_corps' 
  | 'army' 
  | 'navy' 
  | 'air_force' 
  | 'space_force' 
  | 'coast_guard' 
  | 'general_recruit'

export type MilitaryTest = 
  | 'marine_ist' 
  | 'marine_pft' 
  | 'marine_cft'
  | 'army_acft'
  | 'navy_prt'
  | 'air_force_pt' 
  | 'space_force_pt'
  | 'coast_guard_pt'
  | 'general_recruit_prep' 
  | 'boot_camp_readiness'

export type MilitaryStatus = 
  | 'recruit_poolee'    // Pre-ship applicant
  | 'active_duty'       // Currently serving
  | 'returning'         // Coming back to standard after break
  | 'chasing_max'       // Advanced user chasing max score

export type MilitaryGoalPriority = 
  | 'pass_minimum'      // Just need to pass
  | 'competitive'       // Want a good score
  | 'max_score'         // Shooting for perfect

export type TestEventType = 
  | 'timed_run' 
  | 'max_reps' 
  | 'timed_hold' 
  | 'timed_task' 
  | 'weighted_carry'
  | 'power_throw'
  | 'agility'

export type ScoringType = 
  | 'time_lower_better' 
  | 'reps_higher_better' 
  | 'time_higher_better' 
  | 'distance_higher_better'
  | 'pass_fail'

export type EnergySystem = 'aerobic' | 'anaerobic' | 'mixed'

export type PhysicalQuality = 
  | 'pull_endurance'
  | 'push_endurance'
  | 'trunk_endurance'
  | 'run_endurance'
  | 'sprint_power'
  | 'carry_capacity'
  | 'lower_body_power'
  | 'upper_body_strength'
  | 'grip_endurance'
  | 'agility'
  | 'work_capacity'

// =============================================================================
// INTERFACES
// =============================================================================

export interface TestEvent {
  id: string
  name: string
  type: TestEventType
  scoringType: ScoringType
  description: string
  minimumMale?: string
  minimumFemale?: string
  maxMale?: string
  maxFemale?: string
  unit: string
  benchmarkField: string // Maps to MilitaryBenchmarks key
}

export interface MilitaryTestConfig {
  testId: MilitaryTest
  branch: MilitaryBranch
  testName: string
  testDescription: string
  events: TestEvent[]
  eventOrder: string[]  // Order matters for fatigue interaction
  energySystem: EnergySystem
  primaryQualities: PhysicalQuality[]
  restBetweenEvents: string
  totalTestDuration: string
  commonFailures: string[]
  trainingEmphasis: string[]
}

export interface MilitaryBenchmarks {
  // Upper body
  pullUps?: number
  pushUps?: number
  // Core
  plankHold?: number  // seconds
  sitUps?: number
  legTucks?: number
  // Running
  runTime1_5mi?: number  // seconds
  runTime2mi?: number    // seconds
  runTime3mi?: number    // seconds
  shuttleTime?: number   // seconds
  // ACFT-specific
  deadliftMax?: number   // lbs
  standingPowerThrow?: number  // meters
  sprintDragCarry?: number     // seconds
  // CFT-specific
  ammoCanLifts?: number
  maneuverUnderFire?: number   // seconds
  movementToContact?: number   // seconds
}

export interface MilitaryEquipmentAccess {
  hasTrack: boolean
  hasTreadmill: boolean
  hasPullUpBar: boolean
  hasWeights: boolean
  hasSled: boolean
  hasAmmoCan: boolean
  hasMedicineBall: boolean
  hasSandbag: boolean
}

export interface MilitaryProfile {
  branch: MilitaryBranch | null
  targetTest: MilitaryTest | null
  status: MilitaryStatus | null
  goalPriority: MilitaryGoalPriority | null
  testDate: string | null  // ISO date or null if unknown
  currentBenchmarks: MilitaryBenchmarks
  equipment: MilitaryEquipmentAccess
  injuries: string[]
}

// =============================================================================
// BRANCH LABELS & METADATA
// =============================================================================

export const BRANCH_LABELS: Record<MilitaryBranch, string> = {
  marine_corps: 'Marine Corps',
  army: 'Army',
  navy: 'Navy',
  air_force: 'Air Force',
  space_force: 'Space Force',
  coast_guard: 'Coast Guard',
  general_recruit: 'General Recruit Prep',
}

export const BRANCH_DESCRIPTIONS: Record<MilitaryBranch, string> = {
  marine_corps: 'IST, PFT, and CFT preparation for Marines',
  army: 'ACFT preparation for Army soldiers',
  navy: 'PRT preparation for Navy sailors',
  air_force: 'PT Test preparation for Airmen',
  space_force: 'PT Test preparation for Guardians',
  coast_guard: 'PT Test preparation for Coast Guard',
  general_recruit: 'Foundational fitness for any branch',
}

export const STATUS_LABELS: Record<MilitaryStatus, string> = {
  recruit_poolee: 'Recruit / Poolee / Applicant',
  active_duty: 'Active Duty',
  returning: 'Returning to Standard',
  chasing_max: 'Chasing Max Score',
}

export const GOAL_PRIORITY_LABELS: Record<MilitaryGoalPriority, string> = {
  pass_minimum: 'Pass Minimum Standards',
  competitive: 'Competitive Score',
  max_score: 'Max Score',
}

// =============================================================================
// BRANCH/TEST MAPPING
// =============================================================================

export const BRANCH_TESTS: Record<MilitaryBranch, MilitaryTest[]> = {
  marine_corps: ['marine_ist', 'marine_pft', 'marine_cft'],
  army: ['army_acft'],
  navy: ['navy_prt'],
  air_force: ['air_force_pt'],
  space_force: ['space_force_pt'],
  coast_guard: ['coast_guard_pt'],
  general_recruit: ['general_recruit_prep', 'boot_camp_readiness'],
}

export const TEST_LABELS: Record<MilitaryTest, string> = {
  marine_ist: 'Initial Strength Test (IST)',
  marine_pft: 'Physical Fitness Test (PFT)',
  marine_cft: 'Combat Fitness Test (CFT)',
  army_acft: 'Army Combat Fitness Test (ACFT)',
  navy_prt: 'Physical Readiness Test (PRT)',
  air_force_pt: 'PT Test',
  space_force_pt: 'PT Test',
  coast_guard_pt: 'PT Test',
  general_recruit_prep: 'General Recruit Fitness',
  boot_camp_readiness: 'Boot Camp Readiness',
}

// =============================================================================
// TEST CONFIGURATIONS
// =============================================================================

export const TEST_CONFIGS: Record<MilitaryTest, MilitaryTestConfig> = {
  // =========================================================================
  // MARINE CORPS
  // =========================================================================
  marine_ist: {
    testId: 'marine_ist',
    branch: 'marine_corps',
    testName: 'Initial Strength Test (IST)',
    testDescription: 'Entry-level fitness test for Marine recruits to ensure readiness for boot camp.',
    events: [
      {
        id: 'ist_pullups',
        name: 'Pull-Ups (or Push-Ups)',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: 'Max dead-hang pull-ups or push-ups in 2 minutes',
        minimumMale: '3 pull-ups or 34 push-ups',
        minimumFemale: '1 pull-up or 15 push-ups',
        unit: 'reps',
        benchmarkField: 'pullUps',
      },
      {
        id: 'ist_plank',
        name: 'Plank',
        type: 'timed_hold',
        scoringType: 'time_higher_better',
        description: 'Hold a proper plank position',
        minimumMale: '1:03',
        minimumFemale: '1:03',
        unit: 'seconds',
        benchmarkField: 'plankHold',
      },
      {
        id: 'ist_run',
        name: '1.5-Mile Run',
        type: 'timed_run',
        scoringType: 'time_lower_better',
        description: 'Timed 1.5-mile run',
        minimumMale: '13:30',
        minimumFemale: '15:00',
        unit: 'seconds',
        benchmarkField: 'runTime1_5mi',
      },
    ],
    eventOrder: ['ist_pullups', 'ist_plank', 'ist_run'],
    energySystem: 'mixed',
    primaryQualities: ['pull_endurance', 'trunk_endurance', 'run_endurance'],
    restBetweenEvents: '5-10 minutes',
    totalTestDuration: '30-45 minutes',
    commonFailures: ['Insufficient pull-up strength', 'Poor plank endurance', 'Run time too slow'],
    trainingEmphasis: ['Pull-up progression', 'Plank endurance', 'Running base'],
  },

  marine_pft: {
    testId: 'marine_pft',
    branch: 'marine_corps',
    testName: 'Physical Fitness Test (PFT)',
    testDescription: 'Standard Marine Corps fitness assessment measuring muscular and cardio endurance.',
    events: [
      {
        id: 'pft_pullups',
        name: 'Pull-Ups (or Push-Ups)',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: 'Max dead-hang pull-ups or 2-min push-ups',
        minimumMale: '4 pull-ups',
        minimumFemale: '4 pull-ups',
        maxMale: '23 pull-ups (100 pts)',
        maxFemale: '11 pull-ups (100 pts)',
        unit: 'reps',
        benchmarkField: 'pullUps',
      },
      {
        id: 'pft_plank',
        name: 'Plank',
        type: 'timed_hold',
        scoringType: 'time_higher_better',
        description: 'Hold plank position as long as possible',
        minimumMale: '1:10',
        minimumFemale: '1:10',
        maxMale: '4:20 (100 pts)',
        maxFemale: '4:20 (100 pts)',
        unit: 'seconds',
        benchmarkField: 'plankHold',
      },
      {
        id: 'pft_run',
        name: '3-Mile Run',
        type: 'timed_run',
        scoringType: 'time_lower_better',
        description: 'Timed 3-mile run',
        minimumMale: '28:00',
        minimumFemale: '31:00',
        maxMale: '18:00 (100 pts)',
        maxFemale: '21:00 (100 pts)',
        unit: 'seconds',
        benchmarkField: 'runTime3mi',
      },
    ],
    eventOrder: ['pft_pullups', 'pft_plank', 'pft_run'],
    energySystem: 'aerobic',
    primaryQualities: ['pull_endurance', 'trunk_endurance', 'run_endurance'],
    restBetweenEvents: '5-10 minutes',
    totalTestDuration: '45-60 minutes',
    commonFailures: ['Pull-up ceiling', 'Plank endurance drop-off', '3-mile pacing issues'],
    trainingEmphasis: ['High-rep pull-up work', 'Extended plank holds', '3-mile specific pacing'],
  },

  marine_cft: {
    testId: 'marine_cft',
    branch: 'marine_corps',
    testName: 'Combat Fitness Test (CFT)',
    testDescription: 'Combat-focused fitness test measuring functional strength and anaerobic capacity.',
    events: [
      {
        id: 'cft_mtc',
        name: 'Movement to Contact (MTC)',
        type: 'timed_run',
        scoringType: 'time_lower_better',
        description: '880-yard sprint',
        minimumMale: '3:26',
        minimumFemale: '4:21',
        maxMale: '2:38 (100 pts)',
        maxFemale: '3:18 (100 pts)',
        unit: 'seconds',
        benchmarkField: 'movementToContact',
      },
      {
        id: 'cft_al',
        name: 'Ammunition Lift (AL)',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: '30lb ammo can lifts from ground to overhead in 2 minutes',
        minimumMale: '45 lifts',
        minimumFemale: '25 lifts',
        maxMale: '115 lifts (100 pts)',
        maxFemale: '85 lifts (100 pts)',
        unit: 'reps',
        benchmarkField: 'ammoCanLifts',
      },
      {
        id: 'cft_muf',
        name: 'Maneuver Under Fire (MUF)',
        type: 'timed_task',
        scoringType: 'time_lower_better',
        description: 'Combat-style obstacle course with crawls, carries, throws, and drags',
        minimumMale: '4:13',
        minimumFemale: '5:28',
        maxMale: '2:28 (100 pts)',
        maxFemale: '3:23 (100 pts)',
        unit: 'seconds',
        benchmarkField: 'maneuverUnderFire',
      },
    ],
    eventOrder: ['cft_mtc', 'cft_al', 'cft_muf'],
    energySystem: 'anaerobic',
    primaryQualities: ['sprint_power', 'upper_body_strength', 'work_capacity', 'carry_capacity', 'agility'],
    restBetweenEvents: '5 minutes',
    totalTestDuration: '20-30 minutes',
    commonFailures: ['Poor sprint conditioning', 'Shoulder fatigue on ammo lifts', 'MUF technique breakdown'],
    trainingEmphasis: ['Sprint intervals', 'Overhead pressing endurance', 'Loaded carries', 'Combat-style circuits'],
  },

  // =========================================================================
  // ARMY
  // =========================================================================
  army_acft: {
    testId: 'army_acft',
    branch: 'army',
    testName: 'Army Combat Fitness Test (ACFT)',
    testDescription: 'Comprehensive fitness test measuring strength, power, and endurance across 6 events.',
    events: [
      {
        id: 'acft_deadlift',
        name: '3 Repetition Maximum Deadlift (MDL)',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: '3-rep max deadlift with hex bar',
        minimumMale: '140 lbs',
        minimumFemale: '120 lbs',
        maxMale: '340 lbs (100 pts)',
        maxFemale: '230 lbs (100 pts)',
        unit: 'lbs',
        benchmarkField: 'deadliftMax',
      },
      {
        id: 'acft_spt',
        name: 'Standing Power Throw (SPT)',
        type: 'power_throw',
        scoringType: 'distance_higher_better',
        description: 'Backward overhead 10lb medicine ball throw',
        minimumMale: '4.5m',
        minimumFemale: '3.9m',
        maxMale: '12.5m (100 pts)',
        maxFemale: '10.0m (100 pts)',
        unit: 'meters',
        benchmarkField: 'standingPowerThrow',
      },
      {
        id: 'acft_hrp',
        name: 'Hand Release Push-Ups (HRP)',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: 'Max hand-release push-ups in 2 minutes',
        minimumMale: '10',
        minimumFemale: '10',
        maxMale: '60 (100 pts)',
        maxFemale: '60 (100 pts)',
        unit: 'reps',
        benchmarkField: 'pushUps',
      },
      {
        id: 'acft_sdc',
        name: 'Sprint-Drag-Carry (SDC)',
        type: 'timed_task',
        scoringType: 'time_lower_better',
        description: '5x50m shuttle: sprint, sled drag, lateral shuffle, carry, sprint',
        minimumMale: '3:00',
        minimumFemale: '3:35',
        maxMale: '1:33 (100 pts)',
        maxFemale: '2:15 (100 pts)',
        unit: 'seconds',
        benchmarkField: 'sprintDragCarry',
      },
      {
        id: 'acft_ltk',
        name: 'Leg Tuck (or Plank)',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: 'Max leg tucks or 2-min plank hold',
        minimumMale: '1 or 1:30 plank',
        minimumFemale: '1 or 1:30 plank',
        maxMale: '20 (100 pts)',
        maxFemale: '20 (100 pts)',
        unit: 'reps',
        benchmarkField: 'legTucks',
      },
      {
        id: 'acft_run',
        name: '2-Mile Run',
        type: 'timed_run',
        scoringType: 'time_lower_better',
        description: 'Timed 2-mile run',
        minimumMale: '21:00',
        minimumFemale: '23:22',
        maxMale: '13:30 (100 pts)',
        maxFemale: '15:29 (100 pts)',
        unit: 'seconds',
        benchmarkField: 'runTime2mi',
      },
    ],
    eventOrder: ['acft_deadlift', 'acft_spt', 'acft_hrp', 'acft_sdc', 'acft_ltk', 'acft_run'],
    energySystem: 'mixed',
    primaryQualities: ['lower_body_power', 'upper_body_strength', 'push_endurance', 'work_capacity', 'trunk_endurance', 'run_endurance'],
    restBetweenEvents: '2-5 minutes',
    totalTestDuration: '50-70 minutes',
    commonFailures: ['Deadlift technique', 'SDC conditioning', 'Leg tuck strength', '2-mile pacing'],
    trainingEmphasis: ['Deadlift strength', 'Explosive power', 'Push-up volume', 'Shuttle conditioning', 'Core strength', '2-mile specificity'],
  },

  // =========================================================================
  // NAVY
  // =========================================================================
  navy_prt: {
    testId: 'navy_prt',
    branch: 'navy',
    testName: 'Physical Readiness Test (PRT)',
    testDescription: 'Standard Navy fitness assessment measuring muscular and cardio endurance.',
    events: [
      {
        id: 'prt_pushups',
        name: 'Push-Ups',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: 'Max push-ups in 2 minutes',
        minimumMale: '42',
        minimumFemale: '19',
        maxMale: '92+ (Outstanding)',
        maxFemale: '62+ (Outstanding)',
        unit: 'reps',
        benchmarkField: 'pushUps',
      },
      {
        id: 'prt_plank',
        name: 'Forearm Plank',
        type: 'timed_hold',
        scoringType: 'time_higher_better',
        description: 'Hold forearm plank position',
        minimumMale: '1:30',
        minimumFemale: '1:30',
        maxMale: '3:40+ (Outstanding)',
        maxFemale: '3:40+ (Outstanding)',
        unit: 'seconds',
        benchmarkField: 'plankHold',
      },
      {
        id: 'prt_run',
        name: '1.5-Mile Run (or alternatives)',
        type: 'timed_run',
        scoringType: 'time_lower_better',
        description: 'Timed 1.5-mile run, 500m swim, or bike',
        minimumMale: '12:30',
        minimumFemale: '15:00',
        maxMale: '8:55 (Outstanding)',
        maxFemale: '11:15 (Outstanding)',
        unit: 'seconds',
        benchmarkField: 'runTime1_5mi',
      },
    ],
    eventOrder: ['prt_pushups', 'prt_plank', 'prt_run'],
    energySystem: 'mixed',
    primaryQualities: ['push_endurance', 'trunk_endurance', 'run_endurance'],
    restBetweenEvents: '2-5 minutes',
    totalTestDuration: '30-45 minutes',
    commonFailures: ['Push-up endurance ceiling', 'Plank form breakdown', 'Run pacing'],
    trainingEmphasis: ['Push-up density', 'Plank progressions', '1.5-mile specificity'],
  },

  // =========================================================================
  // AIR FORCE
  // =========================================================================
  air_force_pt: {
    testId: 'air_force_pt',
    branch: 'air_force',
    testName: 'Air Force PT Test',
    testDescription: 'Standard Air Force fitness assessment with cardio and muscular components.',
    events: [
      {
        id: 'af_pushups',
        name: 'Push-Ups',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: 'Max push-ups in 1 minute',
        minimumMale: '33',
        minimumFemale: '18',
        maxMale: '67+ (Excellent)',
        maxFemale: '47+ (Excellent)',
        unit: 'reps',
        benchmarkField: 'pushUps',
      },
      {
        id: 'af_situps',
        name: 'Sit-Ups',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: 'Max sit-ups in 1 minute',
        minimumMale: '42',
        minimumFemale: '38',
        maxMale: '58+ (Excellent)',
        maxFemale: '54+ (Excellent)',
        unit: 'reps',
        benchmarkField: 'sitUps',
      },
      {
        id: 'af_run',
        name: '1.5-Mile Run',
        type: 'timed_run',
        scoringType: 'time_lower_better',
        description: 'Timed 1.5-mile run',
        minimumMale: '13:36',
        minimumFemale: '16:22',
        maxMale: '9:12 (Excellent)',
        maxFemale: '11:22 (Excellent)',
        unit: 'seconds',
        benchmarkField: 'runTime1_5mi',
      },
    ],
    eventOrder: ['af_pushups', 'af_situps', 'af_run'],
    energySystem: 'mixed',
    primaryQualities: ['push_endurance', 'trunk_endurance', 'run_endurance'],
    restBetweenEvents: '3-5 minutes',
    totalTestDuration: '30-40 minutes',
    commonFailures: ['Push-up form issues', 'Sit-up pacing', 'Run conditioning'],
    trainingEmphasis: ['1-min push-up density', 'Sit-up endurance', '1.5-mile intervals'],
  },

  // =========================================================================
  // SPACE FORCE
  // =========================================================================
  space_force_pt: {
    testId: 'space_force_pt',
    branch: 'space_force',
    testName: 'Space Force PT Test',
    testDescription: 'Space Force fitness assessment (currently aligned with Air Force standards).',
    events: [
      {
        id: 'sf_pushups',
        name: 'Push-Ups',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: 'Max push-ups in 1 minute',
        minimumMale: '33',
        minimumFemale: '18',
        unit: 'reps',
        benchmarkField: 'pushUps',
      },
      {
        id: 'sf_situps',
        name: 'Sit-Ups',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: 'Max sit-ups in 1 minute',
        minimumMale: '42',
        minimumFemale: '38',
        unit: 'reps',
        benchmarkField: 'sitUps',
      },
      {
        id: 'sf_run',
        name: '1.5-Mile Run',
        type: 'timed_run',
        scoringType: 'time_lower_better',
        description: 'Timed 1.5-mile run',
        minimumMale: '13:36',
        minimumFemale: '16:22',
        unit: 'seconds',
        benchmarkField: 'runTime1_5mi',
      },
    ],
    eventOrder: ['sf_pushups', 'sf_situps', 'sf_run'],
    energySystem: 'mixed',
    primaryQualities: ['push_endurance', 'trunk_endurance', 'run_endurance'],
    restBetweenEvents: '3-5 minutes',
    totalTestDuration: '30-40 minutes',
    commonFailures: ['Push-up form issues', 'Sit-up pacing', 'Run conditioning'],
    trainingEmphasis: ['1-min push-up density', 'Sit-up endurance', '1.5-mile intervals'],
  },

  // =========================================================================
  // COAST GUARD
  // =========================================================================
  coast_guard_pt: {
    testId: 'coast_guard_pt',
    branch: 'coast_guard',
    testName: 'Coast Guard PT Test',
    testDescription: 'Coast Guard fitness assessment for shipboard readiness.',
    events: [
      {
        id: 'cg_pushups',
        name: 'Push-Ups',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: 'Max push-ups in 1 minute',
        minimumMale: '29',
        minimumFemale: '15',
        unit: 'reps',
        benchmarkField: 'pushUps',
      },
      {
        id: 'cg_situps',
        name: 'Sit-Ups',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: 'Max sit-ups in 1 minute',
        minimumMale: '38',
        minimumFemale: '32',
        unit: 'reps',
        benchmarkField: 'sitUps',
      },
      {
        id: 'cg_run',
        name: '1.5-Mile Run',
        type: 'timed_run',
        scoringType: 'time_lower_better',
        description: 'Timed 1.5-mile run',
        minimumMale: '12:51',
        minimumFemale: '15:26',
        unit: 'seconds',
        benchmarkField: 'runTime1_5mi',
      },
    ],
    eventOrder: ['cg_pushups', 'cg_situps', 'cg_run'],
    energySystem: 'mixed',
    primaryQualities: ['push_endurance', 'trunk_endurance', 'run_endurance'],
    restBetweenEvents: '3-5 minutes',
    totalTestDuration: '30-40 minutes',
    commonFailures: ['Push-up endurance', 'Sit-up technique', 'Run conditioning'],
    trainingEmphasis: ['Push-up volume', 'Core endurance', '1.5-mile pacing'],
  },

  // =========================================================================
  // GENERAL RECRUIT
  // =========================================================================
  general_recruit_prep: {
    testId: 'general_recruit_prep',
    branch: 'general_recruit',
    testName: 'General Recruit Fitness',
    testDescription: 'Foundational fitness preparation for any military branch entry.',
    events: [
      {
        id: 'recruit_pullups',
        name: 'Pull-Ups',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: 'Dead-hang pull-ups',
        minimumMale: '3-5',
        minimumFemale: '1-3',
        unit: 'reps',
        benchmarkField: 'pullUps',
      },
      {
        id: 'recruit_pushups',
        name: 'Push-Ups',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: 'Max push-ups',
        minimumMale: '40+',
        minimumFemale: '20+',
        unit: 'reps',
        benchmarkField: 'pushUps',
      },
      {
        id: 'recruit_plank',
        name: 'Plank',
        type: 'timed_hold',
        scoringType: 'time_higher_better',
        description: 'Plank hold',
        minimumMale: '2:00',
        minimumFemale: '2:00',
        unit: 'seconds',
        benchmarkField: 'plankHold',
      },
      {
        id: 'recruit_run',
        name: '1.5-Mile Run',
        type: 'timed_run',
        scoringType: 'time_lower_better',
        description: 'Timed 1.5-mile run',
        minimumMale: '12:00',
        minimumFemale: '14:00',
        unit: 'seconds',
        benchmarkField: 'runTime1_5mi',
      },
    ],
    eventOrder: ['recruit_pullups', 'recruit_pushups', 'recruit_plank', 'recruit_run'],
    energySystem: 'mixed',
    primaryQualities: ['pull_endurance', 'push_endurance', 'trunk_endurance', 'run_endurance'],
    restBetweenEvents: 'varies',
    totalTestDuration: '30-45 minutes',
    commonFailures: ['Weak pull-ups', 'Push-up endurance', 'Running base'],
    trainingEmphasis: ['Basic calisthenics', 'Run development', 'General conditioning'],
  },

  boot_camp_readiness: {
    testId: 'boot_camp_readiness',
    branch: 'general_recruit',
    testName: 'Boot Camp Readiness',
    testDescription: 'Comprehensive preparation for the physical demands of any basic training.',
    events: [
      {
        id: 'bc_pullups',
        name: 'Pull-Ups',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: 'Dead-hang pull-ups',
        minimumMale: '5+',
        minimumFemale: '1+',
        unit: 'reps',
        benchmarkField: 'pullUps',
      },
      {
        id: 'bc_pushups',
        name: 'Push-Ups',
        type: 'max_reps',
        scoringType: 'reps_higher_better',
        description: '2-minute push-ups',
        minimumMale: '50+',
        minimumFemale: '25+',
        unit: 'reps',
        benchmarkField: 'pushUps',
      },
      {
        id: 'bc_plank',
        name: 'Plank',
        type: 'timed_hold',
        scoringType: 'time_higher_better',
        description: 'Extended plank hold',
        minimumMale: '3:00',
        minimumFemale: '2:30',
        unit: 'seconds',
        benchmarkField: 'plankHold',
      },
      {
        id: 'bc_run',
        name: '1.5-Mile Run',
        type: 'timed_run',
        scoringType: 'time_lower_better',
        description: 'Timed 1.5-mile run',
        minimumMale: '11:00',
        minimumFemale: '13:00',
        unit: 'seconds',
        benchmarkField: 'runTime1_5mi',
      },
    ],
    eventOrder: ['bc_pullups', 'bc_pushups', 'bc_plank', 'bc_run'],
    energySystem: 'mixed',
    primaryQualities: ['pull_endurance', 'push_endurance', 'trunk_endurance', 'run_endurance', 'work_capacity'],
    restBetweenEvents: 'varies',
    totalTestDuration: '45-60 minutes',
    commonFailures: ['Insufficient base fitness', 'Recovery issues', 'Volume tolerance'],
    trainingEmphasis: ['Volume tolerance', 'Recovery', 'General conditioning', 'Mental toughness'],
  },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getTestConfig(testId: MilitaryTest): MilitaryTestConfig {
  return TEST_CONFIGS[testId]
}

export function getTestsForBranch(branch: MilitaryBranch): MilitaryTest[] {
  return BRANCH_TESTS[branch]
}

export function getBenchmarkFieldsForTest(testId: MilitaryTest): string[] {
  const config = TEST_CONFIGS[testId]
  return config.events.map(e => e.benchmarkField)
}

export function createEmptyMilitaryProfile(): MilitaryProfile {
  return {
    branch: null,
    targetTest: null,
    status: null,
    goalPriority: null,
    testDate: null,
    currentBenchmarks: {},
    equipment: {
      hasTrack: false,
      hasTreadmill: false,
      hasPullUpBar: true,
      hasWeights: false,
      hasSled: false,
      hasAmmoCan: false,
      hasMedicineBall: false,
      hasSandbag: false,
    },
    injuries: [],
  }
}

export function getRelevantBenchmarkInputs(testId: MilitaryTest | null): { field: keyof MilitaryBenchmarks; label: string; unit: string; placeholder: string }[] {
  if (!testId) return []
  
  const config = TEST_CONFIGS[testId]
  return config.events.map(event => ({
    field: event.benchmarkField as keyof MilitaryBenchmarks,
    label: event.name,
    unit: event.unit,
    placeholder: event.minimumMale || '0',
  }))
}
