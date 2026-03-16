/**
 * Advanced Skill Progression Graphs
 * 
 * Extension of the Skill Progression Graph Engine for advanced calisthenics skills.
 * These ladders require significant prerequisite completion and represent 
 * elite-level training goals.
 * 
 * Advanced Skills Covered:
 * - Maltese
 * - Planche Push-Ups
 * - Pseudo Planche Push-Ups (as foundation)
 * - Front Lever Pull-Ups
 * - One-Arm Front Lever Rows
 * - Slow Muscle-Up
 * - Weighted Muscle-Up
 */

import type {
  SkillProgressionGraph,
  ProgressionNode,
  ProgressionEdge,
  DifficultyLevel,
  JointStressLevel,
  MovementType,
  TransitionType,
  BenchmarkRequirement,
} from './skill-progression-graph-engine'

// =============================================================================
// ADVANCED SKILL IDS
// =============================================================================

export type AdvancedSkillGraphId =
  | 'maltese'
  | 'planche_pushup'
  | 'front_lever_pullup'
  | 'slow_muscle_up'
  | 'weighted_muscle_up'

// Extended skill registry including parent relationships
export interface AdvancedSkillDefinition {
  skillId: AdvancedSkillGraphId
  parentSkill: string | null  // The base skill this derives from
  movementFamily: string
  difficultyTier: 'elite' | 'master' | 'legendary'
  jointStressProfile: {
    shoulder: JointStressLevel
    wrist: JointStressLevel
    elbow: JointStressLevel
    bicepTendon: JointStressLevel
  }
  minimumExperienceMonths: number
  description: string
}

export const ADVANCED_SKILL_DEFINITIONS: Record<AdvancedSkillGraphId, AdvancedSkillDefinition> = {
  maltese: {
    skillId: 'maltese',
    parentSkill: 'iron_cross',
    movementFamily: 'straight_arm_push',
    difficultyTier: 'legendary',
    jointStressProfile: {
      shoulder: 'very_high',
      wrist: 'moderate',
      elbow: 'very_high',
      bicepTendon: 'very_high',
    },
    minimumExperienceMonths: 48,
    description: 'Elite rings straight-arm push hold requiring exceptional shoulder and tendon strength.',
  },
  planche_pushup: {
    skillId: 'planche_pushup',
    parentSkill: 'planche',
    movementFamily: 'straight_arm_push',
    difficultyTier: 'master',
    jointStressProfile: {
      shoulder: 'very_high',
      wrist: 'very_high',
      elbow: 'high',
      bicepTendon: 'high',
    },
    minimumExperienceMonths: 36,
    description: 'Dynamic pressing from planche position - combines planche strength with pressing power.',
  },
  front_lever_pullup: {
    skillId: 'front_lever_pullup',
    parentSkill: 'front_lever',
    movementFamily: 'straight_arm_pull',
    difficultyTier: 'elite',
    jointStressProfile: {
      shoulder: 'very_high',
      wrist: 'low',
      elbow: 'high',
      bicepTendon: 'very_high',
    },
    minimumExperienceMonths: 24,
    description: 'Dynamic pulling from front lever position - combines static hold with explosive pull.',
  },
  slow_muscle_up: {
    skillId: 'slow_muscle_up',
    parentSkill: 'muscle_up',
    movementFamily: 'explosive_pull',
    difficultyTier: 'elite',
    jointStressProfile: {
      shoulder: 'high',
      wrist: 'moderate',
      elbow: 'high',
      bicepTendon: 'high',
    },
    minimumExperienceMonths: 18,
    description: 'Controlled, tempo-based muscle-up emphasizing transition strength over explosiveness.',
  },
  weighted_muscle_up: {
    skillId: 'weighted_muscle_up',
    parentSkill: 'muscle_up',
    movementFamily: 'explosive_pull',
    difficultyTier: 'master',
    jointStressProfile: {
      shoulder: 'very_high',
      wrist: 'moderate',
      elbow: 'very_high',
      bicepTendon: 'very_high',
    },
    minimumExperienceMonths: 24,
    description: 'Loaded muscle-up building exceptional pulling power and transition strength.',
  },
}

// =============================================================================
// MALTESE PROGRESSION GRAPH
// =============================================================================

