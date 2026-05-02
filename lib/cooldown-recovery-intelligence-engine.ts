/**
 * Cool-Down + Recovery Recommendation Intelligence Engine
 * 
 * Intelligently generates post-session recovery guidance based on:
 * - The actual workout completed
 * - Joint and tendon stress from the session
 * - Athlete weak points
 * - Current fatigue state
 * - Active recovery phase status
 * - Movement-family stress accumulation
 * 
 * CORE PRINCIPLE: Cooldowns should be short, relevant, and based on
 * what the athlete actually did - not generic stretching routines.
 * 
 * INTEGRATION POINTS:
 * - Warm-Up / Joint Prep Intelligence Engine (complementary)
 * - Skill Fatigue & Volume Governor (stress data)
 * - Adaptive Deload & Recovery Phase Engine (phase state)
 * - Weak Point Detection Engine (additional emphasis)
 * - Performance Envelope Modeling (athlete-specific)
 * - Exercise Intelligence (joint-stress profiles)
 */

import type { JointCategory, SessionJointProfile } from './warmup-intelligence-engine'
import type { WeakPointType } from './weak-point-engine'
import type { SessionStressAnalysis, JointStressFocus, SkillStressFocus } from './skill-volume-governor-engine'
import type { RecoveryPhaseType } from './adaptive-deload-recovery-engine'

// =============================================================================
// CORE TYPES
// =============================================================================

export type RecoveryRecommendationType =
  | 'cooldown_mobility'
  | 'tendon_recovery'
  | 'decompression'
  | 'breathing_reset'
  | 'joint_support'
  | 'soft_activation'
  | 'recovery_priority_note'

export type TargetRegion =
  | 'wrists'
  | 'elbows'
  | 'forearms'
  | 'shoulders'
  | 'scapula'
  | 'thoracic_spine'
  | 'lats'
  | 'hips'
  | 'hip_flexors'
  | 'hamstrings'
  | 'ankles'
  | 'full_body'

export type RecoveryPriority = 'essential' | 'recommended' | 'optional' | 'bonus'

export interface RecoveryRecommendation {
  recoveryRecommendationId: string
  athleteId: string
  sessionId?: string
  recommendationType: RecoveryRecommendationType
  targetRegion: TargetRegion
  movementFamilyContext?: SkillStressFocus
  priorityLevel: RecoveryPriority
  estimatedDurationSeconds: number
  reason: string
  exerciseList: RecoveryExercise[]
  dateGenerated: Date
}

export interface RecoveryExercise {
  id: string
  name: string
  targetRegion: TargetRegion
  prescription: string
  durationSeconds: number
  instruction?: string
  knowledgeBubble?: {
    shortTip: string
    fullExplanation: string
  }
  priority: number // 1-5, higher = more important
  recommendationType: RecoveryRecommendationType
  tendonFriendly: boolean
}

export interface IntelligentCoolDown {
  exercises: RecoveryExerciseWithRationale[]
  totalMinutes: number
  focusSummary: string
  regionSummary: string[]
  coachingNote: string
  tendonRecoveryIncluded: boolean
  isCompressed: boolean
  skipReason?: string
}

export interface RecoveryExerciseWithRationale {
  exerciseId: string
  exerciseName: string
  instruction: string
  rationale: string
  targetRegion: TargetRegion
  priority: RecoveryPriority
  knowledgeBubble?: {
    shortTip: string
    fullExplanation: string
  }
}

export interface CoolDownGenerationInput {
  // Session info
  completedExercises: CompletedExercise[]
  sessionDurationMinutes: number
  isShortSession: boolean
  sessionStructureType?: 'standard' | 'emom' | 'density' | 'ladder' | 'pyramid'
  
  // Stress analysis (from Volume Governor)
  stressAnalysis?: SessionStressAnalysis
  jointStressProfile?: SessionJointProfile[]
  
  // Athlete context
  weakPoints?: WeakPointType[]
  jointCautions?: JointCategory[]
  currentRecoveryPhase?: RecoveryPhaseType
  currentFatigueLevel?: 'low' | 'moderate' | 'high' | 'very_high'
  
  // Preferences
  maxCooldownMinutes?: number
  preferTendonRecovery?: boolean
}

