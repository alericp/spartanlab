/**
 * Skill Roadmap Service
 * 
 * Provides structured progression ladders for major calisthenics skills.
 * Integrates with readiness engine and athlete profile to determine current position.
 * 
 * Supported Skills:
 * - Front Lever
 * - Back Lever
 * - Planche
 * - Muscle-Up
 * - Handstand Push-Up
 */

import { getAthleteProfile, getSkillProgressions, type SkillProgression } from '../data-service'
import { getStrengthRecords } from '../strength-service'
import {
  calculateFrontLeverReadiness,
  calculateBackLeverReadiness,
  calculatePlancheReadiness,
  calculateMuscleUpReadiness,
  calculateHSPUReadiness,
  getReadinessTier,
  extractWeakPoints,
  type ReadinessResult,
  type FrontLeverInputs,
  type BackLeverInputs,
  type PlancheInputs,
  type MuscleUpInputs,
  type HSPUInputs,
  type WeakPoint,
} from '../readiness/skill-readiness'

// =============================================================================
// TYPES
// =============================================================================

export type SkillRoadmapType = 'front-lever' | 'back-lever' | 'planche' | 'muscle-up' | 'hspu'

export interface RoadmapLevel {
  id: string
  level: number
  name: string
  description: string
  requirements: string[]
  holdTimeGoal?: number // seconds for isometrics
  repsGoal?: number // reps for dynamic movements
  prerequisiteStrength: string[]
  coachingTip: string
}

export interface SkillRoadmap {
  skillKey: SkillRoadmapType
  skillName: string
  shortDescription: string
  totalLevels: number
  levels: RoadmapLevel[]
  categoryIcon: 'pull' | 'push' | 'dynamic' | 'balance'
}

export interface AthleteRoadmapPosition {
  skillKey: SkillRoadmapType
  skillName: string
  currentLevelIndex: number
  currentLevel: RoadmapLevel
  nextLevel: RoadmapLevel | null
  targetLevelIndex: number
  targetLevel: RoadmapLevel
  readinessScore: number
  readinessTier: string
  weakPoints: WeakPoint[]
  missingPrerequisites: string[]
  progressPercentage: number
  coachingMessage: string
  actionableNextStep: string
}

export interface RoadmapSummary {
  skillKey: SkillRoadmapType
  skillName: string
  currentLevelName: string
  nextLevelName: string | null
  readinessScore: number
  progressPercentage: number
}

// =============================================================================
// ROADMAP DEFINITIONS
// =============================================================================