const MALTESE_NODES: ProgressionNode[] = [
  {
    nodeId: 'maltese_ring_support',
    skillId: 'iron_cross' as any, // Parent skill
    nodeName: 'ring_support_mastery',
    displayName: 'Ring Support Mastery',
    description: 'Elite-level ring support hold with complete stability and control.',
    difficultyLevel: 'advanced',
    levelIndex: 0,
    movementType: 'isometric_hold',
    requiredBenchmarks: [
      { benchmarkType: 'hold_time', minimumValue: 60, unit: 'seconds', description: '60s ring support' },
      { benchmarkType: 'dips', minimumValue: 20, unit: 'reps', description: '20+ ring dips' },
    ],
    requiredReadinessScore: 70,
    requiredPrerequisiteNodes: [],
    holdTimeGoal: 60,
    minimumForOwnership: 45,
    knowledgeBubble: {
      shortTip: 'Master complete stability before any Maltese progressions.',
      detailedExplanation: 'The Maltese demands exceptional ring control. Instability at this level will multiply under the extreme leverage demands of Maltese variations.',
      commonMistakes: ['Wobbling', 'Bent arms', 'Internal rotation'],
      techniqueCues: ['Locked elbows', 'Rings turned out', 'Shoulders depressed'],
    },
    jointStressLevel: 'moderate',
    primaryStressAreas: ['shoulder'],
    recommendedFrequency: { sessionsPerWeek: 4, restDaysMinimum: 1 },
  },
  {
    nodeId: 'maltese_wide_support',
    skillId: 'iron_cross' as any,
    nodeName: 'wide_ring_support',
    displayName: 'Wide Ring Support',
    description: 'Ring support with arms wider than normal - builds lateral shoulder strength.',
    difficultyLevel: 'advanced',
    levelIndex: 1,
    movementType: 'isometric_hold',
    requiredBenchmarks: [
      { benchmarkType: 'hold_time', minimumValue: 30, unit: 'seconds', description: '30s wide support' },
    ],
    requiredReadinessScore: 75,
    requiredPrerequisiteNodes: ['maltese_ring_support'],
    holdTimeGoal: 30,
    minimumForOwnership: 20,
    knowledgeBubble: {
      shortTip: 'Start at modest width and gradually widen over weeks.',
      detailedExplanation: 'Wide support introduces lateral shoulder stress similar to cross patterns. This is the first step toward the extreme abduction demands of Maltese.',
      commonMistakes: ['Going too wide too fast', 'Bent elbows', 'Shrugged shoulders'],
      techniqueCues: ['Keep arms straight', 'Depress shoulders', 'Control ring rotation'],
    },
    jointStressLevel: 'high',
    primaryStressAreas: ['shoulder', 'bicep_tendon'],
    recommendedFrequency: { sessionsPerWeek: 3, restDaysMinimum: 2 },
  },
  {
    nodeId: 'maltese_assisted',
    skillId: 'iron_cross' as any,
    nodeName: 'assisted_maltese_support',
    displayName: 'Assisted Maltese Support',
    description: 'Maltese position with band or foot support - introduces full position safely.',
    difficultyLevel: 'elite',
    levelIndex: 2,
    movementType: 'assisted',
    requiredBenchmarks: [
      { benchmarkType: 'hold_time', minimumValue: 45, unit: 'seconds', description: '45s iron cross hold (assisted OK)' },
    ],
    requiredReadinessScore: 80,
    requiredPrerequisiteNodes: ['maltese_wide_support'],
    holdTimeGoal: 20,
    minimumForOwnership: 12,
    knowledgeBubble: {
      shortTip: 'Use bands to learn body position before full loading.',
      detailedExplanation: 'Assisted work lets you learn the Maltese position pattern without full tendon stress. Focus on the horizontal body alignment and straight-arm integrity.',
      commonMistakes: ['Relying too much on assistance', 'Bent elbows', 'Arched back'],
      techniqueCues: ['Body horizontal', 'Arms slightly behind torso plane', 'Squeeze glutes'],
    },
    jointStressLevel: 'high',
    primaryStressAreas: ['shoulder', 'bicep_tendon', 'elbow'],
    recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 3 },
  },
  {
    nodeId: 'maltese_band',
    skillId: 'iron_cross' as any,
    nodeName: 'band_assisted_maltese',
    displayName: 'Band-Assisted Maltese',
    description: 'Light band assistance only - near-full loading with safety net.',
    difficultyLevel: 'elite',
    levelIndex: 3,
    movementType: 'assisted',
    requiredBenchmarks: [
      { benchmarkType: 'hold_time', minimumValue: 15, unit: 'seconds', description: '15s assisted maltese' },
    ],
    requiredReadinessScore: 85,
    requiredPrerequisiteNodes: ['maltese_assisted'],
    holdTimeGoal: 15,
    minimumForOwnership: 10,
    knowledgeBubble: {
      shortTip: 'Progressively reduce band assistance over months.',
      detailedExplanation: 'Use lighter bands as strength develops. The transition from band-assisted to unassisted is long - expect months at this stage.',
      commonMistakes: ['Dropping assistance too fast', 'Training too frequently', 'Ignoring tendon feedback'],
      techniqueCues: ['Same form as full maltese', 'Control entry and exit', 'Listen to tendons'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['shoulder', 'bicep_tendon', 'elbow'],
    recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 3 },
  },
  {
    nodeId: 'maltese_negative',
    skillId: 'iron_cross' as any,
    nodeName: 'maltese_negative',
    displayName: 'Maltese Negative',
    description: 'Controlled lowering into Maltese position - eccentric strength builder.',
    difficultyLevel: 'elite',
    levelIndex: 4,
    movementType: 'negative',
    requiredBenchmarks: [
      { benchmarkType: 'hold_time', minimumValue: 10, unit: 'seconds', description: '10s light-band maltese' },
    ],
    requiredReadinessScore: 88,
    requiredPrerequisiteNodes: ['maltese_band'],
    holdTimeGoal: 8,
    repsGoal: 3,
    minimumForOwnership: 5,
    knowledgeBubble: {
      shortTip: 'Negatives build the eccentric strength needed for holds.',
      detailedExplanation: 'Controlled maltese negatives develop the specific strength pattern. Use a 5-8 second lowering tempo and bail safely at the bottom.',
      commonMistakes: ['Dropping too fast', 'Training to tendon pain', 'High volume'],
      techniqueCues: ['Slow, controlled descent', '5-8 second negative', 'Full body tension'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['shoulder', 'bicep_tendon', 'elbow'],
    recommendedFrequency: { sessionsPerWeek: 1, restDaysMinimum: 4 },
  },
  {
    nodeId: 'maltese_partial',
    skillId: 'iron_cross' as any,
    nodeName: 'partial_maltese',
    displayName: 'Partial Maltese',
    description: 'Hold at partial depth - builds toward full range.',
    difficultyLevel: 'master',
    levelIndex: 5,
    movementType: 'isometric_hold',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 5, unit: 'reps', description: '5 controlled maltese negatives' },
    ],
    requiredReadinessScore: 92,
    requiredPrerequisiteNodes: ['maltese_negative'],
    holdTimeGoal: 5,
    minimumForOwnership: 3,
    knowledgeBubble: {
      shortTip: 'Partial holds build confidence and strength at manageable ranges.',
      detailedExplanation: 'Holding at partial depth lets you accumulate time under tension while managing joint stress. Gradually deepen the position over months.',
      commonMistakes: ['Going too deep too soon', 'Sacrificing form for depth', 'Overtraining'],
      techniqueCues: ['Hold where you can maintain form', 'Breathe steadily', 'Exit under control'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['shoulder', 'bicep_tendon', 'elbow'],
    recommendedFrequency: { sessionsPerWeek: 1, restDaysMinimum: 5 },
  },
  {
    nodeId: 'maltese_full',
    skillId: 'iron_cross' as any,
    nodeName: 'full_maltese',
    displayName: 'Full Maltese',
    description: 'Complete Maltese hold - one of the most demanding gymnastics elements.',
    difficultyLevel: 'master',
    levelIndex: 6,
    movementType: 'isometric_hold',
    requiredBenchmarks: [
      { benchmarkType: 'hold_time', minimumValue: 3, unit: 'seconds', description: '3s partial maltese' },
    ],
    requiredReadinessScore: 95,
    requiredPrerequisiteNodes: ['maltese_partial'],
    holdTimeGoal: 3,
    minimumForOwnership: 2,
    knowledgeBubble: {
      shortTip: 'The Maltese is a multi-year goal requiring exceptional dedication.',
      detailedExplanation: 'Full Maltese represents elite-level rings strength. Very few athletes achieve this skill. Respect the timeline and prioritize tendon health.',
      commonMistakes: ['Rushing the journey', 'Ignoring pain signals', 'Insufficient recovery'],
      techniqueCues: ['Perfect form always', 'Every second counts', 'Quality over quantity'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['shoulder', 'bicep_tendon', 'elbow'],
    recommendedFrequency: { sessionsPerWeek: 1, restDaysMinimum: 6 },
  },
]

export const MALTESE_GRAPH: SkillProgressionGraph = {
  skillId: 'iron_cross' as any, // Uses parent skill ID for graph lookup
  skillName: 'Maltese',
  description: 'Elite rings element requiring years of dedicated straight-arm strength development.',
  category: 'rings',
  
  entryNodeId: 'maltese_ring_support',
  terminalNodeIds: ['maltese_full'],
  
  globalPrerequisites: {
    description: 'Elite rings foundation and iron cross base',
    benchmarks: [
      { benchmarkType: 'hold_time', minimumValue: 30, unit: 'seconds', description: 'Iron cross hold (any assistance)' },
      { benchmarkType: 'dips', minimumValue: 30, unit: 'reps', description: '30+ ring dips' },
    ],
  },
  
  generalSafetyWarnings: [
    'This skill requires years of preparation - do not rush',
    'Shoulder and bicep tendon injuries are common if progressed too fast',
    'Train with a spotter or safety setup when possible',
    'Any tendon pain requires immediate deload',
    'Low frequency, high recovery is mandatory',
  ],
  
  nodes: MALTESE_NODES,
  
  edges: [
    { edgeId: 'maltese_e0', fromNodeId: 'maltese_ring_support', toNodeId: 'maltese_wide_support', transitionType: 'progression', minimumRequirements: { fromNodeHoldTime: 45 }, notes: 'Master ring support completely first', expectedTransitionWeeks: 8, isRecommendedPath: true },
    { edgeId: 'maltese_e1', fromNodeId: 'maltese_wide_support', toNodeId: 'maltese_assisted', transitionType: 'progression', minimumRequirements: { fromNodeHoldTime: 20 }, notes: 'Build lateral shoulder strength', expectedTransitionWeeks: 12, isRecommendedPath: true },
    { edgeId: 'maltese_e2', fromNodeId: 'maltese_assisted', toNodeId: 'maltese_band', transitionType: 'progression', minimumRequirements: { fromNodeHoldTime: 12 }, notes: 'Learn position pattern', expectedTransitionWeeks: 16, isRecommendedPath: true },
    { edgeId: 'maltese_e3', fromNodeId: 'maltese_band', toNodeId: 'maltese_negative', transitionType: 'progression', minimumRequirements: { fromNodeHoldTime: 10 }, notes: 'Reduce assistance progressively', expectedTransitionWeeks: 20, isRecommendedPath: true },
    { edgeId: 'maltese_e4', fromNodeId: 'maltese_negative', toNodeId: 'maltese_partial', transitionType: 'progression', minimumRequirements: { fromNodeReps: 5 }, notes: 'Build eccentric strength', expectedTransitionWeeks: 24, isRecommendedPath: true },
    { edgeId: 'maltese_e5', fromNodeId: 'maltese_partial', toNodeId: 'maltese_full', transitionType: 'progression', minimumRequirements: { fromNodeHoldTime: 3 }, notes: 'Deepen partial holds over months', expectedTransitionWeeks: 32, isRecommendedPath: true },
  ],
}

// =============================================================================
// PLANCHE PUSH-UP PROGRESSION GRAPH
// =============================================================================

const PLANCHE_PUSHUP_NODES: ProgressionNode[] = [
  {
    nodeId: 'pppu_foundation',
    skillId: 'planche' as any,
    nodeName: 'pseudo_planche_pushup_foundation',
    displayName: 'Pseudo Planche Push-Up Foundation',
    description: 'Forward-leaning push-up building planche pressing base.',
    difficultyLevel: 'intermediate',
    levelIndex: 0,
    movementType: 'dynamic_strength',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 20, unit: 'reps', description: '20+ push-ups' },
      { benchmarkType: 'hold_time', minimumValue: 30, unit: 'seconds', description: '30s planche lean' },
    ],
    requiredReadinessScore: 50,
    requiredPrerequisiteNodes: [],
    repsGoal: 12,
    minimumForOwnership: 8,
    knowledgeBubble: {
      shortTip: 'Lean forward until shoulders are over or past wrists.',
      detailedExplanation: 'The pseudo planche push-up (PPPU) is the foundational pressing movement for planche work. The forward lean loads the shoulders like planche while building dynamic strength.',
      commonMistakes: ['Not leaning forward enough', 'Sagging hips', 'Flared elbows'],
      techniqueCues: ['Shoulders past wrists', 'Hollow body position', 'Protract at top'],
    },
    jointStressLevel: 'moderate',
    primaryStressAreas: ['wrist', 'shoulder'],
    recommendedFrequency: { sessionsPerWeek: 3, restDaysMinimum: 1 },
  },
  {
    nodeId: 'pppu_elevated',
    skillId: 'planche' as any,
    nodeName: 'elevated_pppu',
    displayName: 'Elevated Pseudo Planche Push-Up',
    description: 'PPPU with feet elevated for increased forward lean.',
    difficultyLevel: 'intermediate',
    levelIndex: 1,
    movementType: 'dynamic_strength',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 10, unit: 'reps', description: '10+ floor PPPU' },
    ],
    requiredReadinessScore: 55,
    requiredPrerequisiteNodes: ['pppu_foundation'],
    repsGoal: 10,
    minimumForOwnership: 6,
    knowledgeBubble: {
      shortTip: 'Feet elevation increases the lean angle significantly.',
      detailedExplanation: 'Elevating the feet shifts more weight forward, increasing shoulder loading. Start with modest elevation and progress height as strength develops.',
      commonMistakes: ['Elevation too high', 'Losing hollow body', 'Incomplete range of motion'],
      techniqueCues: ['Maintain hollow throughout', 'Full range of motion', 'Control the descent'],
    },
    jointStressLevel: 'moderate',
    primaryStressAreas: ['wrist', 'shoulder'],
    recommendedFrequency: { sessionsPerWeek: 3, restDaysMinimum: 1 },
  },
  {
    nodeId: 'tuck_pp_assisted',
    skillId: 'planche' as any,
    nodeName: 'tuck_planche_pushup_assisted',
    displayName: 'Tuck Planche Push-Up (Assisted)',
    description: 'Band-assisted tuck planche push-up - introduces true planche pressing.',
    difficultyLevel: 'advanced',
    levelIndex: 2,
    movementType: 'assisted',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 8, unit: 'reps', description: '8+ elevated PPPU' },
      { benchmarkType: 'hold_time', minimumValue: 15, unit: 'seconds', description: '15s tuck planche hold' },
    ],
    requiredReadinessScore: 65,
    requiredPrerequisiteNodes: ['pppu_elevated'],
    repsGoal: 8,
    minimumForOwnership: 5,
    knowledgeBubble: {
      shortTip: 'Band assistance lets you practice the pattern before full loading.',
      detailedExplanation: 'The tuck planche push-up requires pressing from a fully supported planche position. Band assistance reduces load while you learn the movement pattern.',
      commonMistakes: ['Over-reliance on band', 'Hips dropping', 'Incomplete press'],
      techniqueCues: ['Maintain tuck planche position', 'Press through full range', 'Control throughout'],
    },
    jointStressLevel: 'high',
    primaryStressAreas: ['wrist', 'shoulder'],
    recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 2 },
  },
  {
    nodeId: 'tuck_pp',
    skillId: 'planche' as any,
    nodeName: 'tuck_planche_pushup',
    displayName: 'Tuck Planche Push-Up',
    description: 'Full tuck planche push-up without assistance.',
    difficultyLevel: 'advanced',
    levelIndex: 3,
    movementType: 'dynamic_strength',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 5, unit: 'reps', description: '5+ assisted tuck planche push-ups' },
      { benchmarkType: 'hold_time', minimumValue: 20, unit: 'seconds', description: '20s tuck planche hold' },
    ],
    requiredReadinessScore: 72,
    requiredPrerequisiteNodes: ['tuck_pp_assisted'],
    repsGoal: 6,
    minimumForOwnership: 3,
    knowledgeBubble: {
      shortTip: 'Quality over quantity - each rep should be controlled.',
      detailedExplanation: 'The tuck planche push-up is a genuine advanced skill. Focus on perfect form for low reps rather than grinding out sloppy repetitions.',
      commonMistakes: ['Kipping', 'Losing planche position', 'Partial reps'],
      techniqueCues: ['Start and end in tuck planche', 'Full press each rep', 'Pause at top'],
    },
    jointStressLevel: 'high',
    primaryStressAreas: ['wrist', 'shoulder'],
    recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 2 },
  },
  {
    nodeId: 'adv_tuck_pp',
    skillId: 'planche' as any,
    nodeName: 'advanced_tuck_planche_pushup',
    displayName: 'Advanced Tuck Planche Push-Up',
    description: 'Extended hip angle planche push-up.',
    difficultyLevel: 'elite',
    levelIndex: 4,
    movementType: 'dynamic_strength',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 5, unit: 'reps', description: '5+ tuck planche push-ups' },
      { benchmarkType: 'hold_time', minimumValue: 10, unit: 'seconds', description: '10s advanced tuck planche hold' },
    ],
    requiredReadinessScore: 80,
    requiredPrerequisiteNodes: ['tuck_pp'],
    repsGoal: 5,
    minimumForOwnership: 3,
    knowledgeBubble: {
      shortTip: 'The advanced tuck dramatically increases difficulty.',
      detailedExplanation: 'Opening the hip angle extends the lever arm significantly. Expect a major strength requirement increase compared to basic tuck.',
      commonMistakes: ['Hip angle not open enough', 'Collapsing mid-rep', 'Rushing'],
      techniqueCues: ['Open hip angle', 'Maintain throughout rep', 'Control every phase'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['wrist', 'shoulder'],
    recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 3 },
  },
  {
    nodeId: 'straddle_pp',
    skillId: 'planche' as any,
    nodeName: 'straddle_planche_pushup',
    displayName: 'Straddle Planche Push-Up',
    description: 'Near-full planche pressing with straddled legs.',
    difficultyLevel: 'elite',
    levelIndex: 5,
    movementType: 'dynamic_strength',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 3, unit: 'reps', description: '3+ advanced tuck planche push-ups' },
      { benchmarkType: 'hold_time', minimumValue: 8, unit: 'seconds', description: '8s straddle planche hold' },
    ],
    requiredReadinessScore: 88,
    requiredPrerequisiteNodes: ['adv_tuck_pp'],
    repsGoal: 4,
    minimumForOwnership: 2,
    knowledgeBubble: {
      shortTip: 'Straddle planche push-ups require near-full planche strength.',
      detailedExplanation: 'The straddle position demands almost complete planche pressing strength. Most athletes spend significant time here before attempting full.',
      commonMistakes: ['Straddle too narrow', 'Incomplete press', 'Loss of body line'],
      techniqueCues: ['Wide straddle', 'Full press to planche', 'Maintain tension'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['wrist', 'shoulder'],
    recommendedFrequency: { sessionsPerWeek: 1, restDaysMinimum: 3 },
  },
  {
    nodeId: 'full_pp',
    skillId: 'planche' as any,
    nodeName: 'full_planche_pushup',
    displayName: 'Full Planche Push-Up',
    description: 'Complete planche push-up with legs together - the ultimate goal.',
    difficultyLevel: 'master',
    levelIndex: 6,
    movementType: 'dynamic_strength',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 2, unit: 'reps', description: '2+ straddle planche push-ups' },
      { benchmarkType: 'hold_time', minimumValue: 5, unit: 'seconds', description: '5s full planche hold' },
    ],
    requiredReadinessScore: 95,
    requiredPrerequisiteNodes: ['straddle_pp'],
    repsGoal: 3,
    minimumForOwnership: 1,
    knowledgeBubble: {
      shortTip: 'Full planche push-up is one of the most impressive calisthenics skills.',
      detailedExplanation: 'A full planche push-up requires years of dedicated training. Even a single clean rep represents elite-level strength.',
      commonMistakes: ['Attempting before ready', 'Poor form for ego', 'Overtraining'],
      techniqueCues: ['Perfect form only', 'Every rep counts', 'Respect the journey'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['wrist', 'shoulder'],
    recommendedFrequency: { sessionsPerWeek: 1, restDaysMinimum: 4 },
  },
]

