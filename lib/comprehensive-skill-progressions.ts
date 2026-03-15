/**
 * Comprehensive Skill Progression Systems
 * 
 * Complete progression trees for all major calisthenics skills including:
 * - Planche
 * - Front Lever
 * - Handstand
 * - Handstand Pushup
 * - Muscle-Up
 * - Iron Cross
 * 
 * Each system includes:
 * A. Readiness requirements
 * B. Foundation level
 * C. Intermediate progressions
 * D. Advanced progressions
 * E. Support exercises
 * F. Mobility/tissue prep
 * G. Technique exposures
 * H. Advancement rules
 * I. Regression fallback rules
 * J. Training frequency rules
 * K. Fatigue and session placement rules
 */

import type { ExperienceLevel } from './program-service'

// =============================================================================
// CORE TYPES
// =============================================================================

export interface ProgressionLevel {
  name: string
  description: string
  holdTimeGoal?: number // seconds for isometrics
  repsGoal?: number // reps for dynamic movements
  minimumForAdvancement: string
  techniqueCues: string[]
  commonMistakes: string[]
}

export interface ReadinessRequirement {
  id: string
  category: 'strength' | 'mobility' | 'skill' | 'tendon' | 'experience'
  description: string
  minimumLevel: string
  isCritical: boolean // If true, blocks advancement entirely
}

export interface SupportExercise {
  name: string
  purpose: string
  setsReps: string
  frequency: string
  priority: 'essential' | 'recommended' | 'optional'
}

export interface MobilityPrepWork {
  name: string
  purpose: string
  duration: string
  frequency: string
}

export interface SkillProgressionSystem {
  skillKey: string
  skillName: string
  category: 'isometric_push' | 'isometric_pull' | 'dynamic' | 'balance' | 'rings'
  overallDescription: string
  
  // A. Readiness requirements
  readinessRequirements: ReadinessRequirement[]
  
  // B-D. Progression levels (foundation through advanced)
  progressionLevels: ProgressionLevel[]
  
  // E. Support exercises
  supportExercises: SupportExercise[]
  
  // F. Mobility/tissue prep
  mobilityPrepWork: MobilityPrepWork[]
  
  // H. Advancement rules
  advancementRules: {
    holdTimeThreshold?: number
    repsThreshold?: number
    consistencyRequirement: string
    additionalCriteria: string[]
  }
  
  // I. Regression rules
  regressionRules: {
    triggers: string[]
    fallbackLevel: string
    recoveryProtocol: string
  }
  
  // J. Training frequency
  frequencyRules: {
    optimalFrequency: number // sessions per week
    minimumFrequency: number
    maximumFrequency: number
    restBetweenSessions: number // hours
    rationale: string
  }
  
  // K. Session placement
  sessionPlacementRules: {
    preferredPosition: 'early' | 'middle' | 'late'
    afterWarmup: boolean
    beforeStrengthWork: boolean
    maxDurationMinutes: number
    rationale: string
  }
  
  // Safety considerations
  safetyWarnings: string[]
}

// =============================================================================
// PLANCHE PROGRESSION SYSTEM
// =============================================================================