export const FRONT_LEVER_ROADMAP: SkillRoadmap = {
  skillKey: 'front-lever',
  skillName: 'Front Lever',
  shortDescription: 'Horizontal pulling hold requiring lat strength and core anti-extension',
  totalLevels: 6,
  categoryIcon: 'pull',
  levels: [
    {
      id: 'fl-1',
      level: 1,
      name: 'Bodyweight Pull Foundation',
      description: 'Build the pulling strength base required for front lever work.',
      requirements: [
        '10+ strict pull-ups',
        '30s hollow body hold',
        '20s active hang with depression',
      ],
      prerequisiteStrength: ['Basic pull-up proficiency', 'Core control'],
      coachingTip: 'Focus on clean pull-up form and building volume before attempting lever work.',
    },
    {
      id: 'fl-2',
      level: 2,
      name: 'Tuck Front Lever',
      description: 'First progression with knees tucked to chest, learning body position.',
      holdTimeGoal: 15,
      requirements: [
        '12+ strict pull-ups',
        '10-15s tuck front lever hold',
        'Scapulae depressed throughout',
      ],
      prerequisiteStrength: ['12+ pull-ups', '45s hollow hold'],
      coachingTip: 'Keep hips level with shoulders. Depression of scapulae is key.',
    },
    {
      id: 'fl-3',
      level: 3,
      name: 'Advanced Tuck Front Lever',
      description: 'Extended hip angle while maintaining tucked knees.',
      holdTimeGoal: 12,
      requirements: [
        '15+ pull-ups or +25lb weighted pull',
        '10-12s advanced tuck hold',
        'Hips at shoulder level',
      ],
      prerequisiteStrength: ['+25lb weighted pull-up', 'Strong tuck holds'],
      coachingTip: 'Push hips back to open angle. This is where real strength builds.',
    },
    {
      id: 'fl-4',
      level: 4,
      name: 'One Leg Front Lever',
      description: 'One leg extended, one tucked. Transition to straight body position.',
      holdTimeGoal: 8,
      requirements: [
        '+35lb weighted pull-up',
        '6-8s one leg front lever hold',
        'Extended leg parallel to ground',
      ],
      prerequisiteStrength: ['+35lb weighted pull-up', '60s hollow hold'],
      coachingTip: 'Alternate legs to build balanced strength. Keep extended leg locked.',
    },
    {
      id: 'fl-5',
      level: 5,
      name: 'Straddle Front Lever',
      description: 'Both legs extended in straddle position for leverage advantage.',
      holdTimeGoal: 6,
      requirements: [
        '+50lb weighted pull-up',
        '5-6s straddle front lever hold',
        'Legs wide and pointed',
      ],
      prerequisiteStrength: ['+50lb weighted pull-up', 'Strong one-leg holds'],
      coachingTip: 'Wide straddle reduces lever length. Focus on body line and lat engagement.',
    },
    {
      id: 'fl-6',
      level: 6,
      name: 'Full Front Lever',
      description: 'Legs together, body horizontal. The complete front lever.',
      holdTimeGoal: 5,
      requirements: [
        '+60lb weighted pull-up',
        '5+ second full front lever',
        'Body parallel to ground',
      ],
      prerequisiteStrength: ['+60lb weighted pull-up', 'Strong straddle holds'],
      coachingTip: 'The final progression. Maintain full body tension and lat engagement.',
    },
  ],
}

export const BACK_LEVER_ROADMAP: SkillRoadmap = {
  skillKey: 'back-lever',
  skillName: 'Back Lever',
  shortDescription: 'Horizontal pulling hold with arms behind body, requiring shoulder extension strength',
  totalLevels: 6,
  categoryIcon: 'pull',
  levels: [
    {
      id: 'bl-1',
      level: 1,
      name: 'German Hang Foundation',
      description: 'Build shoulder extension mobility and comfort in the stretched position.',
      requirements: [
        '8+ strict pull-ups',
        '15s german hang hold',
        'Controlled skin the cat (3+ reps)',
      ],
      prerequisiteStrength: ['Basic pull-up proficiency', 'Ring support comfort'],
      coachingTip: 'German hang is the most critical prerequisite. Build mobility gradually and consistently.',
    },
    {
      id: 'bl-2',
      level: 2,
      name: 'Tuck Back Lever',
      description: 'First back lever position with knees tucked tightly to chest.',
      holdTimeGoal: 10,
      requirements: [
        '12+ strict pull-ups',
        '10s tuck back lever hold',
        '25s german hang hold',
      ],
      prerequisiteStrength: ['12+ pull-ups', '20s+ german hang'],
      coachingTip: 'Keep arms completely straight. Focus on scapular depression and posterior tilt.',
    },
    {
      id: 'bl-3',
      level: 3,
      name: 'Advanced Tuck Back Lever',
      description: 'Extended hip angle while maintaining tucked knees.',
      holdTimeGoal: 10,
      requirements: [
        '15+ pull-ups or +20lb weighted pull',
        '10s advanced tuck hold',
        'Hips extended behind shoulders',
      ],
      prerequisiteStrength: ['+20lb weighted pull-up', 'Strong tuck holds'],
      coachingTip: 'Opening the hip angle increases leverage significantly. Progress slowly.',
    },
    {
      id: 'bl-4',
      level: 4,
      name: 'One Leg Back Lever',
      description: 'One leg extended, one tucked. Transition toward straight body.',
      holdTimeGoal: 8,
      requirements: [
        '+30lb weighted pull-up',
        '6-8s one leg back lever hold',
        'Extended leg parallel to ground',
      ],
      prerequisiteStrength: ['+30lb weighted pull-up', '45s german hang'],
      coachingTip: 'Alternate legs between sets. Extended leg should be fully locked.',
    },
    {
      id: 'bl-5',
      level: 5,
      name: 'Straddle Back Lever',
      description: 'Both legs extended in straddle position.',
      holdTimeGoal: 6,
      requirements: [
        '+40lb weighted pull-up',
        '5-6s straddle back lever hold',
        'Legs wide and pointed',
      ],
      prerequisiteStrength: ['+40lb weighted pull-up', 'Strong one-leg holds'],
      coachingTip: 'Straddle reduces lever length. Maintain body line and full arm extension.',
    },
    {
      id: 'bl-6',
      level: 6,
      name: 'Full Back Lever',
      description: 'Legs together, body horizontal. The complete back lever.',
      holdTimeGoal: 5,
      requirements: [
        '+50lb weighted pull-up',
        '5+ second full back lever',
        'Body parallel to ground',
      ],
      prerequisiteStrength: ['+50lb weighted pull-up', 'Strong straddle holds'],
      coachingTip: 'The final progression. Maximum body tension and straight arm discipline required.',
    },
  ],
}