export interface CompletedExercise {
  exerciseId: string
  exerciseName: string
  movementFamily?: SkillStressFocus
  jointStress?: Partial<Record<JointStressFocus, 'low' | 'moderate' | 'high'>>
  isStraightArm: boolean
  isRingBased: boolean
  isTendonHeavy: boolean
  setsCompleted: number
}

export interface CoolDownLogEntry {
  athleteId: string
  sessionId: string
  cooldownCompleted: boolean
  cooldownSkipped: boolean
  exercisesShown: string[]
  targetRegionsRecommended: TargetRegion[]
  dateLogged: Date
}

// =============================================================================
// RECOVERY EXERCISE DATABASE (Small, Purposeful)
// =============================================================================

export const RECOVERY_EXERCISE_DATABASE: RecoveryExercise[] = [
  // WRIST RECOVERY
  {
    id: 'wrist_decompression_circles',
    name: 'Wrist Decompression Circles',
    targetRegion: 'wrists',
    prescription: '10 circles each direction',
    durationSeconds: 30,
    instruction: 'Slow, controlled circles in both directions',
    priority: 5,
    recommendationType: 'cooldown_mobility',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Restores wrist mobility after loading',
      fullExplanation: 'Wrist decompression helps restore range of motion after push-heavy work like handstands, planche, or floor pressing.',
    },
  },
  {
    id: 'wrist_extension_relief',
    name: 'Wrist Extension Stretch',
    targetRegion: 'wrists',
    prescription: '30s hold',
    durationSeconds: 30,
    instruction: 'Fingers forward, lean gently away from wrist',
    priority: 4,
    recommendationType: 'tendon_recovery',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Relieves wrist flexor tension',
      fullExplanation: 'After high wrist loading (planche, handstand), gentle extension stretch helps reduce stiffness.',
    },
  },
  {
    id: 'wrist_flexion_relief',
    name: 'Wrist Flexion Stretch',
    targetRegion: 'wrists',
    prescription: '30s hold',
    durationSeconds: 30,
    instruction: 'Fingers pointing back, gentle pressure',
    priority: 3,
    recommendationType: 'cooldown_mobility',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Balances wrist extensors',
      fullExplanation: 'Helps balance wrist flexors and extensors after grip-heavy or pushing work.',
    },
  },
  
  // FOREARM RECOVERY
  {
    id: 'forearm_extensor_release',
    name: 'Forearm Extensor Release',
    targetRegion: 'forearms',
    prescription: '30s each arm',
    durationSeconds: 60,
    instruction: 'Fingers down, palm facing you, gentle pull',
    priority: 4,
    recommendationType: 'tendon_recovery',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Relieves grip fatigue',
      fullExplanation: 'Forearm extensor stretching helps after heavy pulling (front lever, weighted pull-ups) to prevent elbow tendon issues.',
    },
  },
  {
    id: 'forearm_flexor_release',
    name: 'Forearm Flexor Release',
    targetRegion: 'forearms',
    prescription: '30s each arm',
    durationSeconds: 60,
    instruction: 'Fingers pointing down, palm away, gentle pull',
    priority: 3,
    recommendationType: 'cooldown_mobility',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Balances forearm muscles',
      fullExplanation: 'Helps restore forearm balance after pulling work.',
    },
  },
  
  // SHOULDER RECOVERY
  {
    id: 'shoulder_decompression_hang',
    name: 'Passive Hang Decompression',
    targetRegion: 'shoulders',
    prescription: '30-45s',
    durationSeconds: 40,
    instruction: 'Relax completely, let shoulders stretch open',
    priority: 5,
    recommendationType: 'decompression',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Decompresses shoulder joint',
      fullExplanation: 'Passive hanging after pulling or ring work helps decompress the shoulder joint and restore range of motion.',
    },
  },
  {
    id: 'shoulder_opening_stretch',
    name: 'Doorway Shoulder Opener',
    targetRegion: 'shoulders',
    prescription: '30s each side',
    durationSeconds: 60,
    instruction: 'Elbow at 90 degrees, gentle step through',
    priority: 4,
    recommendationType: 'cooldown_mobility',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Opens chest and front shoulder',
      fullExplanation: 'After pushing work, this stretch helps open the anterior shoulder and chest.',
    },
  },
  {
    id: 'shoulder_cross_body',
    name: 'Cross-Body Shoulder Stretch',
    targetRegion: 'shoulders',
    prescription: '30s each side',
    durationSeconds: 60,
    instruction: 'Arm across body, gentle pressure with other hand',
    priority: 3,
    recommendationType: 'cooldown_mobility',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Targets rear deltoid and rotator cuff',
      fullExplanation: 'Helps restore mobility in the posterior shoulder after ring work or pulling.',
    },
  },
  {
    id: 'shoulder_external_rotation',
    name: 'Shoulder External Rotation',
    targetRegion: 'shoulders',
    prescription: '30s hold',
    durationSeconds: 30,
    instruction: 'Arm behind head, gentle press with other hand',
    priority: 3,
    recommendationType: 'joint_support',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Supports rotator cuff health',
      fullExplanation: 'Helps maintain external rotation range after internally-rotated positions.',
    },
  },
  
  // SCAPULA RECOVERY
  {
    id: 'scapular_reset_slides',
    name: 'Scapular Wall Slides',
    targetRegion: 'scapula',
    prescription: '10 slow reps',
    durationSeconds: 45,
    instruction: 'Back against wall, slide arms up and down slowly',
    priority: 4,
    recommendationType: 'soft_activation',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Resets scapular position',
      fullExplanation: 'After heavy scapular loading, gentle wall slides help reset shoulder blade positioning.',
    },
  },
  {
    id: 'scapular_retraction_hold',
    name: 'Scapular Retraction Reset',
    targetRegion: 'scapula',
    prescription: '3 x 10s holds',
    durationSeconds: 40,
    instruction: 'Squeeze shoulder blades together gently, hold',
    priority: 3,
    recommendationType: 'soft_activation',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Balances protraction work',
      fullExplanation: 'After protraction-heavy work (planche, push-ups), gentle retraction helps restore scapular balance.',
    },
  },
  
  // THORACIC SPINE
  {
    id: 'thoracic_extension_reset',
    name: 'Thoracic Extension Over Roller',
    targetRegion: 'thoracic_spine',
    prescription: '45s',
    durationSeconds: 45,
    instruction: 'Foam roller at mid-back, arms overhead, gentle extension',
    priority: 3,
    recommendationType: 'decompression',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Opens thoracic spine',
      fullExplanation: 'Helps restore thoracic extension after compression or flexion-heavy work.',
    },
  },
  {
    id: 'cat_cow_reset',
    name: 'Cat-Cow Reset',
    targetRegion: 'thoracic_spine',
    prescription: '8-10 slow cycles',
    durationSeconds: 45,
    instruction: 'Slow, controlled spinal flexion and extension',
    priority: 4,
    recommendationType: 'cooldown_mobility',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Restores spinal mobility',
      fullExplanation: 'Cat-cow helps restore full spinal range of motion after any training session.',
    },
  },
  
  // BREATHING RESET
  {
    id: 'breathing_reset_90_90',
    name: '90-90 Breathing Reset',
    targetRegion: 'full_body',
    prescription: '8-10 deep breaths',
    durationSeconds: 60,
    instruction: '4s inhale, 4s hold, 6s exhale. Legs on wall or chair.',
    priority: 5,
    recommendationType: 'breathing_reset',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Activates parasympathetic recovery',
      fullExplanation: 'Diaphragmatic breathing in 90-90 position helps shift the nervous system toward recovery mode.',
    },
  },
  {
    id: 'prone_breathing',
    name: 'Prone Breathing',
    targetRegion: 'full_body',
    prescription: '60s',
    durationSeconds: 60,
    instruction: 'Lie face down, breathe deeply into belly',
    priority: 3,
    recommendationType: 'breathing_reset',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Calms nervous system',
      fullExplanation: 'Prone breathing helps down-regulate after high-intensity or skill work.',
    },
  },
  
  // LAT RECOVERY
  {
    id: 'lat_stretch_childs_pose',
    name: "Child's Pose Lat Stretch",
    targetRegion: 'lats',
    prescription: '45s, walk hands to each side',
    durationSeconds: 60,
    instruction: 'Walk hands to one side, feel lat stretch, switch',
    priority: 4,
    recommendationType: 'cooldown_mobility',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Releases lat tension',
      fullExplanation: 'After pulling work, this stretch helps release lat tension and restore overhead mobility.',
    },
  },
  {
    id: 'hanging_lat_stretch',
    name: 'Hanging Lat Stretch',
    targetRegion: 'lats',
    prescription: '30s',
    durationSeconds: 30,
    instruction: 'Hang from bar, rotate torso slightly to each side',
    priority: 3,
    recommendationType: 'decompression',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Decompresses lats and spine',
      fullExplanation: 'Passive hanging with slight rotation helps stretch lats after pulling sessions.',
    },
  },
  
  // HIP / HIP FLEXOR RECOVERY
  {
    id: 'hip_flexor_release',
    name: 'Hip Flexor Release',
    targetRegion: 'hip_flexors',
    prescription: '45s each side',
    durationSeconds: 90,
    instruction: 'Low lunge position, squeeze back glute, sink gently',
    priority: 4,
    recommendationType: 'cooldown_mobility',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Releases hip flexor tension',
      fullExplanation: 'After compression work (L-sits, V-sits), hip flexor stretching helps restore hip extension.',
    },
  },
  {
    id: 'hip_90_90_stretch',
    name: '90-90 Hip Stretch',
    targetRegion: 'hips',
    prescription: '30s each side',
    durationSeconds: 60,
    instruction: 'Both legs at 90 degrees, shift weight forward',
    priority: 3,
    recommendationType: 'cooldown_mobility',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Opens hip rotators',
      fullExplanation: 'Helps restore hip rotation range after compression or lower body work.',
    },
  },
  
  // HAMSTRING RECOVERY
  {
    id: 'hamstring_decompression',
    name: 'Hamstring Decompression Fold',
    targetRegion: 'hamstrings',
    prescription: '45s',
    durationSeconds: 45,
    instruction: 'Seated, legs extended, gentle forward fold from hips',
    priority: 3,
    recommendationType: 'decompression',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Releases hamstring tension',
      fullExplanation: 'Gentle forward fold helps release hamstring tension after compression work.',
    },
  },
  
  // ELBOW / TENDON RECOVERY
  {
    id: 'elbow_flexion_relief',
    name: 'Elbow Flexion Relief',
    targetRegion: 'elbows',
    prescription: '30s each arm',
    durationSeconds: 60,
    instruction: 'Straighten arm, palm up, gently press down on fingers',
    priority: 4,
    recommendationType: 'tendon_recovery',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Relieves bicep tendon stress',
      fullExplanation: 'After straight-arm pulling (front lever, iron cross), this helps relieve bicep tendon tension.',
    },
  },
  {
    id: 'triceps_release',
    name: 'Triceps Release Stretch',
    targetRegion: 'elbows',
    prescription: '30s each arm',
    durationSeconds: 60,
    instruction: 'Arm overhead, elbow bent, gently press elbow back',
    priority: 3,
    recommendationType: 'cooldown_mobility',
    tendonFriendly: true,
    knowledgeBubble: {
      shortTip: 'Releases triceps tension',
      fullExplanation: 'After pushing work, triceps stretching helps restore elbow range of motion.',
    },
  },
]