export const PLANCHE_SYSTEM: SkillProgressionSystem = {
  skillKey: 'planche',
  skillName: 'Planche',
  category: 'isometric_push',
  overallDescription: 'A horizontal pushing hold requiring exceptional scapular protraction strength, straight-arm conditioning, and full-body tension.',
  
  readinessRequirements: [
    {
      id: 'push_up_strength',
      category: 'strength',
      description: 'Solid push-up foundation',
      minimumLevel: '30+ push-ups with good form',
      isCritical: true,
    },
    {
      id: 'dip_strength',
      category: 'strength',
      description: 'Dip proficiency',
      minimumLevel: '10+ parallel bar dips',
      isCritical: true,
    },
    {
      id: 'scapular_strength',
      category: 'strength',
      description: 'Scapular protraction control',
      minimumLevel: 'Scapular push-ups with full range',
      isCritical: true,
    },
    {
      id: 'wrist_mobility',
      category: 'mobility',
      description: 'Wrist extension flexibility',
      minimumLevel: 'Comfortable 90-degree wrist extension under load',
      isCritical: true,
    },
    {
      id: 'planche_lean_experience',
      category: 'experience',
      description: 'Prior planche lean training',
      minimumLevel: '4+ weeks of planche lean practice',
      isCritical: false,
    },
    {
      id: 'straight_arm_conditioning',
      category: 'tendon',
      description: 'Straight-arm strength preparation',
      minimumLevel: '6+ weeks of support holds and leans',
      isCritical: true,
    },
  ],
  
  progressionLevels: [
    {
      name: 'Planche Lean',
      description: 'Foundation position - shifting weight forward in push-up position with straight arms',
      holdTimeGoal: 30,
      minimumForAdvancement: '30+ seconds with shoulders past wrists',
      techniqueCues: [
        'Push shoulders forward past wrists',
        'Lock elbows completely',
        'Protract scapulae fully',
        'Maintain hollow body position',
        'Point toes and squeeze glutes',
      ],
      commonMistakes: [
        'Bent elbows',
        'Shoulders not forward enough',
        'Hips piked or sagging',
        'Scapulae not protracted',
      ],
    },
    {
      name: 'Tuck Planche',
      description: 'First airborne progression - knees tucked to chest',
      holdTimeGoal: 15,
      minimumForAdvancement: '15+ second holds, 4+ sets',
      techniqueCues: [
        'Lean forward until feet lift',
        'Pull knees tightly to chest',
        'Drive shoulders forward',
        'Keep elbows locked',
        'Round lower back slightly',
      ],
      commonMistakes: [
        'Insufficient forward lean',
        'Knees not tucked enough',
        'Bent elbows',
        'Looking forward instead of down',
      ],
    },
    {
      name: 'Advanced Tuck Planche',
      description: 'Extended hip angle while maintaining tuck',
      holdTimeGoal: 12,
      minimumForAdvancement: '12+ second holds, 4+ sets',
      techniqueCues: [
        'Push hips back to extend hip angle',
        'Maintain knee tuck',
        'Increase forward lean',
        'Keep lower back rounded',
      ],
      commonMistakes: [
        'Hips too high',
        'Loss of forward lean',
        'Knees separating',
      ],
    },
    {
      name: 'Straddle Planche',
      description: 'Legs extended wide in straddle position',
      holdTimeGoal: 10,
      minimumForAdvancement: '10+ second holds, 3+ sets',
      techniqueCues: [
        'Open legs wide for leverage',
        'Point toes outward',
        'Increase forward lean significantly',
        'Engage glutes hard',
        'Maintain hollow body',
      ],
      commonMistakes: [
        'Legs too narrow',
        'Hips sagging',
        'Insufficient lean',
        'Bent legs',
      ],
    },
    {
      name: 'Full Planche',
      description: 'Legs together, body parallel to ground',
      holdTimeGoal: 5,
      minimumForAdvancement: '5+ second holds, quality form',
      techniqueCues: [
        'Legs together and pointed',
        'Maximum forward lean',
        'Full scapular protraction',
        'Glutes and core tight',
        'Body parallel to ground',
      ],
      commonMistakes: [
        'Hips above shoulders',
        'Bent legs',
        'Insufficient lean',
        'Looking forward',
      ],
    },
  ],
  
  supportExercises: [
    {
      name: 'Pseudo Planche Push-ups',
      purpose: 'Build pushing strength in planche lean position',
      setsReps: '3-4 sets x 8-12 reps',
      frequency: '2-3x per week',
      priority: 'essential',
    },
    {
      name: 'Planche Lean Holds',
      purpose: 'Develop forward lean capacity and shoulder conditioning',
      setsReps: '4-5 sets x 20-30 seconds',
      frequency: '3-4x per week',
      priority: 'essential',
    },
    {
      name: 'Ring/Parallette Support Holds',
      purpose: 'Build straight-arm shoulder stability',
      setsReps: '3-4 sets x 30-45 seconds',
      frequency: '2-3x per week',
      priority: 'essential',
    },
    {
      name: 'Weighted Dips',
      purpose: 'Increase raw pushing strength',
      setsReps: '4-5 sets x 5-8 reps',
      frequency: '2x per week',
      priority: 'recommended',
    },
    {
      name: 'Scapular Push-ups',
      purpose: 'Develop scapular protraction strength',
      setsReps: '3 sets x 15-20 reps',
      frequency: '2-3x per week',
      priority: 'recommended',
    },
  ],
  
  mobilityPrepWork: [
    {
      name: 'Wrist Prep Routine',
      purpose: 'Prepare wrists for forward lean loading',
      duration: '3-5 minutes',
      frequency: 'Every session',
    },
    {
      name: 'Shoulder Circles',
      purpose: 'Warm up shoulder joint and rotator cuff',
      duration: '2-3 minutes',
      frequency: 'Every session',
    },
    {
      name: 'Scapular Protraction/Retraction',
      purpose: 'Activate scapular control',
      duration: '2-3 minutes',
      frequency: 'Every session',
    },
  ],
  
  advancementRules: {
    holdTimeThreshold: 15,
    consistencyRequirement: '4+ sets of target hold time across 2+ sessions',
    additionalCriteria: [
      'Clean form without excessive shaking',
      'Consistent replication across training days',
      'No elbow or shoulder discomfort',
      'Controlled entry and exit from position',
    ],
  },
  
  regressionRules: {
    triggers: [
      'Unable to hit previous hold times',
      'Elbow pain or discomfort',
      'Form breakdown in multiple sets',
      'Excessive fatigue affecting technique',
    ],
    fallbackLevel: 'Drop one progression level and rebuild',
    recoveryProtocol: '1-2 weeks at previous level before reattempting',
  },
  
  frequencyRules: {
    optimalFrequency: 3,
    minimumFrequency: 2,
    maximumFrequency: 4,
    restBetweenSessions: 48,
    rationale: 'Planche work is high-neural and requires recovery. 48+ hours between sessions allows tendon and CNS recovery.',
  },
  
  sessionPlacementRules: {
    preferredPosition: 'early',
    afterWarmup: true,
    beforeStrengthWork: true,
    maxDurationMinutes: 15,
    rationale: 'Planche requires fresh CNS and shoulders. Place early when neural output is highest.',
  },
  
  safetyWarnings: [
    'Progress slowly to protect bicep tendons',
    'Stop immediately if elbow pain occurs',
    'Wrist preparation is mandatory',
    'Avoid training planche when fatigued',
    'Do not rush progressions - tendons adapt slower than muscles',
  ],
}