export const PLANCHE_ROADMAP: SkillRoadmap = {
  skillKey: 'planche',
  skillName: 'Planche',
  shortDescription: 'Horizontal pushing hold with straight arms and full body tension',
  totalLevels: 6,
  categoryIcon: 'push',
  levels: [
    {
      id: 'pl-1',
      level: 1,
      name: 'Planche Lean Foundation',
      description: 'Build forward lean capacity and shoulder conditioning.',
      requirements: [
        '30+ push-ups',
        '10+ dips',
        '30s planche lean hold',
      ],
      prerequisiteStrength: ['Strong push-up base', 'Dip proficiency'],
      coachingTip: 'Start with hands turned out slightly. Build lean depth gradually.',
    },
    {
      id: 'pl-2',
      level: 2,
      name: 'Tuck Planche',
      description: 'Feet off ground, knees tucked to chest.',
      holdTimeGoal: 15,
      requirements: [
        '20+ dips',
        '15s tuck planche hold',
        'Shoulders well past wrists',
      ],
      prerequisiteStrength: ['20+ dips', '45s planche lean'],
      coachingTip: 'Lean forward until feet lift naturally. Round lower back slightly.',
    },
    {
      id: 'pl-3',
      level: 3,
      name: 'Advanced Tuck Planche',
      description: 'Extended hip angle while maintaining tuck position.',
      holdTimeGoal: 12,
      requirements: [
        '+25lb weighted dips',
        '10-12s advanced tuck hold',
        'Hips lower and back',
      ],
      prerequisiteStrength: ['+25lb weighted dips', 'Strong tuck planche'],
      coachingTip: 'Open hip angle progressively. This builds the shoulder strength needed for straddle.',
    },
    {
      id: 'pl-4',
      level: 4,
      name: 'Straddle Planche',
      description: 'Legs extended wide in straddle. Major milestone.',
      holdTimeGoal: 8,
      requirements: [
        '+45lb weighted dips',
        '6-8s straddle planche hold',
        'Body parallel to ground',
      ],
      prerequisiteStrength: ['+45lb weighted dips', 'Strong advanced tuck'],
      coachingTip: 'Wide straddle provides leverage. Focus on forward lean and protraction.',
    },
    {
      id: 'pl-5',
      level: 5,
      name: 'Half-Lay Planche',
      description: 'Legs together with bent knees, transitioning to full.',
      holdTimeGoal: 5,
      requirements: [
        '+60lb weighted dips',
        '4-5s half-lay hold',
        'Knees together and bent',
      ],
      prerequisiteStrength: ['+60lb weighted dips', 'Consistent straddle holds'],
      coachingTip: 'Bridge between straddle and full. Practice straightening legs gradually.',
    },
    {
      id: 'pl-6',
      level: 6,
      name: 'Full Planche',
      description: 'Legs together and straight. Elite level achievement.',
      holdTimeGoal: 3,
      requirements: [
        '+75lb weighted dips',
        '3+ second full planche',
        'Complete body tension',
      ],
      prerequisiteStrength: ['+75lb weighted dips', 'Very strong half-lay'],
      coachingTip: 'The pinnacle of pushing strength. Maintain maximum tension throughout.',
    },
  ],
}