export const PLANCHE_PUSHUP_GRAPH: SkillProgressionGraph = {
  skillId: 'planche' as any,
  skillName: 'Planche Push-Up',
  description: 'Dynamic pressing from planche position - combines static planche with explosive pressing power.',
  category: 'push',
  
  entryNodeId: 'pppu_foundation',
  terminalNodeIds: ['full_pp'],
  
  globalPrerequisites: {
    description: 'Strong planche foundation and pressing base',
    benchmarks: [
      { benchmarkType: 'reps', minimumValue: 30, unit: 'reps', description: '30+ push-ups' },
      { benchmarkType: 'hold_time', minimumValue: 15, unit: 'seconds', description: '15s tuck planche' },
    ],
  },
  
  generalSafetyWarnings: [
    'Wrist conditioning is essential - do not skip warm-ups',
    'Progress gradually to protect shoulders',
    'Stop if experiencing elbow or wrist pain',
    'Full planche push-ups are a multi-year goal',
  ],
  
  nodes: PLANCHE_PUSHUP_NODES,
  
  edges: [
    { edgeId: 'pppu_e0', fromNodeId: 'pppu_foundation', toNodeId: 'pppu_elevated', transitionType: 'progression', minimumRequirements: { fromNodeReps: 10 }, notes: 'Master floor PPPU first', expectedTransitionWeeks: 6, isRecommendedPath: true },
    { edgeId: 'pppu_e1', fromNodeId: 'pppu_elevated', toNodeId: 'tuck_pp_assisted', transitionType: 'progression', minimumRequirements: { fromNodeReps: 8 }, notes: 'Strong elevated PPPU needed', expectedTransitionWeeks: 10, isRecommendedPath: true },
    { edgeId: 'pppu_e2', fromNodeId: 'tuck_pp_assisted', toNodeId: 'tuck_pp', transitionType: 'progression', minimumRequirements: { fromNodeReps: 6 }, notes: 'Reduce assistance gradually', expectedTransitionWeeks: 12, isRecommendedPath: true },
    { edgeId: 'pppu_e3', fromNodeId: 'tuck_pp', toNodeId: 'adv_tuck_pp', transitionType: 'progression', minimumRequirements: { fromNodeReps: 5 }, notes: 'Solid tuck planche push-ups', expectedTransitionWeeks: 16, isRecommendedPath: true },
    { edgeId: 'pppu_e4', fromNodeId: 'adv_tuck_pp', toNodeId: 'straddle_pp', transitionType: 'progression', minimumRequirements: { fromNodeReps: 4 }, notes: 'Strong advanced tuck', expectedTransitionWeeks: 20, isRecommendedPath: true },
    { edgeId: 'pppu_e5', fromNodeId: 'straddle_pp', toNodeId: 'full_pp', transitionType: 'progression', minimumRequirements: { fromNodeReps: 3 }, notes: 'Near-mastery of straddle', expectedTransitionWeeks: 24, isRecommendedPath: true },
  ],
}

