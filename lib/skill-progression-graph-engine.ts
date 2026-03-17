/**
 * Skill Progression Graph Engine
 * 
 * Models each major calisthenics skill as a directed acyclic graph (DAG)
 * with explicit nodes, prerequisites, readiness gates, and progression paths.
 * 
 * This engine replaces loose progression lists with a structured graph that:
 * - Defines explicit progression nodes
 * - Enforces prerequisite relationships
 * - Gates advancement with readiness requirements
 * - Supports branching where appropriate
 * - Integrates with weak point detection and program generation
 */

import type { LimitingFactor } from './readiness/canonical-readiness-engine'
import type { WeakPointType } from './weak-point-engine'
import { MALTESE_GRAPH, PLANCHE_PUSHUP_GRAPH, FRONT_LEVER_PULLUP_GRAPH, SLOW_MUSCLE_UP_GRAPH } from './advanced-skill-graphs'

// =============================================================================
// CORE GRAPH TYPES
// =============================================================================

export type SkillGraphId = 
  | 'front_lever'
  | 'back_lever'
  | 'planche'
  | 'muscle_up'
  | 'handstand'
  | 'hspu'
  | 'l_sit'
  | 'v_sit'
  | 'iron_cross'
  | 'one_arm_pull_up'
  | 'ring_muscle_up'
  // Advanced skills and sub-skills
  | 'maltese'
  | 'planche_pushup'
  | 'pseudo_planche_pushup'
  | 'front_lever_pullup'
  | 'one_arm_front_lever_row'
  | 'slow_muscle_up'
  | 'weighted_muscle_up'

export type JointStressLevel = 
  | 'minimal'
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high'

export type MovementType =
  | 'isometric_hold'
  | 'dynamic_strength'
  | 'explosive'
  | 'balance'
  | 'transition'
  | 'negative'
  | 'assisted'

export type DifficultyLevel =
  | 'foundation'
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'elite'
  | 'master'

export type TransitionType =
  | 'progression'        // Standard linear progression
  | 'branch'             // Multiple valid paths
  | 'prerequisite'       // Must be completed before
  | 'alternative'        // Either/or path
  | 'support'            // Supporting skill that helps

// =============================================================================
// NODE DEFINITION
// =============================================================================

export interface BenchmarkRequirement {
  benchmarkType: 'pull_ups' | 'dips' | 'weighted_pull' | 'weighted_dip' | 'hold_time' | 'reps' | 'compression' | 'handstand_hold'
  minimumValue: number
  unit: 'reps' | 'seconds' | 'kg' | 'lb' | 'percent_bw'
  description: string
}

export interface ProgressionNode {
  nodeId: string
  skillId: SkillGraphId
  nodeName: string
  displayName: string
  description: string
  
  // Difficulty and categorization
  difficultyLevel: DifficultyLevel
  levelIndex: number  // Numeric order (0 = entry, higher = more advanced)
  movementType: MovementType
  
  // Requirements
  requiredBenchmarks: BenchmarkRequirement[]
  requiredReadinessScore: number  // 0-100
  requiredPrerequisiteNodes: string[]  // Node IDs that must be unlocked
  
  // Goals for this node
  holdTimeGoal?: number  // Seconds for isometric skills
  repsGoal?: number      // Reps for dynamic skills
  minimumForOwnership: number  // Minimum hold/reps to "own" this level
  
  // Coaching content
  knowledgeBubble: {
    shortTip: string
    detailedExplanation: string
    commonMistakes: string[]
    techniqueCues: string[]
  }
  
  // Safety and stress
  jointStressLevel: JointStressLevel
  primaryStressAreas: ('wrist' | 'shoulder' | 'elbow' | 'bicep_tendon' | 'forearm')[]
  
  // Training guidance
  recommendedFrequency: {
    sessionsPerWeek: number
    restDaysMinimum: number
  }
  
  // Visual/UI
  iconHint?: string
  color?: string
}

// =============================================================================
// EDGE DEFINITION
// =============================================================================

export interface ProgressionEdge {
  edgeId: string
  fromNodeId: string
  toNodeId: string
  transitionType: TransitionType
  
  // Requirements to traverse this edge
  minimumRequirements: {
    fromNodeHoldTime?: number
    fromNodeReps?: number
    additionalBenchmarks?: BenchmarkRequirement[]
    readinessThreshold?: number
  }
  
  // Metadata
  notes: string
  expectedTransitionWeeks: number  // Typical time to progress
  isRecommendedPath: boolean       // For branching, marks the "main" path
}

// =============================================================================
// GRAPH DEFINITION
// =============================================================================

export interface SkillProgressionGraph {
  skillId: SkillGraphId
  skillName: string
  description: string
  category: 'pull' | 'push' | 'static' | 'dynamic' | 'rings'
  
  // Graph structure
  nodes: ProgressionNode[]
  edges: ProgressionEdge[]
  
  // Special nodes
  entryNodeId: string      // Where beginners start
  terminalNodeIds: string[] // End goals (can be multiple for branching)
  
  // Global skill requirements
  globalPrerequisites: {
    description: string
    benchmarks: BenchmarkRequirement[]
  }
  
  // Safety
  generalSafetyWarnings: string[]
}

// =============================================================================
// ATHLETE POSITION IN GRAPH
// =============================================================================

export interface AthleteGraphPosition {
  skillId: SkillGraphId
  athleteId: string
  
  // Current position
  currentNodeId: string
  currentNode: ProgressionNode
  
  // Historical peak
  highestNodeId: string
  highestNode: ProgressionNode
  
  // Next recommendations
  nextRecommendedNodeId: string | null
  nextRecommendedNode: ProgressionNode | null
  alternativeNextNodes: ProgressionNode[]
  
  // Blocking factors
  isBlocked: boolean
  blockingReasons: BlockingReason[]
  
  // Progress within current node
  currentNodeProgress: {
    currentHoldTime?: number
    currentReps?: number
    percentToOwnership: number
    percentToNextNode: number
  }
  
  // Coaching
  coachingMessage: string
  actionableNextStep: string
}

export interface BlockingReason {
  reasonType: 'benchmark' | 'readiness' | 'prerequisite' | 'safety' | 'time'
  description: string
  missingValue: number
  requiredValue: number
  correspondingWeakPoint?: WeakPointType
  recommendedAction: string
}

// =============================================================================
// FRONT LEVER GRAPH
// =============================================================================

