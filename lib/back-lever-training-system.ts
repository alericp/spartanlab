/**
 * Back Lever Training System
 * 
 * Complete progression system for Back Lever development including:
 * - Full progression tree from foundation to advanced
 * - Readiness gates and safety thresholds
 * - Weak point detection specific to back lever
 * - Exercise library with proper tagging
 * - Guide structures for SEO content
 * - Marketing support
 * 
 * Back Lever is treated as a major straight-arm calisthenics skill
 * comparable to Front Lever, Planche, and Iron Cross.
 */

import type { SkillProgressionSystem, ProgressionLevel, ReadinessRequirement, SupportExercise, MobilityPrepWork } from './comprehensive-skill-progressions'

// =============================================================================
// BACK LEVER TYPES
// =============================================================================

export interface BackLeverExercise {
  id: string
  name: string
  category: 'skill' | 'strength' | 'mobility' | 'tendon_prep' | 'dynamic'
  progressionLevel: 'foundation' | 'beginner' | 'intermediate' | 'advanced'
  description: string
  primaryMuscles: string[]
  techniqueCues: string[]
  commonMistakes: string[]
  setsRepsGuideline: string
  restGuideline: string
  equipment: ('rings' | 'bar' | 'parallettes')[]
  prerequisites: string[]
  contraindications: string[]
}

export interface BackLeverWeakPoint {
  id: string
  name: string
  description: string
  detectionCriteria: string[]
  severity: 'minor' | 'moderate' | 'significant' | 'critical'
  priorityExercises: string[]
  mobilityWork: string[]
  affectsProgression: boolean
}

export interface BackLeverReadinessGate {
  id: string
  name: string
  description: string
  minimumRequirement: string
  testMethod: string
  failureAction: string
  isCritical: boolean
}

// =============================================================================
// BACK LEVER EXERCISE LIBRARY
// =============================================================================