// =============================================================================
// FRONT LEVER PROGRESSION SYSTEM
// =============================================================================

export const FRONT_LEVER_SYSTEM: SkillProgressionSystem = {
  skillKey: 'front_lever',
  skillName: 'Front Lever',
  category: 'isometric_pull',
  overallDescription: 'A horizontal pulling hold requiring lat strength, scapular depression, and core anti-extension control.',
  
  readinessRequirements: [
    {
      id: 'pull_up_strength',
      category: 'strength',
      description: 'Strong pull-up foundation',
      minimumLevel: '12+ strict pull-ups',
      isCritical: true,
    },
    {
      id: 'active_hang',
      category: 'strength',
      description: 'Active hang capacity',
      minimumLevel: '30+ second active hang with full depression',
      isCritical: true,
    },
    {
      id: 'scapular_depression',
      category: 'strength',
      description: 'Scapular depression control',
      minimumLevel: 'Full depression in hang position',
      isCritical: true,
    },
    {
      id: 'core_strength',
      category: 'strength',
      description: 'Core anti-extension strength',
      minimumLevel: '30+ second hollow body hold',
      isCritical: true,
    },
    {
      id: 'straight_arm_pulling',
      category: 'tendon',
      description: 'Straight-arm pulling tolerance',
      minimumLevel: '4+ weeks of straight arm pull conditioning',
      isCritical: true,
    },
  ],
  
  progressionLevels: [
    {
      name: 'Tuck Front Lever',
      description: 'Knees tucked to chest in horizontal position',
      holdTimeGoal: 20,
      minimumForAdvancement: '20+ second holds, 4+ sets',
      techniqueCues: [
        'Depress and retract scapulae',
        'Pull knees tightly to chest',
        'Maintain horizontal body line',
        'Arms straight, lats engaged',
        'Posterior pelvic tilt',
      ],
      commonMistakes: [
        'Hips dropping',
        'Scapulae not depressed',
        'Bent arms',
        'Looking at ceiling',
      ],
    },
    {
      name: 'Advanced Tuck Front Lever',
      description: 'Extended hip angle with knees tucked',
      holdTimeGoal: 15,
      minimumForAdvancement: '15+ second holds, 4+ sets',
      techniqueCues: [
        'Push hips away from shoulders',
        'Extend hip angle while keeping knees tucked',
        'Drive chest up',
        'Maintain full scapular depression',
      ],
      commonMistakes: [
        'Hips too high',
        'Chest dropping',
        'Loss of scapular depression',
      ],
    },
    {
      name: 'One Leg Front Lever',
      description: 'One leg extended, one tucked',
      holdTimeGoal: 12,
      minimumForAdvancement: '12+ seconds each side, 3+ sets',
      techniqueCues: [
        'Extend one leg fully',
        'Keep extended leg in line with body',
        'Alternate legs each set',
        'Maintain horizontal line',
      ],
      commonMistakes: [
        'Extended leg too high or low',
        'Hips rotating',
        'Scapulae losing depression',
      ],
    },
    {
      name: 'Straddle Front Lever',
      description: 'Both legs extended wide',
      holdTimeGoal: 10,
      minimumForAdvancement: '10+ second holds, 3+ sets',
      techniqueCues: [
        'Open legs wide for leverage',
        'Keep both legs straight',
        'Point toes',
        'Maintain perfect body line',
      ],
      commonMistakes: [
        'Legs not wide enough',
        'Hips piked or sagging',
        'Bent legs',
      ],
    },
    {
      name: 'Full Front Lever',
      description: 'Legs together, body horizontal',
      holdTimeGoal: 5,
      minimumForAdvancement: '5+ second holds, quality form',
      techniqueCues: [
        'Legs together and pointed',
        'Body parallel to ground',
        'Maximum lat engagement',
        'Full scapular depression',
        'Core tight, no pike',
      ],
      commonMistakes: [
        'Hips piked',
        'Legs apart',
        'Insufficient scapular depression',
        'Bent arms',
      ],
    },
  ],
  
  supportExercises: [
    {
      name: 'Front Lever Raises',
      purpose: 'Build dynamic strength through lever range',
      setsReps: '3-4 sets x 5-8 reps',
      frequency: '2-3x per week',
      priority: 'essential',
    },
    {
      name: 'Front Lever Negatives',
      purpose: 'Eccentric strength development',
      setsReps: '3-4 sets x 3-5 reps (5s lowering)',
      frequency: '2x per week',
      priority: 'essential',
    },
    {
      name: 'Ice Cream Makers',
      purpose: 'Dynamic lever strength',
      setsReps: '3 sets x 6-10 reps',
      frequency: '2x per week',
      priority: 'recommended',
    },
    {
      name: 'Weighted Pull-ups',
      purpose: 'Build overall pulling strength',
      setsReps: '4-5 sets x 5-8 reps',
      frequency: '2x per week',
      priority: 'essential',
    },
    {
      name: 'Inverted Rows (High Position)',
      purpose: 'Horizontal pulling strength',
      setsReps: '3-4 sets x 10-15 reps',
      frequency: '2x per week',
      priority: 'recommended',
    },
  ],
  
  mobilityPrepWork: [
    {
      name: 'Shoulder Circles and Dislocates',
      purpose: 'Warm up shoulders and lats',
      duration: '3-5 minutes',
      frequency: 'Every session',
    },
    {
      name: 'Scapular Depression Activation',
      purpose: 'Activate scapular depressors',
      duration: '2-3 minutes',
      frequency: 'Every session',
    },
    {
      name: 'Dead Hang to Active Hang',
      purpose: 'Prepare shoulders for load',
      duration: '2-3 minutes',
      frequency: 'Every session',
    },
  ],
  
  advancementRules: {
    holdTimeThreshold: 15,
    consistencyRequirement: '4+ sets of target hold time across 2+ sessions',
    additionalCriteria: [
      'Perfect body line maintained',
      'No scapular elevation during hold',
      'Consistent replication',
      'No elbow or shoulder discomfort',
    ],
  },
  
  regressionRules: {
    triggers: [
      'Hold times decreasing',
      'Form breakdown in early sets',
      'Elbow discomfort',
      'Grip failure before lever failure',
    ],
    fallbackLevel: 'Drop one progression level',
    recoveryProtocol: '1-2 weeks at previous level before reattempting',
  },
  
  frequencyRules: {
    optimalFrequency: 3,
    minimumFrequency: 2,
    maximumFrequency: 4,
    restBetweenSessions: 48,
    rationale: 'Front lever stresses lats and biceps. Adequate recovery prevents overuse.',
  },
  
  sessionPlacementRules: {
    preferredPosition: 'early',
    afterWarmup: true,
    beforeStrengthWork: true,
    maxDurationMinutes: 15,
    rationale: 'Lever work requires fresh CNS. Place early in pulling sessions.',
  },
  
  safetyWarnings: [
    'Protect bicep tendons - progress gradually',
    'Grip fatigue should not dictate lever training',
    'Maintain active shoulders - avoid passive hanging under load',
    'Stop if sharp elbow pain occurs',
  ],
}