export const MUSCLE_UP_ROADMAP: SkillRoadmap = {
  skillKey: 'muscle-up',
  skillName: 'Muscle-Up',
  shortDescription: 'Dynamic pulling movement transitioning from pull to dip',
  totalLevels: 5,
  categoryIcon: 'dynamic',
  levels: [
    {
      id: 'mu-1',
      level: 1,
      name: 'Pull-Up & Dip Foundation',
      description: 'Build the pulling and pushing strength needed for muscle-up.',
      requirements: [
        '10+ strict pull-ups',
        '15+ dips',
        'Chest-to-bar pull-ups (any rep)',
      ],
      prerequisiteStrength: ['Strong pull-up base', 'Dip proficiency'],
      coachingTip: 'Focus on pulling high and explosive dip lockouts.',
    },
    {
      id: 'mu-2',
      level: 2,
      name: 'High Pull Development',
      description: 'Train explosive pulling height and transition mechanics.',
      repsGoal: 5,
      requirements: [
        '15+ strict pull-ups',
        '5+ chest-to-bar pull-ups',
        'Understanding of transition',
      ],
      prerequisiteStrength: ['15+ pull-ups', 'Explosive pulling capacity'],
      coachingTip: 'Practice pulling to sternum or higher. Height is everything.',
    },
    {
      id: 'mu-3',
      level: 3,
      name: 'Assisted Muscle-Up',
      description: 'Muscle-up with band assist or jumping start.',
      repsGoal: 3,
      requirements: [
        '3+ band-assisted or jumping muscle-ups',
        'Smooth transition movement',
        'Full lockout at top',
      ],
      prerequisiteStrength: ['High pulling ability', 'Transition mechanics'],
      coachingTip: 'Use minimal assistance. Focus on the transition feel.',
    },
    {
      id: 'mu-4',
      level: 4,
      name: 'Strict Muscle-Up',
      description: 'Clean muscle-up without kip or momentum.',
      repsGoal: 1,
      requirements: [
        '1+ strict muscle-up',
        '+25lb weighted pull-up',
        'Controlled throughout',
      ],
      prerequisiteStrength: ['+25lb weighted pull-up', 'Strong chest-to-bar'],
      coachingTip: 'Pull explosively and lean forward aggressively through transition.',
    },
    {
      id: 'mu-5',
      level: 5,
      name: 'Muscle-Up Volume',
      description: 'Multiple strict muscle-ups with consistency.',
      repsGoal: 5,
      requirements: [
        '5+ strict muscle-ups',
        'Consistent technique',
        'Minimal fatigue degradation',
      ],
      prerequisiteStrength: ['Strong single muscle-up', '+35lb weighted pull'],
      coachingTip: 'Build volume progressively. Quality over quantity always.',
    },
  ],
}