export const BACK_LEVER_EXERCISE_LIBRARY: BackLeverExercise[] = [
  // Foundation / Mobility
  {
    id: 'skin_the_cat',
    name: 'Skin the Cat',
    category: 'mobility',
    progressionLevel: 'foundation',
    description: 'Full rotation through german hang position, building shoulder extension mobility and control.',
    primaryMuscles: ['lats', 'rear_delts', 'biceps', 'core'],
    techniqueCues: [
      'Start from dead hang',
      'Tuck knees and rotate through slowly',
      'Control the descent into german hang',
      'Return the same way with control',
    ],
    commonMistakes: [
      'Going too fast',
      'Losing tension at bottom',
      'Hyperextending lower back',
      'Not achieving full shoulder extension',
    ],
    setsRepsGuideline: '3-4 sets of 3-5 reps',
    restGuideline: '90-120 seconds',
    equipment: ['rings', 'bar'],
    prerequisites: ['basic_hang_30s', 'pull_up_5_reps'],
    contraindications: ['acute_shoulder_injury', 'bicep_tendon_issues'],
  },
  {
    id: 'german_hang',
    name: 'German Hang',
    category: 'mobility',
    progressionLevel: 'foundation',
    description: 'Passive hang in shoulder extension position. Key mobility drill for back lever development.',
    primaryMuscles: ['lats', 'rear_delts', 'biceps', 'chest'],
    techniqueCues: [
      'Enter through controlled skin the cat',
      'Keep arms straight',
      'Relax into the stretch gradually',
      'Maintain neutral spine',
    ],
    commonMistakes: [
      'Forcing range too aggressively',
      'Bending elbows',
      'Arching lower back excessively',
      'Holding breath',
    ],
    setsRepsGuideline: '3-5 sets of 15-30 second holds',
    restGuideline: '60-90 seconds',
    equipment: ['rings', 'bar'],
    prerequisites: ['skin_the_cat_controlled'],
    contraindications: ['shoulder_impingement', 'bicep_tendonitis'],
  },
  {
    id: 'ring_support_hold',
    name: 'Ring Support Hold',
    category: 'strength',
    progressionLevel: 'foundation',
    description: 'Static hold at top of dip position on rings. Builds ring stability and straight-arm strength.',
    primaryMuscles: ['chest', 'triceps', 'shoulders', 'core'],
    techniqueCues: [
      'Lock elbows completely',
      'Depress shoulders',
      'Turn rings out slightly',
      'Maintain hollow body position',
    ],
    commonMistakes: [
      'Bent elbows',
      'Shrugged shoulders',
      'Rings turned in',
      'Excessive arch',
    ],
    setsRepsGuideline: '3-5 sets of 20-45 second holds',
    restGuideline: '60-90 seconds',
    equipment: ['rings'],
    prerequisites: ['parallel_bar_support_30s'],
    contraindications: ['acute_shoulder_injury'],
  },
  {
    id: 'inverted_hang',
    name: 'Inverted Hang',
    category: 'strength',
    progressionLevel: 'foundation',
    description: 'Hanging upside down with arms extended. Builds inversion comfort and shoulder stability.',
    primaryMuscles: ['lats', 'core', 'grip'],
    techniqueCues: [
      'Pull into inverted position with control',
      'Keep arms straight',
      'Maintain body tension',
      'Control breathing while inverted',
    ],
    commonMistakes: [
      'Swinging into position',
      'Relaxing core',
      'Holding breath',
      'Bending arms',
    ],
    setsRepsGuideline: '3-4 sets of 10-20 second holds',
    restGuideline: '60-90 seconds',
    equipment: ['rings', 'bar'],
    prerequisites: ['pull_up_3_reps'],
    contraindications: ['high_blood_pressure', 'eye_conditions'],
  },
  // Beginner Progressions
  {
    id: 'tuck_back_lever',
    name: 'Tuck Back Lever',
    category: 'skill',
    progressionLevel: 'beginner',
    description: 'Back lever with knees tucked to chest. First true back lever progression.',
    primaryMuscles: ['lats', 'rear_delts', 'biceps', 'core', 'lower_back'],
    techniqueCues: [
      'Pull knees tightly to chest',
      'Keep arms completely straight',
      'Depress and retract scapula',
      'Maintain neutral head position',
    ],
    commonMistakes: [
      'Bent elbows',
      'Untucking too early',
      'Excessive lower back arch',
      'Holding breath',
    ],
    setsRepsGuideline: '4-6 sets of 5-15 second holds',
    restGuideline: '2-3 minutes',
    equipment: ['rings', 'bar'],
    prerequisites: ['german_hang_30s', 'skin_the_cat_5_reps'],
    contraindications: ['shoulder_instability', 'bicep_tendon_issues'],
  },
  {
    id: 'band_assisted_back_lever',
    name: 'Band Assisted Back Lever',
    category: 'skill',
    progressionLevel: 'beginner',
    description: 'Back lever with band support around hips or feet. Allows work in fuller positions.',
    primaryMuscles: ['lats', 'rear_delts', 'biceps', 'core', 'lower_back'],
    techniqueCues: [
      'Set up band before entering position',
      'Maintain proper body line',
      'Progress to lighter bands over time',
      'Focus on quality over duration',
    ],
    commonMistakes: [
      'Using too much band assistance',
      'Letting band pull hips out of line',
      'Rushing progression to less assistance',
      'Bending arms',
    ],
    setsRepsGuideline: '4-6 sets of 10-20 second holds',
    restGuideline: '2-3 minutes',
    equipment: ['rings', 'bar'],
    prerequisites: ['tuck_back_lever_10s'],
    contraindications: ['shoulder_instability'],
  },
  {
    id: 'partial_back_lever',
    name: 'Partial Back Lever Hold',
    category: 'skill',
    progressionLevel: 'beginner',
    description: 'Back lever held above horizontal plane. Reduces leverage while building strength.',
    primaryMuscles: ['lats', 'rear_delts', 'biceps', 'core'],
    techniqueCues: [
      'Hold position 30-45 degrees above horizontal',
      'Maintain perfect body line',
      'Focus on scapular position',
      'Keep arms straight',
    ],
    commonMistakes: [
      'Dropping too low too soon',
      'Losing body tension',
      'Bending elbows',
      'Head position issues',
    ],
    setsRepsGuideline: '4-6 sets of 8-15 second holds',
    restGuideline: '2-3 minutes',
    equipment: ['rings', 'bar'],
    prerequisites: ['tuck_back_lever_15s'],
    contraindications: ['shoulder_instability'],
  },
  // Intermediate Progressions
  {
    id: 'advanced_tuck_back_lever',
    name: 'Advanced Tuck Back Lever',
    category: 'skill',
    progressionLevel: 'intermediate',
    description: 'Back lever with thighs parallel to ground but shins still tucked.',
    primaryMuscles: ['lats', 'rear_delts', 'biceps', 'core', 'lower_back'],
    techniqueCues: [
      'Open hip angle while keeping shins tucked',
      'Maintain flat back',
      'Keep arms locked',
      'Control breathing',
    ],
    commonMistakes: [
      'Piking at hips',
      'Dropping below horizontal',
      'Bending elbows under fatigue',
      'Losing scapular control',
    ],
    setsRepsGuideline: '4-6 sets of 8-15 second holds',
    restGuideline: '2-3 minutes',
    equipment: ['rings', 'bar'],
    prerequisites: ['tuck_back_lever_20s'],
    contraindications: ['shoulder_instability', 'chronic_bicep_issues'],
  },
  {
    id: 'one_leg_back_lever',
    name: 'One Leg Back Lever',
    category: 'skill',
    progressionLevel: 'intermediate',
    description: 'Back lever with one leg extended, one tucked. Asymmetric load progression.',
    primaryMuscles: ['lats', 'rear_delts', 'biceps', 'core', 'lower_back'],
    techniqueCues: [
      'Keep extended leg in line with body',
      'Maintain square hips',
      'Alternate legs between sets',
      'Keep arms completely straight',
    ],
    commonMistakes: [
      'Rotating hips',
      'Extended leg dropping',
      'Bending elbows',
      'Excessive arch in lower back',
    ],
    setsRepsGuideline: '4-6 sets of 5-10 second holds per side',
    restGuideline: '2-3 minutes',
    equipment: ['rings', 'bar'],
    prerequisites: ['advanced_tuck_back_lever_10s'],
    contraindications: ['shoulder_instability'],
  },
  {
    id: 'straddle_back_lever',
    name: 'Straddle Back Lever',
    category: 'skill',
    progressionLevel: 'intermediate',
    description: 'Back lever with legs spread in straddle position. Reduced lever length from full.',
    primaryMuscles: ['lats', 'rear_delts', 'biceps', 'core', 'lower_back', 'hip_adductors'],
    techniqueCues: [
      'Spread legs wide to reduce leverage',
      'Keep legs at or above horizontal',
      'Maintain pointed toes',
      'Arms completely locked',
    ],
    commonMistakes: [
      'Legs dropping below body line',
      'Closing straddle under fatigue',
      'Bending elbows',
      'Piking at hips',
    ],
    setsRepsGuideline: '4-6 sets of 5-12 second holds',
    restGuideline: '3-4 minutes',
    equipment: ['rings', 'bar'],
    prerequisites: ['one_leg_back_lever_8s_each'],
    contraindications: ['shoulder_instability', 'chronic_bicep_issues'],
  },
  {
    id: 'back_lever_negatives',
    name: 'Back Lever Negatives',
    category: 'strength',
    progressionLevel: 'intermediate',
    description: 'Slow lowering from inverted hang to back lever position. Builds eccentric strength.',
    primaryMuscles: ['lats', 'rear_delts', 'biceps', 'core', 'lower_back'],
    techniqueCues: [
      'Start from inverted hang',
      'Lower as slowly as possible (5-10 seconds)',
      'Maintain body tension throughout',
      'Exit before form breaks down',
    ],
    commonMistakes: [
      'Lowering too fast',
      'Losing body tension',
      'Bending elbows',
      'Continuing past failure point',
    ],
    setsRepsGuideline: '3-5 sets of 3-5 reps',
    restGuideline: '3-4 minutes',
    equipment: ['rings', 'bar'],
    prerequisites: ['advanced_tuck_back_lever_12s'],
    contraindications: ['acute_shoulder_injury', 'bicep_tendon_inflammation'],
  },
  // Advanced Progressions
  {
    id: 'full_back_lever',
    name: 'Full Back Lever',
    category: 'skill',
    progressionLevel: 'advanced',
    description: 'Complete back lever with legs together and body horizontal.',
    primaryMuscles: ['lats', 'rear_delts', 'biceps', 'core', 'lower_back', 'glutes'],
    techniqueCues: [
      'Legs together, pointed toes',
      'Body perfectly horizontal',
      'Arms completely locked',
      'Maintain hollow-ish body position',
    ],
    commonMistakes: [
      'Sagging below horizontal',
      'Arching lower back excessively',
      'Bending elbows',
      'Head position issues',
    ],
    setsRepsGuideline: '4-6 sets of 3-10 second holds',
    restGuideline: '3-5 minutes',
    equipment: ['rings', 'bar'],
    prerequisites: ['straddle_back_lever_10s'],
    contraindications: ['shoulder_instability', 'bicep_tendon_issues'],
  },
  {
    id: 'back_lever_extended_holds',
    name: 'Back Lever Extended Holds',
    category: 'skill',
    progressionLevel: 'advanced',
    description: 'Full back lever with extended hold durations (15+ seconds).',
    primaryMuscles: ['lats', 'rear_delts', 'biceps', 'core', 'lower_back'],
    techniqueCues: [
      'Only attempt when full BL is solid',
      'Build duration gradually',
      'Maintain perfect form throughout',
      'Exit before form breakdown',
    ],
    commonMistakes: [
      'Holding through poor form',
      'Adding duration too quickly',
      'Insufficient rest between attempts',
      'Training extended holds too frequently',
    ],
    setsRepsGuideline: '3-4 sets of 15-30 second holds',
    restGuideline: '4-5 minutes',
    equipment: ['rings', 'bar'],
    prerequisites: ['full_back_lever_10s_clean'],
    contraindications: ['any_shoulder_discomfort', 'bicep_tendon_sensitivity'],
  },
  {
    id: 'back_lever_raises',
    name: 'Back Lever Raises',
    category: 'dynamic',
    progressionLevel: 'advanced',
    description: 'Dynamic movement raising into back lever from german hang or lowering from inverted.',
    primaryMuscles: ['lats', 'rear_delts', 'biceps', 'core', 'lower_back'],
    techniqueCues: [
      'Control the movement throughout',
      'Pause briefly in back lever position',
      'Maintain straight arms always',
      'Full range of motion',
    ],
    commonMistakes: [
      'Using momentum',
      'Bending elbows',
      'Rushing the movement',
      'Skipping the hold at end position',
    ],
    setsRepsGuideline: '3-4 sets of 3-6 reps',
    restGuideline: '3-4 minutes',
    equipment: ['rings', 'bar'],
    prerequisites: ['full_back_lever_8s'],
    contraindications: ['shoulder_instability', 'bicep_tendon_issues'],
  },
  {
    id: 'back_lever_pulls',
    name: 'Back Lever Pulls',
    category: 'dynamic',
    progressionLevel: 'advanced',
    description: 'Pulling from back lever to inverted hang. Advanced straight-arm pulling strength.',
    primaryMuscles: ['lats', 'rear_delts', 'biceps', 'core'],
    techniqueCues: [
      'Start in solid back lever',
      'Pull with straight arms',
      'Control throughout range',
      'Lower with same control',
    ],
    commonMistakes: [
      'Bending arms to pull',
      'Kipping or using momentum',
      'Losing body tension',
      'Insufficient back lever hold before pulling',
    ],
    setsRepsGuideline: '3-4 sets of 2-5 reps',
    restGuideline: '4-5 minutes',
    equipment: ['rings'],
    prerequisites: ['full_back_lever_10s', 'strong_straight_arm_pulling'],
    contraindications: ['shoulder_issues', 'bicep_tendon_sensitivity'],
  },
]