// =============================================================================
// HANDSTAND SYSTEM
// =============================================================================

export const HANDSTAND_SYSTEM: SkillProgressionSystem = {
  skillKey: 'handstand',
  skillName: 'Handstand',
  category: 'balance',
  overallDescription: 'A balance skill requiring proprioception, shoulder stability, and body awareness. Separate balance practice from pushing strength work.',
  
  readinessRequirements: [
    {
      id: 'wall_handstand',
      category: 'skill',
      description: 'Wall handstand capacity',
      minimumLevel: '30+ second chest-to-wall handstand',
      isCritical: true,
    },
    {
      id: 'shoulder_flexibility',
      category: 'mobility',
      description: 'Overhead shoulder mobility',
      minimumLevel: 'Arms overhead with straight line',
      isCritical: true,
    },
    {
      id: 'wrist_mobility',
      category: 'mobility',
      description: 'Wrist extension flexibility',
      minimumLevel: '90-degree comfortable extension',
      isCritical: true,
    },
    {
      id: 'core_control',
      category: 'strength',
      description: 'Core positioning awareness',
      minimumLevel: 'Hollow body hold 30+ seconds',
      isCritical: false,
    },
  ],
  
  progressionLevels: [
    {
      name: 'Chest-to-Wall Handstand',
      description: 'Foundation position against wall',
      holdTimeGoal: 60,
      minimumForAdvancement: '60+ seconds with proper line',
      techniqueCues: [
        'Face wall, walk feet up',
        'Chest close to wall',
        'Stack shoulders over wrists',
        'Squeeze glutes, point toes',
        'Push actively through shoulders',
      ],
      commonMistakes: [
        'Banana back',
        'Head looking at floor',
        'Shoulders not stacked',
        'Ribs flaring',
      ],
    },
    {
      name: 'Back-to-Wall Handstand',
      description: 'Kick up with back to wall for balance practice',
      holdTimeGoal: 45,
      minimumForAdvancement: '45+ seconds with light touch',
      techniqueCues: [
        'Controlled kick up',
        'Light heel touch on wall',
        'Find balance point',
        'Practice pulling off wall',
      ],
      commonMistakes: [
        'Kicking too hard',
        'Over-reliance on wall',
        'Arched back',
      ],
    },
    {
      name: 'Freestanding Attempts',
      description: 'Balance practice away from wall',
      holdTimeGoal: 10,
      minimumForAdvancement: '10+ second average holds',
      techniqueCues: [
        'Short, quality attempts',
        'Focus on hand corrections',
        'Use finger pressure for balance',
        'End on good reps',
      ],
      commonMistakes: [
        'Too many attempts when tired',
        'Not using hands for balance',
        'Fear of falling',
      ],
    },
    {
      name: 'Consistent Freestanding',
      description: 'Reliable holds with balance corrections',
      holdTimeGoal: 30,
      minimumForAdvancement: '30+ second average with rebalancing',
      techniqueCues: [
        'Relaxed breathing',
        'Micro-adjustments with fingers and palms',
        'Maintain line without constant correction',
      ],
      commonMistakes: [
        'Holding breath',
        'Over-correction',
        'Tension in wrong places',
      ],
    },
    {
      name: 'Advanced Freestanding',
      description: 'Long holds and shape changes',
      holdTimeGoal: 60,
      minimumForAdvancement: '60+ seconds with shape variations',
      techniqueCues: [
        'Shape changes (straddle, tuck)',
        'Walking on hands',
        'Various entries and exits',
      ],
      commonMistakes: [
        'Rushing shape changes',
        'Loss of base position awareness',
      ],
    },
  ],
  
  supportExercises: [
    {
      name: 'Wall Shoulder Taps',
      purpose: 'Single arm stability and weight shifting',
      setsReps: '3 sets x 10-20 taps',
      frequency: '3-4x per week',
      priority: 'essential',
    },
    {
      name: 'Chest-to-Wall Holds',
      purpose: 'Build endurance and line awareness',
      setsReps: '3-4 sets x 30-60 seconds',
      frequency: '3-4x per week',
      priority: 'essential',
    },
    {
      name: 'Kick-up Practice',
      purpose: 'Develop consistent entry',
      setsReps: '10-20 attempts',
      frequency: '4-5x per week',
      priority: 'recommended',
    },
    {
      name: 'Pike Push-ups',
      purpose: 'Build overhead pressing strength',
      setsReps: '3-4 sets x 8-12 reps',
      frequency: '2-3x per week',
      priority: 'recommended',
    },
  ],
  
  mobilityPrepWork: [
    {
      name: 'Wrist Prep Routine',
      purpose: 'Prepare wrists for loading',
      duration: '3-5 minutes',
      frequency: 'Every session',
    },
    {
      name: 'Shoulder Flexion Stretches',
      purpose: 'Improve overhead mobility',
      duration: '3-5 minutes',
      frequency: 'Every session',
    },
    {
      name: 'Hip Flexor Stretches',
      purpose: 'Allow proper hip position',
      duration: '2-3 minutes',
      frequency: 'Every session',
    },
  ],
  
  advancementRules: {
    holdTimeThreshold: 10,
    consistencyRequirement: 'Average hold time over session, not single best',
    additionalCriteria: [
      'Consistent kick-up success (>70%)',
      'Controlled exits (not falling)',
      'Good body line without excessive arch',
    ],
  },
  
  regressionRules: {
    triggers: [
      'Kick-up success rate dropping',
      'Average hold time decreasing',
      'Increased falls',
      'Wrist discomfort',
    ],
    fallbackLevel: 'Return to wall work for quality practice',
    recoveryProtocol: '1 week of wall-focused practice',
  },
  
  frequencyRules: {
    optimalFrequency: 5,
    minimumFrequency: 3,
    maximumFrequency: 6,
    restBetweenSessions: 24,
    rationale: 'Balance skills benefit from high frequency, low volume. Daily short practice is optimal.',
  },
  
  sessionPlacementRules: {
    preferredPosition: 'early',
    afterWarmup: true,
    beforeStrengthWork: true,
    maxDurationMinutes: 15,
    rationale: 'Balance work requires fresh CNS. Keep sessions short to maintain quality.',
  },
  
  safetyWarnings: [
    'Learn to bail safely before freestanding attempts',
    'Do not practice to exhaustion - quality degrades',
    'Wrist preparation is mandatory',
    'End practice on successful attempts',
  ],
}