export const FRONT_LEVER_GRAPH: SkillProgressionGraph = {
  skillId: 'front_lever',
  skillName: 'Front Lever',
  description: 'Horizontal pulling hold requiring exceptional lat strength, scapular control, and core anti-extension.',
  category: 'pull',
  
  entryNodeId: 'fl_active_hang',
  terminalNodeIds: ['fl_full'],
  
  globalPrerequisites: {
    description: 'Basic pulling strength and core control foundation',
    benchmarks: [
      { benchmarkType: 'pull_ups', minimumValue: 8, unit: 'reps', description: '8+ strict pull-ups' },
      { benchmarkType: 'hold_time', minimumValue: 30, unit: 'seconds', description: '30s hollow body hold' },
    ],
  },
  
  generalSafetyWarnings: [
    'Avoid training with bicep tendon pain',
    'Ensure proper scapular depression throughout',
    'Do not force progressions with kipping or momentum',
  ],
  
  nodes: [
    {
      nodeId: 'fl_active_hang',
      skillId: 'front_lever',
      nodeName: 'active_hang_foundation',
      displayName: 'Active Hang Foundation',
      description: 'Build the scapular depression and lat engagement base.',
      difficultyLevel: 'foundation',
      levelIndex: 0,
      movementType: 'isometric_hold',
      requiredBenchmarks: [
        { benchmarkType: 'pull_ups', minimumValue: 5, unit: 'reps', description: '5+ pull-ups' },
      ],
      requiredReadinessScore: 20,
      requiredPrerequisiteNodes: [],
      holdTimeGoal: 30,
      minimumForOwnership: 20,
      knowledgeBubble: {
        shortTip: 'Master scapular depression before lever work.',
        detailedExplanation: 'The active hang builds the scapular control and lat engagement that all front lever progressions require. Without this foundation, athletes compensate with poor positioning.',
        commonMistakes: ['Passive hanging', 'Shrugged shoulders', 'Bent arms'],
        techniqueCues: ['Depress shoulders away from ears', 'Engage lats as if starting a pull-up', 'Maintain slight hollow body'],
      },
      jointStressLevel: 'low',
      primaryStressAreas: ['shoulder'],
      recommendedFrequency: { sessionsPerWeek: 3, restDaysMinimum: 1 },
    },
    {
      nodeId: 'fl_tuck',
      skillId: 'front_lever',
      nodeName: 'tuck_front_lever',
      displayName: 'Tuck Front Lever',
      description: 'First true lever progression with knees tucked to chest.',
      difficultyLevel: 'beginner',
      levelIndex: 1,
      movementType: 'isometric_hold',
      requiredBenchmarks: [
        { benchmarkType: 'pull_ups', minimumValue: 10, unit: 'reps', description: '10+ pull-ups' },
        { benchmarkType: 'hold_time', minimumValue: 30, unit: 'seconds', description: '30s hollow hold' },
      ],
      requiredReadinessScore: 35,
      requiredPrerequisiteNodes: ['fl_active_hang'],
      holdTimeGoal: 15,
      minimumForOwnership: 10,
      knowledgeBubble: {
        shortTip: 'Keep hips level with shoulders - no sagging.',
        detailedExplanation: 'The tuck front lever teaches the horizontal body position. Focus on keeping hips at shoulder height and maintaining scapular depression throughout.',
        commonMistakes: ['Hips dropping', 'Shrugged shoulders', 'Looking up instead of neutral'],
        techniqueCues: ['Think "pull bar toward hips"', 'Keep tight tuck', 'Posterior pelvic tilt'],
      },
      jointStressLevel: 'moderate',
      primaryStressAreas: ['shoulder', 'bicep_tendon'],
      recommendedFrequency: { sessionsPerWeek: 3, restDaysMinimum: 1 },
    },
    {
      nodeId: 'fl_adv_tuck',
      skillId: 'front_lever',
      nodeName: 'advanced_tuck_front_lever',
      displayName: 'Advanced Tuck Front Lever',
      description: 'Extended hip angle with tucked knees - significant strength increase.',
      difficultyLevel: 'intermediate',
      levelIndex: 2,
      movementType: 'isometric_hold',
      requiredBenchmarks: [
        { benchmarkType: 'pull_ups', minimumValue: 15, unit: 'reps', description: '15+ pull-ups' },
        { benchmarkType: 'weighted_pull', minimumValue: 20, unit: 'percent_bw', description: '+20% BW weighted pull' },
      ],
      requiredReadinessScore: 50,
      requiredPrerequisiteNodes: ['fl_tuck'],
      holdTimeGoal: 12,
      minimumForOwnership: 8,
      knowledgeBubble: {
        shortTip: 'Push hips back to open the angle - this is where real strength builds.',
        detailedExplanation: 'The advanced tuck significantly increases lever arm length. Most athletes spend considerable time here building the pulling strength needed for longer progressions.',
        commonMistakes: ['Not opening hip angle enough', 'Losing depression', 'Rushing to one-leg'],
        techniqueCues: ['Push hips away from bar', 'Keep knees tucked but angle open', 'Maintain depression'],
      },
      jointStressLevel: 'moderate',
      primaryStressAreas: ['shoulder', 'bicep_tendon'],
      recommendedFrequency: { sessionsPerWeek: 3, restDaysMinimum: 1 },
    },
    {
      nodeId: 'fl_one_leg',
      skillId: 'front_lever',
      nodeName: 'one_leg_front_lever',
      displayName: 'One Leg Front Lever',
      description: 'One leg extended, one tucked - transitional progression.',
      difficultyLevel: 'intermediate',
      levelIndex: 3,
      movementType: 'isometric_hold',
      requiredBenchmarks: [
        { benchmarkType: 'weighted_pull', minimumValue: 30, unit: 'percent_bw', description: '+30% BW weighted pull' },
        { benchmarkType: 'compression', minimumValue: 15, unit: 'seconds', description: '15s L-sit hold' },
      ],
      requiredReadinessScore: 60,
      requiredPrerequisiteNodes: ['fl_adv_tuck'],
      holdTimeGoal: 10,
      minimumForOwnership: 6,
      knowledgeBubble: {
        shortTip: 'Extend the stronger leg first. Keep hips square.',
        detailedExplanation: 'The one-leg progression bridges the gap between tucked and straight body positions. Alternate which leg extends to build balanced strength.',
        commonMistakes: ['Twisting toward extended leg', 'Dropping extended leg', 'Opening hip too much'],
        techniqueCues: ['Keep hips square', 'Extend leg parallel to floor', 'Maintain tight core'],
      },
      jointStressLevel: 'high',
      primaryStressAreas: ['shoulder', 'bicep_tendon'],
      recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 2 },
    },
    {
      nodeId: 'fl_straddle',
      skillId: 'front_lever',
      nodeName: 'straddle_front_lever',
      displayName: 'Straddle Front Lever',
      description: 'Legs extended in straddle position - near-full lever strength.',
      difficultyLevel: 'advanced',
      levelIndex: 4,
      movementType: 'isometric_hold',
      requiredBenchmarks: [
        { benchmarkType: 'weighted_pull', minimumValue: 45, unit: 'percent_bw', description: '+45% BW weighted pull' },
        { benchmarkType: 'compression', minimumValue: 20, unit: 'seconds', description: '20s L-sit hold' },
      ],
      requiredReadinessScore: 75,
      requiredPrerequisiteNodes: ['fl_one_leg'],
      holdTimeGoal: 8,
      minimumForOwnership: 5,
      knowledgeBubble: {
        shortTip: 'Start wide, gradually narrow the straddle over weeks.',
        detailedExplanation: 'The straddle front lever represents near-complete strength. Progress by gradually narrowing straddle width rather than jumping to full.',
        commonMistakes: ['Straddle too narrow too soon', 'Hips dropping', 'Losing body tension'],
        techniqueCues: ['Squeeze glutes hard', 'Point toes', 'Maintain depression throughout'],
      },
      jointStressLevel: 'high',
      primaryStressAreas: ['shoulder', 'bicep_tendon'],
      recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 2 },
    },
    {
      nodeId: 'fl_full',
      skillId: 'front_lever',
      nodeName: 'full_front_lever',
      displayName: 'Full Front Lever',
      description: 'Complete horizontal hold with legs together - the ultimate goal.',
      difficultyLevel: 'elite',
      levelIndex: 5,
      movementType: 'isometric_hold',
      requiredBenchmarks: [
        { benchmarkType: 'weighted_pull', minimumValue: 60, unit: 'percent_bw', description: '+60% BW weighted pull' },
        { benchmarkType: 'compression', minimumValue: 30, unit: 'seconds', description: '30s L-sit hold' },
      ],
      requiredReadinessScore: 90,
      requiredPrerequisiteNodes: ['fl_straddle'],
      holdTimeGoal: 5,
      minimumForOwnership: 3,
      knowledgeBubble: {
        shortTip: 'Full body tension from fingers to toes. This is mastery.',
        detailedExplanation: 'The full front lever requires years of dedicated training. Maintain perfect form - any sag indicates insufficient strength for clean holds.',
        commonMistakes: ['Hip pike', 'Leg drop', 'Losing depression at fatigue'],
        techniqueCues: ['Engage every muscle', 'Point toes', 'Pull bar toward hips'],
      },
      jointStressLevel: 'very_high',
      primaryStressAreas: ['shoulder', 'bicep_tendon'],
      recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 3 },
    },
  ],
  
  edges: [
    {
      edgeId: 'fl_e1',
      fromNodeId: 'fl_active_hang',
      toNodeId: 'fl_tuck',
      transitionType: 'progression',
      minimumRequirements: { fromNodeHoldTime: 20, readinessThreshold: 30 },
      notes: 'Build scapular control before lever work',
      expectedTransitionWeeks: 2,
      isRecommendedPath: true,
    },
    {
      edgeId: 'fl_e2',
      fromNodeId: 'fl_tuck',
      toNodeId: 'fl_adv_tuck',
      transitionType: 'progression',
      minimumRequirements: { fromNodeHoldTime: 15, readinessThreshold: 45 },
      notes: 'Progress when clean 15s tuck holds are consistent',
      expectedTransitionWeeks: 4,
      isRecommendedPath: true,
    },
    {
      edgeId: 'fl_e3',
      fromNodeId: 'fl_adv_tuck',
      toNodeId: 'fl_one_leg',
      transitionType: 'progression',
      minimumRequirements: { fromNodeHoldTime: 12, readinessThreshold: 55 },
      notes: 'This is a significant strength jump - be patient',
      expectedTransitionWeeks: 8,
      isRecommendedPath: true,
    },
    {
      edgeId: 'fl_e4',
      fromNodeId: 'fl_one_leg',
      toNodeId: 'fl_straddle',
      transitionType: 'progression',
      minimumRequirements: { fromNodeHoldTime: 10, readinessThreshold: 70 },
      notes: 'Can also progress via half-lay variation',
      expectedTransitionWeeks: 12,
      isRecommendedPath: true,
    },
    {
      edgeId: 'fl_e5',
      fromNodeId: 'fl_straddle',
      toNodeId: 'fl_full',
      transitionType: 'progression',
      minimumRequirements: { fromNodeHoldTime: 8, readinessThreshold: 85 },
      notes: 'Gradually narrow straddle before attempting full',
      expectedTransitionWeeks: 16,
      isRecommendedPath: true,
    },
  ],
}