// =============================================================================
// BACK LEVER READINESS GATES
// =============================================================================

export const BACK_LEVER_READINESS_GATES: BackLeverReadinessGate[] = [
  {
    id: 'shoulder_extension_mobility',
    name: 'Shoulder Extension Mobility',
    description: 'Adequate shoulder extension range for safe german hang position.',
    minimumRequirement: 'German hang with relaxed shoulders for 20+ seconds without pain',
    testMethod: 'Attempt controlled german hang - assess comfort and range',
    failureAction: 'Focus on german hang progression and shoulder extension stretching',
    isCritical: true,
  },
  {
    id: 'german_hang_tolerance',
    name: 'German Hang Tolerance',
    description: 'Ability to hold german hang comfortably for extended periods.',
    minimumRequirement: '30 second german hang with control',
    testMethod: 'Hold german hang for max time - should reach 30s comfortably',
    failureAction: 'Build german hang time before progressing to back lever holds',
    isCritical: true,
  },
  {
    id: 'straight_arm_pulling_strength',
    name: 'Straight-Arm Pulling Strength',
    description: 'Sufficient straight-arm strength for lever positions.',
    minimumRequirement: 'Front lever tuck hold 10s OR controlled skin the cat 5 reps',
    testMethod: 'Test front lever tuck or skin the cat quality',
    failureAction: 'Build straight-arm pulling through front lever progressions',
    isCritical: true,
  },
  {
    id: 'scapular_extension_control',
    name: 'Scapular Extension Control',
    description: 'Ability to control scapula in extended shoulder position.',
    minimumRequirement: 'Controlled inverted hang 15s with stable scapula',
    testMethod: 'Assess scapular position during inverted hang',
    failureAction: 'Focus on scapular control drills and inverted hang work',
    isCritical: false,
  },
  {
    id: 'core_bodyline_control',
    name: 'Core Bodyline Control',
    description: 'Ability to maintain straight body position against gravity.',
    minimumRequirement: 'Hollow body hold 30s, plank 60s',
    testMethod: 'Assess hollow hold and plank quality',
    failureAction: 'Build core strength before progressing',
    isCritical: false,
  },
  {
    id: 'bicep_tendon_conditioning',
    name: 'Bicep Tendon Conditioning',
    description: 'Tendons prepared for straight-arm loading in extension.',
    minimumRequirement: 'No bicep discomfort during german hang or straight-arm work',
    testMethod: 'Monitor for bicep tendon discomfort during prep work',
    failureAction: 'Reduce volume, focus on gradual tendon adaptation',
    isCritical: true,
  },
]