// =============================================================================
// FRONT LEVER PULL-UP PROGRESSION GRAPH
// =============================================================================

const FL_PULLUP_NODES: ProgressionNode[] = [
  {
    nodeId: 'flpu_tuck_row',
    skillId: 'front_lever' as any,
    nodeName: 'tuck_front_lever_row',
    displayName: 'Tuck Front Lever Row',
    description: 'Dynamic pulling from tuck FL position - builds FL pulling base.',
    difficultyLevel: 'intermediate',
    levelIndex: 0,
    movementType: 'dynamic_strength',
    requiredBenchmarks: [
      { benchmarkType: 'hold_time', minimumValue: 15, unit: 'seconds', description: '15s tuck front lever hold' },
      { benchmarkType: 'pull_ups', minimumValue: 12, unit: 'reps', description: '12+ pull-ups' },
    ],
    requiredReadinessScore: 55,
    requiredPrerequisiteNodes: [],
    repsGoal: 10,
    minimumForOwnership: 6,
    knowledgeBubble: {
      shortTip: 'Start in tuck FL, row to chest, return to full extension.',
      detailedExplanation: 'Tuck FL rows build the dynamic pulling strength specific to front lever work. Focus on pulling to chest level while maintaining the tuck position.',
      commonMistakes: ['Hips dropping', 'Partial pulls', 'Using momentum'],
      techniqueCues: ['Start in solid tuck FL', 'Pull bar to chest', 'Extend fully each rep'],
    },
    jointStressLevel: 'moderate',
    primaryStressAreas: ['bicep_tendon', 'shoulder'],
    recommendedFrequency: { sessionsPerWeek: 3, restDaysMinimum: 1 },
  },
  {
    nodeId: 'flpu_adv_tuck_row',
    skillId: 'front_lever' as any,
    nodeName: 'advanced_tuck_front_lever_row',
    displayName: 'Advanced Tuck FL Row',
    description: 'Rows from advanced tuck position - significantly harder lever arm.',
    difficultyLevel: 'advanced',
    levelIndex: 1,
    movementType: 'dynamic_strength',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 8, unit: 'reps', description: '8+ tuck FL rows' },
      { benchmarkType: 'hold_time', minimumValue: 10, unit: 'seconds', description: '10s advanced tuck FL hold' },
    ],
    requiredReadinessScore: 65,
    requiredPrerequisiteNodes: ['flpu_tuck_row'],
    repsGoal: 8,
    minimumForOwnership: 5,
    knowledgeBubble: {
      shortTip: 'The open hip angle makes this significantly harder than tuck.',
      detailedExplanation: 'Advanced tuck FL rows require much more lat and scapular strength. Expect a substantial drop in reps when transitioning from tuck.',
      commonMistakes: ['Not opening hip angle enough', 'Losing position mid-rep', 'Cheating range'],
      techniqueCues: ['Open hip angle', 'Full range of motion', 'Control throughout'],
    },
    jointStressLevel: 'high',
    primaryStressAreas: ['bicep_tendon', 'shoulder'],
    recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 2 },
  },
  {
    nodeId: 'flpu_one_leg_row',
    skillId: 'front_lever' as any,
    nodeName: 'one_leg_front_lever_row',
    displayName: 'One Leg FL Row',
    description: 'Front lever row with one leg extended.',
    difficultyLevel: 'advanced',
    levelIndex: 2,
    movementType: 'dynamic_strength',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 6, unit: 'reps', description: '6+ advanced tuck FL rows' },
      { benchmarkType: 'hold_time', minimumValue: 8, unit: 'seconds', description: '8s one leg FL hold' },
    ],
    requiredReadinessScore: 72,
    requiredPrerequisiteNodes: ['flpu_adv_tuck_row'],
    repsGoal: 6,
    minimumForOwnership: 4,
    knowledgeBubble: {
      shortTip: 'Alternate legs to build balanced strength.',
      detailedExplanation: 'One leg FL rows bridge the gap between tucked and straight-body positions. Train both sides to develop balanced pulling power.',
      commonMistakes: ['Twisting toward extended leg', 'Leg dropping', 'Rushing'],
      techniqueCues: ['Keep hips square', 'Extend leg parallel to floor', 'Control the row'],
    },
    jointStressLevel: 'high',
    primaryStressAreas: ['bicep_tendon', 'shoulder'],
    recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 2 },
  },
  {
    nodeId: 'flpu_straddle_row',
    skillId: 'front_lever' as any,
    nodeName: 'straddle_front_lever_row',
    displayName: 'Straddle FL Row',
    description: 'Near-full FL pulling with straddled legs.',
    difficultyLevel: 'elite',
    levelIndex: 3,
    movementType: 'dynamic_strength',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 5, unit: 'reps', description: '5+ one leg FL rows' },
      { benchmarkType: 'hold_time', minimumValue: 6, unit: 'seconds', description: '6s straddle FL hold' },
    ],
    requiredReadinessScore: 82,
    requiredPrerequisiteNodes: ['flpu_one_leg_row'],
    repsGoal: 5,
    minimumForOwnership: 3,
    knowledgeBubble: {
      shortTip: 'Straddle rows require near-full FL pulling strength.',
      detailedExplanation: 'The straddle position demands significant strength while providing a meaningful stepping stone to full FL pulling work.',
      commonMistakes: ['Straddle too narrow', 'Incomplete pulls', 'Losing horizontal line'],
      techniqueCues: ['Wide straddle', 'Full range pulls', 'Maintain body line'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['bicep_tendon', 'shoulder'],
    recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 3 },
  },
  {
    nodeId: 'flpu_full',
    skillId: 'front_lever' as any,
    nodeName: 'front_lever_pullup',
    displayName: 'Front Lever Pull-Up',
    description: 'Full front lever pull-up with legs together.',
    difficultyLevel: 'elite',
    levelIndex: 4,
    movementType: 'dynamic_strength',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 4, unit: 'reps', description: '4+ straddle FL rows' },
      { benchmarkType: 'hold_time', minimumValue: 5, unit: 'seconds', description: '5s full FL hold' },
    ],
    requiredReadinessScore: 90,
    requiredPrerequisiteNodes: ['flpu_straddle_row'],
    repsGoal: 4,
    minimumForOwnership: 2,
    knowledgeBubble: {
      shortTip: 'Combines static FL strength with powerful dynamic pulling.',
      detailedExplanation: 'The front lever pull-up is a prestigious skill requiring both isometric and concentric pulling power at extreme leverage.',
      commonMistakes: ['Rushing before ready', 'Kipping', 'Partial reps'],
      techniqueCues: ['Start in full FL', 'Pull to chest', 'Control descent'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['bicep_tendon', 'shoulder'],
    recommendedFrequency: { sessionsPerWeek: 1, restDaysMinimum: 3 },
  },
  {
    nodeId: 'flpu_one_arm_row',
    skillId: 'front_lever' as any,
    nodeName: 'one_arm_front_lever_row',
    displayName: 'One Arm FL Row',
    description: 'Ultimate FL pulling expression - single arm front lever row.',
    difficultyLevel: 'master',
    levelIndex: 5,
    movementType: 'dynamic_strength',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 3, unit: 'reps', description: '3+ full FL pull-ups' },
      { benchmarkType: 'weighted_pull', minimumValue: 80, unit: 'percent_bw', description: '+80% BW weighted pull' },
    ],
    requiredReadinessScore: 95,
    requiredPrerequisiteNodes: ['flpu_full'],
    repsGoal: 3,
    minimumForOwnership: 1,
    knowledgeBubble: {
      shortTip: 'One of the most demanding pulling skills in existence.',
      detailedExplanation: 'The one-arm FL row requires exceptional unilateral pulling strength at extreme leverage. Very few athletes achieve this skill.',
      commonMistakes: ['Attempting without foundation', 'Rotation', 'Ego lifting'],
      techniqueCues: ['Perfect FL position', 'Anti-rotation focus', 'Full range'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['bicep_tendon', 'shoulder', 'elbow'],
    recommendedFrequency: { sessionsPerWeek: 1, restDaysMinimum: 4 },
  },
]