// =============================================================================
// PLANCHE GRAPH
// =============================================================================

export const PLANCHE_GRAPH: SkillProgressionGraph = {
  skillId: 'planche',
  skillName: 'Planche',
  description: 'Horizontal pushing hold requiring exceptional scapular protraction, straight-arm conditioning, and full-body tension.',
  category: 'push',
  
  entryNodeId: 'pl_lean',
  terminalNodeIds: ['pl_full'],
  
  globalPrerequisites: {
    description: 'Push-up and dip foundation with healthy wrists',
    benchmarks: [
      { benchmarkType: 'dips', minimumValue: 15, unit: 'reps', description: '15+ parallel bar dips' },
      { benchmarkType: 'hold_time', minimumValue: 30, unit: 'seconds', description: '30s planche lean' },
    ],
  },
  
  generalSafetyWarnings: [
    'Wrist preparation is critical - never skip warm-up',
    'Straight-arm strength takes years to develop safely',
    'Stop immediately if bicep tendon or wrist pain occurs',
  ],
  
  nodes: [
    {
      nodeId: 'pl_lean',
      skillId: 'planche',
      nodeName: 'planche_lean',
      displayName: 'Planche Lean',
      description: 'Forward lean in push-up position - builds wrist and shoulder conditioning.',
      difficultyLevel: 'foundation',
      levelIndex: 0,
      movementType: 'isometric_hold',
      requiredBenchmarks: [
        { benchmarkType: 'dips', minimumValue: 10, unit: 'reps', description: '10+ dips' },
      ],
      requiredReadinessScore: 20,
      requiredPrerequisiteNodes: [],
      holdTimeGoal: 60,
      minimumForOwnership: 30,
      knowledgeBubble: {
        shortTip: 'Lean forward until shoulders pass wrists. Lock arms straight.',
        detailedExplanation: 'The planche lean conditions wrists and shoulders for the extreme forward lean required in planche. Progress by increasing lean angle over weeks.',
        commonMistakes: ['Not leaning far enough', 'Bent arms', 'Hips too high'],
        techniqueCues: ['Shoulders past wrists', 'Arms locked', 'Protract scapulae'],
      },
      jointStressLevel: 'moderate',
      primaryStressAreas: ['wrist', 'shoulder'],
      recommendedFrequency: { sessionsPerWeek: 3, restDaysMinimum: 1 },
    },
    {
      nodeId: 'pl_tuck',
      skillId: 'planche',
      nodeName: 'tuck_planche',
      displayName: 'Tuck Planche',
      description: 'First actual planche with knees tucked - feet leave the ground.',
      difficultyLevel: 'beginner',
      levelIndex: 1,
      movementType: 'isometric_hold',
      requiredBenchmarks: [
        { benchmarkType: 'dips', minimumValue: 20, unit: 'reps', description: '20+ dips' },
        { benchmarkType: 'weighted_dip', minimumValue: 15, unit: 'percent_bw', description: '+15% BW weighted dip' },
      ],
      requiredReadinessScore: 35,
      requiredPrerequisiteNodes: ['pl_lean'],
      holdTimeGoal: 15,
      minimumForOwnership: 8,
      knowledgeBubble: {
        shortTip: 'Round your back, protract hard, and lean forward.',
        detailedExplanation: 'The tuck planche is the first full planche position. Rounding the upper back helps maintain balance and protraction.',
        commonMistakes: ['Hips too high', 'Arms bent', 'Not enough lean'],
        techniqueCues: ['Round upper back', 'Drive shoulders forward', 'Tight tuck'],
      },
      jointStressLevel: 'high',
      primaryStressAreas: ['wrist', 'shoulder', 'bicep_tendon'],
      recommendedFrequency: { sessionsPerWeek: 3, restDaysMinimum: 1 },
    },
    {
      nodeId: 'pl_adv_tuck',
      skillId: 'planche',
      nodeName: 'advanced_tuck_planche',
      displayName: 'Advanced Tuck Planche',
      description: 'Hip angle opens while maintaining tuck - major strength increase.',
      difficultyLevel: 'intermediate',
      levelIndex: 2,
      movementType: 'isometric_hold',
      requiredBenchmarks: [
        { benchmarkType: 'weighted_dip', minimumValue: 30, unit: 'percent_bw', description: '+30% BW weighted dip' },
      ],
      requiredReadinessScore: 50,
      requiredPrerequisiteNodes: ['pl_tuck'],
      holdTimeGoal: 12,
      minimumForOwnership: 6,
      knowledgeBubble: {
        shortTip: 'Push hips back while keeping knees tucked.',
        detailedExplanation: 'The advanced tuck significantly increases leverage. This is where most athletes spend considerable time building strength.',
        commonMistakes: ['Opening hip too fast', 'Losing protraction', 'Collapsing shoulders'],
        techniqueCues: ['Maintain protraction', 'Open hip angle gradually', 'Stay hollow'],
      },
      jointStressLevel: 'high',
      primaryStressAreas: ['wrist', 'shoulder', 'bicep_tendon'],
      recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 2 },
    },
    {
      nodeId: 'pl_straddle',
      skillId: 'planche',
      nodeName: 'straddle_planche',
      displayName: 'Straddle Planche',
      description: 'Legs extended in straddle - significant milestone.',
      difficultyLevel: 'advanced',
      levelIndex: 3,
      movementType: 'isometric_hold',
      requiredBenchmarks: [
        { benchmarkType: 'weighted_dip', minimumValue: 50, unit: 'percent_bw', description: '+50% BW weighted dip' },
      ],
      requiredReadinessScore: 75,
      requiredPrerequisiteNodes: ['pl_adv_tuck'],
      holdTimeGoal: 8,
      minimumForOwnership: 5,
      knowledgeBubble: {
        shortTip: 'Start wide straddle, progressively narrow over months.',
        detailedExplanation: 'Straddle planche represents advanced proficiency. Wide straddle reduces leverage - narrow over time.',
        commonMistakes: ['Straddle too narrow', 'Hip pike', 'Arms bending'],
        techniqueCues: ['Engage glutes hard', 'Point toes', 'Lean forward'],
      },
      jointStressLevel: 'very_high',
      primaryStressAreas: ['wrist', 'shoulder', 'bicep_tendon'],
      recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 3 },
    },
    {
      nodeId: 'pl_full',
      skillId: 'planche',
      nodeName: 'full_planche',
      displayName: 'Full Planche',
      description: 'Complete horizontal hold with legs together - elite achievement.',
      difficultyLevel: 'elite',
      levelIndex: 4,
      movementType: 'isometric_hold',
      requiredBenchmarks: [
        { benchmarkType: 'weighted_dip', minimumValue: 75, unit: 'percent_bw', description: '+75% BW weighted dip' },
      ],
      requiredReadinessScore: 90,
      requiredPrerequisiteNodes: ['pl_straddle'],
      holdTimeGoal: 5,
      minimumForOwnership: 3,
      knowledgeBubble: {
        shortTip: 'Years of dedicated work. Respect the process.',
        detailedExplanation: 'Full planche is one of the most difficult bodyweight skills. Requires years of consistent straight-arm training.',
        commonMistakes: ['Attempting too soon', 'Hip pike', 'Bent arms'],
        techniqueCues: ['Full body tension', 'Maximum lean', 'Protract hard'],
      },
      jointStressLevel: 'very_high',
      primaryStressAreas: ['wrist', 'shoulder', 'bicep_tendon'],
      recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 3 },
    },
  ],
  
  edges: [
    {
      edgeId: 'pl_e1',
      fromNodeId: 'pl_lean',
      toNodeId: 'pl_tuck',
      transitionType: 'progression',
      minimumRequirements: { fromNodeHoldTime: 45, readinessThreshold: 30 },
      notes: 'Build wrist conditioning before tuck attempts',
      expectedTransitionWeeks: 4,
      isRecommendedPath: true,
    },
    {
      edgeId: 'pl_e2',
      fromNodeId: 'pl_tuck',
      toNodeId: 'pl_adv_tuck',
      transitionType: 'progression',
      minimumRequirements: { fromNodeHoldTime: 15, readinessThreshold: 45 },
      notes: 'Consistent 15s tuck holds indicate readiness',
      expectedTransitionWeeks: 8,
      isRecommendedPath: true,
    },
    {
      edgeId: 'pl_e3',
      fromNodeId: 'pl_adv_tuck',
      toNodeId: 'pl_straddle',
      transitionType: 'progression',
      minimumRequirements: { fromNodeHoldTime: 12, readinessThreshold: 70 },
      notes: 'Major jump - may take 6+ months',
      expectedTransitionWeeks: 24,
      isRecommendedPath: true,
    },
    {
      edgeId: 'pl_e4',
      fromNodeId: 'pl_straddle',
      toNodeId: 'pl_full',
      transitionType: 'progression',
      minimumRequirements: { fromNodeHoldTime: 8, readinessThreshold: 85 },
      notes: 'Gradually narrow straddle over time',
      expectedTransitionWeeks: 52,
      isRecommendedPath: true,
    },
  ],
}