// =============================================================================
// BACK LEVER WEAK POINT DETECTION
// =============================================================================

export const BACK_LEVER_WEAK_POINTS: BackLeverWeakPoint[] = [
  {
    id: 'shoulder_mobility_limitation',
    name: 'Shoulder Mobility Limitation',
    description: 'Insufficient shoulder extension range limiting german hang and back lever depth.',
    detectionCriteria: [
      'Cannot achieve comfortable german hang',
      'Shoulders feel tight in extension',
      'Cannot relax into bottom of skin the cat',
      'History of limited overhead/extension mobility',
    ],
    severity: 'significant',
    priorityExercises: [
      'german_hang_holds',
      'skin_the_cat_slow',
      'passive_shoulder_extension_stretches',
      'wall_shoulder_extension',
    ],
    mobilityWork: [
      'german_hang_passive',
      'doorway_shoulder_stretch',
      'floor_shoulder_extension',
      'pec_minor_release',
    ],
    affectsProgression: true,
  },
  {
    id: 'straight_arm_pulling_weakness',
    name: 'Insufficient Straight-Arm Pulling Strength',
    description: 'Lack of strength to maintain straight arms under lever load.',
    detectionCriteria: [
      'Arms bend during back lever attempts',
      'Cannot hold inverted hang with straight arms',
      'Front lever progression significantly behind',
      'Difficulty with skin the cat control',
    ],
    severity: 'significant',
    priorityExercises: [
      'front_lever_progressions',
      'straight_arm_pulldowns',
      'inverted_hang_holds',
      'ring_rows_straight_arm',
    ],
    mobilityWork: [],
    affectsProgression: true,
  },
  {
    id: 'poor_bodyline_control',
    name: 'Poor Bodyline Control',
    description: 'Inability to maintain straight body position during holds.',
    detectionCriteria: [
      'Excessive arch in lower back during holds',
      'Hips pike or sag',
      'Cannot maintain hollow-ish position',
      'Core gives out before arms',
    ],
    severity: 'moderate',
    priorityExercises: [
      'hollow_body_holds',
      'hollow_body_rocks',
      'hanging_leg_raises',
      'dragon_flags',
    ],
    mobilityWork: [
      'hip_flexor_stretching',
      'thoracic_extension_work',
    ],
    affectsProgression: true,
  },
  {
    id: 'core_compression_weakness',
    name: 'Core Compression Weakness',
    description: 'Insufficient core strength to maintain lever position.',
    detectionCriteria: [
      'Body sags during hold attempts',
      'L-sit hold under 15 seconds',
      'Plank breaks down quickly',
      'Cannot maintain tension in inverted positions',
    ],
    severity: 'moderate',
    priorityExercises: [
      'l_sit_progressions',
      'hollow_holds',
      'hanging_leg_raises',
      'ab_wheel_rollouts',
    ],
    mobilityWork: [],
    affectsProgression: true,
  },
  {
    id: 'scapular_control_deficit',
    name: 'Scapular Control Deficit',
    description: 'Poor scapular positioning and control in extended positions.',
    detectionCriteria: [
      'Scapula wings during holds',
      'Cannot maintain depression in lever',
      'Shoulder instability in inverted positions',
      'Difficulty with ring support stability',
    ],
    severity: 'moderate',
    priorityExercises: [
      'ring_support_holds',
      'scapular_push_ups',
      'inverted_hang_shrugs',
      'band_pull_aparts',
    ],
    mobilityWork: [
      'thoracic_mobility_work',
      'chest_stretching',
    ],
    affectsProgression: true,
  },
  {
    id: 'bicep_tendon_sensitivity',
    name: 'Bicep Tendon Sensitivity',
    description: 'Discomfort or sensitivity in bicep tendons during straight-arm extension work.',
    detectionCriteria: [
      'Pain or discomfort in bicep during german hang',
      'Tenderness at bicep insertion',
      'Discomfort increases with straight-arm work',
      'History of bicep tendon issues',
    ],
    severity: 'critical',
    priorityExercises: [
      'very_light_german_hang',
      'gradual_tendon_conditioning',
      'reduced_straight_arm_volume',
    ],
    mobilityWork: [
      'bicep_soft_tissue_work',
      'forearm_stretching',
    ],
    affectsProgression: true,
  },
]