// =============================================================================
// SESSION-TO-COOLDOWN MAPPING
// =============================================================================

/**
 * Maps session stress patterns to recommended recovery regions
 */
const SESSION_STRESS_TO_RECOVERY: Record<SkillStressFocus, TargetRegion[]> = {
  straight_arm_push: ['wrists', 'shoulders', 'scapula', 'forearms'],
  straight_arm_pull: ['shoulders', 'elbows', 'forearms', 'lats', 'scapula'],
  ring_support: ['shoulders', 'elbows', 'scapula', 'wrists'],
  ring_strength: ['shoulders', 'elbows', 'scapula'],
  explosive_pull: ['elbows', 'shoulders', 'lats', 'forearms'],
  compression_core: ['hip_flexors', 'hamstrings', 'thoracic_spine'],
  vertical_pull: ['lats', 'shoulders', 'forearms', 'elbows'],
  horizontal_pull: ['lats', 'shoulders', 'scapula'],
  vertical_push: ['shoulders', 'elbows', 'wrists'],
  horizontal_push: ['shoulders', 'elbows', 'wrists'],
  dip_pattern: ['shoulders', 'elbows', 'wrists'],
  support_hold: ['shoulders', 'wrists', 'scapula'],
  planche_family: ['wrists', 'shoulders', 'scapula', 'forearms'],
  lever_family: ['shoulders', 'elbows', 'lats', 'forearms'],
  handstand_family: ['wrists', 'shoulders', 'thoracic_spine'],
  muscle_up_family: ['shoulders', 'elbows', 'lats'],
}