export const FRONT_LEVER_PULLUP_GRAPH: SkillProgressionGraph = {
  skillId: 'front_lever' as any,
  skillName: 'Front Lever Pull-Up',
  description: 'Dynamic pulling from front lever position - combines static hold with explosive pull.',
  category: 'pull',
  
  entryNodeId: 'flpu_tuck_row',
  terminalNodeIds: ['flpu_one_arm_row'],
  
  globalPrerequisites: {
    description: 'Strong front lever foundation and pulling base',
    benchmarks: [
      { benchmarkType: 'hold_time', minimumValue: 15, unit: 'seconds', description: '15s tuck front lever' },
      { benchmarkType: 'pull_ups', minimumValue: 15, unit: 'reps', description: '15+ strict pull-ups' },
    ],
  },
  
  generalSafetyWarnings: [
    'Bicep tendon stress is high - warm up thoroughly',
    'Progress gradually through each level',
    'Do not train through pain',
    'One-arm variations are multi-year goals',
  ],
  
  nodes: FL_PULLUP_NODES,
  
  edges: [
    { edgeId: 'flpu_e0', fromNodeId: 'flpu_tuck_row', toNodeId: 'flpu_adv_tuck_row', transitionType: 'progression', minimumRequirements: { fromNodeReps: 8 }, notes: 'Master tuck FL rows first', expectedTransitionWeeks: 8, isRecommendedPath: true },
    { edgeId: 'flpu_e1', fromNodeId: 'flpu_adv_tuck_row', toNodeId: 'flpu_one_leg_row', transitionType: 'progression', minimumRequirements: { fromNodeReps: 6 }, notes: 'Strong advanced tuck rows', expectedTransitionWeeks: 10, isRecommendedPath: true },
    { edgeId: 'flpu_e2', fromNodeId: 'flpu_one_leg_row', toNodeId: 'flpu_straddle_row', transitionType: 'progression', minimumRequirements: { fromNodeReps: 5 }, notes: 'Balanced one leg rows', expectedTransitionWeeks: 12, isRecommendedPath: true },
    { edgeId: 'flpu_e3', fromNodeId: 'flpu_straddle_row', toNodeId: 'flpu_full', transitionType: 'progression', minimumRequirements: { fromNodeReps: 4 }, notes: 'Solid straddle FL rows', expectedTransitionWeeks: 16, isRecommendedPath: true },
    { edgeId: 'flpu_e4', fromNodeId: 'flpu_full', toNodeId: 'flpu_one_arm_row', transitionType: 'progression', minimumRequirements: { fromNodeReps: 3 }, notes: 'Strong full FL pull-ups', expectedTransitionWeeks: 52, isRecommendedPath: true },
  ],
}

// =============================================================================
// SLOW MUSCLE-UP PROGRESSION GRAPH
// =============================================================================

const SLOW_MU_NODES: ProgressionNode[] = [
  {
    nodeId: 'smu_strict',
    skillId: 'muscle_up' as any,
    nodeName: 'strict_muscle_up',
    displayName: 'Strict Muscle-Up',
    description: 'Clean muscle-up with minimal kip - foundation for tempo work.',
    difficultyLevel: 'advanced',
    levelIndex: 0,
    movementType: 'explosive',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 3, unit: 'reps', description: '3+ muscle-ups' },
      { benchmarkType: 'pull_ups', minimumValue: 15, unit: 'reps', description: '15+ pull-ups' },
    ],
    requiredReadinessScore: 65,
    requiredPrerequisiteNodes: [],
    repsGoal: 5,
    minimumForOwnership: 3,
    knowledgeBubble: {
      shortTip: 'Minimize kip to build true transition strength.',
      detailedExplanation: 'A strict muscle-up uses minimal swing or kip, relying on raw pulling power and transition strength. This is the foundation for all tempo variations.',
      commonMistakes: ['Excessive kipping', 'Chicken wing transition', 'Incomplete lockout'],
      techniqueCues: ['Minimal swing', 'Fast transition', 'Full lockout'],
    },
    jointStressLevel: 'high',
    primaryStressAreas: ['shoulder', 'elbow'],
    recommendedFrequency: { sessionsPerWeek: 3, restDaysMinimum: 1 },
  },
  {
    nodeId: 'smu_slow',
    skillId: 'muscle_up' as any,
    nodeName: 'slow_muscle_up',
    displayName: 'Slow Muscle-Up',
    description: '3-5 second pull phase with controlled transition.',
    difficultyLevel: 'elite',
    levelIndex: 1,
    movementType: 'dynamic_strength',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 5, unit: 'reps', description: '5+ strict muscle-ups' },
      { benchmarkType: 'weighted_pull', minimumValue: 25, unit: 'percent_bw', description: '+25% BW weighted pull' },
    ],
    requiredReadinessScore: 75,
    requiredPrerequisiteNodes: ['smu_strict'],
    repsGoal: 4,
    minimumForOwnership: 2,
    knowledgeBubble: {
      shortTip: 'Slow muscle-ups eliminate momentum dependency.',
      detailedExplanation: 'A 3-5 second pull phase forces pure strength through the entire movement. This builds exceptional transition control.',
      commonMistakes: ['Speeding up at transition', 'Losing control', 'Partial tempo'],
      techniqueCues: ['Consistent tempo throughout', 'No acceleration at transition', 'Full control'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['shoulder', 'elbow', 'bicep_tendon'],
    recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 2 },
  },
  {
    nodeId: 'smu_tempo',
    skillId: 'muscle_up' as any,
    nodeName: 'tempo_slow_muscle_up',
    displayName: 'Tempo Slow Muscle-Up',
    description: '5-8 second pull phase - extreme control demonstration.',
    difficultyLevel: 'elite',
    levelIndex: 2,
    movementType: 'dynamic_strength',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 3, unit: 'reps', description: '3+ slow muscle-ups' },
      { benchmarkType: 'weighted_pull', minimumValue: 35, unit: 'percent_bw', description: '+35% BW weighted pull' },
    ],
    requiredReadinessScore: 82,
    requiredPrerequisiteNodes: ['smu_slow'],
    repsGoal: 3,
    minimumForOwnership: 2,
    knowledgeBubble: {
      shortTip: 'Extended tempo reveals true strength through the entire range.',
      detailedExplanation: 'A 5-8 second pull phase eliminates all momentum. Only raw pulling power gets you through the transition.',
      commonMistakes: ['Breaking tempo', 'Speeding through sticking points', 'Sacrificing form'],
      techniqueCues: ['Metronome-like consistency', 'Same speed everywhere', 'Total body tension'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['shoulder', 'elbow', 'bicep_tendon'],
    recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 3 },
  },
]

export const SLOW_MUSCLE_UP_GRAPH: SkillProgressionGraph = {
  skillId: 'muscle_up' as any,
  skillName: 'Slow Muscle-Up',
  description: 'Controlled, tempo-based muscle-up emphasizing transition strength over explosiveness.',
  category: 'dynamic',
  
  entryNodeId: 'smu_strict',
  terminalNodeIds: ['smu_tempo'],
  
  globalPrerequisites: {
    description: 'Strong muscle-up foundation',
    benchmarks: [
      { benchmarkType: 'reps', minimumValue: 3, unit: 'reps', description: '3+ muscle-ups' },
      { benchmarkType: 'pull_ups', minimumValue: 15, unit: 'reps', description: '15+ pull-ups' },
    ],
  },
  
  generalSafetyWarnings: [
    'Tempo work places high stress on tendons',
    'Build up duration gradually',
    'Do not train through joint pain',
  ],
  
  nodes: SLOW_MU_NODES,
  
  edges: [
    { edgeId: 'smu_e0', fromNodeId: 'smu_strict', toNodeId: 'smu_slow', transitionType: 'progression', minimumRequirements: { fromNodeReps: 5 }, notes: 'Master strict MU first', expectedTransitionWeeks: 10, isRecommendedPath: true },
    { edgeId: 'smu_e1', fromNodeId: 'smu_slow', toNodeId: 'smu_tempo', transitionType: 'progression', minimumRequirements: { fromNodeReps: 3 }, notes: 'Consistent slow MU', expectedTransitionWeeks: 14, isRecommendedPath: true },
  ],
}