// =============================================================================
// BACK LEVER PROGRESSION SYSTEM
// =============================================================================

export const BACK_LEVER_PROGRESSION_SYSTEM: SkillProgressionSystem = {
  skillKey: 'back_lever',
  skillName: 'Back Lever',
  category: 'isometric_pull',
  overallDescription: 'The back lever is a straight-arm hold with the body horizontal and face down, requiring significant shoulder extension mobility, straight-arm pulling strength, and core control. It complements front lever development and builds unique shoulder extension strength.',

  readinessRequirements: [
    {
      id: 'bl_shoulder_extension',
      category: 'mobility',
      description: 'Comfortable german hang for 30+ seconds',
      minimumLevel: 'German hang 30 seconds without discomfort',
      isCritical: true,
    },
    {
      id: 'bl_straight_arm_strength',
      category: 'strength',
      description: 'Adequate straight-arm pulling base',
      minimumLevel: 'Front lever tuck 10s or 5 controlled skin the cats',
      isCritical: true,
    },
    {
      id: 'bl_core_control',
      category: 'strength',
      description: 'Core strength for body tension',
      minimumLevel: 'Hollow hold 30s, L-sit 15s',
      isCritical: false,
    },
    {
      id: 'bl_tendon_readiness',
      category: 'tendon',
      description: 'Tendons adapted to straight-arm extension work',
      minimumLevel: 'No bicep discomfort during german hang or skin the cat',
      isCritical: true,
    },
    {
      id: 'bl_ring_stability',
      category: 'skill',
      description: 'Basic ring stability if training on rings',
      minimumLevel: 'Ring support hold 30s',
      isCritical: false,
    },
  ],

  progressionLevels: [
    {
      name: 'Foundation',
      description: 'Build mobility, basic strength, and tendon preparation for back lever work.',
      holdTimeGoal: 30,
      minimumForAdvancement: 'German hang 30s, skin the cat 5 controlled reps',
      techniqueCues: [
        'Focus on relaxing into german hang',
        'Control skin the cat throughout range',
        'Build inverted hang comfort',
        'Prioritize tendon adaptation over progression speed',
      ],
      commonMistakes: [
        'Rushing past foundation work',
        'Ignoring bicep tendon signals',
        'Not building adequate german hang time',
        'Skipping ring support work',
      ],
    },
    {
      name: 'Tuck Back Lever',
      description: 'First true back lever position with knees tucked to chest.',
      holdTimeGoal: 20,
      minimumForAdvancement: 'Clean tuck back lever for 20 seconds',
      techniqueCues: [
        'Keep knees tightly tucked',
        'Arms completely straight',
        'Maintain scapular depression',
        'Body horizontal, not angled',
      ],
      commonMistakes: [
        'Allowing elbows to bend',
        'Opening tuck too early',
        'Dropping below horizontal',
        'Holding breath',
      ],
    },
    {
      name: 'Advanced Tuck Back Lever',
      description: 'Increased hip angle with thighs parallel to floor.',
      holdTimeGoal: 15,
      minimumForAdvancement: 'Clean advanced tuck for 15 seconds',
      techniqueCues: [
        'Open hip angle progressively',
        'Maintain flat back position',
        'Keep arms locked throughout',
        'Control body position precisely',
      ],
      commonMistakes: [
        'Piking at hips',
        'Arms bending under increased load',
        'Rushing to one-leg progressions',
        'Lower back hyperextension',
      ],
    },
    {
      name: 'Straddle Back Lever',
      description: 'Legs spread wide to reduce lever length.',
      holdTimeGoal: 12,
      minimumForAdvancement: 'Clean straddle back lever for 12 seconds',
      techniqueCues: [
        'Wide straddle to manage load',
        'Legs at or above horizontal',
        'Pointed toes, active legs',
        'Perfect arm lockout',
      ],
      commonMistakes: [
        'Legs dropping below body line',
        'Closing straddle when fatigued',
        'Bending elbows',
        'Excessive lower back arch',
      ],
    },
    {
      name: 'Full Back Lever',
      description: 'Complete back lever with legs together.',
      holdTimeGoal: 10,
      minimumForAdvancement: 'Clean full back lever for 10 seconds',
      techniqueCues: [
        'Legs together, pointed toes',
        'Body perfectly horizontal',
        'Absolute arm lockout',
        'Controlled breathing',
      ],
      commonMistakes: [
        'Sagging below horizontal',
        'Excessive arch compensating for weakness',
        'Arms bending',
        'Training through poor form',
      ],
    },
  ],

  supportExercises: [
    {
      name: 'German Hang Holds',
      purpose: 'Build shoulder extension mobility and bicep tendon tolerance',
      setsReps: '3-5 sets of 20-45 seconds',
      frequency: '3-4x per week',
      priority: 'essential',
    },
    {
      name: 'Skin the Cat',
      purpose: 'Dynamic mobility and control through full range',
      setsReps: '3-4 sets of 3-5 reps',
      frequency: '2-3x per week',
      priority: 'essential',
    },
    {
      name: 'Inverted Hang',
      purpose: 'Inversion comfort and straight-arm strength',
      setsReps: '3-4 sets of 15-30 seconds',
      frequency: '2-3x per week',
      priority: 'essential',
    },
    {
      name: 'Front Lever Progressions',
      purpose: 'Complementary straight-arm pulling strength',
      setsReps: '4-6 sets of 5-15 seconds',
      frequency: '2-3x per week',
      priority: 'recommended',
    },
    {
      name: 'Ring Support Hold',
      purpose: 'Ring stability and straight-arm strength',
      setsReps: '3-4 sets of 30-60 seconds',
      frequency: '2-3x per week',
      priority: 'recommended',
    },
    {
      name: 'Hollow Body Holds',
      purpose: 'Core strength and body tension',
      setsReps: '3-4 sets of 30-60 seconds',
      frequency: '3-4x per week',
      priority: 'recommended',
    },
    {
      name: 'Straight-Arm Pulldowns',
      purpose: 'Build straight-arm lat strength',
      setsReps: '3-4 sets of 10-15 reps',
      frequency: '2x per week',
      priority: 'optional',
    },
  ],

  mobilityPrepWork: [
    {
      name: 'German Hang Passive Stretch',
      purpose: 'Primary shoulder extension mobility',
      duration: '2-3 sets of 30-45 seconds',
      frequency: 'Daily or every training session',
    },
    {
      name: 'Doorway Chest Stretch',
      purpose: 'Open chest and anterior shoulder',
      duration: '2-3 sets of 30 seconds per side',
      frequency: '3-4x per week',
    },
    {
      name: 'Floor Shoulder Extension',
      purpose: 'Floor-based shoulder extension work',
      duration: '2-3 sets of 30-45 seconds',
      frequency: '3-4x per week',
    },
    {
      name: 'Bicep Soft Tissue Work',
      purpose: 'Maintain bicep tissue quality',
      duration: '2-3 minutes',
      frequency: 'Before back lever sessions',
    },
  ],

  advancementRules: {
    holdTimeThreshold: 15,
    consistencyRequirement: 'Hold current progression for target time across 3 consecutive sessions',
    additionalCriteria: [
      'No bicep tendon discomfort',
      'Maintaining proper form throughout hold',
      'Able to enter and exit position with control',
      'Recovery between sessions is adequate',
    ],
  },

  regressionRules: {
    triggers: [
      'Bicep tendon discomfort or pain',
      'Unable to maintain straight arms',
      'Hold time decreasing over sessions',
      'Form breaking down before time target',
    ],
    fallbackLevel: 'Return to previous progression and rebuild',
    recoveryProtocol: 'Reduce volume by 30-40%, focus on mobility and support work for 1-2 weeks',
  },

  frequencyRules: {
    optimalFrequency: 3,
    minimumFrequency: 2,
    maximumFrequency: 4,
    restDaysBetweenSessions: 1,
    deloadFrequency: 4,
  },

  sessionPlacement: {
    idealPlacement: 'early',
    maxFatigueBeforeSkill: 20,
    conflictingExercises: ['front_lever_work', 'heavy_pulling', 'planche_work'],
    synergyExercises: ['hollow_holds', 'ring_support', 'inverted_work'],
  },
}