/**
 * Maps joint stress focus to recovery regions
 */
const JOINT_STRESS_TO_RECOVERY: Record<JointStressFocus, TargetRegion[]> = {
  wrist: ['wrists', 'forearms'],
  elbow: ['elbows', 'forearms'],
  shoulder: ['shoulders', 'scapula'],
  shoulder_tendon: ['shoulders', 'scapula', 'thoracic_spine'],
  scapular_tendon: ['scapula', 'shoulders', 'thoracic_spine'],
  hip_flexor: ['hip_flexors', 'hips', 'hamstrings'],
  bicep_tendon: ['elbows', 'forearms', 'shoulders'],
  sternum: ['thoracic_spine', 'shoulders'],
}

/**
 * Maps weak points to additional recovery emphasis
 */
const WEAK_POINT_TO_RECOVERY: Partial<Record<WeakPointType, TargetRegion[]>> = {
  scapular_control: ['scapula', 'thoracic_spine'],
  shoulder_stability: ['shoulders', 'scapula'],
  wrist_tolerance: ['wrists', 'forearms'],
  elbow_tolerance: ['elbows', 'forearms'],
  compression_strength: ['hip_flexors', 'hamstrings'],
  transition_control: ['shoulders', 'elbows'],
  pulling_power: ['lats', 'shoulders'],
  pushing_power: ['shoulders', 'wrists'],
}