export const HSPU_ROADMAP: SkillRoadmap = {
  skillKey: 'hspu',
  skillName: 'Handstand Push-Up',
  shortDescription: 'Vertical pushing in handstand position',
  totalLevels: 5,
  categoryIcon: 'balance',
  levels: [
    {
      id: 'hspu-1',
      level: 1,
      name: 'Pike & Handstand Foundation',
      description: 'Build overhead pressing strength and handstand comfort.',
      requirements: [
        '10+ pike push-ups',
        '30s wall handstand hold',
        '15+ dips',
      ],
      prerequisiteStrength: ['Pike push-up strength', 'Basic handstand'],
      coachingTip: 'Elevate feet progressively in pike position. Build wall handstand time.',
    },
    {
      id: 'hspu-2',
      level: 2,
      name: 'Wall HSPU Negatives',
      description: 'Controlled lowering in wall handstand position.',
      repsGoal: 5,
      requirements: [
        '5+ controlled HSPU negatives',
        '45s wall handstand hold',
        'Head to floor control',
      ],
      prerequisiteStrength: ['Strong pike push-ups', 'Handstand endurance'],
      coachingTip: 'Control the descent. 3-5 second negatives build strength safely.',
    },
    {
      id: 'hspu-3',
      level: 3,
      name: 'Wall Handstand Push-Up',
      description: 'Full range wall HSPU with belly or back to wall.',
      repsGoal: 5,
      requirements: [
        '5+ wall HSPUs',
        'Full range of motion',
        'Consistent form',
      ],
      prerequisiteStrength: ['Strong negatives', '+bodyweight overhead press'],
      coachingTip: 'Start back-to-wall for easier balance. Progress to belly-to-wall.',
    },
    {
      id: 'hspu-4',
      level: 4,
      name: 'Deficit Wall HSPU',
      description: 'Extended range HSPU using parallettes or blocks.',
      repsGoal: 3,
      requirements: [
        '3+ deficit HSPUs',
        '8+ regular wall HSPUs',
        'Hands elevated 4-6 inches',
      ],
      prerequisiteStrength: ['High HSPU volume', 'Shoulder flexibility'],
      coachingTip: 'Increase deficit gradually. This builds the strength for freestanding.',
    },
    {
      id: 'hspu-5',
      level: 5,
      name: 'Freestanding HSPU',
      description: 'Handstand push-up without wall support.',
      repsGoal: 1,
      requirements: [
        '1+ freestanding HSPU',
        '30s freestanding handstand',
        'Strong deficit wall HSPUs',
      ],
      prerequisiteStrength: ['Freestanding balance', 'Very strong deficit HSPUs'],
      coachingTip: 'Balance is key. Practice kick-up to HSPU as a single movement.',
    },
  ],
}

// All roadmaps collection
export const SKILL_ROADMAPS: Record<SkillRoadmapType, SkillRoadmap> = {
  'front-lever': FRONT_LEVER_ROADMAP,
  'back-lever': BACK_LEVER_ROADMAP,
  'planche': PLANCHE_ROADMAP,
  'muscle-up': MUSCLE_UP_ROADMAP,
  'hspu': HSPU_ROADMAP,
}

// =============================================================================
// POSITION DETERMINATION
// =============================================================================

/**
 * Determine athlete's current position on a skill roadmap
 * Uses onboarding data, strength records, and readiness engine
 */