// =============================================================================
// BACK LEVER SKILL RELATIONSHIPS
// =============================================================================

export const BACK_LEVER_SKILL_RELATIONSHIPS = {
  frontLever: {
    type: 'complementary',
    relationship: 'Both require straight-arm pulling strength. Back lever emphasizes shoulder extension, front lever emphasizes horizontal pulling. Training both develops complete straight-arm strength.',
    transferBenefits: [
      'Shared straight-arm conditioning',
      'Similar scapular control demands',
      'Core tension requirements overlap',
    ],
    programmingNotes: 'Can train both in same session if fatigue is managed, or alternate focus days.',
  },
  ironCross: {
    type: 'prerequisite',
    relationship: 'Back lever develops shoulder extension strength that transfers to iron cross preparation. German hang mobility also supports cross training.',
    transferBenefits: [
      'Shoulder extension strength',
      'Straight-arm tolerance under load',
      'Bicep tendon conditioning',
    ],
    programmingNotes: 'Back lever serves as foundation work before iron cross. Complete BL before attempting cross progressions.',
  },
  skinTheCat: {
    type: 'foundation',
    relationship: 'Skin the cat is the primary mobility prerequisite for back lever. Controlled skin the cats indicate readiness for back lever progressions.',
    transferBenefits: [
      'Direct shoulder extension mobility',
      'Movement pattern familiarization',
      'Controlled entry/exit practice',
    ],
    programmingNotes: 'Master controlled skin the cat before attempting back lever holds.',
  },
  planche: {
    type: 'orthogonal',
    relationship: 'Minimal direct transfer - different shoulder positions (extension vs flexion/protraction). However, both require straight-arm conditioning.',
    transferBenefits: [
      'General straight-arm conditioning',
      'Core tension patterns',
    ],
    programmingNotes: 'Separate by at least one day to avoid straight-arm fatigue accumulation.',
  },
  muscleUp: {
    type: 'indirect',
    relationship: 'Back lever ring support stability can support muscle-up transition strength. Shoulder extension mobility aids false grip work.',
    transferBenefits: [
      'Ring stability',
      'Shoulder extension for false grip',
    ],
    programmingNotes: 'Back lever can be trained on same day as muscle-up work if placed first.',
  },
}

