/**
 * Adaptive Training Cycle Engine
 * 
 * Manages intelligent training cycle transitions based on athlete progress,
 * fatigue, and plateaus. Unlike the static training-cycle-engine.ts which 
 * defines cycle structures, this engine manages the DYNAMIC state and transitions.
 * 
 * Core Responsibilities:
 * - Track current cycle state per athlete
 * - Detect when cycle transitions should occur
 * - Respond to progress, fatigue, and plateau signals
 * - Integrate with framework selection, envelope, and weak points
 * - Provide concise cycle explanations
 * 
 * Design Principles:
 * - Cycles are adaptive, not fixed time-based
 * - Transitions are stable (no rapid switching)
 * - Progress-driven, not calendar-driven
 * - Deterministic and explainable
 */

import type { PerformanceEnvelope } from './performance-envelope-engine'
import type { WeakPointAssessment, WeakPointType } from './weak-point-engine'
import type { FatigueDecision, TrainingDecision } from './fatigue-decision-engine'
import type { PrimaryGoal, ExperienceLevel } from './program-service'
import type { CycleType, CycleFocus, TrainingCycle } from './training-cycle-engine'
import { ALL_TRAINING_CYCLES, DELOAD_CYCLE, MIXED_DEVELOPMENT_CYCLE } from './training-cycle-engine'
import {
  generateReadinessSignalsForCycle,
  type AthleteReadinessSummary,
  type ReadinessSignalsForCycle,
} from './unified-readiness-integration'

// =============================================================================
// ADAPTIVE CYCLE TYPES
// =============================================================================

/**
 * The current phase within an adaptive training cycle
 * These are the operational states, not just cycle types
 */
export type AdaptiveCyclePhase =
  | 'accumulation'      // Building work capacity, moderate volume
  | 'intensification'   // Increasing intensity, strength focus
  | 'skill_emphasis'    // High skill frequency, technique focus
  | 'fatigue_management' // Reducing load to recover
  | 'plateau_adjustment' // Breaking stagnation
  | 'peak_preparation'  // Preparing for max attempts
  | 'maintenance'       // Holding gains during life stress

/**
 * The active training cycle state for an athlete
 */
export interface AdaptiveCycleState {
  cycleId: string
  athleteId: string
  
  // Current cycle info
  currentCycleType: CycleType
  currentPhase: AdaptiveCyclePhase
  cycleFocus: CycleFocus
  
  // Timing
  cycleStartDate: Date
  phaseStartDate: Date
  cycleWeek: number
  phaseWeek: number
  
  // Progress tracking
  cycleProgress: number // 0-100, overall progress in cycle
  phaseProgress: number // 0-100, progress in current phase
  progressTrend: 'improving' | 'stable' | 'declining' | 'stalled'
  
  // Fatigue tracking
  fatigueTrend: 'low' | 'moderate' | 'elevated' | 'high'
  fatigueAccumulation: number // 0-100
  
  // Transition signals
  transitionSignals: CycleTransitionSignal[]
  pendingTransition: AdaptiveCyclePhase | null
  transitionConfidence: number // 0-1
  
  // Framework context
  frameworkId: string | null
  frameworkName: string | null
  
  // Metadata
  lastEvaluated: Date
  cycleConfidence: number // 0-1, confidence in cycle suitability
}

/**
 * Signals that indicate a cycle transition may be needed
 */
export interface CycleTransitionSignal {
  signalType: CycleTransitionSignalType
  strength: number // 0-1
  timestamp: Date
  description: string
}

export type CycleTransitionSignalType =
  | 'benchmark_improvement'    // Significant benchmark progress
  | 'benchmark_stagnation'     // No benchmark progress over time
  | 'skill_breakthrough'       // Skill level increased
  | 'skill_stall'             // Skill progress stalled
  | 'fatigue_accumulation'    // Fatigue building up
  | 'fatigue_resolved'        // Fatigue successfully reduced
  | 'readiness_decline'       // Readiness dropping
  | 'readiness_recovery'      // Readiness improving
  | 'readiness_high'          // High skill readiness detected (NEW)
  | 'readiness_low'           // Low skill readiness detected (NEW)
  | 'readiness_emphasis'      // Readiness suggests different emphasis (NEW)
  | 'time_based'              // Minimum cycle duration reached
  | 'framework_shift'         // Framework changed
  | 'goal_change'             // Athlete changed goals
  | 'plateau_detected'        // Repeated stagnation
  | 'user_requested'          // Athlete requested change