// =============================================================================
// GENERATION FUNCTIONS
// =============================================================================

/**
 * Analyze completed session and determine recovery priorities
 */
export function analyzeSessionForRecovery(
  input: CoolDownGenerationInput
): { priorityRegions: TargetRegion[]; tendonEmphasis: boolean; reasonMap: Record<TargetRegion, string> } {
  const regionScores: Record<TargetRegion, number> = {
    wrists: 0,
    elbows: 0,
    forearms: 0,
    shoulders: 0,
    scapula: 0,
    thoracic_spine: 0,
    lats: 0,
    hips: 0,
    hip_flexors: 0,
    hamstrings: 0,
    ankles: 0,
    full_body: 0,
  }
  const reasonMap: Partial<Record<TargetRegion, string>> = {}
  let tendonEmphasis = false
  
  // Analyze completed exercises
  for (const exercise of input.completedExercises) {
    // Movement family mapping
    if (exercise.movementFamily && SESSION_STRESS_TO_RECOVERY[exercise.movementFamily]) {
      const regions = SESSION_STRESS_TO_RECOVERY[exercise.movementFamily]
      for (const region of regions) {
        regionScores[region] += exercise.setsCompleted
        if (!reasonMap[region]) {
          reasonMap[region] = `Recovery for ${exercise.movementFamily.replace(/_/g, ' ')} work`
        }
      }
    }
    
    // Joint stress mapping
    if (exercise.jointStress) {
      for (const [joint, level] of Object.entries(exercise.jointStress)) {
        const regions = JOINT_STRESS_TO_RECOVERY[joint as JointStressFocus]
        if (regions) {
          const multiplier = level === 'high' ? 3 : level === 'moderate' ? 2 : 1
          for (const region of regions) {
            regionScores[region] += multiplier
            if (level === 'high' && !reasonMap[region]) {
              reasonMap[region] = `High ${joint} stress this session`
            }
          }
        }
      }
    }
    
    // Tendon-heavy work increases tendon emphasis
    if (exercise.isTendonHeavy || exercise.isStraightArm) {
      tendonEmphasis = true
    }
  }
  
  // Add stress analysis data if available
  if (input.stressAnalysis) {
    for (const [family, stress] of Object.entries(input.stressAnalysis.stressByFamily || {})) {
      if (stress > 10 && SESSION_STRESS_TO_RECOVERY[family as SkillStressFocus]) {
        const regions = SESSION_STRESS_TO_RECOVERY[family as SkillStressFocus]
        for (const region of regions) {
          regionScores[region] += Math.floor(stress / 5)
        }
      }
    }
    
    if (input.stressAnalysis.tendonRiskLevel === 'high' || input.stressAnalysis.tendonRiskLevel === 'very_high') {
      tendonEmphasis = true
    }
  }
  
  // Add weak point emphasis
  for (const weakPoint of input.weakPoints || []) {
    const regions = WEAK_POINT_TO_RECOVERY[weakPoint]
    if (regions) {
      for (const region of regions) {
        regionScores[region] += 2
        if (!reasonMap[region]) {
          reasonMap[region] = `Supporting ${weakPoint.replace(/_/g, ' ')} recovery`
        }
      }
    }
  }
  
  // Recovery phase adjustments
  if (input.currentRecoveryPhase === 'tendon_recovery') {
    tendonEmphasis = true
    regionScores.shoulders += 3
    regionScores.elbows += 3
    regionScores.wrists += 2
  }
  
  // Always include breathing reset for high fatigue
  if (input.currentFatigueLevel === 'high' || input.currentFatigueLevel === 'very_high') {
    regionScores.full_body += 5
    reasonMap.full_body = 'Breathing reset for recovery after demanding session'
  }
  
  // Sort and get top regions
  const sortedRegions = Object.entries(regionScores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([region]) => region as TargetRegion)
  
  return {
    priorityRegions: sortedRegions.slice(0, 5),
    tendonEmphasis,
    reasonMap: reasonMap as Record<TargetRegion, string>,
  }
}