// =============================================================================
// WEIGHTED MUSCLE-UP PROGRESSION GRAPH
// =============================================================================

const WEIGHTED_MU_NODES: ProgressionNode[] = [
  {
    nodeId: 'wmu_strict_base',
    skillId: 'muscle_up' as any,
    nodeName: 'strict_muscle_up_base',
    displayName: 'Strict Muscle-Up Base',
    description: 'Strong strict muscle-up foundation for weighted work.',
    difficultyLevel: 'advanced',
    levelIndex: 0,
    movementType: 'explosive',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 5, unit: 'reps', description: '5+ strict muscle-ups' },
      { benchmarkType: 'dips', minimumValue: 20, unit: 'reps', description: '20+ straight bar dips' },
    ],
    requiredReadinessScore: 70,
    requiredPrerequisiteNodes: [],
    repsGoal: 8,
    minimumForOwnership: 5,
    knowledgeBubble: {
      shortTip: 'Strong strict MU base is mandatory before adding weight.',
      detailedExplanation: 'Before adding external load, your bodyweight muscle-up should be solid and consistent. 5+ strict reps indicates sufficient base strength.',
      commonMistakes: ['Adding weight too soon', 'Inconsistent technique', 'Weak lockout'],
      techniqueCues: ['Consistent technique', 'Full lockout every rep', 'Controlled descent'],
    },
    jointStressLevel: 'high',
    primaryStressAreas: ['shoulder', 'elbow'],
    recommendedFrequency: { sessionsPerWeek: 3, restDaysMinimum: 1 },
  },
  {
    nodeId: 'wmu_light',
    skillId: 'muscle_up' as any,
    nodeName: 'weighted_muscle_up_light',
    displayName: 'Weighted Muscle-Up (Light)',
    description: '5-10kg added load - introduces weighted MU pattern.',
    difficultyLevel: 'elite',
    levelIndex: 1,
    movementType: 'explosive',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 8, unit: 'reps', description: '8+ strict muscle-ups' },
      { benchmarkType: 'weighted_pull', minimumValue: 30, unit: 'percent_bw', description: '+30% BW weighted pull' },
      { benchmarkType: 'weighted_dip', minimumValue: 30, unit: 'percent_bw', description: '+30% BW weighted dip' },
    ],
    requiredReadinessScore: 78,
    requiredPrerequisiteNodes: ['wmu_strict_base'],
    repsGoal: 5,
    minimumForOwnership: 3,
    knowledgeBubble: {
      shortTip: 'Start light - technique under load is different.',
      detailedExplanation: 'Even small additional weight significantly changes the muscle-up feel. Start with 5-10kg to learn the loaded pattern.',
      commonMistakes: ['Starting too heavy', 'Kipping under load', 'Poor belt position'],
      techniqueCues: ['Same technique as bodyweight', 'Belt tight and secure', 'Control throughout'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['shoulder', 'elbow', 'bicep_tendon'],
    recommendedFrequency: { sessionsPerWeek: 2, restDaysMinimum: 2 },
  },
  {
    nodeId: 'wmu_moderate',
    skillId: 'muscle_up' as any,
    nodeName: 'weighted_muscle_up_moderate',
    displayName: 'Weighted Muscle-Up (Moderate)',
    description: '15-25kg added load - serious weighted MU territory.',
    difficultyLevel: 'elite',
    levelIndex: 2,
    movementType: 'explosive',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 5, unit: 'reps', description: '5+ light weighted muscle-ups' },
      { benchmarkType: 'weighted_pull', minimumValue: 45, unit: 'percent_bw', description: '+45% BW weighted pull' },
      { benchmarkType: 'weighted_dip', minimumValue: 45, unit: 'percent_bw', description: '+45% BW weighted dip' },
    ],
    requiredReadinessScore: 85,
    requiredPrerequisiteNodes: ['wmu_light'],
    repsGoal: 4,
    minimumForOwnership: 2,
    knowledgeBubble: {
      shortTip: 'Moderate weight requires exceptional pulling power.',
      detailedExplanation: 'At 15-25kg, the muscle-up becomes a serious strength feat. Your pulling and dipping base must be very strong.',
      commonMistakes: ['Rushing progression', 'Sloppy technique', 'Ignoring fatigue'],
      techniqueCues: ['Maximum tension', 'Explosive pull', 'Controlled transition'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['shoulder', 'elbow', 'bicep_tendon'],
    recommendedFrequency: { sessionsPerWeek: 1, restDaysMinimum: 3 },
  },
  {
    nodeId: 'wmu_heavy',
    skillId: 'muscle_up' as any,
    nodeName: 'weighted_muscle_up_heavy',
    displayName: 'Weighted Muscle-Up (Heavy)',
    description: '30kg+ added load - elite weighted MU territory.',
    difficultyLevel: 'master',
    levelIndex: 3,
    movementType: 'explosive',
    requiredBenchmarks: [
      { benchmarkType: 'reps', minimumValue: 3, unit: 'reps', description: '3+ moderate weighted muscle-ups' },
      { benchmarkType: 'weighted_pull', minimumValue: 60, unit: 'percent_bw', description: '+60% BW weighted pull' },
      { benchmarkType: 'weighted_dip', minimumValue: 60, unit: 'percent_bw', description: '+60% BW weighted dip' },
    ],
    requiredReadinessScore: 92,
    requiredPrerequisiteNodes: ['wmu_moderate'],
    repsGoal: 3,
    minimumForOwnership: 1,
    knowledgeBubble: {
      shortTip: 'Heavy weighted MU is an elite feat requiring years of preparation.',
      detailedExplanation: 'A 30kg+ weighted muscle-up represents elite-level upper body power. Very few athletes achieve this.',
      commonMistakes: ['Attempting without foundation', 'Poor recovery', 'Ego loading'],
      techniqueCues: ['Perfect setup', 'Maximum intent', 'Respect the weight'],
    },
    jointStressLevel: 'very_high',
    primaryStressAreas: ['shoulder', 'elbow', 'bicep_tendon'],
    recommendedFrequency: { sessionsPerWeek: 1, restDaysMinimum: 4 },
  },
]

export const WEIGHTED_MUSCLE_UP_GRAPH: SkillProgressionGraph = {
  skillId: 'muscle_up' as any,
  skillName: 'Weighted Muscle-Up',
  description: 'Loaded muscle-up building exceptional pulling power and transition strength.',
  category: 'dynamic',
  
  entryNodeId: 'wmu_strict_base',
  terminalNodeIds: ['wmu_heavy'],
  
  globalPrerequisites: {
    description: 'Strong muscle-up and weighted calisthenics foundation',
    benchmarks: [
      { benchmarkType: 'reps', minimumValue: 5, unit: 'reps', description: '5+ strict muscle-ups' },
      { benchmarkType: 'weighted_pull', minimumValue: 25, unit: 'percent_bw', description: '+25% BW weighted pull' },
    ],
  },
  
  generalSafetyWarnings: [
    'Weighted explosive movements carry significant injury risk',
    'Build foundation strength before adding load',
    'Progress weight slowly - patience is essential',
    'Any joint pain requires immediate deload',
  ],
  
  nodes: WEIGHTED_MU_NODES,
  
  edges: [
    { edgeId: 'wmu_e0', fromNodeId: 'wmu_strict_base', toNodeId: 'wmu_light', transitionType: 'progression', minimumRequirements: { fromNodeReps: 8 }, notes: 'Strong unweighted base', expectedTransitionWeeks: 8, isRecommendedPath: true },
    { edgeId: 'wmu_e1', fromNodeId: 'wmu_light', toNodeId: 'wmu_moderate', transitionType: 'progression', minimumRequirements: { fromNodeReps: 5 }, notes: 'Consistent light weighted MU', expectedTransitionWeeks: 16, isRecommendedPath: true },
    { edgeId: 'wmu_e2', fromNodeId: 'wmu_moderate', toNodeId: 'wmu_heavy', transitionType: 'progression', minimumRequirements: { fromNodeReps: 3 }, notes: 'Strong moderate weighted MU', expectedTransitionWeeks: 24, isRecommendedPath: true },
  ],
}

// =============================================================================
// ADVANCED GRAPHS REGISTRY
// =============================================================================