// =============================================================================
// MUSCLE-UP SYSTEM
// =============================================================================

export const MUSCLE_UP_SYSTEM: SkillProgressionSystem = {
  skillKey: 'muscle_up',
  skillName: 'Muscle-Up',
  category: 'dynamic',
  overallDescription: 'A dynamic skill combining explosive pulling, transition strength, and dip pressing. Requires both strength and technique.',
  
  readinessRequirements: [
    {
      id: 'pull_up_strength',
      category: 'strength',
      description: 'High pull-up strength',
      minimumLevel: '12+ strict pull-ups with clean form',
      isCritical: true,
    },
    {
      id: 'chest_to_bar',
      category: 'strength',
      description: 'Chest-to-bar pulling',
      minimumLevel: '5+ chest-to-bar pull-ups',
      isCritical: true,
    },
    {
      id: 'dip_strength',
      category: 'strength',
      description: 'Strong dip foundation',
      minimumLevel: '10+ parallel bar dips',
      isCritical: true,
    },
    {
      id: 'transition_awareness',
      category: 'skill',
      description: 'Transition technique understanding',
      minimumLevel: 'Negative muscle-ups with control',
      isCritical: false,
    },
  ],
  
  progressionLevels: [
    {
      name: 'Explosive Pull-up Development',
      description: 'Building pulling power and height',
      repsGoal: 8,
      minimumForAdvancement: '8+ explosive pull-ups with hip touch',
      techniqueCues: [
        'Pull explosively from dead hang',
        'Aim for chest or belly button',
        'Pull straight up, not back',
        'Maintain hollow body',
      ],
      commonMistakes: [
        'Swinging',
        'Pulling to chin only',
        'Kipping without control',
      ],
    },
    {
      name: 'Transition Strength',
      description: 'Building strength through the transition',
      repsGoal: 5,
      minimumForAdvancement: '5+ muscle-up negatives with 5s descent',
      techniqueCues: [
        'Jump to top of dip position',
        'Slowly lower through transition',
        'Control the lean forward',
        'Feel the transition position',
      ],
      commonMistakes: [
        'Dropping through transition',
        'Not leaning forward enough',
        'Elbows flaring wide',
      ],
    },
    {
      name: 'Assisted Muscle-Up',
      description: 'Full movement with band or jump assistance',
      repsGoal: 5,
      minimumForAdvancement: '5+ assisted muscle-ups with light band',
      techniqueCues: [
        'Full range of motion',
        'Quick transition',
        'Press out fully at top',
        'Controlled descent',
      ],
      commonMistakes: [
        'Too much assistance',
        'Incomplete press out',
        'Chicken winging',
      ],
    },
    {
      name: 'Strict Muscle-Up',
      description: 'Clean muscle-up without kip',
      repsGoal: 3,
      minimumForAdvancement: '3+ strict muscle-ups',
      techniqueCues: [
        'Pull high and fast',
        'Lean forward at peak',
        'Quick elbow transition',
        'Press through to lockout',
      ],
      commonMistakes: [
        'Not pulling high enough',
        'Slow transition',
        'Incomplete lockout',
      ],
    },
    {
      name: 'Multiple Strict Muscle-Ups',
      description: 'Building volume with clean technique',
      repsGoal: 8,
      minimumForAdvancement: '8+ strict muscle-ups in a set',
      techniqueCues: [
        'Consistent technique each rep',
        'Controlled negatives',
        'Rhythm without swing',
      ],
      commonMistakes: [
        'Form degradation with fatigue',
        'Swinging to complete reps',
      ],
    },
  ],
  
  supportExercises: [
    {
      name: 'High Pull-ups',
      purpose: 'Build pulling height for transition',
      setsReps: '4-5 sets x 5-8 reps',
      frequency: '2-3x per week',
      priority: 'essential',
    },
    {
      name: 'Muscle-Up Negatives',
      purpose: 'Eccentric transition strength',
      setsReps: '3-4 sets x 3-5 reps',
      frequency: '2x per week',
      priority: 'essential',
    },
    {
      name: 'Straight Bar Dips',
      purpose: 'Specific pressing pattern',
      setsReps: '3-4 sets x 8-12 reps',
      frequency: '2-3x per week',
      priority: 'essential',
    },
    {
      name: 'False Grip Hangs',
      purpose: 'Grip preparation for ring muscle-ups',
      setsReps: '3-4 sets x 15-30 seconds',
      frequency: '2-3x per week',
      priority: 'recommended',
    },
    {
      name: 'Weighted Pull-ups',
      purpose: 'Build raw pulling strength',
      setsReps: '4-5 sets x 5-8 reps',
      frequency: '2x per week',
      priority: 'recommended',
    },
  ],
  
  mobilityPrepWork: [
    {
      name: 'Shoulder Circles',
      purpose: 'Warm up shoulder joint',
      duration: '2-3 minutes',
      frequency: 'Every session',
    },
    {
      name: 'False Grip Stretches',
      purpose: 'Prepare wrist for false grip',
      duration: '2-3 minutes',
      frequency: 'Every session',
    },
    {
      name: 'Deep Dip Position Stretch',
      purpose: 'Prepare for bottom of dip',
      duration: '2-3 minutes',
      frequency: 'Every session',
    },
  ],
  
  advancementRules: {
    repsThreshold: 5,
    consistencyRequirement: 'Target reps achieved across multiple sessions',
    additionalCriteria: [
      'Clean technique without excessive kip',
      'Consistent transition',
      'Full press-out at top',
    ],
  },
  
  regressionRules: {
    triggers: [
      'Transition becoming sloppy',
      'Unable to complete reps',
      'Elbow pain',
      'Grip failure',
    ],
    fallbackLevel: 'Return to transition strength work',
    recoveryProtocol: '1-2 weeks focused on negatives and high pulls',
  },
  
  frequencyRules: {
    optimalFrequency: 3,
    minimumFrequency: 2,
    maximumFrequency: 4,
    restBetweenSessions: 48,
    rationale: 'Muscle-up is demanding on shoulders and elbows. Adequate recovery prevents overuse.',
  },
  
  sessionPlacementRules: {
    preferredPosition: 'early',
    afterWarmup: true,
    beforeStrengthWork: true,
    maxDurationMinutes: 20,
    rationale: 'Dynamic skill requiring fresh CNS and shoulders.',
  },
  
  safetyWarnings: [
    'Master controlled negatives before attempting',
    'Stop if elbow pain occurs',
    'Do not kip through a stuck transition',
    'Ensure bar/ring grip is secure',
  ],
}