/**
 * Select recovery exercises based on priority regions
 */
export function selectRecoveryExercises(
  priorityRegions: TargetRegion[],
  options: {
    maxExercises: number
    maxDurationSeconds: number
    preferTendonRecovery: boolean
    isCompressed: boolean
  }
): RecoveryExercise[] {
  const selected: RecoveryExercise[] = []
  let totalDuration = 0
  const usedRegions = new Set<TargetRegion>()
  
  // Always try to include breathing reset if we have room
  const breathingReset = RECOVERY_EXERCISE_DATABASE.find(e => e.id === 'breathing_reset_90_90')
  
  // Filter and sort exercises
  const available = RECOVERY_EXERCISE_DATABASE
    .filter(ex => {
      const matchesRegion = priorityRegions.includes(ex.targetRegion) || ex.targetRegion === 'full_body'
      const matchesTendon = !options.preferTendonRecovery || ex.tendonFriendly
      return matchesRegion && matchesTendon
    })
    .sort((a, b) => {
      // Prioritize by region order, then by exercise priority
      const aRegionIndex = priorityRegions.indexOf(a.targetRegion)
      const bRegionIndex = priorityRegions.indexOf(b.targetRegion)
      
      if (aRegionIndex !== bRegionIndex) {
        if (aRegionIndex === -1) return 1
        if (bRegionIndex === -1) return -1
        return aRegionIndex - bRegionIndex
      }
      
      return b.priority - a.priority
    })
  
  // Select exercises
  for (const exercise of available) {
    if (selected.length >= options.maxExercises) break
    if (totalDuration + exercise.durationSeconds > options.maxDurationSeconds) continue
    
    // For compressed sessions, limit to one exercise per region
    if (options.isCompressed && usedRegions.has(exercise.targetRegion)) continue
    
    selected.push(exercise)
    usedRegions.add(exercise.targetRegion)
    totalDuration += exercise.durationSeconds
  }
  
  // Add breathing reset at the end if we have room
  if (breathingReset && !selected.includes(breathingReset) && totalDuration + 60 <= options.maxDurationSeconds) {
    selected.push(breathingReset)
  }
  
  return selected
}

/**
 * Generate intelligent cooldown based on session context
 */