export function determineRoadmapPosition(
  skillKey: SkillRoadmapType
): AthleteRoadmapPosition {
  const roadmap = SKILL_ROADMAPS[skillKey]
  const profile = getAthleteProfile()
  const strengthRecords = getStrengthRecords()
  const skillProgressions = getSkillProgressions()
  
  // Get saved progression if exists
  const savedProgression = skillProgressions.find(
    p => p.skillName === skillKey || p.skillName === skillKey.replace('-', '_')
  )
  
  // Get strength data
  const pullUpRecord = strengthRecords.find(r => r.exerciseKey === 'pull_ups')
  const weightedPullUpRecord = strengthRecords.find(r => r.exerciseKey === 'weighted_pull_ups')
  const dipRecord = strengthRecords.find(r => r.exerciseKey === 'dips')
  const weightedDipRecord = strengthRecords.find(r => r.exerciseKey === 'weighted_dips')
  const pushUpRecord = strengthRecords.find(r => r.exerciseKey === 'push_ups')
  
  const maxPullUps = pullUpRecord?.reps || 0
  const weightedPullUp = weightedPullUpRecord?.weight || 0
  const maxDips = dipRecord?.reps || 0
  const weightedDips = weightedDipRecord?.weight || 0
  const maxPushUps = pushUpRecord?.reps || 0
  
  // Calculate readiness for the skill
  let readinessResult: ReadinessResult
  
  switch (skillKey) {
    case 'front-lever': {
      const inputs: FrontLeverInputs = {
        maxPullUps,
        weightedPullUpLoad: weightedPullUp,
        hollowHoldTime: 30, // Default assumption
        hasRings: profile.equipmentAvailable?.includes('rings') || false,
        hasBar: profile.equipmentAvailable?.includes('pullup_bar') || true,
      }
      readinessResult = calculateFrontLeverReadiness(inputs)
      break
    }
    case 'back-lever': {
      const inputs: BackLeverInputs = {
        maxPullUps,
        germanHangHold: 15, // Estimate based on experience
        skinTheCatReps: Math.floor(maxPullUps * 0.3), // Estimate correlation
        ringsSupportHold: 20, // Reasonable default
        invertedHangHold: 15, // Reasonable default
        hasRings: profile.equipmentAvailable?.includes('rings') || false,
        hasBar: profile.equipmentAvailable?.includes('pullup_bar') || true,
      }
      readinessResult = calculateBackLeverReadiness(inputs)
      break
    }
    case 'planche': {
      const inputs: PlancheInputs = {
        maxDips,
        maxPushUps,
        leanHoldTime: 15,
        bodyweightLbs: profile.bodyweight || 160,
        hasParallettes: profile.equipmentAvailable?.includes('parallettes') || false,
        hasFloor: true,
      }
      readinessResult = calculatePlancheReadiness(inputs)
      break
    }
    case 'muscle-up': {
      const inputs: MuscleUpInputs = {
        maxPullUps,
        maxDips,
        chestToBarReps: Math.floor(maxPullUps * 0.4),
        straightBarDipReps: Math.floor(maxDips * 0.5),
        hasBar: true,
        hasRings: profile.equipmentAvailable?.includes('rings') || false,
      }
      readinessResult = calculateMuscleUpReadiness(inputs)
      break
    }
    case 'hspu': {
      const inputs: HSPUInputs = {
        wallHSPUReps: 0,
        pikeHSPUReps: Math.floor(maxPushUps * 0.3),
        maxDips,
        wallHandstandHold: 30,
        overheadPressStrength: maxDips >= 20 ? 'moderate' : 'light',
        hasWall: true,
        hasParallettes: profile.equipmentAvailable?.includes('parallettes') || false,
      }
      readinessResult = calculateHSPUReadiness(inputs)
      break
    }
  }
  
  // Determine current level based on readiness score
  let currentLevelIndex = determineCurrentLevel(readinessResult.score, roadmap.totalLevels)
  
  // Override with saved progression if it exists and is higher
  if (savedProgression && savedProgression.currentLevel > currentLevelIndex) {
    currentLevelIndex = savedProgression.currentLevel
  }
  
  // Clamp to valid range
  currentLevelIndex = Math.max(0, Math.min(currentLevelIndex, roadmap.totalLevels - 1))
  
  const currentLevel = roadmap.levels[currentLevelIndex]
  const nextLevelIndex = currentLevelIndex + 1
  const nextLevel = nextLevelIndex < roadmap.totalLevels ? roadmap.levels[nextLevelIndex] : null
  
  // Target level (usually next level, but can be set by user)
  const targetLevelIndex = savedProgression?.targetLevel ?? nextLevelIndex
  const targetLevel = roadmap.levels[Math.min(targetLevelIndex, roadmap.totalLevels - 1)]
  
  // Get weak points
  const weakPoints = extractWeakPoints(readinessResult.breakdown)
  
  // Identify missing prerequisites for next level
  const missingPrerequisites = identifyMissingPrerequisites(
    nextLevel,
    { maxPullUps, weightedPullUp, maxDips, weightedDips, maxPushUps }
  )
  
  // Calculate progress percentage within current level
  const progressPercentage = calculateProgressPercentage(
    currentLevelIndex,
    readinessResult.score,
    roadmap.totalLevels
  )
  
  // Generate coaching message
  const coachingMessage = generateRoadmapCoachingMessage(
    roadmap.skillName,
    currentLevel,
    nextLevel,
    weakPoints,
    readinessResult.score
  )
  
  // Generate actionable next step
  const actionableNextStep = generateActionableNextStep(
    skillKey,
    currentLevel,
    nextLevel,
    missingPrerequisites,
    weakPoints
  )
  
  const tier = getReadinessTier(readinessResult.score)
  
  return {
    skillKey,
    skillName: roadmap.skillName,
    currentLevelIndex,
    currentLevel,
    nextLevel,
    targetLevelIndex,
    targetLevel,
    readinessScore: readinessResult.score,
    readinessTier: tier.label,
    weakPoints,
    missingPrerequisites,
    progressPercentage,
    coachingMessage,
    actionableNextStep,
  }
}