// =============================================================================
// IRON CROSS SYSTEM
// =============================================================================

export const IRON_CROSS_SYSTEM: SkillProgressionSystem = {
  skillKey: 'iron_cross',
  skillName: 'Iron Cross',
  category: 'rings',
  overallDescription: 'An elite rings skill requiring exceptional straight-arm strength, tendon conditioning, and ring stability. The most demanding skill for connective tissue.',
  
  readinessRequirements: [
    {
      id: 'straight_arm_experience',
      category: 'experience',
      description: 'Extensive straight-arm training history',
      minimumLevel: '6+ months of dedicated straight-arm work',
      isCritical: true,
    },
    {
      id: 'planche_level',
      category: 'skill',
      description: 'Planche proficiency',
      minimumLevel: 'Tuck planche 10+ seconds',
      isCritical: true,
    },
    {
      id: 'front_lever_level',
      category: 'skill',
      description: 'Front lever proficiency',
      minimumLevel: 'Tuck front lever 15+ seconds',
      isCritical: true,
    },
    {
      id: 'ring_support',
      category: 'skill',
      description: 'Rock-solid ring support',
      minimumLevel: 'Ring support 45+ seconds with full turn-out',
      isCritical: true,
    },
    {
      id: 'shoulder_health',
      category: 'tendon',
      description: 'Shoulder health status',
      minimumLevel: 'No current shoulder issues or limitations',
      isCritical: true,
    },
    {
      id: 'bicep_tendon_conditioning',
      category: 'tendon',
      description: 'Bicep tendon preparation',
      minimumLevel: 'Pain-free German hangs and straight-arm holds',
      isCritical: true,
    },
  ],
  
  progressionLevels: [
    {
      name: 'Ring Support Foundation',
      description: 'Building ring stability and turn-out strength',
      holdTimeGoal: 60,
      minimumForAdvancement: '60+ seconds with full turn-out, minimal shake',
      techniqueCues: [
        'Full elbow lockout',
        'Maximum external rotation (turn-out)',
        'Depressed shoulders',
        'Straight body line',
      ],
      commonMistakes: [
        'Bent elbows',
        'Insufficient turn-out',
        'Ring shaking',
        'Shoulders elevated',
      ],
    },
    {
      name: 'German Hang Development',
      description: 'Building flexibility and tendon tolerance',
      holdTimeGoal: 30,
      minimumForAdvancement: '30+ seconds with straight arms, no discomfort',
      techniqueCues: [
        'Controlled descent into hang',
        'Straight arms throughout',
        'Relaxed breathing',
        'Progressive depth over weeks',
      ],
      commonMistakes: [
        'Rushing the stretch',
        'Bent arms',
        'Going too deep too fast',
      ],
    },
    {
      name: 'Cross Pull Conditioning',
      description: 'Building specific cross pulling strength',
      holdTimeGoal: 10,
      minimumForAdvancement: 'Controlled negatives from support to 45-degree arms',
      techniqueCues: [
        'Start from ring support',
        'Slowly open arms while descending',
        'Control at all times',
        'Stop at 45 degrees initially',
      ],
      commonMistakes: [
        'Going too deep too fast',
        'Loss of control',
        'Bent elbows',
      ],
    },
    {
      name: 'Assisted Iron Cross',
      description: 'Iron cross with band or partner assistance',
      holdTimeGoal: 10,
      minimumForAdvancement: '10+ second holds with light assistance',
      techniqueCues: [
        'Arms perfectly horizontal',
        'Locked elbows',
        'Depressed shoulders',
        'Ring stability',
      ],
      commonMistakes: [
        'Arms too high or low',
        'Bent elbows',
        'Excessive assistance',
      ],
    },
    {
      name: 'Iron Cross',
      description: 'Unassisted iron cross hold',
      holdTimeGoal: 3,
      minimumForAdvancement: '3+ second holds with good form',
      techniqueCues: [
        'Arms perfectly horizontal',
        'Complete elbow lockout',
        'Depressed and stable shoulders',
        'Controlled breathing',
        'Ring stillness',
      ],
      commonMistakes: [
        'Arms not horizontal',
        'Bent elbows',
        'Excessive shaking',
        'Elevated shoulders',
      ],
    },
  ],
  
  supportExercises: [
    {
      name: 'Ring Support Turn-Out',
      purpose: 'Build ring stability and shoulder position',
      setsReps: '4-5 sets x 30-45 seconds',
      frequency: '3-4x per week',
      priority: 'essential',
    },
    {
      name: 'German Hangs',
      purpose: 'Build flexibility and tendon tolerance',
      setsReps: '3-4 sets x 15-30 seconds',
      frequency: '2-3x per week',
      priority: 'essential',
    },
    {
      name: 'Cross Pull Negatives',
      purpose: 'Eccentric cross strength',
      setsReps: '3-4 sets x 3-5 reps',
      frequency: '2x per week',
      priority: 'essential',
    },
    {
      name: 'Maltese/Planche Leans on Rings',
      purpose: 'Build forward lean capacity',
      setsReps: '3-4 sets x 15-30 seconds',
      frequency: '2-3x per week',
      priority: 'recommended',
    },
    {
      name: 'Ring Dips',
      purpose: 'Build ring pressing strength',
      setsReps: '3-4 sets x 8-12 reps',
      frequency: '2-3x per week',
      priority: 'recommended',
    },
  ],
  
  mobilityPrepWork: [
    {
      name: 'Shoulder Dislocates',
      purpose: 'Warm up shoulder capsule',
      duration: '3-5 minutes',
      frequency: 'Every session',
    },
    {
      name: 'German Hang Progression',
      purpose: 'Prepare biceps and shoulders',
      duration: '5-10 minutes',
      frequency: 'Every session',
    },
    {
      name: 'Wrist and Forearm Prep',
      purpose: 'Prepare for ring grip demands',
      duration: '3-5 minutes',
      frequency: 'Every session',
    },
  ],
  
  advancementRules: {
    holdTimeThreshold: 10,
    consistencyRequirement: 'Multiple sessions with target hold, no discomfort',
    additionalCriteria: [
      'No bicep or elbow discomfort',
      'Consistent form quality',
      'Controlled entries and exits',
      'At least 2 weeks at each level',
    ],
  },
  
  regressionRules: {
    triggers: [
      'Any bicep or elbow pain',
      'Shoulder discomfort',
      'Decreasing hold times',
      'Form breakdown',
    ],
    fallbackLevel: 'Return to ring support and German hangs',
    recoveryProtocol: '2-4 weeks of foundation work, consider complete rest if injured',
  },
  
  frequencyRules: {
    optimalFrequency: 2,
    minimumFrequency: 2,
    maximumFrequency: 3,
    restBetweenSessions: 72,
    rationale: 'Iron cross is extremely demanding on connective tissue. Minimal frequency with maximum recovery.',
  },
  
  sessionPlacementRules: {
    preferredPosition: 'early',
    afterWarmup: true,
    beforeStrengthWork: true,
    maxDurationMinutes: 20,
    rationale: 'Cross work requires completely fresh CNS and shoulders. Never train when fatigued.',
  },
  
  safetyWarnings: [
    'CRITICAL: Progress extremely slowly - tendons need months to adapt',
    'Stop immediately at ANY bicep or elbow discomfort',
    'Never rush progressions - risk of serious tendon injury is high',
    'Consider 6+ months of foundation work before attempting holds',
    'When in doubt, regress to safer progressions',
    'This is NOT a skill to rush - careers have ended from cross injuries',
  ],
}