export function generateIntelligentCooldown(input: CoolDownGenerationInput): IntelligentCoolDown {
  const { isShortSession, sessionDurationMinutes, maxCooldownMinutes } = input
  
  // Determine time budget
  const baseCooldownMinutes = isShortSession ? 2 : Math.min(5, Math.floor(sessionDurationMinutes * 0.08))
  const cooldownMinutes = maxCooldownMinutes ? Math.min(maxCooldownMinutes, baseCooldownMinutes) : baseCooldownMinutes
  const isCompressed = cooldownMinutes <= 3
  
  // Analyze session for recovery priorities
  const { priorityRegions, tendonEmphasis, reasonMap } = analyzeSessionForRecovery(input)
  
  // If no exercises completed, return minimal cooldown
  if (input.completedExercises.length === 0) {
    return {
      exercises: [],
      totalMinutes: 0,
      focusSummary: 'No exercises completed',
      regionSummary: [],
      coachingNote: 'Session was not completed, no cooldown needed.',
      tendonRecoveryIncluded: false,
      isCompressed: true,
      skipReason: 'No exercises were completed in this session.',
    }
  }
  
  // Select exercises
  const maxExercises = isCompressed ? 2 : 4
  const maxDuration = cooldownMinutes * 60
  
  const selectedExercises = selectRecoveryExercises(priorityRegions, {
    maxExercises,
    maxDurationSeconds: maxDuration,
    preferTendonRecovery: tendonEmphasis || input.preferTendonRecovery || false,
    isCompressed,
  })
  
  // Build exercise list with rationales
  const exercises: RecoveryExerciseWithRationale[] = selectedExercises.map(ex => ({
    exerciseId: ex.id,
    exerciseName: ex.name,
    instruction: ex.prescription + (ex.instruction ? ` — ${ex.instruction}` : ''),
    rationale: reasonMap[ex.targetRegion] || `Recovery for ${ex.targetRegion.replace(/_/g, ' ')}`,
    targetRegion: ex.targetRegion,
    priority: ex.priority >= 4 ? 'essential' : ex.priority >= 3 ? 'recommended' : 'optional',
    knowledgeBubble: ex.knowledgeBubble,
  }))
  
  // Calculate total time
  const totalSeconds = selectedExercises.reduce((sum, ex) => sum + ex.durationSeconds, 0)
  const totalMinutes = Math.ceil(totalSeconds / 60)
  
  // Generate summaries
  const uniqueRegions = [...new Set(selectedExercises.map(ex => ex.targetRegion))]
  const regionSummary = uniqueRegions.map(r => r.replace(/_/g, ' '))
  
  const focusSummary = generateFocusSummary(priorityRegions.slice(0, 2))
  const coachingNote = generateCoachingNote(input, tendonEmphasis, priorityRegions)
  
  return {
    exercises,
    totalMinutes,
    focusSummary,
    regionSummary,
    coachingNote,
    tendonRecoveryIncluded: tendonEmphasis,
    isCompressed,
  }
}

/**
 * Generate compressed cooldown for short sessions
 */
export function generateCompressedCooldown(input: CoolDownGenerationInput): IntelligentCoolDown {
  return generateIntelligentCooldown({
    ...input,
    isShortSession: true,
    maxCooldownMinutes: 3,
  })
}

// =============================================================================
// KNOWLEDGE BUBBLES & COACHING NOTES
// =============================================================================

function generateFocusSummary(topRegions: TargetRegion[]): string {
  if (topRegions.length === 0) return 'General Recovery'
  
  const regionNames = topRegions.map(r => r.replace(/_/g, ' ')).slice(0, 2)
  
  if (regionNames.length === 1) {
    return `${capitalize(regionNames[0])} Recovery`
  }
  
  return `${capitalize(regionNames[0])} & ${capitalize(regionNames[1])} Recovery`
}

function generateCoachingNote(
  input: CoolDownGenerationInput,
  tendonEmphasis: boolean,
  priorityRegions: TargetRegion[]
): string {
  const notes: string[] = []
  
  // Primary focus
  if (priorityRegions.length > 0) {
    const primary = priorityRegions[0].replace(/_/g, ' ')
    notes.push(`${capitalize(primary)} recovery was prioritized based on today's session.`)
  }
  
  // Tendon emphasis
  if (tendonEmphasis) {
    notes.push('Tendon-supportive exercises were included due to straight-arm or ring work.')
  }
  
  // Recovery phase context
  if (input.currentRecoveryPhase) {
    const phaseNames: Record<RecoveryPhaseType, string> = {
      light_deload: 'light recovery phase',
      tendon_recovery: 'tendon recovery phase',
      volume_reset: 'volume reset phase',
      technique_recovery: 'technique recovery phase',
      fatigue_management: 'fatigue management phase',
      plateau_break: 'plateau break phase',
    }
    notes.push(`Additional recovery emphasis added during your ${phaseNames[input.currentRecoveryPhase]}.`)
  }
  
  // High fatigue
  if (input.currentFatigueLevel === 'high' || input.currentFatigueLevel === 'very_high') {
    notes.push('Breathing reset included to support recovery after a demanding session.')
  }
  
  return notes.join(' ') || 'Quick recovery stretches targeting the areas worked today.'
}