// =============================================================================
// MUSCLE-UP GRAPH
// =============================================================================

export const MUSCLE_UP_GRAPH: SkillProgressionGraph = {
  skillId: 'muscle_up',
  skillName: 'Muscle-Up',
  description: 'Dynamic pulling movement transitioning from below to above the bar.',
  category: 'dynamic',
  
  entryNodeId: 'mu_pull_foundation',
  terminalNodeIds: ['mu_strict', 'mu_weighted'],
  
  globalPrerequisites: {
    description: 'Strong pulling and dipping foundation',
    benchmarks: [
      { benchmarkType: 'pull_ups', minimumValue: 12, unit: 'reps', description: '12+ strict pull-ups' },
      { benchmarkType: 'dips', minimumValue: 15, unit: 'reps', description: '15+ dips' },
    ],
  },
  
  generalSafetyWarnings: [
    'Elbow stress is significant - proper warm-up essential',
    'Do not kip aggressively without proper technique',
    'Build transition strength progressively',
  ],
  
  nodes: [
    {
      nodeId: 'mu_pull_foundation',
      skillId: 'muscle_up',
      nodeName: 'pull_foundation',
      displayName: 'Pull Foundation',
      description: 'Build the high pull strength needed for muscle-up transition.',
      difficultyLevel: 'foundation',
      levelIndex: 0,
      movementType: 'dynamic_strength',
      requiredBenchmarks: [
        { benchmarkType: 'pull_ups', minimumValue: 8, unit: 'reps', description: '8+ pull-ups' },
      ],
      requiredReadinessScore: 25,
      requiredPrerequisiteNodes: [],
      repsGoal: 15,
      minimumForOwnership: 12,
      knowledgeBubble: {
        shortTip: 'Build chest-to-bar pull strength first.',
        detailedExplanation: 'The muscle-up requires pulling significantly higher than a standard pull-up. Build this capacity with high pulls and explosive pull-ups.',
        commonMistakes: ['Chin-level pulls only', 'Poor scapular control', 'Not engaging lats'],
        techniqueCues: ['Pull to chest level', 'Drive elbows back', 'Explosive intent'],
      },
      jointStressLevel: 'moderate',
      primaryStressAreas: ['shoulder', 'elbow'],
      recommendedFrequency: { sessionsPerWeek: 3, restDaysMinimum: 1 },
    },
    {
      nodeId: 'mu_high_pull',
      skillId: 'muscle_up',
      nodeName: 'high_pull',
      displayName: 'High Pull / Chest-to-Bar',
      description: 'Pull to chest level with explosive intent.',
      difficultyLevel: 'beginner',
      levelIndex: 1,
      movementType: 'explosive',
      requiredBenchmarks: [
        { benchmarkType: 'pull_ups', minimumValue: 12, unit: 'reps', description: '12+ pull-ups' },
      ],
      requiredReadinessScore: 40,
      requiredPrerequisiteNodes: ['mu_pull_foundation'],
      repsGoal: 8,
      minimumForOwnership: 5,
      knowledgeBubble: {
        shortTip: 'Pull explosively - bar should touch sternum.',
        detailedExplanation: 'High pulls develop the explosive pulling power and range of motion needed for the muscle-up transition.',
        commonMistakes: ['Not pulling high enough', 'Losing lat engagement', 'Kipping without control'],
        techniqueCues: ['Explode from dead hang', 'Pull bar to lower chest', 'Think "jump" with upper body'],
      },
      jointStressLevel: 'moderate',
      primaryStressAreas: ['shoulder', 'elbow'],
      recommendedFrequency: { sessionsPerWeek: 3, restDaysMinimum: 1 },
    },
    {
      nodeId: 'mu_transition',
      skillId: 'muscle_up',
      nodeName: 'transition_training',
      displayName: 'Transition Training',
      description: 'Practice the transition from pull to dip position.',
      difficultyLevel: 'intermediate',
      levelIndex: 2,
      movementType: 'transition',
      requiredBenchmarks: [
        { benchmarkType: 'pull_ups', minimumValue: 15, unit: 'reps', description: '15+ pull-ups' },
        { benchmarkType: 'dips', minimumValue: 15, unit: 'reps', description: '15+ dips' },
      ],
      requiredReadinessScore: 55,
      requiredPrerequisiteNodes: ['mu_high_pull'],
      repsGoal: 5,
      minimumForOwnership: 3,
      knowledgeBubble: {
        shortTip: 'Lean forward aggressively at the top of the pull.',
        detailedExplanation: 'The transition is the crux of the muscle-up. Practice with band assistance or jumping muscle-ups to learn the movement pattern.',
        commonMistakes: ['Not leaning forward', 'Pulling straight up', 'Chicken-winging'],
        techniqueCues: ['Lean over the bar', 'Keep elbows close', 'Roll wrists over bar'],
      },
      jointStressLevel: 'high',
      primaryStressAreas: ['shoulder', 'elbow', 'wrist'],
      recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 2 },
    },
    {
      nodeId: 'mu_kipping',
      skillId: 'muscle_up',
      nodeName: 'kipping_muscle_up',
      displayName: 'Kipping Muscle-Up',
      description: 'Full muscle-up using controlled kip for assistance.',
      difficultyLevel: 'intermediate',
      levelIndex: 3,
      movementType: 'explosive',
      requiredBenchmarks: [
        { benchmarkType: 'weighted_pull', minimumValue: 15, unit: 'percent_bw', description: '+15% BW weighted pull' },
      ],
      requiredReadinessScore: 65,
      requiredPrerequisiteNodes: ['mu_transition'],
      repsGoal: 5,
      minimumForOwnership: 3,
      knowledgeBubble: {
        shortTip: 'Controlled kip, aggressive lean, clean transition.',
        detailedExplanation: 'The kipping muscle-up uses momentum strategically. Focus on controlled technique rather than wild swinging.',
        commonMistakes: ['Over-kipping', 'Chicken-wing transition', 'No lean forward'],
        techniqueCues: ['Small controlled swing', 'Explosive pull at forward swing', 'Lean hard over bar'],
      },
      jointStressLevel: 'high',
      primaryStressAreas: ['shoulder', 'elbow'],
      recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 2 },
    },
    {
      nodeId: 'mu_strict',
      skillId: 'muscle_up',
      nodeName: 'strict_muscle_up',
      displayName: 'Strict Muscle-Up',
      description: 'Muscle-up from dead hang without any kip.',
      difficultyLevel: 'advanced',
      levelIndex: 4,
      movementType: 'dynamic_strength',
      requiredBenchmarks: [
        { benchmarkType: 'weighted_pull', minimumValue: 35, unit: 'percent_bw', description: '+35% BW weighted pull' },
        { benchmarkType: 'weighted_dip', minimumValue: 35, unit: 'percent_bw', description: '+35% BW weighted dip' },
      ],
      requiredReadinessScore: 80,
      requiredPrerequisiteNodes: ['mu_kipping'],
      repsGoal: 3,
      minimumForOwnership: 1,
      knowledgeBubble: {
        shortTip: 'Dead hang start, explosive pull, controlled transition.',
        detailedExplanation: 'The strict muscle-up requires exceptional pulling power. Build weighted pull-up and dip strength significantly.',
        commonMistakes: ['Starting with momentum', 'Weak pull height', 'Slow transition'],
        techniqueCues: ['Full dead hang start', 'Maximum pull height', 'Fast wrist transition'],
      },
      jointStressLevel: 'very_high',
      primaryStressAreas: ['shoulder', 'elbow', 'bicep_tendon'],
      recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 2 },
    },
    {
      nodeId: 'mu_weighted',
      skillId: 'muscle_up',
      nodeName: 'weighted_muscle_up',
      displayName: 'Weighted Muscle-Up',
      description: 'Muscle-up with added weight - elite level.',
      difficultyLevel: 'elite',
      levelIndex: 5,
      movementType: 'dynamic_strength',
      requiredBenchmarks: [
        { benchmarkType: 'weighted_pull', minimumValue: 50, unit: 'percent_bw', description: '+50% BW weighted pull' },
      ],
      requiredReadinessScore: 90,
      requiredPrerequisiteNodes: ['mu_strict'],
      repsGoal: 3,
      minimumForOwnership: 1,
      knowledgeBubble: {
        shortTip: 'Start light. Add weight very gradually.',
        detailedExplanation: 'Weighted muscle-ups require exceptional strength. Progress in small increments (2.5-5kg) over months.',
        commonMistakes: ['Adding too much weight too soon', 'Sloppy form with weight', 'Insufficient rest'],
        techniqueCues: ['Perfect form before adding weight', 'Controlled descent', 'Build slowly'],
      },
      jointStressLevel: 'very_high',
      primaryStressAreas: ['shoulder', 'elbow', 'bicep_tendon'],
      recommendedFrequency: { sessionsPerWeek: 1, restDaysMinimum: 3 },
    },
  ],
  
  edges: [
    {
      edgeId: 'mu_e1',
      fromNodeId: 'mu_pull_foundation',
      toNodeId: 'mu_high_pull',
      transitionType: 'progression',
      minimumRequirements: { fromNodeReps: 12, readinessThreshold: 35 },
      notes: 'Build pull volume before explosive work',
      expectedTransitionWeeks: 4,
      isRecommendedPath: true,
    },
    {
      edgeId: 'mu_e2',
      fromNodeId: 'mu_high_pull',
      toNodeId: 'mu_transition',
      transitionType: 'progression',
      minimumRequirements: { fromNodeReps: 5, readinessThreshold: 50 },
      notes: 'Consistent high pulls indicate transition readiness',
      expectedTransitionWeeks: 6,
      isRecommendedPath: true,
    },
    {
      edgeId: 'mu_e3',
      fromNodeId: 'mu_transition',
      toNodeId: 'mu_kipping',
      transitionType: 'progression',
      minimumRequirements: { fromNodeReps: 3, readinessThreshold: 60 },
      notes: 'Learn transition pattern before full muscle-ups',
      expectedTransitionWeeks: 4,
      isRecommendedPath: true,
    },
    {
      edgeId: 'mu_e4',
      fromNodeId: 'mu_kipping',
      toNodeId: 'mu_strict',
      transitionType: 'progression',
      minimumRequirements: { fromNodeReps: 5, readinessThreshold: 75 },
      notes: 'Build significant strength before strict attempts',
      expectedTransitionWeeks: 16,
      isRecommendedPath: true,
    },
    {
      edgeId: 'mu_e5',
      fromNodeId: 'mu_strict',
      toNodeId: 'mu_weighted',
      transitionType: 'progression',
      minimumRequirements: { fromNodeReps: 3, readinessThreshold: 85 },
      notes: 'Master strict form before adding load',
      expectedTransitionWeeks: 24,
      isRecommendedPath: true,
    },
  ],
}