export const ADVANCED_SKILL_GRAPHS: Record<AdvancedSkillGraphId, SkillProgressionGraph> = {
  maltese: MALTESE_GRAPH,
  planche_pushup: PLANCHE_PUSHUP_GRAPH,
  front_lever_pullup: FRONT_LEVER_PULLUP_GRAPH,
  slow_muscle_up: SLOW_MUSCLE_UP_GRAPH,
  weighted_muscle_up: WEIGHTED_MUSCLE_UP_GRAPH,
}

// =============================================================================
// ADVANCED PREREQUISITE MAPS
// =============================================================================

export interface AdvancedPrerequisiteMap {
  skillId: AdvancedSkillGraphId
  description: string
  corePrerequisites: string[]
  strengthPrerequisites: {
    benchmark: string
    minimumValue: number
    unit: string
  }[]
  readinessPrerequisites: {
    factor: string
    minimumScore: number
  }[]
  tendonPrerequisites: string[]
}

export const ADVANCED_PREREQUISITE_MAPS: Record<AdvancedSkillGraphId, AdvancedPrerequisiteMap> = {
  maltese: {
    skillId: 'maltese',
    description: 'Elite rings straight-arm push requiring years of dedicated preparation.',
    corePrerequisites: [
      'Iron Cross hold (assisted acceptable)',
      'Elite ring support stability',
      'Strong planche base',
    ],
    strengthPrerequisites: [
      { benchmark: 'ring_dips', minimumValue: 30, unit: 'reps' },
      { benchmark: 'cross_hold', minimumValue: 10, unit: 'seconds' },
      { benchmark: 'straight_arm_strength', minimumValue: 90, unit: 'score' },
    ],
    readinessPrerequisites: [
      { factor: 'straight_arm_push_strength', minimumScore: 90 },
      { factor: 'ring_support_stability', minimumScore: 95 },
      { factor: 'shoulder_stability', minimumScore: 90 },
      { factor: 'tendon_tolerance', minimumScore: 85 },
    ],
    tendonPrerequisites: [
      'High shoulder tendon tolerance',
      'Bicep tendon conditioning',
      'No active tendinopathy',
    ],
  },
  planche_pushup: {
    skillId: 'planche_pushup',
    description: 'Dynamic pressing from planche position.',
    corePrerequisites: [
      'Strong planche lean',
      'Tuck planche hold',
      'Strong pseudo planche push-ups',
    ],
    strengthPrerequisites: [
      { benchmark: 'push_ups', minimumValue: 30, unit: 'reps' },
      { benchmark: 'tuck_planche', minimumValue: 15, unit: 'seconds' },
      { benchmark: 'planche_lean', minimumValue: 30, unit: 'seconds' },
    ],
    readinessPrerequisites: [
      { factor: 'straight_arm_push_strength', minimumScore: 75 },
      { factor: 'wrist_tolerance', minimumScore: 70 },
      { factor: 'dynamic_pressing_control', minimumScore: 70 },
    ],
    tendonPrerequisites: [
      'Wrist conditioning',
      'Shoulder tendon tolerance',
      'Elbow health',
    ],
  },
  front_lever_pullup: {
    skillId: 'front_lever_pullup',
    description: 'Dynamic pulling from front lever position.',
    corePrerequisites: [
      'Strong front lever hold',
      'Advanced pulling strength',
      'High core tension capacity',
    ],
    strengthPrerequisites: [
      { benchmark: 'pull_ups', minimumValue: 18, unit: 'reps' },
      { benchmark: 'front_lever_hold', minimumValue: 10, unit: 'seconds' },
      { benchmark: 'weighted_pull', minimumValue: 40, unit: 'percent_bw' },
    ],
    readinessPrerequisites: [
      { factor: 'straight_arm_pull_strength', minimumScore: 80 },
      { factor: 'dynamic_pulling_strength', minimumScore: 75 },
      { factor: 'scapular_control', minimumScore: 80 },
      { factor: 'compression_strength', minimumScore: 70 },
    ],
    tendonPrerequisites: [
      'Bicep tendon conditioning',
      'Shoulder stability',
      'Elbow health',
    ],
  },
  slow_muscle_up: {
    skillId: 'slow_muscle_up',
    description: 'Controlled, tempo-based muscle-up.',
    corePrerequisites: [
      'Strong strict muscle-up',
      'High transition control',
      'Strong straight bar dip',
    ],
    strengthPrerequisites: [
      { benchmark: 'muscle_ups', minimumValue: 5, unit: 'reps' },
      { benchmark: 'pull_ups', minimumValue: 15, unit: 'reps' },
      { benchmark: 'straight_bar_dips', minimumValue: 15, unit: 'reps' },
    ],
    readinessPrerequisites: [
      { factor: 'explosive_pull_strength', minimumScore: 70 },
      { factor: 'transition_control', minimumScore: 75 },
      { factor: 'dip_strength', minimumScore: 75 },
    ],
    tendonPrerequisites: [
      'Elbow tendon health',
      'Shoulder conditioning',
      'Wrist stability',
    ],
  },
  weighted_muscle_up: {
    skillId: 'weighted_muscle_up',
    description: 'Loaded muscle-up building exceptional power.',
    corePrerequisites: [
      'Strong strict muscle-up',
      'Strong weighted pulling',
      'Strong weighted dipping',
    ],
    strengthPrerequisites: [
      { benchmark: 'muscle_ups', minimumValue: 8, unit: 'reps' },
      { benchmark: 'weighted_pull', minimumValue: 40, unit: 'percent_bw' },
      { benchmark: 'weighted_dip', minimumValue: 40, unit: 'percent_bw' },
    ],
    readinessPrerequisites: [
      { factor: 'explosive_pull_strength', minimumScore: 80 },
      { factor: 'dip_strength', minimumScore: 80 },
      { factor: 'transition_control', minimumScore: 75 },
      { factor: 'lockout_strength', minimumScore: 80 },
    ],
    tendonPrerequisites: [
      'Robust elbow tendons',
      'Strong shoulder conditioning',
      'No active tendinopathy',
    ],
  },
}

// =============================================================================
// READINESS FACTOR DEFINITIONS FOR ADVANCED SKILLS
// =============================================================================

export interface AdvancedReadinessFactors {
  skillId: AdvancedSkillGraphId
  factors: {
    factorName: string
    weight: number
    description: string
    assessmentMethod: string
  }[]
}

export const ADVANCED_READINESS_FACTORS: Record<AdvancedSkillGraphId, AdvancedReadinessFactors> = {
  maltese: {
    skillId: 'maltese',
    factors: [
      { factorName: 'straight_arm_push_strength', weight: 0.30, description: 'Straight-arm pushing capacity', assessmentMethod: 'Cross hold time, planche lean' },
      { factorName: 'ring_support_stability', weight: 0.25, description: 'Ring support control', assessmentMethod: 'Ring support hold with RTO' },
      { factorName: 'shoulder_stability', weight: 0.25, description: 'Shoulder joint stability', assessmentMethod: 'Wide ring support, cross negatives' },
      { factorName: 'tendon_tolerance', weight: 0.20, description: 'Tendon conditioning level', assessmentMethod: 'Training history, recovery quality' },
    ],
  },
  planche_pushup: {
    skillId: 'planche_pushup',
    factors: [
      { factorName: 'straight_arm_push_strength', weight: 0.30, description: 'Planche hold capacity', assessmentMethod: 'Tuck/straddle planche hold time' },
      { factorName: 'wrist_tolerance', weight: 0.25, description: 'Wrist conditioning', assessmentMethod: 'Planche lean duration, wrist comfort' },
      { factorName: 'dynamic_pressing_control', weight: 0.25, description: 'Dynamic pressing in forward lean', assessmentMethod: 'PPPU reps and quality' },
      { factorName: 'shoulder_stability', weight: 0.20, description: 'Shoulder control under load', assessmentMethod: 'Planche lean stability' },
    ],
  },
  front_lever_pullup: {
    skillId: 'front_lever_pullup',
    factors: [
      { factorName: 'straight_arm_pull_strength', weight: 0.30, description: 'FL hold capacity', assessmentMethod: 'FL hold time at various progressions' },
      { factorName: 'dynamic_pulling_strength', weight: 0.25, description: 'Explosive pulling power', assessmentMethod: 'High pulls, weighted pulls' },
      { factorName: 'scapular_control', weight: 0.25, description: 'Scapular depression and retraction', assessmentMethod: 'Scap pull quality, FL entry control' },
      { factorName: 'compression_strength', weight: 0.20, description: 'Core compression capacity', assessmentMethod: 'L-sit/V-sit hold time' },
    ],
  },
  slow_muscle_up: {
    skillId: 'slow_muscle_up',
    factors: [
      { factorName: 'explosive_pull_strength', weight: 0.30, description: 'High pull capacity', assessmentMethod: 'Chest-to-bar pulls, muscle-up frequency' },
      { factorName: 'transition_control', weight: 0.35, description: 'Transition strength and control', assessmentMethod: 'Transition drills, slow negative quality' },
      { factorName: 'dip_strength', weight: 0.20, description: 'Lockout and dip capacity', assessmentMethod: 'Straight bar dip reps' },
      { factorName: 'tempo_control', weight: 0.15, description: 'Ability to maintain tempo', assessmentMethod: 'Tempo pull-up quality' },
    ],
  },
  weighted_muscle_up: {
    skillId: 'weighted_muscle_up',
    factors: [
      { factorName: 'explosive_pull_strength', weight: 0.30, description: 'Power to pull through transition', assessmentMethod: 'Weighted pull-ups, explosive pulls' },
      { factorName: 'dip_strength', weight: 0.25, description: 'Weighted dip capacity', assessmentMethod: 'Weighted dip performance' },
      { factorName: 'transition_control', weight: 0.25, description: 'Transition under load', assessmentMethod: 'Bodyweight MU quality and consistency' },
      { factorName: 'lockout_strength', weight: 0.20, description: 'Full lockout under load', assessmentMethod: 'Weighted dip lockout quality' },
    ],
  },
}