// =============================================================================
// PHASE DEFINITIONS
// =============================================================================

interface PhaseDefinition {
  phase: AdaptiveCyclePhase
  name: string
  description: string
  characteristics: {
    volumeModifier: number     // 0.5 - 1.5, multiply base volume
    intensityModifier: number  // 0.5 - 1.5, multiply intensity
    skillFrequency: 'low' | 'moderate' | 'high'
    progressionRate: 'conservative' | 'moderate' | 'aggressive'
    recoveryEmphasis: 'low' | 'moderate' | 'high'
  }
  entryConditions: string[]
  exitConditions: string[]
  typicalDurationWeeks: { min: number; max: number }
  followUpPhases: AdaptiveCyclePhase[]
}

export const PHASE_DEFINITIONS: Record<AdaptiveCyclePhase, PhaseDefinition> = {
  accumulation: {
    phase: 'accumulation',
    name: 'Accumulation',
    description: 'Building work capacity and establishing training foundations.',
    characteristics: {
      volumeModifier: 1.1,
      intensityModifier: 0.85,
      skillFrequency: 'moderate',
      progressionRate: 'moderate',
      recoveryEmphasis: 'moderate',
    },
    entryConditions: [
      'After deload or rest period',
      'Start of new training block',
      'After major regeneration',
    ],
    exitConditions: [
      'Work capacity established (4-6 weeks)',
      'Ready for higher intensity',
      'Fatigue building',
    ],
    typicalDurationWeeks: { min: 3, max: 6 },
    followUpPhases: ['intensification', 'skill_emphasis', 'fatigue_management'],
  },
  
  intensification: {
    phase: 'intensification',
    name: 'Intensification',
    description: 'Increasing intensity to drive strength and skill gains.',
    characteristics: {
      volumeModifier: 0.9,
      intensityModifier: 1.15,
      skillFrequency: 'moderate',
      progressionRate: 'aggressive',
      recoveryEmphasis: 'moderate',
    },
    entryConditions: [
      'Work capacity established',
      'Readiness high',
      'Ready for progression push',
    ],
    exitConditions: [
      'Progress achieved (3-5 weeks)',
      'Fatigue accumulating',
      'Plateau detected',
    ],
    typicalDurationWeeks: { min: 2, max: 5 },
    followUpPhases: ['accumulation', 'fatigue_management', 'plateau_adjustment'],
  },
  
  skill_emphasis: {
    phase: 'skill_emphasis',
    name: 'Skill Emphasis',
    description: 'High frequency skill work with reduced overall volume.',
    characteristics: {
      volumeModifier: 0.85,
      intensityModifier: 0.9,
      skillFrequency: 'high',
      progressionRate: 'conservative',
      recoveryEmphasis: 'moderate',
    },
    entryConditions: [
      'Skill is primary limiter',
      'Strength base established',
      'Good recovery status',
    ],
    exitConditions: [
      'Skill breakthrough achieved',
      'Need to rebuild strength base',
      'Fatigue from high frequency',
    ],
    typicalDurationWeeks: { min: 3, max: 6 },
    followUpPhases: ['accumulation', 'intensification', 'fatigue_management'],
  },
  
  fatigue_management: {
    phase: 'fatigue_management',
    name: 'Fatigue Management',
    description: 'Reducing accumulated fatigue while maintaining adaptations.',
    characteristics: {
      volumeModifier: 0.6,
      intensityModifier: 0.75,
      skillFrequency: 'low',
      progressionRate: 'conservative',
      recoveryEmphasis: 'high',
    },
    entryConditions: [
      'Elevated fatigue signals',
      'Performance declining',
      'Recovery needs accumulating',
    ],
    exitConditions: [
      'Fatigue resolved (1-2 weeks)',
      'Readiness restored',
      'Energy returning',
    ],
    typicalDurationWeeks: { min: 1, max: 2 },
    followUpPhases: ['accumulation', 'skill_emphasis', 'intensification'],
  },
  
  plateau_adjustment: {
    phase: 'plateau_adjustment',
    name: 'Plateau Adjustment',
    description: 'Breaking stagnation with varied training stimulus.',
    characteristics: {
      volumeModifier: 0.95,
      intensityModifier: 1.0,
      skillFrequency: 'moderate',
      progressionRate: 'moderate',
      recoveryEmphasis: 'moderate',
    },
    entryConditions: [
      'Progress stalled for 2+ weeks',
      'Same inputs no longer producing results',
      'Mental staleness',
    ],
    exitConditions: [
      'Progress resumes',
      'New stimulus taking effect',
      'Framework adjustment complete',
    ],
    typicalDurationWeeks: { min: 2, max: 4 },
    followUpPhases: ['intensification', 'accumulation', 'skill_emphasis'],
  },
  
  peak_preparation: {
    phase: 'peak_preparation',
    name: 'Peak Preparation',
    description: 'Tapering for maximum performance on test or goal.',
    characteristics: {
      volumeModifier: 0.5,
      intensityModifier: 1.1,
      skillFrequency: 'moderate',
      progressionRate: 'conservative',
      recoveryEmphasis: 'high',
    },
    entryConditions: [
      'Approaching benchmark test',
      'Good base established',
      'Specific goal date',
    ],
    exitConditions: [
      'Test completed',
      'Peak period passed',
    ],
    typicalDurationWeeks: { min: 1, max: 2 },
    followUpPhases: ['fatigue_management', 'accumulation'],
  },
  
  maintenance: {
    phase: 'maintenance',
    name: 'Maintenance',
    description: 'Holding gains during periods of life stress or reduced availability.',
    characteristics: {
      volumeModifier: 0.7,
      intensityModifier: 0.85,
      skillFrequency: 'low',
      progressionRate: 'conservative',
      recoveryEmphasis: 'moderate',
    },
    entryConditions: [
      'Life stress elevated',
      'Reduced training availability',
      'Need to preserve gains',
    ],
    exitConditions: [
      'Life stress resolved',
      'Ready to resume progression',
    ],
    typicalDurationWeeks: { min: 1, max: 8 },
    followUpPhases: ['accumulation', 'skill_emphasis'],
  },
}

