/**
 * Endurance and Density Training Configuration
 * 
 * Structured support for:
 * - Density circuits
 * - Repeat effort work
 * - Interval conditioning
 * - Work-capacity blocks
 * - Fatigue tolerance development
 * - Time-capped conditioning finishers
 * - Military performance conditioning
 * 
 * This is NOT one-size-fits-all endurance.
 * The engine intelligently selects appropriate protocols.
 */

import type { PrimaryTrainingOutcome } from './athlete-profile'
import type { ExperienceLevel } from './program-service'

// =============================================================================
// ENDURANCE TRAINING TYPES
// =============================================================================

export type EnduranceProtocol =
  | 'density_circuit'
  | 'repeat_effort'
  | 'interval_conditioning'
  | 'work_capacity'
  | 'fatigue_tolerance'
  | 'timed_finisher'
  | 'running_integration'
  | 'max_rep_development'
  | 'test_simulation'

export interface EnduranceProtocolConfig {
  id: EnduranceProtocol
  name: string
  description: string
  // When to use this protocol
  applicability: {
    outcomes: PrimaryTrainingOutcome[]
    experienceLevels?: ExperienceLevel[]
    primaryUseCase: string
  }
  // Protocol parameters
  structure: {
    workPeriodSeconds: [number, number] // Range
    restPeriodSeconds: [number, number]
    rounds: [number, number]
    exercises: number
  }
  // Intensity guidelines
  intensity: {
    rpeTarget: [number, number] // RPE range
    heartRateZone?: 'zone2' | 'zone3' | 'zone4' | 'zone5'
    effortDescription: string
  }
  // Session placement
  placement: 'primary' | 'secondary' | 'finisher' | 'standalone'
  // Duration
  typicalDurationMinutes: [number, number]
}

// =============================================================================
// PROTOCOL DEFINITIONS
// =============================================================================