/**
 * Determine current level based on readiness score
 */
function determineCurrentLevel(score: number, totalLevels: number): number {
  // Map score to level
  // 0-15 = Level 0, 16-35 = Level 1, 36-55 = Level 2, etc.
  if (score < 16) return 0
  if (score < 36) return 1
  if (score < 56) return 2
  if (score < 72) return 3
  if (score < 86) return Math.min(4, totalLevels - 1)
  return Math.min(5, totalLevels - 1)
}

/**
 * Calculate progress percentage within current level toward next
 */
function calculateProgressPercentage(
  currentLevel: number,
  readinessScore: number,
  totalLevels: number
): number {
  const levelRanges = [
    { min: 0, max: 15 },
    { min: 16, max: 35 },
    { min: 36, max: 55 },
    { min: 56, max: 71 },
    { min: 72, max: 85 },
    { min: 86, max: 100 },
  ]
  
  const range = levelRanges[currentLevel] || levelRanges[levelRanges.length - 1]
  const progressInLevel = Math.max(0, readinessScore - range.min)
  const levelWidth = range.max - range.min
  
  return Math.min(100, Math.round((progressInLevel / levelWidth) * 100))
}

/**
 * Identify missing prerequisites for next level
 */
function identifyMissingPrerequisites(
  nextLevel: RoadmapLevel | null,
  strength: {
    maxPullUps: number
    weightedPullUp: number
    maxDips: number
    weightedDips: number
    maxPushUps: number
  }
): string[] {
  if (!nextLevel) return []
  
  const missing: string[] = []
  
  // Parse prerequisite strength and check against current
  for (const prereq of nextLevel.prerequisiteStrength) {
    const lowerPrereq = prereq.toLowerCase()
    
    // Check pull-up requirements
    if (lowerPrereq.includes('pull-up') || lowerPrereq.includes('pull up')) {
      const match = prereq.match(/(\d+)\+?\s*(pull-?ups?|strict)/i)
      const weightMatch = prereq.match(/\+(\d+)lb/i)
      
      if (weightMatch) {
        const required = parseInt(weightMatch[1])
        if (strength.weightedPullUp < required) {
          missing.push(`Need +${required}lb weighted pull-up (current: +${strength.weightedPullUp}lb)`)
        }
      } else if (match) {
        const required = parseInt(match[1])
        if (strength.maxPullUps < required) {
          missing.push(`Need ${required}+ pull-ups (current: ${strength.maxPullUps})`)
        }
      }
    }
    
    // Check dip requirements
    if (lowerPrereq.includes('dip')) {
      const match = prereq.match(/(\d+)\+?\s*dips?/i)
      const weightMatch = prereq.match(/\+(\d+)lb/i)
      
      if (weightMatch) {
        const required = parseInt(weightMatch[1])
        if (strength.weightedDips < required) {
          missing.push(`Need +${required}lb weighted dips (current: +${strength.weightedDips}lb)`)
        }
      } else if (match) {
        const required = parseInt(match[1])
        if (strength.maxDips < required) {
          missing.push(`Need ${required}+ dips (current: ${strength.maxDips})`)
        }
      }
    }
  }
  
  return missing
}

/**
 * Generate coaching message for roadmap position
 */
function generateRoadmapCoachingMessage(
  skillName: string,
  currentLevel: RoadmapLevel,
  nextLevel: RoadmapLevel | null,
  weakPoints: WeakPoint[],
  readinessScore: number
): string {
  if (readinessScore >= 85) {
    return `Your ${skillName} foundation is strong. Focus on skill-specific practice at ${currentLevel.name}.`
  }
  
  if (!nextLevel) {
    return `You have mastered the ${skillName} progression ladder. Continue refining technique and building volume.`
  }
  
  const primaryWeak = weakPoints[0]
  if (primaryWeak && primaryWeak.severity === 'critical') {
    return `${primaryWeak.name} is your main limiter for ${skillName}. Address this before advancing to ${nextLevel.name}.`
  }
  
  if (readinessScore >= 70) {
    return `Almost ready for ${nextLevel.name}. A few more weeks of targeted work on ${primaryWeak?.name || 'current progressions'} should get you there.`
  }
  
  return `Building toward ${nextLevel.name}. ${currentLevel.coachingTip}`
}