// =============================================================================
// BACK LEVER TRAINING CYCLE
// =============================================================================

export const BACK_LEVER_SKILL_CYCLE = {
  id: 'back_lever_skill_cycle',
  name: 'Back Lever Skill Cycle',
  type: 'skill' as const,
  focus: 'back_lever' as const,
  durationWeeks: 6,
  description: 'Focused back lever development cycle emphasizing progression through holds with appropriate mobility and support work.',
  
  volumeDistribution: {
    skillWork: 50,
    strengthSupport: 30,
    mobilityPrep: 15,
    conditioning: 5,
  },
  
  intensityDistribution: {
    highIntensity: 30,
    moderateIntensity: 50,
    lowIntensity: 20,
  },
  
  progressionPacing: 'moderate' as const,
  
  exerciseBias: [
    'back_lever_progressions',
    'german_hang',
    'skin_the_cat',
    'front_lever_support',
    'hollow_holds',
    'ring_support',
  ],
  
  recoveryBias: {
    restDaysBetween: 1,
    deloadWeek: 6,
    volumeReductionOnDeload: 40,
  },
  
  weeklyStructure: {
    backLeverDays: 3,
    supportWorkDays: 2,
    mobilityFocus: 'every_session',
  },
}

// =============================================================================
// BACK LEVER GUIDE STRUCTURE
// =============================================================================

export const BACK_LEVER_GUIDE_STRUCTURE = {
  id: 'back_lever_training_guide',
  title: 'Back Lever Training Guide',
  slug: 'back-lever-training',
  description: 'Complete guide to back lever training. Learn the progression from foundation to full back lever with proper mobility work, support exercises, and programming.',
  
  sections: [
    {
      id: 'what_is_back_lever',
      title: 'What is the Back Lever?',
      content: 'The back lever is a straight-arm gymnastics hold where the body is held horizontal with the face pointing down. It requires significant shoulder extension mobility, straight-arm pulling strength, and full-body tension.',
    },
    {
      id: 'prerequisites',
      title: 'Prerequisites',
      content: 'Before training back lever: German hang 30s, 5 controlled skin the cats, front lever tuck 10s (helpful), hollow hold 30s, no bicep tendon issues.',
    },
    {
      id: 'progression_ladder',
      title: 'Back Lever Progression',
      content: 'Foundation → Tuck Back Lever → Advanced Tuck → One Leg → Straddle → Full Back Lever. Each stage builds on the previous with specific hold time targets.',
    },
    {
      id: 'mobility_requirements',
      title: 'Mobility Requirements',
      content: 'Shoulder extension is critical. German hang work is the primary mobility tool. Focus on gradual adaptation - never force range.',
    },
    {
      id: 'common_mistakes',
      title: 'Common Mistakes',
      content: 'Bending elbows, rushing progressions, ignoring bicep tendon signals, insufficient german hang work, poor body tension, training through fatigue.',
    },
    {
      id: 'programming_frequency',
      title: 'Programming & Frequency',
      content: 'Train back lever 2-3x per week. Place early in sessions when fresh. Include mobility work daily. Deload every 4-6 weeks.',
    },
    {
      id: 'training_examples',
      title: 'Sample Training',
      content: 'Example back lever session: German hang 3x30s, Skill work 5x8-15s at current progression, Support work (front lever, rows), Core work.',
    },
  ],
  
  seoKeywords: [
    'back lever',
    'back lever progression',
    'back lever tutorial',
    'how to back lever',
    'back lever training',
    'calisthenics back lever',
    'back lever exercises',
    'back lever workout',
  ],
  
  relatedGuides: [
    'front-lever-training',
    'german-hang-mobility',
    'straight-arm-strength',
    'ring-training-basics',
  ],
}