export const ENDURANCE_PROTOCOLS: Record<EnduranceProtocol, EnduranceProtocolConfig> = {
  density_circuit: {
    id: 'density_circuit',
    name: 'Density Circuit',
    description: 'Maximum quality work within a fixed time window',
    applicability: {
      outcomes: ['endurance', 'max_reps', 'military', 'general_fitness'],
      primaryUseCase: 'Build work capacity and conditioning with minimal equipment',
    },
    structure: {
      workPeriodSeconds: [30, 60],
      restPeriodSeconds: [15, 30],
      rounds: [3, 5],
      exercises: 4,
    },
    intensity: {
      rpeTarget: [6, 8],
      heartRateZone: 'zone3',
      effortDescription: 'Challenging but sustainable pace',
    },
    placement: 'primary',
    typicalDurationMinutes: [12, 20],
  },

  repeat_effort: {
    id: 'repeat_effort',
    name: 'Repeat Effort Training',
    description: 'Multiple high-quality sets with incomplete recovery',
    applicability: {
      outcomes: ['max_reps', 'military', 'endurance'],
      primaryUseCase: 'Develop ability to perform repeatedly under fatigue',
    },
    structure: {
      workPeriodSeconds: [20, 40],
      restPeriodSeconds: [45, 90],
      rounds: [5, 10],
      exercises: 2,
    },
    intensity: {
      rpeTarget: [7, 9],
      effortDescription: 'Near-max effort with strategic rest',
    },
    placement: 'primary',
    typicalDurationMinutes: [15, 25],
  },

  interval_conditioning: {
    id: 'interval_conditioning',
    name: 'Interval Conditioning',
    description: 'Structured work-rest intervals for cardiovascular development',
    applicability: {
      outcomes: ['endurance', 'military', 'general_fitness'],
      primaryUseCase: 'Build aerobic and anaerobic capacity',
    },
    structure: {
      workPeriodSeconds: [30, 120],
      restPeriodSeconds: [30, 60],
      rounds: [6, 12],
      exercises: 1,
    },
    intensity: {
      rpeTarget: [7, 9],
      heartRateZone: 'zone4',
      effortDescription: 'Hard effort, controlled recovery',
    },
    placement: 'primary',
    typicalDurationMinutes: [15, 30],
  },

  work_capacity: {
    id: 'work_capacity',
    name: 'Work Capacity Block',
    description: 'Extended moderate-intensity work for building tolerance',
    applicability: {
      outcomes: ['endurance', 'general_fitness'],
      experienceLevels: ['intermediate', 'advanced'],
      primaryUseCase: 'Build overall training capacity and endurance base',
    },
    structure: {
      workPeriodSeconds: [60, 180],
      restPeriodSeconds: [30, 60],
      rounds: [4, 8],
      exercises: 3,
    },
    intensity: {
      rpeTarget: [5, 7],
      heartRateZone: 'zone3',
      effortDescription: 'Moderate, sustainable effort',
    },
    placement: 'primary',
    typicalDurationMinutes: [20, 35],
  },

  fatigue_tolerance: {
    id: 'fatigue_tolerance',
    name: 'Fatigue Tolerance Training',
    description: 'Push through fatigue with declining but acceptable performance',
    applicability: {
      outcomes: ['military', 'max_reps', 'endurance'],
      experienceLevels: ['intermediate', 'advanced'],
      primaryUseCase: 'Prepare for PT tests and high-fatigue situations',
    },
    structure: {
      workPeriodSeconds: [30, 60],
      restPeriodSeconds: [15, 30],
      rounds: [4, 6],
      exercises: 3,
    },
    intensity: {
      rpeTarget: [8, 10],
      effortDescription: 'Push to technical breakdown, not failure',
    },
    placement: 'secondary',
    typicalDurationMinutes: [10, 18],
  },

  timed_finisher: {
    id: 'timed_finisher',
    name: 'Timed Finisher',
    description: 'Short conditioning burst at end of session',
    applicability: {
      outcomes: ['endurance', 'max_reps', 'general_fitness', 'military'],
      primaryUseCase: 'Add conditioning without dominating the session',
    },
    structure: {
      workPeriodSeconds: [20, 45],
      restPeriodSeconds: [10, 20],
      rounds: [3, 5],
      exercises: 2,
    },
    intensity: {
      rpeTarget: [7, 9],
      heartRateZone: 'zone4',
      effortDescription: 'All-out effort for short duration',
    },
    placement: 'finisher',
    typicalDurationMinutes: [5, 10],
  },

  running_integration: {
    id: 'running_integration',
    name: 'Running Integration',
    description: 'Structured running intervals combined with calisthenics',
    applicability: {
      outcomes: ['military', 'endurance'],
      primaryUseCase: 'Build run fitness for PT tests',
    },
    structure: {
      workPeriodSeconds: [60, 300],
      restPeriodSeconds: [60, 120],
      rounds: [4, 8],
      exercises: 1,
    },
    intensity: {
      rpeTarget: [6, 8],
      heartRateZone: 'zone3',
      effortDescription: 'Conversational to tempo pace',
    },
    placement: 'primary',
    typicalDurationMinutes: [20, 40],
  },

  max_rep_development: {
    id: 'max_rep_development',
    name: 'Max Rep Development',
    description: 'Progressive approach to building max rep capacity',
    applicability: {
      outcomes: ['max_reps', 'military'],
      primaryUseCase: 'Increase pull-up, push-up, and dip maximums',
    },
    structure: {
      workPeriodSeconds: [15, 45],
      restPeriodSeconds: [60, 120],
      rounds: [4, 8],
      exercises: 1,
    },
    intensity: {
      rpeTarget: [7, 9],
      effortDescription: 'Leave 1-2 reps in reserve on most sets',
    },
    placement: 'primary',
    typicalDurationMinutes: [15, 25],
  },

  test_simulation: {
    id: 'test_simulation',
    name: 'Test Simulation',
    description: 'Practice test conditions and pacing strategy',
    applicability: {
      outcomes: ['military'],
      primaryUseCase: 'Prepare for actual PT test format',
    },
    structure: {
      workPeriodSeconds: [60, 120],
      restPeriodSeconds: [60, 180],
      rounds: [3, 5],
      exercises: 3,
    },
    intensity: {
      rpeTarget: [8, 10],
      effortDescription: 'Test-day effort and pacing',
    },
    placement: 'standalone',
    typicalDurationMinutes: [25, 45],
  },
}

// =============================================================================
// PROTOCOL SELECTION LOGIC
// =============================================================================