// =============================================================================
// ALL GRAPHS REGISTRY
// =============================================================================

export const SKILL_PROGRESSION_GRAPHS: Record<SkillGraphId, SkillProgressionGraph> = {
  front_lever: FRONT_LEVER_GRAPH,
  planche: PLANCHE_GRAPH,
  muscle_up: MUSCLE_UP_GRAPH,
  // Placeholder structures for remaining skills - will be expanded
  back_lever: createSimpleGraph('back_lever', 'Back Lever', 'pull', [
    'active_hang', 'skin_the_cat', 'german_hang', 'tuck_back_lever', 
    'adv_tuck_back_lever', 'one_leg_back_lever', 'straddle_back_lever', 'full_back_lever'
  ]),
  handstand: createSimpleGraph('handstand', 'Handstand', 'static', [
    'wall_facing_hold', 'chest_to_wall', 'heel_pulls', 'toe_pulls', 
    'freestanding_attempts', 'freestanding_hold', 'one_arm_entry'
  ]),
  hspu: createSimpleGraph('hspu', 'Handstand Push-Up', 'push', [
    'pike_push_up', 'elevated_pike', 'wall_hspu_negative', 'wall_hspu',
    'freestanding_negative', 'freestanding_hspu'
  ]),
  l_sit: createSimpleGraph('l_sit', 'L-Sit', 'static', [
    'tuck_sit', 'one_leg_l_sit', 'full_l_sit', 'v_sit_entry'
  ]),
  v_sit: createSimpleGraph('v_sit', 'V-Sit', 'static', [
    'l_sit_prerequisite', 'low_v_sit', 'half_v_sit', 'full_v_sit', 'manna_entry'
  ]),
  iron_cross: createSimpleGraph('iron_cross', 'Iron Cross', 'rings', [
    'ring_support', 'rto_support', 'assisted_cross', 'cross_negative',
    'partial_cross', 'full_cross'
  ]),
  one_arm_pull_up: createSimpleGraph('one_arm_pull_up', 'One Arm Pull-Up', 'pull', [
    'archer_pull_up', 'typewriter_pull_up', 'assisted_one_arm', 
    'one_arm_negative', 'one_arm_pull_up'
  ]),
  ring_muscle_up: createSimpleGraph('ring_muscle_up', 'Ring Muscle-Up', 'rings', [
    'ring_pull_up', 'ring_high_pull', 'false_grip_hold', 
    'ring_transition', 'ring_muscle_up', 'strict_ring_muscle_up'
  ]),
  // Advanced skills and sub-skills
  maltese: MALTESE_GRAPH,
  planche_pushup: PLANCHE_PUSHUP_GRAPH,
  pseudo_planche_pushup: createSimpleGraph('pseudo_planche_pushup', 'Pseudo Planche Push-Up', 'push', [
    'pseudo_lean', 'pseudo_angle_1', 'pseudo_angle_2', 'pseudo_horizontal'
  ]),
  front_lever_pullup: FRONT_LEVER_PULLUP_GRAPH,
  one_arm_front_lever_row: createSimpleGraph('one_arm_front_lever_row', 'One-Arm Front Lever Row', 'pull', [
    'assisted_oafl_row', 'band_oafl_row', 'negative_oafl_row', 'one_arm_fl_row'
  ]),
  slow_muscle_up: SLOW_MUSCLE_UP_GRAPH,
  weighted_muscle_up: createSimpleGraph('weighted_muscle_up', 'Weighted Muscle-Up', 'dynamic', [
    'light_weighted_mu', 'moderate_weighted_mu', 'heavy_weighted_mu', 'very_heavy_weighted_mu'
  ]),
}