// =============================================================================
// TRANSITION DETECTION
// =============================================================================

interface TransitionContext {
  currentState: AdaptiveCycleState
  fatigueDecision: FatigueDecision | null
  weakPointAssessment: WeakPointAssessment | null
  envelope: PerformanceEnvelope | null
  benchmarkTrend: 'improving' | 'stable' | 'declining' | null
  skillProgress: 'improving' | 'stable' | 'stalled' | null
  daysSincePhaseStart: number
  // Readiness integration
  readinessSummary?: AthleteReadinessSummary | null
}

/**
 * Analyze whether a phase transition should occur
 */
export function analyzePhaseTransition(context: TransitionContext): {
  shouldTransition: boolean
  recommendedPhase: AdaptiveCyclePhase | null
  confidence: number
  reason: string
  signals: CycleTransitionSignal[]
} {
  const signals: CycleTransitionSignal[] = []
  const { currentState, fatigueDecision, benchmarkTrend, skillProgress, daysSincePhaseStart } = context
  const currentPhase = currentState.currentPhase
  const phaseDef = PHASE_DEFINITIONS[currentPhase]
  
  // Collect transition signals
  
  // 1. Fatigue signals
  if (fatigueDecision) {
    if (fatigueDecision.decision === 'DELOAD_RECOMMENDED') {
      signals.push({
        signalType: 'fatigue_accumulation',
        strength: 0.9,
        timestamp: new Date(),
        description: 'Fatigue has accumulated to the point where a recovery phase is recommended.',
      })
    } else if (fatigueDecision.decision === 'LIGHTEN_SESSION') {
      signals.push({
        signalType: 'fatigue_accumulation',
        strength: 0.5,
        timestamp: new Date(),
        description: 'Fatigue is elevated and affecting training quality.',
      })
    }
  }
  
  // 2. Progress signals
  if (benchmarkTrend === 'improving') {
    signals.push({
      signalType: 'benchmark_improvement',
      strength: 0.7,
      timestamp: new Date(),
      description: 'Benchmark tests show consistent improvement.',
    })
  } else if (benchmarkTrend === 'declining' || benchmarkTrend === 'stable') {
    const isStalled = currentState.progressTrend === 'stalled'
    if (isStalled || (benchmarkTrend === 'stable' && daysSincePhaseStart > 14)) {
      signals.push({
        signalType: 'benchmark_stagnation',
        strength: isStalled ? 0.8 : 0.5,
        timestamp: new Date(),
        description: 'Progress has stalled despite consistent training.',
      })
    }
  }
  
  // 3. Skill progress signals
  if (skillProgress === 'improving') {
    signals.push({
      signalType: 'skill_breakthrough',
      strength: 0.8,
      timestamp: new Date(),
      description: 'Skill level has improved.',
    })
  } else if (skillProgress === 'stalled' && daysSincePhaseStart > 14) {
    signals.push({
      signalType: 'skill_stall',
      strength: 0.6,
      timestamp: new Date(),
      description: 'Skill progress has stalled.',
    })
  }
  
  // 3.5. Readiness-based signals (NEW)
  if (context.readinessSummary) {
    const readinessSignals = generateReadinessSignalsForCycle(context.readinessSummary)
    
    // High readiness = ready for intensification or skill focus
    if (readinessSignals.overallReadiness >= 70 && readinessSignals.progressPotential === 'high') {
      signals.push({
        signalType: 'readiness_high',
        strength: 0.7,
        timestamp: new Date(),
        description: `High skill readiness (${readinessSignals.overallReadiness}%) suggests readiness for intensification.`,
      })
    }
    
    // Low readiness = need accumulation
    if (readinessSignals.overallReadiness < 40) {
      signals.push({
        signalType: 'readiness_low',
        strength: 0.6,
        timestamp: new Date(),
        description: `Low readiness (${readinessSignals.overallReadiness}%) suggests focus on building foundations.`,
      })
    }
    
    // Readiness suggests specific emphasis
    if (readinessSignals.suggestedEmphasis !== currentPhase && readinessSignals.dataConfidence > 0.5) {
      signals.push({
        signalType: 'readiness_emphasis',
        strength: readinessSignals.dataConfidence * 0.6,
        timestamp: new Date(),
        description: `Readiness analysis suggests ${readinessSignals.suggestedEmphasis} emphasis.`,
      })
    }
  }
  
  // 4. Time-based signals (minimum duration reached)
  const minWeeks = phaseDef.typicalDurationWeeks.min
  const maxWeeks = phaseDef.typicalDurationWeeks.max
  const weeksInPhase = daysSincePhaseStart / 7
  
  if (weeksInPhase >= minWeeks) {
    signals.push({
      signalType: 'time_based',
      strength: weeksInPhase >= maxWeeks ? 0.7 : 0.3,
      timestamp: new Date(),
      description: `Minimum phase duration (${minWeeks} weeks) has been reached.`,
    })
  }
  
  // Determine recommended transition
  let recommendedPhase: AdaptiveCyclePhase | null = null
  let transitionReason = ''
  let shouldTransition = false
  
  // Calculate signal strength
  const fatigueSignals = signals.filter(s => s.signalType === 'fatigue_accumulation')
  const progressSignals = signals.filter(s => 
    s.signalType === 'benchmark_improvement' || s.signalType === 'skill_breakthrough'
  )
  const stagnationSignals = signals.filter(s => 
    s.signalType === 'benchmark_stagnation' || s.signalType === 'skill_stall' || s.signalType === 'plateau_detected'
  )
  
  const maxFatigueStrength = Math.max(...fatigueSignals.map(s => s.strength), 0)
  const maxProgressStrength = Math.max(...progressSignals.map(s => s.strength), 0)
  const maxStagnationStrength = Math.max(...stagnationSignals.map(s => s.strength), 0)
  
  // Decision logic based on current phase
  if (currentPhase === 'accumulation') {
    if (maxFatigueStrength >= 0.7) {
      recommendedPhase = 'fatigue_management'
      transitionReason = 'Fatigue has accumulated. A recovery phase will help restore readiness.'
      shouldTransition = true
    } else if (maxProgressStrength >= 0.6 && weeksInPhase >= minWeeks) {
      recommendedPhase = 'intensification'
      transitionReason = 'Work capacity established. Ready to increase training intensity.'
      shouldTransition = true
    } else if (weeksInPhase >= maxWeeks) {
      recommendedPhase = 'intensification'
      transitionReason = 'Accumulation phase complete. Transitioning to intensification.'
      shouldTransition = true
    }
  } else if (currentPhase === 'intensification') {
    if (maxFatigueStrength >= 0.6) {
      recommendedPhase = 'fatigue_management'
      transitionReason = 'High intensity has accumulated fatigue. Recovery phase needed.'
      shouldTransition = true
    } else if (maxStagnationStrength >= 0.6) {
      recommendedPhase = 'plateau_adjustment'
      transitionReason = 'Progress has stalled. Adjusting training stimulus to break plateau.'
      shouldTransition = true
    } else if (maxProgressStrength >= 0.7 && weeksInPhase >= minWeeks) {
      recommendedPhase = 'accumulation'
      transitionReason = 'Strength gains achieved. Building work capacity for next push.'
      shouldTransition = true
    }
  } else if (currentPhase === 'skill_emphasis') {
    if (maxFatigueStrength >= 0.6) {
      recommendedPhase = 'fatigue_management'
      transitionReason = 'Skill frequency has accumulated fatigue. Recovery needed.'
      shouldTransition = true
    } else if (maxProgressStrength >= 0.8) {
      recommendedPhase = 'accumulation'
      transitionReason = 'Skill breakthrough achieved. Building base for continued progress.'
      shouldTransition = true
    } else if (weeksInPhase >= maxWeeks) {
      recommendedPhase = 'accumulation'
      transitionReason = 'Skill emphasis phase complete. Returning to balanced training.'
      shouldTransition = true
    }
  } else if (currentPhase === 'fatigue_management') {
    // Always look for fatigue resolution
    if (maxFatigueStrength < 0.3 && weeksInPhase >= 1) {
      recommendedPhase = 'accumulation'
      transitionReason = 'Fatigue resolved. Ready to resume productive training.'
      shouldTransition = true
    } else if (weeksInPhase >= maxWeeks) {
      recommendedPhase = 'accumulation'
      transitionReason = 'Recovery period complete. Returning to accumulation phase.'
      shouldTransition = true
    }
  } else if (currentPhase === 'plateau_adjustment') {
    if (maxProgressStrength >= 0.5) {
      recommendedPhase = 'intensification'
      transitionReason = 'Plateau broken. Progress resuming with new stimulus.'
      shouldTransition = true
    } else if (weeksInPhase >= maxWeeks) {
      recommendedPhase = 'accumulation'
      transitionReason = 'Adjustment period complete. Rebuilding with fresh approach.'
      shouldTransition = true
    }
  }
  
  // Calculate confidence
  const totalSignalStrength = signals.reduce((sum, s) => sum + s.strength, 0)
  const confidence = shouldTransition
    ? Math.min(1, 0.5 + (totalSignalStrength / signals.length) * 0.5)
    : 0
  
  return {
    shouldTransition,
    recommendedPhase,
    confidence,
    reason: transitionReason,
    signals,
  }
}