export interface EnduranceProtocolContext {
  outcome: PrimaryTrainingOutcome
  experienceLevel: ExperienceLevel
  sessionRole: 'primary' | 'secondary' | 'finisher'
  availableMinutes: number
  hasRunningCapability: boolean
  militaryTestType?: string
}

/**
 * Select appropriate endurance protocol based on context
 */
export function selectEnduranceProtocol(context: EnduranceProtocolContext): EnduranceProtocolConfig {
  const { outcome, experienceLevel, sessionRole, availableMinutes, hasRunningCapability, militaryTestType } = context
  
  // Filter protocols by applicability
  const applicable = Object.values(ENDURANCE_PROTOCOLS).filter(protocol => {
    // Must match outcome
    if (!protocol.applicability.outcomes.includes(outcome)) return false
    
    // Check experience level if specified
    if (protocol.applicability.experienceLevels && 
        !protocol.applicability.experienceLevels.includes(experienceLevel)) return false
    
    // Check placement matches session role
    if (sessionRole === 'finisher' && protocol.placement !== 'finisher') return false
    if (sessionRole === 'primary' && protocol.placement === 'finisher') return false
    
    // Check duration fits
    if (availableMinutes < protocol.typicalDurationMinutes[0]) return false
    
    return true
  })
  
  if (applicable.length === 0) {
    // Default to density circuit
    return ENDURANCE_PROTOCOLS.density_circuit
  }
  
  // Priority selection logic
  if (outcome === 'military' && militaryTestType) {
    // Prefer test simulation for military prep
    const testSim = applicable.find(p => p.id === 'test_simulation')
    if (testSim && sessionRole === 'primary') return testSim
    
    // Otherwise prefer fatigue tolerance
    const fatigueTolerance = applicable.find(p => p.id === 'fatigue_tolerance')
    if (fatigueTolerance) return fatigueTolerance
  }
  
  if (outcome === 'max_reps') {
    // Prefer max rep development or repeat effort
    const maxRep = applicable.find(p => p.id === 'max_rep_development')
    if (maxRep) return maxRep
    
    const repeat = applicable.find(p => p.id === 'repeat_effort')
    if (repeat) return repeat
  }
  
  if (outcome === 'endurance') {
    // Check if running is available and desired
    if (hasRunningCapability) {
      const running = applicable.find(p => p.id === 'running_integration')
      if (running) return running
    }
    
    // Otherwise prefer interval or work capacity
    const workCapacity = applicable.find(p => p.id === 'work_capacity')
    if (workCapacity && experienceLevel !== 'beginner') return workCapacity
    
    const interval = applicable.find(p => p.id === 'interval_conditioning')
    if (interval) return interval
  }
  
  // Default to density circuit - works for most situations
  return applicable.find(p => p.id === 'density_circuit') || applicable[0]
}

// =============================================================================
// MAX REP DEVELOPMENT SYSTEM
// =============================================================================

export interface MaxRepWave {
  weekNumber: number
  setStructure: string
  targetRPE: number
  notes: string
}

export interface MaxRepProgressionPlan {
  exercise: string
  currentMax: number
  targetMax: number
  weeklyWaves: MaxRepWave[]
  supplementaryWork: string[]
  recoveryGuidelines: string[]
}

/**
 * Generate max rep progression plan (inspired by layered endurance approach)
 */