// =============================================================================
// EXPORT ALL SYSTEMS
// =============================================================================

// Import back lever system
import { BACK_LEVER_PROGRESSION_SYSTEM } from './back-lever-training-system'

export const SKILL_PROGRESSION_SYSTEMS: Record<string, SkillProgressionSystem> = {
  planche: PLANCHE_SYSTEM,
  front_lever: FRONT_LEVER_SYSTEM,
  back_lever: BACK_LEVER_PROGRESSION_SYSTEM,
  handstand: HANDSTAND_SYSTEM,
  muscle_up: MUSCLE_UP_SYSTEM,
  iron_cross: IRON_CROSS_SYSTEM,
}

/**
 * Get progression system for a skill
 */
export function getSkillProgressionSystem(skillKey: string): SkillProgressionSystem | null {
  return SKILL_PROGRESSION_SYSTEMS[skillKey] || null
}

/**
 * Check readiness for a skill
 */
export function checkSkillReadiness(
  skillKey: string,
  userProfile: {
    experienceLevel: ExperienceLevel
    pullUpMax?: number
    pushUpMax?: number
    dipMax?: number
    currentSkillLevels?: Record<string, string>
    hasInjuryHistory?: boolean
  }
): {
  isReady: boolean
  criticalMissing: string[]
  recommendations: string[]
} {
  const system = getSkillProgressionSystem(skillKey)
  if (!system) {
    return { isReady: false, criticalMissing: ['Unknown skill'], recommendations: [] }
  }
  
  const criticalMissing: string[] = []
  const recommendations: string[] = []
  
  for (const req of system.readinessRequirements) {
    // Simple heuristic checks
    if (req.category === 'strength' && req.id === 'pull_up_strength') {
      const minPullUps = parseInt(req.minimumLevel.match(/\d+/)?.[0] || '0', 10)
      if (userProfile.pullUpMax && userProfile.pullUpMax < minPullUps) {
        if (req.isCritical) criticalMissing.push(req.description)
        else recommendations.push(`Build ${req.description}`)
      }
    }
    
    if (req.category === 'experience' && userProfile.experienceLevel === 'beginner') {
      if (req.isCritical) criticalMissing.push(req.description)
      else recommendations.push(`Develop ${req.description}`)
    }
  }
  
  // Special iron cross warnings
  if (skillKey === 'iron_cross') {
    if (userProfile.experienceLevel !== 'advanced') {
      criticalMissing.push('Advanced experience level required')
    }
    recommendations.push('Extensive foundation work required before attempting')
  }
  
  return {
    isReady: criticalMissing.length === 0,
    criticalMissing,
    recommendations,
  }
}