// Helper to create simple linear graphs
function createSimpleGraph(
  skillId: SkillGraphId,
  skillName: string,
  category: 'pull' | 'push' | 'static' | 'dynamic' | 'rings',
  nodeNames: string[]
): SkillProgressionGraph {
  const nodes: ProgressionNode[] = nodeNames.map((name, index) => ({
    nodeId: `${skillId}_${index}`,
    skillId,
    nodeName: name,
    displayName: name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: `${skillName} progression stage ${index + 1}`,
    difficultyLevel: index <= 1 ? 'foundation' : index <= 3 ? 'intermediate' : 'advanced' as DifficultyLevel,
    levelIndex: index,
    movementType: 'isometric_hold' as MovementType,
    requiredBenchmarks: [],
    requiredReadinessScore: 20 + (index * 15),
    requiredPrerequisiteNodes: index > 0 ? [`${skillId}_${index - 1}`] : [],
    holdTimeGoal: Math.max(5, 15 - index * 2),
    minimumForOwnership: Math.max(3, 10 - index),
    knowledgeBubble: {
      shortTip: `Stage ${index + 1} of ${skillName} progression.`,
      detailedExplanation: `Build toward the next level by mastering this position.`,
      commonMistakes: ['Poor form', 'Rushing progression'],
      techniqueCues: ['Maintain tension', 'Control breathing'],
    },
    jointStressLevel: index <= 2 ? 'moderate' : 'high' as JointStressLevel,
    primaryStressAreas: ['shoulder'],
    recommendedFrequency: { sessionsPerWeek: 3, restDaysMinimum: 1 },
  }))
  
  const edges: ProgressionEdge[] = nodeNames.slice(0, -1).map((_, index) => ({
    edgeId: `${skillId}_e${index}`,
    fromNodeId: `${skillId}_${index}`,
    toNodeId: `${skillId}_${index + 1}`,
    transitionType: 'progression' as TransitionType,
    minimumRequirements: { readinessThreshold: 30 + (index * 15) },
    notes: `Progress when current level is solid`,
    expectedTransitionWeeks: 4 + (index * 2),
    isRecommendedPath: true,
  }))
  
  return {
    skillId,
    skillName,
    description: `${skillName} progression system`,
    category,
    nodes,
    edges,
    entryNodeId: `${skillId}_0`,
    terminalNodeIds: [`${skillId}_${nodeNames.length - 1}`],
    globalPrerequisites: { description: 'Foundation strength', benchmarks: [] },
    generalSafetyWarnings: ['Train with proper form', 'Progress gradually'],
  }
}