/**
 * Generate actionable next step
 */
function generateActionableNextStep(
  skillKey: SkillRoadmapType,
  currentLevel: RoadmapLevel,
  nextLevel: RoadmapLevel | null,
  missingPrerequisites: string[],
  weakPoints: WeakPoint[]
): string {
  if (missingPrerequisites.length > 0) {
    return missingPrerequisites[0]
  }
  
  if (weakPoints.length > 0 && weakPoints[0].suggestion) {
    return weakPoints[0].suggestion
  }
  
  if (nextLevel) {
    return `Practice ${currentLevel.name} consistently to prepare for ${nextLevel.name}.`
  }
  
  return `Continue building volume and refining technique at ${currentLevel.name}.`
}

// =============================================================================
// ROADMAP SUMMARIES
// =============================================================================

/**
 * Get summary of all roadmap positions for dashboard display
 */
export function getAllRoadmapSummaries(): RoadmapSummary[] {
  const summaries: RoadmapSummary[] = []
  
  for (const skillKey of Object.keys(SKILL_ROADMAPS) as SkillRoadmapType[]) {
    try {
      const position = determineRoadmapPosition(skillKey)
      summaries.push({
        skillKey,
        skillName: position.skillName,
        currentLevelName: position.currentLevel.name,
        nextLevelName: position.nextLevel?.name || null,
        readinessScore: position.readinessScore,
        progressPercentage: position.progressPercentage,
      })
    } catch {
      // Skip if error calculating
    }
  }
  
  return summaries
}

/**
 * Get roadmap position for a specific skill
 */
export function getRoadmapPosition(skillKey: SkillRoadmapType): AthleteRoadmapPosition | null {
  try {
    return determineRoadmapPosition(skillKey)
  } catch {
    return null
  }
}

/**
 * Get the roadmap definition for a skill
 */
export function getRoadmap(skillKey: SkillRoadmapType): SkillRoadmap {
  return SKILL_ROADMAPS[skillKey]
}

// =============================================================================
// TRAINING INTEGRATION
// =============================================================================

/**
 * Generate training explanation based on roadmap position
 * Used in coaching messages to explain why exercises are assigned
 */
export function getTrainingRoadmapContext(skillKey: SkillRoadmapType): {
  message: string
  currentMilestone: string
  nextMilestone: string | null
  limitingFactor: string | null
} {
  const position = determineRoadmapPosition(skillKey)
  
  const limitingFactor = position.weakPoints.length > 0 
    ? position.weakPoints[0].name 
    : null
  
  let message = `This workout supports your ${position.skillName} roadmap.`
  
  if (position.nextLevel) {
    message = `Building toward ${position.nextLevel.name}.`
    if (limitingFactor) {
      message += ` Focus: ${limitingFactor.toLowerCase()}.`
    }
  }
  
  return {
    message,
    currentMilestone: position.currentLevel.name,
    nextMilestone: position.nextLevel?.name || null,
    limitingFactor,
  }
}

// =============================================================================
// ACHIEVEMENT INTEGRATION
// =============================================================================

/**
 * Check if athlete has reached a new roadmap milestone
 * Returns achievement data if milestone was reached
 */
export function checkRoadmapMilestoneReached(
  skillKey: SkillRoadmapType,
  previousLevel: number,
  currentLevel: number
): {
  milestoneReached: boolean
  levelName: string
  spartanScoreBonus: number
} | null {
  if (currentLevel <= previousLevel) {
    return null
  }
  
  const roadmap = SKILL_ROADMAPS[skillKey]
  const level = roadmap.levels[currentLevel]
  
  if (!level) return null
  
  // Score bonuses based on level
  const bonusPerLevel = [5, 10, 15, 20, 30, 50]
  const bonus = bonusPerLevel[currentLevel] || 25
  
  return {
    milestoneReached: true,
    levelName: level.name,
    spartanScoreBonus: bonus,
  }
}