// =============================================================================
// CYCLE STATE MANAGEMENT
// =============================================================================

/**
 * Initialize a new adaptive cycle state for an athlete
 */
export function initializeAdaptiveCycleState(
  athleteId: string,
  primaryGoal: PrimaryGoal,
  experienceLevel: ExperienceLevel,
  frameworkId?: string,
  frameworkName?: string
): AdaptiveCycleState {
  const cycleFocus = mapGoalToCycleFocus(primaryGoal)
  const initialPhase: AdaptiveCyclePhase = experienceLevel === 'beginner' 
    ? 'accumulation' 
    : 'accumulation'
  
  return {
    cycleId: `cycle_${Date.now()}_${athleteId}`,
    athleteId,
    currentCycleType: 'mixed',
    currentPhase: initialPhase,
    cycleFocus,
    cycleStartDate: new Date(),
    phaseStartDate: new Date(),
    cycleWeek: 1,
    phaseWeek: 1,
    cycleProgress: 0,
    phaseProgress: 0,
    progressTrend: 'stable',
    fatigueTrend: 'low',
    fatigueAccumulation: 0,
    transitionSignals: [],
    pendingTransition: null,
    transitionConfidence: 0,
    frameworkId: frameworkId || null,
    frameworkName: frameworkName || null,
    lastEvaluated: new Date(),
    cycleConfidence: 0.5,
  }
}