// =============================================================================
// GRAPH ENGINE FUNCTIONS
// =============================================================================

/**
 * Get a skill progression graph by ID
 */
export function getSkillGraph(skillId: SkillGraphId): SkillProgressionGraph | null {
  return SKILL_PROGRESSION_GRAPHS[skillId] || null
}

/**
 * Get a specific node from a graph
 */
export function getGraphNode(
  skillId: SkillGraphId,
  nodeId: string
): ProgressionNode | null {
  const graph = SKILL_PROGRESSION_GRAPHS[skillId]
  if (!graph) return null
  return graph.nodes.find(n => n.nodeId === nodeId) || null
}

/**
 * Get the next recommended node(s) from current position
 */
export function getNextNodes(
  skillId: SkillGraphId,
  currentNodeId: string
): ProgressionNode[] {
  const graph = SKILL_PROGRESSION_GRAPHS[skillId]
  if (!graph) return []
  
  const outgoingEdges = graph.edges.filter(e => e.fromNodeId === currentNodeId)
  return outgoingEdges
    .map(e => graph.nodes.find(n => n.nodeId === e.toNodeId))
    .filter((n): n is ProgressionNode => n !== undefined)
}

/**
 * Check if an athlete can progress to a node
 */
export function canProgressToNode(
  node: ProgressionNode,
  athleteBenchmarks: Record<string, number>,
  athleteReadinessScore: number,
  unlockedNodes: string[]
): { canProgress: boolean; blockingReasons: BlockingReason[] } {
  const blockingReasons: BlockingReason[] = []
  
  // Check prerequisites
  for (const prereq of node.requiredPrerequisiteNodes) {
    if (!unlockedNodes.includes(prereq)) {
      blockingReasons.push({
        reasonType: 'prerequisite',
        description: `Prerequisite node not unlocked: ${prereq}`,
        missingValue: 0,
        requiredValue: 1,
        recommendedAction: `Complete the ${prereq} progression first.`,
      })
    }
  }
  
  // Check readiness score
  if (athleteReadinessScore < node.requiredReadinessScore) {
    blockingReasons.push({
      reasonType: 'readiness',
      description: `Readiness score too low`,
      missingValue: athleteReadinessScore,
      requiredValue: node.requiredReadinessScore,
      recommendedAction: 'Build foundational strength before attempting this progression.',
    })
  }
  
  // Check benchmarks
  for (const bench of node.requiredBenchmarks) {
    const athleteValue = athleteBenchmarks[bench.benchmarkType] || 0
    if (athleteValue < bench.minimumValue) {
      blockingReasons.push({
        reasonType: 'benchmark',
        description: bench.description,
        missingValue: athleteValue,
        requiredValue: bench.minimumValue,
        correspondingWeakPoint: mapBenchmarkToWeakPoint(bench.benchmarkType),
        recommendedAction: `Improve ${bench.benchmarkType} to ${bench.minimumValue} ${bench.unit}.`,
      })
    }
  }
  
  return {
    canProgress: blockingReasons.length === 0,
    blockingReasons,
  }
}