// =============================================================================
// WEAK POINT BLOCKERS FOR ADVANCED SKILLS
// =============================================================================

export interface AdvancedBlockerMapping {
  skillId: AdvancedSkillGraphId
  primaryBlockers: {
    blocker: string
    impact: 'critical' | 'major' | 'moderate'
    recommendation: string
  }[]
}

export const ADVANCED_BLOCKER_MAPPINGS: Record<AdvancedSkillGraphId, AdvancedBlockerMapping> = {
  maltese: {
    skillId: 'maltese',
    primaryBlockers: [
      { blocker: 'shoulder_tendon_tolerance', impact: 'critical', recommendation: 'Build tendon capacity through progressive cross/support work over months.' },
      { blocker: 'ring_support_stability', impact: 'critical', recommendation: 'Master elite ring support before any maltese attempts.' },
      { blocker: 'straight_arm_push_strength', impact: 'major', recommendation: 'Develop through cross progressions and wide support work.' },
      { blocker: 'bicep_tendon_health', impact: 'major', recommendation: 'Careful tendon conditioning with gradual loading.' },
    ],
  },
  planche_pushup: {
    skillId: 'planche_pushup',
    primaryBlockers: [
      { blocker: 'wrist_tolerance', impact: 'critical', recommendation: 'Progress wrist conditioning alongside planche lean work.' },
      { blocker: 'dynamic_pressing_capacity', impact: 'major', recommendation: 'Build through elevated PPPU progressions.' },
      { blocker: 'planche_base_readiness', impact: 'major', recommendation: 'Strong tuck planche hold before dynamic work.' },
      { blocker: 'shoulder_stability', impact: 'moderate', recommendation: 'Support work and controlled pressing.' },
    ],
  },
  front_lever_pullup: {
    skillId: 'front_lever_pullup',
    primaryBlockers: [
      { blocker: 'scapular_control', impact: 'critical', recommendation: 'Master FL hold stability before adding dynamic pulling.' },
      { blocker: 'dynamic_pulling_strength', impact: 'major', recommendation: 'Build through FL rows at progressive leverages.' },
      { blocker: 'bicep_tendon_health', impact: 'major', recommendation: 'Careful progression - FL pulling stresses bicep tendons heavily.' },
      { blocker: 'core_compression', impact: 'moderate', recommendation: 'Maintain body tension throughout pulls.' },
    ],
  },
  slow_muscle_up: {
    skillId: 'slow_muscle_up',
    primaryBlockers: [
      { blocker: 'transition_control', impact: 'critical', recommendation: 'Master strict MU with clean transitions first.' },
      { blocker: 'pulling_strength', impact: 'major', recommendation: 'High pull capacity needed for slow tempo.' },
      { blocker: 'straight_bar_dip_strength', impact: 'major', recommendation: 'Strong lockout required for controlled dip phase.' },
    ],
  },
  weighted_muscle_up: {
    skillId: 'weighted_muscle_up',
    primaryBlockers: [
      { blocker: 'explosive_pulling', impact: 'critical', recommendation: 'Strong weighted pull-ups as foundation.' },
      { blocker: 'straight_bar_dip_strength', impact: 'critical', recommendation: 'Heavy weighted dips essential for loaded lockout.' },
      { blocker: 'tendon_tolerance', impact: 'major', recommendation: 'Gradual load progression to protect elbows/shoulders.' },
      { blocker: 'transition_consistency', impact: 'moderate', recommendation: 'Consistent bodyweight MU technique before loading.' },
    ],
  },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get advanced skill graph by ID
 */
export function getAdvancedSkillGraph(skillId: AdvancedSkillGraphId): SkillProgressionGraph | null {
  return ADVANCED_SKILL_GRAPHS[skillId] || null
}

/**
 * Get advanced skill definition
 */
export function getAdvancedSkillDefinition(skillId: AdvancedSkillGraphId): AdvancedSkillDefinition | null {
  return ADVANCED_SKILL_DEFINITIONS[skillId] || null
}

/**
 * Get prerequisite map for advanced skill
 */
export function getAdvancedPrerequisites(skillId: AdvancedSkillGraphId): AdvancedPrerequisiteMap | null {
  return ADVANCED_PREREQUISITE_MAPS[skillId] || null
}

/**
 * Get readiness factors for advanced skill
 */
export function getAdvancedReadinessFactors(skillId: AdvancedSkillGraphId): AdvancedReadinessFactors | null {
  return ADVANCED_READINESS_FACTORS[skillId] || null
}

/**
 * Get blocker mappings for advanced skill
 */
export function getAdvancedBlockers(skillId: AdvancedSkillGraphId): AdvancedBlockerMapping | null {
  return ADVANCED_BLOCKER_MAPPINGS[skillId] || null
}

/**
 * Check if athlete is ready for advanced skill track
 */
export function checkAdvancedSkillReadiness(
  skillId: AdvancedSkillGraphId,
  athleteBenchmarks: Record<string, number>,
  readinessScores: Record<string, number>
): {
  isReady: boolean
  readinessPercentage: number
  blockers: string[]
  recommendations: string[]
} {
  const prereqs = ADVANCED_PREREQUISITE_MAPS[skillId]
  const readinessFactors = ADVANCED_READINESS_FACTORS[skillId]
  
  if (!prereqs || !readinessFactors) {
    return { isReady: false, readinessPercentage: 0, blockers: ['Unknown skill'], recommendations: [] }
  }
  
  const blockers: string[] = []
  const recommendations: string[] = []
  let totalScore = 0
  let maxScore = 0
  
  // Check strength prerequisites
  for (const prereq of prereqs.strengthPrerequisites) {
    maxScore += 100
    const value = athleteBenchmarks[prereq.benchmark] || 0
    const percentage = Math.min(100, (value / prereq.minimumValue) * 100)
    totalScore += percentage
    
    if (percentage < 100) {
      blockers.push(`${prereq.benchmark}: ${value}/${prereq.minimumValue} ${prereq.unit}`)
      recommendations.push(`Improve ${prereq.benchmark} to ${prereq.minimumValue} ${prereq.unit}`)
    }
  }
  
  // Check readiness prerequisites
  for (const prereq of prereqs.readinessPrerequisites) {
    maxScore += 100
    const score = readinessScores[prereq.factor] || 0
    const percentage = Math.min(100, (score / prereq.minimumScore) * 100)
    totalScore += percentage
    
    if (percentage < 100) {
      blockers.push(`${prereq.factor}: ${score}/${prereq.minimumScore}`)
      recommendations.push(`Build ${prereq.factor} capacity`)
    }
  }
  
  const overallPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
  const isReady = blockers.length === 0 && overallPercentage >= 90
  
  return {
    isReady,
    readinessPercentage: overallPercentage,
    blockers,
    recommendations: recommendations.slice(0, 3), // Top 3 recommendations
  }
}

/**
 * Determine if advanced skill should be visible to athlete
 * (prevents cluttering novice UI)
 */
export function shouldShowAdvancedSkill(
  skillId: AdvancedSkillGraphId,
  athleteLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite',
  currentGoals: string[],
  readinessPercentage: number
): boolean {
  const definition = ADVANCED_SKILL_DEFINITIONS[skillId]
  if (!definition) return false
  
  // Show if athlete is advanced/elite level
  if (athleteLevel === 'advanced' || athleteLevel === 'elite') return true
  
  // Show if current goals include parent skill
  if (definition.parentSkill && currentGoals.includes(definition.parentSkill)) return true
  
  // Show if readiness is above 50%
  if (readinessPercentage >= 50) return true
  
  // Otherwise hide from UI
  return false
}