export function generateMaxRepPlan(
  exercise: 'pull_up' | 'push_up' | 'dip',
  currentMax: number,
  weeksAvailable: number
): MaxRepProgressionPlan {
  const targetMax = Math.ceil(currentMax * 1.15) // 15% improvement goal
  
  const waves: MaxRepWave[] = []
  
  // Wave 1: Volume accumulation
  for (let week = 1; week <= Math.ceil(weeksAvailable / 3); week++) {
    waves.push({
      weekNumber: week,
      setStructure: `5-6 sets x ${Math.floor(currentMax * 0.6)}-${Math.floor(currentMax * 0.7)} reps`,
      targetRPE: 7,
      notes: 'Build volume tolerance, leave reps in reserve',
    })
  }
  
  // Wave 2: Density phase
  for (let week = Math.ceil(weeksAvailable / 3) + 1; week <= Math.ceil(weeksAvailable * 2 / 3); week++) {
    waves.push({
      weekNumber: week,
      setStructure: `4-5 sets x ${Math.floor(currentMax * 0.75)}-${Math.floor(currentMax * 0.85)} reps`,
      targetRPE: 8,
      notes: 'Increase density, reduce rest between sets',
    })
  }
  
  // Wave 3: Peak phase
  for (let week = Math.ceil(weeksAvailable * 2 / 3) + 1; week <= weeksAvailable; week++) {
    waves.push({
      weekNumber: week,
      setStructure: `3-4 sets x ${Math.floor(currentMax * 0.85)}-${currentMax} reps`,
      targetRPE: 9,
      notes: 'Near-max efforts, full recovery between sets',
    })
  }
  
  const supplementaryWork: Record<string, string[]> = {
    pull_up: ['Lat pulldowns', 'Inverted rows', 'Scapular pull-ups', 'Dead hangs'],
    push_up: ['Diamond push-ups', 'Incline push-ups', 'Dips', 'Plank holds'],
    dip: ['Push-ups', 'Bench dips', 'Tricep extensions', 'Support holds'],
  }
  
  return {
    exercise,
    currentMax,
    targetMax,
    weeklyWaves: waves,
    supplementaryWork: supplementaryWork[exercise],
    recoveryGuidelines: [
      'Sleep 7-9 hours per night',
      'Allow 48+ hours between max effort sessions',
      'Monitor joint health, especially elbows and shoulders',
      'Include deload weeks every 4-6 weeks',
    ],
  }
}

// =============================================================================
// MILITARY TEST-SPECIFIC CONDITIONING
// =============================================================================

export interface MilitaryConditioningBlock {
  testType: string
  primaryFocus: string
  conditioningProtocol: EnduranceProtocol
  eventSimulation: {
    events: string[]
    restBetweenEvents: number
    totalDuration: number
  }
  weeklyStructure: {
    runDays: number
    calisthenicsConditioningDays: number
    restDays: number
  }
}

export const MILITARY_CONDITIONING_BLOCKS: Record<string, MilitaryConditioningBlock> = {
  marine_pft: {
    testType: 'Marine Corps PFT',
    primaryFocus: 'Pull-ups, plank endurance, 3-mile run',
    conditioningProtocol: 'repeat_effort',
    eventSimulation: {
      events: ['Pull-ups', 'Plank hold', '3-mile run'],
      restBetweenEvents: 120,
      totalDuration: 35,
    },
    weeklyStructure: {
      runDays: 3,
      calisthenicsConditioningDays: 3,
      restDays: 1,
    },
  },
  marine_cft: {
    testType: 'Marine Corps CFT',
    primaryFocus: 'Movement to contact, ammo lifts, MANUF',
    conditioningProtocol: 'fatigue_tolerance',
    eventSimulation: {
      events: ['880m run', 'Ammo can lifts', 'MANUF (movement under fire)'],
      restBetweenEvents: 180,
      totalDuration: 25,
    },
    weeklyStructure: {
      runDays: 2,
      calisthenicsConditioningDays: 4,
      restDays: 1,
    },
  },
  army_acft: {
    testType: 'Army ACFT',
    primaryFocus: 'Deadlift, power throw, push-ups, sprint-drag-carry, plank, 2-mile run',
    conditioningProtocol: 'interval_conditioning',
    eventSimulation: {
      events: ['Deadlift', 'Standing power throw', 'Push-ups', 'Sprint-drag-carry', 'Plank', '2-mile run'],
      restBetweenEvents: 180,
      totalDuration: 50,
    },
    weeklyStructure: {
      runDays: 2,
      calisthenicsConditioningDays: 3,
      restDays: 2,
    },
  },
  navy_prt: {
    testType: 'Navy PRT',
    primaryFocus: 'Push-ups, plank, cardio (1.5-mile run or row)',
    conditioningProtocol: 'density_circuit',
    eventSimulation: {
      events: ['Push-ups', 'Plank', '1.5-mile run'],
      restBetweenEvents: 120,
      totalDuration: 20,
    },
    weeklyStructure: {
      runDays: 3,
      calisthenicsConditioningDays: 3,
      restDays: 1,
    },
  },
}

/**
 * Get military conditioning recommendations
 */
export function getMilitaryConditioningPlan(testType: string): MilitaryConditioningBlock | null {
  return MILITARY_CONDITIONING_BLOCKS[testType] || null
}