function mapBenchmarkToWeakPoint(benchmarkType: string): WeakPointType | undefined {
  const mapping: Record<string, WeakPointType> = {
    'pull_ups': 'pull_strength',
    'weighted_pull': 'pull_strength',
    'dips': 'push_strength',
    'weighted_dip': 'push_strength',
    'compression': 'compression_strength',
    'hold_time': 'straight_arm_pull_strength',
    'handstand_hold': 'balance_control',
  }
  return mapping[benchmarkType]
}

/**
 * Determine athlete's current position in a skill graph
 */
export function determineGraphPosition(
  skillId: SkillGraphId,
  athleteBenchmarks: Record<string, number>,
  athleteReadinessScore: number,
  currentHoldTime?: number,
  currentReps?: number
): AthleteGraphPosition | null {
  const graph = SKILL_PROGRESSION_GRAPHS[skillId]
  if (!graph) return null
  
  // Find highest unlocked node
  const unlockedNodes: string[] = []
  let currentNode = graph.nodes.find(n => n.nodeId === graph.entryNodeId)!
  let highestNode = currentNode
  
  // Traverse graph to find current position
  for (const node of graph.nodes) {
    const { canProgress } = canProgressToNode(
      node,
      athleteBenchmarks,
      athleteReadinessScore,
      unlockedNodes
    )
    
    if (canProgress || node.nodeId === graph.entryNodeId) {
      unlockedNodes.push(node.nodeId)
      if (node.levelIndex > highestNode.levelIndex) {
        highestNode = node
        currentNode = node
      }
    }
  }
  
  // Find next recommended node
  const nextNodes = getNextNodes(skillId, currentNode.nodeId)
  const nextRecommendedNode = nextNodes.length > 0 ? nextNodes[0] : null
  
  // Check if blocked
  let isBlocked = false
  let blockingReasons: BlockingReason[] = []
  
  if (nextRecommendedNode) {
    const progressCheck = canProgressToNode(
      nextRecommendedNode,
      athleteBenchmarks,
      athleteReadinessScore,
      unlockedNodes
    )
    isBlocked = !progressCheck.canProgress
    blockingReasons = progressCheck.blockingReasons
  }
  
  // Calculate progress within current node
  const currentProgress = currentHoldTime || currentReps || 0
  const goalProgress = currentNode.holdTimeGoal || currentNode.repsGoal || 1
  const ownershipThreshold = currentNode.minimumForOwnership
  
  const percentToOwnership = Math.min(100, (currentProgress / ownershipThreshold) * 100)
  const percentToNextNode = Math.min(100, (currentProgress / goalProgress) * 100)
  
  // Generate coaching message
  const coachingMessage = isBlocked
    ? `Focus on building ${blockingReasons[0]?.description || 'prerequisites'} before advancing.`
    : percentToNextNode >= 100
      ? `You're ready to attempt the next progression: ${nextRecommendedNode?.displayName || 'next level'}.`
      : `Continue building strength at ${currentNode.displayName}.`
  
  const actionableNextStep = isBlocked
    ? blockingReasons[0]?.recommendedAction || 'Build foundational strength.'
    : `Aim for ${goalProgress}s hold / ${goalProgress} reps at ${currentNode.displayName}.`
  
  return {
    skillId,
    athleteId: 'current',
    currentNodeId: currentNode.nodeId,
    currentNode,
    highestNodeId: highestNode.nodeId,
    highestNode,
    nextRecommendedNodeId: nextRecommendedNode?.nodeId || null,
    nextRecommendedNode,
    alternativeNextNodes: nextNodes.slice(1),
    isBlocked,
    blockingReasons,
    currentNodeProgress: {
      currentHoldTime,
      currentReps,
      percentToOwnership,
      percentToNextNode,
    },
    coachingMessage,
    actionableNextStep,
  }
}

/**
 * Get all nodes in a skill graph ordered by level
 */
export function getOrderedNodes(skillId: SkillGraphId): ProgressionNode[] {
  const graph = SKILL_PROGRESSION_GRAPHS[skillId]
  if (!graph) return []
  return [...graph.nodes].sort((a, b) => a.levelIndex - b.levelIndex)
}

/**
 * Validate graph structure (no cycles, all edges valid, etc.)
 */
export function validateGraph(skillId: SkillGraphId): { valid: boolean; errors: string[] } {
  const graph = SKILL_PROGRESSION_GRAPHS[skillId]
  if (!graph) return { valid: false, errors: ['Graph not found'] }
  
  const errors: string[] = []
  const nodeIds = new Set(graph.nodes.map(n => n.nodeId))
  
  // Check entry node exists
  if (!nodeIds.has(graph.entryNodeId)) {
    errors.push(`Entry node ${graph.entryNodeId} not found`)
  }
  
  // Check terminal nodes exist
  for (const terminalId of graph.terminalNodeIds) {
    if (!nodeIds.has(terminalId)) {
      errors.push(`Terminal node ${terminalId} not found`)
    }
  }
  
  // Check all edge references are valid
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.fromNodeId)) {
      errors.push(`Edge ${edge.edgeId} references invalid fromNode: ${edge.fromNodeId}`)
    }
    if (!nodeIds.has(edge.toNodeId)) {
      errors.push(`Edge ${edge.edgeId} references invalid toNode: ${edge.toNodeId}`)
    }
  }
  
  // Check all prerequisite references are valid
  for (const node of graph.nodes) {
    for (const prereq of node.requiredPrerequisiteNodes) {
      if (!nodeIds.has(prereq)) {
        errors.push(`Node ${node.nodeId} references invalid prerequisite: ${prereq}`)
      }
    }
  }
  
  return { valid: errors.length === 0, errors }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  getSkillGraph,
  getGraphNode,
  getNextNodes,
  canProgressToNode,
  determineGraphPosition,
  getOrderedNodes,
  validateGraph,
}