// =============================================================================
// SEO CONTENT STRUCTURES
// =============================================================================

export const BACK_LEVER_SEO_PAGES = [
  {
    slug: 'how-to-back-lever',
    title: 'How to Get a Back Lever: Complete Training Guide',
    description: 'Learn how to achieve the back lever with this complete progression guide. From foundation mobility to full back lever holds.',
    primaryKeyword: 'how to back lever',
    secondaryKeywords: ['back lever tutorial', 'back lever progression', 'learn back lever'],
  },
  {
    slug: 'back-lever-progression',
    title: 'Back Lever Progression: Step-by-Step Guide',
    description: 'Complete back lever progression from tuck to full. Each stage explained with technique cues, common mistakes, and advancement criteria.',
    primaryKeyword: 'back lever progression',
    secondaryKeywords: ['back lever steps', 'back lever stages', 'back lever levels'],
  },
  {
    slug: 'back-lever-exercises',
    title: 'Back Lever Exercises: Complete Exercise Library',
    description: 'All the exercises you need for back lever training. Progressions, support work, mobility drills, and programming.',
    primaryKeyword: 'back lever exercises',
    secondaryKeywords: ['back lever workout', 'back lever training exercises'],
  },
  {
    slug: 'back-lever-program',
    title: 'Back Lever Training Program: 12-Week Plan',
    description: 'Structured back lever training program taking you from foundation to back lever. Weekly progressions with mobility and support work.',
    primaryKeyword: 'back lever program',
    secondaryKeywords: ['back lever training program', 'back lever workout plan'],
  },
]

// =============================================================================
// MARKETING SUPPORT
// =============================================================================

export const BACK_LEVER_MARKETING_CLAIMS = {
  supported: [
    'Complete back lever progression system from foundation to full lever',
    'Integrated mobility and shoulder extension development',
    'Tendon safety protocols for straight-arm work',
    'Weak point detection specific to back lever development',
    'Complementary training with front lever progressions',
  ],
  
  featureDescriptions: {
    short: 'Back lever progressions with mobility and safety protocols',
    medium: 'Complete back lever training system including progression ladder, mobility work, support exercises, and tendon safety protocols.',
    long: 'SpartanLab includes a comprehensive back lever progression system. From german hang mobility to full back lever holds, the engine guides you through each stage with appropriate readiness gates, support work, and tendon adaptation protocols. Weak point detection identifies mobility limitations, straight-arm strength deficits, and other factors affecting your progression.',
  },
  
  majorSkillsSupported: [
    'Planche',
    'Front Lever',
    'Back Lever',
    'Muscle-Up',
    'Handstand',
    'Iron Cross',
    'One-Arm Pull-Up',
  ],
}

// =============================================================================
// BACK LEVER SESSION INTEGRATION
// =============================================================================

export const BACK_LEVER_SESSION_TEMPLATE = {
  id: 'back_lever_skill_session',
  name: 'Back Lever Skill Session',
  description: 'Skill-first session structure optimized for back lever development.',
  
  blocks: [
    {
      name: 'Warm-Up',
      duration: '8-10 min',
      exercises: ['general_warm_up', 'shoulder_circles', 'wrist_prep', 'band_pull_aparts'],
    },
    {
      name: 'Mobility Prep',
      duration: '5-8 min',
      exercises: ['german_hang_holds', 'shoulder_extension_stretches', 'chest_opening'],
    },
    {
      name: 'Back Lever Skill Block',
      duration: '15-20 min',
      exercises: ['current_bl_progression', 'skin_the_cat', 'inverted_hang'],
      notes: 'Full rest between sets. Quality over quantity.',
    },
    {
      name: 'Support Strength',
      duration: '12-15 min',
      exercises: ['front_lever_progressions', 'rows', 'ring_support'],
    },
    {
      name: 'Accessory / Core',
      duration: '8-10 min',
      exercises: ['hollow_holds', 'hanging_leg_raises', 'bicep_curls_light'],
    },
  ],
  
  totalDuration: '50-65 min',
  
  fatigueBudget: {
    straightArmWork: 60,
    pullingStrength: 25,
    core: 15,
  },
  
  conflictManagement: {
    ifPairedWithFrontLever: 'Reduce back lever volume by 30%',
    ifPairedWithPlanche: 'Separate by at least one day',
    ifPairedWithHeavyPulling: 'Place back lever first',
  },
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  BACK_LEVER_EXERCISE_LIBRARY,
  BACK_LEVER_READINESS_GATES,
  BACK_LEVER_WEAK_POINTS,
  BACK_LEVER_PROGRESSION_SYSTEM,
  BACK_LEVER_SKILL_RELATIONSHIPS,
  BACK_LEVER_SKILL_CYCLE,
  BACK_LEVER_GUIDE_STRUCTURE,
  BACK_LEVER_SEO_PAGES,
  BACK_LEVER_MARKETING_CLAIMS,
  BACK_LEVER_SESSION_TEMPLATE,
}