function mapGoalToCycleFocus(goal: PrimaryGoal): CycleFocus {
  const mapping: Record<string, CycleFocus> = {
    front_lever: 'front_lever',
    planche: 'planche',
    muscle_up: 'muscle_up',
    iron_cross: 'iron_cross',
    one_arm_pull_up: 'one_arm_pull_up',
    handstand: 'handstand',
    hspu: 'upper_body',
    weighted_pull: 'weighted_pull',
    weighted_dip: 'weighted_dip',
    strength: 'full_body',
    hypertrophy: 'upper_body',
    general: 'general',
    military: 'full_body',
  }
  return mapping[goal] || 'general'
}

/**
 * Update cycle state based on workout completion
 */
export function updateCycleStateAfterWorkout(
  state: AdaptiveCycleState,
  fatigueDecision: FatigueDecision | null,
  performanceResult: 'improved' | 'maintained' | 'declined' | null
): AdaptiveCycleState {
  const now = new Date()
  const daysSincePhaseStart = Math.floor(
    (now.getTime() - state.phaseStartDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  // Update fatigue tracking
  let newFatigueTrend = state.fatigueTrend
  let newFatigueAccumulation = state.fatigueAccumulation
  
  if (fatigueDecision) {
    if (fatigueDecision.decision === 'DELOAD_RECOMMENDED') {
      newFatigueTrend = 'high'
      newFatigueAccumulation = Math.min(100, state.fatigueAccumulation + 15)
    } else if (fatigueDecision.decision === 'LIGHTEN_SESSION') {
      newFatigueTrend = 'elevated'
      newFatigueAccumulation = Math.min(100, state.fatigueAccumulation + 8)
    } else if (fatigueDecision.decision === 'PRESERVE_QUALITY') {
      newFatigueTrend = 'moderate'
      newFatigueAccumulation = Math.min(100, state.fatigueAccumulation + 3)
    } else {
      newFatigueAccumulation = Math.max(0, state.fatigueAccumulation - 5)
      if (newFatigueAccumulation < 30) newFatigueTrend = 'low'
      else if (newFatigueAccumulation < 50) newFatigueTrend = 'moderate'
    }
  }
  
  // Update progress tracking
  let newProgressTrend = state.progressTrend
  if (performanceResult === 'improved') {
    newProgressTrend = 'improving'
  } else if (performanceResult === 'declined') {
    newProgressTrend = state.progressTrend === 'declining' ? 'stalled' : 'declining'
  } else if (performanceResult === 'maintained') {
    if (state.progressTrend === 'stable' && daysSincePhaseStart > 14) {
      newProgressTrend = 'stalled'
    } else {
      newProgressTrend = 'stable'
    }
  }
  
  // Update phase progress
  const phaseDef = PHASE_DEFINITIONS[state.currentPhase]
  const maxWeeks = phaseDef.typicalDurationWeeks.max
  const phaseWeek = Math.ceil(daysSincePhaseStart / 7)
  const phaseProgress = Math.min(100, (daysSincePhaseStart / (maxWeeks * 7)) * 100)
  
  return {
    ...state,
    phaseWeek,
    phaseProgress,
    progressTrend: newProgressTrend,
    fatigueTrend: newFatigueTrend,
    fatigueAccumulation: newFatigueAccumulation,
    lastEvaluated: now,
  }
}

/**
 * Transition to a new phase
 */
export function transitionToPhase(
  state: AdaptiveCycleState,
  newPhase: AdaptiveCyclePhase,
  reason: string
): AdaptiveCycleState {
  const now = new Date()
  
  // Add transition signal
  const transitionSignal: CycleTransitionSignal = {
    signalType: 'time_based', // Could be more specific based on actual reason
    strength: 1.0,
    timestamp: now,
    description: reason,
  }
  
  return {
    ...state,
    currentPhase: newPhase,
    phaseStartDate: now,
    phaseWeek: 1,
    phaseProgress: 0,
    transitionSignals: [...state.transitionSignals.slice(-9), transitionSignal],
    pendingTransition: null,
    transitionConfidence: 0,
    lastEvaluated: now,
  }
}

// =============================================================================
// CYCLE INFLUENCE ON PROGRAM BUILDER
// =============================================================================

/**
 * Get modifications to apply to program builder based on current cycle state
 */
export interface CycleBuilderModifications {
  volumeModifier: number
  intensityModifier: number
  skillFrequencyBonus: number // 0-2 extra skill sessions
  progressionAggressiveness: 'conservative' | 'moderate' | 'aggressive'
  recoveryEmphasis: 'low' | 'moderate' | 'high'
  priorityMovementFamilies: string[]
  reducedEmphasisFamilies: string[]
  sessionStructureHint: string
  repRangeAdjustment: { min: number; max: number } | null
  restPeriodAdjustment: { min: number; max: number } | null
}

export function getCycleBuilderModifications(
  state: AdaptiveCycleState,
  weakPoint: WeakPointAssessment | null
): CycleBuilderModifications {
  const phaseDef = PHASE_DEFINITIONS[state.currentPhase]
  const { characteristics } = phaseDef
  
  // Determine priority movement families based on weak points and cycle focus
  let priorityFamilies: string[] = []
  let reducedFamilies: string[] = []
  
  if (weakPoint?.primary) {
    priorityFamilies = weakPoint.primary.priorityExercises.slice(0, 3)
  }
  
  // Phase-specific adjustments
  if (state.currentPhase === 'fatigue_management') {
    reducedFamilies = ['straight_arm_pull', 'straight_arm_push', 'explosive']
  } else if (state.currentPhase === 'skill_emphasis') {
    priorityFamilies = [...priorityFamilies, 'skill_work', 'technique']
  }
  
  // Session structure hints
  let sessionHint = 'Balanced session structure.'
  if (state.currentPhase === 'accumulation') {
    sessionHint = 'Build volume gradually. Focus on movement quality across moderate intensities.'
  } else if (state.currentPhase === 'intensification') {
    sessionHint = 'Prioritize heavy work when fresh. Reduce accessories to preserve quality.'
  } else if (state.currentPhase === 'skill_emphasis') {
    sessionHint = 'Skill work first. Keep total fatigue low to maintain technical quality.'
  } else if (state.currentPhase === 'fatigue_management') {
    sessionHint = 'Reduce intensity and volume. Movement quality over progression.'
  } else if (state.currentPhase === 'plateau_adjustment') {
    sessionHint = 'Vary stimulus. Consider new exercises or rep ranges.'
  }
  
  return {
    volumeModifier: characteristics.volumeModifier,
    intensityModifier: characteristics.intensityModifier,
    skillFrequencyBonus: characteristics.skillFrequency === 'high' ? 1 : 0,
    progressionAggressiveness: characteristics.progressionRate,
    recoveryEmphasis: characteristics.recoveryEmphasis,
    priorityMovementFamilies: priorityFamilies,
    reducedEmphasisFamilies: reducedFamilies,
    sessionStructureHint: sessionHint,
    repRangeAdjustment: null,
    restPeriodAdjustment: state.currentPhase === 'fatigue_management'
      ? { min: 120, max: 180 }
      : null,
  }
}

// =============================================================================
// CYCLE EXPLANATIONS
// =============================================================================

/**
 * Generate concise cycle explanation for athlete
 */
export function generateCycleExplanation(state: AdaptiveCycleState): {
  headline: string
  description: string
  rationale: string
  nextSteps: string
} {
  const phaseDef = PHASE_DEFINITIONS[state.currentPhase]
  
  const explanations: Record<AdaptiveCyclePhase, {
    headline: string
    description: string
    rationale: string
    nextSteps: string
  }> = {
    accumulation: {
      headline: 'Building Your Training Base',
      description: 'This phase focuses on building work capacity and establishing solid training foundations.',
      rationale: 'A strong base allows for more aggressive progression in future phases.',
      nextSteps: 'Continue consistent training. Progress will accelerate once the base is established.',
    },
    intensification: {
      headline: 'Pushing Intensity',
      description: 'Your training is shifting to higher intensity to drive strength and skill gains.',
      rationale: 'Your base is established. Now is the time to push harder and make gains.',
      nextSteps: 'Focus on quality over volume. Rest adequately between heavy sessions.',
    },
    skill_emphasis: {
      headline: 'Skill Development Focus',
      description: 'Training emphasis has shifted to high-frequency skill work.',
      rationale: 'Skill is currently limiting your progress. More exposure will accelerate development.',
      nextSteps: 'Practice skills when fresh. Keep other training moderate to preserve quality.',
    },
    fatigue_management: {
      headline: 'Recovery Phase',
      description: 'A recovery phase was introduced to reduce accumulated fatigue.',
      rationale: 'Fatigue signals indicate you need recovery before more productive training.',
      nextSteps: 'Train lighter, sleep well, and trust the process. Recovery is part of progress.',
    },
    plateau_adjustment: {
      headline: 'Breaking the Plateau',
      description: 'Training stimulus is being varied to break through stagnation.',
      rationale: 'Progress has stalled. New stimulus will drive fresh adaptations.',
      nextSteps: 'Stay patient. The new approach will take 2-3 weeks to show results.',
    },
    peak_preparation: {
      headline: 'Preparing to Peak',
      description: 'Volume is reduced while maintaining intensity to peak performance.',
      rationale: 'You are approaching a test or goal. Tapering will maximize performance.',
      nextSteps: 'Trust your training. Focus on recovery and mental preparation.',
    },
    maintenance: {
      headline: 'Maintaining Gains',
      description: 'Training is adjusted to maintain progress during a busy period.',
      rationale: 'Life stress is elevated. Maintaining gains is the priority right now.',
      nextSteps: 'Do what you can. Consistency matters more than volume during this time.',
    },
  }
  
  return explanations[state.currentPhase]
}

/**
 * Generate transition explanation when phase changes
 */
export function generateTransitionExplanation(
  fromPhase: AdaptiveCyclePhase,
  toPhase: AdaptiveCyclePhase,
  reason: string
): string {
  const fromName = PHASE_DEFINITIONS[fromPhase].name
  const toName = PHASE_DEFINITIONS[toPhase].name
  
  return `Your training has transitioned from ${fromName} to ${toName}. ${reason}`
}

// =============================================================================
// CYCLE SELECTION FOR NEW ATHLETES
// =============================================================================

/**
 * Select initial training cycle for new athlete
 */
export function selectInitialCycle(
  primaryGoal: PrimaryGoal,
  experienceLevel: ExperienceLevel,
  weakPoint: WeakPointType | null
): TrainingCycle {
  // For new athletes, start with mixed development unless specific goal
  if (experienceLevel === 'beginner') {
    return MIXED_DEVELOPMENT_CYCLE
  }
  
  // Find matching skill cycle if skill goal
  const skillGoals = ['front_lever', 'planche', 'muscle_up', 'handstand', 'one_arm_pull_up', 'iron_cross']
  if (skillGoals.includes(primaryGoal)) {
    const matchingCycle = ALL_TRAINING_CYCLES.find(
      c => c.type === 'skill' && c.focus === primaryGoal
    )
    if (matchingCycle) return matchingCycle
  }
  
  // Find matching strength cycle
  if (primaryGoal === 'weighted_pull' || primaryGoal === 'weighted_dip') {
    const matchingCycle = ALL_TRAINING_CYCLES.find(
      c => c.type === 'strength' && c.focus === primaryGoal
    )
    if (matchingCycle) return matchingCycle
  }
  
  // Default to mixed
  return MIXED_DEVELOPMENT_CYCLE
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  PHASE_DEFINITIONS,
  type PhaseDefinition,
  type TransitionContext,
}