/**
 * Get knowledge bubble for a specific recovery region
 */
export function getRecoveryKnowledgeBubble(region: TargetRegion): { shortTip: string; fullExplanation: string } {
  const bubbles: Record<TargetRegion, { shortTip: string; fullExplanation: string }> = {
    wrists: {
      shortTip: 'Wrist recovery prevents long-term issues',
      fullExplanation: 'Wrist mobility work after loading helps prevent tendon issues common in planche and handstand training.',
    },
    elbows: {
      shortTip: 'Elbow care supports pulling strength',
      fullExplanation: 'Elbow recovery is essential after straight-arm pulling to prevent tendinopathy.',
    },
    forearms: {
      shortTip: 'Forearm balance prevents grip issues',
      fullExplanation: 'Balancing forearm flexors and extensors after grip work helps prevent elbow problems.',
    },
    shoulders: {
      shortTip: 'Shoulder mobility supports all upper body work',
      fullExplanation: 'Maintaining shoulder range of motion helps performance and reduces injury risk.',
    },
    scapula: {
      shortTip: 'Scapular health underlies all shoulder function',
      fullExplanation: 'Scapular mobility and positioning directly affects pushing and pulling performance.',
    },
    thoracic_spine: {
      shortTip: 'Thoracic mobility affects overhead position',
      fullExplanation: 'Good thoracic extension is essential for handstands and overhead pressing.',
    },
    lats: {
      shortTip: 'Lat recovery supports pulling strength',
      fullExplanation: 'Releasing lat tension after pulling helps maintain overhead mobility.',
    },
    hips: {
      shortTip: 'Hip mobility supports compression skills',
      fullExplanation: 'Hip range of motion is foundational for L-sits, V-sits, and compression work.',
    },
    hip_flexors: {
      shortTip: 'Hip flexor recovery balances compression work',
      fullExplanation: 'Stretching hip flexors after compression training helps prevent excessive tightness.',
    },
    hamstrings: {
      shortTip: 'Hamstring flexibility supports pike and compression',
      fullExplanation: 'Hamstring length directly affects pike compression ability.',
    },
    ankles: {
      shortTip: 'Ankle mobility supports full squats',
      fullExplanation: 'Ankle range of motion affects squat depth and lower body positioning.',
    },
    full_body: {
      shortTip: 'Breathing resets the nervous system',
      fullExplanation: 'Deep breathing activates parasympathetic recovery, essential after intense training.',
    },
  }
  
  return bubbles[region]
}

/**
 * Generate coaching explanation for why this cooldown was recommended
 */
export function generateCooldownExplanation(cooldown: IntelligentCoolDown): string {
  if (cooldown.exercises.length === 0) {
    return cooldown.skipReason || 'No cooldown exercises were selected for this session.'
  }
  
  const regions = cooldown.regionSummary.slice(0, 2).join(' and ')
  const tendonNote = cooldown.tendonRecoveryIncluded ? ' with tendon-supportive emphasis' : ''
  const timeNote = cooldown.isCompressed ? 'A short' : 'A targeted'
  
  return `${timeNote} ${cooldown.totalMinutes}-minute cooldown focusing on ${regions}${tendonNote}. ${cooldown.coachingNote}`
}

// =============================================================================
// LOGGING INTEGRATION
// =============================================================================

/**
 * Create a log entry for cooldown tracking
 */
export function createCooldownLogEntry(
  athleteId: string,
  sessionId: string,
  cooldown: IntelligentCoolDown,
  completed: boolean
): CoolDownLogEntry {
  return {
    athleteId,
    sessionId,
    cooldownCompleted: completed,
    cooldownSkipped: !completed,
    exercisesShown: cooldown.exercises.map(ex => ex.exerciseId),
    targetRegionsRecommended: cooldown.exercises.map(ex => ex.targetRegion),
    dateLogged: new Date(),
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// =============================================================================
// EXPORTS
// =============================================================================
//
// [DUPLICATE-EXPORT-CONTRACT-FIX] All seven functions are exported inline
// at their declarations (lines 572, 686, 747, 819, 885, 943, 962). The
// previous bottom export block duplicated every name (TS2300/TS2484).
// Inline `export function` remains the single canonical export style;
// public API is unchanged.
